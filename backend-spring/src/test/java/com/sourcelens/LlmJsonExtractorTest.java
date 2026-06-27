package com.sourcelens;

import com.sourcelens.module.agent.service.LlmJsonExtractor;
import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LlmJsonExtractorTest {

    private final LlmJsonExtractor extractor = new LlmJsonExtractor();

    @Test
    void extractObject_shouldParseFencedJson() {
        Map<String, Object> json = extractor.extractObject("""
                ```json
                {"riskLevel":"LOW","mergeRecommendation":"MERGE"}
                ```
                """).orElseThrow();

        assertEquals("LOW", json.get("riskLevel"));
        assertEquals("MERGE", json.get("mergeRecommendation"));
    }

    @Test
    void extractObject_shouldParseJsonSurroundedByExplanatoryText() {
        Map<String, Object> json = extractor.extractObject("""
                Sure, here is the result:
                {"errorCategory":"TEST","failureSummary":"unit tests failed"}
                Thanks.
                """).orElseThrow();

        assertEquals("TEST", json.get("errorCategory"));
        assertEquals("unit tests failed", json.get("failureSummary"));
    }

    @Test
    void extractObject_shouldHandleBracesInsideJsonStrings() {
        Map<String, Object> json = extractor.extractObject("""
                {"message":"Use map syntax like {key: value} safely","ok":true}
                trailing text
                """).orElseThrow();

        assertEquals("Use map syntax like {key: value} safely", json.get("message"));
        assertEquals(true, json.get("ok"));
    }

    @Test
    void extractRequiredObject_shouldRejectMissingRequiredFields() {
        assertThrows(IllegalArgumentException.class, () -> extractor.extractRequiredObject(
                "{\"riskLevel\":\"LOW\"}",
                Set.of("riskLevel", "mergeRecommendation"),
                "PR_REVIEW"));
    }

    @Test
    void extractObject_shouldReturnEmptyForInvalidJson() {
        assertTrue(extractor.extractObject("not json").isEmpty());
        assertFalse(extractor.extractObject("{\"ok\":true}").isEmpty());
    }
}
