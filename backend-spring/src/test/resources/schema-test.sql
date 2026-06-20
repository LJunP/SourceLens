-- H2 兼容的测试 schema
CREATE TABLE IF NOT EXISTS users (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL,
    email         VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url    VARCHAR(500) DEFAULT NULL,
    status        VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted       TINYINT(1)   NOT NULL DEFAULT 0,
    CONSTRAINT uk_username UNIQUE (username),
    CONSTRAINT uk_email UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS projects (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    name              VARCHAR(100) NOT NULL,
    description       VARCHAR(500) DEFAULT NULL,
    primary_language  VARCHAR(30)  DEFAULT NULL,
    framework         VARCHAR(50)  DEFAULT NULL,
    status            VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    health_score      INT          DEFAULT NULL,
    created_by        BIGINT       NOT NULL,
    created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted           TINYINT(1)   NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS repositories (
    id                   BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id           BIGINT       NOT NULL,
    provider             VARCHAR(20)  NOT NULL DEFAULT 'GITHUB',
    owner                VARCHAR(100) NOT NULL,
    name                 VARCHAR(100) NOT NULL,
    url                  VARCHAR(500) NOT NULL,
    default_branch       VARCHAR(100) NOT NULL DEFAULT 'main',
    visibility           VARCHAR(20)  NOT NULL DEFAULT 'PRIVATE',
    auth_type            VARCHAR(20)  NOT NULL DEFAULT 'PAT',
    encrypted_token_ref  VARCHAR(500) DEFAULT NULL,
    last_synced_at       TIMESTAMP    DEFAULT NULL,
    status               VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted              TINYINT(1)   NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS scan_tasks (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id      BIGINT       NOT NULL,
    repository_id   BIGINT       NOT NULL,
    branch          VARCHAR(100) NOT NULL,
    commit_sha      VARCHAR(40)  DEFAULT NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    trigger_type    VARCHAR(20)  NOT NULL DEFAULT 'MANUAL',
    started_at      TIMESTAMP    DEFAULT NULL,
    finished_at     TIMESTAMP    DEFAULT NULL,
    error_message   TEXT         DEFAULT NULL,
    created_by      BIGINT       NOT NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted         TINYINT(1)   NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS scan_artifacts (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    scan_task_id    BIGINT       NOT NULL,
    artifact_type   VARCHAR(50)  NOT NULL,
    storage_path    VARCHAR(500) NOT NULL,
    summary_json    CLOB         DEFAULT NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);