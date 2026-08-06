package com.sourcelens;

import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sourcelens.common.exception.BizException;
import com.sourcelens.common.exception.GlobalExceptionHandler;
import com.sourcelens.module.autorepair.controller.AutoRepairController;
import com.sourcelens.module.autorepair.dto.AutoRepairRequest;
import com.sourcelens.module.autorepair.entity.AutoRepair;
import com.sourcelens.module.autorepair.service.AutoRepairService;
import com.sourcelens.module.project.service.ProjectService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.mockito.ArgumentCaptor;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AutoRepairControllerTest {

    private AutoRepairService autoRepairService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        autoRepairService = mock(AutoRepairService.class);
        ProjectService projectService = mock(ProjectService.class);
        mockMvc = MockMvcBuilders
                .standaloneSetup(new AutoRepairController(autoRepairService, projectService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void createRepair_shouldBindScanTaskIdReturnItAndStartAsyncExecution() throws Exception {
        Long projectId = 10L;
        Long userId = 1L;
        AutoRepair repair = AutoRepair.builder()
                .id(77L)
                .projectId(projectId)
                .repositoryId(100L)
                .scanTaskId(88L)
                .filePath("src/App.java")
                .targetDesc("修复扫描报告风险")
                .status("PENDING")
                .createdBy(userId)
                .build();
        ArgumentCaptor<AutoRepairRequest> requestCaptor = ArgumentCaptor.forClass(AutoRepairRequest.class);
        when(autoRepairService.createRepairTask(eq(projectId), requestCaptor.capture(), eq(userId)))
                .thenReturn(repair);

        mockMvc.perform(post("/api/projects/10/auto-repairs")
                        .requestAttr("userId", userId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(new ObjectMapper().writeValueAsString(Map.of(
                                "repositoryId", 100,
                                "scanTaskId", 88,
                                "filePath", "src/App.java",
                                "targetDesc", "修复扫描报告风险"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("SUCCESS"))
                .andExpect(jsonPath("$.data.id").value(77))
                .andExpect(jsonPath("$.data.scanTaskId").value(88))
                .andExpect(jsonPath("$.data.status").value("PENDING"));

        AutoRepairRequest boundRequest = requestCaptor.getValue();
        assertEquals(100L, boundRequest.getRepositoryId());
        assertEquals(88L, boundRequest.getScanTaskId());
        assertEquals("src/App.java", boundRequest.getFilePath());
        assertEquals("修复扫描报告风险", boundRequest.getTargetDesc());
        verify(autoRepairService).executeRepairAsync(77L, userId);
    }

    @Test
    @SuppressWarnings({"rawtypes", "unchecked"})
    void listRepairs_shouldFilterByScanTaskIdWhenProvided() throws Exception {
        if (TableInfoHelper.getTableInfo(AutoRepair.class) == null) {
            TableInfoHelper.initTableInfo(new MapperBuilderAssistant(new MybatisConfiguration(), ""), AutoRepair.class);
        }
        Long projectId = 10L;
        Long userId = 1L;
        AutoRepair repair = AutoRepair.builder()
                .id(78L)
                .projectId(projectId)
                .repositoryId(100L)
                .scanTaskId(88L)
                .filePath("src/App.java")
                .targetDesc("修复扫描报告风险")
                .status("PATCH_READY")
                .createdBy(userId)
                .build();
        when(autoRepairService.list(org.mockito.ArgumentMatchers.<Wrapper<AutoRepair>>any()))
                .thenReturn(List.of(repair));

        mockMvc.perform(get("/api/projects/10/auto-repairs")
                        .param("scanTaskId", "88")
                        .requestAttr("userId", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("SUCCESS"))
                .andExpect(jsonPath("$.data[0].id").value(78))
                .andExpect(jsonPath("$.data[0].scanTaskId").value(88));

        ArgumentCaptor<LambdaQueryWrapper> wrapperCaptor = ArgumentCaptor.forClass(LambdaQueryWrapper.class);
        verify(autoRepairService).list(wrapperCaptor.capture());
        String sqlSegment = wrapperCaptor.getValue().getSqlSegment();
        assertTrue(sqlSegment.contains("project_id"));
        assertTrue(sqlSegment.contains("scan_task_id"));
    }

    @Test
    void submitPr_shouldQueueAndStartAsyncExecution() throws Exception {
        Long projectId = 10L;
        Long repairId = 77L;
        Long userId = 1L;
        AutoRepair repair = AutoRepair.builder()
                .id(repairId)
                .projectId(projectId)
                .repositoryId(100L)
                .filePath("src/App.java")
                .status("PR_RUNNING")
                .build();
        when(autoRepairService.submitPr(projectId, repairId, userId)).thenReturn(repair);

        mockMvc.perform(post("/api/projects/10/auto-repairs/77/submit-pr")
                        .requestAttr("userId", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("SUCCESS"))
                .andExpect(jsonPath("$.data.id").value(77))
                .andExpect(jsonPath("$.data.status").value("PR_RUNNING"));

        verify(autoRepairService).submitPr(projectId, repairId, userId);
        verify(autoRepairService).executeSubmitPrAsync(repairId, userId);
    }

    @Test
    void submitPr_whenServiceRejects_shouldNotStartAsyncExecution() throws Exception {
        Long projectId = 10L;
        Long repairId = 77L;
        Long userId = 1L;
        when(autoRepairService.submitPr(projectId, repairId, userId))
                .thenThrow(BizException.badRequest("缺少 CHANGE_PATCH 补丁产物，无法提交 PR"));

        mockMvc.perform(post("/api/projects/10/auto-repairs/77/submit-pr")
                        .requestAttr("userId", userId))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.message").value("缺少 CHANGE_PATCH 补丁产物，无法提交 PR"));

        verify(autoRepairService).submitPr(projectId, repairId, userId);
        verify(autoRepairService, never()).executeSubmitPrAsync(repairId, userId);
    }
}
