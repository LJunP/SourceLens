package com.sourcelens.module.agent.dto;

import lombok.Data;

@Data
public class AddStepRequest {

    /** TOOL_CALL / ANALYSIS / DECISION / OUTPUT */
    private String stepType;

    private String toolName;

    private String description;

    private String inputJson;
}