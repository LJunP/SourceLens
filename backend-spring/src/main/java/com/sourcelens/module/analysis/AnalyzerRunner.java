package com.sourcelens.module.analysis;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

/**
 * 调用 Rust Analyzer CLI 执行代码扫描
 * CLI 命令: sourcelens-analyzer scan --repo-path <path>
 * 输出: 结构化 JSON
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AnalyzerRunner {

    private static final int DEFAULT_MAX_STDOUT_BYTES = 64 * 1024 * 1024;
    private static final int MAX_STDERR_BYTES = 512 * 1024;
    private static final Duration STREAM_DRAIN_TIMEOUT = Duration.ofSeconds(2);

    @Value("${sourcelens.analyzer.path:sourcelens-analyzer}")
    private String configuredPath;

    @Value("${sourcelens.analyzer.timeout-seconds:300}")
    private int timeoutSeconds;

    @Value("${sourcelens.analyzer.max-stdout-bytes:67108864}")
    private int maxStdoutBytes = DEFAULT_MAX_STDOUT_BYTES;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ScanResultSchemaValidator schemaValidator;
    private String analyzerPath;

    @PostConstruct
    public void init() {
        this.analyzerPath = resolveAnalyzerPath();
        log.info("Rust Analyzer 路径解析完成: {}", analyzerPath);
    }

    /**
     * 多策略路径解析: 绝对路径 → 相对于 user.dir → 相对于 user.dir/../bin → 系统 PATH
     */
    private String resolveAnalyzerPath() {
        // 1. 配置路径本身存在(绝对路径)
        Path direct = Path.of(configuredPath).toAbsolutePath();
        if (Files.isExecutable(direct)) {
            return direct.toString();
        }

        // 2. 相对于 user.dir (Spring Boot 启动目录, 即 backend-spring/)
        Path relative = Path.of(System.getProperty("user.dir"), configuredPath).toAbsolutePath();
        if (Files.isExecutable(relative)) {
            return relative.toString();
        }

        // 3. 从 backend-spring/ 向上两级到项目根, 再进 bin/
        Path projectRoot = Path.of(System.getProperty("user.dir")).resolve("..").normalize().toAbsolutePath();
        Path projectBin = projectRoot.resolve("bin").resolve("sourcelens-analyzer").normalize();
        if (Files.isExecutable(projectBin)) {
            return projectBin.toString();
        }

        // 4. 直接在 user.dir 的 bin/ 下
        Path localBin = Path.of(System.getProperty("user.dir"), "bin", "sourcelens-analyzer").toAbsolutePath();
        if (Files.isExecutable(localBin)) {
            return localBin.toString();
        }

        // 5. 回退到配置值(假设在 PATH 上)
        log.warn("未找到 Rust Analyzer 二进制文件, 将使用配置值: {}", configuredPath);
        return configuredPath;
    }

    /**
     * 执行扫描,返回解析后的 JSON 树
     */
    public JsonNode scan(String repoPath) {
        log.info("启动 Rust Analyzer 扫描, repoPath={}, analyzer={}", repoPath, analyzerPath);
        long start = System.currentTimeMillis();

        try {
            ProcessBuilder pb = new ProcessBuilder(
                    analyzerPath, "scan", "--repo-path", repoPath
            );
            pb.redirectErrorStream(false);
            pb.environment().put("RUST_BACKTRACE", "1");

            Process process = pb.start();
            CompletableFuture<StreamCapture> stdoutFuture = CompletableFuture.supplyAsync(
                    () -> readLimitedStream(process.getInputStream(), maxStdoutBytes));
            CompletableFuture<StreamCapture> stderrFuture = CompletableFuture.supplyAsync(
                    () -> readLimitedStream(process.getErrorStream(), MAX_STDERR_BYTES));

            boolean finished = process.waitFor(timeoutSeconds, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                drainAfterDestroy(process);
                throw new RuntimeException("Rust Analyzer 超时(" + timeoutSeconds + "s), repoPath=" + repoPath);
            }

            int exitCode = process.exitValue();
            StreamCapture stdoutCapture = awaitStream(stdoutFuture, "stdout");
            StreamCapture stderrCapture = awaitStream(stderrFuture, "stderr");
            String stdout = stdoutCapture.streamOutput().trim();
            String stderr = stderrCapture.streamOutput().trim();
            long elapsed = System.currentTimeMillis() - start;
            log.info("Rust Analyzer 扫描完成, exitCode={}, elapsed={}ms, stderrSummary={}",
                    exitCode, elapsed, summarizeForLog(stderrCapture.logOutput(), 1200));

            if (exitCode != 0) {
                throw new RuntimeException("Rust Analyzer 执行失败, exitCode=" + exitCode + ", stderr=" + stderr);
            }
            if (stdoutCapture.truncated()) {
                throw new RuntimeException("Rust Analyzer stdout 超出上限, totalBytes=" + stdoutCapture.totalBytes()
                        + ", maxBytes=" + maxStdoutBytes + ", repoPath=" + repoPath);
            }

            JsonNode scanResult = objectMapper.readTree(stdout);
            schemaValidator.validate(scanResult);
            return scanResult;

        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("调用 Rust Analyzer 失败: " + e.getMessage(), e);
        }
    }

    private StreamCapture readLimitedStream(InputStream inputStream, int maxBytes) {
        try (InputStream stream = inputStream) {
            byte[] buffer = new byte[8192];
            ByteArrayOutputStream retained = new ByteArrayOutputStream(Math.min(maxBytes, buffer.length));
            long totalRead = 0;
            int read;
            while ((read = stream.read(buffer)) != -1) {
                if (totalRead < maxBytes) {
                    int remaining = (int) Math.min(read, maxBytes - totalRead);
                    retained.write(buffer, 0, remaining);
                }
                totalRead += read;
            }

            String output = retained.toString(StandardCharsets.UTF_8);
            return new StreamCapture(output, totalRead, totalRead > maxBytes, maxBytes, null);
        } catch (Exception e) {
            return new StreamCapture("", 0, false, maxBytes, e.getMessage());
        }
    }

    private String summarizeForLog(String value, int maxChars) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String singleLine = value.replaceAll("[\\r\\n]+", " | ");
        if (singleLine.length() <= maxChars) {
            return singleLine;
        }
        return singleLine.substring(0, maxChars) + "...[truncated]";
    }

    private StreamCapture awaitStream(CompletableFuture<StreamCapture> streamFuture, String streamName) {
        try {
            return streamFuture.get(STREAM_DRAIN_TIMEOUT.toMillis(), TimeUnit.MILLISECONDS);
        } catch (Exception e) {
            return StreamCapture.readFailure("读取 Rust Analyzer " + streamName + " 超时: " + e.getMessage());
        }
    }

    private void drainAfterDestroy(Process process) {
        try {
            process.waitFor(STREAM_DRAIN_TIMEOUT.toMillis(), TimeUnit.MILLISECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private record StreamCapture(String capturedOutput, long totalBytes, boolean truncated, int maxBytes, String readError) {
        private static StreamCapture readFailure(String message) {
            return new StreamCapture("", 0, false, 0, message);
        }

        private String streamOutput() {
            if (readError == null) {
                return capturedOutput;
            }
            return readError;
        }

        private String logOutput() {
            String value = streamOutput();
            if (truncated) {
                return value + "\n...[analyzer stream truncated after " + maxBytes + " bytes, totalBytes=" + totalBytes + "]";
            }
            return value;
        }
    }
}
