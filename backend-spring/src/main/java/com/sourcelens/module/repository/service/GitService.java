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
import java.nio.file.StandardCopyOption;
import java.util.Comparator;
import java.util.stream.Stream;

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
        RepositoryUrlPolicy.ParsedRepository parsed = RepositoryUrlPolicy.parseAndValidate(repoUrl, true);
        String normalizedRepoUrl = parsed.normalizedUrl();
        String normalizedBranch = RepositoryUrlPolicy.validateBranch(branch);
        if ("LOCAL".equals(parsed.provider())) {
            Path original = Path.of(java.net.URI.create(normalizedRepoUrl)).toAbsolutePath().normalize();
            if (Files.isDirectory(original) && !Files.isDirectory(original.resolve(".git"))) {
                String localPath = buildLocalPath(projectId, normalizedRepoUrl);
                Path target = Path.of(localPath).toAbsolutePath().normalize();
                log.info("检测为本地 file:// 非 Git 目录, 复制到隔离工作区: source={}, target={}", original, target);
                copyLocalDirectory(original, target);
                return localPath;
            }
        }

        String localPath = buildLocalPath(projectId, normalizedRepoUrl);
        File dir = new File(localPath);

        if (isGitRepo(dir)) {
            try {
                pull(dir, normalizedBranch, token);
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
        cloneRepo(normalizedRepoUrl, normalizedBranch, token, dir);
        return localPath;
    }

    /**
     * 获取当前 HEAD commit SHA
     */
    public String getHeadSha(String localPath) {
        try {
            File gitDir = new File(localPath, ".git");
            if (!gitDir.isDirectory()) {
                // 非 Git 仓库（如直接引用的本地目录），生成基于路径的伪 SHA
                log.info("非 Git 仓库(无 .git 目录), 使用目录路径生成伪 SHA: {}", localPath);
                return "local-" + Integer.toHexString(localPath.hashCode());
            }
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
        String name = RepositoryUrlPolicy.safeRepositoryName(repoUrl);
        Path base = Path.of(workspaceBasePath).toAbsolutePath().normalize();
        Path target = base.resolve(String.valueOf(projectId)).resolve(name).normalize();
        if (!target.startsWith(base)) {
            throw BizException.badRequest("仓库工作区路径越界");
        }
        return target.toString();
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
                    .setDirectory(targetDir);

            if (!url.startsWith("file://")) {
                cmd.setDepth(1) // 浅克隆，节省空间
                   .setCredentialsProvider(buildCredentialsProvider(token));
            }

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

    private void copyLocalDirectory(Path source, Path target) {
        try {
            if (Files.exists(target)) {
                cleanPath(target);
            }
            Files.createDirectories(target);
            try (Stream<Path> stream = Files.walk(source)) {
                stream.forEach(src -> copyOnePath(source, target, src));
            }
        } catch (Exception e) {
            throw BizException.internal("复制本地仓库到隔离工作区失败: " + e.getMessage());
        }
    }

    private void copyOnePath(Path sourceRoot, Path targetRoot, Path sourcePath) {
        try {
            Path relative = sourceRoot.relativize(sourcePath);
            if (relative.toString().isEmpty() || shouldSkipLocalCopy(relative)) {
                return;
            }
            Path targetPath = targetRoot.resolve(relative).normalize();
            if (!targetPath.startsWith(targetRoot)) {
                throw new SecurityException("本地仓库复制路径越界: " + relative);
            }
            if (Files.isDirectory(sourcePath)) {
                Files.createDirectories(targetPath);
            } else {
                Path parent = targetPath.getParent();
                if (parent != null) {
                    Files.createDirectories(parent);
                }
                Files.copy(sourcePath, targetPath, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.COPY_ATTRIBUTES);
            }
        } catch (Exception e) {
            throw new RuntimeException("复制文件失败: " + sourcePath + ", " + e.getMessage(), e);
        }
    }

    private boolean shouldSkipLocalCopy(Path relativePath) {
        for (Path part : relativePath) {
            String name = part.toString();
            if (name.equals(".git")
                    || name.equals("node_modules")
                    || name.equals("target")
                    || name.equals("build")
                    || name.equals("dist")
                    || name.equals(".idea")
                    || name.equals(".vscode")
                    || name.equals(".gradle")) {
                return true;
            }
        }
        return false;
    }

    private void cleanPath(Path path) throws Exception {
        if (!Files.exists(path)) {
            return;
        }
        try (Stream<Path> stream = Files.walk(path)) {
            for (Path p : stream.sorted(Comparator.reverseOrder()).toList()) {
                Files.deleteIfExists(p);
            }
        }
    }
}
