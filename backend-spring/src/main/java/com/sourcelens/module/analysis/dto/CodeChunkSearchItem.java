package com.sourcelens.module.analysis.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class CodeChunkSearchItem {
    private Long id;
    private String citationId;
    private String sourceLabel;
    private Long scanTaskId;
    private String filePath;
    private String workspaceRoot;
    private String moduleRoot;
    private Integer startLine;
    private Integer endLine;
    private String content;
    private String contentPreview;
    private Boolean hasEmbedding;
    private List<String> matchedTerms;
    private Integer relevanceScore;
    private String evidenceType;
    private String evidenceReason;
    private String contextRole;
    private Integer contextDistance;
}
