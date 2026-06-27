package com.sourcelens.module.execution.entity;

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
@TableName("execution_tasks")
public class ExecutionTask {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long projectId;

    private Long repositoryId;

    private String taskType;

    private String sourceType;

    private Long sourceId;

    private String status;

    private String currentStep;

    private Long currentAttemptId;

    private Integer progress;

    private String errorMessage;

    private Long createdBy;

    private LocalDateTime startedAt;

    private LocalDateTime finishedAt;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
