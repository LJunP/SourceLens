package com.sourcelens.module.agent.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class LlmJsonExtractor {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public Optional<Map<String, Object>> extractObject(String response) {
        if (response == null || response.isBlank()) {
            return Optional.empty();
        }
        String candidate = stripMarkdownFence(response.trim());
        candidate = extractJsonObjectCandidate(candidate);
        if (candidate == null || candidate.isBlank()) {
            return Optional.empty();
        }
        try {
            return Optional.of(objectMapper.readValue(candidate, new TypeReference<LinkedHashMap<String, Object>>() {}));
        } catch (Exception e) {
            log.warn("无法解析 LLM JSON 响应: {}", abbreviate(response, 500));
            return Optional.empty();
        }
    }

    public Map<String, Object> extractRequiredObject(String response, Set<String> requiredFields, String schemaName) {
        Map<String, Object> json = extractObject(response)
                .orElseThrow(() -> new IllegalArgumentException("LLM 返回无法解析为 JSON 对象: " + schemaName));
        for (String field : requiredFields) {
            if (!json.containsKey(field) || json.get(field) == null) {
                throw new IllegalArgumentException("LLM JSON 缺少必填字段 " + field + ": " + schemaName);
            }
        }
        return json;
    }

    private String stripMarkdownFence(String text) {
        String trimmed = text.trim();
        if (!trimmed.startsWith("```")) {
            return trimmed;
        }
        int firstNewLine = trimmed.indexOf('\n');
        if (firstNewLine == -1) {
            return "";
        }
        String withoutOpeningFence = trimmed.substring(firstNewLine + 1).trim();
        if (withoutOpeningFence.endsWith("```")) {
            return withoutOpeningFence.substring(0, withoutOpeningFence.length() - 3).trim();
        }
        return withoutOpeningFence;
    }

    private String extractJsonObjectCandidate(String text) {
        int start = text.indexOf('{');
        if (start == -1) {
            return null;
        }
        int depth = 0;
        boolean inString = false;
        boolean escaped = false;
        for (int i = start; i < text.length(); i++) {
            char ch = text.charAt(i);
            if (escaped) {
                escaped = false;
                continue;
            }
            if (ch == '\\' && inString) {
                escaped = true;
                continue;
            }
            if (ch == '"') {
                inString = !inString;
                continue;
            }
            if (inString) {
                continue;
            }
            if (ch == '{') {
                depth++;
            } else if (ch == '}') {
                depth--;
                if (depth == 0) {
                    return text.substring(start, i + 1);
                }
            }
        }
        return null;
    }

    private String abbreviate(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength) + "...";
    }
}
