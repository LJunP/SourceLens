# SourceLens Product Positioning and Access Model

> AIOS v2.3 状态：`FROZEN LEGACY PRODUCT INPUT`。三平面、RBAC、企业用户和广泛治理 Console 设计在第一年冻结；当前 ICP、JTBD、唯一产品闭环和 Non-goals 以 `aios/STRATEGIC_CONSTITUTION.md` 为准。

> DEFAULT AGENT CONTEXT: `EXCLUDED`。只有当前 Task Contract 明确引用本文件时，才可读取指定章节作为历史证据。

状态：冻结的迁移前产品输入；不再拥有当前产品权威。

## 1. 产品最终形态

SourceLens 的目标不是“代码扫描工具”，也不是“聊天式代码助手”。

SourceLens 要做成：

> 本地优先、证据可追踪、可审计、可自动执行的 Agentic Engineering Intelligence Platform。

核心闭环：

1. 接入授权仓库。
2. 克隆并扫描源码。
3. 生成结构化代码理解资产：scan artifacts、code graph、code_chunks、报告证据。
4. 让用户完成源码逆向、跨文件问答、Issue 拆解、CI 诊断、PR 审查和 AutoRepair。
5. 所有高价值输出必须能追溯到代码证据、任务记录、审计日志和 release evidence。

当前主线必须继续聚焦：

- 公开仓库分析主链路。
- code_chunks 和跨文件检索质量。
- 报告引用质量。
- Agent 辅助理解。
- 自动修复候选和人工复核。
- 审计、安全边界和发布证据。
- 产品级 UI 和可读性。

当前不得扩散成：

- 通用聊天机器人。
- 单纯 README 总结器。
- 无权限/无审计的自动改代码系统。
- 未授权逆向或二进制破解工具。
- 过早多租户企业 SaaS。

## 2. 是否需要前后台分层

结论：需要分层，但当前不应拆成两个独立前端应用。

正确分层方式：

| 层 | 当前形态 | 目标形态 | 是否立即拆应用 |
| --- | --- | --- | --- |
| Public Surface | 登录/注册，未来文档、产品介绍、接入说明 | 官网、文档、登录、授权说明、安全披露入口 | 否 |
| Developer Workbench | 当前 `web-console` 主体 | 开发者完成仓库接入、报告复盘、代码问答、Issue 拆解、AutoRepair | 否 |
| Engineering Governance Console | 当前 Dashboard、任务、产物、PR/CI、审计的混合区 | 技术负责人看健康度、风险、任务闭环、发布证据和工程治理 | 否 |
| Admin & Security Console | 当前 AuditLogs、ModelConfig 的雏形 | 管理用户/组织、权限、模型、GitHub App、沙箱、raw access、retention、审计 | 否，后续可独立部署 |

当前实现策略：

- 继续使用一个 React/Vite Web Console。
- 在同一个 app 内先做信息架构分层、导航分组和权限模型。
- 不为了形式上的“前后台”复制一套 UI。
- 企业化后再评估是否把 Admin & Security Console 独立部署。

产品命名：

- 面向普通使用者：`Developer Workbench`。
- 面向技术负责人：`Engineering Governance Console`。
- 面向管理员和安全：`Admin & Security Console`。

## 3. 目标用户优先级

SourceLens 当前不能同时讨好所有用户。阶段优先级如下：

| 优先级 | 用户 | 当前阶段定位 |
| --- | --- | --- |
| P0 | 个人开发者 / 后端工程师 | 当前主用户；必须能独立完成仓库分析、报告复盘、代码问答和低风险修复候选 |
| P1 | 架构师 / 技术负责人 | 当前主线必须服务；重点是风险、技术债、PR/CI、证据可信度和治理闭环 |
| P1 | AI Agent 工程团队 | 当前内部能力验证用户；重点是工具调用、沙箱、审计、回放和评估 |
| P2 | 外包交接 / 维护团队 | 通过报告、接口/DB 反推和交接材料服务，但不是当前 UI 第一优先级 |
| P3 | 企业管理员 / 安全合规团队 | 架构保留；RBAC、组织、多用户、私有仓库和生产部署稳定后进入主线 |

## 4. 用户到页面/权限/导航/主流程/指标映射

| 用户 | 主要任务 | 页面/入口 | 权限要求 | 主流程 | 核心指标 |
| --- | --- | --- | --- | --- | --- |
| 个人开发者 | 快速理解陌生仓库，问代码，生成报告，尝试修复 | Projects、ProjectDetail、ScanTaskDetail、AgentChat、IssueDecomposition、AutoRepairs、Artifacts | 创建项目、添加公开仓库、触发扫描、查看报告、发起 QA、创建修复候选 | 仓库接入 -> 扫描 -> 报告 -> QA -> Issue/修复候选 | Time to first trustworthy report、QA READY rate、主链路完成率 |
| 后端工程师 | 看接口、服务、数据访问、调用链和改动风险 | ProjectDetail、ScanTaskDetail、Code QA、Artifacts、IssueDecomposition、AutoRepairs | 查看代码证据、运行 QA、创建任务、查看修复候选 | 报告复盘 -> 跨文件问答 -> 影响范围 -> 修复候选 | Cross-file citation rate、source location hit rate、repair candidate acceptance |
| 架构师 / 技术负责人 | 看系统健康、模块耦合、技术债、PR/CI 风险 | Dashboard、Projects、PR Reviews、CI Diagnostics、ExecutionTasks、Artifacts | 查看项目与治理状态、触发分析、审查风险，不默认管理平台配置 | 项目组合 -> 健康度 -> 风险 -> PR/CI -> 治理动作 | Risk surfaced rate、PR risk review usefulness、CI diagnosis recovery rate |
| AI Agent 工程团队 | 验证 Agent 工具调用、自动化任务、沙箱和证据回放 | AgentTasks、AgentChat、ExecutionTasks、AuditLogs、AutoRepairs | 创建/运行 Agent 任务、查看工具调用审计、验证产物 | Agent 任务 -> 工具调用 -> 产物 -> 审计 -> 回放 | Tool audit completeness、agent task success rate、unsafe action blocked rate |
| 安全审计人员 | 复核 raw access、工具调用、凭据、沙箱和高风险动作 | AuditLogs、Artifacts、ModelConfig、AutoRepairs、Security docs | 查看审计、审批/复核 raw access，不默认改代码 | 风险动作 -> 审计 receipt -> 证据复核 -> 阻断/放行 | Raw access audit coverage、security gate pass rate、blocked unsafe action count |
| 平台管理员 | 配置模型、GitHub App、组织、权限、沙箱、retention | ModelConfig、未来 GitHub App、Users/Org、Sandbox、Retention | 平台级 admin；可配置 provider、安装集成、管理成员和策略 | 平台配置 -> 权限策略 -> 集成 -> 运行监控 | Setup success rate、provider health、integration failure rate |
| 项目 Owner / 董事长 | 看阶段、投入顺序、红线、完成度和不可宣称项 | `CHAIRMAN_BRIEFING.md`、Dashboard、Quality/Risk docs | 不一定进入日常操作；需要全局只读和决策视图 | 阶段状态 -> 风险 -> 资源投入 -> 放行/延期 | Phase completion confidence、P0/P1 risk closure、release evidence freshness |

## 5. 权限模型方向

当前代码事实：

- 已有登录用户。
- 主要权限是 `project.created_by == userId`。
- 没有组织、团队、项目成员、角色 RBAC。
- 后端大量接口通过 `projectService.verifyOwnership(projectId, userId)` 做项目所有者校验。

最终方向必须升级为 RBAC，但不能阻塞当前公开仓库主线。

### 5.1 当前阶段权限

当前阶段继续允许：

- 单用户本地使用。
- 用户拥有自己创建的项目。
- 公开仓库分析。
- 本地 LLM provider 配置。

当前阶段不得宣称：

- 企业多用户协作完成。
- 私有仓库权限隔离完成。
- 组织级 RBAC 完成。
- 生产级管理员后台完成。

### 5.2 目标 RBAC 角色

| 角色 | 用途 |
| --- | --- |
| `PlatformAdmin` | 平台级管理员，管理模型、GitHub App、沙箱、retention、用户和组织 |
| `OrgOwner` | 组织 owner，管理组织成员、仓库集成、项目策略 |
| `ProjectMaintainer` | 项目维护者，可创建扫描、发起修复候选、提交 PR 流程 |
| `Developer` | 开发者，可看报告、问代码、拆 Issue、创建低风险任务 |
| `Viewer` | 只读查看项目、报告和公开证据 |
| `SecurityAuditor` | 安全审计角色，可查看审计、raw access receipt、工具调用和风险动作 |
| `AgentOperator` | Agent 执行角色，可运行 Agent 任务和查看工具调用证据 |

### 5.3 关键权限矩阵

| 能力 | Viewer | Developer | AgentOperator | ProjectMaintainer | SecurityAuditor | OrgOwner | PlatformAdmin |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 查看项目/报告 | 是 | 是 | 是 | 是 | 是 | 是 | 是 |
| 创建项目/添加仓库 | 否 | 否 | 否 | 是 | 否 | 是 | 是 |
| 触发扫描 | 否 | 是 | 是 | 是 | 否 | 是 | 是 |
| Code QA / AgentChat | 否 | 是 | 是 | 是 | 只读 | 是 | 是 |
| Issue 拆解 | 否 | 是 | 是 | 是 | 否 | 是 | 是 |
| 创建 AutoRepair 候选 | 否 | 是 | 是 | 是 | 否 | 是 | 是 |
| 执行/取消高风险修复 | 否 | 否 | 受限 | 是 | 审计 | 是 | 是 |
| 提交 PR | 否 | 否 | 否 | 是 | 审计 | 是 | 是 |
| raw artifact 下载 | 否 | 否 | 否 | 需确认 | 审计/复核 | 是 | 是 |
| 查看审计日志 | 否 | 项目内有限 | 项目内工具审计 | 项目内 | 是 | 是 | 是 |
| 配置 LLM provider | 否 | 个人配置 | 否 | 项目配置 | 只读 | 组织配置 | 平台配置 |
| GitHub App installation | 否 | 否 | 否 | 否 | 只读 | 是 | 是 |
| 删除项目 | 否 | 否 | 否 | 是 | 审计 | 是 | 是 |
| 管理用户/组织 | 否 | 否 | 否 | 否 | 否 | 是 | 是 |

## 6. 导航信息架构

当前导航按功能堆叠：主链路、Agent 与治理、平台。

目标导航必须改成“任务视角 + 权限视角”：

```text
Developer Workbench
  Dashboard
  Projects
  Reports / Scan Detail
  Code QA
  Issue Decomposition
  AutoRepair Candidates

Engineering Governance
  Execution Tasks
  Artifacts
  CI Diagnostics
  PR Reviews
  Risk / Quality

Admin & Security
  Audit Logs
  Model Config
  GitHub App
  Sandbox Policy
  Users / Organizations
  Data Retention
```

当前 P9 应先完成：

- 不拆应用。
- 重构侧边栏分组和页面命名。
- 每个页面明确它属于 Workbench、Governance 还是 Admin/Security。
- 没有权限的入口后续按 RBAC 隐藏或降级为只读。

## 7. 主流程定义

### F1：首次可信仓库分析

用户：个人开发者、后端工程师。

流程：

```text
创建项目 -> 添加公开仓库 -> 启动扫描 -> 查看扫描状态 -> 打开报告 -> 查看证据质量 -> 下一步进入 QA 或 Issue 拆解
```

完成标准：

- 扫描成功。
- 报告存在。
- code_chunks ready。
- 报告引用可追踪。
- 页面给出下一步动作。

### F2：源码级理解

用户：后端工程师、架构师。

流程：

```text
打开项目/报告 -> 输入问题 -> Code QA 检索 code_chunks -> 返回带引用回答 -> 展示来源文件/行号/可信度 -> 允许继续追问或进入修复候选
```

完成标准：

- 回答有 source citation。
- claim citation coverage 可见。
- 不把未验证回答包装成可信事实。

### F3：工程治理复盘

用户：架构师、技术负责人。

流程：

```text
Dashboard -> 项目健康/风险 -> 执行任务 -> 报告/产物 -> PR/CI -> 治理动作
```

完成标准：

- 能看到风险来源。
- 能进入具体证据。
- 能知道下一步动作。

### F4：Issue 到修复候选

用户：开发者、AgentOperator、Maintainer。

流程：

```text
输入 Issue -> 拆解任务 -> 绑定项目/扫描 -> 生成候选修复 -> 查看 diff/证据/风险 -> 人工确认 -> 后续 PR
```

完成标准：

- 候选来源清楚。
- 高风险操作默认阻断。
- PR 提交需要额外授权和审计。

### F5：安全与审计

用户：SecurityAuditor、PlatformAdmin。

流程：

```text
高价值操作 -> 审计日志 -> receipt -> raw access / tool call / PR gate 复核 -> 阻断或放行
```

完成标准：

- raw access 有显式确认。
- 工具调用有权限级别和结果摘要。
- 高风险动作可追踪。

## 8. 产品指标

北极星指标：

> Trusted Engineering Loop Completion Rate：用户从仓库接入到获得一条可追踪、可复核、能指导下一步工程动作的可信结论的完成率。

阶段指标：

| 指标 | 定义 | 阶段 |
| --- | --- | --- |
| Time to first trustworthy report | 从创建项目到报告可读且证据可追踪的时间 | P6/P9 |
| Public repo analysis success rate | 公开仓库 clone、scan、artifact、report 成功率 | P6/P11 |
| Report citation READY rate | 报告证据进入 READY/REVIEW/GAP 的比例 | P6 |
| Code QA citation READY rate | QA 回答满足 citation 和 claim 绑定的比例 | P6 |
| Main path completion rate | 用户是否能完成 项目 -> 报告 -> QA -> 下一步动作 | P9 |
| Error recovery rate | 出错后用户是否知道原因和下一步 | P9/P11 |
| AutoRepair candidate acceptance | 候选修复被用户继续复核或采纳的比例 | P10/P12-pre |
| Tool audit completeness | Agent 工具调用是否 100% 有审计记录 | P10 |
| Raw access audit coverage | raw preview/download/export 是否有权限和 receipt | P10 |
| Search P50/P95 latency | code_chunks 检索延迟 | P6/P11 |
| Release evidence freshness | 最近 full/focused evidence 是否可验证 | P11/P12-pre |

## 9. 当前不明确项与处理结论

| 问题 | 当前是否明确 | 处理结论 |
| --- | --- | --- |
| 是否分前后台 | 已明确 | 不拆两个应用；按 Workbench / Governance / Admin-Security 三个产品平面分层 |
| 当前主用户是谁 | 已明确 | P0 是个人开发者和后端工程师；P1 是架构师/技术负责人和 AI Agent 工程团队 |
| 是否立即做企业多用户 | 已明确 | 不立即做；保留 RBAC/组织模型方向，P12 后置 |
| 是否立即做 GitHub App E2E | 已明确 | 架构保留，不阻塞公开仓库主线 |
| 是否先支持私有仓库 | 已明确 | 不先做；私有仓库必须等 RBAC、GitHub App、raw/LLM 边界更稳 |
| 是否当前引入 Qdrant/Neo4j/Temporal | 已明确 | 不引入为当前必需；真实 provider/embedding gate 先做轻量闭环 |
| 是否做营销官网 | 已明确 | 当前不做；Public Surface 只保留登录/文档/安全入口方向 |
| 是否做完整企业 SaaS | 已明确 | 当前不做；先本地优先和单用户/小团队可用 |
| Agent 可以自动做到什么程度 | 需要持续门禁 | 当前允许生成候选和 patch artifact；自动 PR、写回和高风险执行必须人工确认和审计 |
| 支持语言优先级 | 已阶段明确 | 当前 P6 覆盖 Java、JS/TS、Python bounded matrix；更广语言不作为当前完成条件 |
| 指标是否只写文档 | 阶段明确 / 部分落地 | P9 第一阶段已把北极星指标接入 Dashboard UI；后续必须进入 Dashboard API、release evidence 或 matrix marker，不长期停留在派生 UI |

## 10. 需要迅速补齐的产品缺口

P0 缺口：

1. 三工作视角和逐用户本地导航偏好已落地，但它们不是角色识别或权限控制；服务端 RBAC 仍未实现，目前主要是项目 owner 校验。
2. Dashboard 已开始以北极星指标组织，但仍需继续覆盖更多主链路页面。
3. 产品指标还没有进入数据库、API 或 release evidence 的统一可量化体系。

P1 缺口：

1. 组织、团队、成员和角色模型未实现。
2. GitHub App installation 到项目/组织的权限绑定未形成用户可见闭环。
3. 私有仓库数据外发、LLM provider、raw artifact 权限边界仍是后置能力。
4. AutoRepair 的 Agent autonomy level 需要在 UI 上明确展示。
5. Admin & Security Console 只是散落页面，不是成型后台。

P2 缺口：

1. 商业化版本边界未定。
2. 企业部署拓扑和 SLA 未定。
3. 外部 API / CLI / SDK 是否产品化未定。
4. 插件市场 / MCP 生态仍是长期候选。

## 11. 下一步执行顺序

1. P9：继续把三大产品平面扩展到关键页面信息架构，而不是只停留在侧边栏分组。
2. P9/P11：把 Dashboard 北极星指标从派生 UI 推进到 API、release evidence 或 matrix marker。
3. P10/P12-pre：设计 RBAC schema，但不立即替换所有接口。
4. P6/P11：把关键指标进入 release evidence 和 matrix marker。
5. P12-pre：补 GitHub App、私有仓库、多用户协作和生产部署前置门禁。

## 12. 一句话定版

SourceLens 当前要做的不是“前台 + 后台”两个系统，而是一个登录后的工程智能控制台，内部清晰拆成 Developer Workbench、Engineering Governance Console、Admin & Security Console，并用角色、权限、导航、主流程和指标把目标用户落到真实产品结构上。
