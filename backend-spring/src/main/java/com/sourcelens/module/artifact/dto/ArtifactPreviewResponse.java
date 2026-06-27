package com.sourcelens.module.artifact.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ArtifactPreviewResponse {
    private ArtifactRecordResponse record;
    private String text;
    private Boolean truncated;
    private Integer previewBytes;
}
