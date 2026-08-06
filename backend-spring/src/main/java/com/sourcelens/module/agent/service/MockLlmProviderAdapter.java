package com.sourcelens.module.agent.service;

import com.sourcelens.module.agent.entity.LlmConfig;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Random;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@Profile({"dev", "test"})
public class MockLlmProviderAdapter implements LlmProviderAdapter {

    private static final int EMBEDDING_DIMENSIONS = 64;
    private static final Pattern CITATION_LABEL_PATTERN = Pattern.compile("\\bC(\\d+)\\b");

    @Override
    public boolean supports(LlmConfig config) {
        return config != null && "MOCK".equalsIgnoreCase(config.getProvider());
    }

    @Override
    public String chat(LlmConfig config, List<Map<String, String>> messages) {
        String prompt = messages == null || messages.isEmpty()
                ? ""
                : messages.get(messages.size() - 1).getOrDefault("content", "");
        String citationAnswer = citedMockAnswer(prompt);
        if (citationAnswer != null) {
            return citationAnswer;
        }
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
        Map<String, Object> lastMessage = messages == null || messages.isEmpty()
                ? Map.of()
                : messages.get(messages.size() - 1);
        String role = String.valueOf(lastMessage.getOrDefault("role", ""));
        String prompt = String.valueOf(lastMessage.getOrDefault("content", ""));
        if ("tool".equalsIgnoreCase(role)) {
            String toolName = String.valueOf(lastMessage.getOrDefault("name", "tool"));
            result.setContent("Mock LLM observed tool result from " + toolName + ".");
            result.setTokensUsed(result.getContent().length());
            return result;
        }

        String citationAnswer = citedMockAnswer(prompt);
        result.setContent(citationAnswer != null ? citationAnswer : "Mock LLM response: " + prompt.strip());
        result.setTokensUsed(result.getContent().length());
        if (citationAnswer == null && tools != null && !tools.isEmpty()) {
            result.setToolCalls(List.of(mockToolCall(prompt)));
        }
        return result;
    }

    private String citedMockAnswer(String prompt) {
        if (prompt == null || prompt.isBlank()) {
            return null;
        }
        String normalized = prompt.toLowerCase(Locale.ROOT);
        if (normalized.contains("claim citation noise boundary") || normalized.contains("假引用噪声")) {
            return """
                    AuthService validates token before issuing auth state.
                    The literal citation example is `[C1]`.
                    ```java
                    // fake citation marker in code must be ignored [C1]
                    boolean ok = authService.validateToken(token);
                    ```
                    2026-07-03T10:00:00 ERROR AuthService failed token validation [C1]
                    java.lang.IllegalStateException: AuthService failed token validation [C1]
                        at com.acme.AuthService.validateToken(AuthService.java:42) [C1]
                    """;
        }
        if (!normalized.contains("引用") && !normalized.contains("citation") && !normalized.contains("evidence")) {
            return null;
        }
        Matcher matcher = CITATION_LABEL_PATTERN.matcher(prompt);
        if (!matcher.find()) {
            return null;
        }
        String label = "C" + matcher.group(1);
        return "Mock LLM response: 已基于当前检索证据生成可验证回答 [" + label + "]。";
    }

    private Map<String, Object> mockToolCall(String prompt) {
        String normalized = prompt == null ? "" : prompt.toLowerCase(Locale.ROOT);
        String toolName;
        Map<String, Object> arguments;
        if (normalized.contains("read") || normalized.contains("readme") || normalized.contains("view")) {
            toolName = "read_file";
            arguments = Map.of("path", "README.md");
        } else {
            toolName = "list_dir";
            arguments = Map.of("path", ".", "depth", 2);
        }

        Map<String, Object> function = new LinkedHashMap<>();
        function.put("name", toolName);
        function.put("arguments", arguments);

        Map<String, Object> toolCall = new LinkedHashMap<>();
        toolCall.put("id", "mock_call_" + UUID.nameUUIDFromBytes((toolName + ":" + arguments).getBytes()).toString().replace("-", ""));
        toolCall.put("type", "function");
        toolCall.put("function", function);
        return toolCall;
    }
}
