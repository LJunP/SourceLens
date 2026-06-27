package com.sourcelens.module.agent.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sourcelens.common.PageResult;
import com.sourcelens.common.Result;
import com.sourcelens.module.agent.entity.AgentToolCall;
import com.sourcelens.module.agent.service.AgentToolCallService;
import com.sourcelens.module.project.service.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Agent 工具审计")
@RestController
@RequestMapping("/api/projects/{projectId}/agent-tool-calls")
@RequiredArgsConstructor
public class AgentToolCallController {

    private final AgentToolCallService agentToolCallService;
    private final ProjectService projectService;

    @Operation(summary = "查询项目 Agent 工具调用审计")
    @GetMapping
    public Result<PageResult<AgentToolCall>> listProjectToolCalls(
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String toolName,
            @RequestParam(required = false) Long scanTaskId,
            @RequestParam(required = false) Boolean success,
            @RequestAttribute("userId") Long userId) {
        projectService.verifyOwnership(projectId, userId);
        Page<AgentToolCall> records = agentToolCallService.listByProject(projectId, page, pageSize,
                toolName, scanTaskId, success);
        return Result.ok(PageResult.of(records.getRecords(), page, pageSize, records.getTotal()));
    }
}
