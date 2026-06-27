package com.sourcelens;

import com.sourcelens.module.agent.entity.LlmConfig;
import com.sourcelens.module.agent.service.LlmClient;
import com.sourcelens.module.agent.service.MockLlmProviderAdapter;
import com.sourcelens.module.agent.service.OpenAiCompatibleLlmProviderAdapter;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LlmClientAdapterTest {

    private final LlmClient client = new LlmClient(List.of(new MockLlmProviderAdapter()));

    @Test
    void chat_shouldRouteToMatchingProviderAdapter() {
        String response = client.chat(mockConfig(), "hello");

        assertEquals("Mock LLM response: hello", response);
    }

    @Test
    void getEmbedding_shouldRouteToMatchingProviderAdapter() {
        List<Float> embedding = client.getEmbedding(mockConfig(), "hello");

        assertEquals(64, embedding.size());
        assertFalse(embedding.stream().allMatch(value -> value == 0.0f));
    }

    @Test
    void getEmbeddings_shouldKeepInputCardinality() {
        List<List<Float>> embeddings = client.getEmbeddings(mockConfig(), List.of("alpha", "beta"));

        assertEquals(2, embeddings.size());
        assertEquals(64, embeddings.get(0).size());
        assertEquals(64, embeddings.get(1).size());
    }

    @Test
    void chatWithTools_shouldRouteToMatchingProviderAdapter() {
        LlmClient.LlmStreamResult result = client.chatWithTools(
                mockConfig(),
                List.of(Map.<String, Object>of("role", "user", "content", "use a tool")),
                List.of(Map.<String, Object>of("type", "function")));

        assertEquals("Mock LLM response: use a tool", result.getContent());
        assertTrue(result.getTokensUsed() > 0);
    }

    @Test
    void openAiCompatibleAdapter_shouldSupportOpenAiCompatibleProviders() {
        OpenAiCompatibleLlmProviderAdapter adapter = new OpenAiCompatibleLlmProviderAdapter();

        assertTrue(adapter.supports(LlmConfig.builder().provider("OPENAI").build()));
        assertTrue(adapter.supports(LlmConfig.builder().provider("DEEPSEEK").build()));
        assertTrue(adapter.supports(LlmConfig.builder().provider("CUSTOM").build()));
        assertFalse(adapter.supports(LlmConfig.builder().provider("MOCK").build()));
    }

    private LlmConfig mockConfig() {
        return LlmConfig.builder()
                .provider("MOCK")
                .modelName("mock-model")
                .baseUrl("mock://local")
                .apiKey("mock")
                .build();
    }
}
