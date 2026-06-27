package com.sourcelens;

import com.sourcelens.common.exception.BizException;
import com.sourcelens.module.agent.service.LlmClient;
import com.sourcelens.module.agent.service.LlmConfigService;
import com.sourcelens.module.agent.service.LlmJsonExtractor;
import com.sourcelens.module.execution.entity.ExecutionAttempt;
import com.sourcelens.module.execution.entity.ExecutionTask;
import com.sourcelens.module.execution.service.ExecutionTaskService;
import com.sourcelens.module.review.dto.CreatePrReviewRequest;
import com.sourcelens.module.review.entity.PrReview;
import com.sourcelens.module.review.entity.PrReviewComment;
import com.sourcelens.module.review.mapper.PrReviewCommentMapper;
import com.sourcelens.module.review.mapper.PrReviewMapper;
import com.sourcelens.module.review.service.PrReviewService;
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
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PrReviewServiceTest {

    @Mock
    private PrReviewCommentMapper commentMapper;

    @Mock
    private LlmClient llmClient;

    @Mock
    private LlmConfigService llmConfigService;

    @Mock
    private LlmJsonExtractor llmJsonExtractor;

    @Mock
    private ExecutionTaskService executionTaskService;

    @Mock
    private PrReviewMapper prReviewMapper;

    @InjectMocks
    private PrReviewService prReviewService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(prReviewService, "baseMapper", prReviewMapper);
    }

    @Test
    void create_shouldCreateExecutionTask() {
        when(prReviewMapper.insert(any(PrReview.class))).thenAnswer(invocation -> {
            PrReview review = invocation.getArgument(0);
            review.setId(42L);
            return 1;
        });

        CreatePrReviewRequest req = new CreatePrReviewRequest();
        req.setProjectId(10L);
        req.setRepositoryId(20L);
        req.setPrNumber(7);
        req.setChangedFiles("[]");
        req.setDiffSummary("+ Authorization: Bearer live-token");

        PrReview review = prReviewService.create(req, 1L);

        assertEquals(42L, review.getId());
        assertTrue(review.getDiffSummary().contains("Bearer ****"));
        assertFalse(review.getDiffSummary().contains("live-token"));
        verify(executionTaskService).create(10L, 20L, "PR_REVIEW", "PR_REVIEW", 42L, 1L);
    }

    @Test
    void analyze_pendingReview_shouldClaimAndCompleteWithRuleEngine() {
        PrReview review = PrReview.builder()
                .id(42L)
                .projectId(10L)
                .repositoryId(20L)
                .status("PENDING")
                .changedFiles("[\"src/App.java\"]")
                .diffSummary("+ public String api_key = \"sk-12345678abcdefghijklmnop\";")
                .createdBy(1L)
                .build();
        when(prReviewMapper.selectById(42L)).thenReturn(review);
        when(prReviewMapper.update(any(PrReview.class), any())).thenReturn(1);
        when(executionTaskService.findBySource("PR_REVIEW", 42L))
                .thenReturn(ExecutionTask.builder().id(88L).build());
        when(executionTaskService.getOrCreateCurrentAttempt(88L))
                .thenReturn(ExecutionAttempt.builder().id(99L).taskId(88L).attemptNo(1).build());

        prReviewService.analyze(42L);

        assertEquals("COMPLETED", review.getStatus());
        assertEquals("HIGH", review.getRiskLevel());
        assertFalse(review.getReviewJson().contains("12345678abcdefghijklmnop"));
        ArgumentCaptor<PrReviewComment> commentCaptor = ArgumentCaptor.forClass(PrReviewComment.class);
        verify(commentMapper, org.mockito.Mockito.atLeastOnce()).insert(commentCaptor.capture());
        assertTrue(commentCaptor.getAllValues().stream()
                .anyMatch(comment -> comment.getMessage() != null && comment.getMessage().contains("api_key = \"****\"")));
        assertFalse(commentCaptor.getAllValues().stream()
                .anyMatch(comment -> (comment.getMessage() != null && comment.getMessage().contains("12345678abcdefghijklmnop"))
                        || (comment.getSuggestion() != null && comment.getSuggestion().contains("12345678abcdefghijklmnop"))));
        verify(prReviewMapper).update(any(PrReview.class), any());
        verify(commentMapper).delete(any());
        verify(executionTaskService).startAttemptStep(99L, "analyze_pr_review", "分析 Pull Request 风险");
        verify(executionTaskService).completeAttemptStep(99L, "analyze_pr_review", "PR 审查完成: HIGH");
        verify(executionTaskService).markAttemptSuccess(99L, "analyze_pr_review");
        verify(prReviewMapper).updateById(review);
    }

    @Test
    void analyze_whenClaimFails_shouldSkipWithoutLlmOrComments() {
        PrReview review = PrReview.builder()
                .id(42L)
                .projectId(10L)
                .status("PENDING")
                .changedFiles("[]")
                .diffSummary("+ change")
                .createdBy(1L)
                .build();
        when(prReviewMapper.selectById(42L)).thenReturn(review);
        when(prReviewMapper.update(any(PrReview.class), any())).thenReturn(0);

        prReviewService.analyze(42L);

        assertEquals("PENDING", review.getStatus());
        verify(llmConfigService, never()).getActiveConfig(1L);
        verify(executionTaskService, never()).findBySource(anyString(), anyLong());
        verify(executionTaskService, never()).startAttemptStep(anyLong(), anyString(), anyString());
        verify(prReviewMapper, never()).updateById(review);
        verify(commentMapper, never()).insert(any(PrReviewComment.class));
    }

    @Test
    void requeueAnalysis_analyzingReview_shouldReject() {
        PrReview review = PrReview.builder()
                .id(42L)
                .projectId(10L)
                .status("ANALYZING")
                .deleted(false)
                .build();
        when(prReviewMapper.selectById(42L)).thenReturn(review);

        BizException ex = assertThrows(BizException.class,
                () -> prReviewService.requeueAnalysis(42L));

        assertEquals("BAD_REQUEST", ex.getCode());
        verify(prReviewMapper, never()).updateById(any(PrReview.class));
    }

    @Test
    void requeueAnalysis_nonRunningReview_shouldRequeueAndEnsureExecutionTask() {
        PrReview review = PrReview.builder()
                .id(42L)
                .projectId(10L)
                .repositoryId(20L)
                .status("FAILED")
                .createdBy(1L)
                .deleted(false)
                .build();
        when(prReviewMapper.selectById(42L)).thenReturn(review);
        when(executionTaskService.findBySource("PR_REVIEW", 42L)).thenReturn(null);
        when(executionTaskService.create(10L, 20L, "PR_REVIEW", "PR_REVIEW", 42L, 1L))
                .thenReturn(ExecutionTask.builder().id(88L).build());

        PrReview result = prReviewService.requeueAnalysis(42L);

        assertEquals("PENDING", result.getStatus());
        verify(prReviewMapper).updateById(review);
        verify(executionTaskService).create(10L, 20L, "PR_REVIEW", "PR_REVIEW", 42L, 1L);
        verify(executionTaskService).startNewAttempt(88L);
    }

    @Test
    void analyze_whenCommentInsertFails_shouldMarkReviewAndExecutionTaskFailed() {
        PrReview review = PrReview.builder()
                .id(42L)
                .projectId(10L)
                .repositoryId(20L)
                .status("PENDING")
                .changedFiles("[\"src/App.java\"]")
                .diffSummary("+ public String token = \"hardcoded\";")
                .createdBy(1L)
                .build();
        when(prReviewMapper.selectById(42L)).thenReturn(review);
        when(prReviewMapper.update(any(PrReview.class), any())).thenReturn(1);
        when(executionTaskService.findBySource("PR_REVIEW", 42L))
                .thenReturn(ExecutionTask.builder().id(88L).build());
        when(executionTaskService.getOrCreateCurrentAttempt(88L))
                .thenReturn(ExecutionAttempt.builder().id(99L).taskId(88L).attemptNo(1).build());
        when(commentMapper.insert(any(PrReviewComment.class))).thenThrow(new IllegalStateException("comment write failed"));

        prReviewService.analyze(42L);

        assertEquals("FAILED", review.getStatus());
        assertEquals("comment write failed", review.getErrorMessage());
        verify(executionTaskService).failAttemptStep(99L, "analyze_pr_review", "comment write failed");
        verify(executionTaskService).markAttemptFailed(99L, "analyze_pr_review", "comment write failed");
    }
}
