package com.sourcelens.module.scantask.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.sourcelens.common.exception.BizException;
import com.sourcelens.module.analysis.service.AnalysisService;
import com.sourcelens.module.repository.entity.Repository;
import com.sourcelens.module.repository.service.GitService;
import com.sourcelens.module.repository.service.RepositoryService;
import com.sourcelens.module.scantask.dto.CreateScanTaskRequest;
import com.sourcelens.module.scantask.entity.ScanTask;
import com.sourcelens.module.scantask.mapper.ScanTaskMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Slf4j
@Service
public class ScanTaskService extends ServiceImpl<ScanTaskMapper, ScanTask> {

    private final RepositoryService repositoryService;
    private final GitService gitService;
    private final AnalysisService analysisService;
    private final ScanTaskService self;

    public ScanTaskService(RepositoryService repositoryService,
                           GitService gitService,
                           @Lazy AnalysisService analysisService,
                           @Lazy ScanTaskService self) {
        this.repositoryService = repositoryService;
        this.gitService = gitService;
        this.analysisService = analysisService;
        this.self = self;
    }

    public ScanTask create(Long projectId, CreateScanTaskRequest req, Long userId) {
        Repository repo = repositoryService.getDetail(req.getRepositoryId());
        if (!repo.getProjectId().equals(projectId)) {
            throw BizException.badRequest("仓库不属于此项目");
        }

        ScanTask task = ScanTask.builder()
                .projectId(projectId)
                .repositoryId(req.getRepositoryId())
                .branch(req.getBranch() != null ? req.getBranch() : repo.getDefaultBranch())
                .status("PENDING")
                .triggerType("MANUAL")
                .createdBy(userId)
                .build();
        save(task);

        // 通过代理对象调用，@Async 才能生效
        self.triggerScan(task.getId());

        return task;
    }

    @Async("scanTaskExecutor")
    public void triggerScan(Long taskId) {
        ScanTask task = getById(taskId);
        if (task == null) {
            return;
        }

        try {
            task.setStatus("RUNNING");
            task.setStartedAt(LocalDateTime.now());
            updateById(task);

            // 获取仓库信息
            Repository repo = repositoryService.getDetail(task.getRepositoryId());

            // Git clone / pull，确保本地仓库可用
            String token = repositoryService.getDecryptedToken(repo.getId());
            if (token == null || token.isBlank()) {
                token = null;
            }
            String localPath = gitService.ensureLocal(
                    task.getProjectId(), repo.getUrl(), task.getBranch(), token);

            // 记录 HEAD commit SHA
            String commitSha = gitService.getHeadSha(localPath);
            task.setCommitSha(commitSha);
            updateById(task);

            // 调用 Rust Analyzer 进行真实扫描
            analysisService.generateAnalysis(taskId, localPath);

            // 更新仓库同步时间
            repo.setLastSyncedAt(LocalDateTime.now());
            repositoryService.updateById(repo);

            task.setStatus("SUCCESS");
            task.setFinishedAt(LocalDateTime.now());
            updateById(task);

            log.info("扫描任务完成, taskId={}, repo={}, commit={}", taskId, repo.getName(), commitSha);
        } catch (Exception e) {
            log.error("扫描任务失败, taskId={}", taskId, e);
            task.setStatus("FAILED");
            task.setFinishedAt(LocalDateTime.now());
            task.setErrorMessage(e.getMessage());
            updateById(task);
        }
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
}