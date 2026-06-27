package com.sourcelens.module.agent.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.sourcelens.common.Result;
import com.sourcelens.common.exception.BizException;
import com.sourcelens.module.agent.dto.CodeQaResponse;
import com.sourcelens.module.agent.dto.CodeQaRequest;
import com.sourcelens.module.agent.entity.LlmConfig;
import com.sourcelens.module.agent.service.CodeQaRetrievalService;
import com.sourcelens.module.agent.service.LlmClient;
import com.sourcelens.module.agent.service.LlmConfigService;
import com.sourcelens.module.agent.service.PromptInjectionGuard;
import com.sourcelens.module.analysis.dto.CodeChunkSearchItem;
import com.sourcelens.module.analysis.entity.CodeChunk;
import com.sourcelens.module.analysis.service.CodeChunkRanker;
import com.sourcelens.module.analysis.service.CodeChunkService;
import com.sourcelens.module.analysis.service.CodeEvidenceProfileService;
import com.sourcelens.module.project.service.ProjectService;
import com.sourcelens.module.scantask.entity.ScanTask;
import com.sourcelens.module.scantask.service.ScanTaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@Tag(name = "本地代码问答与RAG")
@RestController
@RequestMapping("/api/projects/{projectId}/qa")
@RequiredArgsConstructor
@Slf4j
public class CodeQaController {

    private static final int QA_CONTEXT_ADJACENT_PER_SIDE = 1;
    private static final int QA_CONTEXT_MAX_CHUNKS = 8;

    private final ProjectService projectService;
    private final ScanTaskService scanTaskService;
    private final CodeChunkService codeChunkService;
    private final LlmConfigService llmConfigService;
    private final LlmClient llmClient;
    private final CodeQaRetrievalService retrievalService;
    private final CodeEvidenceProfileService evidenceProfileService;

    @Operation(summary = "本地代码库 Q&A 问答")
    @PostMapping
    public Result<CodeQaResponse> codeQa(
            @PathVariable Long projectId,
            @Valid @RequestBody CodeQaRequest req,
            @RequestAttribute("userId") Long userId) {

        // 1. 验证项目所有权
        projectService.verifyOwnership(projectId, userId);

        String question = req.getQuestion();

        // 2. 使用报告指定扫描任务；未指定时回退到最近一次成功扫描。
        ScanTask selectedTask = resolveScanTask(projectId, req.getScanTaskId());

        if (selectedTask == null) {
            return Result.ok(response(question, null,
                    "没有找到该项目成功的扫描任务，请先执行一次成功的代码扫描。",
                    List.of(), 0L, 0L, 0L, "NO_SCAN"));
        }

        if (!"SUCCESS".equals(selectedTask.getStatus())) {
            return Result.ok(response(question, selectedTask.getId(),
                    "指定扫描任务尚未成功完成，无法作为代码问答证据源。请等待扫描成功或切换到成功扫描报告。",
                    List.of(), 0L, 0L, 0L, "NO_SCAN"));
        }

        long selectedScanTaskId = selectedTask.getId();
        long totalChunks = codeChunkService.countChunks(selectedScanTaskId);
        long embeddedChunks = codeChunkService.countEmbeddedChunks(selectedScanTaskId);
        long matchedChunks = codeChunkService.countSearchMatches(selectedScanTaskId, question);

        // 3. 只获取与问题相关的候选切片，避免一次问答全量加载大型项目的所有 chunk
        List<CodeChunk> chunks = codeChunkService.listRetrievalCandidates(selectedScanTaskId, question);
        if (chunks == null || chunks.isEmpty()) {
            return Result.ok(response(question, selectedScanTaskId,
                    "该项目的扫描任务未生成任何代码切片。",
                    List.of(), totalChunks, embeddedChunks, matchedChunks, "NO_CONTEXT"));
        }

        // 4. 先按关键词/路径筛候选，再只对候选做向量相似度排序
        LlmConfig llmConfig = llmConfigService.getActiveConfig(userId);
        List<Float> questionEmbedding = null;
        if (llmConfig != null) {
            try {
                questionEmbedding = llmClient.getEmbedding(llmConfig, question);
            } catch (Exception e) {
                log.warn("获取提问 Embedding 失败，将仅使用关键词匹配检索: {}", e.getMessage());
            }
        }

        List<CodeChunk> topChunks = retrievalService.selectTopChunks(chunks, question, questionEmbedding);
        List<CodeChunk> contextChunks = expandContextChunks(selectedScanTaskId, topChunks);
        Set<String> primaryChunkKeys = chunkKeys(topChunks);
        List<CodeChunkSearchItem> retrievedChunks = toRetrievedChunks(contextChunks, question, primaryChunkKeys);
        String retrievalMode = retrievalMode(matchedChunks, retrievedChunks, questionEmbedding);
        if (llmConfig == null) {
            return Result.ok(response(question, selectedScanTaskId,
                    "当前未配置或激活有效的 LLM 模型。请前往配置中心激活大模型，然后再试。已先为您检索出相关代码片段。",
                    retrievedChunks, totalChunks, embeddedChunks, matchedChunks, retrievalMode));
        }

        // 5. 构造 RAG 上下文 Prompt
        StringBuilder contextBuilder = new StringBuilder();
        for (int i = 0; i < contextChunks.size(); i++) {
            CodeChunk chunk = contextChunks.get(i);
            CodeChunkSearchItem evidence = i < retrievedChunks.size() ? retrievedChunks.get(i) : null;
            contextBuilder.append(String.format("### [C%d] %s (Lines %d-%d)\n",
                    i + 1, chunk.getFilePath(), chunk.getStartLine(), chunk.getEndLine()));
            if (evidence != null) {
                contextBuilder.append("Evidence type: ").append(evidence.getEvidenceType()).append("\n");
                contextBuilder.append("Relevance score: ").append(evidence.getRelevanceScore()).append("\n");
                contextBuilder.append("Evidence reason: ").append(evidence.getEvidenceReason()).append("\n");
                if (evidence.getMatchedTerms() != null && !evidence.getMatchedTerms().isEmpty()) {
                    contextBuilder.append("Matched terms: ").append(String.join(", ", evidence.getMatchedTerms())).append("\n");
                }
            }
            contextBuilder.append("```\n");
            contextBuilder.append(chunk.getContent());
            contextBuilder.append("\n```\n\n");
        }

        String systemPrompt = "你是一个优秀的软件架构师和资深程序员。请根据下面提供的代码上下文（Code Context）来回答用户关于代码库的问题。\n" +
                "请严格基于提供的代码事实进行回答，不要编造。如果上下文信息不足以回答问题，请明确说明哪些部分的代码你没有看到或无法从上下文中得知。\n\n" +
                "当回答涉及具体代码事实、文件、函数、类、流程或风险判断时，必须使用 [C1]、[C2] 这样的引用标记指向对应代码片段。不要引用未出现在上下文中的代码片段。\n\n" +
                PromptInjectionGuard.systemBoundaryInstructions() + "\n" +
                "[代码上下文]\n" +
                PromptInjectionGuard.wrapUntrustedContent("retrieved code chunks", contextBuilder.toString());

        List<Map<String, String>> messages = List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", question)
        );

        // 6. 触发大模型调用
        try {
            String answer = llmClient.chat(llmConfig, messages);
            return Result.ok(response(question, selectedScanTaskId, answer, retrievedChunks,
                    totalChunks, embeddedChunks, matchedChunks, retrievalMode));
        } catch (Exception e) {
            log.error("大模型问答接口调用异常", e);
            return Result.ok(response(question, selectedScanTaskId,
                    "调用大模型进行代码问答失败，请检查大模型配置或网络连接。错误信息：" + e.getMessage(),
                    retrievedChunks, totalChunks, embeddedChunks, matchedChunks, retrievalMode));
        }
    }

    private ScanTask resolveScanTask(Long projectId, Long requestedScanTaskId) {
        if (requestedScanTaskId != null) {
            ScanTask requestedTask = scanTaskService.getById(requestedScanTaskId);
            if (requestedTask == null
                    || Boolean.TRUE.equals(requestedTask.getDeleted())
                    || !Objects.equals(requestedTask.getProjectId(), projectId)) {
                throw BizException.notFound("ScanTask");
            }
            return requestedTask;
        }
        return scanTaskService.getOne(
                new LambdaQueryWrapper<ScanTask>()
                        .eq(ScanTask::getProjectId, projectId)
                        .eq(ScanTask::getStatus, "SUCCESS")
                        .orderByDesc(ScanTask::getCreatedAt)
                        .last("LIMIT 1")
        );
    }

    private CodeQaResponse response(String question, Long scanTaskId, String answer, List<CodeChunkSearchItem> retrievedChunks,
                                    long totalChunks, long embeddedChunks, long matchedChunks) {
        return response(question, scanTaskId, answer, retrievedChunks, totalChunks, embeddedChunks, matchedChunks, "KEYWORD");
    }

    private CodeQaResponse response(String question, Long scanTaskId, String answer, List<CodeChunkSearchItem> retrievedChunks,
                                    long totalChunks, long embeddedChunks, long matchedChunks, String retrievalMode) {
        List<CodeChunkSearchItem> safeChunks = retrievedChunks == null ? List.of() : retrievedChunks;
        return CodeQaResponse.builder()
                .question(question)
                .scanTaskId(scanTaskId)
                .answer(answer)
                .matchedChunks(matchedChunks)
                .resultCount(safeChunks.size())
                .retrievalMode(retrievalMode)
                .totalChunks(totalChunks)
                .embeddedChunks(embeddedChunks)
                .truncated(matchedChunks > safeChunks.size())
                .evidenceProfile(evidenceProfileService.build(retrievalMode, safeChunks, totalChunks, embeddedChunks, matchedChunks))
                .retrievedChunks(safeChunks)
                .build();
    }

    private String retrievalMode(long matchedChunks, List<CodeChunkSearchItem> retrievedChunks, List<Float> questionEmbedding) {
        List<CodeChunkSearchItem> safeChunks = retrievedChunks == null ? List.of() : retrievedChunks;
        boolean hasRetrievedChunks = !safeChunks.isEmpty();
        boolean hasRetrievedEmbeddings = safeChunks.stream().anyMatch(chunk -> Boolean.TRUE.equals(chunk.getHasEmbedding()));
        boolean hasQuestionEmbedding = questionEmbedding != null && !questionEmbedding.isEmpty();
        if (matchedChunks <= 0) {
            return hasQuestionEmbedding && hasRetrievedEmbeddings ? "SEMANTIC_FALLBACK" : "STABLE_FALLBACK";
        }
        return hasQuestionEmbedding && hasRetrievedChunks ? "HYBRID" : "KEYWORD";
    }

    private List<CodeChunk> expandContextChunks(Long scanTaskId, List<CodeChunk> topChunks) {
        if (topChunks == null || topChunks.isEmpty()) {
            return List.of();
        }
        try {
            List<CodeChunk> expanded = codeChunkService.expandWithAdjacentChunks(
                    scanTaskId, topChunks, QA_CONTEXT_ADJACENT_PER_SIDE, QA_CONTEXT_MAX_CHUNKS);
            if (expanded != null && !expanded.isEmpty()) {
                return expanded;
            }
        } catch (Exception e) {
            log.warn("扩展代码问答相邻切片上下文失败, scanTaskId={}, error={}", scanTaskId, e.getMessage());
        }
        return topChunks;
    }

    private Set<String> chunkKeys(List<CodeChunk> chunks) {
        if (chunks == null || chunks.isEmpty()) {
            return Set.of();
        }
        Set<String> keys = new HashSet<>();
        for (CodeChunk chunk : chunks) {
            keys.add(chunkKey(chunk));
        }
        return keys;
    }

    private String chunkKey(CodeChunk chunk) {
        if (chunk == null) {
            return "";
        }
        if (chunk.getId() != null) {
            return "id:" + chunk.getId();
        }
        return "range:" + (chunk.getScanTaskId() == null ? "" : chunk.getScanTaskId())
                + ":" + (chunk.getFilePath() == null ? "" : chunk.getFilePath())
                + ":" + (chunk.getStartLine() == null ? "" : chunk.getStartLine())
                + ":" + (chunk.getEndLine() == null ? "" : chunk.getEndLine());
    }

    private List<CodeChunkSearchItem> toRetrievedChunks(List<CodeChunk> chunks, String question, Set<String> primaryChunkKeys) {
        if (chunks == null || chunks.isEmpty()) {
            return List.of();
        }
        return chunks.stream()
                .map(chunk -> {
                    boolean primary = primaryChunkKeys == null || primaryChunkKeys.isEmpty() || primaryChunkKeys.contains(chunkKey(chunk));
                    return CodeChunkSearchItem.builder()
                        .id(chunk.getId())
                        .scanTaskId(chunk.getScanTaskId())
                        .filePath(chunk.getFilePath())
                        .startLine(chunk.getStartLine())
                        .endLine(chunk.getEndLine())
                        .content(chunk.getContent())
                        .contentPreview(preview(chunk.getContent()))
                        .hasEmbedding(chunk.getEmbedding() != null && !chunk.getEmbedding().isBlank())
                        .matchedTerms(codeChunkService.matchedTerms(chunk, question))
                        .relevanceScore(CodeChunkRanker.relevanceScore(chunk, question))
                        .evidenceType(CodeChunkRanker.evidenceType(chunk))
                        .evidenceReason(CodeChunkRanker.evidenceReason(chunk, question))
                        .contextRole(primary ? "PRIMARY" : "ADJACENT_CONTEXT")
                        .contextDistance(primary ? 0 : 1)
                        .build();
                })
                .toList();
    }

    private String preview(String content) {
        if (content == null || content.length() <= 1600) {
            return content;
        }
        return content.substring(0, 1600) + "\n...";
    }
}
