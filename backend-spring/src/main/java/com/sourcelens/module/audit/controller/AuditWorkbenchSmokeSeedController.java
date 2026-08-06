package com.sourcelens.module.audit.controller;

import com.sourcelens.common.Result;
import com.sourcelens.common.exception.BizException;
import com.sourcelens.module.agent.service.ToolExecutionService;
import com.sourcelens.module.agent.tool.ToolContext;
import com.sourcelens.module.audit.service.AuditLogService;
import com.sourcelens.module.project.service.ProjectService;
import com.sourcelens.module.repository.entity.Repository;
import com.sourcelens.module.repository.service.GitHubWebhookDeliveryService;
import com.sourcelens.module.repository.service.RepositoryService;
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

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Hidden
@Profile({"dev & !prod", "test & !prod"})
@RestController
@RequestMapping("/api/dev/projects/{projectId}/audit-workbench-smoke-seed")
@RequiredArgsConstructor
public class AuditWorkbenchSmokeSeedController {

    private static final String AUDIT_ACTION = "AUDIT_WORKBENCH_SMOKE_SEED";
    private static final String TOOL_NAME = "__audit_workbench_missing_tool__";
    private static final String WEBHOOK_EVENT = "installation_repositories";
    private static final String SMOKE_SOURCE = "audit-workbench-smoke";

    private final ProjectService projectService;
    private final RepositoryService repositoryService;
    private final AuditLogService auditLogService;
    private final ToolExecutionService toolExecutionService;
    private final GitHubWebhookDeliveryService deliveryService;

    @PostMapping
    public Result<SeedResult> seed(@PathVariable Long projectId,
                                   @RequestBody SeedRequest request,
                                   @RequestAttribute("userId") Long userId) {
        projectService.verifyOwnership(projectId, userId);
        if (request == null || request.getRepositoryId() == null) {
            throw BizException.badRequest("repositoryId 不能为空");
        }
        Repository repository = repositoryService.getDetail(request.getRepositoryId());
        if (repository == null) {
            throw BizException.notFound("Repository");
        }
        if (!projectId.equals(repository.getProjectId())) {
            throw BizException.forbidden("仓库不属于当前项目");
        }

        String seedId = "audit-smoke-" + UUID.randomUUID();
        auditLogService.record(userId, projectId, "SMOKE", projectId,
                AUDIT_ACTION, "SUCCESS",
                Map.of("seedId", seedId, "repositoryId", repository.getId()),
                "审计 workbench smoke 样本已生成",
                0L,
                seedId);

        toolExecutionService.execute(TOOL_NAME,
                Map.of("seedId", seedId, "source", SMOKE_SOURCE),
                ToolContext.builder()
                        .projectId(projectId)
                        .userId(userId)
                        .build());

        String deliveryId = seedId + "-delivery";
        deliveryService.markProcessed(deliveryId, WEBHOOK_EVENT,
                Map.of("seedId", seedId, "source", SMOKE_SOURCE),
                List.of(repository));

        return Result.ok(new SeedResult(seedId, AUDIT_ACTION, TOOL_NAME, deliveryId, WEBHOOK_EVENT));
    }

    @Data
    public static class SeedRequest {
        private Long repositoryId;
    }

    public record SeedResult(String seedId,
                             String auditAction,
                             String toolName,
                             String deliveryId,
                             String webhookEvent) {
    }
}
