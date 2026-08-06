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
    void chat_shouldEmitUsableCitationWhenPromptRequiresEvidenceLabels() {
        String response = client.chat(mockConfig(), List.of(
                Map.of("role", "user", "content", "请重写回答并引用可用证据标签，只能使用这些标签：[C1, C2]。")));

        assertEquals("Mock LLM response: 已基于当前检索证据生成可验证回答 [C1]。", response);
    }

    @Test
    void chat_shouldEmitDeterministicFakeCitationNoiseBoundaryAnswer() {
        String response = client.chat(mockConfig(), List.of(
                Map.of("role", "user", "content", "claim citation noise boundary 假引用噪声 C1")));

        assertTrue(response.contains("fake citation marker in code must be ignored [C1]"));
        assertTrue(response.contains("ERROR AuthService failed token validation [C1]"));
        assertTrue(response.contains("IllegalStateException"));
        assertTrue(response.contains("`[C1]`"));
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
        assertTrue(result.hasToolCalls());
        assertEquals("list_dir", ((Map<?, ?>) result.getToolCalls().get(0).get("function")).get("name"));
    }

    @Test
    void chatWithTools_shouldNotStartToolLoopForCitationRetryAnswer() {
        LlmClient.LlmStreamResult result = client.chatWithTools(
                mockConfig(),
                List.of(Map.<String, Object>of("role", "user", "content", "请引用 evidence 标签：[C1, C2]。")),
                List.of(Map.<String, Object>of("type", "function")));

        assertEquals("Mock LLM response: 已基于当前检索证据生成可验证回答 [C1]。", result.getContent());
        assertFalse(result.hasToolCalls());
    }

    @Test
    void chatWithTools_shouldStopToolLoopAfterToolResult() {
        LlmClient.LlmStreamResult result = client.chatWithTools(
                mockConfig(),
                List.of(Map.<String, Object>of("role", "tool", "name", "list_dir", "content", "README.md")),
                List.of(Map.<String, Object>of("type", "function")));

        assertEquals("Mock LLM observed tool result from list_dir.", result.getContent());
        assertFalse(result.hasToolCalls());
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
