package com.sourcelens.module.analysis.service;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class ArchitectureRiskAnalyzer {

    public List<Map<String, Object>> buildRisks(JsonNode scan) {
        List<Map<String, Object>> risks = new ArrayList<>();
        JsonNode codeQuality = scan.path("code_quality");
        risks.addAll(toRiskList(codeQuality.path("risks")));

        JsonNode fileTree = scan.path("file_tree");
        JsonNode structure = scan.path("structure");
        int totalFiles = fileTree.path("total_files").asInt();
        int testFiles = fileTree.path("test_files").size();
        int apiRoutes = structure.path("api_routes").size();
        int controllers = structure.path("controllers").size();
        int services = structure.path("services").size();
        int dbEntities = structure.path("db_entities").size();
        int configCount = structure.path("configurations").size();

        if (totalFiles >= 10 && testFiles == 0) {
            risks.add(risk("TEST_COVERAGE", "HIGH", "项目没有识别到测试文件", "核心逻辑缺少回归保护, 重构和发布风险高"));
        } else if (totalFiles >= 20 && testFiles < totalFiles * 0.1) {
            risks.add(risk("TEST_COVERAGE", "MEDIUM", "测试文件占比低于 10%", "重要路径可能没有足够自动化验证"));
        }

        if (fileTree.path("large_files").size() > 0) {
            risks.add(risk("MAINTAINABILITY", "MEDIUM", "存在超过阈值的大文件", "文件职责可能过宽, 代码审查和变更定位成本上升"));
        }

        double avgMethods = codeQuality.path("avg_methods_per_class").asDouble();
        if (avgMethods > 20) {
            risks.add(risk("COMPLEXITY", "HIGH", String.format("平均每类 %.1f 个方法", avgMethods), "类粒度偏大, 容易形成高耦合模块"));
        } else if (avgMethods > 15) {
            risks.add(risk("COMPLEXITY", "MEDIUM", String.format("平均每类 %.1f 个方法", avgMethods), "建议检查核心类职责边界"));
        }

        if (controllers > 0 && services == 0) {
            risks.add(risk("ARCHITECTURE_LAYERING", "HIGH", "存在 Controller 但未识别 Service 层", "接口层可能直接承载业务逻辑, 可测试性和复用性较弱"));
        }

        if (apiRoutes > 20 && testFiles == 0) {
            risks.add(risk("API_REGRESSION", "HIGH", String.format("识别到 %d 个 API 但没有测试文件", apiRoutes), "接口兼容性缺少自动化保障"));
        }

        if (dbEntities > 0 && fileTree.path("generated_files").size() > 0) {
            risks.add(risk("DATA_MODEL", "LOW", "同时存在数据库实体和生成文件", "需确认生成代码与实体迁移策略一致"));
        }

        if (configCount > 8) {
            risks.add(risk("CONFIGURATION", "MEDIUM", String.format("配置类数量较多: %d", configCount), "配置分散可能增加环境差异和排障成本"));
        }

        return risks;
    }

    public List<Map<String, Object>> assessTechnicalDebt(JsonNode scan) {
        List<Map<String, Object>> debts = new ArrayList<>();
        JsonNode codeQuality = scan.path("code_quality");
        JsonNode fileTree = scan.path("file_tree");
        JsonNode structure = scan.path("structure");

        int testFiles = fileTree.path("test_files").size();
        int totalFiles = fileTree.path("total_files").asInt();
        if (totalFiles > 10 && testFiles < totalFiles * 0.1) {
            debts.add(debt("测试覆盖不足", "HIGH", String.format("测试文件仅 %d/%d (%.0f%%)",
                    testFiles, totalFiles, totalFiles > 0 ? (testFiles * 100.0 / totalFiles) : 0)));
        }

        int largeFiles = fileTree.path("large_files").size();
        if (largeFiles > 0) {
            debts.add(debt("大文件", "MEDIUM", String.format("发现 %d 个超过 500 行的文件", largeFiles)));
        }

        double avgMethods = codeQuality.path("avg_methods_per_class").asDouble();
        if (avgMethods > 15) {
            debts.add(debt("类职责过重", "MEDIUM", String.format("平均每类 %.1f 个方法, 建议拆分", avgMethods)));
        }

        if (structure.path("controllers").size() > 0 && structure.path("services").size() == 0) {
            debts.add(debt("分层缺失", "HIGH", "检测到 Controller 但未发现 Service 层, 业务逻辑可能集中在接口层"));
        }

        int controllerCount = structure.path("controllers").size();
        int serviceCount = structure.path("services").size();
        if (controllerCount > 10 && serviceCount > 0 && serviceCount * 3 < controllerCount) {
            debts.add(debt("业务层覆盖不足", "MEDIUM",
                    String.format("Controller 数量 %d 明显高于 Service 数量 %d, 建议检查业务层抽象", controllerCount, serviceCount)));
        }

        if (structure.path("api_routes").size() > 0 && structure.path("controllers").size() == 0) {
            debts.add(debt("API 归属异常", "MEDIUM", "检测到 API 路由但未识别 Controller, 可能存在扫描规则缺口或非常规框架用法"));
        }

        return debts;
    }

    public List<String> generateSuggestions(JsonNode scan) {
        List<String> suggestions = new ArrayList<>();
        JsonNode structure = scan.path("structure");
        JsonNode fileTree = scan.path("file_tree");

        if (!structure.path("directories").path("src_test").asBoolean()) {
            suggestions.add("建议添加 src/test 目录并编写单元测试");
        }
        if (structure.path("mappers").size() > 0 && structure.path("repositories").size() == 0) {
            suggestions.add("项目使用 MyBatis Mapper 模式, 建议确保 SQL 映射文件与 Mapper 接口一致");
        }
        if (structure.path("configurations").size() > 5) {
            suggestions.add("配置类较多(" + structure.path("configurations").size() + "个), 建议按功能模块分组");
        }
        if (structure.path("controllers").size() > 0 && structure.path("services").size() == 0) {
            suggestions.add("检测到 Controller 但未发现 Service 层, 建议添加业务逻辑分层");
        }
        if (fileTree.path("test_files").size() == 0) {
            suggestions.add("当前无测试文件, 建议为核心模块添加单元测试");
        }
        if (structure.path("api_routes").size() > 20 && fileTree.path("test_files").size() == 0) {
            suggestions.add("API 数量较多但缺少测试, 建议优先补充 Controller 集成测试和契约测试");
        }
        if (structure.path("controllers").size() > 10
                && structure.path("services").size() > 0
                && structure.path("services").size() * 3 < structure.path("controllers").size()) {
            suggestions.add("Controller 与 Service 数量比例失衡, 建议检查是否有接口层承载过多业务逻辑");
        }
        return suggestions;
    }

    private Map<String, Object> risk(String category, String severity, String message, String impact) {
        Map<String, Object> risk = new LinkedHashMap<>();
        risk.put("category", category);
        risk.put("severity", severity);
        risk.put("message", message);
        risk.put("impact", impact);
        return risk;
    }

    private Map<String, Object> debt(String category, String severity, String detail) {
        Map<String, Object> debt = new LinkedHashMap<>();
        debt.put("category", category);
        debt.put("severity", severity);
        debt.put("detail", detail);
        return debt;
    }

    private List<Map<String, Object>> toRiskList(JsonNode node) {
        List<Map<String, Object>> risks = new ArrayList<>();
        if (!node.isArray()) {
            return risks;
        }
        node.forEach(item -> {
            if (item.isObject()) {
                Map<String, Object> risk = new LinkedHashMap<>();
                item.fields().forEachRemaining(entry -> risk.put(entry.getKey(), toValue(entry.getValue())));
                risks.add(risk);
            }
        });
        return risks;
    }

    private Object toValue(JsonNode node) {
        if (node.isTextual()) {
            return node.asText();
        }
        if (node.isBoolean()) {
            return node.asBoolean();
        }
        if (node.isNumber()) {
            return node.numberValue();
        }
        return node.toString();
    }
}
