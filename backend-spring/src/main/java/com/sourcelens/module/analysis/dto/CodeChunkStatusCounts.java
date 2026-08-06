package com.sourcelens.module.analysis.dto;

import lombok.Data;

@Data
public class CodeChunkStatusCounts {
    private Long totalChunks;
    private Long embeddedChunks;
}
