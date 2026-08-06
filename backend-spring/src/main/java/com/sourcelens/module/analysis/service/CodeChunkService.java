package com.sourcelens.module.analysis.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.sourcelens.module.analysis.dto.CodeChunkStatusCounts;
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
import java.nio.file.FileVisitResult;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.attribute.BasicFileAttributes;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

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
    private static final int SEMANTIC_RETRIEVAL_CANDIDATE_LIMIT = 500;
    private static final int SEMANTIC_RETRIEVAL_DISTRIBUTED_WINDOWS = 5;
    private static final int REPRESENTATIVE_FALLBACK_QUERY_LIMIT = 80;
    private static final int PREVIOUS_CONTEXT_SEED_LIMIT = 32;
    private static final int PREVIOUS_CONTEXT_WINDOW_PER_SEED = 3;
    private static final int CONTEXT_ADJACENT_MAX_PER_SIDE = 2;
    private static final int CONTEXT_EXPANSION_MAX_CHUNKS = 12;
    private static final Set<String> WORKSPACE_MANIFEST_FILE_NAMES = Set.of(
            "package.json",
            "pnpm-workspace.yaml",
            "yarn.lock",
            "pom.xml",
            "build.gradle",
            "build.gradle.kts",
            "settings.gradle",
            "settings.gradle.kts",
            "Cargo.toml",
            "go.mod",
            "pyproject.toml",
            "requirements.txt"
    );
    private static final Set<String> MODULE_ROOT_PARENT_SEGMENTS = Set.of(
            "apps",
            "packages",
            "services",
            "modules",
            "libs"
    );

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

        if (scanTaskId == null) {
            throw new IllegalArgumentException("扫描任务ID不能为空");
        }

        if (repoPath == null || repoPath.isBlank()) {
            throw new IllegalArgumentException("仓库路径不能为空");
        }
        File repoDir = new File(repoPath);
        if (!repoDir.exists() || !repoDir.isDirectory()) {
            log.error("仓库路径不存在或不是目录: {}", repoPath);
            throw new IllegalArgumentException("仓库路径不存在或不是目录: " + repoPath);
        }

        Path realRepoPath;
        try {
            realRepoPath = repoDir.toPath().toRealPath();
        } catch (IOException e) {
            log.error("获取仓库规范路径失败: {}", repoPath, e);
            throw new IllegalStateException("获取仓库规范路径失败", e);
        }

        // 1. 清理旧切片
        try {
            remove(new LambdaQueryWrapper<CodeChunk>().eq(CodeChunk::getScanTaskId, scanTaskId));
        } catch (Exception e) {
            log.error("清理旧切片失败, scanTaskId={}", scanTaskId, e);
            throw new IllegalStateException("清理旧切片失败", e);
        }

        ScanTask task = scanTaskMapper.selectById(scanTaskId);
        Long userId = (task != null && task.getCreatedBy() != null) ? task.getCreatedBy() : 1L;
        LlmConfig activeConfig = loadActiveConfig(userId);
        String embeddingModelKey = embeddingModelKey(activeConfig);
        Map<String, String> reusableEmbeddings = loadReusableEmbeddings(scanTaskId, embeddingModelKey);

        // 2. 遍历、切片并按批次落库，避免大型仓库把全部切片长期堆在内存中。
        List<CodeChunk> chunkBuffer = new ArrayList<>(BATCH_SIZE);
        int[] totalChunkCount = {0};
        boolean[] missingEmbeddings = {false};
        Path repoRoot = repoDir.toPath();
        WorkspaceRootIndex workspaceRootIndex = WorkspaceRootIndex.from(repoRoot);
        try {
            visitIncludedSourceFiles(repoRoot, fileFilter, path -> {
                try {
                    Path realPath = path.toRealPath();

                    // 沙箱安全：确保文件在 repoPath 下面
                    if (!realPath.startsWith(realRepoPath)) {
                        log.warn("沙箱安全检查未通过，忽略文件: {}", realPath);
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

                    int beforeSize = chunkBuffer.size();
                    sliceAndCollect(scanTaskId, relPath, lines, reusableEmbeddings, embeddingModelKey, workspaceRootIndex, chunkBuffer);
                    int added = chunkBuffer.size() - beforeSize;
                    if (added > 0) {
                        totalChunkCount[0] += added;
                        if (!missingEmbeddings[0] && hasMissingEmbeddings(chunkBuffer.subList(beforeSize, chunkBuffer.size()))) {
                            missingEmbeddings[0] = true;
                        }
                    }
                } catch (Exception e) {
                    log.warn("读取或切片文件失败，忽略: {}, error={}", path, e.getMessage());
                    return;
                }
                try {
                    flushFullChunkBatches(chunkBuffer);
                } catch (RuntimeException e) {
                    throw new ChunkBatchFlushException("批量保存切片失败: " + e.getMessage(), e);
                }
            });
        } catch (ChunkBatchFlushException e) {
            cleanupChunksAfterFailedSave(scanTaskId, e);
            throw e;
        } catch (Exception e) {
            log.error("遍历文件切片发生异常", e);
            IllegalStateException failure = new IllegalStateException("遍历文件切片发生异常", e);
            cleanupChunksAfterFailedSave(scanTaskId, failure);
            throw failure;
        }

        // 3. 收尾写入：遍历过程中已按 BATCH_SIZE flush，剩余不足一批的切片在这里落库。
        try {
            flushRemainingChunks(chunkBuffer);
        } catch (RuntimeException e) {
            cleanupChunksAfterFailedSave(scanTaskId, e);
            throw e;
        }
        if (totalChunkCount[0] > 0) {
            log.info("保存切片完成, scanTaskId={}, 总片数={}", scanTaskId, totalChunkCount[0]);

            // 4. 触发异步向量化计算；全部复用成功时不再重复调用 embedding provider。
            if (missingEmbeddings[0]) {
                try {
                    self.asyncEmbedding(scanTaskId, userId);
                } catch (Exception e) {
                    log.warn("触发异步向量化失败: {}", e.getMessage());
                }
            } else {
                log.info("所有切片已复用同模型向量，跳过异步向量化, scanTaskId={}", scanTaskId);
            }
        } else {
            log.info("没有生成任何代码切片, scanTaskId={}", scanTaskId);
        }
    }

    private void cleanupChunksAfterFailedSave(Long scanTaskId, RuntimeException failure) {
        try {
            remove(new LambdaQueryWrapper<CodeChunk>().eq(CodeChunk::getScanTaskId, scanTaskId));
        } catch (Exception cleanupError) {
            log.error("清理失败切片失败, scanTaskId={}", scanTaskId, cleanupError);
            failure.addSuppressed(cleanupError);
        }
    }

    private void flushFullChunkBatches(List<CodeChunk> chunks) {
        while (chunks.size() >= BATCH_SIZE) {
            List<CodeChunk> batch = new ArrayList<>(chunks.subList(0, BATCH_SIZE));
            baseMapper.insertBatch(batch);
            chunks.subList(0, BATCH_SIZE).clear();
        }
    }

    private void flushRemainingChunks(List<CodeChunk> chunks) {
        if (!chunks.isEmpty()) {
            baseMapper.insertBatch(new ArrayList<>(chunks));
            chunks.clear();
        }
    }

    static List<Path> walkIncludedSourceFiles(Path repoRoot, CodeChunkFileFilter fileFilter) throws IOException {
        List<Path> files = new ArrayList<>();
        visitIncludedSourceFiles(repoRoot, fileFilter, path -> files.add(path));
        return files;
    }

    static void visitIncludedSourceFiles(Path repoRoot,
                                         CodeChunkFileFilter fileFilter,
                                         IncludedSourceFileVisitor visitor) throws IOException {
        if (repoRoot == null || fileFilter == null || visitor == null || !Files.isDirectory(repoRoot)) {
            return;
        }
        Files.walkFileTree(repoRoot, new SimpleFileVisitor<>() {
            @Override
            public FileVisitResult preVisitDirectory(Path dir, BasicFileAttributes attrs) {
                if (!repoRoot.equals(dir) && CodeChunkFileFilter.isSkippedDirectoryName(dir.getFileName().toString())) {
                    return FileVisitResult.SKIP_SUBTREE;
                }
                return FileVisitResult.CONTINUE;
            }

            @Override
            public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) {
                if (attrs != null
                        && attrs.isRegularFile()
                        && fileFilter.shouldInclude(repoRoot, file)) {
                    visitor.visit(file);
                }
                return FileVisitResult.CONTINUE;
            }

            @Override
            public FileVisitResult visitFileFailed(Path file, IOException exc) {
                log.warn("遍历代码文件失败，忽略: {}, error={}", file, exc.getMessage());
                return FileVisitResult.CONTINUE;
            }
        });
    }

    @FunctionalInterface
    interface IncludedSourceFileVisitor {
        void visit(Path path);
    }

    static class ChunkBatchFlushException extends RuntimeException {
        ChunkBatchFlushException(String message, Throwable cause) {
            super(message, cause);
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
        String embeddingModelKey = embeddingModelKey(activeConfig);

        List<CodeChunk> pending = list(
                new LambdaQueryWrapper<CodeChunk>()
                        .eq(CodeChunk::getScanTaskId, scanTaskId)
                        .and(wrapper -> wrapper
                                .isNull(CodeChunk::getEmbedding)
                                .or()
                                .eq(CodeChunk::getEmbedding, "")
                                .or()
                                .isNull(CodeChunk::getEmbeddingModel)
                                .or()
                                .ne(CodeChunk::getEmbeddingModel, embeddingModelKey))
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
                            chunk.setEmbeddingModel(embeddingModelKey);
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
                            chunk.setEmbeddingModel(embeddingModelKey);
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
                                 String embeddingModelKey,
                                 WorkspaceRootIndex workspaceRootIndex,
                                 List<CodeChunk> collector) {
        int totalLines = lines.size();
        if (totalLines == 0) {
            return;
        }
        CodeChunkRootMetadata rootMetadata = rootMetadataForPath(relPath, workspaceRootIndex);

        int chunkSize = 50;
        int overlap = 10;
        int start = 0;

        while (start < totalLines) {
            int end = Math.min(start + chunkSize, totalLines);
            List<String> subList = lines.subList(start, end);
            String content = String.join("\n", subList);
            String hash = sha256Hex(content);
            String reusableEmbedding = reusableEmbeddings.get(hash);

            CodeChunk chunk = CodeChunk.builder()
                    .scanTaskId(scanTaskId)
                    .filePath(relPath)
                    .workspaceRoot(rootMetadata.workspaceRoot())
                    .moduleRoot(rootMetadata.moduleRoot())
                    .content(content)
                    .startLine(start + 1)
                    .endLine(end)
                    .contentHash(hash)
                    .embedding(reusableEmbedding)
                    .embeddingModel(reusableEmbedding == null ? null : embeddingModelKey)
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

    static CodeChunkRootMetadata rootMetadataForPath(String relPath, WorkspaceRootIndex workspaceRootIndex) {
        String normalizedPath = normalizeRelativePath(relPath);
        if (normalizedPath.isBlank()) {
            return new CodeChunkRootMetadata(null, null);
        }
        String workspaceRoot = workspaceRootIndex == null ? "" : workspaceRootIndex.nearestRootForPath(normalizedPath);
        String moduleRoot = moduleRootFromPath(normalizedPath);
        if (moduleRoot.isBlank()) {
            moduleRoot = workspaceRoot;
        }
        return new CodeChunkRootMetadata(blankToNull(workspaceRoot), blankToNull(moduleRoot));
    }

    static String moduleRootFromPath(String relPath) {
        String normalizedPath = normalizeRelativePath(relPath);
        if (normalizedPath.isBlank()) {
            return "";
        }
        String[] segments = normalizedPath.split("/");
        if (segments.length < 2) {
            return "";
        }
        String parent = segments[0] == null ? "" : segments[0].toLowerCase(Locale.ROOT);
        String name = segments[1] == null ? "" : segments[1].toLowerCase(Locale.ROOT);
        if (MODULE_ROOT_PARENT_SEGMENTS.contains(parent) && name.matches("[a-z0-9][a-z0-9._-]{0,119}")) {
            return parent + "/" + name;
        }
        return "";
    }

    private static String normalizeRelativePath(String relPath) {
        if (relPath == null || relPath.isBlank()) {
            return "";
        }
        return relPath.trim()
                .replace('\\', '/')
                .replaceAll("^/+", "")
                .replaceAll("/+", "/");
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    record CodeChunkRootMetadata(String workspaceRoot, String moduleRoot) {
    }

    record WorkspaceRootIndex(List<String> roots) {

        static WorkspaceRootIndex from(Path repoRoot) {
            if (repoRoot == null || !Files.isDirectory(repoRoot)) {
                return new WorkspaceRootIndex(List.of());
            }
            List<String> roots = new ArrayList<>();
            try {
                Files.walkFileTree(repoRoot, new SimpleFileVisitor<>() {
                    @Override
                    public FileVisitResult preVisitDirectory(Path dir, BasicFileAttributes attrs) {
                        if (!repoRoot.equals(dir) && CodeChunkFileFilter.isSkippedDirectoryName(dir.getFileName().toString())) {
                            return FileVisitResult.SKIP_SUBTREE;
                        }
                        return FileVisitResult.CONTINUE;
                    }

                    @Override
                    public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) {
                        if (attrs != null
                                && attrs.isRegularFile()
                                && WORKSPACE_MANIFEST_FILE_NAMES.contains(file.getFileName().toString())) {
                            roots.add(normalizeRelativePath(repoRoot.relativize(file.getParent()).toString()));
                        }
                        return FileVisitResult.CONTINUE;
                    }
                });
                roots.removeIf(String::isBlank);
                roots.sort(Comparator.comparingInt(String::length).reversed());
                List<String> distinctRoots = roots.stream().distinct().toList();
                roots.clear();
                roots.addAll(distinctRoots);
            } catch (IOException e) {
                log.warn("扫描 workspace manifest 失败，跳过 code_chunks root metadata: {}", e.getMessage());
            }
            return new WorkspaceRootIndex(List.copyOf(roots));
        }

        String nearestRootForPath(String relPath) {
            String normalizedPath = normalizeRelativePath(relPath);
            if (normalizedPath.isBlank() || roots == null || roots.isEmpty()) {
                return "";
            }
            for (String root : roots) {
                if (normalizedPath.equals(root) || normalizedPath.startsWith(root + "/")) {
                    return root;
                }
            }
            return "";
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
                .isNotNull(CodeChunk::getEmbeddingModel)
                .ne(CodeChunk::getEmbeddingModel, ""));
    }

    public long countEmbeddedChunks(Long scanTaskId, String embeddingModelKey) {
        if (embeddingModelKey == null || embeddingModelKey.isBlank()) {
            return countEmbeddedChunks(scanTaskId);
        }
        return count(new LambdaQueryWrapper<CodeChunk>()
                .eq(CodeChunk::getScanTaskId, scanTaskId)
                .isNotNull(CodeChunk::getEmbedding)
                .ne(CodeChunk::getEmbedding, "")
                .eq(CodeChunk::getEmbeddingModel, embeddingModelKey));
    }

    public long countSearchMatches(Long scanTaskId, String queryText) {
        String[] keywords = CodeChunkRanker.tokenize(queryText);
        if (keywords.length == 0) {
            return countChunks(scanTaskId);
        }
        if (hasAuxiliarySearchHints(queryText)) {
            return listSearchCandidates(scanTaskId, queryText, SEARCH_MAX_LIMIT, false).stream()
                    .map(this::chunkKey)
                    .distinct()
                    .count();
        }
        return count(buildKeywordSearchWrapper(scanTaskId, keywords));
    }

    public CodeChunkStatusCounts getStatusCounts(Long scanTaskId) {
        CodeChunkStatusCounts counts = baseMapper.selectStatusCounts(scanTaskId);
        if (counts == null) {
            counts = new CodeChunkStatusCounts();
        }
        counts.setTotalChunks(counts.getTotalChunks() == null ? 0L : counts.getTotalChunks());
        counts.setEmbeddedChunks(counts.getEmbeddedChunks() == null ? 0L : counts.getEmbeddedChunks());
        return counts;
    }

    public CodeChunk getStatusSample(Long scanTaskId) {
        return baseMapper.selectStatusSample(scanTaskId);
    }

    public List<CodeChunk> listRetrievalCandidates(Long scanTaskId, String question) {
        String[] keywords = CodeChunkRanker.tokenize(question);
        if (keywords.length == 0) {
            return listStableFallbackChunks(scanTaskId, question);
        }

        LambdaQueryWrapper<CodeChunk> query = buildKeywordSearchWrapper(scanTaskId, keywords)
                .orderByAsc(CodeChunk::getId)
                .last("LIMIT " + rankingCandidateLimit(RETRIEVAL_CANDIDATE_LIMIT));
        List<CodeChunk> keywordCandidates = list(query);
        List<CodeChunk> candidates = keywordCandidates;
        candidates = mergeCandidates(candidates, listRoleIntentCandidates(scanTaskId, question, RETRIEVAL_CANDIDATE_LIMIT));
        candidates = mergeCandidates(candidates, listPathSuffixHintCandidates(scanTaskId, question, RETRIEVAL_CANDIDATE_LIMIT));
        candidates = mergeCandidates(candidates, listMethodAnchorCandidates(scanTaskId, question, RETRIEVAL_CANDIDATE_LIMIT));
        candidates = mergeCandidates(candidates, listEvidenceFilePathAnchorCandidates(scanTaskId, question, RETRIEVAL_CANDIDATE_LIMIT));
        candidates = mergeCandidates(candidates, listEndpointRouteCandidates(scanTaskId, question, RETRIEVAL_CANDIDATE_LIMIT));
        candidates = mergeCandidates(candidates, listPreviousSameFileContextCandidates(
                scanTaskId,
                question,
                candidates,
                RETRIEVAL_CANDIDATE_LIMIT
        ));
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
            return listStableFallbackChunks(scanTaskId, question);
        }
        boolean hasKeywordCandidate = keywordCandidates != null && !keywordCandidates.isEmpty();
        List<CodeChunk> ranked = hasKeywordCandidate
                ? rankCandidates(candidates, question, RETRIEVAL_CANDIDATE_LIMIT)
                : rankRepresentativeFallbackCandidates(candidates, RETRIEVAL_CANDIDATE_LIMIT, question);
        return preserveExactLocationAnchorFirst(ranked, question);
    }

    public List<CodeChunk> listSemanticRetrievalCandidates(Long scanTaskId, String embeddingModelKey) {
        return listSemanticRetrievalCandidates(scanTaskId, embeddingModelKey, SEMANTIC_RETRIEVAL_CANDIDATE_LIMIT);
    }

    public List<CodeChunk> listSemanticRetrievalCandidates(Long scanTaskId, String embeddingModelKey, long embeddedChunkCount) {
        return listSemanticRetrievalCandidates(
                scanTaskId,
                embeddingModelKey,
                SEMANTIC_RETRIEVAL_CANDIDATE_LIMIT,
                embeddedChunkCount);
    }

    public List<CodeChunk> listSemanticRetrievalCandidates(Long scanTaskId, String embeddingModelKey, int limit) {
        if (scanTaskId == null || embeddingModelKey == null || embeddingModelKey.isBlank()) {
            return List.of();
        }
        int safeLimit = Math.min(Math.max(limit, 1), SEMANTIC_RETRIEVAL_CANDIDATE_LIMIT);
        return listSemanticRetrievalWindow(scanTaskId, embeddingModelKey, safeLimit, 0);
    }

    public List<CodeChunk> listSemanticRetrievalCandidates(Long scanTaskId,
                                                           String embeddingModelKey,
                                                           int limit,
                                                           long embeddedChunkCount) {
        if (scanTaskId == null || embeddingModelKey == null || embeddingModelKey.isBlank()) {
            return List.of();
        }
        int safeLimit = Math.min(Math.max(limit, 1), SEMANTIC_RETRIEVAL_CANDIDATE_LIMIT);
        if (embeddedChunkCount <= safeLimit) {
            return listSemanticRetrievalWindow(scanTaskId, embeddingModelKey, safeLimit, 0);
        }
        int headLimit = Math.max(1, safeLimit / 2);
        int remainingLimit = safeLimit - headLimit;
        int windowCount = Math.min(SEMANTIC_RETRIEVAL_DISTRIBUTED_WINDOWS, Math.max(1, remainingLimit));
        int windowLimit = Math.max(1, remainingLimit / windowCount);
        List<CodeChunk> candidates = listSemanticRetrievalWindow(scanTaskId, embeddingModelKey, headLimit, 0);
        long maxOffset = Math.max(headLimit, embeddedChunkCount - windowLimit);
        boolean compactTailWindow = embeddedChunkCount <= (long) safeLimit + remainingLimit;
        long compactTailStart = Math.max(headLimit, embeddedChunkCount - remainingLimit);
        for (int i = 1; i <= windowCount && candidates.size() < safeLimit; i++) {
            long offset = compactTailWindow
                    ? compactTailStart + (long) (i - 1) * windowLimit
                    : headLimit + Math.round((maxOffset - headLimit) * (i / (double) windowCount));
            int remaining = safeLimit - candidates.size();
            candidates = mergeCandidates(candidates, listSemanticRetrievalWindow(
                    scanTaskId,
                    embeddingModelKey,
                    Math.min(windowLimit, remaining),
                    offset));
        }
        if (candidates.size() > safeLimit) {
            return candidates.subList(0, safeLimit);
        }
        return candidates;
    }

    private List<CodeChunk> listSemanticRetrievalWindow(Long scanTaskId,
                                                        String embeddingModelKey,
                                                        int limit,
                                                        long offset) {
        int safeLimit = Math.min(Math.max(limit, 1), SEMANTIC_RETRIEVAL_CANDIDATE_LIMIT);
        long safeOffset = Math.max(offset, 0);
        String limitClause = "LIMIT " + safeLimit + (safeOffset > 0 ? " OFFSET " + safeOffset : "");
        return list(new LambdaQueryWrapper<CodeChunk>()
                .eq(CodeChunk::getScanTaskId, scanTaskId)
                .isNotNull(CodeChunk::getEmbedding)
                .ne(CodeChunk::getEmbedding, "")
                .eq(CodeChunk::getEmbeddingModel, embeddingModelKey)
                .orderByAsc(CodeChunk::getId)
                .last(limitClause));
    }

    public List<CodeChunk> searchChunks(Long scanTaskId, String queryText, Integer limit) {
        int safeLimit = normalizeSearchLimit(limit);
        String[] keywords = CodeChunkRanker.tokenize(queryText);
        if (keywords.length == 0) {
            return listStableFallbackChunks(scanTaskId, queryText).stream()
                    .limit(safeLimit)
                    .toList();
        }

        List<CodeChunk> primaryCandidates = listSearchCandidates(scanTaskId, queryText, safeLimit, false);
        Set<String> primaryCandidateKeys = chunkKeys(primaryCandidates);
        int candidateLimit = rankingCandidateLimit(safeLimit);
        List<CodeChunk> candidates = mergeCandidates(primaryCandidates, listPreviousSameFileContextCandidates(
                scanTaskId,
                queryText,
                primaryCandidates,
                candidateLimit
        ));
        List<CodeChunk> ranked = rankCandidates(candidates, queryText, Math.max(safeLimit, candidates.size()));
        List<CodeChunk> visibleResults = ranked.stream()
                .filter(chunk -> primaryCandidateKeys.contains(chunkKey(chunk)))
                .limit(safeLimit)
                .toList();
        return preserveExactLocationAnchorFirst(visibleResults, queryText);
    }

    private List<CodeChunk> rankCandidates(List<CodeChunk> candidates, String queryText, int limit) {
        if (!CodeChunkRanker.endpointRouteHints(queryText).isEmpty()) {
            return CodeChunkRanker.rankWithPreviousSameFileContext(candidates, queryText, limit);
        }
        return CodeChunkRanker.rank(candidates, queryText, limit);
    }

    private List<CodeChunk> listSearchCandidates(Long scanTaskId, String queryText, int resultLimit) {
        return listSearchCandidates(scanTaskId, queryText, resultLimit, true);
    }

    private List<CodeChunk> listSearchCandidates(Long scanTaskId,
                                                 String queryText,
                                                 int resultLimit,
                                                 boolean includePreviousContextCandidates) {
        String[] keywords = CodeChunkRanker.tokenize(queryText);
        if (keywords.length == 0) {
            return List.of();
        }
        int candidateLimit = rankingCandidateLimit(resultLimit);
        List<CodeChunk> candidates = list(buildKeywordSearchWrapper(scanTaskId, keywords)
                .orderByAsc(CodeChunk::getId)
                .orderByAsc(CodeChunk::getStartLine)
                .last("LIMIT " + candidateLimit));
        candidates = mergeCandidates(candidates, listRoleIntentCandidates(scanTaskId, queryText, candidateLimit));
        candidates = mergeCandidates(candidates, listPathSuffixHintCandidates(scanTaskId, queryText, candidateLimit));
        candidates = mergeCandidates(candidates, listMethodAnchorCandidates(scanTaskId, queryText, candidateLimit));
        candidates = mergeCandidates(candidates, listEvidenceFilePathAnchorCandidates(scanTaskId, queryText, candidateLimit));
        candidates = mergeCandidates(candidates, listEndpointRouteCandidates(scanTaskId, queryText, candidateLimit));
        if (includePreviousContextCandidates) {
            candidates = mergeCandidates(candidates, listPreviousSameFileContextCandidates(
                    scanTaskId,
                    queryText,
                    candidates,
                    candidateLimit
            ));
        }
        return candidates;
    }

    public boolean hasAuxiliarySearchHints(String queryText) {
        boolean hasRoleIntent = !CodeChunkRanker.roleIntentTypes(queryText).isEmpty();
        boolean hasPathSuffixHint = !CodeChunkRanker.pathSuffixHints(queryText).isEmpty();
        boolean hasEndpointRouteHint = !CodeChunkRanker.endpointRouteHints(queryText).isEmpty();
        boolean hasMethodAnchorHint = !CodeChunkRanker.methodAnchorFileHints(queryText).isEmpty();
        boolean hasEvidenceFilePathHint = !evidenceFilePathHints(queryText).isEmpty();
        boolean hasLineHintWithSearchContext = !CodeLocationHintParser.parseLineHints(queryText).isEmpty()
                && (CodeChunkRanker.tokenize(queryText).length > 0
                || hasPathSuffixHint
                || hasEndpointRouteHint
                || hasMethodAnchorHint
                || hasEvidenceFilePathHint);
        return hasLineHintWithSearchContext
                || hasRoleIntent
                || hasPathSuffixHint
                || hasEndpointRouteHint
                || hasMethodAnchorHint
                || hasEvidenceFilePathHint;
    }

    public List<String> representativeFallbackRolePriorities(String queryText) {
        List<String> queryPriorities = representativeFallbackQueryRolePriorities(queryText);
        LinkedHashMap<String, Boolean> priorities = new LinkedHashMap<>();
        for (String role : queryPriorities) {
            priorities.put(role, true);
        }
        for (String role : List.of("CONTROLLER", "SERVICE", "DATA_ACCESS", "DOMAIN_MODEL", "FRONTEND", "CONFIG", "TEST")) {
            priorities.putIfAbsent(role, true);
        }
        return new ArrayList<>(priorities.keySet());
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

    private Set<String> chunkKeys(List<CodeChunk> chunks) {
        if (chunks == null || chunks.isEmpty()) {
            return Set.of();
        }
        Set<String> keys = new java.util.HashSet<>();
        for (CodeChunk chunk : chunks) {
            if (chunk != null) {
                keys.add(chunkKey(chunk));
            }
        }
        return keys;
    }

    private List<CodeChunk> listStableFallbackChunks(Long scanTaskId, String queryText) {
        List<CodeChunk> representative = listRepresentativeFallbackChunks(scanTaskId, RETRIEVAL_FALLBACK_LIMIT, queryText);
        if (!representative.isEmpty()) {
            return representative;
        }
        return baseMapper.selectStableFallbackChunks(scanTaskId, RETRIEVAL_FALLBACK_LIMIT);
    }

    private List<CodeChunk> listRepresentativeFallbackChunks(Long scanTaskId, int limit, String queryText) {
        if (scanTaskId == null || limit <= 0) {
            return List.of();
        }
        List<String> representativeRoles = List.of(
                "CONTROLLER",
                "SERVICE",
                "DATA_ACCESS",
                "DOMAIN_MODEL",
                "FRONTEND",
                "CONFIG",
                "TEST"
        );
        List<CodeChunk> candidates = new ArrayList<>();
        int perRoleLimit = Math.max(4, Math.min(12, limit));
        for (String role : representativeRoles) {
            candidates = mergeCandidates(candidates, listRepresentativeFallbackRoleCandidates(scanTaskId, role, perRoleLimit));
        }
        if (candidates == null || candidates.isEmpty()) {
            return List.of();
        }
        return rankRepresentativeFallbackCandidates(candidates, limit, queryText);
    }

    private List<CodeChunk> listRepresentativeFallbackRoleCandidates(Long scanTaskId, String role, int limit) {
        if (scanTaskId == null || role == null || role.isBlank() || limit <= 0) {
            return List.of();
        }
        return list(new LambdaQueryWrapper<CodeChunk>()
                .eq(CodeChunk::getScanTaskId, scanTaskId)
                .and(wrapper -> addRoleIntentConditions(wrapper, role))
                .orderByAsc(CodeChunk::getFilePath)
                .orderByAsc(CodeChunk::getStartLine)
                .last("LIMIT " + Math.min(Math.max(limit, 1), REPRESENTATIVE_FALLBACK_QUERY_LIMIT)));
    }

    private List<CodeChunk> rankRepresentativeFallbackCandidates(List<CodeChunk> candidates, int limit, String queryText) {
        int safeLimit = Math.max(1, Math.min(limit, RETRIEVAL_FALLBACK_LIMIT));
        List<CodeChunk> sorted = candidates.stream()
                .filter(Objects::nonNull)
                .sorted(Comparator.<CodeChunk>comparingInt(chunk -> representativeFallbackRolePriority(chunk, queryText))
                        .thenComparing(chunk -> normalizedPath(chunk.getFilePath()))
                        .thenComparing(chunk -> chunk.getStartLine() == null ? Integer.MAX_VALUE : chunk.getStartLine())
                        .thenComparing(chunk -> chunk.getId() == null ? Long.MAX_VALUE : chunk.getId()))
                .toList();

        LinkedHashMap<String, CodeChunk> selected = new LinkedHashMap<>();
        Set<Integer> coveredRoles = new java.util.HashSet<>();
        for (CodeChunk chunk : sorted) {
            int role = representativeFallbackRolePriority(chunk, queryText);
            if (role >= 90 || coveredRoles.contains(role)) {
                continue;
            }
            selected.putIfAbsent(chunkKey(chunk), chunk);
            coveredRoles.add(role);
            if (selected.size() >= safeLimit) {
                return new ArrayList<>(selected.values());
            }
        }
        for (CodeChunk chunk : sorted) {
            selected.putIfAbsent(chunkKey(chunk), chunk);
            if (selected.size() >= safeLimit) {
                break;
            }
        }
        return new ArrayList<>(selected.values());
    }

    private int representativeFallbackRolePriority(CodeChunk chunk, String queryText) {
        String role = representativeFallbackRole(chunk);
        if (role == null) {
            return 99;
        }
        List<String> queryPriorities = representativeFallbackQueryRolePriorities(queryText);
        int queryIndex = queryPriorities.indexOf(role);
        if (queryIndex >= 0) {
            return queryIndex;
        }
        return queryPriorities.size() + representativeFallbackDefaultRolePriority(role);
    }

    private int representativeFallbackRolePriority(CodeChunk chunk) {
        String role = representativeFallbackRole(chunk);
        return role == null ? 99 : representativeFallbackDefaultRolePriority(role);
    }

    private int representativeFallbackDefaultRolePriority(String role) {
        return switch (role) {
            case "CONTROLLER" -> 0;
            case "SERVICE" -> 1;
            case "DATA_ACCESS" -> 2;
            case "DOMAIN_MODEL" -> 3;
            case "FRONTEND" -> 4;
            case "CONFIG" -> 5;
            case "TEST" -> 6;
            default -> 90;
        };
    }

    private String representativeFallbackRole(CodeChunk chunk) {
        String path = normalizedPath(chunk == null ? null : chunk.getFilePath());
        if (path.isBlank()) {
            return null;
        }
        if (path.contains("/controller/") || path.endsWith("controller.java") || path.endsWith("controller.kt")) {
            return "CONTROLLER";
        }
        if (path.contains("/service/") || path.endsWith("service.java") || path.endsWith("service.kt")) {
            return "SERVICE";
        }
        if (path.contains("/repository/")
                || path.endsWith("repository.java")
                || path.endsWith("repository.kt")
                || path.contains("/mapper/")
                || path.endsWith("mapper.java")
                || path.endsWith("mapper.kt")
                || path.contains("/dao/")
                || path.endsWith("dao.java")
                || path.endsWith("dao.kt")) {
            return "DATA_ACCESS";
        }
        if (path.contains("/entity/")
                || path.endsWith("entity.java")
                || path.endsWith("entity.kt")
                || path.contains("/model/")
                || path.endsWith("model.java")
                || path.endsWith("model.kt")) {
            return "DOMAIN_MODEL";
        }
        if (path.contains("web-console/src/")
                || path.contains("/admin/src/")
                || path.contains("/components/")
                || path.contains("/views/")
                || path.contains("/pages/")
                || path.contains("/router/")
                || path.contains("/src/api/")
                || path.endsWith(".tsx")
                || path.endsWith(".jsx")
                || path.endsWith(".vue")) {
            return "FRONTEND";
        }
        if (path.contains("/config/")
                || path.contains("/src/main/resources/")
                || path.endsWith("application.yml")
                || path.endsWith("application.yaml")
                || path.endsWith("application.properties")
                || path.endsWith(".env")
                || path.endsWith(".yml")
                || path.endsWith(".yaml")
                || path.endsWith(".properties")) {
            return "CONFIG";
        }
        if (path.contains("/test/")
                || path.contains("/tests/")
                || path.endsWith("test.java")
                || path.endsWith("tests.java")
                || path.endsWith(".spec.ts")
                || path.endsWith(".spec.tsx")
                || path.endsWith(".test.ts")
                || path.endsWith(".test.tsx")) {
            return "TEST";
        }
        return null;
    }

    private List<String> representativeFallbackQueryRolePriorities(String queryText) {
        String input = normalizedPath(queryText);
        if (input.isBlank()) {
            return List.of();
        }
        LinkedHashMap<String, Boolean> roles = new LinkedHashMap<>();
        if (containsAny(input, "危险", "命令", "拒绝", "校验", "验证", "权限", "认证", "鉴权", "安全",
                "security", "auth", "permission", "validate", "validation", "reject", "deny", "dangerous", "command")) {
            roles.put("SERVICE", true);
            roles.put("CONFIG", true);
            roles.put("CONTROLLER", true);
        }
        if (containsAny(input, "数据", "加载", "查询", "保存", "写入", "读取", "数据库", "表", "mapper", "dao",
                "data", "load", "query", "save", "persist", "database", "table", "repository")) {
            roles.put("DATA_ACCESS", true);
            roles.put("DOMAIN_MODEL", true);
            roles.put("SERVICE", true);
            roles.put("CONFIG", true);
        }
        if (containsAny(input, "配置", "运行时", "固定配置", "环境", "开关", "启动", "参数",
                "runtime", "config", "configuration", "profile", "env", "environment", "feature flag", "feature")) {
            roles.put("CONFIG", true);
            roles.put("SERVICE", true);
            roles.put("CONTROLLER", true);
        }
        if (containsAny(input, "页面", "按钮", "前端", "组件", "接口调用", "ui", "frontend", "page", "button", "component")) {
            roles.put("FRONTEND", true);
            roles.put("CONTROLLER", true);
        }
        if (containsAny(input, "子任务", "agent", "工具", "能力", "调度", "流程", "worker", "task", "tool", "workflow")) {
            roles.put("SERVICE", true);
            roles.put("CONFIG", true);
            roles.put("CONTROLLER", true);
        }
        List<String> explicitRoleIntents = CodeChunkRanker.roleIntentTypes(queryText);
        for (String role : explicitRoleIntents) {
            if (!"DOCUMENTATION".equals(role)) {
                roles.putIfAbsent(role, true);
            }
        }
        return new ArrayList<>(roles.keySet());
    }

    private boolean containsAny(String input, String... needles) {
        if (input == null || input.isBlank() || needles == null) {
            return false;
        }
        for (String needle : needles) {
            if (needle != null && !needle.isBlank() && input.contains(needle.toLowerCase(Locale.ROOT))) {
                return true;
            }
        }
        return false;
    }

    private String normalizedPath(String path) {
        return path == null ? "" : path.replace('\\', '/').toLowerCase(Locale.ROOT);
    }

    private List<CodeChunk> listMethodAnchorCandidates(Long scanTaskId, String queryText, int limit) {
        if (scanTaskId == null || limit <= 0) {
            return List.of();
        }
        List<String> fileHints = CodeChunkRanker.methodAnchorFileHints(queryText);
        if (fileHints.isEmpty()) {
            return List.of();
        }
        int safeLimit = Math.min(Math.max(limit, 20), RANKING_CANDIDATE_MAX_LIMIT);
        return list(new LambdaQueryWrapper<CodeChunk>()
                .eq(CodeChunk::getScanTaskId, scanTaskId)
                .and(wrapper -> {
                    boolean first = true;
                    for (String hint : fileHints) {
                        if (hint == null || hint.isBlank()) {
                            continue;
                        }
                        if (first) {
                            wrapper.like(CodeChunk::getFilePath, hint);
                            first = false;
                        } else {
                            wrapper.or().like(CodeChunk::getFilePath, hint);
                        }
                    }
                })
                .orderByAsc(CodeChunk::getFilePath)
                .orderByAsc(CodeChunk::getStartLine)
                .last("LIMIT " + safeLimit));
    }

    private List<CodeChunk> listPathSuffixHintCandidates(Long scanTaskId, String queryText, int limit) {
        if (scanTaskId == null || limit <= 0) {
            return List.of();
        }
        if (!CodeLocationHintParser.evidenceFilePathHints(queryText).isEmpty()) {
            return List.of();
        }
        List<String> pathHints = CodeChunkRanker.pathSuffixHints(queryText);
        if (pathHints.isEmpty()) {
            return List.of();
        }
        int safeLimit = Math.min(Math.max(limit, 20), RANKING_CANDIDATE_MAX_LIMIT);
        return list(new LambdaQueryWrapper<CodeChunk>()
                .eq(CodeChunk::getScanTaskId, scanTaskId)
                .and(wrapper -> {
                    boolean first = true;
                    for (String hint : pathHints) {
                        if (hint == null || hint.isBlank()) {
                            continue;
                        }
                        String fileName = fileName(hint);
                        if (first) {
                            addPathSuffixHintCondition(wrapper, hint, fileName);
                            first = false;
                        } else {
                            wrapper.or(nested -> addPathSuffixHintCondition(nested, hint, fileName));
                        }
                    }
                })
                .orderByAsc(CodeChunk::getFilePath)
                .orderByAsc(CodeChunk::getStartLine)
                .last("LIMIT " + safeLimit));
    }

    private void addPathSuffixHintCondition(LambdaQueryWrapper<CodeChunk> wrapper, String hint, String fileName) {
        wrapper.like(CodeChunk::getFilePath, hint);
        if (fileName != null && !fileName.isBlank() && !Objects.equals(fileName, hint)) {
            wrapper.or().like(CodeChunk::getFilePath, fileName);
        }
    }

    private List<CodeChunk> listEvidenceFilePathAnchorCandidates(Long scanTaskId, String queryText, int limit) {
        if (scanTaskId == null || limit <= 0) {
            return List.of();
        }
        List<String> filePathHints = evidenceFilePathHints(queryText);
        if (filePathHints.isEmpty()) {
            return List.of();
        }
        int safeLimit = Math.min(Math.max(limit, 20), RANKING_CANDIDATE_MAX_LIMIT);
        return list(new LambdaQueryWrapper<CodeChunk>()
                .eq(CodeChunk::getScanTaskId, scanTaskId)
                .and(wrapper -> {
                    boolean first = true;
                    for (String hint : filePathHints) {
                        if (hint == null || hint.isBlank()) {
                            continue;
                        }
                        String fileName = fileName(hint);
                        if (first) {
                            addEvidenceFilePathCondition(wrapper, hint, fileName);
                            first = false;
                        } else {
                            wrapper.or(nested -> addEvidenceFilePathCondition(nested, hint, fileName));
                        }
                    }
                })
                .orderByAsc(CodeChunk::getFilePath)
                .orderByAsc(CodeChunk::getStartLine)
                .last("LIMIT " + safeLimit));
    }

    private List<CodeChunk> listEndpointRouteCandidates(Long scanTaskId, String queryText, int limit) {
        if (scanTaskId == null || limit <= 0 || CodeChunkRanker.endpointRouteHints(queryText).isEmpty()) {
            return List.of();
        }
        int safeLimit = Math.min(Math.max(limit, 20), RANKING_CANDIDATE_MAX_LIMIT);
        return list(new LambdaQueryWrapper<CodeChunk>()
                .eq(CodeChunk::getScanTaskId, scanTaskId)
                .and(wrapper -> wrapper
                        .like(CodeChunk::getFilePath, "/controller/")
                        .or()
                        .like(CodeChunk::getFilePath, "Controller.java")
                        .or()
                        .like(CodeChunk::getFilePath, "Controller.kt")
                        .or()
                        .like(CodeChunk::getFilePath, "/src/api/")
                        .or()
                        .like(CodeChunk::getFilePath, "api.ts")
                        .or()
                        .like(CodeChunk::getFilePath, "api.tsx")
                        .or()
                        .like(CodeChunk::getFilePath, "api.js")
                        .or()
                        .like(CodeChunk::getFilePath, "api.jsx")
                        .or()
                        .like(CodeChunk::getFilePath, "Routes.java")
                        .or()
                        .like(CodeChunk::getFilePath, "Routes.kt")
                        .or()
                        .like(CodeChunk::getFilePath, "ApiRoutes.java")
                        .or()
                        .like(CodeChunk::getFilePath, "ApiRoutes.kt")
                        .or()
                        .like(CodeChunk::getFilePath, "RouteConstants.java")
                        .or()
                        .like(CodeChunk::getFilePath, "RouteConstants.kt")
                        .or()
                        .like(CodeChunk::getFilePath, "ApiConstants.java")
                        .or()
                        .like(CodeChunk::getFilePath, "ApiConstants.kt")
                        .or()
                        .like(CodeChunk::getFilePath, "UrlConstants.java")
                        .or()
                        .like(CodeChunk::getFilePath, "UrlConstants.kt")
                        .or()
                        .like(CodeChunk::getFilePath, "UriConstants.java")
                        .or()
                        .like(CodeChunk::getFilePath, "UriConstants.kt")
                        .or()
                        .like(CodeChunk::getFilePath, "ApiUrls.java")
                        .or()
                        .like(CodeChunk::getFilePath, "ApiUrls.kt")
                        .or()
                        .like(CodeChunk::getFilePath, "ApiUris.java")
                        .or()
                        .like(CodeChunk::getFilePath, "ApiUris.kt")
                        .or()
                        .like(CodeChunk::getFilePath, "Paths.java")
                        .or()
                        .like(CodeChunk::getFilePath, "Paths.kt")
                        .or()
                        .like(CodeChunk::getFilePath, "Endpoints.java")
                        .or()
                        .like(CodeChunk::getFilePath, "Endpoints.kt"))
                .orderByAsc(CodeChunk::getFilePath)
                .orderByAsc(CodeChunk::getStartLine)
                .last("LIMIT " + safeLimit));
    }

    private List<CodeChunk> listPreviousSameFileContextCandidates(
            Long scanTaskId,
            String queryText,
            List<CodeChunk> candidates,
            int limit
    ) {
        if (scanTaskId == null
                || limit <= 0
                || CodeChunkRanker.endpointRouteHints(queryText).isEmpty()
                || candidates == null
                || candidates.isEmpty()) {
            return List.of();
        }
        List<CodeChunk> contextSeeds = candidates.stream()
                .filter(chunk -> chunk != null
                        && chunk.getFilePath() != null
                        && !chunk.getFilePath().isBlank()
                        && chunk.getStartLine() != null
                        && chunk.getStartLine() > 1)
                .limit(PREVIOUS_CONTEXT_SEED_LIMIT)
                .toList();
        if (contextSeeds.isEmpty()) {
            return List.of();
        }
        int safeLimit = Math.min(Math.max(limit, 20), RANKING_CANDIDATE_MAX_LIMIT);
        List<CodeChunk> previousCandidates = list(new LambdaQueryWrapper<CodeChunk>()
                .eq(CodeChunk::getScanTaskId, scanTaskId)
                .and(wrapper -> {
                    boolean first = true;
                    for (CodeChunk seed : contextSeeds) {
                        if (first) {
                            wrapper.eq(CodeChunk::getFilePath, seed.getFilePath())
                                    .lt(CodeChunk::getStartLine, seed.getStartLine());
                            first = false;
                        } else {
                            wrapper.or(nested -> nested
                                    .eq(CodeChunk::getFilePath, seed.getFilePath())
                                    .lt(CodeChunk::getStartLine, seed.getStartLine()));
                        }
                    }
                })
                .orderByDesc(CodeChunk::getStartLine)
                .orderByAsc(CodeChunk::getFilePath)
                .last("LIMIT " + safeLimit));
        return limitPreviousContextCandidatesPerSeed(contextSeeds, previousCandidates);
    }

    private List<CodeChunk> limitPreviousContextCandidatesPerSeed(List<CodeChunk> contextSeeds,
                                                                  List<CodeChunk> previousCandidates) {
        if (contextSeeds == null || contextSeeds.isEmpty() || previousCandidates == null || previousCandidates.isEmpty()) {
            return List.of();
        }
        LinkedHashMap<String, CodeChunk> bounded = new LinkedHashMap<>();
        for (CodeChunk seed : contextSeeds) {
            previousCandidates.stream()
                    .filter(previous -> isPreviousContextCandidateForSeed(seed, previous))
                    .sorted(Comparator
                            .comparing((CodeChunk previous) -> previous.getStartLine() == null ? Integer.MIN_VALUE : previous.getStartLine())
                            .reversed()
                            .thenComparing(previous -> previous.getFilePath() == null ? "" : previous.getFilePath()))
                    .limit(PREVIOUS_CONTEXT_WINDOW_PER_SEED)
                    .forEach(previous -> bounded.putIfAbsent(chunkKey(previous), previous));
        }
        return new ArrayList<>(bounded.values());
    }

    private boolean isPreviousContextCandidateForSeed(CodeChunk seed, CodeChunk previous) {
        return seed != null
                && previous != null
                && seed.getFilePath() != null
                && previous.getFilePath() != null
                && Objects.equals(seed.getFilePath(), previous.getFilePath())
                && seed.getStartLine() != null
                && previous.getStartLine() != null
                && previous.getStartLine() < seed.getStartLine();
    }

    private void addEvidenceFilePathCondition(LambdaQueryWrapper<CodeChunk> wrapper, String hint, String fileName) {
        wrapper.eq(CodeChunk::getFilePath, hint);
        if (hint != null && hint.contains("/")) {
            wrapper.or().like(CodeChunk::getFilePath, hint);
        }
        if (fileName != null && !fileName.isBlank() && !Objects.equals(fileName, hint)) {
            wrapper.or().like(CodeChunk::getFilePath, fileName);
        }
    }

    private List<CodeChunk> preserveExactLocationAnchorFirst(List<CodeChunk> ranked, String queryText) {
        if (ranked == null || ranked.size() <= 1 || CodeLocationHintParser.parseLineHints(queryText).isEmpty()) {
            return ranked == null ? List.of() : ranked;
        }
        int exactIndex = -1;
        for (int index = 0; index < ranked.size(); index++) {
            if (CodeChunkRanker.isExactLocationAnchorMatch(ranked.get(index), queryText)) {
                exactIndex = index;
                break;
            }
        }
        if (exactIndex <= 0) {
            return ranked;
        }
        List<CodeChunk> reordered = new ArrayList<>(ranked);
        CodeChunk exact = reordered.remove(exactIndex);
        reordered.add(0, exact);
        return reordered;
    }

    private List<String> evidenceFilePathHints(String queryText) {
        return CodeLocationHintParser.evidenceFilePathHints(queryText);
    }

    private String fileName(String path) {
        if (path == null || path.isBlank()) {
            return "";
        }
        String normalized = path.replace('\\', '/');
        int slash = normalized.lastIndexOf('/');
        return slash >= 0 ? normalized.substring(slash + 1) : normalized;
    }

    private List<CodeChunk> listRoleIntentCandidates(Long scanTaskId, String queryText, int limit) {
        if (scanTaskId == null || limit <= 0) {
            return List.of();
        }
        List<String> roleTypes = CodeChunkRanker.roleIntentTypes(queryText);
        if (roleTypes.isEmpty()) {
            return List.of();
        }
        int safeLimit = Math.min(Math.max(limit, 20), RANKING_CANDIDATE_MAX_LIMIT);
        return list(new LambdaQueryWrapper<CodeChunk>()
                .eq(CodeChunk::getScanTaskId, scanTaskId)
                .and(wrapper -> {
                    boolean first = true;
                    for (String roleType : roleTypes) {
                        if (first) {
                            addRoleIntentConditions(wrapper, roleType);
                            first = false;
                        } else {
                            wrapper.or(nested -> addRoleIntentConditions(nested, roleType));
                        }
                    }
                })
                .orderByAsc(CodeChunk::getFilePath)
                .orderByAsc(CodeChunk::getStartLine)
                .last("LIMIT " + safeLimit));
    }

    private void addRoleIntentConditions(LambdaQueryWrapper<CodeChunk> wrapper, String roleType) {
        switch (roleType) {
            case "CONTROLLER" -> wrapper
                    .like(CodeChunk::getFilePath, "/controller/")
                    .or()
                    .like(CodeChunk::getFilePath, "Controller.java")
                    .or()
                    .like(CodeChunk::getFilePath, "Controller.kt");
            case "SERVICE" -> wrapper
                    .like(CodeChunk::getFilePath, "/service/")
                    .or()
                    .like(CodeChunk::getFilePath, "Service.java")
                    .or()
                    .like(CodeChunk::getFilePath, "Service.kt");
            case "DATA_ACCESS" -> wrapper
                    .like(CodeChunk::getFilePath, "/repository/")
                    .or()
                    .like(CodeChunk::getFilePath, "Repository.java")
                    .or()
                    .like(CodeChunk::getFilePath, "Repository.kt")
                    .or()
                    .like(CodeChunk::getFilePath, "/mapper/")
                    .or()
                    .like(CodeChunk::getFilePath, "Mapper.java")
                    .or()
                    .like(CodeChunk::getFilePath, "Mapper.kt")
                    .or()
                    .like(CodeChunk::getFilePath, "/dao/")
                    .or()
                    .like(CodeChunk::getFilePath, "Dao.java")
                    .or()
                    .like(CodeChunk::getFilePath, "Dao.kt");
            case "DOMAIN_MODEL" -> wrapper
                    .like(CodeChunk::getFilePath, "/entity/")
                    .or()
                    .like(CodeChunk::getFilePath, "Entity.java")
                    .or()
                    .like(CodeChunk::getFilePath, "Entity.kt")
                    .or()
                    .like(CodeChunk::getFilePath, "/model/")
                    .or()
                    .like(CodeChunk::getFilePath, "Model.java")
                    .or()
                    .like(CodeChunk::getFilePath, "Model.kt");
            case "FRONTEND" -> wrapper
                    .like(CodeChunk::getFilePath, "web-console/src/")
                    .or()
                    .like(CodeChunk::getFilePath, "/admin/src/")
                    .or()
                    .like(CodeChunk::getFilePath, "/components/")
                    .or()
                    .like(CodeChunk::getFilePath, "/views/")
                    .or()
                    .like(CodeChunk::getFilePath, "/pages/")
                    .or()
                    .like(CodeChunk::getFilePath, "/router/")
                    .or()
                    .like(CodeChunk::getFilePath, "/src/api/")
                    .or()
                    .like(CodeChunk::getFilePath, ".tsx")
                    .or()
                    .like(CodeChunk::getFilePath, ".jsx")
                    .or()
                    .like(CodeChunk::getFilePath, ".vue");
            case "CONFIG" -> wrapper
                    .like(CodeChunk::getFilePath, "/config/")
                    .or()
                    .like(CodeChunk::getFilePath, "/src/main/resources/")
                    .or()
                    .like(CodeChunk::getFilePath, "application.yml")
                    .or()
                    .like(CodeChunk::getFilePath, "application.yaml")
                    .or()
                    .like(CodeChunk::getFilePath, "application.properties")
                    .or()
                    .like(CodeChunk::getFilePath, ".env")
                    .or()
                    .like(CodeChunk::getFilePath, ".yml")
                    .or()
                    .like(CodeChunk::getFilePath, ".yaml")
                    .or()
                    .like(CodeChunk::getFilePath, ".properties");
            case "TEST" -> wrapper
                    .like(CodeChunk::getFilePath, "/test/")
                    .or()
                    .like(CodeChunk::getFilePath, "/tests/")
                    .or()
                    .like(CodeChunk::getFilePath, "Test.java")
                    .or()
                    .like(CodeChunk::getFilePath, "Tests.java")
                    .or()
                    .like(CodeChunk::getFilePath, ".spec.ts")
                    .or()
                    .like(CodeChunk::getFilePath, ".spec.tsx")
                    .or()
                    .like(CodeChunk::getFilePath, ".test.ts")
                    .or()
                    .like(CodeChunk::getFilePath, ".test.tsx");
            case "DOCUMENTATION" -> wrapper
                    .like(CodeChunk::getFilePath, "/docs/")
                    .or()
                    .like(CodeChunk::getFilePath, "README.md")
                    .or()
                    .like(CodeChunk::getFilePath, "readme.md")
                    .or()
                    .like(CodeChunk::getFilePath, "CHANGELOG.md")
                    .or()
                    .like(CodeChunk::getFilePath, "changelog.md")
                    .or()
                    .like(CodeChunk::getFilePath, "RUNBOOK.md")
                    .or()
                    .like(CodeChunk::getFilePath, "runbook.md")
                    .or()
                    .like(CodeChunk::getFilePath, ".md");
            default -> {
            }
        }
    }

    private List<CodeChunk> mergeCandidates(List<CodeChunk> primary, List<CodeChunk> extra) {
        if ((primary == null || primary.isEmpty()) && (extra == null || extra.isEmpty())) {
            return List.of();
        }
        LinkedHashMap<String, CodeChunk> merged = new LinkedHashMap<>();
        if (primary != null) {
            for (CodeChunk chunk : primary) {
                if (chunk != null) {
                    merged.putIfAbsent(chunkKey(chunk), chunk);
                }
            }
        }
        if (extra != null) {
            for (CodeChunk chunk : extra) {
                if (chunk != null) {
                    merged.putIfAbsent(chunkKey(chunk), chunk);
                }
            }
        }
        return new ArrayList<>(merged.values());
    }

    private Map<String, String> loadReusableEmbeddings(Long scanTaskId, String embeddingModelKey) {
        if (embeddingModelKey == null || embeddingModelKey.isBlank()) {
            return Map.of();
        }
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
                        .isNotNull(CodeChunk::getEmbedding)
                        .ne(CodeChunk::getEmbedding, "")
                        .eq(CodeChunk::getEmbeddingModel, embeddingModelKey));

        Map<String, String> reusable = new HashMap<>();
        for (CodeChunk chunk : previousChunks) {
            if (Objects.equals(embeddingModelKey, chunk.getEmbeddingModel())) {
                reusable.putIfAbsent(chunk.getContentHash(), chunk.getEmbedding());
            }
        }
        log.info("可复用切片向量数: {}, scanTaskId={}, embeddingModel={}", reusable.size(), scanTaskId, embeddingModelKey);
        return reusable;
    }

    private LlmConfig loadActiveConfig(Long userId) {
        try {
            return llmConfigService.getActiveConfig(userId);
        } catch (Exception e) {
            log.warn("读取激活 LLM 配置失败，跳过切片向量复用: {}", e.getMessage());
            return null;
        }
    }

    private boolean hasMissingEmbeddings(List<CodeChunk> chunks) {
        if (chunks == null || chunks.isEmpty()) {
            return false;
        }
        return chunks.stream().anyMatch(chunk -> chunk.getEmbedding() == null || chunk.getEmbedding().isBlank());
    }

    public static String embeddingModelKey(LlmConfig config) {
        if (config == null) {
            return null;
        }
        String provider = config.getProvider() == null || config.getProvider().isBlank()
                ? "UNKNOWN"
                : config.getProvider().trim().toUpperCase(Locale.ROOT);
        return provider + ":" + LlmClient.DEFAULT_EMBEDDING_MODEL;
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
                            wrapper.like(CodeChunk::getFilePath, keyword);
                            first = false;
                        } else {
                            wrapper.or().like(CodeChunk::getFilePath, keyword);
                        }
                    }
                });
    }

}
