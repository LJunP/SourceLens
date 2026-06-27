CREATE TABLE IF NOT EXISTS `execution_tasks` (
    `id`              BIGINT AUTO_INCREMENT PRIMARY KEY,
    `project_id`      BIGINT NOT NULL,
    `repository_id`   BIGINT DEFAULT NULL,
    `task_type`       VARCHAR(40) NOT NULL COMMENT 'SCAN / AGENT / AUTO_REPAIR / CI / REVIEW',
    `source_type`     VARCHAR(40) DEFAULT NULL COMMENT '业务来源类型',
    `source_id`       BIGINT DEFAULT NULL COMMENT '业务来源记录 ID',
    `status`          VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING / QUEUED / RUNNING / WAITING_USER / SUCCESS / FAILED / CANCELLED',
    `current_step`    VARCHAR(80) DEFAULT NULL,
    `progress`        INT NOT NULL DEFAULT 0,
    `error_message`   TEXT DEFAULT NULL,
    `created_by`      BIGINT NOT NULL,
    `started_at`      DATETIME DEFAULT NULL,
    `finished_at`     DATETIME DEFAULT NULL,
    `created_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_project_created` (`project_id`, `created_at`),
    INDEX `idx_project_source` (`project_id`, `source_type`, `source_id`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='统一执行任务表';

CREATE TABLE IF NOT EXISTS `execution_steps` (
    `id`              BIGINT AUTO_INCREMENT PRIMARY KEY,
    `task_id`         BIGINT NOT NULL,
    `step_key`        VARCHAR(80) NOT NULL,
    `step_name`       VARCHAR(120) NOT NULL,
    `status`          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `log_summary`     TEXT DEFAULT NULL,
    `error_message`   TEXT DEFAULT NULL,
    `started_at`      DATETIME DEFAULT NULL,
    `finished_at`     DATETIME DEFAULT NULL,
    `created_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_task_id` (`task_id`),
    UNIQUE KEY `uk_task_step` (`task_id`, `step_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='统一执行任务步骤表';
