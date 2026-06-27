package com.sourcelens;

import com.sourcelens.common.exception.BizException;
import com.sourcelens.common.exception.GlobalExceptionHandler;
import com.sourcelens.module.repository.controller.GitHubAppWebhookController;
import com.sourcelens.module.repository.service.GitHubAppWebhookService;
import com.sourcelens.module.repository.service.GitHubWebhookSignatureService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Map;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class GitHubAppWebhookControllerTest {

    private GitHubWebhookSignatureService signatureService;
    private GitHubAppWebhookService webhookService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        signatureService = mock(GitHubWebhookSignatureService.class);
        webhookService = mock(GitHubAppWebhookService.class);
        mockMvc = MockMvcBuilders
                .standaloneSetup(new GitHubAppWebhookController(signatureService, webhookService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void handle_shouldPassNullableDeliveryHeaderToServiceForBadRequest() throws Exception {
        String body = "{\"zen\":\"SourceLens webhook drill\"}";
        doNothing().when(signatureService).verifyOrThrow(body, "sha256=valid");
        when(webhookService.handle("ping", null, body))
                .thenThrow(BizException.badRequest("GitHub webhook delivery id 不能为空"));

        mockMvc.perform(post("/api/webhooks/github/app")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-GitHub-Event", "ping")
                        .header("X-Hub-Signature-256", "sha256=valid")
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"));

        verify(signatureService).verifyOrThrow(body, "sha256=valid");
        verify(webhookService).handle("ping", null, body);
    }

    @Test
    void handle_shouldRejectMissingSignatureBeforeBusinessProcessing() throws Exception {
        String body = "{\"zen\":\"SourceLens webhook drill\"}";
        doThrow(BizException.unauthorized("GitHub webhook 签名缺失或格式不正确"))
                .when(signatureService).verifyOrThrow(body, null);

        mockMvc.perform(post("/api/webhooks/github/app")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-GitHub-Event", "ping")
                        .header("X-GitHub-Delivery", "delivery-1")
                        .content(body))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));

        verify(signatureService).verifyOrThrow(body, null);
        verifyNoInteractions(webhookService);
    }

    @Test
    void handle_shouldReturnWebhookResultForValidHeaders() throws Exception {
        String body = "{\"zen\":\"SourceLens webhook drill\"}";
        doNothing().when(signatureService).verifyOrThrow(body, "sha256=valid");
        when(webhookService.handle(eq("ping"), eq("delivery-1"), eq(body)))
                .thenReturn(Map.of(
                        "event", "ping",
                        "deliveryId", "delivery-1",
                        "affectedRepositories", 0,
                        "duplicate", false
                ));

        mockMvc.perform(post("/api/webhooks/github/app")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-GitHub-Event", "ping")
                        .header("X-GitHub-Delivery", "delivery-1")
                        .header("X-Hub-Signature-256", "sha256=valid")
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.duplicate").value(false));

        verify(signatureService).verifyOrThrow(body, "sha256=valid");
        verify(webhookService).handle("ping", "delivery-1", body);
    }
}
