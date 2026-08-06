package com.sourcelens.module.analysis.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

final class CodeLocationHintParser {

    private static final List<String> METHOD_HINT_EXTENSIONS = List.of(".java", ".kt", ".ts", ".tsx", ".js", ".jsx", ".vue");
    private static final String INDEXED_PATH_EXTENSION_PATTERN =
            "properties|tsx|jsx|vue|cpp|hpp|html|scss|yaml|java|kts|kt|ts|js|py|go|rs|cs|css|sql|xml|yml|md|sh|c|h";
    private static final String PATH_EXTENSION_BOUNDARY_PATTERN = "(?=$|[\\s)\\]}>\"'`,]|[?#]|:\\d{1,7})";
    private static final int MAX_JSON_CANDIDATE_LENGTH = 20_000;
    private static final int MAX_JSON_TRAVERSAL_DEPTH = 80;
    private static final int MAX_JSON_TRAVERSAL_NODES = 2_000;
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final Pattern PATH_LINE_HINT_PATTERN = Pattern.compile("(?i)[:#]\\s*L?(\\d{1,7})(?::\\d{1,7})?(?:\\s*[-~]\\s*L?(\\d{1,7})(?::\\d{1,7})?)?");
    private static final Pattern WORD_LINE_HINT_PATTERN = Pattern.compile("(?i)\\b(?:line|lines)\\s+(\\d{1,7})(?:\\s*[-~]\\s*(\\d{1,7}))?");
    private static final Pattern CJK_LINE_HINT_PATTERN = Pattern.compile("\\u7b2c\\s*(\\d{1,7})\\s*\\u884c");
    private static final Pattern EVIDENCE_LINE_FIELD_PATTERN = Pattern.compile(
            "(?im)^\\s*[`\"']?(?:line|linenumber|line_number)[`\"']?\\s*:\\s*[`\"']?L?(\\d{1,7})[`\"']?\\s*,?\\s*$"
    );
    private static final Pattern COMPACT_EVIDENCE_LINE_FIELD_PATTERN = Pattern.compile(
            "(?i)(?<![A-Za-z0-9_])[`\"']?(?:line|linenumber|line_number)[`\"']?\\s*:\\s*[`\"']?L?(\\d{1,7})[`\"']?"
    );
    private static final Pattern EVIDENCE_LINE_RANGE_FIELD_PATTERN = Pattern.compile(
            "(?i)(?<![A-Za-z0-9_])[`\"']?(startline|start_line|linestart|line_start|endline|end_line|lineend|line_end)[`\"']?\\s*:\\s*[`\"']?L?(\\d{1,7})[`\"']?"
    );
    private static final Pattern URL_PORT_PATTERN = Pattern.compile("(?i)\\b([a-z][a-z0-9+.-]*://[^\\s/):]+):(\\d{1,5})(?=/)");
    private static final Pattern HASH_METHOD_HINT_PATTERN = Pattern.compile("\\b([A-Z][A-Za-z0-9_$]*)\\s*(?:#|::)\\s*([A-Za-z_$][A-Za-z0-9_$]*)\\b");
    private static final Pattern QUALIFIED_METHOD_HINT_PATTERN = Pattern.compile(
            "(?i)(?:^|[\\s(])(?:at\\s+)?((?:[a-z_$][\\w$]*\\.)*[A-Z][\\w$]*)\\.([A-Za-z_$][\\w$]*)\\s*\\("
    );
    private static final Pattern FUNCTION_FILE_HINT_PATTERN = Pattern.compile(
            "(?i)(?:^|[\\s(])(?:at\\s+)?([A-Za-z_$][\\w$]*)\\s*\\(\\s*(?:[a-z][a-z0-9+.-]*://[^\\s)]*/)?(?:[^\\s)]*/)?([A-Za-z0-9_$.-]+\\.(?:java|kt|tsx|ts|jsx|js|vue|py|go|rs))(?:[?#][^\\s):]*)?(?::\\d{1,7})?(?::\\d{1,7})?"
    );
    private static final Pattern FUNCTION_AT_FILE_HINT_PATTERN = Pattern.compile(
            "(?i)(?:^|[\\s(])([A-Za-z_$][\\w$]*(?:\\.[A-Za-z_$][\\w$]*)*)@(?:[a-z][a-z0-9+.-]*://[^\\s)]*/)?(?:[^\\s)]*/)?([A-Za-z0-9_$.-]+\\.(?:java|kt|tsx|ts|jsx|js|vue|py|go|rs))(?:[?#][^\\s):]*)?(?::\\d{1,7})?(?::\\d{1,7})?"
    );
    private static final Pattern STACK_FILE_HINT_PATTERN = Pattern.compile(
            "(?i)(?:^|[\\s(])(?:[a-z][a-z0-9+.-]*://[^\\s)]*/)?(?:[^\\s)]*/)?([A-Za-z0-9_$.-]+\\.(?:java|kt|tsx|ts|jsx|js|vue|py|go|rs))(?:[?#][^\\s):]*)?(?::\\d{1,7})?(?::\\d{1,7})?"
    );
    private static final Pattern SOURCE_URL_SUFFIX_PATTERN = Pattern.compile(
            "(?i)(\\.(" + INDEXED_PATH_EXTENSION_PATTERN + "))(?:[?#][^\\s):]+)"
    );
    private static final Pattern PATH_SUFFIX_HINT_PATTERN = Pattern.compile(
            "(?i)(?:[a-z][a-z0-9+.-]*://[^\\s)\\]}>\"'`,]+|(?:\\.?\\.?[\\\\/]|[A-Za-z0-9_$.-]+[\\\\/])[^\\s)\\]}>\"'`,]+\\.(?:"
                    + INDEXED_PATH_EXTENSION_PATTERN
                    + ")"
                    + PATH_EXTENSION_BOUNDARY_PATTERN
                    + "(?:[?#][^\\s)\\]}>\"'`,]*)?(?::\\d{1,7})?(?::\\d{1,7})?)"
    );
    private static final Pattern MODULE_ROOT_HINT_PATTERN = Pattern.compile(
            "(?i)(?:^|[^A-Za-z0-9._-])((?:apps|packages|services|modules|libs)/[A-Za-z0-9][A-Za-z0-9._-]{0,119})(?=$|[\\s)\\]}>\"'`,]|[?#:/])"
    );
    private static final Pattern SOURCE_ROOT_HINT_FIELD_PATTERN = Pattern.compile(
            "(?i)(?<![A-Za-z0-9_])[`\"']?(?:sourceRoot|source_root|workspaceRoot|workspace_root|moduleRoot|module_root)[`\"']?\\s*:\\s*([`\"']?)([A-Za-z0-9][A-Za-z0-9._/-]{0,160})\\1"
    );
    private static final Pattern BARE_SOURCE_ROOT_HINT_PATTERN = Pattern.compile(
            "(?i)(?:^|[^A-Za-z0-9._/-])((?:src/main/(?:java|kotlin|resources)|src/test/(?:java|kotlin|resources)|src/(?:main|test)|backend-spring/src/main/(?:java|resources)|web-console/src|analyzer-rust/src))(?:$|[^A-Za-z0-9._/-])"
    );
    private static final Pattern SOURCE_PATH_EXTENSION_PATTERN = Pattern.compile(
            "(?i)\\.(?:" + INDEXED_PATH_EXTENSION_PATTERN + ")$"
    );
    private static final Pattern SOURCE_URL_PREFIX_PATTERN = Pattern.compile("(?i)^([a-z][a-z0-9+.-]*)://([^/]*)(/?.*)$");
    private static final Pattern HOSTED_SOURCE_BROWSER_PATH_PATTERN = Pattern.compile(
            "(?i)^(?:[^/]+/){2}(?:-/)?(?:blob|raw|tree)/(?:main|master|develop|dev|trunk)/(.+)$"
    );
    private static final Pattern HOSTED_SOURCE_RAW_PATH_PATTERN = Pattern.compile(
            "(?i)^(?:[^/]+/){2}(?:main|master|develop|dev|trunk)/(.+)$"
    );
    private static final Set<String> HOSTED_SOURCE_STRONG_ROOT_SEGMENTS = Set.of(
            ".github",
            "agent-runtime",
            "analyzer-rust",
            "backend",
            "backend-spring",
            "bin",
            "cmd",
            "deploy",
            "frontend",
            "lib",
            "scripts",
            "server",
            "web-console"
    );
    private static final Set<String> HOSTED_SOURCE_APP_ROOT_SEGMENTS = Set.of(
            "app",
            "apps",
            "client",
            "packages"
    );
    private static final Set<String> HOSTED_SOURCE_GENERIC_ROOT_SEGMENTS = Set.of(
            "docs",
            "src",
            "test",
            "tests"
    );
    private static final Set<String> PROTECTED_SOURCE_ROOT_SEGMENTS = Set.of(
            "apps",
            "libs",
            "modules",
            "packages",
            "services"
    );
    private static final Pattern EVIDENCE_FILE_PATH_FIELD_PATTERN = Pattern.compile(
            "(?i)^\\s*[`\"']?(?:filepath|file_path|sourcefile|source_file|sourcepath|source_path|sourceurl|source_url)[`\"']?\\s*:\\s*(.+?)\\s*,?\\s*$"
    );
    private static final Pattern COMPACT_EVIDENCE_FILE_PATH_FIELD_PATTERN = Pattern.compile(
            "(?i)(?<![A-Za-z0-9_])[`\"']?(?:filepath|file_path|sourcefile|source_file|sourcepath|source_path|sourceurl|source_url)[`\"']?\\s*:\\s*([`\"'])(.{1,700}?)\\1"
    );
    private static final Pattern JSON_HANDLER_FIELD_PATTERN = Pattern.compile(
            "(?i)^\\s*[`\"']?(handler_class|handler_method)[`\"']?\\s*:\\s*[`\"']?([A-Za-z_$][A-Za-z0-9_$.]{0,300})[`\"']?\\s*,?\\s*$"
    );
    private static final Pattern COMPACT_JSON_HANDLER_FIELD_PATTERN = Pattern.compile(
            "(?i)(?<![A-Za-z0-9_])[`\"']?(handler_class|handler_method)[`\"']?\\s*:\\s*([`\"'])([A-Za-z_$][A-Za-z0-9_$.]{0,300})\\2"
    );
    private static final Pattern FLAT_JSON_OBJECT_PATTERN = Pattern.compile("\\{[^{}]{1,4000}}");
    private static final Pattern ROUTE_PATH_HINT_PATTERN = Pattern.compile(
            "(?i)(?:https?://[^/\\s)\\]}>\"'`,]+)?(/[^\\s)\\]}>\"'`,]+)"
    );
    private static final Pattern HTTP_METHOD_HINT_PATTERN = Pattern.compile(
            "(?i)\\b(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\\b"
    );
    private static final Set<String> ROUTE_CONTEXT_TOKENS = Set.of(
            "api", "endpoint", "endpoints", "route", "routes", "handler", "request",
            "requestmapping", "getmapping", "postmapping", "putmapping", "deletemapping",
            "patchmapping", "接口", "路由", "请求", "映射"
    );
    private static final Set<String> NON_ROUTE_ROOT_SEGMENTS = Set.of(
            "src", "web-console", "backend-spring", "frontend", "docs", "scripts", "node_modules",
            "users", "var", "tmp", "private", "applications"
    );

    private CodeLocationHintParser() {
    }

    static CodeLocationHints parse(String queryText) {
        return new CodeLocationHints(
                parseLineHints(queryText),
                parseMethodHints(queryText),
                parseFunctionFileHints(queryText),
                parseStackFileHints(queryText),
                pathSuffixHints(queryText)
        );
    }

    static boolean hasCodeLocationHint(String queryText) {
        if (queryText == null || queryText.isBlank()) {
            return false;
        }
        CodeLocationHints hints = parse(queryText);
        return !hints.lineHints().isEmpty()
                || !hints.methodHints().isEmpty()
                || !hints.functionFileHints().isEmpty()
                || !hints.stackFileHints().isEmpty()
                || !hints.pathSuffixHints().isEmpty()
                || (looksLikePath(queryText) && !queryText.trim().contains(" "));
    }

    static boolean looksLikePath(String input) {
        return input != null && (input.contains("/") || input.contains("\\") || input.contains("."));
    }

    static String stripLocationHintsForTokenization(String input) {
        return stripLineHints(input);
    }

    static String stripLineHints(String input) {
        String withoutUrlPorts = stripUrlPorts(input);
        String withoutEvidenceLineFields = EVIDENCE_LINE_FIELD_PATTERN.matcher(withoutUrlPorts).replaceAll(" ");
        String withoutCompactEvidenceLineFields = COMPACT_EVIDENCE_LINE_FIELD_PATTERN.matcher(withoutEvidenceLineFields).replaceAll(" ");
        String withoutEvidenceRangeFields = EVIDENCE_LINE_RANGE_FIELD_PATTERN.matcher(withoutCompactEvidenceLineFields).replaceAll(" ");
        String withoutPathHints = PATH_LINE_HINT_PATTERN.matcher(withoutEvidenceRangeFields).replaceAll(" ");
        String withoutWordHints = WORD_LINE_HINT_PATTERN.matcher(withoutPathHints).replaceAll(" ");
        String withoutCjkHints = CJK_LINE_HINT_PATTERN.matcher(withoutWordHints).replaceAll(" ");
        return stripSourceUrlSuffixes(withoutCjkHints);
    }

    static String stripUrlPorts(String input) {
        if (input == null || input.isBlank()) {
            return "";
        }
        return URL_PORT_PATTERN.matcher(input).replaceAll("$1");
    }

    static String stripSourceUrlSuffixes(String input) {
        if (input == null || input.isBlank()) {
            return "";
        }
        return SOURCE_URL_SUFFIX_PATTERN.matcher(input).replaceAll("$1");
    }

    static List<LineHint> parseLineHints(String queryText) {
        if (queryText == null || queryText.isBlank()) {
            return List.of();
        }
        String normalizedQuery = stripUrlPorts(queryText);
        List<LineHint> hints = new ArrayList<>();
        addPathLineHints(hints, normalizedQuery);
        addLineHints(hints, WORD_LINE_HINT_PATTERN.matcher(normalizedQuery));
        addLineHints(hints, CJK_LINE_HINT_PATTERN.matcher(normalizedQuery));
        addCompactEvidenceLineFieldHints(hints, normalizedQuery);
        addEvidenceLineFieldHints(hints, normalizedQuery);
        addEvidenceLineRangeFieldHints(hints, normalizedQuery);
        return hints.stream().distinct().toList();
    }

    private static void addPathLineHints(List<LineHint> hints, String queryText) {
        Matcher matcher = PATH_LINE_HINT_PATTERN.matcher(queryText);
        while (matcher.find()) {
            String prefix = queryText.substring(lineStartIndex(queryText, matcher.start()), matcher.start()).trim();
            if (!endsWithSourcePath(prefix)) {
                continue;
            }
            addLineHint(hints, matcher.group(1), matcher.group(2));
        }
    }

    private static int lineStartIndex(String value, int offset) {
        int index = Math.max(0, Math.min(offset, value.length()));
        int lineFeed = value.lastIndexOf('\n', index - 1);
        int carriageReturn = value.lastIndexOf('\r', index - 1);
        return Math.max(lineFeed, carriageReturn) + 1;
    }

    private static boolean endsWithSourcePath(String value) {
        if (value == null || value.isBlank()) {
            return false;
        }
        String normalized = stripSourceUrlSuffixes(value.trim())
                .replace('\\', '/')
                .replaceAll("[\\s)\\]}>\"'`,]+$", "");
        return SOURCE_PATH_EXTENSION_PATTERN.matcher(normalized).find();
    }

    private static void addEvidenceLineFieldHints(List<LineHint> hints, String queryText) {
        for (String line : queryText.split("\\R")) {
            Matcher matcher = EVIDENCE_LINE_FIELD_PATTERN.matcher(line == null ? "" : line.trim());
            if (!matcher.matches()) {
                continue;
            }
            try {
                int lineNumber = Integer.parseInt(matcher.group(1));
                hints.add(new LineHint(lineNumber, lineNumber));
            } catch (NumberFormatException ignored) {
                // Ignore malformed line hints.
            }
        }
    }

    private static void addCompactEvidenceLineFieldHints(List<LineHint> hints, String queryText) {
        Matcher matcher = COMPACT_EVIDENCE_LINE_FIELD_PATTERN.matcher(queryText);
        while (matcher.find()) {
            Integer lineNumber = parsePositiveInt(matcher.group(1));
            if (lineNumber != null) {
                hints.add(new LineHint(lineNumber, lineNumber));
            }
        }
    }

    private static void addEvidenceLineRangeFieldHints(List<LineHint> hints, String queryText) {
        Integer pendingStart = null;
        Integer pendingEnd = null;
        Matcher matcher = EVIDENCE_LINE_RANGE_FIELD_PATTERN.matcher(queryText);
        int previousMatchEnd = 0;
        while (matcher.find()) {
            if (hasJsonObjectBoundary(queryText, previousMatchEnd, matcher.start())) {
                pendingStart = null;
                pendingEnd = null;
            }
            Integer lineNumber = parsePositiveInt(matcher.group(2));
            if (lineNumber == null) {
                previousMatchEnd = matcher.end();
                continue;
            }
            String field = matcher.group(1).toLowerCase(Locale.ROOT);
            if (isStartRangeField(field)) {
                pendingStart = lineNumber;
            } else {
                pendingEnd = lineNumber;
            }
            if (pendingStart != null && pendingEnd != null) {
                hints.add(new LineHint(pendingStart, Math.max(pendingStart, pendingEnd)));
                pendingStart = null;
                pendingEnd = null;
            }
            previousMatchEnd = matcher.end();
        }
    }

    private static boolean hasJsonObjectBoundary(String value, int startInclusive, int endExclusive) {
        if (value == null || startInclusive >= endExclusive) {
            return false;
        }
        int start = Math.max(0, startInclusive);
        int end = Math.min(value.length(), endExclusive);
        for (int index = start; index < end; index++) {
            char current = value.charAt(index);
            if (current == '}' || current == '{') {
                return true;
            }
        }
        return false;
    }

    private static boolean isStartRangeField(String field) {
        return "startline".equals(field)
                || "start_line".equals(field)
                || "linestart".equals(field)
                || "line_start".equals(field);
    }

    static List<MethodHint> parseMethodHints(String queryText) {
        if (queryText == null || queryText.isBlank()) {
            return List.of();
        }
        List<MethodHint> hints = new ArrayList<>();
        addMethodHints(hints, HASH_METHOD_HINT_PATTERN.matcher(queryText));
        addMethodHints(hints, QUALIFIED_METHOD_HINT_PATTERN.matcher(queryText));
        addStructuredJsonHandlerMethodHints(hints, queryText);
        addCompactJsonHandlerMethodHints(hints, queryText);
        addJsonHandlerMethodHints(hints, queryText);
        return hints.stream().distinct().toList();
    }

    private static void addStructuredJsonHandlerMethodHints(List<MethodHint> hints, String queryText) {
        for (String candidate : jsonCandidates(queryText)) {
            collectStructuredJsonHandlerMethodHints(hints, candidate);
        }
    }

    private static void collectStructuredJsonHandlerMethodHints(List<MethodHint> hints, String candidate) {
        if (candidate == null || candidate.isBlank() || candidate.length() > MAX_JSON_CANDIDATE_LENGTH) {
            return;
        }
        try {
            collectStructuredJsonHandlerMethodHints(hints, OBJECT_MAPPER.readTree(candidate), 0, new TraversalBudget());
        } catch (JsonProcessingException ignored) {
            // Ignore malformed snippets and keep legacy handler field fallback.
        }
    }

    private static void collectStructuredJsonHandlerMethodHints(
            List<MethodHint> hints,
            JsonNode node,
            int depth,
            TraversalBudget budget
    ) {
        if (node == null || node.isNull() || depth > MAX_JSON_TRAVERSAL_DEPTH || !budget.tryVisit()) {
            return;
        }
        if (node.isObject()) {
            addJsonHandlerMethodHint(
                    hints,
                    safeJavaIdentifierPath(textField(node, "handler_class")),
                    safeJavaIdentifierPath(textField(node, "handler_method"))
            );
            node.fields().forEachRemaining(entry ->
                    collectStructuredJsonHandlerMethodHints(hints, entry.getValue(), depth + 1, budget));
            return;
        }
        if (node.isArray()) {
            node.elements().forEachRemaining(element ->
                    collectStructuredJsonHandlerMethodHints(hints, element, depth + 1, budget));
        }
    }

    private static void addCompactJsonHandlerMethodHints(List<MethodHint> hints, String queryText) {
        String pendingClass = null;
        String pendingMethod = null;
        Matcher matcher = COMPACT_JSON_HANDLER_FIELD_PATTERN.matcher(queryText);
        int previousMatchEnd = 0;
        while (matcher.find()) {
            if (hasJsonObjectBoundary(queryText, previousMatchEnd, matcher.start())) {
                pendingClass = null;
                pendingMethod = null;
            }
            String field = matcher.group(1).toLowerCase(Locale.ROOT);
            String value = matcher.group(3);
            if ("handler_class".equals(field)) {
                pendingClass = safeJavaIdentifierPath(value);
                addJsonHandlerMethodHint(hints, pendingClass, pendingMethod);
            } else {
                pendingMethod = safeJavaIdentifierPath(value);
                addJsonHandlerMethodHint(hints, pendingClass, pendingMethod);
            }
            previousMatchEnd = matcher.end();
        }
    }

    private static void addJsonHandlerMethodHints(List<MethodHint> hints, String queryText) {
        String pendingClass = null;
        String pendingMethod = null;
        for (String line : queryText.split("\\R")) {
            String trimmed = line == null ? "" : line.trim();
            Matcher matcher = JSON_HANDLER_FIELD_PATTERN.matcher(trimmed);
            if (!matcher.matches()) {
                if (hasJsonObjectBoundary(trimmed, 0, trimmed.length())) {
                    pendingClass = null;
                    pendingMethod = null;
                }
                continue;
            }
            String field = matcher.group(1).toLowerCase(Locale.ROOT);
            String value = matcher.group(2);
            if ("handler_class".equals(field)) {
                pendingClass = safeJavaIdentifierPath(value);
                addJsonHandlerMethodHint(hints, pendingClass, pendingMethod);
                continue;
            }
            pendingMethod = safeJavaIdentifierPath(value);
            addJsonHandlerMethodHint(hints, pendingClass, pendingMethod);
        }
    }

    private static void addJsonHandlerMethodHint(List<MethodHint> hints, String pendingClass, String pendingMethod) {
        if (pendingClass == null || pendingClass.isBlank() || pendingMethod == null || pendingMethod.isBlank()
                || pendingMethod.contains(".")) {
            return;
        }
        MethodHint hint = new MethodHint(
                pendingClass,
                simpleClassName(pendingClass).toLowerCase(Locale.ROOT),
                pendingMethod.toLowerCase(Locale.ROOT)
        );
        if (!hints.contains(hint)) {
            hints.add(hint);
        }
    }

    private static String safeJavaIdentifierPath(String value) {
        if (value == null || value.isBlank() || value.length() > 300) {
            return "";
        }
        String trimmed = value.trim();
        if (trimmed.contains("..") || trimmed.startsWith(".") || trimmed.endsWith(".")) {
            return "";
        }
        for (String segment : trimmed.split("\\.")) {
            if (!segment.matches("[A-Za-z_$][A-Za-z0-9_$]*")) {
                return "";
            }
        }
        return trimmed;
    }

    static List<FunctionFileHint> parseFunctionFileHints(String queryText) {
        if (queryText == null || queryText.isBlank()) {
            return List.of();
        }
        List<FunctionFileHint> hints = new ArrayList<>();
        addFunctionFileHints(hints, FUNCTION_FILE_HINT_PATTERN.matcher(queryText));
        addFunctionFileHints(hints, FUNCTION_AT_FILE_HINT_PATTERN.matcher(queryText));
        return hints.stream().distinct().toList();
    }

    static List<String> parseStackFileHints(String queryText) {
        if (queryText == null || queryText.isBlank()) {
            return List.of();
        }
        List<String> hints = new ArrayList<>();
        for (String line : queryText.split("\\R")) {
            String candidate = line == null ? "" : line.trim();
            if (!looksLikeStackFrame(candidate)) {
                continue;
            }
            Matcher matcher = STACK_FILE_HINT_PATTERN.matcher(candidate);
            while (matcher.find()) {
                String fileName = matcher.group(1);
                if (fileName == null || fileName.isBlank()) {
                    continue;
                }
                hints.add(fileName.toLowerCase(Locale.ROOT));
            }
        }
        return hints.stream().distinct().toList();
    }

    static List<String> methodAnchorFileHints(String queryText) {
        List<MethodHint> methodHints = parseMethodHints(queryText);
        List<FunctionFileHint> functionFileHints = parseFunctionFileHints(queryText);
        LinkedHashSet<String> hints = new LinkedHashSet<>();
        for (MethodHint hint : methodHints) {
            String className = hint.normalizedClassName();
            if (className.isBlank()) {
                continue;
            }
            for (String baseName : methodAnchorBaseNames(hint.rawClassName(), className)) {
                for (String extension : METHOD_HINT_EXTENSIONS) {
                    hints.add(baseName + extension);
                }
            }
            for (String qualifiedPath : qualifiedClassPathHints(hint.rawClassName())) {
                addPathSuffixHintVariants(hints, qualifiedPath);
            }
            hints.add(className);
        }
        for (FunctionFileHint hint : functionFileHints) {
            if (hint.fileName().isBlank()) {
                continue;
            }
            hints.add(hint.fileName());
            String compactFileName = hint.fileName().replaceAll("[^a-z0-9.]+", "");
            if (!compactFileName.isBlank()) {
                hints.add(compactFileName);
            }
        }
        for (String fileHint : parseStackFileHints(queryText)) {
            hints.add(fileHint);
            String compactFileName = fileHint.replaceAll("[^a-z0-9.]+", "");
            if (!compactFileName.isBlank()) {
                hints.add(compactFileName);
            }
        }
        return new ArrayList<>(hints);
    }

    static List<String> pathSuffixHints(String queryText) {
        if (queryText == null || queryText.isBlank()) {
            return List.of();
        }
        LinkedHashSet<String> hints = new LinkedHashSet<>();
        Matcher matcher = PATH_SUFFIX_HINT_PATTERN.matcher(queryText);
        while (matcher.find()) {
            addPathSuffixHintVariants(hints, normalizePathSuffixHint(matcher.group()));
        }
        for (String evidenceHint : evidenceFilePathHints(queryText)) {
            addPathSuffixHintVariants(hints, evidenceHint);
        }
        return new ArrayList<>(hints);
    }

    static List<String> moduleRootHints(String queryText) {
        if (queryText == null || queryText.isBlank()) {
            return List.of();
        }
        LinkedHashSet<String> hints = new LinkedHashSet<>();
        Matcher matcher = MODULE_ROOT_HINT_PATTERN.matcher(queryText.replace('\\', '/'));
        while (matcher.find()) {
            addModuleRootHint(hints, matcher.group(1));
        }
        for (String pathHint : pathSuffixHints(queryText)) {
            addModuleRootHint(hints, moduleRootFromPath(pathHint));
        }
        return new ArrayList<>(hints);
    }

    static List<String> sourceRootHints(String queryText) {
        if (queryText == null || queryText.isBlank()) {
            return List.of();
        }
        LinkedHashSet<String> hints = new LinkedHashSet<>();
        Matcher matcher = SOURCE_ROOT_HINT_FIELD_PATTERN.matcher(queryText.replace('\\', '/'));
        while (matcher.find()) {
            String hint = normalizeSourceRootHint(matcher.group(2));
            if (!hint.isBlank()) {
                hints.add(hint);
            }
        }
        Matcher bareMatcher = BARE_SOURCE_ROOT_HINT_PATTERN.matcher(queryText.replace('\\', '/'));
        while (bareMatcher.find()) {
            String hint = normalizeSourceRootHint(bareMatcher.group(1));
            if (!hint.isBlank()) {
                hints.add(hint);
            }
        }
        return new ArrayList<>(hints);
    }

    static List<String> endpointRouteHints(String queryText) {
        if (queryText == null || queryText.isBlank()) {
            return List.of();
        }
        LinkedHashSet<String> hints = new LinkedHashSet<>();
        String normalizedQuery = stripUrlPorts(queryText);
        boolean hasRouteContext = hasRouteContext(normalizedQuery);
        Matcher matcher = ROUTE_PATH_HINT_PATTERN.matcher(normalizedQuery);
        while (matcher.find()) {
            String hint = normalizeEndpointRouteHint(matcher.group(1), hasRouteContext);
            if (!hint.isBlank()) {
                hints.add(hint);
            }
        }
        return new ArrayList<>(hints);
    }

    static List<String> endpointHttpMethodHints(String queryText) {
        if (queryText == null || queryText.isBlank() || endpointRouteHints(queryText).isEmpty()) {
            return List.of();
        }
        Set<String> methods = new LinkedHashSet<>();
        Matcher matcher = HTTP_METHOD_HINT_PATTERN.matcher(queryText);
        while (matcher.find()) {
            methods.add(matcher.group(1).toLowerCase(Locale.ROOT));
        }
        return new ArrayList<>(methods);
    }

    static List<String> evidenceFilePathHints(String queryText) {
        if (queryText == null || queryText.isBlank()) {
            return List.of();
        }
        Set<String> hints = new LinkedHashSet<>();
        addCompactEvidenceFilePathHints(hints, queryText);
        for (String line : queryText.split("\\R")) {
            String trimmed = line == null ? "" : line.trim();
            Matcher matcher = EVIDENCE_FILE_PATH_FIELD_PATTERN.matcher(trimmed);
            if (!matcher.matches()) {
                continue;
            }
            String hint = normalizeEvidenceFilePathHint(matcher.group(1));
            if (!hint.isBlank()) {
                hints.add(hint);
            }
        }
        return new ArrayList<>(hints);
    }

    private static boolean hasRouteContext(String queryText) {
        String input = queryText == null ? "" : queryText.toLowerCase(Locale.ROOT);
        if (input.isBlank()) {
            return false;
        }
        return ROUTE_CONTEXT_TOKENS.stream().anyMatch(input::contains);
    }

    private static String normalizeEndpointRouteHint(String raw, boolean hasRouteContext) {
        if (raw == null || raw.isBlank()) {
            return "";
        }
        String candidate = raw.trim()
                .replace('\\', '/')
                .replaceAll("[?#].*$", "")
                .replaceAll("[,.;:]+$", "");
        if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.length() > 220) {
            return "";
        }
        while (candidate.length() > 1 && candidate.endsWith("/")) {
            candidate = candidate.substring(0, candidate.length() - 1);
        }
        String lower = candidate.toLowerCase(Locale.ROOT);
        if (lower.contains("..") || lower.matches(".*\\.[a-z0-9]{1,8}(?:/.*)?$")) {
            return "";
        }
        String rootSegment = firstRouteSegment(lower);
        if (NON_ROUTE_ROOT_SEGMENTS.contains(rootSegment)) {
            return "";
        }
        boolean strongRoute = lower.equals("/api")
                || lower.startsWith("/api/")
                || lower.equals("/graphql")
                || lower.matches("/v\\d+(?:/.*)?");
        if (!strongRoute && !hasRouteContext) {
            return "";
        }
        return lower;
    }

    private static String firstRouteSegment(String path) {
        if (path == null || path.isBlank() || !path.startsWith("/")) {
            return "";
        }
        String withoutLeadingSlash = path.substring(1);
        int slash = withoutLeadingSlash.indexOf('/');
        return slash >= 0 ? withoutLeadingSlash.substring(0, slash) : withoutLeadingSlash;
    }

    static List<EvidenceLocationHint> evidenceLocationHints(String queryText) {
        if (queryText == null || queryText.isBlank()) {
            return List.of();
        }
        List<EvidenceLocationHint> hints = new ArrayList<>();
        for (String candidate : jsonCandidates(queryText)) {
            collectStructuredEvidenceLocationHints(hints, candidate);
        }
        addFlatEvidenceLocationHints(hints, queryText);
        return hints.stream().distinct().toList();
    }

    private static void collectStructuredEvidenceLocationHints(List<EvidenceLocationHint> hints, String candidate) {
        if (candidate == null || candidate.isBlank() || candidate.length() > MAX_JSON_CANDIDATE_LENGTH) {
            return;
        }
        try {
            collectStructuredEvidenceLocationHints(hints, OBJECT_MAPPER.readTree(candidate), 0, new TraversalBudget());
        } catch (JsonProcessingException ignored) {
            // Ignore malformed snippets and fall back to flat regex extraction.
        }
    }

    private static void collectStructuredEvidenceLocationHints(
            List<EvidenceLocationHint> hints,
            JsonNode node,
            int depth,
            TraversalBudget budget
    ) {
        if (node == null || node.isNull() || depth > MAX_JSON_TRAVERSAL_DEPTH || !budget.tryVisit()) {
            return;
        }
        if (node.isObject()) {
            EvidenceLocationHint hint = parseEvidenceLocationNode(node);
            if (hint != null) {
                hints.add(hint);
            }
            node.fields().forEachRemaining(entry ->
                    collectStructuredEvidenceLocationHints(hints, entry.getValue(), depth + 1, budget));
            return;
        }
        if (node.isArray()) {
            node.elements().forEachRemaining(element ->
                    collectStructuredEvidenceLocationHints(hints, element, depth + 1, budget));
        }
    }

    private static EvidenceLocationHint parseEvidenceLocationNode(JsonNode node) {
        String filePath = normalizeEvidenceFilePathHint(textField(
                node,
                "file_path", "filePath", "filepath",
                "source_file", "sourceFile", "sourcefile",
                "source_path", "sourcePath", "sourcepath",
                "source_url", "sourceUrl", "sourceurl"
        ));
        if (filePath.isBlank()) {
            return null;
        }
        LineHint lineHint = evidenceNodeLineHint(node);
        if (lineHint == null) {
            return null;
        }
        return new EvidenceLocationHint(filePath, lineHint);
    }

    private static LineHint evidenceNodeLineHint(JsonNode node) {
        LineHint range = evidenceNodeRangeHint(node);
        if (range != null) {
            return range;
        }
        Integer lineNumber = integerField(node, "line", "line_number", "lineNumber", "linenumber");
        return lineNumber == null ? null : new LineHint(lineNumber, lineNumber);
    }

    private static LineHint evidenceNodeRangeHint(JsonNode node) {
        Integer start = integerField(node, "start_line", "startLine", "startline", "line_start", "lineStart", "linestart");
        Integer end = integerField(node, "end_line", "endLine", "endline", "line_end", "lineEnd", "lineend");
        if (start == null || end == null) {
            return null;
        }
        return new LineHint(start, Math.max(start, end));
    }

    private static String textField(JsonNode node, String... names) {
        if (node == null || names == null) {
            return "";
        }
        for (String name : names) {
            JsonNode value = node.get(name);
            if (value == null || value.isNull()) {
                continue;
            }
            if (value.isTextual()) {
                return value.asText();
            }
        }
        return "";
    }

    private static Integer integerField(JsonNode node, String... names) {
        if (node == null || names == null) {
            return null;
        }
        for (String name : names) {
            JsonNode value = node.get(name);
            if (value == null || value.isNull()) {
                continue;
            }
            Integer parsed = parsePositiveJsonInteger(value);
            if (parsed != null) {
                return parsed;
            }
        }
        return null;
    }

    private static Integer parsePositiveJsonInteger(JsonNode value) {
        if (value == null || value.isNull()) {
            return null;
        }
        if (value.isIntegralNumber()) {
            long number = value.asLong();
            return number > 0 && number <= Integer.MAX_VALUE ? (int) number : null;
        }
        if (value.isTextual()) {
            String text = value.asText("").trim();
            if (text.startsWith("L") || text.startsWith("l")) {
                text = text.substring(1);
            }
            return parsePositiveInt(text);
        }
        return null;
    }

    private static void addFlatEvidenceLocationHints(List<EvidenceLocationHint> hints, String queryText) {
        Matcher matcher = FLAT_JSON_OBJECT_PATTERN.matcher(queryText);
        while (matcher.find()) {
            EvidenceLocationHint hint = parseEvidenceLocationObject(matcher.group());
            if (hint != null) {
                hints.add(hint);
            }
        }
    }

    private static List<String> jsonCandidates(String queryText) {
        if (queryText == null || queryText.isBlank()) {
            return List.of();
        }
        List<String> candidates = new ArrayList<>();
        for (int index = 0; index < queryText.length(); index++) {
            char current = queryText.charAt(index);
            if (current != '{' && current != '[') {
                continue;
            }
            int end = jsonCandidateEnd(queryText, index);
            if (end <= index) {
                continue;
            }
            String candidate = queryText.substring(index, end);
            if (candidate.length() <= MAX_JSON_CANDIDATE_LENGTH) {
                candidates.add(candidate);
            }
            index = end - 1;
        }
        return candidates;
    }

    private static int jsonCandidateEnd(String value, int startIndex) {
        int depth = 0;
        boolean inString = false;
        boolean escaped = false;
        for (int index = startIndex; index < value.length(); index++) {
            char current = value.charAt(index);
            if (inString) {
                if (escaped) {
                    escaped = false;
                } else if (current == '\\') {
                    escaped = true;
                } else if (current == '"') {
                    inString = false;
                }
                continue;
            }
            if (current == '"') {
                inString = true;
                continue;
            }
            if (current == '{' || current == '[') {
                depth++;
                continue;
            }
            if (current != '}' && current != ']') {
                continue;
            }
            depth--;
            if (depth == 0) {
                return index + 1;
            }
            if (depth < 0) {
                return -1;
            }
        }
        return -1;
    }

    private static EvidenceLocationHint parseEvidenceLocationObject(String objectText) {
        String filePath = firstCompactEvidenceFilePathHint(objectText);
        if (filePath.isBlank()) {
            return null;
        }
        LineHint lineHint = firstEvidenceObjectLineHint(objectText);
        if (lineHint == null) {
            return null;
        }
        return new EvidenceLocationHint(filePath, lineHint);
    }

    private static String firstCompactEvidenceFilePathHint(String queryText) {
        Matcher matcher = COMPACT_EVIDENCE_FILE_PATH_FIELD_PATTERN.matcher(queryText);
        if (!matcher.find()) {
            return "";
        }
        return normalizeEvidenceFilePathHint(matcher.group(2));
    }

    private static LineHint firstEvidenceObjectLineHint(String objectText) {
        LineHint range = firstEvidenceLineRangeFieldHint(objectText);
        if (range != null) {
            return range;
        }
        return firstCompactEvidenceLineFieldHint(objectText);
    }

    private static LineHint firstCompactEvidenceLineFieldHint(String objectText) {
        Matcher matcher = COMPACT_EVIDENCE_LINE_FIELD_PATTERN.matcher(objectText);
        if (!matcher.find()) {
            return null;
        }
        Integer lineNumber = parsePositiveInt(matcher.group(1));
        return lineNumber == null ? null : new LineHint(lineNumber, lineNumber);
    }

    private static LineHint firstEvidenceLineRangeFieldHint(String objectText) {
        Integer start = null;
        Integer end = null;
        Matcher matcher = EVIDENCE_LINE_RANGE_FIELD_PATTERN.matcher(objectText);
        while (matcher.find()) {
            Integer lineNumber = parsePositiveInt(matcher.group(2));
            if (lineNumber == null) {
                continue;
            }
            String field = matcher.group(1).toLowerCase(Locale.ROOT);
            if (isStartRangeField(field)) {
                start = lineNumber;
            } else {
                end = lineNumber;
            }
            if (start != null && end != null) {
                return new LineHint(start, Math.max(start, end));
            }
        }
        return null;
    }

    private static void addCompactEvidenceFilePathHints(Set<String> hints, String queryText) {
        Matcher matcher = COMPACT_EVIDENCE_FILE_PATH_FIELD_PATTERN.matcher(queryText);
        while (matcher.find()) {
            String hint = normalizeEvidenceFilePathHint(matcher.group(2));
            if (!hint.isBlank()) {
                hints.add(hint);
            }
        }
    }

    static String normalizeEvidenceFilePathHint(String value) {
        if (value == null) {
            return "";
        }
        String cleaned = value.trim()
                .replace('\\', '/')
                .replace("`", "")
                .replace("\"", "")
                .replace("'", "");
        cleaned = stripSourceUrlPathPrefix(cleaned);
        cleaned = stripTrailingEvidencePunctuation(cleaned);
        while (cleaned.startsWith("./")) {
            cleaned = cleaned.substring(2);
        }
        while (cleaned.startsWith("/")) {
            cleaned = cleaned.substring(1);
        }
        cleaned = cleaned.replaceAll("/+", "/");
        cleaned = cleaned.replaceFirst("(?i)[:#]L?\\d{1,7}(?::\\d{1,7})?(?:\\s*[-~]\\s*L?\\d{1,7}(?::\\d{1,7})?)?$", "");
        cleaned = stripEvidenceSourceUrlSuffix(cleaned);
        cleaned = stripTrailingEvidencePunctuation(cleaned);
        if (cleaned.length() > 500) {
            return "";
        }
        return cleaned;
    }

    private static String stripTrailingEvidencePunctuation(String value) {
        String cleaned = value == null ? "" : value.trim();
        while (cleaned.endsWith(".") || cleaned.endsWith(",") || cleaned.endsWith(";")) {
            cleaned = cleaned.substring(0, cleaned.length() - 1).trim();
        }
        return cleaned;
    }

    static String normalizePathSuffixHint(String value) {
        if (value == null) {
            return "";
        }
        String cleaned = value.trim()
                .replace('\\', '/')
                .replace("`", "")
                .replace("\"", "")
                .replace("'", "");
        cleaned = stripSourceUrlPathPrefix(cleaned);
        while (cleaned.startsWith("./")) {
            cleaned = cleaned.substring(2);
        }
        while (cleaned.startsWith("/")) {
            cleaned = cleaned.substring(1);
        }
        cleaned = cleaned.replaceAll("/+", "/");
        cleaned = cleaned.replaceFirst("(?i)[:#]L?\\d{1,7}(?::\\d{1,7})?(?:\\s*[-~]\\s*L?\\d{1,7}(?::\\d{1,7})?)?$", "");
        cleaned = stripEvidenceSourceUrlSuffix(cleaned);
        while (cleaned.endsWith(".") || cleaned.endsWith(",") || cleaned.endsWith(";")) {
            cleaned = cleaned.substring(0, cleaned.length() - 1).trim();
        }
        if (cleaned.length() > 500 || !hasSourcePathExtension(cleaned)) {
            return "";
        }
        return cleaned;
    }

    private static boolean looksLikeStackFrame(String line) {
        if (line == null || line.isBlank()) {
            return false;
        }
        String lower = line.toLowerCase(Locale.ROOT);
        if (lower.startsWith("at ") || lower.contains("\tat ") || lower.contains("    at ")) {
            return true;
        }
        return (lower.contains("webpack://") || lower.contains("vite") || lower.contains("localhost:"))
                && lower.contains(":")
                && lower.matches(".*\\.(java|kt|tsx|ts|jsx|js|vue|py|go|rs)(?:[?#][^\\s):]*)?:\\d{1,7}.*")
                || lower.matches(".*\\b[a-z_$][\\w$]*(?:\\.[a-z_$][\\w$]*)?@(?:[a-z][a-z0-9+.-]*://)?[^\\s)]*\\.(java|kt|tsx|ts|jsx|js|vue|py|go|rs)(?:[?#][^\\s):]*)?:\\d{1,7}.*");
    }

    private static void addFunctionFileHints(List<FunctionFileHint> hints, Matcher matcher) {
        while (matcher.find()) {
            String methodName = simpleFunctionName(matcher.group(1));
            String fileName = matcher.group(2);
            if (methodName == null || fileName == null || methodName.isBlank() || fileName.isBlank()) {
                continue;
            }
            hints.add(new FunctionFileHint(
                    fileName.toLowerCase(Locale.ROOT),
                    methodName.toLowerCase(Locale.ROOT)
            ));
        }
    }

    private static String simpleFunctionName(String methodName) {
        if (methodName == null || methodName.isBlank()) {
            return "";
        }
        String trimmed = methodName.trim();
        int dot = trimmed.lastIndexOf('.');
        return dot >= 0 ? trimmed.substring(dot + 1) : trimmed;
    }

    private static void addMethodHints(List<MethodHint> hints, Matcher matcher) {
        while (matcher.find()) {
            String className = matcher.group(1);
            String methodName = matcher.group(2);
            if (className == null || methodName == null || className.isBlank() || methodName.isBlank()) {
                continue;
            }
            String simpleClassName = simpleClassName(className);
            hints.add(new MethodHint(
                    className.trim(),
                    simpleClassName.toLowerCase(Locale.ROOT),
                    methodName.toLowerCase(Locale.ROOT)
            ));
        }
    }

    private static String simpleClassName(String className) {
        if (className == null || className.isBlank()) {
            return "";
        }
        String trimmed = className.trim();
        int dot = trimmed.lastIndexOf('.');
        return dot >= 0 ? trimmed.substring(dot + 1) : trimmed;
    }

    private static void addLineHints(List<LineHint> hints, Matcher matcher) {
        while (matcher.find()) {
            addLineHint(hints, matcher.group(1), matcher.groupCount() >= 2 ? matcher.group(2) : null);
        }
    }

    private static void addLineHint(List<LineHint> hints, String startValue, String endValue) {
        Integer start = parsePositiveInt(startValue);
        Integer end = parsePositiveInt(endValue);
        if (start == null) {
            return;
        }
        if (end == null || end < start) {
            end = start;
        }
        hints.add(new LineHint(start, end));
    }

    private static Integer parsePositiveInt(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            int parsed = Integer.parseInt(value);
            return parsed > 0 ? parsed : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static List<String> methodAnchorBaseNames(String rawClassName, String normalizedClassName) {
        LinkedHashSet<String> names = new LinkedHashSet<>();
        String raw = simpleClassName(rawClassName);
        String normalized = normalizedClassName == null ? "" : normalizedClassName.trim().toLowerCase(Locale.ROOT);
        if (!raw.isBlank()) {
            names.add(raw);
            names.add(toSeparatedIdentifier(raw, "-"));
            names.add(toSeparatedIdentifier(raw, "_"));
        }
        if (!normalized.isBlank()) {
            names.add(normalized);
        }
        return names.stream()
                .filter(name -> name != null && !name.isBlank())
                .toList();
    }

    private static List<String> qualifiedClassPathHints(String rawClassName) {
        if (rawClassName == null || rawClassName.isBlank() || !rawClassName.contains(".")) {
            return List.of();
        }
        String normalized = rawClassName.trim().replace('.', '/');
        if (normalized.length() > 500 || normalized.contains("..") || normalized.startsWith("/") || normalized.endsWith("/")) {
            return List.of();
        }
        List<String> hints = new ArrayList<>();
        for (String extension : METHOD_HINT_EXTENSIONS) {
            hints.add(normalized + extension);
        }
        return hints;
    }

    private static void addPathSuffixHintVariants(Set<String> hints, String pathHint) {
        if (pathHint == null || pathHint.isBlank()) {
            return;
        }
        String normalized = pathHint.trim().replace('\\', '/').replaceAll("/+", "/");
        if (startsWithProtectedSourceRoot(normalized)) {
            if (normalized.length() <= 500 && hasSourcePathExtension(normalized)) {
                hints.add(normalized);
            }
            return;
        }
        String[] segments = normalized.split("/");
        for (int start = 0; start < segments.length; start++) {
            StringBuilder suffix = new StringBuilder();
            for (int index = start; index < segments.length; index++) {
                String segment = segments[index];
                if (segment == null || segment.isBlank() || ".".equals(segment)) {
                    continue;
                }
                if (!suffix.isEmpty()) {
                    suffix.append('/');
                }
                suffix.append(segment);
            }
            String candidate = suffix.toString();
            if (!candidate.isBlank() && candidate.length() <= 500 && hasSourcePathExtension(candidate)) {
                hints.add(candidate);
            }
        }
    }

    private static boolean startsWithProtectedSourceRoot(String normalizedPath) {
        if (normalizedPath == null || normalizedPath.isBlank()) {
            return false;
        }
        String normalized = normalizedPath.replace('\\', '/').replaceAll("^/+", "");
        int slash = normalized.indexOf('/');
        String firstSegment = slash < 0 ? normalized : normalized.substring(0, slash);
        return PROTECTED_SOURCE_ROOT_SEGMENTS.contains(firstSegment.toLowerCase(Locale.ROOT));
    }

    private static void addModuleRootHint(Set<String> hints, String value) {
        String normalized = normalizeModuleRootHint(value);
        if (!normalized.isBlank()) {
            hints.add(normalized);
        }
    }

    private static String moduleRootFromPath(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String normalized = value.trim().replace('\\', '/').replaceAll("^/+", "").replaceAll("/+", "/");
        String[] segments = normalized.split("/");
        for (int index = 0; index < segments.length - 1; index++) {
            String parent = segments[index] == null ? "" : segments[index].toLowerCase(Locale.ROOT);
            if (isModuleRootParent(parent)) {
                return parent + "/" + segments[index + 1];
            }
        }
        return "";
    }

    private static String normalizeSourceRootHint(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String normalized = value.trim()
                .replace('\\', '/')
                .replace("`", "")
                .replace("\"", "")
                .replace("'", "")
                .replaceAll("^/+", "")
                .replaceAll("/+", "/")
                .replaceAll("/+$", "")
                .toLowerCase(Locale.ROOT);
        if (normalized.length() > 160 || normalized.contains("..") || normalized.isBlank()) {
            return "";
        }
        String moduleRoot = normalizeModuleRootHint(normalized);
        if (!moduleRoot.isBlank()) {
            return moduleRoot;
        }
        if (normalized.matches("src/(main|test)(/(java|kotlin|resources))?")
                || normalized.matches("(backend-spring/src/main/(java|resources)|web-console/src|analyzer-rust/src)")) {
            return normalized;
        }
        if (!normalized.contains("/") && HOSTED_SOURCE_STRONG_ROOT_SEGMENTS.contains(normalized)) {
            return normalized;
        }
        return "";
    }

    private static String normalizeModuleRootHint(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String cleaned = value.trim()
                .replace('\\', '/')
                .replace("`", "")
                .replace("\"", "")
                .replace("'", "")
                .replaceAll("^/+", "")
                .replaceAll("/+", "/");
        String[] segments = cleaned.split("/");
        if (segments.length != 2) {
            return "";
        }
        String parent = segments[0].toLowerCase(Locale.ROOT);
        String name = segments[1].toLowerCase(Locale.ROOT);
        if (!isModuleRootParent(parent) || !name.matches("[a-z0-9][a-z0-9._-]{0,119}")) {
            return "";
        }
        return parent + "/" + name;
    }

    private static boolean isModuleRootParent(String segment) {
        return "apps".equals(segment)
                || "packages".equals(segment)
                || "services".equals(segment)
                || "modules".equals(segment)
                || "libs".equals(segment);
    }

    private static String stripSourceUrlPathPrefix(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        Matcher matcher = SOURCE_URL_PREFIX_PATTERN.matcher(value);
        if (!matcher.matches()) {
            return value;
        }
        String host = matcher.group(2) == null ? "" : matcher.group(2).toLowerCase(Locale.ROOT);
        String path = matcher.group(3) == null ? "" : matcher.group(3).replaceAll("^/+", "");
        if (isHostedSourceBrowserHost(host)) {
            return stripHostedSourceBrowserPathPrefix(path);
        }
        return path;
    }

    private static String stripHostedSourceBrowserPathPrefix(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String normalized = value.replace('\\', '/').replaceAll("^/+", "");
        Matcher browserMatcher = HOSTED_SOURCE_BROWSER_PATH_PATTERN.matcher(normalized);
        if (browserMatcher.matches()) {
            return browserMatcher.group(1);
        }
        Matcher rawMatcher = HOSTED_SOURCE_RAW_PATH_PATTERN.matcher(normalized);
        if (rawMatcher.matches()) {
            return rawMatcher.group(1);
        }
        String arbitraryBranchPath = stripHostedSourcePathPrefixBySourceRoot(normalized);
        if (!arbitraryBranchPath.isBlank()) {
            return arbitraryBranchPath;
        }
        return value;
    }

    private static String stripHostedSourcePathPrefixBySourceRoot(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String normalized = value.replace('\\', '/').replaceAll("^/+", "");
        String[] segments = normalized.split("/");
        int branchStart = hostedSourceBranchStartIndex(segments);
        if (branchStart < 0 || branchStart >= segments.length - 1) {
            return "";
        }
        String strongRootPath = hostedSourcePathFromRootSegments(segments, branchStart, HOSTED_SOURCE_STRONG_ROOT_SEGMENTS);
        if (!strongRootPath.isBlank()) {
            return strongRootPath;
        }
        String appRootPath = hostedSourcePathFromAppRootSegments(segments, branchStart);
        if (!appRootPath.isBlank()) {
            return appRootPath;
        }
        return hostedSourcePathFromRootSegments(segments, branchStart, HOSTED_SOURCE_GENERIC_ROOT_SEGMENTS);
    }

    private static String hostedSourcePathFromRootSegments(String[] segments, int branchStart, Set<String> rootSegments) {
        if (segments == null || rootSegments == null || rootSegments.isEmpty()) {
            return "";
        }
        for (int index = segments.length - 1; index > branchStart; index--) {
            if (rootSegments == HOSTED_SOURCE_STRONG_ROOT_SEGMENTS && index <= branchStart + 1) {
                continue;
            }
            String candidate = joinSegments(segments, index);
            if (isHostedSourceRootSegment(segments[index], rootSegments) && hasSourcePathExtension(stripEvidenceSourceUrlSuffix(candidate))) {
                return candidate;
            }
        }
        return "";
    }

    private static String hostedSourcePathFromAppRootSegments(String[] segments, int branchStart) {
        if (segments == null) {
            return "";
        }
        for (int index = branchStart + 2; index < segments.length; index++) {
            String candidate = joinSegments(segments, index);
            if (isHostedSourceRootSegment(segments[index], HOSTED_SOURCE_APP_ROOT_SEGMENTS)
                    && hasSourcePathExtension(stripEvidenceSourceUrlSuffix(candidate))) {
                return candidate;
            }
        }
        return "";
    }

    private static int hostedSourceBranchStartIndex(String[] segments) {
        if (segments == null || segments.length < 4) {
            return -1;
        }
        if (segments.length >= 5 && "-".equals(segments[2]) && isHostedSourceBrowserMarker(segments[3])) {
            return 4;
        }
        if (isHostedSourceBrowserMarker(segments[2])) {
            return 3;
        }
        return 2;
    }

    private static boolean isHostedSourceBrowserMarker(String segment) {
        if (segment == null) {
            return false;
        }
        String normalized = segment.toLowerCase(Locale.ROOT);
        return "blob".equals(normalized) || "raw".equals(normalized) || "tree".equals(normalized);
    }

    private static boolean isHostedSourceRootSegment(String segment, Set<String> rootSegments) {
        return segment != null && rootSegments != null && rootSegments.contains(segment.toLowerCase(Locale.ROOT));
    }

    private static String joinSegments(String[] segments, int startInclusive) {
        if (segments == null || startInclusive < 0 || startInclusive >= segments.length) {
            return "";
        }
        StringBuilder joined = new StringBuilder();
        for (int index = startInclusive; index < segments.length; index++) {
            String segment = segments[index];
            if (segment == null || segment.isBlank()) {
                continue;
            }
            if (!joined.isEmpty()) {
                joined.append('/');
            }
            joined.append(segment);
        }
        return joined.toString();
    }

    private static boolean isHostedSourceBrowserHost(String host) {
        if (host == null || host.isBlank()) {
            return false;
        }
        String normalized = host.toLowerCase(Locale.ROOT);
        return "github.com".equals(normalized)
                || "www.github.com".equals(normalized)
                || "raw.githubusercontent.com".equals(normalized)
                || "gitlab.com".equals(normalized)
                || "www.gitlab.com".equals(normalized);
    }

    private static boolean hasSourcePathExtension(String value) {
        return value != null && SOURCE_PATH_EXTENSION_PATTERN.matcher(value.trim()).find();
    }

    private static String toSeparatedIdentifier(String value, String separator) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String separated = value
                .replaceAll("([a-z0-9])([A-Z])", "$1" + separator + "$2")
                .replaceAll("([A-Z]+)([A-Z][a-z])", "$1" + separator + "$2")
                .replaceAll("[^A-Za-z0-9]+", separator);
        return separated
                .replaceAll(Pattern.quote(separator) + "+", separator)
                .replaceAll("^" + Pattern.quote(separator) + "|" + Pattern.quote(separator) + "$", "")
                .toLowerCase(Locale.ROOT);
    }

    private static String stripEvidenceSourceUrlSuffix(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        return value.replaceFirst("(?i)(\\.(?:" + INDEXED_PATH_EXTENSION_PATTERN + "))(?:[?#].*)$", "$1");
    }

    record LineHint(int start, int end) {
    }

    record EvidenceLocationHint(String filePath, LineHint lineHint) {
    }

    private static final class TraversalBudget {

        private int visited;

        private boolean tryVisit() {
            if (visited >= MAX_JSON_TRAVERSAL_NODES) {
                return false;
            }
            visited++;
            return true;
        }
    }

    record MethodHint(String rawClassName, String normalizedClassName, String methodName) {
    }

    record FunctionFileHint(String fileName, String methodName) {
        String compactFileName() {
            return fileName.replaceAll("[^a-z0-9.]+", "");
        }
    }

    record CodeLocationHints(
            List<LineHint> lineHints,
            List<MethodHint> methodHints,
            List<FunctionFileHint> functionFileHints,
            List<String> stackFileHints,
            List<String> pathSuffixHints
    ) {
    }
}
