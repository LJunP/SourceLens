-- V0.2 修复 scan_artifacts.summary_json 列类型
-- MySQL JSON 类型在某些 JDBC 驱动版本下读取时返回 byte[] 导致 MyBatis-Plus 反序列化 500
-- 改为 LONGTEXT 确保始终以 String 形式返回
ALTER TABLE `scan_artifacts` MODIFY COLUMN `summary_json` LONGTEXT DEFAULT NULL;