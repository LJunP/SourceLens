package com.sourcelens.module.execution.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.sourcelens.common.exception.BizException;
import com.sourcelens.module.execution.entity.ExecutionLog;
import com.sourcelens.module.execution.mapper.ExecutionLogMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExecutionLogRetentionService {

    private final ExecutionLogMapper executionLogMapper;

    @Value("${sourcelens.execution-logs.cleanup-enabled:false}")
    private boolean cleanupEnabled;

    @Value("${sourcelens.execution-logs.retention-days:30}")
    private int retentionDays;

    @Value("${sourcelens.execution-logs.cleanup-batch-size:1000}")
    private int cleanupBatchSize;

    @Scheduled(cron = "${sourcelens.execution-logs.cleanup-cron:0 20 4 * * *}")
    public void scheduledCleanup() {
        if (!cleanupEnabled) {
            return;
        }
        int deleted = cleanupExpired();
        if (deleted > 0) {
            log.info("execution log 过期清理完成, deleted={}, retentionDays={}, batchSize={}",
                    deleted, retentionDays, cleanupBatchSize);
        }
    }

    public int cleanupExpired() {
        validatePolicy();
        return deleteCreatedBefore(LocalDateTime.now().minusDays(retentionDays), cleanupBatchSize);
    }

    public int deleteCreatedBefore(LocalDateTime cutoff, int batchSize) {
        if (cutoff == null) {
            throw BizException.badRequest("execution log 清理截止时间不能为空");
        }
        if (batchSize < 1 || batchSize > 5000) {
            throw BizException.badRequest("execution log cleanup-batch-size 必须在 1 到 5000 之间");
        }
        return executionLogMapper.delete(new LambdaQueryWrapper<ExecutionLog>()
                .lt(ExecutionLog::getCreatedAt, cutoff)
                .last("LIMIT " + batchSize));
    }

    private void validatePolicy() {
        if (retentionDays < 1) {
            throw BizException.badRequest("execution log retention-days 必须大于等于 1");
        }
        if (cleanupBatchSize < 1 || cleanupBatchSize > 5000) {
            throw BizException.badRequest("execution log cleanup-batch-size 必须在 1 到 5000 之间");
        }
    }
}
