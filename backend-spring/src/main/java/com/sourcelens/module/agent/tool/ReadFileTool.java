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
 * 读取文件内容工具,支持 offset/limit 按行号范围读取。
 */
@Component
public class ReadFileTool implements AgentTool {

    private static final int MAX_OUTPUT_LINES = 500;

    @Override
    public String name() {
        return "read_file";
    }

    @Override
    public String description() {
        return "Read the contents of a file within the project. Returns file content with line numbers. " +
                "Supports offset (start line, 0-based) and limit (max lines to read). " +
                "Use this to inspect code files, configuration files, and source code.";
    }

    @Override
    public Map<String, Object> inputSchema() {
        Map<String, Object> schema = new LinkedHashMap<>();
        schema.put("type", "object");

        Map<String, Object> properties = new LinkedHashMap<>();
        properties.put("path", Map.of("type", "string", "description", "File path relative to project root, e.g. 'src/main/java/App.java'"));
        properties.put("offset", Map.of("type", "integer", "description", "Start line number (0-based). Default 0.", "default", 0));
        properties.put("limit", Map.of("type", "integer", "description", "Max lines to read. Default 200.", "default", 200));
        schema.put("properties", properties);
        schema.put("required", List.of("path"));

        return schema;
    }

    @Override
    public ToolResult execute(Map<String, Object> args, ToolContext context) {
        String relPath = (String) args.get("path");
        int offset = args.containsKey("offset") ? ((Number) args.get("offset")).intValue() : 0;
        int limit = args.containsKey("limit") ? ((Number) args.get("limit")).intValue() : 200;

        if (context.getProjectRootPath() == null) {
            return ToolResult.fail("项目根目录未设置");
        }

        Path filePath = Paths.get(context.getProjectRootPath(), relPath);
        if (!Files.exists(filePath)) {
            return ToolResult.fail("文件不存在: " + relPath);
        }
        if (!filePath.startsWith(context.getProjectRootPath())) {
            return ToolResult.fail("路径越界,不允许访问项目目录外的文件");
        }

        try {
            limit = Math.min(limit, MAX_OUTPUT_LINES);
            List<String> lines = Files.readAllLines(filePath);
            int end = Math.min(offset + limit, lines.size());

            StringBuilder sb = new StringBuilder();
            for (int i = offset; i < end; i++) {
                sb.append(String.format("%4d| %s\n", i + 1, lines.get(i)));
            }
            sb.append("---\n").append("Total lines: ").append(lines.size());
            if (end < lines.size()) {
                sb.append(", showing ").append(offset + 1).append("-").append(end);
            }

            return ToolResult.ok(sb.toString());
        } catch (IOException e) {
            return ToolResult.fail("读取文件失败: " + e.getMessage());
        }
    }
}