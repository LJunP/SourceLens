package com.sourcelens;

import com.sourcelens.common.observability.SourceLensMetrics;
import com.sourcelens.module.sandbox.DockerSandboxExecutor;
import com.sourcelens.module.sandbox.SandboxCommand;
import com.sourcelens.module.sandbox.SandboxExecutionResult;
import com.sourcelens.module.sandbox.SandboxExecutor;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DockerSandboxExecutorTest {

    private final DockerSandboxExecutor executor = new DockerSandboxExecutor();

    @TempDir
    Path workDir;

    @Test
    void execute_shouldRejectNonPositiveTimeoutBeforeDockerRun() {
        assertThrows(IllegalArgumentException.class, () -> executor.execute(SandboxCommand.builder()
                .command(List.of("pwd"))
                .workingDirectory(workDir)
                .timeout(Duration.ZERO)
                .build()));
    }

    @Test
    void execute_shouldBuildDockerCommandWithIsolationFlags() {
        CapturingExecutor capturingExecutor = new CapturingExecutor();
        DockerSandboxExecutor dockerExecutor = new DockerSandboxExecutor(capturingExecutor);

        dockerExecutor.execute(SandboxCommand.builder()
                .command(List.of("mvn", "test"))
                .workingDirectory(workDir)
                .timeout(Duration.ofSeconds(30))
                .build());

        List<String> command = capturingExecutor.command.getCommand();
        assertTrue(command.containsAll(List.of(
                "--network", "none",
                "--memory", "512m",
                "--memory-swap", "512m",
                "--cpus", "1.0",
                "--user", "1000:1000",
                "--pids-limit", "256",
                "--cap-drop", "ALL",
                "--security-opt", "no-new-privileges",
                "--entrypoint", "",
                "--read-only",
                "--tmpfs", "/tmp:rw,noexec,nosuid,size=64m"
        )));
        assertTrue(command.contains(workDir.toAbsolutePath().normalize() + ":/workspace:rw"));
        assertTrue(command.contains("alpine/git:latest@sha256:8d6ede0b29c666ac111c732468c4d758c1c08f054f211dd98f15d421a6ffab40"));
        assertTrue(command.subList(command.size() - 2, command.size()).equals(List.of("mvn", "test")));
    }

    @Test
    void execute_shouldRecordDockerSandboxMetrics() {
        SimpleMeterRegistry registry = new SimpleMeterRegistry();
        DockerSandboxExecutor dockerExecutor = new DockerSandboxExecutor(new CapturingExecutor(), new SourceLensMetrics(registry));

        dockerExecutor.execute(SandboxCommand.builder()
                .command(List.of("mvn", "test"))
                .workingDirectory(workDir)
                .timeout(Duration.ofSeconds(30))
                .build());

        assertTrue(registry.get("sourcelens.sandbox.commands")
                .tag("executor", "docker")
                .tag("outcome", "success")
                .counter()
                .count() == 1.0);
    }

    private static class CapturingExecutor implements SandboxExecutor {
        private SandboxCommand command;

        @Override
        public SandboxExecutionResult execute(SandboxCommand command) {
            this.command = SandboxCommand.builder()
                    .command(new ArrayList<>(command.getCommand()))
                    .workingDirectory(command.getWorkingDirectory())
                    .timeout(command.getTimeout())
                    .environment(command.getEnvironment())
                    .build();
            return SandboxExecutionResult.builder()
                    .exitCode(0)
                    .output("ok")
                    .build();
        }
    }
}
