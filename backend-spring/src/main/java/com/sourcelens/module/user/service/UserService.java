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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService extends ServiceImpl<UserMapper, User> {

    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public User register(RegisterRequest req) {
        // 检查用户名唯一
        long count = count(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, req.getUsername()));
        if (count > 0) {
            throw BizException.conflict("用户名已存在");
        }
        // 检查邮箱唯一
        count = count(new LambdaQueryWrapper<User>()
                .eq(User::getEmail, req.getEmail()));
        if (count > 0) {
            throw BizException.conflict("邮箱已注册");
        }

        User user = User.builder()
                .username(req.getUsername())
                .email(req.getEmail())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .status("ACTIVE")
                .build();
        save(user);
        return user;
    }

    public LoginResponse login(LoginRequest req) {
        User user = getOne(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, req.getUsername()));
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
                .eq(User::getUsername, username));
    }
}