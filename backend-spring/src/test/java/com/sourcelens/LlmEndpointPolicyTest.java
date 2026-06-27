package com.sourcelens;

import com.sourcelens.common.exception.BizException;
import com.sourcelens.module.agent.service.LlmEndpointPolicy;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class LlmEndpointPolicyTest {

    @Test
    void normalizeAndValidate_shouldAcceptHttpsPublicEndpoint() {
        assertEquals("https://api.openai.com/v1",
                LlmEndpointPolicy.normalizeAndValidate("OPENAI", " https://api.openai.com/v1/ "));
    }

    @Test
    void normalizeAndValidate_shouldRejectNonHttpsEndpoint() {
        assertThrows(BizException.class,
                () -> LlmEndpointPolicy.normalizeAndValidate("CUSTOM", "http://api.example.com/v1"));
    }

    @Test
    void normalizeAndValidate_shouldRejectLocalhostAndPrivateIp() {
        assertThrows(BizException.class,
                () -> LlmEndpointPolicy.normalizeAndValidate("CUSTOM", "https://localhost/v1"));
        assertThrows(BizException.class,
                () -> LlmEndpointPolicy.normalizeAndValidate("CUSTOM", "https://192.168.1.10/v1"));
        assertThrows(BizException.class,
                () -> LlmEndpointPolicy.normalizeAndValidate("CUSTOM", "https://169.254.169.254/latest"));
        assertThrows(BizException.class,
                () -> LlmEndpointPolicy.normalizeAndValidate("CUSTOM", "https://[fd00::1]/v1"));
    }

    @Test
    void normalizeAndValidate_shouldRejectUserInfoQueryAndFragment() {
        assertThrows(BizException.class,
                () -> LlmEndpointPolicy.normalizeAndValidate("CUSTOM", "https://token@api.example.com/v1"));
        assertThrows(BizException.class,
                () -> LlmEndpointPolicy.normalizeAndValidate("CUSTOM", "https://api.example.com/v1?debug=true"));
        assertThrows(BizException.class,
                () -> LlmEndpointPolicy.normalizeAndValidate("CUSTOM", "https://api.example.com/v1#frag"));
    }

    @Test
    void normalizeAndValidate_shouldAllowMockSchemeOnlyForMockProvider() {
        assertEquals("mock://local", LlmEndpointPolicy.normalizeAndValidate("MOCK", "mock://local/"));
        assertThrows(BizException.class,
                () -> LlmEndpointPolicy.normalizeAndValidate("CUSTOM", "mock://local"));
    }
}
