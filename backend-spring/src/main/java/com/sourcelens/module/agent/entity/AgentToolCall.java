package com.sourcelens.module.agent.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("agent_tool_calls")
public class AgentToolCall {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long conversationId;

    private Long projectId;

    private Long scanTaskId;

    private String toolName;

    private String permissionLevel;

    private String argumentsJson;

    private String resultSummary;

    private Boolean success;

    private String errorMessage;

    private Long durationMs;

    private Long createdBy;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
