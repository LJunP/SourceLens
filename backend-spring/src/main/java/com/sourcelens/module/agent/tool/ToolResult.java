package com.sourcelens.module.agent.tool;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ToolResult {

    private boolean success;
    private String content;
    private String error;

    public static ToolResult ok(String content) {
        return ToolResult.builder().success(true).content(content).build();
    }

    public static ToolResult fail(String error) {
        return ToolResult.builder().success(false).error(error).build();
    }
}