package com.sourcelens.module.ci.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sourcelens.common.PageResult;
import com.sourcelens.common.Result;
import com.sourcelens.module.project.service.ProjectService;
import com.sourcelens.module.ci.dto.CreateCiDiagnosticRequest;
import com.sourcelens.module.ci.entity.CiDiagnostic;
import com.sourcelens.module.ci.service.CiDiagnosticService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@Tag(name = "CI 诊断")
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CiDiagnosticController {

    private final CiDiagnosticService ciDiagnosticService;
    private final ProjectService projectService;

    @Operation(summary = "创建 CI 诊断(同时触发分析)")
    @PostMapping("/ci-diagnostics")
    public Result<CiDiagnostic> create(@Valid @RequestBody CreateCiDiagnosticRequest req,
                                        @RequestAttribute("userId") Long userId) {
        projectService.verifyOwnership(req.getProjectId(), userId);
        CiDiagnostic diag = ciDiagnosticService.create(req, userId);
        ciDiagnosticService.analyze(diag.getId());
        return Result.ok(diag);
    }

    @Operation(summary = "CI 诊断列表(按项目)")
    @GetMapping("/projects/{projectId}/ci-diagnostics")
    public Result<PageResult<CiDiagnostic>> list(
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String status,
            @RequestAttribute("userId") Long userId) {
        projectService.verifyOwnership(projectId, userId);
        Page<CiDiagnostic> records = ciDiagnosticService.listByProject(projectId, page, pageSize, status);
        return Result.ok(PageResult.of(records.getRecords(), page, pageSize, records.getTotal()));
    }

    @Operation(summary = "CI 诊断详情")
    @GetMapping("/ci-diagnostics/{id}")
    public Result<CiDiagnostic> detail(@PathVariable Long id,
                                       @RequestAttribute("userId") Long userId) {
        CiDiagnostic diag = ciDiagnosticService.getDetail(id);
        projectService.verifyOwnership(diag.getProjectId(), userId);
        return Result.ok(diag);
    }

    @Operation(summary = "重新分析")
    @PostMapping("/ci-diagnostics/{id}/reanalyze")
    public Result<CiDiagnostic> reanalyze(@PathVariable Long id,
                                          @RequestAttribute("userId") Long userId) {
        CiDiagnostic diag = ciDiagnosticService.getDetail(id);
        projectService.verifyOwnership(diag.getProjectId(), userId);
        diag.setStatus("PENDING");
        ciDiagnosticService.updateById(diag);
        ciDiagnosticService.analyze(id);
        return Result.ok(diag);
    }
}