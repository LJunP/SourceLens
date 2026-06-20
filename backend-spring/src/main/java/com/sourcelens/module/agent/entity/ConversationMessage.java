package com.sourcelens.module.agent.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("conversation_messages")
public class ConversationMessage {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long conversationId;

    /** USER / ASSISTANT / SYSTEM / TOOL */
    private String role;

    /** 消息文本内容 */
    private String content;

    /** 本轮 LLM 产生的工具调用列表 JSON */
    private String toolCallsJson;

    /** 工具执行结果列表 JSON */
    private String toolResultsJson;

    /** 使用的模型名称 */
    private String modelName;

    /** token 消耗量 */
    private Integer tokensUsed;

    /** 耗时(毫秒) */
    private Long durationMs;

    /** STREAMING / COMPLETED / FAILED */
    private String status;

    private String errorMessage;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}