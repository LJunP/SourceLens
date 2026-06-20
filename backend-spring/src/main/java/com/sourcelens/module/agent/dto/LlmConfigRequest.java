package com.sourcelens.module.agent.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class LlmConfigRequest {

    /** OPENAI / ANTHROPIC / DEEPSEEK / CUSTOM */
    @NotBlank(message = "provider 不能为空")
    private String provider;

    @NotBlank(message = "模型名称不能为空")
    private String modelName;

    @NotBlank(message = "API Key 不能为空")
    private String apiKey;

    @NotBlank(message = "Base URL 不能为空")
    private String baseUrl;

    private BigDecimal temperature;

    private Integer maxTokens;
}