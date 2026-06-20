# SourceLens 项目全程规划

版本：v0.1  
状态：开发总纲  
项目中文名：源鉴  
项目英文名：SourceLens  
最后更新：2026-06-08

## 1. 项目名称与精神内核

### 1.1 名称

中文名：源鉴

英文名：SourceLens

工程仓库名：SourceLens

### 1.2 名称含义

源，代表源码、源流、系统真实来源。

鉴，代表洞察、评审、反向分析、辨别优劣。

Lens，代表透镜、观察工具、结构化理解能力。

SourceLens 的含义是：以源码为入口，看清系统的结构、演进、风险和未来。

### 1.3 一句话定位

SourceLens 是一个面向真实工程项目的 Agentic 架构分析、源码级逆向理解、工程治理与自动化开发平台。

### 1.4 更完整的定位

SourceLens 通过接入 GitHub、GitLab 或本地仓库，对项目进行源码扫描、依赖解析、架构反推、知识图谱构建和 Agent 协同分析，帮助开发者、架构师、技术负责人快速理解陌生项目，发现技术债，诊断 CI 问题，评审 PR 风险，并逐步扩展到自动修改代码、自动运行测试、自动生成 PR 和持续工程治理。

### 1.5 项目愿景

让 AI 像架构师一样理解系统，像资深工程师一样执行任务，像技术负责人一样持续治理项目。

### 1.6 项目不做什么

项目早期不做以下方向：

- 不做通用聊天机器人。
- 不做只会总结 README 的轻量工具。
- 不做二进制破解、脱壳、未授权逆向。
- 不做无审计、无回放、无安全边界的自动改代码系统。
- 不在第一阶段追求支持所有语言和所有框架。

项目早期聚焦：

- 授权源码仓库。
- Java Spring Boot 项目的深度分析。
- GitHub 工作流优先。
- 架构画像、代码逆向、Agent 任务和工程治理闭环。

## 2. 目标用户与使用场景

### 2.1 目标用户

第一类：个人开发者

- 想快速理解陌生项目。
- 想学习优秀项目架构。
- 想让 AI 帮自己拆需求、看代码、做 Review。
- 想积累后端架构、Agent 和 DevOps 能力。

第二类：后端工程师

- 接手已有项目。
- 需要快速定位模块关系。
- 需要分析接口链路和数据库链路。
- 需要评估改动风险。

第三类：架构师和技术负责人

- 管理多个仓库。
- 关注技术债、模块耦合、架构健康度。
- 需要 PR 风险审查和 CI 失败诊断。
- 需要形成持续工程治理机制。

第四类：外包交接和企业维护团队

- 面对文档缺失的老项目。
- 需要从代码反推出业务流程、接口清单、数据库关系。
- 需要生成可交接的架构说明。

第五类：AI Agent 工程团队

- 需要一个真实复杂场景训练多 Agent 编排。
- 需要工具调用、沙箱、记忆、评估、审计和回放能力。

### 2.2 高频使用场景

场景 1：首次接入仓库

用户授权 GitHub 仓库，SourceLens 拉取代码，分析语言、框架、目录结构、依赖、入口模块、接口和数据库实体，并生成项目架构画像。

场景 2：理解陌生项目

用户打开一个项目，问：“这个项目的订单模块是怎么工作的？”系统基于代码索引、调用图和 Agent 分析，给出模块说明、关键类、接口入口、数据库表和调用链。

场景 3：源码级逆向分析

用户选择一个接口，系统展示 Controller -> Service -> Domain -> Repository -> Database 的链路，并生成 Mermaid 图、时序说明和风险点。

场景 4：Issue 拆解

用户输入需求：“给支付模块增加退款失败重试机制。”SourceLens 分析影响范围，拆出后端任务、数据库变更、测试任务、风险点和验收标准。

场景 5：CI 报错诊断

GitHub Actions 失败后，SourceLens 获取日志，识别失败原因，关联代码位置，给出修复建议和可能影响范围。

场景 6：PR 风险审查

用户提交 PR 后，SourceLens 分析 diff、调用影响、测试缺口、接口兼容性和数据库风险，输出 Review 建议。

场景 7：自动修复与生成 PR

用户选择一个低风险任务，Agent 在沙箱中修改代码、运行测试、生成 diff，用户确认后自动创建 PR。

场景 8：团队工程治理

技术负责人查看组织下所有项目的架构健康度、技术债趋势、风险 PR 分布、CI 失败趋势和 Agent 执行效果。

## 3. 公司化视角的完整规划

### 3.1 产品视角

产品阶段分为四个层次：

第一阶段：个人开发者工具

- 快速接入一个仓库。
- 自动生成架构画像。
- 帮用户理解项目。
- 重点是清晰、可用、可演示。

第二阶段：工程效率平台

- 支持 Issue 拆解。
- 支持 CI 诊断。
- 支持 PR 风险审查。
- 进入开发工作流。

第三阶段：团队工程治理平台

- 支持组织、成员、权限、审计。
- 支持多仓库治理。
- 支持架构健康评分和趋势分析。
- 支持企业私有化部署。

第四阶段：Agentic Software Engineering Platform

- 支持多 Agent 协作。
- 支持自动改代码、测试、生成 PR。
- 支持插件市场、MCP 工具生态、Hermes 风格 Agent 能力扩展。
- 成为 AI 驱动的软件工程操作系统。

### 3.2 技术视角

技术原则：

- 主业务系统先用 Spring Boot 单体，避免过早微服务。
- Rust 负责高性能代码扫描、AST 解析、依赖分析和图构建。
- Go 适合做 GitHub Webhook、CI 事件消费、轻量集成 worker。
- Agent Runtime 使用 Python 或 TypeScript，优先选择生态成熟、工具多、迭代快的方案。
- MySQL 作为业务主库。
- Redis 作为缓存、限流和轻量队列。
- Temporal 管理长任务和可恢复工作流。
- Qdrant 管代码语义检索和 RAG。
- Neo4j 后期承载代码知识图谱。
- MCP 作为工具协议，把 GitHub、代码分析器、沙箱、数据库和文件系统包装成 Agent 可调用工具。

技术路线：

- v0.x 先跑通单机和 Docker Compose。
- v1.x 实现完整产品闭环。
- v2.x 拆分服务，强化多租户和团队治理。
- v3.x 走企业级私有化、插件生态和自动工程执行。

### 3.3 架构视角

系统分为六个层：

用户交互层：

- Web Console
- API 文档
- GitHub App 页面
- 后期支持 CLI

控制平面：

- 用户、组织、项目、仓库、任务、报告、权限、审计
- 使用 Spring Boot 实现

执行平面：

- 扫描任务
- 分析任务
- Agent 任务
- CI 诊断任务
- PR 审查任务
- 使用 Temporal 编排

分析平面：

- Rust Code Analyzer
- 语言识别
- 依赖解析
- AST 分析
- 调用图分析
- API/DB/模块抽取

智能平面：

- Agent Runtime
- Planner Agent
- Architect Agent
- Code Reader Agent
- Reviewer Agent
- Tester Agent
- Reporter Agent
- MCP Tools

数据平面：

- MySQL
- Redis
- Object Storage
- Qdrant
- Neo4j
- 日志和指标系统

### 3.4 安全视角

安全目标：

- 所有仓库访问必须授权。
- 所有 Token 必须加密存储。
- Agent 默认不能访问生产密钥。
- 自动改代码必须在沙箱中执行。
- 自动 PR 必须经过用户确认。
- 所有工具调用必须记录。
- 所有 Agent 结论必须可追溯到代码证据。

早期必须具备：

- GitHub Token 加密。
- 项目级权限校验。
- 任务级操作日志。
- Agent 工具调用审计。
- 仓库临时目录隔离。

中后期必须具备：

- 多租户隔离。
- 企业 SSO。
- RBAC 权限。
- 审计日志导出。
- Secret 扫描。
- Agent 工具权限策略。
- 沙箱网络策略。

### 3.5 运营视角

早期运营：

- 先用自己的项目做测试。
- 每周挑 1 个开源项目作为样例仓库。
- 沉淀架构报告样例。
- 记录扫描准确率、报告质量和 Agent 错误案例。

中期运营：

- 邀请 5 到 10 个开发者试用。
- 收集“首次理解项目是否节省时间”的反馈。
- 做一批典型案例：Spring Boot 项目、前后端分离项目、微服务项目。

后期运营：

- 做公开 Demo。
- 做架构报告模板库。
- 做插件市场。
- 做工程治理白皮书。

### 3.6 商业视角

免费版：

- 1 个用户。
- 1 个私有仓库或 3 个公开仓库。
- 基础扫描。
- 基础架构报告。
- 有限 Agent 运行次数。

Pro 版：

- 多仓库。
- 深度架构分析。
- Issue 拆解。
- CI 诊断。
- PR 风险审查。
- 历史报告对比。

Team 版：

- 组织空间。
- 成员权限。
- 多项目治理。
- 审计日志。
- 团队报表。
- GitHub App 深度集成。

Enterprise 版：

- 私有化部署。
- GitLab、Gitea、Bitbucket 支持。
- 企业 SSO。
- 私有模型接入。
- 定制分析规则。
- 安全合规支持。

### 3.7 法务与合规视角

必须遵守：

- 只分析用户授权的代码。
- 不绕过访问控制。
- 不提供未授权逆向破解能力。
- 不上传用户代码到未授权第三方。
- 明确告知模型调用会发送哪些上下文。
- 企业版支持完全私有化和本地模型。

文档需要包含：

- Terms of Service
- Privacy Policy
- Security Policy
- Data Processing Policy
- Responsible AI Policy

### 3.8 团队角色视角

即使现在是个人开发，也要按公司角色思考。

产品负责人：

- 定义用户场景、需求优先级、版本边界。

后端负责人：

- 负责 Spring Boot、MySQL、权限、任务、审计和 API。

分析引擎负责人：

- 负责 Rust Analyzer、AST、调用图、依赖图。

Agent 负责人：

- 负责 Agent Runtime、MCP 工具、多 Agent 协作、评估。

前端负责人：

- 负责控制台、图谱展示、任务流、报告阅读体验。

DevOps 负责人：

- 负责 Docker、CI/CD、日志、监控、部署。

安全负责人：

- 负责 Token、沙箱、权限、审计、数据隔离。

## 4. 总体系统架构

### 4.1 目标架构

```text
User
  |
  v
Next.js Web Console
  |
  v
Spring Boot Control Plane
  |
  +--> MySQL
  +--> Redis
  +--> Object Storage
  +--> Temporal
          |
          +--> Rust Code Analyzer
          +--> Go GitHub Worker
          +--> Agent Runtime
                  |
                  +--> MCP GitHub Tool
                  +--> MCP Repo Tool
                  +--> MCP Analyzer Tool
                  +--> MCP Sandbox Tool
                  +--> MCP Database Tool
                  +--> Model Provider
  |
  +--> Qdrant
  +--> Neo4j
  +--> Observability
```

### 4.2 早期工程结构

```text
SourceLens/
  README.md
  docs/
    PROJECT_PLAN.md
    PRD.md
    ROADMAP.md
    ARCHITECTURE.md
    API_DESIGN.md
    DATABASE_DESIGN.md
    SECURITY.md
    AGENT_DESIGN.md
  backend-spring/
    src/
    pom.xml
  analyzer-rust/
    src/
    Cargo.toml
  agent-runtime/
    src/
    pyproject.toml 或 package.json
  github-worker-go/
    cmd/
    internal/
    go.mod
  web-console/
    app/
    package.json
  deploy/
    docker-compose.yml
    mysql/
    redis/
    temporal/
  scripts/
  examples/
```

### 4.3 为什么不是一开始微服务

第一阶段最重要的是快速形成闭环。

Spring Boot 主后端先承担：

- 用户系统。
- 项目系统。
- 仓库系统。
- 任务系统。
- 报告系统。
- 审计系统。

Rust、Go、Agent Runtime 以独立进程或 worker 方式接入。

这样既能练到多语言协作，又不会让服务治理复杂度过早吞掉产品本身。

### 4.4 服务边界

Spring Boot Control Plane：

- 对外 REST API。
- 用户认证。
- 项目管理。
- 仓库管理。
- 任务调度。
- 报告管理。
- 权限审计。

Rust Code Analyzer：

- 输入仓库路径。
- 输出结构化 JSON。
- 做文件扫描、语言识别、依赖解析、AST 节点提取、初步调用图。

Go GitHub Worker：

- 接收 GitHub Webhook。
- 拉取 PR diff。
- 拉取 CI 日志。
- 调用后端创建任务。

Agent Runtime：

- 接收分析任务。
- 调用 MCP tools。
- 调用模型。
- 生成报告、计划、审查意见。

Web Console：

- 展示项目画像。
- 展示任务流。
- 展示架构图。
- 展示报告。
- 展示 Agent 运行过程。

## 5. 技术选型详细规划

### 5.1 后端主框架：Spring Boot

用途：

- 主业务 API。
- 认证和授权。
- 项目、仓库、任务、报告、审计。
- 与 Temporal、Redis、MySQL 集成。

推荐组合：

- Java 21。
- Spring Boot 3.x 稳定版本。
- Spring Web。
- Spring Security。
- Spring Validation。
- Spring Data JPA 或 MyBatis Plus。
- Flyway。
- OpenAPI。
- Micrometer。

早期建议：

- 如果你想练企业级规范，使用 Spring Boot + MyBatis Plus。
- 如果你想更贴近领域建模，使用 Spring Boot + Spring Data JPA。
- 本项目偏工程平台和复杂查询，建议 MyBatis Plus 起步，关键领域对象保持清晰分层。

### 5.2 数据库：MySQL

用途：

- 用户。
- 组织。
- 项目。
- 仓库。
- 扫描任务。
- Agent 运行记录。
- 报告。
- 权限。
- 审计。

版本建议：

- 开发期 MySQL 8.4 LTS。
- 使用 Flyway 管理 schema。
- 所有表必须有 id、created_at、updated_at。
- 重要业务表增加 status、deleted_at 或 is_deleted。

### 5.3 缓存与轻量队列：Redis

用途：

- 登录态或 token 黑名单。
- 请求限流。
- 临时任务状态。
- WebSocket 推送状态。
- Agent 运行锁。
- 仓库扫描锁。

### 5.4 工作流：Temporal

用途：

- 仓库扫描长任务。
- Agent 多步骤任务。
- CI 诊断任务。
- PR 审查任务。
- 自动代码修改任务。

为什么需要：

- Agent 任务会失败。
- 外部 API 会超时。
- 扫描任务可能持续很久。
- 自动修复任务需要可恢复、可重试、可回放。

早期简化：

- v0.1 到 v0.3 可以先用数据库任务表轮询。
- v0.4 或 v0.5 引入 Temporal。

### 5.5 代码分析引擎：Rust

用途：

- 快速扫描大量文件。
- 识别语言和框架。
- 解析 Java、TypeScript、Go、Rust。
- 构建模块依赖。
- 输出 JSON artifact。

早期能力：

- 文件树。
- 语言统计。
- 包管理器识别。
- Spring Boot 项目识别。
- Controller、Service、Repository 初步识别。
- API 路由提取。
- Entity 和 Mapper 提取。

后期能力：

- AST 深度分析。
- 调用图。
- 数据流。
- 依赖图。
- 循环依赖。
- 复杂度统计。
- 代码知识图谱。

可用技术：

- tree-sitter。
- ignore。
- walkdir。
- serde。
- petgraph。
- rayon。

### 5.6 GitHub 集成服务：Go

用途：

- GitHub App Webhook。
- PR event。
- push event。
- check_suite event。
- workflow_run event。
- 拉取 CI 日志。
- 拉取 PR diff。

为什么适合 Go：

- 二进制部署简单。
- 并发 IO 清晰。
- 很适合事件消费和外部系统集成。

早期也可以先放在 Spring Boot：

- 如果第一阶段想减少服务数量，可以先由 Spring Boot 直接调用 GitHub API。
- v0.7 再抽出 Go Worker。

### 5.7 Agent Runtime

推荐路线：

- 早期用 TypeScript 或 Python 快速实现。
- Agent 与后端通过 HTTP 或消息队列通信。
- 所有工具调用结构化记录。

核心概念：

- Agent。
- Run。
- Step。
- Tool Call。
- Observation。
- Report。
- Guardrail。
- Memory。
- Evaluation。

必须支持：

- Planner Agent。
- Architect Agent。
- Code Reader Agent。
- Reviewer Agent。
- Reporter Agent。

后期支持：

- Tester Agent。
- Coder Agent。
- Refactor Agent。
- Security Agent。
- DBA Agent。
- DevOps Agent。

### 5.8 MCP 工具协议

MCP 工具设计：

- github.getRepository
- github.listPullRequests
- github.getPullRequestDiff
- github.getWorkflowRunLogs
- repo.readFile
- repo.searchCode
- repo.listTree
- analyzer.scanRepository
- analyzer.getCallGraph
- analyzer.getApiRoutes
- analyzer.getDbEntities
- sandbox.runTests
- sandbox.applyPatch
- report.createMarkdown

早期不必一次做完。

v0.3 只需要：

- repo.listTree
- repo.readFile
- repo.searchCode
- analyzer.scanRepository
- report.createMarkdown

### 5.9 向量数据库：Qdrant

用途：

- 代码块语义搜索。
- 文档语义搜索。
- 架构报告检索。
- Agent RAG 上下文召回。

早期可以延迟：

- v0.1 到 v0.3 先不引入。
- v0.4 之后再做代码 chunk 和 embedding。

### 5.10 图数据库：Neo4j

用途：

- 模块图。
- 类关系图。
- 调用图。
- 接口到数据库链路。
- 服务依赖图。

早期替代方案：

- 先用 MySQL 存节点和边。
- 前端用图可视化。
- v1.0 后再引入 Neo4j。

### 5.11 前端：Next.js

核心页面：

- 登录页。
- 项目列表。
- 项目总览。
- 仓库扫描任务。
- 架构报告。
- 文件树。
- API 清单。
- 数据库实体。
- 调用链。
- Agent 任务。
- PR Review。
- CI 诊断。
- 设置页。

设计原则：

- 工程平台风格。
- 信息密度高。
- 适合扫描、对比、追踪。
- 不做营销式首页。
- 第一屏就是项目工作台。

### 5.12 监控与可观测

早期：

- 后端日志。
- 任务状态。
- Agent run 日志。
- tool_call 日志。

中期：

- OpenTelemetry。
- Prometheus。
- Grafana。
- Loki。

关键指标：

- 扫描成功率。
- 平均扫描耗时。
- Agent 任务成功率。
- Agent 平均 token 消耗。
- 报告生成耗时。
- CI 诊断准确率。
- PR 审查采纳率。

## 6. 核心领域模型

### 6.1 用户与组织

User：

- id
- username
- email
- password_hash
- avatar_url
- status
- created_at
- updated_at

Organization：

- id
- name
- slug
- owner_id
- plan
- status
- created_at
- updated_at

OrganizationMember：

- id
- organization_id
- user_id
- role
- status
- created_at
- updated_at

### 6.2 项目与仓库

Project：

- id
- organization_id
- name
- description
- primary_language
- framework
- status
- health_score
- created_by
- created_at
- updated_at

Repository：

- id
- project_id
- provider
- owner
- name
- url
- default_branch
- visibility
- auth_type
- encrypted_token_ref
- last_synced_at
- status
- created_at
- updated_at

### 6.3 扫描任务

ScanTask：

- id
- project_id
- repository_id
- branch
- commit_sha
- status
- trigger_type
- started_at
- finished_at
- error_message
- created_by
- created_at
- updated_at

ScanArtifact：

- id
- scan_task_id
- artifact_type
- storage_path
- summary_json
- created_at

### 6.4 代码结构

SourceFile：

- id
- project_id
- scan_task_id
- path
- language
- file_type
- size_bytes
- line_count
- hash
- is_test
- is_generated
- created_at

CodeSymbol：

- id
- project_id
- scan_task_id
- file_id
- symbol_type
- name
- qualified_name
- start_line
- end_line
- metadata_json
- created_at

CodeRelation：

- id
- project_id
- scan_task_id
- source_symbol_id
- target_symbol_id
- relation_type
- confidence
- evidence_json
- created_at

### 6.5 架构模型

Module：

- id
- project_id
- scan_task_id
- name
- path
- module_type
- description
- risk_level
- created_at

ApiEndpoint：

- id
- project_id
- scan_task_id
- method
- path
- controller_symbol_id
- handler_symbol_id
- request_type
- response_type
- auth_required
- created_at

DbEntity：

- id
- project_id
- scan_task_id
- table_name
- entity_name
- file_id
- fields_json
- indexes_json
- created_at

ArchitectureReport：

- id
- project_id
- scan_task_id
- title
- report_type
- content_markdown
- summary
- risk_score
- created_by_agent_run_id
- created_at

### 6.6 Agent 运行记录

AgentRun：

- id
- project_id
- task_type
- user_prompt
- status
- model
- total_tokens
- started_at
- finished_at
- error_message
- created_by
- created_at

AgentStep：

- id
- agent_run_id
- step_index
- agent_name
- step_type
- input_json
- output_json
- status
- started_at
- finished_at

ToolCall：

- id
- agent_run_id
- agent_step_id
- tool_name
- input_json
- output_json
- status
- duration_ms
- error_message
- created_at

### 6.7 工程治理

IssueAnalysis：

- id
- project_id
- agent_run_id
- issue_title
- issue_body
- affected_modules_json
- task_breakdown_json
- risk_list_json
- test_plan_markdown
- created_at

CiDiagnosis：

- id
- project_id
- provider
- workflow_run_id
- status
- error_category
- root_cause
- related_files_json
- suggestion_markdown
- created_at

PrReview：

- id
- project_id
- provider
- pr_number
- base_sha
- head_sha
- risk_level
- summary
- comments_json
- test_gap_json
- created_at

## 7. 版本路线总览

### 7.1 版本阶段表

| 版本 | 名称 | 核心目标 | 结果 |
|---|---|---|---|
| V0.1 | 项目骨架 | 后端最小闭环 | 项目能启动，能创建项目和扫描任务 |
| V0.2 | 仓库扫描 | 系统看见代码 | 能拉仓库，生成文件树和语言统计 |
| V0.3 | 架构画像 | 第一份架构报告 | 能输出项目画像、模块说明、风险清单 |
| V0.4 | 源码级逆向 | 反推系统结构 | 能展示 API、类、调用链、数据库关系 |
| V0.5 | Agent 任务系统 | Agent 参与分析 | 能拆任务、调用工具、生成可追踪报告 |
| V0.6 | Issue 拆解 | 需求到任务 | 能把自然语言需求转为工程计划 |
| V0.7 | CI 诊断 | 进入 CI 流程 | 能分析 GitHub Actions 失败 |
| V0.8 | PR 风险审查 | 进入代码评审 | 能分析 diff 和风险 |
| V0.9 | 发布候选与稳定化 | 集成验收、质量加固、发布准备 | 功能闭环稳定，具备公开演示条件 |
| V1.0 | 公开演示版 | 完整产品闭环 | 可演示、可部署、可试用 |
| V1.5 | 自动改代码 | Agent 执行开发 | 能沙箱改代码、跑测试、生成 PR |
| V2.0 | 团队治理 | 团队平台化 | 多用户、多项目、权限、审计、报表 |
| V3.0 | 企业与生态 | 商业化和插件 | 私有化、插件市场、MCP/Hermes 扩展 |

## 8. V0.1 项目骨架期

### 8.1 目标

跑通最小业务闭环，让 SourceLens 成为一个真正可启动、可调用、可保存数据的后端项目。

### 8.2 功能需求

用户模块：

- 支持用户注册。
- 支持用户登录。
- 支持 JWT 认证。
- 支持获取当前用户信息。
- 支持退出登录。

项目模块：

- 支持创建项目。
- 支持查询项目列表。
- 支持查询项目详情。
- 支持更新项目基础信息。
- 支持删除项目或归档项目。

仓库模块：

- 支持录入 GitHub 仓库 URL。
- 支持保存仓库 provider、owner、repo、branch。
- 暂时可以不做 OAuth，先支持个人访问令牌。
- Token 必须加密或至少预留加密字段。

扫描任务模块：

- 支持创建扫描任务。
- 支持查询扫描任务列表。
- 支持查询扫描任务详情。
- 支持任务状态：pending、running、success、failed、cancelled。
- 支持保存错误信息。

系统模块：

- 健康检查接口。
- OpenAPI 文档。
- 全局异常处理。
- 参数校验。
- 统一响应结构。

### 8.3 非功能需求

- 后端可本地启动。
- MySQL 可通过 Docker Compose 启动。
- Redis 可通过 Docker Compose 启动。
- 数据库迁移使用 Flyway。
- 所有接口有基础错误码。
- 关键操作有日志。

### 8.4 数据库表

必须实现：

- users
- projects
- repositories
- scan_tasks

### 8.5 API

认证：

- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- POST /api/auth/logout

项目：

- POST /api/projects
- GET /api/projects
- GET /api/projects/{projectId}
- PUT /api/projects/{projectId}
- DELETE /api/projects/{projectId}

仓库：

- POST /api/projects/{projectId}/repositories
- GET /api/projects/{projectId}/repositories
- GET /api/repositories/{repositoryId}

扫描：

- POST /api/repositories/{repositoryId}/scan-tasks
- GET /api/projects/{projectId}/scan-tasks
- GET /api/scan-tasks/{scanTaskId}

系统：

- GET /api/health

### 8.6 验收标准

- 可以注册登录。
- 可以创建项目。
- 可以绑定一个 GitHub 仓库 URL。
- 可以创建扫描任务。
- 扫描任务可以从 pending 更新到 running，再更新到 success 或 failed。
- README 中有本地启动方式。
- Docker Compose 能启动依赖。

## 9. V0.2 仓库扫描期

### 9.1 目标

让系统真正读取一个授权仓库，生成基础代码画像。

### 9.2 功能需求

Git 仓库处理：

- 支持通过 URL clone 仓库。
- 支持指定分支。
- 支持记录 commit_sha。
- 支持仓库临时目录隔离。
- 支持扫描完成后清理临时目录。

Rust Analyzer：

- 接收 repo_path。
- 输出 scan_result.json。
- 扫描文件树。
- 统计文件数量。
- 统计代码行数。
- 统计语言占比。
- 识别测试文件。
- 识别生成文件。
- 识别大文件和二进制文件。
- 识别包管理器。

框架识别：

- Java Maven。
- Java Gradle。
- Spring Boot。
- Node npm。
- Node pnpm。
- Go Modules。
- Rust Cargo。

结果入库：

- 保存 source_files。
- 保存 language_stats。
- 保存 scan_artifacts。
- 保存基础项目画像。

### 9.3 输出样例

```json
{
  "repository": {
    "branch": "main",
    "commit_sha": "abc123"
  },
  "summary": {
    "total_files": 320,
    "code_files": 218,
    "test_files": 42,
    "primary_language": "Java",
    "frameworks": ["Spring Boot"]
  },
  "languages": [
    {"name": "Java", "files": 168, "lines": 22000},
    {"name": "YAML", "files": 12, "lines": 600}
  ]
}
```

### 9.4 前端页面

项目总览：

- 项目名称。
- 仓库地址。
- 当前分支。
- 最新 commit。
- 主语言。
- 文件总数。
- 代码行数。
- 测试文件数量。
- 最近扫描时间。

文件树：

- 按目录展示。
- 支持搜索路径。
- 支持按语言过滤。

### 9.5 验收标准

- 输入一个公开 GitHub 仓库 URL 后可以完成扫描。
- 页面能展示语言占比、文件树和基础统计。
- Rust Analyzer 可以独立命令行运行。
- Spring Boot 可以调用 Rust Analyzer 并保存结果。

## 10. V0.3 架构画像期

### 10.1 目标

生成第一份有真实价值的架构分析报告。

### 10.2 功能需求

目录结构理解：

- 识别 src/main/java。
- 识别 src/test/java。
- 识别 resources。
- 识别 config。
- 识别 controller、service、repository、mapper、entity、dto、vo、common、config 等目录。

Spring Boot 识别：

- 识别启动类。
- 识别 application.yml / application.properties。
- 识别 Controller。
- 识别 Service。
- 识别 Repository / Mapper。
- 识别 Entity。
- 识别 Configuration。

API 初步提取：

- 提取 RequestMapping。
- 提取 GetMapping。
- 提取 PostMapping。
- 提取 PutMapping。
- 提取 DeleteMapping。
- 提取 PatchMapping。
- 记录 method、path、class、method_name、line。

数据库实体提取：

- 识别 @Entity。
- 识别 @Table。
- 识别 MyBatis Mapper。
- 识别 XML mapper 文件。
- 识别表名。

Agent 架构报告：

- 技术栈总结。
- 目录结构解释。
- 核心模块说明。
- API 概览。
- 数据库实体概览。
- 架构风险。
- 技术债。
- 下一步改进建议。

### 10.3 Agent 报告模板

报告结构：

- 项目概览。
- 技术栈。
- 目录结构。
- 核心模块。
- API 入口。
- 数据访问层。
- 运行和部署方式。
- 架构优点。
- 架构风险。
- 技术债清单。
- 优先改造建议。
- 证据索引。

### 10.4 风险识别规则

早期规则：

- Controller 过大。
- Service 方法过长。
- 缺少测试目录。
- 配置中存在疑似密钥。
- 模块命名混乱。
- common/util 过重。
- 循环依赖初步迹象。
- SQL 分散。
- 异常处理不统一。
- 缺少全局返回结构。

### 10.5 验收标准

- 对一个 Spring Boot 项目生成 Markdown 架构报告。
- API 清单至少覆盖 80% 常见 Mapping 注解。
- 能识别 Controller、Service、Repository、Entity。
- 报告中的结论能链接到文件路径或代码证据。

## 11. V0.4 源码级逆向期

### 11.1 目标

从源码反推出系统结构，展示 API 到业务逻辑再到数据库的链路。

### 11.2 功能需求

符号提取：

- 类。
- 接口。
- 方法。
- 字段。
- 注解。
- 包名。
- 继承关系。
- 实现关系。

调用关系：

- 方法调用方法。
- Controller 调用 Service。
- Service 调用 Repository。
- Repository 调用 SQL 或 Entity。

模块依赖：

- package 依赖。
- module 依赖。
- layer 依赖。
- 识别跨层调用。

API 链路：

- 选择一个 API。
- 展示入口 Controller。
- 展示调用的 Service 方法。
- 展示 Repository 或 Mapper。
- 展示相关 Entity 或数据库表。
- 展示风险和测试建议。

图谱展示：

- 模块依赖图。
- 类关系图。
- API 调用链图。
- 数据库实体关系图。

### 11.3 技术实现

Rust Analyzer：

- 使用 tree-sitter-java 解析 Java。
- 使用 petgraph 构建图。
- 输出 nodes 和 edges。

后端：

- 保存 CodeSymbol。
- 保存 CodeRelation。
- 提供图查询 API。

前端：

- 使用图组件展示 nodes 和 edges。
- 支持点击节点查看文件路径和代码范围。

### 11.4 验收标准

- 能对 Spring Boot 项目生成模块依赖图。
- 能对至少一个 API 展示 Controller -> Service -> Repository 链路。
- 图节点点击后能看到对应文件路径和行号。
- 逆向结果可以导出为 Markdown 和 Mermaid。

## 12. V0.5 Agent 任务系统期

### 12.1 目标

让 SourceLens 从静态分析工具升级为 Agentic 工程协作平台。

### 12.2 Agent 角色

Planner Agent：

- 理解用户目标。
- 拆解任务步骤。
- 决定调用哪些工具。

Architect Agent：

- 分析系统结构。
- 判断模块边界。
- 识别架构风险。

Code Reader Agent：

- 根据目标读取相关文件。
- 总结代码行为。
- 找证据。

Reviewer Agent：

- 评估风险。
- 提出 Review 意见。
- 判断测试缺口。

Reporter Agent：

- 整理最终报告。
- 生成 Markdown。
- 给出可执行建议。

### 12.3 Agent 任务类型

- ARCHITECTURE_ANALYSIS
- MODULE_ANALYSIS
- API_TRACE_ANALYSIS
- RISK_REVIEW
- ISSUE_BREAKDOWN
- CI_DIAGNOSIS
- PR_REVIEW
- CODE_CHANGE_PLAN

### 12.4 运行过程

标准流程：

1. 用户创建任务。
2. 后端创建 AgentRun。
3. Planner Agent 生成计划。
4. Agent 调用工具读取项目上下文。
5. Agent 形成中间结论。
6. Reviewer Agent 检查结论是否有证据。
7. Reporter Agent 输出最终报告。
8. 后端保存步骤、工具调用、报告。
9. 前端展示全过程。

### 12.5 可观测要求

每次 Agent 运行必须记录：

- 用户输入。
- 使用的模型。
- 每一步 Agent。
- 每一次工具调用。
- 工具输入。
- 工具输出摘要。
- token 消耗。
- 耗时。
- 错误。
- 最终报告。

### 12.6 验收标准

- 用户可以创建一个“分析登录模块”的 Agent 任务。
- 页面展示 Agent 执行步骤。
- 后端保存 tool_call。
- 最终生成一份带文件证据的报告。

## 13. V0.6 Issue 拆解期

### 13.1 目标

把自然语言需求转化为可执行工程任务。

### 13.2 输入

用户输入：

- 标题。
- 需求描述。
- 业务背景。
- 优先级。
- 可选关联模块。

### 13.3 输出

Agent 输出：

- 需求理解。
- 影响模块。
- 影响 API。
- 影响数据库。
- 开发任务拆解。
- 测试任务拆解。
- 风险点。
- 依赖事项。
- 验收标准。
- 建议分支名。
- 建议 commit 粒度。

### 13.4 导出

支持导出：

- Markdown。
- GitHub Issue。
- Jira 格式。
- Linear 格式。

早期只做 Markdown 和 GitHub Issue。

### 13.5 验收标准

- 输入一个需求后，系统能生成不少于 5 个工程任务。
- 每个任务包含目标、改动范围、文件证据、风险和测试建议。
- 可以一键复制 Markdown。

## 14. V0.7 CI 诊断期

### 14.1 目标

SourceLens 进入真实 CI/CD 工作流，帮助用户诊断构建失败。

### 14.2 功能需求

GitHub Actions 集成：

- 接收 workflow_run 事件。
- 获取 workflow 状态。
- 获取失败 job。
- 拉取失败日志。
- 提取错误片段。

错误分类：

- 编译错误。
- 单元测试失败。
- 集成测试失败。
- 依赖安装失败。
- 格式检查失败。
- Lint 失败。
- Docker 构建失败。
- 环境变量缺失。

诊断报告：

- 失败摘要。
- 根因判断。
- 相关文件。
- 相关提交。
- 修复建议。
- 是否可能由当前 PR 引入。

### 14.3 验收标准

- GitHub Actions 失败后能创建诊断任务。
- 系统能展示错误分类和日志摘要。
- Agent 能给出修复建议。
- 诊断报告包含相关文件或命令。

## 15. V0.8 PR 风险审查期

### 15.1 目标

SourceLens 成为 PR Review 的辅助工具。

### 15.2 功能需求

PR 数据：

- 拉取 PR 标题。
- 拉取 PR 描述。
- 拉取 changed files。
- 拉取 diff。
- 拉取 commit 列表。
- 关联 CI 状态。

风险分析：

- 判断改动类型。
- 判断影响模块。
- 判断是否改数据库。
- 判断是否改公共方法。
- 判断是否改配置。
- 判断是否缺少测试。
- 判断是否破坏 API 兼容。
- 判断是否有安全风险。

Review 输出：

- 总体风险等级：low、medium、high、critical。
- 变更摘要。
- 影响范围。
- 测试建议。
- 行级评论建议。
- 是否建议合并。

### 15.3 GitHub 评论策略

早期：

- 只在 SourceLens 页面展示。
- 用户手动复制。

中期：

- 用户点击确认后评论到 GitHub。

后期：

- 根据规则自动评论低风险建议。
- 高风险建议必须人工确认。

### 15.4 验收标准

- 对一个 PR 生成风险报告。
- 能列出 changed files 的影响范围。
- 能识别至少 5 类风险。
- 能生成可发布到 GitHub 的 Review 评论。

## 16. V0.9 发布候选与稳定化期

### 16.1 目标

把 V0.1 到 V0.8 的功能从“能跑通”打磨到“能稳定演示、能邀请外部用户试用、能持续迭代”。

V0.9 不追求新增大型功能，而是解决集成、质量、安全、部署、文档、体验和演示数据问题。它是 V1.0 的发布候选版本。

### 16.2 功能收敛

必须冻结的核心闭环：

- 用户注册登录。
- 项目管理。
- 仓库管理。
- 仓库扫描任务。
- 项目架构画像。
- 源码级逆向分析。
- Agent 分析任务。
- Issue 拆解。
- CI 诊断。
- PR 风险审查。
- 仪表盘展示。

V0.9 期间原则上不再新增大功能，只允许：

- 修复 bug。
- 优化交互。
- 补充测试。
- 加固安全。
- 完善部署。
- 完善文档。
- 提升稳定性。

### 16.3 集成验收

必须完整跑通以下链路：

1. 新用户注册登录。
2. 创建项目。
3. 添加 GitHub 仓库。
4. 触发仓库扫描。
5. 生成文件树、语言统计、API 清单、数据库实体。
6. 生成架构报告。
7. 查看模块依赖图或 Mermaid 图。
8. 创建 Agent 架构分析任务。
9. 创建 Issue 拆解任务。
10. 对一个 PR 生成风险审查。
11. 对一次 CI 失败生成诊断报告。

每条链路都要有：

- 正常路径。
- 错误路径。
- 空状态。
- 加载状态。
- 重试策略。
- 用户可理解的错误提示。

### 16.4 测试要求

后端测试：

- Auth 模块单元测试。
- Project 模块单元测试。
- Repository 模块单元测试。
- ScanTask 模块单元测试。
- AgentRun 模块单元测试。
- 核心 API 集成测试。

Rust Analyzer 测试：

- 文件树扫描测试。
- 语言识别测试。
- Spring Boot Controller 识别测试。
- API Mapping 提取测试。
- Entity 识别测试。
- 输出 JSON 快照测试。

Agent 测试：

- 架构报告样例测试。
- Issue 拆解样例测试。
- PR Review 样例测试。
- 工具调用记录测试。
- 幻觉检查样例测试。

前端测试：

- 登录页。
- 项目列表。
- 项目总览。
- 扫描任务页。
- 架构报告页。
- Agent Run 页。

### 16.5 安全加固

必须完成：

- `.env` 管理本地敏感配置。
- `.env.example` 提供示例。
- `.env` 加入 `.gitignore`。
- GitHub Token 不明文打印。
- 数据库应用用户不使用 root。
- API 鉴权覆盖所有项目级接口。
- 用户只能访问自己的项目。
- Agent 工具调用必须有审计记录。
- 仓库临时目录必须隔离。
- 扫描完成后清理临时目录。

建议完成：

- 增加基础限流。
- 增加请求日志 request_id。
- 增加敏感字段脱敏。
- 增加 Secret 扫描初版。

### 16.6 部署准备

必须具备：

- Docker Compose 一键启动。
- MySQL 初始化脚本。
- Redis 配置。
- 后端容器化。
- 前端容器化。
- Analyzer 构建方式。
- Agent Runtime 启动方式。
- 本地开发启动文档。
- 演示环境启动文档。

推荐具备：

- Makefile 或 task 脚本。
- 健康检查接口。
- 容器启动顺序说明。
- 默认演示账号。
- 默认演示仓库。

### 16.7 文档准备

必须补齐：

- README.md。
- docs/PRD.md。
- docs/ARCHITECTURE.md。
- docs/API_DESIGN.md。
- docs/DATABASE_DESIGN.md。
- docs/AGENT_DESIGN.md。
- docs/SECURITY.md。
- docs/DEPLOYMENT.md。
- docs/DEMO_SCRIPT.md。

README 必须包含：

- 项目简介。
- 技术栈。
- 本地启动。
- 环境变量。
- 功能截图或说明。
- 版本路线。

### 16.8 演示数据

必须准备：

- 一个公开 Spring Boot 示例仓库。
- 一次成功扫描结果。
- 一份架构报告样例。
- 一个 Issue 拆解样例。
- 一个 PR 风险审查样例。
- 一个 CI 诊断样例。

演示数据目标：

- 新用户无需自己准备仓库，也能理解 SourceLens 能做什么。
- 演示链路可以在 10 分钟内完整走完。

### 16.9 性能与稳定性

必须关注：

- 中型项目扫描耗时。
- Agent 任务平均耗时。
- API P95 响应时间。
- 扫描任务失败率。
- Agent 任务失败率。
- 前端首屏加载时间。

基础目标：

- 后端健康检查稳定。
- 中型 Spring Boot 项目可以稳定扫描。
- 任务失败后有明确错误原因。
- Agent 失败后可以重新运行。
- 页面刷新后任务状态不丢失。

### 16.10 验收标准

- 能完整演示从注册到 PR 风险审查的主链路。
- Docker Compose 可以一键启动主要依赖。
- 核心接口有测试覆盖。
- 架构报告、Issue 拆解、CI 诊断、PR Review 都有样例。
- 所有核心页面有空状态、加载状态和错误状态。
- `.env`、Token、项目权限、工具调用审计完成基础安全加固。
- 文档足够让另一个开发者在本地跑起来。

## 17. V1.0 公开演示版

### 17.1 目标

形成完整产品闭环，可以部署、演示、邀请用户试用。

### 17.2 必须具备

账号：

- 注册。
- 登录。
- 用户信息。

仓库：

- GitHub 仓库接入。
- 仓库扫描。
- 扫描历史。

架构分析：

- 项目画像。
- 技术栈。
- 文件树。
- 模块说明。
- API 清单。
- 数据库实体。
- 架构报告。

逆向分析：

- 模块依赖图。
- API 调用链。
- 类关系。
- Mermaid 导出。

Agent：

- 架构分析任务。
- 模块分析任务。
- Issue 拆解任务。
- Agent 运行记录。
- Tool Call 记录。

工程治理：

- CI 诊断。
- PR 风险审查。

部署：

- Docker Compose。
- 一键初始化。
- 样例仓库。
- 演示数据。

### 17.3 演示脚本

演示流程：

1. 用户登录。
2. 创建项目。
3. 接入 GitHub 仓库。
4. 点击扫描。
5. 查看项目画像。
6. 查看架构报告。
7. 点击一个 API 查看调用链。
8. 输入一个需求，让 Agent 拆解 Issue。
9. 选择一个 PR，生成风险审查。
10. 查看 Agent 执行过程和工具调用。

### 17.4 质量标准

- 新用户 10 分钟内能完成首次仓库分析。
- 一个中型 Spring Boot 项目扫描成功率超过 90%。
- Agent 报告必须包含代码证据。
- 页面不能只展示大段文本，必须有结构化信息。
- 系统失败时必须给出明确错误原因。

## 18. V1.5 自动改代码期

### 18.1 目标

让 Agent 从分析者变成受控执行者。

### 18.2 功能需求

代码修改流程：

1. 用户输入目标。
2. Planner Agent 拆解修改计划。
3. 系统展示计划。
4. 用户确认。
5. 沙箱克隆仓库。
6. Coder Agent 修改代码。
7. Tester Agent 运行测试。
8. Reviewer Agent 审查 diff。
9. 系统生成结果。
10. 用户确认创建 PR。

### 18.3 沙箱要求

必须支持：

- 临时目录隔离。
- 命令白名单。
- 超时限制。
- 输出截断。
- 环境变量隔离。
- 禁止访问宿主敏感目录。
- 运行日志记录。

后期支持：

- 容器沙箱。
- 网络策略。
- CPU 和内存限制。
- 文件系统快照。

### 18.4 风险控制

- Agent 不能直接 push 到主分支。
- Agent 不能默认修改 CI secret。
- Agent 不能默认删除大量文件。
- 高风险修改必须二次确认。
- 所有 diff 必须可查看。

### 18.5 验收标准

- Agent 能完成一个低风险代码修改。
- 能运行项目测试。
- 能生成 diff。
- 能创建 GitHub PR。
- 全过程可回放。

## 19. V2.0 团队工程治理平台

### 19.1 目标

从个人工具升级为团队平台。

### 19.2 功能需求

组织：

- 创建组织。
- 邀请成员。
- 成员角色。
- 项目权限。

多仓库：

- 一个组织管理多个项目。
- 多仓库统一扫描。
- 项目分组。

治理指标：

- 架构健康分。
- 技术债数量。
- 高风险 PR 数。
- CI 失败率。
- 测试覆盖趋势。
- 模块耦合度。
- 循环依赖数量。

报表：

- 项目健康报告。
- 周报。
- 月报。
- 技术债趋势。
- PR 风险趋势。

### 19.3 权限模型

角色：

- Owner。
- Admin。
- Maintainer。
- Developer。
- Viewer。

权限：

- 查看项目。
- 管理仓库。
- 触发扫描。
- 创建 Agent 任务。
- 查看审计日志。
- 管理成员。
- 配置 GitHub App。

### 19.4 验收标准

- 支持组织和成员。
- 支持项目级权限。
- 支持多仓库看板。
- 支持团队审计日志。

## 20. V3.0 企业版与生态期

### 20.1 目标

支持企业落地、私有化部署和插件生态。

### 20.2 企业能力

- 私有化部署。
- 离线部署文档。
- GitLab 支持。
- 企业 SSO。
- LDAP。
- 私有模型。
- 内网向量数据库。
- 企业审计导出。
- 数据保留策略。

### 20.3 插件生态

插件类型：

- 语言分析插件。
- 框架分析插件。
- CI/CD 插件。
- 安全扫描插件。
- 文档生成插件。
- Agent Skill 插件。
- MCP Tool 插件。

### 20.4 Hermes 能力规划

这里的 Hermes 可以作为 SourceLens 的高级 Agent 能力层来规划。

Hermes 方向重点：

- 强化工具调用能力。
- 支持结构化函数调用。
- 支持多 Agent 协作协议。
- 支持可插拔 Agent Skill。
- 支持工程任务的 plan -> act -> observe -> review 循环。
- 支持 Agent 记忆和项目知识沉淀。

SourceLens 中的 Hermes 能力可以落成：

- Hermes Planner。
- Hermes Code Reader。
- Hermes Architect。
- Hermes Reviewer。
- Hermes Tool Router。
- Hermes Memory。
- Hermes Evaluation。

### 20.5 验收标准

- 支持至少一种企业 Git 平台。
- 支持私有模型配置。
- 支持插件注册和启停。
- 支持 MCP 工具市场雏形。

## 21. 细化需求清单

### 21.1 认证与用户

必须有：

- 注册。
- 登录。
- JWT。
- 密码加密。
- 当前用户。
- 退出登录。

后续有：

- GitHub OAuth。
- 邮箱验证。
- 找回密码。
- 两步验证。
- SSO。

### 21.2 项目管理

必须有：

- 创建项目。
- 项目列表。
- 项目详情。
- 更新项目。
- 归档项目。

后续有：

- 项目标签。
- 项目分组。
- 项目健康分。
- 项目成员。
- 项目报告导出。

### 21.3 仓库管理

必须有：

- 添加仓库。
- 选择默认分支。
- 保存访问凭证。
- 手动触发同步。

后续有：

- GitHub App 安装。
- 多分支分析。
- tag 分析。
- commit 对比。
- monorepo 支持。

### 21.4 扫描系统

必须有：

- 创建扫描任务。
- 查看任务状态。
- 查看任务日志。
- 查看扫描结果。

后续有：

- 定时扫描。
- 增量扫描。
- 失败重试。
- 任务取消。
- 并发控制。

### 21.5 代码分析

必须有：

- 文件树。
- 语言统计。
- 框架识别。
- Controller 识别。
- Service 识别。
- Repository 识别。
- Entity 识别。
- API 识别。

后续有：

- 调用图。
- 数据流。
- 模块边界。
- 循环依赖。
- 复杂度。
- 架构规则检查。

### 21.6 架构报告

必须有：

- 项目概览。
- 技术栈。
- 目录说明。
- 核心模块。
- API 概览。
- 数据库概览。
- 风险清单。
- 改进建议。

后续有：

- 报告版本对比。
- 报告导出 PDF。
- 报告分享链接。
- 报告评论。

### 21.7 Agent 任务

必须有：

- 创建任务。
- 执行任务。
- 查看步骤。
- 查看工具调用。
- 查看最终报告。

后续有：

- 任务模板。
- 任务重跑。
- 任务暂停恢复。
- 多 Agent 协作。
- Agent 评估。

### 21.8 PR 审查

必须有：

- 拉取 PR diff。
- 分析变更文件。
- 输出风险摘要。

后续有：

- 行级评论。
- 自动评论 GitHub。
- Review 规则配置。
- 误报反馈。

### 21.9 CI 诊断

必须有：

- 拉取 CI 日志。
- 错误分类。
- 生成诊断报告。

后续有：

- 历史失败关联。
- 自动定位引入 commit。
- 自动生成修复计划。

### 21.10 自动改代码

必须有：

- 生成修改计划。
- 用户确认。
- 沙箱执行。
- 生成 diff。

后续有：

- 自动测试。
- 自动 PR。
- 自动回滚。
- 多轮修复。

## 22. 数据与智能能力规划

### 22.1 代码索引

代码索引分三层：

文本索引：

- 文件路径。
- 文件内容。
- symbol 名称。

结构索引：

- 类。
- 方法。
- 注解。
- API。
- Entity。
- 调用关系。

语义索引：

- 代码 chunk embedding。
- 架构报告 embedding。
- Issue embedding。
- PR embedding。

### 22.2 知识图谱

节点类型：

- Project。
- Module。
- Package。
- File。
- Class。
- Method。
- API。
- DatabaseTable。
- Config。
- CIWorkflow。

边类型：

- CONTAINS。
- IMPORTS。
- CALLS。
- IMPLEMENTS。
- EXTENDS。
- READS_TABLE。
- WRITES_TABLE。
- EXPOSES_API。
- DEPENDS_ON。
- TESTS。

### 22.3 Agent 记忆

短期记忆：

- 当前任务上下文。
- 当前读取的文件。
- 当前工具结果。

项目记忆：

- 项目技术栈。
- 模块说明。
- 历史风险。
- 历史报告。

团队记忆：

- 团队规范。
- Review 偏好。
- 命名习惯。
- 测试习惯。

### 22.4 Agent 评估

评估维度：

- 结论是否有证据。
- 是否引用正确文件。
- 是否产生虚构 API。
- 风险判断是否准确。
- 建议是否可执行。
- 报告是否结构清晰。

评估方式：

- 人工反馈。
- 样例仓库 benchmark。
- 规则检查。
- LLM Judge。
- 回归测试集。

## 23. API 设计原则

统一响应：

```json
{
  "code": "SUCCESS",
  "message": "ok",
  "data": {}
}
```

错误响应：

```json
{
  "code": "PROJECT_NOT_FOUND",
  "message": "Project not found",
  "details": {}
}
```

分页响应：

```json
{
  "items": [],
  "page": 1,
  "page_size": 20,
  "total": 100
}
```

接口原则：

- URL 使用名词。
- 状态变化使用明确 action。
- 复杂任务创建后异步执行。
- 所有异步任务都能查询状态。
- 所有用户操作都要鉴权。

## 24. 数据库设计原则

通用字段：

- id。
- created_at。
- updated_at。
- created_by。
- updated_by。
- status。

索引原则：

- 外键字段建索引。
- 查询列表字段建组合索引。
- status + created_at 常用于任务列表。
- project_id 是高频过滤字段。

JSON 字段原则：

- 可以保存分析结果摘要。
- 不把核心查询字段只放 JSON。
- JSON artifact 大文件放对象存储。

迁移原则：

- 所有 schema 通过 Flyway。
- 禁止手工改线上表。
- 每次版本升级有迁移脚本。

## 25. 安全设计原则

Token：

- 加密存储。
- 不在日志打印。
- 不返回前端。
- 支持撤销。

仓库代码：

- 临时目录隔离。
- 扫描完成清理。
- 私有仓库不进入公开样例。

Agent：

- 工具白名单。
- 命令白名单。
- 文件访问边界。
- 高风险操作确认。
- 工具调用审计。

模型调用：

- 明确上下文范围。
- 企业版支持私有模型。
- 敏感文件默认过滤。

## 26. 前端信息架构

### 26.1 导航

主导航：

- Projects。
- Agent Runs。
- PR Reviews。
- CI Diagnostics。
- Reports。
- Settings。

项目内导航：

- Overview。
- Architecture。
- Files。
- APIs。
- Database。
- Graph。
- Agents。
- Risks。
- Settings。

### 26.2 项目总览页

模块：

- 项目基本信息。
- 最新扫描状态。
- 技术栈。
- 语言占比。
- 架构健康分。
- 高风险项。
- 最近 Agent 任务。
- 最近 PR Review。

### 26.3 架构页

模块：

- 架构报告。
- 模块列表。
- 模块依赖图。
- 技术债。
- 改进建议。

### 26.4 API 页

模块：

- API 列表。
- Method。
- Path。
- Controller。
- Auth。
- 关联 Service。
- 关联数据库。

### 26.5 Agent Run 页

模块：

- 用户输入。
- 执行状态。
- 步骤时间线。
- 工具调用。
- token 消耗。
- 最终报告。
- 错误详情。

## 27. 开发里程碑

### 27.1 第 1 周

目标：

- 建立项目骨架。
- Spring Boot 启动。
- MySQL、Redis、Docker Compose。
- 用户和项目 API。

交付：

- backend-spring。
- deploy/docker-compose.yml。
- users、projects 表。
- 注册登录接口。
- 项目 CRUD。

### 27.2 第 2 周

目标：

- 仓库模块。
- 扫描任务模块。
- Rust Analyzer 骨架。

交付：

- repositories 表。
- scan_tasks 表。
- Rust CLI 接收 repo path。
- 后端创建扫描任务。

### 27.3 第 3 周

目标：

- 仓库 clone。
- 文件树扫描。
- 语言统计。

交付：

- source_files 表。
- language_stats。
- scan_result.json。
- 项目画像 API。

### 27.4 第 4 周

目标：

- Spring Boot 深度识别。
- API 提取。
- Entity 提取。

交付：

- api_endpoints 表。
- db_entities 表。
- Controller/Service/Repository 识别。
- 架构报告初版。

### 27.5 第 5 周

目标：

- 前端项目工作台。
- 展示扫描结果。

交付：

- 项目列表页。
- 项目总览页。
- 文件树页。
- API 清单页。

### 27.6 第 6 周

目标：

- Agent Runtime 初版。
- 架构报告 Agent。

交付：

- agent_runs 表。
- agent_steps 表。
- tool_calls 表。
- Agent 任务页面。

### 27.7 第 7 周

目标：

- 调用链和逆向图。

交付：

- CodeSymbol。
- CodeRelation。
- API 调用链。
- Mermaid 导出。

### 27.8 第 8 周

目标：

- V1.0 前的演示闭环。

交付：

- 样例仓库。
- 演示脚本。
- Docker 一键启动。
- 完整 README。

## 28. 开发顺序建议

严格按照这个顺序推进：

1. 文档和目录结构。
2. Spring Boot 基础工程。
3. MySQL schema 和 Flyway。
4. 用户认证。
5. 项目管理。
6. 仓库管理。
7. 扫描任务。
8. Rust Analyzer CLI。
9. 后端调用 Rust Analyzer。
10. 扫描结果入库。
11. 项目画像 API。
12. 前端项目页。
13. Spring Boot 结构识别。
14. 架构报告。
15. Agent Runtime。
16. MCP 工具。
17. 逆向图谱。
18. Issue 拆解。
19. CI 诊断。
20. PR 审查。
21. 自动改代码。

## 29. 第一阶段最小可开发任务拆分

### 29.1 初始化仓库

任务：

- 创建 docs。
- 创建 backend-spring。
- 创建 analyzer-rust。
- 创建 deploy。
- 创建 .gitignore。
- 创建 README。

验收：

- 仓库结构清晰。
- 文档可读。

### 29.2 后端基础

任务：

- 初始化 Spring Boot。
- 配置 MySQL。
- 配置 Redis。
- 配置 Flyway。
- 配置全局异常。
- 配置统一响应。
- 配置 OpenAPI。

验收：

- GET /api/health 返回成功。
- Swagger 可访问。

### 29.3 用户模块

任务：

- users 表。
- 注册接口。
- 登录接口。
- JWT filter。
- 当前用户接口。

验收：

- 可以注册登录。
- 受保护接口无 token 不能访问。

### 29.4 项目模块

任务：

- projects 表。
- 创建项目。
- 项目列表。
- 项目详情。
- 更新项目。
- 归档项目。

验收：

- 用户只能看到自己的项目。

### 29.5 仓库模块

任务：

- repositories 表。
- 仓库 URL 解析。
- 保存 provider、owner、repo。
- 保存默认分支。
- Token 字段预留加密。

验收：

- 可以为项目添加仓库。

### 29.6 扫描任务模块

任务：

- scan_tasks 表。
- 创建任务。
- 状态机。
- 任务日志。
- 手动标记成功失败。

验收：

- 可以创建扫描任务并查询状态。

### 29.7 Rust Analyzer 骨架

任务：

- 创建 Rust CLI。
- 支持命令：scan --repo-path。
- 输出 JSON。
- 扫描文件树。
- 统计语言。

验收：

- 对本地目录运行后输出 scan_result.json。

### 29.8 后端集成 Analyzer

任务：

- Spring Boot 调用 Rust CLI。
- 捕获 stdout/stderr。
- 解析 JSON。
- 保存结果。

验收：

- 点击扫描后能生成项目画像。

## 30. 质量标准

代码质量：

- 每个模块有清晰包结构。
- Controller 不写业务逻辑。
- Service 不直接拼 SQL。
- DTO、VO、Entity 分离。
- 统一异常处理。
- 统一响应。

测试质量：

- 核心 Service 单元测试。
- API 集成测试。
- Analyzer 快照测试。
- Agent prompt 回归样例。

文档质量：

- 每个版本有变更说明。
- 每个模块有 README。
- API 有 OpenAPI。
- 数据库有 ER 说明。

用户体验：

- 任务状态明确。
- 错误原因可理解。
- 报告有证据。
- 页面适合快速扫描。

## 31. 风险与应对

风险 1：范围过大

应对：

- 每个版本只做一个核心目标。
- V1 前只深度支持 Spring Boot。
- 其他语言只做基础扫描。

风险 2：Agent 幻觉

应对：

- 报告必须引用代码证据。
- 工具结果作为主要上下文。
- 引入评估样例。

风险 3：代码分析难度高

应对：

- 先规则识别。
- 再 AST。
- 再调用图。
- 再知识图谱。

风险 4：安全问题

应对：

- 早期不自动改代码。
- Token 加密。
- 沙箱执行。
- 工具调用审计。

风险 5：前端图谱复杂

应对：

- 第一版用 Mermaid。
- 第二版用图组件。
- 第三版做交互式图谱。

## 32. 成功指标

个人学习指标：

- 能独立搭建 Spring Boot 企业级后端。
- 能写 Rust CLI。
- 能理解和构建 Agent Runtime。
- 能设计 MCP 工具。
- 能完成完整产品部署。

产品指标：

- 首次扫描成功率。
- 架构报告生成成功率。
- 用户从接入仓库到看到报告的时间。
- Agent 报告采纳率。
- PR Review 建议采纳率。

技术指标：

- 扫描耗时。
- Agent 平均耗时。
- token 成本。
- 任务失败率。
- API P95 延迟。

商业指标：

- 注册用户数。
- 接入仓库数。
- 周活跃用户。
- Pro 转化率。
- 团队试用数。

## 33. 开发原则

原则 1：真实项目优先

所有功能都要能服务真实仓库，不为了 Demo 写假逻辑。

原则 2：证据优先

所有 Agent 结论都必须有代码证据。

原则 3：可回放优先

所有任务、步骤、工具调用都必须记录。

原则 4：小版本闭环

每个版本都要能演示一个完整能力。

原则 5：安全默认

Agent 不能默认拥有高风险权限。

原则 6：先单体，后拆分

业务没跑通前不要过度微服务化。

原则 7：先规则，后智能

能用确定性分析做的，不完全依赖 LLM。

## 34. 近期行动清单

第一优先级：

- 创建 PRD.md。
- 创建 ARCHITECTURE.md。
- 初始化 backend-spring。
- 初始化 deploy/docker-compose.yml。
- 设计 V0.1 数据库表。

第二优先级：

- 初始化 analyzer-rust。
- 实现文件树扫描。
- 实现语言统计。
- 后端集成 Analyzer。

第三优先级：

- 初始化 web-console。
- 做项目列表和项目总览。
- 展示扫描结果。

第四优先级：

- 实现 Spring Boot 项目结构识别。
- 生成架构报告。
- 引入 Agent Runtime。

## 35. 第一版 PRD 简表

产品名称：SourceLens

版本：V0.1

目标用户：个人开发者、后端工程师

核心目标：完成用户、项目、仓库、扫描任务的最小闭环。

用户故事：

- 作为用户，我可以注册账号，以便保存自己的项目。
- 作为用户，我可以创建项目，以便管理一个代码仓库。
- 作为用户，我可以添加 GitHub 仓库，以便 SourceLens 后续分析它。
- 作为用户，我可以创建扫描任务，以便系统开始分析仓库。
- 作为用户，我可以查看扫描任务状态，以便知道任务是否完成。

核心页面：

- 登录页。
- 项目列表页。
- 项目详情页。
- 仓库配置页。
- 扫描任务页。

核心接口：

- Auth API。
- Project API。
- Repository API。
- Scan Task API。

验收标准：

- 本地可以启动完整后端。
- 用户可以注册登录。
- 用户可以创建项目和仓库。
- 用户可以创建扫描任务。
- 数据能保存到 MySQL。

## 36. 最终落地形态

SourceLens 最终不是一个单纯代码阅读工具，而是一个持续陪伴项目演进的工程智能平台。

最终产品能力：

- 看懂项目。
- 反推架构。
- 发现问题。
- 拆解任务。
- 诊断流水线。
- 审查 PR。
- 修改代码。
- 运行测试。
- 生成 PR。
- 治理团队工程质量。

最终技术形态：

- Spring Boot 控制平面。
- Rust 分析引擎。
- Go 集成 worker。
- Agent Runtime。
- MCP 工具体系。
- MySQL、Redis、Qdrant、Neo4j。
- Temporal 工作流。
- Next.js 控制台。
- Docker 和 Kubernetes 部署。

最终商业形态：

- 个人版。
- Pro 版。
- Team 版。
- Enterprise 私有化版。
- 插件市场。
- Agent Skill 市场。

最终学习成果：

- 你会完整经历一个复杂后端平台从 0 到 1 的过程。
- 你会掌握企业级后端架构设计。
- 你会掌握源码分析和代码逆向能力。
- 你会掌握 Agent 工程化能力。
- 你会掌握 MCP/Hermes 风格工具生态设计。
- 你会拥有一个可以长期迭代、可以展示、可以商业化的真实项目。

## 37. 下一步开发指令

下一步建议直接执行：

1. 补充 `docs/PRD.md`。
2. 补充 `docs/ARCHITECTURE.md`。
3. 创建 `backend-spring`。
4. 创建 `deploy/docker-compose.yml`。
5. 实现 V0.1 用户、项目、仓库、扫描任务。

SourceLens 的第一性原则：

让每一次 AI 输出都能回到真实代码证据，让每一次工程动作都可审计、可回放、可落地。
