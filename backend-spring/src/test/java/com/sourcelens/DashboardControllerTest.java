package com.sourcelens;

import com.sourcelens.module.dashboard.controller.DashboardController;
import com.sourcelens.module.scanstat.entity.ScanStat;
import com.sourcelens.module.scanstat.service.ScanStatService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class DashboardControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ScanStatService scanStatService;

    @InjectMocks
    private DashboardController dashboardController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(dashboardController).build();
    }

    @Test
    void stats_shouldExposeLatestCodeChunkReadinessMetrics() throws Exception {
        Long userId = 7L;
        when(scanStatService.getStatsByUser(userId)).thenReturn(ScanStat.builder()
                .projectCount(1)
                .repositoryCount(1)
                .latestTotalFiles(128L)
                .latestTotalLines(4096L)
                .latestCodeChunks(64L)
                .latestEmbeddedChunks(16L)
                .latestRiskCount(2L)
                .trustedLoopCompletionRate(100L)
                .trustedLoopStatus("warning")
                .trustedLoopStatusLabel("需要复核")
                .trustedLoopReadyStages(4L)
                .trustedLoopTotalStages(4L)
                .reportEvidenceReady(true)
                .codeQaReadiness("READY")
                .recoverySignal("RISK")
                .trustedLoopMetricsSource("API")
                .build());

        mockMvc.perform(get("/api/dashboard/stats").requestAttr("userId", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.latestTotalFiles").value(128))
                .andExpect(jsonPath("$.data.latestCodeChunks").value(64))
                .andExpect(jsonPath("$.data.latestEmbeddedChunks").value(16))
                .andExpect(jsonPath("$.data.latestRiskCount").value(2))
                .andExpect(jsonPath("$.data.trustedLoopCompletionRate").value(100))
                .andExpect(jsonPath("$.data.trustedLoopStatus").value("warning"))
                .andExpect(jsonPath("$.data.trustedLoopStatusLabel").value("需要复核"))
                .andExpect(jsonPath("$.data.trustedLoopReadyStages").value(4))
                .andExpect(jsonPath("$.data.trustedLoopTotalStages").value(4))
                .andExpect(jsonPath("$.data.reportEvidenceReady").value(true))
                .andExpect(jsonPath("$.data.codeQaReadiness").value("READY"))
                .andExpect(jsonPath("$.data.recoverySignal").value("RISK"))
                .andExpect(jsonPath("$.data.trustedLoopMetricsSource").value("API"));
    }

    @Test
    void recentScans_shouldDelegateLimitNormalizationToService() throws Exception {
        Long userId = 7L;
        when(scanStatService.getRecentScans(userId, 12)).thenReturn(List.of());

        mockMvc.perform(get("/api/dashboard/recent-scans")
                        .requestAttr("userId", userId)
                        .queryParam("limit", "12"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());
    }
}
