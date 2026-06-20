package com.sourcelens.module.agent.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sourcelens.common.PageResult;
import com.sourcelens.common.Result;
import com.sourcelens.module.agent.entity.Conversation;
import com.sourcelens.module.agent.entity.ConversationMessage;
import com.sourcelens.module.agent.mapper.ConversationMapper;
import com.sourcelens.module.agent.mapper.ConversationMessageMapper;
import com.sourcelens.module.agent.service.AgentRuntime;
import com.sourcelens.module.project.service.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;

@Tag(name = "Agent 对话")
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AgentChatController {

    private final ConversationMapper conversationMapper;
    private final ConversationMessageMapper messageMapper;
    private final AgentRuntime agentRuntime;
    private final ProjectService projectService;

    @Operation(summary = "创建对话")
    @PostMapping("/projects/{projectId}/conversations")
    public Result<Conversation> createConversation(
            @PathVariable Long projectId,
            @RequestBody(required = false) CreateConversationRequest req,
            @RequestAttribute("userId") Long userId) {
        projectService.verifyOwnership(projectId, userId);

        Conversation conv = Conversation.builder()
                .projectId(projectId)
                .title(req != null && req.getTitle() != null ? req.getTitle() : "新对话")
                .systemPrompt(req != null ? req.getSystemPrompt() : null)
                .status("ACTIVE")
                .createdBy(userId)
                .build();
        conversationMapper.insert(conv);
        return Result.ok(conv);
    }

    @Operation(summary = "对话列表")
    @GetMapping("/projects/{projectId}/conversations")
    public Result<PageResult<Conversation>> listConversations(
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestAttribute("userId") Long userId) {
        projectService.verifyOwnership(projectId, userId);

        Page<Conversation> records = conversationMapper.selectPage(
                new Page<>(page, pageSize),
                new LambdaQueryWrapper<Conversation>()
                        .eq(Conversation::getProjectId, projectId)
                        .eq(Conversation::getCreatedBy, userId)
                        .orderByDesc(Conversation::getUpdatedAt));

        return Result.ok(PageResult.of(records.getRecords(), page, pageSize, records.getTotal()));
    }

    @Operation(summary = "对话详情 + 消息历史")
    @GetMapping("/conversations/{id}")
    public Result<ConversationDetail> getConversation(
            @PathVariable Long id,
            @RequestAttribute("userId") Long userId) {
        Conversation conv = conversationMapper.selectById(id);
        if (conv == null) {
            return Result.fail("NOT_FOUND", "对话不存在");
        }
        projectService.verifyOwnership(conv.getProjectId(), userId);

        List<ConversationMessage> messages = messageMapper.selectList(
                new LambdaQueryWrapper<ConversationMessage>()
                        .eq(ConversationMessage::getConversationId, id)
                        .orderByAsc(ConversationMessage::getCreatedAt));

        ConversationDetail detail = new ConversationDetail();
        detail.setConversation(conv);
        detail.setMessages(messages);
        return Result.ok(detail);
    }

    @Operation(summary = "发送消息,返回 SSE 流")
    @PostMapping(value = "/conversations/{id}/messages", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter sendMessage(
            @PathVariable Long id,
            @RequestBody SendMessageRequest req,
            @RequestAttribute("userId") Long userId) {
        Conversation conv = conversationMapper.selectById(id);
        if (conv == null) {
            SseEmitter emitter = new SseEmitter(5000L);
            emitter.completeWithError(new RuntimeException("对话不存在"));
            return emitter;
        }
        projectService.verifyOwnership(conv.getProjectId(), userId);

        // SSE 超时设为 5 分钟（Agent 循环可能需要较长时间）
        SseEmitter emitter = new SseEmitter(300_000L);

        emitter.onTimeout(emitter::complete);
        emitter.onError(e -> emitter.complete());

        agentRuntime.chatAsync(id, req.getMessage(), userId, emitter);
        return emitter;
    }

    @Operation(summary = "删除对话")
    @DeleteMapping("/conversations/{id}")
    public Result<Void> deleteConversation(
            @PathVariable Long id,
            @RequestAttribute("userId") Long userId) {
        Conversation conv = conversationMapper.selectById(id);
        if (conv == null) {
            return Result.fail("NOT_FOUND", "对话不存在");
        }
        projectService.verifyOwnership(conv.getProjectId(), userId);

        // 删除消息
        messageMapper.delete(new LambdaQueryWrapper<ConversationMessage>()
                .eq(ConversationMessage::getConversationId, id));
        // 删除对话
        conversationMapper.deleteById(id);
        return Result.ok();
    }

    // ===== DTO =====

    @Data
    public static class CreateConversationRequest {
        private String title;
        private String systemPrompt;
    }

    @Data
    public static class SendMessageRequest {
        private String message;
    }

    @Data
    public static class ConversationDetail {
        private Conversation conversation;
        private List<ConversationMessage> messages;
    }
}