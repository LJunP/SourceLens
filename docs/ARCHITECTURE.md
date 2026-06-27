# 架构设计

## 系统架构

```
┌─────────────┐     ┌──────────────────┐     ┌────────────────┐
│  web-console│────▶│  backend-spring  │────▶│   MySQL 8.4    │
│  React/Vite │     │  Spring Boot 3.3 │     │   Redis 7      │
└─────────────┘     │  Port: 8080      │     └────────────────┘
                    └────────┬─────────┘
                             │ 子进程调用 / 沙箱执行 / GitHub API
                    ┌────────▼─────────┐
                    │ analyzer-rust    │
                    │ sandbox executor │
                    │ GitHub App API   │
                    └──────────────────┘
```

## 后端分层

```
Controller ──▶ Service ──▶ Mapper ──▶ MySQL
    │              │
    │              ├──▶ Rust Analyzer (子进程)
    │              ├──▶ SandboxExecutor (local/docker)
    │              ├──▶ GitHub App / Webhook
    │              └──▶ Redis (JWT denylist / 缓存)
    │
    ├── JwtAuthFilter (请求拦截)
    └── GlobalExceptionHandler (异常处理)
```

### 包结构

```
com.sourcelens
├── common/                 # 公共组件
│   ├── Result.java         # 统一响应
│   ├── PageResult.java     # 分页响应
│   ├── config/             # 全局配置
│   ├── exception/          # 异常处理
│   ├── observability/      # Micrometer 业务指标
│   ├── web/                # RequestIdFilter 等 Web 横切能力
│   └── security/           # JWT + 凭据加密 + 脱敏
├── module/
│   ├── user/               # 用户注册登录
│   ├── project/            # 项目管理
│   ├── repository/         # 仓库管理
│   ├── scantask/           # 扫描任务
│   ├── analysis/           # 架构分析 + 依赖图
│   ├── agent/              # Agent 分析任务
│   ├── execution/          # 统一执行任务、attempt、step、log
│   ├── artifact/           # 产物存储与预览
│   ├── audit/              # 审计日志
│   ├── autorepair/         # 自动修复 patch/受控 PR
│   ├── sandbox/            # local/docker 沙箱执行
│   ├── workspace/          # workspace 兜底清理
│   ├── issue/              # Issue 拆解
│   ├── ci/                 # CI 诊断
│   ├── review/             # PR 审查
│   ├── dashboard/          # 仪表盘
│   ├── scanstat/           # 扫描统计
│   └── common/             # 健康检查
```

## 核心流程

### 扫描流程

1. 用户在前端触发扫描
2. `ScanTaskController` 创建扫描任务 (status=PENDING)
3. `ScanTaskService` 异步执行:
   - `GitService.clone()` 克隆仓库到隔离 workspace
   - 调用 `sourcelens-analyzer` 子进程
   - `AnalysisService` 解析结果并入库
   - 持久化 artifact、symbol、relation、chunk
   - 同步 execution task/step 状态
4. 前端轮询获取最新状态

### 认证流程

1. 注册: POST /api/auth/register → 密码 BCrypt 加密存储
2. 登录: POST /api/auth/login → 验证密码 → 生成签名 JWT → 返回给前端
3. 请求: 前端携带 Bearer JWT → `JwtAuthFilter` 校验签名、过期时间和 denylist → 注入用户上下文
4. 退出: POST /api/auth/logout → token id 写入 denylist，后续请求拒绝

### GitHub App 与受控 PR 流程

1. 用户添加仓库，生产 profile 默认不允许 PAT。
2. 用户绑定 GitHub App installation。
3. Webhook 入口校验 `X-Hub-Signature-256`。
4. `GitHubAppTokenService` 使用 App private key 签发 App JWT，再换取短期 installation token。
5. AutoRepair 先生成 patch artifact，不直接修改原仓库。
6. 用户显式开启受控 PR 后，系统在沙箱 workspace 应用 patch、push 分支并创建 PR。
7. execution task、execution log 和 audit log 记录每个阶段，不记录 token、diff 正文或源码正文。

## 数据流

```
前端 localStorage (Bearer JWT)
    │
    ▼
JwtAuthFilter (签名校验 + denylist)
    │
    ▼
Controller (参数校验)
    │
    ▼
Service (业务逻辑 + 事务)
    │
    ├─▶ BaseMapper (MyBatis-Plus CRUD)
    ├─▶ JGit (仓库操作)
    ├─▶ ProcessBuilder (Rust 分析器)
    ├─▶ SandboxExecutor (测试/补丁/受控 PR)
    ├─▶ GitHub App API (短期 installation token)
    ├─▶ Redis (JWT denylist / 缓存)
    └─▶ ArtifactStorageService (patch/report/log 产物)
```
