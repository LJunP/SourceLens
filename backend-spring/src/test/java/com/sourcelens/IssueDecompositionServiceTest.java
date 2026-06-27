package com.sourcelens;

import com.sourcelens.module.agent.service.LlmClient;
import com.sourcelens.module.agent.service.LlmConfigService;
import com.sourcelens.module.agent.service.LlmJsonExtractor;
import com.sourcelens.module.analysis.service.GraphService;
import com.sourcelens.module.execution.entity.ExecutionAttempt;
import com.sourcelens.module.execution.entity.ExecutionTask;
import com.sourcelens.module.execution.service.ExecutionTaskService;
import com.sourcelens.module.issue.dto.DecomposeIssueRequest;
import com.sourcelens.module.issue.entity.IssueDecomposition;
import com.sourcelens.module.issue.entity.IssueTask;
import com.sourcelens.module.issue.mapper.IssueDecompositionMapper;
import com.sourcelens.module.issue.mapper.IssueTaskMapper;
import com.sourcelens.module.issue.service.IssueDecompositionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class IssueDecompositionServiceTest {

    @Mock
    private IssueTaskMapper taskMapper;

    @Mock
    private GraphService graphService;

    @Mock
    private LlmClient llmClient;

    @Mock
    private LlmConfigService llmConfigService;

    @Mock
    private LlmJsonExtractor llmJsonExtractor;

    @Mock
    private ExecutionTaskService executionTaskService;

    @Mock
    private IssueDecompositionMapper issueDecompositionMapper;

    @InjectMocks
    private IssueDecompositionService issueDecompositionService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(issueDecompositionService, "baseMapper", issueDecompositionMapper);
    }

    @Test
    void create_shouldCreateExecutionTask() {
        when(issueDecompositionMapper.insert(any(IssueDecomposition.class))).thenAnswer(invocation -> {
            IssueDecomposition decomposition = invocation.getArgument(0);
            decomposition.setId(42L);
            return 1;
        });

        DecomposeIssueRequest req = new DecomposeIssueRequest();
        req.setProjectId(10L);
        req.setTitle("新增登录接口");
        req.setDescription("需要支持手机号登录, token=github_pat_abcdefghijklmnopqrstuvwxyz1234567890");

        IssueDecomposition result = issueDecompositionService.create(req, 1L);

        assertEquals(42L, result.getId());
        assertTrue(result.getDescription().contains("token=****"));
        assertFalse(result.getDescription().contains("abcdefghijklmnopqrstuvwxyz1234567890"));
        verify(executionTaskService).create(10L, null, "ISSUE_DECOMPOSITION",
                "ISSUE_DECOMPOSITION", 42L, 1L);
    }

    @Test
    void processDecomposition_pendingTask_shouldClaimAndCreateSubtasks() {
        IssueDecomposition decomposition = IssueDecomposition.builder()
                .id(42L)
                .projectId(10L)
                .title("新增登录接口")
                .description("需要支持手机号登录, Authorization: Bearer live-token")
                .status("PENDING")
                .createdBy(1L)
                .build();
        when(issueDecompositionMapper.selectById(42L)).thenReturn(decomposition);
        when(issueDecompositionMapper.update(any(IssueDecomposition.class), any())).thenReturn(1);
        when(executionTaskService.findBySource("ISSUE_DECOMPOSITION", 42L))
                .thenReturn(ExecutionTask.builder().id(88L).build());
        when(executionTaskService.getOrCreateCurrentAttempt(88L))
                .thenReturn(ExecutionAttempt.builder().id(99L).taskId(88L).attemptNo(1).build());

        issueDecompositionService.processDecomposition(42L);

        assertEquals("COMPLETED", decomposition.getStatus());
        assertTrue(decomposition.getUnderstanding().contains("Bearer ****"));
        assertFalse(decomposition.getUnderstanding().contains("live-token"));
        assertFalse(decomposition.getOutputJson().contains("live-token"));
        ArgumentCaptor<IssueTask> taskCaptor = ArgumentCaptor.forClass(IssueTask.class);
        verify(taskMapper).insert(taskCaptor.capture());
        assertFalse(taskCaptor.getValue().getDescription().contains("live-token"));
        verify(issueDecompositionMapper).update(any(IssueDecomposition.class), any());
        verify(issueDecompositionMapper).updateById(decomposition);
        verify(taskMapper).delete(any());
        verify(executionTaskService).startAttemptStep(99L, "decompose_issue", "拆解需求与技术任务");
        verify(executionTaskService).completeAttemptStep(99L, "decompose_issue", "需求拆解完成: 1 个子任务");
        verify(executionTaskService).markAttemptSuccess(99L, "decompose_issue");
    }

    @Test
    void processDecomposition_whenClaimFails_shouldSkipWithoutLlmOrSubtasks() {
        IssueDecomposition decomposition = IssueDecomposition.builder()
                .id(42L)
                .projectId(10L)
                .title("新增登录接口")
                .description("需要支持手机号登录")
                .status("PENDING")
                .createdBy(1L)
                .build();
        when(issueDecompositionMapper.selectById(42L)).thenReturn(decomposition);
        when(issueDecompositionMapper.update(any(IssueDecomposition.class), any())).thenReturn(0);

        issueDecompositionService.processDecomposition(42L);

        assertEquals("PENDING", decomposition.getStatus());
        verify(llmConfigService, never()).getActiveConfig(1L);
        verify(executionTaskService, never()).findBySource(anyString(), anyLong());
        verify(executionTaskService, never()).startAttemptStep(anyLong(), anyString(), anyString());
        verify(issueDecompositionMapper, never()).updateById(decomposition);
        verify(taskMapper, never()).insert(any(IssueTask.class));
    }

    @Test
    void processDecomposition_whenTaskInsertFails_shouldMarkDecompositionAndExecutionTaskFailed() {
        IssueDecomposition decomposition = IssueDecomposition.builder()
                .id(42L)
                .projectId(10L)
                .title("新增登录接口")
                .description("需要支持手机号登录")
                .status("PENDING")
                .createdBy(1L)
                .build();
        when(issueDecompositionMapper.selectById(42L)).thenReturn(decomposition);
        when(issueDecompositionMapper.update(any(IssueDecomposition.class), any())).thenReturn(1);
        when(executionTaskService.findBySource("ISSUE_DECOMPOSITION", 42L))
                .thenReturn(ExecutionTask.builder().id(88L).build());
        when(executionTaskService.getOrCreateCurrentAttempt(88L))
                .thenReturn(ExecutionAttempt.builder().id(99L).taskId(88L).attemptNo(1).build());
        when(taskMapper.insert(any(IssueTask.class))).thenThrow(new IllegalStateException("task write failed"));

        issueDecompositionService.processDecomposition(42L);

        assertEquals("FAILED", decomposition.getStatus());
        assertEquals("task write failed", decomposition.getErrorMessage());
        verify(executionTaskService).failAttemptStep(99L, "decompose_issue", "task write failed");
        verify(executionTaskService).markAttemptFailed(99L, "decompose_issue", "task write failed");
    }
}
