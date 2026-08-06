package com.sourcelens.module.agent.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class CodeQaCitationCoverage {
    private Integer totalEvidenceCount;
    private Integer citedEvidenceCount;
    private Integer uncitedCandidateCount;
    private Integer repairCandidateCount;
    private Integer coveragePercent;
    private Integer uniqueEvidenceFileCount;
    private Integer citedEvidenceFileCount;
    private Integer primaryEvidenceCount;
    private Integer citedPrimaryEvidenceCount;
    private Integer uncitedPrimaryEvidenceCount;
    private Integer primaryEvidenceFileCount;
    private Integer citedPrimaryEvidenceFileCount;
    private Integer uncitedPrimaryEvidenceFileCount;
    private Integer contextEvidenceCount;
    private Integer citedContextEvidenceCount;
    private Integer uncitedContextEvidenceCount;
    private Integer contextEvidenceFileCount;
    private Integer citedContextEvidenceFileCount;
    private Integer uncitedContextEvidenceFileCount;
    private Integer requiredEvidenceCount;
    private Integer citedRequiredEvidenceCount;
    private Integer requiredEvidenceFileCount;
    private Integer citedRequiredEvidenceFileCount;
    private Integer requiredEvidenceCoveragePercent;
    private String coverageScope;
    private EvidenceRoleDistribution evidenceRoleDistribution;
    private String status;

    @Data
    @Builder
    public static class EvidenceRoleDistribution {
        private String status;
        private Integer totalFileCount;
        private Integer citedFileCount;
        private Integer primaryFileCount;
        private Integer citedPrimaryFileCount;
        private Integer contextFileCount;
        private Integer citedContextFileCount;
        private List<RoleStat> roles;
        private List<FileStat> files;
    }

    @Data
    @Builder
    public static class RoleStat {
        private String role;
        private Integer evidenceCount;
        private Integer citedEvidenceCount;
        private Integer fileCount;
        private Integer citedFileCount;
    }

    @Data
    @Builder
    public static class FileStat {
        private String filePath;
        private Integer primaryEvidenceCount;
        private Integer citedPrimaryEvidenceCount;
        private Integer contextEvidenceCount;
        private Integer citedContextEvidenceCount;
    }
}
