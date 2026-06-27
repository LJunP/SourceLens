ALTER TABLE `execution_tasks`
    DROP INDEX `idx_project_source`;

ALTER TABLE `execution_tasks`
    ADD UNIQUE KEY `uk_execution_task_source` (`source_type`, `source_id`);
