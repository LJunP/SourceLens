package com.sourcelens.module.sandbox;

import com.sourcelens.common.observability.SourceLensMetrics;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
@ConditionalOnProperty(name = "sourcelens.sandbox.executor", havingValue = "local", matchIfMissing = true)
public class LocalProcessSandboxExecutor implements SandboxExecutor {

    private static final Duration DEFAULT_TIMEOUT = Duration.ofSeconds(30);
    private static final int MAX_OUTPUT_BYTES = 512 * 1024;

    private final SourceLensMetrics metrics;

    public LocalProcessSandboxExecutor() {
        this(SourceLensMetrics.noop());
    }

    @Autowired
    public LocalProcessSandboxExecutor(SourceLensMetrics metrics) {
        this.metrics = metrics;
    }

    @Override
    public SandboxExecutionResult execute(SandboxCommand command) {
        SandboxCommandValidator.validate(command);
        long start = System.currentTimeMillis();
        Duration timeout = command.getTimeout() == null ? DEFAULT_TIMEOUT : command.getTimeout();
        try {
            ProcessBuilder pb = new ProcessBuilder(command.getCommand());
            pb.directory(command.getWorkingDirectory().toFile());
            pb.redirectErrorStream(true);
            pb.environment().clear();
            pb.environment().putAll(SandboxCommandValidator.safeBaseEnvironment(System.getenv()));
            pb.environment().putAll(SandboxCommandValidator.validateAndNormalizeEnvironment(command.getEnvironment()));

            Process process = pb.start();
            CompletableFuture<String> outputFuture = CompletableFuture.supplyAsync(() -> readLimitedOutput(process));
            boolean finished = process.waitFor(timeout.toMillis(), TimeUnit.MILLISECONDS);
            if (!finished) {
                process.destroyForcibly();
                SandboxExecutionResult result = SandboxExecutionResult.builder()
                        .exitCode(-999)
                        .output("命令执行超时")
                        .timedOut(true)
                        .build();
                metrics.recordSandboxCommand("local", result.getExitCode(), result.isTimedOut(), elapsed(start));
                return result;
            }
            SandboxExecutionResult result = SandboxExecutionResult.builder()
                    .exitCode(process.exitValue())
                    .output(outputFuture.get(1, TimeUnit.SECONDS))
                    .timedOut(false)
                    .build();
            metrics.recordSandboxCommand("local", result.getExitCode(), result.isTimedOut(), elapsed(start));
            return result;
        } catch (Exception e) {
            log.warn("本地沙箱命令执行失败: {}", e.getMessage());
            SandboxExecutionResult result = SandboxExecutionResult.builder()
                    .exitCode(-1)
                    .output("命令执行异常: " + e.getMessage())
                    .timedOut(false)
                    .build();
            metrics.recordSandboxCommand("local", result.getExitCode(), result.isTimedOut(), elapsed(start));
            return result;
        }
    }

    private long elapsed(long start) {
        return System.currentTimeMillis() - start;
    }

    private String readLimitedOutput(Process process) {
        try {
            byte[] bytes = process.getInputStream().readNBytes(MAX_OUTPUT_BYTES + 1);
            List<Byte> limited = new ArrayList<>(Math.min(bytes.length, MAX_OUTPUT_BYTES));
            for (int i = 0; i < bytes.length && i < MAX_OUTPUT_BYTES; i++) {
                limited.add(bytes[i]);
            }
            byte[] output = new byte[limited.size()];
            for (int i = 0; i < limited.size(); i++) {
                output[i] = limited.get(i);
            }
            String text = new String(output, StandardCharsets.UTF_8);
            if (bytes.length > MAX_OUTPUT_BYTES) {
                return text + "\n...[output truncated]";
            }
            return text;
        } catch (Exception e) {
            return "读取命令输出失败: " + e.getMessage();
        }
    }
}
