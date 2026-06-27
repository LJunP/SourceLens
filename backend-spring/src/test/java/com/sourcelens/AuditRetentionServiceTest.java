package com.sourcelens;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.sourcelens.common.exception.BizException;
import com.sourcelens.module.agent.entity.AgentToolCall;
import com.sourcelens.module.agent.mapper.AgentToolCallMapper;
import com.sourcelens.module.audit.entity.AuditLog;
import com.sourcelens.module.audit.mapper.AuditLogMapper;
import com.sourcelens.module.audit.service.AuditRetentionService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuditRetentionServiceTest {

    @Mock
    private AuditLogMapper auditLogMapper;

    @Mock
    private AgentToolCallMapper agentToolCallMapper;

    @InjectMocks
    private AuditRetentionService auditRetentionService;

    @Test
    void cleanupExpired_shouldDeleteAuditLogsAndToolCallsByRetentionPolicy() {
        ReflectionTestUtils.setField(auditRetentionService, "retentionDays", 90);
        ReflectionTestUtils.setField(auditRetentionService, "cleanupBatchSize", 500);
        when(auditLogMapper.delete(any(Wrapper.class))).thenReturn(2);
        when(agentToolCallMapper.delete(any(Wrapper.class))).thenReturn(3);

        AuditRetentionService.CleanupResult result = auditRetentionService.cleanupExpired();

        assertEquals(2, result.auditLogsDeleted());
        assertEquals(3, result.toolCallsDeleted());
        assertEquals(5, result.totalDeleted());
        verify(auditLogMapper).delete(any(Wrapper.class));
        verify(agentToolCallMapper).delete(any(Wrapper.class));
    }

    @Test
    void deleteCreatedBefore_shouldRejectNullCutoff() {
        BizException ex = assertThrows(BizException.class,
                () -> auditRetentionService.deleteCreatedBefore(null, 100));

        assertEquals("BAD_REQUEST", ex.getCode());
    }

    @Test
    void cleanupExpired_shouldRejectInvalidRetentionDays() {
        ReflectionTestUtils.setField(auditRetentionService, "retentionDays", 0);
        ReflectionTestUtils.setField(auditRetentionService, "cleanupBatchSize", 500);

        BizException ex = assertThrows(BizException.class, () -> auditRetentionService.cleanupExpired());

        assertEquals("BAD_REQUEST", ex.getCode());
    }

    @Test
    void deleteCreatedBefore_shouldRejectInvalidBatchSize() {
        BizException ex = assertThrows(BizException.class,
                () -> auditRetentionService.deleteCreatedBefore(LocalDateTime.now(), 5001));

        assertEquals("BAD_REQUEST", ex.getCode());
    }
}
