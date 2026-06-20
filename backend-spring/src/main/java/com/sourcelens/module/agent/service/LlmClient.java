package com.sourcelens.module.agent.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sourcelens.module.agent.entity.LlmConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.Flow;
import java.util.concurrent.SubmissionPublisher;
import java.util.concurrent.atomic.AtomicReference;

/**
 * OpenAI 兼容 LLM 客户端。支持 streaming + function calling。
 */
@Slf4j
@Service
public class LlmClient {

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30))
            .build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // ===== 非 streaming 调用(向后兼容) =====

    public String chat(LlmConfig config, List<Map<String, String>> messages) {
        String url = config.getBaseUrl().replaceAll("/+$", "") + "/chat/completions";

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", config.getModelName());
        body.put("messages", messages);
        body.put("temperature", config.getTemperature() != null ? config.getTemperature() : 0.7);
        body.put("max_tokens", config.getMaxTokens() != null ? config.getMaxTokens() : 4096);

        try {
            String json = objectMapper.writeValueAsString(body);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + config.getApiKey())
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .timeout(Duration.ofSeconds(120))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("LLM 响应异常: status={}, body={}", response.statusCode(), response.body());
                throw new RuntimeException("LLM API 返回错误: " + response.statusCode());
            }

            ChatCompletionResponse completion = objectMapper.readValue(response.body(), ChatCompletionResponse.class);
            if (completion.choices == null || completion.choices.isEmpty()) {
                throw new RuntimeException("LLM 返回空 choices");
            }
            return completion.choices.get(0).message.content;
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("LLM 调用失败: " + e.getMessage(), e);
        }
    }

    public String chat(LlmConfig config, String prompt) {
        return chat(config, List.of(Map.of("role", "user", "content", prompt)));
    }

    // ===== Streaming 调用(支持 function calling) =====

    /**
     * Streaming 调用 LLM。将完整响应解析为 LlmStreamResult。
     * 返回纯文本内容和可选的 tool_calls。
     */
    public LlmStreamResult chatWithTools(LlmConfig config,
                                         List<Map<String, Object>> messages,
                                         List<Map<String, Object>> tools) {
        String url = config.getBaseUrl().replaceAll("/+$", "") + "/chat/completions";

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", config.getModelName());
        body.put("messages", messages);
        body.put("temperature", config.getTemperature() != null ? config.getTemperature() : 0.7);
        body.put("max_tokens", config.getMaxTokens() != null ? config.getMaxTokens() : 8192);
        body.put("stream", true);
        if (tools != null && !tools.isEmpty()) {
            body.put("tools", tools);
            body.put("tool_choice", "auto");
        }

        try {
            String json = objectMapper.writeValueAsString(body);
            log.info("LLM 请求(streaming): model={}", config.getModelName());

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + config.getApiKey())
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .timeout(Duration.ofSeconds(180))
                    .build();

            HttpResponse<java.util.stream.Stream<String>> response = httpClient.send(request, HttpResponse.BodyHandlers.ofLines());

            if (response.statusCode() != 200) {
                String bodyStr = response.body().collect(java.util.stream.Collectors.joining("\n"));
                log.error("LLM 响应异常: status={}, body={}", response.statusCode(), bodyStr);
                throw new RuntimeException("LLM API 返回错误: " + response.statusCode() + ": " + bodyStr);
            }

            return parseStreamingResponse(response.body());
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("LLM 调用失败: " + e.getMessage(), e);
        }
    }

    /**
     * 解析 OpenAI 格式的完整响应,提取 content 和 tool_calls。
     */
    @SuppressWarnings("unchecked")
    private LlmStreamResult parseResponse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode choices = root.get("choices");
            if (choices == null || choices.isEmpty()) {
                throw new RuntimeException("LLM 返回空 choices");
            }

            JsonNode message = choices.get(0).get("message");
            String content = message.has("content") && !message.get("content").isNull()
                    ? message.get("content").asText() : "";

            LlmStreamResult result = new LlmStreamResult();
            result.setContent(content);

            // 解析 tool_calls
            if (message.has("tool_calls") && !message.get("tool_calls").isNull()) {
                List<Map<String, Object>> toolCalls = new ArrayList<>();
                for (JsonNode tc : message.get("tool_calls")) {
                    Map<String, Object> toolCall = new LinkedHashMap<>();
                    String id = tc.has("id") ? tc.get("id").asText() : UUID.randomUUID().toString();
                    toolCall.put("id", id);
                    toolCall.put("type", "function");

                    JsonNode func = tc.get("function");
                    if (func != null) {
                        Map<String, Object> function = new LinkedHashMap<>();
                        function.put("name", func.get("name").asText());
                        String argsStr = func.has("arguments") ? func.get("arguments").asText() : "{}";
                        function.put("arguments", objectMapper.readValue(argsStr, Map.class));
                        toolCall.put("function", function);
                    }
                    toolCalls.add(toolCall);
                }
                result.setToolCalls(toolCalls);
            }

            // 读取 usage
            if (root.has("usage") && !root.get("usage").isNull()) {
                result.setTokensUsed(root.get("usage").get("total_tokens").asInt());
            }

            return result;
        } catch (Exception e) {
            throw new RuntimeException("解析 LLM 响应失败: " + e.getMessage(), e);
        }
    }

    /**
     * 解析 SSE 流式响应。累积所有 chunk 后返回完整结果。
     * 每行格式: data: {...} 或 data: [DONE]
     */
    @SuppressWarnings("unchecked")
    private LlmStreamResult parseStreamingResponse(java.util.stream.Stream<String> lines) {
        StringBuilder contentBuilder = new StringBuilder();
        // tool_calls 累积: index -> {id, type, function: {name, arguments_buffer}}
        Map<Integer, Map<String, Object>> toolCallsMap = new LinkedHashMap<>();
        int tokensUsed = 0;

        for (String line : (Iterable<String>) lines::iterator) {
            if (line == null || !line.startsWith("data:")) continue;
            String data = line.substring(5).trim();
            if ("[DONE]".equals(data)) break;
            if (data.isEmpty()) continue;

            try {
                JsonNode chunk = objectMapper.readTree(data);
                JsonNode choices = chunk.get("choices");
                if (choices == null || choices.isEmpty()) continue;

                JsonNode delta = choices.get(0).get("delta");
                if (delta == null) continue;

                // 累积 content
                if (delta.has("content") && !delta.get("content").isNull()) {
                    contentBuilder.append(delta.get("content").asText());
                }

                // 累积 tool_calls (增量片段)
                if (delta.has("tool_calls") && !delta.get("tool_calls").isNull()) {
                    for (JsonNode tc : delta.get("tool_calls")) {
                        int idx = tc.has("index") ? tc.get("index").asInt() : 0;
                        toolCallsMap.computeIfAbsent(idx, k -> {
                            Map<String, Object> m = new LinkedHashMap<>();
                            m.put("type", "function");
                            m.put("function", new LinkedHashMap<>());
                            return m;
                        });
                        Map<String, Object> tcEntry = toolCallsMap.get(idx);
                        if (tc.has("id") && !tc.get("id").isNull()) {
                            tcEntry.put("id", tc.get("id").asText());
                        }
                        JsonNode func = tc.get("function");
                        if (func != null) {
                            Map<String, Object> funcMap = (Map<String, Object>) tcEntry.get("function");
                            if (func.has("name") && !func.get("name").isNull()) {
                                funcMap.put("name", func.get("name").asText());
                            }
                            if (func.has("arguments") && !func.get("arguments").isNull()) {
                                funcMap.compute("arguments_buffer", (k, v) ->
                                        (v == null ? "" : v) + func.get("arguments").asText());
                            }
                        }
                    }
                }

                // 读取 usage
                if (chunk.has("usage") && !chunk.get("usage").isNull()) {
                    JsonNode usage = chunk.get("usage");
                    if (usage.has("total_tokens")) {
                        tokensUsed = usage.get("total_tokens").asInt();
                    }
                }
            } catch (Exception e) {
                log.debug("跳过无法解析的 SSE chunk: {}", e.getMessage());
            }
        }

        // 组装最终结果
        LlmStreamResult result = new LlmStreamResult();
        result.setContent(contentBuilder.toString());
        result.setTokensUsed(tokensUsed);

        if (!toolCallsMap.isEmpty()) {
            List<Map<String, Object>> toolCalls = new ArrayList<>();
            for (Map<String, Object> tcEntry : toolCallsMap.values()) {
                Map<String, Object> toolCall = new LinkedHashMap<>();
                toolCall.put("id", tcEntry.getOrDefault("id", UUID.randomUUID().toString()));
                toolCall.put("type", tcEntry.getOrDefault("type", "function"));

                Map<String, Object> func = (Map<String, Object>) tcEntry.get("function");
                if (func != null) {
                    Map<String, Object> function = new LinkedHashMap<>();
                    function.put("name", func.getOrDefault("name", "unknown"));
                    String argsBuffer = (String) func.getOrDefault("arguments_buffer", "{}");
                    try {
                        function.put("arguments", objectMapper.readValue(argsBuffer, Map.class));
                    } catch (Exception e) {
                        function.put("arguments", Map.of());
                    }
                    toolCall.put("function", function);
                }
                toolCalls.add(toolCall);
            }
            result.setToolCalls(toolCalls);
        }

        return result;
    }

    // ===== 结果模型 =====

    @lombok.Data
    public static class LlmStreamResult {
        private String content;
        private List<Map<String, Object>> toolCalls;
        private int tokensUsed;

        public boolean hasToolCalls() {
            return toolCalls != null && !toolCalls.isEmpty();
        }
    }

    // ===== 旧 DTO(保留向后兼容) =====

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class ChatCompletionResponse {
        public List<Choice> choices;
        public Usage usage;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class Choice {
        public Message message;
        public String finish_reason;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class Message {
        public String role;
        public String content;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class Usage {
        @JsonProperty("prompt_tokens")
        public int promptTokens;
        @JsonProperty("completion_tokens")
        public int completionTokens;
        @JsonProperty("total_tokens")
        public int totalTokens;
    }
}