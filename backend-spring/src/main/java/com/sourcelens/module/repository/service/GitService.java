package com.sourcelens.module.repository.service;

import com.sourcelens.common.exception.BizException;
import com.sourcelens.common.security.TokenEncryptor;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.CloneCommand;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.PullCommand;
import org.eclipse.jgit.lib.Ref;
import org.eclipse.jgit.lib.Repository;
import org.eclipse.jgit.storage.file.FileRepositoryBuilder;
import org.eclipse.jgit.transport.CredentialsProvider;
import org.eclipse.jgit.transport.UsernamePasswordCredentialsProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Git 仓库管理：clone / pull / 本地路径映射
 */
@Slf4j
@Service
public class GitService {

    @Value("${sourcelens.workspace.base-path:/tmp/sourcelens/repos}")
    private String workspaceBasePath;

    /**
     * 确保仓库本地可用：存在则 pull，否则 clone
     * @return 本地仓库目录绝对路径
     */
    public String ensureLocal(Long projectId, String repoUrl, String branch, String token) {
        String localPath = buildLocalPath(projectId, repoUrl);
        File dir = new File(localPath);

        if (isGitRepo(dir)) {
            try {
                pull(dir, branch, token);
                return localPath;
            } catch (Exception e) {
                log.warn("Pull 失败, 清理后重新 clone: {}", e.getMessage());
                try {
                    cleanInternal(dir);
                } catch (Exception ex) {
                    log.warn("清理失败, 跳过: {}", ex.getMessage());
                }
            }
        }
        cloneRepo(repoUrl, branch, token, dir);
        return localPath;
    }

    /**
     * 获取当前 HEAD commit SHA
     */
    public String getHeadSha(String localPath) {
        try {
            File gitDir = new File(localPath, ".git");
            Repository repo = new FileRepositoryBuilder()
                    .setGitDir(gitDir)
                    .readEnvironment()
                    .findGitDir()
                    .build();
            String sha = repo.resolve("HEAD").getName();
            repo.close();
            return sha;
        } catch (Exception e) {
            log.warn("无法读取 HEAD SHA, localPath={}", localPath, e);
            return null;
        }
    }

    /**
     * 清理本地仓库
     */
    public void clean(Long projectId, String repoUrl) {
        String localPath = buildLocalPath(projectId, repoUrl);
        try {
            File dir = new File(localPath);
            if (dir.exists()) {
                cleanInternal(dir);
                log.info("已清理本地仓库, path={}", localPath);
            }
        } catch (Exception e) {
            log.warn("清理本地仓库失败, path={}", localPath, e);
        }
    }

    // ===== private =====

    private String buildLocalPath(Long projectId, String repoUrl) {
        // 从 URL 提取 repo name，例如 https://github.com/owner/repo.git → repo
        String name = repoUrl.replaceAll(".*?/([^/]+?)(?:\\.git)?$", "$1");
        return workspaceBasePath + "/" + projectId + "/" + name;
    }

    private boolean isGitRepo(File dir) {
        return dir.exists() && new File(dir, ".git").isDirectory();
    }

    /**
     * 构建 CredentialsProvider:
     * - 有 token → UsernamePasswordCredentialsProvider("oauth2", token)
     * - 无 token → UsernamePasswordCredentialsProvider("x-access-token", "") (允许 public 仓库匿名访问)
     */
    private CredentialsProvider buildCredentialsProvider(String token) {
        if (TokenEncryptor.isValidToken(token)) {
            return new UsernamePasswordCredentialsProvider("oauth2", token);
        }
        // 对于 public 仓库, 使用空凭证让 JGit 可以尝试匿名访问
        return new UsernamePasswordCredentialsProvider("x-access-token", "");
    }

    private void cloneRepo(String url, String branch, String token, File targetDir) {
        log.info("Clone 仓库: url={}, branch={}, target={}", url, branch, targetDir.getAbsolutePath());
        try {
            targetDir.getParentFile().mkdirs();

            CloneCommand cmd = Git.cloneRepository()
                    .setURI(url)
                    .setBranch(branch)
                    .setDirectory(targetDir)
                    .setDepth(1) // 浅克隆，节省空间
                    .setCredentialsProvider(buildCredentialsProvider(token));

            try (Git git = cmd.call()) {
                log.info("Clone 完成, path={}", targetDir.getAbsolutePath());
            }
        } catch (Exception e) {
            String msg = e.getMessage();
            // 有 token 时的认证失败 → 提示 token 无效
            if (TokenEncryptor.isValidToken(token)) {
                throw BizException.internal("Git clone 认证失败: GitHub PAT Token 无效或无权限, 请检查 Token 是否正确且拥有 repo 权限。错误: " + msg);
            }
            throw BizException.internal("Git clone 失败: " + msg);
        }
    }

    private void pull(File dir, String branch, String token) {
        log.info("Pull 仓库: dir={}, branch={}", dir.getAbsolutePath(), branch);
        try (Git git = Git.open(dir)) {
            PullCommand pull = git.pull()
                    .setRemoteBranchName(branch)
                    .setRebase(true)
                    .setCredentialsProvider(buildCredentialsProvider(token));
            pull.call();
            log.info("Pull 完成");
        } catch (Exception e) {
            throw BizException.internal("Git pull 失败: " + e.getMessage());
        }
    }

    private void cleanInternal(File file) throws Exception {
        if (file.isDirectory()) {
            File[] children = file.listFiles();
            if (children != null) {
                for (File child : children) {
                    cleanInternal(child);
                }
            }
        }
        Files.deleteIfExists(file.toPath());
    }
}