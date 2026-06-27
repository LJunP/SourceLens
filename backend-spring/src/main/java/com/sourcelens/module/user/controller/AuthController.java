package com.sourcelens.module.user.controller;

import com.sourcelens.common.Result;
import com.sourcelens.common.exception.BizException;
import com.sourcelens.common.security.JwtDenylistService;
import com.sourcelens.common.security.JwtUtil;
import com.sourcelens.module.audit.service.AuditLogService;
import com.sourcelens.module.user.dto.LoginRequest;
import com.sourcelens.module.user.dto.LoginResponse;
import com.sourcelens.module.user.dto.RegisterRequest;
import com.sourcelens.module.user.dto.UserResponse;
import com.sourcelens.module.user.entity.User;
import com.sourcelens.module.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "认证")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final JwtDenylistService jwtDenylistService;
    private final JwtUtil jwtUtil;
    private final AuditLogService auditLogService;

    @Operation(summary = "注册")
    @PostMapping("/register")
    public Result<UserResponse> register(@Valid @RequestBody RegisterRequest req) {
        User user = userService.register(req);
        return Result.ok(UserResponse.from(user));
    }

    @Operation(summary = "登录")
    @PostMapping("/login")
    public Result<LoginResponse> login(@Valid @RequestBody LoginRequest req) {
        long start = System.currentTimeMillis();
        try {
            LoginResponse resp = userService.login(req);
            auditLogService.record(resp.getUserId(), null, "USER", resp.getUserId(),
                    "USER_LOGIN", "SUCCESS",
                    Map.of("username", req.getUsername()),
                    "用户登录成功",
                    System.currentTimeMillis() - start,
                    null);
            return Result.ok(resp);
        } catch (BizException e) {
            auditLogService.record(null, null, "USER", null,
                    "USER_LOGIN", "FAILED",
                    Map.of("username", req.getUsername()),
                    e.getMessage(),
                    System.currentTimeMillis() - start,
                    null);
            throw e;
        }
    }

    @Operation(summary = "获取当前用户")
    @GetMapping("/me")
    public Result<UserResponse> me(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        User user = userService.getById(userId);
        if (user == null || Boolean.TRUE.equals(user.getDeleted())) {
            throw BizException.notFound("User");
        }
        return Result.ok(UserResponse.from(user));
    }

    @Operation(summary = "退出登录")
    @PostMapping("/logout")
    public Result<Void> logout(@RequestHeader(value = "Authorization", required = false) String authorization) {
        if (StringUtils.hasText(authorization) && authorization.startsWith("Bearer ")) {
            String token = authorization.substring(7);
            jwtDenylistService.denylist(token);
            auditLogout(token);
        }
        return Result.ok();
    }

    private void auditLogout(String token) {
        try {
            Long userId = jwtUtil.getUserId(token);
            auditLogService.record(userId, null, "USER", userId,
                    "USER_LOGOUT", "SUCCESS",
                    Map.of("tokenId", jwtUtil.getTokenId(token)),
                    "用户退出登录",
                    null,
                    null);
        } catch (Exception e) {
            auditLogService.record(null, null, "USER", null,
                    "USER_LOGOUT", "FAILED",
                    Map.of("reason", "invalid_token"),
                    "退出登录 token 解析失败",
                    null,
                    null);
        }
    }
}
