package com.sourcelens.module.issue.entity;

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
@TableName("issue_decompositions")
public class IssueDecomposition {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long projectId;

    private Long scanTaskId;

    private String title;

    private String description;

    private String businessContext;

    private String priority;

    /** JSON 数组 */
    private String relatedModules;

    /** PENDING / PROCESSING / COMPLETED / FAILED */
    private String status;

    private String understanding;

    private String impactModules;

    private String impactApis;

    private String impactDb;

    private String risks;

    private String dependencies;

    private String acceptance;

    private String suggestedBranch;

    private String suggestedCommit;

    private String outputJson;

    private String errorMessage;

    private Long createdBy;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    @TableLogic
    private Boolean deleted;
}