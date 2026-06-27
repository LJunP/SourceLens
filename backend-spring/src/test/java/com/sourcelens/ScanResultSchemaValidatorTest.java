package com.sourcelens;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sourcelens.module.analysis.ScanResultSchemaValidator;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ScanResultSchemaValidatorTest {

    private final ScanResultSchemaValidator validator = new ScanResultSchemaValidator();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void validate_shouldAcceptCurrentSchemaVersion() throws Exception {
        assertDoesNotThrow(() -> validator.validate(objectMapper.readTree("""
                {"scan_result_schema_version": 2}
                """)));
    }

    @Test
    void validate_shouldAcceptPreviousSchemaVersion() throws Exception {
        assertDoesNotThrow(() -> validator.validate(objectMapper.readTree("""
                {"scan_result_schema_version": 1}
                """)));
    }

    @Test
    void validate_shouldAcceptLegacyMissingVersion() throws Exception {
        assertDoesNotThrow(() -> validator.validate(objectMapper.readTree("""
                {"repo_path": "/tmp/repo"}
                """)));
    }

    @Test
    void validate_shouldAcceptObjectItemsInStructureArrays() throws Exception {
        assertDoesNotThrow(() -> validator.validate(objectMapper.readTree("""
                {
                  "scan_result_schema_version": 2,
                  "file_tree": {
                    "total_files": 2,
                    "total_dirs": 1,
                    "total_lines": 120,
                    "test_files": [],
                    "large_files": [],
                    "generated_files": [],
                    "file_manifest": [
                      {"path": "src/main/java/Demo.java", "is_binary": false}
                    ]
                  },
                  "framework": {
                    "name": "Spring Boot",
                    "evidence": ["pom.xml"]
                  },
                  "structure": {
                    "directories": {
                      "src_main": true,
                      "src_test": false,
                      "src_main_resources": true,
                      "controller_dir": ["src/main/java/app/controller"],
                      "service_dir": []
                    },
                    "api_routes": [
                      {
                        "method": "GET",
                        "path": "/demo",
                        "handler_class": "DemoController",
                        "handler_method": "demo"
                      }
                    ],
                    "entities": [{"name": "DemoEntity"}]
                  },
                  "symbols": [{"symbol_id": "Demo#demo"}],
                  "relations": [],
                  "code_quality": {
                    "total_classes": 1,
                    "total_methods": 2,
                    "avg_methods_per_class": 2.0
                  },
                  "graph": {
                    "nodes": [{"id": "Demo#demo"}],
                    "edges": []
                  }
                }
                """)));
    }

    @Test
    void validate_shouldRejectMalformedKnownSections() throws Exception {
        assertThrows(IllegalArgumentException.class, () -> validator.validate(objectMapper.readTree("""
                {
                  "scan_result_schema_version": 2,
                  "file_tree": {
                    "total_files": "2"
                  }
                }
                """)));
        assertThrows(IllegalArgumentException.class, () -> validator.validate(objectMapper.readTree("""
                {
                  "scan_result_schema_version": 2,
                  "file_tree": {
                    "file_manifest": ["src/main/java/Demo.java"]
                  }
                }
                """)));
        assertThrows(IllegalArgumentException.class, () -> validator.validate(objectMapper.readTree("""
                {
                  "scan_result_schema_version": 2,
                  "framework": {
                    "evidence": {"path": "pom.xml"}
                  }
                }
                """)));
        assertThrows(IllegalArgumentException.class, () -> validator.validate(objectMapper.readTree("""
                {
                  "scan_result_schema_version": 2,
                  "structure": {
                    "directories": {
                      "src_main": "true"
                    }
                  }
                }
                """)));
    }

    @Test
    void validate_shouldRejectNullItemsInStructureArrays() throws Exception {
        assertThrows(IllegalArgumentException.class, () -> validator.validate(objectMapper.readTree("""
                {
                  "scan_result_schema_version": 2,
                  "structure": {
                    "api_routes": [null]
                  }
                }
                """)));
    }

    @Test
    void validate_shouldRejectPojoItemsBeforeArtifactPersistence() {
        ObjectNode root = objectMapper.createObjectNode();
        root.put("scan_result_schema_version", 2);
        ObjectNode structure = objectMapper.createObjectNode();
        ArrayNode routes = objectMapper.createArrayNode();
        routes.addPOJO(Map.of("method", "GET", "path", "/demo"));
        structure.set("api_routes", routes);
        root.set("structure", structure);

        assertThrows(IllegalArgumentException.class, () -> validator.validate(root));
    }

    @Test
    void validate_shouldRejectFutureSchemaVersion() throws Exception {
        assertThrows(IllegalArgumentException.class, () -> validator.validate(objectMapper.readTree("""
                {"scan_result_schema_version": 999}
                """)));
    }

    @Test
    void validate_shouldRejectNonIntegerSchemaVersion() throws Exception {
        assertThrows(IllegalArgumentException.class, () -> validator.validate(objectMapper.readTree("""
                {"scan_result_schema_version": "1"}
                """)));
    }
}
