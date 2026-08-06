package com.sourcelens.module.repository.service;

import com.sourcelens.common.exception.BizException;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.File;
import java.nio.file.Path;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GitServiceTest {

    private final GitService gitService = new GitService();

    @Test
    void isRetryableGitTransportError_shouldRecognizeTransientCloneFailures() {
        assertTrue(gitService.isRetryableGitTransportError("Premature EOF"));
        assertTrue(gitService.isRetryableGitTransportError("RPC failed; curl 18 transfer closed"));
        assertTrue(gitService.isRetryableGitTransportError("HTTP/2 stream 5 was not closed cleanly"));
        assertTrue(gitService.isRetryableGitTransportError("The remote end hung up unexpectedly"));
        assertTrue(gitService.isRetryableGitTransportError("Read timed out"));

        assertFalse(gitService.isRetryableGitTransportError("Repository not found"));
        assertFalse(gitService.isRetryableGitTransportError("Authentication failed"));
    }

    @Test
    void buildNativeGitCloneCommand_shouldUseHttp11ShallowSingleBranchClone() {
        File targetDir = new File("/tmp/sourcelens/repo");

        List<String> command = gitService.buildNativeGitCloneCommand(
                "https://github.com/LJunP/Pawnshop-Management-System.git",
                "main",
                targetDir);

        assertEquals(List.of(
                "git",
                "-c",
                "http.version=HTTP/1.1",
                "-c",
                "credential.helper=",
                "-c",
                "core.askPass=/bin/false",
                "clone",
                "--depth",
                "1",
                "--single-branch",
                "--branch",
                "main",
                "https://github.com/LJunP/Pawnshop-Management-System.git",
                targetDir.getAbsolutePath()
        ), command);
    }

    @Test
    void applyNativeGitEnvironment_shouldDisableAmbientCredentialsAndGlobalConfig() {
        Map<String, String> environment = new HashMap<>();
        Path isolatedHome = Path.of("/tmp/sourcelens-isolated-git-home");

        gitService.applyNativeGitEnvironment(environment, isolatedHome);

        assertEquals("0", environment.get("GIT_TERMINAL_PROMPT"));
        assertEquals("/bin/false", environment.get("GIT_ASKPASS"));
        assertEquals("/bin/false", environment.get("SSH_ASKPASS"));
        assertEquals("Never", environment.get("GCM_INTERACTIVE"));
        assertEquals("1", environment.get("GIT_CONFIG_NOSYSTEM"));
        assertEquals(isolatedHome.resolve(".gitconfig").toString(), environment.get("GIT_CONFIG_GLOBAL"));
        assertEquals(isolatedHome.toString(), environment.get("HOME"));
        assertEquals(isolatedHome.resolve(".config").toString(), environment.get("XDG_CONFIG_HOME"));
    }

    @Test
    void runNativeGitClone_shouldReportActionableErrorWhenGitCliIsMissing() {
        GitService missingGitService = new GitService() {
            @Override
            String nativeGitExecutable() {
                return "/tmp/sourcelens-git-does-not-exist";
            }
        };

        IOException ex = assertThrows(IOException.class, () -> missingGitService.runNativeGitClone(
                "https://github.com/acme/repo.git",
                "main",
                new File("/tmp/sourcelens-missing-git-target"),
                Duration.ofSeconds(1)));

        assertTrue(ex.getMessage().contains("系统 git CLI 不可用"));
        assertTrue(ex.getMessage().contains("required for anonymous GitHub public repo clone"));
        assertTrue(ex.getMessage().contains("install git in the backend runtime"));
    }

    @Test
    void sanitizeGitError_shouldRedactCredentialsBeforePropagation() {
        String sanitized = gitService.sanitizeGitError(
                "fatal: https://oauth2:ghp_123456789012345678901234567890123456@github.com/acme/repo.git "
                        + "Authorization: Bearer github_pat_123456789012345678901234567890");

        assertFalse(sanitized.contains("ghp_123456789012345678901234567890123456"));
        assertFalse(sanitized.contains("github_pat_123456789012345678901234567890"));
        assertTrue(sanitized.contains("****"));
    }

    @Test
    void ensureLocal_shouldRejectLocalFileRepositoryWhenConfigIsClosed() {
        BizException ex = assertThrows(BizException.class, () -> gitService.ensureLocal(
                1L,
                "file:///tmp/source",
                "main",
                null));

        assertEquals("BAD_REQUEST", ex.getCode());
    }

    @Test
    void shouldUseNativeGitForAnonymousGitHub_shouldOnlyApplyToPublicGitHubClone() {
        assertTrue(gitService.shouldUseNativeGitForAnonymousGitHub(
                "https://github.com/LJunP/Pawnshop-Management-System.git",
                null));

        assertFalse(gitService.shouldUseNativeGitForAnonymousGitHub(
                "file:///tmp/source",
                null));
        assertFalse(gitService.shouldUseNativeGitForAnonymousGitHub(
                "https://github.com/LJunP/Pawnshop-Management-System.git",
                "ghp_123456789012345678901234567890123456"));
    }
}
