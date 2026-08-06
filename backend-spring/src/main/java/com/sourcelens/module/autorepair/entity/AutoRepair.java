package com.sourcelens.module.autorepair.entity;

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
@TableName("auto_repairs")
public class AutoRepair {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long projectId;

    private Long repositoryId;

    private Long scanTaskId;

    private String filePath;

    private String targetDesc;

    private String status;

    private String activeLockKey;

    private String branchName;

    private String diffContent;

    private String patchArtifactPath;

    private String testLog;

    private String prUrl;

    private String errorMessage;

    private Long createdBy;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
