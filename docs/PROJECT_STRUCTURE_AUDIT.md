# SourceLens Project Structure Audit

> AIOS v2.3 状态：`SUPPORTING HISTORICAL STRUCTURE AUDIT`。目录事实可复用；旧团队、Phase、authority 与清理建议必须经过 `aios/MIGRATION_LEDGER.yaml` 和 P0 Gate 后执行。

状态：2026-07-04历史结构审计；后续事实不得通过持续改写本文维护。

## 1. 审计结论

SourceLens 当前主线结构成立：`analyzer-rust` 负责代码扫描与逆向分析，`backend-spring` 负责业务 API、任务、分析、Agent、审计和 AutoRepair，`web-console` 负责产品界面，`scripts` 和 `release-evidence` 负责门禁与发布证据。

本轮结论为 `PARTIAL / STRUCTURE CLEANUP COMPLETE`：

- 代码主线目录保留。
- 可证明安全的生成物和空目录已清理。
- README 已从早期 V0.x 入口更新为当前 P6/P9/P10/P11/P12-pre 主线入口。
- `DATABASE_DESIGN.md` 已修正 Flyway 迁移范围到 V001-V030。
- `PROJECT_PLAN.md` 已标注为长期愿景和历史总纲，避免与当前 P12 baseline 技术取舍冲突。
- `.gitignore` 和 `.dockerignore` 已补充 `web-console/test-results/`。
- `.sourcelens-runtime`、`release-evidence`、`web-console/node_modules`、`bin`、`deploy/.env` 未删除，等待保留策略确认。
- 二次只读复核确认：`.sourcelens-runtime/backend` 内旧 runtime jar 可按“保留最新 N 个”策略清理；`release-evidence` 必须先分类归档，不直接删除。
- 已新增 `scripts/clean-local-generated.sh` 和 `make clean-local-generated`，作为后续本地生成物清理唯一入口。
- 已新增 `scripts/generate-project-code-map.mjs`、`make code-map` 和 `make code-map-check`，生成 `docs/PROJECT_CODE_MAP.md`，作为简洁目录/文件用途和接口入口索引；`make verify` 已接入 freshness 检查，日常按 `PRODUCT_GOVERNANCE.md` 的实时/阶段/周期维护分级执行。
- 已新增 `scripts/release-evidence-inventory.mjs`、`make release-evidence-inventory` 和 `make release-evidence-retention-dry-run`，作为 `release-evidence/` 只读分类与人工归档候选计划入口；该入口不移动、不删除，所有条目 `delete_allowed=false`。

## 2. 顶层目录说明

| 路径 | 当前用途 | 状态 | 清理策略 |
| --- | --- | --- | --- |
| `CHAIRMAN_BRIEFING.md` | 董事长 / 项目 Owner 高层控制台，汇总当前阶段、公司制度、红线和投入顺序 | 入库 | 保留；公司制度、阶段重点或董事长红线变化时更新 |
| `CONTRIBUTING.md` | 开发者 / 新 Codex / 子 agent 贡献入口，定义接任务、验证、文档同步和交付规则 | 入库 | 保留；贡献流程或交付规则变化时更新 |
| `SECURITY.md` | 根目录安全报告入口 | 入库 | 保留；安全报告流程或风险类型变化时更新 |
| `CHANGELOG.md` | 版本级变更记录 | 入库 | 保留；阶段级或发布级变更后更新 |
| `ROADMAP.md` | 根目录产品路线入口 | 入库 | 保留；阶段路线或后置层变化时更新 |
| `SUPPORT.md` | 支持和排障入口 | 入库 | 保留；排障入口变化时更新 |
| `LICENSE` | 当前授权边界 | 入库 | 保留；Owner 明确授权策略后更新 |
| `CODE_OF_CONDUCT.md` | 协作行为边界 | 入库 | 保留；协作规则变化时更新 |
| `.github/` | GitHub Actions CI、CODEOWNERS、Issue/PR 模板，覆盖安全回归、依赖检查、release evidence CI profile、后端、前端、Rust、Docker build | 保留 | 入库 |
| `.idea/` | JetBrains 本地 IDE 配置 | 本地 | 不入库，可按个人需要保留 |
| `.vscode/` | VS Code 本地配置 | 本地 | 不入库，可按个人需要保留 |
| `.sourcelens-runtime/` | 本地 jar runtime、backend runtime evidence/log、临时运行态数据 | 本地运行态 | 不入库；确认无后端进程依赖后才能清 |
| `analyzer-rust/` | Rust analyzer CLI | 核心源码 | 入库，`target/` 不入库 |
| `backend-spring/` | Spring Boot 后端 | 核心源码 | 入库，`target/` / `target 2/` 不入库 |
| `bin/` | `make analyzer` 生成的 `sourcelens-analyzer` 二进制 | 本地生成物 | 不入库，可再生成 |
| `deploy/` | Docker Compose 与 env 模板 | 环境入口 | `.env.example` 入库，`.env` 不入库 |
| `docs/` | 产品、架构、阶段、安全、运维、进度、agent 制度与交接 | 权威文档层 | 入库 |
| `release-evidence/` | 发布/聚焦验收证据包 | 本地证据 | 不入库；先运行 `make release-evidence-inventory`，再人工归档 |
| `scripts/` | smoke、preflight、release evidence、security regression、worktree inventory、LLM safety 等 | 工程门禁 | 入库 |
| `web-console/` | React/Vite 前端、Playwright smoke 和 UI 门禁 | 核心源码 | 入库；`node_modules`、`dist`、`test-results` 不入库 |

本轮删除的空目录：

- `agent-runtime/`
- `backend-spring/src/main/java/com/sourcelens/auth/`
- `backend-spring/src/main/java/com/sourcelens/common/controller/`
- `backend-spring/src/main/java/com/sourcelens/config/`
- `backend-spring/src/main/java/com/sourcelens/dto/`
- `backend-spring/src/main/java/com/sourcelens/entity/`
- `backend-spring/src/main/java/com/sourcelens/mapper/`
- `backend-spring/src/main/java/com/sourcelens/module/system/`
- `backend-spring/src/main/java/com/sourcelens/project/`
- `backend-spring/src/main/java/com/sourcelens/repository/`
- `backend-spring/src/main/java/com/sourcelens/scan/`

这些目录为空且未被 Git 跟踪。保留它们不会形成真实资产，只会制造结构噪音。

## 3. 后端结构

`backend-spring/src/main/java/com/sourcelens` 是后端主目录：

| 子路径 | 作用 |
| --- | --- |
| `SourceLensApplication.java` | Spring Boot 启动入口 |
| `common/` | 跨模块配置、异常、响应、公共基础设施 |
| `module/agent/` | Agent task、Agent chat、tool call audit、Code QA、LLM adapter |
| `module/analysis/` | analyzer runner、code_chunks、架构风险、报告构建、代码定位与排序 |
| `module/artifact/` | scan/report/patch 等 artifact 的记录、下载与审计边界 |
| `module/audit/` | audit logs、审计工作台、安全治理记录 |
| `module/autorepair/` | AutoRepair candidate、patch、PR gate、repair execution |
| `module/ci/` | CI diagnostic 能力 |
| `module/dashboard/` | 控制台统计和下一步建议 |
| `module/execution/` | execution tasks、attempts、steps、logs |
| `module/github/` | GitHub App / webhook / installation 集成边界 |
| `module/issue/` | Issue decomposition |
| `module/modelconfig/` | LLM provider / mock provider 配置 |
| `module/pr/` | PR review |
| `module/repository/` | Git clone、仓库元数据、访问方式 |
| `module/sandbox/` | Docker/local sandbox executor 与命令校验 |
| `module/scantask/` | scan task、governance timeline、scan-bound aggregation |
| `module/workspace/` | 工作区/文件边界相关能力 |

`backend-spring/src/main/resources`：

| 子路径 | 作用 |
| --- | --- |
| `application.yml` | dev/prod 配置入口，敏感值通过 env 注入 |
| `db/migration/` | Flyway 迁移，当前 V001-V030 |
| mapper XML 或资源文件 | MyBatis 映射和运行资源 |

`backend-spring/src/test`：

- 后端单元/切片测试覆盖 controller、service、sandbox、Code QA、AutoRepair、audit、analysis、governance timeline。
- `target/` 是 Maven 产物，不入库。

## 4. Rust Analyzer 结构

`analyzer-rust` 是可独立构建的 CLI：

| 文件 | 作用 |
| --- | --- |
| `src/main.rs` | CLI 入口，读取扫描参数并输出分析结果 |
| `src/scanner.rs` | 文件树、语言统计、扫描过程 |
| `src/framework.rs` | 框架识别、质量信号 |
| `src/reverse.rs` | 符号和关系抽取 |
| `src/ast_extractor.rs` | AST/Tree-sitter 相关抽取 |
| `src/models.rs` | analyzer 输入输出 schema |
| `tests/scan_contract.rs` | scan contract 回归测试 |

`analyzer-rust/target/` 是 Cargo 产物，本轮已清理。

## 5. 前端结构

`web-console/src`：

| 子路径 | 作用 |
| --- | --- |
| `api/` | 后端 API client，按业务模块拆分 |
| `components/` | AppLayout、ProjectSelector、Artifact preview、Diff/Log viewer、共享任务时间线 |
| `components/ui/` | 项目级共享 UI 原语，承接大厂级 UI 收口 |
| `contexts/` | Auth、Chat 等全局上下文 |
| `pages/` | 页面层：Dashboard、Projects、ScanTaskDetail、ProjectDetail、Agent、Audit、AutoRepair、CI、PR、Issue 等 |
| `styles/app.css` | 当前核心样式层 |
| `utils/` | 显示脱敏等工具 |

`web-console/tests` 与多份 `playwright.*.config.ts` 是当前 UI smoke 门禁，不属于临时垃圾。

必须保留：

- `web-console/package-lock.json`
- `web-console/vite.config.ts`
- `web-console/vite.config.js`
- `web-console/vite.config.d.ts`
- `web-console/playwright.*.config.ts`
- `web-console/tests/`

其中 `vite.config.js` / `vite.config.d.ts` 看起来像生成物，但当前阶段需求和验证脚本要求它们与 `vite.config.ts` 保持同步，因此暂不删除。

## 6. Scripts 结构

| 脚本类别 | 代表文件 | 作用 |
| --- | --- | --- |
| 本地启动 | `run-backend-dev.sh`、`run-backend-jar-dev.sh` | 复用健康后端、启动 jar runtime |
| 全量验证 | `verify-all.sh` | 本地综合门禁 |
| release evidence | `release-evidence.sh`、`verify-release-evidence.sh` | 生成/复核证据包 |
| release evidence inventory | `release-evidence-inventory.mjs` | 只读盘点证据包，输出 current/full/focused/historical/failed/unknown 分类建议和人工归档 dry-run |
| 安全回归 | `security-regression-check.sh`、`dependency-regression-check.sh` | 防伪造、依赖、安全矩阵 |
| 公开仓库主链路 | `public-repo-analysis-smoke.sh` | clone/scan/report/code_chunks/QA/live marker |
| AutoRepair/Artifact/Audit | `autorepair-patch-smoke.sh`、`artifact-quality-check.sh`、`audit-workbench-smoke.sh` | 关键闭环 smoke |
| 生产化预检 | `production-preflight.sh`、`backup-restore-preflight.sh`、`rollback-preflight.sh` | P12-pre 运维边界 |
| drill | `sandbox-drill.sh`、`github-app-drill.sh`、`github-webhook-drill.sh`、`backup-restore-drill.sh` | 环境级演练 |
| LLM safety | `llm-safety-regression.sh`、`run-llm-provider-eval.mjs`、`validate-llm-provider-run.mjs` | prompt injection 和 provider 质量评估 |
| 工作区卫生 | `worktree-inventory.sh` | 生成物/未分类变更分组 |
| 代码地图 | `generate-project-code-map.mjs` | 生成 `PROJECT_CODE_MAP.md`，覆盖目录/文件用途、后端 REST route、前端 route、前端 API client 简洁索引 |

## 7. Docs 对齐状态

| 文档 | 状态 | 本轮处理 |
| --- | --- | --- |
| `CHAIRMAN_BRIEFING.md` | 当前有效 | 根目录董事长入口，避免 Owner 每次钻进 `docs/` 制度细节 |
| `CONTRIBUTING.md` | 当前有效 | 根目录贡献入口，给新开发者、新 Codex 和子 agent 使用 |
| `SECURITY.md` | 当前有效 | 根目录安全报告入口 |
| `CHANGELOG.md` | 当前有效 | 版本级变更记录 |
| `ROADMAP.md` | 当前有效 | 根目录产品路线入口 |
| `SUPPORT.md` | 当前有效 | 支持和排障入口 |
| `LICENSE` | 当前有效 | 当前 All rights reserved 授权边界 |
| `CODE_OF_CONDUCT.md` | 当前有效 | 协作行为边界 |
| `README.md` | 早期 V0.x 入口，已落后 | 已重写为当前 P 阶段入口 |
| `PROJECT_CODE_MAP.md` | 缺失 | 已新增，由 `scripts/generate-project-code-map.mjs` 生成并接入 `make verify` |
| `PROJECT_STRUCTURE_AUDIT.md` | 缺失 | 已新增 |
| `PRODUCT_GOVERNANCE.md` | 当前有效 | 已加入结构审计文档职责 |
| `SOURCELENS_OPERATING_SYSTEM.md` | 当前有效 | 虚拟公司操作系统总入口，串联团队、风险、质量、发布、数据和事故治理 |
| `WORK_INTAKE_AND_BACKLOG.md` | 当前有效 | 需求入口、优先级、排队、延期和拒绝规则 |
| `ENGINEERING_STANDARDS.md` | 当前有效 | 代码、review、脚本、前后端实现标准 |
| `TEST_STRATEGY.md` | 当前有效 | 测试分层、必跑测试、失败处理和记录模板 |
| `RISK_REGISTER.md` | 当前有效 | 高价值风险、owner、缓解方案和关闭条件 |
| `QUALITY_SCORECARD.md` | 当前有效 | 阶段质量维度、质量状态和下一质量目标 |
| `PRODUCT_METRICS_AND_FEEDBACK.md` | 当前有效 | 产品指标、用户反馈、主链路成功率和复盘问题 |
| `RELEASE_PROCESS.md` | 当前有效 | 发布类型、放行条件、证据包、回滚和 evidence 保留策略 |
| `DISASTER_RECOVERY_AND_ROLLBACK_SIGNOFF.md` | 当前有效 | 灾备恢复、回滚演练和生产化签署清单 |
| `OBSERVABILITY_AND_INCIDENTS.md` | 当前有效 | 可观测性目标、事故等级和复盘模板 |
| `DATA_GOVERNANCE.md` | 当前有效 | repo、artifact、code_chunks、audit、secrets 等数据生命周期 |
| `COMPLIANCE_AND_PRIVACY.md` | 当前有效 | 隐私、权限、企业化、多用户和私有仓库合规边界 |
| `RAW_ACCESS_AND_EVIDENCE_RETENTION_POLICY.md` | 当前有效 | raw payload/artifact 访问、审计、release evidence 保留和删除红线 |
| `THREAT_MODEL.md` | 当前有效 | 资产、攻击面、滥用场景和缓解关系 |
| `DEPENDENCY_AND_LICENSE_POLICY.md` | 当前有效 | Maven/npm/Cargo/Docker 依赖、license 和供应链风险 |
| `FRONTEND_DESIGN_SYSTEM.md` | 当前有效 | P9 大厂级 UI、可读性、响应式和共享原语标准 |
| `PERFORMANCE_BENCHMARK.md` | 当前有效 | scan、report、code_chunks、前端、DB 和 evidence 性能基线 |
| `DATABASE_DESIGN.md` | 概览迁移范围落后 | 已修正 V001-V030 |
| `PROJECT_PLAN.md` | 长期愿景和历史路线，含部分未来技术候选 | 已标注当前执行以 P 阶段/治理文档为准 |
| `PHASE_REQUIREMENTS.md` | 当前阶段需求索引 | 保留 |
| `REFACTOR_ROADMAP.md` | 当前重构路线和历史进展 | 保留 |
| `AGENT_STATUS_BOARD.md` | 当前团队和阶段入口 | 本轮后续记录当前审计工作 |
| `AGENT_ACTIVITY_LOG.md` | agent 活动日志 | 本轮后续追加库克审计映射 |
| `PRODUCT_PROGRESS_LOG.md` | 量化开发日志 | 本轮后续追加结构审计记录 |
| `CODEX_HANDOFF.md` | 长期上下文恢复入口 | 保留；需要在重要状态变化后继续追加 |
| `OPERATIONS_RUNBOOK.md` | 运维和 release evidence 权威 | 保留 |
| `SECURITY_BOUNDARY.md` | 安全红线 | 保留 |
| `WORKTREE_HYGIENE.md` | 工作区卫生策略 | 保留；本轮清理符合其方向 |
| `DEMO_SCRIPT.md` | 早期 10 分钟演示，缺当前报告/QA/AutoRepair/审计亮点 | 待后续专项更新 |
| `DAILY_GROWTH_PLAN_2026*.md` | 更偏个人成长计划，不是项目操作文档 | 建议后续确认是否移入 `docs/personal/` 或 `docs/archive/` |

## 8. 本轮清理记录

已清理的生成物：

- `analyzer-rust/target/`
- `backend-spring/target/`
- `backend-spring/target 2/`
- `web-console/dist/`
- `web-console/test-results/`
- `web-console/test-results 2/`
- `web-console/tsconfig.tsbuildinfo`
- `web-console/tsconfig.node.tsbuildinfo`

注意：`backend-spring/target/` 在 `make backend`、IDE 自动编译或当前 8080 Java 后端运行期间可能立即重新生成。它仍是忽略的生成物，但不要在依赖该目录的本地后端运行中强删；应先确认进程状态，再执行清理。

已清理的空目录见第 2 节。

保留但不入库：

- `web-console/node_modules/`
- `.sourcelens-runtime/`
- `release-evidence/`
- `bin/`
- `deploy/.env`
- `.idea/`
- `.vscode/`

首轮清理后仓库根占用约 `2.0G`。主要占用来自 `.sourcelens-runtime` 约 `1.7G`、`web-console/node_modules` 约 `247M`、`release-evidence` 约 `27M`。若本地后端正在运行，`backend-spring/target/` 可能以约数 MB 体量重新出现。上述目录不能在未确认策略时直接删除。

二次清理结果：

- 子 agent 只读复核：`Franklin the 2nd / 019f2cf0-0827-7b91-ae48-6d7333b6e01a = 库克 / Project Manager + Documentation Auditor`，结论 `PARTIAL`，无阻塞。
- 本地 8080 后端为 Maven dev runtime，命令行使用 `backend-spring/target/classes`，未使用 `.sourcelens-runtime/backend/*` 旧 jar。
- `make clean-local-generated` 保留最新 runtime jar `.sourcelens-runtime/backend/source-lens-backend.QPwq4r`，删除 30 个旧 runtime jar。
- `backend-spring/target` 因当前后端进程使用 `target/classes` 已自动跳过。
- 清理后仓库根占用约 `355M`；`.sourcelens-runtime` 降到约 `55M`；`release-evidence` 约 `27M`；`web-console/node_modules` 约 `245M`。

## 9. 待确认清单

| 项 | 风险 | 建议 |
| --- | --- | --- |
| `.sourcelens-runtime/` | 可能被当前后端 jar runtime 使用 | 已增加 `make clean-local-generated`；默认保留最新 1 个 runtime jar，并跳过正在使用的后端 `target/classes` |
| `release-evidence/` | 里面有 current authority、focused samples、历史包和失败诊断包 | 已增加 `make release-evidence-inventory` 和 `make release-evidence-retention-dry-run`；当前基线为 `current-full=1`、`retained-focused=41`、`historical-superseded=22`、`failed-or-interrupted=22`、`unknown-review=0`；dry-run 动作为 `KEEP_CURRENT_AUTHORITY=1`、`KEEP_RETAINED_FOCUSED=41`、`ARCHIVE_CANDIDATE_MANUAL_ONLY=22`、`DIAGNOSE_BEFORE_ARCHIVE=22`、`CLASSIFY_BEFORE_ACTION=0`；`20260703-181321` 已按 legacy local focused evidence 保留；禁止自动删除 |
| `bin/` | 本地 analyzer 二进制，可再生成 | 如需极简工作区可删；开发时保留能减少启动成本 |
| `DAILY_GROWTH_PLAN_2026*.md` | 与项目工程文档混杂 | 建议移到 `docs/personal/` 或 `docs/archive/`，但需用户确认 |
| `DEMO_SCRIPT.md` | 演示内容落后 | 后续 P9/P11 做演示脚本升级 |
| `API_DESIGN.md` | 当前接口增长很快，可能仍不完整 | 后续由 `比尔盖茨 / Backend Engineer` 做 API doc 对齐专项 |

## 10. 后续标准流程

每轮涉及目录、生成物、文档体系或清理策略变化时，按以下顺序执行：

1. 先运行结构扫描和 `git status --short --ignored`。
2. 只删除已忽略、可再生成、无运行依赖的生成物。
3. 对 `.env`、runtime、release evidence、node_modules、IDE 配置只记录，不直接删除。
4. 更新本文和 `README.md`。
5. 在 `PRODUCT_PROGRESS_LOG.md` 和 `AGENT_ACTIVITY_LOG.md` 记录本轮清理范围、保留项和风险。

## 11. 本地生成物清理命令

默认先 dry-run：

```bash
SOURCELENS_CLEAN_DRY_RUN=1 make clean-local-generated
```

确认后执行：

```bash
make clean-local-generated
```

可配置项：

| 变量 | 默认 | 作用 |
| --- | --- | --- |
| `SOURCELENS_CLEAN_DRY_RUN` | `0` | `1` 时只打印将删除的文件，不实际删除 |
| `SOURCELENS_RUNTIME_KEEP` | `1` | 保留最近 N 个 `.sourcelens-runtime/backend/source-lens-backend.*` runtime jar |

该脚本允许删除：

- `.sourcelens-runtime/backend` 中未被进程打开、超过保留数量的旧 runtime jar。
- `analyzer-rust/target`。
- `web-console/dist`、`web-console/test-results`、`web-console/playwright-report`。
- `web-console/tsconfig*.tsbuildinfo`。
- 未被本地 Java dev backend 使用的 `backend-spring/target`。

该脚本不会删除：

- `release-evidence/`。
- `web-console/node_modules/`。
- `deploy/.env`。
- `.idea/` / `.vscode/`。
- 当前 Java 进程命令行正在引用的 `backend-spring/target/classes`。
