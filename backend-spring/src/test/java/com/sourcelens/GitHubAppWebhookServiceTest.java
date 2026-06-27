package com.sourcelens;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sourcelens.common.exception.BizException;
import com.sourcelens.module.audit.service.AuditLogService;
import com.sourcelens.module.repository.entity.GitHubAppInstallation;
import com.sourcelens.module.repository.entity.Repository;
import com.sourcelens.module.repository.mapper.GitHubAppInstallationMapper;
import com.sourcelens.module.repository.mapper.RepositoryMapper;
import com.sourcelens.module.repository.service.GitHubAppInstallationService;
import com.sourcelens.module.repository.service.GitHubAppTokenService;
import com.sourcelens.module.repository.service.GitHubAppWebhookService;
import com.sourcelens.module.repository.service.GitHubWebhookDeliveryService;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class GitHubAppWebhookServiceTest {

    @Test
    void handle_shouldSyncInstallationRepositoriesWhenInstallationCreated() {
        GitHubAppInstallationService installationService = mock(GitHubAppInstallationService.class);
        GitHubWebhookDeliveryService deliveryService = mock(GitHubWebhookDeliveryService.class);
        GitHubAppWebhookService webhookService = new GitHubAppWebhookService(new ObjectMapper(), installationService, deliveryService);
        when(deliveryService.claimProcessing("delivery-1", "installation")).thenReturn(true);
        when(installationService.syncWebhookRepositoriesAndReturnAffected(
                eq(123L), eq("acme"), eq("Organization"), eq("selected"),
                eq("{\"contents\":\"read\"}"), any(), eq(true))).thenReturn(List.of(
                Repository.builder().id(100L).projectId(10L).build(),
                Repository.builder().id(101L).projectId(10L).build()
        ));

        Map<String, Object> result = webhookService.handle("installation", "delivery-1", """
                {
                  "action": "created",
                  "installation": {
                    "id": 123,
                    "account": {"login": "acme", "type": "Organization"},
                    "repository_selection": "selected",
                    "permissions": {"contents": "read"}
                  },
                  "repositories": [
                    {"full_name": "acme/api"},
                    {"full_name": "acme/web"}
                  ]
                }
                """);

        assertEquals(2, result.get("affectedRepositories"));
        verify(deliveryService).markProcessed(eq("delivery-1"), eq("installation"), any(), anyList());
    }

    @Test
    void handle_shouldDisableInstallationWhenDeleted() {
        GitHubAppInstallationService installationService = mock(GitHubAppInstallationService.class);
        GitHubWebhookDeliveryService deliveryService = mock(GitHubWebhookDeliveryService.class);
        GitHubAppWebhookService webhookService = new GitHubAppWebhookService(new ObjectMapper(), installationService, deliveryService);
        when(deliveryService.claimProcessing("delivery-1", "installation")).thenReturn(true);
        when(installationService.disableByInstallationIdAndReturnAffected(123L)).thenReturn(List.of(
                Repository.builder().id(100L).projectId(10L).build()
        ));

        Map<String, Object> result = webhookService.handle("installation", "delivery-1", """
                {
                  "action": "deleted",
                  "installation": {"id": 123}
                }
                """);

        assertEquals(1, result.get("affectedRepositories"));
        verify(installationService).disableByInstallationIdAndReturnAffected(123L);
    }

    @Test
    void handle_shouldDisableRemovedRepositories() {
        GitHubAppInstallationService installationService = mock(GitHubAppInstallationService.class);
        GitHubWebhookDeliveryService deliveryService = mock(GitHubWebhookDeliveryService.class);
        GitHubAppWebhookService webhookService = new GitHubAppWebhookService(new ObjectMapper(), installationService, deliveryService);
        when(deliveryService.claimProcessing("delivery-1", "installation_repositories")).thenReturn(true);
        when(installationService.disableWebhookRepositoriesAndReturnAffected(eq(123L), any())).thenReturn(List.of(
                Repository.builder().id(100L).projectId(10L).build()
        ));

        Map<String, Object> result = webhookService.handle("installation_repositories", "delivery-1", """
                {
                  "action": "removed",
                  "installation": {"id": 123},
                  "repositories_removed": [{"full_name": "acme/api"}]
                }
                """);

        assertEquals(1, result.get("affectedRepositories"));
        verify(installationService).disableWebhookRepositoriesAndReturnAffected(eq(123L), any());
    }

    @Test
    void handle_shouldApplyAddedRepositoryPayloadToExistingRepositoryBinding() {
        RepositoryMapper repositoryMapper = mock(RepositoryMapper.class);
        GitHubAppInstallationMapper installationMapper = mock(GitHubAppInstallationMapper.class);
        AuditLogService auditLogService = mock(AuditLogService.class);
        GitHubAppInstallationService installationService =
                newInstallationService(repositoryMapper, installationMapper, auditLogService);
        GitHubWebhookDeliveryService deliveryService = mock(GitHubWebhookDeliveryService.class);
        GitHubAppWebhookService webhookService = new GitHubAppWebhookService(new ObjectMapper(), installationService, deliveryService);
        Repository repo = Repository.builder()
                .id(100L)
                .projectId(10L)
                .provider("GITHUB")
                .owner("acme")
                .name("api")
                .authType("PAT")
                .encryptedTokenRef("encrypted-pat")
                .deleted(false)
                .build();
        when(deliveryService.claimProcessing("delivery-added", "installation_repositories")).thenReturn(true);
        when(repositoryMapper.selectList(any())).thenReturn(List.of(repo));
        GitHubAppInstallation insertedInstallation = GitHubAppInstallation.builder()
                .id(55L)
                .repositoryId(100L)
                .installationId(123L)
                .accountLogin("acme")
                .accountType("Organization")
                .repositorySelection("selected")
                .permissionsJson("{\"contents\":\"write\",\"pull_requests\":\"write\"}")
                .status("ACTIVE")
                .build();
        when(installationMapper.selectOne(any())).thenReturn(null);
        when(installationMapper.selectOne(any(), anyBoolean())).thenReturn(insertedInstallation);

        Map<String, Object> result = webhookService.handle("installation_repositories", "delivery-added", """
                {
                  "action": "added",
                  "installation": {
                    "id": 123,
                    "account": {"login": "acme", "type": "Organization"},
                    "repository_selection": "selected",
                    "permissions": {"contents": "write", "pull_requests": "write"}
                  },
                  "repositories_added": [
                    {"id": 9001, "name": "api", "full_name": "acme/api"}
                  ]
                }
                """);

        assertEquals(1, result.get("affectedRepositories"));
        assertEquals(false, result.get("duplicate"));
        assertEquals("GITHUB_APP", repo.getAuthType());
        assertEquals(null, repo.getEncryptedTokenRef());
        verify(installationMapper).insert(any(GitHubAppInstallation.class));
        verify(repositoryMapper).updateById(repo);
        verify(auditLogService).record(isNull(), eq(10L), eq("GITHUB_APP_INSTALLATION"), eq(55L),
                eq("GITHUB_APP_WEBHOOK_SYNC"), eq("SUCCESS"), anyMap(), anyString(), isNull(), isNull());
        verify(deliveryService).markProcessed(eq("delivery-added"), eq("installation_repositories"), any(), anyList());
    }

    @Test
    void handle_shouldApplyPermissionDowngradeAndRejectControlledPrPermissionCheck() {
        RepositoryMapper repositoryMapper = mock(RepositoryMapper.class);
        GitHubAppInstallationMapper installationMapper = mock(GitHubAppInstallationMapper.class);
        AuditLogService auditLogService = mock(AuditLogService.class);
        GitHubAppInstallationService installationService =
                newInstallationService(repositoryMapper, installationMapper, auditLogService);
        GitHubWebhookDeliveryService deliveryService = mock(GitHubWebhookDeliveryService.class);
        GitHubAppWebhookService webhookService = new GitHubAppWebhookService(new ObjectMapper(), installationService, deliveryService);
        Repository repo = Repository.builder()
                .id(100L)
                .projectId(10L)
                .provider("GITHUB")
                .owner("acme")
                .name("api")
                .authType("GITHUB_APP")
                .deleted(false)
                .build();
        GitHubAppInstallation installation = GitHubAppInstallation.builder()
                .id(55L)
                .repositoryId(100L)
                .installationId(123L)
                .accountLogin("acme")
                .accountType("Organization")
                .repositorySelection("selected")
                .permissionsJson("{\"contents\":\"write\",\"pull_requests\":\"write\"}")
                .status("ACTIVE")
                .deleted(false)
                .build();
        when(deliveryService.claimProcessing("delivery-permission-downgrade", "installation")).thenReturn(true);
        when(repositoryMapper.selectList(any())).thenReturn(List.of(repo));
        when(installationMapper.selectOne(any())).thenReturn(installation);
        when(installationMapper.selectOne(any(), anyBoolean())).thenReturn(installation);

        Map<String, Object> result = webhookService.handle("installation", "delivery-permission-downgrade", """
                {
                  "action": "new_permissions_accepted",
                  "installation": {
                    "id": 123,
                    "account": {"login": "acme", "type": "Organization"},
                    "repository_selection": "selected",
                    "permissions": {"contents": "read", "pull_requests": "read"}
                  },
                  "repositories": [
                    {"id": 9001, "name": "api", "full_name": "acme/api"}
                  ]
                }
                """);

        assertEquals(1, result.get("affectedRepositories"));
        assertEquals("{\"contents\":\"read\",\"pull_requests\":\"read\"}", installation.getPermissionsJson());
        BizException ex = assertThrows(BizException.class,
                () -> installationService.assertCanCreatePullRequest(100L));
        assertEquals("FORBIDDEN", ex.getCode());
        assertEquals(true, ex.getMessage().contains("contents:write"));
        verify(installationMapper).updateById(installation);
        verify(deliveryService).markProcessed(eq("delivery-permission-downgrade"), eq("installation"), any(), anyList());
    }

    @Test
    void handle_shouldDisableRemovedRepositoryPayloadForExistingBinding() {
        RepositoryMapper repositoryMapper = mock(RepositoryMapper.class);
        GitHubAppInstallationMapper installationMapper = mock(GitHubAppInstallationMapper.class);
        AuditLogService auditLogService = mock(AuditLogService.class);
        GitHubAppInstallationService installationService =
                newInstallationService(repositoryMapper, installationMapper, auditLogService);
        GitHubWebhookDeliveryService deliveryService = mock(GitHubWebhookDeliveryService.class);
        GitHubAppWebhookService webhookService = new GitHubAppWebhookService(new ObjectMapper(), installationService, deliveryService);
        Repository repo = Repository.builder()
                .id(100L)
                .projectId(10L)
                .provider("GITHUB")
                .owner("acme")
                .name("api")
                .authType("GITHUB_APP")
                .encryptedTokenRef("stale-token-ref")
                .deleted(false)
                .build();
        GitHubAppInstallation installation = GitHubAppInstallation.builder()
                .id(55L)
                .repositoryId(100L)
                .installationId(123L)
                .status("ACTIVE")
                .build();
        when(deliveryService.claimProcessing("delivery-removed", "installation_repositories")).thenReturn(true);
        when(repositoryMapper.selectList(any())).thenReturn(List.of(repo));
        when(installationMapper.selectOne(any())).thenReturn(installation);

        Map<String, Object> result = webhookService.handle("installation_repositories", "delivery-removed", """
                {
                  "action": "removed",
                  "installation": {"id": 123},
                  "repositories_removed": [
                    {"id": 9001, "name": "api", "full_name": "acme/api"}
                  ]
                }
                """);

        assertEquals(1, result.get("affectedRepositories"));
        assertEquals("DISABLED", installation.getStatus());
        assertEquals("NONE", repo.getAuthType());
        assertEquals(null, repo.getEncryptedTokenRef());
        verify(installationMapper).updateById(installation);
        verify(repositoryMapper).updateById(repo);
        verify(auditLogService).record(isNull(), eq(10L), eq("GITHUB_APP_INSTALLATION"), eq(55L),
                eq("GITHUB_APP_WEBHOOK_DISABLE_REPOSITORY"), eq("SUCCESS"), anyMap(), anyString(), isNull(), isNull());
        verify(deliveryService).markProcessed(eq("delivery-removed"), eq("installation_repositories"), any(), anyList());
    }

    @Test
    void handle_shouldIgnoreAddedRepositoryPayloadWhenRepositoryIsUnknownLocally() {
        RepositoryMapper repositoryMapper = mock(RepositoryMapper.class);
        GitHubAppInstallationMapper installationMapper = mock(GitHubAppInstallationMapper.class);
        AuditLogService auditLogService = mock(AuditLogService.class);
        GitHubAppInstallationService installationService =
                newInstallationService(repositoryMapper, installationMapper, auditLogService);
        GitHubWebhookDeliveryService deliveryService = mock(GitHubWebhookDeliveryService.class);
        GitHubAppWebhookService webhookService = new GitHubAppWebhookService(new ObjectMapper(), installationService, deliveryService);
        when(deliveryService.claimProcessing("delivery-unknown", "installation_repositories")).thenReturn(true);
        when(repositoryMapper.selectList(any())).thenReturn(List.of());

        Map<String, Object> result = webhookService.handle("installation_repositories", "delivery-unknown", """
                {
                  "action": "added",
                  "installation": {
                    "id": 123,
                    "account": {"login": "acme", "type": "Organization"},
                    "repository_selection": "selected",
                    "permissions": {"contents": "write"}
                  },
                  "repositories_added": [
                    {"id": 9002, "name": "unknown", "full_name": "acme/unknown"}
                  ]
                }
                """);

        assertEquals(0, result.get("affectedRepositories"));
        verify(installationMapper, never()).insert(any(GitHubAppInstallation.class));
        verify(installationMapper, never()).updateById(any(GitHubAppInstallation.class));
        verify(repositoryMapper, never()).updateById(any(Repository.class));
        verify(auditLogService, never()).record(any(), any(), any(), any(), any(), any(), any(), any(), any(), any());
        verify(deliveryService).markProcessed(eq("delivery-unknown"), eq("installation_repositories"), any(), anyList());
    }

    @Test
    void handle_shouldSkipDuplicateProcessedDelivery() {
        GitHubAppInstallationService installationService = mock(GitHubAppInstallationService.class);
        GitHubWebhookDeliveryService deliveryService = mock(GitHubWebhookDeliveryService.class);
        GitHubAppWebhookService webhookService = new GitHubAppWebhookService(new ObjectMapper(), installationService, deliveryService);
        when(deliveryService.claimProcessing("delivery-1", "installation")).thenReturn(false);

        Map<String, Object> result = webhookService.handle("installation", "delivery-1", """
                {
                  "action": "deleted",
                  "installation": {"id": 123}
                }
                """);

        assertEquals(0, result.get("affectedRepositories"));
        assertEquals(true, result.get("duplicate"));
        verify(installationService, never()).disableByInstallationId(any());
        verify(deliveryService, never()).markProcessed(any(), any(), any());
        verify(deliveryService, never()).markProcessed(any(), any(), any(), anyList());
    }

    @Test
    void handle_shouldRejectMissingDeliveryIdBeforeProcessing() {
        GitHubAppInstallationService installationService = mock(GitHubAppInstallationService.class);
        GitHubWebhookDeliveryService deliveryService = mock(GitHubWebhookDeliveryService.class);
        GitHubAppWebhookService webhookService = new GitHubAppWebhookService(new ObjectMapper(), installationService, deliveryService);

        BizException ex = assertThrows(BizException.class, () -> webhookService.handle("installation", "", """
                {
                  "action": "deleted",
                  "installation": {"id": 123}
                }
                """));

        assertEquals("BAD_REQUEST", ex.getCode());
        verify(installationService, never()).disableByInstallationId(any());
        verify(deliveryService, never()).claimProcessing(any(), any());
        verify(deliveryService, never()).markProcessed(any(), any(), any());
        verify(deliveryService, never()).markProcessed(any(), any(), any(), anyList());
    }

    private GitHubAppInstallationService newInstallationService(RepositoryMapper repositoryMapper,
                                                               GitHubAppInstallationMapper installationMapper,
                                                               AuditLogService auditLogService) {
        GitHubAppInstallationService service = new GitHubAppInstallationService(
                mock(GitHubAppTokenService.class), repositoryMapper, new ObjectMapper(), auditLogService);
        ReflectionTestUtils.setField(service, "baseMapper", installationMapper);
        return service;
    }
}
