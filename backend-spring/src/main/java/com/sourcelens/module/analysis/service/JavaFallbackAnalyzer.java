package com.sourcelens.module.analysis.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sourcelens.module.analysis.entity.CodeRelationEntity;
import com.sourcelens.module.analysis.entity.CodeSymbol;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.stream.Stream;

@Slf4j
@Component
@RequiredArgsConstructor
public class JavaFallbackAnalyzer {

    private static final Set<String> SKIP_DIRS = Set.of(
            ".git", "node_modules", "target", "build", "dist", ".idea", ".vscode",
            ".mvn", "__pycache__", ".gradle", "vendor"
    );

    private final JavaAstParser javaAstParser;

    public JsonNode scan(String repoPath, Map<String, JavaAstParser.ParseResult> parsedAstMap) {
        log.info("使用 Java fallback 扫描: {}", repoPath);
        try {
            ObjectMapper mapper = new ObjectMapper();
            ObjectNode root = mapper.createObjectNode();
            File repoDir = new File(repoPath);

            ObjectNode fileTree = mapper.createObjectNode();
            int[] counters = new int[3];
            scanDirectory(repoDir, counters);
            fileTree.put("total_files", counters[0]);
            fileTree.put("total_dirs", counters[1]);
            fileTree.put("total_lines", counters[2]);
            fileTree.put("total_bytes", 0);
            fileTree.set("test_files", mapper.createArrayNode());
            fileTree.set("large_files", mapper.createArrayNode());
            fileTree.set("generated_files", mapper.createArrayNode());
            root.set("file_tree", fileTree);

            root.set("language_stats", mapper.createObjectNode());
            detectFramework(repoDir, mapper, root);

            ArrayNode symbols = mapper.createArrayNode();
            ArrayNode relations = mapper.createArrayNode();
            detectStructure(repoDir, mapper, root, symbols, relations, parsedAstMap);
            root.set("graph", buildAstGraph(mapper, parsedAstMap));

            ObjectNode codeQuality = mapper.createObjectNode();
            codeQuality.put("total_classes", 0);
            codeQuality.put("total_methods", 0);
            codeQuality.put("avg_methods_per_class", 0.0);
            codeQuality.set("risks", mapper.createArrayNode());
            root.set("code_quality", codeQuality);

            root.set("symbols", symbols);
            root.set("relations", relations);

            log.info("Fallback 扫描完成: {} 文件, {} 行", counters[0], counters[2]);
            return root;
        } catch (Exception e) {
            log.error("Fallback 扫描也失败", e);
            return new ObjectMapper().createObjectNode();
        }
    }

    public void enrichJavaStructureWithAst(JsonNode scanResult,
                                           String repoPath,
                                           Map<String, JavaAstParser.ParseResult> parsedAstMap) {
        File repoDir = new File(repoPath);
        if (!repoDir.exists()) {
            return;
        }

        boolean hasJavaFiles = false;
        try (Stream<Path> walk = Files.walk(repoDir.toPath(), 15)) {
            hasJavaFiles = walk.filter(Files::isRegularFile)
                    .anyMatch(p -> p.toString().endsWith(".java"));
        } catch (Exception ignored) {
        }
        if (!hasJavaFiles) {
            return;
        }

        log.info("检测到 Java 项目, 使用 JavaAstParser 对扫描结果的 structure 节点进行精准 AST 增强并缓存");
        ObjectMapper mapper = new ObjectMapper();
        ArrayNode controllers = mapper.createArrayNode();
        ArrayNode services = mapper.createArrayNode();
        ArrayNode repositories = mapper.createArrayNode();
        ArrayNode entities = mapper.createArrayNode();
        ArrayNode mappers = mapper.createArrayNode();
        ArrayNode configurations = mapper.createArrayNode();
        ArrayNode dbEntities = mapper.createArrayNode();
        ArrayNode apiRoutes = mapper.createArrayNode();
        AstParseStats astParseStats = new AstParseStats();

        try (Stream<Path> walk = Files.walk(repoDir.toPath(), 15)) {
            walk.filter(Files::isRegularFile)
                    .filter(p -> p.toString().endsWith(".java"))
                    .filter(p -> {
                        String rel = repoDir.toPath().relativize(p).toString();
                        return Arrays.stream(rel.split("[/\\\\]")).noneMatch(this::shouldSkip);
                    })
                    .forEach(javaFile -> {
                        String relPath = repoDir.toPath().relativize(javaFile).toString();
                        JavaAstParser.ParseResult res = javaAstParser.parseFile(javaFile, relPath, 0L);
                        astParseStats.record(relPath, res);
                        parsedAstMap.put(relPath, res);
                        res.controllers.forEach(item -> addJson(controllers, mapper, item));
                        res.services.forEach(item -> addJson(services, mapper, item));
                        res.repositories.forEach(item -> addJson(repositories, mapper, item));
                        res.entities.forEach(item -> addJson(entities, mapper, item));
                        res.mappers.forEach(item -> addJson(mappers, mapper, item));
                        res.configurations.forEach(item -> addJson(configurations, mapper, item));
                        res.dbEntities.forEach(item -> addJson(dbEntities, mapper, item));
                        res.apiRoutes.forEach(item -> addJson(apiRoutes, mapper, item));
                    });
        } catch (Exception e) {
            log.error("AST 增强 structure 失败", e);
            return;
        }
        if (parsedAstMap != null && !parsedAstMap.isEmpty()) {
            enrichInterfaceImplementationCallRelations(parsedAstMap);
        }

        if (scanResult.isObject()) {
            ObjectNode root = (ObjectNode) scanResult;
            root.set("java_ast_diagnostics", astParseStats.toJson(mapper));
            ObjectNode structure = mapper.createObjectNode();
            if (scanResult.has("structure") && scanResult.get("structure").has("directories")) {
                structure.set("directories", scanResult.get("structure").get("directories"));
            } else {
                ObjectNode defaultDirs = mapper.createObjectNode();
                defaultDirs.put("src_main", true);
                defaultDirs.put("src_test", true);
                defaultDirs.put("src_main_resources", true);
                defaultDirs.set("controller_dir", mapper.createArrayNode());
                defaultDirs.set("service_dir", mapper.createArrayNode());
                defaultDirs.set("repository_dir", mapper.createArrayNode());
                defaultDirs.set("mapper_dir", mapper.createArrayNode());
                defaultDirs.set("entity_dir", mapper.createArrayNode());
                defaultDirs.set("dto_dir", mapper.createArrayNode());
                defaultDirs.set("config_dir", mapper.createArrayNode());
                structure.set("directories", defaultDirs);
            }

            structure.set("controllers", controllers);
            structure.set("services", services);
            structure.set("repositories", repositories);
            structure.set("entities", entities);
            structure.set("mappers", mappers);
            structure.set("configurations", configurations);
            structure.set("db_entities", dbEntities);
            structure.set("api_routes", apiRoutes);
            structure.set("entry_points", mapper.createArrayNode());
            root.set("structure", structure);
            if (parsedAstMap != null && !parsedAstMap.isEmpty()) {
                replaceAstSymbolsAndRelations(mapper, root.withArray("symbols"), root.withArray("relations"), parsedAstMap);
                root.set("graph", buildAstGraph(mapper, parsedAstMap));
            }
        }
    }

    private boolean shouldSkip(String dirName) {
        return SKIP_DIRS.contains(dirName);
    }

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

    private void scanDirectory(File dir, int[] counters) {
        File[] files = dir.listFiles();
        if (files == null) {
            return;
        }
        for (File f : files) {
            if (f.isDirectory()) {
                if (shouldSkip(f.getName())) {
                    continue;
                }
                counters[1]++;
                scanDirectory(f, counters);
            } else {
                counters[0]++;
                String name = f.getName();
                if (name.endsWith(".java") || name.endsWith(".py") || name.endsWith(".go")
                        || name.endsWith(".rs") || name.endsWith(".ts") || name.endsWith(".js")) {
                    try {
                        counters[2] += (int) Files.lines(f.toPath()).count();
                    } catch (Exception ignored) {
                    }
                }
            }
        }
    }

    private void detectFramework(File repoDir, ObjectMapper mapper, ObjectNode root) {
        ObjectNode framework = mapper.createObjectNode();
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
                    String content = Files.readString(bf);
                    String relPath = repoDir.toPath().relativize(bf).toString();
                    if (fileName.equals("pom.xml") && content.contains("spring-boot")) {
                        framework.put("name", "Spring Boot");
                        framework.set("evidence", mapper.createArrayNode().add(relPath + ": spring-boot-starter"));
                        root.set("framework", framework);
                        return;
                    }
                    if ((fileName.equals("build.gradle") || fileName.equals("build.gradle.kts"))
                            && (content.contains("spring-boot") || content.contains("org.springframework.boot"))) {
                        framework.put("name", "Spring Boot");
                        framework.set("evidence", mapper.createArrayNode().add(relPath + ": spring-boot"));
                        root.set("framework", framework);
                        return;
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
                } catch (Exception ignored) {
                }
            }
        } catch (Exception e) {
            log.warn("递归搜索构建文件失败: {}", e.getMessage());
        }
        root.set("framework", framework);
    }

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

    private void detectStructure(File repoDir, ObjectMapper mapper, ObjectNode root,
                                 ArrayNode symbols, ArrayNode relations,
                                 Map<String, JavaAstParser.ParseResult> parsedAstMap) {
        AstParseStats astParseStats = new AstParseStats();
        ObjectNode structure = mapper.createObjectNode();
        ObjectNode dirs = mapper.createObjectNode();
        List<Path> srcMainPaths = findAllSrcMainDirs(repoDir);
        Path srcTestPath = findSrcTest(repoDir);

        boolean srcMain = !srcMainPaths.isEmpty();
        dirs.put("src_main", srcMain);
        dirs.put("src_test", srcTestPath != null);
        dirs.put("src_main_resources", srcMain && srcMainPaths.stream().anyMatch(p -> Files.exists(p.resolve("resources"))));

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
            Path resourcesBase = srcMainPath.resolve("resources");
            if (Files.isDirectory(resourcesBase)) {
                try (Stream<Path> walk = Files.walk(resourcesBase, 4)) {
                    walk.filter(Files::isDirectory).forEach(p -> {
                        String name = p.getFileName().toString().toLowerCase(Locale.ROOT);
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
                } catch (Exception ignored) {
                }
            }
        }

        dirs.set("controller_dir", toStringArray(controllerDirs, mapper));
        dirs.set("service_dir", toStringArray(serviceDirs, mapper));
        dirs.set("repository_dir", toStringArray(repositoryDirs, mapper));
        dirs.set("mapper_dir", toStringArray(mapperDirs, mapper));
        dirs.set("entity_dir", toStringArray(entityDirs, mapper));
        dirs.set("dto_dir", toStringArray(dtoDirs, mapper));
        dirs.set("config_dir", toStringArray(configDirs, mapper));

        ArrayNode controllers = mapper.createArrayNode();
        ArrayNode services = mapper.createArrayNode();
        ArrayNode repositories = mapper.createArrayNode();
        ArrayNode entities = mapper.createArrayNode();
        ArrayNode mappers = mapper.createArrayNode();
        ArrayNode configurations = mapper.createArrayNode();
        ArrayNode dbEntities = mapper.createArrayNode();
        ArrayNode apiRoutes = mapper.createArrayNode();

        scanJavaFiles(repoDir, srcMainPaths, mapper, controllers, services, repositories, entities,
                mappers, configurations, dbEntities, apiRoutes, symbols, relations, parsedAstMap, astParseStats);
        if (parsedAstMap != null && !parsedAstMap.isEmpty()) {
            enrichInterfaceImplementationCallRelations(parsedAstMap);
            replaceAstSymbolsAndRelations(mapper, symbols, relations, parsedAstMap);
        }

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
        root.set("java_ast_diagnostics", astParseStats.toJson(mapper));
    }

    private static class AstParseStats {
        private int totalFiles;
        private int parsedFiles;
        private final List<String> failedFilePaths = new ArrayList<>();

        void record(String relPath, JavaAstParser.ParseResult result) {
            totalFiles++;
            if (result != null && result.parseSucceeded) {
                parsedFiles++;
                return;
            }
            failedFilePaths.add(relPath);
        }

        ObjectNode toJson(ObjectMapper mapper) {
            ObjectNode diagnostics = mapper.createObjectNode();
            diagnostics.put("total_java_files", totalFiles);
            diagnostics.put("parsed_java_files", parsedFiles);
            diagnostics.put("failed_java_files", failedFilePaths.size());
            ArrayNode failedPaths = mapper.createArrayNode();
            failedFilePaths.forEach(failedPaths::add);
            diagnostics.set("failed_file_paths", failedPaths);
            diagnostics.put("status", failedFilePaths.isEmpty() ? "OK" : "PARTIAL");
            return diagnostics;
        }
    }

    private ArrayNode toStringArray(List<String> list, ObjectMapper mapper) {
        ArrayNode arr = mapper.createArrayNode();
        list.forEach(arr::add);
        return arr;
    }

    private void addJson(ArrayNode array, ObjectMapper mapper, Object value) {
        array.add(mapper.valueToTree(value));
    }

    private void replaceAstSymbolsAndRelations(ObjectMapper mapper,
                                               ArrayNode symbols,
                                               ArrayNode relations,
                                               Map<String, JavaAstParser.ParseResult> parsedAstMap) {
        symbols.removeAll();
        relations.removeAll();
        parsedAstMap.values().forEach(result -> {
            result.symbols.forEach(item -> addSymbolJson(symbols, mapper, item));
            result.relations.forEach(item -> addRelationJson(relations, mapper, item));
        });
    }

    private ObjectNode buildAstGraph(ObjectMapper mapper, Map<String, JavaAstParser.ParseResult> parsedAstMap) {
        ObjectNode graph = mapper.createObjectNode();
        ArrayNode nodes = mapper.createArrayNode();
        ArrayNode edges = mapper.createArrayNode();
        if (parsedAstMap == null || parsedAstMap.isEmpty()) {
            graph.set("nodes", nodes);
            graph.set("edges", edges);
            return graph;
        }

        Set<String> nodeIds = new LinkedHashSet<>();
        Set<String> edgeIds = new LinkedHashSet<>();
        parsedAstMap.values().forEach(result -> {
            result.symbols.forEach(symbol -> {
                String symbolId = symbol.getSymbolId();
                if (symbolId == null || symbolId.isBlank() || !nodeIds.add(symbolId)) {
                    return;
                }
                ObjectNode node = mapper.createObjectNode();
                node.put("id", symbolId);
                node.put("label", nullToEmpty(symbol.getName()));
                node.put("kind", nullToEmpty(symbol.getKind()));
                node.put("file_path", nullToEmpty(symbol.getFilePath()));
                node.put("line_number", symbol.getLineNumber() == null ? 0 : symbol.getLineNumber());
                nodes.add(node);
            });
            result.relations.forEach(relation -> {
                String sourceId = relation.getSourceId();
                String targetId = relation.getTargetId();
                if (sourceId == null || sourceId.isBlank() || targetId == null || targetId.isBlank()) {
                    return;
                }
                String type = nullToEmpty(relation.getRelationType());
                String edgeId = sourceId + "|" + targetId + "|" + type;
                if (!edgeIds.add(edgeId)) {
                    return;
                }
                ObjectNode edge = mapper.createObjectNode();
                edge.put("source", sourceId);
                edge.put("target", targetId);
                edge.put("type", type);
                edge.put("file_path", nullToEmpty(relation.getFilePath()));
                edge.put("line_number", relation.getLineNumber() == null ? 0 : relation.getLineNumber());
                edges.add(edge);
            });
        });
        graph.set("nodes", nodes);
        graph.set("edges", edges);
        return graph;
    }

    private void addSymbolJson(ArrayNode array, ObjectMapper mapper, CodeSymbol symbol) {
        ObjectNode node = mapper.createObjectNode();
        node.put("symbol_id", nullToEmpty(symbol.getSymbolId()));
        node.put("name", nullToEmpty(symbol.getName()));
        node.put("kind", nullToEmpty(symbol.getKind()));
        node.put("package", nullToEmpty(symbol.getPackage_()));
        node.put("file_path", nullToEmpty(symbol.getFilePath()));
        node.put("line_number", symbol.getLineNumber() == null ? 0 : symbol.getLineNumber());
        if (symbol.getEndLine() != null) {
            node.put("end_line", symbol.getEndLine());
        }
        if (symbol.getReturnType() != null) {
            node.put("return_type", symbol.getReturnType());
        }
        if (symbol.getParentClass() != null) {
            node.put("parent_class", symbol.getParentClass());
        }
        array.add(node);
    }

    private void addRelationJson(ArrayNode array, ObjectMapper mapper, CodeRelationEntity relation) {
        ObjectNode node = mapper.createObjectNode();
        node.put("source_id", nullToEmpty(relation.getSourceId()));
        node.put("target_id", nullToEmpty(relation.getTargetId()));
        node.put("relation_type", nullToEmpty(relation.getRelationType()));
        node.put("file_path", nullToEmpty(relation.getFilePath()));
        node.put("line_number", relation.getLineNumber() == null ? 0 : relation.getLineNumber());
        array.add(node);
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private void enrichInterfaceImplementationCallRelations(Map<String, JavaAstParser.ParseResult> parsedAstMap) {
        Map<String, List<String>> implementationsByInterface = new LinkedHashMap<>();
        Set<String> methodSymbols = new LinkedHashSet<>();
        Set<String> relationKeys = new LinkedHashSet<>();

        parsedAstMap.values().forEach(result -> {
            result.symbols.stream()
                    .filter(symbol -> "METHOD".equals(symbol.getKind()))
                    .map(CodeSymbol::getSymbolId)
                    .filter(Objects::nonNull)
                    .forEach(methodSymbols::add);
            result.relations.forEach(relation -> {
                relationKeys.add(relationKey(relation));
                if ("IMPLEMENTS".equals(relation.getRelationType())
                        && relation.getSourceId() != null
                        && relation.getTargetId() != null) {
                    implementationsByInterface
                            .computeIfAbsent(relation.getTargetId(), ignored -> new ArrayList<>())
                            .add(relation.getSourceId());
                }
            });
        });

        parsedAstMap.values().forEach(result -> {
            List<CodeRelationEntity> additions = new ArrayList<>();
            for (CodeRelationEntity relation : result.relations) {
                if (!"CALLS".equals(relation.getRelationType()) || relation.getTargetId() == null) {
                    continue;
                }
                String targetClassId = methodSymbolToClassId(relation.getTargetId());
                if (targetClassId == null) {
                    continue;
                }
                List<String> implementations = implementationsByInterface.getOrDefault(targetClassId, List.of())
                        .stream()
                        .distinct()
                        .toList();
                if (implementations.size() != 1) {
                    continue;
                }
                String methodName = methodSymbolToMethodName(relation.getTargetId());
                if (methodName == null) {
                    continue;
                }
                String implementationTargetId = classIdToMethodSymbolId(implementations.get(0), methodName);
                if (!methodSymbols.contains(implementationTargetId)) {
                    continue;
                }
                CodeRelationEntity implementationCall = CodeRelationEntity.builder()
                        .scanTaskId(relation.getScanTaskId())
                        .sourceId(relation.getSourceId())
                        .targetId(implementationTargetId)
                        .relationType("CALLS")
                        .filePath(relation.getFilePath())
                        .lineNumber(relation.getLineNumber())
                        .build();
                String key = relationKey(implementationCall);
                if (relationKeys.add(key)) {
                    additions.add(implementationCall);
                }
            }
            result.relations.addAll(additions);
        });
    }

    private String relationKey(CodeRelationEntity relation) {
        return String.join("|",
                relation.getSourceId() == null ? "" : relation.getSourceId(),
                relation.getTargetId() == null ? "" : relation.getTargetId(),
                relation.getRelationType() == null ? "" : relation.getRelationType());
    }

    private String methodSymbolToClassId(String methodSymbolId) {
        int hash = methodSymbolId == null ? -1 : methodSymbolId.lastIndexOf('#');
        if (hash <= 0) {
            return null;
        }
        String classPart = methodSymbolId.substring(0, hash);
        int classDot = classPart.lastIndexOf('.');
        if (classDot <= 0) {
            return "#" + classPart;
        }
        return classPart.substring(0, classDot) + "#" + classPart.substring(classDot + 1);
    }

    private String methodSymbolToMethodName(String methodSymbolId) {
        int hash = methodSymbolId == null ? -1 : methodSymbolId.lastIndexOf('#');
        if (hash < 0 || hash + 1 >= methodSymbolId.length()) {
            return null;
        }
        String method = methodSymbolId.substring(hash + 1);
        if (method.endsWith("()")) {
            method = method.substring(0, method.length() - 2);
        }
        return method.isBlank() ? null : method;
    }

    private String classIdToMethodSymbolId(String classId, String methodName) {
        int separator = classId == null ? -1 : classId.lastIndexOf('#');
        if (separator < 0) {
            return (classId == null ? "" : classId) + "#" + methodName + "()";
        }
        return classId.substring(0, separator) + "." + classId.substring(separator + 1) + "#" + methodName + "()";
    }

    private void scanDirectoryNames(Path javaBase, Path repoRoot,
                                    List<String> controllerDirs, List<String> serviceDirs,
                                    List<String> repositoryDirs, List<String> mapperDirs,
                                    List<String> entityDirs, List<String> dtoDirs,
                                    List<String> configDirs) {
        try (Stream<Path> walk = Files.walk(javaBase, 8)) {
            walk.filter(Files::isDirectory).forEach(p -> {
                String name = p.getFileName().toString().toLowerCase(Locale.ROOT);
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

    private void scanJavaFiles(File repoDir, List<Path> srcMainPaths, ObjectMapper mapper,
                               ArrayNode controllers, ArrayNode services, ArrayNode repositories,
                               ArrayNode entities, ArrayNode mappers, ArrayNode configurations,
                               ArrayNode dbEntities, ArrayNode apiRoutes,
                               ArrayNode symbols, ArrayNode relations,
                               Map<String, JavaAstParser.ParseResult> parsedAstMap,
                               AstParseStats astParseStats) {
        Set<String> processed = new HashSet<>();
        for (Path srcMain : srcMainPaths) {
            Path javaBase = srcMain.resolve("java");
            if (!Files.isDirectory(javaBase)) {
                continue;
            }
            try (Stream<Path> walk = Files.walk(javaBase, 15)) {
                walk.filter(Files::isRegularFile)
                        .filter(p -> p.toString().endsWith(".java"))
                        .forEach(javaFile -> {
                            try {
                                String absPath = javaFile.toAbsolutePath().toString();
                                if (!processed.add(absPath)) return;
                                String relPath = repoDir.toPath().relativize(javaFile).toString();
                                JavaAstParser.ParseResult res = javaAstParser.parseFile(javaFile, relPath, 0L);
                                astParseStats.record(relPath, res);
                                if (parsedAstMap != null) {
                                    parsedAstMap.put(relPath, res);
                                }
                                res.controllers.forEach(item -> addJson(controllers, mapper, item));
                                res.services.forEach(item -> addJson(services, mapper, item));
                                res.repositories.forEach(item -> addJson(repositories, mapper, item));
                                res.entities.forEach(item -> addJson(entities, mapper, item));
                                res.mappers.forEach(item -> addJson(mappers, mapper, item));
                                res.configurations.forEach(item -> addJson(configurations, mapper, item));
                                res.dbEntities.forEach(item -> addJson(dbEntities, mapper, item));
                                res.apiRoutes.forEach(item -> addJson(apiRoutes, mapper, item));
                                res.symbols.forEach(item -> addJson(symbols, mapper, item));
                                res.relations.forEach(item -> addJson(relations, mapper, item));
                            } catch (Exception ignored) {
                            }
                        });
            } catch (Exception e) {
                log.warn("扫描 Java 文件失败 ({}): {}", javaBase, e.getMessage());
            }
        }
    }
}
