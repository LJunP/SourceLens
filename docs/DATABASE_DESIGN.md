# 数据库设计

## 概览

- 数据库: MySQL 8.4
- 字符集: utf8mb4 / utf8mb4_unicode_ci
- ORM: MyBatis-Plus (逻辑删除: `deleted` 字段)
- 迁移: Flyway (V001 ~ V032)

## 表结构

### users (V001)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK AUTO_INCREMENT | 主键 |
| username | VARCHAR(50) UNIQUE | 用户名 |
| email | VARCHAR(100) UNIQUE | 邮箱 |
| password_hash | VARCHAR(255) | BCrypt 密码哈希 |
| avatar_url | VARCHAR(500) | 头像 URL |
| status | VARCHAR(20) DEFAULT 'ACTIVE' | 状态 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |
| deleted | TINYINT(1) DEFAULT 0 | 逻辑删除 |

### projects (V001)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK AUTO_INCREMENT | 主键 |
| name | VARCHAR(100) | 项目名称 |
| description | VARCHAR(500) | 项目描述 |
| primary_language | VARCHAR(30) | 主语言 |
| framework | VARCHAR(50) | 框架 |
| status | VARCHAR(20) DEFAULT 'ACTIVE' | 状态 |
| health_score | INT | 健康评分 |
| created_by | BIGINT | 创建者 ID |
| created_at / updated_at | DATETIME | 时间戳 |
| deleted | TINYINT(1) DEFAULT 0 | 逻辑删除 |

### repositories (V001)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK AUTO_INCREMENT | 主键 |
| project_id | BIGINT | 所属项目 |
| provider | VARCHAR(20) DEFAULT 'GITHUB' | 仓库提供商 |
| owner | VARCHAR(100) | 仓库所有者 |
| name | VARCHAR(100) | 仓库名称 |
| url | VARCHAR(500) | 仓库 URL |
| default_branch | VARCHAR(100) DEFAULT 'main' | 默认分支 |
| visibility | VARCHAR(20) DEFAULT 'PRIVATE' | 可见性 |
| auth_type | VARCHAR(20) DEFAULT 'PAT' | 认证类型。生产路径应使用 GITHUB_APP，PAT 仅开发兼容 |
| encrypted_token_ref | VARCHAR(500) | 旧 PAT 兼容字段，不返回前端 |
| last_synced_at | DATETIME | 最后同步时间 |
| status / created_at / updated_at / deleted | — | 通用字段 |

### scan_tasks (V001)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK AUTO_INCREMENT | 主键 |
| project_id | BIGINT | 所属项目 |
| repository_id | BIGINT | 所属仓库 |
| branch | VARCHAR(100) | 扫描分支 |
| commit_sha | VARCHAR(40) | 提交 SHA |
| status | VARCHAR(20) DEFAULT 'PENDING' | PENDING/RUNNING/SUCCESS/FAILED/CANCELLED |
| trigger_type | VARCHAR(20) DEFAULT 'MANUAL' | 触发类型 |
| started_at / finished_at | DATETIME | 执行时间 |
| error_message | TEXT | 错误信息 |
| created_by | BIGINT | 创建者 |
| created_at / updated_at / deleted | — | 通用字段 |

### scan_artifacts (V001)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK AUTO_INCREMENT | 主键 |
| scan_task_id | BIGINT | 所属扫描任务 |
| artifact_type | VARCHAR(50) | FILE_TREE / LANGUAGE_STATS / API_LIST / ENTITY_LIST |
| storage_path | VARCHAR(500) | 产物存储路径 |
| summary_json | JSON | 产物摘要 |
| created_at | DATETIME | 创建时间 |

### code_symbols (V002)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK AUTO_INCREMENT | 主键 |
| scan_task_id | BIGINT | 所属扫描任务 |
| symbol_id | VARCHAR(500) | 符号唯一标识 |
| name | VARCHAR(500) | 符号名称 |
| kind | VARCHAR(50) | CLASS / METHOD / FIELD / FUNCTION 等 |
| file_path | VARCHAR(500) | 所在文件 |
| package_name | VARCHAR(500) | 包名 |
| line_number | INT | 行号 |
| created_at | DATETIME | 创建时间 |

### code_relations (V002)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK AUTO_INCREMENT | 主键 |
| scan_task_id | BIGINT | 所属扫描任务 |
| source_id | VARCHAR(500) | 源符号 ID |
| target_id | VARCHAR(500) | 目标符号 ID |
| relation_type | VARCHAR(50) | EXTENDS / IMPLEMENTS / CALLS / DEPENDS_ON |
| file_path | VARCHAR(500) | 关系所在文件 |
| line_number | INT | 行号 |
| created_at | DATETIME | 创建时间 |

### agent_tasks (V003)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK AUTO_INCREMENT | 主键 |
| project_id | BIGINT | 所属项目 |
| scan_task_id | BIGINT | 关联扫描任务(可选) |
| task_type | VARCHAR(50) | ARCHITECTURE_REVIEW / RISK_SCAN / CHANGE_IMPACT / CUSTOM |
| title | VARCHAR(200) | 任务标题 |
| description | TEXT | 任务描述 |
| status | VARCHAR(20) DEFAULT 'PENDING' | PENDING/RUNNING/COMPLETED/FAILED |
| priority | VARCHAR(10) DEFAULT 'MEDIUM' | HIGH / MEDIUM / LOW |
| input_json | TEXT | 输入参数 JSON |
| output_json | TEXT | 输出结果 JSON |
| summary | TEXT | 结果摘要 |
| error_message | TEXT | 错误信息 |
| started_at / finished_at | DATETIME | 执行时间 |
| created_at / updated_at / deleted | — | 通用字段 |

### agent_task_steps (V003)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK AUTO_INCREMENT | 主键 |
| task_id | BIGINT | 所属 Agent 任务 |
| step_order | INT | 步骤序号 |
| step_type | VARCHAR(50) | 步骤类型 |
| tool_name | VARCHAR(100) | 调用工具名 |
| description | TEXT | 步骤描述 |
| input_json / output_json | TEXT | 输入/输出 JSON |
| status | VARCHAR(20) | PENDING/RUNNING/SUCCESS/FAILED |
| error_message | TEXT | 错误信息 |
| duration_ms | BIGINT | 耗时(毫秒) |
| created_at | DATETIME | 创建时间 |

### issue_decompositions (V004)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK AUTO_INCREMENT | 主键 |
| project_id | BIGINT | 所属项目 |
| title | VARCHAR(200) | 标题 |
| description | TEXT | 描述 |
| status | VARCHAR(20) DEFAULT 'PENDING' | 状态 |
| total_tasks / completed_tasks | INT | 子任务统计 |
| created_at / updated_at / deleted | — | 通用字段 |

### issue_tasks (V004)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK AUTO_INCREMENT | 主键 |
| decomposition_id | BIGINT | 所属拆解 |
| title | VARCHAR(200) | 标题 |
| description | TEXT | 描述 |
| priority | VARCHAR(10) DEFAULT 'MEDIUM' | 优先级 |
| status | VARCHAR(20) DEFAULT 'PENDING' | 状态 |
| created_at / updated_at / deleted | — | 通用字段 |

### ci_diagnostics (V005)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK AUTO_INCREMENT | 主键 |
| project_id | BIGINT | 所属项目 |
| pipeline_id | VARCHAR(100) | CI 流水线 ID |
| status | VARCHAR(20) DEFAULT 'PENDING' | 状态 |
| error_log | TEXT | 错误日志 |
| diagnosis_json | TEXT | 诊断结果 JSON |
| created_at / updated_at / deleted | — | 通用字段 |

### pr_reviews (V006)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK AUTO_INCREMENT | 主键 |
| project_id | BIGINT | 所属项目 |
| repository_id | BIGINT | 所属仓库 |
| pr_number | INT | PR 编号 |
| pr_title | VARCHAR(500) | PR 标题 |
| status | VARCHAR(20) DEFAULT 'PENDING' | 状态 |
| risk_level | VARCHAR(20) | LOW / MEDIUM / HIGH / CRITICAL |
| summary | TEXT | 审查摘要 |
| created_at / updated_at / deleted | — | 通用字段 |

### pr_review_comments (V006)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK AUTO_INCREMENT | 主键 |
| review_id | BIGINT | 所属审查 |
| file_path | VARCHAR(500) | 文件路径 |
| line_number | INT | 行号 |
| comment_type | VARCHAR(50) | RISK / SUGGESTION / ISSUE |
| severity | VARCHAR(20) | INFO / WARNING / ERROR |
| message | TEXT | 评论内容 |
| suggestion | TEXT | 修改建议 |
| created_at | DATETIME | 创建时间 |

### code_chunks (V010 / V011)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK AUTO_INCREMENT | 主键 |
| scan_task_id | BIGINT | 所属扫描任务 |
| file_path | VARCHAR(500) | 文件路径 |
| symbol_id | VARCHAR(500) | 关联符号 ID |
| content_hash | VARCHAR(128) | 内容 hash |
| content | MEDIUMTEXT | 切片内容 |
| embedding_json | JSON | 向量或向量占位数据 |
| created_at | DATETIME | 创建时间 |

### auto_repairs (V012 / V015 / V024 / V030)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK AUTO_INCREMENT | 主键 |
| project_id / repository_id | BIGINT | 所属项目和仓库 |
| scan_task_id | BIGINT NULL | 来源扫描任务。报告风险项创建的修复候选必须回到同项目、同仓库且成功完成的扫描任务 |
| file_path | VARCHAR(500) | 目标文件 |
| status | VARCHAR(30) | PENDING/RUNNING/PATCH_READY/PR_RUNNING/PR_CREATED/FAILED/CANCELLED |
| patch_artifact_path | VARCHAR(500) | patch artifact 路径 |
| pr_url / pr_branch | VARCHAR(500) | 受控 PR 信息 |
| active_lock_key | VARCHAR(700) | 仓库文件级活跃锁 |
| created_at / updated_at / deleted | — | 通用字段 |

### agent_tool_calls (V014)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK AUTO_INCREMENT | 主键 |
| project_id / conversation_id | BIGINT | 项目和会话 |
| tool_name | VARCHAR(100) | 工具名 |
| permission_level | VARCHAR(30) | READ_ONLY / WRITE_PATCH / EXEC_TEST / CREATE_PR |
| arguments_json | TEXT | 已脱敏参数 |
| result_summary | TEXT | 已脱敏结果摘要 |
| success | TINYINT(1) | 是否成功 |
| error_message | TEXT | 已脱敏错误 |
| duration_ms | BIGINT | 耗时 |
| created_by / created_at | — | 创建信息 |

### execution_tasks / execution_attempts / execution_steps / execution_logs (V016 / V022 / V025 / V026)

| 表 | 说明 |
|----|------|
| execution_tasks | 统一执行任务父表，按 project/repository/source 关联业务任务 |
| execution_attempts | 同一业务来源的多次执行尝试，防止旧 attempt 覆盖新结果 |
| execution_steps | attempt-scoped 步骤状态、摘要和错误 |
| execution_logs | append-only 生命周期日志，用于排障和审计 |

关键约束：

- `SUCCESS`、`FAILED`、`CANCELLED` 为终态，不应被迟到异步结果覆盖。
- `source_type + source_id` 通过唯一约束避免重复父任务。
- 日志和错误摘要统一脱敏与限长，不保存 token、源码正文、完整 diff 或大块构建输出。

### artifact_records (V017)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK AUTO_INCREMENT | 主键 |
| project_id / repository_id / scan_task_id | BIGINT | 归属信息 |
| artifact_type | VARCHAR(50) | PATCH / REPORT / SCAN 等 |
| storage_path | VARCHAR(500) | 存储路径 |
| summary_json | JSON | 摘要元数据 |
| created_by / created_at | — | 创建信息 |

### github_app_installations (V018)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK AUTO_INCREMENT | 主键 |
| repository_id | BIGINT | 绑定仓库 |
| installation_id | BIGINT | GitHub App installation id |
| account_login / account_type | VARCHAR | 安装账号信息 |
| repository_selection | VARCHAR(50) | all / selected |
| permissions_json | JSON | installation 权限摘要 |
| status | VARCHAR(20) | ACTIVE / DISABLED |
| created_at / updated_at / deleted | — | 通用字段 |

说明：不保存 installation access token。后端运行时短期换取。

### github_webhook_deliveries / github_webhook_delivery_projects (V019 / V021 / V027)

| 表 | 说明 |
|----|------|
| github_webhook_deliveries | 记录 delivery id、event、status、签名校验和处理结果，支持幂等 |
| github_webhook_delivery_projects | delivery 到 project/repository 的映射，支持项目级查询 |

V027 会把两张表的 `delivery_id` 及 webhook 主表的 `event_type`、`status` 统一为 `utf8mb4_unicode_ci`，避免 MySQL 8 默认 `utf8mb4_0900_ai_ci` 与显式 `utf8mb4_unicode_ci` 混用时跨表比较触发 `Illegal mix of collations`。

### audit_logs (V020)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK AUTO_INCREMENT | 主键 |
| user_id / project_id | BIGINT | 操作主体与项目 |
| resource_type / resource_id | VARCHAR/BIGINT | 资源类型与 id |
| action | VARCHAR(100) | 操作名 |
| status | VARCHAR(20) | SUCCESS / FAILED |
| input_json | TEXT | 已脱敏输入摘要 |
| output_summary | TEXT | 已脱敏输出摘要 |
| duration_ms | BIGINT | 耗时 |
| request_id | VARCHAR(100) | 请求链路 id |
| created_at | DATETIME | 创建时间 |

## ER 关系

```
users 1──N projects
projects 1──N repositories
projects 1──N scan_tasks
repositories 1──N scan_tasks
scan_tasks 1──N scan_artifacts
scan_tasks 1──N code_symbols
scan_tasks 1──N code_relations
scan_tasks 1──N code_chunks
projects 1──N agent_tasks
scan_tasks 1──N agent_tasks
agent_tasks 1──N agent_task_steps
projects 1──N agent_tool_calls
projects 1──N execution_tasks
execution_tasks 1──N execution_attempts
execution_attempts 1──N execution_steps
execution_tasks 1──N execution_logs
projects 1──N artifact_records
repositories 1──1 github_app_installations
projects 1──N github_webhook_delivery_projects
projects 1──N audit_logs
projects 1──N auto_repairs
projects 1──N issue_decompositions
issue_decompositions 1──N issue_tasks
projects 1──N ci_diagnostics
projects 1──N pr_reviews
repositories 1──N pr_reviews
pr_reviews 1──N pr_review_comments
```
