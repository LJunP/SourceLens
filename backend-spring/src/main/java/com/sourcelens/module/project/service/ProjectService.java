package com.sourcelens.module.project.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.sourcelens.common.exception.BizException;
import com.sourcelens.module.project.dto.CreateProjectRequest;
import com.sourcelens.module.project.dto.UpdateProjectRequest;
import com.sourcelens.module.project.entity.Project;
import com.sourcelens.module.project.mapper.ProjectMapper;
import org.springframework.stereotype.Service;

@Service
public class ProjectService extends ServiceImpl<ProjectMapper, Project> {

    public Project create(CreateProjectRequest req, Long userId) {
        Project project = Project.builder()
                .name(req.getName())
                .description(req.getDescription())
                .createdBy(userId)
                .status("ACTIVE")
                .build();
        save(project);
        return project;
    }

    public Page<Project> listByUser(Long userId, int page, int pageSize) {
        return page(new Page<>(page, pageSize),
                new LambdaQueryWrapper<Project>()
                        .eq(Project::getCreatedBy, userId)
                        .orderByDesc(Project::getCreatedAt));
    }

    public Project getDetail(Long projectId, Long userId) {
        Project project = getById(projectId);
        if (project == null || project.getDeleted()) {
            throw BizException.notFound("Project");
        }
        if (!project.getCreatedBy().equals(userId)) {
            throw BizException.forbidden("无权访问此项目");
        }
        return project;
    }

    public Project update(Long projectId, UpdateProjectRequest req, Long userId) {
        Project project = getDetail(projectId, userId);
        if (req.getName() != null) project.setName(req.getName());
        if (req.getDescription() != null) project.setDescription(req.getDescription());
        updateById(project);
        return project;
    }

    public void delete(Long projectId, Long userId) {
        getDetail(projectId, userId);
        removeById(projectId);
    }

    /** 验证用户是否拥有该项目,无权限则抛 403 */
    public void verifyOwnership(Long projectId, Long userId) {
        getDetail(projectId, userId);
    }
}