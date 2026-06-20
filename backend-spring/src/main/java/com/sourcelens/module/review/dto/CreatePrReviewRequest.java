package com.sourcelens.module.review.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreatePrReviewRequest {

    @NotNull(message = "项目 ID 不能为空")
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

    /** JSON 数组 - 变更文件列表 */
    private String changedFiles;

    private String diffSummary;

    /** success / failure / pending */
    private String ciStatus;
}