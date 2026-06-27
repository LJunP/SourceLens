package com.sourcelens.module.review.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sourcelens.common.PageResult;
import com.sourcelens.common.Result;
import com.sourcelens.module.project.service.ProjectService;
import com.sourcelens.module.review.dto.CreatePrReviewRequest;
import com.sourcelens.module.review.entity.PrReview;
import com.sourcelens.module.review.entity.PrReviewComment;
import com.sourcelens.module.review.service.PrReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "PR 风险审查")
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PrReviewController {

    private final PrReviewService prReviewService;
    private final ProjectService projectService;

    @Operation(summary = "创建 PR 审查(同时触发分析)")
    @PostMapping("/pr-reviews")
    public Result<PrReview> create(@Valid @RequestBody CreatePrReviewRequest req,
                                    @RequestAttribute("userId") Long userId) {
        projectService.verifyOwnership(req.getProjectId(), userId);
        PrReview review = prReviewService.create(req, userId);
        prReviewService.analyze(review.getId());
        return Result.ok(review);
    }

    @Operation(summary = "PR 审查列表(按项目)")
    @GetMapping("/projects/{projectId}/pr-reviews")
    public Result<PageResult<PrReview>> list(
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String status,
            @RequestAttribute("userId") Long userId) {
        projectService.verifyOwnership(projectId, userId);
        Page<PrReview> records = prReviewService.listByProject(projectId, page, pageSize, status);
        return Result.ok(PageResult.of(records.getRecords(), page, pageSize, records.getTotal()));
    }

    @Operation(summary = "PR 审查详情")
    @GetMapping("/pr-reviews/{id}")
    public Result<PrReview> detail(@PathVariable Long id,
                                    @RequestAttribute("userId") Long userId) {
        PrReview review = prReviewService.getDetail(id);
        projectService.verifyOwnership(review.getProjectId(), userId);
        return Result.ok(review);
    }

    @Operation(summary = "获取行级评论")
    @GetMapping("/pr-reviews/{id}/comments")
    public Result<List<PrReviewComment>> listComments(@PathVariable Long id,
                                                       @RequestAttribute("userId") Long userId) {
        PrReview review = prReviewService.getDetail(id);
        projectService.verifyOwnership(review.getProjectId(), userId);
        return Result.ok(prReviewService.listComments(id));
    }

    @Operation(summary = "重新分析")
    @PostMapping("/pr-reviews/{id}/reanalyze")
    public Result<PrReview> reanalyze(@PathVariable Long id,
                                       @RequestAttribute("userId") Long userId) {
        PrReview review = prReviewService.getDetail(id);
        projectService.verifyOwnership(review.getProjectId(), userId);
        review = prReviewService.requeueAnalysis(id);
        prReviewService.analyze(id);
        return Result.ok(review);
    }
}
