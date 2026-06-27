ALTER TABLE `auto_repairs`
    ADD COLUMN `patch_artifact_path` VARCHAR(512) DEFAULT NULL COMMENT '生成补丁 artifact 路径'
    AFTER `diff_content`;
