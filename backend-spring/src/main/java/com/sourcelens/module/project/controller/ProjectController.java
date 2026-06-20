package com.sourcelens.module.project.controller;

import com.sourcelens.common.PageResult;
import com.sourcelens.common.Result;
import com.sourcelens.module.project.dto.CreateProjectRequest;
import com.sourcelens.module.project.dto.UpdateProjectRequest;
import com.sourcelens.module.project.entity.Project;
import com.sourcelens.module.project.service.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "项目")
@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @Operation(summary = "创建项目")
    @PostMapping
    public Result<Project> create(@Valid @RequestBody CreateProjectRequest req,
                                  @RequestAttribute("userId") Long userId) {
        return Result.ok(projectService.create(req, userId));
    }

    @Operation(summary = "项目列表")
    @GetMapping
    public Result<PageResult<Project>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestAttribute("userId") Long userId) {
        var records = projectService.listByUser(userId, page, pageSize);
        List<Project> items = records.getRecords();
        return Result.ok(PageResult.of(items, page, pageSize, records.getTotal()));
    }

    @Operation(summary = "项目详情")
    @GetMapping("/{projectId}")
    public Result<Project> detail(@PathVariable Long projectId,
                                  @RequestAttribute("userId") Long userId) {
        return Result.ok(projectService.getDetail(projectId, userId));
    }

    @Operation(summary = "更新项目")
    @PutMapping("/{projectId}")
    public Result<Project> update(@PathVariable Long projectId,
                                  @Valid @RequestBody UpdateProjectRequest req,
                                  @RequestAttribute("userId") Long userId) {
        return Result.ok(projectService.update(projectId, req, userId));
    }

    @Operation(summary = "删除项目")
    @DeleteMapping("/{projectId}")
    public Result<Void> delete(@PathVariable Long projectId,
                               @RequestAttribute("userId") Long userId) {
        projectService.delete(projectId, userId);
        return Result.ok();
    }
}