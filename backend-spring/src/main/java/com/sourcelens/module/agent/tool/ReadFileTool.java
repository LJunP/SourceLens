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
        int offset = AgentToolArgumentUtils.boundedInt(args.get("offset"), 0, 0, Integer.MAX_VALUE);
        int limit = AgentToolArgumentUtils.boundedInt(args.get("limit"), 200, 1, MAX_OUTPUT_LINES);

        if (context.getProjectRootPath() == null) {
            return ToolResult.fail("项目根目录未设置");
        }

        Path rootPath = Paths.get(context.getProjectRootPath()).toAbsolutePath().normalize();
        Path filePath = Paths.get(context.getProjectRootPath(), relPath).toAbsolutePath().normalize();
        if (!filePath.startsWith(rootPath)) {
            return ToolResult.fail("路径越界,不允许访问项目目录外的文件");
        }
        if (!Files.exists(filePath)) {
            return ToolResult.fail("文件不存在: " + relPath);
        }

        try {
            // 编码容错读取: 替换无法解码的字符为 '?' 而非抛出异常
            java.nio.charset.CharsetDecoder decoder = java.nio.charset.StandardCharsets.UTF_8.newDecoder()
                    .onMalformedInput(java.nio.charset.CodingErrorAction.REPLACE)
                    .onUnmappableCharacter(java.nio.charset.CodingErrorAction.REPLACE);
            byte[] bytes = Files.readAllBytes(filePath);
            java.nio.CharBuffer charBuffer = decoder.decode(java.nio.ByteBuffer.wrap(bytes));
            String content = charBuffer.toString();
            String[] allLines = content.split("\n", -1);

            int totalLines = allLines.length;
            int end = Math.min(offset + limit, totalLines);

            StringBuilder sb = new StringBuilder();
            for (int i = offset; i < end; i++) {
                sb.append(String.format("%4d| %s\n", i + 1, allLines[i]));
            }
            sb.append("---\n").append("Total lines: ").append(totalLines);
            if (end < totalLines) {
                sb.append(", showing ").append(offset + 1).append("-").append(end);
            }

            return ToolResult.ok(sb.toString());
        } catch (IOException e) {
            return ToolResult.fail("读取文件失败: " + e.getMessage());
        }
    }

}
