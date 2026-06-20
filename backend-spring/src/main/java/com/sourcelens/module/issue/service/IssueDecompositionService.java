package com.sourcelens.module.issue.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sourcelens.common.exception.BizException;
import com.sourcelens.module.issue.dto.DecomposeIssueRequest;
import com.sourcelens.module.issue.entity.IssueDecomposition;
import com.sourcelens.module.issue.entity.IssueTask;
import com.sourcelens.module.issue.mapper.IssueDecompositionMapper;
import com.sourcelens.module.issue.mapper.IssueTaskMapper;
import com.sourcelens.module.analysis.service.GraphService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class IssueDecompositionService extends ServiceImpl<IssueDecompositionMapper, IssueDecomposition> {

    private final IssueTaskMapper taskMapper;
    private final GraphService graphService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public IssueDecompositionService(IssueTaskMapper taskMapper, GraphService graphService) {
        this.taskMapper = taskMapper;
        this.graphService = graphService;
    }

    @Transactional
    public IssueDecomposition create(DecomposeIssueRequest req, Long userId) {
        IssueDecomposition decomposition = IssueDecomposition.builder()
                .projectId(req.getProjectId())
                .scanTaskId(req.getScanTaskId())
                .title(req.getTitle())
                .description(req.getDescription())
                .businessContext(req.getBusinessContext())
                .priority(req.getPriority() != null ? req.getPriority() : "MEDIUM")
                .relatedModules(req.getRelatedModules())
                .status("PENDING")
                .createdBy(userId)
                .build();
        save(decomposition);
        log.info("创建需求拆解: id={}, title={}", decomposition.getId(), decomposition.getTitle());
        return decomposition;
    }

    @Async("scanTaskExecutor")
    public void processDecomposition(Long decompositionId) {
        IssueDecomposition decomposition = getById(decompositionId);
        if (decomposition == null) return;

        try {
            decomposition.setStatus("PROCESSING");
            updateById(decomposition);

            // 尝试从已有的分析产物中提取上下文
            Map<String, Object> context = buildContext(decomposition);

            // 执行拆解(当前为规则引擎模拟, 后续接入 LLM)
            Map<String, Object> result = decompose(decomposition, context);

            // 写回分解结果
            decomposition.setUnderstanding((String) result.get("understanding"));
            decomposition.setImpactModules(toJson(result.get("impactModules")));
            decomposition.setImpactApis(toJson(result.get("impactApis")));
            decomposition.setImpactDb(toJson(result.get("impactDb")));
            decomposition.setRisks(toJson(result.get("risks")));
            decomposition.setDependencies(toJson(result.get("dependencies")));
            decomposition.setAcceptance(toJson(result.get("acceptance")));
            decomposition.setSuggestedBranch((String) result.get("suggestedBranch"));
            decomposition.setSuggestedCommit((String) result.get("suggestedCommit"));
            decomposition.setOutputJson(toJson(result));
            decomposition.setStatus("COMPLETED");
            decomposition.setUpdatedAt(LocalDateTime.now());
            updateById(decomposition);

            // 保存子任务
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> tasks = (List<Map<String, Object>>) result.get("tasks");
            if (tasks != null) {
                for (int i = 0; i < tasks.size(); i++) {
                    Map<String, Object> t = tasks.get(i);
                    IssueTask issueTask = IssueTask.builder()
                            .decompositionId(decompositionId)
                            .taskOrder(i + 1)
                            .category((String) t.get("category"))
                            .title((String) t.get("title"))
                            .description((String) t.get("description"))
                            .impactFiles(toJson(t.get("impactFiles")))
                            .riskLevel((String) t.get("riskLevel"))
                            .testSuggestions((String) t.get("testSuggestions"))
                            .estimatedHours(t.get("estimatedHours") != null ? ((Number) t.get("estimatedHours")).doubleValue() : null)
                            .status("TODO")
                            .build();
                    taskMapper.insert(issueTask);
                }
            }

            log.info("需求拆解完成: id={}, tasks={}", decompositionId, tasks != null ? tasks.size() : 0);
        } catch (Exception e) {
            log.error("需求拆解失败: id={}", decompositionId, e);
            decomposition.setStatus("FAILED");
            decomposition.setErrorMessage(e.getMessage());
            decomposition.setUpdatedAt(LocalDateTime.now());
            updateById(decomposition);
        }
    }

    private Map<String, Object> buildContext(IssueDecomposition decomposition) {
        Map<String, Object> context = new LinkedHashMap<>();
        if (decomposition.getScanTaskId() != null) {
            try {
                Map<String, Object> graph = graphService.getDependencyGraph(decomposition.getScanTaskId());
                context.put("graph", graph);
            } catch (Exception e) {
                log.warn("获取依赖图谱失败: {}", e.getMessage());
            }
        }
        return context;
    }

    /**
     * 需求拆解逻辑 — 基于代码图谱的真实分析
     */
    private Map<String, Object> decompose(IssueDecomposition decomposition, Map<String, Object> context) {
        String title = decomposition.getTitle();
        String desc = decomposition.getDescription();
        String combined = (title + " " + (desc != null ? desc : "")).toLowerCase();

        // 从图谱上下文中提取真实数据
        List<Map<String, Object>> nodes = getNodeList(context);
        List<Map<String, String>> edges = getEdgeList(context);
        Map<String, Object> summary = getMapValue(context, "summary");

        // 基于真实符号匹配受影响的节点
        List<Map<String, Object>> matchedNodes = matchNodesByKeywords(combined, nodes);

        // 从匹配节点沿依赖边传播影响
        Set<String> directlyImpactedIds = matchedNodes.stream()
                .map(n -> (String) n.get("id"))
                .collect(Collectors.toCollection(LinkedHashSet::new));
        Set<String> allImpactedIds = propagateImpact(directlyImpactedIds, edges);

        // 提取影响模块(基于实际 package 路径)
        Map<String, List<String>> impactedByModule = groupImpactByModule(allImpactedIds, nodes);

        // 构建影响节点详情
        List<Map<String, Object>> impactDetails = buildImpactDetails(allImpactedIds, directlyImpactedIds, nodes, edges);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("understanding", generateUnderstanding(title, desc, decomposition.getBusinessContext(), matchedNodes, summary));
        result.put("impactModules", formatImpactModules(impactedByModule));
        result.put("impactApis", formatImpactApis(matchedNodes));
        result.put("impactDb", formatImpactDb(impactedByModule));
        result.put("risks", analyzeRisksFromGraph(allImpactedIds, edges, nodes, impactDetails));
        result.put("dependencies", analyzeDependenciesFromGraph(matchedNodes, edges, nodes));
        result.put("acceptance", generateAcceptanceCriteria(combined, impactDetails));
        result.put("suggestedBranch", generateBranchName(title));
        result.put("suggestedCommit", generateCommitPlan(impactedByModule));
        result.put("tasks", generateTasksFromGraph(matchedNodes, impactDetails, impactedByModule, decomposition.getPriority()));
        result.put("impactSummary", Map.of(
                "totalNodes", nodes.size(),
                "directlyImpacted", directlyImpactedIds.size(),
                "totalImpacted", allImpactedIds.size(),
                "affectedModules", impactedByModule.size()
        ));
        return result;
    }

    // ===== 图谱数据提取 =====

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> getNodeList(Map<String, Object> context) {
        Object graphObj = context.get("graph");
        if (graphObj instanceof Map<?, ?> graph && graph.get("nodes") instanceof List<?> nodes) {
            return (List<Map<String, Object>>) nodes;
        }
        return Collections.emptyList();
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, String>> getEdgeList(Map<String, Object> context) {
        Object graphObj = context.get("graph");
        if (graphObj instanceof Map<?, ?> graph && graph.get("edges") instanceof List<?> edges) {
            return (List<Map<String, String>>) edges;
        }
        return Collections.emptyList();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> getMapValue(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val instanceof Map<?, ?> m ? (Map<String, Object>) m : new LinkedHashMap<>();
    }

    // ===== 基于关键词的符号匹配 =====

    private List<Map<String, Object>> matchNodesByKeywords(String combined, List<Map<String, Object>> nodes) {
        List<Map<String, Object>> matched = new ArrayList<>();
        for (Map<String, Object> node : nodes) {
            String label = str(node, "label").toLowerCase();
            String pkg = str(node, "package").toLowerCase();
            String filePath = str(node, "filePath").toLowerCase();
            String id = str(node, "id");
            String matchTarget = label + " " + pkg + " " + filePath + " " + id;

            if (matchesKeywords(combined, matchTarget)) {
                matched.add(node);
            }
        }
        return matched;
    }

    private boolean matchesKeywords(String combined, String target) {
        // 拆分 combined 为单词/短语, 检查是否有命中目标符号名/包名/路径
        String[] keywords = combined.split("[\\s,;，；、/]+");
        for (String kw : keywords) {
            if (kw.length() < 2) continue;
            if (target.contains(kw)) return true;
        }
        // 通用操作动词匹配 — 如果需求描述含 CRUD 操作且目标是对应层级
        if (containsAny(combined, "创建", "新增", "add", "create") && target.contains("controller")) return true;
        if (containsAny(combined, "查询", "列表", "get", "list", "fetch") && target.contains("mapper")) return true;
        if (containsAny(combined, "删除", "移除", "delete", "remove") && containsAny(target, "service", "mapper")) return true;
        return false;
    }

    // ===== 影响传播 =====

    private Set<String> propagateImpact(Set<String> directIds, List<Map<String, String>> edges) {
        // 反向构建依赖图: target -> sources (谁依赖了 target)
        Map<String, Set<String>> dependents = new HashMap<>();
        for (Map<String, String> edge : edges) {
            String src = edge.get("source");
            String tgt = edge.get("target");
            if (src != null && tgt != null) {
                dependents.computeIfAbsent(tgt, k -> new HashSet<>()).add(src);
            }
        }

        Set<String> impacted = new LinkedHashSet<>(directIds);
        Queue<String> queue = new LinkedList<>(directIds);
        while (!queue.isEmpty()) {
            String current = queue.poll();
            Set<String> deps = dependents.getOrDefault(current, Collections.emptySet());
            for (String dep : deps) {
                if (impacted.add(dep)) {
                    queue.add(dep);
                }
            }
        }
        return impacted;
    }

    // ===== 模块分组 =====

    private Map<String, List<String>> groupImpactByModule(Set<String> ids, List<Map<String, Object>> nodes) {
        Map<String, List<String>> byModule = new LinkedHashMap<>();
        Map<String, Map<String, Object>> nodeMap = new HashMap<>();
        for (Map<String, Object> n : nodes) {
            nodeMap.put(str(n, "id"), n);
        }
        for (String id : ids) {
            Map<String, Object> node = nodeMap.get(id);
            if (node == null) continue;
            String pkg = str(node, "package");
            String module = extractModuleName(pkg, str(node, "filePath"));
            byModule.computeIfAbsent(module, k -> new ArrayList<>())
                    .add(str(node, "label") + " (" + str(node, "kind") + ")");
        }
        return byModule;
    }

    private String extractModuleName(String pkg, String filePath) {
        // 从 package 路径提取模块名: com.sourcelens.module.issue.service -> issue
        if (pkg != null && !pkg.isEmpty()) {
            String[] parts = pkg.split("\\.");
            for (int i = 0; i < parts.length - 1; i++) {
                if ("module".equals(parts[i]) && i + 1 < parts.length) {
                    return parts[i + 1];
                }
            }
            // 回退: 取倒数第二段
            if (parts.length >= 2) return parts[parts.length - 2];
        }
        // 从文件路径提取
        if (filePath != null && !filePath.isEmpty()) {
            String[] parts = filePath.replace("\\", "/").split("/");
            for (int i = 0; i < parts.length - 1; i++) {
                if ("module".equals(parts[i]) && i + 1 < parts.length) {
                    return parts[i + 1];
                }
            }
        }
        return "unknown";
    }

    // ===== 影响详情构建 =====

    private List<Map<String, Object>> buildImpactDetails(Set<String> allIds, Set<String> directIds,
                                                          List<Map<String, Object>> nodes, List<Map<String, String>> edges) {
        Map<String, Map<String, Object>> nodeMap = new HashMap<>();
        for (Map<String, Object> n : nodes) nodeMap.put(str(n, "id"), n);

        // 构建被依赖关系的映射
        Map<String, List<String>> dependents = new HashMap<>();
        for (Map<String, String> e : edges) {
            dependents.computeIfAbsent(e.get("target"), k -> new ArrayList<>()).add(e.get("source"));
        }

        List<Map<String, Object>> details = new ArrayList<>();
        for (String id : allIds) {
            Map<String, Object> node = nodeMap.get(id);
            if (node == null) continue;
            Map<String, Object> detail = new LinkedHashMap<>();
            detail.put("symbolId", id);
            detail.put("name", node.get("label"));
            detail.put("kind", node.get("kind"));
            detail.put("filePath", node.get("filePath"));
            detail.put("package", node.get("package"));
            detail.put("impactType", directIds.contains(id) ? "DIRECT" : "PROPAGATED");
            List<String> depBy = dependents.getOrDefault(id, Collections.emptyList());
            detail.put("dependedBy", depBy.size());
            details.add(detail);
        }
        return details;
    }

    // ===== 基于图谱的理解生成 =====

    private String generateUnderstanding(String title, String desc, String context,
                                          List<Map<String, Object>> matched, Map<String, Object> summary) {
        StringBuilder sb = new StringBuilder();
        sb.append("需求概述: ").append(title);
        if (desc != null && !desc.isEmpty()) {
            sb.append("\n\n详细描述: ").append(desc);
        }
        if (context != null && !context.isEmpty()) {
            sb.append("\n\n业务背景: ").append(context);
        }
        sb.append("\n\n基于代码图谱分析, 该需求直接关联 ").append(matched.size()).append(" 个代码符号");
        long totalNodes = getLongVal(summary, "totalNodes");
        long totalEdges = getLongVal(summary, "totalEdges");
        if (totalNodes > 0) {
            sb.append("(项目共 ").append(totalNodes).append(" 个符号, ").append(totalEdges).append(" 条依赖关系)");
        }
        if (!matched.isEmpty()) {
            sb.append(", 涉及符号:\n");
            for (Map<String, Object> m : matched) {
                sb.append("  - ").append(str(m, "label"))
                        .append(" [").append(str(m, "kind")).append("]")
                        .append(" @ ").append(str(m, "filePath"))
                        .append("\n");
            }
        }
        return sb.toString();
    }

    // ===== 基于图谱的模块/API/DB 分析 =====

    private String formatImpactModules(Map<String, List<String>> byModule) {
        List<String> parts = new ArrayList<>();
        for (Map.Entry<String, List<String>> entry : byModule.entrySet()) {
            parts.add(entry.getKey() + " (" + entry.getValue().size() + " 个符号: "
                    + String.join(", ", entry.getValue().stream().limit(5).toList())
                    + (entry.getValue().size() > 5 ? ", ..." : "") + ")");
        }
        return parts.isEmpty() ? "未匹配到具体模块" : String.join("\n", parts);
    }

    private String formatImpactApis(List<Map<String, Object>> matched) {
        List<String> apis = new ArrayList<>();
        for (Map<String, Object> node : matched) {
            String kind = str(node, "kind");
            String name = str(node, "label");
            if ("CLASS".equals(kind) && name.toLowerCase().contains("controller")) {
                apis.add("Controller: " + name + " @ " + str(node, "filePath"));
            }
            if ("METHOD".equals(kind)) {
                apis.add("Method: " + name + " @ " + str(node, "filePath") + ":" + node.get("lineNumber"));
            }
        }
        return apis.isEmpty() ? "无直接 API 影响(需根据实际变更判断)" : String.join("\n", apis);
    }

    private String formatImpactDb(Map<String, List<String>> byModule) {
        List<String> tables = new ArrayList<>();
        for (String module : byModule.keySet()) {
            if (byModule.get(module).stream().anyMatch(s -> s.contains("Entity") || s.contains("Mapper"))) {
                tables.add(module + "_* 表 (Entity/Mapper 层变更)");
            }
        }
        return tables.isEmpty() ? "无需数据库变更(未涉及 Entity/Mapper)" : String.join("\n", tables);
    }

    // ===== 基于图谱的风险分析 =====

    private String analyzeRisksFromGraph(Set<String> allImpacted, List<Map<String, String>> edges,
                                          List<Map<String, Object>> nodes, List<Map<String, Object>> impactDetails) {
        List<String> risks = new ArrayList<>();

        long directCount = impactDetails.stream().filter(d -> "DIRECT".equals(d.get("impactType"))).count();
        long propagatedCount = impactDetails.size() - directCount;

        if (propagatedCount > 10) {
            risks.add("HIGH: 影响传播范围较广(" + propagatedCount + " 个间接依赖), 回归测试风险高");
        } else if (propagatedCount > 3) {
            risks.add("MEDIUM: 影响传播了 " + propagatedCount + " 个间接依赖符号");
        }

        // 检查是否有高扇入符号被影响
        Map<String, Long> fanIn = new HashMap<>();
        for (Map<String, String> e : edges) {
            fanIn.merge(e.get("target"), 1L, Long::sum);
        }
        Map<String, Map<String, Object>> nodeMap = new HashMap<>();
        for (Map<String, Object> n : nodes) nodeMap.put(str(n, "id"), n);

        for (String id : allImpacted) {
            long fi = fanIn.getOrDefault(id, 0L);
            if (fi > 5) {
                Map<String, Object> n = nodeMap.get(id);
                String name = n != null ? str(n, "label") : id;
                risks.add("HIGH: " + name + " 被 " + fi + " 个其他符号依赖, 修改需谨慎(核心组件)");
            }
        }

        // 检查是否有跨模块影响
        Set<String> modules = impactDetails.stream()
                .map(d -> extractModuleName((String) d.get("package"), (String) d.get("filePath")))
                .collect(Collectors.toSet());
        if (modules.size() > 3) {
            risks.add("HIGH: 变更跨越 " + modules.size() + " 个模块(" + String.join(", ", modules) + "), 架构耦合风险");
        } else if (modules.size() > 1) {
            risks.add("MEDIUM: 变更涉及多模块(" + String.join(", ", modules) + ")");
        }

        if (risks.isEmpty()) {
            risks.add("LOW: 影响范围可控, 常规变更风险");
        }
        return String.join("\n", risks);
    }

    // ===== 基于图谱的依赖分析 =====

    private String analyzeDependenciesFromGraph(List<Map<String, Object>> matched,
                                                 List<Map<String, String>> edges, List<Map<String, Object>> nodes) {
        List<String> deps = new ArrayList<>();
        Map<String, Set<String>> incomingEdges = new HashMap<>();
        for (Map<String, String> e : edges) {
            incomingEdges.computeIfAbsent(e.get("source"), k -> new HashSet<>()).add(e.get("target"));
        }
        Map<String, Set<String>> outgoingEdges = new HashMap<>();
        for (Map<String, String> e : edges) {
            outgoingEdges.computeIfAbsent(e.get("target"), k -> new HashSet<>()).add(e.get("source"));
        }

        Map<String, Map<String, Object>> nodeMap = new HashMap<>();
        for (Map<String, Object> n : nodes) nodeMap.put(str(n, "id"), n);

        for (Map<String, Object> m : matched) {
            String id = str(m, "id");
            Set<String> needs = incomingEdges.getOrDefault(id, Collections.emptySet());
            Set<String> dependedBy = outgoingEdges.getOrDefault(id, Collections.emptySet());
            if (!needs.isEmpty()) {
                String names = needs.stream().map(nid -> {
                    Map<String, Object> n = nodeMap.get(nid);
                    return n != null ? str(n, "label") : nid;
                }).collect(Collectors.joining(", "));
                deps.add(str(m, "label") + " 依赖: " + names);
            }
            if (!dependedBy.isEmpty()) {
                String names = dependedBy.stream().map(nid -> {
                    Map<String, Object> n = nodeMap.get(nid);
                    return n != null ? str(n, "label") : nid;
                }).collect(Collectors.joining(", "));
                deps.add(str(m, "label") + " 被依赖: " + names);
            }
        }
        return deps.isEmpty() ? "无已知代码依赖关系" : String.join("\n", deps);
    }

    // ===== 验收标准(基于实际影响) =====

    private List<String> generateAcceptanceCriteria(String combined, List<Map<String, Object>> impactDetails) {
        List<String> criteria = new ArrayList<>();
        criteria.add("功能按需求正常运行");

        boolean hasService = impactDetails.stream().anyMatch(d -> "SERVICE".equals(d.get("kind")));
        boolean hasController = impactDetails.stream().anyMatch(d -> str(d, "filePath").contains("controller"));
        boolean hasMapper = impactDetails.stream().anyMatch(d -> str(d, "filePath").contains("mapper") || str(d, "filePath").contains("entity"));
        boolean hasMethod = impactDetails.stream().anyMatch(d -> "METHOD".equals(d.get("kind")));

        if (hasService) criteria.add("Service 层单元测试通过(覆盖受影响的 " + impactDetails.stream().filter(d -> "SERVICE".equals(d.get("kind"))).count() + " 个服务)");
        if (hasController) criteria.add("受影响 API 接口测试通过");
        if (hasMapper) criteria.add("数据库相关变更测试通过(数据完整性验证)");
        if (hasMethod) criteria.add("受影响方法的调用链路测试通过");
        criteria.add("无新增 Linter 错误");
        if (impactDetails.size() > 5) criteria.add("受影响符号较多, 需逐个检查集成兼容性");
        return criteria;
    }

    // ===== 基于图谱的任务生成 =====

    private List<Map<String, Object>> generateTasksFromGraph(List<Map<String, Object>> matched,
                                                              List<Map<String, Object>> impactDetails,
                                                              Map<String, List<String>> byModule,
                                                              String priority) {
        List<Map<String, Object>> tasks = new ArrayList<>();

        // 按模块分组生成开发任务
        for (Map.Entry<String, List<String>> entry : byModule.entrySet()) {
            String module = entry.getKey();
            List<String> symbols = entry.getValue();
            Map<String, Object> task = new LinkedHashMap<>();
            task.put("category", "DEVELOP");
            task.put("title", module + " 模块变更 (" + symbols.size() + " 个符号)");
            task.put("description", "变更涉及模块 " + module + " 中的: " + String.join(", ", symbols.stream().limit(10).toList()));
            task.put("impactFiles", symbols);
            task.put("riskLevel", symbols.size() > 5 ? "HIGH" : symbols.size() > 2 ? "MEDIUM" : "LOW");
            task.put("testSuggestions", "为 " + module + " 模块的变更编写单元测试");
            task.put("estimatedHours", Math.max(1.0, symbols.size() * 1.5));
            tasks.add(task);
        }

        // 如果匹配到了 Controller 符号, 生成 API 测试任务
        boolean hasApi = matched.stream().anyMatch(n -> str(n, "kind").equals("CLASS") && str(n, "label").toLowerCase().contains("controller"));
        if (hasApi) {
            Map<String, Object> apiTask = new LinkedHashMap<>();
            apiTask.put("category", "TEST");
            apiTask.put("title", "API 接口测试");
            apiTask.put("description", "为受影响的 Controller 接口编写集成测试");
            apiTask.put("impactFiles", matched.stream().filter(n -> str(n, "label").toLowerCase().contains("controller"))
                    .map(n -> str(n, "filePath")).toList());
            apiTask.put("riskLevel", "MEDIUM");
            apiTask.put("testSuggestions", "验证接口参数校验、响应格式和错误处理");
            apiTask.put("estimatedHours", 2.0);
            tasks.add(apiTask);
        }

        // 高传播影响时添加回归测试任务
        long propagated = impactDetails.stream().filter(d -> "PROPAGATED".equals(d.get("impactType"))).count();
        if (propagated > 0) {
            Map<String, Object> regTask = new LinkedHashMap<>();
            regTask.put("category", "TEST");
            regTask.put("title", "回归测试 (影响传播 " + propagated + " 个符号)");
            regTask.put("description", "验证所有受影响的间接依赖符号仍然正常工作");
            regTask.put("impactFiles", impactDetails.stream().filter(d -> "PROPAGATED".equals(d.get("impactType")))
                    .map(d -> str(d, "filePath")).distinct().toList());
            regTask.put("riskLevel", propagated > 10 ? "HIGH" : "MEDIUM");
            regTask.put("testSuggestions", "运行完整测试套件, 重点关注受影响模块的集成测试");
            regTask.put("estimatedHours", Math.max(2.0, propagated * 0.5));
            tasks.add(regTask);
        }

        // 如果没有匹配到任何代码符号, 退回到通用任务
        if (tasks.isEmpty()) {
            tasks.add(Map.of("category", "DEVELOP", "title", "待代码分析后确定",
                    "description", "未在代码图谱中匹配到相关符号, 建议补充 scanTaskId 或调整需求描述",
                    "impactFiles", Collections.emptyList(), "riskLevel", "LOW",
                    "testSuggestions", "需手动确认影响范围", "estimatedHours", 2.0));
        }
        return tasks;
    }

    // ===== 工具方法 =====

    private String str(Map<?, ?> map, String key) {
        Object val = map.get(key);
        return val != null ? String.valueOf(val) : "";
    }

    private long getLongVal(Map<?, ?> map, String key) {
        Object val = map.get(key);
        if (val instanceof Number n) return n.longValue();
        return 0;
    }

    private boolean containsAny(String text, String... keywords) {
        for (String kw : keywords) {
            if (text.contains(kw)) return true;
        }
        return false;
    }

    private String generateBranchName(String title) {
        String slug = title.toLowerCase()
                .replaceAll("[^a-z0-9\\u4e00-\\u9fa5]+", "-")
                .replaceAll("^-|-$", "");
        if (slug.length() > 40) slug = slug.substring(0, 40);
        return "feature/" + slug;
    }

    private String generateCommitPlan(Map<String, List<String>> byModule) {
        if (byModule.isEmpty()) {
            return "建议按以下粒度提交:\n1. Service 层业务逻辑\n2. 单元测试";
        }
        StringBuilder sb = new StringBuilder("建议按模块分批提交:\n");
        int i = 1;
        for (Map.Entry<String, List<String>> entry : byModule.entrySet()) {
            sb.append(i++).append(". ").append(entry.getKey()).append(" 模块变更 (")
              .append(entry.getValue().size()).append(" 个符号)\n");
        }
        sb.append(i).append(". 单元测试与回归验证");
        return sb.toString();
    }

    private String toJson(Object obj) {
        if (obj == null) return null;
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return String.valueOf(obj);
        }
    }

    // ===== 查询 =====

    public Page<IssueDecomposition> listByProject(Long projectId, int page, int pageSize, String status) {
        LambdaQueryWrapper<IssueDecomposition> wrapper = new LambdaQueryWrapper<IssueDecomposition>()
                .eq(IssueDecomposition::getProjectId, projectId)
                .orderByDesc(IssueDecomposition::getCreatedAt);
        if (status != null && !status.isEmpty()) {
            wrapper.eq(IssueDecomposition::getStatus, status);
        }
        return page(new Page<>(page, pageSize), wrapper);
    }

    public IssueDecomposition getDetail(Long id) {
        IssueDecomposition d = getById(id);
        if (d == null || Boolean.TRUE.equals(d.getDeleted())) {
            throw BizException.notFound("IssueDecomposition");
        }
        return d;
    }

    public List<IssueTask> listTasks(Long decompositionId) {
        return taskMapper.selectList(
                new LambdaQueryWrapper<IssueTask>()
                        .eq(IssueTask::getDecompositionId, decompositionId)
                        .orderByAsc(IssueTask::getTaskOrder));
    }

    public IssueTask updateTaskStatus(Long taskId, String status) {
        IssueTask task = taskMapper.selectById(taskId);
        if (task == null) throw BizException.notFound("IssueTask");
        task.setStatus(status);
        taskMapper.updateById(task);
        return task;
    }

    public String exportMarkdown(Long decompositionId) {
        IssueDecomposition d = getDetail(decompositionId);
        List<IssueTask> tasks = listTasks(decompositionId);
        List<String> acceptance = parseJsonList(d.getAcceptance());
        List<String> risks = parseJsonList(d.getRisks());
        List<String> deps = parseJsonList(d.getDependencies());

        StringBuilder md = new StringBuilder();
        md.append("# ").append(d.getTitle()).append("\n\n");
        md.append("- **状态**: ").append(d.getStatus()).append("\n");
        md.append("- **优先级**: ").append(d.getPriority()).append("\n");
        md.append("- **建议分支**: `").append(d.getSuggestedBranch() != null ? d.getSuggestedBranch() : "feature/xxx").append("`\n\n");

        md.append("## 需求理解\n\n").append(d.getUnderstanding() != null ? d.getUnderstanding() : "-").append("\n\n");

        md.append("## 影响分析\n\n");
        md.append("- **影响模块**: ").append(d.getImpactModules() != null ? d.getImpactModules() : "-").append("\n");
        md.append("- **影响 API**: ").append(d.getImpactApis() != null ? d.getImpactApis() : "-").append("\n");
        md.append("- **影响数据库**: ").append(d.getImpactDb() != null ? d.getImpactDb() : "-").append("\n\n");

        if (!risks.isEmpty()) {
            md.append("## 风险点\n\n");
            for (String r : risks) md.append("- ").append(r).append("\n");
            md.append("\n");
        }

        if (!deps.isEmpty()) {
            md.append("## 依赖事项\n\n");
            for (String dep : deps) md.append("- ").append(dep).append("\n");
            md.append("\n");
        }

        md.append("## 开发任务\n\n");
        for (IssueTask t : tasks) {
            String icon = "DONE".equals(t.getStatus()) ? "[x]" : "[ ]";
            md.append("- ").append(icon).append(" **").append(t.getTitle()).append("**");
            if (t.getEstimatedHours() != null) md.append(" (~").append(t.getEstimatedHours()).append("h)");
            md.append("\n");
            if (t.getDescription() != null) md.append("  - ").append(t.getDescription()).append("\n");
            if (t.getTestSuggestions() != null) md.append("  - 测试: ").append(t.getTestSuggestions()).append("\n");
        }
        md.append("\n");

        if (!acceptance.isEmpty()) {
            md.append("## 验收标准\n\n");
            for (String a : acceptance) md.append("- [ ] ").append(a).append("\n");
            md.append("\n");
        }

        if (d.getSuggestedCommit() != null) {
            md.append("## 建议 Commit 粒度\n\n").append(d.getSuggestedCommit()).append("\n");
        }

        return md.toString();
    }

    private List<String> parseJsonList(String json) {
        if (json == null || json.isEmpty()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
        } catch (Exception e) {
            return Collections.singletonList(json);
        }
    }
}