package com.sourcelens;

import com.sourcelens.common.exception.BizException;
import com.sourcelens.common.exception.GlobalExceptionHandler;
import com.sourcelens.module.project.service.ProjectService;
import com.sourcelens.module.scantask.controller.ScanTaskGovernanceTimelineController;
import com.sourcelens.module.scantask.dto.ScanGovernanceTimelineResponse;
import com.sourcelens.module.scantask.service.ScanTaskGovernanceTimelineService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ScanTaskGovernanceTimelineControllerTest {

    private ProjectService projectService;
    private ScanTaskGovernanceTimelineService timelineService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        projectService = mock(ProjectService.class);
        timelineService = mock(ScanTaskGovernanceTimelineService.class);
        mockMvc = MockMvcBuilders
                .standaloneSetup(new ScanTaskGovernanceTimelineController(projectService, timelineService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void getTimeline_shouldVerifyProjectOwnershipAndReturnTimeline() throws Exception {
        Long projectId = 10L;
        Long scanTaskId = 88L;
        Long userId = 1L;
        doNothing().when(projectService).verifyOwnership(projectId, userId);
        when(timelineService.getTimeline(projectId, scanTaskId)).thenReturn(sampleResponse(projectId, scanTaskId));

        mockMvc.perform(get("/api/projects/10/scan-tasks/88/governance-timeline")
                        .requestAttr("userId", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("SUCCESS"))
                .andExpect(jsonPath("$.data.projectId").value(10))
                .andExpect(jsonPath("$.data.scanTaskId").value(88))
                .andExpect(jsonPath("$.data.summary.status").value("BOUND"));

        verify(projectService).verifyOwnership(projectId, userId);
        verify(timelineService).getTimeline(projectId, scanTaskId);
    }

    @Test
    void getTimeline_shouldRejectForbiddenProjectBeforeTimelineQuery() throws Exception {
        doThrow(BizException.forbidden("无权访问此项目"))
                .when(projectService).verifyOwnership(10L, 1L);

        mockMvc.perform(get("/api/projects/10/scan-tasks/88/governance-timeline")
                        .requestAttr("userId", 1L))
                .andExpect(status().isForbidden());
    }

    @Test
    void getTimeline_shouldReturnNotFoundWhenScanDoesNotBelongToProject() throws Exception {
        Long projectId = 10L;
        Long scanTaskId = 9901L;
        Long userId = 1L;
        doNothing().when(projectService).verifyOwnership(projectId, userId);
        when(timelineService.getTimeline(projectId, scanTaskId)).thenThrow(BizException.notFound("ScanTask"));

        mockMvc.perform(get("/api/projects/10/scan-tasks/9901/governance-timeline")
                        .requestAttr("userId", userId))
                .andExpect(status().isNotFound());

        verify(timelineService).getTimeline(projectId, scanTaskId);
    }

    private ScanGovernanceTimelineResponse sampleResponse(Long projectId, Long scanTaskId) {
        return ScanGovernanceTimelineResponse.builder()
                .projectId(projectId)
                .repositoryId(100L)
                .scanTaskId(scanTaskId)
                .scanStatus("SUCCESS")
                .generatedAt(LocalDateTime.now())
                .summary(ScanGovernanceTimelineResponse.GovernanceSummary.builder()
                        .status("BOUND")
                        .counts(Map.of("autoRepairs", 0L))
                        .hasErrors(false)
                        .attributionGapCount(0)
                        .build())
                .resources(ScanGovernanceTimelineResponse.GovernanceResources.builder()
                        .artifacts(List.of())
                        .autoRepairs(List.of())
                        .agentTasks(List.of())
                        .agentToolCalls(List.of())
                        .auditLogs(List.of())
                        .repairExecutions(List.of())
                        .agentExecutions(List.of())
                        .build())
                .events(List.of())
                .limits(Map.of())
                .truncated(false)
                .warnings(List.of())
                .attributionGaps(List.of())
                .build();
    }
}
