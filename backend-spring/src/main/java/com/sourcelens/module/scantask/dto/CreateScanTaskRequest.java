package com.sourcelens.module.scantask.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateScanTaskRequest {

    @NotNull(message = "项目 ID 不能为空")
    private Long projectId;

    private Long repositoryId;

    private String branch;
}