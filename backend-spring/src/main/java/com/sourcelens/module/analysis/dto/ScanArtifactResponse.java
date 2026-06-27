package com.sourcelens.module.analysis.dto;

import com.sourcelens.module.analysis.entity.ScanArtifact;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ScanArtifactResponse {
    private Long id;
    private Long scanTaskId;
    private String artifactType;
    private String summaryJson;
    private LocalDateTime createdAt;

    public static ScanArtifactResponse from(ScanArtifact artifact) {
        return ScanArtifactResponse.builder()
                .id(artifact.getId())
                .scanTaskId(artifact.getScanTaskId())
                .artifactType(artifact.getArtifactType())
                .summaryJson(artifact.getSummaryJson())
                .createdAt(artifact.getCreatedAt())
                .build();
    }
}
