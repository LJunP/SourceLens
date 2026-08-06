-- Speed up public-repo code_chunks lookup paths used by QA, report evidence and UI smoke.
-- The guards keep local databases safe when an index was applied manually during smoke diagnosis.
SET @idx_code_chunks_scan_id_exists = (
    SELECT COUNT(1)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'code_chunks'
      AND INDEX_NAME = 'idx_code_chunks_scan_id'
);
SET @idx_code_chunks_scan_id_sql = IF(
    @idx_code_chunks_scan_id_exists = 0,
    'ALTER TABLE `code_chunks` ADD INDEX `idx_code_chunks_scan_id` (`scan_task_id`, `id`)',
    'SELECT 1'
);
PREPARE idx_code_chunks_scan_id_stmt FROM @idx_code_chunks_scan_id_sql;
EXECUTE idx_code_chunks_scan_id_stmt;
DEALLOCATE PREPARE idx_code_chunks_scan_id_stmt;

SET @idx_code_chunks_scan_start_line_exists = (
    SELECT COUNT(1)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'code_chunks'
      AND INDEX_NAME = 'idx_code_chunks_scan_start_line'
);
SET @idx_code_chunks_scan_start_line_sql = IF(
    @idx_code_chunks_scan_start_line_exists = 0,
    'ALTER TABLE `code_chunks` ADD INDEX `idx_code_chunks_scan_start_line` (`scan_task_id`, `start_line`)',
    'SELECT 1'
);
PREPARE idx_code_chunks_scan_start_line_stmt FROM @idx_code_chunks_scan_start_line_sql;
EXECUTE idx_code_chunks_scan_start_line_stmt;
DEALLOCATE PREPARE idx_code_chunks_scan_start_line_stmt;

SET @idx_code_chunks_scan_file_line_exists = (
    SELECT COUNT(1)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'code_chunks'
      AND INDEX_NAME = 'idx_code_chunks_scan_file_line'
);
SET @idx_code_chunks_scan_file_line_sql = IF(
    @idx_code_chunks_scan_file_line_exists = 0,
    'ALTER TABLE `code_chunks` ADD INDEX `idx_code_chunks_scan_file_line` (`scan_task_id`, `file_path`(128), `start_line`)',
    'SELECT 1'
);
PREPARE idx_code_chunks_scan_file_line_stmt FROM @idx_code_chunks_scan_file_line_sql;
EXECUTE idx_code_chunks_scan_file_line_stmt;
DEALLOCATE PREPARE idx_code_chunks_scan_file_line_stmt;
