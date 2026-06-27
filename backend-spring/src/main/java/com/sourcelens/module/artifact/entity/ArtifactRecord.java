package com.sourcelens.module.artifact.entity;

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
@TableName("artifact_records")
public class ArtifactRecord {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long projectId;

    private Long repositoryId;

    private String ownerType;

    private Long ownerId;

    private String artifactType;

    private String storagePath;

    private String contentType;

    private Long sizeBytes;

    private String checksumSha256;

    private String metadataJson;

    private Long createdBy;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
