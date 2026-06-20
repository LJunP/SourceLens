-- Agent 对话表
CREATE TABLE IF NOT EXISTS `conversations` (
    `id`              BIGINT AUTO_INCREMENT PRIMARY KEY,
    `project_id`      BIGINT       NOT NULL,
    `agent_task_id`   BIGINT       DEFAULT NULL COMMENT '关联的Agent任务(可选)',
    `title`           VARCHAR(200) DEFAULT NULL COMMENT '对话标题,首条消息自动截取',
    `system_prompt`   TEXT         DEFAULT NULL COMMENT '系统提示词',
    `status`          VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE / ARCHIVED',
    `created_by`      BIGINT       NOT NULL,
    `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_project_id` (`project_id`),
    INDEX `idx_agent_task_id` (`agent_task_id`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Agent 对话消息表
CREATE TABLE IF NOT EXISTS `conversation_messages` (
    `id`                BIGINT AUTO_INCREMENT PRIMARY KEY,
    `conversation_id`   BIGINT       NOT NULL,
    `role`              VARCHAR(20)  NOT NULL COMMENT 'USER / ASSISTANT / SYSTEM / TOOL',
    `content`           MEDIUMTEXT   DEFAULT NULL COMMENT '消息文本内容',
    `tool_calls_json`   MEDIUMTEXT   DEFAULT NULL COMMENT '本轮LLM产生的工具调用列表JSON',
    `tool_results_json` MEDIUMTEXT   DEFAULT NULL COMMENT '工具执行结果列表JSON',
    `model_name`        VARCHAR(100) DEFAULT NULL COMMENT '使用的模型名称',
    `tokens_used`       INT          DEFAULT NULL COMMENT 'token消耗量',
    `duration_ms`       BIGINT       DEFAULT NULL COMMENT '耗时(毫秒)',
    `status`            VARCHAR(20)  NOT NULL DEFAULT 'COMPLETED' COMMENT 'STREAMING / COMPLETED / FAILED',
    `error_message`     TEXT         DEFAULT NULL,
    `created_at`        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_conversation_id` (`conversation_id`),
    INDEX `idx_conversation_created` (`conversation_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- agent_tasks 表新增 conversation_id 字段
ALTER TABLE `agent_tasks`
    ADD COLUMN `conversation_id` BIGINT DEFAULT NULL COMMENT '关联的对话ID' AFTER `scan_task_id`,
    ADD INDEX `idx_conversation_id` (`conversation_id`);