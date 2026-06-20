package com.sourcelens.module.repository.entity;

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
@TableName("repositories")
public class Repository {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long projectId;

    private String provider;

    private String owner;

    private String name;

    private String url;

    private String defaultBranch;

    private String visibility;

    private String authType;

    private String encryptedTokenRef;

    private LocalDateTime lastSyncedAt;

    private String status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    @TableLogic
    private Boolean deleted;
}