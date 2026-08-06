package com.sourcelens.module.scanstat.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sourcelens.module.agent.entity.AgentTask;
import com.sourcelens.module.agent.mapper.AgentTaskMapper;
import com.sourcelens.module.analysis.entity.CodeChunk;
import com.sourcelens.module.analysis.mapper.CodeChunkMapper;
import com.sourcelens.module.analysis.entity.ScanArtifact;
import com.sourcelens.module.analysis.mapper.ScanArtifactMapper;
import com.sourcelens.module.artifact.service.ArtifactStorageService;
import com.sourcelens.module.issue.entity.IssueDecomposition;
import com.sourcelens.module.issue.mapper.IssueDecompositionMapper;
import com.sourcelens.module.project.entity.Project;
import com.sourcelens.module.project.mapper.ProjectMapper;
import com.sourcelens.module.repository.entity.Repository;
import com.sourcelens.module.repository.mapper.RepositoryMapper;
import com.sourcelens.module.scantask.entity.ScanTask;
import com.sourcelens.module.scantask.mapper.ScanTaskMapper;
import com.sourcelens.module.scanstat.entity.ScanStat;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScanStatService {

    private static final int MAX_RECENT_SCAN_LIMIT = 100;

    private final ProjectMapper projectMapper;
    private final RepositoryMapper repositoryMapper;
    private final ScanTaskMapper scanTaskMapper;
    private final ScanArtifactMapper scanArtifactMapper;
    private final CodeChunkMapper codeChunkMapper;
    private final ArtifactStorageService artifactStorageService;
    private final AgentTaskMapper agentTaskMapper;
    private final IssueDecompositionMapper issueDecompositionMapper;

    /**
     * 获取当前用户的所有项目 ID 列表(内部缓存复用)
     */
    private List<Long> getUserProjectIds(Long userId) {
        return projectMapper.selectList(
                new LambdaQueryWrapper<Project>()
                        .eq(Project::getCreatedBy, userId)
                        .eq(Project::getDeleted, false)
                        .select(Project::getId)
        ).stream().map(Project::getId).toList();
    }

    /**
     * 获取仪表盘统计概览 — 所有数据均为真实查询
     */
    public ScanStat getStatsByUser(Long userId) {
        List<Long> projectIds = getUserProjectIds(userId);

        long projectCount = projectIds.size();
        if (projectIds.isEmpty()) {
            return applyTrustedLoopMetrics(ScanStat.builder()
                    .projectCount(0)
                    .repositoryCount(0)
                    .build());
        }

        // 仓库数
        long repositoryCount = repositoryMapper.selectCount(
                new LambdaQueryWrapper<Repository>()
                        .in(Repository::getProjectId, projectIds)
                        .eq(Repository::getDeleted, false)
        );

        // 扫描任务状态分布
        List<Map<String, Object>> statusCounts = scanTaskMapper.selectMaps(
                new LambdaQueryWrapper<ScanTask>()
                        .in(ScanTask::getProjectId, projectIds)
                        .eq(ScanTask::getDeleted, false)
                        .select(ScanTask::getStatus, ScanTask::getId)
        );
        Map<String, Long> scanStatus = statusCounts.stream()
                .collect(Collectors.groupingBy(
                        m -> (String) m.get("status"),
                        Collectors.counting()
                ));
        long totalScans = statusCounts.size();

        // Agent 任务统计
        List<Map<String, Object>> agentStatusCounts = agentTaskMapper.selectMaps(
                new LambdaQueryWrapper<AgentTask>()
                        .in(AgentTask::getProjectId, projectIds)
                        .eq(AgentTask::getDeleted, false)
                        .select(AgentTask::getStatus, AgentTask::getId)
        );
        Map<String, Long> agentStatus = agentStatusCounts.stream()
                .collect(Collectors.groupingBy(
                        m -> (String) m.get("status"),
                        Collectors.counting()
                ));

        // Issue 拆解统计
        long issueCount = issueDecompositionMapper.selectCount(
                new LambdaQueryWrapper<IssueDecomposition>()
                        .in(IssueDecomposition::getProjectId, projectIds)
                        .eq(IssueDecomposition::getDeleted, false)
        );
        long issueCompleted = issueDecompositionMapper.selectCount(
                new LambdaQueryWrapper<IssueDecomposition>()
                        .in(IssueDecomposition::getProjectId, projectIds)
                        .eq(IssueDecomposition::getDeleted, false)
                        .eq(IssueDecomposition::getStatus, "COMPLETED")
        );

        // 最新一次成功扫描的产物指标(真实数据)
        Map<String, Object> latestMetrics = getLatestScanMetrics(projectIds);

        return applyTrustedLoopMetrics(ScanStat.builder()
                .projectCount(projectCount)
                .repositoryCount(repositoryCount)
                .totalScans(totalScans)
                .successScans(scanStatus.getOrDefault("SUCCESS", 0L))
                .failedScans(scanStatus.getOrDefault("FAILED", 0L))
                .runningScans(scanStatus.getOrDefault("RUNNING", 0L))
                .pendingScans(scanStatus.getOrDefault("PENDING", 0L))
                .agentTaskCount(agentStatusCounts.size())
                .agentTaskRunning(agentStatus.getOrDefault("RUNNING", 0L))
                .agentTaskCompleted(agentStatus.getOrDefault("COMPLETED", 0L))
                .issueCount(issueCount)
                .issueCompleted(issueCompleted)
                .latestTotalFiles(toLong(latestMetrics.get("totalFiles")))
                .latestTotalLines(toLong(latestMetrics.get("totalLines")))
                .latestTotalDirs(toLong(latestMetrics.get("totalDirs")))
                .latestControllers(toLong(latestMetrics.get("controllers")))
                .latestServices(toLong(latestMetrics.get("services")))
                .latestRiskCount(toLong(latestMetrics.get("riskCount")))
                .latestCodeChunks(toLong(latestMetrics.get("codeChunks")))
                .latestEmbeddedChunks(toLong(latestMetrics.get("embeddedChunks")))
                .languagesJson((String) latestMetrics.get("languagesJson"))
                .build());
    }

    /**
     * 最近扫描任务 — 带项目名、仓库名、耗时等真实信息
     */
    public List<Map<String, Object>> getRecentScans(Long userId, int limit) {
        int safeLimit = normalizeRecentScanLimit(limit);
        List<Long> projectIds = getUserProjectIds(userId);
        if (projectIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<ScanTask> tasks = scanTaskMapper.selectList(
                new LambdaQueryWrapper<ScanTask>()
                        .in(ScanTask::getProjectId, projectIds)
                        .eq(ScanTask::getDeleted, false)
                        .orderByDesc(ScanTask::getCreatedAt)
                        .last("LIMIT " + safeLimit)
        );

        if (tasks.isEmpty()) {
            return Collections.emptyList();
        }

        // 批量查项目名
        Set<Long> taskProjectIds = tasks.stream().map(ScanTask::getProjectId).collect(Collectors.toSet());
        Map<Long, String> projectNames = projectMapper.selectList(
                new LambdaQueryWrapper<Project>()
                        .in(Project::getId, taskProjectIds)
                        .select(Project::getId, Project::getName)
        ).stream().collect(Collectors.toMap(Project::getId, Project::getName));

        // 批量查仓库名
        Set<Long> taskRepoIds = tasks.stream().map(ScanTask::getRepositoryId).collect(Collectors.toSet());
        Map<Long, String> repoNames = repositoryMapper.selectList(
                new LambdaQueryWrapper<Repository>()
                        .in(Repository::getId, taskRepoIds)
                        .select(Repository::getId, Repository::getName)
        ).stream().collect(Collectors.toMap(Repository::getId, Repository::getName));

        return tasks.stream().map(t -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", t.getId());
            map.put("projectId", t.getProjectId());
            map.put("projectName", projectNames.getOrDefault(t.getProjectId(), "未知项目"));
            map.put("repositoryId", t.getRepositoryId());
            map.put("repositoryName", repoNames.getOrDefault(t.getRepositoryId(), "未知仓库"));
            map.put("branch", t.getBranch());
            map.put("commitSha", t.getCommitSha());
            map.put("status", t.getStatus());
            map.put("triggerType", t.getTriggerType());
            map.put("createdAt", t.getCreatedAt());
            map.put("startedAt", t.getStartedAt());
            map.put("finishedAt", t.getFinishedAt());
            map.put("durationMs", calcDurationMs(t));
            map.put("errorMessage", t.getErrorMessage());
            return map;
        }).toList();
    }

    static int normalizeRecentScanLimit(int limit) {
        return Math.min(Math.max(limit, 1), MAX_RECENT_SCAN_LIMIT);
    }

    // ===== 内部方法 =====

    /**
     * 从最新一次成功扫描的 ARCHITECTURE_OVERVIEW 和 CODE_METRICS 产物中提取指标
     */
    private Map<String, Object> getLatestScanMetrics(List<Long> projectIds) {
        Map<String, Object> result = new LinkedHashMap<>();
        try {
            // 找最新一次成功扫描
            List<ScanTask> successTasks = scanTaskMapper.selectList(
                    new LambdaQueryWrapper<ScanTask>()
                            .in(ScanTask::getProjectId, projectIds)
                            .eq(ScanTask::getDeleted, false)
                            .eq(ScanTask::getStatus, "SUCCESS")
                            .orderByDesc(ScanTask::getCreatedAt)
                            .last("LIMIT 1")
            );
            if (successTasks.isEmpty()) {
                return result;
            }
            Long latestTaskId = successTasks.get(0).getId();
            addLatestCodeChunkMetrics(result, latestTaskId);

            ObjectMapper mapper = new ObjectMapper();

            // 读 ARCHITECTURE_OVERVIEW 产物
            Map<String, Object> overview = getScanArtifactData(latestTaskId, "ARCHITECTURE_OVERVIEW");
            if (!overview.isEmpty()) {
                var node = mapper.valueToTree(overview);
                result.put("totalFiles", node.path("totalFiles").asInt(0));
                result.put("totalDirs", node.path("totalDirs").asInt(0));
                result.put("totalLines", node.path("totalLines").asInt(0));
                result.put("controllers", node.path("controllers").asInt(0));
                result.put("services", node.path("services").asInt(0));
                // 语言分布
                var langs = node.path("languages");
                if (!langs.isMissingNode()) {
                    result.put("languagesJson", langs.toString());
                }
            }

            // 读 CODE_METRICS 产物(补充大文件、测试文件等)
            Map<String, Object> metrics = getScanArtifactData(latestTaskId, "CODE_METRICS");
            if (!metrics.isEmpty()) {
                var node = mapper.valueToTree(metrics);
                if (!result.containsKey("totalFiles")) {
                    result.put("totalFiles", node.path("totalFiles").asInt(0));
                    result.put("totalLines", node.path("totalLines").asInt(0));
                }
            }

            // 读 ARCHITECTURE_REPORT 产物(提取风险数量)
            Map<String, Object> report = getScanArtifactData(latestTaskId, "ARCHITECTURE_REPORT");
            if (!report.isEmpty()) {
                var node = mapper.valueToTree(report);
                var risks = node.path("codeQuality").path("risks");
                if (risks.isArray()) {
                    result.put("riskCount", risks.size());
                }
            }
        } catch (Exception e) {
            log.warn("获取最新扫描指标失败: {}", e.getMessage());
        }
        return result;
    }

    private void addLatestCodeChunkMetrics(Map<String, Object> result, Long latestTaskId) {
        Long totalChunks = codeChunkMapper.selectCount(new LambdaQueryWrapper<CodeChunk>()
                .eq(CodeChunk::getScanTaskId, latestTaskId));
        Long embeddedChunks = codeChunkMapper.selectCount(new LambdaQueryWrapper<CodeChunk>()
                .eq(CodeChunk::getScanTaskId, latestTaskId)
                .isNotNull(CodeChunk::getEmbedding)
                .ne(CodeChunk::getEmbedding, ""));
        result.put("codeChunks", totalChunks);
        result.put("embeddedChunks", embeddedChunks);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> getScanArtifactData(Long scanTaskId, String artifactType) throws Exception {
        Map<String, Object> artifacts = artifactStorageService.readJsonMapArtifactsByOwner("SCAN_TASK", scanTaskId);
        Object artifact = artifacts.get(artifactType);
        if (artifact instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }

        ScanArtifact legacy = scanArtifactMapper.selectOne(
                new LambdaQueryWrapper<ScanArtifact>()
                        .eq(ScanArtifact::getScanTaskId, scanTaskId)
                        .eq(ScanArtifact::getArtifactType, artifactType)
        );
        if (legacy == null || legacy.getSummaryJson() == null) {
            return Collections.emptyMap();
        }
        return new ObjectMapper().readValue(legacy.getSummaryJson(), Map.class);
    }

    private Long calcDurationMs(ScanTask t) {
        if (t.getStartedAt() == null || t.getFinishedAt() == null) {
            return null;
        }
        return java.time.Duration.between(t.getStartedAt(), t.getFinishedAt()).toMillis();
    }

    private Long toLong(Object val) {
        if (val == null) return null;
        if (val instanceof Number n) return n.longValue();
        return null;
    }

    static ScanStat applyTrustedLoopMetrics(ScanStat stat) {
        long activeScans = stat.getRunningScans() + stat.getPendingScans();
        long riskCount = stat.getLatestRiskCount() == null ? 0 : stat.getLatestRiskCount();
        boolean repositoryReady = stat.getRepositoryCount() > 0;
        boolean scanReady = activeScans == 0 && stat.getSuccessScans() > 0;
        boolean latestAnalysisReady = stat.getLatestTotalFiles() != null;
        boolean codeKnowledgeReady = stat.getLatestCodeChunks() != null && stat.getLatestCodeChunks() > 0;
        boolean nextStepReady = codeKnowledgeReady || riskCount > 0;

        long readyStages = 0;
        if (repositoryReady) readyStages += 1;
        if (scanReady) readyStages += 1;
        if (codeKnowledgeReady) readyStages += 1;
        if (nextStepReady) readyStages += 1;

        long totalStages = 4;
        long completionRate = Math.round((readyStages * 100.0) / totalStages);
        String status;
        String statusLabel;
        if (completionRate >= 100 && riskCount == 0) {
            status = "ready";
            statusLabel = "闭环可用";
        } else if (completionRate >= 50) {
            status = "warning";
            statusLabel = "需要复核";
        } else {
            status = "idle";
            statusLabel = "等待启动";
        }

        stat.setTrustedLoopCompletionRate(completionRate);
        stat.setTrustedLoopStatus(status);
        stat.setTrustedLoopStatusLabel(statusLabel);
        stat.setTrustedLoopReadyStages(readyStages);
        stat.setTrustedLoopTotalStages(totalStages);
        stat.setReportEvidenceReady(stat.getSuccessScans() > 0);
        stat.setCodeQaReadiness(codeKnowledgeReady ? "READY" : latestAnalysisReady ? "REVIEW" : "GAP");
        stat.setRecoverySignal(activeScans > 0 ? "RUNNING" : riskCount > 0 ? "RISK" : "OK");
        stat.setTrustedLoopMetricsSource("API");
        return stat;
    }
}
