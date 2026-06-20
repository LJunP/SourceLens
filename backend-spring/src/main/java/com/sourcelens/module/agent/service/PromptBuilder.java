package com.sourcelens.module.agent.service;

import com.sourcelens.module.agent.entity.Conversation;
import com.sourcelens.module.agent.entity.ConversationMessage;
import com.sourcelens.module.agent.mapper.ConversationMapper;
import com.sourcelens.module.agent.mapper.ConversationMessageMapper;
import com.sourcelens.module.agent.tool.ToolRegistry;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 构建发送给 LLM 的完整 prompt（system + project context + tools + history + user message）。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PromptBuilder {

    private final ConversationMapper conversationMapper;
    private final ConversationMessageMapper messageMapper;
    private final ProjectContextBuilder projectContextBuilder;
    private final ToolRegistry toolRegistry;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String DEFAULT_SYSTEM_PROMPT = """
            你是 SourceLens 架构分析助手。你的职责是帮助用户理解、分析和改进代码项目。
            
            你可以使用工具来：
            - 读取项目文件以理解代码结构
            - 搜索代码以找到特定的符号、模式或实现
            - 列出目录结构以了解项目布局
            - 获取已扫描的代码符号和关系
            - 执行 shell 命令以运行测试、构建或检查
            
            分析原则：
            1. 先阅读关键文件和入口点，建立全局理解
            2. 基于实际代码给出分析，不要猜测
            3. 输出使用结构化的格式，便于用户阅读
            4. 如果需要修改代码，先说明修改理由，再执行
            5. 遵循安全原则，不执行危险命令
            
            当用户请求分析时，按以下步骤进行：
            1. 先了解项目结构（文件树 + 已有扫描结果）
            2. 读取关键文件，理解架构
            3. 给出结构化的分析报告
            """;

    /**
     * 构建 LLM 请求所需的消息列表。
     * 返回 List<Map> 格式，直接传给 LlmClient。
     */
    public List<Map<String, Object>> buildMessages(Long conversationId, String userMessage) {
        Conversation conv = conversationMapper.selectById(conversationId);
        if (conv == null) {
            throw new RuntimeException("对话不存在: " + conversationId);
        }

        List<Map<String, Object>> messages = new ArrayList<>();

        // 1. System message
        String systemPrompt = buildSystemPrompt(conv);
        messages.add(Map.of("role", "system", "content", systemPrompt));

        // 2. 历史消息
        List<ConversationMessage> history = messageMapper.selectList(
                new LambdaQueryWrapper<ConversationMessage>()
                        .eq(ConversationMessage::getConversationId, conversationId)
                        .orderByAsc(ConversationMessage::getCreatedAt));

        for (ConversationMessage msg : history) {
            Map<String, Object> msgMap = new LinkedHashMap<>();
            msgMap.put("role", msg.getRole().toLowerCase());

            if ("ASSISTANT".equals(msg.getRole()) && msg.getToolCallsJson() != null) {
                // assistant 消息可能有 content + tool_calls
                if (msg.getContent() != null && !msg.getContent().isBlank()) {
                    msgMap.put("content", msg.getContent());
                } else {
                    msgMap.put("content", null);
                }
                try {
                    List<Map<String, Object>> toolCalls = objectMapper.readValue(
                            msg.getToolCallsJson(), objectMapper.getTypeFactory()
                                    .constructCollectionType(List.class, Map.class));
                    msgMap.put("tool_calls", toolCalls);
                } catch (Exception e) {
                    log.warn("解析 tool_calls_json 失败: {}", e.getMessage());
                }
            } else if ("TOOL".equals(msg.getRole())) {
                // tool 消息需要 tool_call_id 和 name
                msgMap.put("content", msg.getContent());
                if (msg.getToolCallsJson() != null) {
                    try {
                        // toolCallsJson 是 JSON 数组: [{tool_call_id, name, content}]
                        List<Map<String, Object>> toolInfoList = objectMapper.readValue(
                                msg.getToolCallsJson(), objectMapper.getTypeFactory()
                                        .constructCollectionType(List.class, Map.class));
                        if (!toolInfoList.isEmpty()) {
                            Map<String, Object> firstTool = toolInfoList.get(0);
                            if (firstTool.containsKey("tool_call_id")) {
                                msgMap.put("tool_call_id", firstTool.get("tool_call_id"));
                            }
                            if (firstTool.containsKey("name")) {
                                msgMap.put("name", firstTool.get("name"));
                            }
                        }
                    } catch (Exception e) {
                        log.warn("解析 tool 消息元数据失败: {}", e.getMessage());
                    }
                }
            } else {
                msgMap.put("content", msg.getContent());
            }

            messages.add(msgMap);
        }

        // 3. 当前用户消息
        messages.add(Map.of("role", "user", "content", userMessage));

        return messages;
    }

    /**
     * 构建完整的 system prompt，包含项目上下文。
     */
    private String buildSystemPrompt(Conversation conv) {
        StringBuilder prompt = new StringBuilder();

        // 基础 system prompt (对话可自定义)
        if (conv.getSystemPrompt() != null && !conv.getSystemPrompt().isBlank()) {
            prompt.append(conv.getSystemPrompt());
        } else {
            prompt.append(DEFAULT_SYSTEM_PROMPT);
        }

        // 项目上下文
        String projectContext = projectContextBuilder.buildContext(conv.getProjectId(), null);
        if (!projectContext.isBlank()) {
            prompt.append("\n\n---\n\n");
            prompt.append("# 项目上下文\n\n");
            prompt.append(projectContext);
        }

        // 工具说明
        prompt.append("\n\n---\n\n");
        prompt.append("# 可用工具\n\n");
        prompt.append("你可以通过 JSON 格式的 tool_call 调用以下工具。工具调用格式：\n");
        prompt.append("```json\n{\"tool_calls\": [{\"id\": \"call_1\", \"type\": \"function\", \"function\": {\"name\": \"工具名\", \"arguments\": {参数}}}]}\n```\n\n");
        prompt.append("可用工具：\n");
        for (var tool : toolRegistry.allTools()) {
            prompt.append("- **").append(tool.name()).append("**: ").append(tool.description()).append("\n");
        }

        return prompt.toString();
    }

    /**
     * 获取对话关联的工具 schema 列表，传给 LlmClient 的 tools 参数。
     */
    public List<Map<String, Object>> getToolSchemas() {
        return toolRegistry.buildToolSchemas();
    }
}