package com.sourcelens.module.agent.dto;

import lombok.Data;

@Data
public class CompleteTaskRequest {

    private String outputJson;

    private String summary;

    /** COMPLETED / FAILED */
    private String status;
}