# API 设计

## 通用约定

- Base URL: `http://localhost:8080/api`
- 认证: Bearer Token (JWT, AES-256-GCM 加密)
- 响应格式: `Result<T>`
- 分页: `?page=1&pageSize=20`

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

**Response:** `Result<User>`

### POST /api/auth/login

用户登录,返回加密 JWT Token。

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
  "token": "encrypted-jwt-string",
  "username": "string"
}
```

### GET /api/auth/me

获取当前用户信息。需要认证。

**Response:** `Result<User>`

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

**Request:**
```json
{
  "url": "https://github.com/owner/repo",
  "defaultBranch": "main",
  "authType": "PAT",
  "token": "github-personal-access-token (可选)"
}
```

### GET /api/projects/{projectId}/repositories

查询项目下所有仓库。

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

## 仪表盘模块

### GET /api/dashboard/stats

获取全局统计数据(项目数、扫描数、任务数等)。

### GET /api/dashboard/recent-scans

获取最近扫描记录。

## 系统模块

### GET /api/health

健康检查(无需认证)。

### GET /api-docs

OpenAPI 文档。

### GET /swagger-ui.html

Swagger UI。