package com.sourcelens;

import com.sourcelens.common.exception.BizException;
import com.sourcelens.module.repository.service.RepositoryUrlPolicy;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class RepositoryUrlPolicyTest {

    @Test
    void parseAndValidate_shouldNormalizeGitHubUrl() {
        var parsed = RepositoryUrlPolicy.parseAndValidate(" https://github.com/acme/api/ ", false);

        assertEquals("GITHUB", parsed.provider());
        assertEquals("acme", parsed.owner());
        assertEquals("api", parsed.name());
        assertEquals("https://github.com/acme/api.git", parsed.normalizedUrl());

        var dotRepo = RepositoryUrlPolicy.parseAndValidate("https://github.com/acme/.github", false);
        assertEquals(".github", dotRepo.name());
        assertEquals("https://github.com/acme/.github.git", dotRepo.normalizedUrl());
    }

    @Test
    void parseAndValidate_shouldRejectUnsafeGitHubUrlForms() {
        assertThrows(BizException.class,
                () -> RepositoryUrlPolicy.parseAndValidate("http://github.com/acme/api.git", false));
        assertThrows(BizException.class,
                () -> RepositoryUrlPolicy.parseAndValidate("https://token@github.com/acme/api.git", false));
        assertThrows(BizException.class,
                () -> RepositoryUrlPolicy.parseAndValidate("https://github.com/acme/api.git?token=x", false));
        assertThrows(BizException.class,
                () -> RepositoryUrlPolicy.parseAndValidate("https://github.evil.example/acme/api.git", false));
    }

    @Test
    void parseAndValidate_shouldRejectUnsafeGitHubPathComponents() {
        assertThrows(BizException.class,
                () -> RepositoryUrlPolicy.parseAndValidate("https://github.com/../api", false));
        assertThrows(BizException.class,
                () -> RepositoryUrlPolicy.parseAndValidate("https://github.com/-owner/api", false));
        assertThrows(BizException.class,
                () -> RepositoryUrlPolicy.parseAndValidate("https://github.com/acme--org/api", false));
        assertThrows(BizException.class,
                () -> RepositoryUrlPolicy.parseAndValidate("https://github.com/acme/..", false));
        assertThrows(BizException.class,
                () -> RepositoryUrlPolicy.parseAndValidate("https://github.com/acme/repo..name", false));
        assertThrows(BizException.class,
                () -> RepositoryUrlPolicy.parseAndValidate("https://github.com/acme/repo.git.git", false));
    }

    @Test
    void parseAndValidate_shouldGateLocalFileRepositories() {
        assertThrows(BizException.class,
                () -> RepositoryUrlPolicy.parseAndValidate("file:///tmp/source", false));

        var parsed = RepositoryUrlPolicy.parseAndValidate("file:///tmp/source", true);

        assertEquals("LOCAL", parsed.provider());
        assertEquals("local", parsed.owner());
        assertEquals("source", parsed.name());
    }

    @Test
    void validateBranch_shouldRejectInvalidBranchNames() {
        assertEquals("main", RepositoryUrlPolicy.validateBranch(null));
        assertEquals("feature/safe-branch_1", RepositoryUrlPolicy.validateBranch(" feature/safe-branch_1 "));

        assertThrows(BizException.class, () -> RepositoryUrlPolicy.validateBranch("../main"));
        assertThrows(BizException.class, () -> RepositoryUrlPolicy.validateBranch("/main"));
        assertThrows(BizException.class, () -> RepositoryUrlPolicy.validateBranch("feature//x"));
        assertThrows(BizException.class, () -> RepositoryUrlPolicy.validateBranch("main@{1}"));
        assertThrows(BizException.class, () -> RepositoryUrlPolicy.validateBranch("main;rm"));
    }
}
