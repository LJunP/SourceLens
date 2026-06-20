package com.sourcelens.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class BizException extends RuntimeException {

    private final String code;
    private final HttpStatus httpStatus;

    public BizException(String code, String message, HttpStatus httpStatus) {
        super(message);
        this.code = code;
        this.httpStatus = httpStatus;
    }

    public BizException(String message) {
        this("BIZ_ERROR", message, HttpStatus.BAD_REQUEST);
    }

    public static BizException notFound(String entity) {
        return new BizException("NOT_FOUND", entity + " not found", HttpStatus.NOT_FOUND);
    }

    public static BizException unauthorized(String message) {
        return new BizException("UNAUTHORIZED", message, HttpStatus.UNAUTHORIZED);
    }

    public static BizException forbidden(String message) {
        return new BizException("FORBIDDEN", message, HttpStatus.FORBIDDEN);
    }

    public static BizException badRequest(String message) {
        return new BizException("BAD_REQUEST", message, HttpStatus.BAD_REQUEST);
    }

    public static BizException conflict(String message) {
        return new BizException("CONFLICT", message, HttpStatus.CONFLICT);
    }

    public static BizException internal(String message) {
        return new BizException("INTERNAL", message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}