package com.sourcelens.module.review.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("pr_reviews")
public class PrReview {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long projectId;

    private Long scanTaskId;

    private Long repositoryId;

    private Integer prNumber;

    private String prTitle;

    private String prDescription;

    private String branch;

    private String baseBranch;

    private String commitSha;

    private String author;

    private String changedFiles;

    private String diffSummary;

    private String ciStatus;

    /** PENDING / ANALYZING / COMPLETED / FAILED */
    private String status;

    /** LOW / MEDIUM / HIGH / CRITICAL */
    private String riskLevel;

    private String changeSummary;

    private String impactScope;

    private String risks;

    private String testSuggestions;

    /** MERGE / CHANGES_REQUESTED / BLOCKED */
    private String mergeRecommendation;

    private String reviewJson;

    private String errorMessage;

    private Long createdBy;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    @TableLogic
    private Boolean deleted;
}