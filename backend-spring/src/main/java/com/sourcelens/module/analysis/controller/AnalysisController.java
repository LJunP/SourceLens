package com.sourcelens.module.analysis.controller;

import com.sourcelens.common.Result;
import com.sourcelens.common.exception.BizException;
import com.sourcelens.module.analysis.dto.ScanArtifactResponse;
import com.sourcelens.module.analysis.entity.ScanArtifact;
import com.sourcelens.module.analysis.service.AnalysisService;
import com.sourcelens.module.project.service.ProjectService;
import com.sourcelens.module.scantask.entity.ScanTask;
import com.sourcelens.module.scantask.service.ScanTaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@Slf4j
@Tag(name = "分析产物")
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AnalysisController {

    private final AnalysisService analysisService;
    private final ScanTaskService scanTaskService;
    private final ProjectService projectService;

    @Operation(summary = "获取扫描任务的所有分析产物")
    @GetMapping("/scan-tasks/{scanTaskId}/artifacts")
    public Result<List<ScanArtifactResponse>> listByTask(@PathVariable Long scanTaskId,
                                                         @RequestAttribute("userId") Long userId) {
        ScanTask task = scanTaskService.getDetail(scanTaskId);
        projectService.verifyOwnership(task.getProjectId(), userId);
        try {
            return Result.ok(analysisService.listByTask(scanTaskId).stream()
                    .map(ScanArtifactResponse::from)
                    .toList());
        } catch (Exception e) {
            log.warn("查询分析产物失败, scanTaskId={}, msg={}", scanTaskId, e.getMessage());
            return Result.ok(Collections.emptyList());
        }
    }

    @Operation(summary = "获取指定类型的分析产物")
    @GetMapping("/scan-tasks/{scanTaskId}/artifacts/{artifactType}")
    public Result<ScanArtifactResponse> getByType(@PathVariable Long scanTaskId,
                                                  @PathVariable String artifactType,
                                                  @RequestAttribute("userId") Long userId) {
        ScanTask task = scanTaskService.getDetail(scanTaskId);
        projectService.verifyOwnership(task.getProjectId(), userId);
        ScanArtifact artifact = analysisService.getByTaskAndType(scanTaskId, artifactType);
        if (artifact == null) {
            throw BizException.notFound("ScanArtifact");
        }
        return Result.ok(ScanArtifactResponse.from(artifact));
    }
}
