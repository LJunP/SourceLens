package com.sourcelens;

import com.sourcelens.common.observability.SourceLensMetrics;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class SourceLensMetricsTest {

    @Test
    void recordExecutionTaskStatus_shouldExposeNormalizedTags() {
        SimpleMeterRegistry registry = new SimpleMeterRegistry();
        SourceLensMetrics metrics = new SourceLensMetrics(registry);

        metrics.recordExecutionTaskStatus("Auto Repair", "SUCCESS");

        assertEquals(1.0, registry.get("sourcelens.execution.tasks")
                .tag("task_type", "auto_repair")
                .tag("status", "success")
                .counter()
                .count());
    }

    @Test
    void recordAgentToolCall_shouldRecordCounterAndTimer() {
        SimpleMeterRegistry registry = new SimpleMeterRegistry();
        SourceLensMetrics metrics = new SourceLensMetrics(registry);

        metrics.recordAgentToolCall("shell.exec", "EXEC_TEST", false, 42);

        assertEquals(1.0, registry.get("sourcelens.agent.tool.calls")
                .tag("tool", "shell.exec")
                .tag("permission", "exec_test")
                .tag("outcome", "failure")
                .counter()
                .count());
        assertEquals(1, registry.get("sourcelens.agent.tool.duration")
                .tag("tool", "shell.exec")
                .tag("permission", "exec_test")
                .tag("outcome", "failure")
                .timer()
                .count());
    }
}
