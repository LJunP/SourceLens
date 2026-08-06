package com.sourcelens;

import com.sourcelens.common.observability.SourceLensMetrics;
import com.sourcelens.module.sandbox.LocalProcessSandboxExecutor;
import com.sourcelens.module.sandbox.SandboxCommand;
import com.sourcelens.module.sandbox.SandboxExecutionResult;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LocalProcessSandboxExecutorTest {

    private final LocalProcessSandboxExecutor executor = new LocalProcessSandboxExecutor();

    @TempDir
    Path workDir;

    @Test
    void execute_shouldRunStructuredCommandInWorkingDirectory() {
        SandboxExecutionResult result = executor.execute(SandboxCommand.builder()
                .command(List.of("pwd"))
                .workingDirectory(workDir)
                .timeout(Duration.ofSeconds(5))
                .build());

        assertEquals(0, result.getExitCode());
        assertTrue(result.getOutput().contains(workDir.toString()));
    }

    @Test
    void execute_shouldReturnTimedOutResult() {
        SandboxExecutionResult result = executor.execute(SandboxCommand.builder()
                .command(List.of("sleep", "2"))
                .workingDirectory(workDir)
                .timeout(Duration.ofMillis(100))
                .build());

        assertEquals(-999, result.getExitCode());
        assertTrue(result.isTimedOut());
    }

    @Test
    void execute_shouldRecordSandboxMetrics() {
        SimpleMeterRegistry registry = new SimpleMeterRegistry();
        LocalProcessSandboxExecutor metricExecutor = new LocalProcessSandboxExecutor(new SourceLensMetrics(registry));

        SandboxExecutionResult result = metricExecutor.execute(SandboxCommand.builder()
                .command(List.of("pwd"))
                .workingDirectory(workDir)
                .timeout(Duration.ofSeconds(5))
                .build());

        assertEquals(0, result.getExitCode());
        assertEquals(1.0, registry.get("sourcelens.sandbox.commands")
                .tag("executor", "local")
                .tag("outcome", "success")
                .counter()
                .count());
    }

    @Test
    void execute_shouldRejectNonPositiveTimeout() {
        assertThrows(IllegalArgumentException.class, () -> executor.execute(SandboxCommand.builder()
                .command(List.of("pwd"))
                .workingDirectory(workDir)
                .timeout(Duration.ZERO)
                .build()));
    }

    @Test
    void execute_shouldRejectShellInterpreterCommands() {
        IllegalArgumentException error = assertThrows(IllegalArgumentException.class, () -> executor.execute(SandboxCommand.builder()
                .command(List.of("sh", "-c", "echo unsafe"))
                .workingDirectory(workDir)
                .timeout(Duration.ofSeconds(5))
                .build()));

        assertTrue(error.getMessage().contains("shell interpreter"));
    }

    @Test
    void execute_shouldRejectSecretEnvironmentOverrides() {
        IllegalArgumentException error = assertThrows(IllegalArgumentException.class, () -> executor.execute(SandboxCommand.builder()
                .command(List.of("pwd"))
                .workingDirectory(workDir)
                .environment(Map.of("GITHUB_TOKEN", "ghp_unsafe"))
                .timeout(Duration.ofSeconds(5))
                .build()));

        assertTrue(error.getMessage().contains("secret-bearing"));
    }

    @Test
    void execute_shouldRejectFilesystemRootWorkingDirectory() {
        IllegalArgumentException error = assertThrows(IllegalArgumentException.class, () -> executor.execute(SandboxCommand.builder()
                .command(List.of("pwd"))
                .workingDirectory(Path.of("/"))
                .timeout(Duration.ofSeconds(5))
                .build()));

        assertTrue(error.getMessage().contains("filesystem root"));
    }

    @Test
    void execute_shouldNotInheritUnsafeParentEnvironmentByDefault() {
        SandboxExecutionResult result = executor.execute(SandboxCommand.builder()
                .command(List.of("env"))
                .workingDirectory(workDir)
                .timeout(Duration.ofSeconds(5))
                .build());

        assertEquals(0, result.getExitCode());
        assertTrue(result.getOutput().contains("PATH="));
        assertTrue(result.getOutput().lines().noneMatch(line -> line.startsWith("GITHUB_TOKEN=")));
        assertTrue(result.getOutput().lines().noneMatch(line -> line.startsWith("OPENAI_API_KEY=")));
        assertTrue(result.getOutput().lines().noneMatch(line -> line.startsWith("JWT_SECRET=")));
    }

    @Test
    void execute_shouldTreatNullEnvironmentAsEmpty() {
        SandboxExecutionResult result = executor.execute(SandboxCommand.builder()
                .command(List.of("pwd"))
                .workingDirectory(workDir)
                .environment(null)
                .timeout(Duration.ofSeconds(5))
                .build());

        assertEquals(0, result.getExitCode());
    }
}
