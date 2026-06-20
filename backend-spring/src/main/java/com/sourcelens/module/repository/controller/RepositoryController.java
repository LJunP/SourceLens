package com.sourcelens.module.repository.controller;

import com.sourcelens.common.Result;
import com.sourcelens.module.project.service.ProjectService;
import com.sourcelens.module.repository.dto.AddRepositoryRequest;
import com.sourcelens.module.repository.entity.Repository;
import com.sourcelens.module.repository.service.RepositoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "仓库")
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class RepositoryController {

    private final RepositoryService repositoryService;
    private final ProjectService projectService;

    @Operation(summary = "为项目添加仓库")
    @PostMapping("/projects/{projectId}/repositories")
    public Result<Repository> add(@PathVariable Long projectId,
                                  @Valid @RequestBody AddRepositoryRequest req,
                                  @RequestAttribute("userId") Long userId) {
        projectService.verifyOwnership(projectId, userId);
        return Result.ok(repositoryService.add(projectId, req));
    }

    @Operation(summary = "项目下的仓库列表")
    @GetMapping("/projects/{projectId}/repositories")
    public Result<List<Repository>> list(@PathVariable Long projectId,
                                         @RequestAttribute("userId") Long userId) {
        projectService.verifyOwnership(projectId, userId);
        return Result.ok(repositoryService.listByProject(projectId));
    }

    @Operation(summary = "仓库详情")
    @GetMapping("/repositories/{repositoryId}")
    public Result<Repository> detail(@PathVariable Long repositoryId,
                                     @RequestAttribute("userId") Long userId) {
        Repository repo = repositoryService.getDetail(repositoryId);
        projectService.verifyOwnership(repo.getProjectId(), userId);
        return Result.ok(repo);
    }

    @Operation(summary = "更新仓库")
    @PutMapping("/repositories/{repositoryId}")
    public Result<Repository> update(@PathVariable Long repositoryId,
                                     @Valid @RequestBody AddRepositoryRequest req,
                                     @RequestAttribute("userId") Long userId) {
        Repository repo = repositoryService.getDetail(repositoryId);
        projectService.verifyOwnership(repo.getProjectId(), userId);
        return Result.ok(repositoryService.update(repositoryId, req));
    }

    @Operation(summary = "删除仓库")
    @DeleteMapping("/repositories/{repositoryId}")
    public Result<Void> delete(@PathVariable Long repositoryId,
                               @RequestAttribute("userId") Long userId) {
        Repository repo = repositoryService.getDetail(repositoryId);
        projectService.verifyOwnership(repo.getProjectId(), userId);
        repositoryService.delete(repositoryId);
        return Result.ok();
    }
}