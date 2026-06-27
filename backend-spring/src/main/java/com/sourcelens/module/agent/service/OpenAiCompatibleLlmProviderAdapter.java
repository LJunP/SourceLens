package com.sourcelens.module.agent.service;

import com.sourcelens.module.agent.entity.LlmConfig;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
public class OpenAiCompatibleLlmProviderAdapter extends LlmClient implements LlmProviderAdapter {

    private static final Set<String> SUPPORTED_PROVIDERS = Set.of(
            "OPENAI", "DEEPSEEK", "CUSTOM", "AZURE_OPENAI"
    );

    public OpenAiCompatibleLlmProviderAdapter() {
        super(List.of());
    }

    @Override
    public boolean supports(LlmConfig config) {
        if (config == null || config.getProvider() == null) {
            return false;
        }
        return SUPPORTED_PROVIDERS.contains(config.getProvider().toUpperCase());
    }

    @Override
    public String chat(LlmConfig config, List<Map<String, String>> messages) {
        return super.chat(config, messages);
    }

    @Override
    public List<Float> getEmbedding(LlmConfig config, String text) {
        return super.getEmbedding(config, text);
    }

    @Override
    public List<List<Float>> getEmbeddings(LlmConfig config, List<String> texts) {
        return super.getEmbeddings(config, texts);
    }

    @Override
    public LlmStreamResult chatWithTools(LlmConfig config,
                                         List<Map<String, Object>> messages,
                                         List<Map<String, Object>> tools) {
        return super.chatWithTools(config, messages, tools);
    }
}
