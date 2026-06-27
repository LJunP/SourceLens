package com.sourcelens;

import com.sourcelens.common.exception.BizException;
import com.sourcelens.module.agent.entity.LlmConfig;
import com.sourcelens.module.agent.service.LlmClient;
import com.sourcelens.module.agent.service.LlmConfigService;
import com.sourcelens.module.autorepair.dto.AutoRepairRequest;
import com.sourcelens.module.autorepair.entity.AutoRepair;
import com.sourcelens.module.autorepair.mapper.AutoRepairMapper;
import com.sourcelens.module.autorepair.service.AutoRepairPrService;
import com.sourcelens.module.autorepair.service.AutoRepairService;
import com.sourcelens.module.artifact.entity.ArtifactRecord;
import com.sourcelens.module.audit.service.AuditLogService;
import com.sourcelens.module.execution.entity.ExecutionTask;
import com.sourcelens.module.execution.service.ExecutionTaskService;
import com.sourcelens.module.artifact.service.ArtifactStorageService;
import com.sourcelens.module.project.service.ProjectService;
import com.sourcelens.module.repository.entity.Repository;
import com.sourcelens.module.repository.service.GitHubAppInstallationService;
import com.sourcelens.module.repository.service.RepositoryService;
import com.sourcelens.module.sandbox.SandboxExecutor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AutoRepairServiceTest {

    @Mock
    private ProjectService projectService;

    @Mock
    private RepositoryService repositoryService;

    @Mock
    private LlmConfigService llmConfigService;

    @Mock
    private LlmClient llmClient;

    @Mock
    private AutoRepairMapper autoRepairMapper;

    @Mock
    private ExecutionTaskService executionTaskService;

    @Mock
    private ArtifactStorageService artifactStorageService;

    @Mock
    private SandboxExecutor sandboxExecutor;

    @Mock
    private AutoRepairPrService autoRepairPrService;

    @Mock
    private GitHubAppInstallationService gitHubAppInstallationService;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private AutoRepairService autoRepairService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(autoRepairService, "baseMapper", autoRepairMapper);
    }

    @Test
    void createRepairTask_normalizesSafePathAndSaves() {
        mockValidCreateDependencies();
        doAnswer(invocation -> {
            AutoRepair repair = invocation.getArgument(0);
            repair.setId(42L);
            return 1;
        }).when(autoRepairMapper).insert(any(AutoRepair.class));

        AutoRepairRequest req = new AutoRepairRequest();
        req.setRepositoryId(100L);
        req.setFilePath("src/main/../main/App.java");
        req.setTargetDesc("增加空指针保护");

        AutoRepair result = autoRepairService.createRepairTask(10L, req, 1L);

        assertEquals("src/main/App.java", result.getFilePath());
        assertEquals("PENDING", result.getStatus());
        assertTrue(result.getActiveLockKey().startsWith("repo:100:file:"));
        verify(autoRepairMapper).insert(any(AutoRepair.class));
        verify(executionTaskService).create(10L, 100L, "AUTO_REPAIR", "AUTO_REPAIR", 42L, 1L);
    }

    @Test
    void createRepairTask_duplicateActiveRepair_shouldRejectBeforeInsert() {
        mockValidCreateDependencies();
        when(autoRepairMapper.selectCount(any())).thenReturn(1L);

        AutoRepairRequest req = new AutoRepairRequest();
        req.setRepositoryId(100L);
        req.setFilePath("src/App.java");
        req.setTargetDesc("增加空指针保护");

        BizException ex = assertThrows(BizException.class,
                () -> autoRepairService.createRepairTask(10L, req, 1L));

        assertEquals("BAD_REQUEST", ex.getCode());
        assertEquals("该文件已有正在生成补丁或创建 PR 的任务，请勿重复提交", ex.getMessage());
        verify(autoRepairMapper, never()).insert(any(AutoRepair.class));
        verify(executionTaskService, never()).create(anyLong(), anyLong(), anyString(), anyString(), anyLong(), anyLong());
    }

    @Test
    void createRepairTask_duplicateActiveLockRace_shouldRejectWithoutSideEffects() {
        mockValidCreateDependencies();
        when(autoRepairMapper.insert(any(AutoRepair.class)))
                .thenThrow(new DuplicateKeyException("Duplicate entry"));

        AutoRepairRequest req = new AutoRepairRequest();
        req.setRepositoryId(100L);
        req.setFilePath("src/App.java");
        req.setTargetDesc("增加空指针保护");

        BizException ex = assertThrows(BizException.class,
                () -> autoRepairService.createRepairTask(10L, req, 1L));

        assertEquals("BAD_REQUEST", ex.getCode());
        assertEquals("该文件已有正在生成补丁或创建 PR 的任务，请勿重复提交", ex.getMessage());
        verify(executionTaskService, never()).create(anyLong(), anyLong(), anyString(), anyString(), anyLong(), anyLong());
    }

    @Test
    void createRepairTask_rejectsPathTraversal() {
        mockValidCreateDependencies();

        AutoRepairRequest req = new AutoRepairRequest();
        req.setRepositoryId(100L);
        req.setFilePath("../secrets.yml");
        req.setTargetDesc("修改配置");

        BizException ex = assertThrows(BizException.class,
                () -> autoRepairService.createRepairTask(10L, req, 1L));
        assertEquals("BAD_REQUEST", ex.getCode());
    }

    @Test
    void createRepairTask_rejectsCommonSecretFiles() {
        mockValidCreateDependencies();

        AutoRepairRequest req = new AutoRepairRequest();
        req.setRepositoryId(100L);
        req.setFilePath(".env");
        req.setTargetDesc("修改密钥");

        BizException ex = assertThrows(BizException.class,
                () -> autoRepairService.createRepairTask(10L, req, 1L));
        assertEquals("BAD_REQUEST", ex.getCode());
    }

    @Test
    void submitPr_isDisabledByDefault() {
        AutoRepair repair = AutoRepair.builder()
                .id(12L)
                .projectId(10L)
                .status("PATCH_READY")
                .build();

        BizException ex = assertThrows(BizException.class,
                () -> autoRepairService.submitPr(10L, 12L, 1L));

        assertEquals("BAD_REQUEST", ex.getCode());
    }

    @Test
    void executeRepairAsync_shouldAuditPatchReady(@TempDir Path tempDir) throws Exception {
        Path sourceRepo = tempDir.resolve("source-repo");
        Files.createDirectories(sourceRepo.resolve("src"));
        Files.writeString(sourceRepo.resolve("src/App.java"), "class App {}\n");
        ReflectionTestUtils.setField(autoRepairService, "workspaceBasePath", tempDir.resolve("workspace").toString());
        AutoRepair repair = AutoRepair.builder()
                .id(12L)
                .projectId(10L)
                .repositoryId(100L)
                .filePath("src/App.java")
                .targetDesc("增加空指针保护")
                .status("PENDING")
                .createdBy(1L)
                .build();
        Repository repo = Repository.builder()
                .id(100L)
                .projectId(10L)
                .url("file://" + sourceRepo)
                .defaultBranch("main")
                .build();
        ArtifactRecord artifactRecord = ArtifactRecord.builder()
                .storagePath("artifacts/auto-repair/12/change.patch")
                .build();
        when(autoRepairMapper.selectById(12L)).thenReturn(repair);
        when(repositoryService.getDetail(100L)).thenReturn(repo);
        when(repositoryService.getDecryptedToken(100L)).thenReturn(null);
        when(executionTaskService.findBySource("AUTO_REPAIR", 12L))
                .thenReturn(ExecutionTask.builder().id(88L).build());
        when(llmConfigService.getActiveConfig(1L)).thenReturn(new LlmConfig());
        when(llmClient.chat(any(LlmConfig.class), anyString())).thenReturn("class App { void ok() {} }\n");
        when(artifactStorageService.storeText(eq(10L), eq(100L), eq("AUTO_REPAIR"), eq(12L),
                eq("CHANGE_PATCH"), eq("change.patch"), eq("text/x-patch"), any(), eq(1L)))
                .thenReturn(artifactRecord);

        autoRepairService.executeRepairAsync(12L, 1L);

        assertEquals("PATCH_READY", repair.getStatus());
        assertNull(repair.getActiveLockKey());
        assertEquals("artifacts/auto-repair/12/change.patch", repair.getPatchArtifactPath());
        verify(executionTaskService).markSuccess(88L, "generate_patch");
        verify(auditLogService).record(eq(1L), eq(10L), eq("AUTO_REPAIR"), eq(12L),
                eq("AUTO_REPAIR_PATCH_READY"), eq("SUCCESS"), anyMap(), eq("补丁 artifact 已生成"), isNull(), isNull());
    }

    @Test
    void submitPr_enabled_shouldQueueControlledPrCreation() {
        ReflectionTestUtils.setField(autoRepairService, "submitPrEnabled", true);
        AutoRepair repair = AutoRepair.builder()
                .id(12L)
                .projectId(10L)
                .repositoryId(100L)
                .filePath("src/App.java")
                .targetDesc("修复空指针")
                .status("PATCH_READY")
                .diffContent("diff --git a/src/App.java b/src/App.java\n")
                .testLog("patch ready")
                .build();
        Repository repo = Repository.builder()
                .id(100L)
                .projectId(10L)
                .provider("GITHUB")
                .owner("acme")
                .name("api")
                .url("https://github.com/acme/api.git")
                .defaultBranch("main")
                .authType("GITHUB_APP")
                .build();
        when(autoRepairMapper.selectById(12L)).thenReturn(repair);
        when(repositoryService.getDetail(100L)).thenReturn(repo);
        when(executionTaskService.findBySource("AUTO_REPAIR", 12L))
                .thenReturn(ExecutionTask.builder().id(88L).build());

        AutoRepair result = autoRepairService.submitPr(10L, 12L, 1L);

        assertEquals("PR_RUNNING", result.getStatus());
        assertTrue(result.getActiveLockKey().startsWith("repo:100:file:"));
        verify(gitHubAppInstallationService).assertCanCreatePullRequest(100L);
        verify(autoRepairMapper).updateById(repair);
        verify(executionTaskService).markRunning(88L, "queued_pull_request");
        verify(auditLogService).record(eq(1L), eq(10L), eq("AUTO_REPAIR"), eq(12L),
                eq("AUTO_REPAIR_PR_QUEUED"), eq("SUCCESS"), anyMap(), eq("受控 PR 创建已排队"), isNull(), isNull());
        verify(repositoryService, never()).getDecryptedToken(100L);
        verify(autoRepairPrService, never()).submitPatchAsPullRequest(
                any(), any(), any(), any(), any(AutoRepairPrService.ProgressReporter.class));
    }

    @Test
    void executeSubmitPrAsync_shouldCreateControlledPrWithGitHubAppToken() {
        AutoRepair repair = AutoRepair.builder()
                .id(12L)
                .projectId(10L)
                .repositoryId(100L)
                .filePath("src/App.java")
                .targetDesc("修复空指针")
                .status("PR_RUNNING")
                .diffContent("diff --git a/src/App.java b/src/App.java\n")
                .testLog("patch ready")
                .build();
        Repository repo = Repository.builder()
                .id(100L)
                .projectId(10L)
                .provider("GITHUB")
                .owner("acme")
                .name("api")
                .url("https://github.com/acme/api.git")
                .defaultBranch("main")
                .authType("GITHUB_APP")
                .build();
        when(autoRepairMapper.selectById(12L)).thenReturn(repair);
        when(repositoryService.getDetail(100L)).thenReturn(repo);
        when(repositoryService.getDecryptedToken(100L)).thenReturn("installation-token");
        when(executionTaskService.findBySource("AUTO_REPAIR", 12L))
                .thenReturn(ExecutionTask.builder().id(88L).build());
        when(autoRepairPrService.submitPatchAsPullRequest(
                eq(repo),
                eq(repair),
                eq("installation-token"),
                eq("sourcelens/auto-repair-12"),
                any(AutoRepairPrService.ProgressReporter.class)))
                .thenAnswer(invocation -> {
                    AutoRepairPrService.ProgressReporter reporter = invocation.getArgument(4);
                    reporter.start("clone_repository", "克隆仓库并创建修复分支");
                    reporter.complete("clone_repository", "clone ok");
                    reporter.start("apply_patch", "应用补丁并提交变更");
                    reporter.complete("apply_patch", "patch ok");
                    reporter.start("push_branch", "推送修复分支");
                    reporter.complete("push_branch", "push ok");
                    reporter.start("create_pull_request", "创建 GitHub Pull Request");
                    reporter.complete("create_pull_request", "pr ok");
                    return new AutoRepairPrService.PullRequestResult(
                            "sourcelens/auto-repair-12",
                            "https://github.com/acme/api/pull/7");
                });

        autoRepairService.executeSubmitPrAsync(12L, 1L);

        assertEquals("PR_CREATED", repair.getStatus());
        assertNull(repair.getActiveLockKey());
        assertEquals("sourcelens/auto-repair-12", repair.getBranchName());
        assertEquals("https://github.com/acme/api/pull/7", repair.getPrUrl());
        verify(autoRepairMapper).updateById(repair);
        verify(executionTaskService).startStep(88L, "clone_repository", "克隆仓库并创建修复分支");
        verify(executionTaskService).completeStep(88L, "create_pull_request", "pr ok");
        verify(executionTaskService).markSuccess(88L, "create_pull_request");
        verify(auditLogService).record(eq(1L), eq(10L), eq("AUTO_REPAIR"), eq(12L),
                eq("AUTO_REPAIR_PR_CREATED"), eq("SUCCESS"), anyMap(), eq("受控 PR 已创建"), isNull(), isNull());
    }

    @Test
    void executeSubmitPrAsync_shouldMarkExecutionFailedWhenPrCreationFails() {
        AutoRepair repair = AutoRepair.builder()
                .id(12L)
                .projectId(10L)
                .repositoryId(100L)
                .filePath("src/App.java")
                .targetDesc("修复空指针")
                .status("PR_RUNNING")
                .diffContent("diff --git a/src/App.java b/src/App.java\n")
                .build();
        Repository repo = Repository.builder()
                .id(100L)
                .projectId(10L)
                .provider("GITHUB")
                .authType("GITHUB_APP")
                .build();
        when(autoRepairMapper.selectById(12L)).thenReturn(repair);
        when(repositoryService.getDetail(100L)).thenReturn(repo);
        when(repositoryService.getDecryptedToken(100L)).thenReturn("installation-token");
        when(executionTaskService.findBySource("AUTO_REPAIR", 12L))
                .thenReturn(ExecutionTask.builder().id(88L).build());
        when(autoRepairPrService.submitPatchAsPullRequest(
                eq(repo),
                eq(repair),
                eq("installation-token"),
                eq("sourcelens/auto-repair-12"),
                any(AutoRepairPrService.ProgressReporter.class)))
                .thenAnswer(invocation -> {
                    AutoRepairPrService.ProgressReporter reporter = invocation.getArgument(4);
                    reporter.start("push_branch", "推送修复分支");
                    throw BizException.internal("push failed");
                });

        autoRepairService.executeSubmitPrAsync(12L, 1L);

        assertEquals("PATCH_READY", repair.getStatus());
        assertNull(repair.getActiveLockKey());
        assertEquals("push failed", repair.getErrorMessage());
        verify(executionTaskService).failStep(88L, "push_branch", "push failed");
        verify(executionTaskService).markFailed(88L, "push_branch", "push failed");
        verify(auditLogService).record(eq(1L), eq(10L), eq("AUTO_REPAIR"), eq(12L),
                eq("AUTO_REPAIR_PR_FAILED"), eq("FAILED"), anyMap(), eq("push failed"), isNull(), isNull());
    }

    @Test
    void executeSubmitPrAsync_shouldMarkCreatePullRequestConflictAsFailedWithoutSuccess() {
        AutoRepair repair = AutoRepair.builder()
                .id(12L)
                .projectId(10L)
                .repositoryId(100L)
                .filePath("src/App.java")
                .targetDesc("修复空指针")
                .status("PR_RUNNING")
                .diffContent("diff --git a/src/App.java b/src/App.java\n")
                .build();
        Repository repo = Repository.builder()
                .id(100L)
                .projectId(10L)
                .provider("GITHUB")
                .authType("GITHUB_APP")
                .build();
        String conflictMessage = "GitHub Pull Request 创建冲突或校验失败, status=409";
        when(autoRepairMapper.selectById(12L)).thenReturn(repair);
        when(repositoryService.getDetail(100L)).thenReturn(repo);
        when(repositoryService.getDecryptedToken(100L)).thenReturn("installation-token");
        when(executionTaskService.findBySource("AUTO_REPAIR", 12L))
                .thenReturn(ExecutionTask.builder().id(88L).build());
        when(autoRepairPrService.submitPatchAsPullRequest(
                eq(repo),
                eq(repair),
                eq("installation-token"),
                eq("sourcelens/auto-repair-12"),
                any(AutoRepairPrService.ProgressReporter.class)))
                .thenAnswer(invocation -> {
                    AutoRepairPrService.ProgressReporter reporter = invocation.getArgument(4);
                    reporter.start("create_pull_request", "创建 GitHub Pull Request");
                    throw BizException.conflict(conflictMessage);
                });

        autoRepairService.executeSubmitPrAsync(12L, 1L);

        assertEquals("PATCH_READY", repair.getStatus());
        assertNull(repair.getActiveLockKey());
        assertNull(repair.getPrUrl());
        assertNull(repair.getBranchName());
        assertEquals(conflictMessage, repair.getErrorMessage());
        verify(executionTaskService).failStep(88L, "create_pull_request", conflictMessage);
        verify(executionTaskService).markFailed(88L, "create_pull_request", conflictMessage);
        verify(executionTaskService, never()).markSuccess(88L, "create_pull_request");
        verify(auditLogService).record(eq(1L), eq(10L), eq("AUTO_REPAIR"), eq(12L),
                eq("AUTO_REPAIR_PR_FAILED"), eq("FAILED"), anyMap(), eq(conflictMessage), isNull(), isNull());
    }

    @Test
    void executeSubmitPrAsync_shouldNotOverwriteCancelledRepairAfterPrServiceReturns() {
        AutoRepair repair = AutoRepair.builder()
                .id(12L)
                .projectId(10L)
                .repositoryId(100L)
                .filePath("src/App.java")
                .targetDesc("修复空指针")
                .status("PR_RUNNING")
                .diffContent("diff --git a/src/App.java b/src/App.java\n")
                .build();
        AutoRepair cancelled = AutoRepair.builder()
                .id(12L)
                .projectId(10L)
                .repositoryId(100L)
                .filePath("src/App.java")
                .status("CANCELLED")
                .build();
        Repository repo = Repository.builder()
                .id(100L)
                .projectId(10L)
                .provider("GITHUB")
                .authType("GITHUB_APP")
                .build();
        when(autoRepairMapper.selectById(12L)).thenReturn(repair, repair, cancelled);
        when(repositoryService.getDetail(100L)).thenReturn(repo);
        when(repositoryService.getDecryptedToken(100L)).thenReturn("installation-token");
        when(executionTaskService.findBySource("AUTO_REPAIR", 12L))
                .thenReturn(ExecutionTask.builder().id(88L).build());
        when(autoRepairPrService.submitPatchAsPullRequest(
                eq(repo),
                eq(repair),
                eq("installation-token"),
                eq("sourcelens/auto-repair-12"),
                any(AutoRepairPrService.ProgressReporter.class)))
                .thenReturn(new AutoRepairPrService.PullRequestResult(
                        "sourcelens/auto-repair-12",
                        "https://github.com/acme/repo/pull/1"));

        autoRepairService.executeSubmitPrAsync(12L, 1L);

        assertEquals("PR_RUNNING", repair.getStatus());
        verify(autoRepairMapper, never()).updateById(any(AutoRepair.class));
        verify(executionTaskService).cancelStep(88L, "create_pull_request", "自动补丁任务已取消");
        verify(executionTaskService).markCancelled(88L, "create_pull_request", "自动补丁任务已取消");
    }

    @Test
    void submitPr_enabled_shouldRejectGitHubAppRepositoryWithoutRequiredPermissions() {
        ReflectionTestUtils.setField(autoRepairService, "submitPrEnabled", true);
        AutoRepair repair = AutoRepair.builder()
                .id(12L)
                .projectId(10L)
                .repositoryId(100L)
                .filePath("src/App.java")
                .status("PATCH_READY")
                .diffContent("diff --git a/src/App.java b/src/App.java\n")
                .build();
        Repository repo = Repository.builder()
                .id(100L)
                .projectId(10L)
                .provider("GITHUB")
                .authType("GITHUB_APP")
                .build();
        when(autoRepairMapper.selectById(12L)).thenReturn(repair);
        when(repositoryService.getDetail(100L)).thenReturn(repo);
        org.mockito.Mockito.doThrow(BizException.forbidden("GitHub App installation 缺少 pull_requests:write 权限"))
                .when(gitHubAppInstallationService).assertCanCreatePullRequest(100L);

        BizException ex = assertThrows(BizException.class,
                () -> autoRepairService.submitPr(10L, 12L, 1L));

        assertEquals("FORBIDDEN", ex.getCode());
        verify(autoRepairMapper, never()).updateById(any(AutoRepair.class));
        verify(executionTaskService, never()).markRunning(anyLong(), anyString());
        verify(auditLogService).record(eq(1L), eq(10L), eq("AUTO_REPAIR"), eq(12L),
                eq("AUTO_REPAIR_PR_REJECTED"), eq("FAILED"), anyMap(),
                eq("GitHub App installation 缺少 pull_requests:write 权限"), isNull(), isNull());
    }

    @Test
    void submitPr_enabled_shouldRejectDuplicatePrCreation() {
        ReflectionTestUtils.setField(autoRepairService, "submitPrEnabled", true);
        AutoRepair repair = AutoRepair.builder()
                .id(12L)
                .projectId(10L)
                .repositoryId(100L)
                .status("PR_RUNNING")
                .diffContent("diff --git a/src/App.java b/src/App.java\n")
                .build();
        when(autoRepairMapper.selectById(12L)).thenReturn(repair);

        BizException ex = assertThrows(BizException.class,
                () -> autoRepairService.submitPr(10L, 12L, 1L));

        assertEquals("BAD_REQUEST", ex.getCode());
        verifyNoInteractions(autoRepairPrService);
    }

    @Test
    void submitPr_enabled_duplicateActiveFile_shouldRejectBeforeExecutionTaskSideEffects() {
        ReflectionTestUtils.setField(autoRepairService, "submitPrEnabled", true);
        AutoRepair repair = AutoRepair.builder()
                .id(12L)
                .projectId(10L)
                .repositoryId(100L)
                .filePath("src/App.java")
                .status("PATCH_READY")
                .diffContent("diff --git a/src/App.java b/src/App.java\n")
                .build();
        Repository repo = Repository.builder()
                .id(100L)
                .projectId(10L)
                .provider("GITHUB")
                .authType("GITHUB_APP")
                .build();
        when(autoRepairMapper.selectById(12L)).thenReturn(repair);
        when(repositoryService.getDetail(100L)).thenReturn(repo);
        when(autoRepairMapper.selectCount(any())).thenReturn(1L);

        BizException ex = assertThrows(BizException.class,
                () -> autoRepairService.submitPr(10L, 12L, 1L));

        assertEquals("BAD_REQUEST", ex.getCode());
        assertEquals("该文件已有正在生成补丁或创建 PR 的任务，请勿重复提交", ex.getMessage());
        verify(executionTaskService, never()).create(anyLong(), anyLong(), anyString(), anyString(), anyLong(), anyLong());
        verify(executionTaskService, never()).markRunning(anyLong(), anyString());
    }

    @Test
    void submitPr_enabled_duplicateActiveLockRace_shouldRejectWithoutQueueSideEffects() {
        ReflectionTestUtils.setField(autoRepairService, "submitPrEnabled", true);
        AutoRepair repair = AutoRepair.builder()
                .id(12L)
                .projectId(10L)
                .repositoryId(100L)
                .filePath("src/App.java")
                .status("PATCH_READY")
                .diffContent("diff --git a/src/App.java b/src/App.java\n")
                .build();
        Repository repo = Repository.builder()
                .id(100L)
                .projectId(10L)
                .provider("GITHUB")
                .authType("GITHUB_APP")
                .build();
        when(autoRepairMapper.selectById(12L)).thenReturn(repair);
        when(repositoryService.getDetail(100L)).thenReturn(repo);
        when(executionTaskService.findBySource("AUTO_REPAIR", 12L))
                .thenReturn(ExecutionTask.builder().id(88L).build());
        when(autoRepairMapper.updateById(any(AutoRepair.class)))
                .thenThrow(new DuplicateKeyException("Duplicate entry"));

        BizException ex = assertThrows(BizException.class,
                () -> autoRepairService.submitPr(10L, 12L, 1L));

        assertEquals("BAD_REQUEST", ex.getCode());
        assertEquals("PATCH_READY", repair.getStatus());
        assertNull(repair.getActiveLockKey());
        verify(executionTaskService, never()).markRunning(anyLong(), anyString());
        verify(auditLogService, never()).record(any(), any(), anyString(), any(), anyString(), anyString(),
                anyMap(), anyString(), any(), any());
    }

    @Test
    void executeSubmitPrAsync_shouldSkipWhenRepairIsNotPrRunning() {
        AutoRepair repair = AutoRepair.builder()
                .id(12L)
                .projectId(10L)
                .repositoryId(100L)
                .status("PATCH_READY")
                .diffContent("diff --git a/src/App.java b/src/App.java\n")
                .build();
        when(autoRepairMapper.selectById(12L)).thenReturn(repair);

        autoRepairService.executeSubmitPrAsync(12L, 1L);

        verifyNoInteractions(autoRepairPrService);
    }

    @Test
    void submitPr_enabled_shouldRejectPatRepository() {
        ReflectionTestUtils.setField(autoRepairService, "submitPrEnabled", true);
        AutoRepair repair = AutoRepair.builder()
                .id(12L)
                .projectId(10L)
                .repositoryId(100L)
                .status("PATCH_READY")
                .diffContent("diff --git a/src/App.java b/src/App.java\n")
                .build();
        Repository repo = Repository.builder()
                .id(100L)
                .projectId(10L)
                .provider("GITHUB")
                .authType("PAT")
                .build();
        when(autoRepairMapper.selectById(12L)).thenReturn(repair);
        when(repositoryService.getDetail(100L)).thenReturn(repo);

        BizException ex = assertThrows(BizException.class,
                () -> autoRepairService.submitPr(10L, 12L, 1L));

        assertEquals("BAD_REQUEST", ex.getCode());
    }

    @Test
    void cancelRepair_runningTask_shouldSyncExecutionTask() {
        AutoRepair repair = AutoRepair.builder()
                .id(12L)
                .projectId(10L)
                .status("RUNNING")
                .build();
        when(autoRepairMapper.selectById(12L)).thenReturn(repair);
        when(executionTaskService.findBySource("AUTO_REPAIR", 12L))
                .thenReturn(ExecutionTask.builder().id(88L).build());

        AutoRepair cancelled = autoRepairService.cancelRepair(10L, 12L, 1L);

        assertEquals("CANCELLED", cancelled.getStatus());
        assertNull(cancelled.getActiveLockKey());
        assertEquals("自动补丁任务已取消", cancelled.getErrorMessage());
        verify(executionTaskService).markCancelled(88L, "cancelled", "自动补丁任务已取消");
        verify(auditLogService).record(eq(1L), eq(10L), eq("AUTO_REPAIR"), eq(12L),
                eq("AUTO_REPAIR_CANCEL"), eq("SUCCESS"), anyMap(), eq("自动补丁任务已取消"), isNull(), isNull());
    }

    @Test
    void cancelRepair_finishedTask_shouldReject() {
        AutoRepair repair = AutoRepair.builder()
                .id(12L)
                .projectId(10L)
                .status("PATCH_READY")
                .build();
        when(autoRepairMapper.selectById(12L)).thenReturn(repair);

        BizException ex = assertThrows(BizException.class,
                () -> autoRepairService.cancelRepair(10L, 12L, 1L));

        assertEquals("BAD_REQUEST", ex.getCode());
    }

    private void mockValidCreateDependencies() {
        Repository repo = Repository.builder()
                .id(100L)
                .projectId(10L)
                .defaultBranch("main")
                .build();
        when(repositoryService.getDetail(100L)).thenReturn(repo);
        when(llmConfigService.getActiveConfig(1L)).thenReturn(new LlmConfig());
    }
}
