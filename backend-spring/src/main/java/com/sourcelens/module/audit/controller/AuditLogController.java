package com.sourcelens.module.audit.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sourcelens.common.PageResult;
import com.sourcelens.common.Result;
import com.sourcelens.module.audit.entity.AuditLog;
import com.sourcelens.module.audit.service.AuditLogService;
import com.sourcelens.module.project.service.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "审计日志")
@RestController
@RequestMapping("/api/projects/{projectId}/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;
    private final ProjectService projectService;

    @Operation(summary = "查询项目审计日志")
    @GetMapping
    public Result<PageResult<AuditLog>> listProjectAuditLogs(
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) Long auditLogId,
            @RequestParam(required = false) String resourceType,
            @RequestParam(required = false) Long resourceId,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String status,
            @RequestAttribute("userId") Long userId) {
        projectService.verifyOwnership(projectId, userId);
        Page<AuditLog> records = auditLogService.listByProject(projectId, page, pageSize,
                auditLogId, resourceType, resourceId, action, status);
        return Result.ok(PageResult.of(records.getRecords(), page, pageSize, records.getTotal()));
    }
}
