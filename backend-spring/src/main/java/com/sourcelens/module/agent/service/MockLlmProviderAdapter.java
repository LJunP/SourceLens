package com.sourcelens.module.agent.service;

import com.sourcelens.module.agent.entity.LlmConfig;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Random;

@Component
@Profile({"dev", "test"})
public class MockLlmProviderAdapter implements LlmProviderAdapter {

    private static final int EMBEDDING_DIMENSIONS = 64;

    @Override
    public boolean supports(LlmConfig config) {
        return config != null && "MOCK".equalsIgnoreCase(config.getProvider());
    }

    @Override
    public String chat(LlmConfig config, List<Map<String, String>> messages) {
        String prompt = messages == null || messages.isEmpty()
                ? ""
                : messages.get(messages.size() - 1).getOrDefault("content", "");
        return "Mock LLM response: " + prompt.strip();
    }

    @Override
    public List<Float> getEmbedding(LlmConfig config, String text) {
        if (text == null || text.isBlank()) {
            return List.of();
        }
        Random random = new Random(text.toLowerCase(Locale.ROOT).hashCode());
        List<Float> embedding = new ArrayList<>(EMBEDDING_DIMENSIONS);
        for (int i = 0; i < EMBEDDING_DIMENSIONS; i++) {
            embedding.add(random.nextFloat() * 2 - 1);
        }
        return embedding;
    }

    @Override
    public List<List<Float>> getEmbeddings(LlmConfig config, List<String> texts) {
        if (texts == null || texts.isEmpty()) {
            return List.of();
        }
        return texts.stream()
                .map(text -> getEmbedding(config, text))
                .toList();
    }

    @Override
    public LlmClient.LlmStreamResult chatWithTools(LlmConfig config,
                                                   List<Map<String, Object>> messages,
                                                   List<Map<String, Object>> tools) {
        LlmClient.LlmStreamResult result = new LlmClient.LlmStreamResult();
        String prompt = messages == null || messages.isEmpty()
                ? ""
                : String.valueOf(messages.get(messages.size() - 1).getOrDefault("content", ""));
        result.setContent("Mock LLM response: " + prompt.strip());
        result.setTokensUsed(result.getContent().length());
        return result;
    }
}
