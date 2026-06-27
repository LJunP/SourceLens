package com.sourcelens;

import com.sourcelens.common.config.SecurityStartupValidator;
import org.junit.jupiter.api.Test;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.core.env.PropertySource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.mock.env.MockEnvironment;

import java.io.IOException;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class SecurityStartupValidatorTest {

    @Test
    void devProfileAllowsDevelopmentDefaults() {
        MockEnvironment environment = new MockEnvironment()
                .withProperty("sourcelens.jwt.secret", "SourceLens-2026-SuperSecretKey-ForDevelopmentOnly-PleaseChangeInProduction")
                .withProperty("sourcelens.encrypt.password", "SourceLensDefaultPassword2026")
                .withProperty("sourcelens.encrypt.salt", "SourceLensSalt2026")
                .withProperty("spring.datasource.url", "jdbc:mysql://localhost:3307/sourcelens")
                .withProperty("spring.datasource.username", "sourcelens")
                .withProperty("spring.datasource.password", "sourcelens123");
        environment.setActiveProfiles("dev");

        SecurityStartupValidator validator = new SecurityStartupValidator(environment);

        assertDoesNotThrow(() -> validator.run(new DefaultApplicationArguments()));
    }

    @Test
    void prodProfileRejectsDevelopmentDefaults() {
        MockEnvironment environment = validProdEnvironment()
                .withProperty("sourcelens.jwt.secret", "SourceLens-2026-SuperSecretKey-ForDevelopmentOnly-PleaseChangeInProduction");

        SecurityStartupValidator validator = new SecurityStartupValidator(environment);

        assertThrows(IllegalStateException.class, () -> validator.run(new DefaultApplicationArguments()));
    }

    @Test
    void prodProfileRejectsPatCredentials() {
        MockEnvironment environment = validProdEnvironment()
                .withProperty("sourcelens.repository.allow-pat-credentials", "true");

        SecurityStartupValidator validator = new SecurityStartupValidator(environment);

        assertThrows(IllegalStateException.class, () -> validator.run(new DefaultApplicationArguments()));
    }

    @Test
    void prodProfileRequiresDockerSandbox() {
        MockEnvironment environment = validProdEnvironment()
                .withProperty("sourcelens.sandbox.executor", "local");

        SecurityStartupValidator validator = new SecurityStartupValidator(environment);

        assertThrows(IllegalStateException.class, () -> validator.run(new DefaultApplicationArguments()));
    }

    @Test
    void prodProfileRejectsUnsafeDockerSandbox() {
        MockEnvironment environment = validProdEnvironment()
                .withProperty("sourcelens.sandbox.docker.network", "bridge");

        SecurityStartupValidator validator = new SecurityStartupValidator(environment);

        assertThrows(IllegalStateException.class, () -> validator.run(new DefaultApplicationArguments()));
    }

    @Test
    void prodProfileRejectsUnpinnedDockerSandboxImage() {
        MockEnvironment environment = validProdEnvironment()
                .withProperty("sourcelens.sandbox.docker.image", "alpine/git:latest");

        SecurityStartupValidator validator = new SecurityStartupValidator(environment);

        assertThrows(IllegalStateException.class, () -> validator.run(new DefaultApplicationArguments()));
    }

    @Test
    void prodProfileRejectsNonPositiveDockerResourceLimits() {
        SecurityStartupValidator zeroCpuValidator = new SecurityStartupValidator(validProdEnvironment()
                .withProperty("sourcelens.sandbox.docker.cpus", "0"));
        SecurityStartupValidator zeroMemoryValidator = new SecurityStartupValidator(validProdEnvironment()
                .withProperty("sourcelens.sandbox.docker.memory", "0m"));

        assertThrows(IllegalStateException.class, () -> zeroCpuValidator.run(new DefaultApplicationArguments()));
        assertThrows(IllegalStateException.class, () -> zeroMemoryValidator.run(new DefaultApplicationArguments()));
    }

    @Test
    void prodProfileRequiresGithubAppWhenAutoPrIsEnabled() {
        MockEnvironment environment = validProdEnvironment()
                .withProperty("sourcelens.autorepair.submit-pr-enabled", "true");

        SecurityStartupValidator validator = new SecurityStartupValidator(environment);

        assertThrows(IllegalStateException.class, () -> validator.run(new DefaultApplicationArguments()));
    }

    @Test
    void prodProfileAcceptsGithubAppWhenAutoPrIsEnabled() {
        MockEnvironment environment = validProdEnvironment()
                .withProperty("sourcelens.autorepair.submit-pr-enabled", "true");
        addGithubAppEnvironment(environment);

        SecurityStartupValidator validator = new SecurityStartupValidator(environment);

        assertDoesNotThrow(() -> validator.run(new DefaultApplicationArguments()));
    }

    @Test
    void prodProfileRejectsUnsafeGithubApiEndpointWhenAutoPrIsEnabled() {
        MockEnvironment environment = validProdEnvironment()
                .withProperty("sourcelens.autorepair.submit-pr-enabled", "true");
        addGithubAppEnvironment(environment);
        environment
                .withProperty("sourcelens.github-app.api-base-url", "https://169.254.169.254")
                .withProperty("sourcelens.github-app.allowed-api-hosts", "169.254.169.254");

        SecurityStartupValidator validator = new SecurityStartupValidator(environment);

        assertThrows(IllegalStateException.class, () -> validator.run(new DefaultApplicationArguments()));
    }

    @Test
    void prodProfileRejectsGithubApiEndpointOutsideAllowlistWhenAgentCreatePrIsEnabled() {
        MockEnvironment environment = validProdEnvironment()
                .withProperty("sourcelens.agent.tools.create-pr-enabled", "true");
        addGithubAppEnvironment(environment);
        environment
                .withProperty("sourcelens.github-app.api-base-url", "https://api.evil.example")
                .withProperty("sourcelens.github-app.allowed-api-hosts", "api.github.com");

        SecurityStartupValidator validator = new SecurityStartupValidator(environment);

        assertThrows(IllegalStateException.class, () -> validator.run(new DefaultApplicationArguments()));
    }

    @Test
    void prodProfileAcceptsStrongSecrets() {
        SecurityStartupValidator validator = new SecurityStartupValidator(validProdEnvironment());

        assertDoesNotThrow(() -> validator.run(new DefaultApplicationArguments()));
    }

    @Test
    void prodProfileAcceptsActualYamlWhenOnlyExternalSecretsAreProvided() throws IOException {
        MockEnvironment environment = prodYamlEnvironment();

        assertEquals("docker", environment.getProperty("sourcelens.sandbox.executor"));
        assertEquals("alpine/git:latest@sha256:8d6ede0b29c666ac111c732468c4d758c1c08f054f211dd98f15d421a6ffab40",
                environment.getProperty("sourcelens.sandbox.docker.image"));
        assertEquals("none", environment.getProperty("sourcelens.sandbox.docker.network"));
        assertEquals("256", environment.getProperty("sourcelens.sandbox.docker.pids-limit"));
        assertEquals("true", environment.getProperty("sourcelens.sandbox.docker.read-only-root"));
        assertEquals("/tmp:rw,noexec,nosuid,size=64m", environment.getProperty("sourcelens.sandbox.docker.tmpfs"));

        SecurityStartupValidator validator = new SecurityStartupValidator(environment);

        assertDoesNotThrow(() -> validator.run(new DefaultApplicationArguments()));
    }

    private MockEnvironment validProdEnvironment() {
        MockEnvironment environment = new MockEnvironment()
                .withProperty("sourcelens.jwt.secret", "prod-jwt-secret-0123456789abcdef0123456789abcdef")
                .withProperty("sourcelens.encrypt.password", "prod-encrypt-password-0123456789")
                .withProperty("sourcelens.encrypt.salt", "prod-salt-012345")
                .withProperty("spring.datasource.url", "jdbc:mysql://mysql:3306/sourcelens")
                .withProperty("spring.datasource.username", "sourcelens")
                .withProperty("spring.datasource.password", "prod-db-password-012345")
                .withProperty("sourcelens.repository.allow-local-file", "false")
                .withProperty("sourcelens.repository.allow-pat-credentials", "false")
                .withProperty("sourcelens.agent.tools.exec-test-enabled", "false")
                .withProperty("sourcelens.agent.tools.create-pr-enabled", "false")
                .withProperty("sourcelens.autorepair.submit-pr-enabled", "false")
                .withProperty("sourcelens.sandbox.executor", "docker")
                .withProperty("sourcelens.sandbox.docker.image",
                        "alpine/git:latest@sha256:8d6ede0b29c666ac111c732468c4d758c1c08f054f211dd98f15d421a6ffab40")
                .withProperty("sourcelens.sandbox.docker.network", "none")
                .withProperty("sourcelens.sandbox.docker.read-only-root", "true")
                .withProperty("sourcelens.sandbox.docker.memory", "512m")
                .withProperty("sourcelens.sandbox.docker.cpus", "1.0")
                .withProperty("sourcelens.sandbox.docker.pids-limit", "256")
                .withProperty("sourcelens.sandbox.docker.user", "1000:1000")
                .withProperty("sourcelens.sandbox.docker.tmpfs", "/tmp:rw,noexec,nosuid,size=64m");
        environment.setActiveProfiles("prod");
        return environment;
    }

    private void addGithubAppEnvironment(MockEnvironment environment) {
        environment
                .withProperty("sourcelens.github-app.app-id", "12345")
                .withProperty("sourcelens.github-app.private-key-pem",
                        "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----")
                .withProperty("sourcelens.github-app.webhook-secret", "prod-webhook-secret-012345")
                .withProperty("sourcelens.github-app.api-base-url", "https://api.github.com")
                .withProperty("sourcelens.github-app.allowed-api-hosts", "api.github.com");
    }

    private MockEnvironment prodYamlEnvironment() throws IOException {
        MockEnvironment environment = new MockEnvironment()
                .withProperty("DB_URL", "jdbc:mysql://mysql:3306/sourcelens")
                .withProperty("DB_USERNAME", "sourcelens")
                .withProperty("DB_PASSWORD", "prod-db-password-012345")
                .withProperty("REDIS_HOST", "redis")
                .withProperty("REDIS_PORT", "6379")
                .withProperty("JWT_SECRET", "prod-jwt-secret-0123456789abcdef0123456789abcdef")
                .withProperty("ENCRYPT_PASSWORD", "prod-encrypt-password-0123456789")
                .withProperty("ENCRYPT_SALT", "prod-salt-012345");
        environment.setActiveProfiles("prod");
        addYamlAfterMockProperties(environment, "application.yml");
        addYamlAfterMockProperties(environment, "application-prod.yml");
        return environment;
    }

    private void addYamlAfterMockProperties(MockEnvironment environment, String resourceName) throws IOException {
        YamlPropertySourceLoader loader = new YamlPropertySourceLoader();
        FileSystemResource resource = new FileSystemResource(Path.of("src/main/resources", resourceName));
        for (PropertySource<?> propertySource : loader.load(resourceName, resource)) {
            environment.getPropertySources().addAfter("mockProperties", propertySource);
        }
    }
}
