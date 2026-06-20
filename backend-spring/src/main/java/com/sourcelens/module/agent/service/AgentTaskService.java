package com.sourcelens.module.agent.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sourcelens.common.exception.BizException;
import com.sourcelens.module.agent.dto.AddStepRequest;
import com.sourcelens.module.agent.dto.CompleteTaskRequest;
import com.sourcelens.module.agent.dto.CreateAgentTaskRequest;
import com.sourcelens.module.agent.dto.UpdateStepRequest;
import com.sourcelens.module.agent.entity.AgentTask;
import com.sourcelens.module.agent.entity.AgentTaskStep;
import com.sourcelens.module.agent.entity.Conversation;
import com.sourcelens.module.agent.entity.LlmConfig;
import com.sourcelens.module.agent.mapper.AgentTaskMapper;
import com.sourcelens.module.agent.mapper.AgentTaskStepMapper;
import com.sourcelens.module.agent.mapper.ConversationMapper;
import com.sourcelens.module.analysis.entity.CodeRelationEntity;
import com.sourcelens.module.analysis.entity.CodeSymbol;
import com.sourcelens.module.analysis.entity.ScanArtifact;
import com.sourcelens.module.analysis.mapper.CodeRelationMapper;
import com.sourcelens.module.analysis.mapper.CodeSymbolMapper;
import com.sourcelens.module.analysis.mapper.ScanArtifactMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class AgentTaskService extends ServiceImpl<AgentTaskMapper, AgentTask> {

    private final AgentTaskStepMapper stepMapper;
    private final ScanArtifactMapper artifactMapper;
    private final CodeSymbolMapper symbolMapper;
    private final CodeRelationMapper relationMapper;
    private final LlmClient llmClient;
    private final LlmConfigService llmConfigService;
    private final ConversationMapper conversationMapper;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final AgentTaskService self;

    public AgentTaskService(AgentTaskStepMapper stepMapper,
                            ScanArtifactMapper artifactMapper,
                            CodeSymbolMapper symbolMapper,
                            CodeRelationMapper relationMapper,
                            LlmClient llmClient,
                            LlmConfigService llmConfigService,
                            ConversationMapper conversationMapper,
                            @Lazy AgentTaskService self) {
        this.stepMapper = stepMapper;
        this.artifactMapper = artifactMapper;
        this.symbolMapper = symbolMapper;
        this.relationMapper = relationMapper;
        this.llmClient = llmClient;
        this.llmConfigService = llmConfigService;
        this.conversationMapper = conversationMapper;
        this.self = self;
    }

    /**
     * 创建 Agent 任务。
     * - 如果未指定 scanTaskId，自动查找该项目最近一次已完成的扫描
     * - 自动创建一个对话，预置任务类型的 system prompt
     */
    @Transactional
    public AgentTask create(CreateAgentTaskRequest req, Long userId) {
        // 自动关联最新扫描
        Long scanTaskId = req.getScanTaskId();
        if (scanTaskId == null) {
            scanTaskId = findLatestScanTaskId(req.getProjectId());
        }

        AgentTask task = AgentTask.builder()
                .projectId(req.getProjectId())
                .scanTaskId(scanTaskId)
                .taskType(req.getTaskType())
                .title(req.getTitle())
                .description(req.getDescription())
                .status("PENDING")
                .priority(req.getPriority() != null ? req.getPriority() : "MEDIUM")
                .inputJson(req.getInputJson())
                .createdBy(userId)
                .build();
        save(task);

        // 自动创建对话，预置任务类型 system prompt
        String systemPrompt = buildTaskSystemPrompt(req.getTaskType(), req.getTitle());
        Conversation conv = Conversation.builder()
                .projectId(req.getProjectId())
                .agentTaskId(task.getId())
                .title(req.getTitle())
                .systemPrompt(systemPrompt)
                .status("ACTIVE")
                .createdBy(userId)
                .build();
        conversationMapper.insert(conv);

        // 关联回任务
        task.setConversationId(conv.getId());
        updateById(task);

        log.info("创建 Agent 任务: id={}, type={}, title={}, conversationId={}", task.getId(), task.getTaskType(), task.getTitle(), conv.getId());
        return task;
    }

    /**
     * 查找项目最近一次已完成的扫描任务 ID
     */
    private Long findLatestScanTaskId(Long projectId) {
        // 通过 scan_artifacts 表反查最近的 scan_task_id
        // scan_artifacts 关联 scan_tasks，取最近完成的
        try {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> results = objectMapper.readValue("[]", List.class);
            // 使用 MyBatis 原生查询
            var mapper = getBaseMapper();
            // 通过 scan_artifacts 关联查找
            List<ScanArtifact> artifacts = artifactMapper.selectList(
                    new LambdaQueryWrapper<ScanArtifact>()
                            .last("ORDER BY id DESC LIMIT 1"));
            if (!artifacts.isEmpty()) {
                return artifacts.get(0).getScanTaskId();
            }
        } catch (Exception e) {
            log.warn("查找最新扫描失败: {}", e.getMessage());
        }
        return null;
    }

    /**
     * 根据任务类型构建 system prompt
     */
    private String buildTaskSystemPrompt(String taskType, String title) {
        String typeName = getTaskTypeName(taskType);
        return switch (taskType) {
            case "ARCHITECTURE_REVIEW" -> """
                    你是 SourceLens 架构审查助手。请对当前项目进行全面的架构审查分析。
                    分析维度包括：分层合理性、模块划分、设计模式、技术债、可维护性。
                    请使用工具读取关键文件和代码结构，然后给出结构化的审查报告。
                    任务标题: %s
                    """.formatted(title);
            case "RISK_SCAN" -> """
                    你是 SourceLens 风险扫描助手。请对当前项目进行全面的风险扫描。
                    重点关注：循环依赖、过度耦合、安全风险、代码质量问题。
                    请使用工具读取代码和依赖关系，然后给出风险评估报告。
                    任务标题: %s
                    """.formatted(title);
            case "CHANGE_IMPACT" -> """
                    你是 SourceLens 变更影响分析助手。请分析指定变更的影响范围。
                    包括：直接影响、间接影响、测试影响、风险评估和执行建议。
                    请使用工具读取相关代码和依赖关系。
                    任务标题: %s
                    """.formatted(title);
            default -> """
                    你是 SourceLens 代码分析助手。请对当前项目进行综合分析。
                    请使用工具读取代码结构、关键文件和依赖关系，给出分析报告。
                    任务标题: %s
                    """.formatted(title);
        };
    }

    @Transactional
    public AgentTask start(Long taskId) {
        AgentTask task = getById(taskId);
        if (task == null) {
            throw BizException.notFound("AgentTask");
        }
        if (!"PENDING".equals(task.getStatus())) {
            throw BizException.badRequest("任务状态不允许启动: " + task.getStatus());
        }
        task.setStatus("RUNNING");
        task.setStartedAt(LocalDateTime.now());
        updateById(task);

        // 异步执行真实分析
        self.executeAnalysis(task.getId());

        return task;
    }

    /**
     * 异步执行分析引擎 — LLM 驱动 + 规则引擎混合
     */
    @Async("scanTaskExecutor")
    public void executeAnalysis(Long taskId) {
        AgentTask task = getById(taskId);
        if (task == null) return;

        try {
            Long scanTaskId = task.getScanTaskId();
            String taskType = task.getTaskType();
            Long userId = task.getCreatedBy();

            // Step 1: 加载扫描产物
            AgentTaskStep step1 = addStepInternal(taskId, "ANALYSIS", "load_scan_artifacts",
                    "加载扫描产物数据");
            long start = System.currentTimeMillis();
            Map<String, Object> scanData = loadScanData(scanTaskId);
            updateStepDone(step1.getId(), Map.of("artifactCount", scanData.size()), System.currentTimeMillis() - start);

            if (scanData.isEmpty()) {
                throw new IllegalStateException("未找到扫描产物, 请先执行代码扫描");
            }

            // Step 2: 尝试获取 LLM 配置
            LlmConfig llmConfig = llmConfigService.getActiveConfig(userId);
            boolean useLlm = llmConfig != null;

            // Step 3: 规则引擎预分析 (无论是否用 LLM, 都先做结构化分析)
            AgentTaskStep step3 = addStepInternal(taskId, "ANALYSIS", "rule_engine_analysis",
                    "规则引擎结构化分析");
            start = System.currentTimeMillis();
            Map<String, Object> ruleResult = switch (taskType) {
                case "ARCHITECTURE_REVIEW" -> analyzeArchitecture(scanData);
                case "RISK_SCAN" -> analyzeRisks(scanData);
                case "CHANGE_IMPACT" -> analyzeChangeImpact(scanData, task.getInputJson());
                default -> analyzeCustom(scanData, task.getInputJson());
            };
            updateStepDone(step3.getId(), ruleResult, System.currentTimeMillis() - start);

            // Step 4: LLM 深度分析 (如果已配置模型)
            String llmAnalysis = null;
            if (useLlm) {
                AgentTaskStep step4 = addStepInternal(taskId, "ANALYSIS", "llm_deep_analysis",
                        "LLM 深度分析 (" + llmConfig.getModelName() + ")");
                start = System.currentTimeMillis();
                try {
                    String prompt = buildAnalysisPrompt(taskType, scanData, ruleResult, task.getInputJson());
                    llmAnalysis = llmClient.chat(llmConfig, prompt);
                    updateStepDone(step4.getId(), Map.of("model", llmConfig.getModelName(),
                            "responseLength", llmAnalysis.length()), System.currentTimeMillis() - start);
                } catch (Exception e) {
                    log.warn("LLM 分析失败, 回退到规则引擎: {}", e.getMessage());
                    updateStepFailed(step4.getId(), "LLM 调用失败: " + e.getMessage(), System.currentTimeMillis() - start);
                }
            }

            // Step 5: 生成最终报告
            AgentTaskStep step5 = addStepInternal(taskId, "OUTPUT", "generate_report",
                    "生成审查报告");
            start = System.currentTimeMillis();
            Map<String, Object> report = generateReport(taskType, ruleResult, scanData);
            if (llmAnalysis != null) {
                report.put("llmAnalysis", llmAnalysis);
                report.put("analysisMode", "LLM + Rule Engine");
            } else {
                report.put("analysisMode", useLlm ? "Rule Engine (LLM 调用失败)" : "Rule Engine (未配置 LLM)");
            }
            updateStepDone(step5.getId(), report, System.currentTimeMillis() - start);

            // 完成任务
            task.setStatus("COMPLETED");
            task.setFinishedAt(LocalDateTime.now());
            task.setOutputJson(toJson(report));
            task.setSummary(generateSummary(taskType, report));
            updateById(task);

            log.info("Agent 任务完成: id={}, type={}, mode={}", taskId, taskType, report.get("analysisMode"));
        } catch (Exception e) {
            log.error("Agent 任务执行失败: id={}", taskId, e);
            task.setStatus("FAILED");
            task.setFinishedAt(LocalDateTime.now());
            task.setErrorMessage(e.getMessage());
            updateById(task);
        }
    }

    /**
     * 根据任务类型 + 扫描数据 + 规则分析结果, 构建 LLM prompt
     */
    private String buildAnalysisPrompt(String taskType, Map<String, Object> scanData,
                                        Map<String, Object> ruleResult, String userInput) {
        Map<String, Object> report = getArtifactData(scanData, "ARCHITECTURE_REPORT");
        List<CodeSymbol> symbols = getSymbols(scanData);
        List<CodeRelationEntity> relations = getRelations(scanData);

        // 项目概览
        Object overview = report.get("overview");
        Object techStack = report.get("techStack");
        Object modules = report.get("modules");

        StringBuilder ctx = new StringBuilder();
        ctx.append("你是一个专业的代码架构分析师。以下是项目的扫描数据和规则引擎预分析结果,请进行深度分析。\n\n");

        // 项目信息
        ctx.append("## 项目概览\n");
        ctx.append(toJson(overview)).append("\n\n");
        ctx.append("## 技术栈\n");
        ctx.append(toJson(techStack)).append("\n\n");
        ctx.append("## 模块分布\n");
        ctx.append(toJson(modules)).append("\n\n");

        // 符号摘要 (限制数量避免 token 溢出)
        ctx.append("## 代码符号 (前 50 个)\n");
        ctx.append("```json\n");
        List<Map<String, Object>> symbolSummary = symbols.stream().limit(50).map(s -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("name", s.getName());
            m.put("kind", s.getKind());
            m.put("filePath", s.getFilePath());
            return m;
        }).collect(Collectors.toList());
        ctx.append(toJson(symbolSummary)).append("\n```\n\n");

        // 依赖关系摘要
        ctx.append("## 依赖关系 (共 ").append(relations.size()).append(" 条, 前 30 条)\n");
        ctx.append("```json\n");
        List<Map<String, String>> relSummary = relations.stream().limit(30).map(r -> {
            Map<String, String> m = new LinkedHashMap<>();
            m.put("source", r.getSourceId());
            m.put("target", r.getTargetId());
            m.put("type", r.getRelationType());
            return m;
        }).collect(Collectors.toList());
        ctx.append(toJson(relSummary)).append("\n```\n\n");

        // 规则引擎预分析结果
        ctx.append("## 规则引擎预分析结果\n");
        ctx.append("```json\n");
        ctx.append(toJson(ruleResult)).append("\n```\n\n");

        // 按任务类型给出分析指令
        return switch (taskType) {
            case "ARCHITECTURE_REVIEW" -> ctx + """
                    ## 分析任务: 架构审查

                    请基于以上数据,从以下维度进行深度分析:
                    1. **架构合理性评估**: 分层是否清晰,模块划分是否合理
                    2. **设计模式识别**: 项目中使用了哪些设计模式,是否有反模式
                    3. **技术债识别**: 代码中潜在的技术债务和改进点
                    4. **可维护性评分**: 从 1-10 分评估项目的可维护性
                    5. **重构建议**: 具体的、可执行的重构方案

                    请用 JSON 格式输出分析结果,包含以下字段:
                    {"overallScore": 评分, "strengths": ["优点"], "weaknesses": ["不足"], "recommendations": [{"title": "标题", "description": "描述", "priority": "HIGH/MEDIUM/LOW", "effort": "预估工作量"}], "summary": "总体评价"}
                    """;
            case "RISK_SCAN" -> ctx + """
                    ## 分析任务: 风险扫描

                    请基于以上数据,识别项目中的潜在风险:
                    1. **架构风险**: 循环依赖、过度耦合、单点故障
                    2. **代码质量风险**: 复杂度过高的类/方法
                    3. **安全风险**: 潜在的安全漏洞点
                    4. **维护风险**: 知识集中度、bus factor

                    请用 JSON 格式输出,包含:
                    {"risks": [{"riskType": "类型", "severity": "HIGH/MEDIUM/LOW", "description": "描述", "impact": "影响", "mitigation": "缓解方案"}], "overallRiskLevel": "HIGH/MEDIUM/LOW", "topPriorities": ["最需优先处理的项"]}
                    """;
            case "CHANGE_IMPACT" -> ctx + """
                    ## 分析任务: 变更影响分析

                    用户输入的变更信息: """ + (userInput != null ? userInput : "无") + """

                    请分析这些变更的影响范围:
                    1. **直接影响**: 直接受影响的模块和类
                    2. **间接影响**: 通过依赖传播受影响的模块
                    3. **测试影响**: 需要修改/新增的测试
                    4. **风险评估**: 变更引入的风险
                    5. **建议**: 变更执行的最佳实践

                    请用 JSON 格式输出,包含:
                    {"impactAnalysis": {"directModules": [], "indirectModules": [], "riskLevel": "HIGH/MEDIUM/LOW"}, "testSuggestions": [], "executionPlan": [], "rollbackStrategy": "回滚方案"}
                    """;
            default -> ctx + """
                    ## 分析任务: 综合代码分析

                    请对项目进行全面的代码分析,包括:
                    1. 项目整体质量评估
                    2. 架构设计分析
                    3. 代码规范评估
                    4. 性能优化建议
                    5. 总体改进建议

                    请用 JSON 格式输出分析结果,包含:
                    {"qualityScore": 评分, "findings": [{"type": "类型", "severity": "级别", "description": "描述"}], "summary": "总体评价"}
                    """;
        };
    }

    private void updateStepFailed(Long stepId, String errorMessage, long durationMs) {
        AgentTaskStep step = stepMapper.selectById(stepId);
        if (step == null) return;
        step.setStatus("FAILED");
        step.setErrorMessage(errorMessage);
        step.setDurationMs(durationMs);
        stepMapper.updateById(step);
    }

    // ===== 架构审查 =====

    private Map<String, Object> analyzeArchitecture(Map<String, Object> scanData) {
        Map<String, Object> result = new LinkedHashMap<>();

        // 解析架构报告
        Map<String, Object> report = getArtifactData(scanData, "ARCHITECTURE_REPORT");
        Map<String, Object> metrics = getArtifactData(scanData, "CODE_METRICS");

        // 1. 项目规模评估
        result.put("projectScale", assessProjectScale(metrics));

        // 2. 分层合规性检查
        result.put("layerCompliance", checkLayerCompliance(report));

        // 3. 依赖健康度
        result.put("dependencyHealth", assessDependencyHealth(scanData));

        // 4. 代码质量评分
        result.put("codeQualityScore", scoreCodeQuality(report));

        // 5. 发现列表
        List<Map<String, Object>> findings = collectArchitectureFindings(report, scanData);
        result.put("findings", findings);
        result.put("totalFindings", findings.size());

        return result;
    }

    private Map<String, Object> assessProjectScale(Map<String, Object> metrics) {
        Map<String, Object> scale = new LinkedHashMap<>();
        long totalFiles = getLong(metrics, "totalFiles");
        long totalLines = getLong(metrics, "totalLines");
        long totalClasses = getLong(metrics, "totalClasses");

        String level;
        if (totalLines > 50000) level = "LARGE";
        else if (totalLines > 10000) level = "MEDIUM";
        else level = "SMALL";

        scale.put("level", level);
        scale.put("totalFiles", totalFiles);
        scale.put("totalLines", totalLines);
        scale.put("totalClasses", totalClasses);
        scale.put("avgLinesPerFile", totalFiles > 0 ? totalLines / totalFiles : 0);
        return scale;
    }

    private Map<String, Object> checkLayerCompliance(Map<String, Object> report) {
        Map<String, Object> compliance = new LinkedHashMap<>();
        List<Map<String, Object>> issues = new ArrayList<>();

        Object modulesObj = report.get("modules");
        if (modulesObj instanceof Map<?, ?> modules) {
            long controllers = getLong(modules, "controllers");
            long services = getLong(modules, "services");
            long repositories = getLong(modules, "repositories");
            long entities = getLong(modules, "entities");

            // Controller/Service 比例检查
            if (services == 0 && controllers > 0) {
                issues.add(Map.of("severity", "HIGH", "category", "分层缺失",
                        "message", "检测到 Controller 但无 Service 层, 违反分层架构原则"));
            }
            if (controllers > services * 3 && services > 0) {
                issues.add(Map.of("severity", "MEDIUM", "category", "比例失衡",
                        "message", String.format("Controller(%d) 远多于 Service(%d), 可能存在逻辑泄露", controllers, services)));
            }
            if (entities > 0 && repositories == 0) {
                issues.add(Map.of("severity", "LOW", "category", "数据层缺失",
                        "message", "有实体类但无 Repository/Mapper, 数据访问层可能不完整"));
            }

            compliance.put("controllers", controllers);
            compliance.put("services", services);
            compliance.put("repositories", repositories);
            compliance.put("entities", entities);
        }

        compliance.put("issues", issues);
        compliance.put("score", Math.max(0, 100 - issues.size() * 20));
        return compliance;
    }

    private Map<String, Object> assessDependencyHealth(Map<String, Object> scanData) {
        Map<String, Object> health = new LinkedHashMap<>();
        List<CodeSymbol> symbols = getSymbols(scanData);
        List<CodeRelationEntity> relations = getRelations(scanData);

        long totalSymbols = symbols.size();
        long totalRelations = relations.size();

        // 循环依赖检测
        Set<String> extendsRelations = relations.stream()
                .filter(r -> "EXTENDS".equals(r.getRelationType()) || "IMPLEMENTS".equals(r.getRelationType()))
                .map(CodeRelationEntity::getSourceId)
                .collect(Collectors.toSet());

        // 高扇入/扇出检测
        Map<String, Long> fanOut = relations.stream()
                .collect(Collectors.groupingBy(CodeRelationEntity::getSourceId, Collectors.counting()));
        Map<String, Long> fanIn = relations.stream()
                .collect(Collectors.groupingBy(CodeRelationEntity::getTargetId, Collectors.counting()));

        long highFanOut = fanOut.values().stream().filter(v -> v > 5).count();
        long highFanIn = fanIn.values().stream().filter(v -> v > 10).count();

        health.put("totalSymbols", totalSymbols);
        health.put("totalRelations", totalRelations);
        health.put("extendsCount", extendsRelations.size());
        health.put("highFanOutClasses", highFanOut);
        health.put("highFanInClasses", highFanIn);
        health.put("avgFanOut", totalSymbols > 0 ? (double) totalRelations / totalSymbols : 0);

        List<Map<String, String>> issues = new ArrayList<>();
        if (highFanOut > 0) {
            issues.add(Map.of("severity", "MEDIUM", "message",
                    String.format("%d 个类扇出过高(>5), 可能职责过重", highFanOut)));
        }
        if (highFanIn > 0) {
            issues.add(Map.of("severity", "LOW", "message",
                    String.format("%d 个类扇入过高(>10), 可能是核心组件或潜在单点", highFanIn)));
        }
        health.put("issues", issues);
        return health;
    }

    private Map<String, Object> scoreCodeQuality(Map<String, Object> report) {
        Map<String, Object> score = new LinkedHashMap<>();
        int totalScore = 100;

        Object codeQualityObj = report.get("codeQuality");
        if (codeQualityObj instanceof Map<?, ?> cq) {
            long risks = cq.get("risks") instanceof List<?> r ? r.size() : 0;
            totalScore -= (int) (risks * 5);

            double avgMethods = 0;
            Object avgObj = cq.get("avgMethodsPerClass");
            if (avgObj instanceof Number n) avgMethods = n.doubleValue();
            if (avgMethods > 15) totalScore -= 10;
            if (avgMethods > 25) totalScore -= 15;

            score.put("risksFound", risks);
            score.put("avgMethodsPerClass", avgMethods);
        }

        Object debts = report.get("technicalDebt");
        if (debts instanceof List<?> d) {
            totalScore -= d.size() * 5;
            score.put("techDebtCount", d.size());
        }

        score.put("totalScore", Math.max(0, Math.min(100, totalScore)));
        score.put("grade", totalScore >= 80 ? "A" : totalScore >= 60 ? "B" : totalScore >= 40 ? "C" : "D");
        return score;
    }

    private List<Map<String, Object>> collectArchitectureFindings(Map<String, Object> report, Map<String, Object> scanData) {
        List<Map<String, Object>> findings = new ArrayList<>();

        // 从架构报告中提取风险项
        Object cqObj = report.get("codeQuality");
        if (cqObj instanceof Map<?, ?> cq && cq.get("risks") instanceof List<?> risks) {
            for (Object r : risks) {
                if (r instanceof Map<?, ?> risk) {
                    findings.add(Map.of(
                            "type", "RISK",
                            "severity", strOr(risk, "severity", "LOW"),
                            "category", strOr(risk, "category", "未知"),
                            "message", strOr(risk, "message", "")
                    ));
                }
            }
        }

        // 从技术债中提取
        Object debtObj = report.get("technicalDebt");
        if (debtObj instanceof List<?> debts) {
            for (Object d : debts) {
                if (d instanceof Map<?, ?> debt) {
                    findings.add(Map.of(
                            "type", "TECH_DEBT",
                            "severity", strOr(debt, "severity", "LOW"),
                            "category", strOr(debt, "category", "技术债"),
                            "message", strOr(debt, "detail", "")
                    ));
                }
            }
        }

        // 从改进建议中提取
        Object sugObj = report.get("suggestions");
        if (sugObj instanceof List<?> suggestions) {
            for (Object s : suggestions) {
                findings.add(Map.of(
                        "type", "SUGGESTION",
                        "severity", "INFO",
                        "category", "改进建议",
                        "message", String.valueOf(s)
                ));
            }
        }

        return findings;
    }

    // ===== 风险扫描 =====

    private Map<String, Object> analyzeRisks(Map<String, Object> scanData) {
        Map<String, Object> result = new LinkedHashMap<>();
        List<Map<String, Object>> risks = new ArrayList<>();

        // 从架构报告获取已知风险
        Map<String, Object> report = getArtifactData(scanData, "ARCHITECTURE_REPORT");
        Object cqObj = report.get("codeQuality");
        if (cqObj instanceof Map<?, ?> cq && cq.get("risks") instanceof List<?> risksList) {
            for (Object r : risksList) {
                if (r instanceof Map<?, ?> risk) {
                    risks.add(Map.of(
                            "riskType", "CODE_QUALITY",
                            "severity", strOr(risk, "severity", "LOW"),
                            "category", strOr(risk, "category", ""),
                            "message", strOr(risk, "message", ""),
                            "remediation", "参考代码质量最佳实践进行修复"
                    ));
                }
            }
        }

        // 依赖图风险分析
        List<CodeRelationEntity> relations = getRelations(scanData);
        List<CodeSymbol> symbols = getSymbols(scanData);

        // 检测循环依赖
        Map<String, Set<String>> adjList = new HashMap<>();
        for (CodeRelationEntity rel : relations) {
            if ("DEPENDS_ON".equals(rel.getRelationType())) {
                adjList.computeIfAbsent(rel.getSourceId(), k -> new HashSet<>()).add(rel.getTargetId());
            }
        }
        // 简单环检测
        Set<String> visited = new HashSet<>();
        Set<String> inStack = new HashSet<>();
        List<List<String>> cycles = new ArrayList<>();
        for (String node : adjList.keySet()) {
            detectCycles(node, adjList, visited, inStack, new ArrayList<>(), cycles);
        }
        if (!cycles.isEmpty()) {
            risks.add(Map.of(
                    "riskType", "CYCLIC_DEPENDENCY",
                    "severity", "HIGH",
                    "category", "循环依赖",
                    "message", String.format("检测到 %d 组循环依赖", cycles.size()),
                    "remediation", "引入接口层解耦, 或使用依赖注入打破循环"
            ));
        }

        // 孤立类检测
        Set<String> allIds = symbols.stream().map(CodeSymbol::getSymbolId).collect(Collectors.toSet());
        Set<String> relatedIds = new HashSet<>();
        for (CodeRelationEntity rel : relations) {
            relatedIds.add(rel.getSourceId());
            relatedIds.add(rel.getTargetId());
        }
        long orphanCount = allIds.stream().filter(id -> !relatedIds.contains(id)).count();
        if (orphanCount > 0) {
            risks.add(Map.of(
                    "riskType", "ORPHAN_CODE",
                    "severity", "MEDIUM",
                    "category", "孤立代码",
                    "message", String.format("发现 %d 个孤立符号(无任何依赖关系)", orphanCount),
                    "remediation", "检查是否为死代码, 考虑移除或建立依赖关系"
            ));
        }

        result.put("risks", risks);
        result.put("totalRisks", risks.size());
        result.put("highRiskCount", risks.stream().filter(r -> "HIGH".equals(r.get("severity"))).count());
        result.put("cycleCount", cycles.size());
        result.put("orphanCount", orphanCount);
        return result;
    }

    private void detectCycles(String node, Map<String, Set<String>> adj,
                              Set<String> visited, Set<String> inStack,
                              List<String> path, List<List<String>> cycles) {
        if (inStack.contains(node)) {
            int idx = path.indexOf(node);
            if (idx >= 0) {
                cycles.add(new ArrayList<>(path.subList(idx, path.size())));
            }
            return;
        }
        if (visited.contains(node)) return;

        visited.add(node);
        inStack.add(node);
        path.add(node);

        Set<String> neighbors = adj.getOrDefault(node, Collections.emptySet());
        for (String next : neighbors) {
            detectCycles(next, adj, visited, inStack, path, cycles);
        }

        path.remove(path.size() - 1);
        inStack.remove(node);
    }

    // ===== 变更影响分析 =====

    private Map<String, Object> analyzeChangeImpact(Map<String, Object> scanData, String inputJson) {
        Map<String, Object> result = new LinkedHashMap<>();

        // 解析输入: 用户指定的变更文件/模块
        Set<String> changedFiles = new HashSet<>();
        Set<String> changedModules = new HashSet<>();
        if (inputJson != null && !inputJson.isBlank()) {
            try {
                JsonNode input = objectMapper.readTree(inputJson);
                if (input.has("files")) {
                    input.get("files").forEach(f -> changedFiles.add(f.asText()));
                }
                if (input.has("modules")) {
                    input.get("modules").forEach(m -> changedModules.add(m.asText()));
                }
            } catch (Exception ignored) {}
        }

        List<CodeSymbol> symbols = getSymbols(scanData);
        List<CodeRelationEntity> relations = getRelations(scanData);

        // 查找受影响的符号
        Set<String> affectedIds = new HashSet<>();
        for (CodeSymbol sym : symbols) {
            boolean match = changedFiles.stream().anyMatch(f -> sym.getFilePath().contains(f));
            if (match) {
                affectedIds.add(sym.getSymbolId());
            }
        }

        // 传播影响: 依赖了受影响符号的其他符号也会受影响
        Set<String> propagated = new HashSet<>(affectedIds);
        boolean changed = true;
        while (changed) {
            changed = false;
            for (CodeRelationEntity rel : relations) {
                if (propagated.contains(rel.getTargetId()) && !propagated.contains(rel.getSourceId())) {
                    propagated.add(rel.getSourceId());
                    changed = true;
                }
            }
        }

        // 构建影响图
        List<Map<String, Object>> impactNodes = new ArrayList<>();
        for (String id : propagated) {
            CodeSymbol sym = symbols.stream().filter(s -> s.getSymbolId().equals(id)).findFirst().orElse(null);
            boolean direct = affectedIds.contains(id);
            Map<String, Object> node = new LinkedHashMap<>();
            node.put("symbolId", id);
            node.put("name", sym != null ? sym.getName() : id);
            node.put("kind", sym != null ? sym.getKind() : "UNKNOWN");
            node.put("filePath", sym != null ? sym.getFilePath() : "");
            node.put("impactType", direct ? "DIRECT" : "PROPAGATED");
            impactNodes.add(node);
        }

        result.put("changedFiles", changedFiles);
        result.put("changedModules", changedModules);
        result.put("directImpactCount", affectedIds.size());
        result.put("totalImpactCount", propagated.size());
        result.put("impactNodes", impactNodes);
        result.put("riskLevel", propagated.size() > 20 ? "HIGH" : propagated.size() > 5 ? "MEDIUM" : "LOW");
        return result;
    }

    // ===== 自定义分析 =====

    private Map<String, Object> analyzeCustom(Map<String, Object> scanData, String inputJson) {
        Map<String, Object> result = new LinkedHashMap<>();
        Map<String, Object> report = getArtifactData(scanData, "ARCHITECTURE_REPORT");

        result.put("scanSummary", report.get("overview"));
        result.put("techStack", report.get("techStack"));
        result.put("modules", report.get("modules"));

        List<CodeSymbol> symbols = getSymbols(scanData);
        result.put("totalSymbols", symbols.size());
        result.put("symbolKinds", symbols.stream()
                .collect(Collectors.groupingBy(CodeSymbol::getKind, Collectors.counting())));

        return result;
    }

    // ===== 报告生成 =====

    private Map<String, Object> generateReport(String taskType, Map<String, Object> analysisResult, Map<String, Object> scanData) {
        Map<String, Object> report = new LinkedHashMap<>();
        report.put("taskType", taskType);
        report.put("analysisResult", analysisResult);

        Map<String, Object> overview = getArtifactData(scanData, "ARCHITECTURE_OVERVIEW");
        report.put("projectOverview", overview);

        // 生成建议
        List<String> recommendations = generateRecommendations(taskType, analysisResult);
        report.put("recommendations", recommendations);
        report.put("recommendationCount", recommendations.size());

        return report;
    }

    private List<String> generateRecommendations(String taskType, Map<String, Object> result) {
        List<String> recs = new ArrayList<>();

        if ("ARCHITECTURE_REVIEW".equals(taskType)) {
            Object scoreObj = result.get("codeQualityScore");
            if (scoreObj instanceof Map<?, ?> score) {
                Object grade = score.get("grade");
                if ("C".equals(grade) || "D".equals(grade)) {
                    recs.add("代码质量评分较低, 建议优先修复高严重度风险项");
                }
            }
            Object compliance = result.get("layerCompliance");
            if (compliance instanceof Map<?, ?> c && c.get("issues") instanceof List<?> issues) {
                if (!issues.isEmpty()) {
                    recs.add("分层架构存在合规问题, 建议按 Controller→Service→Mapper 重构");
                }
            }
        }

        if ("RISK_SCAN".equals(taskType)) {
            long highRisks = getLong(result, "highRiskCount");
            long cycles = getLong(result, "cycleCount");
            if (highRisks > 0) recs.add("存在高严重度风险项, 建议立即处理");
            if (cycles > 0) recs.add("检测到循环依赖, 建议引入接口层解耦");
        }

        if ("CHANGE_IMPACT".equals(taskType)) {
            long totalImpact = getLong(result, "totalImpactCount");
            if (totalImpact > 20) recs.add("变更影响范围较大, 建议拆分为多个小 PR");
            if (totalImpact > 5) recs.add("建议补充受影响模块的单元测试");
        }

        if (recs.isEmpty()) {
            recs.add("项目整体状况良好, 建议持续保持代码规范");
        }
        return recs;
    }

    private String generateSummary(String taskType, Map<String, Object> report) {
        String typeName = getTaskTypeName(taskType);
        Object analysisObj = report.get("analysisResult");
        if (!(analysisObj instanceof Map<?, ?> analysis)) {
            return typeName + "分析完成";
        }

        return switch (taskType) {
            case "ARCHITECTURE_REVIEW" -> {
                Object scoreObj = analysis.get("codeQualityScore");
                String grade = scoreObj instanceof Map<?, ?> s ? String.valueOf(s.get("grade")) : "-";
                long findings = getLong(analysis, "totalFindings");
                yield String.format("%s完成: 质量等级 %s, 发现 %d 项问题", typeName, grade, findings);
            }
            case "RISK_SCAN" -> {
                long total = getLong(analysis, "totalRisks");
                long high = getLong(analysis, "highRiskCount");
                yield String.format("%s完成: 发现 %d 项风险(高危 %d)", typeName, total, high);
            }
            case "CHANGE_IMPACT" -> {
                long direct = getLong(analysis, "directImpactCount");
                long total = getLong(analysis, "totalImpactCount");
                yield String.format("%s完成: 直接影响 %d 个符号, 传播影响 %d 个", typeName, direct, total);
            }
            default -> typeName + "分析完成";
        };
    }

    // ===== 工具方法 =====

    private Map<String, Object> loadScanData(Long scanTaskId) {
        Map<String, Object> data = new LinkedHashMap<>();
        if (scanTaskId == null) return data;

        // 加载产物
        List<ScanArtifact> artifacts = artifactMapper.selectList(
                new LambdaQueryWrapper<ScanArtifact>()
                        .eq(ScanArtifact::getScanTaskId, scanTaskId));
        for (ScanArtifact artifact : artifacts) {
            if (artifact.getSummaryJson() != null) {
                try {
                    data.put(artifact.getArtifactType(), objectMapper.readValue(artifact.getSummaryJson(), Map.class));
                } catch (Exception e) {
                    log.warn("解析产物失败: type={}, error={}", artifact.getArtifactType(), e.getMessage());
                }
            }
        }

        // 加载符号和关系
        List<CodeSymbol> symbols = symbolMapper.selectList(
                new LambdaQueryWrapper<CodeSymbol>()
                        .eq(CodeSymbol::getScanTaskId, scanTaskId));
        List<CodeRelationEntity> relations = relationMapper.selectList(
                new LambdaQueryWrapper<CodeRelationEntity>()
                        .eq(CodeRelationEntity::getScanTaskId, scanTaskId));
        data.put("_symbols", symbols);
        data.put("_relations", relations);

        return data;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> getArtifactData(Map<String, Object> scanData, String type) {
        Object obj = scanData.get(type);
        return obj instanceof Map<?, ?> m ? (Map<String, Object>) m : new LinkedHashMap<>();
    }

    @SuppressWarnings("unchecked")
    private List<CodeSymbol> getSymbols(Map<String, Object> scanData) {
        Object obj = scanData.get("_symbols");
        return obj instanceof List<?> l ? (List<CodeSymbol>) l : Collections.emptyList();
    }

    @SuppressWarnings("unchecked")
    private List<CodeRelationEntity> getRelations(Map<String, Object> scanData) {
        Object obj = scanData.get("_relations");
        return obj instanceof List<?> l ? (List<CodeRelationEntity>) l : Collections.emptyList();
    }

    private AgentTaskStep addStepInternal(Long taskId, String stepType, String toolName, String description) {
        Long count = stepMapper.selectCount(
                new LambdaQueryWrapper<AgentTaskStep>()
                        .eq(AgentTaskStep::getTaskId, taskId));
        AgentTaskStep step = AgentTaskStep.builder()
                .taskId(taskId)
                .stepOrder(count.intValue() + 1)
                .stepType(stepType)
                .toolName(toolName)
                .description(description)
                .status("RUNNING")
                .build();
        stepMapper.insert(step);
        return step;
    }

    private void updateStepDone(Long stepId, Object output, long durationMs) {
        AgentTaskStep step = stepMapper.selectById(stepId);
        if (step == null) return;
        step.setStatus("COMPLETED");
        step.setOutputJson(toJson(output));
        step.setDurationMs(durationMs);
        stepMapper.updateById(step);
    }

    private String getTaskTypeName(String taskType) {
        return switch (taskType) {
            case "ARCHITECTURE_REVIEW" -> "架构审查";
            case "RISK_SCAN" -> "风险扫描";
            case "CHANGE_IMPACT" -> "变更影响分析";
            default -> "自定义分析";
        };
    }

    private long getLong(Map<?, ?> map, String key) {
        Object val = map.get(key);
        if (val instanceof Number n) return n.longValue();
        return 0;
    }

    private String strOr(Map<?, ?> map, String key, String defaultVal) {
        Object val = map.get(key);
        return val != null ? String.valueOf(val) : defaultVal;
    }

    private String toJson(Object obj) {
        if (obj == null) return null;
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return String.valueOf(obj);
        }
    }

    // ===== CRUD 查询 =====

    @Transactional
    public AgentTask complete(Long taskId, CompleteTaskRequest req) {
        AgentTask task = getById(taskId);
        if (task == null) {
            throw BizException.notFound("AgentTask");
        }
        task.setStatus(req.getStatus() != null ? req.getStatus() : "COMPLETED");
        task.setFinishedAt(LocalDateTime.now());
        task.setOutputJson(req.getOutputJson());
        task.setSummary(req.getSummary());
        updateById(task);
        log.info("完成 Agent 任务: id={}, status={}", taskId, task.getStatus());
        return task;
    }

    public AgentTask cancel(Long taskId) {
        AgentTask task = getById(taskId);
        if (task == null) {
            throw BizException.notFound("AgentTask");
        }
        if ("COMPLETED".equals(task.getStatus()) || "FAILED".equals(task.getStatus())) {
            throw BizException.badRequest("已完成的任务无法取消");
        }
        task.setStatus("CANCELLED");
        task.setFinishedAt(LocalDateTime.now());
        updateById(task);
        return task;
    }

    public Page<AgentTask> listByProject(Long projectId, int page, int pageSize, String status) {
        LambdaQueryWrapper<AgentTask> wrapper = new LambdaQueryWrapper<AgentTask>()
                .eq(AgentTask::getProjectId, projectId)
                .orderByDesc(AgentTask::getCreatedAt);
        if (status != null && !status.isEmpty()) {
            wrapper.eq(AgentTask::getStatus, status);
        }
        return page(new Page<>(page, pageSize), wrapper);
    }

    public AgentTask getDetail(Long taskId) {
        AgentTask task = getById(taskId);
        if (task == null || Boolean.TRUE.equals(task.getDeleted())) {
            throw BizException.notFound("AgentTask");
        }
        return task;
    }

    // ===== 步骤管理 =====

    public AgentTaskStep addStep(Long taskId, AddStepRequest req) {
        getDetail(taskId);
        Long count = stepMapper.selectCount(
                new LambdaQueryWrapper<AgentTaskStep>()
                        .eq(AgentTaskStep::getTaskId, taskId));
        AgentTaskStep step = AgentTaskStep.builder()
                .taskId(taskId)
                .stepOrder(count.intValue() + 1)
                .stepType(req.getStepType())
                .toolName(req.getToolName())
                .description(req.getDescription())
                .inputJson(req.getInputJson())
                .status("PENDING")
                .build();
        stepMapper.insert(step);
        return step;
    }

    public AgentTaskStep updateStep(Long stepId, UpdateStepRequest req) {
        AgentTaskStep step = stepMapper.selectById(stepId);
        if (step == null) {
            throw BizException.notFound("AgentTaskStep");
        }
        if (req.getOutputJson() != null) step.setOutputJson(req.getOutputJson());
        if (req.getStatus() != null) step.setStatus(req.getStatus());
        if (req.getErrorMessage() != null) step.setErrorMessage(req.getErrorMessage());
        if (req.getDurationMs() != null) step.setDurationMs(req.getDurationMs());
        stepMapper.updateById(step);
        return step;
    }

    public List<AgentTaskStep> listSteps(Long taskId) {
        return stepMapper.selectList(
                new LambdaQueryWrapper<AgentTaskStep>()
                        .eq(AgentTaskStep::getTaskId, taskId)
                        .orderByAsc(AgentTaskStep::getStepOrder));
    }
}