package com.sourcelens.module.repository.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.sourcelens.common.exception.BizException;
import com.sourcelens.common.security.TokenEncryptor;
import com.sourcelens.module.repository.dto.AddRepositoryRequest;
import com.sourcelens.module.repository.entity.Repository;
import com.sourcelens.module.repository.mapper.RepositoryMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class RepositoryService extends ServiceImpl<RepositoryMapper, Repository> {

    private static final Pattern GITHUB_URL_PATTERN =
            Pattern.compile("https?://github\\.com/([^/]+)/([^/]+?)(?:\\.git)?$");

    private final TokenEncryptor tokenEncryptor;

    public Repository add(Long projectId, AddRepositoryRequest req) {
        Repository repo = Repository.builder()
                .projectId(projectId)
                .url(req.getUrl())
                .provider("GITHUB")
                .defaultBranch(req.getDefaultBranch() != null ? req.getDefaultBranch() : "main")
                .visibility("PRIVATE")
                .authType("PAT")
                .status("ACTIVE")
                .build();

        // 解析 GitHub URL
        Matcher m = GITHUB_URL_PATTERN.matcher(req.getUrl());
        if (m.matches()) {
            repo.setOwner(m.group(1));
            repo.setName(m.group(2));
        } else {
            throw BizException.badRequest("不支持的仓库 URL 格式");
        }

        // Token 加密存储
        String token = req.getToken() != null ? req.getToken().trim() : null;
        if (TokenEncryptor.isValidToken(token)) {
            repo.setEncryptedTokenRef(tokenEncryptor.encrypt(token));
            repo.setAuthType("PAT");
        } else {
            repo.setAuthType("NONE");
        }

        save(repo);
        return repo;
    }

    public Repository update(Long repositoryId, AddRepositoryRequest req) {
        Repository repo = getDetail(repositoryId);

        if (req.getUrl() != null) {
            repo.setUrl(req.getUrl());
            Matcher m = GITHUB_URL_PATTERN.matcher(req.getUrl());
            if (m.matches()) {
                repo.setOwner(m.group(1));
                repo.setName(m.group(2));
            }
        }
        if (req.getDefaultBranch() != null) {
            repo.setDefaultBranch(req.getDefaultBranch());
        }
        String token = req.getToken() != null ? req.getToken().trim() : null;
        if (TokenEncryptor.isValidToken(token)) {
            // 只有当 token 不是已加密格式时才重新加密
            if (!TokenEncryptor.isEncrypted(token)) {
                repo.setEncryptedTokenRef(tokenEncryptor.encrypt(token));
                repo.setAuthType("PAT");
            }
        }

        updateById(repo);
        return repo;
    }

    /**
     * 获取解密后的 Token(供内部调用,如克隆仓库)
     */
    public String getDecryptedToken(Long repositoryId) {
        Repository repo = getDetail(repositoryId);
        if (repo.getEncryptedTokenRef() == null || repo.getEncryptedTokenRef().isEmpty()) {
            return null;
        }
        return tokenEncryptor.decrypt(repo.getEncryptedTokenRef());
    }

    public void delete(Long repositoryId) {
        getDetail(repositoryId);
        removeById(repositoryId);
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
}