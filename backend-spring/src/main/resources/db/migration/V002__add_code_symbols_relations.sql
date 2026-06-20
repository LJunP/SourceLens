-- V0.4 代码符号表(类、方法、字段)
CREATE TABLE IF NOT EXISTS `code_symbols` (
    `id`            BIGINT AUTO_INCREMENT PRIMARY KEY,
    `scan_task_id`  BIGINT       NOT NULL,
    `symbol_id`     VARCHAR(300) NOT NULL COMMENT '符号唯一标识(pkg.ClassName#method)',
    `name`          VARCHAR(200) NOT NULL,
    `kind`          VARCHAR(30)  NOT NULL COMMENT 'CLASS/INTERFACE/ENUM/METHOD/FIELD',
    `package`       VARCHAR(300) DEFAULT NULL,
    `file_path`     VARCHAR(500) DEFAULT NULL,
    `line_number`   INT          DEFAULT 0,
    `end_line`      INT          DEFAULT NULL,
    `return_type`   VARCHAR(300) DEFAULT NULL,
    `parent_class`  VARCHAR(200) DEFAULT NULL,
    `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_scan_task_id` (`scan_task_id`),
    INDEX `idx_symbol_id` (`symbol_id`(191)),
    INDEX `idx_kind` (`kind`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- V0.4 代码关系表(继承、实现、调用、依赖)
CREATE TABLE IF NOT EXISTS `code_relations` (
    `id`              BIGINT AUTO_INCREMENT PRIMARY KEY,
    `scan_task_id`    BIGINT       NOT NULL,
    `source_id`       VARCHAR(300) NOT NULL COMMENT '源符号ID',
    `target_id`       VARCHAR(300) NOT NULL COMMENT '目标符号ID',
    `relation_type`   VARCHAR(30)  NOT NULL COMMENT 'EXTENDS/IMPLEMENTS/CALLS/DEPENDS_ON',
    `file_path`       VARCHAR(500) DEFAULT NULL,
    `line_number`     INT          DEFAULT 0,
    `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_scan_task_id` (`scan_task_id`),
    INDEX `idx_source_id` (`source_id`(191)),
    INDEX `idx_target_id` (`target_id`(191)),
    INDEX `idx_relation_type` (`relation_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;