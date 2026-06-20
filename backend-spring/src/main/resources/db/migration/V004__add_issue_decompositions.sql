-- V0.6 需求拆解主表
CREATE TABLE IF NOT EXISTS `issue_decompositions` (
    `id`              BIGINT AUTO_INCREMENT PRIMARY KEY,
    `project_id`      BIGINT       NOT NULL,
    `scan_task_id`    BIGINT       DEFAULT NULL,
    `title`           VARCHAR(300) NOT NULL,
    `description`     TEXT         NOT NULL,
    `business_context` TEXT        DEFAULT NULL,
    `priority`        VARCHAR(10)  NOT NULL DEFAULT 'MEDIUM',
    `related_modules` JSON         DEFAULT NULL,
    `status`          VARCHAR(20)  NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING / PROCESSING / COMPLETED / FAILED',
    `understanding`   TEXT         DEFAULT NULL COMMENT '需求理解',
    `impact_modules`  JSON         DEFAULT NULL COMMENT '影响模块列表',
    `impact_apis`     JSON         DEFAULT NULL COMMENT '影响 API 列表',
    `impact_db`       JSON         DEFAULT NULL COMMENT '影响数据库表列表',
    `risks`           JSON         DEFAULT NULL COMMENT '风险点列表',
    `dependencies`    JSON         DEFAULT NULL COMMENT '依赖事项列表',
    `acceptance`      JSON         DEFAULT NULL COMMENT '验收标准列表',
    `suggested_branch` VARCHAR(200) DEFAULT NULL,
    `suggested_commit` TEXT         DEFAULT NULL COMMENT '建议 commit 粒度',
    `output_json`     JSON         DEFAULT NULL,
    `error_message`   TEXT         DEFAULT NULL,
    `created_by`      BIGINT       NOT NULL,
    `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted`         TINYINT(1)   NOT NULL DEFAULT 0,
    INDEX `idx_project_id` (`project_id`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- V0.6 拆解后的子任务表
CREATE TABLE IF NOT EXISTS `issue_tasks` (
    `id`              BIGINT AUTO_INCREMENT PRIMARY KEY,
    `decomposition_id` BIGINT      NOT NULL,
    `task_order`      INT          NOT NULL,
    `category`        VARCHAR(30)  NOT NULL COMMENT 'DEVELOP / TEST',
    `title`           VARCHAR(300) NOT NULL,
    `description`     TEXT         DEFAULT NULL,
    `impact_files`    JSON         DEFAULT NULL COMMENT '影响文件列表',
    `risk_level`      VARCHAR(10)  DEFAULT 'LOW',
    `test_suggestions` TEXT        DEFAULT NULL,
    `estimated_hours` DOUBLE       DEFAULT NULL,
    `status`          VARCHAR(20)  NOT NULL DEFAULT 'TODO' COMMENT 'TODO / IN_PROGRESS / DONE / SKIPPED',
    `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_decomposition_id` (`decomposition_id`),
    INDEX `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;