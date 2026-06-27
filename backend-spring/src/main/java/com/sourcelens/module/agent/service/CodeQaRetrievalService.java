package com.sourcelens.module.agent.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sourcelens.module.analysis.entity.CodeChunk;
import com.sourcelens.module.analysis.service.CodeChunkRanker;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CodeQaRetrievalService {

    static final int CANDIDATE_LIMIT = 80;
    static final int TOP_CONTEXT_LIMIT = 4;
    static final int FALLBACK_CONTEXT_LIMIT = 2;
    static final int MAX_CONTEXT_CHUNKS_PER_FILE = 2;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<CodeChunk> selectTopChunks(List<CodeChunk> chunks, String question, List<Float> questionEmbedding) {
        if (chunks == null || chunks.isEmpty()) {
            return List.of();
        }

        String[] keywords = CodeChunkRanker.tokenize(question);
        List<ScoredChunk> candidates = chunks.stream()
                .map(chunk -> new ScoredChunk(chunk, CodeChunkRanker.score(chunk, keywords)))
                .filter(scored -> scored.keywordScore > 0)
                .sorted(Comparator.comparingDouble((ScoredChunk scored) -> scored.keywordScore).reversed())
                .limit(CANDIDATE_LIMIT)
                .collect(Collectors.toCollection(ArrayList::new));

        if (candidates.isEmpty()) {
            candidates = chunks.stream()
                    .limit(Math.min(CANDIDATE_LIMIT, 20))
                    .map(chunk -> new ScoredChunk(chunk, 0.0))
                    .collect(Collectors.toCollection(ArrayList::new));
        }

        List<ScoredChunk> ranked = new ArrayList<>();
        for (ScoredChunk candidate : candidates) {
            double cosineSimilarity = 0.0;
            if (questionEmbedding != null && candidate.chunk.getEmbedding() != null) {
                cosineSimilarity = calculateCosineSimilarity(questionEmbedding, parseEmbedding(candidate.chunk.getEmbedding()));
            }
            double hybridScore = candidate.keywordScore + 10.0 * cosineSimilarity;
            if (hybridScore > 0) {
                ranked.add(new ScoredChunk(candidate.chunk, hybridScore));
            }
        }

        List<ScoredChunk> sorted = ranked.stream()
                .sorted(Comparator.comparingDouble((ScoredChunk scored) -> scored.keywordScore).reversed())
                .collect(Collectors.toList());
        List<CodeChunk> topChunks = diversifyByFile(sorted);

        if (topChunks.isEmpty()) {
            return chunks.stream().limit(FALLBACK_CONTEXT_LIMIT).collect(Collectors.toList());
        }
        return topChunks;
    }

    private List<CodeChunk> diversifyByFile(List<ScoredChunk> ranked) {
        List<CodeChunk> selected = new ArrayList<>();
        Map<String, Integer> selectedByFile = new HashMap<>();

        for (ScoredChunk scored : ranked) {
            if (selected.size() >= TOP_CONTEXT_LIMIT) {
                break;
            }
            String filePath = normalizeFilePath(scored.chunk.getFilePath());
            int fileCount = selectedByFile.getOrDefault(filePath, 0);
            if (fileCount >= MAX_CONTEXT_CHUNKS_PER_FILE) {
                continue;
            }
            selected.add(scored.chunk);
            selectedByFile.put(filePath, fileCount + 1);
        }

        if (selected.size() >= TOP_CONTEXT_LIMIT) {
            return selected;
        }

        for (ScoredChunk scored : ranked) {
            if (selected.size() >= TOP_CONTEXT_LIMIT) {
                break;
            }
            if (!selected.contains(scored.chunk)) {
                selected.add(scored.chunk);
            }
        }
        return selected;
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

    private record ScoredChunk(CodeChunk chunk, double keywordScore) {
    }
}
