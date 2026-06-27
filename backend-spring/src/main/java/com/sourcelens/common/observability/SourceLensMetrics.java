package com.sourcelens.common.observability;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class SourceLensMetrics {

    private static final int MAX_TAG_LENGTH = 64;

    private final MeterRegistry meterRegistry;

    public SourceLensMetrics(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    public static SourceLensMetrics noop() {
        return new SourceLensMetrics(null);
    }

    public void recordExecutionTaskStatus(String taskType, String status) {
        if (meterRegistry == null) {
            return;
        }
        counter("sourcelens.execution.tasks",
                "task_type", tag(taskType),
                "status", tag(status)).increment();
    }

    public void recordExecutionStepStatus(String stepKey, String status) {
        if (meterRegistry == null) {
            return;
        }
        counter("sourcelens.execution.steps",
                "step_key", tag(stepKey),
                "status", tag(status)).increment();
    }

    public void recordAgentToolCall(String toolName, String permissionLevel, boolean success, long durationMs) {
        if (meterRegistry == null) {
            return;
        }
        String safeTool = tag(toolName);
        String safePermission = tag(permissionLevel);
        String outcome = success ? "success" : "failure";
        counter("sourcelens.agent.tool.calls",
                "tool", safeTool,
                "permission", safePermission,
                "outcome", outcome).increment();
        timer("sourcelens.agent.tool.duration",
                "tool", safeTool,
                "permission", safePermission,
                "outcome", outcome).record(Duration.ofMillis(Math.max(durationMs, 0)));
    }

    public void recordSandboxCommand(String executor, int exitCode, boolean timedOut, long durationMs) {
        if (meterRegistry == null) {
            return;
        }
        String outcome = timedOut ? "timeout" : exitCode == 0 ? "success" : "failure";
        counter("sourcelens.sandbox.commands",
                "executor", tag(executor),
                "outcome", outcome).increment();
        timer("sourcelens.sandbox.command.duration",
                "executor", tag(executor),
                "outcome", outcome).record(Duration.ofMillis(Math.max(durationMs, 0)));
    }

    private Counter counter(String name, String... tags) {
        return Counter.builder(name).tags(tags).register(meterRegistry);
    }

    private Timer timer(String name, String... tags) {
        return Timer.builder(name).tags(tags).register(meterRegistry);
    }

    private String tag(String value) {
        if (value == null || value.isBlank()) {
            return "unknown";
        }
        String normalized = value.trim().toLowerCase()
                .replaceAll("[^a-z0-9_.-]", "_");
        if (normalized.length() > MAX_TAG_LENGTH) {
            return normalized.substring(0, MAX_TAG_LENGTH);
        }
        return normalized;
    }
}
