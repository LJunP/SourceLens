package com.sourcelens;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sourcelens.common.observability.SourceLensMetrics;
import com.sourcelens.module.execution.entity.ExecutionAttempt;
import com.sourcelens.module.execution.entity.ExecutionLog;
import com.sourcelens.module.execution.entity.ExecutionStep;
import com.sourcelens.module.execution.entity.ExecutionTask;
import com.sourcelens.module.execution.mapper.ExecutionAttemptMapper;
import com.sourcelens.module.execution.mapper.ExecutionLogMapper;
import com.sourcelens.module.execution.mapper.ExecutionStepMapper;
import com.sourcelens.module.execution.mapper.ExecutionTaskMapper;
import com.sourcelens.module.execution.service.ExecutionTaskService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentCaptor.forClass;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExecutionTaskServiceTest {

    @Mock
    private ExecutionTaskMapper executionTaskMapper;

    @Mock
    private ExecutionStepMapper executionStepMapper;

    @Mock
    private ExecutionAttemptMapper executionAttemptMapper;

    @Mock
    private ExecutionLogMapper executionLogMapper;

    @Mock
    private SourceLensMetrics metrics;

    @InjectMocks
    private ExecutionTaskService executionTaskService;

    @Test
    void create_shouldPersistPendingTask() {
        doAnswer(invocation -> {
            ExecutionTask task = invocation.getArgument(0);
            task.setId(88L);
            return 1;
        }).when(executionTaskMapper).insert(any(ExecutionTask.class));

        ExecutionTask task = executionTaskService.create(10L, 20L, "AUTO_REPAIR",
                "AUTO_REPAIR", 30L, 1L);

        assertEquals(88L, task.getId());
        assertEquals("PENDING", task.getStatus());
        assertEquals(0, task.getProgress());
        verify(executionTaskMapper).insert(any(ExecutionTask.class));
    }

    @Test
    void create_shouldReturnExistingTaskForSameSource() {
        ExecutionTask existing = ExecutionTask.builder()
                .id(88L)
                .projectId(10L)
                .repositoryId(20L)
                .taskType("SCAN")
                .sourceType("SCAN_TASK")
                .sourceId(42L)
                .status("RUNNING")
                .build();
        when(executionTaskMapper.selectOne(anyTaskQuery())).thenReturn(existing);

        ExecutionTask task = executionTaskService.create(10L, 20L, "SCAN",
                "SCAN_TASK", 42L, 1L);

        assertEquals(existing, task);
        verify(executionTaskMapper, never()).insert(any(ExecutionTask.class));
    }

    @Test
    void listByProject_shouldClampPaginationBounds() {
        Page<ExecutionTask> result = new Page<>(1, 100);
        when(executionTaskMapper.selectPage(any(), any())).thenReturn(result);

        Page<ExecutionTask> page = executionTaskService.listByProject(10L, 0, 500);

        assertEquals(result, page);
        ArgumentCaptor<Page<ExecutionTask>> captor = forClass(Page.class);
        verify(executionTaskMapper).selectPage(captor.capture(), any());
        assertEquals(1, captor.getValue().getCurrent());
        assertEquals(100, captor.getValue().getSize());
    }

    @Test
    void stepLifecycle_shouldCreateAndCompleteStepThenMarkTaskSuccess() {
        ExecutionTask task = ExecutionTask.builder()
                .id(88L)
                .projectId(10L)
                .taskType("AUTO_REPAIR")
                .status("PENDING")
                .progress(0)
                .createdBy(1L)
                .build();
        when(executionTaskMapper.selectById(88L)).thenReturn(task);
        when(executionStepMapper.selectOne(anyStepQuery())).thenReturn(null);
        doAnswer(invocation -> {
            ExecutionStep step = invocation.getArgument(0);
            step.setId(99L);
            return 1;
        }).when(executionStepMapper).insert(any(ExecutionStep.class));

        ExecutionStep step = executionTaskService.startStep(88L, "generate_patch", "生成补丁");

        assertEquals("RUNNING", step.getStatus());
        assertNotNull(step.getStartedAt());
        verify(executionStepMapper).insert(any(ExecutionStep.class));
        verify(executionStepMapper).updateById(any(ExecutionStep.class));

        ExecutionStep runningStep = ExecutionStep.builder()
                .id(99L)
                .taskId(88L)
                .stepKey("generate_patch")
                .stepName("生成补丁")
                .status("RUNNING")
                .build();
        when(executionStepMapper.selectOne(anyStepQuery())).thenReturn(runningStep);

        executionTaskService.completeStep(88L, "generate_patch", "patch ready");
        executionTaskService.markSuccess(88L, "generate_patch");

        assertEquals("SUCCESS", runningStep.getStatus());
        assertEquals("SUCCESS", task.getStatus());
        assertEquals(100, task.getProgress());
        verify(executionLogMapper, times(3)).insert(any(ExecutionLog.class));
    }

    @Test
    void scanSteps_shouldAdvanceTaskProgressBeforeCompletion() {
        ExecutionTask task = ExecutionTask.builder()
                .id(88L)
                .status("PENDING")
                .progress(0)
                .build();
        ExecutionStep step = ExecutionStep.builder()
                .id(99L)
                .taskId(88L)
                .stepKey("prepare_repository")
                .status("RUNNING")
                .build();
        when(executionTaskMapper.selectById(88L)).thenReturn(task);
        when(executionStepMapper.selectOne(anyStepQuery())).thenReturn(step);

        executionTaskService.markRunning(88L, "prepare_repository");
        assertEquals(10, task.getProgress());

        executionTaskService.completeStep(88L, "prepare_repository", "repository ready");
        assertEquals(28, task.getProgress());

        executionTaskService.markRunning(88L, "analyze_code");
        assertEquals(35, task.getProgress());
    }

    @Test
    void attemptSteps_shouldNotRollBackExistingTaskProgress() {
        ExecutionTask task = ExecutionTask.builder()
                .id(88L)
                .status("RUNNING")
                .currentAttemptId(1L)
                .progress(80)
                .build();
        ExecutionAttempt attempt = ExecutionAttempt.builder()
                .id(1L)
                .taskId(88L)
                .status("PENDING")
                .build();
        ExecutionStep step = ExecutionStep.builder()
                .id(99L)
                .taskId(88L)
                .attemptId(1L)
                .stepKey("analyze_code")
                .status("PENDING")
                .build();
        when(executionAttemptMapper.selectById(1L)).thenReturn(attempt);
        when(executionTaskMapper.selectById(88L)).thenReturn(task);
        when(executionStepMapper.selectOne(anyStepQuery())).thenReturn(step);

        executionTaskService.startAttemptStep(1L, "analyze_code", "运行代码分析器");
        assertEquals(80, task.getProgress());

        executionTaskService.completeAttemptStep(1L, "analyze_code", "代码分析完成");
        assertEquals(80, task.getProgress());
    }

    @Test
    void listLogs_shouldReturnLatestLogsInChronologicalOrder() {
        ExecutionLog newer = ExecutionLog.builder().id(2L).taskId(88L).message("newer").build();
        ExecutionLog older = ExecutionLog.builder().id(1L).taskId(88L).message("older").build();
        when(executionLogMapper.selectList(anyLogQuery())).thenReturn(List.of(newer, older));

        List<ExecutionLog> logs = executionTaskService.listLogs(88L, 1000);

        assertEquals(List.of(older, newer), logs);
    }

    @Test
    void markCancelled_shouldUseCancelledStatus() {
        ExecutionTask task = ExecutionTask.builder()
                .id(88L)
                .status("RUNNING")
                .progress(50)
                .build();
        when(executionTaskMapper.selectById(88L)).thenReturn(task);

        executionTaskService.markCancelled(88L, "cancelled", "用户取消");

        assertEquals("CANCELLED", task.getStatus());
        assertEquals("cancelled", task.getCurrentStep());
        assertEquals("用户取消", task.getErrorMessage());
    }

    @Test
    void markCancelled_shouldCancelOpenStepsWithoutOverwritingTerminalSteps() {
        ExecutionTask task = ExecutionTask.builder()
                .id(88L)
                .status("RUNNING")
                .progress(50)
                .build();
        ExecutionStep runningStep = ExecutionStep.builder()
                .id(99L)
                .taskId(88L)
                .stepKey("analyze_code")
                .status("RUNNING")
                .build();
        ExecutionStep pendingStep = ExecutionStep.builder()
                .id(100L)
                .taskId(88L)
                .stepKey("generate_patch")
                .status("PENDING")
                .build();
        ExecutionStep successStep = ExecutionStep.builder()
                .id(101L)
                .taskId(88L)
                .stepKey("clone_repo")
                .status("SUCCESS")
                .build();
        when(executionTaskMapper.selectById(88L)).thenReturn(task);
        when(executionStepMapper.selectList(anyStepQuery())).thenReturn(List.of(runningStep, pendingStep, successStep));

        executionTaskService.markCancelled(88L, "cancelled", "用户取消");

        assertEquals("CANCELLED", runningStep.getStatus());
        assertEquals("用户取消", runningStep.getErrorMessage());
        assertNotNull(runningStep.getFinishedAt());
        assertEquals("CANCELLED", pendingStep.getStatus());
        assertEquals("SUCCESS", successStep.getStatus());
        verify(executionStepMapper).updateById(runningStep);
        verify(executionStepMapper).updateById(pendingStep);
        verify(executionStepMapper, never()).updateById(successStep);
    }

    @Test
    void terminalTask_shouldNotBeOverwrittenByLateSuccessOrFailure() {
        ExecutionTask task = ExecutionTask.builder()
                .id(88L)
                .status("CANCELLED")
                .progress(50)
                .currentStep("cancelled")
                .errorMessage("用户取消")
                .build();
        when(executionTaskMapper.selectById(88L)).thenReturn(task);

        executionTaskService.markSuccess(88L, "finalize_scan");
        executionTaskService.markFailed(88L, "analyze_code", "late failure");
        executionTaskService.markRunning(88L, "late_step");
        executionTaskService.markCancelled(88L, "late_cancel", "late cancel");

        assertEquals("CANCELLED", task.getStatus());
        assertEquals("cancelled", task.getCurrentStep());
        assertEquals("用户取消", task.getErrorMessage());
        verify(executionTaskMapper, never()).updateById(task);
    }

    @Test
    void cancelStep_shouldUseCancelledStatus() {
        ExecutionStep step = ExecutionStep.builder()
                .id(99L)
                .taskId(88L)
                .stepKey("analyze_code")
                .status("RUNNING")
                .build();
        when(executionStepMapper.selectOne(anyStepQuery())).thenReturn(step);

        executionTaskService.cancelStep(88L, "analyze_code", "用户取消");

        assertEquals("CANCELLED", step.getStatus());
        assertEquals("用户取消", step.getErrorMessage());
        assertNotNull(step.getFinishedAt());
        verify(executionStepMapper).updateById(step);
    }

    @Test
    void terminalStep_shouldNotBeOverwrittenByLateEvents() {
        ExecutionStep step = ExecutionStep.builder()
                .id(99L)
                .taskId(88L)
                .stepKey("analyze_code")
                .status("CANCELLED")
                .errorMessage("用户取消")
                .build();
        when(executionStepMapper.selectOne(anyStepQuery())).thenReturn(step);

        executionTaskService.completeStep(88L, "analyze_code", "late success");
        executionTaskService.failStep(88L, "analyze_code", "late failure");
        executionTaskService.cancelStep(88L, "analyze_code", "late cancel");

        assertEquals("CANCELLED", step.getStatus());
        assertEquals("用户取消", step.getErrorMessage());
        verify(executionStepMapper, never()).updateById(step);
    }

    @Test
    void stepSummariesAndLogs_shouldSanitizeSensitiveValues() {
        ExecutionStep step = ExecutionStep.builder()
                .id(99L)
                .taskId(88L)
                .stepKey("analyze_code")
                .status("RUNNING")
                .build();
        when(executionStepMapper.selectOne(anyStepQuery())).thenReturn(step);

        executionTaskService.failStep(88L, "analyze_code",
                "failed with Authorization: Bearer live-token and api_key=sk-12345678abcdefghijklmnop");

        assertTrue(step.getErrorMessage().contains("Bearer ****"));
        assertTrue(step.getErrorMessage().contains("api_key=****"));
        assertFalse(step.getErrorMessage().contains("live-token"));
        assertFalse(step.getErrorMessage().contains("12345678abcdefghijklmnop"));

        ArgumentCaptor<ExecutionLog> captor = ArgumentCaptor.forClass(ExecutionLog.class);
        verify(executionLogMapper).insert(captor.capture());
        assertTrue(captor.getValue().getMessage().contains("Bearer ****"));
        assertFalse(captor.getValue().getMessage().contains("live-token"));
    }

    @Test
    void startNewAttempt_shouldCreateNextAttemptAndRequeueTask() {
        ExecutionTask task = ExecutionTask.builder()
                .id(88L)
                .status("SUCCESS")
                .progress(100)
                .currentStep("analyze_ci_failure")
                .currentAttemptId(1L)
                .build();
        ExecutionAttempt previous = ExecutionAttempt.builder()
                .id(1L)
                .taskId(88L)
                .attemptNo(1)
                .status("SUCCESS")
                .build();
        when(executionTaskMapper.selectById(88L)).thenReturn(task);
        when(executionAttemptMapper.selectOne(anyAttemptQuery())).thenReturn(previous);
        doAnswer(invocation -> {
            ExecutionAttempt attempt = invocation.getArgument(0);
            attempt.setId(2L);
            return 1;
        }).when(executionAttemptMapper).insert(any(ExecutionAttempt.class));

        ExecutionAttempt attempt = executionTaskService.startNewAttempt(88L);

        assertEquals(2L, attempt.getId());
        assertEquals(2, attempt.getAttemptNo());
        assertEquals("PENDING", task.getStatus());
        assertEquals(2L, task.getCurrentAttemptId());
        assertEquals(0, task.getProgress());
        verify(executionTaskMapper).updateById(task);
    }

    @Test
    void staleAttemptCompletion_shouldNotOverwriteCurrentTaskStatus() {
        ExecutionTask task = ExecutionTask.builder()
                .id(88L)
                .status("RUNNING")
                .currentAttemptId(2L)
                .currentStep("analyze_ci_failure")
                .build();
        ExecutionAttempt staleAttempt = ExecutionAttempt.builder()
                .id(1L)
                .taskId(88L)
                .attemptNo(1)
                .status("RUNNING")
                .build();
        when(executionAttemptMapper.selectById(1L)).thenReturn(staleAttempt);
        when(executionTaskMapper.selectById(88L)).thenReturn(task);

        executionTaskService.markAttemptSuccess(1L, "analyze_ci_failure");

        assertEquals("SUCCESS", staleAttempt.getStatus());
        assertEquals("RUNNING", task.getStatus());
        assertEquals(2L, task.getCurrentAttemptId());
        verify(executionAttemptMapper).updateById(staleAttempt);
        verify(executionTaskMapper, never()).updateById(task);
    }

    @SuppressWarnings("unchecked")
    private LambdaQueryWrapper<ExecutionStep> anyStepQuery() {
        return any(LambdaQueryWrapper.class);
    }

    @SuppressWarnings("unchecked")
    private LambdaQueryWrapper<ExecutionTask> anyTaskQuery() {
        return any(LambdaQueryWrapper.class);
    }

    @SuppressWarnings("unchecked")
    private LambdaQueryWrapper<ExecutionAttempt> anyAttemptQuery() {
        return any(LambdaQueryWrapper.class);
    }

    @SuppressWarnings("unchecked")
    private LambdaQueryWrapper<ExecutionLog> anyLogQuery() {
        return any(LambdaQueryWrapper.class);
    }
}
