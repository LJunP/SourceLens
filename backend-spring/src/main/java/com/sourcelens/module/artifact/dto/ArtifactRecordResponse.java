package com.sourcelens.module.artifact.dto;

import com.sourcelens.module.artifact.entity.ArtifactRecord;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ArtifactRecordResponse {
    private Long id;
    private Long projectId;
    private Long repositoryId;
    private String ownerType;
    private Long ownerId;
    private String artifactType;
    private String contentType;
    private Long sizeBytes;
    private String checksumSha256;
    private String metadataJson;
    private Long createdBy;
    private LocalDateTime createdAt;

    public static ArtifactRecordResponse from(ArtifactRecord record) {
        return ArtifactRecordResponse.builder()
                .id(record.getId())
                .projectId(record.getProjectId())
                .repositoryId(record.getRepositoryId())
                .ownerType(record.getOwnerType())
                .ownerId(record.getOwnerId())
                .artifactType(record.getArtifactType())
                .contentType(record.getContentType())
                .sizeBytes(record.getSizeBytes())
                .checksumSha256(record.getChecksumSha256())
                .metadataJson(record.getMetadataJson())
                .createdBy(record.getCreatedBy())
                .createdAt(record.getCreatedAt())
                .build();
    }
}
