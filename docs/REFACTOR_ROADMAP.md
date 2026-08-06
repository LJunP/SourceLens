# SourceLens 重构路线图

> AIOS v2.3 状态：`HISTORICAL IMPLEMENTATION ROADMAP`。旧阶段、最近验证和下一步不再驱动开发。当前迁移决策见 `aios/MIGRATION_LEDGER.yaml`，当前路线见根目录 `ROADMAP.md`。

> DEFAULT AGENT CONTEXT: `EXCLUDED`。只有当前 Task Contract 明确引用本文件时，才可读取指定章节作为历史证据。

状态：冻结的迁移前实现路线；旧完成声明不代表 AIOS 能力证据。
起点：V0.x 原型向产品级工程平台重构

研发治理：

- `docs/PRODUCT_GOVERNANCE.md` 是后续每轮开发的固定流程，要求先做需求界定、产品合理性审查、安全审查、验证和日志记录。
- `docs/PHASE_REQUIREMENTS.md` 是阶段级需求与验收索引，阶段范围变化或阶段验收前必须更新。
- `docs/PRODUCT_PROGRESS_LOG.md` 是量化进度和阶段日志，每轮 Codex 开发结束前必须追加记录，避免长期目标依赖聊天记忆。
- `docs/TEAM_OPERATING_MODEL.md` 是多 agent 公司式协作模型；Codex 随机昵称只作为运行时标识，长期记录按 `特朗普`、`乔布斯`、`库克`、`马斯克`、`奥特曼`、`黄仁勋`、`梁文峰`、`比尔盖茨`、`扎克伯格`、`达里奥`、`拉里佩奇` 这 11 个固定逻辑岗位归档，并保留 `任正非`、`马云`、`雷军`、`马化腾`、`张一鸣` 5 个按需专家角色池。

最近验证：

- P9 ProjectDetail QA Detailed Audit Compact Summary focused increment：本轮启动 `雷军 / Product Design and UX Research Advisor` 运行时 `Banach / 019f2cb8-b58d-78a2-a7c2-a776d4c46953` 做只读 UX 复核，结论 `PARTIAL`：三格状态摘要产品方向合理，但必须只展示既有 `citationAudit.title/status`、`claimAudit.title/status`、`repairEvidenceGate.label/status`，不能用覆盖率/主张计数冒充状态。`ProjectDetail.tsx` 已在 `QaDetailedEvidenceAuditSection` 的 head 与 detail flow 之间新增 `aria-label="QA 底层审计摘要"`，固定三项为 `引用覆盖`、`主张质量`、`修复门禁`；引用/主张使用 audit title + `qaAuditTagText(tone)`，修复门禁使用 gate label + status。`app.css` 新增 `.sl-qa-detailed-audit-summary` 和 item ready/warning/blocked 样式，纳入响应式 grid 和文本换行；`validate-frontend-ui.mjs` 锁定 summary row、状态来源、详细面板继续可见和 CSS 合同。验证：`node scripts/validate-frontend-ui.mjs`、`npm --prefix web-console run build`、`npm --prefix web-console run smoke:project-qa-recoverable`、targeted `git diff --check` 均 PASS。本轮不刷新 full authority，不改后端/API/DB/ranker/AutoRepair/release schema，不声明 raw/UI schema 完全对齐或真实 provider 质量已验收。
- P9 ProjectDetail QA Detailed Audit Section focused increment：本轮启动 `拉里佩奇 / QA Engineer` 运行时 `Laplace / 019f2cb0-b801-7ad3-8cea-492e39a0f4ea` 做只读 QA 复核，结论 `PARTIAL`：把底层 `引用覆盖审计`、`主张引用质量`、`修复证据门禁` 分组不会破坏内部 aria label 可见性，但旧 validator 规则失败，必须同步修复。`ProjectDetail.tsx` 已新增 `QaDetailedEvidenceAuditSection` 和 `QaRepairEvidenceGatePanel`，用 `section aria-label="QA 底层审计证据"` 分组三块底层审计；内部 `引用覆盖审计`、`主张引用质量`、`修复证据门禁` 继续直接可见，不做默认折叠。`app.css` 新增 `.sl-qa-detailed-audit` ready/warning/blocked、head、flow 和移动端布局；`validate-frontend-ui.mjs` 已适配新结构并锁定 section、内部面板和 repair gate。验证：`node scripts/validate-frontend-ui.mjs`、`npm --prefix web-console run build`、`npm --prefix web-console run smoke:project-qa-recoverable`、targeted `git diff --check` 均 PASS。本轮不刷新 full authority，不改后端/API/DB/ranker/AutoRepair/release schema，不声明 raw/UI schema 完全对齐或真实 provider 质量已验收。
- P9 ProjectDetail QA Readable Evidence Section focused increment：本轮启动 `雷军 / Product Design and UX Research Advisor` 运行时 `Beauvoir / 019f2ca7-7e79-7a80-9cd3-5259488615b1` 做只读 UX 复核，结论 `PARTIAL`：方向合理，但必须补 `QA 可信证据` 统一区块存在、五段顺序和区块外审计/门禁边界。`ProjectDetail.tsx` 已新增 `QaReadableEvidenceSection`，在 assistant QA 回答正文后用 `section aria-label="QA 可信证据"` 包住 `QA 可信度摘要`、`跨文件引用摘要`、`QA 回答报告证据凭证`、`来源文件匹配说明` 和 `QA 下一步动作`；citation audit、claim audit、repair gate、回答引用和 code_chunks 保持在区块外。`app.css` 新增 `.sl-qa-readable-evidence` ready/warning/blocked、head、flow 和移动端布局；`validate-frontend-ui.mjs` 锁定组件、顺序、边界和 CSS 合同。验证：`node scripts/validate-frontend-ui.mjs`、`npm --prefix web-console run build`、`npm --prefix web-console run smoke:project-qa-recoverable`、targeted `git diff --check` 均 PASS。本轮不刷新 full authority，不改后端/API/DB/ranker/AutoRepair/release schema，不声明 raw/UI schema 完全对齐或真实 provider 质量已验收。
- P6/P9 ProjectDetail QA Readable Evidence View Model focused increment：本轮启动 `雷军 / Product Design and UX Research Advisor` 运行时 `Faraday / 019f2ca0-b1c9-7be0-935f-421dd6025923` 做只读产品复核，结论 `PASS`：把 QA 可信度、跨文件引用、来源凭证、来源定位可信度和修复放行收敛到 `QaReadableEvidenceViewModel` 产品合理。`ProjectDetail.tsx` 已新增 `QaReadableEvidenceViewModel` 与 `buildQaReadableEvidenceViewModel(msg)`，集中复用 `qaRepairEvidenceGate`、`citationCoverageAudit`、`claimCitationAudit`、`qaTrustSummary`、`qaCrossFileCitationSummary`、`qaAnswerSourceEvidenceReceipt`、`qaSourceFileMatchRelease`；渲染层改为从 `readableEvidence` 消费面板数据。`validate-frontend-ui.mjs` 已锁定 view model、builder 和渲染入口。验证：`node scripts/validate-frontend-ui.mjs`、`npm --prefix web-console run build`、`git diff --check -- web-console/src/pages/ProjectDetail.tsx scripts/validate-frontend-ui.mjs` 均 PASS。本轮不刷新 full authority，不改后端 API/DTO/DB/ranker/AutoRepair/release marker schema，不声明 raw/UI schema 完全对齐或真实 provider 事实质量已验收。
- P6 Code QA First PRIMARY Exact Anchor Evidence focused live evidence：本轮启动 `梁文峰 / Data-AI Engineer` 运行时 `Meitner / 019f2c5f-d650-7453-92ca-2009e161d8ba` 做只读 P6 复核，结论 `PASS_TO_IMPLEMENT`：需要在 public repo smoke 中把 Code QA 第一条 PRIMARY 结果是否保持 exact anchor 变成可验证合同。`public-repo-analysis-smoke.sh` 已在 `codeUnderstandingFixture.codeQa` 输出 `firstPrimaryIndex=0`、`firstPrimaryContextRole=PRIMARY`、`firstPrimaryExactAnchorPreserved=true` 及 file/range 旁证；`verify-release-evidence.sh` 对新字段做 optional-present strict；`security-regression-check.sh` 新增 first-primary false、index drift、context drift、file mismatch、range miss forged cases。focused live public repo smoke PASS：`projectId=351`、`repositoryId=312`、`scanTaskId=266`，anchor `ConfigController#page`，`methodLine=37`，first PRIMARY range `1-50`。验证：current full authority verifier PASS、static security regression PASS、public repo marker forged matrix PASS。本轮不刷新 full authority，不改后端 API/DTO/DB/embedding/LLM provider/前端 UI/GitHub App/webhook。
- P11 Current Full Release Authority Refresh：本轮启动 `黄仁勋 / DevOps Engineer` 运行时 `Chandrasekhar / 019f2c30-d9f7-72e2-b78b-e028bd1bb364` 做只读 DevOps 复核，结论 `PARTIAL accepted`：缺 `SOURCELENS_BASE_URL`、8080 `target/classes` 运行态和旧 authority verifier 风险必须先处理。随后使用 `SERVER_PORT=19081 make backend-jar` 启动稳定 jar runtime，并以 `SOURCELENS_BASE_URL=http://localhost:19081 SOURCELENS_RELEASE_EVIDENCE_RUN_ID=release-current-schema-20260704-1618 make release-evidence-release` 生成当前 full release authority `release-evidence/release-current-schema-20260704-1618`。独立 verifier PASS，结果 `required_failures=0`、`optional_warnings=0`、`skipped=5`；已吸收 source-location probe v4 exact first-result proof、report evidence QA citation manifest fail-closed、report evidence QA citation narrative binding、report evidence drawer 当前 smoke fixture 和 AutoRepair patch 当前 backend smoke fixture。旧 `release-evidence/release-current-schema-20260702-230650` 降级为 historical evidence，最新 verifier 下缺 `public_repo_report_evidence_qa_citation_manifest_present=true`，不得继续作为 current authority。后置边界仍为 backup restore drill evidence、rollback plan、GitHub App drill、GitHub webhook drill、真实 LLM provider run。
- P6 Code Location Function@SourceURL Stack Frame Support focused evidence：本轮启动 `梁文峰 / Data-AI Engineer` 运行时 `Plato / 019f2b6e-bcac-7262-8417-7602ce0b3c37` 做只读 P6 复核，结论 `PARTIAL accepted`：下一条更大切片建议做 report evidence QA multi-anchor citation quality evaluation；当前先闭环更小的浏览器 stack frame parser 缺口。`CodeLocationHintParser` 新增 `FUNCTION_AT_FILE_HINT_PATTERN`、`addFunctionFileHints(...)` 和 `simpleFunctionName(...)`，支持 `AuthStore.fetchUser@https://app.example.com/assets/auth-store.ts?t=...:85:13` 形态；`methodAnchorFileHints` 能生成 `auth-store.ts/authstore.ts` 候选；`ProjectDetail.classifyCodeUnderstandingQuery` 将该形态归类为 `STACK_TRACE`。验证：`node scripts/validate-frontend-ui.mjs`、`mvn -q -f backend-spring/pom.xml -Dtest=CodeLocationHintParserTest,CodeChunkServiceTest test`、`bash -n scripts/public-repo-analysis-smoke.sh scripts/verify-release-evidence.sh scripts/security-regression-check.sh`、`npm --prefix web-console run build` 均 PASS。本轮不刷新 full authority，不改 API/DB/RAG/AutoRepair gate/release schema，不声明通用语义理解或所有浏览器栈帧都可定位。
- P9/P11 Frontend Vendor Chunk Boundary Hardening focused evidence：本轮吸收 `雷军 / Product Design and UX Research Advisor` 运行时 `Einstein / 019f2b60-6671-7843-8b79-51e6975f339b` 的只读复核结论：Project QA code_chunks evidence combination 已是既有能力，不作为新切片重复实现。随后收口 Vite 构建质量：`vite.config.ts` 与 `vite.config.js` 统一拆分 `vendor-react`、`vendor-http`、`vendor-antd`，AntD/icons/cssinjs/rc 同归 `vendor-antd`，`chunkSizeWarningLimit=1100` 作为受控第三方缓存边界；`validate-frontend-ui.mjs` 锁定该配置，防止退回单入口大包或 AntD circular split。验证：`node scripts/validate-frontend-ui.mjs`、`bash -n scripts/verify-release-evidence.sh scripts/security-regression-check.sh`、`git diff --check -- web-console/vite.config.ts web-console/vite.config.js scripts/validate-frontend-ui.mjs`、`npm --prefix web-console run build` 均 PASS；build 输出无 Vite chunk-size warning、无 Rollup circular manual chunk warning。本轮不刷新 full authority，不声明首屏性能或运行时性能已完成。
- P10 Artifact Raw Download Receipt ID Failure Boundary Hardening focused evidence：补齐 receipt id traceability 的失败边界。`AuditLogServiceTest.record_shouldReturnNullWhenAuditInsertFails` 证明 audit insert 异常返回 `null` 且不外抛；`ArtifactControllerTest.downloadArtifact_shouldNotExposeAuditHeaderWhenAuditInsertFails` 证明 raw download 在 audit record 返回 `null` 时仍返回文件但不暴露 `X-SourceLens-Audit-Log-Id`。Artifacts 页面有 id 时显示精确 receipt；无 id 时显示“审计定位入口已准备”，只按资源、动作和状态过滤，不显示 `receipt #...`。`artifacts-detail-selection-smoke` 新增 `rawDownloadAuditFallback.scope=ARTIFACTS_RAW_DOWNLOAD_AUDIT_FALLBACK_WITHOUT_RECEIPT_ID_ONLY`，证明 no-header fallback URL 不含 `auditLogId`，不含 raw payload/filename，且不宣称 receipt id。验证：`mvn -q -f backend-spring/pom.xml -Dtest=ArtifactControllerTest,AuditLogServiceTest test`、`node scripts/validate-frontend-ui.mjs`、`CI=true npm --prefix web-console run smoke:artifacts-detail-selection` 均 PASS。本轮不刷新 full authority，不改变 audit failure fail-soft 合同。
- P10 Artifact Raw Download Receipt ID Traceability focused evidence：`AuditLogService.record(...)` 返回 inserted audit log id，AuditLogs list API 支持 `auditLogId` filter 且继续保留 `projectId` 边界；artifact raw download 成功响应暴露 `X-SourceLens-Audit-Log-Id`，CORS expose 该 header；Artifacts 读取 header 后生成含 `auditLogId` 的 AuditLogs deep link；AuditLogs 解析 `auditLogId` 并要求 id/resource/action/status exact match 后才自动打开事件。`artifacts-detail-selection-smoke` 证明 `auditLogId=904` 从 download response header 绑定到 URL，`audit-logs-detail-selection-smoke` 证明 `auditLogId=904` 命中 exact `ARTIFACT_RAW_DOWNLOAD/SUCCESS` 且同 resource 相邻事件不劫持。验证：`mvn -q -f backend-spring/pom.xml -Dtest=ArtifactControllerTest,AuditLogControllerTest,AuditLogServiceTest,AutoRepairServiceTest test`、`node scripts/validate-frontend-ui.mjs`、`CI=true npm --prefix web-console run smoke:artifacts-detail-selection`、`CI=true npm --prefix web-console run smoke:audit-logs-detail-selection`、`npm --prefix web-console run build` 均 PASS。本轮不刷新 full authority；`auditLogId` 只是 receipt locator，不是授权凭据，不声明 raw artifact 内容脱敏、已扫描、无 secret 或完整 raw download 授权体系完成。
- P10 Artifact Raw Download Audit Deep Link Traceability focused evidence：Artifacts raw download success 后展示 `原始产物下载已记录审计`，并通过低敏 AuditLogs filter URL 追踪 `ARTIFACT_RAW_DOWNLOAD/SUCCESS` receipt；AuditLogs `RESOURCE_OPTIONS` 增加 `ARTIFACT`，`ARTIFACT` 关联资源回跳 `/artifacts?projectId=...&artifactId=...`，表格/抽屉按钮暴露 `data-sl-target-url` 作为浏览器证据。`artifacts-detail-selection-smoke` 新增 `rawDownloadAuditDeepLink.scope=ARTIFACTS_RAW_DOWNLOAD_AUDIT_DEEP_LINK_ONLY`，证明 project/resource/action/status bound、successOnly、lowSensitiveQueryOnly、URL 不含 raw payload/filename/storagePath；`audit-logs-detail-selection-smoke` 新增 `AUDIT_LOGS_ARTIFACT_RAW_DOWNLOAD_DEEP_LINK_SMOKE_OK`，证明 exact event 命中、同 artifact 其他 action 不劫持、associated resource return bound。验证：`node scripts/validate-frontend-ui.mjs`、`CI=true npm --prefix web-console run smoke:artifacts-detail-selection`、`CI=true npm --prefix web-console run smoke:audit-logs-detail-selection`、`npm --prefix web-console run build`、scoped `git diff --check` 均 PASS。本轮不刷新 full authority，不声明 raw artifact 内容脱敏、已扫描、无 secret 或完整 raw download 授权体系完成。
- P10 Artifact Raw Download Acknowledgement And Audit Receipt focused evidence：`/api/projects/{projectId}/artifacts/{artifactId}/download` 增加 `rawDownloadAcknowledged` fail-closed 参数；未确认请求返回 `400` 且不读取 bytes，确认下载写入 `ARTIFACT_RAW_DOWNLOAD` audit receipt，input 只记录 artifact metadata、`downloadKind=RAW_BLOB` 和 acknowledgement 状态，不记录 raw blob、`storagePath`、源码正文、完整 diff 或 preview text。`Artifacts` 页面下载前弹出 raw download 确认，并通过 `artifactApi.download(projectId, artifactId, true)` 携带确认边界；`artifacts-detail-selection-smoke` 新增 `rawDownloadBoundary.scope=ARTIFACTS_RAW_DOWNLOAD_ACKNOWLEDGEMENT_AUDIT_BOUNDARY_ONLY`，证明 request bound、acknowledgement present、receipt expected、no drawer hijack、`rawDownloadRedactionClaim=false`、marker no raw payload。验证：`mvn -q -f backend-spring/pom.xml -Dtest=ArtifactControllerTest test`、`node scripts/validate-frontend-ui.mjs`、`CI=true npm --prefix web-console run smoke:artifacts-detail-selection` 均 PASS。本轮不刷新 full authority，不声明 raw artifact 内容脱敏、已扫描、无 secret 或完整 raw download 授权体系完成。
- P9 AgentChat Title Handoff And API Error Display Redaction focused evidence：`AgentChat` 的 conversation title、sidebar title、delete label、code-understanding handoff URL params/display/title attr/composer/generated task title、page-level API error state 和 local toast 已接入 shared display redaction。`agent-chat-closure-rail-smoke` 在 conversation title、handoff URL filePath/lineRef 和 mocked API error message 中注入 raw secret，新增 `agentChatConversationTitleRedaction`、`agentChatHandoffDisplayRedaction`、`agentChatApiErrorStateRedaction` 三个 marker scope，证明 UI/body/URL/marker raw hidden，且 API error toast raw hidden。验证：`node scripts/validate-frontend-ui.mjs`、`CI=true npm --prefix web-console run smoke:agent-chat-closure-rail`、`npm --prefix web-console run build` 均 PASS。本轮不刷新 full authority，不改后端 DB、API/SSE 原文、network payload、raw download/export、历史 payload、release evidence schema、GitHub App 或真实 provider。
- P9 AgentChat Message And Error Display Redaction focused evidence：`AgentChat` 的 persisted message content、persisted `errorMessage` 和 streaming content 代码路径已接入 shared display redaction。`agent-chat-closure-rail-smoke` 在 `ConversationMessage.content` 和 `errorMessage` 中注入 Authorization、Bearer、apiKey、password、JWT-like raw secret，新增 `AGENT_CHAT_CLOSURE_RAIL_SMOKE_OK.agentChatMessageErrorRedaction`，证明 message log、error tag、body、URL 和 marker raw hidden、safe marker visible、redaction visible、marker no raw；已有 `agentToolCallRedaction` scope 继续证明工具调用 args/result 脱敏。验证：`node scripts/validate-frontend-ui.mjs`、`CI=true npm --prefix web-console run smoke:agent-chat-closure-rail`、`npm --prefix web-console run build` 均 PASS。本轮不刷新 full authority，不改后端审计存储、API/SSE 原文、network payload、raw download/export、历史对话、release evidence schema、GitHub App 或真实 provider。
- P9 Project QA AutoRepair Candidate Source Evidence Display Redaction focused evidence：`ProjectDetail` 的 QA answer、回答来源凭证、来源文件匹配说明、AutoRepair targetDesc、sourceEvidence URL params、citation evidenceReason 和 create payload handoff 已接入 shared display redaction。`project-qa-autorepair-candidate-smoke` 在 QA answer、sourceEvidenceRef、citation evidenceReason、repairEvidenceGateReason 和 cited question 中注入 Bearer、Authorization、apiKey、password、JWT-like raw secret，输出 `PROJECT_QA_AUTOREPAIR_CANDIDATE_SMOKE_OK.qaAnswerSourceReceipt.redaction`，证明 UI/body/URL/payload/marker raw hidden、safe marker visible、redaction visible、marker no raw。验证：`node scripts/validate-frontend-ui.mjs`、`npm --prefix web-console run build`、`CI=true npm --prefix web-console run smoke:project-qa-autorepair-candidate`、`CI=true npm --prefix web-console run smoke:report-autorepair-candidate` 均 PASS。本轮不刷新 full authority，不改后端审计存储、API response、network payload、raw download、历史 QA/AutoRepair payload、release evidence schema、GitHub App 或真实 provider。
- P9 AutoRepairs Candidate Provenance Receipt Display Redaction focused evidence：`AutoRepairs` 的 report-derived `targetDesc`、Candidate/Draft Receipt、Source Bridge QA question、candidate gate、PR confirm summary 和 `data-sl-target-url` 已接入 shared display redaction。`report-autorepair-candidate-smoke` 在 report-derived target、mocked `AUTO_REPAIR_CANDIDATE_CREATED.inputJson`、provenance 白名单字段和 `repairEvidenceGateReason` 中注入 Bearer、apiKey、password、quoted secret、JWT-like raw secret，输出 `REPORT_AUTOREPAIR_CANDIDATE_UI_SMOKE_OK.candidateReceiptRedaction`，证明 UI/body/URL raw hidden、safe marker visible、redaction visible、marker no raw。验证：`node scripts/validate-frontend-ui.mjs`、`npm --prefix web-console run build`、`CI=true npm --prefix web-console run smoke:report-autorepair-candidate`、`CI=true npm --prefix web-console run smoke:patch-ready` 和 scoped `git diff --check` 均 PASS。本轮不刷新 full authority，不改后端审计存储、API response、network payload、raw download、历史数据、release evidence schema、GitHub App 或真实 provider。
- P9 ScanTaskDetail Report Evidence Metadata Redaction focused evidence：`ScanTaskDetail` 报告证据抽屉、Project QA URL、复制证据引用、`质量风险`/技术债/建议列表、风险定位 QA 问题和 AutoRepair target 描述已接入 shared display redaction；`ProjectDetail` 报告证据来源桥展示、复制和重新检索使用 `redactedEvidenceRefForOutput`，避免 URL evidence params 被原样渲染或复制。`report-evidence-drawer-smoke` 在报告风险 summary/impact/suggestion/question 中注入 raw secret fixture，输出 `REPORT_EVIDENCE_DRAWER_SMOKE_OK.questionReferenceDeeplinkRedaction`，证明 question、drawer、页面 body、QA deeplink URL、clipboard 和 manual copy fallback 均不出现原文且出现 `[REDACTED]`。同时 `main.tsx` 补 AntD `App` 上下文，`ScanTaskDetail` 改用 `App.useApp()` message 实例，复制流程无 runtime warning。验证：`node scripts/validate-frontend-ui.mjs`、`npm --prefix web-console run build`、`CI=true npm --prefix web-console run smoke:report-evidence-drawer` 均 PASS。本轮不刷新 full authority，不改后端 artifact/code_chunks 存储、API response、DevTools/network、raw download、历史报告产物、release evidence schema、GitHub App 或真实 provider。
- P9 ScanTaskDetail ArtifactFallback Summary JSON Redaction focused evidence：`ScanTaskDetail` 的 `ArtifactFallback` 降级路径已从 raw `JSON.stringify(data, null, 2)` 改为 `stringifyRedactedPayload(data, 2)`，渲染区域为 `.sl-artifact-fallback-redacted-raw-json` 与 `aria-label="脱敏分析产物 JSON"`。`report-evidence-drawer-smoke` 新增独立 `SCAN_TASK_DETAIL_ARTIFACT_FALLBACK_SMOKE_OK`，强制主报告 preview 无效并让 fallback artifact `summaryJson` 携带 raw secret fixture，三视口证明 fallback visible、safe marker visible、raw secrets hidden、body raw hidden、redaction visible、marker no raw。验证：`node scripts/validate-frontend-ui.mjs`、`npm --prefix web-console run build`、`CI=true npm --prefix web-console run smoke:report-evidence-drawer` 和 scoped `git diff --check` 均 PASS。本轮不刷新 full authority，不改后端 artifact 存储、artifact preview API、raw download、DevTools/network、历史产物、release evidence schema、GitHub App 或真实 provider。
- P9 Project QA code_chunks Search Preview Redaction focused evidence：`ProjectDetail` 的 Project QA code_chunks 搜索结果卡片新增 `redactedChunkPreview(chunk)`，预览区渲染 `.sl-search-code-preview-redacted` 与 `aria-label="脱敏 code chunk 搜索结果预览"`，`copyChunkCitation` 复制前同样使用脱敏后的 chunk preview。`project-qa-recoverable-smoke` 在 `candidateChunk` 与 `adjacentContextChunk` 的 `content/contentPreview` 注入 raw secret sentinel、Bearer、OpenAI-style key、JWT-like token、quoted secret 和 password，断言预览、卡片、页面 body、复制引用和 marker 均不出现原文且出现 `[REDACTED]`；marker 输出 `codeChunkEvidenceCard.redaction.scope=PROJECT_QA_CODE_CHUNK_PREVIEW_DISPLAY_REDACTION_ONLY`、`surface=PROJECT_QA_CODE_CHUNKS_SEARCH`、`rawSecretsHidden=true`、`bodyRawSecretsHidden=true`、`copiedCitationRedacted=true`、`markerContainsRawSecret=false`。验证：`node scripts/validate-frontend-ui.mjs`、`npm --prefix web-console run build`、`CI=true npm --prefix web-console run smoke:project-qa-recoverable` 均 PASS。本轮不刷新 full authority，不改后端 code_chunks 存储、API response、RAG payload、DevTools/network、raw download、历史数据、权限系统或 GitHub App。
- P9 Shared Frontend Display Redaction Utility focused evidence：新增 `web-console/src/utils/displayRedaction.ts`，统一提供结构化对象、JSON/text fallback、copy/export、截断前脱敏和循环引用保护；`AgentToolCall`、`DiffViewer`、`LogViewer`、`ArtifactPreviewRenderer`、`AuditLogs`、`CiDiagnostics`、`ScanTaskDetail`、`IssueDecomposition` 已接入共享工具。`validate-frontend-ui.mjs` 锁住共享敏感 key、Authorization/Bearer、assignment、`sk-*`、JWT-like token、WeakSet/circular guard、`stringifyRedactedPayload`、`redactJsonOrText`、`redactAndTruncateText` 和各消费方 import/use。验证：`node scripts/validate-frontend-ui.mjs`、`npm --prefix web-console run build`、`CI=true npm --prefix web-console run smoke:agent-chat-closure-rail`、`CI=true npm --prefix web-console run smoke:report-evidence-drawer`、`CI=true npm --prefix web-console run smoke:issue-decomposition-detail-selection`、`CI=true npm --prefix web-console run smoke:artifacts-detail-selection`、`CI=true npm --prefix web-console run smoke:audit-logs-detail-selection`、`CI=true npm --prefix web-console run smoke:execution-tasks-detail-selection`、`CI=true npm --prefix web-console run smoke:patch-ready`、`CI=true npm --prefix web-console run smoke:ci-diagnostics-detail-selection`、`CI=true npm --prefix web-console run smoke:report-evidence-qa-citation` 均 PASS。本轮不刷新 full authority，不改后端 DB、raw download、provider 原始输出、历史 payload、权限系统或 GitHub App。
- P9 IssueDecomposition Raw Result And Markdown Redaction Guard focused evidence：`IssueDecomposition` 原始结果 tab 默认展示 redacted `outputJson`，渲染区域为 `.sl-issue-source-preview.sl-issue-source-preview-redacted`，`aria-label="脱敏 Issue 拆解原始结果"`；复制 Markdown 和导出 `.md` 在写入 clipboard / Blob 前经过 `sanitizeIssueMarkdownExport`。`issue-decomposition-detail-selection-smoke` 在 `outputJson` 与 Markdown export fixture 注入 raw secret sentinel、Bearer、OpenAI-style key 和 JWT-like token，断言 preview、body、copy、download 和 marker 不出现原文、出现 `[REDACTED]`，并输出 `ISSUE_DECOMPOSITION_DETAIL_SELECTION_SMOKE_OK.rawResultSafety.scope=ISSUE_DECOMPOSITION_OUTPUT_JSON_DISPLAY_REDACTION_ONLY` 与 `markdownExportSafety.scope=ISSUE_DECOMPOSITION_MARKDOWN_COPY_EXPORT_DISPLAY_REDACTION_ONLY`。`validate-frontend-ui.mjs` 已禁止回归到旧 raw source preview，并锁住 copy/export sanitize。本轮不刷新 full authority，不改后端 `outputJson` 存储、`exportMarkdown` 服务端返回、DB、LLM/provider 原始输出或真实 provider。
- P9 ScanTaskDetail Report Evidence code_chunks Preview Redaction Guard focused evidence：`ScanTaskDetail` 报告证据抽屉的 `code_chunks 命中摘要` 默认展示 `redactCodeChunkPreview(...)` 后的脱敏预览，渲染区域为 `.sl-report-evidence-chunk-preview-redacted`，`aria-label="脱敏 code chunk 预览"`；脱敏覆盖 Authorization/Bearer、token、apiKey/apikey/api_key、secret/password/private/access/refresh、`sk-*` 和 JWT-like token。`report-evidence-drawer-smoke` 在 code chunk fixture 注入 raw secret sentinel、Bearer、OpenAI-style key 和 JWT-like token，断言抽屉 region 与页面 body 不出现原文、出现 `[REDACTED]`，并输出 `REPORT_EVIDENCE_DRAWER_SMOKE_OK.codeChunkPreviewRedaction.scope=REPORT_EVIDENCE_CODE_CHUNK_PREVIEW_DISPLAY_REDACTION_ONLY`。`validate-frontend-ui.mjs` 已禁止回归到 raw `item.contentPreview || item.content` 直出。本轮不刷新 full authority，不改后端 code_chunks 存储、RAG payload、artifact/raw download、AuditLogs raw JSON 或真实 provider。
- P9 DiffViewer Patch Diff Redaction Guard focused evidence：`DiffViewer` 默认渲染 `.sl-diff-viewer.sl-diff-viewer-redacted`，逐行显示 `redactDiffLine(line)`，保留 diff 行色、空态和滚动能力；脱敏覆盖 Authorization/Bearer、token、apiKey/apikey/api_key、secret/password/private/access/refresh、`sk-*` 和 JWT-like token。`patch-ready-smoke` 在 `diffContent` 注入 raw diff sentinel，断言 AutoRepair 详情 diff 区不出现原文且出现 `[REDACTED]`，并输出 `PATCH_READY_UI_SMOKE_OK.patchDiffSafety.scope=DIFF_VIEWER_DISPLAY_REDACTION_ONLY`。`validate-frontend-ui.mjs` 已禁止回归到 raw `{line}` 展示。本轮不刷新 full authority，不改后端 `diffContent`、patch artifact、download/raw 授权体系或 PR gate。
- P9 AgentToolCall Secret Redaction Guard focused evidence：`AgentToolCall` 展开详情已改为默认渲染 redacted args/result preview，JSON payload 递归按敏感 key 脱敏，plain text payload 覆盖 bearer/key-value 形态；折叠摘要同样脱敏，保留原有展开交互、ARIA、状态文案、focus ring 和结果摘要。`agent-chat-closure-rail-smoke` fixture 注入 raw secret sentinel，覆盖 JSON args、plain text args、JSON result 和 plain text result，并断言展开后的 AgentToolCall 与页面 body 不出现原文 sentinel、出现 `[REDACTED]`；marker 新增 `agentToolCallRedaction.scope=AGENT_TOOL_CALL_ARGS_RESULT_DISPLAY_REDACTION_ONLY`，证明 raw secrets hidden、body hidden、redaction visible 且 marker 自身不含 sentinel。`validate-frontend-ui.mjs` 已禁止回归到 `JSON.stringify(args)` 或 raw `resultPreview` pre。本轮不刷新 full authority，不改后端审计入库、AuditLogs raw drawer、release schema 或真实 provider。
- Public Repo Live Agent Review Evidence Contract focused evidence：Archimedes/Hubble `019f1e68-136f-78a3-afe2-3c7645e605b3` 只读复核指出 public repo live UI smoke 已证明 derived `AGENT_TASK/AGENT_REPORT` 类型存在，但缺少 AgentTask、Agent report、audit 和 execution 的当前 scan 绑定证据。当前增量已让 `ScanGovernanceSmokeSeedController` 在 dev/test seed 中创建 `AGENT_TASK` execution，步骤为 `generate_report` 且终态 `SUCCESS`；`PUBLIC_REPO_UI_SMOKE_OK.governanceTimeline.agentReview` 增加 AgentTask scan bound、AGENT_REPORT owner bound、AGENT_TASK audit bound、AGENT_TASK execution bound、foreign Agent evidence hidden 和 no raw prompt/answer；`verify-release-evidence.sh` 与 `security-regression-check.sh` 拒绝缺失或伪造该字段的 OK 包。验证：`mvn -q -f backend-spring/pom.xml -Dtest=ScanGovernanceSmokeSeedControllerTest,ScanTaskGovernanceTimelineServiceTest test`、`bash -n scripts/verify-release-evidence.sh && bash -n scripts/security-regression-check.sh && node scripts/validate-frontend-ui.mjs`、`npm --prefix web-console run build`、`./scripts/security-regression-check.sh` 均 PASS；本轮不刷新 full authority，不声明真实外部 LLM/Agent 分析质量。
- PATCH_READY PR Confirm Candidate Gate focused evidence：Curie/Ramanujan `019f1e59-8891-7e90-b2c6-9bc6ea91d70d` 只读复核指出 PATCH_READY 强门禁与 Popconfirm patch 证据已覆盖，但最终确认缺 Candidate Provenance Receipt 的 `repairEvidenceGate/repairEvidenceGateSource=SERVER_DERIVED`。当前增量已把 `candidateReceipt` 传入 `PatchReadyPrConfirmSummary`，在创建 PR 最终确认中展示 `候选凭证：PROJECT_QA_VERIFIED_CITATION / READY`、`候选门禁来源：SERVER_DERIVED` 和原因；`PATCH_READY_UI_SMOKE_OK.prConfirmCandidateGate` 与 release verifier/security regression 增加 `READY/SERVER_DERIVED/warningOnlyForPatchReady` 强校验。验证：`node scripts/validate-frontend-ui.mjs`、`npm --prefix web-console run build`、`CI=true make patch-ready-ui-smoke`、`./scripts/security-regression-check.sh` 均 PASS；本轮不刷新 full authority，不改变后端 submit-pr gate。
- Scan Governance Timeline candidate gate propagation focused evidence：Goodall/Darwin `019f1e47-1324-7411-93ab-ea765139ec71` 只读复核指出 AutoRepair receipt 源头已有 `SERVER_DERIVED` gate，但治理时间线旧合同只证明 candidate receipt 可见、深链和异 scan 隔离，未把 gate 作为一等证据。当前增量已把 `repairEvidenceGate/repairEvidenceGateReason/repairEvidenceGateSource` 加入 `ScanGovernanceTimelineResponse.GovernanceEvent`，后端从 `AUTO_REPAIR_CANDIDATE_CREATED` sanitized provenance 结构化传出，前端 ScanTaskDetail 治理事件卡片展示门禁 tag、来源和原因，`SCAN_GOVERNANCE_TIMELINE_SMOKE_OK.candidateReceipt` 与 release verifier/security regression 增加 `READY/SERVER_DERIVED/serverDerivedGateVisible` 强校验。验证：`node scripts/validate-frontend-ui.mjs`、`npm --prefix web-console run build`、`mvn -q -f backend-spring/pom.xml -Dtest=ScanTaskGovernanceTimelineServiceTest,AutoRepairServiceTest test`、`CI=true make scan-governance-timeline-ui-smoke`、`./scripts/security-regression-check.sh` 均 PASS；本轮不刷新 full authority。
- Project QA / AutoRepair repair evidence gate focused evidence：本轮在 `sourceEvidenceRef` provenance attribution 之后补齐 `READY / REVIEW / BLOCKED` 修复证据门禁，避免把 verified citation 误解为 PATCH_READY。Project QA answer UI 根据 `groundingStatus`、`citationEnforcementStatus`、`citationCoverage.repairCandidateCount`、`sourceEvidenceRef`、`sourceEvidenceMatched` 和 `sourceEvidenceMatchType` 展示 `修复证据门禁`；后端 `AUTO_REPAIR_CANDIDATE_CREATED` receipt 服务端派生并写入 `repairEvidenceGate/repairEvidenceGateReason/repairEvidenceGateSource=SERVER_DERIVED`；AutoRepair Candidate Provenance Receipt 优先展示服务端 `候选证据门禁`，旧 receipt 缺字段时本地派生兼容。验证：`node scripts/validate-frontend-ui.mjs`、`npm --prefix web-console run build`、`make project-qa-autorepair-candidate-ui-smoke`、`make report-evidence-qa-citation-ui-smoke`、`mvn -q -f backend-spring/pom.xml -Dtest=CodeQaControllerTest,AutoRepairServiceTest test` 均 PASS；`PROJECT_QA_AUTOREPAIR_CANDIDATE_SMOKE_OK.candidateReceipt.repairEvidenceGateSource=SERVER_DERIVED`。该增量不刷新 full authority，不证明 patch/PR/GitHub App E2E。
- P12-pre current full authority after Report Evidence QA unverified citation schema：当前权威完整 `release` profile 证据包已刷新为 `release-evidence/release-post-unverified-qa-citation-authority-20260701-135235`，并通过 `./scripts/verify-release-evidence.sh release-evidence/release-post-unverified-qa-citation-authority-20260701-135235` 与 `./scripts/security-regression-check.sh`。该包 `required_failures=0`、`optional_warnings=0`、`skipped=3`，同一包内 `backup-restore-drill-evidence=OK`、`rollback-plan=OK`、`public-repo-smoke=OK`，并且 `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK` 证明 `qaRequestCount=4`、verified path `VERIFIED / DIRECT_VERIFIED`、unverified path `PARTIAL / RETRY_FAILED`、`uncitedCandidateCount=2` 和 `evidenceRefRequestBound=true`。Goodall-agent/Halley final review 判定技术发布证据 `PASS`，文档治理更新前 `BLOCKED`；补档后允许继续主线。GitHub App drill、GitHub webhook drill、真实 LLM provider run 仍为后续高级集成 SKIP。
- Historical P12-pre full authority with backup/rollback + public repo clone stability：`release-evidence/release-p12pre-full-authority-20260701-024042` 曾作为当前权威完整 `release` profile 证据包，并通过当时 `./scripts/verify-release-evidence.sh` 与 `./scripts/security-regression-check.sh`；该包 `backup-restore-drill-evidence=OK`、`rollback-plan=OK`、`public-repo-smoke=OK`。当前已被 `release-evidence/release-post-unverified-qa-citation-authority-20260701-135235` supersede，原因是旧 QA marker 仍为 `qaRequestCount=2`，缺少 `qaFromEvidence.unverifiedCitation`，在当前 verifier 下只保留为 historical-only。
- Report Evidence QA Citation UI focused evidence：`report-evidence-drawer-smoke` 已扩展为从扫描报告证据抽屉点击“基于此证据追问”进入 Project QA，mock `POST /api/projects/{projectId}/qa` 并验证 `evidenceRef` 请求绑定、`answerCitations`、`groundingStatus`、`citationEnforcementStatus` 和回答引用 UI。当前 marker 合同已升级：`REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK` 必须证明 `mockedApiOnly=true`、`unhandledApiRequests=0`、viewports `1440x900/320x740`、`qaRequestCount=4`、verified path `groundingStatuses=["VERIFIED"]` / `citationEnforcementStatuses=["DIRECT_VERIFIED"]`，以及 `qaFromEvidence.unverifiedCitation` 的 `groundingStatuses=["PARTIAL"]`、`citationEnforcementStatuses=["RETRY_FAILED"]`、`uncitedCandidateCount>0` 和 `evidenceRefRequestBound=true`。该 focused 证据已被当前 full authority 吸收。
- AgentChat Closure Rail focused UI evidence：`AgentChat` 右侧 ContextRail 已新增 `Agent 闭环下一步`，可从当前会话直达工具审计、Agent 任务和绑定扫描报告；`AgentTasks` 支持 `?projectId=...&taskId=...` 自动选中详情，列表未命中时用 detail API 兜底。验证：`node scripts/validate-frontend-ui.mjs`、`npm --prefix web-console run build`、`CI=true make agent-chat-closure-rail-ui-smoke`、`CI=true make agent-chat-audit-ui-smoke`、`CI=true make agent-tasks-detail-selection-ui-smoke` PASS；`AGENT_CHAT_CLOSURE_RAIL_SMOKE_OK` 证明 `mockedApiOnly=true`、`unhandledApiRequests=0`、viewports `1440x900/320x740`、审计 conversation filter、AgentTasks taskId auto-select、ScanTask deep link、未绑定会话 fallback、runtime issues 0 和 no horizontal overflow。本轮不刷新 full release authority。
- AutoRepair Source Scan Bridge focused UI evidence：`AutoRepairs` 详情已从来源扫描 Alert 升级为 `Scan Source Bridge / 来源扫描闭环`，展示 `Scan #id`、repair 状态、目标文件和下一步，并提供报告、QA 复核、Agent 复核和扫描审计深链；人工候选显示“未绑定扫描来源”，不把缺失 `scanTaskId` 作为 PATCH_READY PR hard gate。验证：`node scripts/validate-frontend-ui.mjs`、`npm --prefix web-console run build`、`CI=true make patch-ready-ui-smoke` PASS；`PATCH_READY_UI_SMOKE_OK.scanSourceBridge` 证明 `visible=true`、`scanTaskId=501`、`qaDeepLinkBound=true`、`agentTaskDraftBound=true`、`auditDeepLinkBound=true`、`targetFileExplained=true`、`missingScanFallbackVisible=true`，viewports 为 `1440x900` 和 `320x740`。本轮不刷新 full release authority。
- Historical full release evidence after PATCH_READY schema：`release-evidence/release-post-patch-ready-schema-20260701-053701` 曾作为 PATCH_READY schema 当前 full authority，通过 `PATCH_READY_UI_SMOKE_OK.keyboardOpen.enter/space`、`sharedSelectableRow`、`reviewGate` 与 `attemptSplit` 强校验。当前已被 `release-evidence/release-post-qa-citation-verifier-20260701-073909` supersede；因缺少 `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK`，不能继续作为当前 full authority。
- Public repo raw scan contract gate：`scripts/public-repo-analysis-smoke.sh` 已强制下载并校验 `RAW_SCAN_RESULT`，要求 `scan_result_schema_version=2`、`language` 非空、`symbols` / `graph.nodes` / `file_tree.total_files` 为正，并把摘要写入 `PUBLIC_REPO_SMOKE_OK.rawScanContract`；`verify-release-evidence.sh` 与 `security-regression-check.sh` 已锁住该字段，缺失 `rawScanContract` 的伪造 OK marker 会失败。Live Pawnshop smoke 已通过，样本 `scanTaskId=134`，`rawScanContract={schemaVersion:2, language:TypeScript, symbols:11919, graphNodes:11919, totalFiles:3255, apiRoutes:407, entities:62}`，17,001 code_chunks，artifact quality OK。边界：旧完整 `release` profile 包 `release-evidence/release-post-maven-compiler-hardening-20260630-141727` 在新增 verifier 下会因缺少 `PUBLIC_REPO_SMOKE_OK.rawScanContract` 被拒绝，这是预期的防回退行为；下一步必须专门刷新 full release evidence。
- Release evidence observability：full release evidence 刷新卡顿已定位为 `make verify` 后 `prod-preflight` 重复嵌套静态门禁且缺少外层进度；`production-preflight.sh` 新增 `SOURCELENS_PREFLIGHT_INCLUDE_STATIC_GATES`，默认仍为 `true`，release evidence 在已运行 `make verify` 时设为 `false`，并由 `security-regression-check.sh` 锁住；`release-evidence.sh run_step()` 现在打印步骤开始/结束。4 个半成品 raw scan contract evidence 目录已写 `INVALID_RELEASE_EVIDENCE.txt`。后续已用 `release-evidence/release-post-qa-citation-verifier-20260701-073909` 刷新当前 full authority。
- Historical full release evidence after raw scan contract：历史完整 `release` profile 证据包 `release-evidence/release-post-raw-scan-contract-runtimejar-20260630-163522` 曾通过 `./scripts/verify-release-evidence.sh release-evidence/release-post-raw-scan-contract-runtimejar-20260630-163522`。该包保留为 raw scan contract 与稳定 runtime jar 历史证据；当前已被 `release-evidence/release-post-qa-citation-verifier-20260701-073909` supersede，不能继续作为当前 full authority。
- Current schema full release backup/rollback closure：历史完整 `release` profile 证据包 `release-evidence/release-post-maven-compiler-hardening-20260630-141727` 曾在当时 verifier 下通过，`required_failures=0`、`optional_warnings=0`、`skipped=3`；`make-verify`、production/backup/rollback preflight、backup restore drill evidence、rollback plan、基础 smoke、public repo smoke、AutoRepair、PATCH_READY UI、Dashboard next action、report evidence drawer、scan governance timeline、AgentChat audit、audit workbench、phase12 baseline 和 Docker sandbox drill 均 OK。Backup id 为 `bkp-cs-260630-131346`；restore drill 证明 DB scratch restore 30 tables、workspace 187267 paths、artifacts 501 paths 和 checksum verification 全部 pass；rollback plan 绑定 immutable target ref `09cf8dd6a1bcee138b949d117804d652000eb7cc`。Goodall-agent `Rawls / 019f171e-943b-7ee0-a151-5dd88b23d913` 诊断并推动关闭 Maven compiler 增量编译后，该历史包曾作为 full evidence。当前边界：新增 raw scan contract verifier 后，该包不再是当前权威通过证据；`github-app-drill`、`github-webhook-drill`、`llm-provider-run` 仍为 SKIP，不能声明 GitHub App/Webhook/真实 LLM provider E2E 已完成。后续发现的长 backup id scratch DB 命名缺陷已改为 hash 派生并由 `security-regression-check.sh` 长 id fake-docker 探针锁住。
- Nightly backup restore + rollback evidence closure：历史本地 full `nightly` profile 证据包 `release-evidence/nightly-20260630-002144` 曾在当时 schema 下通过 verifier，真实备份 `backup-20260630-001220` 已完成 restore drill，证据包含 DB scratch restore、workspace restore、artifact restore 和 checksum verification 全部 pass；rollback plan 引用同一 backup id 和 immutable target ref `09cf8dd6a1bcee138b949d117804d652000eb7cc`，`rollback-preflight` strict 0 failure / 0 warning。当前 verifier/schema 已新增后续 release evidence 字段和 UI governance 断言，该历史包不能继续作为当前 full nightly 通过证据；下一次发布候选必须重新生成 full `nightly` 包。
- Release profile mutating target safety gate：`release` / `nightly` profile 已增加写入型 smoke 目标环境边界，非本地 `SOURCELENS_BASE_URL` 必须显式 `SOURCELENS_RELEASE_EVIDENCE_TARGET_ENV=staging|prod`，生产目标必须额外 `SOURCELENS_RELEASE_EVIDENCE_ALLOW_MUTATING_PROD=true`；public repo smoke cleanup 在 release/nightly 下强制 true；GitHub App/webhook drill 在非 local profile 中必须显式 `SOURCELENS_RELEASE_EVIDENCE_ALLOW_EXTERNAL_DRILLS=true`；`verify-release-evidence.sh` 对 release/nightly 强制 `public_repo_smoke_ui` 字段存在且为 true。历史 full release package `release-evidence/release-20260629-235813` 曾在当时 schema 下通过 verifier；当前 schema 下最新 full release package 已刷新为 `release-evidence/release-current-schema-20260630-124829`。
- `make verify` 通过。
- 公开仓库主链路 smoke 通过：`LJunP/Pawnshop-Management-System.git`，保留验收样本 `projectId=90` / `repositoryId=55` / `scanTaskId=78`，7 artifacts、17,001 code_chunks、3,697 graph nodes、7,612 symbols、Code QA 8 条证据、artifact quality 7/7 通过。
- 后端完整测试：`mvn clean test`，396 tests, 0 failures, 0 errors。
- 前端构建：`npm run build` 通过。
- Rust analyzer：`cargo check --locked` 与 `cargo test --locked` 通过，4 个 Rust 测试通过。
- LLM safety、安全回归与依赖回归门禁均已接入 `make verify` 并通过。
- 生产启动红线定向测试：`mvn -Dtest=SecurityStartupValidatorTest test` 通过，12 tests, 0 failures, 0 errors。
- 可观测性补强：Actuator 暴露 `health/info/metrics`，业务指标覆盖 execution task/step、Agent tool call 和 sandbox command。
- 认证注册唯一键兜底：`UserService.register` 对用户名/邮箱做服务层 trim，并把数据库唯一键冲突统一转为 `CONFLICT` 业务错误，避免逻辑删除用户仍占用唯一键或并发注册时落到 500。`mvn -Dtest=AuthControllerTest test`、`mvn -DskipTests package`、`git diff --check` 通过；本地 8080 已重启，真实 MySQL/HTTP smoke 验证重复用户名、重复邮箱和软删除用户名占用均返回 409，临时数据已清理。
- 审计日志链路修复：`mvn -Dtest=GitHubWebhookDeliveryServiceTest,GitHubWebhookDeliveryControllerTest test` 通过，前端 `npm run build` 通过；本地 8080 API 验证 audit logs、Agent tool calls 和 GitHub webhook deliveries 均返回 `SUCCESS`。
- 审计日志页 500 回归验证：用户侧报错确认为 MySQL `delivery_id` collation 混用；当前 Docker MySQL schema 已到 `027`，两张 webhook delivery 表 `delivery_id` 均为 `utf8mb4_unicode_ci`。复核用户补充日志确认 `PID 95441` 属于旧进程，当前 8080 运行 `PID 37510` 且 Flyway 显示 schema up to date。本地 8080 对 audit logs、Agent tool calls、GitHub webhook deliveries 三个接口均返回 `SUCCESS`；浏览器审计页刷新后无 `Internal server error` toast。
- 顶部用户菜单可用性修复：`AppLayout` 的用户菜单改为 click 触发，并为用户按钮补充 `aria-haspopup` / 精确 `aria-label`；退出菜单图标设为装饰性，避免菜单项 accessible name 变成 `logout 退出登录`。`npm run build`、`git diff --check` 通过；浏览器 smoke 验证登录临时用户后点击右上角用户菜单能看到精确“退出登录”，点击后返回 `/login`，临时用户和审计数据已清理。
- 前端 UI 可读性防回归：新增 `scripts/validate-frontend-ui.mjs` 与 `make frontend-ui-check`，并接入 `make verify`；门禁锁住 Ant Design primary 按钮白字/图标继承、AntD v5 实际 `.ant-btn-color-primary.ant-btn-variant-solid` 类名、主色与 hover 色 WCAG 4.5 对比度、顶部栏 `line-height` 防裁切，以及仪表盘行动卡必须使用 `.sl-dashboard-command-label` / `.sl-dashboard-command-value` 专用 class，禁止再用宽泛 `span/strong` 选择器污染“打开报告”等按钮。最新补强：新增共享 `ActionButton` 原语，统一 Dashboard、Projects、ExecutionTasks、Artifacts 与 AuditLogs 顶层行动按钮的装饰性图标、稳定 label 容器和 aria-label 兜底；enabled primary 按钮在组件层为 root、label 和 icon 均写入白色 `color` / `-webkit-text-fill-color` 兜底，并让 icon 保持 `fill/stroke: currentColor`，避免局部卡片样式、HMR 缓存或浏览器 text-fill 继承把蓝底按钮压成灰字。AuditLogs 三组筛选查询/重置动作也已迁移，减少表单行动按钮漂移。新增 `IconActionButton` 原语，统一 icon-only 密集操作按钮的 tooltip、aria-label、装饰性图标和固定 28px 命中盒；Artifacts 表格行内详情、来源、预览、下载四个操作已迁移，焦点卡、Drawer 顶部动作、加载失败/预览失败重试和懒加载预览也已迁移到 `ActionButton`，并由门禁禁止该页重新引入裸 `Button`。ProjectDetail 顶部 cockpit、仓库接入、扫描任务、Analysis Readiness 与 QA 证据动作的关键按钮已迁移到 `ActionButton`/`IconActionButton`；AgentTasks 的 cockpit 创建、表格对话/启动/取消/详情和详情区操作，以及 AutoRepairs 的刷新/新建、详情关闭、取消、创建 PR、打开 PR 操作也已迁移；CiDiagnostics、PrReviews、IssueDecomposition 的刷新/新建、行内重新分析或复制导出、详情关闭与修复候选入口也已迁移，CiDiagnostics 工作流标题链接与 IssueDecomposition Issue 标题链接继续收口到 `ActionButton`，并由门禁禁止这两页重新引入裸 `Button`。本轮继续收口 Login/Register 提交、DependencyGraph 导出、AgentChat 新建/发送、ModelConfig 激活/添加配置、ScanTaskDetail 手动复制关闭等剩余主按钮，并将 ExecutionTasks 任务标题、表格来源/取消、详情关闭/来源/取消任务操作迁移到 `ActionButton`/`IconActionButton`；ScanTaskDetail 顶部 cockpit、证据 tab、风险修复候选、ArtifactFallback、Code Knowledge、Report Action Board、Evidence Profile 与 Trace Map 操作也已全部迁移到 `ActionButton`；AgentChat 会话头部停止/刷新迁移到 `ActionButton`，会话删除迁移到 `IconActionButton`，UI 门禁禁止该页重新引入裸 `Button`。`scripts/validate-frontend-ui.mjs` 已全局禁止 `web-console/src/pages` 和 `web-console/src/components` 使用裸 `Button type="primary"`，后续主按钮必须走 `ActionButton` 或 `IconActionButton`。`.sl-app-shell :where(.ant-btn-primary, .ant-btn-color-primary.ant-btn-variant-solid)` 全局强制 primary 按钮 `color` 与 `-webkit-text-fill-color` 为白色，内部 `span/svg/icon` 继承当前对比色；`.sl-dashboard-command-card` 本地也显式锁定 primary 按钮文字、内部 `span` 和图标继承白色，防止行动卡局部样式覆盖全局按钮规则。`ActionButton` 的组件级兜底已改为主按钮背景复用 `--sl-primary`，启用态文本/图标使用 literal `#ffffff`，disabled 态复用 `--sl-disabled-bg`、`--sl-border-strong` 和 `--sl-muted`，并由门禁检查 enabled、hover、disabled 三态均满足 4.5 对比度，避免浏览器/AntD 运行时样式把可读性修复压回低对比文本。验证：`node scripts/validate-frontend-ui.mjs`、`make frontend-ui-check`、`make script-check`、`npm run build` 和全量 `make verify` 通过；本轮浏览器 computed style 复核 primary 按钮背景为 `rgb(37,99,235)`，按钮、文字 span 和图标均为 `rgb(255,255,255)`，无水平溢出，临时 smoke 用户和污染审计日志已清理。
- 前端按钮原语全局收口：`ModelConfig` 的刷新/编辑/删除、`PrReviews` 的 PR 标题链接、`DependencyGraph` 的重置筛选、`ArtifactLinkButton` 共享产物入口以及 `AppLayout` 顶部导航/用户菜单按钮已迁移到 `ActionButton` 或 `IconActionButton`。`scripts/validate-frontend-ui.mjs` 现在全局禁止 `web-console/src/pages` 和 `web-console/src/components` 直接 import 或渲染裸 Ant Design `Button`，唯一允许持有 AntD `Button` 的位置是 `web-console/src/components/ui/ActionButton.tsx` 与 `web-console/src/components/ui/IconActionButton.tsx`。
- Projects 页面表格操作继续收口：项目名链接改用 `ActionButton`，查看工作台、编辑项目、删除项目改用 `IconActionButton`，并由 `scripts/validate-frontend-ui.mjs` 禁止该页重新引入裸 Ant Design `Button`。
- ProjectDetail 项目主工作台继续收口：扫描列表标题链接和 GitHub App installation 禁用动作改用 `ActionButton`，与 cockpit、仓库表、扫描表、Analysis Readiness 和 QA 证据动作保持同一操作原语，并由 `scripts/validate-frontend-ui.mjs` 禁止该页重新引入裸 Ant Design `Button`。
- AuditLogs 页面治理操作继续收口：三类表格标题链接改用 `ActionButton`，审计资源/工具对话/扫描报告行内跳转改用 `IconActionButton`，source health、inline error 和 Drawer 深链操作改用 `ActionButton`，并由 `scripts/validate-frontend-ui.mjs` 禁止该页重新引入裸 Ant Design `Button`。
- AgentTasks 页面任务操作继续收口：任务标题链接、扫描报告链接和详情扫描报告链接改用 `ActionButton type="link"`，与表格对话/启动/取消的 `IconActionButton`、详情动作 `ActionButton` 形成一致操作原语，并由 `scripts/validate-frontend-ui.mjs` 禁止该页重新引入裸 Ant Design `Button`。
- AutoRepairs 页面修复操作继续收口：修复表格文件路径链接改用 `ActionButton type="link"`，与刷新、新建、关闭、取消、创建 PR、打开 PR 等动作统一到 `ActionButton`，并由 `scripts/validate-frontend-ui.mjs` 禁止该页重新引入裸 Ant Design `Button`。报告来源修复候选会把 `scanTaskId` 写入隐藏表单字段并提交，任务列表新增“来源扫描”列，详情面板展示来源扫描报告并可回跳 `/scan-tasks/{scanTaskId}`。
- 前端状态展示原语收口：新增 `StateBlock` 统一空态、加载态、错误态和提示态，提供紧凑表格密度、无卡片布局、tone class、`role=status/alert` 与 `aria-live=polite`；Projects、ExecutionTasks、Artifacts、AgentTasks、AutoRepairs、CiDiagnostics、PrReviews、IssueDecomposition 的主表格空态已迁移，CI/PR/Issue/AutoRepair 详情中的简单等待、加载和空数据状态也已迁移。Dashboard、ProjectDetail、ScanTaskDetail、DependencyGraph、AgentChat 以及 TaskTimeline、DiffViewer、LogViewer、ProjectSelector、ProtectedRoute、ArtifactPreviewRenderer 等共享组件也已迁移。`scripts/validate-frontend-ui.mjs` 已校验 `StateBlock` 组件结构、CSS token、主表格空态使用，并全局禁止 `web-console/src/pages` 和 `web-console/src/components` 继续使用裸 `Empty` / `Spin`。验证：`make frontend-ui-check` 与 `npm run build` 通过。
- 仪表盘主链路行动面板：`Dashboard` 新增 Workflow Command，将仓库接入、报告复盘、代码问答、自动修复、审计治理五个下一步动作按当前数据状态前置；增加页面内加载错误态和手动刷新。`AuditLogsPage` 支持 `?projectId=` 参数续接。`npm run build`、目标文件 `git diff --check` 和浏览器桌面/`390px` 移动验证通过，5 张行动卡无横向溢出、无错误 toast、无新增控制台错误；临时 smoke 数据已清理。
- 仪表盘 code_chunks 就绪度收口：`/api/dashboard/stats` 新增 `latestCodeChunks` 与 `latestEmbeddedChunks`，Dashboard 主链路和“代码问答”行动卡改用真实切片数和向量覆盖率，不再用文件数判断 QA 可用性。`mvn -Dtest=DashboardControllerTest,ScanStatServiceTest test`、`mvn -DskipTests package`、`npm run build` 通过；运行时 API 验证 `latestCodeChunks=3/latestEmbeddedChunks=1`，浏览器桌面和 `390px` 移动验证显示 `3 chunks ready`、`代码问答 3 chunks`、`向量覆盖 33%`，无横向溢出和新增控制台错误；临时 smoke 数据已清理。
- 项目 QA Playbook 收口：Dashboard “代码问答”行动卡进入项目 QA 时会携带 `question` 参数；`ProjectDetail` QA tab 支持 URL 预填问题、自动证据检索，并按 `code_chunks`、embedding 覆盖率、检索模式和错误状态生成动态 starter。`npm run build` 通过；浏览器 smoke 用临时 projectId `46` / scanTaskId `46` / 3 条 code_chunks 验证预填问题、QA Playbook、starter 卡、证据检索结果均渲染，桌面和 `390px` 移动宽度无横向溢出、无 `Internal server error`；临时用户、项目、仓库、扫描任务和 code_chunks 已清理。
- code_chunks 复合标识符检索增强：`CodeChunkRanker.tokenize` 保留原始紧凑词，同时拆出 camelCase/PascalCase/数字边界子词，使 `controllerServiceRepository`、`PawnTicketController` 这类真实提问能命中 Controller/Service/Repository 等角色词。`mvn -Dtest=CodeChunkServiceTest,CodeQaRetrievalServiceTest,CodeChunkControllerTest,CodeQaControllerTest test`、`mvn -DskipTests package`、`npm run build` 和 `git diff --check` 通过；本地 8080 已重启，API smoke 用临时 project/scan/code_chunks 验证 `controllerServiceRepository` 查询将 `PawnTicketController.java` 排在文档前，临时数据已清理。
- code_chunks 路径查询稳定性增强：`CodeChunkRanker.tokenize` 对包含 `/`、`\` 或 `.` 的路径类查询优先提取文件名/类名 token，再过滤 `src/main/java/com` 等低信号路径段，避免大仓库里泛路径词把候选池挤满，导致用户从报告复制完整文件路径后反而找不到目标 chunk。`CodeChunkServiceTest` 新增完整路径查询排序和 tokenizer 回归；验证：`mvn -Dtest=CodeChunkServiceTest,CodeQaRetrievalServiceTest,CodeChunkControllerTest,CodeQaControllerTest test`、`mvn -DskipTests package`、`npm run build` 和全量 `make verify` 通过。
- code_chunks 行号/列号定位增强：`CodeChunkRanker` 支持 `File.java:85`、`File.java:85:13`、`File.java:85:13-90:2`、`File.java#L85-L90`、`line 85` 和 `第85行` 这类行号提示，tokenizer 会剥离行号和列号噪声，搜索和 Code QA 会优先排序覆盖目标行的 chunk，避免 IDE/浏览器堆栈里的列号被误当成另一条行号；`CodeQaRetrievalService` 改用 query-aware score，避免报告复制文件路径加行号后定位漂移。验证：`mvn -Dtest=CodeChunkServiceTest,CodeQaRetrievalServiceTest,CodeChunkControllerTest,CodeQaControllerTest test`、`mvn -DskipTests package`、`npm run build`、`make frontend-ui-check`、`git diff --check` 和全量 `make verify` 通过；本轮新增 `CodeChunkServiceTest` 覆盖 line-column 与 line-column range 排序，以及 tokenizer 剥离 `85/13/90/2` 数字噪声，`scripts/security-regression-check.sh` 已锁住该回归。
- code_chunks 栈帧/方法锚点检索增强：`CodeChunkRanker` 识别 `Class#method`、`Class::method`、`Class.method(file.ts:85:13)`、`at fetchUser (.../auth-store.ts:85:13)` 和 `at com.foo.Class.method(Class.java:85)` 这类真实报错/报告引用，过滤 `at`、`github/blob/raw` 等低信号路径词，并对同文件内包含目标方法签名的 chunk 加权；`CodeChunkService` 会在普通关键词候选池之外额外召回同名类文件候选，且 `AuthStore` 这类前端类名会同时召回 `AuthStore.ts`、`auth-store.ts`、`auth_store.ts` 等文件名，无类名函数栈帧也会按 `auth-store.ts` 补召回，避免大仓库中 `config/page` 或前端 `fetchUser` 泛词先把候选池截断，导致方法定位漂移。验证：`mvn -Dtest=CodeChunkServiceTest,CodeQaRetrievalServiceTest,CodeChunkControllerTest,CodeQaControllerTest test` 通过；真实公开仓库 smoke 验证 `ConfigController#page` 与 `at com.sourcelens.smoke.ConfigController.page(ConfigController.java:37)` 均命中 Java Controller chunk。
- code_chunks 自然语言接口检索增强：`CodeChunkRanker.roleIntentTypes` 支持 `login endpoint`、`登录接口`、`订单路由` 这类用户自然问法触发后端 Controller/API handler 意图，并保留前端语境保护，避免 `React route Login page`、`前端登录路由 Login 组件` 被强推到 Controller；`score()` 允许 role intent / line / method / function file 结构分数在无直接关键词命中时生效，避免中文“接口/路由”召回到 Controller 后又被 `score <= 0` 过滤。`CodeChunkServiceTest` 和 `CodeQaRetrievalServiceTest` 已覆盖英文 endpoint、中文接口、中文路由和前端 route 负例；`scripts/security-regression-check.sh` 锁住关键词入口与测试名。验证：`mvn -q -Dtest=CodeChunkServiceTest,CodeQaRetrievalServiceTest,CodeChunkControllerTest,CodeQaControllerTest test` 通过。
- Natural endpoint public smoke probe：`scripts/public-repo-analysis-smoke.sh` 的 `chunkSearch.roleProbes` 新增 `naturalEndpointCn` / `naturalEndpointEn`，分别用 `业务接口` 与 `business endpoint` 验证自然语言接口查询能命中 Controller 强证据或 `controller_fallback_reason`；`scripts/security-regression-check.sh` 锁住 probe 名称、query、Controller 期望和 fallback 边界。Standalone live smoke 已通过：`scanTaskId=95` 的 `PUBLIC_REPO_SMOKE_OK` 中两条 probe 均命中 `ChatController.java`，`matchedEvidenceType=CONTROLLER`，`matchedReason=evidenceType:CONTROLLER`；本轮未生成新的 release evidence package，正式发布前仍需归档包验证。
- Public repo smoke payload verifier：`verify-release-evidence.sh` 不再只检查 `PUBLIC_REPO_SMOKE_OK` marker 存在，而是要求唯一 marker、合法 JSON object、`chunkSearch.roleProbes`、`naturalEndpointCn` / `业务接口`、`naturalEndpointEn` / `business endpoint`、`matched=true`、`status=OK`、`resultCount>0`、非空 `matchedFile`，并只接受 `evidenceType:CONTROLLER` 或 Controller fallback；显式拒绝 FRONTEND 冒充、Service/DataAccess fallback、重复 role、多 marker 和 Controller reason / evidenceType 不一致。`security-regression-check.sh` 新增动态 tamper probe，先验证好 payload 可通过，再逐项篡改 payload 并重写 checksum，确保是 verifier 语义门禁而不是 checksum 误伤。
- Public repo natural endpoint focused release evidence：已生成 `release-evidence/public-repo-natural-payload-20260629-221016`，`manifest.include_public_repo_smoke=true`，`status.public-repo-smoke=OK`，`required_failures=0`，`optional_warnings=0`，`skipped=16`；`verify-release-evidence.sh` 校验通过。包内 `PUBLIC_REPO_SMOKE_OK` 为 `projectId=120`、`repositoryId=81`、`scanTaskId=96`，`naturalEndpointCn` / `业务接口` 与 `naturalEndpointEn` / `business endpoint` 均命中 `ChatController.java`，`matchedEvidenceType=CONTROLLER`，`matchedReason=evidenceType:CONTROLLER`。该包是 focused 证据，不是 full release/nightly。
- Public repo UI release evidence subgate：`SOURCELENS_RELEASE_EVIDENCE_PUBLIC_REPO_SMOKE_UI=true` 已作为 `public-repo-smoke` 子门禁接入 release evidence，不新增标准 step；manifest 字段为 `public_repo_smoke_ui`，`release` / `nightly` profile 固定启用，`ci` 固定关闭。`verify-release-evidence.sh` 会在该字段为 true 时要求同一 `public-repo-smoke.log` 同时包含唯一 `PUBLIC_REPO_SMOKE_OK` 和 `PUBLIC_REPO_UI_SMOKE_OK`，并校验 ID 绑定、真实后端、非 mock API、required pages/viewports、`expectedEvidenceFile`、`evidenceDrawer`、`qaFromEvidence`、`governanceTimeline` 和敏感字段边界；当前 schema 还要求 `derivedAuditResourceTypes` 证明 `AUTO_REPAIR` / `AGENT_TASK` 审计可见、`derivedArtifactOwnerTypes` 和 `derivedArtifactTypes` 证明 `CHANGE_PATCH` / `AGENT_REPORT` 派生产物可见、`derivedGovernanceVisible=true`。当前 focused 包 `release-evidence/public-repo-derived-gov-20260630-122358` 已通过 verifier，`projectId=153`、`repositoryId=114`、`scanTaskId=123`，`governanceTimeline.derivedGovernanceVisible=true`；该包不是 full release/nightly。
- AgentChat tool audit release evidence step：`agent-chat-tool-audit-smoke` 已从 focused local backend smoke 升级为 release evidence 标准 step，manifest 字段为 `include_agent_chat_tool_audit_smoke`，local 默认 `false`、ci 固定 `false`、release/nightly 为 `auto`。`verify-release-evidence.sh` 会解析唯一 `AGENT_CHAT_TOOL_AUDIT_SMOKE_OK` marker，证明 loopback host、真实 AgentChat SSE、`read_file` / `READ_ONLY` 工具调用、conversationId 查询、assistant/TOOL JSON 持久化、错误 conversation 0、`mismatchCount=0`、`externalLlm=false` 和 `externalNetwork=false`。最新 focused 包 `release-evidence/agent-chat-tool-audit-gate-20260630-103354` 已通过 verifier；该包不是 full release/nightly，且不替代 `agent-chat-audit-ui-smoke` 的前端深链证据。
- Public repo live UI smoke：新增 `make public-repo-ui-smoke` / `npm run smoke:public-repo-ui`，由 `SOURCELENS_PUBLIC_REPO_SMOKE_UI=true make public-repo-smoke` 在同一轮真实公开仓库扫描后短期传入 JWT、projectId、repositoryId 和 scanTaskId，验证 ProjectDetail、ScanTaskDetail、ProjectDetail QA、ProjectDetail Graph、Artifacts、AuditLogs 和 AutoRepair candidate 在 `1440x900`、`390x844` 与 `320x740` 下无错误 toast、无横向溢出且 `scanTaskId` 不漂移；该 Playwright smoke 禁止 API mock，成功 marker 为 `PUBLIC_REPO_UI_SMOKE_OK`。Standalone live evidence：`projectId=123`、`repositoryId=84`、`scanTaskId=99`；最新 release evidence 320px 包为 `projectId=125`、`repositoryId=86`、`scanTaskId=101`，`expectedEvidenceFile=ChatController.java`，同轮 `PUBLIC_REPO_SMOKE_OK` 仍验证 7 artifacts、17,001 chunks、natural endpoint Controller probes 和 artifact quality。
- 项目 QA 证据动作闭环：`ProjectDetail` 的 QA 引用依据和 code_chunks 检索结果支持 `定位/定位检索` 与 `追问/追问此处`，会自动携带 `filePath:start-end` 作为检索或追问上下文，接通 line-aware code_chunks ranker，减少从报告证据跳回问答时的手动复制成本。验证：临时 18080 后端和 5174 前端 smoke 证明 `PawnTicketController.java:85` 首位命中 `81-130` chunk，点击“追问此处”会发送带 `filePath:81-130` 的问题；`npm run build`、`make frontend-ui-check`、`git diff --check` 通过，临时 smoke 数据已清理。
- 项目 QA 栈帧入口收口：`ProjectDetail` 的 QA Playbook、RAG 对话输入框和证据检索框都明确提示可粘贴 `file:line`、`Class#method` 或浏览器 `stack trace`，把后端 `CodeChunkRanker` 的路径/行号/方法锚点能力暴露为用户可发现的产品入口；`scripts/validate-frontend-ui.mjs` 已锁住这些提示，避免后续 UI 重构退回只能搜“类名/关键词”的弱入口。
- 项目 QA 证据深链闭环：`ProjectDetail` 的证据定位和追问动作会同步浏览器 URL 中的 `tab=qa`、`scanTaskId` 与 `question`，检索结果卡和 QA 引用 chip 均新增证据深链复制入口；复制被浏览器权限阻止时会弹出手动复制 Modal，避免用户卡在“复制失败”。`scripts/validate-frontend-ui.mjs` 已锁住深链生成、URL 状态同步、复制 fallback 和可见入口。验证：浏览器 smoke 用临时 projectId `80` / scanTaskId `68` 确认 `定位检索` 将 URL 同步到 `PawnTicketController.java:81-130`，`追问此处` 将 URL 同步为带 `filePath:81-130` 的问题，引用 chip 出现 `定位/追问/链接`，复制受限时 Modal 含完整深链，页面无横向溢出；临时用户、项目、扫描、code_chunks 和审计数据已清理。
- 扫描报告 QA 深链闭环：`ScanTaskDetail` 报告行动板的“代码问答”卡新增复制 QA 深链，Trace Map 每个证据面新增“复制问答链接”，所有链接均绑定当前 `scanTaskId`，避免分享或稍后复盘时漂移到项目最新扫描；复制被浏览器权限阻止时同样弹出手动复制 Modal。`scripts/validate-frontend-ui.mjs` 已锁住扫描报告 QA 深链生成、复制入口、手动复制兜底和行动卡双按钮布局。验证：浏览器 smoke 用临时 projectId `81` / scanTaskId `69` / ARCHITECTURE_REPORT artifact 确认 Report Action Board 和 Trace Map 渲染，出现 1 个 `复制链接` 与 5 个 `复制问答链接`，行动板复制 Modal 为 `/projects/81?tab=qa&scanTaskId=69`，Trace Map 复制 Modal 同时包含 `question` 与 `scanTaskId=69`，页面无横向溢出；临时用户、项目、扫描、artifact、code_chunks 和审计数据已清理。
- 扫描报告到自动修复候选深链闭环：`ScanTaskDetail` 的“修复候选”行动卡和风险列表可复制自动修复候选链接，链接携带 `projectId`、`repositoryId`、`scanTaskId`、`filePath`、`source` 与 `targetDesc`，并在剪贴板受限时提供手动复制 Modal；`AutoRepairsPage` 会保留 `scanTaskId` 并在创建弹窗提示候选来自哪次扫描报告，避免从报告分享修复入口时丢失扫描上下文。后端新增 `auto_repairs.scan_task_id`，创建任务时校验来源扫描必须属于同项目、同仓库且状态为 `SUCCESS`；`AutoRepairControllerTest` 锁住 JSON 请求绑定、响应返回和异步执行触发，避免 controller 层丢失 `scanTaskId`。前端创建表单提交隐藏 `scanTaskId`，列表和详情均可回跳扫描报告；`docs/API_DESIGN.md` 和 `docs/DATABASE_DESIGN.md` 已补齐自动修复接口和 V030 字段说明。`scripts/validate-frontend-ui.mjs` 已锁住修复深链、手动复制兜底、AutoRepairs 草稿上下文、API 类型、隐藏提交字段、列表来源扫描列和详情回跳；`scripts/security-regression-check.sh` 已锁住迁移、服务校验、拒绝未完成来源扫描和 controller 契约测试。最新补强：`ArchitectureRiskAnalyzer` 会把大文件风险标记为带 `filePath` 的 `MAINTAINABILITY` 风险；真实浏览器 E2E 已验证 `/scan-tasks/79` 可从 `LargeController.java` 风险进入 AutoRepair 候选弹窗；新增 `make file-bound-repair-smoke` 可重复验证临时 Git fixture 扫描、报告风险 `filePath`、code_chunks 命中和候选 URL 合同，并已作为 release evidence 标准 step `file-bound-repair-smoke` 支持发布前强制归档；新增 `make autorepair-patch-smoke` 用 dev/test `MOCK` LLM 覆盖候选创建后的真实 `PATCH_READY`、`CHANGE_PATCH` artifact、`execution_tasks/source/AUTO_REPAIR` 和 `AUTO_REPAIR_PATCH_READY` 审计闭环，并已作为 release evidence 标准 step `autorepair-patch-smoke` 支持发布前强制归档；新增 `patch-ready-ui-smoke` 标准 step 记录 mock-driven PATCH_READY browser UI smoke，默认跳过、显式 opt-in，成功包必须含 `PATCH_READY_UI_SMOKE_OK` marker。
- 报告质量语义收口：`AnalysisArtifactBuilder.reportQuality.confidence` 改为表达报告证据可信度，风险数量只做有限惩罚；高风险仍通过 `readiness=RISK`、`highRiskCount`、`risk_signal` 和 `nextActions` 表达，但不再把证据充分的大仓库报告压成 `5%`。`gaps` 只记录证据缺口，不再把“存在高风险项”混入缺口。`scripts/public-repo-analysis-smoke.sh` 新增报告 confidence 下限，防止成功公开仓库扫描生成近似不可用的报告质量分；`scripts/validate-artifact-quality.mjs --self-test` 已接入 `make verify`，会拒绝低 confidence 架构报告和风险项混入 `reportQuality.gaps` 的语义回归。验证：真实公开仓库 smoke 中 `reportQuality` 从 `confidence=5/gaps=1` 提升为 `confidence=74/gaps=0/readiness=RISK`，风险态保留但报告证据可用。
- Code QA 相邻切片上下文扩展：`CodeQaController` 先选出最相关 chunk，再通过 `CodeChunkService.expandWithAdjacentChunks` 拉取同文件前后相邻切片补入 RAG 上下文，降低长方法、类成员和调用链被 50 行切片边界截断的概率；`CodeChunkSearchItem` 新增 `contextRole` / `contextDistance`，主命中标记为 `PRIMARY`，相邻补充标记为 `ADJACENT_CONTEXT`，`evidenceProfile` 只用主证据计算平均分和低可信度，同时在摘要中单独展示上下文数量。`mvn -Dtest=CodeChunkServiceTest,CodeQaControllerTest,CodeQaRetrievalServiceTest,CodeChunkControllerTest test`、`mvn clean -DskipTests package`、`npm run build`、`git diff --check` 通过；本地 8080 已重启，API smoke 和浏览器 QA 页验证 `validateJwtSignature` 问答返回 `PRIMARY, ADJACENT_CONTEXT, ADJACENT_CONTEXT`，前端引用依据与检索结果均展示“主证据/上下文”角色，临时数据已清理。
- 公开仓库主链路强化：`SOURCELENS_PUBLIC_REPO_SMOKE_ARTIFACT_QUALITY=true SOURCELENS_PUBLIC_REPO_SMOKE_DB_COUNTS=true make public-repo-smoke` 通过，真实扫描 `LJunP/Pawnshop-Management-System` 生成 7 个 artifact、17001 个 code_chunks，并通过 artifact JSON 质量门禁；code_chunks 检索和 Code QA 共用结构化 `evidenceProfile`，公开仓库 smoke 会验证检索与问答证据质量契约。最新补强：`scripts/public-repo-analysis-smoke.sh` 已拆分空查询切片可用性检查与 `controller service repository` 源码角色检索检查，后者要求首位为源码类证据；同时从 `code_symbols` 选取 Java 方法锚点，并验证 `Class#method`、堆栈帧和 Code QA 三条路径都能回到同一方法行，防止真实大仓库中方法定位被泛词候选池污染。本轮保留证据 smoke：`projectId=90`、`repositoryId=55`、`scanTaskId=78`，`chunkSearch.firstEvidenceType=CONTROLLER`、首位 `ConfigController.java`、`methodAnchorRetrieval.status=OK`、`Code QA resultCount=8`、`reportQuality.confidence=53/readiness=RISK`。
- 扫描落库性能治理：`code_symbols`、`code_relations` 和 `code_chunks` 均改为明确的多行批量 INSERT；`mvn -Dtest=CodeChunkServiceTest,CodeGraphPersistenceServiceTest,CodeChunkControllerTest,CodeQaControllerTest,AnalysisServiceTest test` 通过，真实公开仓库 smoke 再次通过，17001 个 code_chunks 保存阶段约 2.8 秒且不再出现 MyBatis-Plus 非事务 `saveBatch` 警告。
- code_chunks embedding 复用边界收口：新增 `code_chunks.embedding_model`，切片复用旧向量时必须同时匹配同仓库成功扫描、相同 `content_hash` 和相同 `provider:text-embedding-3-small` 模型键；全部切片成功复用时跳过异步 embedding，缺失或模型不一致时会重新计算。Code QA 的语义排序和 `hasEmbedding` 也只把当前激活 embedding model 的向量视为可用，避免切换 provider/model 后混用不同向量空间。`CodeChunkServiceTest`、`CodeQaRetrievalServiceTest`、`CodeQaControllerTest` 与 `scripts/security-regression-check.sh` 已锁住该边界。
- 扫描详情体验补强：`ScanTaskDetail` 新增 Code Knowledge readiness 面板，直接展示 code_chunks 总量、向量覆盖、检索模式、证据可信度和下一步动作；本地 8080 最新 jar 验证 `/api/projects/4/code-chunks/search?scanTaskId=24&limit=1` 返回 `retrievalMode=NO_CONTEXT`、`evidenceProfile.readiness=GAP`，浏览器 smoke 验证无全局错误 toast。
- 扫描报告行动闭环补强：`ScanTaskDetail` 报告总览新增 Report Action Board，将风险定位、代码问答、依赖复盘、修复候选四个后续动作前置到报告决策区；按钮按核心产物、依赖图谱、风险文件和仓库状态启停。`npm run build` 与目标文件 `git diff --check` 通过；浏览器验证桌面与 `390px` 移动宽度均渲染 4 张行动卡、无横向溢出、无错误 toast。
- 扫描报告 Trace Map 补强：`ScanTaskDetail` 报告总览新增“报告章节追踪”，把质量风险、API 表面、数据模型、依赖图谱和产物证据五个证据面直接连接到对应报告 tab、产物库和带问题参数的项目 QA。`npm run build`、目标文件 `git diff --check` 通过；浏览器 smoke 用临时 project/scan/artifacts/code_chunks 验证 5 个证据面渲染、风险按钮打开质量风险 tab、追问代码跳转 `/projects/{id}?tab=qa&question=...`，默认视口和 `390px` 移动视口均无横向溢出，临时数据已清理。
- 报告到 QA 证据源贯通：`CodeQaRequest` 支持 `scanTaskId`，后端会校验指定扫描属于当前项目，未指定时才回退最近成功扫描；`ScanTaskDetail` 所有 QA 入口都会携带当前报告 `scanTaskId`，`ProjectDetail` QA 的 code_chunks 搜索和问答请求使用同一证据源，避免从旧报告追问却误用最新扫描。验证：`mvn -q -Dtest=CodeQaControllerTest test`、`mvn -q -DskipTests package`、`npm run build`、`git diff --check` 通过；本地 8080 已重启，API smoke 验证审计页三源均 `200 SUCCESS`，指定旧 scanTaskId 返回 `RequestedScanAuthService`，不指定 scanTaskId 返回最新 `LatestScanAuthService`；临时数据已清理。
- code_chunks 搜索证据源边界收口：`CodeChunkController.search` 对显式 `scanTaskId` 保持项目归属校验，并新增扫描状态门禁；只有 `SUCCESS` 扫描会执行切片统计和检索，`RUNNING`/`PENDING`/`FAILED`/`CANCELLED` 统一返回结构化 `NO_SCAN` 空证据，避免 QA 预检或报告追问把未完成扫描的残留 chunk 当成可靠证据。验证：`mvn -q -Dtest=CodeChunkControllerTest,CodeQaControllerTest test`、`mvn -q -DskipTests package`、`git diff --check` 通过；本地 8080 已重启，API smoke 用临时 RUNNING scanTaskId `57` 且人为插入 chunk 验证返回 `NO_SCAN`、`resultCount=0`、`items=[]`、`evidenceProfile.readiness=IDLE`；临时数据已清理。
- 报告到 Agent 证据源贯通：`AgentTaskService.create` 对显式 `scanTaskId` 新增存在性、项目归属和 `SUCCESS` 状态校验；Agent 对话运行时会通过 `Conversation.agentTaskId` 反查任务绑定扫描，并把 `scanTaskId` 注入 `ToolContext` 与系统 prompt 项目上下文；`get_symbols` 优先使用上下文绑定扫描，避免从扫描报告创建的 Agent 任务漂移到项目最新扫描。`ScanTaskDetail` 报告行动区新增“Agent 审查”入口，跳转 `/agent-tasks?projectId=...&openCreate=1&scanTaskId=...` 并预填任务。验证：`mvn -q -Dtest=AgentTaskServiceTest,AgentSandboxToolTest test`、`mvn -q -DskipTests package`、`npm run build` 通过；本地 8080 已重启，API smoke 验证绑定成功扫描可创建 Agent 任务，`RUNNING` 扫描和跨项目扫描均返回 `BAD_REQUEST`；临时数据已清理。
- Agent 工具审计 scanTask 追踪：新增 `V028__add_agent_tool_call_scan_task_id.sql`，`agent_tool_calls` 写入可空 `scan_task_id` 并支持项目内按扫描过滤；`ToolExecutionService` 从 `ToolContext.scanTaskId` 写入审计记录，审计页 Agent 工具 tab 增加扫描任务筛选、列表列和详情字段，方便追溯工具结果来自哪一次扫描报告。验证：`mvn -q -Dtest=AgentToolCallControllerTest,ToolExecutionServiceTest,AgentTaskServiceTest,AgentSandboxToolTest test`、`mvn -q -DskipTests package`、`npm run build`、`git diff --check` 通过；本地 8080 已重启并应用 Flyway `028`，API smoke 验证 `scanTaskId=42` 过滤只返回对应工具调用；临时数据已清理。
- 扫描报告到审计追踪深链：`AuditLogsPage` 支持 `?projectId=&scanTaskId=`，进入后默认打开 Agent 工具调用 tab、预填 ScanTask ID 筛选，并在页头显示当前扫描上下文；Agent 工具审计列表和 drawer 支持回跳 `/scan-tasks/{scanTaskId}`。`ScanTaskDetail` 顶部操作区新增“审计追踪”，报告行动板也保留审计入口，确保无产物扫描也能进入治理链路。验证：`npm run build`、`git diff --check` 通过；浏览器 smoke 用临时 projectId `70` / scanTaskId `61` 验证审计深链只显示当前 scan 的 `codex_ui_audit_get_symbols`，不会显示其他 scan 记录，扫描详情顶部“审计追踪”点击后跳转到带 `projectId` 和 `scanTaskId` 的审计页；临时数据已清理。
- 项目页 code_chunks 闭环补强：`ProjectDetail` 会对最新成功扫描预加载一次 `code-chunks/search?limit=1`，顶部主链路、Analysis Readiness 和 QA 页健康卡片均使用真实 `totalChunks/embeddedChunks/retrievalMode/evidenceProfile`，不再用文件数冒充切片数；报告/Agent 阶段不再只凭扫描成功显示 Ready。
- 产物页错误体验补强：`Artifacts` 的列表加载失败和智能预览失败已改为页面内错误状态，Evidence Readiness 会把数据源不可用纳入危险态，并保留上次成功数据；浏览器 smoke 用临时 projectId `34` / 4 条核心 artifact 验证 readiness ready、无全局 toast，故意触发预览失败时错误留在 drawer 内。
- 备份/回滚 artifact 匹配收紧：`backup-preflight`、`rollback-preflight` 和 `release-evidence` 只接受以 `backup_id` 加 `-`、`_` 或 `.` 分隔符开头的备份 artifact 文件名，避免 `backup1` 误匹配 `backup10-*`；临时负向/正向演练已验证边界和 checksum 比对。`make backup-restore-drill` 已补齐可执行恢复演练入口，可恢复 SQL 到 Docker MySQL scratch database 并生成标准 evidence。
- 备份恢复演练长 `backup_id` 缺陷修复：`make backup-restore-drill` 保留 3-128 字符 `backup_id` artifact 合同，但 scratch database 名改为 `sourcelens_drill_<backup_id_sha256_16>_<timestamp>_<random>`，并显式校验不超过 MySQL 64 字符 identifier 上限。`scripts/security-regression-check.sh` 新增长 `backup_id` fake-docker 运行探针，证明 128 字符合法 backup id 可完成 drill、scratch DB 名有界、evidence 仍保留完整 backup id，防止运维演练被合法 backup id 阻断。
- P12-pre 本地恢复/回滚 focused 证据闭环：本轮生成 `backup_id=bkp-p12pre-20260701011350` 的私有备份四件套，真实 `make backup-restore-drill` 证明 Docker MySQL scratch restore、workspace restore、artifact restore 和 checksum verification，严格 `make rollback-preflight` 证明 rollback target、backup id、备份四件套和 rollback plan 可复核；focused package `release-evidence/p12-pre-backup-rollback-focused-20260701-012427` 通过 verifier。`verify-release-evidence` 同步加固为 `OK backup-restore-drill-evidence` / `OK rollback-plan` 只能引用 `.txt` 归档证据，非 OK 状态引用 `.log`，并由 `security-regression-check.sh` 的 checksum 重写动态探针阻断 OK 行指向 `.log` 的假阳性。该 focused 包后续已被当前 full release authority `release-evidence/release-post-unverified-qa-citation-authority-20260701-135235` 吸收。

当前优先级决策：

- GitHub App 是面向私有仓库、webhook 增量扫描、自动 PR 和企业级安装的高级集成层，不作为当前公开仓库逆向分析主线的阻塞项。
- 当前主线优先稳定：公开仓库报告/问答体验、前端产品级 UI、工作区分组审查和后续 staging/prod 级发布证据。
- GitHub App/webhook E2E 保留架构和本地回归，不删除、不弱化安全边界；等核心公开仓库链路稳定后再进入真实凭据和真实 GitHub 仓库端到端演练。

注意：

- `web-console/dist` 与 `web-console/tsconfig*.tsbuildinfo` 已通过仓库卫生清理移出 Git 跟踪，后续构建产物由 `.gitignore` 忽略。
- `make clean` 已覆盖前端 `dist`、`.vite`、`tsconfig*.tsbuildinfo`、Rust `analyzer-rust/target`、根 `bin/`、`.DS_Store` 和递归 `target 2` 误生成目录，避免本地构建产物在分组审查前长期残留。
- 历史误生成的 `target 2` 构建目录已用 `**/target 2/` 在 Git/Docker build context 中通用忽略，并由 `make clean` 递归清理；清理命令会跳过 `.git`、`web-console/node_modules`、常规 Maven/Rust target 这类大目录。
- 当前工作树仍包含大量阶段性重构文件未纳入版本库，正式提交前应按阶段拆分或至少按模块分组提交。

## 1. 重构原则

SourceLens 的核心风险来自“读取用户源码、保存访问凭据、调用大模型、执行构建测试、生成代码改动”这一整条链路。因此重构必须先安全、再可靠、再扩展。

本路线图遵循以下原则：

- 先止血，不急着堆新功能。
- 先明确边界，再扩大 Agent 自动化能力。
- 先让任务可追踪、可取消、可恢复，再做复杂编排。
- 先把 Spring Boot 单体内部边界做清楚，再考虑拆服务。
- 先把 Rust CLI 的输出稳定化，再考虑 gRPC/LSP 常驻化。
- 先用 MySQL 与文件 artifact 管好数据，再在确有瓶颈时引入 Neo4j、pgvector、Temporal。

## 2. 阶段 0：冻结范围与建立基线

状态：已完成。

目标：把当前原型状态固定下来，为后续重构建立稳定的工程基线。

任务：

- 建立本路线图文档。
- 建立安全边界文档。
- 补齐 `.gitignore`，防止构建产物继续进入版本库。
- 记录当前验证命令：后端 `mvn test`、前端 `npm run build`、Rust `cargo check`。
- 梳理并清理已被跟踪的构建产物。

验收标准：

- 基线文档存在。
- 构建产物忽略规则存在。
- 三项基础验证命令可运行。

## 3. 阶段 1：安全止血

状态：已完成。

目标：消灭当前最危险的上线风险。

任务：

- 生产环境禁止默认 `JWT_SECRET`、`ENCRYPT_PASSWORD`、`ENCRYPT_SALT`、数据库密码。
- 增加启动期安全配置校验，生产配置不合规时直接启动失败。
- `TokenEncryptor` 新写入密文使用版本化 AES-GCM（`SLENC2:` 前缀），错密码或密文篡改必须认证失败；旧 CBC/Base64 密文仅保留读取兼容。
- Swagger、OpenAPI、Mock LLM 只在显式 `dev`/`test` profile 开放，`staging`、`qa` 或无 active profile 不得因“非 prod”判断被自动放行。
- `logout` 接入 JWT blacklist，为 token 撤销机制打基础。
- 用户登录成功、登录失败和退出写入 `audit_logs`，登录失败不记录密码。
- 所有 API 响应禁止返回明文 token、API key、encrypted token 字段。
- LLM 配置列表返回 masked key，内部调用模型时才解密。
- LLM Base URL 在保存配置和发起请求前双重校验：非 Mock provider 必须使用 HTTPS，拒绝 localhost、内网 IP、链路本地地址、metadata host、user-info、query 和 fragment。
- `file://` 仓库默认禁用，dev 环境显式开启。
- 仓库 URL 和分支名在保存与 Git 操作前统一规范化校验：GitHub 只允许 HTTPS github.com 仓库 URL，拒绝认证信息、query、fragment、非 GitHub host 和非法分支名。
- 本地仓库扫描不直接使用原目录，统一复制到 workspace 隔离目录。

验收标准：

- 生产默认密钥启动失败。
- 前端与 API 看不到任何明文密钥。
- Swagger/mock 在生产不可访问。
- LLM 外部请求不会被配置为访问本机、内网或云 metadata 地址。
- Git clone/pull 不接受未规范化仓库 URL 或危险分支名。
- `file://` 默认不可用。

## 4. 阶段 2：Agent 工具边界重构

状态：已完成。

目标：让 Agent 工具调用从隐式能力变成显式授权能力。

任务：

- 定义工具权限等级：`READ_ONLY`、`WRITE_PATCH`、`EXEC_TEST`、`CREATE_PR`。
- 默认只开启只读工具。
- `write_file`、`shell_exec`、自动 PR 必须用户显式开启。
- 新增 `agent_tool_calls` 审计表。
- 所有工具调用统一经过 `ToolExecutionService`。
- 工具参数与结果做敏感信息脱敏和输出截断。
- 工具返回给 Agent/前端前也必须清洗，不只在 `agent_tool_calls` 审计入库前清洗；`ToolResult` 统一限制内容和错误长度，避免大块命令输出污染模型上下文。
- Agent 工具的 `offset`、`limit`、`max_results`、`timeout` 等边界参数统一做类型校验和上下限夹取，避免异常参数进入 SQL `LIMIT`、文件读取范围、结果集切片或沙箱执行超时。
- 沙箱执行器拒绝非正 timeout，工具层和执行层都有超时边界防线。
- `ShellExecTool` 默认关闭。
- 若保留 dev shell，禁止 `bash -c` 自由字符串，改为结构化命令和参数级白名单。
- 修复所有进程执行的超时和输出读取阻塞问题。

验收标准：

- 每次工具调用都有审计记录。
- Agent 默认不能写文件、不能执行 shell。
- shell 超时一定生效。
- 工具输出中的 token、API key、Bearer/Basic/Token 授权头、password、JWT/privateKey、URL userinfo 密码和私钥块在 Agent 可见结果与审计记录中都不可见。
- 前端可查看工具调用回放。

## 5. 阶段 3：自动修复降级为 Patch 工作流

状态：已完成，且阶段 11 已在显式开关下恢复受控 PR 能力。

目标：自动修复先生成可审查 patch，不直接修改原仓库或推送远端。

任务：

- 拆分 `AutoRepairService`：任务服务、workspace 服务、patch 生成服务、验证服务、PR 服务。
- LLM 输出统一转换为 patch artifact。
- 默认不覆盖本地原目录。
- 默认不 push 分支、不创建 PR。
- `repair.filePath` 做 normalize，禁止越界和敏感文件修改。
- 受控 PR 创建前对 patch diff 做二次校验：限制大小，只允许修改当前目标文件，拒绝多文件 diff、路径越界和敏感路径。
- 测试日志写 artifact 文件，DB 只存摘要和路径。
- GitHub token 不再拼进 remote URL。

验收标准：

- 自动修复输出 diff/patch。
- 受控 PR 不会提交超出 AutoRepair 目标文件范围的 patch。
- 人工确认前不会写远端。
- 本地目录不会被覆盖。

## 6. 阶段 4：任务系统状态机化

状态：已完成第一版。

目标：扫描、Agent、修复任务都可追踪、可取消、可恢复。

任务：

- 新增统一任务表 `execution_tasks`。
- 新增任务步骤表 `execution_steps`。
- 统一状态：`PENDING`、`QUEUED`、`RUNNING`、`WAITING_USER`、`SUCCESS`、`FAILED`、`CANCELLED`。
- `SUCCESS`、`FAILED`、`CANCELLED` 为不可逆终态，异步迟到的 step/task 更新不能覆盖用户取消或已完成结果。
- 统一任务取消时同步取消所有非终态步骤，已成功、失败或取消的步骤不被二次覆盖。
- Controller 只创建任务，不直接执行业务。
- 使用 DB 约束或 Redis lock 防止重复任务并发穿透。
- 支持取消任务。
- 任务列表按项目分页查询，避免长期运行后统一任务页和轮询接口全量拉取。
- 支持按 `sourceType/sourceId` 查询统一执行任务详情，业务页面无需扫描整张任务列表来关联来源任务。
- `execution_tasks` 针对项目分页和来源详情查询建立联合索引，避免任务量增长后列表排序和来源关联退化。
- `execution_tasks` 以 `sourceType/sourceId` 作为来源幂等键，服务层重复创建会返回既有任务，数据库层通过唯一约束防止并发穿透产生重复统一任务。
- `scan_tasks` 使用可空 `active_lock_key` 作为仓库级活跃锁，`PENDING/RUNNING` 扫描占用 `repo:{repositoryId}`，成功、失败或取消后释放锁。
- 扫描任务创建入口同时具备服务层预检查和数据库唯一键兜底，竞态冲突会返回明确业务错误，不会继续创建 execution task、写审计或触发异步扫描。
- `auto_repairs` 使用可空 `active_lock_key` 作为仓库文件级活跃锁，补丁生成和受控 PR 创建期间占锁，`PATCH_READY`、`PR_CREATED`、`FAILED`、`CANCELLED` 等阶段释放锁。
- AutoRepair 创建和 PR 排队入口同时具备服务层预检查和数据库唯一键兜底，竞态冲突会返回明确业务错误，避免同一文件并发生成补丁或并发创建远端 PR。
- Agent 任务启动使用 `id + PENDING` 条件更新，只有一个并发请求能把任务推进到 `RUNNING`，失败请求不会标记 execution task 或触发异步分析。
- CI 诊断、PR 审查和 Issue 拆解的异步入口使用 `id + PENDING` 条件更新抢占处理权，重复触发会跳过，避免重复写诊断结果、PR 评论或拆解子任务。
- CI 诊断和 PR 审查的重新分析入口由 service 统一重排队，进行中任务会拒绝重复 reanalyze，Controller 不再直接改写任务状态。
- CI 诊断首次创建时会同步创建 `execution_tasks`，首次分析会写入 `analyze_ci_failure` step，并在完成或失败时同步统一执行任务状态。
- PR 审查首次创建时会同步创建 `execution_tasks`，首次分析会写入 `analyze_pr_review` step，并在完成或失败时同步统一执行任务状态。
- PR 审查重新分析会先替换本次 review 的旧评论，再写入新评论，避免历史评论和新分析结果混杂；评论写入失败会把业务 review 和统一执行任务一并标记为失败。
- Issue 拆解首次创建时会同步创建 `execution_tasks`，处理时写入 `decompose_issue` step，并在子任务写入完成后才标记业务拆解和统一执行任务成功。
- Issue 拆解处理会替换旧子任务后写入本次子任务，子任务写入失败会把业务 decomposition 和统一执行任务一并标记为失败。
- CI 诊断日志、PR diff/评论、Issue 描述/拆解结果等 LLM 密集路径在入库和进入 prompt 前统一脱敏与截断，避免敏感片段通过分析结果、评论或子任务字段残留。
- 新增 `execution_attempts`，统一执行任务继续以 `sourceType/sourceId` 作为业务来源锚点，每次重新分析会创建新的 attempt，step 通过 `attempt_id` 归属到本次执行。
- CI 诊断、PR 审查和 Issue 拆解使用 attempt-scoped step/status API，同一业务来源多次重新分析可在时间线中保留多次执行记录，旧 attempt 的迟到完成事件不会覆盖当前 attempt 对应的父任务状态。
- AutoRepair 受控 PR 创建阶段已使用独立 `ExecutionAttempt`：patch generation 的成功证据保留为历史 `generate_patch SUCCESS` step，`submitPr` 排队后启动 PR attempt，async runtime preflight、clone/apply/push/create PR、success/fail/cancel 都写入当前 PR attempt；PR 失败后不会污染旧 patch evidence，用户可基于同一 `PATCH_READY` 补丁重新提交。
- 统一执行任务详情接口返回 `attempts + steps`，前端执行任务页展示每次 attempt 状态，并在步骤时间线中标注第几次执行。
- 新增 `execution_logs` append-only 日志表，任务生命周期事件以插入方式记录开始、完成、失败、取消和新 attempt 创建，不再依赖覆盖式 step 摘要作为唯一排障入口。
- 统一执行任务详情接口返回最近执行日志，前端执行任务页展示按时间排列的日志窗口，日志行包含时间、级别、attempt 和 step 信息。
- `execution_logs` 支持按保留期批量清理，默认关闭，可通过 `SOURCELENS_EXECUTION_LOG_CLEANUP_ENABLED`、`SOURCELENS_EXECUTION_LOG_RETENTION_DAYS`、`SOURCELENS_EXECUTION_LOG_CLEANUP_BATCH_SIZE` 和 `SOURCELENS_EXECUTION_LOG_CLEANUP_CRON` 单独配置。
- 执行任务 step summary、error message、append-only log message 统一脱敏和截断，避免构建日志或失败摘要中的 token/password/API key 进入任务时间线。
- Agent 任务输出、手动完成输出和步骤输出统一脱敏和截断，避免手动 API 或异步步骤绕过 Agent 工具输出边界。

验收标准：

- 刷新页面不丢任务进度。
- 失败能看到具体 step。
- 重复扫描不会并发执行。
- 任务可取消。
- 用户取消后的异步迟到事件不会把任务或步骤改回成功、失败或运行中。
- 任务取消后，时间线中仍未完成的步骤会统一显示为已取消。
- Agent 分析主流程具备检查点式取消，用户取消后不会被后台异步流程继续写回成功或失败。
- Agent 手动完成/取消入口同样遵守终态不可覆盖规则，不能把已取消、已失败或已完成任务改写成其他终态。
- AutoRepair 受控 PR 异步流程在提交前、进度回调和提交返回后检查取消状态，取消后不会把本地任务重新写成 `PR_CREATED` 或 `PATCH_READY`。

## 7. 阶段 5：扫描产物与数据清理

状态：已完成第一版 artifact store、artifact retention、audit retention、workspace sandbox 兜底清理和项目删除级联策略。

目标：避免 MySQL 无限膨胀，避免删除项目后留下孤儿数据。

任务：

- 大型 raw scan result、报告、日志写 artifact store。
- DB 只存 summary、hash、size、schema version、storage path。
- 新增 `ProjectDeletionService`。
- 删除项目时级联逻辑删除仓库、GitHub App installation、扫描任务、artifact、symbols、relations、chunks、execution tasks、execution attempts、execution steps、execution logs、conversations、Agent tasks、AutoRepair、CI diagnostics、PR reviews 和 issue decompositions。
- 新增通用 `audit_logs`，项目删除级联成功后写入审计记录。
- 新增项目级审计日志查询接口和前端审计日志页面，接口按项目所有权隔离，支持 resourceType、action、status 筛选。
- 新增项目级 Agent 工具调用查询接口，并在审计日志前端页面中提供 Agent 工具调用视图，接口按项目所有权隔离，支持 toolName 和 success 筛选。
- 新增 `github_webhook_delivery_projects` 映射表，支持一个 webhook delivery 关联多个 project/repository，并在审计日志前端页面中提供 GitHub Webhook 视图。
- 用户登录成功、登录失败和退出写入 `audit_logs`，认证审计不记录密码或 token 明文。
- 扫描任务创建、取消和失败写入 `audit_logs`，只记录仓库 id、分支、步骤和错误摘要。
- AutoRepair patch 生成、取消、失败、受控 PR 排队、PR 创建成功和 PR 创建失败写入 `audit_logs`，不记录 diff 正文、源码、prompt 或 token。
- 仓库新增、删除和 PAT 凭据更新写入 `audit_logs`，不记录 token 明文。
- GitHub App installation 绑定、禁用、webhook 同步写入 `audit_logs`，不记录 installation access token。
- `audit_logs` 与 `agent_tool_calls` 支持按保留期批量清理，默认关闭，可通过 `SOURCELENS_AUDIT_CLEANUP_ENABLED`、`SOURCELENS_AUDIT_RETENTION_DAYS`、`SOURCELENS_AUDIT_CLEANUP_BATCH_SIZE` 和 `SOURCELENS_AUDIT_CLEANUP_CRON` 配置。
- 后台异步物理清理 workspace 和 artifact 文件。
- workspace sandbox 过期清理默认关闭，开启后只清理 `repair-*` 与 `autorepair-pr-*` 直接子目录。
- `prod-preflight` 会检查 workspace sandbox、artifact、audit 和 execution log cleanup 策略：关闭时记录 warning，retention/batch 无效时失败，发布证据可直接暴露容量治理缺口。

验收标准：

- 删除项目后没有 orphan symbol/relation/chunk，也不会留下 execution attempt、execution step、execution log、conversation message、Agent step、PR review comment、issue task 等子表孤儿数据。
- 项目审计日志可以按项目分页查询，并且非项目拥有者无法读取。
- Agent 工具调用可以按项目分页查询，并且非项目拥有者无法读取。
- GitHub webhook delivery 可以按项目分页查询，并且非项目拥有者无法读取。
- GitHub webhook delivery 主表与项目映射表的 `delivery_id` 排序规则由 V027 统一为 `utf8mb4_unicode_ci`，避免 MySQL 8 默认 collation 与历史迁移 collation 混用导致项目审计页 500。
- 项目删除有审计记录，包含 user、project、resource、action、status 和 duration。
- 用户登录成功、登录失败和退出有审计记录。
- 扫描任务创建、取消和失败有审计记录。
- AutoRepair patch 生成、取消、失败、受控 PR 排队、PR 创建成功和 PR 创建失败有审计记录。
- 仓库新增、删除和 token 更新有审计记录。
- GitHub App installation 绑定、禁用和 webhook 同步有审计记录。
- 审计日志和 Agent 工具调用审计可以按保留期批量清理，避免审计表无限增长。
- 执行任务 append-only 日志可以按保留期批量清理，避免长任务与高频重试场景导致日志表无限增长。
- 大日志和 raw result 不反复更新 MySQL 大字段。

## 8. 阶段 6：RAG 与代码切片重构

状态：已完成第一版。

目标：让代码问答检索更准、更便宜、更快。

任务：

- 切片前过滤构建产物、第三方库、生成代码、lock 文件、大型 JSON。
- chunk 增加 `content_hash`，未变化文件不重新切片、不重新 embedding。
- 问答时先关键词和路径筛 topN，再算向量相似度。
- 本地代码问答入口通过 `CodeChunkService.listRetrievalCandidates` 在 DB 层按问题关键词和路径缩小候选集，候选为空时只回退读取少量稳定切片，避免大型项目问答全量加载所有 chunk。
- embedding 模型可配置。
- 中期引入 pgvector 或独立向量库。

验收标准：

- 一次问答不会全量遍历所有 chunk。
- 重复扫描不会重复 embedding 未变化文件。
- 回答引用文件和行号。

## 9. 阶段 7：Rust Analyzer 质量提升

状态：已完成第一版 schema/hash/限制/契约测试。

目标：先稳定 CLI schema 和测试，再考虑 daemon 化。

任务：

- 定义 `scan_result_schema_version`。
- 建立 analyzer fixtures 和 snapshot tests。
- 对大文件和二进制文件做扫描上限。
- Java 后端按 schema version 解析。
- 用文件 hash 实现第一版增量扫描。

验收标准：

- analyzer 修改有 fixtures 回归。
- scan result schema 兼容。
- 小改动重扫明显变快。

## 10. 阶段 8：LLM 网关重构

状态：已完成第一版 adapter 化。

目标：模型厂商协议与业务逻辑解耦。

任务：

- 定义 `LlmProviderAdapter`。
- 实现 OpenAI-compatible 和 Mock adapter。
- 预留 Anthropic、Ollama、Azure adapter。
- `LlmConfig` 增加 chat model、embedding model、capabilities。
- 新增统一 `LlmJsonExtractor`。
- PR Review、Issue 拆解、CI 诊断共用 JSON 提取与降级逻辑。

验收标准：

- 换模型厂商不改业务服务。
- embedding 模型可配置。
- LLM JSON 解析失败有降级路径。

## 11. 阶段 9：前端控制台重构

状态：已完成第一版统一任务体验。

目标：前端从页面堆叠变成统一任务工作台。

任务：

- 路由级 lazy import，降低首屏 bundle。
- API client 增加统一错误展示、请求 ID、重试策略。
- 后端新增 `RequestIdFilter`，统一接收或生成 `X-Request-Id`，写回响应头、request attribute 和 MDC；审计日志在调用方未显式传 requestId 时自动使用当前 MDC requestId。
- 前端新增 `formatApiError` / `showApiError`，主要工作台、审计、模型配置、登录注册、项目详情和扫描详情页面的 API 失败路径统一展示后端业务错误与请求 ID，不再在页面层吞掉拦截器生成的 `userMessage`。
- 统一任务组件：timeline、log viewer、artifact viewer、diff viewer。
- Agent 工具调用统一展示。
- 模型配置页只显示 masked key。

验收标准：

- 首屏 bundle 明显降低。
- 前后端错误排障可通过 `X-Request-Id` 串联 API 响应、服务端日志和审计日志。
- 长任务刷新不丢状态。
- 任务详情页体验统一。

## 12. 阶段 10：容器沙箱

状态：已完成第一版 local/docker executor 抽象与关键路径接入。

目标：所有构建、测试、代码执行都离开 Spring Boot 宿主进程。

任务：

- 定义 `SandboxExecutor`。
- dev 保留 `LocalProcessSandboxExecutor`。
- 产品路径实现 `DockerSandboxExecutor`。
- 容器 non-root、限制 CPU、内存、网络和超时。
- Docker 执行器默认增加 `--pids-limit`、`--cap-drop ALL`、`--security-opt no-new-privileges`、`--read-only`、受限 `/tmp` tmpfs 和 `--memory-swap=<memory>`，避免容器内进程获得不必要系统能力或通过 swap 扩大内存上限。
- `SandboxCommand` 在 local/docker executor 入口统一校验 command、workingDirectory 和正数 timeout，避免不同执行器边界不一致。
- 输出只允许 diff、logs、test result。
- 中期接入 gVisor 或更强隔离运行时。

验收标准：

- 自动修复测试不在宿主进程执行。
- 资源可控。
- Docker 命令生成可单测验证，默认隔离参数不会被无意移除。
- local/docker executor 对非法 timeout 的拒绝行为一致。
- 任务结束无残留进程。

## 13. 阶段 11：GitHub App 替代 PAT

状态：已完成第一版 GitHub App 数据模型、短期 token、webhook 同步和受控 PR。

目标：弃用生产路径中的长效 PAT。

任务：

- 建立 GitHub App installation 数据模型。
- 后端用私钥签 JWT 换取 installation access token。
- token 只在 clone、push、create PR 时短期使用。
- 生产路径不依赖长效 PAT；GitHub App installation access token 不落库。
- PAT 仅作为 dev fallback。
- 生产 profile 默认禁止新增或更新 PAT 仓库凭据，必须使用 GitHub App installation。
- GitHub webhook 使用 `X-Hub-Signature-256` 和 `GITHUB_APP_WEBHOOK_SECRET` 校验。
- `installation` 和 `installation_repositories` 事件同步已存在仓库的 installation 绑定。
- webhook delivery id 处理前先以 `PROCESSING` 状态 claim 到 `github_webhook_deliveries`，成功后再更新为 `PROCESSED`；重复或并发投递会被唯一键挡在 installation/repository 同步之前。
- GitHub webhook 必须携带 `X-GitHub-Delivery`，缺失 delivery id 时在业务处理前拒绝，避免 installation 同步成功但无法写入幂等记录和项目审计关联。
- webhook delivery 支持按保留期批量清理，默认关闭，可通过环境变量启用。
- 受控 PR 创建前校验 installation permissions，必须具备 `contents:write` 与 `pull_requests:write`；权限不足或 webhook 权限降级后会拒绝排队、保留 `PATCH_READY`，并写入 `AUTO_REPAIR_PR_REJECTED` 审计。
- GitHub owner/repo 组件在 URL 入库、受控 PR 创建和 GitHub App drill 中统一做安全校验，拒绝 dot-segment、额外路径分隔符、连续 `..` 和 `.git` 后缀进入 `/repos/{owner}/{repo}` API path。
- AutoRepair `PATCH_READY` 可在 `SOURCELENS_AUTOREPAIR_SUBMIT_PR_ENABLED=true` 时创建受控 PR。
- 受控 PR 流程复用 AutoRepair 的 `execution_tasks`，通过后台异步任务记录 clone、apply patch、push、create PR 四个步骤。
- 受控 PR 重复提交会被拒绝；异步执行入口只接受 `PR_RUNNING`，避免误重复触发已完成或已回退的任务。
- 受控 PR 临时 clone 工作区在成功或失败后都会尝试清理，避免长期残留仓库内容。
- 受控 PR clone/push Git 远端和 GitHub API 都有 host allowlist，默认只允许 `github.com` 与 `api.github.com`。
- 受控 PR push 阶段会把非快进或远端分支变化映射为 `CONFLICT`，把远端策略拒绝或分支保护拒绝映射为 `FORBIDDEN`；本地回归用 bare repo 已覆盖同名修复分支非快进推送失败，并断言失败后不会继续调用 GitHub PR API。
- 分支保护式 push 拒绝已有本地诊断回归：`REJECTED_OTHER_REASON` 会保留清洗后的远端原因，例如 GitHub `GH006: Protected branch update failed`，便于真实 release evidence 和运维日志定位。
- GitHub App installation token 换取和 Pull Request 创建共用 GitHub API 出口策略：HTTPS、allowlist、拒绝本机/内网/链路本地/metadata 地址以及 user-info/query/fragment。
- GitHub Pull Request API 请求会在 HTTP 调用前校验 repository owner/name、head/base branch 和标题；GitHub `401/403` 会映射为权限失败，`409/422` 会映射为重复 PR 或校验冲突，HTTP client IO 失败会映射为脱敏后的网络请求失败，便于真实演练时定位分支保护、权限不足、重复提交和网络/API 异常。
- 重复 PR 或 GitHub 校验冲突发生在 `create_pull_request` 阶段时已有本地回归：AutoRepair 回到 `PATCH_READY`、保留错误消息、失败 `create_pull_request` step、写入 `AUTO_REPAIR_PR_FAILED`，且不会写入 `PR_CREATED` 或 `markSuccess`。
- `installation_repositories` webhook 的 `repositories_added` / `repositories_removed` 已有本地状态回归：added 只绑定系统内已存在仓库并切换为 `GITHUB_APP`，removed 禁用对应 installation 并切回 `NONE`，未知仓库不会被自动创建。
- `installation` 的 `new_permissions_accepted` payload 已有本地回归：permissions 从 write 降到 read 后，后续受控 PR 权限检查会返回 `FORBIDDEN`。
- GitHub App installation 绑定、禁用、webhook 同步会写入 `audit_logs`。
- 受控 PR 只允许 `provider=GITHUB` 且 `authType=GITHUB_APP` 的仓库，不允许 PAT。

验收标准：

- 生产不依赖长效 PAT。
- 生产 profile 下新增或更新 PAT 会被拒绝。
- token 不落库。
- GitHub 权限最小化。
- webhook 未配置 secret 或签名错误时拒绝。
- 重复投递的 GitHub webhook delivery 不会重复执行状态同步。
- 缺少 delivery id 的 GitHub webhook 不会继续处理 installation 或 repository 同步。
- GitHub webhook delivery 可以按保留期清理，避免幂等记录无限增长。
- installation 权限不足时拒绝创建受控 PR。
- 受控 PR 默认关闭，开启后使用 GitHub App installation token clone/push/create PR。
- GitHub App token 换取和 PR 创建不会访问 allowlist 外或内网类 GitHub API Base URL。
- 受控 PR 失败时能在 execution step 中定位失败阶段，并将 AutoRepair 恢复为 `PATCH_READY` 以便修正后重试。

已落地文件：

- `github_app_installations` 迁移。
- `GitHubAppTokenService`、`GitHubAppInstallationService`。
- `GitHubAppWebhookController`、`GitHubAppWebhookService`、`GitHubWebhookSignatureService`。
- `GitHubPullRequestService`、`AutoRepairPrService`。
- 前端仓库页 GitHub App 绑定入口。
- 前端 AutoRepair 页创建 PR 和 PR 链接展示。

剩余风险：

- 受控 PR 当前基于 patch apply 和 GitHub REST，真实 GitHub App 权限、分支保护、fork/head 规则仍需在真实仓库做端到端演练。
- 受控 PR 当前在后端进程中使用 JGit/HTTP 执行，已用 host allowlist 收敛网络出口；生产若迁移到独立 worker 或容器执行，还需同步配置网络出口。
- 受控 PR 已异步化，HTTP 请求只负责校验、切换为 `PR_RUNNING` 并启动后台任务；真实 GitHub 仓库端到端验证仍需覆盖分支保护、权限和网络失败场景。
- webhook delivery 清理默认关闭；生产部署需要显式配置 `GITHUB_WEBHOOK_DELIVERY_CLEANUP_ENABLED=true` 和符合审计要求的保留天数；`prod-preflight` 在强制 GitHub App readiness 时已检查 cleanup enabled、retention days 和 batch size。

## 14. 阶段 12：图数据库与高级编排

目标：在真实瓶颈出现后，引入 Neo4j、pgvector、Temporal 或 analyzer daemon。

触发条件：

- 单项目 symbol/relation 超过 50 万。
- 多级调用链查询超过 2 秒。
- 任务恢复、重试、补偿逻辑已经超过简单队列能力。

验收标准：

- 有基准数据证明需要引入新组件。
- 新组件不替代业务主库，只承担专门职责。

## 15. 阶段 12 前生产化收口

状态：进行中。

目标：让阶段 0-11 已落地能力具备真实部署、排障和验收基础，再进入更重的新组件引入。

当前已补齐：

- `RequestIdFilter` 贯穿 API 响应、MDC 和审计记录。
- `execution_logs` 提供 append-only 任务生命周期日志。
- `SourceLensMetrics` 统一封装 Micrometer 业务指标，避免业务代码直接散落指标命名。
- `/actuator/health`、`/actuator/info`、`/actuator/metrics` 暴露基础运行状态和指标。
- `SecurityStartupValidator` 在生产 profile 下强制校验仓库认证、docker sandbox、GitHub App 受控 PR 前置配置等生产红线，避免运维手册中的安全要求只停留在人肉检查。
- `SecurityStartupValidator` 在开启 Agent 创建 PR 或 AutoRepair 受控 PR 时复用 `GitHubApiEndpointPolicy`，启动期即拒绝非 HTTPS、allowlist 外、本机/内网/链路本地/metadata 或带 user-info/query/fragment 的 GitHub API base URL。
- GitHub App webhook 入口和服务层都要求 `X-GitHub-Delivery`，以 delivery id 作为幂等与审计关联键；服务层会在业务处理前 claim delivery id，并在同一事务内完成 installation/repository 同步和 `PROCESSED` 标记。
- `application-prod.yml` 默认使用 `SOURCELENS_SANDBOX_EXECUTOR=docker`，生产不再默认回退到 local executor。
- `application-prod.yml` 显式暴露 Docker sandbox 的 network、非 root user、pid limit、read-only root 和安全 tmpfs 参数，确保 `SecurityStartupValidator` 从 Spring Environment 能读到启动红线，而不是只依赖执行器 `@Value` 默认值。
- `application-prod.yml` 和 `DockerSandboxExecutor` 的 Docker sandbox 默认镜像已固定为 `tag@sha256:digest`，生产启动校验和 preflight 会拒绝裸 tag 覆写，避免执行用户仓库命令的沙箱镜像被可移动 tag 污染。
- `SandboxCommandValidator` 已把 shell 解释器拒绝、工作目录存在性/非根目录校验、命令参数数量/长度/控制字符校验、secret-bearing 环境变量拒绝下沉到 local/docker executor 入口；`LocalProcessSandboxExecutor` 会先清空继承环境，再只恢复 PATH、JAVA_HOME、MAVEN_HOME、GRADLE_HOME、locale 和 TZ 等安全白名单环境，避免 Agent 命令默认继承后端进程密钥。`LocalProcessSandboxExecutorTest`、`DockerSandboxExecutorTest` 与 `scripts/security-regression-check.sh` 已锁住该边界。
- `SecurityStartupValidator` 对 Docker sandbox memory 与 CPU limit 做正值校验，`production-preflight.sh` 也会在真实 env 覆写这些值时提前拦截 0、负数或非法格式。
- `SecurityStartupValidatorTest` 增加真实 YAML 加载用例，验证只提供外部 secret/DB/Redis 变量时，`application.yml` + `application-prod.yml` 本身足以通过生产启动红线校验。
- `deploy/docker-compose.yml` 的 prod 后端显式使用 docker sandbox，并显式关闭 PAT 凭据和本地文件仓库；安全回归检查会阻止 `deploy/.env` 被纳入版本库。
- `production-preflight.sh` 会检查 `docker compose config` 渲染后的 backend/mysql/redis 服务块，确认 prod profile、仓库根 build context、docker sandbox 红线、禁用 PAT、禁用本地文件仓库、workspace volume、healthy depends_on 和外部服务 digest-pinned image 未被实际发布配置绕开。
- 后端 Docker 镜像改为从仓库根构建，同时打包 Spring Boot jar 和 Rust `sourcelens-analyzer`，避免容器部署后扫描任务找不到 analyzer 二进制。
- `AnalyzerRunner` 已改为启动进程后立即并发排空 stdout/stderr，再用 `waitFor(timeoutSeconds, TimeUnit.SECONDS)` 执行超时控制；输出读取只保留有限字节但持续 drain 到 EOF，避免大 stderr 阻塞或提前关闭管道触发 SIGPIPE；日志只记录 `stderrSummary`，避免 analyzer 噪声刷爆后端日志。`AnalyzerRunnerTest` 与 `scripts/security-regression-check.sh` 已锁住超时和大 stderr 场景。
- 后端 Dockerfile 的 Maven builder、Rust analyzer builder 和 JRE runtime 基础镜像均固定为 `tag@sha256:digest`，依赖回归和安全回归门禁会阻止退回可移动基础镜像 tag。
- `deploy/docker-compose.yml` 中的 MySQL 与 Redis 外部服务镜像也已固定为 `tag@sha256:digest`，依赖回归和安全回归门禁会阻止退回可移动 Compose service image tag。
- 新增根 `.dockerignore`，排除 `.git`、前端依赖、构建产物和私有 env 文件，降低仓库根 Docker build context 的体积与泄漏风险。
- 新增 `docs/OPERATIONS_RUNBOOK.md`，覆盖生产环境变量红线、Actuator 暴露策略、GitHub App 端到端验收、沙箱验收、回滚止损和发布前验证。
- 新增 `scripts/smoke-test.sh` 与 `make smoke`，提供可重复的 `/api/health`、`/actuator/health`、`/actuator/info`、未认证 metrics 禁止访问和可选 authenticated metrics 验收入口。
- `scripts/smoke-test.sh` 与 `scripts/production-preflight.sh` 会规范化 `SOURCELENS_BASE_URL` 的空白、成对引号和末尾 `/`，避免部署 smoke 拼出 `//api/health`；smoke、production preflight、rollback preflight 和 GitHub webhook drill 会在 HTTP 调用前 fail-closed 拒绝非 http/https、空 host、空白、user-info、query 或 fragment 的 Base URL，避免把凭据形态 URL 写入日志或拼出不可预测的验收路径；smoke 可通过 `SOURCELENS_SMOKE_ENV_FILE` 读取私有 env 文件并在读取 token 前独立校验真实 env 文件边界，安全回归会用 fake curl 负例确认 644 env 文件在 HTTP 调用前 fail-closed；preflight 会从真实 env 文件读取 smoke target，并按后写覆盖先写的 env 语义解析重复 key；smoke token 也会去掉外层或嵌套成对引号后再作为 Bearer token 使用。
- `scripts/smoke-test.sh` 与 `scripts/production-preflight.sh` 的 HTTP smoke 调用已统一使用可配置 curl 超时，默认 connect timeout 5 秒、max time 15 秒，并拒绝非正整数覆写，避免发布验收在异常网络连接上长时间挂住。
- 新增 `scripts/security-regression-check.sh`，自动拦截危险旧示例、生产配置默认值回退、Swagger 生产开启、smoke metrics 保护断言缺失，以及 prod preflight 入口/模板/文档缺失等安全回归。
- `scripts/security-regression-check.sh` 同时检查 Makefile/CI 直接执行的发布脚本保留 executable bit，避免脚本权限在提交或换机后丢失。
- 新增 `make script-check`，并接入 `make verify` 与安全回归门禁，统一对 `scripts/*.sh` 执行 `bash -n`，避免 smoke、phase12 baseline、worktree inventory 等低频脚本只在真实环境才暴露语法问题。
- 新增 `scripts/dependency-regression-check.sh` 与 `make dependency-check`，固定前端 lockfile、Rust lockfile、CI locked install/check/test，并阻止 file/git/path/system/floating 版本等不可复现依赖模式。
- 新增 `scripts/worktree-inventory.sh` 与 `make worktree-inventory`，按安全、审计、分析、任务、Agent、沙箱、GitHub App、前端、Rust analyzer、CI/运维、文档等组输出当前工作区清单，辅助后续拆审和拆提交；临时分组目录使用 SourceLens 前缀并显式收紧为 `700`；`SOURCELENS_WORKTREE_INVENTORY_STRICT` 只接受合法布尔值，拼错会 fail-closed，避免 strict 拆审或发布证据复核被静默降级。
- 新增 `scripts/production-preflight.sh` 与 `make prod-preflight`，在真实 smoke、GitHub App E2E、Docker sandbox 演练和阶段 12 baseline 前检查 Docker daemon、MySQL CLI、生产变量、GitHub App 变量、GitHub API 出口策略、Compose config 和静态安全/依赖/LLM safety 门禁；静态门禁失败时会保留子门禁输出详情，便于定位具体断言或样例失败；Compose 会同时渲染 `deploy/.env.example` 模板和存在的真实部署 env 文件，并检查渲染结果中的生产安全红线，避免只验证模板而漏掉实际发布配置。
- 新增 `scripts/sandbox-drill.sh` 与 `make sandbox-drill`，在真实 Docker 环境中创建受限 sandbox 容器，通过 `docker inspect` 和容器内运行时检查验证 no-network、非 root、cap drop、no-new-privileges、read-only root、`/tmp` noexec/nosuid、pid/memory cgroup、workspace 写入、Maven/npm/Gradle cache 写入兼容性和 memory-swap 上限；脚本会在读取 sandbox 覆写配置前独立校验真实 env 文件边界，挂载前将临时 workspace 显式收紧为 `700`，并显式覆盖 runtime script entrypoint，避免默认 `alpine/git` entrypoint 把 `sh` 误解释成 git 子命令。后端 Docker sandbox executor 会用非空 `--entrypoint=` 清空镜像默认 entrypoint，确保真实用户命令不被镜像入口劫持，也不会被本地参数校验误拦截。
- Docker sandbox 构建工具缓存策略已收口：容器内 `HOME`、`XDG_CACHE_HOME`、`MAVEN_CONFIG`、`npm_config_cache` 和 `GRADLE_USER_HOME` 固定在 `/workspace/.sourcelens-home` 与 `/workspace/.sourcelens-cache/*`，`SandboxCommand.environment` 经过校验后用 `docker run -e` 传入容器，不再传给宿主 `docker` CLI 进程；当前不启用跨项目持久缓存，避免源码、依赖元数据或构建产物通过共享 cache 泄漏。
- 新增 `scripts/github-app-drill.sh` 与 `make github-app-drill`，在真实 GitHub App 环境中只读验证 App JWT、installation 元数据、installation access token、仓库读取权限和 webhook HMAC；脚本会在读取配置前独立校验真实 env 文件边界，在本地配置阶段校验 private key PEM 形状和 webhook secret 最小长度，并用标准 HMAC-SHA256 测试向量和实际 secret 的 `sha256=<hex>` 签名头形状校验本地签名路径，再将临时私钥目录显式收紧为 `700`、私钥文件收紧为 `600`，不创建分支、不 push、不创建 PR。
- 新增 `scripts/github-webhook-drill.sh` 与 `make github-webhook-drill`，在真实 SourceLens 部署入口验证 GitHub webhook HMAC SHA-256 签名、同一 delivery id 重放幂等、缺 delivery id 拒绝和错误签名拒绝；脚本会在读取 webhook secret 前独立校验真实 env 文件边界，演练用 event/delivery id header 值会先做字符集与长度校验，自定义 payload fixture 需通过非空、非 symlink、权限、大小和 JSON 校验，且 fixture 权限/大小不可检查或不可解析时会 fail-closed；请求 payload 会写入 `600` 临时文件并通过 `curl --data-binary @file` 发送，避免真实 webhook 内容暴露在进程命令行参数中；响应临时目录显式收紧为 `700`。
- 新增 `scripts/backup-restore-preflight.sh` 与 `make backup-preflight`，在真实发布前检查 `mysqldump/mysql/tar/gzip/checksum` 工具链、数据库连接配置、备份目录私有权限、备份目录不得位于 git worktree 或 workspace 内、备份保留期、加密要求和恢复演练证据文件；备份目录、恢复演练证据权限和恢复演练证据 mtime 都必须可判定，避免备份恢复只停留在人工口头流程或未知权限文件上。
- 新增 `scripts/rollback-preflight.sh` 与 `make rollback-preflight`，在真实回滚前检查不可变回滚目标、安全格式且可匹配 artifact 的备份编号、备份目录私有且不在 git/workspace 内、非空/非 symlink/不过期的回滚计划文件、止损开关和 smoke target；止损开关会在启动期 fail-closed 校验，`SOURCELENS_AGENT_WRITE_PATCH_ENABLED`、`SOURCELENS_AGENT_EXEC_TEST_ENABLED`、`SOURCELENS_AGENT_CREATE_PR_ENABLED` 和 `SOURCELENS_AUTOREPAIR_SUBMIT_PR_ENABLED` 必须未设置或明确关闭，避免回滚期间仍保留 Agent/AutoRepair 写操作或 PR 提交能力；备份目录、回滚计划权限和回滚计划 mtime 都必须可判定，避免回滚到可移动 tag/branch、使用不安全备份目录、复用陈旧计划或没有可恢复数据的状态。
- 新增 `scripts/release-evidence.sh` 与 `make release-evidence`，按发布 run id 生成 `release-evidence/<run-id>/` 证据包，归档 `make verify`、prod/backup/rollback preflight、已配置的备份恢复演练证据和回滚计划副本、可选 smoke、可选公开仓库主链路 smoke、可选 Docker sandbox drill、可选 GitHub App drill、可选 GitHub webhook drill、可选阶段 12 baseline 和可选 LLM provider 安全评估结果；同时保存 git manifest、`git status --short`、`git diff --stat` 和 `worktree-inventory.md`，但不归档完整 diff；worktree inventory 默认 strict，出现 `Other` 未分类路径会把证据标为 required failure；证据目录已从 Git 和 Docker build context 排除，避免验收日志误入库或镜像；include 开关会在写入证据目录前校验 `true`/`false`/`auto` 合法取值，拼写错误不会被静默当成跳过；证据根目录必须是非 symlink、权限可检查可解析的私有目录，run id 必须是短安全标识；强制 smoke 但缺少 `SOURCELENS_BASE_URL` 时会记录 smoke required failure，并且该失败证据包仍要通过 `make verify-release-evidence` / `scripts/verify-release-evidence.sh` 复核；强制 phase12 baseline 但缺少 `DB_USERNAME` / `DB_PASSWORD` 等数据库凭据时会记录 `phase12-baseline` required failure，并且该失败证据包仍要通过 `make verify-release-evidence` / `scripts/verify-release-evidence.sh` 复核；强制 Docker sandbox drill 但 Docker daemon 不可达时会记录 `sandbox-drill` required failure，并且该失败证据包仍要通过 `make verify-release-evidence` / `scripts/verify-release-evidence.sh` 复核；强制 GitHub App drill 但缺少 `GITHUB_APP_ID` 等配置时会记录 `github-app-drill` required failure，并且该失败证据包仍要通过 `make verify-release-evidence` / `scripts/verify-release-evidence.sh` 复核；强制 GitHub webhook drill 但缺少 `SOURCELENS_BASE_URL` 或 `GITHUB_APP_WEBHOOK_SECRET` 时会记录 `github-webhook-drill` required failure，并且该失败证据包仍要通过 `make verify-release-evidence` / `scripts/verify-release-evidence.sh` 复核；调用可选 smoke、phase12 baseline、Docker sandbox drill、GitHub App drill 和 GitHub webhook drill 子脚本时会转发同一个已校验 env 文件，且 smoke token 和 phase12 `DB_PASSWORD` 不再通过命令行 env 参数传递；证据日志命令行会脱敏 password/token/secret/private key 类 env 参数，步骤输出和人工证据副本落盘后也会 scrub 预置敏感 key 与真实 env/进程环境中的 secret-like key。
- release evidence 标准 step `public-repo-smoke` 负责公开仓库主链路，成功日志必须含 `PUBLIC_REPO_SMOKE_OK`；它验证 clone、scan、artifact、code_chunks、report 和 QA，GitHub App 高级集成层不阻塞该主链路。
- release evidence 标准 step `dashboard-next-action-ui-smoke` 负责 Dashboard 主链路推荐行动 UI 状态矩阵，成功日志必须含唯一 `DASHBOARD_NEXT_ACTION_SMOKE_OK`；verifier 会校验 7 个推荐分支、7 个推荐标题、`1440x900`/`320x740` visited cases、mock-only、local-only 和未 mock API 为 0，避免 Dashboard 主链路体验只停留在 standalone smoke。
- release evidence 标准 step `report-evidence-drawer-ui-smoke` 负责 ScanTaskDetail 报告证据抽屉与 code_chunks 查询合同，成功日志必须含唯一 `REPORT_EVIDENCE_DRAWER_SMOKE_OK`；verifier 会校验 project/repository/scan 绑定、目标证据文件、`drawerQueryCount=2`、`1440x900`/`320x740`、mock-only、local-only 和未 mock API 为 0，避免报告体验只停留在 standalone smoke。
- release evidence 标准 step `scan-governance-timeline-ui-smoke` 负责 ScanTaskDetail 修复治理时间线聚合合同，成功日志必须含唯一 `SCAN_GOVERNANCE_TIMELINE_SMOKE_OK`；verifier 会校验 `scanTaskId=8801`、异 scan 排除、candidate receipt 可见、foreign receipt hidden、AutoRepair detail deep link bound、PR gate rejected 可见、foreign PR gate hidden、PR gate AutoRepair detail deep link bound、patch evidence 中 `PATCH_READY`、`CHANGE_PATCH` artifact 归属当前 AutoRepair、`generate_patch SUCCESS` execution step、`AUTO_REPAIR_PATCH_READY` audit、foreign patch evidence hidden、Agent review current task/tool call/execution 可见、foreign Agent review hidden、Agent execution 绑定当前 `AGENT_TASK` source、无 raw prompt/answer、`1440x900`/`320x740`、mock-only、local-only 和未 mock API 为 0，避免治理闭环只停留在 standalone smoke。
- release evidence 分层 profile 已收口为 `local`、`ci`、`release`、`nightly`：manifest 必须记录 `release_evidence_profile_schema: 3`、`release_evidence_profile`、`release_evidence_profile_source` 和 `include_agent_chat_closure_rail_ui_smoke`，`verify-release-evidence` 会从非 `local` profile 反推 include mode，拒绝 profile/include mismatch；`ci/release/nightly` 不允许单项 include override，避免发布证据被 profile 名称粉饰但实际门禁降级。
- 普通 PR/push CI 已接入 `release-evidence-ci` job：使用 `${{ runner.temp }}/release-evidence` 和 `deploy/.env.example` 生成 `ci` profile 证据包，随后执行 `make verify-release-evidence DIR=...`，断言 manifest profile/source/include 与 summary fail/warn，并上传 7 天保留的短期 evidence artifact；安全回归同步阻断普通 CI 使用 `release`/`nightly` profile、repo secrets、真实 env 输入、job-level 权限提升和 checkout 持久化凭据。
- 配置了 `SOURCELENS_BACKUP_RESTORE_DRILL_EVIDENCE_FILE` 和 `SOURCELENS_ROLLBACK_PLAN_FILE` 但手工证据源文件缺失或不是普通文件时，release evidence 会记录 `backup-restore-drill-evidence` / `rollback-plan` required failure，并且该失败证据包仍要通过 `make verify-release-evidence` / `scripts/verify-release-evidence.sh` 复核。
- 新增 `PromptInjectionGuard`，统一给 Agent system prompt、RAG 代码切片、AutoRepair 源码/目标描述、CI 日志、PR diff、Issue 文本、Agent 任务扫描产物和工具结果加入 untrusted data 边界，避免代码/日志/diff 中的伪指令覆盖 SourceLens 工具权限、输出 schema 或安全策略。
- 新增 `docs/LLM_SAFETY_EVALS.md`、`docs/llm-safety-evals/prompt-injection-cases.json`、`docs/llm-safety-evals/output-quality-cases.json`、`docs/llm-safety-evals/provider-run-template.json`、`scripts/llm-safety-regression.sh` 与 `make llm-safety-check`，把 Prompt injection 红队样例、LLM 输出质量契约和真实 provider 评估结果格式固化成本地回归资产；`make verify` 已接入该检查。
- `scripts/release-evidence.sh` 支持 `SOURCELENS_RELEASE_EVIDENCE_LLM_PROVIDER_RUN_FILE` 和 `SOURCELENS_RELEASE_EVIDENCE_LLM_RAW_OUTPUT_DIR`，会先拒绝 symlink、空文件、不可读文件、权限不可检查/不可解析和 group/world 可访问 provider run，再用 `scripts/validate-llm-provider-run.mjs` 校验真实 provider run 覆盖 14 个样例、无 secret 字段、不内联 raw output，且 raw output artifact 路径必须位于 `release-evidence/<run-id>/llm-evals/` 下、匹配本次 release run id 并只使用安全路径段；校验通过后会把 provider JSON 复制为私有 `llm-provider-run.json`，再从私有 raw output 源目录复制对应 `llm-evals/` artifact、收紧为 `600` 并执行敏感值 scrub 后写入证据包；强制 LLM provider run 但缺少 `SOURCELENS_RELEASE_EVIDENCE_LLM_PROVIDER_RUN_FILE` 时会记录 `llm-provider-run` required failure，并且该失败证据包仍要通过 `make verify-release-evidence` / `scripts/verify-release-evidence.sh` 复核。
- `scripts/validate-llm-provider-run.mjs` 的 CLI 参数已 fail-closed：未知选项、`--run-id` 缺值和额外位置参数都会失败，避免 release evidence run id 绑定因参数拼写错误被静默跳过。
- release、preflight、smoke、phase12、sandbox 和 GitHub drill 脚本的 env 值规范化已统一为 trim 并循环剥离外层或嵌套成对引号；安全回归会检查 9 个发布验收脚本都保留该逻辑，避免真实 env 文件在不同门禁中解析不一致。
- `production-preflight.sh` 读取真实 env 时会规范化空白、`export KEY=value` 和成对引号，避免 `SOURCELENS_AGENT_CREATE_PR_ENABLED="true"` 这类常见写法绕过 GitHub App readiness 检查；`SOURCELENS_PREFLIGHT_REQUIRE_GITHUB_APP`、`SOURCELENS_AGENT_CREATE_PR_ENABLED` 和 `SOURCELENS_AUTOREPAIR_SUBMIT_PR_ENABLED` 只接受合法布尔值，拼错会 fail-closed，避免真实 GitHub App readiness 验收被静默跳过，或受控 PR 功能开关产生模糊生产配置。
- 发布验收链路的 `*_WARN_ONLY` 模式已统一为启动期布尔校验：`production-preflight.sh`、`backup-restore-preflight.sh`、`rollback-preflight.sh`、`sandbox-drill.sh`、`github-app-drill.sh` 和 `github-webhook-drill.sh` 都会先规范化空白和成对引号，拼错会 fail-closed，避免 release evidence 或真实发布演练被静默切换到错误模式。
- `production-preflight.sh` 已对齐后端生产启动校验，提前检查 `DB_PASSWORD`、`JWT_SECRET`、`ENCRYPT_PASSWORD`、`ENCRYPT_SALT` 和 GitHub App webhook secret 的最小长度与开发默认值；当前本机私有 `deploy/.env` 已轮换 DB/encrypt 默认值并通过 preflight，真实生产仍需走正式 secret 管理和历史加密数据迁移策略。
- `production-preflight.sh`、`backup-restore-preflight.sh` 和 `rollback-preflight.sh` 会检查各自指向的真实 env 文件边界，拒绝 symlink、非普通文件、空文件、不可读文件、权限不可检查/不可解析和 group/world 可读写的私有部署配置；当前本机 `deploy/.env` 已收紧为 `600`。
- `release-evidence.sh` 在写入证据目录前也会独立检查 `SOURCELENS_RELEASE_EVIDENCE_ENV_FILE` / `SOURCELENS_PREFLIGHT_ENV_FILE` 指向的真实 env 文件边界，允许 `deploy/.env.example` 模板和缺失文件走进程环境兜底，但一旦真实 env 文件存在，就必须是非 symlink、普通、非空、可读且不开放 group/world 权限，避免关闭 preflight 后用弱 env 文件收集发布证据。
- `backup-restore-preflight.sh` 已增强恢复演练证据格式：除数据库/workspace/artifact/checksum pass 标记外，还要求 `backup_id` 使用安全 artifact id、在 `SOURCELENS_BACKUP_DIR` 中匹配到 database/workspace/artifacts/checksums 四类备份 artifact，并要求四类 artifact 都是非 symlink 普通文件、非空、可读、权限可检查且可解析，并且不可 group/world 写；checksum manifest 必须覆盖且匹配 database/workspace/artifacts 三类 artifact 的真实 SHA-256，`restore_drill_completed_at` 为不过期的 UTC ISO-8601 时间戳；`rollback-preflight.sh` 也会对回滚 backup id 执行同一套备份集合、文件边界和 checksum 内容校验；backup/rollback preflight 对 `SOURCELENS_BACKUP_DIR`、备份 artifact、恢复演练证据文件、回滚计划文件的权限/mtime 可判定性改为 fail-closed，`stat` 失败或权限不可解析在严格模式下都会失败；`release-evidence.sh` 在归档备份恢复证据和回滚计划前也会独立复查恢复演练完成时间、恢复演练文件 mtime、回滚计划文件 mtime、`SOURCELENS_BACKUP_DIR` 不为 symlink、不在 git worktree 或 `SOURCELENS_WORKSPACE` 内、可读可搜索且不开放 group/world 权限，并做同一套 artifact 语义校验，避免 warn-only preflight 让弱证据进入发布包。
- `release-evidence.sh` 对手工证据源文件的权限检查改为 fail-closed：权限不可检查或不可解析时不再继续归档，避免把权限未知的恢复演练证据或回滚计划复制进发布证据包。
- `release-evidence.sh` 启动时会先设置 `umask 077`，避免中途失败时留下依赖调用者默认 umask 的半成品证据文件；最终 summary 写完后会先把证据包内所有普通文件权限统一收紧为 `600`，再生成私有 `checksums.sha256`；checksum manifest 使用 `sha256sum` 或便携 `shasum -a 256` 覆盖证据包内除 manifest 自身外的所有文件，便于发布记录验证证据包内容未被后改。
- 新增 `scripts/verify-release-evidence.sh` 与 `make verify-release-evidence DIR=release-evidence/<run-id>`，用于发布后复核证据包：先要求 `summary.md`、`status.tsv`、`manifest.txt`、`git-status.txt`、`git-diff-stat.txt` 和 `worktree-inventory.md` 等核心证据存在，拒绝 `git-status.txt` / `git-diff-stat.txt` / `worktree-inventory.md` 控制字符，校验 summary/manifest metadata 一致性与格式、实际 verifier 目录名和 `summary.md` 的 `evidence_dir` 末段都必须匹配 `run_id`、summary marker、`## Steps` 的状态/slug 与 `status.tsv` 一一对应、summary 三项计数与 `status.tsv` 中 `FAIL/WARN/SKIP` 行数一致、status 表头、当前标准 step slug 各出现一次、`status`/`exit_code` 语义一致、每个标准 step 的 `log_file` 必须匹配固定证据文件名和 status 引用文件，并从核心文件、status 引用文件、成功 LLM provider run 的 `llm-provider-run.json` 及其中声明的 `llm-evals/` raw output artifact 构建 expected file allowlist，再拒绝额外文件、symlink、非 `600` 普通文件、manifest 自包含、manifest 不安全路径或实际包内不安全文件路径，并重新计算所有非 manifest 文件的 SHA-256 与 `checksums.sha256` 比对。
- 安全回归会动态生成轻量 release evidence 包，篡改 `git-status.txt` 后确认 checksum mismatch 能被 `verify-release-evidence` 拒绝，避免 verifier 的完整性比对退化成只检查文件存在。
- 安全回归还会向 `checksums.sha256` 追加不安全路径条目，并确认 `verify-release-evidence` 以 `unsafe checksum path` 拒绝该包，避免 checksum manifest 指向证据目录外或含 dot-segment 的路径。
- 安全回归还会向 `checksums.sha256` 追加重复路径条目，并确认 `verify-release-evidence` 以 `duplicate checksum path` 拒绝该包，避免完整性 manifest 出现同一证据文件的多重声明。
- 安全回归还会把 `checksums.sha256` 权限放宽到 `644`，并确认 `verify-release-evidence` 以 `checksum manifest must have 600 permissions` 拒绝该包，避免完整性根文件自身权限退化。
- 安全回归还会通过 symlink 路径调用 `verify-release-evidence`，并确认它以 `release evidence directory must not be a symlink` 拒绝该输入，避免复核入口被链接到另一份证据目录。
- 安全回归还会在轻量证据包内额外创建带反斜杠的不安全文件名，并确认 `verify-release-evidence` 以 `release evidence file path is unsafe` 拒绝该包，避免真实包内异常路径绕过 manifest 校验。
- 安全回归还会在轻量证据包内额外创建 symlink，并确认 `verify-release-evidence` 以 `release evidence directory must not contain symlinks` 拒绝该包，避免发布证据复核跟随链接读取包外或伪造内容。
- 安全回归还会在轻量证据包内额外创建普通文件，重新生成 checksum manifest 后把该包内文件权限放宽到 `644`，并确认 `verify-release-evidence` 仍以 `must have 600 permissions` 拒绝该包，避免内容完整性正常但私有权限退化的证据被接受。
- 安全回归还会在轻量证据包内创建 `600` 权限额外文件，重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `unexpected file` 拒绝，避免证据包被当作任意文件容器夹带伪证据或敏感内容。
- 安全回归还会在轻量证据包内额外创建空目录，重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `unexpected directory` 拒绝；成功归档 LLM raw output 时也会把 `llm-evals` 目录权限放宽并确认 verifier 拒绝，避免包内目录绕过 expected allowlist 或私有权限校验。
- 安全回归还会把 `llm-provider-run` 伪造成 `OK` 但缺少 `llm-provider-run.json`，重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `regular file` 拒绝，避免真实 provider 安全评估结果只在状态表中被伪造为成功。
- 安全回归还会生成带 14 个 raw output artifact（均位于 `llm-evals/`）的真实形态 provider run 证据包，确认原始包可通过 `verify-release-evidence`，随后删除一个 raw output artifact 并重新生成 checksum manifest，确认 `verify-release-evidence` 仍以 `regular file` 拒绝，避免 `llm-provider-run.json` 声称有原始输出但证据包缺失实物。
- 安全回归还会在 `summary.md` 的 `## Steps` 追加伪造 step，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `summary steps must match status.tsv status, slug, title and detail rows` 拒绝，避免只篡改摘要而不改 `status.tsv` 的验收伪造。
- 安全回归还会只篡改 `summary.md` 中已有 step 的展示详情，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `summary steps must match status.tsv status, slug, title and detail rows` 拒绝，避免摘要显示的通过原因被粉饰而 `status.tsv` 保持不变。
- 安全回归还会向 `summary.md` 的 step 行注入控制字符，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `summary step line contains control characters` 拒绝，避免摘要标题或详情被终端控制字符污染显示。
- 安全回归还会向 `summary.md` 追加额外内容，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `summary file must match the generated layout exactly` 拒绝，避免发布摘要在标准 Summary 之后夹带人工 override 或伪造通过结论。
- 安全回归还会把 `summary.md` 和 `manifest.txt` 的 `env_file` metadata 篡改为含反引号的值，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `summary env_file must not contain control characters or backticks` 拒绝，避免 metadata 破坏 summary 解析或伪造发布环境来源。
- 安全回归还会把 `manifest.txt` 的 `created_at` 篡改为另一个合法 UTC 时间，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `summary created_at must match manifest created_at` 拒绝，避免摘要和 manifest 使用不同时间线伪造发布记录。
- 安全回归还会把 `summary.md` 和 `manifest.txt` 的 `created_at` 同步篡改为 `2026-99-99T99:99:99Z`，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `created_at must be a valid UTC ISO-8601 timestamp` 拒绝，避免格式像时间但无法解析的伪时间线进入发布证据。
- 安全回归还会在 `summary.md` 中复制 `env_file` metadata，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `exactly one non-empty env_file metadata value` 拒绝，避免重复 metadata 伪造发布环境来源。
- 安全回归还会把 `manifest.txt` 的 `llm_provider_run_file` metadata 篡改为含反引号的值，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `llm_provider_run_file must not contain control characters or backticks` 拒绝，避免 LLM provider 路径 metadata 污染发布证据。
- 安全回归还会向 `manifest.txt` 追加额外内容，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `manifest file must match the generated layout exactly` 拒绝，避免发布 manifest 在固定 metadata 之外夹带人工 override 或伪造验收来源。
- 安全回归还会把 `manifest.txt` 中的 `include_smoke` 篡改为 `maybe`，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `include_smoke must be true, false, or auto` 拒绝，避免 manifest include/worktree 模式被改成生成器不会产出的非法值。
- 安全回归还会生成 `include_smoke=true` 的 required failure 包，把 `status.tsv` 和 `summary.md` 里的 smoke 行伪造成 `SKIP` 并重新生成 checksum manifest，确认 `verify-release-evidence` 仍以 `requires smoke status not to be SKIP` 拒绝，避免强制验收步骤被粉饰成未配置跳过。
- 安全回归还会把同一类 `include_smoke=true` required failure 包的 smoke 行伪造成 `WARN`，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `requires smoke status to be OK or FAIL` 拒绝，避免强制验收失败被降级成 optional warning。
- 安全回归还会把 `include_smoke=false` 包里的 smoke `SKIP` detail 从 `SOURCELENS_RELEASE_EVIDENCE_INCLUDE_SMOKE=false` 篡改成 `SOURCELENS_BASE_URL is not configured`，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `requires smoke detail to be` 拒绝，避免显式关闭的验收步骤伪装成环境未配置。
- 安全回归还会把 `git-metadata` 状态伪造成 `SKIP` 并重新生成 checksum manifest，确认 `verify-release-evidence` 仍以 `git-metadata status must be OK` 拒绝；随后还会把 `worktree-inventory` 状态伪造成 `SKIP` 并确认 `verify-release-evidence` 仍以 `worktree-inventory status must not be SKIP` 拒绝，避免核心证据快照被粉饰成跳过。
- 安全回归还会制造 `worktree-inventory.md` 中的非零 `Other` 分组，把 `worktree-inventory` strict failure 伪造成 `OK` 并重新生成 checksum manifest，确认 `verify-release-evidence` 仍以 `strict OK must not contain Other paths` 拒绝，避免未分类工作区路径被粉饰成已完成拆审。
- 安全回归还会保留 `worktree-inventory` strict failure 状态但删除 `worktree-inventory.md` 中的 `Other` 分组和失败标记，重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `strict FAIL must contain Other paths and strict failure marker` 拒绝，避免发布证据只剩失败状态而丢失可审计失败细节。
- 安全回归还会向 `worktree-inventory.md` 注入控制字符，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `worktree inventory must not contain control characters` 拒绝，避免工作区拆审清单污染终端、工单或日志查看器。
- 安全回归还会向 `git-status.txt` 和 `git-diff-stat.txt` 注入控制字符，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍分别以 `git status snapshot must not contain control characters` 和 `git diff stat snapshot must not contain control characters` 拒绝，避免 git 快照污染终端、工单或日志查看器。
- 安全回归还会把 `summary.md` 的 `skipped` 计数篡改为伪值，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `summary skipped must match status.tsv` 拒绝，避免发布摘要计数粉饰真实 step 状态。
- 安全回归还会把 `status.tsv` 中 `OK` step 的 `exit_code` 篡改为非零值，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `OK status must use exit_code 0` 拒绝，避免步骤状态和退出码被拆开伪造。
- `release-evidence` 生成侧会在写入 `status.tsv` 前校验 `status` 与 `exit_code` 语义一致：`OK=0`、`SKIP=-`、`WARN=非零数字`、`FAIL=-或非零数字`，避免坏状态表只靠发布后 verifier 才发现。
- `release-evidence` 生成侧会为 `summary.md` 和 `manifest.txt` 使用同一个 UTC `created_at`，避免同一证据包里核心 metadata 出现跨秒或后改不一致。
- `release-evidence` 生成侧会在写入 summary/manifest 前校验 `env_file` 和 evidence directory metadata 非空且不含控制字符或反引号；即使 env 文件缺失并回退进程环境，也不会用不安全 metadata 创建证据包。
- `release-evidence` 生成侧会在写入 manifest 前规范化可选的 `llm_provider_run_file` 和 `llm_raw_output_dir` metadata，把控制字符折叠为空格并替换反引号；这些字段即使为空也必须保持可安全解析。
- `release-evidence` 生成侧会在写入 summary 前校验 step title 非空且不含控制字符，避免未来新增发布步骤时把异常标题写入验收摘要。
- 安全回归还会把 `status.tsv` 的 `detail` 字段注入控制字符，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `detail contains control characters` 拒绝，避免发布证据在终端、工单或日志查看器中被控制字符污染显示。
- 安全回归还会把 `status.tsv` 的 `detail` 字段注入反引号，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `detail contains backticks` 拒绝，避免发布证据在 Markdown、工单或日志查看器中被伪造 code span 污染显示。
- `release-evidence` 生成侧会在写入 `status.tsv` 前对 `detail` 控制字符和反引号做规范化，把 tab、换行和 ESC 等不可见字符折叠为空格，并把反引号替换为普通引号；安全回归会用带 tab/ESC/反引号的缺失 provider-run 路径确认失败证据包仍可通过 `verify-release-evidence` 复核。
- 安全回归还会把 `status.tsv` 中 `git-metadata` 的 `log_file` 篡改为另一份存在的证据文件，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `git-metadata must reference manifest.txt` 拒绝，避免 step 状态引用错证据文件。
- 安全回归还会复制 `status.tsv` 的标准 step 行制造重复 slug，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `row only once` 拒绝，避免重复/非法 step 结构靠重算 checksum 混入发布证据。
- 强制 Audit workbench smoke 但缺少 `SOURCELENS_BASE_URL` 时，release evidence 必须记录 `audit-workbench-smoke` required failure，并且该失败证据包仍必须能通过 `verify-release-evidence` 复核。
- 安全回归还会在 `status.tsv` 追加未知 step slug，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `unknown step slug` 拒绝，确保发布证据 step allowlist 不会被伪扩展绕过。
- `scripts/security-regression-check.sh` 已新增顺序断言，锁住 release evidence 必须先校验 include 模式、再校验 env 文件边界、再创建证据目录，以及必须先写完 summary、再收紧文件权限、最后生成 checksum manifest，避免后续只保留关键字但打乱语义顺序。
- 认证响应边界已收口：注册和 `/api/auth/me` 返回 `UserResponse` 而不是 `User` 实体，响应中不暴露 `passwordHash`、`deleted` 等内部字段；`User.passwordHash` 同时加 `@JsonIgnore` 作为防御层。注册唯一键兜底已补齐：用户名/邮箱重复或逻辑删除记录仍占用唯一键时返回 `CONFLICT`，不再落到全局 500。
- `SensitiveDataSanitizer` 已补强 JSON/camelCase secret key、带空格的引号 secret 值、Basic/Token 授权头、JWT/privateKey 字段、裸 OpenAI key 和 URL userinfo 密码脱敏，并由 `SensitiveDataSanitizerTest` 与 `scripts/security-regression-check.sh` 锁住。
- 新增 `scripts/verify-all.sh` 与 `make verify`，本地按 CI 门禁顺序运行 Shell 脚本语法检查、`git diff --check` / `git diff --cached --check` 空白错误检查、后端测试、前端构建、Rust analyzer check、Rust analyzer 测试、LLM safety、安全回归检查和依赖回归检查；目录内命令通过 `run_in_dir` 函数切换目录后直接执行，避免把仓库路径插入 `bash -lc` 字符串。
- 新增 `scripts/phase12-baseline.sh`、`make phase12-baseline` 与 `docs/PHASE12_BASELINE.md`，用只读数据库基准采集阶段 12 触发证据，避免在没有规模瓶颈时过早引入 Neo4j、pgvector、Temporal 或 analyzer daemon。
- `scripts/phase12-baseline.sh` 已补齐输入硬化：支持 `SOURCELENS_PHASE12_BASELINE_ENV_FILE` 读取私有 env 文件，并在读取 DB 密码前独立校验真实 env 文件边界；阈值、端口、连接超时和 scan task id 必须为正整数，`DB_URL` 必须是 MySQL JDBC URL，MySQL CLI 带连接超时，递归调用链环检测使用带分隔符路径避免 symbol id 子串误判。脚本新增 `SOURCELENS_PHASE12_MYSQL_EXECUTOR=auto|host|docker`，宿主机没有 mysql CLI 时可自动使用 `sourcelens-mysql` 容器内 mysql client 做只读 baseline，且不通过 `docker exec -e KEY=value` 参数传入数据库密码。
- 新增 `.github/workflows/ci.yml`，PR 和 `main` push 自动运行安全回归检查、依赖回归检查、后端 `mvn clean test`、LLM safety regression、前端 `npm ci && npm run build`、Rust analyzer `cargo check --locked && cargo test --locked`、后端 Docker 镜像构建。
- CI 各 job 已配置 `timeout-minutes`，并由安全回归门禁逐个检查，避免发布验证在依赖下载、构建或 Docker 阶段无限挂起。
- CI workflow 顶层 `permissions` 只允许 `contents: read`，不允许 job-level `permissions` 提权；同 ref 并发取消，并在所有 checkout step 设置 `persist-credentials: false`；安全回归门禁会逐个 `actions/checkout` step 绑定校验 credential persistence 禁用项，并禁止 `pull_request_target` 与 `${{ secrets.* }}` 引用，阻止这些 token 暴露面收口项回退。
- CI workflow 的所有 GitHub Actions `uses:` 引用已固定到 40 位 commit SHA，保留原 tag 注释用于升级追踪；依赖回归和安全回归门禁会阻止退回 `@v4`、`@v2`、`@stable`、`@main` 等可移动引用，并禁止 `uses: docker://...` 这类 Docker image action 绕过 action SHA pinning；安全回归还会用临时 workflow 负例验证该拒绝路径。
- GitHub webhook delivery 审计页的 collation 500 已收口：`GitHubWebhookDeliveryService.listByProject` 改为先查 `github_webhook_delivery_projects.delivery_id`、再按 `IN` 查询 delivery，避免 correlated `EXISTS` 直接比较不同 collation 字段；`V027__normalize_github_webhook_delivery_collation.sql` 统一 `github_webhook_deliveries.delivery_id` 与 `github_webhook_delivery_projects.delivery_id` 为 `utf8mb4_unicode_ci`。验证：`mvn -q -Dtest=GitHubWebhookDeliveryServiceTest,GitHubWebhookDeliveryControllerTest test` 通过；本地 Docker MySQL 中 Flyway schema version 为 `027` 且两张表 `delivery_id` collation 均为 `utf8mb4_unicode_ci`；本地 8080 已重启为最新 jar，请求 `/api/projects/4/github-webhook-deliveries?page=1&pageSize=20` 返回 `SUCCESS`。
- 审计日志页错误体验已从全局 toast 轰炸改为源级健康状态：通用审计、Agent 工具调用和 GitHub Webhook 三个数据源分别维护 loading/error/ready 状态，失败时在源卡片和对应 tab 内展示可重试错误条，并保留上次成功数据；治理信号会把任一审计源不可用视为 `danger`，避免空数据时误判为健康。验证：`npm run build` 通过，`git diff --check` 通过；浏览器桌面宽度和 `390x844` 移动宽度均确认 3 个 `.sl-audit-source-card` 渲染、无全局错误 toast、无水平溢出。
- Rust analyzer 大 stdout 合同已收口：公开仓库 Pawnshop 真实 analyzer stdout 约 `10.97MB`，旧后端 `4MB` retention 会拼入截断标记导致 Jackson 在 line 101269 parse failed；`AnalyzerRunner` 已改为 `StreamCapture`、默认 `64MB` 可配置、stdout 超限明确失败且不污染 JSON，`AnalyzerRunnerTest`、`security-regression-check.sh`、`make verify` 和 Pawnshop live public repo smoke 均通过。后续性能路线不再是扩大内存上限，而是压缩 analyzer JSON 或改 streaming/file parse。
- 项目详情页新增 Analysis Readiness 面板，把最新扫描、核心产物、`reportQuality`、下一步动作、产物库、代码问答、依赖图谱和扫描详情入口汇聚到项目第一屏之后；同时清理无成功扫描、缺少概览产物或加载失败时的旧 overview/fileTree/reportQuality 状态，避免切换项目后显示过期分析数据。验证：`npm run build` 通过，`git diff --check` 通过；浏览器桌面宽度和 `390x844` 移动宽度均确认 `.sl-analysis-readiness` 存在、无错误 toast、无水平溢出。
- 扫描详情页新增 Code Knowledge readiness 面板，连接 `code_chunks/search` 的 `retrievalMode` 与 `evidenceProfile`，把“是否可问答、是否有切片、向量覆盖是否足够、下一步该查什么”前置到扫描报告页；code_chunks 缺失时显示危险态和 `检查 chunk_code` 行动。验证：`npm run build`、`mvn -DskipTests compile`、`mvn -DskipTests package` 通过；本地 8080 API 验证 scanTaskId `24` 返回 `retrievalMode=NO_CONTEXT`、`evidenceReadiness=GAP`；浏览器 smoke 用临时用户/项目/scanTaskId `41` 验证 `.sl-code-knowledge-panel-danger` 渲染、无全局错误 toast，临时数据已清理。
- 项目页 code_chunks 状态闭环已补齐：`ProjectDetail` 对最新成功扫描预加载 code_chunks 探针，顶部 `code_chunks` 阶段显示真实切片数和向量覆盖，Analysis Readiness 将 code_chunks 缺失纳入项目就绪度，QA 页在用户搜索前也显示切片总量、向量覆盖、召回模式和证据质量；`报告/Agent` 阶段改为由 Analysis Readiness 判定，不再只要扫描成功就显示 Ready。验证：`npm run build` 通过；浏览器 smoke 用临时 projectId `31` / scanTaskId `42` / 3 条 code_chunks 验证顶部显示 `code_chunks 3 / 向量 33%`、`报告/Agent Review`、QA 初始健康卡显示 `代码切片 3`、搜索 `login` 命中 2 条结果且无全局错误 toast；临时数据已清理。
- 运行产物库错误体验已补齐：`Artifacts` 不再用全局 toast 承载列表加载失败和智能预览失败，改为 `loadError` / `previewError` 页面内状态；列表失败时 Evidence Readiness 会进入 `danger`，并在有旧数据时明确“已保留上次成功数据”；预览失败只在 drawer 内展示可重试错误条。验证：`npm run build` 通过；浏览器 smoke 用临时 projectId `34` / 4 条核心 artifact 验证 `.sl-artifact-readiness-ready`、4 个表格行、无全局 toast；故意触发不存在文件预览时 drawer 内出现“智能预览加载失败”，全局 toast 仍为 0；临时用户、项目、artifact 和审计数据已清理。
- 扫描报告到 Agent 任务列表的证据源一致性已收口：`/api/projects/{projectId}/agent-tasks` 支持 `scanTaskId` 过滤，前端 `/agent-tasks?projectId=...&scanTaskId=...` 会真正只展示该扫描任务绑定的 Agent 任务；任务列表新增扫描列，详情面板可回跳扫描报告，创建任务时在扫描上下文内默认带入 `scanTaskId`。验证：`mvn -q -Dtest=AgentTaskServiceTest,AgentTaskControllerTest test`、`mvn -q -DskipTests package`、`npm run build`、`git diff --check` 均通过；本地 8080 runtime smoke 用临时项目和两个成功 scanTask 验证未过滤返回 2 个 Agent 任务，`scanTaskId=<target>` 只返回目标扫描任务的 1 个任务，临时数据已清理。
- 备份/回滚 artifact backup id 匹配已收紧：`backup_artifact_path_for_kind` 和 `backup_artifact_any_found` 在 `scripts/backup-restore-preflight.sh`、`scripts/rollback-preflight.sh`、`scripts/release-evidence.sh` 中统一使用 `"$backup_id[-_.]*"`，不再用 `*$backup_id*` 子串匹配；`scripts/security-regression-check.sh` 已禁止退回宽匹配。验证：`bash -n` 覆盖 4 个脚本；临时备份目录负向验证只有 `backup10-*` 时 `backup_id=backup1` 在 backup/rollback preflight 中均报告未找到匹配 artifact；正向验证 `<backup_id>-database/workspace/artifacts/checksums` 识别 4 类 artifact，3 个 checksum 均比对通过。
- 新增可执行备份恢复演练入口：`scripts/backup-restore-drill.sh` 与 `make backup-restore-drill` 会读取 `SOURCELENS_BACKUP_DRILL_BACKUP_ID`，校验 database/workspace/artifacts/checksums 四类 artifact 与 checksum manifest，把数据库 dump 恢复到 Docker MySQL scratch database，把 workspace/artifacts tarball 解压到私有临时目录，并写出 backup preflight / release evidence 可复核的 `restore_drill_status=pass` 证据。脚本拒绝 `CREATE DATABASE`、`DROP DATABASE`、`USE` 和 mysql client escape，拒绝 tar 绝对路径、`..`、反斜杠和控制字符路径，并在成功或失败时清理 scratch database。验证：正向临时备份恢复得到 `database_tables=1`、`workspace_entries=2`、`artifact_entries=2`，scratch database 无残留；负向 `USE sourcelens` dump 被拒绝；负向 `backup_id=backup1` 不匹配 `backup10-*`；`backup-restore-preflight.sh` 能识别 drill 生成的 evidence backup id。
- 关键指标：
  - `sourcelens.execution.tasks`：按 `task_type`、`status` 统计任务状态流转。
  - `sourcelens.execution.steps`：按 `step_key`、`status` 统计步骤终态。
  - `sourcelens.agent.tool.calls`：按 `tool`、`permission`、`outcome` 统计工具调用结果。
  - `sourcelens.agent.tool.duration`：按 `tool`、`permission`、`outcome` 记录工具调用耗时。
  - `sourcelens.sandbox.commands`：按 `executor`、`outcome` 统计沙箱命令结果。
  - `sourcelens.sandbox.command.duration`：按 `executor`、`outcome` 记录沙箱命令耗时。

仍需收口：

- 最新 `make worktree-inventory` 已生成当前大规模 worktree 清单；清单工具已把 LLM safety 测试、Agent tool call migration、scanstat 模块测试、`V029__add_code_chunk_embedding_model.sql` 和 `AnalyzerRunnerTest.java` 归入对应模块，并支持通过 `make worktree-inventory GROUP=<分组名或 slug>` 输出单个分组，后续仍需按构建产物、运维/CI、安全、任务、分析、Agent、前端、沙箱、GitHub App 等边界分组审查或提交。
- 本机真实 Docker/MySQL/Redis 环境已完成阶段性验收：Docker backend 在 `http://localhost:8081` 通过 smoke，`prod-preflight` 为 0 failure / 1 warning，`sandbox-drill` 严格通过，`make verify` 通过；唯一剩余 warning 是 GitHub App readiness 按高级集成层暂缓。
- 已用公开仓库 `LJunP/Pawnshop-Management-System.git` 完成真实扫描链路，scanTaskId `28` 成功，产出 15727 symbols、440 relations、7 artifacts；`code_chunks=0` 根因已定位为扫描流水线未触发 `CodeChunkService.chunkAndSave`，本轮已新增 `chunk_code` 执行步骤并补回归测试。
- 重建 Docker backend 后重新扫描同一公开仓库，scanTaskId `29` 成功，commit `3eaf38582997afa5acff8990f48ce9c5f200e3ea`，产出 15727 symbols、440 relations、7 artifacts、17001 chunks；执行步骤 `prepare_repository`、`analyze_code`、`chunk_code`、`finalize_scan` 均为 SUCCESS。embedding 为 0 是因为本地没有激活 LLM 配置，符合当前验收预期。
- Phase12 baseline 已支持 Docker MySQL 容器执行；用 scanTaskId `29` 生成真实基线：15727 symbols、440 relations、16167 graph records，调用链查询 118ms，max execution attempts 为 1，verdict 为 phase 12 trigger is not proven，继续当前 MySQL/artifact/simple-queue 架构并做生产化收口。
- GitHub App 仓库端到端演练、`make github-app-drill` 和 `make github-webhook-drill` 仍缺真实 GitHub App ID、installation id、private key 和 webhook secret；当前只能做缺配置 required failure / skip / 本地签名路径验证。
- GitHub App 不是当前公开仓库逆向分析主线的阻塞项；仅当进入私有仓库、webhook 增量扫描、自动 PR 或企业安装阶段时，再升级为必须完成的端到端验收。
- 已生成正式 release evidence：`release-evidence/public-scan-29-cleanup-20260626145817`，并通过 `scripts/verify-release-evidence.sh` 复核；证据包包含 `make verify`、prod/backup/rollback preflight、smoke、Phase12 baseline 和 sandbox drill，0 required failure、0 optional warning、5 skipped；prod-preflight 内部结果为 0 failure / 1 warning，cleanup 四项均已启用。
- 真实发布前用真实备份运行 `make backup-restore-drill` 生成标准恢复演练 evidence，补充真实回滚计划和回滚演练后，再运行 `make release-evidence` 保存下一轮证据目录。
- 后续进入阶段 12 前仍需在更大真实或准真实规模项目上重复运行 `make phase12-baseline`，把输出作为阶段 12 ADR 的前置证据。
- 公开仓库 retained sample 的 UI smoke 已进入治理证据升级：`PUBLIC_REPO_UI_SMOKE_OK.governanceTimeline.patchEvidence` 必须证明 scan-bound `PATCH_READY` AutoRepair、`CHANGE_PATCH` artifact、`AUTO_REPAIR_PATCH_READY SUCCESS` audit、`AUTO_REPAIR` repair execution 和 `generate_patch` step 全链路绑定，并且 foreign patch evidence hidden。下一步公开仓库主线应继续把报告体验、code_chunks 检索质量和 Agent 辅助理解证据纳入同一 live smoke/release verifier 体系，而不是只依赖 mock UI smoke。
- 公开仓库 retained sample 的 UI smoke 已新增 `codeKnowledge` readiness：release OK 需要证明真实 code_chunks search 响应具备 `totalChunks > 0`、`resultCount > 0`、当前 scan only、可用 retrieval mode、`READY/REVIEW` evidenceProfile、source label/file path/evidence type/file stats 可见。该方向后续应继续收口到报告解释质量、跨文件检索质量和 Agent 辅助理解，而不是新增后端 API 或要求本地一定具备 embedding。
- 公开仓库 retained sample 的 UI smoke 已新增 `codeKnowledge.crossFileEvidence`：release OK 需要证明 broad code_chunks search 覆盖 `uniqueFiles >= 2`、`fileStatsUniqueFiles >= 2`、`resultCount >= 2`、`currentScanOnly=true`、`sourceLabelsVisible=true`。同时 `CodeChunkController` 已为 search items 补稳定 `citationId/sourceLabel`，让 code_chunks search 本身可直接作为报告证据和 Agent 上下文。后续跨文件路线应继续评估按文件分组采样、调用链证据和报告段落引用质量，但不在本轮新增 API。
- Project QA 已新增 `citationCoverage` 量化引用覆盖率：`CodeQaResponse` 会在所有路径返回 `totalEvidenceCount/citedEvidenceCount/uncitedCandidateCount/repairCandidateCount/coveragePercent/status`，ProjectDetail 显示“引用覆盖”和“可修复证据”，public repo smoke、public repo UI smoke 与 report evidence drawer smoke marker 均被 verifier 强校验。
- `sourceEvidenceRef` provenance attribution 已补齐：`CodeQaResponse` 回显清洗后的报告证据引用并给出 `sourceEvidenceMatched/sourceEvidenceMatchType`，Project QA 生成 AutoRepair 候选时会把原始报告证据字段写入 provenance，AutoRepair candidate receipt 展示“报告证据 / 报告来源 / 报告位置”，public repo UI 和 report evidence drawer marker 均要求 `evidenceRef.responseBound=true`。下一步应继续把该链路接入更高层报告叙事和 Agent 修复建议质量评估，而不是扩大 provenance 存储面。
- AgentChat code-understanding binding 已进入 release evidence schema v3：manifest 新增 `include_agent_chat_closure_rail_ui_smoke`，`verify-release-evidence` 强消费 `AGENT_CHAT_CLOSURE_RAIL_SMOKE_OK.codeUnderstandingHandoff.agentTaskBinding`，`release-verifier-agent-chat-marker` 会伪造缺 marker、重复 marker、缺 handoff/binding、scan/task mismatch、raw prompt 泄露、auto-send/auto-start、provider/LLM claim 并重新计算 checksum，确认 verifier 仍 fail closed。下一步 Agent 方向应继续做用户可理解的检索排序、报告引用体验和手动确认后的行动链路，不得把 PENDING binding 解释为自动执行或 LLM 事实正确。
- AgentChat code-understanding handoff 已补 `manualSend` release-verifiable proof：UI 显示 `代码理解手动发送闭环`，smoke 证明点击前不发送、点击 `发送` 后才对绑定 conversation 发起 SSE POST，verifier/security matrix 拒绝 manual-send 伪造。该能力仍是手动确认入口，不代表 AgentTask 自动 start、工具调用、AutoRepair/PR 或真实 LLM 质量。
- P9 AgentTasks 已补三视口详情可读性和 task-level raw payload safety：`AGENT_TASKS_DETAIL_SELECTION_SMOKE_OK` 覆盖 `1440x900/390x844/320x740`、layout/readability guards、table scroller containment 和 `payloadSafety.scope=TASK_RAW_INPUT_OUTPUT_ONLY`。后续若继续推进任务流水线安全，应单独治理共享 `TaskTimeline.step.outputJson`，不要把本轮 task-level proof 解释为全链路 raw payload 授权体系。
- P9 TaskTimeline step output raw payload safety 已进入独立切片：共享 `TaskTimeline` 不再渲染 `item.output` raw JSON，而是展示 `步骤输出安全边界`；AgentTasks smoke 注入 step-level raw output 哨兵并把 `payloadSafety.scope` 升级为 `TASK_AND_TIMELINE_STEP_RAW_OUTPUT_ONLY`。该切片只声明普通 timeline UI 默认隐藏 task/step raw payload，不声明 AuditLogs、Artifacts、LogViewer、artifact preview 或授权 raw 查看体系已完成。
- P9 LogViewer display redaction safety 已进入独立切片：共享 `LogViewer` 在渲染前对 Authorization/Bearer/token/apiKey/secret/password/sk/JWT 做 display redaction，ExecutionTasks 与 PATCH_READY smoke 均注入 raw log secret 哨兵并输出 `logSafety.scope=LOG_VIEWER_DISPLAY_REDACTION_ONLY`。该切片只声明普通日志 UI 显示层脱敏，不替代后端 `SensitiveDataSanitizer`，不声明 artifact preview、AuditLogs raw JSON、CI raw log snippet 或完整 raw 查看授权体系已完成。
- P9 AuditLogs raw JSON display redaction safety 已进入独立切片：`AuditLogs` 的 `Sanitized Input`、`Arguments`、`Result` 三类 JSON block 展开后只渲染 `.sl-audit-json-redacted`，表格 `resultJson` compact preview 同样使用 `formatRedactedJson`；AuditLogs smoke 注入 Bearer、Authorization、apiKey、password、quoted secret、JWT、privateKey 哨兵并输出 `auditJsonSafety.scope=AUDIT_LOGS_RAW_JSON_DISPLAY_REDACTION_ONLY`。该切片只声明 AuditLogs 前端显示层脱敏，不新增 raw 查看权限，不改变审计存储/查询合同，不声明 Artifacts preview、CI raw log snippet 或完整 raw 查看授权体系完成。
- P9 Artifacts preview display redaction safety 已进入独立切片：`ArtifactPreviewRenderer` 在保留智能预览结构化解析的同时，对 smart preview、raw JSON details、text fallback 和 malformed JSON fallback 做前端显示层脱敏；Artifacts smoke 注入 Bearer、Authorization、apiKey、password、quoted secret、JWT、privateKey 哨兵并输出 `artifactPreviewSafety.scope=ARTIFACTS_PREVIEW_DISPLAY_REDACTION_ONLY`。该切片只声明运行产物普通预览显示层脱敏，不改变后端 preview/download/storage 合同，不声明 CI raw log snippet、后端历史产物清洗或完整 raw 查看授权体系完成。
- P9 CI Diagnostics raw log display redaction safety 已进入独立切片：`CiDiagnostics` 详情日志不再直出 `selected.rawLogSnippet`，而是渲染 `selectedRedactedRawLogSnippet`，并暴露 `.sl-ci-log-redacted` 与 `aria-label="脱敏 CI 日志片段"`；CI Diagnostics smoke 注入 Bearer、Authorization、apiKey、password、quoted secret、JWT、privateKey 哨兵并输出 `ciLogSafety.scope=CI_DIAGNOSTICS_RAW_LOG_DISPLAY_REDACTION_ONLY`。该切片只声明 CI Diagnostics 普通 UI 日志片段显示层脱敏，不改变后端 API/DB/entity/schema、历史数据或 `SensitiveDataSanitizer`，不声明 raw log 授权查看体系完成。
## 2026-07-04 P11 focused increment：Artifacts raw download release evidence marker gate

状态：完成 focused hardening，未刷新 full release authority。

本轮交付：

- `verify-release-evidence.sh` 增加 `ARTIFACTS_DETAIL_SELECTION_SMOKE_OK` 与 `AUDIT_LOGS_ARTIFACT_RAW_DOWNLOAD_DEEP_LINK_SMOKE_OK` optional-present strict verifier。
- `security-regression-check.sh` 增加 `release-verifier-artifacts-marker` suite。
- CI security matrix 与 Makefile 暴露该 suite。
- static gate 锁定 verifier、security regression、CI 和 Makefile 引用。

验收：

- PASS：`bash -n scripts/verify-release-evidence.sh scripts/security-regression-check.sh`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-artifacts-marker`。
- PASS：`SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static`。

下一步：

- 继续 P11 release evidence 证据吸收，优先把当前 P9/P10 focused mock smoke 中已经稳定的安全 marker 分批纳入 optional-present verifier。
- 下一次 full release refresh 前，明确列出哪些 focused marker 已进入 release verifier，哪些仍只由 frontend validator/smoke 管控。

## 2026-07-04 P6/P11 focused increment：Public repo report evidence QA citation quality

状态：完成 focused evidence hardening，未刷新 full release authority。

本轮交付：

- `public-repo-analysis-smoke.sh` 新增真实 report evidence -> Project QA 多锚点引用质量 marker：`PUBLIC_REPO_SMOKE_OK.reportEvidenceQaCitationQuality`。
- marker 从 `ARCHITECTURE_REPORT.apiRoutes` 解析 `handler_class/handler_method/line_number`，再用同 scan code_chunks 绑定 file/line。
- marker 要求至少两个真实 QA 样本，并证明 `REPORT_LINE_ANCHOR`、当前 scan only、`VERIFIED`、引用强制成功、必需证据覆盖 100%、claim citation `READY`、role distribution `PRIMARY_BOUND`。
- `verify-release-evidence.sh` 对 marker 做 optional-present strict validation。
- `security-regression-check.sh --suite release-verifier-public-repo-marker` 新增有效 marker 接受和 forged marker 拒绝矩阵。

验收：

- PASS：`bash -n scripts/public-repo-analysis-smoke.sh scripts/verify-release-evidence.sh scripts/security-regression-check.sh`。
- PASS：public repo smoke Python heredoc compile。
- PASS：`git diff --check -- scripts/public-repo-analysis-smoke.sh scripts/verify-release-evidence.sh scripts/security-regression-check.sh`。
- PASS：`./scripts/security-regression-check.sh --suite release-verifier-public-repo-marker`。

下一步：

- 在真实 public repo retained sample 上刷新该 marker，确认 Pawnshop 这类真实项目能稳定产出至少两个 API route line-anchor QA 样本。
- 继续 P6：按文件分组采样、调用链证据、报告 narrative 引用质量和 Agent 辅助理解体验。
- 继续 P11：把已经稳定的 focused marker 分批纳入 release verifier optional-present hardening，但不扩大标准 release step 列表。

## 2026-07-04 P6/P11 live evidence：Report evidence QA citation retained sample

状态：真实 public repo retained sample 已验证，未刷新 full release authority。

本轮证据：

- `SOURCELENS_PUBLIC_REPO_SMOKE_REPORT_EVIDENCE_QA_CITATION=true SOURCELENS_PUBLIC_REPO_SMOKE_UI=false SOURCELENS_PUBLIC_REPO_SMOKE_CLEANUP=false ./scripts/public-repo-analysis-smoke.sh` PASS。
- retained sample：projectId `339`、repositoryId `300`、scanTaskId `256`、commit `3eaf38582997afa5acff8990f48ce9c5f200e3ea`。
- `reportEvidenceQaCitationQuality.status=OK`，`sampleCount=2`，`surface=PUBLIC_REPO_REPORT_EVIDENCE_QA_MULTI_ANCHOR`。
- `sourceEvidenceMatchTypes=["REPORT_LINE_ANCHOR"]`，`groundingStatuses=["VERIFIED"]`，`citationEnforcementStatuses=["RETRY_VERIFIED"]`。
- required evidence coverage `100%`，claim citation `READY`，role distribution `PRIMARY_BOUND`。

后续路线：

- P6 下一步优先从“有 line anchor”推进到“报告叙事质量”：按文件分组采样、跨文件引用覆盖、调用链证据和用户可读解释质量。
- P11 下一步把该 focused live marker 放入下一次完整 release evidence package，而不是单独声明新的 full authority。
- P9 若继续 UI 顶级化，调用专家池 `雷军 / Product Design and UX Research Advisor` 做报告页和 QA 页面信息架构复核。

组织路线：

- 团队制度固定为 `11 + 5`：11 个固定核心角色负责常规研发闭环，5 个专家池按需介入专项评审。
- 不扩成 16 个常驻物理子 agent；所有物理子 agent 必须一一映射到固定角色或专家角色，并在日志记录 runtime nickname。

## 2026-07-04 P6/P11 focused increment：Cross-file file distribution sampler

状态：完成 focused evidence hardening 和真实 retained sample，未刷新 full release authority。

本轮交付：

- `crossFileRetrievalProof` 从“多文件数量证明”增强为“按文件分组采样证明”。
- 新 marker 字段：`fileDistribution`、`fileDistributionSampleCount`。
- release verifier 对新字段做 historical-compatible optional-present strict validation，避免破坏历史 evidence，同时保证新 evidence 出现时 fail closed。
- security regression forged matrix 覆盖 file distribution 缺失、数量、路径、证据类型、sourceLabel 和行号范围篡改。

真实证据：

- public repo smoke PASS：scanTaskId `257`。
- `fileDistributionSampleCount=4`。
- 样本覆盖 SQL、`pom-war.xml`、`pom.xml`、`README.md`。
- 同一 smoke 继续保留 `reportEvidenceQaCitationQuality.status=OK` 和 2 个 API route `REPORT_LINE_ANCHOR` QA 样本。

后续路线：

- P6 下一步进入 report narrative citation sampler：优先不同 file / source section 的引用样本，避免继续只验证同文件 API route。
- P11 下一步把稳定 focused markers 纳入下一次完整 release evidence package。
- 不改 API/schema/ranker，除非 sampler 证明现有数据结构无法表达必要质量证据。

## 2026-07-04 P6/P11 focused increment：Report evidence QA source diversity sampler

状态：完成 focused evidence hardening 和真实 retained sample，未刷新 full release authority。

本轮交付：

- `reportEvidenceQaCitationQuality` 从“固定前两个 API route 样本”升级为 source diversity sampler。
- 新策略：`DIVERSE_FILE_THEN_REPORT_ORDER`。
- 新字段：`targetSampleCount`、`candidateCount`、`uniqueFileCount`、`sourceSectionCount`、`diversityStatus`、`diversityFallbackUsed`。
- release verifier 强校验字段与 `samples` 一致。
- security regression forged matrix 覆盖 strategy、candidate、unique file、source section、diversity status 和 fallback 篡改。

真实证据：

- public repo smoke PASS：scanTaskId `259`。
- `candidateCount=36`、`sampleCount=4`、`uniqueFileCount=4`、`diversityStatus=MULTI_FILE`、`diversityFallbackUsed=false`。
- 4 个 QA 样本分别绑定不同 Controller 文件，并继续满足 `REPORT_LINE_ANCHOR`、`VERIFIED`、`RETRY_VERIFIED`、required evidence coverage `100%`、claim citation `READY`、role distribution `PRIMARY_BOUND`。

后续路线：

- 短期不继续增加 `narrativeQualityScore` 或 LLM/provider 质量字段。
- 下一步优先 P11：把该 focused marker 吸收到下一次完整 release evidence package。
- 或进入 P9：报告/QA 页面信息密度、可读性、source diversity 可视化和大厂级 UI 体验。

## 2026-07-04 P6 focused increment：Raw Code QA cross-file citation summary

状态：完成 focused evidence hardening 和真实 public repo smoke，未刷新 full release authority。

本轮交付：

- raw `PUBLIC_REPO_SMOKE_OK.codeQa` 新增 `crossFileCitationSummary`。
- summary 只从 `citationCoverage`、`claimCitationCoverage` 和 claim role distribution 派生，不归档 raw prompt、raw answer、URL、stack、source content 或 claim text。
- summary 新增 answer-level coverage 语义：`coverageStatus`、`fullCitationCoverageSatisfied`、`primaryCoverageSatisfied`，避免 PARTIAL answer coverage 被误读为 ready。
- release verifier 对该字段做 historical-compatible optional-present strict validation。
- security regression forged matrix 覆盖 summary 非对象、未知字段、raw/URL 字段、cross-file/citation/claim binding 伪造、父级计数不一致、PARTIAL coverage ready overclaim、coverage status/full coverage/primary coverage 伪造、scan-only/scope/tone/status 漂移。

真实证据：

- focused public repo smoke PASS：projectId `353`、repositoryId `314`、scanTaskId `268`。
- `codeQa.crossFileCitationSummary.statuses=["PRIMARY_CROSS_FILE"]`。
- `crossFileEvidenceSatisfied=true`、`citationBindingSatisfied=true`、`claimBindingSatisfied=true`。
- `tones=["warning"]`、`coverageStatus=PARTIAL`、`fullCitationCoverageSatisfied=false`、`primaryCoverageSatisfied=false`。
- `evidenceFileCount=4`、`primaryEvidenceFileCount=4`、`citedPrimaryEvidenceFileCount=1`。

后续路线：

- P6/P9 下一步：不强行统一 raw/UI JSON schema，优先做 ProjectDetail 前端统一可读 view model；或继续 report citation source diversity 与 source-location readability 的 full authority absorption。
- P9 下一步：把 cross-file/citation/claim binding 摘要做成报告/QA 页面可读信息，而不是只停留在 release marker。
- P11 下一步：下一次完整 release evidence refresh 吸收该 focused marker。
