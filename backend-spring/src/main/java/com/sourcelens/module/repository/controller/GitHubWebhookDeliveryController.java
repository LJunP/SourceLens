package com.sourcelens.module.repository.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sourcelens.common.PageResult;
import com.sourcelens.common.Result;
import com.sourcelens.module.project.service.ProjectService;
import com.sourcelens.module.repository.entity.GitHubWebhookDelivery;
import com.sourcelens.module.repository.service.GitHubWebhookDeliveryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "GitHub Webhook Delivery")
@RestController
@RequestMapping("/api/projects/{projectId}/github-webhook-deliveries")
@RequiredArgsConstructor
public class GitHubWebhookDeliveryController {

    private final GitHubWebhookDeliveryService deliveryService;
    private final ProjectService projectService;

    @Operation(summary = "查询项目 GitHub webhook delivery")
    @GetMapping
    public Result<PageResult<GitHubWebhookDelivery>> listProjectDeliveries(
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String eventType,
            @RequestParam(required = false) String status,
            @RequestAttribute("userId") Long userId) {
        projectService.verifyOwnership(projectId, userId);
        Page<GitHubWebhookDelivery> records = deliveryService.listByProject(projectId, page, pageSize,
                eventType, status);
        return Result.ok(PageResult.of(records.getRecords(), page, pageSize, records.getTotal()));
    }
}
