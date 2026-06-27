package com.sourcelens;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sourcelens.common.exception.BizException;
import com.sourcelens.module.repository.entity.GitHubWebhookDelivery;
import com.sourcelens.module.repository.entity.GitHubWebhookDeliveryProject;
import com.sourcelens.module.repository.entity.Repository;
import com.sourcelens.module.repository.mapper.GitHubWebhookDeliveryMapper;
import com.sourcelens.module.repository.mapper.GitHubWebhookDeliveryProjectMapper;
import com.sourcelens.module.repository.service.GitHubWebhookDeliveryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GitHubWebhookDeliveryServiceTest {

    @Mock
    private GitHubWebhookDeliveryMapper mapper;

    @Mock
    private GitHubWebhookDeliveryProjectMapper deliveryProjectMapper;

    private GitHubWebhookDeliveryService service;

    @BeforeEach
    void setUp() {
        service = new GitHubWebhookDeliveryService(new ObjectMapper(), deliveryProjectMapper);
        ReflectionTestUtils.setField(service, "baseMapper", mapper);
    }

    @Test
    void claimProcessing_shouldInsertProcessingDeliveryBeforeBusinessHandling() {
        when(mapper.insert(any(GitHubWebhookDelivery.class))).thenReturn(1);

        boolean claimed = service.claimProcessing("delivery-1", "installation");

        assertTrue(claimed);
        ArgumentCaptor<GitHubWebhookDelivery> captor = ArgumentCaptor.forClass(GitHubWebhookDelivery.class);
        verify(mapper).insert(captor.capture());
        assertEquals("delivery-1", captor.getValue().getDeliveryId());
        assertEquals("installation", captor.getValue().getEventType());
        assertEquals("PROCESSING", captor.getValue().getStatus());
    }

    @Test
    void claimProcessing_shouldReturnFalseForDuplicateDeliveryId() {
        when(mapper.insert(any(GitHubWebhookDelivery.class)))
                .thenThrow(new DuplicateKeyException("Duplicate entry 'delivery-1'"));

        boolean claimed = service.claimProcessing("delivery-1", "installation");

        assertFalse(claimed);
    }

    @Test
    void markProcessed_shouldUpdateClaimedDeliveryResult() {
        when(mapper.update(any(GitHubWebhookDelivery.class), any())).thenReturn(1);

        service.markProcessed("delivery-1", "installation", Map.of("affectedRepositories", 1));

        ArgumentCaptor<GitHubWebhookDelivery> captor = ArgumentCaptor.forClass(GitHubWebhookDelivery.class);
        verify(mapper).update(captor.capture(), any());
        assertEquals("installation", captor.getValue().getEventType());
        assertEquals("PROCESSED", captor.getValue().getStatus());
        verify(mapper, never()).insert(any(GitHubWebhookDelivery.class));
    }

    @Test
    void markProcessed_shouldPersistDeliveryResult() {
        service.markProcessed("delivery-1", "installation", Map.of("affectedRepositories", 1));

        verify(mapper).insert(any(GitHubWebhookDelivery.class));
    }

    @Test
    void markProcessed_shouldPersistProjectMappingsForAffectedRepositories() {
        service.markProcessed("delivery-1", "installation", Map.of("affectedRepositories", 2), List.of(
                Repository.builder().id(100L).projectId(10L).build(),
                Repository.builder().id(101L).projectId(10L).build(),
                Repository.builder().id(100L).projectId(10L).build()
        ));

        verify(mapper).insert(any(GitHubWebhookDelivery.class));
        verify(deliveryProjectMapper, org.mockito.Mockito.times(2)).insert(any(GitHubWebhookDeliveryProject.class));
    }

    @Test
    void markProcessed_shouldIgnoreMissingDeliveryId() {
        service.markProcessed("", "installation", Map.of("affectedRepositories", 1));

        verify(mapper, never()).insert(any(GitHubWebhookDelivery.class));
    }

    @Test
    void listByProject_shouldReturnEmptyPageWhenProjectHasNoDeliveryMappings() {
        when(deliveryProjectMapper.selectList(any())).thenReturn(List.of());

        Page<GitHubWebhookDelivery> result = service.listByProject(10L, 1, 20, null, null);

        assertEquals(0, result.getTotal());
        assertTrue(result.getRecords().isEmpty());
        verify(mapper, never()).selectPage(any(), any());
    }

    @Test
    void listByProject_shouldQueryDeliveriesByMappedDeliveryIds() {
        Page<GitHubWebhookDelivery> expected = new Page<>(2, 10, 1);
        when(deliveryProjectMapper.selectList(any())).thenReturn(List.of(
                GitHubWebhookDeliveryProject.builder().deliveryId("delivery-1").build(),
                GitHubWebhookDeliveryProject.builder().deliveryId("delivery-2").build(),
                GitHubWebhookDeliveryProject.builder().deliveryId("delivery-1").build()
        ));
        when(mapper.selectPage(any(), any())).thenReturn(expected);

        Page<GitHubWebhookDelivery> result = service.listByProject(10L, 2, 10, "installation", "PROCESSED");

        assertSame(expected, result);
        verify(mapper).selectPage(any(), any());
    }

    @Test
    void deleteCreatedBefore_shouldDeleteExpiredDeliveriesWithLimit() {
        when(mapper.selectList(any())).thenReturn(List.of(
                GitHubWebhookDelivery.builder().deliveryId("delivery-1").build()
        ));
        when(mapper.delete(any())).thenReturn(5);

        int deleted = service.deleteCreatedBefore(LocalDateTime.now().minusDays(30), 500);

        assertEquals(5, deleted);
        verify(deliveryProjectMapper).delete(any());
        verify(mapper).delete(any());
    }

    @Test
    void deleteCreatedBefore_shouldSkipDeletesWhenNothingExpired() {
        when(mapper.selectList(any())).thenReturn(List.of());

        int deleted = service.deleteCreatedBefore(LocalDateTime.now().minusDays(30), 500);

        assertEquals(0, deleted);
        verify(deliveryProjectMapper, never()).delete(any());
        verify(mapper, never()).delete(any());
    }

    @Test
    void cleanupExpired_shouldDeleteByRetentionPolicy() {
        ReflectionTestUtils.setField(service, "retentionDays", 30);
        ReflectionTestUtils.setField(service, "cleanupBatchSize", 500);
        when(mapper.selectList(any())).thenReturn(List.of(
                GitHubWebhookDelivery.builder().deliveryId("delivery-1").build(),
                GitHubWebhookDelivery.builder().deliveryId("delivery-2").build()
        ));
        when(mapper.delete(any())).thenReturn(2);

        int deleted = service.cleanupExpired();

        assertEquals(2, deleted);
        verify(deliveryProjectMapper).delete(any());
        verify(mapper).delete(any());
    }

    @Test
    void cleanupExpired_shouldRejectInvalidRetentionDays() {
        ReflectionTestUtils.setField(service, "retentionDays", 0);
        ReflectionTestUtils.setField(service, "cleanupBatchSize", 500);

        BizException ex = assertThrows(BizException.class, () -> service.cleanupExpired());

        assertEquals("BAD_REQUEST", ex.getCode());
    }

    @Test
    void deleteCreatedBefore_shouldRejectInvalidBatchSize() {
        BizException ex = assertThrows(BizException.class,
                () -> service.deleteCreatedBefore(LocalDateTime.now().minusDays(30), 5001));

        assertEquals("BAD_REQUEST", ex.getCode());
        verify(mapper, never()).delete(any());
    }
}
