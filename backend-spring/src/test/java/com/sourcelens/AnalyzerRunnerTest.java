package com.sourcelens;

import com.fasterxml.jackson.databind.JsonNode;
import com.sourcelens.module.analysis.AnalyzerRunner;
import com.sourcelens.module.analysis.ScanResultSchemaValidator;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTimeoutPreemptively;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AnalyzerRunnerTest {

    @TempDir
    Path tempDir;

    @Test
    void scan_shouldParseValidAnalyzerJson() throws Exception {
        AnalyzerRunner runner = runnerFor(script("""
                #!/bin/sh
                printf '{"scan_result_schema_version":2,"symbols":[],"relations":[],"graph":{"nodes":[],"edges":[]},"structure":{}}'
                """), 5);

        JsonNode result = runner.scan(tempDir.toString());

        assertEquals(2, result.path("scan_result_schema_version").asInt());
    }

    @Test
    void scan_shouldEnforceTimeoutBeforeStreamReadCanHang() throws Exception {
        AnalyzerRunner runner = runnerFor(script("""
                #!/bin/sh
                sleep 5
                printf '{"scan_result_schema_version":2}'
                """), 1);

        RuntimeException error = assertTimeoutPreemptively(Duration.ofSeconds(3),
                () -> assertThrows(RuntimeException.class, () -> runner.scan(tempDir.toString())));

        assertTrue(error.getMessage().contains("超时"));
    }

    @Test
    void scan_shouldDrainLargeStderrWithoutBlockingStdoutJson() throws Exception {
        AnalyzerRunner runner = runnerFor(script("""
                #!/bin/sh
                i=0
                while [ "$i" -lt 20000 ]; do
                  echo "analyzer warning line $i" >&2
                  i=$((i + 1))
                done
                printf '{"scan_result_schema_version":2,"symbols":[],"relations":[],"graph":{"nodes":[],"edges":[]},"structure":{}}'
                """), 10);

        JsonNode result = assertTimeoutPreemptively(Duration.ofSeconds(5), () -> runner.scan(tempDir.toString()));

        assertEquals(2, result.path("scan_result_schema_version").asInt());
    }

    @Test
    void scan_shouldParseStdoutLargerThanLegacyLimit() throws Exception {
        AnalyzerRunner runner = runnerFor(script("""
                #!/bin/sh
                python3 - <<'PY'
                import json
                print(json.dumps({
                  "scan_result_schema_version": 2,
                  "symbols": [],
                  "relations": [],
                  "graph": {"nodes": [], "edges": []},
                  "structure": {},
                  "file_tree": {"total_files": 1, "large_files": ["x" * (5 * 1024 * 1024)]}
                }))
                PY
                """), 10);

        JsonNode result = assertTimeoutPreemptively(Duration.ofSeconds(5), () -> runner.scan(tempDir.toString()));

        assertEquals(2, result.path("scan_result_schema_version").asInt());
    }

    @Test
    void scan_shouldFailClearlyWhenStdoutExceedsConfiguredLimit() throws Exception {
        AnalyzerRunner runner = runnerFor(script("""
                #!/bin/sh
                printf '{"scan_result_schema_version":2,"symbols":[],"relations":[],"graph":{"nodes":[],"edges":[]},"structure":{},"file_tree":{"large_files":["'
                i=0
                while [ "$i" -lt 512 ]; do
                  printf 'x'
                  i=$((i + 1))
                done
                printf '"]}}'
                """), 5, 128);

        RuntimeException error = assertThrows(RuntimeException.class, () -> runner.scan(tempDir.toString()));

        assertTrue(error.getMessage().contains("Rust Analyzer stdout 超出上限"));
    }

    private AnalyzerRunner runnerFor(Path analyzerPath, int timeoutSeconds) {
        return runnerFor(analyzerPath, timeoutSeconds, 64 * 1024 * 1024);
    }

    private AnalyzerRunner runnerFor(Path analyzerPath, int timeoutSeconds, int maxStdoutBytes) {
        AnalyzerRunner runner = new AnalyzerRunner(new ScanResultSchemaValidator());
        ReflectionTestUtils.setField(runner, "configuredPath", analyzerPath.toString());
        ReflectionTestUtils.setField(runner, "timeoutSeconds", timeoutSeconds);
        ReflectionTestUtils.setField(runner, "maxStdoutBytes", maxStdoutBytes);
        runner.init();
        return runner;
    }

    private Path script(String content) throws Exception {
        Path script = tempDir.resolve("fake-analyzer-" + System.nanoTime() + ".sh");
        Files.writeString(script, content);
        assertTrue(script.toFile().setExecutable(true));
        return script;
    }
}
