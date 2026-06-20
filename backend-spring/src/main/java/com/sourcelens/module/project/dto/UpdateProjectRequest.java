package com.sourcelens.module.project.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProjectRequest {

    @Size(max = 100, message = "项目名称最长 100 字符")
    private String name;

    @Size(max = 500, message = "描述最长 500 字符")
    private String description;
}