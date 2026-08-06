# API 设计

## 通用约定

- Base URL: `http://localhost:8080/api`
- 认证: Bearer Token (签名 JWT)
- 响应格式: `Result<T>`
- 分页: `?page=1&pageSize=20`
- API 响应不得返回 GitHub token、GitHub App installation token、LLM API key 或 encrypted token 字段。
- 本文记录当前核心 API 契约。若后端 controller、DTO 或安全边界变化，必须同步更新本文和对应 smoke / release evidence gate。
- `make api-design-check` 会从 Spring controller 静态提取当前业务路由，并校验这些路由是否已记录在本文；文档中未对应 Controller 的业务路由默认失败。`GET /api-docs` 是 Springdoc 框架端点，作为显式 docs-only allowlist 处理。该门禁还会比对 `@RequestBody` DTO 顶层字段与本文 `Request` JSON 示例的顶层字段，并检查明确嵌套 DTO 的一层字段，例如 `CodeQaRequest.evidenceRef` 和 `AutoRepairRequest.provenance`；`Map`、raw `String`、webhook body 和 dev/test seed 等特殊体按显式规则跳过或后续专项处理。`make verify` 已包含该门禁。

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

### POST /api/auth/logout

客户端登出入口。当前后端返回成功，客户端负责清理本地 token。

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

**Request:**
```json
{
  "name": "string",
  "description": "string (可选)"
}
```

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
  "defaultBranch": "main",
  "token": "dev-only optional PAT"
}
```

### GET /api/projects/{projectId}/repositories

查询项目下所有仓库。

响应中不会返回明文 token 或 encrypted token。

### GET /api/repositories/{repositoryId}

获取仓库详情。需要项目所有权。

### PUT /api/repositories/{repositoryId}

更新仓库 URL、默认分支或开发兼容 PAT。生产 profile 下 PAT 更新会被拒绝。

**Request:**
```json
{
  "url": "https://github.com/owner/repo",
  "defaultBranch": "main",
  "token": "dev-only optional PAT"
}
```

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
  "projectId": 1,
  "repositoryId": 1,
  "branch": "main"
}
```

`repositoryId` 路径参数是主绑定；body 中 `projectId` 必须属于当前用户，`repositoryId` 用于兼容请求体校验和后续审计。

### GET /api/projects/{projectId}/scan-tasks

分页查询项目的扫描任务。

### GET /api/scan-tasks/{scanTaskId}

获取扫描任务详情。

### POST /api/scan-tasks/{scanTaskId}/cancel

取消扫描任务。终态任务不得被重新覆盖为运行态或成功态。

### GET /api/projects/{projectId}/scan-tasks/{scanTaskId}/governance-timeline

获取某次扫描的治理时间线，用于把扫描报告、AutoRepair、Agent task、Agent tool call、audit log、artifact 和 execution task 汇聚到同一条追责链路。

**Response data key fields:**
```json
{
  "projectId": 1,
  "repositoryId": 1,
  "scanTaskId": 1,
  "scanStatus": "SUCCESS",
  "summary": {
    "status": "HEALTHY|WARNING|ERROR",
    "counts": {},
    "hasErrors": false,
    "attributionGapCount": 0
  },
  "resources": {
    "artifacts": [],
    "scanExecution": {},
    "repairExecutions": [],
    "agentExecutions": [],
    "autoRepairs": [],
    "agentTasks": [],
    "agentToolCalls": [],
    "auditLogs": []
  },
  "events": [
    {
      "id": "string",
      "eventType": "SCAN|AUTO_REPAIR|AGENT_TASK|AUDIT|ARTIFACT",
      "title": "string",
      "status": "SUCCESS|FAILED|READY|WARNING",
      "tone": "ready|warning|danger|idle",
      "resource": {
        "type": "AUTO_REPAIR",
        "id": 1,
        "projectId": 1,
        "repositoryId": 1,
        "scanTaskId": 1
      },
      "actionTarget": {
        "type": "AUTO_REPAIR",
        "id": 1,
        "url": "/auto-repairs?projectId=1&selected=1"
      },
      "repairEvidenceGate": "READY|REVIEW|BLOCKED"
    }
  ],
  "limits": {},
  "truncated": false,
  "warnings": [],
  "attributionGaps": []
}
```

该接口必须只返回当前 `projectId + scanTaskId` 绑定的治理资源。前端不得把 foreign scan 的 AutoRepair、Agent task、tool call、artifact 或 audit log 混入当前扫描时间线。

## 分析模块

### GET /api/scan-tasks/{scanTaskId}/artifacts

获取扫描产物(文件树、语言统计、API 清单等)。

`RAW_SCAN_RESULT` 产物合同：

- `scan_result_schema_version` 必须为 `2`。
- `symbols` 必须是非空数组。
- `graph.nodes` 必须是非空数组。
- Java 仓库或包含 Java 文件的混合仓库应包含 `java_ast_diagnostics`：
  - `total_java_files`
  - `parsed_java_files`
  - `failed_java_files`
  - `failed_file_paths`
  - `status: OK|PARTIAL`

公开仓库 smoke 和 release evidence 不允许 `java_ast_diagnostics.failed_java_files > 0` 仍声明 raw scan contract 通过。

### GET /api/scan-tasks/{scanTaskId}/artifacts/{artifactType}

获取指定类型扫描产物。

### GET /api/scan-tasks/{scanTaskId}/symbols

获取代码符号列表。

**Query:** `?kind=CLASS|METHOD|FIELD`

### GET /api/scan-tasks/{scanTaskId}/relations

获取代码关系列表。

**Query:** `?relationType=CALLS|EXTENDS|IMPLEMENTS|DEPENDS_ON`

### GET /api/scan-tasks/{scanTaskId}/graph

获取完整依赖图(nodes + edges + summary)。

### GET /api/projects/{projectId}/code-chunks/search

检索当前项目某次成功扫描的代码切片。若未传 `scanTaskId`，后端使用当前项目最近一次 `SUCCESS` 扫描；若指定扫描不属于当前项目，则返回 `NOT_FOUND`。

**Query:**

| 参数 | 说明 |
| --- | --- |
| `scanTaskId` | 可选，绑定某次扫描 |
| `query` | 可选，关键词、文件路径、函数名、stack frame 或报告证据摘要 |
| `limit` | 可选，默认 20，后端会归一化到 1-50 |

**Response data key fields:**
```json
{
  "scanTaskId": 1,
  "query": "Controller.java:42",
  "limit": 20,
  "total": 3,
  "resultCount": 3,
  "totalChunks": 120,
  "embeddedChunks": 120,
  "truncated": false,
  "retrievalMode": "KEYWORD|HYBRID|STABLE_FALLBACK|NO_CONTEXT|NO_SCAN",
  "evidenceProfile": {
    "readiness": "READY|REVIEW|GAP",
    "confidence": 91
  },
  "items": [
    {
      "id": 1,
      "citationId": "code-chunk:1",
      "sourceLabel": "C1",
      "scanTaskId": 1,
      "filePath": "src/main/java/example/App.java",
      "startLine": 10,
      "endLine": 30,
      "content": "完整片段内容",
      "contentPreview": "展示预览",
      "hasEmbedding": true,
      "matchedTerms": ["App"],
      "relevanceScore": 91,
      "evidenceType": "REPORT_LINE_ANCHOR|REPORT_FILE_ANCHOR|KEYWORD|FALLBACK",
      "evidenceReason": "命中报告行锚点",
      "contextRole": "PRIMARY",
      "contextDistance": 0
    }
  ]
}
```

安全边界：

- `content` / `contentPreview` 是源码内容，前端展示必须做 display redaction；不得把 raw secret、token、Authorization、private key 或 API key 直接渲染到 UI、toast、复制文本或 release marker。
- `retrievalMode=HYBRID` 表示关键词、角色意图、路径后缀、方法锚点或报告证据路径等多类查询信号共同参与召回。
- `retrievalMode=STABLE_FALLBACK` 只能表示检索退化路径可用，不等于模型回答可信。
- `evidenceProfile` 是代码证据预检，不替代 Code QA 的 citation enforcement。

### GET /api/projects/{projectId}/code-chunks/status

读取 code_chunks 轻量状态，供 ProjectDetail 和 ScanTaskDetail 展示 readiness 使用。该接口不执行关键词检索，不拉取完整 embedding，不替代 `/search` 的证据检索用途。

**Query:**

| 参数 | 说明 |
| --- | --- |
| `scanTaskId` | 可选，绑定某次扫描；未传则使用项目最近一次 `SUCCESS` 扫描 |
| `limit` | 可选，默认 1，后端会归一化到 1-50；状态页通常只需要 1 条样例 |

**Contract:**

- 返回结构复用 `CodeChunkSearchResponse`，但 `query=""`、`retrievalMode=STABLE_FALLBACK|NO_CONTEXT|NO_SCAN`。
- `totalChunks` 和 `embeddedChunks` 用于判断代码知识库是否可用。
- 样例查询必须走 `(scan_task_id,id)` 索引路径，避免大仓库状态页被空 query 搜索拖慢。
- `embeddedChunks` 按 `embedding_model` 统计，代表当前可识别模型的向量化切片。

## Agent 模块

### POST /api/agent-tasks

创建 Agent 分析任务。

**Request:**
```json
{
  "projectId": 1,
  "scanTaskId": 1,
  "conversationId": 1,
  "taskType": "ARCHITECTURE_REVIEW",
  "title": "架构审查",
  "description": "可选",
  "priority": "HIGH|MEDIUM|LOW",
  "inputJson": "{}"
}
```

### GET /api/projects/{projectId}/agent-tasks

分页查询 Agent 任务。

### GET /api/agent-tasks/{taskId}

获取 Agent 任务详情(含步骤)。

### POST /api/agent-tasks/{taskId}/start

启动 Agent 任务。

### POST /api/agent-tasks/{taskId}/complete

完成 Agent 任务。

**Request:**
```json
{
  "outputJson": "{}",
  "summary": "任务完成摘要",
  "status": "COMPLETED|FAILED"
}
```

### POST /api/agent-tasks/{taskId}/cancel

取消 Agent 任务。已完成、已失败或已取消的任务不能被覆盖。

### POST /api/agent-tasks/{taskId}/steps

追加 Agent 任务步骤。

**Request:**
```json
{
  "stepType": "TOOL_CALL|ANALYSIS|DECISION|OUTPUT",
  "toolName": "read_file",
  "description": "步骤说明",
  "inputJson": "{}"
}
```

### PATCH /api/agent-steps/{stepId}

更新 Agent 步骤状态。

**Request:**
```json
{
  "outputJson": "{}",
  "status": "COMPLETED|FAILED|SKIPPED",
  "errorMessage": "失败原因",
  "durationMs": 1200
}
```

### GET /api/agent-tasks/{taskId}/steps

查询 Agent 任务步骤。

### POST /api/projects/{projectId}/conversations

创建 Agent 对话。

**Request:**
```json
{
  "title": "可选标题",
  "systemPrompt": "可选系统提示"
}
```

### GET /api/projects/{projectId}/conversations

分页查询当前用户在项目下的对话。

### GET /api/conversations/{id}

获取对话详情和消息历史。后端会根据 conversation 的 `projectId` 校验项目所有权。

### POST /api/conversations/{id}/messages

发送对话消息，返回 `text/event-stream`。SSE 超时为 5 分钟，事件由 Agent runtime 逐步发送。

**Request:**
```json
{
  "message": "请分析当前扫描报告"
}
```

安全边界：

- SSE 不得输出完整 raw prompt、raw tool result、secret、token、private key 或 API key。
- Agent tool call 必须通过审计表留痕；只读工具和写入/执行工具必须保留权限边界。

### DELETE /api/conversations/{id}

删除对话及其消息历史。

### POST /api/projects/{projectId}/qa

基于当前项目最新成功扫描或请求指定 `scanTaskId` 执行代码问答。响应必须返回可审计证据，而不是只返回自然语言回答。

**Request:**
```json
{
  "question": "代码问题",
  "scanTaskId": 1,
  "evidenceRef": {
    "category": "报告章节",
    "source": "Architecture Risk Report",
    "title": "风险标题",
    "summary": "证据摘要",
    "filePath": "src/main/java/example/App.java",
    "lineNumber": "42",
    "startLine": 40,
    "endLine": 48
  }
}
```

**Response data key fields:**
```json
{
  "answer": "回答必须使用 [C1] 这类引用标签",
  "scanTaskId": 1,
  "question": "代码问题",
  "matchedChunks": 3,
  "resultCount": 3,
  "retrievalMode": "KEYWORD|HYBRID|SEMANTIC_FALLBACK|STABLE_FALLBACK|NO_CONTEXT|NO_SCAN",
  "retrievalPlan": {
    "tokens": ["auth", "token"],
    "queryStrategy": "SOURCE_LOCATION_ANCHOR|ENDPOINT_ROUTE_LOOKUP|FRONTEND_BACKEND_BRIDGE|BACKEND_FLOW_ROLE_EXPANSION|SEMANTIC_FALLBACK|SEMANTIC_HYBRID|ROLE_INTENT_FALLBACK|KEYWORD|STABLE_FALLBACK|NO_CONTEXT|NO_SCAN",
    "roleIntents": ["CONTROLLER", "SERVICE"],
    "fallbackRolePriority": ["SERVICE", "CONFIG", "CONTROLLER", "DATA_ACCESS", "DOMAIN_MODEL", "FRONTEND", "TEST"],
    "auxiliaryHintsPresent": true,
    "questionEmbeddingAvailable": true,
    "embeddingCoveragePercent": 60,
    "embeddingCoverageStatus": "NONE|LOW|PARTIAL|READY",
    "semanticPoolAttempted": true,
    "semanticPoolStrategy": "NOT_ATTEMPTED|HEAD_ONLY|HEAD_DISTRIBUTED_WINDOWS",
    "semanticPoolLoadedCount": 1,
    "semanticPoolLimit": 500,
    "semanticPoolTruncated": true,
    "semanticPoolCoveragePercent": 0,
    "semanticPlanReason": "NO_ACTIVE_LLM|QUESTION_EMBEDDING_FAILED|QUESTION_EMBEDDING_UNAVAILABLE|NO_MODEL_EMBEDDINGS|LOW_EMBEDDING_COVERAGE|SEMANTIC_POOL_READY|SEMANTIC_POOL_EMPTY|KEYWORD_ONLY|NO_CONTEXT|NO_SCAN",
    "semanticReadinessStatus": "NOT_APPLICABLE|DISABLED|UNAVAILABLE|DEGRADED|READY",
    "semanticReadinessReason": "NO_ACTIVE_LLM|QUESTION_EMBEDDING_FAILED|QUESTION_EMBEDDING_UNAVAILABLE|NO_MODEL_EMBEDDINGS|LOW_EMBEDDING_COVERAGE|PARTIAL_EMBEDDING_COVERAGE|SEMANTIC_POOL_EMPTY|SEMANTIC_POOL_TRUNCATED|SEMANTIC_READY|NO_CONTEXT|NO_SCAN",
    "crossFileIntentPresent": true,
    "crossFileEvidenceSatisfied": true,
    "crossFilePrimaryFileCount": 2,
    "crossFileEvidenceStatus": "NOT_APPLICABLE|SATISFIED|SINGLE_PRIMARY_FILE|NO_PRIMARY_EVIDENCE",
    "graphRelationEvidencePresent": true,
    "graphRelationPrimaryLabels": ["C2"],
    "graphRelationEvidenceCount": 1,
    "fallbackReason": "KEYWORD_WITH_ROLE_HINTS|KEYWORD|NO_KEYWORD_NO_EMBEDDING_INTENT_ROLE_FALLBACK|NO_KEYWORD_NO_EMBEDDING_DEFAULT_FALLBACK|NO_KEYWORD_SEMANTIC_OR_STABLE_FALLBACK|NO_CONTEXT|NO_SCAN"
  },
  "totalChunks": 120,
  "embeddedChunks": 120,
  "truncated": false,
  "evidenceProfile": {
    "readiness": "READY|REVIEW|GAP",
    "confidence": 91
  },
  "groundingStatus": "VERIFIED|PARTIAL|UNVERIFIED|NO_EVIDENCE",
  "citationEnforcementStatus": "DIRECT_VERIFIED|RETRY_VERIFIED|FALLBACK_CITED|RETRY_FAILED|UNVERIFIED|NO_EVIDENCE",
  "citationEnforcementReason": "DIRECT_VERIFIED|RETRY_VERIFIED|FALLBACK_PRIMARY_CITED|NO_EVIDENCE|RETRY_CALL_FAILED|INVALID_LABEL|NO_AUDITABLE_CLAIM|CONTEXT_ONLY_CLAIM|UNKNOWN_ONLY_CLAIM|UNCITED_REQUIRED_CLAIM|NO_VALID_CITATION_LABEL|NO_PRIMARY_CITATION|PRIMARY_BOUND_INCOMPLETE|NOT_APPLICABLE",
  "citationEnforcementNote": "string",
  "sourceEvidenceRef": {},
  "sourceEvidenceMatched": true,
  "sourceEvidenceMatchType": "REPORT_LINE_ANCHOR|REPORT_FILE_ANCHOR|NONE",
  "answerCitations": [
    {
      "sourceLabel": "C1",
      "filePath": "src/main/java/example/App.java",
      "startLine": 10,
      "endLine": 20,
      "evidenceReason": "Report evidence line anchor.",
      "citedByAnswer": true
    }
  ],
  "citationCoverage": {
    "requiredEvidenceCoveragePercent": 100,
    "requiredEvidenceCount": 1,
    "citedRequiredEvidenceCount": 1,
    "uniqueEvidenceFileCount": 1,
    "citedEvidenceFileCount": 1,
    "primaryEvidenceCount": 1,
    "citedPrimaryEvidenceCount": 1,
    "uncitedPrimaryEvidenceCount": 0,
    "primaryEvidenceFileCount": 1,
    "citedPrimaryEvidenceFileCount": 1,
    "uncitedPrimaryEvidenceFileCount": 0,
    "contextEvidenceCount": 0,
    "citedContextEvidenceCount": 0,
    "uncitedContextEvidenceCount": 0,
    "contextEvidenceFileCount": 0,
    "citedContextEvidenceFileCount": 0,
    "uncitedContextEvidenceFileCount": 0,
    "requiredEvidenceFileCount": 1,
    "citedRequiredEvidenceFileCount": 1,
    "repairCandidateCount": 1,
    "coverageScope": "PRIMARY|ALL",
    "evidenceRoleDistribution": {
      "status": "PRIMARY_SINGLE_FILE|PRIMARY_CROSS_FILE|MIXED_PRIMARY_CONTEXT|CONTEXT_ONLY|UNKNOWN_ROLE_PRESENT|NO_EVIDENCE",
      "totalFileCount": 1,
      "citedFileCount": 1,
      "primaryFileCount": 1,
      "citedPrimaryFileCount": 1,
      "contextFileCount": 0,
      "citedContextFileCount": 0,
      "roles": [
        {
          "role": "PRIMARY|ADJACENT_CONTEXT|UNKNOWN",
          "evidenceCount": 1,
          "citedEvidenceCount": 1,
          "fileCount": 1,
          "citedFileCount": 1
        }
      ],
      "files": [
        {
          "filePath": "src/main/java/example/App.java",
          "primaryEvidenceCount": 1,
          "citedPrimaryEvidenceCount": 1,
          "contextEvidenceCount": 0,
          "citedContextEvidenceCount": 0
        }
      ]
    }
  },
  "claimCitationCoverage": {
    "status": "READY|REVIEW|BLOCKED",
    "totalClaimCount": 1,
    "requiredClaimCount": 1,
    "citedRequiredClaimCount": 1,
    "uncitedRequiredClaimCount": 0,
    "invalidCitationClaimCount": 0,
    "claimCoveragePercent": 100,
    "validCitationFileCount": 1,
    "requiredClaimCitationFileCount": 1,
    "readyForRepair": true,
    "readinessReason": "PRIMARY_BOUND_READY",
    "readinessNote": "所有必需代码事实 claim 都已绑定 PRIMARY 证据，可进入修复候选复核。",
    "validCitationFiles": ["src/main/java/example/App.java"],
    "requiredClaimCitationFiles": ["src/main/java/example/App.java"],
    "roleDistribution": {
      "status": "PRIMARY_BOUND|MIXED_CONTEXT|CONTEXT_ONLY|UNKNOWN_ROLE_PRESENT|REVIEW_UNCITED|BLOCKED_INVALID|NO_REQUIRED_CLAIMS",
      "requiredClaimCount": 1,
      "requiredPrimaryBoundClaimCount": 1,
      "requiredContextOnlyClaimCount": 0,
      "requiredUnknownOnlyClaimCount": 0,
      "unbackedRequiredClaimCount": 0,
      "invalidRequiredClaimCount": 0,
      "validCitationFileCount": 1,
      "requiredClaimCitationFileCount": 1,
      "requiredPrimaryFileCount": 1,
      "roles": [
        {
          "role": "PRIMARY",
          "claimCount": 1,
          "requiredClaimCount": 1,
          "fileCount": 1,
          "requiredFileCount": 1
        }
      ],
      "files": [
        {
          "filePath": "src/main/java/example/App.java",
          "primaryClaimCount": 1,
          "requiredPrimaryClaimCount": 1,
          "contextClaimCount": 0,
          "requiredContextClaimCount": 0,
          "unknownClaimCount": 0,
          "requiredUnknownClaimCount": 0,
          "requiredClaimCount": 1
        }
      ]
    },
    "claims": [
      {
        "claimId": "Q1",
        "status": "CITED|UNCITED|INVALID|OPTIONAL",
        "validSourceLabels": ["C1"],
        "validSourceFiles": ["src/main/java/example/App.java"],
        "validSourceRoles": ["PRIMARY"],
        "primarySourceFiles": ["src/main/java/example/App.java"],
        "contextSourceFiles": []
      }
    ]
  },
  "retrievedChunks": []
}
```

`retrievalPlan` 是机器可读检索计划说明，供前端、smoke 和排障工具解释 token、query strategy、role intent、embedding coverage、semantic pool、relation-aware path 和 fallback reason；它不是语义理解或事实正确性证明。`queryStrategy` 只说明本次服务端采用的主要检索路线，例如精确源码位置、接口路由、前后端桥接、后端链路、语义兜底、角色兜底或稳定兜底。`questionEmbeddingAvailable` 只说明本次问题 embedding 是否成功生成；`embeddingCoveragePercent/status` 只说明当前扫描任务在 active embedding model 下的 chunk 覆盖率；`semanticPoolAttempted/Strategy/LoadedCount/Limit` 只说明语义候选池是否尝试加载、采用头部窗口还是头部加分布式窗口以及加载规模；`semanticPoolTruncated` 表示 active embedding pool 大于本次实际加载候选数；`semanticPoolCoveragePercent` 表示已加载语义候选占 active embedding pool 的比例；`semanticPlanReason` 是语义检索诊断码，不是召回质量评分；`semanticReadinessStatus` 用 `NOT_APPLICABLE`、`DISABLED`、`UNAVAILABLE`、`DEGRADED`、`READY` 给前端和 verifier 一个粗粒度可用性结论；`semanticReadinessReason` 给出该结论的机器可读原因。`fallbackReason=NO_KEYWORD_NO_EMBEDDING_INTENT_ROLE_FALLBACK` 表示无主关键词命中、无可用 embedding 且使用意图角色兜底；`KEYWORD_WITH_ROLE_HINTS` 表示关键词路径仍有 role/path 等辅助信号参与。`crossFileIntentPresent=true` 只说明问题命中 bounded flow/call-chain/调用链/流程意图；`crossFilePrimaryFileCount` 统计本次响应中 PRIMARY 证据覆盖的唯一文件数；`crossFileEvidenceSatisfied=true` 只表示当前跨文件意图响应已返回至少两个 PRIMARY 文件；`crossFileEvidenceStatus` 用 `NOT_APPLICABLE`、`SATISFIED`、`SINGLE_PRIMARY_FILE` 或 `NO_PRIMARY_EVIDENCE` 说明跨文件证据满足度。`graphRelationEvidencePresent=true` 只说明本次 retrieved chunks 中存在 `Graph relation:` evidence reason；`graphRelationPrimaryLabels` 列出同一响应中被标为 PRIMARY 的 relation evidence source labels；`graphRelationEvidenceCount` 是 relation evidence reason 数量。上述字段只解释服务端检索/证据计划，不证明完整调用链、动态分派、向量召回充分性或 LLM 事实正确。`sourceEvidenceRef.filePath` 在响应中不得回显用户本机绝对路径；本地绝对路径会尽量转为仓库相对路径，无法识别时返回 `[local-path-redacted]`。`citationEnforcementReason` 是机器可读诊断码，供前端、smoke 和 verifier 区分 `RETRY_FAILED` 的具体原因；`citationEnforcementNote` 是人读说明，不应用作程序判断。`retrievedChunks[*].content` 不在 Code QA response 中返回；`contentPreview` 仅作为脱敏、截断后的短预览使用，不应被当作完整源码或修复输入。`retrievedChunks[*].evidenceReason` 和 `answerCitations[*].evidenceReason` 可包含 best-effort 图谱关系说明，例如 `Graph relation: source CALLS target`；也可在 report evidence file/line anchor 命中 PRIMARY 证据时包含 `Report evidence file anchor.` 或 `Report evidence line anchor.`。这些 reason 只解释当前候选为何被选入或升级为主证据，不证明完整调用链、向量召回充分性或 LLM 事实正确。明确 flow/call-chain/调用链/流程意图下，graph relation 命中的跨文件 chunk 可升级为 `PRIMARY`，并仍保留 `Graph relation:` reason；报告证据行号命中的 PRIMARY chunk 必须在 citation reason 中保留 `Report evidence line anchor.`；普通相邻上下文仍保持 `ADJACENT_CONTEXT` 且不得伪造行号锚点 reason。`citationCoverage.status=REQUIRED_FULL` 表示 required/primary evidence 已全引用，但 adjacent/supplemental context 可能未全引用。`citationCoverage` 的 evidence file distribution 证明回答引用覆盖到哪些候选文件以及其中哪些属于 `PRIMARY` 主证据文件；`evidenceRoleDistribution` 进一步把 PRIMARY、ADJACENT_CONTEXT 和 UNKNOWN 的证据数、引用数、文件数拆开，便于报告 QA、公开仓库 smoke 和 release verifier 判断“主证据是否被引用”。该字段只做结构化证据分布审计，不证明模型事实一定正确，也不强制所有问题必须跨文件。`claimCitationCoverage.status=READY` 只证明回答主张绑定了当前候选中存在的 citation label 和文件分布；`claimCitationCoverage.roleDistribution.status=PRIMARY_BOUND` 进一步证明每个 required claim 至少绑定一个 PRIMARY 证据。`CONTEXT_ONLY/MIXED_CONTEXT/UNKNOWN_ROLE_PRESENT` 是审计信号，不是 LLM 事实裁判。`claimCitationCoverage.readyForRepair=true` 与 `readinessReason=PRIMARY_BOUND_READY` 是 Project QA 进入修复候选前的机器可读门禁；`readinessNote` 只用于人读说明。Project QA 到 AutoRepair 候选入口必须同时满足 `groundingStatus=VERIFIED`、成功 citation enforcement、必需证据覆盖、`claimCitationCoverage.status=READY`、`claimCitationCoverage.readyForRepair=true`、`claimCitationCoverage.readinessReason=PRIMARY_BOUND_READY`，并由前端/服务端候选创建流程派生 `repairEvidenceGate=READY` 后才允许创建修复候选。

## Issue 拆解模块

### POST /api/issue-decompositions

创建 Issue 拆解任务。

**Request:**
```json
{
  "projectId": 1,
  "scanTaskId": 1,
  "title": "拆解标题",
  "description": "需求或问题描述",
  "businessContext": "业务背景",
  "priority": "HIGH|MEDIUM|LOW",
  "relatedModules": "module-a,module-b"
}
```

### GET /api/projects/{projectId}/issue-decompositions

分页查询拆解任务。

### GET /api/issue-decompositions/{id}

获取拆解详情(含子任务)。

### GET /api/issue-decompositions/{id}/tasks

查询拆解出的子任务。

### PATCH /api/issue-tasks/{taskId}

更新拆解子任务状态。

### GET /api/issue-decompositions/{id}/export/markdown

导出拆解结果 Markdown。导出内容不得包含 raw secret、raw prompt 或工具执行原始输出。

## CI 诊断模块

### POST /api/ci-diagnostics

创建 CI 诊断报告。

**Request:**
```json
{
  "projectId": 1,
  "scanTaskId": 1,
  "repositoryId": 1,
  "provider": "GITHUB_ACTIONS|GITLAB_CI|JENKINS",
  "workflowName": "ci",
  "workflowRunId": "123456",
  "runNumber": 12,
  "branch": "main",
  "commitSha": "abc123",
  "commitMessage": "fix build",
  "conclusion": "failure|success",
  "rawLogSnippet": "日志片段"
}
```

### GET /api/projects/{projectId}/ci-diagnostics

分页查询诊断报告。

### GET /api/ci-diagnostics/{id}

获取诊断详情。

### POST /api/ci-diagnostics/{id}/reanalyze

重新分析 CI 诊断。

## PR 审查模块

### POST /api/pr-reviews

创建 PR 风险审查。

**Request:**
```json
{
  "projectId": 1,
  "scanTaskId": 1,
  "repositoryId": 1,
  "prNumber": 24,
  "prTitle": "PR 标题",
  "prDescription": "PR 描述",
  "branch": "feature/source-analysis",
  "baseBranch": "main",
  "commitSha": "abc123",
  "author": "octocat",
  "changedFiles": "[\"src/App.java\"]",
  "diffSummary": "变更摘要",
  "ciStatus": "success|failure|pending"
}
```

### GET /api/projects/{projectId}/pr-reviews

分页查询审查记录。

### GET /api/pr-reviews/{id}

获取审查详情(含评论)。

### GET /api/pr-reviews/{id}/comments

查询 PR 审查评论。

### POST /api/pr-reviews/{id}/reanalyze

重新分析 PR 审查。

## 自动修复模块

### POST /api/projects/{projectId}/auto-repairs

创建受控自动补丁任务。来自扫描报告风险项的候选应携带 `scanTaskId`，后端会校验该扫描任务属于当前项目、当前仓库且状态为 `SUCCESS`。

**Request:**
```json
{
  "repositoryId": 1,
  "scanTaskId": 1,
  "filePath": "src/main/java/example/App.java",
  "targetDesc": "修复扫描报告指出的空指针风险",
  "provenance": {
    "sourceType": "PROJECT_QA_VERIFIED_CITATION|SCAN_REPORT_RISK|MANUAL_CANDIDATE",
    "source": "Project QA verified citation",
    "scanTaskId": 1,
    "filePath": "src/main/java/example/App.java",
    "chunkId": 1,
    "citationId": "code-chunk:1",
    "sourceLabel": "C1",
    "startLine": 10,
    "endLine": 30,
    "citedByAnswer": true,
    "groundingStatus": "VERIFIED",
    "citationEnforcementStatus": "DIRECT_VERIFIED",
    "citationEnforcementReason": "DIRECT_VERIFIED",
    "evidenceType": "METHOD",
    "evidenceReason": "primary cited evidence",
    "sourceEvidenceCategory": "风险",
    "sourceEvidenceSource": "Architecture Risk Report",
    "sourceEvidenceTitle": "风险标题",
    "sourceEvidenceFilePath": "src/main/java/example/App.java",
    "sourceEvidenceLineNumber": "42",
    "sourceEvidenceMatched": true,
    "sourceEvidenceMatchType": "REPORT_LINE_ANCHOR",
    "artifactId": 1,
    "artifactType": "ARCHITECTURE_REPORT",
    "riskKey": "ARCH-RISK-1",
    "riskCategory": "Reliability",
    "riskSeverity": "HIGH",
    "lineNumber": 42
  }
}
```

**Response data:**
```json
{
  "id": 1,
  "projectId": 1,
  "repositoryId": 1,
  "scanTaskId": 1,
  "filePath": "src/main/java/example/App.java",
  "targetDesc": "修复扫描报告指出的空指针风险",
  "status": "PENDING"
}
```

### GET /api/projects/{projectId}/auto-repairs

查询项目下自动修复任务列表，返回项包含 `scanTaskId`，用于回跳来源扫描报告。

**Query:** `?repositoryId=1&scanTaskId=1&status=PATCH_READY`

### GET /api/projects/{projectId}/auto-repairs/{id}

获取自动修复任务详情，包含补丁、PR、错误信息和来源扫描任务。

### POST /api/projects/{projectId}/auto-repairs/{id}/submit-pr

在补丁已就绪且受控 PR 开关开启时，启动 Pull Request 创建流程。

### POST /api/projects/{projectId}/auto-repairs/{id}/cancel

取消仍在执行中的自动修复任务。

`provenance` 用于记录候选来自报告证据、Project QA verified citation 或 code_chunks，不是授权凭据。前端可展示 provenance 的摘要，但不得把 raw prompt、raw answer、raw code chunk secret 或未脱敏 tool output 写入 URL、toast、marker 或复制文本。后端必须校验扫描任务归属、仓库归属和 `SUCCESS` 状态，并服务端派生 `repairEvidenceGate=READY|REVIEW|BLOCKED`。

## 执行任务与审计模块

### GET /api/projects/{projectId}/artifacts

查询项目运行产物索引。

**Query:** `?repositoryId=1&ownerType=SCAN_TASK&ownerId=1`

### GET /api/projects/{projectId}/artifacts/{artifactId}

查询运行产物元数据。

### GET /api/projects/{projectId}/artifacts/{artifactId}/preview

预览运行产物文本内容。响应包含 `record`、`text`、`truncated` 和 `previewBytes`。预览内容可能包含扫描原始数据，前端展示必须脱敏。

### GET /api/projects/{projectId}/artifacts/{artifactId}/download

下载运行产物。必须显式传入 `rawDownloadAcknowledged=true`，否则后端拒绝并记录失败审计。

成功响应：

- `Content-Disposition: attachment; filename=...`
- 若审计记录成功写入，响应头包含 `X-SourceLens-Audit-Log-Id: <id>`。

`X-SourceLens-Audit-Log-Id` 只是审计定位 receipt，不是授权凭据。若审计写入失败，后端仍可返回文件，但不得伪造该 header。

### GET /api/projects/{projectId}/execution-tasks

分页查询项目统一执行任务。

### GET /api/projects/{projectId}/execution-tasks/{taskId}

获取执行任务详情，包含 attempts、steps 和 append-only logs。

### GET /api/projects/{projectId}/execution-tasks/source/{sourceType}/{sourceId}

按来源查询统一执行任务详情。`sourceType` 常见值：`SCAN_TASK`、`AUTO_REPAIR`、`AGENT_TASK`。

### POST /api/projects/{projectId}/execution-tasks/{taskId}/cancel

取消执行任务。终态任务不能被覆盖。

### GET /api/projects/{projectId}/audit-logs

分页查询项目审计日志。

**Query:** `?page=1&pageSize=20&auditLogId=904&resourceType=ARTIFACT&resourceId=1&action=ARTIFACT_RAW_DOWNLOAD&status=SUCCESS`

`auditLogId` 用于精确打开某条 receipt；其他筛选用于定位资源级审计链路。日志详情、metadata、error message 和 duration 信息必须脱敏并限制长度。

### GET /api/projects/{projectId}/agent-tool-calls

分页查询项目 Agent 工具调用审计。

**Query:** `?page=1&pageSize=20&toolName=read_file&conversationId=1&scanTaskId=1&success=true`

响应用于审计，不得作为重新执行工具的输入来源；前端展示 `argumentsJson`、`resultSummary`、`errorMessage` 时必须脱敏和截断。

## LLM 与模型配置模块

### POST /api/llm-configs

创建 LLM provider 配置。

**Request:**
```json
{
  "provider": "OPENAI|ANTHROPIC|DEEPSEEK|CUSTOM",
  "modelName": "gpt-4.1",
  "apiKey": "sk-...",
  "baseUrl": "https://api.example.com/v1",
  "temperature": 0.2,
  "maxTokens": 4096
}
```

### GET /api/llm-configs

查询当前用户的 LLM 配置列表。

### GET /api/llm-configs/active

获取当前激活配置。

### POST /api/llm-configs/{configId}/activate

激活指定配置。

### PUT /api/llm-configs/{configId}

更新指定配置。

**Request:**
```json
{
  "provider": "OPENAI|ANTHROPIC|DEEPSEEK|CUSTOM",
  "modelName": "gpt-4.1",
  "apiKey": "sk-...",
  "baseUrl": "https://api.example.com/v1",
  "temperature": 0.2,
  "maxTokens": 4096
}
```

### DELETE /api/llm-configs/{configId}

删除指定配置。

安全边界：`LlmConfigResponse.apiKey` 只能是 masked display value，不能返回原始 key；日志、异常、release evidence 和前端状态都不得保存或展示原始 key。生产环境 LLM base URL 必须防 SSRF，禁止 localhost、metadata IP、内网 IP 和非 HTTPS 目标；mock provider 只能用于 dev/test 或明确 mock profile。

### POST /api/mock-llm/chat/completions

dev/test profile 的 OpenAI-compatible mock chat completions。支持流式 SSE 和非流式 JSON。

### POST /api/mock-llm/v1/embeddings

dev/test profile 的 mock embeddings。

### POST /api/mock-llm/embeddings

dev/test profile 的 mock embeddings 兼容路径。

`mock-llm` 只能用于本地或测试，不得作为生产 provider 质量证明。

## GitHub 集成模块

### POST /api/webhooks/github/app

GitHub App webhook 接收入口。要求请求头：

- `X-GitHub-Event`
- `X-GitHub-Delivery`
- `X-Hub-Signature-256`

后端必须先校验 HMAC SHA-256 signature，再处理 delivery。该接口是外部 webhook 入口，不使用普通 JWT 认证，但必须依赖 webhook secret 签名校验，并通过 delivery id 做幂等处理。

### GET /api/projects/{projectId}/github-webhook-deliveries

分页查询项目相关 GitHub webhook delivery。

**Query:** `?page=1&pageSize=20&eventType=installation_repositories&status=SUCCESS`

Delivery 查询接口只返回处理元数据和项目映射，不得返回 webhook secret、installation token 或 raw private key。

## Dev/Test Smoke Seed 模块

以下接口只在 `dev` / `test` 且非 `prod` profile 开放，均标记为 OpenAPI hidden，不得在生产环境出现。

### POST /api/dev/projects/{projectId}/scan-governance-smoke-seed

为扫描治理时间线 browser smoke 生成 scan-bound AutoRepair、AgentTask、artifact、audit 和 execution 样本。

**Request:**
```json
{
  "repositoryId": 1,
  "scanTaskId": 1
}
```

### POST /api/dev/projects/{projectId}/audit-workbench-smoke-seed

为审计工作台 browser smoke 生成 audit、tool call 和 webhook delivery 样本。

**Request:**
```json
{
  "repositoryId": 1
}
```

这些 seed 接口用于可重复 UI smoke，不是业务 API；生产 profile 必须禁用。

## 仪表盘模块

### GET /api/dashboard/stats

获取全局统计数据(项目数、扫描数、任务数等)。

P9 Dashboard trusted loop 指标字段：

- `trustedLoopCompletionRate`：`0-100`，后端根据仓库接入、成功扫描、code_chunks 和下一步证据信号计算。
- `trustedLoopStatus`：`ready | warning | idle`，用于 Dashboard North Star 状态。
- `trustedLoopStatusLabel`：中文状态说明。
- `trustedLoopReadyStages` / `trustedLoopTotalStages`：当前闭环已就绪阶段数和总阶段数。
- `reportEvidenceReady`：是否已有成功扫描报告入口。
- `codeQaReadiness`：`READY | REVIEW | GAP`，表示代码问答证据就绪程度。
- `recoverySignal`：`OK | RUNNING | RISK`，表示恢复/风险信号。
- `trustedLoopMetricsSource`：当前为 `API`，前端可据此区分后端指标与本地 fallback。

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
