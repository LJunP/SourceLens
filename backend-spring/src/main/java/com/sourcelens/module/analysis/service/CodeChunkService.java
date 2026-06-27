package com.sourcelens.module.analysis.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.sourcelens.module.analysis.entity.CodeChunk;
import com.sourcelens.module.analysis.mapper.CodeChunkMapper;
import com.sourcelens.module.agent.entity.LlmConfig;
import com.sourcelens.module.agent.service.LlmClient;
import com.sourcelens.module.agent.service.LlmConfigService;
import com.sourcelens.module.scantask.entity.ScanTask;
import com.sourcelens.module.scantask.mapper.ScanTaskMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Stream;

@Slf4j
@Service
@RequiredArgsConstructor
public class CodeChunkService extends ServiceImpl<CodeChunkMapper, CodeChunk> {

    private final ScanTaskMapper scanTaskMapper;
    private final LlmConfigService llmConfigService;
    private final LlmClient llmClient;
    private final CodeChunkFileFilter fileFilter;

    private static final int BATCH_SIZE = 200;
    private static final int RETRIEVAL_CANDIDATE_LIMIT = 80;
    private static final int RETRIEVAL_FALLBACK_LIMIT = 20;
    private static final int SEARCH_MAX_LIMIT = 50;
    private static final int SEARCH_DEFAULT_LIMIT = 20;
    private static final int RANKING_CANDIDATE_MAX_LIMIT = 500;
    private static final int CONTEXT_ADJACENT_MAX_PER_SIDE = 2;
    private static final int CONTEXT_EXPANSION_MAX_CHUNKS = 12;

    @Autowired
    @Lazy
    private CodeChunkService self;


    /**
     * 对仓库代码文件进行切片并存入数据库
     * @param scanTaskId 扫描任务ID
     * @param repoPath 仓库路径
     */
    public void chunkAndSave(Long scanTaskId, String repoPath) {
        log.info("开始代码切片, scanTaskId={}, repoPath={}", scanTaskId, repoPath);

        // 1. 清理旧切片
        try {
            remove(new LambdaQueryWrapper<CodeChunk>().eq(CodeChunk::getScanTaskId, scanTaskId));
        } catch (Exception e) {
            log.warn("清理旧切片失败: {}", e.getMessage());
        }

        File repoDir = new File(repoPath);
        if (!repoDir.exists() || !repoDir.isDirectory()) {
            log.error("仓库路径不存在或不是目录: {}", repoPath);
            return;
        }

        String canonicalRepoPath;
        try {
            canonicalRepoPath = repoDir.getCanonicalPath();
        } catch (IOException e) {
            log.error("获取仓库规范路径失败: {}", repoPath, e);
            return;
        }

        Map<String, String> reusableEmbeddings = loadReusableEmbeddings(scanTaskId);

        // 2. 遍历并切片
        List<CodeChunk> chunksToSave = new ArrayList<>();
        Path repoRoot = repoDir.toPath();
        try (Stream<Path> walk = Files.walk(repoRoot)) {
            walk.filter(Files::isRegularFile)
                .filter(path -> fileFilter.shouldInclude(repoRoot, path))
                .forEach(path -> {
                    try {
                        File file = path.toFile();
                        String canonicalPath = file.getCanonicalPath();
                        
                        // 沙箱安全：确保文件在 repoPath 下面
                        if (!canonicalPath.startsWith(canonicalRepoPath)) {
                            log.warn("沙箱安全检查未通过，忽略文件: {}", canonicalPath);
                            return;
                        }

                        // 读取行 (采用编码异常容错逻辑)
                        List<String> lines;
                        try {
                            lines = Files.readAllLines(path, StandardCharsets.UTF_8);
                        } catch (IOException ex) {
                            log.warn("UTF-8 读取失败，尝试强制 UTF-8 容错读取: {}", path);
                            byte[] bytes = Files.readAllBytes(path);
                            String raw = new String(bytes, StandardCharsets.UTF_8);
                            lines = List.of(raw.split("\n", -1));
                        }
                        String relPath = repoDir.toPath().relativize(path).toString();
                        
                        sliceAndCollect(scanTaskId, relPath, lines, reusableEmbeddings, chunksToSave);
                    } catch (Exception e) {
                        log.warn("读取或切片文件失败，忽略: {}, error={}", path, e.getMessage());
                    }
                });
        } catch (Exception e) {
            log.error("遍历文件切片发生异常", e);
        }

        // 3. 批量写入：使用明确的多行 INSERT，避免非事务 saveBatch 退化成大量单条 SQL。
        if (!chunksToSave.isEmpty()) {
            log.info("开始保存切片，总片数: {}", chunksToSave.size());
            insertChunks(chunksToSave);
            log.info("保存切片完成, scanTaskId={}", scanTaskId);

            // 4. 触发异步向量化计算
            try {
                ScanTask task = scanTaskMapper.selectById(scanTaskId);
                Long userId = (task != null) ? task.getCreatedBy() : 1L;
                self.asyncEmbedding(scanTaskId, userId);
            } catch (Exception e) {
                log.warn("触发异步向量化失败: {}", e.getMessage());
            }
        } else {
            log.info("没有生成任何代码切片, scanTaskId={}", scanTaskId);
        }
    }

    private void insertChunks(List<CodeChunk> chunks) {
        for (int i = 0; i < chunks.size(); i += BATCH_SIZE) {
            int end = Math.min(i + BATCH_SIZE, chunks.size());
            baseMapper.insertBatch(chunks.subList(i, end));
        }
    }

    /**
     * 异步为切片计算向量
     */
    @Async("scanTaskExecutor")
    public void asyncEmbedding(Long scanTaskId, Long userId) {
        log.info("开始异步计算代码切片向量, scanTaskId={}, userId={}", scanTaskId, userId);
        LlmConfig activeConfig = llmConfigService.getActiveConfig(userId);
        if (activeConfig == null) {
            log.warn("未找到已激活的大模型配置，跳过向量化");
            return;
        }

        List<CodeChunk> pending = list(
                new LambdaQueryWrapper<CodeChunk>()
                        .eq(CodeChunk::getScanTaskId, scanTaskId)
                        .isNull(CodeChunk::getEmbedding)
        );

        if (pending.isEmpty()) {
            log.info("没有需要向量化的切片, scanTaskId={}", scanTaskId);
            return;
        }

        log.info("待计算向量切片数: {}", pending.size());
        int successCount = 0;
        int batchSize = 50;

        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();

        for (int i = 0; i < pending.size(); i += batchSize) {
            int end = Math.min(i + batchSize, pending.size());
            List<CodeChunk> subList = pending.subList(i, end);
            List<String> contents = new ArrayList<>();
            for (CodeChunk c : subList) {
                contents.add(c.getContent());
            }

            try {
                List<List<Float>> embeddings = llmClient.getEmbeddings(activeConfig, contents);
                List<CodeChunk> toUpdate = new ArrayList<>();

                for (int j = 0; j < subList.size(); j++) {
                    if (j < embeddings.size()) {
                        List<Float> emb = embeddings.get(j);
                        if (emb != null && !emb.isEmpty()) {
                            CodeChunk chunk = subList.get(j);
                            chunk.setEmbedding(mapper.writeValueAsString(emb));
                            toUpdate.add(chunk);
                            successCount++;
                        }
                    }
                }

                if (!toUpdate.isEmpty()) {
                    updateBatchById(toUpdate);
                }

                Thread.sleep(200);
            } catch (Exception e) {
                log.warn("切片批次向量化失败 ({} 到 {}): {}，将退化单条重试", i, end - 1, e.getMessage());
                for (CodeChunk chunk : subList) {
                    try {
                        List<Float> embedding = llmClient.getEmbedding(activeConfig, chunk.getContent());
                        if (embedding != null && !embedding.isEmpty()) {
                            chunk.setEmbedding(mapper.writeValueAsString(embedding));
                            updateById(chunk);
                            successCount++;
                        }
                        Thread.sleep(50);
                    } catch (Exception ex) {
                        log.warn("退化单条切片 {} (文件: {}) 向量化失败: {}", chunk.getId(), chunk.getFilePath(), ex.getMessage());
                    }
                }
            }
        }

        log.info("异步切片向量计算完成, scanTaskId={}, 成功={}/{}", scanTaskId, successCount, pending.size());
    }

    private void sliceAndCollect(Long scanTaskId,
                                 String relPath,
                                 List<String> lines,
                                 Map<String, String> reusableEmbeddings,
                                 List<CodeChunk> collector) {
        int totalLines = lines.size();
        if (totalLines == 0) {
            return;
        }

        int chunkSize = 50;
        int overlap = 10;
        int start = 0;

        while (start < totalLines) {
            int end = Math.min(start + chunkSize, totalLines);
            List<String> subList = lines.subList(start, end);
            String content = String.join("\n", subList);
            String hash = sha256Hex(content);

            CodeChunk chunk = CodeChunk.builder()
                    .scanTaskId(scanTaskId)
                    .filePath(relPath)
                    .content(content)
                    .startLine(start + 1)
                    .endLine(end)
                    .contentHash(hash)
                    .embedding(reusableEmbeddings.get(hash))
                    .build();
            collector.add(chunk);

            if (end == totalLines) {
                break;
            }
            start += (chunkSize - overlap);
            if (chunkSize - overlap <= 0) {
                break;
            }
        }
    }

    public List<CodeChunk> listByScanTaskId(Long scanTaskId) {
        return list(new LambdaQueryWrapper<CodeChunk>().eq(CodeChunk::getScanTaskId, scanTaskId));
    }

    public long countChunks(Long scanTaskId) {
        return count(new LambdaQueryWrapper<CodeChunk>()
                .eq(CodeChunk::getScanTaskId, scanTaskId));
    }

    public long countEmbeddedChunks(Long scanTaskId) {
        return count(new LambdaQueryWrapper<CodeChunk>()
                .eq(CodeChunk::getScanTaskId, scanTaskId)
                .isNotNull(CodeChunk::getEmbedding)
                .ne(CodeChunk::getEmbedding, ""));
    }

    public long countSearchMatches(Long scanTaskId, String queryText) {
        String[] keywords = CodeChunkRanker.tokenize(queryText);
        if (keywords.length == 0) {
            return countChunks(scanTaskId);
        }
        return count(buildKeywordSearchWrapper(scanTaskId, keywords));
    }

    public List<CodeChunk> listRetrievalCandidates(Long scanTaskId, String question) {
        String[] keywords = CodeChunkRanker.tokenize(question);
        if (keywords.length == 0) {
            return list(new LambdaQueryWrapper<CodeChunk>()
                    .eq(CodeChunk::getScanTaskId, scanTaskId)
                    .orderByAsc(CodeChunk::getId)
                    .last("LIMIT " + RETRIEVAL_FALLBACK_LIMIT));
        }

        LambdaQueryWrapper<CodeChunk> query = buildKeywordSearchWrapper(scanTaskId, keywords)
                .orderByAsc(CodeChunk::getId)
                .last("LIMIT " + rankingCandidateLimit(RETRIEVAL_CANDIDATE_LIMIT));
        List<CodeChunk> candidates = list(query);
        if (candidates == null || candidates.isEmpty()) {
            List<CodeChunk> embeddedCandidates = list(new LambdaQueryWrapper<CodeChunk>()
                    .eq(CodeChunk::getScanTaskId, scanTaskId)
                    .isNotNull(CodeChunk::getEmbedding)
                    .ne(CodeChunk::getEmbedding, "")
                    .orderByAsc(CodeChunk::getId)
                    .last("LIMIT " + RETRIEVAL_CANDIDATE_LIMIT));
            if (embeddedCandidates != null && !embeddedCandidates.isEmpty()) {
                return embeddedCandidates;
            }
            return listStableFallbackChunks(scanTaskId);
        }
        return CodeChunkRanker.rank(candidates, question, RETRIEVAL_CANDIDATE_LIMIT);
    }

    public List<CodeChunk> searchChunks(Long scanTaskId, String queryText, Integer limit) {
        int safeLimit = normalizeSearchLimit(limit);
        String[] keywords = CodeChunkRanker.tokenize(queryText);
        if (keywords.length == 0) {
            return list(new LambdaQueryWrapper<CodeChunk>()
                    .eq(CodeChunk::getScanTaskId, scanTaskId)
                    .orderByAsc(CodeChunk::getId)
                    .last("LIMIT " + safeLimit));
        }

        List<CodeChunk> candidates = list(buildKeywordSearchWrapper(scanTaskId, keywords)
                .orderByAsc(CodeChunk::getId)
                .orderByAsc(CodeChunk::getStartLine)
                .last("LIMIT " + rankingCandidateLimit(safeLimit)));
        return CodeChunkRanker.rank(candidates, queryText, safeLimit);
    }

    public List<CodeChunk> expandWithAdjacentChunks(Long scanTaskId,
                                                    List<CodeChunk> selectedChunks,
                                                    int adjacentPerSide,
                                                    int maxChunks) {
        if (selectedChunks == null || selectedChunks.isEmpty()) {
            return List.of();
        }
        int safeAdjacent = Math.min(Math.max(adjacentPerSide, 0), CONTEXT_ADJACENT_MAX_PER_SIDE);
        int safeMaxChunks = Math.min(Math.max(maxChunks, selectedChunks.size()), CONTEXT_EXPANSION_MAX_CHUNKS);
        LinkedHashMap<String, CodeChunk> expanded = new LinkedHashMap<>();

        for (CodeChunk chunk : selectedChunks) {
            addChunk(expanded, chunk, safeMaxChunks);
            if (safeAdjacent <= 0 || expanded.size() >= safeMaxChunks || !canQueryAdjacent(scanTaskId, chunk)) {
                continue;
            }

            List<CodeChunk> previous = list(new LambdaQueryWrapper<CodeChunk>()
                    .eq(CodeChunk::getScanTaskId, scanTaskId)
                    .eq(CodeChunk::getFilePath, chunk.getFilePath())
                    .lt(CodeChunk::getStartLine, chunk.getStartLine())
                    .orderByDesc(CodeChunk::getStartLine)
                    .last("LIMIT " + safeAdjacent));
            if (previous != null && !previous.isEmpty()) {
                Collections.reverse(previous);
                for (CodeChunk adjacent : previous) {
                    addChunk(expanded, adjacent, safeMaxChunks);
                }
            }

            if (expanded.size() >= safeMaxChunks) {
                continue;
            }
            List<CodeChunk> next = list(new LambdaQueryWrapper<CodeChunk>()
                    .eq(CodeChunk::getScanTaskId, scanTaskId)
                    .eq(CodeChunk::getFilePath, chunk.getFilePath())
                    .gt(CodeChunk::getStartLine, chunk.getStartLine())
                    .orderByAsc(CodeChunk::getStartLine)
                    .last("LIMIT " + safeAdjacent));
            if (next != null) {
                for (CodeChunk adjacent : next) {
                    addChunk(expanded, adjacent, safeMaxChunks);
                }
            }
        }

        return new ArrayList<>(expanded.values());
    }

    public List<String> matchedTerms(CodeChunk chunk, String queryText) {
        return CodeChunkRanker.matchedTerms(chunk, queryText);
    }

    private boolean canQueryAdjacent(Long scanTaskId, CodeChunk chunk) {
        return scanTaskId != null
                && chunk != null
                && chunk.getFilePath() != null
                && !chunk.getFilePath().isBlank()
                && chunk.getStartLine() != null;
    }

    private void addChunk(LinkedHashMap<String, CodeChunk> chunks, CodeChunk chunk, int maxChunks) {
        if (chunk == null || chunks.size() >= maxChunks) {
            return;
        }
        chunks.putIfAbsent(chunkKey(chunk), chunk);
    }

    private String chunkKey(CodeChunk chunk) {
        if (chunk.getId() != null) {
            return "id:" + chunk.getId();
        }
        return "range:" + (chunk.getScanTaskId() == null ? "" : chunk.getScanTaskId())
                + ":" + (chunk.getFilePath() == null ? "" : chunk.getFilePath())
                + ":" + (chunk.getStartLine() == null ? "" : chunk.getStartLine())
                + ":" + (chunk.getEndLine() == null ? "" : chunk.getEndLine());
    }

    private List<CodeChunk> listStableFallbackChunks(Long scanTaskId) {
        return list(new LambdaQueryWrapper<CodeChunk>()
                .eq(CodeChunk::getScanTaskId, scanTaskId)
                .orderByAsc(CodeChunk::getId)
                .last("LIMIT " + RETRIEVAL_FALLBACK_LIMIT));
    }

    private Map<String, String> loadReusableEmbeddings(Long scanTaskId) {
        ScanTask currentTask = scanTaskMapper.selectById(scanTaskId);
        if (currentTask == null || currentTask.getRepositoryId() == null) {
            return Map.of();
        }

        List<ScanTask> previousTasks = scanTaskMapper.selectList(
                new LambdaQueryWrapper<ScanTask>()
                        .eq(ScanTask::getRepositoryId, currentTask.getRepositoryId())
                        .ne(ScanTask::getId, scanTaskId)
                        .eq(ScanTask::getStatus, "SUCCESS")
                        .eq(ScanTask::getDeleted, false)
                        .orderByDesc(ScanTask::getFinishedAt)
                        .orderByDesc(ScanTask::getId)
                        .last("LIMIT 5"));
        if (previousTasks == null || previousTasks.isEmpty()) {
            return Map.of();
        }

        List<Long> previousTaskIds = previousTasks.stream()
                .map(ScanTask::getId)
                .filter(Objects::nonNull)
                .toList();
        if (previousTaskIds.isEmpty()) {
            return Map.of();
        }

        List<CodeChunk> previousChunks = list(
                new LambdaQueryWrapper<CodeChunk>()
                        .in(CodeChunk::getScanTaskId, previousTaskIds)
                        .isNotNull(CodeChunk::getContentHash)
                        .isNotNull(CodeChunk::getEmbedding));

        Map<String, String> reusable = new HashMap<>();
        for (CodeChunk chunk : previousChunks) {
            reusable.putIfAbsent(chunk.getContentHash(), chunk.getEmbedding());
        }
        log.info("可复用切片向量数: {}, scanTaskId={}", reusable.size(), scanTaskId);
        return reusable;
    }

    private String sha256Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            return "";
        }
    }

    public int normalizeSearchLimit(Integer limit) {
        if (limit == null) {
            return SEARCH_DEFAULT_LIMIT;
        }
        return Math.min(Math.max(limit, 1), SEARCH_MAX_LIMIT);
    }

    private int rankingCandidateLimit(int resultLimit) {
        return Math.min(Math.max(resultLimit * 20, 200), RANKING_CANDIDATE_MAX_LIMIT);
    }

    private LambdaQueryWrapper<CodeChunk> buildKeywordSearchWrapper(Long scanTaskId, String[] keywords) {
        return new LambdaQueryWrapper<CodeChunk>()
                .eq(CodeChunk::getScanTaskId, scanTaskId)
                .and(wrapper -> {
                    boolean first = true;
                    for (String keyword : keywords) {
                        if (first) {
                            wrapper.like(CodeChunk::getFilePath, keyword)
                                    .or()
                                    .like(CodeChunk::getContent, keyword);
                            first = false;
                        } else {
                            wrapper.or(nested -> nested
                                    .like(CodeChunk::getFilePath, keyword)
                                    .or()
                                    .like(CodeChunk::getContent, keyword));
                        }
                    }
                });
    }

}
