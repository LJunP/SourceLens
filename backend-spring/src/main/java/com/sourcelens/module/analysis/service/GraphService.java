package com.sourcelens.module.analysis.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.sourcelens.module.analysis.entity.CodeRelationEntity;
import com.sourcelens.module.analysis.entity.CodeSymbol;
import com.sourcelens.module.analysis.mapper.CodeRelationMapper;
import com.sourcelens.module.analysis.mapper.CodeSymbolMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GraphService {

    private final CodeSymbolMapper symbolMapper;
    private final CodeRelationMapper relationMapper;

    /**
     * 获取扫描任务的所有符号
     */
    public List<CodeSymbol> listSymbols(Long scanTaskId, String kind) {
        LambdaQueryWrapper<CodeSymbol> wrapper = new LambdaQueryWrapper<CodeSymbol>()
                .eq(CodeSymbol::getScanTaskId, scanTaskId);
        if (kind != null && !kind.isEmpty()) {
            wrapper.eq(CodeSymbol::getKind, kind);
        }
        wrapper.orderByAsc(CodeSymbol::getKind).orderByAsc(CodeSymbol::getName);
        return symbolMapper.selectList(wrapper);
    }

    /**
     * 获取扫描任务的所有关系
     */
    public List<CodeRelationEntity> listRelations(Long scanTaskId, String relationType) {
        LambdaQueryWrapper<CodeRelationEntity> wrapper = new LambdaQueryWrapper<CodeRelationEntity>()
                .eq(CodeRelationEntity::getScanTaskId, scanTaskId);
        if (relationType != null && !relationType.isEmpty()) {
            wrapper.eq(CodeRelationEntity::getRelationType, relationType);
        }
        return relationMapper.selectList(wrapper);
    }

    /**
     * 获取完整的依赖图数据(graph nodes + edges)
     */
    public Map<String, Object> getDependencyGraph(Long scanTaskId) {
        List<CodeSymbol> symbols = listSymbols(scanTaskId, null);
        List<CodeRelationEntity> relations = listRelations(scanTaskId, null);

        // 构建节点集合
        Set<String> seenIds = new LinkedHashSet<>();
        List<Map<String, Object>> nodes = new ArrayList<>();

        for (CodeRelationEntity rel : relations) {
            for (String id : Arrays.asList(rel.getSourceId(), rel.getTargetId())) {
                if (seenIds.add(id)) {
                    CodeSymbol sym = symbols.stream()
                            .filter(s -> id.equals(s.getSymbolId()))
                            .findFirst().orElse(null);
                    nodes.add(buildNode(id, sym));
                }
            }
        }
        // 补充不在关系中的孤立符号
        for (CodeSymbol sym : symbols) {
            if (seenIds.add(sym.getSymbolId())) {
                nodes.add(buildNode(sym.getSymbolId(), sym));
            }
        }

        // 构建边
        List<Map<String, String>> edges = relations.stream().map(rel -> {
            Map<String, String> edge = new LinkedHashMap<>();
            edge.put("source", rel.getSourceId());
            edge.put("target", rel.getTargetId());
            edge.put("relationType", rel.getRelationType());
            return edge;
        }).collect(Collectors.toList());

        Map<String, Object> graph = new LinkedHashMap<>();
        graph.put("nodes", nodes);
        graph.put("edges", edges);

        // 统计摘要
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalNodes", nodes.size());
        summary.put("totalEdges", edges.size());

        Map<String, Long> kindCounts = symbols.stream()
                .collect(Collectors.groupingBy(CodeSymbol::getKind, Collectors.counting()));
        summary.put("byKind", kindCounts);

        Map<String, Long> relCounts = relations.stream()
                .collect(Collectors.groupingBy(CodeRelationEntity::getRelationType, Collectors.counting()));
        summary.put("byRelation", relCounts);

        graph.put("summary", summary);
        return graph;
    }

    private Map<String, Object> buildNode(String id, CodeSymbol sym) {
        Map<String, Object> node = new LinkedHashMap<>();
        node.put("id", id);
        if (sym != null) {
            node.put("label", sym.getName());
            node.put("kind", sym.getKind());
            node.put("filePath", sym.getFilePath());
            node.put("package", sym.getPackage_());
            node.put("lineNumber", sym.getLineNumber());
        } else {
            // 从 symbol_id 中推断名称
            String label = id.contains("#") ? id.substring(id.lastIndexOf('#') + 1) : id;
            if (label.contains("(")) label = label.substring(0, label.indexOf('('));
            node.put("label", label);
            node.put("kind", "UNKNOWN");
        }
        return node;
    }
}