CREATE TABLE audit_logs (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT       DEFAULT NULL,
    project_id      BIGINT       DEFAULT NULL,
    resource_type   VARCHAR(80)  NOT NULL,
    resource_id     BIGINT       DEFAULT NULL,
    action          VARCHAR(100) NOT NULL,
    status          VARCHAR(30)  NOT NULL,
    input_json      JSON         DEFAULT NULL,
    output_summary  TEXT         DEFAULT NULL,
    duration_ms     BIGINT       DEFAULT NULL,
    request_id      VARCHAR(120) DEFAULT NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_audit_logs_project (project_id),
    KEY idx_audit_logs_user (user_id),
    KEY idx_audit_logs_resource (resource_type, resource_id),
    KEY idx_audit_logs_action (action),
    KEY idx_audit_logs_created_at (created_at)
);
