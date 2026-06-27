package com.sourcelens.module.scantask.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sourcelens.common.PageResult;
import com.sourcelens.common.Result;
import com.sourcelens.module.project.service.ProjectService;
import com.sourcelens.module.scantask.dto.CreateScanTaskRequest;
import com.sourcelens.module.scantask.entity.ScanTask;
import com.sourcelens.module.scantask.service.ScanTaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "扫描任务")
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ScanTaskController {

    private final ScanTaskService scanTaskService;
    private final ProjectService projectService;

    @Operation(summary = "创建扫描任务")
    @PostMapping("/repositories/{repositoryId}/scan-tasks")
    public Result<ScanTask> create(@PathVariable Long repositoryId,
                                   @Valid @RequestBody CreateScanTaskRequest req,
                                   @RequestAttribute("userId") Long userId) {
        projectService.verifyOwnership(req.getProjectId(), userId);
        req.setRepositoryId(repositoryId);
        ScanTask task = scanTaskService.create(req.getProjectId(), req, userId);
        return Result.ok(task);
    }

    @Operation(summary = "项目扫描任务列表")
    @GetMapping("/projects/{projectId}/scan-tasks")
    public Result<PageResult<ScanTask>> list(@PathVariable Long projectId,
                                             @RequestParam(defaultValue = "1") int page,
                                             @RequestParam(defaultValue = "20") int pageSize,
                                             @RequestAttribute("userId") Long userId) {
        projectService.verifyOwnership(projectId, userId);
        var records = scanTaskService.listByProject(projectId, page, pageSize);
        List<ScanTask> items = records.getRecords();
        return Result.ok(PageResult.of(items, page, pageSize, records.getTotal()));
    }

    @Operation(summary = "扫描任务详情")
    @GetMapping("/scan-tasks/{scanTaskId}")
    public Result<ScanTask> detail(@PathVariable Long scanTaskId,
                                   @RequestAttribute("userId") Long userId) {
        ScanTask task = scanTaskService.getDetail(scanTaskId);
        projectService.verifyOwnership(task.getProjectId(), userId);
        return Result.ok(task);
    }

    @Operation(summary = "取消扫描任务")
    @PostMapping("/scan-tasks/{scanTaskId}/cancel")
    public Result<ScanTask> cancel(@PathVariable Long scanTaskId,
                                   @RequestAttribute("userId") Long userId) {
        ScanTask task = scanTaskService.getDetail(scanTaskId);
        projectService.verifyOwnership(task.getProjectId(), userId);
        return Result.ok(scanTaskService.cancel(scanTaskId, userId));
    }
}
