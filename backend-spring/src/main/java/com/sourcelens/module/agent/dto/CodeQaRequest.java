package com.sourcelens.module.agent.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CodeQaRequest {

    @NotBlank(message = "问题内容不能为空")
    private String question;

    private Long scanTaskId;
}
