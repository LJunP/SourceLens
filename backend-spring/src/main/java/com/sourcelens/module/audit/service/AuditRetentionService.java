package com.sourcelens.module.audit.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.sourcelens.common.exception.BizException;
import com.sourcelens.module.agent.entity.AgentToolCall;
import com.sourcelens.module.agent.mapper.AgentToolCallMapper;
import com.sourcelens.module.audit.entity.AuditLog;
import com.sourcelens.module.audit.mapper.AuditLogMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditRetentionService {

    private final AuditLogMapper auditLogMapper;
    private final AgentToolCallMapper agentToolCallMapper;

    @Value("${sourcelens.audit.cleanup-enabled:false}")
    private boolean cleanupEnabled;

    @Value("${sourcelens.audit.retention-days:90}")
    private int retentionDays;

    @Value("${sourcelens.audit.cleanup-batch-size:500}")
    private int cleanupBatchSize;

    @Scheduled(cron = "${sourcelens.audit.cleanup-cron:0 0 4 * * *}")
    public void scheduledCleanup() {
        if (!cleanupEnabled) {
            return;
        }
        CleanupResult result = cleanupExpired();
        if (result.totalDeleted() > 0) {
            log.info("audit 过期清理完成, auditLogsDeleted={}, toolCallsDeleted={}, retentionDays={}, batchSize={}",
                    result.auditLogsDeleted(), result.toolCallsDeleted(), retentionDays, cleanupBatchSize);
        }
    }

    public CleanupResult cleanupExpired() {
        validatePolicy();
        return deleteCreatedBefore(LocalDateTime.now().minusDays(retentionDays), cleanupBatchSize);
    }

    public CleanupResult deleteCreatedBefore(LocalDateTime cutoff, int batchSize) {
        if (cutoff == null) {
            throw BizException.badRequest("audit 清理截止时间不能为空");
        }
        if (batchSize < 1 || batchSize > 5000) {
            throw BizException.badRequest("audit cleanup-batch-size 必须在 1 到 5000 之间");
        }
        int auditLogsDeleted = auditLogMapper.delete(new LambdaQueryWrapper<AuditLog>()
                .lt(AuditLog::getCreatedAt, cutoff)
                .last("LIMIT " + batchSize));
        int toolCallsDeleted = agentToolCallMapper.delete(new LambdaQueryWrapper<AgentToolCall>()
                .lt(AgentToolCall::getCreatedAt, cutoff)
                .last("LIMIT " + batchSize));
        return new CleanupResult(auditLogsDeleted, toolCallsDeleted);
    }

    private void validatePolicy() {
        if (retentionDays < 1) {
            throw BizException.badRequest("audit retention-days 必须大于等于 1");
        }
        if (cleanupBatchSize < 1 || cleanupBatchSize > 5000) {
            throw BizException.badRequest("audit cleanup-batch-size 必须在 1 到 5000 之间");
        }
    }

    public record CleanupResult(int auditLogsDeleted, int toolCallsDeleted) {
        public int totalDeleted() {
            return auditLogsDeleted + toolCallsDeleted;
        }
    }
}
