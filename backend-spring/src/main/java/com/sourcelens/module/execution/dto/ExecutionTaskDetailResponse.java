package com.sourcelens.module.execution.dto;

import com.sourcelens.module.execution.entity.ExecutionAttempt;
import com.sourcelens.module.execution.entity.ExecutionLog;
import com.sourcelens.module.execution.entity.ExecutionStep;
import com.sourcelens.module.execution.entity.ExecutionTask;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
public class ExecutionTaskDetailResponse {

    private ExecutionTask task;

    private List<ExecutionAttempt> attempts;

    private List<ExecutionStep> steps;

    private List<ExecutionLog> logs;

    public ExecutionTaskDetailResponse(ExecutionTask task, List<ExecutionStep> steps) {
        this(task, List.of(), steps, List.of());
    }

    public ExecutionTaskDetailResponse(ExecutionTask task, List<ExecutionAttempt> attempts, List<ExecutionStep> steps) {
        this(task, attempts, steps, List.of());
    }

    public ExecutionTaskDetailResponse(ExecutionTask task, List<ExecutionAttempt> attempts,
                                       List<ExecutionStep> steps, List<ExecutionLog> logs) {
        this.task = task;
        this.attempts = attempts;
        this.steps = steps;
        this.logs = logs;
    }
}
