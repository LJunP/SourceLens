package com.sourcelens.module.analysis.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.sourcelens.common.Result;
import com.sourcelens.common.exception.BizException;
import com.sourcelens.module.analysis.dto.CodeChunkSearchItem;
import com.sourcelens.module.analysis.dto.CodeChunkSearchResponse;
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
        long totalChunks = codeChunkService.countChunks(scanTask.getId());
        long embeddedChunks = codeChunkService.countEmbeddedChunks(scanTask.getId());
        long matchedChunks = codeChunkService.countSearchMatches(scanTask.getId(), query);
        String retrievalMode = retrievalMode(query, totalChunks, matchedChunks);
        List<CodeChunkSearchItem> items = codeChunkService.searchChunks(scanTask.getId(), query, limit)
                .stream()
                .map(chunk -> toSearchItem(chunk, query))
                .toList();

        return Result.ok(CodeChunkSearchResponse.builder()
                .scanTaskId(scanTask.getId())
                .query(query)
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

    private String retrievalMode(String query, long totalChunks, long matchedChunks) {
        if (totalChunks <= 0) {
            return "NO_CONTEXT";
        }
        if (query == null || query.isBlank()) {
            return "STABLE_FALLBACK";
        }
        return matchedChunks > 0 ? "KEYWORD" : "STABLE_FALLBACK";
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

    private CodeChunkSearchItem toSearchItem(CodeChunk chunk, String query) {
        return CodeChunkSearchItem.builder()
                .id(chunk.getId())
                .scanTaskId(chunk.getScanTaskId())
                .filePath(chunk.getFilePath())
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

    private String preview(String content) {
        if (content == null || content.length() <= PREVIEW_LIMIT) {
            return content;
        }
        return content.substring(0, PREVIEW_LIMIT) + "\n...";
    }
}
