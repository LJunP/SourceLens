package com.sourcelens;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sourcelens.common.exception.BizException;
import com.sourcelens.module.audit.service.AuditLogService;
import com.sourcelens.module.repository.entity.GitHubAppInstallation;
import com.sourcelens.module.repository.entity.Repository;
import com.sourcelens.module.repository.mapper.GitHubAppInstallationMapper;
import com.sourcelens.module.repository.mapper.RepositoryMapper;
import com.sourcelens.module.repository.service.GitHubAppInstallationService;
import com.sourcelens.module.repository.service.GitHubAppTokenService;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class GitHubAppInstallationServiceTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void syncWebhookRepositories_shouldBindMatchedRepositoryAndClearPat() throws Exception {
        RepositoryMapper repositoryMapper = mock(RepositoryMapper.class);
        GitHubAppInstallationMapper installationMapper = mock(GitHubAppInstallationMapper.class);
        AuditLogService auditLogService = mock(AuditLogService.class);
        GitHubAppInstallationService service = newService(repositoryMapper, installationMapper, auditLogService);
        Repository repo = Repository.builder()
                .id(10L)
                .projectId(20L)
                .provider("GITHUB")
                .owner("acme")
                .name("api")
                .authType("PAT")
                .encryptedTokenRef("enc")
                .deleted(false)
                .build();
        when(repositoryMapper.selectList(any())).thenReturn(List.of(repo));
        when(installationMapper.selectOne(any())).thenReturn(null);
        JsonNode repositories = objectMapper.readTree("""
                [{"full_name": "acme/api"}]
                """);

        int affected = service.syncWebhookRepositories(
                123L, "acme", "Organization", "selected", "{\"contents\":\"read\"}", repositories, true);

        assertEquals(1, affected);
        assertEquals("GITHUB_APP", repo.getAuthType());
        assertEquals(null, repo.getEncryptedTokenRef());
        verify(installationMapper).insert(any(GitHubAppInstallation.class));
        verify(repositoryMapper).updateById(repo);
        verify(auditLogService).record(isNull(), eq(20L), eq("GITHUB_APP_INSTALLATION"), isNull(),
                eq("GITHUB_APP_WEBHOOK_SYNC"), eq("SUCCESS"), anyMap(), anyString(), isNull(), isNull());
    }

    @Test
    void disableByInstallationId_shouldDisableInstallationAndRepositoryAuth() {
        RepositoryMapper repositoryMapper = mock(RepositoryMapper.class);
        GitHubAppInstallationMapper installationMapper = mock(GitHubAppInstallationMapper.class);
        AuditLogService auditLogService = mock(AuditLogService.class);
        GitHubAppInstallationService service = newService(repositoryMapper, installationMapper, auditLogService);
        GitHubAppInstallation installation = GitHubAppInstallation.builder()
                .id(1L)
                .repositoryId(10L)
                .installationId(123L)
                .status("ACTIVE")
                .build();
        Repository repo = Repository.builder()
                .id(10L)
                .authType("GITHUB_APP")
                .deleted(false)
                .build();
        when(installationMapper.selectList(any())).thenReturn(List.of(installation));
        when(repositoryMapper.selectById(10L)).thenReturn(repo);

        int affected = service.disableByInstallationId(123L);

        assertEquals(1, affected);
        assertEquals("DISABLED", installation.getStatus());
        assertEquals("NONE", repo.getAuthType());
        verify(installationMapper).updateById(installation);
        verify(repositoryMapper).updateById(repo);
        verify(auditLogService).record(isNull(), isNull(), eq("GITHUB_APP_INSTALLATION"), eq(1L),
                eq("GITHUB_APP_WEBHOOK_DISABLE_INSTALLATION"), eq("SUCCESS"), anyMap(), anyString(), isNull(), isNull());
    }

    @Test
    void bind_shouldAuditManualGitHubAppBinding() {
        RepositoryMapper repositoryMapper = mock(RepositoryMapper.class);
        GitHubAppInstallationMapper installationMapper = mock(GitHubAppInstallationMapper.class);
        AuditLogService auditLogService = mock(AuditLogService.class);
        GitHubAppInstallationService service = newService(repositoryMapper, installationMapper, auditLogService);
        Repository repo = Repository.builder()
                .id(10L)
                .projectId(20L)
                .provider("GITHUB")
                .owner("acme")
                .name("api")
                .authType("PAT")
                .encryptedTokenRef("enc")
                .deleted(false)
                .build();
        var request = new com.sourcelens.module.repository.dto.BindGitHubAppInstallationRequest();
        request.setInstallationId(123L);
        request.setAccountLogin("acme");
        request.setAccountType("Organization");
        request.setRepositorySelection("selected");
        request.setPermissionsJson("{\"contents\":\"write\"}");

        service.bind(repo, request, 7L);

        verify(auditLogService).record(eq(7L), eq(20L), eq("GITHUB_APP_INSTALLATION"), any(),
                eq("GITHUB_APP_INSTALLATION_BIND"), eq("SUCCESS"), anyMap(), anyString(), isNull(), isNull());
    }

    @Test
    void assertCanCreatePullRequest_shouldAllowContentsAndPullRequestsWrite() {
        RepositoryMapper repositoryMapper = mock(RepositoryMapper.class);
        GitHubAppInstallationMapper installationMapper = mock(GitHubAppInstallationMapper.class);
        GitHubAppInstallationService service = newService(repositoryMapper, installationMapper);
        when(installationMapper.selectOne(any(), anyBoolean())).thenReturn(GitHubAppInstallation.builder()
                .id(1L)
                .repositoryId(10L)
                .status("ACTIVE")
                .permissionsJson("{\"contents\":\"write\",\"pull_requests\":\"write\"}")
                .deleted(false)
                .build());

        service.assertCanCreatePullRequest(10L);
    }

    @Test
    void assertCanCreatePullRequest_shouldRejectMissingPullRequestWritePermission() {
        RepositoryMapper repositoryMapper = mock(RepositoryMapper.class);
        GitHubAppInstallationMapper installationMapper = mock(GitHubAppInstallationMapper.class);
        GitHubAppInstallationService service = newService(repositoryMapper, installationMapper);
        when(installationMapper.selectOne(any(), anyBoolean())).thenReturn(GitHubAppInstallation.builder()
                .id(1L)
                .repositoryId(10L)
                .status("ACTIVE")
                .permissionsJson("{\"contents\":\"write\",\"pull_requests\":\"read\"}")
                .deleted(false)
                .build());

        BizException ex = assertThrows(BizException.class,
                () -> service.assertCanCreatePullRequest(10L));

        assertEquals("FORBIDDEN", ex.getCode());
    }

    private GitHubAppInstallationService newService(RepositoryMapper repositoryMapper,
                                                   GitHubAppInstallationMapper installationMapper) {
        return newService(repositoryMapper, installationMapper, mock(AuditLogService.class));
    }

    private GitHubAppInstallationService newService(RepositoryMapper repositoryMapper,
                                                   GitHubAppInstallationMapper installationMapper,
                                                   AuditLogService auditLogService) {
        GitHubAppTokenService tokenService = mock(GitHubAppTokenService.class);
        GitHubAppInstallationService service = new GitHubAppInstallationService(
                tokenService, repositoryMapper, objectMapper, auditLogService);
        ReflectionTestUtils.setField(service, "baseMapper", installationMapper);
        return service;
    }
}
