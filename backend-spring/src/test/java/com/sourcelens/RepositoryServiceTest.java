package com.sourcelens;

import com.sourcelens.module.artifact.service.ArtifactStorageService;
import com.sourcelens.common.exception.BizException;
import com.sourcelens.common.security.TokenEncryptor;
import com.sourcelens.module.audit.service.AuditLogService;
import com.sourcelens.module.repository.dto.AddRepositoryRequest;
import com.sourcelens.module.repository.entity.Repository;
import com.sourcelens.module.repository.mapper.RepositoryMapper;
import com.sourcelens.module.repository.service.GitHubAppInstallationService;
import com.sourcelens.module.repository.service.RepositoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RepositoryServiceTest {

    @Mock
    private TokenEncryptor tokenEncryptor;

    @Mock
    private ArtifactStorageService artifactStorageService;

    @Mock
    private GitHubAppInstallationService gitHubAppInstallationService;

    @Mock
    private RepositoryMapper repositoryMapper;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private RepositoryService repositoryService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(repositoryService, "baseMapper", repositoryMapper);
        ReflectionTestUtils.setField(repositoryService, "allowPatCredentials", true);
    }

    @Test
    void add_shouldAllowPatCredentialsWhenExplicitlyEnabled() {
        AddRepositoryRequest req = new AddRepositoryRequest();
        req.setUrl(" https://github.com/acme/api/ ");
        req.setDefaultBranch(" feature/api ");
        req.setToken("ghp_plain_token");
        when(tokenEncryptor.encrypt("ghp_plain_token")).thenReturn("enc-token");

        Repository repo = repositoryService.add(10L, req, 1L);

        assertEquals("PAT", repo.getAuthType());
        assertEquals("https://github.com/acme/api.git", repo.getUrl());
        assertEquals("feature/api", repo.getDefaultBranch());
        assertEquals("GITHUB", repo.getProvider());
        assertEquals("acme", repo.getOwner());
        assertEquals("api", repo.getName());
        assertEquals("enc-token", repo.getEncryptedTokenRef());
        verify(repositoryMapper).insert(any(Repository.class));
        verify(auditLogService).record(eq(1L), eq(10L), eq("REPOSITORY"), eq(repo.getId()),
                eq("REPOSITORY_CREATE"), eq("SUCCESS"), anyMap(), anyString(), anyLong(), isNull());
    }

    @Test
    void add_shouldRejectUnsafeRepositoryUrlAndBranchBeforeInsert() {
        AddRepositoryRequest unsafeUrl = new AddRepositoryRequest();
        unsafeUrl.setUrl("https://token@github.com/acme/api.git");

        BizException urlEx = assertThrows(BizException.class, () -> repositoryService.add(10L, unsafeUrl));

        assertEquals("BAD_REQUEST", urlEx.getCode());
        verify(repositoryMapper, never()).insert(any(Repository.class));

        AddRepositoryRequest unsafeBranch = new AddRepositoryRequest();
        unsafeBranch.setUrl("https://github.com/acme/api.git");
        unsafeBranch.setDefaultBranch("../main");

        BizException branchEx = assertThrows(BizException.class, () -> repositoryService.add(10L, unsafeBranch));

        assertEquals("BAD_REQUEST", branchEx.getCode());
        verify(repositoryMapper, never()).insert(any(Repository.class));
    }

    @Test
    void add_shouldRejectPatCredentialsWhenDisabled() {
        ReflectionTestUtils.setField(repositoryService, "allowPatCredentials", false);
        AddRepositoryRequest req = new AddRepositoryRequest();
        req.setUrl("https://github.com/acme/api.git");
        req.setToken("ghp_plain_token");

        BizException ex = assertThrows(BizException.class, () -> repositoryService.add(10L, req));

        assertEquals("BAD_REQUEST", ex.getCode());
        verify(repositoryMapper, never()).insert(any(Repository.class));
        verify(auditLogService, never()).record(any(), any(), any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void update_shouldRejectNewPatCredentialsWhenDisabled() {
        ReflectionTestUtils.setField(repositoryService, "allowPatCredentials", false);
        Repository repo = Repository.builder()
                .id(100L)
                .projectId(10L)
                .url("https://github.com/acme/api.git")
                .defaultBranch("main")
                .authType("NONE")
                .deleted(false)
                .build();
        AddRepositoryRequest req = new AddRepositoryRequest();
        req.setUrl("https://github.com/acme/api.git");
        req.setToken("ghp_plain_token");
        when(repositoryMapper.selectById(100L)).thenReturn(repo);

        BizException ex = assertThrows(BizException.class, () -> repositoryService.update(100L, req));

        assertEquals("BAD_REQUEST", ex.getCode());
        verify(repositoryMapper, never()).updateById(any(Repository.class));
        verify(auditLogService, never()).record(any(), any(), any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void update_shouldAuditTokenUpdateWhenPatChanges() {
        Repository repo = Repository.builder()
                .id(100L)
                .projectId(10L)
                .url("https://github.com/acme/api.git")
                .defaultBranch("main")
                .authType("NONE")
                .deleted(false)
                .build();
        AddRepositoryRequest req = new AddRepositoryRequest();
        req.setUrl("https://github.com/acme/api.git");
        req.setToken("ghp_plain_token");
        when(repositoryMapper.selectById(100L)).thenReturn(repo);
        when(tokenEncryptor.encrypt("ghp_plain_token")).thenReturn("enc-token");

        repositoryService.update(100L, req, 1L);

        verify(repositoryMapper).updateById(repo);
        verify(auditLogService).record(eq(1L), eq(10L), eq("REPOSITORY"), eq(100L),
                eq("REPOSITORY_TOKEN_UPDATE"), eq("SUCCESS"), anyMap(), anyString(), anyLong(), isNull());
    }

    @Test
    void delete_shouldCleanRepositoryArtifactsAndRemoveById() {
        Repository repo = Repository.builder()
                .id(100L)
                .projectId(10L)
                .deleted(false)
                .build();
        when(repositoryMapper.selectById(100L)).thenReturn(repo);
        when(repositoryMapper.deleteById(100L)).thenReturn(1);

        repositoryService.delete(100L, 1L);

        verify(artifactStorageService).deleteByRepository(100L);
        verify(repositoryMapper).deleteById(100L);
        verify(auditLogService).record(eq(1L), eq(10L), eq("REPOSITORY"), eq(100L),
                eq("REPOSITORY_DELETE"), eq("SUCCESS"), anyMap(), anyString(), anyLong(), isNull());
    }

    @Test
    void getDecryptedToken_shouldUseGitHubAppInstallationTokenWhenAuthTypeIsGitHubApp() {
        Repository repo = Repository.builder()
                .id(100L)
                .projectId(10L)
                .authType("GITHUB_APP")
                .deleted(false)
                .build();
        when(repositoryMapper.selectById(100L)).thenReturn(repo);
        when(gitHubAppInstallationService.createInstallationTokenForRepository(100L)).thenReturn("installation-token");

        String token = repositoryService.getDecryptedToken(100L);

        org.junit.jupiter.api.Assertions.assertEquals("installation-token", token);
    }

    @Test
    void getDecryptedToken_shouldDecryptPatWhenAuthTypeIsPat() {
        Repository repo = Repository.builder()
                .id(100L)
                .projectId(10L)
                .authType("PAT")
                .encryptedTokenRef("enc-token")
                .deleted(false)
                .build();
        when(repositoryMapper.selectById(100L)).thenReturn(repo);
        when(tokenEncryptor.decrypt("enc-token")).thenReturn("plain-token");

        String token = repositoryService.getDecryptedToken(100L);

        org.junit.jupiter.api.Assertions.assertEquals("plain-token", token);
    }
}
