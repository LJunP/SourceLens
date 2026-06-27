package com.sourcelens.module.agent.tool;

import com.sourcelens.module.sandbox.SandboxCommand;
import com.sourcelens.module.sandbox.SandboxExecutionResult;
import com.sourcelens.module.sandbox.SandboxExecutor;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.*;

/**
 * 在项目目录中搜索代码内容,使用 grep 命令。
 */
@Component
@RequiredArgsConstructor
public class SearchCodeTool implements AgentTool {

    private static final int MAX_MATCH_LINES = 100;
    private static final long TIMEOUT_SECONDS = 15;
    private final SandboxExecutor sandboxExecutor;

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
        int maxResults = AgentToolArgumentUtils.boundedInt(args.get("max_results"), 50, 1, MAX_MATCH_LINES);

        if (context.getProjectRootPath() == null) {
            return ToolResult.fail("项目根目录未设置");
        }

        try {
            // 构建 grep 命令: 不指定 file_pattern 时搜索所有文件，并排除大型第三方库与构建输出目录以优化性能与结果纯度
            List<String> cmd = new ArrayList<>();
            cmd.add("grep");
            cmd.add("-rn");
            cmd.add("--exclude-dir=node_modules");
            cmd.add("--exclude-dir=target");
            cmd.add("--exclude-dir=.git");
            cmd.add("--exclude-dir=.idea");
            cmd.add("--exclude-dir=build");
            cmd.add("--exclude-dir=dist");
            if (filePattern != null && !filePattern.isBlank()) {
                cmd.add("--include=" + filePattern);
            }
            cmd.add("-E");
            cmd.add(pattern);
            cmd.add(".");

            Path projectRoot = Paths.get(context.getProjectRootPath());

            SandboxExecutionResult result = sandboxExecutor.execute(SandboxCommand.builder()
                    .command(cmd)
                    .workingDirectory(projectRoot)
                    .timeout(Duration.ofSeconds(TIMEOUT_SECONDS))
                    .build());
            if (result.isTimedOut()) {
                return ToolResult.fail("搜索代码超时");
            }

            // 统一限流: 实际读取数量 = maxResults（用户指定, 上限 MAX_MATCH_LINES）
            List<String> results = Arrays.stream(result.getOutput().split("\\R"))
                    .filter(line -> !line.isBlank())
                    .limit(maxResults)
                    .toList();

            if (results.isEmpty()) {
                return ToolResult.ok("未找到匹配结果, pattern: " + pattern);
            }

            StringBuilder sb = new StringBuilder();
            sb.append("找到 ").append(results.size()).append(" 条匹配:\n\n");
            for (String line : results) {
                sb.append(line).append("\n");
            }

            return ToolResult.ok(sb.toString());
        } catch (Exception e) {
            return ToolResult.fail("搜索代码失败: " + e.getMessage());
        }
    }

}
