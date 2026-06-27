package com.sourcelens;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sourcelens.common.exception.GlobalExceptionHandler;
import com.sourcelens.module.project.service.ProjectService;
import com.sourcelens.module.repository.controller.GitHubWebhookDeliveryController;
import com.sourcelens.module.repository.entity.GitHubWebhookDelivery;
import com.sourcelens.module.repository.service.GitHubWebhookDeliveryService;
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

class GitHubWebhookDeliveryControllerTest {

    private GitHubWebhookDeliveryService deliveryService;
    private ProjectService projectService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        deliveryService = mock(GitHubWebhookDeliveryService.class);
        projectService = mock(ProjectService.class);
        mockMvc = MockMvcBuilders
                .standaloneSetup(new GitHubWebhookDeliveryController(deliveryService, projectService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void listProjectDeliveries_shouldVerifyOwnershipAndApplyFilters() throws Exception {
        Long projectId = 10L;
        Long userId = 1L;
        GitHubWebhookDelivery delivery = GitHubWebhookDelivery.builder()
                .id(9L)
                .deliveryId("delivery-1")
                .eventType("installation")
                .status("PROCESSED")
                .resultJson("{\"affectedRepositories\":1}")
                .build();
        Page<GitHubWebhookDelivery> page = new Page<>(1, 20, 1);
        page.setRecords(List.of(delivery));
        doNothing().when(projectService).verifyOwnership(projectId, userId);
        when(deliveryService.listByProject(projectId, 1, 20, "installation", "PROCESSED"))
                .thenReturn(page);

        mockMvc.perform(get("/api/projects/10/github-webhook-deliveries")
                        .param("eventType", "installation")
                        .param("status", "PROCESSED")
                        .requestAttr("userId", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].deliveryId").value("delivery-1"))
                .andExpect(jsonPath("$.data.items[0].eventType").value("installation"))
                .andExpect(jsonPath("$.data.total").value(1));

        verify(projectService).verifyOwnership(projectId, userId);
        verify(deliveryService).listByProject(eq(projectId), eq(1), eq(20),
                eq("installation"), eq("PROCESSED"));
    }
}
