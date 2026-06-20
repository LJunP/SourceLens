package com.sourcelens.common;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 统一响应结构
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Result<T> {

    private String code;
    private String message;
    private T data;

    public static <T> Result<T> ok(T data) {
        return Result.<T>builder()
                .code("SUCCESS")
                .message("ok")
                .data(data)
                .build();
    }

    public static <T> Result<T> ok() {
        return ok(null);
    }

    public static <T> Result<T> ok(String message, T data) {
        return Result.<T>builder()
                .code("SUCCESS")
                .message(message)
                .data(data)
                .build();
    }

    public static <T> Result<T> fail(String code, String message) {
        return Result.<T>builder()
                .code(code)
                .message(message)
                .build();
    }

    public static <T> Result<T> fail(String code, String message, Object details) {
        return Result.<T>builder()
                .code(code)
                .message(message)
                .data((T) details)
                .build();
    }
}