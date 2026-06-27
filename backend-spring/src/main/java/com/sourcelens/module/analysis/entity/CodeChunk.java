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
@TableName("code_chunks")
public class CodeChunk {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long scanTaskId;

    private String filePath;

    private String content;

    private Integer startLine;

    private Integer endLine;

    private String contentHash;

    private String embedding;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
