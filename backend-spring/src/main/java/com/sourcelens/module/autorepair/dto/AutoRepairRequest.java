package com.sourcelens.module.autorepair.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AutoRepairRequest {

    @NotNull(message = "仓库ID不能为空")
    private Long repositoryId;

    private Long scanTaskId;

    @NotBlank(message = "修改文件路径不能为空")
    private String filePath;

    @NotBlank(message = "修改目标描述不能为空")
    private String targetDesc;

    private Provenance provenance;

    @Data
    public static class Provenance {
        private String sourceType;
        private String source;
        private Long scanTaskId;
        private String filePath;
        private Long chunkId;
        private String citationId;
        private String sourceLabel;
        private Integer startLine;
        private Integer endLine;
        private Boolean citedByAnswer;
        private String groundingStatus;
        private String citationEnforcementStatus;
        private String citationEnforcementReason;
        private String evidenceType;
        private String evidenceReason;
        private String sourceEvidenceCategory;
        private String sourceEvidenceSource;
        private String sourceEvidenceTitle;
        private String sourceEvidenceFilePath;
        private String sourceEvidenceLineNumber;
        private Boolean sourceEvidenceMatched;
        private String sourceEvidenceMatchType;
        private Long artifactId;
        private String artifactType;
        private String riskKey;
        private String riskCategory;
        private String riskSeverity;
        private Integer lineNumber;
    }
}
