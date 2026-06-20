package com.sourcelens;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sourcelens.common.exception.BizException;
import com.sourcelens.common.exception.GlobalExceptionHandler;
import com.sourcelens.module.scantask.controller.ScanTaskController;
import com.sourcelens.module.scantask.dto.CreateScanTaskRequest;
import com.sourcelens.module.scantask.entity.ScanTask;
import com.sourcelens.module.scantask.service.ScanTaskService;
import com.sourcelens.module.project.service.ProjectService;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class ScanTaskControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ScanTaskService scanTaskService;

    @Mock
    private ProjectService projectService;

    @InjectMocks
    private ScanTaskController scanTaskController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(scanTaskController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    private ScanTask sampleTask(Long id, Long projectId) {
        return ScanTask.builder()
                .id(id)
                .projectId(projectId)
                .repositoryId(100L)
                .branch("main")
                .status("PENDING")
                .triggerType("MANUAL")
                .createdBy(1L)
                .createdAt(LocalDateTime.now())
                .deleted(false)
                .build();
    }

    @Test
    void createScanTask_ok() throws Exception {
        Long userId = 1L, projectId = 10L;
        ScanTask task = sampleTask(50L, projectId);
        doNothing().when(projectService).verifyOwnership(projectId, userId);
        when(scanTaskService.create(eq(projectId), any(CreateScanTaskRequest.class), eq(userId))).thenReturn(task);

        CreateScanTaskRequest req = new CreateScanTaskRequest();
        req.setRepositoryId(100L);
        req.setProjectId(projectId);
        req.setBranch("main");

        mockMvc.perform(post("/api/repositories/100/scan-tasks")
                        .requestAttr("userId", userId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(new ObjectMapper().writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("SUCCESS"))
                .andExpect(jsonPath("$.data.status").value("PENDING"));
    }

    @Test
    void createScanTask_forbidden() throws Exception {
        doThrow(BizException.forbidden("无权访问此项目")).when(projectService).verifyOwnership(10L, 1L);

        CreateScanTaskRequest req = new CreateScanTaskRequest();
        req.setRepositoryId(100L);
        req.setProjectId(10L);

        mockMvc.perform(post("/api/repositories/100/scan-tasks")
                        .requestAttr("userId", 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(new ObjectMapper().writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    void listScanTasks_ok() throws Exception {
        Long projectId = 10L, userId = 1L;
        ScanTask task = sampleTask(1L, projectId);
        Page<ScanTask> page = new Page<>(1, 20);
        page.setRecords(List.of(task));
        page.setTotal(1);

        doNothing().when(projectService).verifyOwnership(projectId, userId);
        when(scanTaskService.listByProject(projectId, 1, 20)).thenReturn(page);

        mockMvc.perform(get("/api/projects/10/scan-tasks")
                        .requestAttr("userId", userId)
                        .param("page", "1")
                        .param("pageSize", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items").isArray())
                .andExpect(jsonPath("$.data.total").value(1));
    }

    @Test
    void scanTaskDetail_ok() throws Exception {
        Long scanTaskId = 50L, projectId = 10L, userId = 1L;
        ScanTask task = sampleTask(scanTaskId, projectId);
        when(scanTaskService.getDetail(scanTaskId)).thenReturn(task);
        doNothing().when(projectService).verifyOwnership(projectId, userId);

        mockMvc.perform(get("/api/scan-tasks/50")
                        .requestAttr("userId", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(50));
    }

    @Test
    void scanTaskDetail_notFound() throws Exception {
        when(scanTaskService.getDetail(999L)).thenThrow(BizException.notFound("ScanTask"));

        mockMvc.perform(get("/api/scan-tasks/999")
                        .requestAttr("userId", 1L))
                .andExpect(status().isNotFound());
    }
}