package com.sourcelens;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sourcelens.common.exception.BizException;
import com.sourcelens.module.audit.service.AuditLogService;
import com.sourcelens.module.scantask.dto.CreateScanTaskRequest;
import com.sourcelens.module.scantask.entity.ScanTask;
import com.sourcelens.module.scantask.mapper.ScanTaskMapper;
import com.sourcelens.module.scantask.service.ScanTaskService;
import com.sourcelens.module.repository.entity.Repository;
import com.sourcelens.module.repository.service.RepositoryService;
import com.sourcelens.module.analysis.service.AnalysisService;
import com.sourcelens.module.analysis.service.CodeChunkService;
import com.sourcelens.module.execution.entity.ExecutionTask;
import com.sourcelens.module.execution.service.ExecutionTaskService;
import com.sourcelens.module.repository.service.GitService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ScanTaskServiceTest {

    @Mock
    private RepositoryService repositoryService;

    @Mock
    private GitService gitService;

    @Mock
    private AnalysisService analysisService;

    @Mock
    private CodeChunkService codeChunkService;

    @Mock
    private ExecutionTaskService executionTaskService;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private ScanTaskMapper scanTaskMapper;

    @Mock
    private ScanTaskService self;

    @InjectMocks
    private ScanTaskService scanTaskService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(scanTaskService, "baseMapper", scanTaskMapper);
        ReflectionTestUtils.setField(scanTaskService, "self", self);
    }

    private Repository buildRepo(Long id, Long projectId) {
        Repository r = new Repository();
        r.setId(id);
        r.setProjectId(projectId);
        r.setDefaultBranch("main");
        return r;
    }

    @Test
    void create_shouldBuildTaskAndSave() {
        Repository repo = buildRepo(100L, 10L);
        when(repositoryService.getDetail(100L)).thenReturn(repo);
        // 模拟 MyBatis-Plus 自增回填
        doAnswer(invocation -> {
            ScanTask arg = invocation.getArgument(0);
            arg.setId(42L);
            return 1;
        }).when(scanTaskMapper).insert(any(ScanTask.class));

        CreateScanTaskRequest req = new CreateScanTaskRequest();
        req.setRepositoryId(100L);
        req.setProjectId(10L);

        ScanTask result = scanTaskService.create(10L, req, 1L);

        assertEquals(10L, result.getProjectId());
        assertEquals("PENDING", result.getStatus());
        assertEquals("repo:100", result.getActiveLockKey());
        assertEquals("MANUAL", result.getTriggerType());
        verify(executionTaskService).create(10L, 100L, "SCAN", "SCAN_TASK", 42L, 1L);
        verify(auditLogService).record(eq(1L), eq(10L), eq("SCAN_TASK"), eq(42L),
                eq("SCAN_TASK_CREATE"), eq("SUCCESS"), anyMap(), eq("扫描任务已创建"), anyLong(), isNull());
        verify(self).triggerScan(42L);
    }

    @Test
    void create_shouldRejectInvalidBranchBeforePersistingTask() {
        Repository repo = buildRepo(100L, 10L);
        when(repositoryService.getDetail(100L)).thenReturn(repo);

        CreateScanTaskRequest req = new CreateScanTaskRequest();
        req.setRepositoryId(100L);
        req.setProjectId(10L);
        req.setBranch("main;rm");

        BizException ex = assertThrows(BizException.class,
                () -> scanTaskService.create(10L, req, 1L));

        assertEquals("BAD_REQUEST", ex.getCode());
        verify(scanTaskMapper, never()).insert(any(ScanTask.class));
        verify(executionTaskService, never()).create(anyLong(), anyLong(), anyString(), anyString(), anyLong(), anyLong());
        verify(self, never()).triggerScan(anyLong());
    }

    @Test
    void triggerScan_success_updatesExecutionTaskSteps() throws Exception {
        ScanTask task = ScanTask.builder()
                .id(42L)
                .projectId(10L)
                .repositoryId(100L)
                .branch("main")
                .status("PENDING")
                .createdBy(1L)
                .build();
        Repository repo = buildRepo(100L, 10L);
        repo.setUrl("https://github.com/acme/repo.git");
        repo.setName("repo");
        ExecutionTask executionTask = ExecutionTask.builder().id(88L).build();

        when(scanTaskMapper.selectById(42L)).thenReturn(task);
        when(repositoryService.getDetail(100L)).thenReturn(repo);
        when(repositoryService.getDecryptedToken(100L)).thenReturn("token");
        when(gitService.ensureLocal(10L, repo.getUrl(), "main", "token")).thenReturn("/tmp/repo");
        when(gitService.getHeadSha("/tmp/repo")).thenReturn("abc123");
        when(executionTaskService.findBySource("SCAN_TASK", 42L)).thenReturn(executionTask);

        scanTaskService.triggerScan(42L);

        assertEquals("SUCCESS", task.getStatus());
        assertNull(task.getActiveLockKey());
        assertEquals("abc123", task.getCommitSha());
        verify(executionTaskService).startStep(88L, "prepare_repository", "准备仓库工作区");
        verify(executionTaskService).completeStep(eq(88L), eq("prepare_repository"), contains("仓库工作区已就绪"));
        verify(executionTaskService).startStep(88L, "analyze_code", "运行代码分析器");
        verify(executionTaskService).completeStep(eq(88L), eq("analyze_code"), contains("代码分析完成"));
        verify(executionTaskService).startStep(88L, "chunk_code", "生成代码切片");
        verify(codeChunkService).chunkAndSave(42L, "/tmp/repo");
        verify(executionTaskService).completeStep(88L, "chunk_code", "代码切片生成完成");
        verify(executionTaskService).startStep(88L, "finalize_scan", "收尾扫描任务");
        verify(executionTaskService).markSuccess(88L, "finalize_scan");
    }

    @Test
    void triggerScan_failure_shouldAuditFailedTask() throws Exception {
        ScanTask task = ScanTask.builder()
                .id(42L)
                .projectId(10L)
                .repositoryId(100L)
                .branch("main")
                .status("PENDING")
                .createdBy(1L)
                .build();
        Repository repo = buildRepo(100L, 10L);
        repo.setUrl("https://github.com/acme/repo.git");
        ExecutionTask executionTask = ExecutionTask.builder().id(88L).build();

        when(scanTaskMapper.selectById(42L)).thenReturn(task);
        when(repositoryService.getDetail(100L)).thenReturn(repo);
        when(repositoryService.getDecryptedToken(100L)).thenReturn(null);
        when(gitService.ensureLocal(10L, repo.getUrl(), "main", null)).thenReturn("/tmp/repo");
        when(gitService.getHeadSha("/tmp/repo")).thenReturn("abc123");
        when(executionTaskService.findBySource("SCAN_TASK", 42L)).thenReturn(executionTask);
        doThrow(new IllegalStateException("analyzer crashed"))
                .when(analysisService).generateAnalysis(42L, "/tmp/repo");

        scanTaskService.triggerScan(42L);

        assertEquals("FAILED", task.getStatus());
        assertNull(task.getActiveLockKey());
        assertEquals("analyzer crashed", task.getErrorMessage());
        verify(executionTaskService).failStep(88L, "analyze_code", "analyzer crashed");
        verify(executionTaskService).markFailed(88L, "analyze_code", "analyzer crashed");
        verify(auditLogService).record(eq(1L), eq(10L), eq("SCAN_TASK"), eq(42L),
                eq("SCAN_TASK_FAILED"), eq("FAILED"), anyMap(), eq("analyzer crashed"), anyLong(), isNull());
    }

    @Test
    void triggerScan_chunkFailure_shouldFailAtChunkStep() throws Exception {
        ScanTask task = ScanTask.builder()
                .id(42L)
                .projectId(10L)
                .repositoryId(100L)
                .branch("main")
                .status("PENDING")
                .createdBy(1L)
                .build();
        Repository repo = buildRepo(100L, 10L);
        repo.setUrl("https://github.com/acme/repo.git");
        ExecutionTask executionTask = ExecutionTask.builder().id(88L).build();

        when(scanTaskMapper.selectById(42L)).thenReturn(task);
        when(repositoryService.getDetail(100L)).thenReturn(repo);
        when(repositoryService.getDecryptedToken(100L)).thenReturn(null);
        when(gitService.ensureLocal(10L, repo.getUrl(), "main", null)).thenReturn("/tmp/repo");
        when(gitService.getHeadSha("/tmp/repo")).thenReturn("abc123");
        when(executionTaskService.findBySource("SCAN_TASK", 42L)).thenReturn(executionTask);
        doThrow(new IllegalStateException("chunk storage failed"))
                .when(codeChunkService).chunkAndSave(42L, "/tmp/repo");

        scanTaskService.triggerScan(42L);

        assertEquals("FAILED", task.getStatus());
        assertNull(task.getActiveLockKey());
        assertEquals("chunk storage failed", task.getErrorMessage());
        verify(analysisService).generateAnalysis(42L, "/tmp/repo");
        verify(executionTaskService).failStep(88L, "chunk_code", "chunk storage failed");
        verify(executionTaskService).markFailed(88L, "chunk_code", "chunk storage failed");
        verify(executionTaskService, never()).startStep(88L, "finalize_scan", "收尾扫描任务");
    }

    @Test
    void create_repoNotBelongToProject_throws() {
        Repository repo = buildRepo(100L, 99L);
        when(repositoryService.getDetail(100L)).thenReturn(repo);

        CreateScanTaskRequest req = new CreateScanTaskRequest();
        req.setRepositoryId(100L);
        req.setProjectId(10L);

        BizException ex = assertThrows(BizException.class,
                () -> scanTaskService.create(10L, req, 1L));
        assertEquals("BAD_REQUEST", ex.getCode());
    }

    @Test
    void create_duplicateActiveLock_shouldRejectWithoutSideEffects() {
        Repository repo = buildRepo(100L, 10L);
        when(repositoryService.getDetail(100L)).thenReturn(repo);
        when(scanTaskMapper.insert(any(ScanTask.class)))
                .thenThrow(new DuplicateKeyException("Duplicate entry 'repo:100'"));

        CreateScanTaskRequest req = new CreateScanTaskRequest();
        req.setRepositoryId(100L);
        req.setProjectId(10L);

        BizException ex = assertThrows(BizException.class,
                () -> scanTaskService.create(10L, req, 1L));
        assertEquals("BAD_REQUEST", ex.getCode());
        assertEquals("该仓库已有正在进行或排队中的扫描任务，请勿重复提交", ex.getMessage());
        verify(executionTaskService, never()).create(anyLong(), anyLong(), anyString(), anyString(), anyLong(), anyLong());
        verify(auditLogService, never()).record(any(), any(), anyString(), any(), anyString(), anyString(),
                anyMap(), anyString(), anyLong(), any());
        verify(self, never()).triggerScan(anyLong());
    }

    @Test
    void getDetail_existingTask() {
        ScanTask task = new ScanTask();
        task.setId(50L);
        task.setDeleted(false);
        when(scanTaskMapper.selectById(50L)).thenReturn(task);

        ScanTask result = scanTaskService.getDetail(50L);
        assertEquals(50L, result.getId());
    }

    @Test
    void getDetail_notFound() {
        when(scanTaskMapper.selectById(999L)).thenReturn(null);

        BizException ex = assertThrows(BizException.class,
                () -> scanTaskService.getDetail(999L));
        assertEquals("NOT_FOUND", ex.getCode());
    }

    @Test
    void getDetail_deletedTask() {
        ScanTask task = new ScanTask();
        task.setId(50L);
        task.setDeleted(true);
        when(scanTaskMapper.selectById(50L)).thenReturn(task);

        BizException ex = assertThrows(BizException.class,
                () -> scanTaskService.getDetail(50L));
        assertEquals("NOT_FOUND", ex.getCode());
    }

    @Test
    void cancel_runningTask_shouldSyncExecutionTask() {
        ScanTask task = ScanTask.builder()
                .id(42L)
                .projectId(10L)
                .repositoryId(100L)
                .status("RUNNING")
                .createdBy(1L)
                .deleted(false)
                .build();
        when(scanTaskMapper.selectById(42L)).thenReturn(task);
        when(executionTaskService.findBySource("SCAN_TASK", 42L))
                .thenReturn(ExecutionTask.builder().id(88L).build());

        ScanTask cancelled = scanTaskService.cancel(42L);

        assertEquals("CANCELLED", cancelled.getStatus());
        assertNull(cancelled.getActiveLockKey());
        assertEquals("扫描任务已取消", cancelled.getErrorMessage());
        verify(executionTaskService).markCancelled(88L, "cancelled", "扫描任务已取消");
        verify(auditLogService).record(eq(1L), eq(10L), eq("SCAN_TASK"), eq(42L),
                eq("SCAN_TASK_CANCEL"), eq("SUCCESS"), anyMap(), eq("扫描任务已取消"), anyLong(), isNull());
    }

    @Test
    void cancel_finishedTask_shouldReject() {
        ScanTask task = ScanTask.builder()
                .id(42L)
                .projectId(10L)
                .repositoryId(100L)
                .status("SUCCESS")
                .deleted(false)
                .build();
        when(scanTaskMapper.selectById(42L)).thenReturn(task);

        BizException ex = assertThrows(BizException.class, () -> scanTaskService.cancel(42L));
        assertEquals("BAD_REQUEST", ex.getCode());
    }
}
