package com.sourcelens;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sourcelens.module.analysis.entity.CodeRelationEntity;
import com.sourcelens.module.analysis.service.AnalysisArtifactBuilder;
import com.sourcelens.module.analysis.service.ArchitectureRiskAnalyzer;
import com.sourcelens.module.analysis.service.JavaAstParser;
import com.sourcelens.module.analysis.service.JavaFallbackAnalyzer;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JavaFallbackAnalyzerTest {

    @TempDir
    Path tempDir;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void scan_shouldBuildFallbackScanResultForSpringProject() throws Exception {
        writeProject();
        JavaFallbackAnalyzer analyzer = new JavaFallbackAnalyzer(new JavaAstParser());
        Map<String, JavaAstParser.ParseResult> parsed = new HashMap<>();

        JsonNode result = analyzer.scan(tempDir.toString(), parsed);

        assertEquals("Spring Boot", result.path("framework").path("name").asText());
        assertEquals(2, result.path("file_tree").path("total_files").asInt());
        assertTrue(result.path("file_tree").path("total_lines").asInt() > 0);
        assertTrue(result.path("structure").path("directories").path("src_main").asBoolean());
        assertFalse(result.path("structure").path("directories").path("src_test").asBoolean());
        assertEquals(1, result.path("structure").path("controllers").size());
        assertEquals(1, result.path("structure").path("api_routes").size());
        assertEquals("OK", result.path("java_ast_diagnostics").path("status").asText());
        assertEquals(1, result.path("java_ast_diagnostics").path("total_java_files").asInt());
        assertEquals(1, result.path("java_ast_diagnostics").path("parsed_java_files").asInt());
        assertEquals(0, result.path("java_ast_diagnostics").path("failed_java_files").asInt());
        assertFalse(result.path("symbols").isEmpty());
        assertFalse(result.path("graph").path("nodes").isEmpty());
        assertDemoRoute(result.path("structure").path("api_routes").get(0));
        assertApiCatalogRoute(result);
        assertTrue(parsed.containsKey("src/main/java/com/example/DemoController.java"));
    }

    @Test
    void enrichJavaStructureWithAst_shouldReplaceStructureForJavaScanResult() throws Exception {
        writeProject();
        JavaFallbackAnalyzer analyzer = new JavaFallbackAnalyzer(new JavaAstParser());
        Map<String, JavaAstParser.ParseResult> parsed = new HashMap<>();
        ObjectNode result = objectMapper.createObjectNode();
        result.put("scan_result_schema_version", 2);
        result.put("language", "Java");
        result.set("symbols", objectMapper.createArrayNode());
        result.set("relations", objectMapper.createArrayNode());
        ObjectNode graph = objectMapper.createObjectNode();
        graph.set("nodes", objectMapper.createArrayNode());
        graph.set("edges", objectMapper.createArrayNode());
        result.set("graph", graph);

        analyzer.enrichJavaStructureWithAst(result, tempDir.toString(), parsed);

        assertEquals(1, result.path("structure").path("controllers").size());
        assertEquals(1, result.path("structure").path("api_routes").size());
        assertEquals("OK", result.path("java_ast_diagnostics").path("status").asText());
        assertEquals(1, result.path("java_ast_diagnostics").path("total_java_files").asInt());
        assertEquals(1, result.path("java_ast_diagnostics").path("parsed_java_files").asInt());
        assertEquals(0, result.path("java_ast_diagnostics").path("failed_java_files").asInt());
        assertFalse(result.path("symbols").isEmpty());
        assertFalse(result.path("graph").path("nodes").isEmpty());
        assertEquals("src/main/java/com/example/DemoController.java",
                result.path("symbols").get(0).path("file_path").asText());
        assertDemoRoute(result.path("structure").path("api_routes").get(0));
        assertApiCatalogRoute(result);
        assertTrue(parsed.containsKey("src/main/java/com/example/DemoController.java"));
    }

    @Test
    void scan_shouldExposePartialJavaAstDiagnosticsWhenAFileCannotBeParsed() throws Exception {
        writeProject();
        Path broken = tempDir.resolve("src/main/java/com/example/BrokenController.java");
        Files.writeString(broken, """
                package com.example;

                public class BrokenController {
                    public void broken( {
                    }
                }
                """);
        JavaFallbackAnalyzer analyzer = new JavaFallbackAnalyzer(new JavaAstParser());
        Map<String, JavaAstParser.ParseResult> parsed = new HashMap<>();

        JsonNode result = analyzer.scan(tempDir.toString(), parsed);

        JsonNode diagnostics = result.path("java_ast_diagnostics");
        assertEquals("PARTIAL", diagnostics.path("status").asText());
        assertEquals(2, diagnostics.path("total_java_files").asInt());
        assertEquals(1, diagnostics.path("parsed_java_files").asInt());
        assertEquals(1, diagnostics.path("failed_java_files").asInt());
        assertEquals("src/main/java/com/example/BrokenController.java",
                diagnostics.path("failed_file_paths").get(0).asText());
        assertTrue(parsed.containsKey("src/main/java/com/example/DemoController.java"));
        assertTrue(parsed.containsKey("src/main/java/com/example/BrokenController.java"));
    }

    @Test
    void scan_shouldResolveInterfaceCallToSingleImplementationMethod() throws Exception {
        writeInterfaceImplementationProject();
        JavaFallbackAnalyzer analyzer = new JavaFallbackAnalyzer(new JavaAstParser());
        Map<String, JavaAstParser.ParseResult> parsed = new HashMap<>();

        JsonNode result = analyzer.scan(tempDir.toString(), parsed);

        String source = "com.example.order.OrderController#list()";
        String interfaceTarget = "com.example.order.OrderService#findOrders()";
        String implementationTarget = "com.example.order.OrderServiceImpl#findOrders()";
        assertTrue(hasJsonRelation(result.path("relations"), source, interfaceTarget, "CALLS"),
                "scan result should retain the interface method CALLS relation");
        assertTrue(hasJsonRelation(result.path("relations"), source, implementationTarget, "CALLS"),
                "scan result should add a CALLS relation to the unique implementation method");
        assertFalse(result.path("graph").path("edges").isEmpty(),
                "scan result graph should include AST relation edges when relations exist");
        assertTrue(parsed.values().stream().flatMap(item -> item.relations.stream())
                        .anyMatch(relation -> relationMatches(relation, source, implementationTarget, "CALLS")),
                "parsed AST cache should include the implementation CALLS relation for persistence");
    }

    @Test
    void scan_shouldNotGuessImplementationWhenInterfaceHasMultipleImplementations() throws Exception {
        writeInterfaceImplementationProject();
        Path backupImplementation = tempDir.resolve("src/main/java/com/example/order/BackupOrderServiceImpl.java");
        Files.writeString(backupImplementation, """
                package com.example.order;

                import org.springframework.stereotype.Service;

                @Service
                public class BackupOrderServiceImpl implements OrderService {
                    public String findOrders() {
                        return "backup";
                    }
                }
                """);
        JavaFallbackAnalyzer analyzer = new JavaFallbackAnalyzer(new JavaAstParser());
        Map<String, JavaAstParser.ParseResult> parsed = new HashMap<>();

        JsonNode result = analyzer.scan(tempDir.toString(), parsed);

        String source = "com.example.order.OrderController#list()";
        assertTrue(hasJsonRelation(result.path("relations"), source, "com.example.order.OrderService#findOrders()", "CALLS"),
                "scan result should still retain the interface method CALLS relation");
        assertFalse(hasJsonRelation(result.path("relations"), source, "com.example.order.OrderServiceImpl#findOrders()", "CALLS"),
                "ambiguous implementations must not be guessed as concrete CALLS targets");
        assertFalse(hasJsonRelation(result.path("relations"), source, "com.example.order.BackupOrderServiceImpl#findOrders()", "CALLS"),
                "ambiguous backup implementation must not be guessed as concrete CALLS target");
    }


    private void assertDemoRoute(JsonNode route) {
        assertTrue(route.isObject(), "api route should be serialized as an object");
        assertEquals("GET", route.path("method").asText());
        assertEquals("/demo", route.path("path").asText());
        assertEquals("DemoController", route.path("handler_class").asText());
        assertEquals("demo", route.path("handler_method").asText());
    }

    private void assertApiCatalogRoute(JsonNode scanResult) {
        AnalysisArtifactBuilder builder = new AnalysisArtifactBuilder(new ArchitectureRiskAnalyzer());
        Map<String, Object> apiCatalog = builder.build("API_CATALOG", scanResult);
        List<?> routes = (List<?>) apiCatalog.get("routes");
        assertTrue(routes.get(0) instanceof Map<?, ?>, "api catalog route should not be null");
        assertEquals("GET", ((Map<?, ?>) routes.get(0)).get("method"));
        assertEquals("/demo", ((Map<?, ?>) routes.get(0)).get("path"));
    }

    private boolean hasJsonRelation(JsonNode relations, String sourceId, String targetId, String relationType) {
        for (JsonNode relation : relations) {
            if (sourceId.equals(relation.path("sourceId").asText(relation.path("source_id").asText()))
                    && targetId.equals(relation.path("targetId").asText(relation.path("target_id").asText()))
                    && relationType.equals(relation.path("relationType").asText(relation.path("relation_type").asText()))) {
                return true;
            }
        }
        return false;
    }

    private boolean relationMatches(CodeRelationEntity relation, String sourceId, String targetId, String relationType) {
        return sourceId.equals(relation.getSourceId())
                && targetId.equals(relation.getTargetId())
                && relationType.equals(relation.getRelationType());
    }

    private void writeProject() throws Exception {
        Files.writeString(tempDir.resolve("pom.xml"), """
                <project>
                  <dependencies>
                    <dependency>
                      <artifactId>spring-boot-starter-web</artifactId>
                    </dependency>
                  </dependencies>
                </project>
                """);
        Path javaFile = tempDir.resolve("src/main/java/com/example/DemoController.java");
        Files.createDirectories(javaFile.getParent());
        Files.writeString(javaFile, """
                package com.example;

                import org.springframework.web.bind.annotation.GetMapping;
                import org.springframework.web.bind.annotation.RestController;

                @RestController
                public class DemoController {
                    @GetMapping("/demo")
                    public String demo() {
                        return "ok";
                    }
                }
                """);
    }

    private void writeInterfaceImplementationProject() throws Exception {
        Files.writeString(tempDir.resolve("pom.xml"), """
                <project>
                  <dependencies>
                    <dependency>
                      <artifactId>spring-boot-starter-web</artifactId>
                    </dependency>
                  </dependencies>
                </project>
                """);
        Path controller = tempDir.resolve("src/main/java/com/example/order/OrderController.java");
        Path service = tempDir.resolve("src/main/java/com/example/order/OrderService.java");
        Path implementation = tempDir.resolve("src/main/java/com/example/order/OrderServiceImpl.java");
        Files.createDirectories(controller.getParent());
        Files.writeString(controller, """
                package com.example.order;

                import org.springframework.beans.factory.annotation.Autowired;
                import org.springframework.web.bind.annotation.GetMapping;
                import org.springframework.web.bind.annotation.RestController;

                @RestController
                public class OrderController {
                    @Autowired
                    private OrderService orderService;

                    @GetMapping("/orders")
                    public String list() {
                        orderService.findOrders();
                        return "ok";
                    }
                }
                """);
        Files.writeString(service, """
                package com.example.order;

                public interface OrderService {
                    String findOrders();
                }
                """);
        Files.writeString(implementation, """
                package com.example.order;

                import org.springframework.stereotype.Service;

                @Service
                public class OrderServiceImpl implements OrderService {
                    public String findOrders() {
                        return "orders";
                    }
                }
                """);
    }
}
