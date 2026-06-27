package com.sourcelens.module.repository.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.sourcelens.common.exception.BizException;
import com.sourcelens.common.security.TokenEncryptor;
import com.sourcelens.module.audit.service.AuditLogService;
import com.sourcelens.module.artifact.service.ArtifactStorageService;
import com.sourcelens.module.repository.dto.AddRepositoryRequest;
import com.sourcelens.module.repository.entity.Repository;
import com.sourcelens.module.repository.mapper.RepositoryMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RepositoryService extends ServiceImpl<RepositoryMapper, Repository> {

    private final TokenEncryptor tokenEncryptor;
    private final ArtifactStorageService artifactStorageService;
    private final GitHubAppInstallationService gitHubAppInstallationService;
    private final AuditLogService auditLogService;

    @Value("${sourcelens.repository.allow-local-file:false}")
    private boolean allowLocalFileRepositories;

    @Value("${sourcelens.repository.allow-pat-credentials:true}")
    private boolean allowPatCredentials;

    public Repository add(Long projectId, AddRepositoryRequest req) {
        return add(projectId, req, null);
    }

    public Repository add(Long projectId, AddRepositoryRequest req, Long userId) {
        long start = System.currentTimeMillis();
        RepositoryUrlPolicy.ParsedRepository parsed =
                RepositoryUrlPolicy.parseAndValidate(req.getUrl(), allowLocalFileRepositories);

        Repository repo = Repository.builder()
                .projectId(projectId)
                .url(parsed.normalizedUrl())
                .defaultBranch(RepositoryUrlPolicy.validateBranch(req.getDefaultBranch()))
                .visibility("PRIVATE")
                .authType("PAT")
                .status("ACTIVE")
                .build();

        repo.setProvider(parsed.provider());
        repo.setOwner(parsed.owner());
        repo.setName(parsed.name());

        // Token 加密存储
        String token = req.getToken() != null ? req.getToken().trim() : null;
        if (TokenEncryptor.isValidToken(token)) {
            validatePatCredentialsAllowed();
            repo.setEncryptedTokenRef(tokenEncryptor.encrypt(token));
            repo.setAuthType("PAT");
        } else {
            repo.setAuthType("NONE");
        }

        save(repo);
        auditLogService.record(userId, projectId, "REPOSITORY", repo.getId(),
                "REPOSITORY_CREATE", "SUCCESS",
                repositoryAuditInput(req),
                "仓库已创建: " + repo.getProvider() + "/" + repo.getOwner() + "/" + repo.getName(),
                System.currentTimeMillis() - start,
                null);
        return repo;
    }

    public Repository update(Long repositoryId, AddRepositoryRequest req) {
        return update(repositoryId, req, null);
    }

    public Repository update(Long repositoryId, AddRepositoryRequest req, Long userId) {
        long start = System.currentTimeMillis();
        Repository repo = getDetail(repositoryId);
        boolean tokenUpdated = false;

        if (req.getUrl() != null) {
            RepositoryUrlPolicy.ParsedRepository parsed =
                    RepositoryUrlPolicy.parseAndValidate(req.getUrl(), allowLocalFileRepositories);
            repo.setUrl(parsed.normalizedUrl());
            repo.setProvider(parsed.provider());
            repo.setOwner(parsed.owner());
            repo.setName(parsed.name());
        }
        if (req.getDefaultBranch() != null) {
            repo.setDefaultBranch(RepositoryUrlPolicy.validateBranch(req.getDefaultBranch()));
        }
        String token = req.getToken() != null ? req.getToken().trim() : null;
        if (TokenEncryptor.isValidToken(token)) {
            // 只有当 token 不是已加密格式时才重新加密
            if (!TokenEncryptor.isEncrypted(token)) {
                validatePatCredentialsAllowed();
                repo.setEncryptedTokenRef(tokenEncryptor.encrypt(token));
                repo.setAuthType("PAT");
                tokenUpdated = true;
            }
        }

        updateById(repo);
        auditLogService.record(userId, repo.getProjectId(), "REPOSITORY", repo.getId(),
                tokenUpdated ? "REPOSITORY_TOKEN_UPDATE" : "REPOSITORY_UPDATE", "SUCCESS",
                repositoryAuditInput(req),
                tokenUpdated ? "仓库 PAT 凭据已更新" : "仓库信息已更新",
                System.currentTimeMillis() - start,
                null);
        return repo;
    }

    /**
     * 获取解密后的 Token(供内部调用,如克隆仓库)
     */
    public String getDecryptedToken(Long repositoryId) {
        Repository repo = getDetail(repositoryId);
        if ("GITHUB_APP".equals(repo.getAuthType())) {
            return gitHubAppInstallationService.createInstallationTokenForRepository(repositoryId);
        }
        if (repo.getEncryptedTokenRef() == null || repo.getEncryptedTokenRef().isEmpty()) {
            return null;
        }
        return tokenEncryptor.decrypt(repo.getEncryptedTokenRef());
    }

    public void delete(Long repositoryId) {
        delete(repositoryId, null);
    }

    public void delete(Long repositoryId, Long userId) {
        long start = System.currentTimeMillis();
        Repository repo = getDetail(repositoryId);
        artifactStorageService.deleteByRepository(repositoryId);
        removeById(repositoryId);
        auditLogService.record(userId, repo.getProjectId(), "REPOSITORY", repo.getId(),
                "REPOSITORY_DELETE", "SUCCESS",
                repositoryDeleteAuditInput(repo),
                "仓库已删除并清理关联 artifact",
                System.currentTimeMillis() - start,
                null);
    }

    public List<Repository> listByProject(Long projectId) {
        return list(new LambdaQueryWrapper<Repository>()
                .eq(Repository::getProjectId, projectId)
                .orderByDesc(Repository::getCreatedAt));
    }

    public Repository getDetail(Long repositoryId) {
        Repository repo = getById(repositoryId);
        if (repo == null || repo.getDeleted()) {
            throw BizException.notFound("Repository");
        }
        return repo;
    }

    private void validatePatCredentialsAllowed() {
        if (!allowPatCredentials) {
            throw BizException.badRequest("当前环境禁止新增或更新 GitHub PAT 凭据，请使用 GitHub App installation 绑定仓库");
        }
    }

    private Map<String, Object> repositoryAuditInput(AddRepositoryRequest req) {
        return Map.of(
                "url", req.getUrl(),
                "defaultBranch", req.getDefaultBranch() == null ? "" : req.getDefaultBranch(),
                "tokenProvided", TokenEncryptor.isValidToken(req.getToken() != null ? req.getToken().trim() : null)
        );
    }

    private Map<String, Object> repositoryDeleteAuditInput(Repository repo) {
        Map<String, Object> input = new LinkedHashMap<>();
        input.put("url", repo.getUrl());
        input.put("provider", repo.getProvider());
        input.put("authType", repo.getAuthType());
        return input;
    }
}
