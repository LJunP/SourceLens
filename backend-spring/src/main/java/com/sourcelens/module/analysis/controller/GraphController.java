package com.sourcelens.module.analysis.controller;

import com.sourcelens.common.Result;
import com.sourcelens.module.analysis.entity.CodeRelationEntity;
import com.sourcelens.module.analysis.entity.CodeSymbol;
import com.sourcelens.module.analysis.service.GraphService;
import com.sourcelens.module.project.service.ProjectService;
import com.sourcelens.module.scantask.entity.ScanTask;
import com.sourcelens.module.scantask.service.ScanTaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "依赖图谱")
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class GraphController {

    private final GraphService graphService;
    private final ScanTaskService scanTaskService;
    private final ProjectService projectService;

    @Operation(summary = "获取代码符号列表")
    @GetMapping("/scan-tasks/{scanTaskId}/symbols")
    public Result<List<CodeSymbol>> listSymbols(
            @PathVariable Long scanTaskId,
            @RequestParam(required = false) String kind,
            @RequestAttribute("userId") Long userId) {
        ScanTask task = scanTaskService.getDetail(scanTaskId);
        projectService.verifyOwnership(task.getProjectId(), userId);
        return Result.ok(graphService.listSymbols(scanTaskId, kind));
    }

    @Operation(summary = "获取代码关系列表")
    @GetMapping("/scan-tasks/{scanTaskId}/relations")
    public Result<List<CodeRelationEntity>> listRelations(
            @PathVariable Long scanTaskId,
            @RequestParam(required = false) String relationType,
            @RequestAttribute("userId") Long userId) {
        ScanTask task = scanTaskService.getDetail(scanTaskId);
        projectService.verifyOwnership(task.getProjectId(), userId);
        return Result.ok(graphService.listRelations(scanTaskId, relationType));
    }

    @Operation(summary = "获取完整依赖图谱")
    @GetMapping("/scan-tasks/{scanTaskId}/graph")
    public Result<Map<String, Object>> getDependencyGraph(
            @PathVariable Long scanTaskId,
            @RequestAttribute("userId") Long userId) {
        ScanTask task = scanTaskService.getDetail(scanTaskId);
        projectService.verifyOwnership(task.getProjectId(), userId);
        return Result.ok(graphService.getDependencyGraph(scanTaskId));
    }
}