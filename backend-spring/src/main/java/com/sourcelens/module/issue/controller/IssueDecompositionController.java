package com.sourcelens.module.issue.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sourcelens.common.PageResult;
import com.sourcelens.common.Result;
import com.sourcelens.module.project.service.ProjectService;
import com.sourcelens.module.issue.dto.DecomposeIssueRequest;
import com.sourcelens.module.issue.entity.IssueDecomposition;
import com.sourcelens.module.issue.entity.IssueTask;
import com.sourcelens.module.issue.service.IssueDecompositionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Issue 拆解")
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class IssueDecompositionController {

    private final IssueDecompositionService decompositionService;
    private final ProjectService projectService;

    @Operation(summary = "创建并执行需求拆解")
    @PostMapping("/issue-decompositions")
    public Result<IssueDecomposition> create(@Valid @RequestBody DecomposeIssueRequest req,
                                              @RequestAttribute("userId") Long userId) {
        projectService.verifyOwnership(req.getProjectId(), userId);
        IssueDecomposition d = decompositionService.create(req, userId);
        decompositionService.processDecomposition(d.getId());
        return Result.ok(d);
    }

    @Operation(summary = "需求拆解列表(按项目)")
    @GetMapping("/projects/{projectId}/issue-decompositions")
    public Result<PageResult<IssueDecomposition>> list(
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String status,
            @RequestAttribute("userId") Long userId) {
        projectService.verifyOwnership(projectId, userId);
        Page<IssueDecomposition> records = decompositionService.listByProject(projectId, page, pageSize, status);
        return Result.ok(PageResult.of(records.getRecords(), page, pageSize, records.getTotal()));
    }

    @Operation(summary = "需求拆解详情")
    @GetMapping("/issue-decompositions/{id}")
    public Result<IssueDecomposition> detail(@PathVariable Long id,
                                              @RequestAttribute("userId") Long userId) {
        IssueDecomposition d = decompositionService.getDetail(id);
        projectService.verifyOwnership(d.getProjectId(), userId);
        return Result.ok(d);
    }

    @Operation(summary = "获取拆解后的子任务列表")
    @GetMapping("/issue-decompositions/{id}/tasks")
    public Result<List<IssueTask>> listTasks(@PathVariable Long id,
                                              @RequestAttribute("userId") Long userId) {
        IssueDecomposition d = decompositionService.getDetail(id);
        projectService.verifyOwnership(d.getProjectId(), userId);
        return Result.ok(decompositionService.listTasks(id));
    }

    @Operation(summary = "更新子任务状态")
    @PatchMapping("/issue-tasks/{taskId}")
    public Result<IssueTask> updateTaskStatus(@PathVariable Long taskId,
                                               @RequestParam String status,
                                               @RequestAttribute("userId") Long userId) {
        // 进行越权安全保护校验
        IssueTask task = decompositionService.getTask(taskId);
        IssueDecomposition d = decompositionService.getDetail(task.getDecompositionId());
        projectService.verifyOwnership(d.getProjectId(), userId);

        return Result.ok(decompositionService.updateTaskStatus(taskId, status));
    }

    @Operation(summary = "导出 Markdown")
    @GetMapping("/issue-decompositions/{id}/export/markdown")
    public Result<String> exportMarkdown(@PathVariable Long id,
                                          @RequestAttribute("userId") Long userId) {
        IssueDecomposition d = decompositionService.getDetail(id);
        projectService.verifyOwnership(d.getProjectId(), userId);
        return Result.ok(decompositionService.exportMarkdown(id));
    }
}