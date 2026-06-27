package com.sourcelens.module.analysis.service;

import com.sourcelens.module.analysis.entity.CodeChunk;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Stream;

public final class CodeChunkRanker {

    private static final int TOKEN_LIMIT = 12;
    private static final Set<String> IDENTIFIER_NOISE_TOKENS = Set.of("com", "org", "net");

    private CodeChunkRanker() {
    }

    public static List<CodeChunk> rank(List<CodeChunk> chunks, String queryText, int limit) {
        if (chunks == null || chunks.isEmpty() || limit <= 0) {
            return List.of();
        }
        String[] keywords = tokenize(queryText);
        if (keywords.length == 0) {
            return chunks.stream()
                    .limit(limit)
                    .toList();
        }
        return chunks.stream()
                .map(chunk -> new ScoredChunk(chunk, score(chunk, keywords)))
                .sorted(Comparator
                        .comparingDouble(ScoredChunk::score).reversed()
                        .thenComparing(scored -> safeLower(scored.chunk().getFilePath()))
                        .thenComparingInt(scored -> scored.chunk().getStartLine() == null ? Integer.MAX_VALUE : scored.chunk().getStartLine()))
                .limit(limit)
                .map(ScoredChunk::chunk)
                .toList();
    }

    public static double score(CodeChunk chunk, String queryText) {
        return score(chunk, tokenize(queryText));
    }

    public static int relevanceScore(CodeChunk chunk, String queryText) {
        return (int) Math.min(100, Math.round(score(chunk, queryText)));
    }

    public static String evidenceType(CodeChunk chunk) {
        String path = normalizedPath(chunk == null ? "" : chunk.getFilePath());
        String fileName = fileName(path);
        String content = safeLower(chunk == null ? "" : chunk.getContent());
        if (path.contains("/controller/") || fileName.contains("controller") || content.contains("@restcontroller")) {
            return "CONTROLLER";
        }
        if (path.contains("/service/") || fileName.contains("service") || content.contains("@service")) {
            return "SERVICE";
        }
        if (path.contains("/repository/")
                || path.contains("/mapper/")
                || path.contains("/dao/")
                || fileName.contains("repository")
                || fileName.contains("mapper")
                || fileName.contains("dao")
                || content.contains("@repository")) {
            return "DATA_ACCESS";
        }
        if (path.contains("/entity/")
                || path.contains("/model/")
                || fileName.contains("entity")
                || fileName.contains("model")
                || content.contains("@table")
                || content.contains("@tablename")) {
            return "DOMAIN_MODEL";
        }
        if (path.endsWith(".vue") || path.endsWith(".tsx") || path.endsWith(".jsx") || path.contains("/components/") || path.contains("/views/")) {
            return "FRONTEND";
        }
        if (path.contains("/test/") || fileName.contains("test") || fileName.contains("spec")) {
            return "TEST";
        }
        if (isDocsOrBuildFile(path)) {
            return "DOCUMENTATION";
        }
        if (path.endsWith(".yml") || path.endsWith(".yaml") || path.endsWith(".properties") || path.endsWith(".json") || path.endsWith(".xml")) {
            return "CONFIG";
        }
        if (isSourceFile(path)) {
            return "SOURCE";
        }
        return "OTHER";
    }

    public static String evidenceReason(CodeChunk chunk, String queryText) {
        String[] keywords = tokenize(queryText);
        String relevance = relevanceLabel(relevanceScore(chunk, queryText), keywords.length == 0);
        String type = evidenceTypeLabel(evidenceType(chunk));
        List<String> matchedTerms = matchedTerms(chunk, queryText);
        String match = matchedTerms.isEmpty()
                ? "路径或结构信号"
                : "命中 " + String.join(" / ", matchedTerms.stream().limit(4).toList());
        String vector = chunk != null && chunk.getEmbedding() != null && !chunk.getEmbedding().isBlank()
                ? "含向量证据"
                : "关键词证据";
        return relevance + " · " + type + " · " + match + " · " + vector;
    }

    public static double score(CodeChunk chunk, String[] keywords) {
        if (chunk == null || keywords == null || keywords.length == 0) {
            return 0.0;
        }
        String path = normalizedPath(chunk.getFilePath());
        String fileName = fileName(path);
        String content = safeLower(chunk.getContent());
        Set<String> matchedTerms = new LinkedHashSet<>();
        double score = 0.0;

        for (String keyword : keywords) {
            if (keyword == null || keyword.isBlank()) {
                continue;
            }
            String term = keyword.toLowerCase(Locale.ROOT);
            boolean matched = false;

            if (path.contains(term)) {
                score += 18.0;
                matched = true;
            }
            if (fileName.contains(term)) {
                score += 14.0;
                matched = true;
            }

            int occurrences = countOccurrences(content, term);
            if (occurrences > 0) {
                score += Math.min(occurrences, 20);
                matched = true;
            }

            double roleScore = roleScore(term, path, fileName, content);
            if (roleScore > 0) {
                score += roleScore;
                matched = true;
            }
            if (matched) {
                matchedTerms.add(term);
            }
        }

        if (matchedTerms.isEmpty()) {
            return 0.0;
        }

        score += matchedTerms.size() * matchedTerms.size() * 8.0;
        if (matchedTerms.size() >= Math.min(2, keywords.length)) {
            score += 12.0;
        }
        if (isPrimarySourcePath(path)) {
            score += 14.0;
        } else if (isSourceFile(path)) {
            score += 7.0;
        }
        if (isDocsOrBuildFile(path)) {
            score -= 18.0;
        }
        Integer startLine = chunk.getStartLine();
        if (startLine != null && startLine <= 5) {
            score += 4.0;
        } else if (startLine != null && startLine <= 60) {
            score += 2.0;
        }
        return Math.max(score, 0.0);
    }

    public static List<String> matchedTerms(CodeChunk chunk, String queryText) {
        String[] keywords = tokenize(queryText);
        if (chunk == null || keywords.length == 0) {
            return List.of();
        }
        String content = safeLower(chunk.getContent());
        String path = normalizedPath(chunk.getFilePath());
        List<String> matched = new ArrayList<>();
        for (String keyword : keywords) {
            String term = safeLower(keyword);
            if (!term.isBlank() && (content.contains(term) || path.contains(term))) {
                matched.add(keyword);
            }
        }
        return matched;
    }

    public static String[] tokenize(String question) {
        if (question == null || question.isBlank()) {
            return new String[0];
        }
        String cleaned = question.replaceAll("[^a-zA-Z0-9\u4e00-\u9fa5]+", " ").trim();
        if (cleaned.isBlank()) {
            return new String[0];
        }
        LinkedHashSet<String> tokens = new LinkedHashSet<>();
        Stream.of(cleaned.split("\\s+"))
                .forEach(token -> addIdentifierTokens(tokens, token));
        return tokens.stream()
                .limit(TOKEN_LIMIT)
                .toArray(String[]::new);
    }

    private static void addIdentifierTokens(Set<String> tokens, String token) {
        if (token == null || token.isBlank() || tokens.size() >= TOKEN_LIMIT) {
            return;
        }
        String compact = token.toLowerCase(Locale.ROOT);
        addToken(tokens, compact);

        String expanded = token
                .replaceAll("([a-z0-9])([A-Z])", "$1 $2")
                .replaceAll("([A-Z]+)([A-Z][a-z])", "$1 $2")
                .replaceAll("([A-Za-z])([0-9])", "$1 $2")
                .replaceAll("([0-9])([A-Za-z])", "$1 $2");
        for (String part : expanded.split("\\s+")) {
            if (tokens.size() >= TOKEN_LIMIT) {
                break;
            }
            String normalized = part.toLowerCase(Locale.ROOT);
            if (!normalized.equals(compact)) {
                addToken(tokens, normalized);
            }
        }
    }

    private static void addToken(Set<String> tokens, String token) {
        String normalized = token == null ? "" : token.trim().toLowerCase(Locale.ROOT);
        if (normalized.isBlank() || IDENTIFIER_NOISE_TOKENS.contains(normalized)) {
            return;
        }
        tokens.add(normalized);
    }

    private static String relevanceLabel(int score, boolean blankQuery) {
        if (blankQuery) {
            return "默认候选";
        }
        if (score >= 80) {
            return "高相关";
        }
        if (score >= 45) {
            return "中相关";
        }
        if (score > 0) {
            return "弱相关";
        }
        return "结构候选";
    }

    private static String evidenceTypeLabel(String type) {
        return switch (type) {
            case "CONTROLLER" -> "Controller";
            case "SERVICE" -> "Service";
            case "DATA_ACCESS" -> "Data";
            case "DOMAIN_MODEL" -> "Model";
            case "FRONTEND" -> "Frontend";
            case "TEST" -> "Test";
            case "DOCUMENTATION" -> "Docs";
            case "CONFIG" -> "Config";
            case "SOURCE" -> "Source";
            default -> "Other";
        };
    }

    private static double roleScore(String term, String path, String fileName, String content) {
        return switch (term) {
            case "controller", "route", "router", "api" -> sourceRoleScore(path, fileName, content,
                    "/controller/", "controller", "@restcontroller", "@controller", "@requestmapping");
            case "service" -> sourceRoleScore(path, fileName, content,
                    "/service/", "service", "@service", "implements");
            case "repository", "repo", "mapper", "dao" -> sourceRoleScore(path, fileName, content,
                    "/repository/", "repository", "@repository", "/mapper/", "mapper", "/dao/", "dao");
            case "entity", "model", "schema", "table" -> sourceRoleScore(path, fileName, content,
                    "/entity/", "entity", "/model/", "model", "@table", "@tablename");
            case "websocket", "socket" -> sourceRoleScore(path, fileName, content,
                    "websocket", "socket", "stomp", "sendmessage");
            case "chat", "message" -> sourceRoleScore(path, fileName, content,
                    "chat", "message", "conversation", "sender");
            default -> 0.0;
        };
    }

    private static double sourceRoleScore(String path, String fileName, String content, String... markers) {
        double score = 0.0;
        for (String marker : markers) {
            if (marker.startsWith("/") && path.contains(marker)) {
                score += 40.0;
            } else if (fileName.contains(marker)) {
                score += 24.0;
            } else if (content.contains(marker)) {
                score += 12.0;
            }
        }
        return score;
    }

    private static boolean isPrimarySourcePath(String path) {
        return path.contains("/src/main/java/")
                || path.contains("/src/main/kotlin/")
                || path.contains("/src/main/resources/")
                || path.contains("/src/")
                || path.startsWith("src/");
    }

    private static boolean isSourceFile(String path) {
        return path.endsWith(".java")
                || path.endsWith(".kt")
                || path.endsWith(".ts")
                || path.endsWith(".tsx")
                || path.endsWith(".js")
                || path.endsWith(".jsx")
                || path.endsWith(".vue")
                || path.endsWith(".py")
                || path.endsWith(".go")
                || path.endsWith(".rs")
                || path.endsWith(".sql");
    }

    private static boolean isDocsOrBuildFile(String path) {
        String name = fileName(path);
        return name.equals("readme.md")
                || name.equals("agents.md")
                || name.equals("changelog.md")
                || name.equals("license")
                || name.equals("pom.xml")
                || name.equals("package-lock.json")
                || name.equals("yarn.lock")
                || name.equals("pnpm-lock.yaml")
                || name.equals("cargo.lock")
                || path.endsWith(".md")
                || path.endsWith(".txt");
    }

    private static int countOccurrences(String value, String term) {
        if (value.isBlank() || term.isBlank()) {
            return 0;
        }
        int index = 0;
        int count = 0;
        while ((index = value.indexOf(term, index)) != -1) {
            count++;
            index += Math.max(term.length(), 1);
        }
        return count;
    }

    private static String normalizedPath(String value) {
        return safeLower(value).replace('\\', '/');
    }

    private static String fileName(String path) {
        int slash = path.lastIndexOf('/');
        return slash >= 0 ? path.substring(slash + 1) : path;
    }

    private static String safeLower(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT);
    }

    private record ScoredChunk(CodeChunk chunk, double score) {
    }
}
