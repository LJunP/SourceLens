package com.sourcelens.module.agent.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CodeQaCitation {
    private String citationId;
    private String sourceLabel;
    private Long chunkId;
    private Long scanTaskId;
    private String filePath;
    private Integer startLine;
    private Integer endLine;
    private String evidenceType;
    private String evidenceReason;
    private Integer relevanceScore;
    private String contextRole;
    private Integer contextDistance;
    private Boolean citedByAnswer;
}
