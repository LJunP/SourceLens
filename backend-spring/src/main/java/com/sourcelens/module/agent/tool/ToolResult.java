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

    public static final int MAX_CONTENT_LENGTH = 16_000;
    public static final int MAX_ERROR_LENGTH = 4_000;

    private boolean success;
    private String content;
    private String error;

    public static ToolResult ok(String content) {
        return ToolResult.builder()
                .success(true)
                .content(com.sourcelens.common.security.SensitiveDataSanitizer.sanitizeAndTruncate(content, MAX_CONTENT_LENGTH))
                .build();
    }

    public static ToolResult fail(String error) {
        return ToolResult.builder()
                .success(false)
                .error(com.sourcelens.common.security.SensitiveDataSanitizer.sanitizeAndTruncate(error, MAX_ERROR_LENGTH))
                .build();
    }

    public static ToolResult sanitized(ToolResult result) {
        if (result == null) {
            return ToolResult.fail("工具未返回结果");
        }
        return ToolResult.builder()
                .success(result.isSuccess())
                .content(com.sourcelens.common.security.SensitiveDataSanitizer.sanitizeAndTruncate(result.getContent(), MAX_CONTENT_LENGTH))
                .error(com.sourcelens.common.security.SensitiveDataSanitizer.sanitizeAndTruncate(result.getError(), MAX_ERROR_LENGTH))
                .build();
    }
}
