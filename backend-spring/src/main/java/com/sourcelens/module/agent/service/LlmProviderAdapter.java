package com.sourcelens.module.agent.service;

import com.sourcelens.module.agent.entity.LlmConfig;

import java.util.List;
import java.util.Map;

public interface LlmProviderAdapter {

    boolean supports(LlmConfig config);

    String chat(LlmConfig config, List<Map<String, String>> messages);

    List<Float> getEmbedding(LlmConfig config, String text);

    List<List<Float>> getEmbeddings(LlmConfig config, List<String> texts);

    LlmClient.LlmStreamResult chatWithTools(LlmConfig config,
                                            List<Map<String, Object>> messages,
                                            List<Map<String, Object>> tools);
}
