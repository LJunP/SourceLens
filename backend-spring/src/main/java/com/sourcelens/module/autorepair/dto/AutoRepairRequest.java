package com.sourcelens.module.autorepair.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AutoRepairRequest {

    @NotNull(message = "仓库ID不能为空")
    private Long repositoryId;

    @NotBlank(message = "修改文件路径不能为空")
    private String filePath;

    @NotBlank(message = "修改目标描述不能为空")
    private String targetDesc;
}
