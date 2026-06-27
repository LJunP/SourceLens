package com.sourcelens.module.agent.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class LlmConfigResponse {

    private Long id;

    private String provider;

    private String modelName;

    /**
     * Masked API key for display only. The raw key is never returned to clients.
     */
    private String apiKey;

    private String baseUrl;

    private BigDecimal temperature;

    private Integer maxTokens;

    private Boolean isActive;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
