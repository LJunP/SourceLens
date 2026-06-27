package com.sourcelens.module.repository.service;

import com.sourcelens.common.exception.BizException;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

public final class GitHubApiEndpointPolicy {

    private GitHubApiEndpointPolicy() {
    }

    public static String normalizeAndValidate(String apiBaseUrl, String allowedApiHosts) {
        String normalizedUrl = apiBaseUrl == null ? "" : apiBaseUrl.trim();
        if (!StringUtils.hasText(normalizedUrl)) {
            throw BizException.badRequest("GitHub API Base URL 不能为空");
        }
        URI uri = parse(normalizedUrl);
        if (!"https".equalsIgnoreCase(uri.getScheme())) {
            throw BizException.badRequest("GitHub API Base URL 必须使用 https");
        }
        if (uri.getUserInfo() != null || uri.getRawQuery() != null || uri.getRawFragment() != null) {
            throw BizException.badRequest("GitHub API Base URL 不能包含认证信息、query 或 fragment");
        }

        String host = uri.getHost();
        if (!StringUtils.hasText(host)) {
            throw BizException.badRequest("GitHub API Base URL 缺少 host");
        }
        String normalizedHost = normalizeHost(host);
        if (!allowedHosts(allowedApiHosts).contains(normalizedHost)) {
            throw BizException.badRequest("GitHub API 不在允许的网络出口列表中: " + host);
        }
        if (isBlockedHost(normalizedHost)) {
            throw BizException.badRequest("GitHub API Base URL host 不允许指向本机、内网或 metadata 服务");
        }
        return trimTrailingSlash(normalizedUrl);
    }

    private static URI parse(String apiBaseUrl) {
        try {
            return new URI(apiBaseUrl);
        } catch (URISyntaxException e) {
            throw BizException.badRequest("GitHub API Base URL 格式无效");
        }
    }

    private static Set<String> allowedHosts(String allowedApiHosts) {
        return Arrays.stream((allowedApiHosts == null ? "" : allowedApiHosts).split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .map(GitHubApiEndpointPolicy::normalizeHost)
                .collect(Collectors.toUnmodifiableSet());
    }

    private static String normalizeHost(String host) {
        String value = host.toLowerCase(Locale.ROOT);
        if (value.endsWith(".")) {
            value = value.substring(0, value.length() - 1);
        }
        if (value.startsWith("[") && value.endsWith("]")) {
            value = value.substring(1, value.length() - 1);
        }
        return value;
    }

    private static boolean isBlockedHost(String host) {
        return "localhost".equals(host)
                || host.endsWith(".localhost")
                || "metadata.google.internal".equals(host)
                || isBlockedIpv4Literal(host)
                || isBlockedIpv6Literal(host);
    }

    private static boolean isBlockedIpv4Literal(String host) {
        String[] parts = host.split("\\.");
        if (parts.length != 4) {
            return false;
        }
        int[] octets = new int[4];
        for (int i = 0; i < parts.length; i++) {
            try {
                octets[i] = Integer.parseInt(parts[i]);
            } catch (NumberFormatException e) {
                return false;
            }
            if (octets[i] < 0 || octets[i] > 255) {
                return false;
            }
        }
        return octets[0] == 0
                || octets[0] == 10
                || octets[0] == 127
                || (octets[0] == 169 && octets[1] == 254)
                || (octets[0] == 172 && octets[1] >= 16 && octets[1] <= 31)
                || (octets[0] == 192 && octets[1] == 168);
    }

    private static boolean isBlockedIpv6Literal(String host) {
        if (!host.contains(":")) {
            return false;
        }
        return "::1".equals(host)
                || "0:0:0:0:0:0:0:1".equals(host)
                || host.startsWith("fc")
                || host.startsWith("fd")
                || host.startsWith("fe8")
                || host.startsWith("fe9")
                || host.startsWith("fea")
                || host.startsWith("feb");
    }

    private static String trimTrailingSlash(String value) {
        return value.replaceAll("/+$", "");
    }
}
