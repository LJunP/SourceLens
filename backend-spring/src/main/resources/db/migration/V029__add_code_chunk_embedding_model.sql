-- Track the embedding model used for each chunk vector so repeated scans only reuse compatible vectors.
ALTER TABLE `code_chunks`
    ADD COLUMN `embedding_model` VARCHAR(128) DEFAULT NULL COMMENT '生成 embedding 的 provider/model key' AFTER `embedding`,
    ADD INDEX `idx_code_chunks_embedding_model` (`scan_task_id`, `embedding_model`);
