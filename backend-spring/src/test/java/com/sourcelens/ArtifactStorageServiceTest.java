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

import static org.junit.jupiter.api.Assumptions.assumeTrue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
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
    void storeText_shouldCreateMissingWorkspaceBasePath() throws Exception {
        Path missingBase = tempDir.resolve("missing-workspace");
        ReflectionTestUtils.setField(artifactStorageService, "workspaceBasePath", missingBase.toString());
        doAnswer(invocation -> {
            ArtifactRecord record = invocation.getArgument(0);
            record.setId(100L);
            return 1;
        }).when(artifactRecordMapper).insert(any(ArtifactRecord.class));

        ArtifactRecord record = artifactStorageService.storeText(
                10L, 20L, "SCAN_TASK", 42L, "RAW_SCAN_RESULT",
                "raw.json", "application/json", "{\"ok\":true}", 1L);

        assertEquals(100L, record.getId());
        assertEquals("{\"ok\":true}", Files.readString(Path.of(record.getStoragePath())));
        assertTrue(record.getStoragePath().startsWith(missingBase.resolve("artifacts").toString()));
        verify(artifactRecordMapper).insert(any(ArtifactRecord.class));
    }

    @Test
    void storeText_shouldOverwriteExistingRegularFile() throws Exception {
        ReflectionTestUtils.setField(artifactStorageService, "workspaceBasePath", tempDir.toString());
        Path target = tempDir.resolve("artifacts/scan_task/42/raw_scan_result/raw.json");
        Files.createDirectories(target.getParent());
        Files.writeString(target, "{\"old\":true}");
        doAnswer(invocation -> {
            ArtifactRecord record = invocation.getArgument(0);
            record.setId(101L);
            return 1;
        }).when(artifactRecordMapper).insert(any(ArtifactRecord.class));

        ArtifactRecord record = artifactStorageService.storeText(
                10L, 20L, "SCAN_TASK", 42L, "RAW_SCAN_RESULT",
                "raw.json", "application/json", "{\"new\":true}", 1L);

        assertEquals(101L, record.getId());
        assertEquals("{\"new\":true}", Files.readString(Path.of(record.getStoragePath())));
        verify(artifactRecordMapper).insert(any(ArtifactRecord.class));
    }

    @Test
    void storeText_shouldRejectSymlinkArtifactRoot() throws Exception {
        ReflectionTestUtils.setField(artifactStorageService, "workspaceBasePath", tempDir.toString());
        Path outside = tempDir.resolveSibling("artifact-root-escape");
        Files.createDirectories(outside);
        Path rootLink = tempDir.resolve("artifacts");
        createSymbolicLinkOrSkip(rootLink, outside);

        BizException ex = assertThrows(BizException.class, () -> artifactStorageService.storeText(
                10L, 20L, "SCAN_TASK", 42L, "RAW_SCAN_RESULT",
                "raw.json", "application/json", "{}", 1L));

        assertEquals("BAD_REQUEST", ex.getCode());
        assertFalse(Files.exists(outside.resolve("scan_task")));
        verify(artifactRecordMapper, never()).insert(any(ArtifactRecord.class));
    }

    @Test
    void storeText_shouldRejectSymlinkParentDirectory() throws Exception {
        ReflectionTestUtils.setField(artifactStorageService, "workspaceBasePath", tempDir.toString());
        Path outside = tempDir.resolveSibling("artifact-write-escape");
        Files.createDirectories(outside);
        Path link = tempDir.resolve("artifacts/scan_task");
        Files.createDirectories(link.getParent());
        createSymbolicLinkOrSkip(link, outside);

        BizException ex = assertThrows(BizException.class, () -> artifactStorageService.storeText(
                10L, 20L, "SCAN_TASK", 42L, "RAW_SCAN_RESULT",
                "raw.json", "application/json", "{}", 1L));

        assertEquals("BAD_REQUEST", ex.getCode());
        assertFalse(Files.exists(outside.resolve("42")));
        verify(artifactRecordMapper, never()).insert(any(ArtifactRecord.class));
    }

    @Test
    void storeText_shouldRejectExistingSymlinkTargetFile() throws Exception {
        ReflectionTestUtils.setField(artifactStorageService, "workspaceBasePath", tempDir.toString());
        Path outside = tempDir.resolveSibling("artifact-write-target.json");
        Files.writeString(outside, "{\"secret\":\"outside\"}");
        Path target = tempDir.resolve("artifacts/scan_task/42/raw_scan_result/raw.json");
        Files.createDirectories(target.getParent());
        createSymbolicLinkOrSkip(target, outside);

        BizException ex = assertThrows(BizException.class, () -> artifactStorageService.storeText(
                10L, 20L, "SCAN_TASK", 42L, "RAW_SCAN_RESULT",
                "raw.json", "application/json", "{\"ok\":true}", 1L));

        assertEquals("BAD_REQUEST", ex.getCode());
        assertEquals("{\"secret\":\"outside\"}", Files.readString(outside));
        verify(artifactRecordMapper, never()).insert(any(ArtifactRecord.class));
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
    void readPreview_shouldTruncateLargeTextContent() throws Exception {
        ReflectionTestUtils.setField(artifactStorageService, "workspaceBasePath", tempDir.toString());
        Path file = tempDir.resolve("artifacts/scan_task/42/log/large.log");
        Files.createDirectories(file.getParent());
        String content = "a".repeat(130 * 1024);
        Files.writeString(file, content);
        ArtifactRecord record = ArtifactRecord.builder()
                .id(8L)
                .contentType("text/plain")
                .storagePath(file.toString())
                .build();

        ArtifactStorageService.PreviewContent preview = artifactStorageService.readPreview(record);

        assertTrue(preview.truncated());
        assertEquals(128 * 1024, preview.previewBytes());
        assertEquals(128 * 1024, preview.text().length());
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
    void readBytes_shouldRejectSymlinkEscapingArtifactRoot() throws Exception {
        ReflectionTestUtils.setField(artifactStorageService, "workspaceBasePath", tempDir.toString());
        Path outside = tempDir.resolveSibling("outside-secret.json");
        Files.writeString(outside, "{\"secret\":\"raw\"}");
        Path link = tempDir.resolve("artifacts/auto_repair/99/raw_scan_result/leak.json");
        Files.createDirectories(link.getParent());
        createSymbolicLinkOrSkip(link, outside);
        ArtifactRecord record = ArtifactRecord.builder()
                .id(8L)
                .ownerType("AUTO_REPAIR")
                .ownerId(99L)
                .contentType("application/json")
                .storagePath(link.toString())
                .build();

        BizException ex = assertThrows(BizException.class, () -> artifactStorageService.readBytes(record));

        assertEquals("BAD_REQUEST", ex.getCode());
    }

    @Test
    void readPreview_shouldRejectSymlinkEscapingArtifactRoot() throws Exception {
        ReflectionTestUtils.setField(artifactStorageService, "workspaceBasePath", tempDir.toString());
        Path outside = tempDir.resolveSibling("outside-preview.txt");
        Files.writeString(outside, "raw secret preview");
        Path link = tempDir.resolve("artifacts/auto_repair/99/log/preview.txt");
        Files.createDirectories(link.getParent());
        createSymbolicLinkOrSkip(link, outside);
        ArtifactRecord record = ArtifactRecord.builder()
                .id(8L)
                .ownerType("AUTO_REPAIR")
                .ownerId(99L)
                .contentType("text/plain")
                .storagePath(link.toString())
                .build();

        BizException ex = assertThrows(BizException.class, () -> artifactStorageService.readPreview(record));

        assertEquals("BAD_REQUEST", ex.getCode());
    }

    @Test
    void readBytes_shouldRejectSymlinkInsideArtifactRoot() throws Exception {
        ReflectionTestUtils.setField(artifactStorageService, "workspaceBasePath", tempDir.toString());
        Path target = tempDir.resolve("artifacts/scan_task/42/raw_scan_result/target.json");
        Files.createDirectories(target.getParent());
        Files.writeString(target, "{\"ok\":true}");
        Path link = tempDir.resolve("artifacts/scan_task/42/raw_scan_result/link.json");
        createSymbolicLinkOrSkip(link, target);
        ArtifactRecord record = ArtifactRecord.builder()
                .id(8L)
                .ownerType("SCAN_TASK")
                .ownerId(42L)
                .artifactType("RAW_SCAN_RESULT")
                .contentType("application/json")
                .storagePath(link.toString())
                .build();

        BizException ex = assertThrows(BizException.class, () -> artifactStorageService.readBytes(record));

        assertEquals("BAD_REQUEST", ex.getCode());
    }

    @Test
    void readBytes_shouldRejectScanTaskSymlinkEscapeWithoutLegacyFallback() throws Exception {
        ReflectionTestUtils.setField(artifactStorageService, "workspaceBasePath", tempDir.toString());
        Path outside = tempDir.resolveSibling("outside-scan-summary.json");
        Files.writeString(outside, "{\"secret\":\"scan\"}");
        Path link = tempDir.resolve("artifacts/scan_task/42/architecture_overview/overview.json");
        Files.createDirectories(link.getParent());
        createSymbolicLinkOrSkip(link, outside);
        lenient().when(scanArtifactMapper.selectOne(any())).thenReturn(ScanArtifact.builder()
                .scanTaskId(42L)
                .artifactType("ARCHITECTURE_OVERVIEW")
                .summaryJson("{\"totalFiles\":12}")
                .build());
        ArtifactRecord record = ArtifactRecord.builder()
                .id(8L)
                .ownerType("SCAN_TASK")
                .ownerId(42L)
                .artifactType("ARCHITECTURE_OVERVIEW")
                .contentType("application/json")
                .storagePath(link.toString())
                .build();

        BizException ex = assertThrows(BizException.class, () -> artifactStorageService.readBytes(record));

        assertEquals("BAD_REQUEST", ex.getCode());
        verify(scanArtifactMapper, never()).selectOne(any());
    }

    @Test
    void readPreview_shouldRejectScanTaskSymlinkEscapeWithoutLegacyFallback() throws Exception {
        ReflectionTestUtils.setField(artifactStorageService, "workspaceBasePath", tempDir.toString());
        Path outside = tempDir.resolveSibling("outside-scan-preview.json");
        Files.writeString(outside, "{\"secret\":\"preview\"}");
        Path link = tempDir.resolve("artifacts/scan_task/42/architecture_overview/preview.json");
        Files.createDirectories(link.getParent());
        createSymbolicLinkOrSkip(link, outside);
        lenient().when(scanArtifactMapper.selectOne(any())).thenReturn(ScanArtifact.builder()
                .scanTaskId(42L)
                .artifactType("ARCHITECTURE_OVERVIEW")
                .summaryJson("{\"totalFiles\":12}")
                .build());
        ArtifactRecord record = ArtifactRecord.builder()
                .id(8L)
                .ownerType("SCAN_TASK")
                .ownerId(42L)
                .artifactType("ARCHITECTURE_OVERVIEW")
                .contentType("application/json")
                .storagePath(link.toString())
                .build();

        BizException ex = assertThrows(BizException.class, () -> artifactStorageService.readPreview(record));

        assertEquals("BAD_REQUEST", ex.getCode());
        verify(scanArtifactMapper, never()).selectOne(any());
    }

    @Test
    void readBytes_shouldFallbackToLegacyScanArtifactSummaryForMovedWorkspace() {
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

        byte[] payload = artifactStorageService.readBytes(record);

        assertEquals("{\"totalFiles\":12}", new String(payload));
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

    private void createSymbolicLinkOrSkip(Path link, Path target) throws Exception {
        try {
            Files.createSymbolicLink(link, target);
        } catch (UnsupportedOperationException | SecurityException e) {
            assumeTrue(false, "symbolic links are not supported in this environment: " + e.getMessage());
        }
    }
}
