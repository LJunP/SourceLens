package com.sourcelens;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
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
import com.sourcelens.module.audit.entity.AuditLog;
import com.sourcelens.module.audit.service.AuditLogService;
import com.sourcelens.module.execution.entity.ExecutionAttempt;
import com.sourcelens.module.execution.entity.ExecutionStep;
import com.sourcelens.module.execution.entity.ExecutionTask;
import com.sourcelens.module.execution.service.ExecutionTaskService;
import com.sourcelens.module.artifact.service.ArtifactStorageService;
import com.sourcelens.module.project.service.ProjectService;
import com.sourcelens.module.repository.entity.Repository;
import com.sourcelens.module.repository.service.GitHubAppInstallationService;
import com.sourcelens.module.repository.service.RepositoryService;
import com.sourcelens.module.scantask.entity.ScanTask;
import com.sourcelens.module.scantask.service.ScanTaskService;
import com.sourcelens.module.sandbox.SandboxExecutor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.InjectMocks;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
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

    @Mock
    private ScanTaskService scanTaskService;

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
    void createRepairTask_withSuccessfulSourceScan_shouldPersistScanTaskId() {
        mockValidCreateDependencies();
        when(scanTaskService.getDetail(88L)).thenReturn(ScanTask.builder()
                .id(88L)
                .projectId(10L)
                .repositoryId(100L)
                .status("SUCCESS")
                .build());
        doAnswer(invocation -> {
            AutoRepair repair = invocation.getArgument(0);
            repair.setId(42L);
            return 1;
        }).when(autoRepairMapper).insert(any(AutoRepair.class));

        AutoRepairRequest req = new AutoRepairRequest();
        req.setRepositoryId(100L);
        req.setScanTaskId(88L);
        req.setFilePath("src/App.java");
        req.setTargetDesc("修复扫描报告风险");

        AutoRepair result = autoRepairService.createRepairTask(10L, req, 1L);

        assertEquals(88L, result.getScanTaskId());
        verify(scanTaskService).getDetail(88L);
        verify(autoRepairMapper).insert(any(AutoRepair.class));
    }

    @Test
    @SuppressWarnings("unchecked")
    void createRepairTask_withQaCitationProvenance_shouldAuditSanitizedCandidateReceipt() {
        mockValidCreateDependencies();
        when(scanTaskService.getDetail(88L)).thenReturn(ScanTask.builder()
                .id(88L)
                .projectId(10L)
                .repositoryId(100L)
                .status("SUCCESS")
                .build());
        doAnswer(invocation -> {
            AutoRepair repair = invocation.getArgument(0);
            repair.setId(42L);
            return 1;
        }).when(autoRepairMapper).insert(any(AutoRepair.class));

        AutoRepairRequest.Provenance provenance = new AutoRepairRequest.Provenance();
        provenance.setSourceType("PROJECT_QA_VERIFIED_CITATION");
        provenance.setSource("Project QA verified citation");
        provenance.setScanTaskId(88L);
        provenance.setFilePath("src/App.java");
        provenance.setChunkId(901L);
        provenance.setCitationId("chunk-901-secret-token-should-not-expand");
        provenance.setSourceLabel("C1");
        provenance.setStartLine(12);
        provenance.setEndLine(24);
        provenance.setCitedByAnswer(true);
        provenance.setGroundingStatus("VERIFIED");
        provenance.setCitationEnforcementStatus("DIRECT_VERIFIED");
        provenance.setCitationEnforcementReason("DIRECT_VERIFIED");
        provenance.setEvidenceType("SERVICE");
        provenance.setEvidenceReason("主证据直接命中订单服务，secret=project-qa-autorepair-password-should-not-enter-audit，并且这段说明会被安全截断避免长文本进入审计日志。".repeat(20));
        provenance.setSourceEvidenceCategory("报告章节");
        provenance.setSourceEvidenceSource("Trace Map");
        provenance.setSourceEvidenceTitle("注册接口风险 apiKey=sk-projectqa-autorepair-secret-should-not-enter-audit123456 ".repeat(40));
        provenance.setSourceEvidenceFilePath("src/report/RegisterController.java");
        provenance.setSourceEvidenceLineNumber("12");
        provenance.setSourceEvidenceMatched(true);
        provenance.setSourceEvidenceMatchType("REPORT_LINE_ANCHOR");

        AutoRepairRequest req = new AutoRepairRequest();
        req.setRepositoryId(100L);
        req.setScanTaskId(88L);
        req.setFilePath("src/App.java");
        req.setTargetDesc("请基于 Project QA 已验证引用 C1 生成最小修复候选。");
        req.setProvenance(provenance);

        autoRepairService.createRepairTask(10L, req, 1L);

        ArgumentCaptor<Map<String, Object>> inputCaptor = ArgumentCaptor.forClass(Map.class);
        verify(auditLogService).record(eq(1L), eq(10L), eq("AUTO_REPAIR"), eq(42L),
                eq("AUTO_REPAIR_CANDIDATE_CREATED"), eq("SUCCESS"), inputCaptor.capture(),
                eq("自动修复候选已创建"), isNull(), isNull());
        Map<String, Object> input = inputCaptor.getValue();
        assertEquals(100L, input.get("repositoryId"));
        assertEquals(88L, input.get("scanTaskId"));
        assertEquals("src/App.java", input.get("filePath"));
        assertEquals("PROJECT_QA_VERIFIED_CITATION", input.get("sourceType"));
        Map<String, Object> receipt = (Map<String, Object>) input.get("provenance");
        assertEquals("PROJECT_QA_VERIFIED_CITATION", receipt.get("sourceType"));
        assertEquals(88L, receipt.get("scanTaskId"));
        assertEquals("src/App.java", receipt.get("filePath"));
        assertEquals(901L, receipt.get("chunkId"));
        assertEquals("C1", receipt.get("sourceLabel"));
        assertEquals(12, receipt.get("startLine"));
        assertEquals(24, receipt.get("endLine"));
        assertEquals(true, receipt.get("citedByAnswer"));
        assertEquals("VERIFIED", receipt.get("groundingStatus"));
        assertEquals("DIRECT_VERIFIED", receipt.get("citationEnforcementStatus"));
        assertEquals("DIRECT_VERIFIED", receipt.get("citationEnforcementReason"));
        assertTrue(String.valueOf(receipt.get("evidenceReason")).length() <= 240);
        assertFalse(String.valueOf(receipt.get("evidenceReason")).contains("project-qa-autorepair-password-should-not-enter-audit"));
        assertTrue(String.valueOf(receipt.get("evidenceReason")).contains("secret=****"));
        assertEquals("报告章节", receipt.get("sourceEvidenceCategory"));
        assertEquals("Trace Map", receipt.get("sourceEvidenceSource"));
        assertTrue(String.valueOf(receipt.get("sourceEvidenceTitle")).length() <= 160);
        assertFalse(String.valueOf(receipt.get("sourceEvidenceTitle")).contains("sk-projectqa-autorepair-secret-should-not-enter-audit123456"));
        assertTrue(String.valueOf(receipt.get("sourceEvidenceTitle")).contains("apiKey=****"));
        assertEquals("src/report/RegisterController.java", receipt.get("sourceEvidenceFilePath"));
        assertEquals("12", receipt.get("sourceEvidenceLineNumber"));
        assertEquals(true, receipt.get("sourceEvidenceMatched"));
        assertEquals("REPORT_LINE_ANCHOR", receipt.get("sourceEvidenceMatchType"));
        assertEquals("READY", receipt.get("repairEvidenceGate"));
        assertEquals("SERVER_DERIVED", receipt.get("repairEvidenceGateSource"));
        assertTrue(String.valueOf(receipt.get("repairEvidenceGateReason")).contains("line-anchored"));
        assertTrue(!receipt.containsKey("question"));
        assertTrue(!receipt.containsKey("answer"));
        assertTrue(!receipt.containsKey("content"));
        assertTrue(!receipt.containsKey("summary"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void createRepairTask_withFileOnlyQaCitationProvenance_shouldAuditReviewGate() {
        mockValidCreateDependencies();
        when(scanTaskService.getDetail(88L)).thenReturn(ScanTask.builder()
                .id(88L)
                .projectId(10L)
                .repositoryId(100L)
                .status("SUCCESS")
                .build());
        doAnswer(invocation -> {
            AutoRepair repair = invocation.getArgument(0);
            repair.setId(43L);
            return 1;
        }).when(autoRepairMapper).insert(any(AutoRepair.class));

        AutoRepairRequest.Provenance provenance = new AutoRepairRequest.Provenance();
        provenance.setSourceType("PROJECT_QA_VERIFIED_CITATION");
        provenance.setSourceLabel("C2");
        provenance.setCitedByAnswer(true);
        provenance.setGroundingStatus("VERIFIED");
        provenance.setCitationEnforcementStatus("DIRECT_VERIFIED");
        provenance.setSourceEvidenceTitle("文件级报告证据");
        provenance.setSourceEvidenceFilePath("src/report/RegisterController.java");
        provenance.setSourceEvidenceLineNumber("120");
        provenance.setSourceEvidenceMatched(true);
        provenance.setSourceEvidenceMatchType("REPORT_FILE_ANCHOR");

        AutoRepairRequest req = new AutoRepairRequest();
        req.setRepositoryId(100L);
        req.setScanTaskId(88L);
        req.setFilePath("src/App.java");
        req.setTargetDesc("请基于 Project QA 文件级引用生成待复核候选。");
        req.setProvenance(provenance);

        autoRepairService.createRepairTask(10L, req, 1L);

        ArgumentCaptor<Map<String, Object>> inputCaptor = ArgumentCaptor.forClass(Map.class);
        verify(auditLogService).record(eq(1L), eq(10L), eq("AUTO_REPAIR"), eq(43L),
                eq("AUTO_REPAIR_CANDIDATE_CREATED"), eq("SUCCESS"), inputCaptor.capture(),
                eq("自动修复候选已创建"), isNull(), isNull());
        Map<String, Object> receipt = (Map<String, Object>) inputCaptor.getValue().get("provenance");
        assertEquals("120", receipt.get("sourceEvidenceLineNumber"));
        assertEquals("REPORT_FILE_ANCHOR", receipt.get("sourceEvidenceMatchType"));
        assertEquals("REVIEW", receipt.get("repairEvidenceGate"));
        assertEquals("SERVER_DERIVED", receipt.get("repairEvidenceGateSource"));
        assertTrue(String.valueOf(receipt.get("repairEvidenceGateReason")).contains("line-level confirmation"));
    }

    @Test
    void createRepairTask_withDifferentProjectSourceScan_shouldReject() {
        mockValidRepository();
        when(scanTaskService.getDetail(88L)).thenReturn(ScanTask.builder()
                .id(88L)
                .projectId(99L)
                .repositoryId(100L)
                .status("SUCCESS")
                .build());

        AutoRepairRequest req = new AutoRepairRequest();
        req.setRepositoryId(100L);
        req.setScanTaskId(88L);
        req.setFilePath("src/App.java");
        req.setTargetDesc("修复扫描报告风险");

        BizException ex = assertThrows(BizException.class,
                () -> autoRepairService.createRepairTask(10L, req, 1L));

        assertEquals("BAD_REQUEST", ex.getCode());
        assertEquals("来源扫描任务不属于指定项目", ex.getMessage());
        verify(autoRepairMapper, never()).insert(any(AutoRepair.class));
    }

    @Test
    void createRepairTask_withDifferentRepositorySourceScan_shouldReject() {
        mockValidRepository();
        when(scanTaskService.getDetail(88L)).thenReturn(ScanTask.builder()
                .id(88L)
                .projectId(10L)
                .repositoryId(101L)
                .status("SUCCESS")
                .build());

        AutoRepairRequest req = new AutoRepairRequest();
        req.setRepositoryId(100L);
        req.setScanTaskId(88L);
        req.setFilePath("src/App.java");
        req.setTargetDesc("修复扫描报告风险");

        BizException ex = assertThrows(BizException.class,
                () -> autoRepairService.createRepairTask(10L, req, 1L));

        assertEquals("BAD_REQUEST", ex.getCode());
        assertEquals("来源扫描任务不属于指定仓库", ex.getMessage());
        verify(autoRepairMapper, never()).insert(any(AutoRepair.class));
    }

    @Test
    void createRepairTask_withUnfinishedSourceScan_shouldReject() {
        mockValidRepository();
        when(scanTaskService.getDetail(88L)).thenReturn(ScanTask.builder()
                .id(88L)
                .projectId(10L)
                .repositoryId(100L)
                .status("RUNNING")
                .build());

        AutoRepairRequest req = new AutoRepairRequest();
        req.setRepositoryId(100L);
        req.setScanTaskId(88L);
        req.setFilePath("src/App.java");
        req.setTargetDesc("修复扫描报告风险");

        BizException ex = assertThrows(BizException.class,
                () -> autoRepairService.createRepairTask(10L, req, 1L));

        assertEquals("BAD_REQUEST", ex.getCode());
        assertEquals("来源扫描任务尚未成功完成，不能作为自动修复候选证据", ex.getMessage());
        verify(autoRepairMapper, never()).insert(any(AutoRepair.class));
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
                .diffContent(validDiff())
                .patchArtifactPath("artifacts/auto-repairs/12/change.patch")
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
        mockPatchReadyPrEvidence(repair);
        when(executionTaskService.findBySource("AUTO_REPAIR", 12L))
                .thenReturn(ExecutionTask.builder().id(88L).build());
        when(executionTaskService.startNewAttempt(88L)).thenReturn(ExecutionAttempt.builder().id(188L).build());

        AutoRepair result = autoRepairService.submitPr(10L, 12L, 1L);

        assertEquals("PR_RUNNING", result.getStatus());
        assertTrue(result.getActiveLockKey().startsWith("repo:100:file:"));
        verify(gitHubAppInstallationService).assertCanCreatePullRequest(100L);
        verify(autoRepairMapper).updateById(repair);
        verify(executionTaskService).startNewAttempt(88L);
        verify(executionTaskService).startAttemptStep(188L, "queued_pull_request", "受控 PR 创建已排队");
        verify(executionTaskService).completeAttemptStep(188L, "queued_pull_request", "受控 PR 创建已排队");
        verify(executionTaskService, never()).markRunning(88L, "queued_pull_request");
        verify(auditLogService).record(eq(1L), eq(10L), eq("AUTO_REPAIR"), eq(12L),
                eq("AUTO_REPAIR_PR_QUEUED"), eq("SUCCESS"), anyMap(), eq("受控 PR 创建已排队"), isNull(), isNull());
        verify(repositoryService, never()).getDecryptedToken(100L);
        verify(autoRepairPrService, never()).submitPatchAsPullRequest(
                any(), any(), any(), any(), any(AutoRepairPrService.ProgressReporter.class));
    }

    @Test
    void submitPr_enabled_shouldRetryAfterFailedPrAttemptUsingOldPatchEvidence() {
        ReflectionTestUtils.setField(autoRepairService, "submitPrEnabled", true);
        AutoRepair repair = AutoRepair.builder()
                .id(12L)
                .projectId(10L)
                .repositoryId(100L)
                .filePath("src/App.java")
                .targetDesc("修复空指针")
                .status("PATCH_READY")
                .diffContent(validDiff())
                .patchArtifactPath("artifacts/auto-repairs/12/change.patch")
                .errorMessage("push failed")
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
        mockPatchReadyPrEvidence(repair, "FAILED");
        when(executionTaskService.findBySource("AUTO_REPAIR", 12L))
                .thenReturn(ExecutionTask.builder()
                        .id(88L)
                        .status("FAILED")
                        .currentAttemptId(177L)
                        .build());
        when(executionTaskService.startNewAttempt(88L)).thenReturn(ExecutionAttempt.builder().id(188L).build());

        AutoRepair result = autoRepairService.submitPr(10L, 12L, 1L);

        assertEquals("PR_RUNNING", result.getStatus());
        assertNull(result.getErrorMessage());
        verify(executionTaskService).startNewAttempt(88L);
        verify(executionTaskService).startAttemptStep(188L, "queued_pull_request", "受控 PR 创建已排队");
        verify(executionTaskService).completeAttemptStep(188L, "queued_pull_request", "受控 PR 创建已排队");
        verify(executionTaskService, never()).markRunning(88L, "queued_pull_request");
    }

    @Test
    void submitPr_enabled_shouldRejectMissingPatchArtifactBeforeQueue() {
        ReflectionTestUtils.setField(autoRepairService, "submitPrEnabled", true);
        AutoRepair repair = validPatchReadyRepair();
        repair.setPatchArtifactPath(null);
        when(autoRepairMapper.selectById(12L)).thenReturn(repair);

        BizException ex = assertThrows(BizException.class,
                () -> autoRepairService.submitPr(10L, 12L, 1L));

        assertEquals("BAD_REQUEST", ex.getCode());
        assertEquals("缺少 CHANGE_PATCH 补丁产物，无法提交 PR", ex.getMessage());
        verifySubmitPrRejectedBeforeQueue();
        verify(auditLogService).record(eq(1L), eq(10L), eq("AUTO_REPAIR"), eq(12L),
                eq("AUTO_REPAIR_PR_REJECTED"), eq("FAILED"), anyMap(),
                eq("缺少 CHANGE_PATCH 补丁产物，无法提交 PR"), isNull(), isNull());
    }

    @Test
    void submitPr_enabled_shouldRejectMissingArtifactRecordBeforeQueue() {
        ReflectionTestUtils.setField(autoRepairService, "submitPrEnabled", true);
        AutoRepair repair = validPatchReadyRepair();
        when(autoRepairMapper.selectById(12L)).thenReturn(repair);
        when(artifactStorageService.listByOwner("AUTO_REPAIR", 12L)).thenReturn(List.of());

        BizException ex = assertThrows(BizException.class,
                () -> autoRepairService.submitPr(10L, 12L, 1L));

        assertEquals("BAD_REQUEST", ex.getCode());
        assertEquals("CHANGE_PATCH 补丁产物记录缺失或与当前任务不匹配，无法提交 PR", ex.getMessage());
        verifySubmitPrRejectedBeforeQueue();
    }

    @Test
    void submitPr_enabled_shouldRejectMismatchedArtifactRecordBeforeQueue() {
        ReflectionTestUtils.setField(autoRepairService, "submitPrEnabled", true);
        AutoRepair repair = validPatchReadyRepair();
        when(autoRepairMapper.selectById(12L)).thenReturn(repair);
        when(artifactStorageService.listByOwner("AUTO_REPAIR", 12L))
                .thenReturn(List.of(ArtifactRecord.builder()
                        .projectId(10L)
                        .repositoryId(100L)
                        .ownerType("AUTO_REPAIR")
                        .ownerId(12L)
                        .artifactType("CHANGE_PATCH")
                        .storagePath("artifacts/auto-repairs/12/other.patch")
                        .build()));

        BizException ex = assertThrows(BizException.class,
                () -> autoRepairService.submitPr(10L, 12L, 1L));

        assertEquals("BAD_REQUEST", ex.getCode());
        assertEquals("CHANGE_PATCH 补丁产物记录缺失或与当前任务不匹配，无法提交 PR", ex.getMessage());
        verifySubmitPrRejectedBeforeQueue();
    }

    @Test
    void submitPr_enabled_shouldRejectMissingExecutionEvidenceBeforeQueue() {
        ReflectionTestUtils.setField(autoRepairService, "submitPrEnabled", true);
        AutoRepair repair = validPatchReadyRepair();
        when(autoRepairMapper.selectById(12L)).thenReturn(repair);
        mockPatchArtifactEvidence(repair);
        when(executionTaskService.getByProjectAndSource(10L, "AUTO_REPAIR", 12L)).thenReturn(null);

        BizException ex = assertThrows(BizException.class,
                () -> autoRepairService.submitPr(10L, 12L, 1L));

        assertEquals("BAD_REQUEST", ex.getCode());
        assertEquals("缺少成功的 AutoRepair 执行任务证据，无法提交 PR", ex.getMessage());
        verifySubmitPrRejectedBeforeQueue();
    }

    @Test
    void submitPr_enabled_shouldRejectMissingGeneratePatchStepBeforeQueue() {
        ReflectionTestUtils.setField(autoRepairService, "submitPrEnabled", true);
        AutoRepair repair = validPatchReadyRepair();
        when(autoRepairMapper.selectById(12L)).thenReturn(repair);
        mockPatchArtifactEvidence(repair);
        when(executionTaskService.getByProjectAndSource(10L, "AUTO_REPAIR", 12L))
                .thenReturn(successfulAutoRepairExecutionTask(repair));
        when(executionTaskService.listSteps(88L)).thenReturn(List.of());

        BizException ex = assertThrows(BizException.class,
                () -> autoRepairService.submitPr(10L, 12L, 1L));

        assertEquals("BAD_REQUEST", ex.getCode());
        assertEquals("缺少成功的 generate_patch 执行步骤，无法提交 PR", ex.getMessage());
        verifySubmitPrRejectedBeforeQueue();
    }

    @Test
    void submitPr_enabled_shouldRejectMissingPatchReadyAuditBeforeQueue() {
        ReflectionTestUtils.setField(autoRepairService, "submitPrEnabled", true);
        AutoRepair repair = validPatchReadyRepair();
        when(autoRepairMapper.selectById(12L)).thenReturn(repair);
        mockPatchArtifactEvidence(repair);
        mockSuccessfulExecutionEvidence(repair);
        Page<AuditLog> emptyPage = new Page<>(1, 1, 0);
        emptyPage.setRecords(List.of());
        when(auditLogService.listByProject(10L, 1, 1, null, "AUTO_REPAIR", 12L,
                "AUTO_REPAIR_PATCH_READY", "SUCCESS")).thenReturn(emptyPage);

        BizException ex = assertThrows(BizException.class,
                () -> autoRepairService.submitPr(10L, 12L, 1L));

        assertEquals("BAD_REQUEST", ex.getCode());
        assertEquals("缺少 AUTO_REPAIR_PATCH_READY 成功审计事件，无法提交 PR", ex.getMessage());
        verifySubmitPrRejectedBeforeQueue();
    }

    @Test
    void submitPr_enabled_shouldRejectInvalidDiffBeforeQueue() {
        ReflectionTestUtils.setField(autoRepairService, "submitPrEnabled", true);
        AutoRepair repair = validPatchReadyRepair();
        repair.setDiffContent("""
                diff --git a/src/App.java b/src/Other.java
                --- a/src/App.java
                +++ b/src/Other.java
                @@ -1 +1 @@
                -old
                +new
                """);
        when(autoRepairMapper.selectById(12L)).thenReturn(repair);

        BizException ex = assertThrows(BizException.class,
                () -> autoRepairService.submitPr(10L, 12L, 1L));

        assertEquals("BAD_REQUEST", ex.getCode());
        assertEquals("受控 PR 补丁只能修改当前 AutoRepair 目标文件", ex.getMessage());
        verifySubmitPrRejectedBeforeQueue();
    }

    @Test
    void executeSubmitPrAsync_shouldCreateControlledPrWithGitHubAppToken() {
        ReflectionTestUtils.setField(autoRepairService, "submitPrEnabled", true);
        AutoRepair repair = AutoRepair.builder()
                .id(12L)
                .projectId(10L)
                .repositoryId(100L)
                .filePath("src/App.java")
                .targetDesc("修复空指针")
                .status("PR_RUNNING")
                .diffContent(validDiff())
                .patchArtifactPath("artifacts/auto-repairs/12/change.patch")
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
        mockPatchReadyPrEvidence(repair);
        org.mockito.Mockito.doNothing().when(gitHubAppInstallationService).assertCanCreatePullRequest(100L);
        when(repositoryService.getDecryptedToken(100L)).thenReturn("installation-token");
        when(executionTaskService.findBySource("AUTO_REPAIR", 12L))
                .thenReturn(ExecutionTask.builder().id(88L).build());
        mockCurrentPrAttempt(88L, 188L);
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
        verify(executionTaskService).startAttemptStep(188L, "validate_submit_pr_runtime", "复验受控 PR 运行时边界");
        verify(executionTaskService).completeAttemptStep(188L, "validate_submit_pr_runtime", "PR 运行时边界复验通过");
        verify(executionTaskService).startAttemptStep(188L, "clone_repository", "克隆仓库并创建修复分支");
        verify(executionTaskService).completeAttemptStep(188L, "create_pull_request", "pr ok");
        verify(executionTaskService).markAttemptSuccess(188L, "create_pull_request");
        verify(executionTaskService, never()).startStep(eq(88L), anyString(), anyString());
        verify(executionTaskService, never()).markSuccess(88L, "create_pull_request");
        verify(auditLogService).record(eq(1L), eq(10L), eq("AUTO_REPAIR"), eq(12L),
                eq("AUTO_REPAIR_PR_CREATED"), eq("SUCCESS"), anyMap(), eq("受控 PR 已创建"), isNull(), isNull());
    }

    @Test
    void executeSubmitPrAsync_shouldMarkExecutionFailedWhenPrCreationFails() {
        ReflectionTestUtils.setField(autoRepairService, "submitPrEnabled", true);
        AutoRepair repair = AutoRepair.builder()
                .id(12L)
                .projectId(10L)
                .repositoryId(100L)
                .filePath("src/App.java")
                .targetDesc("修复空指针")
                .status("PR_RUNNING")
                .diffContent(validDiff())
                .patchArtifactPath("artifacts/auto-repairs/12/change.patch")
                .build();
        Repository repo = Repository.builder()
                .id(100L)
                .projectId(10L)
                .provider("GITHUB")
                .authType("GITHUB_APP")
                .build();
        when(autoRepairMapper.selectById(12L)).thenReturn(repair);
        when(repositoryService.getDetail(100L)).thenReturn(repo);
        mockPatchReadyPrEvidence(repair);
        org.mockito.Mockito.doNothing().when(gitHubAppInstallationService).assertCanCreatePullRequest(100L);
        when(repositoryService.getDecryptedToken(100L)).thenReturn("installation-token");
        when(executionTaskService.findBySource("AUTO_REPAIR", 12L))
                .thenReturn(ExecutionTask.builder().id(88L).build());
        mockCurrentPrAttempt(88L, 188L);
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
        verify(executionTaskService).failAttemptStep(188L, "push_branch", "push failed");
        verify(executionTaskService).markAttemptFailed(188L, "push_branch", "push failed");
        verify(executionTaskService, never()).failStep(eq(88L), anyString(), anyString());
        verify(executionTaskService, never()).markFailed(eq(88L), anyString(), anyString());
        verify(auditLogService).record(eq(1L), eq(10L), eq("AUTO_REPAIR"), eq(12L),
                eq("AUTO_REPAIR_PR_FAILED"), eq("FAILED"), anyMap(), eq("push failed"), isNull(), isNull());
    }

    @Test
    void executeSubmitPrAsync_shouldMarkCreatePullRequestConflictAsFailedWithoutSuccess() {
        ReflectionTestUtils.setField(autoRepairService, "submitPrEnabled", true);
        AutoRepair repair = AutoRepair.builder()
                .id(12L)
                .projectId(10L)
                .repositoryId(100L)
                .filePath("src/App.java")
                .targetDesc("修复空指针")
                .status("PR_RUNNING")
                .diffContent(validDiff())
                .patchArtifactPath("artifacts/auto-repairs/12/change.patch")
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
        mockPatchReadyPrEvidence(repair);
        org.mockito.Mockito.doNothing().when(gitHubAppInstallationService).assertCanCreatePullRequest(100L);
        when(repositoryService.getDecryptedToken(100L)).thenReturn("installation-token");
        when(executionTaskService.findBySource("AUTO_REPAIR", 12L))
                .thenReturn(ExecutionTask.builder().id(88L).build());
        mockCurrentPrAttempt(88L, 188L);
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
        verify(executionTaskService).failAttemptStep(188L, "create_pull_request", conflictMessage);
        verify(executionTaskService).markAttemptFailed(188L, "create_pull_request", conflictMessage);
        verify(executionTaskService, never()).markAttemptSuccess(188L, "create_pull_request");
        verify(executionTaskService, never()).markSuccess(88L, "create_pull_request");
        verify(auditLogService).record(eq(1L), eq(10L), eq("AUTO_REPAIR"), eq(12L),
                eq("AUTO_REPAIR_PR_FAILED"), eq("FAILED"), anyMap(), eq(conflictMessage), isNull(), isNull());
    }

    @Test
    void executeSubmitPrAsync_shouldNotOverwriteCancelledRepairAfterPrServiceReturns() {
        ReflectionTestUtils.setField(autoRepairService, "submitPrEnabled", true);
        AutoRepair repair = AutoRepair.builder()
                .id(12L)
                .projectId(10L)
                .repositoryId(100L)
                .filePath("src/App.java")
                .targetDesc("修复空指针")
                .status("PR_RUNNING")
                .diffContent(validDiff())
                .patchArtifactPath("artifacts/auto-repairs/12/change.patch")
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
        mockPatchReadyPrEvidence(repair);
        org.mockito.Mockito.doNothing().when(gitHubAppInstallationService).assertCanCreatePullRequest(100L);
        when(repositoryService.getDecryptedToken(100L)).thenReturn("installation-token");
        when(executionTaskService.findBySource("AUTO_REPAIR", 12L))
                .thenReturn(ExecutionTask.builder().id(88L).build());
        mockCurrentPrAttempt(88L, 188L);
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
        verify(executionTaskService).cancelAttemptStep(188L, "create_pull_request", "自动补丁任务已取消");
        verify(executionTaskService).markAttemptCancelled(188L, "create_pull_request", "自动补丁任务已取消");
        verify(executionTaskService, never()).cancelStep(eq(88L), anyString(), anyString());
        verify(executionTaskService, never()).markCancelled(eq(88L), anyString(), anyString());
    }

    @Test
    void executeSubmitPrAsync_shouldFailClosedWhenSubmitPrDisabledBeforeToken() {
        AutoRepair repair = prRunningRepair();
        when(autoRepairMapper.selectById(12L)).thenReturn(repair);
        when(executionTaskService.findBySource("AUTO_REPAIR", 12L))
                .thenReturn(ExecutionTask.builder().id(88L).build());
        mockCurrentPrAttempt(88L, 188L);

        autoRepairService.executeSubmitPrAsync(12L, 1L);

        assertEquals("PATCH_READY", repair.getStatus());
        assertNull(repair.getActiveLockKey());
        assertEquals("受控 PR 提交流程未开启，请配置 sourcelens.autorepair.submit-pr-enabled=true 后再使用",
                repair.getErrorMessage());
        verify(repositoryService, never()).getDetail(anyLong());
        verify(repositoryService, never()).getDecryptedToken(anyLong());
        verify(autoRepairPrService, never()).submitPatchAsPullRequest(
                any(), any(), any(), any(), any(AutoRepairPrService.ProgressReporter.class));
        verify(executionTaskService).failAttemptStep(188L, "validate_submit_pr_runtime",
                "受控 PR 提交流程未开启，请配置 sourcelens.autorepair.submit-pr-enabled=true 后再使用");
        verify(executionTaskService).markAttemptFailed(188L, "validate_submit_pr_runtime",
                "受控 PR 提交流程未开启，请配置 sourcelens.autorepair.submit-pr-enabled=true 后再使用");
        verify(auditLogService).record(eq(1L), eq(10L), eq("AUTO_REPAIR"), eq(12L),
                eq("AUTO_REPAIR_PR_REJECTED"), eq("FAILED"), anyMap(),
                eq("受控 PR 提交流程未开启，请配置 sourcelens.autorepair.submit-pr-enabled=true 后再使用"),
                isNull(), isNull());
    }

    @Test
    void executeSubmitPrAsync_shouldFailClosedWhenRepositoryAuthDriftsToPatBeforeToken() {
        ReflectionTestUtils.setField(autoRepairService, "submitPrEnabled", true);
        AutoRepair repair = prRunningRepair();
        Repository repo = Repository.builder()
                .id(100L)
                .projectId(10L)
                .provider("GITHUB")
                .authType("PAT")
                .build();
        when(autoRepairMapper.selectById(12L)).thenReturn(repair);
        when(executionTaskService.findBySource("AUTO_REPAIR", 12L))
                .thenReturn(ExecutionTask.builder().id(88L).build());
        mockCurrentPrAttempt(88L, 188L);
        mockPatchReadyPrEvidence(repair);
        when(repositoryService.getDetail(100L)).thenReturn(repo);

        autoRepairService.executeSubmitPrAsync(12L, 1L);

        assertEquals("PATCH_READY", repair.getStatus());
        assertEquals("受控 PR 只允许使用 GitHub App installation token，不允许使用 PAT", repair.getErrorMessage());
        verify(repositoryService, never()).getDecryptedToken(anyLong());
        verify(autoRepairPrService, never()).submitPatchAsPullRequest(
                any(), any(), any(), any(), any(AutoRepairPrService.ProgressReporter.class));
        verify(executionTaskService).failAttemptStep(188L, "validate_submit_pr_runtime",
                "受控 PR 只允许使用 GitHub App installation token，不允许使用 PAT");
        verify(executionTaskService).markAttemptFailed(188L, "validate_submit_pr_runtime",
                "受控 PR 只允许使用 GitHub App installation token，不允许使用 PAT");
        verify(auditLogService).record(eq(1L), eq(10L), eq("AUTO_REPAIR"), eq(12L),
                eq("AUTO_REPAIR_PR_REJECTED"), eq("FAILED"), anyMap(),
                eq("受控 PR 只允许使用 GitHub App installation token，不允许使用 PAT"), isNull(), isNull());
    }

    @Test
    void executeSubmitPrAsync_shouldFailClosedWhenGitHubAppPermissionDriftsBeforeToken() {
        ReflectionTestUtils.setField(autoRepairService, "submitPrEnabled", true);
        AutoRepair repair = prRunningRepair();
        Repository repo = Repository.builder()
                .id(100L)
                .projectId(10L)
                .provider("GITHUB")
                .authType("GITHUB_APP")
                .build();
        when(autoRepairMapper.selectById(12L)).thenReturn(repair);
        when(executionTaskService.findBySource("AUTO_REPAIR", 12L))
                .thenReturn(ExecutionTask.builder().id(88L).build());
        mockCurrentPrAttempt(88L, 188L);
        mockPatchReadyPrEvidence(repair);
        when(repositoryService.getDetail(100L)).thenReturn(repo);
        org.mockito.Mockito.doThrow(BizException.forbidden("GitHub App installation 缺少 pull_requests:write 权限"))
                .when(gitHubAppInstallationService).assertCanCreatePullRequest(100L);

        autoRepairService.executeSubmitPrAsync(12L, 1L);

        assertEquals("PATCH_READY", repair.getStatus());
        assertEquals("GitHub App installation 缺少 pull_requests:write 权限", repair.getErrorMessage());
        verify(gitHubAppInstallationService).assertCanCreatePullRequest(100L);
        verify(repositoryService, never()).getDecryptedToken(anyLong());
        verify(autoRepairPrService, never()).submitPatchAsPullRequest(
                any(), any(), any(), any(), any(AutoRepairPrService.ProgressReporter.class));
        verify(executionTaskService).failAttemptStep(188L, "validate_submit_pr_runtime",
                "GitHub App installation 缺少 pull_requests:write 权限");
        verify(executionTaskService).markAttemptFailed(188L, "validate_submit_pr_runtime",
                "GitHub App installation 缺少 pull_requests:write 权限");
        verify(auditLogService).record(eq(1L), eq(10L), eq("AUTO_REPAIR"), eq(12L),
                eq("AUTO_REPAIR_PR_REJECTED"), eq("FAILED"), anyMap(),
                eq("GitHub App installation 缺少 pull_requests:write 权限"), isNull(), isNull());
    }

    @Test
    void executeSubmitPrAsync_shouldFailClosedWhenPatchReadyAuditDisappearsBeforeToken() {
        ReflectionTestUtils.setField(autoRepairService, "submitPrEnabled", true);
        AutoRepair repair = prRunningRepair();
        when(autoRepairMapper.selectById(12L)).thenReturn(repair);
        when(executionTaskService.findBySource("AUTO_REPAIR", 12L))
                .thenReturn(ExecutionTask.builder().id(88L).build());
        mockCurrentPrAttempt(88L, 188L);
        mockPatchArtifactEvidence(repair);
        mockSuccessfulExecutionEvidence(repair);
        Page<AuditLog> emptyPage = new Page<>(1, 1, 0);
        emptyPage.setRecords(List.of());
        when(auditLogService.listByProject(10L, 1, 1, null, "AUTO_REPAIR", 12L,
                "AUTO_REPAIR_PATCH_READY", "SUCCESS")).thenReturn(emptyPage);

        autoRepairService.executeSubmitPrAsync(12L, 1L);

        assertEquals("PATCH_READY", repair.getStatus());
        assertEquals("缺少 AUTO_REPAIR_PATCH_READY 成功审计事件，无法提交 PR", repair.getErrorMessage());
        verify(repositoryService, never()).getDetail(anyLong());
        verify(repositoryService, never()).getDecryptedToken(anyLong());
        verify(autoRepairPrService, never()).submitPatchAsPullRequest(
                any(), any(), any(), any(), any(AutoRepairPrService.ProgressReporter.class));
        verify(executionTaskService).failAttemptStep(188L, "validate_submit_pr_runtime",
                "缺少 AUTO_REPAIR_PATCH_READY 成功审计事件，无法提交 PR");
        verify(executionTaskService).markAttemptFailed(188L, "validate_submit_pr_runtime",
                "缺少 AUTO_REPAIR_PATCH_READY 成功审计事件，无法提交 PR");
        verify(auditLogService).record(eq(1L), eq(10L), eq("AUTO_REPAIR"), eq(12L),
                eq("AUTO_REPAIR_PR_REJECTED"), eq("FAILED"), anyMap(),
                eq("缺少 AUTO_REPAIR_PATCH_READY 成功审计事件，无法提交 PR"), isNull(), isNull());
    }

    @Test
    void executeSubmitPrAsync_shouldFailClosedWhenDiffDriftsBeforeToken() {
        ReflectionTestUtils.setField(autoRepairService, "submitPrEnabled", true);
        AutoRepair repair = prRunningRepair();
        repair.setDiffContent("""
                diff --git a/src/App.java b/src/Other.java
                --- a/src/App.java
                +++ b/src/Other.java
                @@ -1 +1 @@
                -old
                +new
                """);
        when(autoRepairMapper.selectById(12L)).thenReturn(repair);
        when(executionTaskService.findBySource("AUTO_REPAIR", 12L))
                .thenReturn(ExecutionTask.builder().id(88L).build());
        mockCurrentPrAttempt(88L, 188L);

        autoRepairService.executeSubmitPrAsync(12L, 1L);

        assertEquals("PATCH_READY", repair.getStatus());
        assertEquals("受控 PR 补丁只能修改当前 AutoRepair 目标文件", repair.getErrorMessage());
        verify(repositoryService, never()).getDetail(anyLong());
        verify(repositoryService, never()).getDecryptedToken(anyLong());
        verify(autoRepairPrService, never()).submitPatchAsPullRequest(
                any(), any(), any(), any(), any(AutoRepairPrService.ProgressReporter.class));
        verify(executionTaskService).failAttemptStep(188L, "validate_submit_pr_runtime",
                "受控 PR 补丁只能修改当前 AutoRepair 目标文件");
        verify(executionTaskService).markAttemptFailed(188L, "validate_submit_pr_runtime",
                "受控 PR 补丁只能修改当前 AutoRepair 目标文件");
        verify(auditLogService).record(eq(1L), eq(10L), eq("AUTO_REPAIR"), eq(12L),
                eq("AUTO_REPAIR_PR_REJECTED"), eq("FAILED"), anyMap(),
                eq("受控 PR 补丁只能修改当前 AutoRepair 目标文件"), isNull(), isNull());
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
                .diffContent(validDiff())
                .patchArtifactPath("artifacts/auto-repairs/12/change.patch")
                .build();
        Repository repo = Repository.builder()
                .id(100L)
                .projectId(10L)
                .provider("GITHUB")
                .authType("GITHUB_APP")
                .build();
        when(autoRepairMapper.selectById(12L)).thenReturn(repair);
        when(repositoryService.getDetail(100L)).thenReturn(repo);
        mockPatchReadyPrEvidence(repair);
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
                .diffContent(validDiff())
                .patchArtifactPath("artifacts/auto-repairs/12/change.patch")
                .build();
        Repository repo = Repository.builder()
                .id(100L)
                .projectId(10L)
                .provider("GITHUB")
                .authType("GITHUB_APP")
                .build();
        when(autoRepairMapper.selectById(12L)).thenReturn(repair);
        when(repositoryService.getDetail(100L)).thenReturn(repo);
        mockPatchReadyPrEvidence(repair);
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
                .diffContent(validDiff())
                .patchArtifactPath("artifacts/auto-repairs/12/change.patch")
                .build();
        Repository repo = Repository.builder()
                .id(100L)
                .projectId(10L)
                .provider("GITHUB")
                .authType("GITHUB_APP")
                .build();
        when(autoRepairMapper.selectById(12L)).thenReturn(repair);
        when(repositoryService.getDetail(100L)).thenReturn(repo);
        mockPatchReadyPrEvidence(repair);
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
                .filePath("src/App.java")
                .diffContent(validDiff())
                .patchArtifactPath("artifacts/auto-repairs/12/change.patch")
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
                .filePath("src/App.java")
                .status("PATCH_READY")
                .diffContent(validDiff())
                .patchArtifactPath("artifacts/auto-repairs/12/change.patch")
                .build();
        Repository repo = Repository.builder()
                .id(100L)
                .projectId(10L)
                .provider("GITHUB")
                .authType("PAT")
                .build();
        when(autoRepairMapper.selectById(12L)).thenReturn(repair);
        when(repositoryService.getDetail(100L)).thenReturn(repo);
        mockPatchReadyPrEvidence(repair);

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
    void cancelRepair_runningPrAttempt_shouldCancelCurrentAttemptOnly() {
        AutoRepair repair = AutoRepair.builder()
                .id(12L)
                .projectId(10L)
                .status("PR_RUNNING")
                .build();
        when(autoRepairMapper.selectById(12L)).thenReturn(repair);
        when(executionTaskService.findBySource("AUTO_REPAIR", 12L))
                .thenReturn(ExecutionTask.builder().id(88L).currentAttemptId(188L).build());

        AutoRepair cancelled = autoRepairService.cancelRepair(10L, 12L, 1L);

        assertEquals("CANCELLED", cancelled.getStatus());
        verify(executionTaskService).markAttemptCancelled(188L, "cancelled", "自动补丁任务已取消");
        verify(executionTaskService, never()).markCancelled(eq(88L), anyString(), anyString());
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
        mockValidRepository();
        when(llmConfigService.getActiveConfig(1L)).thenReturn(new LlmConfig());
    }

    private void mockValidRepository() {
        Repository repo = Repository.builder()
                .id(100L)
                .projectId(10L)
                .defaultBranch("main")
                .build();
        when(repositoryService.getDetail(100L)).thenReturn(repo);
    }

    private AutoRepair validPatchReadyRepair() {
        return AutoRepair.builder()
                .id(12L)
                .projectId(10L)
                .repositoryId(100L)
                .filePath("src/App.java")
                .targetDesc("修复空指针")
                .status("PATCH_READY")
                .diffContent(validDiff())
                .patchArtifactPath("artifacts/auto-repairs/12/change.patch")
                .build();
    }

    private AutoRepair prRunningRepair() {
        return AutoRepair.builder()
                .id(12L)
                .projectId(10L)
                .repositoryId(100L)
                .filePath("src/App.java")
                .targetDesc("修复空指针")
                .status("PR_RUNNING")
                .activeLockKey("repo:100:file:src/App.java")
                .diffContent(validDiff())
                .patchArtifactPath("artifacts/auto-repairs/12/change.patch")
                .build();
    }

    private String validDiff() {
        return """
                diff --git a/src/App.java b/src/App.java
                --- a/src/App.java
                +++ b/src/App.java
                @@ -1 +1 @@
                -old
                +new
                """;
    }

    private void mockPatchReadyPrEvidence(AutoRepair repair) {
        mockPatchArtifactEvidence(repair);
        mockSuccessfulExecutionEvidence(repair);
        mockPatchReadyAuditEvidence(repair);
    }

    private void mockPatchReadyPrEvidence(AutoRepair repair, String executionTaskStatus) {
        mockPatchArtifactEvidence(repair);
        mockSuccessfulExecutionEvidence(repair, executionTaskStatus);
        mockPatchReadyAuditEvidence(repair);
    }

    private void mockPatchArtifactEvidence(AutoRepair repair) {
        when(artifactStorageService.listByOwner("AUTO_REPAIR", repair.getId()))
                .thenReturn(List.of(ArtifactRecord.builder()
                        .projectId(repair.getProjectId())
                        .repositoryId(repair.getRepositoryId())
                        .ownerType("AUTO_REPAIR")
                        .ownerId(repair.getId())
                        .artifactType("CHANGE_PATCH")
                        .storagePath(repair.getPatchArtifactPath())
                        .build()));
    }

    private void mockSuccessfulExecutionEvidence(AutoRepair repair) {
        mockSuccessfulExecutionEvidence(repair, "SUCCESS");
    }

    private void mockSuccessfulExecutionEvidence(AutoRepair repair, String executionTaskStatus) {
        ExecutionTask executionTask = successfulAutoRepairExecutionTask(repair, executionTaskStatus);
        when(executionTaskService.getByProjectAndSource(repair.getProjectId(), "AUTO_REPAIR", repair.getId()))
                .thenReturn(executionTask);
        when(executionTaskService.listSteps(executionTask.getId()))
                .thenReturn(List.of(ExecutionStep.builder()
                        .taskId(executionTask.getId())
                        .stepKey("generate_patch")
                        .stepName("生成补丁")
                        .status("SUCCESS")
                        .build()));
    }

    private ExecutionTask successfulAutoRepairExecutionTask(AutoRepair repair) {
        return successfulAutoRepairExecutionTask(repair, "SUCCESS");
    }

    private ExecutionTask successfulAutoRepairExecutionTask(AutoRepair repair, String status) {
        return ExecutionTask.builder()
                .id(88L)
                .projectId(repair.getProjectId())
                .repositoryId(repair.getRepositoryId())
                .taskType("AUTO_REPAIR")
                .sourceType("AUTO_REPAIR")
                .sourceId(repair.getId())
                .status(status)
                .build();
    }

    private void mockCurrentPrAttempt(Long taskId, Long attemptId) {
        when(executionTaskService.getOrCreateCurrentAttempt(taskId))
                .thenReturn(ExecutionAttempt.builder()
                        .id(attemptId)
                        .taskId(taskId)
                        .status("RUNNING")
                        .build());
    }

    private void mockPatchReadyAuditEvidence(AutoRepair repair) {
        Page<AuditLog> page = new Page<>(1, 1, 1);
        page.setRecords(List.of(AuditLog.builder()
                .projectId(repair.getProjectId())
                .resourceType("AUTO_REPAIR")
                .resourceId(repair.getId())
                .action("AUTO_REPAIR_PATCH_READY")
                .status("SUCCESS")
                .build()));
        when(auditLogService.listByProject(repair.getProjectId(), 1, 1, null, "AUTO_REPAIR", repair.getId(),
                "AUTO_REPAIR_PATCH_READY", "SUCCESS")).thenReturn(page);
    }

    private void verifySubmitPrRejectedBeforeQueue() {
        verify(autoRepairMapper, never()).updateById(any(AutoRepair.class));
        verify(executionTaskService, never()).markRunning(anyLong(), anyString());
        verify(executionTaskService, never()).startNewAttempt(anyLong());
        verify(repositoryService, never()).getDecryptedToken(anyLong());
        verify(autoRepairPrService, never()).submitPatchAsPullRequest(
                any(), any(), any(), any(), any(AutoRepairPrService.ProgressReporter.class));
    }
}
