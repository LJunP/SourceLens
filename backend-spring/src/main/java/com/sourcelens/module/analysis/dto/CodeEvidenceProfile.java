package com.sourcelens.module.analysis.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class CodeEvidenceProfile {
    private String readiness;
    private Integer confidence;
    private String summary;
    private String nextAction;
    private List<String> details;
    private Integer uniqueFiles;
    private Integer embeddedEvidenceCount;
    private Integer lowConfidenceCount;
    private Integer topScore;
    private Integer averageScore;
    private Integer lineSpan;
    private String dominantEvidenceType;
    private List<EvidenceTypeStat> evidenceTypeStats;
    private List<FileStat> fileStats;

    @Data
    @Builder
    public static class EvidenceTypeStat {
        private String type;
        private Integer count;
    }

    @Data
    @Builder
    public static class FileStat {
        private String filePath;
        private Integer count;
        private Integer bestScore;
    }
}
