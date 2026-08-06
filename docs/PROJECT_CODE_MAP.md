# SourceLens 简洁代码地图

状态：由 `scripts/generate-project-code-map.mjs` 根据当前工作区生成。本文是简洁索引，用于快速判断目录、文件和接口入口“是做什么的”；详细接口语义见 `docs/API_DESIGN.md`，详细阶段记录见 `docs/PRODUCT_PROGRESS_LOG.md`。

## 1. 生成范围

- 纳入逐文件用途索引的文件数：616。
- 其中源码/脚本/配置/SQL/CSS 类文件数：502。
- 纳入统计的文本总行数：325825。
- 排除逐文件展开的本地生成/证据目录：`.git/`、`bin/`、`web-console/node_modules/`、`backend-spring/target/`、`analyzer-rust/target/`、`.sourcelens-runtime/`、`release-evidence/`、前端构建和测试产物。
- `release-evidence/`、`.sourcelens-runtime/` 等目录的治理边界见 `docs/PROJECT_STRUCTURE_AUDIT.md` 与 `docs/OPERATIONS_RUNBOOK.md`。

## 2. 顶层目录总览

| 路径 | 文件数 | 说明 |
| --- | ---: | --- |
| `.dockerignore` | 1 | 项目根文件或辅助目录。 |
| `.github` | 9 | CI/CD 工作流。 |
| `.gitignore` | 1 | 项目根文件或辅助目录。 |
| `.idea` | 7 | JetBrains 本地 IDE 配置。 |
| `.vscode` | 1 | VS Code 本地配置。 |
| `analyzer-rust` | 10 | Rust 代码逆向分析器。 |
| `backend-spring` | 342 | Spring Boot 后端服务。 |
| `CHAIRMAN_BRIEFING.md` | 1 | 项目根文件或辅助目录。 |
| `CHANGELOG.md` | 1 | 项目根文件或辅助目录。 |
| `CODE_OF_CONDUCT.md` | 1 | 项目根文件或辅助目录。 |
| `CONTRIBUTING.md` | 1 | 项目根文件或辅助目录。 |
| `deploy` | 3 | Docker Compose 和环境模板。 |
| `docs` | 62 | 产品、架构、运维、安全、阶段、团队与交接文档。 |
| `LICENSE` | 1 | 项目根文件或辅助目录。 |
| `Makefile` | 1 | 项目根文件或辅助目录。 |
| `README.md` | 1 | 项目根文件或辅助目录。 |
| `ROADMAP.md` | 1 | 项目根文件或辅助目录。 |
| `scripts` | 41 | 本地启动、验证、release evidence、安全回归和 smoke 自动化。 |
| `SECURITY.md` | 1 | 项目根文件或辅助目录。 |
| `SUPPORT.md` | 1 | 项目根文件或辅助目录。 |
| `web-console` | 129 | React/Vite 前端控制台和 Playwright UI smoke。 |

## 3. 目录层级职责地图

该章节按当前工作区真实目录生成，用于判断每一层目录负责什么。生成物、依赖和证据目录不会展开。

| 目录 | 文件数 | 说明 |
| --- | ---: | --- |
| `.github` | 9 | GitHub 平台配置目录，目前承载 CI 工作流。 |
| `.github/ISSUE_TEMPLATE` | 6 | CI/CD 工作流。子目录。 |
| `.github/workflows` | 1 | GitHub Actions 工作流目录，负责自动化构建、测试、安全检查和 release evidence。 |
| `.idea` | 7 | JetBrains IDE 本地配置目录，不是产品运行必需能力。 |
| `.vscode` | 1 | VS Code 工作区配置目录，用于本地编辑器体验。 |
| `analyzer-rust` | 10 | Rust 逆向分析器工程，负责扫描外部仓库并输出结构化代码理解结果。 |
| `analyzer-rust/.cargo` | 1 | Rust 代码逆向分析器。子目录。 |
| `analyzer-rust/src` | 6 | Rust analyzer 核心源码目录，包含扫描、AST、框架识别、逆向分析和数据模型。 |
| `analyzer-rust/tests` | 1 | Rust analyzer 合同测试目录，保护 CLI 输出和扫描行为不退化。 |
| `backend-spring` | 342 | Spring Boot 后端工程，承载认证、项目、仓库、扫描、产物、Agent、审计、修复和集成 API。 |
| `backend-spring/src` | 339 | Spring Boot 后端服务。子目录。 |
| `backend-spring/src/main` | 251 | Spring Boot 后端服务。子目录。 |
| `backend-spring/src/main/java` | 216 | Spring Boot 后端服务。子目录。 |
| `backend-spring/src/main/java/com` | 216 | Spring Boot 后端服务。子目录。 |
| `backend-spring/src/main/java/com/sourcelens` | 216 | Spring Boot 后端服务。子目录。 |
| `backend-spring/src/main/java/com/sourcelens/common` | 18 | 后端公共基础设施，包含统一响应、异常、安全、配置、可观测性和 MyBatis 配置。 |
| `backend-spring/src/main/java/com/sourcelens/common/config` | 4 | Spring Boot 后端服务。子目录。 |
| `backend-spring/src/main/java/com/sourcelens/common/exception` | 2 | Spring Boot 后端服务。子目录。 |
| `backend-spring/src/main/java/com/sourcelens/common/observability` | 1 | Spring Boot 后端服务。子目录。 |
| `backend-spring/src/main/java/com/sourcelens/common/security` | 7 | Spring Boot 后端服务。子目录。 |
| `backend-spring/src/main/java/com/sourcelens/common/web` | 1 | Spring Boot 后端服务。子目录。 |
| `backend-spring/src/main/java/com/sourcelens/module` | 197 | 后端业务模块根目录，每个子目录对应一个相对独立的产品域。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent` | 57 | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。业务模块目录。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/controller` | 6 | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。Controller 层，暴露 REST 接口、校验入口参数并委托 service。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/dto` | 12 | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。DTO 层，定义请求/响应契约。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/entity` | 6 | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。Entity 层，映射数据库表。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/mapper` | 6 | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。Mapper 层，封装 MyBatis-Plus 数据访问。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/service` | 15 | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。Service 层，承载业务规则、状态机、外部系统调用和安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/tool` | 12 | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。Agent Tool 层，定义 Agent 可调用工具及权限/参数约束。 |
| `backend-spring/src/main/java/com/sourcelens/module/analysis` | 31 | 分析器运行、scan artifact、code_chunks、图谱、代码定位和报告构建。业务模块目录。 |
| `backend-spring/src/main/java/com/sourcelens/module/analysis/controller` | 3 | 分析器运行、scan artifact、code_chunks、图谱、代码定位和报告构建。Controller 层，暴露 REST 接口、校验入口参数并委托 service。 |
| `backend-spring/src/main/java/com/sourcelens/module/analysis/dto` | 5 | 分析器运行、scan artifact、code_chunks、图谱、代码定位和报告构建。DTO 层，定义请求/响应契约。 |
| `backend-spring/src/main/java/com/sourcelens/module/analysis/entity` | 4 | 分析器运行、scan artifact、code_chunks、图谱、代码定位和报告构建。Entity 层，映射数据库表。 |
| `backend-spring/src/main/java/com/sourcelens/module/analysis/mapper` | 4 | 分析器运行、scan artifact、code_chunks、图谱、代码定位和报告构建。Mapper 层，封装 MyBatis-Plus 数据访问。 |
| `backend-spring/src/main/java/com/sourcelens/module/analysis/service` | 13 | 分析器运行、scan artifact、code_chunks、图谱、代码定位和报告构建。Service 层，承载业务规则、状态机、外部系统调用和安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/artifact` | 7 | 产物记录、预览、下载、审计凭证和保留策略。业务模块目录。 |
| `backend-spring/src/main/java/com/sourcelens/module/artifact/controller` | 1 | 产物记录、预览、下载、审计凭证和保留策略。Controller 层，暴露 REST 接口、校验入口参数并委托 service。 |
| `backend-spring/src/main/java/com/sourcelens/module/artifact/dto` | 2 | 产物记录、预览、下载、审计凭证和保留策略。DTO 层，定义请求/响应契约。 |
| `backend-spring/src/main/java/com/sourcelens/module/artifact/entity` | 1 | 产物记录、预览、下载、审计凭证和保留策略。Entity 层，映射数据库表。 |
| `backend-spring/src/main/java/com/sourcelens/module/artifact/mapper` | 1 | 产物记录、预览、下载、审计凭证和保留策略。Mapper 层，封装 MyBatis-Plus 数据访问。 |
| `backend-spring/src/main/java/com/sourcelens/module/artifact/service` | 2 | 产物记录、预览、下载、审计凭证和保留策略。Service 层，承载业务规则、状态机、外部系统调用和安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/audit` | 6 | 审计日志、审计工作台和安全治理留痕。业务模块目录。 |
| `backend-spring/src/main/java/com/sourcelens/module/audit/controller` | 2 | 审计日志、审计工作台和安全治理留痕。Controller 层，暴露 REST 接口、校验入口参数并委托 service。 |
| `backend-spring/src/main/java/com/sourcelens/module/audit/entity` | 1 | 审计日志、审计工作台和安全治理留痕。Entity 层，映射数据库表。 |
| `backend-spring/src/main/java/com/sourcelens/module/audit/mapper` | 1 | 审计日志、审计工作台和安全治理留痕。Mapper 层，封装 MyBatis-Plus 数据访问。 |
| `backend-spring/src/main/java/com/sourcelens/module/audit/service` | 2 | 审计日志、审计工作台和安全治理留痕。Service 层，承载业务规则、状态机、外部系统调用和安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/autorepair` | 7 | AutoRepair 候选、补丁、PR 提交流程和修复门禁。业务模块目录。 |
| `backend-spring/src/main/java/com/sourcelens/module/autorepair/controller` | 1 | AutoRepair 候选、补丁、PR 提交流程和修复门禁。Controller 层，暴露 REST 接口、校验入口参数并委托 service。 |
| `backend-spring/src/main/java/com/sourcelens/module/autorepair/dto` | 1 | AutoRepair 候选、补丁、PR 提交流程和修复门禁。DTO 层，定义请求/响应契约。 |
| `backend-spring/src/main/java/com/sourcelens/module/autorepair/entity` | 1 | AutoRepair 候选、补丁、PR 提交流程和修复门禁。Entity 层，映射数据库表。 |
| `backend-spring/src/main/java/com/sourcelens/module/autorepair/mapper` | 1 | AutoRepair 候选、补丁、PR 提交流程和修复门禁。Mapper 层，封装 MyBatis-Plus 数据访问。 |
| `backend-spring/src/main/java/com/sourcelens/module/autorepair/service` | 3 | AutoRepair 候选、补丁、PR 提交流程和修复门禁。Service 层，承载业务规则、状态机、外部系统调用和安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/ci` | 5 | CI 诊断记录和复分析入口。业务模块目录。 |
| `backend-spring/src/main/java/com/sourcelens/module/ci/controller` | 1 | CI 诊断记录和复分析入口。Controller 层，暴露 REST 接口、校验入口参数并委托 service。 |
| `backend-spring/src/main/java/com/sourcelens/module/ci/dto` | 1 | CI 诊断记录和复分析入口。DTO 层，定义请求/响应契约。 |
| `backend-spring/src/main/java/com/sourcelens/module/ci/entity` | 1 | CI 诊断记录和复分析入口。Entity 层，映射数据库表。 |
| `backend-spring/src/main/java/com/sourcelens/module/ci/mapper` | 1 | CI 诊断记录和复分析入口。Mapper 层，封装 MyBatis-Plus 数据访问。 |
| `backend-spring/src/main/java/com/sourcelens/module/ci/service` | 1 | CI 诊断记录和复分析入口。Service 层，承载业务规则、状态机、外部系统调用和安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/common` | 1 | 模块级健康检查和共享后端能力。业务模块目录。 |
| `backend-spring/src/main/java/com/sourcelens/module/dashboard` | 1 | 控制台统计、最近扫描和下一步建议。业务模块目录。 |
| `backend-spring/src/main/java/com/sourcelens/module/dashboard/controller` | 1 | 控制台统计、最近扫描和下一步建议。Controller 层，暴露 REST 接口、校验入口参数并委托 service。 |
| `backend-spring/src/main/java/com/sourcelens/module/execution` | 12 | 执行任务、attempt、step、log 和取消流程。业务模块目录。 |
| `backend-spring/src/main/java/com/sourcelens/module/execution/controller` | 1 | 执行任务、attempt、step、log 和取消流程。Controller 层，暴露 REST 接口、校验入口参数并委托 service。 |
| `backend-spring/src/main/java/com/sourcelens/module/execution/dto` | 1 | 执行任务、attempt、step、log 和取消流程。DTO 层，定义请求/响应契约。 |
| `backend-spring/src/main/java/com/sourcelens/module/execution/entity` | 4 | 执行任务、attempt、step、log 和取消流程。Entity 层，映射数据库表。 |
| `backend-spring/src/main/java/com/sourcelens/module/execution/mapper` | 4 | 执行任务、attempt、step、log 和取消流程。Mapper 层，封装 MyBatis-Plus 数据访问。 |
| `backend-spring/src/main/java/com/sourcelens/module/execution/service` | 2 | 执行任务、attempt、step、log 和取消流程。Service 层，承载业务规则、状态机、外部系统调用和安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/issue` | 7 | Issue 拆解、任务列表和 Markdown 导出。业务模块目录。 |
| `backend-spring/src/main/java/com/sourcelens/module/issue/controller` | 1 | Issue 拆解、任务列表和 Markdown 导出。Controller 层，暴露 REST 接口、校验入口参数并委托 service。 |
| `backend-spring/src/main/java/com/sourcelens/module/issue/dto` | 1 | Issue 拆解、任务列表和 Markdown 导出。DTO 层，定义请求/响应契约。 |
| `backend-spring/src/main/java/com/sourcelens/module/issue/entity` | 2 | Issue 拆解、任务列表和 Markdown 导出。Entity 层，映射数据库表。 |
| `backend-spring/src/main/java/com/sourcelens/module/issue/mapper` | 2 | Issue 拆解、任务列表和 Markdown 导出。Mapper 层，封装 MyBatis-Plus 数据访问。 |
| `backend-spring/src/main/java/com/sourcelens/module/issue/service` | 1 | Issue 拆解、任务列表和 Markdown 导出。Service 层，承载业务规则、状态机、外部系统调用和安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/project` | 7 | 项目 CRUD、聚合查询和项目删除。业务模块目录。 |
| `backend-spring/src/main/java/com/sourcelens/module/project/controller` | 1 | 项目 CRUD、聚合查询和项目删除。Controller 层，暴露 REST 接口、校验入口参数并委托 service。 |
| `backend-spring/src/main/java/com/sourcelens/module/project/dto` | 2 | 项目 CRUD、聚合查询和项目删除。DTO 层，定义请求/响应契约。 |
| `backend-spring/src/main/java/com/sourcelens/module/project/entity` | 1 | 项目 CRUD、聚合查询和项目删除。Entity 层，映射数据库表。 |
| `backend-spring/src/main/java/com/sourcelens/module/project/mapper` | 1 | 项目 CRUD、聚合查询和项目删除。Mapper 层，封装 MyBatis-Plus 数据访问。 |
| `backend-spring/src/main/java/com/sourcelens/module/project/service` | 2 | 项目 CRUD、聚合查询和项目删除。Service 层，承载业务规则、状态机、外部系统调用和安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/repository` | 23 | 仓库接入、Git clone、GitHub App、webhook 和 PR 集成边界。业务模块目录。 |
| `backend-spring/src/main/java/com/sourcelens/module/repository/controller` | 3 | 仓库接入、Git clone、GitHub App、webhook 和 PR 集成边界。Controller 层，暴露 REST 接口、校验入口参数并委托 service。 |
| `backend-spring/src/main/java/com/sourcelens/module/repository/dto` | 2 | 仓库接入、Git clone、GitHub App、webhook 和 PR 集成边界。DTO 层，定义请求/响应契约。 |
| `backend-spring/src/main/java/com/sourcelens/module/repository/entity` | 4 | 仓库接入、Git clone、GitHub App、webhook 和 PR 集成边界。Entity 层，映射数据库表。 |
| `backend-spring/src/main/java/com/sourcelens/module/repository/mapper` | 4 | 仓库接入、Git clone、GitHub App、webhook 和 PR 集成边界。Mapper 层，封装 MyBatis-Plus 数据访问。 |
| `backend-spring/src/main/java/com/sourcelens/module/repository/service` | 10 | 仓库接入、Git clone、GitHub App、webhook 和 PR 集成边界。Service 层，承载业务规则、状态机、外部系统调用和安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/review` | 7 | PR review、评论和重新分析。业务模块目录。 |
| `backend-spring/src/main/java/com/sourcelens/module/review/controller` | 1 | PR review、评论和重新分析。Controller 层，暴露 REST 接口、校验入口参数并委托 service。 |
| `backend-spring/src/main/java/com/sourcelens/module/review/dto` | 1 | PR review、评论和重新分析。DTO 层，定义请求/响应契约。 |
| `backend-spring/src/main/java/com/sourcelens/module/review/entity` | 2 | PR review、评论和重新分析。Entity 层，映射数据库表。 |
| `backend-spring/src/main/java/com/sourcelens/module/review/mapper` | 2 | PR review、评论和重新分析。Mapper 层，封装 MyBatis-Plus 数据访问。 |
| `backend-spring/src/main/java/com/sourcelens/module/review/service` | 1 | PR review、评论和重新分析。Service 层，承载业务规则、状态机、外部系统调用和安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/sandbox` | 6 | Docker/local sandbox 执行器、命令模型和安全校验。业务模块目录。 |
| `backend-spring/src/main/java/com/sourcelens/module/scanstat` | 2 | 扫描统计聚合。业务模块目录。 |
| `backend-spring/src/main/java/com/sourcelens/module/scanstat/entity` | 1 | 扫描统计聚合。Entity 层，映射数据库表。 |
| `backend-spring/src/main/java/com/sourcelens/module/scanstat/service` | 1 | 扫描统计聚合。Service 层，承载业务规则、状态机、外部系统调用和安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/scantask` | 9 | 扫描任务、取消、治理时间线和 smoke seed。业务模块目录。 |
| `backend-spring/src/main/java/com/sourcelens/module/scantask/controller` | 3 | 扫描任务、取消、治理时间线和 smoke seed。Controller 层，暴露 REST 接口、校验入口参数并委托 service。 |
| `backend-spring/src/main/java/com/sourcelens/module/scantask/dto` | 2 | 扫描任务、取消、治理时间线和 smoke seed。DTO 层，定义请求/响应契约。 |
| `backend-spring/src/main/java/com/sourcelens/module/scantask/entity` | 1 | 扫描任务、取消、治理时间线和 smoke seed。Entity 层，映射数据库表。 |
| `backend-spring/src/main/java/com/sourcelens/module/scantask/mapper` | 1 | 扫描任务、取消、治理时间线和 smoke seed。Mapper 层，封装 MyBatis-Plus 数据访问。 |
| `backend-spring/src/main/java/com/sourcelens/module/scantask/service` | 2 | 扫描任务、取消、治理时间线和 smoke seed。Service 层，承载业务规则、状态机、外部系统调用和安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/user` | 8 | 登录、注册、用户信息、JWT 认证。业务模块目录。 |
| `backend-spring/src/main/java/com/sourcelens/module/user/controller` | 1 | 登录、注册、用户信息、JWT 认证。Controller 层，暴露 REST 接口、校验入口参数并委托 service。 |
| `backend-spring/src/main/java/com/sourcelens/module/user/dto` | 4 | 登录、注册、用户信息、JWT 认证。DTO 层，定义请求/响应契约。 |
| `backend-spring/src/main/java/com/sourcelens/module/user/entity` | 1 | 登录、注册、用户信息、JWT 认证。Entity 层，映射数据库表。 |
| `backend-spring/src/main/java/com/sourcelens/module/user/mapper` | 1 | 登录、注册、用户信息、JWT 认证。Mapper 层，封装 MyBatis-Plus 数据访问。 |
| `backend-spring/src/main/java/com/sourcelens/module/user/service` | 1 | 登录、注册、用户信息、JWT 认证。Service 层，承载业务规则、状态机、外部系统调用和安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/workspace` | 1 | 本地工作区和 sandbox 清理。业务模块目录。 |
| `backend-spring/src/main/java/com/sourcelens/module/workspace/service` | 1 | 本地工作区和 sandbox 清理。Service 层，承载业务规则、状态机、外部系统调用和安全边界。 |
| `backend-spring/src/main/resources` | 35 | 后端资源目录，包含 Spring 配置、Flyway 数据库迁移和 MyBatis mapper XML。 |
| `backend-spring/src/main/resources/db` | 32 | Spring Boot 后端服务。子目录。 |
| `backend-spring/src/main/resources/db/migration` | 32 | Flyway 迁移目录，按版本演进 MySQL schema。 |
| `backend-spring/src/test` | 88 | Spring Boot 后端服务。子目录。 |
| `backend-spring/src/test/java` | 83 | Spring Boot 后端服务。子目录。 |
| `backend-spring/src/test/java/com` | 83 | Spring Boot 后端服务。子目录。 |
| `backend-spring/src/test/java/com/sourcelens` | 83 | 后端单元/切片测试目录，覆盖 controller、service、安全、sandbox、分析和回归行为。 |
| `backend-spring/src/test/java/com/sourcelens/common` | 1 | Spring Boot 后端服务。子目录。 |
| `backend-spring/src/test/java/com/sourcelens/common/security` | 1 | Spring Boot 后端服务。子目录。 |
| `backend-spring/src/test/java/com/sourcelens/module` | 6 | Spring Boot 后端服务。子目录。 |
| `backend-spring/src/test/java/com/sourcelens/module/agent` | 1 | Spring Boot 后端服务。子目录。 |
| `backend-spring/src/test/java/com/sourcelens/module/agent/tool` | 1 | Spring Boot 后端服务。子目录。 |
| `backend-spring/src/test/java/com/sourcelens/module/analysis` | 3 | Spring Boot 后端服务。子目录。 |
| `backend-spring/src/test/java/com/sourcelens/module/analysis/service` | 3 | Spring Boot 后端服务。子目录。 |
| `backend-spring/src/test/java/com/sourcelens/module/repository` | 1 | Spring Boot 后端服务。子目录。 |
| `backend-spring/src/test/java/com/sourcelens/module/repository/service` | 1 | Spring Boot 后端服务。子目录。 |
| `backend-spring/src/test/java/com/sourcelens/module/scanstat` | 1 | Spring Boot 后端服务。子目录。 |
| `backend-spring/src/test/java/com/sourcelens/module/scanstat/service` | 1 | Spring Boot 后端服务。子目录。 |
| `backend-spring/src/test/resources` | 5 | Spring Boot 后端服务。子目录。 |
| `backend-spring/src/test/resources/mockito-extensions` | 1 | Spring Boot 后端服务。子目录。 |
| `deploy` | 3 | 部署配置目录，包含 Docker Compose 和环境变量模板。 |
| `docs` | 62 | 项目事实源文档目录，覆盖产品、架构、API、数据库、安全、运维、阶段需求、进度和交接。 |
| `docs/aios` | 17 | 产品、架构、运维、安全、阶段、团队与交接文档。子目录。 |
| `docs/aios/schemas` | 4 | 产品、架构、运维、安全、阶段、团队与交接文档。子目录。 |
| `docs/aios/tasks` | 3 | 产品、架构、运维、安全、阶段、团队与交接文档。子目录。 |
| `docs/aios/truth` | 1 | 产品、架构、运维、安全、阶段、团队与交接文档。子目录。 |
| `docs/llm-safety-evals` | 3 | LLM 安全评测用例目录，存放 prompt injection、输出质量和 provider run 模板。 |
| `scripts` | 41 | 本地自动化脚本目录，封装启动、校验、smoke、preflight、release evidence、清理和演练。 |
| `web-console` | 129 | React/Vite 前端控制台工程，承载 SourceLens 用户界面和 UI smoke。 |
| `web-console/src` | 66 | 前端源码根目录。 |
| `web-console/src/api` | 21 | 前端 API client 层，集中定义后端 HTTP 调用和 TypeScript 响应类型。 |
| `web-console/src/components` | 13 | 前端共享组件目录，提供布局、产物预览、日志、Diff、任务时间线等复用能力。 |
| `web-console/src/components/ui` | 4 | 前端 UI 原语目录，用于统一按钮、状态块、表格行和基础交互规范。 |
| `web-console/src/contexts` | 2 | React Context 目录，承载认证和对话等跨页面状态。 |
| `web-console/src/pages` | 25 | 前端页面目录，每个文件对应一个主要产品页面或页面兼容包装。 |
| `web-console/src/styles` | 1 | 前端全局样式目录，定义产品视觉、布局、响应式和可读性规则。 |
| `web-console/src/utils` | 1 | 前端工具函数目录，当前重点处理展示脱敏等安全展示逻辑。 |
| `web-console/tests` | 26 | Playwright UI smoke 测试目录，保护关键页面、状态和交互合同。 |

## 4. 后端 REST 接口索引

当前从 Spring Controller 静态检测到 90 条路由。本文只保留定位信息；请求/响应字段、权限和安全边界以 `docs/API_DESIGN.md` 为准。

| Method | Path | 摘要 | Controller | 位置 |
| --- | --- | --- | --- | --- |
| PATCH | `/api/agent-steps/{stepId}` | 更新任务步骤状态 | `AgentTaskController.java` | `backend-spring/src/main/java/com/sourcelens/module/agent/controller/AgentTaskController.java:102` |
| POST | `/api/agent-tasks` | 创建 Agent 任务 | `AgentTaskController.java` | `backend-spring/src/main/java/com/sourcelens/module/agent/controller/AgentTaskController.java:33` |
| GET | `/api/agent-tasks/{taskId}` | Agent 任务详情 | `AgentTaskController.java` | `backend-spring/src/main/java/com/sourcelens/module/agent/controller/AgentTaskController.java:55` |
| POST | `/api/agent-tasks/{taskId}/cancel` | 取消 Agent 任务 | `AgentTaskController.java` | `backend-spring/src/main/java/com/sourcelens/module/agent/controller/AgentTaskController.java:83` |
| POST | `/api/agent-tasks/{taskId}/complete` | 完成 Agent 任务 | `AgentTaskController.java` | `backend-spring/src/main/java/com/sourcelens/module/agent/controller/AgentTaskController.java:73` |
| POST | `/api/agent-tasks/{taskId}/start` | 启动 Agent 任务 | `AgentTaskController.java` | `backend-spring/src/main/java/com/sourcelens/module/agent/controller/AgentTaskController.java:64` |
| GET | `/api/agent-tasks/{taskId}/steps` | 获取任务步骤列表 | `AgentTaskController.java` | `backend-spring/src/main/java/com/sourcelens/module/agent/controller/AgentTaskController.java:113` |
| POST | `/api/agent-tasks/{taskId}/steps` | 添加任务步骤 | `AgentTaskController.java` | `backend-spring/src/main/java/com/sourcelens/module/agent/controller/AgentTaskController.java:92` |
| POST | `/api/auth/login` | 登录 | `AuthController.java` | `backend-spring/src/main/java/com/sourcelens/module/user/controller/AuthController.java:44` |
| POST | `/api/auth/logout` | 退出登录 | `AuthController.java` | `backend-spring/src/main/java/com/sourcelens/module/user/controller/AuthController.java:79` |
| GET | `/api/auth/me` | 获取当前用户 | `AuthController.java` | `backend-spring/src/main/java/com/sourcelens/module/user/controller/AuthController.java:68` |
| POST | `/api/auth/register` | 注册 | `AuthController.java` | `backend-spring/src/main/java/com/sourcelens/module/user/controller/AuthController.java:37` |
| POST | `/api/ci-diagnostics` | 创建 CI 诊断(同时触发分析) | `CiDiagnosticController.java` | `backend-spring/src/main/java/com/sourcelens/module/ci/controller/CiDiagnosticController.java:27` |
| GET | `/api/ci-diagnostics/{id}` | CI 诊断详情 | `CiDiagnosticController.java` | `backend-spring/src/main/java/com/sourcelens/module/ci/controller/CiDiagnosticController.java:50` |
| POST | `/api/ci-diagnostics/{id}/reanalyze` | 重新分析 | `CiDiagnosticController.java` | `backend-spring/src/main/java/com/sourcelens/module/ci/controller/CiDiagnosticController.java:59` |
| DELETE | `/api/conversations/{id}` | 删除对话 | `AgentChatController.java` | `backend-spring/src/main/java/com/sourcelens/module/agent/controller/AgentChatController.java:121` |
| GET | `/api/conversations/{id}` | 对话详情 + 消息历史 | `AgentChatController.java` | `backend-spring/src/main/java/com/sourcelens/module/agent/controller/AgentChatController.java:75` |
| POST | `/api/conversations/{id}/messages` | 发送消息,返回 SSE 流 | `AgentChatController.java` | `backend-spring/src/main/java/com/sourcelens/module/agent/controller/AgentChatController.java:97` |
| GET | `/api/dashboard/recent-scans` | 获取最近扫描任务(含项目名、仓库名、耗时) | `DashboardController.java` | `backend-spring/src/main/java/com/sourcelens/module/dashboard/controller/DashboardController.java:62` |
| GET | `/api/dashboard/stats` | 获取仪表盘统计数据 | `DashboardController.java` | `backend-spring/src/main/java/com/sourcelens/module/dashboard/controller/DashboardController.java:24` |
| POST | `/api/dev/projects/{projectId}/audit-workbench-smoke-seed` | - | `AuditWorkbenchSmokeSeedController.java` | `backend-spring/src/main/java/com/sourcelens/module/audit/controller/AuditWorkbenchSmokeSeedController.java:46` |
| POST | `/api/dev/projects/{projectId}/scan-governance-smoke-seed` | - | `ScanGovernanceSmokeSeedController.java` | `backend-spring/src/main/java/com/sourcelens/module/scantask/controller/ScanGovernanceSmokeSeedController.java:55` |
| GET | `/api/health` | 健康检查 | `HealthController.java` | `backend-spring/src/main/java/com/sourcelens/module/common/HealthController.java:17` |
| POST | `/api/issue-decompositions` | 创建并执行需求拆解 | `IssueDecompositionController.java` | `backend-spring/src/main/java/com/sourcelens/module/issue/controller/IssueDecompositionController.java:30` |
| GET | `/api/issue-decompositions/{id}` | 需求拆解详情 | `IssueDecompositionController.java` | `backend-spring/src/main/java/com/sourcelens/module/issue/controller/IssueDecompositionController.java:53` |
| GET | `/api/issue-decompositions/{id}/export/markdown` | 导出 Markdown | `IssueDecompositionController.java` | `backend-spring/src/main/java/com/sourcelens/module/issue/controller/IssueDecompositionController.java:84` |
| GET | `/api/issue-decompositions/{id}/tasks` | 获取拆解后的子任务列表 | `IssueDecompositionController.java` | `backend-spring/src/main/java/com/sourcelens/module/issue/controller/IssueDecompositionController.java:62` |
| PATCH | `/api/issue-tasks/{taskId}` | 更新子任务状态 | `IssueDecompositionController.java` | `backend-spring/src/main/java/com/sourcelens/module/issue/controller/IssueDecompositionController.java:71` |
| GET | `/api/llm-configs` | 获取当前用户的 LLM 配置列表 | `LlmConfigController.java` | `backend-spring/src/main/java/com/sourcelens/module/agent/controller/LlmConfigController.java:32` |
| POST | `/api/llm-configs` | 创建 LLM 配置 | `LlmConfigController.java` | `backend-spring/src/main/java/com/sourcelens/module/agent/controller/LlmConfigController.java:25` |
| DELETE | `/api/llm-configs/{configId}` | 删除 LLM 配置 | `LlmConfigController.java` | `backend-spring/src/main/java/com/sourcelens/module/agent/controller/LlmConfigController.java:59` |
| PUT | `/api/llm-configs/{configId}` | 更新 LLM 配置 | `LlmConfigController.java` | `backend-spring/src/main/java/com/sourcelens/module/agent/controller/LlmConfigController.java:51` |
| POST | `/api/llm-configs/{configId}/activate` | 激活指定配置 | `LlmConfigController.java` | `backend-spring/src/main/java/com/sourcelens/module/agent/controller/LlmConfigController.java:44` |
| GET | `/api/llm-configs/active` | 获取当前激活的 LLM 配置 | `LlmConfigController.java` | `backend-spring/src/main/java/com/sourcelens/module/agent/controller/LlmConfigController.java:38` |
| POST | `/api/mock-llm/chat/completions` | - | `MockLlmController.java` | `backend-spring/src/main/java/com/sourcelens/module/agent/controller/MockLlmController.java:33` |
| POST | `/api/mock-llm/embeddings` | - | `MockLlmController.java` | `backend-spring/src/main/java/com/sourcelens/module/agent/controller/MockLlmController.java:61` |
| POST | `/api/mock-llm/v1/embeddings` | - | `MockLlmController.java` | `backend-spring/src/main/java/com/sourcelens/module/agent/controller/MockLlmController.java:61` |
| POST | `/api/pr-reviews` | 创建 PR 审查(同时触发分析) | `PrReviewController.java` | `backend-spring/src/main/java/com/sourcelens/module/review/controller/PrReviewController.java:30` |
| GET | `/api/pr-reviews/{id}` | PR 审查详情 | `PrReviewController.java` | `backend-spring/src/main/java/com/sourcelens/module/review/controller/PrReviewController.java:53` |
| GET | `/api/pr-reviews/{id}/comments` | 获取行级评论 | `PrReviewController.java` | `backend-spring/src/main/java/com/sourcelens/module/review/controller/PrReviewController.java:62` |
| POST | `/api/pr-reviews/{id}/reanalyze` | 重新分析 | `PrReviewController.java` | `backend-spring/src/main/java/com/sourcelens/module/review/controller/PrReviewController.java:71` |
| GET | `/api/projects` | 项目列表 | `ProjectController.java` | `backend-spring/src/main/java/com/sourcelens/module/project/controller/ProjectController.java:34` |
| POST | `/api/projects` | 创建项目 | `ProjectController.java` | `backend-spring/src/main/java/com/sourcelens/module/project/controller/ProjectController.java:27` |
| DELETE | `/api/projects/{projectId}` | 删除项目 | `ProjectController.java` | `backend-spring/src/main/java/com/sourcelens/module/project/controller/ProjectController.java:60` |
| GET | `/api/projects/{projectId}` | 项目详情 | `ProjectController.java` | `backend-spring/src/main/java/com/sourcelens/module/project/controller/ProjectController.java:45` |
| PUT | `/api/projects/{projectId}` | 更新项目 | `ProjectController.java` | `backend-spring/src/main/java/com/sourcelens/module/project/controller/ProjectController.java:52` |
| GET | `/api/projects/{projectId}/agent-tasks` | Agent 任务列表(按项目) | `AgentTaskController.java` | `backend-spring/src/main/java/com/sourcelens/module/agent/controller/AgentTaskController.java:41` |
| GET | `/api/projects/{projectId}/agent-tool-calls` | 查询项目 Agent 工具调用审计 | `AgentToolCallController.java` | `backend-spring/src/main/java/com/sourcelens/module/agent/controller/AgentToolCallController.java:30` |
| GET | `/api/projects/{projectId}/artifacts` | 查询项目运行产物索引 | `ArtifactController.java` | `backend-spring/src/main/java/com/sourcelens/module/artifact/controller/ArtifactController.java:47` |
| GET | `/api/projects/{projectId}/artifacts/{artifactId}` | 查询运行产物详情 | `ArtifactController.java` | `backend-spring/src/main/java/com/sourcelens/module/artifact/controller/ArtifactController.java:74` |
| GET | `/api/projects/{projectId}/artifacts/{artifactId}/download` | 下载运行产物 | `ArtifactController.java` | `backend-spring/src/main/java/com/sourcelens/module/artifact/controller/ArtifactController.java:102` |
| GET | `/api/projects/{projectId}/artifacts/{artifactId}/preview` | 预览运行产物文本内容 | `ArtifactController.java` | `backend-spring/src/main/java/com/sourcelens/module/artifact/controller/ArtifactController.java:85` |
| GET | `/api/projects/{projectId}/audit-logs` | 查询项目审计日志 | `AuditLogController.java` | `backend-spring/src/main/java/com/sourcelens/module/audit/controller/AuditLogController.java:30` |
| GET | `/api/projects/{projectId}/auto-repairs` | 查询项目下的所有自动补丁任务列表 | `AutoRepairController.java` | `backend-spring/src/main/java/com/sourcelens/module/autorepair/controller/AutoRepairController.java:46` |
| POST | `/api/projects/{projectId}/auto-repairs` | 创建自动补丁任务(异步) | `AutoRepairController.java` | `backend-spring/src/main/java/com/sourcelens/module/autorepair/controller/AutoRepairController.java:30` |
| GET | `/api/projects/{projectId}/auto-repairs/{id}` | 获取自动补丁任务详情 | `AutoRepairController.java` | `backend-spring/src/main/java/com/sourcelens/module/autorepair/controller/AutoRepairController.java:67` |
| POST | `/api/projects/{projectId}/auto-repairs/{id}/cancel` | 取消自动补丁任务 | `AutoRepairController.java` | `backend-spring/src/main/java/com/sourcelens/module/autorepair/controller/AutoRepairController.java:97` |
| POST | `/api/projects/{projectId}/auto-repairs/{id}/submit-pr` | 启动受控 Pull Request 创建(异步) | `AutoRepairController.java` | `backend-spring/src/main/java/com/sourcelens/module/autorepair/controller/AutoRepairController.java:85` |
| GET | `/api/projects/{projectId}/ci-diagnostics` | CI 诊断列表(按项目) | `CiDiagnosticController.java` | `backend-spring/src/main/java/com/sourcelens/module/ci/controller/CiDiagnosticController.java:37` |
| GET | `/api/projects/{projectId}/code-chunks/search` | 检索项目代码切片 | `CodeChunkController.java` | `backend-spring/src/main/java/com/sourcelens/module/analysis/controller/CodeChunkController.java:44` |
| GET | `/api/projects/{projectId}/code-chunks/status` | 读取项目代码切片状态 | `CodeChunkController.java` | `backend-spring/src/main/java/com/sourcelens/module/analysis/controller/CodeChunkController.java:95` |
| GET | `/api/projects/{projectId}/conversations` | 对话列表 | `AgentChatController.java` | `backend-spring/src/main/java/com/sourcelens/module/agent/controller/AgentChatController.java:56` |
| POST | `/api/projects/{projectId}/conversations` | 创建对话 | `AgentChatController.java` | `backend-spring/src/main/java/com/sourcelens/module/agent/controller/AgentChatController.java:37` |
| GET | `/api/projects/{projectId}/execution-tasks` | 查询项目下的统一执行任务 | `ExecutionTaskController.java` | `backend-spring/src/main/java/com/sourcelens/module/execution/controller/ExecutionTaskController.java:39` |
| GET | `/api/projects/{projectId}/execution-tasks/{taskId}` | 获取统一执行任务详情 | `ExecutionTaskController.java` | `backend-spring/src/main/java/com/sourcelens/module/execution/controller/ExecutionTaskController.java:51` |
| POST | `/api/projects/{projectId}/execution-tasks/{taskId}/cancel` | 取消统一执行任务 | `ExecutionTaskController.java` | `backend-spring/src/main/java/com/sourcelens/module/execution/controller/ExecutionTaskController.java:86` |
| GET | `/api/projects/{projectId}/execution-tasks/source/{sourceType}/{sourceId}` | 按来源获取统一执行任务详情 | `ExecutionTaskController.java` | `backend-spring/src/main/java/com/sourcelens/module/execution/controller/ExecutionTaskController.java:68` |
| GET | `/api/projects/{projectId}/github-webhook-deliveries` | 查询项目 GitHub webhook delivery | `GitHubWebhookDeliveryController.java` | `backend-spring/src/main/java/com/sourcelens/module/repository/controller/GitHubWebhookDeliveryController.java:30` |
| GET | `/api/projects/{projectId}/issue-decompositions` | 需求拆解列表(按项目) | `IssueDecompositionController.java` | `backend-spring/src/main/java/com/sourcelens/module/issue/controller/IssueDecompositionController.java:40` |
| GET | `/api/projects/{projectId}/pr-reviews` | PR 审查列表(按项目) | `PrReviewController.java` | `backend-spring/src/main/java/com/sourcelens/module/review/controller/PrReviewController.java:40` |
| POST | `/api/projects/{projectId}/qa` | 本地代码库 Q&A 问答 | `CodeQaController.java` | `backend-spring/src/main/java/com/sourcelens/module/agent/controller/CodeQaController.java:165` |
| GET | `/api/projects/{projectId}/repositories` | 项目下的仓库列表 | `RepositoryController.java` | `backend-spring/src/main/java/com/sourcelens/module/repository/controller/RepositoryController.java:40` |
| POST | `/api/projects/{projectId}/repositories` | 为项目添加仓库 | `RepositoryController.java` | `backend-spring/src/main/java/com/sourcelens/module/repository/controller/RepositoryController.java:31` |
| GET | `/api/projects/{projectId}/scan-tasks` | 项目扫描任务列表 | `ScanTaskController.java` | `backend-spring/src/main/java/com/sourcelens/module/scantask/controller/ScanTaskController.java:40` |
| GET | `/api/projects/{projectId}/scan-tasks/{scanTaskId}/governance-timeline` | 查询当前扫描的修复治理时间线 | `ScanTaskGovernanceTimelineController.java` | `backend-spring/src/main/java/com/sourcelens/module/scantask/controller/ScanTaskGovernanceTimelineController.java:27` |
| DELETE | `/api/repositories/{repositoryId}` | 删除仓库 | `RepositoryController.java` | `backend-spring/src/main/java/com/sourcelens/module/repository/controller/RepositoryController.java:67` |
| GET | `/api/repositories/{repositoryId}` | 仓库详情 | `RepositoryController.java` | `backend-spring/src/main/java/com/sourcelens/module/repository/controller/RepositoryController.java:48` |
| PUT | `/api/repositories/{repositoryId}` | 更新仓库 | `RepositoryController.java` | `backend-spring/src/main/java/com/sourcelens/module/repository/controller/RepositoryController.java:57` |
| DELETE | `/api/repositories/{repositoryId}/github-app-installation` | 禁用仓库 GitHub App installation | `RepositoryController.java` | `backend-spring/src/main/java/com/sourcelens/module/repository/controller/RepositoryController.java:97` |
| GET | `/api/repositories/{repositoryId}/github-app-installation` | 获取仓库 GitHub App installation | `RepositoryController.java` | `backend-spring/src/main/java/com/sourcelens/module/repository/controller/RepositoryController.java:88` |
| PUT | `/api/repositories/{repositoryId}/github-app-installation` | 绑定 GitHub App installation | `RepositoryController.java` | `backend-spring/src/main/java/com/sourcelens/module/repository/controller/RepositoryController.java:77` |
| POST | `/api/repositories/{repositoryId}/scan-tasks` | 创建扫描任务 | `ScanTaskController.java` | `backend-spring/src/main/java/com/sourcelens/module/scantask/controller/ScanTaskController.java:29` |
| GET | `/api/scan-tasks/{scanTaskId}` | 扫描任务详情 | `ScanTaskController.java` | `backend-spring/src/main/java/com/sourcelens/module/scantask/controller/ScanTaskController.java:52` |
| GET | `/api/scan-tasks/{scanTaskId}/artifacts` | 获取扫描任务的所有分析产物 | `AnalysisController.java` | `backend-spring/src/main/java/com/sourcelens/module/analysis/controller/AnalysisController.java:33` |
| GET | `/api/scan-tasks/{scanTaskId}/artifacts/{artifactType}` | 获取指定类型的分析产物 | `AnalysisController.java` | `backend-spring/src/main/java/com/sourcelens/module/analysis/controller/AnalysisController.java:49` |
| POST | `/api/scan-tasks/{scanTaskId}/cancel` | 取消扫描任务 | `ScanTaskController.java` | `backend-spring/src/main/java/com/sourcelens/module/scantask/controller/ScanTaskController.java:61` |
| GET | `/api/scan-tasks/{scanTaskId}/graph` | 获取完整依赖图谱 | `GraphController.java` | `backend-spring/src/main/java/com/sourcelens/module/analysis/controller/GraphController.java:52` |
| GET | `/api/scan-tasks/{scanTaskId}/relations` | 获取代码关系列表 | `GraphController.java` | `backend-spring/src/main/java/com/sourcelens/module/analysis/controller/GraphController.java:41` |
| GET | `/api/scan-tasks/{scanTaskId}/symbols` | 获取代码符号列表 | `GraphController.java` | `backend-spring/src/main/java/com/sourcelens/module/analysis/controller/GraphController.java:30` |
| POST | `/api/webhooks/github/app` | - | `GitHubAppWebhookController.java` | `backend-spring/src/main/java/com/sourcelens/module/repository/controller/GitHubAppWebhookController.java:24` |

## 5. 前端路由与页面入口

| Route | Component | 位置 |
| --- | --- | --- |
| `/login` | `Login` | `web-console/src/App.tsx:40` |
| `/register` | `Register` | `web-console/src/App.tsx:41` |
| `/` | `ProtectedRoute` | `web-console/src/App.tsx:42` |
| `(index)` | `WorkPerspectiveEntry` | `web-console/src/App.tsx:43` |
| `dashboard` | `Dashboard` | `web-console/src/App.tsx:44` |
| `projects` | `Projects` | `web-console/src/App.tsx:45` |
| `projects/:id` | `ProjectDetail` | `web-console/src/App.tsx:46` |
| `scan-tasks/:id` | `ScanTaskDetail` | `web-console/src/App.tsx:47` |
| `agent-tasks` | `AgentTasksPage` | `web-console/src/App.tsx:48` |
| `execution-tasks` | `ExecutionTasksPage` | `web-console/src/App.tsx:49` |
| `artifacts` | `ArtifactsPage` | `web-console/src/App.tsx:50` |
| `audit-logs` | `AuditLogsPage` | `web-console/src/App.tsx:51` |
| `model-config` | `ModelConfig` | `web-console/src/App.tsx:52` |
| `issue-decomposition` | `IssueDecompositionPage` | `web-console/src/App.tsx:53` |
| `ci-diagnostics` | `CiDiagnosticsPage` | `web-console/src/App.tsx:54` |
| `pr-reviews` | `PrReviewsPage` | `web-console/src/App.tsx:55` |
| `auto-repairs` | `AutoRepairsPage` | `web-console/src/App.tsx:56` |
| `agent-chat` | `AgentChat` | `web-console/src/App.tsx:57` |
| `agent-chat/:conversationId` | `AgentChat` | `web-console/src/App.tsx:58` |

## 6. 前端 API Client 调用索引

当前从 `web-console/src/api` 静态检测到 80 个直接 HTTP 调用。模板字符串会保留原始形式，便于和后端 route 对齐。

| Method | Path/Template | 文件 |
| --- | --- | --- |
| POST | `/agent-tasks` | `web-console/src/api/agentTask.ts` |
| GET | `/projects/${projectId}/agent-tasks?${params}` | `web-console/src/api/agentTask.ts` |
| GET | `/agent-tasks/${taskId}` | `web-console/src/api/agentTask.ts` |
| POST | `/agent-tasks/${taskId}/start` | `web-console/src/api/agentTask.ts` |
| POST | `/agent-tasks/${taskId}/complete` | `web-console/src/api/agentTask.ts` |
| POST | `/agent-tasks/${taskId}/cancel` | `web-console/src/api/agentTask.ts` |
| GET | `/agent-tasks/${taskId}/steps` | `web-console/src/api/agentTask.ts` |
| POST | `/agent-tasks/${taskId}/steps` | `web-console/src/api/agentTask.ts` |
| PATCH | `/agent-steps/${stepId}` | `web-console/src/api/agentTask.ts` |
| GET | `/projects/${projectId}/agent-tool-calls` | `web-console/src/api/agentToolCall.ts` |
| GET | `/scan-tasks/${scanTaskId}/artifacts` | `web-console/src/api/analysis.ts` |
| GET | `/scan-tasks/${scanTaskId}/artifacts/${artifactType}` | `web-console/src/api/analysis.ts` |
| GET | `/scan-tasks/${scanTaskId}/symbols${params}` | `web-console/src/api/analysis.ts` |
| GET | `/scan-tasks/${scanTaskId}/relations${params}` | `web-console/src/api/analysis.ts` |
| GET | `/scan-tasks/${scanTaskId}/graph` | `web-console/src/api/analysis.ts` |
| GET | `/projects/${projectId}/artifacts` | `web-console/src/api/artifact.ts` |
| GET | `/projects/${projectId}/artifacts/${artifactId}` | `web-console/src/api/artifact.ts` |
| GET | `/projects/${projectId}/artifacts/${artifactId}/preview` | `web-console/src/api/artifact.ts` |
| GET | `/projects/${projectId}/artifacts/${artifactId}/download` | `web-console/src/api/artifact.ts` |
| GET | `/projects/${projectId}/audit-logs` | `web-console/src/api/audit.ts` |
| POST | `/auth/register` | `web-console/src/api/auth.ts` |
| POST | `/auth/login` | `web-console/src/api/auth.ts` |
| GET | `/auth/me` | `web-console/src/api/auth.ts` |
| POST | `/projects/${projectId}/auto-repairs` | `web-console/src/api/autoRepair.ts` |
| GET | `/projects/${projectId}/auto-repairs` | `web-console/src/api/autoRepair.ts` |
| GET | `/projects/${projectId}/auto-repairs/${id}` | `web-console/src/api/autoRepair.ts` |
| POST | `/projects/${projectId}/auto-repairs/${id}/submit-pr` | `web-console/src/api/autoRepair.ts` |
| POST | `/projects/${projectId}/auto-repairs/${id}/cancel` | `web-console/src/api/autoRepair.ts` |
| POST | `/ci-diagnostics` | `web-console/src/api/ciDiagnostic.ts` |
| GET | `/projects/${projectId}/ci-diagnostics?${params}` | `web-console/src/api/ciDiagnostic.ts` |
| GET | `/ci-diagnostics/${id}` | `web-console/src/api/ciDiagnostic.ts` |
| POST | `/ci-diagnostics/${id}/reanalyze` | `web-console/src/api/ciDiagnostic.ts` |
| GET | `/projects/${projectId}/code-chunks/search` | `web-console/src/api/codeChunk.ts` |
| GET | `/projects/${projectId}/code-chunks/status` | `web-console/src/api/codeChunk.ts` |
| POST | `/projects/${projectId}/conversations` | `web-console/src/api/conversation.ts` |
| GET | `/projects/${projectId}/conversations?page=${page}&pageSize=${pageSize}` | `web-console/src/api/conversation.ts` |
| GET | `/conversations/${id}` | `web-console/src/api/conversation.ts` |
| DELETE | `/conversations/${id}` | `web-console/src/api/conversation.ts` |
| POST | `/api/conversations/${conversationId}/messages` | `web-console/src/api/conversation.ts` |
| GET | `/dashboard/stats` | `web-console/src/api/dashboard.ts` |
| GET | `/dashboard/recent-scans` | `web-console/src/api/dashboard.ts` |
| GET | `/projects/${projectId}/execution-tasks` | `web-console/src/api/executionTask.ts` |
| GET | `/projects/${projectId}/execution-tasks/${taskId}` | `web-console/src/api/executionTask.ts` |
| GET | `/projects/${projectId}/execution-tasks/source/${sourceType}/${sourceId}` | `web-console/src/api/executionTask.ts` |
| POST | `/projects/${projectId}/execution-tasks/${taskId}/cancel` | `web-console/src/api/executionTask.ts` |
| POST | `/issue-decompositions` | `web-console/src/api/issueDecomposition.ts` |
| GET | `/projects/${projectId}/issue-decompositions?${params}` | `web-console/src/api/issueDecomposition.ts` |
| GET | `/issue-decompositions/${id}` | `web-console/src/api/issueDecomposition.ts` |
| GET | `/issue-decompositions/${id}/tasks` | `web-console/src/api/issueDecomposition.ts` |
| PATCH | `/issue-tasks/${taskId}?status=${status}` | `web-console/src/api/issueDecomposition.ts` |
| GET | `/issue-decompositions/${id}/export/markdown` | `web-console/src/api/issueDecomposition.ts` |
| GET | `/llm-configs` | `web-console/src/api/modelConfig.ts` |
| GET | `/llm-configs/active` | `web-console/src/api/modelConfig.ts` |
| POST | `/llm-configs` | `web-console/src/api/modelConfig.ts` |
| PUT | `/llm-configs/${configId}` | `web-console/src/api/modelConfig.ts` |
| POST | `/llm-configs/${configId}/activate` | `web-console/src/api/modelConfig.ts` |
| DELETE | `/llm-configs/${configId}` | `web-console/src/api/modelConfig.ts` |
| GET | `/projects` | `web-console/src/api/project.ts` |
| POST | `/projects` | `web-console/src/api/project.ts` |
| GET | `/projects/${id}` | `web-console/src/api/project.ts` |
| PUT | `/projects/${id}` | `web-console/src/api/project.ts` |
| DELETE | `/projects/${id}` | `web-console/src/api/project.ts` |
| POST | `/projects/${projectId}/qa` | `web-console/src/api/project.ts` |
| POST | `/pr-reviews` | `web-console/src/api/prReview.ts` |
| GET | `/projects/${projectId}/pr-reviews?${params}` | `web-console/src/api/prReview.ts` |
| GET | `/pr-reviews/${id}` | `web-console/src/api/prReview.ts` |
| GET | `/pr-reviews/${id}/comments` | `web-console/src/api/prReview.ts` |
| POST | `/pr-reviews/${id}/reanalyze` | `web-console/src/api/prReview.ts` |
| GET | `/projects/${projectId}/repositories` | `web-console/src/api/repository.ts` |
| POST | `/projects/${projectId}/repositories` | `web-console/src/api/repository.ts` |
| GET | `/repositories/${id}` | `web-console/src/api/repository.ts` |
| PUT | `/repositories/${id}` | `web-console/src/api/repository.ts` |
| DELETE | `/repositories/${id}` | `web-console/src/api/repository.ts` |
| GET | `/repositories/${id}/github-app-installation` | `web-console/src/api/repository.ts` |
| PUT | `/repositories/${id}/github-app-installation` | `web-console/src/api/repository.ts` |
| DELETE | `/repositories/${id}/github-app-installation` | `web-console/src/api/repository.ts` |
| POST | `/repositories/${repositoryId}/scan-tasks` | `web-console/src/api/scanTask.ts` |
| GET | `/projects/${projectId}/scan-tasks` | `web-console/src/api/scanTask.ts` |
| GET | `/scan-tasks/${id}` | `web-console/src/api/scanTask.ts` |
| POST | `/scan-tasks/${id}/cancel` | `web-console/src/api/scanTask.ts` |

## 7. 逐文件作用索引

该章节只说明每个文件的用途，不展开符号、依赖、行数和实现细节，避免把代码地图变成高维护成本的审计报告。

### .dockerignore

| 文件 | 作用 |
| --- | --- |
| `.dockerignore` | 定义 Docker build context 忽略规则，避免把本地依赖、证据包、runtime 和密钥打进镜像。 |

### .github

| 文件 | 作用 |
| --- | --- |
| `.github/CODEOWNERS` | 项目文件。 |
| `.github/ISSUE_TEMPLATE/bug_report.md` | Markdown 文档。 |
| `.github/ISSUE_TEMPLATE/config.yml` | YAML 配置文件。 |
| `.github/ISSUE_TEMPLATE/docs_governance.md` | Markdown 文档。 |
| `.github/ISSUE_TEMPLATE/feature_request.md` | Markdown 文档。 |
| `.github/ISSUE_TEMPLATE/security_boundary.md` | Markdown 文档。 |
| `.github/ISSUE_TEMPLATE/ui_issue.md` | Markdown 文档。 |
| `.github/PULL_REQUEST_TEMPLATE.md` | Markdown 文档。 |
| `.github/workflows/ci.yml` | GitHub Actions CI 工作流，负责 PR/push 的安全、后端、前端、Rust、Docker 和 release evidence CI profile 验证。 |

### .gitignore

| 文件 | 作用 |
| --- | --- |
| `.gitignore` | 定义 Git 忽略规则，排除本地依赖、构建产物、runtime、release evidence 和密钥文件。 |

### .idea

| 文件 | 作用 |
| --- | --- |
| `.idea/.gitignore` | 本地 IDE 配置文件，不属于产品能力；用于编辑器项目识别、代码风格或本机工作区状态。 |
| `.idea/compiler.xml` | 本地 IDE 配置文件，不属于产品能力；用于编辑器项目识别、代码风格或本机工作区状态。 |
| `.idea/misc.xml` | 本地 IDE 配置文件，不属于产品能力；用于编辑器项目识别、代码风格或本机工作区状态。 |
| `.idea/modules.xml` | 本地 IDE 配置文件，不属于产品能力；用于编辑器项目识别、代码风格或本机工作区状态。 |
| `.idea/SourceLens.iml` | 本地 IDE 配置文件，不属于产品能力；用于编辑器项目识别、代码风格或本机工作区状态。 |
| `.idea/vcs.xml` | 本地 IDE 配置文件，不属于产品能力；用于编辑器项目识别、代码风格或本机工作区状态。 |
| `.idea/workspace.xml` | 本地 IDE 配置文件，不属于产品能力；用于编辑器项目识别、代码风格或本机工作区状态。 |

### .vscode

| 文件 | 作用 |
| --- | --- |
| `.vscode/settings.json` | 本地 IDE 配置文件，不属于产品能力；用于编辑器项目识别、代码风格或本机工作区状态。 |

### analyzer-rust

| 文件 | 作用 |
| --- | --- |
| `analyzer-rust/.cargo/config.toml` | Rust analyzer 工程文件。 |
| `analyzer-rust/Cargo.lock` | Rust 依赖锁定文件，保证 analyzer 构建依赖版本可复现。 |
| `analyzer-rust/Cargo.toml` | Rust analyzer crate 配置，声明 analyzer CLI 的包信息、依赖和构建参数。 |
| `analyzer-rust/src/ast_extractor.rs` | AST 抽取模块，围绕 Tree-sitter/语法结构提取函数、类、调用等细粒度信息。 |
| `analyzer-rust/src/framework.rs` | 框架识别与质量信号模块，根据项目文件和依赖判断后端/前端/构建技术特征。 |
| `analyzer-rust/src/main.rs` | Rust analyzer CLI 入口，读取扫描参数、调用扫描/逆向分析模块并输出 JSON 结果。 |
| `analyzer-rust/src/models.rs` | Rust analyzer 输入输出数据模型，定义扫描结果、符号、关系、风险等 JSON schema。 |
| `analyzer-rust/src/reverse.rs` | 逆向分析模块，抽取符号、关系和架构线索，为报告和代码图谱提供输入。 |
| `analyzer-rust/src/scanner.rs` | 仓库文件扫描核心，负责遍历文件、统计语言/行数、过滤无关目录并生成扫描摘要。 |
| `analyzer-rust/tests/scan_contract.rs` | Rust analyzer 合同测试，验证扫描输出结构、关键字段和兼容性。 |

### backend-spring

| 文件 | 作用 |
| --- | --- |
| `backend-spring/.dockerignore` | Spring Boot 后端源码文件。 |
| `backend-spring/Dockerfile` | 后端容器镜像定义，用于构建可部署的 Spring Boot backend runtime。 |
| `backend-spring/pom.xml` | Spring Boot 后端 Maven 配置，声明 Java 17、Spring/MyBatis/Flyway/JGit/OpenAPI/Test 等依赖和构建插件。 |
| `backend-spring/src/main/java/com/sourcelens/common/config/AsyncConfig.java` | 后端公共配置，包含异步执行、CORS、安全启动校验、加密器和 MyBatis Plus 配置。 |
| `backend-spring/src/main/java/com/sourcelens/common/config/CorsConfig.java` | 后端公共配置，包含异步执行、CORS、安全启动校验、加密器和 MyBatis Plus 配置。 |
| `backend-spring/src/main/java/com/sourcelens/common/config/SecurityStartupValidator.java` | 后端公共配置，包含异步执行、CORS、安全启动校验、加密器和 MyBatis Plus 配置。 |
| `backend-spring/src/main/java/com/sourcelens/common/config/TokenEncryptorConfig.java` | 后端公共配置，包含异步执行、CORS、安全启动校验、加密器和 MyBatis Plus 配置。 |
| `backend-spring/src/main/java/com/sourcelens/common/exception/BizException.java` | 后端异常模型和全局异常处理，统一业务错误、请求 ID 和错误响应。 |
| `backend-spring/src/main/java/com/sourcelens/common/exception/GlobalExceptionHandler.java` | 后端异常模型和全局异常处理，统一业务错误、请求 ID 和错误响应。 |
| `backend-spring/src/main/java/com/sourcelens/common/MyBatisPlusConfig.java` | Spring Boot 后端源码文件。 |
| `backend-spring/src/main/java/com/sourcelens/common/observability/SourceLensMetrics.java` | 后端可观测性指标封装，记录任务、扫描、审计或其他业务度量。 |
| `backend-spring/src/main/java/com/sourcelens/common/PageResult.java` | Spring Boot 后端源码文件。 |
| `backend-spring/src/main/java/com/sourcelens/common/Result.java` | Spring Boot 后端源码文件。 |
| `backend-spring/src/main/java/com/sourcelens/common/security/JwtAuthFilter.java` | 后端安全基础设施，覆盖 JWT、认证过滤、denylist、敏感数据脱敏、token 加密和用户参数解析。 |
| `backend-spring/src/main/java/com/sourcelens/common/security/JwtDenylistService.java` | 后端安全基础设施，覆盖 JWT、认证过滤、denylist、敏感数据脱敏、token 加密和用户参数解析。 |
| `backend-spring/src/main/java/com/sourcelens/common/security/JwtUtil.java` | 后端安全基础设施，覆盖 JWT、认证过滤、denylist、敏感数据脱敏、token 加密和用户参数解析。 |
| `backend-spring/src/main/java/com/sourcelens/common/security/SecurityConfig.java` | 后端安全基础设施，覆盖 JWT、认证过滤、denylist、敏感数据脱敏、token 加密和用户参数解析。 |
| `backend-spring/src/main/java/com/sourcelens/common/security/SensitiveDataSanitizer.java` | 后端安全基础设施，覆盖 JWT、认证过滤、denylist、敏感数据脱敏、token 加密和用户参数解析。 |
| `backend-spring/src/main/java/com/sourcelens/common/security/TokenEncryptor.java` | 后端安全基础设施，覆盖 JWT、认证过滤、denylist、敏感数据脱敏、token 加密和用户参数解析。 |
| `backend-spring/src/main/java/com/sourcelens/common/security/UserIdArgumentResolver.java` | 后端安全基础设施，覆盖 JWT、认证过滤、denylist、敏感数据脱敏、token 加密和用户参数解析。 |
| `backend-spring/src/main/java/com/sourcelens/common/web/RequestIdFilter.java` | Spring Boot 后端源码文件。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/controller/AgentChatController.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 Controller 暴露 REST 接口并把请求转给 service 层。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/controller/AgentTaskController.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 Controller 暴露 REST 接口并把请求转给 service 层。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/controller/AgentToolCallController.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 Controller 暴露 REST 接口并把请求转给 service 层。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/controller/CodeQaController.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 Controller 暴露 REST 接口并把请求转给 service 层。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/controller/LlmConfigController.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 Controller 暴露 REST 接口并把请求转给 service 层。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/controller/MockLlmController.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 Controller 暴露 REST 接口并把请求转给 service 层。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/dto/AddStepRequest.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 DTO 定义请求/响应数据契约。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/dto/CodeQaCitation.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 DTO 定义请求/响应数据契约。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/dto/CodeQaCitationCoverage.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 DTO 定义请求/响应数据契约。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/dto/CodeQaClaimCitationCoverage.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 DTO 定义请求/响应数据契约。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/dto/CodeQaRequest.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 DTO 定义请求/响应数据契约。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/dto/CodeQaResponse.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 DTO 定义请求/响应数据契约。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/dto/CodeQaRetrievalPlan.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 DTO 定义请求/响应数据契约。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/dto/CompleteTaskRequest.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 DTO 定义请求/响应数据契约。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/dto/CreateAgentTaskRequest.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 DTO 定义请求/响应数据契约。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/dto/LlmConfigRequest.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 DTO 定义请求/响应数据契约。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/dto/LlmConfigResponse.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 DTO 定义请求/响应数据契约。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/dto/UpdateStepRequest.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 DTO 定义请求/响应数据契约。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/entity/AgentTask.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 Entity 映射数据库表结构。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/entity/AgentTaskStep.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 Entity 映射数据库表结构。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/entity/AgentToolCall.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 Entity 映射数据库表结构。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/entity/Conversation.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 Entity 映射数据库表结构。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/entity/ConversationMessage.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 Entity 映射数据库表结构。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/entity/LlmConfig.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 Entity 映射数据库表结构。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/mapper/AgentTaskMapper.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 Mapper 负责 MyBatis-Plus 数据访问。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/mapper/AgentTaskStepMapper.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 Mapper 负责 MyBatis-Plus 数据访问。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/mapper/AgentToolCallMapper.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 Mapper 负责 MyBatis-Plus 数据访问。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/mapper/ConversationMapper.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 Mapper 负责 MyBatis-Plus 数据访问。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/mapper/ConversationMessageMapper.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 Mapper 负责 MyBatis-Plus 数据访问。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/mapper/LlmConfigMapper.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 Mapper 负责 MyBatis-Plus 数据访问。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/service/AgentRuntime.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/service/AgentTaskService.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/service/AgentToolCallService.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/service/CodeQaRetrievalService.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/service/LlmClient.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/service/LlmConfigService.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/service/LlmEndpointPolicy.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/service/LlmJsonExtractor.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/service/LlmProviderAdapter.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/service/MockLlmProviderAdapter.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/service/OpenAiCompatibleLlmProviderAdapter.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/service/ProjectContextBuilder.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/service/PromptBuilder.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/service/PromptInjectionGuard.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/service/ToolExecutionService.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/tool/AgentTool.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 Agent Tool 定义 Agent 可调用的工具能力、参数校验或执行结果。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/tool/AgentToolArgumentUtils.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 Agent Tool 定义 Agent 可调用的工具能力、参数校验或执行结果。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/tool/GetSymbolsTool.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 Agent Tool 定义 Agent 可调用的工具能力、参数校验或执行结果。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/tool/ListDirTool.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 Agent Tool 定义 Agent 可调用的工具能力、参数校验或执行结果。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/tool/ReadFileTool.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 Agent Tool 定义 Agent 可调用的工具能力、参数校验或执行结果。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/tool/SearchCodeTool.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 Agent Tool 定义 Agent 可调用的工具能力、参数校验或执行结果。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/tool/ShellExecTool.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 Agent Tool 定义 Agent 可调用的工具能力、参数校验或执行结果。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/tool/ToolContext.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 Agent Tool 定义 Agent 可调用的工具能力、参数校验或执行结果。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/tool/ToolPermissionLevel.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 Agent Tool 定义 Agent 可调用的工具能力、参数校验或执行结果。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/tool/ToolRegistry.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 Agent Tool 定义 Agent 可调用的工具能力、参数校验或执行结果。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/tool/ToolResult.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 Agent Tool 定义 Agent 可调用的工具能力、参数校验或执行结果。 |
| `backend-spring/src/main/java/com/sourcelens/module/agent/tool/WriteFileTool.java` | Agent 任务、对话、工具调用审计、Code QA、LLM provider 适配。该 Agent Tool 定义 Agent 可调用的工具能力、参数校验或执行结果。 |
| `backend-spring/src/main/java/com/sourcelens/module/analysis/AnalyzerRunner.java` | 分析器运行、scan artifact、code_chunks、图谱、代码定位和报告构建。该文件属于 analysis 模块的后端实现。 |
| `backend-spring/src/main/java/com/sourcelens/module/analysis/controller/AnalysisController.java` | 分析器运行、scan artifact、code_chunks、图谱、代码定位和报告构建。该 Controller 暴露 REST 接口并把请求转给 service 层。 |
| `backend-spring/src/main/java/com/sourcelens/module/analysis/controller/CodeChunkController.java` | 分析器运行、scan artifact、code_chunks、图谱、代码定位和报告构建。该 Controller 暴露 REST 接口并把请求转给 service 层。 |
| `backend-spring/src/main/java/com/sourcelens/module/analysis/controller/GraphController.java` | 分析器运行、scan artifact、code_chunks、图谱、代码定位和报告构建。该 Controller 暴露 REST 接口并把请求转给 service 层。 |
| `backend-spring/src/main/java/com/sourcelens/module/analysis/dto/CodeChunkSearchItem.java` | 分析器运行、scan artifact、code_chunks、图谱、代码定位和报告构建。该 DTO 定义请求/响应数据契约。 |
| `backend-spring/src/main/java/com/sourcelens/module/analysis/dto/CodeChunkSearchResponse.java` | 分析器运行、scan artifact、code_chunks、图谱、代码定位和报告构建。该 DTO 定义请求/响应数据契约。 |
| `backend-spring/src/main/java/com/sourcelens/module/analysis/dto/CodeChunkStatusCounts.java` | 分析器运行、scan artifact、code_chunks、图谱、代码定位和报告构建。该 DTO 定义请求/响应数据契约。 |
| `backend-spring/src/main/java/com/sourcelens/module/analysis/dto/CodeEvidenceProfile.java` | 分析器运行、scan artifact、code_chunks、图谱、代码定位和报告构建。该 DTO 定义请求/响应数据契约。 |
| `backend-spring/src/main/java/com/sourcelens/module/analysis/dto/ScanArtifactResponse.java` | 分析器运行、scan artifact、code_chunks、图谱、代码定位和报告构建。该 DTO 定义请求/响应数据契约。 |
| `backend-spring/src/main/java/com/sourcelens/module/analysis/entity/CodeChunk.java` | 分析器运行、scan artifact、code_chunks、图谱、代码定位和报告构建。该 Entity 映射数据库表结构。 |
| `backend-spring/src/main/java/com/sourcelens/module/analysis/entity/CodeRelationEntity.java` | 分析器运行、scan artifact、code_chunks、图谱、代码定位和报告构建。该 Entity 映射数据库表结构。 |
| `backend-spring/src/main/java/com/sourcelens/module/analysis/entity/CodeSymbol.java` | 分析器运行、scan artifact、code_chunks、图谱、代码定位和报告构建。该 Entity 映射数据库表结构。 |
| `backend-spring/src/main/java/com/sourcelens/module/analysis/entity/ScanArtifact.java` | 分析器运行、scan artifact、code_chunks、图谱、代码定位和报告构建。该 Entity 映射数据库表结构。 |
| `backend-spring/src/main/java/com/sourcelens/module/analysis/mapper/CodeChunkMapper.java` | 分析器运行、scan artifact、code_chunks、图谱、代码定位和报告构建。该 Mapper 负责 MyBatis-Plus 数据访问。 |
| `backend-spring/src/main/java/com/sourcelens/module/analysis/mapper/CodeRelationMapper.java` | 分析器运行、scan artifact、code_chunks、图谱、代码定位和报告构建。该 Mapper 负责 MyBatis-Plus 数据访问。 |
| `backend-spring/src/main/java/com/sourcelens/module/analysis/mapper/CodeSymbolMapper.java` | 分析器运行、scan artifact、code_chunks、图谱、代码定位和报告构建。该 Mapper 负责 MyBatis-Plus 数据访问。 |
| `backend-spring/src/main/java/com/sourcelens/module/analysis/mapper/ScanArtifactMapper.java` | 分析器运行、scan artifact、code_chunks、图谱、代码定位和报告构建。该 Mapper 负责 MyBatis-Plus 数据访问。 |
| `backend-spring/src/main/java/com/sourcelens/module/analysis/ScanResultSchemaValidator.java` | 分析器运行、scan artifact、code_chunks、图谱、代码定位和报告构建。该文件属于 analysis 模块的后端实现。 |
| `backend-spring/src/main/java/com/sourcelens/module/analysis/service/AnalysisArtifactBuilder.java` | 分析器运行、scan artifact、code_chunks、图谱、代码定位和报告构建。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/analysis/service/AnalysisArtifactPersistenceService.java` | 分析器运行、scan artifact、code_chunks、图谱、代码定位和报告构建。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/analysis/service/AnalysisService.java` | 分析器运行、scan artifact、code_chunks、图谱、代码定位和报告构建。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/analysis/service/ArchitectureRiskAnalyzer.java` | 分析器运行、scan artifact、code_chunks、图谱、代码定位和报告构建。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/analysis/service/CodeChunkFileFilter.java` | 分析器运行、scan artifact、code_chunks、图谱、代码定位和报告构建。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/analysis/service/CodeChunkRanker.java` | 分析器运行、scan artifact、code_chunks、图谱、代码定位和报告构建。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/analysis/service/CodeChunkService.java` | 分析器运行、scan artifact、code_chunks、图谱、代码定位和报告构建。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/analysis/service/CodeEvidenceProfileService.java` | 分析器运行、scan artifact、code_chunks、图谱、代码定位和报告构建。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/analysis/service/CodeGraphPersistenceService.java` | 分析器运行、scan artifact、code_chunks、图谱、代码定位和报告构建。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/analysis/service/CodeLocationHintParser.java` | 分析器运行、scan artifact、code_chunks、图谱、代码定位和报告构建。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/analysis/service/GraphService.java` | 分析器运行、scan artifact、code_chunks、图谱、代码定位和报告构建。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/analysis/service/JavaAstParser.java` | 分析器运行、scan artifact、code_chunks、图谱、代码定位和报告构建。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/analysis/service/JavaFallbackAnalyzer.java` | 分析器运行、scan artifact、code_chunks、图谱、代码定位和报告构建。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/artifact/controller/ArtifactController.java` | 产物记录、预览、下载、审计凭证和保留策略。该 Controller 暴露 REST 接口并把请求转给 service 层。 |
| `backend-spring/src/main/java/com/sourcelens/module/artifact/dto/ArtifactPreviewResponse.java` | 产物记录、预览、下载、审计凭证和保留策略。该 DTO 定义请求/响应数据契约。 |
| `backend-spring/src/main/java/com/sourcelens/module/artifact/dto/ArtifactRecordResponse.java` | 产物记录、预览、下载、审计凭证和保留策略。该 DTO 定义请求/响应数据契约。 |
| `backend-spring/src/main/java/com/sourcelens/module/artifact/entity/ArtifactRecord.java` | 产物记录、预览、下载、审计凭证和保留策略。该 Entity 映射数据库表结构。 |
| `backend-spring/src/main/java/com/sourcelens/module/artifact/mapper/ArtifactRecordMapper.java` | 产物记录、预览、下载、审计凭证和保留策略。该 Mapper 负责 MyBatis-Plus 数据访问。 |
| `backend-spring/src/main/java/com/sourcelens/module/artifact/service/ArtifactRetentionService.java` | 产物记录、预览、下载、审计凭证和保留策略。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/artifact/service/ArtifactStorageService.java` | 产物记录、预览、下载、审计凭证和保留策略。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/audit/controller/AuditLogController.java` | 审计日志、审计工作台和安全治理留痕。该 Controller 暴露 REST 接口并把请求转给 service 层。 |
| `backend-spring/src/main/java/com/sourcelens/module/audit/controller/AuditWorkbenchSmokeSeedController.java` | 审计日志、审计工作台和安全治理留痕。该 Controller 暴露 REST 接口并把请求转给 service 层。 |
| `backend-spring/src/main/java/com/sourcelens/module/audit/entity/AuditLog.java` | 审计日志、审计工作台和安全治理留痕。该 Entity 映射数据库表结构。 |
| `backend-spring/src/main/java/com/sourcelens/module/audit/mapper/AuditLogMapper.java` | 审计日志、审计工作台和安全治理留痕。该 Mapper 负责 MyBatis-Plus 数据访问。 |
| `backend-spring/src/main/java/com/sourcelens/module/audit/service/AuditLogService.java` | 审计日志、审计工作台和安全治理留痕。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/audit/service/AuditRetentionService.java` | 审计日志、审计工作台和安全治理留痕。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/autorepair/controller/AutoRepairController.java` | AutoRepair 候选、补丁、PR 提交流程和修复门禁。该 Controller 暴露 REST 接口并把请求转给 service 层。 |
| `backend-spring/src/main/java/com/sourcelens/module/autorepair/dto/AutoRepairRequest.java` | AutoRepair 候选、补丁、PR 提交流程和修复门禁。该 DTO 定义请求/响应数据契约。 |
| `backend-spring/src/main/java/com/sourcelens/module/autorepair/entity/AutoRepair.java` | AutoRepair 候选、补丁、PR 提交流程和修复门禁。该 Entity 映射数据库表结构。 |
| `backend-spring/src/main/java/com/sourcelens/module/autorepair/mapper/AutoRepairMapper.java` | AutoRepair 候选、补丁、PR 提交流程和修复门禁。该 Mapper 负责 MyBatis-Plus 数据访问。 |
| `backend-spring/src/main/java/com/sourcelens/module/autorepair/service/AutoRepairPatchPolicy.java` | AutoRepair 候选、补丁、PR 提交流程和修复门禁。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/autorepair/service/AutoRepairPrService.java` | AutoRepair 候选、补丁、PR 提交流程和修复门禁。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/autorepair/service/AutoRepairService.java` | AutoRepair 候选、补丁、PR 提交流程和修复门禁。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/ci/controller/CiDiagnosticController.java` | CI 诊断记录和复分析入口。该 Controller 暴露 REST 接口并把请求转给 service 层。 |
| `backend-spring/src/main/java/com/sourcelens/module/ci/dto/CreateCiDiagnosticRequest.java` | CI 诊断记录和复分析入口。该 DTO 定义请求/响应数据契约。 |
| `backend-spring/src/main/java/com/sourcelens/module/ci/entity/CiDiagnostic.java` | CI 诊断记录和复分析入口。该 Entity 映射数据库表结构。 |
| `backend-spring/src/main/java/com/sourcelens/module/ci/mapper/CiDiagnosticMapper.java` | CI 诊断记录和复分析入口。该 Mapper 负责 MyBatis-Plus 数据访问。 |
| `backend-spring/src/main/java/com/sourcelens/module/ci/service/CiDiagnosticService.java` | CI 诊断记录和复分析入口。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/common/HealthController.java` | 模块级健康检查和共享后端能力。该文件属于 common 模块的后端实现。 |
| `backend-spring/src/main/java/com/sourcelens/module/dashboard/controller/DashboardController.java` | 控制台统计、最近扫描和下一步建议。该 Controller 暴露 REST 接口并把请求转给 service 层。 |
| `backend-spring/src/main/java/com/sourcelens/module/execution/controller/ExecutionTaskController.java` | 执行任务、attempt、step、log 和取消流程。该 Controller 暴露 REST 接口并把请求转给 service 层。 |
| `backend-spring/src/main/java/com/sourcelens/module/execution/dto/ExecutionTaskDetailResponse.java` | 执行任务、attempt、step、log 和取消流程。该 DTO 定义请求/响应数据契约。 |
| `backend-spring/src/main/java/com/sourcelens/module/execution/entity/ExecutionAttempt.java` | 执行任务、attempt、step、log 和取消流程。该 Entity 映射数据库表结构。 |
| `backend-spring/src/main/java/com/sourcelens/module/execution/entity/ExecutionLog.java` | 执行任务、attempt、step、log 和取消流程。该 Entity 映射数据库表结构。 |
| `backend-spring/src/main/java/com/sourcelens/module/execution/entity/ExecutionStep.java` | 执行任务、attempt、step、log 和取消流程。该 Entity 映射数据库表结构。 |
| `backend-spring/src/main/java/com/sourcelens/module/execution/entity/ExecutionTask.java` | 执行任务、attempt、step、log 和取消流程。该 Entity 映射数据库表结构。 |
| `backend-spring/src/main/java/com/sourcelens/module/execution/mapper/ExecutionAttemptMapper.java` | 执行任务、attempt、step、log 和取消流程。该 Mapper 负责 MyBatis-Plus 数据访问。 |
| `backend-spring/src/main/java/com/sourcelens/module/execution/mapper/ExecutionLogMapper.java` | 执行任务、attempt、step、log 和取消流程。该 Mapper 负责 MyBatis-Plus 数据访问。 |
| `backend-spring/src/main/java/com/sourcelens/module/execution/mapper/ExecutionStepMapper.java` | 执行任务、attempt、step、log 和取消流程。该 Mapper 负责 MyBatis-Plus 数据访问。 |
| `backend-spring/src/main/java/com/sourcelens/module/execution/mapper/ExecutionTaskMapper.java` | 执行任务、attempt、step、log 和取消流程。该 Mapper 负责 MyBatis-Plus 数据访问。 |
| `backend-spring/src/main/java/com/sourcelens/module/execution/service/ExecutionLogRetentionService.java` | 执行任务、attempt、step、log 和取消流程。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/execution/service/ExecutionTaskService.java` | 执行任务、attempt、step、log 和取消流程。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/issue/controller/IssueDecompositionController.java` | Issue 拆解、任务列表和 Markdown 导出。该 Controller 暴露 REST 接口并把请求转给 service 层。 |
| `backend-spring/src/main/java/com/sourcelens/module/issue/dto/DecomposeIssueRequest.java` | Issue 拆解、任务列表和 Markdown 导出。该 DTO 定义请求/响应数据契约。 |
| `backend-spring/src/main/java/com/sourcelens/module/issue/entity/IssueDecomposition.java` | Issue 拆解、任务列表和 Markdown 导出。该 Entity 映射数据库表结构。 |
| `backend-spring/src/main/java/com/sourcelens/module/issue/entity/IssueTask.java` | Issue 拆解、任务列表和 Markdown 导出。该 Entity 映射数据库表结构。 |
| `backend-spring/src/main/java/com/sourcelens/module/issue/mapper/IssueDecompositionMapper.java` | Issue 拆解、任务列表和 Markdown 导出。该 Mapper 负责 MyBatis-Plus 数据访问。 |
| `backend-spring/src/main/java/com/sourcelens/module/issue/mapper/IssueTaskMapper.java` | Issue 拆解、任务列表和 Markdown 导出。该 Mapper 负责 MyBatis-Plus 数据访问。 |
| `backend-spring/src/main/java/com/sourcelens/module/issue/service/IssueDecompositionService.java` | Issue 拆解、任务列表和 Markdown 导出。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/project/controller/ProjectController.java` | 项目 CRUD、聚合查询和项目删除。该 Controller 暴露 REST 接口并把请求转给 service 层。 |
| `backend-spring/src/main/java/com/sourcelens/module/project/dto/CreateProjectRequest.java` | 项目 CRUD、聚合查询和项目删除。该 DTO 定义请求/响应数据契约。 |
| `backend-spring/src/main/java/com/sourcelens/module/project/dto/UpdateProjectRequest.java` | 项目 CRUD、聚合查询和项目删除。该 DTO 定义请求/响应数据契约。 |
| `backend-spring/src/main/java/com/sourcelens/module/project/entity/Project.java` | 项目 CRUD、聚合查询和项目删除。该 Entity 映射数据库表结构。 |
| `backend-spring/src/main/java/com/sourcelens/module/project/mapper/ProjectMapper.java` | 项目 CRUD、聚合查询和项目删除。该 Mapper 负责 MyBatis-Plus 数据访问。 |
| `backend-spring/src/main/java/com/sourcelens/module/project/service/ProjectDeletionService.java` | 项目 CRUD、聚合查询和项目删除。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/project/service/ProjectService.java` | 项目 CRUD、聚合查询和项目删除。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/repository/controller/GitHubAppWebhookController.java` | 仓库接入、Git clone、GitHub App、webhook 和 PR 集成边界。该 Controller 暴露 REST 接口并把请求转给 service 层。 |
| `backend-spring/src/main/java/com/sourcelens/module/repository/controller/GitHubWebhookDeliveryController.java` | 仓库接入、Git clone、GitHub App、webhook 和 PR 集成边界。该 Controller 暴露 REST 接口并把请求转给 service 层。 |
| `backend-spring/src/main/java/com/sourcelens/module/repository/controller/RepositoryController.java` | 仓库接入、Git clone、GitHub App、webhook 和 PR 集成边界。该 Controller 暴露 REST 接口并把请求转给 service 层。 |
| `backend-spring/src/main/java/com/sourcelens/module/repository/dto/AddRepositoryRequest.java` | 仓库接入、Git clone、GitHub App、webhook 和 PR 集成边界。该 DTO 定义请求/响应数据契约。 |
| `backend-spring/src/main/java/com/sourcelens/module/repository/dto/BindGitHubAppInstallationRequest.java` | 仓库接入、Git clone、GitHub App、webhook 和 PR 集成边界。该 DTO 定义请求/响应数据契约。 |
| `backend-spring/src/main/java/com/sourcelens/module/repository/entity/GitHubAppInstallation.java` | 仓库接入、Git clone、GitHub App、webhook 和 PR 集成边界。该 Entity 映射数据库表结构。 |
| `backend-spring/src/main/java/com/sourcelens/module/repository/entity/GitHubWebhookDelivery.java` | 仓库接入、Git clone、GitHub App、webhook 和 PR 集成边界。该 Entity 映射数据库表结构。 |
| `backend-spring/src/main/java/com/sourcelens/module/repository/entity/GitHubWebhookDeliveryProject.java` | 仓库接入、Git clone、GitHub App、webhook 和 PR 集成边界。该 Entity 映射数据库表结构。 |
| `backend-spring/src/main/java/com/sourcelens/module/repository/entity/Repository.java` | 仓库接入、Git clone、GitHub App、webhook 和 PR 集成边界。该 Entity 映射数据库表结构。 |
| `backend-spring/src/main/java/com/sourcelens/module/repository/mapper/GitHubAppInstallationMapper.java` | 仓库接入、Git clone、GitHub App、webhook 和 PR 集成边界。该 Mapper 负责 MyBatis-Plus 数据访问。 |
| `backend-spring/src/main/java/com/sourcelens/module/repository/mapper/GitHubWebhookDeliveryMapper.java` | 仓库接入、Git clone、GitHub App、webhook 和 PR 集成边界。该 Mapper 负责 MyBatis-Plus 数据访问。 |
| `backend-spring/src/main/java/com/sourcelens/module/repository/mapper/GitHubWebhookDeliveryProjectMapper.java` | 仓库接入、Git clone、GitHub App、webhook 和 PR 集成边界。该 Mapper 负责 MyBatis-Plus 数据访问。 |
| `backend-spring/src/main/java/com/sourcelens/module/repository/mapper/RepositoryMapper.java` | 仓库接入、Git clone、GitHub App、webhook 和 PR 集成边界。该 Mapper 负责 MyBatis-Plus 数据访问。 |
| `backend-spring/src/main/java/com/sourcelens/module/repository/service/GitHubApiEndpointPolicy.java` | 仓库接入、Git clone、GitHub App、webhook 和 PR 集成边界。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/repository/service/GitHubAppInstallationService.java` | 仓库接入、Git clone、GitHub App、webhook 和 PR 集成边界。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/repository/service/GitHubAppTokenService.java` | 仓库接入、Git clone、GitHub App、webhook 和 PR 集成边界。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/repository/service/GitHubAppWebhookService.java` | 仓库接入、Git clone、GitHub App、webhook 和 PR 集成边界。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/repository/service/GitHubPullRequestService.java` | 仓库接入、Git clone、GitHub App、webhook 和 PR 集成边界。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/repository/service/GitHubWebhookDeliveryService.java` | 仓库接入、Git clone、GitHub App、webhook 和 PR 集成边界。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/repository/service/GitHubWebhookSignatureService.java` | 仓库接入、Git clone、GitHub App、webhook 和 PR 集成边界。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/repository/service/GitService.java` | 仓库接入、Git clone、GitHub App、webhook 和 PR 集成边界。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/repository/service/RepositoryService.java` | 仓库接入、Git clone、GitHub App、webhook 和 PR 集成边界。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/repository/service/RepositoryUrlPolicy.java` | 仓库接入、Git clone、GitHub App、webhook 和 PR 集成边界。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/review/controller/PrReviewController.java` | PR review、评论和重新分析。该 Controller 暴露 REST 接口并把请求转给 service 层。 |
| `backend-spring/src/main/java/com/sourcelens/module/review/dto/CreatePrReviewRequest.java` | PR review、评论和重新分析。该 DTO 定义请求/响应数据契约。 |
| `backend-spring/src/main/java/com/sourcelens/module/review/entity/PrReview.java` | PR review、评论和重新分析。该 Entity 映射数据库表结构。 |
| `backend-spring/src/main/java/com/sourcelens/module/review/entity/PrReviewComment.java` | PR review、评论和重新分析。该 Entity 映射数据库表结构。 |
| `backend-spring/src/main/java/com/sourcelens/module/review/mapper/PrReviewCommentMapper.java` | PR review、评论和重新分析。该 Mapper 负责 MyBatis-Plus 数据访问。 |
| `backend-spring/src/main/java/com/sourcelens/module/review/mapper/PrReviewMapper.java` | PR review、评论和重新分析。该 Mapper 负责 MyBatis-Plus 数据访问。 |
| `backend-spring/src/main/java/com/sourcelens/module/review/service/PrReviewService.java` | PR review、评论和重新分析。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/sandbox/DockerSandboxExecutor.java` | Docker/local sandbox 执行器、命令模型和安全校验。该文件属于 sandbox 模块的后端实现。 |
| `backend-spring/src/main/java/com/sourcelens/module/sandbox/LocalProcessSandboxExecutor.java` | Docker/local sandbox 执行器、命令模型和安全校验。该文件属于 sandbox 模块的后端实现。 |
| `backend-spring/src/main/java/com/sourcelens/module/sandbox/SandboxCommand.java` | Docker/local sandbox 执行器、命令模型和安全校验。该文件属于 sandbox 模块的后端实现。 |
| `backend-spring/src/main/java/com/sourcelens/module/sandbox/SandboxCommandValidator.java` | Docker/local sandbox 执行器、命令模型和安全校验。该文件属于 sandbox 模块的后端实现。 |
| `backend-spring/src/main/java/com/sourcelens/module/sandbox/SandboxExecutionResult.java` | Docker/local sandbox 执行器、命令模型和安全校验。该文件属于 sandbox 模块的后端实现。 |
| `backend-spring/src/main/java/com/sourcelens/module/sandbox/SandboxExecutor.java` | Docker/local sandbox 执行器、命令模型和安全校验。该文件属于 sandbox 模块的后端实现。 |
| `backend-spring/src/main/java/com/sourcelens/module/scanstat/entity/ScanStat.java` | 扫描统计聚合。该 Entity 映射数据库表结构。 |
| `backend-spring/src/main/java/com/sourcelens/module/scanstat/service/ScanStatService.java` | 扫描统计聚合。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/scantask/controller/ScanGovernanceSmokeSeedController.java` | 扫描任务、取消、治理时间线和 smoke seed。该 Controller 暴露 REST 接口并把请求转给 service 层。 |
| `backend-spring/src/main/java/com/sourcelens/module/scantask/controller/ScanTaskController.java` | 扫描任务、取消、治理时间线和 smoke seed。该 Controller 暴露 REST 接口并把请求转给 service 层。 |
| `backend-spring/src/main/java/com/sourcelens/module/scantask/controller/ScanTaskGovernanceTimelineController.java` | 扫描任务、取消、治理时间线和 smoke seed。该 Controller 暴露 REST 接口并把请求转给 service 层。 |
| `backend-spring/src/main/java/com/sourcelens/module/scantask/dto/CreateScanTaskRequest.java` | 扫描任务、取消、治理时间线和 smoke seed。该 DTO 定义请求/响应数据契约。 |
| `backend-spring/src/main/java/com/sourcelens/module/scantask/dto/ScanGovernanceTimelineResponse.java` | 扫描任务、取消、治理时间线和 smoke seed。该 DTO 定义请求/响应数据契约。 |
| `backend-spring/src/main/java/com/sourcelens/module/scantask/entity/ScanTask.java` | 扫描任务、取消、治理时间线和 smoke seed。该 Entity 映射数据库表结构。 |
| `backend-spring/src/main/java/com/sourcelens/module/scantask/mapper/ScanTaskMapper.java` | 扫描任务、取消、治理时间线和 smoke seed。该 Mapper 负责 MyBatis-Plus 数据访问。 |
| `backend-spring/src/main/java/com/sourcelens/module/scantask/service/ScanTaskGovernanceTimelineService.java` | 扫描任务、取消、治理时间线和 smoke seed。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/scantask/service/ScanTaskService.java` | 扫描任务、取消、治理时间线和 smoke seed。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/user/controller/AuthController.java` | 登录、注册、用户信息、JWT 认证。该 Controller 暴露 REST 接口并把请求转给 service 层。 |
| `backend-spring/src/main/java/com/sourcelens/module/user/dto/LoginRequest.java` | 登录、注册、用户信息、JWT 认证。该 DTO 定义请求/响应数据契约。 |
| `backend-spring/src/main/java/com/sourcelens/module/user/dto/LoginResponse.java` | 登录、注册、用户信息、JWT 认证。该 DTO 定义请求/响应数据契约。 |
| `backend-spring/src/main/java/com/sourcelens/module/user/dto/RegisterRequest.java` | 登录、注册、用户信息、JWT 认证。该 DTO 定义请求/响应数据契约。 |
| `backend-spring/src/main/java/com/sourcelens/module/user/dto/UserResponse.java` | 登录、注册、用户信息、JWT 认证。该 DTO 定义请求/响应数据契约。 |
| `backend-spring/src/main/java/com/sourcelens/module/user/entity/User.java` | 登录、注册、用户信息、JWT 认证。该 Entity 映射数据库表结构。 |
| `backend-spring/src/main/java/com/sourcelens/module/user/mapper/UserMapper.java` | 登录、注册、用户信息、JWT 认证。该 Mapper 负责 MyBatis-Plus 数据访问。 |
| `backend-spring/src/main/java/com/sourcelens/module/user/service/UserService.java` | 登录、注册、用户信息、JWT 认证。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/module/workspace/service/WorkspaceSandboxCleanupService.java` | 本地工作区和 sandbox 清理。该 Service 承担核心业务逻辑、状态机、外部调用或安全边界。 |
| `backend-spring/src/main/java/com/sourcelens/SourceLensApplication.java` | Spring Boot 主启动类，启动 SourceLens 后端应用并装配所有业务模块。 |
| `backend-spring/src/main/resources/application-dev.yml` | Spring Boot 配置文件，定义端口、数据源、Redis、Flyway、JWT、workspace、sandbox、GitHub、LLM、清理任务和安全默认值。 |
| `backend-spring/src/main/resources/application-prod.yml` | Spring Boot 配置文件，定义端口、数据源、Redis、Flyway、JWT、workspace、sandbox、GitHub、LLM、清理任务和安全默认值。 |
| `backend-spring/src/main/resources/application.yml` | Spring Boot 配置文件，定义端口、数据源、Redis、Flyway、JWT、workspace、sandbox、GitHub、LLM、清理任务和安全默认值。 |
| `backend-spring/src/main/resources/db/migration/V001__init_schema.sql` | V001__init_schema.sql Flyway 迁移，主要操作：创建表、新增索引/唯一约束、字符集/排序规则调整。 |
| `backend-spring/src/main/resources/db/migration/V002__add_code_symbols_relations.sql` | V002__add_code_symbols_relations.sql Flyway 迁移，主要操作：创建表、字符集/排序规则调整。 |
| `backend-spring/src/main/resources/db/migration/V003__add_agent_tasks.sql` | V003__add_agent_tasks.sql Flyway 迁移，主要操作：创建表、字符集/排序规则调整。 |
| `backend-spring/src/main/resources/db/migration/V004__add_issue_decompositions.sql` | V004__add_issue_decompositions.sql Flyway 迁移，主要操作：创建表、字符集/排序规则调整。 |
| `backend-spring/src/main/resources/db/migration/V005__add_ci_diagnostics.sql` | V005__add_ci_diagnostics.sql Flyway 迁移，主要操作：创建表、字符集/排序规则调整。 |
| `backend-spring/src/main/resources/db/migration/V006__add_pr_reviews.sql` | V006__add_pr_reviews.sql Flyway 迁移，主要操作：创建表、字符集/排序规则调整。 |
| `backend-spring/src/main/resources/db/migration/V007__fix_scan_artifacts_json_type.sql` | V007__fix_scan_artifacts_json_type.sql Flyway 迁移，主要操作：修改表结构。 |
| `backend-spring/src/main/resources/db/migration/V008__add_llm_configs.sql` | V008__add_llm_configs.sql Flyway 迁移，主要操作：创建表。 |
| `backend-spring/src/main/resources/db/migration/V009__add_agent_conversations.sql` | V009__add_agent_conversations.sql Flyway 迁移，主要操作：创建表、修改表结构、新增索引/唯一约束、字符集/排序规则调整。 |
| `backend-spring/src/main/resources/db/migration/V010__add_code_chunks.sql` | V010__add_code_chunks.sql Flyway 迁移，主要操作：创建表、字符集/排序规则调整。 |
| `backend-spring/src/main/resources/db/migration/V011__add_chunk_embeddings.sql` | V011__add_chunk_embeddings.sql Flyway 迁移，主要操作：修改表结构。 |
| `backend-spring/src/main/resources/db/migration/V012__add_auto_repairs.sql` | V012__add_auto_repairs.sql Flyway 迁移，主要操作：创建表、字符集/排序规则调整。 |
| `backend-spring/src/main/resources/db/migration/V013__fix_agent_tasks_json_type.sql` | V013__fix_agent_tasks_json_type.sql Flyway 迁移，主要操作：修改表结构。 |
| `backend-spring/src/main/resources/db/migration/V014__add_agent_tool_calls.sql` | V014__add_agent_tool_calls.sql Flyway 迁移，主要操作：创建表、字符集/排序规则调整。 |
| `backend-spring/src/main/resources/db/migration/V015__add_auto_repair_patch_artifact_path.sql` | V015__add_auto_repair_patch_artifact_path.sql Flyway 迁移，主要操作：修改表结构。 |
| `backend-spring/src/main/resources/db/migration/V016__add_execution_tasks.sql` | V016__add_execution_tasks.sql Flyway 迁移，主要操作：创建表、新增索引/唯一约束、字符集/排序规则调整。 |
| `backend-spring/src/main/resources/db/migration/V017__add_artifact_records.sql` | V017__add_artifact_records.sql Flyway 迁移，主要操作：创建表、字符集/排序规则调整。 |
| `backend-spring/src/main/resources/db/migration/V018__add_github_app_installations.sql` | V018__add_github_app_installations.sql Flyway 迁移，主要操作：创建表、新增索引/唯一约束。 |
| `backend-spring/src/main/resources/db/migration/V019__add_github_webhook_deliveries.sql` | V019__add_github_webhook_deliveries.sql Flyway 迁移，主要操作：创建表、新增索引/唯一约束。 |
| `backend-spring/src/main/resources/db/migration/V020__add_audit_logs.sql` | V020__add_audit_logs.sql Flyway 迁移，主要操作：创建表。 |
| `backend-spring/src/main/resources/db/migration/V021__add_github_webhook_delivery_projects.sql` | V021__add_github_webhook_delivery_projects.sql Flyway 迁移，主要操作：创建表、新增索引/唯一约束、字符集/排序规则调整。 |
| `backend-spring/src/main/resources/db/migration/V022__add_execution_task_source_unique_key.sql` | V022__add_execution_task_source_unique_key.sql Flyway 迁移，主要操作：修改表结构、新增索引/唯一约束。 |
| `backend-spring/src/main/resources/db/migration/V023__add_scan_task_active_lock.sql` | V023__add_scan_task_active_lock.sql Flyway 迁移，主要操作：修改表结构、新增索引/唯一约束。 |
| `backend-spring/src/main/resources/db/migration/V024__add_auto_repair_active_lock.sql` | V024__add_auto_repair_active_lock.sql Flyway 迁移，主要操作：修改表结构、新增索引/唯一约束。 |
| `backend-spring/src/main/resources/db/migration/V025__add_execution_attempts.sql` | V025__add_execution_attempts.sql Flyway 迁移，主要操作：创建表、修改表结构、新增索引/唯一约束、字符集/排序规则调整。 |
| `backend-spring/src/main/resources/db/migration/V026__add_execution_logs.sql` | V026__add_execution_logs.sql Flyway 迁移，主要操作：创建表、字符集/排序规则调整。 |
| `backend-spring/src/main/resources/db/migration/V027__normalize_github_webhook_delivery_collation.sql` | V027__normalize_github_webhook_delivery_collation.sql Flyway 迁移，主要操作：修改表结构、字符集/排序规则调整。 |
| `backend-spring/src/main/resources/db/migration/V028__add_agent_tool_call_scan_task_id.sql` | V028__add_agent_tool_call_scan_task_id.sql Flyway 迁移，主要操作：修改表结构、新增索引/唯一约束。 |
| `backend-spring/src/main/resources/db/migration/V029__add_code_chunk_embedding_model.sql` | V029__add_code_chunk_embedding_model.sql Flyway 迁移，主要操作：修改表结构、新增索引/唯一约束。 |
| `backend-spring/src/main/resources/db/migration/V030__add_auto_repair_scan_task_id.sql` | V030__add_auto_repair_scan_task_id.sql Flyway 迁移，主要操作：修改表结构、新增索引/唯一约束。 |
| `backend-spring/src/main/resources/db/migration/V031__add_code_chunk_lookup_indexes.sql` | V031__add_code_chunk_lookup_indexes.sql Flyway 迁移，主要操作：修改表结构、新增索引/唯一约束。 |
| `backend-spring/src/main/resources/db/migration/V032__add_code_chunk_root_metadata.sql` | V032__add_code_chunk_root_metadata.sql Flyway 迁移，主要操作：修改表结构、新增索引/唯一约束。 |
| `backend-spring/src/test/java/com/sourcelens/ActuatorSecurityTest.java` | 后端测试文件 ActuatorSecurityTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 2 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/AgentSandboxToolTest.java` | 后端测试文件 AgentSandboxToolTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 10 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/AgentTaskControllerTest.java` | 后端测试文件 AgentTaskControllerTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 1 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/AgentTaskServiceTest.java` | 后端测试文件 AgentTaskServiceTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 20 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/AgentToolCallControllerTest.java` | 后端测试文件 AgentToolCallControllerTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 1 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/AgentToolCallServiceTest.java` | 后端测试文件 AgentToolCallServiceTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 1 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/AnalysisArtifactBuilderTest.java` | 后端测试文件 AnalysisArtifactBuilderTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 6 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/AnalysisArtifactPersistenceServiceTest.java` | 后端测试文件 AnalysisArtifactPersistenceServiceTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 2 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/AnalysisControllerTest.java` | 后端测试文件 AnalysisControllerTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 1 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/AnalysisServiceTest.java` | 后端测试文件 AnalysisServiceTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 1 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/AnalyzerRunnerTest.java` | 后端测试文件 AnalyzerRunnerTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 5 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/ArchitectureRiskAnalyzerTest.java` | 后端测试文件 ArchitectureRiskAnalyzerTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 3 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/ArtifactControllerTest.java` | 后端测试文件 ArtifactControllerTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 5 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/ArtifactRetentionServiceTest.java` | 后端测试文件 ArtifactRetentionServiceTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 3 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/ArtifactStorageServiceTest.java` | 后端测试文件 ArtifactStorageServiceTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 23 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/AuditLogControllerTest.java` | 后端测试文件 AuditLogControllerTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 1 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/AuditLogServiceTest.java` | 后端测试文件 AuditLogServiceTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 3 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/AuditRetentionServiceTest.java` | 后端测试文件 AuditRetentionServiceTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 4 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/AuditWorkbenchSmokeSeedControllerTest.java` | 后端测试文件 AuditWorkbenchSmokeSeedControllerTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 7 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/AuthControllerTest.java` | 后端测试文件 AuthControllerTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 4 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/AutoRepairControllerTest.java` | 后端测试文件 AutoRepairControllerTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 4 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/AutoRepairPatchPolicyTest.java` | 后端测试文件 AutoRepairPatchPolicyTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 4 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/AutoRepairPrServiceTest.java` | 后端测试文件 AutoRepairPrServiceTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 6 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/AutoRepairServiceTest.java` | 后端测试文件 AutoRepairServiceTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 39 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/CiDiagnosticServiceTest.java` | 后端测试文件 CiDiagnosticServiceTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 6 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/CodeChunkControllerTest.java` | 后端测试文件 CodeChunkControllerTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 9 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/CodeChunkFileFilterTest.java` | 后端测试文件 CodeChunkFileFilterTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 4 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/CodeChunkMapperSchemaTest.java` | 后端测试文件 CodeChunkMapperSchemaTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 1 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/CodeChunkServiceTest.java` | 后端测试文件 CodeChunkServiceTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 260 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/CodeGraphPersistenceServiceTest.java` | 后端测试文件 CodeGraphPersistenceServiceTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 3 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/CodeQaControllerTest.java` | 后端测试文件 CodeQaControllerTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 94 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/CodeQaRetrievalEvalCorpusTest.java` | 后端测试文件 CodeQaRetrievalEvalCorpusTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 1 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/CodeQaRetrievalServiceTest.java` | 后端测试文件 CodeQaRetrievalServiceTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 51 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/common/security/SecurityConfigTest.java` | 后端测试文件 SecurityConfigTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 1 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/DashboardControllerTest.java` | 后端测试文件 DashboardControllerTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 2 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/DockerSandboxExecutorTest.java` | 后端测试文件 DockerSandboxExecutorTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 6 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/DummyController.java` | 后端测试文件 DummyController，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 0 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/ExecutionLogRetentionServiceTest.java` | 后端测试文件 ExecutionLogRetentionServiceTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 4 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/ExecutionTaskControllerTest.java` | 后端测试文件 ExecutionTaskControllerTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 2 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/ExecutionTaskServiceTest.java` | 后端测试文件 ExecutionTaskServiceTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 15 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/GitHubAppInstallationServiceTest.java` | 后端测试文件 GitHubAppInstallationServiceTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 5 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/GitHubAppTokenServiceTest.java` | 后端测试文件 GitHubAppTokenServiceTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 4 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/GitHubAppWebhookControllerTest.java` | 后端测试文件 GitHubAppWebhookControllerTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 3 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/GitHubAppWebhookServiceTest.java` | 后端测试文件 GitHubAppWebhookServiceTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 9 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/GitHubPullRequestServiceTest.java` | 后端测试文件 GitHubPullRequestServiceTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 12 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/GitHubWebhookDeliveryControllerTest.java` | 后端测试文件 GitHubWebhookDeliveryControllerTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 1 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/GitHubWebhookDeliveryServiceTest.java` | 后端测试文件 GitHubWebhookDeliveryServiceTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 13 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/GitHubWebhookSignatureServiceTest.java` | 后端测试文件 GitHubWebhookSignatureServiceTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 2 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/GlobalExceptionHandlerTest.java` | 后端测试文件 GlobalExceptionHandlerTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 0 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/IssueDecompositionServiceTest.java` | 后端测试文件 IssueDecompositionServiceTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 4 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/JavaAstParserTest.java` | 后端测试文件 JavaAstParserTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 14 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/JavaFallbackAnalyzerTest.java` | 后端测试文件 JavaFallbackAnalyzerTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 5 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/LlmClientAdapterTest.java` | 后端测试文件 LlmClientAdapterTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 9 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/LlmEndpointPolicyTest.java` | 后端测试文件 LlmEndpointPolicyTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 5 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/LlmJsonExtractorTest.java` | 后端测试文件 LlmJsonExtractorTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 5 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/LocalProcessSandboxExecutorTest.java` | 后端测试文件 LocalProcessSandboxExecutorTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 9 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/module/agent/tool/AgentToolArgumentUtilsTest.java` | 后端测试文件 AgentToolArgumentUtilsTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 2 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/module/analysis/service/CodeChunkRankerTest.java` | 后端测试文件 CodeChunkRankerTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 15 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/module/analysis/service/CodeChunkServiceRootIndexTest.java` | 后端测试文件 CodeChunkServiceRootIndexTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 4 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/module/analysis/service/CodeLocationHintParserTest.java` | 后端测试文件 CodeLocationHintParserTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 64 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/module/repository/service/GitServiceTest.java` | 后端测试文件 GitServiceTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 7 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/module/scanstat/service/ScanStatServiceTest.java` | 后端测试文件 ScanStatServiceTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 4 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/MySqlFlywayMigrationSmokeTest.java` | 后端测试文件 MySqlFlywayMigrationSmokeTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 1 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/ProjectControllerTest.java` | 后端测试文件 ProjectControllerTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 0 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/ProjectDeletionServiceTest.java` | 后端测试文件 ProjectDeletionServiceTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 1 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/ProjectServiceTest.java` | 后端测试文件 ProjectServiceTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 4 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/PromptInjectionGuardTest.java` | 后端测试文件 PromptInjectionGuardTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 2 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/PrReviewServiceTest.java` | 后端测试文件 PrReviewServiceTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 6 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/RepositoryServiceTest.java` | 后端测试文件 RepositoryServiceTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 8 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/RepositoryUrlPolicyTest.java` | 后端测试文件 RepositoryUrlPolicyTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 5 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/RequestIdFilterTest.java` | 后端测试文件 RequestIdFilterTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 2 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/ScanGovernanceSmokeSeedControllerTest.java` | 后端测试文件 ScanGovernanceSmokeSeedControllerTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 7 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/ScanResultSchemaValidatorTest.java` | 后端测试文件 ScanResultSchemaValidatorTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 9 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/ScanTaskControllerTest.java` | 后端测试文件 ScanTaskControllerTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 0 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/ScanTaskGovernanceTimelineControllerTest.java` | 后端测试文件 ScanTaskGovernanceTimelineControllerTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 3 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/ScanTaskGovernanceTimelineServiceTest.java` | 后端测试文件 ScanTaskGovernanceTimelineServiceTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 3 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/ScanTaskServiceTest.java` | 后端测试文件 ScanTaskServiceTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 7 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/SecurityStartupValidatorTest.java` | 后端测试文件 SecurityStartupValidatorTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 17 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/SensitiveDataSanitizerTest.java` | 后端测试文件 SensitiveDataSanitizerTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 5 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/SourceLensMetricsTest.java` | 后端测试文件 SourceLensMetricsTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 2 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/TokenEncryptorTest.java` | 后端测试文件 TokenEncryptorTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 1 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/ToolExecutionServiceTest.java` | 后端测试文件 ToolExecutionServiceTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 1 个测试/断言方法。 |
| `backend-spring/src/test/java/com/sourcelens/WorkspaceSandboxCleanupServiceTest.java` | 后端测试文件 WorkspaceSandboxCleanupServiceTest，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 4 个测试/断言方法。 |
| `backend-spring/src/test/resources/application-test.yml` | 后端测试文件 application-test.yml，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 0 个测试/断言方法。 |
| `backend-spring/src/test/resources/application.yml` | Spring Boot 配置文件，定义端口、数据源、Redis、Flyway、JWT、workspace、sandbox、GitHub、LLM、清理任务和安全默认值。 |
| `backend-spring/src/test/resources/mockito-extensions/org.mockito.plugins.MockMaker` | 后端测试文件 org.mockito.plugins.MockMaker，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 0 个测试/断言方法。 |
| `backend-spring/src/test/resources/p6-code-qa-retrieval-eval-cases.json` | 后端测试文件 AuthController，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 0 个测试/断言方法。 |
| `backend-spring/src/test/resources/schema-test.sql` | 后端测试文件 schema-test.sql，覆盖对应 controller/service/security/sandbox/analysis 行为；检测到 0 个测试/断言方法。 |

### CHAIRMAN_BRIEFING.md

| 文件 | 作用 |
| --- | --- |
| `CHAIRMAN_BRIEFING.md` | Markdown 文档。 |

### CHANGELOG.md

| 文件 | 作用 |
| --- | --- |
| `CHANGELOG.md` | Markdown 文档。 |

### CODE_OF_CONDUCT.md

| 文件 | 作用 |
| --- | --- |
| `CODE_OF_CONDUCT.md` | Markdown 文档。 |

### CONTRIBUTING.md

| 文件 | 作用 |
| --- | --- |
| `CONTRIBUTING.md` | Markdown 文档。 |

### deploy

| 文件 | 作用 |
| --- | --- |
| `deploy/.env` | 环境变量模板或本地 env 文件，提供数据库、Redis、JWT、GitHub、sandbox 等配置入口。 |
| `deploy/.env.example` | 环境变量模板或本地 env 文件，提供数据库、Redis、JWT、GitHub、sandbox 等配置入口。 |
| `deploy/docker-compose.yml` | 本地/部署基础设施编排，定义 MySQL、Redis 和后端等服务。 |

### docs

| 文件 | 作用 |
| --- | --- |
| `docs/AGENT_ACTIVITY_LOG.md` | 项目文档。标题：SourceLens Agent Activity Log。 |
| `docs/AGENT_DECISION_REGISTER.md` | 项目文档。标题：SourceLens Agent Decision Register。 |
| `docs/AGENT_STATUS_BOARD.md` | 项目文档。标题：SourceLens Agent Status Board。 |
| `docs/aios/BASELINE_ADAPTER_CONTRACT.md` | 项目文档。标题：SourceLens AIOS Baseline Adapter Contract。 |
| `docs/aios/CODEX_MASTER_PROMPT.md` | 项目文档。标题：SourceLens AIOS Codex Master Prompt。 |
| `docs/aios/EVALUATION_PROTOCOL.md` | 项目文档。标题：SourceLens AIOS Evaluation and Research Protocol。 |
| `docs/aios/MASTER_EXECUTION_PROTOCOL.md` | 项目文档。标题：SourceLens AIOS Master Execution Protocol。 |
| `docs/aios/MIGRATION_LEDGER.yaml` | 项目文档。标题：MIGRATION_LEDGER.yaml。 |
| `docs/aios/P0_GATE.md` | 项目文档。标题：SourceLens AIOS P0 Gate Packet。 |
| `docs/aios/P0_INDEPENDENT_REVIEW.md` | 项目文档。标题：SourceLens AIOS P0 Independent Review。 |
| `docs/aios/README.md` | 项目文档。标题：SourceLens AIOS Authority Index。 |
| `docs/aios/schemas/environment-snapshot.schema.json` | 项目文档。标题：environment-snapshot.schema.json。 |
| `docs/aios/schemas/run-record.schema.json` | 项目文档。标题：run-record.schema.json。 |
| `docs/aios/schemas/system-configuration.schema.json` | 项目文档。标题：system-configuration.schema.json。 |
| `docs/aios/schemas/task-spec.schema.json` | 项目文档。标题：task-spec.schema.json。 |
| `docs/aios/STRATEGIC_CONSTITUTION.md` | 项目文档。标题：SourceLens AIOS Strategic Constitution。 |
| `docs/aios/tasks/P0-04A_TRUTH_CONTAINMENT.yaml` | 项目文档。标题：P0-04A_TRUTH_CONTAINMENT.yaml。 |
| `docs/aios/tasks/P0-04B_SLICE_F_GATE_REPAIR.yaml` | 项目文档。标题：P0-04B_SLICE_F_GATE_REPAIR.yaml。 |
| `docs/aios/tasks/P0-05_BASELINE_SLICING.yaml` | 项目文档。标题：P0-05_BASELINE_SLICING.yaml。 |
| `docs/aios/truth/project_state.yaml` | 项目文档。标题：project_state.yaml。 |
| `docs/API_DESIGN.md` | API 设计文档，记录后端接口、请求响应、权限和当前 route inventory。标题：API 设计。 |
| `docs/ARCHITECTURE.md` | 项目文档。标题：架构设计。 |
| `docs/CODEX_HANDOFF.md` | 上下文交接文档，用于新 Codex 会话接续当前 SourceLens 状态。标题：SourceLens Codex Handoff。 |
| `docs/COMPLIANCE_AND_PRIVACY.md` | 项目文档。标题：SourceLens Compliance and Privacy。 |
| `docs/DAILY_GROWTH_PLAN_2026_EXPANDED.md` | 项目文档。标题：SourceLens 每日执行级成长计划：2026-06-15 至 2027-01 面试准备。 |
| `docs/DAILY_GROWTH_PLAN_2026.md` | 项目文档。标题：SourceLens 后端与 Agent 工程每日成长计划。 |
| `docs/DATA_GOVERNANCE.md` | 产品/工程治理文档，定义开发流程、事实源、验证和记录制度。标题：SourceLens Data Governance。 |
| `docs/DATABASE_DESIGN.md` | 数据库设计文档，记录核心表、Flyway 迁移和数据边界。标题：数据库设计。 |
| `docs/DEMO_SCRIPT.md` | 项目文档。标题：SourceLens 演示脚本。 |
| `docs/DEPENDENCY_AND_LICENSE_POLICY.md` | 项目文档。标题：SourceLens Dependency and License Policy。 |
| `docs/DISASTER_RECOVERY_AND_ROLLBACK_SIGNOFF.md` | 项目文档。标题：SourceLens Disaster Recovery and Rollback Signoff。 |
| `docs/ENGINEERING_STANDARDS.md` | 项目文档。标题：SourceLens Engineering Standards。 |
| `docs/FRONTEND_DESIGN_SYSTEM.md` | 项目文档。标题：SourceLens Frontend Design System。 |
| `docs/LLM_SAFETY_EVALS.md` | 项目文档。标题：SourceLens LLM Safety Evals。 |
| `docs/llm-safety-evals/output-quality-cases.json` | 项目文档。标题：output-quality-cases.json。 |
| `docs/llm-safety-evals/prompt-injection-cases.json` | 项目文档。标题：prompt-injection-cases.json。 |
| `docs/llm-safety-evals/provider-run-template.json` | 项目文档。标题：provider-run-template.json。 |
| `docs/OBSERVABILITY_AND_INCIDENTS.md` | 项目文档。标题：SourceLens Observability and Incidents。 |
| `docs/OPERATIONS_RUNBOOK.md` | 运维运行手册，记录部署、preflight、release evidence、备份、回滚和本地清理 SOP。标题：SourceLens Operations Runbook。 |
| `docs/PERFORMANCE_BENCHMARK.md` | 项目文档。标题：SourceLens Performance Benchmark。 |
| `docs/PHASE_REQUIREMENTS.md` | 阶段需求或基线文档，定义 P 阶段目标、验收标准和非范围。标题：SourceLens Phase Requirements。 |
| `docs/PHASE12_BASELINE.md` | 阶段需求或基线文档，定义 P 阶段目标、验收标准和非范围。标题：SourceLens Phase 12 Baseline。 |
| `docs/PRODUCT_GOVERNANCE.md` | 产品/工程治理文档，定义开发流程、事实源、验证和记录制度。标题：SourceLens Product Governance。 |
| `docs/PRODUCT_METRICS_AND_FEEDBACK.md` | 项目文档。标题：SourceLens Product Metrics and Feedback。 |
| `docs/PRODUCT_POSITIONING_AND_ACCESS_MODEL.md` | 项目文档。标题：SourceLens Product Positioning and Access Model。 |
| `docs/PRODUCT_PROGRESS_LOG.md` | 产品进度日志，记录每轮实际开发、验证、风险和下一步。标题：SourceLens Product Progress Log。 |
| `docs/PROJECT_PLAN.md` | 项目文档。标题：SourceLens 项目全程规划。 |
| `docs/PROJECT_STRUCTURE_AUDIT.md` | 项目结构审计文档，记录目录职责、生成物边界和清理策略。标题：SourceLens Project Structure Audit。 |
| `docs/QUALITY_SCORECARD.md` | 项目文档。标题：SourceLens Quality Scorecard。 |
| `docs/RAW_ACCESS_AND_EVIDENCE_RETENTION_POLICY.md` | 项目文档。标题：SourceLens Raw Access and Evidence Retention Policy。 |
| `docs/README.md` | 项目文档。标题：SourceLens Documentation Index。 |
| `docs/REFACTOR_ROADMAP.md` | 项目文档。标题：SourceLens 重构路线图。 |
| `docs/RELEASE_PROCESS.md` | 项目文档。标题：SourceLens Release Process。 |
| `docs/RISK_REGISTER.md` | 项目文档。标题：SourceLens Risk Register。 |
| `docs/SECURITY_BOUNDARY.md` | 安全边界文档，定义凭据、沙箱、LLM、GitHub、审计和危险能力红线。标题：SourceLens 安全边界。 |
| `docs/SOURCELENS_OPERATING_SYSTEM.md` | 项目文档。标题：SourceLens AIOS Operating System。 |
| `docs/TEAM_OPERATING_MODEL.md` | 多 agent 团队运行模型，定义固定岗位、专家池、触发条件和协作规则。标题：SourceLens AIOS Team Operating Model。 |
| `docs/TEST_STRATEGY.md` | 项目文档。标题：SourceLens Test Strategy。 |
| `docs/THREAT_MODEL.md` | 项目文档。标题：SourceLens Threat Model。 |
| `docs/TOP_LEVEL_PRODUCT_OPERATING_DEFINITIONS.md` | 项目文档。标题：SourceLens Top-Level Product Operating Definitions。 |
| `docs/WORK_INTAKE_AND_BACKLOG.md` | 项目文档。标题：SourceLens Work Intake and Backlog。 |
| `docs/WORKTREE_HYGIENE.md` | 项目文档。标题：SourceLens 工作区整理说明。 |

### LICENSE

| 文件 | 作用 |
| --- | --- |
| `LICENSE` | 项目文件。 |

### Makefile

| 文件 | 作用 |
| --- | --- |
| `Makefile` | 统一开发命令入口，封装本地启动、验证、smoke、release evidence、清理和专项门禁。 |

### README.md

| 文件 | 作用 |
| --- | --- |
| `README.md` | 项目入口说明，介绍 SourceLens 当前定位、技术栈、本地启动、验证命令、结构和清理策略。 |

### ROADMAP.md

| 文件 | 作用 |
| --- | --- |
| `ROADMAP.md` | Markdown 文档。 |

### scripts

| 文件 | 作用 |
| --- | --- |
| `scripts/agent-chat-tool-audit-smoke.sh` | 工程自动化脚本，服务本地验证、smoke、preflight、drill 或专项门禁。 |
| `scripts/artifact-quality-check.sh` | 工程自动化脚本，服务本地验证、smoke、preflight、drill 或专项门禁。 |
| `scripts/audit-workbench-smoke.sh` | 工程自动化脚本，服务本地验证、smoke、preflight、drill 或专项门禁。 |
| `scripts/autorepair-patch-smoke.sh` | 工程自动化脚本，服务本地验证、smoke、preflight、drill 或专项门禁。 |
| `scripts/backup-restore-drill.sh` | 工程自动化脚本，服务本地验证、smoke、preflight、drill 或专项门禁。 |
| `scripts/backup-restore-preflight.sh` | 工程自动化脚本，服务本地验证、smoke、preflight、drill 或专项门禁。 |
| `scripts/clean-local-generated.sh` | 本地生成物清理脚本，保留最新 runtime jar，并保护正在运行的 dev backend target/classes。 |
| `scripts/code-relation-quality-report.sh` | 工程自动化脚本，服务本地验证、smoke、preflight、drill 或专项门禁。 |
| `scripts/dependency-regression-check.sh` | 工程自动化脚本，服务本地验证、smoke、preflight、drill 或专项门禁。 |
| `scripts/file-bound-repair-smoke.sh` | 工程自动化脚本，服务本地验证、smoke、preflight、drill 或专项门禁。 |
| `scripts/generate-project-code-map.mjs` | 工程自动化脚本，服务本地验证、smoke、preflight、drill 或专项门禁。 |
| `scripts/github-app-drill.sh` | 工程自动化脚本，服务本地验证、smoke、preflight、drill 或专项门禁。 |
| `scripts/github-webhook-drill.sh` | 工程自动化脚本，服务本地验证、smoke、preflight、drill 或专项门禁。 |
| `scripts/llm-provider-eval-mock-smoke.mjs` | 工程自动化脚本，服务本地验证、smoke、preflight、drill 或专项门禁。 |
| `scripts/llm-safety-regression.sh` | 工程自动化脚本，服务本地验证、smoke、preflight、drill 或专项门禁。 |
| `scripts/mysql-flyway-migration-smoke.sh` | 工程自动化脚本，服务本地验证、smoke、preflight、drill 或专项门禁。 |
| `scripts/p6-retrieval-quality-matrix.sh` | 工程自动化脚本，服务本地验证、smoke、preflight、drill 或专项门禁。 |
| `scripts/phase12-baseline.sh` | 工程自动化脚本，服务本地验证、smoke、preflight、drill 或专项门禁。 |
| `scripts/preserve-worktree-snapshot.mjs` | 工程自动化脚本，服务本地验证、smoke、preflight、drill 或专项门禁。 |
| `scripts/production-preflight.sh` | 工程自动化脚本，服务本地验证、smoke、preflight、drill 或专项门禁。 |
| `scripts/public-repo-analysis-smoke.sh` | 公开仓库主链路 smoke，验证 clone、scan、report、code_chunks、QA 和 live marker。 |
| `scripts/release-evidence-inventory-self-test.mjs` | release evidence 生成或复核脚本，记录发布验收命令、manifest、status、checksum 和防伪校验。 |
| `scripts/release-evidence-inventory.mjs` | release evidence 生成或复核脚本，记录发布验收命令、manifest、status、checksum 和防伪校验。 |
| `scripts/release-evidence.sh` | release evidence 生成或复核脚本，记录发布验收命令、manifest、status、checksum 和防伪校验。 |
| `scripts/rollback-preflight.sh` | 工程自动化脚本，服务本地验证、smoke、preflight、drill 或专项门禁。 |
| `scripts/run-backend-dev.sh` | 本地后端启动脚本，处理 env、端口占用、健康复用和稳定 jar runtime。 |
| `scripts/run-backend-jar-dev.sh` | 本地后端启动脚本，处理 env、端口占用、健康复用和稳定 jar runtime。 |
| `scripts/run-llm-provider-eval.mjs` | 工程自动化脚本，服务本地验证、smoke、preflight、drill 或专项门禁。 |
| `scripts/sandbox-drill.sh` | 工程自动化脚本，服务本地验证、smoke、preflight、drill 或专项门禁。 |
| `scripts/security-regression-check.sh` | 安全回归矩阵脚本，覆盖静态安全、LLM、release verifier、marker 防伪和集成演练。 |
| `scripts/smoke-test.sh` | 工程自动化脚本，服务本地验证、smoke、preflight、drill 或专项门禁。 |
| `scripts/validate-aios-governance.sh` | 静态或语义校验脚本，用于锁定 API/UI/产物/LLM 输出等工程合同。 |
| `scripts/validate-api-design.mjs` | 静态或语义校验脚本，用于锁定 API/UI/产物/LLM 输出等工程合同。 |
| `scripts/validate-artifact-quality.mjs` | 静态或语义校验脚本，用于锁定 API/UI/产物/LLM 输出等工程合同。 |
| `scripts/validate-db-schema-contract.mjs` | 静态或语义校验脚本，用于锁定 API/UI/产物/LLM 输出等工程合同。 |
| `scripts/validate-frontend-ui.mjs` | 静态或语义校验脚本，用于锁定 API/UI/产物/LLM 输出等工程合同。 |
| `scripts/validate-llm-provider-run.mjs` | 静态或语义校验脚本，用于锁定 API/UI/产物/LLM 输出等工程合同。 |
| `scripts/validate-llm-safety-evals.mjs` | 静态或语义校验脚本，用于锁定 API/UI/产物/LLM 输出等工程合同。 |
| `scripts/verify-all.sh` | 工程自动化脚本，服务本地验证、smoke、preflight、drill 或专项门禁。 |
| `scripts/verify-release-evidence.sh` | release evidence 生成或复核脚本，记录发布验收命令、manifest、status、checksum 和防伪校验。 |
| `scripts/worktree-inventory.sh` | 工程自动化脚本，服务本地验证、smoke、preflight、drill 或专项门禁。 |

### SECURITY.md

| 文件 | 作用 |
| --- | --- |
| `SECURITY.md` | Markdown 文档。 |

### SUPPORT.md

| 文件 | 作用 |
| --- | --- |
| `SUPPORT.md` | Markdown 文档。 |

### web-console

| 文件 | 作用 |
| --- | --- |
| `web-console/index.html` | 前端工程文件。 |
| `web-console/package-lock.json` | 前端依赖锁定文件，保证 npm 安装版本可复现。 |
| `web-console/package.json` | 前端工程依赖和 npm 脚本定义，包含 Vite、React、Ant Design、Playwright smoke 命令。 |
| `web-console/playwright.agent-chat-audit.config.ts` | Playwright smoke 配置文件，绑定某个专项 UI 验收 spec 和浏览器参数。 |
| `web-console/playwright.agent-chat-closure-rail.config.ts` | Playwright smoke 配置文件，绑定某个专项 UI 验收 spec 和浏览器参数。 |
| `web-console/playwright.agent-chat-first-viewport.config.ts` | Playwright smoke 配置文件，绑定某个专项 UI 验收 spec 和浏览器参数。 |
| `web-console/playwright.agent-tasks-detail-selection.config.ts` | Playwright smoke 配置文件，绑定某个专项 UI 验收 spec 和浏览器参数。 |
| `web-console/playwright.app-shell-ui.config.ts` | Playwright smoke 配置文件，绑定某个专项 UI 验收 spec 和浏览器参数。 |
| `web-console/playwright.artifacts-detail-selection.config.ts` | Playwright smoke 配置文件，绑定某个专项 UI 验收 spec 和浏览器参数。 |
| `web-console/playwright.audit-logs-detail-selection.config.ts` | Playwright smoke 配置文件，绑定某个专项 UI 验收 spec 和浏览器参数。 |
| `web-console/playwright.ci-diagnostics-detail-selection.config.ts` | Playwright smoke 配置文件，绑定某个专项 UI 验收 spec 和浏览器参数。 |
| `web-console/playwright.dashboard-next-action.config.ts` | Playwright smoke 配置文件，绑定某个专项 UI 验收 spec 和浏览器参数。 |
| `web-console/playwright.execution-tasks-detail-selection.config.ts` | Playwright smoke 配置文件，绑定某个专项 UI 验收 spec 和浏览器参数。 |
| `web-console/playwright.issue-decomposition-detail-selection.config.ts` | Playwright smoke 配置文件，绑定某个专项 UI 验收 spec 和浏览器参数。 |
| `web-console/playwright.model-config-recoverable.config.ts` | Playwright smoke 配置文件，绑定某个专项 UI 验收 spec 和浏览器参数。 |
| `web-console/playwright.p9-main-path-recoverable-error-states-batch3.config.ts` | Playwright smoke 配置文件，绑定某个专项 UI 验收 spec 和浏览器参数。 |
| `web-console/playwright.p9-main-path-recoverable-error-states-batch4a.config.ts` | Playwright smoke 配置文件，绑定某个专项 UI 验收 spec 和浏览器参数。 |
| `web-console/playwright.p9-main-path-recoverable-error-states-batch4b.config.ts` | Playwright smoke 配置文件，绑定某个专项 UI 验收 spec 和浏览器参数。 |
| `web-console/playwright.patch-ready.config.ts` | Playwright smoke 配置文件，绑定某个专项 UI 验收 spec 和浏览器参数。 |
| `web-console/playwright.pr-reviews-detail-selection.config.ts` | Playwright smoke 配置文件，绑定某个专项 UI 验收 spec 和浏览器参数。 |
| `web-console/playwright.project-detail-first-viewport.config.ts` | Playwright smoke 配置文件，绑定某个专项 UI 验收 spec 和浏览器参数。 |
| `web-console/playwright.project-qa-autorepair-candidate.config.ts` | Playwright smoke 配置文件，绑定某个专项 UI 验收 spec 和浏览器参数。 |
| `web-console/playwright.project-qa-low-confidence.config.ts` | Playwright smoke 配置文件，绑定某个专项 UI 验收 spec 和浏览器参数。 |
| `web-console/playwright.project-qa-recoverable.config.ts` | Playwright smoke 配置文件，绑定某个专项 UI 验收 spec 和浏览器参数。 |
| `web-console/playwright.public-repo-ui.config.ts` | Playwright smoke 配置文件，绑定某个专项 UI 验收 spec 和浏览器参数。 |
| `web-console/playwright.report-autorepair-candidate.config.ts` | Playwright smoke 配置文件，绑定某个专项 UI 验收 spec 和浏览器参数。 |
| `web-console/playwright.report-evidence-drawer.config.ts` | Playwright smoke 配置文件，绑定某个专项 UI 验收 spec 和浏览器参数。 |
| `web-console/playwright.report-evidence-qa-citation.config.ts` | Playwright smoke 配置文件，绑定某个专项 UI 验收 spec 和浏览器参数。 |
| `web-console/playwright.scan-governance-timeline.config.ts` | Playwright smoke 配置文件，绑定某个专项 UI 验收 spec 和浏览器参数。 |
| `web-console/playwright.scan-task-detail-first-viewport.config.ts` | Playwright smoke 配置文件，绑定某个专项 UI 验收 spec 和浏览器参数。 |
| `web-console/src/api/agentTask.ts` | 前端 API client，封装对应后端接口调用、请求参数和响应类型。 |
| `web-console/src/api/agentToolCall.ts` | 前端 API client，封装对应后端接口调用、请求参数和响应类型。 |
| `web-console/src/api/analysis.ts` | 前端 API client，封装对应后端接口调用、请求参数和响应类型。 |
| `web-console/src/api/artifact.ts` | 前端 API client，封装对应后端接口调用、请求参数和响应类型。 |
| `web-console/src/api/audit.ts` | 前端 API client，封装对应后端接口调用、请求参数和响应类型。 |
| `web-console/src/api/auth.ts` | 前端 API client，封装对应后端接口调用、请求参数和响应类型。 |
| `web-console/src/api/autoRepair.ts` | 前端 API client，封装对应后端接口调用、请求参数和响应类型。 |
| `web-console/src/api/ciDiagnostic.ts` | 前端 API client，封装对应后端接口调用、请求参数和响应类型。 |
| `web-console/src/api/client.ts` | 前端 API client，封装对应后端接口调用、请求参数和响应类型。 |
| `web-console/src/api/codeChunk.ts` | 前端 API client，封装对应后端接口调用、请求参数和响应类型。 |
| `web-console/src/api/conversation.ts` | 前端 API client，封装对应后端接口调用、请求参数和响应类型。 |
| `web-console/src/api/dashboard.ts` | 前端 API client，封装对应后端接口调用、请求参数和响应类型。 |
| `web-console/src/api/executionTask.ts` | 前端 API client，封装对应后端接口调用、请求参数和响应类型。 |
| `web-console/src/api/githubWebhookDelivery.ts` | 前端 API client，封装对应后端接口调用、请求参数和响应类型。 |
| `web-console/src/api/issueDecomposition.ts` | 前端 API client，封装对应后端接口调用、请求参数和响应类型。 |
| `web-console/src/api/modelConfig.ts` | 前端 API client，封装对应后端接口调用、请求参数和响应类型。 |
| `web-console/src/api/project.ts` | 前端 API client，封装对应后端接口调用、请求参数和响应类型。 |
| `web-console/src/api/prReview.ts` | 前端 API client，封装对应后端接口调用、请求参数和响应类型。 |
| `web-console/src/api/repository.ts` | 前端 API client，封装对应后端接口调用、请求参数和响应类型。 |
| `web-console/src/api/scanGovernanceTimeline.ts` | 前端 API client，封装对应后端接口调用、请求参数和响应类型。 |
| `web-console/src/api/scanTask.ts` | 前端 API client，封装对应后端接口调用、请求参数和响应类型。 |
| `web-console/src/App.tsx` | React 路由入口，定义登录、注册、Dashboard、ProjectDetail、ScanTaskDetail、Agent、Audit、AutoRepair 等页面路由。 |
| `web-console/src/components/AgentToolCall.tsx` | 前端共享组件，被多个页面复用以展示布局、产物、日志、diff、任务时间线或权限保护。 |
| `web-console/src/components/AppLayout.tsx` | 前端共享组件，被多个页面复用以展示布局、产物、日志、diff、任务时间线或权限保护。 |
| `web-console/src/components/ArtifactLinkButton.tsx` | 前端共享组件，被多个页面复用以展示布局、产物、日志、diff、任务时间线或权限保护。 |
| `web-console/src/components/ArtifactPreviewRenderer.tsx` | 前端共享组件，被多个页面复用以展示布局、产物、日志、diff、任务时间线或权限保护。 |
| `web-console/src/components/DiffViewer.tsx` | 前端共享组件，被多个页面复用以展示布局、产物、日志、diff、任务时间线或权限保护。 |
| `web-console/src/components/LogViewer.tsx` | 前端共享组件，被多个页面复用以展示布局、产物、日志、diff、任务时间线或权限保护。 |
| `web-console/src/components/ProjectSelector.tsx` | 前端共享组件，被多个页面复用以展示布局、产物、日志、diff、任务时间线或权限保护。 |
| `web-console/src/components/ProtectedRoute.tsx` | 前端共享组件，被多个页面复用以展示布局、产物、日志、diff、任务时间线或权限保护。 |
| `web-console/src/components/TaskTimeline.tsx` | 前端共享组件，被多个页面复用以展示布局、产物、日志、diff、任务时间线或权限保护。 |
| `web-console/src/components/ui/ActionButton.tsx` | 项目共享 UI 原语，用于统一状态块、操作栏、详情面板等大厂级 UI 基础。 |
| `web-console/src/components/ui/IconActionButton.tsx` | 项目共享 UI 原语，用于统一状态块、操作栏、详情面板等大厂级 UI 基础。 |
| `web-console/src/components/ui/selectableTableRow.ts` | 项目共享 UI 原语，用于统一状态块、操作栏、详情面板等大厂级 UI 基础。 |
| `web-console/src/components/ui/StateBlock.tsx` | 项目共享 UI 原语，用于统一状态块、操作栏、详情面板等大厂级 UI 基础。 |
| `web-console/src/contexts/AuthContext.tsx` | React context，全局管理认证、会话或跨页面状态。 |
| `web-console/src/contexts/ChatContext.tsx` | React context，全局管理认证、会话或跨页面状态。 |
| `web-console/src/main.tsx` | 前端应用入口，挂载 React 根节点、全局 provider 和样式。 |
| `web-console/src/pages/AgentChat.tsx` | 前端页面级组件，承载业务流程、状态加载、错误处理、表格/详情/抽屉和用户操作。 |
| `web-console/src/pages/AgentTasks.tsx` | 前端页面级组件，承载业务流程、状态加载、错误处理、表格/详情/抽屉和用户操作。 |
| `web-console/src/pages/AgentTasksPage.tsx` | 前端页面级组件，承载业务流程、状态加载、错误处理、表格/详情/抽屉和用户操作。 |
| `web-console/src/pages/Artifacts.tsx` | 前端页面级组件，承载业务流程、状态加载、错误处理、表格/详情/抽屉和用户操作。 |
| `web-console/src/pages/ArtifactsPage.tsx` | 前端页面级组件，承载业务流程、状态加载、错误处理、表格/详情/抽屉和用户操作。 |
| `web-console/src/pages/AuditLogs.tsx` | 前端页面级组件，承载业务流程、状态加载、错误处理、表格/详情/抽屉和用户操作。 |
| `web-console/src/pages/AuditLogsPage.tsx` | 前端页面级组件，承载业务流程、状态加载、错误处理、表格/详情/抽屉和用户操作。 |
| `web-console/src/pages/AutoRepairs.tsx` | 前端页面级组件，承载业务流程、状态加载、错误处理、表格/详情/抽屉和用户操作。 |
| `web-console/src/pages/AutoRepairsPage.tsx` | 前端页面级组件，承载业务流程、状态加载、错误处理、表格/详情/抽屉和用户操作。 |
| `web-console/src/pages/CiDiagnostics.tsx` | 前端页面级组件，承载业务流程、状态加载、错误处理、表格/详情/抽屉和用户操作。 |
| `web-console/src/pages/CiDiagnosticsPage.tsx` | 前端页面级组件，承载业务流程、状态加载、错误处理、表格/详情/抽屉和用户操作。 |
| `web-console/src/pages/Dashboard.tsx` | 前端页面级组件，承载业务流程、状态加载、错误处理、表格/详情/抽屉和用户操作。 |
| `web-console/src/pages/DependencyGraph.tsx` | 前端页面级组件，承载业务流程、状态加载、错误处理、表格/详情/抽屉和用户操作。 |
| `web-console/src/pages/ExecutionTasks.tsx` | 前端页面级组件，承载业务流程、状态加载、错误处理、表格/详情/抽屉和用户操作。 |
| `web-console/src/pages/ExecutionTasksPage.tsx` | 前端页面级组件，承载业务流程、状态加载、错误处理、表格/详情/抽屉和用户操作。 |
| `web-console/src/pages/IssueDecomposition.tsx` | 前端页面级组件，承载业务流程、状态加载、错误处理、表格/详情/抽屉和用户操作。 |
| `web-console/src/pages/IssueDecompositionPage.tsx` | 前端页面级组件，承载业务流程、状态加载、错误处理、表格/详情/抽屉和用户操作。 |
| `web-console/src/pages/Login.tsx` | 前端页面级组件，承载业务流程、状态加载、错误处理、表格/详情/抽屉和用户操作。 |
| `web-console/src/pages/ModelConfig.tsx` | 前端页面级组件，承载业务流程、状态加载、错误处理、表格/详情/抽屉和用户操作。 |
| `web-console/src/pages/ProjectDetail.tsx` | 前端页面级组件，承载业务流程、状态加载、错误处理、表格/详情/抽屉和用户操作。 |
| `web-console/src/pages/Projects.tsx` | 前端页面级组件，承载业务流程、状态加载、错误处理、表格/详情/抽屉和用户操作。 |
| `web-console/src/pages/PrReviews.tsx` | 前端页面级组件，承载业务流程、状态加载、错误处理、表格/详情/抽屉和用户操作。 |
| `web-console/src/pages/PrReviewsPage.tsx` | 前端页面级组件，承载业务流程、状态加载、错误处理、表格/详情/抽屉和用户操作。 |
| `web-console/src/pages/Register.tsx` | 前端页面级组件，承载业务流程、状态加载、错误处理、表格/详情/抽屉和用户操作。 |
| `web-console/src/pages/ScanTaskDetail.tsx` | 前端页面级组件，承载业务流程、状态加载、错误处理、表格/详情/抽屉和用户操作。 |
| `web-console/src/styles/app.css` | 全局产品样式表，定义布局、卡片、表格、移动端响应式和 SourceLens 视觉系统。 |
| `web-console/src/utils/displayRedaction.ts` | 前端工具函数，当前重点用于显示层脱敏和安全展示。 |
| `web-console/src/vite-env.d.ts` | 前端工程文件。 |
| `web-console/tests/agent-chat-audit-smoke.spec.ts` | Playwright UI smoke 测试，使用 mock 或真实后端证明页面状态、布局、可读性和 marker 合同。 |
| `web-console/tests/agent-chat-closure-rail-smoke.spec.ts` | Playwright UI smoke 测试，使用 mock 或真实后端证明页面状态、布局、可读性和 marker 合同。 |
| `web-console/tests/agent-chat-first-viewport-smoke.spec.ts` | Playwright UI smoke 测试，使用 mock 或真实后端证明页面状态、布局、可读性和 marker 合同。 |
| `web-console/tests/agent-tasks-detail-selection-smoke.spec.ts` | Playwright UI smoke 测试，使用 mock 或真实后端证明页面状态、布局、可读性和 marker 合同。 |
| `web-console/tests/app-shell-ui-smoke.spec.ts` | Playwright UI smoke 测试，使用 mock 或真实后端证明页面状态、布局、可读性和 marker 合同。 |
| `web-console/tests/artifacts-detail-selection-smoke.spec.ts` | Playwright UI smoke 测试，使用 mock 或真实后端证明页面状态、布局、可读性和 marker 合同。 |
| `web-console/tests/audit-logs-detail-selection-smoke.spec.ts` | Playwright UI smoke 测试，使用 mock 或真实后端证明页面状态、布局、可读性和 marker 合同。 |
| `web-console/tests/ci-diagnostics-detail-selection-smoke.spec.ts` | Playwright UI smoke 测试，使用 mock 或真实后端证明页面状态、布局、可读性和 marker 合同。 |
| `web-console/tests/dashboard-next-action-smoke.spec.ts` | Playwright UI smoke 测试，使用 mock 或真实后端证明页面状态、布局、可读性和 marker 合同。 |
| `web-console/tests/execution-tasks-detail-selection-smoke.spec.ts` | Playwright UI smoke 测试，使用 mock 或真实后端证明页面状态、布局、可读性和 marker 合同。 |
| `web-console/tests/issue-decomposition-detail-selection-smoke.spec.ts` | Playwright UI smoke 测试，使用 mock 或真实后端证明页面状态、布局、可读性和 marker 合同。 |
| `web-console/tests/model-config-recoverable-smoke.spec.ts` | Playwright UI smoke 测试，使用 mock 或真实后端证明页面状态、布局、可读性和 marker 合同。 |
| `web-console/tests/p9-main-path-recoverable-error-states-batch3.spec.ts` | Playwright UI smoke 测试，使用 mock 或真实后端证明页面状态、布局、可读性和 marker 合同。 |
| `web-console/tests/p9-main-path-recoverable-error-states-batch4a.spec.ts` | Playwright UI smoke 测试，使用 mock 或真实后端证明页面状态、布局、可读性和 marker 合同。 |
| `web-console/tests/p9-main-path-recoverable-error-states-batch4b.spec.ts` | Playwright UI smoke 测试，使用 mock 或真实后端证明页面状态、布局、可读性和 marker 合同。 |
| `web-console/tests/patch-ready-smoke.spec.ts` | Playwright UI smoke 测试，使用 mock 或真实后端证明页面状态、布局、可读性和 marker 合同。 |
| `web-console/tests/pr-reviews-detail-selection-smoke.spec.ts` | Playwright UI smoke 测试，使用 mock 或真实后端证明页面状态、布局、可读性和 marker 合同。 |
| `web-console/tests/project-detail-first-viewport-smoke.spec.ts` | Playwright UI smoke 测试，使用 mock 或真实后端证明页面状态、布局、可读性和 marker 合同。 |
| `web-console/tests/project-qa-autorepair-candidate-smoke.spec.ts` | Playwright UI smoke 测试，使用 mock 或真实后端证明页面状态、布局、可读性和 marker 合同。 |
| `web-console/tests/project-qa-low-confidence-smoke.spec.ts` | Playwright UI smoke 测试，使用 mock 或真实后端证明页面状态、布局、可读性和 marker 合同。 |
| `web-console/tests/project-qa-recoverable-smoke.spec.ts` | Playwright UI smoke 测试，使用 mock 或真实后端证明页面状态、布局、可读性和 marker 合同。 |
| `web-console/tests/public-repo-ui-smoke.spec.ts` | Playwright UI smoke 测试，使用 mock 或真实后端证明页面状态、布局、可读性和 marker 合同。 |
| `web-console/tests/report-autorepair-candidate-smoke.spec.ts` | Playwright UI smoke 测试，使用 mock 或真实后端证明页面状态、布局、可读性和 marker 合同。 |
| `web-console/tests/report-evidence-drawer-smoke.spec.ts` | Playwright UI smoke 测试，使用 mock 或真实后端证明页面状态、布局、可读性和 marker 合同。 |
| `web-console/tests/scan-governance-timeline-smoke.spec.ts` | Playwright UI smoke 测试，使用 mock 或真实后端证明页面状态、布局、可读性和 marker 合同。 |
| `web-console/tests/scan-task-detail-first-viewport-smoke.spec.ts` | Playwright UI smoke 测试，使用 mock 或真实后端证明页面状态、布局、可读性和 marker 合同。 |
| `web-console/tsconfig.json` | 前端工程文件。 |
| `web-console/tsconfig.node.json` | 前端工程文件。 |
| `web-console/tsconfig.node.tsbuildinfo` | 前端工程文件。 |
| `web-console/tsconfig.tsbuildinfo` | 前端工程文件。 |
| `web-console/vite.config.d.ts` | Vite 构建配置，包含 dev server、proxy、manual chunks 和构建边界。 |
| `web-console/vite.config.js` | Vite 构建配置，包含 dev server、proxy、manual chunks 和构建边界。 |
| `web-console/vite.config.ts` | Vite 构建配置，包含 dev server、proxy、manual chunks 和构建边界。 |

## 8. 更新规则

- 本文不要求每个微小改动后立即刷新；按 `docs/PRODUCT_GOVERNANCE.md` 的文档维护分级执行。
- 涉及新增/删除/重命名文件、目录结构变化、Controller 路由变化、前端路由/API client 变化时，运行 `make code-map`。
- 阶段验收、release evidence、交接前运行 `make code-map-check`；该检查已接入 `make verify`。
- 如果某个文件说明不够准确，优先增强 `scripts/generate-project-code-map.mjs` 的分类规则，再重新生成本文；不要只手改本文。
- `docs/API_DESIGN.md` 仍是 API 设计细节事实源；本文只提供定位和用途说明。

