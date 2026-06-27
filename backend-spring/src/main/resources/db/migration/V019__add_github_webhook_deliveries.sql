CREATE TABLE github_webhook_deliveries (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    delivery_id     VARCHAR(120) NOT NULL,
    event_type      VARCHAR(80)  NOT NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'PROCESSED',
    result_json     JSON         DEFAULT NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_github_webhook_deliveries_delivery (delivery_id),
    KEY idx_github_webhook_deliveries_event (event_type),
    KEY idx_github_webhook_deliveries_created_at (created_at)
);
