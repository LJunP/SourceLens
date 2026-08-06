package com.sourcelens.module.artifact.controller;

import com.sourcelens.common.Result;
import com.sourcelens.common.exception.BizException;
import com.sourcelens.module.artifact.dto.ArtifactPreviewResponse;
import com.sourcelens.module.artifact.dto.ArtifactRecordResponse;
import com.sourcelens.module.artifact.entity.ArtifactRecord;
import com.sourcelens.module.artifact.service.ArtifactStorageService;
import com.sourcelens.module.audit.service.AuditLogService;
import com.sourcelens.module.project.service.ProjectService;
import com.sourcelens.module.repository.entity.Repository;
import com.sourcelens.module.repository.service.RepositoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Tag(name = "运行产物")
@RestController
@RequestMapping("/api/projects/{projectId}/artifacts")
@RequiredArgsConstructor
public class ArtifactController {

    private static final String ACTION_ARTIFACT_RAW_DOWNLOAD = "ARTIFACT_RAW_DOWNLOAD";
    private static final String HEADER_AUDIT_LOG_ID = "X-SourceLens-Audit-Log-Id";

    private final ArtifactStorageService artifactStorageService;
    private final ProjectService projectService;
    private final RepositoryService repositoryService;
    private final AuditLogService auditLogService;

    @Operation(summary = "查询项目运行产物索引")
    @GetMapping
    public Result<List<ArtifactRecordResponse>> listArtifacts(
            @PathVariable Long projectId,
            @RequestParam(required = false) Long repositoryId,
            @RequestParam(required = false) String ownerType,
            @RequestParam(required = false) Long ownerId,
            @RequestAttribute("userId") Long userId) {
        projectService.verifyOwnership(projectId, userId);
        List<ArtifactRecord> records;
        if (ownerType != null && ownerId != null) {
            records = artifactStorageService.listByOwner(ownerType, ownerId);
        } else if (repositoryId != null) {
            Repository repo = repositoryService.getDetail(repositoryId);
            if (!projectId.equals(repo.getProjectId())) {
                return Result.ok(List.of());
            }
            records = artifactStorageService.listByRepository(repositoryId);
        } else {
            records = artifactStorageService.listByProject(projectId);
        }
        return Result.ok(records.stream()
                .filter(record -> projectId.equals(record.getProjectId()))
                .map(ArtifactRecordResponse::from)
                .toList());
    }

    @Operation(summary = "查询运行产物详情")
    @GetMapping("/{artifactId}")
    public Result<ArtifactRecordResponse> getArtifact(
            @PathVariable Long projectId,
            @PathVariable Long artifactId,
            @RequestAttribute("userId") Long userId) {
        projectService.verifyOwnership(projectId, userId);
        ArtifactRecord record = getProjectArtifact(projectId, artifactId);
        return Result.ok(ArtifactRecordResponse.from(record));
    }

    @Operation(summary = "预览运行产物文本内容")
    @GetMapping("/{artifactId}/preview")
    public Result<ArtifactPreviewResponse> previewArtifact(
            @PathVariable Long projectId,
            @PathVariable Long artifactId,
            @RequestAttribute("userId") Long userId) {
        projectService.verifyOwnership(projectId, userId);
        ArtifactRecord record = getProjectArtifact(projectId, artifactId);
        ArtifactStorageService.PreviewContent preview = artifactStorageService.readPreview(record);
        return Result.ok(ArtifactPreviewResponse.builder()
                .record(ArtifactRecordResponse.from(record))
                .text(preview.text())
                .truncated(preview.truncated())
                .previewBytes(preview.previewBytes())
                .build());
    }

    @Operation(summary = "下载运行产物")
    @GetMapping("/{artifactId}/download")
    public ResponseEntity<byte[]> downloadArtifact(
            @PathVariable Long projectId,
            @PathVariable Long artifactId,
            @RequestParam(defaultValue = "false") boolean rawDownloadAcknowledged,
            @RequestAttribute("userId") Long userId) {
        long startedNanos = System.nanoTime();
        projectService.verifyOwnership(projectId, userId);
        ArtifactRecord record = getProjectArtifact(projectId, artifactId);
        String fileName = safeDownloadFileName(record);
        if (!rawDownloadAcknowledged) {
            recordDownloadAudit(userId, projectId, record, fileName, false, "FAILED",
                    "artifact raw download rejected: acknowledgement required",
                    elapsedMs(startedNanos));
            throw BizException.badRequest("artifact raw download requires explicit acknowledgement");
        }
        byte[] bytes;
        try {
            bytes = artifactStorageService.readBytes(record);
        } catch (RuntimeException e) {
            recordDownloadAudit(userId, projectId, record, fileName, true, "FAILED",
                    "artifact raw download failed: " + e.getMessage(),
                    elapsedMs(startedNanos));
            throw e;
        }
        MediaType mediaType = parseMediaType(record.getContentType());
        Long auditLogId = recordDownloadAudit(userId, projectId, record, fileName, true, "SUCCESS",
                "artifact raw download issued: bytes=" + bytes.length
                        + ", filename=" + fileName
                        + ", contentType=" + mediaType
                        + ", rawDownload=true, redacted=false",
                elapsedMs(startedNanos));
        return ResponseEntity.ok()
                .contentType(mediaType)
                .contentLength(bytes.length)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename(fileName)
                        .build()
                        .toString())
                .headers(headers -> {
                    if (auditLogId != null) {
                        headers.add(HEADER_AUDIT_LOG_ID, String.valueOf(auditLogId));
                    }
                })
                .body(bytes);
    }

    private ArtifactRecord getProjectArtifact(Long projectId, Long artifactId) {
        ArtifactRecord record = artifactStorageService.getById(artifactId);
        if (!projectId.equals(record.getProjectId())) {
            throw BizException.notFound("artifact");
        }
        return record;
    }

    private MediaType parseMediaType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
        try {
            return MediaType.parseMediaType(contentType);
        } catch (IllegalArgumentException e) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
    }

    private String safeDownloadFileName(ArtifactRecord record) {
        String extension = ".bin";
        String contentType = record.getContentType();
        if ("CHANGE_PATCH".equals(record.getArtifactType())) {
            extension = ".patch";
        } else if (contentType != null) {
            if (contentType.contains("json")) {
                extension = ".json";
            } else if (contentType.startsWith("text/")) {
                extension = ".txt";
            } else if (contentType.contains("patch")) {
                extension = ".patch";
            }
        }
        return "artifact-" + record.getId() + extension;
    }

    private Long recordDownloadAudit(Long userId,
                                     Long projectId,
                                     ArtifactRecord record,
                                     String fileName,
                                     boolean rawDownloadAcknowledged,
                                     String status,
                                     String outputSummary,
                                     Long durationMs) {
        Map<String, Object> input = new LinkedHashMap<>();
        input.put("artifactId", record.getId());
        input.put("artifactType", valueOrEmpty(record.getArtifactType()));
        input.put("ownerType", valueOrEmpty(record.getOwnerType()));
        input.put("ownerId", record.getOwnerId());
        input.put("repositoryId", record.getRepositoryId());
        input.put("contentType", valueOrEmpty(record.getContentType()));
        input.put("sizeBytes", record.getSizeBytes());
        input.put("checksumSha256", valueOrEmpty(record.getChecksumSha256()));
        input.put("hasChecksum", record.getChecksumSha256() != null && !record.getChecksumSha256().isBlank());
        input.put("fileName", fileName);
        input.put("downloadKind", "RAW_BLOB");
        input.put("rawDownloadAcknowledged", rawDownloadAcknowledged);

        return auditLogService.record(userId, projectId, "ARTIFACT", record.getId(), ACTION_ARTIFACT_RAW_DOWNLOAD,
                status,
                input,
                outputSummary,
                durationMs,
                null);
    }

    private Long elapsedMs(long startedNanos) {
        return Math.max(0, (System.nanoTime() - startedNanos) / 1_000_000);
    }

    private String valueOrEmpty(String value) {
        return value == null ? "" : value;
    }
}
