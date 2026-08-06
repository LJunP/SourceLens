package com.sourcelens.module.analysis.service;

import com.sourcelens.module.analysis.entity.CodeChunk;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Stream;

public final class CodeChunkRanker {

    private static final int TOKEN_LIMIT = 12;
    private static final int TOKEN_COLLECT_LIMIT = 64;
    private static final int PREVIOUS_SAME_FILE_CONTEXT_WINDOW = 3;
    private static final int ROUTE_CONSTANT_CONTEXT_CHUNK_LIMIT = 24;
    private static final int ROUTE_CONSTANT_CONTEXT_CHAR_LIMIT = 24_000;
    private static final int MAPPING_ARGUMENT_SCAN_LIMIT = 1_200;
    private static final Pattern CLASS_DECLARATION_PATTERN = Pattern.compile("\\b(?:class|interface|enum|record|object)\\s+([A-Za-z_$][A-Za-z0-9_$]*)\\b");
    private static final Pattern QUALIFIED_ROUTE_CONSTANT_REFERENCE_PATTERN = Pattern.compile("\\b[A-Z][A-Za-z0-9_$]*\\s*\\.");
    private static final Pattern SIMPLE_ROUTE_CONSTANT_REFERENCE_PATTERN = Pattern.compile(
            "(?:^|[({,=\\s])(?:value\\s*=\\s*|path\\s*=\\s*)?[A-Z][A-Za-z0-9_$]*(?:\\s*[,)}]|$)"
    );
    private static final List<String> METHOD_HINT_EXTENSIONS = List.of(".java", ".kt", ".ts", ".tsx", ".js", ".jsx", ".vue");
    private static final Set<String> IDENTIFIER_NOISE_TOKENS = Set.of("com", "org", "net");
    private static final Set<String> LOW_SIGNAL_PATH_TOKENS = Set.of(
            "src", "main", "java", "kotlin", "resources", "resource", "com", "org", "net", "io",
            "at", "http", "https", "github", "gitlab", "bitbucket", "blob", "tree", "raw",
            "kt", "ts", "tsx", "js", "jsx", "vue", "py", "go", "rs"
    );
    private static final Set<String> PROTECTED_EVIDENCE_ROOT_SEGMENTS = Set.of(
            "apps",
            "libs",
            "modules",
            "packages",
            "services"
    );
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
        List<CodeLocationHintParser.LineHint> lineHints = CodeLocationHintParser.parseLineHints(queryText);
        List<CodeLocationHintParser.MethodHint> methodHints = CodeLocationHintParser.parseMethodHints(queryText);
        List<CodeLocationHintParser.FunctionFileHint> functionFileHints = CodeLocationHintParser.parseFunctionFileHints(queryText);
        List<String> pathSuffixHints = CodeLocationHintParser.pathSuffixHints(queryText);
        List<String> moduleRootHints = CodeLocationHintParser.moduleRootHints(queryText);
        List<String> sourceRootHints = CodeLocationHintParser.sourceRootHints(queryText);
        List<String> endpointRouteHints = CodeLocationHintParser.endpointRouteHints(queryText);
        List<String> endpointHttpMethodHints = CodeLocationHintParser.endpointHttpMethodHints(queryText);
        List<String> evidenceFilePathHints = CodeLocationHintParser.evidenceFilePathHints(queryText);
        List<CodeLocationHintParser.EvidenceLocationHint> evidenceLocationHints = CodeLocationHintParser.evidenceLocationHints(queryText);
        List<String> roleIntents = roleIntentTypes(queryText);
        return chunks.stream()
                .map(chunk -> new ScoredChunk(chunk, score(chunk, keywords, lineHints, methodHints, functionFileHints,
                        pathSuffixHints, moduleRootHints, sourceRootHints, endpointRouteHints, endpointHttpMethodHints,
                        evidenceFilePathHints, evidenceLocationHints, roleIntents)))
                .sorted(Comparator
                        .comparingDouble(ScoredChunk::score).reversed()
                        .thenComparing(scored -> safeLower(scored.chunk().getFilePath()))
                        .thenComparingInt(scored -> scored.chunk().getStartLine() == null ? Integer.MAX_VALUE : scored.chunk().getStartLine()))
                .limit(limit)
                .map(ScoredChunk::chunk)
                .toList();
    }

    public static List<CodeChunk> rankWithPreviousSameFileContext(List<CodeChunk> chunks, String queryText, int limit) {
        return rankWithPreviousSameFileContextScores(chunks, queryText, limit).stream()
                .map(RouteAwareScoredChunk::chunk)
                .toList();
    }

    public static List<RouteAwareScoredChunk> rankWithPreviousSameFileContextScores(List<CodeChunk> chunks, String queryText, int limit) {
        if (chunks == null || chunks.isEmpty() || limit <= 0 || endpointRouteHints(queryText).isEmpty()) {
            return rank(chunks, queryText, limit).stream()
                    .map(chunk -> new RouteAwareScoredChunk(chunk, score(chunk, queryText), false, false))
                    .toList();
        }
        String[] keywords = tokenize(queryText);
        if (keywords.length == 0) {
            return chunks.stream()
                    .limit(limit)
                    .map(chunk -> new RouteAwareScoredChunk(chunk, 0.0, false, false))
                    .toList();
        }
        List<CodeLocationHintParser.LineHint> lineHints = CodeLocationHintParser.parseLineHints(queryText);
        List<CodeLocationHintParser.MethodHint> methodHints = CodeLocationHintParser.parseMethodHints(queryText);
        List<CodeLocationHintParser.FunctionFileHint> functionFileHints = CodeLocationHintParser.parseFunctionFileHints(queryText);
        List<String> pathSuffixHints = CodeLocationHintParser.pathSuffixHints(queryText);
        List<String> moduleRootHints = CodeLocationHintParser.moduleRootHints(queryText);
        List<String> sourceRootHints = CodeLocationHintParser.sourceRootHints(queryText);
        List<String> endpointRouteHints = CodeLocationHintParser.endpointRouteHints(queryText);
        List<String> endpointHttpMethodHints = CodeLocationHintParser.endpointHttpMethodHints(queryText);
        List<String> evidenceFilePathHints = CodeLocationHintParser.evidenceFilePathHints(queryText);
        List<CodeLocationHintParser.EvidenceLocationHint> evidenceLocationHints = CodeLocationHintParser.evidenceLocationHints(queryText);
        List<String> roleIntents = roleIntentTypes(queryText);
        Map<String, List<CodeChunk>> previousByChunkKey = previousSameFileChunksByKey(chunks);
        String routeConstantContext = routeConstantContext(chunks);
        return routeAwareCandidateChunks(chunks, endpointRouteHints).stream()
                .map(chunk -> {
                    CodeChunk directContext = withExternalRouteConstantContext(routeConstantContext, chunk);
                    CodeChunk previousContext = withExternalRouteConstantContext(
                            routeConstantContext,
                            withPreviousContext(previousByChunkKey.get(chunkIdentityKey(chunk)), chunk)
                    );
                    SpringMappingLookup directSpringLookup = SpringMappingLookup.of(directContext.getContent());
                    SpringMappingLookup previousSpringLookup = SpringMappingLookup.of(previousContext.getContent());
                    double directScore = score(directContext, keywords, lineHints, methodHints, functionFileHints,
                                pathSuffixHints, moduleRootHints, sourceRootHints, endpointRouteHints, endpointHttpMethodHints,
                                evidenceFilePathHints, evidenceLocationHints, roleIntents, directSpringLookup);
                    double previousScore = score(previousContext,
                                keywords, lineHints, methodHints, functionFileHints,
                                pathSuffixHints, moduleRootHints, sourceRootHints, endpointRouteHints, endpointHttpMethodHints,
                                evidenceFilePathHints, evidenceLocationHints, roleIntents, previousSpringLookup);
                    boolean strongRouteMatch = hasStrongEndpointRouteMatch(directContext, endpointRouteHints, directSpringLookup)
                            || hasStrongEndpointRouteMatch(previousContext, endpointRouteHints, previousSpringLookup);
                    boolean springMappingRouteMatch = hasSpringEndpointRouteMatch(directContext, endpointRouteHints, directSpringLookup)
                            || hasSpringEndpointRouteMatch(previousContext, endpointRouteHints, previousSpringLookup);
                    return new RouteAwareScoredChunk(chunk, Math.max(directScore, previousScore),
                            strongRouteMatch, springMappingRouteMatch);
                })
                .sorted(Comparator
                        .comparingDouble(RouteAwareScoredChunk::score).reversed()
                        .thenComparing(scored -> safeLower(scored.chunk().getFilePath()))
                        .thenComparingInt(scored -> scored.chunk().getStartLine() == null ? Integer.MAX_VALUE : scored.chunk().getStartLine()))
                .limit(limit)
                .toList();
    }

    private static List<CodeChunk> routeAwareCandidateChunks(List<CodeChunk> chunks, List<String> endpointRouteHints) {
        if (chunks == null || chunks.isEmpty() || endpointRouteHints == null || endpointRouteHints.isEmpty()) {
            return chunks == null ? List.of() : chunks;
        }
        List<CodeChunk> candidates = chunks.stream()
                .filter(chunk -> isRouteAwareCandidate(chunk, endpointRouteHints))
                .toList();
        return candidates.isEmpty() ? chunks : candidates;
    }

    private static boolean isRouteAwareCandidate(CodeChunk chunk, List<String> endpointRouteHints) {
        if (chunk == null) {
            return false;
        }
        String path = normalizedPath(chunk.getFilePath());
        String fileName = fileName(path);
        String content = safeLower(chunk.getContent());
        if (content.isBlank()) {
            return false;
        }
        if (path.contains("/controller/")
                || fileName.contains("controller")
                || path.contains("/src/api/")
                || path.contains("/api/")
                || isFrontendPath(path)
                || isRouteConstantHolder(chunk)
                || hasSpringMappingAnnotation(content)) {
            return true;
        }
        String routeMentionContent = stripJavaComments(content);
        for (String hint : endpointRouteHints) {
            String normalizedHint = safeLower(hint);
            if (normalizedHint.isBlank()) {
                continue;
            }
            String withoutLeadingSlash = normalizedHint.startsWith("/") ? normalizedHint.substring(1) : normalizedHint;
            if (routeMentionContent.contains(normalizedHint)
                    || (!withoutLeadingSlash.isBlank() && routeMentionContent.contains(withoutLeadingSlash))) {
                return true;
            }
        }
        return false;
    }

    private static boolean hasSpringMappingAnnotation(String content) {
        if (content == null || content.isBlank()) {
            return false;
        }
        return content.contains("@requestmapping")
                || content.contains("@getmapping")
                || content.contains("@postmapping")
                || content.contains("@putmapping")
                || content.contains("@deletemapping")
                || content.contains("@patchmapping");
    }

    private static String routeConstantContext(List<CodeChunk> chunks) {
        if (chunks == null || chunks.isEmpty()) {
            return "";
        }
        StringBuilder context = new StringBuilder();
        int added = 0;
        for (CodeChunk chunk : chunks) {
            if (!isRouteConstantHolder(chunk)) {
                continue;
            }
            String content = chunk.getContent();
            if (content == null || content.isBlank()) {
                continue;
            }
            if (added >= ROUTE_CONSTANT_CONTEXT_CHUNK_LIMIT || context.length() >= ROUTE_CONSTANT_CONTEXT_CHAR_LIMIT) {
                break;
            }
            if (!context.isEmpty()) {
                context.append('\n');
            }
            int remaining = ROUTE_CONSTANT_CONTEXT_CHAR_LIMIT - context.length();
            context.append(content, 0, Math.min(content.length(), remaining));
            added++;
        }
        return context.toString();
    }

    private static boolean isRouteConstantHolder(CodeChunk chunk) {
        if (chunk == null || chunk.getFilePath() == null || chunk.getFilePath().isBlank()) {
            return false;
        }
        String path = normalizedPath(chunk.getFilePath());
        String fileName = fileName(path);
        if (fileName.contains("controller") || fileName.contains("service") || fileName.contains("test") || fileName.contains("spec")) {
            return false;
        }
        boolean routeHolderName = fileName.contains("route")
                || fileName.contains("routes")
                || fileName.contains("path")
                || fileName.contains("paths")
                || fileName.contains("endpoint")
                || fileName.contains("endpoints")
                || fileName.contains("urlconstants")
                || fileName.contains("uriconstants")
                || fileName.contains("apiurls")
                || fileName.contains("apiuris")
                || fileName.contains("apiconstants");
        if (!routeHolderName) {
            return false;
        }
        String content = safeLower(chunk.getContent());
        return content.contains("string ")
                || content.contains("const val ")
                || content.contains(" val ")
                || content.contains("const ");
    }

    private static CodeChunk withExternalRouteConstantContext(String routeConstantContext, CodeChunk current) {
        if (routeConstantContext == null || routeConstantContext.isBlank() || current == null
                || !hasExternalRouteConstantReference(current.getContent())) {
            return current;
        }
        return CodeChunk.builder()
                .id(current.getId())
                .scanTaskId(current.getScanTaskId())
                .filePath(current.getFilePath())
                .workspaceRoot(current.getWorkspaceRoot())
                .moduleRoot(current.getModuleRoot())
                .content(routeConstantContext + "\n" + (current.getContent() == null ? "" : current.getContent()))
                .startLine(current.getStartLine())
                .endLine(current.getEndLine())
                .contentHash(current.getContentHash())
                .embedding(current.getEmbedding())
                .embeddingModel(current.getEmbeddingModel())
                .createdAt(current.getCreatedAt())
                .build();
    }

    private static boolean hasExternalRouteConstantReference(String content) {
        if (content == null || content.isBlank() || !hasSpringMappingAnnotation(safeLower(content))) {
            return false;
        }
        String lower = safeLower(content);
        for (String mappingName : List.of("@requestmapping", "@getmapping", "@postmapping", "@putmapping", "@deletemapping", "@patchmapping")) {
            int searchFrom = 0;
            while (searchFrom < lower.length()) {
                int mappingIndex = lower.indexOf(mappingName, searchFrom);
                if (mappingIndex < 0) {
                    break;
                }
                int openParen = lower.indexOf('(', mappingIndex + mappingName.length());
                if (openParen < 0) {
                    searchFrom = mappingIndex + mappingName.length();
                    continue;
                }
                int scanEnd = Math.min(content.length(), openParen + MAPPING_ARGUMENT_SCAN_LIMIT);
                int closeParen = findMappingArgumentClose(content, openParen, scanEnd);
                if (closeParen < 0) {
                    closeParen = scanEnd;
                }
                String arguments = content.substring(openParen + 1, closeParen);
                if (arguments.contains("+")
                        || QUALIFIED_ROUTE_CONSTANT_REFERENCE_PATTERN.matcher(arguments).find()
                        || SIMPLE_ROUTE_CONSTANT_REFERENCE_PATTERN.matcher(arguments).find()) {
                    return true;
                }
                searchFrom = closeParen + 1;
            }
        }
        return false;
    }

    private static int findMappingArgumentClose(String content, int openParen, int endExclusive) {
        int depth = 0;
        int current = openParen;
        while (current < endExclusive) {
            char ch = content.charAt(current);
            if (ch == '"' || ch == '\'' || ch == '`') {
                int quoteEnd = skipQuotedValue(content, current, endExclusive);
                current = quoteEnd < 0 ? current + 1 : quoteEnd;
                continue;
            }
            if (ch == '(') {
                depth++;
            } else if (ch == ')') {
                depth--;
                if (depth == 0) {
                    return current;
                }
            }
            current++;
        }
        return -1;
    }

    public static double score(CodeChunk chunk, String queryText) {
        return score(chunk, tokenize(queryText), CodeLocationHintParser.parseLineHints(queryText), CodeLocationHintParser.parseMethodHints(queryText),
                CodeLocationHintParser.parseFunctionFileHints(queryText), CodeLocationHintParser.pathSuffixHints(queryText),
                CodeLocationHintParser.moduleRootHints(queryText), CodeLocationHintParser.sourceRootHints(queryText),
                CodeLocationHintParser.endpointRouteHints(queryText),
                CodeLocationHintParser.endpointHttpMethodHints(queryText),
                CodeLocationHintParser.evidenceFilePathHints(queryText), CodeLocationHintParser.evidenceLocationHints(queryText),
                roleIntentTypes(queryText));
    }

    private static Map<String, List<CodeChunk>> previousSameFileChunksByKey(List<CodeChunk> chunks) {
        Map<String, List<CodeChunk>> previousByKey = new HashMap<>();
        Map<String, List<CodeChunk>> latestByFile = new HashMap<>();
        chunks.stream()
                .filter(chunk -> chunk != null && chunk.getFilePath() != null && !chunk.getFilePath().isBlank())
                .sorted(Comparator
                        .comparing((CodeChunk chunk) -> safeLower(chunk.getFilePath()))
                        .thenComparingInt(chunk -> chunk.getStartLine() == null ? Integer.MAX_VALUE : chunk.getStartLine()))
                .forEach(chunk -> {
                    String fileKey = normalizedPath(chunk.getFilePath());
                    List<CodeChunk> previousChunks = latestByFile.getOrDefault(fileKey, List.of());
                    List<CodeChunk> validPreviousChunks = previousChunks.stream()
                            .filter(previous -> isPreviousSameFileChunk(previous, chunk))
                            .toList();
                    if (!validPreviousChunks.isEmpty()) {
                        previousByKey.put(chunkIdentityKey(chunk), validPreviousChunks);
                    }
                    List<CodeChunk> nextWindow = new ArrayList<>(previousChunks);
                    nextWindow.add(chunk);
                    int fromIndex = Math.max(0, nextWindow.size() - PREVIOUS_SAME_FILE_CONTEXT_WINDOW);
                    latestByFile.put(fileKey, new ArrayList<>(nextWindow.subList(fromIndex, nextWindow.size())));
                });
        return previousByKey;
    }

    private static boolean isPreviousSameFileChunk(CodeChunk previous, CodeChunk current) {
        if (previous == null || current == null || previous.getStartLine() == null || current.getStartLine() == null) {
            return false;
        }
        return previous.getStartLine() < current.getStartLine();
    }

    private static CodeChunk withPreviousContext(List<CodeChunk> previousChunks, CodeChunk current) {
        if (previousChunks == null || previousChunks.isEmpty() || current == null) {
            return current;
        }
        List<CodeChunk> usablePreviousChunks = previousChunks.stream()
                .filter(previous -> previous != null
                        && previous.getContent() != null
                        && !previous.getContent().isBlank())
                .toList();
        if (usablePreviousChunks.isEmpty()) {
            return current;
        }
        String previousContent = usablePreviousChunks.stream()
                .map(CodeChunk::getContent)
                .reduce((left, right) -> left + "\n" + right)
                .orElse("");
        Integer startLine = usablePreviousChunks.stream()
                .map(CodeChunk::getStartLine)
                .filter(Objects::nonNull)
                .min(Integer::compareTo)
                .orElse(current.getStartLine());
        return CodeChunk.builder()
                .id(current.getId())
                .scanTaskId(current.getScanTaskId())
                .filePath(current.getFilePath())
                .workspaceRoot(current.getWorkspaceRoot())
                .moduleRoot(current.getModuleRoot())
                .content(previousContent + "\n" + (current.getContent() == null ? "" : current.getContent()))
                .startLine(startLine)
                .endLine(current.getEndLine())
                .contentHash(current.getContentHash())
                .embedding(current.getEmbedding())
                .embeddingModel(current.getEmbeddingModel())
                .createdAt(current.getCreatedAt())
                .build();
    }

    private static String chunkIdentityKey(CodeChunk chunk) {
        if (chunk == null) {
            return "";
        }
        if (chunk.getId() != null) {
            return "id:" + chunk.getId();
        }
        return "range:" + (chunk.getScanTaskId() == null ? "" : chunk.getScanTaskId())
                + ":" + (chunk.getFilePath() == null ? "" : chunk.getFilePath())
                + ":" + (chunk.getStartLine() == null ? "" : chunk.getStartLine())
                + ":" + (chunk.getEndLine() == null ? "" : chunk.getEndLine());
    }

    public static int relevanceScore(CodeChunk chunk, String queryText) {
        return (int) Math.min(100, Math.round(score(chunk, queryText)));
    }

    public static boolean isExactLocationAnchorMatch(CodeChunk chunk, String queryText) {
        if (chunk == null || queryText == null || queryText.isBlank()) {
            return false;
        }
        List<CodeLocationHintParser.LineHint> lineHints = CodeLocationHintParser.parseLineHints(queryText);
        if (lineHints.isEmpty() || !containsAnyLineHint(chunk, lineHints)) {
            return false;
        }
        List<CodeLocationHintParser.EvidenceLocationHint> evidenceLocationHints = CodeLocationHintParser.evidenceLocationHints(queryText);
        if (!evidenceLocationHints.isEmpty()) {
            return matchesEvidenceLocationHint(chunk, evidenceLocationHints);
        }
        List<String> pathSuffixHints = CodeLocationHintParser.pathSuffixHints(queryText);
        if (matchesStrictPathHint(chunk, pathSuffixHints)) {
            return true;
        }
        if (pathSuffixHints.stream().anyMatch(hint -> normalizedPath(hint).contains("/"))) {
            return false;
        }
        return matchesMethodAnchorFileHint(chunk, CodeLocationHintParser.methodAnchorFileHints(queryText));
    }

    public static boolean isExactPathLocationAnchorMatch(CodeChunk chunk, String queryText) {
        if (chunk == null || queryText == null || queryText.isBlank()) {
            return false;
        }
        String path = normalizedPath(chunk.getFilePath());
        if (path.isBlank()) {
            return false;
        }
        List<CodeLocationHintParser.EvidenceLocationHint> evidenceLocationHints = CodeLocationHintParser.evidenceLocationHints(queryText);
        if (!evidenceLocationHints.isEmpty()) {
            return evidenceLocationHints.stream()
                    .anyMatch(hint -> hint != null
                            && path.equals(normalizedPath(hint.filePath()))
                            && containsLineHint(chunk, hint.lineHint()));
        }
        List<CodeLocationHintParser.LineHint> lineHints = CodeLocationHintParser.parseLineHints(queryText);
        if (lineHints.isEmpty() || !containsAnyLineHint(chunk, lineHints)) {
            return false;
        }
        List<String> evidenceFilePathHints = CodeLocationHintParser.evidenceFilePathHints(queryText);
        if (!evidenceFilePathHints.isEmpty()) {
            return evidenceFilePathHints.stream()
                    .map(CodeChunkRanker::normalizedPath)
                    .anyMatch(path::equals);
        }
        return CodeLocationHintParser.pathSuffixHints(queryText).stream()
                .map(CodeChunkRanker::normalizedPath)
                .anyMatch(path::equals);
    }

    public static String evidenceType(CodeChunk chunk) {
        String path = normalizedPath(chunk == null ? "" : chunk.getFilePath());
        String fileName = fileName(path);
        String content = safeLower(chunk == null ? "" : chunk.getContent());
        if (isTestSourcePath(path)) {
            return "TEST";
        }
        if (isCommandSourcePath(path)) {
            return "SOURCE";
        }
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
        if (isDomainModelPath(path, fileName, content)) {
            return "DOMAIN_MODEL";
        }
        if (isFrontendPath(path)) {
            return "FRONTEND";
        }
        if (isDocsOrBuildFile(path)) {
            return "DOCUMENTATION";
        }
        if (isConfigPath(path)) {
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
        return score(chunk, keywords, List.of(), List.of(), List.of(), List.of(), List.of(), List.of(),
                List.of(), List.of(), List.of(), List.of(), List.of());
    }

    private static double score(CodeChunk chunk,
                                String[] keywords,
                                List<CodeLocationHintParser.LineHint> lineHints,
                                List<CodeLocationHintParser.MethodHint> methodHints,
                                List<CodeLocationHintParser.FunctionFileHint> functionFileHints,
                                List<String> pathSuffixHints,
                                List<String> moduleRootHints,
                                List<String> sourceRootHints,
                                List<String> endpointRouteHints,
                                List<String> endpointHttpMethodHints,
                                List<String> evidenceFilePathHints,
                                List<CodeLocationHintParser.EvidenceLocationHint> evidenceLocationHints,
                                List<String> roleIntents) {
        return score(chunk, keywords, lineHints, methodHints, functionFileHints, pathSuffixHints, moduleRootHints,
                sourceRootHints, endpointRouteHints, endpointHttpMethodHints, evidenceFilePathHints, evidenceLocationHints, roleIntents,
                null);
    }

    private static double score(CodeChunk chunk,
                                String[] keywords,
                                List<CodeLocationHintParser.LineHint> lineHints,
                                List<CodeLocationHintParser.MethodHint> methodHints,
                                List<CodeLocationHintParser.FunctionFileHint> functionFileHints,
                                List<String> pathSuffixHints,
                                List<String> moduleRootHints,
                                List<String> sourceRootHints,
                                List<String> endpointRouteHints,
                                List<String> endpointHttpMethodHints,
                                List<String> evidenceFilePathHints,
                                List<CodeLocationHintParser.EvidenceLocationHint> evidenceLocationHints,
                                List<String> roleIntents,
                                SpringMappingLookup springMappingLookup) {
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

        double structuralScore = roleIntentScore(chunk, roleIntents)
                + evidenceLocationHintScore(chunk, evidenceLocationHints)
                + evidenceFilePathHintScore(chunk, evidenceFilePathHints)
                + endpointRouteHintScore(chunk, endpointRouteHints, endpointHttpMethodHints, springMappingLookup)
                + moduleRootHintScore(chunk, moduleRootHints)
                + sourceRootHintScore(chunk, sourceRootHints)
                + pathSuffixHintScore(chunk, pathSuffixHints)
                + lineHintScore(chunk, lineHints)
                + methodHintScore(chunk, methodHints)
                + functionFileHintScore(chunk, functionFileHints);
        if (matchedTerms.isEmpty() && structuralScore <= 0.0) {
            return 0.0;
        }

        if (!matchedTerms.isEmpty()) {
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
        }
        score += structuralScore;
        if (isGeneratedOrNoisePath(path)
                && hasOnlyMiddlePathHintMatch(path, fileName, fileName.replaceAll("[^a-z0-9.]+", ""),
                pathSuffixHints, evidenceFilePathHints)) {
            score -= 80.0;
        }
        if (hasProtectedRootMiddlePathHintMatch(path, pathSuffixHints, evidenceFilePathHints, evidenceLocationHints)) {
            score -= 520.0;
        }
        if (roleIntents != null && !roleIntents.isEmpty()
                && !roleIntents.contains("DOCUMENTATION")
                && isDocsOrBuildFile(path)) {
            score -= 360.0;
        }
        if ((roleIntents == null || !roleIntents.contains("TEST"))
                && isTestSourcePath(path)
                && !hasExplicitFileLocationHint(chunk, functionFileHints, pathSuffixHints,
                evidenceFilePathHints, evidenceLocationHints)) {
            score -= 180.0;
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
        String input = question.trim();
        String tokenInput = CodeLocationHintParser.stripLocationHintsForTokenization(input);
        String cleaned = tokenInput.replaceAll("[^a-zA-Z0-9\u4e00-\u9fa5]+", " ").trim();
        if (cleaned.isBlank()) {
            return new String[0];
        }
        LinkedHashSet<String> tokens = new LinkedHashSet<>();
        boolean pathLike = CodeLocationHintParser.looksLikePath(input);
        if (pathLike) {
            addPathIdentifierTokens(tokens, tokenInput);
        }
        Stream.of(cleaned.split("\\s+"))
                .forEach(token -> addIdentifierTokens(tokens, token));
        List<String> orderedTokens = pathLike ? pruneLowSignalTokens(tokens) : new ArrayList<>(tokens);
        return orderedTokens.stream()
                .limit(TOKEN_LIMIT)
                .toArray(String[]::new);
    }

    public static List<String> roleIntentTypes(String queryText) {
        if (queryText == null || queryText.isBlank()) {
            return List.of();
        }
        String input = safeLower(queryText);
        Set<String> tokens = Set.of(tokenize(queryText));
        boolean frontendContext = tokens.stream().anyMatch(token -> Set.of(
                "vue", "react", "frontend", "component", "components", "ui", "view", "views", "page",
                "javascript", "typescript", "js", "ts", "tsx", "jsx"
        ).contains(token))
                || input.contains("前端")
                || input.contains("组件")
                || hasChinesePageSurface(input)
                || hasFrontendActionSurface(input, tokens);
        boolean backendFlowContext = hasBackendFlowIntent(input, tokens, frontendContext);
        boolean frontendBackendBridgeContext = hasFrontendBackendBridgeIntent(input, tokens, frontendContext);
        boolean configIntent = hasConfigIntent(input, tokens);
        boolean testIntent = hasTestIntent(input, tokens);
        boolean documentationIntent = hasDocumentationIntent(input, tokens);
        boolean nonSourceRoleIntent = configIntent || testIntent || documentationIntent;
        boolean operationalPolicyIntent = hasOperationalPolicyIntent(input, tokens);
        boolean dataAccessIntent = hasDataAccessIntent(input, tokens);
        if (!backendFlowContext && (queryText.contains("#")
                || queryText.contains("::")
                || !CodeLocationHintParser.parseMethodHints(queryText).isEmpty()
                || !CodeLocationHintParser.parseFunctionFileHints(queryText).isEmpty()
                || (CodeLocationHintParser.looksLikePath(queryText) && !queryText.trim().contains(" ")))) {
            return List.of();
        }
        LinkedHashSet<String> intents = new LinkedHashSet<>();

        if (frontendContext && !testIntent && !documentationIntent) {
            intents.add("FRONTEND");
        }
        if (frontendBackendBridgeContext && !testIntent && !documentationIntent) {
            intents.add("CONTROLLER");
        }
        if (backendFlowContext && !testIntent && !documentationIntent) {
            intents.add("CONTROLLER");
            intents.add("SERVICE");
            intents.add("DATA_ACCESS");
            if (hasDomainModelFlowIntent(input, tokens)) {
                intents.add("DOMAIN_MODEL");
            }
        }
        if (operationalPolicyIntent && !testIntent && !documentationIntent) {
            intents.add("SERVICE");
            intents.add("CONFIG");
            intents.add("CONTROLLER");
        }
        if (dataAccessIntent && !testIntent && !documentationIntent) {
            intents.add("DATA_ACCESS");
            if (hasDomainModelFlowIntent(input, tokens)) {
                intents.add("DOMAIN_MODEL");
            }
            intents.add("SERVICE");
        }
        if (tokens.contains("controller")
                || tokens.contains("restcontroller")
                || tokens.contains("requestmapping")
                || input.contains("request mapping")
                || (!nonSourceRoleIntent && hasBackendEndpointIntent(input, tokens, frontendContext))) {
            if (!nonSourceRoleIntent) {
                intents.add("CONTROLLER");
            }
        }
        if (!frontendContext && !nonSourceRoleIntent && tokens.contains("service")) {
            intents.add("SERVICE");
            if (tokens.stream().anyMatch(token -> Set.of("business", "logic", "implementation", "implementations").contains(token))) {
                intents.add("CONTROLLER");
                intents.add("DATA_ACCESS");
                intents.add("DOMAIN_MODEL");
            }
        }
        if (!nonSourceRoleIntent
                && (tokens.contains("repository") || tokens.contains("repo") || tokens.contains("mapper") || tokens.contains("dao"))) {
            intents.add("DATA_ACCESS");
        }
        if (!nonSourceRoleIntent && (tokens.contains("entity") || tokens.contains("model") || tokens.contains("schema"))) {
            intents.add("DOMAIN_MODEL");
        }
        if (configIntent) {
            intents.add("CONFIG");
        }
        if (testIntent) {
            intents.add("TEST");
        }
        if (documentationIntent) {
            intents.add("DOCUMENTATION");
        }
        return new ArrayList<>(intents);
    }
    private static boolean hasTestIntent(String input, Set<String> tokens) {
        if (input == null || input.isBlank() || tokens == null) {
            return false;
        }
        if (input.contains("测试文件")
                || input.contains("测试用例")
                || input.contains("单元测试")
                || input.contains("集成测试")
                || input.contains("回归测试")
                || input.contains("冒烟测试")
                || input.contains("测试覆盖")
                || input.contains("测试类")) {
            return true;
        }
        if (input.contains("playwright")
                || input.contains("junit")
                || input.contains("surefire")
                || input.contains(".spec.")
                || input.contains(".test.")
                || input.contains("test.java")
                || input.contains("tests.java")) {
            return true;
        }
        if (tokens.stream().anyMatch(CodeChunkRanker::isTestLikeIdentifier)) {
            return true;
        }
        boolean testSurface = tokens.stream().anyMatch(token -> Set.of(
                "test", "tests", "testing", "spec", "specs"
        ).contains(token));
        if (!testSurface) {
            return false;
        }
        return tokens.stream().anyMatch(token -> Set.of(
                "file", "files", "class", "classes", "case", "cases", "unit", "integration",
                "regression", "smoke", "e2e", "coverage", "junit", "playwright", "vitest", "jest"
        ).contains(token));
    }

    private static boolean isTestLikeIdentifier(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        String safeToken = safeLower(token);
        return safeToken.equals("test")
                || safeToken.equals("tests")
                || safeToken.equals("testing")
                || safeToken.equals("spec")
                || safeToken.equals("specs");
    }

    private static boolean hasDocumentationIntent(String input, Set<String> tokens) {
        if (input == null || input.isBlank() || tokens == null) {
            return false;
        }
        if (input.contains("文档在哪里")
                || input.contains("项目文档")
                || input.contains("接口文档")
                || input.contains("运行手册")
                || input.contains("操作手册")
                || input.contains("部署文档")
                || input.contains("设计文档")
                || input.contains("说明文档")) {
            return true;
        }
        if (input.contains("readme.md")
                || input.contains("changelog.md")
                || input.contains("runbook")
                || input.contains("docs/")
                || input.contains("/docs")) {
            return true;
        }
        if (tokens.stream().anyMatch(token -> Set.of(
                "readme", "changelog", "runbook"
        ).contains(token))) {
            return true;
        }
        boolean docsSurface = tokens.stream().anyMatch(token -> Set.of(
                "doc", "docs", "documentation", "manual", "guide", "guides"
        ).contains(token)) || input.contains("文档");
        boolean documentFileSurface = tokens.stream().anyMatch(token -> Set.of(
                "document", "documents"
        ).contains(token));
        boolean docsLocationContext = tokens.stream().anyMatch(token -> Set.of(
                "where", "project", "api", "design", "deploy", "deployment",
                "operation", "operations", "architecture", "security", "release"
        ).contains(token))
                || input.contains("在哪里")
                || input.contains("哪")
                || input.contains("位置");
        if (documentFileSurface && docsLocationContext && !hasUploadedDocumentContext(input, tokens)) {
            return true;
        }
        if (!docsSurface) {
            return false;
        }
        return docsLocationContext;
    }

    private static boolean hasUploadedDocumentContext(String input, Set<String> tokens) {
        if (input == null || tokens == null) {
            return false;
        }
        return input.contains("上传")
                || input.contains("用户上传")
                || tokens.stream().anyMatch(token -> Set.of(
                        "upload", "uploaded", "user", "users", "parser", "parse", "parsing", "file", "files"
                ).contains(token));
    }

    private static boolean hasConfigIntent(String input, Set<String> tokens) {
        if (input == null || input.isBlank() || tokens == null) {
            return false;
        }
        if (input.contains("配置文件")
                || input.contains("应用配置")
                || input.contains("启动配置")
                || input.contains("运行时配置")
                || input.contains("固定配置")
                || input.contains("实验开关")
                || input.contains("功能开关")
                || input.contains("环境变量")
                || input.contains("数据源")
                || input.contains("数据库配置")
                || input.contains("mysql配置")
                || input.contains("跨域")
                || input.contains("白名单")
                || input.contains("端口配置")) {
            return true;
        }
        if (input.contains("application.yml")
                || input.contains("application.yaml")
                || input.contains("application.properties")
                || input.contains("server.port")
                || input.contains("spring.datasource")
                || input.contains(".env")) {
            return true;
        }
        if (tokens.stream().anyMatch(token -> Set.of(
                "yaml", "yml", "properties", "env", "environment", "profile", "profiles", "datasource", "cors"
        ).contains(token))) {
            return true;
        }
        boolean genericConfig = tokens.stream().anyMatch(token -> Set.of(
                "config", "configuration", "configs"
        ).contains(token));
        if (!genericConfig) {
            return false;
        }
        return tokens.stream().anyMatch(token -> Set.of(
                "runtime", "server", "backend", "spring", "boot", "database", "db", "mysql",
                "port", "ports", "security", "jwt", "secret", "secrets", "credential", "credentials"
        ).contains(token));
    }

    private static boolean hasOperationalPolicyIntent(String input, Set<String> tokens) {
        if (input == null || input.isBlank() || tokens == null) {
            return false;
        }
        boolean policySubject = input.contains("子任务")
                || input.contains("工具")
                || input.contains("能力")
                || input.contains("调度")
                || input.contains("危险")
                || input.contains("命令")
                || input.contains("拒绝")
                || input.contains("权限")
                || input.contains("认证")
                || input.contains("鉴权")
                || input.contains("安全")
                || tokens.stream().anyMatch(token -> Set.of(
                        "agent", "worker", "task", "tool", "tools", "workflow", "permission",
                        "security", "auth", "validate", "validation", "reject", "deny",
                        "dangerous", "command", "policy"
                ).contains(token));
        boolean locationOrJudgement = input.contains("哪里")
                || input.contains("在哪")
                || input.contains("判断")
                || input.contains("校验")
                || input.contains("验证")
                || input.contains("使用")
                || input.contains("哪些")
                || tokens.stream().anyMatch(token -> Set.of(
                        "where", "which", "use", "uses", "judge", "check", "guard", "validator"
                ).contains(token));
        return policySubject && locationOrJudgement;
    }

    private static boolean hasDataAccessIntent(String input, Set<String> tokens) {
        if (input == null || input.isBlank() || tokens == null) {
            return false;
        }
        boolean dataSubject = input.contains("数据")
                || input.contains("数据库")
                || input.contains("表")
                || input.contains("mapper")
                || input.contains("dao")
                || tokens.stream().anyMatch(token -> Set.of(
                        "data", "database", "db", "sql", "table", "tables", "mapper",
                        "repository", "repo", "dao", "persistence"
                ).contains(token));
        boolean accessVerb = input.contains("加载")
                || input.contains("查询")
                || input.contains("保存")
                || input.contains("写入")
                || input.contains("读取")
                || input.contains("准备")
                || hasChineseCrudIntent(input)
                || hasChineseReadDataIntent(input)
                || tokens.stream().anyMatch(token -> Set.of(
                        "load", "query", "save", "persist", "read", "write", "prepare"
                ).contains(token));
        return dataSubject && accessVerb;
    }

    private static boolean hasFrontendBackendBridgeIntent(String input, Set<String> tokens, boolean frontendContext) {
        if (!frontendContext || input == null || input.isBlank() || tokens == null) {
            return false;
        }
        boolean backendEndpoint = input.contains("后端")
                || input.contains("接口")
                || input.contains("api")
                || tokens.stream().anyMatch(token -> Set.of(
                        "backend", "server", "api", "endpoint", "endpoints", "controller", "request"
                ).contains(token));
        return backendEndpoint && hasFrontendBackendBridgeAction(input, tokens);
    }

    private static boolean hasChinesePageSurface(String input) {
        if (input == null || input.isBlank()) {
            return false;
        }
        return input.contains("页面")
                || input.contains("首页")
                || input.contains("登录页")
                || input.contains("注册页")
                || input.contains("详情页")
                || input.contains("列表页")
                || input.contains("管理页")
                || input.contains("配置页")
                || input.contains("设置页");
    }

    private static boolean hasFrontendBackendBridgeAction(String input, Set<String> tokens) {
        if (input == null || tokens == null) {
            return false;
        }
        return hasFrontendActionSurface(input, tokens)
                || hasChinesePageEndpointCompound(input)
                || hasEnglishPageEndpointCompound(input, tokens)
                || input.contains("调用")
                || input.contains("请求")
                || input.contains("对应")
                || input.contains("关联")
                || input.contains("使用")
                || input.contains("用哪个")
                || input.contains("用到")
                || input.contains("哪个")
                || input.contains("哪一个")
                || input.contains("是什么")
                || input.contains("在哪里")
                || input.contains("在哪")
                || tokens.stream().anyMatch(token -> Set.of(
                        "call", "calls", "request", "use", "uses", "using", "which", "where"
                ).contains(token));
    }

    private static boolean hasChinesePageEndpointCompound(String input) {
        return hasChinesePageSurface(input) && (input.contains("接口") || input.contains("api"));
    }

    private static boolean hasEnglishPageEndpointCompound(String input, Set<String> tokens) {
        if (input == null || tokens == null) {
            return false;
        }
        boolean endpointSurface = tokens.stream().anyMatch(token -> Set.of(
                "api", "endpoint", "endpoints"
        ).contains(token));
        boolean frontendSurface = tokens.stream().anyMatch(token -> Set.of(
                "component", "components", "ui", "view", "views"
        ).contains(token))
                || (tokens.contains("page") && !tokens.stream().anyMatch(token -> Set.of(
                        "pagination", "paginate", "paging", "paged"
                ).contains(token)));
        return endpointSurface && frontendSurface;
    }

    private static boolean hasFrontendActionSurface(String input, Set<String> tokens) {
        if (input == null || tokens == null) {
            return false;
        }
        return input.contains("点击")
                || input.contains("按钮")
                || input.contains("提交")
                || input.contains("表单")
                || input.contains("onclick")
                || tokens.stream().anyMatch(token -> Set.of(
                        "click", "button", "submit", "form", "onclick", "fetch", "axios"
                ).contains(token));
    }

    private static boolean hasBackendEndpointIntent(String input, Set<String> tokens, boolean frontendContext) {
        if (frontendContext) {
            return false;
        }
        if (tokens.contains("endpoint") || tokens.contains("endpoints") || input.contains("接口")) {
            return true;
        }
        if (input.contains("路由")) {
            return true;
        }
        if (tokens.contains("route") || tokens.contains("routes") || tokens.contains("handler")) {
            return hasBackendRouteContext(input, tokens);
        }
        return false;
    }

    private static boolean hasBackendRouteContext(String input, Set<String> tokens) {
        if (input.contains("后端") || input.contains("服务端") || input.contains("接口")) {
            return true;
        }
        return tokens.stream().anyMatch(token -> Set.of(
                "backend", "server", "server-side", "spring", "rest", "http", "request", "mapping",
                "controller", "endpoint", "api", "handler"
        ).contains(token));
    }

    private static boolean hasBackendFlowIntent(String input, Set<String> tokens, boolean frontendContext) {
        if (frontendContext || input == null || input.isBlank() || tokens == null) {
            return false;
        }
        boolean entryPointIntent = input.contains("接口")
                || input.contains("路由")
                || input.contains("控制器")
                || tokens.stream().anyMatch(token -> Set.of(
                        "api", "endpoint", "endpoints", "route", "routes", "controller", "handler",
                        "requestmapping", "restcontroller"
                ).contains(token));
        boolean dataFlowIntent = input.contains("数据库")
                || input.contains("查库")
                || input.contains("落库")
                || input.contains("入库")
                || input.contains("持久化")
                || input.contains("写表")
                || input.contains("读表")
                || input.contains("数据表")
                || hasChineseCrudIntent(input)
                || hasChineseReadDataIntent(input)
                || hasChineseResponseDataIntent(input)
                || tokens.stream().anyMatch(token -> Set.of(
                        "database", "db", "sql", "table", "tables", "persist", "persistence",
                        "save", "query", "mapper", "repository", "repo", "dao", "service"
                ).contains(token));
        boolean flowVerb = input.contains("怎么")
                || input.contains("如何")
                || input.contains("流程")
                || input.contains("链路")
                || input.contains("调用")
                || input.contains("从")
                || input.contains("到")
                || tokens.stream().anyMatch(token -> Set.of(
                        "flow", "trace", "chain", "path", "through", "from", "to", "call", "calls",
                        "calling", "lifecycle"
                ).contains(token));
        return entryPointIntent && dataFlowIntent && flowVerb;
    }

    private static boolean hasDomainModelFlowIntent(String input, Set<String> tokens) {
        if (input == null || tokens == null) {
            return false;
        }
        return input.contains("实体")
                || input.contains("模型")
                || input.contains("写表")
                || input.contains("读表")
                || input.contains("数据表")
                || hasChineseCrudIntent(input)
                || hasChineseReadDataIntent(input)
                || hasChineseResponseDataIntent(input)
                || tokens.stream().anyMatch(token -> Set.of(
                        "entity", "model", "schema", "table", "tables"
                ).contains(token));
    }

    private static boolean hasChineseCrudIntent(String input) {
        if (input == null || input.isBlank()) {
            return false;
        }
        return input.contains("保存")
                || input.contains("新增")
                || input.contains("创建")
                || input.contains("更新")
                || input.contains("删除")
                || input.contains("插入")
                || input.contains("修改");
    }

    private static boolean hasChineseReadDataIntent(String input) {
        if (input == null || input.isBlank()) {
            return false;
        }
        return input.contains("查询")
                || input.contains("读取")
                || input.contains("查找")
                || input.contains("检索");
    }

    private static boolean hasChineseResponseDataIntent(String input) {
        if (input == null || input.isBlank()) {
            return false;
        }
        boolean responseVerb = input.contains("返回") || input.contains("响应");
        boolean responsePayload = input.contains("数据")
                || input.contains("结果")
                || input.contains("列表")
                || input.contains("详情");
        return responseVerb && responsePayload;
    }

    public static List<String> methodAnchorFileHints(String queryText) {
        return CodeLocationHintParser.methodAnchorFileHints(queryText);
    }

    public static List<String> pathSuffixHints(String queryText) {
        return CodeLocationHintParser.pathSuffixHints(queryText);
    }

    public static List<String> endpointRouteHints(String queryText) {
        return CodeLocationHintParser.endpointRouteHints(queryText);
    }

    public static List<String> sourceRootHints(String queryText) {
        return CodeLocationHintParser.sourceRootHints(queryText);
    }

    private static void addPathIdentifierTokens(Set<String> tokens, String input) {
        String[] segments = input.replace('\\', '/').split("[^a-zA-Z0-9\u4e00-\u9fa5]+");
        for (int i = segments.length - 1; i >= 0; i--) {
            addIdentifierTokens(tokens, segments[i]);
        }
    }

    private static void addIdentifierTokens(Set<String> tokens, String token) {
        if (token == null || token.isBlank() || tokens.size() >= TOKEN_COLLECT_LIMIT) {
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
            if (tokens.size() >= TOKEN_COLLECT_LIMIT) {
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

    private static List<String> pruneLowSignalTokens(Set<String> tokens) {
        List<String> ordered = new ArrayList<>(tokens);
        if (ordered.size() <= 1) {
            return ordered;
        }
        List<String> specific = ordered.stream()
                .filter(token -> !LOW_SIGNAL_PATH_TOKENS.contains(token))
                .toList();
        return specific.isEmpty() ? ordered : specific;
    }

    private static double pathSuffixHintScore(CodeChunk chunk, List<String> pathSuffixHints) {
        if (chunk == null || pathSuffixHints == null || pathSuffixHints.isEmpty()) {
            return 0.0;
        }
        String path = normalizedPath(chunk.getFilePath());
        String fileName = fileName(path);
        String compactFileName = fileName.replaceAll("[^a-z0-9.]+", "");
        double best = 0.0;
        for (String hint : pathSuffixHints) {
            best = Math.max(best, pathHintMatchScore(path, fileName, compactFileName, hint,
                    150.0, 130.0, 25.0, 40.0, 30.0));
        }
        return best;
    }

    private static double evidenceFilePathHintScore(CodeChunk chunk, List<String> evidenceFilePathHints) {
        if (chunk == null || evidenceFilePathHints == null || evidenceFilePathHints.isEmpty()) {
            return 0.0;
        }
        String path = normalizedPath(chunk.getFilePath());
        String fileName = fileName(path);
        String compactFileName = fileName.replaceAll("[^a-z0-9.]+", "");
        double best = 0.0;
        for (String hint : evidenceFilePathHints) {
            best = Math.max(best, pathHintMatchScore(path, fileName, compactFileName, hint,
                    260.0, 230.0, 50.0, 70.0, 60.0));
        }
        return best;
    }

    static double moduleRootHintScore(CodeChunk chunk, List<String> moduleRootHints) {
        if (chunk == null || moduleRootHints == null || moduleRootHints.isEmpty()) {
            return 0.0;
        }
        String path = normalizedPath(chunk.getFilePath());
        String moduleRoot = normalizedPath(chunk.getModuleRoot());
        String workspaceRoot = normalizedPath(chunk.getWorkspaceRoot());
        if (path.isBlank()) {
            return 0.0;
        }
        double best = 0.0;
        for (String hint : moduleRootHints) {
            String normalizedHint = normalizedPath(hint);
            if (normalizedHint.isBlank() || !normalizedHint.contains("/")) {
                continue;
            }
            if (!moduleRoot.isBlank()
                    && moduleRoot.equals(normalizedHint)
                    && (path.equals(moduleRoot) || path.startsWith(moduleRoot + "/"))) {
                best = Math.max(best, 120.0);
            }
            if (!workspaceRoot.isBlank()
                    && workspaceRoot.equals(normalizedHint)
                    && (path.equals(workspaceRoot) || path.startsWith(workspaceRoot + "/"))) {
                best = Math.max(best, 110.0);
            }
            if (path.equals(normalizedHint) || path.startsWith(normalizedHint + "/")) {
                best = Math.max(best, 90.0);
            }
        }
        return best;
    }

    static double sourceRootHintScore(CodeChunk chunk, List<String> sourceRootHints) {
        if (chunk == null || sourceRootHints == null || sourceRootHints.isEmpty()) {
            return 0.0;
        }
        String path = normalizedPath(chunk.getFilePath());
        if (path.isBlank()) {
            return 0.0;
        }
        double best = 0.0;
        for (String hint : sourceRootHints) {
            String normalizedHint = normalizedPath(hint);
            if (normalizedHint.isBlank()) {
                continue;
            }
            if (path.equals(normalizedHint) || path.startsWith(normalizedHint + "/")) {
                best = Math.max(best, 140.0);
            } else if (!normalizedHint.contains("/") && path.startsWith(normalizedHint + "/")) {
                best = Math.max(best, 80.0);
            }
        }
        return best;
    }

    static double pathHintMatchScore(String chunkPath,
                                     String chunkFileName,
                                     String compactChunkFileName,
                                     String hint,
                                     double exactScore,
                                     double suffixScore,
                                     double containsScore,
                                     double fileNameScore,
                                     double compactFileNameScore) {
        String path = normalizedPath(chunkPath);
        String normalizedHint = normalizedPath(hint);
        if (path.isBlank() || normalizedHint.isBlank()) {
            return 0.0;
        }
        String fileName = chunkFileName == null || chunkFileName.isBlank()
                ? fileName(path)
                : safeLower(chunkFileName);
        String compactFileName = compactChunkFileName == null || compactChunkFileName.isBlank()
                ? fileName.replaceAll("[^a-z0-9.]+", "")
                : safeLower(compactChunkFileName);
        String hintFileName = fileName(normalizedHint);
        String compactHintFileName = hintFileName.replaceAll("[^a-z0-9.]+", "");
        if (path.equals(normalizedHint)) {
            return exactScore;
        }
        boolean protectedRootHint = startsWithProtectedEvidenceRoot(normalizedHint);
        boolean generatedOrNoisePath = isGeneratedOrNoisePath(path);
        if (normalizedHint.contains("/")
                && path.endsWith("/" + normalizedHint)
                && !protectedRootHint
                && !generatedOrNoisePath) {
            return suffixScore;
        }
        if (!hintFileName.isBlank() && fileName.equals(hintFileName)) {
            return fileNameScore;
        }
        if (!compactHintFileName.isBlank() && compactFileName.equals(compactHintFileName)) {
            return compactFileNameScore;
        }
        if (normalizedHint.contains("/")
                && path.contains("/" + normalizedHint)
                && !protectedRootHint
                && !generatedOrNoisePath) {
            return containsScore;
        }
        return 0.0;
    }

    private static double endpointRouteHintScore(CodeChunk chunk,
                                                 List<String> endpointRouteHints,
                                                 List<String> endpointHttpMethodHints) {
        return endpointRouteHintScore(chunk, endpointRouteHints, endpointHttpMethodHints, null);
    }

    private static double endpointRouteHintScore(CodeChunk chunk,
                                                 List<String> endpointRouteHints,
                                                 List<String> endpointHttpMethodHints,
                                                 SpringMappingLookup springMappingLookup) {
        if (chunk == null || endpointRouteHints == null || endpointRouteHints.isEmpty()) {
            return 0.0;
        }
        String content = safeLower(chunk.getContent());
        if (content.isBlank()) {
            return 0.0;
        }
        String routeMentionContent = stripJavaComments(content);
        String path = normalizedPath(chunk.getFilePath());
        String type = evidenceType(chunk);
        SpringMappingLookup lookup = springMappingLookup == null ? SpringMappingLookup.of(content) : springMappingLookup;
        double best = 0.0;
        for (String hint : endpointRouteHints) {
            String normalizedHint = safeLower(hint);
            if (normalizedHint.isBlank()) {
                continue;
            }
            String withoutLeadingSlash = normalizedHint.startsWith("/") ? normalizedHint.substring(1) : normalizedHint;
            boolean exactRoute = routeMentionContent.contains("\"" + normalizedHint + "\"")
                    || routeMentionContent.contains("'" + normalizedHint + "'")
                    || routeMentionContent.contains("`" + normalizedHint + "`");
            boolean routeMention = routeMentionContent.contains(normalizedHint)
                    || (!withoutLeadingSlash.isBlank() && routeMentionContent.contains(withoutLeadingSlash));
            boolean composedSpringRoute = lookup.containsComposedSpringRoute(normalizedHint);
            double exactSpringRouteSpecificity = lookup.exactRouteSpecificityScore(normalizedHint);
            double templatedSpringRouteSpecificity = lookup.templateRouteSpecificityScore(normalizedHint);
            boolean controllerChunk = "CONTROLLER".equals(type);
            boolean strongRouteMatch = exactSpringRouteSpecificity > 0.0
                    || (exactRoute && !controllerChunk)
                    || templatedSpringRouteSpecificity > 0.0
                    || composedSpringRoute;
            double score = 0.0;
            if (exactSpringRouteSpecificity > 0.0) {
                score += 360.0 + exactSpringRouteSpecificity;
            } else if (exactRoute && !controllerChunk) {
                score += 300.0;
            } else if (templatedSpringRouteSpecificity > 0.0) {
                score += 300.0 + templatedSpringRouteSpecificity;
            } else if (composedSpringRoute) {
                score += 260.0;
            } else if (routeMention) {
                score += 150.0;
            }
            if (score > 0.0) {
                score += endpointHttpMethodHintScore(lookup, endpointHttpMethodHints, normalizedHint);
                if (controllerChunk && strongRouteMatch) {
                    score += 120.0;
                } else if (path.contains("/src/api/") || path.contains("/api/")) {
                    score += 60.0;
                }
            }
            best = Math.max(best, score);
        }
        return best;
    }

    private static boolean hasStrongEndpointRouteMatch(CodeChunk chunk, List<String> endpointRouteHints) {
        return hasStrongEndpointRouteMatch(chunk, endpointRouteHints, null);
    }

    private static boolean hasStrongEndpointRouteMatch(CodeChunk chunk,
                                                       List<String> endpointRouteHints,
                                                       SpringMappingLookup springMappingLookup) {
        if (chunk == null || endpointRouteHints == null || endpointRouteHints.isEmpty()) {
            return false;
        }
        String content = safeLower(chunk.getContent());
        if (content.isBlank()) {
            return false;
        }
        String routeMentionContent = stripJavaComments(content);
        String path = normalizedPath(chunk.getFilePath());
        boolean sourceRouteLiteralCarrier = !isDocsOrBuildFile(path)
                && (isRouteConstantHolder(chunk)
                || isFrontendPath(path)
                || path.contains("/src/api/")
                || path.contains("/api/"));
        SpringMappingLookup lookup = springMappingLookup == null ? SpringMappingLookup.of(content) : springMappingLookup;
        for (String hint : endpointRouteHints) {
            String normalizedHint = safeLower(hint);
            if (normalizedHint.isBlank()) {
                continue;
            }
            boolean exactRoute = routeMentionContent.contains("\"" + normalizedHint + "\"")
                    || routeMentionContent.contains("'" + normalizedHint + "'")
                    || routeMentionContent.contains("`" + normalizedHint + "`");
            if (lookup.exactRouteSpecificityScore(normalizedHint) > 0.0
                    || lookup.templateRouteSpecificityScore(normalizedHint) > 0.0
                    || lookup.containsComposedSpringRoute(normalizedHint)
                    || (exactRoute && sourceRouteLiteralCarrier)) {
                return true;
            }
        }
        return false;
    }

    private static boolean hasSpringEndpointRouteMatch(CodeChunk chunk, List<String> endpointRouteHints) {
        return hasSpringEndpointRouteMatch(chunk, endpointRouteHints, null);
    }

    private static boolean hasSpringEndpointRouteMatch(CodeChunk chunk,
                                                       List<String> endpointRouteHints,
                                                       SpringMappingLookup springMappingLookup) {
        if (chunk == null || endpointRouteHints == null || endpointRouteHints.isEmpty()) {
            return false;
        }
        String content = safeLower(chunk.getContent());
        if (content.isBlank()) {
            return false;
        }
        SpringMappingLookup lookup = springMappingLookup == null ? SpringMappingLookup.of(content) : springMappingLookup;
        for (String hint : endpointRouteHints) {
            String normalizedHint = safeLower(hint);
            if (normalizedHint.isBlank()) {
                continue;
            }
            if (lookup.exactRouteSpecificityScore(normalizedHint) > 0.0
                    || lookup.templateRouteSpecificityScore(normalizedHint) > 0.0
                    || lookup.containsComposedSpringRoute(normalizedHint)) {
                return true;
            }
        }
        return false;
    }

    public static boolean hasStrongEndpointRouteMatch(CodeChunk chunk, String queryText) {
        return hasStrongEndpointRouteMatch(chunk, endpointRouteHints(queryText));
    }

    public static boolean hasSpringEndpointRouteMatch(CodeChunk chunk, String queryText) {
        return hasSpringEndpointRouteMatch(chunk, endpointRouteHints(queryText));
    }

    public static boolean hasRouteConstantHolderEndpointMatch(CodeChunk chunk, String queryText) {
        if (chunk == null || queryText == null || queryText.isBlank() || !isRouteConstantHolder(chunk)) {
            return false;
        }
        String content = stripJavaComments(safeLower(chunk.getContent()));
        if (content.isBlank()) {
            return false;
        }
        for (String hint : endpointRouteHints(queryText)) {
            String normalizedHint = safeLower(hint);
            if (normalizedHint.isBlank()) {
                continue;
            }
            if (content.contains("\"" + normalizedHint + "\"")
                    || content.contains("'" + normalizedHint + "'")
                    || content.contains("`" + normalizedHint + "`")) {
                return true;
            }
        }
        return false;
    }

    private static double endpointHttpMethodHintScore(String content,
                                                      List<String> endpointHttpMethodHints,
                                                      String normalizedHint) {
        return endpointHttpMethodHintScore(SpringMappingLookup.of(content), endpointHttpMethodHints, normalizedHint);
    }

    private static double endpointHttpMethodHintScore(SpringMappingLookup springMappingLookup,
                                                      List<String> endpointHttpMethodHints,
                                                      String normalizedHint) {
        if (springMappingLookup == null || endpointHttpMethodHints == null || endpointHttpMethodHints.isEmpty()) {
            return 0.0;
        }
        Set<String> declaredMethods = springMappingLookup.declaredHttpMethodsForRoute(normalizedHint);
        if (declaredMethods.isEmpty()) {
            return 0.0;
        }
        boolean matched = endpointHttpMethodHints.stream()
                .map(CodeChunkRanker::safeLower)
                .anyMatch(declaredMethods::contains);
        return matched ? 90.0 : -80.0;
    }

    private static Set<String> springDeclaredHttpMethodsForRoute(String content, String normalizedHint) {
        if (content == null || content.isBlank() || normalizedHint == null || normalizedHint.isBlank()) {
            return Set.of();
        }
        Set<String> methods = new LinkedHashSet<>();
        String mappingNames = "requestmapping|getmapping|postmapping|putmapping|deletemapping|patchmapping";
        for (SpringMappingLiteral literal : springMappingLiterals(content, mappingNames)) {
            if ((exactRouteSpecificityScore(literal.literal(), normalizedHint) > 0.0
                    || routeTemplateSpecificityScore(literal.literal(), normalizedHint) > 0.0)
                    && !literal.httpMethods().isEmpty()) {
                methods.addAll(literal.httpMethods());
            }
        }
        List<String> segments = Stream.of(normalizedHint.split("/"))
                .filter(segment -> segment != null && !segment.isBlank())
                .toList();
        if (segments.size() < 2) {
            return methods;
        }
        for (int index = 1; index < segments.size(); index++) {
            String prefix = "/" + String.join("/", segments.subList(0, index));
            String suffix = "/" + String.join("/", segments.subList(index, segments.size()));
            List<SpringMappingLiteral> prefixMatches = springMappingLiterals(content, "requestmapping").stream()
                    .filter(literal -> exactRouteSpecificityScore(literal.literal(), prefix) > 0.0
                            || routeTemplateSpecificityScore(literal.literal(), prefix) > 0.0)
                    .toList();
            List<SpringMappingLiteral> suffixMatches = springMappingLiterals(content, mappingNames).stream()
                    .filter(literal -> exactRouteSpecificityScore(literal.literal(), suffix) > 0.0
                            || routeTemplateSpecificityScore(literal.literal(), suffix) > 0.0)
                    .toList();
            for (SpringMappingLiteral prefixMatch : prefixMatches) {
                int classIndex = classDeclarationIndex(content, prefixMatch.index());
                if (classIndex <= prefixMatch.index()) {
                    continue;
                }
                for (SpringMappingLiteral suffixMatch : suffixMatches) {
                    if (!isMappingInsideClass(content, classIndex, suffixMatch.index())) {
                        continue;
                    }
                    if (!suffixMatch.httpMethods().isEmpty()) {
                        methods.addAll(suffixMatch.httpMethods());
                    } else {
                        methods.addAll(prefixMatch.httpMethods());
                    }
                }
            }
        }
        return methods;
    }

    private static boolean containsComposedSpringRoute(String content, String normalizedHint) {
        if (content == null || content.isBlank() || normalizedHint == null || normalizedHint.isBlank()) {
            return false;
        }
        List<String> segments = Stream.of(normalizedHint.split("/"))
                .filter(segment -> segment != null && !segment.isBlank())
                .toList();
        if (segments.size() < 2) {
            return false;
        }
        for (int index = 1; index < segments.size(); index++) {
            String prefix = "/" + String.join("/", segments.subList(0, index));
            String suffix = "/" + String.join("/", segments.subList(index, segments.size()));
            int prefixIndex = springMappingLiteralIndex(content, "requestmapping", prefix);
            int suffixIndex = springMappingLiteralIndex(
                    content,
                    "requestmapping|getmapping|postmapping|putmapping|deletemapping|patchmapping",
                    suffix
            );
            int classIndex = classDeclarationIndex(content, prefixIndex);
            if (prefixIndex >= 0 && classIndex > prefixIndex && isMappingInsideClass(content, classIndex, suffixIndex)) {
                return true;
            }
        }
        return false;
    }

    private static double springExactRouteSpecificityScore(String content, String normalizedHint) {
        return SpringMappingLookup.of(content).exactRouteSpecificityScore(normalizedHint);
    }

    private static double springRouteTemplateSpecificityScore(String content, String normalizedHint) {
        return SpringMappingLookup.of(content).templateRouteSpecificityScore(normalizedHint);
    }

    private static double springMappingLiteralBestExactSpecificity(String content, String mappingNames, String normalizedHint) {
        return springMappingLiteralExactMatches(content, mappingNames, normalizedHint).stream()
                .mapToDouble(SpringMappingMatch::specificityScore)
                .max()
                .orElse(0.0);
    }

    private static List<SpringMappingMatch> springMappingLiteralExactMatches(String content, String mappingNames, String normalizedHint) {
        if (content == null || content.isBlank() || normalizedHint == null || normalizedHint.isBlank()) {
            return List.of();
        }
        List<SpringMappingMatch> matches = new ArrayList<>();
        for (SpringMappingLiteral literal : springMappingLiterals(content, mappingNames)) {
            double specificityScore = exactRouteSpecificityScore(literal.literal(), normalizedHint);
            if (specificityScore > 0.0) {
                matches.add(new SpringMappingMatch(literal.index(), specificityScore));
            }
        }
        return matches;
    }

    private static double springMappingLiteralBestSpecificity(String content, String mappingNames, String normalizedHint) {
        return springMappingLiteralMatchesHint(content, mappingNames, normalizedHint).stream()
                .mapToDouble(SpringMappingMatch::specificityScore)
                .max()
                .orElse(0.0);
    }

    private static List<SpringMappingMatch> springMappingLiteralMatchesHint(String content, String mappingNames, String normalizedHint) {
        if (content == null || content.isBlank() || normalizedHint == null || normalizedHint.isBlank()) {
            return List.of();
        }
        List<SpringMappingMatch> matches = new ArrayList<>();
        for (SpringMappingLiteral literal : springMappingLiterals(content, mappingNames)) {
            double specificityScore = routeTemplateSpecificityScore(literal.literal(), normalizedHint);
            if (specificityScore > 0.0) {
                matches.add(new SpringMappingMatch(literal.index(), specificityScore));
            }
        }
        return matches;
    }

    private static List<SpringMappingLiteral> springMappingLiterals(String content, String mappingNames) {
        if (content == null || content.isBlank() || mappingNames == null || mappingNames.isBlank()) {
            return List.of();
        }
        Pattern annotationPattern = Pattern.compile("(?is)@(" + mappingNames + ")\\s*\\(");
        Pattern literalPattern = Pattern.compile("[\"'`]([^\"'`]+)[\"'`]");
        java.util.regex.Matcher annotationMatcher = annotationPattern.matcher(content);
        List<SpringMappingLiteral> literals = new ArrayList<>();
        while (annotationMatcher.find()) {
            if (isInsideQuotedValueOrJavaComment(content, annotationMatcher.start())) {
                continue;
            }
            String mappingName = safeLower(annotationMatcher.group(1));
            int argumentsStart = annotationMatcher.end();
            int argumentsEnd = findClosingParenthesis(content, argumentsStart - 1);
            if (argumentsEnd < 0) {
                continue;
            }
            String arguments = content.substring(argumentsStart, argumentsEnd);
            Set<String> httpMethods = springMappingHttpMethods(mappingName, arguments);
            Map<String, String> routeConstants = springRouteConstantsForAnnotation(
                    content,
                    annotationMatcher.start(),
                    argumentsEnd + 1
            );
            List<SpringRouteExpression> routeExpressions = springRouteExpressions(arguments);
            for (SpringRouteExpression expression : routeExpressions) {
                boolean constantExpression = isSpringRouteConstantExpression(expression.expression(), routeConstants);
                if (!expression.isConcatenation() && !constantExpression) {
                    continue;
                }
                String route = resolveSpringRouteExpression(expression.expression(), routeConstants);
                if (route != null) {
                    literals.add(new SpringMappingLiteral(annotationMatcher.start(), mappingName, route, httpMethods));
                }
            }
            java.util.regex.Matcher literalMatcher = literalPattern.matcher(arguments);
            while (literalMatcher.find()) {
                if (isInsideConcatenatedRouteExpression(routeExpressions, literalMatcher.start())) {
                    continue;
                }
                if (isRouteMappingLiteral(arguments, literalMatcher.start())) {
                    literals.add(new SpringMappingLiteral(annotationMatcher.start(), mappingName, literalMatcher.group(1), httpMethods));
                }
            }
            java.util.regex.Matcher constantMatcher = Pattern.compile("\\b[A-Za-z_$][A-Za-z0-9_$]*\\b").matcher(arguments);
            while (constantMatcher.find()) {
                if (isInsideConcatenatedRouteExpression(routeExpressions, constantMatcher.start())) {
                    continue;
                }
                String route = routeConstants.get(constantMatcher.group());
                if (route != null && isRouteMappingLiteral(arguments, constantMatcher.start())) {
                    literals.add(new SpringMappingLiteral(annotationMatcher.start(), mappingName, route, httpMethods));
                }
            }
        }
        return literals;
    }

    private static boolean isSpringRouteConstantExpression(String expression, Map<String, String> routeConstants) {
        if (expression == null || expression.isBlank() || routeConstants == null || routeConstants.isEmpty()) {
            return false;
        }
        String trimmed = expression.trim();
        return routeConstants.containsKey(trimmed)
                && Pattern.matches("[A-Za-z_$][A-Za-z0-9_$]*(?:\\.[A-Za-z_$][A-Za-z0-9_$]*)*", trimmed);
    }

    private static boolean isInsideQuotedValueOrJavaComment(String content, int index) {
        if (content == null || index < 0 || index >= content.length()) {
            return false;
        }
        int current = 0;
        while (current < index) {
            char ch = content.charAt(current);
            if (ch == '"' || ch == '\'' || ch == '`') {
                int end = skipQuotedValue(content, current, content.length());
                if (end < 0) {
                    return index > current;
                }
                if (index > current && index < end) {
                    return true;
                }
                current = end;
                continue;
            }
            if (ch == '/' && current + 1 < content.length()) {
                char next = content.charAt(current + 1);
                if (next == '/') {
                    int newline = content.indexOf('\n', current + 2);
                    int end = newline < 0 ? content.length() : newline;
                    if (index >= current && index < end) {
                        return true;
                    }
                    current = newline < 0 ? content.length() : newline + 1;
                    continue;
                }
                if (next == '*') {
                    int commentEnd = content.indexOf("*/", current + 2);
                    int end = commentEnd < 0 ? content.length() : commentEnd + 2;
                    if (index >= current && index < end) {
                        return true;
                    }
                    current = end;
                    continue;
                }
            }
            current++;
        }
        return false;
    }

    private static int findClosingParenthesis(String content, int openParenIndex) {
        if (content == null || openParenIndex < 0 || openParenIndex >= content.length()
                || content.charAt(openParenIndex) != '(') {
            return -1;
        }
        int depth = 0;
        int current = openParenIndex;
        while (current < content.length()) {
            char ch = content.charAt(current);
            if (ch == '"' || ch == '\'' || ch == '`') {
                int end = skipQuotedValue(content, current, content.length());
                if (end < 0) {
                    return -1;
                }
                current = end;
                continue;
            }
            if (ch == '/' && current + 1 < content.length()) {
                char next = content.charAt(current + 1);
                if (next == '/') {
                    int newline = content.indexOf('\n', current + 2);
                    current = newline < 0 ? content.length() : newline + 1;
                    continue;
                }
                if (next == '*') {
                    int commentEnd = content.indexOf("*/", current + 2);
                    if (commentEnd < 0) {
                        return -1;
                    }
                    current = commentEnd + 2;
                    continue;
                }
            }
            if (ch == '(') {
                depth++;
            } else if (ch == ')') {
                depth--;
                if (depth == 0) {
                    return current;
                }
            }
            current++;
        }
        return -1;
    }

    private static Set<String> springMappingHttpMethods(String mappingName, String arguments) {
        return switch (safeLower(mappingName)) {
            case "getmapping" -> Set.of("get");
            case "postmapping" -> Set.of("post");
            case "putmapping" -> Set.of("put");
            case "deletemapping" -> Set.of("delete");
            case "patchmapping" -> Set.of("patch");
            case "requestmapping" -> springRequestMappingHttpMethods(arguments);
            default -> Set.of();
        };
    }

    private static Set<String> springRequestMappingHttpMethods(String arguments) {
        if (arguments == null || arguments.isBlank()) {
            return Set.of();
        }
        Set<String> methods = new LinkedHashSet<>();
        String searchableArguments = stripJavaComments(arguments);
        Pattern methodAttributePattern = Pattern.compile("(?i)\\bmethod\\b\\s*=\\s*");
        java.util.regex.Matcher matcher = methodAttributePattern.matcher(searchableArguments);
        while (matcher.find()) {
            if (isInsideQuotedValue(searchableArguments, matcher.start())) {
                continue;
            }
            int valueStart = nextNonWhitespace(searchableArguments, matcher.end(), searchableArguments.length());
            if (valueStart >= searchableArguments.length()) {
                continue;
            }
            int valueEnd = findSpringRouteExpressionEnd(searchableArguments, valueStart, searchableArguments.length());
            collectBareRequestMethods(searchableArguments.substring(valueStart, valueEnd), methods);
        }
        return methods;
    }

    private static void collectBareRequestMethods(String methodExpression, Set<String> methods) {
        if (methodExpression == null || methodExpression.isBlank()) {
            return;
        }
        String sanitized = stripJavaComments(methodExpression);
        java.util.regex.Matcher matcher = Pattern.compile("(?i)(?<![A-Za-z0-9_$.])(?:RequestMethod\\s*\\.\\s*)?(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)(?![A-Za-z0-9_$])")
                .matcher(sanitized);
        while (matcher.find()) {
            if (isInsideQuotedValue(sanitized, matcher.start())) {
                continue;
            }
            methods.add(matcher.group(1).toLowerCase(Locale.ROOT));
        }
    }

    private static String stripJavaComments(String content) {
        if (content == null || content.isBlank()) {
            return "";
        }
        StringBuilder sanitized = new StringBuilder(content.length());
        int current = 0;
        while (current < content.length()) {
            char ch = content.charAt(current);
            if (ch == '"' || ch == '\'' || ch == '`') {
                int end = skipQuotedValue(content, current, content.length());
                if (end < 0) {
                    sanitized.append(content.substring(current));
                    break;
                }
                sanitized.append(content, current, end);
                current = end;
                continue;
            }
            if (ch == '/' && current + 1 < content.length()) {
                char next = content.charAt(current + 1);
                if (next == '/') {
                    int newline = content.indexOf('\n', current + 2);
                    int end = newline < 0 ? content.length() : newline;
                    sanitized.append(" ".repeat(Math.max(0, end - current)));
                    current = end;
                    continue;
                }
                if (next == '*') {
                    int commentEnd = content.indexOf("*/", current + 2);
                    int end = commentEnd < 0 ? content.length() : commentEnd + 2;
                    sanitized.append(" ".repeat(Math.max(0, end - current)));
                    current = end;
                    continue;
                }
            }
            sanitized.append(ch);
            current++;
        }
        return sanitized.toString();
    }

    private static boolean isInsideQuotedValue(String content, int index) {
        if (content == null || index < 0 || index >= content.length()) {
            return false;
        }
        int current = 0;
        while (current < content.length()) {
            char ch = content.charAt(current);
            if (ch == '"' || ch == '\'' || ch == '`') {
                int end = skipQuotedValue(content, current, content.length());
                if (end < 0) {
                    return index > current;
                }
                if (index > current && index < end) {
                    return true;
                }
                current = end;
                continue;
            }
            current++;
        }
        return false;
    }

    private static Map<String, String> springRouteConstantsForAnnotation(String content, int annotationStart, int annotationEnd) {
        if (content == null || content.isBlank() || annotationStart < 0 || annotationStart >= content.length()) {
            return Map.of();
        }
        SpringClassRange classRange = springClassRangeForAnnotation(content, annotationStart, annotationEnd);
        if (classRange == null) {
            return Map.of();
        }
        Map<String, String> constants = new HashMap<>(qualifiedRouteConstants(content));
        constants.putAll(springRouteConstants(content.substring(classRange.start(), classRange.end())));
        return constants;
    }

    private static Map<String, String> qualifiedRouteConstants(String content) {
        if (content == null || content.isBlank()) {
            return Map.of();
        }
        Map<String, String> constants = new HashMap<>();
        springRouteConstants(content).forEach((key, value) -> {
            if (key != null && key.contains(".")) {
                constants.put(key, value);
            }
        });
        return constants;
    }

    private static SpringClassRange springClassRangeForAnnotation(String content, int annotationStart, int annotationEnd) {
        int nextClassIndex = classDeclarationIndex(content, annotationStart);
        if (nextClassIndex > annotationStart && isClassLevelAnnotationFor(content, annotationEnd, nextClassIndex)) {
            return new SpringClassRange(nextClassIndex, nextClassBoundary(content, nextClassIndex));
        }
        int previousClassIndex = classDeclarationIndexBefore(content, annotationStart);
        if (previousClassIndex >= 0 && isMappingInsideClass(content, previousClassIndex, annotationStart)) {
            return new SpringClassRange(previousClassIndex, nextClassBoundary(content, previousClassIndex));
        }
        return null;
    }

    private static boolean isClassLevelAnnotationFor(String content, int annotationEnd, int classIndex) {
        if (content == null || annotationEnd < 0 || classIndex <= annotationEnd || classIndex > content.length()) {
            return false;
        }
        int index = annotationEnd;
        while (index < classIndex) {
            int skipped = skipWhitespaceAndComments(content, index, classIndex);
            if (skipped >= classIndex) {
                return true;
            }
            index = skipped;
            int annotationSkip = skipJavaAnnotation(content, index, classIndex);
            if (annotationSkip > index) {
                index = annotationSkip;
                continue;
            }
            int modifierSkip = skipClassModifier(content, index, classIndex);
            if (modifierSkip > index) {
                index = modifierSkip;
                continue;
            }
            return false;
        }
        return true;
    }

    private static int skipWhitespaceAndComments(String content, int index, int endExclusive) {
        int current = index;
        while (current < endExclusive) {
            while (current < endExclusive && Character.isWhitespace(content.charAt(current))) {
                current++;
            }
            if (current + 1 >= endExclusive || content.charAt(current) != '/') {
                return current;
            }
            char next = content.charAt(current + 1);
            if (next == '/') {
                int newline = content.indexOf('\n', current + 2);
                current = newline < 0 || newline > endExclusive ? endExclusive : newline + 1;
                continue;
            }
            if (next == '*') {
                int commentEnd = content.indexOf("*/", current + 2);
                current = commentEnd < 0 || commentEnd + 2 > endExclusive ? endExclusive : commentEnd + 2;
                continue;
            }
            return current;
        }
        return current;
    }

    private static int skipJavaAnnotation(String content, int index, int endExclusive) {
        if (index >= endExclusive || content.charAt(index) != '@') {
            return index;
        }
        int current = index + 1;
        if (current >= endExclusive || !isJavaIdentifierStartOrDollar(content.charAt(current))) {
            return index;
        }
        current++;
        while (current < endExclusive) {
            char ch = content.charAt(current);
            if (isJavaIdentifierPartOrDollar(ch) || ch == '.') {
                current++;
                continue;
            }
            break;
        }
        current = skipWhitespaceAndComments(content, current, endExclusive);
        if (current < endExclusive && content.charAt(current) == '(') {
            current = skipBalancedParentheses(content, current, endExclusive);
            if (current < 0) {
                return index;
            }
        }
        return current;
    }

    private static int skipBalancedParentheses(String content, int index, int endExclusive) {
        int depth = 0;
        int current = index;
        while (current < endExclusive) {
            char ch = content.charAt(current);
            if (ch == '"' || ch == '\'' || ch == '`') {
                current = skipQuotedValue(content, current, endExclusive);
                if (current < 0) {
                    return -1;
                }
                continue;
            }
            if (ch == '/' && current + 1 < endExclusive) {
                char next = content.charAt(current + 1);
                if (next == '/') {
                    int newline = content.indexOf('\n', current + 2);
                    current = newline < 0 || newline > endExclusive ? endExclusive : newline + 1;
                    continue;
                }
                if (next == '*') {
                    int commentEnd = content.indexOf("*/", current + 2);
                    if (commentEnd < 0 || commentEnd + 2 > endExclusive) {
                        return -1;
                    }
                    current = commentEnd + 2;
                    continue;
                }
            }
            if (ch == '(') {
                depth++;
            } else if (ch == ')') {
                depth--;
                if (depth == 0) {
                    return current + 1;
                }
            }
            current++;
        }
        return -1;
    }

    private static int skipBalancedBraces(String content, int index, int endExclusive) {
        int depth = 0;
        int current = index;
        while (current < endExclusive) {
            char ch = content.charAt(current);
            if (ch == '"' || ch == '\'' || ch == '`') {
                current = skipQuotedValue(content, current, endExclusive);
                if (current < 0) {
                    return -1;
                }
                continue;
            }
            if (ch == '/' && current + 1 < endExclusive) {
                char next = content.charAt(current + 1);
                if (next == '/') {
                    int newline = content.indexOf('\n', current + 2);
                    current = newline < 0 || newline > endExclusive ? endExclusive : newline + 1;
                    continue;
                }
                if (next == '*') {
                    int commentEnd = content.indexOf("*/", current + 2);
                    if (commentEnd < 0 || commentEnd + 2 > endExclusive) {
                        return -1;
                    }
                    current = commentEnd + 2;
                    continue;
                }
            }
            if (ch == '{') {
                depth++;
            } else if (ch == '}') {
                depth--;
                if (depth == 0) {
                    return current + 1;
                }
            }
            current++;
        }
        return -1;
    }

    private static int skipQuotedValue(String content, int index, int endExclusive) {
        char quote = content.charAt(index);
        int current = index + 1;
        while (current < endExclusive) {
            char ch = content.charAt(current);
            if (ch == '\\') {
                current += 2;
                continue;
            }
            if (ch == quote) {
                return current + 1;
            }
            current++;
        }
        return -1;
    }

    private static int skipClassModifier(String content, int index, int endExclusive) {
        String[] modifiers = {"public", "private", "protected", "abstract", "final", "static", "sealed", "non-sealed", "strictfp"};
        for (String modifier : modifiers) {
            int end = index + modifier.length();
            if (end <= endExclusive
                    && content.regionMatches(index, modifier, 0, modifier.length())
                    && (end == endExclusive || !isJavaIdentifierPartOrDollar(content.charAt(end)))) {
                return end;
            }
        }
        return index;
    }

    private static boolean isJavaIdentifierStartOrDollar(char ch) {
        return Character.isJavaIdentifierStart(ch) || ch == '$';
    }

    private static boolean isJavaIdentifierPartOrDollar(char ch) {
        return Character.isJavaIdentifierPart(ch) || ch == '$';
    }

    private static List<SpringRouteExpression> springRouteExpressions(String arguments) {
        if (arguments == null || arguments.isBlank()) {
            return List.of();
        }
        String trimmed = arguments.trim();
        if (!trimmed.contains("=")) {
            int start = arguments.indexOf(trimmed);
            char first = trimmed.charAt(0);
            if (first == '{' || first == '[') {
                List<SpringRouteExpression> expressions = new ArrayList<>();
                addSpringRouteArrayExpressions(arguments, start, expressions);
                return expressions;
            }
            return List.of(new SpringRouteExpression(start, start + trimmed.length(), trimmed));
        }
        Pattern pattern = Pattern.compile("(?is)\\b(?:value|path)\\b\\s*=\\s*");
        java.util.regex.Matcher matcher = pattern.matcher(arguments);
        List<SpringRouteExpression> expressions = new ArrayList<>();
        while (matcher.find()) {
            int valueStart = nextNonWhitespace(arguments, matcher.end(), arguments.length());
            if (valueStart >= arguments.length()) {
                continue;
            }
            char first = arguments.charAt(valueStart);
            if (first == '{' || first == '[') {
                addSpringRouteArrayExpressions(arguments, valueStart, expressions);
                continue;
            }
            int valueEnd = findSpringRouteExpressionEnd(arguments, valueStart, arguments.length());
            addSpringRouteExpression(arguments, valueStart, valueEnd, expressions);
        }
        return expressions;
    }

    private static void addSpringRouteArrayExpressions(String arguments, int arrayStart, List<SpringRouteExpression> expressions) {
        char open = arguments.charAt(arrayStart);
        char close = open == '{' ? '}' : ']';
        int arrayEnd = findMatchingRouteDelimiter(arguments, arrayStart, arguments.length(), open, close);
        if (arrayEnd < 0) {
            return;
        }
        int elementStart = arrayStart + 1;
        int current = elementStart;
        while (current < arrayEnd) {
            char ch = arguments.charAt(current);
            if (ch == '"' || ch == '\'' || ch == '`') {
                int skipped = skipQuotedValue(arguments, current, arrayEnd);
                if (skipped < 0) {
                    return;
                }
                current = skipped;
                continue;
            }
            if (ch == '(') {
                int skipped = skipBalancedParentheses(arguments, current, arrayEnd);
                if (skipped < 0) {
                    return;
                }
                current = skipped;
                continue;
            }
            if (ch == '[' || ch == '{') {
                int skipped = findMatchingRouteDelimiter(
                        arguments,
                        current,
                        arrayEnd,
                        ch,
                        ch == '[' ? ']' : '}'
                );
                if (skipped < 0) {
                    return;
                }
                current = skipped + 1;
                continue;
            }
            if (ch == ',') {
                addSpringRouteExpression(arguments, elementStart, current, expressions);
                elementStart = current + 1;
            }
            current++;
        }
        addSpringRouteExpression(arguments, elementStart, arrayEnd, expressions);
    }

    private static void addSpringRouteExpression(
            String arguments,
            int expressionStart,
            int expressionEnd,
            List<SpringRouteExpression> expressions
    ) {
        int start = nextNonWhitespace(arguments, expressionStart, expressionEnd);
        int end = expressionEnd;
        while (end > start && Character.isWhitespace(arguments.charAt(end - 1))) {
            end--;
        }
        if (start >= end) {
            return;
        }
        expressions.add(new SpringRouteExpression(start, end, arguments.substring(start, end)));
    }

    private static int nextNonWhitespace(String content, int index, int endExclusive) {
        int current = Math.max(index, 0);
        while (current < endExclusive && Character.isWhitespace(content.charAt(current))) {
            current++;
        }
        return current;
    }

    private static int findSpringRouteExpressionEnd(String arguments, int start, int endExclusive) {
        int current = start;
        while (current < endExclusive) {
            char ch = arguments.charAt(current);
            if (ch == '"' || ch == '\'' || ch == '`') {
                int skipped = skipQuotedValue(arguments, current, endExclusive);
                if (skipped < 0) {
                    return current;
                }
                current = skipped;
                continue;
            }
            if (ch == '(') {
                int skipped = skipBalancedParentheses(arguments, current, endExclusive);
                if (skipped < 0) {
                    return current;
                }
                current = skipped;
                continue;
            }
            if (ch == '[' || ch == '{') {
                int skipped = findMatchingRouteDelimiter(
                        arguments,
                        current,
                        endExclusive,
                        ch,
                        ch == '[' ? ']' : '}'
                );
                if (skipped < 0) {
                    return current;
                }
                current = skipped + 1;
                continue;
            }
            if (ch == ',') {
                return current;
            }
            current++;
        }
        return endExclusive;
    }

    private static int findMatchingRouteDelimiter(
            String content,
            int openIndex,
            int endExclusive,
            char open,
            char close
    ) {
        int depth = 0;
        int current = openIndex;
        while (current < endExclusive) {
            char ch = content.charAt(current);
            if (ch == '"' || ch == '\'' || ch == '`') {
                int skipped = skipQuotedValue(content, current, endExclusive);
                if (skipped < 0) {
                    return -1;
                }
                current = skipped;
                continue;
            }
            if (ch == open) {
                depth++;
            } else if (ch == close) {
                depth--;
                if (depth == 0) {
                    return current;
                }
            }
            current++;
        }
        return -1;
    }

    private static boolean isInsideConcatenatedRouteExpression(List<SpringRouteExpression> expressions, int index) {
        if (expressions == null || expressions.isEmpty()) {
            return false;
        }
        return expressions.stream()
                .anyMatch(expression -> expression.isConcatenation() && expression.contains(index));
    }

    private static String resolveSpringRouteExpression(String expression, Map<String, String> routeConstants) {
        if (expression == null || expression.isBlank()) {
            return null;
        }
        StringBuilder route = new StringBuilder();
        for (String rawPart : splitSpringRouteExpressionParts(expression)) {
            String part = rawPart.trim();
            if (part.isBlank()) {
                return null;
            }
            String literal = quotedLiteralValue(part);
            if (literal != null) {
                route.append(literal);
                continue;
            }
            String constant = routeConstantValue(part, routeConstants);
            if (constant != null) {
                route.append(constant);
                continue;
            }
            return null;
        }
        String resolved = route.toString();
        return resolved.startsWith("/") ? resolved : null;
    }

    private static String routeConstantValue(String expressionPart, Map<String, String> routeConstants) {
        if (expressionPart == null || expressionPart.isBlank() || routeConstants == null || routeConstants.isEmpty()) {
            return null;
        }
        String part = expressionPart.trim();
        String exact = routeConstants.get(part);
        if (exact != null) {
            return exact;
        }
        return null;
    }

    private static List<String> splitSpringRouteExpressionParts(String expression) {
        if (expression == null || expression.isBlank()) {
            return List.of();
        }
        List<String> parts = new ArrayList<>();
        int partStart = 0;
        int current = 0;
        while (current < expression.length()) {
            char ch = expression.charAt(current);
            if (ch == '"' || ch == '\'' || ch == '`') {
                int quoteEnd = skipQuotedValue(expression, current, expression.length());
                current = quoteEnd < 0 ? current + 1 : quoteEnd;
                continue;
            }
            if (ch == '+') {
                parts.add(expression.substring(partStart, current));
                partStart = current + 1;
            }
            current++;
        }
        parts.add(expression.substring(partStart));
        return parts;
    }

    private static boolean hasTopLevelPlus(String expression) {
        if (expression == null || expression.isBlank()) {
            return false;
        }
        int current = 0;
        while (current < expression.length()) {
            char ch = expression.charAt(current);
            if (ch == '"' || ch == '\'' || ch == '`') {
                int quoteEnd = skipQuotedValue(expression, current, expression.length());
                current = quoteEnd < 0 ? current + 1 : quoteEnd;
                continue;
            }
            if (ch == '+') {
                return true;
            }
            current++;
        }
        return false;
    }

    private static String quotedLiteralValue(String value) {
        if (value == null || value.length() < 2) {
            return null;
        }
        char first = value.charAt(0);
        char last = value.charAt(value.length() - 1);
        if ((first == '"' || first == '\'' || first == '`') && first == last) {
            return value.substring(1, value.length() - 1);
        }
        return null;
    }

    private static Map<String, String> springRouteConstants(String content) {
        if (content == null || content.isBlank()) {
            return Map.of();
        }
        Pattern javaStringPattern = Pattern.compile(
                "\\b(?:public|private|protected|static|final|\\s)*(?i:string)\\s+([A-Za-z_$][A-Za-z0-9_$]*)\\s*=\\s*([^;\\n\\r]+)"
        );
        List<SpringRouteConstantDeclaration> declarations = new ArrayList<>();
        java.util.regex.Matcher matcher = javaStringPattern.matcher(content);
        while (matcher.find()) {
            declarations.add(new SpringRouteConstantDeclaration(
                    matcher.group(1),
                    routeConstantDeclarationExpression(matcher.group(2)),
                    enclosingClassQualifiers(content, matcher.start())
            ));
        }
        Pattern kotlinValPattern = Pattern.compile(
                "\\b(?:public|private|protected|internal|open|final|override|\\s)*(?:const\\s+)?val\\s+([A-Za-z_$][A-Za-z0-9_$]*)\\s*(?::\\s*(?i:string))?\\s*=\\s*([^;\\n\\r]+)"
        );
        matcher = kotlinValPattern.matcher(content);
        while (matcher.find()) {
            declarations.add(new SpringRouteConstantDeclaration(
                    matcher.group(1),
                    routeConstantDeclarationExpression(matcher.group(2)),
                    enclosingClassQualifiers(content, matcher.start())
            ));
        }
        Map<String, String> constants = new HashMap<>();
        boolean changed = true;
        int attempts = 0;
        while (changed && attempts < declarations.size()) {
            changed = false;
            attempts++;
            for (SpringRouteConstantDeclaration declaration : declarations) {
                List<String> qualifiedNames = qualifiedConstantNames(declaration);
                if (constants.containsKey(declaration.name())
                        && qualifiedNames.stream().allMatch(constants::containsKey)) {
                    continue;
                }
                String route = resolveSpringRouteExpression(declaration.expression(), constants);
                if (route != null) {
                    if (!constants.containsKey(declaration.name())) {
                        constants.put(declaration.name(), route);
                        changed = true;
                    }
                    for (String qualifiedName : qualifiedNames) {
                        if (!constants.containsKey(qualifiedName)) {
                            constants.put(qualifiedName, route);
                            changed = true;
                        }
                    }
                }
            }
        }
        return constants;
    }

    private static String routeConstantDeclarationExpression(String rawExpression) {
        if (rawExpression == null || rawExpression.isBlank()) {
            return "";
        }
        int end = rawExpression.length();
        int current = 0;
        while (current < rawExpression.length()) {
            char ch = rawExpression.charAt(current);
            if (ch == '"' || ch == '\'' || ch == '`') {
                int quoteEnd = skipQuotedValue(rawExpression, current, rawExpression.length());
                current = quoteEnd < 0 ? current + 1 : quoteEnd;
                continue;
            }
            if (ch == '}') {
                end = current;
                break;
            }
            current++;
        }
        return rawExpression.substring(0, end).trim();
    }

    private static List<String> qualifiedConstantNames(SpringRouteConstantDeclaration declaration) {
        if (declaration == null || declaration.qualifiers() == null || declaration.qualifiers().isEmpty()) {
            return List.of();
        }
        LinkedHashSet<String> names = new LinkedHashSet<>();
        for (String qualifier : declaration.qualifiers()) {
            if (qualifier != null && !qualifier.isBlank()) {
                names.add(qualifier + "." + declaration.name());
            }
        }
        return List.copyOf(names);
    }

    private static String nearestEnclosingClassName(String content, int offset) {
        return enclosingClassQualifiers(content, offset).stream()
                .findFirst()
                .orElse("");
    }

    private static List<String> enclosingClassQualifiers(String content, int offset) {
        if (content == null || content.isBlank() || offset < 0) {
            return List.of();
        }
        List<String> enclosingNames = new ArrayList<>();
        java.util.regex.Matcher matcher = CLASS_DECLARATION_PATTERN.matcher(content);
        while (matcher.find()) {
            if (matcher.start() >= offset) {
                break;
            }
            if (isInsideQuotedValueOrJavaComment(content, matcher.start())) {
                continue;
            }
            int bodyStart = classDeclarationBodyStart(content, matcher.end(), offset);
            if (bodyStart < 0) {
                continue;
            }
            int bodyEnd = skipBalancedBraces(content, bodyStart, content.length());
            if (bodyEnd > offset) {
                enclosingNames.add(matcher.group(1));
            }
        }
        if (enclosingNames.isEmpty()) {
            return List.of();
        }
        LinkedHashSet<String> qualifiers = new LinkedHashSet<>();
        for (int start = enclosingNames.size() - 1; start >= 0; start--) {
            qualifiers.add(String.join(".", enclosingNames.subList(start, enclosingNames.size())));
        }
        return List.copyOf(qualifiers);
    }

    private static int classDeclarationBodyStart(String content, int declarationEnd, int maxIndex) {
        int current = Math.max(declarationEnd, 0);
        int end = Math.min(Math.max(maxIndex, current), content.length());
        while (current < end) {
            int skipped = skipWhitespaceAndComments(content, current, end);
            if (skipped > current) {
                current = skipped;
                continue;
            }
            char ch = content.charAt(current);
            if (ch == '"' || ch == '\'' || ch == '`') {
                int quoteEnd = skipQuotedValue(content, current, end);
                current = quoteEnd < 0 ? current + 1 : quoteEnd;
                continue;
            }
            if (ch == '(') {
                int skippedParentheses = skipBalancedParentheses(content, current, end);
                current = skippedParentheses < 0 ? current + 1 : skippedParentheses;
                continue;
            }
            if (ch == '{') {
                return current;
            }
            if (ch == ';') {
                return -1;
            }
            current++;
        }
        return -1;
    }

    private static boolean isRouteMappingLiteral(String arguments, int literalStart) {
        if (arguments == null || arguments.isBlank() || literalStart < 0 || literalStart > arguments.length()) {
            return false;
        }
        int equalsIndex = arguments.lastIndexOf('=', literalStart);
        if (equalsIndex < 0) {
            return true;
        }
        String beforeEquals = arguments.substring(0, equalsIndex);
        int segmentStart = Math.max(
                Math.max(beforeEquals.lastIndexOf(','), beforeEquals.lastIndexOf('{')),
                beforeEquals.lastIndexOf('}')
        ) + 1;
        String attributeName = beforeEquals.substring(segmentStart).trim();
        return attributeName.equals("value") || attributeName.equals("path");
    }

    private static double exactRouteSpecificityScore(String routeLiteral, String normalizedHint) {
        String route = normalizeRouteLiteral(routeLiteral);
        String hint = normalizeRouteLiteral(normalizedHint);
        if (route.isBlank() || !route.equals(hint)) {
            return 0.0;
        }
        return Stream.of(route.split("/"))
                .filter(segment -> segment != null && !segment.isBlank())
                .mapToDouble(segment -> 32.0)
                .sum();
    }

    private static double routeTemplateSpecificityScore(String routeLiteral, String normalizedHint) {
        String route = normalizeRouteLiteral(routeLiteral);
        String hint = normalizeRouteLiteral(normalizedHint);
        if (route.isBlank() || hint.isBlank()) {
            return 0.0;
        }
        List<String> routeSegments = Stream.of(route.split("/"))
                .filter(segment -> segment != null && !segment.isBlank())
                .toList();
        List<String> hintSegments = Stream.of(hint.split("/"))
                .filter(segment -> segment != null && !segment.isBlank())
                .toList();
        if (routeSegments.size() != hintSegments.size()) {
            return 0.0;
        }
        double score = 0.0;
        for (int index = 0; index < routeSegments.size(); index++) {
            String routeSegment = routeSegments.get(index);
            String hintSegment = hintSegments.get(index);
            if (routeSegment.equals(hintSegment)) {
                score += 24.0;
                continue;
            }
            if (!isSpringPathVariableSegment(routeSegment) || hintSegment.isBlank()) {
                return 0.0;
            }
            score += 4.0;
        }
        return score;
    }

    private static String normalizeRouteLiteral(String route) {
        String normalized = safeLower(route).trim();
        if (normalized.isBlank()) {
            return "";
        }
        int queryIndex = normalized.indexOf('?');
        if (queryIndex >= 0) {
            normalized = normalized.substring(0, queryIndex);
        }
        while (normalized.length() > 1 && normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        return normalized.startsWith("/") ? normalized : "/" + normalized;
    }

    private static boolean isSpringPathVariableSegment(String segment) {
        if (segment == null || segment.length() < 3 || !segment.startsWith("{") || !segment.endsWith("}")) {
            return false;
        }
        String body = segment.substring(1, segment.length() - 1).trim();
        if (body.isBlank() || body.contains("/")) {
            return false;
        }
        int regexSeparator = body.indexOf(':');
        String variableName = regexSeparator < 0 ? body : body.substring(0, regexSeparator).trim();
        String regex = regexSeparator < 0 ? "" : body.substring(regexSeparator + 1).trim();
        return !variableName.isBlank() && (regexSeparator < 0 || !regex.isBlank());
    }

    private static int springMappingLiteralIndex(String content, String mappingNames, String route) {
        if (content == null || content.isBlank() || route == null || route.isBlank()) {
            return -1;
        }
        return springMappingLiterals(content, mappingNames).stream()
                .filter(literal -> exactRouteSpecificityScore(literal.literal(), route) > 0.0)
                .mapToInt(SpringMappingLiteral::index)
                .findFirst()
                .orElse(-1);
    }

    private static int classDeclarationIndex(String content, int afterIndex) {
        if (content == null || content.isBlank() || afterIndex < 0 || afterIndex >= content.length()) {
            return -1;
        }
        java.util.regex.Matcher matcher = CLASS_DECLARATION_PATTERN.matcher(content);
        matcher.region(afterIndex, content.length());
        while (matcher.find()) {
            if (!isInsideQuotedValueOrJavaComment(content, matcher.start())) {
                return matcher.start();
            }
        }
        return -1;
    }

    private static int classDeclarationIndexBefore(String content, int beforeIndex) {
        if (content == null || content.isBlank() || beforeIndex <= 0) {
            return -1;
        }
        int previous = -1;
        java.util.regex.Matcher matcher = CLASS_DECLARATION_PATTERN.matcher(content);
        matcher.region(0, Math.min(beforeIndex, content.length()));
        while (matcher.find()) {
            if (!isInsideQuotedValueOrJavaComment(content, matcher.start())) {
                previous = matcher.start();
            }
        }
        return previous;
    }

    private static int nextClassDeclarationIndex(String content, int startIndex, int endExclusive) {
        int current = Math.max(startIndex, 0);
        int end = Math.min(Math.max(endExclusive, 0), content.length());
        while (current < end) {
            int skipped = skipWhitespaceAndComments(content, current, end);
            if (skipped > current) {
                current = skipped;
                continue;
            }
            char ch = content.charAt(current);
            if (ch == '"' || ch == '\'' || ch == '`') {
                int quoteEnd = skipQuotedValue(content, current, end);
                current = quoteEnd < 0 ? current + 1 : quoteEnd;
                continue;
            }
            if (isClassDeclarationKeywordAt(content, current, end)) {
                return current;
            }
            current++;
        }
        return -1;
    }

    private static boolean isClassDeclarationKeywordAt(String content, int index, int endExclusive) {
        return isClassDeclarationKeywordAt(content, index, endExclusive, "class")
                || isClassDeclarationKeywordAt(content, index, endExclusive, "interface")
                || isClassDeclarationKeywordAt(content, index, endExclusive, "enum")
                || isClassDeclarationKeywordAt(content, index, endExclusive, "object")
                || isClassDeclarationKeywordAt(content, index, endExclusive, "record");
    }

    private static boolean isClassDeclarationKeywordAt(String content, int index, int endExclusive, String keyword) {
        int keywordEnd = index + keyword.length();
        if (keywordEnd > endExclusive || !content.regionMatches(index, keyword, 0, keyword.length())) {
            return false;
        }
        if (index > 0 && isJavaIdentifierPartOrDollar(content.charAt(index - 1))) {
            return false;
        }
        if (keywordEnd < endExclusive && isJavaIdentifierPartOrDollar(content.charAt(keywordEnd))) {
            return false;
        }
        int nameStart = skipWhitespaceAndComments(content, keywordEnd, endExclusive);
        return nameStart < endExclusive && isJavaIdentifierStartOrDollar(content.charAt(nameStart));
    }

    private static int nextClassBoundary(String content, int classIndex) {
        if (content == null || content.isBlank() || classIndex < 0 || classIndex >= content.length()) {
            return content == null ? 0 : content.length();
        }
        int nextClassIndex = classDeclarationIndex(content, classIndex + 1);
        return nextClassIndex < 0 ? content.length() : nextClassIndex;
    }

    private static boolean isMappingInsideClass(String content, int classIndex, int mappingIndex) {
        if (content == null || content.isBlank() || classIndex < 0 || mappingIndex <= classIndex) {
            return false;
        }
        int nextClassIndex = classDeclarationIndex(content, classIndex + 1);
        return nextClassIndex < 0 || mappingIndex < nextClassIndex;
    }

    private static double evidenceLocationHintScore(CodeChunk chunk, List<CodeLocationHintParser.EvidenceLocationHint> evidenceLocationHints) {
        if (chunk == null || evidenceLocationHints == null || evidenceLocationHints.isEmpty()
                || chunk.getStartLine() == null || chunk.getEndLine() == null) {
            return 0.0;
        }
        double best = 0.0;
        for (CodeLocationHintParser.EvidenceLocationHint hint : evidenceLocationHints) {
            if (!matchesEvidenceLocationHint(chunk, hint)) {
                continue;
            }
            CodeLocationHintParser.LineHint lineHint = hint.lineHint();
            best = Math.max(best, 360.0 + tightLineRangeBonus(chunk.getStartLine(), chunk.getEndLine(), lineHint));
        }
        return best;
    }

    private static double lineHintScore(CodeChunk chunk, List<CodeLocationHintParser.LineHint> lineHints) {
        if (lineHints == null || lineHints.isEmpty() || chunk == null || chunk.getStartLine() == null || chunk.getEndLine() == null) {
            return 0.0;
        }
        int chunkStart = chunk.getStartLine();
        int chunkEnd = chunk.getEndLine();
        double best = 0.0;
        for (CodeLocationHintParser.LineHint hint : lineHints) {
            if (chunkStart <= hint.start() && chunkEnd >= hint.end()) {
                best = Math.max(best, 90.0 + tightLineRangeBonus(chunkStart, chunkEnd, hint));
            } else if (chunkStart <= hint.end() && chunkEnd >= hint.start()) {
                best = Math.max(best, 72.0);
            } else {
                int distance = Math.min(Math.abs(chunkStart - hint.end()), Math.abs(hint.start() - chunkEnd));
                if (distance <= 10) {
                    best = Math.max(best, 30.0);
                } else if (distance <= 50) {
                    best = Math.max(best, 10.0);
                }
            }
        }
        return best;
    }

    private static double tightLineRangeBonus(int chunkStart, int chunkEnd, CodeLocationHintParser.LineHint hint) {
        int chunkSpan = Math.max(1, chunkEnd - chunkStart + 1);
        int hintSpan = Math.max(1, hint.end() - hint.start() + 1);
        int extraSpan = Math.max(0, chunkSpan - hintSpan);
        if (extraSpan <= 20) {
            return 18.0;
        }
        if (extraSpan <= 60) {
            return 12.0;
        }
        if (extraSpan <= 140) {
            return 6.0;
        }
        return 0.0;
    }

    private static double methodHintScore(CodeChunk chunk, List<CodeLocationHintParser.MethodHint> methodHints) {
        if (chunk == null || methodHints == null || methodHints.isEmpty()) {
            return 0.0;
        }
        String path = normalizedPath(chunk.getFilePath());
        String fileName = fileName(path);
        String compactFileName = fileName.replaceAll("[^a-z0-9]+", "");
        String content = safeLower(chunk.getContent());
        double best = 0.0;
        for (CodeLocationHintParser.MethodHint hint : methodHints) {
            boolean classInFile = METHOD_HINT_EXTENSIONS.stream()
                    .anyMatch(extension -> fileName.equals(hint.normalizedClassName() + extension))
                    || compactFileName.contains(hint.normalizedClassName());
            boolean classInPath = path.contains(hint.normalizedClassName());
            double qualifiedPathScore = qualifiedClassPathScore(path, hint.rawClassName());
            boolean methodCallLike = containsMethodInvocation(content, hint.methodName());
            boolean methodMentioned = content.contains(hint.methodName());

            double score = 0.0;
            if (qualifiedPathScore > 0.0) {
                score += qualifiedPathScore;
            }
            if (classInFile) {
                score += 70.0;
            } else if (classInPath) {
                score += 30.0;
            }
            if (methodCallLike) {
                score += 85.0;
            } else if (methodMentioned) {
                score += 35.0;
            }
            if ((classInFile || classInPath) && (methodCallLike || methodMentioned)) {
                score += 45.0;
            }
            if (qualifiedPathScore > 0.0 && (methodCallLike || methodMentioned)) {
                score += 35.0;
            }
            best = Math.max(best, score);
        }
        return best;
    }

    private static double qualifiedClassPathScore(String path, String rawClassName) {
        if (path == null || path.isBlank() || rawClassName == null || rawClassName.isBlank() || !rawClassName.contains(".")) {
            return 0.0;
        }
        String classPath = rawClassName.trim().replace('.', '/').toLowerCase(Locale.ROOT);
        if (classPath.isBlank() || classPath.contains("..") || classPath.startsWith("/") || classPath.endsWith("/")) {
            return 0.0;
        }
        for (String extension : METHOD_HINT_EXTENSIONS) {
            String suffix = classPath + extension;
            if (path.equals(suffix)) {
                return 120.0;
            }
            if (path.endsWith("/" + suffix)) {
                return 110.0;
            }
        }
        return 0.0;
    }

    private static double functionFileHintScore(CodeChunk chunk, List<CodeLocationHintParser.FunctionFileHint> functionFileHints) {
        if (chunk == null || functionFileHints == null || functionFileHints.isEmpty()) {
            return 0.0;
        }
        String fileName = fileName(normalizedPath(chunk.getFilePath()));
        String compactFileName = fileName.replaceAll("[^a-z0-9.]+", "");
        String content = safeLower(chunk.getContent());
        double best = 0.0;
        for (CodeLocationHintParser.FunctionFileHint hint : functionFileHints) {
            boolean sameFile = fileName.equals(hint.fileName()) || compactFileName.equals(hint.compactFileName());
            boolean methodCallLike = containsMethodInvocation(content, hint.methodName());
            boolean methodMentioned = content.contains(hint.methodName());

            double score = 0.0;
            if (sameFile) {
                score += 70.0;
            }
            if (methodCallLike) {
                score += 85.0;
            } else if (methodMentioned) {
                score += 35.0;
            }
            if (sameFile && (methodCallLike || methodMentioned)) {
                score += 45.0;
            }
            best = Math.max(best, score);
        }
        return best;
    }

    private static boolean hasOnlyMiddlePathHintMatch(String path,
                                                      String fileName,
                                                      String compactFileName,
                                                      List<String> pathSuffixHints,
                                                      List<String> evidenceFilePathHints) {
        List<String> hints = Stream.concat(
                        pathSuffixHints == null ? Stream.empty() : pathSuffixHints.stream(),
                        evidenceFilePathHints == null ? Stream.empty() : evidenceFilePathHints.stream())
                .toList();
        boolean foundMiddleContains = false;
        for (String hint : hints) {
            String normalizedHint = normalizedPath(hint);
            if (normalizedHint.isBlank()) {
                continue;
            }
            String hintFileName = fileName(normalizedHint);
            String compactHintFileName = hintFileName.replaceAll("[^a-z0-9.]+", "");
            if (path.equals(normalizedHint)
                    || (normalizedHint.contains("/") && path.endsWith("/" + normalizedHint))
                    || (!hintFileName.isBlank() && fileName.equals(hintFileName))
                    || (!compactHintFileName.isBlank() && compactFileName.equals(compactHintFileName))) {
                return false;
            }
            if (normalizedHint.contains("/") && path.contains("/" + normalizedHint)) {
                foundMiddleContains = true;
            }
        }
        return foundMiddleContains;
    }

    private static boolean hasProtectedRootMiddlePathHintMatch(String path,
                                                               List<String> pathSuffixHints,
                                                               List<String> evidenceFilePathHints,
                                                               List<CodeLocationHintParser.EvidenceLocationHint> evidenceLocationHints) {
        if (path == null || path.isBlank()) {
            return false;
        }
        Stream<String> evidenceLocationPaths = evidenceLocationHints == null
                ? Stream.empty()
                : evidenceLocationHints.stream()
                .filter(Objects::nonNull)
                .map(CodeLocationHintParser.EvidenceLocationHint::filePath);
        List<String> hints = Stream.of(
                        pathSuffixHints == null ? Stream.<String>empty() : pathSuffixHints.stream(),
                        evidenceFilePathHints == null ? Stream.<String>empty() : evidenceFilePathHints.stream(),
                        evidenceLocationPaths)
                .flatMap(stream -> stream)
                .toList();
        for (String hint : hints) {
            String normalizedHint = normalizedPath(hint);
            if (normalizedHint.isBlank() || !startsWithProtectedEvidenceRoot(normalizedHint)) {
                continue;
            }
            if (!path.equals(normalizedHint) && path.endsWith("/" + normalizedHint)) {
                return true;
            }
        }
        return false;
    }

    private static boolean isGeneratedOrNoisePath(String path) {
        return path.startsWith("generated/")
                || path.startsWith(".generated/")
                || path.startsWith("fixtures/")
                || path.startsWith("__fixtures__/")
                || path.startsWith("testdata/")
                || path.startsWith("test-data/")
                || path.startsWith("metadata/")
                || path.contains("/generated/")
                || path.contains("/.generated/")
                || path.contains("/fixtures/")
                || path.contains("/__fixtures__/")
                || path.contains("/testdata/")
                || path.contains("/test-data/")
                || path.contains("/metadata/")
                || path.endsWith("/metadata.ts")
                || path.endsWith("/metadata.js")
                || path.endsWith("/metadata.json");
    }

    private static boolean containsAnyLineHint(CodeChunk chunk, List<CodeLocationHintParser.LineHint> lineHints) {
        if (chunk == null || lineHints == null || lineHints.isEmpty()
                || chunk.getStartLine() == null || chunk.getEndLine() == null) {
            return false;
        }
        int chunkStart = chunk.getStartLine();
        int chunkEnd = chunk.getEndLine();
        return lineHints.stream().anyMatch(hint -> chunkStart <= hint.start() && chunkEnd >= hint.end());
    }

    private static boolean containsLineHint(CodeChunk chunk, CodeLocationHintParser.LineHint lineHint) {
        return chunk != null && lineHint != null
                && chunk.getStartLine() != null && chunk.getEndLine() != null
                && chunk.getStartLine() <= lineHint.start()
                && chunk.getEndLine() >= lineHint.end();
    }

    private static boolean matchesEvidenceLocationHint(CodeChunk chunk, List<CodeLocationHintParser.EvidenceLocationHint> evidenceLocationHints) {
        if (chunk == null || evidenceLocationHints == null || evidenceLocationHints.isEmpty()) {
            return false;
        }
        return evidenceLocationHints.stream().anyMatch(hint -> matchesEvidenceLocationHint(chunk, hint));
    }

    private static boolean matchesEvidenceLocationHint(CodeChunk chunk, CodeLocationHintParser.EvidenceLocationHint hint) {
        if (chunk == null || hint == null || hint.filePath() == null || hint.filePath().isBlank()
                || hint.lineHint() == null || chunk.getStartLine() == null || chunk.getEndLine() == null) {
            return false;
        }
        CodeLocationHintParser.LineHint lineHint = hint.lineHint();
        return chunk.getStartLine() <= lineHint.start()
                && chunk.getEndLine() >= lineHint.end()
                && matchesEvidencePathHint(chunk, hint.filePath());
    }

    private static boolean matchesEvidencePathHint(CodeChunk chunk, String hint) {
        if (chunk == null || hint == null || hint.isBlank()) {
            return false;
        }
        String path = normalizedPath(chunk.getFilePath());
        String normalizedHint = normalizedPath(hint);
        if (normalizedHint.isBlank()) {
            return false;
        }
        if (path.equals(normalizedHint)) {
            return true;
        }
        if (normalizedHint.contains("/")
                && path.endsWith("/" + normalizedHint)
                && !startsWithProtectedEvidenceRoot(normalizedHint)) {
            return !isGeneratedOrNoisePath(path);
        }
        if (normalizedHint.contains("/")) {
            return false;
        }
        String fileName = fileName(path);
        String hintFileName = fileName(normalizedHint);
        String compactFileName = fileName.replaceAll("[^a-z0-9.]+", "");
        String compactHintFileName = hintFileName.replaceAll("[^a-z0-9.]+", "");
        return !hintFileName.isBlank() && (fileName.equals(hintFileName) || compactFileName.equals(compactHintFileName));
    }

    private static boolean startsWithProtectedEvidenceRoot(String normalizedHint) {
        if (normalizedHint == null || normalizedHint.isBlank()) {
            return false;
        }
        int slash = normalizedHint.indexOf('/');
        String firstSegment = slash < 0 ? normalizedHint : normalizedHint.substring(0, slash);
        return PROTECTED_EVIDENCE_ROOT_SEGMENTS.contains(firstSegment);
    }

    private static boolean matchesStrictPathHint(CodeChunk chunk, List<String> pathSuffixHints) {
        if (chunk == null || pathSuffixHints == null || pathSuffixHints.isEmpty()) {
            return false;
        }
        String path = normalizedPath(chunk.getFilePath());
        String fileName = fileName(path);
        String compactFileName = fileName.replaceAll("[^a-z0-9.]+", "");
        boolean hasPathHint = pathSuffixHints.stream().anyMatch(hint -> normalizedPath(hint).contains("/"));
        for (String hint : pathSuffixHints) {
            String normalizedHint = normalizedPath(hint);
            if (normalizedHint.isBlank()) {
                continue;
            }
            if (hasPathHint && !normalizedHint.contains("/")) {
                continue;
            }
            if (path.equals(normalizedHint)) {
                return true;
            }
            if (normalizedHint.contains("/")
                    && path.endsWith("/" + normalizedHint)
                    && !startsWithProtectedEvidenceRoot(normalizedHint)
                    && !isGeneratedOrNoisePath(path)) {
                return true;
            }
            if (!hasPathHint) {
                String hintFileName = fileName(normalizedHint);
                String compactHintFileName = hintFileName.replaceAll("[^a-z0-9.]+", "");
                if (!hintFileName.isBlank() && (fileName.equals(hintFileName) || compactFileName.equals(compactHintFileName))) {
                    return true;
                }
            }
        }
        return false;
    }

    private static boolean matchesMethodAnchorFileHint(CodeChunk chunk, List<String> fileHints) {
        if (chunk == null || fileHints == null || fileHints.isEmpty()) {
            return false;
        }
        String path = normalizedPath(chunk.getFilePath());
        String fileName = fileName(path);
        String compactFileName = fileName.replaceAll("[^a-z0-9.]+", "");
        for (String hint : fileHints) {
            String normalizedHint = normalizedPath(hint);
            if (normalizedHint.isBlank()) {
                continue;
            }
            String hintFileName = fileName(normalizedHint);
            String compactHintFileName = hintFileName.replaceAll("[^a-z0-9.]+", "");
            if (path.equals(normalizedHint)
                    || (normalizedHint.contains("/") && path.endsWith("/" + normalizedHint))
                    || (!hintFileName.isBlank() && (fileName.equals(hintFileName) || compactFileName.equals(compactHintFileName)))) {
                return true;
            }
        }
        return false;
    }

    private static double roleIntentScore(CodeChunk chunk, List<String> roleIntents) {
        if (chunk == null || roleIntents == null || roleIntents.isEmpty()) {
            return 0.0;
        }
        String type = evidenceType(chunk);
        if (roleIntents.contains(type)) {
            int intentIndex = Math.max(0, roleIntents.indexOf(type));
            double orderedRoleScore = switch (intentIndex) {
                case 0 -> 720.0;
                case 1 -> 260.0;
                case 2 -> 220.0;
                default -> 160.0;
            };
            if ("TEST".equals(type) || "DOCUMENTATION".equals(type)) {
                return Math.max(260.0, orderedRoleScore);
            }
            return orderedRoleScore;
        }
        if ("FRONTEND".equals(type)) {
            return -35.0;
        }
        if ("TEST".equals(type)) {
            return -180.0;
        }
        if ("DOCUMENTATION".equals(type) || "CONFIG".equals(type)) {
            return -20.0;
        }
        return -8.0;
    }

    private static boolean isTestSourcePath(String path) {
        String normalized = normalizedPath(path);
        String fileName = fileName(normalized);
        return normalized.contains("/test/")
                || normalized.contains("/tests/")
                || normalized.startsWith("test/")
                || normalized.startsWith("tests/")
                || fileName.contains("test")
                || fileName.contains("spec");
    }

    private static boolean hasExplicitFileLocationHint(CodeChunk chunk,
                                                       List<CodeLocationHintParser.FunctionFileHint> functionFileHints,
                                                       List<String> pathSuffixHints,
                                                       List<String> evidenceFilePathHints,
                                                       List<CodeLocationHintParser.EvidenceLocationHint> evidenceLocationHints) {
        if (chunk == null) {
            return false;
        }
        List<String> fileHints = new ArrayList<>();
        if (functionFileHints != null) {
            for (CodeLocationHintParser.FunctionFileHint hint : functionFileHints) {
                if (hint != null && hint.fileName() != null && !hint.fileName().isBlank()) {
                    fileHints.add(hint.fileName());
                }
            }
        }
        if (pathSuffixHints != null) {
            fileHints.addAll(pathSuffixHints);
        }
        if (evidenceFilePathHints != null) {
            fileHints.addAll(evidenceFilePathHints);
        }
        if (evidenceLocationHints != null) {
            for (CodeLocationHintParser.EvidenceLocationHint hint : evidenceLocationHints) {
                if (hint != null && hint.filePath() != null && !hint.filePath().isBlank()) {
                    fileHints.add(hint.filePath());
                }
            }
        }
        return matchesMethodAnchorFileHint(chunk, fileHints);
    }

    private static boolean containsMethodInvocation(String content, String methodName) {
        if (content.isBlank() || methodName.isBlank()) {
            return false;
        }
        Pattern methodPattern = Pattern.compile("(?i)\\b" + Pattern.quote(methodName) + "\\s*\\(");
        return methodPattern.matcher(content).find();
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
            case "controller", "route", "router", "api", "endpoint", "endpoints", "handler", "接口", "路由" -> sourceRoleScore(path, fileName, content,
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
        if (isTestSourcePath(path)) {
            return false;
        }
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

    private static boolean isConfigPath(String path) {
        String fileName = fileName(path);
        if (isCommandSourcePath(path)) {
            return false;
        }
        return path.contains("/config/")
                || fileName.equals("application.yml")
                || fileName.equals("application.yaml")
                || fileName.equals("application.properties")
                || fileName.equals("bootstrap.yml")
                || fileName.equals("bootstrap.yaml")
                || fileName.equals("bootstrap.properties")
                || fileName.equals("logback-spring.xml")
                || fileName.equals(".env")
                || path.endsWith(".env")
                || path.endsWith(".yml")
                || path.endsWith(".yaml")
                || path.endsWith(".properties")
                || path.endsWith(".json")
                || path.endsWith(".xml");
    }

    private static boolean isFrontendPath(String path) {
        boolean frontendExtension = path.endsWith(".vue")
                || path.endsWith(".tsx")
                || path.endsWith(".jsx")
                || path.endsWith(".ts")
                || path.endsWith(".js")
                || path.endsWith(".css")
                || path.endsWith(".scss")
                || path.endsWith(".sass")
                || path.endsWith(".less");
        return path.endsWith(".vue")
                || path.endsWith(".tsx")
                || path.endsWith(".jsx")
                || path.contains("/components/")
                || path.contains("/views/")
                || (frontendExtension && path.contains("/web-console/src/"))
                || (frontendExtension && path.contains("/admin/src/"))
                || (frontendExtension && path.contains("/front/src/"))
                || (frontendExtension && path.contains("/src/api/"));
    }

    private static boolean isCommandSourcePath(String path) {
        return isSourceFile(path) && (path.contains("/src/commands/") || path.startsWith("src/commands/"));
    }

    private static boolean isDomainModelPath(String path, String fileName, String content) {
        if (content.contains("@table") || content.contains("@tablename")) {
            return true;
        }
        boolean sourceModelName = path.contains("/entity/")
                || path.contains("/model/")
                || fileName.contains("entity")
                || fileName.contains("model");
        if (!sourceModelName) {
            return false;
        }
        return path.endsWith(".java")
                || path.endsWith(".kt")
                || path.endsWith(".py")
                || path.endsWith(".go")
                || path.endsWith(".rs");
    }

    private static boolean isDocsOrBuildFile(String path) {
        String name = fileName(path);
        return name.equals("readme.md")
                || name.equals("agents.md")
                || name.equals("changelog.md")
                || name.equals("license")
                || name.equals("pom.xml")
                || (name.startsWith("pom-") && name.endsWith(".xml"))
                || name.equals("build.gradle")
                || name.equals("build.gradle.kts")
                || name.equals("settings.gradle")
                || name.equals("settings.gradle.kts")
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

    private static final class SpringMappingLookup {
        private static final String ALL_MAPPING_NAMES = "requestmapping|getmapping|postmapping|putmapping|deletemapping|patchmapping";
        private static final SpringMappingLookup EMPTY = new SpringMappingLookup("", List.of(), List.of());

        private final String content;
        private final List<SpringMappingLiteral> allMappings;
        private final List<SpringMappingLiteral> requestMappings;
        private final Map<String, Double> exactRouteScoreCache = new HashMap<>();
        private final Map<String, Double> templateRouteScoreCache = new HashMap<>();
        private final Map<String, Boolean> composedRouteCache = new HashMap<>();
        private final Map<String, Set<String>> declaredMethodsCache = new HashMap<>();

        private SpringMappingLookup(String content,
                                    List<SpringMappingLiteral> allMappings,
                                    List<SpringMappingLiteral> requestMappings) {
            this.content = content;
            this.allMappings = allMappings;
            this.requestMappings = requestMappings;
        }

        private static SpringMappingLookup of(String content) {
            String normalized = safeLower(content);
            if (normalized.isBlank() || !hasSpringMappingAnnotation(normalized)) {
                return EMPTY;
            }
            List<SpringMappingLiteral> allMappings = springMappingLiterals(normalized, ALL_MAPPING_NAMES);
            if (allMappings.isEmpty()) {
                return EMPTY;
            }
            List<SpringMappingLiteral> requestMappings = allMappings.stream()
                    .filter(literal -> literal.mappingName().equals("requestmapping"))
                    .toList();
            return new SpringMappingLookup(normalized, allMappings, requestMappings);
        }

        private double exactRouteSpecificityScore(String normalizedHint) {
            String hint = safeLower(normalizedHint);
            if (hint.isBlank() || allMappings.isEmpty()) {
                return 0.0;
            }
            return exactRouteScoreCache.computeIfAbsent(hint, this::computeExactRouteSpecificityScore);
        }

        private double templateRouteSpecificityScore(String normalizedHint) {
            String hint = safeLower(normalizedHint);
            if (hint.isBlank() || allMappings.isEmpty()) {
                return 0.0;
            }
            return templateRouteScoreCache.computeIfAbsent(hint, this::computeTemplateRouteSpecificityScore);
        }

        private boolean containsComposedSpringRoute(String normalizedHint) {
            String hint = safeLower(normalizedHint);
            if (hint.isBlank() || allMappings.isEmpty() || requestMappings.isEmpty()) {
                return false;
            }
            return composedRouteCache.computeIfAbsent(hint, this::computeContainsComposedSpringRoute);
        }

        private Set<String> declaredHttpMethodsForRoute(String normalizedHint) {
            String hint = safeLower(normalizedHint);
            if (hint.isBlank() || allMappings.isEmpty()) {
                return Set.of();
            }
            return declaredMethodsCache.computeIfAbsent(hint, this::computeDeclaredHttpMethodsForRoute);
        }

        private double computeExactRouteSpecificityScore(String normalizedHint) {
            double best = exactMatches(allMappings, normalizedHint).stream()
                    .mapToDouble(SpringMappingMatch::specificityScore)
                    .max()
                    .orElse(0.0);
            for (RouteSplit split : routeSplits(normalizedHint)) {
                List<SpringMappingMatch> prefixMatches = exactMatches(requestMappings, split.prefix());
                List<SpringMappingMatch> suffixMatches = exactMatches(allMappings, split.suffix());
                best = Math.max(best, bestComposedSpecificity(prefixMatches, suffixMatches));
            }
            return best;
        }

        private double computeTemplateRouteSpecificityScore(String normalizedHint) {
            double best = templateMatches(allMappings, normalizedHint).stream()
                    .mapToDouble(SpringMappingMatch::specificityScore)
                    .max()
                    .orElse(0.0);
            for (RouteSplit split : routeSplits(normalizedHint)) {
                List<SpringMappingMatch> prefixMatches = templateMatches(requestMappings, split.prefix());
                List<SpringMappingMatch> suffixMatches = templateMatches(allMappings, split.suffix());
                best = Math.max(best, bestComposedSpecificity(prefixMatches, suffixMatches));
            }
            return best;
        }

        private boolean computeContainsComposedSpringRoute(String normalizedHint) {
            for (RouteSplit split : routeSplits(normalizedHint)) {
                List<SpringMappingMatch> prefixMatches = exactMatches(requestMappings, split.prefix());
                List<SpringMappingMatch> suffixMatches = exactMatches(allMappings, split.suffix());
                if (bestComposedSpecificity(prefixMatches, suffixMatches) > 0.0) {
                    return true;
                }
            }
            return false;
        }

        private Set<String> computeDeclaredHttpMethodsForRoute(String normalizedHint) {
            Set<String> methods = new LinkedHashSet<>();
            for (SpringMappingLiteral literal : allMappings) {
                if ((CodeChunkRanker.exactRouteSpecificityScore(literal.literal(), normalizedHint) > 0.0
                        || routeTemplateSpecificityScore(literal.literal(), normalizedHint) > 0.0)
                        && !literal.httpMethods().isEmpty()) {
                    methods.addAll(literal.httpMethods());
                }
            }
            for (RouteSplit split : routeSplits(normalizedHint)) {
                List<SpringMappingMatch> prefixMatches = templateMatches(requestMappings, split.prefix());
                List<SpringMappingMatch> suffixMatches = templateMatches(allMappings, split.suffix());
                for (SpringMappingMatch prefixMatch : prefixMatches) {
                    int classIndex = classDeclarationIndex(content, prefixMatch.index());
                    if (classIndex <= prefixMatch.index()) {
                        continue;
                    }
                    for (SpringMappingMatch suffixMatch : suffixMatches) {
                        if (!isMappingInsideClass(content, classIndex, suffixMatch.index())) {
                            continue;
                        }
                        SpringMappingLiteral suffixLiteral = literalAt(suffixMatch.index());
                        SpringMappingLiteral prefixLiteral = literalAt(prefixMatch.index());
                        if (suffixLiteral != null && !suffixLiteral.httpMethods().isEmpty()) {
                            methods.addAll(suffixLiteral.httpMethods());
                        } else if (prefixLiteral != null) {
                            methods.addAll(prefixLiteral.httpMethods());
                        }
                    }
                }
            }
            return methods;
        }

        private double bestComposedSpecificity(List<SpringMappingMatch> prefixMatches,
                                               List<SpringMappingMatch> suffixMatches) {
            double best = 0.0;
            for (SpringMappingMatch prefixMatch : prefixMatches) {
                int classIndex = classDeclarationIndex(content, prefixMatch.index());
                if (classIndex <= prefixMatch.index()) {
                    continue;
                }
                for (SpringMappingMatch suffixMatch : suffixMatches) {
                    if (isMappingInsideClass(content, classIndex, suffixMatch.index())) {
                        best = Math.max(best, prefixMatch.specificityScore() + suffixMatch.specificityScore());
                    }
                }
            }
            return best;
        }

        private SpringMappingLiteral literalAt(int index) {
            return allMappings.stream()
                    .filter(literal -> literal.index() == index)
                    .findFirst()
                    .orElse(null);
        }

        private static List<SpringMappingMatch> exactMatches(List<SpringMappingLiteral> literals, String normalizedHint) {
            List<SpringMappingMatch> matches = new ArrayList<>();
            for (SpringMappingLiteral literal : literals) {
                double specificityScore = CodeChunkRanker.exactRouteSpecificityScore(literal.literal(), normalizedHint);
                if (specificityScore > 0.0) {
                    matches.add(new SpringMappingMatch(literal.index(), specificityScore));
                }
            }
            return matches;
        }

        private static List<SpringMappingMatch> templateMatches(List<SpringMappingLiteral> literals, String normalizedHint) {
            List<SpringMappingMatch> matches = new ArrayList<>();
            for (SpringMappingLiteral literal : literals) {
                double specificityScore = routeTemplateSpecificityScore(literal.literal(), normalizedHint);
                if (specificityScore > 0.0) {
                    matches.add(new SpringMappingMatch(literal.index(), specificityScore));
                }
            }
            return matches;
        }

        private static List<RouteSplit> routeSplits(String normalizedHint) {
            List<String> segments = Stream.of(normalizedHint.split("/"))
                    .filter(segment -> segment != null && !segment.isBlank())
                    .toList();
            if (segments.size() < 2) {
                return List.of();
            }
            List<RouteSplit> splits = new ArrayList<>();
            for (int index = 1; index < segments.size(); index++) {
                splits.add(new RouteSplit(
                        "/" + String.join("/", segments.subList(0, index)),
                        "/" + String.join("/", segments.subList(index, segments.size()))
                ));
            }
            return splits;
        }
    }

    private record SpringMappingLiteral(int index, String mappingName, String literal, Set<String> httpMethods) {
    }

    private record RouteSplit(String prefix, String suffix) {
    }

    private record SpringRouteConstantDeclaration(String name, String expression, List<String> qualifiers) {
    }

    private record SpringClassRange(int start, int end) {
    }

    private record SpringRouteExpression(int start, int end, String expression) {
        private boolean isConcatenation() {
            return hasTopLevelPlus(expression);
        }

        private boolean contains(int index) {
            return index >= start && index < end;
        }
    }

    private record SpringMappingMatch(int index, double specificityScore) {
    }

    private record ScoredChunk(CodeChunk chunk, double score) {
    }

    public record RouteAwareScoredChunk(CodeChunk chunk,
                                        double score,
                                        boolean strongEndpointRouteMatch,
                                        boolean springMappingRouteMatch) {
    }
}
