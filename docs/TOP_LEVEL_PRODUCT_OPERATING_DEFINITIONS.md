# SourceLens Top-Level Product Operating Definitions

> AIOS v2.3 状态：`HISTORICAL REFERENCE`。62 项定义不再是当前执行总纲，不得触发新制度或企业化开发。当前只执行 `aios/` 权威栈与 P0 Gate。

> DEFAULT AGENT CONTEXT: `EXCLUDED`。只有当前 Task Contract 明确引用本文件时，才可读取指定章节作为历史证据。

状态：冻结的迁移前定义总纲；不再控制当前产品、工程或组织工作。

## 0. 使用规则

- 本文回答“SourceLens 这个顶级项目到底按什么边界推进”。
- 具体执行仍以各专项文档为准：安全看 `SECURITY_BOUNDARY.md` / `THREAT_MODEL.md`，测试看 `TEST_STRATEGY.md`，发布看 `RELEASE_PROCESS.md`，数据看 `DATA_GOVERNANCE.md`，UI 看 `FRONTEND_DESIGN_SYSTEM.md`。
- 本文不是要求 62 项全部立刻实现；它要求 62 项全部有明确方向、当前状态、后置条件和验收归口。
- 当前主线仍是 P6/P9/P10/P11/P12-pre，不因本文进入商业化、企业化或法务深水区。

## 1. 产品与工程基础定义：1-34

| # | 定义项 | SourceLens 定版结论 | 当前状态 | 归口 |
| ---: | --- | --- | --- | --- |
| 1 | 产品版本边界 | 分为 Local Developer Edition、Team Edition、Enterprise Edition；Cloud/SaaS 后置 | 已定义，未实现版本开关 | Product / Roadmap |
| 2 | 部署形态 | 本地优先 -> Docker Compose 单机 -> 企业私有化 -> SaaS 后置 | 本地和 Docker 基础存在 | Deploy / Ops |
| 3 | 商业化边界 | 私有仓库、GitHub App、多人协作、RBAC、审计保留、SSO、企业部署属于高级层 | 已定义，未商业化 | Roadmap / Compliance |
| 4 | 不可宣称清单 | 未经 E2E 的 RBAC、私有仓库、真实 LLM、生产部署、无人监管 AutoRepair 不得宣称完成 | 已长期执行 | Chairman / Risk |
| 5 | 目标市场优先级 | P0 个人开发者/后端工程师；P1 架构师/技术负责人/AI Agent 团队；P2 维护交接；P3 企业管理员 | 已定版 | Product Positioning |
| 6 | 竞品定位 | 不做单点 Copilot；定位为 Sourcegraph 式代码理解 + Sentry 式证据追踪 + Linear 式任务闭环 + Agentic 自动化 | 已定义，需后续市场表述 | Product / GTM |
| 7 | 用户旅程地图 | 以仓库接入、可信报告、代码问答、Issue/修复、治理复盘、安全审计为主旅程 | 已定义概要，UI 未完全落地 | Product Metrics |
| 8 | 用户到页面/权限/导航/主流程/指标映射 | 以 `PRODUCT_POSITIONING_AND_ACCESS_MODEL.md` 为准 | 已定版 | Product Positioning |
| 9 | 页面完成标准 | 每页必须说明用户、产品平面、任务、CTA、失败恢复、风险动作和指标 | 已定方向，需 P9 落地 | Frontend Design |
| 10 | 核心主链路标准 | 项目 -> 仓库 -> 扫描 -> 报告 -> QA -> Issue/修复/治理 | 已定版，持续强化 | P6/P9/P11 |
| 11 | 新用户 onboarding | 当前只做登录/项目创建；后续需要 guided repo setup、first scan、first report | 未实现完整 onboarding | P9 |
| 12 | 空态/错误态/恢复路径 | 必须说明原因、下一步、可重试动作和 requestId/证据入口 | 设计系统已有部分规则 | P9/P11 |
| 13 | 通知体系 | 任务完成、失败、风险、审批、审计提醒后续统一；当前以页面状态和 toast 为主 | 未形成统一 notification center | P9/P12 |
| 14 | 前后台产品分层 | 不拆两个应用；一个 Web Console 内分前台体验 / 开发者控制台 / 后台治理 | 三平面导航、Dashboard 与逐用户工作视角已落地；完整后台能力仍未完成 | P9 |
| 15 | RBAC 角色模型 | PlatformAdmin、OrgOwner、ProjectMaintainer、Developer、Viewer、SecurityAuditor、AgentOperator | 已定义，未实现 | P10/P12 |
| 16 | 权限审批流 | raw、PR、修复、私有仓库、模型外发必须确认/审批/审计 | raw/AutoRepair 部分已有 | P10 |
| 17 | 组织/团队/项目/仓库归属模型 | 当前 user-owned project；后续 org -> team/member -> project -> repository | 方向已定，未建 schema | P12-pre |
| 18 | 多用户协作边界 | 企业化后开放；当前不宣称多人协作完成 | 已定版 | Compliance |
| 19 | 管理后台功能边界 | 用户、组织、集成、模型、审计、retention、沙箱策略属于 Admin & Security Console | 已定义，未完整实现 | P12-pre |
| 20 | Agent 自治等级 | L0 只读、L1 建议、L2 patch、L3 沙箱测试、L4 PR、L5 自动合并；L5 当前禁止 | 方向已定，需 UI 标识 | P10/P12 |
| 21 | 模型供应商策略 | Mock 本地回归；真实 provider 后续 gate；embedding provider 不等同事实质量 | 已执行部分 mock gate | P6/P8 |
| 22 | 模型输出可信边界 | 模型回答不等于事实；必须绑定 source evidence / citation / claim audit | 已深度执行于 P6 | P6 |
| 23 | Agent 工具权限等级 | 工具必须有 permission level、审计、沙箱和输出摘要 | 基础存在，持续强化 | P10 |
| 24 | Agent 任务回放与审计 | AgentTask、tool call、artifact、audit log 必须可串联 | 基础存在，需体验强化 | P10/P11 |
| 25 | Agent 成本控制 | token、调用次数、失败重试、限流、provider 成本后续进入指标 | 未完整实现 | P12 |
| 26 | 数据分级 | public repo、private repo、raw artifact、secret、audit、LLM outbound、release evidence 分级治理 | 多文档已有，需统一 UI | Data Governance |
| 27 | 证据可信等级 | RAW_SOURCE_BOUND、REPORT_EVIDENCE_BOUND、CODE_QA_READY、MODEL_UNVERIFIED、HUMAN_REVIEW_REQUIRED 等 | P6 已有雏形，需统一枚举 | P6/P9 |
| 28 | raw artifact 访问策略 | 默认普通预览脱敏；raw 下载必须确认、审计和 receipt；不得宣称 raw 安全外发 | 已部分实现 | P10 |
| 29 | 数据删除/导出/retention | 项目删除级联已有；企业级导出、retention、legal hold 后置 | 部分实现 | Data / Compliance |
| 30 | 产品验收样板仓库 | 固定 Java Web、Java Library、JS Web、JS Library、Python Web、CLI、失败候选、大仓库样本 | P6 extended matrix 已开始 | P6/P11 |
| 31 | 指标数据模型 | 指标分为 DB/API、release evidence、文档三层；核心指标后续进入 Dashboard | 已定义，未完全实现 | Metrics |
| 32 | 失败分类体系 | Git clone、扫描、解析、chunk、LLM、权限、沙箱、UI 恢复、发布 gate 分类 | 已散落，需统一 taxonomy | P11 |
| 33 | 阶段封版标准 | P6/P9/P10/P11/P12-pre 必须分别有 Must、验证、风险、质量、交接闭环 | 已执行，需显式 P*_READY | Phase Requirements |
| 34 | 发布通道定义 | local dev、focused gate、nightly、RC、release；不同通道风险容忍不同 | 部分已有 release profile | Release Process |

## 2. 运营、规模化与平台化定义：35-50

| # | 定义项 | SourceLens 定版结论 | 当前状态 | 归口 |
| ---: | --- | --- | --- | --- |
| 35 | SLO/SLA 标准 | scan、search、report、task、API、frontend load 分层 SLO；SLA 企业化后再承诺 | 性能基线存在，SLO 未完整 | Observability |
| 36 | 容量规划 | 按仓库数、文件数、chunk 数、并发任务、用户数分层规划 | 初步性能分层存在 | Performance |
| 37 | 成本模型 | LLM、embedding、存储、计算、CI、evidence 成本必须可见 | 未完整实现 | Ops / Finance |
| 38 | 功能开关体系 | AutoRepair、raw download、真实 provider、GitHub App、private repo 必须可按环境开关 | 部分 env gate 存在 | Engineering |
| 39 | API 版本策略 | 当前 `/api`；企业化前需 `/api/v1`、兼容和废弃策略 | 未实现版本化 | API Design |
| 40 | 领域状态机标准 | Project、Repository、ScanTask、AgentTask、AutoRepair、PRReview 状态流转必须固定 | 多实体已有，需集中化 | Backend |
| 41 | 事件模型 | SCAN_STARTED、REPORT_READY、QA_READY、PATCH_READY、RAW_DOWNLOADED、PR_CREATED 等作为事件语义 | 审计动作已有，事件模型未统一 | Audit / Observability |
| 42 | 可观测性语义标准 | requestId、auditId、scanTaskId、projectId、taskId、repoId 必须贯通日志/metrics/UI | 部分存在 | Observability |
| 43 | 支持与客服流程 | 报错需收集 requestId、projectId、scanTaskId、backend log、browser info、repro steps | `SUPPORT.md` 基础存在 | Support |
| 44 | 文案与 UX Writing | 按动作、风险、空态、错误、不可宣称项统一中文表达 | 部分存在，未单独标准化 | P9 |
| 45 | 无障碍访问标准 | 键盘、ARIA、对比度、focus、screen reader 是 UI 门禁 | 设计系统已部分覆盖 | P9 |
| 46 | 国际化策略 | 当前中文优先；英文术语保留；中英切换后置 | 已明确当前中文优先 | Product |
| 47 | 数据迁移兼容策略 | Flyway migration 必须向前兼容、可审计、不可破坏本地数据 | 已有 migration，需更严格策略 | Database |
| 48 | 插件/扩展市场边界 | MCP、Analyzer plugin、外部工具未来接入必须走权限、审计、沙箱 | 长期候选 | Architecture |
| 49 | 客户分层与用例包装 | Local、Team、Enterprise、Security、AI Agent 团队各自包装价值 | 未商业化，方向已定 | GTM |
| 50 | 董事长/管理层决策仪表盘 | 阶段进度、风险、成本、质量、阻塞、下一步投入必须可见 | Dashboard 管理层决策简报已落地；成本与跨阶段经营数据仍需继续接入 | Chairman / Dashboard |

## 3. 公司级商业化与企业交付定义：51-62

| # | 定义项 | SourceLens 定版结论 | 当前状态 | 归口 |
| ---: | --- | --- | --- | --- |
| 51 | 法律条款体系 | 用户协议、隐私政策、DPA、免责声明、AUP 进入商业化前必须补 | 未启动 | Legal |
| 52 | 知识产权边界 | 第三方仓库扫描报告、代码片段、patch 归属和使用边界必须定义 | 当前默认谨慎，不外发声明 | Legal / Compliance |
| 53 | 安全认证路线 | SOC 2、ISO 27001、等保、安全问卷作为企业化路线，不当前承诺 | 未启动 | Security |
| 54 | 数据驻留与地区合规 | 中国/美国/欧盟数据分区、跨境和 LLM 外发企业化前定义 | 未启动 | Compliance |
| 55 | 企业采购资料包 | 安全白皮书、架构白皮书、部署说明、权限说明、审计说明后置 | 未启动 | Enterprise |
| 56 | 滥用防护政策 | 禁止未授权逆向、secret 窃取、恶意代码生成、供应链攻击辅助 | 安全文档已有方向 | Security |
| 57 | 客户实施手册 | 企业从 0 部署：环境、权限、GitHub App、模型、备份、验收 | `OPERATIONS_RUNBOOK` 本地版存在 | Ops |
| 58 | 客户成功指标 | 活跃项目、成功扫描、报告采纳、修复采纳、治理动作完成 | 未实现客户成功体系 | Metrics |
| 59 | 价格与套餐模型 | Local/Team/Enterprise 定价后置；当前不在主线实现 | 未启动 | GTM |
| 60 | 演示环境与样板案例 | 固定 demo 仓库、演示流程、路演路径；不能用不稳定仓库临场演示 | P6 样板仓库可复用 | Product / GTM |
| 61 | 培训与认证体系 | 开发者、管理员、安全人员、Agent 操作员手册后置 | 未启动 | Enablement |
| 62 | 年度路线与投资优先级机制 | 按季度确定做什么、不做什么、砍掉什么；以 P 阶段和董事长简报为当前替代 | 文档化初版存在 | Chairman / Roadmap |

## 4. 当前实现顺序

必须按以下顺序推进：

1. 定义封顶：本文 62 项已锁定，不再继续扩制度。
2. P9：落地三平面导航和 Dashboard 主链路。
3. P6：继续真实 provider/embedding E2E、向量质量、报告引用体验。
4. P10：把 Agent 自治等级、raw access、权限审批和数据分级做成可见门禁。
5. P11：把失败分类、发布通道、样板仓库和指标进入 release evidence。
6. P12-pre：再推进 RBAC、GitHub App、私有仓库、多用户、灾备回滚、生产部署。
7. 商业化/企业交付：只在产品主链路稳定后启动 51-62 的实现。

## 5. 封顶规则

- 1-62 是完整定义体系。
- 后续不得继续新增“第 63 项”式制度扩张，除非出现战略转向、法律要求、重大安全事故或企业客户强制要求。
- 新需求必须优先映射到 1-62 中已有定义项。
- 如果无法映射，先判断是不是误需求、过早需求或商业化后置需求。

## 6. 一句话结论

SourceLens 的顶级公司级定义体系已封顶：先按 62 项定义管住方向，再回到产品主线，优先把 P9 三平面控制台、P6 可信代码理解、P10 安全门禁、P11 发布证据和 P12-pre 生产化收口做成真实可用能力。
