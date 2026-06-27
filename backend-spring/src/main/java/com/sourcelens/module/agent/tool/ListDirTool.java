package com.sourcelens.module.agent.tool;

import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 列出目录结构工具,支持深度控制。
 */
@Component
public class ListDirTool implements AgentTool {

    private static final int MAX_DEPTH = 4;
    private static final int MAX_ENTRIES = 200;

    @Override
    public String name() {
        return "list_dir";
    }

    @Override
    public String description() {
        return "List files and directories at a given path within the project. " +
                "Returns a tree-like listing with files and subdirectories. " +
                "Use this to understand the project structure.";
    }

    @Override
    public Map<String, Object> inputSchema() {
        Map<String, Object> schema = new LinkedHashMap<>();
        schema.put("type", "object");

        Map<String, Object> properties = new LinkedHashMap<>();
        properties.put("path", Map.of("type", "string", "description", "Directory path relative to project root. Default: project root ('.')."));
        properties.put("depth", Map.of("type", "integer", "description", "Max depth to traverse. Default 3.", "default", 3));
        schema.put("properties", properties);

        return schema;
    }

    @Override
    public ToolResult execute(Map<String, Object> args, ToolContext context) {
        String relPath = args.get("path") != null ? (String) args.get("path") : ".";
        int depth = args.containsKey("depth") ? ((Number) args.get("depth")).intValue() : 3;

        if (context.getProjectRootPath() == null) {
            return ToolResult.fail("项目根目录未设置");
        }

        depth = Math.min(depth, MAX_DEPTH);
        Path rootPath = Paths.get(context.getProjectRootPath()).toAbsolutePath().normalize();
        Path dir = Paths.get(context.getProjectRootPath(), relPath).toAbsolutePath().normalize();
        if (!dir.startsWith(rootPath)) {
            return ToolResult.fail("路径越界,不允许访问项目目录外的目录");
        }
        if (!Files.exists(dir) || !Files.isDirectory(dir)) {
            return ToolResult.fail("目录不存在: " + relPath);
        }

        try {
            StringBuilder sb = new StringBuilder();
            sb.append(relPath).append("/\n");
            listDir(dir, sb, "", 0, depth, new int[]{0});
            return ToolResult.ok(sb.toString());
        } catch (Exception e) {
            return ToolResult.fail("列出目录失败: " + e.getMessage());
        }
    }

    private void listDir(Path dir, StringBuilder sb, String prefix, int currentDepth, int maxDepth, int[] count) {
        if (currentDepth >= maxDepth || count[0] >= MAX_ENTRIES) {
            return;
        }
        try (var entries = Files.list(dir)) {
            List<Path> sorted = entries.sorted((a, b) -> {
                boolean aDir = Files.isDirectory(a);
                boolean bDir = Files.isDirectory(b);
                if (aDir != bDir) return aDir ? -1 : 1;
                return a.getFileName().toString().compareTo(b.getFileName().toString());
            }).collect(Collectors.toList());

            for (int i = 0; i < sorted.size() && count[0] < MAX_ENTRIES; i++) {
                Path entry = sorted.get(i);
                String name = entry.getFileName().toString();

                // 跳过隐藏目录和 node_modules 等
                if (name.startsWith(".") || name.equals("node_modules") || name.equals("target") || name.equals(".git")) {
                    continue;
                }

                count[0]++;
                boolean isDir = Files.isDirectory(entry);
                String connector = (i == sorted.size() - 1) ? "└── " : "├── ";

                sb.append(prefix).append(connector).append(name).append(isDir ? "/\n" : "\n");

                if (isDir) {
                    String childPrefix = prefix + ((i == sorted.size() - 1) ? "    " : "│   ");
                    listDir(entry, sb, childPrefix, currentDepth + 1, maxDepth, count);
                }
            }
        } catch (IOException ignored) {
        }
    }
}