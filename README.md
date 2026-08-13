# SourceLens AIOS

SourceLens AIOS 是一个以软件工程为首个验证环境的可信自主智能体基础设施研究平台。它研究如何让 Agent 在真实复杂环境中可靠地理解、规划、执行、独立验证并保留可回滚证据。

第一年只建设一个产品闭环：输入不可变的仓库版本和真实、边界明确的 Issue，输出经过独立验证、可追踪、可回滚的 Patch Evidence Package，交由人类批准。


## 界面预览

![工程智能首页](1.png)
![继承产品界面与运行状态](2.png)
![扫描画像、语言分布与历史记录](3.png)

当前阶段是 `P0 Strategic Foundation`。正常功能开发已冻结，正在完成事实源、迁移台账、评估基线和可审查源码基线。当前权威状态只读 `docs/aios/truth/project_state.yaml`；旧 P6/P9/P10/P11/P12-pre 路线为历史记录。

现有 Rust analyzer、Java AST/关系图、code chunks、检索引用、执行/审计、沙箱和 release evidence 都是待复用或加固的继承资产，不等于新路线已经完成。任何能力声明必须区分 `DEFINED`、`IMPLEMENTED`、`TESTED`、`GATE_PASSED` 和 `PRODUCTION_PROVEN`。

## 董事长入口

如果你是项目 Owner / 董事长，先看根目录 [CHAIRMAN_BRIEFING.md](CHAIRMAN_BRIEFING.md)。

它是 Founder 高层控制台：当前阶段、保留的事实、P0 门禁、红线和下一次需要人工批准的决策。

## 贡献入口

如果你是新开发者、新 Codex 或子 agent，先看根目录 [CONTRIBUTING.md](CONTRIBUTING.md)。

它定义接任务、改代码、跑验证、同步文档、使用子 agent 和交付结果的硬规则。

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 后端 | Java 17 / Spring Boot 3.3 / MyBatis-Plus / Flyway |
| 分析器 | Rust / Cargo / Tree-sitter 相关解析 |
| 前端 | React 18 / TypeScript / Vite / Ant Design / Playwright |
| 数据 | MySQL 8.4 / Redis 7（当前继承实现；未来选型由实验和迁移 ADR 决定） |
| 工程治理 | Makefile / Bash / Node smoke / release evidence / GitHub Actions |
| 部署基础 | Docker Compose / 后端 Dockerfile |

## 本地启动

1. 启动基础设施：

```bash
make up-infra
```

如需首次配置，可复制并检查本地 env：

```bash
cp deploy/.env.example deploy/.env
```

`deploy/.env` 是本机密钥文件，不提交。默认 MySQL 使用 `localhost:3307`，Redis 使用 `localhost:6379`。

2. 构建 analyzer：

```bash
make analyzer
```

这会生成本地 `bin/sourcelens-analyzer`。`bin/` 属于生成物，不提交。

3. 启动后端：

```bash
make backend
```

`make backend` 会复用已健康运行的 `http://localhost:8080` 后端，避免重复启动导致端口冲突。需要临时端口时使用：

```bash
SERVER_PORT=19081 make backend
```

稳定 jar runtime 可使用：

```bash
SERVER_PORT=19081 make backend-jar
```

4. 启动前端：

```bash
make frontend
```

前端默认运行在 `http://localhost:5173`，Vite API proxy 指向后端。

## 常用验证

```bash
make verify
make code-map-check
node scripts/validate-frontend-ui.mjs
npm --prefix web-console run build
SOURCELENS_BASE_URL=http://localhost:8080 make public-repo-smoke
make release-evidence-ci
```

常用专项入口：

| 命令 | 用途 |
| --- | --- |
| `make code-map` | 生成 `docs/PROJECT_CODE_MAP.md` 简洁代码地图，覆盖目录/文件用途、接口入口和 API client 索引 |
| `make code-map-check` | 检查简洁代码地图是否与当前工作区同步；通常用于阶段验收、交接或结构/API 入口变化后 |
| `make aios-governance-check` | 校验 AIOS YAML、权威入口、迁移决策和旧治理文档降级状态 |
| `make frontend-ui-check` | 前端静态 UI 合同 |
| `make app-shell-ui-smoke` | App shell 顶栏/页面布局 smoke |
| `make report-evidence-drawer-ui-smoke` | 报告证据抽屉 UI smoke |
| `make project-qa-recoverable-ui-smoke` | Project QA recoverable 状态 smoke |
| `make security-regression-check` | 安全回归矩阵 |
| `make llm-safety-check` | LLM safety evals 与 mock provider smoke |
| `make release-evidence-inventory` | 只读盘点 `release-evidence/`，输出分类建议，不移动不删除 |
| `make release-evidence-retention-dry-run` | 只读生成 release evidence 人工归档候选计划，不移动不删除 |
| `make release-evidence-release` | 发布级证据包 |
| `make verify-release-evidence DIR=release-evidence/<run-id>` | 复核证据包完整性 |

## 项目结构

| 路径 | 作用 | 入库策略 |
| --- | --- | --- |
| `.github/` | GitHub Actions CI、CODEOWNERS、Issue/PR 模板 | 入库 |
| `CHAIRMAN_BRIEFING.md` | 董事长 / 项目 Owner 高层控制台 | 入库 |
| `CONTRIBUTING.md` | 开发者 / 新 Codex / 子 agent 贡献入口 | 入库 |
| `SECURITY.md` | 根目录安全报告入口 | 入库 |
| `CHANGELOG.md` | 版本级变更记录 | 入库 |
| `ROADMAP.md` | 根目录产品路线入口 | 入库 |
| `SUPPORT.md` | 支持和排障入口 | 入库 |
| `LICENSE` | 当前授权边界；默认 All rights reserved | 入库 |
| `CODE_OF_CONDUCT.md` | 协作行为边界 | 入库 |
| `.idea/` / `.vscode/` | 本地 IDE 配置 | 不入库 |
| `.sourcelens-runtime/` | 本地后端 jar runtime、临时 evidence/log 等运行数据 | 不入库；确认进程不依赖后才能清 |
| `analyzer-rust/` | Rust CLI analyzer，负责文件扫描、框架识别、AST/符号关系与报告输入 | 入库；`target/` 不入库 |
| `backend-spring/` | Spring Boot API、任务、扫描、分析、Agent、审计、AutoRepair、GitHub/Webhook、sandbox 主后端 | 入库；`target/` 不入库 |
| `bin/` | 本地 analyzer 二进制生成物 | 不入库，可由 `make analyzer` 再生成 |
| `deploy/` | Docker Compose 与 env 模板 | `.env.example` 入库；`.env` 不入库 |
| `docs/` | 产品、阶段、安全、运维、架构、数据库、团队制度和交接文档 | 入库 |
| `release-evidence/` | 本地发布/聚焦验收证据包 | 不入库；按保留策略清理 |
| `scripts/` | smoke、preflight、release evidence、security regression、worktree inventory 等脚本 | 入库 |
| `web-console/` | React/Vite 前端、共享 UI、页面、API client、Playwright smoke | 入库；`node_modules/`、`dist/`、`test-results/` 不入库 |

更细的目录解释、清理记录和文档对齐状态见 `docs/PROJECT_STRUCTURE_AUDIT.md`。

## 权威文档

当前控制面按领域分权，不允许事实文件覆盖战略，也不允许历史日志覆盖当前事实：

| 领域 | 文档 | 用途 |
| --- | --- | --- |
| 战略 | `docs/aios/STRATEGIC_CONSTITUTION.md` | 冻结使命、ICP、第一年目标、Non-goals 和 P0-P12 路线 |
| 当前事实 | `docs/aios/truth/project_state.yaml` | 当前 Phase 状态、能力证据、风险和任务 |
| 执行 | `docs/aios/MASTER_EXECUTION_PROTOCOL.md` | Founder/Master/治理角色/临时 Worker 的权限与工作流 |
| 评估 | `docs/aios/EVALUATION_PROTOCOL.md` | TaskSpec、Baseline Suite、Trace、Evaluator 和研究产物 |
| 迁移 | `docs/aios/MIGRATION_LEDGER.yaml` | KEEP/REFACTOR/QUARANTINE/FREEZE/BUILD_NEW/CANDIDATE_ARCHIVE |
| 决策原因 | `docs/AGENT_DECISION_REGISTER.md` | append-only ADR，不保存当前事实 |

`ROADMAP.md`、`CHAIRMAN_BRIEFING.md` 和 `docs/SOURCELENS_OPERATING_SYSTEM.md` 是上述权威的阅读入口。安全、测试、运维、代码地图和 release 文档继续作为专项支撑材料。

`docs/AGENT_STATUS_BOARD.md`、`docs/CODEX_HANDOFF.md`、`docs/PRODUCT_PROGRESS_LOG.md`、旧产品定位和旧 P 阶段文档只保留历史证据；发生冲突时不能覆盖 `docs/aios/`。

## 清理策略

推荐入口：

```bash
SOURCELENS_CLEAN_DRY_RUN=1 make clean-local-generated
make clean-local-generated
```

`clean-local-generated` 会清理可再生成的本地产物，并默认只保留最新 1 个 `.sourcelens-runtime/backend/source-lens-backend.*` runtime jar。需要多保留几个 jar 时可用：

```bash
SOURCELENS_RUNTIME_KEEP=3 make clean-local-generated
```

可以安全重新生成的目录或文件：

```text
analyzer-rust/target/
backend-spring/target/
**/target 2/
web-console/dist/
web-console/test-results/
web-console/tsconfig*.tsbuildinfo
bin/
```

不能随意删除的本地目录：

```text
web-console/node_modules/
.sourcelens-runtime/
release-evidence/
deploy/.env
```

`node_modules` 是本地依赖缓存；`.sourcelens-runtime` 可能被当前后端进程使用；`release-evidence` 是验收追溯材料；`deploy/.env` 含本机凭据。

`release-evidence/` 的清理必须先运行只读盘点：

```bash
make release-evidence-inventory
make release-evidence-retention-dry-run
node scripts/release-evidence-inventory.mjs --json
```

这些命令沿用继承工具的 `current-full`、`KEEP_CURRENT_AUTHORITY` 等分类标签；这里的 authority 只表示“应保留的本地平台 regression 包”，不是 AIOS 事实、Patch 正确性或生产权威。所有条目的 `delete_allowed` 固定为 `false`。归档或删除必须经过迁移依赖分析、回归证据和 Founder 批准，不能由自动脚本直接执行。

## GitHub App 边界

GitHub App、webhook、私有仓库、远端 PR 和企业权限在第一年冻结。继承代码保留，但不能继续扩展，也不能阻塞 P0-P6 的本地、可复现、可验证研究闭环。
