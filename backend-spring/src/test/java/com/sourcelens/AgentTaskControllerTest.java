package com.sourcelens;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sourcelens.common.exception.GlobalExceptionHandler;
import com.sourcelens.module.agent.controller.AgentTaskController;
import com.sourcelens.module.agent.entity.AgentTask;
import com.sourcelens.module.agent.service.AgentTaskService;
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

class AgentTaskControllerTest {

    private AgentTaskService agentTaskService;
    private ProjectService projectService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        agentTaskService = mock(AgentTaskService.class);
        projectService = mock(ProjectService.class);
        mockMvc = MockMvcBuilders
                .standaloneSetup(new AgentTaskController(agentTaskService, projectService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void list_shouldPassScanTaskIdFilterToService() throws Exception {
        Long projectId = 10L;
        Long userId = 1L;
        AgentTask task = AgentTask.builder()
                .id(77L)
                .projectId(projectId)
                .scanTaskId(42L)
                .title("扫描报告任务")
                .status("PENDING")
                .build();
        Page<AgentTask> page = new Page<>(1, 20, 1);
        page.setRecords(List.of(task));
        doNothing().when(projectService).verifyOwnership(projectId, userId);
        when(agentTaskService.listByProject(projectId, 1, 20, "PENDING", 42L))
                .thenReturn(page);

        mockMvc.perform(get("/api/projects/10/agent-tasks")
                        .param("status", "PENDING")
                        .param("scanTaskId", "42")
                        .requestAttr("userId", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].id").value(77))
                .andExpect(jsonPath("$.data.items[0].scanTaskId").value(42))
                .andExpect(jsonPath("$.data.total").value(1));

        verify(projectService).verifyOwnership(projectId, userId);
        verify(agentTaskService).listByProject(eq(projectId), eq(1), eq(20), eq("PENDING"), eq(42L));
    }
}
