package com.sourcelens.module.review.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sourcelens.common.exception.BizException;
import com.sourcelens.module.review.dto.CreatePrReviewRequest;
import com.sourcelens.module.review.entity.PrReview;
import com.sourcelens.module.review.entity.PrReviewComment;
import com.sourcelens.module.review.mapper.PrReviewCommentMapper;
import com.sourcelens.module.review.mapper.PrReviewMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
public class PrReviewService extends ServiceImpl<PrReviewMapper, PrReview> {

    private final PrReviewCommentMapper commentMapper;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public PrReviewService(PrReviewCommentMapper commentMapper) {
        this.commentMapper = commentMapper;
    }

    public PrReview create(CreatePrReviewRequest req, Long userId) {
        PrReview review = PrReview.builder()
                .projectId(req.getProjectId())
                .scanTaskId(req.getScanTaskId())
                .repositoryId(req.getRepositoryId())
                .prNumber(req.getPrNumber())
                .prTitle(req.getPrTitle())
                .prDescription(req.getPrDescription())
                .branch(req.getBranch())
                .baseBranch(req.getBaseBranch() != null ? req.getBaseBranch() : "main")
                .commitSha(req.getCommitSha())
                .author(req.getAuthor())
                .changedFiles(req.getChangedFiles())
                .diffSummary(req.getDiffSummary())
                .ciStatus(req.getCiStatus())
                .status("PENDING")
                .createdBy(userId)
                .build();
        save(review);
        log.info("创建 PR 审查: id={}, pr#{}", review.getId(), review.getPrNumber());
        return review;
    }

    @Async("scanTaskExecutor")
    @Transactional
    public void analyze(Long reviewId) {
        PrReview review = getById(reviewId);
        if (review == null) return;

        try {
            review.setStatus("ANALYZING");
            updateById(review);

            Map<String, Object> result = analyzePr(review);

            review.setRiskLevel((String) result.get("riskLevel"));
            review.setChangeSummary((String) result.get("changeSummary"));
            review.setImpactScope(toJson(result.get("impactScope")));
            review.setRisks(toJson(result.get("risks")));
            review.setTestSuggestions(toJson(result.get("testSuggestions")));
            review.setMergeRecommendation((String) result.get("mergeRecommendation"));
            review.setReviewJson(toJson(result));
            review.setStatus("COMPLETED");
            review.setUpdatedAt(LocalDateTime.now());
            updateById(review);

            // 保存行级评论
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> comments = (List<Map<String, Object>>) result.get("comments");
            if (comments != null) {
                for (Map<String, Object> c : comments) {
                    PrReviewComment comment = PrReviewComment.builder()
                            .reviewId(reviewId)
                            .filePath((String) c.get("filePath"))
                            .lineNumber(c.get("lineNumber") != null ? ((Number) c.get("lineNumber")).intValue() : null)
                            .severity((String) c.get("severity"))
                            .category((String) c.get("category"))
                            .message((String) c.get("message"))
                            .suggestion((String) c.get("suggestion"))
                            .build();
                    commentMapper.insert(comment);
                }
            }

            log.info("PR 审查完成: id={}, risk={}, merge={}", reviewId, review.getRiskLevel(), review.getMergeRecommendation());
        } catch (Exception e) {
            log.error("PR 审查失败: id={}", reviewId, e);
            review.setStatus("FAILED");
            review.setErrorMessage(e.getMessage());
            review.setUpdatedAt(LocalDateTime.now());
            updateById(review);
        }
    }

    private Map<String, Object> analyzePr(PrReview review) {
        Map<String, Object> result = new LinkedHashMap<>();
        String diff = review.getDiffSummary() != null ? review.getDiffSummary() : "";
        String filesJson = review.getChangedFiles() != null ? review.getChangedFiles() : "[]";

        // 解析变更文件列表
        List<String> filePaths = parseFilePaths(filesJson);
        Map<String, List<String>> filesByCategory = categorizeFiles(filePaths);

        // 解析 diff 内容
        List<String> addedLines = extractAddedLines(diff);
        List<String> deletedLines = extractDeletedLines(diff);
        List<String> diffContent = new ArrayList<>();
        diffContent.addAll(addedLines);
        diffContent.addAll(deletedLines);
        String diffLower = String.join("\n", diffContent).toLowerCase();

        // 基于真实 diff 内容和文件路径检测风险
        List<Map<String, Object>> risks = new ArrayList<>();
        List<Map<String, Object>> comments = new ArrayList<>();
        int riskScore = 0;

        // 1. 数据库变更: 检查实际文件路径和 diff 中的 SQL 语句
        List<String> sqlFiles = filesByCategory.getOrDefault("SQL", Collections.emptyList());
        boolean hasSqlInDiff = diffLower.matches("(?s).*(alter table|create table|drop table|insert into|update .+ set|delete from|create index).*");
        if (!sqlFiles.isEmpty() || hasSqlInDiff) {
            risks.add(Map.of("category", "DATABASE", "severity", "HIGH",
                    "message", "涉及 " + sqlFiles.size() + " 个 SQL/迁移文件变更"));
            riskScore += 3;
            for (String f : sqlFiles.stream().limit(3).toList()) {
                comments.add(Map.of(
                        "filePath", f, "severity", "WARNING", "category", "CORRECTNESS",
                        "message", "数据库迁移文件 " + f + " 需要审查向后兼容性",
                        "suggestion", "建议: 1) 检查数据回滚方案; 2) 确认测试环境执行通过; 3) 检查索引变更影响"));
            }
        }

        // 2. 安全相关: 检查实际文件路径和 diff 中的敏感模式
        List<String> securityFiles = filesByCategory.getOrDefault("SECURITY", Collections.emptyList());
        boolean hasSecurityPatterns = diffLower.matches("(?s).*(password|secret|token|jwt|session|credential|encrypt|decrypt|auth).*");
        if (!securityFiles.isEmpty() || hasSecurityPatterns) {
            risks.add(Map.of("category", "SECURITY", "severity", "HIGH",
                    "message", "涉及安全相关逻辑变更"));
            riskScore += 3;
            for (String f : securityFiles.stream().limit(2).toList()) {
                comments.add(Map.of(
                        "filePath", f, "severity", "CRITICAL", "category", "SECURITY",
                        "message", "安全文件 " + f + " 变更需要严格审查",
                        "suggestion", "建议: 1) 确认无硬编码密钥; 2) 检查输入校验; 3) 验证权限控制"));
            }
            // 检查 diff 中是否有硬编码敏感信息
            for (String line : addedLines) {
                String lower = line.toLowerCase();
                if (lower.matches(".*(\"|')(password|secret|token|key|api_key)(\"|').*[:=].*(\"|').+.*")) {
                    comments.add(Map.of(
                            "filePath", "diff 新增行", "severity", "CRITICAL", "category", "SECURITY",
                            "message", "可能存在硬编码敏感信息: " + line.trim().substring(0, Math.min(80, line.trim().length())),
                            "suggestion", "建议使用环境变量或配置中心管理敏感信息"));
                    riskScore += 2;
                }
            }
        }

        // 3. API 层变更: 检查 Controller 文件
        List<String> controllerFiles = filesByCategory.getOrDefault("CONTROLLER", Collections.emptyList());
        if (!controllerFiles.isEmpty()) {
            risks.add(Map.of("category", "API_COMPATIBILITY", "severity", "MEDIUM",
                    "message", "涉及 " + controllerFiles.size() + " 个 Controller 文件变更"));
            riskScore += 2;
            for (String f : controllerFiles.stream().limit(3).toList()) {
                comments.add(Map.of(
                        "filePath", f, "severity", "WARNING", "category", "COMPATIBILITY",
                        "message", "API 文件 " + f + " 变更可能影响现有调用方",
                        "suggestion", "建议: 1) 检查 breaking change; 2) 更新 API 文档; 3) 确认版本兼容"));
            }
        }

        // 4. 配置变更
        List<String> configFiles = filesByCategory.getOrDefault("CONFIG", Collections.emptyList());
        if (!configFiles.isEmpty()) {
            risks.add(Map.of("category", "CONFIGURATION", "severity", "MEDIUM",
                    "message", "涉及 " + configFiles.size() + " 个配置文件变更"));
            riskScore += 1;
        }

        // 5. 大量变更
        if (filePaths.size() > 10) {
            risks.add(Map.of("category", "SCOPE", "severity", "MEDIUM",
                    "message", "涉及 " + filePaths.size() + " 个文件变更, 审查难度较高"));
            riskScore += 2;
        }

        // 6. 删除操作: 基于 diff 中的删除行统计
        if (!deletedLines.isEmpty()) {
            int deletedCount = deletedLines.size();
            if (deletedCount > 20) {
                risks.add(Map.of("category", "DELETION", "severity", "HIGH",
                        "message", "删除了 " + deletedCount + " 行代码, 请确认删除范围合理"));
                riskScore += 2;
            } else if (deletedCount > 0) {
                risks.add(Map.of("category", "DELETION", "severity", "LOW",
                        "message", "删除了 " + deletedCount + " 行代码"));
                riskScore += 1;
            }
        }

        // 7. 缺少测试
        boolean hasTestFiles = filePaths.stream().anyMatch(f -> f.toLowerCase().contains("test") || f.toLowerCase().contains("spec"));
        if (!hasTestFiles && (filePaths.size() > 3 || riskScore > 2)) {
            risks.add(Map.of("category", "TEST_COVERAGE", "severity", "MEDIUM",
                    "message", "PR 未包含测试文件, 但涉及 " + filePaths.size() + " 个文件变更"));
            riskScore += 2;
            comments.add(Map.of(
                    "filePath", "测试目录", "severity", "WARNING", "category", "TEST",
                    "message", "变更未覆盖测试, 建议补充",
                    "suggestion", "建议: 为变更的 " + filesByCategory.keySet() + " 模块添加测试"));
        }

        // 8. CI 状态
        if ("failure".equals(review.getCiStatus())) {
            risks.add(Map.of("category", "CI_FAILURE", "severity", "HIGH",
                    "message", "CI 未通过, 不建议合并"));
            riskScore += 3;
        }

        // 确定风险等级
        String riskLevel;
        if (riskScore >= 8) riskLevel = "CRITICAL";
        else if (riskScore >= 5) riskLevel = "HIGH";
        else if (riskScore >= 3) riskLevel = "MEDIUM";
        else riskLevel = "LOW";

        String mergeRec;
        if ("CRITICAL".equals(riskLevel) || "failure".equals(review.getCiStatus())) {
            mergeRec = "BLOCKED";
        } else if ("HIGH".equals(riskLevel)) {
            mergeRec = "CHANGES_REQUESTED";
        } else {
            mergeRec = "MERGE";
        }

        // 变更摘要: 基于实际文件分类
        String changeSummary = buildChangeSummary(filesByCategory, addedLines.size(), deletedLines.size());

        // 影响范围: 基于实际文件路径
        List<String> impactScope = buildImpactScope(filesByCategory);

        // 测试建议: 基于实际风险类型
        List<String> testSuggestions = buildTestSuggestions(risks, filesByCategory);

        result.put("riskLevel", riskLevel);
        result.put("changeSummary", changeSummary);
        result.put("impactScope", impactScope);
        result.put("risks", risks);
        result.put("testSuggestions", testSuggestions);
        result.put("mergeRecommendation", mergeRec);
        result.put("comments", comments);
        result.put("diffStats", Map.of("addedLines", addedLines.size(), "deletedLines", deletedLines.size(),
                "totalFiles", filePaths.size(), "riskScore", riskScore));

        return result;
    }

    // ===== Diff 解析 =====

    private List<String> parseFilePaths(String filesJson) {
        try {
            Object parsed = objectMapper.readValue(filesJson, Object.class);
            if (parsed instanceof List<?> list) {
                return list.stream().map(String::valueOf).toList();
            }
        } catch (Exception ignored) {}
        // 回退: 按逗号分割
        return Arrays.stream(filesJson.replaceAll("[\\[\\]\"]", "").split(","))
                .map(String::trim).filter(s -> !s.isEmpty()).toList();
    }

    private List<String> extractAddedLines(String diff) {
        List<String> added = new ArrayList<>();
        for (String line : diff.split("\n")) {
            if (line.startsWith("+") && !line.startsWith("+++")) {
                String content = line.substring(1).trim();
                if (!content.isEmpty()) added.add(content);
            }
        }
        return added;
    }

    private List<String> extractDeletedLines(String diff) {
        List<String> deleted = new ArrayList<>();
        for (String line : diff.split("\n")) {
            if (line.startsWith("-") && !line.startsWith("---")) {
                String content = line.substring(1).trim();
                if (!content.isEmpty()) deleted.add(content);
            }
        }
        return deleted;
    }

    private Map<String, List<String>> categorizeFiles(List<String> filePaths) {
        Map<String, List<String>> categories = new LinkedHashMap<>();
        for (String path : filePaths) {
            String lower = path.toLowerCase();
            String ext = lower.contains(".") ? lower.substring(lower.lastIndexOf('.')) : "";

            if (ext.equals(".sql") || lower.contains("migration")) {
                categories.computeIfAbsent("SQL", k -> new ArrayList<>()).add(path);
            } else if (lower.contains("controller")) {
                categories.computeIfAbsent("CONTROLLER", k -> new ArrayList<>()).add(path);
            } else if (lower.contains("service") && !lower.contains("test")) {
                categories.computeIfAbsent("SERVICE", k -> new ArrayList<>()).add(path);
            } else if (lower.contains("mapper") || lower.contains("entity") || lower.contains("repository")) {
                categories.computeIfAbsent("DATA", k -> new ArrayList<>()).add(path);
            } else if (ext.equals(".tsx") || ext.equals(".ts") || ext.equals(".vue") || ext.equals(".jsx")) {
                categories.computeIfAbsent("FRONTEND", k -> new ArrayList<>()).add(path);
            } else if (lower.contains("test") || lower.contains("spec")) {
                categories.computeIfAbsent("TEST", k -> new ArrayList<>()).add(path);
            } else if (ext.equals(".yml") || ext.equals(".yaml") || ext.equals(".properties") || ext.equals(".toml")) {
                categories.computeIfAbsent("CONFIG", k -> new ArrayList<>()).add(path);
            } else if (lower.contains("auth") || lower.contains("security") || lower.contains("password") || lower.contains("token")) {
                categories.computeIfAbsent("SECURITY", k -> new ArrayList<>()).add(path);
            } else if (ext.equals(".java") || ext.equals(".kt") || ext.equals(".rs") || ext.equals(".go")) {
                categories.computeIfAbsent("SOURCE", k -> new ArrayList<>()).add(path);
            } else {
                categories.computeIfAbsent("OTHER", k -> new ArrayList<>()).add(path);
            }
        }
        return categories;
    }

    // ===== 基于真实数据的摘要/范围/测试建议 =====

    private String buildChangeSummary(Map<String, List<String>> filesByCategory, int added, int deleted) {
        List<String> parts = new ArrayList<>();
        filesByCategory.forEach((cat, files) -> {
            switch (cat) {
                case "SQL" -> parts.add("数据库迁移 (" + files.size() + " 个文件)");
                case "CONTROLLER" -> parts.add("API 接口 (" + files.size() + " 个文件)");
                case "SERVICE" -> parts.add("业务逻辑 (" + files.size() + " 个文件)");
                case "DATA" -> parts.add("数据层 (" + files.size() + " 个文件)");
                case "FRONTEND" -> parts.add("前端 (" + files.size() + " 个文件)");
                case "TEST" -> parts.add("测试 (" + files.size() + " 个文件)");
                case "CONFIG" -> parts.add("配置 (" + files.size() + " 个文件)");
                case "SECURITY" -> parts.add("安全 (" + files.size() + " 个文件)");
                case "SOURCE" -> parts.add("源码 (" + files.size() + " 个文件)");
                default -> parts.add(cat + " (" + files.size() + " 个文件)");
            }
        });
        return String.join(", ", parts) + " | +" + added + "/-" + deleted + " 行";
    }

    private List<String> buildImpactScope(Map<String, List<String>> filesByCategory) {
        List<String> scope = new ArrayList<>();
        filesByCategory.forEach((cat, files) -> {
            switch (cat) {
                case "CONTROLLER" -> scope.add("API 层: " + files.stream().limit(3).toList());
                case "SERVICE" -> scope.add("业务层: " + files.stream().limit(3).toList());
                case "DATA" -> scope.add("数据层: " + files.stream().limit(3).toList());
                case "FRONTEND" -> scope.add("前端: " + files.stream().limit(3).toList());
                case "TEST" -> scope.add("测试: " + files.stream().limit(3).toList());
                case "SQL" -> scope.add("数据库: " + files.stream().limit(3).toList());
                case "CONFIG" -> scope.add("配置: " + files.stream().limit(3).toList());
                case "SECURITY" -> scope.add("安全: " + files.stream().limit(3).toList());
                default -> scope.add(cat + ": " + files.stream().limit(3).toList());
            }
        });
        return scope.isEmpty() ? List.of("未识别到明确影响范围") : scope;
    }

    private List<String> buildTestSuggestions(List<Map<String, Object>> risks, Map<String, List<String>> filesByCategory) {
        List<String> suggestions = new ArrayList<>();
        boolean hasDb = risks.stream().anyMatch(r -> "DATABASE".equals(r.get("category")));
        boolean hasApi = risks.stream().anyMatch(r -> "API_COMPATIBILITY".equals(r.get("category")));
        boolean hasSecurity = risks.stream().anyMatch(r -> "SECURITY".equals(r.get("category")));

        if (hasDb) {
            List<String> sqlFiles = filesByCategory.getOrDefault("SQL", Collections.emptyList());
            suggestions.add("为变更的 SQL 文件编写迁移测试: " + sqlFiles);
        }
        if (hasApi) {
            List<String> controllers = filesByCategory.getOrDefault("CONTROLLER", Collections.emptyList());
            suggestions.add("为变更的 Controller 编写集成测试: " + controllers);
        }
        if (hasSecurity) {
            suggestions.add("为安全相关逻辑添加边界条件和异常路径测试");
        }

        List<String> sourceFiles = filesByCategory.getOrDefault("SOURCE", Collections.emptyList());
        List<String> serviceFiles = filesByCategory.getOrDefault("SERVICE", Collections.emptyList());
        if (!sourceFiles.isEmpty() || !serviceFiles.isEmpty()) {
            suggestions.add("为变更的业务代码编写单元测试");
        }
        suggestions.add("运行完整测试套件确认无回归");
        return suggestions;
    }

    // ===== 查询 =====

    public Page<PrReview> listByProject(Long projectId, int page, int pageSize, String status) {
        LambdaQueryWrapper<PrReview> wrapper = new LambdaQueryWrapper<PrReview>()
                .eq(PrReview::getProjectId, projectId)
                .orderByDesc(PrReview::getCreatedAt);
        if (status != null && !status.isEmpty()) {
            wrapper.eq(PrReview::getStatus, status);
        }
        return page(new Page<>(page, pageSize), wrapper);
    }

    public PrReview getDetail(Long id) {
        PrReview r = getById(id);
        if (r == null || Boolean.TRUE.equals(r.getDeleted())) {
            throw BizException.notFound("PrReview");
        }
        return r;
    }

    public List<PrReviewComment> listComments(Long reviewId) {
        return commentMapper.selectList(
                new LambdaQueryWrapper<PrReviewComment>()
                        .eq(PrReviewComment::getReviewId, reviewId)
                        .orderByAsc(PrReviewComment::getSeverity));
    }

    private String toJson(Object obj) {
        if (obj == null) return null;
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return String.valueOf(obj);
        }
    }
}