package com.sourcelens.common.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SecurityConfigTest {

    @Test
    void devTooling_shouldOnlyBeEnabledForDevOrTestProfiles() {
        assertTrue(isDevToolingEnabled("dev"));
        assertTrue(isDevToolingEnabled("test"));
        assertTrue(isDevToolingEnabled("dev", "local"));

        assertFalse(isDevToolingEnabled());
        assertFalse(isDevToolingEnabled("prod"));
        assertFalse(isDevToolingEnabled("staging"));
        assertFalse(isDevToolingEnabled("qa"));
    }

    private boolean isDevToolingEnabled(String... profiles) {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles(profiles);
        SecurityConfig config = new SecurityConfig(null, environment);
        Boolean enabled = ReflectionTestUtils.invokeMethod(config, "isDevToolingEnabled");
        return Boolean.TRUE.equals(enabled);
    }
}
