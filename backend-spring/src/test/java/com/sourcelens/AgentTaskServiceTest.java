package com.sourcelens;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sourcelens.module.agent.dto.AddStepRequest;
import com.sourcelens.module.agent.dto.CompleteTaskRequest;
import com.sourcelens.module.agent.dto.CreateAgentTaskRequest;
import com.sourcelens.module.agent.dto.UpdateStepRequest;
import com.sourcelens.module.agent.entity.AgentTask;
import com.sourcelens.module.agent.entity.AgentTaskStep;
import com.sourcelens.module.agent.entity.Conversation;
import com.sourcelens.module.agent.mapper.AgentTaskMapper;
import com.sourcelens.module.agent.mapper.AgentTaskStepMapper;
import com.sourcelens.module.agent.mapper.ConversationMapper;
import com.sourcelens.module.agent.service.AgentTaskService;
import com.sourcelens.module.agent.service.LlmClient;
import com.sourcelens.module.agent.service.LlmConfigService;
import com.sourcelens.module.analysis.mapper.CodeRelationMapper;
import com.sourcelens.module.analysis.mapper.CodeSymbolMapper;
import com.sourcelens.module.analysis.mapper.ScanArtifactMapper;
import com.sourcelens.module.artifact.service.ArtifactStorageService;
import com.sourcelens.common.exception.BizException;
import com.sourcelens.module.execution.entity.ExecutionTask;
import com.sourcelens.module.execution.service.ExecutionTaskService;
import com.sourcelens.module.scantask.entity.ScanTask;
import com.sourcelens.module.scantask.mapper.ScanTaskMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AgentTaskServiceTest {

    @Mock
    private AgentTaskStepMapper stepMapper;

    @Mock
    private ScanArtifactMapper artifactMapper;

    @Mock
    private CodeSymbolMapper symbolMapper;

    @Mock
    private CodeRelationMapper relationMapper;

    @Mock
    private LlmClient llmClient;

    @Mock
    private LlmConfigService llmConfigService;

    @Mock
    private ConversationMapper conversationMapper;

    @Mock
    private ScanTaskMapper scanTaskMapper;

    @Mock
    private ExecutionTaskService executionTaskService;

    @Mock
    private ArtifactStorageService artifactStorageService;

    @Mock
    private AgentTaskService self;

    @Mock
    private AgentTaskMapper agentTaskMapper;

    @InjectMocks
    private AgentTaskService agentTaskService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(agentTaskService, "baseMapper", agentTaskMapper);
    }

    @Test
    void create_shouldCreateConversationAndExecutionTask() {
        doAnswer(invocation -> {
            AgentTask task = invocation.getArgument(0);
            task.setId(77L);
            return 1;
        }).when(agentTaskMapper).insert(any(AgentTask.class));
        doAnswer(invocation -> {
            Conversation conversation = invocation.getArgument(0);
            conversation.setId(88L);
            return 1;
        }).when(conversationMapper).insert(any(Conversation.class));

        CreateAgentTaskRequest req = new CreateAgentTaskRequest();
        req.setProjectId(10L);
        req.setTaskType("ARCHITECTURE_REVIEW");
        req.setTitle("架构审查");

        AgentTask task = agentTaskService.create(req, 1L);

        assertEquals(77L, task.getId());
        assertEquals(88L, task.getConversationId());
        verify(executionTaskService).create(10L, null, "AGENT", "AGENT_TASK", 77L, 1L);
    }

    @Test
    void create_shouldBindExistingConversationWhenRequested() {
        when(conversationMapper.selectById(88L)).thenReturn(Conversation.builder()
                .id(88L)
                .projectId(10L)
                .agentTaskId(null)
                .title("已有代码理解对话")
                .status("ACTIVE")
                .createdBy(1L)
                .build());
        doAnswer(invocation -> {
            AgentTask task = invocation.getArgument(0);
            task.setId(77L);
            return 1;
        }).when(agentTaskMapper).insert(any(AgentTask.class));
        when(conversationMapper.update(any(Conversation.class), any())).thenReturn(1);

        CreateAgentTaskRequest req = new CreateAgentTaskRequest();
        req.setProjectId(10L);
        req.setConversationId(88L);
        req.setScanTaskId(null);
        req.setTaskType("CUSTOM");
        req.setTitle("代码理解交接复核");

        AgentTask task = agentTaskService.create(req, 1L);

        assertEquals(77L, task.getId());
        assertEquals(88L, task.getConversationId());
        verify(conversationMapper, never()).insert(any(Conversation.class));
        ArgumentCaptor<Conversation> conversationCaptor = ArgumentCaptor.forClass(Conversation.class);
        verify(conversationMapper).update(conversationCaptor.capture(), any());
        assertEquals(88L, conversationCaptor.getValue().getId());
        assertEquals(77L, conversationCaptor.getValue().getAgentTaskId());
        verify(agentTaskMapper, never()).updateById(any(AgentTask.class));
        verify(executionTaskService).create(10L, null, "AGENT", "AGENT_TASK", 77L, 1L);
    }

    @Test
    void create_shouldRejectConversationFromOtherProject() {
        when(conversationMapper.selectById(88L)).thenReturn(Conversation.builder()
                .id(88L)
                .projectId(99L)
                .agentTaskId(null)
                .status("ACTIVE")
                .createdBy(1L)
                .build());

        CreateAgentTaskRequest req = new CreateAgentTaskRequest();
        req.setProjectId(10L);
        req.setConversationId(88L);
        req.setTaskType("CUSTOM");
        req.setTitle("跨项目对话绑定");

        BizException ex = assertThrows(BizException.class, () -> agentTaskService.create(req, 1L));

        assertEquals("BAD_REQUEST", ex.getCode());
        assertEquals("指定对话不属于当前项目", ex.getMessage());
        verify(agentTaskMapper, never()).insert(any(AgentTask.class));
        verify(conversationMapper, never()).updateById(any(Conversation.class));
    }

    @Test
    void create_shouldRejectAlreadyBoundConversation() {
        when(conversationMapper.selectById(88L)).thenReturn(Conversation.builder()
                .id(88L)
                .projectId(10L)
                .agentTaskId(66L)
                .status("ACTIVE")
                .createdBy(1L)
                .build());

        CreateAgentTaskRequest req = new CreateAgentTaskRequest();
        req.setProjectId(10L);
        req.setConversationId(88L);
        req.setTaskType("CUSTOM");
        req.setTitle("重复绑定对话");

        BizException ex = assertThrows(BizException.class, () -> agentTaskService.create(req, 1L));

        assertEquals("CONFLICT", ex.getCode());
        assertEquals("指定对话已绑定 Agent 任务", ex.getMessage());
        verify(agentTaskMapper, never()).insert(any(AgentTask.class));
        verify(conversationMapper, never()).updateById(any(Conversation.class));
        verify(conversationMapper, never()).update(any(Conversation.class), any());
    }

    @Test
    void create_shouldRejectConcurrentConversationBinding() {
        when(conversationMapper.selectById(88L)).thenReturn(Conversation.builder()
                .id(88L)
                .projectId(10L)
                .agentTaskId(null)
                .status("ACTIVE")
                .createdBy(1L)
                .build());
        doAnswer(invocation -> {
            AgentTask task = invocation.getArgument(0);
            task.setId(77L);
            return 1;
        }).when(agentTaskMapper).insert(any(AgentTask.class));
        when(conversationMapper.update(any(Conversation.class), any())).thenReturn(0);

        CreateAgentTaskRequest req = new CreateAgentTaskRequest();
        req.setProjectId(10L);
        req.setConversationId(88L);
        req.setTaskType("CUSTOM");
        req.setTitle("并发绑定对话");

        BizException ex = assertThrows(BizException.class, () -> agentTaskService.create(req, 1L));

        assertEquals("CONFLICT", ex.getCode());
        assertEquals("指定对话已绑定 Agent 任务", ex.getMessage());
        verify(executionTaskService, never()).create(any(), any(), any(), any(), any(), any());
    }

    @Test
    void create_shouldAcceptRequestedSuccessfulScanTaskInSameProject() {
        when(scanTaskMapper.selectById(42L)).thenReturn(ScanTask.builder()
                .id(42L)
                .projectId(10L)
                .status("SUCCESS")
                .deleted(false)
                .build());
        doAnswer(invocation -> {
            AgentTask task = invocation.getArgument(0);
            task.setId(77L);
            return 1;
        }).when(agentTaskMapper).insert(any(AgentTask.class));
        doAnswer(invocation -> {
            Conversation conversation = invocation.getArgument(0);
            conversation.setId(88L);
            return 1;
        }).when(conversationMapper).insert(any(Conversation.class));

        CreateAgentTaskRequest req = new CreateAgentTaskRequest();
        req.setProjectId(10L);
        req.setScanTaskId(42L);
        req.setTaskType("ARCHITECTURE_REVIEW");
        req.setTitle("报告绑定架构审查");

        AgentTask task = agentTaskService.create(req, 1L);

        assertEquals(42L, task.getScanTaskId());
        verify(agentTaskMapper).insert(any(AgentTask.class));
    }

    @Test
    void create_shouldRejectRequestedScanTaskFromOtherProject() {
        when(scanTaskMapper.selectById(42L)).thenReturn(ScanTask.builder()
                .id(42L)
                .projectId(99L)
                .status("SUCCESS")
                .deleted(false)
                .build());
        CreateAgentTaskRequest req = new CreateAgentTaskRequest();
        req.setProjectId(10L);
        req.setScanTaskId(42L);
        req.setTaskType("ARCHITECTURE_REVIEW");
        req.setTitle("跨项目任务");

        BizException ex = assertThrows(BizException.class, () -> agentTaskService.create(req, 1L));

        assertEquals("BAD_REQUEST", ex.getCode());
        assertEquals("指定扫描任务不属于当前项目", ex.getMessage());
        verify(agentTaskMapper, never()).insert(any(AgentTask.class));
    }

    @Test
    void create_shouldRejectRequestedScanTaskThatIsNotSuccessful() {
        when(scanTaskMapper.selectById(42L)).thenReturn(ScanTask.builder()
                .id(42L)
                .projectId(10L)
                .status("RUNNING")
                .deleted(false)
                .build());
        CreateAgentTaskRequest req = new CreateAgentTaskRequest();
        req.setProjectId(10L);
        req.setScanTaskId(42L);
        req.setTaskType("RISK_SCAN");
        req.setTitle("未完成扫描任务");

        BizException ex = assertThrows(BizException.class, () -> agentTaskService.create(req, 1L));

        assertEquals("BAD_REQUEST", ex.getCode());
        assertEquals("指定扫描任务尚未成功完成", ex.getMessage());
        verify(agentTaskMapper, never()).insert(any(AgentTask.class));
    }

    @Test
    @SuppressWarnings({"rawtypes", "unchecked"})
    void listByProject_shouldFilterByScanTaskIdWhenProvided() {
        if (TableInfoHelper.getTableInfo(AgentTask.class) == null) {
            TableInfoHelper.initTableInfo(new MapperBuilderAssistant(new MybatisConfiguration(), ""), AgentTask.class);
        }
        Page<AgentTask> expected = new Page<>(1, 20, 1);
        when(agentTaskMapper.selectPage(any(), any())).thenReturn(expected);
        ArgumentCaptor<LambdaQueryWrapper> wrapperCaptor = ArgumentCaptor.forClass(LambdaQueryWrapper.class);

        Page<AgentTask> result = agentTaskService.listByProject(10L, 1, 20, "PENDING", 42L);

        assertSame(expected, result);
        verify(agentTaskMapper).selectPage(any(), wrapperCaptor.capture());
        String sqlSegment = wrapperCaptor.getValue().getSqlSegment();
        assertTrue(sqlSegment.contains("project_id"));
        assertTrue(sqlSegment.contains("status"));
        assertTrue(sqlSegment.contains("scan_task_id"));
    }

    @Test
    void start_pendingTask_shouldConditionallyMarkRunningAndExecuteAsync() {
        AgentTask task = AgentTask.builder()
                .id(77L)
                .projectId(10L)
                .status("PENDING")
                .deleted(false)
                .build();
        when(agentTaskMapper.selectById(77L)).thenReturn(task);
        when(agentTaskMapper.update(any(AgentTask.class), any())).thenReturn(1);
        when(executionTaskService.findBySource("AGENT_TASK", 77L))
                .thenReturn(ExecutionTask.builder().id(99L).build());

        AgentTask started = agentTaskService.start(77L);

        assertEquals("RUNNING", started.getStatus());
        verify(executionTaskService).markRunning(99L, "agent_analysis");
        verify(self).executeAnalysis(77L);
    }

    @Test
    void start_concurrentStatusChange_shouldRejectWithoutSideEffects() {
        AgentTask task = AgentTask.builder()
                .id(77L)
                .projectId(10L)
                .status("PENDING")
                .deleted(false)
                .build();
        when(agentTaskMapper.selectById(77L)).thenReturn(task);
        when(agentTaskMapper.update(any(AgentTask.class), any())).thenReturn(0);

        BizException ex = assertThrows(BizException.class, () -> agentTaskService.start(77L));

        assertEquals("BAD_REQUEST", ex.getCode());
        assertEquals("任务已被启动或状态已变化，请刷新后重试", ex.getMessage());
        verify(executionTaskService, never()).markRunning(any(), any());
        verify(self, never()).executeAnalysis(77L);
    }

    @Test
    void updateStep_shouldSyncCompletedStepToExecutionTask() {
        AgentTaskStep step = AgentTaskStep.builder()
                .id(55L)
                .taskId(77L)
                .toolName("read_file")
                .description("读取文件")
                .status("RUNNING")
                .build();
        ExecutionTask executionTask = ExecutionTask.builder().id(99L).build();
        when(stepMapper.selectById(55L)).thenReturn(step);
        when(executionTaskService.findBySource("AGENT_TASK", 77L)).thenReturn(executionTask);

        UpdateStepRequest req = new UpdateStepRequest();
        req.setStatus("COMPLETED");
        req.setOutputJson("{}");

        AgentTaskStep updated = agentTaskService.updateStep(55L, req);

        assertEquals("COMPLETED", updated.getStatus());
        verify(executionTaskService).completeStep(99L, "read_file", "读取文件");
    }

    @Test
    void updateStep_shouldSanitizeOutputAndError() {
        AgentTaskStep step = AgentTaskStep.builder()
                .id(55L)
                .taskId(77L)
                .toolName("shell_exec")
                .description("执行测试")
                .status("RUNNING")
                .build();
        when(stepMapper.selectById(55L)).thenReturn(step);
        when(executionTaskService.findBySource("AGENT_TASK", 77L))
                .thenReturn(ExecutionTask.builder().id(99L).build());

        UpdateStepRequest req = new UpdateStepRequest();
        req.setStatus("FAILED");
        req.setOutputJson("{\"token\":\"ghp_abcdefghijklmnopqrstuvwxyz123456\"}");
        req.setErrorMessage("Authorization: Bearer live-token");

        AgentTaskStep updated = agentTaskService.updateStep(55L, req);

        assertTrue(updated.getOutputJson().contains("\"token\":\"****\""));
        assertFalse(updated.getOutputJson().contains("abcdefghijklmnopqrstuvwxyz123456"));
        assertTrue(updated.getErrorMessage().contains("Bearer ****"));
        assertFalse(updated.getErrorMessage().contains("live-token"));
        verify(executionTaskService).failStep(99L, "shell_exec", "Authorization: Bearer ****");
    }

    @Test
    void complete_shouldSanitizeAndTruncateOutputBeforePersistingArtifact() {
        AgentTask task = AgentTask.builder()
                .id(77L)
                .projectId(10L)
                .status("RUNNING")
                .deleted(false)
                .createdBy(1L)
                .build();
        when(agentTaskMapper.selectById(77L)).thenReturn(task);

        CompleteTaskRequest req = new CompleteTaskRequest();
        req.setStatus("COMPLETED");
        req.setSummary("api_key=sk-12345678abcdefghijklmnop");
        req.setOutputJson("{\"token\":\"github_pat_abcdefghijklmnopqrstuvwxyz1234567890\",\"data\":\""
                + "x".repeat(20_000) + "\"}");

        AgentTask completed = agentTaskService.complete(77L, req);

        assertTrue(completed.getSummary().contains("api_key=****"));
        assertFalse(completed.getSummary().contains("12345678abcdefghijklmnop"));
        assertFalse(completed.getOutputJson().contains("abcdefghijklmnopqrstuvwxyz1234567890"));
        assertTrue(completed.getOutputJson().endsWith("... [truncated]"));
        verify(artifactStorageService).deleteByOwner("AGENT_TASK", 77L);
        verify(artifactStorageService).storeText(
                eq(10L),
                eq(null),
                eq("AGENT_TASK"),
                eq(77L),
                eq("AGENT_REPORT"),
                eq("agent-report.json"),
                eq("application/json"),
                eq(completed.getOutputJson()),
                eq(1L));
    }

    @Test
    void addStep_shouldCreateExecutionStepWithFallbackKey() {
        AgentTask task = AgentTask.builder()
                .id(77L)
                .projectId(10L)
                .deleted(false)
                .build();
        when(agentTaskMapper.selectById(77L)).thenReturn(task);
        when(stepMapper.selectCount(any())).thenReturn(0L);
        doAnswer(invocation -> {
            AgentTaskStep step = invocation.getArgument(0);
            step.setId(56L);
            return 1;
        }).when(stepMapper).insert(any(AgentTaskStep.class));
        when(executionTaskService.findBySource("AGENT_TASK", 77L))
                .thenReturn(ExecutionTask.builder().id(99L).build());

        AddStepRequest req = new AddStepRequest();
        req.setStepType("ANALYSIS");
        req.setDescription("人工步骤");

        AgentTaskStep step = agentTaskService.addStep(77L, req);

        assertEquals(56L, step.getId());
        verify(executionTaskService).startStep(99L, "agent_step_56", "人工步骤");
    }

    @Test
    void cancel_shouldSyncCancelledExecutionTask() {
        AgentTask task = AgentTask.builder()
                .id(77L)
                .projectId(10L)
                .status("RUNNING")
                .deleted(false)
                .build();
        when(agentTaskMapper.selectById(77L)).thenReturn(task);
        when(executionTaskService.findBySource("AGENT_TASK", 77L))
                .thenReturn(ExecutionTask.builder().id(99L).build());

        AgentTask cancelled = agentTaskService.cancel(77L);

        assertEquals("CANCELLED", cancelled.getStatus());
        verify(executionTaskService).markCancelled(99L, "cancelled", "Agent 任务已取消");
    }

    @Test
    void cancel_shouldRejectTerminalTask() {
        AgentTask task = AgentTask.builder()
                .id(77L)
                .projectId(10L)
                .status("CANCELLED")
                .deleted(false)
                .build();
        when(agentTaskMapper.selectById(77L)).thenReturn(task);

        assertThrows(BizException.class, () -> agentTaskService.cancel(77L));
        verify(agentTaskMapper, never()).updateById(any(AgentTask.class));
    }

    @Test
    void complete_shouldRejectTerminalTask() {
        AgentTask task = AgentTask.builder()
                .id(77L)
                .projectId(10L)
                .status("CANCELLED")
                .deleted(false)
                .build();
        when(agentTaskMapper.selectById(77L)).thenReturn(task);

        CompleteTaskRequest req = new CompleteTaskRequest();
        req.setStatus("COMPLETED");

        assertThrows(BizException.class, () -> agentTaskService.complete(77L, req));
        verify(agentTaskMapper, never()).updateById(any(AgentTask.class));
    }

    @Test
    void executeAnalysis_shouldKeepCancelledTaskCancelled() {
        AgentTask running = AgentTask.builder()
                .id(77L)
                .projectId(10L)
                .scanTaskId(42L)
                .taskType("ARCHITECTURE_REVIEW")
                .status("RUNNING")
                .createdBy(1L)
                .deleted(false)
                .build();
        AgentTask cancelled = AgentTask.builder()
                .id(77L)
                .projectId(10L)
                .scanTaskId(42L)
                .taskType("ARCHITECTURE_REVIEW")
                .status("CANCELLED")
                .createdBy(1L)
                .deleted(false)
                .build();
        when(agentTaskMapper.selectById(77L)).thenReturn(running, cancelled);
        when(executionTaskService.findBySource("AGENT_TASK", 77L))
                .thenReturn(ExecutionTask.builder().id(99L).build());

        agentTaskService.executeAnalysis(77L);

        verify(executionTaskService).cancelStep(99L, "load_scan_artifacts", "Agent 任务已取消");
        verify(executionTaskService).markCancelled(99L, "load_scan_artifacts", "Agent 任务已取消");
        verify(agentTaskMapper, never()).updateById(any(AgentTask.class));
    }

    @Test
    void complete_shouldStoreAgentReportArtifact() {
        AgentTask task = AgentTask.builder()
                .id(77L)
                .projectId(10L)
                .status("RUNNING")
                .createdBy(1L)
                .deleted(false)
                .build();
        when(agentTaskMapper.selectById(77L)).thenReturn(task);

        CompleteTaskRequest req = new CompleteTaskRequest();
        req.setStatus("COMPLETED");
        req.setOutputJson("{\"summary\":\"ok\"}");
        req.setSummary("完成");

        AgentTask completed = agentTaskService.complete(77L, req);

        assertEquals("COMPLETED", completed.getStatus());
        verify(artifactStorageService).deleteByOwner("AGENT_TASK", 77L);
        verify(artifactStorageService).storeText(
                eq(10L),
                eq(null),
                eq("AGENT_TASK"),
                eq(77L),
                eq("AGENT_REPORT"),
                eq("agent-report.json"),
                eq("application/json"),
                eq("{\"summary\":\"ok\"}"),
                eq(1L));
    }
}
