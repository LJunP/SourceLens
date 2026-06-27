package com.sourcelens.module.execution.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sourcelens.common.PageResult;
import com.sourcelens.common.Result;
import com.sourcelens.common.exception.BizException;
import com.sourcelens.module.agent.service.AgentTaskService;
import com.sourcelens.module.autorepair.service.AutoRepairService;
import com.sourcelens.module.execution.dto.ExecutionTaskDetailResponse;
import com.sourcelens.module.execution.entity.ExecutionTask;
import com.sourcelens.module.execution.service.ExecutionTaskService;
import com.sourcelens.module.project.service.ProjectService;
import com.sourcelens.module.scantask.service.ScanTaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "统一执行任务")
@RestController
@RequestMapping("/api/projects/{projectId}/execution-tasks")
@RequiredArgsConstructor
public class ExecutionTaskController {

    private final ExecutionTaskService executionTaskService;
    private final ProjectService projectService;
    private final AgentTaskService agentTaskService;
    private final ScanTaskService scanTaskService;
    private final AutoRepairService autoRepairService;

    @Operation(summary = "查询项目下的统一执行任务")
    @GetMapping
    public Result<PageResult<ExecutionTask>> listTasks(
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestAttribute("userId") Long userId) {
        projectService.verifyOwnership(projectId, userId);
        Page<ExecutionTask> records = executionTaskService.listByProject(projectId, page, pageSize);
        return Result.ok(PageResult.of(records.getRecords(), page, pageSize, records.getTotal()));
    }

    @Operation(summary = "获取统一执行任务详情")
    @GetMapping("/{taskId}")
    public Result<ExecutionTaskDetailResponse> getTaskDetail(
            @PathVariable Long projectId,
            @PathVariable Long taskId,
            @RequestAttribute("userId") Long userId) {
        projectService.verifyOwnership(projectId, userId);
        ExecutionTask task = executionTaskService.getByProject(projectId, taskId);
        if (task == null) {
            throw BizException.notFound("ExecutionTask");
        }
        return Result.ok(new ExecutionTaskDetailResponse(task,
                executionTaskService.listAttempts(taskId),
                executionTaskService.listSteps(taskId),
                executionTaskService.listLogs(taskId, 200)));
    }

    @Operation(summary = "按来源获取统一执行任务详情")
    @GetMapping("/source/{sourceType}/{sourceId}")
    public Result<ExecutionTaskDetailResponse> getTaskDetailBySource(
            @PathVariable Long projectId,
            @PathVariable String sourceType,
            @PathVariable Long sourceId,
            @RequestAttribute("userId") Long userId) {
        projectService.verifyOwnership(projectId, userId);
        ExecutionTask task = executionTaskService.getByProjectAndSource(projectId, sourceType, sourceId);
        if (task == null) {
            throw BizException.notFound("ExecutionTask");
        }
        return Result.ok(new ExecutionTaskDetailResponse(task,
                executionTaskService.listAttempts(task.getId()),
                executionTaskService.listSteps(task.getId()),
                executionTaskService.listLogs(task.getId(), 200)));
    }

    @Operation(summary = "取消统一执行任务")
    @PostMapping("/{taskId}/cancel")
    public Result<ExecutionTaskDetailResponse> cancelTask(
            @PathVariable Long projectId,
            @PathVariable Long taskId,
            @RequestAttribute("userId") Long userId) {
        projectService.verifyOwnership(projectId, userId);
        ExecutionTask task = executionTaskService.getByProject(projectId, taskId);
        if (task == null) {
            throw BizException.notFound("ExecutionTask");
        }
        if (executionTaskService.isTerminal(task)) {
            throw BizException.badRequest("已结束的执行任务无法取消");
        }
        if (task.getSourceType() == null || task.getSourceId() == null) {
            executionTaskService.markCancelled(taskId, "cancelled", "执行任务已取消");
        } else if ("AGENT_TASK".equals(task.getSourceType())) {
            agentTaskService.cancel(task.getSourceId());
        } else if ("SCAN_TASK".equals(task.getSourceType())) {
            scanTaskService.cancel(task.getSourceId(), userId);
        } else if ("AUTO_REPAIR".equals(task.getSourceType())) {
            autoRepairService.cancelRepair(projectId, task.getSourceId(), userId);
        } else {
            executionTaskService.markCancelled(taskId, "cancelled", "执行任务已取消");
        }

        ExecutionTask updated = executionTaskService.getByProject(projectId, taskId);
        return Result.ok(new ExecutionTaskDetailResponse(updated,
                executionTaskService.listAttempts(taskId),
                executionTaskService.listSteps(taskId),
                executionTaskService.listLogs(taskId, 200)));
    }
}
