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
@TableName("conversations")
public class Conversation {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long projectId;

    /** 关联的 Agent 任务(可选) */
    private Long agentTaskId;

    /** 对话标题,首条消息自动截取 */
    private String title;

    /** 系统提示词 */
    private String systemPrompt;

    /** ACTIVE / ARCHIVED */
    private String status;

    private Long createdBy;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}