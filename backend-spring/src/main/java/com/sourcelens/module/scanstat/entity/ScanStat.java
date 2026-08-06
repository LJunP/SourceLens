package com.sourcelens.module.scanstat.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 仪表盘统计值对象(非持久化,纯内存计算)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScanStat {
    private long projectCount;
    private long repositoryCount;
    private long totalScans;
    private long successScans;
    private long failedScans;
    private long runningScans;
    private long pendingScans;
    private long agentTaskCount;
    private long agentTaskRunning;
    private long agentTaskCompleted;
    private long issueCount;
    private long issueCompleted;
    // 最新扫描产物的关键指标
    private Long latestTotalFiles;
    private Long latestTotalLines;
    private Long latestTotalDirs;
    private Long latestControllers;
    private Long latestServices;
    private Long latestRiskCount;
    private Long latestCodeChunks;
    private Long latestEmbeddedChunks;
    /** 语言分布 JSON: [{"name":"Java","files":10,"lines":5000},...] */
    private String languagesJson;
    /** Dashboard trusted engineering loop product metrics. */
    private Long trustedLoopCompletionRate;
    private String trustedLoopStatus;
    private String trustedLoopStatusLabel;
    private Long trustedLoopReadyStages;
    private Long trustedLoopTotalStages;
    private Boolean reportEvidenceReady;
    private String codeQaReadiness;
    private String recoverySignal;
    private String trustedLoopMetricsSource;
}
