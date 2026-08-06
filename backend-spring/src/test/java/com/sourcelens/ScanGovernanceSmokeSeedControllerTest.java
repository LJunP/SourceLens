package com.sourcelens;

import com.sourcelens.common.exception.BizException;
import com.sourcelens.common.exception.GlobalExceptionHandler;
import com.sourcelens.module.agent.entity.AgentTask;
import com.sourcelens.module.agent.mapper.AgentTaskMapper;
import com.sourcelens.module.artifact.entity.ArtifactRecord;
import com.sourcelens.module.artifact.service.ArtifactStorageService;
import com.sourcelens.module.audit.service.AuditLogService;
import com.sourcelens.module.autorepair.entity.AutoRepair;
import com.sourcelens.module.autorepair.mapper.AutoRepairMapper;
import com.sourcelens.module.execution.entity.ExecutionTask;
import com.sourcelens.module.execution.service.ExecutionTaskService;
import com.sourcelens.module.project.service.ProjectService;
import com.sourcelens.module.repository.entity.Repository;
import com.sourcelens.module.repository.service.RepositoryService;
import com.sourcelens.module.scantask.controller.ScanGovernanceSmokeSeedController;
import com.sourcelens.module.scantask.entity.ScanTask;
import com.sourcelens.module.scantask.service.ScanTaskService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ScanGovernanceSmokeSeedControllerTest {

    private ProjectService projectService;
    private RepositoryService repositoryService;
    private ScanTaskService scanTaskService;
    private AutoRepairMapper autoRepairMapper;
    private AgentTaskMapper agentTaskMapper;
    private ArtifactStorageService artifactStorageService;
    private AuditLogService auditLogService;
    private ExecutionTaskService executionTaskService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        projectService = mock(ProjectService.class);
        repositoryService = mock(RepositoryService.class);
        scanTaskService = mock(ScanTaskService.class);
        autoRepairMapper = mock(AutoRepairMapper.class);
        agentTaskMapper = mock(AgentTaskMapper.class);
        artifactStorageService = mock(ArtifactStorageService.class);
        auditLogService = mock(AuditLogService.class);
        executionTaskService = mock(ExecutionTaskService.class);
        mockMvc = MockMvcBuilders
                .standaloneSetup(new ScanGovernanceSmokeSeedController(
                        projectService,
                        repositoryService,
                        scanTaskService,
                        autoRepairMapper,
                        agentTaskMapper,
                        artifactStorageService,
                        auditLogService,
                        executionTaskService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void controller_shouldOnlyBeEnabledForDevOrTestWithoutProdProfile() {
        Profile profile = ScanGovernanceSmokeSeedController.class.getAnnotation(Profile.class);

        assertNotNull(profile);
        assertArrayEquals(new String[]{"dev & !prod", "test & !prod"}, profile.value());
    }

    @Test
    @SuppressWarnings("unchecked")
    void seed_shouldWriteDerivedAuditAndArtifactsForOwnedSuccessfulScan() throws Exception {
        Long projectId = 10L;
        Long repositoryId = 20L;
        Long scanTaskId = 30L;
        Long userId = 1L;
        Repository repository = Repository.builder().id(repositoryId).projectId(projectId).build();
        ScanTask scanTask = ScanTask.builder()
                .id(scanTaskId)
                .projectId(projectId)
                .repositoryId(repositoryId)
                .status("SUCCESS")
                .build();
        ArgumentCaptor<AutoRepair> repairCaptor = ArgumentCaptor.forClass(AutoRepair.class);
        ArgumentCaptor<AgentTask> agentTaskCaptor = ArgumentCaptor.forClass(AgentTask.class);
        ArgumentCaptor<Map<String, Object>> auditInputCaptor = ArgumentCaptor.forClass(Map.class);

        doNothing().when(projectService).verifyOwnership(projectId, userId);
        when(repositoryService.getDetail(repositoryId)).thenReturn(repository);
        when(scanTaskService.getById(scanTaskId)).thenReturn(scanTask);
        doAnswer(invocation -> {
            AutoRepair repair = invocation.getArgument(0);
            repair.setId(101L);
            return 1;
        }).when(autoRepairMapper).insert(any(AutoRepair.class));
        doAnswer(invocation -> {
            AgentTask task = invocation.getArgument(0);
            task.setId(202L);
            return 1;
        }).when(agentTaskMapper).insert(any(AgentTask.class));
        when(artifactStorageService.storeText(eq(projectId), eq(repositoryId), eq("AUTO_REPAIR"), eq(101L),
                eq("CHANGE_PATCH"), eq("governance-smoke.patch"), eq("text/x-diff"), any(), eq(userId)))
                .thenReturn(ArtifactRecord.builder().id(301L).artifactType("CHANGE_PATCH").build());
        when(artifactStorageService.storeText(eq(projectId), eq(repositoryId), eq("AGENT_TASK"), eq(202L),
                eq("AGENT_REPORT"), eq("governance-agent-report.json"), eq("application/json"), any(), eq(userId)))
                .thenReturn(ArtifactRecord.builder().id(302L).artifactType("AGENT_REPORT").build());
        when(executionTaskService.create(projectId, repositoryId, "AUTO_REPAIR", "AUTO_REPAIR", 101L, userId))
                .thenReturn(ExecutionTask.builder().id(401L).build());
        when(executionTaskService.create(projectId, repositoryId, "AGENT_TASK", "AGENT_TASK", 202L, userId))
                .thenReturn(ExecutionTask.builder().id(402L).build());

        mockMvc.perform(post("/api/dev/projects/10/scan-governance-smoke-seed")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"repositoryId\":20,\"scanTaskId\":30}")
                        .requestAttr("userId", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.seedId").isNotEmpty())
                .andExpect(jsonPath("$.data.autoRepairId").value(101))
                .andExpect(jsonPath("$.data.agentTaskId").value(202))
                .andExpect(jsonPath("$.data.repairExecutionTaskId").value(401))
                .andExpect(jsonPath("$.data.agentExecutionTaskId").value(402))
                .andExpect(jsonPath("$.data.patchArtifactId").value(301))
                .andExpect(jsonPath("$.data.agentReportArtifactId").value(302))
                .andExpect(jsonPath("$.data.autoRepairAuditAction").value("AUTO_REPAIR_PATCH_READY"))
                .andExpect(jsonPath("$.data.agentTaskAuditAction").value("AGENT_TASK_SMOKE_READY"))
                .andExpect(jsonPath("$.data.patchArtifactType").value("CHANGE_PATCH"))
                .andExpect(jsonPath("$.data.agentReportArtifactType").value("AGENT_REPORT"));

        verify(projectService).verifyOwnership(projectId, userId);
        verify(repositoryService).getDetail(repositoryId);
        verify(scanTaskService).getById(scanTaskId);
        verify(autoRepairMapper).insert(repairCaptor.capture());
        verify(agentTaskMapper).insert(agentTaskCaptor.capture());
        verify(auditLogService).record(eq(userId), eq(projectId), eq("AUTO_REPAIR"), eq(101L),
                eq("AUTO_REPAIR_PATCH_READY"), eq("SUCCESS"), auditInputCaptor.capture(),
                eq("AutoRepair patch smoke artifact ready"), eq(0L), any());
        verify(auditLogService).record(eq(userId), eq(projectId), eq("AGENT_TASK"), eq(202L),
                eq("AGENT_TASK_SMOKE_READY"), eq("SUCCESS"), auditInputCaptor.capture(),
                eq("Agent task smoke report artifact ready"), eq(0L), any());
        verify(executionTaskService).create(projectId, repositoryId, "AUTO_REPAIR", "AUTO_REPAIR", 101L, userId);
        verify(executionTaskService).startStep(401L, "generate_patch", "生成补丁");
        verify(executionTaskService).completeStep(401L, "generate_patch", "public repo governance smoke patch generated");
        verify(executionTaskService).markSuccess(401L, "generate_patch");
        verify(executionTaskService).create(projectId, repositoryId, "AGENT_TASK", "AGENT_TASK", 202L, userId);
        verify(executionTaskService).startStep(402L, "generate_report", "生成 Agent 报告");
        verify(executionTaskService).completeStep(402L, "generate_report", "public repo governance smoke agent report generated");
        verify(executionTaskService).markSuccess(402L, "generate_report");

        assertEquals(scanTaskId, repairCaptor.getValue().getScanTaskId());
        assertEquals("PATCH_READY", repairCaptor.getValue().getStatus());
        assertEquals("COMPLETED", agentTaskCaptor.getValue().getStatus());
        assertEquals(false, agentTaskCaptor.getValue().getDeleted());
        assertEquals(scanTaskId, auditInputCaptor.getAllValues().get(0).get("scanTaskId"));
        assertEquals("CHANGE_PATCH", auditInputCaptor.getAllValues().get(0).get("artifactType"));
        assertEquals("AGENT_REPORT", auditInputCaptor.getAllValues().get(1).get("artifactType"));
    }

    @Test
    void seed_shouldRejectMissingRepositoryIdOrScanTaskId() throws Exception {
        Long projectId = 10L;
        Long userId = 1L;
        doNothing().when(projectService).verifyOwnership(projectId, userId);

        mockMvc.perform(post("/api/dev/projects/10/scan-governance-smoke-seed")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"repositoryId\":20}")
                        .requestAttr("userId", userId))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("repositoryId 和 scanTaskId 不能为空"));

        verify(projectService).verifyOwnership(projectId, userId);
        verifyNoInteractions(repositoryService, scanTaskService, autoRepairMapper, agentTaskMapper, artifactStorageService, auditLogService, executionTaskService);
    }

    @Test
    void seed_shouldStopBeforeWritesWhenOwnershipFails() throws Exception {
        Long projectId = 10L;
        Long userId = 1L;
        doThrow(BizException.forbidden("无权访问此项目")).when(projectService).verifyOwnership(projectId, userId);

        mockMvc.perform(post("/api/dev/projects/10/scan-governance-smoke-seed")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"repositoryId\":20,\"scanTaskId\":30}")
                        .requestAttr("userId", userId))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("无权访问此项目"));

        verify(projectService).verifyOwnership(projectId, userId);
        verifyNoInteractions(repositoryService, scanTaskService, autoRepairMapper, agentTaskMapper, artifactStorageService, auditLogService, executionTaskService);
    }

    @Test
    void seed_shouldRejectRepositoryOutsideProject() throws Exception {
        Long projectId = 10L;
        Long repositoryId = 20L;
        Long userId = 1L;
        doNothing().when(projectService).verifyOwnership(projectId, userId);
        when(repositoryService.getDetail(repositoryId)).thenReturn(Repository.builder().id(repositoryId).projectId(999L).build());

        mockMvc.perform(post("/api/dev/projects/10/scan-governance-smoke-seed")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"repositoryId\":20,\"scanTaskId\":30}")
                        .requestAttr("userId", userId))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("仓库不属于当前项目"));

        verify(projectService).verifyOwnership(projectId, userId);
        verify(repositoryService).getDetail(repositoryId);
        verifyNoInteractions(scanTaskService, autoRepairMapper, agentTaskMapper, artifactStorageService, auditLogService, executionTaskService);
    }

    @Test
    void seed_shouldRejectScanOutsideProjectRepository() throws Exception {
        Long projectId = 10L;
        Long repositoryId = 20L;
        Long scanTaskId = 30L;
        Long userId = 1L;
        doNothing().when(projectService).verifyOwnership(projectId, userId);
        when(repositoryService.getDetail(repositoryId)).thenReturn(Repository.builder().id(repositoryId).projectId(projectId).build());
        when(scanTaskService.getById(scanTaskId)).thenReturn(ScanTask.builder()
                .id(scanTaskId)
                .projectId(projectId)
                .repositoryId(999L)
                .status("SUCCESS")
                .build());

        mockMvc.perform(post("/api/dev/projects/10/scan-governance-smoke-seed")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"repositoryId\":20,\"scanTaskId\":30}")
                        .requestAttr("userId", userId))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("扫描任务不属于当前项目仓库"));

        verifyNoInteractions(autoRepairMapper, agentTaskMapper, artifactStorageService, auditLogService, executionTaskService);
    }

    @Test
    void seed_shouldRejectUnsuccessfulScan() throws Exception {
        Long projectId = 10L;
        Long repositoryId = 20L;
        Long scanTaskId = 30L;
        Long userId = 1L;
        doNothing().when(projectService).verifyOwnership(projectId, userId);
        when(repositoryService.getDetail(repositoryId)).thenReturn(Repository.builder().id(repositoryId).projectId(projectId).build());
        when(scanTaskService.getById(scanTaskId)).thenReturn(ScanTask.builder()
                .id(scanTaskId)
                .projectId(projectId)
                .repositoryId(repositoryId)
                .status("FAILED")
                .build());

        mockMvc.perform(post("/api/dev/projects/10/scan-governance-smoke-seed")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"repositoryId\":20,\"scanTaskId\":30}")
                        .requestAttr("userId", userId))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("扫描任务必须成功后才能生成治理 smoke 样本"));

        verifyNoInteractions(autoRepairMapper, agentTaskMapper, artifactStorageService, auditLogService, executionTaskService);
    }
}
