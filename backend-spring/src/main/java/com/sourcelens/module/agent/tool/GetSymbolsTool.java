package com.sourcelens.module.agent.tool;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.sourcelens.module.analysis.entity.CodeRelationEntity;
import com.sourcelens.module.analysis.entity.CodeSymbol;
import com.sourcelens.module.analysis.mapper.CodeRelationMapper;
import com.sourcelens.module.analysis.mapper.CodeSymbolMapper;
import com.sourcelens.module.scantask.entity.ScanTask;
import com.sourcelens.module.scantask.mapper.ScanTaskMapper;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 查询已扫描的代码符号和关系,帮助 Agent 理解项目结构。
 */
@Component
public class GetSymbolsTool implements AgentTool {

    private static final int DEFAULT_LIMIT = 50;
    private static final int MAX_LIMIT = 100;

    private final ScanTaskMapper scanTaskMapper;
    private final CodeSymbolMapper symbolMapper;
    private final CodeRelationMapper relationMapper;

    public GetSymbolsTool(ScanTaskMapper scanTaskMapper,
                          CodeSymbolMapper symbolMapper,
                          CodeRelationMapper relationMapper) {
        this.scanTaskMapper = scanTaskMapper;
        this.symbolMapper = symbolMapper;
        this.relationMapper = relationMapper;
    }

    @Override
    public String name() {
        return "get_symbols";
    }

    @Override
    public String description() {
        return "Query code symbols (classes, methods, fields) and their relationships from the project's architecture graph. " +
                "Use this to understand the project's class hierarchy, dependencies, and module structure.";
    }

    @Override
    public Map<String, Object> inputSchema() {
        Map<String, Object> schema = new LinkedHashMap<>();
        schema.put("type", "object");

        Map<String, Object> properties = new LinkedHashMap<>();
        properties.put("query", Map.of(
                "type", "string",
                "description", "Filter symbols by name pattern (contains match). Leave empty to get an overview."));
        properties.put("kind", Map.of(
                "type", "string",
                "description", "Filter by symbol kind, e.g. 'CLASS', 'METHOD', 'FIELD', 'INTERFACE'"));
        properties.put("limit", Map.of(
                "type", "integer",
                "description", "Max symbols to return. Default 50.",
                "default", 50));
        schema.put("properties", properties);

        return schema;
    }

    @Override
    @SuppressWarnings("unchecked")
    public ToolResult execute(Map<String, Object> args, ToolContext context) {
        Long projectId = context.getProjectId();
        if (projectId == null) {
            return ToolResult.fail("项目 ID 未设置");
        }

        String query = args.get("query") != null ? (String) args.get("query") : null;
        String kind = args.get("kind") != null ? (String) args.get("kind") : null;
        int limit = AgentToolArgumentUtils.boundedInt(args.get("limit"), DEFAULT_LIMIT, 1, MAX_LIMIT);

        ScanTask scanTask = resolveScanTask(projectId, context.getScanTaskId());
        if (scanTask == null) {
            return ToolResult.ok("该项目尚无成功的扫描结果。请先运行代码扫描。");
        }

        if (!projectId.equals(scanTask.getProjectId())) {
            return ToolResult.fail("扫描任务不属于当前项目");
        }
        if (!"SUCCESS".equals(scanTask.getStatus())) {
            return ToolResult.ok("指定扫描任务 #" + scanTask.getId() + " 尚未成功完成，无法读取符号图谱。");
        }

        Long scanTaskId = scanTask.getId();

        // 查询符号
        LambdaQueryWrapper<CodeSymbol> symbolWrapper = new LambdaQueryWrapper<CodeSymbol>()
                .eq(CodeSymbol::getScanTaskId, scanTaskId);
        if (query != null && !query.isBlank()) {
            symbolWrapper.like(CodeSymbol::getName, query);
        }
        if (kind != null && !kind.isBlank()) {
            symbolWrapper.eq(CodeSymbol::getKind, kind);
        }
        symbolWrapper.last("LIMIT " + limit);

        List<CodeSymbol> symbols = symbolMapper.selectList(symbolWrapper);

        // 查询关系数
        Long totalRelations = relationMapper.selectCount(
                new LambdaQueryWrapper<CodeRelationEntity>()
                        .eq(CodeRelationEntity::getScanTaskId, scanTaskId));

        // 构建输出
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("ScanTask ID: %d, 符号总数: %d, 关系总数: %d\n\n",
                scanTaskId, symbols.size(), totalRelations));

        if (symbols.isEmpty()) {
            sb.append("未找到匹配的符号。");
        } else {
            // 按 kind 分组统计
            Map<String, Long> kindStats = symbols.stream()
                    .collect(Collectors.groupingBy(CodeSymbol::getKind, Collectors.counting()));
            sb.append("符号类型分布:\n");
            kindStats.forEach((k, v) -> sb.append("  ").append(k).append(": ").append(v).append("\n"));
            sb.append("\n符号列表:\n");

            for (CodeSymbol sym : symbols) {
                sb.append(String.format("  [%s] %s (%s) — %s\n",
                        sym.getKind(), sym.getName(), sym.getSymbolId(), sym.getFilePath()));
            }
        }

        return ToolResult.ok(sb.toString());
    }

    private ScanTask resolveScanTask(Long projectId, Long requestedScanTaskId) {
        if (requestedScanTaskId != null) {
            return scanTaskMapper.selectById(requestedScanTaskId);
        }
        return scanTaskMapper.selectOne(
                new LambdaQueryWrapper<ScanTask>()
                        .eq(ScanTask::getProjectId, projectId)
                        .eq(ScanTask::getStatus, "SUCCESS")
                        .orderByDesc(ScanTask::getId)
                        .last("LIMIT 1"));
    }

}
