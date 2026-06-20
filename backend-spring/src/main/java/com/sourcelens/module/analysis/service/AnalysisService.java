package com.sourcelens.module.analysis.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.sourcelens.module.analysis.AnalyzerRunner;
import com.sourcelens.module.analysis.entity.CodeRelationEntity;
import com.sourcelens.module.analysis.entity.CodeSymbol;
import com.sourcelens.module.analysis.entity.ScanArtifact;
import com.sourcelens.module.analysis.mapper.CodeRelationMapper;
import com.sourcelens.module.analysis.mapper.CodeSymbolMapper;
import com.sourcelens.module.analysis.mapper.ScanArtifactMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.stream.Stream;

/**
 * 分析服务：基于 Rust Analyzer 真实扫描结果生成分析产物
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AnalysisService {

    private final ScanArtifactMapper scanArtifactMapper;
    private final AnalyzerRunner analyzerRunner;
    private final CodeSymbolMapper codeSymbolMapper;
    private final CodeRelationMapper codeRelationMapper;

    /**
     * 执行真实扫描并生成分析产物
     * @param scanTaskId 扫描任务 ID
     * @param repoPath   仓库本地路径
     */
    public void generateAnalysis(Long scanTaskId, String repoPath) {
        log.info("开始真实扫描分析, scanTaskId={}, repoPath={}", scanTaskId, repoPath);

        JsonNode scanResult;
        try {
            scanResult = analyzerRunner.scan(repoPath);
        } catch (Exception e) {
            log.warn("Rust Analyzer 执行失败, 使用 Java fallback: {}", e.getMessage());
            scanResult = buildFallbackScanResult(repoPath);
        }

        // 逐个产物保存,单个失败不影响其他产物
        String[] artifactTypes = {"RAW_SCAN_RESULT", "ARCHITECTURE_OVERVIEW", "DEPENDENCY_GRAPH",
                "API_CATALOG", "DB_SCHEMA", "CODE_METRICS", "ARCHITECTURE_REPORT"};
        for (String type : artifactTypes) {
            try {
                Map<String, Object> data = switch (type) {
                    case "RAW_SCAN_RESULT" -> toMap(scanResult);
                    case "ARCHITECTURE_OVERVIEW" -> buildArchitectureOverview(scanResult);
                    case "DEPENDENCY_GRAPH" -> buildDependencyGraph(scanResult);
                    case "API_CATALOG" -> buildApiCatalog(scanResult);
                    case "DB_SCHEMA" -> buildDbSchema(scanResult);
                    case "CODE_METRICS" -> buildCodeMetrics(scanResult);
                    case "ARCHITECTURE_REPORT" -> buildArchitectureReport(scanResult);
                    default -> Map.of();
                };
                saveArtifact(scanTaskId, type, data);
            } catch (Exception e) {
                log.error("保存产物 {} 失败, scanTaskId={}", type, scanTaskId, e);
            }
        }

        try {
            saveSymbolsAndRelations(scanTaskId, scanResult);
        } catch (Exception e) {
            log.warn("保存符号关系失败, 忽略: {}", e.getMessage());
        }

        log.info("分析产物生成完成, scanTaskId={}", scanTaskId);
    }

    public List<ScanArtifact> listByTask(Long scanTaskId) {
        return scanArtifactMapper.selectList(
                new LambdaQueryWrapper<ScanArtifact>()
                        .eq(ScanArtifact::getScanTaskId, scanTaskId)
                        .orderByAsc(ScanArtifact::getArtifactType));
    }

    public ScanArtifact getByTaskAndType(Long scanTaskId, String artifactType) {
        return scanArtifactMapper.selectOne(
                new LambdaQueryWrapper<ScanArtifact>()
                        .eq(ScanArtifact::getScanTaskId, scanTaskId)
                        .eq(ScanArtifact::getArtifactType, artifactType));
    }

    private void saveArtifact(Long scanTaskId, String type, Map<String, Object> summary) {
        String json = toJson(summary);
        ScanArtifact artifact = ScanArtifact.builder()
                .scanTaskId(scanTaskId)
                .artifactType(type)
                .storagePath("/artifacts/" + scanTaskId + "/" + type)
                .summaryJson(json)
                .build();
        scanArtifactMapper.insert(artifact);
    }

    // ===== 架构报告(V0.3) =====

    private Map<String, Object> buildArchitectureReport(JsonNode scan) {
        Map<String, Object> report = new LinkedHashMap<>();
        report.put("title", "架构分析报告");

        // 项目概览
        Map<String, Object> overview = new LinkedHashMap<>();
        JsonNode fileTree = scan.path("file_tree");
        overview.put("totalFiles", fileTree.path("total_files").asInt());
        overview.put("totalDirs", fileTree.path("total_dirs").asInt());
        overview.put("totalLines", fileTree.path("total_lines").asInt());
        overview.put("testFiles", fileTree.path("test_files").size());
        overview.put("largeFiles", fileTree.path("large_files").size());
        overview.put("generatedFiles", fileTree.path("generated_files").size());
        report.put("overview", overview);

        // 技术栈
        JsonNode framework = scan.path("framework");
        if (!framework.isMissingNode()) {
            Map<String, Object> techStack = new LinkedHashMap<>();
            techStack.put("name", framework.path("name").asText("Unknown"));
            techStack.put("version", framework.path("version").asText("Unknown"));
            techStack.put("evidence", toList(framework.path("evidence")));
            report.put("techStack", techStack);
        }

        // 目录结构
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

            // 核心模块统计
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

            // API 概览
            report.put("apiRoutes", toList(structure.path("api_routes")));

            // 数据库实体概览
            report.put("dbEntities", toList(structure.path("db_entities")));
        }

        // 代码质量 + 风险
        JsonNode codeQuality = scan.path("code_quality");
        if (!codeQuality.isMissingNode()) {
            Map<String, Object> quality = new LinkedHashMap<>();
            quality.put("totalClasses", codeQuality.path("total_classes").asInt());
            quality.put("totalMethods", codeQuality.path("total_methods").asInt());
            quality.put("avgMethodsPerClass", codeQuality.path("avg_methods_per_class").asDouble());
            quality.put("risks", toList(codeQuality.path("risks")));
            report.put("codeQuality", quality);
        }

        // 技术债评估
        report.put("technicalDebt", assessTechnicalDebt(scan));

        // 改进建议
        report.put("suggestions", generateSuggestions(scan));

        return report;
    }

    private List<Map<String, Object>> assessTechnicalDebt(JsonNode scan) {
        List<Map<String, Object>> debts = new ArrayList<>();

        JsonNode codeQuality = scan.path("code_quality");
        JsonNode fileTree = scan.path("file_tree");

        // 测试覆盖不足
        int testFiles = fileTree.path("test_files").size();
        int totalFiles = fileTree.path("total_files").asInt();
        if (totalFiles > 10 && testFiles < totalFiles * 0.1) {
            Map<String, Object> debt = new LinkedHashMap<>();
            debt.put("category", "测试覆盖不足");
            debt.put("severity", "HIGH");
            debt.put("detail", String.format("测试文件仅 %d/%d (%.0f%%)",
                    testFiles, totalFiles, totalFiles > 0 ? (testFiles * 100.0 / totalFiles) : 0));
            debts.add(debt);
        }

        // 大文件
        int largeFiles = fileTree.path("large_files").size();
        if (largeFiles > 0) {
            Map<String, Object> debt = new LinkedHashMap<>();
            debt.put("category", "大文件");
            debt.put("severity", "MEDIUM");
            debt.put("detail", String.format("发现 %d 个超过 500 行的文件", largeFiles));
            debts.add(debt);
        }

        // 平均方法数过高
        double avgMethods = codeQuality.path("avg_methods_per_class").asDouble();
        if (avgMethods > 15) {
            Map<String, Object> debt = new LinkedHashMap<>();
            debt.put("category", "类职责过重");
            debt.put("severity", "MEDIUM");
            debt.put("detail", String.format("平均每类 %.1f 个方法, 建议拆分", avgMethods));
            debts.add(debt);
        }

        return debts;
    }

    private List<String> generateSuggestions(JsonNode scan) {
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

        int totalControllers = structure.path("controllers").size();
        int totalServices = structure.path("services").size();
        if (totalControllers > 0 && totalServices == 0) {
            suggestions.add("检测到 Controller 但未发现 Service 层, 建议添加业务逻辑分层");
        }

        if (fileTree.path("test_files").size() == 0) {
            suggestions.add("当前无测试文件, 建议为核心模块添加单元测试");
        }

        return suggestions;
    }

    // ===== 基于真实扫描结果构建各类产物 =====

    private Map<String, Object> buildArchitectureOverview(JsonNode scan) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("title", "项目架构概览");

        JsonNode langStats = scan.path("language_stats");
        result.put("languages", toMapOrValue(langStats));

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
        JsonNode langStats = scan.path("language_stats");
        JsonNode structure = scan.path("structure");

        result.put("totalFiles", fileTree.path("total_files").asInt());
        result.put("totalLines", fileTree.path("total_lines").asInt());
        result.put("totalDirs", fileTree.path("total_dirs").asInt());
        result.put("testFiles", fileTree.path("test_files").size());
        result.put("largeFiles", fileTree.path("large_files").size());
        result.put("languageStats", toMapOrValue(langStats));

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

    // ===== V0.4: 持久化符号和关系 =====

    private void saveSymbolsAndRelations(Long scanTaskId, JsonNode scan) {
        // 保存符号
        JsonNode symbols = scan.path("symbols");
        if (symbols.isArray()) {
            int count = 0;
            for (JsonNode sym : symbols) {
                CodeSymbol entity = CodeSymbol.builder()
                        .scanTaskId(scanTaskId)
                        .symbolId(sym.path("symbol_id").asText())
                        .name(sym.path("name").asText())
                        .kind(sym.path("kind").asText())
                        .package_(sym.path("package").asText(""))
                        .filePath(sym.path("file_path").asText(""))
                        .lineNumber(sym.path("line_number").asInt(0))
                        .endLine(sym.has("end_line") && !sym.path("end_line").isNull()
                                ? sym.path("end_line").asInt() : null)
                        .returnType(sym.has("return_type") && !sym.path("return_type").isNull()
                                ? sym.path("return_type").asText() : null)
                        .parentClass(sym.has("parent_class") && !sym.path("parent_class").isNull()
                                ? sym.path("parent_class").asText() : null)
                        .build();
                codeSymbolMapper.insert(entity);
                count++;
            }
            log.info("保存 {} 个代码符号, scanTaskId={}", count, scanTaskId);
        }

        // 保存关系
        JsonNode relations = scan.path("relations");
        if (relations.isArray()) {
            int count = 0;
            for (JsonNode rel : relations) {
                CodeRelationEntity entity = CodeRelationEntity.builder()
                        .scanTaskId(scanTaskId)
                        .sourceId(rel.path("source_id").asText())
                        .targetId(rel.path("target_id").asText())
                        .relationType(rel.path("relation_type").asText())
                        .filePath(rel.path("file_path").asText(""))
                        .lineNumber(rel.path("line_number").asInt(0))
                        .build();
                codeRelationMapper.insert(entity);
                count++;
            }
            log.info("保存 {} 个代码关系, scanTaskId={}", count, scanTaskId);
        }
    }

    // ===== 工具方法 =====

    private String toJson(Map<String, Object> data) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            mapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
            return mapper.writeValueAsString(data);
        } catch (Exception e) {
            log.error("JSON 序列化失败", e);
            return "{}";
        }
    }

    private Map<String, Object> toMap(JsonNode node) {
        Map<String, Object> result = new LinkedHashMap<>();
        node.fields().forEachRemaining(entry -> {
            result.put(entry.getKey(), toMapOrValue(entry.getValue()));
        });
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
        } else if (node.isArray()) {
            return toList(node);
        } else if (node.isTextual()) {
            return node.asText();
        } else if (node.isBoolean()) {
            return node.asBoolean();
        } else if (node.isNumber()) {
            return node.numberValue();
        }
        return null;
    }

    // ===== Java Fallback: 当 Rust Analyzer 不可用时的基础扫描 =====

    private static final Set<String> SKIP_DIRS = Set.of(
            ".git", "node_modules", "target", "build", "dist", ".idea", ".vscode",
            ".mvn", "__pycache__", ".gradle", "vendor"
    );

    private boolean shouldSkip(String dirName) {
        return SKIP_DIRS.contains(dirName);
    }

    /**
     * 在仓库树中递归搜索 src/test 目录
     */
    private Path findSrcTest(File repoDir) {
        try (Stream<Path> walk = Files.walk(repoDir.toPath(), 5)) {
            return walk.filter(Files::isDirectory)
                    .filter(p -> p.getFileName().toString().equals("test"))
                    .filter(p -> p.getParent() != null && p.getParent().getFileName().toString().equals("src"))
                    .filter(p -> {
                        String rel = repoDir.toPath().relativize(p).toString();
                        return Arrays.stream(rel.split("[/\\\\]")).noneMatch(this::shouldSkip);
                    })
                    .findFirst()
                    .orElse(null);
        } catch (Exception e) {
            return null;
        }
    }

    private JsonNode buildFallbackScanResult(String repoPath) {
        log.info("使用 Java fallback 扫描: {}", repoPath);
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.node.ObjectNode root = mapper.createObjectNode();

            // 文件树统计
            File repoDir = new File(repoPath);
            com.fasterxml.jackson.databind.node.ObjectNode fileTree = mapper.createObjectNode();
            int[] counters = new int[3]; // totalFiles, totalDirs, totalLines
            scanDirectory(repoDir, counters);
            fileTree.put("total_files", counters[0]);
            fileTree.put("total_dirs", counters[1]);
            fileTree.put("total_lines", counters[2]);
            fileTree.put("total_bytes", 0);
            fileTree.set("test_files", mapper.createArrayNode());
            fileTree.set("large_files", mapper.createArrayNode());
            fileTree.set("generated_files", mapper.createArrayNode());
            root.set("file_tree", fileTree);

            // 语言统计
            com.fasterxml.jackson.databind.node.ObjectNode langStats = mapper.createObjectNode();
            root.set("language_stats", langStats);

            // 框架检测(递归搜索)
            detectFramework(repoDir, mapper, root);

            // 结构分析(递归搜索 + 填充目录)
            detectStructure(repoDir, mapper, root);

            // 代码质量
            com.fasterxml.jackson.databind.node.ObjectNode codeQuality = mapper.createObjectNode();
            codeQuality.put("total_classes", 0);
            codeQuality.put("total_methods", 0);
            codeQuality.put("avg_methods_per_class", 0.0);
            codeQuality.set("risks", mapper.createArrayNode());
            root.set("code_quality", codeQuality);

            // 符号和关系(空)
            root.set("symbols", mapper.createArrayNode());
            root.set("relations", mapper.createArrayNode());

            log.info("Fallback 扫描完成: {} 文件, {} 行", counters[0], counters[2]);
            return root;
        } catch (Exception e) {
            log.error("Fallback 扫描也失败", e);
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            return mapper.createObjectNode();
        }
    }

    private void scanDirectory(File dir, int[] counters) {
        File[] files = dir.listFiles();
        if (files == null) return;
        for (File f : files) {
            if (f.isDirectory()) {
                if (shouldSkip(f.getName())) continue;
                counters[1]++;
                scanDirectory(f, counters);
            } else {
                counters[0]++;
                String name = f.getName();
                if (name.endsWith(".java") || name.endsWith(".py") || name.endsWith(".go")
                        || name.endsWith(".rs") || name.endsWith(".ts") || name.endsWith(".js")) {
                    try {
                        counters[2] += (int) java.nio.file.Files.lines(f.toPath()).count();
                    } catch (Exception ignored) {}
                }
            }
        }
    }

    /**
     * 递归检测框架(支持多模块项目)
     */
    private void detectFramework(File repoDir, com.fasterxml.jackson.databind.ObjectMapper mapper,
                                 com.fasterxml.jackson.databind.node.ObjectNode root) {
        com.fasterxml.jackson.databind.node.ObjectNode framework = mapper.createObjectNode();

        // 递归搜索 pom.xml / build.gradle / go.mod / Cargo.toml / package.json
        try (Stream<Path> walk = Files.walk(repoDir.toPath(), 4)) {
            List<Path> buildFiles = walk
                    .filter(Files::isRegularFile)
                    .filter(p -> {
                        String name = p.getFileName().toString();
                        return name.equals("pom.xml") || name.equals("build.gradle") || name.equals("build.gradle.kts")
                                || name.equals("go.mod") || name.equals("Cargo.toml") || name.equals("package.json");
                    })
                    .filter(p -> {
                        String rel = repoDir.toPath().relativize(p).toString();
                        return Arrays.stream(rel.split("[/\\\\]")).noneMatch(this::shouldSkip);
                    })
                    .toList();

            for (Path bf : buildFiles) {
                String fileName = bf.getFileName().toString();
                try {
                    String content = new String(java.nio.file.Files.readAllBytes(bf));
                    String relPath = repoDir.toPath().relativize(bf).toString();

                    if (fileName.equals("pom.xml") && content.contains("spring-boot")) {
                        framework.put("name", "Spring Boot");
                        framework.set("evidence", mapper.createArrayNode().add(relPath + ": spring-boot-starter"));
                        root.set("framework", framework);
                        return;
                    }
                    if (fileName.equals("build.gradle") || fileName.equals("build.gradle.kts")) {
                        if (content.contains("spring-boot") || content.contains("org.springframework.boot")) {
                            framework.put("name", "Spring Boot");
                            framework.set("evidence", mapper.createArrayNode().add(relPath + ": spring-boot"));
                            root.set("framework", framework);
                            return;
                        }
                    }
                    if (fileName.equals("go.mod")) {
                        framework.put("name", "Go Module");
                        framework.set("evidence", mapper.createArrayNode().add(relPath));
                        root.set("framework", framework);
                        return;
                    }
                    if (fileName.equals("Cargo.toml")) {
                        framework.put("name", "Rust/Cargo");
                        framework.set("evidence", mapper.createArrayNode().add(relPath));
                        root.set("framework", framework);
                        return;
                    }
                    if (fileName.equals("package.json")) {
                        framework.put("name", "Node.js");
                        framework.set("evidence", mapper.createArrayNode().add(relPath));
                        root.set("framework", framework);
                        return;
                    }
                } catch (Exception ignored) {}
            }
        } catch (Exception e) {
            log.warn("递归搜索构建文件失败: {}", e.getMessage());
        }

        root.set("framework", framework);
    }

    /**
     * 在仓库树中递归搜索所有 src/main 目录(支持多模块项目)
     */
    private List<Path> findAllSrcMainDirs(File repoDir) {
        List<Path> result = new ArrayList<>();
        try (Stream<Path> walk = Files.walk(repoDir.toPath(), 5)) {
            walk.filter(Files::isDirectory)
                    .filter(p -> p.getFileName().toString().equals("main"))
                    .filter(p -> p.getParent() != null && p.getParent().getFileName().toString().equals("src"))
                    .filter(p -> {
                        String rel = repoDir.toPath().relativize(p).toString();
                        return Arrays.stream(rel.split("[/\\\\]")).noneMatch(this::shouldSkip);
                    })
                    .forEach(result::add);
        } catch (Exception e) {
            log.warn("递归搜索 src/main 失败: {}", e.getMessage());
        }
        return result;
    }

    /**
     * 递归检测项目结构(支持多模块项目)
     */
    private void detectStructure(File repoDir, com.fasterxml.jackson.databind.ObjectMapper mapper,
                                 com.fasterxml.jackson.databind.node.ObjectNode root) {
        com.fasterxml.jackson.databind.node.ObjectNode structure = mapper.createObjectNode();
        com.fasterxml.jackson.databind.node.ObjectNode dirs = mapper.createObjectNode();

        // 递归搜索所有 src/main, src/test (多模块)
        List<Path> srcMainPaths = findAllSrcMainDirs(repoDir);
        Path srcTestPath = findSrcTest(repoDir);

        boolean srcMain = !srcMainPaths.isEmpty();
        boolean srcTest = srcTestPath != null;
        boolean srcMainResources = srcMain && srcMainPaths.stream().anyMatch(p -> Files.exists(p.resolve("resources")));

        dirs.put("src_main", srcMain);
        dirs.put("src_test", srcTest);
        dirs.put("src_main_resources", srcMainResources);

        // 从找到的所有 src/main 开始扫描子目录
        List<String> controllerDirs = new ArrayList<>();
        List<String> serviceDirs = new ArrayList<>();
        List<String> repositoryDirs = new ArrayList<>();
        List<String> mapperDirs = new ArrayList<>();
        List<String> entityDirs = new ArrayList<>();
        List<String> dtoDirs = new ArrayList<>();
        List<String> configDirs = new ArrayList<>();

        for (Path srcMainPath : srcMainPaths) {
            Path javaBase = srcMainPath.resolve("java");
            if (Files.isDirectory(javaBase)) {
                scanDirectoryNames(javaBase, repoDir.toPath(), controllerDirs, serviceDirs,
                        repositoryDirs, mapperDirs, entityDirs, dtoDirs, configDirs);
            }

            // 也扫描 resources 下的子目录
            Path resourcesBase = srcMainPath.resolve("resources");
            if (Files.isDirectory(resourcesBase)) {
                try (Stream<Path> walk = Files.walk(resourcesBase, 4)) {
                    walk.filter(Files::isDirectory).forEach(p -> {
                        String name = p.getFileName().toString().toLowerCase();
                        String rel = repoDir.toPath().relativize(p).toString();
                        switch (name) {
                            case "mapper", "mappers" -> {
                                if (!mapperDirs.contains(rel)) mapperDirs.add(rel);
                            }
                            case "config", "configuration" -> {
                                if (!configDirs.contains(rel)) configDirs.add(rel);
                            }
                        }
                    });
                } catch (Exception ignored) {}
            }
        }

        dirs.set("controller_dir", toStringArray(controllerDirs, mapper));
        dirs.set("service_dir", toStringArray(serviceDirs, mapper));
        dirs.set("repository_dir", toStringArray(repositoryDirs, mapper));
        dirs.set("mapper_dir", toStringArray(mapperDirs, mapper));
        dirs.set("entity_dir", toStringArray(entityDirs, mapper));
        dirs.set("dto_dir", toStringArray(dtoDirs, mapper));
        dirs.set("config_dir", toStringArray(configDirs, mapper));

        com.fasterxml.jackson.databind.node.ArrayNode controllers = mapper.createArrayNode();
        com.fasterxml.jackson.databind.node.ArrayNode services = mapper.createArrayNode();
        com.fasterxml.jackson.databind.node.ArrayNode repositories = mapper.createArrayNode();
        com.fasterxml.jackson.databind.node.ArrayNode entities = mapper.createArrayNode();
        com.fasterxml.jackson.databind.node.ArrayNode mappers = mapper.createArrayNode();
        com.fasterxml.jackson.databind.node.ArrayNode configurations = mapper.createArrayNode();
        com.fasterxml.jackson.databind.node.ArrayNode dbEntities = mapper.createArrayNode();
        com.fasterxml.jackson.databind.node.ArrayNode apiRoutes = mapper.createArrayNode();

        // 扫描 Java 文件并按注解分类 (只扫描 src/main/java 目录,排除 test)
        scanJavaFiles(repoDir, srcMainPaths, mapper, controllers, services, repositories, entities,
                mappers, configurations, dbEntities, apiRoutes);

        structure.set("controllers", controllers);
        structure.set("services", services);
        structure.set("repositories", repositories);
        structure.set("entities", entities);
        structure.set("mappers", mappers);
        structure.set("configurations", configurations);
        structure.set("db_entities", dbEntities);
        structure.set("api_routes", apiRoutes);
        structure.set("directories", dirs);
        structure.set("entry_points", mapper.createArrayNode());

        root.set("structure", structure);
    }

    private com.fasterxml.jackson.databind.node.ArrayNode toStringArray(List<String> list,
                                                                       com.fasterxml.jackson.databind.ObjectMapper mapper) {
        com.fasterxml.jackson.databind.node.ArrayNode arr = mapper.createArrayNode();
        list.forEach(arr::add);
        return arr;
    }

    /**
     * 扫描 java 目录下的子目录名,填充各层目录列表
     */
    private void scanDirectoryNames(Path javaBase, Path repoRoot,
                                    List<String> controllerDirs, List<String> serviceDirs,
                                    List<String> repositoryDirs, List<String> mapperDirs,
                                    List<String> entityDirs, List<String> dtoDirs,
                                    List<String> configDirs) {
        try (Stream<Path> walk = Files.walk(javaBase, 8)) {
            walk.filter(Files::isDirectory).forEach(p -> {
                String name = p.getFileName().toString().toLowerCase();
                String rel = repoRoot.relativize(p).toString();
                switch (name) {
                    case "controller", "controllers" -> controllerDirs.add(rel);
                    case "service", "services" -> serviceDirs.add(rel);
                    case "repository", "repositories", "repo", "repos" -> repositoryDirs.add(rel);
                    case "mapper", "mappers" -> {
                        if (!mapperDirs.contains(rel)) mapperDirs.add(rel);
                    }
                    case "entity", "entities", "model", "models", "domain" -> entityDirs.add(rel);
                    case "dto", "dtos", "vo", "vos", "request", "response" -> dtoDirs.add(rel);
                    case "config", "configuration", "configs", "configurations" -> configDirs.add(rel);
                }
            });
        } catch (Exception e) {
            log.warn("扫描目录结构失败: {}", e.getMessage());
        }
    }

    /**
     * 按注解分类扫描 Java 文件 — 只扫描 src/main/java 目录,排除 test
     */
    private void scanJavaFiles(File repoDir, List<Path> srcMainPaths,
                               com.fasterxml.jackson.databind.ObjectMapper mapper,
                               com.fasterxml.jackson.databind.node.ArrayNode controllers,
                               com.fasterxml.jackson.databind.node.ArrayNode services,
                               com.fasterxml.jackson.databind.node.ArrayNode repositories,
                               com.fasterxml.jackson.databind.node.ArrayNode entities,
                               com.fasterxml.jackson.databind.node.ArrayNode mappers,
                               com.fasterxml.jackson.databind.node.ArrayNode configurations,
                               com.fasterxml.jackson.databind.node.ArrayNode dbEntities,
                               com.fasterxml.jackson.databind.node.ArrayNode apiRoutes) {
        Set<String> processed = new HashSet<>(); // 去重: 避免多模块项目同路径文件重复扫描
        for (Path srcMain : srcMainPaths) {
            Path javaBase = srcMain.resolve("java");
            if (!Files.isDirectory(javaBase)) continue;

            try (Stream<Path> walk = Files.walk(javaBase, 15)) {
                walk.filter(Files::isRegularFile)
                        .filter(p -> p.toString().endsWith(".java"))
                        .forEach(javaFile -> {
                            try {
                                // 去重: 用文件的绝对路径避免重复
                                String absPath = javaFile.toAbsolutePath().toString();
                                if (!processed.add(absPath)) return;

                                String content = new String(java.nio.file.Files.readAllBytes(javaFile));
                                String relPath = repoDir.toPath().relativize(javaFile).toString();

                                String baseName = javaFile.getFileName().toString().replace(".java", "");

                                com.fasterxml.jackson.databind.node.ObjectNode entry = mapper.createObjectNode();
                                entry.put("name", baseName);
                                entry.put("file_path", relPath);

                                if (content.contains("@RestController") || content.contains("@Controller")) {
                                    entry.put("type", "controller");
                                    controllers.add(entry);
                                    extractApiRoutesFromContent(content, baseName, relPath, apiRoutes);
                                } else if (content.contains("@Service")) {
                                    entry.put("type", "service");
                                    services.add(entry);
                                } else if (content.contains("@Repository")
                                        || content.contains("extends BaseMapper")
                                        || content.contains("extends CrudRepository")
                                        || content.contains("extends JpaRepository")) {
                                    entry.put("type", "repository");
                                    repositories.add(entry);
                                } else if (content.contains("@TableName")
                                        || content.contains("@Entity")
                                        || content.matches("(?s).*@Table\\s*\\(.*")) {
                                    entry.put("type", "entity");
                                    entities.add(entry);
                                    String tableName = extractTableName(content);
                                    // 只有真正有 @TableName 或 @Table(name=...) 或 @Entity(JPA) 才算 DB Entity
                                    boolean hasTableAnnotation = content.contains("@TableName")
                                            || content.contains("@Entity")
                                            || content.matches("(?s).*@Table\\s*\\(.*");
                                    if (hasTableAnnotation) {
                                        com.fasterxml.jackson.databind.node.ObjectNode dbEntry = mapper.createObjectNode();
                                        dbEntry.put("class_name", baseName);
                                        dbEntry.put("table_name", tableName);
                                        dbEntry.put("file_path", relPath);
                                        dbEntry.put("field_count", countFields(content));
                                        dbEntities.add(dbEntry);
                                    }
                                } else if (content.contains("@Mapper")) {
                                    entry.put("type", "mapper");
                                    mappers.add(entry);
                                } else if (content.contains("@Configuration")
                                        || content.contains("@ConfigurationProperties")) {
                                    entry.put("type", "configuration");
                                    configurations.add(entry);
                                }
                            } catch (Exception ignored) {}
                        });
            } catch (Exception e) {
                log.warn("扫描 Java 文件失败 ({}): {}", javaBase, e.getMessage());
            }
        }
    }

    private String extractTableName(String content) {
        // @TableName("xxx")
        java.util.regex.Matcher m1 = java.util.regex.Pattern
                .compile("@TableName\\s*\\(\\s*\"([^\"]+)\"\\s*\\)")
                .matcher(content);
        if (m1.find()) return m1.group(1);

        // @Table(name = "xxx")
        java.util.regex.Matcher m2 = java.util.regex.Pattern
                .compile("@Table\\s*\\(\\s*name\\s*=\\s*\"([^\"]+)\"\\s*\\)")
                .matcher(content);
        if (m2.find()) return m2.group(1);

        return null;
    }

    private int countFields(String content) {
        int count = 0;
        for (String line : content.split("\n")) {
            if (line.contains("private ") && line.contains(";")) count++;
        }
        return count;
    }

    /**
     * 提取注解中的路径值
     * 处理: "/path", value="/path", path="/path", name="/path" 等形式
     */
    private String extractAnnotationPath(String raw) {
        String trimmed = raw.trim();
        if (trimmed.isEmpty()) return "";

        // 直接是字符串字面量: "/api" 或 '/api'
        if ((trimmed.startsWith("\"") && trimmed.endsWith("\""))
                || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
            return trimmed.substring(1, trimmed.length() - 1).trim();
        }

        // value = "/path" 或 path = "/path" 或 name = "/path"
        java.util.regex.Matcher kvMatcher = java.util.regex.Pattern
                .compile("(?:value|path|name)\\s*=\\s*[\"']([^\"']+)[\"']")
                .matcher(trimmed);
        if (kvMatcher.find()) {
            return kvMatcher.group(1).trim();
        }

        // 兜底: 尝试提取第一个引号字符串
        java.util.regex.Matcher strMatcher = java.util.regex.Pattern
                .compile("[\"']([^\"']+)[\"']")
                .matcher(trimmed);
        if (strMatcher.find()) {
            return strMatcher.group(1).trim();
        }

        // 无引号的简单路径: /api
        if (trimmed.startsWith("/")) {
            return trimmed;
        }

        return "";
    }

    /**
     * 从 Controller 内容中提取 API 路由
     * 与 Rust extract_api_routes 保持一致的逻辑:
     * 先匹配注解再更新花括号深度, depth==0 为类级, depth>=1 为方法级
     */
    private void extractApiRoutesFromContent(String content, String className, String filePath,
                                             com.fasterxml.jackson.databind.node.ArrayNode apiRoutes) {
        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        String classPrefix = "";
        String[] lines = content.split("\n");
        int braceDepth = 0;

        java.util.regex.Pattern requestMappingFull = java.util.regex.Pattern
                .compile("@RequestMapping(?:\\(([^)]*)\\))?");
        java.util.regex.Pattern simpleMapping = java.util.regex.Pattern
                .compile("@(Get|Post|Put|Delete|Patch)Mapping(?:\\(([^)]*)\\))?");

        for (int i = 0; i < lines.length; i++) {
            String trimmed = lines[i].trim();

            // 先匹配注解(在花括号计数之前)
            java.util.regex.Matcher rm = requestMappingFull.matcher(trimmed);
            if (rm.find()) {
                String inner = rm.group(1);
                if (braceDepth == 0) {
                    // 类级 @RequestMapping: 设置路径前缀
                    if (inner != null) {
                        classPrefix = extractAnnotationPath(inner);
                    }
                } else {
                    // 方法级 @RequestMapping: 生成路由
                    String httpMethod = "ALL";
                    String pathPart = "";
                    if (inner != null) {
                        java.util.regex.Matcher hm = java.util.regex.Pattern
                                .compile("method\\s*=\\s*RequestMethod\\.(\\w+)").matcher(inner);
                        if (hm.find()) httpMethod = hm.group(1);
                        pathPart = extractAnnotationPath(inner);
                        if (pathPart.isEmpty()) {
                            java.util.regex.Matcher vm = java.util.regex.Pattern
                                    .compile("value\\s*=\\s*\"([^\"]+)\"").matcher(inner);
                            if (vm.find()) pathPart = vm.group(1);
                        }
                    }
                    String fullPath = combineJavaPaths(classPrefix, pathPart);
                    if (!fullPath.isEmpty()) {
                        String methodName = extractNextJavaMethodName(lines, i);
                        com.fasterxml.jackson.databind.node.ObjectNode route = mapper.createObjectNode();
                        route.put("method", httpMethod);
                        route.put("path", fullPath);
                        route.put("handler_class", className);
                        route.put("handler_method", methodName);
                        route.put("line_number", i + 1);
                        apiRoutes.add(route);
                    }
                }
            } else if (braceDepth >= 1) {
                // @GetMapping/@PostMapping 等 (在 depth>=1 时)
                java.util.regex.Matcher mm = simpleMapping.matcher(trimmed);
                if (mm.find()) {
                    String method = mm.group(1).toUpperCase();
                    String pathPart = "";
                    if (mm.group(2) != null) {
                        pathPart = extractAnnotationPath(mm.group(2));
                        if (pathPart.isEmpty()) {
                            java.util.regex.Matcher vm = java.util.regex.Pattern
                                    .compile("value\\s*=\\s*\"([^\"]+)\"").matcher(mm.group(2));
                            if (vm.find()) pathPart = vm.group(1);
                        }
                    }
                    String fullPath = combineJavaPaths(classPrefix, pathPart);
                    if (!fullPath.isEmpty()) {
                        String methodName = extractNextJavaMethodName(lines, i);
                        com.fasterxml.jackson.databind.node.ObjectNode route = mapper.createObjectNode();
                        route.put("method", method);
                        route.put("path", fullPath);
                        route.put("handler_class", className);
                        route.put("handler_method", methodName);
                        route.put("line_number", i + 1);
                        apiRoutes.add(route);
                    }
                }
            }

            // 注解匹配之后再更新花括号深度
            for (char c : trimmed.toCharArray()) {
                if (c == '{') braceDepth++;
                if (c == '}') braceDepth--;
            }
        }
    }

    private String combineJavaPaths(String classPrefix, String methodPath) {
        if (classPrefix.isEmpty() && methodPath.isEmpty()) return "";
        if (methodPath.isEmpty()) return classPrefix;
        String full;
        if (methodPath.startsWith("/")) {
            full = classPrefix + methodPath;
        } else {
            full = classPrefix.isEmpty() ? "/" + methodPath : classPrefix + "/" + methodPath;
        }
        if (!full.startsWith("/")) full = "/" + full;
        return full;
    }

    private String extractNextJavaMethodName(String[] lines, int fromLine) {
        for (int j = fromLine + 1; j < Math.min(fromLine + 10, lines.length); j++) {
            String l = lines[j].trim();
            if (l.contains("public ") || l.contains("private ") || l.contains("protected ")) {
                java.util.regex.Matcher nm = java.util.regex.Pattern
                        .compile("\\s+(\\w+)\\s*\\(").matcher(l);
                if (nm.find()) return nm.group(1);
            }
        }
        return "";
    }
}