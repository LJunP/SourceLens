package com.sourcelens.module.analysis.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class CodeChunkSearchResponse {
    private Long scanTaskId;
    private String query;
    private Integer limit;
    private Long total;
    private Integer resultCount;
    private Long totalChunks;
    private Long embeddedChunks;
    private Boolean truncated;
    private String retrievalMode;
    private CodeEvidenceProfile evidenceProfile;
    private List<CodeChunkSearchItem> items;
}
