package com.sourcelens;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sourcelens.module.analysis.entity.CodeRelationEntity;
import com.sourcelens.module.analysis.entity.CodeSymbol;
import com.sourcelens.module.analysis.mapper.CodeRelationMapper;
import com.sourcelens.module.analysis.mapper.CodeSymbolMapper;
import com.sourcelens.module.analysis.service.CodeGraphPersistenceService;
import com.sourcelens.module.analysis.service.JavaAstParser;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class CodeGraphPersistenceServiceTest {

    @Mock
    private CodeSymbolMapper codeSymbolMapper;

    @Mock
    private CodeRelationMapper codeRelationMapper;

    @InjectMocks
    private CodeGraphPersistenceService codeGraphPersistenceService;

    @TempDir
    Path tempDir;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void saveSymbolsAndRelations_shouldSkipJavaScanOutputAndPersistAstCache() throws Exception {
        JsonNode scan = objectMapper.readTree("""
                {
                  "symbols": [
                    {
                      "symbol_id": "py#main",
                      "name": "main",
                      "kind": "FUNCTION",
                      "package": "",
                      "file_path": "app.py",
                      "line_number": 3
                    },
                    {
                      "symbol_id": "java#Demo",
                      "name": "Demo",
                      "kind": "CLASS",
                      "package": "com.example",
                      "file_path": "src/main/java/Demo.java",
                      "line_number": 1
                    }
                  ],
                  "relations": [
                    {
                      "source_id": "py#main",
                      "target_id": "py#helper",
                      "relation_type": "CALLS",
                      "file_path": "app.py",
                      "line_number": 4
                    },
                    {
                      "source_id": "java#Demo",
                      "target_id": "java#Helper",
                      "relation_type": "DEPENDS_ON",
                      "file_path": "src/main/java/Demo.java",
                      "line_number": 2
                    }
                  ]
                }
                """);
        JavaAstParser.ParseResult ast = new JavaAstParser.ParseResult();
        ast.symbols.add(CodeSymbol.builder()
                .symbolId("com.example#Demo")
                .name("Demo")
                .kind("CLASS")
                .filePath("src/main/java/Demo.java")
                .build());
        ast.relations.add(CodeRelationEntity.builder()
                .sourceId("com.example#Demo")
                .targetId("com.example#Helper")
                .relationType("DEPENDS_ON")
                .filePath("src/main/java/Demo.java")
                .build());

        codeGraphPersistenceService.saveSymbolsAndRelations(42L, scan, Map.of("Demo.java", ast));

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<CodeSymbol>> symbolCaptor = ArgumentCaptor.forClass(List.class);
        verify(codeSymbolMapper).insertBatch(symbolCaptor.capture());
        verify(codeSymbolMapper, never()).insert(any(CodeSymbol.class));
        assertEquals(2, symbolCaptor.getValue().size());
        assertEquals("py#main", symbolCaptor.getValue().get(0).getSymbolId());
        assertEquals("com.example#Demo", symbolCaptor.getValue().get(1).getSymbolId());
        assertEquals(42L, symbolCaptor.getValue().get(1).getScanTaskId());

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<CodeRelationEntity>> relationCaptor = ArgumentCaptor.forClass(List.class);
        verify(codeRelationMapper).insertBatch(relationCaptor.capture());
        verify(codeRelationMapper, never()).insert(any(CodeRelationEntity.class));
        assertEquals(2, relationCaptor.getValue().size());
        assertEquals("py#main", relationCaptor.getValue().get(0).getSourceId());
        assertEquals("com.example#Demo", relationCaptor.getValue().get(1).getSourceId());
        assertEquals(42L, relationCaptor.getValue().get(1).getScanTaskId());
    }

    @Test
    void saveSymbolsAndRelations_shouldSplitLargeSymbolBatches() throws Exception {
        JsonNode scan = objectMapper.readTree("{}");
        JavaAstParser.ParseResult ast = new JavaAstParser.ParseResult();
        for (int i = 0; i < 501; i++) {
            ast.symbols.add(CodeSymbol.builder()
                    .symbolId("sym#" + i)
                    .name("Symbol" + i)
                    .kind("CLASS")
                    .filePath("src/main/java/Symbol" + i + ".java")
                    .build());
        }

        codeGraphPersistenceService.saveSymbolsAndRelations(42L, scan, Map.of("large.java", ast));

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<CodeSymbol>> symbolCaptor = ArgumentCaptor.forClass(List.class);
        verify(codeSymbolMapper, times(2)).insertBatch(symbolCaptor.capture());
        assertEquals(500, symbolCaptor.getAllValues().get(0).size());
        assertEquals(1, symbolCaptor.getAllValues().get(1).size());
        assertEquals(42L, symbolCaptor.getAllValues().get(1).get(0).getScanTaskId());
        verify(codeRelationMapper, never()).insertBatch(any());
    }

    @Test
    void saveSymbolsAndRelations_shouldPersistAstCallRelationsForCodeQaGraphConsumption() throws Exception {
        Path service = tempDir.resolve("OrderController.java");
        Files.writeString(service, """
                package com.example.order;

                import com.example.order.mapper.OrderMapper;
                import com.example.order.service.OrderService;

                public class OrderController {
                    private OrderService orderService;

                    public String list() {
                        orderService.findOrders();
                        helper();
                        OrderMapper.toDto("order");
                        return "ok";
                    }

                    private void helper() {
                    }
                }
                """);
        JavaAstParser.ParseResult ast = new JavaAstParser()
                .parseFile(service, "src/main/java/com/example/order/OrderController.java", 0L);

        codeGraphPersistenceService.saveSymbolsAndRelations(42L, objectMapper.readTree("{}"),
                Map.of("src/main/java/com/example/order/OrderController.java", ast));

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<CodeRelationEntity>> relationCaptor = ArgumentCaptor.forClass(List.class);
        verify(codeRelationMapper).insertBatch(relationCaptor.capture());
        List<CodeRelationEntity> relations = relationCaptor.getValue();
        assertTrue(relations.stream().allMatch(relation -> Long.valueOf(42L).equals(relation.getScanTaskId())),
                "persisted AST relations should inherit the scan task id");
        assertTrue(hasRelation(relations,
                        "com.example.order.OrderController#list()",
                        "com.example.order.service.OrderService#findOrders()",
                        "CALLS"),
                "scoped service CALLS should be persisted for graph consumers");
        assertTrue(hasRelation(relations,
                        "com.example.order.OrderController#list()",
                        "com.example.order.OrderController#helper()",
                        "CALLS"),
                "same-class helper CALLS should be persisted for graph consumers");
        assertTrue(hasRelation(relations,
                        "com.example.order.OrderController#list()",
                        "com.example.order.mapper.OrderMapper#toDto()",
                        "CALLS"),
                "imported project static class CALLS should be persisted for graph consumers");
    }

    private boolean hasRelation(List<CodeRelationEntity> relations, String sourceId, String targetId, String relationType) {
        return relations.stream().anyMatch(relation ->
                sourceId.equals(relation.getSourceId())
                        && targetId.equals(relation.getTargetId())
                        && relationType.equals(relation.getRelationType())
        );
    }
}
