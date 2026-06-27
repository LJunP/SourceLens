package com.sourcelens.common.security;

import java.util.List;
import java.util.regex.Pattern;

/**
 * Centralized last-mile sanitizer for values that may be persisted, returned to the LLM, or shown in UI logs.
 */
public final class SensitiveDataSanitizer {

    private static final String MASK = "****";
    private static final String TRUNCATED_SUFFIX = "... [truncated]";
    private static final String SENSITIVE_KEY_NAME =
            "[A-Z0-9_-]*(?:TOKEN|SECRET|PASSWORD|PASSWD|API[_-]?KEY|ACCESS[_-]?KEY|PRIVATE[_-]?KEY|JWT)[A-Z0-9_-]*";
    private static final String AUTHORIZATION_SCHEME = "(?:bearer|basic|token)";

    private static final List<Replacement> REPLACEMENTS = List.of(
            new Replacement(Pattern.compile("-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----[\\s\\S]*?-----END [A-Z0-9 ]*PRIVATE KEY-----",
                    Pattern.CASE_INSENSITIVE),
                    MASK),
            new Replacement(Pattern.compile("(?i)((?:proxy-)?authorization\"?\\s*[:=]\\s*[\"']?"
                    + AUTHORIZATION_SCHEME + "\\s+)[^\"'\\s,}\\]]+"),
                    "$1" + MASK),
            new Replacement(Pattern.compile("(?i)\\b(ghp_|gho_|ghu_|ghs_|ghr_)[A-Za-z0-9_]{16,}\\b"),
                    "$1" + MASK),
            new Replacement(Pattern.compile("(?i)\\b(github_pat_)[A-Za-z0-9_]{16,}\\b"),
                    "$1" + MASK),
            new Replacement(Pattern.compile("(?i)\\bsk-[A-Za-z0-9_-]{12,}\\b"),
                    "sk-" + MASK),
            new Replacement(Pattern.compile("(?i)(\\b(?:jdbc:)?[a-z][a-z0-9+.-]*://[^\\s:/@\"']+:)[^\\s/@\"']+(@[^\\s\"'<>)}\\]]+)"),
                    "$1" + MASK + "$2"),
            new Replacement(Pattern.compile("(?i)(\"" + SENSITIVE_KEY_NAME + "\"\\s*:\\s*\")[^\"]*"),
                    "$1" + MASK),
            new Replacement(Pattern.compile("(?i)('" + SENSITIVE_KEY_NAME + "'\\s*:\\s*')[^']*"),
                    "$1" + MASK),
            new Replacement(Pattern.compile("(?i)(\"" + SENSITIVE_KEY_NAME + "\"\\s*:\\s*)(?![\"']|null\\b|true\\b|false\\b)[^,}\\]\\s]+"),
                    "$1" + MASK),
            new Replacement(Pattern.compile("(?i)(\\b" + SENSITIVE_KEY_NAME + "\\b\\s*[:=]\\s*\")[^\"]*"),
                    "$1" + MASK),
            new Replacement(Pattern.compile("(?i)(\\b" + SENSITIVE_KEY_NAME + "\\b\\s*[:=]\\s*')[^']*"),
                    "$1" + MASK),
            new Replacement(Pattern.compile("(?i)(\\b" + SENSITIVE_KEY_NAME + "\\b\\s*[:=]\\s*)[^\"'\\s,}\\]]+"),
                    "$1" + MASK)
    );

    private SensitiveDataSanitizer() {
    }

    public static String sanitize(String value) {
        if (value == null) {
            return null;
        }
        String sanitized = value;
        for (Replacement replacement : REPLACEMENTS) {
            sanitized = replacement.pattern().matcher(sanitized).replaceAll(replacement.replacement());
        }
        return sanitized;
    }

    public static String sanitizeAndTruncate(String value, int maxLength) {
        return truncate(sanitize(value), maxLength);
    }

    public static String truncate(String value, int maxLength) {
        if (value == null || maxLength <= 0 || value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength) + TRUNCATED_SUFFIX;
    }

    private record Replacement(Pattern pattern, String replacement) {
    }
}
