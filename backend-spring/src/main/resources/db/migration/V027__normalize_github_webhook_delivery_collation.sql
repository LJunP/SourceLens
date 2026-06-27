ALTER TABLE github_webhook_deliveries
    DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    MODIFY delivery_id VARCHAR(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    MODIFY event_type VARCHAR(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    MODIFY status VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PROCESSED';

ALTER TABLE github_webhook_delivery_projects
    DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    MODIFY delivery_id VARCHAR(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;
