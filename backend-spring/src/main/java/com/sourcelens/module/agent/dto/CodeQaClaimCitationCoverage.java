package com.sourcelens.module.agent.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class CodeQaClaimCitationCoverage {
    private Integer totalClaimCount;
    private Integer requiredClaimCount;
    private Integer citedRequiredClaimCount;
    private Integer uncitedRequiredClaimCount;
    private Integer invalidCitationClaimCount;
    private Integer claimCoveragePercent;
    private Integer validCitationFileCount;
    private Integer requiredClaimCitationFileCount;
    private String status;
    private Boolean readyForRepair;
    private String readinessReason;
    private String readinessNote;
    private List<String> validCitationFiles;
    private List<String> requiredClaimCitationFiles;
    private ClaimRoleDistribution roleDistribution;
    private List<ClaimCitation> claims;

    @Data
    @Builder
    public static class ClaimCitation {
        private String claimId;
        private String claimTextPreview;
        private Boolean required;
        private List<String> sourceLabels;
        private List<String> validSourceLabels;
        private List<String> invalidSourceLabels;
        private List<String> validSourceFiles;
        private List<String> validSourceRoles;
        private List<String> primarySourceFiles;
        private List<String> contextSourceFiles;
        private String status;
    }

    @Data
    @Builder
    public static class ClaimRoleDistribution {
        private String status;
        private Integer requiredClaimCount;
        private Integer requiredPrimaryBoundClaimCount;
        private Integer requiredContextOnlyClaimCount;
        private Integer requiredUnknownOnlyClaimCount;
        private Integer unbackedRequiredClaimCount;
        private Integer invalidRequiredClaimCount;
        private Integer validCitationFileCount;
        private Integer requiredClaimCitationFileCount;
        private Integer primaryFileCount;
        private Integer requiredPrimaryFileCount;
        private Integer contextFileCount;
        private Integer requiredContextFileCount;
        private Integer unknownFileCount;
        private Integer requiredUnknownFileCount;
        private List<ClaimRoleStat> roles;
        private List<ClaimFileStat> files;
    }

    @Data
    @Builder
    public static class ClaimRoleStat {
        private String role;
        private Integer claimCount;
        private Integer requiredClaimCount;
        private Integer fileCount;
        private Integer requiredFileCount;
    }

    @Data
    @Builder
    public static class ClaimFileStat {
        private String filePath;
        private Integer primaryClaimCount;
        private Integer requiredPrimaryClaimCount;
        private Integer contextClaimCount;
        private Integer requiredContextClaimCount;
        private Integer unknownClaimCount;
        private Integer requiredUnknownClaimCount;
        private Integer requiredClaimCount;
    }
}
