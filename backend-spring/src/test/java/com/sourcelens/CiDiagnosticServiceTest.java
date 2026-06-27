package com.sourcelens;

import com.sourcelens.common.exception.BizException;
import com.sourcelens.module.agent.entity.LlmConfig;
import com.sourcelens.module.agent.service.LlmClient;
import com.sourcelens.module.agent.service.LlmConfigService;
import com.sourcelens.module.agent.service.LlmJsonExtractor;
import com.sourcelens.module.ci.dto.CreateCiDiagnosticRequest;
import com.sourcelens.module.ci.entity.CiDiagnostic;
import com.sourcelens.module.ci.mapper.CiDiagnosticMapper;
import com.sourcelens.module.ci.service.CiDiagnosticService;
import com.sourcelens.module.execution.entity.ExecutionAttempt;
import com.sourcelens.module.execution.entity.ExecutionTask;
import com.sourcelens.module.execution.service.ExecutionTaskService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CiDiagnosticServiceTest {

    @Mock
    private LlmClient llmClient;

    @Mock
    private LlmConfigService llmConfigService;

    @Mock
    private LlmJsonExtractor llmJsonExtractor;

    @Mock
    private CiDiagnosticMapper ciDiagnosticMapper;

    @Mock
    private ExecutionTaskService executionTaskService;

    @InjectMocks
    private CiDiagnosticService ciDiagnosticService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(ciDiagnosticService, "baseMapper", ciDiagnosticMapper);
    }

    @Test
    void create_shouldBuildPendingDiagnostic() {
        doAnswer(invocation -> {
            CiDiagnostic diagnostic = invocation.getArgument(0);
            diagnostic.setId(42L);
            return 1;
        }).when(ciDiagnosticMapper).insert(any(CiDiagnostic.class));

        CreateCiDiagnosticRequest req = new CreateCiDiagnosticRequest();
        req.setProjectId(10L);
        req.setWorkflowName("build");
        req.setRawLogSnippet("error: cannot find symbol\nAuthorization: Bearer live-token");

        CiDiagnostic diagnostic = ciDiagnosticService.create(req, 1L);

        assertEquals(42L, diagnostic.getId());
        assertEquals("PENDING", diagnostic.getStatus());
        assertEquals("GITHUB_ACTIONS", diagnostic.getProvider());
        assertTrue(diagnostic.getRawLogSnippet().contains("Bearer ****"));
        assertFalse(diagnostic.getRawLogSnippet().contains("live-token"));
        verify(executionTaskService).create(10L, null, "CI_DIAGNOSTIC", "CI_DIAGNOSTIC", 42L, 1L);
    }

    @Test
    void analyze_pendingDiagnostic_shouldClaimAndCompleteWithRuleEngine() {
        CiDiagnostic diagnostic = CiDiagnostic.builder()
                .id(42L)
                .projectId(10L)
                .status("PENDING")
                .conclusion("failure")
                .rawLogSnippet("src/App.java:10: error: cannot find symbol api_key=sk-12345678abcdefghijklmnop")
                .createdBy(1L)
                .build();
        when(ciDiagnosticMapper.selectById(42L)).thenReturn(diagnostic);
        when(ciDiagnosticMapper.update(any(CiDiagnostic.class), any())).thenReturn(1);
        when(executionTaskService.findBySource("CI_DIAGNOSTIC", 42L))
                .thenReturn(ExecutionTask.builder().id(88L).build());
        when(executionTaskService.getOrCreateCurrentAttempt(88L))
                .thenReturn(ExecutionAttempt.builder().id(99L).taskId(88L).attemptNo(1).build());

        ciDiagnosticService.analyze(42L);

        assertEquals("COMPLETED", diagnostic.getStatus());
        assertEquals("COMPILE", diagnostic.getErrorCategory());
        assertTrue(diagnostic.getDiagnosticJson().contains("api_key=****"));
        assertFalse(diagnostic.getDiagnosticJson().contains("12345678abcdefghijklmnop"));
        verify(ciDiagnosticMapper).update(any(CiDiagnostic.class), any());
        verify(ciDiagnosticMapper).updateById(diagnostic);
        verify(executionTaskService).startAttemptStep(99L, "analyze_ci_failure", "分析 CI 失败日志");
        verify(executionTaskService).completeAttemptStep(99L, "analyze_ci_failure", "CI 诊断完成: COMPILE");
        verify(executionTaskService).markAttemptSuccess(99L, "analyze_ci_failure");
    }

    @Test
    void analyze_whenClaimFails_shouldSkipWithoutRunningLlmOrWritingResult() {
        CiDiagnostic diagnostic = CiDiagnostic.builder()
                .id(42L)
                .projectId(10L)
                .status("PENDING")
                .rawLogSnippet("error")
                .createdBy(1L)
                .build();
        when(ciDiagnosticMapper.selectById(42L)).thenReturn(diagnostic);
        when(ciDiagnosticMapper.update(any(CiDiagnostic.class), any())).thenReturn(0);

        ciDiagnosticService.analyze(42L);

        assertEquals("PENDING", diagnostic.getStatus());
        verify(llmConfigService, never()).getActiveConfig(1L);
        verify(ciDiagnosticMapper, never()).updateById(diagnostic);
        verify(executionTaskService, never()).findBySource("CI_DIAGNOSTIC", 42L);
    }

    @Test
    void analyze_whenLlmFails_shouldFallbackAndSyncSuccessfulExecutionTask() {
        CiDiagnostic diagnostic = CiDiagnostic.builder()
                .id(42L)
                .projectId(10L)
                .status("PENDING")
                .rawLogSnippet("error")
                .createdBy(1L)
                .build();
        LlmConfig config = new LlmConfig();
        config.setId(7L);
        config.setModelName("mock-model");
        when(ciDiagnosticMapper.selectById(42L)).thenReturn(diagnostic);
        when(ciDiagnosticMapper.update(any(CiDiagnostic.class), any())).thenReturn(1);
        when(executionTaskService.findBySource("CI_DIAGNOSTIC", 42L))
                .thenReturn(ExecutionTask.builder().id(88L).build());
        when(executionTaskService.getOrCreateCurrentAttempt(88L))
                .thenReturn(ExecutionAttempt.builder().id(99L).taskId(88L).attemptNo(1).build());
        when(llmConfigService.getActiveConfig(1L)).thenReturn(config);
        when(llmClient.chat(any(LlmConfig.class), anyString()))
                .thenThrow(new IllegalStateException("llm unavailable"));

        ciDiagnosticService.analyze(42L);

        assertEquals("COMPLETED", diagnostic.getStatus());
        verify(executionTaskService).markAttemptSuccess(99L, "analyze_ci_failure");
    }

    @Test
    void requeueAnalysis_analyzingDiagnostic_shouldReject() {
        CiDiagnostic diagnostic = CiDiagnostic.builder()
                .id(42L)
                .projectId(10L)
                .status("ANALYZING")
                .deleted(false)
                .build();
        when(ciDiagnosticMapper.selectById(42L)).thenReturn(diagnostic);

        BizException ex = assertThrows(BizException.class,
                () -> ciDiagnosticService.requeueAnalysis(42L));

        assertEquals("BAD_REQUEST", ex.getCode());
        verify(ciDiagnosticMapper, never()).updateById(any(CiDiagnostic.class));
    }

    @Test
    void requeueAnalysis_nonRunningDiagnostic_shouldStartNewExecutionAttempt() {
        CiDiagnostic diagnostic = CiDiagnostic.builder()
                .id(42L)
                .projectId(10L)
                .status("FAILED")
                .createdBy(1L)
                .deleted(false)
                .build();
        when(ciDiagnosticMapper.selectById(42L)).thenReturn(diagnostic);
        when(executionTaskService.findBySource("CI_DIAGNOSTIC", 42L))
                .thenReturn(ExecutionTask.builder().id(88L).build());

        CiDiagnostic result = ciDiagnosticService.requeueAnalysis(42L);

        assertEquals("PENDING", result.getStatus());
        verify(ciDiagnosticMapper).updateById(diagnostic);
        verify(executionTaskService).startNewAttempt(88L);
    }
}
