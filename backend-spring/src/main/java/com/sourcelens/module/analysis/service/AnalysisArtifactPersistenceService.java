package com.sourcelens.module.analysis.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.sourcelens.module.analysis.entity.ScanArtifact;
import com.sourcelens.module.analysis.mapper.ScanArtifactMapper;
import com.sourcelens.module.artifact.entity.ArtifactRecord;
import com.sourcelens.module.artifact.service.ArtifactStorageService;
import com.sourcelens.module.scantask.entity.ScanTask;
import com.sourcelens.module.scantask.mapper.ScanTaskMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalysisArtifactPersistenceService {

    private final ScanArtifactMapper scanArtifactMapper;
    private final ScanTaskMapper scanTaskMapper;
    private final ArtifactStorageService artifactStorageService;

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    public void cleanupScanArtifacts(Long scanTaskId) {
        artifactStorageService.deleteByOwner("SCAN_TASK", scanTaskId);
        scanArtifactMapper.delete(new LambdaQueryWrapper<ScanArtifact>()
                .eq(ScanArtifact::getScanTaskId, scanTaskId));
    }

    public void saveArtifact(Long scanTaskId, String type, Map<String, Object> summary) {
        String json = toJson(summary);
        ScanTask scanTask = scanTaskMapper.selectById(scanTaskId);
        ArtifactRecord record = artifactStorageService.storeText(
                scanTask == null ? null : scanTask.getProjectId(),
                scanTask == null ? null : scanTask.getRepositoryId(),
                "SCAN_TASK",
                scanTaskId,
                type,
                type.toLowerCase(Locale.ROOT) + ".json",
                "application/json",
                json,
                scanTask == null ? null : scanTask.getCreatedBy());
        ScanArtifact artifact = ScanArtifact.builder()
                .scanTaskId(scanTaskId)
                .artifactType(type)
                .storagePath(record.getStoragePath())
                .summaryJson(json)
                .build();
        scanArtifactMapper.insert(artifact);
    }

    private String toJson(Map<String, Object> data) {
        try {
            return objectMapper.writeValueAsString(data);
        } catch (Exception e) {
            log.error("JSON 序列化失败", e);
            return "{}";
        }
    }
}
