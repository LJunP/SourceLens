package com.sourcelens;

import com.sourcelens.common.exception.GlobalExceptionHandler;
import com.sourcelens.module.artifact.controller.ArtifactController;
import com.sourcelens.module.artifact.entity.ArtifactRecord;
import com.sourcelens.module.artifact.service.ArtifactStorageService;
import com.sourcelens.module.audit.service.AuditLogService;
import com.sourcelens.module.project.service.ProjectService;
import com.sourcelens.module.repository.service.RepositoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ArtifactControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ArtifactStorageService artifactStorageService;

    @Mock
    private ProjectService projectService;

    @Mock
    private RepositoryService repositoryService;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private ArtifactController artifactController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(artifactController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void listArtifacts_projectScope_filtersForeignRecords() throws Exception {
        Long projectId = 10L;
        Long userId = 1L;
        doNothing().when(projectService).verifyOwnership(projectId, userId);
        when(artifactStorageService.listByProject(projectId)).thenReturn(List.of(
                ArtifactRecord.builder().id(1L).projectId(10L).artifactType("CHANGE_PATCH").storagePath("/tmp/private.patch").build(),
                ArtifactRecord.builder().id(2L).projectId(99L).artifactType("RAW_SCAN_RESULT").build()
        ));

        mockMvc.perform(get("/api/projects/10/artifacts")
                        .requestAttr("userId", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].artifactType").value("CHANGE_PATCH"))
                .andExpect(jsonPath("$.data[0].storagePath").doesNotExist());
    }

    @Test
    void listArtifacts_ownerScope_ok() throws Exception {
        Long projectId = 10L;
        Long userId = 1L;
        doNothing().when(projectService).verifyOwnership(projectId, userId);
        when(artifactStorageService.listByOwner("SCAN_TASK", 42L)).thenReturn(List.of(
                ArtifactRecord.builder().id(1L).projectId(10L).ownerType("SCAN_TASK").ownerId(42L).build()
        ));

        mockMvc.perform(get("/api/projects/10/artifacts")
                        .param("ownerType", "SCAN_TASK")
                        .param("ownerId", "42")
                        .requestAttr("userId", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].ownerId").value(42));
    }

    @Test
    void getArtifact_shouldRejectForeignArtifact() throws Exception {
        Long userId = 1L;
        doNothing().when(projectService).verifyOwnership(10L, userId);
        when(artifactStorageService.getById(9L)).thenReturn(ArtifactRecord.builder()
                .id(9L)
                .projectId(99L)
                .build());

        mockMvc.perform(get("/api/projects/10/artifacts/9")
                        .requestAttr("userId", userId))
                .andExpect(status().isNotFound());
    }

    @Test
    void previewArtifact_shouldReturnTextPreview() throws Exception {
        Long userId = 1L;
        ArtifactRecord record = ArtifactRecord.builder()
                .id(9L)
                .projectId(10L)
                .contentType("application/json")
                .build();
        doNothing().when(projectService).verifyOwnership(10L, userId);
        when(artifactStorageService.getById(9L)).thenReturn(record);
        when(artifactStorageService.readPreview(record)).thenReturn(
                new ArtifactStorageService.PreviewContent("{\"ok\":true}", false, 11));

        mockMvc.perform(get("/api/projects/10/artifacts/9/preview")
                        .requestAttr("userId", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.text").value("{\"ok\":true}"))
                .andExpect(jsonPath("$.data.record.storagePath").doesNotExist())
                .andExpect(jsonPath("$.data.truncated").value(false))
                .andExpect(jsonPath("$.data.previewBytes").value(11));
    }

    @Test
    void downloadArtifact_shouldReturnAttachment() throws Exception {
        Long userId = 1L;
        ArtifactRecord record = ArtifactRecord.builder()
                .id(9L)
                .projectId(10L)
                .repositoryId(3L)
                .ownerType("SCAN_TASK")
                .ownerId(42L)
                .artifactType("CHANGE_PATCH")
                .contentType("text/x-patch")
                .sizeBytes(8L)
                .checksumSha256("abc123")
                .storagePath("/tmp/private.patch")
                .build();
        doNothing().when(projectService).verifyOwnership(10L, userId);
        when(artifactStorageService.getById(9L)).thenReturn(record);
        when(artifactStorageService.readBytes(record)).thenReturn("diff --git".getBytes());
        when(auditLogService.record(eq(userId), eq(10L), eq("ARTIFACT"), eq(9L),
                eq("ARTIFACT_RAW_DOWNLOAD"), eq("SUCCESS"), any(),
                eq("artifact raw download issued: bytes=10, filename=artifact-9.patch, contentType=text/x-patch, rawDownload=true, redacted=false"),
                any(Long.class), eq(null))).thenReturn(77L);

        mockMvc.perform(get("/api/projects/10/artifacts/9/download")
                        .param("rawDownloadAcknowledged", "true")
                        .requestAttr("userId", userId))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"artifact-9.patch\""))
                .andExpect(header().string("X-SourceLens-Audit-Log-Id", "77"))
                .andExpect(content().string("diff --git"));

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> inputCaptor = ArgumentCaptor.forClass(Map.class);
        verify(auditLogService).record(eq(userId), eq(10L), eq("ARTIFACT"), eq(9L),
                eq("ARTIFACT_RAW_DOWNLOAD"), eq("SUCCESS"), inputCaptor.capture(),
                eq("artifact raw download issued: bytes=10, filename=artifact-9.patch, contentType=text/x-patch, rawDownload=true, redacted=false"),
                any(Long.class), eq(null));
        Map<String, Object> input = inputCaptor.getValue();
        assertThat(input)
                .containsEntry("artifactId", 9L)
                .containsEntry("repositoryId", 3L)
                .containsEntry("ownerType", "SCAN_TASK")
                .containsEntry("ownerId", 42L)
                .containsEntry("artifactType", "CHANGE_PATCH")
                .containsEntry("contentType", "text/x-patch")
                .containsEntry("sizeBytes", 8L)
                .containsEntry("checksumSha256", "abc123")
                .containsEntry("hasChecksum", true)
                .containsEntry("fileName", "artifact-9.patch")
                .containsEntry("downloadKind", "RAW_BLOB")
                .containsEntry("rawDownloadAcknowledged", true);
        assertThat(input).doesNotContainKeys("storagePath", "rawBytes", "content", "previewText");
    }

    @Test
    void downloadArtifact_shouldNotExposeAuditHeaderWhenAuditInsertFails() throws Exception {
        Long userId = 1L;
        ArtifactRecord record = ArtifactRecord.builder()
                .id(9L)
                .projectId(10L)
                .repositoryId(3L)
                .ownerType("SCAN_TASK")
                .ownerId(42L)
                .artifactType("CHANGE_PATCH")
                .contentType("text/x-patch")
                .sizeBytes(8L)
                .checksumSha256("abc123")
                .storagePath("/tmp/private.patch")
                .build();
        doNothing().when(projectService).verifyOwnership(10L, userId);
        when(artifactStorageService.getById(9L)).thenReturn(record);
        when(artifactStorageService.readBytes(record)).thenReturn("diff --git".getBytes());
        when(auditLogService.record(eq(userId), eq(10L), eq("ARTIFACT"), eq(9L),
                eq("ARTIFACT_RAW_DOWNLOAD"), eq("SUCCESS"), any(),
                eq("artifact raw download issued: bytes=10, filename=artifact-9.patch, contentType=text/x-patch, rawDownload=true, redacted=false"),
                any(Long.class), eq(null))).thenReturn(null);

        mockMvc.perform(get("/api/projects/10/artifacts/9/download")
                        .param("rawDownloadAcknowledged", "true")
                        .requestAttr("userId", userId))
                .andExpect(status().isOk())
                .andExpect(header().doesNotExist("X-SourceLens-Audit-Log-Id"))
                .andExpect(content().string("diff --git"));

        verify(auditLogService).record(eq(userId), eq(10L), eq("ARTIFACT"), eq(9L),
                eq("ARTIFACT_RAW_DOWNLOAD"), eq("SUCCESS"), any(),
                eq("artifact raw download issued: bytes=10, filename=artifact-9.patch, contentType=text/x-patch, rawDownload=true, redacted=false"),
                any(Long.class), eq(null));
    }

    @Test
    void downloadArtifact_shouldRejectWhenRawDownloadIsNotAcknowledged() throws Exception {
        Long userId = 1L;
        ArtifactRecord record = ArtifactRecord.builder()
                .id(9L)
                .projectId(10L)
                .artifactType("RAW_SCAN_RESULT")
                .contentType("application/json")
                .build();
        doNothing().when(projectService).verifyOwnership(10L, userId);
        when(artifactStorageService.getById(9L)).thenReturn(record);

        mockMvc.perform(get("/api/projects/10/artifacts/9/download")
                        .requestAttr("userId", userId))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("artifact raw download requires explicit acknowledgement"));

        verify(artifactStorageService, never()).readBytes(record);
        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> inputCaptor = ArgumentCaptor.forClass(Map.class);
        verify(auditLogService).record(eq(userId), eq(10L), eq("ARTIFACT"), eq(9L),
                eq("ARTIFACT_RAW_DOWNLOAD"), eq("FAILED"), inputCaptor.capture(),
                eq("artifact raw download rejected: acknowledgement required"),
                any(Long.class), eq(null));
        assertThat(inputCaptor.getValue())
                .containsEntry("downloadKind", "RAW_BLOB")
                .containsEntry("rawDownloadAcknowledged", false)
                .doesNotContainKeys("storagePath", "rawBytes", "content", "previewText");
    }
}
