ALTER TABLE `auto_repairs`
    ADD COLUMN `scan_task_id` BIGINT DEFAULT NULL COMMENT '来源扫描任务 ID'
    AFTER `repository_id`;

CREATE INDEX `idx_auto_repairs_scan_task_id`
    ON `auto_repairs` (`scan_task_id`);
