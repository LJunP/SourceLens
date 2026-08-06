package com.sourcelens.module.scantask.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.sourcelens.common.exception.BizException;
import com.sourcelens.module.analysis.service.CodeChunkService;
import com.sourcelens.module.analysis.service.AnalysisService;
import com.sourcelens.module.audit.service.AuditLogService;
import com.sourcelens.module.execution.entity.ExecutionTask;
import com.sourcelens.module.execution.service.ExecutionTaskService;
import com.sourcelens.module.repository.entity.Repository;
import com.sourcelens.module.repository.service.GitService;
import com.sourcelens.module.repository.service.RepositoryUrlPolicy;
import com.sourcelens.module.repository.service.RepositoryService;
import com.sourcelens.module.scantask.dto.CreateScanTaskRequest;
import com.sourcelens.module.scantask.entity.ScanTask;
import com.sourcelens.module.scantask.mapper.ScanTaskMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@Service
public class ScanTaskService extends ServiceImpl<ScanTaskMapper, ScanTask> {

    private final RepositoryService repositoryService;
    private final GitService gitService;
    private final AnalysisService analysisService;
    private final CodeChunkService codeChunkService;
    private final ExecutionTaskService executionTaskService;
    private final AuditLogService auditLogService;
    private final ScanTaskService self;

    public ScanTaskService(RepositoryService repositoryService,
                           GitService gitService,
                           @Lazy AnalysisService analysisService,
                           @Lazy CodeChunkService codeChunkService,
                           ExecutionTaskService executionTaskService,
                           AuditLogService auditLogService,
                           @Lazy ScanTaskService self) {
        this.repositoryService = repositoryService;
        this.gitService = gitService;
        this.analysisService = analysisService;
        this.codeChunkService = codeChunkService;
        this.executionTaskService = executionTaskService;
        this.auditLogService = auditLogService;
        this.self = self;
    }

    public ScanTask create(Long projectId, CreateScanTaskRequest req, Long userId) {
        long start = System.currentTimeMillis();
        Repository repo = repositoryService.getDetail(req.getRepositoryId());
        if (!repo.getProjectId().equals(projectId)) {
            throw BizException.badRequest("仓库不属于此项目");
        }

        // 重复扫描保护：校验该仓库是否已有正在执行或待执行的扫描任务，避免并发冲突
        Long runningCount = count(new LambdaQueryWrapper<ScanTask>()
                .eq(ScanTask::getRepositoryId, req.getRepositoryId())
                .in(ScanTask::getStatus, "PENDING", "RUNNING"));
        if (runningCount > 0) {
            throw BizException.badRequest("该仓库已有正在进行或排队中的扫描任务，请勿重复提交");
        }
        String normalizedBranch = RepositoryUrlPolicy.validateBranch(
                req.getBranch() != null ? req.getBranch() : repo.getDefaultBranch());

        ScanTask task = ScanTask.builder()
                .projectId(projectId)
                .repositoryId(req.getRepositoryId())
                .branch(normalizedBranch)
                .status("PENDING")
                .activeLockKey(activeLockKey(req.getRepositoryId()))
                .triggerType("MANUAL")
                .createdBy(userId)
                .build();
        try {
            save(task);
        } catch (DuplicateKeyException e) {
            throw BizException.badRequest("该仓库已有正在进行或排队中的扫描任务，请勿重复提交");
        }
        executionTaskService.create(projectId, req.getRepositoryId(), "SCAN",
                "SCAN_TASK", task.getId(), userId);
        auditScanTask(task, userId, "SCAN_TASK_CREATE", "SUCCESS",
                scanAuditInput(task, "triggerType", task.getTriggerType()),
                "扫描任务已创建",
                System.currentTimeMillis() - start);

        // 通过代理对象调用，@Async 才能生效
        self.triggerScan(task.getId());

        return task;
    }

    @Async("scanTaskExecutor")
    public void triggerScan(Long taskId) {
        long start = System.currentTimeMillis();
        ScanTask task = getById(taskId);
        if (task == null) {
            return;
        }
        Long executionTaskId = null;
        String currentStep = "prepare_repository";

        try {
            task.setStatus("RUNNING");
            task.setStartedAt(LocalDateTime.now());
            updateById(task);
            ExecutionTask executionTask = executionTaskService.findBySource("SCAN_TASK", taskId);
            executionTaskId = executionTask == null ? null : executionTask.getId();
            assertNotCancelled(taskId, executionTaskId, currentStep);

            // 获取仓库信息
            Repository repo = repositoryService.getDetail(task.getRepositoryId());

            // Git clone / pull，确保本地仓库可用
            startExecutionStep(executionTaskId, currentStep, "准备仓库工作区");
            String token = repositoryService.getDecryptedToken(repo.getId());
            if (token == null || token.isBlank()) {
                token = null;
            }
            String localPath = gitService.ensureLocal(
                    task.getProjectId(), repo.getUrl(), task.getBranch(), token);
            assertNotCancelled(taskId, executionTaskId, currentStep);

            // 记录 HEAD commit SHA
            String commitSha = gitService.getHeadSha(localPath);
            task.setCommitSha(commitSha);
            updateById(task);
            completeExecutionStep(executionTaskId, currentStep, "仓库工作区已就绪: " + localPath);

            // 调用 Rust Analyzer 进行真实扫描
            currentStep = "analyze_code";
            startExecutionStep(executionTaskId, currentStep, "运行代码分析器");
            analysisService.generateAnalysis(taskId, localPath);
            assertNotCancelled(taskId, executionTaskId, currentStep);
            completeExecutionStep(executionTaskId, currentStep, "代码分析完成，commit=" + commitSha);

            currentStep = "chunk_code";
            startExecutionStep(executionTaskId, currentStep, "生成代码切片");
            codeChunkService.chunkAndSave(taskId, localPath);
            assertNotCancelled(taskId, executionTaskId, currentStep);
            completeExecutionStep(executionTaskId, currentStep, "代码切片生成完成");

            // 更新仓库同步时间
            currentStep = "finalize_scan";
            startExecutionStep(executionTaskId, currentStep, "收尾扫描任务");
            assertNotCancelled(taskId, executionTaskId, currentStep);
            repo.setLastSyncedAt(LocalDateTime.now());
            repositoryService.updateById(repo);

            task.setStatus("SUCCESS");
            task.setActiveLockKey(null);
            task.setFinishedAt(LocalDateTime.now());
            updateById(task);
            completeExecutionStep(executionTaskId, currentStep, "扫描任务完成");
            markExecutionSuccess(executionTaskId, currentStep);

            log.info("扫描任务完成, taskId={}, repo={}, commit={}", taskId, repo.getName(), commitSha);
        } catch (ScanTaskCancelledException e) {
            log.info("扫描任务已取消, taskId={}, step={}", taskId, currentStep);
            task.setStatus("CANCELLED");
            task.setActiveLockKey(null);
            task.setFinishedAt(LocalDateTime.now());
            task.setErrorMessage(e.getMessage());
            updateById(task);
            cancelExecutionStep(executionTaskId, currentStep, e.getMessage());
            markExecutionCancelled(executionTaskId, currentStep, e.getMessage());
            auditScanTask(task, task.getCreatedBy(), "SCAN_TASK_CANCEL", "SUCCESS",
                    scanAuditInput(task, "step", currentStep),
                    e.getMessage(),
                    System.currentTimeMillis() - start);
        } catch (Exception e) {
            log.error("扫描任务失败, taskId={}", taskId, e);
            task.setStatus("FAILED");
            task.setActiveLockKey(null);
            task.setFinishedAt(LocalDateTime.now());
            task.setErrorMessage(e.getMessage());
            updateById(task);
            failExecutionStep(executionTaskId, currentStep, e.getMessage());
            markExecutionFailed(executionTaskId, currentStep, e.getMessage());
            auditScanTask(task, task.getCreatedBy(), "SCAN_TASK_FAILED", "FAILED",
                    scanAuditInput(task, "step", currentStep),
                    e.getMessage(),
                    System.currentTimeMillis() - start);
        }
    }

    public ScanTask cancel(Long scanTaskId) {
        return cancel(scanTaskId, null);
    }

    public ScanTask cancel(Long scanTaskId, Long userId) {
        long start = System.currentTimeMillis();
        ScanTask task = getDetail(scanTaskId);
        if ("SUCCESS".equals(task.getStatus()) || "FAILED".equals(task.getStatus()) || "CANCELLED".equals(task.getStatus())) {
            throw BizException.badRequest("已结束的扫描任务无法取消");
        }
        task.setStatus("CANCELLED");
        task.setActiveLockKey(null);
        task.setFinishedAt(LocalDateTime.now());
        task.setErrorMessage("扫描任务已取消");
        updateById(task);

        ExecutionTask executionTask = executionTaskService.findBySource("SCAN_TASK", scanTaskId);
        if (executionTask != null) {
            executionTaskService.markCancelled(executionTask.getId(), "cancelled", "扫描任务已取消");
        }
        Long actorUserId = userId != null ? userId : task.getCreatedBy();
        auditScanTask(task, actorUserId, "SCAN_TASK_CANCEL", "SUCCESS",
                scanAuditInput(task),
                "扫描任务已取消",
                System.currentTimeMillis() - start);
        return task;
    }

    public Page<ScanTask> listByProject(Long projectId, int page, int pageSize) {
        return page(new Page<>(page, pageSize),
                new LambdaQueryWrapper<ScanTask>()
                        .eq(ScanTask::getProjectId, projectId)
                        .orderByDesc(ScanTask::getCreatedAt));
    }

    public ScanTask getDetail(Long scanTaskId) {
        ScanTask task = getById(scanTaskId);
        if (task == null || Boolean.TRUE.equals(task.getDeleted())) {
            throw BizException.notFound("ScanTask");
        }
        return task;
    }

    private void startExecutionStep(Long executionTaskId, String stepKey, String stepName) {
        if (executionTaskId != null) {
            executionTaskService.startStep(executionTaskId, stepKey, stepName);
        }
    }

    private void completeExecutionStep(Long executionTaskId, String stepKey, String summary) {
        if (executionTaskId != null) {
            executionTaskService.completeStep(executionTaskId, stepKey, summary);
        }
    }

    private void failExecutionStep(Long executionTaskId, String stepKey, String errorMessage) {
        if (executionTaskId != null) {
            executionTaskService.failStep(executionTaskId, stepKey, errorMessage);
        }
    }

    private void cancelExecutionStep(Long executionTaskId, String stepKey, String reason) {
        if (executionTaskId != null) {
            executionTaskService.cancelStep(executionTaskId, stepKey, reason);
        }
    }

    private void markExecutionSuccess(Long executionTaskId, String currentStep) {
        if (executionTaskId != null) {
            executionTaskService.markSuccess(executionTaskId, currentStep);
        }
    }

    private void markExecutionFailed(Long executionTaskId, String currentStep, String errorMessage) {
        if (executionTaskId != null) {
            executionTaskService.markFailed(executionTaskId, currentStep, errorMessage);
        }
    }

    private void markExecutionCancelled(Long executionTaskId, String currentStep, String reason) {
        if (executionTaskId != null) {
            executionTaskService.markCancelled(executionTaskId, currentStep, reason);
        }
    }

    private String activeLockKey(Long repositoryId) {
        return repositoryId == null ? null : "repo:" + repositoryId;
    }

    private void auditScanTask(ScanTask task,
                               Long userId,
                               String action,
                               String status,
                               Map<String, Object> input,
                               String outputSummary,
                               long durationMs) {
        if (task == null) {
            return;
        }
        auditLogService.record(userId, task.getProjectId(), "SCAN_TASK", task.getId(),
                action, status, input, outputSummary, durationMs, null);
    }

    private Map<String, Object> scanAuditInput(ScanTask task, Object... extraPairs) {
        Map<String, Object> input = new LinkedHashMap<>();
        input.put("repositoryId", task.getRepositoryId());
        input.put("branch", task.getBranch());
        for (int i = 0; i + 1 < extraPairs.length; i += 2) {
            input.put(String.valueOf(extraPairs[i]), extraPairs[i + 1]);
        }
        return input;
    }

    private void assertNotCancelled(Long taskId, Long executionTaskId, String currentStep) {
        ScanTask latest = getById(taskId);
        if (latest != null && "CANCELLED".equals(latest.getStatus())) {
            throw new ScanTaskCancelledException("扫描任务已取消");
        }
        if (executionTaskId != null) {
            ExecutionTask executionTask = executionTaskService.findBySource("SCAN_TASK", taskId);
            if (executionTask != null && "CANCELLED".equals(executionTask.getStatus())) {
                throw new ScanTaskCancelledException("扫描任务已取消");
            }
        }
    }

    private static class ScanTaskCancelledException extends RuntimeException {
        ScanTaskCancelledException(String message) {
            super(message);
        }
    }
}
