package com.sourcelens;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sourcelens.common.exception.GlobalExceptionHandler;
import com.sourcelens.module.agent.service.AgentTaskService;
import com.sourcelens.module.autorepair.service.AutoRepairService;
import com.sourcelens.module.execution.controller.ExecutionTaskController;
import com.sourcelens.module.execution.entity.ExecutionLog;
import com.sourcelens.module.execution.entity.ExecutionStep;
import com.sourcelens.module.execution.entity.ExecutionTask;
import com.sourcelens.module.execution.service.ExecutionTaskService;
import com.sourcelens.module.project.service.ProjectService;
import com.sourcelens.module.scantask.service.ScanTaskService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ExecutionTaskControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ExecutionTaskService executionTaskService;

    @Mock
    private ProjectService projectService;

    @Mock
    private AgentTaskService agentTaskService;

    @Mock
    private ScanTaskService scanTaskService;

    @Mock
    private AutoRepairService autoRepairService;

    @InjectMocks
    private ExecutionTaskController executionTaskController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(executionTaskController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void listTasks_ok() throws Exception {
        Long projectId = 10L;
        Long userId = 1L;
        doNothing().when(projectService).verifyOwnership(projectId, userId);
        Page<ExecutionTask> records = new Page<>(1, 20, 1);
        records.setRecords(List.of(sampleTask()));
        when(executionTaskService.listByProject(projectId, 1, 20)).thenReturn(records);

        mockMvc.perform(get("/api/projects/10/execution-tasks")
                        .requestAttr("userId", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].taskType").value("AUTO_REPAIR"))
                .andExpect(jsonPath("$.data.total").value(1));
    }

    @Test
    void getTaskDetail_ok() throws Exception {
        Long projectId = 10L;
        Long userId = 1L;
        doNothing().when(projectService).verifyOwnership(projectId, userId);
        when(executionTaskService.getByProject(projectId, 88L)).thenReturn(sampleTask());
        when(executionTaskService.listSteps(88L)).thenReturn(List.of(sampleStep()));
        when(executionTaskService.listLogs(88L, 200)).thenReturn(List.of(sampleLog()));

        mockMvc.perform(get("/api/projects/10/execution-tasks/88")
                        .requestAttr("userId", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.task.id").value(88))
                .andExpect(jsonPath("$.data.steps[0].stepKey").value("generate_patch"))
                .andExpect(jsonPath("$.data.logs[0].message").value("patch ready"));
    }

    @Test
    void getTaskDetail_notFound() throws Exception {
        Long projectId = 10L;
        Long userId = 1L;
        doNothing().when(projectService).verifyOwnership(projectId, userId);
        when(executionTaskService.getByProject(projectId, 404L)).thenReturn(null);

        mockMvc.perform(get("/api/projects/10/execution-tasks/404")
                        .requestAttr("userId", userId))
                .andExpect(status().isNotFound());
    }

    @Test
    void getTaskDetailBySource_ok() throws Exception {
        Long projectId = 10L;
        Long userId = 1L;
        doNothing().when(projectService).verifyOwnership(projectId, userId);
        when(executionTaskService.getByProjectAndSource(projectId, "AUTO_REPAIR", 42L)).thenReturn(sampleTask());
        when(executionTaskService.listSteps(88L)).thenReturn(List.of(sampleStep()));
        when(executionTaskService.listLogs(88L, 200)).thenReturn(List.of(sampleLog()));

        mockMvc.perform(get("/api/projects/10/execution-tasks/source/AUTO_REPAIR/42")
                        .requestAttr("userId", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.task.id").value(88))
                .andExpect(jsonPath("$.data.steps[0].stepKey").value("generate_patch"));
    }

    @Test
    void cancelTask_scanTask_routesToScanService() throws Exception {
        Long projectId = 10L;
        Long userId = 1L;
        ExecutionTask running = sampleTask();
        running.setTaskType("SCAN");
        running.setSourceType("SCAN_TASK");
        running.setSourceId(42L);
        ExecutionTask cancelled = sampleTask();
        cancelled.setStatus("CANCELLED");
        cancelled.setSourceType("SCAN_TASK");
        cancelled.setSourceId(42L);

        doNothing().when(projectService).verifyOwnership(projectId, userId);
        when(executionTaskService.getByProject(projectId, 88L)).thenReturn(running, cancelled);

        mockMvc.perform(post("/api/projects/10/execution-tasks/88/cancel")
                        .requestAttr("userId", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.task.status").value("CANCELLED"));

        verify(scanTaskService).cancel(42L, userId);
    }

    @Test
    void cancelTask_terminalTask_rejected() throws Exception {
        Long projectId = 10L;
        Long userId = 1L;
        ExecutionTask task = sampleTask();
        task.setStatus("SUCCESS");

        doNothing().when(projectService).verifyOwnership(projectId, userId);
        when(executionTaskService.getByProject(projectId, 88L)).thenReturn(task);
        when(executionTaskService.isTerminal(task)).thenCallRealMethod();

        mockMvc.perform(post("/api/projects/10/execution-tasks/88/cancel")
                        .requestAttr("userId", userId))
                .andExpect(status().isBadRequest());
    }

    private ExecutionTask sampleTask() {
        return ExecutionTask.builder()
                .id(88L)
                .projectId(10L)
                .repositoryId(100L)
                .taskType("AUTO_REPAIR")
                .sourceType("AUTO_REPAIR")
                .sourceId(42L)
                .status("RUNNING")
                .progress(50)
                .createdBy(1L)
                .build();
    }

    private ExecutionStep sampleStep() {
        return ExecutionStep.builder()
                .id(99L)
                .taskId(88L)
                .stepKey("generate_patch")
                .stepName("生成补丁")
                .status("RUNNING")
                .build();
    }

    private ExecutionLog sampleLog() {
        return ExecutionLog.builder()
                .id(100L)
                .taskId(88L)
                .stepKey("generate_patch")
                .level("INFO")
                .message("patch ready")
                .build();
    }
}
