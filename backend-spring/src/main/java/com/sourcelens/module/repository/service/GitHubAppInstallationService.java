package com.sourcelens.module.repository.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sourcelens.common.exception.BizException;
import com.sourcelens.module.audit.service.AuditLogService;
import com.sourcelens.module.repository.dto.BindGitHubAppInstallationRequest;
import com.sourcelens.module.repository.entity.GitHubAppInstallation;
import com.sourcelens.module.repository.entity.Repository;
import com.sourcelens.module.repository.mapper.GitHubAppInstallationMapper;
import com.sourcelens.module.repository.mapper.RepositoryMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GitHubAppInstallationService extends ServiceImpl<GitHubAppInstallationMapper, GitHubAppInstallation> {

    private final GitHubAppTokenService tokenService;
    private final RepositoryMapper repositoryMapper;
    private final ObjectMapper objectMapper;
    private final AuditLogService auditLogService;

    public GitHubAppInstallation bind(Repository repository,
                                      BindGitHubAppInstallationRequest request,
                                      Long userId) {
        GitHubAppInstallation installation = getOne(new LambdaQueryWrapper<GitHubAppInstallation>()
                .eq(GitHubAppInstallation::getRepositoryId, repository.getId())
                .last("LIMIT 1"));
        if (installation == null) {
            installation = GitHubAppInstallation.builder()
                    .projectId(repository.getProjectId())
                    .repositoryId(repository.getId())
                    .createdBy(userId)
                    .build();
        }

        installation.setInstallationId(request.getInstallationId());
        installation.setAccountLogin(request.getAccountLogin());
        installation.setAccountType(request.getAccountType());
        installation.setRepositorySelection(request.getRepositorySelection());
        installation.setPermissionsJson(request.getPermissionsJson());
        installation.setStatus("ACTIVE");
        saveOrUpdate(installation);

        repository.setAuthType("GITHUB_APP");
        repository.setEncryptedTokenRef(null);
        repositoryMapper.updateById(repository);
        auditGitHubApp(repository, installation, userId, "GITHUB_APP_INSTALLATION_BIND",
                "GitHub App installation 已绑定");
        return installation;
    }

    public GitHubAppInstallation getActiveByRepository(Long repositoryId) {
        GitHubAppInstallation installation = getOne(new LambdaQueryWrapper<GitHubAppInstallation>()
                .eq(GitHubAppInstallation::getRepositoryId, repositoryId)
                .eq(GitHubAppInstallation::getStatus, "ACTIVE")
                .last("LIMIT 1"));
        if (installation == null || Boolean.TRUE.equals(installation.getDeleted())) {
            throw BizException.badRequest("仓库未绑定可用的 GitHub App installation");
        }
        return installation;
    }

    public String createInstallationTokenForRepository(Long repositoryId) {
        if (!tokenService.isConfigured()) {
            throw BizException.badRequest("GitHub App 未配置，无法为仓库生成 installation token");
        }
        GitHubAppInstallation installation = getActiveByRepository(repositoryId);
        return tokenService.createInstallationAccessToken(installation.getInstallationId());
    }

    public void assertCanCreatePullRequest(Long repositoryId) {
        GitHubAppInstallation installation = getActiveByRepository(repositoryId);
        JsonNode permissions = parsePermissions(installation);
        assertPermissionAtLeastWrite(permissions, "contents", "GitHub App installation 缺少 contents:write 权限，无法推送修复分支");
        assertPermissionAtLeastWrite(permissions, "pull_requests", "GitHub App installation 缺少 pull_requests:write 权限，无法创建 Pull Request");
    }

    public void disable(Repository repository) {
        disable(repository, null);
    }

    public void disable(Repository repository, Long userId) {
        GitHubAppInstallation installation = getOne(new LambdaQueryWrapper<GitHubAppInstallation>()
                .eq(GitHubAppInstallation::getRepositoryId, repository.getId())
                .last("LIMIT 1"));
        if (installation != null) {
            installation.setStatus("DISABLED");
            updateById(installation);
            auditGitHubApp(repository, installation, userId, "GITHUB_APP_INSTALLATION_DISABLE",
                    "GitHub App installation 已禁用");
        }
        if ("GITHUB_APP".equals(repository.getAuthType())) {
            repository.setAuthType("NONE");
            repository.setEncryptedTokenRef(null);
            repositoryMapper.updateById(repository);
        }
    }

    public int syncWebhookRepositories(Long installationId,
                                       String accountLogin,
                                       String accountType,
                                       String repositorySelection,
                                       String permissionsJson,
                                       JsonNode repositories,
                                       boolean activateRepositoryAuth) {
        return syncWebhookRepositoriesAndReturnAffected(installationId, accountLogin, accountType,
                repositorySelection, permissionsJson, repositories, activateRepositoryAuth).size();
    }

    public List<Repository> syncWebhookRepositoriesAndReturnAffected(Long installationId,
                                                                     String accountLogin,
                                                                     String accountType,
                                                                     String repositorySelection,
                                                                     String permissionsJson,
                                                                     JsonNode repositories,
                                                                     boolean activateRepositoryAuth) {
        if (installationId == null || repositories == null || !repositories.isArray()) {
            return List.of();
        }
        List<Repository> affected = new java.util.ArrayList<>();
        for (JsonNode node : repositories) {
            RepositoryMatch match = parseRepositoryMatch(accountLogin, node);
            if (match == null) {
                continue;
            }
            List<Repository> matchedRepos = repositoryMapper.selectList(new LambdaQueryWrapper<Repository>()
                    .eq(Repository::getProvider, "GITHUB")
                    .eq(Repository::getOwner, match.owner())
                    .eq(Repository::getName, match.name()));
            for (Repository repo : matchedRepos) {
                upsertWebhookInstallation(repo, installationId, accountLogin, accountType,
                        repositorySelection, permissionsJson);
                if (activateRepositoryAuth) {
                    repo.setAuthType("GITHUB_APP");
                    repo.setEncryptedTokenRef(null);
                    repositoryMapper.updateById(repo);
                }
                GitHubAppInstallation installation = getOne(new LambdaQueryWrapper<GitHubAppInstallation>()
                        .eq(GitHubAppInstallation::getRepositoryId, repo.getId())
                        .eq(GitHubAppInstallation::getInstallationId, installationId)
                        .last("LIMIT 1"));
                auditGitHubApp(repo, installation, null, "GITHUB_APP_WEBHOOK_SYNC",
                        "GitHub App webhook 同步 installation 仓库绑定");
                affected.add(repo);
            }
        }
        return affected;
    }

    public int disableWebhookRepositories(Long installationId, JsonNode repositories) {
        return disableWebhookRepositoriesAndReturnAffected(installationId, repositories).size();
    }

    public List<Repository> disableWebhookRepositoriesAndReturnAffected(Long installationId, JsonNode repositories) {
        if (installationId == null || repositories == null || !repositories.isArray()) {
            return List.of();
        }
        List<Repository> affected = new java.util.ArrayList<>();
        for (JsonNode node : repositories) {
            RepositoryMatch match = parseRepositoryMatch(null, node);
            if (match == null) {
                continue;
            }
            List<Repository> matchedRepos = repositoryMapper.selectList(new LambdaQueryWrapper<Repository>()
                    .eq(Repository::getProvider, "GITHUB")
                    .eq(Repository::getOwner, match.owner())
                    .eq(Repository::getName, match.name()));
            for (Repository repo : matchedRepos) {
                GitHubAppInstallation installation = baseMapper.selectOne(new LambdaQueryWrapper<GitHubAppInstallation>()
                        .eq(GitHubAppInstallation::getRepositoryId, repo.getId())
                        .eq(GitHubAppInstallation::getInstallationId, installationId)
                        .last("LIMIT 1"));
                if (installation != null) {
                    installation.setStatus("DISABLED");
                    baseMapper.updateById(installation);
                    if ("GITHUB_APP".equals(repo.getAuthType())) {
                        repo.setAuthType("NONE");
                        repo.setEncryptedTokenRef(null);
                        repositoryMapper.updateById(repo);
                    }
                    auditGitHubApp(repo, installation, null, "GITHUB_APP_WEBHOOK_DISABLE_REPOSITORY",
                            "GitHub App webhook 禁用仓库 installation");
                    affected.add(repo);
                }
            }
        }
        return affected;
    }

    public int disableByInstallationId(Long installationId) {
        return disableByInstallationIdAndReturnAffected(installationId).size();
    }

    public List<Repository> disableByInstallationIdAndReturnAffected(Long installationId) {
        if (installationId == null) {
            return List.of();
        }
        List<GitHubAppInstallation> installations = baseMapper.selectList(new LambdaQueryWrapper<GitHubAppInstallation>()
                .eq(GitHubAppInstallation::getInstallationId, installationId)
                .eq(GitHubAppInstallation::getStatus, "ACTIVE"));
        List<Repository> affected = new java.util.ArrayList<>();
        for (GitHubAppInstallation installation : installations) {
            installation.setStatus("DISABLED");
            baseMapper.updateById(installation);
            Repository repo = repositoryMapper.selectById(installation.getRepositoryId());
            if (repo != null && "GITHUB_APP".equals(repo.getAuthType())) {
                repo.setAuthType("NONE");
                repo.setEncryptedTokenRef(null);
                repositoryMapper.updateById(repo);
            }
            if (repo != null) {
                auditGitHubApp(repo, installation, null, "GITHUB_APP_WEBHOOK_DISABLE_INSTALLATION",
                        "GitHub App webhook 禁用 installation");
                affected.add(repo);
            }
        }
        return affected;
    }

    private void upsertWebhookInstallation(Repository repo,
                                           Long installationId,
                                           String accountLogin,
                                           String accountType,
                                           String repositorySelection,
                                           String permissionsJson) {
        GitHubAppInstallation installation = baseMapper.selectOne(new LambdaQueryWrapper<GitHubAppInstallation>()
                .eq(GitHubAppInstallation::getRepositoryId, repo.getId())
                .last("LIMIT 1"));
        if (installation == null) {
            installation = GitHubAppInstallation.builder()
                    .projectId(repo.getProjectId())
                    .repositoryId(repo.getId())
                    .build();
        }
        installation.setInstallationId(installationId);
        installation.setAccountLogin(StringUtils.hasText(accountLogin) ? accountLogin : repo.getOwner());
        installation.setAccountType(accountType);
        installation.setRepositorySelection(repositorySelection);
        installation.setPermissionsJson(permissionsJson);
        installation.setStatus("ACTIVE");
        if (installation.getId() == null) {
            baseMapper.insert(installation);
        } else {
            baseMapper.updateById(installation);
        }
    }

    private RepositoryMatch parseRepositoryMatch(String fallbackOwner, JsonNode node) {
        String fullName = node.path("full_name").asText("");
        if (StringUtils.hasText(fullName) && fullName.contains("/")) {
            String[] parts = fullName.split("/", 2);
            return new RepositoryMatch(parts[0], stripGitSuffix(parts[1]));
        }
        String name = node.path("name").asText("");
        String owner = node.path("owner").path("login").asText("");
        if (!StringUtils.hasText(owner)) {
            owner = fallbackOwner;
        }
        if (!StringUtils.hasText(owner) || !StringUtils.hasText(name)) {
            return null;
        }
        return new RepositoryMatch(owner, stripGitSuffix(name));
    }

    private String stripGitSuffix(String name) {
        return name.endsWith(".git") ? name.substring(0, name.length() - 4) : name;
    }

    private JsonNode parsePermissions(GitHubAppInstallation installation) {
        String permissionsJson = installation.getPermissionsJson();
        if (!StringUtils.hasText(permissionsJson)) {
            throw BizException.forbidden("GitHub App installation 权限信息为空，无法确认是否可创建 PR");
        }
        try {
            return objectMapper.readTree(permissionsJson);
        } catch (Exception e) {
            throw BizException.badRequest("GitHub App installation 权限 JSON 格式不正确");
        }
    }

    private void assertPermissionAtLeastWrite(JsonNode permissions, String key, String message) {
        String value = permissions.path(key).asText("");
        if (!"write".equals(value) && !"admin".equals(value)) {
            throw BizException.forbidden(message);
        }
    }

    private void auditGitHubApp(Repository repo,
                                GitHubAppInstallation installation,
                                Long userId,
                                String action,
                                String summary) {
        if (repo == null) {
            return;
        }
        auditLogService.record(userId, repo.getProjectId(), "GITHUB_APP_INSTALLATION",
                installation == null ? null : installation.getId(),
                action, "SUCCESS",
                githubAppAuditInput(repo, installation),
                summary,
                null,
                null);
    }

    private Map<String, Object> githubAppAuditInput(Repository repo, GitHubAppInstallation installation) {
        Map<String, Object> input = new LinkedHashMap<>();
        input.put("repositoryId", repo.getId());
        input.put("owner", repo.getOwner());
        input.put("name", repo.getName());
        input.put("authType", repo.getAuthType());
        if (installation != null) {
            input.put("installationId", installation.getInstallationId());
            input.put("accountLogin", installation.getAccountLogin());
            input.put("accountType", installation.getAccountType());
            input.put("repositorySelection", installation.getRepositorySelection());
            input.put("status", installation.getStatus());
        }
        return input;
    }

    private record RepositoryMatch(String owner, String name) {
    }
}
