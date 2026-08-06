package com.sourcelens.module.agent.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sourcelens.module.analysis.entity.CodeChunk;
import com.sourcelens.module.analysis.service.CodeChunkRanker;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class CodeQaRetrievalService {

    static final int CANDIDATE_LIMIT = 80;
    static final int SEMANTIC_CANDIDATE_LIMIT = 500;
    static final int TOP_CONTEXT_LIMIT = 4;
    static final int FALLBACK_CONTEXT_LIMIT = 2;
    static final int MAX_CONTEXT_CHUNKS_PER_FILE = 2;
    static final int MAX_EXACT_ANCHOR_CHUNKS_PER_FILE = 1;
    private static final double ENDPOINT_ROUTE_AWARE_MIN_SCORE = 150.0;
    private static final double ROUTE_CONSTANT_INTENT_BOOST = 10_000.0;
    private static final double SOURCE_ROOT_METADATA_BOOST = 10_000.0;
    private static final List<String> ROLE_DIVERSITY_ORDER = List.of(
            "CONTROLLER",
            "SERVICE",
            "DATA_ACCESS",
            "DOMAIN_MODEL",
            "SOURCE",
            "FRONTEND",
            "TEST",
            "CONFIG"
    );
    private static final List<String> BACKEND_FLOW_ROLE_ORDER = List.of(
            "CONTROLLER",
            "SERVICE",
            "DATA_ACCESS",
            "DOMAIN_MODEL"
    );
    private static final Set<String> DOMAIN_TOKEN_STOP_WORDS = Set.of(
            "controller",
            "controllers",
            "service",
            "services",
            "repository",
            "repositories",
            "mapper",
            "mappers",
            "dao",
            "entity",
            "entities",
            "model",
            "models",
            "dto",
            "request",
            "response",
            "impl",
            "api",
            "http",
            "https",
            "flow",
            "flows",
            "chain",
            "chains",
            "trace",
            "traces",
            "tracing",
            "backend",
            "where",
            "which",
            "what",
            "explain",
            "handle",
            "handles",
            "handled",
            "call",
            "calls",
            "called",
            "through",
            "from",
            "create",
            "creates",
            "created",
            "update",
            "updates",
            "delete",
            "deletes",
            "save",
            "saves",
            "read",
            "reads",
            "write",
            "writes",
            "src",
            "main",
            "java",
            "kotlin",
            "com",
            "org",
            "net",
            "app",
            "apps"
    );

    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<CodeChunk> selectTopChunks(List<CodeChunk> chunks, String question, List<Float> questionEmbedding) {
        return selectTopChunks(chunks, question, questionEmbedding, null);
    }

    public List<CodeChunk> selectTopChunks(List<CodeChunk> chunks,
                                           String question,
                                           List<Float> questionEmbedding,
                                           String embeddingModelKey) {
        if (chunks == null || chunks.isEmpty()) {
            return List.of();
        }

        List<ScoredChunk> keywordCandidates = keywordCandidates(chunks, question);

        List<ScoredChunk> candidates = keywordCandidates;
        if (hasQuestionEmbedding(questionEmbedding) && shouldIncludeSemanticCandidates(keywordCandidates)) {
            List<ScoredChunk> semanticCandidates = chunks.stream()
                    .filter(chunk -> canUseEmbedding(chunk, questionEmbedding, embeddingModelKey))
                    .map(chunk -> new SemanticCandidate(
                            chunk,
                            semanticKeywordScore(chunk, question),
                            calculateCosineSimilarity(questionEmbedding, parseEmbedding(chunk.getEmbedding()))))
                    .sorted(Comparator
                            .comparingDouble(SemanticCandidate::semanticScore).reversed()
                            .thenComparing(Comparator.comparingDouble(SemanticCandidate::keywordScore).reversed()))
                    .limit(SEMANTIC_CANDIDATE_LIMIT)
                    .map(candidate -> new ScoredChunk(candidate.chunk(), candidate.keywordScore()))
                    .collect(Collectors.toCollection(ArrayList::new));
            candidates = mergeScoredCandidates(keywordCandidates, semanticCandidates);
        }

        if (candidates.isEmpty()) {
            candidates = chunks.stream()
                    .limit(Math.min(CANDIDATE_LIMIT, 20))
                    .map(chunk -> new ScoredChunk(chunk, 0.0))
                    .collect(Collectors.toCollection(ArrayList::new));
        }
        List<ScoredChunk> sourceRootCandidates = sourceRootMetadataExactCandidates(chunks, question);
        candidates = mergeScoredCandidates(sourceRootCandidates, mergeScoredCandidates(exactAnchorCandidates(chunks, question), candidates));
        if (!sourceRootCandidates.isEmpty()) {
            Map<String, Boolean> sourceRootCandidateKeys = sourceRootCandidates.stream()
                    .collect(Collectors.toMap(scored -> chunkKey(scored.chunk), scored -> true, (left, right) -> left));
            Map<String, Boolean> sourceRootCandidatePaths = sourceRootCandidates.stream()
                    .collect(Collectors.toMap(scored -> normalizeFilePath(scored.chunk.getFilePath()), scored -> true, (left, right) -> left));
            List<String> sourceRootHints = CodeChunkRanker.sourceRootHints(question);
            candidates = candidates.stream()
                    .filter(scored -> !isConflictingSourceRootExactDecoy(
                            scored.chunk,
                            question,
                            sourceRootHints,
                            sourceRootCandidateKeys,
                            sourceRootCandidatePaths))
                    .collect(Collectors.toCollection(ArrayList::new));
        }
        if (hasRootRelativeExactPathAnchor(chunks, question)) {
            Map<String, Boolean> sourceRootCandidateKeys = sourceRootCandidates.stream()
                    .collect(Collectors.toMap(scored -> chunkKey(scored.chunk), scored -> true, (left, right) -> left));
            candidates = candidates.stream()
                    .filter(scored -> !CodeChunkRanker.isExactLocationAnchorMatch(scored.chunk, question)
                            || CodeChunkRanker.isExactPathLocationAnchorMatch(scored.chunk, question)
                            || sourceRootCandidateKeys.containsKey(chunkKey(scored.chunk)))
                    .collect(Collectors.toCollection(ArrayList::new));
        }

        List<ScoredChunk> ranked = new ArrayList<>();
        for (ScoredChunk candidate : candidates) {
            double cosineSimilarity = 0.0;
            if (canUseEmbedding(candidate.chunk, questionEmbedding, embeddingModelKey)) {
                cosineSimilarity = calculateCosineSimilarity(questionEmbedding, parseEmbedding(candidate.chunk.getEmbedding()));
            }
            double hybridScore = candidate.keywordScore + 10.0 * cosineSimilarity;
            hybridScore += backendFlowDomainScore(candidate.chunk, question);
            if (hybridScore > 0) {
                ranked.add(new ScoredChunk(candidate.chunk, hybridScore));
            }
        }

        List<ScoredChunk> sorted = ranked.stream()
                .sorted(Comparator.comparingDouble((ScoredChunk scored) -> scored.keywordScore).reversed())
                .collect(Collectors.toList());
        List<CodeChunk> topChunks = diversifyByFile(sorted, question);

        if (topChunks.isEmpty()) {
            return chunks.stream().limit(FALLBACK_CONTEXT_LIMIT).collect(Collectors.toList());
        }
        return topChunks;
    }

    private List<ScoredChunk> keywordCandidates(List<CodeChunk> chunks, String question) {
        if (!CodeChunkRanker.endpointRouteHints(question).isEmpty()) {
            boolean routeConstantIntent = hasRouteConstantIntent(question);
            List<CodeChunkRanker.RouteAwareScoredChunk> ranked = CodeChunkRanker.rankWithPreviousSameFileContextScores(
                    chunks,
                    question,
                    CANDIDATE_LIMIT);
            List<ScoredChunk> candidates = new ArrayList<>();
            boolean hasSpringMappingRouteMatch = false;
            boolean hasRouteConstantHolderMatch = false;
            for (CodeChunkRanker.RouteAwareScoredChunk rankedChunk : ranked) {
                if (rankedChunk.strongEndpointRouteMatch() && rankedChunk.score() >= ENDPOINT_ROUTE_AWARE_MIN_SCORE) {
                    boolean routeConstantHolderMatch = CodeChunkRanker.hasRouteConstantHolderEndpointMatch(
                            rankedChunk.chunk(),
                            question);
                    double score = rankedChunk.score();
                    if (routeConstantIntent && routeConstantHolderMatch) {
                        score += ROUTE_CONSTANT_INTENT_BOOST;
                    }
                    candidates.add(new ScoredChunk(rankedChunk.chunk(), score));
                    hasSpringMappingRouteMatch = hasSpringMappingRouteMatch || rankedChunk.springMappingRouteMatch();
                    hasRouteConstantHolderMatch = hasRouteConstantHolderMatch || routeConstantHolderMatch;
                }
            }
            if (!candidates.isEmpty() && (hasSpringMappingRouteMatch || (routeConstantIntent && hasRouteConstantHolderMatch))) {
                return candidates;
            }
            return List.of();
        }
        return chunks.stream()
                .map(chunk -> new ScoredChunk(chunk, CodeChunkRanker.score(chunk, question)))
                .filter(scored -> scored.keywordScore > 0)
                .sorted(Comparator.comparingDouble((ScoredChunk scored) -> scored.keywordScore).reversed())
                .limit(CANDIDATE_LIMIT)
                .collect(Collectors.toCollection(ArrayList::new));
    }

    private boolean hasRouteConstantIntent(String question) {
        if (question == null || question.isBlank()) {
            return false;
        }
        String input = question.toLowerCase();
        boolean handlerIntent = input.contains("handler")
                || input.contains("controller")
                || input.contains("handles")
                || input.contains("handled by")
                || input.contains("处理")
                || input.contains("入口")
                || input.contains("控制器");
        if (handlerIntent) {
            return false;
        }
        return input.contains("route constant")
                || input.contains("route constants")
                || input.contains("route holder")
                || input.contains("apiroutes")
                || input.contains("url constant")
                || input.contains("uri constant")
                || input.contains("path constant")
                || input.contains("constant file")
                || (input.contains("where is") && input.contains("constant"))
                || (input.contains("where defined") && input.contains("route"))
                || (input.contains("where is defined") && input.contains("route"))
                || input.contains("路由常量")
                || input.contains("接口常量")
                || input.contains("路径常量")
                || input.contains("常量文件")
                || input.contains("常量在哪")
                || (input.contains("在哪定义") && input.contains("常量"));
    }

    private boolean hasQuestionEmbedding(List<Float> questionEmbedding) {
        return questionEmbedding != null && !questionEmbedding.isEmpty();
    }

    private double semanticKeywordScore(CodeChunk chunk, String question) {
        if (CodeChunkRanker.endpointRouteHints(question).isEmpty()) {
            return CodeChunkRanker.score(chunk, question);
        }
        if (hasRouteConstantIntent(question) && CodeChunkRanker.hasRouteConstantHolderEndpointMatch(chunk, question)) {
            return CodeChunkRanker.score(chunk, question);
        }
        if (CodeChunkRanker.hasSpringEndpointRouteMatch(chunk, question)) {
            return CodeChunkRanker.score(chunk, question);
        }
        return 0.0;
    }

    private boolean shouldIncludeSemanticCandidates(List<ScoredChunk> keywordCandidates) {
        if (keywordCandidates == null || keywordCandidates.isEmpty()) {
            return true;
        }
        double bestKeywordScore = keywordCandidates.stream()
                .mapToDouble(ScoredChunk::keywordScore)
                .max()
                .orElse(0.0);
        return bestKeywordScore < 45.0;
    }

    private List<ScoredChunk> exactAnchorCandidates(List<CodeChunk> chunks, String question) {
        if (chunks == null || chunks.isEmpty() || question == null || question.isBlank()) {
            return List.of();
        }
        List<ScoredChunk> anchors = chunks.stream()
                .filter(chunk -> CodeChunkRanker.isExactLocationAnchorMatch(chunk, question))
                .map(chunk -> new ScoredChunk(chunk, CodeChunkRanker.score(chunk, question)))
                .collect(Collectors.toCollection(ArrayList::new));
        boolean hasRootRelativeExactPathAnchor = anchors.stream()
                .anyMatch(scored -> isRootRelativeSourcePath(scored.chunk)
                        && CodeChunkRanker.isExactPathLocationAnchorMatch(scored.chunk, question));
        if (!hasRootRelativeExactPathAnchor) {
            return anchors;
        }
        return anchors.stream()
                .filter(scored -> CodeChunkRanker.isExactPathLocationAnchorMatch(scored.chunk, question))
                .collect(Collectors.toCollection(ArrayList::new));
    }

    private List<ScoredChunk> sourceRootMetadataExactCandidates(List<CodeChunk> chunks, String question) {
        if (chunks == null || chunks.isEmpty() || question == null || question.isBlank()) {
            return List.of();
        }
        List<String> sourceRootHints = CodeChunkRanker.sourceRootHints(question);
        if (sourceRootHints.isEmpty()) {
            return List.of();
        }
        return chunks.stream()
                .filter(chunk -> matchesAnySourceRootHint(chunk, sourceRootHints))
                .filter(chunk -> CodeChunkRanker.isExactLocationAnchorMatch(chunk, question))
                .map(chunk -> new ScoredChunk(chunk, CodeChunkRanker.score(chunk, question) + SOURCE_ROOT_METADATA_BOOST))
                .collect(Collectors.toCollection(ArrayList::new));
    }

    private boolean isConflictingSourceRootExactDecoy(CodeChunk chunk,
                                                      String question,
                                                      List<String> sourceRootHints,
                                                      Map<String, Boolean> sourceRootCandidateKeys,
                                                      Map<String, Boolean> sourceRootCandidatePaths) {
        if (chunk == null
                || sourceRootCandidateKeys == null
                || sourceRootCandidatePaths == null
                || sourceRootCandidateKeys.containsKey(chunkKey(chunk))) {
            return false;
        }
        String path = normalizeFilePath(chunk.getFilePath());
        return sourceRootCandidatePaths.containsKey(path)
                && CodeChunkRanker.isExactLocationAnchorMatch(chunk, question)
                && !matchesAnySourceRootHint(chunk, sourceRootHints);
    }

    private boolean hasRootRelativeExactPathAnchor(List<CodeChunk> chunks, String question) {
        if (chunks == null || chunks.isEmpty() || question == null || question.isBlank()) {
            return false;
        }
        return chunks.stream()
                .anyMatch(chunk -> isRootRelativeSourcePath(chunk)
                        && CodeChunkRanker.isExactPathLocationAnchorMatch(chunk, question));
    }

    private boolean isRootRelativeSourcePath(CodeChunk chunk) {
        String path = normalizeFilePath(chunk == null ? null : chunk.getFilePath());
        return path.startsWith("src/");
    }

    private boolean matchesAnySourceRootHint(CodeChunk chunk, List<String> sourceRootHints) {
        if (chunk == null || sourceRootHints == null || sourceRootHints.isEmpty()) {
            return false;
        }
        String path = normalizeFilePath(chunk.getFilePath());
        String workspaceRoot = normalizeFilePath(chunk.getWorkspaceRoot());
        String moduleRoot = normalizeFilePath(chunk.getModuleRoot());
        for (String hint : sourceRootHints) {
            String normalizedHint = normalizeFilePath(hint);
            if (normalizedHint.isBlank()) {
                continue;
            }
            if (isPathUnderRoot(path, normalizedHint)
                    || isModuleLocalPathUnderRoot(path, workspaceRoot, normalizedHint)
                    || isModuleLocalPathUnderRoot(path, moduleRoot, normalizedHint)) {
                return true;
            }
        }
        return false;
    }

    private boolean isPathUnderRoot(String path, String root) {
        return path != null && root != null && !path.isBlank() && !root.isBlank()
                && (path.equals(root) || path.startsWith(root + "/"));
    }

    private boolean isModuleLocalPathUnderRoot(String path, String root, String sourceRootHint) {
        return !path.isBlank()
                && !root.isBlank()
                && root.equals(sourceRootHint)
                && !isPathUnderRoot(path, sourceRootHint)
                && isModuleLocalSourcePath(path);
    }

    private boolean isModuleLocalSourcePath(String path) {
        return path.startsWith("src/")
                || path.startsWith("test/")
                || path.startsWith("tests/")
                || path.startsWith("config/")
                || path.startsWith("public/")
                || path.startsWith("app/")
                || path.startsWith("lib/");
    }

    private List<ScoredChunk> mergeScoredCandidates(List<ScoredChunk> primary, List<ScoredChunk> extra) {
        if ((primary == null || primary.isEmpty()) && (extra == null || extra.isEmpty())) {
            return List.of();
        }
        LinkedHashMap<String, ScoredChunk> merged = new LinkedHashMap<>();
        if (primary != null) {
            for (ScoredChunk scored : primary) {
                if (scored != null && scored.chunk != null) {
                    merged.putIfAbsent(chunkKey(scored.chunk), scored);
                }
            }
        }
        if (extra != null) {
            for (ScoredChunk scored : extra) {
                if (scored != null && scored.chunk != null) {
                    merged.putIfAbsent(chunkKey(scored.chunk), scored);
                }
            }
        }
        return new ArrayList<>(merged.values());
    }

    private boolean canUseEmbedding(CodeChunk chunk, List<Float> questionEmbedding, String embeddingModelKey) {
        if (questionEmbedding == null || questionEmbedding.isEmpty() || chunk == null
                || chunk.getEmbedding() == null || chunk.getEmbedding().isBlank()) {
            return false;
        }
        if (embeddingModelKey == null || embeddingModelKey.isBlank()) {
            return true;
        }
        return embeddingModelKey.equals(chunk.getEmbeddingModel());
    }

    private List<CodeChunk> diversifyByFile(List<ScoredChunk> ranked, String question) {
        List<CodeChunk> selected = new ArrayList<>();
        Map<String, Integer> selectedByFile = new HashMap<>();
        Map<String, Boolean> selectedKeys = new HashMap<>();

        for (ScoredChunk scored : ranked) {
            if (selected.size() >= TOP_CONTEXT_LIMIT) {
                break;
            }
            if (!CodeChunkRanker.isExactLocationAnchorMatch(scored.chunk, question)) {
                continue;
            }
            String filePath = contextFileKey(scored.chunk);
            if (selectedByFile.getOrDefault(filePath, 0) >= MAX_EXACT_ANCHOR_CHUNKS_PER_FILE) {
                continue;
            }
            addSelectedChunk(selected, selectedByFile, selectedKeys, scored.chunk);
        }

        if (selected.isEmpty() && !ranked.isEmpty()) {
            addSelectedChunk(selected, selectedByFile, selectedKeys, ranked.get(0).chunk);
        }

        addBackendFlowNeighborChunks(selected, selectedByFile, selectedKeys, ranked, question);
        addRoleDiverseChunks(selected, selectedByFile, selectedKeys, ranked);

        for (ScoredChunk scored : ranked) {
            if (selected.size() >= TOP_CONTEXT_LIMIT) {
                break;
            }
            if (selectedKeys.containsKey(chunkKey(scored.chunk))) {
                continue;
            }
            String filePath = contextFileKey(scored.chunk);
            int fileCount = selectedByFile.getOrDefault(filePath, 0);
            if (fileCount >= MAX_CONTEXT_CHUNKS_PER_FILE) {
                continue;
            }
            addSelectedChunk(selected, selectedByFile, selectedKeys, scored.chunk);
        }

        if (selected.size() >= TOP_CONTEXT_LIMIT) {
            return selected;
        }

        for (ScoredChunk scored : ranked) {
            if (selected.size() >= TOP_CONTEXT_LIMIT) {
                break;
            }
            if (!selectedKeys.containsKey(chunkKey(scored.chunk))) {
                addSelectedChunk(selected, selectedByFile, selectedKeys, scored.chunk);
            }
        }
        return selected;
    }

    private void addBackendFlowNeighborChunks(List<CodeChunk> selected,
                                              Map<String, Integer> selectedByFile,
                                              Map<String, Boolean> selectedKeys,
                                              List<ScoredChunk> ranked,
                                              String question) {
        if (selected.size() >= TOP_CONTEXT_LIMIT
                || selected.isEmpty()
                || ranked == null
                || ranked.isEmpty()
                || !hasBackendFlowRetrievalIntent(question)) {
            return;
        }
        Set<String> anchorDomainTokens = backendFlowDomainTokens(selected.get(0), question);
        if (anchorDomainTokens.isEmpty()) {
            return;
        }
        Set<String> selectedRoles = selected.stream()
                .map(CodeChunkRanker::evidenceType)
                .collect(Collectors.toCollection(LinkedHashSet::new));
        for (String role : BACKEND_FLOW_ROLE_ORDER) {
            if (selected.size() >= TOP_CONTEXT_LIMIT) {
                break;
            }
            if (selectedRoles.contains(role)) {
                continue;
            }
            ScoredChunk neighbor = ranked.stream()
                    .filter(scored -> scored != null
                            && scored.chunk != null
                            && !selectedKeys.containsKey(chunkKey(scored.chunk))
                            && role.equals(CodeChunkRanker.evidenceType(scored.chunk))
                            && sharesBackendFlowDomain(scored.chunk, anchorDomainTokens))
                    .max(Comparator
                            .comparingDouble((ScoredChunk scored) -> scored.keywordScore + backendFlowNeighborBonus(scored.chunk, anchorDomainTokens))
                            .thenComparing(scored -> safePath(scored.chunk)))
                    .orElse(null);
            if (neighbor == null) {
                continue;
            }
            String filePath = contextFileKey(neighbor.chunk);
            int fileCount = selectedByFile.getOrDefault(filePath, 0);
            if (fileCount >= MAX_CONTEXT_CHUNKS_PER_FILE) {
                continue;
            }
            addSelectedChunk(selected, selectedByFile, selectedKeys, neighbor.chunk);
            selectedRoles.add(role);
        }
    }

    private boolean hasBackendFlowRetrievalIntent(String question) {
        List<String> roleIntents = CodeChunkRanker.roleIntentTypes(question);
        if (roleIntents.contains("CONTROLLER")
                && (roleIntents.contains("SERVICE") || roleIntents.contains("DATA_ACCESS"))) {
            return true;
        }
        if (question == null || question.isBlank()) {
            return false;
        }
        String input = question.toLowerCase(Locale.ROOT);
        return (input.contains("flow") || input.contains("chain") || input.contains("trace") || input.contains("链路") || input.contains("调用链"))
                && (input.contains("controller") || input.contains("接口") || input.contains("入口"))
                && (input.contains("service") || input.contains("repository") || input.contains("mapper") || input.contains("dao")
                || input.contains("服务") || input.contains("仓储") || input.contains("数据访问"));
    }

    private Set<String> backendFlowDomainTokens(CodeChunk anchor, String question) {
        LinkedHashSet<String> tokens = new LinkedHashSet<>();
        addDomainTokens(tokens, question);
        addDomainTokens(tokens, anchor == null ? null : anchor.getFilePath());
        addDomainTokens(tokens, anchor == null ? null : anchor.getContent());
        return tokens;
    }

    private double backendFlowDomainScore(CodeChunk chunk, String question) {
        if (!hasBackendFlowRetrievalIntent(question)) {
            return 0.0;
        }
        LinkedHashSet<String> queryDomainTokens = new LinkedHashSet<>();
        addDomainTokens(queryDomainTokens, question);
        if (queryDomainTokens.isEmpty() || !sharesBackendFlowDomain(chunk, queryDomainTokens)) {
            return 0.0;
        }
        Set<String> candidateTokens = new LinkedHashSet<>();
        addDomainTokens(candidateTokens, chunk == null ? null : chunk.getFilePath());
        addDomainTokens(candidateTokens, chunk == null ? null : chunk.getContent());
        long overlaps = candidateTokens.stream().filter(queryDomainTokens::contains).count();
        double score = overlaps * 150.0;
        if (BACKEND_FLOW_ROLE_ORDER.contains(CodeChunkRanker.evidenceType(chunk))) {
            score += 60.0;
        }
        return score;
    }

    private void addDomainTokens(Set<String> tokens, String input) {
        if (tokens == null || input == null || input.isBlank()) {
            return;
        }
        for (String token : input.replaceAll("([a-z])([A-Z])", "$1 $2")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", " ")
                .trim()
                .split("\\s+")) {
            if (isUsefulDomainToken(token)) {
                tokens.add(token);
            }
        }
    }

    private boolean isUsefulDomainToken(String token) {
        return token != null
                && token.length() >= 4
                && !DOMAIN_TOKEN_STOP_WORDS.contains(token)
                && !token.chars().allMatch(Character::isDigit);
    }

    private boolean sharesBackendFlowDomain(CodeChunk chunk, Set<String> anchorDomainTokens) {
        if (chunk == null || anchorDomainTokens == null || anchorDomainTokens.isEmpty()) {
            return false;
        }
        Set<String> candidateTokens = new LinkedHashSet<>();
        addDomainTokens(candidateTokens, chunk.getFilePath());
        addDomainTokens(candidateTokens, chunk.getContent());
        return candidateTokens.stream().anyMatch(anchorDomainTokens::contains);
    }

    private double backendFlowNeighborBonus(CodeChunk chunk, Set<String> anchorDomainTokens) {
        Set<String> candidateTokens = new LinkedHashSet<>();
        addDomainTokens(candidateTokens, chunk == null ? null : chunk.getFilePath());
        addDomainTokens(candidateTokens, chunk == null ? null : chunk.getContent());
        long overlaps = candidateTokens.stream().filter(anchorDomainTokens::contains).count();
        return overlaps * 25.0;
    }

    private String safePath(CodeChunk chunk) {
        return normalizeFilePath(chunk == null ? null : chunk.getFilePath());
    }

    private void addRoleDiverseChunks(List<CodeChunk> selected,
                                      Map<String, Integer> selectedByFile,
                                      Map<String, Boolean> selectedKeys,
                                      List<ScoredChunk> ranked) {
        if (selected.size() >= TOP_CONTEXT_LIMIT || ranked == null || ranked.isEmpty()) {
            return;
        }
        Map<String, Boolean> selectedRoles = new HashMap<>();
        for (CodeChunk chunk : selected) {
            selectedRoles.put(CodeChunkRanker.evidenceType(chunk), true);
        }
        for (String role : ROLE_DIVERSITY_ORDER) {
            if (selected.size() >= TOP_CONTEXT_LIMIT) {
                break;
            }
            if (selectedRoles.containsKey(role)) {
                continue;
            }
            for (ScoredChunk scored : ranked) {
                if (selected.size() >= TOP_CONTEXT_LIMIT) {
                    break;
                }
                if (selectedKeys.containsKey(chunkKey(scored.chunk)) || !role.equals(CodeChunkRanker.evidenceType(scored.chunk))) {
                    continue;
                }
                String filePath = contextFileKey(scored.chunk);
                int fileCount = selectedByFile.getOrDefault(filePath, 0);
                if (fileCount >= MAX_CONTEXT_CHUNKS_PER_FILE) {
                    continue;
                }
                addSelectedChunk(selected, selectedByFile, selectedKeys, scored.chunk);
                selectedRoles.put(role, true);
                break;
            }
        }
    }

    private void addSelectedChunk(List<CodeChunk> selected,
                                  Map<String, Integer> selectedByFile,
                                  Map<String, Boolean> selectedKeys,
                                  CodeChunk chunk) {
        selected.add(chunk);
        selectedKeys.put(chunkKey(chunk), true);
        String filePath = contextFileKey(chunk);
        selectedByFile.put(filePath, selectedByFile.getOrDefault(filePath, 0) + 1);
    }

    private String contextFileKey(CodeChunk chunk) {
        String path = normalizeFilePath(chunk == null ? null : chunk.getFilePath());
        if (path.isBlank()) {
            return "";
        }
        String moduleRoot = normalizeFilePath(chunk.getModuleRoot());
        if (!moduleRoot.isBlank() && !isPathUnderRoot(path, moduleRoot) && isModuleLocalSourcePath(path)) {
            return moduleRoot + "/" + path;
        }
        String workspaceRoot = normalizeFilePath(chunk.getWorkspaceRoot());
        if (!workspaceRoot.isBlank() && !isPathUnderRoot(path, workspaceRoot) && isModuleLocalSourcePath(path)) {
            return workspaceRoot + "/" + path;
        }
        return path;
    }

    private List<Float> parseEmbedding(String json) {
        if (json == null || json.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<Float>>() {});
        } catch (Exception e) {
            return null;
        }
    }

    private double calculateCosineSimilarity(List<Float> vectorA, List<Float> vectorB) {
        if (vectorA == null || vectorB == null || vectorA.size() != vectorB.size() || vectorA.isEmpty()) {
            return 0.0;
        }
        double dotProduct = 0.0;
        double normA = 0.0;
        double normB = 0.0;
        for (int i = 0; i < vectorA.size(); i++) {
            float a = vectorA.get(i);
            float b = vectorB.get(i);
            dotProduct += a * b;
            normA += a * a;
            normB += b * b;
        }
        if (normA == 0.0 || normB == 0.0) {
            return 0.0;
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    private String normalizeFilePath(String filePath) {
        return filePath == null ? "" : filePath.replace('\\', '/').toLowerCase();
    }

    private String chunkKey(CodeChunk chunk) {
        if (chunk.getId() != null) {
            return "id:" + chunk.getId();
        }
        return "range:" + (chunk.getScanTaskId() == null ? "" : chunk.getScanTaskId())
                + ":" + normalizeFilePath(chunk.getWorkspaceRoot())
                + ":" + normalizeFilePath(chunk.getModuleRoot())
                + ":" + (chunk.getFilePath() == null ? "" : chunk.getFilePath())
                + ":" + (chunk.getStartLine() == null ? "" : chunk.getStartLine())
                + ":" + (chunk.getEndLine() == null ? "" : chunk.getEndLine());
    }

    private record ScoredChunk(CodeChunk chunk, double keywordScore) {
    }

    private record SemanticCandidate(CodeChunk chunk, double keywordScore, double semanticScore) {
    }
}
