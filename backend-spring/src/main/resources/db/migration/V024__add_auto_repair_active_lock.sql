ALTER TABLE `auto_repairs`
    ADD COLUMN `active_lock_key` VARCHAR(120) DEFAULT NULL COMMENT '同一仓库文件的活跃自动修复锁'
    AFTER `status`;

ALTER TABLE `auto_repairs`
    ADD UNIQUE KEY `uk_auto_repair_active_lock` (`active_lock_key`);
