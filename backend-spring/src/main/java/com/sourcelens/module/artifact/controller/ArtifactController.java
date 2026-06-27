package com.sourcelens.module.artifact.controller;

import com.sourcelens.common.Result;
import com.sourcelens.common.exception.BizException;
import com.sourcelens.module.artifact.dto.ArtifactPreviewResponse;
import com.sourcelens.module.artifact.dto.ArtifactRecordResponse;
import com.sourcelens.module.artifact.entity.ArtifactRecord;
import com.sourcelens.module.artifact.service.ArtifactStorageService;
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

import java.util.List;

@Tag(name = "运行产物")
@RestController
@RequestMapping("/api/projects/{projectId}/artifacts")
@RequiredArgsConstructor
public class ArtifactController {

    private final ArtifactStorageService artifactStorageService;
    private final ProjectService projectService;
    private final RepositoryService repositoryService;

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
            @RequestAttribute("userId") Long userId) {
        projectService.verifyOwnership(projectId, userId);
        ArtifactRecord record = getProjectArtifact(projectId, artifactId);
        byte[] bytes = artifactStorageService.readBytes(record);
        String fileName = safeDownloadFileName(record);
        MediaType mediaType = parseMediaType(record.getContentType());
        return ResponseEntity.ok()
                .contentType(mediaType)
                .contentLength(bytes.length)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename(fileName)
                        .build()
                        .toString())
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
}
