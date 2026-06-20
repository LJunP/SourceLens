CREATE TABLE llm_configs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL COMMENT '所属用户',
    provider VARCHAR(32) NOT NULL DEFAULT 'OPENAI' COMMENT 'OPENAI/ANTHROPIC/DEEPSEEK/CUSTOM',
    model_name VARCHAR(128) NOT NULL COMMENT '模型名称, 如 gpt-4o / claude-3-opus / deepseek-chat',
    api_key VARCHAR(512) NOT NULL COMMENT 'API Key (加密存储)',
    base_url VARCHAR(512) NOT NULL COMMENT 'API 地址, 如 https://api.openai.com/v1',
    temperature DECIMAL(3,2) DEFAULT 0.70 COMMENT '温度参数',
    max_tokens INT DEFAULT 4096 COMMENT '最大 token 数',
    is_active TINYINT(1) DEFAULT 0 COMMENT '是否为当前激活配置',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted TINYINT(1) DEFAULT 0,
    INDEX idx_llm_configs_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='LLM 模型配置';