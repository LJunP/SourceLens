package com.sourcelens.module.repository.controller;

import com.sourcelens.common.Result;
import com.sourcelens.module.repository.service.GitHubAppWebhookService;
import com.sourcelens.module.repository.service.GitHubWebhookSignatureService;
import io.swagger.v3.oas.annotations.Hidden;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Hidden
@RestController
@RequiredArgsConstructor
public class GitHubAppWebhookController {

    private final GitHubWebhookSignatureService signatureService;
    private final GitHubAppWebhookService webhookService;

    @PostMapping("/api/webhooks/github/app")
    public Result<Map<String, Object>> handle(@RequestHeader(value = "X-GitHub-Event", required = false) String event,
                                              @RequestHeader(value = "X-GitHub-Delivery", required = false) String deliveryId,
                                              @RequestHeader(value = "X-Hub-Signature-256", required = false) String signature,
                                              @RequestBody String body) {
        signatureService.verifyOrThrow(body, signature);
        return Result.ok(webhookService.handle(event, deliveryId, body));
    }
}
