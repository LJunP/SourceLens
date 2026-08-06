package com.sourcelens;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sourcelens.common.exception.BizException;
import com.sourcelens.common.exception.GlobalExceptionHandler;
import com.sourcelens.module.agent.service.ToolExecutionService;
import com.sourcelens.module.agent.tool.ToolContext;
import com.sourcelens.module.agent.tool.ToolResult;
import com.sourcelens.module.audit.controller.AuditWorkbenchSmokeSeedController;
import com.sourcelens.module.audit.service.AuditLogService;
import com.sourcelens.module.project.service.ProjectService;
import com.sourcelens.module.repository.entity.Repository;
import com.sourcelens.module.repository.service.GitHubWebhookDeliveryService;
import com.sourcelens.module.repository.service.RepositoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuditWorkbenchSmokeSeedControllerTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private ProjectService projectService;
    private RepositoryService repositoryService;
    private AuditLogService auditLogService;
    private ToolExecutionService toolExecutionService;
    private GitHubWebhookDeliveryService deliveryService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        projectService = mock(ProjectService.class);
        repositoryService = mock(RepositoryService.class);
        auditLogService = mock(AuditLogService.class);
        toolExecutionService = mock(ToolExecutionService.class);
        deliveryService = mock(GitHubWebhookDeliveryService.class);
        mockMvc = MockMvcBuilders
                .standaloneSetup(new AuditWorkbenchSmokeSeedController(
                        projectService,
                        repositoryService,
                        auditLogService,
                        toolExecutionService,
                        deliveryService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void controller_shouldOnlyBeEnabledForDevOrTestWithoutProdProfile() {
        Profile profile = AuditWorkbenchSmokeSeedController.class.getAnnotation(Profile.class);

        assertNotNull(profile);
        assertArrayEquals(new String[]{"dev & !prod", "test & !prod"}, profile.value());
    }

    @Test
    @SuppressWarnings("unchecked")
    void seed_shouldWriteAllGovernanceSourcesForOwnedProjectRepository() throws Exception {
        Long projectId = 10L;
        Long repositoryId = 20L;
        Long userId = 1L;
        Repository repository = Repository.builder()
                .id(repositoryId)
                .projectId(projectId)
                .build();
        ArgumentCaptor<Map<String, Object>> auditInputCaptor = ArgumentCaptor.forClass(Map.class);
        ArgumentCaptor<Map<String, Object>> toolArgsCaptor = ArgumentCaptor.forClass(Map.class);
        ArgumentCaptor<ToolContext> toolContextCaptor = ArgumentCaptor.forClass(ToolContext.class);
        ArgumentCaptor<String> deliveryIdCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<Map<String, Object>> deliveryResultCaptor = ArgumentCaptor.forClass(Map.class);
        ArgumentCaptor<List<Repository>> repositoryListCaptor = ArgumentCaptor.forClass(List.class);
        doNothing().when(projectService).verifyOwnership(projectId, userId);
        when(repositoryService.getDetail(repositoryId)).thenReturn(repository);
        when(toolExecutionService.execute(eq("__audit_workbench_missing_tool__"), any(), any(ToolContext.class)))
                .thenReturn(ToolResult.fail("工具不存在"));

        MvcResult result = mockMvc.perform(post("/api/dev/projects/10/audit-workbench-smoke-seed")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"repositoryId\":20}")
                        .requestAttr("userId", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.seedId").isNotEmpty())
                .andExpect(jsonPath("$.data.auditAction").value("AUDIT_WORKBENCH_SMOKE_SEED"))
                .andExpect(jsonPath("$.data.toolName").value("__audit_workbench_missing_tool__"))
                .andExpect(jsonPath("$.data.webhookEvent").value("installation_repositories"))
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        JsonNode responseData = objectMapper.readTree(responseBody).path("data");
        String responseSeedId = responseData.path("seedId").asText();
        assertFalse(responseSeedId.isBlank());
        assertEquals(responseSeedId + "-delivery", responseData.path("deliveryId").asText());

        verify(projectService).verifyOwnership(projectId, userId);
        verify(repositoryService).getDetail(repositoryId);
        verify(auditLogService).record(eq(userId), eq(projectId), eq("SMOKE"), eq(projectId),
                eq("AUDIT_WORKBENCH_SMOKE_SEED"), eq("SUCCESS"), auditInputCaptor.capture(), eq("审计 workbench smoke 样本已生成"),
                eq(0L), any());
        verify(toolExecutionService).execute(eq("__audit_workbench_missing_tool__"),
                toolArgsCaptor.capture(), toolContextCaptor.capture());
        verify(deliveryService).markProcessed(deliveryIdCaptor.capture(), eq("installation_repositories"),
                deliveryResultCaptor.capture(), repositoryListCaptor.capture());

        String seedId = (String) auditInputCaptor.getValue().get("seedId");
        assertNotNull(seedId);
        assertEquals(responseSeedId, seedId);
        assertEquals(repositoryId, auditInputCaptor.getValue().get("repositoryId"));
        assertEquals(seedId, toolArgsCaptor.getValue().get("seedId"));
        assertEquals("audit-workbench-smoke", toolArgsCaptor.getValue().get("source"));
        assertEquals(projectId, toolContextCaptor.getValue().getProjectId());
        assertEquals(userId, toolContextCaptor.getValue().getUserId());
        assertEquals(seedId + "-delivery", deliveryIdCaptor.getValue());
        assertEquals(seedId, deliveryResultCaptor.getValue().get("seedId"));
        assertEquals("audit-workbench-smoke", deliveryResultCaptor.getValue().get("source"));
        assertEquals(List.of(repository), repositoryListCaptor.getValue());
    }

    @Test
    void seed_shouldRejectMissingRepositoryId() throws Exception {
        Long projectId = 10L;
        Long userId = 1L;
        doNothing().when(projectService).verifyOwnership(projectId, userId);

        mockMvc.perform(post("/api/dev/projects/10/audit-workbench-smoke-seed")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}")
                        .requestAttr("userId", userId))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("repositoryId 不能为空"));

        verify(projectService).verifyOwnership(projectId, userId);
        verifyNoInteractions(repositoryService, auditLogService, toolExecutionService, deliveryService);
    }

    @Test
    void seed_shouldStopBeforeWritesWhenOwnershipFails() throws Exception {
        Long projectId = 10L;
        Long userId = 1L;
        doThrow(BizException.forbidden("无权访问此项目")).when(projectService).verifyOwnership(projectId, userId);

        mockMvc.perform(post("/api/dev/projects/10/audit-workbench-smoke-seed")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"repositoryId\":20}")
                        .requestAttr("userId", userId))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("无权访问此项目"));

        verify(projectService).verifyOwnership(projectId, userId);
        verifyNoInteractions(repositoryService, auditLogService, toolExecutionService, deliveryService);
    }

    @Test
    void seed_shouldRejectRepositoryOutsideProject() throws Exception {
        Long projectId = 10L;
        Long repositoryId = 20L;
        Long userId = 1L;
        Repository repository = Repository.builder()
                .id(repositoryId)
                .projectId(999L)
                .build();
        doNothing().when(projectService).verifyOwnership(projectId, userId);
        when(repositoryService.getDetail(repositoryId)).thenReturn(repository);

        mockMvc.perform(post("/api/dev/projects/10/audit-workbench-smoke-seed")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"repositoryId\":20}")
                        .requestAttr("userId", userId))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("仓库不属于当前项目"));

        verify(projectService).verifyOwnership(projectId, userId);
        verify(repositoryService).getDetail(repositoryId);
        verifyNoInteractions(auditLogService, toolExecutionService, deliveryService);
    }

    @Test
    void seed_shouldReturnNotFoundWhenRepositoryServiceThrowsNotFound() throws Exception {
        Long projectId = 10L;
        Long repositoryId = 20L;
        Long userId = 1L;
        doNothing().when(projectService).verifyOwnership(projectId, userId);
        when(repositoryService.getDetail(repositoryId)).thenThrow(BizException.notFound("Repository"));

        mockMvc.perform(post("/api/dev/projects/10/audit-workbench-smoke-seed")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"repositoryId\":20}")
                        .requestAttr("userId", userId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Repository not found"));

        verify(projectService).verifyOwnership(projectId, userId);
        verify(repositoryService).getDetail(repositoryId);
        verifyNoInteractions(auditLogService, toolExecutionService, deliveryService);
    }

    @Test
    void seed_shouldReturnNotFoundWhenRepositoryServiceReturnsNull() throws Exception {
        Long projectId = 10L;
        Long repositoryId = 20L;
        Long userId = 1L;
        doNothing().when(projectService).verifyOwnership(projectId, userId);
        when(repositoryService.getDetail(repositoryId)).thenReturn(null);

        mockMvc.perform(post("/api/dev/projects/10/audit-workbench-smoke-seed")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"repositoryId\":20}")
                        .requestAttr("userId", userId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Repository not found"));

        verify(projectService).verifyOwnership(projectId, userId);
        verify(repositoryService).getDetail(repositoryId);
        verifyNoInteractions(auditLogService, toolExecutionService, deliveryService);
    }
}
