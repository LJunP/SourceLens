package com.sourcelens;

import com.sourcelens.common.exception.BizException;
import com.sourcelens.module.autorepair.entity.AutoRepair;
import com.sourcelens.module.autorepair.service.AutoRepairPrService;
import com.sourcelens.module.repository.entity.Repository;
import com.sourcelens.module.repository.service.GitHubPullRequestService;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.transport.RemoteRefUpdate;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AutoRepairPrServiceTest {

    @TempDir
    private Path tempDir;

    @Mock
    private GitHubPullRequestService pullRequestService;

    @Test
    void submitPatchAsPullRequest_shouldCleanupTemporaryWorkdirAfterSuccess() throws Exception {
        Path sourceRepo = tempDir.resolve("source");
        Files.createDirectories(sourceRepo.resolve("src"));
        Files.writeString(sourceRepo.resolve("src/App.java"), "old\n");
        try (Git git = Git.init()
                .setDirectory(sourceRepo.toFile())
                .setInitialBranch("main")
                .call()) {
            git.add().addFilepattern(".").call();
            git.commit()
                    .setAuthor("Tester", "tester@example.invalid")
                    .setCommitter("Tester", "tester@example.invalid")
                    .setMessage("initial")
                    .call();
        }

        Path remoteRepo = tempDir.resolve("remote.git");
        try (Git ignored = Git.cloneRepository()
                .setURI(sourceRepo.toUri().toString())
                .setBare(true)
                .setDirectory(remoteRepo.toFile())
                .call()) {
            // Create a local bare remote for the PR flow to clone and push into.
        }

        AutoRepairPrService service = new AutoRepairPrService(pullRequestService);
        ReflectionTestUtils.setField(service, "workspaceBasePath", tempDir.resolve("workspace").toString());
        ReflectionTestUtils.setField(service, "allowedGitHosts", "local-file");

        Repository repo = Repository.builder()
                .url(remoteRepo.toUri().toString())
                .defaultBranch("main")
                .owner("acme")
                .name("api")
                .build();
        AutoRepair repair = AutoRepair.builder()
                .id(12L)
                .filePath("src/App.java")
                .targetDesc("replace old with new")
                .diffContent("""
                        diff --git a/src/App.java b/src/App.java
                        --- a/src/App.java
                        +++ b/src/App.java
                        @@ -1 +1 @@
                        -old
                        +new
                        """)
                .build();
        when(pullRequestService.createPullRequest(
                eq(repo), eq("installation-token"), eq("sourcelens/auto-repair-12"), eq("main"),
                anyString(), anyString()))
                .thenReturn("https://github.com/acme/api/pull/7");

        AutoRepairPrService.PullRequestResult result = service.submitPatchAsPullRequest(
                repo, repair, "installation-token", "sourcelens/auto-repair-12", null);

        assertEquals("https://github.com/acme/api/pull/7", result.prUrl());
        assertFalse(Files.exists(tempDir.resolve("workspace/sandbox/autorepair-pr-12")));
    }

    @Test
    void submitPatchAsPullRequest_shouldClassifyNonFastForwardPushAsConflictAndSkipPrCreation() throws Exception {
        Path sourceRepo = tempDir.resolve("source");
        Files.createDirectories(sourceRepo.resolve("src"));
        Files.writeString(sourceRepo.resolve("src/App.java"), "old\n");
        try (Git git = Git.init()
                .setDirectory(sourceRepo.toFile())
                .setInitialBranch("main")
                .call()) {
            git.add().addFilepattern(".").call();
            git.commit()
                    .setAuthor("Tester", "tester@example.invalid")
                    .setCommitter("Tester", "tester@example.invalid")
                    .setMessage("initial")
                    .call();
        }

        Path remoteRepo = tempDir.resolve("remote.git");
        try (Git ignored = Git.cloneRepository()
                .setURI(sourceRepo.toUri().toString())
                .setBare(true)
                .setDirectory(remoteRepo.toFile())
                .call()) {
            // Create a local bare remote for the PR flow to clone and push into.
        }

        Path remoteWriter = tempDir.resolve("remote-writer");
        try (Git git = Git.cloneRepository()
                .setURI(remoteRepo.toUri().toString())
                .setDirectory(remoteWriter.toFile())
                .call()) {
            git.checkout()
                    .setCreateBranch(true)
                    .setName("sourcelens/auto-repair-12")
                    .call();
            Files.writeString(remoteWriter.resolve("src/App.java"), "remote branch already changed\n");
            git.add().addFilepattern(".").call();
            git.commit()
                    .setAuthor("Tester", "tester@example.invalid")
                    .setCommitter("Tester", "tester@example.invalid")
                    .setMessage("existing repair branch")
                    .call();
            git.push()
                    .setRemote("origin")
                    .add("sourcelens/auto-repair-12")
                    .call();
        }

        AutoRepairPrService service = new AutoRepairPrService(pullRequestService);
        ReflectionTestUtils.setField(service, "workspaceBasePath", tempDir.resolve("workspace").toString());
        ReflectionTestUtils.setField(service, "allowedGitHosts", "local-file");

        Repository repo = Repository.builder()
                .url(remoteRepo.toUri().toString())
                .defaultBranch("main")
                .owner("acme")
                .name("api")
                .build();
        AutoRepair repair = AutoRepair.builder()
                .id(12L)
                .filePath("src/App.java")
                .targetDesc("replace old with new")
                .diffContent("""
                        diff --git a/src/App.java b/src/App.java
                        --- a/src/App.java
                        +++ b/src/App.java
                        @@ -1 +1 @@
                        -old
                        +new
                        """)
                .build();
        RecordingProgressReporter progress = new RecordingProgressReporter();

        BizException ex = assertThrows(BizException.class, () -> service.submitPatchAsPullRequest(
                repo, repair, "installation-token", "sourcelens/auto-repair-12", progress));

        assertEquals("CONFLICT", ex.getCode());
        assertEquals(true, ex.getMessage().contains("GitHub 分支推送冲突"));
        assertEquals(true, progress.started.contains("push_branch"));
        assertEquals(false, progress.started.contains("create_pull_request"));
        assertFalse(Files.exists(tempDir.resolve("workspace/sandbox/autorepair-pr-12")));
        verify(pullRequestService, never()).createPullRequest(
                eq(repo), anyString(), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void submitPatchAsPullRequest_shouldClassifyRemotePolicyPushRejectionAsForbiddenWithSanitizedReason() {
        AutoRepairPrService service = new AutoRepairPrService(pullRequestService);

        BizException ex = ReflectionTestUtils.invokeMethod(service, "mapPushFailure",
                RemoteRefUpdate.Status.REJECTED_OTHER_REASON,
                "GH006: Protected branch update failed\nChanges must be made through a pull request.");

        assertEquals("FORBIDDEN", ex.getCode());
        assertEquals(true, ex.getMessage().contains("GitHub 分支推送被远端拒绝"));
        assertEquals(true, ex.getMessage().contains("REJECTED_OTHER_REASON"));
        assertEquals(true, ex.getMessage().contains("GH006: Protected branch update failed"));
        assertEquals(false, ex.getMessage().contains("\n"));
    }

    @Test
    void submitPatchAsPullRequest_shouldRejectGitHostOutsideAllowlist() {
        AutoRepairPrService service = new AutoRepairPrService(pullRequestService);
        ReflectionTestUtils.setField(service, "workspaceBasePath", tempDir.resolve("workspace").toString());
        ReflectionTestUtils.setField(service, "allowedGitHosts", "github.com");
        Repository repo = Repository.builder()
                .url("https://evil.example/acme/api.git")
                .defaultBranch("main")
                .build();
        AutoRepair repair = AutoRepair.builder()
                .id(12L)
                .filePath("src/App.java")
                .targetDesc("replace old with new")
                .diffContent("diff --git a/src/App.java b/src/App.java\n")
                .build();

        var ex = assertThrows(BizException.class,
                () -> service.submitPatchAsPullRequest(
                        repo, repair, "installation-token", "sourcelens/auto-repair-12", null));

        assertEquals("BAD_REQUEST", ex.getCode());
    }

    @Test
    void submitPatchAsPullRequest_shouldRejectPatchTouchingUnexpectedFileBeforeClone() {
        AutoRepairPrService service = new AutoRepairPrService(pullRequestService);
        ReflectionTestUtils.setField(service, "workspaceBasePath", tempDir.resolve("workspace").toString());
        ReflectionTestUtils.setField(service, "allowedGitHosts", "github.com");
        Repository repo = Repository.builder()
                .url("https://github.com/acme/api.git")
                .defaultBranch("main")
                .build();
        AutoRepair repair = AutoRepair.builder()
                .id(12L)
                .filePath("src/App.java")
                .targetDesc("replace old with new")
                .diffContent("""
                        diff --git a/src/App.java b/src/App.java
                        diff --git a/src/Other.java b/src/Other.java
                        """)
                .build();

        var ex = assertThrows(BizException.class,
                () -> service.submitPatchAsPullRequest(
                        repo, repair, "installation-token", "sourcelens/auto-repair-12", null));

        assertEquals("BAD_REQUEST", ex.getCode());
        verify(pullRequestService, never()).createPullRequest(
                eq(repo), anyString(), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void submitPatchAsPullRequest_shouldRejectUnsafeBranchBeforeClone() {
        AutoRepairPrService service = new AutoRepairPrService(pullRequestService);
        ReflectionTestUtils.setField(service, "workspaceBasePath", tempDir.resolve("workspace").toString());
        ReflectionTestUtils.setField(service, "allowedGitHosts", "github.com");
        Repository repo = Repository.builder()
                .url("https://github.com/acme/api.git")
                .defaultBranch("main")
                .build();
        AutoRepair repair = AutoRepair.builder()
                .id(12L)
                .filePath("src/App.java")
                .targetDesc("replace old with new")
                .diffContent("diff --git a/src/App.java b/src/App.java\n")
                .build();

        var ex = assertThrows(BizException.class,
                () -> service.submitPatchAsPullRequest(
                        repo, repair, "installation-token", "../unsafe", null));

        assertEquals("BAD_REQUEST", ex.getCode());
        verify(pullRequestService, never()).createPullRequest(
                eq(repo), anyString(), anyString(), anyString(), anyString(), anyString());
    }

    private static class RecordingProgressReporter implements AutoRepairPrService.ProgressReporter {
        private final List<String> started = new ArrayList<>();

        @Override
        public void start(String stepKey, String stepName) {
            started.add(stepKey);
        }

        @Override
        public void complete(String stepKey, String summary) {
        }
    }
}
