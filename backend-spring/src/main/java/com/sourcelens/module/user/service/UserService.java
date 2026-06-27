package com.sourcelens.module.user.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.sourcelens.common.exception.BizException;
import com.sourcelens.common.security.JwtUtil;
import com.sourcelens.module.user.dto.LoginRequest;
import com.sourcelens.module.user.dto.LoginResponse;
import com.sourcelens.module.user.dto.RegisterRequest;
import com.sourcelens.module.user.entity.User;
import com.sourcelens.module.user.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService extends ServiceImpl<UserMapper, User> {

    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public User register(RegisterRequest req) {
        String username = normalizeIdentity(req.getUsername());
        String email = normalizeIdentity(req.getEmail());

        // 检查用户名唯一
        long count = count(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, username));
        if (count > 0) {
            throw BizException.conflict("用户名已存在");
        }
        // 检查邮箱唯一
        count = count(new LambdaQueryWrapper<User>()
                .eq(User::getEmail, email));
        if (count > 0) {
            throw BizException.conflict("邮箱已注册");
        }

        User user = User.builder()
                .username(username)
                .email(email)
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .status("ACTIVE")
                .build();
        try {
            save(user);
        } catch (DataIntegrityViolationException e) {
            throw identityConflict(e);
        }
        return user;
    }

    public LoginResponse login(LoginRequest req) {
        String username = normalizeIdentity(req.getUsername());
        User user = getOne(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, username));
        if (user == null || !passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw BizException.unauthorized("用户名或密码错误");
        }
        String token = jwtUtil.generateToken(user.getId(), user.getUsername());
        return LoginResponse.builder()
                .token(token)
                .userId(user.getId())
                .username(user.getUsername())
                .build();
    }

    public User getByUsername(String username) {
        return getOne(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, normalizeIdentity(username)));
    }

    private String normalizeIdentity(String value) {
        return value == null ? "" : value.trim();
    }

    private BizException identityConflict(DataIntegrityViolationException e) {
        String message = e.getMostSpecificCause() == null ? e.getMessage() : e.getMostSpecificCause().getMessage();
        String lowerMessage = message == null ? "" : message.toLowerCase();
        if (lowerMessage.contains("uk_username") || lowerMessage.contains("username")) {
            return BizException.conflict("用户名已存在");
        }
        if (lowerMessage.contains("uk_email") || lowerMessage.contains("email")) {
            return BizException.conflict("邮箱已注册");
        }
        return BizException.conflict("用户名或邮箱已存在");
    }
}
