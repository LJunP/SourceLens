CREATE TABLE IF NOT EXISTS `agent_tool_calls` (
    `id`              BIGINT AUTO_INCREMENT PRIMARY KEY,
    `conversation_id` BIGINT       DEFAULT NULL,
    `project_id`      BIGINT       DEFAULT NULL,
    `tool_name`       VARCHAR(100) NOT NULL,
    `permission_level` VARCHAR(30) NOT NULL,
    `arguments_json`  JSON         DEFAULT NULL,
    `result_summary`  TEXT         DEFAULT NULL,
    `success`         TINYINT(1)   NOT NULL DEFAULT 0,
    `error_message`   TEXT         DEFAULT NULL,
    `duration_ms`     BIGINT       DEFAULT NULL,
    `created_by`      BIGINT       DEFAULT NULL,
    `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_conversation_id` (`conversation_id`),
    INDEX `idx_project_id` (`project_id`),
    INDEX `idx_tool_name` (`tool_name`),
    INDEX `idx_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
