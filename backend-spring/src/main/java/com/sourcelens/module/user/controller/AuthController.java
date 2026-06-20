package com.sourcelens.module.user.controller;

import com.sourcelens.common.Result;
import com.sourcelens.common.exception.BizException;
import com.sourcelens.module.user.dto.LoginRequest;
import com.sourcelens.module.user.dto.LoginResponse;
import com.sourcelens.module.user.dto.RegisterRequest;
import com.sourcelens.module.user.entity.User;
import com.sourcelens.module.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "认证")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @Operation(summary = "注册")
    @PostMapping("/register")
    public Result<User> register(@Valid @RequestBody RegisterRequest req) {
        User user = userService.register(req);
        return Result.ok(user);
    }

    @Operation(summary = "登录")
    @PostMapping("/login")
    public Result<LoginResponse> login(@Valid @RequestBody LoginRequest req) {
        LoginResponse resp = userService.login(req);
        return Result.ok(resp);
    }

    @Operation(summary = "获取当前用户")
    @GetMapping("/me")
    public Result<Map<String, Object>> me(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        User user = userService.getById(userId);
        if (user == null || Boolean.TRUE.equals(user.getDeleted())) {
            throw BizException.notFound("User");
        }
        return Result.ok(Map.of(
                "id", user.getId(),
                "username", user.getUsername(),
                "email", user.getEmail(),
                "status", user.getStatus()
        ));
    }

    @Operation(summary = "退出登录")
    @PostMapping("/logout")
    public Result<Void> logout() {
        return Result.ok();
    }
}