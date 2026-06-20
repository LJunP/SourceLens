package com.sourcelens.module.agent.tool;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * 在项目沙箱目录中执行 shell 命令。
 * 安全措施:工作目录限制、超时控制、危险命令黑名单、输出大小限制。
 */
@Slf4j
@Component
public class ShellExecTool implements AgentTool {

    private static final long DEFAULT_TIMEOUT = 30;
    private static final long MAX_TIMEOUT = 120;
    private static final int MAX_OUTPUT_SIZE = 50_000;

    // 危险命令黑名单
    private static final List<String> BLOCKED_PATTERNS = List.of(
            "rm -rf /",
            "rm -rf /*",
            "mkfs",
            "dd if=",
            "> /dev/sd",
            "chmod -R 777 /",
            "shutdown",
            "reboot",
            "init 0",
            ":(){ :|:& };:" // fork bomb
    );

    @Override
    public String name() {
        return "shell_exec";
    }

    @Override
    public String description() {
        return "Execute a shell command in the project's working directory. " +
                "Useful for running builds, tests, git commands, package managers, etc. " +
                "Commands have a timeout and are sandboxed to the project directory.";
    }

    @Override
    public Map<String, Object> inputSchema() {
        Map<String, Object> schema = new LinkedHashMap<>();
        schema.put("type", "object");

        Map<String, Object> properties = new LinkedHashMap<>();
        properties.put("command", Map.of(
                "type", "string",
                "description", "Shell command to execute, e.g. 'mvn test' or 'git log --oneline -5'"));
        properties.put("timeout", Map.of(
                "type", "integer",
                "description", "Timeout in seconds. Default 30, max 120.",
                "default", 30));
        schema.put("properties", properties);
        schema.put("required", List.of("command"));

        return schema;
    }

    @Override
    public ToolResult execute(Map<String, Object> args, ToolContext context) {
        String command = (String) args.get("command");
        long timeout = args.containsKey("timeout")
                ? Math.min(((Number) args.get("timeout")).longValue(), MAX_TIMEOUT)
                : DEFAULT_TIMEOUT;

        if (context.getProjectRootPath() == null) {
            return ToolResult.fail("项目根目录未设置");
        }

        // 检查危险命令
        String lowerCmd = command.toLowerCase();
        for (String blocked : BLOCKED_PATTERNS) {
            if (lowerCmd.contains(blocked.toLowerCase())) {
                return ToolResult.fail("命令被阻止(安全限制): 包含危险模式 '" + blocked + "'");
            }
        }

        Path projectRoot = Paths.get(context.getProjectRootPath());
        log.info("Agent 执行命令: dir={}, cmd={}", projectRoot, command);

        try {
            ProcessBuilder pb = new ProcessBuilder("bash", "-c", command);
            pb.directory(projectRoot.toFile());
            pb.redirectErrorStream(true);

            Process process = pb.start();
            StringBuilder output = new StringBuilder();

            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                    if (output.length() > MAX_OUTPUT_SIZE) {
                        output.append("\n... [输出截断, 超过 ").append(MAX_OUTPUT_SIZE).append(" 字节限制] ...\n");
                        process.destroyForcibly();
                        break;
                    }
                }
            }

            boolean finished = process.waitFor(timeout, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                output.append("\n... [命令超时: ").append(timeout).append("s] ...\n");
            }

            int exitCode = process.exitValue();
            String result = output.toString();

            StringBuilder sb = new StringBuilder();
            sb.append("Exit code: ").append(exitCode).append("\n");
            if (!result.isEmpty()) {
                sb.append("Output:\n").append(result);
            }

            return ToolResult.ok(sb.toString());
        } catch (Exception e) {
            return ToolResult.fail("命令执行失败: " + e.getMessage());
        }
    }
}