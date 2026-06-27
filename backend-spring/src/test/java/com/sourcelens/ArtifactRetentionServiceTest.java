package com.sourcelens;

import com.sourcelens.common.exception.BizException;
import com.sourcelens.module.artifact.service.ArtifactRetentionService;
import com.sourcelens.module.artifact.service.ArtifactStorageService;
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
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ArtifactRetentionServiceTest {

    @Mock
    private ArtifactStorageService artifactStorageService;

    @InjectMocks
    private ArtifactRetentionService artifactRetentionService;

    @Test
    void cleanupExpired_shouldDeleteByRetentionPolicy() {
        ReflectionTestUtils.setField(artifactRetentionService, "retentionDays", 30);
        ReflectionTestUtils.setField(artifactRetentionService, "cleanupBatchSize", 200);
        when(artifactStorageService.deleteCreatedBefore(any(LocalDateTime.class), anyInt())).thenReturn(3);

        int deleted = artifactRetentionService.cleanupExpired();

        assertEquals(3, deleted);
        verify(artifactStorageService).deleteCreatedBefore(any(LocalDateTime.class), anyInt());
    }

    @Test
    void cleanupExpired_shouldRejectInvalidRetentionDays() {
        ReflectionTestUtils.setField(artifactRetentionService, "retentionDays", 0);
        ReflectionTestUtils.setField(artifactRetentionService, "cleanupBatchSize", 200);

        BizException ex = assertThrows(BizException.class, () -> artifactRetentionService.cleanupExpired());

        assertEquals("BAD_REQUEST", ex.getCode());
    }

    @Test
    void cleanupExpired_shouldRejectInvalidBatchSize() {
        ReflectionTestUtils.setField(artifactRetentionService, "retentionDays", 30);
        ReflectionTestUtils.setField(artifactRetentionService, "cleanupBatchSize", 2000);

        BizException ex = assertThrows(BizException.class, () -> artifactRetentionService.cleanupExpired());

        assertEquals("BAD_REQUEST", ex.getCode());
    }
}
