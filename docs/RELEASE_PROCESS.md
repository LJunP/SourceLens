# SourceLens Release Process

> AIOS v2.3 状态：`SUPPORTING PLATFORM RELEASE PROCESS`。本文只治理平台 regression/release evidence，不定义 AIOS 当前 Phase，也不替代 task-specific Patch Evidence Package。当前包和限制见 `aios/truth/project_state.yaml`。

状态：长期执行。本文定义 SourceLens 发布、阶段验收和 evidence 放行流程。

## 1. 发布类型

| 类型 | 使用场景 | 要求 |
| --- | --- | --- |
| Focused evidence | 单个功能或风险切片验收 | 只证明当前切片，不声明 full authority |
| Local release authority | 本地完整主链路和 release profile 验收 | 必须通过 verifier，记录 skipped/optional 风险 |
| Stage close | P 阶段收口 | 必须同步需求、风险、质量评分、handoff |
| Production candidate | 未来生产部署候选 | 必须补真实环境、备份恢复、回滚签署和安全复核 |

## 2. 发布前检查

发布或阶段收口前必须确认：

- `git status --short` 已区分本轮改动、历史改动和本地生成物。
- `PHASE_REQUIREMENTS.md` 对应 Must 项有完成证据。
- `RISK_REGISTER.md` 没有未 owner 的 P0/P1 风险。
- `QUALITY_SCORECARD.md` 已更新本阶段质量状态。
- API/DB/security/ops 文档与实际代码或脚本一致。
- 必要脚本、测试、smoke 或 release evidence 已运行。
- `CODEX_HANDOFF.md` 包含新的接手信息。

## 3. 推荐命令

按风险选择，不要求每个小改动都全跑。

```bash
make code-map-check
make api-design-check
make frontend-ui-check
make verify
make security-regression-check
make release-evidence-release
make verify-release-evidence DIR=release-evidence/<run-id>
```

说明：`make verify` 是日常本地门禁，内置 static 安全回归；`make security-regression-check` 是完整安全负例套件，适合发布安全收口或安全相关大改后单独执行。

针对 public repo release marker 可运行 focused gate：

```bash
SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-public-repo-marker
```

说明：该 suite 当前证明 public repo marker verifier 的伪造拒绝和正常收尾；耗时约 4 分钟，不要求每个小改动都运行。

## 4. 放行规则

| 状态 | 放行判断 |
| --- | --- |
| PASS | 必跑 gate 通过，P0/P1 风险已关闭或有接受理由，可以放行 |
| PARTIAL | focused slice 可合入，但不能声明阶段完成或 full authority |
| BLOCKED | P0、未 owner P1、核心 gate 失败或证据不可复现，不得放行 |

## 5. 回滚与降级

任何发布记录必须写清：

- 当前 authority evidence 包。
- 被 supersede 的历史包。
- 不能再作为 authority 的失败包或过期包。
- 回滚目标版本或回滚策略。
- 回滚后需要重新验证的命令。

## 6. Evidence 保留策略

- `release-evidence/` 不入库。
- 当前 full authority 必须保留。
- focused evidence 可保留为阶段证据，但不得冒充 full authority。
- 删除或归档前必须先运行只读 inventory / dry-run。
- 失败包、中断包、过期 schema 包必须标记为 historical、diagnose 或 archive candidate，不能作为发布依据。

## 7. 当前 full release authority

| Run ID | 类型 | 证明范围 | 状态 |
| --- | --- | --- | --- |
| `release-current-schema-20260705-0610` | Local release authority | 完整 `release` profile：`make verify`、prod/backup/rollback preflight、smoke、真实 public repo smoke、真实 public repo UI、file-bound repair、AutoRepair patch、PATCH_READY UI、Dashboard next action UI、report evidence drawer、scan governance timeline、AgentChat audit/tool audit、audit workbench、phase12 baseline、Docker sandbox drill；同时吸收 P6 code_chunks hot path 修复与当前 release verifier schema。 | PASS；`required_failures=0`、`optional_warnings=0`、`skipped=5`；`make verify-release-evidence DIR=release-evidence/release-current-schema-20260705-0610` PASS |

边界：

- `backup-restore-drill-evidence`、`rollback-plan`、`github-app-drill`、`github-webhook-drill`、`llm-provider-run` 仍为 SKIP。
- `release-evidence/release-current-schema-20260704-1618` 已被 supersede，只保留为 historical full package。
- `release-evidence/release-current-schema-20260705-0509` 是失败诊断包，不得作为 authority。
- 日常 `make verify` 运行 static security suite；完整安全负例大套件使用 `make security-regression-check` 显式执行。

## 8. 当前 focused evidence 记录

| Run ID | 类型 | 证明范围 | 状态 |
| --- | --- | --- | --- |
| `p6-public-repo-code-qa-20260707-000013` | Focused evidence | `public-repo-smoke` 被 release evidence 包装层执行并归档；真实公开仓库 `Pawnshop-Management-System` 扫描 `projectId=374`、`repositoryId=335`、`scanTaskId=285`，验证 code_chunks、Code QA、weak keyword semantic fallback、claim citation noise boundary、semantic probe、artifact quality、DB counts 和 `reportEvidenceQaCitationQuality`；同时证明 weak keyword case 级 `scanTaskId` 与 retrieved chunk scan 绑定。 | PASS；`required_failures=0`、`optional_warnings=0`；`./scripts/verify-release-evidence.sh release-evidence/p6-public-repo-code-qa-20260707-000013` PASS；`release-verifier-public-repo-marker` focused security regression 已恢复 PASS；不是 full release authority |
| `report-deep-evidence-readability-20260705-050224` | Focused evidence | `report-evidence-drawer-ui-smoke` 被 release evidence 包装层执行并归档；`verify-release-evidence.sh` 复核 `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK.qaFromEvidence.deepEvidenceCardReadability` 和 `evidenceLineRangePriority`，证明来源凭证、来源定位可信度、来源文件匹配说明在 390/320 窄屏可读、可换行、无横向溢出，并保持 provider/LLM fact claim false。 | PASS；当前 focused evidence；不是 full release authority |
| `report-review-gate-20260705-011417` | Focused evidence | `report-evidence-drawer-ui-smoke` 被 release evidence 包装层执行并归档；`verify-release-evidence.sh` 复核 `REPORT_EVIDENCE_DRAWER_SMOKE_OK.reviewGate`，证明报告复核门禁存在 6 个检查项，顺序为报告可信度、证据包、代码知识库、修复入口、审计追踪、治理时间线，并覆盖 390/320 移动视口、文本不裁切和 no-horizontal-overflow。 | PASS；当前 focused evidence；不是 full release authority |
| `report-action-board-20260705-005841` | Focused evidence | `report-evidence-drawer-ui-smoke` 被 release evidence 包装层执行并归档；`verify-release-evidence.sh` 复核 `REPORT_EVIDENCE_DRAWER_SMOKE_OK.actionBoard`，证明报告总览存在 6 个后续行动入口，顺序为风险复核、代码问答、Agent 复核、审计追踪、依赖复核、修复候选，并覆盖 390/320 移动视口和 no-horizontal-overflow。 | PASS；当前 focused evidence；不是 full release authority |
| `report-main-path-guide-20260705-003844` | Focused evidence | `report-evidence-drawer-ui-smoke` 被 release evidence 包装层执行并归档；`verify-release-evidence.sh` 复核 `REPORT_EVIDENCE_DRAWER_SMOKE_OK.mainPathGuide`，证明报告总览存在 3 步主链路导览，顺序为推荐动作、引用质量、证据优先级，并覆盖 390/320 移动视口和 no-horizontal-overflow。 | PASS；当前 focused evidence；不是 full release authority |
| `report-citation-source-order-20260705-002223` | Focused evidence | `report-evidence-drawer-ui-smoke` 被 release evidence 包装层执行并归档；`verify-release-evidence.sh` 复核 `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK.reportCitationQuality`，证明 source coverage 按报告阅读顺序 `overview -> modules -> apiRoutes/dbEntities -> scanFingerprint -> codeQuality.risks` 展示，并同步校验中文标签顺序、detail disclosure、verdict rail、No-overclaim 边界、provider/LLM claim false。 | PASS；当前 focused evidence；不是 full release authority |
| `report-citation-detail-disclosure-20260705-000918` | Focused evidence | `report-evidence-drawer-ui-smoke` 被 release evidence 包装层执行并归档；`verify-release-evidence.sh` 复核 `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK.reportCitationQuality`，证明 citation quality 详情默认收起、可展开，source coverage、source labels、verdict rail、No-overclaim 边界、provider/LLM claim false。 | PASS；当前 focused evidence；不是 full release authority |
| `report-citation-source-labels-20260704-235459` | Focused evidence | `report-evidence-drawer-ui-smoke` 被 release evidence 包装层执行并归档；`verify-release-evidence.sh` 复核 `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK.reportCitationQuality`，证明 source section 原始值和中文语义标签同时可见、source coverage、verdict rail、No-overclaim 边界、provider/LLM claim false。 | PASS；当前 focused evidence；不是 full release authority |
| `report-citation-source-coverage-20260704-234304` | Focused evidence | `report-evidence-drawer-ui-smoke` 被 release evidence 包装层执行并归档；`verify-release-evidence.sh` 复核 `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK.reportCitationQuality`，证明 6/6 citation quality、source coverage 可见、5 个来源 section、6/6 narrative binding、verdict rail、No-overclaim 边界、no-horizontal-overflow、provider/LLM claim false。 | PASS；当前 focused evidence；不是 full release authority |
| `report-citation-quality-verdict-ui-marker-20260704-233030` | Focused evidence | `report-evidence-drawer-ui-smoke` 被 release evidence 包装层执行并归档；`verify-release-evidence.sh` 复核 `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK.reportCitationQuality`，证明 6/6 citation quality、source diversity、6/6 narrative binding、verdict rail 可见、4 个裁决信号、No-overclaim 边界、no-horizontal-overflow、provider/LLM claim false。 | PASS；当前 focused evidence；不是 full release authority |
| `report-citation-quality-ui-marker-20260704-230940` | Focused evidence | `report-evidence-drawer-ui-smoke` 被 release evidence 包装层执行并归档；`verify-release-evidence.sh` 复核 `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK.reportCitationQuality`，证明 6/6 citation quality、source diversity、6/6 narrative binding、boundary、no-overclaim、no-horizontal-overflow、provider/LLM claim false。 | PASS；不是 full release authority |
