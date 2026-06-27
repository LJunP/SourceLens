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
public class AnalysisArtifactBuilder {

    private final ArchitectureRiskAnalyzer riskAnalyzer;

    public static final List<String> ARTIFACT_TYPES = List.of(
            "RAW_SCAN_RESULT",
            "ARCHITECTURE_OVERVIEW",
            "DEPENDENCY_GRAPH",
            "API_CATALOG",
            "DB_SCHEMA",
            "CODE_METRICS",
            "ARCHITECTURE_REPORT"
    );

    public Map<String, Map<String, Object>> buildArtifacts(JsonNode scan) {
        Map<String, Map<String, Object>> artifacts = new LinkedHashMap<>();
        for (String type : ARTIFACT_TYPES) {
            artifacts.put(type, build(type, scan));
        }
        return artifacts;
    }

    public Map<String, Object> build(String type, JsonNode scan) {
        return switch (type) {
            case "RAW_SCAN_RESULT" -> toMap(scan);
            case "ARCHITECTURE_OVERVIEW" -> buildArchitectureOverview(scan);
            case "DEPENDENCY_GRAPH" -> buildDependencyGraph(scan);
            case "API_CATALOG" -> buildApiCatalog(scan);
            case "DB_SCHEMA" -> buildDbSchema(scan);
            case "CODE_METRICS" -> buildCodeMetrics(scan);
            case "ARCHITECTURE_REPORT" -> buildArchitectureReport(scan);
            default -> Map.of();
        };
    }

    private Map<String, Object> buildArchitectureReport(JsonNode scan) {
        Map<String, Object> report = new LinkedHashMap<>();
        report.put("title", "架构分析报告");

        Map<String, Object> overview = new LinkedHashMap<>();
        JsonNode fileTree = scan.path("file_tree");
        overview.put("totalFiles", fileTree.path("total_files").asInt());
        overview.put("totalDirs", fileTree.path("total_dirs").asInt());
        overview.put("totalLines", fileTree.path("total_lines").asInt());
        overview.put("testFiles", fileTree.path("test_files").size());
        overview.put("largeFiles", fileTree.path("large_files").size());
        overview.put("generatedFiles", fileTree.path("generated_files").size());
        report.put("overview", overview);
        Map<String, Object> scanFingerprint = buildScanFingerprint(fileTree);
        if (!scanFingerprint.isEmpty()) {
            report.put("scanFingerprint", scanFingerprint);
        }

        JsonNode framework = scan.path("framework");
        if (!framework.isMissingNode()) {
            Map<String, Object> techStack = new LinkedHashMap<>();
            techStack.put("name", framework.path("name").asText("Unknown"));
            techStack.put("version", framework.path("version").asText("Unknown"));
            techStack.put("evidence", toList(framework.path("evidence")));
            report.put("techStack", techStack);
        }

        JsonNode structure = scan.path("structure");
        if (!structure.isMissingNode()) {
            JsonNode dirs = structure.path("directories");
            Map<String, Object> dirInfo = new LinkedHashMap<>();
            dirInfo.put("srcMain", dirs.path("src_main").asBoolean());
            dirInfo.put("srcTest", dirs.path("src_test").asBoolean());
            dirInfo.put("srcMainResources", dirs.path("src_main_resources").asBoolean());
            dirInfo.put("controllerDirs", toList(dirs.path("controller_dir")));
            dirInfo.put("serviceDirs", toList(dirs.path("service_dir")));
            dirInfo.put("repositoryDirs", toList(dirs.path("repository_dir")));
            dirInfo.put("mapperDirs", toList(dirs.path("mapper_dir")));
            dirInfo.put("entityDirs", toList(dirs.path("entity_dir")));
            dirInfo.put("dtoDirs", toList(dirs.path("dto_dir")));
            dirInfo.put("configDirs", toList(dirs.path("config_dir")));
            report.put("directories", dirInfo);

            Map<String, Object> modules = new LinkedHashMap<>();
            modules.put("controllers", structure.path("controllers").size());
            modules.put("services", structure.path("services").size());
            modules.put("repositories", structure.path("repositories").size());
            modules.put("entities", structure.path("entities").size());
            modules.put("mappers", structure.path("mappers").size());
            modules.put("configurations", structure.path("configurations").size());
            modules.put("dbEntities", structure.path("db_entities").size());
            modules.put("apiRoutes", structure.path("api_routes").size());
            report.put("modules", modules);

            report.put("apiRoutes", toList(structure.path("api_routes")));
            report.put("dbEntities", toList(structure.path("db_entities")));
        }

        List<Map<String, Object>> risks = riskAnalyzer.buildRisks(scan);
        List<Map<String, Object>> technicalDebt = riskAnalyzer.assessTechnicalDebt(scan);
        List<String> suggestions = riskAnalyzer.generateSuggestions(scan);

        JsonNode codeQuality = scan.path("code_quality");
        if (!codeQuality.isMissingNode()) {
            Map<String, Object> quality = new LinkedHashMap<>();
            quality.put("totalClasses", codeQuality.path("total_classes").asInt());
            quality.put("totalMethods", codeQuality.path("total_methods").asInt());
            quality.put("avgMethodsPerClass", codeQuality.path("avg_methods_per_class").asDouble());
            quality.put("risks", risks);
            report.put("codeQuality", quality);
        }

        report.put("technicalDebt", technicalDebt);
        report.put("suggestions", suggestions);
        report.put("reportQuality", buildReportQuality(scan, risks, technicalDebt, suggestions, scanFingerprint));
        return report;
    }

    private Map<String, Object> buildReportQuality(JsonNode scan,
                                                   List<Map<String, Object>> risks,
                                                   List<Map<String, Object>> technicalDebt,
                                                   List<String> suggestions,
                                                   Map<String, Object> scanFingerprint) {
        JsonNode fileTree = scan.path("file_tree");
        JsonNode structure = scan.path("structure");
        int totalFiles = fileTree.path("total_files").asInt();
        int totalLines = fileTree.path("total_lines").asInt();
        int testFiles = fileTree.path("test_files").size();
        int controllers = structure.path("controllers").size();
        int services = structure.path("services").size();
        int repositories = structure.path("repositories").size();
        int entities = structure.path("entities").size();
        int moduleCount = controllers + services + repositories + entities;
        int apiRoutes = structure.path("api_routes").size();
        int dbEntities = structure.path("db_entities").size();
        boolean hasFingerprint = scanFingerprint.containsKey("repoContentHash");
        long highRiskCount = countRiskSeverity(risks, "HIGH");
        long mediumRiskCount = countRiskSeverity(risks, "MEDIUM");

        List<Map<String, Object>> evidenceChecks = new ArrayList<>();
        List<String> gaps = new ArrayList<>();
        addEvidenceCheck(evidenceChecks, gaps, "scan_scope", "扫描范围",
                totalFiles > 0 ? "READY" : "GAP",
                totalFiles + " files / " + totalLines + " lines",
                totalFiles > 0 ? "已识别仓库规模" : "未识别到有效文件规模",
                totalFiles <= 0 ? "未识别到有效文件规模" : null);
        addEvidenceCheck(evidenceChecks, gaps, "test_signal", "测试证据",
                testFiles > 0 ? "READY" : "WARNING",
                testFiles + " test files",
                testFiles > 0 ? "测试文件可作为回归保护依据" : "未识别测试文件",
                testFiles <= 0 ? "缺少测试文件证据" : null);
        addEvidenceCheck(evidenceChecks, gaps, "module_map", "结构识别",
                moduleCount > 0 ? "READY" : "WARNING",
                moduleCount + " modules",
                "Controller " + controllers + " / Service " + services
                        + " / Repository " + repositories + " / Entity " + entities,
                moduleCount <= 0 ? "未识别到主要代码结构" : null);
        addEvidenceCheck(evidenceChecks, gaps, "api_data_surface", "接口与数据面",
                apiRoutes + dbEntities > 0 ? "READY" : "IDLE",
                apiRoutes + " APIs / " + dbEntities + " DB entities",
                apiRoutes + dbEntities > 0 ? "已识别外部交互面" : "未识别 API 或数据库实体",
                null);
        addEvidenceCheck(evidenceChecks, gaps, "fingerprint", "扫描指纹",
                hasFingerprint ? "READY" : "WARNING",
                hasFingerprint ? "present" : "missing",
                hasFingerprint ? "可用于后续报告对比与漂移检测" : "缺少仓库内容哈希",
                hasFingerprint ? null : "缺少扫描指纹");
        addEvidenceCheck(evidenceChecks, gaps, "risk_signal", "风险信号",
                highRiskCount > 0 ? "RISK" : risks.isEmpty() ? "READY" : "WARNING",
                risks.size() + " risks",
                "HIGH " + highRiskCount + " / MEDIUM " + mediumRiskCount,
                highRiskCount > 0 ? "存在高风险项" : null);

        int confidence = 52;
        confidence += totalFiles > 0 ? 10 : -16;
        confidence += moduleCount > 0 ? 9 : -10;
        confidence += testFiles > 0 ? 8 : -9;
        confidence += hasFingerprint ? 7 : -6;
        confidence += apiRoutes + dbEntities > 0 ? 4 : 0;
        confidence -= (int) highRiskCount * 12;
        confidence -= (int) mediumRiskCount * 4;
        confidence -= technicalDebt.size() * 2;
        confidence = Math.max(5, Math.min(96, confidence));

        String readiness;
        String summary;
        if (highRiskCount > 0 || confidence < 50) {
            readiness = "RISK";
            summary = "报告发现高风险证据，应优先处理风险与执行日志";
        } else if (!gaps.isEmpty() || confidence < 75) {
            readiness = "REVIEW";
            summary = "报告可读，但仍存在证据缺口需要复核";
        } else {
            readiness = "READY";
            summary = "报告证据完整，可进入问答、图谱复盘与治理任务";
        }

        List<String> nextActions = new ArrayList<>();
        if (highRiskCount > 0) {
            nextActions.add("优先处理高风险项，再进入自动修复或重构计划");
        }
        if (testFiles <= 0) {
            nextActions.add("补充测试文件，让后续自动修复具备回归保护");
        }
        if (!hasFingerprint) {
            nextActions.add("补齐扫描指纹，支持后续报告对比和漂移检测");
        }
        if (nextActions.isEmpty()) {
            nextActions.add(suggestions.isEmpty() ? "进入 code_chunks 问答、依赖图谱复盘和自动修复候选筛选" : suggestions.get(0));
        }

        Map<String, Object> quality = new LinkedHashMap<>();
        quality.put("readiness", readiness);
        quality.put("confidence", confidence);
        quality.put("summary", summary);
        quality.put("highRiskCount", highRiskCount);
        quality.put("mediumRiskCount", mediumRiskCount);
        quality.put("technicalDebtCount", technicalDebt.size());
        quality.put("suggestionCount", suggestions.size());
        quality.put("gaps", gaps);
        quality.put("nextActions", nextActions);
        quality.put("evidenceChecks", evidenceChecks);
        return quality;
    }

    private void addEvidenceCheck(List<Map<String, Object>> evidenceChecks,
                                  List<String> gaps,
                                  String key,
                                  String label,
                                  String status,
                                  String value,
                                  String detail,
                                  String gap) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("key", key);
        item.put("label", label);
        item.put("status", status);
        item.put("value", value);
        item.put("detail", detail);
        evidenceChecks.add(item);
        if (gap != null && !gap.isBlank()) {
            gaps.add(gap);
        }
    }

    private long countRiskSeverity(List<Map<String, Object>> risks, String severity) {
        return risks.stream()
                .filter(risk -> severity.equals(String.valueOf(risk.get("severity"))))
                .count();
    }

    private Map<String, Object> buildArchitectureOverview(JsonNode scan) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("title", "项目架构概览");
        result.put("languages", toMapOrValue(scan.path("language_stats")));

        JsonNode framework = scan.path("framework");
        if (!framework.isMissingNode()) {
            result.put("framework", Map.of(
                    "name", framework.path("name").asText("Unknown"),
                    "version", framework.path("version").asText("Unknown"),
                    "evidence", toList(framework.path("evidence"))
            ));
        }

        JsonNode structure = scan.path("structure");
        if (!structure.isMissingNode()) {
            result.put("controllers", structure.path("controllers").size());
            result.put("services", structure.path("services").size());
            result.put("repositories", structure.path("repositories").size());
            result.put("entities", structure.path("entities").size());
            result.put("entryPoints", toList(structure.path("entry_points")));
        }

        JsonNode fileTree = scan.path("file_tree");
        result.put("totalFiles", fileTree.path("total_files").asInt());
        result.put("totalDirs", fileTree.path("total_dirs").asInt());
        result.put("totalLines", fileTree.path("total_lines").asInt());
        return result;
    }

    private Map<String, Object> buildDependencyGraph(JsonNode scan) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("title", "依赖分析");
        JsonNode framework = scan.path("framework");
        if (!framework.isMissingNode()) {
            result.put("framework", framework.path("name").asText());
            result.put("evidence", toList(framework.path("evidence")));
        }
        result.put("summary", "基于仓库结构和配置文件分析的依赖信息");
        return result;
    }

    private Map<String, Object> buildApiCatalog(JsonNode scan) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("title", "API 接口目录");
        JsonNode structure = scan.path("structure");
        JsonNode routes = structure.path("api_routes");
        result.put("totalEndpoints", routes.size());
        result.put("routes", toList(routes));
        JsonNode controllers = structure.path("controllers");
        result.put("totalControllers", controllers.size());
        result.put("controllers", toList(controllers));
        return result;
    }

    private Map<String, Object> buildDbSchema(JsonNode scan) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("title", "数据库 Schema 分析");
        JsonNode structure = scan.path("structure");
        JsonNode entities = structure.path("entities");
        result.put("totalEntities", entities.size());
        result.put("entities", toList(entities));
        result.put("dbEntities", toList(structure.path("db_entities")));
        result.put("summary", "基于 @Entity/@TableName/@Table 注解识别的数据库实体");
        return result;
    }

    private Map<String, Object> buildCodeMetrics(JsonNode scan) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("title", "代码指标");
        JsonNode fileTree = scan.path("file_tree");
        JsonNode structure = scan.path("structure");

        result.put("totalFiles", fileTree.path("total_files").asInt());
        result.put("totalLines", fileTree.path("total_lines").asInt());
        result.put("totalDirs", fileTree.path("total_dirs").asInt());
        result.put("testFiles", fileTree.path("test_files").size());
        result.put("largeFiles", fileTree.path("large_files").size());
        Map<String, Object> scanFingerprint = buildScanFingerprint(fileTree);
        if (!scanFingerprint.isEmpty()) {
            result.put("scanFingerprint", scanFingerprint);
        }
        result.put("languageStats", toMapOrValue(scan.path("language_stats")));

        int totalClasses = structure.path("controllers").size()
                + structure.path("services").size()
                + structure.path("repositories").size()
                + structure.path("entities").size()
                + structure.path("mappers").size()
                + structure.path("configurations").size();
        result.put("totalClasses", totalClasses);

        JsonNode codeQuality = scan.path("code_quality");
        if (!codeQuality.isMissingNode()) {
            result.put("totalMethods", codeQuality.path("total_methods").asInt());
            result.put("avgMethodsPerClass", codeQuality.path("avg_methods_per_class").asDouble());
        }
        return result;
    }

    private Map<String, Object> buildScanFingerprint(JsonNode fileTree) {
        Map<String, Object> fingerprint = new LinkedHashMap<>();
        JsonNode repoHash = fileTree.path("repo_content_hash");
        if (repoHash.isTextual() && !repoHash.asText().isBlank()) {
            fingerprint.put("repoContentHash", repoHash.asText());
        }
        JsonNode manifest = fileTree.path("file_manifest");
        if (manifest.isArray()) {
            fingerprint.put("manifestFiles", manifest.size());
            long hashedFiles = 0;
            long binaryFiles = 0;
            long largeFiles = 0;
            for (JsonNode file : manifest) {
                if (file.path("content_hash_sha256").isTextual()) {
                    hashedFiles++;
                }
                if (file.path("is_binary").asBoolean(false)) {
                    binaryFiles++;
                }
                if (file.path("is_large").asBoolean(false)) {
                    largeFiles++;
                }
            }
            fingerprint.put("hashedFiles", hashedFiles);
            fingerprint.put("binaryFiles", binaryFiles);
            fingerprint.put("largeFiles", largeFiles);
        }
        return fingerprint;
    }

    private Map<String, Object> toMap(JsonNode node) {
        Map<String, Object> result = new LinkedHashMap<>();
        node.fields().forEachRemaining(entry -> result.put(entry.getKey(), toMapOrValue(entry.getValue())));
        return result;
    }

    private List<Object> toList(JsonNode node) {
        List<Object> list = new ArrayList<>();
        if (node.isArray()) {
            node.forEach(item -> list.add(toMapOrValue(item)));
        }
        return list;
    }

    private Object toMapOrValue(JsonNode node) {
        if (node.isObject()) {
            return toMap(node);
        }
        if (node.isArray()) {
            return toList(node);
        }
        if (node.isTextual()) {
            return node.asText();
        }
        if (node.isBoolean()) {
            return node.asBoolean();
        }
        if (node.isNumber()) {
            return node.numberValue();
        }
        return null;
    }
}
