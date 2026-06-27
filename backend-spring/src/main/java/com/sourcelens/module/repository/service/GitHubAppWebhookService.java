package com.sourcelens.module.repository.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sourcelens.common.exception.BizException;
import com.sourcelens.module.repository.entity.Repository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GitHubAppWebhookService {

    private final ObjectMapper objectMapper;
    private final GitHubAppInstallationService installationService;
    private final GitHubWebhookDeliveryService deliveryService;

    @Transactional
    public Map<String, Object> handle(String event, String deliveryId, String body) {
        if (!StringUtils.hasText(event)) {
            throw BizException.badRequest("GitHub webhook event 不能为空");
        }
        if (!StringUtils.hasText(deliveryId)) {
            throw BizException.badRequest("GitHub webhook delivery id 不能为空");
        }
        if (!deliveryService.claimProcessing(deliveryId, event)) {
            return Map.of(
                    "event", event,
                    "deliveryId", deliveryId,
                    "affectedRepositories", 0,
                    "duplicate", true
            );
        }
        try {
            JsonNode payload = objectMapper.readTree(body);
            List<Repository> affectedRepositories = switch (event) {
                case "installation" -> handleInstallationEvent(payload);
                case "installation_repositories" -> handleInstallationRepositoriesEvent(payload);
                default -> List.of();
            };
            Map<String, Object> result = Map.of(
                    "event", event,
                    "deliveryId", deliveryId == null ? "" : deliveryId,
                    "affectedRepositories", affectedRepositories.size(),
                    "duplicate", false
            );
            deliveryService.markProcessed(deliveryId, event, result, affectedRepositories);
            return result;
        } catch (BizException e) {
            throw e;
        } catch (Exception e) {
            throw BizException.badRequest("GitHub webhook payload 解析失败: " + e.getMessage());
        }
    }

    private List<Repository> handleInstallationEvent(JsonNode payload) {
        String action = payload.path("action").asText("");
        JsonNode installation = payload.path("installation");
        Long installationId = installation.path("id").isNumber() ? installation.path("id").asLong() : null;
        if (installationId == null) {
            throw BizException.badRequest("GitHub installation payload 缺少 installation.id");
        }

        if ("deleted".equals(action) || "suspend".equals(action) || "suspended".equals(action)) {
            return installationService.disableByInstallationIdAndReturnAffected(installationId);
        }

        if ("created".equals(action) || "new_permissions_accepted".equals(action) || "unsuspend".equals(action)) {
            String accountLogin = installation.path("account").path("login").asText("");
            String accountType = installation.path("account").path("type").asText("");
            String selection = installation.path("repository_selection").asText("");
            String permissionsJson = payload.path("installation").path("permissions").isMissingNode()
                    ? null
                    : payload.path("installation").path("permissions").toString();
            return installationService.syncWebhookRepositoriesAndReturnAffected(
                    installationId,
                    accountLogin,
                    accountType,
                    selection,
                    permissionsJson,
                    payload.path("repositories"),
                    true);
        }

        return List.of();
    }

    private List<Repository> handleInstallationRepositoriesEvent(JsonNode payload) {
        JsonNode installation = payload.path("installation");
        Long installationId = installation.path("id").isNumber() ? installation.path("id").asLong() : null;
        if (installationId == null) {
            throw BizException.badRequest("GitHub installation_repositories payload 缺少 installation.id");
        }
        String action = payload.path("action").asText("");
        if ("removed".equals(action)) {
            return installationService.disableWebhookRepositoriesAndReturnAffected(installationId, payload.path("repositories_removed"));
        }
        if ("added".equals(action)) {
            String accountLogin = installation.path("account").path("login").asText("");
            String accountType = installation.path("account").path("type").asText("");
            String selection = installation.path("repository_selection").asText("");
            String permissionsJson = installation.path("permissions").isMissingNode()
                    ? null
                    : installation.path("permissions").toString();
            return installationService.syncWebhookRepositoriesAndReturnAffected(
                    installationId,
                    accountLogin,
                    accountType,
                    selection,
                    permissionsJson,
                    payload.path("repositories_added"),
                    true);
        }
        return List.of();
    }
}
