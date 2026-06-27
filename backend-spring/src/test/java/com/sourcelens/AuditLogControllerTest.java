package com.sourcelens;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sourcelens.common.exception.GlobalExceptionHandler;
import com.sourcelens.module.audit.controller.AuditLogController;
import com.sourcelens.module.audit.entity.AuditLog;
import com.sourcelens.module.audit.service.AuditLogService;
import com.sourcelens.module.project.service.ProjectService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuditLogControllerTest {

    private AuditLogService auditLogService;
    private ProjectService projectService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        auditLogService = mock(AuditLogService.class);
        projectService = mock(ProjectService.class);
        mockMvc = MockMvcBuilders
                .standaloneSetup(new AuditLogController(auditLogService, projectService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void listProjectAuditLogs_shouldVerifyOwnershipAndApplyFilters() throws Exception {
        Long projectId = 10L;
        Long userId = 1L;
        AuditLog log = AuditLog.builder()
                .id(99L)
                .projectId(projectId)
                .resourceType("AUTO_REPAIR")
                .action("AUTO_REPAIR_PR_CREATED")
                .status("SUCCESS")
                .outputSummary("受控 PR 已创建")
                .build();
        Page<AuditLog> page = new Page<>(1, 20, 1);
        page.setRecords(List.of(log));
        doNothing().when(projectService).verifyOwnership(projectId, userId);
        when(auditLogService.listByProject(projectId, 1, 20,
                "AUTO_REPAIR", "AUTO_REPAIR_PR_CREATED", "SUCCESS")).thenReturn(page);

        mockMvc.perform(get("/api/projects/10/audit-logs")
                        .param("resourceType", "AUTO_REPAIR")
                        .param("action", "AUTO_REPAIR_PR_CREATED")
                        .param("status", "SUCCESS")
                        .requestAttr("userId", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].id").value(99))
                .andExpect(jsonPath("$.data.items[0].resourceType").value("AUTO_REPAIR"))
                .andExpect(jsonPath("$.data.total").value(1));

        verify(projectService).verifyOwnership(projectId, userId);
        verify(auditLogService).listByProject(eq(projectId), eq(1), eq(20),
                eq("AUTO_REPAIR"), eq("AUTO_REPAIR_PR_CREATED"), eq("SUCCESS"));
    }
}
