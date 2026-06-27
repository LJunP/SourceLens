package com.sourcelens.module.agent.service;

import com.sourcelens.common.exception.BizException;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Locale;

public final class LlmEndpointPolicy {

    private LlmEndpointPolicy() {
    }

    public static String normalizeAndValidate(String provider, String baseUrl) {
        String normalizedProvider = provider == null ? "" : provider.trim().toUpperCase(Locale.ROOT);
        String normalizedUrl = baseUrl == null ? "" : baseUrl.trim();
        if (!StringUtils.hasText(normalizedUrl)) {
            throw BizException.badRequest("Base URL 不能为空");
        }

        URI uri = parse(normalizedUrl);
        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
        if ("MOCK".equals(normalizedProvider)) {
            if (!"mock".equals(scheme)) {
                throw BizException.badRequest("Mock LLM 仅允许 mock:// URL");
            }
            return trimTrailingSlash(normalizedUrl);
        }

        if (!"https".equals(scheme)) {
            throw BizException.badRequest("LLM Base URL 必须使用 https");
        }
        if (uri.getUserInfo() != null || uri.getRawQuery() != null || uri.getRawFragment() != null) {
            throw BizException.badRequest("LLM Base URL 不能包含认证信息、query 或 fragment");
        }

        String host = uri.getHost();
        if (!StringUtils.hasText(host)) {
            throw BizException.badRequest("LLM Base URL 缺少 host");
        }
        validateHost(host);
        return trimTrailingSlash(normalizedUrl);
    }

    private static URI parse(String baseUrl) {
        try {
            return new URI(baseUrl);
        } catch (URISyntaxException e) {
            throw BizException.badRequest("LLM Base URL 格式无效");
        }
    }

    private static void validateHost(String host) {
        String value = host.toLowerCase(Locale.ROOT);
        if (value.endsWith(".")) {
            value = value.substring(0, value.length() - 1);
        }
        if (value.startsWith("[") && value.endsWith("]")) {
            value = value.substring(1, value.length() - 1);
        }
        if ("localhost".equals(value) || value.endsWith(".localhost")
                || "metadata.google.internal".equals(value)) {
            throw BizException.badRequest("LLM Base URL host 不允许指向本机或 metadata 服务");
        }
        if (isBlockedIpv4Literal(value) || isBlockedIpv6Literal(value)) {
            throw BizException.badRequest("LLM Base URL host 不允许指向内网、回环或链路本地地址");
        }
    }

    private static boolean isBlockedIpv4Literal(String host) {
        String[] parts = host.split("\\.");
        if (parts.length != 4) {
            return false;
        }
        int[] octets = new int[4];
        for (int i = 0; i < parts.length; i++) {
            try {
                if (parts[i].startsWith("+") || parts[i].startsWith("-")) {
                    return false;
                }
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
        String value = host.toLowerCase(Locale.ROOT);
        return "::1".equals(value)
                || "0:0:0:0:0:0:0:1".equals(value)
                || value.startsWith("fc")
                || value.startsWith("fd")
                || value.startsWith("fe8")
                || value.startsWith("fe9")
                || value.startsWith("fea")
                || value.startsWith("feb");
    }

    private static String trimTrailingSlash(String value) {
        return value.replaceAll("/+$", "");
    }
}
