CREATE TABLE IF NOT EXISTS artifact_records (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id      BIGINT       DEFAULT NULL,
    repository_id   BIGINT       DEFAULT NULL,
    owner_type      VARCHAR(40)  NOT NULL,
    owner_id        BIGINT       NOT NULL,
    artifact_type   VARCHAR(80)  NOT NULL,
    storage_path    VARCHAR(1000) NOT NULL,
    content_type    VARCHAR(120) DEFAULT NULL,
    size_bytes      BIGINT       NOT NULL DEFAULT 0,
    checksum_sha256 VARCHAR(64)  DEFAULT NULL,
    metadata_json   JSON         DEFAULT NULL,
    created_by      BIGINT       DEFAULT NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_artifact_owner (owner_type, owner_id),
    INDEX idx_artifact_project (project_id),
    INDEX idx_artifact_repository (repository_id),
    INDEX idx_artifact_type (artifact_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
