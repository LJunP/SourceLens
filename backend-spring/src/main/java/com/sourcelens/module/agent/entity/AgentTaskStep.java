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
@TableName("agent_task_steps")
public class AgentTaskStep {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long taskId;

    private Integer stepOrder;

    /** TOOL_CALL / ANALYSIS / DECISION / OUTPUT */
    private String stepType;

    /** search_code, read_file, analyze_diff 等 */
    private String toolName;

    private String description;

    private String inputJson;

    private String outputJson;

    /** PENDING / RUNNING / COMPLETED / FAILED / SKIPPED */
    private String status;

    private String errorMessage;

    private Long durationMs;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}