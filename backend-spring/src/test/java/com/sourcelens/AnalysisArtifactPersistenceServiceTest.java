package com.sourcelens;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.sourcelens.module.analysis.entity.ScanArtifact;
import com.sourcelens.module.analysis.mapper.ScanArtifactMapper;
import com.sourcelens.module.analysis.service.AnalysisArtifactPersistenceService;
import com.sourcelens.module.artifact.entity.ArtifactRecord;
import com.sourcelens.module.artifact.service.ArtifactStorageService;
import com.sourcelens.module.scantask.entity.ScanTask;
import com.sourcelens.module.scantask.mapper.ScanTaskMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AnalysisArtifactPersistenceServiceTest {

    @Mock
    private ScanArtifactMapper scanArtifactMapper;

    @Mock
    private ScanTaskMapper scanTaskMapper;

    @Mock
    private ArtifactStorageService artifactStorageService;

    @InjectMocks
    private AnalysisArtifactPersistenceService persistenceService;

    @Test
    void cleanupScanArtifacts_shouldDeleteUnifiedAndLegacyArtifacts() {
        persistenceService.cleanupScanArtifacts(42L);

        verify(artifactStorageService).deleteByOwner("SCAN_TASK", 42L);
        verify(scanArtifactMapper).delete(any(LambdaQueryWrapper.class));
    }

    @Test
    void saveArtifact_shouldStoreUnifiedArtifactAndLegacyCompatRecord() {
        ScanTask task = ScanTask.builder()
                .id(42L)
                .projectId(10L)
                .repositoryId(20L)
                .createdBy(1L)
                .build();
        when(scanTaskMapper.selectById(42L)).thenReturn(task);
        when(artifactStorageService.storeText(
                eq(10L),
                eq(20L),
                eq("SCAN_TASK"),
                eq(42L),
                eq("ARCHITECTURE_OVERVIEW"),
                eq("architecture_overview.json"),
                eq("application/json"),
                eq("{\"totalFiles\":12}"),
                eq(1L)))
                .thenReturn(ArtifactRecord.builder()
                        .storagePath("/tmp/sourcelens/artifacts/scan_task/42/architecture_overview.json")
                        .build());

        persistenceService.saveArtifact(42L, "ARCHITECTURE_OVERVIEW", Map.of("totalFiles", 12));

        ArgumentCaptor<ScanArtifact> captor = ArgumentCaptor.forClass(ScanArtifact.class);
        verify(scanArtifactMapper).insert(captor.capture());
        assertEquals(42L, captor.getValue().getScanTaskId());
        assertEquals("ARCHITECTURE_OVERVIEW", captor.getValue().getArtifactType());
        assertEquals("{\"totalFiles\":12}", captor.getValue().getSummaryJson());
        assertEquals("/tmp/sourcelens/artifacts/scan_task/42/architecture_overview.json",
                captor.getValue().getStoragePath());
    }
}
