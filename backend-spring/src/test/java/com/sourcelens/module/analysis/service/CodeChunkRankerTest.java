package com.sourcelens.module.analysis.service;

import com.sourcelens.module.analysis.entity.CodeChunk;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CodeChunkRankerTest {

    @Test
    void pathHintMatchScore_shouldTreatMiddleContainsAsWeakerThanRealFilePathMatches() {
        double exact = CodeChunkRanker.pathHintMatchScore(
                "apps/client/src/pages/Login.tsx",
                "Login.tsx",
                "login.tsx",
                "apps/client/src/pages/Login.tsx",
                150.0,
                130.0,
                25.0,
                40.0,
                30.0);
        double suffix = CodeChunkRanker.pathHintMatchScore(
                "apps/client/src/pages/Login.tsx",
                "Login.tsx",
                "login.tsx",
                "client/src/pages/Login.tsx",
                150.0,
                130.0,
                25.0,
                40.0,
                30.0);
        double basename = CodeChunkRanker.pathHintMatchScore(
                "features/Login.tsx",
                "Login.tsx",
                "login.tsx",
                "src/pages/Login.tsx",
                150.0,
                130.0,
                25.0,
                40.0,
                30.0);
        double middleContains = CodeChunkRanker.pathHintMatchScore(
                "legacy/src/pages/Login.tsx/generated/metadata.ts",
                "metadata.ts",
                "metadata.ts",
                "src/pages/Login.tsx",
                150.0,
                130.0,
                25.0,
                40.0,
                30.0);

        assertEquals(150.0, exact);
        assertEquals(130.0, suffix);
        assertEquals(40.0, basename);
        assertEquals(0.0, middleContains);
        assertTrue(exact > suffix);
        assertTrue(suffix > basename);
        assertTrue(basename > middleContains);
    }

    @Test
    void pathHintMatchScore_shouldKeepEvidencePathContainsBelowEvidenceBasenameMatch() {
        double basename = CodeChunkRanker.pathHintMatchScore(
                "features/Login.tsx",
                "Login.tsx",
                "login.tsx",
                "src/pages/Login.tsx",
                260.0,
                230.0,
                60.0,
                70.0,
                60.0);
        double middleContains = CodeChunkRanker.pathHintMatchScore(
                "legacy/src/pages/Login.tsx/generated/metadata.ts",
                "metadata.ts",
                "metadata.ts",
                "src/pages/Login.tsx",
                260.0,
                230.0,
                50.0,
                70.0,
                60.0);

        assertEquals(70.0, basename);
        assertEquals(0.0, middleContains);
        assertTrue(basename > middleContains);
    }

    @Test
    void pathHintMatchScore_shouldKeepCompactFileNameAboveMiddleContains() {
        double compactFileName = CodeChunkRanker.pathHintMatchScore(
                "features/project-detail.tsx",
                "project-detail.tsx",
                "projectdetail.tsx",
                "src/pages/ProjectDetail.tsx",
                150.0,
                130.0,
                25.0,
                40.0,
                30.0);
        double middleContains = CodeChunkRanker.pathHintMatchScore(
                "legacy/src/pages/ProjectDetail.tsx/generated/metadata.ts",
                "metadata.ts",
                "metadata.ts",
                "src/pages/ProjectDetail.tsx",
                150.0,
                130.0,
                25.0,
                40.0,
                30.0);

        assertEquals(30.0, compactFileName);
        assertEquals(0.0, middleContains);
        assertTrue(compactFileName > middleContains);
    }

    @Test
    void pathHintMatchScore_shouldKeepEvidenceCompactFileNameAboveMiddleContains() {
        double compactFileName = CodeChunkRanker.pathHintMatchScore(
                "features/project-detail.tsx",
                "project-detail.tsx",
                "projectdetail.tsx",
                "src/pages/ProjectDetail.tsx",
                260.0,
                230.0,
                50.0,
                70.0,
                60.0);
        double middleContains = CodeChunkRanker.pathHintMatchScore(
                "legacy/src/pages/ProjectDetail.tsx/generated/metadata.ts",
                "metadata.ts",
                "metadata.ts",
                "src/pages/ProjectDetail.tsx",
                260.0,
                230.0,
                50.0,
                70.0,
                60.0);

        assertEquals(60.0, compactFileName);
        assertEquals(0.0, middleContains);
        assertTrue(compactFileName > middleContains);
    }

    @Test
    void moduleRootHintScore_shouldOnlyPromoteRepositoryRootMatches() {
        CodeChunk target = CodeChunk.builder()
                .filePath("packages/admin/src/pages/Login.tsx")
                .build();
        CodeChunk nestedArchive = CodeChunk.builder()
                .filePath("archive/packages/admin/src/pages/Login.tsx")
                .build();
        CodeChunk otherPackage = CodeChunk.builder()
                .filePath("packages/customer/src/pages/Login.tsx")
                .build();

        assertEquals(90.0, CodeChunkRanker.moduleRootHintScore(target, List.of("packages/admin")));
        assertEquals(0.0, CodeChunkRanker.moduleRootHintScore(nestedArchive, List.of("packages/admin")));
        assertEquals(0.0, CodeChunkRanker.moduleRootHintScore(otherPackage, List.of("packages/admin")));
    }

    @Test
    void moduleRootHintScore_shouldPreferPersistedRootMetadataOverPathHeuristic() {
        CodeChunk persistedModuleRoot = CodeChunk.builder()
                .filePath("packages/admin/src/pages/Login.tsx")
                .moduleRoot("packages/admin")
                .workspaceRoot("packages/admin")
                .build();
        CodeChunk persistedWorkspaceRoot = CodeChunk.builder()
                .filePath("packages/admin/src/pages/Login.tsx")
                .workspaceRoot("packages/admin")
                .build();
        CodeChunk pathOnlyRoot = CodeChunk.builder()
                .filePath("packages/admin/src/pages/Login.tsx")
                .build();
        CodeChunk archiveWithBadPersistedRoot = CodeChunk.builder()
                .filePath("archive/packages/admin/src/pages/Login.tsx")
                .moduleRoot("packages/admin")
                .workspaceRoot("packages/admin")
                .build();

        assertEquals(120.0, CodeChunkRanker.moduleRootHintScore(persistedModuleRoot, List.of("packages/admin")));
        assertEquals(110.0, CodeChunkRanker.moduleRootHintScore(persistedWorkspaceRoot, List.of("packages/admin")));
        assertEquals(90.0, CodeChunkRanker.moduleRootHintScore(pathOnlyRoot, List.of("packages/admin")));
        assertEquals(0.0, CodeChunkRanker.moduleRootHintScore(archiveWithBadPersistedRoot, List.of("packages/admin")));
    }

    @Test
    void isExactLocationAnchorMatch_shouldRejectMiddleContainsPathHints() {
        CodeChunk noise = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("legacy/src/pages/ProjectDetail.tsx/generated/metadata.ts")
                .content("generated metadata")
                .startLine(10)
                .endLine(20)
                .build();

        assertFalse(CodeChunkRanker.isExactLocationAnchorMatch(
                noise,
                "filePath: src/pages/ProjectDetail.tsx line: 12"));
    }

    @Test
    void isExactLocationAnchorMatch_shouldAcceptRealSuffixPathHints() {
        CodeChunk target = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("apps/client/src/pages/ProjectDetail.tsx")
                .content("export function ProjectDetail() {}")
                .startLine(10)
                .endLine(20)
                .build();

        assertTrue(CodeChunkRanker.isExactLocationAnchorMatch(
                target,
                "filePath: client/src/pages/ProjectDetail.tsx line: 12"));
    }

    @Test
    void isExactLocationAnchorMatch_shouldRejectArchivedProtectedModuleRootSuffixHints() {
        CodeChunk archiveDecoy = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("archive/apps/client/src/api/index.ts")
                .content("legacy archived api client")
                .startLine(40)
                .endLine(60)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(2L)
                .scanTaskId(42L)
                .filePath("apps/client/src/api/index.ts")
                .content("export function loginApi() {}")
                .startLine(40)
                .endLine(60)
                .build();
        String question = "sourceUrl=https://github.com/acme/source-lens/blob/main/apps/client/src/api/index.ts#L44";

        assertFalse(CodeChunkRanker.isExactLocationAnchorMatch(archiveDecoy, question));
        assertTrue(CodeChunkRanker.isExactLocationAnchorMatch(target, question));
    }

    @Test
    void isExactLocationAnchorMatch_shouldRejectGeneratedSuffixEvidencePathHints() {
        CodeChunk generatedDecoy = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("generated/packages/admin/src/pages/Login.tsx")
                .content("generated source map mirror for Login")
                .startLine(40)
                .endLine(60)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(2L)
                .scanTaskId(42L)
                .filePath("packages/admin/src/pages/Login.tsx")
                .content("export function Login() { return <LoginForm />; }")
                .startLine(40)
                .endLine(60)
                .build();
        String question = "sourceUrl=https://github.com/acme/source-lens/blob/main/packages/admin/src/pages/Login.tsx#L44";

        assertFalse(CodeChunkRanker.isExactLocationAnchorMatch(generatedDecoy, question));
        assertTrue(CodeChunkRanker.isExactLocationAnchorMatch(target, question));
    }

    @Test
    void isExactLocationAnchorMatch_shouldRejectFixtureSuffixEvidencePathHints() {
        CodeChunk target = CodeChunk.builder()
                .id(2L)
                .scanTaskId(42L)
                .filePath("src/pages/Login.tsx")
                .content("export function Login() { return <LoginForm />; }")
                .startLine(40)
                .endLine(60)
                .build();
        String question = "sourceUrl=https://github.com/acme/source-lens/blob/main/src/pages/Login.tsx#L44";

        for (String fixturePath : List.of(
                "tests/fixtures/src/pages/Login.tsx",
                "tests/__fixtures__/src/pages/Login.tsx",
                "testdata/src/pages/Login.tsx",
                "test-data/src/pages/Login.tsx")) {
            CodeChunk fixtureDecoy = CodeChunk.builder()
                    .id(1L)
                    .scanTaskId(42L)
                    .filePath(fixturePath)
                    .content("fixture mirror for Login source evidence")
                    .startLine(40)
                    .endLine(60)
                    .build();
            assertFalse(CodeChunkRanker.isExactLocationAnchorMatch(fixtureDecoy, question), fixturePath);
        }
        assertTrue(CodeChunkRanker.isExactLocationAnchorMatch(target, question));
    }

    @Test
    void isExactPathLocationAnchorMatch_shouldDistinguishRootPathFromPackageSuffix() {
        CodeChunk suffixDecoy = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("packages/admin/src/pages/Login.tsx")
                .content("admin login page")
                .startLine(40)
                .endLine(60)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(2L)
                .scanTaskId(42L)
                .filePath("src/pages/Login.tsx")
                .content("export function Login() { return <LoginForm />; }")
                .startLine(40)
                .endLine(60)
                .build();
        String question = "sourceUrl=https://github.com/acme/source-lens/blob/main/src/pages/Login.tsx#L44";

        assertTrue(CodeChunkRanker.isExactLocationAnchorMatch(suffixDecoy, question));
        assertFalse(CodeChunkRanker.isExactPathLocationAnchorMatch(suffixDecoy, question));
        assertTrue(CodeChunkRanker.isExactLocationAnchorMatch(target, question));
        assertTrue(CodeChunkRanker.isExactPathLocationAnchorMatch(target, question));
    }

    @Test
    void isExactPathLocationAnchorMatch_shouldRejectMixedEvidenceObjectPathLinePairing() {
        CodeChunk wrongLineSamePath = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("src/pages/Login.tsx")
                .content("export function Login() { return <LoginForm />; }")
                .startLine(40)
                .endLine(60)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(2L)
                .scanTaskId(42L)
                .filePath("src/pages/Login.tsx")
                .content("export function submitLogin() { return api.login(); }")
                .startLine(80)
                .endLine(100)
                .build();
        String question = """
                explain mixed evidence locations
                {
                  "items": [
                    {
                      "evidence": {
                        "filePath": "src/pages/Login.tsx",
                        "lineNumber": 90
                      }
                    },
                    {
                      "evidence": {
                        "filePath": "packages/admin/src/pages/Login.tsx",
                        "lineNumber": 44
                      }
                    }
                  ]
                }
                """;

        assertFalse(CodeChunkRanker.isExactPathLocationAnchorMatch(wrongLineSamePath, question));
        assertTrue(CodeChunkRanker.isExactPathLocationAnchorMatch(target, question));
    }

    @Test
    void isExactPathLocationAnchorMatch_shouldBindStructuredEvidencePathAndLineRange() {
        CodeChunk wrongRangeSamePath = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("src/pages/Login.tsx")
                .content("export function Login() { return <LoginForm />; }")
                .startLine(40)
                .endLine(60)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(2L)
                .scanTaskId(42L)
                .filePath("src/pages/Login.tsx")
                .content("export function submitLogin() { return api.login(); }")
                .startLine(80)
                .endLine(110)
                .build();
        String question = """
                explain mixed evidence range locations
                {
                  "items": [
                    {
                      "evidence": {
                        "filePath": "src/pages/Login.tsx",
                        "startLine": 85,
                        "endLine": 100
                      }
                    },
                    {
                      "evidence": {
                        "filePath": "packages/admin/src/pages/Login.tsx",
                        "startLine": 44,
                        "endLine": 50
                      }
                    }
                  ]
                }
                """;

        assertFalse(CodeChunkRanker.isExactPathLocationAnchorMatch(wrongRangeSamePath, question));
        assertTrue(CodeChunkRanker.isExactPathLocationAnchorMatch(target, question));
    }

    @Test
    void isExactLocationAnchorMatch_shouldRejectMiddleContainsQualifiedMethodFileHints() {
        CodeChunk noise = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("generated/com/acme/AuthService.java/metadata.ts")
                .content("generated metadata for AuthService validateToken")
                .startLine(10)
                .endLine(20)
                .build();

        assertFalse(CodeChunkRanker.isExactLocationAnchorMatch(
                noise,
                "com.acme.AuthService#validateToken line: 12"));
    }
}
