package com.sourcelens.common.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

/**
 * 将当前登录用户 userId 注入 request attribute，供 Controller 使用
 */
@Component
public class UserIdArgumentResolver implements AuthenticationSuccessHandler {

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) {
        // 此类仅作为参考，实际通过 Filter 中 SecurityContextHolder 完成
    }

    /**
     * 从 SecurityContext 中提取当前用户 ID
     */
    public static Long getCurrentUserId(Authentication auth) {
        return (Long) auth.getPrincipal();
    }
}