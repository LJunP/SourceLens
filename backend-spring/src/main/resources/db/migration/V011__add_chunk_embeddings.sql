-- 给代码切片表增加向量字段
ALTER TABLE `code_chunks` ADD COLUMN `embedding` LONGTEXT DEFAULT NULL COMMENT '文本向量数据(float数组JSON)';
