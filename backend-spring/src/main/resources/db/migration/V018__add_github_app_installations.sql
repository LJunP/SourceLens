CREATE TABLE github_app_installations (
    id                       BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id               BIGINT       NOT NULL,
    repository_id            BIGINT       NOT NULL,
    installation_id          BIGINT       NOT NULL,
    account_login            VARCHAR(120) NOT NULL,
    account_type             VARCHAR(40)  DEFAULT NULL,
    repository_selection     VARCHAR(40)  DEFAULT NULL,
    permissions_json         JSON         DEFAULT NULL,
    status                   VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_by               BIGINT       DEFAULT NULL,
    created_at               DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at               DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted                  TINYINT(1)   NOT NULL DEFAULT 0,
    UNIQUE KEY uk_github_app_installations_repo (repository_id),
    KEY idx_github_app_installations_project (project_id),
    KEY idx_github_app_installations_installation (installation_id)
);
