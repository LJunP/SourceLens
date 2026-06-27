package com.sourcelens.module.agent.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sourcelens.common.PageResult;
import com.sourcelens.common.Result;
import com.sourcelens.module.project.service.ProjectService;
import com.sourcelens.module.agent.dto.AddStepRequest;
import com.sourcelens.module.agent.dto.CompleteTaskRequest;
import com.sourcelens.module.agent.dto.CreateAgentTaskRequest;
import com.sourcelens.module.agent.dto.UpdateStepRequest;
import com.sourcelens.module.agent.entity.AgentTask;
import com.sourcelens.module.agent.entity.AgentTaskStep;
import com.sourcelens.module.agent.service.AgentTaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Agent 任务")
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AgentTaskController {

    private final AgentTaskService agentTaskService;
    private final ProjectService projectService;

    @Operation(summary = "创建 Agent 任务")
    @PostMapping("/agent-tasks")
    public Result<AgentTask> create(@Valid @RequestBody CreateAgentTaskRequest req,
                                    @RequestAttribute("userId") Long userId) {
        projectService.verifyOwnership(req.getProjectId(), userId);
        return Result.ok(agentTaskService.create(req, userId));
    }

    @Operation(summary = "Agent 任务列表(按项目)")
    @GetMapping("/projects/{projectId}/agent-tasks")
    public Result<PageResult<AgentTask>> list(
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long scanTaskId,
            @RequestAttribute("userId") Long userId) {
        projectService.verifyOwnership(projectId, userId);
        Page<AgentTask> records = agentTaskService.listByProject(projectId, page, pageSize, status, scanTaskId);
        return Result.ok(PageResult.of(records.getRecords(), page, pageSize, records.getTotal()));
    }

    @Operation(summary = "Agent 任务详情")
    @GetMapping("/agent-tasks/{taskId}")
    public Result<AgentTask> detail(@PathVariable Long taskId,
                                    @RequestAttribute("userId") Long userId) {
        AgentTask task = agentTaskService.getDetail(taskId);
        projectService.verifyOwnership(task.getProjectId(), userId);
        return Result.ok(task);
    }

    @Operation(summary = "启动 Agent 任务")
    @PostMapping("/agent-tasks/{taskId}/start")
    public Result<AgentTask> start(@PathVariable Long taskId,
                                   @RequestAttribute("userId") Long userId) {
        AgentTask task = agentTaskService.getDetail(taskId);
        projectService.verifyOwnership(task.getProjectId(), userId);
        return Result.ok(agentTaskService.start(taskId));
    }

    @Operation(summary = "完成 Agent 任务")
    @PostMapping("/agent-tasks/{taskId}/complete")
    public Result<AgentTask> complete(@PathVariable Long taskId,
                                      @RequestBody CompleteTaskRequest req,
                                      @RequestAttribute("userId") Long userId) {
        AgentTask task = agentTaskService.getDetail(taskId);
        projectService.verifyOwnership(task.getProjectId(), userId);
        return Result.ok(agentTaskService.complete(taskId, req));
    }

    @Operation(summary = "取消 Agent 任务")
    @PostMapping("/agent-tasks/{taskId}/cancel")
    public Result<AgentTask> cancel(@PathVariable Long taskId,
                                    @RequestAttribute("userId") Long userId) {
        AgentTask task = agentTaskService.getDetail(taskId);
        projectService.verifyOwnership(task.getProjectId(), userId);
        return Result.ok(agentTaskService.cancel(taskId));
    }

    @Operation(summary = "添加任务步骤")
    @PostMapping("/agent-tasks/{taskId}/steps")
    public Result<AgentTaskStep> addStep(@PathVariable Long taskId,
                                         @RequestBody AddStepRequest req,
                                         @RequestAttribute("userId") Long userId) {
        AgentTask task = agentTaskService.getDetail(taskId);
        projectService.verifyOwnership(task.getProjectId(), userId);
        return Result.ok(agentTaskService.addStep(taskId, req));
    }

    @Operation(summary = "更新任务步骤状态")
    @PatchMapping("/agent-steps/{stepId}")
    public Result<AgentTaskStep> updateStep(@PathVariable Long stepId,
                                            @RequestBody UpdateStepRequest req,
                                            @RequestAttribute("userId") Long userId) {
        AgentTaskStep step = agentTaskService.getStep(stepId);
        AgentTask task = agentTaskService.getDetail(step.getTaskId());
        projectService.verifyOwnership(task.getProjectId(), userId);
        return Result.ok(agentTaskService.updateStep(stepId, req));
    }

    @Operation(summary = "获取任务步骤列表")
    @GetMapping("/agent-tasks/{taskId}/steps")
    public Result<List<AgentTaskStep>> listSteps(@PathVariable Long taskId,
                                                 @RequestAttribute("userId") Long userId) {
        AgentTask task = agentTaskService.getDetail(taskId);
        projectService.verifyOwnership(task.getProjectId(), userId);
        return Result.ok(agentTaskService.listSteps(taskId));
    }
}
