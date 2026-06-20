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
@TableName("scan_artifacts")
public class ScanArtifact {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long scanTaskId;

    /** ARCHITECTURE_OVERVIEW / DEPENDENCY_GRAPH / API_CATALOG / DB_SCHEMA / CODE_METRICS / RISK_REPORT */
    private String artifactType;

    private String storagePath;

    /** JSON 格式的分析摘要 */
    private String summaryJson;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}