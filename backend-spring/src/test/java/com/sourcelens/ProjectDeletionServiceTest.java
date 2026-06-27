package com.sourcelens;

import com.sourcelens.module.agent.entity.AgentTask;
import com.sourcelens.module.agent.entity.Conversation;
import com.sourcelens.module.agent.mapper.AgentTaskMapper;
import com.sourcelens.module.agent.mapper.AgentTaskStepMapper;
import com.sourcelens.module.agent.mapper.AgentToolCallMapper;
import com.sourcelens.module.agent.mapper.ConversationMapper;
import com.sourcelens.module.agent.mapper.ConversationMessageMapper;
import com.sourcelens.module.analysis.mapper.CodeChunkMapper;
import com.sourcelens.module.analysis.mapper.CodeRelationMapper;
import com.sourcelens.module.analysis.mapper.CodeSymbolMapper;
import com.sourcelens.module.analysis.mapper.ScanArtifactMapper;
import com.sourcelens.module.artifact.service.ArtifactStorageService;
import com.sourcelens.module.autorepair.mapper.AutoRepairMapper;
import com.sourcelens.module.ci.mapper.CiDiagnosticMapper;
import com.sourcelens.module.execution.entity.ExecutionTask;
import com.sourcelens.module.execution.mapper.ExecutionAttemptMapper;
import com.sourcelens.module.execution.mapper.ExecutionLogMapper;
import com.sourcelens.module.execution.mapper.ExecutionStepMapper;
import com.sourcelens.module.execution.mapper.ExecutionTaskMapper;
import com.sourcelens.module.issue.entity.IssueDecomposition;
import com.sourcelens.module.issue.mapper.IssueDecompositionMapper;
import com.sourcelens.module.issue.mapper.IssueTaskMapper;
import com.sourcelens.module.project.mapper.ProjectMapper;
import com.sourcelens.module.project.service.ProjectDeletionService;
import com.sourcelens.module.repository.mapper.GitHubAppInstallationMapper;
import com.sourcelens.module.repository.mapper.GitHubWebhookDeliveryProjectMapper;
import com.sourcelens.module.repository.mapper.RepositoryMapper;
import com.sourcelens.module.review.entity.PrReview;
import com.sourcelens.module.review.mapper.PrReviewCommentMapper;
import com.sourcelens.module.review.mapper.PrReviewMapper;
import com.sourcelens.module.scantask.entity.ScanTask;
import com.sourcelens.module.scantask.mapper.ScanTaskMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProjectDeletionServiceTest {

    @Mock private ArtifactStorageService artifactStorageService;
    @Mock private ProjectMapper projectMapper;
    @Mock private RepositoryMapper repositoryMapper;
    @Mock private GitHubAppInstallationMapper gitHubAppInstallationMapper;
    @Mock private GitHubWebhookDeliveryProjectMapper gitHubWebhookDeliveryProjectMapper;
    @Mock private ScanTaskMapper scanTaskMapper;
    @Mock private CodeSymbolMapper codeSymbolMapper;
    @Mock private CodeRelationMapper codeRelationMapper;
    @Mock private CodeChunkMapper codeChunkMapper;
    @Mock private ScanArtifactMapper scanArtifactMapper;
    @Mock private ExecutionTaskMapper executionTaskMapper;
    @Mock private ExecutionStepMapper executionStepMapper;
    @Mock private ExecutionAttemptMapper executionAttemptMapper;
    @Mock private ExecutionLogMapper executionLogMapper;
    @Mock private AgentTaskMapper agentTaskMapper;
    @Mock private AgentTaskStepMapper agentTaskStepMapper;
    @Mock private AgentToolCallMapper agentToolCallMapper;
    @Mock private ConversationMapper conversationMapper;
    @Mock private ConversationMessageMapper conversationMessageMapper;
    @Mock private AutoRepairMapper autoRepairMapper;
    @Mock private CiDiagnosticMapper ciDiagnosticMapper;
    @Mock private PrReviewMapper prReviewMapper;
    @Mock private PrReviewCommentMapper prReviewCommentMapper;
    @Mock private IssueDecompositionMapper issueDecompositionMapper;
    @Mock private IssueTaskMapper issueTaskMapper;

    @InjectMocks
    private ProjectDeletionService service;

    @Test
    void deleteProjectCascade_shouldCleanupProjectOwnedDataAndDeleteProjectLast() {
        when(scanTaskMapper.selectList(any())).thenReturn(List.of(ScanTask.builder().id(1L).build()));
        when(executionTaskMapper.selectList(any())).thenReturn(List.of(ExecutionTask.builder().id(2L).build()));
        when(agentTaskMapper.selectList(any())).thenReturn(List.of(AgentTask.builder().id(3L).build()));
        when(conversationMapper.selectList(any())).thenReturn(List.of(Conversation.builder().id(4L).build()));
        when(prReviewMapper.selectList(any())).thenReturn(List.of(PrReview.builder().id(5L).build()));
        when(issueDecompositionMapper.selectList(any())).thenReturn(List.of(IssueDecomposition.builder().id(6L).build()));

        service.deleteProjectCascade(10L);

        verify(artifactStorageService).deleteByProject(10L);
        verify(codeSymbolMapper).delete(any());
        verify(codeRelationMapper).delete(any());
        verify(codeChunkMapper).delete(any());
        verify(scanArtifactMapper).delete(any());
        verify(executionLogMapper).delete(any());
        verify(executionStepMapper).delete(any());
        verify(executionAttemptMapper).delete(any());
        verify(agentToolCallMapper).delete(any());
        verify(agentTaskStepMapper).delete(any());
        verify(conversationMessageMapper).delete(any());
        verify(prReviewCommentMapper).delete(any());
        verify(issueTaskMapper).delete(any());
        verify(ciDiagnosticMapper).delete(any());
        verify(autoRepairMapper).delete(any());
        verify(gitHubAppInstallationMapper).delete(any());
        verify(repositoryMapper).delete(any());
        verify(scanTaskMapper).delete(any());
        verify(prReviewMapper).delete(any());
        verify(issueDecompositionMapper).delete(any());
        verify(agentTaskMapper).delete(any());
        verify(conversationMapper).delete(any());
        verify(executionTaskMapper).delete(any());

        InOrder order = inOrder(repositoryMapper, projectMapper);
        order.verify(repositoryMapper).delete(any());
        order.verify(projectMapper).deleteById(10L);
    }
}
