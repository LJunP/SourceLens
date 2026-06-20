-- V0.5 Agent 任务表
CREATE TABLE IF NOT EXISTS `agent_tasks` (
    `id`              BIGINT AUTO_INCREMENT PRIMARY KEY,
    `scan_task_id`    BIGINT       DEFAULT NULL COMMENT '关联的扫描任务(可选)',
    `project_id`      BIGINT       NOT NULL,
    `task_type`       VARCHAR(50)  NOT NULL COMMENT 'ARCHITECTURE_REVIEW / RISK_SCAN / CHANGE_IMPACT / CUSTOM',
    `title`           VARCHAR(300) NOT NULL,
    `description`     TEXT         DEFAULT NULL,
    `status`          VARCHAR(20)  NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING / RUNNING / COMPLETED / FAILED / CANCELLED',
    `priority`        VARCHAR(10)  NOT NULL DEFAULT 'MEDIUM' COMMENT 'HIGH / MEDIUM / LOW',
    `input_json`      JSON         DEFAULT NULL,
    `output_json`     JSON         DEFAULT NULL,
    `summary`         TEXT         DEFAULT NULL,
    `started_at`      DATETIME     DEFAULT NULL,
    `finished_at`     DATETIME     DEFAULT NULL,
    `error_message`   TEXT         DEFAULT NULL,
    `created_by`      BIGINT       NOT NULL,
    `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted`         TINYINT(1)   NOT NULL DEFAULT 0,
    INDEX `idx_project_id` (`project_id`),
    INDEX `idx_scan_task_id` (`scan_task_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_task_type` (`task_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- V0.5 Agent 任务步骤表
CREATE TABLE IF NOT EXISTS `agent_task_steps` (
    `id`              BIGINT AUTO_INCREMENT PRIMARY KEY,
    `task_id`         BIGINT       NOT NULL,
    `step_order`      INT          NOT NULL,
    `step_type`       VARCHAR(50)  NOT NULL COMMENT 'TOOL_CALL / ANALYSIS / DECISION / OUTPUT',
    `tool_name`       VARCHAR(100) DEFAULT NULL COMMENT '使用的工具名(如 search_code, read_file, analyze_diff)',
    `description`     TEXT         DEFAULT NULL,
    `input_json`      JSON         DEFAULT NULL,
    `output_json`     JSON         DEFAULT NULL,
    `status`          VARCHAR(20)  NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING / RUNNING / COMPLETED / FAILED / SKIPPED',
    `error_message`   TEXT         DEFAULT NULL,
    `duration_ms`     BIGINT       DEFAULT NULL,
    `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_task_id` (`task_id`),
    INDEX `idx_step_order` (`task_id`, `step_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;