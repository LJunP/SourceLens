package com.sourcelens.module.agent.tool;

import java.util.Map;

/**
 * Agent 工具接口。每个工具实现此接口,通过 ToolRegistry 注册后可被 LLM 调用。
 */
public interface AgentTool {

    /** 工具名称,LLM 通过此名称发起调用 */
    String name();

    /** 工具描述,注入到 system prompt 供 LLM 理解工具用途 */
    String description();

    /** 工具参数的 JSON Schema,描述入参结构 */
    Map<String, Object> inputSchema();

    /** 执行工具,传入 LLM 解析后的参数 JSON,返回执行结果 */
    ToolResult execute(Map<String, Object> args, ToolContext context);
}