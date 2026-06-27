ALTER TABLE `scan_tasks`
    ADD COLUMN `active_lock_key` VARCHAR(120) DEFAULT NULL AFTER `status`;

ALTER TABLE `scan_tasks`
    ADD UNIQUE KEY `uk_scan_task_active_lock` (`active_lock_key`);
