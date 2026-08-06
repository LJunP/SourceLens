# SourceLens Agent Decision Register

> AIOS v2.3 状态：`APPEND-ONLY DECISION HISTORY`。旧 ADR 保留但可能被后续 AIOS ADR supersede。当前事实不存放在本文；事实源为 `aios/truth/project_state.yaml`。

> DEFAULT AGENT CONTEXT: `EXCLUDED`。只允许按当前 Task Contract 或明确 ADR 编号读取相关决策，不得整库注入规划上下文。

状态：持续追加。本文记录 SourceLens 多岗位协作中的关键产品、架构、安全和流程决策。它不是待办列表，而是防止后续开发反复推翻同一判断的决策台账。

## 记录规则

- 只有会影响后续开发方向、边界、验收或安全策略的判断才写入本文。
- 每条决策必须包含 owner、背景、结论、影响、证据和复审条件。
- 如果后续事实变化导致决策失效，应追加新决策，不直接删除历史决策。

## ADR-GOV-002：SourceLens 采用轻量日常流程 + 关键节点完整公司流程

Date：2026-07-04。
Owner：`库克` / Project Manager，`乔布斯` / Product Manager，`特朗普` / Delivery Owner。
Roles：`库克`、`乔布斯`、`奥特曼`、`黄仁勋`、`达里奥`、`特朗普`。
Status：Accepted。

Context：

- 用户确认希望 SourceLens 按真实公司方式管理，但担心每步都重流程会消耗过多算力和开发时间。
- 现有团队制度已经固定 `11 个核心角色 + 5 个按需专家池`，但还需要把风险、质量、发布、数据、raw access 和事故治理变成可执行制度。
- `Bohr / 019f2d4f-6383-7631-942d-1edda7f75551 = 库克 / Project Manager` 只读复核认为当前治理已覆盖组织、流程、文档、ADR 和 release evidence，但 raw access、evidence retention、灾备/回滚签署仍偏分散。

Decision：

- 新增 `SOURCELENS_OPERATING_SYSTEM.md` 作为虚拟公司操作系统总入口。
- 新增独立台账和制度：`RISK_REGISTER.md`、`QUALITY_SCORECARD.md`、`RELEASE_PROCESS.md`、`OBSERVABILITY_AND_INCIDENTS.md`、`DATA_GOVERNANCE.md`、`RAW_ACCESS_AND_EVIDENCE_RETENTION_POLICY.md`。
- 日常开发保持轻量：按风险启动少量子 agent、跑相关测试、只更新必要文档。
- 阶段启动、阶段收口、发布、安全/DB/API/任务状态机/raw access/evidence retention 变化必须走严格或完整流程。
- 继续遵守文档维护分级，避免公司级治理退化为机械日志和无节制算力消耗。

Impact：

- SourceLens 获得公司级研发治理基线：责任、风险、质量、数据、发布、事故和证据留存均有入口。
- 后续每个阶段都能用同一套制度判断是否可继续推进或必须打回。
- P12 真生产化前仍需补齐真实灾备恢复、回滚签署、生产可观测性和真实 provider/GitHub App E2E。

Evidence：

- `docs/SOURCELENS_OPERATING_SYSTEM.md`
- `docs/RISK_REGISTER.md`
- `docs/QUALITY_SCORECARD.md`
- `docs/RELEASE_PROCESS.md`
- `docs/OBSERVABILITY_AND_INCIDENTS.md`
- `docs/DATA_GOVERNANCE.md`
- `docs/RAW_ACCESS_AND_EVIDENCE_RETENTION_POLICY.md`
- `docs/PRODUCT_GOVERNANCE.md`
- `docs/AGENT_STATUS_BOARD.md`

Review trigger：

- 阶段流程变慢到明显阻碍开发。
- 发生 raw access、release evidence、数据删除、事故响应或交接失败。
- P12 从本地生产化收口进入真实生产部署候选。

## ADR-GOV-003：顶级公司标准下补齐 10 个强制专项制度

Date：2026-07-04。
Owner：`库克` / Project Manager，`乔布斯` / Product Manager，`特朗普` / Delivery Owner。
Roles：`库克`、`乔布斯`、`达里奥`、`特朗普`。
Status：Accepted。

Context：

- 用户明确要求 SourceLens 的公司制度按“超级顶级公司”标准补齐，不接受模棱两可的建议性回答。
- `Wegener / 019f2d5f-9d21-7f22-9705-384b298edfbb = 库克 / Project Manager` 只读复核结论 `PASS`：10 个待补制度必要，无硬命名冲突，但必须写清边界，避免与既有治理文档重复。

Decision：

- 新增 10 个强制制度文件：
  - `WORK_INTAKE_AND_BACKLOG.md`
  - `TEST_STRATEGY.md`
  - `FRONTEND_DESIGN_SYSTEM.md`
  - `THREAT_MODEL.md`
  - `PERFORMANCE_BENCHMARK.md`
  - `DEPENDENCY_AND_LICENSE_POLICY.md`
  - `DISASTER_RECOVERY_AND_ROLLBACK_SIGNOFF.md`
  - `ENGINEERING_STANDARDS.md`
  - `PRODUCT_METRICS_AND_FEEDBACK.md`
  - `COMPLIANCE_AND_PRIVACY.md`
- 这些文件是公司级制度，不替代已有事实源：阶段需求仍归 `PHASE_REQUIREMENTS.md`，活跃风险仍归 `RISK_REGISTER.md`，质量状态仍归 `QUALITY_SCORECARD.md`，安全红线仍归 `SECURITY_BOUNDARY.md`，发布 authority 仍归 `RELEASE_PROCESS.md` 与 release evidence。

Impact：

- SourceLens 的虚拟公司操作系统从“骨架完整”升级为“顶级公司制度层完整”。
- 后续 P6/P9/P10/P11/P12 每个阶段都有明确的 intake、测试、UI、安全、性能、供应链、灾备、工程、产品指标和合规制度入口。
- 这些制度不代表相关工程能力已经全部实现；它们定义必须执行和验收的标准。

Evidence：

- `docs/WORK_INTAKE_AND_BACKLOG.md`
- `docs/TEST_STRATEGY.md`
- `docs/FRONTEND_DESIGN_SYSTEM.md`
- `docs/THREAT_MODEL.md`
- `docs/PERFORMANCE_BENCHMARK.md`
- `docs/DEPENDENCY_AND_LICENSE_POLICY.md`
- `docs/DISASTER_RECOVERY_AND_ROLLBACK_SIGNOFF.md`
- `docs/ENGINEERING_STANDARDS.md`
- `docs/PRODUCT_METRICS_AND_FEEDBACK.md`
- `docs/COMPLIANCE_AND_PRIVACY.md`
- `docs/SOURCELENS_OPERATING_SYSTEM.md`
- `README.md`

Review trigger：

- 某个制度长期未被执行。
- 阶段收口时发现制度与实际流程冲突。
- P12 从本地生产化收口进入真实生产部署候选。

## ADR-GOV-001：文档维护采用实时/阶段/周期分级，不再机械每轮长日志

Date：2026-07-04。
Owner：`库克` / Project Manager，`乔布斯` / Product Manager，`特朗普` / Delivery Owner。
Roles：`库克`、`乔布斯`、`特朗普`。
Status：Accepted。

Context：

- SourceLens 的文档体系已经覆盖计划、代码地图、结构审计、阶段需求、状态看板、活动日志、进度日志和交接文档。
- 继续要求所有文档“每轮都实时长篇更新”会消耗过多开发时间和上下文预算，并制造重复日志。
- 用户明确要求：文件和信息需要有人维护，但维护目标是让项目闭环、干净、对齐，而不是机械开发或机械记录。

Decision：

- 文档维护改为三级：
  - 实时更新：API、DB、安全、运维、release evidence、凭据/沙箱/LLM/GitHub 等会影响运行、安全、数据或用户调用的事实。
  - 阶段性更新：阶段需求、路线图、状态看板、进度日志、交接文档，在阶段启动/收口、关键功能完成、门禁或风险变化时更新。
  - 周期性更新：`PROJECT_CODE_MAP.md`、结构审计、README 的结构性说明，在文件结构/API 入口变化、阶段验收、交接或用户要求盘点时刷新。
- `PROJECT_CODE_MAP.md` 定位从详细审计报告调整为简洁索引，只回答“目录/文件/接口入口是做什么的”。
- 低风险小改动不再强制追加长日志；重要事实、门禁、风险、阶段状态和多 agent 打回仍必须记录。
- 每个阶段收口仍必须做文档一致性检查和垃圾文件盘点，避免项目开发完成后原文件和真实状态脱节。

Impact：

- 降低维护成本和 token 消耗，把更多时间留给核心功能、UI、安全、测试和发布证据。
- 保留关键事实的可追溯性，同时减少重复、过细、很快过期的日志。
- 后续判断是否更新文档时，以 `docs/PRODUCT_GOVERNANCE.md` 的维护分级为准。

Evidence：

- `docs/PRODUCT_GOVERNANCE.md`
- `scripts/generate-project-code-map.mjs`
- `docs/AGENT_STATUS_BOARD.md`
- `README.md`

Review trigger：

- 发生发布事故、交接失败、文档与代码严重漂移。
- 阶段收口时发现缺少必要记录导致无法复盘。
- 用户要求恢复更严格或更宽松的记录策略。

## ADR-FE-028：AgentChat title、handoff 和 API error/toast 必须显示层脱敏

Date：2026-07-04。
Owner：`扎克伯格` / Frontend Engineer，`奥特曼` / Security Engineer，`拉里佩奇` / QA Engineer，`特朗普` / Delivery Owner。
Roles：`扎克伯格`、`奥特曼`、`拉里佩奇`、`乔布斯`、`马斯克`、`特朗普`。
Status：Accepted。

Context：

- ADR-FE-027 已覆盖 AgentChat message content、errorMessage 和 streaming content，但 conversation title、handoff filePath/lineRef、page-level API error state 和 toast 仍可能从 API response 或 URL query 中带入 raw secret。
- `Linnaeus / 019f28e2-73ca-7462-989a-4cb8d953c3b8 = 奥特曼 / Security Engineer` 只读复核指出：普通显示层、toast、aria label、title attr、composer、body、URL 和 marker 均不得出现 raw secret。
- `Mencius / 019f28e2-7430-7170-822c-f2624abfa209 = 拉里佩奇 / QA Engineer` 只读复核要求：title、handoff、API error/toast 必须有独立 marker scope，不得混入 message/error 或 AgentToolCall scope。

Decision：

- AgentChat 的 page-level API error state 必须使用 `redactAgentChatApiError`，本页 toast 必须使用 `showRedactedAgentChatApiError`。
- Conversation header、sidebar title 和 delete accessible label 必须通过 `redactAgentChatText` 渲染。
- Code-understanding handoff panel 的 source label、lineRef、filePath、title attr、source/input/context/evidence/relevance 字段必须通过 `redactAgentChatText` 渲染。
- Code-understanding handoff URL query 中的敏感文本必须由 `sanitizeCodeUnderstandingHandoffParams` replace 为 redacted values 后再继续展示、预填 composer 或创建绑定任务。
- `agent-chat-closure-rail-smoke` 必须输出三个独立 proof：`AGENT_CHAT_CONVERSATION_TITLE_DISPLAY_REDACTION_ONLY`、`AGENT_CHAT_HANDOFF_TITLE_FILE_PATH_DISPLAY_REDACTION_ONLY`、`AGENT_CHAT_API_ERROR_STATE_DISPLAY_REDACTION_ONLY`。
- `validate-frontend-ui.mjs` 必须拒绝 raw selected title、conversation title、handoff filePath/lineRef 和 raw API error state 回退。

Impact：

- AgentChat 的标题、交接包、composer、URL query、错误态和本页 toast 具备显示层 raw secret 防扩散能力。
- Handoff smoke 中的 task title 和 inputJson 也因 URL sanitize 不再携带 injected raw secret，但这不是后端 payload 最小化或存储治理。
- 本决策不改变后端 DB、API/SSE 原文、network payload、raw download/export、历史 payload、全站 toast、GitHub App 或真实 LLM provider 输出。

Evidence：

- `web-console/src/pages/AgentChat.tsx`
- `web-console/tests/agent-chat-closure-rail-smoke.spec.ts`
- `scripts/validate-frontend-ui.mjs`
- `docs/PRODUCT_PROGRESS_LOG.md`

Review trigger：

- AgentChat 新增新的 URL handoff 参数、raw 查看、复制、导出或下载能力。
- Handoff 结构化字段扩展为更多自由文本。
- 后端开始提供服务端 sanitizer、raw 查看权限、payload 最小化或历史数据清理策略。

## ADR-FE-027：AgentChat message content 和 errorMessage 必须显示层脱敏

Date：2026-07-04。
Owner：`扎克伯格` / Frontend Engineer，`奥特曼` / Security Engineer，`拉里佩奇` / QA Engineer，`特朗普` / Delivery Owner。
Roles：`扎克伯格`、`奥特曼`、`拉里佩奇`、`乔布斯`、`马斯克`、`特朗普`。
Status：Accepted。

Context：

- AgentChat 是用户查看 Agent 代码理解、工具调用、任务交接和后续对话的核心页面。
- 之前 `AgentToolCall` args/result 已使用 shared display redaction，但 `AgentChat.tsx` 的 persisted `msg.content`、`msg.errorMessage` 和 streaming `msg.content` 仍直接渲染。
- `Halley / 019f28d5-d30f-7651-add6-66bab3ff6ac0 = 奥特曼 / Security Engineer` 只读复核指出：工具调用 `<pre>` 脱敏不等于聊天正文/错误脱敏，message/error 是独立 raw pass-through 面。
- `Gibbs / 019f28d5-fbfe-7df1-858b-067eff108d06 = 拉里佩奇 / QA Engineer` 只读复核要求：扩展 `agent-chat-closure-rail-smoke`，在 `ConversationMessage.content` 和 `errorMessage` 注入 raw secret，并新增独立 marker scope。

Decision：

- AgentChat 普通 UI 中的 persisted message content、persisted errorMessage 和 streaming content 渲染前必须使用 shared `displayRedaction`。
- `MessageBubble` 不得直接渲染 `msg.content` 或 `msg.errorMessage`。
- `StreamingBubble` 不得直接渲染 `msg.content`。
- `agent-chat-closure-rail-smoke` 必须单独输出 `agentChatMessageErrorRedaction.scope=AGENT_CHAT_MESSAGE_ERROR_DISPLAY_REDACTION_ONLY`，与 `AGENT_TOOL_CALL_ARGS_RESULT_DISPLAY_REDACTION_ONLY` 分离。
- validator 必须拒绝 raw `msg.content` / `msg.errorMessage` 回退，并锁住 smoke marker。

Impact：

- AgentChat 历史消息和错误标签具备显示层 raw secret 防扩散能力。
- 工具调用脱敏和聊天正文/错误脱敏分别有独立 marker，后续 release evidence 可按 scope 消费。
- 本决策不改变后端数据库、审计日志、API/SSE 原文、network payload、raw download/export、历史对话清理、GitHub App 或真实 LLM provider 输出。

Evidence：

- `web-console/src/pages/AgentChat.tsx`
- `web-console/tests/agent-chat-closure-rail-smoke.spec.ts`
- `scripts/validate-frontend-ui.mjs`
- `docs/PRODUCT_PROGRESS_LOG.md`

Review trigger：

- AgentChat 新增 clipboard/export/raw 查看能力。
- 会话标题、API error/toast、handoff panel 或其他 AgentChat 文本进入显示层。
- 后端开始提供服务端 sanitizer、raw 查看权限或历史对话清理策略。

## ADR-FE-025：AutoRepairs Candidate Provenance Receipt 白名单字段也必须显示层脱敏

Date：2026-07-04。
Owner：`扎克伯格` / Frontend Engineer，`奥特曼` / Security Engineer，`拉里佩奇` / QA Engineer，`特朗普` / Delivery Owner。
Roles：`扎克伯格`、`奥特曼`、`拉里佩奇`、`乔布斯`、`马斯克`、`特朗普`。
Status：Accepted。

Context：

- AutoRepairs 的 Candidate Provenance Receipt 只展示 provenance 白名单字段，不展示完整 prompt、answer、code 或 diff。
- 但白名单字段本身可能来自扫描报告、QA/Agent、审计输入或服务端派生 gate reason，仍可能包含 Authorization、Bearer、API key、password、secret、JWT-like token。
- `targetDesc`、`repairEvidenceGateReason`、`riskKey`、`sourceEvidenceTitle/source/sourceFilePath` 会进入普通 UI、PR confirm summary、QA deeplink question 和 `data-sl-target-url`。
- `Russell / 019f28aa-cb9c-7703-9655-16318eaf7ec0 = 奥特曼 / Security Engineer` 只读复核指出：不能把 Candidate Receipt 的白名单字段当作安全边界，URL handoff 也是泄漏面。
- `Huygens / 019f28aa-f542-7711-8a15-d18c81d7761c = 拉里佩奇 / QA Engineer` 只读复核建议用 `AUTOREPAIR_CANDIDATE_PROVENANCE_RECEIPT_DISPLAY_REDACTION_ONLY` marker 证明 UI/body/URL/marker 不含 raw secret。

Decision：

- AutoRepairs 任何 report-derived、QA-derived 或 audit-derived 文本进入普通 UI、Candidate/Draft Receipt、Source Bridge、PR confirm summary、timeline error 或 QA handoff URL 前，必须先走 shared display redaction。
- Candidate Provenance Receipt 必须通过 `redactedAutoRepairProvenanceForOutput` 渲染 provenance 白名单字段。
- Candidate evidence gate 必须通过 `redactedRepairReadinessSignalForOutput` 渲染 label、summary 和 checks。
- QA handoff URL question 必须再次脱敏并限制长度，`data-sl-target-url` 不得成为 raw secret 旁路。
- `report-autorepair-candidate` smoke 必须注入 raw secret fixture，并输出 `candidateReceiptRedaction.scope=AUTOREPAIR_CANDIDATE_PROVENANCE_RECEIPT_DISPLAY_REDACTION_ONLY`。

Impact：

- 扫描报告风险到 AutoRepair 候选的主链路在普通 UI 和 QA 深链层具备显示层安全边界。
- 候选凭证仍保留可审计的来源类型、Scan、文件、风险字段、门禁和复核动作。
- 本决策不改变后端审计存储、API response、DevTools/network、raw download、历史审计、artifact preview、GitHub App 或真实 LLM provider。

Evidence：

- `web-console/src/pages/AutoRepairs.tsx`
- `web-console/tests/report-autorepair-candidate-smoke.spec.ts`
- `scripts/validate-frontend-ui.mjs`
- `docs/PRODUCT_PROGRESS_LOG.md`

Review trigger：

- 新增 AutoRepair raw 查看、复制、下载、导出、server-side report export 或外部分享能力。
- Candidate provenance schema 新增文本字段。
- QA/Agent/AutoRepair handoff URL 增加更多自由文本参数。
- 安全策略升级到后端 payload 最小化、历史审计清理或授权 raw 查看。

## ADR-FE-024：报告证据 metadata 与风险派生 handoff 必须显示层脱敏

Date：2026-07-03。
Owner：`扎克伯格` / Frontend Engineer，`奥特曼` / Security Engineer，`拉里佩奇` / QA Engineer，`特朗普` / Delivery Owner。
Roles：`扎克伯格`、`奥特曼`、`拉里佩奇`、`乔布斯`、`马斯克`、`特朗普`。
Status：Accepted。

Context：

- `ScanTaskDetail` 的报告风险、API、数据库实体和 Trace Map 会生成 `ReportEvidenceDrawerData`，并进入证据抽屉、Project QA URL、复制证据引用、AutoRepair 候选和 Project QA 来源桥。
- 报告派生字段可能包含扫描器、仓库源码、配置片段、工具输出或 LLM/Agent 文本中的 Authorization、Bearer、API key、password、secret、JWT-like token。
- 只保护抽屉 summary/question 不够；同页 `质量风险`、`技术债`、`改进建议`列表以及下游 Project QA 来源桥同样会渲染或复制这些字段。
- `Harvey / 019f2885-a229-7a02-af6d-8a03719bd3c6 = 奥特曼 / Security Engineer` 只读复核给出 `BLOCK`：报告派生字段进入抽屉、URL、剪贴板、页面主体和下游来源桥时必须统一脱敏。
- `Boyle / 019f2885-a286-79d3-aa3a-c3edf53ea335 = 拉里佩奇 / QA Engineer` 只读复核建议用 raw secret fixture 覆盖 question、summary/body、URL、clipboard 和 manual copy fallback。

Decision：

- 报告证据 metadata 进入普通 UI、URL 参数、复制引用、手动复制 fallback 或跨页面来源桥前，必须统一通过 shared display redaction。
- `ScanTaskDetail` 必须使用 `redactedReportEvidenceForOutput` 保护 title/category/source/summary/question/fields/file/line/artifactTypes。
- `质量风险`、`技术债`、`改进建议`列表和风险派生 QA/AutoRepair target 描述必须使用同一 redaction helper，不能成为抽屉外的泄漏旁路。
- `ProjectDetail` 报告证据来源桥必须用 `redactedEvidenceRefForOutput` 展示、复制和重新检索。
- `report-evidence-drawer-smoke` 必须输出 `SCAN_TASK_DETAIL_REPORT_EVIDENCE_DRAWER_QUESTION_REFERENCE_DEEPLINK_DISPLAY_REDACTION_ONLY` 级别 proof，证明 question/body/URL/clipboard/manual copy 均不含 raw secret。
- AntD message 不得继续使用会产生 runtime warning 的静态 API；页面复制流程必须使用 `App.useApp()` 的上下文实例。

Impact：

- 报告证据从扫描报告进入 QA、复制引用和 AutoRepair 候选的主链路默认具备显示层安全边界。
- 用户仍能看到安全 marker、报告摘要结构和修复定位信息；文件定位输入仍保留原始修复能力，不被粗暴破坏。
- 本决策不改变后端 artifact/code_chunks 存储、API response、RAG payload、DevTools/network、raw download、历史报告产物或真实 LLM provider。

Evidence：

- `web-console/src/pages/ScanTaskDetail.tsx`
- `web-console/src/pages/ProjectDetail.tsx`
- `web-console/tests/report-evidence-drawer-smoke.spec.ts`
- `scripts/validate-frontend-ui.mjs`
- `docs/PRODUCT_PROGRESS_LOG.md`

Review trigger：

- 新增报告 metadata raw 查看、download、server export、批量复制或外部分享能力。
- Project QA evidenceRef schema 改动。
- AutoRepair candidate URL/表单改为接收更多报告原文字段。
- 安全策略升级到后端 payload 最小化、历史报告清理或授权 raw 查看。

## ADR-FE-023：ScanTaskDetail ArtifactFallback summaryJson 必须显示层脱敏

Date：2026-07-03。
Owner：`扎克伯格` / Frontend Engineer，`奥特曼` / Security Engineer，`拉里佩奇` / QA Engineer，`特朗普` / Delivery Owner。
Roles：`扎克伯格`、`奥特曼`、`拉里佩奇`、`乔布斯`、`特朗普`。
Status：Accepted。

Context：

- `ScanTaskDetail` 在主 `ARCHITECTURE_REPORT` preview 不可用或不可解析时，会降级展示 `ArtifactFallback`。
- `ArtifactFallback` 解析 artifact `summaryJson` 后原先直接 `JSON.stringify(data, null, 2)` 输出到普通 UI。
- artifact `summaryJson` 可能来自扫描器、报告构建器、Agent/AutoRepair 或外部工具，存在 Authorization、Bearer、API key、password、secret、JWT-like token 等 raw-ish 内容的可能。
- `Kant / 019f286f-4518-7f21-8b27-7261e28ea2c4 = 奥特曼 / Security Engineer` 只读复核给出 `BLOCK`：该路径会绕过 shared display redaction，且不能宣称后端 DB/API/download 已被治理。
- `Peirce / 019f286f-cbe6-7ef2-8a94-74b9618dc82b = 拉里佩奇 / QA Engineer` 只读复核建议独立 smoke，强制进入 fallback 并用 raw secret fixture 证明 preview/body/marker 均不泄漏。

Decision：

- `ArtifactFallback` 必须使用 shared `stringifyRedactedPayload(data, 2)` 渲染 `summaryJson`。
- fallback JSON preview 必须有可识别区域：`.sl-artifact-fallback-redacted-raw-json` 与 `aria-label="脱敏分析产物 JSON"`。
- `report-evidence-drawer-smoke` 必须新增独立 `SCAN_TASK_DETAIL_ARTIFACT_FALLBACK_SMOKE_OK` marker，证明三视口 fallback 可见、safe marker 可见、raw secrets hidden、body raw hidden、redaction visible 和 marker no raw。
- `validate-frontend-ui.mjs` 必须禁止 `ArtifactFallback` 回退到 raw `JSON.stringify(data, null, 2)`。

Impact：

- ScanTaskDetail 的报告降级路径不再成为 shared display redaction 的旁路。
- 用户仍可查看产物摘要 JSON 的结构和安全内容。
- 本决策不改变后端 artifact 存储、artifact preview API、raw download、DevTools/network、历史产物、release evidence schema、GitHub App 或真实 LLM provider。

Evidence：

- `web-console/src/pages/ScanTaskDetail.tsx`
- `web-console/tests/report-evidence-drawer-smoke.spec.ts`
- `scripts/validate-frontend-ui.mjs`
- `docs/PRODUCT_PROGRESS_LOG.md`

Review trigger：

- 新增 ArtifactFallback raw 查看、download、copy/export 或服务端导出能力。
- 后端 artifact schema 改变 `summaryJson` 来源或包含更多外部工具输出。
- 安全策略升级到后端 payload 最小化、历史 artifact 清理或授权 raw 查看。

## ADR-FE-022：Project QA code_chunks 搜索结果预览和复制引用必须显示层脱敏

Date：2026-07-03。
Owner：`扎克伯格` / Frontend Engineer，`奥特曼` / Security Engineer，`拉里佩奇` / QA Engineer，`特朗普` / Delivery Owner。
Roles：`扎克伯格`、`奥特曼`、`拉里佩奇`、`乔布斯`、`特朗普`。
Status：Accepted。

Context：

- Project QA 的 code_chunks 搜索结果卡片会展示 `contentPreview/content`，用户也会点击“复制引用”把同一证据带到后续复核或外部笔记中。
- code_chunks 来自用户仓库源码，可能包含凭据、测试 token、配置片段、Authorization header、JWT、API key 或 password。
- `Newton / 019f285f-6d18-7461-90dc-73a3277eb64d = 奥特曼 / Security Engineer` 只读复核指出 ProjectDetail 仍直接渲染并复制 raw `item.contentPreview || item.content`。
- `Galileo / 019f285f-a0f8-7713-9364-6e7b3809793a = 拉里佩奇 / QA Engineer` 只读复核建议扩展 `project-qa-recoverable-smoke`，因为它已经覆盖 ProjectDetail QA/code_chunks 搜索结果、retry、刷新失败保留旧结果和三 viewport。

Decision：

- `ProjectDetail` 的 Project QA code_chunks 搜索结果预览必须使用 shared display redaction。
- `copyChunkCitation` 必须复制脱敏后的 chunk preview，不能绕过 UI 显示保护。
- visible preview region 必须可识别为 `.sl-search-code-preview-redacted`，并带 `aria-label="脱敏 code chunk 搜索结果预览"`。
- `project-qa-recoverable-smoke` 必须注入 raw chunk secret fixture，并输出 `codeChunkEvidenceCard.redaction.scope=PROJECT_QA_CODE_CHUNK_PREVIEW_DISPLAY_REDACTION_ONLY`。
- `validate-frontend-ui.mjs` 必须禁止 ProjectDetail 回退到 raw `item.contentPreview || item.content` 渲染或复制。

Impact：

- Project QA 搜索结果从“可读源码片段”升级为“默认安全显示的证据片段”。
- 用户仍能读到有效代码上下文，但不会在普通 UI 或复制引用中直接扩散常见 secret 形态。
- 本决策不改变后端 code_chunks 存储、API response、RAG payload、DevTools/network、raw download、历史 code_chunks 或权限系统。

Evidence：

- `web-console/src/pages/ProjectDetail.tsx`
- `web-console/tests/project-qa-recoverable-smoke.spec.ts`
- `scripts/validate-frontend-ui.mjs`
- `docs/PRODUCT_PROGRESS_LOG.md`

Review trigger：

- 新增 Project QA raw chunk 查看、download、export 或 server-side citation export。
- code_chunks 预览在其他页面新增消费方。
- 安全策略升级到后端 payload 最小化、历史 chunk 清理或授权 raw 查看。

## ADR-FE-021：前端显示层脱敏统一到 shared displayRedaction utility

Date：2026-07-03。
Owner：`扎克伯格` / Frontend Engineer，`奥特曼` / Security Engineer，`拉里佩奇` / QA Engineer，`特朗普` / Delivery Owner。
Roles：`扎克伯格`、`奥特曼`、`拉里佩奇`、`马斯克`、`特朗普`。
Status：Accepted。

Context：

- AgentToolCall、DiffViewer、LogViewer、Artifacts、AuditLogs、CI Diagnostics、ScanTaskDetail 和 IssueDecomposition 都存在普通 UI 展示 raw payload、raw log、raw JSON、diff、code chunk preview 或 Markdown copy/export 的需求。
- 这些页面如果各自维护 redaction regex，会出现覆盖范围漂移、字段遗漏、smoke marker 不一致和后续 UI 重构回退风险。
- `Dalton / 019f282e-ea6f-7202-88cc-c4ae0cba1e98 = 奥特曼 / Security Engineer` 只读复核要求保持 display-only 边界，不得宣称后端原文生命周期已治理。
- `Ampere / 019f282f-0ea3-7c83-80b5-b27432903dc9 = 拉里佩奇 / QA Engineer` 只读复核要求保留各 focused smoke scope marker，并用 validator 锁住共享工具与消费方使用路径。

Decision：

- 前端普通 UI、预览、copy/export 的敏感信息显示层脱敏统一使用 `web-console/src/utils/displayRedaction.ts`。
- 共享工具必须覆盖：
  - 结构化对象递归敏感 key 脱敏。
  - Authorization/Bearer、key assignment、`sk-*`、JWT-like token 等常见文本形态。
  - JSON parse 成功和失败 fallback。
  - 循环引用保护。
  - 显示截断前先脱敏。
- 新页面或新组件不得复制局部 token/key/password regex；如果展示 raw-ish payload，必须复用共享工具并补 validator 或 smoke proof。
- 各 focused smoke marker 继续保留各自 scope，例如 `LOG_VIEWER_DISPLAY_REDACTION_ONLY`、`DIFF_VIEWER_DISPLAY_REDACTION_ONLY`、`AUDIT_LOGS_RAW_JSON_DISPLAY_REDACTION_ONLY` 等，不合并成模糊的“全链路安全已完成”声明。

Impact：

- 降低前端显示层泄漏面和维护成本。
- 后续 P9 UI 重构可以复用同一安全显示入口。
- 本决策不改变后端原文存储、DB、artifact/raw download、审计权限、历史 payload 清理、provider 原始输出或 release evidence schema。

Evidence：

- `web-console/src/utils/displayRedaction.ts`
- `scripts/validate-frontend-ui.mjs`
- `docs/PRODUCT_PROGRESS_LOG.md`
- `docs/AGENT_ACTIVITY_LOG.md`

Review trigger：

- 需要提供授权 raw 查看/下载能力。
- 需要做后端服务端 sanitizer、payload 最小化、历史数据清理或审计策略。
- 发现新的 secret 形态无法被当前共享工具覆盖。

## ADR-SEC-030：Artifact raw download receipt 必须提供低敏 AuditLogs traceability deep link

Date：2026-07-04。
Owner：`扎克伯格` / Frontend Engineer，`奥特曼` / Security Engineer，`拉里佩奇` / QA Engineer，`特朗普` / Delivery Owner。
Roles：`扎克伯格`、`奥特曼`、`拉里佩奇`、`乔布斯`、`马斯克`、`特朗普`。
Status：Accepted。

Context：

- ADR-SEC-029 已要求 Artifact raw download 必须显式 acknowledgement 并写 `ARTIFACT_RAW_DOWNLOAD` audit receipt。
- 仅写入 receipt 仍不足以形成用户可追踪闭环；用户确认下载后需要能从 Artifacts 页面直接复核对应审计事件。
- `James / 019f2902-742f-7712-8fcb-342fe316978b = 奥特曼 / Security Engineer` 只读复核要求：traceability URL 只能携带低敏定位字段，不能带 raw payload、filename、storagePath 或 raw 内容安全声明。
- `Epicurus / 019f2902-c14f-7dc1-906d-6973403985dc = 拉里佩奇 / QA Engineer` 只读复核要求：Artifacts smoke 证明 receipt 入口和低敏 URL，AuditLogs smoke 证明 exact event，不得被同 artifact 的其他 action/status 劫持。

Decision：

- Artifacts raw download 成功后必须展示 `原始产物下载已记录审计` 状态块，并提供 `查看下载审计` 操作。
- 该操作只能生成低敏 AuditLogs filter URL：`projectId`、`resourceType=ARTIFACT`、`resourceId=<artifactId>`、`action=ARTIFACT_RAW_DOWNLOAD`、`status=SUCCESS`。
- AuditLogs resource filter 必须支持 `ARTIFACT`。
- `ARTIFACT` audit record 的关联资源必须回跳 `/artifacts?projectId=${projectId}&artifactId=${record.resourceId}`。
- 表格和抽屉关联资源按钮必须暴露 `data-sl-target-url`，供 smoke/validator 证明目标 URL。
- Browser smoke 必须证明 exact `ARTIFACT_RAW_DOWNLOAD/SUCCESS` 命中，不被同 resource 的 `ARTIFACT_PREVIEW` 或其他 action/status 劫持。

Impact：

- Artifact raw download receipt 从“后端可写入”升级为“前端可追踪、审计页可复核、关联资源可回跳”。
- 本决策不新增 receipt id、后端 receipt lookup、DB schema、审计写入语义或 release evidence schema。
- 本决策不证明 raw artifact 内容已脱敏、已扫描、无 secret 或可安全外发。

Evidence：

- `web-console/src/pages/Artifacts.tsx`
- `web-console/src/pages/AuditLogs.tsx`
- `web-console/tests/artifacts-detail-selection-smoke.spec.ts`
- `web-console/tests/audit-logs-detail-selection-smoke.spec.ts`
- `scripts/validate-frontend-ui.mjs`
- `docs/PRODUCT_PROGRESS_LOG.md`

Review trigger：

- 需要把 receipt id 作为一等返回值。
- AuditLogs 后端查询合同、分页定位或 exact event lookup 改变。
- 需要授权 raw 查看/下载、服务端内容扫描、策略化高风险 artifact 控制或 release verifier 吸收该 focused marker。

## ADR-SEC-029：Artifact raw download 必须显式确认并写审计 receipt

Date：2026-07-04。
Owner：`比尔盖茨` / Backend Engineer，`扎克伯格` / Frontend Engineer，`奥特曼` / Security Engineer，`拉里佩奇` / QA Engineer，`特朗普` / Delivery Owner。
Roles：`比尔盖茨`、`扎克伯格`、`奥特曼`、`拉里佩奇`、`乔布斯`、`马斯克`、`特朗普`。
Status：Accepted。

Context：

- Artifacts 是 SourceLens 报告、图谱、patch、Agent 报告和 raw scan 结果的复盘入口。
- Preview display redaction 只保护页面展示；raw download 返回原始 blob，不能继承 preview redaction 的安全声明。
- 下载 raw blob 属高价值操作，必须至少做到用户显式确认、服务端 fail-closed 和审计可追责。
- `Confucius / 019f28f5-cfc3-7e20-b16f-19003512aec4 = 奥特曼 / Security Engineer` 只读复核指出：当前已有 ownership/path/safe filename，但 raw download 缺少服务端 audit receipt。
- `Pasteur / 019f28f5-fc53-77c1-8183-874e3b655dcd = 拉里佩奇 / QA Engineer` 只读复核指出：后端 test 必须证明 receipt，前端 smoke 必须证明 acknowledgement request boundary，并且 marker 不能宣称 redaction。

Decision：

- `/api/projects/{projectId}/artifacts/{artifactId}/download` 必须接收 `rawDownloadAcknowledged=true` 后才读取并返回 bytes。
- 缺少 acknowledgement 时返回 `400`，不读取 raw bytes，并写 `ARTIFACT_RAW_DOWNLOAD` failed audit receipt。
- 成功下载写 `ARTIFACT_RAW_DOWNLOAD` success audit receipt，`resourceType=ARTIFACT`、`resourceId=artifactId`，input 仅记录 artifact metadata、`downloadKind=RAW_BLOB` 和 acknowledgement 状态。
- 审计 input/output 不得写 raw blob、源码正文、完整 diff、preview text、`storagePath` 或本地绝对路径。
- 前端 Artifacts 下载动作必须先显示 raw download 确认，再携带 `rawDownloadAcknowledged=true` 请求。
- Smoke marker 使用 `ARTIFACTS_RAW_DOWNLOAD_ACKNOWLEDGEMENT_AUDIT_BOUNDARY_ONLY`，且必须显式 `rawDownloadRedactionClaim=false`。

Impact：

- Artifact raw download 行为变为可确认、可拒绝、可审计。
- 本决策不改变 artifact storage schema、权限模型、preview redaction 规则或 raw content 生命周期。
- 本决策不证明 raw artifact 内容已脱敏、已扫描、无 secret 或可安全外发。

Evidence：

- `backend-spring/src/main/java/com/sourcelens/module/artifact/controller/ArtifactController.java`
- `backend-spring/src/test/java/com/sourcelens/ArtifactControllerTest.java`
- `web-console/src/api/artifact.ts`
- `web-console/src/pages/Artifacts.tsx`
- `web-console/tests/artifacts-detail-selection-smoke.spec.ts`
- `scripts/validate-frontend-ui.mjs`
- `docs/SECURITY_BOUNDARY.md`

Review trigger：

- 需要返回 receipt id 给前端或深链到 AuditLogs。
- 需要为 `RAW_SCAN_RESULT`、`CHANGE_PATCH` 等高风险 artifact type 设置更强策略。
- 需要实现完整 raw view/download 授权层、内容扫描、服务端脱敏下载或历史 artifact 清理。

## ADR-SEC-031：Artifact raw download auditLogId 只能作为 receipt locator

Date：2026-07-04。
Owner：`奥特曼` / Security Engineer，`比尔盖茨` / Backend Engineer，`扎克伯格` / Frontend Engineer，`拉里佩奇` / QA Engineer，`特朗普` / Delivery Owner。
Roles：`奥特曼`、`比尔盖茨`、`扎克伯格`、`拉里佩奇`、`马斯克`、`特朗普`。
Status：Accepted。

Context：

- ADR-SEC-030 已把 artifact raw download 从“后端 receipt + 低敏 deep link”推进到 AuditLogs 可追踪，但 resource/action/status 级 URL 在同一 artifact 多次下载时仍可能定位不够精确。
- `Maxwell / 019f2915-6301-7810-97ae-84c5fc0ff4fd = 奥特曼 / Security Engineer` 只读复核指出：返回 audit log id 可接受，但它只能作为 locator，不能作为授权凭据；header/query 必须保持低敏。
- `Nash / 019f2915-abd6-7923-8017-58befe4752ce = 拉里佩奇 / QA Engineer` 只读复核指出：要声明 receipt id traceability，必须证明后端返回 id、前端 deep link 带 id、AuditLogs query 按 id 命中，且相邻同 resource event 不劫持。

Decision：

- `AuditLogService.record(...)` 可以返回 inserted audit log id；artifact raw download 成功响应可以通过 `X-SourceLens-Audit-Log-Id` 暴露该 id。
- `AuditLogService.listByProject(...)` / `AuditLogController` 可以支持 `auditLogId` filter，但必须继续保留 `projectId` 过滤，不能提供不带项目边界的 id 查询。
- Artifacts -> AuditLogs deep link 可以携带 `auditLogId`，并继续携带 `projectId/resourceType=ARTIFACT/resourceId/action=ARTIFACT_RAW_DOWNLOAD/status=SUCCESS` 作为上下文。
- `auditLogId` 只是 receipt locator，不是 bearer token、capability URL 或权限凭据；任何后续单条 lookup API 都必须重新做项目所有权校验。
- 审计插入失败时 `AuditLogService.record(...)` 可以返回 `null`，artifact raw download 不伪造 receipt id，不返回 `0/null/-1` 等占位 header。
- 前端未拿到合法正整数 `auditLogId` 时，只能展示资源、动作和状态级 fallback 审计定位入口，不得显示 `receipt #...` 或宣称本次下载已精确 receipt id 追踪。
- header/query 允许字段仅限：`X-SourceLens-Audit-Log-Id`、`projectId`、`auditLogId`、`resourceType=ARTIFACT`、`resourceId`、`action=ARTIFACT_RAW_DOWNLOAD`、`status=SUCCESS`、`X-Request-Id`。
- header/query 禁止字段包括：raw blob、源码正文、完整 diff、preview text、`storagePath`、本地绝对路径、filename、checksum、contentType、size、owner、repository、token、secret、Authorization 或任何 raw payload。

Impact：

- 用户可以从一次 raw download 精确跳到该次下载 receipt。
- 同一 artifact 的多次下载、预览或其他 action 不应劫持 deep link。
- 当审计写入失败导致没有 receipt id 时，用户仍可以进入资源/action/status fallback 查询，但不能被告知已有精确 receipt。
- 该决策不证明 raw artifact 内容已脱敏、已扫描、无 secret 或可安全外发。

Evidence：

- `backend-spring/src/main/java/com/sourcelens/module/audit/service/AuditLogService.java`
- `backend-spring/src/main/java/com/sourcelens/module/artifact/controller/ArtifactController.java`
- `backend-spring/src/main/java/com/sourcelens/common/config/CorsConfig.java`
- `web-console/src/pages/Artifacts.tsx`
- `web-console/src/pages/AuditLogs.tsx`
- `web-console/tests/artifacts-detail-selection-smoke.spec.ts`
- `web-console/tests/audit-logs-detail-selection-smoke.spec.ts`
- `docs/SECURITY_BOUNDARY.md`

Review trigger：

- 新增单条 audit receipt lookup API。
- `auditLogId` 被用于跨项目跳转、分享链接、外部 webhook 或通知。
- raw view/download/export 授权层上线。
- header/query 需要新增 artifact metadata 字段。

## ADR-TEAM-022：SourceLens 团队采用 11 固定核心 + 5 按需专家池

Date：2026-07-03；2026-07-04 用户再次确认继续采用该模式。
Owner：`特朗普` / Delivery Owner。
Roles：`特朗普`、`乔布斯`、`库克`、`马斯克`、`奥特曼`、`黄仁勋`、`梁文峰`、`比尔盖茨`、`扎克伯格`、`达里奥`、`拉里佩奇`、`任正非`、`马云`、`雷军`、`马化腾`、`张一鸣`。
Status：Accepted。

Context：

- 用户希望 SourceLens 团队达到大厂级项目组织能力，同时避免再次出现无节制创建大量随机子 agent 的问题。
- 经评估，16 个常驻角色会增加协调成本、日志噪声和审核负担；更接近大厂真实模式的是稳定核心团队 + 专项专家 review。
- 用户指定 5 个专家池代号：任正非、马云、雷军、马化腾、张一鸣。
- 用户确认：保持现在的 11 个固定核心角色，不扩成 16 个常驻；新增 5 个专家角色池，后续团队按 `11 + 5` 模式执行。
- 右侧 Codex UI 的物理子 agent 可能显示随机昵称，不能作为长期项目成员名。

Decision：

- SourceLens 长期采用 `11 个固定核心角色 + 5 个按需专家角色池`。
- 11 个核心角色继续承担日常产品、架构、安全、后端、前端、QA、DevOps、Data/AI、质量门禁、项目管理和交付职责：`特朗普`、`乔布斯`、`库克`、`马斯克`、`奥特曼`、`黄仁勋`、`梁文峰`、`比尔盖茨`、`扎克伯格`、`达里奥`、`拉里佩奇`。
- 5 个专家池不常驻，不进入每轮默认状态：
  - `任正非`：Enterprise Strategy / Compliance Advisor。
  - `马云`：Go-to-Market / Ecosystem Advisor。
  - `雷军`：Product Design / UX Research Advisor。
  - `马化腾`：Platform Reliability / SRE Advisor。
  - `张一鸣`：Data Product / Growth AI Advisor。
- 专家被启动时同样遵守“一物理子 agent 对一岗位/专家”的规则，任务首行写 `固定专家：...`，并在活动日志中记录 runtime nickname / agent id。
- 专家可以对所属专项给出 `BLOCK`，但必须写清阻断条件、解除条件和 owner。
- 主 agent `特朗普 / Delivery Owner` 只做任务拆分、岗位派发、成果物审核、打回、冲突裁决和最终集成；不默认替代子 agent 完成岗位职责。

Impact：

- 团队不会扩成 16 个常驻 agent，避免每轮流程膨胀。
- 大厂级专项能力可以在 UX、SRE、合规、GTM、AI 数据产品等关键阶段进入流程。
- `TEAM_OPERATING_MODEL.md` 和 `AGENT_STATUS_BOARD.md` 成为 11+5 团队模型的权威入口。
- 后续所有文档、状态板、成果物包和复核结论以固定中文代号为准；Codex UI 随机昵称只作为 runtime 证据。

Evidence：

- `docs/TEAM_OPERATING_MODEL.md`
- `docs/AGENT_STATUS_BOARD.md`
- `docs/PRODUCT_GOVERNANCE.md`
- 用户确认采用 `11 + 5` 模式。

Review trigger：

- 用户重新调整专家代号或职责。
- SourceLens 进入生产级部署、企业客户、多人协作或公开商业化阶段，需要把某个专家角色升级为固定核心角色。

## ADR-FE-026：Project QA verified citation 到 AutoRepair candidate 的 source evidence 必须显示层脱敏

Date：2026-07-04。
Owner：`扎克伯格` / Frontend Engineer，`奥特曼` / Security Engineer，`拉里佩奇` / QA Engineer，`特朗普` / Delivery Owner。
Roles：`扎克伯格`、`奥特曼`、`拉里佩奇`、`乔布斯`、`马斯克`、`特朗普`。
Status：Accepted。

Context：

- Project QA 已验证引用可以直接生成 AutoRepair candidate draft，是报告/QA/修复闭环的核心主链路。
- 该路径会把 QA answer、sourceEvidenceRef、citation evidenceReason、用户原始问题和 source evidence metadata 写入普通 UI、`data-sl-target-url`、浏览器 URL、AutoRepair draft 和 create payload handoff。
- `Volta / 019f28c1-a737-7aa2-9c26-8c9928607a3e = 奥特曼 / Security Engineer` 只读复核指出：QA answer、source receipt 和 AutoRepair URL 不能继续原样展示或传递 raw secret。
- `Hume / 019f28c1-ce79-7af3-b93a-b49c90e87363 = 拉里佩奇 / QA Engineer` 只读复核要求：smoke 必须注入 raw secret fixture，并证明 UI/body/URL/marker 不泄漏。

Decision：

- `ProjectDetail` 中 QA 聊天正文、回答来源凭证、来源文件匹配说明、AutoRepair targetDesc、sourceEvidence URL params 和 citation evidenceReason query param 必须使用 shared display redaction。
- `qaAnswerSourceEvidenceReceipt` 必须基于 `redactedEvidenceRefForOutput(ref)` 输出 title/source/category/fileReference。
- `qaCitationRepairTargetDesc` 必须在写入 URL 前脱敏 question、citation line reference 和 citation evidence reason。
- `appendSourceEvidenceParams` 必须在写入 `sourceEvidenceCategory/source/title/filePath/lineNumber` 前使用 `redactedEvidenceRefForOutput(sourceEvidenceRef)`。
- `project-qa-autorepair-candidate` smoke 必须注入 Bearer、Authorization、apiKey、password、JWT-like raw secret，并输出 `PROJECT_QA_AUTOREPAIR_CANDIDATE_PROVENANCE_RECEIPT_DISPLAY_REDACTION_ONLY` 级别 proof。

Impact：

- Project QA verified citation 到 AutoRepair candidate 的普通 UI、URL handoff、create payload handoff 和 marker 具备显示层安全边界。
- 修复候选仍保留 source type、Scan、文件、行号、chunk/citation id、引用状态和 gate 状态。
- 本决策不改变后端审计存储、API response、network payload、raw download、历史 QA/AutoRepair payload、GitHub App 或真实 LLM provider。

Evidence：

- `web-console/src/pages/ProjectDetail.tsx`
- `web-console/tests/project-qa-autorepair-candidate-smoke.spec.ts`
- `scripts/validate-frontend-ui.mjs`
- `docs/PRODUCT_PROGRESS_LOG.md`

Review trigger：

- 新增 Project QA raw answer/source evidence 查看、复制、下载、导出或服务端分享能力。
- AutoRepair candidate schema 新增更多 QA/report 派生自由文本字段。
- 需要在后端保留 raw provenance 同时避免 URL 泄漏时，应设计 receipt-id 或 server-side handoff。
- 安全策略升级到后端 payload 最小化、历史审计清理或授权 raw 查看。

## ADR-TEAM-021：独立门禁复核采用一物理子 agent 对一固定岗位

Date：2026-07-03。
Owner：`特朗普` / Delivery Owner。
Roles：`特朗普`、`奥特曼`、`拉里佩奇`、`马斯克`、`达里奥`、`库克`。
Status：Accepted。

Context：

- 用户明确要求固定 11 个逻辑岗位不能只停留在文档命名，而要在真实派发中形成可追踪的一一映射。
- Codex App 运行时仍可能显示 `Bacon`、`Raman` 等随机物理子 agent 昵称，项目无法强制 UI 把它显示成 `奥特曼` 或 `拉里佩奇`。
- 历史上曾出现一个物理子 agent 同时承担 `奥特曼 / Security Engineer + 拉里佩奇 / QA Engineer` 的合并复核，虽然可追溯，但会削弱安全与 QA 的相互制衡。

Decision：

- 后续独立门禁复核默认采用“一物理子 agent 对一固定岗位”。
- 需要安全复核时，单独启动一个物理子 agent，任务第一行写：`固定岗位：奥特曼 / Security Engineer`。
- 需要 QA 复核时，单独启动一个物理子 agent，任务第一行写：`固定岗位：拉里佩奇 / QA Engineer`。
- 需要架构、产品、DevOps、Data/AI 或 Quality Gate 复核时，同理单独绑定对应固定岗位。
- 每轮结束必须在 `AGENT_ACTIVITY_LOG.md` 记录 `运行时昵称 / agent id = 固定岗位 / 岗位` 的映射，例如 `运行时 Bacon / 019f... = 奥特曼 / Security Engineer，本轮做安全复核`。
- 中等以上任务不得把 Security 与 QA 合并为同一个物理子 agent；二者需要分别输出安全边界判断和 QA 验收证据。
- 历史合并记录保留为历史例外，不批量改写；新记录按本决策执行。

Impact：

- 用户可以通过任务首行、成果物包、`AGENT_ACTIVITY_LOG.md` 和 `AGENT_STATUS_BOARD.md` 区分“工具层随机昵称”和“项目固定岗位”。
- Delivery Owner 必须在派发时写清楚固定岗位、写入/只读范围、验收标准和返回格式。
- 安全复核、QA 复核、发布门禁、release verifier、安全回归、`make verify` 等不能再用合并岗位实例作为默认门禁证据。

Evidence：

- `docs/TEAM_OPERATING_MODEL.md`
- `docs/PRODUCT_GOVERNANCE.md`
- `docs/AGENT_ACTIVITY_LOG.md`

Review trigger：

- Codex 工具层支持用户自定义物理子 agent 显示名。
- 用户重新调整 11 个岗位或允许某些岗位长期合并。
- 物理子 agent 创建成本或工具限制导致一岗一实例不可执行。

## ADR-TEAM-020：SourceLens 固定 11 人逻辑团队使用用户指定代号

Date：2026-07-03。
Owner：`特朗普` / Delivery Owner。
Roles：`特朗普`、`乔布斯`、`库克`、`马斯克`、`奥特曼`、`黄仁勋`、`梁文峰`、`比尔盖茨`、`扎克伯格`、`达里奥`、`拉里佩奇`。
Status：Accepted。

Context：

- 用户要求 SourceLens 后续采用固定 11 个逻辑岗位，而不是无节制创建随机物理子 agent。
- 用户指定 11 个固定名称：特朗普、乔布斯、库克、马斯克、奥特曼、黄仁勋、梁文峰、比尔盖茨、扎克伯格、达里奥、拉里佩奇。
- 历史文档已有 `Lead-Codex`、`Product-Luna`、`FE-Pixel` 等代号，不能批量删除，否则会破坏历史审计追溯。

Decision：

- 从本轮起，新记录统一使用用户指定的 11 个代号。
- `特朗普` 是主 agent / Delivery Owner；其他 10 个为按需启动的子 agent 岗位，不常驻。
- 名字只作为 SourceLens 内部岗位代号，不代表模仿、代言或声称真实人物参与项目。
- 历史代号保留为历史记录，并在 `TEAM_OPERATING_MODEL.md` 中维护新旧映射。

Impact：

- 后续 `AGENT_ACTIVITY_LOG.md`、`AGENT_STATUS_BOARD.md`、`PRODUCT_PROGRESS_LOG.md` 的新记录使用新代号。
- Codex App 运行时随机昵称仍必须记录，例如 `扎克伯格 / Frontend Engineer（运行时：Schrodinger / 019f...）`。
- 物理子 agent 继续按需启动，遵守小切片 0-1、中等切片 1-2、阶段/发布门禁 2-4 的预算。

Evidence：

- `docs/TEAM_OPERATING_MODEL.md`
- `docs/AGENT_STATUS_BOARD.md`
- `docs/AGENT_ACTIVITY_LOG.md`

Review trigger：

- 用户重新指定团队代号、岗位职责发生变化、或 Codex 工具层支持长期命名/长期记忆子 agent 时复审。

## ADR-FE-020：IssueDecomposition 原始结果与 Markdown 输出默认显示层脱敏

Date：2026-07-03。
Owner：`扎克伯格` / `奥特曼` / `拉里佩奇` / `特朗普`。
Roles：`扎克伯格`、`奥特曼`、`拉里佩奇`、`乔布斯`、`特朗普`。
Status：Accepted。

Context：

- `IssueDecomposition` 是需求拆解、任务计划和执行入口，用户会查看原始结果、复制 Markdown 和导出 `.md`。
- 原始 `outputJson` 和后端 `exportMarkdown` 可能包含 token、Authorization、API key、password、private/access/refresh token、`sk-*` key、JWT-like token 或 provider raw output。
- 直接渲染、复制或下载这些内容会把计划证据面变成敏感信息扩散面。
- `Bacon / 019f2820-a7a6-71d2-8355-d4ce0a985e64` 以 `奥特曼 / Security Engineer + 拉里佩奇 / QA Engineer` 固定岗位只读复核，初判 `BLOCK`，要求补 raw sentinel、preview/body/copy/download redaction 和 marker no raw secret。

Decision：

- `IssueDecomposition` 原始结果 tab 默认只渲染 `formatJsonPreview(selected.outputJson)` 的 redacted output，不允许旧的无标签 raw source preview 回归。
- 原始结果预览必须暴露 `.sl-issue-source-preview-redacted` 和 `aria-label="脱敏 Issue 拆解原始结果"`。
- Markdown copy/export 必须先经过 `sanitizeIssueMarkdownExport`，再写入 clipboard 或 Blob。
- smoke 必须注入 outputJson 与 Markdown raw secret sentinel，并输出：
  - `rawResultSafety.scope=ISSUE_DECOMPOSITION_OUTPUT_JSON_DISPLAY_REDACTION_ONLY`
  - `markdownExportSafety.scope=ISSUE_DECOMPOSITION_MARKDOWN_COPY_EXPORT_DISPLAY_REDACTION_ONLY`
  - fixture raw secrets present、preview/body/copy/download hidden、redaction visible、marker no raw secret。
- 如果未来需要完整 raw result 或 raw Markdown 导出，必须另设服务端授权、审计和 raw 查看/下载策略；默认 Issue planning workbench 不得绕过脱敏。

Impact：

- Issue 拆解仍可用于计划复盘和 Markdown 交付，但默认保护凭据。
- 本决策只声明前端普通 UI、clipboard 和 browser download 的显示层脱敏，不改变后端 `outputJson` 存储、`exportMarkdown` 服务端返回、DB、LLM/provider 原始输出或 release evidence schema。

Evidence：

- `web-console/src/pages/IssueDecomposition.tsx`
- `web-console/tests/issue-decomposition-detail-selection-smoke.spec.ts`
- `scripts/validate-frontend-ui.mjs`
- `node scripts/validate-frontend-ui.mjs`
- `npm --prefix web-console run build`
- `CI=true npm --prefix web-console run smoke:issue-decomposition-detail-selection`

Review trigger：

- 修改 `IssueDecomposition` 原始结果 tab、Markdown copy/export、`issue-decomposition-detail-selection-smoke` marker、后端 `exportMarkdown` 语义、或新增 raw Issue planning result 授权查看能力时复审。

## ADR-FE-019：ScanTaskDetail 报告证据 code_chunks 预览默认脱敏

Date：2026-07-03。
Owner：`扎克伯格` / `奥特曼` / `拉里佩奇` / `特朗普`。
Roles：`扎克伯格`、`奥特曼`、`拉里佩奇`、`乔布斯`、`特朗普`。
Status：Accepted。

Context：

- `ScanTaskDetail` 报告证据抽屉的 `code_chunks 命中摘要` 是公开仓库报告、QA 和 AutoRepair 候选之间的关键证据面。
- 该区域会展示 `contentPreview || content`。如果源码切片包含 token、Authorization header、API key、password、private/access/refresh token、`sk-*` key 或 JWT-like token，默认 UI 会把敏感内容作为证据扩散。
- 用户仍需要查看文件路径、行号、证据角色、分数、引用质量预检和后续动作，因此不能直接隐藏整个 code chunk 卡片。

Decision：

- `CodeChunkEvidenceCard` 默认只渲染 `redactCodeChunkPreview(item.contentPreview || item.content || '')`。
- 脱敏预览区域必须暴露 `.sl-report-evidence-chunk-preview-redacted` 和 `aria-label="脱敏 code chunk 预览"`。
- report evidence drawer smoke 必须注入 raw code chunk secret sentinel，并输出 `codeChunkPreviewRedaction.scope=REPORT_EVIDENCE_CODE_CHUNK_PREVIEW_DISPLAY_REDACTION_ONLY`。
- 如果未来需要查看完整 raw code chunk，必须另设授权、审计和 raw 查看策略；报告证据抽屉默认视图不得绕过脱敏。

Impact：

- 报告证据抽屉仍能复核 code chunk 证据，但默认保护凭据。
- 本决策只声明前端普通 display redaction，不改变后端 code_chunks API、DB、artifact preview/download 或 release evidence schema。

Evidence：

- `web-console/src/pages/ScanTaskDetail.tsx`
- `web-console/tests/report-evidence-drawer-smoke.spec.ts`
- `scripts/validate-frontend-ui.mjs`
- `node scripts/validate-frontend-ui.mjs`
- `npm --prefix web-console run build`
- `CI=true npm --prefix web-console run smoke:report-evidence-drawer`

Review trigger：

- 修改 `CodeChunkEvidenceCard` 渲染、report evidence drawer smoke marker、code_chunks API schema、artifact preview/download、或新增 raw code chunk 授权查看能力时复审。

## ADR-FE-018：DiffViewer 默认展示脱敏 Patch Diff

Date：2026-07-03。
Owner：`FE-Pixel` / `Sec-Sentinel` / `QA-Orion` / `Lead-Codex`。
Roles：`FE-Pixel`、`Sec-Sentinel`、`QA-Orion`、`Product-Luna`、`Lead-Codex`。
Status：Accepted。

Context：

- AutoRepair 的 `DiffViewer` 是 PATCH_READY 人工复核的核心证据面，必须继续展示 diff 结构、增删行颜色和滚动能力。
- 原始 diff 可能包含被删除或新增的 token、Authorization header、API key、password、private key、access/refresh token、`sk-*` key 或 JWT-like token。
- 直接展示 raw diff 会把代码修复证据面变成敏感信息扩散面。

Decision：

- `DiffViewer` 默认只渲染 display-redacted diff line，不允许 raw `{line}` 直出。
- 脱敏覆盖 Authorization/Bearer、token/apiKey/apikey/api_key、secret/password、privateKey/private_key、accessToken/access_token、refreshToken/refresh_token、`sk-*` 和 JWT-like token。
- `DiffViewer` 必须暴露稳定 `.sl-diff-viewer.sl-diff-viewer-redacted` 和 `aria-label="脱敏 diff 内容"`，用于 smoke 和可访问性定位。
- PATCH_READY smoke 必须输出 `patchDiffSafety.scope=DIFF_VIEWER_DISPLAY_REDACTION_ONLY`，证明 raw diff secrets hidden、redaction visible、sanitized diff visible 且 marker 不含 raw sentinel。
- 如果未来需要查看完整 raw diff，必须另设授权、审计和下载/原文查看策略；默认审查视图不得绕过脱敏。

Impact：

- AutoRepair PATCH_READY 仍能审查 diff 证据，但默认保护凭据。
- 本决策只声明前端普通 DiffViewer 显示层脱敏，不改变后端 `diffContent` 存储、patch artifact、download/raw 查看或 PR gate 语义。

Evidence：

- `web-console/src/components/DiffViewer.tsx`
- `web-console/tests/patch-ready-smoke.spec.ts`
- `scripts/validate-frontend-ui.mjs`
- `node scripts/validate-frontend-ui.mjs`
- `npm --prefix web-console run build`
- `CI=true npm --prefix web-console run smoke:patch-ready`

Review trigger：

- 修改 `DiffViewer` 渲染、AutoRepair `diffContent` 展示、patch artifact preview/download、PATCH_READY marker schema，或新增授权 raw diff 查看能力时复审。

## ADR-FE-017：AgentToolCall 展开详情默认脱敏

Date：2026-07-03。
Owner：`FE-Pixel` / `Sec-Sentinel` / `QA-Orion` / `Lead-Codex`。
Roles：`FE-Pixel`、`Sec-Sentinel`、`QA-Orion`、`Product-Luna`、`Lead-Codex`。
Status：Accepted。

Context：

- AgentChat 的 `AgentToolCall` 展开区用于复核工具参数和结果，是用户信任工具证据链的关键界面。
- 原实现会在参数区直接渲染 `JSON.stringify(args, null, 2)`，结果区直接渲染截断后的 raw result；如果工具参数或结果含 token、Authorization、API key、password、private key 等字段，页面和可访问文本都会泄漏。
- 该组件已有展开交互、ARIA region、可见状态文本、键盘 focus ring 和结果摘要，安全修复不能退化这些交互/可访问性能力。

Decision：

- `AgentToolCall` 展开详情默认只渲染 redacted args/result preview，不允许 raw `JSON.stringify(args)` 或 raw `resultPreview` 进入 `pre`。
- JSON payload 必须递归按敏感字段名脱敏；普通文本 payload 必须覆盖 bearer token 与 key-value 形态。
- 默认敏感字段集合为 `authorization/bearer/token/apiKey/apikey/api_key/secret/password/privateKey/private_key/accessToken/access_token/refreshToken/refresh_token`。
- 折叠摘要同样必须经过脱敏，避免 `aria-label` 或 collapsed summary 泄漏。
- 如果未来需要查看原始工具 payload，必须另设权限、审计和脱敏策略，不能复用默认详情区直出。

Impact：

- AgentChat 工具证据仍可展开复核，但默认保护凭据。
- 前端 validator 和 AgentChat closure rail smoke 成为回归红线。
- 本决策不声明后端审计入库、AuditLogs raw JSON drawer 或数据库存储已经完成同等脱敏；那些区域需单独决策和验收。

Evidence：

- `web-console/src/components/AgentToolCall.tsx`
- `web-console/tests/agent-chat-closure-rail-smoke.spec.ts`
- `scripts/validate-frontend-ui.mjs`
- `node scripts/validate-frontend-ui.mjs`
- `npm --prefix web-console run build`
- `CI=true npm --prefix web-console run smoke:agent-chat-closure-rail`

Review trigger：

- 修改 `AgentToolCall` payload 渲染、AgentChat persisted tool call normalization、工具结果 preview、AuditLogs raw payload 展示策略，或新增授权查看原始 payload 能力时复审。

## ADR-GATE-016：Current full release authority 必须同时通过 release profile 和独立 verifier

Date：2026-07-02。
Owner：`Ops-Harbor` / `QA-Gate` / `Sec-Sentinel` / `PM-Nova` / `Lead-Codex`。
Roles：`Ops-Harbor`、`QA-Gate`、`Sec-Sentinel`、`Product-Luna`、`FE-Pixel`、`AI-Vector`、`Lead-Codex`。
Status：Accepted。

Context：

- `release-evidence/p6-full-release-refresh-20260702-1900` 的完整 release profile 输出 `0 required failure(s), 0 optional warning(s), 3 skipped step(s)`，但独立 `verify-release-evidence.sh` 因 `REPORT_EVIDENCE_DRAWER_SMOKE_OK` marker 不能证明 READY/GAP code_chunks 查询而失败。
- 这说明 release 脚本运行成功和“当前 full authority 可被最新 verifier 接受”不是同一个结论。
- 修复后生成的 `release-evidence/20260702-191044` 同时满足完整 release profile 和独立 verifier。

Decision：

- Current full release authority 必须同时满足：完整 `release` profile 生成、`required_failures=0`、`optional_warnings=0`、并通过 `./scripts/verify-release-evidence.sh <dir>`。
- 只要独立 verifier 失败，即使 release 脚本 summary 全绿，也只能作为 failed/diagnostic package。
- 当前 full release authority 为 `release-evidence/20260702-191044`。
- `report-evidence-drawer-ui-smoke` 的 release marker 必须证明 READY/GAP 双路径：`drawerQueryCount=4`、`readyDrawerQueryCount=2`、`gapDrawerQueryCount=2`，并证明 GAP 只显示禁用定位动作，不暴露修复候选生成。

Impact：

- 后续 schema 加严后，必须重新跑完整 release profile 并用最新 verifier 复核，不能沿用旧 package。
- 文档和对用户汇报必须区分 `release script OK`、`verifier OK`、`current full authority` 三个层级。
- 高级集成层 GitHub App drill、GitHub webhook drill、真实 LLM provider run 仍可按当前策略 SKIP，但必须显式列为后置项。

Evidence：

- `release-evidence/p6-full-release-refresh-20260702-1900`：release script OK，但 verifier FAIL，失败点为 report evidence drawer marker 证据不足。
- `release-evidence/20260702-191044/status.tsv`：21 个 required steps OK，3 个 SKIP。
- `./scripts/verify-release-evidence.sh release-evidence/20260702-191044`：PASS。
- `release-evidence/20260702-191044/report-evidence-drawer-ui-smoke.log`：`drawerQueryCount=4`、`readyDrawerQueryCount=2`、`gapDrawerQueryCount=2`。

Review trigger：

- 修改 release profile、`verify-release-evidence.sh`、`security-regression-check.sh`、任一 release smoke marker schema，或重新声明 current full authority 时复审。

## ADR-AI-015：Operational fallback notice 豁免必须绑定后端 fallback answer

Date：2026-07-02。
Owner：`BE-Forge` / `AI-Vector` / `Sec-Sentinel` / `QA-Orion` / `Product-Luna` / `Lead-Codex`。
Roles：`BE-Forge`、`AI-Vector`、`Sec-Sentinel`、`QA-Orion`、`Product-Luna`、`Lead-Codex`。
Status：Accepted。

Context：

- Project QA 的 fallback answer 会包含“当前未配置或激活有效的 LLM 模型”“调用大模型进行代码问答失败”“已先为您检索出相关代码片段”等运行提示。
- 这些运行提示不应被 `CODE_FACT_PATTERN` 误判为 required code claim，否则 fallback 已引用 `[C1]` 的证据回答会被错误降级为 REVIEW。
- 但如果把 `错误信息:`、配置、调用等词做成全局豁免，普通 LLM answer 就可能利用这些文案绕过未引用代码主张审计。

Decision：

- Operational fallback notice 豁免必须先确认整条 answer 是后端生成的 operational fallback answer。
- 只有在 operational fallback answer 中，明确运行提示句才允许跳过 required claim citation audit。
- 普通 LLM answer 即使以 `错误信息:` 开头，只要包含真实代码事实且没有 `[C*]`，仍必须进入 `claimCitationCoverage.status=REVIEW`。
- 不新增外部 LLM fact judge，不新增 API/DB schema，不把 `PRIMARY_BOUND` 扩大解释为事实正确。

Impact：

- Fallback runtime notice 不再污染 `claimCitationCoverage` 指标。
- 普通未引用代码主张继续 fail-safe 进入人工复核。
- 后续修改 fallback 文案或 claim split 规则时，必须同时更新正向 fallback 测试和普通回答绕过负例。

Evidence：

- `backend-spring/src/main/java/com/sourcelens/module/agent/controller/CodeQaController.java`
- `backend-spring/src/test/java/com/sourcelens/CodeQaControllerTest.java`
- `mvn -Dtest=CodeQaControllerTest test` PASS，17 tests。

Review trigger：

- 修改 `fallbackCitedAnswer`、`claimCitationCoverage`、`claimRequiresCitation`、`CODE_FACT_PATTERN`、fallback 文案、LLM retry 策略或 Project QA citation gate 时复审。

## ADR-GATE-014：Scan governance action deep links must be enforced by release verifier

Date：2026-07-02。
Owner：`QA-Gate` / `Sec-Sentinel` / `Ops-Harbor` / `Product-Luna` / `Lead-Codex`。
Roles：`QA-Gate`、`Sec-Sentinel`、`Ops-Harbor`、`Product-Luna`、`QA-Orion`、`Lead-Codex`、`QA-Gate/Sec-Sentinel explorer Zeno`。
Status：Accepted。

Context：

- `scan-governance-timeline-smoke.spec.ts` 已输出 CandidateReceipt、PR Gate、Patch evidence 和 Agent review 的 action label / deep-link bound marker。
- 原 release verifier 只校验旧字段，例如 visible、source bound、foreign hidden 和 no raw prompt/answer。
- 这会导致旧 marker 或伪造 marker 即使没有证明明确 action label 和 deep link，也可能继续通过发布证据校验。

Decision：

- `verify-release-evidence.sh` 必须强制校验 `SCAN_GOVERNANCE_TIMELINE_SMOKE_OK` 中的 action label 和 deep-link bound 字段。
- `security-regression-check.sh` 必须包含合法新 schema marker，并动态拒绝泛化 action label、deep link unbound 和旧 marker 缺字段。
- 旧 full package `release-evidence/p6-full-release-refresh-20260702-0845` 因缺新字段，不再作为最新 current full authority；下一次必须刷新完整 `release` / `nightly` profile。
- 不新增 release step，不重新跑浏览器，不新增后端 API 或 AuditLogs 未支持的 `toolCallId` 筛选。

Impact：

- 发布证据不能再用“页面可见”替代“证据动作可点击且绑定到正确目标”。
- 每次 governance timeline action marker schema 加严后，必须重新评估 full authority 是否仍通过最新 verifier。
- Focused smoke 可以继续作为增量证据，但不能替代完整 release authority。

Evidence：

- `scripts/verify-release-evidence.sh`
- `scripts/security-regression-check.sh`
- `web-console/tests/scan-governance-timeline-smoke.spec.ts`
- `bash -n scripts/verify-release-evidence.sh scripts/security-regression-check.sh`
- `CI=true make scan-governance-timeline-ui-smoke`
- `./scripts/security-regression-check.sh`
- `make verify-release-evidence DIR=release-evidence/p6-full-release-refresh-20260702-0845` expected FAIL with `candidateReceipt.sourceReportDeepLinkBound must be true`

Review trigger：

- 修改 `SCAN_GOVERNANCE_TIMELINE_SMOKE_OK` marker schema、发布证据 verifier、security regression forged marker、AuditLogs deep link 筛选参数或刷新 full release authority 时复审。

## ADR-UX-013：Scan governance 普通事件动作必须使用明确文案和可复验 deep link

Date：2026-07-02。
Owner：`Product-Luna` / `Arch-Atlas` / `Sec-Sentinel` / `FE-Pixel` / `QA-Orion` / `QA-Gate` / `Lead-Codex`。
Roles：`Product-Luna`、`Arch-Atlas`、`Sec-Sentinel`、`FE-Pixel`、`QA-Orion`、`QA-Gate`、`Lead-Codex`、`QA-Orion/Product-Luna explorer Jason`。
Status：Accepted。

Context：

- CandidateReceipt 已经在 Scan governance timeline、AuditLogs 和 AutoRepair detail 中具备一致复核动作。
- PR Gate、Patch evidence、Agent review 仍存在 `审计`、`任务列表`、`执行详情`、`产物库` 等短标签，用户无法直接判断按钮会打开哪类证据。
- 部分按钮只有 click callback，没有稳定 `data-sl-target-url`，browser smoke 难以证明目标 URL 绑定当前 `projectId + scanTaskId + resourceId`。

Decision：

- Scan governance timeline 中的普通事件必须使用明确动作文案：`打开修复详情`、`打开补丁产物`、`打开执行详情`、`打开 Agent 任务`、`打开审计日志`。
- 普通事件必须暴露可复验 `targetUrl`，且 click 行为必须打开同一个 URL。
- Audit deep link 只能使用 AuditLogs 已支持的 query 参数：`projectId`、`scanTaskId`、`resourceType`、`resourceId`、`action`、`status`、`conversationId`。
- 不为了本轮 UI 收口新增后端 API、数据库 schema 或 AuditLogs 未支持的 `toolCallId` 筛选。

Impact：

- PR Gate、Patch evidence 和 Agent review 的证据落点在 UI、smoke marker 和用户点击行为之间保持一致。
- `validate-frontend-ui.mjs` 拒绝治理事件回退到泛化短标签。
- 后续新增 governance event 时必须同时给出动作 label、targetUrl、smoke 断言和 marker 字段。

Evidence：

- `web-console/src/pages/ScanTaskDetail.tsx`
- `web-console/tests/scan-governance-timeline-smoke.spec.ts`
- `scripts/validate-frontend-ui.mjs`
- `node scripts/validate-frontend-ui.mjs`
- `CI=true make scan-governance-timeline-ui-smoke`

Review trigger：

- 修改 Scan governance timeline 事件模型、AuditLogs query 参数、Artifacts/ExecutionTasks/AgentTasks deep link 语义，或把 AgentToolCall 精确到 toolCallId 时复审。

## ADR-UX-012：Scan governance CandidateReceipt 必须和 AuditLogs 使用一致复核动作

Date：2026-07-02。
Owner：`Product-Luna` / `Arch-Atlas` / `Sec-Sentinel` / `FE-Pixel` / `QA-Orion` / `QA-Gate` / `Lead-Codex`。
Roles：`Product-Luna`、`Arch-Atlas`、`Sec-Sentinel`、`FE-Pixel`、`QA-Orion`、`QA-Gate`、`Lead-Codex`。
Status：Accepted。

Context：

- AuditLogs 中的 `AUTO_REPAIR_CANDIDATE_CREATED` 已新增 `审计候选凭证复核` panel，提供 `打开修复详情`、`打开来源报告`、`QA 复核来源`。
- Scan governance timeline 原先 CandidateReceipt 事件只有单个 `打开修复` 动作。
- 同一个候选凭证在不同页面使用不同动作名和动作集合，会增加用户审查成本。

Decision：

- Scan governance timeline 中的 CandidateReceipt 必须使用和 AuditLogs 一致的动作命名。
- CandidateReceipt 必须提供 `打开修复详情`、`打开来源报告`、`QA 复核来源`。
- `ReportGovernanceEvent` 允许 `actions[]` 多动作，但仅在候选凭证等确实需要复核分流的事件上使用。
- 普通治理事件继续使用单动作，避免全局 UI 膨胀。

Impact：

- 报告治理时间线、AuditLogs 和 AutoRepair 详情的候选凭证复核路径保持一致。
- 后续修改 CandidateReceipt、AuditLogs panel、Project QA deep link 或 AutoRepair deep link 时，需要同时复审 timeline 和 AuditLogs。
- 该决策不改变后端 governance timeline API。

Evidence：

- `web-console/src/pages/ScanTaskDetail.tsx`
- `web-console/src/styles/app.css`
- `web-console/tests/scan-governance-timeline-smoke.spec.ts`
- `scripts/validate-frontend-ui.mjs`
- `node scripts/validate-frontend-ui.mjs`
- `CI=true make scan-governance-timeline-ui-smoke`
- `npm --prefix web-console run build`

Review triggers：

- 修改 `ReportGovernanceEvent`、CandidateReceipt event rendering、AuditLogs candidate receipt panel、`scan-governance-timeline-smoke` marker、AutoRepair detail deep link、Project QA deep link 或 scan report route 时复审。

## ADR-UX-011：AuditLogs 候选凭证事件必须提供复核面板

Date：2026-07-02。
Owner：`Product-Luna` / `Arch-Atlas` / `Sec-Sentinel` / `FE-Pixel` / `QA-Orion` / `QA-Gate` / `Lead-Codex`。
Roles：`Product-Luna`、`Arch-Atlas`、`Sec-Sentinel`、`FE-Pixel`、`QA-Orion`、`QA-Gate`、`Lead-Codex`。
Status：Accepted。

Context：

- AutoRepair 详情页已经有候选来源凭证和 receipt-level 复核动作。
- AuditLogs 页面原本对 `AUTO_REPAIR_CANDIDATE_CREATED` 只展示普通审计抽屉和 Sanitized Input JSON，用户需要手动理解 provenance 字段。
- P10 审计治理要求高价值事件不仅可追踪，还应能快速回到业务上下文。

Decision：

- `AuditLogs` 抽屉必须识别 `AUTO_REPAIR_CANDIDATE_CREATED` 候选凭证事件。
- 命中该事件时必须渲染 `审计候选凭证复核` panel。
- panel 必须从 sanitized `inputJson.provenance` 展示 sourceType、scanTask、目标文件和候选门禁。
- panel 必须提供 `打开修复详情`、`打开来源报告`、`QA 复核来源` 三条动作。
- panel 不得展示原始 prompt、answer 或 diff。

Impact：

- AuditLogs 从“事后日志列表”升级为可执行的候选凭证复核入口。
- 后续重构 AuditLogs、AutoRepair receipt、Scan governance timeline 或 Project QA deep link 时，必须保持审计侧候选凭证复核能力。
- 该决策不新增后端 API，不改变 AuditLog schema。

Evidence：

- `web-console/src/pages/AuditLogs.tsx`
- `web-console/src/styles/app.css`
- `web-console/tests/audit-logs-detail-selection-smoke.spec.ts`
- `scripts/validate-frontend-ui.mjs`
- `node scripts/validate-frontend-ui.mjs`
- `CI=true make audit-logs-detail-selection-ui-smoke`
- `npm --prefix web-console run build`

Review triggers：

- 修改 `AUTO_REPAIR_CANDIDATE_CREATED`、AuditLogs drawer、AuditLog inputJson provenance、AutoRepair detail deep link、Project QA deep link、scan report route 或 audit detail smoke marker 时复审。

## ADR-UX-010：AutoRepair 候选来源凭证必须提供复核动作

Date：2026-07-02。
Owner：`Product-Luna` / `Arch-Atlas` / `Sec-Sentinel` / `FE-Pixel` / `QA-Orion` / `QA-Gate` / `Lead-Codex`。
Roles：`Product-Luna`、`Arch-Atlas`、`Sec-Sentinel`、`FE-Pixel`、`QA-Orion`、`QA-Gate`、`Lead-Codex`。
Status：Accepted。

Context：

- AutoRepair 详情页已有 `Candidate Provenance Receipt`，可以展示候选来自 `PROJECT_QA_VERIFIED_CITATION`、`SCAN_REPORT_RISK` 或人工候选。
- 旧 receipt 主要是只读字段和候选证据门禁，用户需要依赖上方 `来源扫描闭环` 才能回跳报告、QA 或审计。
- P6/P9 主链路要求报告证据、QA 回答、AutoRepair 候选和 AuditLogs 形成可执行复核闭环；receipt 只读会让候选来源审查停在解释层。

Decision：

- `CandidateProvenanceReceipt` 必须提供 `候选凭证复核动作`。
- 扫描绑定候选必须能从 receipt 打开来源报告和 QA 复核凭证。
- 所有候选都必须能从 receipt 打开 AutoRepair 候选审计；扫描绑定候选的审计链接必须带上 `scanTaskId`。
- 该动作栏必须由 Project QA candidate smoke、Report risk candidate smoke 和静态 validator 共同锁住。
- `READY` 只能表示候选来源证据成熟度，不得被解释为 PATCH_READY、测试通过、PR 可提交或 LLM 事实正确。

Impact：

- AutoRepair 候选详情具备自足的来源复核入口，用户不需要在页面其他区域寻找回跳。
- 后续重构 AutoRepair、AuditLogs、Project QA 或报告证据抽屉时，不得移除 receipt-level report/QA/audit deep links，除非提供同等或更强的复核路径。
- 该决策不改变后端 API、AuditLog schema 或数据库结构。

Evidence：

- `web-console/src/pages/AutoRepairs.tsx`
- `web-console/src/styles/app.css`
- `web-console/tests/project-qa-autorepair-candidate-smoke.spec.ts`
- `web-console/tests/report-autorepair-candidate-smoke.spec.ts`
- `scripts/validate-frontend-ui.mjs`
- `node scripts/validate-frontend-ui.mjs`
- `CI=true make project-qa-autorepair-candidate-ui-smoke`
- `CI=true make report-autorepair-candidate-ui-smoke`
- `npm --prefix web-console run build`

Review triggers：

- 修改 `CandidateProvenanceReceipt`、`AutoRepairSourceBridge`、AutoRepair audit deep link、Project QA deep link、scan report route、candidate receipt smoke marker 或 AutoRepair 详情移动端布局时复审。

## ADR-UX-009：Report evidence readiness 必须驱动抽屉动作

Date：2026-07-02。
Owner：`Product-Luna` / `FE-Pixel` / `QA-Orion` / `QA-Gate` / `Lead-Codex`。
Roles：`Product-Luna`、`FE-Pixel`、`QA-Orion`、`QA-Gate`、`Lead-Codex`。
Status：Accepted。

Context：

- `ScanTaskDetail` 报告证据抽屉已有 `Citation Readiness`，可以判断当前证据是 READY、REVIEW 还是 GAP。
- 旧抽屉底部动作固定展示 QA、复制和修复/定位按钮，用户需要自己理解 readiness 和修复候选之间的关系。
- 当 code_chunks 缺口存在时，固定修复入口会削弱 P6 证据链质量要求，也不符合 P9 产品可操作性标准。

Decision：

- 报告证据抽屉必须用 `ReportEvidenceActionRail` 把 readiness 转成用户动作。
- READY 才允许 file-bound report risk 在抽屉中展示 `生成修复候选`。
- REVIEW/GAP 只能引导 QA 复核和复制证据，不显示修复候选入口。
- Browser smoke 必须覆盖 READY repair visible 和 GAP repair hidden。

Impact：

- 报告证据到 QA、再到 AutoRepair 的链路更加明确。
- 用户不会在证据缺口状态下从抽屉直接进入修复候选。
- 该决策不改变报告风险表格外部的现有入口，不改变后端 AutoRepair 协议。

Evidence：

- `web-console/src/pages/ScanTaskDetail.tsx`
- `web-console/src/styles/app.css`
- `web-console/tests/report-evidence-drawer-smoke.spec.ts`
- `scripts/validate-frontend-ui.mjs`
- `node scripts/validate-frontend-ui.mjs`
- `CI=true make report-evidence-drawer-ui-smoke`
- `npm --prefix web-console run build`

Review triggers：

- 修改 `ReportCitationReadiness`、`ReportEvidenceDrawer`、report risk repair entry、AutoRepair candidate deep link、report evidence drawer smoke marker 或移动端抽屉动作布局时复审。

## ADR-UX-008：Project QA 可信度摘要必须提供可执行下一步动作

Date：2026-07-02。
Owner：`Product-Luna` / `FE-Pixel` / `QA-Orion` / `QA-Gate` / `Lead-Codex`。
Roles：`Product-Luna`、`FE-Pixel`、`QA-Orion`、`QA-Gate`、`Lead-Codex`。
Status：Accepted。

Context：

- Project QA 已经展示 `QA Trust Summary`、引用覆盖审计、主张引用质量和修复证据门禁。
- 这些面板能解释证据状态，但用户仍需要自己判断下一步该进入 AutoRepair、重新检索 code_chunks、重试问题还是恢复到输入框。
- P6 的报告引用质量如果不能转化为用户可执行路径，仍会停留在“技术指标可见”，无法形成产品级主链路闭环。

Decision：

- Project QA assistant message 必须在可信度摘要后展示 `QA 下一步动作`。
- `TRUSTED` 必须允许从动作栏直接生成 AutoRepair 候选，并绑定 `PROJECT_QA_VERIFIED_CITATION` provenance。
- `REVIEW` 和 `BLOCKED` 必须提供重新检索、重试和恢复输入等修复路径，且不得显示可点击的修复候选入口。
- 动作栏三态、READY deep link 和非 READY 隐藏修复候选必须由 browser smoke 和静态 validator 共同锁住。

Impact：

- QA 可信度从只读解释升级为可执行工作流。
- 后续重构 Project QA、报告证据抽屉或 AutoRepair 候选入口时，不得移除这条动作桥，除非提供同等或更强的用户动作闭环。
- 该决策不改变后端协议，不把 TRUSTED 升级为 PATCH_READY 或事实语义裁判。

Evidence：

- `web-console/src/pages/ProjectDetail.tsx`
- `web-console/src/styles/app.css`
- `web-console/tests/project-qa-autorepair-candidate-smoke.spec.ts`
- `scripts/validate-frontend-ui.mjs`
- `node scripts/validate-frontend-ui.mjs`
- `CI=true make project-qa-autorepair-candidate-ui-smoke`

Review triggers：

- 修改 `QaTrustSummary`、`qaRepairEvidenceGate`、Project QA 消息渲染、AutoRepair citation deep link、`project-qa-autorepair-candidate-smoke` marker 或 ActionButton 响应式策略时复审。

## ADR-AGENT-037：Scan governance timeline events 必须在前端二次 scan-bound 过滤

Date：2026-07-02。
Owner：`FE-Pixel` / `Sec-Sentinel` / `QA-Gate` / `Lead-Codex`。
Roles：`FE-Pixel`、`Sec-Sentinel`、`QA-Gate`、`Ops-Harbor`、`Lead-Codex`。
Status：Accepted。

Context：

- `ScanTaskGovernanceTimelineService` 已按 current scan 聚合 AutoRepair、Agent、Artifact、AuditLog 和 Execution evidence。
- QA-Gate/Franklin 只读复核指出：前端 resources 已过滤 current scan，但 `timeline.events` 直接消费后端返回；如果后端或 fixture 误混入 foreign candidate receipt event，前端缺少最后一道展示层防御。
- Candidate receipt marker 已要求 `foreignReceiptHidden=true`，但旧 smoke 的 foreign receipt 只在 resources/audit logs 中，未覆盖后端 `timeline.events` 混入场景。

Decision：

- `ScanTaskDetail` 必须在接收 aggregate `timeline.events` 时按当前 `projectId + scanTaskId` 过滤。
- `buildReportGovernanceEvents` 渲染构建层也必须再次过滤 `timeline.events`，避免未来状态写入重构绕过边界。
- Candidate receipt deep link 必须使用当前页面 `projectId + scanTaskId + repairId`，而不是信任未过滤 event 里的 project/scan 字段。
- `SCAN_GOVERNANCE_TIMELINE_SMOKE_OK.candidateReceipt` 必须强校验非空 `repairEvidenceGateReason`，防止 READY/SERVER_DERIVED 缺少用户可复核原因。

Impact：

- 即使 aggregate API 误返回 foreign timeline event，前端治理时间线也不会展示。
- Release verifier 会拒绝缺 candidate gate reason 的伪造 OK marker。
- 不新增 DB schema、release step 或后端 endpoint；仍复用 scan governance timeline aggregate API。

Evidence：

- `web-console/src/pages/ScanTaskDetail.tsx`
- `web-console/tests/scan-governance-timeline-smoke.spec.ts`
- `scripts/verify-release-evidence.sh`
- `scripts/security-regression-check.sh`
- `scripts/validate-frontend-ui.mjs`
- `CI=true make scan-governance-timeline-ui-smoke`：PASS

Review triggers：

- Scan governance aggregate API schema、candidate receipt event schema、AutoRepair deep link contract、release evidence marker schema 或前端治理时间线渲染路径变化时复审。

## ADR-AGENT-036：Source location probes 对 release/nightly 证据包变为必选门禁

Date：2026-07-02。
Owner：`Ops-Harbor` / `QA-Gate` / `Sec-Sentinel` / `Lead-Codex`。
Roles：`Ops-Harbor`、`QA-Gate`、`Sec-Sentinel`、`AI-Vector`、`Lead-Codex`。
Status：Accepted。

Context：

- ADR-AGENT-034 已把 `PUBLIC_REPO_SMOKE_OK.chunkSearch.sourceLocationProbes` 接入 public repo smoke marker，但 verifier 采用 optional strict 以兼容历史 evidence。
- Focused live evidence `release-evidence/p6-source-location-probes-20260702-143649` 已证明两类 probe 在真实 public repo smoke 中可用。
- 正式 release/nightly 证据包如果仍允许省略该字段，会削弱 P6 “从浏览器 source URL / anonymous stack frame 回到代码证据”的发布证明。

Decision：

- `release-evidence.sh` 的 manifest schema 升级为 `release_evidence_profile_schema=2`。
- schema 2 manifest 必须声明 `public_repo_source_location_probes_required`。
- `release` 与 `nightly` profile 必须设置 `public_repo_source_location_probes_required=true`；`local` 与 `ci` 默认 false，但可在 focused probe 中手工打开严格校验。
- `verify-release-evidence.sh` 继续兼容 schema 1 历史包；schema 1 缺少该字段不失败。
- 当 `public_repo_source_location_probes_required=true` 且 `public-repo-smoke=OK` 时，缺失 `chunkSearch.sourceLocationProbes` 必须 fail closed。

Impact：

- 下一次 full release/nightly authority refresh 会强制证明 `standaloneBrowserSourceUrl` 与 `anonymousWebpackStackFrame` 两类 source location probes。
- 已归档 schema 1 evidence 不会被新门禁破坏。
- 不新增 release step、DB schema 或前端依赖；仍复用 `public-repo-smoke` marker。

Evidence：

- `scripts/release-evidence.sh`
- `scripts/verify-release-evidence.sh`
- `scripts/security-regression-check.sh`
- `release-evidence/p6-source-location-probes-20260702-143649`：schema 1 historical compatibility verifier PASS
- `release-evidence/schema2-source-location-gate-20260702-145515`：schema 2 lightweight verifier PASS
- `./scripts/security-regression-check.sh`：PASS

Review triggers：

- release evidence manifest schema、public repo smoke marker schema、`sourceLocationProbes` probe kinds、release/nightly profile defaults、public repo smoke runtime 或 full authority refresh 策略变化时复审。

## ADR-AGENT-035：Raw Code QA 可以是 PARTIAL，但 required claim 必须 PRIMARY_BOUND

Date：2026-07-02。
Owner：`AI-Vector` / `QA-Gate` / `Sec-Sentinel` / `Lead-Codex`。
Roles：`AI-Vector`、`QA-Gate`、`Sec-Sentinel`、`Ops-Harbor`、`Lead-Codex`。
Status：Accepted。

Context：

- Focused release evidence `release-evidence/p6-source-location-probes-20260702-143649` 的真实 public repo marker 中，raw `codeQa.citationCoverage.status=PARTIAL`。
- 该 marker 有 4 个 primary evidence files，但回答只引用了 1 个 primary file；同时 `claimCitationCoverage.status=READY` 且 `claimCitationCoverage.roleDistribution.status=PRIMARY_BOUND`。
- 旧 verifier 要求 `citedPrimaryEvidenceFileCount >= primaryEvidenceFileCount`，等价于要求 answer-level 引用覆盖全部 primary files，导致真实 focused evidence 被错误拒绝。

Decision：

- raw `PUBLIC_REPO_SMOKE_OK.codeQa.citationCoverage` 允许 `FULL` 或 `PARTIAL`。
- raw answer-level coverage 必须至少引用一个 primary file，且 `citedPrimaryEvidenceFileCount` 不得超过 `primaryEvidenceFileCount`。
- required claim 的可信边界继续由 `claimCitationCoverage.status=READY`、`claimCoveragePercent>=100`、`requiredPrimaryBoundClaimCount=requiredClaimCount` 和 `roleDistribution.status=PRIMARY_BOUND` 强制证明。
- UI/report evidence marker 中已声明 required coverage 100% 的路径仍保留更强约束；本决策只修正 raw public repo Code QA marker。

Impact：

- Release verifier 与真实 public repo fallback/partial citation 行为一致。
- 不放宽 required claim gate，不把 context-only、unknown 或 uncited required claim 误判为 READY。
- Security regression 增加 raw Code QA `PARTIAL + PRIMARY_BOUND` 正向 fixture，防止未来回归到 FULL-only。

Evidence：

- `release-evidence/p6-source-location-probes-20260702-143649`
- `scripts/verify-release-evidence.sh`
- `scripts/security-regression-check.sh`
- `docs/PRODUCT_PROGRESS_LOG.md`
- `./scripts/verify-release-evidence.sh release-evidence/p6-source-location-probes-20260702-143649`：PASS
- `./scripts/security-regression-check.sh`：PASS

Review triggers：

- `CodeQaCitationCoverage`、`CodeQaClaimCitationCoverage`、raw `PUBLIC_REPO_SMOKE_OK.codeQa` schema、claim role distribution、release verifier、public repo smoke QA query 或 UI/report marker required coverage 语义变化时复审。

## ADR-AGENT-034：Source location probes 进入 public repo smoke marker

Date：2026-07-02。
Owner：`AI-Vector` / `Ops-Harbor` / `Sec-Sentinel` / `QA-Gate` / `Lead-Codex`。
Roles：`AI-Vector`、`Ops-Harbor`、`Sec-Sentinel`、`QA-Gate`、`Lead-Codex`。
Status：Accepted。

Context：

- `CodeChunkRanker` 已修复 browser/Vite/webpack source URL 中 dev-server port 被误识别为代码行号的问题。
- 仅有单元测试不足以证明 public repo 主链路真实 API 检索能处理用户从浏览器控制台复制的 source URL 或 anonymous stack frame。
- release verifier 需要防止 forged `PUBLIC_REPO_SMOKE_OK` 只保留旧 `roleProbes`，却省略 P6 source location 合同。

Decision：

- `public-repo-analysis-smoke.sh` 在 `PUBLIC_REPO_SMOKE_OK.chunkSearch.sourceLocationProbes` 输出两类真实 API probe：`standaloneBrowserSourceUrl` 与 `anonymousWebpackStackFrame`。
- 每个 probe 只记录结构化证据：`kind/status/matched/queryShape/scanTaskId/resultCount/targetFile/targetLine/matchedFile/matchedStartLine/matchedEndLine/matchedEvidenceType`，source URL probe 额外记录 `expectedPort`，不记录原始 URL 或原始 stack trace。
- Smoke 生成侧必须实际跑通两类 probe 才能产出 OK marker。
- `verify-release-evidence.sh` 过渡期采用 optional strict：历史 evidence 可缺省；新 marker 一旦包含 `sourceLocationProbes`，必须通过 safe path、scanTaskId、matched range、source evidence type、duplicate kind 和 dev-server port 不落入 matched line range 校验。
- `security-regression-check.sh` 必须覆盖 forged marker 负例，包括重复 kind、scan mismatch、unsafe path、matched file mismatch、line outside range、resultCount=0、matched=false、port treated as line 和非法 evidence type。

Impact：

- P6 code_chunks 检索质量从后端单测升级为公开仓库 smoke 证据。
- 兼容历史 full authority evidence，同时为下一次 release/nightly authority refresh 提供 required gate 升级路径。
- 不执行 URL、不访问远端、不把原始 stack trace 写入 release marker，避免引入 SSRF 或敏感日志风险。

Evidence：

- `scripts/public-repo-analysis-smoke.sh`
- `scripts/verify-release-evidence.sh`
- `scripts/security-regression-check.sh`
- `docs/PHASE_REQUIREMENTS.md`
- 子 agent `Hypatia / 019f2178-67ac-7492-a0cd-34db6706ac39` 只读 QA-Gate 审查

Review triggers：

- `PUBLIC_REPO_SMOKE_OK.chunkSearch` schema、release/nightly authority profile、`CodeChunkRanker` source URL parsing、stack trace parsing、public repo smoke cleanup/retention 策略或 release verifier marker version 发生变化时复审。

## ADR-AGENT-033：Browser source URL 端口不得作为 code chunk 行号

Date：2026-07-02。
Owner：`AI-Vector` / `QA-Orion` / `BE-Forge` / `Lead-Codex`。
Roles：`AI-Vector`、`QA-Orion`、`BE-Forge`、`QA-Gate`、`Lead-Codex`。
Status：Accepted。

Context：

- P6 要求支持 `file:line`、`file:line:column`、`Class#method`、Java/JS stack trace 检索。
- 用户常从浏览器控制台、Vite overlay 或 webpack stack trace 复制 `http://localhost:3000/src/generated/api-client.ts:3402:17` 这类 source URL。
- 旧 line hint 正则会把所有 `:number` 都当行号候选，导致 `localhost:3000` 的端口可能和真实 `:3402` 行号竞争；同文件存在覆盖 3000 行附近的 chunk 时，端口会误导排序。

Decision：

- 在 `CodeChunkRanker` 的 line hint 和 token 清理前剥离 `scheme://host:port/` 中的 port。
- 匿名 stack frame 和 standalone browser/source URL 可以提取文件名进入 method/file anchor 候选补池。
- stack/source URL 文件 hint 必须限定在 stack/source URL 语境触发，不得把报告 `filePath:` 行误当作 stack frame，避免额外 DB 查询和证据锚点污染。
- 不执行 URL、不访问远端、不引入 SSRF 面；该能力仅解析用户输入字符串中的文件、方法、行号和列号信号。

Impact：

- Project QA / code_chunks 搜索对真实调试输入更稳定，尤其是 Vite/webpack/browser 控制台复制粘贴路径。
- 保留已有 `file:line`、`file:line:column`、`line 90`、`第90行`、Java stack trace 和 `Class#method` 行为。
- 后续若把 stack trace probe 纳入 public repo smoke，应保持端口误判为 0 的断言。

Evidence：

- `backend-spring/src/main/java/com/sourcelens/module/analysis/service/CodeChunkRanker.java`
- `backend-spring/src/test/java/com/sourcelens/CodeChunkServiceTest.java`
- `mvn -q -f backend-spring/pom.xml -Dtest=CodeChunkServiceTest test`：PASS
- 子 agent `Bernoulli / 019f216a-589b-7c11-9845-4bf56f03b756` 只读审查建议

Review triggers：

- `PATH_LINE_HINT_PATTERN`、stack trace parsing、source URL parsing、`methodAnchorFileHints`、`listMethodAnchorCandidates`、Project QA playbook 或 public repo smoke 的 stack/source URL probe 发生变化时复审。

## ADR-AGENT-031：Project QA 可信度摘要只做产品聚合，不做事实裁判

Date：2026-07-02。
Owner：`Product-Luna` / `FE-Pixel` / `Lead-Codex`。
Roles：`Product-Luna`、`FE-Pixel`、`QA-Orion`、`QA-Gate`、`Lead-Codex`。
Status：Accepted。

Context：

- Project QA 已具备 answer-level citation coverage、claim citation coverage、claim role distribution 和 repair evidence gate。
- 这些字段适合 release verifier 和工程审计，但用户需要先看到“这条回答能不能采信、能不能进入修复复核”的可读结论。
- 直接把摘要升级为 LLM 事实判断或 AutoRepair/PR hard gate 会扩大 P6/P9 范围，并混淆 deterministic evidence binding 与事实正确性。

Decision：

- 在 `ProjectDetail` 增加 `QA 可信度摘要`，聚合 `groundingStatus`、`citationEnforcementStatus`、required coverage、claim coverage、PRIMARY 绑定、来源锚点和 repair gate。
- 只有所有关键检查满足时才显示 `可采信并进入修复复核`；缺引用、缺 PRIMARY、无效引用或 repair gate blocked 时显示 `需要人工复核` 或 `不可直接采信`。
- 摘要位于底层 `引用覆盖审计` 和 `主张引用质量` 之前，作为用户第一眼的产品判断；底层审计和 release marker 仍是权威证据。
- 本轮不改后端 API、DB schema、release marker schema、AutoRepair gate 或 PR gate。

Impact：

- 用户不需要先理解 `PRIMARY_BOUND`、`requiredEvidenceCoveragePercent`、`claimCoveragePercent` 等字段，也能判断回答的使用边界。
- QA/report evidence flow 的体验更接近产品级工作台，而不只是调试面板。
- 未来如果要把摘要纳入 release marker 或 live public repo UI 子门禁，应追加验证合同。

Evidence：

- `web-console/src/pages/ProjectDetail.tsx`
- `web-console/src/styles/app.css`
- `web-console/tests/report-evidence-drawer-smoke.spec.ts`
- `web-console/tests/public-repo-ui-smoke.spec.ts`
- `scripts/validate-frontend-ui.mjs`
- `docs/PRODUCT_PROGRESS_LOG.md`

Review triggers：

- `claimCitationCoverage`、`citationCoverage`、`qaRepairEvidenceGate`、source evidence anchor、Project QA UI smoke、release marker schema 或 AutoRepair/PR gate 发生变化时复审。

## ADR-AGENT-032：报告证据 QA READY 必须使用行级锚点和收敛 PRIMARY 边界

Date：2026-07-02。
Owner：`Product-Luna` / `Arch-Atlas` / `BE-Forge` / `FE-Pixel` / `QA-Gate` / `Lead-Codex`。
Roles：`Product-Luna`、`Arch-Atlas`、`BE-Forge`、`FE-Pixel`、`QA-Orion`、`QA-Gate`、`Ops-Harbor`、`Lead-Codex`。
Status：Accepted。

Context：

- Project QA Trust Summary mock UI 已能显示 `可采信并进入修复复核`，但 live public repo smoke 暴露两个真实问题。
- 第一，报告证据 QA 把多个 Top chunks 都标为 `PRIMARY`，导致 answer 只引用目标文件主 chunk 时，required evidence 被跨文件候选错误拉低。
- 第二，public repo UI smoke 只传 `evidenceFile`，没有传报告证据抽屉 code chunk 的行号，导致后端只能返回 `REPORT_FILE_ANCHOR`，trust summary 正确降级为 `需要人工复核`。

Decision：

- 报告证据 QA 携带 `evidenceRef.filePath` 时，后端 `PRIMARY` 边界收敛到报告锚点文件中的最高优先级 chunk；其他同文件或跨文件候选保留为 `ADJACENT_CONTEXT`。
- 携带 `evidenceRef.lineNumber` 时，优先选择覆盖该行的锚点 chunk；只有找不到锚点文件时才回退到普通 QA 的多 PRIMARY 口径。
- public repo UI smoke 必须从报告证据抽屉返回的 code chunk 中读取 `startLine`，作为 QA `evidenceLine`，并强校验 request/response 的 `sourceEvidenceRef.lineNumber` 与 `sourceEvidenceMatchType=REPORT_LINE_ANCHOR`。
- `QA 可信度摘要` 的 READY 状态继续要求 `REPORT_LINE_ANCHOR`；`REPORT_FILE_ANCHOR` 只能进入人工复核。

Impact：

- 报告证据 -> QA -> 修复候选链路能证明行级来源锚点，避免文件级证据被误用为 repair-ready。
- 多 Top chunks 仍能作为上下文展示和审计，但不会扩大 report evidence QA 的 required evidence 口径。
- 不新增 DB schema，不改变 AutoRepair/PR hard gate，不声明 LLM 事实正确性。

Evidence：

- `backend-spring/src/main/java/com/sourcelens/module/agent/controller/CodeQaController.java`
- `backend-spring/src/test/java/com/sourcelens/CodeQaControllerTest.java`
- `web-console/tests/public-repo-ui-smoke.spec.ts`
- `scripts/validate-frontend-ui.mjs`
- `docs/PRODUCT_PROGRESS_LOG.md`
- live retained sample：`projectId=264/repositoryId=225/scanTaskId=197`

Review triggers：

- report evidence drawer 数据结构、Project QA evidenceRef 参数、`sourceEvidenceMatchType` 语义、citation coverage required 口径、public repo UI smoke marker 或 AutoRepair candidate gate 发生变化时复审。

## ADR-AGENT-030：Code QA fallback 运行提示不作为 required code claim

Date：2026-07-02。
Owner：`Halley` / `Lead-Codex`。
Roles：`BE-Forge`、`AI-Vector`、`QA-Orion`、`Sec-Sentinel`、`Ops-Harbor`、`Lead-Codex`。
Status：Accepted。

Context：

- 真实 public repo API smoke 首轮样本 `projectId=259/repositoryId=220/scanTaskId=192` 暴露 `claimCitationCoverage.status=REVIEW`。
- 根因不是 public repo 扫描失败，而是 fallback 回答中的运行提示句包含“配置、代码、扫描”等词，被 `CODE_FACT_PATTERN` 识别为 required code claim。
- 同时 fallback 证据句把 `[C1]` 放在 `.java` 文件路径后，`CLAIM_SPLIT_PATTERN` 在文件扩展名后切句，导致主证据句与引用标签分离。

Decision：

- 增加窄范围 `OPERATIONAL_FALLBACK_CLAIM_PATTERN`，只排除明确的运行提示：未配置 LLM、请激活大模型、已先检索代码片段、LLM 调用失败、检查配置/网络、错误信息。
- 不放宽 `CODE_FACT_PATTERN`，不跳过所有 `FALLBACK_CITED`，不把真实代码事实从 required claim audit 中移除。
- fallback 证据句统一写成 `已检索到可用代码证据 [C1]，优先复核 ...`，让引用标签与证据主张处于同一句主干。
- 测试必须同时覆盖无模型配置 fallback、LLM 异常 fallback 和真实未引用代码主张仍然 `REVIEW` 的负例。

Impact：

- Project QA 在没有可用 LLM 或 provider 临时失败时仍能给出可审计的代码证据摘要。
- 运行时状态说明不会污染 required claim 计数；真实代码主张仍保持 fail-closed 引用要求。
- 不新增 schema、权限、release step 或 LLM 事实裁判。

Evidence：

- `backend-spring/src/main/java/com/sourcelens/module/agent/controller/CodeQaController.java`
- `backend-spring/src/test/java/com/sourcelens/CodeQaControllerTest.java`
- `docs/PRODUCT_PROGRESS_LOG.md`
- `docs/AGENT_ACTIVITY_LOG.md`
- `docs/AGENT_STATUS_BOARD.md`

Review triggers：

- fallback 文案、`CLAIM_SPLIT_PATTERN`、`CODE_FACT_PATTERN`、citation label 格式、LLM 配置失败路径、public repo smoke Code QA marker 或 claim citation schema 发生变化时复审。

## ADR-AGENT-029：Claim citation role distribution 先作为 PRIMARY 绑定审计

Date：2026-07-02。
Owner：`QA/Security-Turing` / `Lead-Codex`。
Roles：`QA-Orion`、`Sec-Sentinel`、`Arch-Atlas`、`FE-Pixel`、`Lead-Codex`。
Status：Accepted。

Context：

- `claimCitationCoverage` 已能证明 required claim 是否绑定有效 `[C*]` label 和文件，但不能区分该 claim 引用的是 `PRIMARY` 主证据还是 `ADJACENT_CONTEXT`。
- `citationCoverage.evidenceRoleDistribution` 已能做 answer-level role/file 分布，但它不能回答“每条 required claim 是否由 PRIMARY 支撑”。
- 直接让 LLM 判断引用语义充分会引入不稳定性和额外成本；把该字段做成 AutoRepair/PR hard gate 会扩大当前 P6 范围。

Decision：

- 在 `claimCitationCoverage` 下新增 `roleDistribution`，从当前响应的 `sourceLabel -> contextRole/filePath` 确定性派生。
- `PRIMARY_BOUND` 表示每个 required claim 至少绑定一个 `PRIMARY` 文件；`MIXED_CONTEXT/CONTEXT_ONLY/UNKNOWN_ROLE_PRESENT` 只是审计信号。
- Frontend 在“主张引用质量”内展示“主张证据角色分布”。
- `PUBLIC_REPO_SMOKE_OK.codeQa`、`PUBLIC_REPO_UI_SMOKE_OK` 和 `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK` 必须输出并由 release verifier 强校验该分布。
- Raw public repo Code QA marker 不能只验证 answer-level `citationCoverage.evidenceRoleDistribution`；还必须验证 claim-level `claimCitationCoverage.roleDistribution.status=PRIMARY_BOUND`、required claim primary bound count 覆盖 required claim count、role/file entries 与父级 claim coverage 一致。
- Security regression 必须拒绝缺字段、伪造 context-only 为 PRIMARY、unverified path 伪造 PRIMARY 和计数不一致。

Impact：

- QA 报告引用质量从“有引用”升级为“required claim 是否绑定主证据”。
- 不新增 DB schema、migration、索引或后端权限语义。
- 不改变 AutoRepair 的服务端 gate；后续如要接入 hard gate，必须另起 ADR。

Evidence：

- `backend-spring/src/main/java/com/sourcelens/module/agent/dto/CodeQaClaimCitationCoverage.java`
- `backend-spring/src/main/java/com/sourcelens/module/agent/controller/CodeQaController.java`
- `backend-spring/src/test/java/com/sourcelens/CodeQaControllerTest.java`
- `web-console/src/pages/ProjectDetail.tsx`
- `scripts/public-repo-analysis-smoke.sh`
- `web-console/tests/report-evidence-drawer-smoke.spec.ts`
- `web-console/tests/public-repo-ui-smoke.spec.ts`
- `scripts/verify-release-evidence.sh`
- `scripts/security-regression-check.sh`

Review triggers：

- `contextRole` 枚举、citation label 生成、`claimCitationCoverage` schema、report/public smoke marker、AutoRepair gate 或 PR gate 发生变化时复审。
- 若要引入 LLM semantic judge、事实充分性评分或 hard gate，必须追加新 ADR。

## ADR-AGENT-028：Citation evidence role distribution 作为审计分布，不作为 LLM 事实裁判

Date：2026-07-02。
Owner：`QA/Security-Averroes` / `Lead-Codex`。
Roles：`Product-Luna`、`Arch-Atlas`、`QA-Orion`、`Sec-Sentinel`、`FE-Pixel`、`Lead-Codex`。
Status：Accepted。

Context：

- `citationCoverage` 已能统计 required/primary/context/file coverage，但用户仍无法快速判断回答是否真正引用 PRIMARY 主证据，还是只引用了 ADJACENT_CONTEXT。
- 报告证据 QA 和公开仓库 smoke 需要可被 release verifier 防伪的结构化分布，而不是只靠前端标签。
- 直接让 LLM 判断引用是否“语义充分”会引入不稳定性、成本和误判；把该字段变成 AutoRepair/PR hard gate 会过早扩大 P6 范围。

Decision：

- 在 `citationCoverage` 下新增 `evidenceRoleDistribution`，包含 `status`、角色级 `roles[]` 和文件级 `files[]`。
- 该字段只从结构化 citations/retrieved chunks 的 `contextRole/filePath/citedByAnswer` 确定性计算。
- Release verifier 必须强校验父级 file counts 与 distribution counts 一致。
- Verified marker 必须证明 PRIMARY 文件被引用；report unverified marker 必须证明 `maxCitedFileCount/maxCitedPrimaryFileCount/maxCitedContextFileCount=0`。
- 不新增 DB schema，不做 LLM fact judge，不强制所有问题必须跨文件，不改变 AutoRepair/PR hard gate。

Impact：

- Project QA “引用覆盖审计”可以展示主证据、上下文和文件级引用分布。
- 发布证据能拒绝缺失 distribution、父级计数不一致、未验证回答伪造 cited role/file count。
- 后续如需 claim-level role stats，应作为独立增量评审，不混入本轮。

Evidence：

- `backend-spring/src/main/java/com/sourcelens/module/agent/dto/CodeQaCitationCoverage.java`
- `backend-spring/src/main/java/com/sourcelens/module/agent/controller/CodeQaController.java`
- `web-console/src/pages/ProjectDetail.tsx`
- `web-console/tests/public-repo-ui-smoke.spec.ts`
- `web-console/tests/report-evidence-drawer-smoke.spec.ts`
- `scripts/public-repo-analysis-smoke.sh`
- `scripts/verify-release-evidence.sh`
- `scripts/security-regression-check.sh`
- `scripts/validate-frontend-ui.mjs`

Review trigger：

- Code QA citation role enum 变化、引入新的 context role、AutoRepair 候选门禁需要消费 role distribution、或未来加入 LLM-based citation sufficiency judge 时复审。

## ADR-AGENT-027：Citation evidence 文件角色分布先做确定性计数，不升级为语义裁判

Date：2026-07-02。
Owner：`Arch-Atlas`。
Roles：`AI-Vector`、`Product-Luna`、`QA-Orion`、`Sec-Sentinel`、`Ops-Harbor`、`Lead-Codex`。
Status：Accepted。

Context：

- `citationCoverage` 已区分 primary/context/required evidence coverage，但还不能量化这些 evidence 分布在哪些文件。
- 用户需要知道 QA 回答是否覆盖必需文件和主证据文件，尤其是报告引用、跨文件检索和 AutoRepair 候选之前。
- Archimedes 建议后续可升级为嵌套 `evidenceRoleDistribution`；Aristotle 建议进一步做 claim-level role stats。但这两项都会扩大 DTO 和 marker schema，本轮先做低风险 deterministic 指标。

Decision：

- 在 `CodeQaCitationCoverage` 上先增加文件角色计数字段：`uniqueEvidenceFileCount`、`citedEvidenceFileCount`、`primaryEvidenceFileCount`、`citedPrimaryEvidenceFileCount`、`contextEvidenceFileCount`、`citedContextEvidenceFileCount`、`requiredEvidenceFileCount`、`citedRequiredEvidenceFileCount`。
- 字段来源只允许使用当前响应的 `CodeQaCitation.filePath/contextRole/citedByAnswer`，不得重新解析 prompt、answer 或代码内容。
- 当存在 primary evidence files 时，required evidence files 以 primary files 为准；没有 primary 时回退全部 evidence files。
- 前端必须在 `引用覆盖审计` 中展示 required file coverage 和 primary file coverage。
- Release verifier/security regression 必须拒绝 verified marker 缺 required/primary file coverage，也必须拒绝 unverified marker 伪造 cited evidence file count。
- 该指标是质量观测和防伪门禁，不强制所有 QA 回答必须跨文件，不证明 LLM 事实正确性，也不作为 AutoRepair / PR hard gate。

Impact：

- P6 QA 引用质量从“证据数量”推进到“证据文件角色覆盖”，用户能更清楚地判断回答是否覆盖主证据文件。
- 发布证据可以离线验证，减少 marker 伪造空间。
- 后续如果要展示 role bucket、role files 或 claim-level role stats，应追加新 DTO/marker 决策，不直接把本轮计数字段解释成完整语义评审。

Evidence：

- `mvn -q -f backend-spring/pom.xml -Dtest=CodeQaControllerTest test`
- `node scripts/validate-frontend-ui.mjs`
- `bash -n scripts/verify-release-evidence.sh && bash -n scripts/security-regression-check.sh`

Review trigger：

- `CodeQaCitation` schema、`contextRole` 枚举、QA smoke marker、release verifier 或 AutoRepair repair evidence gate 变化时复审。
- 若后续实现 `evidenceRoleDistribution.roles/files`、claim-level role stats、LLM semantic judge 或真实 provider quality run，必须追加新 ADR。

## ADR-AGENT-026：Claim citation 文件分布是质量观测，不是强制跨文件门槛

Date：2026-07-02。
Owner：`AI-Vector`。
Roles：`Product-Luna`、`Arch-Atlas`、`BE-Forge`、`FE-Pixel`、`QA-Gate`、`Sec-Sentinel`、`Lead-Codex`。
Status：Accepted。

Context：

- `claimCitationCoverage` 已能证明回答中的必需主张是否绑定有效 `[C*]` 引用，但还不能量化回答实际引用了哪些文件。
- SourceLens 的核心价值是跨文件代码理解；当一个回答声称跨文件关系时，用户需要看到引用文件分布，而不是只看到一组标签。
- 但并非所有问题都应该强制跨文件。单文件 API、单类逻辑、单个配置项的问题，如果强制多文件引用，反而会制造噪声和错误门槛。
- Release evidence 需要防止 verified QA marker 只声明 claim coverage 满分但没有任何文件级 citation；也需要防止 unverified QA marker 伪造文件覆盖。

Decision：

- 在 `claimCitationCoverage` 中增加 citation file distribution 字段：`validCitationFileCount`、`requiredClaimCitationFileCount`、`validCitationFiles`、`requiredClaimCitationFiles`。
- 每个 claim 明细增加 `validSourceFiles`，用于说明该主张绑定的有效引用来自哪些文件。
- `validCitationFileCount` 统计所有有效 citation label 覆盖的文件；`requiredClaimCitationFileCount` 只统计已引用的必需主张覆盖的文件。
- Project QA 前端必须在 `主张引用质量` 面板展示 Files / Required Files，让用户能直接判断回答证据是单文件还是跨文件。
- Project QA -> AutoRepair 的 `生成修复候选` 入口必须复用 `qaRepairEvidenceGate.status=READY`；新响应存在 `claimCitationCoverage` 时，`VERIFIED + citedByAnswer=true` 但 claim status 为 `REVIEW/BLOCKED` 不能进入 AutoRepair 候选。
- Release verifier 和 security regression 必须要求 verified QA marker 的 file count 为正，并要求 report unverified QA marker 的 file count 为 0，拒绝“无文件引用也声明 READY”和“未验证回答伪造文件覆盖”。
- 不把 file count > 1 作为通用 READY 条件。跨文件覆盖是质量观测和后续抽样评估信号，不是所有问题的硬门槛。

Impact：

- 用户可以量化 AI 回答是否真的引用到多文件证据，减少“看似引用充分、实际只围绕单文件”的不透明问题。
- 单文件问题仍可合法 `READY`，避免为了满足跨文件指标而引入无关引用。
- 后续如果要做跨文件语义充分性评估，应在文件分布指标之上新增样本评估或 semantic sufficiency gate，不能用 file count 替代事实/语义评审。

Evidence：

- `mvn -q -f backend-spring/pom.xml -Dtest=CodeQaControllerTest test`
- `bash -n scripts/verify-release-evidence.sh && bash -n scripts/security-regression-check.sh`
- `node scripts/validate-frontend-ui.mjs`
- `npm --prefix web-console run build`
- `npm --prefix web-console run smoke:report-evidence-drawer`

Review trigger：

- `CodeQaClaimCitationCoverage` schema、`answerCitations` schema、citation label 生成规则、report/public smoke marker schema 或 Project QA claim panel 变更时复审。
- 如果未来引入真实跨文件语义充分性评分、LLM-as-judge、向量库检索评估或更多公开仓库 retained samples，必须追加新 ADR。

## ADR-AGENT-025：Project QA 先做确定性主张引用质量，不引入 LLM 事实裁判

Date：2026-07-02。
Owner：`Arch-Atlas`。
Roles：`AI-Vector`、`Product-Luna`、`Sec-Sentinel`、`QA-Gate`、`Lead-Codex`。
Status：Accepted。

Context：

- Project QA 已有 answer-level citations、citation enforcement、required evidence coverage 和 repair evidence gate，但用户仍无法直接判断“回答里的关键主张是否都绑定了有效引用”。
- 直接引入 LLM-as-judge 或外部事实核验会带来不可复现、成本、提示注入和 release evidence 难验证的问题。
- Aristotle `019f2012-708a-7980-b074-c6b170d914ac` 只读复核建议先做 deterministic `claimCitationCoverage`：统计 total/required/cited/uncited/invalid/status，并把 READY 接入前端与发布门禁。

Decision：

- Project QA 当前阶段先实现确定性的 claim-to-citation binding audit，不判断引用语义是否充分，也不把 LLM 评审结论作为发布门禁。
- `CodeQaResponse` 增加 `claimCitationCoverage`，字段包括 `totalClaimCount`、`requiredClaimCount`、`citedRequiredClaimCount`、`uncitedRequiredClaimCount`、`invalidCitationClaimCount`、`claimCoveragePercent`、`status` 和 per-claim 明细。
- `status=READY` 表示必需主张均绑定当前候选中存在的 `[C*]`；`status=REVIEW` 表示有必需主张未绑定引用；`status=BLOCKED` 表示存在无效引用标签。
- Project QA 前端必须展示 `主张引用质量` 面板；AutoRepair 修复证据门禁必须对 `BLOCKED` fail closed。
- Release verifier 和 security regression 必须校验 report/public QA marker 的 `claimCitationCoverage`，拒绝缺字段、低 coverage、错误 status、invalid citation 和 unverified 伪造 READY/满覆盖。

Impact：

- 用户获得可解释的“主张是否绑定引用”信号，减少把任意引用误当可信回答的风险。
- 发布证据变得可离线验证，不依赖外部模型裁判。
- 后续如果需要语义充分性评估，可以在该确定性门禁之上另开阶段，不能替代当前 fail-closed 规则。

Evidence：

- `mvn -q -f backend-spring/pom.xml -Dtest=CodeQaControllerTest test`
- `bash -n scripts/verify-release-evidence.sh && bash -n scripts/security-regression-check.sh`
- `node scripts/validate-frontend-ui.mjs`
- `npm --prefix web-console run build`
- `npm --prefix web-console run smoke:report-evidence-drawer`
- `./scripts/security-regression-check.sh`

Review trigger：

- `CodeQaResponse.answer` 格式、citation label 格式、`answerCitations`/`retrievedChunks` schema、AutoRepair evidence gate 或 release marker schema 变化时复审。
- 若未来引入 LLM-as-judge、真实 provider quality run、跨文件语义充分性评分或 QA 历史持久化，必须追加新 ADR。

## ADR-AGENT-024：Project QA 已验证引用可以进入 AutoRepair 候选，但低置信候选不得进入

Date：2026-07-01。
Owner：`Product-Luna`。
Roles：`QA-Orion`、`FE-Pixel`、`Lead-Codex`。
Status：Accepted。

Context：

- Project QA answer citation 已经能展示 `groundingStatus`、`citationEnforcementStatus`、`citedByAnswer` 和 file/line 证据。
- AutoRepair candidate 是写入型自动化链路的入口，不能让低置信、未被回答采用或无法定位文件的 citation 直接进入修复创建。
- Product/QA 子 agent `Sagan` 只读复核结论为 `NEEDS_WORK`：方向可实施，但入口必须 fail-closed，只能在 `VERIFIED + citedByAnswer + filePath + repositoryId` 条件满足时显示；低置信和未被 answer 引用的 citation 必须隐藏入口。
- `AutoRepairsPage` 已有 query-param initial draft 能力，可复用 `projectId/repositoryId/scanTaskId/filePath/targetDesc/source/openCreate`，本轮不需要改后端 DTO/API。

Decision：

- Project QA answer citation 可以提供 `生成修复候选` action，但仅当 answer message 为 `groundingStatus=VERIFIED` 且当前页面不处于 low-confidence grounding。
- citation 必须满足 `citedByAnswer=true`、存在 `filePath`、存在 citation scanTaskId 或 active evidence scanTaskId，并且能从 scan task 解析到 `repositoryId`。
- AutoRepair draft URL 必须携带 `projectId`、`openCreate=1`、`repositoryId`、`scanTaskId`、`filePath`、`source=Project QA verified citation` 和结构化 `targetDesc`。
- `targetDesc` 必须包含 QA citation 来源、文件行号、原始问题和证据说明，避免 AutoRepair candidate 脱离证据上下文。
- 创建成功后 AutoRepairs 页面必须立即选中新创建的 repair，并在 Source Bridge 中显示 `Project QA 已验证引用` 来源，避免提交后用户只看到刷新列表而丢失来源上下文。
- Source Bridge 必须提供绑定当前 scan/repair/file 的 QA 复核和扫描审计深链；这只是前端来源闭环，不等同于后端结构化 provenance receipt。
- `VERIFIED` 但 `citedByAnswer=false` 的 citation 不显示 action；`PARTIAL`、`UNVERIFIED`、`NO_EVIDENCE` 或 retry failed 的低置信结果不显示 action。
- 本轮只做前端 draft bridge 和 focused mock-only smoke，不修改 AutoRepair create API、不实际生成 patch、不提交 PR、不刷新 full release authority。

Impact：

- Project QA 与 AutoRepair 之间新增一个可验证的产品闭环：可信引用可以直接沉淀为修复候选。
- AutoRepair 写入链路入口保持 fail-closed，避免“检索候选”被误认为“已验证修复依据”。
- 新增 `project-qa-autorepair-candidate-ui-smoke`，作为 P6/P9/P3 focused evidence；`release-evidence/release-post-unverified-qa-citation-authority-20260701-135235` 现在仅作为 historical full package。
- 后续如果要证明真实修复质量、patch artifact、PR 或 audit chain，必须单独接入 AutoRepair patch smoke、release evidence 或 public repo live matrix。
- Product/QA 子 agent `Ptolemy` 建议的后端 `AUTO_REPAIR_CANDIDATE_CREATED` audit provenance receipt 被记录为下一阶段候选；在该能力完成前，不得把 `targetDesc` 文本或 URL query source 夸大为结构化持久来源凭证。

Evidence：

- `node scripts/validate-frontend-ui.mjs`
- `npm --prefix web-console run build`
- `CI=true make project-qa-autorepair-candidate-ui-smoke`
- `PROJECT_QA_AUTOREPAIR_CANDIDATE_SMOKE_OK.mockedApiOnly=true`
- `PROJECT_QA_AUTOREPAIR_CANDIDATE_SMOKE_OK.unhandledApiRequests=0`
- `PROJECT_QA_AUTOREPAIR_CANDIDATE_SMOKE_OK.createPayloadBound=true`
- `PROJECT_QA_AUTOREPAIR_CANDIDATE_SMOKE_OK.actionVisibility.verifiedCitedVisible=true`
- `PROJECT_QA_AUTOREPAIR_CANDIDATE_SMOKE_OK.actionVisibility.verifiedUncitedHidden=true`
- `PROJECT_QA_AUTOREPAIR_CANDIDATE_SMOKE_OK.actionVisibility.lowConfidenceHidden=true`
- `PROJECT_QA_AUTOREPAIR_CANDIDATE_SMOKE_OK.createdRepairSelected=true`
- `PROJECT_QA_AUTOREPAIR_CANDIDATE_SMOKE_OK.sourceBridge.visible=true`
- `PROJECT_QA_AUTOREPAIR_CANDIDATE_SMOKE_OK.sourceBridge.qaCitationOriginVisible=true`
- `PROJECT_QA_AUTOREPAIR_CANDIDATE_SMOKE_OK.sourceBridge.scanTaskIdBound=true`
- `PROJECT_QA_AUTOREPAIR_CANDIDATE_SMOKE_OK.sourceBridge.qaDeepLinkBound=true`
- `PROJECT_QA_AUTOREPAIR_CANDIDATE_SMOKE_OK.sourceBridge.auditDeepLinkBound=true`

Review trigger：

- `CodeQaResponse.answerCitations`、`citedByAnswer`、`groundingStatus`、`citationEnforcementStatus`、scan/repository 关系或 AutoRepair query draft contract 变化时复审。
- 该入口接入真实 patch generation、PR 创建、权限系统、审计策略或 release/nightly authority 时复审。
- 公开仓库 live QA matrix 需要证明真实 provider 下该入口不会放大低质量 citation 时复审。
- 后端新增 candidate provenance DTO、audit `AUTO_REPAIR_CANDIDATE_CREATED`、QA 历史持久化或 report risk provenance receipt 时复审。

## ADR-AGENT-023：Project QA 低置信 retry 必须证明恢复到 verified citation

Date：2026-07-01。
Owner：`QA-Orion`。
Roles：`Product-Luna`、`FE-Pixel`、`Lead-Codex`。
Status：Accepted。

Context：

- Project QA 低置信/无证据可见化已由 `PROJECT_QA_LOW_CONFIDENCE_SMOKE_OK` 覆盖，但旧 smoke 只断言 `retry` 按钮可见，没有点击低置信面板 retry。
- `ProjectDetail.tsx` 中低置信面板 `retry` 的真实动作是 `submitQuestion(previousUserQuestion)`，即重新提交同一 QA 问题；它不是重新扫描，也不是 provider 级 retry。
- Product/QA 子 agent `Meitner` 只读复核结论为 `NEEDS_WORK`：必须补“低置信 -> 点击 retry -> `VERIFIED` answer citation”的验收，否则按钮只是静态可见。

Decision：

- `project-qa-low-confidence-ui-smoke` 不再只证明低置信/无证据状态可见，还必须证明低置信面板 retry 可把同一问题恢复到 verified answer citation。
- 首次响应必须保持 downgrade 语义，例如 `PARTIAL/RETRY_FAILED`；点击 `retry` 后第二次响应必须为 `groundingStatus=VERIFIED` 和成功 `citationEnforcementStatus`。
- retry 的请求/响应必须绑定当前 `scanTaskId`，并且 `answerCitations` 至少一条 `citedByAnswer=true`、目标文件可见。
- 低置信 downgrade 响应仍不得新增 `引用已验证`、`首次引用已验证` 或 `回答已引用` 误导文案；retry 成功后的 verified 回答可以合法展示这些文案。
- 本轮只加强 focused mock-only UI evidence，不改运行时代码、后端 provider、检索排序、真实 LLM 或 full authority。

Impact：

- Project QA 的低置信下一步从“看起来有按钮”升级为“按钮行为可验证、能恢复到可信引用状态”的产品证据。
- `PROJECT_QA_LOW_CONFIDENCE_SMOKE_OK` marker 新增 `retryRecovery`，后续接手不得再用旧 marker 口径声称 retry 已被证明。
- 当轮 full release authority 不变，仍为 `release-evidence/release-post-unverified-qa-citation-authority-20260701-135235`；该包现在仅作为 historical full package。

Evidence：

- `node scripts/validate-frontend-ui.mjs`
- `CI=true make project-qa-low-confidence-ui-smoke`
- `PROJECT_QA_LOW_CONFIDENCE_SMOKE_OK.qaRequestCount=8`
- `PROJECT_QA_LOW_CONFIDENCE_SMOKE_OK.groundingStatuses=["NO_EVIDENCE","PARTIAL","UNVERIFIED","VERIFIED"]`
- `PROJECT_QA_LOW_CONFIDENCE_SMOKE_OK.citationEnforcementStatuses=["DIRECT_VERIFIED","NO_EVIDENCE","RETRY_FAILED","UNVERIFIED"]`
- `PROJECT_QA_LOW_CONFIDENCE_SMOKE_OK.retryRecovery.verifiedAfterRetry=true`
- `PROJECT_QA_LOW_CONFIDENCE_SMOKE_OK.retryRecovery.scanTaskIdBound=true`
- `PROJECT_QA_LOW_CONFIDENCE_SMOKE_OK.retryRecovery.citedByAnswer=true`

Review trigger：

- `ProjectDetail` 低置信面板动作、`submitQuestion`、`CodeQaResponse.answerCitations`、`groundingStatus` 或 `citationEnforcementStatus` schema 变化时复审。
- 该 focused smoke 进入 release verifier 或 public repo live QA matrix 时复审。

## ADR-AGENT-022：Project QA/code_chunks 请求失败先以可恢复 UI 状态收口

Date：2026-07-01。
Owner：`Product-Luna`。
Roles：`QA-Orion`、`FE-Pixel`、`AI-Vector`、`Lead-Codex`。
Status：Accepted。

Context：

- ProjectDetail 的代码问答与证据检索是 code_chunks、RAG、报告复盘和 Agent 辅助理解的核心用户入口。
- 低置信/无证据结果已由 `PROJECT_QA_LOW_CONFIDENCE_SMOKE_OK` 证明，但请求级失败仍不够产品化：code_chunks 检索失败只有弱提示，`POST /qa` 失败只进入普通 assistant 文本。
- Product/QA 子 agent `Huygens` 只读复核确认：下一小批次应收在 ProjectDetail QA/code_chunks 状态机与 focused smoke，不改后端、不接真实 provider、不刷新 full authority。
- Huygens 同时指出 `重新扫描后复核` 文案不准确，因为当前按钮实际只触发重新检索证据，不能伪装成重新扫描。

Decision：

- 本轮将 Project QA/code_chunks request/search recoverable states 作为 P6/P9 focused UI increment。
- code_chunks 初始检索失败必须展示 `证据检索失败` 和 `重新检索证据`。
- 已有结果后刷新失败必须保留上次成功结果，并展示 `证据检索刷新失败，已保留上次成功结果`。
- `/qa` 请求失败必须展示独立 `代码问答请求失败` 状态，保留失败问题，并提供 `重试此问题` 与 `恢复到输入框`。
- QA 发送按钮在空问题和 loading 中必须禁用。
- 低置信面板的“重新扫描后复核”改为真实动作“重新检索证据”。
- 本轮只新增 mock-only focused UI smoke，不修改 Code QA 后端、检索排序、embedding、真实 provider、public repo live smoke 或 release authority。

Impact：

- Project QA 从“失败混在聊天文本或红字里”升级为“失败可定位、可恢复、证据上下文不丢失”的核心链路体验。
- 新增 `project-qa-recoverable-ui-smoke`，作为 P6/P9 focused QA UI evidence；不进入当前 full authority。
- `release-evidence/release-post-unverified-qa-citation-authority-20260701-135235` 现在仅作为 historical full package。
- 后续真实 QA 质量、真实 provider、公开仓库泛化样本仍必须单独验证，不能用本轮 UI smoke 替代。

Evidence：

- `node scripts/validate-frontend-ui.mjs`
- `npm --prefix web-console run build`
- `CI=true make project-qa-low-confidence-ui-smoke`
- `CI=true make project-qa-recoverable-ui-smoke`
- `CI=true make app-shell-ui-smoke`
- `PROJECT_QA_RECOVERABLE_SMOKE_OK.mockedApiOnly=true`
- `PROJECT_QA_RECOVERABLE_SMOKE_OK.unhandledApiRequests=0`
- `PROJECT_QA_RECOVERABLE_SMOKE_OK.assertions` 包含 `initial-code-chunk-search-error-state`、`code-chunk-search-retry-recovers-results`、`cached-code-chunk-refresh-error-preserves-results`、`qa-request-error-state` 和 `qa-retry-recovers-answer-citation`。

Review trigger：

- `CodeQaController`、`CodeQaRetrievalService`、`CodeChunkSearchResponse` 或 QA citation schema 变化时复审。
- Project QA 接入真实 provider health、真实 embedding provider 质量门禁、公开仓库 live QA matrix 或 release/nightly authority 时复审。
- QA 页面状态机抽象为共享 recoverable-state 组件规范时复审。

## ADR-AGENT-021：ModelConfig 配置控制面先以可恢复错误态完成 focused P9 收口

Date：2026-07-01。
Owner：`Product-Luna`。
Roles：`QA-Orion`、`FE-Pixel`、`Ops-Harbor`、`Lead-Codex`。
Status：Accepted。

Context：

- `ModelConfig` 是 Agent、QA、AutoRepair 和报告体验的上游模型配置控制面，配置加载、保存、激活和删除失败会直接影响核心链路的可解释性。
- 原页面失败主要依赖 toast，缺少页面内可恢复状态、缓存数据保留语义、Modal 内联失败说明和 focused smoke。
- Product/QA 子 agent `James` 判定该项适合作为小而完整的 P9 增量：范围足够窄，用户价值明确，但不应扩展到真实 provider 质量评估、下游 Agent/AutoRepair 行为或 GitHub App。
- P9 当前需要继续提升“大厂级 UI/产品体验”，但每轮必须有可验证合同，不能只做视觉改色。

Decision：

- 本轮将 `ModelConfig` 的可恢复错误态作为 focused P9 UI increment。
- `GET /api/llm-configs` 初始加载失败必须展示页面内 `模型配置加载失败` 和 retry action。
- 已有配置数据时刷新失败必须保留上次成功表格，并展示 `模型配置刷新失败，已保留上次成功数据`。
- 创建/保存失败必须在 Modal 内联展示可读错误，不只依赖 toast。
- 激活/删除失败必须展示持久页面状态，用户可以重新同步配置。
- 空表格状态使用统一 `StateBlock`，避免 AntD 默认空态与产品语义脱节。
- 本轮只做前端产品体验和 mock-only smoke，不声明真实 provider 可用性、模型质量、Agent/AutoRepair 下游闭环或 full release authority 刷新。

Impact：

- 模型配置页从“失败后只弹 toast”升级为“失败可定位、可恢复、缓存数据不丢失”的控制面体验。
- 新增 `model-config-recoverable-ui-smoke`，作为 P9 focused UI evidence；不进入当前 full authority。
- `release-evidence/release-post-unverified-qa-citation-authority-20260701-135235` 现在仅作为 historical full package。
- 后续如果要证明真实 provider 能力，需要单独做 provider eval、真实配置样本、后端合同和 release evidence，不得用本轮 UI smoke 代替。

Evidence：

- `node scripts/validate-frontend-ui.mjs`
- `npm --prefix web-console run build`
- `CI=true make model-config-recoverable-ui-smoke`
- `CI=true make app-shell-ui-smoke`
- `MODEL_CONFIG_RECOVERABLE_SMOKE_OK.mockedApiOnly=true`
- `MODEL_CONFIG_RECOVERABLE_SMOKE_OK.unhandledApiRequests=0`
- `MODEL_CONFIG_RECOVERABLE_SMOKE_OK.assertions` 包含 `initial-load-error-state`、`retry-recovers-provider-table`、`cached-refresh-error-preserves-table`、`activate-failure-governance-state`、`create-failure-inline-modal-state`、`delete-failure-governance-state` 和 `no-horizontal-overflow`。

Review trigger：

- `ModelConfig` 接入真实 provider health check、真实密钥验证、默认模型路由或 Agent/AutoRepair 下游执行策略时复审。
- `llm-configs` API schema、错误响应格式、权限模型或配置激活语义变化时复审。
- 该 smoke 被纳入 full release/nightly authority，或 P9 UI error-state 模式抽象为共享组件规范时复审。

## ADR-AGENT-020：Report Evidence QA unverified citation schema 必须进入 full authority

Date：2026-07-01。
Owner：`QA-Gate`。
Roles：`Product-Luna`、`Ops-Harbor`、`QA-Orion`、`FE-Pixel`、`Lead-Codex`。
Status：Accepted。

Context：

- ADR-QA-005 已要求 Report Evidence QA 同时暴露 verified 和 unverified citation state。
- 旧 full authority `release-evidence/release-p12pre-full-authority-20260701-024042` 虽通过当时 verifier，但其 `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK` 仍是旧 `qaRequestCount=2` schema，只证明 verified path，缺少 `qaFromEvidence.unverifiedCitation`。
- Goodall-agent/Halley final review 判定：技术发布证据 PASS，但治理发布口径在文档更新前 BLOCKED；当前 authority 必须切换到新包，旧包必须 historical-only。
- Ops-Harbor/Linnaeus the 2nd 和 QA/Sec/Newton the 2nd 分别确认 release verifier 与 security regression 需要覆盖新 marker 和负样本。

Decision：

- `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK` 进入 full authority 时，必须证明 `qaRequestCount=4`。
- release verifier 必须同时强校验 verified path 和 `qaFromEvidence.unverifiedCitation`。
- unverified path 必须证明 `groundingStatuses=["PARTIAL"]`、`citationEnforcementStatuses=["RETRY_FAILED"]`、`uncitedCandidateCount>0`、`expectedEvidenceFileVisible=true` 和 `evidenceRefRequestBound=true`。
- `security-regression-check.sh` 必须阻断旧 `qaRequestCount=2`、缺 `unverifiedCitation`、错误 grounding、错误 enforcement、`uncitedCandidateCount=0` 和 `evidenceRefRequestBound=false` 的伪造 release evidence。
- 当轮 full release authority 更新为 `release-evidence/release-post-unverified-qa-citation-authority-20260701-135235`；该包现在仅作为 historical full package。
- `release-evidence/release-p12pre-full-authority-20260701-024042` 降级为 `historical-only / superseded by unverified QA citation schema`。

Impact：

- 后续发布口径以 `release-post-unverified-qa-citation-authority-20260701-135235` 为准，`required_failures=0`、`optional_warnings=0`、`skipped=3`。
- `release-evidence/release-post-unverified-qa-citation-20260701-134152` 虽 required failures 为 0，但 backup/rollback 为 SKIP，不可作为 current authority。
- GitHub App drill、GitHub webhook drill、真实 LLM provider run 仍是后续高级集成层，不因本 ADR 被视为完成。
- 后续任何修改 Report Evidence QA marker schema、citation enforcement 状态或 release evidence marker 结构的工作，都必须同步升级 verifier/security regression，并刷新 full authority 后才能声明 current authority。

Evidence：

- `CI=true make report-evidence-qa-citation-ui-smoke`
- `npm --prefix web-console run build`
- `./scripts/verify-release-evidence.sh release-evidence/release-post-unverified-qa-citation-authority-20260701-135235`
- `./scripts/security-regression-check.sh`
- Goodall-agent/Halley final review：technical evidence `PASS`，docs-before-update `BLOCKED`
- Old package `release-evidence/release-p12pre-full-authority-20260701-024042` expected failure under current verifier

Review trigger：

- Report Evidence QA marker schema changes.
- `citationEnforcementStatus` or `groundingStatus` semantics change.
- Full release/nightly authority refresh, GitHub App/webhook drill integration, or real LLM provider run integration.

## ADR-AGENT-019：匿名 GitHub public repo clone 的 native git 运行时依赖必须进入安全边界

Date：2026-07-01。
Owner：`Sec-Sentinel`。
Roles：`Ops-Harbor`、`QA-Orion`、`QA-Gate`、`BE-Forge`、`Lead-Codex`。
Status：Accepted。

Context：

- ADR-AGENT-018 已将匿名 GitHub public repo clone 从 JGit 传输层切到系统 `git`，解决 `Premature EOF` 对公开仓库主链路的阻塞。
- Ops-Harbor/Hooke the 2nd 指出：`git` 是 backend runtime 依赖，不应只在运行 release 脚本的宿主机上隐式存在。
- Sec-Sentinel/Harvey the 2nd 指出：native git 可能读取全局 credential helper、Git Credential Manager、global config、HOME 下配置或交互式 askpass，必须显式隔离。
- QA-Orion/Tesla the 2nd 要求缺 git、Docker runtime、preflight 文案和 security regression 静态门禁都可验证。
- Goodall-agent/Zeno the 2nd 恢复会话后认可该增量，并将 runtime git、ambient credential 隔离、错误脱敏、file:// fail-closed、branch 入库前校验列为 PASS 条件。

Decision：

- 系统 `git` CLI 是匿名 GitHub public repo clone 的生产运行时依赖。
- backend Docker runtime 必须安装 `git`。
- `GitService` 执行侧必须读取 `sourcelens.repository.allow-local-file`，生产默认拒绝 `file://`，不能只依赖 repository 保存入口。
- native git clone 必须使用 `ProcessBuilder(List<String>)` 参数数组，不得 shell 拼接；命令必须禁用 credential helper，并使用 HTTP/1.1 shallow single-branch clone。
- native git clone 必须隔离 ambient credentials/global config：`GIT_TERMINAL_PROMPT=0`、`GIT_ASKPASS=/bin/false`、`SSH_ASKPASS=/bin/false`、`GCM_INTERACTIVE=Never`、`GIT_CONFIG_NOSYSTEM=1`、隔离 `HOME`、`GIT_CONFIG_GLOBAL` 和 `XDG_CONFIG_HOME`。
- git/JGit 错误外传前必须经过 `SensitiveDataSanitizer.sanitizeAndTruncate`。
- scan branch 必须在 `ScanTask` 入库前通过 `RepositoryUrlPolicy.validateBranch`。
- `production-preflight.sh`、`public-repo-analysis-smoke.sh` 和 `security-regression-check.sh` 必须锁住以上合同。

Impact：

- 本轮是 focused security evidence，当时不刷新 full release authority。
- 当时 full authority 为 `release-evidence/release-p12pre-full-authority-20260701-024042`；后续已被 ADR-AGENT-020 的 `release-evidence/release-post-unverified-qa-citation-authority-20260701-135235` supersede。
- public repo smoke 继续作为公开仓库 happy path 回归，缺 git 清晰失败由 preflight、smoke fail-fast 和单测/静态门禁共同证明。
- 后续如果切换容器基础镜像、clone 策略或支持更多 Git host，必须复审 native git runtime 依赖和凭据隔离。

Evidence：

- `mvn -Dtest=com.sourcelens.module.repository.service.GitServiceTest,com.sourcelens.ScanTaskServiceTest test`
- `bash -n scripts/production-preflight.sh scripts/public-repo-analysis-smoke.sh scripts/security-regression-check.sh`
- `./scripts/security-regression-check.sh`
- `SOURCELENS_PREFLIGHT_WARN_ONLY=true SOURCELENS_PREFLIGHT_INCLUDE_STATIC_GATES=false ./scripts/production-preflight.sh`
- `cd backend-spring && mvn -DskipTests package`
- Standalone public repo smoke against `http://127.0.0.1:19080`，scanTaskId `169`
- Scoped `git diff --check`

Review trigger：

- 新生成 full release/nightly authority 时复审。
- Docker runtime 镜像、clone 机制、credential 策略或支持 Git host 发生变化时复审。
- GitHub App/private repo clone E2E 正式接入时复审。

## ADR-AGENT-018：P12-pre full authority 必须用单一完整 release 包吸收 backup/rollback 与 public repo smoke

Date：2026-07-01。
Owner：`QA-Gate`。
Roles：`Product-Luna`、`Ops-Harbor`、`QA-Orion`、`BE-Forge`、`Sec-Sentinel`、`Lead-Codex`。
Status：Accepted。

Context：

- ADR-AGENT-017 先用 focused evidence 关闭本地 backup/rollback 信任缺口，但当时没有刷新 full authority。
- Product-Luna/Mencius the 2nd、Ops-Harbor/Parfit the 2nd 和 QA-Orion/Beauvoir the 2nd 均要求不要拼接 focused 包，而要重新生成单一完整 `release` profile evidence。
- 首次 full refresh 包 `release-evidence/release-p12pre-full-authority-20260701-015543` 已补齐 backup/rollback，但 `public-repo-smoke` 因 `Git clone 失败: Premature EOF` 失败，Goodall-agent/Copernicus the 2nd 判定 `BLOCKED`。
- public repo clone 是 SourceLens 公开仓库逆向分析主链路，不可用 focused backup/rollback 证据绕过。

Decision：

- 当前 P12-pre full authority 必须是单一完整 `release` profile evidence 包，不能由旧 full authority 加 focused backup/rollback 包人工拼接。
- 修复匿名 GitHub clone 稳定性：`GitService` 对无 token 的 GitHub HTTPS 仓库默认走受控系统 `git -c http.version=HTTP/1.1 clone --depth 1 --single-branch --branch ...`，并禁用交互式凭据提示；JGit 保留给 `file://` 和 token 场景。
- 当轮 full release authority 更新为 `release-evidence/release-p12pre-full-authority-20260701-024042`；后续已被 ADR-AGENT-020 的 `release-evidence/release-post-unverified-qa-citation-authority-20260701-135235` supersede。
- `release-evidence/release-post-qa-citation-verifier-20260701-073909` 降级为 historical-only。

Impact：

- P12-pre current authority 现在同时覆盖 backup restore drill evidence、rollback plan 和 public repo smoke。
- 当轮发布口径以 `release-p12pre-full-authority-20260701-024042` 为准，`required_failures=0`、`optional_warnings=0`、`skipped=3`；当前发布口径已由 ADR-AGENT-020 接管。
- GitHub App drill、GitHub webhook drill、真实 LLM provider run 仍是后续高级集成层，不因本 ADR 被视为完成。
- 匿名公开仓库 clone 路径从 JGit 传输层切到系统 git，降低 EOF/HTTP2/长时间卡住对核心主链路的影响。

Evidence：

- `mvn -Dtest=com.sourcelens.module.repository.service.GitServiceTest test`
- `cd backend-spring && mvn -DskipTests package`
- Standalone public repo smoke against `http://127.0.0.1:19080`
- `SOURCELENS_RELEASE_EVIDENCE_RUN_ID=release-p12pre-full-authority-20260701-024042 make release-evidence-release`
- `./scripts/verify-release-evidence.sh release-evidence/release-p12pre-full-authority-20260701-024042`
- `./scripts/security-regression-check.sh`
- Goodall-agent/Zeno the 2nd final review `PASS`

Review trigger：

- GitHub App/webhook/真实 LLM provider 任一高级集成进入 full authority 时复审。
- 需要支持非 GitHub 公共仓库或私有仓库 clone 策略时复审。
- 系统 git 不可用的部署环境进入生产目标时复审并补运行时 preflight。

## ADR-AGENT-017：P12-pre backup/rollback 先以 focused evidence 关闭本地信任缺口

Date：2026-07-01。
Owner：`Ops-Harbor`。
Roles：`Product-Luna`、`QA-Orion`、`QA-Gate`、`Sec-Sentinel`、`Lead-Codex`。
Status：Accepted。

Context：

- 当时的 full release authority `release-evidence/release-post-qa-citation-verifier-20260701-073909` 已通过，但其中 `backup-restore-drill-evidence` 和 `rollback-plan` 仍为合理 SKIP；后续已由 ADR-AGENT-018 刷新为 `release-evidence/release-p12pre-full-authority-20260701-024042`。
- Product-Luna/Raman the 2nd 建议优先关闭 P12-pre 本地恢复/回滚信任缺口，而不是继续堆 UI 或提前接 GitHub App。
- Goodall-agent `019f18ff-9d4a-7543-a98b-583162360fc9` 复核上一轮 release authority 为 `PASS`，允许进入下一增量。
- QA-Orion/Descartes the 2nd 指出 verifier 对 backup/rollback OK 行的 `.log` / `.txt` 语义边界不够硬。

Decision：

- 本轮生成 focused local evidence，不刷新 full release authority。
- 当前 focused ops evidence 为 `release-evidence/p12-pre-backup-rollback-focused-20260701-012427`，backup id `bkp-p12pre-20260701011350`。
- `verify-release-evidence` 必须要求 `OK backup-restore-drill-evidence` 引用 `backup-restore-drill-evidence.txt`，`OK rollback-plan` 引用 `rollback-plan.txt`；非 OK backup/rollback 状态必须引用对应 `.log`。
- `security-regression-check.sh` 必须用 checksum 重写后的动态探针证明 “OK 但仍指向 `.log`” 的伪造 evidence package 会被拒绝。

Impact：

- P12-pre 本地恢复/回滚 focused 缺口已关闭，可作为后续 full authority refresh 的输入证据。
- 当轮 full authority 不变，仍为 `release-evidence/release-post-qa-citation-verifier-20260701-073909`；后续已由 ADR-AGENT-018 刷新。
- 不得把 focused backup/rollback 包描述成 full release/nightly authority。
- 后续完整 release/nightly profile 若配置本轮 evidence file，可进一步关闭 full authority 层面的 backup/rollback SKIP。

Evidence：

- `LC_ALL=en_US.UTF-8 LANG=en_US.UTF-8 make backup-restore-drill`
- 严格 `make rollback-preflight`
- `./scripts/verify-release-evidence.sh release-evidence/p12-pre-backup-rollback-focused-20260701-012427`
- `./scripts/verify-release-evidence.sh release-evidence/release-post-qa-citation-verifier-20260701-073909`
- `bash -n scripts/verify-release-evidence.sh scripts/security-regression-check.sh scripts/release-evidence.sh`
- `./scripts/security-regression-check.sh`

Review trigger：

- 生成新的 full `release` / `nightly` authority 并配置 backup/rollback evidence 时复审。
- backup evidence schema、rollback plan schema 或 release evidence standard step 发生变化时复审。
- 引入生产备份加密、远程 artifact store 或 staging/prod 部署自动化时复审。

## ADR-AGENT-016：Report Evidence QA Citation marker 必须进入 release verifier 并刷新 full authority

Date：2026-07-01。
Owner：`Ops-Harbor`。
Roles：`Product-Luna`、`QA-Orion`、`QA-Gate`、`Lead-Codex`。
Status：Accepted。

Context：

- ADR-AGENT-015 已完成 `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK` focused UI marker，但如果 release verifier 不校验该 marker，旧 full release package 仍可能被误认为覆盖报告证据到 QA citation 的完整发布证据。
- Product-Luna/Ohm the 2nd 要求立即接入 verifier，Ops-Harbor/Pasteur the 2nd 要求 verifier 更新和 full release evidence refresh 作为同一 release action。
- QA-Orion/Popper the 2nd 给出负向矩阵，Goodall-agent/Halley 返回 `PASS_WITH_CONCERNS`：focused gate 可接受，但旧 full authority 必须 historical-only，full authority 必须刷新后才能继续声明。

Decision：

- `verify-release-evidence` 对 `OK report-evidence-drawer-ui-smoke` 必须同时校验唯一 `REPORT_EVIDENCE_DRAWER_SMOKE_OK` 和唯一 `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK`。
- QA citation marker 必须证明 request-bound `evidenceRef`、安全相对 file path、verified grounding、successful citation enforcement、positive citation/cited chunk count、mock-only、local-only、双 viewport 和无未 mock API。
- `release-evidence/report-evidence-qa-citation-verifier-20260701-072236` 只作为 focused verifier evidence。
- `release-evidence/release-post-patch-ready-schema-20260701-053701` 降级为 historical-only。
- 当轮 full release authority 更新为 `release-evidence/release-post-qa-citation-verifier-20260701-073909`；后续已被 ADR-AGENT-018 的 `release-evidence/release-p12pre-full-authority-20260701-024042` supersede。

Impact：

- 后续任何缺少 QA citation marker 的 release/nightly full package 都不能冒充当前发布权威证据。
- 不新增 release evidence standard step，避免 release evidence 表膨胀。
- GitHub App/webhook、真实 LLM provider、生产 backup restore drill 和正式 rollback plan 仍保持后置边界。

Evidence：

- `./scripts/security-regression-check.sh`
- `./scripts/verify-release-evidence.sh release-evidence/report-evidence-qa-citation-verifier-20260701-072236`
- `SOURCELENS_BASE_URL=http://localhost:19080 SOURCELENS_RELEASE_EVIDENCE_RUN_ID=release-post-qa-citation-verifier-20260701-073909 make release-evidence-release`
- `./scripts/verify-release-evidence.sh release-evidence/release-post-qa-citation-verifier-20260701-073909`

Review trigger：

- 当 report evidence drawer smoke 拆分为独立 QA citation spec 或 release standard step 时复审。
- 当后端 citation enforcement 状态集合变化时复审。
- 当真实 LLM provider run 被纳入 full authority 时复审 citation 质量指标。

## ADR-AGENT-015：Report Evidence -> QA Citation 先以 mock-only focused evidence 收口

Date：2026-07-01。
Owner：`Product-Luna`。
Roles：`QA-Orion`、`FE-Pixel`、`Ops-Harbor`、`Lead-Codex`。
Status：Accepted。

Context：

- P9 需求已要求报告证据进入 QA 后展示 answer-level citations、grounding status 和 citation enforcement status。
- `ProjectDetail` 已有 QA citation UI，`ScanTaskDetail` 已能从报告证据抽屉生成带 `scanTaskId` 和 `evidenceRef` 的 QA 深链。
- `public-repo-ui-smoke` 已覆盖真实后端 QA from evidence，但成本较高，不适合作为每轮快速前端回归。
- Product-Luna/Singer the 2nd 判定应立即补 focused mock UI smoke；QA-Orion/Wegener the 2nd 要求点击抽屉进入 QA、POST `/qa` 请求绑定 evidenceRef、answer citations 可见、双 viewport 和未 mock API 为 0。

Decision：

- 本轮扩展现有 `report-evidence-drawer-smoke.spec.ts`，而不是复制一套新 fixture。
- 新增 `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK` marker 和 `make report-evidence-qa-citation-ui-smoke` 入口，锁住 report evidence -> QA citation UI 合同。
- 不新增后端 API，不扩展 citation schema，不重做引用强制策略。
- 本轮不刷新 full release authority；后续已由 ADR-AGENT-016 刷新为 `release-evidence/release-post-qa-citation-verifier-20260701-073909`，本条只保留 focused UI evidence 的历史边界。

Impact：

- 快速 mock smoke 可以在不启动真实后端、不调用真实 LLM 的情况下证明 QA citation UI 不漂移。
- `report-evidence-drawer-smoke` 同时输出原有 `REPORT_EVIDENCE_DRAWER_SMOKE_OK` 和新增 `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK`。
- 后续若要进入 release evidence 标准 step，需要再更新 `release-evidence.sh` 和 `verify-release-evidence.sh`，本轮不声明已经完成。

Evidence：

- `node scripts/validate-frontend-ui.mjs`
- `CI=true make report-evidence-qa-citation-ui-smoke`
- `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK.mockedApiOnly=true`
- `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK.unhandledApiRequests=0`
- `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK.qaFromEvidence.groundingStatuses=["VERIFIED"]`
- `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK.qaFromEvidence.citationEnforcementStatuses=["DIRECT_VERIFIED"]`
- `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK.qaFromEvidence.evidenceRef.requestBound=true`

Review trigger：

- 当该 marker 被纳入 full release/nightly evidence verifier 时复审。
- 当后端 citation schema 或 citation enforcement 策略发生变化时复审。
- 当 QA 页拆分为独立路由或报告证据抽屉重构时复审。

## ADR-AGENT-014：AgentChat 闭环栏只做导航闭环，不做写操作控制面

Date：2026-07-01。
Owner：`Product-Luna`。
Roles：`FE-Pixel`、`QA-Orion`、`Sec-Sentinel`、`Lead-Codex`。
Status：Accepted。

Context：

- AgentChat 已能在消息工具证据中跳转 AuditLogs，但入口藏在单条消息内。
- 用户核心主线要求 Agent 辅助理解能与任务、扫描报告和审计闭环，而不是停留在聊天页面。
- Conversation 已有 `agentTaskId`，AgentTask detail 已有 `scanTaskId`，前端可复用现有 API 和路由，无需新增后端。
- FE-Pixel/Hegel the 2nd 建议最小实现闭环行动栏；QA-Orion/Pauli the 2nd 要求独立 focused smoke 和 fail-closed mock。

Decision：

- AgentChat 右侧 ContextRail 增加 `AgentChatClosureRail`。
- 闭环栏只提供导航：`查看工具审计`、`打开 Agent 任务`、`打开扫描报告`。
- AgentTasks 支持 `taskId` deep link 自动选中详情，保证从聊天进入任务页后不中断。
- 闭环栏不启动、取消、创建 AgentTask，不创建 AutoRepair，不触发 PR 或任何写操作。
- 本轮不刷新 full release authority，只作为 P9 focused UI evidence。

Impact：

- AgentChat 对话结果能直接回到审计、任务和扫描报告证据链。
- 安全边界保持清晰：聊天页不新增写操作控制面。
- 后续若要在 AgentChat 中创建 AutoRepair 或任务控制，必须另起产品/安全审查和 smoke 合同。

Evidence：

- `node scripts/validate-frontend-ui.mjs`
- `npm --prefix web-console run build`
- `CI=true make agent-chat-closure-rail-ui-smoke`
- `CI=true make agent-chat-audit-ui-smoke`
- `CI=true make agent-tasks-detail-selection-ui-smoke`
- `AGENT_CHAT_CLOSURE_RAIL_SMOKE_OK.actions.audit.deepLinkBound=true`
- `AGENT_CHAT_CLOSURE_RAIL_SMOKE_OK.actions.agentTask.autoSelectedDetail=true`
- `AGENT_CHAT_CLOSURE_RAIL_SMOKE_OK.actions.scanReport.scanTaskDeepLinkBound=true`

Review trigger：

- 当 AgentChat 被要求直接创建 AutoRepair、启动/取消 AgentTask、创建 PR 或触发写入工具时复审。
- 当闭环栏被纳入 full release/nightly evidence verifier 时复审。

## ADR-AGENT-013：P9 下一增量优先选择 AutoRepair Source Bridge

Date：2026-07-01。
Owner：`FE-Pixel`。
Roles：`Product-Luna`、`QA-Orion`、`QA-Gate`、`Lead-Codex`。
Status：Accepted。

Context：

- 当时的 full release authority 已由 `release-evidence/release-post-patch-ready-schema-20260701-053701` 刷新；后续又被 `release-evidence/release-post-qa-citation-verifier-20260701-073909` supersede。
- Product-Luna/Epicurus the 2nd 建议做 AgentChat 闭环行动栏，价值高但涉及 AgentChat、AuditLogs、AgentTasks 和 ScanTaskDetail 多页面联动。
- FE-Pixel/Ampere the 2nd 建议先把 AutoRepair 详情中的来源扫描 Alert 升级为 Source Bridge，范围更小，可复用现有 PATCH_READY smoke。
- QA-Orion/Helmholtz the 2nd 建议 Report Evidence -> QA Citation mocked UI smoke，适合作为下一轮 QA 体验证据。
- Goodall-agent/Halley 要求本轮不能破坏 PATCH_READY PR gate，必须覆盖来源桥、深链、人工候选 fallback、320px 和 marker。

Decision：

- 本轮采纳 AutoRepair Source Bridge 作为 P9 focused UI 增量。
- AgentChat 闭环行动栏和 Report Evidence -> QA Citation UI smoke 延后为下一候选，不在本轮声明完成。
- Source Bridge 只作为解释与导航层，不把 `scanTaskId` 缺失升级为 PR hard gate。
- 本轮不刷新 full release authority；当时 authority 仍是 `release-post-patch-ready-schema-20260701-053701`，后续已被 `release-post-qa-citation-verifier-20260701-073909` supersede。

Impact：

- `PATCH_READY_UI_SMOKE_OK` marker 新增 `scanSourceBridge` 字段。
- `validate-frontend-ui.mjs` 锁住 Source Bridge 结构、fallback 和深链参数。
- AutoRepair 详情用户路径从“看到来源报告提示”升级为“可回报告、问 QA、建 Agent 复核、查审计”。
- 后续 AgentChat 闭环栏实施时，不应重复声明本轮已完成的 AutoRepair 来源桥证据。

Evidence：

- `node scripts/validate-frontend-ui.mjs`
- `npm --prefix web-console run build`
- `CI=true make patch-ready-ui-smoke`
- `PATCH_READY_UI_SMOKE_OK.scanSourceBridge.visible=true`
- `PATCH_READY_UI_SMOKE_OK.scanSourceBridge.missingScanFallbackVisible=true`

Review trigger：

- 当 AgentChat 闭环行动栏或 Report Evidence -> QA Citation UI smoke 开始实施时复审排序。
- 当 AutoRepair 来源桥被接入真实 release/nightly evidence 包时复审是否需要新增 verifier hard check。

## ADR-AGENT-012：PATCH_READY schema 升级后必须刷新 full release authority

Date：2026-07-01。
Owner：`Ops-Harbor`。
Roles：`Product-Luna`、`QA-Orion`、`QA-Gate`、`Lead-Codex`。
Status：Accepted。

Context：

- `PATCH_READY_UI_SMOKE_OK` release marker 已从旧 `tableDetailAction.keyboardOpen=true` 升级为强校验 `keyboardOpen.enter/space`、`sharedSelectableRow.ariaControlsLinked/detailRegionLinked` 和 `selectedRepairIds=[101,103]`。
- 旧 full release evidence 包 `release-evidence/release-post-autorepair-detail-action-20260701-004333` 在新 verifier 下预期失败，只能保留为 historical-only。
- Focused smoke 和 historical full package 不能替代当前 schema 下完整 `release` / `nightly` profile authority。
- Product-Luna/Boyle 建议立即刷新，Ops-Harbor/Banach 要求稳定 backend jar 和完整 release profile，QA-Orion/Heisenberg the 2nd 定义 PASS/BLOCK，Goodall-agent/Halley 只读 final review 判定 `PASS`。

Decision：

- `release-evidence/release-post-patch-ready-schema-20260701-053701` 成为当时的 full release authority；后续已被 ADR-AGENT-016 中的 `release-evidence/release-post-qa-citation-verifier-20260701-073909` supersede。
- 该包必须通过完整 `release` profile 和 `./scripts/verify-release-evidence.sh`；不能用 focused package 或旧 schema full package 代替。
- 本 authority 只证明当前包中 OK 的 release evidence steps，不把 SKIP 项解释为完成。
- GitHub App E2E、GitHub webhook E2E、真实 LLM provider run、生产 backup restore drill evidence 和正式 rollback plan 继续作为后置证据缺口。

Impact：

- 当轮文档必须把该包列为 full authority；后续文档必须以 ADR-AGENT-016 的 `release-evidence/release-post-qa-citation-verifier-20260701-073909` 为当前 full authority。
- 旧 `release-post-autorepair-detail-action-20260701-004333`、`release-post-governance-stage-rail-20260701-000851`、`release-post-attempt-split-verifier-20260630-232950` 继续保留为历史证据，不能在当前发布判断中冒充 authority。
- 后续若补齐真实 backup/rollback/GitHub/webhook/LLM provider evidence，应追加新 authority 或新决策，不直接改写本条历史判断。

Evidence：

- `release-evidence/release-post-patch-ready-schema-20260701-053701`
- `./scripts/verify-release-evidence.sh release-evidence/release-post-patch-ready-schema-20260701-053701`
- `PATCH_READY_UI_SMOKE_OK.tableDetailAction.keyboardOpen.enter=true`
- `PATCH_READY_UI_SMOKE_OK.tableDetailAction.keyboardOpen.space=true`
- `PATCH_READY_UI_SMOKE_OK.sharedSelectableRow.ariaControlsLinked=true`
- `PATCH_READY_UI_SMOKE_OK.sharedSelectableRow.detailRegionLinked=true`
- `PATCH_READY_UI_SMOKE_OK.sharedSelectableRow.selectedRepairIds=[101,103]`
- `PUBLIC_REPO_UI_SMOKE_OK.realBackend=true`
- Goodall-agent/Halley final review `PASS`

Review trigger：

- 生成包含真实 backup restore drill evidence、rollback plan、GitHub App drill、GitHub webhook drill 或真实 LLM provider run 的新完整 `release` / `nightly` evidence package 时复审。

## ADR-AGENT-001：多 agent 采用固定岗位代号，不依赖 Codex UI 实时展示

Date：2026-06-29。
Owner：`Lead-Codex`。
Roles：`PM-Nova`、`Product-Luna`、`QA-Orion`。
Status：Accepted。

Context：

- 用户希望按真实公司岗位拆分：产品、架构、安全、后端、前端、测试、DevOps、数据/AI、项目管理互相制衡。
- Codex App 右侧当前显示的是输出文件和来源，不是实时子 agent 状态看板。
- 子 agent 通常按任务启动，不是长期常驻后台员工。

Decision：

- SourceLens 项目层使用固定岗位代号管理角色：`PM-Nova`、`Product-Luna`、`Arch-Atlas`、`Sec-Sentinel`、`BE-Forge`、`FE-Pixel`、`QA-Orion`、`Ops-Harbor`、`AI-Vector`、`Lead-Codex`。
- 实际子 agent 昵称只作为 runtime 信息记录在 `docs/AGENT_ACTIVITY_LOG.md`。
- 所有关键取舍进入 `docs/AGENT_DECISION_REGISTER.md`。

Impact：

- 用户可以通过文档稳定区分“谁负责什么”，不受 Codex UI 是否显示实时 agent 影响。
- 后续每轮开发必须记录参与岗位、证据、采纳状态和未参与角色。

Evidence：

- `docs/TEAM_OPERATING_MODEL.md`
- `docs/AGENT_ACTIVITY_LOG.md`
- `docs/PRODUCT_GOVERNANCE.md`

Review trigger：

- Codex App 提供原生实时 agent 状态 API 或 SourceLens 自身实现团队工作台时复审。

## ADR-AGENT-005：P9 窄屏体验以 320px 进入发布证据合同层

Date：2026-06-29。
Owner：`FE-Pixel`。
Roles：`QA-Orion`、`QA-Gate`、`Ops-Harbor`、`Lead-Codex`。
Status：Accepted。

Context：

- 390px 移动 smoke 不能覆盖 320px 极窄设备和浏览器缩放场景。
- Goodall、Zeno、Anscombe 均指出只在 spec 或 CSS 中添加 320px 不足以成为发布门禁。
- SourceLens 当前大量页面使用 AntD Alert、List、Table、Descriptions 和按钮组合，窄屏下最容易出现横向溢出、文字不可读和操作按钮挤压。

Decision：

- `public-repo-ui-smoke` 必须覆盖 `1440x900`、`390x844`、`320x740`。
- `patch-ready-ui-smoke` 必须覆盖 `1440x900`、`320x740`。
- 两类 smoke 的成功 marker 必须输出 `viewports`，`verify-release-evidence.sh` 必须校验这些视口。
- `scripts/security-regression-check.sh` 必须包含缺失 320px viewport 的 forged marker 负例。
- `scripts/validate-frontend-ui.mjs` 必须锁住 320px CSS、表格 scroll 和 marker viewports。

Impact：

- 后续 UI 改造不能只声称“移动端可用”，必须至少证明 320px 无横向溢出和核心操作可见。
- release/nightly 证据包无法接受缺失 `320x740` 的 public repo UI marker 或 PATCH_READY UI marker。

Evidence：

- `release-evidence/public-repo-ui-320-gate-20260629-232439`
- `scripts/verify-release-evidence.sh`
- `scripts/security-regression-check.sh`
- `web-console/tests/public-repo-ui-smoke.spec.ts`
- `web-console/tests/patch-ready-smoke.spec.ts`

Review trigger：

- 引入正式视觉回归平台、设备云矩阵或设计系统断点规范时复审。

## ADR-AGENT-007：P12-pre local nightly 必须归档真实备份恢复和回滚计划证据

Date：2026-06-30。
Owner：`Ops-Harbor`。
Roles：`Sec-Sentinel`、`QA-Gate`、`Lead-Codex`。
Status：Accepted。

Context：

- Full `release` package `release-evidence/release-20260629-235813` 已通过 verifier，但 `backup-restore-drill-evidence` 和 `rollback-plan` 仍为 `SKIP`。
- 对 P12-pre 来说，公开仓库主链路可以继续不阻塞 GitHub App/webhook/真实 LLM provider；但 backup restore 和 rollback 属于生产化底线，不应长期停留在可选说明。
- 子 agent 复核一致：`Ops-Harbor/Franklin`、`Sec-Sentinel/Aquinas`、`QA-Gate/Helmholtz` 均判定原包在生产发布前仍 `PARTIAL`；恢复原 `QA-Gate/Goodall` 会话后，Goodall 对新 nightly 包判定 `PASS`。
- 2026-06-30 后续 current-schema full `release` profile 已重新补齐 backup restore drill evidence 与 rollback plan，证据包为 `release-evidence/release-current-schema-backup-rollback-20260630-132306`；Goodall-agent `019f168b-6623-7661-948b-b28d3a3ef62c` 复审 `PASS`。

Decision：

- P12-pre local nightly evidence 必须包含真实 `backup-restore-drill-evidence=OK` 和 `rollback-plan=OK`，不能只用空 marker 或口头记录。
- 备份目录必须在 git worktree 和 `SOURCELENS_WORKSPACE` 外，保持私有权限；同一 backup id 必须匹配 database、workspace、artifacts、checksums 四件套，并经 checksum 复核。
- Restore drill 必须证明 DB scratch restore、workspace restore、artifact restore 和 checksum verification 均通过。
- Rollback plan 必须引用 immutable target ref 和同一 backup id，并说明止损、恢复和 health smoke 步骤。
- GitHub App drill、GitHub webhook drill 和真实 LLM provider run 在当前 P12-pre / local nightly 下继续作为后置高级集成层，保持显式 `SKIP`，不得伪造通过。
- Current-schema full `release` profile 同样适用该规则：不能继续以 5 个 SKIP 的历史包作为最新权威证据；最新权威包必须使用 `release-current-schema-backup-rollback-20260630-132306` 或其后继包。
- `backup-restore-drill.sh` 的 scratch DB 名必须能承受合法 backup id；如果通过 backup id 派生 MySQL identifier，必须哈希化/截断或收紧 backup id 长度，并补回归测试。

Impact：

- `release-evidence/nightly-20260630-002144` 可作为 P12-pre local nightly release evidence PASS：`required_failures=0`、`optional_warnings=0`、`skipped=3`。
- `release-evidence/release-current-schema-backup-rollback-20260630-132306` 可作为 current-schema full release evidence PASS：`required_failures=0`、`optional_warnings=0`、`skipped=3`。
- 旧 `release-evidence/release-20260629-235813` 保留历史事实，不回写为完整 nightly 证据。
- 旧 `release-evidence/release-current-schema-20260630-124829` 保留历史事实；它已被 backup/rollback closure 包 supersede。
- 后续 staging/prod 发布前仍需处理生产备份加密、host 工具链或容器化备份策略，并按目标环境安全门禁执行。

Evidence：

- `release-evidence/nightly-20260630-002144`
- `release-evidence/nightly-20260630-002144/backup-restore-drill-evidence.txt`
- `release-evidence/nightly-20260630-002144/rollback-plan.txt`
- `release-evidence/nightly-20260630-002144/summary.md`
- `release-evidence/release-current-schema-backup-rollback-20260630-132306`
- `release-evidence/release-current-schema-backup-rollback-20260630-132306/backup-restore-drill-evidence.txt`
- `release-evidence/release-current-schema-backup-rollback-20260630-132306/rollback-plan.txt`
- `release-evidence/release-current-schema-backup-rollback-20260630-132306/summary.md`
- `docs/PRODUCT_PROGRESS_LOG.md`
- `docs/AGENT_ACTIVITY_LOG.md`

Review trigger：

- 引入 staging/prod smoke tenant、生产加密备份策略、GitHub App E2E、真实 webhook drill 或真实 LLM provider run 时复审。

## ADR-AGENT-006：Release/nightly 写入型 smoke 必须有目标环境边界

Date：2026-06-29。
Owner：`Sec-Sentinel`。
Roles：`Ops-Harbor`、`QA-Gate`、`Product-Luna`、`Lead-Codex`。
Status：Accepted。

Context：

- `release` / `nightly` profile 会强制运行 smoke、public repo smoke、file-bound repair smoke、AutoRepair patch smoke、PATCH_READY UI smoke 和 audit workbench smoke，其中多项会创建项目、仓库、扫描任务、artifact、code_chunks、审计日志或临时样本。
- `SOURCELENS_BASE_URL` 可以指向本地、staging 或生产，如果不加目标环境边界，发布验收可能误向非隔离环境写入数据。
- GitHub App drill 和 webhook drill 即使多数是只读或低副作用，也会触达真实外部系统和真实 webhook 入口，不能在 release/nightly 中仅因配置完整就自动运行。

Decision：

- `release` / `nightly` profile 中，loopback `SOURCELENS_BASE_URL` 视为本地隔离目标；非本地目标必须显式设置 `SOURCELENS_RELEASE_EVIDENCE_TARGET_ENV=staging|prod`。
- `target_env=prod` 必须额外设置 `SOURCELENS_RELEASE_EVIDENCE_ALLOW_MUTATING_PROD=true`，且只能用于专用 production smoke tenant。
- `release` / `nightly` profile 强制 public repo smoke cleanup 为 true，避免留下临时项目和扫描数据。
- 非 local profile 中 GitHub App drill 和 GitHub webhook drill 必须设置 `SOURCELENS_RELEASE_EVIDENCE_ALLOW_EXTERNAL_DRILLS=true` 才能自动运行。
- `verify-release-evidence` 对 `release` / `nightly` profile 必须强制 `public_repo_smoke_ui` manifest 字段存在且为 true，旧 focused package 不能冒充完整发布候选。

Impact：

- full release/nightly 证据包可以安全地区分本地、staging 和 production smoke tenant。
- focused evidence 仍可用于单点验收，但不能被包装成完整发布候选。
- 外部 GitHub/App/webhook 触达从“配置完整即 auto”改为“非 local 显式允许”。

Evidence：

- `scripts/release-evidence.sh`
- `scripts/verify-release-evidence.sh`
- `scripts/security-regression-check.sh`
- `deploy/.env.example`
- `docs/OPERATIONS_RUNBOOK.md`

Review trigger：

- 引入专门 staging smoke tenant、正式 release/nightly GitHub Actions workflow 或生产发布自动化时复审。

## ADR-AGENT-002：AutoRepair PATCH_READY 前端闭环用静态 UI 合同门禁固化

Date：2026-06-29。
Owner：`FE-Pixel`。
Roles：`Arch-Atlas`、`Sec-Sentinel`、`QA-Orion`、`Ops-Harbor`。
Status：Accepted。

Context：

- 已完成一次真实浏览器 smoke，验证 AutoRepair `PATCH_READY` 能打开 patch artifact、查看执行步骤，并从审计日志回跳详情。
- 该浏览器 smoke 不是持久化 E2E，后续 UI 重构可能断开 artifact、audit 或 execution source 深链。
- 直接引入新浏览器测试框架会增加依赖面，当前阶段先保持轻量门禁。

Decision：

- 在 `scripts/validate-frontend-ui.mjs` 中加入 AutoRepair PATCH_READY UI 合同断言。
- 门禁必须覆盖：
  - AutoRepair 详情展示 readiness。
  - `PATCH_READY` 状态显示 patch artifact 入口。
  - patch artifact 使用 `ownerType="AUTO_REPAIR"` 和 `ownerId={selected.id}`。
  - execution task 通过 `AUTO_REPAIR` source 回跳 AutoRepair。
  - Artifact 和 AuditLog 均能回跳 `/auto-repairs?projectId=...&repairId=...`。

Impact：

- 后续前端重构无法静默移除 PATCH_READY 审查入口、执行步骤或审计/产物深链。
- 真实浏览器 smoke 仍可按需要执行，但最低回归成本降低。

Evidence：

- `scripts/validate-frontend-ui.mjs`
- `docs/PRODUCT_PROGRESS_LOG.md`
- `docs/PHASE_REQUIREMENTS.md`

Review trigger：

- 引入 Playwright/Cypress 等正式 E2E 后，复审是否把该静态合同迁移为浏览器级自动化。

## ADR-AGENT-003：AutoRepair patch smoke 进入 release evidence 标准 step

Date：2026-06-29。
Owner：`Ops-Harbor`。
Roles：`PM-Nova`、`Product-Luna`、`Arch-Atlas`、`Sec-Sentinel`、`QA-Orion`、`AI-Vector`。
Status：Accepted。

Context：

- `make autorepair-patch-smoke` 已能验证真实扫描、dev/test `MOCK` LLM、`PATCH_READY`、`CHANGE_PATCH` artifact、execution task 和 `AUTO_REPAIR_PATCH_READY` audit。
- 该 smoke 仍停留在单独命令层，发布证据包无法表达它是否被执行、跳过或因缺配置失败。
- 该 smoke 比 file-bound repair smoke 更重，但仍是 P3 自动修复闭环的重要验收证据。

Decision：

- 在 release evidence 中新增标准 step `autorepair-patch-smoke`。
- 新增 include mode：`SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AUTOREPAIR_PATCH_SMOKE=true|false|auto`。
- `false` 记录标准 SKIP；`true` 缺少 `SOURCELENS_BASE_URL` 记录 required failure；`auto` 在存在 base URL 时运行。
- verifier 必须强制检查 manifest 字段、status 行、固定 log 文件名和 mode/status 一致性。

Impact：

- 发布记录可以追踪 AutoRepair patch readiness smoke 的执行状态。
- 后续发布前可以显式强制该 step，把自动修复链路纳入发布验收。
- 若目标后端不是 dev/test profile 或禁用 `MOCK` provider，该 step 应失败，避免用真实 provider key 替代本地回归。

Evidence：

- `scripts/release-evidence.sh`
- `scripts/verify-release-evidence.sh`
- `docs/OPERATIONS_RUNBOOK.md`
- `docs/PRODUCT_PROGRESS_LOG.md`

Review trigger：

- 当 AutoRepair PR 创建进入当前主线或 GitHub App E2E 被提前到必过门禁时，复审是否新增独立 PR smoke step。

## ADR-AGENT-004：多 agent 当前状态以项目内 Status Board 为准

Date：2026-06-29。
Owner：`PM-Nova`。
Roles：`Lead-Codex`、`Product-Luna`、`Arch-Atlas`、`QA-Orion`、`Ops-Harbor`。
Status：Accepted。

Context：

- 用户需要像真实公司项目一样看到固定岗位、当前职责、工作流状态、证据和下一步。
- Codex App 右侧面板当前展示的是输出文件和来源，不是项目级实时 agent 看板。
- `AGENT_ACTIVITY_LOG.md` 适合记录历史活动，但不适合快速查看当前状态。

Decision：

- 新增 `docs/AGENT_STATUS_BOARD.md` 作为当前状态入口。
- `AGENT_STATUS_BOARD.md` 记录当前阶段、固定岗位状态、本轮 workstream、证据入口和下一步。
- 每轮结束必须同步更新 status board；活动明细继续进入 `AGENT_ACTIVITY_LOG.md`，长期判断继续进入本文。

Impact：

- 用户可以直接从一个文档看到当前“公司式团队”的运行状态。
- 右侧 UI 不显示实时子 agent 时，不影响项目治理和续接。
- 后续若实现 SourceLens 内部团队工作台，可把该文档作为数据结构蓝本。

Evidence：

- `docs/AGENT_STATUS_BOARD.md`
- `docs/PRODUCT_GOVERNANCE.md`
- `docs/TEAM_OPERATING_MODEL.md`
- `docs/CODEX_HANDOFF.md`

Review trigger：

- Codex App 提供原生实时 agent 状态 API，或 SourceLens 自身实现多 agent 工作台时复审。

## ADR-UX-001：项目依赖页面的空状态必须提供主行动

Date：2026-06-29。
Owner：`Product-Luna`。
Roles：`FE-Pixel`、`QA-Orion`、`Arch-Atlas`、`Lead-Codex`。
Status：Accepted。

Context：

- 审计日志页在当前登录用户没有项目时，只展示“暂无项目，请先创建项目并接入公开仓库”。
- 审计、任务、产物、AutoRepair、CI/PR 等页面都依赖项目选择器。
- 静态提示无法形成主链路闭环，用户需要额外猜测下一步入口。

Decision：

- 所有通过 `ProjectSelector` 进入的项目依赖页面，空状态必须提供明确主行动。
- 当前主行动为 `去项目管理`，跳转 `/projects`。
- 该规则由 `scripts/validate-frontend-ui.mjs` 静态门禁保护。

Impact：

- 没有项目时，用户可以直接从审计、任务、产物、修复等页面回到项目接入入口。
- 后续新增项目依赖页面时，默认继承该行为。

Evidence：

- `web-console/src/components/ProjectSelector.tsx`
- `scripts/validate-frontend-ui.mjs`
- `docs/PRODUCT_PROGRESS_LOG.md`

Review trigger：

- 如果未来有全局 onboarding flow 或项目创建向导，应复审主行动是否从 `/projects` 改为更具体的新建项目入口。

## ADR-QA-001：审计 workbench 必须同时验证浏览器渲染和三源 API

Date：2026-06-29。
Owner：`QA-Orion`。
Roles：`Sec-Sentinel`、`FE-Pixel`、`BE-Forge`、`Ops-Harbor`、`Lead-Codex`。
Status：Accepted。

Context：

- 审计日志页由通用审计、Agent 工具调用、GitHub Webhook Delivery 三类数据源组成。
- 之前该页出现过 500 错误；只看空状态或只看前端渲染不足以证明三类后端源健康。
- 安全治理页面必须能区分“没有数据”和“数据源不可用”。

Decision：

- 审计 workbench 验收必须覆盖：
  - 浏览器渲染：source cards、tabs、tables、无横向溢出、无全局错误。
  - API smoke：三类项目内数据源均返回标准分页结构且不 500。
- 新增 `make audit-workbench-smoke` 作为后端三源 API 的可重复验证入口。

Impact：

- 后续审计页改动不能只用静态 UI 门禁证明完成。
- 三源接口异常会被独立 smoke 捕获，避免 UI 把接口失败误呈现为空数据。

Evidence：

- `scripts/audit-workbench-smoke.sh`
- `Makefile`
- `docs/PRODUCT_PROGRESS_LOG.md`

Review trigger：

- 当 release evidence 接入该 smoke，或新增第四类审计源时复审。

## ADR-QA-002：Audit workbench smoke 进入 release evidence 标准 step

Date：2026-06-29
Status：Accepted
Owner：`QA-Orion` / `Ops-Harbor` / `Sec-Sentinel`

Context：

- 审计 workbench 三源 smoke 已证明通用审计、Agent 工具调用和 GitHub Webhook Delivery 三类项目内源不会 500。
- 如果该 smoke 只作为单独命令存在，正式发布证据无法证明审计治理页面的后端数据源仍然健康。

Decision：

- 在 release evidence 中新增标准 step `audit-workbench-smoke`。
- 新增 include mode：`SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AUDIT_WORKBENCH_SMOKE=true|false|auto`。
- `verify-release-evidence` 必须要求该 step 出现一次、固定引用 `audit-workbench-smoke.log`，并校验 manifest include mode 与 status 一致。
- 强制 Audit workbench smoke 但缺少 `SOURCELENS_BASE_URL` 时，必须生成可复核 required failure 证据包。

Impact：

- 发布记录可以追踪审计治理 workbench 三源 smoke 的执行状态。
- 显式关闭、自动跳过、强制失败和真实成功都进入同一套证据模型。

Evidence：

- `scripts/release-evidence.sh`
- `scripts/verify-release-evidence.sh`
- `scripts/security-regression-check.sh`
- `docs/OPERATIONS_RUNBOOK.md`
- `docs/PRODUCT_PROGRESS_LOG.md`
- required failure、skip 和 live forced release evidence 临时包均已通过 verifier；live 包记录 `OK audit-workbench-smoke`。

Review trigger：

- 当审计 workbench 新增第四类数据源，或 smoke 开始生成失败审计/工具调用样本时复审。

## ADR-QA-003：Public repo UI smoke 作为 public-repo-smoke 子门禁

Date：2026-06-29
Status：Accepted
Owner：`QA-Gate` / `Ops-Harbor` / `QA-Orion`

Context：

- Public repo live UI smoke 依赖同一轮公开仓库扫描产生的 JWT、`projectId`、`repositoryId`、`scanTaskId` 和 expected evidence file。
- 如果把它拆成独立 release evidence 标准 step，要么跨 step 传递运行态 ID/token，要么重复跑重型 public repo scan，都会增加泄露、漂移和维护风险。
- Goodall 原 QA-Gate 会话、Rawls 和 Faraday 均建议采用子门禁，而不是新增独立标准 step。

Decision：

- Public repo UI smoke 不新增标准 step，不增加 `status.tsv` 行。
- 在 release evidence manifest 中新增 `public_repo_smoke_ui: true|false`。
- 使用 `SOURCELENS_RELEASE_EVIDENCE_PUBLIC_REPO_SMOKE_UI=true|false` 控制该子门禁。
- `local` 默认 false；`ci` 固定 false；`release` / `nightly` 固定 true；非 local profile 不允许 override。
- 当 `public_repo_smoke_ui=true` 且 `public-repo-smoke=OK` 时，`verify-release-evidence` 必须在同一个 `public-repo-smoke.log` 内校验唯一 `PUBLIC_REPO_UI_SMOKE_OK`，并与 `PUBLIC_REPO_SMOKE_OK` 绑定同一组 ID。

Impact：

- Release/nightly 可以证明公开仓库主链路真实页面体验，而不扩大标准 step 模型。
- Verifier 能拒绝从旧 run 复制 UI marker、mock API 冒充真实页面、ID 不一致、缺 page/viewport、泄露 token/JWT 或 `expectedEvidenceFile` 不匹配等伪证据。

Evidence：

- `scripts/release-evidence.sh`
- `scripts/verify-release-evidence.sh`
- `scripts/security-regression-check.sh`
- `release-evidence/public-repo-ui-gate-20260629-225444`
- `docs/PRODUCT_PROGRESS_LOG.md`
- `docs/AGENT_ACTIVITY_LOG.md`

Review trigger：

- 如果未来需要把 UI smoke 拆成独立标准 step，必须先设计安全的跨 step 证据 artifact，明确 token 不落盘、ID 不漂移和重复扫描成本。

## ADR-BUILD-001：关闭 Maven compiler 增量编译以保证 release evidence 可重复

Date：2026-06-30
Status：Accepted
Owner：`Goodall-agent` / `BE-Forge` / `QA-Orion`

Context：

- Full release evidence refresh `release-post-backup-drill-hardening-20260630-135535` 在 `make-verify` 中失败。
- 后端日志显示主源码已编译，但测试阶段出现大量 `NoClassDefFoundError`，集中在 Lombok builder、DTO/record 和匿名内部类。
- Goodall-agent `Rawls / 019f171e-943b-7ee0-a151-5dd88b23d913` 只读诊断确认源码和 annotation processor 存在，关闭 Maven compiler 增量编译后后端测试可稳定通过。

Decision：

- 在 `backend-spring/pom.xml` 的 `maven-compiler-plugin` 固化 `<useIncrementalCompilation>false</useIncrementalCompilation>`。
- 不只在 `scripts/verify-all.sh` 中追加命令行参数，因为那只能覆盖 `make verify`，无法覆盖开发者手动 `mvn clean test`、CI Maven 入口和 release evidence 内部 Maven 行为。

Impact：

- 编译可能略慢，但后端 main/test class 产物更可重复。
- Release evidence、CI、本地命令和手动排障使用同一 Maven 配置，降低环境漂移。

Evidence：

- `cd backend-spring && mvn clean test`：435 tests，0 failures，0 errors。
- `make verify`：通过。
- `release-evidence/release-post-maven-compiler-hardening-20260630-141727`：`required_failures=0`、`optional_warnings=0`、`skipped=3`。
- `./scripts/verify-release-evidence.sh release-evidence/release-post-maven-compiler-hardening-20260630-141727`：通过。

Review trigger：

- 升级 Maven compiler plugin、Lombok、JDK 或 CI runner 后，如果能证明增量编译不再产生 classpath/产物状态不稳定，才允许重新评估该配置。

## ADR-QA-004：PATCH_READY attemptSplit 作为 release acceptance contract

Date：2026-06-30
Status：Accepted
Owner：`Product-Luna` / `QA-Orion` / `DevOps-Harbor`

Context：

- AutoRepair 已把 patch generation 与 PR submission 拆到不同 `ExecutionAttempt`。
- 前端 `patch-ready-ui-smoke` 已输出 `PATCH_READY_UI_SMOKE_OK.attemptSplit`，证明用户可见的两段 attempt timeline、patch attempt step keys、PR attempt step keys 和 PR failure 不污染 patch evidence。
- 如果 release verifier 只校验旧的基础字段，发布证据仍可能接受缺失 attempt split 的 PATCH_READY UI marker，导致旧的混合流水线语义回流。

Decision：

- `PATCH_READY_UI_SMOKE_OK.reviewGate` 与 `PATCH_READY_UI_SMOKE_OK.attemptSplit` 是 release acceptance contract，不再只是 focused smoke 诊断字段。
- `verify-release-evidence.sh` 对 `OK patch-ready-ui-smoke` 必须强校验 `reviewGate.requiredEvidence`、缺证据阻塞、manual candidate warning-only、Popconfirm visibility、attempt ids/nos、patch/PR step keys、`patchEvidenceFromStep` 和 `prFailureDoesNotBlockPatchEvidence`。
- `security-regression-check.sh` 必须动态拒绝缺失或伪造 attempt split 的 release evidence marker。

Impact：

- Release evidence 能证明 PATCH_READY UI 没有退回旧的 aggregate task / flat timeline 语义。
- 该合同仍是 mock-only browser flow，不证明真实 GitHub App PR 创建、外部网络、token、push/create PR E2E。
- `attemptIds=[1,2]` 和 step key 数组属于当前 fixture 合同；如果 smoke fixture 或后端 PR step key 变化，必须同步更新 smoke、verifier、security regression 和文档。

Evidence：

- `web-console/tests/patch-ready-smoke.spec.ts`
- `scripts/verify-release-evidence.sh`
- `scripts/security-regression-check.sh`
- `docs/PHASE_REQUIREMENTS.md`
- `docs/PRODUCT_PROGRESS_LOG.md`

Review trigger：

- AutoRepair PR submission step keys 变化、PATCH_READY UI smoke fixture 改动、或 release evidence profile 重新定义 `patch-ready-ui-smoke` 范围时复审。

## ADR-QA-005：Report Evidence QA must expose unverified citation state

Date：2026-07-01
Status：Accepted
Owner：`Product-Luna` / `FE-Pixel` / `QA-Orion`

Context：

- Report Evidence Drawer 已能从扫描报告证据进入 Code QA，并证明成功路径下回答引用了当前证据。
- 只覆盖 `VERIFIED + DIRECT_VERIFIED` 会留下产品信任缺口：当回答没有成功引用证据时，用户仍可能把 QA 回答误认为已被报告证据支持。
- 后端合同已经存在 `PARTIAL`、`RETRY_FAILED` 和 `citedByAnswer=false` 语义，前端必须把这些状态转化为可见的治理提示，而不是只依赖数据字段。

Decision：

- `report-evidence-qa-citation-ui-smoke` 必须同时覆盖 verified 与 unverified citation state。
- 未验证路径必须在 UI 中展示 `引用需复核`、`引用需人工复核` 和 `候选证据`。
- 未验证路径必须继续证明 QA request payload 绑定当前 `scanTaskId` 与 `evidenceRef.filePath`。
- `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK` marker 必须包含 `qaFromEvidence.unverifiedCitation`，并记录 `groundingStatuses=["PARTIAL"]`、`citationEnforcementStatuses=["RETRY_FAILED"]`、`uncitedCandidateCount` 和 `evidenceRefRequestBound=true`。
- `validate-frontend-ui.mjs` 必须静态阻断删除 unverified citation smoke、治理文案断言或 marker schema 的回退。

Impact：

- 报告证据 -> QA 链路从“只证明理想引用态”升级为“同时证明可信降级态”。
- 该合同仍是 focused mock browser evidence，不证明真实 LLM/provider 或真实后端路径一定产生 `RETRY_FAILED`。
- 下一次 full release authority refresh 必须通过新 marker 后，才能声明完整 release/nightly 证据覆盖该合同。

Evidence：

- `web-console/tests/report-evidence-drawer-smoke.spec.ts`
- `scripts/validate-frontend-ui.mjs`
- `docs/PHASE_REQUIREMENTS.md`
- `docs/PRODUCT_PROGRESS_LOG.md`
- `docs/AGENT_ACTIVITY_LOG.md`

Review trigger：

- Code QA citation enforcement 状态枚举变化、Report Evidence Drawer QA 交互重构、`ProjectDetail` citation UI 文案变更、或未来接入真实 provider `RETRY_FAILED` E2E 时复审。

## ADR-UX-006：Main path query failures must be recoverable in-page states

Date：2026-07-01
Status：Accepted
Owner：`FE-Pixel` / `Product-Luna` / `QA-Orion`

Context：

- 主链路页面过去存在查询失败只弹 toast 的风险。
- toast 消失后，表格或详情区可能显示“暂无数据”“暂无步骤”“暂无评论”，用户无法区分接口失败和真实空数据。
- `StateBlock` 与 `ActionButton` 已成为 SourceLens 的共享产品状态原语，适合承载查询失败、加载、空态和重试。

Decision：

- 主链路查询类失败必须同时保留 `showApiError` toast 和页面内 `StateBlock tone="error"`。
- 页面内错误态必须使用 `formatApiError` 展示服务端/请求 ID 信息，并提供 retry `ActionButton`。
- 动作类失败，如创建、启动、取消、重新分析、创建 PR，仍按动作错误处理，可继续只使用 toast，不强制页面级错误态。
- 第一批落地范围为 `AgentTasks`、`PrReviews`、`CiDiagnostics`。
- 第二批落地范围为 `AgentChat`、`AutoRepairs`；其中 PATCH_READY 审计证据失败必须保持 PR gate fail-closed。
- `validate-frontend-ui.mjs` 必须静态阻断这些页面退回 toast-only 查询失败。

Impact：

- 用户能明确看到“加载失败”和“暂无数据”的区别。
- 局部详情失败不会污染整页，也不会误导为没有 steps/comments。
- 后续 `Artifacts`、`AuditLogs` 等页面应按批次继续收口；`AgentChat` 与 `AutoRepairs` 已进入该合同。

Evidence：

- `web-console/src/pages/AgentTasks.tsx`
- `web-console/src/pages/PrReviews.tsx`
- `web-console/src/pages/CiDiagnostics.tsx`
- `scripts/validate-frontend-ui.mjs`
- `docs/PRODUCT_PROGRESS_LOG.md`

Review trigger：

- 引入全局数据加载框架、重构 `StateBlock` / `ActionButton`、或页面查询失败策略变化时复审。

## ADR-OPS-007：Full release authority requires release profile, not CI or focused evidence

Date：2026-07-02
Status：Accepted
Owner：`Ops-Harbor` / `QA-Gate` / `PM-Nova`

Context：

- `release-evidence/release-post-unverified-qa-citation-authority-20260701-135235` 曾是完整 release profile authority。
- 后续 raw public repo Code QA、source-location probes 和 scan governance candidate receipt marker schema 继续加严；旧包在最新 verifier 口径下只能作为 historical full package。
- 当前环境可生成并验证 `ci` profile evidence，但 `ci` profile 会跳过所有真实 smoke、preflight、backup/rollback、phase12 和 sandbox drill。

Decision：

- 不能用 `ci` profile 或 focused evidence 声明 current full release authority。
- 新的 current full authority 必须由完整 `release` 或 `nightly` profile 生成，并通过最新 `verify-release-evidence.sh`。
- 本地 full refresh 必须使用最新 worktree 构建出的稳定 `.sourcelens-runtime/backend` jar 后端；不能使用 `target/classes`、`mvn spring-boot:run`、`backend-spring/target/*.jar`，也不能直接把无法证明来源的 Docker 8081 后端当作 authority 目标。
- full refresh 必须补齐 backup restore drill evidence、rollback plan、backup dir/ref/id，并覆盖 public repo smoke、public repo UI、file-bound repair、AutoRepair patch、mocked UI smoke、scan governance、audit workbench、phase12 baseline 和 sandbox drill。

Impact：

- 当前 latest evidence `release-evidence/p6-evidence-framework-ci-20260702-155117` 只证明 evidence framework 健康。
- 文档和状态板必须把旧 full package 标为 historical-only，避免发布口径漂移。
- GitHub App drill、GitHub webhook drill 和真实 LLM provider run 仍按高级集成层后置；它们可以 SKIP，但不能被宣称完成。

Evidence：

- `release-evidence/p6-evidence-framework-ci-20260702-155117`
- `docs/OPERATIONS_RUNBOOK.md`
- `docs/PHASE_REQUIREMENTS.md`
- `docs/AGENT_STATUS_BOARD.md`

Review trigger：

- `release-evidence.sh` profile 语义变化、`verify-release-evidence.sh` 对 release/nightly 必验项变化、或生成新的 full release authority 时复审。

## ADR-OPS-008：P6 full release authority refreshed after backup and dashboard smoke fixes

Date：2026-07-02
Status：Accepted
Owner：`Ops-Harbor` / `QA-Gate` / `PM-Nova` / `FE-Pixel` / `Sec-Sentinel`

Context：

- ADR-OPS-007 规定不能用 CI/focused evidence 代替 current full release authority。
- 本地 Docker MySQL 环境可以完成备份恢复，但宿主机可能没有 `mysql`/`mysqldump`，原 backup preflight 对本地 Docker 开发者不够友好。
- 首轮 full refresh `release-evidence/p6-full-release-refresh-20260702-0816` 暴露 Dashboard mocked smoke 的 `/api/auth/me` 路由泄漏；第二轮 `release-evidence/p6-full-release-refresh-20260702-0830` 暴露前端 validator 静态规则未同步新 mock 模式。
- P6 后续代码理解、跨文件检索和报告引用质量增强需要一份当前 verifier 下完整可复核的 release authority。

Decision：

- `release-evidence/p6-full-release-refresh-20260702-0845` 成为 current full release authority。
- backup preflight 支持 `SOURCELENS_BACKUP_TOOLCHAIN_EXECUTOR=docker:<container>`，但必须校验安全 Docker container name、`docker inspect` 和容器内 `mysql`/`mysqldump`。
- Dashboard next action mocked smoke 使用单一 route mock 模型，避免 repeated `unroute/route` 期间把 `/api/auth/me` 泄漏到 Vite proxy。
- GitHub App drill、GitHub webhook drill 和真实 LLM provider run 继续作为高级集成层 SKIP，不阻塞当前公开仓库/P6 主线，但不得宣称完成。

Impact：

- 当前 full authority 覆盖完整 `release` profile，结果为 `required_failures=0`、`optional_warnings=0`、`skipped=3`。
- 备份恢复证据绑定 backup id `p6-20260702080733`，restore drill 证明 30 tables、30592 workspace entries、148 artifact entries 均通过。
- `p6-full-release-refresh-20260702-0816` 和 `p6-full-release-refresh-20260702-0830` 均只保留为失败历史，不得作为 authority。
- 后续 P6/P9 开发可以引用 `p6-full-release-refresh-20260702-0845` 作为当前可复核基线。

Evidence：

- `release-evidence/p6-full-release-refresh-20260702-0845`
- `make verify-release-evidence DIR=release-evidence/p6-full-release-refresh-20260702-0845`
- `scripts/backup-restore-preflight.sh`
- `web-console/tests/dashboard-next-action-smoke.spec.ts`
- `scripts/validate-frontend-ui.mjs`
- `docs/OPERATIONS_RUNBOOK.md`
- `docs/PHASE_REQUIREMENTS.md`
- `docs/AGENT_STATUS_BOARD.md`

Review trigger：

- 生成下一份 full release authority、修改 backup preflight executor 语义、修改 Dashboard smoke route mock、或正式启用 GitHub App/webhook/真实 LLM provider E2E 时复审。

## ADR-UX-007：App Shell topbar readability must be proven by layout guards

Date：2026-07-02
Status：Accepted
Owner：`Product-Luna` / `FE-Pixel` / `QA-Orion` / `QA-Gate`

Context：

- 用户反馈页面顶部文字在浏览器中看不全，且主按钮存在文字对比度风险。
- 旧 App Shell smoke 已检查 topbar title 和 page heading 在 viewport 内，但这不足以证明 title/desc 没有被 topbar 容器、Ant Header 默认行高、页面层级或移动端压缩裁切。
- P9 当前要求从“功能可用”推进到“产品可用”，顶部栏和主按钮是所有主链路页面共同入口，不能依赖人工截图发现回归。

Decision：

- App Shell topbar 必须是自适应 header：不使用固定 64px 高度，不收缩，不隐藏 title/desc 溢出，并保持高于 page content 的 stacking layer。
- Browser smoke 必须在每个受保护顶层 route 和每个核心 viewport 下证明：
  - topbar title contained by header
  - visible topbar desc contained by header
  - page content starts after topbar
  - page heading below topbar
  - primary buttons keep white computed text/text-fill color
- `APP_SHELL_UI_SMOKE_OK` 必须输出 `layoutGuards`，并由 `validate-frontend-ui.mjs` 静态锁住。

Impact：

- “顶部文字看不全”不再只是视觉主观判断，而是 P9 App Shell release 前置门禁。
- 后续深层页面 UI 改造可以继续进行，但不得破坏全局 topbar、page heading 和 primary action 可读性。
- 本轮是 focused UI gate，不刷新 full release authority。

Evidence：

- `web-console/src/styles/app.css`
- `web-console/tests/app-shell-ui-smoke.spec.ts`
- `scripts/validate-frontend-ui.mjs`
- `docs/PHASE_REQUIREMENTS.md`
- `CI=true make app-shell-ui-smoke`

Review trigger：

- 修改 App Layout、Ant Design Layout/Header 使用方式、全局 page padding、移动端 topbar 行为、ActionButton 对比度策略或 App Shell smoke route matrix 时复审。

## ADR-P6-008：Project QA remains the primary code explanation loop; AgentChat handoff is a draft continuation

Date：2026-07-03
Status：Accepted
Owner：`Ada / Anscombe`、`Hopper / Helmholtz`、`Lead-Codex`

Context：

- ProjectDetail 已具备 `代码理解定位入口`，可从 current scan 的 code_chunks 结果展示文件行号、source label、证据角色、证据类型、相关分、召回模式和 Readiness。
- Project QA 已经具备引用、可信度摘要、来源定位、AutoRepair handoff 门禁和 recoverable smoke。
- AgentChat 已具备会话、工具审计、AgentTask/scan report 闭环栏，但直接把 ProjectDetail 入口升级为自动 AgentTask 闭环会引入过度声明和安全边界风险。
- QA 复核指出 raw prompt 不应进入 URL，AgentChat handoff 必须先作为结构化证据草稿，而不是自动执行。

Decision：

- Project QA 的 `解释此处` 继续作为代码理解主解释闭环。
- ProjectDetail 的 `交给 Agent` 仅构造结构化 AgentChat handoff URL，不携带 raw prompt、raw stack、代码正文、模型输出或 token。
- AgentChat 读取 `handoff=code-understanding` 后展示 `代码理解交接包`，并基于结构化元数据本地生成草稿。
- 未选择会话时不得自动发送；创建或选择会话后只保留草稿。
- 本阶段不自动创建 AgentTask、不触发写工具、不创建 AutoRepair、不声明 Agent 已完成理解。

Impact：

- 用户可以从 ProjectDetail 把当前 scan 的代码证据平滑带到 AgentChat 续问。
- 工具审计和会话闭环仍由 AgentChat 原有机制承担。
- 该能力是 mocked UI + static/build focused evidence，不刷新 full release authority。
- 后续若升级为完整 AgentTask 闭环，必须新增后端受控 API、审计字段、release verifier 和 security forged matrix。

Evidence：

- `web-console/src/pages/ProjectDetail.tsx`
- `web-console/src/pages/AgentChat.tsx`
- `web-console/tests/agent-chat-closure-rail-smoke.spec.ts`
- `scripts/validate-frontend-ui.mjs`
- `make agent-chat-closure-rail-ui-smoke`
- `make project-qa-recoverable-ui-smoke`

Review trigger：

- 修改 ProjectDetail `交给 Agent` URL 字段、AgentChat handoff 草稿生成、AgentChat 自动发送行为、AgentTask 创建/绑定流程、工具权限策略、release evidence AgentChat marker 或相关 smoke 时复审。

## ADR-P6-009：Code understanding handoff may create a PENDING AgentTask, but execution remains explicit

Date：2026-07-03
Status：Accepted
Owner：`Goodall / Lovelace`、`Fermat / Turing`、`Lead-Codex`

Context：

- ADR-P6-008 已把 ProjectDetail 到 AgentChat 的 code-understanding handoff 定义为结构化草稿续问入口，禁止 raw prompt 进 URL、禁止自动发送、禁止声明 Agent 已完成理解。
- 下一步需要让这个入口进入真实 AgentTask/Conversation 闭环，否则右侧“Agent 闭环下一步”只能对已绑定会话生效，无法把代码理解证据沉淀成可追踪任务。
- 现有 `AgentTaskService.create()` 已具备创建 AgentTask、Conversation 和 ExecutionTask 的基础能力，但旧 DTO 不能绑定已有 Conversation。
- QA/Security 复核指出 UI smoke 不能伪装成真实后端证明，后端必须 fail closed 校验绑定边界。

Decision：

- 复用现有 `POST /api/agent-tasks`，在 `CreateAgentTaskRequest` 中新增可选 `conversationId`，而不是新增更大的自动编排 API。
- `conversationId` 为空时保持旧行为：创建 AgentTask 时自动创建绑定 Conversation。
- `conversationId` 存在时，后端必须验证 Conversation 属于同项目、同用户、状态为 `ACTIVE` 且尚未绑定 AgentTask。
- Conversation 绑定写入必须使用条件更新，要求 `agent_task_id IS NULL`，并发重复绑定必须返回 conflict。
- AgentChat 的 code-understanding handoff 只提供显式按钮创建 `PENDING` / `CUSTOM` AgentTask；成功后保留草稿，用户仍需手动发送问题。
- Receipt 只允许结构化证据元数据和安全布尔位，不保存 raw prompt、raw stack、源码正文、模型回答或 token。
- 本阶段不自动调用 `/start`，不自动调用 `/messages`，不触发 LLM、工具、AutoRepair、PR 或写操作。

Impact：

- AgentChat 从“预填草稿”升级为“可追踪 PENDING AgentTask 草稿”，但不越过安全执行边界。
- PromptBuilder 后续可以通过真实 `conversation.agentTaskId` 解析 scanTaskId，从而比纯前端 query 更稳定。
- 后端 service test 证明真实绑定规则；mocked UI smoke 只证明前端显式行为和 marker 合同。
- full release authority 不刷新；release verifier/security forged matrix 尚未把该 marker 升级为 release evidence 合同。

Evidence：

- `backend-spring/src/main/java/com/sourcelens/module/agent/dto/CreateAgentTaskRequest.java`
- `backend-spring/src/main/java/com/sourcelens/module/agent/service/AgentTaskService.java`
- `backend-spring/src/test/java/com/sourcelens/AgentTaskServiceTest.java`
- `web-console/src/pages/AgentChat.tsx`
- `web-console/tests/agent-chat-closure-rail-smoke.spec.ts`
- `scripts/validate-frontend-ui.mjs`
- `mvn -Dtest=AgentTaskServiceTest test`
- `make agent-chat-closure-rail-ui-smoke`

Review trigger：

- 修改 `CreateAgentTaskRequest.conversationId`、AgentTask create transaction、Conversation 绑定条件、AgentChat handoff 按钮、AgentChat 自动发送/启动逻辑、AgentTask start 行为、AgentChat marker 或 release verifier/security forged matrix 时复审。

## ADR-P6-010：AgentChat binding evidence must be release-verifiable and forge-resistant

Date：2026-07-03
Status：Accepted
Owner：`Godel / Curie`、`Aquinas / Noether`、`Lead-Codex`

Context：

- ADR-P6-009 已允许 code-understanding handoff 显式创建 `PENDING` / `CUSTOM` AgentTask 并绑定 Conversation，但当时证据主要停留在后端单测和 mocked UI smoke。
- 该能力涉及任务、会话、扫描证据和后续 Agent 行动栏，不能长期只由前端 marker 自证。
- Release/Ops 复核要求它进入 release evidence profile/schema，并且 release/nightly 默认包含该 smoke。
- QA/Security 复核要求 marker 防伪必须覆盖 missing/duplicate、缺 binding、raw prompt、auto-start、auto-send、provider/LLM claim 和绑定漂移。

Decision：

- 将 release evidence profile schema 升级为 `3`，新增 `include_agent_chat_closure_rail_ui_smoke`。
- `ci` profile 固定为 false，`release` / `nightly` profile 固定为 true。
- `verify-release-evidence` 对 schema3 包要求 status table 包含 `agent-chat-closure-rail-ui-smoke`。
- 当该 step 为 OK 时，verifier 必须强消费唯一 `AGENT_CHAT_CLOSURE_RAIL_SMOKE_OK` marker。
- marker 必须证明 local mocked UI、无未 mock API、无运行错误、无水平溢出、结构化 handoff、PENDING/CUSTOM binding、same project/scan、backend binding、no raw prompt/stack、no auto-send、no auto-start。
- 顶层 `agentTaskId` 表示本次新建绑定任务，必须与 `agentTaskBinding.agentTaskId` 一致。
- 新增 `release-verifier-agent-chat-marker` security suite，动态构造合法证据包并逐项篡改 marker，确认 verifier fail closed。

Impact：

- AgentChat code-understanding binding 从 focused UI/单测证明升级为 release-verifiable contract。
- 该合同仍不等于完整 Agent 自动执行，不授权 LLM、工具、AutoRepair、PR 或 GitHub App/webhook。
- schema1/2 历史证据包保持兼容；schema3 以后必须显式记录新 include。

Evidence：

- `scripts/release-evidence.sh`
- `scripts/verify-release-evidence.sh`
- `scripts/security-regression-check.sh`
- `.github/workflows/ci.yml`
- `Makefile`
- `web-console/tests/agent-chat-closure-rail-smoke.spec.ts`
- `SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-agent-chat-marker`
- focused minimal release evidence package + `verify-release-evidence`

Review trigger：

- 修改 release evidence schema/profile、AgentChat closure rail smoke marker、AgentTask binding receipt、AgentChat auto-send/start 行为、`verify-release-evidence` marker contract、security forged matrix、CI security suite matrix 或 Makefile security suite 时复审。

## ADR-P6-011：AgentChat handoff manual send must be explicit and release-verifiable

Date：2026-07-03
Status：Accepted
Owner：`Zeno`、`Curie`、`Lead-Codex`

Context：

- ADR-P6-009/010 已允许 code-understanding handoff 创建 `PENDING` / `CUSTOM` AgentTask 并进入 release evidence verifier。
- 但仅证明“创建绑定任务后不自动发送”还不够；产品上用户需要看到下一步是手动发送，质量上 marker 也必须证明点击发送后闭环仍然可回看。
- AgentChat 不能因为 handoff 参数、AgentTask 创建或 conversation 跳转而自动触发 `/messages`、`/start`、工具调用、AutoRepair 或 PR。

Decision：

- AgentChat 对结构化 `CODE_UNDERSTANDING` receipt 且 `rawPromptStored=false/rawStackStored=false/autoSent=false/autoStarted=false` 的 `CUSTOM` task 展示 `代码理解手动发送闭环`。
- 创建绑定任务只预填草稿；用户点击 `发送` 后才允许发起 `/api/conversations/{id}/messages` SSE POST。
- `AGENT_CHAT_CLOSURE_RAIL_SMOKE_OK.codeUnderstandingHandoff.manualSend` 成为 release-verifier 必选字段。
- `manualSend` 必须证明 user-triggered、message after click、no auto-send before click、AgentTask still pending、no auto-start、no write tool、audit visible、closure rail still bound、no raw prompt/stack stored。
- security regression 必须篡改 manual-send marker 并确认 verifier fail closed。

Impact：

- AgentChat 从“受控绑定”推进到“手动确认后的可追踪对话入口”，但仍不越过执行边界。
- Product QA 仍是代码解释主闭环；AgentChat 是受控续问和证据回看路径。
- 该合同不证明真实 LLM/provider 输出质量、真实工具执行、AutoRepair/PR、GitHub App/webhook 或 private repo E2E。

Evidence：

- `web-console/src/pages/AgentChat.tsx`
- `web-console/tests/agent-chat-closure-rail-smoke.spec.ts`
- `web-console/src/styles/app.css`
- `scripts/validate-frontend-ui.mjs`
- `scripts/verify-release-evidence.sh`
- `scripts/security-regression-check.sh`
- `release-evidence/20260703-181321`

Review trigger：

- 修改 AgentChat handoff receipt、manual send UI、`handleSend` 自动触发条件、AgentTask start 行为、closure rail audit/task/scan actions、`manualSend` marker 字段、release verifier 或 forged matrix 时复审。

## ADR-P9-004：AgentTasks task-level raw payload stays hidden in ordinary detail views

Date：2026-07-03
Status：Accepted
Owner：`Lorentz/Zeno`、`Darwin/Curie`、`Lead-Codex`

Context：

- AgentTasks 已支持详情选择、键盘打开和 `taskId` 深链，但 P9 产品质量要求不仅是“能打开”，还要在桌面、普通手机和极窄屏下可读。
- `selectedTask.inputJson/outputJson` 可能包含 prompt、路径、模型中间内容、工具结果或敏感凭据；普通任务详情页不应直接打印这些 raw payload。
- QA/Security 复核指出 step-level `TaskTimeline.outputJson` 仍是独立风险，但本轮只收 task-level payload，避免顺手重构共享组件。

Decision：

- AgentTasks 详情页展示 `原始 Payload 安全边界`，用安全提示替代 task-level raw `inputJson/outputJson`。
- Playwright fixture 必须包含 raw payload 哨兵，并证明页面正文和 marker 均不包含哨兵。
- AgentTasks detail selection smoke 必须覆盖 `1440x900`、`390x844`、`320x740`。
- marker 必须包含 layout/readability/table-scroller/payload-safety proof，并明确 `payloadSafety.scope=TASK_RAW_INPUT_OUTPUT_ONLY`。
- 本轮不新增授权查看 raw payload，不改后端权限，不接入 release verifier/security forged matrix。

Impact：

- AgentTasks 详情页的普通用户体验更接近产品级任务控制台：摘要、步骤、产物和安全边界优先，raw payload 默认隐藏。
- 后续可以按同一模式治理 ExecutionTasks、Artifacts、AuditLogs，或独立治理 `TaskTimeline.step.outputJson`。

Evidence：

- `web-console/src/pages/AgentTasks.tsx`
- `web-console/src/styles/app.css`
- `web-console/tests/agent-tasks-detail-selection-smoke.spec.ts`
- `scripts/validate-frontend-ui.mjs`
- `CI=true make agent-tasks-detail-selection-ui-smoke`
- `CI=true make app-shell-ui-smoke`

Review trigger：

- 修改 AgentTasks detail 信息架构、raw payload 文案、`selectedTask.inputJson/outputJson` 渲染、TaskTimeline step output、AgentTasks smoke marker 或 AgentTasks 三视口矩阵时复审。

## ADR-P9-005：TaskTimeline step output is hidden by default

Date：2026-07-03
Status：Accepted
Owner：`Sec-Nova/Hegel`、`FE-Pixel/Parfit`、`Lead-Codex`

Context：

- ADR-P9-004 已治理 AgentTasks task-level `inputJson/outputJson`，但明确把共享 `TaskTimeline.step.outputJson` 留给独立切片。
- `AgentTasks` 会把 step `outputJson` 传入 `TaskTimeline.output`；旧 `TaskTimeline` 会格式化并渲染 raw JSON，可能暴露模型输出、工具结果、token、Authorization 或 provider raw output。
- `ExecutionTasks` 和 `AutoRepairs` 当前主要传 `description/errorMessage/logSummary`，不是本切片主风险面，但共享组件改造需要保持它们兼容。

Decision：

- `TaskTimeline` 保留 `output` 字段兼容调用方，但普通 UI 不再 parse、format 或 render raw output。
- 当 step output 存在时，仅展示 `步骤输出安全边界` note，提示“步骤输出已留存，默认隐藏；请通过授权审计或产物复核。”。
- AgentTasks smoke fixture 必须包含 step-level raw output 哨兵，并证明页面正文和 marker 均不包含。
- marker `payloadSafety.scope` 使用 `TASK_AND_TIMELINE_STEP_RAW_OUTPUT_ONLY`，只声明 task-level payload 和 timeline step output 的普通 UI 默认隐藏，不声明全系统治理完成。
- 本轮不新增 raw 查看权限、脱敏 UI、审计事件、后端 API、DB schema 或 release verifier schema。

Impact：

- 任务详情从“能看到步骤 output raw JSON”收敛为“能知道 output 已留存但默认隐藏”，符合产品级安全边界。
- 保留步骤 title/status/category/toolName/duration/description/errorMessage 的可复盘信息。
- 后续可按独立 ADR 治理 AuditLogs、Artifacts、LogViewer、artifact preview 或授权 raw 查看链路。

Evidence：

- `web-console/src/components/TaskTimeline.tsx`
- `web-console/src/styles/app.css`
- `web-console/tests/agent-tasks-detail-selection-smoke.spec.ts`
- `scripts/validate-frontend-ui.mjs`
- PASS：`CI=true make agent-tasks-detail-selection-ui-smoke`
- PASS：`CI=true make execution-tasks-detail-selection-ui-smoke`
- PASS：`CI=true make patch-ready-ui-smoke`

Review trigger：

- 修改 `TaskTimeline.output` 展示、`sl-task-timeline-output-notice`、AgentTasks step fixture、payloadSafety scope、raw payload 哨兵或新增 raw 查看入口时复审。

## ADR-P9-006：LogViewer redacts common secrets before display

Date：2026-07-03
Status：Accepted
Owner：`Sec-Nova/Kierkegaard`、`FE-Pixel/Sartre`、`Lead-Codex`

Context：

- ADR-P9-004/005 已治理 AgentTasks task-level payload 与 TaskTimeline step output，但共享日志出口仍可能展示 execution logs、AutoRepair test logs 中的 token、Authorization、provider key、password 或 JWT。
- `ExecutionTasks` 通过 `LogViewer` 展示拼接后的 execution log，`AutoRepairs` 通过 `LogViewer` 展示 `selected.testLog`。
- 后端已有 `SensitiveDataSanitizer`，但前端普通 UI 仍需要 display redaction 作为防御层，避免测试 fixture、第三方日志或后端漏脱敏时直接暴露。

Decision：

- `LogViewer` 在渲染 `<pre>` 前生成 `redactedValue`，普通 UI 不直接渲染原始 `value`。
- 脱敏覆盖 `Authorization: Bearer ...`、独立 `Bearer ...`、`token/apiKey/apikey/api_key/secret/password` key-value、带引号 secret、裸 `sk-...` 和 JWT 三段 token。
- `LogViewer` 暴露 `.sl-log-viewer` 与 `aria-label="脱敏执行日志"`。
- ExecutionTasks 和 PATCH_READY smoke 必须注入 common log secret sentinels，并证明页面和 marker 均不含 raw secret。
- marker scope 使用 `LOG_VIEWER_DISPLAY_REDACTION_ONLY`，只声明共享 LogViewer 显示层脱敏，不声明后端日志、artifact preview、AuditLogs raw JSON 或授权 raw 查看体系完成。

Impact：

- 执行任务和自动修复详情仍可读日志上下文，但常见凭据不会在普通 UI 中明文出现。
- 这是防御层，不替代后端写入侧脱敏和日志访问控制。

Evidence：

- `web-console/src/components/LogViewer.tsx`
- `web-console/tests/execution-tasks-detail-selection-smoke.spec.ts`
- `web-console/tests/patch-ready-smoke.spec.ts`
- `scripts/validate-frontend-ui.mjs`
- PASS：`CI=true make execution-tasks-detail-selection-ui-smoke`
- PASS：`CI=true make patch-ready-ui-smoke`

Review trigger：

- 修改 `LogViewer` 脱敏规则、`.sl-log-viewer`、ExecutionTasks/PATCH_READY logSafety marker、raw log secret 哨兵、后端日志脱敏策略或新增 raw 日志查看入口时复审。

## ADR-P9-007：AuditLogs raw JSON blocks render display-redacted JSON

Date：2026-07-03
Status：Accepted
Owner：`Sec-Nova/Archimedes`、`FE-Pixel/Hooke`、`Lead-Codex`

Context：

- ADR-P9-004/005/006 已分别治理 AgentTasks task-level payload、TaskTimeline step output 和共享 LogViewer，但 `AuditLogs` 抽屉仍存在 raw JSON 展示面。
- `AuditLogs` 页面会展示三类 JSON：审计日志 `inputJson`、Agent 工具调用 `argumentsJson`、GitHub Webhook Delivery `resultJson`。
- “原始 JSON 默认收起”只能降低误触概率，不能解决展开后的凭据泄露；`Sanitized Input` 标题也可能让用户误以为已安全。

Decision：

- `AuditLogs` 普通 UI 继续保留 JSON block 默认折叠，但展开后只渲染 display-redacted JSON。
- `formatRedactedJson` 覆盖 Authorization/Bearer/token/apiKey/secret/password/privateKey/access_token/refresh_token/sk/JWT 等常见凭据形态。
- `compactJson` 表格预览使用同一脱敏函数，避免 GitHub Webhook `resultJson` 在列表层泄露。
- AuditLogs smoke 必须注入 raw secret 哨兵，并证明 `Sanitized Input`、`Arguments`、`Result` 三类展开块都完成脱敏。
- marker scope 使用 `AUDIT_LOGS_RAW_JSON_DISPLAY_REDACTION_ONLY`，只声明 AuditLogs 前端显示层脱敏，不声明后端存储、历史数据、Artifacts preview、CI logs 或授权 raw 查看体系完成。

Impact：

- 审计日志、工具调用和 Webhook delivery 仍可保留结构化排障价值，但普通 UI 不直接泄露常见凭据。
- Candidate receipt provenance 继续从原始 `inputJson` 解析，不改变后端查询合同。

Evidence：

- `web-console/src/pages/AuditLogs.tsx`
- `web-console/tests/audit-logs-detail-selection-smoke.spec.ts`
- `scripts/validate-frontend-ui.mjs`
- PASS：`node scripts/validate-frontend-ui.mjs`
- PASS：`npm --prefix web-console run build`
- PASS：`CI=true make audit-logs-detail-selection-ui-smoke`

Review trigger：

- 修改 `formatRedactedJson`、`redactSensitiveText`、`compactJson`、`.sl-audit-json-redacted`、AuditLogs raw JSON block、AuditLogs smoke raw secret 哨兵、`auditJsonSafety` marker 或新增 raw 审计查看入口时复审。

## ADR-P9-008：Artifact previews render display-redacted content

Date：2026-07-03
Status：Accepted
Owner：`Sec-Nova/Locke`、`FE-Pixel/Pauli`、`Lead-Codex`

Context：

- ADR-P9-004/005/006/007 已分别治理 AgentTasks、TaskTimeline、LogViewer 和 AuditLogs 的普通 UI raw display 风险。
- `Artifacts` 智能预览会展示后端 `preview.text`，包括结构化 JSON、raw JSON details、文本 fallback 和 JSON parse fail fallback。
- 产物内容可能来自扫描器、报告构建器、Agent/AutoRepair 或外部工具输出；即使后端写入侧应脱敏，前端预览仍需要 display redaction 防御层。

Decision：

- `ArtifactPreviewRenderer` 继续用原始 `preview.text` 做 JSON 解析，以保留智能预览结构化能力。
- 渲染普通 UI 前生成脱敏后的 `redactedData`，smart preview、raw JSON details、非 JSON `<pre>` 和 parse fail fallback 均只显示脱敏值。
- raw JSON details 继续默认折叠，但展开后必须渲染 `.sl-artifact-redacted-raw-json`。
- smoke 必须覆盖结构化 JSON、纯文本和损坏 JSON 三条 preview path，并证明页面和 marker 都不含 raw secret。
- marker scope 使用 `ARTIFACTS_PREVIEW_DISPLAY_REDACTION_ONLY`，只声明 Artifacts 普通预览显示层脱敏，不声明下载原文、后端存储或完整 raw 查看授权体系完成。

Impact：

- 用户仍能查看产物摘要、tabs、风险、API、数据库等结构化信息。
- 常见凭据不会在普通预览 UI 中明文出现。
- 下载原文能力和 artifact storage 合同不变；后续如要限制 raw download，需要独立权限/审计 ADR。

Evidence：

- `web-console/src/components/ArtifactPreviewRenderer.tsx`
- `web-console/tests/artifacts-detail-selection-smoke.spec.ts`
- `scripts/validate-frontend-ui.mjs`
- PASS：`node scripts/validate-frontend-ui.mjs`
- PASS：`npm --prefix web-console run build`
- PASS：`CI=true make artifacts-detail-selection-ui-smoke`

Review trigger：

- 修改 `ArtifactPreviewRenderer` redaction 规则、`.sl-artifact-redacted-preview`、`.sl-artifact-redacted-raw-json`、Artifacts preview smoke raw secret 哨兵、`artifactPreviewSafety` marker、artifact preview API、download raw 能力或新增 raw artifact 查看入口时复审。

## ADR-P9-009：CI Diagnostics raw log snippets render display-redacted content

Date：2026-07-03
Status：Accepted
Owner：`Sec-Nova/Franklin`、`FE-Pixel/Ramanujan`、`Lead-Codex`

Context：

- ADR-P9-006/007/008 已治理 LogViewer、AuditLogs raw JSON 和 Artifacts preview 的普通 UI display-redaction 风险。
- `CiDiagnostics` 详情页仍直接展示 `selected.rawLogSnippet`，而 CI 日志常包含 token、Authorization、provider key、password、JWT 或私钥片段。
- 后端写入侧已有 `SensitiveDataSanitizer`，但前端普通 UI 仍应具备显示层纵深防护，避免第三方导入、历史数据或后端漏脱敏造成明文展示。

Decision：

- `CiDiagnostics` 详情不再直接渲染 `selected.rawLogSnippet`。
- 详情日志通过 `redactCiLogSnippet` 生成 `selectedRedactedRawLogSnippet` 后渲染。
- 日志区域保留 `.sl-ci-log`，新增 `.sl-ci-log-redacted` 和 `aria-label="脱敏 CI 日志片段"`。
- smoke 必须注入 raw secret 哨兵，并证明页面和 marker 都不含 raw secret。
- marker scope 使用 `CI_DIAGNOSTICS_RAW_LOG_DISPLAY_REDACTION_ONLY`，只声明 CI Diagnostics 普通 UI 显示层脱敏，不声明后端存储、历史日志清理或 raw 查看授权体系完成。

Impact：

- 用户仍能看到测试名、错误上下文、文件路径和失败摘要。
- 常见凭据不会在 CI Diagnostics 详情普通 UI 中明文出现。
- 后端 API、DB/entity/schema、历史数据和 `SensitiveDataSanitizer` 不变。

Evidence：

- `web-console/src/pages/CiDiagnostics.tsx`
- `web-console/tests/ci-diagnostics-detail-selection-smoke.spec.ts`
- `scripts/validate-frontend-ui.mjs`
- PASS：`node scripts/validate-frontend-ui.mjs`
- PASS：`npm --prefix web-console run build`
- PASS：`CI=true make ci-diagnostics-detail-selection-ui-smoke`

Review trigger：

- 修改 `redactCiLogSnippet`、`.sl-ci-log-redacted`、CI Diagnostics raw log smoke 哨兵、`ciLogSafety` marker、CI Diagnostic DTO/API、后端日志脱敏策略或新增 raw CI 日志查看入口时复审。
## ADR-P11-010：Artifacts raw download marker uses optional-present release verification

Date：2026-07-04
Status：Accepted
Owner：`特朗普` / Delivery Owner。
Roles：`特朗普`、`奥特曼`、`拉里佩奇`、`马斯克`、`达里奥`。

Context：

- `ARTIFACTS_DETAIL_SELECTION_SMOKE_OK` 已能证明 Artifacts raw download acknowledgement、audit receipt deep link 和 no-receipt fallback。
- `AUDIT_LOGS_ARTIFACT_RAW_DOWNLOAD_DEEP_LINK_SMOKE_OK` 已能证明 AuditLogs receipt-id-bound exact event、同 resource 冲突事件不劫持和关联资源回跳。
- 该 smoke 当前属于 focused mocked UI smoke，不属于 release evidence 标准 step。
- 如果直接把它加入标准 release evidence step，会扩大 release 包运行成本和失败面；但如果 verifier 完全不消费该 marker，又会让证据包中的 marker 可被伪造而不被发现。

Decision：

- 采用 optional-present strict verification。
- `verify-release-evidence.sh` 不要求 release evidence 包必须包含 `ARTIFACTS_DETAIL_SELECTION_SMOKE_OK` 或 `AUDIT_LOGS_ARTIFACT_RAW_DOWNLOAD_DEEP_LINK_SMOKE_OK`。
- 如果任意 `.log` 文件包含该 marker，则必须唯一且通过完整 JSON 合同校验。
- 新增 `release-verifier-artifacts-marker` security regression suite，动态证明 Artifacts marker 和 AuditLogs marker 的合法 marker 可过、重复/篡改 marker 会 fail closed。
- CI matrix 与 Makefile 暴露该 suite，static gate 锁定引用。

Impact：

- release evidence 标准 step 数不变。
- focused Artifacts smoke 证据可以被安全吸收到 release 包中。
- 低敏审计定位边界得到 release-level 防伪保护。
- 不改变后端 artifact download/preview/storage 合同。

Evidence：

- `scripts/verify-release-evidence.sh`
- `scripts/security-regression-check.sh`
- `.github/workflows/ci.yml`
- `Makefile`
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-artifacts-marker`
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`

Review trigger：

- 将 `artifacts-detail-selection-ui-smoke` 升级为标准 release evidence step。
- 修改 `ARTIFACTS_DETAIL_SELECTION_SMOKE_OK` marker 字段、raw download audit receipt 逻辑、AuditLogs deep link 参数、Artifacts download/preview API 或 raw artifact 查看权限。

## ADR-GOV-011：SourceLens uses 11 core roles plus 5 on-demand expert roles

Date：2026-07-04
Status：Accepted
Owner：`特朗普` / Delivery Owner。
Roles：`特朗普`、`乔布斯`、`库克`、`马斯克`、`奥特曼`、`黄仁勋`、`梁文峰`、`比尔盖茨`、`扎克伯格`、`达里奥`、`拉里佩奇`、`任正非`、`马云`、`雷军`、`马化腾`、`张一鸣`。

Context：

- SourceLens 已进入长期多阶段重构、产品化、P6 code understanding、P9 UI、P10/P11 安全和 release governance 并行推进状态。
- 用户要求团队像真实公司一样协作，但不希望无节制创建随机物理子 agent，导致 UI 中出现大量不可追踪实例。
- 11 个固定核心角色已经能覆盖产品、项目、架构、安全、DevOps、AI/数据、后端、前端、质量门禁、QA 和交付管理。
- Google 级团队视角下，专项专家能力仍需要存在，但不应把专家池变成每轮常驻成本。

Decision：

- SourceLens 长期采用 `11 个固定核心角色 + 5 个按需专家角色池`。
- 不升级为 16 个常驻物理子 agent。
- 5 个专家分别为：
  - `任正非` / Enterprise Strategy and Compliance Advisor。
  - `马云` / Go-to-Market and Ecosystem Advisor。
  - `雷军` / Product Design and UX Research Advisor。
  - `马化腾` / Platform Reliability and SRE Advisor。
  - `张一鸣` / Data Product and Growth AI Advisor。
- 专家只在触发专项问题时启动，任务第一行必须写固定专家代号和专项角色。
- 物理子 agent 仍按需启动；Codex UI 中的随机昵称只代表运行时实例，不代表项目成员身份。
- 每个运行时实例必须在 `AGENT_ACTIVITY_LOG.md` 记录固定角色、runtime nickname / agent id、范围、结论和是否采纳。

Impact：

- 团队职责保持稳定，避免“456 个子 agent”式历史膨胀。
- 专家能力存在但不拖慢每轮执行。
- 后续 P6/P9/P11/P12 工作均按此模式派发、审核和记录。

Evidence：

- `docs/TEAM_OPERATING_MODEL.md`
- `docs/AGENT_ACTIVITY_LOG.md`
- `docs/AGENT_STATUS_BOARD.md`
- `docs/CODEX_HANDOFF.md`

Review trigger：

- 用户要求新增或替换固定角色。
- 项目进入企业版、多租户、商业化、SRE 生产运行或 AI 质量指标体系阶段，需要重新评估专家池职责边界。
- Codex App 提供可命名持久子 agent 后，需要复审 runtime nickname 与固定角色映射规则。

## ADR-OPS-013：Current full release authority refreshed to release-current-schema-20260704-1618

Date：2026-07-04
Status：Accepted
Owner：`特朗普` / Delivery Owner。
Roles：`黄仁勋` / DevOps Engineer、`达里奥` / Quality Gate。

Context：

- `release-evidence/release-current-schema-20260702-230650` 曾是 current full release authority。
- P11 release verifier 后续加严，要求 `release` / `nightly` profile 必须存在并启用 `public_repo_report_evidence_qa_citation_manifest_present=true`。
- 旧包在最新 verifier 下缺少该 manifest presence 字段，不应继续作为 current authority。
- 本轮 DevOps 只读复核指出 8080 `target/classes` 运行态不适合 release evidence，需要稳定 jar runtime。

Decision：

- `release-evidence/release-current-schema-20260704-1618` 成为新的 current full release authority。
- 生成该包必须使用稳定 backend jar runtime；本轮使用 `SERVER_PORT=19081 make backend-jar`。
- `release-evidence/release-current-schema-20260702-230650` 降级为 historical evidence。
- 后续 current authority 判断以 `docs/OPERATIONS_RUNBOOK.md`、`docs/CODEX_HANDOFF.md`、`docs/PHASE_REQUIREMENTS.md` 和 `docs/AGENT_STATUS_BOARD.md` 顶部状态为准；历史日志中的旧 authority 口径仅代表当轮状态。

Impact：

- P6/P11 最新 focused gates 已被完整 release evidence 吸收。
- 后续公开仓库分析、code_chunks/QA、报告证据、AutoRepair 和 P9 UI 可以基于新 authority 继续推进。
- 生产灾备/回滚、GitHub App/Webhook E2E 和真实 LLM provider run 仍然是后置项，不能因为新包通过而宣称完成。

Evidence：

- `release-evidence/release-current-schema-20260704-1618`
- PASS：`./scripts/verify-release-evidence.sh release-evidence/release-current-schema-20260704-1618`
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-report-evidence-marker`

Review trigger：

- release verifier schema 再次加严。
- public repo smoke、report evidence drawer、AutoRepair patch smoke 或 source-location probe marker schema 变化。
- 生产发布前要求 backup restore drill evidence、rollback plan、GitHub App/Webhook E2E 或真实 provider run 进入 full authority。

## ADR-PRODUCT-014：SourceLens product planes and access model are locked

Date：2026-07-07
Status：Accepted
Owner：`乔布斯` / Product Design、`库克` / Product Operations、`奥特曼` / Security、`特朗普` / Delivery Owner。

Context：

- 当前 SourceLens 技术上已经是前后端分离：`web-console`、`backend-spring`、`analyzer-rust`、`scripts/deploy/docs`。
- 产品上仍然是一个登录后的控制台，导航按功能模块堆叠，没有明确分成 Developer、Governance、Admin/Security 视角。
- 后端当前主要权限模型是登录用户和项目 owner 校验，尚未实现组织、多用户、角色 RBAC。
- 用户要求一次性明确：项目要做成什么样、是否需要前后台分层、目标用户如何映射到页面/权限/导航/主流程/指标，以及还有哪些方向未定。

Decision：

- SourceLens 产品最终形态锁定为：本地优先、证据可追踪、可审计、可自动执行的 Agentic Engineering Intelligence Platform。
- 当前不拆成两个独立前端应用。
- 当前 `web-console` 内部必须按三个产品平面演进：
  - `Developer Workbench`
  - `Engineering Governance Console`
  - `Admin & Security Console`
- 目标用户优先级锁定：
  - P0：个人开发者、后端工程师。
  - P1：架构师/技术负责人、AI Agent 工程团队。
  - P2：外包交接/维护团队。
  - P3：企业管理员/安全合规团队。
- RBAC 方向锁定为 `PlatformAdmin / OrgOwner / ProjectMaintainer / Developer / Viewer / SecurityAuditor / AgentOperator`。
- 公开仓库分析主线继续优先；GitHub App、私有仓库、多用户协作、生产部署仍是高级集成层，不能阻塞当前 P6/P9。
- 产品北极星指标锁定为 `Trusted Engineering Loop Completion Rate`。

Impact：

- P9 UI 重构必须先按三平面导航和页面任务归属推进。
- P10/P12-pre 权限、安全和企业化设计必须兼容目标 RBAC。
- Dashboard 后续必须围绕主链路、证据可信度、风险恢复和工程闭环，不再只做功能入口集合。
- 任何新增页面必须说明目标用户、主流程位置、允许动作、风险动作和指标归属。

Evidence：

- `docs/PRODUCT_POSITIONING_AND_ACCESS_MODEL.md`
- `docs/PHASE_REQUIREMENTS.md`
- `docs/WORK_INTAKE_AND_BACKLOG.md`
- `docs/PRODUCT_METRICS_AND_FEEDBACK.md`

Review trigger：

- 项目决定从本地优先转为 SaaS 优先。
- 企业多租户、私有仓库或组织级 RBAC 进入实现阶段。
- Admin & Security Console 需要独立部署。
- 用户明确改变目标市场或商业化方向。

## ADR-PRODUCT-015：Top-level 62 product operating definitions are frozen

Date：2026-07-07
Status：Accepted
Owner：`乔布斯` / Product Design、`库克` / Product Operations、`达里奥` / Quality Gate、`特朗普` / Delivery Owner。

Context：

- 用户连续追问除产品分层、目标用户、RBAC 和指标外，还缺哪些顶级项目定义。
- 经产品、工程、运营、企业交付和商业化视角收敛后，必须明确 62 项定义，但不能把项目拖入无限制度扩张。
- 当前 SourceLens 已有大量制度文档，继续无限补制度会阻塞 P6/P9/P10/P11/P12-pre 产品主线。

Decision：

- SourceLens 顶级产品级定义体系封顶为 62 项。
- 62 项分三层：
  - 1-34：产品和工程基础定义。
  - 35-50：运营、规模化和平台化定义。
  - 51-62：公司级商业化与企业交付定义。
- 新增 `docs/TOP_LEVEL_PRODUCT_OPERATING_DEFINITIONS.md` 作为封顶总纲。
- 后续不得继续新增“第 63 项”式制度扩张，除非出现战略转向、法律要求、重大安全事故或企业客户强制要求。
- 新需求必须优先映射到 62 项中的已有定义项。
- 定义完成不等于实现完成；企业化、商业化、SaaS、RBAC、法务和安全认证仍按阶段后置。

Impact：

- 后续目标必须改为“按 62 项封顶定义执行产品主线”，而不是继续补制度。
- P9 优先做三平面导航和 Dashboard。
- P6 继续真实 provider/embedding E2E、向量质量和报告引用体验。
- P10/P11/P12-pre 逐步把安全、失败分类、发布通道、RBAC 和生产化落到实现。

Evidence：

- `docs/TOP_LEVEL_PRODUCT_OPERATING_DEFINITIONS.md`
- `CHAIRMAN_BRIEFING.md`
- `docs/SOURCELENS_OPERATING_SYSTEM.md`
- `docs/PHASE_REQUIREMENTS.md`
- `docs/WORK_INTAKE_AND_BACKLOG.md`

Review trigger：

- 法律/合规强制新增定义项。
- 重大安全事故暴露 62 项外的新治理维度。
- 企业客户采购或部署强制要求新增制度。
- SourceLens 从本地优先转为 SaaS 优先。

## AIOS-ADR-001: Freeze Strategic Constitution v2.3 and supersede legacy phase authority

Date: 2026-07-10  
Status: Accepted  
Owner: Human Founder  
Accountable roles: Master CEO, CTO, Chief AI Research, Product Intelligence, Quality & Evaluation, Security

Context:

- The inherited project simultaneously treated P6, P9, P10, P11 and P12-pre as active tracks.
- The requested direction is now a trustworthy autonomous-agent infrastructure research platform, with one year-one software-engineering Agent outcome.
- Continuing both routes would make task priority, product success and capability evidence impossible to interpret.

Decision:

- Freeze `docs/aios/STRATEGIC_CONSTITUTION.md` at v2.3.
- Make the P0-P12 route in that constitution the only current phase model.
- Treat pre-v2.3 P6/P9/P10/P11/P12-pre phases, the broad three-console product plan and the 11+5 team as historical inputs.
- Freeze normal feature development during P0 except bounded emergency security or data-integrity containment.
- Do not delete inherited assets in P0; record disposition in `docs/aios/MIGRATION_LEDGER.yaml`.

Impact:

- The year-one critical path becomes Evaluation Foundation, Repository Intelligence, Single-Agent Runtime, minimum trust and the verified issue-to-evidence loop.
- Broad UI, enterprise, SaaS, GitHub and organization-runtime work is deferred.
- Existing analyzer, graph, retrieval, audit, sandbox and release assets remain candidates for reuse and hardening.

Evidence:

- external P0-A report under `/Users/lijunpeng/Desktop/cc/project/.sourcelens-audit/p0-a-20260710-220800/`
- `docs/aios/STRATEGIC_CONSTITUTION.md`
- `docs/aios/MIGRATION_LEDGER.yaml`

Supersedes:

- current-route and current-team portions of `ADR-OPS-012`, `ADR-PRODUCT-014` and `ADR-PRODUCT-015`;
- it does not erase their historical context.

Review trigger:

- Founder-approved mission or year-one outcome change.

## AIOS-ADR-002: Machine-readable truth is authoritative; ADRs retain rationale

Date: 2026-07-10  
Status: Accepted  
Owner: Human Founder  
Accountable roles: Master CEO, Quality & Evaluation

Context:

- README, status board, handoff, release process and progress logs referenced different current phases and release packages.
- Manually synchronizing multiple large Markdown files created drift and made status labels appear stronger than their evidence.
- Facts and decisions require different lifecycle rules.

Decision:

- `docs/aios/truth/project_state.yaml` is the single authority for current facts, phase, gates, capability levels, active work and evidence pointers.
- `docs/aios/STRATEGIC_CONSTITUTION.md`, `MASTER_EXECUTION_PROTOCOL.md`, `EVALUATION_PROTOCOL.md` and `MIGRATION_LEDGER.yaml` own their declared normative domains.
- This register remains append-only decision rationale and never becomes a current-state database.
- Historical status, handoff, scorecard and progress documents remain evidence sources but cannot override the AIOS authority stack.
- Markdown views may be generated from truth later; duplicated hand-maintained status must not be reintroduced.

Impact:

- Codex starts by reading canonical truth rather than reconstructing state from the latest prose entry.
- Capability levels can advance only from identified evidence.
- A release package remains scoped evidence and is not automatically product or production authority.

Evidence:

- `docs/aios/truth/project_state.yaml`
- `docs/aios/README.md`
- P0-A document-drift findings.

Review trigger:

- A structured service replaces the YAML registry and preserves the same authority, evidence and audit semantics.
