package com.sourcelens.module.scantask.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sourcelens.common.exception.BizException;
import com.sourcelens.module.agent.entity.AgentTask;
import com.sourcelens.module.agent.entity.AgentToolCall;
import com.sourcelens.module.agent.mapper.AgentTaskMapper;
import com.sourcelens.module.agent.mapper.AgentToolCallMapper;
import com.sourcelens.module.artifact.dto.ArtifactRecordResponse;
import com.sourcelens.module.artifact.entity.ArtifactRecord;
import com.sourcelens.module.artifact.mapper.ArtifactRecordMapper;
import com.sourcelens.module.audit.entity.AuditLog;
import com.sourcelens.module.audit.mapper.AuditLogMapper;
import com.sourcelens.module.autorepair.entity.AutoRepair;
import com.sourcelens.module.autorepair.mapper.AutoRepairMapper;
import com.sourcelens.module.execution.dto.ExecutionTaskDetailResponse;
import com.sourcelens.module.execution.entity.ExecutionTask;
import com.sourcelens.module.execution.service.ExecutionTaskService;
import com.sourcelens.module.scantask.dto.ScanGovernanceTimelineResponse;
import com.sourcelens.module.scantask.dto.ScanGovernanceTimelineResponse.ActionTarget;
import com.sourcelens.module.scantask.dto.ScanGovernanceTimelineResponse.Attribution;
import com.sourcelens.module.scantask.dto.ScanGovernanceTimelineResponse.AttributionGap;
import com.sourcelens.module.scantask.dto.ScanGovernanceTimelineResponse.GovernanceEvent;
import com.sourcelens.module.scantask.dto.ScanGovernanceTimelineResponse.GovernanceResources;
import com.sourcelens.module.scantask.dto.ScanGovernanceTimelineResponse.GovernanceSummary;
import com.sourcelens.module.scantask.dto.ScanGovernanceTimelineResponse.LimitInfo;
import com.sourcelens.module.scantask.dto.ScanGovernanceTimelineResponse.ResourceRef;
import com.sourcelens.module.scantask.entity.ScanTask;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class ScanTaskGovernanceTimelineService {

    private static final int RESOURCE_LIMIT = 10;
    private static final int EVENT_LIMIT = 30;
    private static final ObjectMapper JSON = new ObjectMapper();

    private final ScanTaskService scanTaskService;
    private final AutoRepairMapper autoRepairMapper;
    private final AgentTaskMapper agentTaskMapper;
    private final AgentToolCallMapper agentToolCallMapper;
    private final AuditLogMapper auditLogMapper;
    private final ArtifactRecordMapper artifactRecordMapper;
    private final ExecutionTaskService executionTaskService;

    public ScanGovernanceTimelineResponse getTimeline(Long projectId, Long scanTaskId) {
        ScanTask scanTask = scanTaskService.getDetail(scanTaskId);
        if (!projectId.equals(scanTask.getProjectId())) {
            throw BizException.notFound("ScanTask");
        }

        CountedList<AutoRepair> autoRepairs = listAutoRepairs(projectId, scanTaskId);
        CountedList<AgentTask> agentTasks = listAgentTasks(projectId, scanTaskId);
        CountedList<AgentToolCall> agentToolCalls = listAgentToolCalls(projectId, scanTaskId);
        List<Long> autoRepairIds = autoRepairs.items().stream().map(AutoRepair::getId).filter(Objects::nonNull).toList();
        List<Long> agentTaskIds = agentTasks.items().stream().map(AgentTask::getId).filter(Objects::nonNull).toList();
        CountedList<AuditLog> auditLogs = listAuditLogs(projectId, scanTaskId, autoRepairIds, agentTaskIds);
        CountedList<ArtifactRecord> artifacts = listArtifacts(projectId, scanTaskId, autoRepairIds, agentTaskIds);

        ExecutionTaskDetailResponse scanExecution = executionDetail(projectId, "SCAN_TASK", scanTaskId);
        List<ExecutionTaskDetailResponse> repairExecutions = autoRepairs.items().stream()
                .map(repair -> executionDetail(projectId, "AUTO_REPAIR", repair.getId()))
                .filter(Objects::nonNull)
                .toList();
        List<ExecutionTaskDetailResponse> agentExecutions = agentTasks.items().stream()
                .map(task -> executionDetail(projectId, "AGENT_TASK", task.getId()))
                .filter(Objects::nonNull)
                .toList();

        List<GovernanceEvent> allEvents = buildEvents(projectId, scanTask, autoRepairs.items(), agentTasks.items(),
                agentToolCalls.items(), auditLogs.items(), artifacts.items(), scanExecution, repairExecutions, agentExecutions);
        allEvents.sort(Comparator.comparing(ScanTaskGovernanceTimelineService::eventTime).reversed());
        boolean eventsTruncated = allEvents.size() > EVENT_LIMIT;
        List<GovernanceEvent> events = allEvents.stream().limit(EVENT_LIMIT).toList();

        Map<String, LimitInfo> limits = new LinkedHashMap<>();
        limits.put("autoRepairs", limitInfo(autoRepairs));
        limits.put("agentTasks", limitInfo(agentTasks));
        limits.put("agentToolCalls", limitInfo(agentToolCalls));
        limits.put("auditLogs", limitInfo(auditLogs));
        limits.put("artifacts", limitInfo(artifacts));
        limits.put("events", LimitInfo.builder()
                .limit(EVENT_LIMIT)
                .total((long) allEvents.size())
                .returned(events.size())
                .truncated(eventsTruncated)
                .build());

        Map<String, Long> counts = new LinkedHashMap<>();
        counts.put("autoRepairs", autoRepairs.total());
        counts.put("agentTasks", agentTasks.total());
        counts.put("agentToolCalls", agentToolCalls.total());
        counts.put("auditLogs", auditLogs.total());
        counts.put("artifacts", artifacts.total());
        counts.put("scanExecutions", scanExecution == null ? 0L : 1L);
        counts.put("repairExecutions", (long) repairExecutions.size());
        counts.put("agentExecutions", (long) agentExecutions.size());

        List<String> warnings = new ArrayList<>();
        limits.forEach((key, value) -> {
            if (Boolean.TRUE.equals(value.getTruncated())) {
                warnings.add(key + " exceeded limit " + value.getLimit());
            }
        });

        List<AttributionGap> attributionGaps = new ArrayList<>();
        if (autoRepairs.total() == 0 && agentTasks.total() == 0 && agentToolCalls.total() == 0 && auditLogs.total() == 0) {
            attributionGaps.add(AttributionGap.builder()
                    .resourceType("SCAN_TASK")
                    .resourceId(scanTaskId)
                    .reason("当前扫描尚未形成修复、Agent、工具或审计治理记录")
                    .build());
        }

        boolean hasErrors = hasError(scanTask.getStatus())
                || autoRepairs.items().stream().anyMatch(item -> hasError(item.getStatus()))
                || agentTasks.items().stream().anyMatch(item -> hasError(item.getStatus()))
                || agentToolCalls.items().stream().anyMatch(call -> Boolean.FALSE.equals(call.getSuccess()))
                || auditLogs.items().stream().anyMatch(log -> hasError(log.getStatus()))
                || repairExecutions.stream().anyMatch(detail -> detail.getTask() != null && hasError(detail.getTask().getStatus()))
                || agentExecutions.stream().anyMatch(detail -> detail.getTask() != null && hasError(detail.getTask().getStatus()));

        boolean truncated = eventsTruncated || limits.values().stream().anyMatch(item -> Boolean.TRUE.equals(item.getTruncated()));

        return ScanGovernanceTimelineResponse.builder()
                .projectId(projectId)
                .repositoryId(scanTask.getRepositoryId())
                .scanTaskId(scanTaskId)
                .scanStatus(scanTask.getStatus())
                .generatedAt(LocalDateTime.now())
                .summary(GovernanceSummary.builder()
                        .status(hasErrors ? "ATTENTION" : truncated ? "PARTIAL" : "BOUND")
                        .counts(counts)
                        .hasErrors(hasErrors)
                        .attributionGapCount(attributionGaps.size())
                        .build())
                .resources(GovernanceResources.builder()
                        .artifacts(artifacts.items().stream().map(ArtifactRecordResponse::from).toList())
                        .scanExecution(scanExecution)
                        .repairExecutions(repairExecutions)
                        .agentExecutions(agentExecutions)
                        .autoRepairs(autoRepairs.items())
                        .agentTasks(agentTasks.items())
                        .agentToolCalls(agentToolCalls.items())
                        .auditLogs(auditLogs.items())
                        .build())
                .events(events)
                .limits(limits)
                .truncated(truncated)
                .warnings(warnings)
                .attributionGaps(attributionGaps)
                .build();
    }

    private CountedList<AutoRepair> listAutoRepairs(Long projectId, Long scanTaskId) {
        long total = autoRepairMapper.selectCount(new LambdaQueryWrapper<AutoRepair>()
                .eq(AutoRepair::getProjectId, projectId)
                .eq(AutoRepair::getScanTaskId, scanTaskId));
        List<AutoRepair> items = autoRepairMapper.selectList(new LambdaQueryWrapper<AutoRepair>()
                .eq(AutoRepair::getProjectId, projectId)
                .eq(AutoRepair::getScanTaskId, scanTaskId)
                .orderByDesc(AutoRepair::getCreatedAt)
                .orderByDesc(AutoRepair::getId)
                .last("LIMIT " + RESOURCE_LIMIT));
        return new CountedList<>(items, total);
    }

    private CountedList<AgentTask> listAgentTasks(Long projectId, Long scanTaskId) {
        long total = agentTaskMapper.selectCount(new LambdaQueryWrapper<AgentTask>()
                .eq(AgentTask::getProjectId, projectId)
                .eq(AgentTask::getScanTaskId, scanTaskId));
        List<AgentTask> items = agentTaskMapper.selectList(new LambdaQueryWrapper<AgentTask>()
                .eq(AgentTask::getProjectId, projectId)
                .eq(AgentTask::getScanTaskId, scanTaskId)
                .orderByDesc(AgentTask::getCreatedAt)
                .orderByDesc(AgentTask::getId)
                .last("LIMIT " + RESOURCE_LIMIT));
        return new CountedList<>(items, total);
    }

    private CountedList<AgentToolCall> listAgentToolCalls(Long projectId, Long scanTaskId) {
        long total = agentToolCallMapper.selectCount(new LambdaQueryWrapper<AgentToolCall>()
                .eq(AgentToolCall::getProjectId, projectId)
                .eq(AgentToolCall::getScanTaskId, scanTaskId));
        List<AgentToolCall> items = agentToolCallMapper.selectList(new LambdaQueryWrapper<AgentToolCall>()
                .eq(AgentToolCall::getProjectId, projectId)
                .eq(AgentToolCall::getScanTaskId, scanTaskId)
                .orderByDesc(AgentToolCall::getCreatedAt)
                .orderByDesc(AgentToolCall::getId)
                .last("LIMIT " + RESOURCE_LIMIT));
        return new CountedList<>(items, total);
    }

    private CountedList<AuditLog> listAuditLogs(Long projectId, Long scanTaskId,
                                                List<Long> autoRepairIds,
                                                List<Long> agentTaskIds) {
        long total = auditLogMapper.selectCount(auditLogScope(projectId, scanTaskId, autoRepairIds, agentTaskIds));
        List<AuditLog> items = auditLogMapper.selectList(auditLogScope(projectId, scanTaskId, autoRepairIds, agentTaskIds)
                .orderByDesc(AuditLog::getCreatedAt)
                .orderByDesc(AuditLog::getId)
                .last("LIMIT " + RESOURCE_LIMIT));
        return new CountedList<>(items, total);
    }

    private CountedList<ArtifactRecord> listArtifacts(Long projectId, Long scanTaskId,
                                                      List<Long> autoRepairIds,
                                                      List<Long> agentTaskIds) {
        long total = artifactRecordMapper.selectCount(artifactScope(projectId, scanTaskId, autoRepairIds, agentTaskIds));
        List<ArtifactRecord> items = artifactRecordMapper.selectList(artifactScope(projectId, scanTaskId, autoRepairIds, agentTaskIds)
                .orderByDesc(ArtifactRecord::getCreatedAt)
                .orderByDesc(ArtifactRecord::getId)
                .last("LIMIT " + RESOURCE_LIMIT));
        return new CountedList<>(items, total);
    }

    private LambdaQueryWrapper<AuditLog> auditLogScope(Long projectId, Long scanTaskId,
                                                       List<Long> autoRepairIds,
                                                       List<Long> agentTaskIds) {
        return new LambdaQueryWrapper<AuditLog>()
                .eq(AuditLog::getProjectId, projectId)
                .and(scope -> {
                    scope.eq(AuditLog::getResourceType, "SCAN_TASK")
                            .eq(AuditLog::getResourceId, scanTaskId);
                    if (autoRepairIds != null && !autoRepairIds.isEmpty()) {
                        scope.or(branch -> branch.eq(AuditLog::getResourceType, "AUTO_REPAIR")
                                .in(AuditLog::getResourceId, autoRepairIds));
                    }
                    if (agentTaskIds != null && !agentTaskIds.isEmpty()) {
                        scope.or(branch -> branch.eq(AuditLog::getResourceType, "AGENT_TASK")
                                .in(AuditLog::getResourceId, agentTaskIds));
                    }
                });
    }

    private LambdaQueryWrapper<ArtifactRecord> artifactScope(Long projectId, Long scanTaskId,
                                                            List<Long> autoRepairIds,
                                                            List<Long> agentTaskIds) {
        return new LambdaQueryWrapper<ArtifactRecord>()
                .eq(ArtifactRecord::getProjectId, projectId)
                .and(scope -> {
                    scope.eq(ArtifactRecord::getOwnerType, "SCAN_TASK")
                            .eq(ArtifactRecord::getOwnerId, scanTaskId);
                    if (autoRepairIds != null && !autoRepairIds.isEmpty()) {
                        scope.or(branch -> branch.eq(ArtifactRecord::getOwnerType, "AUTO_REPAIR")
                                .in(ArtifactRecord::getOwnerId, autoRepairIds));
                    }
                    if (agentTaskIds != null && !agentTaskIds.isEmpty()) {
                        scope.or(branch -> branch.eq(ArtifactRecord::getOwnerType, "AGENT_TASK")
                                .in(ArtifactRecord::getOwnerId, agentTaskIds));
                    }
                });
    }

    private ExecutionTaskDetailResponse executionDetail(Long projectId, String sourceType, Long sourceId) {
        ExecutionTask task = executionTaskService.getByProjectAndSource(projectId, sourceType, sourceId);
        if (task == null) {
            return null;
        }
        return new ExecutionTaskDetailResponse(task, executionTaskService.listSteps(task.getId()));
    }

    private List<GovernanceEvent> buildEvents(Long projectId,
                                              ScanTask scanTask,
                                              List<AutoRepair> autoRepairs,
                                              List<AgentTask> agentTasks,
                                              List<AgentToolCall> agentToolCalls,
                                              List<AuditLog> auditLogs,
                                              List<ArtifactRecord> artifacts,
                                              ExecutionTaskDetailResponse scanExecution,
                                              List<ExecutionTaskDetailResponse> repairExecutions,
                                              List<ExecutionTaskDetailResponse> agentExecutions) {
        List<GovernanceEvent> events = new ArrayList<>();
        if (scanExecution != null && scanExecution.getTask() != null) {
            events.add(executionEvent(projectId, scanTask, scanExecution.getTask(), "SCAN_EXECUTION", "扫描执行任务"));
        }
        events.addAll(artifactEvents(projectId, scanTask, artifacts));
        for (AutoRepair repair : autoRepairs) {
            events.add(GovernanceEvent.builder()
                    .id("auto-repair-" + repair.getId())
                    .eventType("AUTO_REPAIR")
                    .title("修复候选 #" + repair.getId())
                    .detail(firstText(repair.getErrorMessage(), repair.getTargetDesc(), repair.getFilePath(), "修复候选已绑定当前扫描"))
                    .status(repair.getStatus())
                    .tone(tone(repair.getStatus()))
                    .occurredAt(firstTime(repair.getUpdatedAt(), repair.getCreatedAt()))
                    .resource(sourceRef("AUTO_REPAIR", repair.getId(), projectId, repair.getRepositoryId(), scanTask.getId()))
                    .source(scanResource(scanTask))
                    .attribution(directAttribution("autoRepair.projectId + autoRepair.scanTaskId"))
                    .errorMessage(repair.getErrorMessage())
                    .actionTarget(ActionTarget.builder().type("AUTO_REPAIR").id(repair.getId()).url("/auto-repairs").build())
                    .build());
        }
        for (ExecutionTaskDetailResponse detail : repairExecutions) {
            if (detail.getTask() != null) {
                events.add(executionEvent(projectId, scanTask, detail.getTask(), "AUTO_REPAIR_EXECUTION", "修复执行任务"));
            }
        }
        for (AgentTask task : agentTasks) {
            events.add(GovernanceEvent.builder()
                    .id("agent-task-" + task.getId())
                    .eventType("AGENT_TASK")
                    .title(firstText(task.getTitle(), "Agent 任务 #" + task.getId()))
                    .detail(firstText(task.getErrorMessage(), task.getSummary(), task.getDescription(), "Agent 任务已绑定当前扫描"))
                    .status(task.getStatus())
                    .tone(tone(task.getStatus()))
                    .occurredAt(firstTime(task.getUpdatedAt(), task.getFinishedAt(), task.getStartedAt(), task.getCreatedAt()))
                    .resource(sourceRef("AGENT_TASK", task.getId(), projectId, scanTask.getRepositoryId(), scanTask.getId()))
                    .source(scanResource(scanTask))
                    .attribution(directAttribution("agentTask.projectId + agentTask.scanTaskId"))
                    .errorMessage(task.getErrorMessage())
                    .actionTarget(ActionTarget.builder().type("AGENT_TASK").id(task.getId()).url("/agent-tasks").build())
                    .build());
        }
        for (ExecutionTaskDetailResponse detail : agentExecutions) {
            if (detail.getTask() != null) {
                events.add(executionEvent(projectId, scanTask, detail.getTask(), "AGENT_TASK_EXECUTION", "Agent 执行任务"));
            }
        }
        for (AgentToolCall call : agentToolCalls) {
            events.add(GovernanceEvent.builder()
                    .id("agent-tool-call-" + call.getId())
                    .eventType("AGENT_TOOL_CALL")
                    .title(firstText(call.getToolName(), "Agent 工具调用"))
                    .detail(firstText(call.getErrorMessage(), call.getResultSummary(), "工具调用已记录权限和结果摘要"))
                    .status(Boolean.FALSE.equals(call.getSuccess()) ? "FAILED" : "SUCCESS")
                    .tone(Boolean.FALSE.equals(call.getSuccess()) ? "danger" : "ready")
                    .occurredAt(call.getCreatedAt())
                    .resource(sourceRef("AGENT_TOOL_CALL", call.getId(), projectId, scanTask.getRepositoryId(), scanTask.getId()))
                    .source(scanResource(scanTask))
                    .attribution(directAttribution("agentToolCall.projectId + agentToolCall.scanTaskId"))
                    .errorMessage(call.getErrorMessage())
                    .actionTarget(ActionTarget.builder().type("AUDIT").id(call.getId()).url("/audit-logs").build())
                    .build());
        }
        for (AuditLog log : auditLogs) {
            events.add(auditEvent(projectId, scanTask, log));
        }
        return events;
    }

    private GovernanceEvent auditEvent(Long projectId, ScanTask scanTask, AuditLog log) {
        boolean candidateReceipt = "AUTO_REPAIR_CANDIDATE_CREATED".equals(log.getAction());
        boolean prGate = isAutoRepairPrGateAction(log.getAction());
        JsonNode candidateProvenance = candidateReceipt ? auditProvenance(log) : null;
        return GovernanceEvent.builder()
                .id("audit-log-" + log.getId())
                .eventType(candidateReceipt ? "AUTO_REPAIR_CANDIDATE_RECEIPT" : prGate ? log.getAction() : "AUDIT_LOG")
                .title(candidateReceipt ? "候选来源凭证" : prGate ? prGateTitle(log.getAction()) : firstText(log.getAction(), "审计留痕"))
                .detail(candidateReceipt
                        ? candidateReceiptDetail(log, candidateProvenance)
                        : prGate
                        ? prGateDetail(log)
                        : firstText(log.getOutputSummary(), log.getRequestId(), "关键动作已进入审计链路"))
                .status(log.getStatus())
                .tone(tone(log.getStatus()))
                .occurredAt(log.getCreatedAt())
                .resource(sourceRef(candidateReceipt || prGate ? "AUTO_REPAIR" : "AUDIT_LOG",
                        candidateReceipt || prGate ? log.getResourceId() : log.getId(),
                        projectId, scanTask.getRepositoryId(), scanTask.getId()))
                .source(sourceRef("AUDIT_LOG", log.getId(), projectId, scanTask.getRepositoryId(), scanTask.getId()))
                .attribution(directAttribution(candidateReceipt
                        ? "auditLog.AUTO_REPAIR_CANDIDATE_CREATED sanitized provenance"
                        : prGate
                        ? "auditLog.AUTO_REPAIR_PR_* scan-bound autoRepair"
                        : auditAttributionReason(log)))
                .actionTarget(candidateReceipt || prGate
                        ? ActionTarget.builder().type("AUTO_REPAIR").id(log.getResourceId()).url("/auto-repairs").build()
                        : ActionTarget.builder().type("AUDIT").id(log.getId()).url("/audit-logs").build())
                .repairEvidenceGate(candidateReceipt ? text(candidateProvenance, "repairEvidenceGate", null) : null)
                .repairEvidenceGateReason(candidateReceipt ? text(candidateProvenance, "repairEvidenceGateReason", null) : null)
                .repairEvidenceGateSource(candidateReceipt ? text(candidateProvenance, "repairEvidenceGateSource", null) : null)
                .build();
    }

    private boolean isAutoRepairPrGateAction(String action) {
        return "AUTO_REPAIR_PR_QUEUED".equals(action)
                || "AUTO_REPAIR_PR_CREATED".equals(action)
                || "AUTO_REPAIR_PR_REJECTED".equals(action)
                || "AUTO_REPAIR_PR_FAILED".equals(action);
    }

    private String prGateTitle(String action) {
        return switch (action) {
            case "AUTO_REPAIR_PR_QUEUED" -> "PR 创建已排队";
            case "AUTO_REPAIR_PR_CREATED" -> "PR 已创建";
            case "AUTO_REPAIR_PR_REJECTED" -> "PR Gate 已拒绝";
            case "AUTO_REPAIR_PR_FAILED" -> "PR 创建失败";
            default -> firstText(action, "PR Gate 审计");
        };
    }

    private String prGateDetail(AuditLog log) {
        return firstText(log.getOutputSummary(), log.getRequestId(), "AutoRepair PR gate 已进入审计链路");
    }

    private String candidateReceiptDetail(AuditLog log, JsonNode provenance) {
        if (provenance == null || provenance.isMissingNode() || provenance.isNull()) {
            return firstText(log.getOutputSummary(), "候选来源凭证已进入审计链路");
        }
        String sourceType = text(provenance, "sourceType", "MANUAL_CANDIDATE");
        String filePath = text(provenance, "filePath", null);
        String scanTaskId = text(provenance, "scanTaskId", null);
        String sourceLabel = text(provenance, "sourceLabel", null);
        String citationId = text(provenance, "citationId", null);
        String chunkId = text(provenance, "chunkId", null);
        String riskCategory = text(provenance, "riskCategory", null);
        String riskSeverity = text(provenance, "riskSeverity", null);
        String riskKey = text(provenance, "riskKey", null);
        String startLine = text(provenance, "startLine", null);
        String endLine = text(provenance, "endLine", null);
        String lineNumber = text(provenance, "lineNumber", null);
        String sourceEvidenceTitle = text(provenance, "sourceEvidenceTitle", null);
        String sourceEvidenceFilePath = text(provenance, "sourceEvidenceFilePath", null);
        String sourceEvidenceLineNumber = text(provenance, "sourceEvidenceLineNumber", null);
        String repairEvidenceGate = text(provenance, "repairEvidenceGate", null);
        String repairEvidenceGateSource = text(provenance, "repairEvidenceGateSource", null);
        String repairEvidenceGateReason = text(provenance, "repairEvidenceGateReason", null);

        List<String> parts = new ArrayList<>();
        parts.add("来源 " + sourceType);
        if (scanTaskId != null) {
            parts.add("Scan #" + scanTaskId);
        }
        if (filePath != null) {
            parts.add("文件 " + filePath);
        }
        if (sourceLabel != null || citationId != null || chunkId != null) {
            parts.add("引用 " + firstText(sourceLabel, citationId, chunkId));
        }
        if (startLine != null || endLine != null) {
            parts.add("行 " + firstText(startLine, "?") + "-" + firstText(endLine, "?"));
        } else if (lineNumber != null) {
            parts.add("Line " + lineNumber);
        }
        if (riskCategory != null) {
            parts.add("风险 " + riskCategory);
        }
        if (riskSeverity != null) {
            parts.add("级别 " + riskSeverity);
        }
        if (riskKey != null) {
            parts.add("riskKey " + riskKey);
        }
        if (sourceEvidenceTitle != null || sourceEvidenceFilePath != null) {
            parts.add("报告证据 " + firstText(sourceEvidenceTitle, sourceEvidenceFilePath));
        }
        if (sourceEvidenceFilePath != null) {
            parts.add("报告位置 " + sourceEvidenceFilePath
                    + (sourceEvidenceLineNumber == null ? "" : ":" + sourceEvidenceLineNumber));
        }
        if (repairEvidenceGate != null) {
            parts.add("门禁 " + repairEvidenceGate);
        }
        if (repairEvidenceGateSource != null) {
            parts.add("门禁来源 " + repairEvidenceGateSource);
        }
        if (repairEvidenceGateReason != null) {
            parts.add("门禁原因 " + repairEvidenceGateReason);
        }
        return String.join(" / ", parts);
    }

    private JsonNode auditProvenance(AuditLog log) {
        if (log == null || log.getInputJson() == null || log.getInputJson().isBlank()) {
            return null;
        }
        try {
            JsonNode root = JSON.readTree(log.getInputJson());
            JsonNode provenance = root.path("provenance");
            return provenance.isMissingNode() ? null : provenance;
        } catch (Exception ignored) {
            return null;
        }
    }

    private String text(JsonNode node, String field, String fallback) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return fallback;
        }
        JsonNode value = node.path(field);
        if (value.isMissingNode() || value.isNull()) {
            return fallback;
        }
        String text = value.isTextual() ? value.asText() : value.asText(null);
        return text == null || text.isBlank() ? fallback : text;
    }

    private String auditAttributionReason(AuditLog log) {
        if (log == null || log.getResourceType() == null) {
            return "auditLog.projectId + scan-bound resource";
        }
        return switch (log.getResourceType()) {
            case "SCAN_TASK" -> "auditLog.projectId + resourceType=SCAN_TASK + resourceId=scanTaskId";
            case "AUTO_REPAIR" -> "auditLog.projectId + resourceType=AUTO_REPAIR + resourceId in scan autoRepairs";
            case "AGENT_TASK" -> "auditLog.projectId + resourceType=AGENT_TASK + resourceId in scan agentTasks";
            default -> "auditLog.projectId + scan-bound resource";
        };
    }

    private GovernanceEvent executionEvent(Long projectId, ScanTask scanTask, ExecutionTask task, String eventType, String titlePrefix) {
        return GovernanceEvent.builder()
                .id("execution-" + task.getId())
                .eventType(eventType)
                .title(titlePrefix + " #" + task.getId())
                .detail(firstText(task.getErrorMessage(),
                        firstText(task.getCurrentStep(), "执行任务已绑定当前扫描")))
                .status(task.getStatus())
                .tone(tone(task.getStatus()))
                .occurredAt(firstTime(task.getUpdatedAt(), task.getFinishedAt(), task.getStartedAt(), task.getCreatedAt()))
                .resource(sourceRef("EXECUTION_TASK", task.getId(), projectId, task.getRepositoryId(), scanTask.getId()))
                .source(sourceRef(task.getSourceType(), task.getSourceId(), projectId, task.getRepositoryId(), scanTask.getId()))
                .attribution(directAttribution("executionTask.projectId + sourceType/sourceId"))
                .errorMessage(task.getErrorMessage())
                .actionTarget(ActionTarget.builder().type("EXECUTION_TASK").id(task.getId()).url("/execution-tasks").build())
                .build();
    }

    private List<GovernanceEvent> artifactEvents(Long projectId, ScanTask scanTask, List<ArtifactRecord> artifacts) {
        if (artifacts == null || artifacts.isEmpty()) {
            return List.of();
        }
        Map<String, List<ArtifactRecord>> byOwnerType = new LinkedHashMap<>();
        for (ArtifactRecord artifact : artifacts) {
            String ownerType = artifact.getOwnerType() == null || artifact.getOwnerType().isBlank()
                    ? "UNKNOWN"
                    : artifact.getOwnerType();
            byOwnerType.computeIfAbsent(ownerType, ignored -> new ArrayList<>()).add(artifact);
        }
        List<GovernanceEvent> events = new ArrayList<>();
        byOwnerType.forEach((ownerType, ownerArtifacts) -> {
            LocalDateTime occurredAt = ownerArtifacts.stream()
                    .map(ArtifactRecord::getCreatedAt)
                    .filter(Objects::nonNull)
                    .max(LocalDateTime::compareTo)
                    .orElse(null);
            Long ownerId = ownerArtifacts.stream()
                    .map(ArtifactRecord::getOwnerId)
                    .filter(Objects::nonNull)
                    .findFirst()
                    .orElse(scanTask.getId());
            events.add(GovernanceEvent.builder()
                    .id("artifacts-" + ownerType.toLowerCase(Locale.ROOT).replace('_', '-') + "-" + scanTask.getId())
                    .eventType("ARTIFACTS_ARCHIVED")
                    .title(artifactEventTitle(ownerType))
                    .detail(artifactEventDetail(ownerType, ownerArtifacts.size()))
                    .status("READY")
                    .tone("ready")
                    .occurredAt(occurredAt)
                    .resource(sourceRef(ownerType, ownerId, projectId, scanTask.getRepositoryId(), scanTask.getId()))
                    .source(scanResource(scanTask))
                    .attribution(directAttribution(artifactAttributionReason(ownerType)))
                    .actionTarget(ActionTarget.builder().type("ARTIFACTS").id(scanTask.getId()).url("/artifacts").build())
                    .build());
        });
        return events;
    }

    private String artifactEventTitle(String ownerType) {
        return switch (ownerType) {
            case "AUTO_REPAIR" -> "修复产物已归档";
            case "AGENT_TASK" -> "Agent 产物已归档";
            case "SCAN_TASK" -> "扫描产物已归档";
            default -> "治理产物已归档";
        };
    }

    private String artifactEventDetail(String ownerType, int count) {
        return switch (ownerType) {
            case "AUTO_REPAIR" -> "当前扫描派生修复已归档 " + count + " 个产物";
            case "AGENT_TASK" -> "当前扫描派生 Agent 任务已归档 " + count + " 个产物";
            case "SCAN_TASK" -> "当前扫描已归档 " + count + " 个产物";
            default -> "当前扫描治理链路已归档 " + count + " 个产物";
        };
    }

    private String artifactAttributionReason(String ownerType) {
        return switch (ownerType) {
            case "AUTO_REPAIR" -> "artifact.projectId + ownerType=AUTO_REPAIR + ownerId in scan autoRepairs";
            case "AGENT_TASK" -> "artifact.projectId + ownerType=AGENT_TASK + ownerId in scan agentTasks";
            case "SCAN_TASK" -> "artifact.projectId + ownerType=SCAN_TASK + ownerId=scanTaskId";
            default -> "artifact.projectId + scan-bound owner";
        };
    }

    private LimitInfo limitInfo(CountedList<?> countedList) {
        return LimitInfo.builder()
                .limit(RESOURCE_LIMIT)
                .total(countedList.total())
                .returned(countedList.items().size())
                .truncated(countedList.total() > countedList.items().size())
                .build();
    }

    private static LocalDateTime eventTime(GovernanceEvent event) {
        return event.getOccurredAt() == null ? LocalDateTime.MIN : event.getOccurredAt();
    }

    private ResourceRef scanResource(ScanTask scanTask) {
        return sourceRef("SCAN_TASK", scanTask.getId(), scanTask.getProjectId(), scanTask.getRepositoryId(), scanTask.getId());
    }

    private ResourceRef sourceRef(String type, Long id, Long projectId, Long repositoryId, Long scanTaskId) {
        return ResourceRef.builder()
                .type(type)
                .id(id)
                .projectId(projectId)
                .repositoryId(repositoryId)
                .scanTaskId(scanTaskId)
                .build();
    }

    private Attribution directAttribution(String reason) {
        return Attribution.builder()
                .mode("DIRECT")
                .confidence("HIGH")
                .reason(reason)
                .build();
    }

    private boolean hasError(String status) {
        return "FAILED".equalsIgnoreCase(status) || "ERROR".equalsIgnoreCase(status);
    }

    private String tone(String status) {
        if (status == null || status.isBlank()) {
            return "idle";
        }
        String normalized = status.toUpperCase();
        if (normalized.contains("FAILED") || normalized.contains("ERROR")) {
            return "danger";
        }
        if (normalized.contains("RUNNING") || normalized.contains("PENDING") || normalized.contains("CANCELLED")) {
            return "warning";
        }
        return "ready";
    }

    private String firstText(String... values) {
        if (values == null) {
            return null;
        }
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private LocalDateTime firstTime(LocalDateTime... values) {
        if (values == null) {
            return null;
        }
        for (LocalDateTime value : values) {
            if (value != null) {
                return value;
            }
        }
        return null;
    }

    private record CountedList<T>(List<T> items, long total) {
    }
}
