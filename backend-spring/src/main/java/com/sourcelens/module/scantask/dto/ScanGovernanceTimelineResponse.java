package com.sourcelens.module.scantask.dto;

import com.sourcelens.module.agent.entity.AgentTask;
import com.sourcelens.module.agent.entity.AgentToolCall;
import com.sourcelens.module.artifact.dto.ArtifactRecordResponse;
import com.sourcelens.module.audit.entity.AuditLog;
import com.sourcelens.module.autorepair.entity.AutoRepair;
import com.sourcelens.module.execution.dto.ExecutionTaskDetailResponse;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class ScanGovernanceTimelineResponse {

    private Long projectId;

    private Long repositoryId;

    private Long scanTaskId;

    private String scanStatus;

    private LocalDateTime generatedAt;

    private GovernanceSummary summary;

    private GovernanceResources resources;

    private List<GovernanceEvent> events;

    private Map<String, LimitInfo> limits;

    private Boolean truncated;

    private List<String> warnings;

    private List<AttributionGap> attributionGaps;

    @Data
    @Builder
    public static class GovernanceSummary {
        private String status;
        private Map<String, Long> counts;
        private Boolean hasErrors;
        private Integer attributionGapCount;
    }

    @Data
    @Builder
    public static class GovernanceResources {
        private List<ArtifactRecordResponse> artifacts;
        private ExecutionTaskDetailResponse scanExecution;
        private List<ExecutionTaskDetailResponse> repairExecutions;
        private List<ExecutionTaskDetailResponse> agentExecutions;
        private List<AutoRepair> autoRepairs;
        private List<AgentTask> agentTasks;
        private List<AgentToolCall> agentToolCalls;
        private List<AuditLog> auditLogs;
    }

    @Data
    @Builder
    public static class GovernanceEvent {
        private String id;
        private String eventType;
        private String title;
        private String detail;
        private String status;
        private String tone;
        private LocalDateTime occurredAt;
        private ResourceRef resource;
        private ResourceRef source;
        private Attribution attribution;
        private String errorMessage;
        private ActionTarget actionTarget;
        private String repairEvidenceGate;
        private String repairEvidenceGateReason;
        private String repairEvidenceGateSource;
    }

    @Data
    @Builder
    public static class ResourceRef {
        private String type;
        private Long id;
        private Long projectId;
        private Long repositoryId;
        private Long scanTaskId;
    }

    @Data
    @Builder
    public static class Attribution {
        private String mode;
        private String confidence;
        private String reason;
    }

    @Data
    @Builder
    public static class ActionTarget {
        private String type;
        private Long id;
        private String url;
    }

    @Data
    @Builder
    public static class LimitInfo {
        private Integer limit;
        private Long total;
        private Integer returned;
        private Boolean truncated;
    }

    @Data
    @Builder
    public static class AttributionGap {
        private String resourceType;
        private Long resourceId;
        private String reason;
    }
}
