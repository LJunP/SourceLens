-- 代码切片表
CREATE TABLE IF NOT EXISTS `code_chunks` (
    `id`           BIGINT AUTO_INCREMENT PRIMARY KEY,
    `scan_task_id` BIGINT NOT NULL COMMENT '关联的扫描任务ID',
    `file_path`    VARCHAR(512) NOT NULL COMMENT '文件相对路径',
    `content`      MEDIUMTEXT NOT NULL COMMENT '切片代码内容',
    `start_line`   INT NOT NULL COMMENT '起始行号',
    `end_line`     INT NOT NULL COMMENT '结束行号',
    `content_hash` VARCHAR(64) DEFAULT NULL COMMENT '代码内容哈希',
    `created_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_scan_task_id` (`scan_task_id`),
    INDEX `idx_file_path` (`file_path`(128))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='代码切片表';
