package com.sourcelens;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sourcelens.common.exception.BizException;
import com.sourcelens.module.project.dto.CreateProjectRequest;
import com.sourcelens.module.project.dto.UpdateProjectRequest;
import com.sourcelens.module.project.entity.Project;
import com.sourcelens.module.project.mapper.ProjectMapper;
import com.sourcelens.module.project.service.ProjectService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    private ProjectMapper projectMapper;

    @InjectMocks
    private ProjectService projectService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(projectService, "baseMapper", projectMapper);
    }

    private Project buildProject(Long id, Long userId, boolean deleted) {
        Project p = new Project();
        p.setId(id);
        p.setName("Test");
        p.setCreatedBy(userId);
        p.setDeleted(deleted);
        return p;
    }

    @Test
    void create_shouldSaveAndReturn() {
        when(projectMapper.insert(any(Project.class))).thenReturn(1);

        CreateProjectRequest req = new CreateProjectRequest();
        req.setName("New Project");
        req.setDescription("desc");

        Project result = projectService.create(req, 1L);

        assertEquals("New Project", result.getName());
        assertEquals(1L, result.getCreatedBy());
        assertEquals("ACTIVE", result.getStatus());
        verify(projectMapper, times(1)).insert(any(Project.class));
    }

    @Test
    void getDetail_existingProject_returnsProject() {
        Project p = buildProject(10L, 1L, false);
        when(projectMapper.selectById(10L)).thenReturn(p);

        Project result = projectService.getDetail(10L, 1L);

        assertEquals(10L, result.getId());
    }

    @Test
    void getDetail_notFound_throwsNotFound() {
        when(projectMapper.selectById(999L)).thenReturn(null);

        BizException ex = assertThrows(BizException.class,
                () -> projectService.getDetail(999L, 1L));
        assertEquals("NOT_FOUND", ex.getCode());
    }

    @Test
    void getDetail_deletedProject_throwsNotFound() {
        Project p = buildProject(10L, 1L, true);
        when(projectMapper.selectById(10L)).thenReturn(p);

        BizException ex = assertThrows(BizException.class,
                () -> projectService.getDetail(10L, 1L));
        assertEquals("NOT_FOUND", ex.getCode());
    }

    @Test
    void getDetail_wrongOwner_throwsForbidden() {
        Project p = buildProject(10L, 2L, false);
        when(projectMapper.selectById(10L)).thenReturn(p);

        BizException ex = assertThrows(BizException.class,
                () -> projectService.getDetail(10L, 1L));
        assertEquals("FORBIDDEN", ex.getCode());
    }

    @Test
    void update_shouldModifyFields() {
        Project p = buildProject(10L, 1L, false);
        when(projectMapper.selectById(10L)).thenReturn(p);
        when(projectMapper.updateById(any(Project.class))).thenReturn(1);

        UpdateProjectRequest req = new UpdateProjectRequest();
        req.setName("Updated Name");

        Project result = projectService.update(10L, req, 1L);

        assertEquals("Updated Name", result.getName());
        verify(projectMapper).updateById(any(Project.class));
    }

    @Test
    void update_nullName_shouldNotOverwrite() {
        Project p = buildProject(10L, 1L, false);
        p.setName("Original");
        when(projectMapper.selectById(10L)).thenReturn(p);
        when(projectMapper.updateById(any(Project.class))).thenReturn(1);

        UpdateProjectRequest req = new UpdateProjectRequest();
        req.setName(null);

        Project result = projectService.update(10L, req, 1L);

        assertEquals("Original", result.getName());
    }

    @Test
    void delete_shouldRemoveById() {
        Project p = buildProject(10L, 1L, false);
        when(projectMapper.selectById(10L)).thenReturn(p);
        when(projectMapper.deleteById(10L)).thenReturn(1);

        assertDoesNotThrow(() -> projectService.delete(10L, 1L));
        verify(projectMapper).deleteById(10L);
    }

    @Test
    void delete_wrongOwner_throwsForbidden() {
        Project p = buildProject(10L, 2L, false);
        when(projectMapper.selectById(10L)).thenReturn(p);

        assertThrows(BizException.class, () -> projectService.delete(10L, 1L));
    }
}