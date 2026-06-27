package com.sourcelens.module.artifact.service;

import com.sourcelens.common.exception.BizException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class ArtifactRetentionService {

    private final ArtifactStorageService artifactStorageService;

    @Value("${sourcelens.artifacts.cleanup-enabled:false}")
    private boolean cleanupEnabled;

    @Value("${sourcelens.artifacts.retention-days:30}")
    private int retentionDays;

    @Value("${sourcelens.artifacts.cleanup-batch-size:200}")
    private int cleanupBatchSize;

    @Scheduled(cron = "${sourcelens.artifacts.cleanup-cron:0 30 3 * * *}")
    public void scheduledCleanup() {
        if (!cleanupEnabled) {
            return;
        }
        int deleted = cleanupExpired();
        if (deleted > 0) {
            log.info("artifact 过期清理完成, deleted={}, retentionDays={}, batchSize={}",
                    deleted, retentionDays, cleanupBatchSize);
        }
    }

    public int cleanupExpired() {
        validatePolicy();
        LocalDateTime cutoff = LocalDateTime.now().minusDays(retentionDays);
        return artifactStorageService.deleteCreatedBefore(cutoff, cleanupBatchSize);
    }

    private void validatePolicy() {
        if (retentionDays < 1) {
            throw BizException.badRequest("artifact retention-days 必须大于等于 1");
        }
        if (cleanupBatchSize < 1 || cleanupBatchSize > 1000) {
            throw BizException.badRequest("artifact cleanup-batch-size 必须在 1 到 1000 之间");
        }
    }
}
