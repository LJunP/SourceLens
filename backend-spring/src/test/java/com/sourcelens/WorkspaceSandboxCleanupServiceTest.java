package com.sourcelens;

import com.sourcelens.common.exception.BizException;
import com.sourcelens.module.workspace.service.WorkspaceSandboxCleanupService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.FileTime;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class WorkspaceSandboxCleanupServiceTest {

    @TempDir
    private Path tempDir;

    @Test
    void cleanupExpiredBefore_shouldDeleteOnlyExpiredSourceLensSandboxDirs() throws Exception {
        WorkspaceSandboxCleanupService service = newService();
        Path sandbox = tempDir.resolve("sandbox");
        Path expiredRepair = sandbox.resolve("repair-1");
        Path expiredPr = sandbox.resolve("autorepair-pr-2");
        Path freshRepair = sandbox.resolve("repair-3");
        Path unrelated = sandbox.resolve("repo-keep");
        Files.createDirectories(expiredRepair.resolve("nested"));
        Files.createDirectories(expiredPr);
        Files.createDirectories(freshRepair);
        Files.createDirectories(unrelated);
        Files.writeString(expiredRepair.resolve("nested/out.txt"), "old");

        Instant now = Instant.now();
        FileTime oldTime = FileTime.from(now.minusSeconds(7200));
        Files.setLastModifiedTime(expiredRepair, oldTime);
        Files.setLastModifiedTime(expiredPr, oldTime);
        Files.setLastModifiedTime(unrelated, oldTime);
        Files.setLastModifiedTime(freshRepair, FileTime.from(now));

        int deleted = service.cleanupExpiredBefore(now.minusSeconds(3600), 10);

        assertEquals(2, deleted);
        assertFalse(Files.exists(expiredRepair));
        assertFalse(Files.exists(expiredPr));
        assertTrue(Files.exists(freshRepair));
        assertTrue(Files.exists(unrelated));
    }

    @Test
    void cleanupExpiredBefore_shouldRespectBatchSize() throws Exception {
        WorkspaceSandboxCleanupService service = newService();
        Path sandbox = tempDir.resolve("sandbox");
        Path repair1 = sandbox.resolve("repair-1");
        Path repair2 = sandbox.resolve("repair-2");
        Files.createDirectories(repair1);
        Files.createDirectories(repair2);
        FileTime oldTime = FileTime.from(Instant.now().minusSeconds(7200));
        Files.setLastModifiedTime(repair1, oldTime);
        Files.setLastModifiedTime(repair2, oldTime);

        int deleted = service.cleanupExpiredBefore(Instant.now().minusSeconds(3600), 1);

        assertEquals(1, deleted);
        long remaining = Files.list(sandbox).filter(Files::isDirectory).count();
        assertEquals(1, remaining);
    }

    @Test
    void cleanupExpired_shouldRejectInvalidRetentionHours() {
        WorkspaceSandboxCleanupService service = newService();
        ReflectionTestUtils.setField(service, "retentionHours", 0);
        ReflectionTestUtils.setField(service, "cleanupBatchSize", 100);

        BizException ex = assertThrows(BizException.class, service::cleanupExpired);

        assertEquals("BAD_REQUEST", ex.getCode());
    }

    @Test
    void cleanupExpiredBefore_shouldRejectInvalidBatchSize() {
        WorkspaceSandboxCleanupService service = newService();

        BizException ex = assertThrows(BizException.class,
                () -> service.cleanupExpiredBefore(Instant.now(), 1001));

        assertEquals("BAD_REQUEST", ex.getCode());
    }

    private WorkspaceSandboxCleanupService newService() {
        WorkspaceSandboxCleanupService service = new WorkspaceSandboxCleanupService();
        ReflectionTestUtils.setField(service, "workspaceBasePath", tempDir.toString());
        ReflectionTestUtils.setField(service, "retentionHours", 24);
        ReflectionTestUtils.setField(service, "cleanupBatchSize", 100);
        return service;
    }
}
