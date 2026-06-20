package com.sourcelens;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sourcelens.common.exception.BizException;
import com.sourcelens.common.exception.GlobalExceptionHandler;
import com.sourcelens.module.project.controller.ProjectController;
import com.sourcelens.module.project.dto.CreateProjectRequest;
import com.sourcelens.module.project.dto.UpdateProjectRequest;
import com.sourcelens.module.project.entity.Project;
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
class ProjectControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ProjectService projectService;

    @InjectMocks
    private ProjectController projectController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(projectController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    private Project sampleProject(Long id, Long userId) {
        return Project.builder()
                .id(id)
                .name("Test Project")
                .description("desc")
                .createdBy(userId)
                .status("ACTIVE")
                .deleted(false)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    void createProject_ok() throws Exception {
        Long userId = 1L;
        Project project = sampleProject(10L, userId);
        when(projectService.create(any(CreateProjectRequest.class), eq(userId))).thenReturn(project);

        CreateProjectRequest req = new CreateProjectRequest();
        req.setName("Test Project");
        req.setDescription("desc");

        mockMvc.perform(post("/api/projects")
                        .requestAttr("userId", userId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(new ObjectMapper().writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("SUCCESS"))
                .andExpect(jsonPath("$.data.name").value("Test Project"));
    }

    @Test
    void listProjects_ok() throws Exception {
        Long userId = 1L;
        Project p = sampleProject(1L, userId);
        Page<Project> page = new Page<>(1, 20);
        page.setRecords(List.of(p));
        page.setTotal(1);
        when(projectService.listByUser(eq(userId), eq(1), eq(20))).thenReturn(page);

        mockMvc.perform(get("/api/projects")
                        .requestAttr("userId", userId)
                        .param("page", "1")
                        .param("pageSize", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("SUCCESS"))
                .andExpect(jsonPath("$.data.items").isArray())
                .andExpect(jsonPath("$.data.total").value(1));
    }

    @Test
    void detailProject_ok() throws Exception {
        Long userId = 1L;
        Project project = sampleProject(10L, userId);
        when(projectService.getDetail(10L, userId)).thenReturn(project);

        mockMvc.perform(get("/api/projects/10")
                        .requestAttr("userId", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(10))
                .andExpect(jsonPath("$.data.name").value("Test Project"));
    }

    @Test
    void detailProject_notFound() throws Exception {
        when(projectService.getDetail(999L, 1L)).thenThrow(BizException.notFound("Project"));

        mockMvc.perform(get("/api/projects/999")
                        .requestAttr("userId", 1L))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }

    @Test
    void detailProject_forbidden() throws Exception {
        when(projectService.getDetail(10L, 1L)).thenThrow(BizException.forbidden("无权访问此项目"));

        mockMvc.perform(get("/api/projects/10")
                        .requestAttr("userId", 1L))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    void updateProject_ok() throws Exception {
        Long userId = 1L;
        Project updated = sampleProject(10L, userId);
        updated.setName("Updated");
        when(projectService.update(eq(10L), any(UpdateProjectRequest.class), eq(userId))).thenReturn(updated);

        UpdateProjectRequest req = new UpdateProjectRequest();
        req.setName("Updated");

        mockMvc.perform(put("/api/projects/10")
                        .requestAttr("userId", userId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(new ObjectMapper().writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Updated"));
    }

    @Test
    void deleteProject_ok() throws Exception {
        Long userId = 1L;
        doNothing().when(projectService).delete(10L, userId);

        mockMvc.perform(delete("/api/projects/10")
                        .requestAttr("userId", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("SUCCESS"));
    }
}