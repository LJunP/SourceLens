-- V0.5 修复 agent_tasks 与 agent_task_steps 表的 JSON 类型在某些 JDBC/MySQL 驱动下反序列化 500 的问题
ALTER TABLE `agent_tasks` MODIFY COLUMN `input_json` LONGTEXT DEFAULT NULL;
ALTER TABLE `agent_tasks` MODIFY COLUMN `output_json` LONGTEXT DEFAULT NULL;
ALTER TABLE `agent_task_steps` MODIFY COLUMN `input_json` LONGTEXT DEFAULT NULL;
ALTER TABLE `agent_task_steps` MODIFY COLUMN `output_json` LONGTEXT DEFAULT NULL;
