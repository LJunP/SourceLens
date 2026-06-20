package com.sourcelens.module.agent.dto;

import lombok.Data;

@Data
public class UpdateStepRequest {

    private String outputJson;

    /** COMPLETED / FAILED / SKIPPED */
    private String status;

    private String errorMessage;

    private Long durationMs;
}