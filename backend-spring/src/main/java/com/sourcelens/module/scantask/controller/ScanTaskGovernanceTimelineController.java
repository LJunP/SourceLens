package com.sourcelens.module.scantask.controller;

import com.sourcelens.common.Result;
import com.sourcelens.module.project.service.ProjectService;
import com.sourcelens.module.scantask.dto.ScanGovernanceTimelineResponse;
import com.sourcelens.module.scantask.service.ScanTaskGovernanceTimelineService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "扫描治理时间线")
@RestController
@RequestMapping("/api/projects/{projectId}/scan-tasks/{scanTaskId}/governance-timeline")
@RequiredArgsConstructor
public class ScanTaskGovernanceTimelineController {

    private final ProjectService projectService;
    private final ScanTaskGovernanceTimelineService timelineService;

    @Operation(summary = "查询当前扫描的修复治理时间线")
    @GetMapping
    public Result<ScanGovernanceTimelineResponse> getTimeline(
            @PathVariable Long projectId,
            @PathVariable Long scanTaskId,
            @RequestAttribute("userId") Long userId) {
        projectService.verifyOwnership(projectId, userId);
        return Result.ok(timelineService.getTimeline(projectId, scanTaskId));
    }
}
