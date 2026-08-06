package com.sourcelens;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sourcelens.module.audit.entity.AuditLog;
import com.sourcelens.module.audit.mapper.AuditLogMapper;
import com.sourcelens.module.audit.service.AuditLogService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.slf4j.MDC;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AuditLogServiceTest {

    @Mock
    private AuditLogMapper auditLogMapper;

    @Test
    void record_shouldSanitizeSensitiveInputAndPersistAuditLog() {
        AuditLogService auditLogService = new AuditLogService(auditLogMapper, new ObjectMapper());

        doAnswer(invocation -> {
            AuditLog log = invocation.getArgument(0);
            log.setId(88L);
            return 1;
        }).when(auditLogMapper).insert(org.mockito.ArgumentMatchers.any(AuditLog.class));

        Long auditLogId = auditLogService.record(
                1L,
                10L,
                "PROJECT",
                10L,
                "PROJECT_DELETE_CASCADE",
                "SUCCESS",
                Map.of("token", "ghp_plainsecret", "scope", "project"),
                "deleted with api_key=sk-12345678abcdef",
                12L,
                "req-1");

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogMapper).insert(captor.capture());
        AuditLog log = captor.getValue();

        assertEquals(88L, auditLogId);
        assertEquals(1L, log.getUserId());
        assertEquals(10L, log.getProjectId());
        assertEquals("PROJECT_DELETE_CASCADE", log.getAction());
        assertTrue(log.getInputJson().contains("****"));
        assertFalse(log.getInputJson().contains("ghp_plainsecret"));
        assertFalse(log.getOutputSummary().contains("sk-12345678abcdef"));
    }

    @Test
    void record_shouldUseMdcRequestIdWhenExplicitRequestIdIsAbsent() {
        AuditLogService auditLogService = new AuditLogService(auditLogMapper, new ObjectMapper());
        MDC.put("requestId", "req-mdc-1");
        try {
            auditLogService.record(
                    1L,
                    10L,
                    "PROJECT",
                    10L,
                    "PROJECT_CREATE",
                    "SUCCESS",
                    Map.of("name", "demo"),
                    "created",
                    12L,
                    null);
        } finally {
            MDC.remove("requestId");
        }

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogMapper).insert(captor.capture());

        assertEquals("req-mdc-1", captor.getValue().getRequestId());
    }

    @Test
    void record_shouldReturnNullWhenAuditInsertFails() {
        AuditLogService auditLogService = new AuditLogService(auditLogMapper, new ObjectMapper());
        doThrow(new RuntimeException("db unavailable"))
                .when(auditLogMapper)
                .insert(org.mockito.ArgumentMatchers.any(AuditLog.class));

        Long auditLogId = auditLogService.record(
                1L,
                10L,
                "ARTIFACT",
                9L,
                "ARTIFACT_RAW_DOWNLOAD",
                "SUCCESS",
                Map.of("artifactId", 9L),
                "artifact raw download issued",
                12L,
                "req-1");

        assertNull(auditLogId);
    }
}
