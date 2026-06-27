package com.sourcelens.module.agent.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sourcelens.common.observability.SourceLensMetrics;
import com.sourcelens.common.security.SensitiveDataSanitizer;
import com.sourcelens.module.agent.entity.AgentToolCall;
import com.sourcelens.module.agent.mapper.AgentToolCallMapper;
import com.sourcelens.module.agent.tool.AgentTool;
import com.sourcelens.module.agent.tool.ToolContext;
import com.sourcelens.module.agent.tool.ToolRegistry;
import com.sourcelens.module.agent.tool.ToolResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ToolExecutionService {

    private static final int MAX_ARGUMENTS_LENGTH = 8_000;
    private static final int MAX_RESULT_LENGTH = 8_000;

    private final ToolRegistry toolRegistry;
    private final AgentToolCallMapper agentToolCallMapper;
    private final ObjectMapper objectMapper;
    private final SourceLensMetrics metrics;

    public ToolResult execute(String toolName, Map<String, Object> args, ToolContext context) {
        long start = System.currentTimeMillis();
        AgentTool tool = toolRegistry.getTool(toolName);
        ToolResult result;

        if (tool == null) {
            result = ToolResult.fail("工具不存在: " + toolName);
            long durationMs = elapsed(start);
            saveAudit(toolName, "UNKNOWN", args, context, result, durationMs);
            metrics.recordAgentToolCall(toolName, "UNKNOWN", false, durationMs);
            return result;
        }

        result = ToolResult.sanitized(toolRegistry.invoke(toolName, args, context));
        long durationMs = elapsed(start);
        String permissionLevel = tool.permissionLevel().name();
        saveAudit(toolName, permissionLevel, args, context, result, durationMs);
        metrics.recordAgentToolCall(toolName, permissionLevel, result.isSuccess(), durationMs);
        return result;
    }

    private void saveAudit(String toolName,
                           String permissionLevel,
                           Map<String, Object> args,
                           ToolContext context,
                           ToolResult result,
                           long durationMs) {
        try {
            AgentToolCall call = AgentToolCall.builder()
                    .conversationId(context != null ? context.getConversationId() : null)
                    .projectId(context != null ? context.getProjectId() : null)
                    .scanTaskId(context != null ? context.getScanTaskId() : null)
                    .toolName(toolName)
                    .permissionLevel(permissionLevel)
                    .argumentsJson(SensitiveDataSanitizer.sanitizeAndTruncate(toJson(args), MAX_ARGUMENTS_LENGTH))
                    .resultSummary(SensitiveDataSanitizer.sanitizeAndTruncate(result.isSuccess() ? result.getContent() : null, MAX_RESULT_LENGTH))
                    .success(result.isSuccess())
                    .errorMessage(SensitiveDataSanitizer.sanitizeAndTruncate(result.getError(), MAX_RESULT_LENGTH))
                    .durationMs(durationMs)
                    .createdBy(context != null ? context.getUserId() : null)
                    .build();
            agentToolCallMapper.insert(call);
        } catch (Exception e) {
            log.warn("保存 Agent 工具审计失败: tool={}, error={}", toolName, e.getMessage());
        }
    }

    private long elapsed(long start) {
        return System.currentTimeMillis() - start;
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            return String.valueOf(value);
        }
    }

}
