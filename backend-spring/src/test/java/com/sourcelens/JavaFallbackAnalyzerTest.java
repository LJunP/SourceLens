package com.sourcelens;

import com.fasterxml.jackson.databind.JsonNode;
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
        assertDemoRoute(result.path("structure").path("api_routes").get(0));
        assertApiCatalogRoute(result);
        assertTrue(parsed.containsKey("src/main/java/com/example/DemoController.java"));
    }

    @Test
    void enrichJavaStructureWithAst_shouldReplaceStructureForJavaScanResult() throws Exception {
        writeProject();
        JavaFallbackAnalyzer analyzer = new JavaFallbackAnalyzer(new JavaAstParser());
        Map<String, JavaAstParser.ParseResult> parsed = new HashMap<>();
        JsonNode result = analyzer.scan(tempDir.toString(), new HashMap<>());

        analyzer.enrichJavaStructureWithAst(result, tempDir.toString(), parsed);

        assertEquals(1, result.path("structure").path("controllers").size());
        assertEquals(1, result.path("structure").path("api_routes").size());
        assertDemoRoute(result.path("structure").path("api_routes").get(0));
        assertApiCatalogRoute(result);
        assertTrue(parsed.containsKey("src/main/java/com/example/DemoController.java"));
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
}
