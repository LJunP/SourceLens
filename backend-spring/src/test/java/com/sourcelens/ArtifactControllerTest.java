package com.sourcelens;

import com.sourcelens.common.exception.GlobalExceptionHandler;
import com.sourcelens.module.artifact.controller.ArtifactController;
import com.sourcelens.module.artifact.entity.ArtifactRecord;
import com.sourcelens.module.artifact.service.ArtifactStorageService;
import com.sourcelens.module.project.service.ProjectService;
import com.sourcelens.module.repository.service.RepositoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.Mockito.doNothing;
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
                .artifactType("CHANGE_PATCH")
                .contentType("text/x-patch")
                .build();
        doNothing().when(projectService).verifyOwnership(10L, userId);
        when(artifactStorageService.getById(9L)).thenReturn(record);
        when(artifactStorageService.readBytes(record)).thenReturn("diff --git".getBytes());

        mockMvc.perform(get("/api/projects/10/artifacts/9/download")
                        .requestAttr("userId", userId))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"artifact-9.patch\""))
                .andExpect(content().string("diff --git"));
    }
}
