CREATE TABLE IF NOT EXISTS `github_webhook_delivery_projects` (
    `id`            BIGINT AUTO_INCREMENT PRIMARY KEY,
    `delivery_id`   VARCHAR(120) NOT NULL,
    `project_id`    BIGINT       NOT NULL,
    `repository_id` BIGINT       NOT NULL,
    `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_webhook_delivery_project_repo` (`delivery_id`, `project_id`, `repository_id`),
    KEY `idx_webhook_delivery_project` (`project_id`, `created_at`),
    KEY `idx_webhook_delivery_repo` (`repository_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
