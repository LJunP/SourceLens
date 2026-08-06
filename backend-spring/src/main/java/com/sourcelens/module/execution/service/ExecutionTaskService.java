package com.sourcelens.module.execution.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sourcelens.common.observability.SourceLensMetrics;
import com.sourcelens.common.security.SensitiveDataSanitizer;
import com.sourcelens.module.execution.entity.ExecutionAttempt;
import com.sourcelens.module.execution.entity.ExecutionLog;
import com.sourcelens.module.execution.entity.ExecutionStep;
import com.sourcelens.module.execution.entity.ExecutionTask;
import com.sourcelens.module.execution.mapper.ExecutionAttemptMapper;
import com.sourcelens.module.execution.mapper.ExecutionLogMapper;
import com.sourcelens.module.execution.mapper.ExecutionStepMapper;
import com.sourcelens.module.execution.mapper.ExecutionTaskMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExecutionTaskService {

    private static final int MAX_SUMMARY_LENGTH = 2000;
    private static final int MAX_LOG_MESSAGE_LENGTH = 4000;
    private static final int MAX_LOG_QUERY_LIMIT = 500;
    private static final int UNKNOWN_STEP_PROGRESS = -1;

    private final ExecutionTaskMapper executionTaskMapper;
    private final ExecutionStepMapper executionStepMapper;
    private final ExecutionAttemptMapper executionAttemptMapper;
    private final ExecutionLogMapper executionLogMapper;
    private final SourceLensMetrics metrics;

    public ExecutionTask create(Long projectId, Long repositoryId, String taskType,
                                String sourceType, Long sourceId, Long createdBy) {
        if (sourceType != null && sourceId != null) {
            ExecutionTask existing = findBySource(sourceType, sourceId);
            if (existing != null) {
                return existing;
            }
        }
        ExecutionTask task = ExecutionTask.builder()
                .projectId(projectId)
                .repositoryId(repositoryId)
                .taskType(taskType)
                .sourceType(sourceType)
                .sourceId(sourceId)
                .status("PENDING")
                .progress(0)
                .createdBy(createdBy)
                .build();
        executionTaskMapper.insert(task);
        metrics.recordExecutionTaskStatus(taskType, "PENDING");
        return task;
    }

    public ExecutionTask findBySource(String sourceType, Long sourceId) {
        return executionTaskMapper.selectOne(new LambdaQueryWrapper<ExecutionTask>()
                .eq(ExecutionTask::getSourceType, sourceType)
                .eq(ExecutionTask::getSourceId, sourceId)
                .last("LIMIT 1"));
    }

    public Page<ExecutionTask> listByProject(Long projectId, int page, int pageSize) {
        int safePage = Math.max(page, 1);
        int safePageSize = Math.min(Math.max(pageSize, 1), 100);
        return executionTaskMapper.selectPage(new Page<>(safePage, safePageSize), new LambdaQueryWrapper<ExecutionTask>()
                .eq(ExecutionTask::getProjectId, projectId)
                .orderByDesc(ExecutionTask::getCreatedAt));
    }

    public ExecutionTask getByProject(Long projectId, Long taskId) {
        ExecutionTask task = executionTaskMapper.selectById(taskId);
        if (task == null || !projectId.equals(task.getProjectId())) {
            return null;
        }
        return task;
    }

    public ExecutionTask getByProjectAndSource(Long projectId, String sourceType, Long sourceId) {
        return executionTaskMapper.selectOne(new LambdaQueryWrapper<ExecutionTask>()
                .eq(ExecutionTask::getProjectId, projectId)
                .eq(ExecutionTask::getSourceType, sourceType)
                .eq(ExecutionTask::getSourceId, sourceId)
                .last("LIMIT 1"));
    }

    public List<ExecutionStep> listSteps(Long taskId) {
        return executionStepMapper.selectList(new LambdaQueryWrapper<ExecutionStep>()
                .eq(ExecutionStep::getTaskId, taskId)
                .orderByAsc(ExecutionStep::getAttemptId)
                .orderByAsc(ExecutionStep::getId));
    }

    public List<ExecutionAttempt> listAttempts(Long taskId) {
        return executionAttemptMapper.selectList(new LambdaQueryWrapper<ExecutionAttempt>()
                .eq(ExecutionAttempt::getTaskId, taskId)
                .orderByAsc(ExecutionAttempt::getAttemptNo));
    }

    public List<ExecutionLog> listLogs(Long taskId, int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), MAX_LOG_QUERY_LIMIT);
        List<ExecutionLog> logs = new ArrayList<>(executionLogMapper.selectList(new LambdaQueryWrapper<ExecutionLog>()
                .eq(ExecutionLog::getTaskId, taskId)
                .orderByDesc(ExecutionLog::getCreatedAt)
                .orderByDesc(ExecutionLog::getId)
                .last("LIMIT " + safeLimit)));
        Collections.reverse(logs);
        return logs;
    }

    public ExecutionAttempt getOrCreateCurrentAttempt(Long taskId) {
        ExecutionTask task = executionTaskMapper.selectById(taskId);
        if (task == null) {
            return null;
        }
        if (task.getCurrentAttemptId() != null) {
            ExecutionAttempt existing = executionAttemptMapper.selectById(task.getCurrentAttemptId());
            if (existing != null) {
                return existing;
            }
        }
        return startNewAttempt(taskId);
    }

    public ExecutionAttempt startNewAttempt(Long taskId) {
        ExecutionTask task = executionTaskMapper.selectById(taskId);
        if (task == null) {
            return null;
        }
        Integer nextNo = nextAttemptNo(taskId);
        ExecutionAttempt attempt = ExecutionAttempt.builder()
                .taskId(taskId)
                .attemptNo(nextNo)
                .status("PENDING")
                .build();
        executionAttemptMapper.insert(attempt);
        appendLog(taskId, attempt.getId(), null, "INFO", "创建第 " + nextNo + " 次执行尝试");

        task.setCurrentAttemptId(attempt.getId());
        task.setStatus("PENDING");
        task.setCurrentStep(null);
        task.setProgress(0);
        task.setErrorMessage(null);
        task.setFinishedAt(null);
        executionTaskMapper.updateById(task);
        return attempt;
    }

    public ExecutionStep startAttemptStep(Long attemptId, String stepKey, String stepName) {
        ExecutionAttempt attempt = executionAttemptMapper.selectById(attemptId);
        if (attempt == null || isTerminalAttempt(attempt)) {
            return null;
        }
        ExecutionStep step = getOrCreateStep(attempt.getTaskId(), attemptId, stepKey, stepName);
        if (isTerminalStep(step)) {
            return step;
        }
        step.setStatus("RUNNING");
        step.setStartedAt(step.getStartedAt() == null ? LocalDateTime.now() : step.getStartedAt());
        step.setFinishedAt(null);
        step.setErrorMessage(null);
        executionStepMapper.updateById(step);
        markAttemptRunning(attempt, stepKey);
        appendLog(attempt.getTaskId(), attemptId, stepKey, "INFO", "开始步骤: " + stepName);
        return step;
    }

    public void completeAttemptStep(Long attemptId, String stepKey, String summary) {
        ExecutionStep step = getAttemptStep(attemptId, stepKey);
        if (step == null || isTerminalStep(step)) {
            return;
        }
        step.setStatus("SUCCESS");
        step.setLogSummary(sanitizeSummary(summary));
        step.setFinishedAt(LocalDateTime.now());
        executionStepMapper.updateById(step);
        updateTaskProgressFloor(step.getTaskId(), stepCompleteProgress(stepKey));
        metrics.recordExecutionStepStatus(stepKey, "SUCCESS");
        appendLog(step.getTaskId(), attemptId, stepKey, "INFO", summary);
    }

    public void failAttemptStep(Long attemptId, String stepKey, String errorMessage) {
        ExecutionStep step = getAttemptStep(attemptId, stepKey);
        if (step == null || isTerminalStep(step)) {
            return;
        }
        step.setStatus("FAILED");
        step.setErrorMessage(sanitizeSummary(errorMessage));
        step.setFinishedAt(LocalDateTime.now());
        executionStepMapper.updateById(step);
        metrics.recordExecutionStepStatus(stepKey, "FAILED");
        appendLog(step.getTaskId(), attemptId, stepKey, "ERROR", errorMessage);
    }

    public void cancelAttemptStep(Long attemptId, String stepKey, String reason) {
        ExecutionStep step = getAttemptStep(attemptId, stepKey);
        if (step == null || isTerminalStep(step)) {
            return;
        }
        step.setStatus("CANCELLED");
        step.setErrorMessage(sanitizeSummary(reason));
        step.setFinishedAt(LocalDateTime.now());
        executionStepMapper.updateById(step);
        metrics.recordExecutionStepStatus(stepKey, "CANCELLED");
        appendLog(step.getTaskId(), attemptId, stepKey, "WARN", reason);
    }

    public void markAttemptSuccess(Long attemptId, String currentStep) {
        ExecutionAttempt attempt = executionAttemptMapper.selectById(attemptId);
        if (attempt == null || isTerminalAttempt(attempt)) {
            return;
        }
        attempt.setStatus("SUCCESS");
        attempt.setCurrentStep(currentStep);
        attempt.setErrorMessage(null);
        attempt.setFinishedAt(LocalDateTime.now());
        executionAttemptMapper.updateById(attempt);
        recordTaskStatusMetric(attempt.getTaskId(), "SUCCESS");
        syncTaskFromCurrentAttempt(attempt, 100);
    }

    public void markAttemptFailed(Long attemptId, String currentStep, String errorMessage) {
        ExecutionAttempt attempt = executionAttemptMapper.selectById(attemptId);
        if (attempt == null || isTerminalAttempt(attempt)) {
            return;
        }
        attempt.setStatus("FAILED");
        attempt.setCurrentStep(currentStep);
        attempt.setErrorMessage(sanitizeSummary(errorMessage));
        attempt.setFinishedAt(LocalDateTime.now());
        executionAttemptMapper.updateById(attempt);
        recordTaskStatusMetric(attempt.getTaskId(), "FAILED");
        syncTaskFromCurrentAttempt(attempt, null);
    }

    public void markAttemptCancelled(Long attemptId, String currentStep, String reason) {
        ExecutionAttempt attempt = executionAttemptMapper.selectById(attemptId);
        if (attempt == null || isTerminalAttempt(attempt)) {
            return;
        }
        attempt.setStatus("CANCELLED");
        attempt.setCurrentStep(currentStep);
        attempt.setErrorMessage(sanitizeSummary(reason));
        attempt.setFinishedAt(LocalDateTime.now());
        executionAttemptMapper.updateById(attempt);
        recordTaskStatusMetric(attempt.getTaskId(), "CANCELLED");
        syncTaskFromCurrentAttempt(attempt, null);
    }

    public void markRunning(Long taskId, String currentStep) {
        ExecutionTask task = executionTaskMapper.selectById(taskId);
        if (task == null) {
            return;
        }
        if (isTerminal(task)) {
            return;
        }
        task.setStatus("RUNNING");
        task.setCurrentStep(currentStep);
        task.setStartedAt(task.getStartedAt() == null ? LocalDateTime.now() : task.getStartedAt());
        applyProgressFloor(task, stepStartProgress(currentStep));
        task.setErrorMessage(null);
        executionTaskMapper.updateById(task);
    }

    public ExecutionStep startStep(Long taskId, String stepKey, String stepName) {
        ExecutionTask task = executionTaskMapper.selectById(taskId);
        if (isTerminal(task)) {
            return getStep(taskId, stepKey);
        }
        ExecutionAttempt attempt = getOrCreateCurrentAttempt(taskId);
        Long attemptId = attempt == null ? null : attempt.getId();
        ExecutionStep step = getOrCreateStep(taskId, attemptId, stepKey, stepName);
        if (isTerminalStep(step)) {
            return step;
        }
        step.setStatus("RUNNING");
        step.setStartedAt(step.getStartedAt() == null ? LocalDateTime.now() : step.getStartedAt());
        step.setFinishedAt(null);
        step.setErrorMessage(null);
        executionStepMapper.updateById(step);
        markRunning(taskId, stepKey);
        appendLog(taskId, attemptId, stepKey, "INFO", "开始步骤: " + stepName);
        return step;
    }

    public void completeStep(Long taskId, String stepKey, String summary) {
        ExecutionStep step = getStep(taskId, stepKey);
        if (step == null) {
            return;
        }
        if (isTerminalStep(step)) {
            return;
        }
        step.setStatus("SUCCESS");
        step.setLogSummary(sanitizeSummary(summary));
        step.setFinishedAt(LocalDateTime.now());
        executionStepMapper.updateById(step);
        updateTaskProgressFloor(taskId, stepCompleteProgress(stepKey));
        metrics.recordExecutionStepStatus(stepKey, "SUCCESS");
        appendLog(taskId, step.getAttemptId(), stepKey, "INFO", summary);
    }

    public void failStep(Long taskId, String stepKey, String errorMessage) {
        ExecutionStep step = getStep(taskId, stepKey);
        if (step == null) {
            return;
        }
        if (isTerminalStep(step)) {
            return;
        }
        step.setStatus("FAILED");
        step.setErrorMessage(sanitizeSummary(errorMessage));
        step.setFinishedAt(LocalDateTime.now());
        executionStepMapper.updateById(step);
        metrics.recordExecutionStepStatus(stepKey, "FAILED");
        appendLog(taskId, step.getAttemptId(), stepKey, "ERROR", errorMessage);
    }

    public void cancelStep(Long taskId, String stepKey, String reason) {
        ExecutionStep step = getStep(taskId, stepKey);
        if (step == null) {
            return;
        }
        if (isTerminalStep(step)) {
            return;
        }
        step.setStatus("CANCELLED");
        step.setErrorMessage(sanitizeSummary(reason));
        step.setFinishedAt(LocalDateTime.now());
        executionStepMapper.updateById(step);
        metrics.recordExecutionStepStatus(stepKey, "CANCELLED");
        appendLog(taskId, step.getAttemptId(), stepKey, "WARN", reason);
    }

    public void markSuccess(Long taskId, String currentStep) {
        ExecutionTask task = executionTaskMapper.selectById(taskId);
        if (task == null) {
            return;
        }
        if (isTerminal(task)) {
            return;
        }
        task.setStatus("SUCCESS");
        task.setCurrentStep(currentStep);
        task.setProgress(100);
        task.setErrorMessage(null);
        task.setFinishedAt(LocalDateTime.now());
        executionTaskMapper.updateById(task);
        metrics.recordExecutionTaskStatus(task.getTaskType(), "SUCCESS");
    }

    public void markFailed(Long taskId, String currentStep, String errorMessage) {
        ExecutionTask task = executionTaskMapper.selectById(taskId);
        if (task == null) {
            return;
        }
        if (isTerminal(task)) {
            return;
        }
        task.setStatus("FAILED");
        task.setCurrentStep(currentStep);
        task.setErrorMessage(sanitizeSummary(errorMessage));
        task.setFinishedAt(LocalDateTime.now());
        executionTaskMapper.updateById(task);
        metrics.recordExecutionTaskStatus(task.getTaskType(), "FAILED");
    }

    public void markCancelled(Long taskId, String currentStep, String reason) {
        ExecutionTask task = executionTaskMapper.selectById(taskId);
        if (task == null) {
            return;
        }
        if (isTerminal(task)) {
            return;
        }
        task.setStatus("CANCELLED");
        task.setCurrentStep(currentStep);
        task.setErrorMessage(sanitizeSummary(reason));
        task.setProgress(task.getProgress() == null ? 0 : task.getProgress());
        task.setFinishedAt(LocalDateTime.now());
        executionTaskMapper.updateById(task);
        metrics.recordExecutionTaskStatus(task.getTaskType(), "CANCELLED");
        cancelOpenSteps(taskId, reason);
    }

    public boolean isTerminal(ExecutionTask task) {
        if (task == null || task.getStatus() == null) {
            return false;
        }
        return isTerminalStatus(task.getStatus());
    }

    private boolean isTerminalStep(ExecutionStep step) {
        return step != null && isTerminalStatus(step.getStatus());
    }

    private boolean isTerminalAttempt(ExecutionAttempt attempt) {
        return attempt != null && isTerminalStatus(attempt.getStatus());
    }

    private boolean isTerminalStatus(String status) {
        return "SUCCESS".equals(status)
                || "FAILED".equals(status)
                || "CANCELLED".equals(status);
    }

    private void cancelOpenSteps(Long taskId, String reason) {
        List<ExecutionStep> steps = listSteps(taskId);
        LocalDateTime finishedAt = LocalDateTime.now();
        for (ExecutionStep step : steps) {
            if (isTerminalStep(step)) {
                continue;
            }
            step.setStatus("CANCELLED");
            step.setErrorMessage(sanitizeSummary(reason));
            step.setFinishedAt(finishedAt);
            executionStepMapper.updateById(step);
            metrics.recordExecutionStepStatus(step.getStepKey(), "CANCELLED");
            appendLog(taskId, step.getAttemptId(), step.getStepKey(), "WARN", reason);
        }
    }

    private void recordTaskStatusMetric(Long taskId, String status) {
        ExecutionTask task = executionTaskMapper.selectById(taskId);
        metrics.recordExecutionTaskStatus(task == null ? null : task.getTaskType(), status);
    }

    private void appendLog(Long taskId, Long attemptId, String stepKey, String level, String message) {
        if (taskId == null || message == null || message.isBlank()) {
            return;
        }
        executionLogMapper.insert(ExecutionLog.builder()
                .taskId(taskId)
                .attemptId(attemptId)
                .stepKey(stepKey)
                .level(level)
                .message(SensitiveDataSanitizer.sanitizeAndTruncate(message, MAX_LOG_MESSAGE_LENGTH))
                .build());
    }

    private ExecutionStep getOrCreateStep(Long taskId, Long attemptId, String stepKey, String stepName) {
        ExecutionStep step = attemptId == null ? getStep(taskId, stepKey) : getAttemptStep(attemptId, stepKey);
        if (step != null) {
            return step;
        }
        step = ExecutionStep.builder()
                .taskId(taskId)
                .attemptId(attemptId)
                .stepKey(stepKey)
                .stepName(stepName)
                .status("PENDING")
                .build();
        executionStepMapper.insert(step);
        return step;
    }

    private ExecutionStep getStep(Long taskId, String stepKey) {
        ExecutionTask task = executionTaskMapper.selectById(taskId);
        if (task != null && task.getCurrentAttemptId() != null) {
            ExecutionStep step = getAttemptStep(task.getCurrentAttemptId(), stepKey);
            if (step != null) {
                return step;
            }
        }
        return executionStepMapper.selectOne(new LambdaQueryWrapper<ExecutionStep>()
                .eq(ExecutionStep::getTaskId, taskId)
                .eq(ExecutionStep::getStepKey, stepKey)
                .last("LIMIT 1"));
    }

    private ExecutionStep getAttemptStep(Long attemptId, String stepKey) {
        return executionStepMapper.selectOne(new LambdaQueryWrapper<ExecutionStep>()
                .eq(ExecutionStep::getAttemptId, attemptId)
                .eq(ExecutionStep::getStepKey, stepKey)
                .last("LIMIT 1"));
    }

    private Integer nextAttemptNo(Long taskId) {
        ExecutionAttempt latest = executionAttemptMapper.selectOne(new LambdaQueryWrapper<ExecutionAttempt>()
                .eq(ExecutionAttempt::getTaskId, taskId)
                .orderByDesc(ExecutionAttempt::getAttemptNo)
                .last("LIMIT 1"));
        return latest == null || latest.getAttemptNo() == null ? 1 : latest.getAttemptNo() + 1;
    }

    private void markAttemptRunning(ExecutionAttempt attempt, String currentStep) {
        attempt.setStatus("RUNNING");
        attempt.setCurrentStep(currentStep);
        attempt.setStartedAt(attempt.getStartedAt() == null ? LocalDateTime.now() : attempt.getStartedAt());
        attempt.setErrorMessage(null);
        executionAttemptMapper.updateById(attempt);
        syncTaskFromCurrentAttempt(attempt, nullableProgress(stepStartProgress(currentStep)));
    }

    private void syncTaskFromCurrentAttempt(ExecutionAttempt attempt, Integer progress) {
        ExecutionTask task = executionTaskMapper.selectById(attempt.getTaskId());
        if (task == null || !attempt.getId().equals(task.getCurrentAttemptId())) {
            return;
        }
        task.setStatus(attempt.getStatus());
        task.setCurrentStep(attempt.getCurrentStep());
        task.setErrorMessage(attempt.getErrorMessage());
        task.setStartedAt(task.getStartedAt() == null ? attempt.getStartedAt() : task.getStartedAt());
        task.setFinishedAt(attempt.getFinishedAt());
        if (progress != null) {
            applyProgressFloor(task, progress);
        }
        executionTaskMapper.updateById(task);
    }

    private void updateTaskProgressFloor(Long taskId, int progress) {
        if (progress == UNKNOWN_STEP_PROGRESS) {
            return;
        }
        ExecutionTask task = executionTaskMapper.selectById(taskId);
        if (task == null || isTerminal(task)) {
            return;
        }
        applyProgressFloor(task, progress);
        executionTaskMapper.updateById(task);
    }

    private void applyProgressFloor(ExecutionTask task, int progress) {
        if (task == null || progress == UNKNOWN_STEP_PROGRESS) {
            return;
        }
        int current = task.getProgress() == null ? 0 : task.getProgress();
        task.setProgress(Math.max(current, progress));
    }

    private Integer nullableProgress(int progress) {
        return progress == UNKNOWN_STEP_PROGRESS ? null : progress;
    }

    private int stepStartProgress(String stepKey) {
        return switch (stepKey == null ? "" : stepKey) {
            case "prepare_repository" -> 10;
            case "analyze_code" -> 35;
            case "chunk_code" -> 72;
            case "finalize_scan" -> 92;
            default -> UNKNOWN_STEP_PROGRESS;
        };
    }

    private int stepCompleteProgress(String stepKey) {
        return switch (stepKey == null ? "" : stepKey) {
            case "prepare_repository" -> 28;
            case "analyze_code" -> 68;
            case "chunk_code" -> 88;
            case "finalize_scan" -> 98;
            default -> UNKNOWN_STEP_PROGRESS;
        };
    }

    private String sanitizeSummary(String value) {
        return SensitiveDataSanitizer.sanitizeAndTruncate(value, MAX_SUMMARY_LENGTH);
    }
}
