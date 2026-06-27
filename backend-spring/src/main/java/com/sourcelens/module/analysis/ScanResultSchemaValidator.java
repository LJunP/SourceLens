package com.sourcelens.module.analysis;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
public class ScanResultSchemaValidator {

    static final int MIN_SUPPORTED_SCHEMA_VERSION = 1;
    static final int MAX_SUPPORTED_SCHEMA_VERSION = 2;
    private static final List<String> STRUCTURE_OBJECT_ARRAYS = List.of(
            "controllers",
            "services",
            "repositories",
            "entities",
            "mappers",
            "configurations",
            "api_routes",
            "db_entities"
    );
    private static final List<String> TOP_LEVEL_OBJECT_ARRAYS = List.of("symbols", "relations");
    private static final List<String> GRAPH_OBJECT_ARRAYS = List.of("nodes", "edges");
    private static final List<String> TOP_LEVEL_OBJECTS = List.of(
            "file_tree",
            "language_stats",
            "framework",
            "structure",
            "code_quality",
            "graph"
    );
    private static final List<String> FILE_TREE_NUMBER_FIELDS = List.of("total_files", "total_dirs", "total_lines");
    private static final List<String> FILE_TREE_ARRAY_FIELDS = List.of(
            "test_files",
            "large_files",
            "generated_files",
            "file_manifest"
    );
    private static final List<String> CODE_QUALITY_NUMBER_FIELDS = List.of(
            "total_classes",
            "total_methods",
            "avg_methods_per_class"
    );
    private static final List<String> STRUCTURE_DIRECTORY_ARRAYS = List.of(
            "controller_dir",
            "service_dir",
            "repository_dir",
            "mapper_dir",
            "entity_dir",
            "dto_dir",
            "config_dir"
    );
    private static final List<String> STRUCTURE_DIRECTORY_BOOLEANS = List.of(
            "src_main",
            "src_test",
            "src_main_resources"
    );

    public void validate(JsonNode scanResult) {
        if (scanResult == null || scanResult.isMissingNode() || scanResult.isNull()) {
            throw new IllegalArgumentException("Rust Analyzer 输出为空");
        }
        if (!scanResult.isObject()) {
            throw new IllegalArgumentException("Rust Analyzer 输出必须是 JSON object");
        }
        validateKnownSections(scanResult);
        JsonNode versionNode = scanResult.path("scan_result_schema_version");
        if (versionNode.isMissingNode() || versionNode.isNull()) {
            log.warn("Rust Analyzer 输出缺少 scan_result_schema_version, 将按 legacy schema 兼容解析");
            validateObjectArrays(scanResult.path("structure"), "structure", STRUCTURE_OBJECT_ARRAYS);
            validateObjectArrays(scanResult, "scanResult", TOP_LEVEL_OBJECT_ARRAYS);
            validateObjectArrays(scanResult.path("graph"), "graph", GRAPH_OBJECT_ARRAYS);
            return;
        }
        if (!versionNode.isInt()) {
            throw new IllegalArgumentException("scan_result_schema_version 必须是整数");
        }

        int version = versionNode.asInt();
        if (version < MIN_SUPPORTED_SCHEMA_VERSION) {
            throw new IllegalArgumentException("Rust Analyzer schema version 过旧: " + version);
        }
        if (version > MAX_SUPPORTED_SCHEMA_VERSION) {
            throw new IllegalArgumentException("Rust Analyzer schema version 超出后端支持范围: " + version
                    + ", supported=" + MAX_SUPPORTED_SCHEMA_VERSION);
        }
        validateObjectArrays(scanResult.path("structure"), "structure", STRUCTURE_OBJECT_ARRAYS);
        validateObjectArrays(scanResult, "scanResult", TOP_LEVEL_OBJECT_ARRAYS);
        validateObjectArrays(scanResult.path("graph"), "graph", GRAPH_OBJECT_ARRAYS);
    }

    private void validateKnownSections(JsonNode scanResult) {
        validateOptionalObjects(scanResult, "scanResult", TOP_LEVEL_OBJECTS);
        validateNumericFields(scanResult.path("file_tree"), "file_tree", FILE_TREE_NUMBER_FIELDS);
        validateArrayFields(scanResult.path("file_tree"), "file_tree", FILE_TREE_ARRAY_FIELDS);
        validateObjectArrayField(scanResult.path("file_tree"), "file_tree", "file_manifest");
        validateArrayFields(scanResult.path("framework"), "framework", List.of("evidence"));
        validateNumericFields(scanResult.path("code_quality"), "code_quality", CODE_QUALITY_NUMBER_FIELDS);
        JsonNode directories = scanResult.path("structure").path("directories");
        if (!directories.isMissingNode() && !directories.isNull()) {
            if (!directories.isObject()) {
                throw new IllegalArgumentException("structure.directories 必须是 JSON object");
            }
            validateArrayFields(directories, "structure.directories", STRUCTURE_DIRECTORY_ARRAYS);
            validateBooleanFields(directories, "structure.directories", STRUCTURE_DIRECTORY_BOOLEANS);
        }
    }

    private void validateObjectArrays(JsonNode parent, String parentName, List<String> fieldNames) {
        if (parent == null || parent.isMissingNode() || parent.isNull()) {
            return;
        }
        if (!parent.isObject()) {
            throw new IllegalArgumentException(parentName + " 必须是 JSON object");
        }
        for (String fieldName : fieldNames) {
            JsonNode array = parent.path(fieldName);
            if (array.isMissingNode() || array.isNull()) {
                continue;
            }
            if (!array.isArray()) {
                throw new IllegalArgumentException(parentName + "." + fieldName + " 必须是 JSON array");
            }
            for (int i = 0; i < array.size(); i++) {
                JsonNode item = array.get(i);
                if (!item.isObject()) {
                    throw new IllegalArgumentException(parentName + "." + fieldName
                            + "[" + i + "] 必须是 JSON object，当前类型=" + item.getNodeType());
                }
            }
        }
    }

    private void validateOptionalObjects(JsonNode parent, String parentName, List<String> fieldNames) {
        for (String fieldName : fieldNames) {
            JsonNode node = parent.path(fieldName);
            if (node.isMissingNode() || node.isNull()) {
                continue;
            }
            if (!node.isObject()) {
                throw new IllegalArgumentException(parentName + "." + fieldName + " 必须是 JSON object");
            }
        }
    }

    private void validateNumericFields(JsonNode parent, String parentName, List<String> fieldNames) {
        if (parent == null || parent.isMissingNode() || parent.isNull()) {
            return;
        }
        if (!parent.isObject()) {
            throw new IllegalArgumentException(parentName + " 必须是 JSON object");
        }
        for (String fieldName : fieldNames) {
            JsonNode node = parent.path(fieldName);
            if (node.isMissingNode() || node.isNull()) {
                continue;
            }
            if (!node.isNumber()) {
                throw new IllegalArgumentException(parentName + "." + fieldName + " 必须是 JSON number");
            }
        }
    }

    private void validateArrayFields(JsonNode parent, String parentName, List<String> fieldNames) {
        if (parent == null || parent.isMissingNode() || parent.isNull()) {
            return;
        }
        if (!parent.isObject()) {
            throw new IllegalArgumentException(parentName + " 必须是 JSON object");
        }
        for (String fieldName : fieldNames) {
            JsonNode node = parent.path(fieldName);
            if (node.isMissingNode() || node.isNull()) {
                continue;
            }
            if (!node.isArray()) {
                throw new IllegalArgumentException(parentName + "." + fieldName + " 必须是 JSON array");
            }
        }
    }

    private void validateBooleanFields(JsonNode parent, String parentName, List<String> fieldNames) {
        for (String fieldName : fieldNames) {
            JsonNode node = parent.path(fieldName);
            if (node.isMissingNode() || node.isNull()) {
                continue;
            }
            if (!node.isBoolean()) {
                throw new IllegalArgumentException(parentName + "." + fieldName + " 必须是 JSON boolean");
            }
        }
    }

    private void validateObjectArrayField(JsonNode parent, String parentName, String fieldName) {
        if (parent == null || parent.isMissingNode() || parent.isNull()) {
            return;
        }
        JsonNode array = parent.path(fieldName);
        if (array.isMissingNode() || array.isNull()) {
            return;
        }
        for (int i = 0; i < array.size(); i++) {
            JsonNode item = array.get(i);
            if (!item.isObject()) {
                throw new IllegalArgumentException(parentName + "." + fieldName
                        + "[" + i + "] 必须是 JSON object，当前类型=" + item.getNodeType());
            }
        }
    }
}
