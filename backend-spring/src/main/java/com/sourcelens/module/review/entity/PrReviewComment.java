package com.sourcelens.module.review.entity;

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
@TableName("pr_review_comments")
public class PrReviewComment {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long reviewId;

    private String filePath;

    private Integer lineNumber;

    /** INFO / WARNING / ERROR / CRITICAL */
    private String severity;

    /** SECURITY / PERFORMANCE / CORRECTNESS / STYLE / TEST / COMPATIBILITY */
    private String category;

    private String message;

    private String suggestion;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}