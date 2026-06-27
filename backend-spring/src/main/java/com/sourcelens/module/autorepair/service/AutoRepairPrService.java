package com.sourcelens.module.autorepair.service;

import com.sourcelens.common.exception.BizException;
import com.sourcelens.module.autorepair.entity.AutoRepair;
import com.sourcelens.module.repository.entity.Repository;
import com.sourcelens.module.repository.service.GitHubPullRequestService;
import com.sourcelens.module.repository.service.RepositoryUrlPolicy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.transport.RefSpec;
import org.eclipse.jgit.transport.RemoteRefUpdate;
import org.eclipse.jgit.transport.UsernamePasswordCredentialsProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AutoRepairPrService {

    private final GitHubPullRequestService pullRequestService;

    @Value("${sourcelens.workspace.base-path:/tmp/sourcelens/repos}")
    private String workspaceBasePath;

    @Value("${sourcelens.autorepair.pr-allowed-git-hosts:github.com}")
    private String allowedGitHosts;

    public PullRequestResult submitPatchAsPullRequest(Repository repo,
                                                      AutoRepair repair,
                                                      String token,
                                                      String branchName,
                                                      ProgressReporter progressReporter) {
        if (!StringUtils.hasText(repair.getDiffContent())) {
            throw BizException.badRequest("补丁内容为空，无法创建 PR");
        }
        AutoRepairPatchPolicy.validateSingleFilePatch(repair.getFilePath(), repair.getDiffContent());
        String normalizedBranchName = RepositoryUrlPolicy.validateBranch(branchName);
        String normalizedBaseBranch = RepositoryUrlPolicy.validateBranch(repo.getDefaultBranch());
        validateGitHostAllowed(repo);
        ProgressReporter progress = progressReporter == null ? ProgressReporter.noop() : progressReporter;
        Path workdir = Path.of(workspaceBasePath, "sandbox", "autorepair-pr-" + repair.getId())
                .toAbsolutePath()
                .normalize();
        try {
            cleanWorkdir(workdir);
            Files.createDirectories(workdir.getParent());
            UsernamePasswordCredentialsProvider credentials =
                    new UsernamePasswordCredentialsProvider("oauth2", token);

            progress.start("clone_repository", "克隆仓库并创建修复分支");
            try (Git git = Git.cloneRepository()
                    .setURI(repo.getUrl())
                    .setBranch(normalizedBaseBranch)
                    .setDirectory(workdir.toFile())
                    .setCredentialsProvider(credentials)
                    .setDepth(1)
                    .call()) {
                git.checkout()
                        .setCreateBranch(true)
                        .setName(normalizedBranchName)
                        .call();
                progress.complete("clone_repository", "已克隆仓库并切换到分支 " + branchName);

                progress.start("apply_patch", "应用补丁并提交变更");
                git.apply()
                        .setPatch(new ByteArrayInputStream(repair.getDiffContent().getBytes(StandardCharsets.UTF_8)))
                        .call();
                git.add().addFilepattern(".").call();
                git.commit()
                        .setAuthor("SourceLens", "sourcelens@example.invalid")
                        .setCommitter("SourceLens", "sourcelens@example.invalid")
                        .setMessage(buildCommitMessage(repair))
                        .call();
                progress.complete("apply_patch", "补丁已应用并生成提交");

                progress.start("push_branch", "推送修复分支");
                var pushResults = git.push()
                        .setCredentialsProvider(credentials)
                        .setRemote("origin")
                        .setRefSpecs(new RefSpec(normalizedBranchName + ":" + normalizedBranchName))
                        .call();
                for (var result : pushResults) {
                    for (RemoteRefUpdate update : result.getRemoteUpdates()) {
                        RemoteRefUpdate.Status status = update.getStatus();
                        if (status != RemoteRefUpdate.Status.OK
                                && status != RemoteRefUpdate.Status.UP_TO_DATE) {
                            throw mapPushFailure(status, update.getMessage());
                        }
                    }
                }
                progress.complete("push_branch", "分支已推送到 origin/" + normalizedBranchName);
            }

            progress.start("create_pull_request", "创建 GitHub Pull Request");
            String prUrl = pullRequestService.createPullRequest(
                    repo,
                    token,
                    normalizedBranchName,
                    normalizedBaseBranch,
                    "SourceLens auto repair: " + repair.getFilePath(),
                    buildPullRequestBody(repair));
            progress.complete("create_pull_request", "Pull Request 已创建: " + prUrl);
            return new PullRequestResult(normalizedBranchName, prUrl);
        } catch (BizException e) {
            throw e;
        } catch (Exception e) {
            throw BizException.internal("受控 PR 创建失败: " + e.getMessage());
        } finally {
            try {
                cleanWorkdir(workdir);
            } catch (Exception cleanupError) {
                log.warn("受控 PR 临时工作区清理失败: {}", workdir, cleanupError);
            }
        }
    }

    private String buildCommitMessage(AutoRepair repair) {
        return "SourceLens auto repair: " + repair.getFilePath() + "\n\n" + repair.getTargetDesc();
    }

    private BizException mapPushFailure(RemoteRefUpdate.Status status, String remoteMessage) {
        String detail = pushFailureDetail(status, remoteMessage);
        if (status == RemoteRefUpdate.Status.REJECTED_NONFASTFORWARD
                || status == RemoteRefUpdate.Status.REJECTED_REMOTE_CHANGED) {
            return BizException.conflict("GitHub 分支推送冲突: " + detail);
        }
        if (status == RemoteRefUpdate.Status.REJECTED_OTHER_REASON
                || status == RemoteRefUpdate.Status.REJECTED_NODELETE) {
            return BizException.forbidden("GitHub 分支推送被远端拒绝: " + detail);
        }
        return BizException.internal("GitHub 分支推送失败: " + detail);
    }

    private String pushFailureDetail(RemoteRefUpdate.Status status, String remoteMessage) {
        String statusText = status == null ? "UNKNOWN" : status.name();
        String message = sanitizeRemoteMessage(remoteMessage);
        if (StringUtils.hasText(message)) {
            return statusText + " (" + message + ")";
        }
        return statusText;
    }

    private String sanitizeRemoteMessage(String message) {
        if (!StringUtils.hasText(message)) {
            return "";
        }
        String normalized = message.replace('\r', ' ')
                .replace('\n', ' ')
                .replaceAll("\\s+", " ")
                .trim();
        if (normalized.length() > 240) {
            return normalized.substring(0, 240) + "...";
        }
        return normalized;
    }

    private String buildPullRequestBody(AutoRepair repair) {
        return """
                This pull request was created by SourceLens AutoRepair.

                Target file:
                `%s`

                Repair goal:
                %s

                AutoRepair task: #%d
                Created at: %s
                """.formatted(repair.getFilePath(), repair.getTargetDesc(), repair.getId(), Instant.now());
    }

    private void validateGitHostAllowed(Repository repo) {
        String host = parseHost(repo.getUrl());
        if (!allowedHosts().contains(host)) {
            throw BizException.badRequest("受控 PR Git 远端不在允许的网络出口列表中: " + host);
        }
    }

    private String parseHost(String url) {
        if (!StringUtils.hasText(url)) {
            throw BizException.badRequest("仓库 URL 不能为空");
        }
        try {
            URI uri = URI.create(url);
            if ("file".equalsIgnoreCase(uri.getScheme())) {
                return "local-file";
            }
            if (!StringUtils.hasText(uri.getHost())) {
                throw BizException.badRequest("仓库 URL 缺少 host");
            }
            return uri.getHost().toLowerCase();
        } catch (IllegalArgumentException e) {
            throw BizException.badRequest("仓库 URL 格式非法");
        }
    }

    private Set<String> allowedHosts() {
        return Arrays.stream(allowedGitHosts.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .map(String::toLowerCase)
                .collect(Collectors.toUnmodifiableSet());
    }

    private void cleanWorkdir(Path path) throws Exception {
        if (!Files.exists(path)) {
            return;
        }
        try (var stream = Files.walk(path)) {
            for (Path p : stream.sorted((a, b) -> b.compareTo(a)).toList()) {
                Files.deleteIfExists(p);
            }
        }
    }

    public record PullRequestResult(String branchName, String prUrl) {
    }

    public interface ProgressReporter {

        void start(String stepKey, String stepName);

        void complete(String stepKey, String summary);

        static ProgressReporter noop() {
            return new ProgressReporter() {
                @Override
                public void start(String stepKey, String stepName) {
                }

                @Override
                public void complete(String stepKey, String summary) {
                }
            };
        }
    }
}
