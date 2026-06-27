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
                .command(List.of("sh", "-c", "sleep 2"))
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
}
