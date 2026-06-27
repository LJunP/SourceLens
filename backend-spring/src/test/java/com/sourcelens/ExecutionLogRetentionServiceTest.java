package com.sourcelens;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.sourcelens.common.exception.BizException;
import com.sourcelens.module.execution.mapper.ExecutionLogMapper;
import com.sourcelens.module.execution.service.ExecutionLogRetentionService;
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
class ExecutionLogRetentionServiceTest {

    @Mock
    private ExecutionLogMapper executionLogMapper;

    @InjectMocks
    private ExecutionLogRetentionService executionLogRetentionService;

    @Test
    void cleanupExpired_shouldDeleteExecutionLogsByRetentionPolicy() {
        ReflectionTestUtils.setField(executionLogRetentionService, "retentionDays", 30);
        ReflectionTestUtils.setField(executionLogRetentionService, "cleanupBatchSize", 1000);
        when(executionLogMapper.delete(any(Wrapper.class))).thenReturn(7);

        int deleted = executionLogRetentionService.cleanupExpired();

        assertEquals(7, deleted);
        verify(executionLogMapper).delete(any(Wrapper.class));
    }

    @Test
    void deleteCreatedBefore_shouldRejectNullCutoff() {
        BizException ex = assertThrows(BizException.class,
                () -> executionLogRetentionService.deleteCreatedBefore(null, 100));

        assertEquals("BAD_REQUEST", ex.getCode());
    }

    @Test
    void cleanupExpired_shouldRejectInvalidRetentionDays() {
        ReflectionTestUtils.setField(executionLogRetentionService, "retentionDays", 0);
        ReflectionTestUtils.setField(executionLogRetentionService, "cleanupBatchSize", 1000);

        BizException ex = assertThrows(BizException.class,
                () -> executionLogRetentionService.cleanupExpired());

        assertEquals("BAD_REQUEST", ex.getCode());
    }

    @Test
    void deleteCreatedBefore_shouldRejectInvalidBatchSize() {
        BizException ex = assertThrows(BizException.class,
                () -> executionLogRetentionService.deleteCreatedBefore(LocalDateTime.now(), 5001));

        assertEquals("BAD_REQUEST", ex.getCode());
    }
}
