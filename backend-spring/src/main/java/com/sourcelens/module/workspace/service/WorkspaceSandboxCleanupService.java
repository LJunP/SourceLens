package com.sourcelens.module.workspace.service;

import com.sourcelens.common.exception.BizException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;

@Slf4j
@Service
public class WorkspaceSandboxCleanupService {

    private static final List<String> CLEANABLE_PREFIXES = List.of("repair-", "autorepair-pr-");

    @Value("${sourcelens.workspace.base-path:/tmp/sourcelens/repos}")
    private String workspaceBasePath;

    @Value("${sourcelens.workspace.sandbox-cleanup-enabled:false}")
    private boolean cleanupEnabled;

    @Value("${sourcelens.workspace.sandbox-retention-hours:24}")
    private int retentionHours;

    @Value("${sourcelens.workspace.sandbox-cleanup-batch-size:100}")
    private int cleanupBatchSize;

    @Scheduled(cron = "${sourcelens.workspace.sandbox-cleanup-cron:0 15 4 * * *}")
    public void scheduledCleanup() {
        if (!cleanupEnabled) {
            return;
        }
        int deleted = cleanupExpired();
        if (deleted > 0) {
            log.info("workspace sandbox 过期清理完成, deleted={}, retentionHours={}, batchSize={}",
                    deleted, retentionHours, cleanupBatchSize);
        }
    }

    public int cleanupExpired() {
        validatePolicy();
        Instant cutoff = Instant.now().minus(retentionHours, ChronoUnit.HOURS);
        return cleanupExpiredBefore(cutoff, cleanupBatchSize);
    }

    public int cleanupExpiredBefore(Instant cutoff, int batchSize) {
        if (cutoff == null) {
            throw BizException.badRequest("workspace sandbox 清理截止时间不能为空");
        }
        if (batchSize < 1 || batchSize > 1000) {
            throw BizException.badRequest("workspace sandbox cleanup-batch-size 必须在 1 到 1000 之间");
        }

        Path sandboxRoot = sandboxRoot();
        if (!Files.isDirectory(sandboxRoot, LinkOption.NOFOLLOW_LINKS)) {
            return 0;
        }

        int deleted = 0;
        try (Stream<Path> children = Files.list(sandboxRoot)) {
            for (Path child : children
                    .filter(this::isCleanableSandboxPath)
                    .filter(path -> isOlderThan(path, cutoff))
                    .limit(batchSize)
                    .toList()) {
                deleteRecursively(child);
                deleted++;
            }
            return deleted;
        } catch (IOException e) {
            throw BizException.internal("workspace sandbox 清理失败: " + e.getMessage());
        }
    }

    private void validatePolicy() {
        if (retentionHours < 1) {
            throw BizException.badRequest("workspace sandbox retention-hours 必须大于等于 1");
        }
        if (cleanupBatchSize < 1 || cleanupBatchSize > 1000) {
            throw BizException.badRequest("workspace sandbox cleanup-batch-size 必须在 1 到 1000 之间");
        }
    }

    private boolean isCleanableSandboxPath(Path path) {
        Path sandboxRoot = sandboxRoot();
        Path normalized = path.toAbsolutePath().normalize();
        if (!normalized.getParent().equals(sandboxRoot)) {
            return false;
        }
        if (!Files.isDirectory(normalized, LinkOption.NOFOLLOW_LINKS)) {
            return false;
        }
        String name = normalized.getFileName().toString();
        return CLEANABLE_PREFIXES.stream().anyMatch(name::startsWith);
    }

    private boolean isOlderThan(Path path, Instant cutoff) {
        try {
            return Files.getLastModifiedTime(path, LinkOption.NOFOLLOW_LINKS).toInstant().isBefore(cutoff);
        } catch (IOException e) {
            log.warn("读取 workspace sandbox 修改时间失败: {}", path, e);
            return false;
        }
    }

    private void deleteRecursively(Path path) throws IOException {
        Path sandboxRoot = sandboxRoot();
        Path normalized = path.toAbsolutePath().normalize();
        if (!normalized.startsWith(sandboxRoot) || normalized.equals(sandboxRoot)) {
            throw new IOException("refuse to delete path outside sandbox root: " + path);
        }
        try (Stream<Path> stream = Files.walk(normalized)) {
            for (Path item : stream.sorted(Comparator.reverseOrder()).toList()) {
                Files.deleteIfExists(item);
            }
        }
    }

    private Path sandboxRoot() {
        return Path.of(workspaceBasePath, "sandbox").toAbsolutePath().normalize();
    }
}
