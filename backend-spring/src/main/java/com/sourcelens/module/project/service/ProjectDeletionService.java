package com.sourcelens.module.project.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.sourcelens.module.agent.entity.AgentTask;
import com.sourcelens.module.agent.entity.AgentTaskStep;
import com.sourcelens.module.agent.entity.AgentToolCall;
import com.sourcelens.module.agent.entity.Conversation;
import com.sourcelens.module.agent.entity.ConversationMessage;
import com.sourcelens.module.agent.mapper.AgentTaskMapper;
import com.sourcelens.module.agent.mapper.AgentTaskStepMapper;
import com.sourcelens.module.agent.mapper.AgentToolCallMapper;
import com.sourcelens.module.agent.mapper.ConversationMapper;
import com.sourcelens.module.agent.mapper.ConversationMessageMapper;
import com.sourcelens.module.analysis.entity.CodeChunk;
import com.sourcelens.module.analysis.entity.CodeRelationEntity;
import com.sourcelens.module.analysis.entity.CodeSymbol;
import com.sourcelens.module.analysis.entity.ScanArtifact;
import com.sourcelens.module.analysis.mapper.CodeChunkMapper;
import com.sourcelens.module.analysis.mapper.CodeRelationMapper;
import com.sourcelens.module.analysis.mapper.CodeSymbolMapper;
import com.sourcelens.module.analysis.mapper.ScanArtifactMapper;
import com.sourcelens.module.artifact.service.ArtifactStorageService;
import com.sourcelens.module.autorepair.entity.AutoRepair;
import com.sourcelens.module.autorepair.mapper.AutoRepairMapper;
import com.sourcelens.module.ci.entity.CiDiagnostic;
import com.sourcelens.module.ci.mapper.CiDiagnosticMapper;
import com.sourcelens.module.execution.entity.ExecutionAttempt;
import com.sourcelens.module.execution.entity.ExecutionLog;
import com.sourcelens.module.execution.entity.ExecutionStep;
import com.sourcelens.module.execution.entity.ExecutionTask;
import com.sourcelens.module.execution.mapper.ExecutionAttemptMapper;
import com.sourcelens.module.execution.mapper.ExecutionLogMapper;
import com.sourcelens.module.execution.mapper.ExecutionStepMapper;
import com.sourcelens.module.execution.mapper.ExecutionTaskMapper;
import com.sourcelens.module.issue.entity.IssueDecomposition;
import com.sourcelens.module.issue.entity.IssueTask;
import com.sourcelens.module.issue.mapper.IssueDecompositionMapper;
import com.sourcelens.module.issue.mapper.IssueTaskMapper;
import com.sourcelens.module.project.mapper.ProjectMapper;
import com.sourcelens.module.repository.entity.GitHubAppInstallation;
import com.sourcelens.module.repository.entity.GitHubWebhookDeliveryProject;
import com.sourcelens.module.repository.entity.Repository;
import com.sourcelens.module.repository.mapper.GitHubAppInstallationMapper;
import com.sourcelens.module.repository.mapper.GitHubWebhookDeliveryProjectMapper;
import com.sourcelens.module.repository.mapper.RepositoryMapper;
import com.sourcelens.module.review.entity.PrReview;
import com.sourcelens.module.review.entity.PrReviewComment;
import com.sourcelens.module.review.mapper.PrReviewCommentMapper;
import com.sourcelens.module.review.mapper.PrReviewMapper;
import com.sourcelens.module.scantask.entity.ScanTask;
import com.sourcelens.module.scantask.mapper.ScanTaskMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class ProjectDeletionService {

    private final ArtifactStorageService artifactStorageService;
    private final ProjectMapper projectMapper;
    private final RepositoryMapper repositoryMapper;
    private final GitHubAppInstallationMapper gitHubAppInstallationMapper;
    private final GitHubWebhookDeliveryProjectMapper gitHubWebhookDeliveryProjectMapper;
    private final ScanTaskMapper scanTaskMapper;
    private final CodeSymbolMapper codeSymbolMapper;
    private final CodeRelationMapper codeRelationMapper;
    private final CodeChunkMapper codeChunkMapper;
    private final ScanArtifactMapper scanArtifactMapper;
    private final ExecutionTaskMapper executionTaskMapper;
    private final ExecutionStepMapper executionStepMapper;
    private final ExecutionAttemptMapper executionAttemptMapper;
    private final ExecutionLogMapper executionLogMapper;
    private final AgentTaskMapper agentTaskMapper;
    private final AgentTaskStepMapper agentTaskStepMapper;
    private final AgentToolCallMapper agentToolCallMapper;
    private final ConversationMapper conversationMapper;
    private final ConversationMessageMapper conversationMessageMapper;
    private final AutoRepairMapper autoRepairMapper;
    private final CiDiagnosticMapper ciDiagnosticMapper;
    private final PrReviewMapper prReviewMapper;
    private final PrReviewCommentMapper prReviewCommentMapper;
    private final IssueDecompositionMapper issueDecompositionMapper;
    private final IssueTaskMapper issueTaskMapper;

    @Transactional
    public void deleteProjectCascade(Long projectId) {
        List<Long> scanTaskIds = ids(scanTaskMapper.selectList(new LambdaQueryWrapper<ScanTask>()
                .eq(ScanTask::getProjectId, projectId)));
        List<Long> executionTaskIds = ids(executionTaskMapper.selectList(new LambdaQueryWrapper<ExecutionTask>()
                .eq(ExecutionTask::getProjectId, projectId)));
        List<Long> agentTaskIds = ids(agentTaskMapper.selectList(new LambdaQueryWrapper<AgentTask>()
                .eq(AgentTask::getProjectId, projectId)));
        List<Long> conversationIds = ids(conversationMapper.selectList(new LambdaQueryWrapper<Conversation>()
                .eq(Conversation::getProjectId, projectId)));
        List<Long> prReviewIds = ids(prReviewMapper.selectList(new LambdaQueryWrapper<PrReview>()
                .eq(PrReview::getProjectId, projectId)));
        List<Long> issueDecompositionIds = ids(issueDecompositionMapper.selectList(new LambdaQueryWrapper<IssueDecomposition>()
                .eq(IssueDecomposition::getProjectId, projectId)));

        artifactStorageService.deleteByProject(projectId);

        deleteScanChildren(scanTaskIds);
        deleteExecutionChildren(executionTaskIds);
        deleteAgentChildren(projectId, agentTaskIds, conversationIds);
        deleteReviewChildren(prReviewIds);
        deleteIssueChildren(issueDecompositionIds);

        ciDiagnosticMapper.delete(new LambdaQueryWrapper<CiDiagnostic>().eq(CiDiagnostic::getProjectId, projectId));
        autoRepairMapper.delete(new LambdaQueryWrapper<AutoRepair>().eq(AutoRepair::getProjectId, projectId));
        gitHubWebhookDeliveryProjectMapper.delete(new LambdaQueryWrapper<GitHubWebhookDeliveryProject>()
                .eq(GitHubWebhookDeliveryProject::getProjectId, projectId));
        gitHubAppInstallationMapper.delete(new LambdaQueryWrapper<GitHubAppInstallation>()
                .eq(GitHubAppInstallation::getProjectId, projectId));
        repositoryMapper.delete(new LambdaQueryWrapper<Repository>().eq(Repository::getProjectId, projectId));
        scanTaskMapper.delete(new LambdaQueryWrapper<ScanTask>().eq(ScanTask::getProjectId, projectId));
        prReviewMapper.delete(new LambdaQueryWrapper<PrReview>().eq(PrReview::getProjectId, projectId));
        issueDecompositionMapper.delete(new LambdaQueryWrapper<IssueDecomposition>()
                .eq(IssueDecomposition::getProjectId, projectId));
        agentTaskMapper.delete(new LambdaQueryWrapper<AgentTask>().eq(AgentTask::getProjectId, projectId));
        conversationMapper.delete(new LambdaQueryWrapper<Conversation>().eq(Conversation::getProjectId, projectId));
        executionTaskMapper.delete(new LambdaQueryWrapper<ExecutionTask>().eq(ExecutionTask::getProjectId, projectId));
        projectMapper.deleteById(projectId);
    }

    private void deleteScanChildren(List<Long> scanTaskIds) {
        if (scanTaskIds.isEmpty()) {
            return;
        }
        codeSymbolMapper.delete(new LambdaQueryWrapper<CodeSymbol>().in(CodeSymbol::getScanTaskId, scanTaskIds));
        codeRelationMapper.delete(new LambdaQueryWrapper<CodeRelationEntity>()
                .in(CodeRelationEntity::getScanTaskId, scanTaskIds));
        codeChunkMapper.delete(new LambdaQueryWrapper<CodeChunk>().in(CodeChunk::getScanTaskId, scanTaskIds));
        scanArtifactMapper.delete(new LambdaQueryWrapper<ScanArtifact>().in(ScanArtifact::getScanTaskId, scanTaskIds));
    }

    private void deleteExecutionChildren(List<Long> executionTaskIds) {
        if (executionTaskIds.isEmpty()) {
            return;
        }
        executionLogMapper.delete(new LambdaQueryWrapper<ExecutionLog>()
                .in(ExecutionLog::getTaskId, executionTaskIds));
        executionStepMapper.delete(new LambdaQueryWrapper<ExecutionStep>()
                .in(ExecutionStep::getTaskId, executionTaskIds));
        executionAttemptMapper.delete(new LambdaQueryWrapper<ExecutionAttempt>()
                .in(ExecutionAttempt::getTaskId, executionTaskIds));
    }

    private void deleteAgentChildren(Long projectId, List<Long> agentTaskIds, List<Long> conversationIds) {
        agentToolCallMapper.delete(new LambdaQueryWrapper<AgentToolCall>()
                .eq(AgentToolCall::getProjectId, projectId));
        if (!agentTaskIds.isEmpty()) {
            agentTaskStepMapper.delete(new LambdaQueryWrapper<AgentTaskStep>()
                    .in(AgentTaskStep::getTaskId, agentTaskIds));
        }
        if (!conversationIds.isEmpty()) {
            conversationMessageMapper.delete(new LambdaQueryWrapper<ConversationMessage>()
                    .in(ConversationMessage::getConversationId, conversationIds));
        }
    }

    private void deleteReviewChildren(List<Long> prReviewIds) {
        if (prReviewIds.isEmpty()) {
            return;
        }
        prReviewCommentMapper.delete(new LambdaQueryWrapper<PrReviewComment>()
                .in(PrReviewComment::getReviewId, prReviewIds));
    }

    private void deleteIssueChildren(List<Long> issueDecompositionIds) {
        if (issueDecompositionIds.isEmpty()) {
            return;
        }
        issueTaskMapper.delete(new LambdaQueryWrapper<IssueTask>()
                .in(IssueTask::getDecompositionId, issueDecompositionIds));
    }

    private List<Long> ids(Collection<?> records) {
        return records.stream()
                .map(record -> {
                    if (record instanceof ScanTask value) return value.getId();
                    if (record instanceof ExecutionTask value) return value.getId();
                    if (record instanceof AgentTask value) return value.getId();
                    if (record instanceof Conversation value) return value.getId();
                    if (record instanceof PrReview value) return value.getId();
                    if (record instanceof IssueDecomposition value) return value.getId();
                    return null;
                })
                .filter(Objects::nonNull)
                .toList();
    }
}
