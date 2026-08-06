package com.sourcelens.module.agent.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class CodeQaRetrievalPlan {
    private List<String> tokens;
    private String queryStrategy;
    private List<String> roleIntents;
    private List<String> fallbackRolePriority;
    private Boolean auxiliaryHintsPresent;
    private Boolean questionEmbeddingAvailable;
    private Integer embeddingCoveragePercent;
    private String embeddingCoverageStatus;
    private Boolean semanticPoolAttempted;
    private String semanticPoolStrategy;
    private Integer semanticPoolLoadedCount;
    private Integer semanticPoolLimit;
    private Boolean semanticPoolTruncated;
    private Integer semanticPoolCoveragePercent;
    private String semanticPlanReason;
    private String semanticReadinessStatus;
    private String semanticReadinessReason;
    private Boolean crossFileIntentPresent;
    private Boolean crossFileEvidenceSatisfied;
    private Integer crossFilePrimaryFileCount;
    private String crossFileEvidenceStatus;
    private Boolean graphRelationEvidencePresent;
    private List<String> graphRelationPrimaryLabels;
    private Integer graphRelationEvidenceCount;
    private String fallbackReason;
}
