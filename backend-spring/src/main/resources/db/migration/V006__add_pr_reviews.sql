-- V0.8 PR 审查主表
CREATE TABLE IF NOT EXISTS `pr_reviews` (
    `id`              BIGINT AUTO_INCREMENT PRIMARY KEY,
    `project_id`      BIGINT       NOT NULL,
    `scan_task_id`    BIGINT       DEFAULT NULL,
    `repository_id`   BIGINT       DEFAULT NULL,
    `pr_number`       INT          DEFAULT NULL,
    `pr_title`        VARCHAR(500) DEFAULT NULL,
    `pr_description`  TEXT         DEFAULT NULL,
    `branch`          VARCHAR(200) DEFAULT NULL,
    `base_branch`     VARCHAR(200) DEFAULT NULL,
    `commit_sha`      VARCHAR(40)  DEFAULT NULL,
    `author`          VARCHAR(100) DEFAULT NULL,
    `changed_files`   JSON         DEFAULT NULL,
    `diff_summary`    TEXT         DEFAULT NULL,
    `ci_status`       VARCHAR(30)  DEFAULT NULL,
    `status`          VARCHAR(20)  NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING / ANALYZING / COMPLETED / FAILED',
    `risk_level`      VARCHAR(20)  DEFAULT NULL COMMENT 'LOW / MEDIUM / HIGH / CRITICAL',
    `change_summary`  TEXT         DEFAULT NULL,
    `impact_scope`    JSON         DEFAULT NULL,
    `risks`           JSON         DEFAULT NULL,
    `test_suggestions` JSON        DEFAULT NULL,
    `merge_recommendation` VARCHAR(20) DEFAULT NULL COMMENT 'MERGE / CHANGES_REQUESTED / BLOCKED',
    `review_json`     JSON         DEFAULT NULL,
    `error_message`   TEXT         DEFAULT NULL,
    `created_by`      BIGINT       NOT NULL,
    `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted`         TINYINT(1)   NOT NULL DEFAULT 0,
    INDEX `idx_project_id` (`project_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_risk_level` (`risk_level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- V0.8 PR 审查行级评论表
CREATE TABLE IF NOT EXISTS `pr_review_comments` (
    `id`              BIGINT AUTO_INCREMENT PRIMARY KEY,
    `review_id`       BIGINT       NOT NULL,
    `file_path`       VARCHAR(500) NOT NULL,
    `line_number`     INT          DEFAULT NULL,
    `severity`        VARCHAR(10)  NOT NULL COMMENT 'INFO / WARNING / ERROR / CRITICAL',
    `category`        VARCHAR(50)  NOT NULL COMMENT 'SECURITY / PERFORMANCE / CORRECTNESS / STYLE / TEST / COMPATIBILITY',
    `message`         TEXT         NOT NULL,
    `suggestion`      TEXT         DEFAULT NULL,
    `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_review_id` (`review_id`),
    INDEX `idx_severity` (`severity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;