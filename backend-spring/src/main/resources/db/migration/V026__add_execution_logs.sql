CREATE TABLE IF NOT EXISTS `execution_logs` (
    `id`          BIGINT AUTO_INCREMENT PRIMARY KEY,
    `task_id`     BIGINT NOT NULL,
    `attempt_id`  BIGINT DEFAULT NULL,
    `step_key`    VARCHAR(80) DEFAULT NULL,
    `level`       VARCHAR(20) NOT NULL,
    `message`     TEXT NOT NULL,
    `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_execution_logs_task_created` (`task_id`, `created_at`, `id`),
    INDEX `idx_execution_logs_attempt` (`attempt_id`, `id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='统一执行任务追加日志表';
