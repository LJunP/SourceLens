package com.sourcelens.module.repository.service;

import com.sourcelens.common.exception.BizException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

@Service
public class GitHubWebhookSignatureService {

    private static final String SIGNATURE_PREFIX = "sha256=";

    @Value("${sourcelens.github-app.webhook-secret:}")
    private String webhookSecret;

    public boolean isConfigured() {
        return StringUtils.hasText(webhookSecret);
    }

    public void verifyOrThrow(String body, String signatureHeader) {
        if (!isConfigured()) {
            throw BizException.badRequest("GitHub App webhook secret 未配置");
        }
        if (!StringUtils.hasText(signatureHeader) || !signatureHeader.startsWith(SIGNATURE_PREFIX)) {
            throw BizException.unauthorized("GitHub webhook 签名缺失或格式不正确");
        }
        String expected = SIGNATURE_PREFIX + hmacSha256Hex(body == null ? "" : body);
        boolean matched = MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                signatureHeader.getBytes(StandardCharsets.UTF_8));
        if (!matched) {
            throw BizException.unauthorized("GitHub webhook 签名校验失败");
        }
    }

    String hmacSha256Hex(String body) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(body.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw BizException.internal("GitHub webhook 签名计算失败: " + e.getMessage());
        }
    }
}
