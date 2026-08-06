package com.sourcelens.module.repository.service;

import com.sourcelens.common.exception.BizException;
import com.sourcelens.common.security.SensitiveDataSanitizer;
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

import java.io.IOException;
import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.TimeUnit;
import java.util.stream.Stream;

/**
 * Git 仓库管理：clone / pull / 本地路径映射
 */
@Slf4j
@Service
public class GitService {

    @Value("${sourcelens.workspace.base-path:/tmp/sourcelens/repos}")
    private String workspaceBasePath;

    @Value("${sourcelens.git.clone-timeout-seconds:600}")
    private long cloneTimeoutSeconds;

    @Value("${sourcelens.repository.allow-local-file:false}")
    private boolean allowLocalFileRepositories;

    /**
     * 确保仓库本地可用：存在则 pull，否则 clone
     * @return 本地仓库目录绝对路径
     */
    public String ensureLocal(Long projectId, String repoUrl, String branch, String token) {
        RepositoryUrlPolicy.ParsedRepository parsed =
                RepositoryUrlPolicy.parseAndValidate(repoUrl, allowLocalFileRepositories);
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
     * - 无 token → null, 让 public 仓库走真正匿名访问
     */
    private CredentialsProvider buildCredentialsProvider(String token) {
        if (TokenEncryptor.isValidToken(token)) {
            return new UsernamePasswordCredentialsProvider("oauth2", token);
        }
        return null;
    }

    private void cloneRepo(String url, String branch, String token, File targetDir) {
        log.info("Clone 仓库: url={}, branch={}, target={}", url, branch, targetDir.getAbsolutePath());
        try {
            targetDir.getParentFile().mkdirs();
            if (shouldUseNativeGitForAnonymousGitHub(url, token)) {
                runNativeGitClone(url, branch, targetDir, Duration.ofSeconds(Math.max(30, cloneTimeoutSeconds)));
                log.info("系统 git clone 完成, path={}", targetDir.getAbsolutePath());
                return;
            }
            runJGitClone(url, branch, token, targetDir);
            log.info("Clone 完成, path={}", targetDir.getAbsolutePath());
        } catch (Exception e) {
            String msg = sanitizeGitError(e.getMessage());
            // 有 token 时的认证失败 → 提示 token 无效
            if (TokenEncryptor.isValidToken(token)) {
                throw BizException.internal("Git clone 认证失败: GitHub PAT Token 无效或无权限, 请检查 Token 是否正确且拥有 repo 权限。错误: " + msg);
            }
            if (shouldFallbackToNativeGit(url, token, msg)) {
                log.warn("JGit clone 传输失败, 尝试系统 git fallback: {}", msg);
                try {
                    cleanInternal(targetDir);
                    runNativeGitClone(url, branch, targetDir, Duration.ofSeconds(Math.max(30, cloneTimeoutSeconds)));
                    log.info("系统 git fallback clone 完成, path={}", targetDir.getAbsolutePath());
                    return;
                } catch (Exception fallbackError) {
                    throw BizException.internal("Git clone 失败: " + msg
                            + "; native git fallback 失败: " + sanitizeGitError(fallbackError.getMessage()));
                }
            }
            throw BizException.internal("Git clone 失败: " + msg);
        }
    }

    private void runJGitClone(String url, String branch, String token, File targetDir) throws Exception {
        CloneCommand cmd = Git.cloneRepository()
                .setURI(url)
                .setBranch(branch)
                .setDirectory(targetDir);

        if (!url.startsWith("file://")) {
            cmd.setDepth(1); // 浅克隆，节省空间
            CredentialsProvider credentialsProvider = buildCredentialsProvider(token);
            if (credentialsProvider != null) {
                cmd.setCredentialsProvider(credentialsProvider);
            }
        }

        try (Git ignored = cmd.call()) {
            // no-op
        }
    }

    private boolean shouldFallbackToNativeGit(String url, String token, String errorMessage) {
        return shouldUseNativeGitForAnonymousGitHub(url, token)
                && isRetryableGitTransportError(errorMessage);
    }

    boolean shouldUseNativeGitForAnonymousGitHub(String url, String token) {
        return url.startsWith("https://github.com/")
                && !TokenEncryptor.isValidToken(token);
    }

    boolean isRetryableGitTransportError(String message) {
        String normalized = message == null ? "" : message.toLowerCase(Locale.ROOT);
        return normalized.contains("premature eof")
                || normalized.contains("early eof")
                || normalized.contains("rpc failed")
                || normalized.contains("http/2 stream")
                || normalized.contains("curl 18")
                || normalized.contains("connection reset")
                || normalized.contains("connection timed out")
                || normalized.contains("read timed out")
                || normalized.contains("timeout")
                || normalized.contains("the remote end hung up unexpectedly");
    }

    List<String> buildNativeGitCloneCommand(String url, String branch, File targetDir) {
        List<String> command = new ArrayList<>();
        command.add(nativeGitExecutable());
        command.add("-c");
        command.add("http.version=HTTP/1.1");
        command.add("-c");
        command.add("credential.helper=");
        command.add("-c");
        command.add("core.askPass=/bin/false");
        command.add("clone");
        command.add("--depth");
        command.add("1");
        command.add("--single-branch");
        command.add("--branch");
        command.add(branch);
        command.add(url);
        command.add(targetDir.getAbsolutePath());
        return command;
    }

    String nativeGitExecutable() {
        return "git";
    }

    void runNativeGitClone(String url, String branch, File targetDir, Duration timeout) throws Exception {
        ProcessBuilder processBuilder = new ProcessBuilder(buildNativeGitCloneCommand(url, branch, targetDir));
        processBuilder.redirectErrorStream(true);
        Path outputFile = Files.createTempFile("sourcelens-git-clone-", ".log");
        Path isolatedHome = Files.createTempDirectory("sourcelens-git-home-");
        try {
            applyNativeGitEnvironment(processBuilder.environment(), isolatedHome);
            processBuilder.redirectOutput(outputFile.toFile());
            Process process = startNativeGitCloneProcess(processBuilder);
            boolean finished = process.waitFor(timeout.toSeconds(), TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                throw new IOException("系统 git clone 超时(" + timeout.toSeconds() + "s)");
            }
            String output = readProcessOutput(outputFile);
            if (process.exitValue() != 0) {
                throw new IOException("系统 git clone exit=" + process.exitValue() + ": " + sanitizeGitError(output));
            }
            if (!isGitRepo(targetDir)) {
                throw new IOException("系统 git clone 未生成有效 .git 目录: " + sanitizeGitError(output));
            }
        } catch (IOException e) {
            if (isNativeGitUnavailable(e)) {
                throw new IOException("系统 git CLI 不可用: required for anonymous GitHub public repo clone; "
                        + "install git in the backend runtime. " + sanitizeGitError(e.getMessage()), e);
            }
            throw e;
        } finally {
            Files.deleteIfExists(outputFile);
            cleanPath(isolatedHome);
        }
    }

    void applyNativeGitEnvironment(java.util.Map<String, String> environment, Path isolatedHome) {
        environment.put("GIT_TERMINAL_PROMPT", "0");
        environment.put("GIT_ASKPASS", "/bin/false");
        environment.put("SSH_ASKPASS", "/bin/false");
        environment.put("GCM_INTERACTIVE", "Never");
        environment.put("GIT_CONFIG_NOSYSTEM", "1");
        environment.put("GIT_CONFIG_GLOBAL", isolatedHome.resolve(".gitconfig").toString());
        environment.put("HOME", isolatedHome.toString());
        environment.put("XDG_CONFIG_HOME", isolatedHome.resolve(".config").toString());
    }

    Process startNativeGitCloneProcess(ProcessBuilder processBuilder) throws IOException {
        return processBuilder.start();
    }

    boolean isNativeGitUnavailable(IOException e) {
        String message = e.getMessage() == null ? "" : e.getMessage().toLowerCase(Locale.ROOT);
        return message.contains("cannot run program")
                || message.contains("no such file or directory")
                || message.contains("error=2");
    }

    String sanitizeGitError(String message) {
        String value = message == null ? "" : message;
        return SensitiveDataSanitizer.sanitizeAndTruncate(value, 4_000);
    }

    private String readProcessOutput(Path outputFile) throws IOException {
        if (!Files.exists(outputFile)) {
            return "";
        }
        String output = Files.readString(outputFile, StandardCharsets.UTF_8).trim();
        int maxLength = 4_000;
        if (output.length() <= maxLength) {
            return output;
        }
        return output.substring(output.length() - maxLength);
    }

    private void pull(File dir, String branch, String token) {
        log.info("Pull 仓库: dir={}, branch={}", dir.getAbsolutePath(), branch);
        try (Git git = Git.open(dir)) {
            PullCommand pull = git.pull()
                    .setRemoteBranchName(branch)
                    .setRebase(true);
            CredentialsProvider credentialsProvider = buildCredentialsProvider(token);
            if (credentialsProvider != null) {
                pull.setCredentialsProvider(credentialsProvider);
            }
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
