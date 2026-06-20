package com.sourcelens.module.agent.tool;

import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.concurrent.TimeUnit;

/**
 * 在项目目录中搜索代码内容,使用 grep 命令。
 */
@Component
public class SearchCodeTool implements AgentTool {

    private static final int MAX_MATCH_LINES = 100;
    private static final long TIMEOUT_SECONDS = 15;

    @Override
    public String name() {
        return "search_code";
    }

    @Override
    public String description() {
        return "Search for a pattern (regex) across files in the project. " +
                "Returns matching file paths and line numbers. Useful for finding definitions, usages, and references.";
    }

    @Override
    public Map<String, Object> inputSchema() {
        Map<String, Object> schema = new LinkedHashMap<>();
        schema.put("type", "object");

        Map<String, Object> properties = new LinkedHashMap<>();
        properties.put("pattern", Map.of("type", "string", "description", "Search pattern (regex), e.g. 'class OrderService'"));
        properties.put("file_pattern", Map.of("type", "string", "description", "File glob to filter, e.g. '*.java'. Default: all files."));
        properties.put("max_results", Map.of("type", "integer", "description", "Max results to return. Default 50.", "default", 50));
        schema.put("properties", properties);
        schema.put("required", List.of("pattern"));

        return schema;
    }

    @Override
    public ToolResult execute(Map<String, Object> args, ToolContext context) {
        String pattern = (String) args.get("pattern");
        String filePattern = args.get("file_pattern") != null ? (String) args.get("file_pattern") : null;
        int maxResults = args.containsKey("max_results") ? ((Number) args.get("max_results")).intValue() : 50;

        if (context.getProjectRootPath() == null) {
            return ToolResult.fail("项目根目录未设置");
        }

        try {
            List<String> cmd = new ArrayList<>(List.of("grep", "-rn", "--include=.", "-E", pattern));

            if (filePattern != null) {
                cmd = new ArrayList<>(List.of("grep", "-rn", "--include=" + filePattern, "-E", pattern));
            }

            Path projectRoot = Paths.get(context.getProjectRootPath());
            String[] cmdArray = cmd.toArray(new String[0]);

            ProcessBuilder pb = new ProcessBuilder(cmdArray);
            pb.directory(projectRoot.toFile());
            pb.redirectErrorStream(true);
            Process process = pb.start();

            List<String> results = new ArrayList<>();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                int count = 0;
                while ((line = reader.readLine()) != null && count < MAX_MATCH_LINES) {
                    results.add(line);
                    count++;
                }
            }

            process.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS);
            if (process.isAlive()) {
                process.destroyForcibly();
            }

            if (results.isEmpty()) {
                return ToolResult.ok("未找到匹配结果, pattern: " + pattern);
            }

            StringBuilder sb = new StringBuilder();
            sb.append("找到 ").append(Math.min(results.size(), maxResults)).append(" 条匹配:\n\n");
            for (int i = 0; i < Math.min(results.size(), maxResults); i++) {
                sb.append(results.get(i)).append("\n");
            }

            return ToolResult.ok(sb.toString());
        } catch (Exception e) {
            return ToolResult.fail("搜索代码失败: " + e.getMessage());
        }
    }
}