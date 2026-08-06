# SourceLens Agent Status Board

> AIOS v2.3 状态：`HISTORICAL SNAPSHOT - DO NOT UPDATE AS CURRENT TRUTH`。下方 P6/P9/P10/P11/P12-pre、11+5 团队和 release authority 只代表迁移前状态。当前事实唯一来源为 `aios/truth/project_state.yaml`。

> DEFAULT AGENT CONTEXT: `EXCLUDED`。只有当前 Task Contract 明确引用本文件时，才可读取指定章节作为历史证据。

状态：冻结的迁移前状态快照；禁止继续写入当前状态或下一步。

## 1. 当前阶段总览

| 字段 | 当前值 |
| --- | --- |
| Active goal | SourceLens 顶级化重构与核心功能开发 |
| Current phase | P9 三平面产品体验优先；P6 可信代码理解、P10 安全、P11 发布证据和 P12-pre 生产化并行维护 |
| Current priority | AgentChat 移动 composer/首屏仲裁；随后回到 P6 code_chunks/跨文件检索/引用质量，并保持 P10/P11 fail-closed 门禁 |
| Deferred layer | GitHub App E2E、私有仓库、多人协作、生产部署 |
| Delivery owner | `特朗普` |
| Agent dispatch rule | 独立门禁复核默认一岗一物理子 agent。安全复核单独启动 `奥特曼 / Security Engineer`，QA 复核单独启动 `拉里佩奇 / QA Engineer`；任务首行写固定岗位，日志记录 `运行时昵称 / agent id = 固定岗位 / 岗位`。Codex UI 随机昵称只作为 runtime，不作为项目成员名。 |
| Team model | 11 个固定核心角色 + 5 个按需专家角色池。专家池为 `任正非`、`马云`、`雷军`、`马化腾`、`张一鸣`，只在企业级边界、GTM、UX/SRE/Data-AI 等专项触发时启动，不作为常驻 16 人团队。 |
| Last full release package | CURRENT FULL AUTHORITY：`release-evidence/release-current-schema-20260710-114653`，完整 `release` profile 与独立 verifier 均 PASS，`required_failures=0`、`optional_warnings=0`、`skipped=5`。`release-current-schema-20260710-102254`、`release-current-schema-20260710-112054` 仅保留为失败/契约漂移诊断，均不得作为 authority。 |
| Latest focused milestone | P9 ScanTaskDetail 首屏状态真相与报告归属：四态、可信快照、15 个独立 fatal 场景、风险 fallback、五阶段 A -> B 隔离、递归 polling 和缺步骤真相已落地；focused 7 tests、4 PNG、build/static/diff 与四岗位最终 PASS。 |

## 2. 固定岗位状态

| 固定代号 | 岗位 | 当前状态 | 当前职责 | 主要证据入口 |
| --- | --- | --- | --- | --- |
| `特朗普` | Delivery Owner | Always active | 分派、集成、冲突取舍、最终验收、对用户汇报 | `CODEX_HANDOFF.md` |
| `乔布斯` | Product Manager | Active on product-facing work | 用户价值、主链路闭环、需求边界、验收标准 | `PHASE_REQUIREMENTS.md` |
| `库克` | Project Manager | Active on every phase | 阶段状态、阻塞项、进度量化、日志完整性 | `PRODUCT_PROGRESS_LOG.md` |
| `马斯克` | Architect | Active on cross-module work | 架构边界、API/DB/状态机、重构取舍 | `REFACTOR_ROADMAP.md` |
| `奥特曼` | Security Engineer | Active on repo/file/LLM/sandbox work | 凭据、SSRF、路径、沙箱、审计、GitHub/LLM 风险 | `SECURITY_BOUNDARY.md` |
| `黄仁勋` | DevOps Engineer | Active on scripts/release/env work | Docker、Makefile、preflight、release evidence、runbook | `OPERATIONS_RUNBOOK.md` |
| `梁文峰` | Data/AI Engineer | Active on analyzer/RAG/LLM work | code_chunks、embedding、QA 检索、prompt safety、AI 输出质量 | `LLM_SAFETY_EVALS.md` |
| `比尔盖茨` | Backend Engineer | On demand | Spring Boot、MyBatis、Flyway、任务、API、后端测试 | `API_DESIGN.md` / `DATABASE_DESIGN.md` |
| `扎克伯格` | Frontend Engineer | Active on UI/UX work | 页面体验、共享 UI 原语、响应式、浏览器 smoke | `web-console/src` / `validate-frontend-ui.mjs` |
| `达里奥` | Quality Gate | Active before release/evidence claims | 发布前强断言、证据包完整性、FAIL/PENDING 阻断 | `AGENT_STATUS_BOARD.md` / `AGENT_ACTIVITY_LOG.md` |
| `拉里佩奇` | QA Engineer | Active before completion claims | 测试矩阵、回归验证、失败复现、验收证据 | `PRODUCT_PROGRESS_LOG.md` |

## 2.1 按需专家池状态

| 专家代号 | 专项角色 | 当前状态 | 启动条件 |
| --- | --- | --- | --- |
| `任正非` | Enterprise Strategy / Compliance Advisor | On demand | 企业级边界、私有仓库、多租户、权限/数据边界、商业化路线 |
| `马云` | Go-to-Market / Ecosystem Advisor | On demand | 公开发布、目标用户分层、生态合作、商业闭环 |
| `雷军` | Product Design / UX Research Advisor | On demand | 大厂级 UI、复杂页面、报告体验、移动端可读性 |
| `马化腾` | Platform Reliability / SRE Advisor | On demand | 长任务、队列、Docker/MySQL、CI/release、备份回滚、可观测性 |
| `张一鸣` | Data Product / Growth AI Advisor | On demand | code_chunks/RAG/LLM 质量指标、反馈闭环、数据产品化 |

状态含义：

- `Active on every phase`：每轮都必须参与或复核。
- `Active on ... work`：涉及该领域时必须参与。
- `On demand`：相关模块有改动或风险时启动。
- `Not involved`：关键阶段复盘或用户询问时说明；普通小改动不强制写入活动日志。

## 3. 本轮工作看板

| Workstream | Lead role | Status | Evidence | Next checkpoint |
| --- | --- | --- | --- | --- |
| P9 ScanTaskDetail First-Viewport State Truth and Report Ownership | `乔布斯` / `马斯克` / `扎克伯格` / `拉里佩奇` / `特朗普` | DONE / FOCUSED P9 GREEN / FOUR-ROLE PASS | focused 7 passed / 48.5s；15 个独立 fatal 场景、5 类风险 fallback、preview stale/resync、route/polling race；desktop/320 READY+STALE 4 PNG；build/UI validator/diff PASS。 | 下一轮 AgentChat 移动 composer/首屏仲裁；不重复后端/API/DB/full release gate，除非相关契约发生变化。 |
| P9 ProjectDetail First-Viewport State Truth and Request Ownership | `乔布斯` / `马斯克` / `扎克伯格` / `拉里佩奇` / `特朗普` | DONE / FOCUSED P9 GREEN / PRODUCT + ARCHITECT + QA PASS | canonical smoke 11 passed / 54.9s，marker `5 initial / 15 fatal / 30 six-state / 5 stale / 1 A->B race`；batch4A 3 passed；frontend build/UI validator/diff check 与 desktop/320 trace PASS。 | 后继 ScanTaskDetail 切片已完成；本行保留为历史里程碑。 |
| P9 First-Viewport Context and Action Arbitration | `乔布斯` / `雷军` / `扎克伯格` / `拉里佩奇` / `特朗普` | DONE / FOCUSED P9 GREEN / QA PASS | Dashboard next-action smoke 覆盖 7 状态 x 1440/1024/768/390/320，`scrollY=0`、primary=1、白字、无横向溢出；Projects batch3 11 broad cases + empty-state focused case PASS；app-shell/build/UI validator/diff check PASS；`Popper / 019f4a53-c845-76b1-92d6-49a02b766688` 二轮 QA PASS。 | 下一轮实现持久化工作视角，或继续 ProjectDetail/ScanTaskDetail/AgentChat 首屏仲裁；不重复运行 API/DB/full release gate，除非相关契约发生变化。 |
| P6 Module-local Virtual Path Context Diversity | `梁文峰` / `拉里佩奇` / `特朗普` | DONE / BACKEND FULL TEST + STATIC GATES PASS | `Arendt / 019f3813-32cd-73d1-8fce-3344b0644e1e = 梁文峰 / Data-AI Engineer` 只读复核 `PASS`；`Linnaeus / 019f3813-51c3-7353-9091-d5400d7596fd = 拉里佩奇 / QA Engineer` 只读复核 `PASS`，补 `packages/marketing` decoy 后二次确认 `PASS`；backend full/static/schema/code-map PASS。 | 下一步优先 live public repo smoke/release evidence 刷新，验证最近 P6 检索修复在真实链路中的表现 |
| P6 Module-local SourceRoot Virtual Path Resolver | `梁文峰` / `拉里佩奇` / `特朗普` | DONE / FOCUSED P6 RETRIEVAL PASS | `Dirac / 019f3806-7fe5-7e23-a756-b6d7cebc54a7 = 梁文峰 / Data-AI Engineer` 只读复核 `PASS`；`Boole / 019f3806-b443-71c1-b734-abbff2a93213 = 拉里佩奇 / QA Engineer` 首轮 `PARTIAL` 后二轮 `PASS`；service test 覆盖同 path null root、同 path `packages/admin` root 和 `web-console` target；eval harness 校验 expectedFirstWorkspaceRoot/moduleRoot。 | 最终门禁后可执行 live public repo smoke/release evidence 刷新，或推进 P9 报告/QA UI 收口 |
| P6 SourceRoot Metadata Hosted SourceUrl Resolver | `梁文峰` / `拉里佩奇` / `特朗普` | DONE / BACKEND FULL TEST + STATIC GATES PASS | `Archimedes / 019f37fb-4007-7e21-9adf-42aea1bfd5ff = 梁文峰 / Data-AI Engineer` 只读复核 `PASS`；`Sartre / 019f37fb-6621-7152-ba96-1bfbfeb53f6a = 拉里佩奇 / QA Engineer` 只读复核 `PASS`；parser/service/fixed eval 三层覆盖 sourceRoot metadata 正例和无 metadata 保守负例；`minCaseCount=18`。 | 下一步补 module-local path + root metadata 虚拟全路径 resolver，或执行 live public repo smoke/release evidence 刷新 |
| P9 Core Route Status Line Readability Guard | `扎克伯格` / `雷军` / `拉里佩奇` / `特朗普` | DONE / FRONTEND STATIC + SMOKE PASS | `Turing / 019f2f55-75e4-7cc1-8c6d-b27accabd4ec = 拉里佩奇 / QA Engineer` 只读复核 `PARTIAL` 后已吸收；共享 `:is(...) span:not(.sl-live-dot)` late guard 覆盖 Dashboard/Project/Scan/Graph/Execution/Agent/Artifacts/Audit/CI/PR/Issue/AutoRepair；`APP_SHELL_UI_SMOKE_OK.guardedStatusLineCount=30`；`validate-frontend-ui` 和 app-shell smoke PASS。 | 继续 P9 深层 tab/table/drawer 可读性，或回到 P6 citation/retrieval 质量 |
| P9 Project Cockpit Status and Disabled Next Action Readability | `扎克伯格` / `雷军` / `拉里佩奇` / `特朗普` | DONE / FRONTEND STATIC + SMOKE PASS | `Carson / 019f2f47-14bf-7700-b123-6c55eff1af49 = 拉里佩奇 / QA Engineer` 只读复核 `PARTIAL` 后已吸收；`sl-project-cockpit-status` 改为 wrap/no ellipsis；`sl-project-next-action-actions` disabled default action 暗色可读；`APP_SHELL_UI_SMOKE_OK.layoutGuards` 包含两个新 guard；`validate-frontend-ui`、TypeScript、app-shell smoke、frontend build PASS。 | 继续 P9 深层页面表格/证据卡片/抽屉可读性，或回到 P6 citation/retrieval 质量 |
| P6 Code Chunk Role Intent No Content LIKE | `比尔盖茨` / `梁文峰` / `拉里佩奇` / `奥特曼` / `特朗普` | DONE / BACKEND TEST + STATIC SECURITY PASS | `CodeChunkService.addRoleIntentConditions(...)` 不再使用 `CodeChunk::getContent`；`searchChunks_shouldKeepRoleIntentQueriesOffContentLikeHotPath` 锁住 role intent SQL segment；`security-regression-check.sh --suite static` 锁住运行代码不得回退 `like(CodeChunk::getContent)`；运行代码无 `content LIKE` 查询命中。 | 后续召回增强必须走 analyzer metadata / indexed field，不能回退 MEDIUMTEXT LIKE |
| P6/P11 Code Chunk Query Hot Path and Release Authority Refresh | `比尔盖茨` / `梁文峰` / `黄仁勋` / `拉里佩奇` / `奥特曼` / `达里奥` / `特朗普` | DONE / FULL LOCAL AUTHORITY PASS | `V031__add_code_chunk_lookup_indexes.sql`；`CodeChunkService` keyword wrapper 不再生成 `content LIKE`；`public-repo-analysis-smoke.sh` step 8 子步骤可观测；`make verify` 使用 static security suite；`release-evidence/release-current-schema-20260705-0610` verifier PASS。 | 继续 P6 retrieval quality，但不能重引入 MEDIUMTEXT `content LIKE`；继续 P9/P10/P11 主线 |
| Top-tier Company Governance Completion | `库克` / `乔布斯` / `达里奥` / `特朗普` | DONE / REQUIRED DOCS ADDED / PM PASS | 新增 `WORK_INTAKE_AND_BACKLOG.md`、`TEST_STRATEGY.md`、`FRONTEND_DESIGN_SYSTEM.md`、`THREAT_MODEL.md`、`PERFORMANCE_BENCHMARK.md`、`DEPENDENCY_AND_LICENSE_POLICY.md`、`DISASTER_RECOVERY_AND_ROLLBACK_SIGNOFF.md`、`ENGINEERING_STANDARDS.md`、`PRODUCT_METRICS_AND_FEEDBACK.md`、`COMPLIANCE_AND_PRIVACY.md`；`Wegener / 019f2d5f-9d21-7f22-9705-384b298edfbb = 库克 / Project Manager` 只读复核 `PASS`，确认 10 项必要且无硬命名冲突。 | 后续开发按这些制度执行；阶段收口时检查 backlog、test strategy、risk、scorecard、metrics、performance、DR/rollback 和 compliance 状态 |
| Virtual Company Operating System | `库克` / `乔布斯` / `奥特曼` / `黄仁勋` / `达里奥` / `特朗普` | DONE / GOVERNANCE BASELINE ADDED / PARTIAL REVIEW ABSORBED | 新增 `SOURCELENS_OPERATING_SYSTEM.md`、`RISK_REGISTER.md`、`QUALITY_SCORECARD.md`、`RELEASE_PROCESS.md`、`OBSERVABILITY_AND_INCIDENTS.md`、`DATA_GOVERNANCE.md`、`RAW_ACCESS_AND_EVIDENCE_RETENTION_POLICY.md`；`Bohr / 019f2d4f-6383-7631-942d-1edda7f75551 = 库克 / Project Manager` 只读复核 `PARTIAL`，指出 raw/evidence/DR 缺口，本轮已吸收 raw/evidence policy。 | 阶段收口时更新 scorecard 和 risk register；P12 真生产化前继续补灾备恢复与回滚签署证据 |
| Documentation Maintenance Cadence | `库克` / `乔布斯` / `特朗普` | DONE / GOVERNANCE UPDATED / LOWER MAINTENANCE COST | `docs/PRODUCT_GOVERNANCE.md` 新增实时/阶段/周期文档维护分级；`scripts/generate-project-code-map.mjs` 改为简洁索引；`README.md` 同步 code map 和进度日志职责。 | 阶段收口时做文档一致性检查和垃圾文件盘点；低风险小改动不再机械更新长日志 |
| API Request DTO Field Contract Gate | `特朗普` / `马斯克` / `比尔盖茨` / `拉里佩奇` | DONE / LOCAL GATE PASS / REQUEST BODY FIELD CONTRACT | `scripts/validate-api-design.mjs` 解析 `@RequestBody` DTO 顶层字段与首批一层嵌套 DTO 字段，并比对 `docs/API_DESIGN.md` Request JSON；已覆盖 `CodeQaRequest.evidenceRef` 和 `AutoRepairRequest.provenance`；当前 `API request body docs: checked=23 nestedChecked=2 skipped=4`；`node --check` 与 `node scripts/validate-api-design.mjs` PASS。 | 下一步可做 Response DTO 字段检查或更深层 schema 检查 |
| API Design Strict Docs-only Gate | `特朗普` / `马斯克` / `比尔盖茨` / `拉里佩奇` | DONE / LOCAL GATE PASS / STRICT DOCS-ONLY DEFAULT | `scripts/validate-api-design.mjs` docs-only route 默认失败，`GET /api-docs` 作为 Springdoc 框架端点显式 allowlist；`make api-design-check` 输出 `controllers=27 routes=89 documentedControllerRoutes=89 docsOnlyAllowed=1` 并 PASS。 | 下一步可做 DTO 字段级 API contract 检查，或回到 P6/P9 代码理解与报告体验 |
| Project Code Map Deep Inventory | `特朗普` / `乔布斯` / `马斯克` / `拉里佩奇` | DONE / SUPERSEDED BY CONCISE CODE MAP POLICY | `PROJECT_CODE_MAP.md` 已从详细审计型调整为简洁索引型；保留目录/文件用途、后端 REST 入口、前端 route 和 API client 定位。 | 后续结构/API 入口变化、阶段验收或交接前刷新；不要求低风险小改动后立刻刷新 |
| Release Evidence Unknown Review Closure | `黄仁勋` / `库克` / `特朗普` | DONE / LOCAL GATE PASS / UNKNOWN ZERO | `20260703-181321` manifest 为 `profile=local`，`required_failures=0`，成功步骤包含 `agent-chat-closure-rail-ui-smoke`、`phase12-baseline`、`sandbox-drill`；inventory 规则新增 legacy local focused classification；当前 `unknown-review=0`、`KEEP_RETAINED_FOCUSED=41`、`deleteAllowedAny=false`。 | 后续 release evidence 治理只剩人工抽查 22 个 `ARCHIVE_CANDIDATE_MANUAL_ONLY` 和 22 个 `DIAGNOSE_BEFORE_ARCHIVE` |
| Release Evidence Retention Dry-run Gate | `黄仁勋` / `库克` / `特朗普` | DONE / LOCAL GATE PASS / READ-ONLY | `make release-evidence-retention-dry-run` 输出 `total=86`、`delete_allowed=false`；动作建议 `KEEP_CURRENT_AUTHORITY=1`、`KEEP_RETAINED_FOCUSED=41`、`ARCHIVE_CANDIDATE_MANUAL_ONLY=22`、`DIAGNOSE_BEFORE_ARCHIVE=22`、`CLASSIFY_BEFORE_ACTION=0`；不移动、不删除、不归档。 | 后续若要真实归档，必须先人工确认 `ARCHIVE_CANDIDATE_MANUAL_ONLY`，并重新启动 SRE 复核 |
| Release Evidence Inventory Gate | `马化腾` / `黄仁勋` / `库克` / `特朗普` | DONE / LOCAL GATE PASS / SRE TIMEOUT | `scripts/release-evidence-inventory.mjs`、`make release-evidence-inventory`；当前输出 `total=86`、`current-full=1`、`retained-focused=41`、`historical-superseded=22`、`failed-or-interrupted=22`、`unknown-review=0`、`deleteAllowedAny=false`；`Pasteur the 2nd / 019f2d05-3cea-7f80-9d00-9d1c537acc93 = 马化腾 / Platform Reliability / SRE Advisor` 未在等待窗口内产出成果物，已关闭，不作为验收证据。 | 后续若做真实归档，重新启动 SRE 复核；本轮只读 inventory 已可用 |
| Project Code Map Governance Gate | `拉里佩奇` / `库克` / `黄仁勋` / `特朗普` | DONE / CONCISE INDEX / PERIODIC FRESHNESS | `docs/PROJECT_CODE_MAP.md` 由 `scripts/generate-project-code-map.mjs` 生成，当前定位为简洁索引；`make code-map-check` 仍接入 `make verify`，但日常只在结构/API 入口变化、阶段验收或交接前使用。 | 后续如果说明不准，改生成器规则后刷新；不手工维护生成文档 |
| P12-pre API Design Inventory Gate | `拉里佩奇` / `达里奥` / `特朗普` | DONE / QA PASS / VERIFY GATE ADDED / STRICT DOCS-ONLY / REQUEST BODY FIELD CONTRACT | `Bohr the 2nd / 019f2ce7-fa69-7501-968b-8df1d213a79f = 拉里佩奇 / QA Engineer` 只读复核 `PASS`；`scripts/validate-api-design.mjs` 提取 27 个 controller / 89 条 route；`make api-design-check` PASS；`verify-all` 已接入；docs-only 业务 route 默认失败；Request DTO 顶层字段和首批嵌套字段已与文档 Request JSON 对齐，当前 `checked=23 nestedChecked=2 skipped=4`。 | 下一步：Response DTO 字段检查；若未来使用常量 path、组合注解、更深嵌套或 record DTO，升级 parser |
| API Design Current Controller Alignment | `比尔盖茨` / `达里奥` / `特朗普` | DONE / BACKEND DOC PARTIAL FIXED / CORE API MAP UPDATED | `Plato the 2nd / 019f2cda-fb0e-7a53-a8ce-db93756e36ca = 比尔盖茨 / Backend Engineer` 只读审计 `PARTIAL`；`API_DESIGN.md` 已补 Code QA 检索元数据、code_chunks search、scan governance timeline、Artifact preview/download receipt、AutoRepair provenance、Agent chat/SSE、LLM config/mock LLM、GitHub webhook inbound/delivery、dev/test smoke seed；四份文档 `git diff --check` PASS；20 个 JSON 示例解析 PASS。 | 下一步：脚本化 API inventory gate，防止 controller 路由和文档再次漂移 |
| P9/P11 Report Evidence Decision Summary Gate Hardening | `拉里佩奇` / `扎克伯格` / `达里奥` / `特朗普` | DONE / QA PARTIAL FIXED / FOCUSED UI GATE VERIFIED | `Carson the 2nd / 019f2cd3-ed06-7380-a2d3-39dd93ab2a69 = 拉里佩奇 / QA Engineer` 只读复核 `PARTIAL`；已补 `decisionSummaryContained` / `decisionSummaryNotClipped` validator 静态锁定；smoke 对决策摘要 3 个 item 的 label/value/detail 做三视口不裁切断言；`node scripts/validate-frontend-ui.mjs` PASS；`npm --prefix web-console run build` PASS；`CI=true npm --prefix web-console run smoke:report-evidence-drawer` PASS。 | 下一步 P9：继续报告/QA 信息密度治理；P11：下一次 full authority refresh 吸收该 focused UI gate |
| Project Structure Audit and Documentation Alignment | `库克` / `黄仁勋` / `特朗普` / `达里奥` | DONE / SECOND REVIEW COMPLETE / RUNTIME CLEANUP SCRIPT ADDED | `Mill the 2nd / 019f2cc9-8988-75c1-82a1-da3d67972b8a = 库克 / Project Manager` 首轮只读审计 `PARTIAL`；`Franklin the 2nd / 019f2cf0-0827-7b91-ae48-6d7333b6e01a = 库克 / Project Manager + Documentation Auditor` 二次只读复核 `PARTIAL`；新增 `scripts/clean-local-generated.sh`、`make clean-local-generated`；保留最新 runtime jar 并删除 30 个旧 jar，`.sourcelens-runtime` 降到约 `55M`，仓库约 `355M`；`backend-spring/target` 因 dev 后端使用 `target/classes` 自动跳过。 | 下一步：release-evidence 分层归档策略、DEMO_SCRIPT 升级、DAILY_GROWTH_PLAN 是否归档 |
| P6 Raw Code QA Cross-file Citation Summary | `张一鸣` / `雷军` / `奥特曼` / `达里奥` / `特朗普` | DONE / LIVE FOCUSED SMOKE VERIFIED | `Kuhn / 019f2c6f-56e8-7562-b7c1-cb7630648e3b = 张一鸣` 只读复核 `PARTIAL_TO_IMPLEMENT`；`Aristotle / 019f2c8b-5fc2-7e50-b289-05b8ae220e93 = 雷军` 建议不强行同 schema，下一步做前端统一可读 view model；`Lovelace / 019f2c8c-19cb-7c20-8515-114a50517268 = 奥特曼` 指出 PARTIAL coverage 不得 ready overclaim；`public-repo-analysis-smoke.sh` 输出 raw `codeQa.crossFileCitationSummary`；`verify-release-evidence.sh` optional-present strict；`security-regression-check.sh` 新增 overclaim forged cases；focused live public repo smoke `scanTaskId=268` PASS，summary 证明 `PRIMARY_CROSS_FILE`、`crossFileEvidenceSatisfied=true`、`citationBindingSatisfied=true`、`claimBindingSatisfied=true`、`coverageStatus=PARTIAL`、`tones=["warning"]`、`primaryCoverageSatisfied=false`。 | 下一步 P6/P9：ProjectDetail 前端统一可读 view model；下一步 P11：下一次 full authority refresh 吸收该 marker |
| P6 Code QA First PRIMARY Exact Anchor Evidence | `梁文峰` / `达里奥` / `特朗普` | DONE / LIVE FOCUSED SMOKE VERIFIED | `Meitner / 019f2c5f-d650-7453-92ca-2009e161d8ba = 梁文峰 / Data-AI Engineer` 只读复核 `PASS_TO_IMPLEMENT`；`public-repo-analysis-smoke.sh` 在 `codeUnderstandingFixture.codeQa` 输出 `firstPrimaryIndex=0`、`firstPrimaryContextRole=PRIMARY`、`firstPrimaryExactAnchorPreserved=true`；`verify-release-evidence.sh` 对新字段做 optional-present strict；`security-regression-check.sh` 新增 first-primary forged cases；focused live public repo smoke `scanTaskId=266` PASS。 | 下一步 P6：下一次 full authority refresh 吸收该 marker，或继续 report citation source diversity / cross-file citation summary |
| P6/P11 Public Repo Source Location Probe v4 Exact Anchor First Result | `达里奥` / `比尔盖茨` / `黄仁勋` / `特朗普` | DONE / LIVE FOCUSED SMOKE VERIFIED | `Tesla / 019f2c1a-7691-7812-8eb5-0333bf3dda83 = 达里奥 / Quality Gate` 只读复核 `PARTIAL accepted`；`CodeChunkService.searchChunks/listRetrievalCandidates` rank 后执行 exact-anchor-first preservation；`public-repo-analysis-smoke.sh` 升级 `sourceLocationProbeContractVersion=4`，每个 probe 输出 first-result proof；`verify-release-evidence.sh` 强校验 v4；`security-regression-check.sh` 新增 first-result drift forged cases；真实 public repo smoke `scanTaskId=262` PASS。 | 下一步 P6：把 v4 focused marker 纳入下一次 full release authority refresh；或继续 multi-anchor citation quality / report evidence source diversity |
| P6 Code QA Exact Anchor Preservation | `梁文峰` / `达里奥` / `特朗普` | DONE / FOCUSED BACKEND CONTRACT VERIFIED | `Mill / 019f2c10-eb47-7981-9f17-210fa6c72d49 = 梁文峰 / Data-AI Engineer` 只读复核 `PASS_TO_IMPLEMENT`；`CodeQaRetrievalService` 新增 exact anchor candidate merge 和 exact-anchor-first final selection；`CodeChunkRanker.isExactLocationAnchorMatch(...)` 要求 line hint 覆盖且 path/method/source-url file hint 匹配；`CodeQaRetrievalServiceTest` 新增高分同文件噪声压力用例；targeted backend tests PASS。 | 下一步 P6：把 exact-anchor backend contract 吸收到 public repo smoke/source-location evidence，或继续 multi-anchor citation quality；P9 可回到报告/QA 信息密度治理 |
| P6/P11 Report Narrative Citation Quality Binding | `张一鸣` / `梁文峰` / `达里奥` / `黄仁勋` / `特朗普` | DONE / FOCUSED LIVE MARKER VERIFIED | `Sagan / 019f2bf9-40ff-77b0-8a11-63a7a53ed1cc = 张一鸣 / Data Product and Growth AI Advisor` 只读复核 `PASS_TO_IMPLEMENT`；`reportCitationQuality.narrativeBindings` 新增 6 个结构化 narrative count binding；`reportEvidenceQaCitationQuality` 新增 `narrativeCitationStatus=ALL_SAMPLES_NARRATIVE_BOUND`、`narrativeBoundSampleCount`、`minNarrativeEvidenceRefFieldCount`、sample narrative source binding 字段；真实 focused smoke `scanTaskId=261` PASS；`release-verifier-public-repo-marker` PASS；`release-verifier-public-repo-ui-marker` PASS。 | 下一步 P6：继续 code_chunks ranking exact anchor preservation，或 P9 回到报告/QA 页面信息密度；下一步 P11：下一次完整 release authority refresh 吸收本轮 narrative marker |
| P6/P11 Report Evidence QA Exact Line-Anchor Citation Binding | `梁文峰` / `达里奥` / `黄仁勋` / `特朗普` | DONE / FOCUSED LIVE MARKER VERIFIED | `Heisenberg / 019f2bea-6023-7e81-ba7b-2f7c74646416 = 梁文峰 / Data-AI Engineer` 只读复核 `PASS_TO_IMPLEMENT`；`reportEvidenceQaCitationQuality` 新增 `lineAnchorCitationStatus=ALL_SAMPLES_BOUND`、`lineAnchorBoundSampleCount`、`minLineAnchorCitedCount`、`minLineAnchorPrimaryCitedCount` 和 sample 级 citation file/start/end/contextRole；真实 focused smoke `scanTaskId=260` PASS，4 个样本、4 个文件全部 PRIMARY exact-line bound；`bash -n` PASS；`security-regression-check.sh --suite release-verifier-public-repo-marker` PASS。 | 下一步 P6：继续 report narrative citation quality 或 code_chunks ranking 质量；下一步 P11：下一次完整 release authority refresh 吸收该 exact-line marker |
| P9/P6 ScanTaskDetail Report Evidence Priority Rail | `雷军` / `扎克伯格` / `奥特曼` / `拉里佩奇` / `达里奥` / `特朗普` | DONE / QA PARTIAL FIXED / FOCUSED UI SAFETY GATE VERIFIED | `Bernoulli / 019f2be1-2797-76e0-a80b-a551684d2dd9 = 拉里佩奇 / QA Engineer` 只读复核 `PARTIAL` 已修复；`risk-evidence` key 固定；`buildEvidenceChunkQuery` 使用 redacted evidence；`REPORT_EVIDENCE_DRAWER_SMOKE_OK.priorityRail` 和 `codeChunksSearchRedaction` 均为 true；`node scripts/validate-frontend-ui.mjs` PASS；`npm --prefix web-console run build` PASS；`npm --prefix web-console run smoke:report-evidence-drawer` PASS；diff check PASS。 | 下一步 P9：继续 ScanTaskDetail/ProjectDetail 报告与 QA 体验信息密度治理；下一步 P6：继续 report narrative citation / code_chunks ranking 质量 |
| P6 Code Location Function@SourceURL Stack Frame Support | `梁文峰` / `扎克伯格` / `达里奥` / `奥特曼` / `特朗普` | DONE / FOCUSED PARSER GATE VERIFIED | `FUNCTION_AT_FILE_HINT_PATTERN`、`simpleFunctionName`、`ProjectDetail` stack-frame classifier、`node scripts/validate-frontend-ui.mjs` PASS、`mvn -q -f backend-spring/pom.xml -Dtest=CodeLocationHintParserTest,CodeChunkServiceTest test` PASS、`bash -n scripts/public-repo-analysis-smoke.sh scripts/verify-release-evidence.sh scripts/security-regression-check.sh` PASS、`npm --prefix web-console run build` PASS。 | 下一步 P6：Report Evidence QA Multi-anchor Citation Quality Evaluation；备选：把 function@source-url 纳入下一次 public repo source-location probe focused evidence |
| P9/P11 Frontend Vendor Chunk Boundary Hardening | `雷军` / `扎克伯格` / `黄仁勋` / `达里奥` / `特朗普` | DONE / FOCUSED BUILD GATE VERIFIED | `manualChunks` 输出 `vendor-react`、`vendor-http`、`vendor-antd`；`chunkSizeWarningLimit=1100`；`validate-frontend-ui.mjs` 锁定 AntD/icon/cssinjs/rc 同归 `vendor-antd`；`node scripts/validate-frontend-ui.mjs` PASS；`bash -n scripts/verify-release-evidence.sh scripts/security-regression-check.sh` PASS；`git diff --check -- web-console/vite.config.ts web-console/vite.config.js scripts/validate-frontend-ui.mjs` PASS；`npm --prefix web-console run build` PASS 且无 chunk/circular warning。 | 下一步 P6：继续 code_chunks ranking/report citation 质量指标；或 P9：UI 信息密度、首屏性能指标化和大厂级视觉治理 |
| P6 Report Evidence QA Claim Role Drift Schema Hardening | `梁文峰` / `扎克伯格` / `黄仁勋` / `奥特曼` / `拉里佩奇` / `达里奥` / `特朗普` | DONE / FOCUSED SCHEMA GATE VERIFIED | `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK.qaFromEvidence.drift.claimRoleDistributionMissing/Mismatch`；`qaRequestCount=6`、`qaTotalRequestCount=18`；`node scripts/validate-frontend-ui.mjs` PASS；`npm --prefix web-console run smoke:report-evidence-drawer` PASS；`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-report-evidence-marker` PASS；`npm --prefix web-console run build` PASS。 | 下一步 P6：继续 code_chunks ranking/report citation 质量指标；或 P9 进入大厂级 UI 信息密度治理 |
| P6/P11 Public Repo UI Source Location Readability Live Evidence | `拉里佩奇` / `扎克伯格` / `黄仁勋` / `达里奥` / `特朗普` | DONE / FOCUSED LIVE EVIDENCE VERIFIED | focused evidence `release-evidence/public-repo-ui-source-location-readability-20260704-115759` verifier PASS；`PUBLIC_REPO_UI_SMOKE_OK.qaFromEvidence.sourceLocationReadability` 证明 6 条 ready/review proof、390/320 视口、source receipt contained/wrap/not-clipped、confidence metrics/checks readable、file match release not-clipped/noRepairOnReview、no horizontal overflow、real backend、non-mock API 和 `targetFileMatchesExpected=true`。 | 下一步 P6：继续 code_chunks ranking/report citation 质量指标；或 P9 进入大厂级 UI 信息密度治理 |
| P6/P11 Public Repo Report Evidence QA Citation Live Retained Sample | `特朗普` / `达里奥` / `梁文峰` | DONE / FOCUSED LIVE MARKER VERIFIED | `SOURCELENS_PUBLIC_REPO_SMOKE_REPORT_EVIDENCE_QA_CITATION=true SOURCELENS_PUBLIC_REPO_SMOKE_UI=false SOURCELENS_PUBLIC_REPO_SMOKE_CLEANUP=false ./scripts/public-repo-analysis-smoke.sh` PASS；retained sample `projectId=339`、`repositoryId=300`、`scanTaskId=256`；`reportEvidenceQaCitationQuality.status=OK`、`sampleCount=2`、`REPORT_LINE_ANCHOR`、`VERIFIED`、`RETRY_VERIFIED`、required evidence `100%`、claim `READY`、role `PRIMARY_BOUND`。 | 下一步 P6：报告 narrative 引用质量、按文件分组采样、跨文件检索质量；下一步 P11：把 focused marker 进入下一次完整 release evidence package |
| P6/P11 Public Repo Cross-file File Distribution Sampler | `梁文峰` / `达里奥` / `特朗普` | DONE / FOCUSED LIVE MARKER VERIFIED | `Hubble / 019f2b90-8806-7d73-a09c-97b3ac8b272a = 梁文峰 / Data-AI Engineer` 只读复核 `PARTIAL` 已吸收；`crossFileRetrievalProof.fileDistributionSampleCount=4`；真实 sample `projectId=340`、`repositoryId=301`、`scanTaskId=257`；`security-regression-check.sh --suite release-verifier-public-repo-marker` PASS。 | 下一步 P6：report narrative citation sampler，优先不同 file / section；下一步 P11：把稳定 focused marker 进入下一次完整 release evidence package |
| P6/P11 Report Evidence QA Source Diversity Sampler | `梁文峰` / `达里奥` / `特朗普` | DONE / FOCUSED LIVE MARKER VERIFIED | `Carver / 019f2ba1-5362-7fe1-bf24-e8e496cf3fd3 = 梁文峰 / Data-AI Engineer` 只读复核 `PARTIAL` 已吸收；真实 sample `projectId=342`、`repositoryId=303`、`scanTaskId=259`；`candidateCount=36`、`sampleCount=4`、`uniqueFileCount=4`、`diversityStatus=MULTI_FILE`；`security-regression-check.sh --suite release-verifier-public-repo-marker` PASS。 | 下一步 P11：吸收到下一次完整 release evidence package；下一步 P9：报告/QA 页面可读性和大厂级 UI 信息密度 |
| P6/P9 Project QA Source Location Confidence Readability Marker | `拉里佩奇` / `扎克伯格` / `达里奥` / `特朗普` | DONE / FOCUSED READABILITY MARKER | `PROJECT_QA_RECOVERABLE_SMOKE_OK.sourceLocationConfidence.readability` 证明 6 条 ready/review proof、390/320 视口、source receipt contained/wrap/not-clipped、confidence metrics/checks readable、file match release not-clipped/noRepairOnReview 和 no horizontal overflow；validator 锁定 helper、proof 聚合和 marker。 | 下一步 P6：真实 public-repo/source-location release marker 强化，或 code_chunks ranking/report citation 质量指标 |
| P10 Artifact Raw Download Receipt ID Failure Boundary Hardening | `比尔盖茨` / `扎克伯格` / `奥特曼` / `拉里佩奇` / `特朗普` | DONE / FOCUSED RECEIPT-ID FAILURE BOUNDARY GATE | `AuditLogServiceTest.record_shouldReturnNullWhenAuditInsertFails`；`ArtifactControllerTest.downloadArtifact_shouldNotExposeAuditHeaderWhenAuditInsertFails`；Artifacts fail-soft copy 区分有 id / 无 id；`ARTIFACTS_DETAIL_SELECTION_SMOKE_OK.rawDownloadAuditFallback` 证明 no-header fallback URL 不含 `auditLogId` 且不宣称 receipt id。 | 下一步 P10：服务端单条 receipt lookup、raw view/download 完整授权层、按 artifact type 的高风险策略；P11 可考虑把 receipt id/fallback marker 纳入 release verifier |
| P6 Project QA Source Location Confidence Mocked Gate | `张一鸣` / `扎克伯格` / `达里奥` / `特朗普` | DONE / FOCUSED MOCKED UI GATE | `PROJECT_QA_RECOVERABLE_SMOKE_OK.sourceLocationConfidence` 证明 3 视口下 source evidence `filePath + lineNumber` 进入 QA 请求；line anchor 显示 `来源定位可信` 并出现修复候选入口；file anchor drift 显示 `来源定位需复核` 且不显示修复候选入口；validator 锁定 marker 和 UI 断言。 | 下一步 P6：继续真实 public-repo/source-location release marker 强化，或进入 code_chunks ranking/report citation 质量指标 |
| P10 Artifact Raw Download Receipt ID Traceability | `比尔盖茨` / `扎克伯格` / `奥特曼` / `拉里佩奇` / `特朗普` | DONE / FOCUSED RECEIPT-ID TRACEABILITY GATE | `AuditLogService.record` 返回 inserted id；`ArtifactController` 成功下载回传 `X-SourceLens-Audit-Log-Id`；CORS expose 该 header；Artifacts 读取 header 并生成含 `auditLogId` 的 AuditLogs URL；AuditLogs API/UI 支持 `auditLogId` filter 和 exact deep link；smoke marker 证明 `auditLogId=904` header -> URL -> query -> exact selection bound。 | 下一步 P10：服务端单条 receipt lookup、raw view/download 完整授权层、按 artifact type 的高风险策略；P11 可考虑把 receipt id marker 纳入 release verifier |
| P10 Artifact Raw Download Audit Deep Link Traceability | `扎克伯格` / `奥特曼` / `拉里佩奇` / `特朗普` | DONE / FOCUSED AUDIT TRACEABILITY GATE | Artifacts raw download success 后展示 audit receipt 状态块和 `查看下载审计`；deep link 只携带 `projectId/resourceType=ARTIFACT/resourceId/action=ARTIFACT_RAW_DOWNLOAD/status=SUCCESS`；AuditLogs `RESOURCE_OPTIONS` 支持 `ARTIFACT`，关联资源回跳 Artifact detail；`ARTIFACTS_DETAIL_SELECTION_SMOKE_OK.rawDownloadAuditDeepLink` 与 `AUDIT_LOGS_ARTIFACT_RAW_DOWNLOAD_DEEP_LINK_SMOKE_OK` 均 PASS。 | 下一步 P10：receipt id 回显、服务端 receipt lookup、按 artifact type 的更强策略和完整 raw view/download 授权层；P9 可继续 Artifacts/AuditLogs UI 信息密度 |
| P10 Artifact Raw Download Acknowledgement And Audit Receipt | `比尔盖茨` / `扎克伯格` / `奥特曼` / `拉里佩奇` / `特朗普` | DONE / FOCUSED RAW DOWNLOAD SAFETY GATE | `/download` 增加 `rawDownloadAcknowledged` fail-closed 参数；成功/拒绝 raw download 写 `ARTIFACT_RAW_DOWNLOAD` receipt；Artifacts 页面下载前确认；`ARTIFACTS_DETAIL_SELECTION_SMOKE_OK.rawDownloadBoundary` 证明 request bound、acknowledgement present、receipt expected、redaction claim false、marker no raw payload。 | 下一步 P10：继续 raw view/download/export 的服务端授权、receipt id、AuditLogs deep link 和策略化高风险 artifact 控制；P9 可继续 Artifacts/AuditLogs 产品级 UI |
| P9 AgentChat Title Handoff And API Error Display Redaction | `扎克伯格` / `奥特曼` / `拉里佩奇` / `特朗普` | DONE / FOCUSED FRONTEND SAFETY GATE | `AgentChat.tsx` 的 conversation title、sidebar title、delete label、handoff URL params、handoff panel、composer prompt、generated task title、API error state 和 local toast 使用 shared display redaction；`AGENT_CHAT_CLOSURE_RAIL_SMOKE_OK` 新增 `agentChatConversationTitleRedaction`、`agentChatHandoffDisplayRedaction`、`agentChatApiErrorStateRedaction` 三个 marker scope；validator 禁止 raw title/filePath/lineRef/error 回退。 | 下一步 P9/P10：继续 AgentChat 外的 copy/export/download/raw display 面；P11 后续考虑把新 marker 纳入 release verifier |
| P9 AgentChat Message And Error Display Redaction | `扎克伯格` / `奥特曼` / `拉里佩奇` / `特朗普` | DONE / FOCUSED FRONTEND SAFETY GATE | `AgentChat.tsx` 的 persisted message content、errorMessage 和 streaming content 使用 shared display redaction；`AGENT_CHAT_CLOSURE_RAIL_SMOKE_OK.agentChatMessageErrorRedaction` 证明 persisted message/error 的 UI/body/URL/marker raw hidden、redaction visible、safe marker visible；validator 禁止 raw `msg.content` / `msg.errorMessage` 回退。 | 已由下一条 AgentChat title/handoff/API error slice 继续扩展；后续转向 AgentChat 外的 copy/export/download/raw display 面 |
| P9 Project QA AutoRepair Candidate Source Evidence Display Redaction | `扎克伯格` / `奥特曼` / `拉里佩奇` / `特朗普` | DONE / FOCUSED FRONTEND SAFETY GATE | `ProjectDetail.tsx` 的 QA answer、回答来源凭证、来源文件匹配说明、AutoRepair targetDesc、sourceEvidence URL params、citation evidenceReason 和 create payload handoff 使用 shared display redaction；`PROJECT_QA_AUTOREPAIR_CANDIDATE_SMOKE_OK.qaAnswerSourceReceipt.redaction` 证明 UI/body/URL/payload/marker raw hidden、safe marker visible、redaction visible、marker no raw；validator 锁住防回退门禁。 | 下一步 P9：继续剩余 raw/source/code preview 面，或进入大厂级 UI 信息密度治理；P10 后续设计后端 raw 查看/下载授权与审计 |
| P9 AutoRepairs Candidate Provenance Receipt Display Redaction | `扎克伯格` / `奥特曼` / `拉里佩奇` / `特朗普` | DONE / FOCUSED FRONTEND SAFETY GATE | `AutoRepairs.tsx` 的 Candidate/Draft Receipt、Source Bridge、candidate gate、PR confirm summary、targetDesc/file/error/timeline 和 QA URL 使用 shared display redaction；`REPORT_AUTOREPAIR_CANDIDATE_UI_SMOKE_OK.candidateReceiptRedaction` 证明 UI/body/URL raw hidden、safe marker visible、redaction visible、marker no raw；validator 锁住防回退门禁。 | 下一步 P9：继续剩余 raw/source/code preview 面，或处理 build chunk warning 和大厂级 UI 信息密度 |
| P9 ScanTaskDetail Report Evidence Metadata Redaction | `扎克伯格` / `奥特曼` / `拉里佩奇` / `特朗普` | DONE / FOCUSED FRONTEND SAFETY GATE | `ScanTaskDetail.tsx` 报告证据 metadata、风险列表、技术债、建议、QA 深链、复制引用和 AutoRepair target 使用 shared display redaction；`ProjectDetail.tsx` 来源桥展示/复制/重新检索使用 redacted evidenceRef；`REPORT_EVIDENCE_DRAWER_SMOKE_OK.questionReferenceDeeplinkRedaction` 证明 question/body/URL/clipboard/manual copy no raw；validator 锁住防回退门禁。 | 下一步 P9：继续剩余 raw/source/code preview 面，或处理 build chunk warning 和大厂级 UI 信息密度 |
| P9 ScanTaskDetail ArtifactFallback Summary JSON Redaction | `扎克伯格` / `奥特曼` / `拉里佩奇` / `特朗普` | DONE / FOCUSED FRONTEND SAFETY GATE | `ScanTaskDetail.tsx` 的 `ArtifactFallback` 使用 `stringifyRedactedPayload(data, 2)`；`report-evidence-drawer` smoke 新增 `SCAN_TASK_DETAIL_ARTIFACT_FALLBACK_SMOKE_OK`，三视口证明 fallback visible、safe marker visible、raw secrets hidden、body raw hidden、redaction visible、marker no raw；validator 禁止 raw `JSON.stringify(data, null, 2)` 回退。 | 下一步 P9：继续扫描剩余 raw/source/code preview 面；P10 raw 查看/下载另开后端授权与审计专项 |
| P9 Project QA code_chunks Search Preview Redaction | `扎克伯格` / `奥特曼` / `拉里佩奇` / `特朗普` | DONE / FOCUSED FRONTEND SAFETY GATE | `ProjectDetail.tsx` 搜索结果预览和复制引用使用 `redactedChunkPreview`；`project-qa-recoverable` smoke 注入 raw chunk secrets 并输出 `PROJECT_QA_CODE_CHUNK_PREVIEW_DISPLAY_REDACTION_ONLY` marker；validator 禁止 raw `item.contentPreview || item.content` 回退。 | 下一步 P9：继续扫描 ProjectDetail/ScanTaskDetail 剩余 source/code preview 面，或回到 UI 信息密度治理 |
| P9 Shared Frontend Display Redaction Utility | `扎克伯格` / `奥特曼` / `拉里佩奇` / `特朗普` | DONE / FOCUSED FRONTEND SAFETY REFACTOR | `displayRedaction.ts` 集中提供结构化/文本/JSON/copy-export 显示层脱敏；8 个消费方已接入共享工具；validator 锁住共享工具契约和消费方 import/use；9 个 focused frontend smokes PASS。 | 下一步 P9：继续治理剩余 raw display 面或进入大厂级 UI 信息密度重构；P10 raw 查看/下载另开后端授权与审计专项 |
| P9 IssueDecomposition Raw Result And Markdown Redaction Guard | `扎克伯格` / `奥特曼` / `拉里佩奇` / `特朗普` | DONE / FOCUSED FRONTEND SAFETY GATE | `IssueDecomposition.tsx` 新增 raw result / Markdown display redaction；Issue smoke 注入 outputJson 与 Markdown raw secrets 并输出 `rawResultSafety` / `markdownExportSafety` marker；validator 锁住 helper、预览 region、copy/export sanitize 和 marker。 | 下一步 P9：抽共享 display redaction 工具，或继续治理剩余 raw display 面 |
| P9 ScanTaskDetail Report Evidence code_chunks Preview Redaction Guard | `扎克伯格` / `奥特曼` / `拉里佩奇` / `特朗普` | DONE / FOCUSED FRONTEND SAFETY GATE | `ScanTaskDetail.tsx` 新增 code chunk preview display redaction；report evidence drawer smoke 注入 raw code chunk secret sentinel 并输出 `codeChunkPreviewRedaction` marker；validator 禁止 raw `contentPreview/content` 直出；验证通过后清理 `web-console/test-results/`。 | 下一步 P9：继续治理剩余 raw display 面，或回到 P6 source-location / code_chunks 引用质量 |
| P9 DiffViewer Patch Diff Redaction Guard | `FE-Pixel` / `Sec-Sentinel` / `QA-Orion` / `Lead-Codex` | DONE / FOCUSED FRONTEND SAFETY GATE | `DiffViewer.tsx` 新增 display redaction helper；PATCH_READY smoke 注入 raw diff sentinel 并输出 `patchDiffSafety` marker；validator 禁止 raw `{line}` 展示；验证通过后清理 `web-console/test-results/`。 | 下一步 P9：治理 IssueDecomposition raw result/export 或 ScanTaskDetail code chunk/raw artifact display |
| P9 AgentToolCall Secret Redaction Guard | `FE-Pixel` / `Sec-Sentinel` / `QA-Orion` / `Lead-Codex` | DONE / FOCUSED FRONTEND SAFETY GATE | `AgentToolCall.tsx` 统一 redaction helper；closure rail smoke 注入 raw sentinel，断言 body/AgentToolCall 不泄漏，并输出 `agentToolCallRedaction` marker proof；validator 禁止 `JSON.stringify(args)` 和 raw `resultPreview` pre；本轮验证后已清理 `web-console/test-results/`。 | 下一步 P9：优先治理 DiffViewer 或 IssueDecomposition raw display |
| P6 Claim Citation Noise Boundary | `Product-Luna` / `AI-Vector` / `QA-Orion` / `Lead-Codex` | DONE / FOCUSED BACKEND CONTRACT HARDENING | Franklin the 2nd `ACCEPT`：只有正文自然语言 claim 后的 `[C#]` 算可审计引用，代码块/日志/堆栈/格式示例/inline literal 中的 marker 不放行 AutoRepair；Jason the 2nd `ACCEPT`：补 inline code、异常首行、Traceback、level=ERROR/JSON log 过滤；Confucius the 2nd `PARTIAL_ACCEPT`：采纳负向噪声不 READY、正向正文引用仍 READY、无效噪声不 BLOCKED 的核心矩阵。实现：`auditableAnswerText` 统一供 `citedLabels` 和 `answerClaims` 使用；新增 fake citation negative test 和 prose citation positive guard。验证：`CodeQaControllerTest` PASS；`CodeQaControllerTest,AutoRepairServiceTest` PASS。 | 下一步 P6：吸收到真实 public repo focused evidence，或继续 source-location/report citation quality |
| P6 Report Evidence Line Mismatch Review Boundary | `Product-Luna` / `AI-Vector` / `QA-Orion` / `Lead-Codex` | DONE / FOCUSED BACKEND CONTRACT HARDENING | Linnaeus the 2nd `ACCEPT`：同文件但行号未覆盖应保留 `REPORT_FILE_ANCHOR` + REVIEW，不新增状态，不放行 AutoRepair；Parfit the 2nd `PARTIAL_ACCEPT`：发现 `primaryChunkKeys` 会把 first same-file chunk 误升 PRIMARY，Lead 采纳禁止 PRIMARY，未采纳改为 `NONE`；Faraday the 2nd `ACCEPT`：要求断言 contextRole、primaryEvidenceCount、coverageScope、claim roleDistribution 和 AutoRepair gate。实现：`primaryChunkKeys` 在 parseable line mismatch 下返回空 PRIMARY；新增 `codeQa_shouldKeepLineMismatchedReportEvidenceAsContextOnlyFileAnchor`；AutoRepair file-anchor review test 加 `sourceEvidenceLineNumber`。验证：`CodeQaControllerTest` PASS；P6 backend extended set PASS；AutoRepair focused set PASS；scoped diff check PASS。 | 下一步 P6：真实 public repo focused evidence 吸收，或 claim citation parser 假 citation 防误判 |
| P6 Report Evidence Full Source URL Normalization | `Product-Luna` / `AI-Vector` / `QA-Orion` / `Lead-Codex` | DONE / FOCUSED BACKEND CONTRACT HARDENING | Banach the 2nd `ACCEPT`：P6 已进入增强阶段，source-location 应保持 focused 边界，不刷新 full authority；Curie the 2nd `ACCEPT`：完整 source URL evidenceRef 在 parser、candidate recall、Controller match 三层不一致，本轮补齐；Euler the 2nd `ACCEPT`：用 parser/service/controller/retrieval focused tests 并扩展 CodeChunkController/FileFilter。实现：`CodeLocationHintParser.normalizeEvidenceFilePathHint` 剥离 host/port/query/hash/line-column；`CodeQaController.normalizeEvidencePath` 同步完整 source URL 归一化；`CodeChunkService.addEvidenceFilePathCondition` 增加 suffix path recall；新增 full Vite URL line-anchor、suffix-before-basename、unique short suffix 正例。验证：`CodeQaControllerTest` PASS；P6 focused backend set PASS；QA extended backend set PASS。 | 下一步 P6：evidenceRef 行号不匹配时的弱匹配/REVIEW 语义，或真实 public repo focused evidence 吸收 |
| P9 ExecutionTasks Three-Viewport Detail Readability Guard | `Product-Luna` / `FE-Pixel` / `QA-Orion` / `Lead-Codex` | DONE / FOCUSED EXECUTION TASKS READABILITY GATE | Laplace the 2nd `ACCEPT`：ExecutionTasks 是异步流水线总控页，快速切换任务时存在标题与旧 steps/logs 短暂错配风险，必须 fail-safe；Ptolemy the 2nd `ACCEPT`：smoke 缺 `390x844`，当前步骤、health/meta/evidence 和 timeline/log 长文本存在 `nowrap + ellipsis` 或缺断词保护；Boyle the 2nd `ACCEPT`：要求 table scroller contained、detail card contained、critical text wrapping、runtime/no-overflow marker。实现：`ExecutionTasks.tsx` 增加 `detailRequestSeqRef`、切换时清空旧 detail、只渲染 `selectedDetail`；`app.css` 补 ExecutionTasks table/detail max-width、`.ant-table-content` overflow owner、detail header/title/tag/meta/evidence/health/timeline/log wrapping；`execution-tasks-detail-selection-smoke` 扩展到三视口并新增 table scroller、detail readability、旧日志不混入断言；`validate-frontend-ui.mjs` 锁住 detail stale guard、CSS、helper 和 marker 合同。验证：`make frontend-ui-check` PASS；`npm --prefix web-console run build` PASS；`CI=true make execution-tasks-detail-selection-ui-smoke` PASS；`CI=true make p9-main-path-recoverable-error-states-batch3-ui-smoke` PASS。 | 下一步 P9：继续 AutoRepairs/AgentTasks 等高密度页的 390/readability guard，或回到 P6 code_chunks/QA citation 质量 |
| P9 Artifacts Three-Viewport Drawer Readability Guard | `Product-Luna` / `FE-Pixel` / `QA-Orion` / `Lead-Codex` | DONE / FOCUSED ARTIFACTS DRAWER READABILITY GATE | Hume the 2nd `ACCEPT`：Artifacts 是报告、图谱、补丁和 Agent 产物复盘入口，下一步应补三视口 Drawer readability guard；Feynman the 2nd `ACCEPT`：Drawer header/actions、Descriptions、full SHA、artifact type、content type、preview/raw JSON 和 table scroller 是 390/320 下主要风险；Galileo the 2nd `ACCEPT`：smoke 必须补 `390x844`、drawer open-state overflow、table scroller containment、preview/raw JSON expandability 和 runtime/no-overflow marker。实现：`app.css` 补 Artifacts table max-width/internal scroller、Drawer wrapper/header/extra/Descriptions/code/Tag wrapping、360px chip/status normal wrapping；`artifacts-detail-selection-smoke` 扩展到三视口并新增 table scroller、drawer readability、preview/raw JSON 断言；`validate-frontend-ui.mjs` 锁住 CSS、helper 和 marker 合同。验证：`make frontend-ui-check` PASS；`CI=true make artifacts-detail-selection-ui-smoke` PASS；`CI=true make p9-main-path-recoverable-error-states-batch3-ui-smoke` PASS；`npm --prefix web-console run build` PASS。 | 下一步 P9：继续 ExecutionTasks/AutoRepairs/AgentTasks 等高密度页的 390/readability guard，或回到 P6 code_chunks/QA citation 质量 |
| P9 PR Reviews Three-Viewport Detail Readability Guard | `Product-Luna` / `FE-Pixel` / `QA-Orion` / `Lead-Codex` | DONE / FOCUSED PR REVIEWS READABILITY GATE | Arendt the 2nd `ACCEPT`：本轮做 PR Reviews 三视口可读性防回归，不扩展 PR provider 或后端能力；Anscombe the 2nd `ACCEPT`：详情标题、Tag、评论头、Descriptions、风险/建议/下一步文本和 table scroller 必须具备换行/内部滚动合同；Maxwell the 2nd `ACCEPT`：smoke 必须覆盖 `390x844`、detail card containment、critical text wrapping、table scroller ownership、`layoutDensity` 和 `mobileReadability` marker。实现：`app.css` 补 PR table/detail max-width、`.ant-table-content` overflow owner、detail card title/extra/chip/comment/descriptions/decision/next action wrapping；`pr-reviews-detail-selection-smoke` 扩展到三视口并新增 `expectPrTableScrollerContained`、`assertPrDetailReadability`；`validate-frontend-ui.mjs` 锁住 CSS、helper 和 marker 合同。验证：`make frontend-ui-check` PASS；`CI=true make pr-reviews-detail-selection-ui-smoke` PASS；`CI=true make audit-logs-detail-selection-ui-smoke` PASS；`npm --prefix web-console run build` PASS。 | 下一步 P9：继续 Artifacts/ExecutionTasks/AutoRepairs 等高密度页的 390/readability guard，或回到 P6 code_chunks/QA citation 质量 |
| P9 CI Diagnostics Source Deep-Link And AutoRepair Handoff | `Product-Luna` / `FE-Pixel` / `QA-Orion` / `Lead-Codex` | DONE / FOCUSED CI TO AUTOREPAIR HANDOFF GATE | Beauvoir `ACCEPT`：`ExecutionTasks` 和 `Artifacts` 已生成 `/ci-diagnostics?projectId=...&diagnosticId=...`，但 CI 页面只消费 `projectId`，来源只能落到列表页；同时 CI 的 AutoRepair URL 缺 `projectId`，多项目场景会丢上下文。Mill the 2nd `PARTIAL`：建议后续迁移 PR Reviews 三视口可读性模式，本轮作为下一候选保留。McClintock the 2nd `PARTIAL`：指出 detail-selection smoke 仍需系统性补 390/readability，本轮先采纳 CI 产品闭环。实现：`CiDiagnosticsPage.tsx` 解析并传递 `diagnosticId`；`CiDiagnostics.tsx` 支持列表内自动选中、列表外 `ciApi.detail` 回填、跨项目 fail closed 和 AutoRepair URL `projectId`；`ci-diagnostics-detail-selection-smoke` 证明 listed/deatched deep-link、detail API hydration、AutoRepair query 绑定、Enter/Space 和 reanalyze isolation；`validate-frontend-ui.mjs` 锁住合同。验证：`make frontend-ui-check` PASS；`CI=true make ci-diagnostics-detail-selection-ui-smoke` PASS；`npm --prefix web-console run build` PASS；`CI=true make app-shell-ui-smoke` PASS。 | 下一步 P9：把 390/readability guard 迁移到 PR Reviews 或 Artifacts；或继续 P6/P9 报告/QA/AutoRepair 闭环质量 |
| P9 AuditLogs Exact Deep-Link And Workbench Readability | `Product-Luna` / `FE-Pixel` / `QA-Orion` / `Lead-Codex` | DONE / FOCUSED AUDIT WORKBENCH READABILITY GATE | Huygens `ACCEPT`：通用审计深链只按 `resourceId` 自动打开会误开同资源其他事件，必须按 `resourceType/resourceId/action/status` 精确匹配并 fail closed；Averroes `ACCEPT`：390/320 下 workbench 内部被 Ant Table `scroll.x` 撑宽，drawer 长字段需换行，tabs/filter actions 需移动端保护；Copernicus `ACCEPT`：补 390 viewport、drawer open-state、table scroller contained、candidate receipt text not clipped 和 marker proof。实现：`AuditLogs.tsx` 新增 `matchesInitialAuditFilters`、deep-link miss notice 和 collapsible raw JSON；`app.css` 约束 AuditLogs table overflow、移动端 tabs/filter actions、drawer metadata wrap、JSON summary focus 和 390 summary two-column；`audit-logs-detail-selection-smoke` 新增 exact deep-link/miss tests、390 viewport、drawer density 和 table scroller assertions；`validate-frontend-ui.mjs` 锁住合同。验证：`make frontend-ui-check` PASS；`CI=true make audit-logs-detail-selection-ui-smoke` PASS；`npm --prefix web-console run build` PASS；`CI=true make app-shell-ui-smoke` PASS。 | 下一步继续 P9：其他详情/审计密集页面的信息层级和移动端可读性；或回到 P6 code_chunks/QA citation quality |
| P9 Project QA Answer-First Evidence Dedup | `Product-Luna` / `FE-Pixel` / `QA-Orion` / `Lead-Codex` | DONE / FOCUSED PROJECT QA READABILITY GATE | Herschel `ACCEPT`：最该修的是回答正文被审计面板淹没、同一 C1 证据被回答引用和 retrieved chunk 双卡重复展示；Poincare `ACCEPT`：补移动端 assistant bubble 100%、长 tag 换行、`跨文件复核路径` 保守文案；Popper `ACCEPT`：验收矩阵为 `frontend-ui-check`、Project QA recoverable smoke、build、app-shell smoke 和 scoped diff check。实现：`ProjectDetail.tsx` 回答正文前置到状态标签后；审计/来源/门禁/下一步面板后置；`supplementalQaChunks` 去重已引用 chunk；普通 evidence block 改为 `补充 code_chunks N 条`；搜索结果字段中文化；`project-qa-recoverable-smoke` 增加 390px、answer-first/de-dupe/text clipping/localized labels marker；`app.css` 补 mobile assistant bubble 100%、长 tag wrap 和去重说明样式；`validate-frontend-ui.mjs` 锁住合同。验证：`make frontend-ui-check` PASS；`CI=true npm --prefix web-console run smoke:project-qa-recoverable` PASS；`npm --prefix web-console run build` PASS；`CI=true make app-shell-ui-smoke` PASS。 | 下一步继续 P9：Project QA 深层审计面板折叠/密度治理，或继续 P6：source-location/code_chunks/QA citation 质量 |
| P9 App Shell Three-Viewport Readability Guard | `Product-Luna` / `FE-Pixel` / `QA-Orion` / `Lead-Codex` | DONE / FOCUSED UI READABILITY GATE | Ohm `ACCEPT`：本轮聚焦“主链路首屏稳定化 + 按钮可读性收敛”，避免全站重设计；Hume `ACCEPT`：补 `/projects/:id` smoke、390px viewport、移动端 action stack、360px 按钮高度自适应和 disabled button 对比度；Maxwell `ACCEPT`：要求 `frontend-ui-check`、`app-shell-ui-smoke` 和 build 作为验收。实现：`app.css` 修复 topbar line-height/padding、Project cockpit disabled 按钮文字、`.sl-analysis-readiness-actions` mobile stack、`.sl-action-button` narrow wrapping；`app-shell-ui-smoke.spec.ts` 新增 390px viewport、ProjectDetail mock route 和主按钮 label scroll/client 裁切断言；`validate-frontend-ui.mjs` 锁住上述 UI 合同。验证：`make frontend-ui-check` PASS；`make app-shell-ui-smoke` PASS，`APP_SHELL_UI_SMOKE_OK` 覆盖 `/projects/1` 与 `1440x900/390x844/320x740`；`npm --prefix web-console run build` PASS。 | 下一步继续 P9 深层页面 UI：ProjectDetail 证据卡片密度、表格/详情页可读性、统一大厂级视觉系统；或回到 P6 检索/引用质量 |
| P6 Code QA Ambiguous Short Evidence Path Fail-Closed | `Product-Luna` / `BE-Forge` / `FE-Pixel` / `QA-Orion` / `Lead-Codex` | DONE / FOCUSED SOURCE BOUNDARY HARDENING | Mill `ACCEPT`：basename/短 suffix 多 root 命中必须 fail-closed，返回 `NONE` 而不是 `REPORT_FILE_ANCHOR`；Franklin `PARTIAL`：建议覆盖 basename multi-root、short suffix multi-root 和 unique suffix positive，本轮采纳前两项并依赖既有 unique suffix 正例防回归。实现：`CodeQaController.sourceEvidenceMatchType` 和 `primaryChunkKeys` 增加 `hasAmbiguousNonExactEvidencePath`；歧义短路径不产生 PRIMARY；`ProjectDetail` 来源文件匹配必须同时满足后端 `sourceEvidenceMatched`。验证：`mvn -q -f backend-spring/pom.xml -Dtest=CodeQaControllerTest test` PASS；`mvn -q -f backend-spring/pom.xml -Dtest=CodeLocationHintParserTest,CodeChunkServiceTest,CodeChunkControllerTest,CodeQaRetrievalServiceTest,CodeQaControllerTest test` PASS；`node scripts/validate-frontend-ui.mjs` PASS；`npm --prefix web-console run build` PASS；`bash -n ...` PASS；`./scripts/security-regression-check.sh --suite static` PASS；current authority verifier PASS；scoped diff check PASS。 | 下一步继续 P6：unique suffix live/public repo 观测、root-aware exact path 证据包，或推进 P9 ProjectDetail 大厂级证据卡片 UI |
| P6 Package-aware Method Anchor Disambiguation | `Product-Luna` / `AI-Vector` / `BE-Forge` / `QA-Orion` / `Lead-Codex` | DONE / FOCUSED BACKEND RETRIEVAL QUALITY | Newton `ACCEPT`：优先做 root-aware 来源定位消歧，避免同名文件污染 QA/AutoRepair 目标文件；Noether `ACCEPT`：优先做 FQCN/Java stack trace 包路径消歧，不继续扩 semantic pool；Hypatia `ACCEPT`：用 parser/service/retrieval/controller focused tests、static suite 和 current authority verifier，不跑 full release。实现：`QUALIFIED_METHOD_HINT_PATTERN` 保留完整限定类名；`methodAnchorFileHints` 生成 package path suffix variants；`CodeChunkRanker` 对 package-aware suffix 加权；新增同名 `AuthService.java` 包路径消歧测试。验证：`mvn -q -f backend-spring/pom.xml -Dtest=CodeLocationHintParserTest,CodeChunkServiceTest,CodeChunkControllerTest,CodeQaRetrievalServiceTest,CodeQaControllerTest test` PASS；`bash -n ...` PASS；`./scripts/security-regression-check.sh --suite static` PASS；`./scripts/verify-release-evidence.sh release-evidence/release-current-schema-20260702-230650` PASS；`node scripts/validate-frontend-ui.mjs` PASS。 | 下一步可补 QA Controller basename/短 suffix 多 root fail-closed，或运行真实 public repo focused smoke 吸收 package-aware 行为；不替换 current full authority |
| P6/P11 Source File Match Focused Release Evidence Absorption | `Ops-Harbor` / `QA-Gate` / `Lead-Codex` | DONE / FOCUSED PACKAGE VERIFIED / FULL AUTHORITY UNCHANGED | Singer `ACCEPT`：用 `backend-jar` stable runtime，local focused package 只跑 public repo UI smoke；Socrates `ACCEPT`：current full authority 未刷新时不可全局 required。Package `release-evidence/p6-source-file-match-live-20260703-0841`：summary `0/0/21`，`public-repo-smoke=OK`，`sourceFileMatchRelease.status=OK`、`releaseState=READY`、`pathMatchType=PATH_SUFFIX`、`requiredEvidenceCovered=true`、`primaryClaimBound=true`、`readyForAutoRepair=true`。Verifier PASS；`release-verifier-public-repo-ui-marker` PASS ~227s；current full authority verifier PASS。 | 下一步若要升级 required evidence，需 full authority refresh 或明确新 schema/profile 边界；否则继续 P6 source-location / QA retrieval 或 P9 深层 UI |
| P6/P9 Source File Match Live Public Repo UI Evidence | `Ops-Harbor` / `QA-Orion` / `Lead-Codex` | DONE / LIVE MARKER COLLECTED / SUPERSEDED BY FOCUSED PACKAGE | Galileo `ACCEPT`：跑 focused live smoke，不做 full refresh；Hegel `ACCEPT`：先拿 live marker，再升级 required；Wegener `ACCEPT`：`reportQuality` 是合理后端合同，Docker `8081` 缺字段优先视为 stale runtime。Latest source backend `8080` live smoke PASS：`PUBLIC_REPO_UI_SMOKE_OK.sourceFileMatchRelease.status=OK`、`releaseState=READY`、`pathMatchType=PATH_SUFFIX`、`requiredEvidenceCovered=true`、`primaryClaimBound=true`、`readyForAutoRepair=true`；`PUBLIC_REPO_SMOKE_OK` artifact quality 7/7 OK，`reportQuality.confidence=74`。 | 已由上方 focused release evidence package 吸收；保留为 standalone live marker 历史记录 |
| P6/P9 Project QA Source File Match Release Marker | `Product-Luna` / `QA-Orion` / `Lead-Codex` | DONE / CONTRACT HARDENING | Product-Luna/Laplace `ACCEPT`：先补 marker/verifier/security proof，再等后端可用后跑 live；QA-Orion/Godel `ACCEPT`：新增独立 `sourceFileMatchRelease` proof，只允许布尔/枚举，不存 raw prompt、raw answer、URL、源码内容或 token。已完成 `SourceFileMatchReleaseProof`、`qaFromEvidence.sourceFileMatchRelease` marker、`assertSourceFileMatchRelease`、source-file match forged cases 和 frontend validator 合同。验证：bash syntax PASS；`node scripts/validate-frontend-ui.mjs` PASS；`npm --prefix web-console run build` PASS；current authority verifier PASS；public repo UI Playwright `--list` PASS；`./scripts/security-regression-check.sh --suite release-verifier-public-repo-ui-marker` PASS ~246s。 | Standalone live marker 已由上方 workstream 收集；下一 checkpoint 是 release evidence package 吸收后升级 required evidence |
| P6/P9 Project QA Source File Match Release Checklist | `Product-Luna` / `FE-Pixel` / `QA-Orion` / `Lead-Codex` | DONE / FOCUSED UI AUDITABILITY | Product-Luna/Sagan `ACCEPT`：用户需要直接判断证据文件怎么匹配；FE-Pixel/Carver `ACCEPT`：补 `修复候选放行条件`，解释按钮隐藏/阻断原因；QA-Orion/Darwin `ACCEPT`：用 focused smoke + public repo UI config 编译验证。已完成 `ProjectDetail.tsx` 来源文件匹配派生逻辑、`.sl-qa-source-match-release-*` 响应式样式、report evidence / AutoRepair candidate / public repo UI 断言和 validator 合同。验证：`node scripts/validate-frontend-ui.mjs` PASS；`npm --prefix web-console run build` PASS；`CI=true npm --prefix web-console run smoke:report-evidence-drawer` PASS；`CI=true npm --prefix web-console run smoke:report-evidence-qa-citation` PASS；`CI=true npm --prefix web-console run smoke:project-qa-autorepair-candidate` PASS；`CI=true npm --prefix web-console run smoke:project-qa-low-confidence` PASS；`CI=true npm --prefix web-console run smoke:project-qa-recoverable` PASS；public repo UI Playwright `--list` PASS。 | 继续 P6：用真实 public repo live evidence 吸收该 UI 合同；继续 P9：ProjectDetail 深层 UI 信息密度和证据链可读性 |
| P9 Project QA Trust Surface Chinese Productization | `Product-Luna` / `FE-Pixel` / `QA-Orion` / `Lead-Codex` | DONE / FOCUSED UI PRODUCTIZATION | Product-Luna/Kepler `ACCEPT`：本轮只做可信度区域中文可读化，不做全站 i18n，不改 QA 判定；FE-Pixel/James `ACCEPT`：渲染文案、测试和 validator 必须同步，底层状态通过 display mapper 保留；QA-Orion/Leibniz `ACCEPT`：按修改面跑 focused smoke，marker schema 不中文化。已完成 `ProjectDetail.tsx` 中文主文案、display mapper、report evidence/project QA smoke 和 validator 更新。验证：`node scripts/validate-frontend-ui.mjs` PASS；`npm --prefix web-console run build` PASS；`CI=true npm --prefix web-console run smoke:report-evidence-qa-citation` PASS；`CI=true npm --prefix web-console run smoke:report-evidence-drawer` PASS；`CI=true npm --prefix web-console run smoke:project-qa-autorepair-candidate` PASS；`CI=true npm --prefix web-console run smoke:project-qa-low-confidence` PASS。 | 后续继续 P9 Project QA 搜索结果/证据卡片/移动端信息密度，或 P6 真实 public repo source location/citation quality |
| P6/P9 Project QA Source Location Confidence Summary | `Product-Luna` / `FE-Pixel` / `QA-Orion` / `Lead-Codex` | DONE / FOCUSED UI TRUST SIGNAL | Product-Luna/Linnaeus `ACCEPT`：底层 evidence/citation/claim gate 已强，缺口是用户要自行拼接可信度判断；FE-Pixel/Avicenna `ACCEPT`：最安全插入点是 `QaAnswerSourceEvidenceReceiptPanel`，新增小型 location confidence panel 与响应式 class；QA-Orion/Nash `PARTIAL`：建议后续补更多同名文件后端负例，本轮用 smoke/validator 覆盖 UI 合同。已新增 `qaSourceLocationConfidence`、`QaSourceLocationConfidencePanel`、`.sl-qa-source-location-confidence-*`、mock/public smoke marker 字段。验证：`node scripts/validate-frontend-ui.mjs` PASS；`npm --prefix web-console run build` PASS；`CI=true npm --prefix web-console run smoke:report-evidence-drawer` PASS；`CI=true npm --prefix web-console run smoke:report-evidence-qa-citation` PASS；scoped `git diff --check` PASS。 | 后续可运行真实 public repo UI E2E 吸收 `sourceLocationConfidence` marker，或继续 P6 root-aware/package-aware disambiguation 与 P9 技术标签中文化 |
| P6 Source URL Path Suffix Candidate Priority | `Product-Luna` / `Arch-Atlas` / `QA-Orion` / `Lead-Codex` | DONE / FOCUSED RETRIEVAL HARDENING | Product-Luna/Cicero `ACCEPT`：同名文件会影响报告引用和 AutoRepair 目标文件；Arch-Atlas/Mendel `PARTIAL`：parser 解析、service 召回、ranker 打分，不改 DB/API/embedding/release schema；QA-Orion/Carson `PARTIAL`：补 parser source URL 清洗、同名 `ProjectDetail.tsx` service decoy、QA retrieval decoy 和 static gate。已新增 `pathSuffixHints`、`normalizePathSuffixHint`、`pathSuffixHintScore`、`listPathSuffixHintCandidates`；显式 `filePath:` evidence anchor 跳过重复 path suffix query。验证：`CodeLocationHintParserTest,CodeChunkServiceTest,CodeQaRetrievalServiceTest` PASS；`CodeLocationHintParserTest,CodeChunkServiceTest,CodeChunkControllerTest,CodeQaRetrievalServiceTest,CodeQaControllerTest` PASS；bash syntax PASS；frontend validator PASS；security static PASS ~12s。 | 继续 P6 root-aware/package-aware disambiguation 前，先用真实 public repo evidence 判断必要性；同时推进 P6/P9 报告可信度摘要 |
| P11 Release Verifier Forgery Second-Level Matrix Split | `Ops-Harbor` / `QA-Gate` / `Lead-Codex` | DONE / SECOND-LEVEL MATRIX IMPLEMENTED | Ops-Harbor/Faraday 建议将原 `release-verifier-forgery` 拆成 public repo marker、public repo UI marker、AutoRepair/PATCH_READY、Dashboard、Report Evidence、Scan Governance 六组；QA-Gate/Archimedes `PARTIAL` 要求旧聚合 suite 保留且 selector/CI/Makefile/static self-check/文档全部覆盖。已实现六个二级 suite、Makefile targets、CI matrix rows 和 static self-check；`release-verifier-forgery` 继续聚合六组。验证：bash syntax PASS；unknown suite fail-closed PASS；`static` PASS ~12s；`release-verifier-public-repo-marker` PASS ~73s；`release-verifier-public-repo-ui-marker` PASS ~211s；`release-verifier-autorepair-ui-marker` PASS ~37s；`release-verifier-dashboard-ui-marker` PASS ~30s；`release-verifier-report-evidence-marker` PASS ~87s；`release-verifier-scan-governance-marker` PASS ~36s。 | 恢复 P6 code understanding / cross-file retrieval / report citation quality；同时保留 P9 UI 深层治理和下一次 full release refresh |
| P11 Security Regression Suite Matrix Split | `Ops-Harbor` / `QA-Gate` / `Lead-Codex` | DONE / SUITE MATRIX IMPLEMENTED | Ops-Harbor/Bohr 建议拆 `static`、`llm-provider`、`release-evidence-profile`、`release-verifier-forgery`、`release-verifier-integrity`；QA-Gate/Sartre `PARTIAL` 要求 full 不降级、未知 suite fail-closed、CI 不用短门禁替代全覆盖。已新增 `SOURCELENS_SECURITY_REGRESSION_SUITE`、`--suite/--gate`、动态函数 suite filter、Makefile suite targets、CI security matrix 和自校验静态断言。验证：`bash -n` PASS；unknown suite fail-closed PASS；`static` PASS ~12s；`llm-provider` PASS ~26s；`release-evidence-profile` PASS ~52s；`release-verifier-forgery` PASS ~510s；`release-verifier-integrity` PASS ~153s；`integration-drill` PASS ~12s。 | 继续 P11 二级拆分 `release-verifier-forgery`：public repo marker、public repo UI marker、report evidence drawer marker、scan governance timeline marker；随后继续 P6 code understanding / cross-file retrieval / report citation quality |
| P6 CodeLocationHintParser Pure Parser Extraction | `Product-Luna` / `Arch-Atlas` / `QA-Orion` / `Lead-Codex` | DONE / FOCUSED REFACTOR | Product-Luna/Ramanujan、Arch-Atlas/Hubble、QA-Orion/Mencius 均为 `PARTIAL` 条件接受：只做行为保持型抽取，不改 ranker 权重、召回顺序、API、DB、前端或 release schema。新增 `CodeLocationHintParser` 和 `CodeLocationHintParserTest`；`CodeChunkRanker` 委托 parser 处理 line/method/function-file/stack/source URL hints，保留 `methodAnchorFileHints` facade；`CodeChunkService` 将 `filePath:` evidence anchor normalize 委托 parser；`security-regression-check.sh` 静态断言改指向 parser。验证：focused backend tests PASS、bash syntax PASS、validator PASS、current full authority verifier PASS、scoped diff check PASS；完整 security regression 超过 6 分钟无输出后中断，不能记为 PASS。 | 后续单独让 Ops-Harbor/QA-Gate 调查完整 security regression 长时间无输出；也可运行真实 public repo smoke 吸收 v3 marker，或继续同名文件/path candidate 优先级增强 |
| P6 Source Location Probe v3 Query-shape Proof Hardening | `Product-Luna` / `QA-Orion` / `BE-Forge` / `Lead-Codex` | DONE / FOCUSED CONTRACT HARDENING | Product-Luna/Rawls 建议小范围推进；QA-Orion/Fermat 指出 standalone Vite source URL 排名、controller pass-through 和 marker 防伪缺口；BE-Forge/Helmholtz 确认不改 DB/API。已新增 `CodeChunkServiceTest` Vite 端口诱饵反例、`CodeChunkControllerTest` source URL pass-through 测试、`sourceLocationProbeContractVersion=3` query-shape proof booleans、v2/v3 兼容 verifier、security forged cases 和 static gate。验证：focused backend tests PASS、bash syntax PASS、validator PASS、current full authority verifier PASS、targeted v3 forged marker verification PASS；全量 security regression 本轮未完成。 | 下一步可抽 `CodeLocationHintParser` 纯函数，或运行真实 public repo smoke 吸收 v3 marker；release 前必须重新跑完整 `security-regression-check.sh` |
| P6/P9 Project QA Evidence Combination Live Public Repo Evidence Absorption | `Product-Luna` / `QA-Orion` / `Ops-Harbor` / `AI-Vector` / `Lead-Codex` | DONE / FOCUSED LIVE EVIDENCE ABSORBED | Product-Luna/Aquinas 要求吸收真实 live evidence 且不扩大实现范围；Volta 建议稳定 jar backend 上运行 focused release evidence 并单独 verifier；Hilbert 要求 marker 来自可见 UI/result set，不做 provider/LLM overclaim。Standalone live smoke PASS：`projectId=318/repositoryId=279/scanTaskId=235`；focused package `release-evidence/p6-project-qa-evidence-combination-live-20260703-034901` PASS：`projectId=321/repositoryId=282/scanTaskId=238`，`projectQaEvidenceCombinationSummary.status=OK`、`visibleCardCount=8`、`minPrimaryCount=8`、`minUniqueFileCount=6`、`minNextQuestionCount=3`、`derivedFromVisibleResults=true`、`resultSetOnly=true`、`providerQualityClaim=false`、`llmFactClaim=false`、`noHorizontalOverflow=true`。修正 `public-repo-ui-smoke.spec.ts`，从可见组合摘要/结果卡片读取 marker，不再要求 QA top chunk 与 UI 搜索结果 exact 一致；失败包 `...033908` 和 `...034248` 仅作诊断。验证：validator PASS、Playwright `--list` PASS、focused package verifier PASS、current full authority verifier PASS、scoped diff check PASS。 | 继续 P6：检索质量、弱关键词/语义池和引用质量；或继续 P9：ProjectDetail 证据卡片、QA 结果区和移动端信息密度。下一次完整 release refresh 可自然包含该 focused live evidence，但不得自动替换 current full authority |
| P6/P9 Project QA Evidence Combination Live Public Repo UI Contract | `Product-Luna` / `AI-Vector` / `QA-Orion` / `Lead-Codex` | DONE / FOCUSED LIVE UI MARKER CONTRACT | Product-Luna/Heisenberg 建议把证据组合摘要吸收到真实 public repo UI marker，保持 backend/API/DB/rerank/AutoRepair/LLM 不变；AI-Vector/Jason 要求不夸大 source label、embedding 或单文件 evidence 语义；QA-Orion/Nietzsche 要求 verifier/security regression 防伪。`public-repo-ui-smoke.spec.ts` 新增 `verifyEvidenceCombinationSummary`；`PUBLIC_REPO_UI_SMOKE_OK.projectQaEvidenceCombinationSummary` 顶层 marker 输出 scan-bound、visible、resultCount、visibleCardCount、source labels、primary count、unique files、next questions、derived/resultSetOnly、providerQualityClaim=false、llmFactClaim=false、noHorizontalOverflow；`verify-release-evidence.sh` 对 optional marker 出现即强校验；`security-regression-check.sh` 覆盖 present-but-forged 负例；`validate-frontend-ui.mjs` 锁住 smoke/verifier/security 合同。验证：bash syntax PASS、validator PASS、frontend build PASS、Playwright `--list` PASS、security regression PASS、当前 full authority verifier PASS、scoped diff check PASS。 | 下一步运行真实 public repo UI E2E / release profile 吸收该 marker，或继续 P6 检索质量与 P9 ProjectDetail 深层 UI |
| P6/P9 Project QA Evidence Combination Summary | `Product-Luna` / `AI-Vector` / `QA-Orion` / `Lead-Codex` | DONE / FOCUSED QA EVIDENCE COMBINATION GATE | Product-Luna/Curie 建议做 deterministic front-end summary，不改后端/API/DB/AutoRepair/LLM；AI-Vector/Epicurus 确认现有 `CodeChunkSearchItem` 字段足够派生组合摘要，并提醒 `sourceLabel` 只代表当前响应、`hasEmbedding` 不等于事实验证；QA-Orion/Anscombe 建议保持 focused smoke 回归。`ProjectDetail.tsx` 新增 `buildChunkEvidenceCombination` 和 `ChunkEvidenceCombinationCard`；`app.css` 新增 `.sl-qa-evidence-combination-*`；`project-qa-recoverable-smoke.spec.ts` 新增跨文件 `ADJACENT_CONTEXT` fixture 和 marker；`validate-frontend-ui.mjs` 锁住 helper、UI、CSS 与 marker。验证：validator PASS、frontend build PASS、`smoke:project-qa-recoverable` PASS、`smoke:project-qa-low-confidence` PASS。 | 下一步继续 P6/P9：把证据组合摘要从 mocked recoverable gate 扩展到真实 public repo UI evidence，或继续 ProjectDetail 其他深层区域的信息密度与移动端可读性；下一次 full release refresh 吸收该 focused UI gate |
| P9 Scan Governance Timeline Action Landing | `Product-Luna` / `FE-Pixel` / `QA-Orion` / `QA-Gate` / `Lead-Codex` | DONE / FOCUSED ACTION LANDING GATE | Product-Luna/Boyle 要求把治理时间线从“链接目录”升级为可操作控制面板；FE-Pixel/Plato 指出目标页 query 消费和 AuditLogs scan 语义风险；QA-Orion/Ampere 给出最小 7 动作 landing 矩阵。FE worker Erdos 已启动但超时，未形成可采纳独立交付；Lead-Codex 接回实现并验证。QA-Gate/Lovelace 初审 PARTIAL，指出 AgentTasks action landing 暴露 raw `inputJson/outputJson`，修复后复审 PASS。`ScanTaskDetail.tsx` 将 derived artifact action 绑定到 `artifactId`；`AgentTasks.tsx` 默认隐藏 task raw input/output；`scan-governance-timeline-smoke.spec.ts` 点击真实时间线按钮，证明 AutoRepair/Artifact/Execution/AuditLogs/AgentTasks/Project QA/Tool calls 均落到正确记录或过滤上下文，并断言 raw prompt/answer 不可见；`validate-frontend-ui.mjs` 锁住 action landing helper、artifactId、raw hidden 和 marker。验证：validator PASS、frontend build PASS、`CI=true make scan-governance-timeline-ui-smoke` PASS、`CI=true make agent-tasks-detail-selection-ui-smoke` PASS、scoped diff check PASS。 | 下一步继续 P9 Project QA 搜索结果/证据卡片可读性，或进入 P6 code_chunks/QA 检索质量增强；下一次 full release refresh 吸收该 focused UI gate |
| P9 Project QA Report Evidence Source Bridge | `Product-Luna` / `FE-Pixel` / `QA-Orion` / `Lead-Codex` | DONE / FOCUSED QA SOURCE BRIDGE | Product-Luna/Boole 建议做 thin bridge，不改 backend/API/QA/AutoRepair 算法；FE-Pixel/Lorentz 确认 `ProjectDetail` 已消费 report evidence URL params，建议增加回跳报告、重新检索、复制引用和离开 QA tab 的 stale params cleanup；QA-Orion/Russell 建议扩展现有 `report-evidence-drawer-smoke`，marker 只记录 `filePath/lineNumber/category/source/title`，不记录 summary 或原始回答。FE-Pixel Worker/Dewey 完成 `ProjectDetail.tsx`、`app.css`、`report-evidence-drawer-smoke.spec.ts`、`validate-frontend-ui.mjs` 增量；`REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK.qaFromEvidence.evidenceRef` 证明 request/response/context 绑定和 title/line 字段可见，`mockedApiOnly=true`、`unhandledApiRequests=0`、`1440x900` / `320x740`。 | 下一步可继续 P9 deep-page UI：Scan governance timeline action landing，或进入 Project QA 搜索结果/证据卡片可读性 |
| P9 Report Evidence Handoff Summary | `Product-Luna` / `FE-Pixel` / `QA-Orion` / `QA-Gate` / `Lead-Codex` | DONE / FOCUSED DEEP-PAGE UI GATE | Product-Luna/Einstein 建议后续做 Project QA 来源桥；FE-Pixel/Goodall 建议本轮先做 ScanTaskDetail 证据抽屉交接包；QA-Orion/Pasteur 建议后续做治理时间线 action landing；Lead-Codex 采纳 Goodall 的低风险前端方案。FE-Pixel Worker/Raman 实现 `ReportEvidenceHandoffSummary`、`.sl-report-evidence-handoff-*` 样式、READY/GAP smoke 断言和静态门禁；QA-Gate/Kant 只读复核 PASS，确认本轮增量未直接改 QA payload、AutoRepair 请求、后端或 DB。`REPORT_EVIDENCE_DRAWER_SMOKE_OK` 证明 READY/GAP 双路径、`mockedApiOnly=true`、`unhandledApiRequests=0`、`1440x900` / `320x740`；`APP_SHELL_UI_SMOKE_OK` 仍 PASS。 | 下一步 P9 候选：Project QA 报告证据来源桥，或 Scan governance timeline action landing；下一次 full release refresh 吸收该 focused UI gate |
| P9 UI Foundation browser-grade readability gate | `Product-Luna` / `FE-Pixel` / `QA-Orion` / `Lead-Codex` | DONE / FOCUSED UI GATE HARDENED | Product-Luna/Gibbs 将 P9 P1 收敛为“基础可读性事故清零”；FE-Pixel/Kuhn 定位 topbar title line-height、IconActionButton variant 兜底和 StateBlock 长标题缺口；QA-Orion/Feynman 要求从 root color 升级到 label/icon/svg 与 scroll/client 裁切断言；FE-Pixel Worker/Planck 完成实现。修改 `IconActionButton.tsx`、`app.css`、`app-shell-ui-smoke.spec.ts`、`validate-frontend-ui.mjs`；`APP_SHELL_UI_SMOKE_OK.assertions` 新增 `topbar-title-scroll-size-within-box`、`topbar-desc-scroll-size-within-box`、`page-heading-scroll-size-within-box`、`primary-button-label-icon-svg-white`、`no-error-toast-or-notification`；`node scripts/validate-frontend-ui.mjs` PASS；`npm exec tsc -- -p tsconfig.json --noEmit` PASS；`npm --prefix web-console run build` PASS；`CI=true make app-shell-ui-smoke` PASS；scoped `git diff --check` PASS。 | 继续 P9 深层页面视觉密度/表格与详情布局；或回到 P6 报告/QA 可信度体验。下一次 full release refresh 吸收该 focused UI gate |
| P6 report evidence QA claim roleDistribution security regression hardening | `Sec-Sentinel` / `QA-Orion` / `Ops-Harbor` / `QA-Gate` / `Lead-Codex` | DONE / FOCUSED RELEASE GATE HARDENED | Sec-Sentinel/Bernoulli 建议补 requestCount=0、source match file-anchor、`qaTotalRequestCount` 覆盖 drift 请求；QA-Orion/Pascal 给出 missing/mismatch forged marker 测试矩阵；Ops-Harbor/Descartes 要求保留旧 marker 兼容并用 enriched marker 单独验证新字段；`verify-release-evidence.sh` 收紧 `mismatchFlags` 白名单和 `qaTotalRequestCount` 语义；`security-regression-check.sh` 新增旧 marker 合法、新 marker 合法和 17 类 drift forged marker 负例；`bash -n scripts/security-regression-check.sh scripts/verify-release-evidence.sh` PASS；`./scripts/verify-release-evidence.sh release-evidence/release-current-schema-20260702-230650` PASS；`./scripts/security-regression-check.sh` PASS，仅有本地 `tar: Failed to set default locale` warning。 | 下一步可进入 P9 UI Foundation P1，或继续 P6 真实后端 live marker 吸收；下一次 full release refresh 吸收该 focused gate |
| P6 report evidence QA claim roleDistribution drift guard | `Product-Luna` / `FE-Pixel` / `QA-Orion` / `Ops-Harbor` / `Lead-Codex` | DONE / FOCUSED CLAIM ROLE DRIFT GATE HARDENED | Product-Luna/Lagrange 建议继续 P6 而非切 P9；FE-Pixel/Euler 指出缺失 `roleDistribution` 与父子计数矛盾会让 READY 文案或修复候选误导用户；QA-Orion/Halley 建议加入 drift marker；FE-Pixel Worker/Arendt 完成实现；Lead-Codex 审核后补父级 claim file count 正数要求，并完成验证。`claimCitationCoverageReadyForRepair` 现在要求 roleDistribution 存在、父子 required/cited/file counts 严格一致、PRIMARY-bound claims 等于 required claims、context/unknown/unbacked/invalid 均为 0、父级 claim file count 为正；`claimCitationAudit`、`qaTrustSummary`、`qaCrossFileCitationSummary` 均复用严格 readiness。Marker 保持 `qaRequestCount=4`，新增 `qaTotalRequestCount=10`、`claimRoleDistributionMissing.requestCount=2`、`claimRoleDistributionMismatch.requestCount=2`；`node scripts/validate-frontend-ui.mjs` PASS；`npm --prefix web-console run build` PASS；`CI=true npm --prefix web-console run smoke:report-evidence-drawer` PASS；`CI=true npm --prefix web-console run smoke:report-evidence-qa-citation` PASS；当前 full authority verifier PASS。 | 继续 P6 真实后端字段/前端面板漂移防御；下一候选是 release/security regression 对新 marker 的 forged 负例收紧，或进入 P9 UI Foundation P1 |
| P6 report evidence QA trust summary drift guard | `Product-Luna` / `FE-Pixel` / `QA-Orion` / `Ops-Harbor` / `Lead-Codex` | DONE / FOCUSED QA TRUST GATE HARDENED | Product-Luna/Gauss 建议先锁 P6 可信度摘要；FE-Pixel/Pauli 找到“摘要 REVIEW 但修复按钮可能放行”的风险；QA-Orion/Chandrasekhar 指出 `REPORT_FILE_ANCHOR` 漂移是最小负例；FE-Pixel Worker/Dalton 完成实现；Lead-Codex 修正 marker 合同，保留 `qaRequestCount=4` 并新增 `qaTotalRequestCount=6`、`fileAnchorDrift.requestCount=2`；`node scripts/validate-frontend-ui.mjs` PASS；`npm --prefix web-console run build` PASS；`CI=true npm --prefix web-console run smoke:report-evidence-drawer` PASS；`CI=true npm --prefix web-console run smoke:report-evidence-qa-citation` PASS；当前 full authority verifier PASS。 | 已由 claim roleDistribution drift guard 接收；P9 UI Foundation P1 单独拆分 |
| P6 report evidence QA citation dedicated smoke entrypoint | `Product-Luna` / `FE-Pixel` / `QA-Orion` / `Ops-Harbor` / `Lead-Codex` | DONE / FOCUSED TEST BOUNDARY HARDENED | Product-Luna/Turing 建议 P6 可信代码理解优先；FE-Pixel/Zeno 指出 UI Foundation 仍需专项；QA-Orion/Aristotle 发现 `report-evidence-qa-citation-ui-smoke` 复用 drawer config；QA-Orion/Schrodinger 新增 `web-console/playwright.report-evidence-qa-citation.config.ts`、更新 npm script 和 `validate-frontend-ui.mjs`；`node scripts/validate-frontend-ui.mjs` PASS；`npm --prefix web-console run build` PASS；`CI=true npm --prefix web-console run smoke:report-evidence-qa-citation` PASS；`CI=true npm --prefix web-console run smoke:report-evidence-drawer` PASS。 | 继续 P6 报告证据到 QA 可信度摘要和真实后端字段/前端面板漂移防御；P9 后续按 UI Foundation P1 单独拆分 |
| P6/P11 current full release authority restored | `QA-Gate` / `Ops-Harbor` / `Sec-Sentinel` / `PM-Nova` / `Lead-Codex` | DONE / CURRENT FULL AUTHORITY RESTORED | `release-evidence/release-current-schema-20260702-230650`；完整 `release` profile PASS；`./scripts/verify-release-evidence.sh release-evidence/release-current-schema-20260702-230650` PASS；summary `required_failures=0`、`optional_warnings=0`、`skipped=5`；QA-Gate/Banach PASS，Sec-Sentinel/Peirce PASS，Ops-Harbor/McClintock PASS。 | 继续 P6 代码理解/QA 引用质量和 P9 大厂级 UI；生产签署前补 backup restore drill evidence、rollback plan、GitHub App/webhook drill、真实 LLM provider run |
| P6 full release authority refresh hardening | `Ops-Harbor` / `QA-Gate` / `Sec-Sentinel` / `FE-Pixel` / `PM-Nova` / `Lead-Codex` | DONE / SUPERSEDED BY CURRENT FULL AUTHORITY | `verify-release-evidence.sh` 已强制 `ci/release/nightly` profile 必须 `required_failures=0` 且 `optional_warnings=0`；Vite proxy / `codeQaApi.ask` / public repo UI smoke timeout 已提高；focused package `release-evidence/p6-public-repo-ui-cross-file-summary-20260702-211539` verifier PASS；失败 full 包 `release-current-schema-20260702-212528` verifier FAIL as expected；中断半包 `release-current-schema-20260702-225450` verifier FAIL as expected；后续已由 `release-evidence/release-current-schema-20260702-230650` 恢复 current full authority。 | Closed；继续使用 `release-current-schema-20260702-230650` 作为最新 full authority |
| P6 public repo live QA cross-file citation summary evidence | `FE-Pixel` / `QA-Orion` / `Sec-Sentinel` / `QA-Gate` / `Ops-Harbor` / `AI-Vector` / `Lead-Codex` | DONE / FOCUSED LIVE UI EVIDENCE VERIFIED | Standalone live public repo smoke PASS，sample `projectId=301/repositoryId=262/scanTaskId=222`；focused package `release-evidence/p6-public-repo-ui-cross-file-summary-20260702-211539` PASS，sample `projectId=303/repositoryId=264/scanTaskId=224`；marker 证明 `crossFileCitationSummary.visible=true`、tone=`ready`、`sourceEvidenceMatchTypes=["REPORT_LINE_ANCHOR"]`、`realBackend=true`、`mockedApi=false`；`security-regression-check.sh` PASS；`npm build` PASS。 | 下一步刷新完整 full release authority，或继续 P9 UI 产品级收口 |
| P6 QA cross-file citation summary | `FE-Pixel` / `QA-Orion` / `Sec-Sentinel` / `QA-Gate` / `Ops-Harbor` / `AI-Vector` / `Lead-Codex` | DONE / FOCUSED UI + MARKER CONTRACT VERIFIED | `ProjectDetail.tsx` 新增 `QaCrossFileCitationSummaryPanel`；report evidence drawer smoke 证明 verified `ready` 和 unverified `blocked` 双路径；public/report smoke marker 输出 `qaFromEvidence.crossFileCitationSummary`；`verify-release-evidence.sh` 绑定 summary 与父级 coverage/claim role counts；`security-regression-check.sh` 拒绝 missing/count mismatch/raw field/tone forged marker；`release-evidence/p6-cross-file-citation-summary-20260702-203802` PASS，`required_failures=0`、`optional_warnings=0`、`skipped=21`。 | 已由 live public repo evidence row 接收；继续 P9 页面信息架构和 UI 可读性收口 |
| P6 sourceLocationProbes Vite query focused live evidence | `Ops-Harbor` / `QA-Gate` / `Sec-Sentinel` / `QA-Orion` / `AI-Vector` / `Lead-Codex` | DONE / FOCUSED LIVE EVIDENCE VERIFIED | 当前源码 jar 后端在 `19081` 运行健康；raw live smoke `.sourcelens-runtime/evidence/public-repo-source-location-v2-20260702-200143.log` PASS；focused package `release-evidence/p6-source-location-v2-live-20260702-200348` PASS，`public-repo-smoke=OK`、`required_failures=0`、`optional_warnings=0`、`skipped=21`；包内 marker sample `projectId=299/repositoryId=260/scanTaskId=220`，v2 三类 probes 全 OK；`./scripts/verify-release-evidence.sh release-evidence/p6-source-location-v2-live-20260702-200348` PASS。 | 下一步继续 P6 报告/QA 引用质量和跨文件检索摘要；或在下一次 full release refresh 中吸收 v2 marker |
| P6 sourceLocationProbes Vite query contract v2 | `Ops-Harbor` / `QA-Gate` / `Sec-Sentinel` / `AI-Vector` / `Product-Luna` / `Lead-Codex` | DONE / FOCUSED MARKER CONTRACT HARDENED | `public-repo-analysis-smoke.sh` 输出 `sourceLocationProbeContractVersion=2` 和 `viteQuerySourceUrl`；`verify-release-evidence.sh` v2 精确三类 probes 并拒绝 raw URL/query/hash/stack trace 字段；`security-regression-check.sh` 新增 missing Vite kind、Vite port treated as line、raw URL recorded、targetFile query 等 forged marker 负例；`./scripts/verify-release-evidence.sh release-evidence/20260702-191044` PASS；`./scripts/security-regression-check.sh` PASS。 | 下一步可刷新 focused public repo live evidence 或 full authority |
| P6 Vite source URL and evidenceRef anchor retrieval hardening | `BE-Forge` / `AI-Vector` / `QA-Orion` / `Product-Luna` / `Sec-Sentinel` / `Lead-Codex` | DONE / FOCUSED BACKEND CONTRACT | `CodeChunkRanker` 支持 `ProjectDetail.tsx?t=...:245:19`、webpack stack frame 和 standalone browser source URL 文件名提取；`CodeChunkService` 归一化 `filePath:` anchor query/hash；`CodeQaController` 将 evidenceRef source URL 正确归一到 `REPORT_LINE_ANCHOR`；`mvn -Dtest=CodeChunkServiceTest,CodeQaRetrievalServiceTest,CodeQaControllerTest test` PASS，88 tests；scoped `git diff --check` PASS。 | 继续 P6：source location probes、Project QA/report evidence 可信度摘要和真实公开仓库 evidence refresh；不刷新 full authority |
| P6/P9/P11 historical full release authority refresh | `Ops-Harbor` / `QA-Gate` / `FE-Pixel` / `Sec-Sentinel` / `PM-Nova` / `Lead-Codex` | HISTORICAL / SUPERSEDED BY CURRENT VERIFIER SCHEMA | `release-evidence/20260702-191044` 完整 release profile 生成时 `status.tsv` 显示 21 个 required steps 全 OK，GitHub App drill、GitHub webhook drill、真实 LLM provider run 三项 SKIP；但当前 verifier schema 已前进，该包缺少 `PUBLIC_REPO_UI_SMOKE_OK.qaFromEvidence.crossFileCitationSummary`，不再作为 current authority。 | 重新生成新的完整 full release authority；GitHub App/Webhook/真实 LLM provider 仍作为高级集成层后置 |
| Project QA fallback claim citation boundary hardening | `BE-Forge` / `AI-Vector` / `Sec-Sentinel` / `QA-Orion` / `Product-Luna` / `Lead-Codex` | DONE / FOCUSED BACKEND QUALITY GATE | `CodeQaController` 将 fallback notice 豁免绑定到 `isOperationalFallbackAnswer(answer)`；`claimRequiresCitation` 只有在 operational fallback answer 中才跳过明确运行提示句；`CodeQaControllerTest` 证明无模型配置和 LLM 异常 fallback 为 `READY/PRIMARY_BOUND`，普通 `错误信息：AuthService validates token without citation` 未引用主张仍为 `REVIEW`；`mvn -Dtest=CodeQaControllerTest test` PASS，17 tests。 | 当轮曾被 `release-evidence/20260702-191044` 吸收；当前已由 `release-evidence/release-current-schema-20260702-230650` 接管 full authority，继续 P6/P9 QA 引用体验与报告证据闭环 |
| Scan governance action deep-link release gate hardening | `QA-Gate` / `Sec-Sentinel` / `Ops-Harbor` / `Product-Luna` / `Lead-Codex` / `Zeno` | DONE / FOCUSED RELEASE GATE HARDENING | `verify-release-evidence.sh` 强制 `candidateReceipt.sourceReportDeepLinkBound/qaReviewDeepLinkBound/actionLabels`、`prGate.actionLabel`、`patchEvidence.*ActionLabel/*DeepLinkBound`、`agentReview.*ActionLabel/*DeepLinkBound`；`security-regression-check.sh` 合法 marker 升级到新 schema，并新增 action label / deep link unbound forged marker 负例；`bash -n scripts/verify-release-evidence.sh scripts/security-regression-check.sh` PASS；`node scripts/validate-frontend-ui.mjs` PASS；`CI=true make scan-governance-timeline-ui-smoke` PASS；`./scripts/security-regression-check.sh` PASS。 | 当轮曾被 `release-evidence/20260702-191044` 吸收；当前已由 `release-evidence/release-current-schema-20260702-230650` 接管 full authority，继续 P6/P9 focused 增量时保持 verifier 同步 |
| Scan governance non-candidate action deep links | `Product-Luna` / `Arch-Atlas` / `Sec-Sentinel` / `FE-Pixel` / `QA-Orion` / `QA-Gate` / `Lead-Codex` / `Jason` | DONE / FOCUSED TIMELINE ACTION HARDENING | `ScanTaskDetail.tsx` 新增 `artifactsUrl`、`executionTaskUrl`、`agentTaskUrl` 并扩展 `scanAuditUrl`；PR Gate、Patch evidence、Agent review 普通事件使用明确 label 与实际 click URL；`scan-governance-timeline-smoke.spec.ts` 证明 patch artifact、repair execution、PATCH_READY audit、PR Gate、AgentTask、AgentToolCall、Agent execution deep links；`validate-frontend-ui.mjs` 拒绝泛化短标签；`node scripts/validate-frontend-ui.mjs` PASS；`CI=true make scan-governance-timeline-ui-smoke` PASS。 | 已由 release gate hardening 接收；后续刷新完整 full authority |
| Scan governance candidate receipt action alignment | `Product-Luna` / `Arch-Atlas` / `Sec-Sentinel` / `FE-Pixel` / `QA-Orion` / `QA-Gate` / `Lead-Codex` | DONE / FOCUSED TIMELINE ACTION ALIGNMENT | `ScanTaskDetail.tsx` 为 `ReportGovernanceEvent` 新增 `actions[]`；CandidateReceipt aggregate/fallback 事件使用 `candidateReceiptTimelineActions`；`app.css` 新增 `.sl-report-governance-event-action-list`；`scan-governance-timeline-smoke.spec.ts` 证明 `打开修复详情`、`打开来源报告`、`QA 复核来源` 三动作和 deep links；`validate-frontend-ui.mjs` 锁住 aggregate/fallback/helper/smoke marker；`node scripts/validate-frontend-ui.mjs` PASS；`CI=true make scan-governance-timeline-ui-smoke` PASS；`npm --prefix web-console run build` PASS。 | 已被 `release-evidence/20260702-191044` 吸收；继续 P6/P9/P10 动作命名一致性 |
| AuditLogs candidate receipt review panel | `Product-Luna` / `Arch-Atlas` / `Sec-Sentinel` / `FE-Pixel` / `QA-Orion` / `QA-Gate` / `Lead-Codex` | DONE / FOCUSED AUDIT RECEIPT BRIDGE | `AuditLogs.tsx` 中 `AUTO_REPAIR_CANDIDATE_CREATED` 抽屉新增 `审计候选凭证复核`；`app.css` 新增 `.sl-audit-candidate-receipt` 三态和移动端全宽按钮；`audit-logs-detail-selection-smoke.spec.ts` 证明 AutoRepair/report/QA deep links；`validate-frontend-ui.mjs` 锁住源码、smoke 断言和 marker；`node scripts/validate-frontend-ui.mjs` PASS；`CI=true make audit-logs-detail-selection-ui-smoke` PASS；`npm --prefix web-console run build` PASS。 | 已被 `release-evidence/20260702-191044` 吸收；继续 P6/P9/P10 receipt 字段展示一致性 |
| AutoRepair candidate receipt review action rail | `Product-Luna` / `Arch-Atlas` / `Sec-Sentinel` / `FE-Pixel` / `QA-Orion` / `QA-Gate` / `Lead-Codex` | DONE / FOCUSED RECEIPT REVIEW BRIDGE | `AutoRepairs.tsx` 中 `CandidateProvenanceReceipt` 新增 `候选凭证复核动作`；`app.css` 新增 `.sl-candidate-receipt-action-rail` 三态和移动端按钮换行；`project-qa-autorepair-candidate-smoke.spec.ts` 与 `report-autorepair-candidate-smoke.spec.ts` 证明 report/QA/audit deep links；`validate-frontend-ui.mjs` 锁住源码、smoke 断言和 marker；`node scripts/validate-frontend-ui.mjs` PASS；`CI=true make project-qa-autorepair-candidate-ui-smoke` PASS；`CI=true make report-autorepair-candidate-ui-smoke` PASS；`npm --prefix web-console run build` PASS。 | 已被 `release-evidence/20260702-191044` 吸收；继续 P6/P9 端到端复核体验 |
| Report evidence next action rail | `Product-Luna` / `FE-Pixel` / `QA-Orion` / `QA-Gate` / `Lead-Codex` | DONE / FOCUSED UI ACTION BRIDGE | `ScanTaskDetail.tsx` 新增 `ReportEvidenceActionRail`；`app.css` 新增响应式 `.sl-report-evidence-action-rail`；`report-evidence-drawer-smoke.spec.ts` 覆盖 READY/GAP 抽屉路径；`validate-frontend-ui.mjs` 锁住组件、样式和 marker；`node scripts/validate-frontend-ui.mjs` PASS；`CI=true make report-evidence-drawer-ui-smoke` PASS；`npm --prefix web-console run build` PASS。 | 已被 `release-evidence/20260702-191044` 吸收；继续 P6/P9 报告证据到 QA/AutoRepair 闭环 |
| Project QA next action rail | `Product-Luna` / `FE-Pixel` / `QA-Orion` / `QA-Gate` / `Lead-Codex` | DONE / FOCUSED UI ACTION BRIDGE | `ProjectDetail.tsx` 新增 `QaNextActionRail`；`app.css` 新增响应式 `.sl-qa-next-action-rail`；`project-qa-autorepair-candidate-smoke.spec.ts` 覆盖 TRUSTED/REVIEW/BLOCKED 三态、READY AutoRepair deep link、非 READY 修复候选隐藏；`validate-frontend-ui.mjs` 锁住组件、样式和 marker；`node scripts/validate-frontend-ui.mjs` PASS；`CI=true make project-qa-autorepair-candidate-ui-smoke` PASS。 | 已被 `release-evidence/20260702-191044` 吸收；继续 P6/P9 QA 回答到 AutoRepair 闭环 |
| App Shell topbar readability hardening | `Product-Luna` / `FE-Pixel` / `QA-Orion` / `QA-Gate` / `Lead-Codex` | DONE / FOCUSED UI GATE HARDENED | `app.css` topbar 增加不收缩、不隐藏溢出和稳定 stacking；`app-shell-ui-smoke.spec.ts` 新增 `expectBoxInsideContainer` / `expectTopbarAndPageSeparated`；`validate-frontend-ui.mjs` 静态锁住 layout guards；`CI=true make app-shell-ui-smoke` PASS，marker 包含 `topbar-title-contained`、`topbar-desc-contained-when-visible`、`page-content-starts-after-topbar`、`page-heading-below-topbar`。 | 已被 `release-evidence/20260702-191044` 吸收；继续 P9 深层页面视觉密度和报告/QA 页面信息架构 |
| Historical full release authority refresh `0845` | `Ops-Harbor` / `QA-Gate` / `PM-Nova` / `FE-Pixel` / `Sec-Sentinel` / `Lead-Codex` | DONE / HISTORICAL PACKAGE | 完整 package `release-evidence/p6-full-release-refresh-20260702-0845` 曾通过当时 verifier，`required_failures=0`、`optional_warnings=0`、`skipped=3`；backup id `p6-20260702080733` 的 restore drill 通过，30 tables、30592 workspace entries、148 artifact entries；rollback preflight strict 通过。后续曾被 `release-evidence/20260702-191044` supersede；当前 schema 下二者均只保留为 historical。 | 仅作历史对照；GitHub App/webhook/真实 LLM provider 仍作为高级集成层后置 |
| Candidate receipt governance marker hardening | `QA-Gate` / `FE-Pixel` / `Sec-Sentinel` / `Ops-Harbor` / `Lead-Codex` | DONE / FOCUSED MARKER HARDENED | Franklin `019f21ab-9a70-71d1-be44-93a007dfd436` 判定原合同 `PARTIAL`；已补前端 timeline event scan-bound 双层过滤、candidate gate reason marker、foreign backend timeline receipt fixture、完整 AutoRepair deep link query 断言、verifier reason 强校验和 missing reason forged marker 负例；`validate-frontend-ui`、frontend build、bash syntax、scan governance timeline smoke 和完整 security regression 均 PASS。 | 已被 `release-evidence/20260702-191044` 吸收；继续 P9 全站 UI 可读性基础层 / P6 报告 QA 引用质量 |
| Public repo source location release/nightly gate | `Ops-Harbor` / `Sec-Sentinel` / `QA-Gate` / `AI-Vector` / `Lead-Codex` | DONE / RELEASE-NIGHTLY GATE IMPLEMENTED | `release-evidence.sh` schema 2 manifest 新增 `public_repo_source_location_probes_required`；`verify-release-evidence.sh` 兼容 schema 1，schema 2 必须声明新字段，release/nightly 必须 true；`security-regression-check.sh` 新增 `source-location-required-missing` forged marker 负例；历史 focused package `p6-source-location-probes-20260702-143649` PASS；new lightweight schema 2 package `schema2-source-location-gate-20260702-145515` PASS；完整 security regression PASS。 | 已被 `release-evidence/20260702-191044` 吸收并在 release profile 中强制 sourceLocationProbes；继续 P6 报告/QA 引用质量或 P9 产品级 UI |
| Public repo source location live evidence | `AI-Vector` / `Ops-Harbor` / `Sec-Sentinel` / `QA-Gate` / `Lead-Codex` | DONE / FOCUSED LIVE EVIDENCE VERIFIED | `Mencius / 019f2187-7550-7f41-83e1-5c3b54afc0dc` 只读复核建议 focused live marker + focused package、不刷新 full authority；standalone live sample `265/226/198` 两类 `sourceLocationProbes` 均 OK；release evidence target safety 拒绝 target/classes 后，使用 `.sourcelens-runtime/backend` 稳定 jar 生成 focused package `release-evidence/p6-source-location-probes-20260702-143649`，sample `266/227/199`；verifier 和 security regression 均 PASS。 | required gate 已由 schema 2 增量完成；下一步继续 P6 报告/QA 引用质量与 P9 产品级 UI |
| Public repo source location probe marker | `AI-Vector` / `Ops-Harbor` / `Sec-Sentinel` / `QA-Gate` / `Lead-Codex` | DONE / FOCUSED MARKER CONTRACT IMPLEMENTED | `Hypatia / 019f2178-67ac-7492-a0cd-34db6706ac39` 只读审查建议 smoke 生成侧 required、verifier 过渡期 optional strict；`public-repo-analysis-smoke.sh` 输出 `sourceLocationProbes`，覆盖 `standaloneBrowserSourceUrl` 与 `anonymousWebpackStackFrame`；`verify-release-evidence.sh` 校验 safe path、scanTaskId、matched range、source evidence type、port 不落入 matched line range；`security-regression-check.sh` 增加 source-location forged marker 负例和静态断言；targeted backend tests、frontend validator、frontend build、scoped diff check 和完整 security regression 均 PASS。 | 已被 `release-evidence/20260702-191044` 吸收；后续可跑 retained live public repo smoke 刷新样本 |
| Code chunks stack frame source URL retrieval hardening | `AI-Vector` / `BE-Forge` / `QA-Orion` / `QA-Gate` / `Lead-Codex` | DONE / FOCUSED BACKEND CONTRACT VERIFIED | `Bernoulli / 019f216a-589b-7c11-9845-4bf56f03b756` 只读审查指出 standalone browser source URL 的 dev-server port 可能被误识别为 line hint；`CodeChunkRanker.stripUrlPorts` 在解析行号前剥离 `scheme://host:port/` 端口；stack/source URL 文件名 hint 限定在 stack/source URL 语境，避免污染报告 `filePath:` 锚点；`CodeChunkServiceTest` 新增匿名 webpack stack frame、standalone source URL、file hint 回归；`mvn -q -f backend-spring/pom.xml -Dtest=CodeChunkServiceTest test` PASS。 | 下一步可把 source URL/stack trace probe 纳入 public repo smoke 的轻量后端探针，或继续 P9 QA 输入 playbook 产品化 |
| Project QA Trust Summary Live Evidence | `Product-Luna` / `Arch-Atlas` / `BE-Forge` / `FE-Pixel` / `QA-Orion` / `QA-Gate` / `Ops-Harbor` / `Lead-Codex` | DONE / FOCUSED LIVE UI VERIFIED | `CodeQaController.primaryChunkKeys(topChunks, evidenceRef)` 收敛 report-evidence QA PRIMARY 边界；`CodeQaControllerTest.codeQa_shouldConstrainReportEvidencePrimaryBoundaryToEvidenceAnchor` 覆盖多 Top chunks；`public-repo-ui-smoke` 从 drawer code chunk `startLine` 传 `evidenceLine` 并强校验 `REPORT_LINE_ANCHOR`；完整 public repo smoke retained sample `projectId=264/repositoryId=225/scanTaskId=197`，marker 证明 `qaFromEvidence.evidenceRef.lineNumber="41"`、required coverage 100%、claim role `PRIMARY_BOUND`、trust summary READY。 | 下一步可把该 focused live UI 子合同纳入下一次 full release authority，或继续 P6/P9 报告引用质量和 UI 产品化 |
| Project QA Trust Summary | `Product-Luna` / `FE-Pixel` / `QA-Orion` / `QA-Gate` / `Lead-Codex` | DONE / FOCUSED MOCK UI VERIFIED | `ProjectDetail.tsx` 新增 `QaTrustSummary` / `qaTrustSummary` / `QaTrustSummaryPanel`；`app.css` 新增响应式 `.sl-qa-trust-summary`；`report-evidence-drawer-smoke.spec.ts` verified 路径断言 `可采信并进入修复复核`，unverified 路径断言 `不可直接采信`；`validate-frontend-ui.mjs` 锁住组件、样式和 smoke 断言；`node scripts/validate-frontend-ui.mjs` PASS；`npm --prefix web-console run build` PASS；`npm --prefix web-console run smoke:report-evidence-drawer` PASS。 | 下一步可刷新 public repo live UI focused evidence，或把 trust summary 纳入 release verifier marker；当前不刷新 full authority |
| Public Repo Code QA Claim Role Live Evidence | `BE-Forge` / `QA-Orion` / `Ops-Harbor` / `QA-Gate` / `Lead-Codex` | DONE / FOCUSED LIVE RAW MARKER VERIFIED | `Halley / 019f2137-1271-70f2-b425-fcf216ea7f19` 只读复核确认 fallback runtime notice 误判；`CodeQaController` 新增窄范围 operational fallback claim 豁免，并把 fallback 证据句改为 `可用代码证据 [C1]` 在文件路径前；`CodeQaControllerTest` 覆盖无模型配置和 LLM 异常 fallback 的 `READY/PRIMARY_BOUND`，保留未引用真实代码主张 `REVIEW`；`mvn -q -f backend-spring/pom.xml -Dtest=CodeQaControllerTest test` PASS；真实 public repo smoke against 19081 PASS，sample `projectId=260/repositoryId=221/scanTaskId=193`。 | 下一步可刷新带 UI 子门禁的 focused public repo evidence，或把 claim role distribution 做成报告/QA 可信度摘要；当前不刷新 full authority |
| Raw Public Repo Code QA Claim Role Marker | `PM-Nova` / `Product-Luna` / `QA-Orion` / `Sec-Sentinel` / `Ops-Harbor` / `QA-Gate` / `Lead-Codex` | DONE / FOCUSED RAW MARKER VERIFIER GATE | `public-repo-analysis-smoke.sh` raw `validate_code_qa` 输出 `claimCitationCoverage.roleDistribution`；`verify-release-evidence.sh` 强校验 `PUBLIC_REPO_SMOKE_OK.codeQa.claimCitationCoverage` 和 nested `roleDistribution`；`security-regression-check.sh` 合法 public repo/weak keyword marker fixture 已同步 claim coverage，并新增缺 claim coverage、缺 roleDistribution、context-only、primary-bound under-covered、primary file count 为 0 等伪造负例。`bash -n ...` PASS；`node scripts/validate-frontend-ui.mjs` PASS；scoped `git diff --check` PASS；`./scripts/security-regression-check.sh` PASS，仅有 macOS `tar` locale warning。 | 下一步可刷新 focused live public repo evidence，或继续 P6 报告/QA 引用体验摘要；当前不刷新 full authority |
| Claim Citation Role Distribution | `QA-Orion` / `Sec-Sentinel` / `Arch-Atlas` / `BE-Forge` / `FE-Pixel` / `Ops-Harbor` / `QA-Gate` / `Lead-Codex` | DONE / FOCUSED CLAIM PRIMARY BOUND METRIC | QA/Security-Turing `019f20ef-f9b9-7a61-8475-6a14dc5ca599` 建议 IMPLEMENT_NOW 且保持 deterministic audit；`CodeQaClaimCitationCoverage.roleDistribution` 返回 `PRIMARY_BOUND/MIXED_CONTEXT/CONTEXT_ONLY/UNKNOWN_ROLE_PRESENT/REVIEW_UNCITED/BLOCKED_INVALID/NO_REQUIRED_CLAIMS`；`CodeQaControllerTest` 覆盖 PRIMARY-bound、context-only、invalid、uncited；Project QA 面板展示 `主张证据角色分布`；report/public marker 和 release/security/static gate 已接入；`mvn -q -f backend-spring/pom.xml -Dtest=CodeQaControllerTest test` PASS；`node scripts/validate-frontend-ui.mjs` PASS；`npm --prefix web-console run build` PASS；`npm --prefix web-console run smoke:report-evidence-drawer` PASS；`./scripts/security-regression-check.sh` PASS。 | 下一步可继续 live public repo evidence refresh 或更高层报告体验摘要；本轮不刷新 full authority，不把 PRIMARY_BOUND 当作事实裁判 |
| Citation Evidence File Distribution | `Arch-Atlas` / `AI-Vector` / `BE-Forge` / `FE-Pixel` / `QA-Orion` / `Sec-Sentinel` / `Ops-Harbor` / `QA-Gate` / `Lead-Codex` | DONE / FOCUSED CITATION FILE ROLE METRIC | Archimedes 建议 citationCoverage role distribution，Aristotle 要求 marker fail-closed；`CodeQaCitationCoverage` 新增 evidence file count 字段；Project QA audit panel 展示 required/primary file coverage；report/public marker 与 release/security/static gate 已接入；`mvn -q -f backend-spring/pom.xml -Dtest=CodeQaControllerTest test` PASS；`node scripts/validate-frontend-ui.mjs` PASS；`npm --prefix web-console run build` PASS；`npm --prefix web-console run smoke:report-evidence-drawer` PASS；`bash -n scripts/verify-release-evidence.sh && bash -n scripts/security-regression-check.sh` PASS；`./scripts/security-regression-check.sh` PASS；scoped `git diff --check` PASS。 | 下一步可进入嵌套 `evidenceRoleDistribution` 或 claim-level role stats；本轮不刷新 full authority |
| Claim Citation File Distribution | `Product-Luna` / `AI-Vector` / `BE-Forge` / `FE-Pixel` / `QA-Orion` / `Ops-Harbor` / `Sec-Sentinel` / `QA-Gate` / `Lead-Codex` | DONE / FOCUSED CROSS-FILE CLAIM METRIC + CLAIM-GATED AUTOREPAIR ACTION | `CodeQaClaimCitationCoverage` 新增 citation file distribution 字段；`CodeQaController` 从有效 citation label 映射到 `filePath`；`CodeQaControllerTest.codeQa_shouldExposeCrossFileClaimCitationDistribution` 证明两条必需主张分别绑定两个文件；Project QA 面板新增 Files/Required Files；Aristotle `019f2012-708a-7980-b074-c6b170d914ac` 打回 AutoRepair action 绕过 claim gate 后，`ProjectDetail` 改为仅在 `qaRepairEvidenceGate.status=READY` 时生成 AutoRepair URL，`project-qa-autorepair-candidate-smoke` 新增 `claimReviewHidden=true`；`REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK` 与 `PUBLIC_REPO_UI_SMOKE_OK` marker 输出 min/max file count；release verifier/security regression 拒绝 verified file count 为 0 和 unverified file count 伪造。 | 下一步继续 P6：评估跨文件 QA 的 semantic sufficiency，不把 file distribution 当作 LLM 事实裁判；需要时刷新 public repo live UI marker 或扩大真实样本 |
| Claim Citation Quality Audit | `Arch-Atlas` / `AI-Vector` / `BE-Forge` / `FE-Pixel` / `QA-Orion` / `Ops-Harbor` / `Sec-Sentinel` / `QA-Gate` / `Lead-Codex` | DONE / FOCUSED CLAIM-CITATION GATE | Aristotle `019f2012-708a-7980-b074-c6b170d914ac` 建议 deterministic claim citation coverage；后端新增 `CodeQaClaimCitationCoverage`，前端新增 `主张引用质量` 面板，release verifier/security regression 拒绝缺字段、低 coverage、错误状态、invalid citation 和 unverified 伪造 READY/满覆盖；后端定向测试、validator、build、report evidence smoke 和完整 security regression 均 PASS。 | 下一步可刷新 full authority 产出新版 public repo live UI marker，或继续 P6 跨文件回答 claim/citation 分布质量与报告引用可读性 |
| Required Evidence Coverage Release Marker Gate | `FE-Pixel` / `QA-Orion` / `Ops-Harbor` / `Sec-Sentinel` / `QA-Gate` / `Lead-Codex` | DONE / FOCUSED RELEASE GATE | Bacon 输出前端 smoke marker required coverage 子合同；Hypatia 接入 release verifier/security regression；主线程收紧 unverified required coverage 为 0/0 并完成 smoke/build/security 验证。 | 下一步可刷新 full authority 以产出新版 public repo live UI marker，或继续 P6 claim-level citation quality 抽样评估 |
| Required Evidence Coverage Semantics | `Arch-Atlas` / `BE-Forge` / `FE-Pixel` / `QA-Gate` / `Lead-Codex` | DONE / FOCUSED BACKEND SEMANTIC GATE | `CodeQaCitationCoverage` 新增 primary/context/required coverage；`CodeQaControllerTest` 锁住 `coveragePercent=33` 但 `requiredEvidenceCoveragePercent=100` 的主证据场景；前端修复门禁要求 required coverage 100%。 | 已进入 release marker gate；后续可继续 claim-level citation quality 抽样评估 |
| Citation Readiness and Coverage Audit | `Product-Luna` / `Arch-Atlas` / `FE-Pixel` / `QA-Gate` / `Lead-Codex` | DONE / FOCUSED UI GATE | `ScanTaskDetail` 证据抽屉新增 `引用质量预检`，`ProjectDetail` QA 回答新增 `引用覆盖审计`；mock drawer smoke、public repo UI smoke 和 validator 均要求可见；required evidence coverage 已在后续 focused semantic gate 中落地。 | 下一步可把 citation readiness 和 required coverage 同步纳入 release evidence marker |
| Report Recommended Next Step Gate | `Product-Luna` / `FE-Pixel` / `QA-Gate` / `Ops-Harbor` / `Sec-Sentinel` / `Lead-Codex` | DONE / FOCUSED LIVE UI VERIFIED | `ReportRecommendedNextStep` 已落地，`PUBLIC_REPO_UI_SMOKE_OK.recommendedNextStep` 证明真实报告页推荐行动可见、primary/secondary CTA 可见、key 合法且 title 非空；release verifier/security regression 已拒绝缺失、隐藏、非法 key 和空标题伪造 marker。 | 继续 P6/P9：可把推荐行动与 Evidence Drawer 跨文件证据面结合，或扩展更多公开仓库 retained samples 验证推荐策略泛化；当前不刷新 full authority |
| Public Repo Live UI Smoke Evidence Closure | `QA-Orion` / `Sec-Sentinel` / `BE-Forge` / `FE-Pixel` / `Ops-Harbor` / `Lead-Codex` | DONE / FOCUSED LIVE UI VERIFIED | `PUBLIC_REPO_UI_SMOKE_OK` retained sample marker 已证明 `codeKnowledge.expectedEvidenceFileVisible=true`、`crossFileEvidence.minFileEvidenceSatisfied=true`、`qaFromEvidence.groundingStatuses=["VERIFIED"]`、`citationEnforcementStatuses=["RETRY_VERIFIED"]`、`governanceTimeline.patchEvidence.status=OK`、`governanceTimeline.agentReview.status=OK`；Euler 复核问题已修复，完整 security regression PASS。 | 下一步继续 P6/P9：报告叙事质量、QA 检索质量、更多公开仓库样本或前端大厂级 UI 第一版；当前不刷新 full authority |
| Public Repo Live Agent Review Evidence Contract | `Arch-Atlas` / `Product-Luna` / `FE-Pixel` / `QA-Gate` / `Ops-Harbor` / `Lead-Codex` | DONE / FOCUSED LIVE-GOVERNANCE AGENT EVIDENCE | Archimedes/Hubble `019f1e68-136f-78a3-afe2-3c7645e605b3` 建议把 public repo live governance 从 derived type existence 升级为 Agent review evidence owner/source/execution proof；`ScanGovernanceSmokeSeedController` 现在 seed `AGENT_TASK` execution，`public-repo-ui-smoke` marker 输出 `governanceTimeline.agentReview`，release verifier/security regression/validator 均锁住 AgentTask scan bound、AGENT_REPORT owner bound、AGENT_TASK audit bound、AGENT_TASK execution bound、foreign Agent evidence hidden 和 no raw prompt/answer。 | 下一步可在 backend 重启后运行 `SOURCELENS_PUBLIC_REPO_SMOKE_UI=true make public-repo-smoke` 刷新 live focused 包；当前不刷新 full authority，不声明真实 LLM/Agent 质量 |
| Project QA / AutoRepair repair evidence gate | `Product-Luna` / `QA-Orion` / `Sec-Sentinel` / `Arch-Atlas` / `BE-Forge` / `FE-Pixel` / `QA-Gate` / `Lead-Codex` | DONE / FOCUSED QA-AUTOREPAIR SERVER-DERIVED EVIDENCE GATE | Product/QA 子 agent Epicurus `019f1e1f-2e27-7280-b224-2a7d36e23b62` 判定 verified citation + response-bound report evidence 仍不足以证明 repair-ready；Sec/Arch 子 agent Parfit `019f1e35-acc8-7373-9bc0-6ed6bb9ae754` 判定服务端应规范化写入 `repairEvidenceGate`，但只作为候选来源证据成熟度；本轮已新增 Project QA `修复证据门禁`，后端 `AUTO_REPAIR_CANDIDATE_CREATED` receipt 写入 `repairEvidenceGate/repairEvidenceGateReason/repairEvidenceGateSource=SERVER_DERIVED`，AutoRepair `候选证据门禁` 优先展示服务端 gate；focused smokes、validator、release verifier marker 与 security regression static gates 均 PASS。 | 下一步继续 P9/P6 主链路：可推进报告/QA/AutoRepair 的 live evidence 或 UI 一致性下一批；当前不刷新 full authority，不把 READY 等同 PATCH_READY/PR-ready |
| Project QA verified citation to AutoRepair candidate | `Product-Luna` / `QA-Orion` / `FE-Pixel` / `Lead-Codex` | DONE / FOCUSED QA-AUTOREPAIR UI EVIDENCE | Product/QA 子 agent Sagan `019f1d18-5456-7391-b91c-35f7f00dd5f0` 判定方向可实施但旧方案需补 fail-closed 条件；Product/QA 子 agent Ptolemy `019f1d26-1ad5-7a40-b2c7-11691587315e` 只读复核建议下一阶段做 `AUTO_REPAIR_CANDIDATE_CREATED` audit provenance receipt；本轮先收口前端闭环：`ProjectDetail.tsx` 仅对 verified+cited citation 显示 `生成修复候选`，`AutoRepairs.tsx` 创建成功后 `upsertAutoRepair + setSelected(created)`，Source Bridge 识别 `Project QA 已验证引用` 并提供 QA/audit 深链；`project-qa-autorepair-candidate-ui-smoke` 覆盖 visible/hidden、URL 参数、modal draft、create payload、新 repair 自动选中、Source Bridge、QA deep link 和 audit deep link；`node scripts/validate-frontend-ui.mjs` PASS；`npm --prefix web-console run build` PASS；`CI=true make project-qa-autorepair-candidate-ui-smoke` PASS，marker `createdRepairSelected=true`、`sourceBridge.qaDeepLinkBound=true`、`sourceBridge.auditDeepLinkBound=true`。 | 下一步建议按 Ptolemy 方案实现后端 provenance receipt：创建 AutoRepair 时写 `AUTO_REPAIR_CANDIDATE_CREATED` audit inputJson，详情页展示结构化 citation/report 来源凭证；当前不改后端 DTO/API、不刷新 full authority、不声明真实 LLM/provider 或 public repo live QA 质量 |
| Project QA low-confidence retry recovery evidence | `Product-Luna` / `QA-Orion` / `FE-Pixel` / `Lead-Codex` | DONE / FOCUSED QA UI EVIDENCE | Product/QA 子 agent Meitner `019f1d10-ce3f-71f1-98f6-93478ee728ed` 判定现有 low-confidence smoke 对“点击 retry 后恢复到 `VERIFIED` answer citation”是 `NEEDS_WORK`；`project-qa-low-confidence-smoke.spec.ts` 已新增 attempt map 和 retry recovery 分支，首次 `PARTIAL/RETRY_FAILED` 后点击低置信面板 `retry`，第二次响应 `VERIFIED/DIRECT_VERIFIED`，断言同一问题、`scanTaskId=501`、目标文件、`回答引用证据`、`引用已验证`、`首次引用已验证`、`回答已引用` 和 `citedByAnswer=true`；validator 已锁住该合同；`node scripts/validate-frontend-ui.mjs` PASS；`CI=true make project-qa-low-confidence-ui-smoke` PASS，marker `retryRecovery` 全 true。 | 后续可继续 P6 真实 QA/provider 样本质量评估，或继续 P9 QA/报告/AutoRepair 交互一致性；当前不刷新 full authority |
| Project QA recoverable request/search states | `Product-Luna` / `QA-Orion` / `FE-Pixel` / `AI-Vector` / `Lead-Codex` | DONE / FOCUSED QA UI EVIDENCE | Product/QA 子 agent Huygens `019f1cfe-b0f8-7953-aa1c-60fe7fcc353e` 判定 ProjectDetail QA/code_chunks 状态机适合作为 P6/P9 小批次；`ProjectDetail.tsx` 已新增 `searchFailedQuery` 与 `qaRequestError`，code_chunks 初始失败可 `重新检索证据`，已有结果刷新失败保留旧证据卡，QA 请求失败可 `重试此问题` 或 `恢复到输入框`；低置信文案从误导性“重新扫描后复核”改为真实动作“重新检索证据”；新增 `project-qa-recoverable-ui-smoke` 与 validator 门禁；`node scripts/validate-frontend-ui.mjs`、`npm --prefix web-console run build`、`CI=true make project-qa-low-confidence-ui-smoke`、`CI=true make project-qa-recoverable-ui-smoke`、`CI=true make app-shell-ui-smoke` 均 PASS。 | 后续可继续 P6 真实 provider/更多公开仓库 QA 质量评估，或继续 P9 报告/QA/AutoRepair 交互一致性；当前不刷新 full authority |
| ModelConfig recoverable provider config states | `Product-Luna` / `QA-Orion` / `FE-Pixel` / `Lead-Codex` | DONE / FOCUSED UI EVIDENCE | Product/QA 子 agent James `019f1cee-ccd4-70d0-9b51-12a793e69277` 判定 ModelConfig 适合作为 P9 小批次；`ModelConfig.tsx` 已新增 `formatApiError` + `StateBlock` 错误态，初始加载失败可 retry，缓存刷新失败保留表格，创建/保存失败 Modal 内联，激活/删除失败持久提示；移除 AntD `InputNumber addonAfter` 运行时弃用警告；新增 `model-config-recoverable-ui-smoke` 与 validator 门禁；`node scripts/validate-frontend-ui.mjs`、`npm --prefix web-console run build`、`CI=true make model-config-recoverable-ui-smoke`、`CI=true make app-shell-ui-smoke` 均 PASS。 | 后续继续 P9 平台页/配置页体验收口，或切回 P6 真实 provider/更多公开仓库样本；当前不刷新 full authority |
| Public repo Project QA weak keyword evaluation | `AI-Vector` / `QA-Orion` / `QA-Gate` / `Lead-Codex` | DONE / FOCUSED PUBLIC QA OBSERVABILITY + VERIFIER HARDENED | Goodall-agent/Halley `019f18ff-9d4a-7543-a98b-583162360fc9` 对上一批 semantic pool probe `PASS_WITH_NOTES`；AI-Vector/Lagrange `019f1cb7-d0a4-7743-84b3-52f830f574b0` 建议新增并列非破坏性 evaluation；QA-Orion/Schrodinger `019f1cb9-1bad-7ca1-b8ff-71ba525e59dc` 要求独立 marker、auto 不阻塞、显式 true fail closed；`public-repo-analysis-smoke.sh` 已新增 `SOURCELENS_PUBLIC_REPO_SMOKE_WEAK_KEYWORD_EVAL`、扫描前可选 MOCK 和 `projectQaWeakKeywordEvaluation`；强制 live smoke PASS，scanTaskId `189`，`semanticFallbackHits=4`，`dbMutationUsed=false`，`llmCleanup.status=OK`；QA/Ops Schrodinger/Hegel `019f1cdc-765d-7bd1-bbe1-0f4ae7928950` 复核 optional verifier 方案后，`verify-release-evidence.sh` 与 `security-regression-check.sh` 已接入存在即校验和伪造负例，完整 security regression PASS。 | 当前仍不刷新 full authority，不声明真实 provider 质量；下一步可推进真实 provider/更多公开仓库样本或回到 P9 大厂级 UI 主线 |
| Bounded semantic candidate pool for Project QA | `BE-Forge` / `QA-Orion` / `AI-Vector` / `Lead-Codex` | DONE / FOCUSED BACKEND RAG EVIDENCE | QA-Orion/Volta `019f1ca9-684e-79a2-84c6-b1bcec6f739a` 只读复核 `PASS_TO_IMPLEMENT`，指出 retrieval service 必须允许弱关键词场景的纯语义候选进入重排；BE-Forge/Pasteur `019f1ca9-4374-7113-9046-b4124ae19c34` 实现 semantic pool、controller 合并和 retrieval service 弱关键词语义纳入；Lead-Codex 修正二次截断，确保 `80 + 500` 合并候选中的 semantic pool 尾部也能参与重排；`mvn -q -Dtest=CodeChunkControllerTest,CodeChunkServiceTest,CodeQaRetrievalServiceTest,CodeQaControllerTest test` PASS。 | 后续评估真实公开仓库样本下的 QA 召回质量和阈值；本轮不刷新 full authority、不引入向量库 |
| Project QA low-confidence / no-evidence visibility | `AI-Vector` / `QA-Orion` / `QA-Gate` / `BE-Forge` / `FE-Pixel` / `Lead-Codex` | DONE / FOCUSED QA UI + BACKEND CONTRACT | AI-Vector/Beauvoir `019f1c97-2b86-7bf3-b0e6-ff9dca11d6a0` 指出 bounded semantic candidate pool 是后续高价值方向；QA-Orion/Jason `019f1c97-49a7-7ec1-a68b-b759493a5814` 给出 evidenceRef/citation 测试矩阵；恢复 Goodall-agent/Halley `019f18ff-9d4a-7543-a98b-583162360fc9` 后判定 `NEEDS_SPLIT`，要求本轮只做低置信/无证据可见化；BE-Forge/Hume `019f1c9c-5dbb-7e50-acbf-9358e3b2ec5a` 加强后端合同测试；FE-Pixel/Dirac `019f1c9c-9023-7023-8f29-c560c8c863eb` 新增 ProjectDetail 降级 Alert、focused smoke、static gate；targeted backend tests、validator、build、`project-qa-low-confidence-ui-smoke` 均 PASS；Goodall final gate `PASS_WITH_NOTES`，无必须修复项。 | 下一步拆 P6 bounded semantic candidate pool；本轮不刷新 full authority、不声明真实 LLM/provider 质量提升；若未来纳入 release verifier，要统一前端 fixture 与真实后端 enforcement status 枚举 |
| Main path recoverable error states batch 4B | `QA-Orion` / `FE-Pixel` / `Lead-Codex` | DONE / FOCUSED UI EVIDENCE | QA-Orion/Anscombe `019f1c90-2bf6-71f0-9f70-c3b084956bac` 给出 `PASS_TO_IMPLEMENT`；`DependencyGraph.tsx` 已将 `analysisApi.getGraph(scanTaskId)` 失败改为 `formatApiError(error, '加载依赖图谱失败')`，错误态显示 `依赖图谱加载失败` + `重新加载图谱`；新增 `p9-main-path-recoverable-error-states-batch4b-ui-smoke`，覆盖双 viewport、首轮 500、retry 恢复、mocked-only、`unhandledApiRequests=0`；`node scripts/validate-frontend-ui.mjs` PASS；专项 smoke 2 tests PASS。 | 下一步可刷新深层页面 recoverable error state coverage 总结，或切入 code_chunks/QA 检索质量增强；本轮不刷新 full authority |
| Main path recoverable error states batch 4A | `Product-Luna` / `QA-Orion` / `FE-Pixel` / `Lead-Codex` | DONE / FOCUSED UI EVIDENCE | Product-Luna/Hilbert `019f1c7f-cb21-7711-988e-ba0f43ec81ee` 给出 `PASS_TO_IMPLEMENT`，建议四页但限定查询类失败；QA-Orion/Turing `019f1c7f-e539-7971-82a8-f4ea599c9442` 给出 `NEEDS_SPLIT`，要求 4A 先做 Dashboard、ProjectDetail、ScanTaskDetail，DependencyGraph 后置；`Dashboard` 显示 `仪表盘数据加载失败` / `仪表盘刷新失败，已保留上次成功数据`；`ProjectDetail` 项目、总览、仓库、扫描任务错误态有明确 retry 且列表刷新失败不清空旧数据；`ScanTaskDetail` 扫描报告、code_chunks 状态、修复治理时间线失败可局部 retry；新增 `p9-main-path-recoverable-error-states-batch4a-ui-smoke`，6 tests PASS，双 viewport、mocked-only、`unhandledApiRequests=0`；`node scripts/validate-frontend-ui.mjs` PASS。 | 下一步 batch 4B：补 `DependencyGraph` retry action 和图谱 recoverable smoke；本轮不刷新 full authority |
| Main path recoverable error states batch 3 | `Product-Luna` / `FE-Pixel` / `QA-Orion` / `QA-Gate` / `Lead-Codex` | DONE / FOCUSED UI EVIDENCE | Goodall-agent/Halley 原会话 `019f18ff-9d4a-7543-a98b-583162360fc9` 给出 `PASS_TO_IMPLEMENT`；恢复原 Goodall 会话追加复核为 `PASS_WITH_RISK`，指出 `Projects` 已有数据刷新失败未保留表格；已补 `项目刷新失败，已保留上次成功数据` 紧凑错误块、static gate 和 `projectsCachedRefresh` smoke；Product-Luna/Galileo 给出文案和非范围；FE-Pixel/Lorentz 真实开发 `Projects.tsx`；QA-Orion/Gibbs 要求专项失败/恢复 mock smoke；`Projects`、`ExecutionTasks`、`Artifacts` 查询失败均使用 `formatApiError` + `StateBlock tone="error"` + 明确 retry；新增 `p9-main-path-recoverable-error-states-batch3-ui-smoke`，覆盖双 viewport、首轮 500、缓存刷新失败、retry 恢复、mocked-only、`unhandledApiRequests=0`；`node scripts/validate-frontend-ui.mjs`、`npm --prefix web-console run build`、专项 smoke 8 tests、ExecutionTasks/Artifacts detail selection smoke、app shell smoke 和 scoped diff check 均 PASS。 | 下一步继续深层页面错误态：`Dashboard`、`ProjectDetail`、`ScanTaskDetail`、`DependencyGraph` 单独拆批；本轮不刷新 full authority |
| Report Evidence QA unverified citation verifier + full authority refresh | `Ops-Harbor` / `QA-Orion` / `QA-Gate` / `Lead-Codex` | DONE / HISTORICAL FULL PACKAGE | Goodall-agent/Halley 原会话首次复核要求先升级 release verifier/security regression 再刷新 full authority；Ops-Harbor/Linnaeus the 2nd 和 QA/Sec/Newton the 2nd 分别复核 verifier 与 security regression 缺口；`verify-release-evidence.sh` 已强制 `qaRequestCount=4`、verified citation 和 `unverifiedCitation` 的 `PARTIAL` / `RETRY_FAILED` / `uncitedCandidateCount>0` / `evidenceRefRequestBound=true`；`security-regression-check.sh` 增加旧计数、缺 unverified、错误 grounding/enforcement、0 未引用候选、未绑定 evidenceRef 等负例；完整 authority 包 `release-evidence/release-post-unverified-qa-citation-authority-20260701-135235` 曾通过 release profile、verifier 和 security regression。后续 raw Code QA、source-location probes 和 scan governance marker schema 已加严，该包现在仅作为 historical full package。 | 后续曾由 `release-evidence/p6-full-release-refresh-20260702-0845` 和 `release-evidence/20260702-191044` 接管；当前最终由 `release-evidence/release-current-schema-20260702-230650` 接管，继续 P9 UI 或 P6 code_chunks/QA 质量增强 |
| Goodall QA-Gate recovery for release authority refresh | `QA-Gate` / `Lead-Codex` | DONE / READ-ONLY GATE | 用户要求重新尝试 Goodall-agent；已恢复 `Goodall-agent/Halley` 原会话 `019f18ff-9d4a-7543-a98b-583162360fc9` 并完成只读复核；Goodall 当时确认 `release-evidence/release-p12pre-full-authority-20260701-024042` 仍可通过 verifier，但其 `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK` 仍是旧 `qaRequestCount=2` schema，未证明 `unverifiedCitation`；Goodall 要求先升级 `verify-release-evidence.sh` / `security-regression-check.sh` 的 unverified citation 强校验，再刷新 full authority。 | 后续曾由 `release-evidence/p6-full-release-refresh-20260702-0845` 和 `release-evidence/20260702-191044` 刷新；当前最终 authority 为 `release-evidence/release-current-schema-20260702-230650` |
| Main path recoverable error states batch 2 | `FE-Pixel` / `Lead-Codex` | DONE / FOCUSED UI EVIDENCE | FE-Pixel/Dirac the 2nd 真实开发 `AgentChat.tsx`；Lead-Codex 实现 `AutoRepairs.tsx` 和 `validate-frontend-ui.mjs`；AgentChat 项目/会话/消息/闭环任务失败可见可重试；AutoRepairs 任务/仓库/执行证据/PATCH_READY 审计证据失败可见可重试；`node scripts/validate-frontend-ui.mjs` PASS；`npm --prefix web-console run build` PASS；`CI=true make agent-chat-closure-rail-ui-smoke` PASS；`CI=true make agent-chat-audit-ui-smoke` PASS；`CI=true make patch-ready-ui-smoke` PASS；`CI=true make report-autorepair-candidate-ui-smoke` PASS；diff check PASS | 可继续剩余深层页面错误态收口，或刷新 full release authority 以吸收近期 focused UI/security 增量 |
| Main path recoverable error states batch 1 | `FE-Pixel` / `Lead-Codex` | DONE / FOCUSED UI EVIDENCE | FE-Pixel/Hubble the 2nd 真实开发 `AgentTasks.tsx`；Lead-Codex 实现 `PrReviews.tsx`、`CiDiagnostics.tsx` 和 `validate-frontend-ui.mjs`；三页查询失败使用 `formatApiError` + `StateBlock tone="error"` + retry；`node scripts/validate-frontend-ui.mjs` PASS；`npm --prefix web-console run build` PASS；`CI=true make agent-tasks-detail-selection-ui-smoke` PASS；`CI=true make pr-reviews-detail-selection-ui-smoke` PASS；`CI=true make ci-diagnostics-detail-selection-ui-smoke` PASS；diff check PASS | 下一批评估 `AgentChat` 项目/会话/消息/闭环加载失败态，以及 `AutoRepairs` 列表/仓库/execution detail 加载失败态 |
| Report Evidence QA unverified citation UI state | `Product-Luna` / `FE-Pixel` / `QA-Orion` / `Lead-Codex` | DONE / FOCUSED UI EVIDENCE | QA-Orion/Bohr the 2nd 建议补未验证引用态；`report-evidence-drawer-smoke.spec.ts` 新增 `PARTIAL + RETRY_FAILED + citedByAnswer=false` mock 分支和 `submitUnverifiedQaAndAssert`；`validate-frontend-ui.mjs` 锁住 unverified marker schema；`node scripts/validate-frontend-ui.mjs` PASS；`CI=true make report-evidence-qa-citation-ui-smoke` PASS，marker 证明 `qaRequestCount=4`、`unverifiedCitation.groundingStatuses=["PARTIAL"]`、`citationEnforcementStatuses=["RETRY_FAILED"]`、`uncitedCandidateCount=2`、`evidenceRefRequestBound=true`；`npm --prefix web-console run build` PASS；`mvn -q -Dtest=com.sourcelens.CodeQaControllerTest test` PASS；Goodall-agent/FE-Pixel `PASS_WITH_NOTES` | 下一步推进 FE-Pixel 建议的“主链路可恢复错误态统一化”；Product-Luna 的 full authority refresh 建议后置到下一次完整 release/nightly profile |
| P12-pre native git runtime security boundary closure | `Sec-Sentinel` / `Ops-Harbor` / `QA-Orion` / `QA-Gate` / `BE-Forge` / `Lead-Codex` | DONE / FOCUSED SECURITY EVIDENCE | Ops-Harbor/Hooke the 2nd、Sec-Sentinel/Harvey the 2nd、QA-Orion/Tesla the 2nd、Goodall-agent/Zeno the 2nd 均要求补 native system git 生产边界；`GitService` 执行侧 `allow-local-file` fail-closed、匿名 git 环境隔离、错误脱敏、缺 git 清晰失败；`ScanTaskService` branch 入库前校验；Docker runtime 安装 git；preflight/smoke/security-regression 加门禁；targeted backend tests PASS；security regression PASS；public repo smoke PASS scanTaskId `169` | 本轮 focused security evidence 曾被 historical full packages 覆盖；当前最终由 `release-evidence/release-current-schema-20260702-230650` 接管 full authority。GitHub App drill、GitHub webhook drill、真实 LLM provider run 仍后置 |
| P12-pre full authority refresh with backup/rollback + public repo clone stability | `Product-Luna` / `Ops-Harbor` / `QA-Orion` / `QA-Gate` / `BE-Forge` / `Lead-Codex` | DONE / HISTORICAL FULL PACKAGE | Product-Luna/Mencius the 2nd `REFRESH_NOW`；Ops-Harbor/Parfit the 2nd 要求完整 release profile；QA-Orion/Beauvoir the 2nd 要求 0 failure/0 warning 和 backup/rollback/public repo 全 OK；Goodall-agent/Copernicus the 2nd 首次 `BLOCKED`，指出 `release-p12pre-full-authority-20260701-015543` 失败包不可作为 authority；`GitService` 修复匿名 GitHub clone 稳定性；standalone `make public-repo-smoke` against 19080 PASS；full package `release-evidence/release-p12pre-full-authority-20260701-024042` 当时 PASS；verifier PASS；`./scripts/security-regression-check.sh` PASS；Goodall-agent/Zeno the 2nd final `PASS` | 已被 `release-evidence/release-post-unverified-qa-citation-authority-20260701-135235` supersede；该旧包缺新版 `unverifiedCitation` release marker，在当前 verifier 下只保留为 historical-only |
| P12-pre focused backup/rollback evidence closure | `Product-Luna` / `Ops-Harbor` / `QA-Orion` / `QA-Gate` / `Lead-Codex` | DONE / FOCUSED OPS EVIDENCE | Product-Luna/Raman the 2nd 建议优先关闭恢复/回滚信任缺口；Goodall-agent `019f18ff-9d4a-7543-a98b-583162360fc9` `PASS` 允许继续；QA-Orion/Descartes the 2nd 指出 `OK => .log` verifier gap；Ops-Harbor/Einstein the 2nd 确认 focused local profile 路径；`make backup-restore-drill` PASS；严格 `make rollback-preflight` PASS；`release-evidence/p12-pre-backup-rollback-focused-20260701-012427` verifier PASS；`./scripts/security-regression-check.sh` PASS | 曾被 historical full package `release-evidence/release-post-unverified-qa-citation-authority-20260701-135235` 吸收；focused 包保留为下一次 full refresh 的 backup/rollback 输入参考 |
| Report Evidence QA Citation release verifier + full authority refresh | `Product-Luna` / `Ops-Harbor` / `QA-Orion` / `QA-Gate` / `Lead-Codex` | DONE / HISTORICAL FULL PACKAGE | Product-Luna/Ohm the 2nd `IMPLEMENT_NOW`；Ops-Harbor/Pasteur the 2nd `IMPLEMENT_NOW`；QA-Orion/Popper the 2nd 负向矩阵；Goodall-agent/Halley `PASS_WITH_CONCERNS` 后刷新 full evidence；`./scripts/security-regression-check.sh` PASS；focused package `release-evidence/report-evidence-qa-citation-verifier-20260701-072236` verifier PASS；full package `release-evidence/release-post-qa-citation-verifier-20260701-073909` release profile PASS + verifier PASS | 已先被 `release-evidence/release-p12pre-full-authority-20260701-024042` supersede，再被 `release-evidence/release-post-unverified-qa-citation-authority-20260701-135235` supersede；旧 `release-post-patch-ready-schema-20260701-053701` 降级为 historical-only |
| Report Evidence QA Citation UI | `Product-Luna` / `QA-Orion` / `FE-Pixel` / `Ops-Harbor` / `Lead-Codex` / `QA-Gate` | DONE / FOCUSED UI EVIDENCE | Product-Luna/Singer the 2nd `IMPLEMENT_NOW`；QA-Orion/Wegener the 2nd `TESTABLE`；扩展 `report-evidence-drawer-smoke`，新增 `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK`；`node scripts/validate-frontend-ui.mjs` PASS；`CI=true make report-evidence-qa-citation-ui-smoke` PASS；marker 证明 `qaRequestCount=2`、`citationCount=2`、`groundingStatuses=["VERIFIED"]`、`citationEnforcementStatuses=["DIRECT_VERIFIED"]`、`evidenceRef.requestBound=true`、`unhandledApiRequests=0`、`fullReleaseAuthorityRefreshed=false` | Goodall-agent/Halley final review `PASS`；当前不刷新 full release authority |
| AgentChat closure rail | `FE-Pixel` / `QA-Orion` / `Product-Luna` / `QA-Gate` / `Lead-Codex` | DONE / FOCUSED UI EVIDENCE | FE-Pixel/Hegel the 2nd `IMPLEMENT_NOW`；QA-Orion/Pauli the 2nd `TESTABLE`；Goodall-agent/Halley final review `PASS`；新增 `AgentChatClosureRail`、AgentTasks `taskId` URL deep link、`agent-chat-closure-rail-ui-smoke`、`AGENT_CHAT_CLOSURE_RAIL_SMOKE_OK` marker；`node scripts/validate-frontend-ui.mjs` PASS；`npm --prefix web-console run build` PASS；`CI=true make agent-chat-closure-rail-ui-smoke` PASS；`CI=true make agent-chat-audit-ui-smoke` PASS；`CI=true make agent-tasks-detail-selection-ui-smoke` PASS | 下一候选：Report Evidence -> QA Citation mocked UI smoke；当前不刷新 full release authority |
| AutoRepair source scan bridge | `FE-Pixel` / `Product-Luna` / `QA-Orion` / `QA-Gate` / `Lead-Codex` | DONE / FOCUSED UI EVIDENCE | FE-Pixel/Ampere the 2nd 建议最小来源桥；Product-Luna/Epicurus the 2nd 的 AgentChat 闭环栏转入下一候选；QA-Orion/Helmholtz the 2nd 提供 QA citation smoke 候选；Goodall-agent/Halley final review `PASS`；`AutoRepairSourceBridge`、source bridge CSS、PATCH_READY smoke `scanSourceBridge` marker、`node scripts/validate-frontend-ui.mjs` PASS、`npm --prefix web-console run build` PASS、`CI=true make patch-ready-ui-smoke` PASS | 可进入下一 P9 候选；当前不刷新 full release authority |
| Full release evidence refresh after PATCH_READY schema | `Product-Luna` / `Ops-Harbor` / `QA-Orion` / `QA-Gate` / `Lead-Codex` | DONE / HISTORICAL FULL PACKAGE | Product-Luna/Boyle `REFRESH_NOW`；Ops-Harbor/Banach 建议使用稳定 backend jar并运行完整 `release` profile；QA-Orion/Heisenberg the 2nd 定义 PASS/BLOCK；`release-evidence/release-post-patch-ready-schema-20260701-053701` 曾作为 PATCH_READY schema current authority | 先被 `release-evidence/release-post-qa-citation-verifier-20260701-073909` supersede，后又被 `release-evidence/release-p12pre-full-authority-20260701-024042` supersede；只保留为 historical-only |
| PATCH_READY release evidence contract upgrade | `Product-Luna` / `Ops-Harbor` / `QA-Orion` / `QA-Gate` / `Lead-Codex` | DONE / SUPERSEDED BY FULL REFRESH | Product-Luna/Carson `IMPLEMENT_NOW`；Ops-Harbor/Newton `CONCERNS`：verifier/security regression 旧 `keyboardOpen=true` schema 漂移；QA-Orion/Socrates 要求 hard require `keyboardOpen.enter/space` 和 `sharedSelectableRow`，并把旧 full evidence 降级为 historical-only；`verify-release-evidence.sh` 与 `security-regression-check.sh` 已升级；`CI=true make patch-ready-ui-smoke` PASS；`./scripts/security-regression-check.sh` PASS；旧 full evidence 预期失败；Goodall-agent/Halley final review `PASS` | 已先由 `release-evidence/release-post-patch-ready-schema-20260701-053701` 刷新，再由 `release-evidence/release-post-qa-citation-verifier-20260701-073909` supersede，当前由 `release-evidence/release-p12pre-full-authority-20260701-024042` 接管 |
| AutoRepairs shared selectable row adoption | `Product-Luna` / `FE-Pixel` / `QA-Orion` / `QA-Gate` / `Lead-Codex` | DONE | Product-Luna/Lagrange `IMPLEMENT_NOW`；FE-Pixel/Archimedes 要求删除本地 `KeyboardEvent` / `handleRowKeyDown`、接入 helper、补 detail labelled region、CSS 去重；QA-Orion/Hooke 要求 PATCH_READY focused gate 并新增 `sharedSelectableRow` marker；`AutoRepairs.tsx` 已导入 `createSelectableTableRowProps`，移除本地 keyboard handler，新增 `selectedDetailId/selectedTitleId` 和 labelled region；`node scripts/validate-frontend-ui.mjs` PASS；`npm --prefix web-console run build` PASS；`CI=true make patch-ready-ui-smoke` PASS，marker 包含 `sharedSelectableRow`、Enter/Space、PR gate 和 attemptSplit；Goodall-agent/Halley final review `PASS` | 当前 full evidence 待新 verifier schema 下重新生成；旧 `release-post-autorepair-detail-action-20260701-004333` 只保留为历史 full 包 |
| AuditLogs shared selectable row adoption | `Product-Luna` / `FE-Pixel` / `QA-Orion` / `QA-Gate` / `Lead-Codex` | DONE | Product-Luna/Fermat `IMPLEMENT_NOW`；FE-Pixel/Pauli 要求删除本地 `KeyboardEvent` / `isNestedInteractiveTarget` / 三套 `handle*RowKeyDown`、三表接入 helper、三 Drawer labelled region、CSS 去重；QA-Orion/Noether 要求 AuditLogs focused gate 并新增三源 `sharedSelectableRow` marker；`AuditLogs.tsx` 已导入 `createSelectableTableRowProps`，移除本地 keyboard handler，新增三组 detail/title id 和 labelled region；`node scripts/validate-frontend-ui.mjs` PASS；`npm --prefix web-console run build` PASS；`CI=true make audit-logs-detail-selection-ui-smoke` PASS，marker 包含三源 `sharedSelectableRow`；Goodall-agent/Halley final review `PASS` | 后续谨慎评估 `AutoRepairs` shared helper migration；旧 full package `release-evidence/release-post-autorepair-detail-action-20260701-004333` 已降级为 historical-only，当前不声明新的 full release authority |
| Artifacts shared selectable row adoption | `Product-Luna` / `FE-Pixel` / `QA-Orion` / `QA-Gate` / `Lead-Codex` | DONE | Product-Luna/Dewey `IMPLEMENT_NOW`；FE-Pixel/Kierkegaard 要求删除本地 `KeyboardEvent` / `handleRowKeyDown`、接入 helper、补 Drawer labelled region、CSS 去重；QA-Orion/Galileo 要求 Artifacts focused gate 并新增 `sharedSelectableRow` marker；`Artifacts.tsx` 已导入 `createSelectableTableRowProps`，移除本地 keyboard handler，新增 `selectedDetailId/selectedTitleId` 和 labelled region；`node scripts/validate-frontend-ui.mjs` PASS；`npm --prefix web-console run build` PASS；`CI=true make artifacts-detail-selection-ui-smoke` PASS，marker 包含 `sharedSelectableRow`；Goodall-agent/Halley final review `PASS` | 后续按小批次评估 `AuditLogs` 或 `AutoRepairs`；旧 full package `release-evidence/release-post-autorepair-detail-action-20260701-004333` 已降级为 historical-only，当前不声明新的 full release authority |
| ExecutionTasks shared selectable row adoption | `Product-Luna` / `FE-Pixel` / `QA-Orion` / `QA-Gate` / `Lead-Codex` | DONE | Product-Luna/Gibbs `IMPLEMENT_NOW / NARROW_SCOPE`；FE-Pixel/Harvey 完成 helper adoption、detail labelled region、CSS 去重和 validator 切换；QA-Orion/Schrodinger 要求 focused gate 并新增 `sharedSelectableRow` marker；Goodall-agent/Halley 首次复审 `BLOCKED`，要求补 `assertLinkedDetailRegion`、`sharedSelectableRow` marker、validator marker gate 和治理文档；修复后 `node scripts/validate-frontend-ui.mjs` PASS，`make frontend-ui-check` PASS，`npm --prefix web-console run build` PASS，`CI=true make execution-tasks-detail-selection-ui-smoke` PASS，Goodall final review `PASS` | 后续按小批次评估 `Artifacts` 或 `AuditLogs`；旧 full package `release-evidence/release-post-autorepair-detail-action-20260701-004333` 已降级为 historical-only，当前不声明新的 full release authority |
| AgentTasks shared selectable row adoption | `Product-Luna` / `FE-Pixel` / `QA-Orion` / `QA-Gate` / `Lead-Codex` | DONE | Product-Luna/Beauvoir `IMPLEMENT_NOW / NARROW_SCOPE`；FE-Pixel/Popper 完成 helper adoption、detail labelled region、CSS 去重和 validator 切换；QA-Orion/Kant 要求 focused gate 并新增 `sharedSelectableRow` marker；`AgentTasks.tsx` 已导入 `createSelectableTableRowProps`，移除本地 keyboard handler，新增 `selectedDetailId/selectedTitleId` 和 labelled region；`node scripts/validate-frontend-ui.mjs` PASS；`npm --prefix web-console run build` PASS；`CI=true make agent-tasks-detail-selection-ui-smoke` PASS；Goodall-agent/Halley final review `PASS`，确认 focused-only 验证足够 | 后续按小批次评估 `ExecutionTasks` 或 `Artifacts`，不一次性迁移高差异页面；旧 full package `release-evidence/release-post-autorepair-detail-action-20260701-004333` 已降级为 historical-only，当前不声明新的 full release authority |
| CiDiagnostics shared selectable row adoption | `Product-Luna` / `FE-Pixel` / `QA-Orion` / `QA-Gate` / `Lead-Codex` | DONE | Product-Luna/Carver `IMPLEMENT_NOW`；FE-Pixel/Helmholtz 要求只迁移行选择原语、补 detail region、不改 repair readiness；QA-Orion/Hypatia 要求 CI focused smoke；`CiDiagnostics.tsx` 已导入 `createSelectableTableRowProps`，移除本地 keyboard handler，新增 `selectedDetailId/selectedTitleId` 和 labelled region；`node scripts/validate-frontend-ui.mjs` PASS；`cd web-console && npm run build` PASS；`CI=true make ci-diagnostics-detail-selection-ui-smoke` PASS；`CI=true make app-shell-ui-smoke` PASS；Goodall-agent/Halley final review `PASS`，确认 focused-only 验证足够 | 后续按小批次评估 `AgentTasks` 或其他同构页面，不一次性迁移高差异页面；旧 full package `release-evidence/release-post-autorepair-detail-action-20260701-004333` 已降级为 historical-only，当前不声明新的 full release authority |
| Selectable table row shared pattern first adoption | `Product-Luna` / `FE-Pixel` / `QA-Orion` / `QA-Gate` / `Lead-Codex` | DONE | Product-Luna/Peirce `IMPLEMENT_NOW / NARROW_SCOPE`；FE-Pixel/Bohr 建议第一批只接入 `PrReviews` + `IssueDecomposition`；QA-Orion/Euler 要求 static + build + 接入页 smoke；Goodall-agent/Halley final review `PASS`；新增 `selectableTableRow.ts`，统一 nested interactive guard、Enter/Space、`tabIndex`、`aria-selected`、可选 `aria-controls`、stable label；新增 `.sl-selectable-table-card`；PR/Issue focused smoke PASS；app-shell smoke PASS | 后续按小批次迁移 `CiDiagnostics` 或 `AgentTasks`，不一次性改高差异页面；旧 full package `release-evidence/release-post-autorepair-detail-action-20260701-004333` 已降级为 historical-only，当前不声明新的 full release authority |
| IssueDecomposition detail selection accessibility | `Product-Luna` / `FE-Pixel` / `QA-Orion` / `QA-Gate` / `Lead-Codex` | DONE | Product-Luna/Plato 建议优先推进并要求键盘、视觉/ARIA selected、标题/详情匹配、失败态说明和 Plan Signal 计数一致；FE-Pixel/Anscombe 要求补 `.sl-issue-table-card` pointer/focus/selected CSS 和 Ant Select keydown guard；QA-Orion/Erdos 要求 dedicated mock-only smoke；Goodall-agent/Halley 首次复核 `BLOCKED` 仅因治理文档缺失，补档后 final review `PASS`；`IssueDecomposition.tsx` 行级 `tabIndex=0`、`aria-selected`、`aria-controls`、Enter/Space、Copy/Export stopPropagation、tasks stale clearing、detail labelled region；`node scripts/validate-frontend-ui.mjs` PASS；`cd web-console && npm run build` PASS；`CI=true make issue-decomposition-detail-selection-ui-smoke` PASS；`CI=true make app-shell-ui-smoke` PASS | 继续 P9 跨页面 detail-selection 模式抽象或剩余深层页面 smoke；旧 full package `release-evidence/release-post-autorepair-detail-action-20260701-004333` 已降级为 historical-only，当前不声明新的 full release authority |
| PR Reviews detail selection and AutoRepair context binding | `Product-Luna` / `FE-Pixel` / `QA-Orion` / `QA-Gate` / `Lead-Codex` | DONE | Product-Luna/Locke 建议优先推进并要求 AutoRepair query 保留 `projectId`；FE-Pixel/Kepler 要求 PR 表格 focus/selected CSS、detail region 和 `aria-controls`；QA-Orion/Hume 要求 dedicated mock-only smoke；Goodall-agent/Halley final review `PASS`；`PrReviews.tsx` 行级 `tabIndex=0`、`aria-selected`、`aria-controls`、Enter/Space、PR title stopPropagation、reanalyze isolation；新增 repair readiness card 和 `projectId` query；`node scripts/validate-frontend-ui.mjs` PASS；`cd web-console && npm run build` PASS；`CI=true make pr-reviews-detail-selection-ui-smoke` PASS；`CI=true make app-shell-ui-smoke` PASS | 下一步继续 P9：IssueDecomposition 可访问详情选择与复制/导出隔离；旧 full package `release-evidence/release-post-autorepair-detail-action-20260701-004333` 已降级为 historical-only，当前不声明新的 full release authority |
| CI Diagnostics detail selection and repair readiness | `Product-Luna` / `FE-Pixel` / `QA-Orion` / `QA-Gate` / `Lead-Codex` | DONE | Product-Luna/Aquinas `IMPLEMENT_NOW / NARROW_SCOPE`；FE-Pixel/Wegener 判定缺 `tabIndex/aria-selected/onKeyDown/row label/focus-visible`；QA-Orion/Ramanujan 要求 dedicated mock-only smoke；Goodall-agent/Halley final review `PASS`；`CiDiagnostics.tsx` 行级 `tabIndex=0`、`aria-selected`、Enter/Space、workflow link stopPropagation、reanalyze isolation；新增 repair readiness card；`node scripts/validate-frontend-ui.mjs` PASS；`cd web-console && npm run build` PASS；`CI=true make ci-diagnostics-detail-selection-ui-smoke` PASS；`CI=true make app-shell-ui-smoke` PASS | 下一步继续 P9：PrReviews/IssueDecomposition 等高密度页面可访问详情选择；旧 full package `release-evidence/release-post-autorepair-detail-action-20260701-004333` 已降级为 historical-only，当前不声明新的 full release authority |
| AuditLogs three-source detail selection accessibility | `Product-Luna` / `FE-Pixel` / `QA-Orion` / `Lead-Codex` | DONE | Product-Luna/McClintock `IMPLEMENT_NOW / NARROW_SCOPE`；FE-Pixel/Euclid 判定三张表缺 `onRow/tabIndex/aria-selected/Enter/Space/选中态`；QA-Orion/Linnaeus 要求 dedicated smoke 和 marker；`AuditLogs.tsx` 三源表格行级 `tabIndex=0`、`aria-selected`、Enter/Space、详情/资源/对话/扫描按钮 stopPropagation；`node scripts/validate-frontend-ui.mjs` PASS；`cd web-console && npm run build` PASS；`CI=true make audit-logs-detail-selection-ui-smoke` PASS | 下一步继续 P9：可转向 CiDiagnostics/PrReviews/IssueDecomposition 等高密度页面，或开始提炼跨表格 detail-selection 模式；旧 full package `release-evidence/release-post-autorepair-detail-action-20260701-004333` 已降级为 historical-only，当前不声明新的 full release authority |
| Artifacts list accessible detail/preview selection | `Product-Luna` / `FE-Pixel` / `QA-Orion` / `QA-Gate` / `Lead-Codex` | DONE | Product-Luna/Curie `IMPLEMENT_NOW / NARROW_SCOPE`；FE-Pixel/Descartes 要求保留 Drawer、补行级键盘/ARIA/冒泡隔离；QA-Orion/Kuhn 要求 dedicated smoke 和 marker；恢复 Goodall-agent/Halley `019f18ff-9d4a-7543-a98b-583162360fc9`，结论 `IMPLEMENT_NOW`；`Artifacts.tsx` 行级 `tabIndex=0`、`aria-selected`、Enter/Space、详情/来源/预览/下载 stopPropagation；`node scripts/validate-frontend-ui.mjs` PASS；`cd web-console && npm run build` PASS；`CI=true make artifacts-detail-selection-ui-smoke` PASS | 下一步继续 P9：AuditLogs 或其他高密度页面的表格/详情可访问性与可读性；旧 full package `release-evidence/release-post-autorepair-detail-action-20260701-004333` 已降级为 historical-only，当前不声明新的 full release authority |
| ExecutionTasks table detail action and accessible selection | `Product-Luna` / `FE-Pixel` / `QA-Orion` / `Lead-Codex` | DONE | Product-Luna/Bernoulli `IMPLEMENT_NOW / NARROW_SCOPE`；FE-Pixel/Parfit 要求 dedicated smoke、行级键盘和局部 CSS；QA-Orion/Russell 要求 focused evidence 不接入 release evidence；`ExecutionTasks.tsx` 操作列 `详情`、`aria-selected`、`tabIndex=0`、Enter/Space 选择、标题/来源/产物/取消冒泡隔离；`make frontend-ui-check` PASS；`cd web-console && npm run build` PASS；`CI=true make execution-tasks-detail-selection-ui-smoke` PASS；`CI=true make app-shell-ui-smoke` PASS；targeted `git diff --check` PASS | 下一步继续 P9：Artifacts 产物列表深交互可访问性，或提炼跨表格 detail-selection 共享模式；旧 full package `release-evidence/release-post-autorepair-detail-action-20260701-004333` 已降级为 historical-only，当前不声明新的 full release authority |
| AgentTasks table accessible detail selection | `Product-Luna` / `FE-Pixel` / `QA-Orion` / `QA-Gate` / `Lead-Codex` | DONE | Goodall-agent `019f18ff-9d4a-7543-a98b-583162360fc9` retry `PASS` 并推荐该最小 P9 增量；Product-Luna/Hegel `P9 / NARROW_SCOPE`；FE-Pixel/Nietzsche 要求行级键盘与局部 CSS；QA-Orion/Pasteur 要求 focused smoke；`AgentTasks.tsx` 行级 `tabIndex=0`、`aria-selected`、Enter/Space、详情按钮 aria label 和按钮冒泡隔离；`make frontend-ui-check` PASS；`cd web-console && npm run build` PASS；`CI=true make agent-tasks-detail-selection-ui-smoke` PASS；`CI=true make app-shell-ui-smoke` PASS；targeted `git diff --check` PASS | 下一步继续 P9：ExecutionTasks 或 Artifacts 表格/详情一致性；旧 full package `release-evidence/release-post-autorepair-detail-action-20260701-004333` 已降级为 historical-only，当前不声明新的 full release authority |
| AutoRepairs table detail action and accessible selection | `Product-Luna` / `FE-Pixel` / `QA-Orion` / `Lead-Codex` | DONE / HISTORICAL FULL PACKAGE | Product-Luna/Huygens `IMPLEMENT_NOW / NARROW_SCOPE`；FE-Pixel/Poincare 最小实现建议；QA-Orion/Franklin `CONCERNS -> fixed`；`AutoRepairs.tsx` 操作列 `详情`、`aria-selected`、`tabIndex=0`、Enter/Space 选择；`node scripts/validate-frontend-ui.mjs` PASS；`cd web-console && npm run build` PASS；`CI=true make patch-ready-ui-smoke` PASS；当时 full package `release-evidence/release-post-autorepair-detail-action-20260701-004333` verifier PASS | 后续 shared row schema 已升级为 `keyboardOpen.enter/space + sharedSelectableRow`，该旧 full 包在新 verifier 下只能保留为 historical-only |
| Historical full release evidence after AutoRepairs detail action | `Ops-Harbor` / `QA-Orion` / `Product-Luna` / `Lead-Codex` | DONE / SUPERSEDED BY SCHEMA | Full package `release-evidence/release-post-autorepair-detail-action-20260701-004333`；当时 verifier PASS；`required_failures=0`、`optional_warnings=0`、`skipped=5`；marker 使用旧 `tableDetailAction.keyboardOpen=true` 口径且缺 `sharedSelectableRow` | 新 verifier schema 会拒绝旧 marker；下一份新的 full release authority 必须重新生成 |
| ScanTaskDetail governance stage rail | `Product-Luna` / `FE-Pixel` / `QA-Orion` / `Lead-Codex` | DONE | Product-Luna/Boole 推荐报告页阶段化治理轨道；FE-Pixel/Copernicus 建议后续收敛 AutoRepairs 表格详情可达性；QA-Orion/Avicenna 将真实 LLM provider run 标记为后续证据缺口；`node scripts/validate-frontend-ui.mjs` PASS；`cd web-console && npm run build` PASS；`make scan-governance-timeline-ui-smoke` PASS；focused package `release-evidence/scan-governance-stage-rail-20260701-000240` PASS；full package `release-evidence/release-post-governance-stage-rail-20260701-000851` PASS | 下一步可收敛 AutoRepairs 表格显式详情入口，或在具备真实 provider key 后补 `llm-provider-run` |
| Historical full release evidence after governance stage rail | `Ops-Harbor` / `QA-Orion` / `Product-Luna` / `Lead-Codex` | DONE / SUPERSEDED BY SCHEMA | Full package `release-evidence/release-post-governance-stage-rail-20260701-000851`；当时 verifier PASS；`required_failures=0`、`optional_warnings=0`、`skipped=5`；`scan-governance-timeline-ui-smoke=OK`；stageRail 五阶段完整 | 后续旧包 `release-evidence/release-post-autorepair-detail-action-20260701-004333` 也已被新 PATCH_READY marker schema 降级；该包只保留为 scan governance stage rail 历史证据 |
| Historical full release evidence after attemptSplit verifier | `Ops-Harbor` / `QA-Orion` / `Product-Luna` / `Lead-Codex` | DONE / SUPERSEDED BY SCHEMA | Jason full profile boundary；Heisenberg verifier schema review；Pascal product authority review；full package `release-evidence/release-post-attempt-split-verifier-20260630-232950`；当时 verifier PASS；`required_failures=0`、`optional_warnings=0`、`skipped=5`；`PATCH_READY_UI_SMOKE_OK.reviewGate + attemptSplit` 完整 | 当前不声明新的 full release authority；下一份必须在新 PATCH_READY `keyboardOpen.enter/space + sharedSelectableRow` schema 下重新生成 |
| AutoRepair PR ExecutionAttempt split | `Arch-Atlas` / `BE-Forge` / `QA-Orion` / `Lead-Codex` | DONE | Raman SHOULD_SPLIT；Planck IMPLEMENT_NOW；Chandrasekhar TESTABLE；PR queue starts new attempt；async PR uses attempt-level steps/success/fail/cancel；failed PR attempt does not invalidate old patch evidence；targeted backend tests PASS；security regression PASS；scoped `git diff --check` PASS | 真实 GitHub App PR E2E 仍后置；后续可在 UI 中展示 attempt timeline |
| AutoRepair async submit-pr runtime revalidation | `Sec-Sentinel` / `BE-Forge` / `QA-Orion` / `QA-Gate` / `Lead-Codex` | DONE | Tesla security TOCTOU review；Turing backend minimal design；Herschel QA matrix；restored Goodall-agent `019f120d-14ea-7b83-894c-59e3f802fe88` ACCEPT_WITH_NOTES；async preflight before token；`AUTO_REPAIR_PR_REJECTED` vs `AUTO_REPAIR_PR_FAILED` 分类；targeted backend tests PASS；security regression PASS；scoped `git diff --check` PASS | PR ExecutionAttempt split 已由上方工作流关闭；真实 GitHub App PR E2E 仍后置 |
| AutoRepair submit-pr backend hard gate | `Product-Luna` / `Sec-Sentinel` / `BE-Forge` / `QA-Orion` / `QA-Gate` / `Lead-Codex` | DONE | Sagan product gate；Aristotle security fail-closed；Leibniz backend state review；Ptolemy QA matrix；Goodall-agent `019f120d-14ea-7b83-894c-59e3f802fe88` PARTIAL -> PASS_WITH_NOTES；targeted backend tests PASS；security regression PASS；scoped `git diff --check` PASS | Async 二次复验已由上方工作流关闭；后续可做 PR ExecutionTask 阶段拆分；真实 GitHub App PR E2E 仍后置 |
| AutoRepair PATCH_READY PR review hard gate | `Product-Luna` / `FE-Pixel` / `QA-Orion` / `Sec-Sentinel` / `QA-Gate` / `Lead-Codex` | DONE | Ohm product hard-gate review；Einstein FE minimal path；Feynman QA smoke matrix；Cicero security boundary；restored Goodall-agent `019f120d-14ea-7b83-894c-59e3f802fe88` PARTIAL -> fixed；`CI=true make patch-ready-ui-smoke` PASS with `reviewGate.missingEvidenceBlocked=true`、`manualCandidateScanTaskWarningOnly=true`、`submitPrCount=0`、双 viewport；`node scripts/validate-frontend-ui.mjs` PASS；`npm run build` PASS；targeted `git diff --check` PASS | 后端 submit-pr 硬校验已由上方工作流关闭；真实 GitHub App PR E2E 继续后置 |
| Report evidence to AutoRepair candidate payload gate | `Product-Luna` / `FE-Pixel` / `QA-Orion` / `Lead-Codex` | DONE | Hilbert PR gate direction；Ampere governance rail direction deferred；Gauss candidate payload gate accepted；`CI=true make report-autorepair-candidate-ui-smoke` PASS；`REPORT_AUTOREPAIR_CANDIDATE_UI_SMOKE_OK` 证明 `createPayloadBound=true`、`createRequestCount=2`、`unhandledApiRequests=0`、双 viewport；`node scripts/validate-frontend-ui.mjs` PASS；`npm run build` PASS | PR 前人工复核门禁已由上方 hard gate 关闭；报告治理时间线阶段化轨道仍可作为后续 P9 增量 |
| App Shell 全局 UI smoke gate | `FE-Pixel` / `QA-Orion` / `AI-Vector` / `Lead-Codex` | DONE | Nash direction、Lovelace QA matrix、Goodall-agent/Confucius `PARTIAL` accepted as provider gap；`CI=true make app-shell-ui-smoke` PASS；`APP_SHELL_UI_SMOKE_OK` 证明 12 路由、双 viewport、mocked-only、未 mock API 0、topbar/page heading 未裁切、primary button 白字；`node scripts/validate-frontend-ui.mjs` PASS；`npm run build` PASS | 继续 P9 深层真实交互 UI；真实 LLM provider run 单独补 evidence，不与 UI smoke 混用 |
| Historical full release evidence after Dashboard PNG artifact gate | `Ops-Harbor` / `QA-Gate` / `Sec-Sentinel` / `FE-Pixel` / `Lead-Codex` | DONE / SUPERSEDED | `release-evidence/release-post-dashboard-png-artifact-20260630-201510`；当时 verifier PASS；`summary.md` required failures 0 / optional warnings 0 / skipped 5；`PUBLIC_REPO_SMOKE_OK` 证明 `rawScanContract.schemaVersion=2`、Code QA grounding `VERIFIED` 和 scanTask 绑定；`PUBLIC_REPO_UI_SMOKE_OK` 证明 3 viewport、Report Evidence Drawer、QA evidenceRef、Scan Governance Timeline；`DASHBOARD_NEXT_ACTION_SMOKE_OK` 绑定两张 `600` PNG；Dalton `ACCEPT`，Goodall/Laplace `PASS_WITH_NOTES` | 已被 `release-evidence/release-post-attempt-split-verifier-20260630-232950` supersede；该行仅保留 Dashboard PNG artifact gate 历史证据 |
| Dashboard next action PNG artifact release verifier | `Ops-Harbor` / `QA-Gate` / `Sec-Sentinel` / `FE-Pixel` / `Lead-Codex` | DONE | Volta `PARTIAL` accepted；release wrapper 传受控 `${RUN_DIR}/dashboard-next-action-ui-smoke`；verifier 读取 PNG 本体并加入 allowlist；focused package `dashboard-next-action-png-artifact-gate-20260630-194014` PASS；security regression PASS | 下一次 full release/nightly evidence 自然包含 PNG artifact 校验；后续可扩展更多分支截图，但不阻塞当前主线 |
| Dashboard next action visual evidence hardening | `FE-Pixel` / `QA-Orion` / `QA-Gate` / `Sec-Sentinel` / `Lead-Codex` | DONE | Mendel `PARTIAL` accepted；Goodall-agent retry `PARTIAL` accepted；`visualEvidence` marker 新增 PNG 像素多样性、截图尺寸、panel/title/button 边界和按钮白字；`CI=true make dashboard-next-action-ui-smoke` PASS；`./scripts/security-regression-check.sh` PASS | P1 已由 `Dashboard next action PNG artifact release verifier` 关闭 |
| Focused public repo Code QA marker evidence refresh | `Ops-Harbor` / `QA-Gate` / `QA-Orion` / `Lead-Codex` | DONE | Dirac ACCEPT；stable `.sourcelens-runtime/backend` on 19080；`release-evidence/public-repo-codeqa-api-gate-20260630-175510`；verifier PASS；marker `scanTaskId=138` with codeQa scanTask arrays `[138]` | 下一次 full release/nightly evidence 仍需刷新完整长期证据包 |
| Public repo API Code QA citation evidence gate | `AI-Vector` / `Ops-Harbor` / `Sec-Sentinel` / `QA-Gate` / `Lead-Codex` | DONE | Goodall-agent / `Mencius` PARTIAL accepted -> final ACCEPT；`validate_code_qa` 逐项绑定当前 `scanTaskId`；`verify-release-evidence.sh` 校验 `PUBLIC_REPO_SMOKE_OK.codeQa` 的 grounding/enforcement/counts/scanTaskId arrays；`./scripts/security-regression-check.sh` PASS；Code QA targeted backend tests PASS | 下一次 full release/nightly evidence 需要刷新长期证据包；真实 provider 的 DIRECT/RETRY 质量仍需单独 provider-run evidence |
| Release evidence loopback runtime fail-fast guard | `Ops-Harbor` / `Sec-Sentinel` / `QA-Gate` / `Lead-Codex` | DONE | Goodall-agent / `Mencius` PARTIAL accepted，`validate_loopback_backend_runtime_boundary`，fake `lsof`/`ps` unsafe target jar probe，`bash -n` PASS，`./scripts/security-regression-check.sh` PASS | 如声明新 release candidate，再重新跑完整 release evidence |
| Backup restore drill long backup id hardening | `Ops-Harbor` / `Sec-Sentinel` / `QA-Orion` / `Lead-Codex` | DONE | `scratch_database_name_for_backup_id()`，128 字符合法 backup id fake-docker 探针，`./scripts/security-regression-check.sh` PASS，Meitner review | 下一次 full release/nightly evidence 自然继承该脚本修复；无需收紧 backup id artifact 合同 |
| Current schema full release backup/rollback closure | `Ops-Harbor` / `Sec-Sentinel` / `QA-Gate` / `Lead-Codex` | DONE | `release-evidence/release-current-schema-backup-rollback-20260630-132306`，`./scripts/verify-release-evidence.sh ...` PASS，`backup-restore-drill-evidence=OK`，`rollback-plan=OK`，Goodall-agent PASS | 剩余 3 个 SKIP：GitHub App drill、webhook drill、真实 LLM provider run |
| Current schema full release evidence refresh | `Ops-Harbor` / `QA-Orion` / `Sec-Sentinel` / `QA-Gate` / `Lead-Codex` | DONE | `release-evidence/release-current-schema-20260630-124829`，`./scripts/verify-release-evidence.sh ...` PASS，`PUBLIC_REPO_UI_SMOKE_OK` line 26，`PUBLIC_REPO_SMOKE_OK` line 39，Goodall-agent PASS | 已由 `release-current-schema-backup-rollback-20260630-132306` 补齐 backup restore drill evidence 与 rollback plan |
| Scan governance timeline UI release evidence step | `Ops-Harbor` / `Sec-Sentinel` / `QA-Orion` / `QA-Gate` / `Lead-Codex` | DONE | `SOURCELENS_RELEASE_EVIDENCE_INCLUDE_SCAN_GOVERNANCE_TIMELINE_UI_SMOKE`、standard step `scan-governance-timeline-ui-smoke`、`SCAN_GOVERNANCE_TIMELINE_SMOKE_OK` verifier、tamper probe、focused package `release-evidence/scan-governance-timeline-ui-gate-20260630-092143`、Goodall-agent PASS | release/nightly full profile 下一次运行时刷新长期证据包 |
| Report evidence drawer UI release evidence step | `Ops-Harbor` / `Sec-Sentinel` / `FE-Pixel` / `QA-Orion` / `QA-Gate` / `Lead-Codex` | DONE | `SOURCELENS_RELEASE_EVIDENCE_INCLUDE_REPORT_EVIDENCE_DRAWER_UI_SMOKE`、standard step `report-evidence-drawer-ui-smoke`、`REPORT_EVIDENCE_DRAWER_SMOKE_OK` verifier、tamper probe、focused package `release-evidence/report-evidence-drawer-ui-gate-20260630-075511`、Goodall-agent PASS | release/nightly full profile 下一次运行时刷新长期证据包 |
| Scan governance timeline backend aggregation | `Arch-Atlas` / `BE-Forge` / `FE-Pixel` / `QA-Gate` / `Lead-Codex` | DONE | Goodall 原会话复核、Dewey the 2nd 架构复核、Curie the 2nd 后端探路、`ScanTaskGovernanceTimelineController`、`ScanTaskGovernanceTimelineService`、`ScanGovernanceTimelineResponse`、`scanGovernanceTimelineApi`、`node scripts/validate-frontend-ui.mjs`、`npm run build`、`make scan-governance-timeline-ui-smoke`、后端聚合与关联回归测试 | 下一步补真实 public repo retained sample 的治理时间线 live evidence，并决定是否纳入 release/nightly evidence 子门禁 |
| ScanTaskDetail repair governance timeline MVP | `Product-Luna` / `FE-Pixel` / `QA-Orion` / `QA-Gate` / `Lead-Codex` | DONE | Chandrasekhar product contract，Meitner FE path review，Confucius QA matrix，Goodall original retry PARTIAL -> fixed，Boole the 2nd smoke worker，`node scripts/validate-frontend-ui.mjs`，`npm run build`，`make scan-governance-timeline-ui-smoke`，backend governance tests，targeted `git diff --check` | 下一步补真实 public repo / retained sample 的治理时间线 live 验证，或设计服务端 scan governance 聚合接口 |
| Public repo live evidence drawer UI | `FE-Pixel` / `QA-Orion` / `Ops-Harbor` / `Lead-Codex` | DONE | Kuhn FE path review，Pasteur QA marker matrix，Ohm Ops boundary，`node scripts/validate-frontend-ui.mjs`，`npm run build`，`./scripts/security-regression-check.sh`，live `SOURCELENS_PUBLIC_REPO_SMOKE_UI=true make public-repo-smoke`，`PUBLIC_REPO_UI_SMOKE_OK evidenceDrawer.status=OK`，sample `projectId=138` / `scanTaskId=109` | 后续 full release/nightly profile 重新生成完整证据包；可追加治理时间线 live UI 子验证 |
| Report evidence drawer browser smoke | `FE-Pixel` / `QA-Orion` / `Ops-Harbor` / `QA-Gate` / `Lead-Codex` | DONE | Huygens FE review，Halley QA marker matrix，Poincare Ops boundary，Goodall-agent/Descartes governance review，`make report-evidence-drawer-ui-smoke`，`REPORT_EVIDENCE_DRAWER_SMOKE_OK`，`mockedApiOnly=true`，`unhandledApiRequests=0`，`1440x900` / `320x740`，`node scripts/validate-frontend-ui.mjs`，`npm run build`，现已进入 release evidence 标准 step | 下一步在 public repo live UI 中补真实样本抽屉点击，并继续修复治理时间线 |
| Evidence drawer code_chunks summary | `Product-Luna` / `FE-Pixel` / `QA-Orion` / `Lead-Codex` | DONE | Pascal product contract，Kierkegaard FE review，Gauss QA matrix，dynamic `codeChunkApi.search` with `scanTaskId/query/limit=3`，Top 3 chunk cards，`node scripts/validate-frontend-ui.mjs`，`npm run build`，targeted `git diff --check` | 下一步补抽屉 browser click smoke，并继续修复治理时间线 |
| Scan report evidence drawer MVP | `Product-Luna` / `FE-Pixel` / `QA-Orion` / `Lead-Codex` | DONE | Parfit product contract，Banach FE path review，Carson QA matrix，`ReportEvidenceDrawer`，风险/API/DB/Trace Map 证据入口，`node scripts/validate-frontend-ui.mjs`，`npm run build`，targeted `git diff --check` | 下一步接入真实 code_chunks 命中摘要、修复治理时间线和最小 browser click smoke |
| Scan report review gate | `Product-Luna` / `FE-Pixel` / `QA-Orion` / `QA-Gate` / `Lead-Codex` | DONE | Dewey product gap review，Raman FE density review，Leibniz QA static matrix，Goodall/Singer PASS retry，`ReportReviewGate` 五项门禁，`node scripts/validate-frontend-ui.mjs`，`npm run build`，targeted `git diff --check` | 下一步进入报告证据抽屉、修复闭环/治理时间线和最小 browser click smoke |
| AgentChat tool audit backend smoke | `BE-Forge` / `QA-Orion` / `Sec-Sentinel` / `QA-Gate` / `Lead-Codex` | DONE | Goodall PARTIAL -> focused backend smoke，Hume backend review，Hubble QA marker matrix，Gibbs security boundary，`mvn -q -Dtest=LlmClientAdapterTest,AgentToolCallControllerTest,AgentToolCallServiceTest test`，`SOURCELENS_BASE_URL=http://localhost:18080 make agent-chat-tool-audit-smoke` | 保持 focused local-only，不进入 release evidence 标准 step；下一步继续报告页操作密度和前端产品级体验收口 |
| AgentChat audit UI release evidence step | `Ops-Harbor` / `QA-Orion` / `Sec-Sentinel` / `Lead-Codex` | DONE | Pauli ops review，Averroes QA marker matrix，Locke security boundary，`make agent-chat-audit-ui-smoke`，focused evidence `agent-chat-audit-ui-gate-20260630-014946` + verifier，CI evidence `ci-agent-chat-audit-20260630-015312` + verifier，`./scripts/security-regression-check.sh` | 下一次 full release/nightly profile 运行时生成包含该 step 的完整证据包 |
| AgentChat audit deep link | `Product-Luna` / `Arch-Atlas` / `QA-Orion` / `QA-Gate` / `Lead-Codex` | DONE | Ptolemy product review，Mendel architecture review，Sagan QA matrix，Goodall PASS，backend targeted tests，`node scripts/validate-frontend-ui.mjs`，`npm run build`，`make agent-chat-audit-ui-smoke`，targeted `git diff --check` | 后续可在 UI 中展示 permission/status 摘要 |
| AgentChat evidence readability | `Product-Luna` / `FE-Pixel` / `QA-Orion` / `Lead-Codex` | DONE | Bernoulli product review，Peirce FE accessibility review，Aristotle QA matrix，message live log，tool evidence strip，AgentToolCall ARIA，`node scripts/validate-frontend-ui.mjs`，`npm run build`，targeted `git diff --check` | 继续报告页操作密度、真实 AgentChat 数据抽查和前端产品级体验收口 |
| AgentChat conversation accessibility | `FE-Pixel` / `QA-Orion` / `Lead-Codex` | DONE | Schrodinger FE review，Plato QA matrix，`AgentChat` list/listitem + native Link，`node scripts/validate-frontend-ui.mjs`，`npm run build`，targeted `git diff --check` | 继续 AgentChat 消息区、工具调用可读性和报告页操作密度审计 |
| AutoRepair PATCH_READY review checklist | `Product-Luna` / `FE-Pixel` / `QA-Orion` / `QA-Gate` / `Lead-Codex` | DONE | Avicenna `PARTIAL` product input -> checklist implemented，Planck QA matrix，Goodall `FAIL` blocker -> regex/order and strict-mode fix -> Goodall `PASS` retry，`node scripts/validate-frontend-ui.mjs`，`npm run build`，`make patch-ready-ui-smoke` | 保持 PATCH_READY checklist 作为 PR 前证据门槛；真实 GitHub App PR E2E 后置 |
| Nightly backup restore + rollback evidence closure | `Ops-Harbor` / `Sec-Sentinel` / `QA-Gate` / `Lead-Codex` | DONE | Franklin/Aquinas/Helmholtz `PARTIAL` review -> real restore/rollback evidence -> restored Goodall PASS retry，`backup-20260630-001220`，`release-evidence/nightly-20260630-002144`，`make verify-release-evidence DIR=release-evidence/nightly-20260630-002144` | GitHub App drill、webhook drill 和 LLM provider run 继续后置；生产/staging 前补生产备份加密和工具链边界 |
| 公司级多 agent 管理制度 | `PM-Nova` / `Lead-Codex` | DONE | `AGENT_STATUS_BOARD.md`、`TEAM_OPERATING_MODEL.md`、`AGENT_ACTIVITY_LOG.md`、`PRODUCT_GOVERNANCE.md` | 每轮结束同步成果物包、打回记录和状态 |
| Release profile mutating target safety gate | `Sec-Sentinel` / `Ops-Harbor` / `QA-Gate` / `Product-Luna` / `Lead-Codex` | DONE | Nash/Heisenberg/Godel/Goodall review，`release-evidence.sh` target env gate，`verify-release-evidence.sh` `public_repo_smoke_ui_manifest_present` gate，`security-regression-check.sh` static assertions，`deploy/.env.example` defaults，`release-evidence/release-20260629-235813` + verifier，后续 `release-evidence/nightly-20260630-002144` + verifier | 目标环境安全边界保持；外部 GitHub/LLM live 集成后置 |
| Frontend 320px narrow floor + UI release evidence gate | `FE-Pixel` / `QA-Orion` / `QA-Gate` / `Lead-Codex` | DONE | `node scripts/validate-frontend-ui.mjs`、`npm run build`、`make patch-ready-ui-smoke`、`./scripts/security-regression-check.sh`、`release-evidence/public-repo-ui-320-gate-20260629-232439`，public repo UI marker 覆盖 `1440x900` / `390x844` / `320x740` | 后续 full release/nightly profile 需要重新生成全量证据包 |
| Public Repo UI Release Evidence Subgate | `Ops-Harbor` / `QA-Orion` / `QA-Gate` / `Lead-Codex` | DONE | `SOURCELENS_RELEASE_EVIDENCE_PUBLIC_REPO_SMOKE_UI`、manifest `public_repo_smoke_ui`、`PUBLIC_REPO_UI_SMOKE_OK` verifier、security regression tamper probes、focused package `release-evidence/public-repo-ui-gate-20260629-225444` | 后续 full release/nightly profile 运行时保持该子门禁为强制项 |
| Public Repo Natural Endpoint Focused Release Evidence | `Ops-Harbor` / `QA-Gate` / `Lead-Codex` | DONE | `release-evidence/public-repo-natural-payload-20260629-221016`，verifier PASS，`scanTaskId=96`，`naturalEndpointCn/En` -> `ChatController.java` / `CONTROLLER` | 后续进入 full release/nightly 前再跑完整 profile |
| Public Repo Smoke Payload Verifier | `Ops-Harbor` / `QA-Orion` / `Lead-Codex` | DONE | `verify-release-evidence.sh` JSON gate、security regression tamper probes、docs | 下一步生成 focused release evidence package 验证归档链路 |
| Natural Endpoint Public Smoke Live Evidence | `Ops-Harbor` / `QA-Orion` / `Lead-Codex` | DONE | `make public-repo-smoke` standalone live output，`projectId=119` / `repositoryId=80` / `scanTaskId=95`，`naturalEndpointCn/En` -> `ChatController.java` / `CONTROLLER` | 正式发布前生成 release evidence package 并用 verifier 归档 |
| Natural Endpoint Public Smoke Probe | `AI-Vector` / `QA-Orion` / `Ops-Harbor` / `QA-Gate` / `Lead-Codex` | DONE | `public-repo-analysis-smoke.sh` 中 `naturalEndpointCn` / `naturalEndpointEn`，security static gates，岗位复核记录，standalone live smoke PASS | 后续保持 probes 不被业务词污染 |
| Natural Endpoint Code Retrieval | `AI-Vector` / `BE-Forge` / `QA-Orion` / `Lead-Codex` | DONE | `CodeChunkRanker.roleIntentTypes` endpoint/接口/路由 intent、结构分数排序、`CodeChunkServiceTest`、`CodeQaRetrievalServiceTest`、security static gates，public smoke live evidence | 后续扩展 repo profile 化 probes 与前端 QA 体验 |
| Release Evidence CI gate hardening | `QA-Gate` / `Ops-Harbor` / `Lead-Codex` | DONE | `.github/workflows/ci.yml` `grep -Fx --` summary checks、`security-regression-check.sh` static assertion、focused ci evidence summary grep PASS、Goodall PASS | 后续继续保持普通 CI 低权限 |
| Release Evidence CI profile gate | `Ops-Harbor` / `Sec-Sentinel` / `QA-Gate` / `Lead-Codex` | DONE | `.github/workflows/ci.yml` `release-evidence-ci` job、`make release-evidence-ci` + verifier、manifest/summary grep、SHA-pinned 7-day artifact、security regression CI boundary checks | 后续如接 release/nightly workflow，必须使用 protected/manual/scheduled 层且不得污染普通 PR CI |
| Release evidence / CI profile contract | `Ops-Harbor` / `Sec-Sentinel` / `QA-Gate` / `Lead-Codex` | DONE | `SOURCELENS_RELEASE_EVIDENCE_PROFILE=local|ci|release|nightly`、manifest schema/source、verifier profile include mode、Make targets、profile tamper probes、security regression PASS | 后续如接 GitHub Actions release/nightly job，必须使用 protected environment 且保持普通 CI 无 secrets |
| PATCH_READY UI smoke release evidence step | `Ops-Harbor` / `Sec-Sentinel` / `QA-Gate` / `Lead-Codex` | DONE | `patch-ready-ui-smoke` 标准 step、`PATCH_READY_UI_SMOKE_OK` verifier、security regression forged OK 负例、default false/SKIP、main checks PASS、Goodall latest retry PASS | 后续定义完整 release evidence / CI 分层策略 |
| AutoRepair PATCH_READY browser smoke | `FE-Pixel` / `QA-Gate` / `Sec-Sentinel` / `Lead-Codex` | DONE | `web-console/tests/patch-ready-smoke.spec.ts`、`web-console/playwright.patch-ready.config.ts`、`make patch-ready-ui-smoke`、Goodall FAIL -> FE-Pixel fix -> Goodall PASS | 后续把 mock browser smoke 纳入完整 release evidence 或 CI 分层执行策略 |
| AutoRepair patch release evidence payload gate | `Ops-Harbor` / `QA-Orion` / `Lead-Codex` | DONE | enhanced verifier, security regression tamper probe, `release-evidence/autorepair-patch-live-20260629-175331` | mock-driven PATCH_READY browser smoke 已由 Goodall retry 补齐；后续进入完整 release evidence/CI 分层 |
| AutoRepair patch release evidence | `Ops-Harbor` / `QA-Orion` | DONE | `autorepair-patch-smoke` live evidence verified | 正式发布前生成长期归档包 |
| AutoRepair PATCH_READY 证据链闭环 | `QA-Orion` / `BE-Forge` / `FE-Pixel` / `Lead-Codex` | DONE | strengthened `autorepair-patch-smoke`、targeted backend tests、frontend build、browser PATCH_READY routes/clicks、audit deep link | PATCH_READY browser smoke 已脚本化；后续在完整 release evidence 或 CI 分层中纳入 |
| 前端 UI/runtime 最小闭环 | `FE-Pixel` / `QA-Gate` / `Lead-Codex` | DONE | Hypatia PARTIAL 审查、Sartre 实现与返工、Delivery Owner 桌面/390px/320px browser smoke、Goodall PASS 复核 | 后续做全站深层交互覆盖和完整发布验收 |
| 前端产品级 UI | `FE-Pixel` / `Product-Luna` | ACTIVE | `validate-frontend-ui.mjs`、runtime 最小闭环 smoke、`public-repo-ui-smoke` live page matrix including 320px、`npm run build`、`make patch-ready-ui-smoke`、focused package `public-repo-ui-320-gate-20260629-232439` | 继续 PATCH_READY 真样本页面矩阵和完整发布验收 |
| 审计治理 workbench sample seed | `BE-Forge` / `QA-Gate` / `Sec-Sentinel` / `QA-Orion` | DONE | Goodall retry 成果物、BE-Forge 复核、strict sample smoke、strict release evidence verifier、security regression | 进入后续正式发布长期归档证据包 |
| 审计治理 workbench | `QA-Orion` / `Sec-Sentinel` / `FE-Pixel` | DONE | browser smoke, `make audit-workbench-smoke`, live release evidence step, strict sample seed evidence | 正式发布前重新生成长期归档 release evidence |
| 公开仓库主链路 release evidence 接入 | `Ops-Harbor` / `QA-Orion` / `AI-Vector` / `Arch-Atlas` / `QA-Gate` | DONE | 标准 step `public-repo-smoke`、`SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PUBLIC_REPO_SMOKE`、verifier marker `PUBLIC_REPO_SMOKE_OK`、security regression 负例、Goodall 只读 QA PASS、focused live evidence | 后续正式发布仍需完整 release evidence 包 |
| 公开仓库分析主链路 live 验收 | `Ops-Harbor` / `QA-Gate` / `Lead-Codex` | DONE | standalone sample `projectId=111` / `scanTaskId=87`，focused evidence `public-repo-smoke-live-20260629-154921`，DB 抽查 `scanTaskId=87/88` | `CLEANUP=false` 留下本地审计样本；后续清理或作为验收 fixture |
| 公开仓库分析主链路后续体验 | `BE-Forge` / `AI-Vector` / `QA-Orion` / `FE-Pixel` | ACTIVE | `SOURCELENS_PUBLIC_REPO_SMOKE_UI=true make public-repo-smoke` live evidence，`PUBLIC_REPO_UI_SMOKE_OK`，latest focused release package `projectId=125` / `repositoryId=86` / `scanTaskId=101`，ProjectDetail/ScanTaskDetail/QA/Graph/Artifacts/AuditLogs/AutoRepair candidate，viewports `1440x900` / `390x844` / `320x740` | 继续 full release/nightly profile 和本地样本清理决策 |
| Dashboard main path next action panel | `Product-Luna` / `FE-Pixel` / `QA-Orion` / `Ada-agent` / `Lead-Codex` | DONE | `DashboardNextActionPanel`、仓库/扫描/code_chunks/风险状态推荐、证据成熟度、阻塞项、`validate-frontend-ui` static gate、`npm run build`、Ada PASS | 后续如继续大厂级 UI，可补 browser screenshot smoke |
| 报告到 QA 上下文浏览器闭环 | `FE-Pixel` / `QA-Orion` / `QA-Gate` / `Lead-Codex` | DONE | `ProjectDetail` scan context fix、`validate-frontend-ui.mjs` regression gate、browser direct route + click-through、Goodall retry | 下一步验证 PATCH_READY 样本：AutoRepair patch、artifact、execution task、audit 继续绑定来源 scan |
| code_chunks role-specific retrieval | `AI-Vector` / `BE-Forge` / `QA-Gate` | DONE | `chunkSearch.roleProbes`，后端 role-intent 补召回，真实 public repo smoke `scanTaskId=91`，Goodall PASS | 后续为任意语言公开仓库设计 repo profile 化 probes |
| 安全与沙箱边界 | `Sec-Sentinel` / `Ops-Harbor` | ACTIVE | `security-regression-check.sh`、`SECURITY_BOUNDARY.md` | 保持危险能力默认收紧 |
| GitHub App 高级集成层 | `Arch-Atlas` / `Sec-Sentinel` | DEFERRED | `REFACTOR_ROADMAP.md` | 主链路稳定后再做 E2E |

## 4. 每轮必须更新的记录

每轮开发结束前，`Lead-Codex` 必须做以下记录：

1. 更新 `AGENT_STATUS_BOARD.md` 的本轮工作看板。
2. 更新 `AGENT_ACTIVITY_LOG.md`，说明哪些岗位参与、Runtime 是真实子 agent 还是 `Lead-Codex simulated role review`、产出证据和采纳状态。
3. 如果出现长期判断，更新 `AGENT_DECISION_REGISTER.md`。
4. 更新 `PRODUCT_PROGRESS_LOG.md`，记录改动、验证、风险和下一步。
5. 如果影响接手上下文，更新 `CODEX_HANDOFF.md`。

## 5. 用户如何查看当前状态

优先查看顺序：

1. `AGENT_STATUS_BOARD.md`：看当前岗位、工作流、状态和下一步。
2. `AGENT_ACTIVITY_LOG.md`：看每轮具体谁参与、做了什么、证据是什么。
3. `AGENT_DECISION_REGISTER.md`：看关键决策为什么这样定。
4. `PRODUCT_PROGRESS_LOG.md`：看产品级进度、验证和风险。
5. `CODEX_HANDOFF.md`：看换账号、换线程或上下文丢失后如何继续。

## 6. 执行规则

- 子 agent 不会长期常驻后台；需要并行审查、独立实现或高风险复核时才启动。
- 非简单开发、跨模块重构、安全/发布/测试门禁变化，必须优先启动真实子 agent；主 agent 主要做分派、集成和验收。
- 如果没有启动真实子 agent，也必须用固定岗位进行审查，并写为 `Lead-Codex simulated role review`，同时记录为什么没有委派。
- 涉及同一文件的实现必须串行，由 `Lead-Codex` 集成，避免互相覆盖。
- 任何 `DONE` 状态必须有证据；没有验证只能写 `PARTIAL`、`Not run` 或 `Pending`。
- 用户随时问“现在谁在工作”时，以本文和 `AGENT_ACTIVITY_LOG.md` 为准。

## 7. 当前真实子 agent 运行映射

| 固定代号 | 运行时昵称 | Agent id | 类型 | 状态 | 当前任务 |
| --- | --- | --- | --- | --- | --- |
| `Sec-Sentinel` | `Bernoulli` | `019f23a9-3123-7433-bea0-5e04ff05066c` | explorer | PASS / CLOSED | 新 marker forged 风险复核；建议补 requestCount=0、source anchor forged、`qaTotalRequestCount` 覆盖 drift requests 和 mismatchFlags 白名单 |
| `QA-Orion` | `Pascal` | `019f23a9-4ccd-74b0-8749-d842ccfad3f9` | explorer | PASS / CLOSED | 给出 claimRoleDistributionMissing/Mismatch forged marker 测试矩阵；确认本轮无需重跑 browser smoke |
| `Ops-Harbor` | `Descartes` | `019f23a9-68dd-7522-80ef-e740bd380601` | explorer | PASS / CLOSED | 指出 security regression 必须保留旧 marker 合法路径，并用 enriched marker 单独验证新 optional 字段 |
| `Product-Luna` | `Lagrange` | `019f2399-58e8-73f0-a7de-86cbbd5d7e2a` | explorer | PASS / CLOSED | P6/P9 下一切片产品复核；建议继续 P6 claim roleDistribution drift 防御，不切换到 P9 全站 UI |
| `FE-Pixel` | `Euler` | `019f2399-789b-7780-b6b0-e57983d9a5e4` | explorer | PASS_WITH_FIX / CLOSED | 找出缺失 `roleDistribution`、父子计数矛盾、`>=` 过宽和 claim audit READY 文案不同源风险 |
| `QA-Orion` | `Halley` | `019f2399-947d-7120-9341-ccd00566fd76` | explorer | PASS / CLOSED | 建议最小缺失 `roleDistribution` drift 负例和 marker；主线程同时加入计数矛盾负例 |
| `FE-Pixel` | `Arendt` | `019f239c-784a-7e00-b542-53657c1ca387` | worker | IMPLEMENTED / REVIEWED / CLOSED | 实现 claim roleDistribution drift guard、两条 smoke 负例、static gate 和 verifier 兼容；Lead-Codex 审核后补父级 claim file count 正数要求并验收 |
| `Product-Luna` | `Gauss` | `019f2387-c122-7322-8ef2-27c9b31a8822` | explorer | PASS / CLOSED | P6/P9 下一切片产品复核；建议优先做报告证据 -> QA 可信度摘要/字段漂移防御，不切全站 UI Foundation |
| `FE-Pixel` | `Pauli` | `019f2387-def9-7e42-aae6-58485cd96b8b` | explorer | PASS_WITH_FIX / CLOSED | 只读找出 `claimCitationCoverage/roleDistribution` 漂移时摘要和修复按钮可能不同源；建议把 AutoRepair URL 绑定 `trustSummary.tone=ready` |
| `QA-Orion` | `Chandrasekhar` | `019f2388-00c5-75b2-8257-0a0ee7f0de48` | explorer | PASS / CLOSED | 定义最小 QA 负例：`VERIFIED/DIRECT_VERIFIED + claim READY + REPORT_FILE_ANCHOR` 必须降级为 REVIEW 并隐藏修复候选 |
| `FE-Pixel` | `Dalton` | `019f238c-5140-7021-99a6-82150ac96a3c` | worker | IMPLEMENTED / REVISED / CLOSED | 实现 Project QA drift guard、file-anchor smoke 和 static gate；Lead-Codex 修正 marker 合同后验收 |
| `Product-Luna` | `Turing` | `019f237b-5336-7410-a621-739a2e5a694d` | explorer | PASS / CLOSED | 下一阶段产品复核；建议 P6 可信代码理解产品化优先，P9 作为伴随体验层，不做全站 UI 大翻新 |
| `FE-Pixel` | `Zeno` | `019f237b-6d95-7eb1-98c5-ff5d226622c7` | explorer | PASS_WITH_NOTES / CLOSED | 前端基础层只读复核；指出 `app.css` 膨胀、按钮/顶部栏兜底偏脆、长文本截断和登录/注册窄屏风险，建议后续 UI Foundation P1 |
| `QA-Orion` | `Aristotle` | `019f237b-918c-7a93-9708-b4993cf1c627` | explorer | PASS / CLOSED | 测试缺口复核；指出 report evidence -> QA citation 需要独立 smoke 入口，避免真实后端字段与前端引用面板漂移 |
| `QA-Orion` | `Schrodinger` | `019f237f-cf05-7631-8c86-dd287e42e11e` | worker | IMPLEMENTED / CLOSED | 新增 `playwright.report-evidence-qa-citation.config.ts`，更新 npm script 和 static gate；主线程复核并完成 smoke 验证 |
| `QA-Gate` | `Banach` | `019f236e-a110-7c00-b873-8f327b9e884a` | explorer | PASS / CLOSED | Current schema full release authority 只读复核；确认 `release-current-schema-20260702-230650` 可标记为 CURRENT FULL AUTHORITY，5 个 SKIP 需保留 caveat |
| `Ops-Harbor` | `McClintock` | `019f236e-bf0b-7603-a83b-5e1ee18008f7` | explorer | PASS / CLOSED | 运维发布治理复核；确认公开仓库分析主线可继续，backup/rollback 属生产治理缺口，GitHub App/webhook/真实 LLM 属高级集成后置 |
| `Sec-Sentinel` | `Peirce` | `019f236e-e0bd-7cb0-96e8-f69fa34ec0e7` | explorer | PASS / CLOSED | 安全边界复核；确认 sandbox、file-bound repair、AutoRepair patch、Agent audit 覆盖当前安全主线，外部 GitHub/LLM/灾备回滚仍后置 |
| `QA-Gate` / `Ops-Harbor` | `Mencius` | `019f2187-7550-7f41-83e1-5c3b54afc0dc` | explorer | PASS / CLOSED | Public repo source location live evidence 只读复核；建议最小 live marker + focused evidence package、不刷新 full authority，并列出 `sourceLocationProbes` 必验字段和不可接受失败 |
| `QA-Gate` | `Hypatia` | `019f2178-67ac-7492-a0cd-34db6706ac39` | explorer | PASS / CLOSED | Public repo source location marker 只读复核；建议 smoke 层强制真实 API probe，release verifier 过渡期 optional strict，并拒绝 duplicate kind、scan mismatch、unsafe path、line outside range、resultCount=0、matched=false、port treated as line 等伪造 |
| `Arch-Atlas` / `Product-Luna` / `QA-Orion` | `Archimedes/Hubble` | `019f1e68-136f-78a3-afe2-3c7645e605b3` | explorer | IMPLEMENT_NOW / CLOSED | Public repo live governance Agent review evidence 只读复核；建议新增 `governanceTimeline.agentReview`，证明 AgentTask、AGENT_REPORT、audit 和 execution 均绑定当前 scan |
| `Product-Luna` | `Mencius the 2nd` | `019f1b60-900d-7693-8c05-6f8ec675ae26` | explorer | REFRESH_NOW / CLOSED | P12-pre full authority refresh 产品口径复核；要求不要让 focused backup/rollback 与旧 full authority 并存造成发布语义混乱 |
| `Ops-Harbor` | `Parfit the 2nd` | `019f1b60-d98b-7462-b18c-74a19280826e` | explorer | PASS direction / CLOSED | P12-pre full authority refresh 运维方案；要求稳定 backend jar on 19080、完整 release profile、不拼接证据包 |
| `QA-Orion` | `Beauvoir the 2nd` | `019f1b61-254a-7651-9948-77eb0f26eeac` | explorer | PASS contract / CLOSED | P12-pre full authority QA 合同；要求 0 required failure、0 optional warning、backup/rollback/public repo smoke 全 OK |
| `QA-Gate` | `Goodall-agent` / `Copernicus the 2nd` | `019f1b77-2a24-7b20-a3d7-3ce4d4116948` | explorer | BLOCKED / CLOSED | 首次复审 full authority 刷新；因 `release-p12pre-full-authority-20260701-015543` public repo clone `Premature EOF` 阻断 authority 声明 |
| `QA-Gate` | `Goodall-agent` / `Zeno the 2nd` | `019f1ba4-bcd3-7b71-b62f-8e6f90dc1e2e` | default | PASS / CLOSED | 最终复审 `release-p12pre-full-authority-20260701-024042`；当时允许作为 P12-pre full authority，后续已被 `release-post-unverified-qa-citation-authority-20260701-135235` supersede |
| `Product-Luna` | `Singer the 2nd` | `019f1ac0-79ae-7030-b1e1-ba3bc1325a62` | explorer | IMPLEMENT_NOW / CLOSED | Report Evidence -> QA Citation UI 产品复核；确认本轮应做 focused mock UI smoke，不改后端策略、不刷新 full release authority |
| `QA-Orion` | `Wegener the 2nd` | `019f1ac0-9f72-7c30-b664-f166db81b8d3` | explorer | TESTABLE / CLOSED | Report Evidence -> QA Citation UI QA 合同；要求点击抽屉进入 QA、POST `/qa` evidenceRef 绑定、answer citations 可见、双 viewport、未 mock API 为 0 |
| `Product-Luna` | `Boyle` | `019f1a73-a407-70a3-8a89-7f3b6eea7ee1` | explorer | REFRESH_NOW / CLOSED | Full release evidence refresh 产品复核；要求在 PATCH_READY schema 升级后立即刷新当前权威 full release package，并更新治理文档 |
| `Ops-Harbor` | `Banach` | `019f1a73-c89e-7631-8d3a-824773ae263d` | explorer | PASS input / CLOSED | Full release evidence refresh 运维复核；建议使用稳定 backend jar、完整 `release` profile、无 include override，并保留 backup/rollback/GitHub/LLM SKIP 边界 |
| `QA-Orion` | `Heisenberg the 2nd` | `019f1a73-f132-72a1-99f9-7a18c4abeb07` | explorer | PASS contract / CLOSED | Full release evidence refresh QA 合同；要求 release profile、0 failure/0 warning、PATCH_READY 新 schema、public repo real UI、AgentChat/audit/sandbox/phase12 等核心 step 全部 OK |
| `QA-Gate` | `Goodall-agent` / `Halley` | `019f18ff-9d4a-7543-a98b-583162360fc9` | worker | PASS / CLOSED | 用户要求重新尝试 Goodall-agent 后恢复该会话；最新 final review 判定 `release-post-unverified-qa-citation-authority-20260701-135235` 技术证据 PASS，文档更新前 BLOCKED，补档后可作为当前 authority；旧 `release-p12pre-full-authority-20260701-024042` historical-only |
| `Product-Luna` | `Carson` | `019f1a4b-0afc-79c1-9431-be044e2a06a9` | explorer | IMPLEMENT_NOW / CLOSED | PATCH_READY release evidence contract upgrade 产品复核；要求 verifier 跟上新 marker schema，旧 full evidence 降级为 historical-only |
| `Ops-Harbor` | `Newton` | `019f1a4b-2de6-77c0-be96-e822334cb0c0` | explorer | CONCERNS / CLOSED | PATCH_READY release verifier/security regression 漂移复核；要求 hard checks、negative probes 和旧证据拒绝 |
| `QA-Orion` | `Socrates` | `019f1a4b-5181-7c70-a946-c705f4890836` | explorer | PASS contract / CLOSED | PATCH_READY evidence contract QA 矩阵；要求 legacy boolean、缺 enter/space、缺 sharedSelectableRow、错误/乱序 repair ids 均被拒绝 |
| `QA-Gate` | `Goodall-agent` / `Halley` | `019f18ff-9d4a-7543-a98b-583162360fc9` | worker | PASS / CLOSED | PATCH_READY release evidence contract final review；首次 BLOCK stale authority docs，修正并确认 security regression 主工作区 PASS 后 final review `PASS` |
| `Product-Luna` | `Beauvoir` | `019f1a09-c25f-74b1-b4da-f4f49b9a8a29` | explorer | IMPLEMENT_NOW / CLOSED | AgentTasks shared helper adoption 产品复核；确认这是既有行为迁移到共享原语，不改后端/API/release authority |
| `FE-Pixel` | `Popper` | `019f1a0a-01fc-7970-9f0a-1bb81334b6d4` | worker | IMPLEMENTED / CLOSED | AgentTasks 真实前端迁移；接入 `createSelectableTableRowProps`，补 detail labelled region，切换 validator 并通过 static/build |
| `QA-Orion` | `Kant` | `019f1a0a-2d99-7252-ad66-596db73d772c` | explorer | PASS contract / CLOSED | AgentTasks helper adoption QA 合同；要求 focused static/build/smoke，并新增 `sharedSelectableRow` marker 证明 aria-controls/detail region 链接 |
| `QA-Gate` | `Goodall-agent` / `Halley` | `019f18ff-9d4a-7543-a98b-583162360fc9` | worker | PASS / CLOSED | AgentTasks shared selectable row adoption final review；确认 focused-only 验证足够且无需 full release authority refresh |
| `Product-Luna` | `Carver` | `019f19fc-4bd5-7992-9d9f-29cc8ad8256d` | explorer | IMPLEMENT_NOW / CLOSED | CiDiagnostics shared helper adoption 产品复核；确认迁移价值为收口第三个同构高密度详情表格，不改 CI 业务或 release authority |
| `FE-Pixel` | `Helmholtz` | `019f19fc-4c2b-7b22-84a8-bac98ab82fa4` | explorer | PASS direction / CLOSED | CiDiagnostics 前端复核；要求删除本地 row keyboard handler、接入 helper、补 detail labelled region、保留 stopPropagation 和 repair readiness |
| `QA-Orion` | `Hypatia` | `019f19fc-4c8b-7270-a59f-b75f92942f0a` | explorer | PASS contract / CLOSED | CiDiagnostics helper adoption QA 合同；要求 static/build/CI focused smoke，full release/live smoke 不阻塞 |
| `QA-Gate` | `Goodall-agent` / `Halley` | `019f18ff-9d4a-7543-a98b-583162360fc9` | worker | PASS / CLOSED | CiDiagnostics shared selectable row adoption final review；确认 focused-only 验证足够且无需 full release authority refresh |
| `Product-Luna` | `Peirce` | `019f19ee-0ea9-7140-8611-db02928b81d8` | explorer | IMPLEMENT_NOW / CLOSED | Selectable table row shared pattern 产品复核；建议薄原语、窄范围，先接入 PR/Issue/可选 CI，不做全站 UI 重构 |
| `FE-Pixel` | `Bohr` | `019f19ee-0eff-73d3-9d08-df5a3610636d` | explorer | PASS direction / CLOSED | Shared helper 前端复核；建议第一批只接入 `PrReviews` + `IssueDecomposition`，保留业务副作用和详情内容 |
| `QA-Orion` | `Euler` | `019f19ee-0f5a-7832-a492-070c36e06dd9` | explorer | PASS contract / CLOSED | Shared helper QA 合同；要求 static + build + 接入页 focused smoke，未接入页面和 full release/live smoke 不阻塞本轮 |
| `QA-Gate` | `Goodall-agent` / `Halley` | `019f18ff-9d4a-7543-a98b-583162360fc9` | worker | PASS / CLOSED | Selectable table row shared pattern 第一批接入 final review；确认 helper、PR/Issue adoption、state isolation、smoke、docs contract 和 focused-only 边界均满足 |
| `Product-Luna` | `Plato` | `019f19db-163c-7f52-9700-92c029db289a` | explorer | IMPLEMENT_NOW / CLOSED | IssueDecomposition detail selection 产品复核；要求键盘、视觉/ARIA selected、标题/详情匹配、失败态说明和 Plan Signal 计数一致，不扩大到后端算法或任务状态机重构 |
| `FE-Pixel` | `Anscombe` | `019f19db-3d8b-7f52-8c23-62b1843d340b` | explorer | PASS direction / CLOSED | IssueDecomposition 前端复核；要求 `.sl-issue-table-card` pointer/focus/selected CSS，row keydown guard 覆盖 combobox、Ant Select 和 dropdown trigger |
| `QA-Orion` | `Erdos` | `019f19db-65a7-71e0-8f39-275afe53a22c` | explorer | PASS contract / CLOSED | IssueDecomposition detail selection smoke 合同；要求 mock-only、双 viewport、tasks/status/export API、Enter/Space、失败态旧任务清理和 nested action isolation |
| `QA-Gate` | `Goodall-agent` / `Halley` | `019f18ff-9d4a-7543-a98b-583162360fc9` | worker | PASS / CLOSED | 本轮 IssueDecomposition focused gate 只读验收；首次因治理文档缺失阻断，补档后 final review `PASS`，确认 docs blocker 关闭且 focused-only 边界保持 |
| `Product-Luna` | `Locke` | `019f19cc-c46e-7332-bd63-a075909c4be9` | explorer | IMPLEMENT_NOW / CLOSED | PR Reviews detail selection 产品复核；要求键盘/ARIA、comments 不残留、AutoRepair query 保留 `projectId` |
| `FE-Pixel` | `Kepler` | `019f19cc-e987-7310-ab09-c966a87af06b` | explorer | PASS direction / CLOSED | PR Reviews 前端复核；要求 PR 表格 focus/selected CSS、detail region 和 `aria-controls` |
| `QA-Orion` | `Hume` | `019f19cd-1075-7213-8270-07a046822b86` | explorer | PASS contract / CLOSED | PR Reviews detail selection smoke 合同；要求 mock-only、双 viewport、comments API、reanalyze、repair readiness、projectId binding 和 nested action isolation |
| `QA-Gate` | `Goodall-agent` / `Halley` | `019f18ff-9d4a-7543-a98b-583162360fc9` | worker | PASS / CLOSED | 本轮 PR Reviews focused gate 只读验收；确认行键盘、ARIA、detail region、comments 清理、AutoRepair query、smoke marker、static gate、Make/NPM 入口和治理文档满足，无阻塞项 |
| `Product-Luna` | `Aquinas` | `019f19be-559d-71b2-a4b8-d3d44ad14f32` | explorer | IMPLEMENT_NOW / CLOSED | CI Diagnostics detail selection 产品复核；要求键盘、选中态、候选资格说明，并不扩大到 AutoRepair 执行、CI webhook 或后端诊断质量 |
| `FE-Pixel` | `Wegener` | `019f19be-7bd3-7c30-8363-36f55c0d8e60` | explorer | PASS direction / CLOSED | CI Diagnostics 表格/详情前端复核；要求 `tabIndex`、`aria-selected`、`onKeyDown`、row label、workflow stopPropagation 和 CI focus-visible 样式 |
| `QA-Orion` | `Ramanujan` | `019f19be-a837-7113-86ed-790b1fe47d3d` | explorer | PASS contract / CLOSED | CI Diagnostics detail selection smoke 合同；要求 mock-only、双 viewport、reanalyze API、Enter/Space、repair readiness 和 nested action isolation |
| `QA-Gate` | `Goodall-agent` / `Halley` | `019f18ff-9d4a-7543-a98b-583162360fc9` | worker | PASS / CLOSED | 本轮 CI Diagnostics focused gate 只读验收；确认行键盘、ARIA、repair readiness、smoke marker、static gate、Make/NPM 入口和治理文档满足，无阻塞项 |
| `Product-Luna` | `Huygens` | `019f195d-f2eb-7fb2-83a2-15011f34deed` | explorer | IMPLEMENT_NOW / CLOSED | AutoRepairs 表格显式详情入口产品复核；确认该项是 P9 前端产品化合理下一步，边界为不扩展后端、PR、GitHub App 或 provider |
| `FE-Pixel` | `Poincare` | `019f195e-18a5-72b3-bad5-f4ec2d532e3c` | explorer | PASS direction / CLOSED | AutoRepairs 表格详情动作与可访问选中状态前端复核；要求 `ActionButton`、`aria-label`、`aria-selected`、键盘 Enter/Space、focus-visible 和 smoke/static gate |
| `QA-Orion` | `Franklin` | `019f195e-40cb-76b3-9e94-f7342a109514` | explorer | CONCERNS fixed / CLOSED | AutoRepairs 表格详情动作 QA 矩阵；要求 patch-ready smoke marker 与 release verifier 强校验 `tableDetailAction`，已由本轮实现和 full evidence 关闭 |
| `QA-Gate` | `Goodall-agent` / `Halley` | `019f18ff-9d4a-7543-a98b-583162360fc9` | worker | PASS / CLOSED | 用户要求重新尝试 Goodall-agent 后恢复该会话；只读复核 ScanTaskDetail stage rail、新旧 full release evidence、static gate 和 security regression，确认 `release-post-governance-stage-rail-20260701-000851` 可作为当时 full release authority；后续已被更新证据包 supersede |
| `QA-Gate` | `Goodall-agent` | `019f120d-14ea-7b83-894c-59e3f802fe88` | worker | PARTIAL fixed / CLOSED | 用户要求重新尝试 Goodall 原会话后完成 AutoRepair PATCH_READY PR review hard gate 复核；初判 PARTIAL，要求缺证据禁用/阻断 submit，已由本轮实现和 smoke/static/build 验证关闭 |
| `Product-Luna` | `Ohm` | `019f18aa-2fd2-71e2-905b-f98ea69d1c9c` | explorer | Direction accepted / CLOSED | AutoRepair PATCH_READY PR 前硬门禁产品复核；要求缺硬证据阻塞、人工候选 scanTaskId warning-only、确认摘要更完整 |
| `FE-Pixel` | `Einstein` | `019f18aa-56da-7c02-a870-9061cbdafb3e` | explorer | Direction accepted / CLOSED | AutoRepair PATCH_READY 前端最小改动路径；复用现有按钮、artifact、Popconfirm、checklist 和响应式规则 |
| `QA-Orion` | `Feynman` | `019f18aa-866d-7060-afdf-59589391cde2` | explorer | Direction accepted / CLOSED | patch-ready-ui-smoke 增强矩阵；保留 mock-only、双 viewport、Popconfirm cancel、submit-pr 0，并加入 reviewGate marker |
| `Sec-Sentinel` | `Cicero` | `019f18aa-ae2f-7c20-acd8-2c5001ab23f1` | explorer | Boundary accepted / CLOSED | PR 前门禁安全边界；前端 gate 不替代后端 submit-pr 权限、patch 边界和审计 fail-closed |
| `Product-Luna` | `Hilbert` | `019f189e-31e1-7bc1-b576-e8afdd7c226c` | explorer | Direction accepted / CLOSED | AutoRepair PR 前人工复核门禁产品审查；本轮采纳主链路方向，PR gate 后置为下一步 |
| `FE-Pixel` | `Ampere` | `019f189e-674c-76f3-a264-0ebc569e6312` | explorer | Direction deferred / CLOSED | 报告治理时间线阶段化闭环轨道建议，作为下一轮 P9 报告页视觉增量候选 |
| `QA-Orion` | `Gauss` | `019f189e-bc4e-70f1-84c8-c50f0d43689c` | explorer | PASS direction / CLOSED | Report evidence to AutoRepair candidate payload gate；建议 mock-only smoke 捕获创建请求体，已采纳 |
| `AI-Vector` / `QA-Gate` | `Goodall-agent` as `Confucius` | `019f1893-7f09-7f22-8b23-6cec03d8b4a6` | worker | PARTIAL accepted / CLOSED | 用户要求重新尝试 Goodall-agent 后创建的新 Goodall 职责会话；只读审查 LLM/provider 证据，确认 mock provider、安全边界和 raw artifact 合同可通过，但真实 provider run / `DIRECT_VERIFIED` 或 `RETRY_VERIFIED` 仍未归档 |
| `FE-Pixel` | `Nash` | `019f188b-a271-7a51-8c08-921841dbb68e` | explorer | PASS direction / CLOSED | App Shell UI smoke 路径审查，建议 12 路由、双 viewport、topbar/page heading bbox、primary button readable、未 mock API fail-closed |
| `QA-Orion` | `Lovelace` | `019f188b-d6e9-7eb3-850a-022cc5a1e6f6` | explorer | PASS direction / CLOSED | App Shell UI smoke QA 矩阵，要求移动抽屉、runtime issue、white text、no overflow 和静态 gate |
| `Ops-Harbor` / `QA-Gate` | `Volta` | `019f184e-1144-72b0-a7dc-555f28eac62e` | explorer | PARTIAL accepted / CLOSED | 只读审查 Dashboard screenshot artifact release evidence；要求受控 artifact 目录、PNG allowlist、本体校验和 security regression 包级负例，已采纳并关闭 |
| `QA-Gate` | `Goodall-agent` | `019f17c1-bfe8-7e92-8cfd-91f95a8f649b` | worker | PARTIAL accepted / CLOSED | 用户要求重新尝试 Goodall-agent 后恢复旧会话；只读复核 Dashboard next-action visual evidence，P0 要求已修复并由安全回归证明，P1 screenshot artifact verifier 已由 Volta 后续任务关闭 |
| `FE-Pixel` / `QA-Orion` | `Mendel` | `019f17f8-797c-78e1-b6a5-56c4d5332cf9` | explorer | PARTIAL accepted / CLOSED | 只读审查 Dashboard next-action browser smoke，建议最小加入截图、像素非空、边界不裁切和 marker visual evidence，已采纳 |
| `QA-Gate` | `Goodall-agent` | `019f168b-6623-7661-948b-b28d3a3ef62c` | worker | PASS / ACTIVE-REUSED | 用户要求重新尝试 Goodall-agent 后恢复原会话；已复核 `release-evidence/release-current-schema-backup-rollback-20260630-132306` 和 verifier 结果并给出 PASS，确认 backup/rollback 两个本地 SKIP 已关闭，剩余 3 个外部集成 SKIP 可接受 |
| `Ops-Harbor` / `QA-Orion` | `Meitner` | `019f170c-bdca-77e1-b951-6be02e4e5657` | explorer | PASS direction / CLOSED | 只读复核 backup restore drill 长 `backup_id` 缺陷，建议 hash scratch DB 名、不收紧 artifact backup id、补 fake-docker 长 id 回归，已采纳 |
| `Product-Luna` | `Chandrasekhar` | `019f14d3-ac04-70b0-90c8-efc53a540238` | explorer | PASS direction / CLOSED | 定义 ScanTaskDetail 修复治理时间线 MVP，要求 6 类状态卡、关键事件、空态/异常态和下一步入口 |
| `FE-Pixel` | `Meitner` | `019f14d3-dee0-7d71-b869-a2766bb4d739` | explorer | PASS direction / CLOSED | 复核治理时间线插入位置、API 复用、320px 长文本换行和 `ActionButton` 入口 |
| `QA-Orion` | `Confucius` | `019f14d4-02e4-70d3-989e-df975b394418` | explorer | PARTIAL gate accepted / CLOSED | 要求新增 dedicated `scan-governance-timeline-ui-smoke`，证明 current scan 聚合、foreign scan 不出现、双 viewport 和无横向溢出 |
| `QA-Gate` | `Goodall` | `019f120d-14ea-7b83-894c-59e3f802fe88` | worker | PARTIAL fixed / CLOSED | 用户要求重新尝试 Goodall 原会话后完成只读复核；初判 PARTIAL，要求 smoke 和 API 参数绑定，已由本轮实现关闭 |
| `FE-Pixel` / `QA-Orion` | `Boole the 2nd` | `019f14db-279d-7143-b58c-3a0966d00a8d` | worker | PASS after integration / CLOSED | 实现 `scan-governance-timeline-smoke`、Playwright config、npm/Make 入口；初次暴露 UI 缺口，主线程修复后 smoke PASS |
| `FE-Pixel` | `Kuhn` | `019f14c3-1139-7c51-840b-9a149a6b503b` | explorer | PASS direction / CLOSED | 复核 public repo live UI 报告证据抽屉点击路径，建议走 Trace Map 入口，不硬断固定 score/排序/文件 |
| `QA-Orion` | `Pasteur` | `019f14c3-3eee-7f83-8002-b169695650ad` | explorer | PASS direction / CLOSED | 复核 live UI marker、scanTaskId 漂移、真实 code_chunks request/response 和 verifier/security 负例 |
| `Ops-Harbor` | `Ohm` | `019f14c3-627b-7382-8255-9c73d6f61218` | explorer | PASS direction / CLOSED | 复核 public repo UI drawer 增强继续归属 `public_repo_smoke_ui` 子门禁，不新增 release evidence 标准 step |
| `FE-Pixel` | `Huygens` | `019f14b5-c7bc-79d0-9ae8-3de99d4eb26e` | explorer | PASS direction / CLOSED | 复核报告证据抽屉 mock browser smoke 的交互范围、视口、无横向溢出和独立 config/spec 边界 |
| `QA-Orion` | `Halley` | `019f14b5-c80b-7040-bfc0-77531d6a27e2` | explorer | PASS direction / CLOSED | 复核 `REPORT_EVIDENCE_DRAWER_SMOKE_OK` marker、未 mock API、scanTaskId/query/limit 和 chunk 摘要断言 |
| `Ops-Harbor` | `Poincare` | `019f14b5-c866-7731-80cf-35025f57b9cf` | explorer | PASS direction / CLOSED | 复核 Make/npm 入口、5185 端口、mock-only smoke 不进入 release evidence 标准 step 的边界 |
| `QA-Gate` | `Goodall-agent` via `Descartes` | `019f14ba-22ce-7e50-9677-89403706db62` | explorer | PASS direction / CLOSED | 用户要求重新尝试 Goodall-agent 后创建的治理复核会话；确认六个治理文档足够，只需最小追加记录和 PM 验收清单 |
| `Product-Luna` | `Pascal` | `019f14ad-6eed-78c3-a2ac-ad14a17eb7da` | explorer | PASS direction / CLOSED | 定义证据抽屉 code_chunks 摘要 MVP，要求 Top 3、文件行号、证据类型、主证据/上下文、分数和预览 |
| `FE-Pixel` | `Kierkegaard` | `019f14ad-6f44-7a30-99bf-bd4e091fbad2` | explorer | PASS direction / CLOSED | 复核抽屉动态请求路径，要求不复用页面级 readiness、清空旧结果、filePath:line 查询、score 不乘 100 和 CSS 门禁 |
| `QA-Orion` | `Gauss` | `019f14ad-6f94-70b1-b30a-710483337613` | explorer | PASS direction / CLOSED | 复核最小验证矩阵，要求静态合同、build 和后续 browser click smoke 建议 |
| `Product-Luna` | `Parfit` | `019f14a4-96e6-7f32-9475-3d8ceae3b914` | explorer | PASS direction / CLOSED | 定义报告证据抽屉 MVP 字段和接入优先级，建议先接风险/API/DB/Trace Map 和扫描绑定 QA/AutoRepair |
| `FE-Pixel` | `Banach` | `019f14a4-973a-77f1-bb27-8b57888aeae5` | explorer | PASS direction / CLOSED | 复核 Drawer 低风险实现路径，建议文件内组件、本地 state、ActionButton、独立 `.sl-report-evidence-drawer*` 样式 |
| `QA-Orion` | `Carson` | `019f14a4-978e-7280-acbc-70c0d73ce5d6` | explorer | PASS direction / CLOSED | 给出证据抽屉最小验证矩阵，要求静态 UI 合同和 build 通过，browser smoke 后置 |
| `Product-Luna` | `Dewey` | `019f1499-2208-7493-b90b-de2d042b01f1` | explorer | PARTIAL accepted / CLOSED | 复核报告页产品缺口，指出证据抽屉和修复闭环看板是下一阶段重点，本轮采纳为后续路线 |
| `FE-Pixel` | `Raman` | `019f1499-44d8-7b52-a9fa-cbf378cf52a0` | explorer | PASS direction / CLOSED | 复核报告页行动密度、主入口和移动端门禁，建议小范围强化状态入口，本轮采纳为 review gate |
| `QA-Orion` | `Leibniz` | `019f1499-6492-7da1-9510-b73429fc661d` | explorer | PASS direction / CLOSED | 复核报告页静态门禁缺口，建议锁定矩阵和窄屏合同，本轮采纳为 `validate-frontend-ui` review gate 合同 |
| `QA-Gate` | `Singer` | `019f149c-1a9d-70d3-bc5c-c98e34146fad` | worker | PASS / CLOSED | Goodall 等价重试会话，确认 AgentChat tool audit backend smoke 从 PARTIAL 升级为 PASS，可继续报告页/前端体验收口 |
| `Ops-Harbor` | `Pauli` | `019f1477-27fc-7560-a036-4fa621d3c22a` | explorer | PASS direction / CLOSED | 复核 AgentChat audit UI release evidence 接入方案，建议标准 step、默认 false、release/nightly true、不依赖 `SOURCELENS_BASE_URL`，已采纳 |
| `QA-Orion` | `Averroes` | `019f1477-4acc-7170-a0d7-44a9fb8c12e9` | explorer | PASS direction / CLOSED | 复核 `AGENT_CHAT_AUDIT_SMOKE_OK` verifier 字段和负例边界，固定 fixture 与 conversation filter 校验已采纳 |
| `Sec-Sentinel` | `Locke` | `019f1477-6a9d-7223-99c0-667043945dfe` | explorer | PASS direction / CLOSED | 复核 mock-only 安全边界，要求 `unset SL_UI_SMOKE_BASE_URL`、`mockedApiOnly`、local-only host 和 security regression，已采纳 |
| `Product-Luna` | `Ptolemy` | `019f1463-eff8-7833-a5e1-3d151aeca5db` | explorer | PASS direction / CLOSED | 复核 AgentChat 工具证据到 AuditLogs 的产品闭环，建议第一阶段以 `conversationId` 作为主键，已采纳 |
| `Arch-Atlas` | `Mendel` | `019f1464-2515-76e1-9c1f-990d356acfaa` | explorer | PASS direction / CLOSED | 复核后端 API 和项目边界，要求后端过滤 `conversationId` 而非前端-only 过滤，已采纳 |
| `QA-Orion` | `Sagan` | `019f1464-4c3a-7c63-bcbf-c153eb9528de` | explorer | PASS direction / CLOSED | 给出 AgentChat 审计深链测试矩阵、静态门禁和 mock browser smoke 要求，已采纳 |
| `QA-Gate` | `Goodall` | `019f120d-14ea-7b83-894c-59e3f802fe88` | worker | PASS / CLOSED | 原 Goodall 会话已恢复并完成 AgentChat audit deep link 只读 QA 复核，无 blocking issue；`security-regression-check.sh` 未作为本轮通过证据 |
| `Product-Luna` | `Bernoulli` | `019f1459-88b9-7982-b57f-6af96c54cbd1` | explorer | PARTIAL accepted / CLOSED | 复核 AgentChat 工具证据产品信任，建议“本轮证据”摘要和保守边界文案，已采纳 |
| `FE-Pixel` | `Peirce` | `019f1459-d1b6-7391-8d2d-bd011be4430f` | explorer | PARTIAL accepted / CLOSED | 复核消息流和 AgentToolCall ARIA，要求 live region、textarea label、region/status/focus ring，已采纳 |
| `QA-Orion` | `Aristotle` | `019f145a-03b7-72b3-8eb5-ac86a3fb6f79` | explorer | PASS direction / CLOSED | 给出 AgentChat 工具证据静态门禁和最小验证矩阵，已采纳 |
| `FE-Pixel` | `Schrodinger` | `019f1452-5ffb-7f63-a578-2dd0c2feee79` | explorer | PARTIAL accepted / CLOSED | 复核 AgentChat 会话池半修复风险，要求 list/listitem + 原生 Link，已采纳 |
| `QA-Orion` | `Plato` | `019f1452-81af-7540-9343-edfb4f2055f7` | explorer | PARTIAL accepted / CLOSED | 要求静态门禁拒绝 `div role=button`，本轮不强制 Playwright smoke，已采纳 |
| `Product-Luna` | `Avicenna` | `019f1442-2e26-7f40-901a-83033916dbc6` | explorer | PARTIAL accepted / CLOSED | 建议优先做 PATCH_READY 审查闭环条，四项证据入口已由本轮实现 |
| `FE-Pixel` | `Hegel` | `019f1442-2e77-75d0-a4ee-a8b61418d534` | explorer | PARTIAL accepted / FOLLOW-UP | 提出 AgentChat conversation list Space 键、ARIA 和 focus-visible 风险；未混入本轮，进入下一轮前端 follow-up |
| `QA-Orion` | `Planck` | `019f1442-2edb-75a0-aa70-ed0b887b0810` | explorer | PASS direction / CLOSED | 提供 PATCH_READY checklist 最小验证矩阵和主按钮 computed color 断言建议，已采纳 |
| `QA-Gate` | `Goodall` | `019f120d-14ea-7b83-894c-59e3f802fe88` | worker | FAIL fixed -> PASS retry / CLOSED | 重新尝试 Goodall 后指出 static gate 顺序脆弱和 smoke strict mode duplicate；阻断项修复后二次复核 PASS |
| `Ops-Harbor` | `Franklin` | `019f1426-88fa-7432-8133-2b59fc7b9b2f` | explorer | PARTIAL accepted / CLOSED | 复核 backup/restore/rollback 生产证据缺口，要求真实 artifact 四件套和 nightly 前置条件；已由本轮证据关闭 |
| `Sec-Sentinel` | `Aquinas` | `019f1426-ab04-7e11-9015-e9439613a838` | explorer | PARTIAL accepted / CLOSED | 复核备份目录、权限、checksum、secret 和伪证据风险；已由私有备份目录和 verifier 关闭 |
| `QA-Gate` | `Helmholtz` | `019f1426-cc1b-71b0-93cb-b9b4c2c8f6ba` | explorer | PARTIAL accepted / CLOSED | 复核 SKIP 分类，确认 backup restore / rollback 是生产阻断，GitHub/webhook/LLM 是 P12-pre 可接受后置项 |
| `QA-Gate` | `Goodall` | `019f120d-14ea-7b83-894c-59e3f802fe88` | worker | PASS retry / CLOSED | 原 Goodall 会话已恢复并复核 `release-evidence/nightly-20260630-002144`：backup restore 与 rollback plan 为 OK，剩余 3 个 SKIP 在 local nightly 下可接受 |
| `Sec-Sentinel` | `Ramanujan` | `019f1207-7d38-7f53-a93f-bf66edbb7d9b` | explorer | FAIL 已接收 | 发现 seed controller prod+dev/test profile 风险与 strict sample 非本地写入风险 |
| `Arch-Atlas` | `Cicero` | `019f1207-d44a-7790-85ab-707f37315928` | explorer | PASS 已接收 | 审查 dev/test seed endpoint 架构边界与后续迁移方向 |
| `QA-Orion` | `Nietzsche` | `019f1207-ab67-7673-9eb9-855cada554a1` | explorer | FAIL 已接收 | 发现 release evidence 未强制证明 `sampleSeeded=true` 和三源 `total>=1` |
| `BE-Forge` | `Arendt` | `019f120c-df99-73d0-b304-242078a6b773` | worker | PASS 复核通过 | 后端 seed controller、安全启动校验和边界测试已通过 `mvn -q -Dtest=AuditWorkbenchSmokeSeedControllerTest,SecurityStartupValidatorTest test` |
| `QA-Gate` | `Goodall` | `019f120d-14ea-7b83-894c-59e3f802fe88` | worker | PASS retry + public repo QA PASS + live evidence PASS | 初次 sample seed 成果物 retry 已通过；恢复原 Goodall 会话后复核 `public-repo-smoke` 标准 step和 focused live evidence，verifier/rg/DB 抽查通过 |
| `Ops-Harbor` | `Rawls` | `019f13d2-fd44-7f33-b1dc-4c638a88676f` | explorer | PASS accepted / CLOSED | 建议 public repo UI smoke 作为 `public-repo-smoke` 子门禁，不新增标准 step；方案已采纳 |
| `QA-Orion` | `Faraday` | `019f13d3-25aa-7773-b6d0-23657c559b52` | explorer | PARTIAL accepted / CLOSED | 要求 verifier 解析 `PUBLIC_REPO_UI_SMOKE_OK` 并补动态篡改负例；已由本轮实现关闭 |
| `QA-Gate` | `Goodall` | `019f120d-14ea-7b83-894c-59e3f802fe88` | worker | PARTIAL returned -> evidence PASS | 重新尝试原 Goodall 会话后打回 release evidence 子门禁缺口；本轮已补 manifest/profile/verifier/security regression 和 focused package |
| `FE-Pixel` | `Zeno` | `019f13e9-d60e-7582-885b-424916fc9cf3` | explorer | PARTIAL accepted / CLOSED | 320px narrow floor 审查发现 viewport、AntD Alert/List action、Descriptions/table 风险；已由本轮修复和门禁关闭 |
| `QA-Orion` | `Anscombe` | `019f13e9-ff80-7d50-96e1-606a64d4c5a3` | explorer | PARTIAL accepted / CLOSED | 要求 public repo UI smoke 与 PATCH_READY smoke 同时覆盖 320px 并写入 marker；已由本轮证据包关闭 |
| `QA-Gate` | `Goodall` | `019f120d-14ea-7b83-894c-59e3f802fe88` | worker | PARTIAL accepted -> 320 evidence PASS | 重新尝试 Goodall 后指出 release verifier/security/docs 未强制 320px；已由 `public-repo-ui-320-gate-20260629-232439` 关闭 |
| `Ops-Harbor` | `Nash` | `019f1402-bc18-7f82-b721-d40f79be927c` | explorer | PARTIAL accepted / CLOSED | full release profile readiness 审查，要求先做 target env 和 readiness 门禁，不直接跑完整 release |
| `QA-Gate` | `Heisenberg` | `019f1402-bc8d-7871-a09c-962e13d9e844` | explorer | PARTIAL accepted / CLOSED | 指出 focused packages 不能证明 full release/nightly，verifier 必须强制 `public_repo_smoke_ui` 字段存在 |
| `Sec-Sentinel` | `Godel` | `019f1402-bcfc-7ec2-a90e-9eb17ffcff04` | explorer | FAIL accepted / CLOSED | 阻断写入型 smoke 误打生产、`CLEANUP=false` 留样和外部 GitHub drill auto；已转为脚本硬门禁 |
| `Product-Luna` | `Goodall` | `019f120d-14ea-7b83-894c-59e3f802fe88` | worker | PARTIAL accepted / CLOSED | 重新尝试 Goodall 产品治理审查，确认 P12-pre 阶段和接下来两个 sprint 优先级 |
| `QA-Gate` | `Lagrange` | Not recorded | worker | CLOSED | 用户要求重新尝试 Goodall 会话后，Delivery Owner 关闭接替 worker Lagrange，恢复 Goodall 并打回同一任务 |
| `Product-Luna` | `Bohr` | `019f122c-7377-70d1-85b9-53f0938e77c6` | explorer | PASS 已接收 | 建议优先当前工作树下公开仓库主链路复核和收口 |
| `QA-Orion` | `Wegener` | `019f122c-a253-7fe2-92d3-3239b1c81d50` | explorer | PASS 已接收 | 建议长期 release evidence 和真实页面 smoke，提醒 broad tests 不能声称通过 |
| `AI-Vector` / `Arch-Atlas` | `Mill` | `019f122c-d013-73f2-9ee6-916e57d4f54f` | explorer | PASS 已接收 | 建议把 `public-repo-smoke` 接入 release evidence 标准 step |
| `Ops-Harbor` | `Fermat` | `019f1231-2808-75c2-8965-9f184139b349` | worker | PASS retry + live evidence accepted | 初次实现返工通过后，完成真实 live `public-repo-smoke` 和 focused release evidence 包；standalone sample `projectId=111`，focused sample `projectId=112` |
| `FE-Pixel` | `Hypatia` | `019f1264-a6f1-7bc2-831d-ac9524faebc6` | explorer | PARTIAL 已接收 | 只读审查发现 ProjectSelector/ProjectDetail 错误态、topbar 中宽和长用户名、Drawer/selector 移动端、Dashboard 表格和统计数字溢出风险 |
| `FE-Pixel` | `Sartre` | `019f1267-c54f-72e0-b247-e13c3fe0da0f` | worker | PASS retry 复核通过 | 实现 UI/runtime 最小闭环；初次交付因 `.sl-scan-step-summary` 长路径裁切被打回，返工 wrap/anywhere 后通过 |
| `BE-Forge` | `Euclid` | `019f127b-a308-7541-9d47-9966f2777dda` | worker | PASS retry accepted | 实现 `public-repo-smoke` role-specific probes；初次被打回，因为 `FRONTEND` 文件可冒充 Controller/Service，返工后 fallback 拒绝 `FRONTEND` 并记录 `matchedReason` |
| `AI-Vector` / `BE-Forge` | `Harvey` | `019f1283-27eb-74c2-a081-289254763669` | worker | PASS accepted | 修复 code_chunks role-intent 候选召回与 ranker 加权，新增前端 API 池截断 Controller 和 `ServiceChat.vue` 干扰 Service 回归测试 |
| `Product-Luna` | `Popper` | `019f129c-11f2-7760-aa47-ae338974726d` | explorer | PASS accepted | 定义 report -> QA -> AutoRepair candidate -> artifacts -> audit 的本轮产品闭环边界 |
| `QA-Orion` | `Dirac` | `019f129c-3a52-7803-8498-12da792f97a9` | explorer | PASS accepted | 给出浏览器 smoke 路线、错误 toast/溢出/URL 参数保持/关键控件验收矩阵 |
| `FE-Pixel` | `Bacon` | `019f129c-6623-73c1-aa2d-9444045b9c91` | explorer | PASS accepted | 发现 `ProjectDetail` scanTaskId 漂移、Graph latest scan 和 QA latest-only 文案风险 |
| `QA-Gate` | `Goodall` / `Epicurus` | `019f12a1-4d2c-7531-beed-31ae7896e491` | explorer | PASS accepted | 用户要求重新尝试 Goodall-agent 后创建的新 Goodall 职责会话；初次要求补 graph tab 点击、QA 真实证据和扫描详情真实点击流，Delivery Owner 补证后最终 PASS |
| `QA-Orion` | `Lorentz` | `019f12af-add2-73b0-8eec-d1aac5c27f1b` | explorer | PASS accepted | 定义 AutoRepair PATCH_READY 最小验收矩阵，要求证明 source scan、CHANGE_PATCH、execution、audit input 和页面回跳 |
| `BE-Forge` | `Kant` | `019f12af-cb96-7de3-9861-b778c844c2d2` | explorer | PASS accepted | 复核后端 PATCH_READY 链路，指出并推动补强 audit `scanTaskId` 和 `patchArtifactPath` smoke 断言 |
| `FE-Pixel` | `Copernicus` | `019f12af-e7eb-7c71-baf6-0c8d8bfd0651` | explorer | PASS accepted | 复核 PATCH_READY UI 回跳，指出 PR 二次确认、AutoRepair detail fallback、AuditLogs deep link 三项风险 |
| `Product-Luna` / `PM-Nova` | `Boole` | `019f12c1-7c25-7b22-86e5-66d481f0307d` | explorer | PASS accepted / CLOSED | Goodall-agent 重新尝试后的产品治理审查，确认 PATCH_READY 可复跑门禁/发布证据集成是当前优先级 |
| `Ops-Harbor` | `Jason` | `019f12c3-7ccc-79e3-92f4-c9c2971ab162` | explorer | PASS accepted / CLOSED | 确认无需新增发布脚本，应补 verifier 解析 `AUTOREPAIR_PATCH_SMOKE_OK` 并生成 focused live evidence |
| `FE-Pixel` | `Socrates` | `019f12c3-a8ce-7e80-b685-976c35b80b08` | explorer | PASS accepted / CLOSED | 确认静态合同强但缺 browser runtime smoke，建议后续 mock-driven Playwright |
| `QA-Orion` | `Laplace` | `019f12c3-cb8e-7b41-b980-fb2988d11681` | explorer | PASS accepted / CLOSED | 定义 PATCH_READY 可复跑门禁最小矩阵，指出 verifier payload 强解析缺口 |
| `FE-Pixel` | `Boyle` | `019f12d6-6240-73d3-b20e-bf11c1adc582` | worker | PASS accepted | 修复 PATCH_READY browser smoke route 边界，非 `/api/` Vite 源码模块放行，smoke 通过 |
| `QA-Orion` | `Tesla` | `019f12d6-98b1-7593-a86a-5ccb19ff1890` | explorer | PASS input | 定义 PATCH_READY browser smoke 验收矩阵：detail fallback、source scan、execution、audit deep link、PR 不提交 |
| `Sec-Sentinel` | `Noether` | `019f12d6-c451-7bd2-b75a-c77ea5b5d38d` | explorer | PASS input | 要求 `/api` 全 mock、fake token 隔离、submit-pr 不触发、未 mock API fail closed |
| `QA-Gate` | `Goodall` | `019f120d-14ea-7b83-894c-59e3f802fe88` | worker | FAIL returned -> PASS retry | 原 Goodall 会话先发现 `**/api/**` 误拦截 `/src/api/*.ts`，打回 FE-Pixel；修复后重跑 smoke/diff check 并 PASS |
| `Ops-Harbor` | `Einstein` | `019f12eb-e9dd-7240-a00b-a329c9d001d5` | explorer | PASS input | 本轮 release evidence step 命名/命令/log 审查；采纳 slug `patch-ready-ui-smoke` 和 log `patch-ready-ui-smoke.log`，默认模式被 Security 覆盖为 `false/SKIP` |
| `QA-Gate` | `Kepler` | `019f12ec-1243-7921-b014-8728d9452f6f` | explorer | PARTIAL input | 要求 `PATCH_READY_UI_SMOKE_OK` marker 和 verifier/tamper gate；核心 OK-without-marker 负例已纳入 security regression |
| `Sec-Sentinel` | `Dalton` | `019f12ec-38d3-7861-83a4-b0393abfa377` | explorer | PASS input | 要求默认 `false/SKIP`、显式 opt-in、local-only、清空外部 UI base URL、`submitPr=0` 和未 mock API 为 0 |
| `QA-Gate` | `Goodall` | `019f120d-14ea-7b83-894c-59e3f802fe88` | worker | PASS latest retry | 最新主工作区复核通过；重跑 syntax、diff check、`make patch-ready-ui-smoke`、`node scripts/validate-frontend-ui.mjs`、`./scripts/security-regression-check.sh` |
| `Ops-Harbor` | `Volta` | `019f133c-b1f2-7a70-b756-e722e877f619` | explorer | PARTIAL input | 建议新增 release evidence profile 和 Make targets；普通 CI 保持快速无 secret；指出旧 evidence 包与当前 verifier 漂移 |
| `Sec-Sentinel` | `James` | `019f133c-b24c-7201-b814-096f8ca0e6a8` | explorer | PASS input | 确认普通 CI 低权限边界；阻断 secrets、pull_request_target、job-level 提权和 checkout 持久化凭据 |
| `QA-Gate` | `Erdos` | `019f133c-b2a1-7ac3-938a-4ca5e61a390e` | explorer | PARTIAL input | 要求 profile 成为 manifest 一等字段，verifier 必须反推 include mode 并补 profile tamper 负例 |
| `Ops-Harbor` | `Hooke` | `019f135b-1711-7400-909e-d11ce520a4f0` | explorer | PARTIAL input / accepted | 建议 `release-evidence-ci` 独立 job、runner temp 证据目录、生成后 verifier，不与 security job 混合 |
| `Sec-Sentinel` | `McClintock` | `019f135b-84a6-77e3-ab86-5d4266706ba1` | explorer | PARTIAL input / accepted | 要求普通 CI 保持无 secrets/无 release-nightly/无真实 env，并把这些边界写入 security regression |
| `QA-Orion` / `QA-Gate` | `Turing` | `019f135b-da97-7e52-a9f4-eebd829ea191` | explorer | PARTIAL input / accepted | 要求 CI gate 生成真实 `ci` profile package、运行 verifier、grep manifest/summary 并上传短期 artifact |
| `AI-Vector` | `Maxwell` | `019f1380-1a58-7b82-ac95-1bdc4ff7e820` | explorer | PARTIAL input / accepted | 确认自然语言 endpoint/接口缺口真实，要求保留前端 route 语境保护 |
| `BE-Forge` | `Curie` | `019f1380-50a1-71a3-a592-46f209b2131a` | explorer | PARTIAL input / accepted | 确认无需改召回结构，但必须补 `roleIntentTypes` 和结构评分，避免中文接口被 `score <= 0` 过滤 |
| `QA-Orion` | `Archimedes` | `019f1380-7954-7f70-8c69-903b53a06e00` | explorer | PARTIAL input / accepted | 要求覆盖 `login endpoint`、`登录接口`、`订单路由` 正例和前端 route/page/component 负例 |

## 8. 成果物包与打回状态

| 固定代号 | Runtime | 成果物包状态 | Delivery Owner 处理 | 下一步 |
| --- | --- | --- | --- | --- |
| `Sec-Sentinel` | `Ramanujan` / `019f1207-7d38-7f53-a93f-bf66edbb7d9b` | `FAIL` | 不由 `Lead-Codex` 私自补完；打回安全岗位继续补齐风险处置方案或验证证据 | 原岗位提交安全边界修复/验证后的新包 |
| `Arch-Atlas` | `Cicero` / `019f1207-d44a-7790-85ab-707f37315928` | `PASS` | 可被集成；架构意见作为 sample seed 边界依据 | 集成时保留 dev/test 边界说明 |
| `QA-Orion` | `Nietzsche` / `019f1207-ab67-7673-9eb9-855cada554a1` | `FAIL` | 不由 `Lead-Codex` 私自补完；打回 QA 岗位补 release evidence 强断言 | 原岗位补 `sampleSeeded=true` 与三源 `total>=1` 证明 |
| `QA-Gate` | `Goodall` / `019f120d-14ea-7b83-894c-59e3f802fe88` | `FAIL returned` -> `PASS retry` | 初次包因 `scripts/security-regression-check.sh` trailing whitespace 与非 Long path preflight HTTP 500 被打回；Goodall retry 改为 `/dev/projects/0/audit-workbench-smoke-seed` + `repositoryId=0` 后通过 | 已闭环，保留 local-only strict sample 与 verifier strict evidence |
| `QA-Gate` | `Lagrange` / Not recorded | `CLOSED` | 用户要求重试 Goodall 后关闭接替 worker，避免主流程责任漂移 | 不采纳 Lagrange 接替路径 |
| `BE-Forge` | `Arendt` / `019f120c-df99-73d0-b304-242078a6b773` | `PASS reviewed` | Delivery Owner 已复核后端测试通过 | 后端成果物闭环 |
| `Product-Luna` | `Bohr` / `019f122c-7377-70d1-85b9-53f0938e77c6` | `PASS reviewed` | 采纳“公开仓库主链路优先复核和收口”方向 | 主链路仍 ACTIVE，进入真实 live smoke 和长期证据包 |
| `QA-Orion` | `Wegener` / `019f122c-a253-7fe2-92d3-3239b1c81d50` | `PASS reviewed` | 采纳“长期 release evidence + 真实页面 smoke”要求；保留 broad tests 未运行的边界 | 后续不能声称 broad tests 已通过 |
| `AI-Vector` / `Arch-Atlas` | `Mill` / `019f122c-d013-73f2-9ee6-916e57d4f54f` | `PASS reviewed` | 采纳将 `public-repo-smoke` 接入 release evidence 标准 step 的建议 | 已由 Ops-Harbor/Fermat 实现并复核 |
| `Ops-Harbor` | `Fermat` / `019f1231-2808-75c2-8965-9f184139b349` | `FAIL returned` -> `PASS retry` | 初次实现被 Delivery Owner 打回：security regression 轻量 package-mode 探针输出 `16 skipped step(s)` 后失败；返工后复核通过 | 接入阶段边界已由后续 `PASS live evidence` 闭环 |
| `QA-Gate` | `Goodall` / `019f120d-14ea-7b83-894c-59e3f802fe88` | `PASS reviewed` | 用户要求重新尝试 Goodall-agent 会话后，Delivery Owner 恢复原 Goodall 会话；Goodall 对 `public-repo-smoke` release evidence 标准 step 做独立只读 QA 复核，建议采纳 | 只读 QA 阶段边界已由后续 live evidence 闭环；正式完整发布包仍未完成 |
| `Ops-Harbor` | `Fermat` / `019f1231-2808-75c2-8965-9f184139b349` | `PASS live evidence` | 完成真实 live public repo smoke，并生成 focused release evidence 包 `/Users/lijunpeng/Desktop/cc/project/SourceLens/release-evidence/public-repo-smoke-live-20260629-154921`；verifier 通过 | 本包是 focused public repo smoke live evidence，不是完整发布验收包；`skipped=15` |
| `QA-Gate` | `Goodall` / `019f120d-14ea-7b83-894c-59e3f802fe88` | `PASS live evidence review` | 独立只读复核 focused evidence：verifier 通过、rg 关键证据命中、Docker MySQL healthy、DB 抽查 `scanTaskId 87/88` 计数一致 | 前端 UI 本轮未验证，不声明 UI 已完成 |
| `Lead-Codex` | Current thread | `PASS spot check` | 主线程抽检 verifier、manifest/status/summary/log 命中和 DB 计数一致 | `CLEANUP=false` 留下本地审计样本，后续可清理或作为验收 fixture |
| `FE-Pixel` | `Hypatia` / `019f1264-a6f1-7bc2-831d-ac9524faebc6` | `PARTIAL reviewed` | 只读审查发现多处 UI/runtime 风险，作为 Sartre 实现输入 | 已由 Sartre 修复并经 Delivery Owner/Goodall 复核 |
| `FE-Pixel` | `Sartre` / `019f1267-c54f-72e0-b247-e13c3fe0da0f` | `FAIL returned` -> `PASS retry` | 初次实现完成错误态、移动端换行、topbar 收敛、Drawer 宽度、表格 scroll 和数字换行；Delivery Owner smoke 发现 `.sl-scan-step-summary` 长路径裁切后打回；返工改 wrap/anywhere 后通过 | 本轮是前端 UI/runtime 最小闭环，不是全站深层交互全覆盖 |
| `QA-Gate` | `Goodall` / `019f120d-14ea-7b83-894c-59e3f802fe88` | `PASS frontend review` | 独立复核 `make frontend-ui-check`、`npm run build`、`git diff --check` 通过，并审核 Delivery Owner 浏览器证据足够 | Goodall 未独立重新跑全量浏览器 smoke；浏览器证据由 Delivery Owner 执行 |
| `BE-Forge` | `Euclid` / `019f127b-a308-7541-9d47-9966f2777dda` | `FAIL returned` -> `PASS retry` | 初次 role probe 可被 `FRONTEND` 结果冒充，通过但质量不合格；Delivery Owner 打回后返工为强角色信号和 `matchedReason` | 已被 Harvey 后端修复和真实 smoke 共同验证 |
| `AI-Vector` / `BE-Forge` | `Harvey` / `019f1283-27eb-74c2-a081-289254763669` | `PASS reviewed` | 修复 DB LIMIT 被前端 API 池吃满导致 Controller 无法进入候选集的问题；新增 role-intent candidates 和 ranker 加权 | P6 role-specific retrieval 已通过真实 smoke |
| `QA-Gate` | `Goodall` / `019f120d-14ea-7b83-894c-59e3f802fe88` | `PASS role retrieval review` | 独立复核 syntax、diff check、后端定向测试；未重放 live smoke，引用 Delivery Owner `scanTaskId=91` 证据 | 当前 probes 面向 Java/Spring/MyBatis；未来需 repo profile 化 |
| `QA-Gate` | `Goodall` / `019f120d-14ea-7b83-894c-59e3f802fe88` | `FAIL returned` -> `PASS retry browser smoke` | 用户要求重新尝试 Goodall-agent 原会话后，Goodall 先判定 PATCH_READY browser smoke FAIL：`page.route('**/api/**')` 误拦截 `/src/api/*.ts`；FE-Pixel/Boyle 修复后 Goodall 重跑 `npm run smoke:patch-ready` 和 diff check，最终 PASS | 可采纳为 mock-driven browser smoke 最小闭环；不覆盖真实后端 PATCH_READY 数据、真实 GitHub App PR 或真实 artifact 文件读取 |

## 9. 最新验收证据

| Evidence | Result |
| --- | --- |
| Public repo live evidence drawer UI | PASS；`SOURCELENS_BASE_URL=http://localhost:8080 SOURCELENS_PUBLIC_REPO_SMOKE_UI=true SOURCELENS_PUBLIC_REPO_SMOKE_CLEANUP=false SOURCELENS_PUBLIC_REPO_SMOKE_TIMEOUT_SECONDS=900 make public-repo-smoke` 通过；`projectId=138`、`repositoryId=99`、`scanTaskId=109`；`PUBLIC_REPO_UI_SMOKE_OK` 包含 `Report Evidence Drawer` 与 `evidenceDrawer.status=OK/opened=true/codeChunksSummaryVisible=true/displayedChunk=true/limit=3/resultCount=6988`；`PUBLIC_REPO_SMOKE_OK` 证明 7 artifacts、17,001 code_chunks、3,697 graph nodes、880 graph edges、Code QA 8 条证据和 artifact quality OK |
| Report evidence drawer browser smoke | PASS；`make report-evidence-drawer-ui-smoke` 通过，输出 `REPORT_EVIDENCE_DRAWER_SMOKE_OK`，`mockedApiOnly=true`，`unhandledApiRequests=0`，`drawerQueryCount=2`，viewports `1440x900` / `320x740`；`node scripts/validate-frontend-ui.mjs`、`cd web-console && npm run build`、targeted `git diff --check` 均通过 |
| Release evidence profile contract | PASS；`ci` profile 轻量证据包通过 verifier，`release` profile required-failure 包通过 verifier，fixed-profile include override 按预期拒绝；full `security-regression-check.sh` PASS |
| PATCH_READY UI smoke release evidence step | PASS；`./scripts/security-regression-check.sh`、`make patch-ready-ui-smoke`、`node scripts/validate-frontend-ui.mjs`、targeted `git diff --check` 均通过；default skip 和 forced live release evidence 包均通过 verifier；Goodall latest retry PASS |
| PATCH_READY mock-driven browser smoke | PASS；`make patch-ready-ui-smoke` 通过，覆盖 detail fallback、source scan #501、diff、patch artifact action、execution steps、PR Popconfirm cancel、`submit-pr=0`、audit deep link drawer、关联资源回 AutoRepair、未 mock `/api` fail closed |
| Goodall PATCH_READY browser smoke QA retry | PASS；原 Goodall 会话 `019f120d-14ea-7b83-894c-59e3f802fe88` 初次 FAIL 并打回 FE-Pixel，指出 `**/api/**` 误拦截 `/src/api/*.ts`；FE-Pixel 修复后 Goodall 重跑 `npm run smoke:patch-ready` 和 targeted `git diff --check`，最终 PASS |
| PATCH_READY browser smoke validation suite | PASS；`make patch-ready-ui-smoke`、`cd web-console && npm run build`、`node scripts/validate-frontend-ui.mjs`、`./scripts/security-regression-check.sh`、targeted `git diff --check` 均通过 |
| AutoRepair patch release evidence payload gate | PASS；`verify-release-evidence.sh` 新增 `AUTOREPAIR_PATCH_SMOKE_OK` JSON 强解析，`./scripts/security-regression-check.sh` 通过并覆盖 forged OK without marker 负例 |
| Focused AutoRepair patch live evidence | PASS；`release-evidence/autorepair-patch-live-20260629-175331`，`include_autorepair_patch_smoke: true`，`OK autorepair-patch-smoke`，`AUTOREPAIR_PATCH_SMOKE_OK`，`scanTaskId=94`，`autoRepairId=10`，`patchArtifactId=286`，`execution.taskId=49`，`auditLogId=329`，`make verify-release-evidence DIR=...` 通过 |
| `bash -n scripts/audit-workbench-smoke.sh scripts/release-evidence.sh scripts/verify-release-evidence.sh scripts/security-regression-check.sh && git diff --check -- scripts/audit-workbench-smoke.sh scripts/release-evidence.sh scripts/verify-release-evidence.sh scripts/security-regression-check.sh` | PASS |
| `SOURCELENS_BASE_URL=http://localhost:18080 SOURCELENS_AUDIT_WORKBENCH_SMOKE_REQUIRE_SAMPLES=true make audit-workbench-smoke` | PASS；`AUDIT_WORKBENCH_SMOKE_OK`，`sampleSeeded=true`，三源 `total=1`，临时 `projectId=108` 已清理 |
| `./scripts/security-regression-check.sh` | PASS；`Security regression checks passed.` |
| `bash -n scripts/release-evidence.sh scripts/verify-release-evidence.sh scripts/security-regression-check.sh && git diff --check -- scripts/release-evidence.sh scripts/verify-release-evidence.sh scripts/security-regression-check.sh docs/OPERATIONS_RUNBOOK.md docs/PHASE_REQUIREMENTS.md docs/REFACTOR_ROADMAP.md docs/CODEX_HANDOFF.md` | PASS |
| `./scripts/security-regression-check.sh` public repo release evidence retry | PASS；`Security regression checks passed.` |
| `SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PUBLIC_REPO_SMOKE=true` required failure 抽检 | PASS；缺 `SOURCELENS_BASE_URL` 生成 `FAIL public-repo-smoke`，verifier 通过 |
| `SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PUBLIC_REPO_SMOKE=false` false skip 抽检 | PASS；生成 `SKIP public-repo-smoke`，verifier 通过，`skipped=16` |
| Goodall read-only QA：`bash -n scripts/release-evidence.sh scripts/verify-release-evidence.sh scripts/security-regression-check.sh` | PASS |
| Goodall read-only QA：`git diff --check -- scripts/release-evidence.sh scripts/verify-release-evidence.sh scripts/security-regression-check.sh docs/OPERATIONS_RUNBOOK.md docs/PHASE_REQUIREMENTS.md docs/REFACTOR_ROADMAP.md docs/CODEX_HANDOFF.md docs/AGENT_STATUS_BOARD.md docs/AGENT_ACTIVITY_LOG.md docs/PRODUCT_PROGRESS_LOG.md` | PASS |
| Goodall read-only QA：`./scripts/security-regression-check.sh` | PASS；`Security regression checks passed.` |
| Goodall boundary note | PASS 结论只覆盖只读 QA 复核；没有完成真实 live `make public-repo-smoke`，没有生成长期 release evidence package；误触的 `make public-repo-smoke` 已立即中断，不能作为证据 |
| Fermat standalone live public repo smoke | PASS；`SOURCELENS_BASE_URL=http://localhost:8080 SOURCELENS_PUBLIC_REPO_SMOKE_CLEANUP=false SOURCELENS_PUBLIC_REPO_SMOKE_DB_COUNTS=true SOURCELENS_PUBLIC_REPO_SMOKE_ARTIFACT_QUALITY=true SOURCELENS_PUBLIC_REPO_SMOKE_TIMEOUT_SECONDS=900 make public-repo-smoke` 输出 `PUBLIC_REPO_SMOKE_OK`；`projectId=111`、`repositoryId=72`、`scanTaskId=87`；`chunks=17001`、`symbols=7612`、`relations=880`、`artifacts=7`、`artifactRecords=7`、`artifactQuality.status=OK` |
| Fermat focused release evidence | PASS；`/Users/lijunpeng/Desktop/cc/project/SourceLens/release-evidence/public-repo-smoke-live-20260629-154921`，`include_public_repo_smoke: true`，`OK public-repo-smoke`，`PUBLIC_REPO_SMOKE_OK`，`projectId=112`、`repositoryId=73`、`scanTaskId=88`，`required_failures=0`、`optional_warnings=0`、`skipped=15`，`./scripts/verify-release-evidence.sh <run-dir>` 通过 |
| Goodall focused evidence QA | PASS；verifier 通过，rg 关键证据命中，Docker MySQL healthy，DB 抽查 `scanTaskId 87/88` 均为 `code_chunks=17001`、`code_symbols=7612`、`code_relations=880`、`scan_artifacts=7` |
| Delivery Owner public repo live spot check | PASS；verifier 通过，manifest/status/summary/log 命中，DB 计数一致 |
| Public repo live boundary note | PASS；focused 包不是完整发布验收包；`make verify`、prod/preflight、file-bound/autorepair/audit、phase12、sandbox、GitHub App/webhook、LLM provider 等 step 显式跳过或未配置，`skipped=15`；本轮未验证前端 UI；`CLEANUP=false` 留下本地审计样本 |
| FE-Pixel/Hypatia read-only UI review | PARTIAL；发现 ProjectSelector/ProjectDetail API 失败无明确错误态、topbar 720-960px/长用户名裁切风险、Artifacts/AuditLogs Drawer 固定宽度和 ProjectSelector 移动端溢出风险、Dashboard 最近扫描表缺 `scroll.x`、统计数字 `nowrap` 截断风险 |
| FE-Pixel/Sartre implementation | PASS retry；ProjectSelector 错误态/重试和移动端换行、ProjectDetail project/repo/scan/overview error/retry、topbar <=960px 收敛和长用户名限制、Artifacts/AuditLogs Drawer `min(..., 92vw)`、Dashboard 最近扫描表 `scroll.x`、统计数字 wrap/anywhere；初次 `.sl-scan-step-summary` 长路径裁切被打回，返工后 `clipped=[]` |
| Frontend validation commands | PASS；`make frontend-ui-check`，`cd web-console && npm run build`，`git diff --check -- web-console/src/components/ProjectSelector.tsx web-console/src/components/AppLayout.tsx web-console/src/pages/ProjectDetail.tsx web-console/src/pages/Dashboard.tsx web-console/src/pages/Artifacts.tsx web-console/src/pages/AuditLogs.tsx web-console/src/styles/app.css` |
| Browser UI/runtime smoke | PASS；桌面 dashboard/project-detail/scan-detail/artifacts/audit-logs/auto-repairs/agent-tasks 无 error toast、无横向溢出；390px 同 routes 通过；320px dashboard/project-detail/artifacts/audit-logs 通过；Artifacts/AuditLogs 抽屉 320px 宽约 294px、overflow=0；scan detail 返工后 `clipped=[]` |
| Goodall frontend QA review | PASS；Goodall 独立运行 `make frontend-ui-check`、`npm run build`、`git diff --check`，并审核 Delivery Owner 浏览器证据足够；未独立重新跑全量浏览器 smoke |
| Frontend boundary note | PASS；本轮是前端 UI/runtime 最小闭环，不是全站深层交互全覆盖；未重新测试后端 broad tests 或完整发布 evidence |
| `cd backend-spring && mvn -q -Dtest=CodeChunkServiceTest,CodeQaRetrievalServiceTest,CodeChunkControllerTest,CodeQaControllerTest test` | PASS；覆盖 role-intent 候选召回、ServiceChat.vue 干扰、路径/行号/方法锚点相邻能力 |
| role-specific public repo smoke | PASS；`scanTaskId=91`，`PUBLIC_REPO_SMOKE_OK`，`chunks=17001`，`symbols=7612`，`relations=880`，Controller `ExamrecordController.java`、Service `DiandangshiServiceImpl.java`、DataAccess `ChatDao.xml` |
| Goodall role retrieval QA | PASS；`bash -n scripts/public-repo-analysis-smoke.sh`、targeted `git diff --check`、后端定向测试通过；Goodall 未重放 live smoke |
| Report-QA context static gate | PASS；`node scripts/validate-frontend-ui.mjs`、`cd web-console && npm run build`、`git diff --check -- web-console/src/pages/ProjectDetail.tsx scripts/validate-frontend-ui.mjs` |
| Report-QA context browser direct routes | PASS；QA、Graph、Artifacts、Audit、AutoRepair candidate 均无 error toast、`overflow=0`，保留 `scanTaskId=78`；QA 显示 `knowledge source #78`、`证据扫描 #78`，返回 `ExamrecordController.java`、`ConfigController.java` 等源码切片 |
| Report-QA context browser click-through | PASS；从 `/scan-tasks/78` 点击“进入问答”到 `/projects/90?tab=qa&scanTaskId=78`，再点“依赖图谱”到 `/projects/90?tab=graph&scanTaskId=78` 且显示 `扫描任务 #78`；“产物库”到 `SCAN_TASK #78`；“审计追踪”到 `scan #78`；“定位文件”进入 QA 并保留 `scanTaskId=78` |
| Report-QA context boundary note | PASS；本轮不生成 AutoRepair PATCH_READY，不声明补丁 artifact/execution/audit 终态；当前报告风险为项目级风险，真实点击应先进入 QA 定位文件 |
| AutoRepair PATCH_READY smoke | PASS；`CLEANUP=false make autorepair-patch-smoke` 生成 retained 样本 `projectId=117`、`repositoryId=78`、`scanTaskId=93`、`autoRepairId=9`、`patchArtifactId=278`、`executionTaskId=47`、`auditLogId=323`；audit output 包含 `scanTaskId=93` |
| AutoRepair PATCH_READY tests/build | PASS；`mvn -q -Dtest=AuditLogControllerTest,AutoRepairServiceTest,AutoRepairControllerTest test`、`node scripts/validate-frontend-ui.mjs`、`npm run build`、`bash -n scripts/autorepair-patch-smoke.sh`、targeted `git diff --check` |
| AutoRepair PATCH_READY browser routes | PASS；Scan #93、AutoRepair #9、AUTO_REPAIR #9 CHANGE_PATCH artifact、Execution task #47、Audit page 均无 error toast、无横向溢出 |
| AutoRepair audit deep link | PASS；`/audit-logs?projectId=117&resourceType=AUTO_REPAIR&resourceId=9&action=AUTO_REPAIR_PATCH_READY&status=SUCCESS&scanTaskId=93` 自动打开通用审计和 `Audit Event` drawer，显示 `scanTaskId: 93`、`patchArtifactPath`、目标文件，并可“打开关联资源”回 AutoRepair #9 |
| AutoRepair PR safety | PASS；PATCH_READY 详情点击“创建 PR”只打开 `创建受控 Pull Request？` 确认框；未点击确认，不触发外部 PR |
| strict release evidence 临时包 + verifier | PASS；manifest 有 `audit_workbench_smoke_require_samples: true`，status 有 `OK audit-workbench-smoke`，日志有 `sampleSeeded: true` 和三源 `total=1`，`required_failures=0`，`optional_warnings=0` |
| `mvn -q -Dtest=AuditWorkbenchSmokeSeedControllerTest,SecurityStartupValidatorTest test` | PASS；BE-Forge/Arendt 成果物通过 Delivery Owner 复核 |

## 2026-06-30 最新状态：Public repo UI governance timeline gate

| Item | Status |
| --- | --- |
| Goodall 原会话恢复 | PASS；恢复 `QA-Gate/Goodall` 原会话 `019f120d-14ea-7b83-894c-59e3f802fe88` |
| Goodall 初次复核 | FAIL；指出 static gate 与 marker 合同不一致、release verifier 未校验 `governanceTimeline`、security regression 缺 valid payload 和伪造负例 |
| Delivery Owner 返工 | PASS；补 `Scan Governance Timeline` marker page、verifier 强校验、security regression valid payload 和治理负例、static gate 新合同 |
| Goodall retry | PASS；确认 release verifier/security regression/static UI gate 已能防止缺失或伪造 governance timeline 证据被误收 |
| 验证命令 | PASS；`node scripts/validate-frontend-ui.mjs`、`bash -n ...`、targeted `git diff --check`、`./scripts/security-regression-check.sh`、`cd web-console && npm run build` |
| 当前边界 | 本轮未重跑真实 `make public-repo-smoke`，未生成新的长期 release evidence package；代码门禁可采纳，最新 live evidence 仍需后续补跑 |

## 2026-06-30 最新状态：Public repo UI governance live evidence

| Item | Status |
| --- | --- |
| 首次 live UI smoke | FAIL；`scanTaskId=110` 暴露 8080 stale backend 对 governance endpoint 返回 500 |
| 运行态复核 | PASS；临时 18080 当前代码后端对同一 DB 样本返回 200，确认代码路径可用 |
| 8080 刷新 | PASS；重启 8080 当前代码后，`/api/projects/139/scan-tasks/110/governance-timeline` 返回 `SUCCESS`、`BOUND`、`eventCount=3` |
| Live public repo UI smoke | PASS；`projectId=140`、`repositoryId=101`、`scanTaskId=111`，`PUBLIC_REPO_UI_SMOKE_OK.governanceTimeline.status=OK` |
| Focused release evidence | PASS；`release-evidence/public-repo-ui-governance-live-20260629205404`，`projectId=141`、`repositoryId=102`、`scanTaskId=112`，`public_repo_smoke_ui=true` |
| Verifier | PASS；`./scripts/verify-release-evidence.sh release-evidence/public-repo-ui-governance-live-20260629205404` |
| 当前边界 | Focused 包不是完整 release/nightly 候选；后续仍需继续报告/QA/AutoRepair/Agent 主链路体验升级 |

## 2026-06-30 最新状态：Report/QA answer citation contract

| Item | Status |
| --- | --- |
| Goodall 下一主线复核 | PASS；建议优先推进 Report/QA 体验证据闭环，code_chunks/RAG 作为支撑线 |
| 产品审查 | PARTIAL -> Accepted；Product-Luna 认为抽屉/code_chunks 已强，但 QA 回答引用闭环不足 |
| 后端审查 | Accepted；BE-Forge 指出只靠自然语言 `[C1]` 是高风险，要求 answer-level citations |
| 前端审查 | Accepted；FE-Pixel 建议 hard display Scan/source/reason，并让 public UI smoke 真实提交 QA |
| 实现 | PASS；`CodeQaResponse.answerCitations`、`groundingStatus`、chunk `sourceLabel/citationId` 已落地 |
| UI | PASS；Project QA 显示 grounding 状态、回答引用卡片、Scan ID 和复制引用；报告证据抽屉 chunk card 显示 Scan/source/reason |
| 门禁 | PASS；frontend UI gate、security regression、release verifier 均加入 qaFromEvidence 合同 |
| QA-Orion 复核 | PASS；Goodall the 2nd 确认本轮 citation 合同无必须立即修复项，并记录 live smoke/evidenceRef/[C1] 强制引用边界 |
| 验证 | PASS；后端定向测试、前端构建、安全回归、targeted diff check 均通过 |
| 当前边界 | 尚未重跑真实 public repo UI smoke；`qaFromEvidence` live marker 和 focused evidence 包待下一步生成 |

## 2026-06-30 最新状态：Report/QA evidenceRef live gate

| Item | Status |
| --- | --- |
| 原 Goodall 会话恢复 | PARTIAL；`019f1543-9077-7873-b49d-fc4d6e2ecc34` 成功 resume 但连续等待无返回，已关闭 |
| Goodall successor QA 复核 | CONDITIONAL PASS；`Planck the 2nd / 019f155c-9b71-7bb2-9a69-c66d80694d3a` 要求补 `evidenceRef.filePath` 确定性 anchor、真实 smoke 和 release evidence |
| 后端 evidenceRef anchor | PASS；`CodeChunkService` 对 `filePath:` 证据路径补候选合并，`CodeChunkServiceTest` 覆盖干扰候选下目标文件仍优先 |
| QA 请求绑定 | PASS；Project QA POST body 携带 `evidenceRef`，public repo UI smoke 校验 `evidenceRef.filePath/category/source` |
| 发布证据防伪 | PASS；release verifier、security regression、frontend static gate 均校验 `qaFromEvidence.evidenceRef.requestBound/contextVisible/filePath` |
| Live public repo UI smoke | PASS；`projectId=145`、`repositoryId=106`、`scanTaskId=116`，`qaFromEvidence.status=OK`、`resultCount=8`、`citationCount=8`、`expectedEvidenceFileVisible=true` |
| Focused release evidence | PASS；`release-evidence/public-repo-ui-qa-evidenceref-live-20260630060508`，verifier 通过 |
| 当前边界 | Focused gate 不是完整 release/nightly 候选；`groundingStatus=UNVERIFIED` 仍被允许，后续可单独推进回答文本强制 `[C1]` 引用 |

## 2026-06-30 最新状态：QA citation enforcement live gate

| Item | Status |
| --- | --- |
| 后端引用强制 | PASS；LLM 首答有效引用为 `DIRECT_VERIFIED`，缺引用时进行一次修正重试，未配置 LLM/异常 fallback 为 `FALLBACK_CITED` |
| 响应合同 | PASS；`CodeQaResponse` 返回 `citationEnforcementStatus` 和 `citationEnforcementNote` |
| UI 展示 | PASS；Project QA 显示“首次引用已验证 / 引用已修正 / 检索证据引用 / 引用需人工复核” |
| 发布证据合同 | PASS；public repo UI smoke 要求 `groundingStatus=VERIFIED`、`citedChunkCount>0`、可用 `citationEnforcementStatuses` |
| 防伪门禁 | PASS；release verifier/security regression 拒绝 `UNVERIFIED`、`citedChunkCount=0`、缺 enforcement status 和 `RETRY_FAILED` marker |
| Live public repo UI smoke | PASS；`projectId=147`、`repositoryId=108`、`scanTaskId=118`，`qaFromEvidence.groundingStatuses=["VERIFIED"]`、`citationEnforcementStatuses=["FALLBACK_CITED"]`、`citedChunkCount=1` |
| Focused release evidence | PASS；`release-evidence/public-repo-ui-qa-citation-enforced-live-20260630062156`，verifier 通过 |
| 当前边界 | Focused gate 不是完整 release/nightly 候选；真实 LLM provider 的 `DIRECT_VERIFIED/RETRY_VERIFIED` 质量仍需后续 provider evidence |

## 2026-06-30 最新状态：LLM provider eval generator gate

| Item | Status |
| --- | --- |
| Goodall-agent 会话 | PASS；重新启动 `Goodall-agent`，系统昵称 `Harvey the 2nd`，id `019f1582-73ba-7252-b4da-d3250998f7d3` |
| Goodall 实质产出 | PASS；补 provider eval generator 动态探针、`llm-safety-regression` 语法门禁、Makefile target 绑定断言和 executable bit |
| Lead-Codex 审核 | PASS；接收 Goodall 成果，补 release evidence status tamper probe 的 dirty-worktree 隔离 |
| LLM safety gate | PASS；`./scripts/llm-safety-regression.sh` 通过，覆盖 7 prompt injection、7 output quality、14 provider template cases 和 12 个后端测试 |
| Security gate | PASS；`./scripts/security-regression-check.sh` 通过 |
| 当前边界 | 未执行真实 provider live eval；下一步需要用真实 provider key 生成可归档 `llm-provider-run` 证据 |

## 2026-06-30 最新状态：LLM provider eval mock success smoke

| Item | Status |
| --- | --- |
| 本地 mock provider smoke | PASS；`make llm-provider-eval-mock-smoke` 输出 `LLM_PROVIDER_EVAL_MOCK_SMOKE_OK`，14 cases / 14 artifacts |
| LLM safety 集成 | PASS；`./scripts/llm-safety-regression.sh` 已运行 mock success smoke 并通过 |
| Security static gate | PASS；全量 `./scripts/security-regression-check.sh` 通过 |
| Curie-agent 审查 | PASS；`Darwin the 2nd / 019f1593-1361-7941-90c0-29892d3a5353` 确认 mock success smoke 应保留，并独立跑通 `make llm-provider-eval-mock-smoke`、`make llm-safety-check`、`./scripts/security-regression-check.sh` |
| 当前边界 | mock smoke 不证明真实 provider 模型质量，只证明生成器成功路径和 evidence 合同 |

## 2026-06-30 最新状态：Dashboard next action browser smoke

| Item | Status |
| --- | --- |
| Dashboard 推荐行动 | PASS；`DashboardNextActionPanel` 已覆盖数据异常、无仓库、运行中扫描、无成功扫描、code_chunks 未就绪、有风险和 QA 就绪 |
| Browser smoke | PASS；`make dashboard-next-action-ui-smoke` 输出 `DASHBOARD_NEXT_ACTION_SMOKE_OK`，7 cases，1440px/320px，`mockedApiOnly=true`，`unhandledApiRequests=0` |
| Static gate | PASS；`node scripts/validate-frontend-ui.mjs` 已锁住 package script、Makefile target、独立端口、testMatch、mock-only、按钮 URL、无横向溢出和 marker 合同 |
| Goodall-agent 审查 | PASS；`Harvey the 2nd / 019f1582-73ba-7252-b4da-d3250998f7d3` 初次要求补按钮真实 URL、7 分支和 fail-closed API mock，修复后最终允许采纳 |
| 当前边界 | 这是 mock-only UI 状态矩阵，不证明真实后端字段在所有生产数据组合下都完整，也不是完整 release/nightly evidence |

## 2026-06-30 最新状态：Dashboard next action release evidence step

| Item | Status |
| --- | --- |
| 标准 step | PASS；新增 `dashboard-next-action-ui-smoke`，日志固定为 `dashboard-next-action-ui-smoke.log` |
| Include / profile | PASS；`SOURCELENS_RELEASE_EVIDENCE_INCLUDE_DASHBOARD_NEXT_ACTION_UI_SMOKE=true|false|auto` 可控，`release` / `nightly` 固定启用，`ci` 固定关闭 |
| Verifier | PASS；`verify-release-evidence` 校验唯一 `DASHBOARD_NEXT_ACTION_SMOKE_OK`、7 cases、7 nextActions、每个分支双 viewport、`mockedApiOnly=true`、`unhandledApiRequests=0`、local-only host |
| Focused package | PASS；`release-evidence/dashboard-next-action-ui-gate-20260630-072931` 已生成并通过 verifier |
| Goodall-agent 审查 | PASS；`Harvey the 2nd / 019f1582-73ba-7252-b4da-d3250998f7d3` 复跑 focused verifier 和 `bash -n`，允许采纳 |
| 当前边界 | Focused package 不是完整 release/nightly；只证明 Dashboard mock UI 状态矩阵进入可归档发布证据链 |

## 2026-06-30 最新状态：Maven compiler stability and refreshed full release evidence

| Item | Status |
| --- | --- |
| Goodall-agent retry | PASS；`Rawls / 019f171e-943b-7ee0-a151-5dd88b23d913` 诊断 failed evidence 的 `NoClassDefFoundError` 为 Maven compiler 增量编译产物不稳定，不是源码缺类或 Lombok 缺失 |
| Build hardening | PASS；`backend-spring/pom.xml` 已在 `maven-compiler-plugin` 固化 `<useIncrementalCompilation>false</useIncrementalCompilation>` |
| Backend gate | PASS；`cd backend-spring && mvn clean test` 通过，435 tests，0 failures，0 errors |
| Full verify gate | PASS；`make verify` 通过，覆盖后端、前端、Rust、LLM safety、security regression 和 dependency regression |
| Full release evidence | PASS；`release-evidence/release-post-maven-compiler-hardening-20260630-141727`，`required_failures=0`、`optional_warnings=0`、`skipped=3` |
| Verifier | PASS；`./scripts/verify-release-evidence.sh release-evidence/release-post-maven-compiler-hardening-20260630-141727` 通过 |
| 当前边界 | `github-app-drill`、`github-webhook-drill`、`llm-provider-run` 仍为 SKIP；当前 full evidence 不证明这些外部高级集成已完成 |

## 2026-06-30 最新状态：Rust Analyzer large stdout contract

| Item | Status |
| --- | --- |
| Goodall-agent retry | PASS；`Rawls / 019f171e-943b-7ee0-a151-5dd88b23d913` 确认 parse failure 根因是后端旧 4MB stdout 截断标记污染 JSON |
| Mill / Arch-Atlas review | PASS；`019f173f-f70a-73f3-baa1-437a44e8a720` 确认完整 Rust stdout 合法，public smoke 曾被 Java fallback 掩盖质量降级 |
| Backend contract | PASS；`AnalyzerRunner` 改为 `StreamCapture`，stdout 默认 64MB 可配置，超限明确失败，stderr 只做摘要 |
| Regression tests | PASS；`AnalyzerRunnerTest` 覆盖 >4MB 合法 stdout 和 stdout 超限明确错误 |
| Static security gate | PASS；`security-regression-check.sh` 已更新 `StreamCapture` 与大 stdout 合同断言 |
| Full verify | PASS；`make verify` 通过 |
| Live public repo smoke | PASS；Pawnshop smoke 通过，`scanTaskId=133`，`RAW_SCAN_RESULT symbols=11919`，`chunks=17001`，artifact quality OK |
| 当前边界 | 未刷新 full release evidence；`release-post-maven-compiler-hardening-20260630-141727` 是 raw scan contract gate 之前的历史 full evidence |

## 2026-06-30 最新状态：Public repo raw scan contract gate

| Item | Status |
| --- | --- |
| Contract gate | PASS；`public-repo-analysis-smoke.sh` 下载并校验 `RAW_SCAN_RESULT`，并输出 `PUBLIC_REPO_SMOKE_OK.rawScanContract` |
| Verifier gate | PASS；`verify-release-evidence.sh` 强制 `schemaVersion=2`、`language`、`symbols`、`graphNodes`、`totalFiles`、`apiRoutes`、`entities` |
| Security regression | PASS；新增 `missing-raw-scan-contract` 负向探针和静态断言 |
| Live public repo smoke | PASS；Pawnshop smoke `scanTaskId=134`，`rawScanContract={schemaVersion:2, language:TypeScript, symbols:11919, graphNodes:11919, totalFiles:3255, apiRoutes:407, entities:62}`，`chunks=17001`，artifact quality OK |
| Old full evidence verifier | PASS as expected failure；`release-post-maven-compiler-hardening-20260630-141727` 在新 verifier 下因缺少 `rawScanContract` 被拒绝 |
| Goodall-agent retry | PASS；`Rawls / 019f171e-943b-7ee0-a151-5dd88b23d913` 只读复核通过，确认 smoke/verifier/security regression 合同链真实存在，旧 full evidence 在新 verifier 下失败属于预期 |
| 当前边界 | Contract gate 已完成；后续曾刷新为 `release-evidence/release-post-attempt-split-verifier-20260630-232950`，当前已被 `release-evidence/release-post-governance-stage-rail-20260701-000851` supersede |

## 2026-06-30 最新状态：Release evidence observability

| Item | Status |
| --- | --- |
| Ops-Harbor audit | PARTIAL accepted；`Sartre / 019f178a-a34c-7530-9a12-cca43a28d177` 确认卡顿来自 `make verify` 后重复嵌套 preflight static gates 和无外层进度 |
| Preflight de-dup | PASS；`production-preflight.sh` 默认仍跑 static gates，release evidence 在 `INCLUDE_VERIFY=true` 时用 `SOURCELENS_PREFLIGHT_INCLUDE_STATIC_GATES=false` 跳过重复门禁 |
| Progress output | PASS；`release-evidence.sh run_step()` 输出步骤开始/结束，长步骤可直接看到当前 slug 和 log 文件 |
| Half-finished evidence hygiene | PASS；4 个 `release-post-raw-scan-contract-*` / `debug-raw-contract-*` 目录已写 `INVALID_RELEASE_EVIDENCE.txt` |
| Validation | PASS；`bash -n`、preflight skip smoke、非法布尔 fail-closed、`security-regression-check.sh` 均通过 |
| 当前边界 | 还没有刷新新的 full release evidence；下一步是启动后端并运行新的 `release` profile 包 |

## 2026-06-30 历史状态：Full release evidence after raw scan contract

| Item | Status |
| --- | --- |
| Runtime jar stability | PASS；`backend-jar` 改为从 `.sourcelens-runtime/backend` 稳定副本启动，避免 Maven clean 删除 `target` jar 后 JJWT ServiceLoader 登录 500 |
| Full release evidence | PASS；`release-evidence/release-post-raw-scan-contract-runtimejar-20260630-163522` |
| Verifier | PASS；`./scripts/verify-release-evidence.sh release-evidence/release-post-raw-scan-contract-runtimejar-20260630-163522` checksum verification passed |
| Public repo contract | PASS；`PUBLIC_REPO_SMOKE_OK.rawScanContract.schemaVersion=2`，`scanTaskId=135`，`chunks=17001`，artifact quality OK |
| Core release steps | PASS；make-verify、preflight、smoke、public repo、AutoRepair、AgentChat tool audit、audit workbench、phase12 baseline、sandbox drill 均 OK |
| Goodall-agent final review | PASS；`Rawls / 019f171e-943b-7ee0-a151-5dd88b23d913` 只读复核通过，确认该包可作为当前 raw scan contract + runtime jar hardening 后的新权威 full release evidence |
| 当前边界 | 5 个 SKIP 仍未完成：backup restore evidence、rollback plan、GitHub App drill、GitHub webhook drill、LLM provider run |

## 2026-06-30 最新状态：Backend jar runtime QA follow-up

| Item | Status |
| --- | --- |
| QA-Gate / Faraday | PARTIAL accepted；确认 runtime copy 主链路正确，但要求补强直接 copy 语义断言、Makefile help 和端口冲突文案 |
| Security regression follow-up | DONE；已直接锁 `mktemp` 唯一 runtime jar、`cp`、`chmod 600`、稳定副本启动、ignore、Makefile help 和端口提示 |
| Dev ergonomics | DONE；`backend-jar` help 明确适合 release evidence，端口冲突提示提醒不得复用 target/classes 或 target jar 运行态 |

## 2026-06-30 最新状态：AutoRepair ExecutionAttempt timeline UI

| Item | Status |
| --- | --- |
| Product governance | PASS；`Goodall-agent/Halley` 判定 `IMPLEMENT_NOW`，要求前端展示两段 attempt 并停止依赖 aggregate task `SUCCESS` |
| Frontend product UI | PASS；AutoRepair 详情页展示 `Patch generation attempt` 与 `PR submission attempt`，步骤标题带 `第 N 次` |
| PATCH_READY evidence | PASS；前端 review gate 改用历史 `generate_patch SUCCESS / Patch evidence retained`，PR attempt failure 不阻断旧 patch evidence |
| Browser smoke | PASS；`cd web-console && npm run smoke:patch-ready` 输出 `attemptSplit.prExecutionAttemptSplit=true`、`prFailureDoesNotBlockPatchEvidence=true`、`submitPrCount=0`、`unhandledApiRequests=0` |
| Static/build gates | PASS；`node scripts/validate-frontend-ui.mjs` 与 `cd web-console && npm run build` 通过 |
| 当前边界 | 该状态是 mock-only UI/product gate；未刷新完整 release evidence，也不证明真实 GitHub App PR E2E |

## 2026-06-30 最新状态：AutoRepair attemptSplit release verifier gate

| Item | Status |
| --- | --- |
| Product governance | PASS；`Product-Luna/Godel` 判定 `IMPLEMENT_NOW / KEEP_STRONG_GATE`，attemptSplit 属于 AutoRepair 核心信任语义 |
| Verifier contract | PASS；`verify-release-evidence.sh` 对 `PATCH_READY_UI_SMOKE_OK.reviewGate` 与 `PATCH_READY_UI_SMOKE_OK.attemptSplit` 做强校验 |
| Forgery probes | PASS；`./scripts/security-regression-check.sh` 已通过，覆盖 missing/split false/bad ids/bad nos/missing patch step/PR step drift/patch evidence false/PR failure blocks patch evidence 负例 |
| 当前边界 | verifier 合同已扩展；后续曾刷新为 `release-evidence/release-post-attempt-split-verifier-20260630-232950`，当前已被 `release-evidence/release-post-governance-stage-rail-20260701-000851` supersede |

## 2026-06-30 最新状态：AutoRepair attemptSplit focused release evidence

| Item | Status |
| --- | --- |
| Focused package | PASS；`release-evidence/patch-ready-attempt-split-verifier-20260630-232056` 已生成 |
| Patch-ready step | PASS；`patch-ready-ui-smoke=OK`，marker 包含 `reviewGate + attemptSplit` 完整合同 |
| Verifier | PASS；`./scripts/verify-release-evidence.sh release-evidence/patch-ready-attempt-split-verifier-20260630-232056` 通过 |
| 当前边界 | focused package 不是完整 release/nightly authority；不证明真实 GitHub App PR E2E |

## 2026-07-03 最新状态：Project QA code_chunks evidence card readability

| Item | Status |
| --- | --- |
| Product review | PASS；`Product-Luna / Tesla / 019f2417-de39-7770-a634-e84ede968b21` 要求只做 Project QA/code_chunks 证据卡片可读性，不扩大到后端或 AutoRepair gate |
| Frontend review | PASS；`FE-Pixel / Euclid / 019f2417-ff61-7481-8c03-847b51bcd4be` 确认证据字段已存在但层级拥挤，要求路径、reason、actions 分区 |
| QA review | PASS；`QA-Orion / Parfit / 019f2418-1f11-7631-bdc5-59624f422510` 要求扩展 `project-qa-recoverable-smoke` 和结构化 marker |
| Worker implementation | PARTIAL；`FE-Pixel Worker / Locke / 019f241b-4661-76a3-b766-0744ca4f7c7f` 产出中间态，主 agent 接管补齐 CSS、smoke、validator |
| UI implementation | PASS；Project QA 搜索结果、回答引用、retrieved chunk evidence card 已改为可换行、可审计、操作分区的证据卡片 |
| Browser smoke | PASS；recoverable、low-confidence、report evidence QA citation 三条 mock browser smoke 均通过 |
| Static/build gates | PASS；`node scripts/validate-frontend-ui.mjs`、`npm --prefix web-console run build`、scoped `git diff --check` 通过 |
| 当前边界 | 不刷新 full release authority；当前 full authority 仍为 `release-evidence/release-current-schema-20260702-230650` |

## 2026-07-03 最新状态：Project QA answer source receipt

| Item | Status |
| --- | --- |
| Product review | PASS；`Product-Luna / Dirac / 019f2466-631a-7db1-986b-f48fb10afb8e` 建议推进报告证据到 Project QA/AutoRepair handoff 的可审计闭环 |
| FE/QA review | PASS；`FE-Pixel + QA-Orion / Bacon / 019f2466-9d17-7a82-84e1-b3c947c63dd6` 要求 QA 回答层新增报告证据凭证，并纳入 browser smoke marker |
| Backend/AI review | DEFERRED；`AI-Vector + BE-Forge / Kierkegaard / 019f2466-7b7f-71c0-8db1-a3e63e85ddc2` 的 source URL normalization 作为后续 P6 backend 候选，不阻塞本轮 |
| UI implementation | PASS；Project QA assistant answer 已展示 `QA 回答报告证据凭证`，包含报告标题、来源、分类、scan、file line 和 match type |
| Browser smoke | PASS；`PROJECT_QA_AUTOREPAIR_CANDIDATE_SMOKE_OK.qaAnswerSourceReceipt.visible=true`、`scanTaskIdBound=true`、`lineAnchorVisible=true` |
| Static/build gates | PASS；`node scripts/validate-frontend-ui.mjs`、`npm --prefix web-console run build`、`CI=true make project-qa-autorepair-candidate-ui-smoke`、scoped `git diff --check` 通过 |
| 当前边界 | 不改 API/DB/backend gate/release verifier/GitHub App；当前 full authority 仍为 `release-evidence/release-current-schema-20260702-230650` |

## 2026-07-03 最新状态：Public repo QA evidence handoff live gate

| Item | Status |
| --- | --- |
| Product review | PASS；`Product-Luna / Meitner / 019f2474-76a5-7840-a8fc-28d9ed8f5ff8` 建议实施瘦身版 live gate，放入 `qaFromEvidence.evidenceHandoff` 并保持 optional-but-strict |
| QA review | PASS；`QA-Orion / Harvey / 019f2474-8b23-7543-87c7-db57b3635068` 要求从真实 QA `生成修复候选` 按钮解析 handoff URL，而不是手工 fallback |
| BE/FE boundary | PASS；`BE-Forge + FE-Pixel / Ptolemy / 019f2474-a344-74d2-9780-6bdc82f0b242` 确认可复用现有 `qaFromEvidence` 字段，不改后端/API/GitHub |
| Smoke contract | PASS；`public-repo-ui-smoke.spec.ts` 新增 `QaEvidenceHandoffProof`，AutoRepair candidate 页面从 QA verified citation URL 打开 |
| Release verifier | PASS；`assertQaEvidenceHandoff` 对新 marker present 强校验，旧/current full authority 缺字段兼容 |
| Security regression | PASS；新增 handoff forged cases，`./scripts/security-regression-check.sh` 通过，仅有本地 locale warning |
| Static/build gates | PASS；`node scripts/validate-frontend-ui.mjs`、`tsc --noEmit`、`npm --prefix web-console run build`、`verify-release-evidence current`、Playwright `--list`、scoped `git diff --check` 通过 |
| 当前边界 | 不刷新 full release authority；未运行完整 live public repo UI smoke，只完成合同与入口可运行验证 |

## 2026-07-03 最新状态：Security regression observability and timeout hardening

| Item | Status |
| --- | --- |
| Ops review | ACCEPTED；`Ops-Harbor / Hooke / 019f24c4-da0b-7bf0-9eb8-1dbc38ab9217` 判定 slow + silent 为主因，但要求补统一 timeout、LLM provider fetch timeout、Playwright availability timeout |
| QA review | ACCEPTED；`QA-Gate / Confucius / 019f24c4-f742-7bd2-b512-8fd19227c0ee` 打回原完整 PASS 声明，要求最终 PASS marker 和 fail-closed timeout |
| Implementation | PASS；`security-regression-check.sh` 默认输出阶段进度，release/verifier/node probe 均有 `START/OK/FAIL/TIMEOUT + elapsed` |
| Timeout hardening | PASS；`run_with_timeout` 保留调用方 `errexit` 状态；低 timeout 验证非 0 退出并输出 `TIMEOUT release-evidence after 1s` |
| LLM provider boundary | PASS；`run-llm-provider-eval.mjs` 使用 `AbortController`，新增 `SOURCELENS_LLM_PROVIDER_EVAL_TIMEOUT_MS=15000ms` 默认 |
| Release evidence boundary | PASS；Playwright availability probe 优先本地 bin，fallback `npm exec -- playwright --version` 有 timeout |
| Validation | PASS；`bash -n`、`node --check`、scoped `git diff --check`、LLM provider mock smoke、CI profile release evidence verifier 全部通过 |
| Full security regression | PASS；`SOURCELENS_SECURITY_REGRESSION_ASSERT_PROGRESS_INTERVAL=500 ./scripts/security-regression-check.sh` 最终输出 `Security regression checks passed.`，耗时约 `691s`，仅有本地 `tar` locale warning |
| Current authority | unchanged；当前 full release authority 仍为 `release-evidence/release-current-schema-20260702-230650` |
| 下一步 | P11 拆分 heavy forged marker 矩阵，尤其 public repo UI、report evidence drawer、scan governance timeline；P6 继续 code understanding / cross-file retrieval / report citation quality |

## 2026-07-03 最新状态：P9 AutoRepairs three-viewport detail readability

| Item | Status |
| --- | --- |
| Product review | PASS；`Product-Luna / Lovelace the 2nd / 019f25f9-ad22-71e3-a7bd-61072fb5230d` 接受 focused AutoRepairs 详情可读性 + stale detail 防回归，不扩大到后端/DB/GitHub App E2E |
| Frontend review | PASS；`FE-Pixel / Huygens the 2nd / 019f25f9-da85-7b82-b44f-51f069e2d490` 要求取消 review/candidate gate 关键值 ellipsis、明确 table overflow owner、补视觉裁切断言 |
| QA review | PASS；`QA-Orion / Tesla the 2nd / 019f25fa-085e-7612-bdd5-bdd265cbe2cf` 要求 `390x844`、readability marker、release verifier 和 forged cases |
| Implementation | PASS；AutoRepairs execution detail 增加 request sequence guard 和 source-bound `selectedExecutionDetail`，review gate 展示真实 `generate_patch` logSummary |
| CSS containment | PASS；AutoRepair table/detail/PR Popconfirm 增加 containment，review/candidate/PR gate 长文本允许 wrap |
| Browser smoke | PASS；`CI=true make patch-ready-ui-smoke` 输出三视口 `PATCH_READY_UI_SMOKE_OK`，包含 `layoutDensity`、`mobileReadability`、`tableScroller`、`executionDetailGuard`、`runtimeIssues=0`、`noHorizontalOverflow=true` |
| Release verifier | PASS；`PATCH_READY_UI_SMOKE_OK` 现在要求 `1440x900`、`390x844`、`320x740` 和 readability/stale-detail proof |
| Security regression | PASS；`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-autorepair-ui-marker` 通过 |
| Static/build gates | PASS；`make frontend-ui-check`、`npm --prefix web-console run build`、`bash -n`、scoped `git diff --check` 通过 |
| Agent lifecycle | CLOSED；Lovelace/Huygens/Tesla 三个子 agent 会话已关闭，结论已写入 `AGENT_ACTIVITY_LOG.md` |
| Authority boundary | UPDATED CONTRACT；本轮升级 PATCH_READY UI marker verifier 合同，但未刷新 full release authority；下一次发布前必须重跑完整 release evidence |
| 下一步 | P9 继续 AutoRepair candidate form、ProjectDetail 深层证据卡片、报告/QA 页面视觉密度；P6 继续 code understanding 与 citation quality |

## 2026-07-03 最新状态：P9 AutoRepair candidate form / QA handoff readability

| Item | Status |
| --- | --- |
| Product review | PASS；`Product-Luna / Nash the 2nd / 019f260b-4018-74e0-83f7-33006216f273` 建议 focused smoke gate，不升级 release verifier，不改后端/DB/API |
| Frontend review | PASS；`FE-Pixel / Heisenberg the 2nd / 019f260b-59e2-7de2-bdf8-e54ec162fe8a` 要求 create modal scoped class、390px 覆盖、长文本裁切断言 |
| QA review | PASS；`QA-Orion / Leibniz the 2nd / 019f260b-6f71-7491-92ea-dfafff981a33` 要求两个 candidate smoke 都补 `390x844`、`layoutDensity`、`mobileReadability`、`qaHandoff` |
| Implementation | PASS；AutoRepair 创建弹窗新增 scoped class 和 `AutoRepairDraftReceipt`，提交前展示白名单来源字段 |
| CSS containment | PASS；Modal、Alert、Form、Select、Input、TextArea、draft receipt 和 footer buttons 已加移动端 containment/wrap |
| Project QA candidate smoke | PASS；`PROJECT_QA_AUTOREPAIR_CANDIDATE_SMOKE_OK` 覆盖 `1440x900/390x844/320x740`，`createRequestCount=3`，`qaRequestCount=12` |
| Report candidate smoke | PASS；`REPORT_AUTOREPAIR_CANDIDATE_UI_SMOKE_OK` 覆盖 `1440x900/390x844/320x740`，`createRequestCount=3` |
| Static/build gates | PASS；`make frontend-ui-check`、`npm --prefix web-console run build` 通过 |
| Authority boundary | unchanged；本轮不刷新 full release authority，不升级 release verifier/security forged marker |
| 下一步 | P9 继续 ProjectDetail 深层证据卡片、报告/QA 页面视觉密度；P6 继续 code understanding / cross-file retrieval / report citation quality |

## 2026-07-03 最新状态：P9 Report evidence drawer three-viewport readability

| Item | Status |
| --- | --- |
| Product review | PASS；`Product-Luna / Hypatia the 2nd / 019f2617-bfab-7360-a084-87f454173a28` 建议 focused report drawer gate，不升级 release/security |
| Frontend review | PASS；`FE-Pixel / Noether the 2nd / 019f2617-db31-7291-8a45-1dad38c50c28` 要求补 `390x844`、局部裁切断言、长坏数据并移除 code_chunks 卡片 ellipsis |
| QA review | PASS；`QA-Orion / Dewey the 2nd / 019f2618-000a-7a61-b26d-438db81f665d` 要求 `layoutDensity/mobileReadability/noHorizontalOverflow` marker，记录 `project-qa-low-confidence` 后续待办 |
| Implementation | PASS；`report-evidence-drawer-smoke` 增加三视口、长路径/长摘要和 drawer/code_chunks/readiness/handoff/action rail readability assertions |
| CSS containment | PASS；report drawer code_chunks 卡片头部与 citation readiness title 已改为 wrap，不再 ellipsis/nowrap |
| Browser smoke | PASS；`CI=true make report-evidence-drawer-ui-smoke` 和 `CI=true make report-evidence-qa-citation-ui-smoke` 均通过 |
| Static/build gates | PASS；`make frontend-ui-check`、`npm --prefix web-console run build` 通过 |
| Authority boundary | unchanged；本轮不刷新 full release authority，不升级 release verifier/security forged marker |
| 下一步 | `project-qa-low-confidence` 三视口化与 marker 统一；继续 ProjectDetail 深层证据面板 readability |

## 2026-07-03 最新状态：P9 Project QA low-confidence three-viewport readability

| Item | Status |
| --- | --- |
| Product review | PASS；`Product-Luna / Pasteur the 2nd / 019f2621-5b21-7db0-ad33-2af58b2c1246` 建议 focused Project QA low-confidence gate，不扩到后端/DB/LLM/release verifier |
| Frontend implementation | PASS；`FE-Pixel / Ohm the 2nd / 019f2621-811b-7090-bd96-e64bef4b5984` 完成三视口、readability helper 和 marker 初版；Lead 补独立 `PARTIAL` 与 per-viewport/status proof |
| QA review | PASS；`QA-Orion / Bohr the 2nd / 019f2621-9dd5-7fe0-85f5-d7f2f558c86d` 要求 `390x844`、独立 `PARTIAL/UNVERIFIED/NO_EVIDENCE`、局部裁切断言、marker 可审计 |
| Implementation | PASS；`project-qa-low-confidence-smoke` 覆盖 `1440x900/390x844/320x740`，每视口 5 次 QA 请求，总 `qaRequestCount=15` |
| Browser smoke | PASS；`PROJECT_QA_LOW_CONFIDENCE_SMOKE_OK.markerVersion=2`，`statusProofs={partial:3,unverified:3,noEvidence:3,verifiedRetry:3}`，`runtimeIssues=0` |
| Static/build gates | PASS；`node scripts/validate-frontend-ui.mjs`、`make frontend-ui-check`、`npm --prefix web-console run build`、scoped `git diff --check` 通过 |
| Authority boundary | unchanged；本轮不刷新 full release authority，不升级 release verifier/security forged marker |
| 下一步 | 继续 ProjectDetail 深层证据卡片 readability，或推进 P6 code understanding / cross-file retrieval / report citation quality |

## 2026-07-03 最新状态：P9 ProjectDetail deep evidence card readability

| Item | Status |
| --- | --- |
| Product review | PASS；`Product-Luna / Einstein the 2nd / 019f262b-a44c-73c0-b9c9-4554c0e58847` 要求证明来源定位闭环，不声明 LLM 事实正确 |
| Frontend review | PASS；`FE-Pixel / Hooke the 2nd / 019f262b-c00b-74e3-932d-fe5546f0550d` 指出 source receipt tags/head 在 390/320 下有挤压风险 |
| QA review | PASS；`QA-Orion / Euclid the 2nd / 019f262b-db38-7ea2-a231-1be732549d33` 建议以 `report-evidence-qa-citation` 为 focused 承载点，新增 `deepEvidenceCardReadability` marker |
| Implementation | PASS；`report-evidence-drawer-smoke` 新增 ProjectDetail deep evidence readability helper，覆盖 READY 和 FILE_ANCHOR REVIEW |
| CSS containment | PASS；移动端 source receipt/source location/source match/evidence combination head 改为纵向，tag 支持换行，修复 320px 标题被挤压隐藏 |
| Browser smoke | PASS；`REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK.qaFromEvidence.deepEvidenceCardReadability.status=OK`，`mobile390Covered=true`，`narrow320Covered=true`，`providerQualityClaim=false`，`llmFactClaim=false` |
| Static/build gates | PASS；`node scripts/validate-frontend-ui.mjs`、`make frontend-ui-check`、`CI=true make report-evidence-drawer-ui-smoke`、`CI=true make project-qa-recoverable-ui-smoke`、`npm --prefix web-console run build`、scoped `git diff --check` 通过 |
| Authority boundary | unchanged；本轮不刷新 full release authority，不升级 release verifier/security forged marker |
| 下一步 | P6 code understanding / cross-file retrieval / report citation quality，或继续 P9 其他深层页面信息密度 |

## 2026-07-03 最新状态：P6 Claim citation noise focused evidence absorption

| Item | Status |
| --- | --- |
| Stage objective | FOCUSED PASS；`report-evidence-drawer-smoke` fake citation noise 边界已吸收到 release verifier/security forged marker |
| Product evidence review | ACCEPTED；`Aristotle the 2nd` 口径落地：代码块、时间戳日志、异常堆栈、inline code 中的 `[C1]` 都是噪声，不得放行 QA trust 或 AutoRepair gate |
| QA/Ops review | ACCEPTED；`Peirce the 2nd` 口径落地：marker present 后 release verifier/security regression fail closed，旧 optional marker 缺失兼容 |
| PM docs | DONE；`PM-Nightingale` 已记录目标、分工、验收口径和验证结果 |
| Negative acceptance | PASS；fake citation 场景保持 `REVIEW` / `RETRY_FAILED` / `NONE`，`maxRepairCandidateCount=0` |
| Data minimization | PASS；marker 仅记录枚举、计数和布尔 proof，`rawAnswerStored=false`，`rawPromptStored=false`，并拒绝 raw forged field |
| Smoke validation | PASS；`CI=true make report-evidence-drawer-ui-smoke`、`CI=true make report-evidence-qa-citation-ui-smoke` |
| Release/security validation | PASS；`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false make security-regression-release-verifier-report-evidence-marker` |
| Authority boundary | unchanged；未刷新 full release authority，不能声明最终发布证据 PASS |

## 2026-07-03 最新状态：P6 Public repo Code QA claim citation noise focused evidence

| Item | Status |
| --- | --- |
| Product / Architecture review | PASS；`Sartre the 2nd / 019f2661-7d0c-7c30-9fb5-31759b46b289` 建议 focused API proof，不扩大为 full authority 或 provider quality claim |
| QA / Ops review | PASS；`Bernoulli the 2nd / 019f2661-a8ed-7230-bc12-8ba67f77d121` 要求 marker present 后 strict 校验，并补 forged marker matrix |
| Implementation | PASS；`public-repo-analysis-smoke.sh` 新增 `claimCitationNoiseBoundary` probe，`MockLlmProviderAdapter` 新增 deterministic fake citation answer |
| Release verifier | PASS；`PUBLIC_REPO_SMOKE_OK.codeQa.claimCitationNoiseBoundary` optional-but-strict，字段出现后强校验 scanTaskId、noise kinds、RETRY_FAILED/NONE/REVIEW 和数据最小化 |
| Security regression | PASS；forged cases 覆盖 READY/VERIFIED/repair candidate/raw answer/scan mismatch/unknown noise 等伪造 |
| Backend tests | PASS；`mvn -q -f backend-spring/pom.xml -Dtest=LlmClientAdapterTest,CodeQaControllerTest test` |
| Static gates | PASS；`bash -n`、`security-regression-static`、`validate-frontend-ui` 通过 |
| Live public repo smoke | PASS；repo `LJunP/Pawnshop-Management-System.git`，commit `3eaf38582997afa5acff8990f48ce9c5f200e3ea`，`scanTaskId=245`，`claimCitationNoiseBoundary.status=OK` |
| Negative acceptance | PASS；`groundingStatuses=[UNVERIFIED]`、`citationEnforcementStatuses=[RETRY_FAILED]`、`coverageStatus=NONE`、`claimCitationStatus=REVIEW`、`roleDistributionStatus=REVIEW_UNCITED`、`maxRepairCandidateCount=0` |
| Authority boundary | unchanged；本轮是真实 public repo API focused evidence，不是 UI proof，不刷新 full release authority，不证明真实 LLM provider 质量 |
| 下一步 | P6 可吸收到真实 public repo UI smoke；或继续 source-location / code_chunks / report citation quality |

## 2026-07-03 最新状态：P6 Public repo UI claim citation noise boundary

| Item | Status |
| --- | --- |
| Product / Architecture review | PASS；`Halley the 2nd / 019f2670-dc2a-7411-93e2-633bd47198e0` 要求把 claim noise 吸收到 `PUBLIC_REPO_UI_SMOKE_OK.qaFromEvidence.claimCitationNoiseBoundary`，作为负向 UI gate |
| Frontend / QA review | PASS；`Copernicus the 2nd / 019f2670-f286-7b40-9c4c-5b7d104c2986` 要求验证真实 UI blocking：不可直接采信、`BLOCKED`、已阻断、无修复候选 |
| Implementation | PASS；public repo UI smoke 新增 per-viewport fake citation noise QA probe、MOCK LLM setup/cleanup、marker 聚合 |
| Release verifier | PASS；`PUBLIC_REPO_UI_SMOKE_OK.qaFromEvidence.claimCitationNoiseBoundary` 强校验 scan 绑定、四类噪声、`NONE/REVIEW/REVIEW_UNCITED/RETRY_FAILED`、0 repair/cited 和无 raw content |
| Security regression | PASS；forged cases 覆盖 missing、READY/VERIFIED、answer cited、repair visible、blocked hidden、ready summary、unknown noise、raw answer/prompt、scan mismatch、setup/cleanup warn |
| Static/build gates | PASS；`bash -n`、`node scripts/validate-frontend-ui.mjs`、scoped `git diff --check`、`npm --prefix web-console run build` |
| Focused security gate | PASS；`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-public-repo-ui-marker` |
| Playwright config gate | PASS；`public-repo-ui-smoke.spec.ts` 被 Playwright `--list` 正确加载为 1 个测试 |
| Authority boundary | unchanged；未执行 retained sample live UI smoke，未刷新 full release authority，不证明真实外部 LLM provider 质量 |
| 下一步 | 生成 retained public repo sample 后运行完整 `make public-repo-ui-smoke`，再决定是否刷新 release evidence；或继续 P6 source-location / code_chunks / report citation quality |

## 2026-07-03 最新状态：P6 Public repo UI live retained sample

| Item | Status |
| --- | --- |
| Product / QA live boundary review | PASS；`Kant the 2nd / 019f2684-37b7-7eb3-986b-570410455fbe` 要求不能用 build/static/`--list` 替代 live UI evidence，必须跑 retained sample + real backend |
| DevOps / QA runbook review | PASS；`Plato the 2nd / 019f2684-636e-74d2-ae6c-5a2ed21beeaf` 确认最小运行序列、env、端口和常见失败点 |
| Local backend | PASS；当前源码后端在 `http://localhost:8080` 健康，Flyway schema `030`，MySQL/Redis Docker 健康 |
| Live smoke command | PASS；`SOURCELENS_PUBLIC_REPO_SMOKE_UI=true` + `SOURCELENS_PUBLIC_REPO_SMOKE_CLEANUP=false` 运行完整 `make public-repo-smoke` |
| Retained sample | PASS；repo `LJunP/Pawnshop-Management-System.git`，commit `3eaf38582997afa5acff8990f48ce9c5f200e3ea`，`projectId=329`，`repositoryId=290`，`scanTaskId=246` |
| Public repo UI marker | PASS；`PUBLIC_REPO_UI_SMOKE_OK.realBackend=true`，`mockedApi=false`，三视口和关键页面全覆盖 |
| Claim noise UI gate | PASS；`coverageStatus=NONE`，`claimCitationStatus=REVIEW`，`roleDistributionStatus=REVIEW_UNCITED`，`citationEnforcementStatuses=[RETRY_FAILED]`，`repairCandidateActionVisible=false`，`repairEvidenceGateBlockedVisible=true` |
| Artifact/API marker | PASS；`PUBLIC_REPO_SMOKE_OK` 输出，artifact quality 7 项通过，`code_chunks=17001`，`symbols=15727`，`relations=440` |
| Authority boundary | unchanged；live smoke 已通过，但 full release authority 仍未刷新，因为没有生成新的 release-evidence package |
| 下一步 | 可运行正式 release evidence 将该 live UI smoke 纳入证据包；或继续 P6 source-location / report citation quality |

## 2026-07-03 最新状态：P6 Public repo UI claim citation noise focused release evidence

| Item | Status |
| --- | --- |
| Product-QA review | PASS；`Aquinas the 2nd / 019f2690-b788-70a3-9aac-d53203732b36` 确认该 evidence 有产品验收价值，但不能声明 full release authority |
| DevOps-QA review | PASS；`Gibbs the 2nd / 019f2690-d2c2-7582-924b-5e42b0d15e42` 确认使用 local focused package + stable `backend-jar` runtime |
| Stable runtime | PASS；`SERVER_PORT=19081 make backend-jar` 启动 `.sourcelens-runtime/backend/source-lens-backend.*`，health `UP` |
| Focused package | PASS；`release-evidence/public-repo-ui-claim-noise-20260703-140228` 已生成 |
| Package summary | PASS；`required_failures=0`，`optional_warnings=0`，`skipped=21` |
| Manifest | PASS；`release_evidence_profile=local`，`include_public_repo_smoke=true`，`public_repo_smoke_ui=true`，`worktree_inventory_strict=true` |
| Retained package sample | PASS；repo `LJunP/Pawnshop-Management-System.git`，`projectId=330`，`repositoryId=291`，`scanTaskId=247` |
| Marker binding | PASS；`PUBLIC_REPO_SMOKE_OK` 与 `PUBLIC_REPO_UI_SMOKE_OK` 绑定同一 project/repository/scan |
| Claim noise release proof | PASS；`noiseKinds` 四类齐全，负向状态保持 `UNVERIFIED / RETRY_FAILED / NONE / REVIEW / REVIEW_UNCITED` |
| Repair gate | PASS；`maxRepairCandidateCount=0`，`repairCandidateActionVisible=false`，`repairEvidenceGateBlockedVisible=true` |
| Data minimization | PASS；`rawAnswerStored=false`，`rawPromptStored=false`，`providerQualityClaim=false`，`llmFactClaim=false` |
| Verifier drift | FIXED；`verify-release-evidence.sh` 允许真实 UI 保守文案 `跨文件复核路径`，security fixture 同步更新 |
| Release verifier | PASS；`./scripts/verify-release-evidence.sh release-evidence/public-repo-ui-claim-noise-20260703-140228` |
| Security regression | PASS；`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-public-repo-ui-marker` |
| Authority boundary | unchanged；这是 focused P6 evidence package，不是新的 full release authority |
| 下一步 | 继续 P6 code_chunks/source-location/report citation quality，或转入 P9 前端大厂级 UI 深层重构 |

## 2026-07-03 最新状态：P9 PR Reviews comments stale guard

| Item | Status |
| --- | --- |
| Product review | PASS；`Schrodinger the 2nd / 019f269e-bcd7-7952-92c2-10695f432bb2` 判定 completed PR 评论串线会误导合并决策和修复候选资格 |
| Frontend review | PASS；`Erdos the 2nd / 019f269e-e2cd-7b51-af31-f72a21f68ea7` 确认 `fetchComments` 需要 request guard，列表刷新需要清 stale selected detail |
| QA review | PASS；`Cicero the 2nd / 019f269f-25f3-79b1-8dde-8e383a0681eb` 要求 focused smoke 输出 stale-comment race proof |
| Implementation | PASS；`commentsRequestSeq` 阻止过期评论写回，切换 PR 清空旧评论/错误/loading，列表刷新时 stale detail 清空 |
| Browser smoke | PASS；`PR_REVIEWS_DETAIL_SELECTION_SMOKE_OK.commentStaleGuard.staleCommentLeakCount=0`，`usesSelectedReviewCommentsOnly=true`，`runtimeIssues=0` |
| Static/build gates | PASS；`npm --prefix web-console run build`、`node scripts/validate-frontend-ui.mjs`、`CI=true make pr-reviews-detail-selection-ui-smoke`、scoped `git diff --check` |
| Authority boundary | unchanged；P9 focused UI bugfix，不刷新 full release authority |
| 下一步 | 继续 P9 深层页面信息密度，或回到 P6 code understanding / cross-file retrieval / report citation quality |

## 2026-07-03 最新状态：P6 Code QA semantic candidate rerank guard

| Item | Status |
| --- | --- |
| Product review | DEFERRED；`Ptolemy / 019f26ac-6c54-7832-b01b-719b31f4689d` 建议下一轮做 source-location line-mismatch live evidence |
| Backend review | PASS；`Lagrange / 019f26ac-6cb2-7b41-8bf9-71bc6d2045d9` 识别 semantic candidates 先输入截断、后 cosine rerank 的质量 bug |
| QA review | DEFERRED；`Rawls / 019f26ac-6d40-78c0-a23c-8591139ae72e` 建议后续补 codeUnderstanding/crossFile/reportCitationQuality markers |
| Implementation | PASS；semantic candidates 先计算 cosine similarity，再截取 top candidates 并合并 keyword candidates |
| Backend test | PASS；`CodeQaRetrievalServiceTest` 覆盖尾部高相似 semantic target 不被输入顺序截断丢弃 |
| Static gates | PASS；`mvn -q -f backend-spring/pom.xml -Dtest=CodeQaRetrievalServiceTest test`、`node scripts/validate-frontend-ui.mjs`、scoped `git diff --check` |
| Authority boundary | unchanged；P6 focused backend bugfix，不刷新 full release authority |
| 下一步 | P6 source-location line-mismatch focused live evidence，或 public repo codeUnderstanding/crossFile/reportCitationQuality markers |

## 2026-07-03 最新状态：P6 Source-location line-mismatch context-only guard

| Item | Status |
| --- | --- |
| Product review | PASS；`Arendt / 019f26b3-9ab8-7ac1-827f-da174cbce539` 确认文件级锚点漂移不得放行修复候选 |
| QA review | PASS；`Feynman / 019f26b3-b2f2-7e80-8963-8ddd8d691e2c` 确认旧 smoke/static/verifier 存在好状态误标风险 |
| Backend contract review | PASS；`Mendel / 019f26b3-cf2d-7f73-a485-73edd4167f4c` 确认后端已有 `REPORT_FILE_ANCHOR + ADJACENT_CONTEXT + CONTEXT_ONLY` |
| Implementation | PASS；`fileAnchorDrift` mock 和 marker 改为 `PARTIAL / RETRY_FAILED / REVIEW / CONTEXT_ONLY / BLOCKED` |
| Release verifier | PASS；`assertFileAnchorDriftReview` 消费 marker，并计入 `qaTotalRequestCount` |
| Security regression | PASS；新增 file-anchor drift forged rejection cases |
| Browser smoke | PASS；`REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK.qaFromEvidence.fileAnchorDrift` 输出 `maxPrimaryEvidenceCount=0`、`maxRepairCandidateCount=0`、`repairEvidenceGateBlockedVisible=true` |
| Static/build gates | PASS；`node scripts/validate-frontend-ui.mjs`、`npm --prefix web-console run build`、scoped `git diff --check` |
| Authority boundary | unchanged；mocked UI + verifier focused hardening，不刷新 full release authority |
| 下一步 | 真实 public repo line-mismatch live evidence；或 P6 `codeUnderstandingFixture` / `crossFileRetrievalProof` / `reportCitationQuality` |

## 2026-07-03 最新状态：P6 Public repo UI file-anchor drift live guard

| Item | Status |
| --- | --- |
| Product review | PASS；`Luna / 019f26c7-041e-79c2-a1b9-b0f5fca2b142` 确认 focused live UI evidence 边界 |
| QA review | PASS；`Orion / 019f26c7-1c8c-7832-b2dc-0529db04df1a` 确认 marker/verifier/security 最小闭环 |
| Backend implementation | PASS；context-only citation 降为 `PARTIAL`，`repairCandidateCount` 仅统计 PRIMARY |
| Public UI smoke contract | PASS；新增 `PUBLIC_REPO_UI_SMOKE_OK.qaFromEvidence.fileAnchorDrift` |
| Release verifier | PASS；新增 `assertPublicRepoUiFileAnchorDrift` 强制消费 marker |
| Security regression | PASS；新增 forged rejection matrix，并通过 `make security-regression-release-verifier-public-repo-ui-marker` |
| Static/build/backend gates | PASS；`validate-frontend-ui`、web build、`CodeQaControllerTest`、scoped diff check 均通过 |
| Authority boundary | unchanged；focused P6 hardening，不刷新 full release authority |
| 下一步 | 运行完整 retained `make public-repo-ui-smoke` 产出新 live marker；或继续 P6 `codeUnderstandingFixture` / `crossFileRetrievalProof` / `reportCitationQuality` |

## 2026-07-03 最新状态：P6 Public repo API cross-file retrieval proof

| Item | Status |
| --- | --- |
| Initial Product-QA agent | FAILED；`Poincare / 019f26da-5c63-72f2-9cc3-47264080c71d` 断流，无成果物，未采纳 |
| Initial QA agent | FAILED；`Ohm / 019f26da-7769-7ec3-aacf-50f4bf63f5cc` 断流，无成果物，未采纳 |
| Product/Architecture review | PASS；`Pascal / 019f26dd-fd81-7082-8dc5-a1d458a50334` 接受 API 侧 proof，要求保留 broad probe 边界 |
| QA/Test review | PASS after revise；`Bohr / 019f26de-1e7c-7ba2-aa04-32768b89e6df` 要求 dedicated forged matrix，已补齐 |
| Implementation | PASS；`PUBLIC_REPO_SMOKE_OK.chunkSearch.crossFileRetrievalProof` 由真实 `/code-chunks/search` 空 query `limit=24` 生成 |
| Release verifier | PASS；强校验 project/scan 绑定、多文件、fileStats、source labels、retrievalMode/readiness、embedding count 边界 |
| Security regression | PASS；`release-verifier-public-repo-marker` 动态拒绝 cross-file proof 伪造 |
| Docs | PASS；需求、进度、交接、运行手册和 agent 日志已更新 |
| Verification | PASS；`bash -n`、`validate-frontend-ui`、focused security regression |
| Authority boundary | unchanged；focused API contract，不刷新 full release authority |
| 下一步 | 真实 retained `make public-repo-smoke` 生成新版 marker；继续 P6 `codeUnderstandingFixture` 或 `reportCitationQuality` |

## 2026-07-03 最新状态：P6 Public repo report citation quality contract

| Item | Status |
| --- | --- |
| Product/Architecture review | PASS；`Boole / 019f26e9-cb52-7b31-81f5-0fca52ff085f` 推荐 reportCitationQuality，边界是不证明 LLM 事实正确 |
| QA/Test review | PARTIAL；`Noether / 019f26e9-f2d8-7e61-9bf1-b5ee1aeb9e82` 推荐下一轮 codeUnderstandingFixture；本轮采纳其 reportQuality 未被 verifier 强消费的缺口 |
| Implementation | PASS；`PUBLIC_REPO_SMOKE_OK.reportQuality.reportCitationQuality` 从真实 `ARCHITECTURE_REPORT` 派生 |
| Release verifier | PASS；校验 sectionBindings、required checks、scan binding、raw 字段禁止和 provider/LLM claim 禁止 |
| Security regression | PASS；dynamic forged matrix 已覆盖 missing/array/status/section/raw/claim 等伪造 |
| Verification | PASS；`bash -n`、focused `release-verifier-public-repo-marker` |
| Authority boundary | unchanged；focused report contract，不刷新 full release authority |
| 下一步 | `PUBLIC_REPO_SMOKE_OK.codeUnderstandingFixture`，建议基于现有 `methodAnchorRetrieval` 晋级 |

## 2026-07-03 最新状态：P6 Public repo code understanding method-anchor fixture

| Item | Status |
| --- | --- |
| Product/Architecture review | PASS after revise；`Dirac / 019f26f8-0f00-76a3-9d99-d480006e763d` 要求限定为 `METHOD_ANCHOR_STACK_TRACE`，不得承诺通用语义理解 |
| QA/Test review | PASS after revise；`Socrates / 019f26f8-2fab-7b91-af24-74b01c3232e2` 要求 fail-closed verifier 与 dedicated forged matrix |
| Implementation | PASS；`PUBLIC_REPO_SMOKE_OK.codeUnderstandingFixture` 由真实 method anchor、`class#method`、Java stack frame 和 Code QA primary chunk 派生 |
| Release verifier | PASS；`assertCodeUnderstandingFixture()` 强校验 project/scan、安全路径、行区间、method/stack/QA 三路一致和 raw field 禁止 |
| Security regression | PASS；`release-verifier-public-repo-marker` 动态拒绝 code understanding fixture 伪造 |
| Static/UI gates | PASS；`security-regression-check.sh --suite static` 与 `node scripts/validate-frontend-ui.mjs` 通过 |
| Authority boundary | unchanged；focused P6 release-evidence hardening，不刷新 full release authority |
| 下一步 | 运行真实 retained `make public-repo-smoke` 产出新版 marker；继续 P6 检索排序质量、报告引用体验或 Agent 辅助理解体验 |

## 2026-07-03 最新状态：P6 codeUnderstandingFixture retained live evidence

| Item | Status |
| --- | --- |
| Product/Architecture review | PASS；`Dirac-2 / Turing / 019f270b-8fd4-7312-b2bd-5f9ae01af53f` 接受 retained sample 口径，要求保留 `METHOD_ANCHOR_STACK_TRACE` 边界 |
| QA/Test review | PASS；`Socrates-2 / Nietzsche / 019f270b-b52c-73f2-b4dd-4e3b4bc703e6` 要求 focused evidence 包通过 verifier |
| Runtime | PASS；稳定 jar 后端运行于 `http://localhost:8080`，旧 Docker `8081` 证据已拒绝 |
| Contract correction | PASS；空 query broad `crossFileRetrievalProof.readiness=GAP` 可接受，但仅作为结构证据，不作为 QA ready 声明 |
| Evidence package | PASS；`release-evidence/public-repo-code-understanding-20260703162834` |
| Live marker | PASS；`scanTaskId=250`，`codeUnderstandingFixture.status=OK`，anchor `ConfigController#page`，method/stack/QA 三路覆盖同一 Java 文件范围 |
| Verifier | PASS；`verify-release-evidence.sh` checksum 与 marker contract 通过 |
| Security/static gates | PASS；`static`、`release-verifier-public-repo-marker`、`validate-frontend-ui` 通过 |
| Authority boundary | unchanged；focused retained evidence，不刷新 full release authority |
| 下一步 | P6 转向检索排序质量、报告引用体验、Agent 辅助理解体验；P9 转向页面信息密度与大厂级 UI |

## 2026-07-03 最新状态：P6 Project QA code understanding lens

| Item | Status |
| --- | --- |
| Product/Architecture | PASS after revise；`Averroes / 019f271c-a1d6-7d22-9623-2bda9b8f4f3b` 要求 ProjectDetail 用户可见代码理解入口 |
| Frontend/QA | PASS after revise；`McClintock / 019f271c-c325-7aa0-b0e2-f0048e29da0c` 要求中文-first trust heading |
| Implementation | PASS；Project QA 新增 `代码理解定位入口`，支持 file:line、Class#method、stack frame 分类 |
| Product evidence | PASS；入口展示 scan、主证据位置、source label、证据角色、证据类型、相关分、召回模式、Readiness |
| Actions | PASS；`定位检索`、`解释此处`、`复制引用` |
| UI copy | PASS；关键 trust heading 已中文化 |
| Static/build | PASS；`validate-frontend-ui`、web build |
| Browser smoke | PASS；`project-qa-recoverable-ui-smoke`、`report-evidence-drawer-ui-smoke` |
| Authority boundary | unchanged；focused UI experience，不刷新 full release authority |
| 下一步 | 继续 public repo UI live evidence 或 AgentChat 辅助理解闭环 |

## 2026-07-03 最新状态：P6 Public repo UI codeUnderstandingLens contract

| Item | Status |
| --- | --- |
| Product/Architecture | ACCEPT；`Erdos / 019f272a-0e53-7ba3-aee5-ea9ceb844cc6` 要求 current-scan UI 定位证明，不做语义过度声明 |
| QA/Test | REVISE accepted；`Popper / 019f272a-2d09-7f60-b380-af555eba0e6d` 要求顶层 marker、verifier 强消费和 forged matrix |
| Implementation | PASS；public UI smoke 新增 `CodeUnderstandingLensProof`、`verifyCodeUnderstandingLens()` 和顶层 `codeUnderstandingLens` marker |
| Release verifier | PASS；`assertCodeUnderstandingLens()` 强校验 scan 绑定、`FILE_LINE`、safe reference、source label、PRIMARY、readiness、动作可见和 raw/claim 禁止 |
| Security regression | PASS；`release-verifier-public-repo-ui-marker` 覆盖缺失、数组、scan 漂移、foreign scan、GENERAL、空结果、路径穿越、行号倒置、按钮隐藏和 raw/provider/LLM claim |
| Static/build | PASS；`node scripts/validate-frontend-ui.mjs`、`npm --prefix web-console run build`、scoped `git diff --check` |
| Live UI smoke | NOT RUN；缺少 `SL_PUBLIC_REPO_UI_PROJECT_ID`、`SL_PUBLIC_REPO_UI_REPOSITORY_ID`、`SL_PUBLIC_REPO_UI_SCAN_TASK_ID`、`SL_PUBLIC_REPO_UI_TOKEN` |
| Authority boundary | unchanged；focused public repo UI marker contract，不刷新 full release authority |
| 下一步 | 配置 `SL_PUBLIC_REPO_UI_*` 后运行 `make public-repo-ui-smoke`；之后继续 AgentChat 受控解释或 P9 大厂级 UI 信息架构 |

## 2026-07-03 最新状态：P6 AgentChat codeUnderstanding handoff

| Item | Status |
| --- | --- |
| Product/Architecture | REVISE accepted；`Ada / Anscombe / 019f273d-a30c-7333-8028-10b27556cfb0` 要求 AgentChat 仅作为预填续问，不替代 Project QA 主解释闭环 |
| QA/Test | REVISE accepted；`Hopper / Helmholtz / 019f273d-c898-76f3-b7b3-874950357b5a` 要求 raw prompt 不进 URL、草稿保留、未自动发送、mock-only marker |
| Implementation | PASS；ProjectDetail `交给 Agent` 生成结构化 handoff URL，AgentChat 展示 `代码理解交接包` 并本地生成草稿 |
| Security boundary | PASS；URL 不含 raw prompt/raw stack/代码正文/provider raw output；不自动创建 AgentTask，不触发写工具或 AutoRepair |
| Smoke | PASS；`make agent-chat-closure-rail-ui-smoke` 输出 `codeUnderstandingHandoff.rawPromptInUrl=false`、`draftPrefilled=true`、`autoSent=false`、`unhandledApiRequests=0` |
| Regression | PASS；`make project-qa-recoverable-ui-smoke` 证明 Project QA 主解释闭环未被破坏 |
| Static/build | PASS；`node scripts/validate-frontend-ui.mjs`、`npm --prefix web-console run build` |
| Authority boundary | unchanged；mocked UI + static/build evidence，不刷新 full release authority |
| 下一步 | 若继续 Agent 辅助理解，应做受控 AgentTask 创建/绑定 API、审计表字段、release verifier forged matrix；或转向 P9 UI 信息架构 |

## 2026-07-03 最新状态：P6 AgentChat codeUnderstanding AgentTask binding

| Item | Status |
| --- | --- |
| Product/Architecture | ACCEPT；`Goodall / Lovelace / 019f274a-ee13-7af0-a772-60b2bbd29028` 要求只做 PENDING AgentTask + Conversation 绑定，不自动执行闭环 |
| QA/Security | REVISE accepted；`Fermat / Turing / 019f274b-0a28-7f01-8938-dfbaf9579b9d` 要求 marker 证明 structured-only、no raw prompt、no auto send、no auto start，且后端测试证明真实绑定 |
| Backend | PASS；`CreateAgentTaskRequest.conversationId`、conversation project/user/status/unbound 校验、`agent_task_id IS NULL` 条件更新 |
| Frontend | PASS；AgentChat `代码理解交接包` 提供 `新建绑定任务 / 创建绑定任务`，成功后保留草稿并显示真实闭环栏 |
| Smoke marker | PASS；`agentTaskBinding.taskStatus=PENDING`、`taskType=CUSTOM`、`boundByBackend=true`、`structuredInputOnly=true`、`autoStarted=false`、`autoSent=false` |
| Verification | PASS；`AgentTaskServiceTest`、web build、`validate-frontend-ui`、`agent-chat-closure-rail-ui-smoke` |
| Authority boundary | unchanged；focused backend test + mocked UI evidence，不刷新 full release authority |
| 下一步 | 可补 release verifier/security forged matrix 消费 `agentTaskBinding`；或继续 P6 检索/引用质量、P9 UI 信息架构 |

## 2026-07-03 最新状态：P6 AgentChat binding release evidence contract

| Item | Status |
| --- | --- |
| Release/Ops | PASS after revise；`Godel / Curie / 019f275a-0d44-79f1-8803-3f6bda7e7aae` 要求 schema v3 和 release/nightly 默认开启 |
| QA/Security | PASS after revise；`Aquinas / Noether / 019f275a-296f-7871-932d-34c4d71d5f7b` 要求 dedicated forged matrix |
| Release evidence | PASS；manifest 新增 `include_agent_chat_closure_rail_ui_smoke`，schema 升级到 `3` |
| Verifier | PASS；强消费 `AGENT_CHAT_CLOSURE_RAIL_SMOKE_OK.codeUnderstandingHandoff.agentTaskBinding` |
| Forged matrix | PASS；`release-verifier-agent-chat-marker` 拒绝 missing/duplicate/raw/auto/claim/mismatch 等伪造 |
| CI/Makefile | PASS；新 suite 已进入 CI matrix 和 Makefile |
| Verification | PASS；script syntax、AgentChat closure smoke、frontend UI validator、focused minimal release evidence、focused security suite |
| Authority boundary | unchanged；focused P6 release hardening，不刷新 full release authority |
| 下一步 | P6 继续检索排序质量、报告引用体验或 Agent 辅助理解；P9 继续 UI 信息架构升级 |

## 2026-07-03 最新状态：P6 AgentChat manual-send evidence closure

| Item | Status |
| --- | --- |
| Product/Architecture | PASS；`Zeno` 建议把 AgentChat handoff 推到“用户手动发送后仍能回看证据链”，不做自动执行 |
| QA/Security | PASS；`Curie` 实际交付 verifier/security forged matrix 升级 |
| UI | PASS；AgentChat 闭环栏新增 `代码理解手动发送闭环`，显示 `等待用户手动发送` 与任务状态 |
| Smoke | PASS；点击前无 message 请求，点击 `发送` 后才发 SSE POST；闭环栏仍可打开 audit/task/scan |
| Marker | PASS；新增 `manualSend` proof，覆盖 user-triggered、after-click request、no auto-send-before-click、PENDING、no auto-start、no write tool、audit visible、no raw prompt/stack |
| Release verifier | PASS；`verify-release-evidence.sh` 强消费 `manualSend` |
| Security regression | PASS；`release-verifier-agent-chat-marker` 拒绝 manual-send 伪造 |
| Evidence package | PASS；`release-evidence/20260703-181321` |
| Authority boundary | unchanged；focused evidence，不刷新 full release authority |
| 下一步 | P9：AgentTasks 三视口可读性与 raw payload safety；或 P6：检索排序/报告引用质量 |

## 2026-07-03 最新状态：P9 AgentTasks three-viewport readability + task payload safety

| Item | Status |
| --- | --- |
| Product/Architecture | PASS；`Lorentz/Zeno` 收束范围为 AgentTasks 当前页面 |
| QA/Security | PASS；`Darwin/Curie` 要求三视口、layout/readability guards 和 raw sentinel proof |
| UI | PASS；详情新增 `原始 Payload 安全边界`，关键详情文字可换行 |
| Smoke | PASS；`AGENT_TASKS_DETAIL_SELECTION_SMOKE_OK` 覆盖 `1440x900`、`390x844`、`320x740` |
| Payload safety | PASS；task-level raw input/output 哨兵不出现在页面或 marker |
| Marker | PASS；`layoutDensity`、`layoutGuards`、`readabilityGuards`、`tableOverflowOwnedByScroller`、`mobileReadability`、`payloadSafety` |
| Verification | PASS；frontend validator、web build、AgentTasks smoke、App shell smoke |
| Authority boundary | unchanged；focused mocked UI proof，不刷新 full release authority |
| Remaining | `TaskTimeline.step.outputJson` step-level raw output 治理后置 |
| 下一步 | P9 同类页面一致性，或 P6 检索排序/报告引用质量 |

## 2026-07-03 最新状态：P9 TaskTimeline step output raw payload safety

| Item | Status |
| --- | --- |
| Product/Security | PASS；`Sec-Nova/Hegel` 确认 `TaskTimeline.step.outputJson` 是上一轮后置风险，应作为独立小切片治理 |
| Frontend worker | IMPLEMENTED；`FE-Pixel/Parfit` 已把 raw output `<pre>` 改为 `步骤输出安全边界` note |
| UI boundary | IMPLEMENTED；`TaskTimeline` 不再 parse/format/render `item.output` 原文，保留步骤状态、类型、工具、耗时、描述和错误 |
| Smoke contract | IMPLEMENTED；AgentTasks fixture 增加 step-level raw output 哨兵 |
| Marker | IMPLEMENTED；`payloadSafety.scope=TASK_AND_TIMELINE_STEP_RAW_OUTPUT_ONLY`，新增 step output hidden/notice/pre-absent proof |
| Static guard | IMPLEMENTED；`validate-frontend-ui` 拒绝 `TaskTimeline` 回退到 `<pre>` 或 `formatJson(item.output)` |
| Verification | PASS；frontend validator、web build、AgentTasks smoke、ExecutionTasks smoke、patch-ready smoke |
| Authority boundary | unchanged；focused mocked UI + static proof，不刷新 full release authority |
| 下一步 | 可继续 P9 同类 raw payload 表面，或回到 P6 code_chunks/报告引用质量 |

## 2026-07-03 最新状态：P9 LogViewer display redaction safety

| Item | Status |
| --- | --- |
| Product/Security | PASS；`Sec-Nova/Kierkegaard` 确认共享 `LogViewer` 是下一优先级 display-redaction 切片 |
| Frontend worker | IMPLEMENTED；`FE-Pixel/Sartre` 已实现 `redactSensitiveLog(value)` 并渲染 `redactedValue` |
| UI boundary | IMPLEMENTED；`LogViewer` 暴露 `.sl-log-viewer` 与 `aria-label="脱敏执行日志"` |
| Smoke contract | IMPLEMENTED；ExecutionTasks 与 PATCH_READY fixture 均注入 common log secret 哨兵 |
| Marker | IMPLEMENTED；两个 marker 均新增 `logSafety.scope=LOG_VIEWER_DISPLAY_REDACTION_ONLY` |
| Static guard | IMPLEMENTED；`validate-frontend-ui` 锁定 `LogViewer` 脱敏和两条 smoke 的 raw secret proof |
| Verification | PASS；frontend validator、web build、ExecutionTasks smoke、PATCH_READY smoke |
| Authority boundary | unchanged；focused mocked UI + static proof，不刷新 full release authority |
| 下一步 | 可继续 AuditLogs raw JSON、artifact preview、CI raw log snippet 或 P6 检索/报告引用质量 |

## 2026-07-03 最新状态：P9 AuditLogs raw JSON display redaction safety

| Item | Status |
| --- | --- |
| Product/Security | ACCEPTED；`Sec-Nova/Archimedes / 019f27d1-72f2-7bb1-8e23-eb27a85f274f` 要求治理 AuditLogs 三类 raw JSON 展开显示，但保持 display redaction only |
| Frontend worker | IMPLEMENTED；`FE-Pixel/Hooke / 019f27d1-abfc-7e30-89a6-1531100f3bd6` 修改 `AuditLogs.tsx` |
| UI boundary | IMPLEMENTED；`Sanitized Input`、`Arguments`、`Result` 三类 JSON block 展开后渲染 `.sl-audit-json-redacted` |
| Compact preview | IMPLEMENTED；Webhook delivery `resultJson` 列表预览同样走 `formatRedactedJson` |
| Smoke contract | IMPLEMENTED；AuditLogs fixture 注入 Bearer、Authorization、apiKey、password、quoted secret、JWT、privateKey 哨兵 |
| Marker | IMPLEMENTED；`auditJsonSafety.scope=AUDIT_LOGS_RAW_JSON_DISPLAY_REDACTION_ONLY`，raw secret 不进入页面或 marker |
| Static guard | IMPLEMENTED；`validate-frontend-ui` 拒绝 drawer raw JSON `<pre>` 回退，并锁定三类 redacted JSON proof |
| Verification | PASS；frontend validator、web build、AuditLogs detail selection smoke |
| Authority boundary | unchanged；focused mocked UI + static proof，不刷新 full release authority |
| 下一步 | 可继续 Artifacts preview、CI raw log snippet、授权 raw 查看链路，或回到 P6 检索/报告引用质量 |

## 2026-07-03 最新状态：P9 Artifacts preview display redaction safety

| Item | Status |
| --- | --- |
| Product/Security | ACCEPTED；`Sec-Nova/Locke / 019f27dc-d8b1-7213-8a80-4fbb9702513a` 要求治理 Artifacts preview/raw JSON，但保持 display redaction only |
| Frontend worker | IMPLEMENTED；`FE-Pixel/Pauli / 019f27dc-fe13-7bd3-afab-0b1800e76069` 修改 `ArtifactPreviewRenderer.tsx` |
| UI boundary | IMPLEMENTED；smart preview、raw JSON details、text fallback 和 malformed JSON fallback 均渲染脱敏值 |
| Stable selectors | IMPLEMENTED；新增 `.sl-artifact-redacted-preview` 与 `.sl-artifact-redacted-raw-json` |
| Smoke contract | IMPLEMENTED；Artifacts fixture 注入 Bearer、Authorization、apiKey、password、quoted secret、JWT、privateKey 哨兵 |
| Marker | IMPLEMENTED；`artifactPreviewSafety.scope=ARTIFACTS_PREVIEW_DISPLAY_REDACTION_ONLY`，raw secret 不进入页面或 marker |
| Static guard | IMPLEMENTED；`validate-frontend-ui` 拒绝 raw `JSON.stringify(parsed.data, null, 2)` 回退，并锁定三类 preview proof |
| Verification | PASS；frontend validator、web build、Artifacts detail selection smoke |
| Authority boundary | unchanged；focused mocked UI + static proof，不刷新 full release authority |
| 下一步 | 可继续 CI raw log snippet、授权 raw 查看链路，或回到 P6 检索/报告引用质量 |

## 2026-07-03 最新状态：P9 CI Diagnostics raw log display redaction safety

| Item | Status |
| --- | --- |
| Product/Security | ACCEPTED；`Sec-Nova/Franklin / 019f27e7-6d1c-7e93-93fa-3565b45a99be` 要求治理 CI Diagnostics rawLogSnippet 展示，但保持 display redaction only |
| Frontend worker | IMPLEMENTED；`FE-Pixel/Ramanujan / 019f27e7-935a-70e2-8c57-90bf0f757c77` 修改 `CiDiagnostics.tsx` |
| UI boundary | IMPLEMENTED；详情日志渲染 `selectedRedactedRawLogSnippet`，不再直出 `selected.rawLogSnippet` |
| Stable selector | IMPLEMENTED；新增 `.sl-ci-log-redacted` 和 `aria-label="脱敏 CI 日志片段"` |
| Smoke contract | IMPLEMENTED；CI fixture 注入 Bearer、Authorization、apiKey、password、quoted secret、JWT、privateKey 哨兵 |
| Marker | IMPLEMENTED；`ciLogSafety.scope=CI_DIAGNOSTICS_RAW_LOG_DISPLAY_REDACTION_ONLY`，raw secret 不进入页面或 marker |
| Static guard | IMPLEMENTED；`validate-frontend-ui` 拒绝 raw `<pre className="sl-ci-log">{selected.rawLogSnippet}</pre>` 回退 |
| Verification | PASS；frontend validator、web build、CI Diagnostics detail selection smoke |
| Authority boundary | unchanged；focused mocked UI + static proof，不刷新 full release authority |
| 下一步 | 可继续授权 raw 查看链路，或回到 P6 检索/报告引用质量 |
## 2026-07-04 最新状态：P11 Artifacts raw download release verifier hardening

| Item | Status |
| --- | --- |
| Delivery owner | COMPLETED；`特朗普 / Current thread` 实现并验收 |
| Security/QA delegation | NOT SPAWNED；本轮沿用上一轮 Artifacts receipt/fallback 安全与 QA 结论，未新增争议点 |
| Verifier | IMPLEMENTED；`verify-release-evidence.sh` optional-present strict 校验 `ARTIFACTS_DETAIL_SELECTION_SMOKE_OK` 与 `AUDIT_LOGS_ARTIFACT_RAW_DOWNLOAD_DEEP_LINK_SMOKE_OK` |
| Security regression | IMPLEMENTED；`release-verifier-artifacts-marker` suite 覆盖 Artifacts marker 与 AuditLogs marker |
| CI/Makefile | IMPLEMENTED；CI matrix 与 Makefile target 已暴露该 suite |
| Verification | PASS；`bash -n`、`release-verifier-artifacts-marker`、`static` |
| Authority boundary | unchanged；未刷新 full release authority，未把 Artifacts smoke 加入标准 release step |
| Next | 继续 P11 focused marker absorption 或回到 P6 code understanding/report citation quality |

## 2026-07-04 最新状态：Team operating model 11 + 5

| Item | Status |
| --- | --- |
| Core team | ACTIVE；保持 11 个固定核心角色 |
| Expert pool | ACTIVE ON DEMAND；新增 `任正非`、`马云`、`雷军`、`马化腾`、`张一鸣` |
| Physical subagents | ON DEMAND；不扩成 16 个常驻实例 |
| Runtime mapping | REQUIRED；随机 UI 昵称必须映射到固定角色或固定专家 |
| Current business work | CONTINUES；该治理调整不改变当前 P6/P9/P11 主线 |
| Next | 继续按 11 + 5 模式推进 P6 code understanding / P9 UI / P11 release governance |

## 2026-07-04 最新状态：P6/P9 Project QA controlled Agent handoff

| Item | Status |
| --- | --- |
| Expert review | PARTIAL ACCEPTED；`雷军 / Herschel / 019f294b-d152-7b20-a4b3-e236ffb93594` |
| ProjectDetail lens | IMPLEMENTED；新增 `Agent 交接合约` |
| Action gate | IMPLEMENTED；`解释此处` / `交给 Agent` 只在 current scan + PRIMARY 时启用 |
| Handoff URL source safety | IMPLEMENTED；源头 display-redacted 后写 query |
| Smoke marker | IMPLEMENTED；`agentHandoffContract`、`actionGate`、`handoffUrlSafety` |
| Verification | PASS；frontend validator、Project QA recoverable smoke、AgentChat closure rail smoke、web build |
| Authority boundary | unchanged；focused mocked UI + static/build proof，不刷新 full release authority |
| Next | AgentChat pre-conversation CTA 语义收敛；或继续 P6 source-location / report citation quality |

## 2026-07-04 最新状态：P6/P9 AgentChat pre-conversation handoff CTA

| Item | Status |
| --- | --- |
| Frontend worker | ACCEPTED；`扎克伯格 / Hilbert / 019f2955-cca9-7f20-a476-57a46e8f16a3` |
| Pre-conversation CTA | IMPLEMENTED；未选择会话时隐藏 `使用交接问题`，主 CTA 为 `创建绑定任务并进入会话` |
| Missing scan gate | IMPLEMENTED；缺 `scanTaskId` 时 disabled 并显示原因 |
| Conversation binding | IMPLEMENTED；先建 conversation，再创建绑定 AgentTask |
| Duplicate key guard | IMPLEMENTED；conversation 写入本地列表使用 upsert |
| Smoke marker | IMPLEMENTED；`codeUnderstandingHandoff.preConversationState` |
| Verification | PASS；frontend validator、AgentChat closure rail smoke、web build |
| Authority boundary | unchanged；focused mocked UI + static/build proof，不刷新 full release authority |
| Next | P6 source-location / code_chunks / report citation quality，或 release verifier optional-present hardening |

## 2026-07-04 最新状态：P11 AgentChat pre-conversation marker verifier hardening

| Item | Status |
| --- | --- |
| Verifier | IMPLEMENTED；`verify-release-evidence.sh` 强校验 `codeUnderstandingHandoff.preConversationState` |
| Forged matrix | IMPLEMENTED；`release-verifier-agent-chat-marker` 新增 8 类 pre-conversation 篡改 |
| Static gate | PASS；`security-regression-check.sh --suite static` |
| Focused security suite | PASS；`security-regression-check.sh --suite release-verifier-agent-chat-marker` |
| Authority boundary | unchanged；不刷新 full release authority |
| Next | P6 source-location / code_chunks / report citation quality，或继续 P11 focused marker hardening |

## 2026-07-04 最新状态：P6/P11 public repo report evidence QA citation marker

| Item | Status |
| --- | --- |
| Delivery owner | COMPLETED；`特朗普 / Current thread` 实现并验收 |
| Smoke marker | IMPLEMENTED；`PUBLIC_REPO_SMOKE_OK.reportEvidenceQaCitationQuality`，surface=`PUBLIC_REPO_REPORT_EVIDENCE_QA_MULTI_ANCHOR` |
| Runtime mode | IMPLEMENTED；`SOURCELENS_PUBLIC_REPO_SMOKE_REPORT_EVIDENCE_QA_CITATION=auto|true|false` |
| Evidence quality | IMPLEMENTED；至少 2 个 report apiRoutes line-anchor 样本，真实调用 Project QA 并要求 `REPORT_LINE_ANCHOR`、`VERIFIED`、引用强制成功、必需证据覆盖 100%、claim citation `READY`、role distribution `PRIMARY_BOUND` |
| Verifier | IMPLEMENTED；`verify-release-evidence.sh` optional-present strict validation |
| Forged matrix | PASS；`release-verifier-public-repo-marker` 覆盖 sample count、scan mismatch、file anchor、低覆盖、claim review、role drift、raw prompt leak |
| Authority boundary | unchanged；不刷新 full release authority，未重新运行真实 public repo smoke |
| Next | 可用真实 public repo smoke 刷新 retained evidence；或继续 P6 report narrative / code_chunks retrieval quality / P11 focused marker absorption |

## 2026-07-04 最新状态：P11 release evidence absorbs report evidence QA citation marker

| Item | Status |
| --- | --- |
| DevOps review | PARTIAL ACCEPTED；`黄仁勋 / Carson / 019f2bae-6c29-71d0-aad1-ac86c4a9366c` |
| Release profile | IMPLEMENTED；`local=auto`、`ci=false`、`release/nightly=true` |
| Manifest | IMPLEMENTED；新增 `public_repo_report_evidence_qa_citation` |
| Smoke env bridge | IMPLEMENTED；release evidence 标准 `public-repo-smoke` 调用显式传递 `SOURCELENS_PUBLIC_REPO_SMOKE_REPORT_EVIDENCE_QA_CITATION` |
| Verifier | IMPLEMENTED；manifest 为 true 时强制要求 `PUBLIC_REPO_SMOKE_OK.reportEvidenceQaCitationQuality` |
| Security regression | PASS；`release-verifier-public-repo-marker` |
| Lightweight package check | PASS；CI profile evidence 包和 verifier 复核通过 |
| Authority boundary | unchanged；不刷新 full release authority |
| Next | 下一次 release/nightly evidence 会强制吸收该 focused marker；若真实样本不足应失败而非跳过 |

## 2026-07-04 最新状态：P9 ProjectDetail workspace next action rail

| Item | Status |
| --- | --- |
| Product expert | ACCEPTED；`雷军 / Wegener / 019f2bbb-0ddc-77b2-8bb1-d4d5bdb5ca6d` 建议 Project workspace next action rail |
| QA review | PARTIAL FIXED；`拉里佩奇 / Planck / 019f2bcb-f0ad-7640-a981-6a7edcbc820e` 打回 marker 颗粒度和 fixture realism，已修复 |
| ProjectDetail rail | IMPLEMENTED；`ProjectWorkspaceNextActionRail` 替代首屏并列按钮，提供唯一主 CTA、次 CTA 和证据检查 |
| State coverage | IMPLEMENTED；`ADD_REPOSITORY`、`START_SCAN`、`WATCH_SCAN`、`REVIEW_FAILED_SCAN`、`OPEN_ARTIFACTS`、`OPEN_QA` |
| Responsive readability | IMPLEMENTED；dark surface readable styles，1440/390/320 smoke 覆盖，320 无横向溢出 |
| Smoke marker | PASS；`PROJECT_WORKSPACE_NEXT_ACTION_SMOKE_OK.checkedCases=18`、`expectedCheckedCases=18`、`overflowFailures=0` |
| Verification | PASS；frontend validator、web build、Batch4A smoke、diff check |
| Authority boundary | unchanged；不刷新 full release authority，不声明 LLM/provider 质量 |
| Next | 继续 P9 大厂级 UI 信息架构，候选为 ProjectDetail/ScanTaskDetail 报告体验或 App shell 细节一致性 |

## 2026-07-04 最新状态：P11 report evidence QA citation manifest fail-closed hardening

| Item | Status |
| --- | --- |
| DevOps review | PARTIAL ACCEPTED；`黄仁勋 / Carson / 019f2bae-6c29-71d0-aad1-ac86c4a9366c` |
| Release verifier | IMPLEMENTED；release/nightly profile 必须有 `public_repo_report_evidence_qa_citation_manifest_present=true` |
| Release mode | IMPLEMENTED；release/nightly profile 必须有 `public_repo_report_evidence_qa_citation=true` |
| Marker gate | MAINTAINED；manifest 为 true 时继续强制 `PUBLIC_REPO_SMOKE_OK.reportEvidenceQaCitationQuality` |
| Static regression | PASS；`security-regression-check.sh` 锁住 manifest presence 和 hard-required true mode |
| Verification | PASS；bash syntax、`release-verifier-public-repo-marker`、frontend validator、diff check |
| Authority boundary | unchanged；不刷新 full release authority |
| Next | 下一次 release/nightly full evidence package 应吸收 source-location v4、exact-line、narrative 和 report QA citation gates |

## 2026-07-04 最新状态：P11 current full release authority refresh

| Item | Status |
| --- | --- |
| DevOps review | PARTIAL ACCEPTED；`黄仁勋 / Chandrasekhar / 019f2c30-d9f7-72e2-b78b-e028bd1bb364` |
| Runtime | ACCEPTED；使用 `SERVER_PORT=19081 make backend-jar` 稳定 jar runtime |
| Full package | HISTORICAL；`release-evidence/release-current-schema-20260704-1618` 已被 `release-evidence/release-current-schema-20260705-0610` supersede |
| Result | PASS；`required_failures=0`、`optional_warnings=0`、`skipped=5` |
| Verifier | PASS；`./scripts/verify-release-evidence.sh release-evidence/release-current-schema-20260704-1618` |
| Security regression | PASS；static suite 与 `release-verifier-report-evidence-marker` |
| Absorbed gates | source-location v4 first-result、report QA citation manifest/narrative、report evidence drawer、AutoRepair patch |
| Superseded package | `release-evidence/release-current-schema-20260702-230650`；最新 verifier 下缺 manifest presence 字段 |
| Remaining skips | backup restore drill evidence、rollback plan、GitHub App drill、GitHub webhook drill、LLM provider run |
| Next | 继续 P6 code_chunks/report citation quality、P9 大厂级 UI、P12 生产灾备/回滚签署 |

## 2026-07-04 最新状态：P6/P9 ProjectDetail QA readable evidence view model

| Item | Status |
| --- | --- |
| Product expert | PASS；`雷军 / Faraday / 019f2ca0-b1c9-7be0-935f-421dd6025923` 确认前端内部 view model 收口产品合理 |
| View model | IMPLEMENTED；`QaReadableEvidenceViewModel` 集中承载 repair gate、citation audit、claim audit、trust summary、cross-file summary、source receipt、source file release |
| Builder | IMPLEMENTED；`buildQaReadableEvidenceViewModel(msg)` 复用现有严格 helper，不改后端合约 |
| Rendering | IMPLEMENTED；ProjectDetail QA assistant message 渲染层从 `readableEvidence` 消费面板数据 |
| Static gate | PASS；`validate-frontend-ui.mjs` 锁定 view model、builder 和渲染入口 |
| Web build | PASS；`npm --prefix web-console run build` |
| Authority boundary | unchanged；不刷新 full release authority |
| Next | P9 可继续把这些面板视觉上收拢为“QA 可信证据”统一区块；P6 可继续 report citation source diversity / narrative citation quality |

## 2026-07-04 最新状态：P9 ProjectDetail QA readable evidence section

| Item | Status |
| --- | --- |
| UX expert | PARTIAL FIXED；`雷军 / Beauvoir / 019f2ca7-7e79-7a80-9cd3-5259488615b1` 打回统一区块存在和顺序门禁，已修复 |
| Section | IMPLEMENTED；新增 `QaReadableEvidenceSection` 与 `aria-label="QA 可信证据"` |
| Scope | IMPLEMENTED；只包 trust summary、cross-file summary、source receipt、source file release、next action rail |
| Boundary | IMPLEMENTED；citation audit、claim audit、repair gate、回答引用和 code_chunks 保持在区块外 |
| CSS | IMPLEMENTED；新增 `sl-qa-readable-evidence` ready/warning/blocked、head、flow 和移动端布局 |
| Static gate | PASS；`validate-frontend-ui.mjs` 锁定组件、五段顺序、区块外边界和 CSS 合同 |
| Smoke | PASS；`npm --prefix web-console run smoke:project-qa-recoverable` |
| Web build | PASS；`npm --prefix web-console run build` |
| Authority boundary | unchanged；不刷新 full release authority |
| Next | P9 继续证据摘要与底层审计之间的折叠/密度策略；P6 继续 report citation source diversity |

## 2026-07-04 最新状态：P9 ProjectDetail QA detailed audit section

| Item | Status |
| --- | --- |
| QA review | PARTIAL FIXED；`拉里佩奇 / Laplace / 019f2cb0-b801-7ad3-8cea-492e39a0f4ea` 确认分组不破坏内部 aria label 可见性，打回旧 validator 规则，已修复 |
| Section | IMPLEMENTED；新增 `QaDetailedEvidenceAuditSection` 与 `aria-label="QA 底层审计证据"` |
| Scope | IMPLEMENTED；只包 citation coverage audit、claim citation audit、repair evidence gate |
| Visibility | MAINTAINED；`引用覆盖审计`、`主张引用质量`、`修复证据门禁` 内部 aria label 仍直接可见 |
| CSS | IMPLEMENTED；新增 `sl-qa-detailed-audit` ready/warning/blocked、head、flow 和移动端布局 |
| Static gate | PASS；`validate-frontend-ui.mjs` 锁定 detailed audit section、内部面板和 repair gate gate-based 渲染 |
| Smoke | PASS；`npm --prefix web-console run smoke:project-qa-recoverable` |
| Web build | PASS；`npm --prefix web-console run build` |
| Authority boundary | unchanged；不刷新 full release authority |
| Next | P9 继续证据链 compact row 密度治理；P6 继续 report citation source diversity |

## 2026-07-04 最新状态：P9 ProjectDetail QA detailed audit compact summary

| Item | Status |
| --- | --- |
| UX review | PARTIAL FIXED；`雷军 / Banach / 019f2cb8-b58d-78a2-a7c2-a776d4c46953` 要求三格只显示既有 title/status，已修复 |
| Summary row | IMPLEMENTED；新增 `aria-label="QA 底层审计摘要"` |
| Items | IMPLEMENTED；固定 `引用覆盖`、`主张质量`、`修复门禁` 三项 |
| Source | IMPLEMENTED；引用/主张来自 audit title + `qaAuditTagText(tone)`，修复门禁来自 gate label + status |
| CSS | IMPLEMENTED；summary item ready/warning/blocked、三列、响应式、文本换行 |
| Static gate | PASS；`validate-frontend-ui.mjs` 锁定 summary row、状态来源、详细面板继续可见和 CSS 合同 |
| Smoke | PASS；`npm --prefix web-console run smoke:project-qa-recoverable` |
| Web build | PASS；`npm --prefix web-console run build` |
| Authority boundary | unchanged；不刷新 full release authority |
| Next | P9 继续 ProjectDetail / ScanTaskDetail compact evidence pattern；P6 继续 report citation source diversity |

## 2026-07-04 最新状态：P6/P9 ScanTaskDetail report citation quality panel

| Item | Status |
| --- | --- |
| Product/Frontend review | BLOCK FIXED；`雷军` + `扎克伯格` mapped to `Halley / 019f2d90-07cb-76c3-b474-c4ca3e2a4554`，要求报告页级面板而不是抽屉级预检 |
| Panel | IMPLEMENTED；新增 `aria-label="报告引用质量"` 页面级面板 |
| Data contract | IMPLEMENTED；消费 `reportQuality.reportCitationQuality`，缺失 `GAP`、部分绑定 `REVIEW`、完整 no-overclaim `READY` |
| Metrics | IMPLEMENTED；展示 `Citation quality`、`Source diversity`、`Narrative binding` |
| Boundary | IMPLEMENTED；明确“只证明报告字段和扫描产物绑定，不证明 LLM 事实正确” |
| CSS | IMPLEMENTED；新增 `sl-report-citation-quality*`，覆盖 1440、390、320 viewport |
| Static gate | PASS；`validate-frontend-ui.mjs` 锁定 builder、组件、CSS、fixture、smoke 断言和 marker |
| Smoke | PASS；`CI=true npm --prefix web-console run smoke:report-evidence-drawer` |
| Web build | PASS；`npm --prefix web-console run build` |
| Authority boundary | unchanged；不刷新 full release authority |
| Next | P6 可运行真实 public repo UI/release evidence 吸收该 marker；P9 继续 ScanTaskDetail 信息密度和折叠策略 |

## 2026-07-04 最新状态：P11 report citation quality UI marker verifier hardening

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Verifier | IMPLEMENTED；optional-present strict 校验 `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK.reportCitationQuality` |
| Security regression | PASS；`release-verifier-report-evidence-marker` 动态拒绝 13 个 report-citation-quality 伪造负例 |
| Sensitive material guard | IMPLEMENTED；marker key 递归拒绝 raw/prompt/answer/content/stack/token/secret/password/authorization/bearer |
| Inventory strict | PASS；根目录治理文件已归入 Documentation and handoff，Other 分组为空 |
| Runbook | UPDATED；`make verify` Git diff whitespace 检查已记录 unstaged/staged 覆盖 |
| Focused evidence | PASS；`release-evidence/report-citation-quality-ui-marker-20260704-230940`，`required_failures=0`、`optional_warnings=0`，verifier PASS |
| Current marker contract | `drawerQueryCount=6`、`readyDrawerQueryCount=3`、`gapDrawerQueryCount=3`、`qaRequestCount=6`、viewports `1440x900/390x844/320x740` |
| Authority boundary | unchanged；不刷新 full release authority |
| Next | 下一次 full release evidence package 应吸收该 marker，或继续 P6/P9 ScanTaskDetail 信息密度治理 |

## 2026-07-04 最新状态：P6/P9/P11 report citation quality verdict rail

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Frontend | IMPLEMENTED；`ScanTaskDetail` 报告引用质量面板新增 `aria-label="报告引用质量裁决依据"` |
| Verdict signals | IMPLEMENTED；合同、结构绑定、叙事绑定、边界 |
| Smoke marker | IMPLEMENTED；`REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK.reportCitationQuality.verdictVisible=true`、`verdictItemCount=4`、`verdictBoundaryVisible=true` |
| Static gate | PASS；`node scripts/validate-frontend-ui.mjs` |
| Web build | PASS；`npm --prefix web-console run build` |
| Browser smoke | PASS；`CI=true npm --prefix web-console run smoke:report-evidence-drawer` |
| Security regression | PASS；`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-report-evidence-marker` |
| Focused evidence | PASS；`release-evidence/report-citation-quality-verdict-ui-marker-20260704-233030` verifier PASS |
| Authority boundary | unchanged；不刷新 full release authority |
| Next | P9 继续 ScanTaskDetail 信息密度；P6 继续 report citation / code_chunks 检索质量；P11 下一次 full package 吸收当前 marker schema |

## 2026-07-04 最新状态：P6/P9/P11 report citation source coverage

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Frontend | IMPLEMENTED；`ScanTaskDetail` 报告引用质量面板新增 `aria-label="报告引用来源覆盖"` |
| Source coverage | IMPLEMENTED；展示 `Source coverage` 和 `apiRoutes/dbEntities`、`codeQuality.risks`、`modules`、`overview`、`scanFingerprint` |
| Smoke marker | IMPLEMENTED；`sourceCoverageVisible=true`、`sourceSectionCount=5`、`sourceSections` 完整集合 |
| Static gate | PASS；`node scripts/validate-frontend-ui.mjs` |
| Web build | PASS；`npm --prefix web-console run build` |
| Browser smoke | PASS；`CI=true npm --prefix web-console run smoke:report-evidence-drawer` |
| Security regression | PASS；`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-report-evidence-marker` |
| Focused evidence | PASS；`release-evidence/report-citation-source-coverage-20260704-234304` verifier PASS |
| Authority boundary | unchanged；不刷新 full release authority |
| Next | P9 继续 ScanTaskDetail 信息密度；P6 继续 code_chunks / report citation 真实样本质量；P11 下一次 full package 吸收当前 marker schema |

## 2026-07-04 最新状态：P6/P9/P11 report citation source labels

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Frontend | IMPLEMENTED；source coverage tag 显示 `section · 中文标签` |
| Labels | IMPLEMENTED；`API/数据面`、`风险信号`、`模块图`、`扫描范围`、`扫描指纹` |
| Smoke marker | IMPLEMENTED；`sourceSections` 和 `sourceSectionLabels` 完整集合 |
| Static gate | PASS；`node scripts/validate-frontend-ui.mjs` |
| Web build | PASS；`npm --prefix web-console run build` |
| Browser smoke | PASS；`CI=true npm --prefix web-console run smoke:report-evidence-drawer` |
| Security regression | PASS；`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-report-evidence-marker` |
| Focused evidence | PASS；`release-evidence/report-citation-source-labels-20260704-235459` verifier PASS |
| Authority boundary | unchanged；不刷新 full release authority |
| Next | P9 继续 ScanTaskDetail 折叠/密度治理；P6 继续 code_chunks / report citation 真实样本质量 |

## 2026-07-05 最新状态：P9/P11 report citation detail disclosure

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Frontend | IMPLEMENTED；section / narrative binding 明细进入 `details/summary` |
| Density | IMPLEMENTED；摘要、来源、裁决和边界常显，绑定明细默认收起 |
| Smoke marker | IMPLEMENTED；`detailToggleVisible=true`、`detailDefaultCollapsed=true`、`detailOpens=true` |
| Static gate | PASS；`node scripts/validate-frontend-ui.mjs` |
| Web build | PASS；`npm --prefix web-console run build` |
| Browser smoke | PASS；`CI=true npm --prefix web-console run smoke:report-evidence-drawer` |
| Security regression | PASS；`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-report-evidence-marker` |
| Focused evidence | PASS；`release-evidence/report-citation-detail-disclosure-20260705-000918` verifier PASS |
| Authority boundary | unchanged；不刷新 full release authority |
| Next | P9 继续 ScanTaskDetail 分组密度；P6 继续 code_chunks / report citation 真实样本质量 |

## 2026-07-05 最新状态：P6/P9/P11 report citation source reading order

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Frontend | IMPLEMENTED；source coverage 使用固定报告阅读顺序 |
| Reading order | IMPLEMENTED；`overview -> modules -> apiRoutes/dbEntities -> scanFingerprint -> codeQuality.risks` |
| Label order | IMPLEMENTED；`扫描范围 -> 模块图 -> API/数据面 -> 扫描指纹 -> 风险信号` |
| Smoke marker | IMPLEMENTED；`sourceSectionOrder` 和 `sourceSectionLabelOrder` 精确顺序 |
| Static gate | PASS；`node scripts/validate-frontend-ui.mjs` |
| Web build | PASS；`npm --prefix web-console run build` |
| Browser smoke | PASS；`CI=true npm --prefix web-console run smoke:report-evidence-drawer` |
| Security regression | PASS；`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-report-evidence-marker` |
| Focused evidence | PASS；`release-evidence/report-citation-source-order-20260705-002223` verifier PASS |
| Authority boundary | unchanged；不刷新 full release authority |
| Next | P9 继续 ScanTaskDetail 分组密度；P6 继续 code_chunks / report citation 真实样本质量；P11 下一次 full package 吸收当前 marker schema |

## 2026-07-05 最新状态：P9/P11 report main path guide

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Frontend | IMPLEMENTED；报告总览新增 `报告主链路导览` |
| Main path | IMPLEMENTED；`recommended-action -> citation-quality -> evidence-priority` |
| Smoke marker | IMPLEMENTED；`REPORT_EVIDENCE_DRAWER_SMOKE_OK.mainPathGuide` |
| Mobile | PASS；390/320 viewport covered，no horizontal overflow |
| Static gate | PASS；`node scripts/validate-frontend-ui.mjs` |
| Web build | PASS；`npm --prefix web-console run build` |
| Browser smoke | PASS；`CI=true npm --prefix web-console run smoke:report-evidence-drawer` |
| Security regression | PASS；`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-report-evidence-marker` |
| Focused evidence | PASS；`release-evidence/report-main-path-guide-20260705-003844` verifier PASS |
| Authority boundary | unchanged；不刷新 full release authority |
| Next | P9 继续 ScanTaskDetail 分组密度；P6 继续 code_chunks / report citation 真实样本质量；P11 下一次 full package 吸收当前 marker schema |

## 2026-07-05 最新状态：P9/P11 report action board

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Frontend | IMPLEMENTED；报告总览新增 `报告后续行动` |
| Action routing | IMPLEMENTED；`risk-review -> code-qa -> agent-review -> audit-trace -> dependency-review -> repair-candidate` |
| Smoke marker | IMPLEMENTED；`REPORT_EVIDENCE_DRAWER_SMOKE_OK.actionBoard` |
| Mobile | PASS；390/320 viewport covered，no horizontal overflow |
| Static gate | PASS；`node scripts/validate-frontend-ui.mjs` |
| Web build | PASS；`npm --prefix web-console run build` |
| Browser smoke | PASS；`CI=true npm --prefix web-console run smoke:report-evidence-drawer` |
| Security regression | PASS；`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-report-evidence-marker` |
| Focused evidence | PASS；`release-evidence/report-action-board-20260705-005841` verifier PASS |
| Authority boundary | unchanged；不刷新 full release authority |
| Next | P9 继续 ScanTaskDetail 分组密度；P6 继续 code_chunks / report citation 真实样本质量；P11 下一次 full package 吸收当前 marker schema |

## 2026-07-05 最新状态：P9/P11 report review gate release contract

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Frontend | IMPLEMENTED；报告复核门禁新增稳定 key，文本不再裁切 |
| Gate order | IMPLEMENTED；`report-readiness -> evidence-bundle -> code-knowledge -> repair-readiness -> audit-trace -> governance-timeline` |
| Smoke marker | IMPLEMENTED；`REPORT_EVIDENCE_DRAWER_SMOKE_OK.reviewGate` |
| Mobile | PASS；390/320 viewport covered，textNotClipped，no horizontal overflow |
| Static gate | PASS；`node scripts/validate-frontend-ui.mjs` |
| Web build | PASS；`npm --prefix web-console run build` |
| Browser smoke | PASS；`CI=true npm --prefix web-console run smoke:report-evidence-drawer` |
| Security regression | PASS；`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-report-evidence-marker` |
| Focused evidence | PASS；`release-evidence/report-review-gate-20260705-011417` verifier PASS |
| Authority boundary | unchanged；不刷新 full release authority |
| Next | P9 继续 ScanTaskDetail 分组密度；P6 继续 code_chunks / report citation 真实样本质量；P11 下一次 full package 吸收当前 marker schema |

## 2026-07-05 最新状态：P6/P11 code_chunks snake_case evidence path anchor

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Data/AI retrieval | IMPLEMENTED；`梁文峰 / Current thread mapped role` |
| Evidence path parsing | IMPLEMENTED；`filePath:` + `file_path:` + quoted JSON `"file_path"` |
| Evidence line parsing | IMPLEMENTED；quoted JSON `line_number` / `lineNumber` / `line`，并避免 `start_line` 误判 |
| Handler anchor parsing | IMPLEMENTED；quoted JSON `handler_class + handler_method` 进入 method anchor |
| Retrieval behavior | IMPLEMENTED；`file_path + line_number` 进入 evidence file path / line anchor；`handler_class + handler_method + line_number` 进入 method / line anchor；明确 evidence path hint 强于报告文档普通文本命中 |
| Backend tests | PASS；`mvn -Dtest=CodeLocationHintParserTest,CodeChunkServiceTest test` |
| Test result | PASS；77 tests，0 failures，0 errors |
| Authority boundary | unchanged；不刷新 full release authority |
| Next | P6 继续 report citation 真实样本质量和跨文件检索；P9 继续核心页面 UI；P11 维持 verifier 回归 |

## 2026-07-05 最新状态：P6 Code QA retrieval role diversity

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Data/AI retrieval | IMPLEMENTED；`梁文峰 / Current thread mapped role` |
| Retrieval behavior | IMPLEMENTED；保留 exact anchor 和首条最高相关结果后，按 evidenceType 补齐不同角色 |
| Role coverage | IMPLEMENTED；controller -> service -> data-access -> domain-model -> frontend -> test -> config |
| Backend tests | PASS；`mvn -Dtest=CodeQaRetrievalServiceTest test` |
| Test result | PASS；24 tests，0 failures，0 errors |
| Authority boundary | unchanged；不刷新 full release authority |
| Next | P6 继续 report citation 多来源质量；P9 继续核心页面 UI；P11 维持 verifier 回归 |

## 2026-07-05 最新状态：P6 Code QA combined citation labels

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Data/AI citation trust | IMPLEMENTED；`梁文峰 / Current thread mapped role` |
| Citation parser | IMPLEMENTED；支持 `[C1]`、`[C1, C2]`、`[C1-C2]` |
| Safety boundary | IMPLEMENTED；只解析方括号内 C-label，保留代码块/日志/示例过滤，range 有展开上限 |
| Backend tests | PASS；`mvn -Dtest=CodeQaControllerTest test` |
| Test result | PASS；27 tests，0 failures，0 errors |
| Authority boundary | unchanged；不刷新 full release authority |
| Next | P6 继续 report citation 真实样本质量和 QA 可信度；P9 继续核心页面 UI；P11 维持 verifier 回归 |

## 2026-07-05 最新状态：P6 Code QA full-width citation brackets

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Data/AI citation trust | IMPLEMENTED；`梁文峰 / Current thread mapped role` |
| Citation parser | IMPLEMENTED；支持 ASCII `[]` 和 full-width `【】` |
| Chinese output compatibility | IMPLEMENTED；`【C1】`、`【C1，C2】` 可进入 grounding/citation/claim coverage |
| Safety boundary | IMPLEMENTED；citation example 过滤同步支持 `【C1】` |
| Backend tests | PASS；`mvn -Dtest=CodeQaControllerTest test` |
| Test result | PASS；28 tests，0 failures，0 errors |
| Authority boundary | unchanged；不刷新 full release authority |
| Next | P6 继续 QA citation 真实样本覆盖；P9 继续核心页面 UI；P11 维持 verifier 回归 |

## 2026-07-05 最新状态：P9 Artifacts focus card evidence readability

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Frontend readability | IMPLEMENTED；`扎克伯格 / Current thread mapped role` |
| Product experience | IMPLEMENTED；`雷军 / Current thread mapped role` |
| Focus card text | IMPLEMENTED；primary evidence 和 meta values 可换行、可断词 |
| Frontend smoke | PASS；`CI=true npm --prefix web-console run smoke:artifacts-detail-selection` |
| Static UI gate | PASS；`node scripts/validate-frontend-ui.mjs` |
| Build | PASS；`npm --prefix web-console run build` |
| Authority boundary | unchanged；不刷新 full release authority |
| Next | P9 继续表格/chip/详情页文本裁切治理；P6 继续 QA citation 真实样本覆盖；P11 维持 verifier 回归 |

## 2026-07-05 最新状态：P9 Artifacts filter chip evidence readability

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Frontend readability | IMPLEMENTED；`扎克伯格 / Current thread mapped role` |
| Product experience | IMPLEMENTED；`雷军 / Current thread mapped role` |
| Filter chip text | IMPLEMENTED；bundle/type chip 关键文本可换行、可断词 |
| Frontend smoke | PASS；`CI=true npm --prefix web-console run smoke:artifacts-detail-selection` |
| Static UI gate | PASS；`node scripts/validate-frontend-ui.mjs` |
| Build | PASS；`npm --prefix web-console run build` |
| Authority boundary | unchanged；不刷新 full release authority |
| Next | P9 继续 artifact table cell/detail drawer 文本裁切治理；P6 继续 QA citation 真实样本覆盖；P11 维持 verifier 回归 |

## 2026-07-05 最新状态：P9 Artifacts table cell evidence readability

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Frontend readability | IMPLEMENTED；`扎克伯格 / Current thread mapped role` |
| Product experience | IMPLEMENTED；`雷军 / Current thread mapped role` |
| Table text | IMPLEMENTED；type/owner cells 关键文本可换行、可断词 |
| Frontend smoke | PASS；`CI=true npm --prefix web-console run smoke:artifacts-detail-selection` |
| Static UI gate | PASS；`node scripts/validate-frontend-ui.mjs` |
| Build | PASS；`npm --prefix web-console run build` |
| Authority boundary | unchanged；不刷新 full release authority |
| Next | P9 继续 artifact drawer/action/status 文本裁切治理；P6 继续 QA citation 真实样本覆盖；P11 维持 verifier 回归 |

## 2026-07-05 最新状态：P9 Artifacts drawer action/status readability

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Frontend readability | IMPLEMENTED；`扎克伯格 / Current thread mapped role` |
| Product experience | IMPLEMENTED；`雷军 / Current thread mapped role` |
| Drawer action/status text | IMPLEMENTED；来源/预览/下载/加载预览/状态提示可换行、可断词 |
| Frontend smoke | PASS；`CI=true npm --prefix web-console run smoke:artifacts-detail-selection` |
| Static UI gate | PASS；`node scripts/validate-frontend-ui.mjs` |
| Build | PASS；`npm --prefix web-console run build` |
| Authority boundary | unchanged；不刷新 full release authority |
| Next | P9 继续 artifact raw preview/modal/audit receipt 文本裁切治理；P6 继续 QA citation 真实样本覆盖；P11 维持 verifier 回归 |

## 2026-07-05 最新状态：P9 Artifacts preview tile readability

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Frontend readability | IMPLEMENTED；`扎克伯格 / Current thread mapped role` |
| Product experience | IMPLEMENTED；`雷军 / Current thread mapped role` |
| Preview tile text | IMPLEMENTED；summary tile label/value 可换行、可断词 |
| Frontend smoke | PASS；`CI=true npm --prefix web-console run smoke:artifacts-detail-selection` |
| Static UI gate | PASS；`node scripts/validate-frontend-ui.mjs` |
| Build | PASS；`npm --prefix web-console run build` |
| Authority boundary | unchanged；不刷新 full release authority |
| Next | P9 继续 artifact raw JSON/modal/audit receipt 文本裁切治理；P6 继续 QA citation 真实样本覆盖；P11 维持 verifier 回归 |

## 2026-07-05 最新状态：P9/P10 Artifacts raw download confirm readability

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Frontend readability | IMPLEMENTED；`扎克伯格 / Current thread mapped role` |
| Security boundary | REVIEWED；`奥特曼 / Current thread mapped role` |
| Raw download confirm | IMPLEMENTED；title/content/cancel/confirm 可换行、可断词 |
| Frontend smoke | PASS；`CI=true npm --prefix web-console run smoke:artifacts-detail-selection` |
| Static UI gate | PASS；`node scripts/validate-frontend-ui.mjs` |
| Build | PASS；`npm --prefix web-console run build` |
| Authority boundary | unchanged；不刷新 full release authority |
| Next | P9 继续 artifact raw JSON/audit receipt 文本裁切治理；P6 继续 QA citation 真实样本覆盖；P11 维持 verifier 回归 |

## 2026-07-05 最新状态：P9/P10 Artifacts raw download audit receipt readability

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Frontend readability | IMPLEMENTED；`扎克伯格 / Current thread mapped role` |
| Security boundary | REVIEWED；`奥特曼 / Current thread mapped role` |
| Raw download audit receipt | IMPLEMENTED；success/fallback title/description/action 可换行、可断词 |
| Frontend smoke | PASS；`CI=true npm --prefix web-console run smoke:artifacts-detail-selection` |
| Static UI gate | PASS；`node scripts/validate-frontend-ui.mjs` |
| Build | PASS；`npm --prefix web-console run build` |
| Authority boundary | unchanged；不刷新 full release authority |
| Next | P9 继续 artifact raw JSON 文本裁切治理；P6 继续 QA citation 真实样本覆盖；P11 维持 verifier 回归 |

## 2026-07-05 最新状态：P9/P10 Artifacts raw JSON readability

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Frontend readability | IMPLEMENTED；`扎克伯格 / Current thread mapped role` |
| Security boundary | REVIEWED；`奥特曼 / Current thread mapped role` |
| Redacted raw JSON | IMPLEMENTED；summary/pre 可换行、可断词，展开后无横向溢出 |
| Frontend smoke | PASS；`CI=true npm --prefix web-console run smoke:artifacts-detail-selection` |
| Static UI gate | PASS；`node scripts/validate-frontend-ui.mjs` |
| Build | PASS；`npm --prefix web-console run build` |
| Authority boundary | unchanged；不刷新 full release authority |
| Next | P9 继续其他核心页面可读性；P6 继续 QA citation 真实样本覆盖；P11 维持 verifier 回归 |

## 2026-07-05 最新状态：P9 App Shell long topbar copy wrap

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Frontend | IMPLEMENTED；`扎克伯格 / Current thread mapped role` |
| Product experience | VERIFIED；`雷军 / Current thread mapped role` |
| Topbar readability | PASS；长标题/说明可换行，不再 ellipsis 隐藏 |
| Mobile 320px | PASS；长标题场景无横向溢出 |
| Frontend checks | PASS；`validate-frontend-ui`、build、`smoke:app-shell-ui` |
| Authority boundary | unchanged；不刷新 full release authority |
| Next | P9 继续页面内部卡片/表格/按钮文本裁切治理；P6 继续 report citation 真实样本 |

## 2026-07-05 最新状态：P9 ProjectDetail next action checks wrap

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Frontend | IMPLEMENTED；`扎克伯格 / Current thread mapped role` |
| Product experience | VERIFIED；`雷军 / Current thread mapped role` |
| Check readability | PASS；label/value 不再 `nowrap + ellipsis` |
| Mobile 320px | PASS；6 个 next-action 分支无横向溢出 |
| Frontend checks | PASS；`smoke:p9-main-path-recoverable-error-states-batch4a`、`validate-frontend-ui`、build |
| Authority boundary | unchanged；不刷新 full release authority |
| Next | P9 继续表格、证据卡、按钮文本裁切治理；P6 继续 report citation 真实样本 |

## 2026-07-05 最新状态：P6 Code QA inline bullet claim split

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Data/AI claim coverage | IMPLEMENTED；`梁文峰 / Current thread mapped role` |
| Claim split | IMPLEMENTED；citation block 后 inline bullet 作为 claim 边界 |
| Multi-fact audit | PASS；`[C1] -` 后未引用事实标记为 UNCITED |
| Backend tests | PASS；`mvn -Dtest=CodeQaControllerTest test` |
| Test result | PASS；35 tests，0 failures，0 errors |
| Authority boundary | unchanged；不刷新 full release authority |
| Next | P6 继续 QA citation 真实样本覆盖；P9 继续核心页面 UI；P11 维持 verifier 回归 |

## 2026-07-05 最新状态：P6 Code QA inline numbered claim split

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Data/AI claim coverage | IMPLEMENTED；`梁文峰 / Current thread mapped role` |
| Claim split | IMPLEMENTED；citation block 后同一行编号项作为 claim 边界 |
| Multi-fact audit | PASS；`[C1] 2.` 后未引用事实标记为 UNCITED |
| Backend tests | PASS；`mvn -Dtest=CodeQaControllerTest test` |
| Test result | PASS；34 tests，0 failures，0 errors |
| Authority boundary | unchanged；不刷新 full release authority |
| Next | P6 继续 QA citation 真实样本覆盖；P9 继续核心页面 UI；P11 维持 verifier 回归 |

## 2026-07-05 最新状态：P6 Code QA semicolon claim split

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Data/AI claim coverage | IMPLEMENTED；`梁文峰 / Current thread mapped role` |
| Claim split | IMPLEMENTED；中文/英文分号作为 claim 边界 |
| Multi-fact audit | PASS；`[C1];` 后未引用事实标记为 UNCITED |
| Backend tests | PASS；`mvn -Dtest=CodeQaControllerTest test` |
| Test result | PASS；33 tests，0 failures，0 errors |
| Authority boundary | unchanged；不刷新 full release authority |
| Next | P6 继续 QA citation 真实样本覆盖；P9 继续核心页面 UI；P11 维持 verifier 回归 |

## 2026-07-05 最新状态：P6 Code QA retry combined citation enforcement

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Data/AI citation trust | VERIFIED；`梁文峰 / Current thread mapped role` |
| Quality gate | IMPLEMENTED；`达里奥 / Maven focused tests` |
| Retry path | COVERED；首轮无 citation 后，二轮 `【C1，C2】` 进入 `RETRY_VERIFIED` |
| Coverage consistency | PASS；两个 answer citations cited，citation coverage FULL，claim coverage READY |
| Backend tests | PASS；`mvn -Dtest=CodeQaControllerTest test` |
| Test result | PASS；29 tests，0 failures，0 errors |
| Authority boundary | unchanged；不刷新 full release authority |
| Next | P6 继续 QA citation 真实样本覆盖；P9 继续核心页面 UI；P11 维持 verifier 回归 |

## 2026-07-05 最新状态：P6 Code QA paired citation bracket enforcement

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Data/AI citation trust | IMPLEMENTED；`梁文峰 / Current thread mapped role` |
| Parser boundary | IMPLEMENTED；`[C1]` / `【C1】` 有效，`[C1】` / `【C1]` 无效 |
| Example filtering | IMPLEMENTED；citation example 过滤同样要求成对 bracket |
| Backend tests | PASS；`mvn -Dtest=CodeQaControllerTest test` |
| Test result | PASS；30 tests，0 failures，0 errors |
| Authority boundary | unchanged；不刷新 full release authority |
| Next | P6 继续 QA citation 真实样本覆盖；P9 继续核心页面 UI；P11 维持 verifier 回归 |

## 2026-07-05 最新状态：P6 Code QA retry prompt citation format contract

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Data/AI citation trust | IMPLEMENTED；`梁文峰 / Current thread mapped role` |
| Retry prompt | IMPLEMENTED；明确成对 bracket 规则 |
| Prompt examples | IMPLEMENTED；有效 `[C1]` / `【C1】`，无效 `[C1】` / `【C1]` |
| Backend tests | PASS；`mvn -Dtest=CodeQaControllerTest test` |
| Test result | PASS；30 tests，0 failures，0 errors |
| Authority boundary | unchanged；不刷新 full release authority |
| Next | P6 继续 QA citation 真实样本覆盖；P9 继续核心页面 UI；P11 维持 verifier 回归 |

## 2026-07-05 最新状态：P6 Code QA claim split preserves file paths

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Data/AI claim coverage | IMPLEMENTED；`梁文峰 / Current thread mapped role` |
| Claim split | IMPLEMENTED；英文句号仅在后接空白或行尾时切分 |
| File path audit | PASS；`src/AuthService.java validates ... [C1].` 保持单 claim |
| Backend tests | PASS；`mvn -Dtest=CodeQaControllerTest test` |
| Test result | PASS；31 tests，0 failures，0 errors |
| Authority boundary | unchanged；不刷新 full release authority |
| Next | P6 继续 QA citation 真实样本覆盖；P9 继续核心页面 UI；P11 维持 verifier 回归 |

## 2026-07-05 最新状态：P6 Code QA invalid citation range strictness

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Data/AI citation trust | IMPLEMENTED；`梁文峰 / Current thread mapped role` |
| Range parser | IMPLEMENTED；valid range 展开，invalid range 不降级为普通 token |
| Negative case | PASS；`[C2-C1]` 不会标记 C1/C2 cited |
| Backend tests | PASS；`mvn -Dtest=CodeQaControllerTest test` |
| Test result | PASS；32 tests，0 failures，0 errors |
| Authority boundary | unchanged；不刷新 full release authority |
| Next | P6 继续 QA citation 真实样本覆盖；P9 继续核心页面 UI；P11 维持 verifier 回归 |

## 2026-07-05 最新状态：P6 Code QA Unicode range and plus bullet claim audit

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Data/AI review | ACCEPTED；`梁文峰 / Carver / 019f2e92-ca24-7150-b461-c4e65df34564` |
| Citation parser | IMPLEMENTED；Unicode dash range supported，reversed Unicode dash range fail-closed |
| Claim split | IMPLEMENTED；citation 后 `+` bullet 拆为独立 claim |
| Backend tests | PASS；`mvn -Dtest=CodeQaControllerTest test` |
| Test result | PASS；37 tests，0 failures，0 errors |
| Authority boundary | unchanged；不刷新 full release authority |
| Next | P6 继续 QA citation 真实样本覆盖；P9 继续核心页面 UI；P11 维持 verifier 回归 |

## 2026-07-05 最新状态：P6 code_chunks frontend intent and source diversity

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Data/AI review | ACCEPTED；`梁文峰 / Linnaeus / 019f2e98-3a17-7a11-a059-1fb3ce869554` |
| Frontend intent | IMPLEMENTED；中文/英文前端页面组件问题返回 `FRONTEND` |
| Candidate pool | IMPLEMENTED；`CodeChunkService` 支持前端 role intent 补池 |
| Role diversity | IMPLEMENTED；`CodeQaRetrievalService` top context diversity 纳入 `SOURCE` |
| Backend tests | PASS；`mvn -Dtest=CodeChunkServiceTest,CodeQaRetrievalServiceTest test` |
| Test result | PASS；88 tests，0 failures，0 errors |
| Authority boundary | unchanged；不刷新 full release authority |
| Next | P6 继续 report evidence anchor 与真实 QA 样本覆盖；P9 继续核心页面 UI；P11 维持 verifier 回归 |

## 2026-07-05 最新状态：P6 report evidence anchor range and handler order

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Data/AI review | ACCEPTED；`梁文峰 / Lagrange / 019f2e9d-571d-7491-b98c-caa4e8561641` |
| Handler anchor | IMPLEMENTED；`handler_method` 在 `handler_class` 前也能形成 method anchor |
| Line range anchor | IMPLEMENTED；`evidenceRef.lineNumber=85-120` 与 chunk 行区间重叠时保持 `REPORT_LINE_ANCHOR` |
| Source evidence role | IMPLEMENTED；范围命中的 chunk 保持 `PRIMARY` 和 `coverageScope=PRIMARY` |
| Backend tests | PASS；`mvn -Dtest=CodeChunkServiceTest,CodeQaControllerTest test` |
| Test result | PASS；102 tests，0 failures，0 errors |
| Authority boundary | unchanged；不刷新 full release authority |
| Next | P6 继续真实 QA 样本 citation 覆盖；P9 继续核心页面 UI；P11 维持 verifier 回归 |

## 2026-07-05 最新状态：P6 Code QA evidenceRef startLine/endLine anchors

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| QA review | ACCEPTED；`拉里佩奇 / Rawls / 019f2ea5-1e4d-7c71-805d-2c0742f98ff0` |
| API contract | IMPLEMENTED；`evidenceRef.startLine/endLine` documented and gate checked |
| Snake case compatibility | IMPLEMENTED；`start_line/end_line` via `@JsonAlias` |
| Line anchor fallback | IMPLEMENTED；invalid `lineNumber` falls back to start/end; valid `lineNumber` remains priority |
| Frontend bridge | IMPLEMENTED；ProjectDetail keeps and displays derived start/end line labels |
| Verification | PASS；`CodeQaControllerTest` 41 tests, `make api-design-check`, `npm run build` |
| Authority boundary | unchanged；不刷新 full release authority |
| Next | P6 继续真实报告样本 citation 覆盖；P9 继续核心页面 UI；P11 维持 verifier 回归 |

## 2026-07-05 最新状态：P6/P9 report evidence start/end QA deeplink

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Frontend/QA review | ACCEPTED；`扎克伯格 + 拉里佩奇 / Boyle / 019f2eb0-025a-7910-a866-81fb0ff2b7b2` |
| ScanTaskDetail evidence | IMPLEMENTED；risk/API evidence reads start/end line fields |
| QA deep link | IMPLEMENTED；writes `evidenceStartLine/evidenceEndLine` |
| ProjectDetail parser | IMPLEMENTED；restores URL params to `evidenceRef.startLine/endLine` |
| Smoke coverage | PASS；QA request and response bind start/end across report evidence drawer flow |
| Verification | PASS；frontend build and `smoke:report-evidence-drawer` |
| Authority boundary | unchanged；不刷新 full release authority |
| Next | P6 继续真实报告样本 citation 覆盖；P9 可补 QA 页区间显示优先级；P11 维持 verifier 回归 |

## 2026-07-05 最新状态：P6/P9 report evidence start/end-only QA smoke

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| QA gate | PASS；`达里奥 / focused frontend build + Playwright smoke` |
| Fixture boundary | IMPLEMENTED；primary report risk/API evidence no longer provides legacy `line_number` |
| Request contract | IMPLEMENTED；QA request preserves `startLine=24` / `endLine=42` and does not synthesize `lineNumber` |
| Response contract | IMPLEMENTED；QA response `sourceEvidenceRef` preserves start/end-only evidence |
| Smoke marker | PASS；`lineNumber=null`、`lineRange=24-42`、`startLine=24`、`endLine=42` |
| Verification | PASS；frontend build and `smoke:report-evidence-drawer` 2 tests |
| Authority boundary | unchanged；不刷新 full release authority |
| Next | P6 继续真实 public repo/backend start/end-only sample；P9 可补 QA 页区间显示优先级；P11 下一次 release evidence 吸收 marker |

## 2026-07-05 最新状态：P6/P11 backend source URL start/end-only QA contract

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| QA gate | PASS；`达里奥 / mvn -Dtest=CodeQaControllerTest test` |
| Source URL boundary | IMPLEMENTED；full Vite source URL keeps matching normalized chunk path |
| Request contract | IMPLEMENTED；request uses `start_line=245` / `end_line=250` without `lineNumber` |
| Response contract | IMPLEMENTED；response omits `sourceEvidenceRef.lineNumber` and preserves `startLine/endLine` |
| Anchor result | PASS；`sourceEvidenceMatchType=REPORT_LINE_ANCHOR` and retrieved chunk is PRIMARY |
| Verification | PASS；`CodeQaControllerTest` 42 tests |
| Authority boundary | unchanged；不刷新 full release authority |
| Next | P6 继续 public repo live sample；P9 可补 QA 页区间显示优先级；P11 下一次 release evidence 吸收 marker |

## 2026-07-05 最新状态：P6/P11 public repo UI start/end-only release marker

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| QA gate | PASS；`达里奥 / release verifier + security regression` |
| Public repo UI marker | IMPLEMENTED；`qaFromEvidence.startEndOnlyEvidenceRef` |
| Verifier gate | IMPLEMENTED；requires no legacy lineNumber, `REPORT_LINE_ANCHOR`, PRIMARY and `coverageScopes=PRIMARY` |
| Forgery checks | PASS；missing / legacy line / file-anchor / primary-unbound forged markers rejected |
| Verification | PASS；bash syntax, frontend build, `release-verifier-public-repo-ui-marker` suite |
| Authority boundary | unchanged；不刷新 full release authority |
| Next | P11 下一次生成 full release evidence package 吸收 marker；P9 可继续 QA 页区间显示优先级 |

## 2026-07-05 最新状态：P11/P6 public repo UI start/end-only focused evidence

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| QA gate | PASS；`达里奥 / release verifier` |
| Stable runtime | DONE；后端已切到 `.sourcelens-runtime/backend` jar 运行态 |
| Evidence package | CREATED；`release-evidence/public-repo-ui-start-end-only-20260705-042402` |
| Public repo smoke | PASS；`public-repo-smoke` OK，0 required failures，0 optional warnings |
| Start/end-only marker | PASS；request/response 无 legacy `lineNumber`，`REPORT_LINE_ANCHOR`，PRIMARY，current scan bound |
| Verifier | PASS；`./scripts/verify-release-evidence.sh release-evidence/public-repo-ui-start-end-only-20260705-042402` |
| Authority boundary | unchanged；focused evidence only，不刷新 full release authority |
| Next | P9 可继续 QA 页区间显示优先级；P6 继续 report citation 真实样本质量；P11 后续 full package 再吸收所有 focused gates |

## 2026-07-05 最新状态：P9/P6 QA evidence range display priority

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Frontend | DONE；`扎克伯格 / Current thread` |
| QA review | ACCEPTED；`拉里佩奇 / Nash / 019f2ed4-8fa8-7611-bde6-69638d108146` |
| Display model | IMPLEMENTED；`evidenceLineInfo` 优先 `startLine/endLine` |
| Legacy fallback | KEPT；缺少结构化范围时仍可显示 `lineNumber` |
| Conflict proof | PASS；`evidenceLine=999` 不覆盖 `evidenceStartLine=24/evidenceEndLine=42` |
| Smoke marker | PASS；`qaFromEvidence.evidenceLineRangePriority.status=OK` |
| Verification | PASS；frontend build and `smoke:report-evidence-drawer` |
| Authority boundary | unchanged；focused UI gate only，不刷新 full release authority |
| Next | P11 已在后续切片将 `evidenceLineRangePriority` 吸收到 release verifier；P6 继续真实 report citation 覆盖 |

## 2026-07-05 最新状态：P11 QA evidence range priority release gate

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| QA gate | PASS；`达里奥 / bash syntax + focused security regression + Playwright smoke` |
| Security gate | PASS；`奥特曼 / existing forged regression gate` |
| Verifier contract | IMPLEMENTED；`qaFromEvidence.evidenceLineRangePriority` is required |
| Structured range priority | ENFORCED；`visibleRanges=["24-42"]` |
| Legacy conflict proof | ENFORCED；`conflictLegacyLineNumbers=["999"]` and `legacyLineHidden=true` |
| Viewport coverage | ENFORCED；desktop plus `mobile390Covered` and `narrow320Covered` |
| Forgery checks | PASS；missing / false / wrong range / missing viewport / overflow / raw field rejected |
| Verification | PASS；bash syntax, `release-verifier-report-evidence-marker`, `smoke:report-evidence-drawer` |
| Authority boundary | unchanged；focused release verifier gate only，不刷新 full release authority |
| Next | P11 下一次 full release evidence package 吸收当前 schema；P6 继续真实 report citation 覆盖 |

## 2026-07-05 最新状态：P11 deep evidence card readability release gate

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Frontend contract | ACCEPTED；`扎克伯格 / existing report evidence smoke marker` |
| QA gate | PASS；`达里奥 / bash syntax + focused security regression + Playwright smoke` |
| Verifier contract | IMPLEMENTED；`qaFromEvidence.deepEvidenceCardReadability` is required |
| Source receipt readability | ENFORCED；ready/review visible, contained, wraps, not clipped, structured range visible |
| Source location confidence readability | ENFORCED；ready/review contained, metrics not clipped, checks wrap |
| Source file match release readability | ENFORCED；ready/review contained, target/cited/checks not clipped, no repair on review |
| Forgery checks | PASS；missing / clipped / range hidden / review repair visible / overflow / provider claim / raw field rejected |
| Verification | PASS；bash syntax, `release-verifier-report-evidence-marker`, `smoke:report-evidence-drawer` |
| Focused package | PASS；`release-evidence/report-deep-evidence-readability-20260705-050224` generated and verified；`required_failures=0`、`optional_warnings=0`、`skipped=22` |
| Authority boundary | unchanged；focused release evidence only，不刷新 full release authority |
| Next | P6 继续真实 report citation 覆盖；P9 继续页面视觉密度治理；后续完整发布前刷新 full release authority |

## 2026-07-07 最新状态：P11 release verifier public repo marker timeout closure

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Security review | PASS；`奥特曼 / Russell / 019f3839-94fb-7421-8aea-8623455987e0` |
| Timeout model | IMPLEMENTED；Node fallback detached process group |
| Kill behavior | IMPLEMENTED；timeout 后 group SIGTERM，再 group SIGKILL，保留 child fallback |
| Fail-closed | KEPT；timeout exit code `124` 不会被当作成功 |
| Focused gate | PASS；`release-verifier-public-repo-marker` verbose/silent 均通过 |
| Residual process check | PASS；结束后无相关 security regression / verifier / public repo probe 进程 |
| Remaining observation | suite runtime 约 4 分钟，后续 P11 可拆分或补 timeout branch micro-test |
| Authority boundary | unchanged；不刷新 full release authority |
| Next | P6 阶段验收收口，或进入 P9 前端主链路体验 |

## 2026-07-07 最新状态：P6 stage close

| Item | Status |
| --- | --- |
| Stage | ACCEPTED；P6 第一阶段收口 |
| Authority | PARTIAL；使用 current full authority baseline + 7/7 focused P6 evidence |
| Delivery | DONE；`特朗普 / Current thread` |
| QA review | PARTIAL -> ACCEPTED；`拉里佩奇 / Ohm / 019f3844-3034-7373-b398-71a55ebdcf31` |
| Focused evidence | PASS；`p6-public-repo-code-qa-20260707-000013` verified |
| Fixed eval | PASS；20 required retrieval cases |
| Marker gate | PASS；`release-verifier-public-repo-marker` real `266.85s` |
| Code map | PASS；`files=580 routes=89 frontendApiCalls=79` |
| Backend | UP；`http://127.0.0.1:8080/actuator/health` |
| Next | P9 UI 主链路体验；P11 marker suite runtime cost 优化 |

## 2026-07-07 最新状态：P9 app shell topbar auxiliary responsive contract

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Frontend review | PARTIAL -> PASS；`扎克伯格 / Confucius -> Turing / 019f3852-c9e6-7031-920d-e9e4f50bf4c7` |
| Desktop topbar | GREEN；env/ports/username 可见且不裁切 |
| Mobile topbar | GREEN；env/ports/username 在 320px 折叠，user button 保持紧凑 |
| Static gate | PASS；`validate-frontend-ui.mjs` |
| Build | PASS；`cd web-console && npm run build` |
| Smoke | PASS；`smoke:app-shell-ui` 覆盖 13 routes × 3 viewports |
| Authority boundary | unchanged；focused P9 gate only，不刷新 full release authority |
| Next | P9 报告/QA 体验；P11 marker runtime cost |

## 2026-07-07 最新状态：P9 report evidence repair gate reason visibility

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Frontend review | PARTIAL -> PASS；`扎克伯格 / Hypatia / 019f385c-3a1d-7ad0-90e1-b29bc22ba8d9` |
| READY gate | GREEN；显示修复门禁已开放和开放条件 |
| GAP gate | GREEN；显示修复门禁未开放和 code_chunks 主证据缺口 |
| Static gate | PASS；`validate-frontend-ui.mjs` |
| Build | PASS；`cd web-console && npm run build` |
| Smoke | PASS；`smoke:report-evidence-drawer`，`readyRepairActionEnabled=true`，`repairGateReasonVisible=true` |
| Authority boundary | unchanged；focused P9 gate only，不刷新 full release authority |
| Next | 继续 P9/P11 |

## 2026-07-07 最新状态：P11 security regression Node fallback timeout micro-probe

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| DevOps review | PASS；`黄仁勋 / Kepler / 019f3867-30d7-7c41-8ba7-6984b3d6b346` |
| Default timeout path | GREEN；默认仍优先 `timeout/gtimeout` |
| Forced Node fallback | GREEN；`SOURCELENS_SECURITY_REGRESSION_FORCE_NODE_TIMEOUT=true` 显式启用 |
| Internal timeout probe | GREEN；1s timeout fail-closed，检查 nested child cleanup |
| Syntax | PASS；`bash -n scripts/security-regression-check.sh` |
| Integration drill | PASS；`security-regression-check.sh --suite integration-drill` |
| Static | PASS；`security-regression-check.sh --suite static` |
| Authority boundary | unchanged；focused P11 gate only，不刷新 full release authority |
| Next | 继续 public repo marker runtime cost |

## 2026-07-07 最新状态：P11 public repo marker shared base fixture

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| DevOps review | PARTIAL；`黄仁勋 / Helmholtz / 019f3874-2f8d-7733-adc8-1e2cad1a1bf9` |
| Base fixture reuse | GREEN；public repo marker 三个负例共用 verified required-failure fixture 副本 |
| Mutation coverage | KEPT；未删减 public repo marker mutation 矩阵 |
| Syntax | PASS；`bash -n scripts/security-regression-check.sh` |
| Focused gate | PASS；`release-verifier-public-repo-marker` |
| Runtime observation | STILL HIGH；`real 4:14.81` |
| Remaining bottleneck | 大量 `verify-release-evidence.sh` 子进程逐个启动 |
| Authority boundary | unchanged；focused P11 gate only，不刷新 full release authority |
| Next | batch verifier / marker-only batch validation |

## 2026-07-07 最新状态：P11 public repo marker batch validation

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| DevOps review | PASS；`黄仁勋 / Locke / 019f3880-7834-7e91-9bc1-1d07f8760f02` |
| Validator authority | GREEN；batch runner 动态复用 `verify-release-evidence.sh` public repo marker validator |
| Mutation coverage | GREEN；high-frequency mutation batch 化，未删减覆盖矩阵 |
| Full verifier wiring | GREEN；保留 shared base fixture 和完整 verifier valid marker proof |
| Focused gate | PASS；`release-verifier-public-repo-marker` |
| Runtime | GREEN；`40.556s total`，DevOps 复核实测 `39.789s` |
| Integration drill | PASS |
| Residual process check | PASS；未发现 verifier/security regression 残留进程 |
| Authority boundary | unchanged；focused P11 gate only，不刷新 full release authority |
| Next | P6 final evidence refresh 或 P9 主链路 UI |

## 2026-07-07 最新状态：P6 final focused public repo evidence refresh

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Data-AI review | PASS；`梁文峰 / Faraday / 019f3891-0e2b-7900-bed7-13111732d11b` |
| Evidence package | GREEN；`release-evidence/p6-final-public-repo-code-qa-20260707-0153` |
| Backend runtime | GREEN；stable jar `http://127.0.0.1:19082` |
| Public repo smoke | GREEN；`required_failures=0`，`optional_warnings=0` |
| Verifier | PASS；`verify-release-evidence.sh` |
| Weak keyword eval | GREEN；`status=OK`，`SEMANTIC_FALLBACK=4`，case `scanTaskId=287` |
| Semantic probe | GREEN；`status=OK` |
| Report evidence QA citation | GREEN；`status=OK`，`sampleCount=4`，mixed line/start-end，narrative bound |
| Code QA citation | GREEN；claim `READY`，cross-file summary satisfied |
| Marker security regression | PASS；`release-verifier-public-repo-marker` |
| Authority boundary | focused P6 authority only；不刷新 full release authority，不含 public repo UI smoke |
| Next | 等 Data-AI review；随后转 P9 主链路 UI |

## 2026-07-07 最新状态：P9 dashboard command disabled reason visibility

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Frontend review | PASS；`扎克伯格 / Avicenna / 019f3899-0958-7eb2-a037-c603b4d170fa` |
| Dashboard command disabled reason | GREEN；QA/AutoRepair blocked action 显示可见原因 |
| CSS readability | GREEN；reason、label、value 可换行、不省略、不隐藏 |
| Smoke branches | GREEN；异常、空仓库、运行中、无成功扫描、code_chunks=0、风险、QA ready |
| Viewports | GREEN；`1440x900`、`390x844`、`320x740` |
| Static UI gate | PASS；`validate-frontend-ui.mjs` |
| Frontend build | PASS |
| Focused smoke | PASS；`smoke:dashboard-next-action` |
| Authority boundary | focused P9 gate only；不代表全站 disabled action 或 full release authority |
| Next | 继续 P9 核心页面 blocked action / 状态面可见性治理 |

## 2026-07-07 最新状态：P9 Project QA Agent handoff gate reason visibility

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Frontend review | PASS；`扎克伯格 / Newton / 019f38a2-039f-72d1-8da8-67af66d939e3` |
| ProjectDetail CodeUnderstandingLens | GREEN；新增 `Agent 交接门禁说明` |
| READY gate | GREEN；显示门禁已开放和开放条件 |
| Blocked gate | GREEN；stale scan / context-only 显示独立阻断原因 |
| CSS readability | GREEN；门禁说明可换行、不省略、不隐藏 |
| Smoke branches | GREEN；READY、stale scan、context-only、recoverable search/QA |
| Viewports | GREEN；`1440x900`、`390x844`、`320x740` |
| Static UI gate | PASS；`validate-frontend-ui.mjs` |
| Frontend build | PASS |
| Focused smoke | PASS；`smoke:project-qa-recoverable` |
| Authority boundary | focused P9 gate only；不自动创建 AgentTask，不代表全站 Agent handoff 或 full release authority |
| Next | 继续 ScanTaskDetail / AuditLogs / AgentTasks blocked action 与状态面治理 |

## 2026-07-07 最新状态：P9 ScanTaskDetail code knowledge gate reason visibility

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Frontend review | PASS；`扎克伯格 / Hilbert / 019f38ae-37f7-73f3-b1c1-0e4ebead24f6` |
| ScanTaskDetail CodeKnowledgePanel | GREEN；新增 `代码知识库操作门禁说明` |
| READY gate | GREEN；显示门禁已开放、code_chunks 数量、召回模式和下一步 |
| Blocked gate | GREEN；error / zero-chunk 显示独立阻断原因 |
| CSS readability | GREEN；门禁说明和 code knowledge grid 均可换行、不省略、不隐藏 |
| Smoke branches | GREEN；code_chunks error -> retry ready，governance retry 同时保持 |
| Viewports | GREEN；`1440x900`、`390x740`、`320x740` |
| Static UI gate | PASS；`validate-frontend-ui.mjs` |
| Frontend build | PASS |
| Focused smoke | PASS；`smoke:p9-main-path-recoverable-error-states-batch4a` |
| Authority boundary | focused P9 gate only；不代表全站 disabled action、真实 provider 质量或 full release authority |
| Next | 继续 ScanTaskDetail remaining disabled action / status surface治理 |

## 2026-07-07 最新状态：P9 ScanTaskDetail priority repair gate reason visibility

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Frontend review | PASS；`扎克伯格 / Bohr / 019f38bb-2e0d-7b92-ae46-96a1e8574c39` |
| ReportEvidencePriorityRail | GREEN；三张 card 显示 `修复门禁说明` |
| READY gate | GREEN；首要风险证据显示门禁已开放和文件级风险证据原因 |
| BLOCKED gate | GREEN；引用预检/治理闭环显示门禁未开放，并明确不等同/不替代文件级修复证据 |
| CSS readability | GREEN；repair gate 和 priority card 文本可换行、不省略、不隐藏 |
| Static UI gate | PASS；`validate-frontend-ui.mjs` |
| Frontend build | PASS |
| Focused smoke | PASS；`smoke:report-evidence-drawer` |
| Authority boundary | focused P9/P10 gate only；不改变 AutoRepair 后端，不证明 patch 质量或 full release authority |
| Next | 继续 ScanTaskDetail ReportTraceMap / ReportRecommendedStep 或 AuditLogs / AgentTasks 状态面治理 |

## 2026-07-07 最新状态：P9 ScanTaskDetail recommended action gate reason visibility

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Frontend review | PASS；`扎克伯格 / Schrodinger / 019f38c8-96e2-7302-a7b9-9212c30b8719` |
| ReportRecommendedNextStep | GREEN；新增 `报告推荐动作门禁说明` |
| Branch reasons | GREEN；failed/running/file-bound repair/project-risk/evidence-gap/code_chunks-gap/QA-ready 分支均有 actionGateReason |
| CSS readability | GREEN；推荐动作门禁说明可换行、不省略、不隐藏，移动端单列安全 |
| Static UI gate | PASS；`validate-frontend-ui.mjs` |
| Frontend build | PASS |
| Focused smoke | PASS；`smoke:report-evidence-drawer` |
| Authority boundary | focused P9/P10 gate only；不改变后端 scan/report/QA/AutoRepair，不证明 patch 质量或 full release authority |
| Next | 继续 ScanTaskDetail ReportTraceMap / AuditLogs / AgentTasks 状态面治理 |

## 2026-07-07 最新状态：P9 ScanTaskDetail trace map action gate reason visibility

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Frontend review | PASS；`扎克伯格 / Dewey / 019f38d2-3e15-7fd1-9b38-4ae1ca721c88`，首轮 PARTIAL 后二轮 PASS |
| ReportTraceMap | GREEN；五张 trace card 新增 `追踪动作门禁说明` |
| Branch reasons | GREEN；质量风险/API/数据模型/依赖图谱/产物证据均有 actionGateReason |
| CSS readability | GREEN；trace gate 文本可换行、不省略、不隐藏 |
| Static UI gate | PASS；`validate-frontend-ui.mjs` |
| Frontend build | PASS |
| Focused smoke | PASS；`smoke:report-evidence-drawer` |
| Authority boundary | focused P9/P10 gate only；不改变报告解析、artifact schema、QA、AutoRepair 或治理时间线 |
| Next | 继续 AuditLogs / AgentTasks / ReportGovernanceTimeline 状态面治理 |

## 2026-07-07 最新状态：P9/P10/P11 AuditLogs decision gate scope and source-health truthfulness

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Frontend review | PASS after PARTIAL；`扎克伯格 / Ramanujan / 019f38de-ac82-7693-9c94-d81dac61bc7d` |
| AuditLogs decision gate | GREEN；新增 `审计判定门禁说明`，显示 READY / REVIEW / BLOCKED |
| Manual filter scope | GREEN；submitted audit/tool/delivery filters 进入 REVIEW；smoke 覆盖 audit action filter |
| Pagination scope | GREEN；`total > visible` 进入 REVIEW |
| Source failure | GREEN；源错误和 deep link miss 进入 BLOCKED |
| Cockpit status | GREEN；移除静态 `审计链路在线`，改为动态 source health 文案 |
| CSS readability | GREEN；decision gate 和证据格可换行、不省略、不隐藏 |
| Static UI gate | PASS；`validate-frontend-ui.mjs` |
| Frontend build | PASS |
| Focused smoke | PASS；`smoke:audit-logs-detail-selection` 7 tests |
| Authority boundary | focused P9/P10/P11 gate only；不改变后端审计 API，不证明全局安全裁判或 full release authority |
| Next | 继续 AgentTasks / ReportGovernanceTimeline / AuditLogs 剩余状态面治理 |

## 2026-07-07 最新状态：P9/P10/P11 AgentTasks action gate reason visibility

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Frontend review | PASS；`扎克伯格 / Beauvoir / 019f38ef-f83d-7ff0-8dc5-614dc66df04d`，首轮 PASS 后补强 runtime coverage，二轮 PASS |
| AgentTasks action gate | GREEN；selected detail 新增 `Agent 任务动作门禁说明` |
| State coverage | GREEN；PENDING、RUNNING、终态有输出、终态缺输出、未知状态均有 gate reason |
| Raw payload safety | GREEN；任务 input/output 和 step output 仍默认隐藏，不渲染 raw JSON |
| CSS readability | GREEN；action gate reason 和 check grid 可换行、不省略、不裁切 |
| Static UI gate | PASS；`validate-frontend-ui.mjs` |
| Frontend build | PASS |
| Focused smoke | PASS；`smoke:agent-tasks-detail-selection` |
| Smoke marker | PASS；`runningGateVisible=true`、`terminalMissingOutputBlocked=true`、`unknownStatusBlocked=true`、`noHorizontalOverflow=true` |
| Authority boundary | focused P9/P10/P11 gate only；不改变后端 AgentTask 状态机、真实 worker 执行、AgentChat/AutoRepair 或 full release authority |
| Next | 继续 ReportGovernanceTimeline / AgentChat closure rail / ExecutionTasks 状态面治理 |

## 2026-07-07 最新状态：P9/P10/P11 ExecutionTasks action gate reason visibility

| Item | Status |
| --- | --- |
| Delivery | DONE；`特朗普 / Current thread` |
| Frontend review | PASS；`扎克伯格 / Rawls / 019f38fd-1a36-7f71-9b12-8b80d5e47f1e`，首轮 PASS 后补强 runtime coverage，二轮 PASS |
| ExecutionTasks action gate | GREEN；selected detail 新增 `执行任务动作门禁说明` |
| State coverage | GREEN；active、SUCCESS、FAILED with evidence、FAILED missing evidence、CANCELLED、unknown status 均有 gate reason |
| Log display safety | GREEN；LogViewer display redaction 继续证明常见 secret 不进入页面/marker |
| CSS readability | GREEN；action gate reason、check grid、详情证据、步骤和日志可换行、不省略、不裁切 |
| Static UI gate | PASS；`validate-frontend-ui.mjs` |
| Frontend build | PASS |
| Focused smoke | PASS；`smoke:execution-tasks-detail-selection` |
| Smoke marker | PASS；`successGateVisible=true`、`runningGateVisible=true`、`failedWithEvidenceReviewVisible=true`、`failedMissingEvidenceBlocked=true`、`cancelledGateVisible=true`、`unknownStatusBlocked=true`、`noHorizontalOverflow=true` |
| Authority boundary | focused P9/P10/P11 gate only；不改变后端 ExecutionTask 状态机、后端日志存储/API 脱敏、真实 worker 执行或 full release authority |
| Next | 继续 ReportGovernanceTimeline / AgentChat closure rail / CI diagnostics / PR review 状态面治理 |

## 2026-07-10 最新状态：P11/P9 Dashboard executive briefing release evidence gate

| Item | Status |
| --- | --- |
| Delivery | DONE；主 agent integration |
| DevOps | PASS after REJECT；`黄仁勋 / Leibniz / 019f4801-2d75-7aa1-ac6a-bf39fc85cc29` |
| QA | PASS after REJECT；`拉里佩奇 / Confucius / 019f4801-8e98-7422-9f15-5f805e7505ae` |
| Verifier | GREEN；7 cases x 5 viewports + executive briefing + five PNG checks |
| Inventory | GREEN；独立 executive evidence、viewport/visual coverage、complete/reason |
| Forgery regression | PASS；executive、viewport、screenshot 和 overclaim 负例 |
| Real smoke | PASS；五视口、35 visited cases、五张截图 |
| Current full authority | YELLOW；`release-current-schema-20260705-0610` 早于新 schema，尚未刷新 |
| Authority boundary | focused P11 gate only；不声明 full release/nightly authority 已更新 |
| Next | 刷新 full authority，随后继续 P9/P6/P10/P11 主线 |

## 2026-07-10 最新状态：P9 scan report route-plane handoff + P11 product-plane evidence contract

| Item | Status |
| --- | --- |
| Delivery | DONE；主 agent integration |
| Product/UX | PASS for slice selection；`雷军 / Einstein / 019f49ae-acf4-7641-a6fb-d9adf6a6da99` |
| Project management | PASS after two returns；`库克 / Pasteur / 019f49ae-ad73-75e2-affa-678ff41d5639` |
| Frontend | PASS after validator return；`扎克伯格 / Parfit / 019f49bc-a608-7b53-b2dc-094dc2e5385b` |
| QA | PASS；`拉里佩奇 / Planck / 019f49be-d93b-7b02-998a-988aca9413ba` |
| DevOps verifier | PASS；`黄仁勋 / Feynman / 019f49bf-971c-7783-bd59-7780f22a06f8` |
| DevOps inventory | PASS；`黄仁勋 / Huygens / 019f49c2-6d2a-7d32-97ac-5825cf1e90fe` |
| Quality gate | PASS after PARTIAL return；`达里奥 / Hegel / 019f49c6-efac-7a23-a5d8-6b26c2138eff` |
| Timed-out instances | CLOSED；`扎克伯格 / Anscombe / 019f49b2-dbcf-7202-b678-69e6c6d7d677`、`黄仁勋 / Kuhn / 019f49b6-eee8-7b73-808c-f3c800bb7796` |
| P9 focused status | GREEN；scan report route-plane handoff browser evidence complete |
| P11 focused status | GREEN；productPlaneMap producer/verifier/inventory/self-test/forgery contract complete |
| Current full authority | BLOCKED/YELLOW；历史包最新 verifier FAIL，首个失败 `productPlaneMap must be an object` |
| Next | 构建当前源码 stable jar，运行新的 `release` profile，verifier PASS 后更新 authority；随后继续 P9/P6/P10/P11 主线 |

## 2026-07-10 最新状态：P11 current full authority refresh + repair-readiness fail-closed hardening

| Item | Status |
| --- | --- |
| Current full authority | GREEN；`release-current-schema-20260710-114653` |
| Release profile | PASS；`required_failures=0`、`optional_warnings=0`、`skipped=5` |
| Independent verifier | PASS；checksum、public repo、Dashboard、报告证据、AgentChat、Phase12 baseline、sandbox 合同均通过 |
| Live public repo | PASS；真实仓库扫描、17,001 code_chunks、Code QA、报告引用、多视口 UI 和 cleanup 完成 |
| Repair readiness | GREEN；显式 `readyForRepair=true` 不再绕过 roleDistribution 与计数一致性校验 |
| Verifier hardening | GREEN；`REQUIRED_FULL` 派生字段严格校验；AgentChat linked task / handoff task 双 ID 合同严格校验 |
| QA | PASS after PARTIAL return；`拉里佩奇 / Plato / 019f4a19-48b0-7130-bade-0f8b06c218d6` |
| Diagnostic packages | `102254` required failures=3；`112054` 为中间 schema 诊断；不得作为 authority |
| Remaining boundary | P9/P6/P10/P11 主线未整体完成；5 个高级集成项继续按既定策略后置 |
| Next | 回到 P9/P6 主线增量；P10/P11 继续保持 fail-closed 与权威包回归 |

## 2026-07-10 最新状态：P9 逐用户持久化工作视角

| Item | Status |
| --- | --- |
| Delivery | DONE；主 agent integration |
| Product | PASS after BLOCK；`乔布斯 / Tesla / 019f4a7d-f5ef-74b1-9b6f-c83bec8a0db8` |
| Frontend | PASS after PARTIAL；`扎克伯格 / Volta / 019f4a7e-2605-7431-a26a-678762c44c7d` |
| QA | PASS after PARTIAL；`拉里佩奇 / Zeno / 019f4a7e-43d9-7400-94fd-479ec20526bb` |
| Product contract | GREEN；根入口恢复偏好，显式深链 URL 优先，Issue Decomposition 归开发工作台 |
| Preference boundary | GREEN；逐用户偏好键隔离、白名单/异常回退；明确不是 RBAC 或角色识别 |
| Responsive navigation | GREEN；五视口、展开/折叠 Sider、移动 Drawer、390 -> 1024 断点清理和折叠恢复 |
| Focused browser evidence | PASS；`smoke:work-perspective` 2 tests / 22.0s |
| Static/build | PASS；frontend UI validator、production build、diff check |
| Current full authority | UNCHANGED/GREEN；`release-current-schema-20260710-114653` |
| Remaining boundary | P9 整体、RBAC、服务端偏好、真实后端 E2E 未完成 |
| Next | 继续 ProjectDetail / ScanTaskDetail / AgentChat 首屏动作仲裁，或进入 P10 RBAC 前置设计 |
