package com.sourcelens.module.agent.dto;

import com.sourcelens.module.analysis.dto.CodeChunkSearchItem;
import com.sourcelens.module.analysis.dto.CodeEvidenceProfile;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class CodeQaResponse {
    private String answer;
    private Long scanTaskId;
    private String question;
    private Long matchedChunks;
    private Integer resultCount;
    private String retrievalMode;
    private Long totalChunks;
    private Long embeddedChunks;
    private Boolean truncated;
    private CodeEvidenceProfile evidenceProfile;
    private List<CodeChunkSearchItem> retrievedChunks;
}
