.PHONY: help deps up up-infra down restart logs logs-backend clean clean-local-generated code-map code-map-check aios-governance-check preserve-worktree-snapshot verify-worktree-snapshot dev backend backend-jar frontend analyzer verify script-check api-design-check frontend-ui-check code-relation-quality code-relation-quality-p6 agent-chat-audit-ui-smoke agent-chat-closure-rail-ui-smoke agent-chat-first-viewport-ui-smoke agent-chat-tool-audit-smoke patch-ready-ui-smoke public-repo-ui-smoke dashboard-next-action-ui-smoke report-evidence-drawer-ui-smoke report-evidence-qa-citation-ui-smoke project-qa-low-confidence-ui-smoke project-qa-recoverable-ui-smoke project-qa-autorepair-candidate-ui-smoke scan-governance-timeline-ui-smoke app-shell-ui-smoke project-detail-first-viewport-ui-smoke scan-task-detail-first-viewport-ui-smoke agent-tasks-detail-selection-ui-smoke execution-tasks-detail-selection-ui-smoke artifacts-detail-selection-ui-smoke p9-main-path-recoverable-error-states-batch3-ui-smoke p9-main-path-recoverable-error-states-batch4a-ui-smoke p9-main-path-recoverable-error-states-batch4b-ui-smoke model-config-recoverable-ui-smoke audit-logs-detail-selection-ui-smoke ci-diagnostics-detail-selection-ui-smoke pr-reviews-detail-selection-ui-smoke issue-decomposition-detail-selection-ui-smoke report-autorepair-candidate-ui-smoke artifact-quality-self-test dependency-check llm-safety-check llm-provider-eval llm-provider-eval-mock-smoke worktree-inventory prod-preflight backup-preflight backup-restore-drill rollback-preflight sandbox-drill mysql-flyway-smoke github-app-drill github-webhook-drill release-evidence release-evidence-inventory release-evidence-retention-dry-run release-evidence-ci release-evidence-release release-evidence-nightly verify-release-evidence smoke public-repo-smoke p6-retrieval-quality-matrix file-bound-repair-smoke autorepair-patch-smoke audit-workbench-smoke artifact-quality-check phase12-baseline demo
.PHONY: security-regression-check security-regression-static security-regression-llm-provider security-regression-release-evidence-profile security-regression-release-verifier-forgery security-regression-release-verifier-public-repo-marker security-regression-release-verifier-public-repo-ui-marker security-regression-release-verifier-autorepair-ui-marker security-regression-release-verifier-dashboard-ui-marker security-regression-release-verifier-report-evidence-marker security-regression-release-verifier-scan-governance-marker security-regression-release-verifier-agent-chat-marker security-regression-release-verifier-artifacts-marker security-regression-release-verifier-integrity security-regression-integration-drill
.PHONY: release-evidence-inventory-self-test

help: ## 显示帮助
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

deps: ## 启动 MySQL + Redis
	cd deploy && docker compose up -d mysql redis
	@echo "等待 MySQL 就绪..."
	@sleep 5
	@echo "MySQL + Redis 已启动"

up: ## 启动所有服务 (Docker 全量: MySQL + Redis + Backend)
	cd deploy && docker compose up -d

up-infra: ## 仅启动基础设施 (MySQL + Redis)
	cd deploy && docker compose up -d mysql redis

down: ## 停止所有 Docker 容器
	cd deploy && docker compose down

restart: down up ## 重启所有 Docker 容器

logs: ## 查看所有 Docker 服务日志
	cd deploy && docker compose logs -f

logs-backend: ## 查看后端 Docker 日志
	cd deploy && docker compose logs -f backend

dev: ## 开发模式: 启动 MySQL/Redis (Docker) + 本地后端热重载
	@echo "=== SourceLens 开发环境 ==="
	cd deploy && docker compose up -d mysql redis
	@echo ""
	@echo "基础设施已启动 (MySQL:3307, Redis:6379)"
	@echo ""
	@echo "请在另外两个终端分别执行:"
	@echo "  终端 A: make backend"
	@echo "  终端 B: make frontend"
	@echo ""
	@echo "后端改代码自动热重载,无需重启"
	@echo "=========================="

backend: ## 本地启动后端 (dev profile, 自动读取 deploy/.env)
	./scripts/run-backend-dev.sh

backend-jar: ## 本地启动已打包后端 jar 的稳定副本，适合 release evidence，避免 Maven clean 破坏 target jar
	./scripts/run-backend-jar-dev.sh

frontend: ## 启动前端开发服务器
	cd web-console && npm run dev
analyzer: ## 构建 Rust 分析器并同步至 bin 目录
	cd analyzer-rust && cargo build --release
	mkdir -p bin
	cp analyzer-rust/target/release/sourcelens-analyzer bin/

verify: ## 运行日常本地验证（含 static 安全门禁；全量安全套件请用 make security-regression-check）
	./scripts/verify-all.sh

clean-local-generated: ## 清理本地可再生成产物，保留最新 runtime jar 并跳过正在使用的后端 target
	./scripts/clean-local-generated.sh

code-map: ## 生成 docs/PROJECT_CODE_MAP.md 全量代码地图
	node scripts/generate-project-code-map.mjs

code-map-check: ## 检查 docs/PROJECT_CODE_MAP.md 是否与当前工作区同步
	node scripts/generate-project-code-map.mjs --check

aios-governance-check: ## 校验 AIOS 权威、YAML、迁移决策和旧文档降级状态
	./scripts/validate-aios-governance.sh

preserve-worktree-snapshot: ## 在仓库外保存当前 tracked patch、untracked 副本和 SHA-256 清单
	node scripts/preserve-worktree-snapshot.mjs

verify-worktree-snapshot: ## 验证 SNAPSHOT=<外部快照目录> 的 hash 和 disposable restore
	@test -n "$(SNAPSHOT)" || (echo "SNAPSHOT is required" >&2; exit 1)
	node scripts/preserve-worktree-snapshot.mjs --verify "$(SNAPSHOT)"

script-check: ## 检查所有 Shell 脚本语法
	@for script in scripts/*.sh; do bash -n "$$script"; done

api-design-check: ## 检查 Spring controller 路由与 Request DTO 字段是否已同步到 docs/API_DESIGN.md
	node scripts/validate-api-design.mjs

frontend-ui-check: ## 检查前端关键 UI 可读性与布局防回归
	node scripts/validate-frontend-ui.mjs

code-relation-quality: ## 输出指定或最新 scanTaskId 的代码关系质量统计 marker
	./scripts/code-relation-quality-report.sh

code-relation-quality-p6: ## P6 focused gate: 最新或指定 scanTaskId 必须有 CALLS 且 target method match 达到最低阈值
	SOURCELENS_RELATION_QUALITY_MIN_CALLS="$${SOURCELENS_RELATION_QUALITY_MIN_CALLS:-1}" \
	SOURCELENS_RELATION_QUALITY_MIN_TARGET_METHOD_MATCH_PERCENT="$${SOURCELENS_RELATION_QUALITY_MIN_TARGET_METHOD_MATCH_PERCENT:-56}" \
	./scripts/code-relation-quality-report.sh

agent-chat-audit-ui-smoke: ## 运行 AgentChat 工具证据到审计台深链 smoke（全 API mock）
	cd web-console && npm run smoke:agent-chat-audit

agent-chat-closure-rail-ui-smoke: ## 运行 AgentChat 闭环行动栏 smoke（全 API mock，不触发真实后端/LLM）
	cd web-console && npm run smoke:agent-chat-closure-rail

agent-chat-first-viewport-ui-smoke: ## 运行 AgentChat 首屏六态、会话池与异步归属 smoke（全 API mock，不访问数据库）
	cd web-console && npm run smoke:agent-chat-first-viewport

agent-chat-tool-audit-smoke: ## 运行 AgentChat 真实后端工具调用审计 smoke（localhost + MOCK LLM）
	./scripts/agent-chat-tool-audit-smoke.sh

patch-ready-ui-smoke: ## 运行 PATCH_READY 前端浏览器 smoke（全 API mock，不触发真实后端/PR）
	cd web-console && npm run smoke:patch-ready

public-repo-ui-smoke: ## 运行公开仓库真实页面浏览器 smoke（需要 SL_PUBLIC_REPO_UI_* 环境变量）
	cd web-console && npm run smoke:public-repo-ui

dashboard-next-action-ui-smoke: ## 运行 Dashboard 推荐下一步浏览器 smoke（全 API mock）
	cd web-console && npm run smoke:dashboard-next-action

report-evidence-drawer-ui-smoke: ## 运行报告证据抽屉 code_chunks 浏览器 smoke（全 API mock）
	cd web-console && npm run smoke:report-evidence-drawer

report-evidence-qa-citation-ui-smoke: ## 运行报告证据到 QA 引用可视化 smoke（全 API mock）
	cd web-console && npm run smoke:report-evidence-qa-citation

project-qa-low-confidence-ui-smoke: ## 运行 ProjectDetail QA 低置信度/无证据可视化 smoke（全 API mock）
	cd web-console && npm run smoke:project-qa-low-confidence

project-qa-recoverable-ui-smoke: ## 运行 ProjectDetail QA/code_chunks 可恢复失败态 smoke（全 API mock）
	cd web-console && npm run smoke:project-qa-recoverable

project-qa-autorepair-candidate-ui-smoke: ## 运行 ProjectDetail QA 已验证引用生成 AutoRepair 候选 smoke（全 API mock）
	cd web-console && npm run smoke:project-qa-autorepair-candidate

scan-governance-timeline-ui-smoke: ## 运行扫描修复治理时间线浏览器 smoke（全 API mock）
	cd web-console && npm run smoke:scan-governance-timeline

app-shell-ui-smoke: ## 运行全局 App Shell UI 浏览器 smoke（全 API mock）
	cd web-console && npm run smoke:app-shell-ui

project-detail-first-viewport-ui-smoke: ## 运行 ProjectDetail 首屏状态、动作和异步归属 smoke（全 API mock，不访问数据库）
	cd web-console && npm run smoke:project-detail-first-viewport

scan-task-detail-first-viewport-ui-smoke: ## 运行 ScanTaskDetail 首屏状态、报告归属和异步隔离 smoke（全 API mock，不访问数据库）
	cd web-console && npm run smoke:scan-task-detail-first-viewport

agent-tasks-detail-selection-ui-smoke: ## 运行 AgentTasks 表格详情选择可访问性 smoke（全 API mock）
	cd web-console && npm run smoke:agent-tasks-detail-selection

execution-tasks-detail-selection-ui-smoke: ## 运行 ExecutionTasks 表格详情选择可访问性 smoke（全 API mock）
	cd web-console && npm run smoke:execution-tasks-detail-selection

artifacts-detail-selection-ui-smoke: ## 运行 Artifacts 表格详情/预览选择可访问性 smoke（全 API mock）
	cd web-console && npm run smoke:artifacts-detail-selection

p9-main-path-recoverable-error-states-batch3-ui-smoke: ## 运行 P9 主链路可恢复错误态 batch 3 smoke（全 API mock）
	cd web-console && npm run smoke:p9-main-path-recoverable-error-states-batch3

p9-main-path-recoverable-error-states-batch4a-ui-smoke: ## 运行 P9 深层页面可恢复错误态 batch 4A smoke（全 API mock）
	cd web-console && npm run smoke:p9-main-path-recoverable-error-states-batch4a

p9-main-path-recoverable-error-states-batch4b-ui-smoke: ## 运行 P9 依赖图谱可恢复错误态 batch 4B smoke（全 API mock）
	cd web-console && npm run smoke:p9-main-path-recoverable-error-states-batch4b

model-config-recoverable-ui-smoke: ## 运行模型配置页可恢复错误态 smoke（全 API mock）
	cd web-console && npm run smoke:model-config-recoverable

audit-logs-detail-selection-ui-smoke: ## 运行 AuditLogs 三源表格详情选择可访问性 smoke（全 API mock）
	cd web-console && npm run smoke:audit-logs-detail-selection

ci-diagnostics-detail-selection-ui-smoke: ## 运行 CI Diagnostics 表格详情选择可访问性 smoke（全 API mock）
	cd web-console && npm run smoke:ci-diagnostics-detail-selection

pr-reviews-detail-selection-ui-smoke: ## 运行 PR Reviews 表格详情选择可访问性 smoke（全 API mock）
	cd web-console && npm run smoke:pr-reviews-detail-selection

issue-decomposition-detail-selection-ui-smoke: ## 运行 IssueDecomposition 表格详情选择可访问性 smoke（全 API mock）
	cd web-console && npm run smoke:issue-decomposition-detail-selection

report-autorepair-candidate-ui-smoke: ## 运行报告证据到 AutoRepair 创建请求绑定 smoke（全 API mock）
	cd web-console && npm run smoke:report-autorepair-candidate

artifact-quality-self-test: ## 检查产物质量校验器的报告语义防回归
	node scripts/validate-artifact-quality.mjs --self-test

dependency-check: ## 运行依赖和供应链回归检查
	./scripts/dependency-regression-check.sh

security-regression-check: ## 运行安全回归；可用 SUITE=static|llm-provider|release-evidence-profile|release-verifier-forgery|release-verifier-public-repo-marker|release-verifier-public-repo-ui-marker|release-verifier-autorepair-ui-marker|release-verifier-dashboard-ui-marker|release-verifier-report-evidence-marker|release-verifier-scan-governance-marker|release-verifier-agent-chat-marker|release-verifier-artifacts-marker|release-verifier-integrity|integration-drill
	@SOURCELENS_SECURITY_REGRESSION_SUITE="$(SUITE)" ./scripts/security-regression-check.sh

security-regression-static: ## 运行安全回归静态契约门禁
	@$(MAKE) security-regression-check SUITE=static

security-regression-llm-provider: ## 运行 LLM provider 安全回归门禁
	@$(MAKE) security-regression-check SUITE=llm-provider

security-regression-release-evidence-profile: ## 运行 release evidence profile/required failure 门禁
	@$(MAKE) security-regression-check SUITE=release-evidence-profile

security-regression-release-verifier-forgery: ## 运行 release verifier marker 防伪门禁
	@$(MAKE) security-regression-check SUITE=release-verifier-forgery

security-regression-release-verifier-public-repo-marker: ## 运行 public repo 非 UI marker 防伪门禁
	@$(MAKE) security-regression-check SUITE=release-verifier-public-repo-marker

security-regression-release-verifier-public-repo-ui-marker: ## 运行 public repo UI marker 防伪门禁
	@$(MAKE) security-regression-check SUITE=release-verifier-public-repo-ui-marker

security-regression-release-verifier-autorepair-ui-marker: ## 运行 AutoRepair/PATCH_READY UI marker 防伪门禁
	@$(MAKE) security-regression-check SUITE=release-verifier-autorepair-ui-marker

security-regression-release-verifier-dashboard-ui-marker: ## 运行 Dashboard next action UI marker 防伪门禁
	@$(MAKE) security-regression-check SUITE=release-verifier-dashboard-ui-marker

security-regression-release-verifier-report-evidence-marker: ## 运行 report evidence drawer marker 防伪门禁
	@$(MAKE) security-regression-check SUITE=release-verifier-report-evidence-marker

security-regression-release-verifier-scan-governance-marker: ## 运行 scan governance timeline marker 防伪门禁
	@$(MAKE) security-regression-check SUITE=release-verifier-scan-governance-marker

security-regression-release-verifier-agent-chat-marker: ## 运行 AgentChat closure rail marker 防伪门禁
	@$(MAKE) security-regression-check SUITE=release-verifier-agent-chat-marker

security-regression-release-verifier-artifacts-marker: ## 运行 Artifacts raw download marker 防伪门禁
	@$(MAKE) security-regression-check SUITE=release-verifier-artifacts-marker

security-regression-release-verifier-integrity: ## 运行 release verifier package/integrity 防篡改门禁
	@$(MAKE) security-regression-check SUITE=release-verifier-integrity

security-regression-integration-drill: ## 运行安全集成演练门禁
	@$(MAKE) security-regression-check SUITE=integration-drill

llm-safety-check: ## 运行 LLM prompt injection、输出质量和 provider 结果格式检查
	./scripts/llm-safety-regression.sh

llm-provider-eval: ## 使用真实 LLM provider 生成可归档的 provider run 证据（需要 provider env）
	node scripts/run-llm-provider-eval.mjs

llm-provider-eval-mock-smoke: ## 使用本地 mock provider 验证 provider eval 生成器成功路径
	node scripts/llm-provider-eval-mock-smoke.mjs

worktree-inventory: ## 输出当前工作区分组清单，可用 GROUP=<slug|name> 过滤
	@SOURCELENS_WORKTREE_INVENTORY_GROUP="$(GROUP)" ./scripts/worktree-inventory.sh

prod-preflight: ## 运行生产验收前置条件检查
	./scripts/production-preflight.sh

backup-preflight: ## 运行备份恢复前置条件检查
	./scripts/backup-restore-preflight.sh

backup-restore-drill: ## 运行备份恢复演练并生成标准 evidence 文件
	./scripts/backup-restore-drill.sh

rollback-preflight: ## 运行回滚前置条件检查
	./scripts/rollback-preflight.sh

sandbox-drill: ## 运行 Docker sandbox 真实隔离兼容性演练
	./scripts/sandbox-drill.sh

mysql-flyway-smoke: ## 运行一次性 MySQL + Flyway migration 真实执行 smoke
	./scripts/mysql-flyway-migration-smoke.sh

github-app-drill: ## 运行 GitHub App 只读端到端演练
	./scripts/github-app-drill.sh

github-webhook-drill: ## 运行 GitHub App webhook 签名和重复投递演练
	./scripts/github-webhook-drill.sh

release-evidence: ## 生成发布验收证据包
	./scripts/release-evidence.sh

release-evidence-inventory: ## 只读盘点 release-evidence 目录分类，不移动不删除
	node scripts/release-evidence-inventory.mjs

release-evidence-inventory-self-test: ## 自测 release evidence inventory 的 Dashboard metrics 与 executive briefing 证据解析
	node scripts/release-evidence-inventory-self-test.mjs

release-evidence-retention-dry-run: ## 只读生成 release-evidence 人工归档候选计划，不移动不删除
	node scripts/release-evidence-inventory.mjs --retention-dry-run

release-evidence-ci: ## 生成 CI 安全轻量证据包（不读取真实 secrets，不跑真实 smoke）
	SOURCELENS_RELEASE_EVIDENCE_PROFILE=ci ./scripts/release-evidence.sh

release-evidence-release: ## 生成发布核心证据包（强制核心 smoke，GitHub/LLM 高级项保持 auto）
	SOURCELENS_RELEASE_EVIDENCE_PROFILE=release ./scripts/release-evidence.sh

release-evidence-nightly: ## 生成夜间重型证据包（强制核心 smoke、phase12 和 sandbox）
	SOURCELENS_RELEASE_EVIDENCE_PROFILE=nightly ./scripts/release-evidence.sh

verify-release-evidence: ## 验证发布验收证据包完整性，使用 DIR=<release-evidence/run-id>
	./scripts/verify-release-evidence.sh "$(DIR)"

smoke: ## 运行后端健康检查和可选 metrics smoke test
	./scripts/smoke-test.sh

public-repo-smoke: ## 运行公开 GitHub 仓库分析主链路 smoke test
	./scripts/public-repo-analysis-smoke.sh

p6-retrieval-quality-matrix: ## 运行 P6 bounded public repo retrieval quality matrix（耗时，非 full benchmark）
	./scripts/p6-retrieval-quality-matrix.sh

file-bound-repair-smoke: ## 运行文件级风险到自动修复候选 smoke test
	./scripts/file-bound-repair-smoke.sh

autorepair-patch-smoke: ## 运行自动修复候选到 PATCH_READY 的真实 smoke test
	./scripts/autorepair-patch-smoke.sh

audit-workbench-smoke: ## 运行审计日志 workbench 三类数据源 smoke test
	./scripts/audit-workbench-smoke.sh

artifact-quality-check: ## 校验指定扫描任务的 JSON artifact 结构质量，使用 SCAN_TASK_ID=<id>
	@SOURCELENS_ARTIFACT_QUALITY_SCAN_TASK_ID="$(SCAN_TASK_ID)" ./scripts/artifact-quality-check.sh

phase12-baseline: ## 采集阶段 12 新组件引入触发基准
	./scripts/phase12-baseline.sh

clean: ## 清理构建产物
	cd backend-spring && mvn clean -q 2>/dev/null || true
	if command -v cargo >/dev/null 2>&1; then cd analyzer-rust && cargo clean -q 2>/dev/null || true; fi
	rm -rf analyzer-rust/target bin
	find . \( -path './.git' -o -path './web-console/node_modules' -o -path './backend-spring/target' -o -path './analyzer-rust/target' \) -prune -o -name 'target 2' -type d -prune -exec rm -rf {} +
	find . \( -path './.git' -o -path './web-console/node_modules' -o -path './backend-spring/target' -o -path './analyzer-rust/target' \) -prune -o -name '.DS_Store' -type f -delete
	cd web-console && rm -rf dist .vite node_modules/.vite tsconfig*.tsbuildinfo
	@echo "清理完成"
