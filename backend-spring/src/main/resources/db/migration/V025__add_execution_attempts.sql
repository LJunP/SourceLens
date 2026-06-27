CREATE TABLE IF NOT EXISTS `execution_attempts` (
    `id`              BIGINT AUTO_INCREMENT PRIMARY KEY,
    `task_id`         BIGINT NOT NULL,
    `attempt_no`      INT NOT NULL,
    `status`          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `current_step`    VARCHAR(80) DEFAULT NULL,
    `error_message`   TEXT DEFAULT NULL,
    `started_at`      DATETIME DEFAULT NULL,
    `finished_at`     DATETIME DEFAULT NULL,
    `created_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_execution_attempt_task` (`task_id`, `attempt_no`),
    UNIQUE KEY `uk_execution_attempt_no` (`task_id`, `attempt_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='统一执行任务尝试表';

ALTER TABLE `execution_tasks`
    ADD COLUMN `current_attempt_id` BIGINT DEFAULT NULL AFTER `current_step`;

ALTER TABLE `execution_steps`
    ADD COLUMN `attempt_id` BIGINT DEFAULT NULL AFTER `task_id`;

ALTER TABLE `execution_steps`
    DROP INDEX `uk_task_step`;

ALTER TABLE `execution_steps`
    ADD UNIQUE KEY `uk_attempt_step` (`attempt_id`, `step_key`);

CREATE INDEX `idx_execution_steps_attempt` ON `execution_steps` (`attempt_id`);
