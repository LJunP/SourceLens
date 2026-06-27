-- 受控自动修码记录表
CREATE TABLE IF NOT EXISTS `auto_repairs` (
    `id`             BIGINT AUTO_INCREMENT PRIMARY KEY,
    `project_id`     BIGINT NOT NULL,
    `repository_id`  BIGINT NOT NULL,
    `file_path`      VARCHAR(512) NOT NULL COMMENT '待修改文件的相对路径',
    `target_desc`    TEXT NOT NULL COMMENT '修改的目标描述',
    `status`         VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING / RUNNING / TEST_PASSED / TEST_FAILED / PR_CREATED / FAILED',
    `branch_name`    VARCHAR(100) DEFAULT NULL COMMENT '修改分支名',
    `diff_content`   LONGTEXT DEFAULT NULL COMMENT 'Git Diff 结果',
    `test_log`       LONGTEXT DEFAULT NULL COMMENT '测试运行日志',
    `pr_url`         VARCHAR(512) DEFAULT NULL COMMENT '创建成功的 PR 链接',
    `error_message`  TEXT DEFAULT NULL,
    `created_by`     BIGINT NOT NULL,
    `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_project_id` (`project_id`),
    INDEX `idx_repository_id` (`repository_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='受控自动修码记录表';
