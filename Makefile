.PHONY: help deps up up-infra down restart logs logs-backend clean dev backend frontend analyzer demo

help: ## 显示帮助
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

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

backend: ## 本地启动后端 (dev profile, 改代码自动热重载)
	cd backend-spring && export JAVA_HOME="$${JAVA_HOME:-$$(/usr/libexec/java_home 2>/dev/null)}" && mvn spring-boot:run

frontend: ## 启动前端开发服务器
	cd web-console && npm run dev

analyzer: ## 构建 Rust 分析器
	cd analyzer-rust && cargo build --release

clean: ## 清理构建产物
	cd backend-spring && mvn clean -q 2>/dev/null || true
	cd web-console && rm -rf node_modules/.vite
	@echo "清理完成"