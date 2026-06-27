package com.sourcelens.module.analysis.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.sourcelens.module.analysis.entity.CodeRelationEntity;
import com.sourcelens.module.analysis.entity.CodeSymbol;
import com.sourcelens.module.analysis.mapper.CodeRelationMapper;
import com.sourcelens.module.analysis.mapper.CodeSymbolMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CodeGraphPersistenceService {

    private static final int BATCH_SIZE = 500;

    private final CodeSymbolMapper codeSymbolMapper;
    private final CodeRelationMapper codeRelationMapper;

    public void saveSymbolsAndRelations(Long scanTaskId,
                                        JsonNode scan,
                                        Map<String, JavaAstParser.ParseResult> parsedAstMap) {
        List<CodeSymbol> symbols = collectScannedSymbols(scanTaskId, scan);
        List<CodeRelationEntity> relations = collectScannedRelations(scanTaskId, scan);
        int scannedSymbolCount = symbols.size();
        int scannedRelationCount = relations.size();
        ParsedAstCounts parsedAstCounts = collectParsedAst(scanTaskId, parsedAstMap, symbols, relations);

        insertSymbols(symbols);
        insertRelations(relations);

        log.info("保存 {} 个代码符号和 {} 个代码关系, scanTaskId={}",
                scannedSymbolCount, scannedRelationCount, scanTaskId);
        if (parsedAstCounts.hasData()) {
            log.info("重用 AST 缓存: 成功保存了 {} 个 Java 代码符号和 {} 个 Java 代码关系, scanTaskId={}",
                    parsedAstCounts.symbolCount(), parsedAstCounts.relationCount(), scanTaskId);
        }
    }

    private List<CodeSymbol> collectScannedSymbols(Long scanTaskId, JsonNode scan) {
        List<CodeSymbol> collected = new ArrayList<>();
        JsonNode symbols = scan.path("symbols");
        if (!symbols.isArray()) {
            return collected;
        }
        for (JsonNode sym : symbols) {
            String filePath = sym.path("file_path").asText("");
            if (filePath.endsWith(".java")) {
                continue;
            }
            collected.add(CodeSymbol.builder()
                    .scanTaskId(scanTaskId)
                    .symbolId(textValue(sym, "symbol_id"))
                    .name(textValue(sym, "name"))
                    .kind(textValue(sym, "kind"))
                    .package_(textValue(sym, "package"))
                    .filePath(filePath)
                    .lineNumber(sym.path("line_number").asInt(0))
                    .endLine(nullableInt(sym, "end_line"))
                    .returnType(nullableText(sym, "return_type"))
                    .parentClass(nullableText(sym, "parent_class"))
                    .build());
        }
        return collected;
    }

    private List<CodeRelationEntity> collectScannedRelations(Long scanTaskId, JsonNode scan) {
        List<CodeRelationEntity> collected = new ArrayList<>();
        JsonNode relations = scan.path("relations");
        if (!relations.isArray()) {
            return collected;
        }
        for (JsonNode rel : relations) {
            String filePath = rel.path("file_path").asText("");
            if (filePath.endsWith(".java")) {
                continue;
            }
            collected.add(CodeRelationEntity.builder()
                    .scanTaskId(scanTaskId)
                    .sourceId(textValue(rel, "source_id"))
                    .targetId(textValue(rel, "target_id"))
                    .relationType(textValue(rel, "relation_type"))
                    .filePath(filePath)
                    .lineNumber(rel.path("line_number").asInt(0))
                    .build());
        }
        return collected;
    }

    private ParsedAstCounts collectParsedAst(Long scanTaskId,
                                             Map<String, JavaAstParser.ParseResult> parsedAstMap,
                                             List<CodeSymbol> symbols,
                                             List<CodeRelationEntity> relations) {
        if (parsedAstMap == null || parsedAstMap.isEmpty()) {
            return new ParsedAstCounts(0, 0);
        }
        int symCount = 0;
        int relCount = 0;
        for (JavaAstParser.ParseResult res : parsedAstMap.values()) {
            for (CodeSymbol sym : res.symbols) {
                sym.setScanTaskId(scanTaskId);
                symbols.add(sym);
                symCount++;
            }
            for (CodeRelationEntity rel : res.relations) {
                rel.setScanTaskId(scanTaskId);
                relations.add(rel);
                relCount++;
            }
        }
        return new ParsedAstCounts(symCount, relCount);
    }

    private void insertSymbols(List<CodeSymbol> symbols) {
        for (int i = 0; i < symbols.size(); i += BATCH_SIZE) {
            int end = Math.min(i + BATCH_SIZE, symbols.size());
            codeSymbolMapper.insertBatch(symbols.subList(i, end));
        }
    }

    private void insertRelations(List<CodeRelationEntity> relations) {
        for (int i = 0; i < relations.size(); i += BATCH_SIZE) {
            int end = Math.min(i + BATCH_SIZE, relations.size());
            codeRelationMapper.insertBatch(relations.subList(i, end));
        }
    }

    private String textValue(JsonNode node, String field) {
        return node.path(field).asText("");
    }

    private String nullableText(JsonNode node, String field) {
        JsonNode value = node.path(field);
        return value.isMissingNode() || value.isNull() ? null : value.asText();
    }

    private Integer nullableInt(JsonNode node, String field) {
        JsonNode value = node.path(field);
        return value.isMissingNode() || value.isNull() ? null : value.asInt();
    }

    private record ParsedAstCounts(int symbolCount, int relationCount) {
        boolean hasData() {
            return symbolCount > 0 || relationCount > 0;
        }
    }
}
