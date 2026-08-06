package com.sourcelens;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.sourcelens.common.exception.GlobalExceptionHandler;
import com.sourcelens.module.analysis.controller.CodeChunkController;
import com.sourcelens.module.analysis.dto.CodeChunkStatusCounts;
import com.sourcelens.module.analysis.entity.CodeChunk;
import com.sourcelens.module.analysis.service.CodeChunkService;
import com.sourcelens.module.analysis.service.CodeEvidenceProfileService;
import com.sourcelens.module.project.service.ProjectService;
import com.sourcelens.module.scantask.entity.ScanTask;
import com.sourcelens.module.scantask.service.ScanTaskService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
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
                .workspaceRoot("backend-spring")
                .moduleRoot("backend-spring")
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
                .andExpect(jsonPath("$.data.items[0].citationId").value("code-chunk:99"))
                .andExpect(jsonPath("$.data.items[0].sourceLabel").value("C1"))
                .andExpect(jsonPath("$.data.items[0].filePath").value("src/AuthService.java"))
                .andExpect(jsonPath("$.data.items[0].workspaceRoot").value("backend-spring"))
                .andExpect(jsonPath("$.data.items[0].moduleRoot").value("backend-spring"))
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
    void search_shouldPassSourceUrlQueryThroughWithoutLeakingRawUrlFields() throws Exception {
        Long projectId = 10L;
        Long userId = 1L;
        String sourceUrlQuery = "http://localhost:5173/src/pages/ProjectDetail.tsx?t=1782991000000:245:19";
        ScanTask scanTask = ScanTask.builder().id(42L).projectId(projectId).status("SUCCESS").build();
        CodeChunk chunk = CodeChunk.builder()
                .id(199L)
                .scanTaskId(42L)
                .filePath("web-console/src/pages/ProjectDetail.tsx")
                .content("async function submitQa() { return projectApi.qa(); }")
                .startLine(241)
                .endLine(260)
                .build();

        doNothing().when(projectService).verifyOwnership(projectId, userId);
        when(scanTaskService.getDetail(42L)).thenReturn(scanTask);
        when(codeChunkService.normalizeSearchLimit(3)).thenReturn(3);
        when(codeChunkService.countChunks(42L)).thenReturn(6L);
        when(codeChunkService.countEmbeddedChunks(42L)).thenReturn(4L);
        when(codeChunkService.countSearchMatches(42L, sourceUrlQuery)).thenReturn(1L);
        when(codeChunkService.hasAuxiliarySearchHints(sourceUrlQuery)).thenReturn(true);
        when(codeChunkService.searchChunks(42L, sourceUrlQuery, 3)).thenReturn(List.of(chunk));
        when(codeChunkService.matchedTerms(chunk, sourceUrlQuery)).thenReturn(List.of("projectdetail"));

        mockMvc.perform(get("/api/projects/10/code-chunks/search")
                        .requestAttr("userId", userId)
                        .queryParam("scanTaskId", "42")
                        .queryParam("query", sourceUrlQuery)
                        .queryParam("limit", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.scanTaskId").value(42))
                .andExpect(jsonPath("$.data.query").value(sourceUrlQuery))
                .andExpect(jsonPath("$.data.resultCount").value(1))
                .andExpect(jsonPath("$.data.retrievalMode").value("HYBRID"))
                .andExpect(jsonPath("$.data.items[0].citationId").value("code-chunk:199"))
                .andExpect(jsonPath("$.data.items[0].sourceLabel").value("C1"))
                .andExpect(jsonPath("$.data.items[0].filePath").value("web-console/src/pages/ProjectDetail.tsx"))
                .andExpect(jsonPath("$.data.items[0].startLine").value(241))
                .andExpect(jsonPath("$.data.items[0].endLine").value(260))
                .andExpect(jsonPath("$.data.items[0].evidenceType").value("FRONTEND"))
                .andExpect(jsonPath("$.data.items[0].rawUrl").doesNotExist())
                .andExpect(jsonPath("$.data.items[0].sourceUrl").doesNotExist())
                .andExpect(jsonPath("$.data.items[0].normalizedSourceUrl").doesNotExist())
                .andExpect(jsonPath("$.data.items[0].query").doesNotExist());

        ArgumentCaptor<String> queryCaptor = ArgumentCaptor.forClass(String.class);
        verify(codeChunkService).searchChunks(org.mockito.ArgumentMatchers.eq(42L), queryCaptor.capture(), org.mockito.ArgumentMatchers.eq(3));
        assertEquals(sourceUrlQuery, queryCaptor.getValue());
    }

    @Test
    void search_shouldNotExposeAbsoluteRootMetadataFromStoredChunks() throws Exception {
        Long projectId = 10L;
        Long userId = 1L;
        String query = "login";
        ScanTask scanTask = ScanTask.builder().id(42L).projectId(projectId).status("SUCCESS").build();
        CodeChunk chunk = CodeChunk.builder()
                .id(200L)
                .scanTaskId(42L)
                .filePath("packages/admin/src/pages/Login.tsx")
                .workspaceRoot("/Users/lijunpeng/Desktop/cc/project/SourceLens/packages/admin")
                .moduleRoot("packages/admin/..")
                .content("export function Login() { return null; }")
                .startLine(1)
                .endLine(20)
                .build();
        CodeChunk windowsDriveChunk = CodeChunk.builder()
                .id(201L)
                .scanTaskId(42L)
                .filePath("packages/admin/src/pages/Windows.tsx")
                .workspaceRoot("C:Users/lijunpeng/project/packages/admin")
                .moduleRoot("..")
                .content("export function Windows() { return null; }")
                .startLine(1)
                .endLine(20)
                .build();

        doNothing().when(projectService).verifyOwnership(projectId, userId);
        when(scanTaskService.getDetail(42L)).thenReturn(scanTask);
        when(codeChunkService.normalizeSearchLimit(3)).thenReturn(3);
        when(codeChunkService.countChunks(42L)).thenReturn(1L);
        when(codeChunkService.countEmbeddedChunks(42L)).thenReturn(0L);
        when(codeChunkService.countSearchMatches(42L, query)).thenReturn(2L);
        when(codeChunkService.hasAuxiliarySearchHints(query)).thenReturn(false);
        when(codeChunkService.searchChunks(42L, query, 3)).thenReturn(List.of(chunk, windowsDriveChunk));
        when(codeChunkService.matchedTerms(chunk, query)).thenReturn(List.of("login"));
        when(codeChunkService.matchedTerms(windowsDriveChunk, query)).thenReturn(List.of("login"));

        mockMvc.perform(get("/api/projects/10/code-chunks/search")
                        .requestAttr("userId", userId)
                        .queryParam("scanTaskId", "42")
                        .queryParam("query", query)
                        .queryParam("limit", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].filePath").value("packages/admin/src/pages/Login.tsx"))
                .andExpect(jsonPath("$.data.items[0].workspaceRoot").doesNotExist())
                .andExpect(jsonPath("$.data.items[0].moduleRoot").doesNotExist())
                .andExpect(jsonPath("$.data.items[1].filePath").value("packages/admin/src/pages/Windows.tsx"))
                .andExpect(jsonPath("$.data.items[1].workspaceRoot").doesNotExist())
                .andExpect(jsonPath("$.data.items[1].moduleRoot").doesNotExist());
    }

    @Test
    void search_shouldKeepStableFallbackForLineOnlyQueryWithoutSearchContext() throws Exception {
        Long projectId = 10L;
        Long userId = 1L;
        String query = "line 85";
        ScanTask scanTask = ScanTask.builder().id(42L).projectId(projectId).status("SUCCESS").build();
        CodeChunk chunk = CodeChunk.builder()
                .id(399L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/AuthService.java")
                .content("class AuthService {}")
                .startLine(1)
                .endLine(40)
                .build();

        doNothing().when(projectService).verifyOwnership(projectId, userId);
        when(scanTaskService.getDetail(42L)).thenReturn(scanTask);
        when(codeChunkService.normalizeSearchLimit(5)).thenReturn(5);
        when(codeChunkService.countChunks(42L)).thenReturn(12L);
        when(codeChunkService.countEmbeddedChunks(42L)).thenReturn(0L);
        when(codeChunkService.hasAuxiliarySearchHints(query)).thenReturn(false);
        when(codeChunkService.searchChunks(42L, query, 5)).thenReturn(List.of(chunk));
        when(codeChunkService.matchedTerms(chunk, query)).thenReturn(List.of());

        mockMvc.perform(get("/api/projects/10/code-chunks/search")
                        .requestAttr("userId", userId)
                        .queryParam("scanTaskId", "42")
                        .queryParam("query", query)
                        .queryParam("limit", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.retrievalMode").value("STABLE_FALLBACK"))
                .andExpect(jsonPath("$.data.evidenceProfile.summary").value(org.hamcrest.Matchers.containsString("稳定回退")));
    }

    @Test
    void status_shouldUseLightweightStatusContractWithoutSearchCounting() throws Exception {
        Long projectId = 10L;
        Long userId = 1L;
        ScanTask scanTask = ScanTask.builder().id(42L).projectId(projectId).status("SUCCESS").build();
        CodeChunkStatusCounts counts = new CodeChunkStatusCounts();
        counts.setTotalChunks(17001L);
        counts.setEmbeddedChunks(17001L);
        CodeChunk sample = CodeChunk.builder()
                .id(900L)
                .scanTaskId(42L)
                .filePath("README.md")
                .content("")
                .startLine(1)
                .endLine(2)
                .embedding("__present__")
                .build();

        doNothing().when(projectService).verifyOwnership(projectId, userId);
        when(scanTaskService.getDetail(42L)).thenReturn(scanTask);
        when(codeChunkService.normalizeSearchLimit(1)).thenReturn(1);
        when(codeChunkService.getStatusCounts(42L)).thenReturn(counts);
        when(codeChunkService.getStatusSample(42L)).thenReturn(sample);
        when(codeChunkService.matchedTerms(sample, "")).thenReturn(List.of());

        mockMvc.perform(get("/api/projects/10/code-chunks/status")
                        .requestAttr("userId", userId)
                        .queryParam("scanTaskId", "42")
                        .queryParam("limit", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.scanTaskId").value(42))
                .andExpect(jsonPath("$.data.query").value(""))
                .andExpect(jsonPath("$.data.total").value(17001))
                .andExpect(jsonPath("$.data.totalChunks").value(17001))
                .andExpect(jsonPath("$.data.embeddedChunks").value(17001))
                .andExpect(jsonPath("$.data.resultCount").value(1))
                .andExpect(jsonPath("$.data.truncated").value(true))
                .andExpect(jsonPath("$.data.retrievalMode").value("STABLE_FALLBACK"))
                .andExpect(jsonPath("$.data.items[0].filePath").value("README.md"))
                .andExpect(jsonPath("$.data.items[0].hasEmbedding").value(true));

        verify(codeChunkService, never()).countChunks(any());
        verify(codeChunkService, never()).countEmbeddedChunks(any());
        verify(codeChunkService, never()).countSearchMatches(any(), any());
        verify(codeChunkService, never()).searchChunks(any(), any(), any());
    }

    @Test
    void search_shouldExposeHybridModeForAuxiliaryStructuralRecall() throws Exception {
        Long projectId = 10L;
        Long userId = 1L;
        String query = "AuthService 单元测试文件在哪里";
        ScanTask scanTask = ScanTask.builder().id(42L).projectId(projectId).status("SUCCESS").build();
        CodeChunk chunk = CodeChunk.builder()
                .id(299L)
                .scanTaskId(42L)
                .filePath("backend-spring/src/test/java/com/example/AuthServiceTest.java")
                .content("class AuthServiceTest { @Test void login_shouldReturnToken() {} }")
                .startLine(1)
                .endLine(80)
                .build();

        doNothing().when(projectService).verifyOwnership(projectId, userId);
        when(scanTaskService.getDetail(42L)).thenReturn(scanTask);
        when(codeChunkService.normalizeSearchLimit(5)).thenReturn(5);
        when(codeChunkService.countChunks(42L)).thenReturn(12L);
        when(codeChunkService.countEmbeddedChunks(42L)).thenReturn(0L);
        when(codeChunkService.countSearchMatches(42L, query)).thenReturn(1L);
        when(codeChunkService.hasAuxiliarySearchHints(query)).thenReturn(true);
        when(codeChunkService.searchChunks(42L, query, 5)).thenReturn(List.of(chunk));
        when(codeChunkService.matchedTerms(chunk, query)).thenReturn(List.of("AuthService", "单元测试"));

        mockMvc.perform(get("/api/projects/10/code-chunks/search")
                        .requestAttr("userId", userId)
                        .queryParam("scanTaskId", "42")
                        .queryParam("query", query)
                        .queryParam("limit", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.retrievalMode").value("HYBRID"))
                .andExpect(jsonPath("$.data.evidenceProfile.summary").value(org.hamcrest.Matchers.containsString("混合召回")))
                .andExpect(jsonPath("$.data.items[0].filePath").value("backend-spring/src/test/java/com/example/AuthServiceTest.java"))
                .andExpect(jsonPath("$.data.items[0].evidenceType").value("TEST"));
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
