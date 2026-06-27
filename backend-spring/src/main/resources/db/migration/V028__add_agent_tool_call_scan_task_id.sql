ALTER TABLE agent_tool_calls
    ADD COLUMN scan_task_id BIGINT DEFAULT NULL AFTER project_id,
    ADD INDEX idx_agent_tool_calls_scan_task_id (scan_task_id);
