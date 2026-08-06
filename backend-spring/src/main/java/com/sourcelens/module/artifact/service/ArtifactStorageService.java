package com.sourcelens.module.artifact.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sourcelens.common.exception.BizException;
import com.sourcelens.module.analysis.entity.ScanArtifact;
import com.sourcelens.module.analysis.mapper.ScanArtifactMapper;
import com.sourcelens.module.artifact.entity.ArtifactRecord;
import com.sourcelens.module.artifact.mapper.ArtifactRecordMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.nio.file.FileAlreadyExistsException;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ArtifactStorageService {

    private static final long MAX_PREVIEW_BYTES = 128 * 1024;
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
    };

    private final ArtifactRecordMapper artifactRecordMapper;
    private final ScanArtifactMapper scanArtifactMapper;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${sourcelens.workspace.base-path:/tmp/sourcelens/repos}")
    private String workspaceBasePath;

    public ArtifactRecord storeText(Long projectId,
                                    Long repositoryId,
                                    String ownerType,
                                    Long ownerId,
                                    String artifactType,
                                    String fileName,
                                    String contentType,
                                    String content,
                                    Long createdBy) {
        byte[] bytes = (content == null ? "" : content).getBytes(StandardCharsets.UTF_8);
        return storeBytes(projectId, repositoryId, ownerType, ownerId, artifactType,
                fileName, contentType, bytes, createdBy);
    }

    public ArtifactRecord storeBytes(Long projectId,
                                     Long repositoryId,
                                     String ownerType,
                                     Long ownerId,
                                     String artifactType,
                                     String fileName,
                                     String contentType,
                                     byte[] bytes,
                                     Long createdBy) {
        validateOwner(ownerType, ownerId, artifactType);
        String safeFileName = sanitizeFileName(fileName);
        byte[] payload = bytes == null ? new byte[0] : bytes;
        Path root = artifactRoot();
        Path target = root
                .resolve(ownerType.toLowerCase(Locale.ROOT))
                .resolve(String.valueOf(ownerId))
                .resolve(artifactType.toLowerCase(Locale.ROOT))
                .resolve(safeFileName)
                .normalize();
        if (!target.startsWith(root)) {
            throw BizException.badRequest("artifact 写入路径非法");
        }
        try {
            createArtifactDirectoriesNoFollow(root, target.getParent());
            writeBytesNoFollow(target, payload);
        } catch (IOException e) {
            throw BizException.internal("artifact 写入失败: " + e.getMessage());
        }

        ArtifactRecord record = ArtifactRecord.builder()
                .projectId(projectId)
                .repositoryId(repositoryId)
                .ownerType(ownerType)
                .ownerId(ownerId)
                .artifactType(artifactType)
                .storagePath(target.toString())
                .contentType(contentType)
                .sizeBytes((long) payload.length)
                .checksumSha256(sha256(payload))
                .createdBy(createdBy)
                .build();
        artifactRecordMapper.insert(record);
        return record;
    }

    public List<ArtifactRecord> listByProject(Long projectId) {
        return artifactRecordMapper.selectList(new LambdaQueryWrapper<ArtifactRecord>()
                .eq(ArtifactRecord::getProjectId, projectId)
                .orderByDesc(ArtifactRecord::getCreatedAt));
    }

    public List<ArtifactRecord> listByRepository(Long repositoryId) {
        return artifactRecordMapper.selectList(new LambdaQueryWrapper<ArtifactRecord>()
                .eq(ArtifactRecord::getRepositoryId, repositoryId)
                .orderByDesc(ArtifactRecord::getCreatedAt));
    }

    public List<ArtifactRecord> listByOwner(String ownerType, Long ownerId) {
        return artifactRecordMapper.selectList(new LambdaQueryWrapper<ArtifactRecord>()
                .eq(ArtifactRecord::getOwnerType, ownerType)
                .eq(ArtifactRecord::getOwnerId, ownerId)
                .orderByDesc(ArtifactRecord::getCreatedAt));
    }

    public ArtifactRecord getById(Long id) {
        ArtifactRecord record = artifactRecordMapper.selectById(id);
        if (record == null) {
            throw BizException.notFound("artifact");
        }
        return record;
    }

    public byte[] readBytes(ArtifactRecord record) {
        Path target;
        try {
            target = validateReadablePath(record);
        } catch (BizException e) {
            if (shouldAttemptLegacyScanArtifactFallback(record)) {
                byte[] legacyBytes = legacyScanArtifactBytes(record);
                if (legacyBytes != null) {
                    return legacyBytes;
                }
            }
            throw e;
        }
        return readAllBytesNoFollow(target);
    }

    public PreviewContent readPreview(ArtifactRecord record) {
        if (!isTextPreviewSupported(record)) {
            throw BizException.badRequest("当前 artifact 类型不支持文本预览");
        }
        Path target;
        try {
            target = validateReadablePath(record);
        } catch (BizException e) {
            if (shouldAttemptLegacyScanArtifactFallback(record)) {
                byte[] legacyBytes = legacyScanArtifactBytes(record);
                if (legacyBytes != null) {
                    return previewFromBytes(legacyBytes);
                }
            }
            throw e;
        }
        return readPreviewNoFollow(target);
    }

    private PreviewContent previewFromBytes(byte[] payload) {
        byte[] bytes = payload == null ? new byte[0] : payload;
        int limit = (int) Math.min(bytes.length, MAX_PREVIEW_BYTES);
        byte[] preview = new byte[limit];
        System.arraycopy(bytes, 0, preview, 0, limit);
        return new PreviewContent(new String(preview, StandardCharsets.UTF_8), bytes.length > MAX_PREVIEW_BYTES, preview.length);
    }

    private byte[] readAllBytesNoFollow(Path target) {
        try (var input = Files.newInputStream(target, StandardOpenOption.READ, LinkOption.NOFOLLOW_LINKS)) {
            return input.readAllBytes();
        } catch (IOException e) {
            throw BizException.internal("artifact 读取失败: " + e.getMessage());
        }
    }

    private PreviewContent readPreviewNoFollow(Path target) {
        try (var channel = Files.newByteChannel(target, StandardOpenOption.READ, LinkOption.NOFOLLOW_LINKS)) {
            long size = channel.size();
            int limit = (int) Math.min(size, MAX_PREVIEW_BYTES);
            byte[] bytes = new byte[limit];
            ByteBuffer buffer = ByteBuffer.wrap(bytes);
            while (buffer.hasRemaining()) {
                int read = channel.read(buffer);
                if (read < 0) {
                    break;
                }
            }
            if (buffer.position() < limit) {
                bytes = Arrays.copyOf(bytes, buffer.position());
            }
            return new PreviewContent(new String(bytes, StandardCharsets.UTF_8), size > MAX_PREVIEW_BYTES, bytes.length);
        } catch (IOException e) {
            throw BizException.internal("artifact 预览读取失败: " + e.getMessage());
        }
    }

    public Map<String, Object> readJsonMapArtifactsByOwner(String ownerType, Long ownerId) {
        Map<String, Object> data = new LinkedHashMap<>();
        for (ArtifactRecord record : listByOwner(ownerType, ownerId)) {
            if (!isJsonContent(record)) {
                continue;
            }
            try {
                String text = new String(readBytes(record), StandardCharsets.UTF_8);
                data.put(record.getArtifactType(), objectMapper.readValue(text, MAP_TYPE));
            } catch (Exception e) {
                throw BizException.badRequest("artifact JSON 解析失败: " + record.getArtifactType());
            }
        }
        return data;
    }

    public int deleteByProject(Long projectId) {
        return deleteRecords(listByProject(projectId));
    }

    public int deleteByRepository(Long repositoryId) {
        return deleteRecords(listByRepository(repositoryId));
    }

    public int deleteByOwner(String ownerType, Long ownerId) {
        return deleteRecords(listByOwner(ownerType, ownerId));
    }

    public int deleteCreatedBefore(LocalDateTime cutoff, int maxRecords) {
        if (cutoff == null) {
            throw BizException.badRequest("artifact 清理截止时间不能为空");
        }
        int limit = Math.max(1, Math.min(maxRecords, 1000));
        List<ArtifactRecord> records = artifactRecordMapper.selectList(new LambdaQueryWrapper<ArtifactRecord>()
                .lt(ArtifactRecord::getCreatedAt, cutoff)
                .orderByAsc(ArtifactRecord::getCreatedAt)
                .last("LIMIT " + limit));
        return deleteRecords(records);
    }

    private int deleteRecords(List<ArtifactRecord> records) {
        int deleted = 0;
        for (ArtifactRecord record : records) {
            deleteArtifactFile(record.getStoragePath());
            if (record.getId() != null) {
                artifactRecordMapper.deleteById(record.getId());
            }
            deleted++;
        }
        return deleted;
    }

    private void deleteArtifactFile(String storagePath) {
        if (storagePath == null || storagePath.isBlank()) {
            return;
        }
        Path root = artifactRoot();
        Path target = validatePathInsideRoot(storagePath, "删除");
        try {
            Files.deleteIfExists(target);
            cleanupEmptyParents(target.getParent(), root);
        } catch (IOException e) {
            throw BizException.internal("artifact 删除失败: " + e.getMessage());
        }
    }

    private void cleanupEmptyParents(Path current, Path root) throws IOException {
        Path normalizedRoot = root.toAbsolutePath().normalize();
        Path cursor = current == null ? null : current.toAbsolutePath().normalize();
        while (cursor != null && cursor.startsWith(normalizedRoot) && !cursor.equals(normalizedRoot)) {
            try (var children = Files.list(cursor)) {
                if (children.findAny().isPresent()) {
                    return;
                }
            }
            Files.deleteIfExists(cursor);
            cursor = cursor.getParent();
        }
    }

    private Path artifactRoot() {
        return Path.of(workspaceBasePath, "artifacts").toAbsolutePath().normalize();
    }

    private void createArtifactDirectoriesNoFollow(Path root, Path parent) throws IOException {
        if (parent == null || !parent.startsWith(root)) {
            throw BizException.badRequest("artifact 写入路径非法");
        }
        Path workspaceBase = root.getParent();
        if (workspaceBase == null) {
            throw BizException.badRequest("artifact 写入路径非法");
        }
        Files.createDirectories(workspaceBase);
        ensureDirectoryNoFollow(workspaceBase, "写入");
        ensureDirectoryNoFollow(root, "写入");
        Path cursor = root;
        Path relativeParent = root.relativize(parent);
        for (Path part : relativeParent) {
            cursor = cursor.resolve(part);
            ensureDirectoryNoFollow(cursor, "写入");
        }
    }

    private void ensureDirectoryNoFollow(Path directory, String action) throws IOException {
        if (Files.exists(directory, LinkOption.NOFOLLOW_LINKS)) {
            if (Files.isSymbolicLink(directory) || !Files.isDirectory(directory, LinkOption.NOFOLLOW_LINKS)) {
                throw BizException.badRequest("artifact " + action + "路径非法");
            }
            return;
        }
        try {
            Files.createDirectory(directory);
        } catch (FileAlreadyExistsException ignored) {
            if (Files.isSymbolicLink(directory) || !Files.isDirectory(directory, LinkOption.NOFOLLOW_LINKS)) {
                throw BizException.badRequest("artifact " + action + "路径非法");
            }
        }
    }

    private void writeBytesNoFollow(Path target, byte[] payload) throws IOException {
        if (Files.isSymbolicLink(target)) {
            throw BizException.badRequest("artifact 写入路径非法");
        }
        try (var channel = Files.newByteChannel(target,
                StandardOpenOption.CREATE,
                StandardOpenOption.TRUNCATE_EXISTING,
                StandardOpenOption.WRITE,
                LinkOption.NOFOLLOW_LINKS)) {
            ByteBuffer buffer = ByteBuffer.wrap(payload);
            while (buffer.hasRemaining()) {
                channel.write(buffer);
            }
        }
    }

    private Path validateReadablePath(ArtifactRecord record) {
        if (record == null || record.getStoragePath() == null || record.getStoragePath().isBlank()) {
            throw BizException.badRequest("artifact 存储路径为空");
        }
        Path target = validatePathInsideRoot(record.getStoragePath(), "读取");
        if (Files.isSymbolicLink(target)) {
            validateRealPathInsideRoot(target, "读取");
            throw BizException.badRequest("artifact 读取路径非法");
        }
        if (!Files.isRegularFile(target, LinkOption.NOFOLLOW_LINKS)) {
            throw BizException.notFound("artifact file");
        }
        validateRealPathInsideRoot(target, "读取");
        return target;
    }

    private Path validatePathInsideRoot(String storagePath, String action) {
        Path root = artifactRoot();
        Path target = Path.of(storagePath).toAbsolutePath().normalize();
        if (!target.startsWith(root)) {
            throw BizException.badRequest("artifact " + action + "路径非法");
        }
        return target;
    }

    private void validateRealPathInsideRoot(Path target, String action) {
        try {
            Path root = artifactRoot().toRealPath();
            Path realTarget = target.toRealPath();
            if (!realTarget.startsWith(root)) {
                throw BizException.badRequest("artifact " + action + "路径非法");
            }
        } catch (BizException e) {
            throw e;
        } catch (IOException e) {
            throw BizException.internal("artifact " + action + "路径解析失败: " + e.getMessage());
        }
    }

    private boolean isTextPreviewSupported(ArtifactRecord record) {
        String contentType = record.getContentType();
        if (contentType == null || contentType.isBlank()) {
            return false;
        }
        String normalized = contentType.toLowerCase(Locale.ROOT);
        return normalized.startsWith("text/")
                || normalized.contains("json")
                || normalized.contains("xml")
                || normalized.contains("yaml")
                || normalized.contains("javascript")
                || normalized.contains("typescript");
    }

    private boolean isJsonContent(ArtifactRecord record) {
        String contentType = record.getContentType();
        return contentType != null && contentType.toLowerCase(Locale.ROOT).contains("json");
    }

    private boolean shouldAttemptLegacyScanArtifactFallback(ArtifactRecord record) {
        if (record == null || record.getStoragePath() == null || record.getStoragePath().isBlank()) {
            return false;
        }
        Path root = artifactRoot();
        Path target = Path.of(record.getStoragePath()).toAbsolutePath().normalize();
        if (target.startsWith(root)) {
            return false;
        }
        return resemblesLegacyScanArtifactPath(target, record);
    }

    private boolean resemblesLegacyScanArtifactPath(Path target, ArtifactRecord record) {
        if (record.getOwnerId() == null) {
            return false;
        }
        int count = target.getNameCount();
        for (int index = 0; index <= count - 3; index++) {
            if ("artifacts".equals(target.getName(index).toString())
                    && "scan_task".equals(target.getName(index + 1).toString())
                    && record.getOwnerId().toString().equals(target.getName(index + 2).toString())) {
                return true;
            }
        }
        return false;
    }

    private byte[] legacyScanArtifactBytes(ArtifactRecord record) {
        String summary = legacyScanArtifactSummary(record);
        return summary == null ? null : summary.getBytes(StandardCharsets.UTF_8);
    }

    private String legacyScanArtifactSummary(ArtifactRecord record) {
        if (record == null
                || record.getOwnerId() == null
                || record.getArtifactType() == null
                || !"SCAN_TASK".equals(record.getOwnerType())
                || !isJsonContent(record)) {
            return null;
        }
        ScanArtifact legacy = scanArtifactMapper.selectOne(new LambdaQueryWrapper<ScanArtifact>()
                .eq(ScanArtifact::getScanTaskId, record.getOwnerId())
                .eq(ScanArtifact::getArtifactType, record.getArtifactType()));
        if (legacy == null || legacy.getSummaryJson() == null || legacy.getSummaryJson().isBlank()) {
            return null;
        }
        return legacy.getSummaryJson();
    }

    private void validateOwner(String ownerType, Long ownerId, String artifactType) {
        if (ownerType == null || ownerType.isBlank()) {
            throw BizException.badRequest("artifact ownerType 不能为空");
        }
        if (ownerId == null) {
            throw BizException.badRequest("artifact ownerId 不能为空");
        }
        if (artifactType == null || artifactType.isBlank()) {
            throw BizException.badRequest("artifactType 不能为空");
        }
    }

    private String sanitizeFileName(String fileName) {
        if (fileName == null || fileName.isBlank()) {
            throw BizException.badRequest("artifact 文件名不能为空");
        }
        Path normalized = Path.of(fileName).normalize();
        if (normalized.isAbsolute() || normalized.getNameCount() != 1 || normalized.startsWith("..")) {
            throw BizException.badRequest("artifact 文件名必须是不含目录的普通文件名");
        }
        String value = normalized.toString();
        if (value.contains("/") || value.contains("\\") || ".".equals(value) || "..".equals(value)) {
            throw BizException.badRequest("artifact 文件名非法");
        }
        return value;
    }

    private String sha256(byte[] payload) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(payload));
        } catch (NoSuchAlgorithmException e) {
            throw BizException.internal("SHA-256 不可用");
        }
    }

    public record PreviewContent(String text, boolean truncated, int previewBytes) {
    }
}
