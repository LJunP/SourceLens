package com.sourcelens.module.agent.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateAgentTaskRequest {

    @NotNull(message = "项目 ID 不能为空")
    private Long projectId;

    private Long scanTaskId;

    @NotBlank(message = "任务类型不能为空")
    /** ARCHITECTURE_REVIEW / RISK_SCAN / CHANGE_IMPACT / CUSTOM */
    private String taskType;

    @NotBlank(message = "标题不能为空")
    private String title;

    private String description;

    /** HIGH / MEDIUM / LOW */
    private String priority;

    private String inputJson;
}