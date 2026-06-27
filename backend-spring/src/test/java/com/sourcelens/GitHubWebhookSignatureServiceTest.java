package com.sourcelens;

import com.sourcelens.common.exception.BizException;
import com.sourcelens.module.repository.service.GitHubWebhookSignatureService;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class GitHubWebhookSignatureServiceTest {

    @Test
    void verifyOrThrow_shouldAcceptValidSha256Signature() throws Exception {
        GitHubWebhookSignatureService service = new GitHubWebhookSignatureService();
        ReflectionTestUtils.setField(service, "webhookSecret", "secret");
        String body = "{\"zen\":\"Keep it logically awesome.\"}";
        String signature = "sha256=" + hmacSha256Hex("secret", body);

        assertDoesNotThrow(() -> service.verifyOrThrow(body, signature));
    }

    @Test
    void verifyOrThrow_shouldRejectMissingSecretAndBadSignature() {
        GitHubWebhookSignatureService service = new GitHubWebhookSignatureService();

        assertThrows(BizException.class, () -> service.verifyOrThrow("{}", "sha256=bad"));

        ReflectionTestUtils.setField(service, "webhookSecret", "secret");
        assertThrows(BizException.class, () -> service.verifyOrThrow("{}", "sha256=bad"));
        assertThrows(BizException.class, () -> service.verifyOrThrow("{}", null));
    }

    private String hmacSha256Hex(String secret, String body) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return HexFormat.of().formatHex(mac.doFinal(body.getBytes(StandardCharsets.UTF_8)));
    }
}
