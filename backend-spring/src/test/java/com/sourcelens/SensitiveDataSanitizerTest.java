package com.sourcelens;

import com.sourcelens.common.security.SensitiveDataSanitizer;
import com.sourcelens.module.agent.tool.ToolResult;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SensitiveDataSanitizerTest {

    @Test
    void sanitize_shouldMaskCommonSecretFormats() {
        String raw = """
                Authorization: Bearer secret-bearer-token
                GITHUB_TOKEN=ghp_abcdefghijklmnopqrstuvwxyz123456
                api_key=sk-12345678abcdefghijklmnop
                password: super-secret
                -----BEGIN PRIVATE KEY-----
                private material
                -----END PRIVATE KEY-----
                """;

        String sanitized = SensitiveDataSanitizer.sanitize(raw);

        assertTrue(sanitized.contains("Bearer ****"));
        assertTrue(sanitized.contains("GITHUB_TOKEN=****"));
        assertTrue(sanitized.contains("api_key=****"));
        assertTrue(sanitized.contains("password: ****"));
        assertFalse(sanitized.contains("secret-bearer-token"));
        assertFalse(sanitized.contains("abcdefghijklmnopqrstuvwxyz123456"));
        assertFalse(sanitized.contains("12345678abcdefghijklmnop"));
        assertFalse(sanitized.contains("private material"));
    }

    @Test
    void sanitize_shouldMaskJsonCamelCaseAndQuotedSecretValues() {
        String raw = """
                {"githubToken":"ghp_abcdefghijklmnopqrstuvwxyz123456","openaiApiKey":"sk-proj-abcdefghijklmnopqrstuvwxyz123456","jwt":"eyJhbGciOiJIUzI1NiJ9.payload.signature"}
                password: "super secret with spaces"
                privateKey='-----BEGIN PRIVATE KEY-----\\nprivate material\\n-----END PRIVATE KEY-----'
                """;

        String sanitized = SensitiveDataSanitizer.sanitize(raw);

        assertTrue(sanitized.contains("\"githubToken\":\"****\""));
        assertTrue(sanitized.contains("\"openaiApiKey\":\"****\""));
        assertTrue(sanitized.contains("\"jwt\":\"****\""));
        assertTrue(sanitized.contains("password: \"****\""));
        assertTrue(sanitized.contains("privateKey='****'"));
        assertFalse(sanitized.contains("abcdefghijklmnopqrstuvwxyz123456"));
        assertFalse(sanitized.contains("sk-proj"));
        assertFalse(sanitized.contains("eyJhbGci"));
        assertFalse(sanitized.contains("super secret"));
        assertFalse(sanitized.contains("private material"));
    }

    @Test
    void sanitize_shouldMaskAdditionalAuthorizationSchemesAndUrlCredentials() {
        String raw = """
                Authorization: Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==
                Proxy-Authorization: token opaque-token-value
                DATABASE_URL=postgres://source:db-pass-123@db.example/source
                """;

        String sanitized = SensitiveDataSanitizer.sanitize(raw);

        assertTrue(sanitized.contains("Authorization: Basic ****"));
        assertTrue(sanitized.contains("Proxy-Authorization: token ****"));
        assertTrue(sanitized.contains("postgres://source:****@db.example/source"));
        assertFalse(sanitized.contains("QWxhZGRpbjpvcGVuIHNlc2FtZQ"));
        assertFalse(sanitized.contains("opaque-token-value"));
        assertFalse(sanitized.contains("db-pass-123"));
    }

    @Test
    void sanitize_shouldMaskPlainOpenAiKeysWithoutKeepingKeyMaterial() {
        String raw = """
                provider error sk-12345678abcdefghijklmnop
                fallback key sk-proj-abcdefghijklmnopqrstuvwxyz123456
                """;

        String sanitized = SensitiveDataSanitizer.sanitize(raw);

        assertTrue(sanitized.contains("sk-****"));
        assertFalse(sanitized.contains("12345678abcdefghijklmnop"));
        assertFalse(sanitized.contains("sk-proj"));
        assertFalse(sanitized.contains("abcdefghijklmnopqrstuvwxyz123456"));
    }

    @Test
    void toolResult_shouldSanitizeAndTruncateContentBeforeAgentSeesIt() {
        String raw = "token=github_pat_abcdefghijklmnopqrstuvwxyz1234567890 " + "x".repeat(ToolResult.MAX_CONTENT_LENGTH + 100);

        ToolResult result = ToolResult.ok(raw);

        assertFalse(result.getContent().contains("abcdefghijklmnopqrstuvwxyz1234567890"));
        assertTrue(result.getContent().contains("token=****"));
        assertTrue(result.getContent().endsWith("... [truncated]"));
    }
}
