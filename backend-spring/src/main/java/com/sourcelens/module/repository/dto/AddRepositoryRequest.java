package com.sourcelens.module.repository.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AddRepositoryRequest {

    @NotBlank(message = "仓库 URL 不能为空")
    private String url;

    private String defaultBranch;

    // GitHub Personal Access Token
    private String token;
}