package com.sourcelens.module.agent.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("llm_configs")
public class LlmConfig {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    /** OPENAI / ANTHROPIC / DEEPSEEK / CUSTOM */
    private String provider;

    private String modelName;

    private String apiKey;

    private String baseUrl;

    private BigDecimal temperature;

    private Integer maxTokens;

    private Boolean isActive;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    @TableLogic
    private Boolean deleted;
}