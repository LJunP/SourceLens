# API 设计

## 通用约定

- Base URL: `http://localhost:8080/api`
- 认证: Bearer Token (签名 JWT)
- 响应格式: `Result<T>`
- 分页: `?page=1&pageSize=20`
- API 响应不得返回 GitHub token、GitHub App installation token、LLM API key 或 encrypted token 字段。

### 统一响应结构

```json
{
  "code": "SUCCESS",
  "message": "ok",
  "data": {}
}
```

### 错误码

| code | 含义 |
|------|------|
| SUCCESS | 成功 |
| UNAUTHORIZED | 未认证 |
| FORBIDDEN | 无权限 |
| NOT_FOUND | 资源不存在 |
| BAD_REQUEST | 参数错误 |
| INTERNAL_ERROR | 服务器内部错误 |

## 认证模块

### POST /api/auth/register

注册新用户。

**Request:**
```json
{
  "username": "string (3-50)",
  "email": "string",
  "password": "string (6-100)"
}
```

**Response:** `Result<UserResponse>`

`UserResponse` 只包含 `id`、`username`、`email`、`avatarUrl`、`status`、`createdAt`、`updatedAt` 等安全展示字段；认证接口不得返回 `passwordHash`、`deleted` 或其他用户实体内部字段。

### POST /api/auth/login

用户登录,返回签名 JWT。

**Request:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:** `Result<LoginResponse>`
```json
{
  "token": "signed-jwt-string",
  "userId": 1,
  "username": "string"
}
```

### GET /api/auth/me

获取当前用户信息。需要认证。

**Response:** `Result<UserResponse>`

同注册接口，响应不得包含 `passwordHash`、`deleted` 或其他内部字段。

## 项目模块

### POST /api/projects

创建项目。

**Request:**
```json
{
  "name": "string",
  "description": "string (可选)"
}
```

### GET /api/projects

分页查询当前用户的项目列表。

**Query:** `?page=1&pageSize=20`

### GET /api/projects/{projectId}

获取项目详情。

### PUT /api/projects/{projectId}

更新项目信息。

### DELETE /api/projects/{projectId}

删除项目(逻辑删除)。

## 仓库模块

### POST /api/projects/{projectId}/repositories

添加仓库。

生产环境默认使用 GitHub App installation，不使用长效 PAT。`token` 字段仅作为开发或旧兼容路径，生产 profile 默认拒绝新增或更新 PAT 凭据。

**Request:**
```json
{
  "url": "https://github.com/owner/repo",
  "defaultBranch": "main"
}
```

### GET /api/projects/{projectId}/repositories

查询项目下所有仓库。

响应中不会返回明文 token 或 encrypted token。

### GET /api/repositories/{repositoryId}

获取仓库详情。需要项目所有权。

### PUT /api/repositories/{repositoryId}

更新仓库 URL、默认分支或开发兼容 PAT。生产 profile 下 PAT 更新会被拒绝。

### DELETE /api/repositories/{repositoryId}

删除仓库。

### PUT /api/repositories/{repositoryId}/github-app-installation

绑定 GitHub App installation。

**Request:**
```json
{
  "installationId": 123456,
  "accountLogin": "owner-or-org",
  "accountType": "Organization",
  "repositorySelection": "selected",
  "permissionsJson": "{\"contents\":\"write\",\"pull_requests\":\"write\"}"
}
```

### GET /api/repositories/{repositoryId}/github-app-installation

获取当前仓库已绑定的 GitHub App installation 元数据。

### DELETE /api/repositories/{repositoryId}/github-app-installation

禁用当前仓库的 GitHub App installation 绑定。

## 扫描任务模块

### POST /api/repositories/{repositoryId}/scan-tasks

创建扫描任务。

**Request:**
```json
{
  "branch": "main"
}
```

### GET /api/projects/{projectId}/scan-tasks

分页查询项目的扫描任务。

### GET /api/scan-tasks/{id}

获取扫描任务详情。

## 分析模块

### GET /api/scan-tasks/{id}/artifacts

获取扫描产物(文件树、语言统计、API 清单等)。

### GET /api/scan-tasks/{id}/symbols

获取代码符号列表。

**Query:** `?kind=CLASS|METHOD|FIELD`

### GET /api/scan-tasks/{id}/relations

获取代码关系列表。

**Query:** `?relationType=CALLS|EXTENDS|IMPLEMENTS|DEPENDS_ON`

### GET /api/scan-tasks/{id}/graph

获取完整依赖图(nodes + edges + summary)。

## Agent 模块

### POST /api/agent-tasks

创建 Agent 分析任务。

**Request:**
```json
{
  "projectId": 1,
  "scanTaskId": 1,
  "taskType": "ARCHITECTURE_REVIEW",
  "title": "架构审查",
  "description": "可选",
  "priority": "HIGH|MEDIUM|LOW",
  "inputJson": "{}"
}
```

### GET /api/agent-tasks

分页查询 Agent 任务。

### GET /api/agent-tasks/{id}

获取 Agent 任务详情(含步骤)。

### POST /api/agent-tasks/{id}/start

启动 Agent 任务。

### POST /api/agent-tasks/{id}/complete

完成 Agent 任务。

## Issue 拆解模块

### POST /api/issue-decompositions

创建 Issue 拆解任务。

### GET /api/issue-decompositions

分页查询拆解任务。

### GET /api/issue-decompositions/{id}

获取拆解详情(含子任务)。

## CI 诊断模块

### POST /api/ci-diagnostics

创建 CI 诊断报告。

### GET /api/ci-diagnostics

分页查询诊断报告。

### GET /api/ci-diagnostics/{id}

获取诊断详情。

## PR 审查模块

### POST /api/pr-reviews

创建 PR 风险审查。

### GET /api/pr-reviews

分页查询审查记录。

### GET /api/pr-reviews/{id}

获取审查详情(含评论)。

## 执行任务与审计模块

### GET /api/projects/{projectId}/execution-tasks

分页查询项目统一执行任务。

### GET /api/projects/{projectId}/execution-tasks/{taskId}

获取执行任务详情，包含 attempts、steps 和 append-only logs。

### POST /api/projects/{projectId}/execution-tasks/{taskId}/cancel

取消执行任务。终态任务不能被覆盖。

### GET /api/projects/{projectId}/audit-logs

分页查询项目审计日志，支持按 resourceType、action、status 筛选。

### GET /api/projects/{projectId}/agent-tool-calls

分页查询项目 Agent 工具调用审计，支持按 toolName 和 success 筛选。

### GET /api/projects/{projectId}/github-webhook-deliveries

分页查询项目相关 GitHub webhook delivery，支持按 eventType 和 status 筛选。

## 仪表盘模块

### GET /api/dashboard/stats

获取全局统计数据(项目数、扫描数、任务数等)。

### GET /api/dashboard/recent-scans

获取最近扫描记录。

## 系统模块

### GET /api/health

健康检查(无需认证)。

### GET /actuator/health

Spring Boot Actuator 健康检查。公开用于探活。

### GET /actuator/info

Spring Boot Actuator 基础信息。公开，但不得包含敏感配置。

### GET /actuator/metrics

Spring Boot Actuator 指标。需要认证，不应直接暴露公网。

### GET /api-docs

OpenAPI 文档。仅 dev/test profile 开放。

### GET /swagger-ui.html

Swagger UI。仅 dev/test profile 开放。
