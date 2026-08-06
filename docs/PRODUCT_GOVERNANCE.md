# SourceLens Product Governance

> AIOS v2.3 状态：`SUPPORTING LEGACY PROCESS`。若本文的文档权威、角色、Phase 或维护要求与 `aios/MASTER_EXECUTION_PROTOCOL.md` 冲突，以 AIOS 协议为准。不得再机械同步多个状态文档。

状态：迁移前流程参考；只有不与AIOS协议冲突且被当前Task Contract引用的规则可执行。

本文定义 SourceLens 后续每一步开发必须遵守的产品级研发流程。它的目标不是增加形式主义，而是让每次功能开发、重构、安全加固和 UI 优化都有需求依据、验收证据、风险审查和可量化进度记录。

## 1. 权威文档关系

| 文档 | 作用 | 更新时机 |
| --- | --- | --- |
| `../CHAIRMAN_BRIEFING.md` | 董事长 / 项目 Owner 高层控制台，汇总当前阶段、红线、投入顺序和不可宣称完成项 | 公司制度、阶段重点、董事长红线或当前主线判断变化时 |
| `../CONTRIBUTING.md` | 开发者 / 新 Codex / 子 agent 贡献入口，定义接任务、验证、文档同步和交付规则 | 贡献流程、验证要求、子 agent 交付规则或禁止事项变化时 |
| `../SECURITY.md` | 根目录安全报告入口，面向外部贡献者、新 Codex 和未来用户 | 安全报告流程、漏洞类型、secret/raw/LLM/sandbox/GitHub 风险处理变化时 |
| `../CHANGELOG.md` | 版本级变更记录 | 阶段级、发布级或 Owner 需要复盘的变更发生时 |
| `../ROADMAP.md` | 根目录产品路线入口 | 当前主线、后置层、阶段路线或不可宣称完成项变化时 |
| `../SUPPORT.md` | 支持和排障入口 | 启动、数据库、前后端、release evidence、GitHub App 排障入口变化时 |
| `../LICENSE` | 当前授权边界 | Owner 明确变更授权策略时 |
| `../CODE_OF_CONDUCT.md` | 协作行为边界 | 协作规则、违规处理或安全披露行为边界变化时 |
| `../.github/CODEOWNERS` | GitHub review ownership | 模块 owner 或 review 规则变化时 |
| `../.github/ISSUE_TEMPLATE/` | GitHub issue 模板 | issue 分类、必填信息或风险入口变化时 |
| `../.github/PULL_REQUEST_TEMPLATE.md` | GitHub PR 模板 | PR 验证、风险、文档同步或 checklist 变化时 |
| `PROJECT_PLAN.md` | 产品愿景、用户场景、长期功能边界 | 产品方向变化时 |
| `PRODUCT_POSITIONING_AND_ACCESS_MODEL.md` | 产品最终形态、前后台分层、目标用户、权限、导航、主流程和指标映射 | 产品定位、目标用户、导航、RBAC、主流程或北极星指标变化时 |
| `TOP_LEVEL_PRODUCT_OPERATING_DEFINITIONS.md` | 62 项顶级产品、工程、运营、企业交付和商业化定义封顶总纲 | 战略转向、法律要求、重大安全事故或企业客户强制要求时；不得日常随意扩项 |
| `PROJECT_CODE_MAP.md` | 当前工作区目录/文件用途、后端 REST route、前端 route 和 API client 简洁索引 | 文件/目录结构、Controller route、前端 route 或 API client 变化后刷新；阶段验收/交接前检查 |
| `PROJECT_STRUCTURE_AUDIT.md` | 仓库结构、生成物边界、清理策略和文档对齐状态 | 顶层目录、生成物、文档体系或清理策略变化时 |
| `REFACTOR_ROADMAP.md` | 技术重构路线和阶段状态 | 每个阶段推进或完成后 |
| `PHASE_REQUIREMENTS.md` | 阶段级需求、验收标准和量化指标 | 每个阶段启动、范围变化或验收前 |
| `TEAM_OPERATING_MODEL.md` | 多 agent 公司式协作模型、角色职责和门禁责任矩阵 | 团队流程、角色分工或协作方式变化时 |
| `SOURCELENS_OPERATING_SYSTEM.md` | SourceLens 虚拟公司操作系统总入口，串联团队、风险、质量、发布、数据和事故治理 | 公司级治理规则变化或阶段收口制度变化时 |
| `WORK_INTAKE_AND_BACKLOG.md` | 需求入口、优先级、排队、延期和拒绝规则 | 新需求进入、优先级变化或阶段排期变化时 |
| `ENGINEERING_STANDARDS.md` | 代码、review、脚本、前后端实现标准 | 工程标准、review 标准或禁止事项变化时 |
| `TEST_STRATEGY.md` | 测试分层、必跑测试、失败处理和记录模板 | 新增测试类型、门禁、smoke 或 release evidence 规则时 |
| `RISK_REGISTER.md` | 当前高价值风险、owner、缓解方案和关闭条件 | 新增 P0/P1/P2 风险、风险状态变化或阶段收口时 |
| `QUALITY_SCORECARD.md` | 项目级质量维度、阶段质量状态和下一质量目标 | 阶段收口、重大质量变化或 release 前 |
| `PRODUCT_METRICS_AND_FEEDBACK.md` | 产品指标、用户反馈、主链路成功率和阶段复盘问题 | 用户反馈、产品指标或主链路质量目标变化时 |
| `RELEASE_PROCESS.md` | 发布类型、放行条件、证据包、回滚和 evidence 保留 | 发布流程、verifier、evidence 或回滚策略变化时 |
| `DISASTER_RECOVERY_AND_ROLLBACK_SIGNOFF.md` | 灾备恢复、回滚演练和生产化签署清单 | 备份恢复、回滚、生产候选或 DR drill 变化时 |
| `OBSERVABILITY_AND_INCIDENTS.md` | 可观测性目标、事故等级和复盘模板 | 新增运行观测能力、事故、错误分类或生产化要求时 |
| `DATA_GOVERNANCE.md` | repo、artifact、code_chunks、audit、secrets 等数据生命周期 | 新增长期数据、raw access、删除/归档/备份策略时 |
| `COMPLIANCE_AND_PRIVACY.md` | 隐私、权限、企业化、多用户和私有仓库合规边界 | 私有仓库、多用户、企业部署、真实 LLM provider 或数据外发变化时 |
| `RAW_ACCESS_AND_EVIDENCE_RETENTION_POLICY.md` | raw payload/artifact 访问、审计、release evidence 保留和删除红线 | 新增 raw preview/download/copy/export 或 evidence retention 策略变化时 |
| `THREAT_MODEL.md` | 资产、攻击面、滥用场景和缓解关系 | 新增攻击面、危险能力、安全边界或外部集成时 |
| `DEPENDENCY_AND_LICENSE_POLICY.md` | Maven/npm/Cargo/Docker 依赖、license 和供应链风险 | 新增依赖、大版本升级、Docker/CI 基础镜像变化时 |
| `FRONTEND_DESIGN_SYSTEM.md` | P9 大厂级 UI、可读性、响应式和共享原语标准 | 前端页面、组件、视觉系统或 UI 门禁变化时 |
| `PERFORMANCE_BENCHMARK.md` | scan、report、code_chunks、前端、DB 和 evidence 性能基线 | 性能指标、基准仓库、大仓库能力或性能回归变化时 |
| `AGENT_STATUS_BOARD.md` | 当前多 agent 岗位状态、关键工作流状态、证据入口和下一步 | 阶段状态、门禁状态、角色职责或用户询问当前状态时 |
| `AGENT_ACTIVITY_LOG.md` | 固定岗位 agent 的关键参与、产出、证据和采纳状态 | 多 agent 审查、重要门禁、关键决策或被打回事项发生时 |
| `AGENT_DECISION_REGISTER.md` | 多岗位协作中的关键产品、架构、安全和流程决策 | 出现影响后续路线、边界或验收的判断时 |
| `PRODUCT_PROGRESS_LOG.md` | 实际开发记录、验证结果、缺陷和下一步 | 阶段推进、重要功能、门禁变化、bug 修复或风险变化后；小型文档/索引刷新可合并记录 |
| `CODEX_HANDOFF.md` | 丢失上下文或换账号后的恢复入口 | 关键决策、阶段状态、验证基线或接手风险变化后 |
| `SECURITY_BOUNDARY.md` | 安全边界和禁止事项 | 新增凭据、沙箱、Agent、GitHub 或 LLM 能力时 |
| `OPERATIONS_RUNBOOK.md` | 部署、演练、发布证据和运维流程 | 发布、部署或验收脚本变化时 |

任何阶段进入开发前，必须先确认 `PHASE_REQUIREMENTS.md` 有对应阶段条目；任何阶段完成前，必须在 `PRODUCT_PROGRESS_LOG.md` 留下阶段级记录。普通小改动不强制逐项长日志，避免记录成本压过产品推进。

## 1.1 文档维护分级

SourceLens 文档维护采用“关键事实实时更新，索引和日志周期收敛”的策略。

| 级别 | 文档/信息 | 更新策略 |
| --- | --- | --- |
| 实时更新 | `API_DESIGN.md`、`DATABASE_DESIGN.md`、`SECURITY_BOUNDARY.md`、`OPERATIONS_RUNBOOK.md` 中影响运行、安全、数据或用户调用的事实 | 对应代码或脚本改变同轮更新 |
| 实时更新 | release evidence/verifier、安全门禁、数据库迁移、凭据/沙箱/LLM/GitHub 边界 | 同轮记录，不能延后 |
| 实时更新 | raw preview/download/copy/export、raw payload 查看授权、evidence 删除/归档红线 | 同轮更新 `RAW_ACCESS_AND_EVIDENCE_RETENTION_POLICY.md`、相关安全/运维文档 |
| 实时更新 | 新增危险攻击面、依赖/license 高风险、隐私/合规边界、生产灾备/回滚要求 | 同轮更新对应专项制度和风险台账 |
| 阶段性更新 | `PHASE_REQUIREMENTS.md`、`REFACTOR_ROADMAP.md`、`AGENT_STATUS_BOARD.md`、`PRODUCT_PROGRESS_LOG.md`、`CODEX_HANDOFF.md` | 阶段启动、阶段收口、关键功能完成、门禁变化或风险变化时更新 |
| 阶段性更新 | `WORK_INTAKE_AND_BACKLOG.md`、`QUALITY_SCORECARD.md`、`PRODUCT_METRICS_AND_FEEDBACK.md`、`PERFORMANCE_BENCHMARK.md` | 阶段启动、阶段收口、质量目标变化、用户反馈或性能基线变化时更新 |
| 周期性更新 | `PROJECT_CODE_MAP.md`、`PROJECT_STRUCTURE_AUDIT.md`、README 的结构性说明 | 文件结构/API 入口变化后、阶段验收前、交接前或用户要求盘点时更新 |
| 批量清理 | 本地生成物、旧 evidence、临时文件、过期文档段落 | 每个阶段收口或发现污染时集中清理；禁止无审查自动删除证据包 |

原则：

- 不为了形式上的“每轮都写”而污染日志。
- 不把 `PROJECT_CODE_MAP.md` 写成代码审计报告；它只回答“这个文件/目录/接口入口是干什么的”。
- 不再继续无节制新增制度文件；新需求优先映射到 `TOP_LEVEL_PRODUCT_OPERATING_DEFINITIONS.md` 的 62 项定义。
- 重要事实必须可追溯，低风险索引允许延后到阶段收口统一刷新。
- 每次阶段收口必须做文档一致性检查和垃圾文件盘点，避免项目开发完成后原文件和真实状态脱节。

## 2. 固定开发流程

每一项工作都按以下顺序推进：

1. 需求界定
   - 明确用户价值、目标用户、主流程位置和非目标。
   - 明确这是功能开发、体验重构、安全加固、性能优化、测试补强、文档治理还是发布工程。
   - 写入或更新 `PHASE_REQUIREMENTS.md`。

2. 产品合理性审查
   - 判断该能力是否服务 SourceLens 核心主线：仓库克隆、代码逆向、code_chunks、任务流水线、报告体验、Agent 理解、自动修复。
   - 判断是否增加用户认知负担、是否有更直接的入口、是否能形成闭环。
   - 明确延期项，尤其是 GitHub App、私有仓库、多用户协作、生产级部署等高级集成层。
   - 需要多角色审查时，按 `TEAM_OPERATING_MODEL.md` 分派 Product Manager、Architect、Security、QA、DevOps、Frontend、Backend 或 AI/RAG 子 agent。
   - `特朗普 / Delivery Owner` 只负责拆分、派发、审核、打回和集成，不默认替代子 agent 完成岗位职责。
   - SourceLens 长期采用 `11 个固定核心角色 + 5 个按需专家角色池`：11 个核心角色负责常规产品、架构、安全、开发、测试和交付；`任正非`、`马云`、`雷军`、`马化腾`、`张一鸣` 只在企业化、商业化、UX、SRE 或数据/AI 产品专项触发时按需启动，不扩成 16 个常驻 agent。
   - 从 2026-07-03 起，独立门禁复核默认一岗一物理子 agent：安全复核任务首行写 `固定岗位：奥特曼 / Security Engineer`，QA 复核任务首行写 `固定岗位：拉里佩奇 / QA Engineer`，不得在中等以上任务中把 Security 与 QA 合并为同一个物理子 agent。
   - 判断本轮是否触发 `SOURCELENS_OPERATING_SYSTEM.md` 的严格或完整流程；简单小改动走轻流程，阶段收口、发布、安全/DB/API/任务状态机变化走完整流程。

3. 技术设计审查
   - 确认模块边界、数据模型、API 契约、前端状态和异步任务状态机。
   - 优先复用现有架构和共享原语。
   - 对跨模块改动补充最小 ADR 或在阶段需求中记录设计决策。

4. 安全审查
   - 检查输入校验、路径越界、SSRF、凭据泄露、日志脱敏、审计留痕、Agent 工具权限和沙箱边界。
   - 涉及仓库、文件、LLM、GitHub、PR、shell、Docker、数据库写入的改动必须有明确安全断言或测试。

5. 实现
   - 小步提交式修改，避免无关重构。
   - 前端功能必须使用共享 UI 原语，避免裸 Ant Design `Button`、`Empty`、`Spin` 回流。
   - 后端异步流程必须遵守任务终态不可覆盖、审计留痕和错误可追踪。

6. 验证
   - 至少执行对应模块的定向测试。
   - 新增/删除/重命名文件、目录结构变化、Controller route、前端 route 或 API client 变化后运行 `make code-map`；阶段验收、release evidence 或交接前运行 `make code-map-check`。
   - UI 改动必须执行 `node scripts/validate-frontend-ui.mjs` 和 `npm run build`。
   - 后端 controller 路由、API 契约或接口路径改动必须执行 `make api-design-check`，并同步 `docs/API_DESIGN.md`。
   - 安全边界改动必须执行 `./scripts/security-regression-check.sh`。
   - 阶段收口或跨模块改动必须执行 `make verify`。

7. 记录
   - 关键阶段、门禁、风险或用户关心的状态变化，更新 `AGENT_STATUS_BOARD.md` 的当前工作流状态、岗位状态和下一步。
   - 重要功能、bug 修复、安全/发布/API/DB/UI 门禁变化，在 `PRODUCT_PROGRESS_LOG.md` 追加记录；小型文档刷新可合并到阶段记录。
   - 如果影响长期路线或接手上下文，更新 `REFACTOR_ROADMAP.md` 与 `CODEX_HANDOFF.md`；普通小改动不强制更新 handoff。
   - 如果本轮使用了多 agent 或固定岗位审查，且产生关键结论、打回、门禁或风险，记录各 agent 的固定岗位、runtime nickname / agent id、写入范围、改动文件、验证命令、结论、风险、下一步、采纳项和未采纳原因。
   - 每轮结束必须记录物理运行时到固定岗位的一一映射，例如 `运行时 Bacon = 奥特曼 / Security Engineer，本轮做安全复核`；如果因极小任务或工具限制合并岗位，必须写明例外原因。
   - 子 agent 成果物包缺字段、验证不足、写入越界或结论与证据矛盾时，必须打回原岗位继续完善；只有冲突、阻塞或极小热修允许 Delivery Owner 接手，并记录原因。
   - 影响后续路线、边界或验收的判断必须同步写入 `AGENT_DECISION_REGISTER.md`。

## 3. Definition of Ready

一项工作进入实现前至少满足：

- 有明确用户价值或工程风险消除目标。
- 有所属阶段和主线模块。
- 有验收标准。
- 需要多 agent 的工作已定义固定岗位、写入范围、成果物包格式和打回条件。
- 需要 Security、QA、Architect、DevOps 或 Data/AI 独立门禁时，已定义一岗一物理子 agent 的派发计划；安全复核和 QA 复核不得合并为同一个实例，除非明确记录极小只读例外。
- 已确认不阻塞当前公开仓库分析主线，或阻塞原因被明确接受。
- 涉及安全边界时，已有测试或门禁方案。

## 4. Definition of Done

一项工作完成必须满足：

- 功能或重构已实现。
- 相关测试、构建或门禁已运行并记录结果。
- 如果本轮涉及文件结构、route、前端 route 或 API client 变化，`docs/PROJECT_CODE_MAP.md` 已刷新并通过 `make code-map-check`；阶段验收前必须通过该检查。
- 新增风险有说明，未完成项有下一步。
- 用户可见体验没有明显低级问题：文字可读、布局不裁切、按钮可理解、错误可定位。
- 必要文档和日志已按维护分级更新；不要求低风险小改动机械追加长日志。
- 所有参与子 agent 已提交完整成果物包：固定岗位、runtime nickname / agent id、写入范围、改动文件、验证命令、结论、风险和下一步。
- `AGENT_ACTIVITY_LOG.md` 已记录本轮每个物理运行时昵称到固定岗位的一一映射；合并岗位的历史例外或当轮例外必须有原因。
- 所有 `FAIL` / `PARTIAL` 成果物已打回原岗位或登记为阻塞；不得由 Delivery Owner 私自补完后标记完成。

若 `make verify` 未通过，不得声称阶段完成；只能记录为“局部完成，全量验证待修复”。

## 5. 量化记录字段

每轮开发日志必须尽量记录以下字段：

| 字段 | 示例 |
| --- | --- |
| Phase | `P12-pre` |
| Track | `Frontend UX` / `Security` / `Code QA` |
| Status | `DONE` / `PARTIAL` / `BLOCKED` |
| User value | 用户能清楚看见“打开报告”按钮 |
| Changed files | 关键文件列表 |
| Tests | `npm run build`, `node scripts/validate-frontend-ui.mjs` |
| Evidence | 浏览器 computed style、API smoke、测试数量 |
| Risk | 全量 `make verify` 暂未通过 |
| Next | 排查后端 clean test 的 target/classes 缺失 |

多 agent 成果物包还必须补充：

| 字段 | 示例 |
| --- | --- |
| Fixed role | `拉里佩奇 / QA Engineer` |
| Runtime | `Nietzsche / 019f1207-ab67-7673-9eb9-855cada554a1` |
| Write scope | `scripts/verify-release-evidence.sh`，或 `No file changes` |
| Changed files | `docs/AGENT_STATUS_BOARD.md` |
| Verdict | `PASS` / `FAIL` / `PARTIAL` / `PENDING` |
| Return policy | `FAIL returned to 拉里佩奇 for stronger release evidence assertions` |

## 6. PM 缺陷审查维度

每个阶段至少从以下角度检查缺陷：

- 主链路是否顺畅：用户能否从仓库接入走到报告、问答、修复和审计。
- 信息架构是否清楚：页面是否告诉用户当前状态、下一步和失败原因。
- 数据可信度是否可解释：报告、code_chunks、Agent 输出是否有来源和证据。
- 操作是否可撤销或可追踪：任务、PR、修复、Agent 工具调用是否有日志。
- 安全边界是否默认收紧：危险能力是否默认关闭，是否需要显式授权。
- 性能是否可量化：大仓库扫描、查询、渲染、任务列表是否有基准。
- UI 是否达到产品级：可读性、密度、响应式、状态面、按钮语义是否一致。

## 7. 阶段完成判定

阶段完成不能只看代码合并，必须同时满足：

- `PHASE_REQUIREMENTS.md` 中该阶段所有 Must 项完成。
- 关键验收命令通过。
- `PRODUCT_PROGRESS_LOG.md` 有阶段总结。
- 已列出 Should/Could 延期项及原因。
- 若需要真实环境，已有 smoke、drill 或 release evidence。
- `RISK_REGISTER.md` 没有未 owner 的 P0/P1 风险。
- `QUALITY_SCORECARD.md` 已更新阶段质量状态。
- `WORK_INTAKE_AND_BACKLOG.md` 中 P0/P1 backlog 已处理或明确阻塞。
- 本阶段涉及的专项制度已检查：测试、设计系统、威胁模型、性能、依赖/license、灾备回滚、工程标准、产品指标、合规隐私。
- raw access、evidence retention、数据生命周期和事故/回滚要求已按风险分别同步到对应制度文档。
