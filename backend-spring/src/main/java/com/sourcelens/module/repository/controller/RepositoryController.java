package com.sourcelens.module.repository.controller;

import com.sourcelens.common.Result;
import com.sourcelens.module.project.service.ProjectService;
import com.sourcelens.module.repository.dto.AddRepositoryRequest;
import com.sourcelens.module.repository.dto.BindGitHubAppInstallationRequest;
import com.sourcelens.module.repository.entity.GitHubAppInstallation;
import com.sourcelens.module.repository.entity.Repository;
import com.sourcelens.module.repository.service.GitHubAppInstallationService;
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
    private final GitHubAppInstallationService gitHubAppInstallationService;
    private final ProjectService projectService;

    @Operation(summary = "为项目添加仓库")
    @PostMapping("/projects/{projectId}/repositories")
    public Result<Repository> add(@PathVariable Long projectId,
                                  @Valid @RequestBody AddRepositoryRequest req,
                                  @RequestAttribute("userId") Long userId) {
        projectService.verifyOwnership(projectId, userId);
        return Result.ok(repositoryService.add(projectId, req, userId));
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
        return Result.ok(repositoryService.update(repositoryId, req, userId));
    }

    @Operation(summary = "删除仓库")
    @DeleteMapping("/repositories/{repositoryId}")
    public Result<Void> delete(@PathVariable Long repositoryId,
                               @RequestAttribute("userId") Long userId) {
        Repository repo = repositoryService.getDetail(repositoryId);
        projectService.verifyOwnership(repo.getProjectId(), userId);
        repositoryService.delete(repositoryId, userId);
        return Result.ok();
    }

    @Operation(summary = "绑定 GitHub App installation")
    @PutMapping("/repositories/{repositoryId}/github-app-installation")
    public Result<GitHubAppInstallation> bindGitHubAppInstallation(
            @PathVariable Long repositoryId,
            @Valid @RequestBody BindGitHubAppInstallationRequest req,
            @RequestAttribute("userId") Long userId) {
        Repository repo = repositoryService.getDetail(repositoryId);
        projectService.verifyOwnership(repo.getProjectId(), userId);
        return Result.ok(gitHubAppInstallationService.bind(repo, req, userId));
    }

    @Operation(summary = "获取仓库 GitHub App installation")
    @GetMapping("/repositories/{repositoryId}/github-app-installation")
    public Result<GitHubAppInstallation> getGitHubAppInstallation(@PathVariable Long repositoryId,
                                                                  @RequestAttribute("userId") Long userId) {
        Repository repo = repositoryService.getDetail(repositoryId);
        projectService.verifyOwnership(repo.getProjectId(), userId);
        return Result.ok(gitHubAppInstallationService.getActiveByRepository(repositoryId));
    }

    @Operation(summary = "禁用仓库 GitHub App installation")
    @DeleteMapping("/repositories/{repositoryId}/github-app-installation")
    public Result<Void> disableGitHubAppInstallation(@PathVariable Long repositoryId,
                                                     @RequestAttribute("userId") Long userId) {
        Repository repo = repositoryService.getDetail(repositoryId);
        projectService.verifyOwnership(repo.getProjectId(), userId);
        gitHubAppInstallationService.disable(repo, userId);
        return Result.ok();
    }
}
