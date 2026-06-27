package com.sourcelens.module.repository.entity;

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
@TableName("github_webhook_delivery_projects")
public class GitHubWebhookDeliveryProject {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String deliveryId;

    private Long projectId;

    private Long repositoryId;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
