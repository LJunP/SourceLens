package com.sourcelens;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sourcelens.common.exception.GlobalExceptionHandler;
import com.sourcelens.module.agent.controller.AgentToolCallController;
import com.sourcelens.module.agent.entity.AgentToolCall;
import com.sourcelens.module.agent.service.AgentToolCallService;
import com.sourcelens.module.project.service.ProjectService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AgentToolCallControllerTest {

    private AgentToolCallService agentToolCallService;
    private ProjectService projectService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        agentToolCallService = mock(AgentToolCallService.class);
        projectService = mock(ProjectService.class);
        mockMvc = MockMvcBuilders
                .standaloneSetup(new AgentToolCallController(agentToolCallService, projectService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void listProjectToolCalls_shouldVerifyOwnershipAndApplyFilters() throws Exception {
        Long projectId = 10L;
        Long userId = 1L;
        AgentToolCall call = AgentToolCall.builder()
                .id(77L)
                .projectId(projectId)
                .conversationId(99L)
                .scanTaskId(42L)
                .toolName("read_file")
                .permissionLevel("READ_ONLY")
                .success(true)
                .durationMs(12L)
                .build();
        Page<AgentToolCall> page = new Page<>(1, 20, 1);
        page.setRecords(List.of(call));
        doNothing().when(projectService).verifyOwnership(projectId, userId);
        when(agentToolCallService.listByProject(projectId, 1, 20, "read_file", 99L, 42L, true)).thenReturn(page);

        mockMvc.perform(get("/api/projects/10/agent-tool-calls")
                        .param("toolName", "read_file")
                        .param("conversationId", "99")
                        .param("scanTaskId", "42")
                        .param("success", "true")
                        .requestAttr("userId", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].id").value(77))
                .andExpect(jsonPath("$.data.items[0].conversationId").value(99))
                .andExpect(jsonPath("$.data.items[0].scanTaskId").value(42))
                .andExpect(jsonPath("$.data.items[0].toolName").value("read_file"))
                .andExpect(jsonPath("$.data.total").value(1));

        verify(projectService).verifyOwnership(projectId, userId);
        verify(agentToolCallService).listByProject(eq(projectId), eq(1), eq(20),
                eq("read_file"), eq(99L), eq(42L), eq(true));
    }
}
