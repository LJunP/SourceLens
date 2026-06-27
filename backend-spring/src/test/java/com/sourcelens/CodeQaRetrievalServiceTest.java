package com.sourcelens;

import com.sourcelens.module.agent.service.CodeQaRetrievalService;
import com.sourcelens.module.analysis.entity.CodeChunk;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CodeQaRetrievalServiceTest {

    private final CodeQaRetrievalService retrievalService = new CodeQaRetrievalService();

    @Test
    void selectTopChunks_shouldPreferPathAndContentKeywordMatches() {
        List<CodeChunk> chunks = List.of(
                chunk("src/main/java/app/payment/PaymentService.java", "class PaymentService { void refund() {} }", null),
                chunk("src/main/java/app/user/UserService.java", "class UserService { void login() {} }", null),
                chunk("README.md", "deployment notes", null)
        );

        List<CodeChunk> selected = retrievalService.selectTopChunks(chunks, "payment refund", null);

        assertEquals("src/main/java/app/payment/PaymentService.java", selected.get(0).getFilePath());
    }

    @Test
    void selectTopChunks_shouldPreferSourceRoleEvidenceOverBroadDocs() {
        List<CodeChunk> chunks = List.of(
                chunk("AGENTS.md", "Repository Guidelines mention controller service repository.", null),
                chunk("src/main/java/app/controller/PawnTicketController.java",
                        "@RestController class PawnTicketController { private PawnTicketService service; }", null),
                chunk("src/main/resources/admin/src/components/chat/ServiceChat.vue",
                        "function sendMessage() { return service.chat() }", null)
        );

        List<CodeChunk> selected = retrievalService.selectTopChunks(chunks, "controller service repository", null);

        assertEquals("src/main/java/app/controller/PawnTicketController.java", selected.get(0).getFilePath());
    }

    @Test
    void selectTopChunks_shouldFilterCandidatesBeforeVectorRanking() {
        List<CodeChunk> chunks = List.of(
                chunk("src/auth/AuthService.java", "auth token validation", "[0.0, 1.0]"),
                chunk("src/billing/BillingService.java", "invoice capture", "[1.0, 0.0]")
        );

        List<CodeChunk> selected = retrievalService.selectTopChunks(chunks, "auth token", List.of(1.0f, 0.0f));

        assertEquals(1, selected.size());
        assertEquals("src/auth/AuthService.java", selected.get(0).getFilePath());
    }

    @Test
    void selectTopChunks_shouldUseVectorSimilarityWhenKeywordScoresAreAbsent() {
        List<CodeChunk> chunks = List.of(
                chunk("src/early/Unrelated.java", "alpha", "[0.0, 1.0]"),
                chunk("src/semantic/SemanticMatch.java", "beta", "[1.0, 0.0]")
        );

        List<CodeChunk> selected = retrievalService.selectTopChunks(chunks, "????", List.of(1.0f, 0.0f));

        assertEquals("src/semantic/SemanticMatch.java", selected.get(0).getFilePath());
    }

    @Test
    void selectTopChunks_shouldDiversifyContextAcrossFilesBeforeBackfillingSameFile() {
        List<CodeChunk> chunks = List.of(
                chunk("src/main/java/app/service/PaymentService.java", "payment refund service token token token", null, 1, 50),
                chunk("src/main/java/app/service/PaymentService.java", "payment refund service token token token", null, 41, 90),
                chunk("src/main/java/app/service/PaymentService.java", "payment refund service token token token", null, 81, 130),
                chunk("src/main/java/app/service/PaymentService.java", "payment refund service token token token", null, 121, 170),
                chunk("src/main/java/app/controller/PaymentController.java", "payment refund controller", null, 1, 40)
        );

        List<CodeChunk> selected = retrievalService.selectTopChunks(chunks, "payment refund", null);

        assertEquals(4, selected.size());
        assertTrue(selected.stream()
                .map(CodeChunk::getFilePath)
                .toList()
                .contains("src/main/java/app/controller/PaymentController.java"));
        assertTrue(selected.subList(0, 3).stream()
                .map(CodeChunk::getFilePath)
                .toList()
                .contains("src/main/java/app/controller/PaymentController.java"));
    }

    @Test
    void selectTopChunks_shouldFallbackWhenNoKeywordMatches() {
        List<CodeChunk> chunks = new ArrayList<>();
        chunks.add(chunk("src/a/A.java", "alpha", null));
        chunks.add(chunk("src/b/B.java", "beta", null));
        chunks.add(chunk("src/c/C.java", "gamma", null));

        List<CodeChunk> selected = retrievalService.selectTopChunks(chunks, "????", null);

        assertEquals(2, selected.size());
        assertTrue(selected.stream().map(CodeChunk::getFilePath).toList().contains("src/a/A.java"));
        assertTrue(selected.stream().map(CodeChunk::getFilePath).toList().contains("src/b/B.java"));
    }

    private CodeChunk chunk(String path, String content, String embedding) {
        return chunk(path, content, embedding, 1, 1);
    }

    private CodeChunk chunk(String path, String content, String embedding, int startLine, int endLine) {
        return CodeChunk.builder()
                .filePath(path)
                .content(content)
                .startLine(startLine)
                .endLine(endLine)
                .embedding(embedding)
                .build();
    }
}
