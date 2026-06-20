package com.sourcelens.module.analysis.entity;

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
@TableName("code_relations")
public class CodeRelationEntity {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long scanTaskId;

    private String sourceId;

    private String targetId;

    /** EXTENDS / IMPLEMENTS / CALLS / DEPENDS_ON */
    private String relationType;

    private String filePath;

    private Integer lineNumber;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}