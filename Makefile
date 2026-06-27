.PHONY: help deps up up-infra down restart logs logs-backend clean dev backend backend-jar frontend analyzer verify script-check dependency-check llm-safety-check worktree-inventory prod-preflight backup-preflight backup-restore-drill rollback-preflight sandbox-drill github-app-drill github-webhook-drill release-evidence verify-release-evidence smoke public-repo-smoke artifact-quality-check phase12-baseline demo

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

backend-jar: ## 本地启动已打包后端 jar (dev profile, 自动读取 deploy/.env)
	./scripts/run-backend-jar-dev.sh

frontend: ## 启动前端开发服务器
	cd web-console && npm run dev
analyzer: ## 构建 Rust 分析器并同步至 bin 目录
	cd analyzer-rust && cargo build --release
	mkdir -p bin
	cp analyzer-rust/target/release/sourcelens-analyzer bin/

verify: ## 运行后端、前端和 Rust analyzer 全量本地验证
	./scripts/verify-all.sh

script-check: ## 检查所有 Shell 脚本语法
	@for script in scripts/*.sh; do bash -n "$$script"; done

dependency-check: ## 运行依赖和供应链回归检查
	./scripts/dependency-regression-check.sh

llm-safety-check: ## 运行 LLM prompt injection、输出质量和 provider 结果格式检查
	./scripts/llm-safety-regression.sh

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

github-app-drill: ## 运行 GitHub App 只读端到端演练
	./scripts/github-app-drill.sh

github-webhook-drill: ## 运行 GitHub App webhook 签名和重复投递演练
	./scripts/github-webhook-drill.sh

release-evidence: ## 生成发布验收证据包
	./scripts/release-evidence.sh

verify-release-evidence: ## 验证发布验收证据包完整性，使用 DIR=<release-evidence/run-id>
	./scripts/verify-release-evidence.sh "$(DIR)"

smoke: ## 运行后端健康检查和可选 metrics smoke test
	./scripts/smoke-test.sh

public-repo-smoke: ## 运行公开 GitHub 仓库分析主链路 smoke test
	./scripts/public-repo-analysis-smoke.sh

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
