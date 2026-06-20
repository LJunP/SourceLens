# SourceLens

面向真实工程项目的 Agentic 架构分析、代码逆向理解、工程治理与自动化开发平台。

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Java 17 / Spring Boot 3.3 / MyBatis-Plus 3.5 |
| 分析器 | Rust (cargo) |
| 前端 | React 18 / TypeScript / Vite / Ant Design |
| 数据库 | MySQL 8.4 / Redis 7 |
| 部署 | Docker Compose |

## 本地启动

### 1. 启动依赖

```bash
cd deploy
cp .env.example .env   # 按需修改密码
docker compose up -d
```

MySQL 运行在 `localhost:3307`,Redis 运行在 `localhost:6379`。

### 2. 启动后端

```bash
cd backend-spring
mvn clean compile -DskipTests
mvn spring-boot:run
```

后端运行在 `http://localhost:8080`,Swagger UI: `http://localhost:8080/swagger-ui.html`。

### 3. 构建分析器

```bash
cd analyzer-rust
cargo build --release
```

产物位于 `target/release/sourcelens-analyzer`。

### 4. 启动前端

```bash
cd web-console
npm install
npm run dev
```

前端运行在 `http://localhost:5173`。

## 功能模块

| 模块 | 说明 |
|------|------|
| 用户认证 | 注册、登录、JWT 鉴权 |
| 项目管理 | CRUD、健康评分 |
| 仓库管理 | GitHub 仓库接入、Token 加密存储 |
| 扫描任务 | 触发 Rust 分析器、异步执行、状态追踪 |
| 架构报告 | 文件树、语言统计、API 清单、实体提取 |
| 依赖图 | 符号/关系提取、可视化依赖图 |
| Agent 任务 | AI 驱动的架构审查、风险扫描 |
| Issue 拆解 | 将 Issue 拆解为子任务 |
| CI 诊断 | CI 失败分析与诊断报告 |
| PR 审查 | Pull Request 风险审查与评论 |
| 仪表盘 | 项目概览、统计数据 |

## 项目结构

```
SourceLens/
├── backend-spring/     # Spring Boot 后端
├── analyzer-rust/      # Rust 代码分析器
├── web-console/        # React 前端
├── deploy/             # Docker Compose + .env
├── docs/               # 项目文档
```

## 版本路线

| 版本 | 目标 |
|------|------|
| V0.1 | 项目骨架、用户认证、CRUD |
| V0.2 | Git 仓库扫描 |
| V0.3 | Rust 深度分析、架构报告 |
| V0.4 | 符号/关系提取、依赖图 |
| V0.5 | Agent 分析任务 |
| V0.6 | Issue 拆解 |
| V0.7 | CI 诊断 |
| V0.8 | PR 风险审查 |
| V0.9 | 稳定化、文档、安全加固 |
| V1.0 | 公开演示版 |