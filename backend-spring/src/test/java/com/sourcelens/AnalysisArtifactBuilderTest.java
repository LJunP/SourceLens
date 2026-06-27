package com.sourcelens;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sourcelens.module.analysis.service.AnalysisArtifactBuilder;
import com.sourcelens.module.analysis.service.ArchitectureRiskAnalyzer;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AnalysisArtifactBuilderTest {

    private final AnalysisArtifactBuilder builder = new AnalysisArtifactBuilder(new ArchitectureRiskAnalyzer());
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void buildArtifacts_shouldBuildAllKnownArtifactTypes() throws Exception {
        JsonNode scan = sampleScan();

        Map<String, Map<String, Object>> artifacts = builder.buildArtifacts(scan);

        assertEquals(AnalysisArtifactBuilder.ARTIFACT_TYPES.size(), artifacts.size());
        assertTrue(artifacts.keySet().containsAll(AnalysisArtifactBuilder.ARTIFACT_TYPES));
        assertEquals("项目架构概览", artifacts.get("ARCHITECTURE_OVERVIEW").get("title"));
        assertEquals(12, artifacts.get("ARCHITECTURE_OVERVIEW").get("totalFiles"));
        assertEquals("API 接口目录", artifacts.get("API_CATALOG").get("title"));
        assertEquals(1, artifacts.get("API_CATALOG").get("totalEndpoints"));
        List<?> routes = (List<?>) artifacts.get("API_CATALOG").get("routes");
        assertTrue(routes.get(0) instanceof Map<?, ?>);
        assertEquals("GET", ((Map<?, ?>) routes.get(0)).get("method"));
        assertEquals("/demo", ((Map<?, ?>) routes.get(0)).get("path"));
    }

    @Test
    void buildArchitectureReport_shouldPreserveReportSections() throws Exception {
        JsonNode scan = sampleScan();

        Map<String, Object> report = builder.build("ARCHITECTURE_REPORT", scan);

        assertEquals("架构分析报告", report.get("title"));
        assertTrue(report.containsKey("overview"));
        assertTrue(report.containsKey("techStack"));
        assertTrue(report.containsKey("directories"));
        assertTrue(report.containsKey("modules"));
        assertTrue(report.containsKey("codeQuality"));
        assertTrue(report.containsKey("reportQuality"));
        Map<?, ?> scanFingerprint = (Map<?, ?>) report.get("scanFingerprint");
        assertEquals("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                scanFingerprint.get("repoContentHash"));
        assertEquals(2, scanFingerprint.get("manifestFiles"));
        assertEquals(1L, scanFingerprint.get("hashedFiles"));
        Map<?, ?> reportQuality = (Map<?, ?>) report.get("reportQuality");
        assertEquals("RISK", reportQuality.get("readiness"));
        assertEquals(1L, reportQuality.get("highRiskCount"));
        assertTrue((Integer) reportQuality.get("confidence") > 0);
        assertTrue(((List<?>) reportQuality.get("gaps")).contains("缺少测试文件证据"));
        List<?> evidenceChecks = (List<?>) reportQuality.get("evidenceChecks");
        assertEquals(6, evidenceChecks.size());
        assertTrue(hasEvidenceCheck(evidenceChecks, "fingerprint", "READY"));
        assertTrue(((List<?>) report.get("suggestions")).contains("当前无测试文件, 建议为核心模块添加单元测试"));
    }

    @Test
    void buildCodeMetrics_shouldIncludeScanFingerprintSummary() throws Exception {
        JsonNode scan = sampleScan();

        Map<String, Object> metrics = builder.build("CODE_METRICS", scan);

        Map<?, ?> scanFingerprint = (Map<?, ?>) metrics.get("scanFingerprint");
        assertEquals("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                scanFingerprint.get("repoContentHash"));
        assertEquals(2, scanFingerprint.get("manifestFiles"));
        assertEquals(1L, scanFingerprint.get("hashedFiles"));
        assertEquals(1L, scanFingerprint.get("binaryFiles"));
    }

    @Test
    void buildArchitectureReport_shouldAddActionableRisksAndDebt() throws Exception {
        JsonNode scan = highRiskScan();

        Map<String, Object> report = builder.build("ARCHITECTURE_REPORT", scan);

        Map<?, ?> codeQuality = (Map<?, ?>) report.get("codeQuality");
        List<?> risks = (List<?>) codeQuality.get("risks");
        List<?> debts = (List<?>) report.get("technicalDebt");
        List<?> suggestions = (List<?>) report.get("suggestions");

        assertTrue(hasRisk(risks, "TEST_COVERAGE", "HIGH"));
        assertTrue(hasRisk(risks, "ARCHITECTURE_LAYERING", "HIGH"));
        assertTrue(hasRisk(risks, "API_REGRESSION", "HIGH"));
        assertTrue(hasDebt(debts, "分层缺失", "HIGH"));
        assertTrue(suggestions.contains("API 数量较多但缺少测试, 建议优先补充 Controller 集成测试和契约测试"));
        Map<?, ?> reportQuality = (Map<?, ?>) report.get("reportQuality");
        assertEquals("RISK", reportQuality.get("readiness"));
        assertEquals(4L, reportQuality.get("highRiskCount"));
        assertTrue(hasEvidenceCheck((List<?>) reportQuality.get("evidenceChecks"), "risk_signal", "RISK"));
    }

    @Test
    void buildArchitectureReport_shouldExposeReadyReportQualityContract() throws Exception {
        JsonNode scan = readyScan();

        Map<String, Object> report = builder.build("ARCHITECTURE_REPORT", scan);

        Map<?, ?> reportQuality = (Map<?, ?>) report.get("reportQuality");
        assertEquals("READY", reportQuality.get("readiness"));
        assertTrue((Integer) reportQuality.get("confidence") >= 80);
        assertEquals(0L, reportQuality.get("highRiskCount"));
        assertTrue(((List<?>) reportQuality.get("gaps")).isEmpty());
        assertTrue(((List<?>) reportQuality.get("nextActions")).contains("进入 code_chunks 问答、依赖图谱复盘和自动修复候选筛选"));

        List<?> evidenceChecks = (List<?>) reportQuality.get("evidenceChecks");
        assertEquals(6, evidenceChecks.size());
        assertTrue(hasEvidenceCheck(evidenceChecks, "scan_scope", "READY"));
        assertTrue(hasEvidenceCheck(evidenceChecks, "test_signal", "READY"));
        assertTrue(hasEvidenceCheck(evidenceChecks, "module_map", "READY"));
        assertTrue(hasEvidenceCheck(evidenceChecks, "api_data_surface", "READY"));
        assertTrue(hasEvidenceCheck(evidenceChecks, "fingerprint", "READY"));
        assertTrue(hasEvidenceCheck(evidenceChecks, "risk_signal", "READY"));
        evidenceChecks.forEach(item -> assertCompleteEvidenceCheck((Map<?, ?>) item));
    }

    private JsonNode sampleScan() throws Exception {
        return objectMapper.readTree("""
                {
                  "file_tree": {
                    "total_files": 12,
                    "total_dirs": 4,
                    "total_lines": 380,
                    "repo_content_hash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                    "file_manifest": [
                      {
                        "path": "src/main/java/app/DemoController.java",
                        "language": "Java",
                        "size_bytes": 120,
                        "line_count": 20,
                        "content_hash_sha256": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
                        "is_test": false,
                        "is_generated": false,
                        "is_config": false,
                        "is_large": false,
                        "is_binary": false
                      },
                      {
                        "path": "assets/logo.png",
                        "language": "Other",
                        "size_bytes": 40,
                        "line_count": 0,
                        "content_hash_sha256": null,
                        "is_test": false,
                        "is_generated": false,
                        "is_config": false,
                        "is_large": false,
                        "is_binary": true
                      }
                    ],
                    "test_files": [],
                    "large_files": [],
                    "generated_files": []
                  },
                  "language_stats": {
                    "Java": { "file_count": 12, "line_count": 380 }
                  },
                  "framework": {
                    "name": "Spring Boot",
                    "version": "3",
                    "evidence": ["pom.xml"]
                  },
                  "structure": {
                    "directories": {
                      "src_main": true,
                      "src_test": false,
                      "src_main_resources": true,
                      "controller_dir": ["src/main/java/app/controller"],
                      "service_dir": ["src/main/java/app/service"],
                      "repository_dir": [],
                      "mapper_dir": [],
                      "entity_dir": [],
                      "dto_dir": [],
                      "config_dir": []
                    },
                    "controllers": [{"class_name": "DemoController"}],
                    "services": [{"class_name": "DemoService"}],
                    "repositories": [],
                    "entities": [],
                    "mappers": [],
                    "configurations": [],
                    "db_entities": [],
                    "api_routes": [{"method": "GET", "path": "/demo"}],
                    "entry_points": []
                  },
                  "code_quality": {
                    "total_classes": 2,
                    "total_methods": 6,
                    "avg_methods_per_class": 3.0,
                    "risks": []
                  }
                }
                """);
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
                  "language_stats": {
                    "Java": { "file_count": 60, "line_count": 8000 }
                  },
                  "framework": {
                    "name": "Spring Boot",
                    "version": "3",
                    "evidence": ["pom.xml"]
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

    private JsonNode readyScan() throws Exception {
        return objectMapper.readTree("""
                {
                  "file_tree": {
                    "total_files": 20,
                    "total_dirs": 6,
                    "total_lines": 1200,
                    "repo_content_hash": "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
                    "file_manifest": [
                      {
                        "path": "src/main/java/app/DemoController.java",
                        "language": "Java",
                        "size_bytes": 120,
                        "line_count": 20,
                        "content_hash_sha256": "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
                        "is_test": false,
                        "is_generated": false,
                        "is_config": false,
                        "is_large": false,
                        "is_binary": false
                      },
                      {
                        "path": "src/test/java/app/DemoControllerTest.java",
                        "language": "Java",
                        "size_bytes": 80,
                        "line_count": 18,
                        "content_hash_sha256": "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
                        "is_test": true,
                        "is_generated": false,
                        "is_config": false,
                        "is_large": false,
                        "is_binary": false
                      }
                    ],
                    "test_files": [
                      {"path": "src/test/java/app/DemoControllerTest.java"},
                      {"path": "src/test/java/app/DemoServiceTest.java"}
                    ],
                    "large_files": [],
                    "generated_files": []
                  },
                  "language_stats": {
                    "Java": { "file_count": 20, "line_count": 1200 }
                  },
                  "framework": {
                    "name": "Spring Boot",
                    "version": "3",
                    "evidence": ["pom.xml"]
                  },
                  "structure": {
                    "directories": {
                      "src_main": true,
                      "src_test": true,
                      "src_main_resources": true,
                      "controller_dir": ["src/main/java/app/controller"],
                      "service_dir": ["src/main/java/app/service"],
                      "repository_dir": ["src/main/java/app/repository"],
                      "mapper_dir": [],
                      "entity_dir": ["src/main/java/app/entity"],
                      "dto_dir": ["src/main/java/app/dto"],
                      "config_dir": ["src/main/java/app/config"]
                    },
                    "controllers": [{"class_name": "DemoController"}],
                    "services": [{"class_name": "DemoService"}],
                    "repositories": [{"class_name": "DemoRepository"}],
                    "entities": [{"class_name": "DemoEntity"}],
                    "mappers": [],
                    "configurations": [{"class_name": "DemoConfig"}],
                    "db_entities": [{"name": "demo"}],
                    "api_routes": [{"method": "GET", "path": "/demo"}],
                    "entry_points": []
                  },
                  "code_quality": {
                    "total_classes": 6,
                    "total_methods": 24,
                    "avg_methods_per_class": 4.0,
                    "risks": []
                  }
                }
                """);
    }

    private boolean hasRisk(List<?> risks, String category, String severity) {
        return risks.stream().anyMatch(item -> item instanceof Map<?, ?> risk
                && category.equals(risk.get("category"))
                && severity.equals(risk.get("severity")));
    }

    private boolean hasDebt(List<?> debts, String category, String severity) {
        return debts.stream().anyMatch(item -> item instanceof Map<?, ?> debt
                && category.equals(debt.get("category"))
                && severity.equals(debt.get("severity")));
    }

    private boolean hasEvidenceCheck(List<?> checks, String key, String status) {
        return checks.stream().anyMatch(item -> item instanceof Map<?, ?> check
                && key.equals(check.get("key"))
                && status.equals(check.get("status")));
    }

    private void assertCompleteEvidenceCheck(Map<?, ?> check) {
        assertNotNull(check.get("key"));
        assertNotNull(check.get("label"));
        assertNotNull(check.get("status"));
        assertNotNull(check.get("value"));
        assertNotNull(check.get("detail"));
    }
}
