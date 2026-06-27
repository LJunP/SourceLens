package com.sourcelens.module.analysis.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.sourcelens.module.analysis.AnalyzerRunner;
import com.sourcelens.module.analysis.ScanResultSchemaValidator;
import com.sourcelens.module.analysis.entity.ScanArtifact;
import com.sourcelens.module.analysis.mapper.ScanArtifactMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * 分析服务：基于 Rust Analyzer 真实扫描结果生成分析产物
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AnalysisService {

    private final ScanArtifactMapper scanArtifactMapper;
    private final AnalyzerRunner analyzerRunner;
    private final AnalysisArtifactBuilder artifactBuilder;
    private final JavaFallbackAnalyzer javaFallbackAnalyzer;
    private final CodeGraphPersistenceService codeGraphPersistenceService;
    private final AnalysisArtifactPersistenceService artifactPersistenceService;
    private final ScanResultSchemaValidator schemaValidator;

    /**
     * 执行真实扫描并生成分析产物
     * @param scanTaskId 扫描任务 ID
     * @param repoPath   仓库本地路径
     */
    public void generateAnalysis(Long scanTaskId, String repoPath) {
        log.info("开始真实扫描分析, scanTaskId={}, repoPath={}", scanTaskId, repoPath);
        artifactPersistenceService.cleanupScanArtifacts(scanTaskId);

        JsonNode scanResult;
        boolean isFallback = false;
        // 用于在内存中缓存解析过的 Java AST 结果，避免后续 saveSymbolsAndRelations 再次重复扫描解析文件
        Map<String, JavaAstParser.ParseResult> parsedAstMap = new HashMap<>();

        try {
            scanResult = analyzerRunner.scan(repoPath);
        } catch (Exception e) {
            log.warn("Rust Analyzer 执行失败, 使用 Java fallback: {}", e.getMessage());
            scanResult = javaFallbackAnalyzer.scan(repoPath, parsedAstMap);
            isFallback = true;
        }

        // 如果不是 Fallback 扫描，且包含 Java 文件，使用 AST 语法树增强/覆盖扫描结构数据
        if (!isFallback) {
            javaFallbackAnalyzer.enrichJavaStructureWithAst(scanResult, repoPath, parsedAstMap);
        }
        schemaValidator.validate(scanResult);

        // 逐个产物保存,单个失败不影响其他产物
        for (Map.Entry<String, Map<String, Object>> artifact : artifactBuilder.buildArtifacts(scanResult).entrySet()) {
            try {
                artifactPersistenceService.saveArtifact(scanTaskId, artifact.getKey(), artifact.getValue());
            } catch (Exception e) {
                log.error("保存产物 {} 失败, scanTaskId={}", artifact.getKey(), scanTaskId, e);
            }
        }

        try {
            codeGraphPersistenceService.saveSymbolsAndRelations(scanTaskId, scanResult, parsedAstMap);
        } catch (Exception e) {
            log.warn("保存符号关系失败, 忽略: {}", e.getMessage());
        }

        log.info("分析产物生成完成, scanTaskId={}", scanTaskId);
    }

    public List<ScanArtifact> listByTask(Long scanTaskId) {
        return scanArtifactMapper.selectList(
                new LambdaQueryWrapper<ScanArtifact>()
                        .eq(ScanArtifact::getScanTaskId, scanTaskId)
                        .orderByAsc(ScanArtifact::getArtifactType));
    }

    public ScanArtifact getByTaskAndType(Long scanTaskId, String artifactType) {
        return scanArtifactMapper.selectOne(
                new LambdaQueryWrapper<ScanArtifact>()
                        .eq(ScanArtifact::getScanTaskId, scanTaskId)
                        .eq(ScanArtifact::getArtifactType, artifactType));
    }

}
