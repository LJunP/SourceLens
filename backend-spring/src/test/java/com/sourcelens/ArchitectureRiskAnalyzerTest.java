package com.sourcelens;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sourcelens.module.analysis.service.ArchitectureRiskAnalyzer;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertTrue;

class ArchitectureRiskAnalyzerTest {

    private final ArchitectureRiskAnalyzer analyzer = new ArchitectureRiskAnalyzer();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void buildRisks_shouldMergeScannerRisksAndArchitectureRules() throws Exception {
        JsonNode scan = highRiskScan();

        List<Map<String, Object>> risks = analyzer.buildRisks(scan);

        assertTrue(hasEntry(risks, "category", "EXISTING", "severity", "LOW"));
        assertTrue(hasEntry(risks, "category", "TEST_COVERAGE", "severity", "HIGH"));
        assertTrue(hasEntry(risks, "category", "MAINTAINABILITY", "severity", "MEDIUM"));
        assertTrue(hasEntry(risks, "category", "COMPLEXITY", "severity", "HIGH"));
        assertTrue(hasEntry(risks, "category", "ARCHITECTURE_LAYERING", "severity", "HIGH"));
        assertTrue(hasEntry(risks, "category", "API_REGRESSION", "severity", "HIGH"));
    }

    @Test
    void assessTechnicalDebt_shouldReportActionableDebtItems() throws Exception {
        JsonNode scan = highRiskScan();

        List<Map<String, Object>> debts = analyzer.assessTechnicalDebt(scan);

        assertTrue(hasEntry(debts, "category", "测试覆盖不足", "severity", "HIGH"));
        assertTrue(hasEntry(debts, "category", "大文件", "severity", "MEDIUM"));
        assertTrue(hasEntry(debts, "category", "类职责过重", "severity", "MEDIUM"));
        assertTrue(hasEntry(debts, "category", "分层缺失", "severity", "HIGH"));
    }

    @Test
    void generateSuggestions_shouldPrioritizeMissingTestsAndLayering() throws Exception {
        JsonNode scan = highRiskScan();

        List<String> suggestions = analyzer.generateSuggestions(scan);

        assertTrue(suggestions.contains("建议添加 src/test 目录并编写单元测试"));
        assertTrue(suggestions.contains("检测到 Controller 但未发现 Service 层, 建议添加业务逻辑分层"));
        assertTrue(suggestions.contains("当前无测试文件, 建议为核心模块添加单元测试"));
        assertTrue(suggestions.contains("API 数量较多但缺少测试, 建议优先补充 Controller 集成测试和契约测试"));
    }

    private JsonNode highRiskScan() throws Exception {
        return objectMapper.readTree("""
                {
                  "file_tree": {
                    "total_files": 60,
                    "total_dirs": 12,
                    "total_lines": 8000,
                    "test_files": [],
                    "large_files": [{"file_path": "src/main/java/app/GodController.java"}],
                    "generated_files": []
                  },
                  "structure": {
                    "directories": {
                      "src_main": true,
                      "src_test": false,
                      "src_main_resources": true,
                      "controller_dir": ["src/main/java/app/controller"],
                      "service_dir": [],
                      "repository_dir": [],
                      "mapper_dir": [],
                      "entity_dir": [],
                      "dto_dir": [],
                      "config_dir": []
                    },
                    "controllers": [{"class_name": "Controller1"}],
                    "services": [],
                    "repositories": [],
                    "entities": [],
                    "mappers": [],
                    "configurations": [],
                    "db_entities": [],
                    "api_routes": [
                      {"method": "GET", "path": "/a/1"}, {"method": "GET", "path": "/a/2"},
                      {"method": "GET", "path": "/a/3"}, {"method": "GET", "path": "/a/4"},
                      {"method": "GET", "path": "/a/5"}, {"method": "GET", "path": "/a/6"},
                      {"method": "GET", "path": "/a/7"}, {"method": "GET", "path": "/a/8"},
                      {"method": "GET", "path": "/a/9"}, {"method": "GET", "path": "/a/10"},
                      {"method": "GET", "path": "/a/11"}, {"method": "GET", "path": "/a/12"},
                      {"method": "GET", "path": "/a/13"}, {"method": "GET", "path": "/a/14"},
                      {"method": "GET", "path": "/a/15"}, {"method": "GET", "path": "/a/16"},
                      {"method": "GET", "path": "/a/17"}, {"method": "GET", "path": "/a/18"},
                      {"method": "GET", "path": "/a/19"}, {"method": "GET", "path": "/a/20"},
                      {"method": "GET", "path": "/a/21"}
                    ],
                    "entry_points": []
                  },
                  "code_quality": {
                    "total_classes": 8,
                    "total_methods": 180,
                    "avg_methods_per_class": 22.5,
                    "risks": [
                      {"category": "EXISTING", "severity": "LOW", "message": "existing analyzer risk"}
                    ]
                  }
                }
                """);
    }

    private boolean hasEntry(List<Map<String, Object>> entries,
                             String firstKey,
                             String firstValue,
                             String secondKey,
                             String secondValue) {
        return entries.stream().anyMatch(entry -> firstValue.equals(entry.get(firstKey))
                && secondValue.equals(entry.get(secondKey)));
    }
}
