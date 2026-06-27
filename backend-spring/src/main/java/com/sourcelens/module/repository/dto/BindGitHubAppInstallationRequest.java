package com.sourcelens.module.repository.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BindGitHubAppInstallationRequest {

    @NotNull(message = "installationId 不能为空")
    private Long installationId;

    @NotBlank(message = "accountLogin 不能为空")
    private String accountLogin;

    private String accountType;

    private String repositorySelection;

    private String permissionsJson;
}
