# 架构设计

## 系统架构

```
┌─────────────┐     ┌──────────────────┐     ┌────────────────┐
│  web-console│────▶│  backend-spring  │────▶│   MySQL 8.4    │
│  React/Vite │     │  Spring Boot 3.3 │     │   Redis 7      │
└─────────────┘     │  Port: 8080      │     └────────────────┘
                    └────────┬─────────┘
                             │ 子进程调用
                    ┌────────▼─────────┐
                    │ analyzer-rust    │
                    │ Rust CLI         │
                    └──────────────────┘
```

## 后端分层

```
Controller ──▶ Service ──▶ Mapper ──▶ MySQL
    │              │
    │              ├──▶ Rust Analyzer (子进程)
    │              └──▶ Redis (缓存/会话)
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
│   └── security/           # JWT + 认证
├── module/
│   ├── user/               # 用户注册登录
│   ├── project/            # 项目管理
│   ├── repository/         # 仓库管理
│   ├── scantask/           # 扫描任务
│   ├── analysis/           # 架构分析 + 依赖图
│   ├── agent/              # Agent 分析任务
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
   - `GitService.clone()` 克隆仓库到临时目录
   - 调用 `sourcelens-analyzer` 子进程
   - `AnalysisService` 解析结果并入库
   - 清理临时目录
4. 前端轮询获取最新状态

### 认证流程

1. 注册: POST /api/auth/register → 密码 BCrypt 加密存储
2. 登录: POST /api/auth/login → 验证密码 → 生成 JWT → AES-256-GCM 加密返回
3. 请求: 前端携带加密 Token → `JwtAuthFilter` 解密并校验 → 注入用户上下文

## 数据流

```
前端 localStorage (加密Token)
    │
    ▼
JwtAuthFilter (解密 + 校验)
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
    └─▶ Redis (缓存)
```