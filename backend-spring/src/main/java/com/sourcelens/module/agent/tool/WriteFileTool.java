package com.sourcelens.module.agent.tool;

import com.sourcelens.module.sandbox.SandboxCommand;
import com.sourcelens.module.sandbox.SandboxExecutor;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.*;
import java.time.Duration;
import java.util.*;

/**
 * 写入/修改文件工具。支持创建新文件和覆写已有文件。
 * 写入前自动创建 git checkpoint commit 以便回滚。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WriteFileTool implements AgentTool {

    private final SandboxExecutor sandboxExecutor;

    @Override
    public String name() {
        return "write_file";
    }

    @Override
    public String description() {
        return "Write content to a file within the project. " +
                "Creates a new file if it does not exist, or overwrites if it does. " +
                "A git backup commit is created before any modification for safety. " +
                "Use this to fix bugs, add features, create files, or apply code changes.";
    }

    @Override
    public Map<String, Object> inputSchema() {
        Map<String, Object> schema = new LinkedHashMap<>();
        schema.put("type", "object");

        Map<String, Object> properties = new LinkedHashMap<>();
        properties.put("path", Map.of(
                "type", "string",
                "description", "File path relative to project root, e.g. 'src/main/java/App.java'"));
        properties.put("content", Map.of(
                "type", "string",
                "description", "The full file content to write"));
        schema.put("properties", properties);
        schema.put("required", List.of("path", "content"));

        return schema;
    }

    @Override
    public ToolPermissionLevel permissionLevel() {
        return ToolPermissionLevel.WRITE_PATCH;
    }

    @Override
    public ToolResult execute(Map<String, Object> args, ToolContext context) {
        String relPath = (String) args.get("path");
        String content = (String) args.get("content");

        if (context.getProjectRootPath() == null) {
            return ToolResult.fail("项目根目录未设置");
        }

        Path rootPath = Path.of(context.getProjectRootPath()).toAbsolutePath().normalize();
        Path filePath = Path.of(context.getProjectRootPath(), relPath).toAbsolutePath().normalize();
        if (!filePath.startsWith(rootPath)) {
            return ToolResult.fail("路径越界,不允许写入项目目录外的文件");
        }

        try {
            // 写入前创建 git checkpoint
            gitCheckpoint(context.getProjectRootPath(), relPath);

            // 确保父目录存在
            Path parent = filePath.getParent();
            if (parent != null) {
                Files.createDirectories(parent);
            }

            Files.writeString(filePath, content);
            log.info("Agent 写入文件: {}", relPath);
            return ToolResult.ok("文件已写入: " + relPath + " (" + content.split("\n").length + " 行)");
        } catch (IOException e) {
            return ToolResult.fail("写入文件失败: " + e.getMessage());
        }
    }

    private void gitCheckpoint(String projectRoot, String filePath) {
        try {
            Path root = Path.of(projectRoot);
            if (!Files.exists(root.resolve(".git"))) return;

            sandboxExecutor.execute(SandboxCommand.builder()
                    .command(List.of("git", "add", filePath))
                    .workingDirectory(root)
                    .timeout(Duration.ofSeconds(15))
                    .build());

            sandboxExecutor.execute(SandboxCommand.builder()
                    .command(List.of("git", "commit", "-m", "agent-checkpoint: before write " + filePath, "--allow-empty"))
                    .workingDirectory(root)
                    .timeout(Duration.ofSeconds(30))
                    .build());
        } catch (Exception e) {
            log.debug("git checkpoint 失败(非致命): {}", e.getMessage());
        }
    }
}
