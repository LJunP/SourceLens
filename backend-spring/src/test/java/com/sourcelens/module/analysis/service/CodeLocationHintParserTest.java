package com.sourcelens.module.analysis.service;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CodeLocationHintParserTest {

    @Test
    void parseLineHints_shouldIgnoreSourceUrlPortAndColumn() {
        List<CodeLocationHintParser.LineHint> hints = CodeLocationHintParser.parseLineHints(
                "http://localhost:5173/src/pages/ProjectDetail.tsx?t=1782991000000:245:19"
        );

        assertEquals(List.of(new CodeLocationHintParser.LineHint(245, 245)), hints);
    }

    @Test
    void parseLineHints_shouldSupportPathRangesWordHintsAndCjkHints() {
        List<CodeLocationHintParser.LineHint> pathRange = CodeLocationHintParser.parseLineHints(
                "src/main/java/com/example/AuthService.java:85:13-90:2"
        );
        List<CodeLocationHintParser.LineHint> wordAndCjk = CodeLocationHintParser.parseLineHints(
                "lines 10-12，第23行"
        );

        assertEquals(List.of(new CodeLocationHintParser.LineHint(85, 90)), pathRange);
        assertTrue(wordAndCjk.contains(new CodeLocationHintParser.LineHint(10, 12)));
        assertTrue(wordAndCjk.contains(new CodeLocationHintParser.LineHint(23, 23)));
    }

    @Test
    void parseLineHints_shouldNotTreatCjkLineCountAsLocationHint() {
        assertEquals(List.of(), CodeLocationHintParser.parseLineHints("生成 85 行代码"));
        assertEquals(List.of(), CodeLocationHintParser.parseLineHints("这个方法大概 85行代码"));
        assertEquals(List.of(new CodeLocationHintParser.LineHint(85, 85)), CodeLocationHintParser.parseLineHints("第85行"));
    }

    @Test
    void endpointRouteHints_shouldExtractApiRoutesWithoutTreatingSourcePathsAsRoutes() {
        assertEquals(List.of("/api/auth/login"), CodeLocationHintParser.endpointRouteHints("/api/auth/login"));
        assertEquals(List.of("/api/auth/login"), CodeLocationHintParser.endpointRouteHints("http://localhost:8080/api/auth/login?redirect=/dashboard"));
        assertEquals(List.of("/login"), CodeLocationHintParser.endpointRouteHints("login endpoint /login"));

        assertEquals(List.of(), CodeLocationHintParser.endpointRouteHints("http://localhost:5173/src/pages/ProjectDetail.tsx?t=1782991000000:245:19"));
        assertEquals(List.of(), CodeLocationHintParser.endpointRouteHints("/Users/lijunpeng/Desktop/cc/project/SourceLens"));
        assertEquals(List.of(), CodeLocationHintParser.endpointRouteHints("open /login directly"));
    }

    @Test
    void endpointHttpMethodHints_shouldExtractMethodsOnlyWhenRouteHintExists() {
        assertEquals(List.of("post"), CodeLocationHintParser.endpointHttpMethodHints("POST /api/auth/login"));
        assertEquals(List.of("get", "delete"), CodeLocationHintParser.endpointHttpMethodHints("GET or DELETE /api/users/42 endpoint"));

        assertEquals(List.of(), CodeLocationHintParser.endpointHttpMethodHints("get user account"));
        assertEquals(List.of(), CodeLocationHintParser.endpointHttpMethodHints("GET /login"));
        assertEquals(List.of(), CodeLocationHintParser.endpointHttpMethodHints("GET /src/pages/Login.tsx"));
        assertEquals(List.of(), CodeLocationHintParser.endpointHttpMethodHints("POST src/main/java/com/example/AuthController.java"));
    }

    @Test
    void parseLineHints_shouldSupportQuotedJsonLineNumberFields() {
        List<CodeLocationHintParser.LineHint> hints = CodeLocationHintParser.parseLineHints(
                """
                {
                  "line_number": 90,
                  "lineNumber": "120",
                  "line": "L23",
                  "start_line": 1
                }
                """
        );

        assertEquals(List.of(
                new CodeLocationHintParser.LineHint(90, 90),
                new CodeLocationHintParser.LineHint(120, 120),
                new CodeLocationHintParser.LineHint(23, 23)
        ), hints);
    }

    @Test
    void parseLineHints_shouldSupportCompactQuotedJsonLineNumberFields() {
        List<CodeLocationHintParser.LineHint> hints = CodeLocationHintParser.parseLineHints(
                "{\"file_path\":\"src/main/java/com/example/controller/RegisterController.java\",\"line_number\":90,\"lineNumber\":\"120\",\"line\":\"L23\",\"deadline\":999,\"outline_line\":777}"
        );

        assertEquals(List.of(
                new CodeLocationHintParser.LineHint(90, 90),
                new CodeLocationHintParser.LineHint(120, 120),
                new CodeLocationHintParser.LineHint(23, 23)
        ), hints);
    }

    @Test
    void parseLineHints_shouldSupportRawJsonStartEndLineRangeFields() {
        List<CodeLocationHintParser.LineHint> hints = CodeLocationHintParser.parseLineHints(
                """
                {
                  "file_path": "src/main/java/com/example/controller/RegisterController.java",
                  "start_line": 85,
                  "end_line": 120,
                  "startLine": "245",
                  "endLine": "250"
                }
                """
        );

        assertEquals(List.of(
                new CodeLocationHintParser.LineHint(85, 120),
                new CodeLocationHintParser.LineHint(245, 250)
        ), hints);
    }

    @Test
    void parseLineHints_shouldSupportCompactRawJsonStartEndLineRangeFields() {
        List<CodeLocationHintParser.LineHint> hints = CodeLocationHintParser.parseLineHints(
                "{\"file_path\":\"src/main/java/com/example/controller/RegisterController.java\",\"start_line\":85,\"end_line\":120,\"startLine\":\"245\",\"endLine\":\"250\"}"
        );

        assertEquals(List.of(
                new CodeLocationHintParser.LineHint(85, 120),
                new CodeLocationHintParser.LineHint(245, 250)
        ), hints);
    }

    @Test
    void parseLineHints_shouldSupportLineStartEndRangeAliases() {
        List<CodeLocationHintParser.LineHint> hints = CodeLocationHintParser.parseLineHints(
                "{\"file_path\":\"src/main/java/com/example/controller/RegisterController.java\",\"line_start\":85,\"line_end\":120,\"lineStart\":\"245\",\"lineEnd\":\"250\"}"
        );

        assertEquals(List.of(
                new CodeLocationHintParser.LineHint(85, 120),
                new CodeLocationHintParser.LineHint(245, 250)
        ), hints);
    }

    @Test
    void parseLineHints_shouldIgnoreUnpairedRawJsonStartOrEndLineFields() {
        List<CodeLocationHintParser.LineHint> hints = CodeLocationHintParser.parseLineHints(
                """
                {
                  "file_path": "src/main/java/com/example/controller/RegisterController.java",
                  "start_line": 85,
                  "other": "not a range"
                }
                """
        );

        assertEquals(List.of(), hints);
    }

    @Test
    void parseLineHints_shouldNotPairStartAndEndAcrossCompactJsonObjects() {
        List<CodeLocationHintParser.LineHint> hints = CodeLocationHintParser.parseLineHints(
                "{\"file_path\":\"src/main/java/com/example/controller/FirstController.java\",\"start_line\":85}" +
                        "{\"file_path\":\"src/main/java/com/example/controller/SecondController.java\",\"end_line\":120}"
        );

        assertEquals(List.of(), hints);
    }

    @Test
    void parseLineHints_shouldKeepSeparateCompactJsonObjectRanges() {
        List<CodeLocationHintParser.LineHint> hints = CodeLocationHintParser.parseLineHints(
                "{\"file_path\":\"src/main/java/com/example/controller/FirstController.java\",\"start_line\":85,\"end_line\":120}" +
                        "{\"file_path\":\"src/main/java/com/example/controller/SecondController.java\",\"start_line\":245,\"end_line\":250}"
        );

        assertEquals(List.of(
                new CodeLocationHintParser.LineHint(85, 120),
                new CodeLocationHintParser.LineHint(245, 250)
        ), hints);
    }

    @Test
    void evidenceLocationHints_shouldBindFilePathAndLineWithinSameCompactJsonObject() {
        List<CodeLocationHintParser.EvidenceLocationHint> hints = CodeLocationHintParser.evidenceLocationHints(
                "{\"file_path\":\"src/main/java/com/example/controller/FirstController.java\",\"line_number\":85}" +
                        "{\"file_path\":\"src/main/java/com/example/controller/SecondController.java\",\"start_line\":245,\"end_line\":250}"
        );

        assertEquals(List.of(
                new CodeLocationHintParser.EvidenceLocationHint(
                        "src/main/java/com/example/controller/FirstController.java",
                        new CodeLocationHintParser.LineHint(85, 85)
                ),
                new CodeLocationHintParser.EvidenceLocationHint(
                        "src/main/java/com/example/controller/SecondController.java",
                        new CodeLocationHintParser.LineHint(245, 250)
                )
        ), hints);
    }

    @Test
    void evidenceLocationHints_shouldNotBindFilePathAndLineAcrossCompactJsonObjects() {
        List<CodeLocationHintParser.EvidenceLocationHint> hints = CodeLocationHintParser.evidenceLocationHints(
                "{\"file_path\":\"src/main/java/com/example/controller/FirstController.java\"}" +
                        "{\"line_number\":85}"
        );

        assertEquals(List.of(), hints);
    }

    @Test
    void evidenceLocationHints_shouldPreferRangeOverLineNumberWithinSameCompactJsonObject() {
        List<CodeLocationHintParser.EvidenceLocationHint> hints = CodeLocationHintParser.evidenceLocationHints(
                "{\"file_path\":\"src/main/java/com/example/controller/RegisterController.java\",\"line_number\":12,\"start_line\":85,\"end_line\":120}"
        );

        assertEquals(List.of(new CodeLocationHintParser.EvidenceLocationHint(
                "src/main/java/com/example/controller/RegisterController.java",
                new CodeLocationHintParser.LineHint(85, 120)
        )), hints);
    }

    @Test
    void evidenceLocationHints_shouldBindLineStartEndAliasesWithinSameObject() {
        List<CodeLocationHintParser.EvidenceLocationHint> hints = CodeLocationHintParser.evidenceLocationHints(
                "{\"filePath\":\"src/main/java/com/example/controller/RegisterController.java\",\"lineStart\":85,\"lineEnd\":120}"
        );

        assertEquals(List.of(new CodeLocationHintParser.EvidenceLocationHint(
                "src/main/java/com/example/controller/RegisterController.java",
                new CodeLocationHintParser.LineHint(85, 120)
        )), hints);
    }

    @Test
    void evidenceLocationHints_shouldBindSourceFileAndPathAliasesWithinSameObject() {
        List<CodeLocationHintParser.EvidenceLocationHint> hints = CodeLocationHintParser.evidenceLocationHints(
                "{\"sourceFile\":\"src/main/java/com/example/controller/RegisterController.java\",\"line_number\":85}" +
                        "{\"source_file\":\"web-console/src/pages/ProjectDetail.tsx\",\"lineStart\":245,\"lineEnd\":250}" +
                        "{\"sourcePath\":\"src/main/java/com/example/service/RegisterService.java\",\"line_number\":34}" +
                        "{\"source_path\":\"src/main/java/com/example/mapper/RegisterMapper.java\",\"line\":12}" +
                        "{\"sourceUrl\":\"https://github.com/acme/source-lens/blob/main/src/main/java/com/example/repository/RegisterRepository.java#L44\",\"line\":44}" +
                        "{\"source_url\":\"https://raw.githubusercontent.com/acme/source-lens/main/src/main/java/com/example/domain/RegisterAccount.java#L67\",\"line_number\":67}"
        );

        assertEquals(List.of(
                new CodeLocationHintParser.EvidenceLocationHint(
                        "src/main/java/com/example/controller/RegisterController.java",
                        new CodeLocationHintParser.LineHint(85, 85)
                ),
                new CodeLocationHintParser.EvidenceLocationHint(
                        "web-console/src/pages/ProjectDetail.tsx",
                        new CodeLocationHintParser.LineHint(245, 250)
                ),
                new CodeLocationHintParser.EvidenceLocationHint(
                        "src/main/java/com/example/service/RegisterService.java",
                        new CodeLocationHintParser.LineHint(34, 34)
                ),
                new CodeLocationHintParser.EvidenceLocationHint(
                        "src/main/java/com/example/mapper/RegisterMapper.java",
                        new CodeLocationHintParser.LineHint(12, 12)
                ),
                new CodeLocationHintParser.EvidenceLocationHint(
                        "src/main/java/com/example/repository/RegisterRepository.java",
                        new CodeLocationHintParser.LineHint(44, 44)
                ),
                new CodeLocationHintParser.EvidenceLocationHint(
                        "src/main/java/com/example/domain/RegisterAccount.java",
                        new CodeLocationHintParser.LineHint(67, 67)
                )
        ), hints);
    }

    @Test
    void evidenceFilePathHints_shouldSupportSourceFileAndPathAliasesWithoutGenericPathField() {
        List<String> hints = CodeLocationHintParser.evidenceFilePathHints(
                """
                {
                  "source_file": "src/main/java/com/example/controller/RegisterController.java",
                  "sourceFile": "web-console/src/pages/ProjectDetail.tsx",
                  "source_path": "src/main/java/com/example/service/RegisterService.java",
                  "sourcePath": "src/main/java/com/example/mapper/RegisterMapper.java",
                  "source_url": "https://github.com/acme/source-lens/blob/main/src/main/java/com/example/repository/RegisterRepository.java#L44",
                  "sourceUrl": "https://raw.githubusercontent.com/acme/source-lens/main/src/main/java/com/example/domain/RegisterAccount.java#L67",
                  "path": "docs/not-an-evidence-anchor.md",
                  "url": "https://github.com/acme/source-lens/blob/main/docs/not-an-evidence-anchor.md"
                }
                """
        );

        assertEquals(List.of(
                "src/main/java/com/example/controller/RegisterController.java",
                "web-console/src/pages/ProjectDetail.tsx",
                "src/main/java/com/example/service/RegisterService.java",
                "src/main/java/com/example/mapper/RegisterMapper.java",
                "src/main/java/com/example/repository/RegisterRepository.java",
                "src/main/java/com/example/domain/RegisterAccount.java"
        ), hints);
    }

    @Test
    void normalizeEvidenceFilePathHint_shouldNormalizeHostedSourceUrlsOnlyWhenUrlHostMatches() {
        assertEquals(
                "web-console/src/pages/ProjectDetail.tsx",
                CodeLocationHintParser.normalizeEvidenceFilePathHint(
                        "https://github.com/acme/source-lens/blob/main/web-console/src/pages/ProjectDetail.tsx#L245"
                )
        );
        assertEquals(
                "web-console/src/pages/ProjectDetail.tsx",
                CodeLocationHintParser.normalizeEvidenceFilePathHint(
                        "https://github.com/acme/source-lens/blob/master/web-console/src/pages/ProjectDetail.tsx#L245"
                )
        );
        assertEquals(
                "web-console/src/pages/ProjectDetail.tsx",
                CodeLocationHintParser.normalizeEvidenceFilePathHint(
                        "https://gitlab.com/acme/source-lens/-/blob/main/web-console/src/pages/ProjectDetail.tsx#L245"
                )
        );
        assertEquals(
                "web-console/src/pages/ProjectDetail.tsx",
                CodeLocationHintParser.normalizeEvidenceFilePathHint(
                        "https://raw.githubusercontent.com/acme/source-lens/main/web-console/src/pages/ProjectDetail.tsx#L245"
                )
        );
    }

    @Test
    void normalizeEvidenceFilePathHint_shouldNormalizeHostedSourceUrlsWithNestedBranchNames() {
        assertEquals(
                "web-console/src/pages/ProjectDetail.tsx",
                CodeLocationHintParser.normalizeEvidenceFilePathHint(
                        "https://github.com/acme/source-lens/blob/feature/code-review/web-console/src/pages/ProjectDetail.tsx#L245"
                )
        );
        assertEquals(
                "backend-spring/src/main/java/com/example/AuthService.java",
                CodeLocationHintParser.normalizeEvidenceFilePathHint(
                        "https://gitlab.com/acme/source-lens/-/blob/release/2026/q3/backend-spring/src/main/java/com/example/AuthService.java#L88"
                )
        );
        assertEquals(
                "src/main/java/com/example/AuthService.java",
                CodeLocationHintParser.normalizeEvidenceFilePathHint(
                        "https://raw.githubusercontent.com/acme/source-lens/feature/code-review/src/main/java/com/example/AuthService.java#L88"
                )
        );
    }

    @Test
    void normalizeEvidenceFilePathHint_shouldPreferStrongProjectRootWhenNestedBranchContainsGenericRoot() {
        assertEquals(
                "web-console/src/pages/ProjectDetail.tsx",
                CodeLocationHintParser.normalizeEvidenceFilePathHint(
                        "https://github.com/acme/source-lens/blob/feature/src/preview/web-console/src/pages/ProjectDetail.tsx#L245"
                )
        );
        assertEquals(
                "backend-spring/src/main/java/com/example/AuthService.java",
                CodeLocationHintParser.normalizeEvidenceFilePathHint(
                        "https://gitlab.com/acme/source-lens/-/blob/feature/docs/review/backend-spring/src/main/java/com/example/AuthService.java#L88"
                )
        );
    }

    @Test
    void normalizeEvidenceFilePathHint_shouldKeepAppRootWhenNestedBranchContainsSrc() {
        assertEquals(
                "app/src/pages/Login.tsx",
                CodeLocationHintParser.normalizeEvidenceFilePathHint(
                        "https://github.com/acme/source-lens/blob/feature/src-preview/app/src/pages/Login.tsx#L44"
                )
        );
    }

    @Test
    void normalizeEvidenceFilePathHint_shouldNotTreatFirstAppLikeBranchSegmentAsSourceRoot() {
        assertEquals(
                "src/pages/Login.tsx",
                CodeLocationHintParser.normalizeEvidenceFilePathHint(
                        "https://github.com/acme/source-lens/blob/feature/app/src/pages/Login.tsx#L44"
                )
        );
    }

    @Test
    void normalizeEvidenceFilePathHint_shouldPreferAppsContainerOverNestedClientRoot() {
        assertEquals(
                "apps/client/src/pages/Login.tsx",
                CodeLocationHintParser.normalizeEvidenceFilePathHint(
                        "https://github.com/acme/source-lens/blob/feature/ui/apps/client/src/pages/Login.tsx#L44"
                )
        );
    }

    @Test
    void normalizeEvidenceFilePathHint_shouldConservativelyDowngradeSingleBranchAppsContainerAmbiguity() {
        assertEquals(
                "client/src/pages/Login.tsx",
                CodeLocationHintParser.normalizeEvidenceFilePathHint(
                        "https://github.com/acme/source-lens/blob/feature/apps/client/src/pages/Login.tsx#L44"
                )
        );
    }

    @Test
    void normalizeEvidenceFilePathHint_shouldConservativelyDowngradeSingleBranchStrongRootAmbiguity() {
        assertEquals(
                "src/index.ts",
                CodeLocationHintParser.normalizeEvidenceFilePathHint(
                        "https://github.com/acme/source-lens/blob/feature/web-console/src/index.ts#L44"
                )
        );
    }

    @Test
    void normalizeEvidenceFilePathHint_shouldNotStripBranchLikeSegmentsFromRelativePaths() {
        String relativePath = "modules/auth/main/web-console/src/pages/ProjectDetail.tsx";
        String relativeBlobPath = "modules/auth/blob/main/web-console/src/pages/ProjectDetail.tsx";

        assertEquals(relativePath, CodeLocationHintParser.normalizeEvidenceFilePathHint(relativePath));
        assertEquals(relativePath, CodeLocationHintParser.normalizePathSuffixHint(relativePath));
        assertEquals(relativeBlobPath, CodeLocationHintParser.normalizeEvidenceFilePathHint(relativeBlobPath));
        assertEquals(relativeBlobPath, CodeLocationHintParser.normalizePathSuffixHint(relativeBlobPath));
    }

    @Test
    void normalizeEvidenceFilePathHint_shouldNotUseHostedBranchRulesForUnknownUrlHosts() {
        String normalized = CodeLocationHintParser.normalizeEvidenceFilePathHint(
                "https://example.com/acme/source-lens/blob/main/web-console/src/pages/ProjectDetail.tsx#L245"
        );

        assertEquals("acme/source-lens/blob/main/web-console/src/pages/ProjectDetail.tsx", normalized);
    }

    @Test
    void evidenceLocationHints_shouldParseNestedAndArrayJsonEvidenceObjects() {
        List<CodeLocationHintParser.EvidenceLocationHint> hints = CodeLocationHintParser.evidenceLocationHints(
                """
                report:
                {
                  "items": [
                    {
                      "file_path": "src/main/java/com/example/controller/RegisterController.java",
                      "start_line": 85,
                      "end_line": 120
                    },
                    {
                      "evidence": {
                        "filePath": "web-console/src/pages/ProjectDetail.tsx?t=1782991000000:245:19",
                        "lineNumber": "245"
                      }
                    }
                  ]
                }
                """
        );

        assertEquals(List.of(
                new CodeLocationHintParser.EvidenceLocationHint(
                        "src/main/java/com/example/controller/RegisterController.java",
                        new CodeLocationHintParser.LineHint(85, 120)
                ),
                new CodeLocationHintParser.EvidenceLocationHint(
                        "web-console/src/pages/ProjectDetail.tsx",
                        new CodeLocationHintParser.LineHint(245, 245)
                )
        ), hints);
    }

    @Test
    void evidenceLocationHints_shouldNotBindParentPathToNestedLine() {
        List<CodeLocationHintParser.EvidenceLocationHint> hints = CodeLocationHintParser.evidenceLocationHints(
                """
                {
                  "file_path": "src/main/java/com/example/controller/RegisterController.java",
                  "details": {
                    "line_number": 85
                  }
                }
                """
        );

        assertEquals(List.of(), hints);
    }

    @Test
    void evidenceLocationHints_shouldFallbackToFlatObjectParserForMalformedJson() {
        List<CodeLocationHintParser.EvidenceLocationHint> hints = CodeLocationHintParser.evidenceLocationHints(
                "{\"file_path\":\"src/main/java/com/example/controller/RegisterController.java\",\"line_number\":85,}"
        );

        assertEquals(List.of(new CodeLocationHintParser.EvidenceLocationHint(
                "src/main/java/com/example/controller/RegisterController.java",
                new CodeLocationHintParser.LineHint(85, 85)
        )), hints);
    }

    @Test
    void stripLocationHintsForTokenization_shouldRemoveRawJsonStartEndLineRangeNoise() {
        String stripped = CodeLocationHintParser.stripLocationHintsForTokenization(
                """
                {
                  "file_path": "src/main/java/com/example/controller/RegisterController.java",
                  "start_line": 85,
                  "end_line": 120
                }
                """
        );

        assertTrue(stripped.contains("RegisterController.java"));
        assertFalse(stripped.contains("start_line"));
        assertFalse(stripped.contains("end_line"));
        assertFalse(stripped.contains(": 85"));
        assertFalse(stripped.contains(": 120"));
    }

    @Test
    void stripLocationHintsForTokenization_shouldRemoveCompactRawJsonStartEndLineRangeNoise() {
        String stripped = CodeLocationHintParser.stripLocationHintsForTokenization(
                "{\"file_path\":\"src/main/java/com/example/controller/RegisterController.java\",\"start_line\":85,\"end_line\":120}"
        );

        assertTrue(stripped.contains("RegisterController.java"));
        assertFalse(stripped.contains("start_line"));
        assertFalse(stripped.contains("end_line"));
        assertFalse(stripped.contains(":85"));
        assertFalse(stripped.contains(":120"));
    }

    @Test
    void stripLocationHintsForTokenization_shouldRemoveLineStartEndAliasNoise() {
        String stripped = CodeLocationHintParser.stripLocationHintsForTokenization(
                "{\"file_path\":\"src/main/java/com/example/controller/RegisterController.java\",\"line_start\":85,\"line_end\":120,\"lineStart\":\"245\",\"lineEnd\":\"250\"}"
        );

        assertTrue(stripped.contains("RegisterController.java"));
        assertFalse(stripped.contains("line_start"));
        assertFalse(stripped.contains("line_end"));
        assertFalse(stripped.contains("lineStart"));
        assertFalse(stripped.contains("lineEnd"));
        assertFalse(stripped.contains(":85"));
        assertFalse(stripped.contains(":120"));
        assertFalse(stripped.contains(":\"245\""));
        assertFalse(stripped.contains(":\"250\""));
    }

    @Test
    void stripLocationHintsForTokenization_shouldRemoveCompactRawJsonLineNumberNoise() {
        String stripped = CodeLocationHintParser.stripLocationHintsForTokenization(
                "{\"file_path\":\"src/main/java/com/example/controller/RegisterController.java\",\"line_number\":90,\"lineNumber\":\"120\",\"line\":\"L23\"}"
        );

        assertTrue(stripped.contains("RegisterController.java"));
        assertFalse(stripped.contains("line_number"));
        assertFalse(stripped.contains("lineNumber"));
        assertFalse(stripped.contains("\"line\""));
        assertFalse(stripped.contains(":90"));
        assertFalse(stripped.contains(":\"120\""));
        assertFalse(stripped.contains(":\"L23\""));
    }

    @Test
    void stripLocationHintsForTokenization_shouldRemoveViteQueryLineAndColumnNoise() {
        String stripped = CodeLocationHintParser.stripLocationHintsForTokenization(
                "http://localhost:5173/src/pages/ProjectDetail.tsx?t=1782991000000:245:19"
        );

        assertTrue(stripped.contains("ProjectDetail.tsx"));
        assertFalse(stripped.contains("5173"));
        assertFalse(stripped.contains("1782991000000"));
        assertFalse(stripped.contains(":245"));
        assertFalse(stripped.contains(":19"));
        assertFalse(stripped.contains("?t="));
    }

    @Test
    void parse_shouldExtractMethodFunctionAndStackFileHints() {
        CodeLocationHintParser.CodeLocationHints hints = CodeLocationHintParser.parse(
                "AuthStore#fetchUser\n" +
                        "AuthStore::bootstrap\n" +
                        "at fetchUser (http://localhost:5173/src/stores/auth-store.ts:85:13)\n" +
                        "AuthStore.fetchUser@https://app.example.com/assets/auth-store.ts?t=1782991000000:85:13\n" +
                        "at Object.<anonymous> (webpack://source-lens/./web-console/src/stores/auth-store.ts:85:13)"
        );

        assertTrue(hints.methodHints().contains(new CodeLocationHintParser.MethodHint("AuthStore", "authstore", "fetchuser")));
        assertTrue(hints.methodHints().contains(new CodeLocationHintParser.MethodHint("AuthStore", "authstore", "bootstrap")));
        assertTrue(hints.functionFileHints().contains(new CodeLocationHintParser.FunctionFileHint("auth-store.ts", "fetchuser")));
        assertTrue(hints.stackFileHints().contains("auth-store.ts"));
    }

    @Test
    void parse_shouldExtractJsonHandlerClassMethodHints() {
        CodeLocationHintParser.CodeLocationHints hints = CodeLocationHintParser.parse(
                """
                {
                  "handler_class": "com.acme.billing.controller.PaymentController",
                  "handler_method": "createPayment",
                  "line_number": 90
                }
                """
        );

        assertTrue(hints.methodHints().contains(new CodeLocationHintParser.MethodHint(
                "com.acme.billing.controller.PaymentController",
                "paymentcontroller",
                "createpayment"
        )));
        assertTrue(CodeLocationHintParser.methodAnchorFileHints(
                """
                {
                  "handler_class": "com.acme.billing.controller.PaymentController",
                  "handler_method": "createPayment"
                }
                """
        ).contains("com/acme/billing/controller/PaymentController.java"));
    }

    @Test
    void parse_shouldExtractCompactJsonHandlerClassMethodHints() {
        CodeLocationHintParser.CodeLocationHints hints = CodeLocationHintParser.parse(
                "{\"handler_class\":\"com.acme.billing.controller.PaymentController\",\"handler_method\":\"createPayment\",\"line_number\":90}"
        );

        assertTrue(hints.methodHints().contains(new CodeLocationHintParser.MethodHint(
                "com.acme.billing.controller.PaymentController",
                "paymentcontroller",
                "createpayment"
        )));
        assertTrue(CodeLocationHintParser.methodAnchorFileHints(
                "{\"handler_class\":\"com.acme.billing.controller.PaymentController\",\"handler_method\":\"createPayment\"}"
        ).contains("com/acme/billing/controller/PaymentController.java"));
    }

    @Test
    void parse_shouldExtractCompactJsonHandlerClassMethodHintsWhenMethodComesFirst() {
        CodeLocationHintParser.CodeLocationHints hints = CodeLocationHintParser.parse(
                "{\"handler_method\":\"createPayment\",\"handler_class\":\"com.acme.billing.controller.PaymentController\"}"
        );

        assertTrue(hints.methodHints().contains(new CodeLocationHintParser.MethodHint(
                "com.acme.billing.controller.PaymentController",
                "paymentcontroller",
                "createpayment"
        )));
    }

    @Test
    void parse_shouldExtractNestedArrayJsonHandlerClassMethodHints() {
        CodeLocationHintParser.CodeLocationHints hints = CodeLocationHintParser.parse(
                """
                {
                  "items": [
                    {
                      "evidence": {
                        "handler_class": "com.acme.billing.controller.PaymentController",
                        "handler_method": "createPayment"
                      }
                    }
                  ]
                }
                """
        );

        assertTrue(hints.methodHints().contains(new CodeLocationHintParser.MethodHint(
                "com.acme.billing.controller.PaymentController",
                "paymentcontroller",
                "createpayment"
        )));
        assertTrue(CodeLocationHintParser.methodAnchorFileHints(
                """
                {
                  "items": [
                    {
                      "evidence": {
                        "handler_class": "com.acme.billing.controller.PaymentController",
                        "handler_method": "createPayment"
                      }
                    }
                  ]
                }
                """
        ).contains("com/acme/billing/controller/PaymentController.java"));
    }

    @Test
    void parse_shouldUseStructuredJsonHandlerParserWhenSiblingObjectBreaksLegacyPairing() {
        CodeLocationHintParser.CodeLocationHints hints = CodeLocationHintParser.parse(
                """
                {
                  "handler_class": "com.acme.billing.controller.PaymentController",
                  "metadata": {
                    "source": "report"
                  },
                  "handler_method": "createPayment"
                }
                """
        );

        assertTrue(hints.methodHints().contains(new CodeLocationHintParser.MethodHint(
                "com.acme.billing.controller.PaymentController",
                "paymentcontroller",
                "createpayment"
        )));
    }

    @Test
    void parse_shouldNotPairCompactJsonHandlerFieldsAcrossObjects() {
        CodeLocationHintParser.CodeLocationHints hints = CodeLocationHintParser.parse(
                "{\"handler_class\":\"com.acme.billing.controller.PaymentController\"}" +
                        "{\"handler_method\":\"createPayment\"}"
        );

        assertFalse(hints.methodHints().contains(new CodeLocationHintParser.MethodHint(
                "com.acme.billing.controller.PaymentController",
                "paymentcontroller",
                "createpayment"
        )));
    }

    @Test
    void parse_shouldNotPairParentHandlerClassToNestedHandlerMethod() {
        CodeLocationHintParser.CodeLocationHints hints = CodeLocationHintParser.parse(
                """
                {
                  "handler_class": "com.acme.billing.controller.PaymentController",
                  "details": {
                    "handler_method": "createPayment"
                  }
                }
                """
        );

        assertFalse(hints.methodHints().contains(new CodeLocationHintParser.MethodHint(
                "com.acme.billing.controller.PaymentController",
                "paymentcontroller",
                "createpayment"
        )));
    }

    @Test
    void parse_shouldFallbackToCompactHandlerParserForMalformedJson() {
        CodeLocationHintParser.CodeLocationHints hints = CodeLocationHintParser.parse(
                "{\"handler_class\":\"com.acme.billing.controller.PaymentController\",\"handler_method\":\"createPayment\",}"
        );

        assertTrue(hints.methodHints().contains(new CodeLocationHintParser.MethodHint(
                "com.acme.billing.controller.PaymentController",
                "paymentcontroller",
                "createpayment"
        )));
    }

    @Test
    void parse_shouldRejectUnsafeCompactJsonHandlerValues() {
        String query = """
                {"handler_class":"com.acme..PaymentController","handler_method":"createPayment"}
                {"handler_class":"../PaymentController","handler_method":"createPayment"}
                {"handler_class":"com.acme.billing.controller.PaymentController","handler_method":"create.Payment"}
                {"handlerClass":"com.acme.billing.controller.PaymentController","handler_method":"createPayment"}
                """;

        CodeLocationHintParser.CodeLocationHints hints = CodeLocationHintParser.parse(query);

        assertFalse(hints.methodHints().contains(new CodeLocationHintParser.MethodHint(
                "com.acme.billing.controller.PaymentController",
                "paymentcontroller",
                "createpayment"
        )));
    }

    @Test
    void parse_shouldExtractSafariFunctionAtSourceUrlStackFrames() {
        CodeLocationHintParser.CodeLocationHints hints = CodeLocationHintParser.parse(
                "TypeError: session expired\n" +
                        "AuthStore.fetchUser@https://app.example.com/assets/auth-store.ts?t=1782991000000:85:13\n" +
                        "bootstrap@webpack://source-lens/./web-console/src/stores/auth-store.ts:12:5"
        );

        assertTrue(hints.functionFileHints().contains(new CodeLocationHintParser.FunctionFileHint("auth-store.ts", "fetchuser")));
        assertTrue(hints.functionFileHints().contains(new CodeLocationHintParser.FunctionFileHint("auth-store.ts", "bootstrap")));
        assertTrue(hints.stackFileHints().contains("auth-store.ts"));
        assertTrue(hints.pathSuffixHints().contains("assets/auth-store.ts"));
        assertTrue(hints.pathSuffixHints().contains("auth-store.ts"));
        assertFalse(hints.pathSuffixHints().stream().anyMatch(hint -> hint.contains("app.example.com")));
        assertFalse(hints.pathSuffixHints().stream().anyMatch(hint -> hint.contains("?t=")));
    }

    @Test
    void methodAnchorFileHints_shouldKeepClassNameVariantsAndCompactStackFileName() {
        List<String> hints = CodeLocationHintParser.methodAnchorFileHints(
                "AuthStore.fetchUser(auth-store.ts:85:13)"
        );

        assertTrue(hints.contains("AuthStore.ts"));
        assertTrue(hints.contains("auth-store.ts"));
        assertTrue(hints.contains("auth_store.ts"));
        assertTrue(hints.contains("authstore.ts"));
    }

    @Test
    void methodAnchorFileHints_shouldIncludeSafariFunctionAtStackFrameFileNames() {
        List<String> hints = CodeLocationHintParser.methodAnchorFileHints(
                "AuthStore.fetchUser@https://app.example.com/assets/auth-store.ts?t=1782991000000:85:13"
        );

        assertTrue(hints.contains("auth-store.ts"));
        assertTrue(hints.contains("authstore.ts"));
    }

    @Test
    void methodAnchorFileHints_shouldKeepQualifiedPackagePathVariants() {
        List<String> hints = CodeLocationHintParser.methodAnchorFileHints(
                "at com.acme.billing.service.AuthService.validateJwt(AuthService.java:85)"
        );

        assertTrue(hints.contains("com/acme/billing/service/AuthService.java"));
        assertTrue(hints.contains("acme/billing/service/AuthService.java"));
        assertTrue(hints.contains("billing/service/AuthService.java"));
        assertTrue(hints.contains("service/AuthService.java"));
        assertTrue(hints.contains("AuthService.java"));
        assertTrue(hints.contains("authservice"));
    }

    @Test
    void evidenceFilePathHints_shouldNormalizeQuotesDotsLineSuffixAndSourceUrlQuery() {
        List<String> hints = CodeLocationHintParser.evidenceFilePathHints(
                "filePath: `./web-console/src/pages/ProjectDetail.tsx?t=1782991000000:245:19`,\n" +
                        "filePath: \"src/main/java/com/example/AuthService.java#L85\""
        );

        assertEquals(List.of(
                "web-console/src/pages/ProjectDetail.tsx",
                "src/main/java/com/example/AuthService.java"
        ), hints);
    }

    @Test
    void evidenceFilePathHints_shouldSupportSnakeCaseReportEvidenceField() {
        List<String> hints = CodeLocationHintParser.evidenceFilePathHints(
                "file_path: './src/main/java/com/example/controller/RegisterController.java#L90'"
        );

        assertEquals(List.of("src/main/java/com/example/controller/RegisterController.java"), hints);
    }

    @Test
    void evidenceFilePathHints_shouldSupportQuotedJsonReportEvidenceFields() {
        List<String> hints = CodeLocationHintParser.evidenceFilePathHints(
                """
                {
                  "file_path": "./src/main/java/com/example/controller/RegisterController.java#L90",
                  "filePath": "web-console/src/pages/ProjectDetail.tsx?t=1782991000000:245:19",
                  "path": "docs/not-an-evidence-anchor.md"
                }
                """
        );

        assertEquals(List.of(
                "src/main/java/com/example/controller/RegisterController.java",
                "web-console/src/pages/ProjectDetail.tsx"
        ), hints);
    }

    @Test
    void evidenceFilePathHints_shouldSupportCompactQuotedJsonReportEvidenceFields() {
        List<String> hints = CodeLocationHintParser.evidenceFilePathHints(
                "{\"file_path\":\"./src/main/java/com/example/controller/RegisterController.java#L90\",\"filePath\":\"web-console/src/pages/ProjectDetail.tsx?t=1782991000000:245:19\",\"path\":\"docs/not-an-evidence-anchor.md\"}"
        );

        assertEquals(List.of(
                "src/main/java/com/example/controller/RegisterController.java",
                "web-console/src/pages/ProjectDetail.tsx"
        ), hints);
    }

    @Test
    void evidenceFilePathHints_shouldStripFullSourceUrlHostPortQueryAndLine() {
        List<String> hints = CodeLocationHintParser.evidenceFilePathHints(
                "filePath: http://localhost:5173/src/pages/ProjectDetail.tsx?t=1782991000000:245:19"
        );

        assertEquals(List.of("src/pages/ProjectDetail.tsx"), hints);
    }

    @Test
    void pathSuffixHints_shouldNormalizeSourceUrlsWithoutHostQueryOrLineNoise() {
        List<String> hints = CodeLocationHintParser.pathSuffixHints(
                "TypeError: failed to submit\n" +
                        "at submitQa (http://localhost:5173/src/pages/ProjectDetail.tsx?t=1782991000000:245:19)\n" +
                        "at Object.<anonymous> (webpack://source-lens/./web-console/src/stores/auth-store.ts:85:13)"
        );

        assertTrue(hints.contains("src/pages/ProjectDetail.tsx"));
        assertTrue(hints.contains("pages/ProjectDetail.tsx"));
        assertTrue(hints.contains("ProjectDetail.tsx"));
        assertTrue(hints.contains("web-console/src/stores/auth-store.ts"));
        assertTrue(hints.contains("src/stores/auth-store.ts"));
        assertFalse(hints.stream().anyMatch(hint -> hint.contains("localhost")));
        assertFalse(hints.stream().anyMatch(hint -> hint.contains("?t=")));
        assertFalse(hints.stream().anyMatch(hint -> hint.contains("1782991000000")));
        assertFalse(hints.stream().anyMatch(hint -> hint.contains(":245")));
    }

    @Test
    void pathSuffixHints_shouldNormalizeHostedMarkdownUrlsForEvidenceDocs() {
        List<String> hints = CodeLocationHintParser.pathSuffixHints(
                "查看治理说明 https://github.com/acme/source-lens/blob/feature/docs/review/docs/CHAIRMAN_BRIEFING.md#L20"
        );

        assertTrue(hints.contains("docs/CHAIRMAN_BRIEFING.md"));
        assertTrue(hints.contains("CHAIRMAN_BRIEFING.md"));
        assertFalse(hints.stream().anyMatch(hint -> hint.contains("github.com")));
        assertFalse(hints.stream().anyMatch(hint -> hint.contains("feature/docs/review")));
        assertFalse(hints.stream().anyMatch(hint -> hint.contains("#L20")));
    }

    @Test
    void pathSuffixHints_shouldCoverIndexedScriptStyleAndNativeFileExtensions() {
        List<String> hints = CodeLocationHintParser.pathSuffixHints(
                "检查脚本和样式：\n" +
                        "https://github.com/acme/source-lens/blob/feature/release/scripts/run-backend-dev.sh#L12\n" +
                        "web-console/src/styles/app.scss:40\n" +
                        "analyzer-rust/src/parser.cpp:18\n" +
                        "backend-spring/src/main/kotlin/com/acme/App.kts:7"
        );

        assertTrue(hints.contains("scripts/run-backend-dev.sh"));
        assertTrue(hints.contains("run-backend-dev.sh"));
        assertTrue(hints.contains("web-console/src/styles/app.scss"));
        assertTrue(hints.contains("src/styles/app.scss"));
        assertTrue(hints.contains("analyzer-rust/src/parser.cpp"));
        assertTrue(hints.contains("src/parser.cpp"));
        assertTrue(hints.contains("backend-spring/src/main/kotlin/com/acme/App.kts"));
        assertTrue(hints.contains("App.kts"));
        assertFalse(hints.stream().anyMatch(hint -> hint.contains("github.com")));
        assertFalse(hints.stream().anyMatch(hint -> hint.contains("#L12")));
    }

    @Test
    void pathSuffixHints_shouldNotTreatUnindexedJsonAsIndexedPathHint() {
        List<String> hints = CodeLocationHintParser.pathSuffixHints(
                "配置文件 package.json 和 web-console/tsconfig.json 暂不作为 code_chunks 强路径证据"
        );

        assertFalse(hints.contains("package.json"));
        assertFalse(hints.contains("web-console/tsconfig.json"));
        assertFalse(hints.contains("tsconfig.json"));
    }

    @Test
    void pathSuffixHints_shouldNotTruncateUnknownLongerExtensions() {
        List<String> hints = CodeLocationHintParser.pathSuffixHints(
                "忽略模板和备份路径：web-console/src/template.hbs docs/schema.jsonnet analyzer-rust/src/parser.cppbackup"
        );

        assertFalse(hints.contains("web-console/src/template.h"));
        assertFalse(hints.contains("template.h"));
        assertFalse(hints.contains("docs/schema.json"));
        assertFalse(hints.contains("schema.json"));
        assertFalse(hints.contains("analyzer-rust/src/parser.cpp"));
        assertFalse(hints.contains("parser.cpp"));
    }

    @Test
    void moduleRootHints_shouldExtractMonorepoRootsFromFieldsAndHostedUrls() {
        List<String> hints = CodeLocationHintParser.moduleRootHints(
                """
                sourceRoot: packages/admin
                sourceUrl: https://github.com/acme/source-lens/blob/feature/apps/client/src/pages/Login.tsx#L44
                filePath: services/billing/src/main/java/com/acme/BillingService.java
                ignore node_modules/react and package.json
                """
        );

        assertTrue(hints.contains("packages/admin"));
        assertTrue(hints.contains("apps/client"));
        assertTrue(hints.contains("services/billing"));
        assertFalse(hints.contains("modules/react"));
        assertFalse(hints.contains("package.json"));
    }

    @Test
    void sourceRootHints_shouldExtractStrongAndMonorepoRootMetadata() {
        List<String> hints = CodeLocationHintParser.sourceRootHints(
                """
                sourceRoot: web-console
                workspace_root: "packages/admin"
                moduleRoot: services/billing
                sourceRoot: src
                sourceRoot: ../bad
                """
        );

        assertTrue(hints.contains("web-console"));
        assertTrue(hints.contains("packages/admin"));
        assertTrue(hints.contains("services/billing"));
        assertFalse(hints.contains("src"));
        assertFalse(hints.contains("../bad"));
    }

    @Test
    void hasCodeLocationHint_shouldDetectLocationInputsWithoutClaimingPlainQuestions() {
        assertTrue(CodeLocationHintParser.hasCodeLocationHint("src/AuthService.java:85"));
        assertTrue(CodeLocationHintParser.hasCodeLocationHint("at AuthService.validate(AuthService.java:85)"));
        assertTrue(CodeLocationHintParser.hasCodeLocationHint("fetchUser@https://app.example.com/assets/auth-store.ts:85:13"));
        assertFalse(CodeLocationHintParser.hasCodeLocationHint("where is the login endpoint"));
    }
}
