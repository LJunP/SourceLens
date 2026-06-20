package com.sourcelens.module.issue.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DecomposeIssueRequest {

    @NotNull(message = "项目 ID 不能为空")
    private Long projectId;

    private Long scanTaskId;

    @NotBlank(message = "标题不能为空")
    private String title;

    @NotBlank(message = "需求描述不能为空")
    private String description;

    private String businessContext;

    /** HIGH / MEDIUM / LOW */
    private String priority;

    /** 关联模块名, 逗号分隔 */
    private String relatedModules;
}