package com.sourcelens.module.ci.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateCiDiagnosticRequest {

    @NotNull(message = "项目 ID 不能为空")
    private Long projectId;

    private Long scanTaskId;

    private Long repositoryId;

    /** GITHUB_ACTIONS / GITLAB_CI / JENKINS */
    private String provider;

    private String workflowName;

    private String workflowRunId;

    private Integer runNumber;

    private String branch;

    private String commitSha;

    private String commitMessage;

    /** failure / success 等 */
    @NotBlank(message = "结论不能为空")
    private String conclusion;

    /** 失败日志片段(可选, 如果有则直接分析) */
    private String rawLogSnippet;
}