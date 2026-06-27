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
@TableName("execution_logs")
public class ExecutionLog {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long taskId;

    private Long attemptId;

    private String stepKey;

    private String level;

    private String message;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
