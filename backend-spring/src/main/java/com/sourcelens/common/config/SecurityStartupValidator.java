package com.sourcelens.common.config;

import com.sourcelens.module.repository.service.GitHubApiEndpointPolicy;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Map;

/**
 * Fails fast when production starts with development or missing security settings.
 */
@Component
public class SecurityStartupValidator implements ApplicationRunner {

    private static final Map<String, String> FORBIDDEN_PROD_VALUES = Map.of(
            "sourcelens.jwt.secret", "SourceLens-2026-SuperSecretKey-ForDevelopmentOnly-PleaseChangeInProduction",
            "sourcelens.encrypt.password", "SourceLensDefaultPassword2026",
            "sourcelens.encrypt.salt", "SourceLensSalt2026",
            "spring.datasource.password", "sourcelens123"
    );

    private final Environment environment;

    public SecurityStartupValidator(Environment environment) {
        this.environment = environment;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!isProdProfile()) {
            return;
        }

        requireStrongSecret("sourcelens.jwt.secret", 32);
        requireStrongSecret("sourcelens.encrypt.password", 16);
        requireStrongSecret("sourcelens.encrypt.salt", 8);
        requirePresent("spring.datasource.url");
        requirePresent("spring.datasource.username");
        requireStrongSecret("spring.datasource.password", 12);
        requireProdRepositoryBoundary();
        requireProdAgentBoundary();
        requireProdSandboxBoundary();
        requireProdGithubAppBoundary();
    }

    private boolean isProdProfile() {
        return Arrays.asList(environment.getActiveProfiles()).contains("prod");
    }

    private void requirePresent(String propertyName) {
        String value = environment.getProperty(propertyName);
        if (!StringUtils.hasText(value)) {
            throw new IllegalStateException("Production security setting is missing: " + propertyName);
        }
    }

    private void requireStrongSecret(String propertyName, int minLength) {
        String value = environment.getProperty(propertyName);
        if (!StringUtils.hasText(value)) {
            throw new IllegalStateException("Production security secret is missing: " + propertyName);
        }
        if (value.length() < minLength) {
            throw new IllegalStateException("Production security secret is too short: " + propertyName);
        }
        String forbidden = FORBIDDEN_PROD_VALUES.get(propertyName);
        if (forbidden != null && forbidden.equals(value)) {
            throw new IllegalStateException("Production security secret uses a development default: " + propertyName);
        }
    }

    private void requireProdRepositoryBoundary() {
        requireFalse("sourcelens.repository.allow-local-file");
        requireFalse("sourcelens.repository.allow-pat-credentials");
    }

    private void requireProdAgentBoundary() {
        boolean execTestEnabled = getBoolean("sourcelens.agent.tools.exec-test-enabled");
        boolean createPrEnabled = getBoolean("sourcelens.agent.tools.create-pr-enabled");

        if (execTestEnabled) {
            requireEquals("sourcelens.sandbox.executor", "docker");
        }
        if (createPrEnabled) {
            requireGithubAppConfigured("sourcelens.agent.tools.create-pr-enabled");
        }
    }

    private void requireProdSandboxBoundary() {
        requireEquals("sourcelens.sandbox.executor", "docker");
        requirePinnedDockerImage("sourcelens.sandbox.docker.image");
        requireEquals("sourcelens.sandbox.docker.network", "none");
        requireTrue("sourcelens.sandbox.docker.read-only-root");
        requirePositiveDockerMemory("sourcelens.sandbox.docker.memory");
        requirePositiveDecimal("sourcelens.sandbox.docker.cpus");
        requirePositiveInteger("sourcelens.sandbox.docker.pids-limit");
        requireNonRootDockerUser();
        requireSafeTmpfs();
    }

    private void requireProdGithubAppBoundary() {
        if (getBoolean("sourcelens.autorepair.submit-pr-enabled")) {
            requireGithubAppConfigured("sourcelens.autorepair.submit-pr-enabled");
        }
    }

    private void requireGithubAppConfigured(String enablingProperty) {
        requirePresent("sourcelens.github-app.app-id");
        requirePresent("sourcelens.github-app.api-base-url");
        requirePresent("sourcelens.github-app.allowed-api-hosts");
        requireStrongSecret("sourcelens.github-app.webhook-secret", 16);

        String privateKey = environment.getProperty("sourcelens.github-app.private-key-pem");
        if (!StringUtils.hasText(privateKey)
                || !privateKey.contains("BEGIN")
                || !privateKey.contains("PRIVATE KEY")) {
            throw new IllegalStateException("Production GitHub App private key is missing or invalid while "
                    + enablingProperty + " is enabled");
        }
        requireSafeGithubApiEndpoint(enablingProperty);
    }

    private void requireSafeGithubApiEndpoint(String enablingProperty) {
        String apiBaseUrl = environment.getProperty("sourcelens.github-app.api-base-url");
        String allowedApiHosts = environment.getProperty("sourcelens.github-app.allowed-api-hosts");
        try {
            GitHubApiEndpointPolicy.normalizeAndValidate(apiBaseUrl, allowedApiHosts);
        } catch (RuntimeException e) {
            throw new IllegalStateException("Production GitHub API egress policy is invalid while "
                    + enablingProperty + " is enabled: " + e.getMessage(), e);
        }
    }

    private void requireFalse(String propertyName) {
        if (getBoolean(propertyName)) {
            throw new IllegalStateException("Production security setting must be false: " + propertyName);
        }
    }

    private void requireTrue(String propertyName) {
        if (!getBoolean(propertyName)) {
            throw new IllegalStateException("Production security setting must be true: " + propertyName);
        }
    }

    private void requireEquals(String propertyName, String expected) {
        String value = environment.getProperty(propertyName);
        if (!expected.equalsIgnoreCase(value == null ? "" : value.trim())) {
            throw new IllegalStateException("Production security setting must be " + expected + ": " + propertyName);
        }
    }

    private void requirePositiveInteger(String propertyName) {
        String value = environment.getProperty(propertyName);
        if (!StringUtils.hasText(value)) {
            throw new IllegalStateException("Production security setting is missing: " + propertyName);
        }
        try {
            if (Integer.parseInt(value.trim()) <= 0) {
                throw new IllegalStateException("Production security setting must be positive: " + propertyName);
            }
        } catch (NumberFormatException e) {
            throw new IllegalStateException("Production security setting must be a positive integer: " + propertyName);
        }
    }

    private void requirePositiveDecimal(String propertyName) {
        String value = environment.getProperty(propertyName);
        if (!StringUtils.hasText(value)) {
            throw new IllegalStateException("Production security setting is missing: " + propertyName);
        }
        try {
            if (new BigDecimal(value.trim()).compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalStateException("Production security setting must be positive: " + propertyName);
            }
        } catch (NumberFormatException e) {
            throw new IllegalStateException("Production security setting must be a positive decimal: " + propertyName);
        }
    }

    private void requirePositiveDockerMemory(String propertyName) {
        String value = environment.getProperty(propertyName);
        if (!StringUtils.hasText(value)) {
            throw new IllegalStateException("Production security setting is missing: " + propertyName);
        }
        String normalized = value.trim();
        if (!normalized.matches("[1-9][0-9]*[bBkKmMgG]?")) {
            throw new IllegalStateException("Production docker sandbox memory must be a positive Docker memory limit: "
                    + propertyName);
        }
    }

    private void requirePinnedDockerImage(String propertyName) {
        String value = environment.getProperty(propertyName);
        if (!StringUtils.hasText(value)) {
            throw new IllegalStateException("Production security setting is missing: " + propertyName);
        }
        String normalized = value.trim();
        if (!normalized.matches("[^\\s]+@sha256:[0-9a-fA-F]{64}")) {
            throw new IllegalStateException("Production docker sandbox image must be pinned to a sha256 digest: "
                    + propertyName);
        }
    }

    private void requireNonRootDockerUser() {
        String user = environment.getProperty("sourcelens.sandbox.docker.user");
        if (!StringUtils.hasText(user)) {
            throw new IllegalStateException("Production security setting is missing: sourcelens.sandbox.docker.user");
        }
        String normalized = user.trim().toLowerCase();
        if ("root".equals(normalized) || "0".equals(normalized) || normalized.startsWith("0:")) {
            throw new IllegalStateException("Production docker sandbox must not run as root: sourcelens.sandbox.docker.user");
        }
    }

    private void requireSafeTmpfs() {
        String tmpfs = environment.getProperty("sourcelens.sandbox.docker.tmpfs");
        if (!StringUtils.hasText(tmpfs)
                || !tmpfs.startsWith("/tmp:")
                || !tmpfs.contains("noexec")
                || !tmpfs.contains("nosuid")) {
            throw new IllegalStateException("Production docker sandbox tmpfs must include /tmp,noexec,nosuid");
        }
    }

    private boolean getBoolean(String propertyName) {
        return Boolean.parseBoolean(environment.getProperty(propertyName, "false"));
    }
}
