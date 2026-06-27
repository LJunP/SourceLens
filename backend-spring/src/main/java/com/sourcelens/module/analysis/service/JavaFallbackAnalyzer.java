package com.sourcelens.module.analysis.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
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

        if (scanResult.isObject()) {
            ObjectNode root = (ObjectNode) scanResult;
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
                mappers, configurations, dbEntities, apiRoutes, symbols, relations, parsedAstMap);

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

    private ArrayNode toStringArray(List<String> list, ObjectMapper mapper) {
        ArrayNode arr = mapper.createArrayNode();
        list.forEach(arr::add);
        return arr;
    }

    private void addJson(ArrayNode array, ObjectMapper mapper, Object value) {
        array.add(mapper.valueToTree(value));
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
                               Map<String, JavaAstParser.ParseResult> parsedAstMap) {
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
