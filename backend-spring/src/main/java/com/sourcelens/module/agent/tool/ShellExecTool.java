package com.sourcelens.module.agent.tool;

import com.sourcelens.module.sandbox.SandboxCommand;
import com.sourcelens.module.sandbox.SandboxExecutionResult;
import com.sourcelens.module.sandbox.SandboxExecutor;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.*;

/**
 * 在项目沙箱目录中执行 shell 命令。
 * 安全措施:工作目录限制、超时控制、危险命令黑名单、输出大小限制。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ShellExecTool implements AgentTool {

    private static final long DEFAULT_TIMEOUT = 30;
    private static final int MIN_TIMEOUT = 1;
    private static final long MAX_TIMEOUT = 120;
    private final SandboxExecutor sandboxExecutor;

    private static final Set<String> ALLOWED_COMMANDS = Set.of(
            "git", "mvn", "gradle", "./gradlew", "npm", "pnpm", "yarn",
            "cargo", "go", "python", "python3", "pytest", "make", "ls", "pwd", "cat"
    );
    private static final List<String> BLOCKED_TOKENS = List.of(
            ";", "&&", "||", "|", ">", "<", "`", "$(", "\n", "\r"
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
    public ToolPermissionLevel permissionLevel() {
        return ToolPermissionLevel.EXEC_TEST;
    }

    @Override
    public ToolResult execute(Map<String, Object> args, ToolContext context) {
        String command = (String) args.get("command");
        int timeout = AgentToolArgumentUtils.boundedInt(args.get("timeout"), (int) DEFAULT_TIMEOUT, MIN_TIMEOUT, (int) MAX_TIMEOUT);

        if (context.getProjectRootPath() == null) {
            return ToolResult.fail("项目根目录未设置");
        }

        for (String blocked : BLOCKED_TOKENS) {
            if (command.contains(blocked)) {
                return ToolResult.fail("命令被阻止(安全限制): 不允许 shell 组合符号 '" + blocked + "'");
            }
        }

        List<String> argv = parseSimpleCommand(command);
        if (argv.isEmpty()) {
            return ToolResult.fail("命令不能为空");
        }
        if (!ALLOWED_COMMANDS.contains(argv.get(0))) {
            return ToolResult.fail("命令未在白名单中: " + argv.get(0));
        }

        Path projectRoot = Paths.get(context.getProjectRootPath());
        log.info("Agent 执行命令: dir={}, argv={}", projectRoot, argv);

        try {
            SandboxExecutionResult result = sandboxExecutor.execute(SandboxCommand.builder()
                    .command(argv)
                    .workingDirectory(projectRoot)
                    .timeout(Duration.ofSeconds(timeout))
                    .build());

            StringBuilder sb = new StringBuilder();
            sb.append("Exit code: ").append(result.getExitCode()).append("\n");
            if (result.isTimedOut()) {
                sb.append("Timed out: ").append(timeout).append("s\n");
            }
            if (result.getOutput() != null && !result.getOutput().isEmpty()) {
                sb.append("Output:\n").append(result.getOutput());
            }

            return ToolResult.ok(sb.toString());
        } catch (Exception e) {
            return ToolResult.fail("命令执行失败: " + e.getMessage());
        }
    }

    private List<String> parseSimpleCommand(String command) {
        if (command == null || command.isBlank()) {
            return List.of();
        }
        List<String> parts = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inSingleQuote = false;
        boolean inDoubleQuote = false;
        for (int i = 0; i < command.length(); i++) {
            char ch = command.charAt(i);
            if (ch == '\'' && !inDoubleQuote) {
                inSingleQuote = !inSingleQuote;
                continue;
            }
            if (ch == '"' && !inSingleQuote) {
                inDoubleQuote = !inDoubleQuote;
                continue;
            }
            if (Character.isWhitespace(ch) && !inSingleQuote && !inDoubleQuote) {
                if (!current.isEmpty()) {
                    parts.add(current.toString());
                    current.setLength(0);
                }
                continue;
            }
            current.append(ch);
        }
        if (inSingleQuote || inDoubleQuote) {
            return List.of();
        }
        if (!current.isEmpty()) {
            parts.add(current.toString());
        }
        return parts;
    }
}
