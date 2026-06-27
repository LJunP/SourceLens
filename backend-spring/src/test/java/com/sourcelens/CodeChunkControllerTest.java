package com.sourcelens;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.sourcelens.common.exception.GlobalExceptionHandler;
import com.sourcelens.module.analysis.controller.CodeChunkController;
import com.sourcelens.module.analysis.entity.CodeChunk;
import com.sourcelens.module.analysis.service.CodeChunkService;
import com.sourcelens.module.analysis.service.CodeEvidenceProfileService;
import com.sourcelens.module.project.service.ProjectService;
import com.sourcelens.module.scantask.entity.ScanTask;
import com.sourcelens.module.scantask.service.ScanTaskService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class CodeChunkControllerTest {

    private MockMvc mockMvc;

    @Mock private ProjectService projectService;
    @Mock private ScanTaskService scanTaskService;
    @Mock private CodeChunkService codeChunkService;
    @Spy private CodeEvidenceProfileService evidenceProfileService = new CodeEvidenceProfileService();

    @InjectMocks
    private CodeChunkController codeChunkController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(codeChunkController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void search_shouldUseLatestSuccessfulScanWhenScanTaskIdMissing() throws Exception {
        Long projectId = 10L;
        Long userId = 1L;
        ScanTask scanTask = ScanTask.builder().id(42L).projectId(projectId).status("SUCCESS").build();
        CodeChunk chunk = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/AuthService.java")
                .content("class AuthService { void validateToken() {} }")
                .startLine(1)
                .endLine(1)
                .embedding("[1.0,0.0]")
                .build();

        doNothing().when(projectService).verifyOwnership(projectId, userId);
        when(scanTaskService.getOne(any(Wrapper.class))).thenReturn(scanTask);
        when(codeChunkService.normalizeSearchLimit(5)).thenReturn(5);
        when(codeChunkService.countChunks(42L)).thenReturn(3L);
        when(codeChunkService.countEmbeddedChunks(42L)).thenReturn(2L);
        when(codeChunkService.countSearchMatches(42L, "auth token")).thenReturn(1L);
        when(codeChunkService.searchChunks(42L, "auth token", 5)).thenReturn(List.of(chunk));
        when(codeChunkService.matchedTerms(chunk, "auth token")).thenReturn(List.of("auth", "token"));

        mockMvc.perform(get("/api/projects/10/code-chunks/search")
                        .requestAttr("userId", userId)
                        .queryParam("query", "auth token")
                        .queryParam("limit", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.scanTaskId").value(42))
                .andExpect(jsonPath("$.data.total").value(1))
                .andExpect(jsonPath("$.data.resultCount").value(1))
                .andExpect(jsonPath("$.data.totalChunks").value(3))
                .andExpect(jsonPath("$.data.embeddedChunks").value(2))
                .andExpect(jsonPath("$.data.truncated").value(false))
                .andExpect(jsonPath("$.data.retrievalMode").value("KEYWORD"))
                .andExpect(jsonPath("$.data.evidenceProfile.readiness").value("READY"))
                .andExpect(jsonPath("$.data.evidenceProfile.uniqueFiles").value(1))
                .andExpect(jsonPath("$.data.evidenceProfile.dominantEvidenceType").value("SERVICE"))
                .andExpect(jsonPath("$.data.evidenceProfile.evidenceTypeStats[0].type").value("SERVICE"))
                .andExpect(jsonPath("$.data.items[0].filePath").value("src/AuthService.java"))
                .andExpect(jsonPath("$.data.items[0].hasEmbedding").value(true))
                .andExpect(jsonPath("$.data.items[0].matchedTerms[0]").value("auth"))
                .andExpect(jsonPath("$.data.items[0].relevanceScore").isNumber())
                .andExpect(jsonPath("$.data.items[0].evidenceType").value("SERVICE"))
                .andExpect(jsonPath("$.data.items[0].evidenceReason").value(org.hamcrest.Matchers.containsString("Service")))
                .andExpect(jsonPath("$.data.items[0].evidenceReason").value(org.hamcrest.Matchers.containsString("命中 auth / token")))
                .andExpect(jsonPath("$.data.items[0].contextRole").value("PRIMARY"))
                .andExpect(jsonPath("$.data.items[0].contextDistance").value(0));
    }

    @Test
    void search_shouldRejectScanTaskFromAnotherProject() throws Exception {
        Long projectId = 10L;
        Long userId = 1L;
        ScanTask otherProjectScan = ScanTask.builder().id(42L).projectId(11L).status("SUCCESS").build();

        doNothing().when(projectService).verifyOwnership(projectId, userId);
        when(scanTaskService.getDetail(42L)).thenReturn(otherProjectScan);

        mockMvc.perform(get("/api/projects/10/code-chunks/search")
                        .requestAttr("userId", userId)
                        .queryParam("scanTaskId", "42")
                        .queryParam("query", "auth"))
                .andExpect(status().isNotFound());

        verify(codeChunkService, never()).searchChunks(any(), any(), any());
    }

    @Test
    void search_shouldExposeNoScanWhenRequestedScanTaskIsNotSuccessful() throws Exception {
        Long projectId = 10L;
        Long userId = 1L;
        ScanTask runningScan = ScanTask.builder().id(42L).projectId(projectId).status("RUNNING").build();

        doNothing().when(projectService).verifyOwnership(projectId, userId);
        when(scanTaskService.getDetail(42L)).thenReturn(runningScan);
        when(codeChunkService.normalizeSearchLimit(20)).thenReturn(20);

        mockMvc.perform(get("/api/projects/10/code-chunks/search")
                        .requestAttr("userId", userId)
                        .queryParam("scanTaskId", "42")
                        .queryParam("query", "auth"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.scanTaskId").value(42))
                .andExpect(jsonPath("$.data.retrievalMode").value("NO_SCAN"))
                .andExpect(jsonPath("$.data.resultCount").value(0))
                .andExpect(jsonPath("$.data.totalChunks").value(0))
                .andExpect(jsonPath("$.data.embeddedChunks").value(0))
                .andExpect(jsonPath("$.data.items").isEmpty())
                .andExpect(jsonPath("$.data.evidenceProfile.readiness").value("IDLE"));

        verify(codeChunkService, never()).countChunks(any());
        verify(codeChunkService, never()).countEmbeddedChunks(any());
        verify(codeChunkService, never()).countSearchMatches(any(), any());
        verify(codeChunkService, never()).searchChunks(any(), any(), any());
    }
}
