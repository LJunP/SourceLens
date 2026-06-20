package com.sourcelens.module.issue.entity;

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
@TableName("issue_tasks")
public class IssueTask {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long decompositionId;

    private Integer taskOrder;

    /** DEVELOP / TEST */
    private String category;

    private String title;

    private String description;

    private String impactFiles;

    private String riskLevel;

    private String testSuggestions;

    private Double estimatedHours;

    private String status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}