-- Persist bounded workspace/module root metadata for monorepo code_chunks retrieval.
SET @code_chunks_workspace_root_exists = (
    SELECT COUNT(1)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'code_chunks'
      AND COLUMN_NAME = 'workspace_root'
);
SET @code_chunks_workspace_root_sql = IF(
    @code_chunks_workspace_root_exists = 0,
    'ALTER TABLE `code_chunks` ADD COLUMN `workspace_root` VARCHAR(255) DEFAULT NULL COMMENT ''Nearest package/workspace root relative to repository root'' AFTER `file_path`',
    'SELECT 1'
);
PREPARE code_chunks_workspace_root_stmt FROM @code_chunks_workspace_root_sql;
EXECUTE code_chunks_workspace_root_stmt;
DEALLOCATE PREPARE code_chunks_workspace_root_stmt;

SET @code_chunks_module_root_exists = (
    SELECT COUNT(1)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'code_chunks'
      AND COLUMN_NAME = 'module_root'
);
SET @code_chunks_module_root_sql = IF(
    @code_chunks_module_root_exists = 0,
    'ALTER TABLE `code_chunks` ADD COLUMN `module_root` VARCHAR(255) DEFAULT NULL COMMENT ''Standard monorepo module root such as apps/client or packages/admin'' AFTER `workspace_root`',
    'SELECT 1'
);
PREPARE code_chunks_module_root_stmt FROM @code_chunks_module_root_sql;
EXECUTE code_chunks_module_root_stmt;
DEALLOCATE PREPARE code_chunks_module_root_stmt;

SET @idx_code_chunks_scan_module_root_exists = (
    SELECT COUNT(1)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'code_chunks'
      AND INDEX_NAME = 'idx_code_chunks_scan_module_root'
);
SET @idx_code_chunks_scan_module_root_sql = IF(
    @idx_code_chunks_scan_module_root_exists = 0,
    'ALTER TABLE `code_chunks` ADD INDEX `idx_code_chunks_scan_module_root` (`scan_task_id`, `module_root`, `file_path`(128))',
    'SELECT 1'
);
PREPARE idx_code_chunks_scan_module_root_stmt FROM @idx_code_chunks_scan_module_root_sql;
EXECUTE idx_code_chunks_scan_module_root_stmt;
DEALLOCATE PREPARE idx_code_chunks_scan_module_root_stmt;

SET @idx_code_chunks_scan_workspace_root_exists = (
    SELECT COUNT(1)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'code_chunks'
      AND INDEX_NAME = 'idx_code_chunks_scan_workspace_root'
);
SET @idx_code_chunks_scan_workspace_root_sql = IF(
    @idx_code_chunks_scan_workspace_root_exists = 0,
    'ALTER TABLE `code_chunks` ADD INDEX `idx_code_chunks_scan_workspace_root` (`scan_task_id`, `workspace_root`, `file_path`(128))',
    'SELECT 1'
);
PREPARE idx_code_chunks_scan_workspace_root_stmt FROM @idx_code_chunks_scan_workspace_root_sql;
EXECUTE idx_code_chunks_scan_workspace_root_stmt;
DEALLOCATE PREPARE idx_code_chunks_scan_workspace_root_stmt;
