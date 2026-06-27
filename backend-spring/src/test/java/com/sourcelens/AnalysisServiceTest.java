package com.sourcelens;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sourcelens.module.analysis.AnalyzerRunner;
import com.sourcelens.module.analysis.ScanResultSchemaValidator;
import com.sourcelens.module.analysis.mapper.ScanArtifactMapper;
import com.sourcelens.module.analysis.service.AnalysisArtifactBuilder;
import com.sourcelens.module.analysis.service.AnalysisArtifactPersistenceService;
import com.sourcelens.module.analysis.service.AnalysisService;
import com.sourcelens.module.analysis.service.CodeGraphPersistenceService;
import com.sourcelens.module.analysis.service.JavaFallbackAnalyzer;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AnalysisServiceTest {

    @Mock
    private ScanArtifactMapper scanArtifactMapper;

    @Mock
    private AnalyzerRunner analyzerRunner;

    @Mock
    private AnalysisArtifactBuilder artifactBuilder;

    @Mock
    private JavaFallbackAnalyzer javaFallbackAnalyzer;

    @Mock
    private CodeGraphPersistenceService codeGraphPersistenceService;

    @Mock
    private AnalysisArtifactPersistenceService artifactPersistenceService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void generateAnalysis_shouldRejectPojoRoutesBeforeSavingArtifacts() {
        ObjectNode scan = validScanResult();
        when(analyzerRunner.scan("/tmp/repo")).thenReturn(scan);
        doAnswer(invocation -> {
            ObjectNode result = invocation.getArgument(0);
            ObjectNode structure = (ObjectNode) result.path("structure");
            ArrayNode routes = objectMapper.createArrayNode();
            routes.addPOJO(Map.of("method", "GET", "path", "/demo"));
            structure.set("api_routes", routes);
            return null;
        }).when(javaFallbackAnalyzer).enrichJavaStructureWithAst(any(), anyString(), anyMap());

        AnalysisService service = new AnalysisService(
                scanArtifactMapper,
                analyzerRunner,
                artifactBuilder,
                javaFallbackAnalyzer,
                codeGraphPersistenceService,
                artifactPersistenceService,
                new ScanResultSchemaValidator());

        assertThrows(IllegalArgumentException.class, () -> service.generateAnalysis(31L, "/tmp/repo"));

        verify(artifactPersistenceService).cleanupScanArtifacts(31L);
        verify(artifactPersistenceService, never()).saveArtifact(anyLong(), anyString(), anyMap());
        verifyNoInteractions(artifactBuilder, codeGraphPersistenceService);
    }

    private ObjectNode validScanResult() {
        ObjectNode root = objectMapper.createObjectNode();
        root.put("scan_result_schema_version", 2);
        ObjectNode structure = objectMapper.createObjectNode();
        structure.set("api_routes", objectMapper.createArrayNode());
        structure.set("controllers", objectMapper.createArrayNode());
        structure.set("services", objectMapper.createArrayNode());
        structure.set("repositories", objectMapper.createArrayNode());
        structure.set("entities", objectMapper.createArrayNode());
        structure.set("mappers", objectMapper.createArrayNode());
        structure.set("configurations", objectMapper.createArrayNode());
        structure.set("db_entities", objectMapper.createArrayNode());
        root.set("structure", structure);
        root.set("symbols", objectMapper.createArrayNode());
        root.set("relations", objectMapper.createArrayNode());
        ObjectNode graph = objectMapper.createObjectNode();
        graph.set("nodes", objectMapper.createArrayNode());
        graph.set("edges", objectMapper.createArrayNode());
        root.set("graph", graph);
        return root;
    }
}
