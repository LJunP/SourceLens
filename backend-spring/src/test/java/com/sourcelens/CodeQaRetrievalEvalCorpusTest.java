package com.sourcelens;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sourcelens.module.agent.service.CodeQaRetrievalService;
import com.sourcelens.module.analysis.entity.CodeChunk;
import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CodeQaRetrievalEvalCorpusTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final CodeQaRetrievalService retrievalService = new CodeQaRetrievalService();

    @Test
    void fixedRetrievalEvalCorpus_shouldPassAllCases() throws Exception {
        RetrievalEvalCorpus corpus;
        try (InputStream input = getClass().getResourceAsStream("/p6-code-qa-retrieval-eval-cases.json")) {
            assertNotNull(input, "missing p6-code-qa-retrieval-eval-cases.json");
            corpus = objectMapper.readValue(input, RetrievalEvalCorpus.class);
        }

        assertEquals(1, corpus.version());
        assertNotNull(corpus.metrics(), "P6 retrieval eval corpus metrics are required");
        assertEquals("fixed_golden_regression", corpus.metrics().evaluationScope(),
                "P6 retrieval eval corpus must not be represented as a broad benchmark");
        assertTrue(!corpus.metrics().benchmarkClaim(),
                "P6 retrieval eval corpus must stay explicit that it is not a benchmark claim");
        int topK = corpus.metrics().topK();
        assertTrue(topK > 0, "P6 retrieval eval topK must be positive");
        assertTrue(corpus.cases().size() >= corpus.metrics().minCaseCount(),
                "P6 retrieval eval corpus must keep core case coverage");

        Set<String> caseIds = new HashSet<>();
        double recallAtKSum = 0.0;
        double mrrAtKSum = 0.0;
        for (RetrievalEvalCase evalCase : corpus.cases()) {
            assertTrue(hasText(evalCase.id()), "P6 retrieval eval case id is required");
            assertTrue(caseIds.add(evalCase.id()), "duplicate P6 retrieval eval case id: " + evalCase.id());
            assertTrue(hasText(evalCase.question()), evalCase.id() + " question is required");
            assertTrue(hasText(evalCase.expectedFirstPath()), evalCase.id() + " expectedFirstPath is required");
            assertTrue(!evalCase.expectedIncludedPaths().isEmpty(),
                    evalCase.id() + " must declare at least one expectedIncludedPath");
            assertTrue(!evalCase.chunks().isEmpty(), evalCase.id() + " must declare candidate chunks");

            List<CodeChunk> selected = retrievalService.selectTopChunks(
                    evalCase.chunks().stream().map(this::toChunk).toList(),
                    evalCase.question(),
                    evalCase.queryEmbedding(),
                    evalCase.embeddingModelKey());

            assertTrue(!selected.isEmpty(), evalCase.id() + " should return at least one chunk");
            assertEquals(evalCase.expectedFirstPath(), selected.get(0).getFilePath(),
                    evalCase.id() + " first path mismatch");
            if (evalCase.expectedFirstStartLine() != null) {
                assertEquals(evalCase.expectedFirstStartLine(), selected.get(0).getStartLine(),
                        evalCase.id() + " first startLine mismatch");
            }
            if (hasText(evalCase.expectedFirstWorkspaceRoot())) {
                assertEquals(evalCase.expectedFirstWorkspaceRoot(), selected.get(0).getWorkspaceRoot(),
                        evalCase.id() + " first workspaceRoot mismatch");
            }
            if (hasText(evalCase.expectedFirstModuleRoot())) {
                assertEquals(evalCase.expectedFirstModuleRoot(), selected.get(0).getModuleRoot(),
                        evalCase.id() + " first moduleRoot mismatch");
            }

            List<String> selectedPaths = selected.stream().map(CodeChunk::getFilePath).toList();
            List<String> topKPaths = selectedPaths.stream().limit(topK).toList();
            long expectedIncludedHitsAtK = evalCase.expectedIncludedPaths().stream()
                    .filter(topKPaths::contains)
                    .count();
            recallAtKSum += expectedIncludedHitsAtK / (double) evalCase.expectedIncludedPaths().size();
            mrrAtKSum += reciprocalRankAtK(evalCase.expectedFirstPath(), selectedPaths, topK);

            for (String expectedPath : evalCase.expectedIncludedPaths()) {
                assertTrue(selectedPaths.contains(expectedPath),
                        evalCase.id() + " missing expected path " + expectedPath + " in " + selectedPaths);
            }
            List<String> selectedWorkspaceRoots = selected.stream().map(CodeChunk::getWorkspaceRoot).toList();
            for (String expectedWorkspaceRoot : evalCase.expectedIncludedWorkspaceRoots()) {
                assertTrue(selectedWorkspaceRoots.contains(expectedWorkspaceRoot),
                        evalCase.id() + " missing expected workspaceRoot " + expectedWorkspaceRoot
                                + " in " + selectedWorkspaceRoots);
            }

            for (Map.Entry<String, Integer> entry : evalCase.maxSelectedCountByPath().entrySet()) {
                long count = selectedPaths.stream().filter(entry.getKey()::equals).count();
                assertTrue(count <= entry.getValue(),
                        evalCase.id() + " selected too many chunks for " + entry.getKey() + ": " + count);
            }
        }
        for (String requiredCaseId : corpus.metrics().requiredCaseIds()) {
            assertTrue(caseIds.contains(requiredCaseId),
                    "P6 retrieval eval corpus is missing required case id: " + requiredCaseId);
        }

        double recallAtK = recallAtKSum / corpus.cases().size();
        double mrrAtK = mrrAtKSum / corpus.cases().size();
        assertTrue(recallAtK >= corpus.metrics().minRecallAtK(),
                "P6 retrieval eval Recall@" + topK + " below threshold: " + recallAtK);
        assertTrue(mrrAtK >= corpus.metrics().minMrrAtK(),
                "P6 retrieval eval MRR@" + topK + " below threshold: " + mrrAtK);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private double reciprocalRankAtK(String expectedFirstPath, List<String> selectedPaths, int topK) {
        int limit = Math.min(topK, selectedPaths.size());
        for (int i = 0; i < limit; i++) {
            if (expectedFirstPath.equals(selectedPaths.get(i))) {
                return 1.0 / (i + 1);
            }
        }
        return 0.0;
    }

    private CodeChunk toChunk(RetrievalEvalChunk evalChunk) {
        assertTrue(hasText(evalChunk.path()), "retrieval eval chunk path is required");
        assertTrue(hasText(evalChunk.content()), "retrieval eval chunk content is required for " + evalChunk.path());
        return CodeChunk.builder()
                .id(evalChunk.id())
                .scanTaskId(evalChunk.scanTaskId())
                .filePath(evalChunk.path())
                .workspaceRoot(evalChunk.workspaceRoot())
                .moduleRoot(evalChunk.moduleRoot())
                .content(evalChunk.content())
                .startLine(evalChunk.startLine() == null ? 1 : evalChunk.startLine())
                .endLine(evalChunk.endLine() == null ? 1 : evalChunk.endLine())
                .embedding(evalChunk.embedding())
                .embeddingModel(evalChunk.embeddingModel())
                .build();
    }

    private record RetrievalEvalCorpus(
            int version,
            String description,
            RetrievalEvalMetrics metrics,
            List<RetrievalEvalCase> cases
    ) {
        private RetrievalEvalCorpus {
            cases = cases == null ? List.of() : cases;
        }
    }

    private record RetrievalEvalMetrics(
            String evaluationScope,
            boolean benchmarkClaim,
            int topK,
            int minCaseCount,
            List<String> requiredCaseIds,
            double minRecallAtK,
            double minMrrAtK
    ) {
        private RetrievalEvalMetrics {
            requiredCaseIds = requiredCaseIds == null ? List.of() : requiredCaseIds;
        }
    }

    private record RetrievalEvalCase(
            String id,
            String question,
            String embeddingModelKey,
            List<Float> queryEmbedding,
            String expectedFirstPath,
            Integer expectedFirstStartLine,
            String expectedFirstWorkspaceRoot,
            String expectedFirstModuleRoot,
            List<String> expectedIncludedPaths,
            List<String> expectedIncludedWorkspaceRoots,
            Map<String, Integer> maxSelectedCountByPath,
            List<RetrievalEvalChunk> chunks
    ) {
        private RetrievalEvalCase {
            expectedIncludedPaths = expectedIncludedPaths == null ? List.of() : expectedIncludedPaths;
            expectedIncludedWorkspaceRoots = expectedIncludedWorkspaceRoots == null ? List.of() : expectedIncludedWorkspaceRoots;
            maxSelectedCountByPath = maxSelectedCountByPath == null ? Map.of() : maxSelectedCountByPath;
            chunks = chunks == null ? List.of() : chunks;
        }
    }

    private record RetrievalEvalChunk(
            Long id,
            Long scanTaskId,
            String path,
            String workspaceRoot,
            String moduleRoot,
            String content,
            Integer startLine,
            Integer endLine,
            String embedding,
            String embeddingModel
    ) {
    }
}
