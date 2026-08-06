package com.sourcelens.module.scantask.controller;

import com.sourcelens.common.Result;
import com.sourcelens.common.exception.BizException;
import com.sourcelens.module.agent.entity.AgentTask;
import com.sourcelens.module.agent.mapper.AgentTaskMapper;
import com.sourcelens.module.artifact.entity.ArtifactRecord;
import com.sourcelens.module.artifact.service.ArtifactStorageService;
import com.sourcelens.module.audit.service.AuditLogService;
import com.sourcelens.module.autorepair.entity.AutoRepair;
import com.sourcelens.module.autorepair.mapper.AutoRepairMapper;
import com.sourcelens.module.execution.entity.ExecutionTask;
import com.sourcelens.module.execution.service.ExecutionTaskService;
import com.sourcelens.module.project.service.ProjectService;
import com.sourcelens.module.repository.entity.Repository;
import com.sourcelens.module.repository.service.RepositoryService;
import com.sourcelens.module.scantask.entity.ScanTask;
import com.sourcelens.module.scantask.service.ScanTaskService;
import io.swagger.v3.oas.annotations.Hidden;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Hidden
@Profile({"dev & !prod", "test & !prod"})
@RestController
@RequestMapping("/api/dev/projects/{projectId}/scan-governance-smoke-seed")
@RequiredArgsConstructor
public class ScanGovernanceSmokeSeedController {

    private static final String AUTO_REPAIR_ACTION = "AUTO_REPAIR_PATCH_READY";
    private static final String AGENT_TASK_ACTION = "AGENT_TASK_SMOKE_READY";
    private static final String SMOKE_SOURCE = "scan-governance-smoke";

    private final ProjectService projectService;
    private final RepositoryService repositoryService;
    private final ScanTaskService scanTaskService;
    private final AutoRepairMapper autoRepairMapper;
    private final AgentTaskMapper agentTaskMapper;
    private final ArtifactStorageService artifactStorageService;
    private final AuditLogService auditLogService;
    private final ExecutionTaskService executionTaskService;

    @PostMapping
    public Result<SeedResult> seed(@PathVariable Long projectId,
                                   @RequestBody SeedRequest request,
                                   @RequestAttribute("userId") Long userId) {
        projectService.verifyOwnership(projectId, userId);
        if (request == null || request.getRepositoryId() == null || request.getScanTaskId() == null) {
            throw BizException.badRequest("repositoryId 和 scanTaskId 不能为空");
        }

        Repository repository = repositoryService.getDetail(request.getRepositoryId());
        if (repository == null) {
            throw BizException.notFound("Repository");
        }
        if (!projectId.equals(repository.getProjectId())) {
            throw BizException.forbidden("仓库不属于当前项目");
        }

        ScanTask scanTask = scanTaskService.getById(request.getScanTaskId());
        if (scanTask == null) {
            throw BizException.notFound("ScanTask");
        }
        if (!projectId.equals(scanTask.getProjectId()) || !repository.getId().equals(scanTask.getRepositoryId())) {
            throw BizException.forbidden("扫描任务不属于当前项目仓库");
        }
        if (!"SUCCESS".equalsIgnoreCase(String.valueOf(scanTask.getStatus()))) {
            throw BizException.badRequest("扫描任务必须成功后才能生成治理 smoke 样本");
        }

        String seedId = "scan-governance-smoke-" + UUID.randomUUID();
        LocalDateTime now = LocalDateTime.now();
        AutoRepair repair = AutoRepair.builder()
                .projectId(projectId)
                .repositoryId(repository.getId())
                .scanTaskId(scanTask.getId())
                .filePath("src/main/java/com/sourcelens/smoke/GovernanceSmoke.java")
                .targetDesc("public repo UI smoke 派生治理样本")
                .status("PATCH_READY")
                .diffContent("diff --git a/GovernanceSmoke.java b/GovernanceSmoke.java\n+// governance smoke\n")
                .patchArtifactPath(seedId + ".patch")
                .createdBy(userId)
                .createdAt(now)
                .updatedAt(now)
                .build();
        autoRepairMapper.insert(repair);

        AgentTask agentTask = AgentTask.builder()
                .scanTaskId(scanTask.getId())
                .projectId(projectId)
                .taskType("ARCHITECTURE_REVIEW")
                .title("Governance smoke Agent review")
                .description("public repo UI smoke 派生 Agent 报告样本")
                .status("COMPLETED")
                .priority("LOW")
                .inputJson("{\"source\":\"" + SMOKE_SOURCE + "\"}")
                .outputJson("{\"status\":\"OK\",\"seedId\":\"" + seedId + "\"}")
                .summary("Agent governance smoke report ready")
                .startedAt(now)
                .finishedAt(now)
                .createdBy(userId)
                .createdAt(now)
                .updatedAt(now)
                .deleted(false)
                .build();
        agentTaskMapper.insert(agentTask);

        ArtifactRecord patchArtifact = artifactStorageService.storeText(
                projectId,
                repository.getId(),
                "AUTO_REPAIR",
                repair.getId(),
                "CHANGE_PATCH",
                "governance-smoke.patch",
                "text/x-diff",
                repair.getDiffContent(),
                userId);
        ArtifactRecord agentReportArtifact = artifactStorageService.storeText(
                projectId,
                repository.getId(),
                "AGENT_TASK",
                agentTask.getId(),
                "AGENT_REPORT",
                "governance-agent-report.json",
                "application/json",
                "{\"status\":\"OK\",\"seedId\":\"" + seedId + "\",\"scanTaskId\":" + scanTask.getId() + "}",
                userId);
        ExecutionTask repairExecution = executionTaskService.create(projectId, repository.getId(), "AUTO_REPAIR",
                "AUTO_REPAIR", repair.getId(), userId);
        if (repairExecution != null && repairExecution.getId() != null) {
            executionTaskService.startStep(repairExecution.getId(), "generate_patch", "生成补丁");
            executionTaskService.completeStep(repairExecution.getId(), "generate_patch",
                    "public repo governance smoke patch generated");
            executionTaskService.markSuccess(repairExecution.getId(), "generate_patch");
        }
        ExecutionTask agentExecution = executionTaskService.create(projectId, repository.getId(), "AGENT_TASK",
                "AGENT_TASK", agentTask.getId(), userId);
        if (agentExecution != null && agentExecution.getId() != null) {
            executionTaskService.startStep(agentExecution.getId(), "generate_report", "生成 Agent 报告");
            executionTaskService.completeStep(agentExecution.getId(), "generate_report",
                    "public repo governance smoke agent report generated");
            executionTaskService.markSuccess(agentExecution.getId(), "generate_report");
        }

        auditLogService.record(userId, projectId, "AUTO_REPAIR", repair.getId(),
                AUTO_REPAIR_ACTION, "SUCCESS",
                Map.of("seedId", seedId, "scanTaskId", scanTask.getId(), "artifactType", "CHANGE_PATCH"),
                "AutoRepair patch smoke artifact ready",
                0L,
                seedId);
        auditLogService.record(userId, projectId, "AGENT_TASK", agentTask.getId(),
                AGENT_TASK_ACTION, "SUCCESS",
                Map.of("seedId", seedId, "scanTaskId", scanTask.getId(), "artifactType", "AGENT_REPORT"),
                "Agent task smoke report artifact ready",
                0L,
                seedId);

        return Result.ok(new SeedResult(
                seedId,
                repair.getId(),
                agentTask.getId(),
                repairExecution == null ? null : repairExecution.getId(),
                agentExecution == null ? null : agentExecution.getId(),
                patchArtifact.getId(),
                agentReportArtifact.getId(),
                AUTO_REPAIR_ACTION,
                AGENT_TASK_ACTION,
                patchArtifact.getArtifactType(),
                agentReportArtifact.getArtifactType()));
    }

    @Data
    public static class SeedRequest {
        private Long repositoryId;
        private Long scanTaskId;
    }

    public record SeedResult(String seedId,
                             Long autoRepairId,
                             Long agentTaskId,
                             Long repairExecutionTaskId,
                             Long agentExecutionTaskId,
                             Long patchArtifactId,
                             Long agentReportArtifactId,
                             String autoRepairAuditAction,
                             String agentTaskAuditAction,
                             String patchArtifactType,
                             String agentReportArtifactType) {
    }
}
