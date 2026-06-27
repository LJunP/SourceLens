package com.sourcelens;

import com.sourcelens.common.exception.GlobalExceptionHandler;
import com.sourcelens.module.analysis.controller.AnalysisController;
import com.sourcelens.module.analysis.entity.ScanArtifact;
import com.sourcelens.module.analysis.service.AnalysisService;
import com.sourcelens.module.project.service.ProjectService;
import com.sourcelens.module.scantask.entity.ScanTask;
import com.sourcelens.module.scantask.service.ScanTaskService;
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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AnalysisControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AnalysisService analysisService;

    @Mock
    private ScanTaskService scanTaskService;

    @Mock
    private ProjectService projectService;

    @InjectMocks
    private AnalysisController analysisController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(analysisController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void listByTask_shouldNotExposeStoragePath() throws Exception {
        Long userId = 1L;
        ScanTask task = ScanTask.builder()
                .id(42L)
                .projectId(10L)
                .build();
        ScanArtifact artifact = ScanArtifact.builder()
                .id(7L)
                .scanTaskId(42L)
                .artifactType("ARCHITECTURE_REPORT")
                .summaryJson("{\"ok\":true}")
                .storagePath("/tmp/sourcelens/artifacts/private/report.json")
                .build();
        when(scanTaskService.getDetail(42L)).thenReturn(task);
        doNothing().when(projectService).verifyOwnership(10L, userId);
        when(analysisService.listByTask(42L)).thenReturn(List.of(artifact));

        mockMvc.perform(get("/api/scan-tasks/42/artifacts")
                        .requestAttr("userId", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].artifactType").value("ARCHITECTURE_REPORT"))
                .andExpect(jsonPath("$.data[0].summaryJson").value("{\"ok\":true}"))
                .andExpect(jsonPath("$.data[0].storagePath").doesNotExist());
    }
}
