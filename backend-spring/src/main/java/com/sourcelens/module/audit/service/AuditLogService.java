package com.sourcelens.module.audit.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sourcelens.common.security.SensitiveDataSanitizer;
import com.sourcelens.module.audit.entity.AuditLog;
import com.sourcelens.module.audit.mapper.AuditLogMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private static final int MAX_INPUT_JSON_LENGTH = 8_000;
    private static final int MAX_OUTPUT_SUMMARY_LENGTH = 4_000;

    private final AuditLogMapper auditLogMapper;
    private final ObjectMapper objectMapper;

    public Page<AuditLog> listByProject(Long projectId,
                                        int page,
                                        int pageSize,
                                        Long auditLogId,
                                        String resourceType,
                                        Long resourceId,
                                        String action,
                                        String status) {
        int safePage = Math.max(page, 1);
        int safePageSize = Math.min(Math.max(pageSize, 1), 100);
        LambdaQueryWrapper<AuditLog> wrapper = new LambdaQueryWrapper<AuditLog>()
                .eq(AuditLog::getProjectId, projectId)
                .orderByDesc(AuditLog::getCreatedAt)
                .orderByDesc(AuditLog::getId);
        if (auditLogId != null) {
            wrapper.eq(AuditLog::getId, auditLogId);
        }
        if (hasText(resourceType)) {
            wrapper.eq(AuditLog::getResourceType, resourceType.trim());
        }
        if (resourceId != null) {
            wrapper.eq(AuditLog::getResourceId, resourceId);
        }
        if (hasText(action)) {
            wrapper.eq(AuditLog::getAction, action.trim());
        }
        if (hasText(status)) {
            wrapper.eq(AuditLog::getStatus, status.trim());
        }
        return auditLogMapper.selectPage(new Page<>(safePage, safePageSize), wrapper);
    }

    public Long record(Long userId,
                       Long projectId,
                       String resourceType,
                       Long resourceId,
                       String action,
                       String status,
                       Map<String, Object> input,
                       String outputSummary,
                       Long durationMs,
                       String requestId) {
        try {
            AuditLog logRecord = AuditLog.builder()
                    .userId(userId)
                    .projectId(projectId)
                    .resourceType(resourceType)
                    .resourceId(resourceId)
                    .action(action)
                    .status(status)
                    .inputJson(SensitiveDataSanitizer.sanitizeAndTruncate(toJson(input), MAX_INPUT_JSON_LENGTH))
                    .outputSummary(SensitiveDataSanitizer.sanitizeAndTruncate(outputSummary, MAX_OUTPUT_SUMMARY_LENGTH))
                    .durationMs(durationMs)
                    .requestId(resolveRequestId(requestId))
                    .build();
            auditLogMapper.insert(logRecord);
            return logRecord.getId();
        } catch (Exception e) {
            log.warn("保存审计日志失败: action={}, resourceType={}, resourceId={}, error={}",
                    action, resourceType, resourceId, e.getMessage());
            return null;
        }
    }

    private String toJson(Map<String, Object> input) {
        if (input == null || input.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(input);
        } catch (Exception e) {
            return String.valueOf(input);
        }
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String resolveRequestId(String explicitRequestId) {
        if (hasText(explicitRequestId)) {
            return explicitRequestId;
        }
        return MDC.get("requestId");
    }
}
