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
@TableName("agent_tasks")
public class AgentTask {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long scanTaskId;

    /** 关联的对话 ID */
    private Long conversationId;

    private Long projectId;

    /** ARCHITECTURE_REVIEW / RISK_SCAN / CHANGE_IMPACT / CUSTOM */
    private String taskType;

    private String title;

    private String description;

    /** PENDING / RUNNING / COMPLETED / FAILED / CANCELLED */
    private String status;

    /** HIGH / MEDIUM / LOW */
    private String priority;

    private String inputJson;

    private String outputJson;

    private String summary;

    private LocalDateTime startedAt;

    private LocalDateTime finishedAt;

    private String errorMessage;

    private Long createdBy;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    @TableLogic
    private Boolean deleted;
}