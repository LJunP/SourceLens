package com.sourcelens.module.scantask.entity;

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
@TableName("scan_tasks")
public class ScanTask {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long projectId;

    private Long repositoryId;

    private String branch;

    private String commitSha;

    private String status;

    private String activeLockKey;

    private String triggerType;

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
