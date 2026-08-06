package com.sourcelens.module.scanstat.service;

import com.sourcelens.module.scanstat.entity.ScanStat;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ScanStatServiceTest {

    @Test
    void normalizeRecentScanLimit_shouldClampToSafeRange() {
        assertEquals(1, ScanStatService.normalizeRecentScanLimit(-10));
        assertEquals(1, ScanStatService.normalizeRecentScanLimit(0));
        assertEquals(10, ScanStatService.normalizeRecentScanLimit(10));
        assertEquals(100, ScanStatService.normalizeRecentScanLimit(1000));
    }

    @Test
    void applyTrustedLoopMetrics_shouldComputeApiBackedDashboardSignals() {
        ScanStat stat = ScanStat.builder()
                .repositoryCount(1)
                .successScans(1)
                .failedScans(0)
                .runningScans(0)
                .pendingScans(0)
                .latestTotalFiles(128L)
                .latestCodeChunks(64L)
                .latestRiskCount(0L)
                .build();

        ScanStat result = ScanStatService.applyTrustedLoopMetrics(stat);

        assertEquals(100L, result.getTrustedLoopCompletionRate());
        assertEquals("ready", result.getTrustedLoopStatus());
        assertEquals("闭环可用", result.getTrustedLoopStatusLabel());
        assertEquals(4L, result.getTrustedLoopReadyStages());
        assertEquals(4L, result.getTrustedLoopTotalStages());
        assertTrue(result.getReportEvidenceReady());
        assertEquals("READY", result.getCodeQaReadiness());
        assertEquals("OK", result.getRecoverySignal());
        assertEquals("API", result.getTrustedLoopMetricsSource());
    }

    @Test
    void applyTrustedLoopMetrics_shouldSurfaceRiskAndReadinessGaps() {
        ScanStat stat = ScanStat.builder()
                .repositoryCount(1)
                .successScans(1)
                .runningScans(0)
                .pendingScans(0)
                .latestTotalFiles(128L)
                .latestCodeChunks(0L)
                .latestRiskCount(3L)
                .build();

        ScanStat result = ScanStatService.applyTrustedLoopMetrics(stat);

        assertEquals(75L, result.getTrustedLoopCompletionRate());
        assertEquals("warning", result.getTrustedLoopStatus());
        assertEquals("需要复核", result.getTrustedLoopStatusLabel());
        assertEquals(3L, result.getTrustedLoopReadyStages());
        assertTrue(result.getReportEvidenceReady());
        assertEquals("REVIEW", result.getCodeQaReadiness());
        assertEquals("RISK", result.getRecoverySignal());
    }

    @Test
    void applyTrustedLoopMetrics_shouldMarkEmptyWorkspaceAsWaiting() {
        ScanStat result = ScanStatService.applyTrustedLoopMetrics(ScanStat.builder().build());

        assertEquals(0L, result.getTrustedLoopCompletionRate());
        assertEquals("idle", result.getTrustedLoopStatus());
        assertEquals("等待启动", result.getTrustedLoopStatusLabel());
        assertEquals(0L, result.getTrustedLoopReadyStages());
        assertFalse(result.getReportEvidenceReady());
        assertEquals("GAP", result.getCodeQaReadiness());
        assertEquals("OK", result.getRecoverySignal());
    }
}
