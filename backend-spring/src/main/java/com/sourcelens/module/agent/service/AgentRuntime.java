package com.sourcelens.module.agent.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sourcelens.module.agent.entity.AgentTask;
import com.sourcelens.module.agent.entity.Conversation;
import com.sourcelens.module.agent.entity.ConversationMessage;
import com.sourcelens.module.agent.mapper.AgentTaskMapper;
import com.sourcelens.module.agent.entity.LlmConfig;
import com.sourcelens.module.agent.mapper.ConversationMapper;
import com.sourcelens.module.agent.mapper.ConversationMessageMapper;
import com.sourcelens.module.agent.tool.ToolContext;
import com.sourcelens.module.agent.tool.ToolResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.Executor;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Agent 核心循环引擎。
 * 负责：构建 prompt → 调用 LLM → 解析 tool_call → 执行工具 → 持久化消息 → SSE 推送。
 */
@Slf4j
@Service
public class AgentRuntime {

    private final LlmClient llmClient;
    private final PromptBuilder promptBuilder;
    private final ToolExecutionService toolExecutionService;
    private final ConversationMapper conversationMapper;
    private final ConversationMessageMapper messageMapper;
    private final AgentTaskMapper agentTaskMapper;
    private final LlmConfigService llmConfigService;
    private final ProjectContextBuilder projectContextBuilder;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Executor agentExecutor;

    private static final int MAX_TOOL_ROUNDS = 10;

    public AgentRuntime(LlmClient llmClient,
                        PromptBuilder promptBuilder,
                        ToolExecutionService toolExecutionService,
                        ConversationMapper conversationMapper,
                        ConversationMessageMapper messageMapper,
                        AgentTaskMapper agentTaskMapper,
                        LlmConfigService llmConfigService,
                        ProjectContextBuilder projectContextBuilder,
                        @org.springframework.beans.factory.annotation.Qualifier("agentExecutor") Executor agentExecutor) {
        this.llmClient = llmClient;
        this.promptBuilder = promptBuilder;
        this.toolExecutionService = toolExecutionService;
        this.conversationMapper = conversationMapper;
        this.messageMapper = messageMapper;
        this.agentTaskMapper = agentTaskMapper;
        this.llmConfigService = llmConfigService;
        this.projectContextBuilder = projectContextBuilder;
        this.agentExecutor = agentExecutor;
    }

    /**
     * 发送消息并启动 Agent 循环，通过 SseEmitter 推送事件。
     * 调用线程安全，会在 agentExecutor 上异步执行。
     */
    public void chatAsync(Long conversationId, String userMessage, Long userId, SseEmitter emitter) {
        final AtomicBoolean completed = new AtomicBoolean(false);

        emitter.onCompletion(() -> {
            log.info("SSE emitter completion 触发, convId={}", conversationId);
            completed.set(true);
        });
        emitter.onTimeout(() -> {
            log.info("SSE emitter timeout 触发, convId={}", conversationId);
            completed.set(true);
        });
        emitter.onError((ex) -> {
            log.warn("SSE emitter 发生错误, convId={}, error={}", conversationId, ex.getMessage());
            completed.set(true);
        });

        agentExecutor.execute(() -> {
            try {
                chatLoop(conversationId, userMessage, userId, emitter, completed);
            } catch (Exception e) {
                log.error("Agent 循环异常: convId={}", conversationId, e);
                sendSseEvent(emitter, "error", Map.of("error", e.getMessage()), completed);
                completeEmitter(emitter, completed);
            }
        });
    }

    /**
     * 核心 Agent 循环。同步执行，内部推送 SSE 事件。
     */
    @SuppressWarnings("unchecked")
    private void chatLoop(Long conversationId, String userMessage, Long userId, SseEmitter emitter, AtomicBoolean completed) {
        Conversation conv = conversationMapper.selectById(conversationId);
        if (conv == null) {
            sendSseEvent(emitter, "error", Map.of("error", "对话不存在"), completed);
            completeEmitter(emitter, completed);
            return;
        }

        // 1. 持久化用户消息
        saveMessage(conversationId, "USER", userMessage, null, null, null, "COMPLETED");

        // 如果对话标题为空，自动截取首条消息作为标题
        if (conv.getTitle() == null || conv.getTitle().isBlank()) {
            String title = userMessage.length() > 50
                    ? userMessage.substring(0, 50) + "..." : userMessage;
            conv.setTitle(title);
            conversationMapper.updateById(conv);
        }

        // 2. 获取 LLM 配置
        LlmConfig llmConfig = llmConfigService.getActiveConfig(userId);
        if (llmConfig == null) {
            sendSseEvent(emitter, "error", Map.of("error", "未配置 LLM，请先在设置中添加并激活一个 LLM 配置"), completed);
            completeEmitter(emitter, completed);
            return;
        }

        // 3. 构建 ToolContext
        String repoPath = projectContextBuilder.resolveLocalRepoPath(conv.getProjectId());
        Long scanTaskId = resolveConversationScanTaskId(conv);
        ToolContext toolContext = ToolContext.builder()
                .projectRootPath(repoPath)
                .projectId(conv.getProjectId())
                .scanTaskId(scanTaskId)
                .conversationId(conversationId)
                .userId(userId)
                .build();

        // 4. 构建初始消息列表
        List<Map<String, Object>> messages = promptBuilder.buildMessages(conversationId, userMessage);
        List<Map<String, Object>> toolSchemas = promptBuilder.getToolSchemas();

        // 5. Agent 循环
        for (int round = 0; round < MAX_TOOL_ROUNDS; round++) {
            if (completed.get()) {
                log.info("检测到前端连接已关闭或任务已完成，提前退出 Agent 循环, convId={}", conversationId);
                break;
            }
            log.info("Agent 循环 round={}, convId={}", round + 1, conversationId);
            sendSseEvent(emitter, "thinking", Map.of("round", round + 1), completed);

            long startTime = System.currentTimeMillis();

            // 调用 LLM
            LlmClient.LlmStreamResult llmResult;
            try {
                if (completed.get()) {
                    log.info("调用 LLM 前检测到前端连接已关闭，提前退出 Agent 循环, convId={}", conversationId);
                    break;
                }
                llmResult = llmClient.chatWithTools(llmConfig, messages, toolSchemas);
                if (completed.get()) {
                    log.info("调用 LLM 后检测到前端连接已关闭，提前退出 Agent 循环, convId={}", conversationId);
                    break;
                }
            } catch (Exception e) {
                log.error("LLM 调用失败: {}", e.getMessage(), e);
                saveMessage(conversationId, "ASSISTANT", "LLM 调用失败: " + e.getMessage(),
                        null, null, null, "FAILED");
                sendSseEvent(emitter, "error", Map.of("error", "LLM 调用失败: " + e.getMessage()), completed);
                break;
            }

            long durationMs = System.currentTimeMillis() - startTime;

            // 如果有文本内容，推送给前端
            if (llmResult.getContent() != null && !llmResult.getContent().isBlank()) {
                sendSseEvent(emitter, "content", Map.of("content", llmResult.getContent()), completed);
            }

            // 没有 tool_calls → 纯文本回复，结束循环
            if (!llmResult.hasToolCalls()) {
                String content = llmResult.getContent() != null ? llmResult.getContent() : "";
                saveMessage(conversationId, "ASSISTANT", content, null, null,
                        llmResult.getTokensUsed(), "COMPLETED");
                sendSseEvent(emitter, "done", Map.of(
                        "tokensUsed", llmResult.getTokensUsed(),
                        "durationMs", durationMs), completed);
                break;
            }

            // 有 tool_calls → 执行工具
            // 保存 assistant 消息（含 tool_calls）
            String toolCallsJson;
            try {
                toolCallsJson = objectMapper.writeValueAsString(llmResult.getToolCalls());
            } catch (Exception e) {
                toolCallsJson = "[]";
            }
            saveMessage(conversationId, "ASSISTANT", llmResult.getContent(),
                    toolCallsJson, null, llmResult.getTokensUsed(), "COMPLETED");

            // 将 assistant 完整响应加入 messages
            Map<String, Object> assistantMsg = new LinkedHashMap<>();
            assistantMsg.put("role", "assistant");
            if (llmResult.getContent() != null && !llmResult.getContent().isBlank()) {
                assistantMsg.put("content", llmResult.getContent());
            } else {
                assistantMsg.put("content", null);
            }
            assistantMsg.put("tool_calls", llmResult.getToolCalls());
            messages.add(assistantMsg);

            // 执行每个 tool_call
            List<Map<String, Object>> toolResults = new ArrayList<>();
            for (Map<String, Object> toolCall : llmResult.getToolCalls()) {
                if (completed.get()) {
                    log.info("执行工具前检测到前端连接已关闭，中止后续工具调用, convId={}", conversationId);
                    break;
                }
                String toolCallId = (String) toolCall.get("id");
                Map<String, Object> function = (Map<String, Object>) toolCall.get("function");
                String toolName = (String) function.get("name");
                Map<String, Object> args = (Map<String, Object>) function.get("arguments");

                log.info("执行工具: tool={}, id={}", toolName, toolCallId);
                sendSseEvent(emitter, "tool_call", Map.of(
                        "id", toolCallId,
                        "name", toolName,
                        "arguments", args), completed);

                // 执行工具
                ToolResult result = toolExecutionService.execute(toolName, args, toolContext);

                Map<String, Object> toolResult = new LinkedHashMap<>();
                toolResult.put("tool_call_id", toolCallId);
                toolResult.put("name", toolName);
                toolResult.put("content", result.isSuccess() ? result.getContent() : "Error: " + result.getError());
                toolResults.add(toolResult);

                // 推送工具结果
                sendSseEvent(emitter, "tool_result", Map.of(
                        "id", toolCallId,
                        "name", toolName,
                        "success", result.isSuccess(),
                        "content", result.isSuccess() ? truncate(result.getContent(), 2000) : result.getError()), completed);

                // 将 tool 结果加入 messages
                Map<String, Object> toolMsg = new LinkedHashMap<>();
                toolMsg.put("role", "tool");
                toolMsg.put("tool_call_id", toolCallId);
                toolMsg.put("name", toolName);
                String toolContent = result.isSuccess() ? result.getContent() : "Error: " + result.getError();
                toolMsg.put("content", PromptInjectionGuard.wrapUntrustedContent("tool result: " + toolName, toolContent));
                messages.add(toolMsg);
            }

            // 持久化 tool 消息
            String toolResultsJson;
            try {
                toolResultsJson = objectMapper.writeValueAsString(toolResults);
            } catch (Exception e) {
                toolResultsJson = "[]";
            }
            saveToolMessage(conversationId, toolResultsJson);

            // 继续下一轮循环，让 LLM 根据工具结果继续推理
        }

        // 循环结束
        completeEmitter(emitter, completed);
    }

    /**
     * 持久化消息。
     */
    private void saveMessage(Long conversationId, String role, String content,
                             String toolCallsJson, String toolResultsJson,
                             Integer tokensUsed, String status) {
        ConversationMessage msg = ConversationMessage.builder()
                .conversationId(conversationId)
                .role(role)
                .content(content)
                .toolCallsJson(toolCallsJson)
                .toolResultsJson(toolResultsJson)
                .tokensUsed(tokensUsed)
                .status(status)
                .build();
        messageMapper.insert(msg);
    }

    private Long resolveConversationScanTaskId(Conversation conv) {
        if (conv.getAgentTaskId() == null) {
            return null;
        }
        AgentTask task = agentTaskMapper.selectById(conv.getAgentTaskId());
        return task == null ? null : task.getScanTaskId();
    }

    /**
     * 持久化 tool 消息（role=TOOL）。
     */
    private void saveToolMessage(Long conversationId, String toolResultsJson) {
        ConversationMessage msg = ConversationMessage.builder()
                .conversationId(conversationId)
                .role("TOOL")
                .content(null)
                .toolResultsJson(toolResultsJson)
                .status("COMPLETED")
                .build();
        messageMapper.insert(msg);
    }

    /**
     * 推送 SSE 事件（加 completed 状态保护，防止 emitter 关闭后继续发送）。
     */
    private void sendSseEvent(SseEmitter emitter, String eventName, Map<String, Object> data, AtomicBoolean completed) {
        if (completed.get()) return;
        try {
            emitter.send(SseEmitter.event()
                    .name(eventName)
                    .data(objectMapper.writeValueAsString(data)));
        } catch (IOException e) {
            log.warn("SSE 推送失败: event={}, error={}, 将中止 Agent 循环", eventName, e.getMessage());
            completed.set(true);
        }
    }

    /**
     * 安全关闭 emitter（防止重复 complete 抛出 IllegalStateException）。
     */
    private void completeEmitter(SseEmitter emitter, AtomicBoolean completed) {
        if (completed.compareAndSet(false, true)) {
            try {
                emitter.complete();
            } catch (Exception e) {
                log.warn("SSE emitter complete 失败: {}", e.getMessage());
            }
        }
    }

    private String truncate(String s, int maxLen) {
        if (s == null) return "";
        return s.length() > maxLen ? s.substring(0, maxLen) + "..." : s;
    }
}
