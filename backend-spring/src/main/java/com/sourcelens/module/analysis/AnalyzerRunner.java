package com.sourcelens.module.analysis;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.TimeUnit;

/**
 * 调用 Rust Analyzer CLI 执行代码扫描
 * CLI 命令: sourcelens-analyzer scan --repo-path <path>
 * 输出: 结构化 JSON
 */
@Slf4j
@Component
public class AnalyzerRunner {

    @Value("${sourcelens.analyzer.path:sourcelens-analyzer}")
    private String configuredPath;

    @Value("${sourcelens.analyzer.timeout-seconds:300}")
    private int timeoutSeconds;

    private final ObjectMapper objectMapper = new ObjectMapper();
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

            // 读取 stdout (JSON 结果)
            String stdout;
            String stderr;
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8));
                 BufferedReader errReader = new BufferedReader(
                         new InputStreamReader(process.getErrorStream(), StandardCharsets.UTF_8))) {

                stdout = reader.lines().reduce("", (a, b) -> a + b + "\n").trim();
                StringBuilder stderrBuilder = new StringBuilder();
                String line;
                while ((line = errReader.readLine()) != null) {
                    stderrBuilder.append(line).append("\n");
                }
                stderr = stderrBuilder.toString().trim();
            }

            boolean finished = process.waitFor(timeoutSeconds, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                throw new RuntimeException("Rust Analyzer 超时(" + timeoutSeconds + "s), repoPath=" + repoPath);
            }

            int exitCode = process.exitValue();
            long elapsed = System.currentTimeMillis() - start;
            log.info("Rust Analyzer 扫描完成, exitCode={}, elapsed={}ms, stderr={}", exitCode, elapsed, stderr);

            if (exitCode != 0) {
                throw new RuntimeException("Rust Analyzer 执行失败, exitCode=" + exitCode + ", stderr=" + stderr);
            }

            return objectMapper.readTree(stdout);

        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("调用 Rust Analyzer 失败: " + e.getMessage(), e);
        }
    }
}