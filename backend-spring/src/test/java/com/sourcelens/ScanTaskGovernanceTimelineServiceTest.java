package com.sourcelens;

import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.sourcelens.common.exception.BizException;
import com.sourcelens.module.agent.entity.AgentTask;
import com.sourcelens.module.agent.entity.AgentToolCall;
import com.sourcelens.module.agent.mapper.AgentTaskMapper;
import com.sourcelens.module.agent.mapper.AgentToolCallMapper;
import com.sourcelens.module.artifact.entity.ArtifactRecord;
import com.sourcelens.module.artifact.mapper.ArtifactRecordMapper;
import com.sourcelens.module.audit.entity.AuditLog;
import com.sourcelens.module.audit.mapper.AuditLogMapper;
import com.sourcelens.module.autorepair.entity.AutoRepair;
import com.sourcelens.module.autorepair.mapper.AutoRepairMapper;
import com.sourcelens.module.execution.entity.ExecutionTask;
import com.sourcelens.module.execution.service.ExecutionTaskService;
import com.sourcelens.module.scantask.dto.ScanGovernanceTimelineResponse;
import com.sourcelens.module.scantask.entity.ScanTask;
import com.sourcelens.module.scantask.service.ScanTaskGovernanceTimelineService;
import com.sourcelens.module.scantask.service.ScanTaskService;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ScanTaskGovernanceTimelineServiceTest {

    private ScanTaskService scanTaskService;
    private AutoRepairMapper autoRepairMapper;
    private AgentTaskMapper agentTaskMapper;
    private AgentToolCallMapper agentToolCallMapper;
    private AuditLogMapper auditLogMapper;
    private ArtifactRecordMapper artifactRecordMapper;
    private ExecutionTaskService executionTaskService;
    private ScanTaskGovernanceTimelineService service;

    @BeforeEach
    void setUp() {
        initTableInfo(ScanTask.class);
        initTableInfo(AutoRepair.class);
        initTableInfo(AgentTask.class);
        initTableInfo(AgentToolCall.class);
        initTableInfo(AuditLog.class);
        initTableInfo(ArtifactRecord.class);

        scanTaskService = mock(ScanTaskService.class);
        autoRepairMapper = mock(AutoRepairMapper.class);
        agentTaskMapper = mock(AgentTaskMapper.class);
        agentToolCallMapper = mock(AgentToolCallMapper.class);
        auditLogMapper = mock(AuditLogMapper.class);
        artifactRecordMapper = mock(ArtifactRecordMapper.class);
        executionTaskService = mock(ExecutionTaskService.class);
        service = new ScanTaskGovernanceTimelineService(scanTaskService, autoRepairMapper, agentTaskMapper,
                agentToolCallMapper, auditLogMapper, artifactRecordMapper, executionTaskService);
    }

    @Test
    @SuppressWarnings({"rawtypes", "unchecked"})
    void getTimeline_shouldScopeEveryResourceToProjectAndScanTask() {
        Long projectId = 10L;
        Long scanTaskId = 8801L;
        when(scanTaskService.getDetail(scanTaskId)).thenReturn(scanTask(projectId, scanTaskId));

        AutoRepair repair = AutoRepair.builder()
                .id(77L)
                .projectId(projectId)
                .repositoryId(100L)
                .scanTaskId(scanTaskId)
                .status("PATCH_READY")
                .targetDesc("current repair")
                .createdAt(LocalDateTime.now())
                .build();
        AgentTask agentTask = AgentTask.builder()
                .id(78L)
                .projectId(projectId)
                .scanTaskId(scanTaskId)
                .status("COMPLETED")
                .title("current agent")
                .createdAt(LocalDateTime.now())
                .build();
        AgentToolCall toolCall = AgentToolCall.builder()
                .id(79L)
                .projectId(projectId)
                .scanTaskId(scanTaskId)
                .toolName("read_file")
                .success(true)
                .createdAt(LocalDateTime.now())
                .build();
        AuditLog scanAuditLog = AuditLog.builder()
                .id(80L)
                .projectId(projectId)
                .resourceType("SCAN_TASK")
                .resourceId(scanTaskId)
                .action("SCAN_TASK_CREATE")
                .status("SUCCESS")
                .createdAt(LocalDateTime.now())
                .build();
        AuditLog repairAuditLog = AuditLog.builder()
                .id(82L)
                .projectId(projectId)
                .resourceType("AUTO_REPAIR")
                .resourceId(77L)
                .action("AUTO_REPAIR_PATCH_READY")
                .status("SUCCESS")
                .outputSummary("patch ready")
                .createdAt(LocalDateTime.now())
                .build();
        AuditLog candidateReceiptLog = AuditLog.builder()
                .id(86L)
                .projectId(projectId)
                .resourceType("AUTO_REPAIR")
                .resourceId(77L)
                .action("AUTO_REPAIR_CANDIDATE_CREATED")
                .status("SUCCESS")
                .inputJson("""
                        {"provenance":{"sourceType":"PROJECT_QA_VERIFIED_CITATION","scanTaskId":8801,"filePath":"src/App.java","sourceLabel":"C1","chunkId":901,"startLine":12,"endLine":24,"groundingStatus":"VERIFIED","citationEnforcementStatus":"DIRECT_VERIFIED","repairEvidenceGate":"READY","repairEvidenceGateSource":"SERVER_DERIVED","repairEvidenceGateReason":"QA citation, report evidence and target file are line-anchored for candidate review"}}
                        """)
                .outputSummary("自动修复候选已创建")
                .createdAt(LocalDateTime.now())
                .build();
        AuditLog agentAuditLog = AuditLog.builder()
                .id(83L)
                .projectId(projectId)
                .resourceType("AGENT_TASK")
                .resourceId(78L)
                .action("AGENT_TASK_CANCEL")
                .status("SUCCESS")
                .outputSummary("agent cancelled")
                .createdAt(LocalDateTime.now())
                .build();
        AuditLog prGateAuditLog = AuditLog.builder()
                .id(87L)
                .projectId(projectId)
                .resourceType("AUTO_REPAIR")
                .resourceId(77L)
                .action("AUTO_REPAIR_PR_REJECTED")
                .status("FAILED")
                .outputSummary("缺少 AUTO_REPAIR_PATCH_READY 成功审计事件，无法提交 PR")
                .createdAt(LocalDateTime.now())
                .build();
        ArtifactRecord scanArtifact = ArtifactRecord.builder()
                .id(81L)
                .projectId(projectId)
                .repositoryId(100L)
                .ownerType("SCAN_TASK")
                .ownerId(scanTaskId)
                .artifactType("ARCHITECTURE_REPORT")
                .sizeBytes(128L)
                .createdAt(LocalDateTime.now())
                .build();
        ArtifactRecord repairArtifact = ArtifactRecord.builder()
                .id(84L)
                .projectId(projectId)
                .repositoryId(100L)
                .ownerType("AUTO_REPAIR")
                .ownerId(77L)
                .artifactType("CHANGE_PATCH")
                .sizeBytes(256L)
                .createdAt(LocalDateTime.now())
                .build();
        ArtifactRecord agentArtifact = ArtifactRecord.builder()
                .id(85L)
                .projectId(projectId)
                .repositoryId(100L)
                .ownerType("AGENT_TASK")
                .ownerId(78L)
                .artifactType("AGENT_REPORT")
                .sizeBytes(512L)
                .createdAt(LocalDateTime.now())
                .build();

        when(autoRepairMapper.selectCount(any())).thenReturn(1L);
        when(autoRepairMapper.selectList(any())).thenReturn(List.of(repair));
        when(agentTaskMapper.selectCount(any())).thenReturn(1L);
        when(agentTaskMapper.selectList(any())).thenReturn(List.of(agentTask));
        when(agentToolCallMapper.selectCount(any())).thenReturn(1L);
        when(agentToolCallMapper.selectList(any())).thenReturn(List.of(toolCall));
        when(auditLogMapper.selectCount(any())).thenReturn(5L);
        when(auditLogMapper.selectList(any())).thenReturn(List.of(scanAuditLog, repairAuditLog, candidateReceiptLog, agentAuditLog, prGateAuditLog));
        when(artifactRecordMapper.selectCount(any())).thenReturn(3L);
        when(artifactRecordMapper.selectList(any())).thenReturn(List.of(scanArtifact, repairArtifact, agentArtifact));
        when(executionTaskService.getByProjectAndSource(projectId, "SCAN_TASK", scanTaskId))
                .thenReturn(executionTask(projectId, "SCAN_TASK", scanTaskId));
        when(executionTaskService.getByProjectAndSource(projectId, "AUTO_REPAIR", 77L))
                .thenReturn(executionTask(projectId, "AUTO_REPAIR", 77L));
        when(executionTaskService.getByProjectAndSource(projectId, "AGENT_TASK", 78L))
                .thenReturn(executionTask(projectId, "AGENT_TASK", 78L));
        when(executionTaskService.listSteps(any())).thenReturn(List.of());

        ScanGovernanceTimelineResponse response = service.getTimeline(projectId, scanTaskId);

        assertEquals(projectId, response.getProjectId());
        assertEquals(scanTaskId, response.getScanTaskId());
        assertEquals("ATTENTION", response.getSummary().getStatus());
        assertEquals(true, response.getSummary().getHasErrors());
        assertEquals(1L, response.getSummary().getCounts().get("autoRepairs"));
        assertEquals(5L, response.getSummary().getCounts().get("auditLogs"));
        assertEquals(3L, response.getSummary().getCounts().get("artifacts"));
        assertEquals(1, response.getResources().getAutoRepairs().size());
        assertEquals(5, response.getResources().getAuditLogs().size());
        assertEquals(3, response.getResources().getArtifacts().size());
        assertTrue(response.getResources().getArtifacts().stream().anyMatch(artifact ->
                "AUTO_REPAIR".equals(artifact.getOwnerType())
                        && Long.valueOf(77L).equals(artifact.getOwnerId())
                        && "CHANGE_PATCH".equals(artifact.getArtifactType())));
        assertTrue(response.getResources().getArtifacts().stream().anyMatch(artifact ->
                "AGENT_TASK".equals(artifact.getOwnerType())
                        && Long.valueOf(78L).equals(artifact.getOwnerId())
                        && "AGENT_REPORT".equals(artifact.getArtifactType())));
        assertTrue(response.getEvents().stream().anyMatch(event ->
                "AUDIT_LOG".equals(event.getEventType()) && "AUTO_REPAIR_PATCH_READY".equals(event.getTitle())));
        assertTrue(response.getEvents().stream().anyMatch(event ->
                "AUTO_REPAIR_CANDIDATE_RECEIPT".equals(event.getEventType())
                        && "候选来源凭证".equals(event.getTitle())
                        && event.getDetail().contains("PROJECT_QA_VERIFIED_CITATION")
                        && event.getDetail().contains("src/App.java")
                        && event.getDetail().contains("C1")
                        && event.getDetail().contains("门禁 READY")
                        && event.getDetail().contains("门禁来源 SERVER_DERIVED")
                        && event.getDetail().contains("line-anchored")
                        && "READY".equals(event.getRepairEvidenceGate())
                        && "SERVER_DERIVED".equals(event.getRepairEvidenceGateSource())
                        && event.getRepairEvidenceGateReason().contains("line-anchored")
                        && "AUTO_REPAIR".equals(event.getResource().getType())
                        && Long.valueOf(77L).equals(event.getResource().getId())
                        && "AUTO_REPAIR".equals(event.getActionTarget().getType())
                        && Long.valueOf(77L).equals(event.getActionTarget().getId())));
        assertTrue(response.getEvents().stream().anyMatch(event ->
                "AUDIT_LOG".equals(event.getEventType()) && "AGENT_TASK_CANCEL".equals(event.getTitle())));
        assertTrue(response.getEvents().stream().anyMatch(event ->
                "AGENT_TASK_EXECUTION".equals(event.getEventType())
                        && "Agent 执行任务 #1078".equals(event.getTitle())
                        && "EXECUTION_TASK".equals(event.getResource().getType())
                        && Long.valueOf(1078L).equals(event.getResource().getId())
                        && "AGENT_TASK".equals(event.getSource().getType())
                        && Long.valueOf(78L).equals(event.getSource().getId())
                        && "EXECUTION_TASK".equals(event.getActionTarget().getType())
                        && Long.valueOf(1078L).equals(event.getActionTarget().getId())));
        assertTrue(response.getEvents().stream().anyMatch(event ->
                "AUTO_REPAIR_PR_REJECTED".equals(event.getEventType())
                        && "PR Gate 已拒绝".equals(event.getTitle())
                        && "FAILED".equals(event.getStatus())
                        && event.getDetail().contains("缺少 AUTO_REPAIR_PATCH_READY")
                        && "AUTO_REPAIR".equals(event.getResource().getType())
                        && Long.valueOf(77L).equals(event.getResource().getId())
                        && "AUTO_REPAIR".equals(event.getActionTarget().getType())
                        && Long.valueOf(77L).equals(event.getActionTarget().getId())
                        && event.getAttribution().getReason().contains("AUTO_REPAIR_PR_*")));
        assertTrue(response.getEvents().stream().anyMatch(event ->
                "ARTIFACTS_ARCHIVED".equals(event.getEventType())
                        && "AUTO_REPAIR".equals(event.getResource().getType())
                        && event.getAttribution().getReason().contains("ownerType=AUTO_REPAIR")));
        assertTrue(response.getEvents().stream().anyMatch(event ->
                "ARTIFACTS_ARCHIVED".equals(event.getEventType())
                        && "AGENT_TASK".equals(event.getResource().getType())
                        && event.getAttribution().getReason().contains("ownerType=AGENT_TASK")));
        assertTrue(response.getEvents().stream()
                .filter(event -> "ARTIFACTS_ARCHIVED".equals(event.getEventType()))
                .noneMatch(event -> !"SCAN_TASK".equals(event.getResource().getType())
                        && event.getAttribution().getReason().contains("ownerType=SCAN_TASK ownerId=scanTaskId")));
        assertTrue(response.getEvents().stream().noneMatch(event ->
                String.valueOf(event.getDetail()).contains("FOREIGN_SCAN_SHOULD_NOT_RENDER")));

        ArgumentCaptor<LambdaQueryWrapper> autoRepairWrapper = ArgumentCaptor.forClass(LambdaQueryWrapper.class);
        ArgumentCaptor<LambdaQueryWrapper> agentTaskWrapper = ArgumentCaptor.forClass(LambdaQueryWrapper.class);
        ArgumentCaptor<LambdaQueryWrapper> toolCallWrapper = ArgumentCaptor.forClass(LambdaQueryWrapper.class);
        ArgumentCaptor<LambdaQueryWrapper> auditWrapper = ArgumentCaptor.forClass(LambdaQueryWrapper.class);
        ArgumentCaptor<LambdaQueryWrapper> artifactWrapper = ArgumentCaptor.forClass(LambdaQueryWrapper.class);

        verify(autoRepairMapper).selectList(autoRepairWrapper.capture());
        verify(agentTaskMapper).selectList(agentTaskWrapper.capture());
        verify(agentToolCallMapper).selectList(toolCallWrapper.capture());
        verify(auditLogMapper).selectList(auditWrapper.capture());
        verify(artifactRecordMapper).selectList(artifactWrapper.capture());

        assertSqlContains(autoRepairWrapper.getValue(), "project_id", "scan_task_id");
        assertSqlContains(agentTaskWrapper.getValue(), "project_id", "scan_task_id");
        assertSqlContains(toolCallWrapper.getValue(), "project_id", "scan_task_id");
        assertSqlContains(auditWrapper.getValue(), "project_id", "resource_type", "resource_id");
        assertParamValues(auditWrapper.getValue(), "SCAN_TASK", "AUTO_REPAIR", "AGENT_TASK", scanTaskId, 77L, 78L);
        assertSqlContains(artifactWrapper.getValue(), "project_id", "owner_type", "owner_id");
        assertParamValues(artifactWrapper.getValue(), "SCAN_TASK", "AUTO_REPAIR", "AGENT_TASK", scanTaskId, 77L, 78L);

        verify(executionTaskService).getByProjectAndSource(projectId, "SCAN_TASK", scanTaskId);
        verify(executionTaskService).getByProjectAndSource(projectId, "AUTO_REPAIR", 77L);
        verify(executionTaskService).getByProjectAndSource(projectId, "AGENT_TASK", 78L);
    }

    @Test
    void getTimeline_shouldRejectScanTaskFromAnotherProject() {
        when(scanTaskService.getDetail(9901L)).thenReturn(scanTask(99L, 9901L));

        assertThrows(BizException.class, () -> service.getTimeline(10L, 9901L));
    }

    @Test
    void getTimeline_shouldExposeTruncatedLimitsWhenResourceExceedsLimit() {
        Long projectId = 10L;
        Long scanTaskId = 8801L;
        when(scanTaskService.getDetail(scanTaskId)).thenReturn(scanTask(projectId, scanTaskId));
        when(autoRepairMapper.selectCount(any())).thenReturn(11L);
        when(autoRepairMapper.selectList(any())).thenReturn(List.of(AutoRepair.builder()
                .id(77L)
                .projectId(projectId)
                .repositoryId(100L)
                .scanTaskId(scanTaskId)
                .status("PATCH_READY")
                .createdAt(LocalDateTime.now())
                .build()));
        when(agentTaskMapper.selectCount(any())).thenReturn(0L);
        when(agentTaskMapper.selectList(any())).thenReturn(List.of());
        when(agentToolCallMapper.selectCount(any())).thenReturn(0L);
        when(agentToolCallMapper.selectList(any())).thenReturn(List.of());
        when(auditLogMapper.selectCount(any())).thenReturn(0L);
        when(auditLogMapper.selectList(any())).thenReturn(List.of());
        when(artifactRecordMapper.selectCount(any())).thenReturn(0L);
        when(artifactRecordMapper.selectList(any())).thenReturn(List.of());

        ScanGovernanceTimelineResponse response = service.getTimeline(projectId, scanTaskId);

        assertTrue(response.getTruncated());
        assertEquals(11L, response.getLimits().get("autoRepairs").getTotal());
        assertEquals(1, response.getLimits().get("autoRepairs").getReturned());
        assertTrue(response.getLimits().get("autoRepairs").getTruncated());
    }

    private static void assertSqlContains(LambdaQueryWrapper<?> wrapper, String... fragments) {
        String sqlSegment = wrapper.getSqlSegment();
        for (String fragment : fragments) {
            assertTrue(sqlSegment.contains(fragment), "SQL segment should contain " + fragment + ": " + sqlSegment);
        }
    }

    private static void assertParamValues(LambdaQueryWrapper<?> wrapper, Object... expectedValues) {
        List<Object> actualValues = wrapper.getParamNameValuePairs().values().stream().toList();
        for (Object expectedValue : expectedValues) {
            assertTrue(actualValues.contains(expectedValue),
                    "Wrapper params should contain " + expectedValue + ": " + actualValues);
        }
    }

    private static void initTableInfo(Class<?> entityClass) {
        if (TableInfoHelper.getTableInfo(entityClass) == null) {
            TableInfoHelper.initTableInfo(new MapperBuilderAssistant(new MybatisConfiguration(), ""), entityClass);
        }
    }

    private ScanTask scanTask(Long projectId, Long scanTaskId) {
        return ScanTask.builder()
                .id(scanTaskId)
                .projectId(projectId)
                .repositoryId(100L)
                .status("SUCCESS")
                .createdAt(LocalDateTime.now())
                .deleted(false)
                .build();
    }

    private ExecutionTask executionTask(Long projectId, String sourceType, Long sourceId) {
        return ExecutionTask.builder()
                .id(sourceId + 1000)
                .projectId(projectId)
                .repositoryId(100L)
                .taskType(sourceType)
                .sourceType(sourceType)
                .sourceId(sourceId)
                .status("SUCCESS")
                .progress(100)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }
}
