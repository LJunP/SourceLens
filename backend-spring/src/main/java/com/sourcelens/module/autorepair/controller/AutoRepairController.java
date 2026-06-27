package com.sourcelens.module.autorepair.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.sourcelens.common.Result;
import com.sourcelens.module.autorepair.dto.AutoRepairRequest;
import com.sourcelens.module.autorepair.entity.AutoRepair;
import com.sourcelens.module.autorepair.service.AutoRepairService;
import com.sourcelens.module.project.service.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "受控代码补丁生成")
@RestController
@RequestMapping("/api/projects/{projectId}/auto-repairs")
@RequiredArgsConstructor
@Slf4j
public class AutoRepairController {

    private final AutoRepairService autoRepairService;
    private final ProjectService projectService;

    @Operation(summary = "创建自动补丁任务(异步)")
    @PostMapping
    public Result<AutoRepair> createRepair(
            @PathVariable Long projectId,
            @Valid @RequestBody AutoRepairRequest req,
            @RequestAttribute("userId") Long userId) {
        
        // 1. 创建 PENDING 任务记录并校验权限与大模型配置
        AutoRepair repair = autoRepairService.createRepairTask(projectId, req, userId);

        // 2. 异步执行补丁生成流程 (克隆/拷贝、沙箱修改、Diff 捕获)
        autoRepairService.executeRepairAsync(repair.getId(), userId);

        return Result.ok(repair);
    }

    @Operation(summary = "查询项目下的所有自动补丁任务列表")
    @GetMapping
    public Result<List<AutoRepair>> listRepairs(
            @PathVariable Long projectId,
            @RequestAttribute("userId") Long userId) {
        
        // 校验项目所有权
        projectService.verifyOwnership(projectId, userId);

        List<AutoRepair> list = autoRepairService.list(
                new LambdaQueryWrapper<AutoRepair>()
                        .eq(AutoRepair::getProjectId, projectId)
                        .orderByDesc(AutoRepair::getCreatedAt)
        );

        return Result.ok(list);
    }

    @Operation(summary = "获取自动补丁任务详情")
    @GetMapping("/{id}")
    public Result<AutoRepair> getRepairDetail(
            @PathVariable Long projectId,
            @PathVariable Long id,
            @RequestAttribute("userId") Long userId) {
        
        // 校验项目所有权
        projectService.verifyOwnership(projectId, userId);

        AutoRepair repair = autoRepairService.getById(id);
        if (repair == null || !projectId.equals(repair.getProjectId())) {
            return Result.fail("ERROR", "找不到该修码任务详情");
        }

        return Result.ok(repair);
    }

    @Operation(summary = "启动受控 Pull Request 创建(异步)")
    @PostMapping("/{id}/submit-pr")
    public Result<AutoRepair> submitPr(
            @PathVariable Long projectId,
            @PathVariable Long id,
            @RequestAttribute("userId") Long userId) {
        
        AutoRepair repair = autoRepairService.submitPr(projectId, id, userId);
        autoRepairService.executeSubmitPrAsync(repair.getId(), userId);
        return Result.ok(repair);
    }

    @Operation(summary = "取消自动补丁任务")
    @PostMapping("/{id}/cancel")
    public Result<AutoRepair> cancel(
            @PathVariable Long projectId,
            @PathVariable Long id,
            @RequestAttribute("userId") Long userId) {
        return Result.ok(autoRepairService.cancelRepair(projectId, id, userId));
    }
}
