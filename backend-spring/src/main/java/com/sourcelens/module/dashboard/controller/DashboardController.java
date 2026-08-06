package com.sourcelens.module.dashboard.controller;

import com.sourcelens.common.Result;
import com.sourcelens.module.scanstat.service.ScanStatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Tag(name = "仪表盘")
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final ScanStatService scanStatService;

    @Operation(summary = "获取仪表盘统计数据")
    @GetMapping("/stats")
    public Result<Map<String, Object>> stats(@RequestAttribute("userId") Long userId) {
        var stat = scanStatService.getStatsByUser(userId);
        var data = new LinkedHashMap<String, Object>();
        data.put("projectCount", stat.getProjectCount());
        data.put("repositoryCount", stat.getRepositoryCount());
        data.put("totalScans", stat.getTotalScans());
        data.put("successScans", stat.getSuccessScans());
        data.put("failedScans", stat.getFailedScans());
        data.put("runningScans", stat.getRunningScans());
        data.put("pendingScans", stat.getPendingScans());
        data.put("agentTaskCount", stat.getAgentTaskCount());
        data.put("agentTaskRunning", stat.getAgentTaskRunning());
        data.put("agentTaskCompleted", stat.getAgentTaskCompleted());
        data.put("issueCount", stat.getIssueCount());
        data.put("issueCompleted", stat.getIssueCompleted());
        data.put("latestTotalFiles", stat.getLatestTotalFiles());
        data.put("latestTotalLines", stat.getLatestTotalLines());
        data.put("latestTotalDirs", stat.getLatestTotalDirs());
        data.put("latestControllers", stat.getLatestControllers());
        data.put("latestServices", stat.getLatestServices());
        data.put("latestRiskCount", stat.getLatestRiskCount());
        data.put("latestCodeChunks", stat.getLatestCodeChunks());
        data.put("latestEmbeddedChunks", stat.getLatestEmbeddedChunks());
        data.put("languagesJson", stat.getLanguagesJson());
        data.put("trustedLoopCompletionRate", stat.getTrustedLoopCompletionRate());
        data.put("trustedLoopStatus", stat.getTrustedLoopStatus());
        data.put("trustedLoopStatusLabel", stat.getTrustedLoopStatusLabel());
        data.put("trustedLoopReadyStages", stat.getTrustedLoopReadyStages());
        data.put("trustedLoopTotalStages", stat.getTrustedLoopTotalStages());
        data.put("reportEvidenceReady", stat.getReportEvidenceReady());
        data.put("codeQaReadiness", stat.getCodeQaReadiness());
        data.put("recoverySignal", stat.getRecoverySignal());
        data.put("trustedLoopMetricsSource", stat.getTrustedLoopMetricsSource());
        return Result.ok(data);
    }

    @Operation(summary = "获取最近扫描任务(含项目名、仓库名、耗时)")
    @GetMapping("/recent-scans")
    public Result<List<Map<String, Object>>> recentScans(
            @RequestAttribute("userId") Long userId,
            @RequestParam(defaultValue = "10") int limit) {
        return Result.ok(scanStatService.getRecentScans(userId, limit));
    }
}
