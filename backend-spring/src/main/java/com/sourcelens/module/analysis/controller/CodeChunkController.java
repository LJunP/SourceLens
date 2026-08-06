package com.sourcelens.module.analysis.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.sourcelens.common.Result;
import com.sourcelens.common.exception.BizException;
import com.sourcelens.module.analysis.dto.CodeChunkSearchItem;
import com.sourcelens.module.analysis.dto.CodeChunkSearchResponse;
import com.sourcelens.module.analysis.dto.CodeChunkStatusCounts;
import com.sourcelens.module.analysis.entity.CodeChunk;
import com.sourcelens.module.analysis.service.CodeChunkRanker;
import com.sourcelens.module.analysis.service.CodeChunkService;
import com.sourcelens.module.analysis.service.CodeEvidenceProfileService;
import com.sourcelens.module.project.service.ProjectService;
import com.sourcelens.module.scantask.entity.ScanTask;
import com.sourcelens.module.scantask.service.ScanTaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Tag(name = "代码切片检索")
@RestController
@RequestMapping("/api/projects/{projectId}/code-chunks")
@RequiredArgsConstructor
public class CodeChunkController {

    private static final int PREVIEW_LIMIT = 1600;

    private final ProjectService projectService;
    private final ScanTaskService scanTaskService;
    private final CodeChunkService codeChunkService;
    private final CodeEvidenceProfileService evidenceProfileService;

    @Operation(summary = "检索项目代码切片")
    @GetMapping("/search")
    public Result<CodeChunkSearchResponse> search(
            @PathVariable Long projectId,
            @RequestParam(required = false) Long scanTaskId,
            @RequestParam(required = false, defaultValue = "") String query,
            @RequestParam(required = false, defaultValue = "20") Integer limit,
            @RequestAttribute("userId") Long userId) {
        projectService.verifyOwnership(projectId, userId);

        ScanTask scanTask = resolveScanTask(projectId, scanTaskId);
        if (scanTask == null) {
            return Result.ok(emptyResponse(null, query, limit, "NO_SCAN"));
        }

        if (!"SUCCESS".equals(scanTask.getStatus())) {
            return Result.ok(emptyResponse(scanTask.getId(), query, limit, "NO_SCAN"));
        }

        int safeLimit = codeChunkService.normalizeSearchLimit(limit);
        String safeQuery = query == null ? "" : query;
        long totalChunks = codeChunkService.countChunks(scanTask.getId());
        long embeddedChunks = codeChunkService.countEmbeddedChunks(scanTask.getId());
        boolean hasSearchContext = CodeChunkRanker.tokenize(safeQuery).length > 0
                || codeChunkService.hasAuxiliarySearchHints(safeQuery);
        long matchedChunks = hasSearchContext
                ? codeChunkService.countSearchMatches(scanTask.getId(), safeQuery)
                : totalChunks;
        String retrievalMode = retrievalMode(query, totalChunks, matchedChunks,
                hasSearchContext && codeChunkService.hasAuxiliarySearchHints(safeQuery));
        AtomicInteger labelCounter = new AtomicInteger();
        List<CodeChunkSearchItem> items = codeChunkService.searchChunks(scanTask.getId(), safeQuery, safeLimit)
                .stream()
                .map(chunk -> toSearchItem(chunk, safeQuery, labelCounter.incrementAndGet()))
                .toList();

        return Result.ok(CodeChunkSearchResponse.builder()
                .scanTaskId(scanTask.getId())
                .query(safeQuery)
                .limit(safeLimit)
                .total(matchedChunks)
                .resultCount(items.size())
                .totalChunks(totalChunks)
                .embeddedChunks(embeddedChunks)
                .truncated(matchedChunks > items.size())
                .retrievalMode(retrievalMode)
                .evidenceProfile(evidenceProfileService.build(retrievalMode, items, totalChunks, embeddedChunks, matchedChunks))
                .items(items)
                .build());
    }

    @Operation(summary = "读取项目代码切片状态")
    @GetMapping("/status")
    public Result<CodeChunkSearchResponse> status(
            @PathVariable Long projectId,
            @RequestParam(required = false) Long scanTaskId,
            @RequestParam(required = false, defaultValue = "1") Integer limit,
            @RequestAttribute("userId") Long userId) {
        projectService.verifyOwnership(projectId, userId);

        ScanTask scanTask = resolveScanTask(projectId, scanTaskId);
        if (scanTask == null) {
            return Result.ok(emptyResponse(null, "", limit, "NO_SCAN"));
        }

        if (!"SUCCESS".equals(scanTask.getStatus())) {
            return Result.ok(emptyResponse(scanTask.getId(), "", limit, "NO_SCAN"));
        }

        int safeLimit = codeChunkService.normalizeSearchLimit(limit);
        CodeChunkStatusCounts counts = codeChunkService.getStatusCounts(scanTask.getId());
        long totalChunks = counts.getTotalChunks();
        long embeddedChunks = counts.getEmbeddedChunks();
        String retrievalMode = totalChunks > 0 ? "STABLE_FALLBACK" : "NO_CONTEXT";
        List<CodeChunkSearchItem> items = List.of();
        if (safeLimit > 0 && totalChunks > 0) {
            CodeChunk sample = codeChunkService.getStatusSample(scanTask.getId());
            if (sample != null) {
                items = List.of(toSearchItem(sample, "", 1));
            }
        }

        return Result.ok(CodeChunkSearchResponse.builder()
                .scanTaskId(scanTask.getId())
                .query("")
                .limit(safeLimit)
                .total(totalChunks)
                .resultCount(items.size())
                .totalChunks(totalChunks)
                .embeddedChunks(embeddedChunks)
                .truncated(totalChunks > items.size())
                .retrievalMode(retrievalMode)
                .evidenceProfile(evidenceProfileService.build(retrievalMode, items, totalChunks, embeddedChunks, totalChunks))
                .items(items)
                .build());
    }

    private String retrievalMode(String query, long totalChunks, long matchedChunks, boolean auxiliarySearch) {
        if (totalChunks <= 0) {
            return "NO_CONTEXT";
        }
        if (query == null || query.isBlank()) {
            return "STABLE_FALLBACK";
        }
        if (CodeChunkRanker.tokenize(query).length == 0) {
            return "STABLE_FALLBACK";
        }
        if (matchedChunks <= 0) {
            return "STABLE_FALLBACK";
        }
        return auxiliarySearch ? "HYBRID" : "KEYWORD";
    }

    private CodeChunkSearchResponse emptyResponse(Long scanTaskId, String query, Integer limit, String retrievalMode) {
        return CodeChunkSearchResponse.builder()
                .scanTaskId(scanTaskId)
                .query(query)
                .limit(codeChunkService.normalizeSearchLimit(limit))
                .total(0L)
                .resultCount(0)
                .totalChunks(0L)
                .embeddedChunks(0L)
                .truncated(false)
                .retrievalMode(retrievalMode)
                .evidenceProfile(evidenceProfileService.build(retrievalMode, List.of(), 0L, 0L, 0L))
                .items(List.of())
                .build();
    }

    private ScanTask resolveScanTask(Long projectId, Long scanTaskId) {
        if (scanTaskId != null) {
            ScanTask task = scanTaskService.getDetail(scanTaskId);
            if (!projectId.equals(task.getProjectId())) {
                throw BizException.notFound("ScanTask");
            }
            return task;
        }
        return scanTaskService.getOne(new LambdaQueryWrapper<ScanTask>()
                .eq(ScanTask::getProjectId, projectId)
                .eq(ScanTask::getStatus, "SUCCESS")
                .orderByDesc(ScanTask::getCreatedAt)
                .last("LIMIT 1"));
    }

    private CodeChunkSearchItem toSearchItem(CodeChunk chunk, String query, int index) {
        String sourceLabel = "C" + index;
        return CodeChunkSearchItem.builder()
                .id(chunk.getId())
                .citationId("code-chunk:" + (chunk.getId() == null ? sourceLabel : chunk.getId()))
                .sourceLabel(sourceLabel)
                .scanTaskId(chunk.getScanTaskId())
                .filePath(chunk.getFilePath())
                .workspaceRoot(safeRootMetadata(chunk.getWorkspaceRoot()))
                .moduleRoot(safeRootMetadata(chunk.getModuleRoot()))
                .startLine(chunk.getStartLine())
                .endLine(chunk.getEndLine())
                .content(chunk.getContent())
                .contentPreview(preview(chunk.getContent()))
                .hasEmbedding(chunk.getEmbedding() != null && !chunk.getEmbedding().isBlank())
                .matchedTerms(codeChunkService.matchedTerms(chunk, query))
                .relevanceScore(CodeChunkRanker.relevanceScore(chunk, query))
                .evidenceType(CodeChunkRanker.evidenceType(chunk))
                .evidenceReason(CodeChunkRanker.evidenceReason(chunk, query))
                .contextRole("PRIMARY")
                .contextDistance(0)
                .build();
    }

    private String safeRootMetadata(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim().replace('\\', '/').replaceAll("/+", "/");
        if (normalized.startsWith("/")
                || normalized.equals("..")
                || normalized.startsWith("../")
                || normalized.endsWith("/..")
                || normalized.contains("/../")
                || normalized.matches("(?i)^[a-z]:.*")) {
            return null;
        }
        return normalized;
    }

    private String preview(String content) {
        if (content == null || content.length() <= PREVIEW_LIMIT) {
            return content;
        }
        return content.substring(0, PREVIEW_LIMIT) + "\n...";
    }
}
