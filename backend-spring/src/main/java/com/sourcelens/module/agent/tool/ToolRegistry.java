package com.sourcelens.module.agent.tool;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Component
public class ToolRegistry {

    private final Map<String, AgentTool> tools = new LinkedHashMap<>();
    private final boolean writePatchEnabled;
    private final boolean execTestEnabled;
    private final boolean createPrEnabled;

    public ToolRegistry(List<AgentTool> toolList,
                        @Value("${sourcelens.agent.tools.write-patch-enabled:false}") boolean writePatchEnabled,
                        @Value("${sourcelens.agent.tools.exec-test-enabled:false}") boolean execTestEnabled,
                        @Value("${sourcelens.agent.tools.create-pr-enabled:false}") boolean createPrEnabled) {
        this.writePatchEnabled = writePatchEnabled;
        this.execTestEnabled = execTestEnabled;
        this.createPrEnabled = createPrEnabled;
        for (AgentTool tool : toolList) {
            tools.put(tool.name(), tool);
            log.info("注册 Agent 工具: {}, level={}, enabled={}", tool.name(), tool.permissionLevel(), isEnabled(tool));
        }
    }

    public AgentTool getTool(String name) {
        return tools.get(name);
    }

    public Collection<AgentTool> allTools() {
        return tools.values();
    }

    /**
     * 生成所有工具的 JSON Schema 列表,注入到 LLM function calling 请求中。
     */
    public List<Map<String, Object>> buildToolSchemas() {
        return tools.values().stream().map(tool -> {
            if (!isEnabled(tool)) {
                return null;
            }
            Map<String, Object> schema = new LinkedHashMap<>();
            schema.put("type", "function");
            Map<String, Object> function = new LinkedHashMap<>();
            function.put("name", tool.name());
            function.put("description", tool.description());
            function.put("parameters", tool.inputSchema());
            schema.put("function", function);
            return schema;
        }).filter(Objects::nonNull).collect(Collectors.toList());
    }

    /**
     * 按名查找并执行工具。
     */
    public ToolResult invoke(String toolName, Map<String, Object> args, ToolContext context) {
        AgentTool tool = tools.get(toolName);
        if (tool == null) {
            return ToolResult.fail("工具不存在: " + toolName);
        }
        if (!isEnabled(tool)) {
            return ToolResult.fail("工具未启用: " + toolName + " (" + tool.permissionLevel() + ")");
        }
        try {
            return tool.execute(args, context);
        } catch (Exception e) {
            log.error("工具执行异常: tool={}, error={}", toolName, e.getMessage(), e);
            return ToolResult.fail("工具执行异常: " + e.getMessage());
        }
    }

    public boolean isEnabled(String toolName) {
        AgentTool tool = tools.get(toolName);
        return tool != null && isEnabled(tool);
    }

    private boolean isEnabled(AgentTool tool) {
        return switch (tool.permissionLevel()) {
            case READ_ONLY -> true;
            case WRITE_PATCH -> writePatchEnabled;
            case EXEC_TEST -> execTestEnabled;
            case CREATE_PR -> createPrEnabled;
        };
    }
}
