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

CREATE TABLE IF NOT EXISTS github_app_installations (
    id                       BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id               BIGINT       NOT NULL,
    repository_id            BIGINT       NOT NULL,
    installation_id          BIGINT       NOT NULL,
    account_login            VARCHAR(120) NOT NULL,
    account_type             VARCHAR(40)  DEFAULT NULL,
    repository_selection     VARCHAR(40)  DEFAULT NULL,
    permissions_json         CLOB         DEFAULT NULL,
    status                   VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_by               BIGINT       DEFAULT NULL,
    created_at               TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at               TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted                  TINYINT(1)   NOT NULL DEFAULT 0,
    CONSTRAINT uk_github_app_installations_repo UNIQUE (repository_id)
);

CREATE TABLE IF NOT EXISTS github_webhook_deliveries (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    delivery_id     VARCHAR(120) NOT NULL,
    event_type      VARCHAR(80)  NOT NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'PROCESSED',
    result_json     CLOB         DEFAULT NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_github_webhook_deliveries_delivery UNIQUE (delivery_id)
);

CREATE TABLE IF NOT EXISTS github_webhook_delivery_projects (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    delivery_id     VARCHAR(120) NOT NULL,
    project_id      BIGINT       NOT NULL,
    repository_id   BIGINT       NOT NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_webhook_delivery_project_repo UNIQUE (delivery_id, project_id, repository_id)
);

CREATE TABLE IF NOT EXISTS scan_tasks (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id      BIGINT       NOT NULL,
    repository_id   BIGINT       NOT NULL,
    branch          VARCHAR(100) NOT NULL,
    commit_sha      VARCHAR(40)  DEFAULT NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    active_lock_key VARCHAR(120) DEFAULT NULL,
    trigger_type    VARCHAR(20)  NOT NULL DEFAULT 'MANUAL',
    started_at      TIMESTAMP    DEFAULT NULL,
    finished_at     TIMESTAMP    DEFAULT NULL,
    error_message   TEXT         DEFAULT NULL,
    created_by      BIGINT       NOT NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted         TINYINT(1)   NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_scan_task_active_lock
    ON scan_tasks (active_lock_key);

CREATE TABLE IF NOT EXISTS scan_artifacts (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    scan_task_id    BIGINT       NOT NULL,
    artifact_type   VARCHAR(50)  NOT NULL,
    storage_path    VARCHAR(500) NOT NULL,
    summary_json    CLOB         DEFAULT NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS code_chunks (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    scan_task_id    BIGINT       NOT NULL,
    file_path       VARCHAR(512) NOT NULL,
    workspace_root  VARCHAR(255) DEFAULT NULL,
    module_root     VARCHAR(255) DEFAULT NULL,
    content         CLOB         NOT NULL,
    start_line      INT          NOT NULL,
    end_line        INT          NOT NULL,
    content_hash    VARCHAR(64)  DEFAULT NULL,
    embedding       CLOB         DEFAULT NULL,
    embedding_model VARCHAR(120) DEFAULT NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_code_chunks_scan_module_root
    ON code_chunks (scan_task_id, module_root, file_path);

CREATE INDEX IF NOT EXISTS idx_code_chunks_scan_workspace_root
    ON code_chunks (scan_task_id, workspace_root, file_path);

CREATE TABLE IF NOT EXISTS agent_tool_calls (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    conversation_id  BIGINT       DEFAULT NULL,
    project_id       BIGINT       DEFAULT NULL,
    scan_task_id     BIGINT       DEFAULT NULL,
    tool_name        VARCHAR(100) NOT NULL,
    permission_level VARCHAR(30)  NOT NULL,
    arguments_json   CLOB         DEFAULT NULL,
    result_summary   CLOB         DEFAULT NULL,
    success          TINYINT(1)   NOT NULL DEFAULT 0,
    error_message    CLOB         DEFAULT NULL,
    duration_ms      BIGINT       DEFAULT NULL,
    created_by       BIGINT       DEFAULT NULL,
    created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT       DEFAULT NULL,
    project_id      BIGINT       DEFAULT NULL,
    resource_type   VARCHAR(80)  NOT NULL,
    resource_id     BIGINT       DEFAULT NULL,
    action          VARCHAR(100) NOT NULL,
    status          VARCHAR(30)  NOT NULL,
    input_json      CLOB         DEFAULT NULL,
    output_summary  CLOB         DEFAULT NULL,
    duration_ms     BIGINT       DEFAULT NULL,
    request_id      VARCHAR(120) DEFAULT NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auto_repairs (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id          BIGINT      NOT NULL,
    repository_id       BIGINT      NOT NULL,
    file_path           VARCHAR(512) NOT NULL,
    target_desc         CLOB        NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    active_lock_key     VARCHAR(120) DEFAULT NULL,
    branch_name         VARCHAR(100) DEFAULT NULL,
    diff_content        CLOB        DEFAULT NULL,
    patch_artifact_path VARCHAR(512) DEFAULT NULL,
    test_log            CLOB        DEFAULT NULL,
    pr_url              VARCHAR(512) DEFAULT NULL,
    error_message       CLOB        DEFAULT NULL,
    created_by          BIGINT      NOT NULL,
    created_at          TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_auto_repair_active_lock
    ON auto_repairs (active_lock_key);

CREATE TABLE IF NOT EXISTS execution_tasks (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id      BIGINT      NOT NULL,
    repository_id   BIGINT      DEFAULT NULL,
    task_type       VARCHAR(40) NOT NULL,
    source_type     VARCHAR(40) DEFAULT NULL,
    source_id       BIGINT      DEFAULT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    current_step    VARCHAR(80) DEFAULT NULL,
    current_attempt_id BIGINT   DEFAULT NULL,
    progress        INT         NOT NULL DEFAULT 0,
    error_message   CLOB        DEFAULT NULL,
    created_by      BIGINT      NOT NULL,
    started_at      TIMESTAMP   DEFAULT NULL,
    finished_at     TIMESTAMP   DEFAULT NULL,
    created_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS execution_attempts (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    task_id         BIGINT      NOT NULL,
    attempt_no      INT         NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    current_step    VARCHAR(80) DEFAULT NULL,
    error_message   CLOB        DEFAULT NULL,
    started_at      TIMESTAMP   DEFAULT NULL,
    finished_at     TIMESTAMP   DEFAULT NULL,
    created_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_execution_attempt_no UNIQUE (task_id, attempt_no)
);

CREATE TABLE IF NOT EXISTS execution_steps (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    task_id         BIGINT       NOT NULL,
    attempt_id      BIGINT       DEFAULT NULL,
    step_key        VARCHAR(80)  NOT NULL,
    step_name       VARCHAR(120) NOT NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    log_summary     CLOB         DEFAULT NULL,
    error_message   CLOB         DEFAULT NULL,
    started_at      TIMESTAMP    DEFAULT NULL,
    finished_at     TIMESTAMP    DEFAULT NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_execution_attempt_step UNIQUE (attempt_id, step_key)
);

CREATE TABLE IF NOT EXISTS execution_logs (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    task_id         BIGINT      NOT NULL,
    attempt_id      BIGINT      DEFAULT NULL,
    step_key        VARCHAR(80) DEFAULT NULL,
    level           VARCHAR(20) NOT NULL,
    message         CLOB        NOT NULL,
    created_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_execution_tasks_project_created
    ON execution_tasks (project_id, created_at);

CREATE INDEX IF NOT EXISTS idx_execution_tasks_project_source
    ON execution_tasks (project_id, source_type, source_id);

CREATE UNIQUE INDEX IF NOT EXISTS uk_execution_task_source
    ON execution_tasks (source_type, source_id);

CREATE INDEX IF NOT EXISTS idx_execution_attempt_task
    ON execution_attempts (task_id, attempt_no);

CREATE INDEX IF NOT EXISTS idx_execution_steps_attempt
    ON execution_steps (attempt_id);

CREATE INDEX IF NOT EXISTS idx_execution_logs_task_created
    ON execution_logs (task_id, created_at, id);

CREATE INDEX IF NOT EXISTS idx_execution_logs_attempt
    ON execution_logs (attempt_id, id);

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
    metadata_json   CLOB         DEFAULT NULL,
    created_by      BIGINT       DEFAULT NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
