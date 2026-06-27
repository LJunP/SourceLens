package com.sourcelens.module.repository.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sourcelens.common.exception.BizException;
import com.sourcelens.module.repository.entity.GitHubWebhookDelivery;
import com.sourcelens.module.repository.entity.GitHubWebhookDeliveryProject;
import com.sourcelens.module.repository.entity.Repository;
import com.sourcelens.module.repository.mapper.GitHubWebhookDeliveryMapper;
import com.sourcelens.module.repository.mapper.GitHubWebhookDeliveryProjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class GitHubWebhookDeliveryService extends ServiceImpl<GitHubWebhookDeliveryMapper, GitHubWebhookDelivery> {

    private final ObjectMapper objectMapper;
    private final GitHubWebhookDeliveryProjectMapper deliveryProjectMapper;

    @Value("${sourcelens.github-app.webhook-delivery-cleanup-enabled:false}")
    private boolean cleanupEnabled;

    @Value("${sourcelens.github-app.webhook-delivery-retention-days:30}")
    private int retentionDays;

    @Value("${sourcelens.github-app.webhook-delivery-cleanup-batch-size:500}")
    private int cleanupBatchSize;

    @Scheduled(cron = "${sourcelens.github-app.webhook-delivery-cleanup-cron:0 45 3 * * *}")
    public void scheduledCleanup() {
        if (!cleanupEnabled) {
            return;
        }
        int deleted = cleanupExpired();
        if (deleted > 0) {
            log.info("GitHub webhook delivery 过期清理完成, deleted={}, retentionDays={}, batchSize={}",
                    deleted, retentionDays, cleanupBatchSize);
        }
    }

    public boolean claimProcessing(String deliveryId, String eventType) {
        if (!StringUtils.hasText(deliveryId)) {
            throw BizException.badRequest("GitHub webhook delivery id 不能为空");
        }
        try {
            return save(GitHubWebhookDelivery.builder()
                    .deliveryId(deliveryId)
                    .eventType(eventType)
                    .status("PROCESSING")
                    .build());
        } catch (DuplicateKeyException e) {
            return false;
        } catch (Exception e) {
            throw BizException.internal("GitHub webhook delivery claim 失败: " + e.getMessage());
        }
    }

    public Page<GitHubWebhookDelivery> listByProject(Long projectId,
                                                     int page,
                                                     int pageSize,
                                                     String eventType,
                                                     String status) {
        int safePage = Math.max(page, 1);
        int safePageSize = Math.min(Math.max(pageSize, 1), 100);
        List<String> deliveryIds = deliveryProjectMapper.selectList(new QueryWrapper<GitHubWebhookDeliveryProject>()
                        .select("delivery_id")
                        .eq("project_id", projectId))
                .stream()
                .map(GitHubWebhookDeliveryProject::getDeliveryId)
                .filter(StringUtils::hasText)
                .distinct()
                .toList();
        if (deliveryIds.isEmpty()) {
            return new Page<>(safePage, safePageSize, 0);
        }
        LambdaQueryWrapper<GitHubWebhookDelivery> wrapper = new LambdaQueryWrapper<GitHubWebhookDelivery>()
                .in(GitHubWebhookDelivery::getDeliveryId, deliveryIds)
                .orderByDesc(GitHubWebhookDelivery::getCreatedAt)
                .orderByDesc(GitHubWebhookDelivery::getId);
        if (StringUtils.hasText(eventType)) {
            wrapper.eq(GitHubWebhookDelivery::getEventType, eventType.trim());
        }
        if (StringUtils.hasText(status)) {
            wrapper.eq(GitHubWebhookDelivery::getStatus, status.trim());
        }
        return page(new Page<>(safePage, safePageSize), wrapper);
    }

    public void markProcessed(String deliveryId, String eventType, Map<String, Object> result) {
        markProcessed(deliveryId, eventType, result, List.of());
    }

    public void markProcessed(String deliveryId,
                              String eventType,
                              Map<String, Object> result,
                              List<Repository> affectedRepositories) {
        if (!StringUtils.hasText(deliveryId)) {
            return;
        }
        try {
            String resultJson = objectMapper.writeValueAsString(result);
            GitHubWebhookDelivery update = GitHubWebhookDelivery.builder()
                    .eventType(eventType)
                    .status("PROCESSED")
                    .resultJson(resultJson)
                    .build();
            boolean updated = update(update, new LambdaUpdateWrapper<GitHubWebhookDelivery>()
                    .eq(GitHubWebhookDelivery::getDeliveryId, deliveryId));
            if (!updated) {
                save(GitHubWebhookDelivery.builder()
                        .deliveryId(deliveryId)
                        .eventType(eventType)
                        .status("PROCESSED")
                        .resultJson(resultJson)
                        .build());
            }
            saveProjectMappings(deliveryId, affectedRepositories);
        } catch (Exception e) {
            throw BizException.internal("GitHub webhook delivery 记录失败: " + e.getMessage());
        }
    }

    public int cleanupExpired() {
        validateRetentionPolicy();
        return deleteCreatedBefore(LocalDateTime.now().minusDays(retentionDays), cleanupBatchSize);
    }

    public int deleteCreatedBefore(LocalDateTime cutoff, int batchSize) {
        if (cutoff == null) {
            throw BizException.badRequest("GitHub webhook delivery 清理截止时间不能为空");
        }
        if (batchSize < 1 || batchSize > 5000) {
            throw BizException.badRequest("GitHub webhook delivery cleanup-batch-size 必须在 1 到 5000 之间");
        }
        List<String> expiredDeliveryIds = baseMapper.selectList(new QueryWrapper<GitHubWebhookDelivery>()
                        .select("delivery_id")
                        .lt("created_at", cutoff)
                        .orderByAsc("created_at")
                        .last("LIMIT " + batchSize))
                .stream()
                .map(GitHubWebhookDelivery::getDeliveryId)
                .toList();
        if (expiredDeliveryIds.isEmpty()) {
            return 0;
        }
        deliveryProjectMapper.delete(new QueryWrapper<GitHubWebhookDeliveryProject>()
                .in("delivery_id", expiredDeliveryIds));
        return baseMapper.delete(new QueryWrapper<GitHubWebhookDelivery>()
                .in("delivery_id", expiredDeliveryIds));
    }

    private void validateRetentionPolicy() {
        if (retentionDays < 1) {
            throw BizException.badRequest("GitHub webhook delivery retention-days 必须大于等于 1");
        }
        if (cleanupBatchSize < 1 || cleanupBatchSize > 5000) {
            throw BizException.badRequest("GitHub webhook delivery cleanup-batch-size 必须在 1 到 5000 之间");
        }
    }

    private void saveProjectMappings(String deliveryId, List<Repository> affectedRepositories) {
        if (affectedRepositories == null || affectedRepositories.isEmpty()) {
            return;
        }
        Set<String> seen = new HashSet<>();
        for (Repository repo : affectedRepositories) {
            if (repo == null || repo.getProjectId() == null || repo.getId() == null) {
                continue;
            }
            String key = repo.getProjectId() + ":" + repo.getId();
            if (!seen.add(key)) {
                continue;
            }
            deliveryProjectMapper.insert(GitHubWebhookDeliveryProject.builder()
                    .deliveryId(deliveryId)
                    .projectId(repo.getProjectId())
                    .repositoryId(repo.getId())
                    .build());
        }
    }
}
