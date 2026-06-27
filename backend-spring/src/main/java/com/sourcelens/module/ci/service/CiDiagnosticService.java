package com.sourcelens.module.ci.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sourcelens.common.exception.BizException;
import com.sourcelens.common.security.SensitiveDataSanitizer;
import com.sourcelens.module.agent.entity.LlmConfig;
import com.sourcelens.module.agent.service.LlmClient;
import com.sourcelens.module.agent.service.LlmConfigService;
import com.sourcelens.module.agent.service.LlmJsonExtractor;
import com.sourcelens.module.agent.service.PromptInjectionGuard;
import com.sourcelens.module.ci.dto.CreateCiDiagnosticRequest;
import com.sourcelens.module.ci.entity.CiDiagnostic;
import com.sourcelens.module.ci.mapper.CiDiagnosticMapper;
import com.sourcelens.module.execution.entity.ExecutionAttempt;
import com.sourcelens.module.execution.entity.ExecutionTask;
import com.sourcelens.module.execution.service.ExecutionTaskService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
public class CiDiagnosticService extends ServiceImpl<CiDiagnosticMapper, CiDiagnostic> {

    private static final int MAX_TEXT_FIELD_LENGTH = 8_000;
    private static final int MAX_JSON_FIELD_LENGTH = 16_000;
    private static final int MAX_ERROR_LENGTH = 4_000;

    private final LlmClient llmClient;
    private final LlmConfigService llmConfigService;
    private final LlmJsonExtractor llmJsonExtractor;
    private final ExecutionTaskService executionTaskService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public CiDiagnosticService(LlmClient llmClient,
                               LlmConfigService llmConfigService,
                               LlmJsonExtractor llmJsonExtractor,
                               ExecutionTaskService executionTaskService) {
        this.llmClient = llmClient;
        this.llmConfigService = llmConfigService;
        this.llmJsonExtractor = llmJsonExtractor;
        this.executionTaskService = executionTaskService;
    }

    public CiDiagnostic create(CreateCiDiagnosticRequest req, Long userId) {
        CiDiagnostic diag = CiDiagnostic.builder()
                .projectId(req.getProjectId())
                .scanTaskId(req.getScanTaskId())
                .repositoryId(req.getRepositoryId())
                .provider(req.getProvider() != null ? req.getProvider() : "GITHUB_ACTIONS")
                .workflowName(req.getWorkflowName())
                .workflowRunId(req.getWorkflowRunId())
                .runNumber(req.getRunNumber())
                .branch(req.getBranch())
                .commitSha(req.getCommitSha())
                .commitMessage(req.getCommitMessage())
                .status("PENDING")
                .conclusion(req.getConclusion())
                .rawLogSnippet(sanitizeText(req.getRawLogSnippet()))
                .createdBy(userId)
                .build();
        save(diag);
        executionTaskService.create(diag.getProjectId(), diag.getRepositoryId(), "CI_DIAGNOSTIC",
                "CI_DIAGNOSTIC", diag.getId(), userId);
        log.info("创建 CI 诊断: id={}, workflow={}", diag.getId(), diag.getWorkflowName());
        return diag;
    }

    public CiDiagnostic requeueAnalysis(Long diagnosticId) {
        CiDiagnostic diag = getDetail(diagnosticId);
        if ("ANALYZING".equals(diag.getStatus())) {
            throw BizException.badRequest("CI 诊断正在分析中，请勿重复触发");
        }
        diag.setStatus("PENDING");
        diag.setErrorMessage(null);
        diag.setUpdatedAt(LocalDateTime.now());
        updateById(diag);
        ExecutionTask executionTask = getOrCreateExecutionTask(diag);
        if (executionTask != null) {
            executionTaskService.startNewAttempt(executionTask.getId());
        }
        return diag;
    }

    @Async("scanTaskExecutor")
    public void analyze(Long diagnosticId) {
        CiDiagnostic diag = getById(diagnosticId);
        if (diag == null) return;
        if (!claimAnalysis(diagnosticId)) {
            log.info("跳过 CI 诊断分析，状态已变化或正在分析: id={}", diagnosticId);
            return;
        }
        diag.setStatus("ANALYZING");
        ExecutionTask executionTask = getOrCreateExecutionTask(diag);
        ExecutionAttempt attempt = executionTask == null ? null : executionTaskService.getOrCreateCurrentAttempt(executionTask.getId());
        Long attemptId = attempt == null ? null : attempt.getId();
        startExecutionStep(attemptId, "analyze_ci_failure", "分析 CI 失败日志");

        try {
            Map<String, Object> result = null;

            // 尝试获取激活的大模型配置
            LlmConfig llmConfig = null;
            if (diag.getCreatedBy() != null) {
                try {
                    llmConfig = llmConfigService.getActiveConfig(diag.getCreatedBy());
                } catch (Exception e) {
                    log.warn("获取激活的 LLM 配置失败, 将使用规则引擎进行 CI 诊断 fallback: {}", e.getMessage());
                }
            }

            if (llmConfig != null) {
                log.info("使用大模型进行 CI 诊断: configId={}, model={}", llmConfig.getId(), llmConfig.getModelName());
                try {
                    result = analyzeFailureWithLlm(diag, llmConfig);
                } catch (Exception e) {
                    log.error("大模型 CI 诊断失败, 将使用规则引擎进行 CI 诊断 fallback", e);
                }
            }

            if (result == null) {
                log.info("使用规则引擎进行 CI 诊断");
                result = analyzeFailure(diag.getConclusion(), diag.getRawLogSnippet(), diag.getCommitMessage());
            }

            diag.setErrorCategory((String) result.get("errorCategory"));
            diag.setFailureSummary(sanitizeText((String) result.get("failureSummary")));
            diag.setRootCause(sanitizeText((String) result.get("rootCause")));
            diag.setRelatedFiles(toJson(result.get("relatedFiles")));
            diag.setFixSuggestions(toJson(result.get("fixSuggestions")));
            diag.setDiagnosticJson(toJson(result));
            diag.setStatus("COMPLETED");
            diag.setUpdatedAt(LocalDateTime.now());
            updateById(diag);
            completeExecutionStep(attemptId, "analyze_ci_failure", "CI 诊断完成: " + diag.getErrorCategory());
            markExecutionSuccess(attemptId, "analyze_ci_failure");

            log.info("CI 诊断完成: id={}, category={}", diagnosticId, diag.getErrorCategory());
        } catch (Exception e) {
            log.error("CI 诊断失败: id={}", diagnosticId, e);
            diag.setStatus("FAILED");
            diag.setErrorMessage(sanitizeError(e.getMessage()));
            diag.setUpdatedAt(LocalDateTime.now());
            updateById(diag);
            failExecutionStep(attemptId, "analyze_ci_failure", e.getMessage());
            markExecutionFailed(attemptId, "analyze_ci_failure", e.getMessage());
        }
    }

    private ExecutionTask getOrCreateExecutionTask(CiDiagnostic diag) {
        ExecutionTask executionTask = executionTaskService.findBySource("CI_DIAGNOSTIC", diag.getId());
        if (executionTask != null) {
            return executionTask;
        }
        return executionTaskService.create(diag.getProjectId(), diag.getRepositoryId(), "CI_DIAGNOSTIC",
                "CI_DIAGNOSTIC", diag.getId(), diag.getCreatedBy());
    }

    private void startExecutionStep(Long attemptId, String stepKey, String stepName) {
        if (attemptId != null) {
            executionTaskService.startAttemptStep(attemptId, stepKey, stepName);
        }
    }

    private void completeExecutionStep(Long attemptId, String stepKey, String summary) {
        if (attemptId != null) {
            executionTaskService.completeAttemptStep(attemptId, stepKey, summary);
        }
    }

    private void failExecutionStep(Long attemptId, String stepKey, String errorMessage) {
        if (attemptId != null) {
            executionTaskService.failAttemptStep(attemptId, stepKey, errorMessage);
        }
    }

    private void markExecutionSuccess(Long attemptId, String currentStep) {
        if (attemptId != null) {
            executionTaskService.markAttemptSuccess(attemptId, currentStep);
        }
    }

    private void markExecutionFailed(Long attemptId, String currentStep, String errorMessage) {
        if (attemptId != null) {
            executionTaskService.markAttemptFailed(attemptId, currentStep, errorMessage);
        }
    }

    private boolean claimAnalysis(Long diagnosticId) {
        CiDiagnostic update = new CiDiagnostic();
        update.setStatus("ANALYZING");
        update.setErrorMessage(null);
        update.setUpdatedAt(LocalDateTime.now());
        return update(update, new LambdaQueryWrapper<CiDiagnostic>()
                .eq(CiDiagnostic::getId, diagnosticId)
                .eq(CiDiagnostic::getStatus, "PENDING"));
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> analyzeFailureWithLlm(CiDiagnostic diag, LlmConfig config) {
        String prompt = "You are a senior DevOps engineer and developer. Analyze the following CI workflow run failure log, categorize the error, and provide a clear diagnosis and fix suggestions.\n" +
                PromptInjectionGuard.systemBoundaryInstructions() + "\n" +
                PromptInjectionGuard.wrapUntrustedContent("ci workflow name", diag.getWorkflowName()) +
                PromptInjectionGuard.wrapUntrustedContent("ci conclusion", diag.getConclusion() != null ? diag.getConclusion() : "failure") +
                PromptInjectionGuard.wrapUntrustedContent("ci commit message", diag.getCommitMessage()) +
                PromptInjectionGuard.wrapUntrustedContent("ci log snippet", diag.getRawLogSnippet()) + "\n" +
                "Analyze and output a structured JSON response matching the following schema (do not wrap in extra explanation or markdown block code formatting):\n" +
                "{\n" +
                "  \"errorCategory\": \"COMPILE | TEST | DEPENDENCY | LINT | DOCKER | ENV | UNKNOWN\",\n" +
                "  \"failureSummary\": \"Brief summary of the build failure\",\n" +
                "  \"rootCause\": \"Deep dive into the root cause of the error\",\n" +
                "  \"relatedFiles\": [\"list of files causing or related to the failure\"],\n" +
                "  \"fixSuggestions\": [\"Actionable step-by-step instructions to fix the error\"]\n" +
                "}";

        String response = llmClient.chat(config, prompt);
        return llmJsonExtractor.extractRequiredObject(
                response,
                Set.of("errorCategory", "failureSummary"),
                "CI_DIAGNOSTIC");
    }

    private Map<String, Object> analyzeFailure(String conclusion, String logSnippet, String commitMessage) {
        Map<String, Object> result = new LinkedHashMap<>();

        if ("success".equals(conclusion)) {
            result.put("errorCategory", "UNKNOWN");
            result.put("failureSummary", "工作流执行成功, 无需诊断");
            result.put("rootCause", "无");
            result.put("relatedFiles", Collections.emptyList());
            result.put("fixSuggestions", Collections.emptyList());
            return result;
        }

        String log = logSnippet != null ? logSnippet : "";

        // 解析日志行结构
        List<String> errorLines = extractErrorLines(log);
        List<String> warningLines = extractWarningLines(log);
        List<String> filePaths = extractFilePaths(log);
        List<Integer> errorLineNumbers = extractLineNumbers(log);
        String firstErrorLine = errorLines.isEmpty() ? "" : errorLines.get(0);

        // 基于真实日志内容分类
        String category = classifyFromLog(errorLines, warningLines, log);
        result.put("errorCategory", category);

        // 基于真实错误行生成摘要
        result.put("failureSummary", buildSummaryFromLog(category, errorLines, warningLines, filePaths));

        // 基于真实错误行生成根因
        result.put("rootCause", buildRootCauseFromLog(category, firstErrorLine, filePaths, errorLineNumbers));

        // 基于真实路径提取相关文件
        result.put("relatedFiles", buildRelatedFiles(filePaths, filePaths));

        // 基于真实错误信息生成修复建议
        result.put("fixSuggestions", buildFixSuggestionsFromLog(category, firstErrorLine, filePaths, errorLineNumbers));

        // 附加结构化诊断数据
        result.put("errorLineCount", errorLines.size());
        result.put("warningLineCount", warningLines.size());
        result.put("topErrors", errorLines.stream().limit(5).toList());
        result.put("topWarnings", warningLines.stream().limit(3).toList());

        return result;
    }

    // ===== 日志结构解析 =====

    private List<String> extractErrorLines(String log) {
        List<String> errors = new ArrayList<>();
        for (String line : log.split("\n")) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) continue;
            // 匹配常见错误行模式
            if (trimmed.matches("(?i).*(error|fatal|FAILED|panic|exception|cannot find symbol|unresolved reference).*")
                    && !trimmed.matches("(?i).*error\\d{4}.*warning.*")) {
                // 去重并截断过长行
                String err = trimmed.length() > 200 ? trimmed.substring(0, 200) + "..." : trimmed;
                if (errors.stream().noneMatch(e -> e.contains(err.substring(0, Math.min(50, err.length()))))) {
                    errors.add(err);
                }
            }
        }
        return errors;
    }

    private List<String> extractWarningLines(String log) {
        List<String> warnings = new ArrayList<>();
        for (String line : log.split("\n")) {
            String trimmed = line.trim();
            if (trimmed.matches("(?i).*(warning|deprecated|clippy|lint|checkstyle).*")) {
                String w = trimmed.length() > 200 ? trimmed.substring(0, 200) + "..." : trimmed;
                if (warnings.size() < 10) warnings.add(w);
            }
        }
        return warnings;
    }

    private List<String> extractFilePaths(String log) {
        List<String> paths = new ArrayList<>();
        // 提取 Java 风格路径: at com.xxx.ClassName(File.java:123)
        java.util.regex.Matcher m1 = java.util.regex.Pattern
                .compile("at\\s+[\\w.$]+\\((\\w+\\.java:\\d+)\\)").matcher(log);
        while (m1.find()) {
            paths.add(m1.group(1));
        }
        // 提取 Rust 风格: --> src/main.rs:10:5
        java.util.regex.Matcher m2 = java.util.regex.Pattern
                .compile("-->\\s+([\\w/._]+:\\d+:\\d+)").matcher(log);
        while (m2.find()) {
            paths.add(m2.group(1));
        }
        // 提取文件路径: /path/to/file.ext 或 src/xxx/file.ext
        java.util.regex.Matcher m3 = java.util.regex.Pattern
                .compile("([\\w._-]+/\\w+\\.\\w+(?::\\d+)?)").matcher(log);
        while (m3.find()) {
            String p = m3.group(1);
            if (p.contains("/") && p.matches(".*\\.(java|kt|rs|ts|tsx|js|py|go|sql|yml|yaml|xml|json|toml).*")) {
                paths.add(p);
            }
        }
        return paths.stream().distinct().limit(20).toList();
    }

    private List<Integer> extractLineNumbers(String log) {
        List<Integer> lineNums = new ArrayList<>();
        // Java: (File.java:123)
        java.util.regex.Matcher m1 = java.util.regex.Pattern
                .compile("\\((\\w+\\.java):(\\d+)\\)").matcher(log);
        while (m1.find()) {
            lineNums.add(Integer.parseInt(m1.group(2)));
        }
        // Rust: --> file.rs:123:5
        java.util.regex.Matcher m2 = java.util.regex.Pattern
                .compile("-->\\s+\\w[\\w/._]*:(\\d+):\\d+").matcher(log);
        while (m2.find()) {
            lineNums.add(Integer.parseInt(m2.group(1)));
        }
        // TypeScript/JS: at file.ts:123:5
        java.util.regex.Matcher m3 = java.util.regex.Pattern
                .compile("\\bat\\s+([\\w/._]+\\.(ts|tsx|js)):(\\d+):(\\d+)").matcher(log);
        while (m3.find()) {
            lineNums.add(Integer.parseInt(m3.group(3)));
        }
        return lineNums.stream().distinct().sorted().toList();
    }

    // ===== 基于日志的分类 =====

    private String classifyFromLog(List<String> errorLines, List<String> warningLines, String log) {
        String combined = String.join("\n", errorLines).toLowerCase();

        // 编译错误: 有 error 行 + 包含编译器关键字
        if (!errorLines.isEmpty()) {
            if (combined.matches("(?s).*(cannot find symbol|unresolved reference|syntax error|typeerror|tsc error|compilation error).*")) {
                return "COMPILE";
            }
            if (combined.matches("(?s).*(error\\[E\\d|aborting due to|could not compile).*")) {
                return "COMPILE";
            }
            if (combined.matches("(?s).*(error TS\\d|Module not found|Cannot find module).*")) {
                return "COMPILE";
            }
        }

        // 测试失败
        if (combined.matches("(?s).*(test.*fail|assertion.*fail|expected.*but was|test result.*FAILED|FAILED).*")) {
            return "TEST";
        }

        // 依赖
        if (combined.matches("(?s).*(could not resolve|dependency.*not found|version conflict|no matching version|failed to resolve).*")) {
            return "DEPENDENCY";
        }

        // Lint
        if (!warningLines.isEmpty() && combined.matches("(?s).*(eslint|checkstyle|clippy|prettier|format).*")) {
            return "LINT";
        }

        // Docker
        if (combined.matches("(?s).*(dockerfile|container|image build|COPY failed|RUN failed).*")) {
            return "DOCKER";
        }

        // 环境
        if (combined.matches("(?s).*(not found|undefined|missing|secret|env.*not set|permission denied).*")) {
            return "ENV";
        }

        // 如果有错误行但无法分类
        if (!errorLines.isEmpty()) return "UNKNOWN";

        return "UNKNOWN";
    }

    // ===== 基于日志的摘要/根因/修复建议 =====

    private String buildSummaryFromLog(String category, List<String> errors, List<String> warnings, List<String> paths) {
        StringBuilder sb = new StringBuilder();
        sb.append("日志中共检测到 ").append(errors.size()).append(" 条错误");
        if (!warnings.isEmpty()) sb.append(", ").append(warnings.size()).append(" 条警告");
        if (!paths.isEmpty()) sb.append(", 涉及 ").append(paths.size()).append(" 个文件");
        sb.append("。\n");
        if (!errors.isEmpty()) {
            sb.append("首条错误: ").append(errors.get(0));
        }
        return sb.toString();
    }

    private String buildRootCauseFromLog(String category, String firstError, List<String> paths, List<Integer> lineNums) {
        StringBuilder sb = new StringBuilder();
        if (!firstError.isEmpty()) {
            sb.append("错误信息: ").append(firstError).append("\n");
        }
        if (!paths.isEmpty()) {
            sb.append("涉及文件: ").append(String.join(", ", paths.stream().limit(5).toList())).append("\n");
        }
        if (!lineNums.isEmpty()) {
            sb.append("错误行号: ").append(lineNums.stream().map(String::valueOf).collect(java.util.stream.Collectors.joining(", "))).append("\n");
        }

        // 基于分类和实际错误内容给出根因描述
        switch (category) {
            case "COMPILE" -> sb.append("根因: 编译器报告了上述错误, 需要检查对应文件的语法或类型定义");
            case "TEST" -> sb.append("根因: 测试断言失败, 需要检查实际值与预期值的差异");
            case "DEPENDENCY" -> sb.append("根因: 依赖解析失败, 可能是版本冲突或仓库不可达");
            case "LINT" -> sb.append("根因: 代码风格检查未通过, 需要修复 lint 警告");
            case "DOCKER" -> sb.append("根因: Docker 构建过程失败, 需要检查 Dockerfile");
            case "ENV" -> sb.append("根因: 环境配置缺失或权限不足");
            default -> sb.append("根因: 需结合完整日志进一步分析");
        }
        return sb.toString();
    }

    private List<String> buildRelatedFiles(List<String> logPaths, List<String> allPaths) {
        if (allPaths.isEmpty()) return List.of("日志中未检测到具体文件路径");
        return allPaths.stream().limit(10).toList();
    }

    private List<String> buildFixSuggestionsFromLog(String category, String firstError, List<String> paths, List<Integer> lineNums) {
        List<String> suggestions = new ArrayList<>();

        // 基于实际文件路径给出具体建议
        for (String path : paths.stream().limit(3).toList()) {
            if (path.endsWith(".java")) {
                suggestions.add("检查 " + path + " 的编译错误");
            } else if (path.endsWith(".rs")) {
                suggestions.add("检查 " + path + " 的 Rust 编译错误");
            } else if (path.matches(".*\\.(ts|tsx|js)$")) {
                suggestions.add("检查 " + path + " 的 TypeScript/JS 错误");
            } else if (path.endsWith(".sql")) {
                suggestions.add("检查 SQL 文件 " + path + " 的语法");
            } else if (path.endsWith(".yml") || path.endsWith(".yaml")) {
                suggestions.add("检查配置文件 " + path + " 的格式");
            }
        }

        // 基于行号给出具体定位建议
        if (!lineNums.isEmpty() && !paths.isEmpty()) {
            suggestions.add("重点检查 " + paths.get(0) + " 第 " + lineNums.get(0) + " 行附近");
        }

        // 分类兜底建议
        switch (category) {
            case "COMPILE" -> {
                suggestions.add("运行本地编译确认: mvn clean compile / cargo build / npx tsc");
                suggestions.add("检查缺少的 import 或类型定义");
            }
            case "TEST" -> {
                suggestions.add("在本地运行失败的测试用例, 对比预期值与实际值");
                suggestions.add("检查测试数据是否与代码变更兼容");
            }
            case "DEPENDENCY" -> {
                suggestions.add("清除依赖缓存后重新安装: rm -rf node_modules && npm install");
                suggestions.add("检查 lock 文件和版本声明是否一致");
            }
            case "LINT" -> {
                suggestions.add("运行格式化工具: npx eslint --fix / cargo clippy --fix");
            }
            default -> {
                suggestions.add("查看完整 CI 日志定位问题根因");
                suggestions.add("在本地复现失败场景");
            }
        }
        return suggestions.isEmpty() ? List.of("查看完整日志以确定修复方案") : suggestions;
    }

    // ===== 查询 =====

    public Page<CiDiagnostic> listByProject(Long projectId, int page, int pageSize, String status) {
        LambdaQueryWrapper<CiDiagnostic> wrapper = new LambdaQueryWrapper<CiDiagnostic>()
                .eq(CiDiagnostic::getProjectId, projectId)
                .orderByDesc(CiDiagnostic::getCreatedAt);
        if (status != null && !status.isEmpty()) {
            wrapper.eq(CiDiagnostic::getStatus, status);
        }
        return page(new Page<>(page, pageSize), wrapper);
    }

    public CiDiagnostic getDetail(Long id) {
        CiDiagnostic d = getById(id);
        if (d == null || Boolean.TRUE.equals(d.getDeleted())) {
            throw BizException.notFound("CiDiagnostic");
        }
        return d;
    }

    private String toJson(Object obj) {
        if (obj == null) return null;
        try {
            return sanitizeJson(objectMapper.writeValueAsString(obj));
        } catch (Exception e) {
            return sanitizeJson(String.valueOf(obj));
        }
    }

    private String sanitizeText(String value) {
        return SensitiveDataSanitizer.sanitizeAndTruncate(value, MAX_TEXT_FIELD_LENGTH);
    }

    private String sanitizeJson(String value) {
        return SensitiveDataSanitizer.sanitizeAndTruncate(value, MAX_JSON_FIELD_LENGTH);
    }

    private String sanitizeError(String value) {
        return SensitiveDataSanitizer.sanitizeAndTruncate(value, MAX_ERROR_LENGTH);
    }
}
