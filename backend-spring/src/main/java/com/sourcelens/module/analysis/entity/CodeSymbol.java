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
@TableName("code_symbols")
public class CodeSymbol {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long scanTaskId;

    /** 符号唯一标识(pkg.ClassName#method) */
    private String symbolId;

    private String name;

    /** CLASS / INTERFACE / ENUM / METHOD / FIELD */
    private String kind;

    @TableField("package")
    private String package_;

    private String filePath;

    private Integer lineNumber;

    private Integer endLine;

    private String returnType;

    private String parentClass;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}