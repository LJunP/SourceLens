package com.sourcelens.module.ci.entity;

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
@TableName("ci_diagnostics")
public class CiDiagnostic {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long projectId;

    private Long scanTaskId;

    private Long repositoryId;

    private String provider;

    private String workflowName;

    private String workflowRunId;

    private Integer runNumber;

    private String branch;

    private String commitSha;

    private String commitMessage;

    /** PENDING / ANALYZING / COMPLETED / FAILED */
    private String status;

    /** success / failure / cancelled / timed_out */
    private String conclusion;

    private String failureSummary;

    /** COMPILE / TEST / DEPENDENCY / LINT / DOCKER / ENV / UNKNOWN */
    private String errorCategory;

    private String rootCause;

    private String relatedFiles;

    private String fixSuggestions;

    private String rawLogSnippet;

    private String diagnosticJson;

    private String errorMessage;

    private Long createdBy;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    @TableLogic
    private Boolean deleted;
}