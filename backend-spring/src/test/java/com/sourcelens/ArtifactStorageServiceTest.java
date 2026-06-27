package com.sourcelens;

import com.sourcelens.common.exception.BizException;
import com.sourcelens.module.analysis.entity.ScanArtifact;
import com.sourcelens.module.analysis.mapper.ScanArtifactMapper;
import com.sourcelens.module.artifact.entity.ArtifactRecord;
import com.sourcelens.module.artifact.mapper.ArtifactRecordMapper;
import com.sourcelens.module.artifact.service.ArtifactStorageService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ArtifactStorageServiceTest {

    @TempDir
    Path tempDir;

    @Mock
    private ArtifactRecordMapper artifactRecordMapper;

    @Mock
    private ScanArtifactMapper scanArtifactMapper;

    @InjectMocks
    private ArtifactStorageService artifactStorageService;

    @Test
    void storeText_shouldWriteFileAndPersistRecord() throws Exception {
        ReflectionTestUtils.setField(artifactStorageService, "workspaceBasePath", tempDir.toString());
        doAnswer(invocation -> {
            ArtifactRecord record = invocation.getArgument(0);
            record.setId(99L);
            return 1;
        }).when(artifactRecordMapper).insert(any(ArtifactRecord.class));

        ArtifactRecord record = artifactStorageService.storeText(
                10L, 20L, "SCAN_TASK", 42L, "ARCHITECTURE_REPORT",
                "report.json", "application/json", "{\"ok\":true}", 1L);

        assertEquals(99L, record.getId());
        assertEquals(11L, record.getSizeBytes());
        assertEquals("4062edaf750fb8074e7e83e0c9028c94e32468a8b6f1614774328ef045150f93", record.getChecksumSha256());
        assertTrue(record.getStoragePath().startsWith(tempDir.resolve("artifacts").toString()));
        assertEquals("{\"ok\":true}", Files.readString(Path.of(record.getStoragePath())));
        verify(artifactRecordMapper).insert(any(ArtifactRecord.class));
    }

    @Test
    void storeText_shouldRejectPathTraversalFileName() {
        ReflectionTestUtils.setField(artifactStorageService, "workspaceBasePath", tempDir.toString());

        BizException ex = assertThrows(BizException.class, () -> artifactStorageService.storeText(
                10L, 20L, "SCAN_TASK", 42L, "RAW_SCAN_RESULT",
                "../raw.json", "application/json", "{}", 1L));

        assertEquals("BAD_REQUEST", ex.getCode());
    }

    @Test
    void deleteByOwner_shouldDeleteFileAndRecord() throws Exception {
        ReflectionTestUtils.setField(artifactStorageService, "workspaceBasePath", tempDir.toString());
        Path file = tempDir.resolve("artifacts/scan_task/42/raw_scan_result/raw.json");
        Files.createDirectories(file.getParent());
        Files.writeString(file, "{}");
        ArtifactRecord record = ArtifactRecord.builder()
                .id(7L)
                .ownerType("SCAN_TASK")
                .ownerId(42L)
                .storagePath(file.toString())
                .build();
        when(artifactRecordMapper.selectList(any())).thenReturn(List.of(record));

        int deleted = artifactStorageService.deleteByOwner("SCAN_TASK", 42L);

        assertEquals(1, deleted);
        assertFalse(Files.exists(file));
        assertFalse(Files.exists(file.getParent()));
        verify(artifactRecordMapper).deleteById(7L);
    }

    @Test
    void deleteByOwner_shouldRejectRecordOutsideArtifactRoot() throws Exception {
        ReflectionTestUtils.setField(artifactStorageService, "workspaceBasePath", tempDir.toString());
        Path outside = tempDir.resolveSibling("outside.patch");
        Files.writeString(outside, "patch");
        ArtifactRecord record = ArtifactRecord.builder()
                .id(7L)
                .ownerType("AUTO_REPAIR")
                .ownerId(99L)
                .storagePath(outside.toString())
                .build();
        when(artifactRecordMapper.selectList(any())).thenReturn(List.of(record));

        BizException ex = assertThrows(BizException.class,
                () -> artifactStorageService.deleteByOwner("AUTO_REPAIR", 99L));

        assertEquals("BAD_REQUEST", ex.getCode());
        assertTrue(Files.exists(outside));
    }

    @Test
    void readPreview_shouldReturnTextContent() throws Exception {
        ReflectionTestUtils.setField(artifactStorageService, "workspaceBasePath", tempDir.toString());
        Path file = tempDir.resolve("artifacts/scan_task/42/architecture_report/report.json");
        Files.createDirectories(file.getParent());
        Files.writeString(file, "{\"summary\":\"ok\"}");
        ArtifactRecord record = ArtifactRecord.builder()
                .id(8L)
                .contentType("application/json")
                .storagePath(file.toString())
                .build();

        ArtifactStorageService.PreviewContent preview = artifactStorageService.readPreview(record);

        assertEquals("{\"summary\":\"ok\"}", preview.text());
        assertFalse(preview.truncated());
        assertEquals(16, preview.previewBytes());
    }

    @Test
    void readPreview_shouldRejectBinaryContentType() throws Exception {
        ReflectionTestUtils.setField(artifactStorageService, "workspaceBasePath", tempDir.toString());
        Path file = tempDir.resolve("artifacts/scan_task/42/binary/blob.bin");
        Files.createDirectories(file.getParent());
        Files.write(file, new byte[]{0, 1, 2});
        ArtifactRecord record = ArtifactRecord.builder()
                .id(8L)
                .contentType("application/octet-stream")
                .storagePath(file.toString())
                .build();

        BizException ex = assertThrows(BizException.class, () -> artifactStorageService.readPreview(record));

        assertEquals("BAD_REQUEST", ex.getCode());
    }

    @Test
    void readBytes_shouldRejectRecordOutsideArtifactRoot() throws Exception {
        ReflectionTestUtils.setField(artifactStorageService, "workspaceBasePath", tempDir.toString());
        Path outside = tempDir.resolveSibling("outside.json");
        Files.writeString(outside, "{}");
        ArtifactRecord record = ArtifactRecord.builder()
                .id(8L)
                .contentType("application/json")
                .storagePath(outside.toString())
                .build();

        BizException ex = assertThrows(BizException.class, () -> artifactStorageService.readBytes(record));

        assertEquals("BAD_REQUEST", ex.getCode());
    }

    @Test
    void readPreview_shouldFallbackToLegacyScanArtifactSummaryForMovedWorkspace() {
        ReflectionTestUtils.setField(artifactStorageService, "workspaceBasePath", tempDir.toString());
        ArtifactRecord record = ArtifactRecord.builder()
                .id(8L)
                .ownerType("SCAN_TASK")
                .ownerId(42L)
                .artifactType("ARCHITECTURE_OVERVIEW")
                .contentType("application/json")
                .storagePath("/var/lib/sourcelens/repos/artifacts/scan_task/42/architecture_overview/architecture_overview.json")
                .build();
        when(scanArtifactMapper.selectOne(any())).thenReturn(ScanArtifact.builder()
                .scanTaskId(42L)
                .artifactType("ARCHITECTURE_OVERVIEW")
                .summaryJson("{\"totalFiles\":12}")
                .build());

        ArtifactStorageService.PreviewContent preview = artifactStorageService.readPreview(record);

        assertEquals("{\"totalFiles\":12}", preview.text());
        assertFalse(preview.truncated());
    }

    @Test
    void readJsonMapArtifactsByOwner_shouldFallbackToLegacyScanArtifactSummaryForMovedWorkspace() {
        ReflectionTestUtils.setField(artifactStorageService, "workspaceBasePath", tempDir.toString());
        ArtifactRecord record = ArtifactRecord.builder()
                .id(14L)
                .ownerType("SCAN_TASK")
                .ownerId(42L)
                .artifactType("ARCHITECTURE_OVERVIEW")
                .contentType("application/json")
                .storagePath("/var/lib/sourcelens/repos/artifacts/scan_task/42/architecture_overview/architecture_overview.json")
                .build();
        when(artifactRecordMapper.selectList(any())).thenReturn(List.of(record));
        when(scanArtifactMapper.selectOne(any())).thenReturn(ScanArtifact.builder()
                .scanTaskId(42L)
                .artifactType("ARCHITECTURE_OVERVIEW")
                .summaryJson("{\"totalFiles\":12}")
                .build());

        Map<String, Object> data = artifactStorageService.readJsonMapArtifactsByOwner("SCAN_TASK", 42L);

        assertTrue(data.containsKey("ARCHITECTURE_OVERVIEW"));
        Map<?, ?> overview = (Map<?, ?>) data.get("ARCHITECTURE_OVERVIEW");
        assertEquals(12, overview.get("totalFiles"));
    }

    @Test
    void deleteCreatedBefore_shouldDeleteExpiredFilesAndRecords() throws Exception {
        ReflectionTestUtils.setField(artifactStorageService, "workspaceBasePath", tempDir.toString());
        Path file = tempDir.resolve("artifacts/scan_task/42/raw_scan_result/old.json");
        Files.createDirectories(file.getParent());
        Files.writeString(file, "{}");
        ArtifactRecord record = ArtifactRecord.builder()
                .id(12L)
                .storagePath(file.toString())
                .createdAt(LocalDateTime.now().minusDays(40))
                .build();
        when(artifactRecordMapper.selectList(any())).thenReturn(List.of(record));

        int deleted = artifactStorageService.deleteCreatedBefore(LocalDateTime.now().minusDays(30), 200);

        assertEquals(1, deleted);
        assertFalse(Files.exists(file));
        verify(artifactRecordMapper).deleteById(12L);
    }

    @Test
    void readJsonMapArtifactsByOwner_shouldReadJsonArtifacts() throws Exception {
        ReflectionTestUtils.setField(artifactStorageService, "workspaceBasePath", tempDir.toString());
        Path file = tempDir.resolve("artifacts/scan_task/42/architecture_overview/overview.json");
        Files.createDirectories(file.getParent());
        Files.writeString(file, "{\"totalFiles\":12}");
        ArtifactRecord record = ArtifactRecord.builder()
                .id(14L)
                .ownerType("SCAN_TASK")
                .ownerId(42L)
                .artifactType("ARCHITECTURE_OVERVIEW")
                .contentType("application/json")
                .storagePath(file.toString())
                .build();
        when(artifactRecordMapper.selectList(any())).thenReturn(List.of(record));

        Map<String, Object> data = artifactStorageService.readJsonMapArtifactsByOwner("SCAN_TASK", 42L);

        assertTrue(data.containsKey("ARCHITECTURE_OVERVIEW"));
        Map<?, ?> overview = (Map<?, ?>) data.get("ARCHITECTURE_OVERVIEW");
        assertEquals(12, overview.get("totalFiles"));
    }
}
