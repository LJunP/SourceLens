package com.sourcelens;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sourcelens.common.observability.SourceLensMetrics;
import com.sourcelens.module.agent.entity.AgentToolCall;
import com.sourcelens.module.agent.mapper.AgentToolCallMapper;
import com.sourcelens.module.agent.service.ToolExecutionService;
import com.sourcelens.module.agent.tool.AgentTool;
import com.sourcelens.module.agent.tool.ToolContext;
import com.sourcelens.module.agent.tool.ToolPermissionLevel;
import com.sourcelens.module.agent.tool.ToolRegistry;
import com.sourcelens.module.agent.tool.ToolResult;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ToolExecutionServiceTest {

    @Test
    void execute_shouldPersistScanTaskIdInToolAudit() {
        ToolRegistry toolRegistry = mock(ToolRegistry.class);
        AgentToolCallMapper callMapper = mock(AgentToolCallMapper.class);
        SourceLensMetrics metrics = mock(SourceLensMetrics.class);
        AgentTool tool = mock(AgentTool.class);
        when(tool.permissionLevel()).thenReturn(ToolPermissionLevel.READ_ONLY);
        when(toolRegistry.getTool("get_symbols")).thenReturn(tool);
        when(toolRegistry.invoke(eq("get_symbols"), any(), any())).thenReturn(ToolResult.ok("symbols ok"));
        ToolExecutionService service = new ToolExecutionService(toolRegistry, callMapper, new ObjectMapper(), metrics);
        ToolContext context = ToolContext.builder()
                .projectId(10L)
                .scanTaskId(42L)
                .conversationId(77L)
                .userId(1L)
                .build();

        ToolResult result = service.execute("get_symbols", Map.of("query", "Auth"), context);

        assertTrue(result.isSuccess());
        ArgumentCaptor<AgentToolCall> captor = ArgumentCaptor.forClass(AgentToolCall.class);
        verify(callMapper).insert(captor.capture());
        assertEquals(10L, captor.getValue().getProjectId());
        assertEquals(42L, captor.getValue().getScanTaskId());
        assertEquals(77L, captor.getValue().getConversationId());
        verify(metrics).recordAgentToolCall(eq("get_symbols"), eq("READ_ONLY"), eq(true), any(Long.class));
    }
}
