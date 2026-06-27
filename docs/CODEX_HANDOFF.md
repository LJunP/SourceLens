# SourceLens Codex Handoff

状态：用于更换 Codex 账号或丢失聊天上下文后的续接。

## 1. 原始长期目标

继续按照 SourceLens 总路线逐步完成项目重构：

- 从阶段 0 开始推进到安全、任务、分析、Agent、前端、沙箱和 GitHub App 等路线完成。
- 当前不是一次性小任务，而是持续重构目标。
- 不要把目标缩小成“只完成当前文件”或“只跑一次测试”。

注意：Codex App 中显示的“目标”状态可能不会随账号迁移。新账号接手后，应让新的 Codex 重新建立同一个长期目标，并以本文件和路线图作为权威上下文。

新账号恢复后，第一句可以直接对 Codex 说：

```text
请先读取 /Users/lijunpeng/Desktop/cc/project/SourceLens/docs/CODEX_HANDOFF.md、
/Users/lijunpeng/Desktop/cc/project/SourceLens/docs/REFACTOR_ROADMAP.md、
/Users/lijunpeng/Desktop/cc/project/SourceLens/docs/SECURITY_BOUNDARY.md、
/Users/lijunpeng/Desktop/cc/project/SourceLens/docs/OPERATIONS_RUNBOOK.md，
然后重新建立/恢复这个长期目标：
“按照已制定的 SourceLens 总路线逐步完成项目重构，从阶段 0 开始推进到安全、任务、分析、Agent、前端、沙箱和 GitHub App 等路线完成。”
继续按照 SourceLens 总路线推进重构，不要重头分析，不要回滚已有改动。
```

## 2. 当前阶段判断

当前主线状态：

- 阶段 0-11 主线能力已落地第一版。
- 阶段 12 尚未真正启动，等待真实规模瓶颈或基准数据触发。
- 当前正在做“阶段 12 前生产化收口”。

已完成的主线能力：

- 阶段 0：冻结范围、基线、路线文档。
- 阶段 1：安全止血，生产默认密钥校验、Swagger/mock dev/test 限制、JWT denylist、凭据脱敏。
  - 本轮补强：`SecurityConfig` 只在显式 `dev`/`test` profile 放开 Swagger/OpenAPI 和 Mock LLM 路由；`staging`、`qa`、无 active profile 不再被“非 prod”逻辑自动放行。
- 阶段 2：Agent 工具边界，权限等级、只读默认、工具调用审计、工具输出脱敏。
- 阶段 3：AutoRepair patch 工作流，受控 PR 显式开关。
- 阶段 4：统一执行任务，attempt、step、append-only execution logs、取消/重试防覆盖。
- 阶段 5：artifact、audit、workspace cleanup、项目删除级联。
- 阶段 6：RAG 与代码切片第一版。
- 阶段 7：Rust analyzer schema/hash/限制/契约测试。
- 阶段 8：LLM adapter 和 JSON extractor。
- 阶段 9：前端统一任务体验、请求 ID、统一错误展示。
- 阶段 10：local/docker sandbox 抽象和 docker 隔离参数。
- 阶段 11：GitHub App installation、短期 token、webhook、受控 PR 第一版。

当前收口新增能力：

- `SourceLensMetrics` 业务指标。
- `/actuator/health`、`/actuator/info` 公开探活，`/actuator/metrics` 需要认证。
- `ActuatorSecurityTest` 锁住 Actuator 暴露边界。
- `scripts/smoke-test.sh` 已增加未认证 `/actuator/metrics` 必须返回 `401/403` 的部署安全断言。
- `SecurityStartupValidator` 生产 profile 增加仓库认证、docker sandbox 和 GitHub App 受控 PR 前置配置红线。
- `application-prod.yml` 生产默认使用 docker sandbox executor。
- `application-prod.yml` 和 `deploy/docker-compose.yml` 已显式暴露 docker sandbox 的 network、非 root user、pid limit、read-only root 和安全 tmpfs 参数，避免生产启动校验读不到执行器 `@Value` 默认值。
- `deploy/docker-compose.yml` prod 后端显式使用 docker sandbox，并显式关闭 PAT 凭据和本地文件仓库。
- `deploy/.env` 保持未跟踪，安全回归门禁会阻止其进入版本库。
- 后端 Docker 镜像从仓库根构建，同时打包 Spring Boot jar 和 Rust `sourcelens-analyzer` 到 `/usr/local/bin/sourcelens-analyzer`。
- 根 `.dockerignore` 已排除 `.git`、前端依赖、构建产物和私有 env 文件。
- CI 已增加后端 Docker 镜像构建 job。
- `docs/OPERATIONS_RUNBOOK.md` 运维手册。
- `scripts/smoke-test.sh` + `make smoke` 部署后验收。
- `.github/workflows/ci.yml` GitHub Actions。
- `scripts/verify-all.sh` + `make verify` 本地提交前验证。
- `make script-check` 单独检查所有 `scripts/*.sh` 语法，且已接入 `make verify`。
- `scripts/security-regression-check.sh` + CI security job 安全回归门禁。
- `scripts/dependency-regression-check.sh` + `make dependency-check` + CI supply-chain job 依赖和供应链回归门禁。
- `scripts/llm-safety-regression.sh` + `make llm-safety-check` + CI llm-safety job LLM Prompt injection 与输出质量契约门禁。
- `scripts/worktree-inventory.sh` + `make worktree-inventory` 工作区分组清单，辅助按模块拆审和拆提交。
- `scripts/production-preflight.sh` + `make prod-preflight` 生产验收前置条件检查。
- `scripts/backup-restore-preflight.sh` + `make backup-preflight` 备份恢复前置条件检查。
- `scripts/backup-restore-drill.sh` + `make backup-restore-drill` 备份恢复演练，恢复 SQL 到 Docker MySQL scratch database 并生成标准 evidence。
- `scripts/rollback-preflight.sh` + `make rollback-preflight` 回滚前置条件检查。
- `scripts/sandbox-drill.sh` + `make sandbox-drill` Docker sandbox 真实隔离兼容性演练。
- `scripts/github-app-drill.sh` + `make github-app-drill` GitHub App 只读端到端演练。
- `scripts/github-webhook-drill.sh` + `make github-webhook-drill` GitHub webhook 签名、重复投递和负例演练。
- `scripts/release-evidence.sh` + `make release-evidence` 发布验收证据包归档。
- `web-console/dist` 与 `web-console/tsconfig*.tsbuildinfo` 已移出 Git 跟踪，安全回归门禁会阻止构建产物重新入库。
- 认证响应边界已收口：注册和 `/api/auth/me` 使用 `UserResponse`，不返回 `User.passwordHash`、`deleted` 等内部字段，`User.passwordHash` 也有 `@JsonIgnore` 防御层。注册唯一键兜底已补齐：`UserService.register` 会 trim 用户名/邮箱，并把数据库唯一键冲突转为 `CONFLICT`，覆盖重复用户名、重复邮箱和逻辑删除记录仍占用唯一键的场景。
- `SensitiveDataSanitizer` 已补强 JSON/camelCase secret key、带空格引号 secret 值、Basic/Token 授权头、JWT/privateKey 字段、裸 OpenAI key 和 URL userinfo 密码脱敏；`SensitiveDataSanitizerTest` 与 `scripts/security-regression-check.sh` 已锁住这些边界。
- `prod-preflight` 在强制 GitHub App readiness 时会要求 `GITHUB_WEBHOOK_DELIVERY_CLEANUP_ENABLED=true`，并校验 `GITHUB_WEBHOOK_DELIVERY_RETENTION_DAYS` 与 `GITHUB_WEBHOOK_DELIVERY_CLEANUP_BATCH_SIZE`，避免生产 webhook 幂等记录无限增长。
- `prod-preflight` 还会检查 workspace sandbox、artifact、audit 和 execution log cleanup 策略：cleanup 关闭记录 warning，retention/batch 数值无效则失败；`deploy/.env.example` 已列出这些变量，方便真实发布前显式决策。
- `scripts/phase12-baseline.sh` + `make phase12-baseline` 阶段 12 触发条件基准采集。
- `docs/PHASE12_BASELINE.md` 阶段 12 基准阈值与决策口径。
- API、架构、数据库文档已更新到 GitHub App/PAT 开发兼容/脱敏边界。

## 3. 最近验证结果

最近确认过的验证：

- 认证注册唯一键兜底验证：
  - `UserService.register` 在服务层规范化用户名/邮箱，并在数据库唯一键兜底路径捕获 `DataIntegrityViolationException`，返回 `用户名已存在`、`邮箱已注册` 或通用身份冲突，不再把唯一键异常交给全局 500。
  - `AuthControllerTest` 新增重复邮箱和软删除用户名唯一键占用回归，既覆盖服务层预检查，也覆盖数据库约束兜底。
  - `mvn -q -Dtest=AuthControllerTest test`、`mvn -q -DskipTests package`、`git diff --check` 通过。
  - 本地 `8080` 已重启到新 jar，真实 MySQL/HTTP smoke 验证重复用户名、重复邮箱和软删除用户名占用均返回 409；临时用户和审计数据已清理。
- 审计日志 500 修复验证：
  - 用户提供的真实报错为 `github_webhook_deliveries` 与 `github_webhook_delivery_projects` 在 correlated `EXISTS` 中比较 `delivery_id` 时触发 `Illegal mix of collations`。
  - 当前源码已改为两阶段查询：先查项目映射表 delivery id，再用 `IN` 查询 delivery。
  - `V027__normalize_github_webhook_delivery_collation.sql` 已统一两张 webhook delivery 表的 `delivery_id` collation。
  - `mvn -q -Dtest=GitHubWebhookDeliveryServiceTest,GitHubWebhookDeliveryControllerTest test` 通过。
  - Docker MySQL 中 Flyway 当前 schema 为 `027`，两张 webhook delivery 表的 `delivery_id` collation 均为 `utf8mb4_unicode_ci`。
  - 本地 `8080` 已重启为最新 Spring Boot jar，`/actuator/health` 返回 `UP`；用本地 JWT 请求 `/api/projects/4/github-webhook-deliveries?page=1&pageSize=20` 返回 `SUCCESS`。
  - 本轮复核：用户补充日志中的 `PID 95441` 属于旧后端进程；当前 `launchctl` 管理的 8080 进程为 `PID 37510`，启动日志显示 Flyway schema `027` 且 up to date。本地 `8080` 对 `/audit-logs`、`/agent-tool-calls`、`/github-webhook-deliveries` 三个接口均返回 `SUCCESS`；浏览器审计页刷新后无 `Internal server error` toast。
- 顶部用户菜单可用性验证：
  - `AppLayout` 的右上角用户菜单使用 click 触发，用户按钮补充 `aria-haspopup` 和精确 `aria-label`。
  - 退出菜单图标设置为装饰性，避免菜单项可访问名称混入英文 `logout`。
  - `npm run build` 和 `git diff --check` 通过。
  - 浏览器 smoke 用临时用户验证：登录后刷新 `/dashboard`，点击 `用户菜单：<username>` 能看到精确 `退出登录` 菜单项，点击后回到 `/login` 且登录按钮可见；临时用户和审计数据已清理。
- 项目详情页前端体验验证：
  - 新增 Analysis Readiness 面板，汇总最新扫描、核心产物、报告质量、下一步动作、产物库、代码问答、依赖图谱和扫描详情入口。
  - 修复无成功扫描、缺少概览产物或加载失败时旧 overview/fileTree/reportQuality 残留的问题。
  - `npm run build` 通过，`git diff --check` 通过。
  - 浏览器验证桌面宽度和 `390x844` 移动宽度均确认 `.sl-analysis-readiness` 存在、无错误 toast、无水平溢出。
- 仪表盘主链路行动面板验证：
  - `Dashboard` 新增 Workflow Command 面板，包含仓库接入、报告复盘、代码问答、自动修复、审计治理 5 个行动卡。
  - 行动卡基于 dashboard stats 和 recent scans 推导当前状态，并跳转到项目、扫描详情、项目 QA、自动修复和审计治理入口。
  - `Dashboard` 新增页面内加载错误态和手动刷新；`AuditLogsPage` 支持 `?projectId=` 参数以便从仪表盘直接打开对应项目审计页。
  - `npm run build` 通过，目标文件 `git diff --check` 和尾随空白扫描通过。
  - 浏览器 smoke 用临时 projectId `40` / scanTaskId `44` 验证桌面和 `390px` 移动宽度均显示 5 张行动卡、无横向溢出、无错误 toast、无新增控制台错误；`/audit-logs?projectId=40` 能选中对应项目；临时用户、项目、仓库、扫描任务、scan_artifacts 和审计数据已清理。
- 仪表盘 code_chunks 就绪度验证：
  - `ScanStatService` 统计最新成功扫描的 `code_chunks` 总数和已向量化数量，`DashboardController` 返回 `latestCodeChunks` 和 `latestEmbeddedChunks`。
  - `Dashboard` 主链路“代码知识库”和 Workflow Command “代码问答”不再用文件数判断 QA 可用性，而是使用真实切片数量和向量覆盖率。
  - 新增 `DashboardControllerTest` 锁住 stats 响应中的 chunk readiness 字段。
  - `mvn -q -Dtest=DashboardControllerTest,ScanStatServiceTest test`、`mvn -q -DskipTests package`、`npm run build` 通过。
  - 运行时 API smoke 用临时 projectId `41` / scanTaskId `45` / 3 条 code_chunks 验证 `/api/dashboard/stats` 返回 `latestCodeChunks=3`、`latestEmbeddedChunks=1`；浏览器桌面和 `390px` 移动宽度确认 hero 显示 `3 chunks ready`、行动卡显示 `代码问答 3 chunks`、主链路显示 `向量覆盖 33%`，无横向溢出、无错误 toast、无新增控制台错误；临时用户、项目、仓库、扫描任务、code_chunks、scan_artifacts 和审计数据已清理。
- 项目 QA Playbook 验证：
  - `Dashboard` 的“代码问答”行动卡在 code_chunks 就绪时跳转到 `/projects/{id}?tab=qa&question=...`，把当前知识库状态转成一个可直接检索的问题。
  - `ProjectDetail` QA tab 支持 URL 预填问题，进入页面后会同步填充对话输入框、证据检索框，并自动执行 code_chunks search。
  - QA 工作台新增动态 Playbook：按 `totalChunks`、`embeddedChunks`、embedding 覆盖率、检索模式和错误状态生成 starter；切片缺失、无 embedding、低覆盖和可用 RAG 分别给出不同问题入口。
  - `npm run build` 通过。
  - 浏览器 smoke 用临时 projectId `46` / scanTaskId `46` / 3 条 code_chunks 验证预填问题、Playbook、starter 卡、证据检索结果均渲染；桌面和 `390px` 移动宽度无横向溢出、无 `Internal server error`；临时用户、项目、仓库、扫描任务和 code_chunks 已清理。
- code_chunks 复合标识符检索验证：
  - `CodeChunkRanker.tokenize` 会保留原始紧凑词，并拆出 camelCase/PascalCase/数字边界子词，例如 `controllerServiceRepository` 会扩展出 `controller`、`service`、`repository`。
  - 新增 `CodeChunkServiceTest` 覆盖复合查询排序和 tokenizer 输出，避免回退到只按原始整词匹配。
  - `mvn -q -Dtest=CodeChunkServiceTest,CodeQaRetrievalServiceTest,CodeChunkControllerTest,CodeQaControllerTest test` 通过。
  - `mvn -q -DskipTests package`、`npm run build`、`git diff --check` 通过。
  - 本地 8080 已重启到新 jar，API smoke 用临时 project/scan/code_chunks 验证 `controllerServiceRepository` 查询将 `src/main/java/com/example/controller/PawnTicketController.java` 排在 `docs/architecture.md` 前；临时数据已清理。
- Code QA 相邻切片上下文验证：
  - `CodeQaController` 仍先通过 `CodeQaRetrievalService.selectTopChunks` 选出最相关 chunk，再调用 `CodeChunkService.expandWithAdjacentChunks(scanTaskId, topChunks, 1, 8)` 补入同文件前后相邻切片。
  - `CodeChunkSearchItem` 新增 `contextRole` / `contextDistance`：主命中为 `PRIMARY` / `0`，相邻补充为 `ADJACENT_CONTEXT` / `1`。前端引用依据和检索结果都会显示“主证据/上下文”，避免把邻接代码误当作同等检索命中。
  - `CodeEvidenceProfileService` 和前端 `buildChunkEvidenceProfile` 只用主证据计算平均分、低可信度和向量证据比例，同时在 summary/details 中单独展示上下文补充数量。
  - 新增 `CodeChunkServiceTest.expandWithAdjacentChunks_shouldKeepPrimaryChunkFirstAndAppendSameFileNeighbors` 和 `CodeQaControllerTest.codeQa_shouldExpandAdjacentChunksIntoPromptContext`。
  - `mvn -q -Dtest=CodeChunkServiceTest,CodeQaControllerTest,CodeQaRetrievalServiceTest,CodeChunkControllerTest test` 通过。
  - `mvn -q clean -DskipTests package`、`npm run build`、`git diff --check` 通过。
  - 本地 8080 已重启到新 jar，API smoke 和浏览器 QA 页用临时 project/scan/code_chunks 验证 `validateJwtSignature` 问答返回 `PRIMARY, ADJACENT_CONTEXT, ADJACENT_CONTEXT`，证据摘要显示 `1 条主证据 · 2 条上下文`；临时数据已清理。
- 审计日志页前端体验验证：
  - 三类审计源改为源级健康状态：通用审计、Agent 工具调用、GitHub Webhook 分别展示 loading/error/ready。
  - 数据源失败时不再连续弹全局 toast，而是在源卡片和对应 tab 内展示可重试错误条，并保留上次成功数据。
  - 任一审计源不可用时治理信号变为 `danger`，避免接口失败但空数据被误判为健康。
  - 本轮补强：`ProjectSelector` loading 去掉孤立 `Spin tip`，审计页 Tabs 对三个筛选表单启用 `forceRender`，消除首屏刷新后的 Ant Design 开发 warning。
  - `npm run build` 通过，`git diff --check` 通过。
  - 浏览器验证桌面宽度和 `390x844` 移动宽度均确认 3 个 `.sl-audit-source-card` 渲染、无全局错误 toast、无水平溢出。
- 扫描详情页 Code Knowledge readiness 验证：
  - `ScanTaskDetail` 新增 Code Knowledge 面板，展示 code_chunks 总量、向量覆盖、检索模式、证据可信度、样例文件和下一步动作。
  - 面板连接 `/api/projects/{projectId}/code-chunks/search` 的 `retrievalMode` 与 `evidenceProfile`；当扫描成功但 code_chunks 为 0 时显示危险态并提示检查 `chunk_code`。
  - `npm run build`、`mvn -DskipTests compile`、`mvn -DskipTests package` 通过。
  - 本地 8080 API 验证 projectId `4` / scanTaskId `24` 返回 `retrievalMode=NO_CONTEXT`、`evidenceReadiness=GAP`。
  - 浏览器 smoke 用临时用户/项目/scanTaskId `41` 验证 `.sl-code-knowledge-panel-danger` 渲染、无全局错误 toast；临时用户、项目、仓库、扫描任务和相关审计数据已清理。
- 扫描报告 Report Action Board 验证：
  - `ScanTaskDetail` 报告总览新增 4 个后续行动卡：风险定位、代码问答、依赖复盘、修复候选。
  - 行动卡按当前报告证据启停：缺少核心报告、依赖图谱、可定位风险或仓库 id 时对应动作禁用。
  - `npm run build` 通过，目标文件 `git diff --check` 通过。
  - 浏览器 smoke 用临时 scanTaskId `43` 验证桌面和 `390px` 移动宽度均显示 4 张行动卡、无横向溢出、无错误 toast；临时用户、项目、仓库、扫描任务、artifact、webhook delivery 和文件产物已清理。
- 扫描报告 Trace Map 验证：
  - `ScanTaskDetail` 报告总览新增“报告章节追踪”，覆盖质量风险、API 表面、数据模型、依赖图谱和产物证据 5 个证据面。
  - 每个证据面提供对应报告 tab/产物库入口，以及带 `question` 参数的项目 QA 追问入口，让报告阅读能直接续接 code_chunks 问答。
  - `npm run build` 通过，目标文件 `git diff --check` 通过。
  - 浏览器 smoke 用临时 projectId `60` / scanTaskId `54` / 5 个 artifact / 2 条 code_chunks 验证 Trace Map 渲染 5 个证据面、风险按钮打开质量风险 tab、追问代码跳转 `/projects/60?tab=qa&question=...`；默认视口和 `390px` 移动视口均无横向溢出、无错误 toast；临时用户、项目、仓库、扫描任务、artifact、code_chunks 和本地 artifact 文件已清理。
- 报告到 QA scanTaskId 贯通验证：
  - `CodeQaRequest` 新增 `scanTaskId`，指定扫描时后端校验项目归属和任务状态；未指定时保持最近成功扫描回退逻辑。
  - `ScanTaskDetail` 的 Code Knowledge、Report Action Board、Evidence Profile 和 Trace Map QA 入口统一生成 `?tab=qa&scanTaskId=<当前扫描>`，带追问时额外携带 `question`。
  - `ProjectDetail` 解析 URL `scanTaskId`，QA 初始知识库探针、手动 code_chunks 搜索和 `/qa` 问答请求均使用同一证据源；离开 QA tab 时清理 `question` 和 `scanTaskId`。
  - `mvn -q -Dtest=CodeQaControllerTest test`、`mvn -q -DskipTests package`、`npm run build`、`git diff --check` 通过；本地 8080 已重启到新 jar。
  - API smoke 用临时 projectId `62` / requested scanTaskId `55` / latest scanTaskId `56` 验证：审计页三源均 `200 SUCCESS`；指定旧 scanTaskId 的 QA 返回 `RequestedScanAuthService`，不指定 scanTaskId 的 QA 返回 `LatestScanAuthService`；临时用户、项目、仓库、扫描任务、code_chunks、webhook delivery 和审计数据已清理。
- code_chunks search scanTaskId 状态门禁验证：
  - `CodeChunkController.search` 对指定 `scanTaskId` 先校验项目归属，再要求扫描状态为 `SUCCESS`；非成功扫描不执行 count/search，而是返回结构化 `NO_SCAN` 空证据。
  - 这条边界与 `/qa` 的证据源选择保持一致，避免报告页或 QA 页预检时读取运行中、失败或取消扫描的残留切片。
  - `mvn -q -Dtest=CodeChunkControllerTest,CodeQaControllerTest test`、`mvn -q -DskipTests package`、`git diff --check` 通过；本地 8080 已重启到 PID `81016`。
  - API smoke 用临时 projectId `63` / RUNNING scanTaskId `57` 且人为插入一条 chunk 验证 `/code-chunks/search?scanTaskId=57&query=auth` 返回 `SUCCESS`、`retrievalMode=NO_SCAN`、`resultCount=0`、`items=[]`、`evidenceProfile.readiness=IDLE`；临时用户、项目、仓库、扫描任务、code_chunks 和审计数据已清理。
- 报告到 Agent scanTaskId 贯通验证：
  - `AgentTaskService.create` 对指定 `scanTaskId` 执行存在性、项目归属和 `SUCCESS` 状态校验；未指定时保持最近成功扫描回退逻辑。
  - `AgentRuntime` 通过 `Conversation.agentTaskId` 反查 `AgentTask.scanTaskId`，注入 `ToolContext`；`PromptBuilder` 同样把绑定扫描传给 `ProjectContextBuilder.buildContext`，使系统 prompt 和工具上下文使用同一报告证据源。
  - `GetSymbolsTool` 优先使用 `ToolContext.scanTaskId`，并拒绝跨项目扫描；缺省时仍回退项目最新成功扫描。
  - `ScanTaskDetail` 报告行动区新增“Agent 审查”入口；`AgentTasksPage` 支持 `projectId` 初始选择，`AgentTasks` 支持 `openCreate/scanTaskId/taskType/title/description` 参数预填创建表单。
  - `mvn -q -Dtest=AgentTaskServiceTest,AgentSandboxToolTest test`、`mvn -q -DskipTests package`、`npm run build` 通过；本地 8080 已重启到 PID `93987`。
  - API smoke 用临时用户/项目/扫描验证：绑定 `SUCCESS` scanTask 可创建 Agent 任务；绑定 `RUNNING` scanTask 返回 `BAD_REQUEST` 且提示尚未成功完成；绑定其他项目 scanTask 返回 `BAD_REQUEST` 且提示不属于当前项目；临时数据已清理。
- Agent 工具调用 scanTask 审计验证：
  - 新增 Flyway `V028__add_agent_tool_call_scan_task_id.sql`，`agent_tool_calls.scan_task_id` 为可空列并带索引。
  - `ToolExecutionService` 保存工具审计时写入 `ToolContext.scanTaskId`；`AgentToolCallController` / `AgentToolCallService` 支持 `scanTaskId` 项目内过滤。
  - 前端 `AuditLogs` 的 Agent 工具调用 tab 增加 ScanTask ID 筛选、列表扫描列和 drawer 扫描字段。
  - `mvn -q -Dtest=AgentToolCallControllerTest,ToolExecutionServiceTest,AgentTaskServiceTest,AgentSandboxToolTest test`、`mvn -q -DskipTests package`、`npm run build`、`git diff --check` 通过；本地 8080 已重启到 PID `98807`。
  - Docker MySQL 显示 Flyway 最新版本 `028`；API smoke 用临时 project + 两条 `agent_tool_calls` 验证 `/agent-tool-calls?scanTaskId=42` 只返回 `scanTaskId=42` 的记录；临时数据已清理。
- 扫描审计深链验证：
  - `AuditLogsPage` 解析 `scanTaskId` URL 参数并传入 `AuditLogs`；`AuditLogs` 会预填 Agent 工具调用筛选、默认打开 Agent 工具调用 tab，并在页头显示 `scan #<id>` 上下文。
  - Agent 工具审计列表扫描列和 drawer 均可回跳 `/scan-tasks/{scanTaskId}`。
  - `ScanTaskDetail` 顶部操作区新增“审计追踪”按钮，任何扫描任务即使没有 artifact 也能进入 `/audit-logs?projectId=<projectId>&scanTaskId=<scanTaskId>`；报告行动板也保留审计追踪动作卡。
  - `npm run build`、`git diff --check` 通过。
  - 浏览器 smoke 用临时 projectId `70` / scanTaskId `61` 验证：审计页 URL 深链自动填入扫描任务 `61`，只展示当前 scan 的 `codex_ui_audit_get_symbols`，不会展示其他 scan 的 `codex_ui_audit_other_scan`；扫描详情顶部显示“审计追踪”，点击后跳转到带 `projectId=70&scanTaskId=61` 的审计页；临时用户、项目、扫描任务和工具审计数据已清理。
- 项目页 code_chunks 状态闭环验证：
  - `ProjectDetail` 会对最新成功扫描预加载一次 `/api/projects/{projectId}/code-chunks/search?scanTaskId=<id>&limit=1`，用真实 `totalChunks`、`embeddedChunks`、`retrievalMode` 和 `evidenceProfile` 驱动顶部主链路、Analysis Readiness 和 QA 页健康卡片。
  - 顶部 `code_chunks` 阶段不再用 `overview.totalFiles` 冒充切片数；`报告/Agent` 阶段不再只凭扫描成功显示 Ready，而是跟随 Analysis Readiness 显示 `Ready` 或 `Review`。
  - QA 页未搜索前也会显示知识库状态；搜索后继续用检索结果覆盖命中数、召回模式和证据质量。
  - `npm run build` 通过，目标文件 `git diff --check` 通过。
  - 浏览器 smoke 用临时 projectId `31` / scanTaskId `42` / 3 条 code_chunks 验证顶部显示 `code_chunks 3 / 向量 33%`、`报告/Agent Review`，QA 初始健康卡显示 `代码切片 3`、`向量覆盖 33%`、`召回模式 稳定回退`，搜索 `login` 后命中 2 条结果且无全局错误 toast；临时用户、项目、仓库、扫描任务、code_chunks 和审计数据已清理。
- 运行产物库错误体验验证：
  - `Artifacts` 已把列表加载失败从全局 toast 改为页面内 `loadError`，错误时 Evidence Readiness 进入 `danger`，有旧数据时明确保留上次成功数据。
  - 智能预览失败改为 drawer 内 `previewError`，不会污染整页，也不会触发全局 toast。
  - `npm run build` 通过。
  - 浏览器 smoke 用临时 projectId `34` / 4 条核心 artifact 验证 readiness 为 ready、4 个表格行、无全局 toast；故意触发不存在文件预览时 drawer 内显示“智能预览加载失败”，全局 toast 仍为 0；临时用户、项目、artifact 和审计数据已清理。
- 备份/回滚 artifact 匹配边界验证：
  - `backup-restore-preflight.sh`、`rollback-preflight.sh` 和 `release-evidence.sh` 统一使用 `backup_id[-_.]*` 匹配备份 artifact，不再接受任意子串匹配。
  - `security-regression-check.sh` 已加入禁止 `-name "*$backup_id*"` 回退的断言。
  - `bash -n scripts/backup-restore-preflight.sh scripts/rollback-preflight.sh scripts/release-evidence.sh scripts/security-regression-check.sh` 通过。
  - 临时负向验证：只有 `backup10-*` artifact 时，`backup_id=backup1` 在 backup/rollback preflight 中都报告未找到匹配 artifact。
  - 临时正向验证：`backup1-database.sql.gz`、`backup1-workspace.tar.gz`、`backup1-artifacts.tar.gz`、`backup1-checksums.sha256` 可识别 4 类 artifact，3 个 checksum 均重新计算并比对通过。
- 备份恢复 drill 验证：
  - 新增 `scripts/backup-restore-drill.sh` 和 `make backup-restore-drill`。
  - 正向临时备份恢复得到 `database_tables=1`、`workspace_entries=2`、`artifact_entries=2`，并确认 Docker MySQL scratch database 无残留。
  - 负向验证：包含 `USE sourcelens` 的 SQL dump 被拒绝；`backup_id=backup1` 不会匹配 `backup10-*`。
  - `backup-restore-preflight.sh` 能识别 drill 生成的 evidence backup id。
- 后端全量：`mvn clean test`
  - 最近结果：`300 tests, 0 failures, 0 errors`。
- 本地统一验证：`make verify`
  - Shell 脚本语法检查通过。
  - Git diff whitespace check 通过，覆盖未暂存和已暂存 diff。
  - 后端测试通过，最近一次 `300 tests, 0 failures, 0 errors`。
  - 前端 `npm run build` 通过。
  - Rust `cargo check --locked` 通过。
  - Rust `cargo test --locked` 通过，4 个 Rust 测试通过。
  - LLM safety regression 通过。
  - 安全回归检查通过。
  - 依赖回归检查通过。
- 文档一致性：
  - 搜索确认已无旧 GitHub PAT、旧 encrypted token 和 PAT auth 示例等危险旧示例。
  - 本轮补强：`TokenEncryptor` 新写入密文切到版本化 AES-GCM（`SLENC2:` 前缀），错密码或密文篡改必须认证失败；旧 CBC/Base64 密文仅保留读取兼容。
  - `git diff --check` 通过。
- 本轮新增验证：
  - `mvn -Dtest=SecurityStartupValidatorTest test` 通过，12 tests, 0 failures, 0 errors。
  - `make verify` 通过，后端 278 tests、前端 build、Rust check/test 全部通过。
  - `bash -n scripts/phase12-baseline.sh` 通过。
  - `make help` 已显示 `phase12-baseline` 入口。
  - 本机无需安装 host mysql CLI：`scripts/phase12-baseline.sh` 已支持 `SOURCELENS_PHASE12_MYSQL_EXECUTOR=auto|host|docker`，默认 auto 会在 host mysql 不可用时使用 `sourcelens-mysql` 容器内 mysql client 做只读 baseline。
- 本轮阶段 12 baseline 脚本硬化：
  - 本轮补强：`scripts/phase12-baseline.sh` 新增 `SOURCELENS_PHASE12_BASELINE_ENV_FILE`，默认回退到 `SOURCELENS_PREFLIGHT_ENV_FILE` / `deploy/.env`；读取 `DB_URL`、`DB_USERNAME`、`DB_PASSWORD` 前会独立校验真实 env 文件边界，拒绝 symlink、目录、空文件、不可读文件和 group/world 可访问权限；`deploy/.env.example` 模板跳过私有权限检查，缺失文件只回退到进程环境。
  - `scripts/phase12-baseline.sh` 会在查询真实数据库前校验阈值、端口、连接超时和 scan task id 为正整数，`DB_URL` 必须是 `jdbc:mysql://.../<database>` 形式。
  - 本轮补强：Docker executor 会校验容器名为安全 Docker container name，只读使用 MySQL 容器自身的 `MYSQL_USER`、`MYSQL_PASSWORD` 和 `MYSQL_DATABASE`，不通过 `docker exec -e KEY=value` 命令行参数传入数据库密码。
  - 本轮补强：强制 phase12 baseline 但缺少 `DB_USERNAME` / `DB_PASSWORD` 等数据库凭据时会记录 `phase12-baseline` required failure；安全回归会验证该失败证据包仍可通过 `make verify-release-evidence` / `scripts/verify-release-evidence.sh` 复核，并用 fake `mysql` 确认失败发生在真实数据库查询前。
  - MySQL CLI 查询增加 `--connect-timeout`，避免错误地址长时间挂起。
  - 递归调用链采样改为带分隔符路径环检测，避免 symbol id 子串关系导致 `12`/`112` 这类误判。
  - `scripts/security-regression-check.sh` 已锁住上述基准脚本红线。
  - 使用临时 fake `mysql` 验证：无效 `SOURCELENS_PHASE12_CALL_CHAIN_DEPTH=0` 会失败，非 MySQL `DB_URL` 会失败，私有 env 文件正常假数据可输出 baseline verdict，`644` env 文件会在连接数据库前 fail-closed。
- 本轮 smoke 安全断言验证：
  - `bash -n scripts/smoke-test.sh` 通过。
  - `mvn -Dtest=ActuatorSecurityTest test` 通过，2 tests, 0 failures, 0 errors。
  - 使用临时 fake `curl` 跑无 token smoke 通过，确认 `/actuator/metrics` 未认证 `403` 时脚本成功。
- 本轮安全回归门禁验证：
  - `bash -n scripts/security-regression-check.sh` 通过。
  - `./scripts/security-regression-check.sh` 通过。
  - `make verify` 已接入安全回归检查并通过，后端 277 tests、前端 build、Rust check/test、安全回归检查全部通过。
- 本轮 Compose 红线验证：
  - `deploy/docker-compose.yml` 显式设置 prod profile、docker sandbox、禁用 PAT 和禁用本地文件仓库。
  - `deploy/.env` 当前未被 Git 跟踪。
  - `docker compose --env-file deploy/.env.example -f deploy/docker-compose.yml config` 通过，并确认上述红线出现在渲染后的 Compose 配置中；preflight 现在还会在真实 env 文件存在时对实际发布配置再做一次 Compose render。
- 本轮 Docker analyzer 打包验证：
  - `cargo build --release --locked` 在 `analyzer-rust` 目录通过。
  - `docker build -f backend-spring/Dockerfile --target analyzer-builder .` 未执行成功，原因是当前 Docker daemon 未运行；后续 Docker 可用时需要补跑完整镜像构建。
- 本轮 Docker context/CI 验证：
  - 根 `.dockerignore` 已新增，并由安全回归门禁检查关键排除项。
  - `.github/workflows/ci.yml` 已增加 `Backend Docker Image` job。
- 本轮 Docker 基础镜像供应链收口：
  - `backend-spring/Dockerfile` 的 Maven builder、Rust analyzer builder 和 JRE runtime 基础镜像已固定为 `tag@sha256:digest`。
  - digest 通过 Docker Registry API 读取当前官方镜像 tag 的 manifest digest 后写入 Dockerfile。
  - `scripts/dependency-regression-check.sh` 会扫描所有 Dockerfile，拒绝外部 `FROM` 未固定到 `sha256` digest。
  - `scripts/security-regression-check.sh` 已检查后端 Dockerfile 不得退回裸 tag，并确认依赖回归脚本保留 Dockerfile digest pinning 门禁。
  - 当前 Docker daemon 仍不可用，真实镜像 build 仍需后续在 Docker 可用环境补跑。
  - `make verify` 通过，后端 277 tests、前端 build、Rust check/test、安全回归检查、依赖回归检查全部通过。
  - `SOURCELENS_PREFLIGHT_WARN_ONLY=true ./scripts/production-preflight.sh` 通过，仍为预期的 4 个外部环境 warning。
- 本轮 Docker Compose 外部镜像供应链收口：
  - `deploy/docker-compose.yml` 的 MySQL 和 Redis 外部服务镜像已固定为 `tag@sha256:digest`。
  - digest 通过 Docker Registry API 读取当前官方镜像 tag 的 manifest digest 后写入 Compose 文件。
  - `scripts/dependency-regression-check.sh` 会扫描 `deploy/*.yml` 和 `deploy/*.yaml`，拒绝未固定到 `sha256` digest 的 Compose service image。
  - `scripts/security-regression-check.sh` 已检查 Compose image 不得退回裸 tag，并确认依赖回归脚本保留 Compose image digest pinning 门禁。
  - `docker compose --env-file deploy/.env.example -f deploy/docker-compose.yml config` 通过，渲染结果保留 digest-pinned MySQL/Redis image。
  - `SOURCELENS_PREFLIGHT_WARN_ONLY=true ./scripts/production-preflight.sh` 通过，仍为当前已知的 7 个 warning。
- 本轮 Docker Compose 渲染后发布红线收口：
  - `production-preflight.sh` 会捕获 `docker compose config` 渲染结果，并分别检查 backend/mysql/redis 服务块。
  - 模板 env 和真实 env 文件都会验证 prod profile、仓库根 build context、`backend-spring/Dockerfile`、docker sandbox executor、no-network、非 root user、pid limit、read-only root、安全 tmpfs、禁用 PAT、禁用本地 file repo、backend workspace volume、healthy depends_on，以及 MySQL/Redis digest-pinned image。
  - `scripts/security-regression-check.sh` 已锁住渲染后 Compose 检查函数和关键红线断言。
  - `bash -n scripts/production-preflight.sh`、`bash -n scripts/security-regression-check.sh` 和 `./scripts/security-regression-check.sh` 通过。
  - `SOURCELENS_PREFLIGHT_WARN_ONLY=true ./scripts/production-preflight.sh` 显示模板 env 与当前 `deploy/.env` 渲染结果均保留上述 Compose 红线，summary 仍为当前已知的 7 个 warning。
- 本轮 Docker sandbox 执行镜像供应链收口：
  - `application.yml`、`application-prod.yml`、`deploy/.env.example` 和 `DockerSandboxExecutor` 的默认 sandbox 镜像已从 `alpine/git:latest` 改为 `alpine/git:latest@sha256:digest`。
  - `SecurityStartupValidator` 生产 profile 会拒绝未固定到 `sha256` digest 的 `sourcelens.sandbox.docker.image`。
  - `production-preflight.sh` 会在真实 env 覆写 `SOURCELENS_SANDBOX_DOCKER_IMAGE` 时提前拒绝裸 tag。
  - `SecurityStartupValidatorTest` 覆盖生产 profile 拒绝未 pin digest 的 sandbox 镜像；`DockerSandboxExecutorTest` 覆盖默认 docker run 命令包含 digest-pinned 镜像。
  - 定向测试 `mvn -Dtest=SecurityStartupValidatorTest,DockerSandboxExecutorTest test` 通过，16 tests, 0 failures, 0 errors。
  - 使用 `SOURCELENS_SANDBOX_DOCKER_IMAGE=alpine/git:latest` 模拟 preflight 会报告必须 pin `sha256` digest；使用 digest-pinned 值则通过该项。
  - 当前私有 `deploy/.env` 未覆写 `SOURCELENS_SANDBOX_DOCKER_IMAGE`，warn-only preflight 显示使用 `application-prod.yml` 的 digest-pinned 默认值。
- 本轮依赖和供应链门禁验证：
  - `scripts/dependency-regression-check.sh` 已新增，检查前端 lockfile、Rust lockfile、CI locked install/check/test、GitHub Actions commit SHA、Dockerfile base image digest、Docker Compose service image digest，以及 Maven/Rust/前端不可复现依赖模式。
  - `.github/workflows/ci.yml` 已增加 `Dependency Regression Checks` job。
  - `make dependency-check` 已新增为独立入口，并已接入 `make verify`。
  - `bash -n scripts/dependency-regression-check.sh` 通过。
  - `make dependency-check` 通过。
  - `make help` 已显示 `dependency-check` 入口。
- 本轮 worktree 分组清单验证：
  - `scripts/worktree-inventory.sh` 已新增，按安全、审计、分析、任务、Agent、沙箱、GitHub App、前端、Rust analyzer、CI/运维、文档等组输出当前 `git status`。
  - 本轮补强：worktree inventory 临时分组目录使用 `sourcelens-worktree-inventory` 前缀，并在写入分组文件前显式收紧为 `700`。
  - `make worktree-inventory` 已新增为独立入口。
  - `bash -n scripts/worktree-inventory.sh` 通过。
  - `make worktree-inventory` 通过。
- 本轮生产验收 preflight 验证：
  - `scripts/production-preflight.sh` 已新增，检查静态安全/依赖门禁、Docker daemon、docker compose config、MySQL CLI、生产变量、GitHub App 前置条件和可选 smoke 目标。
  - `scripts/production-preflight.sh` 会先用 `deploy/.env.example` 渲染 Compose 模板，再用存在的真实部署 env 文件渲染一次，`SOURCELENS_PREFLIGHT_ENV_FILE` 支持指定相对或绝对 env 文件路径。
  - GitHub App readiness 分支已检查 GitHub API 出口策略：API base URL 必须 HTTPS、host 在 `GITHUB_ALLOWED_API_HOSTS` 中，并拒绝 localhost、内网、链路本地、metadata、user-info、query 和 fragment。
  - `make prod-preflight` 已新增为独立入口。
  - `bash -n scripts/production-preflight.sh` 通过。
  - `SOURCELENS_PREFLIGHT_WARN_ONLY=true ./scripts/production-preflight.sh` 通过。
  - 早期本机输出曾提示 Docker daemon 不可达、mysql CLI 不可用、未强制 GitHub App E2E 检查、未设置 `SOURCELENS_BASE_URL`；当前真实 Docker daemon 已可达，smoke target 已使用 `http://localhost:8081` 验收通过，Phase12 baseline 已可通过 Docker MySQL executor 运行，GitHub App 真实凭据缺口按高级集成层暂缓。
- 本轮 preflight 回归门禁补强：
  - `scripts/security-regression-check.sh` 已检查 `make prod-preflight` 入口、preflight warn-only 模式、Docker daemon 检查、Compose config 模板与真实 env 双渲染检查、安全/依赖静态门禁、GitHub App readiness 强制开关、`.env.example` 受控 PR 安全默认和 GitHub App 占位、运维手册 preflight 用法。
- 本轮备份恢复 preflight 收口：
  - `scripts/backup-restore-preflight.sh` 已新增，默认读取 `deploy/.env` 或 `SOURCELENS_BACKUP_PREFLIGHT_ENV_FILE` 指向的真实部署 env 文件。
  - `make backup-preflight` 已新增为独立入口，`deploy/.env.example` 已增加 `SOURCELENS_BACKUP_DIR`、`SOURCELENS_BACKUP_RETENTION_DAYS` 和 `SOURCELENS_BACKUP_ENCRYPTION_REQUIRED`。
  - 脚本会检查 `mysql`、`mysqldump`、`tar`、`gzip`、checksum 工具、数据库连接配置、MySQL JDBC URL、备份目录存在且私有、备份目录不在 git worktree 或 `SOURCELENS_WORKSPACE` 内、备份保留期为正整数、生产备份要求加密且存在 `gpg`，以及 `SOURCELENS_BACKUP_RESTORE_DRILL_EVIDENCE_FILE` 指向的恢复演练证据文件。
  - `scripts/security-regression-check.sh` 已锁住 Make 入口、脚本 executable bit、备份工具链、备份目录边界、私有权限、加密要求、恢复演练证据和 env 模板变量。
  - 当前本机尚未配置真实生产备份目录；真实发布前应先执行 `SOURCELENS_BACKUP_DRILL_BACKUP_ID=<backup_id> SOURCELENS_BACKUP_DRILL_EVIDENCE_FILE=/private/path/restore-drill.env make backup-restore-drill`，再用同一份证据执行 `make backup-preflight` 和 `make release-evidence`。
- 本轮回滚 preflight 收口：
  - `scripts/rollback-preflight.sh` 已新增，默认读取 `deploy/.env` 或 `SOURCELENS_ROLLBACK_PREFLIGHT_ENV_FILE` 指向的真实部署 env 文件。
  - `make rollback-preflight` 已新增为独立入口，`deploy/.env.example` 已增加 `SOURCELENS_ROLLBACK_TARGET_REF`、`SOURCELENS_ROLLBACK_BACKUP_ID`、`SOURCELENS_ROLLBACK_PLAN_FILE` 和 `SOURCELENS_ROLLBACK_PLAN_MAX_AGE_DAYS`。
  - 脚本会检查回滚目标必须是 40 位 Git SHA 或 `image@sha256:digest`，backup id 必须是安全 artifact id 格式，备份目录必须存在、私有、不可 symlink、不得位于 git worktree 或 `SOURCELENS_WORKSPACE` 内，且其中必须存在匹配 backup id 的 artifact；回滚计划文件必须非空、可读、不可 symlink、不可 group/world 写、不过期，并且同时引用 rollback target 和 backup id。
  - 脚本会要求回滚期间关闭 `SOURCELENS_AGENT_WRITE_PATCH_ENABLED`、`SOURCELENS_AGENT_EXEC_TEST_ENABLED`、`SOURCELENS_AGENT_CREATE_PR_ENABLED` 和 `SOURCELENS_AUTOREPAIR_SUBMIT_PR_ENABLED`，并用 `SOURCELENS_BASE_URL` 做 `/api/health` smoke。
  - 本轮补强：回滚 preflight 的 Agent/AutoRepair 止损开关已提升为启动期 fail-closed 校验；上述四个开关必须未设置或明确关闭，拼错、true 或 yes 都会在备份、计划文件和 smoke 检查前失败。
  - `scripts/security-regression-check.sh` 已锁住 Make 入口、脚本 executable bit、不可变目标、备份匹配、计划文件安全边界、止损开关、smoke target 和 env 模板变量。
  - 当前本机尚未配置真实 rollback target、backup id、计划文件和 smoke target；真实发布前仍需执行 `make rollback-preflight` 并保存回滚演练输出。
  - `bash -n scripts/security-regression-check.sh` 通过。
  - `./scripts/security-regression-check.sh` 通过。
- 本轮发布验收证据包收口：
  - `scripts/release-evidence.sh` 已新增，默认生成 `release-evidence/<run-id>/`，归档 `make verify`、prod/backup/rollback preflight、可选 smoke 和可选阶段 12 baseline 输出。
  - 证据脚本只记录 git head、`git status --short`、`git diff --stat` 和 `worktree-inventory.md`，不 dump 完整 env、secret 或完整 diff；证据目录创建为 `700`，并已加入 `.gitignore` 与 `.dockerignore`。
  - `make release-evidence` 已新增为独立入口，`scripts/security-regression-check.sh` 已锁住入口、权限位、忽略规则、warn-only preflight、可选 smoke/baseline 和 required smoke 不得默认 localhost 的红线。
  - `bash -n scripts/release-evidence.sh` 通过。
  - 快速证据包模拟通过：跳过 verify/preflight 时能生成 `summary.md`、`status.tsv`、git metadata、跳过日志，证据目录权限为 `700`。
  - preflight 证据包模拟通过：跳过 verify，归档 prod/backup/rollback warn-only preflight，summary 为 0 required failure。
  - 本轮补强：release evidence 会额外归档当前 `make worktree-inventory` 输出为 `worktree-inventory.md`，便于发布证据和大工作区拆审对齐；快速模拟验证该文件已落盘，`summary.md`/`status.tsv` 记录 `manifest, status, diff stat and worktree inventory captured`。
  - 本轮补强：release evidence 的 worktree inventory 归档现在独立记录为 `worktree-inventory` 状态，默认 `SOURCELENS_RELEASE_EVIDENCE_WORKTREE_INVENTORY_STRICT=true`；出现 `Other` 未分类路径会让证据包产生 required failure。
  - 本轮补强：release evidence 若配置了 `SOURCELENS_BACKUP_RESTORE_DRILL_EVIDENCE_FILE` 或 `SOURCELENS_ROLLBACK_PLAN_FILE`，会分别复制为 `backup-restore-drill-evidence.txt` 和 `rollback-plan.txt`，权限收紧为 `600`，并 scrub 已知敏感配置值。
  - 本轮补强：release evidence scrubber 会额外从真实 env 文件和进程环境自动发现名称包含 password/token/secret/private_key/api_key/credential/authorization 等片段的 key，避免新增 provider key 或 MySQL root/app password 未被固定白名单覆盖。
  - 本轮补强：release evidence 会拒绝 `.`/`..` 和超过 64 字符的 run id；`SOURCELENS_RELEASE_EVIDENCE_DIR` 若已存在，必须是非 symlink 私有目录，权限必须可检查且可解析，并且不得开放 group/world 权限，新建目录会收紧为 `700`。
  - 本轮补强：release evidence 在写入证据目录前会独立校验 `SOURCELENS_RELEASE_EVIDENCE_ENV_FILE` / `SOURCELENS_PREFLIGHT_ENV_FILE`；允许 `deploy/.env.example` 模板和缺失文件走进程环境兜底，但真实 env 文件存在时必须是非 symlink、普通、非空、可读且不开放 group/world 权限，避免关闭 preflight 后用弱 env 文件收集发布证据。
  - 本轮补强：release evidence 调用 smoke、phase12 baseline、Docker sandbox drill、GitHub App drill 和 GitHub webhook drill 时统一传递同一个已校验 env 文件；smoke token 和 phase12 `DB_PASSWORD` 不再通过命令行 env 参数传递。
  - 本轮补强：release、preflight、smoke、phase12、sandbox 和 GitHub drill 脚本的 env 值规范化统一为 trim 并循环剥离外层或嵌套成对引号；`scripts/security-regression-check.sh` 已用计数断言锁住 9 个发布验收脚本都保留该逻辑。
  - 本轮补强：release evidence 启动时先设置 `umask 077`，避免中途失败时留下依赖调用者默认 umask 的半成品证据文件；最终 summary 写完后、生成 checksum manifest 前，会统一把证据包内所有普通文件权限收紧为 `600`，随后生成的 `checksums.sha256` 也保持 `600`。
  - 本轮补强：`scripts/security-regression-check.sh` 新增 `assert_line_order`，已锁住 release evidence 的关键执行顺序：include mode 校验先于 env 文件边界，env 文件边界先于创建证据输出，summary 先于文件权限硬化，文件权限硬化先于 checksum manifest。
  - 本地验证通过：新建证据根目录正向模拟；symlink 证据根目录、`755` 开放权限目录、超长 run id 和 `..` run id 负向模拟；`bash -n scripts/release-evidence.sh scripts/security-regression-check.sh`；`./scripts/security-regression-check.sh`。
  - required smoke 负向模拟通过：强制 smoke 且没有 `SOURCELENS_BASE_URL` 时会记录 smoke required failure，不会默认测试 localhost；本轮补强为安全回归会验证该失败证据包仍可通过 `make verify-release-evidence` / `scripts/verify-release-evidence.sh` 复核。
  - include 开关已加严格模式校验：verify/preflight 只接受 `true/false`，可选 smoke/phase12/sandbox/GitHub/LLM provider 证据只接受 `auto/true/false`，拼写错误会在写入证据目录前失败，避免发布证据被静默跳过。
  - 证据日志已加敏感值防护：命令行中的 `password`、`token`、`secret`、`private_key` 等赋值会记录为 `<redacted>`，步骤输出落盘后也会 scrub `DB_PASSWORD`、`JWT_SECRET`、`GITHUB_APP_WEBHOOK_SECRET`、`SOURCELENS_SMOKE_TOKEN`、`OPENAI_API_KEY` 等已知敏感配置值。
  - `./scripts/security-regression-check.sh` 与 `./scripts/dependency-regression-check.sh` 通过。
  - `make verify` 通过，后端 296 tests、前端 build、Rust check/test、LLM 安全回归、安全回归检查、依赖回归检查全部通过。
- 本轮 release evidence LLM provider 结果归档：
  - `scripts/release-evidence.sh` 支持 `SOURCELENS_RELEASE_EVIDENCE_LLM_PROVIDER_RUN_FILE`，默认未配置时跳过，不阻塞普通发布证据采集。
  - 配置 provider run 文件后，release evidence 会先拒绝 symlink、空文件、不可读文件、权限不可检查/不可解析和 group/world 可访问文件，再运行 `scripts/validate-llm-provider-run.mjs`，要求结果覆盖 14 个 LLM safety 样例、`verdict` 为 `pass/fail`、assertion `passed` 为布尔值、无 secret 字段、不内联 `rawOutput`，并且 raw output artifact 路径位于 `release-evidence/<run-id>/llm-evals/` 下、匹配本次 release run id 且只使用安全路径段。
  - 本轮补强：`rawOutputArtifact` 现在会拒绝绝对路径、反斜杠、控制字符、空路径段、`.`/`..` 段、真实 provider run 中的 `<run-id>` 占位符、非本次 release run id、非 `llm-evals/` 目录，以及含空格或特殊字符的路径段；模板校验模式下仅允许 `<run-id>` 作为占位段。
  - 本轮补强：真实 provider run 成功归档时必须同时配置 `SOURCELENS_RELEASE_EVIDENCE_LLM_RAW_OUTPUT_DIR`；该私有目录需镜像 `llm-evals/...`，release evidence 会复制每个 raw output artifact、收紧为 `600`、scrub，并把它们纳入 checksum。
  - 本轮补强：`scripts/validate-llm-provider-run.mjs` 的 CLI 参数 fail-closed；未知选项、`--run-id` 缺值和额外位置参数都会失败，避免 release evidence run id 绑定因参数拼写错误被静默跳过。
  - 本轮补强：LLM provider run 源文件现在必须保持私有权限；`0644` 这类 group/world readable 文件会被 release evidence 记为 required failure，并提示先 `chmod 600`。
  - LLM provider run 权限可判定性已收口：`stat` 失败或返回非八进制模式都会被记为 required failure，不会继续校验或复制归档。
  - 校验通过后复制为证据包内的 `llm-provider-run.json`，权限收紧为 `600`，并再次执行敏感值 scrub；若 raw output artifact 复制失败，会移除半成品 `llm-provider-run.json` 和 `llm-evals/`，让失败包仍可被 verifier 复核。
  - 本轮补强：强制 LLM provider run 但缺少 `SOURCELENS_RELEASE_EVIDENCE_LLM_PROVIDER_RUN_FILE` 时会记录 `llm-provider-run` required failure；安全回归会验证该失败证据包仍可通过 `make verify-release-evidence` / `scripts/verify-release-evidence.sh` 复核，并确认不会归档伪造的 `llm-provider-run.json`。
  - `docs/OPERATIONS_RUNBOOK.md` 与 `docs/LLM_SAFETY_EVALS.md` 已补充真实 provider 红队结果归档命令。
  - 快速模拟验证通过：默认未配置 provider run 时 release evidence 跳过该步骤；传入临时已判定 provider run JSON 和 raw output 源目录时，status 记录 `OK llm-provider-run`，归档 JSON 与 `llm-evals/` artifact 权限均为 `600`；通过临时 `stat` wrapper 模拟权限不可检查和非八进制模式时，均记录对应 required failure。
  - `git diff --check`、`./scripts/security-regression-check.sh`、`./scripts/dependency-regression-check.sh` 和 `make verify` 均通过。
- 本轮 Docker sandbox drill 收口：
  - 新增 `scripts/sandbox-drill.sh` 与 `make sandbox-drill`，在真实 Docker 环境中创建受限 sandbox 容器，验证 digest-pinned 镜像、`network=none`、非 root 用户、`--cap-drop ALL`、`no-new-privileges`、`--read-only`、`/tmp` noexec/nosuid、pid/memory cgroup、workspace 写入和 `--memory-swap=<memory>`。
  - 本轮真实 Docker 演练发现并修复：默认 `alpine/git` 镜像带 entrypoint，sandbox drill 传入 `sh` 会被误解释为 `git sh`；`scripts/sandbox-drill.sh` 现在用 `--entrypoint sh` 跑 runtime script，后端 `DockerSandboxExecutor` 则用 `--entrypoint ""` 清空镜像默认 entrypoint，避免真实用户命令被镜像入口劫持。
  - 本轮补强：sandbox drill 在读取 `SOURCELENS_SANDBOX_DOCKER_*` 覆写配置前会独立校验 `SOURCELENS_SANDBOX_DRILL_ENV_FILE` / `SOURCELENS_PREFLIGHT_ENV_FILE` 指向的真实 env 文件边界，拒绝 symlink、目录、空文件、不可读文件和 group/world 可访问权限；`deploy/.env.example` 模板跳过私有权限检查，缺失文件只回退到进程环境。
  - 本轮补强：sandbox drill 挂载到容器的临时 workspace 会在 Docker create 前显式收紧为 `700`。
  - `scripts/release-evidence.sh` 新增可选 `SOURCELENS_RELEASE_EVIDENCE_INCLUDE_SANDBOX_DRILL`，默认 Docker daemon 可达时归档 sandbox drill，Docker 不可达时跳过并记录原因；设置为 `true` 时可强制真实发布必须跑演练。
  - `scripts/security-regression-check.sh` 已锁住 Make 入口、脚本 executable bit、release evidence 接入、运维手册命令和关键 Docker 隔离断言。
  - 本轮补强：强制 Docker sandbox drill 但 Docker daemon 不可达时会记录 `sandbox-drill` required failure；安全回归会验证该失败证据包仍可通过 `make verify-release-evidence` / `scripts/verify-release-evidence.sh` 复核，并用 fake `docker` 确认失败发生在 Docker runtime 动作前。
  - 早期本机 Docker CLI 可用但 daemon 不可达时，`SOURCELENS_SANDBOX_DRILL_WARN_ONLY=true ./scripts/sandbox-drill.sh` 通过并记录 1 个 daemon warning；临时 `644` env 文件在严格模式下会先 fail-closed。
  - 快速 release evidence 模拟通过：未强制 sandbox drill 且 Docker daemon 不可达时，status 记录 `SKIP sandbox-drill`，原因是 `Docker daemon is not reachable`；当前本机真实 Docker daemon 已可达，严格 sandbox drill 已通过。
  - `bash -n scripts/sandbox-drill.sh scripts/release-evidence.sh scripts/security-regression-check.sh`、`./scripts/security-regression-check.sh`、`./scripts/dependency-regression-check.sh` 和 `make verify` 均通过。
- 本轮 GitHub App drill 收口：
  - 新增 `scripts/github-app-drill.sh` 与 `make github-app-drill`，使用 `GITHUB_APP_ID`、`GITHUB_APP_PRIVATE_KEY_PEM` 和 `GITHUB_APP_WEBHOOK_SECRET` 做只读端到端演练。
  - 脚本会校验 GitHub API 出口策略，签发 App JWT，调用 `/app`、`/app/installations/{installation_id}`、`/app/installations/{installation_id}/access_tokens`，再用短期 installation token 读取 `SOURCELENS_GITHUB_APP_DRILL_REPOSITORY`；同时用标准 HMAC-SHA256 测试向量和实际 secret 的 `sha256=<hex>` 签名头形状验证本地 webhook 签名路径。
  - 本轮补强：GitHub App drill 的本地 HMAC 校验不再把同一 openssl 计算结果自比较，而是先校验固定 HMAC-SHA256 测试向量，再检查实际 webhook secret 生成的 GitHub `sha256=<hex>` 签名头形状；安全回归已锁住测试向量和签名头形状断言。
  - 本轮补强：GitHub App drill 在读取配置前会独立校验 `SOURCELENS_GITHUB_APP_DRILL_ENV_FILE` / `SOURCELENS_PREFLIGHT_ENV_FILE` 指向的真实 env 文件边界，拒绝 symlink、目录、空文件、不可读文件和 group/world 可访问权限；`deploy/.env.example` 模板跳过私有权限检查，缺失文件只回退到进程环境。
  - 本轮补强：GitHub App drill 在本地配置阶段会校验 `GITHUB_APP_PRIVATE_KEY_PEM` 必须包含 PEM private key header，`GITHUB_APP_WEBHOOK_SECRET` 至少 16 个字符；失败时不会继续写私钥临时文件、签 JWT 或访问 GitHub API；通过后才创建权限为 `700` 的临时目录，并以 `600` 权限写入私钥文件。
  - 脚本不创建分支、不 push、不创建 PR；`scripts/security-regression-check.sh` 已锁住只读路径、Make 入口、env 模板变量、运维文档和 release evidence 接入。
  - `scripts/release-evidence.sh` 新增可选 `SOURCELENS_RELEASE_EVIDENCE_INCLUDE_GITHUB_APP_DRILL`，默认变量完整时归档 GitHub App drill，变量不完整时跳过；设置为 `true` 时可强制真实发布必须跑演练。
  - 本轮补强：强制 GitHub App drill 但缺少 `GITHUB_APP_ID` 等配置时会记录 `github-app-drill` required failure；安全回归会验证该失败证据包仍可通过 `make verify-release-evidence` / `scripts/verify-release-evidence.sh` 复核。
  - 本地验证通过：缺配置 warn-only 路径通过；临时 fake GitHub API + 临时 RSA key 成功跑通 App JWT、installation token 和 repo 读取路径；release evidence 默认缺配置时记录 `SKIP github-app-drill`，强制缺配置时记录 `FAIL github-app-drill`，fake API 正向路径记录 `OK github-app-drill`，且日志不包含 fake installation token、private key 或 webhook secret。
  - 本地验证通过：用包含 PEM header 但内容无效的临时私钥确认 GitHub App drill 会跑到 HMAC 测试向量和 `sha256=<hex>` 签名头检查，并在进入 GitHub API 前停在本地私钥解析失败阶段。
  - `bash -n scripts/github-app-drill.sh scripts/release-evidence.sh scripts/security-regression-check.sh`、`./scripts/security-regression-check.sh`、`./scripts/dependency-regression-check.sh` 和 `make verify` 均通过。
- 本轮 GitHub webhook drill 收口：
  - `GitHubAppWebhookController` 的三个 webhook header 改为可空传入，由签名服务和业务服务返回明确的 `401`/`400`，避免缺 header 被框架层映射为不稳定的通用错误。
  - 新增 `GitHubAppWebhookControllerTest`，覆盖缺 delivery id 返回 `400`、缺签名返回 `401` 和正常请求透传。
  - 新增 `scripts/github-webhook-drill.sh` 与 `make github-webhook-drill`，对真实 `/api/webhooks/github/app` 入口发送 HMAC SHA-256 签名请求，验证首次 delivery `duplicate=false`、同一 delivery 重放 `duplicate=true`、缺 delivery id 返回 `400`、错误签名返回 `401`。
  - `SOURCELENS_GITHUB_WEBHOOK_DRILL_PAYLOAD_FILE` 自定义 payload fixture 现在要求非空、可读、非 symlink、不可 group/world 写、大小不超过 `SOURCELENS_GITHUB_WEBHOOK_DRILL_PAYLOAD_MAX_BYTES` 且为有效 JSON。
  - 本轮补强：webhook drill 不再把 payload 直接作为 `curl --data-binary "$payload"` 命令行参数传递；脚本会把最终签名和发送的 payload 写入 `700` 临时目录下的 `600` 文件，再通过 `curl --data-binary @file` 发送，避免真实 webhook 内容暴露在进程参数中。
  - 本轮补强：GitHub webhook drill 在读取 `GITHUB_APP_WEBHOOK_SECRET` 前会独立校验 `SOURCELENS_GITHUB_WEBHOOK_DRILL_ENV_FILE` / `SOURCELENS_PREFLIGHT_ENV_FILE` 指向的真实 env 文件边界，拒绝 symlink、目录、空文件、不可读文件和 group/world 可访问权限；`deploy/.env.example` 模板跳过私有权限检查，缺失文件只回退到进程环境。
  - 本轮补强：payload fixture 的 size 和 permissions 检查已改为 fail-closed；`stat` 失败、size 非数字或权限模式非八进制都会在严格模式下失败，warn-only 模式仍降级为 WARN；webhook drill 响应临时目录会在写入响应文件前显式收紧为 `700`。
  - `scripts/release-evidence.sh` 新增可选 `SOURCELENS_RELEASE_EVIDENCE_INCLUDE_GITHUB_WEBHOOK_DRILL`，默认 `SOURCELENS_BASE_URL` 与 `GITHUB_APP_WEBHOOK_SECRET` 完整时归档 webhook drill；设置为 `true` 时可强制真实发布必须跑演练。
  - 本轮补强：强制 GitHub webhook drill 但缺少 `SOURCELENS_BASE_URL` 或 `GITHUB_APP_WEBHOOK_SECRET` 时会记录 `github-webhook-drill` required failure；安全回归会验证该失败证据包仍可通过 `make verify-release-evidence` / `scripts/verify-release-evidence.sh` 复核，并用 fake `curl` 确认失败发生在 HTTP 调用前。
  - `scripts/security-regression-check.sh` 已锁住 Make 入口、脚本 executable bit、release evidence 接入、运维手册命令、HMAC 签名、delivery header、重复投递、缺 delivery id 和坏签名断言。
  - 本地验证通过：`bash -n scripts/github-webhook-drill.sh scripts/release-evidence.sh scripts/security-regression-check.sh`；`mvn -Dtest=GitHubAppWebhookControllerTest,GitHubAppWebhookServiceTest,GitHubWebhookSignatureServiceTest test`；缺配置 warn-only 路径；临时 fake webhook endpoint 成功路径，且日志不包含 webhook secret 或签名；release evidence 默认缺配置 `SKIP github-webhook-drill`、强制缺配置 `FAIL github-webhook-drill`、fake endpoint 正向路径 `OK github-webhook-drill`；`./scripts/security-regression-check.sh`、`./scripts/dependency-regression-check.sh`、`git diff --check` 和 `make verify` 均通过。
- 本轮 GitHub webhook drill header 输入硬化：
  - `scripts/github-webhook-drill.sh` 对 `SOURCELENS_GITHUB_WEBHOOK_DRILL_EVENT` 增加 64 字符上限，对 `SOURCELENS_GITHUB_WEBHOOK_DRILL_DELIVERY_ID` 增加 128 字符上限，并在 HTTP 调用前统一校验安全 header 字符集。
  - `deploy/.env.example` 新增可选 `SOURCELENS_GITHUB_WEBHOOK_DRILL_DELIVERY_ID=`，默认不配置时仍由脚本自动生成。
  - `scripts/security-regression-check.sh` 已锁住 event/delivery id 上限和 delivery id HTTP 前校验；`docs/OPERATIONS_RUNBOOK.md`、`docs/SECURITY_BOUNDARY.md`、`docs/REFACTOR_ROADMAP.md` 已同步。
  - 本地验证通过：`bash -n scripts/github-webhook-drill.sh scripts/security-regression-check.sh`；合法 delivery id/event warn-only 路径；超长 event 和超长 delivery id warn-only 拒绝路径；`./scripts/security-regression-check.sh`。
- 本轮 GitHub App webhook repository 状态同步收口：
  - `GitHubAppWebhookServiceTest` 使用真实 `GitHubAppInstallationService` 和 mocked mapper 覆盖 `installation_repositories` 的真实状态链路。
  - `repositories_added` payload 会匹配 SourceLens 已存在仓库，upsert installation，切换仓库 `authType=GITHUB_APP`，清空旧 `encryptedTokenRef`，记录 delivery processed 和 `GITHUB_APP_WEBHOOK_SYNC` 审计。
  - `repositories_removed` payload 会禁用对应 installation；若仓库当前使用 GitHub App，则切换为 `authType=NONE` 并清空 token ref，记录 delivery processed 和 `GITHUB_APP_WEBHOOK_DISABLE_REPOSITORY` 审计。
  - 未知 GitHub 仓库不会被自动创建成本地仓库或 installation，delivery 仍会被标记 processed 且 affectedRepositories 为 0。
  - `scripts/security-regression-check.sh` 已锁住 added、removed 和 unknown repository 三条 webhook 状态回归。
  - 本地验证通过：`mvn -Dtest=GitHubAppWebhookServiceTest test`；`mvn -Dtest=GitHubAppWebhookServiceTest,GitHubAppInstallationServiceTest,GitHubWebhookDeliveryServiceTest test`；`bash -n scripts/security-regression-check.sh`；`./scripts/security-regression-check.sh`；`./scripts/dependency-regression-check.sh`；`git diff --check`；`make verify`。
- 本轮 GitHub App installation 权限降级收口：
  - `GitHubAppWebhookServiceTest` 新增 `new_permissions_accepted` 权限降级回归：payload 将 permissions 从 `write` 降到 `read` 后，`GitHubAppInstallationService.assertCanCreatePullRequest` 返回 `FORBIDDEN`。
  - `AutoRepairService.submitPr` 在 GitHub App 权限校验失败时写入 `AUTO_REPAIR_PR_REJECTED` 审计，并保持任务不排队、不进入 `PR_RUNNING`。
  - `AutoRepairServiceTest` 扩展权限不足场景，断言拒绝时不会 `updateById`、不会 `markRunning`，但会记录失败审计。
  - `scripts/security-regression-check.sh` 已锁住权限降级回归、`AUTO_REPAIR_PR_REJECTED` 审计和拒绝时不排队的测试覆盖。
  - 本地验证通过：`mvn -Dtest=GitHubAppWebhookServiceTest,AutoRepairServiceTest test`；`mvn -Dtest=GitHubAppWebhookServiceTest,GitHubAppInstallationServiceTest,AutoRepairServiceTest test`；`bash -n scripts/security-regression-check.sh`；`./scripts/security-regression-check.sh`；`./scripts/dependency-regression-check.sh`；`git diff --check`；`make verify`。
- 本轮 GitHub PR 写路径错误分类收口：
  - `GitHubPullRequestService` 在构造 `/repos/{owner}/{repo}/pulls` 前校验 repository owner/name、head branch、base branch 和 PR title，避免异常仓库元数据构造非法 API path。
  - GitHub PR API 返回 `401/403` 时映射为 `FORBIDDEN`，返回 `409/422` 时映射为 `CONFLICT`，便于真实演练时区分权限不足、分支保护、重复 PR 或 GitHub 校验冲突。
  - `GitHubPullRequestServiceTest` 新增 unsafe repository component、unsafe branch、permission failure、validation/conflict failure 覆盖；`scripts/security-regression-check.sh` 已锁住这些写路径红线。
  - 本地验证通过：`bash -n scripts/security-regression-check.sh`；`mvn -Dtest=GitHubPullRequestServiceTest,AutoRepairPrServiceTest,AutoRepairServiceTest test`；`./scripts/security-regression-check.sh`；`./scripts/dependency-regression-check.sh`；`git diff --check`；`make verify`。
- 本轮 GitHub repository path component 硬化：
  - `RepositoryUrlPolicy` 新增 GitHub owner/repo 组件校验，URL 入库时拒绝异常 owner、dot-segment repo、连续 `..` 和 `.git` 后缀歧义。
  - `GitHubPullRequestService` 改为复用 `RepositoryUrlPolicy.validateGitHubOwner` 和 `validateGitHubRepositoryName`，避免 PR 写路径与 URL 入库策略漂移。
  - `scripts/github-app-drill.sh` 在调用 `/repos/{owner}/{repo}` 前拆分并校验 `SOURCELENS_GITHUB_APP_DRILL_REPOSITORY`，不再直接拼接未校验的 `repository_full_name`。
  - `RepositoryUrlPolicyTest` 和 `GitHubPullRequestServiceTest` 覆盖 unsafe owner、连续点、`.git` 后缀和合法 `.github` 仓库名；`scripts/security-regression-check.sh` 已锁住脚本、服务和测试红线。
  - 本地验证通过：`bash -n scripts/github-app-drill.sh scripts/security-regression-check.sh`；`mvn -q -Dtest=RepositoryUrlPolicyTest,RepositoryServiceTest,GitHubPullRequestServiceTest test`；GitHub App drill 合法/非法仓库配置 warn-only 路径；`./scripts/security-regression-check.sh`；`./scripts/dependency-regression-check.sh`；`git diff --check`；`make verify`。
- 本轮 GitHub PR 重复/冲突路径收口：
  - `GitHubPullRequestServiceTest` 新增 GitHub `409` 重复 PR 回归，确认与 `422` 一样映射为 `CONFLICT`。
  - `AutoRepairServiceTest` 新增 `create_pull_request` 阶段冲突失败回归：模拟 PR API 返回 `CONFLICT` 后，AutoRepair 回到 `PATCH_READY`，保留错误消息，不写 `prUrl`/`branchName`，失败 `create_pull_request` step，写入 `AUTO_REPAIR_PR_FAILED`，且不会 `markSuccess` 或进入 `PR_CREATED`。
  - `scripts/security-regression-check.sh` 已锁住 GitHub PR 409 分类、AutoRepair create_pull_request 冲突失败和不误标成功的测试覆盖。
  - 本地验证通过：`mvn -Dtest=GitHubPullRequestServiceTest,AutoRepairServiceTest test`；`bash -n scripts/security-regression-check.sh`；`./scripts/security-regression-check.sh`；`./scripts/dependency-regression-check.sh`；`git diff --check`；`make verify`。
- 本轮 AutoRepair PR push 失败分类收口：
  - `AutoRepairPrService` 将 JGit push 的 `REJECTED_NONFASTFORWARD`、`REJECTED_REMOTE_CHANGED` 映射为 `CONFLICT`，将 `REJECTED_OTHER_REASON`、`REJECTED_NODELETE` 映射为 `FORBIDDEN`，其他未知状态仍作为内部失败。
  - `AutoRepairPrServiceTest` 新增本地 bare repo 非快进推送回归：先推送同名 `sourcelens/auto-repair-12` 远端分支，再运行受控 PR，断言失败停在 `push_branch`、不会进入 `create_pull_request`，且临时工作区被清理。
  - `scripts/security-regression-check.sh` 已锁住 push 失败分类和“push 失败后不调用 PR API”的测试覆盖。
  - 本地验证通过：`mvn -Dtest=AutoRepairPrServiceTest test`；`mvn -Dtest=AutoRepairPrServiceTest,AutoRepairServiceTest,GitHubPullRequestServiceTest test`；`bash -n scripts/security-regression-check.sh`；`./scripts/security-regression-check.sh`；`./scripts/dependency-regression-check.sh`；`git diff --check`；`make verify`。
- 本轮 AutoRepair PR push 分支保护诊断收口：
  - `AutoRepairPrService` 现在会把 JGit `RemoteRefUpdate.getMessage()` 中的远端拒绝原因清洗后附加到 push 失败消息，避免真实 GitHub 分支保护错误只剩 `REJECTED_OTHER_REASON`。
  - `AutoRepairPrServiceTest` 新增分支保护样式远端拒绝回归：`REJECTED_OTHER_REASON` 携带 `GH006: Protected branch update failed` 时映射为 `FORBIDDEN`，保留诊断原因且清除换行。
  - `scripts/security-regression-check.sh` 已锁住远端拒绝原因清洗和分支保护样式拒绝测试覆盖。
  - 本地验证通过：`mvn -Dtest=AutoRepairPrServiceTest test`；`mvn -Dtest=AutoRepairPrServiceTest,AutoRepairServiceTest test`；`bash -n scripts/security-regression-check.sh`；`./scripts/security-regression-check.sh`；`./scripts/dependency-regression-check.sh`；`git diff --check`；`make verify`，其中后端全量为 `296 tests, 0 failures, 0 errors`。
- 本轮 GitHub PR API 网络异常脱敏收口：
  - `GitHubPullRequestService` 将 `HttpClient.send` 的 `IOException` 单独归类为 GitHub Pull Request 网络请求失败，不再与响应 JSON 解析失败混在一起。
  - 网络异常消息会对 installation token 做 `[REDACTED]` 替换，避免底层 HTTP/client 异常把凭据回显到 execution log 或接口错误消息。
  - `GitHubPullRequestServiceTest` 新增 HTTP client IO 失败覆盖，断言错误码为 `INTERNAL`、消息包含网络请求失败、包含 `[REDACTED]` 且不包含原始 token。
  - `scripts/security-regression-check.sh` 已锁住网络失败分类、脱敏入口和测试覆盖。
  - 本地验证通过：`mvn -Dtest=GitHubPullRequestServiceTest test`；`bash -n scripts/security-regression-check.sh`；`./scripts/security-regression-check.sh`；`./scripts/dependency-regression-check.sh`；`git diff --check`；`make verify`。
- 本轮 Prompt injection 第一版防护：
  - 新增 `PromptInjectionGuard`，统一输出 prompt safety boundary，并用 `SOURCELENS_UNTRUSTED_DATA`/`END_SOURCELENS_UNTRUSTED_DATA` 边界包裹不可信上下文。
  - `PromptBuilder` 会把项目上下文和历史 tool result 标记为不可信数据，`AgentRuntime` 会把当前轮 tool result 包装后再喂回模型。
  - CodeQA RAG、AutoRepair、CI 诊断、PR Review、Issue 拆解和 Agent 任务分析均已对代码、diff、日志、Issue/PR 文本、扫描产物或用户变更输入加 untrusted data 边界。
  - 新增 `PromptInjectionGuardTest`，并扩展 `CodeQaControllerTest` 捕获 LLM messages，验证检索代码块和伪指令被放在不可信上下文中。
  - `scripts/security-regression-check.sh` 已锁住上述 LLM 入口必须调用 prompt guard，避免后续退回裸拼接。
  - `mvn -Dtest=PromptInjectionGuardTest,CodeQaControllerTest test` 通过，3 tests, 0 failures, 0 errors。
  - `git diff --check`、`./scripts/security-regression-check.sh`、`./scripts/dependency-regression-check.sh` 通过。
  - `make verify` 通过，后端 280 tests、前端 build、Rust check/test、安全回归检查、依赖回归检查全部通过。
- 本轮 LLM 安全评估回归资产：
  - 新增 `docs/LLM_SAFETY_EVALS.md` 和 `docs/llm-safety-evals/prompt-injection-cases.json`，覆盖 CodeQA、Agent tool result、CI 日志、PR diff、Issue 文本、AutoRepair 和 Agent 任务扫描产物 7 类 Prompt injection 红队样例。
  - 新增 `docs/llm-safety-evals/output-quality-cases.json`，覆盖同一批 LLM 入口的输出质量契约，要求 schema 合规、证据引用、不把不可信文本当指令、不泄露秘密、不越权工具和不扩大任务范围。
  - 新增 `docs/llm-safety-evals/provider-run-template.json` 和 `scripts/validate-llm-provider-run.mjs`，为真实 provider 红队保存统一结果格式；模板覆盖 14 个样例，只允许保存摘要和 `release-evidence/` 下的 artifact 路径，禁止内联原始输出或 secret 字段。
  - 新增 `scripts/llm-safety-regression.sh` 与 `scripts/validate-llm-safety-evals.mjs`，校验样例结构、静态检查关键 LLM 入口的 untrusted data 边界，并运行 `PromptInjectionGuardTest,CodeQaControllerTest`。
  - 新增 `make llm-safety-check`，并接入 `make verify`。
  - `scripts/security-regression-check.sh` 已锁住 LLM safety Make 入口、verify 接入、脚本权限、fixture 覆盖面和文档入口。
  - `make llm-safety-check` 于 2026-06-25 20:19 +0800 通过，校验 7 条 Prompt injection 样例、7 条输出质量样例、14 条 provider run 模板覆盖和 3 个后端定向测试。
  - `make verify` 于 2026-06-25 20:37 +0800 通过，后端 280 tests、前端 build、Rust check/test、LLM safety 7+7 样例与 14 条 provider run 模板覆盖、安全回归检查、依赖回归检查全部通过。
- 本轮 preflight env 读取硬化：
  - `production-preflight.sh` 读取真实 env 时会 trim 空白、支持 `export KEY=value`，并剥离成对单/双引号。
  - 已验证 `SOURCELENS_AGENT_CREATE_PR_ENABLED="true"` 会进入 GitHub App readiness 分支，并要求 `GITHUB_APP_ID`、`GITHUB_APP_PRIVATE_KEY_PEM`、`GITHUB_APP_WEBHOOK_SECRET`。
  - `scripts/security-regression-check.sh` 已锁住 env 值规范化和 export-style env 读取逻辑。
- 本轮私有部署 env 权限收口：
  - `production-preflight.sh` 会检查 `SOURCELENS_PREFLIGHT_ENV_FILE` 指向的真实 env 文件权限和文件类型，拒绝 symlink、非普通文件、空文件、不可读文件、权限不可检查/不可解析以及 group/world 可读写的私有部署配置。
  - `deploy/.env.example` 是模板，会跳过私有权限检查；真实 env 文件应执行 `chmod 600`。
  - 当前本机 `deploy/.env` 已从 `644` 收紧为 `600`。
  - `scripts/security-regression-check.sh` 已锁住 env 文件 symlink/空文件/普通文件边界、权限检查、`stat` mode 读取和 `chmod 600` 修复提示。
  - `SOURCELENS_PREFLIGHT_WARN_ONLY=true ./scripts/production-preflight.sh` 通过，并显示 `deploy/.env permissions are private (600)`。
  - 使用临时 `644` env 文件验证 preflight 会报告 `permissions must not grant group/world access`。
  - 使用临时 symlink env、空 env 和目录型 env 验证 preflight 会分别报告 `must not be a symlink`、`must be non-empty` 和 `must be a regular deployment env file`。
- 本轮 backup/rollback preflight env 文件边界收口：
  - `scripts/backup-restore-preflight.sh` 和 `scripts/rollback-preflight.sh` 已对齐 production preflight，真实 env 文件必须非 symlink、普通文件、非空、可读、权限可检查且可解析，并且不得开放 group/world 权限；`deploy/.env.example` 作为模板仍跳过私有权限检查。
  - `scripts/security-regression-check.sh` 已锁住 backup/rollback preflight 的 symlink、非普通文件、空文件、不可读文件、权限不可检查/不可解析和 group/world 权限拒绝。
  - 本轮补强：prod/backup/rollback 三类 preflight 的真实 env 文件权限检查已改为 fail-closed；`stat` 失败或返回非八进制模式在严格模式下都会失败，warn-only 模式仍降级为 WARN。
  - 本地负向模拟通过：临时 `stat` wrapper 分别模拟权限不可检查和 `not-octal` 模式，`production-preflight.sh`、`backup-restore-preflight.sh`、`rollback-preflight.sh` 均报告对应错误并非零退出。
- 本轮 backup/rollback preflight 非 env 可判定性收口：
  - `scripts/backup-restore-preflight.sh` 对 `SOURCELENS_BACKUP_DIR`、`SOURCELENS_BACKUP_RESTORE_DRILL_EVIDENCE_FILE` 权限和恢复演练证据文件 mtime 改为 fail-closed；权限不可检查、权限不可解析或 mtime 不可检查在严格模式下都会失败，warn-only 模式仍降级为 WARN。
  - `scripts/rollback-preflight.sh` 对 `SOURCELENS_BACKUP_DIR`、`SOURCELENS_ROLLBACK_PLAN_FILE` 权限和回滚计划文件 mtime 改为 fail-closed；权限不可检查、权限不可解析或 mtime 不可检查在严格模式下都会失败，warn-only 模式仍降级为 WARN。
  - `scripts/security-regression-check.sh` 已锁住上述 backup/rollback preflight 的 fail-closed 文案，防止后续退回到只 warning。
- 本轮恢复/回滚发布证据证明力收口：
  - `scripts/backup-restore-preflight.sh` 要求恢复演练证据包含安全格式 `backup_id`、不过期 UTC `restore_drill_completed_at`，且 `backup_id` 必须能在 `SOURCELENS_BACKUP_DIR` 中匹配到 database/workspace/artifacts/checksums 四类备份 artifact。
  - `scripts/rollback-preflight.sh` 已对 `SOURCELENS_ROLLBACK_BACKUP_ID` 执行同一套最小备份集合校验，避免回滚只找到单个孤立文件就通过。
  - `scripts/release-evidence.sh` 在复制 `SOURCELENS_BACKUP_RESTORE_DRILL_EVIDENCE_FILE` 和 `SOURCELENS_ROLLBACK_PLAN_FILE` 前新增语义校验；备份恢复证据缺少 `backup_id`、缺少 `restore_drill_completed_at`、找不到完整备份集合，或回滚计划没有引用 rollback target / backup id，都会在 release evidence 中记录 required failure。
  - 本轮补强：配置了 `SOURCELENS_BACKUP_RESTORE_DRILL_EVIDENCE_FILE` 和 `SOURCELENS_ROLLBACK_PLAN_FILE` 但手工证据源文件缺失或不是普通文件时，会记录 `backup-restore-drill-evidence` / `rollback-plan` required failure；安全回归会验证该失败证据包仍可通过 `make verify-release-evidence` / `scripts/verify-release-evidence.sh` 复核，并确认不会归档伪造的 `backup-restore-drill-evidence.txt` 或 `rollback-plan.txt`。
  - `scripts/security-regression-check.sh` 已锁住新增证据字段、artifact 匹配和 release evidence 归档前语义校验。
- 本轮 backup artifact checksum manifest 内容收口：
  - `scripts/backup-restore-preflight.sh` 和 `scripts/rollback-preflight.sh` 会对 checksums artifact 重新计算并验证 database/workspace/artifacts 三类备份 artifact 的 SHA-256，避免只放一个空 checksum 文件就通过。
  - `scripts/release-evidence.sh` 在归档备份恢复证据和回滚计划前也会执行同一套 checksum 内容校验；缺少任一可恢复 artifact 的 checksum 条目会进入 release evidence required failure。
  - `scripts/security-regression-check.sh` 已锁住 SHA-256 计算函数、checksum manifest 比对函数、preflight 覆盖校验入口和文档边界。
- 本轮 backup artifact 文件边界收口：
  - `scripts/backup-restore-preflight.sh` 和 `scripts/rollback-preflight.sh` 会在 checksum 比对前验证 database/workspace/artifacts/checksums 四类 artifact 本身：必须是非 symlink 普通文件、非空、可读、权限可检查且可解析，并且不可 group/world 写。
  - `scripts/release-evidence.sh` 在归档备份恢复证据和回滚计划前执行同一套 artifact 文件边界校验；symlink、空文件、不可读文件或 group/world 可写文件都会成为 required failure。
  - 本轮补强：backup/rollback preflight 的备份 artifact 权限检查已对齐 release evidence，`stat` 失败会报告权限不可检查，非八进制模式会报告权限不可解析，严格模式下均 fail-closed。
  - `scripts/security-regression-check.sh` 已锁住 artifact 文件校验函数、权限可判定性、checksum 前置顺序、symlink-aware artifact 搜索和文档边界。
- 本轮 release evidence 备份目录边界收口：
  - `scripts/release-evidence.sh` 在归档 `SOURCELENS_BACKUP_RESTORE_DRILL_EVIDENCE_FILE` 和 `SOURCELENS_ROLLBACK_PLAN_FILE` 前会独立复查 `SOURCELENS_BACKUP_DIR`：不得是 symlink，不得位于 git worktree 或 `SOURCELENS_WORKSPACE` 内，必须可读可搜索，且不得开放 group/world 权限。
  - 该目录边界校验发生在 artifact 集合和 checksum 校验之前，即使 `SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PREFLIGHT=false` 也不会接受弱备份目录里的手工证据。
  - `scripts/security-regression-check.sh` 已锁住目录边界函数、失败文案、两个归档 validator 的调用点和目录校验先于 artifact set 校验的顺序。
- 本轮 release evidence 手工证据 freshness 收口：
  - `scripts/release-evidence.sh` 会在归档备份恢复演练证据前复查 `restore_drill_completed_at` 和证据文件 mtime，二者都不得在未来，也不得超过 `SOURCELENS_BACKUP_RESTORE_DRILL_MAX_AGE_DAYS`。
  - `scripts/release-evidence.sh` 会在归档回滚计划前复查 `SOURCELENS_ROLLBACK_PLAN_MAX_AGE_DAYS` 和计划文件 mtime，拒绝未来时间或过期计划。
  - `scripts/security-regression-check.sh` 已锁住 `file_mtime_epoch`、恢复演练证据 mtime、回滚计划 mtime、future/stale 拒绝文案和文档边界。
- 本轮 release evidence 手工证据权限可判定性收口：
  - `scripts/release-evidence.sh` 对 `SOURCELENS_BACKUP_RESTORE_DRILL_EVIDENCE_FILE` 和 `SOURCELENS_ROLLBACK_PLAN_FILE` 源文件权限改为 fail-closed：`stat` 失败或权限模式不可解析时会记录 required failure，不再继续复制归档。
  - `scripts/security-regression-check.sh` 已锁住权限不可检查、权限不可解析、group/world 可写拒绝文案和文档边界。
- 本轮 release evidence checksum manifest 收口：
  - `scripts/release-evidence.sh` 会在最终 summary 写完后生成 `checksums.sha256`，覆盖证据包内除 manifest 自身以外的文件；优先用 `sha256sum`，否则使用 macOS 常见的 `shasum -a 256`。
  - `checksums.sha256` 权限收紧为 `600`，用于真实发布记录复核证据包内容未被后改。
  - 本轮新增 `scripts/verify-release-evidence.sh` 与 `make verify-release-evidence DIR=release-evidence/<run-id>`，会先校验核心证据文件、拒绝 `git-status.txt` / `git-diff-stat.txt` / `worktree-inventory.md` 控制字符、校验 summary/manifest metadata 一致性与格式、实际 verifier 目录名和 `summary.md` 的 `evidence_dir` 末段都必须匹配 `run_id`、summary marker、`## Steps` 的状态/slug 与 `status.tsv` 一一对应、summary 三项计数与 `status.tsv` 中 `FAIL/WARN/SKIP` 行数一致、status 表头、14 个标准 step slug 各出现一次、`status`/`exit_code` 语义一致、每个标准 step 的 `log_file` 必须匹配固定证据文件名和 status 引用文件，并从核心文件、status 引用文件、成功 LLM provider run 的 `llm-provider-run.json` 及其中声明的 `llm-evals/` raw output artifact 构建 expected file allowlist，再拒绝额外文件、symlink、非 `600` 普通文件、manifest 自包含、manifest 不安全路径和实际包内不安全文件路径，并重新计算所有非 manifest 文件的 SHA-256 与 `checksums.sha256` 精确比对。
  - 本轮补强：安全回归会生成轻量 release evidence 包，篡改 `git-status.txt` 后确认 checksum mismatch 能被 `verify-release-evidence` 拒绝，避免归档后的发布证据被静默改写。
  - 本轮补强：安全回归会向 `checksums.sha256` 追加不安全路径条目，并确认 `verify-release-evidence` 以 `unsafe checksum path` 拒绝该包，避免 checksum manifest 指向证据目录外或含 dot-segment 的路径。
  - 本轮补强：安全回归会向 `checksums.sha256` 追加重复路径条目，并确认 `verify-release-evidence` 以 `duplicate checksum path` 拒绝该包，避免完整性 manifest 出现同一证据文件的多重声明。
  - 本轮补强：安全回归会把 `checksums.sha256` 权限放宽到 `644`，并确认 `verify-release-evidence` 以 `checksum manifest must have 600 permissions` 拒绝该包，避免完整性根文件自身权限退化。
  - 本轮补强：安全回归会通过 symlink 路径调用 `verify-release-evidence`，并确认它以 `release evidence directory must not be a symlink` 拒绝该输入，避免复核入口被链接到另一份证据目录。
  - 本轮补强：安全回归会在轻量证据包内额外创建带反斜杠的不安全文件名，并确认 `verify-release-evidence` 以 `release evidence file path is unsafe` 拒绝该包，避免真实包内异常路径绕过 manifest 校验。
  - 本轮补强：安全回归会在轻量证据包内额外创建 symlink，并确认 `verify-release-evidence` 以 `release evidence directory must not contain symlinks` 拒绝该包，避免发布证据复核跟随链接读取包外或伪造内容。
  - 本轮补强：安全回归会在轻量证据包内额外创建普通文件，重新生成 checksum manifest 后把该包内文件权限放宽到 `644`，并确认 `verify-release-evidence` 仍以 `must have 600 permissions` 拒绝该包，避免内容完整性正常但私有权限退化的证据被接受。
  - 本轮补强：安全回归会在轻量证据包内创建 `600` 权限额外文件，重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `unexpected file` 拒绝该包，避免证据包被当作任意文件容器夹带伪证据或敏感内容。
  - 本轮补强：安全回归会在轻量证据包内额外创建空目录，重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `unexpected directory` 拒绝；成功归档 LLM raw output 时也会把 `llm-evals` 目录权限放宽并确认 verifier 拒绝，避免包内目录绕过 expected allowlist 或私有权限校验。
  - 本轮补强：安全回归会把 `llm-provider-run` 伪造成 `OK` 但缺少 `llm-provider-run.json`，重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `regular file` 拒绝该包，避免真实 provider 安全评估结果只在状态表中被伪造为成功。
  - 本轮补强：安全回归会生成带 14 个 raw output artifact（均位于 `llm-evals/`）的真实形态 provider run 证据包，确认原始包可通过 `verify-release-evidence`，随后删除一个 raw output artifact 并重新生成 checksum manifest，确认 `verify-release-evidence` 仍以 `regular file` 拒绝，避免 `llm-provider-run.json` 声称有原始输出但证据包缺失实物。
  - 本轮补强：安全回归会在 `summary.md` 的 `## Steps` 追加伪造 step，重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `summary steps must match status.tsv status, slug, title and detail rows` 拒绝该包，避免摘要层验收记录和 `status.tsv` 脱节。
  - 本轮补强：安全回归会只篡改 `summary.md` 中已有 step 的展示详情，重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `summary steps must match status.tsv status, slug, title and detail rows` 拒绝该包，避免摘要显示的通过原因被粉饰而 `status.tsv` 保持不变。
  - 本轮补强：安全回归会向 `summary.md` 的 step 行注入控制字符，重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `summary step line contains control characters` 拒绝该包，避免摘要标题或详情被终端控制字符污染显示。
  - 本轮补强：安全回归会向 `summary.md` 追加额外内容，重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `summary file must match the generated layout exactly` 拒绝该包，避免发布摘要在标准 Summary 之后夹带人工 override 或伪造通过结论。
  - 本轮补强：安全回归会把 `summary.md` 和 `manifest.txt` 的 `env_file` metadata 篡改为含反引号的值，重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `summary env_file must not contain control characters or backticks` 拒绝该包，避免 metadata 破坏 summary 解析或伪造发布环境来源。
  - 本轮补强：安全回归会把 `manifest.txt` 的 `created_at` 篡改为另一个合法 UTC 时间，重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `summary created_at must match manifest created_at` 拒绝该包，避免摘要和 manifest 使用不同时间线伪造发布记录。
  - 本轮补强：安全回归会把 `summary.md` 和 `manifest.txt` 的 `created_at` 同步篡改为 `2026-99-99T99:99:99Z`，重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `created_at must be a valid UTC ISO-8601 timestamp` 拒绝该包，避免格式像时间但无法解析的伪时间线进入发布证据。
  - 本轮补强：安全回归会在 `summary.md` 中复制 `env_file` metadata，重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `exactly one non-empty env_file metadata value` 拒绝该包，避免重复 metadata 伪造发布环境来源。
  - 本轮补强：安全回归会把 `manifest.txt` 的 `llm_provider_run_file` metadata 篡改为含反引号的值，重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `llm_provider_run_file must not contain control characters or backticks` 拒绝该包，避免 LLM provider 路径 metadata 污染发布证据。
  - 本轮补强：安全回归会向 `manifest.txt` 追加额外内容，重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `manifest file must match the generated layout exactly` 拒绝该包，避免发布 manifest 在固定 metadata 之外夹带人工 override 或伪造验收来源。
  - 本轮补强：安全回归会把 `manifest.txt` 中的 `include_smoke` 篡改为 `maybe`，重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `include_smoke must be true, false, or auto` 拒绝该包，避免 manifest include/worktree 模式被改成生成器不会产出的非法值。
  - 本轮补强：安全回归会生成 `include_smoke=true` 的 required failure 包，把 `status.tsv` 和 `summary.md` 里的 smoke 行伪造成 `SKIP` 并重新生成 checksum manifest，确认 `verify-release-evidence` 仍以 `requires smoke status not to be SKIP` 拒绝，避免强制验收步骤被粉饰成未配置跳过。
  - 本轮补强：安全回归还会把同一类 `include_smoke=true` required failure 包的 smoke 行伪造成 `WARN`，重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `requires smoke status to be OK or FAIL` 拒绝，避免强制验收失败被降级成 optional warning。
  - 本轮补强：安全回归还会把 `include_smoke=false` 包里的 smoke `SKIP` detail 从 `SOURCELENS_RELEASE_EVIDENCE_INCLUDE_SMOKE=false` 篡改成 `SOURCELENS_BASE_URL is not configured`，重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `requires smoke detail to be` 拒绝，避免显式关闭的验收步骤伪装成环境未配置。
  - 本轮补强：安全回归还会把 `git-metadata` 状态伪造成 `SKIP` 并重新生成 checksum manifest，确认 `verify-release-evidence` 仍以 `git-metadata status must be OK` 拒绝；随后还会把 `worktree-inventory` 状态伪造成 `SKIP` 并确认 `verify-release-evidence` 仍以 `worktree-inventory status must not be SKIP` 拒绝，避免核心证据快照被粉饰成跳过。
  - 本轮补强：安全回归还会制造 `worktree-inventory.md` 中的非零 `Other` 分组，把 `worktree-inventory` strict failure 伪造成 `OK` 并重新生成 checksum manifest，确认 `verify-release-evidence` 仍以 `strict OK must not contain Other paths` 拒绝，避免未分类工作区路径被粉饰成已完成拆审。
  - 本轮补强：安全回归还会保留 `worktree-inventory` strict failure 状态但删除 `worktree-inventory.md` 中的 `Other` 分组和失败标记，重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `strict FAIL must contain Other paths and strict failure marker` 拒绝，避免发布证据只剩失败状态而丢失可审计失败细节。
  - 本轮补强：安全回归还会向 `worktree-inventory.md` 注入控制字符，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `worktree inventory must not contain control characters` 拒绝，避免工作区拆审清单污染终端、工单或日志查看器。
  - 本轮补强：安全回归还会向 `git-status.txt` 和 `git-diff-stat.txt` 注入控制字符，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍分别以 `git status snapshot must not contain control characters` 和 `git diff stat snapshot must not contain control characters` 拒绝，避免 git 快照污染终端、工单或日志查看器。
  - 本轮补强：安全回归会把 `summary.md` 的 `skipped` 计数篡改为伪值，重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `summary skipped must match status.tsv` 拒绝该包，避免发布摘要计数粉饰真实 step 状态。
  - 本轮补强：安全回归会把 `status.tsv` 中 `OK` step 的 `exit_code` 篡改为非零值，重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `OK status must use exit_code 0` 拒绝该包，避免步骤状态和退出码被拆开伪造。
  - 本轮补强：`release-evidence` 生成侧会在写入 `status.tsv` 前校验 `status` 与 `exit_code` 语义一致：`OK=0`、`SKIP=-`、`WARN=非零数字`、`FAIL=-或非零数字`，避免坏状态表只靠发布后 verifier 才发现。
  - 本轮补强：`release-evidence` 生成侧会为 `summary.md` 和 `manifest.txt` 使用同一个 UTC `created_at`，避免同一证据包里核心 metadata 出现跨秒或后改不一致。
  - 本轮补强：`release-evidence` 生成侧会在写入 summary/manifest 前校验 `env_file` 和 evidence directory metadata 非空且不含控制字符或反引号；即使 env 文件缺失并回退进程环境，也不会用不安全 metadata 创建证据包。
  - 本轮补强：`release-evidence` 生成侧会在写入 manifest 前规范化可选的 `llm_provider_run_file` 和 `llm_raw_output_dir` metadata，把控制字符折叠为空格并替换反引号；这些字段即使为空也必须保持可安全解析。
  - 本轮补强：`release-evidence` 生成侧会在写入 summary 前校验 step title 非空且不含控制字符，避免未来新增发布步骤时把异常标题写入验收摘要。
  - 本轮补强：安全回归会把 `status.tsv` 的 `detail` 字段注入控制字符，重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `detail contains control characters` 拒绝该包，避免发布证据在终端、工单或日志查看器中被控制字符污染显示。
  - 本轮补强：安全回归会把 `status.tsv` 的 `detail` 字段注入反引号，重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `detail contains backticks` 拒绝该包，避免发布证据在 Markdown、工单或日志查看器中被伪造 code span 污染显示。
  - 本轮补强：`release-evidence` 生成侧会在写入 `status.tsv` 前对 `detail` 控制字符和反引号做规范化，把 tab、换行和 ESC 折叠为空格，并把反引号替换为普通引号；安全回归会用带 tab/ESC/反引号的缺失 provider-run 路径确认失败证据包仍可通过 `verify-release-evidence` 复核。
  - 本轮补强：安全回归会把 `status.tsv` 中 `git-metadata` 的 `log_file` 篡改为另一份存在的证据文件，重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `git-metadata must reference manifest.txt` 拒绝该包，避免 step 状态引用错证据文件。
  - 本轮补强：安全回归会复制 `status.tsv` 的标准 step 行制造重复 slug，重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `row only once` 拒绝该包，避免重复 step 结构靠重算 checksum 混入发布证据。
  - 本轮补强：安全回归会在 `status.tsv` 追加未知 step slug，重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `unknown step slug` 拒绝该包，避免非标准 step 靠重算 checksum 混入发布证据。
  - `scripts/security-regression-check.sh` 已锁住 checksum manifest 函数、稳定文件名、自排除、`sha256sum`/`shasum` 支持和私有权限。
- 本轮生产 secret 强度 preflight 收口：
  - `production-preflight.sh` 已对齐后端 `SecurityStartupValidator`，提前检查 `DB_PASSWORD`、`JWT_SECRET`、`ENCRYPT_PASSWORD`、`ENCRYPT_SALT` 和 `GITHUB_APP_WEBHOOK_SECRET` 的最小长度与开发默认值。
  - `production-preflight.sh` 会检查强制 GitHub App readiness 时的 `GITHUB_APP_PRIVATE_KEY_PEM` 是否看起来像 PEM private key。
  - `scripts/security-regression-check.sh` 已锁住 secret 强度检查、开发默认值拒绝、GitHub App private key 形状检查和 webhook secret 最小长度。
  - 当前本机私有 `deploy/.env` 已完成本地真实环境轮换：`DB_PASSWORD` / `MYSQL_PASSWORD`、`ENCRYPT_PASSWORD`、`ENCRYPT_SALT` 均已替换为非默认随机值，并已同步更新 Docker MySQL 应用用户密码；`deploy/.env` 权限保持 `600`。注意：这只是本机开发验收环境，真实生产仍需按正式 secret 管理和历史加密数据迁移策略执行。
  - 使用进程环境覆盖强 DB/encrypt secret 后，warn-only preflight 中 `DB_PASSWORD`、`ENCRYPT_PASSWORD`、`ENCRYPT_SALT` 均显示 meets minimum length，summary 恢复为 4 个外部环境 warning。
  - 强制 GitHub App readiness 并传入无效 private key 与短 webhook secret 时，preflight 会报告 `GITHUB_APP_PRIVATE_KEY_PEM must contain a PEM private key header` 和 `GITHUB_APP_WEBHOOK_SECRET must be at least 16 characters`。
  - 本轮补强：`SOURCELENS_PREFLIGHT_REQUIRE_GITHUB_APP` 只接受合法布尔值，值会先去掉空白和成对引号；拼错会 fail-closed，避免真实 GitHub App readiness 验收被静默跳过。
  - 本轮补强：`SOURCELENS_AGENT_CREATE_PR_ENABLED` 和 `SOURCELENS_AUTOREPAIR_SUBMIT_PR_ENABLED` 只接受合法布尔值；拼错会 fail-closed，避免受控 PR 功能开关绕过 GitHub App readiness 或产生模糊生产配置。
  - 本轮补强：发布验收链路的 `*_WARN_ONLY` 模式已统一 fail-closed；`SOURCELENS_PREFLIGHT_WARN_ONLY`、`SOURCELENS_BACKUP_PREFLIGHT_WARN_ONLY`、`SOURCELENS_ROLLBACK_PREFLIGHT_WARN_ONLY`、`SOURCELENS_SANDBOX_DRILL_WARN_ONLY`、`SOURCELENS_GITHUB_APP_DRILL_WARN_ONLY` 和 `SOURCELENS_GITHUB_WEBHOOK_DRILL_WARN_ONLY` 拼错都会在脚本启动期 fail-closed 失败。
  - 本轮补强：`SOURCELENS_BASE_URL` 在 smoke、production preflight、rollback preflight 和 GitHub webhook drill 中已统一做 HTTP 调用前形状校验；非 http/https、空 host、空白、user-info、query 或 fragment 都会 fail-closed，避免把凭据形态 URL 写进日志或拼出不可预测的验收路径。
- 本轮发布脚本权限门禁：
  - `scripts/security-regression-check.sh` 已检查 `verify-all`、`security-regression-check`、`dependency-regression-check`、`production-preflight`、`smoke-test`、`phase12-baseline` 和 `worktree-inventory` 均保留 executable bit。
  - 该门禁保护 Makefile/CI 中直接执行脚本的入口，避免换机或提交后因脚本权限丢失导致发布验证不可运行。
  - `bash -n scripts/security-regression-check.sh && ./scripts/security-regression-check.sh` 通过。
- 本轮 CI 超时门禁：
  - `.github/workflows/ci.yml` 的 security、supply-chain、backend、llm-safety、frontend、analyzer 和 docker job 均已设置 `timeout-minutes`。
  - `scripts/security-regression-check.sh` 已逐个检查这些 job 必须保留正数超时，避免 Maven/npm/Cargo/Docker 或缓存网络问题导致 runner 长时间挂起。
  - `bash -n scripts/security-regression-check.sh && ./scripts/security-regression-check.sh` 通过。
- 本轮 CI LLM safety 门禁收口：
  - `.github/workflows/ci.yml` 新增 `LLM Safety Regression` job，显式设置 Java 17 和 Node 20 后执行 `./scripts/llm-safety-regression.sh`。
  - `scripts/security-regression-check.sh` 已锁住 CI 必须调用 LLM safety regression，并要求 `llm-safety` job 保留 `timeout-minutes`。
  - 本地验证通过：`bash -n scripts/security-regression-check.sh scripts/dependency-regression-check.sh scripts/llm-safety-regression.sh`；`./scripts/security-regression-check.sh`；`./scripts/dependency-regression-check.sh`；`./scripts/llm-safety-regression.sh`；`git diff --check && git diff --cached --check`；`make verify`。
- 本轮 prod-preflight LLM safety 门禁收口：
  - `scripts/production-preflight.sh` 的 `Static release gates` 现在会运行 `scripts/llm-safety-regression.sh`，真实发布前单独执行 `make prod-preflight` 时也会覆盖 Prompt injection、输出质量和 provider run 模板契约。
  - 静态门禁执行改为 `run_static_gate` helper：成功时保持简洁，失败时输出 `[DETAIL] <门禁名>: <失败行>`，避免真实发布 preflight 只显示“门禁失败”却丢失具体断言。
  - `scripts/security-regression-check.sh` 已锁住 production preflight 必须调用 LLM safety regression。
  - 本地验证通过：`bash -n scripts/production-preflight.sh scripts/security-regression-check.sh scripts/llm-safety-regression.sh`；`./scripts/security-regression-check.sh`；warn-only prod-preflight 模拟确认输出 `[OK] LLM safety regression checks pass`；临时移除 `llm-safety-regression.sh` executable bit 的负向模拟确认 preflight 输出 `[DETAIL] security regression checks: ... llm-safety-regression.sh must be executable`，随后已恢复脚本权限。
- 本轮 CI token 暴露面收口：
  - `.github/workflows/ci.yml` 顶层 `permissions` 只允许 `contents: read`，不允许 job-level `permissions` 提权，并保持 `cancel-in-progress: true`。
  - 7 个 checkout step 均设置 `persist-credentials: false`，CI 不需要 push 时不把 GitHub token 持久写入本地 git config。
  - CI 不使用 `pull_request_target`，也不引用 `${{ secrets.* }}`；真实 GitHub App、webhook、Docker sandbox 和生产凭据演练必须通过对应 drill/preflight/release evidence 手工入口完成。
  - `scripts/security-regression-check.sh` 已检查只读权限、并发取消和 7 个 checkout credential persistence 禁用项；本轮补强为逐个 `actions/checkout` step 绑定校验，不能用别处额外出现的 `persist-credentials: false` 掩盖某个 checkout 漏配。
  - `bash -n scripts/security-regression-check.sh && ./scripts/security-regression-check.sh` 通过。
  - `git diff --check && make verify` 通过，后端 277 tests、前端 build、Rust check/test、安全回归检查、依赖回归检查全部通过。
- 本轮 CI GitHub Actions 供应链收口：
  - `.github/workflows/ci.yml` 的第三方 action `uses:` 已从 `@v4`、`@v2`、`@stable` 等可移动引用改为 40 位 commit SHA，行尾保留原 tag 作为升级线索。
  - `scripts/dependency-regression-check.sh` 会解析 workflow 并拒绝非 SHA pinned 的第三方 action，也会拒绝 `uses: docker://...` 这类 Docker image action 绕过 action SHA pinning。
  - `scripts/security-regression-check.sh` 已检查 workflow 不得退回可移动 action tag 或 Docker image action，并确认依赖回归脚本保留该 SHA pinning 门禁；本轮补强为临时 workflow 负例，确认 `- uses: docker://...` 会被拒绝并在检查后清理探针文件。
  - `bash -n scripts/dependency-regression-check.sh && ./scripts/dependency-regression-check.sh` 通过。
  - `bash -n scripts/security-regression-check.sh && ./scripts/security-regression-check.sh` 通过。
  - `make verify` 通过，后端 277 tests、前端 build、Rust check/test、安全回归检查、依赖回归检查全部通过。
- 本轮 Shell 脚本语法门禁：
  - 新增 `make script-check`，统一对 `scripts/*.sh` 执行 `bash -n`。
  - `scripts/verify-all.sh` 已把 `Shell script syntax` 作为第一步，避免低频脚本只在真实环境才暴露语法错误。
  - `scripts/verify-all.sh` 已把 `Git diff whitespace check` 纳入 `make verify`，同时运行 `git diff --check` 和 `git diff --cached --check`。
  - `scripts/verify-all.sh` 的后端、前端和 Rust analyzer 命令现在通过 `run_in_dir` 切换目录后直接执行，不再用 `bash -lc "cd ..."` 插入仓库路径。
  - `scripts/security-regression-check.sh` 已锁住 `script-check` Make 入口、`verify-all` 中的脚本语法检查步骤、目录命令不得回退到 `bash -lc`，并在 CI security job 中真实执行 `bash -n scripts/*.sh`。
  - `make script-check`、`./scripts/security-regression-check.sh` 和 `make help` 中的 `script-check` 显示检查均通过。
  - `git diff --check && make verify` 通过，验证顺序已包含 `Shell script syntax`，且 security regression 会再次真实执行脚本语法检查；后端 277 tests、前端 build、Rust check/test、安全回归检查、依赖回归检查全部通过。
- 本轮 smoke/preflight URL 规范化：
  - 本轮补强：`scripts/smoke-test.sh` 新增 `SOURCELENS_SMOKE_ENV_FILE`，默认回退到 `SOURCELENS_PREFLIGHT_ENV_FILE` / `deploy/.env`；读取 `SOURCELENS_BASE_URL`、`SOURCELENS_SMOKE_TOKEN` 和 smoke 超时前会独立校验真实 env 文件边界，拒绝 symlink、目录、空文件、不可读文件和 group/world 可访问权限；release evidence 调用 smoke 时会传入同一个已校验的 env 文件。
  - `scripts/smoke-test.sh` 与 `scripts/production-preflight.sh` 已规范化 `SOURCELENS_BASE_URL` 的空白、成对引号和末尾 `/`，避免拼出 `//api/health` 或 `//actuator/metrics`。
  - `production-preflight.sh` 会通过 `config_value SOURCELENS_BASE_URL` 从进程环境或 `SOURCELENS_PREFLIGHT_ENV_FILE` 指向的真实 env 文件读取 smoke target。
  - env 文件解析器已改为同一 key 后写覆盖先写，避免 `.env.example` 中的空 `SOURCELENS_BASE_URL=` 占位压过后面的真实值。
  - `scripts/smoke-test.sh` 已规范化 `SOURCELENS_SMOKE_TOKEN`，带外层或嵌套成对引号的 token 会去掉引号后再作为 Bearer token。
  - `scripts/smoke-test.sh` 与 `scripts/production-preflight.sh` 的 HTTP smoke 调用已统一带 `--connect-timeout` 和 `--max-time`，默认读取 `SOURCELENS_SMOKE_CONNECT_TIMEOUT=5` 与 `SOURCELENS_SMOKE_MAX_TIME=15`，并拒绝非正整数覆写。
  - 使用临时 fake curl 验证私有 env 文件中的 `SOURCELENS_BASE_URL=' "http://example.test/" '` 与 `SOURCELENS_SMOKE_TOKEN=' "fake-token" '` 的 smoke 通过；安全回归已自动确认 `644` env 文件会在 HTTP 调用前 fail-closed，且 preflight 输出 `http://example.test/api/health is reachable`。
  - 使用临时 `SOURCELENS_PREFLIGHT_ENV_FILE` 验证 env 文件中后写的 `SOURCELENS_BASE_URL=' "http://example.test/" '` 会覆盖 `.env.example` 的空占位，并执行 smoke target。
  - `scripts/security-regression-check.sh` 已锁住 smoke/preflight 的 URL 规范化、token 规范化和 curl 超时断言。
  - `git diff --check && make verify` 通过，后端 277 tests、前端 build、Rust check/test、安全回归检查、依赖回归检查全部通过。
- 本轮 Docker sandbox 生产配置可见性修复：
  - `application.yml`、`application-prod.yml`、`deploy/docker-compose.yml` 和 `deploy/.env.example` 已显式声明 docker sandbox network/user/pids/read-only-root/tmpfs。
- 本轮真实 Docker/MySQL/Redis 验收：
  - Docker Desktop daemon 可达，`sourcelens-mysql`、`sourcelens-redis` 和 `sourcelens-backend` 已通过 `deploy/docker-compose.yml` 启动。
  - 真实 Docker backend 已重建并运行在 `http://localhost:8081`；`SOURCELENS_SMOKE_ENV_FILE=deploy/.env SOURCELENS_BASE_URL=http://localhost:8081 ./scripts/smoke-test.sh` 通过。
  - `SOURCELENS_PREFLIGHT_ENV_FILE=deploy/.env SOURCELENS_BASE_URL=http://localhost:8081 SOURCELENS_PREFLIGHT_WARN_ONLY=true ./scripts/production-preflight.sh` 通过，结果为 0 failure / 6 warning；当时剩余 warning 为 host 缺少 mysql CLI、4 类 cleanup 默认关闭、GitHub App readiness 未强制。当前脚本已改为识别 Docker MySQL executor，后续 preflight 不应再因 host mysql 缺失告警。
  - 当前 `prod-preflight` 已重新纳入 release evidence，结果为 0 failure / 1 warning；cleanup 四项已在 `deploy/.env` 显式启用并通过 Compose 传入 backend，剩余 warning 仅为 GitHub App readiness 未强制。
  - `SOURCELENS_SANDBOX_DRILL_ENV_FILE=deploy/.env ./scripts/sandbox-drill.sh` 已在真实 Docker daemon 上严格通过。
  - 发现并修复 Spring Boot 3 Redis 配置路径错误：`spring.redis` 改为 `spring.data.redis`，否则 Docker 容器内 Actuator Redis health 会连接 `localhost:6379` 并导致 `/actuator/health` 为 DOWN；安全回归已锁住不再使用 legacy `spring.redis`。
  - 使用测试公开仓库 `https://github.com/LJunP/Pawnshop-Management-System.git` 完成真实扫描链路：本地一次性用户 `codex_smoke_1782452791916`，projectId `9`，repositoryId `14`，scanTaskId `28`，状态 `SUCCESS`，commit `3eaf38582997afa5acff8990f48ce9c5f200e3ea`，耗时约 3 分 3 秒，产出 15727 个 symbols、440 个 relations、7 个 artifacts；`code_chunks=0` 根因已定位为扫描流水线未调用 `CodeChunkService.chunkAndSave`，本轮已接入 `chunk_code` 执行步骤并补回归测试。
  - 重建 Docker backend 后重新扫描同一公开仓库：本地一次性用户 `codex_chunk_1782455174`，projectId `10`，repositoryId `15`，scanTaskId `29`，状态 `SUCCESS`，commit `3eaf38582997afa5acff8990f48ce9c5f200e3ea`，产出 15727 个 symbols、440 个 relations、7 个 artifacts、17001 个 chunks；执行步骤 `prepare_repository`、`analyze_code`、`chunk_code`、`finalize_scan` 均为 SUCCESS。embedding 为 0 是因为本地没有激活 LLM 配置，符合当前验收预期。
  - 真实扫描日志暴露 JGit 写 `/home/app/.config/jgit/config` 失败，已修复后端 Docker runtime：为 `app` 用户创建 `/home/app`，设置 `ENV HOME=/home/app`，预创建并授权 `/home/app/.config/jgit`；当前容器已验证 `app` 用户可写该目录，smoke 通过。
  - `scripts/security-regression-check.sh` 已检查这些 prod/Compose 红线，避免启动校验依赖执行器 `@Value` 默认值。
- 本轮 Docker sandbox 资源限制红线修复：
  - `SecurityStartupValidator` 已对 docker sandbox memory 与 CPU limit 做正值校验。
  - `DockerSandboxExecutor` 已加入 `--memory-swap=<memory>`，避免容器通过 swap 扩大显式内存上限。
  - `production-preflight.sh` 会在真实 env 覆写 `SOURCELENS_SANDBOX_DOCKER_MEMORY` 或 `SOURCELENS_SANDBOX_DOCKER_CPUS` 时提前校验格式和正值。
  - `DockerSandboxExecutorTest` 与 `SecurityStartupValidatorTest` 覆盖资源限制红线，`scripts/security-regression-check.sh` 已锁住这些断言。
- 本轮 GitHub API 出口红线修复：
  - `GitHubApiEndpointPolicy` 已公开复用，`SecurityStartupValidator` 在 Agent 创建 PR 或 AutoRepair 受控 PR 开启时启动期校验 GitHub API base URL 与 allowed hosts。
  - `SecurityStartupValidatorTest` 覆盖 unsafe metadata IP 和 allowlist 不匹配场景。
  - `scripts/security-regression-check.sh` 已检查启动期和 preflight 的 GitHub API egress policy 校验存在。
- 本轮 GitHub webhook delivery id 幂等红线修复：
  - `GitHubAppWebhookController` 要求 `X-GitHub-Delivery` header。
  - `GitHubAppWebhookService` 在业务处理前拒绝空 delivery id，并先 `claimProcessing`，以唯一键把重复或并发 delivery 挡在 installation/repository 同步前。
  - `GitHubWebhookDeliveryService` 先写入 `PROCESSING` claim，成功后更新为 `PROCESSED` 并写项目映射；`GitHubAppWebhookService.handle` 使用事务包住 claim、业务同步和 processed 标记。
  - `GitHubAppWebhookServiceTest` 覆盖缺少 delivery id 时不处理业务、不写 delivery 记录；`GitHubWebhookDeliveryServiceTest` 覆盖 duplicate claim 返回 false。
  - `scripts/security-regression-check.sh` 已检查 controller/service/test 的 delivery id、处理前 claim 和事务红线。
- 本轮 prod YAML 启动校验回归测试：
  - `SecurityStartupValidatorTest` 新增真实 `application.yml` + `application-prod.yml` 加载用例，只提供外部 secret/DB/Redis 变量，其余 sandbox 红线从 YAML 解析，并运行 `SecurityStartupValidator`。
  - `mvn -Dtest=SecurityStartupValidatorTest test` 通过，12 tests, 0 failures, 0 errors。
  - `scripts/security-regression-check.sh` 已检查该真实 YAML 加载用例存在。
- 本轮完整验证：
  - `make verify` 通过，后端 277 tests、前端 build、Rust check/test、安全回归检查、依赖回归检查全部通过。
  - Dockerfile/Compose analyzer 打包改动后再次运行 `make verify` 通过。
  - `.dockerignore` 与 Docker build CI job 增加后再次运行 `make verify` 通过。
- 本轮 worktree 分组清单复核：
  - `make worktree-inventory` 通过，最近生成时间为 2026-06-26 01:00 +0800。
  - 清单工具已把 `PromptInjectionGuardTest`、`V014__add_agent_tool_calls.sql`、`ScanStatServiceTest` 和 `backend-spring/src/test/java/com/sourcelens/common/security/*` 放回对应模块，剩余 `pom.xml`、启动类和测试 schema 这类跨模块共享文件统一标为 `Backend shared infrastructure`，不再使用含糊的 uncategorized 标签。
  - 当前主要分组规模：安全 18、审计/可观测性 12、分析/图谱/项目生命周期 43、执行任务/Artifact/自动化 52、Agent/LLM/工具 48、沙箱/Workspace 10、GitHub App/仓库集成 31、前端 42、Rust analyzer 9、运维/CI/发布门禁 23、构建产物清理 4、文档/交接 14、Backend shared infrastructure 3。
  - 清单顶部 review order 和实际分组输出已共用同一份 category 数组，避免建议先审查构建产物、实际却先输出安全分组这类顺序漂移。
  - `SOURCELENS_WORKTREE_INVENTORY_STRICT=true make worktree-inventory` 会在出现 `Other` 分组时失败，可用于正式拆审或发布证据复核前确认没有未分类文件被兜底吞掉。
  - 本轮补强：`SOURCELENS_WORKTREE_INVENTORY_STRICT` 只接受合法布尔值，值会先去掉空白和成对引号；拼错会 fail-closed，避免 strict 拆审或发布证据复核被静默降级。
  - 清单工具支持按完整分组名或 slug 输出单个分组，Make 入口可用 `make worktree-inventory GROUP=repository-hygiene-generated-artifacts` 或 `make worktree-inventory GROUP=operations-ci-and-release-gates`；未知分组会失败并列出可用分组，避免拆审脚本静默漏项。
  - `scripts/release-evidence.sh` 会把当前分组清单归档为 `worktree-inventory.md`，便于发布证据和后续拆审对齐；当前轻量 release evidence strict inventory 模拟已确认 `worktree-inventory` 状态为 `OK`，归档清单没有 `Other` 分组。
  - 本地验证通过：`bash -n scripts/worktree-inventory.sh scripts/security-regression-check.sh`；`make worktree-inventory`；`make worktree-inventory GROUP=security-and-auth-boundary`；`make worktree-inventory GROUP=operations-ci-and-release-gates`；`make worktree-inventory GROUP=repository-hygiene-generated-artifacts`；未知分组负向验证；`./scripts/security-regression-check.sh`；`git diff --check`；`make verify`。
  - 下一步若要先稳定仓库，应按 `docs/WORKTREE_HYGIENE.md` 的顺序从“构建产物清理”和“运维/CI/发布门禁”开始分组审查或提交。
  - 前端构建产物移出 Git 跟踪并加入安全回归门禁后再次运行 `make verify` 通过。
  - `make clean` 已补齐并实测可清理 `web-console/dist`、`web-console/.vite`、`web-console/node_modules/.vite` 和 `web-console/tsconfig*.tsbuildinfo`；本轮继续扩展为递归清理 `target 2` 误生成目录、`.DS_Store`、`analyzer-rust/target` 和根 `bin/`，并跳过 `.git`、`web-console/node_modules`、常规 Maven/Rust target 这类大目录；`worktree-inventory` 也会把这些生成物路径统一归入 Repository hygiene / generated artifacts，避免误跟踪生成物时被混入业务模块审查；安全回归门禁已锁住该清理规则，并用临时 Git index 动态验证误跟踪生成物会进入仓库卫生组，探针只清理自身唯一文件和本次新建的空目录，不删除已有构建缓存目录，也不会在干净环境留下 `web-console/node_modules` 这类空父目录。

注意：测试日志中出现的 `push failed`、`llm unavailable`、`Something broke` 等异常堆栈是测试用例模拟失败路径，最终 Maven 结果为准。

## 4. 关键文件入口

换号后优先读取：

- `docs/REFACTOR_ROADMAP.md`：总路线和当前阶段。
- `docs/SECURITY_BOUNDARY.md`：安全边界。
- `docs/OPERATIONS_RUNBOOK.md`：部署、smoke、GitHub App、沙箱验收。
- `docs/PHASE12_BASELINE.md`：阶段 12 基准采集和触发条件。
- `docs/WORKTREE_HYGIENE.md`：构建产物和工作区清理说明。
- `docs/API_DESIGN.md`、`docs/ARCHITECTURE.md`、`docs/DATABASE_DESIGN.md`：已同步到当前安全模型。

重要脚本：

- `make verify`：本地提交前完整验证。
- `make dependency-check`：依赖和供应链回归检查。
- `make llm-safety-check`：LLM Prompt injection 与输出质量契约安全回归检查。
- `make worktree-inventory`：输出当前工作区分组清单。
- `make prod-preflight`：生产验收前置条件检查。
- `make backup-preflight`：备份恢复前置条件检查。
- `make rollback-preflight`：回滚前置条件检查。
- `make sandbox-drill`：Docker sandbox 真实隔离兼容性演练。
- `make github-app-drill`：GitHub App 只读端到端演练。
- `make github-webhook-drill`：GitHub webhook 签名、重复投递和负例演练。
- `make release-evidence`：生成发布验收证据包。
- `make verify-release-evidence DIR=release-evidence/<run-id>`：复核发布验收证据包 checksum manifest、文件权限和 symlink 边界。
- `make smoke`：服务启动后的健康和可选 metrics 验收。
- `make phase12-baseline`：只读采集阶段 12 触发证据。
- `scripts/verify-all.sh`：本地统一验证脚本。
- `scripts/security-regression-check.sh`：安全回归门禁。
- `scripts/dependency-regression-check.sh`：依赖和供应链回归门禁。
- `scripts/llm-safety-regression.sh`：LLM Prompt injection 与输出质量契约安全回归门禁。
- `scripts/validate-llm-safety-evals.mjs`：LLM 红队样例和输出质量样例结构校验。
- `scripts/validate-llm-provider-run.mjs`：真实 provider LLM 安全评估结果格式校验。
- `scripts/worktree-inventory.sh`：工作区分组清单。
- `scripts/production-preflight.sh`：生产验收前置条件检查。
- `scripts/backup-restore-preflight.sh`：备份恢复前置条件检查。
- `scripts/backup-restore-drill.sh`：备份恢复演练，恢复 SQL 到 Docker MySQL scratch database 并生成标准 evidence。
- `scripts/rollback-preflight.sh`：回滚前置条件检查。
- `scripts/sandbox-drill.sh`：Docker sandbox 真实隔离兼容性演练。
- `scripts/github-app-drill.sh`：GitHub App 只读端到端演练。
- `scripts/github-webhook-drill.sh`：GitHub webhook 签名、重复投递和负例演练。
- `scripts/release-evidence.sh`：发布验收证据包归档。
- `scripts/dependency-regression-check.sh`：依赖和供应链回归门禁。
- `scripts/worktree-inventory.sh`：工作区分组清单。
- `scripts/smoke-test.sh`：部署 smoke test。
- `scripts/phase12-baseline.sh`：阶段 12 基准脚本。

## 5. 当前工作区状态提醒

当前 worktree 很大，包含大量阶段性改动和未跟踪文件。

不要在新账号里做这些事：

- 不要执行 `git reset --hard`。
- 不要执行 `git checkout -- .`。
- 不要回滚看起来陌生的大量改动。
- `web-console/dist` 构建产物清理已经执行，应作为仓库卫生变更独立审查。
- 历史误生成的 `backend-spring/target 2/` 属于构建目录，已通过 `**/target 2/` 忽略并由 `make clean` 清理。

已知脏状态：

- 当前索引中会出现 `web-console/dist/index.html`、旧 hashed bundle 和两个 `tsconfig*.tsbuildinfo` 的删除记录，这是仓库卫生清理的预期结果。
- 本地前端构建产物文件可由 `npm run build` / `make verify` 重新生成，已由 `.gitignore` 忽略，并可通过 `make clean` 清理；本轮已实测清理 `web-console/dist` 和 `web-console/tsconfig*.tsbuildinfo`。
- 如果本地仍存在任意 `target 2/` 误生成目录、`.DS_Store`、`analyzer-rust/target` 或根 `bin/`，可通过 `make clean` 清理；不要提交这些生成物。
- 不要把这些删除误认为功能回退。

## 6. 未完成事项

总目标尚未完成，剩余工作主要是：

- 最新 `make worktree-inventory` 已生成；仍需按模块分组提交或至少分组审查，建议先处理构建产物清理，再处理运维/CI/发布门禁。
- 当前产品优先级决策：GitHub App 是私有仓库、webhook 增量扫描、自动 PR 和企业安装的高级集成层，不阻塞当前公开仓库 clone/逆向分析主线。保留现有 GitHub App 架构、安全边界和本地回归，但真实 E2E 暂缓到核心公开仓库链路稳定之后。
- 最新进度：审计日志页 GitHub Webhook delivery 的 collation 500 已在当前 8080 后端和 Docker MySQL 上验证不再复现；`github_webhook_deliveries.delivery_id` 与 `github_webhook_delivery_projects.delivery_id` 当前均为 `utf8mb4_unicode_ci`，delivery API 和审计页源级健康状态 smoke 均通过。
- 最新进度：扫描报告到 Agent 任务列表的追踪闭环已补齐，`/api/projects/{projectId}/agent-tasks?scanTaskId=...` 会按扫描任务过滤，前端 Agent 任务表展示扫描列并可回跳扫描报告；runtime smoke 已验证同项目两个扫描任务只返回目标扫描绑定任务。
- 当前优先继续：公开仓库报告/问答体验、真实生产备份的 `make backup-restore-drill` / 回滚演练和工作区分组审查。
- 已通过 `make release-evidence` 保存正式发布验收证据包，把已通过的 smoke、prod-preflight、sandbox-drill、Phase12 baseline 和真实公开仓库扫描摘要纳入发布记录。
- 在进入高级集成阶段后，再用真实 GitHub App 凭据和测试仓库运行 `make github-app-drill` 和 `make github-webhook-drill`，并通过 `make release-evidence` 保存 GitHub App/webhook drill 输出；当前 GitHub App 只读演练只完成 fake GitHub API 成功路径、缺配置 warn-only 和 release evidence skip/required 路径验证，webhook drill 仍需真实部署 URL 与 webhook secret。
- 继续做 GitHub App 写路径和异常路径演练：
  - 真实 GitHub live webhook installation 权限变化端到端验收，本地 `new_permissions_accepted` 权限降级与受控 PR 拒绝审计已覆盖。
  - 真实 GitHub live webhook 对 `installation` / `installation_repositories` payload 的端到端验收，本地 added/removed/unknown repository 状态回归已覆盖。
  - 真实 GitHub 分支保护或权限导致的 push 失败 live 演练，本地 `REJECTED_OTHER_REASON` 分类和远端诊断清洗已覆盖。
  - 真实 GitHub 重复 PR/重复提交 live 演练，本地 409 分类与 `create_pull_request` 冲突失败不误标成功已覆盖。
  - 真实 GitHub 网络/API 异常端到端演练，本地 PR API HTTP client IO 失败分类与 token 脱敏已覆盖。
- Docker sandbox 真实隔离演练已在本机 Docker daemon 严格通过，并已纳入 `release-evidence/public-scan-29-cleanup-20260626145817`。
- 做构建工具缓存兼容性演练：
  - Maven/npm/Gradle 缓存挂载策略。
  - 只读 root filesystem 与受限 `/tmp` 下的常见构建命令兼容性。
- 阶段 12：
  - 已用 `SOURCELENS_PHASE12_BASELINE_ENV_FILE=deploy/.env SOURCELENS_PHASE12_SCAN_TASK_ID=29 ./scripts/phase12-baseline.sh` 通过 Docker MySQL executor 生成真实 baseline：15727 symbols、440 relations、16167 graph records，调用链查询 118ms，max execution attempts 为 1，verdict 为 phase 12 trigger is not proven。
  - 后续只有在更大真实或准真实规模项目重复 baseline 并触发阈值后，才进入 Neo4j/pgvector/Temporal/analyzer daemon ADR。
- Release evidence：
  - 已生成并验证 `release-evidence/public-scan-29-cleanup-20260626145817`，包含 `make verify`、prod/backup/rollback preflight、smoke、Phase12 baseline 和 sandbox drill；`scripts/verify-release-evidence.sh release-evidence/public-scan-29-cleanup-20260626145817` 通过，summary 为 0 required failure、0 optional warning、5 skipped。
  - 只有当 symbol/relation 超过 50 万、多级调用链超过 2 秒、或任务补偿复杂度超过当前简单队列能力时，再引入 Neo4j、pgvector、Temporal 或 analyzer daemon。
- 更长期：
  - Prompt injection 真实模型跨 provider 红队执行，并把真实输出按 `output-quality-cases.json` 记录判定结果。
  - 多 Agent 编排。
  - 真实生产部署、备份恢复演练、回滚演练，并保存 release evidence 输出。

## 7. 推荐下一步

如果新账号接手后不知道做什么，建议按这个顺序继续：

1. 运行：

```bash
cd /Users/lijunpeng/Desktop/cc/project/SourceLens
git status --short
make verify
```

2. 阅读：

```bash
sed -n '1,470p' docs/REFACTOR_ROADMAP.md
sed -n '1,260p' docs/SECURITY_BOUNDARY.md
sed -n '1,230p' docs/OPERATIONS_RUNBOOK.md
```

3. 选择一个下一步：

- 若要先稳定仓库：继续按模块分组审查当前大规模 worktree，并把构建产物删除作为独立仓库卫生组处理。
- 若要继续生产化：用真实备份跑 `make backup-restore-drill`，补真实回滚演练，并继续报告/问答体验。
- 若要继续 GitHub App：仅在进入高级集成阶段后准备真实 App 凭据和测试仓库做端到端验收。
- 若要进入阶段 12：先运行 `make phase12-baseline` 并保存输出，不要直接引入 Neo4j/Temporal。

## 8. 新账号给 Codex 的建议提示词

```text
你是接手 SourceLens 长期重构目标的新 Codex。
请先读取 docs/CODEX_HANDOFF.md、docs/REFACTOR_ROADMAP.md、docs/SECURITY_BOUNDARY.md、docs/OPERATIONS_RUNBOOK.md 和 docs/WORKTREE_HYGIENE.md。
请重新建立/恢复长期目标：“按照已制定的 SourceLens 总路线逐步完成项目重构，从阶段 0 开始推进到安全、任务、分析、Agent、前端、沙箱和 GitHub App 等路线完成。”
当前阶段是阶段 12 前生产化收口。
不要回滚已有改动，不要重头做项目分析，不要把目标缩小。
先用 git status 和 make verify 确认当前状态，再选择下一项高价值缺口继续实现。
```
