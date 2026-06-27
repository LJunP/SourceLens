# SourceLens 重构路线图

状态：执行中，阶段 0-11 主线能力已落地，阶段 12 待真实规模触发；阶段 12 前生产化收口正在补齐
起点：V0.x 原型向产品级工程平台重构

最近验证：

- `make verify` 通过。
- 后端完整测试：`mvn clean test`，300 tests, 0 failures, 0 errors。
- 前端构建：`npm run build` 通过。
- Rust analyzer：`cargo check --locked` 与 `cargo test --locked` 通过，4 个 Rust 测试通过。
- LLM safety、安全回归与依赖回归门禁均已接入 `make verify` 并通过。
- 生产启动红线定向测试：`mvn -Dtest=SecurityStartupValidatorTest test` 通过，12 tests, 0 failures, 0 errors。
- 可观测性补强：Actuator 暴露 `health/info/metrics`，业务指标覆盖 execution task/step、Agent tool call 和 sandbox command。
- 认证注册唯一键兜底：`UserService.register` 对用户名/邮箱做服务层 trim，并把数据库唯一键冲突统一转为 `CONFLICT` 业务错误，避免逻辑删除用户仍占用唯一键或并发注册时落到 500。`mvn -Dtest=AuthControllerTest test`、`mvn -DskipTests package`、`git diff --check` 通过；本地 8080 已重启，真实 MySQL/HTTP smoke 验证重复用户名、重复邮箱和软删除用户名占用均返回 409，临时数据已清理。
- 审计日志链路修复：`mvn -Dtest=GitHubWebhookDeliveryServiceTest,GitHubWebhookDeliveryControllerTest test` 通过，前端 `npm run build` 通过；本地 8080 API 验证 audit logs、Agent tool calls 和 GitHub webhook deliveries 均返回 `SUCCESS`。
- 审计日志页 500 回归验证：用户侧报错确认为 MySQL `delivery_id` collation 混用；当前 Docker MySQL schema 已到 `027`，两张 webhook delivery 表 `delivery_id` 均为 `utf8mb4_unicode_ci`。复核用户补充日志确认 `PID 95441` 属于旧进程，当前 8080 运行 `PID 37510` 且 Flyway 显示 schema up to date。本地 8080 对 audit logs、Agent tool calls、GitHub webhook deliveries 三个接口均返回 `SUCCESS`；浏览器审计页刷新后无 `Internal server error` toast。
- 顶部用户菜单可用性修复：`AppLayout` 的用户菜单改为 click 触发，并为用户按钮补充 `aria-haspopup` / 精确 `aria-label`；退出菜单图标设为装饰性，避免菜单项 accessible name 变成 `logout 退出登录`。`npm run build`、`git diff --check` 通过；浏览器 smoke 验证登录临时用户后点击右上角用户菜单能看到精确“退出登录”，点击后返回 `/login`，临时用户和审计数据已清理。
- 仪表盘主链路行动面板：`Dashboard` 新增 Workflow Command，将仓库接入、报告复盘、代码问答、自动修复、审计治理五个下一步动作按当前数据状态前置；增加页面内加载错误态和手动刷新。`AuditLogsPage` 支持 `?projectId=` 参数续接。`npm run build`、目标文件 `git diff --check` 和浏览器桌面/`390px` 移动验证通过，5 张行动卡无横向溢出、无错误 toast、无新增控制台错误；临时 smoke 数据已清理。
- 仪表盘 code_chunks 就绪度收口：`/api/dashboard/stats` 新增 `latestCodeChunks` 与 `latestEmbeddedChunks`，Dashboard 主链路和“代码问答”行动卡改用真实切片数和向量覆盖率，不再用文件数判断 QA 可用性。`mvn -Dtest=DashboardControllerTest,ScanStatServiceTest test`、`mvn -DskipTests package`、`npm run build` 通过；运行时 API 验证 `latestCodeChunks=3/latestEmbeddedChunks=1`，浏览器桌面和 `390px` 移动验证显示 `3 chunks ready`、`代码问答 3 chunks`、`向量覆盖 33%`，无横向溢出和新增控制台错误；临时 smoke 数据已清理。
- 项目 QA Playbook 收口：Dashboard “代码问答”行动卡进入项目 QA 时会携带 `question` 参数；`ProjectDetail` QA tab 支持 URL 预填问题、自动证据检索，并按 `code_chunks`、embedding 覆盖率、检索模式和错误状态生成动态 starter。`npm run build` 通过；浏览器 smoke 用临时 projectId `46` / scanTaskId `46` / 3 条 code_chunks 验证预填问题、QA Playbook、starter 卡、证据检索结果均渲染，桌面和 `390px` 移动宽度无横向溢出、无 `Internal server error`；临时用户、项目、仓库、扫描任务和 code_chunks 已清理。
- code_chunks 复合标识符检索增强：`CodeChunkRanker.tokenize` 保留原始紧凑词，同时拆出 camelCase/PascalCase/数字边界子词，使 `controllerServiceRepository`、`PawnTicketController` 这类真实提问能命中 Controller/Service/Repository 等角色词。`mvn -Dtest=CodeChunkServiceTest,CodeQaRetrievalServiceTest,CodeChunkControllerTest,CodeQaControllerTest test`、`mvn -DskipTests package`、`npm run build` 和 `git diff --check` 通过；本地 8080 已重启，API smoke 用临时 project/scan/code_chunks 验证 `controllerServiceRepository` 查询将 `PawnTicketController.java` 排在文档前，临时数据已清理。
- Code QA 相邻切片上下文扩展：`CodeQaController` 先选出最相关 chunk，再通过 `CodeChunkService.expandWithAdjacentChunks` 拉取同文件前后相邻切片补入 RAG 上下文，降低长方法、类成员和调用链被 50 行切片边界截断的概率；`CodeChunkSearchItem` 新增 `contextRole` / `contextDistance`，主命中标记为 `PRIMARY`，相邻补充标记为 `ADJACENT_CONTEXT`，`evidenceProfile` 只用主证据计算平均分和低可信度，同时在摘要中单独展示上下文数量。`mvn -Dtest=CodeChunkServiceTest,CodeQaControllerTest,CodeQaRetrievalServiceTest,CodeChunkControllerTest test`、`mvn clean -DskipTests package`、`npm run build`、`git diff --check` 通过；本地 8080 已重启，API smoke 和浏览器 QA 页验证 `validateJwtSignature` 问答返回 `PRIMARY, ADJACENT_CONTEXT, ADJACENT_CONTEXT`，前端引用依据与检索结果均展示“主证据/上下文”角色，临时数据已清理。
- 公开仓库主链路强化：`SOURCELENS_PUBLIC_REPO_SMOKE_ARTIFACT_QUALITY=true SOURCELENS_PUBLIC_REPO_SMOKE_DB_COUNTS=true make public-repo-smoke` 通过，真实扫描 `LJunP/Pawnshop-Management-System` 生成 7 个 artifact、17001 个 code_chunks，并通过 artifact JSON 质量门禁；code_chunks 检索和 Code QA 共用结构化 `evidenceProfile`，公开仓库 smoke 会验证检索与问答证据质量契约。
- 扫描落库性能治理：`code_symbols`、`code_relations` 和 `code_chunks` 均改为明确的多行批量 INSERT；`mvn -Dtest=CodeChunkServiceTest,CodeGraphPersistenceServiceTest,CodeChunkControllerTest,CodeQaControllerTest,AnalysisServiceTest test` 通过，真实公开仓库 smoke 再次通过，17001 个 code_chunks 保存阶段约 2.8 秒且不再出现 MyBatis-Plus 非事务 `saveBatch` 警告。
- 扫描详情体验补强：`ScanTaskDetail` 新增 Code Knowledge readiness 面板，直接展示 code_chunks 总量、向量覆盖、检索模式、证据可信度和下一步动作；本地 8080 最新 jar 验证 `/api/projects/4/code-chunks/search?scanTaskId=24&limit=1` 返回 `retrievalMode=NO_CONTEXT`、`evidenceProfile.readiness=GAP`，浏览器 smoke 验证无全局错误 toast。
- 扫描报告行动闭环补强：`ScanTaskDetail` 报告总览新增 Report Action Board，将风险定位、代码问答、依赖复盘、修复候选四个后续动作前置到报告决策区；按钮按核心产物、依赖图谱、风险文件和仓库状态启停。`npm run build` 与目标文件 `git diff --check` 通过；浏览器验证桌面与 `390px` 移动宽度均渲染 4 张行动卡、无横向溢出、无错误 toast。
- 扫描报告 Trace Map 补强：`ScanTaskDetail` 报告总览新增“报告章节追踪”，把质量风险、API 表面、数据模型、依赖图谱和产物证据五个证据面直接连接到对应报告 tab、产物库和带问题参数的项目 QA。`npm run build`、目标文件 `git diff --check` 通过；浏览器 smoke 用临时 project/scan/artifacts/code_chunks 验证 5 个证据面渲染、风险按钮打开质量风险 tab、追问代码跳转 `/projects/{id}?tab=qa&question=...`，默认视口和 `390px` 移动视口均无横向溢出，临时数据已清理。
- 报告到 QA 证据源贯通：`CodeQaRequest` 支持 `scanTaskId`，后端会校验指定扫描属于当前项目，未指定时才回退最近成功扫描；`ScanTaskDetail` 所有 QA 入口都会携带当前报告 `scanTaskId`，`ProjectDetail` QA 的 code_chunks 搜索和问答请求使用同一证据源，避免从旧报告追问却误用最新扫描。验证：`mvn -q -Dtest=CodeQaControllerTest test`、`mvn -q -DskipTests package`、`npm run build`、`git diff --check` 通过；本地 8080 已重启，API smoke 验证审计页三源均 `200 SUCCESS`，指定旧 scanTaskId 返回 `RequestedScanAuthService`，不指定 scanTaskId 返回最新 `LatestScanAuthService`；临时数据已清理。
- code_chunks 搜索证据源边界收口：`CodeChunkController.search` 对显式 `scanTaskId` 保持项目归属校验，并新增扫描状态门禁；只有 `SUCCESS` 扫描会执行切片统计和检索，`RUNNING`/`PENDING`/`FAILED`/`CANCELLED` 统一返回结构化 `NO_SCAN` 空证据，避免 QA 预检或报告追问把未完成扫描的残留 chunk 当成可靠证据。验证：`mvn -q -Dtest=CodeChunkControllerTest,CodeQaControllerTest test`、`mvn -q -DskipTests package`、`git diff --check` 通过；本地 8080 已重启，API smoke 用临时 RUNNING scanTaskId `57` 且人为插入 chunk 验证返回 `NO_SCAN`、`resultCount=0`、`items=[]`、`evidenceProfile.readiness=IDLE`；临时数据已清理。
- 报告到 Agent 证据源贯通：`AgentTaskService.create` 对显式 `scanTaskId` 新增存在性、项目归属和 `SUCCESS` 状态校验；Agent 对话运行时会通过 `Conversation.agentTaskId` 反查任务绑定扫描，并把 `scanTaskId` 注入 `ToolContext` 与系统 prompt 项目上下文；`get_symbols` 优先使用上下文绑定扫描，避免从扫描报告创建的 Agent 任务漂移到项目最新扫描。`ScanTaskDetail` 报告行动区新增“Agent 审查”入口，跳转 `/agent-tasks?projectId=...&openCreate=1&scanTaskId=...` 并预填任务。验证：`mvn -q -Dtest=AgentTaskServiceTest,AgentSandboxToolTest test`、`mvn -q -DskipTests package`、`npm run build` 通过；本地 8080 已重启，API smoke 验证绑定成功扫描可创建 Agent 任务，`RUNNING` 扫描和跨项目扫描均返回 `BAD_REQUEST`；临时数据已清理。
- Agent 工具审计 scanTask 追踪：新增 `V028__add_agent_tool_call_scan_task_id.sql`，`agent_tool_calls` 写入可空 `scan_task_id` 并支持项目内按扫描过滤；`ToolExecutionService` 从 `ToolContext.scanTaskId` 写入审计记录，审计页 Agent 工具 tab 增加扫描任务筛选、列表列和详情字段，方便追溯工具结果来自哪一次扫描报告。验证：`mvn -q -Dtest=AgentToolCallControllerTest,ToolExecutionServiceTest,AgentTaskServiceTest,AgentSandboxToolTest test`、`mvn -q -DskipTests package`、`npm run build`、`git diff --check` 通过；本地 8080 已重启并应用 Flyway `028`，API smoke 验证 `scanTaskId=42` 过滤只返回对应工具调用；临时数据已清理。
- 扫描报告到审计追踪深链：`AuditLogsPage` 支持 `?projectId=&scanTaskId=`，进入后默认打开 Agent 工具调用 tab、预填 ScanTask ID 筛选，并在页头显示当前扫描上下文；Agent 工具审计列表和 drawer 支持回跳 `/scan-tasks/{scanTaskId}`。`ScanTaskDetail` 顶部操作区新增“审计追踪”，报告行动板也保留审计入口，确保无产物扫描也能进入治理链路。验证：`npm run build`、`git diff --check` 通过；浏览器 smoke 用临时 projectId `70` / scanTaskId `61` 验证审计深链只显示当前 scan 的 `codex_ui_audit_get_symbols`，不会显示其他 scan 记录，扫描详情顶部“审计追踪”点击后跳转到带 `projectId` 和 `scanTaskId` 的审计页；临时数据已清理。
- 项目页 code_chunks 闭环补强：`ProjectDetail` 会对最新成功扫描预加载一次 `code-chunks/search?limit=1`，顶部主链路、Analysis Readiness 和 QA 页健康卡片均使用真实 `totalChunks/embeddedChunks/retrievalMode/evidenceProfile`，不再用文件数冒充切片数；报告/Agent 阶段不再只凭扫描成功显示 Ready。
- 产物页错误体验补强：`Artifacts` 的列表加载失败和智能预览失败已改为页面内错误状态，Evidence Readiness 会把数据源不可用纳入危险态，并保留上次成功数据；浏览器 smoke 用临时 projectId `34` / 4 条核心 artifact 验证 readiness ready、无全局 toast，故意触发预览失败时错误留在 drawer 内。
- 备份/回滚 artifact 匹配收紧：`backup-preflight`、`rollback-preflight` 和 `release-evidence` 只接受以 `backup_id` 加 `-`、`_` 或 `.` 分隔符开头的备份 artifact 文件名，避免 `backup1` 误匹配 `backup10-*`；临时负向/正向演练已验证边界和 checksum 比对。`make backup-restore-drill` 已补齐可执行恢复演练入口，可恢复 SQL 到 Docker MySQL scratch database 并生成标准 evidence。

当前优先级决策：

- GitHub App 是面向私有仓库、webhook 增量扫描、自动 PR 和企业级安装的高级集成层，不作为当前公开仓库逆向分析主线的阻塞项。
- 当前主线优先稳定：公开仓库报告/问答体验、备份恢复/回滚演练和工作区分组审查。
- GitHub App/webhook E2E 保留架构和本地回归，不删除、不弱化安全边界；等核心公开仓库链路稳定后再进入真实凭据和真实 GitHub 仓库端到端演练。

注意：

- `web-console/dist` 与 `web-console/tsconfig*.tsbuildinfo` 已通过仓库卫生清理移出 Git 跟踪，后续构建产物由 `.gitignore` 忽略。
- `make clean` 已覆盖前端 `dist`、`.vite`、`tsconfig*.tsbuildinfo`、Rust `analyzer-rust/target`、根 `bin/`、`.DS_Store` 和递归 `target 2` 误生成目录，避免本地构建产物在分组审查前长期残留。
- 历史误生成的 `target 2` 构建目录已用 `**/target 2/` 在 Git/Docker build context 中通用忽略，并由 `make clean` 递归清理；清理命令会跳过 `.git`、`web-console/node_modules`、常规 Maven/Rust target 这类大目录。
- 当前工作树仍包含大量阶段性重构文件未纳入版本库，正式提交前应按阶段拆分或至少按模块分组提交。

## 1. 重构原则

SourceLens 的核心风险来自“读取用户源码、保存访问凭据、调用大模型、执行构建测试、生成代码改动”这一整条链路。因此重构必须先安全、再可靠、再扩展。

本路线图遵循以下原则：

- 先止血，不急着堆新功能。
- 先明确边界，再扩大 Agent 自动化能力。
- 先让任务可追踪、可取消、可恢复，再做复杂编排。
- 先把 Spring Boot 单体内部边界做清楚，再考虑拆服务。
- 先把 Rust CLI 的输出稳定化，再考虑 gRPC/LSP 常驻化。
- 先用 MySQL 与文件 artifact 管好数据，再在确有瓶颈时引入 Neo4j、pgvector、Temporal。

## 2. 阶段 0：冻结范围与建立基线

状态：已完成。

目标：把当前原型状态固定下来，为后续重构建立稳定的工程基线。

任务：

- 建立本路线图文档。
- 建立安全边界文档。
- 补齐 `.gitignore`，防止构建产物继续进入版本库。
- 记录当前验证命令：后端 `mvn test`、前端 `npm run build`、Rust `cargo check`。
- 梳理并清理已被跟踪的构建产物。

验收标准：

- 基线文档存在。
- 构建产物忽略规则存在。
- 三项基础验证命令可运行。

## 3. 阶段 1：安全止血

状态：已完成。

目标：消灭当前最危险的上线风险。

任务：

- 生产环境禁止默认 `JWT_SECRET`、`ENCRYPT_PASSWORD`、`ENCRYPT_SALT`、数据库密码。
- 增加启动期安全配置校验，生产配置不合规时直接启动失败。
- `TokenEncryptor` 新写入密文使用版本化 AES-GCM（`SLENC2:` 前缀），错密码或密文篡改必须认证失败；旧 CBC/Base64 密文仅保留读取兼容。
- Swagger、OpenAPI、Mock LLM 只在显式 `dev`/`test` profile 开放，`staging`、`qa` 或无 active profile 不得因“非 prod”判断被自动放行。
- `logout` 接入 JWT blacklist，为 token 撤销机制打基础。
- 用户登录成功、登录失败和退出写入 `audit_logs`，登录失败不记录密码。
- 所有 API 响应禁止返回明文 token、API key、encrypted token 字段。
- LLM 配置列表返回 masked key，内部调用模型时才解密。
- LLM Base URL 在保存配置和发起请求前双重校验：非 Mock provider 必须使用 HTTPS，拒绝 localhost、内网 IP、链路本地地址、metadata host、user-info、query 和 fragment。
- `file://` 仓库默认禁用，dev 环境显式开启。
- 仓库 URL 和分支名在保存与 Git 操作前统一规范化校验：GitHub 只允许 HTTPS github.com 仓库 URL，拒绝认证信息、query、fragment、非 GitHub host 和非法分支名。
- 本地仓库扫描不直接使用原目录，统一复制到 workspace 隔离目录。

验收标准：

- 生产默认密钥启动失败。
- 前端与 API 看不到任何明文密钥。
- Swagger/mock 在生产不可访问。
- LLM 外部请求不会被配置为访问本机、内网或云 metadata 地址。
- Git clone/pull 不接受未规范化仓库 URL 或危险分支名。
- `file://` 默认不可用。

## 4. 阶段 2：Agent 工具边界重构

状态：已完成。

目标：让 Agent 工具调用从隐式能力变成显式授权能力。

任务：

- 定义工具权限等级：`READ_ONLY`、`WRITE_PATCH`、`EXEC_TEST`、`CREATE_PR`。
- 默认只开启只读工具。
- `write_file`、`shell_exec`、自动 PR 必须用户显式开启。
- 新增 `agent_tool_calls` 审计表。
- 所有工具调用统一经过 `ToolExecutionService`。
- 工具参数与结果做敏感信息脱敏和输出截断。
- 工具返回给 Agent/前端前也必须清洗，不只在 `agent_tool_calls` 审计入库前清洗；`ToolResult` 统一限制内容和错误长度，避免大块命令输出污染模型上下文。
- Agent 工具的 `offset`、`limit`、`max_results`、`timeout` 等边界参数统一做类型校验和上下限夹取，避免异常参数进入 SQL `LIMIT`、文件读取范围、结果集切片或沙箱执行超时。
- 沙箱执行器拒绝非正 timeout，工具层和执行层都有超时边界防线。
- `ShellExecTool` 默认关闭。
- 若保留 dev shell，禁止 `bash -c` 自由字符串，改为结构化命令和参数级白名单。
- 修复所有进程执行的超时和输出读取阻塞问题。

验收标准：

- 每次工具调用都有审计记录。
- Agent 默认不能写文件、不能执行 shell。
- shell 超时一定生效。
- 工具输出中的 token、API key、Bearer/Basic/Token 授权头、password、JWT/privateKey、URL userinfo 密码和私钥块在 Agent 可见结果与审计记录中都不可见。
- 前端可查看工具调用回放。

## 5. 阶段 3：自动修复降级为 Patch 工作流

状态：已完成，且阶段 11 已在显式开关下恢复受控 PR 能力。

目标：自动修复先生成可审查 patch，不直接修改原仓库或推送远端。

任务：

- 拆分 `AutoRepairService`：任务服务、workspace 服务、patch 生成服务、验证服务、PR 服务。
- LLM 输出统一转换为 patch artifact。
- 默认不覆盖本地原目录。
- 默认不 push 分支、不创建 PR。
- `repair.filePath` 做 normalize，禁止越界和敏感文件修改。
- 受控 PR 创建前对 patch diff 做二次校验：限制大小，只允许修改当前目标文件，拒绝多文件 diff、路径越界和敏感路径。
- 测试日志写 artifact 文件，DB 只存摘要和路径。
- GitHub token 不再拼进 remote URL。

验收标准：

- 自动修复输出 diff/patch。
- 受控 PR 不会提交超出 AutoRepair 目标文件范围的 patch。
- 人工确认前不会写远端。
- 本地目录不会被覆盖。

## 6. 阶段 4：任务系统状态机化

状态：已完成第一版。

目标：扫描、Agent、修复任务都可追踪、可取消、可恢复。

任务：

- 新增统一任务表 `execution_tasks`。
- 新增任务步骤表 `execution_steps`。
- 统一状态：`PENDING`、`QUEUED`、`RUNNING`、`WAITING_USER`、`SUCCESS`、`FAILED`、`CANCELLED`。
- `SUCCESS`、`FAILED`、`CANCELLED` 为不可逆终态，异步迟到的 step/task 更新不能覆盖用户取消或已完成结果。
- 统一任务取消时同步取消所有非终态步骤，已成功、失败或取消的步骤不被二次覆盖。
- Controller 只创建任务，不直接执行业务。
- 使用 DB 约束或 Redis lock 防止重复任务并发穿透。
- 支持取消任务。
- 任务列表按项目分页查询，避免长期运行后统一任务页和轮询接口全量拉取。
- 支持按 `sourceType/sourceId` 查询统一执行任务详情，业务页面无需扫描整张任务列表来关联来源任务。
- `execution_tasks` 针对项目分页和来源详情查询建立联合索引，避免任务量增长后列表排序和来源关联退化。
- `execution_tasks` 以 `sourceType/sourceId` 作为来源幂等键，服务层重复创建会返回既有任务，数据库层通过唯一约束防止并发穿透产生重复统一任务。
- `scan_tasks` 使用可空 `active_lock_key` 作为仓库级活跃锁，`PENDING/RUNNING` 扫描占用 `repo:{repositoryId}`，成功、失败或取消后释放锁。
- 扫描任务创建入口同时具备服务层预检查和数据库唯一键兜底，竞态冲突会返回明确业务错误，不会继续创建 execution task、写审计或触发异步扫描。
- `auto_repairs` 使用可空 `active_lock_key` 作为仓库文件级活跃锁，补丁生成和受控 PR 创建期间占锁，`PATCH_READY`、`PR_CREATED`、`FAILED`、`CANCELLED` 等阶段释放锁。
- AutoRepair 创建和 PR 排队入口同时具备服务层预检查和数据库唯一键兜底，竞态冲突会返回明确业务错误，避免同一文件并发生成补丁或并发创建远端 PR。
- Agent 任务启动使用 `id + PENDING` 条件更新，只有一个并发请求能把任务推进到 `RUNNING`，失败请求不会标记 execution task 或触发异步分析。
- CI 诊断、PR 审查和 Issue 拆解的异步入口使用 `id + PENDING` 条件更新抢占处理权，重复触发会跳过，避免重复写诊断结果、PR 评论或拆解子任务。
- CI 诊断和 PR 审查的重新分析入口由 service 统一重排队，进行中任务会拒绝重复 reanalyze，Controller 不再直接改写任务状态。
- CI 诊断首次创建时会同步创建 `execution_tasks`，首次分析会写入 `analyze_ci_failure` step，并在完成或失败时同步统一执行任务状态。
- PR 审查首次创建时会同步创建 `execution_tasks`，首次分析会写入 `analyze_pr_review` step，并在完成或失败时同步统一执行任务状态。
- PR 审查重新分析会先替换本次 review 的旧评论，再写入新评论，避免历史评论和新分析结果混杂；评论写入失败会把业务 review 和统一执行任务一并标记为失败。
- Issue 拆解首次创建时会同步创建 `execution_tasks`，处理时写入 `decompose_issue` step，并在子任务写入完成后才标记业务拆解和统一执行任务成功。
- Issue 拆解处理会替换旧子任务后写入本次子任务，子任务写入失败会把业务 decomposition 和统一执行任务一并标记为失败。
- CI 诊断日志、PR diff/评论、Issue 描述/拆解结果等 LLM 密集路径在入库和进入 prompt 前统一脱敏与截断，避免敏感片段通过分析结果、评论或子任务字段残留。
- 新增 `execution_attempts`，统一执行任务继续以 `sourceType/sourceId` 作为业务来源锚点，每次重新分析会创建新的 attempt，step 通过 `attempt_id` 归属到本次执行。
- CI 诊断、PR 审查和 Issue 拆解使用 attempt-scoped step/status API，同一业务来源多次重新分析可在时间线中保留多次执行记录，旧 attempt 的迟到完成事件不会覆盖当前 attempt 对应的父任务状态。
- 统一执行任务详情接口返回 `attempts + steps`，前端执行任务页展示每次 attempt 状态，并在步骤时间线中标注第几次执行。
- 新增 `execution_logs` append-only 日志表，任务生命周期事件以插入方式记录开始、完成、失败、取消和新 attempt 创建，不再依赖覆盖式 step 摘要作为唯一排障入口。
- 统一执行任务详情接口返回最近执行日志，前端执行任务页展示按时间排列的日志窗口，日志行包含时间、级别、attempt 和 step 信息。
- `execution_logs` 支持按保留期批量清理，默认关闭，可通过 `SOURCELENS_EXECUTION_LOG_CLEANUP_ENABLED`、`SOURCELENS_EXECUTION_LOG_RETENTION_DAYS`、`SOURCELENS_EXECUTION_LOG_CLEANUP_BATCH_SIZE` 和 `SOURCELENS_EXECUTION_LOG_CLEANUP_CRON` 单独配置。
- 执行任务 step summary、error message、append-only log message 统一脱敏和截断，避免构建日志或失败摘要中的 token/password/API key 进入任务时间线。
- Agent 任务输出、手动完成输出和步骤输出统一脱敏和截断，避免手动 API 或异步步骤绕过 Agent 工具输出边界。

验收标准：

- 刷新页面不丢任务进度。
- 失败能看到具体 step。
- 重复扫描不会并发执行。
- 任务可取消。
- 用户取消后的异步迟到事件不会把任务或步骤改回成功、失败或运行中。
- 任务取消后，时间线中仍未完成的步骤会统一显示为已取消。
- Agent 分析主流程具备检查点式取消，用户取消后不会被后台异步流程继续写回成功或失败。
- Agent 手动完成/取消入口同样遵守终态不可覆盖规则，不能把已取消、已失败或已完成任务改写成其他终态。
- AutoRepair 受控 PR 异步流程在提交前、进度回调和提交返回后检查取消状态，取消后不会把本地任务重新写成 `PR_CREATED` 或 `PATCH_READY`。

## 7. 阶段 5：扫描产物与数据清理

状态：已完成第一版 artifact store、artifact retention、audit retention、workspace sandbox 兜底清理和项目删除级联策略。

目标：避免 MySQL 无限膨胀，避免删除项目后留下孤儿数据。

任务：

- 大型 raw scan result、报告、日志写 artifact store。
- DB 只存 summary、hash、size、schema version、storage path。
- 新增 `ProjectDeletionService`。
- 删除项目时级联逻辑删除仓库、GitHub App installation、扫描任务、artifact、symbols、relations、chunks、execution tasks、execution attempts、execution steps、execution logs、conversations、Agent tasks、AutoRepair、CI diagnostics、PR reviews 和 issue decompositions。
- 新增通用 `audit_logs`，项目删除级联成功后写入审计记录。
- 新增项目级审计日志查询接口和前端审计日志页面，接口按项目所有权隔离，支持 resourceType、action、status 筛选。
- 新增项目级 Agent 工具调用查询接口，并在审计日志前端页面中提供 Agent 工具调用视图，接口按项目所有权隔离，支持 toolName 和 success 筛选。
- 新增 `github_webhook_delivery_projects` 映射表，支持一个 webhook delivery 关联多个 project/repository，并在审计日志前端页面中提供 GitHub Webhook 视图。
- 用户登录成功、登录失败和退出写入 `audit_logs`，认证审计不记录密码或 token 明文。
- 扫描任务创建、取消和失败写入 `audit_logs`，只记录仓库 id、分支、步骤和错误摘要。
- AutoRepair patch 生成、取消、失败、受控 PR 排队、PR 创建成功和 PR 创建失败写入 `audit_logs`，不记录 diff 正文、源码、prompt 或 token。
- 仓库新增、删除和 PAT 凭据更新写入 `audit_logs`，不记录 token 明文。
- GitHub App installation 绑定、禁用、webhook 同步写入 `audit_logs`，不记录 installation access token。
- `audit_logs` 与 `agent_tool_calls` 支持按保留期批量清理，默认关闭，可通过 `SOURCELENS_AUDIT_CLEANUP_ENABLED`、`SOURCELENS_AUDIT_RETENTION_DAYS`、`SOURCELENS_AUDIT_CLEANUP_BATCH_SIZE` 和 `SOURCELENS_AUDIT_CLEANUP_CRON` 配置。
- 后台异步物理清理 workspace 和 artifact 文件。
- workspace sandbox 过期清理默认关闭，开启后只清理 `repair-*` 与 `autorepair-pr-*` 直接子目录。
- `prod-preflight` 会检查 workspace sandbox、artifact、audit 和 execution log cleanup 策略：关闭时记录 warning，retention/batch 无效时失败，发布证据可直接暴露容量治理缺口。

验收标准：

- 删除项目后没有 orphan symbol/relation/chunk，也不会留下 execution attempt、execution step、execution log、conversation message、Agent step、PR review comment、issue task 等子表孤儿数据。
- 项目审计日志可以按项目分页查询，并且非项目拥有者无法读取。
- Agent 工具调用可以按项目分页查询，并且非项目拥有者无法读取。
- GitHub webhook delivery 可以按项目分页查询，并且非项目拥有者无法读取。
- GitHub webhook delivery 主表与项目映射表的 `delivery_id` 排序规则由 V027 统一为 `utf8mb4_unicode_ci`，避免 MySQL 8 默认 collation 与历史迁移 collation 混用导致项目审计页 500。
- 项目删除有审计记录，包含 user、project、resource、action、status 和 duration。
- 用户登录成功、登录失败和退出有审计记录。
- 扫描任务创建、取消和失败有审计记录。
- AutoRepair patch 生成、取消、失败、受控 PR 排队、PR 创建成功和 PR 创建失败有审计记录。
- 仓库新增、删除和 token 更新有审计记录。
- GitHub App installation 绑定、禁用和 webhook 同步有审计记录。
- 审计日志和 Agent 工具调用审计可以按保留期批量清理，避免审计表无限增长。
- 执行任务 append-only 日志可以按保留期批量清理，避免长任务与高频重试场景导致日志表无限增长。
- 大日志和 raw result 不反复更新 MySQL 大字段。

## 8. 阶段 6：RAG 与代码切片重构

状态：已完成第一版。

目标：让代码问答检索更准、更便宜、更快。

任务：

- 切片前过滤构建产物、第三方库、生成代码、lock 文件、大型 JSON。
- chunk 增加 `content_hash`，未变化文件不重新切片、不重新 embedding。
- 问答时先关键词和路径筛 topN，再算向量相似度。
- 本地代码问答入口通过 `CodeChunkService.listRetrievalCandidates` 在 DB 层按问题关键词和路径缩小候选集，候选为空时只回退读取少量稳定切片，避免大型项目问答全量加载所有 chunk。
- embedding 模型可配置。
- 中期引入 pgvector 或独立向量库。

验收标准：

- 一次问答不会全量遍历所有 chunk。
- 重复扫描不会重复 embedding 未变化文件。
- 回答引用文件和行号。

## 9. 阶段 7：Rust Analyzer 质量提升

状态：已完成第一版 schema/hash/限制/契约测试。

目标：先稳定 CLI schema 和测试，再考虑 daemon 化。

任务：

- 定义 `scan_result_schema_version`。
- 建立 analyzer fixtures 和 snapshot tests。
- 对大文件和二进制文件做扫描上限。
- Java 后端按 schema version 解析。
- 用文件 hash 实现第一版增量扫描。

验收标准：

- analyzer 修改有 fixtures 回归。
- scan result schema 兼容。
- 小改动重扫明显变快。

## 10. 阶段 8：LLM 网关重构

状态：已完成第一版 adapter 化。

目标：模型厂商协议与业务逻辑解耦。

任务：

- 定义 `LlmProviderAdapter`。
- 实现 OpenAI-compatible 和 Mock adapter。
- 预留 Anthropic、Ollama、Azure adapter。
- `LlmConfig` 增加 chat model、embedding model、capabilities。
- 新增统一 `LlmJsonExtractor`。
- PR Review、Issue 拆解、CI 诊断共用 JSON 提取与降级逻辑。

验收标准：

- 换模型厂商不改业务服务。
- embedding 模型可配置。
- LLM JSON 解析失败有降级路径。

## 11. 阶段 9：前端控制台重构

状态：已完成第一版统一任务体验。

目标：前端从页面堆叠变成统一任务工作台。

任务：

- 路由级 lazy import，降低首屏 bundle。
- API client 增加统一错误展示、请求 ID、重试策略。
- 后端新增 `RequestIdFilter`，统一接收或生成 `X-Request-Id`，写回响应头、request attribute 和 MDC；审计日志在调用方未显式传 requestId 时自动使用当前 MDC requestId。
- 前端新增 `formatApiError` / `showApiError`，主要工作台、审计、模型配置、登录注册、项目详情和扫描详情页面的 API 失败路径统一展示后端业务错误与请求 ID，不再在页面层吞掉拦截器生成的 `userMessage`。
- 统一任务组件：timeline、log viewer、artifact viewer、diff viewer。
- Agent 工具调用统一展示。
- 模型配置页只显示 masked key。

验收标准：

- 首屏 bundle 明显降低。
- 前后端错误排障可通过 `X-Request-Id` 串联 API 响应、服务端日志和审计日志。
- 长任务刷新不丢状态。
- 任务详情页体验统一。

## 12. 阶段 10：容器沙箱

状态：已完成第一版 local/docker executor 抽象与关键路径接入。

目标：所有构建、测试、代码执行都离开 Spring Boot 宿主进程。

任务：

- 定义 `SandboxExecutor`。
- dev 保留 `LocalProcessSandboxExecutor`。
- 产品路径实现 `DockerSandboxExecutor`。
- 容器 non-root、限制 CPU、内存、网络和超时。
- Docker 执行器默认增加 `--pids-limit`、`--cap-drop ALL`、`--security-opt no-new-privileges`、`--read-only`、受限 `/tmp` tmpfs 和 `--memory-swap=<memory>`，避免容器内进程获得不必要系统能力或通过 swap 扩大内存上限。
- `SandboxCommand` 在 local/docker executor 入口统一校验 command、workingDirectory 和正数 timeout，避免不同执行器边界不一致。
- 输出只允许 diff、logs、test result。
- 中期接入 gVisor 或更强隔离运行时。

验收标准：

- 自动修复测试不在宿主进程执行。
- 资源可控。
- Docker 命令生成可单测验证，默认隔离参数不会被无意移除。
- local/docker executor 对非法 timeout 的拒绝行为一致。
- 任务结束无残留进程。

## 13. 阶段 11：GitHub App 替代 PAT

状态：已完成第一版 GitHub App 数据模型、短期 token、webhook 同步和受控 PR。

目标：弃用生产路径中的长效 PAT。

任务：

- 建立 GitHub App installation 数据模型。
- 后端用私钥签 JWT 换取 installation access token。
- token 只在 clone、push、create PR 时短期使用。
- 生产路径不依赖长效 PAT；GitHub App installation access token 不落库。
- PAT 仅作为 dev fallback。
- 生产 profile 默认禁止新增或更新 PAT 仓库凭据，必须使用 GitHub App installation。
- GitHub webhook 使用 `X-Hub-Signature-256` 和 `GITHUB_APP_WEBHOOK_SECRET` 校验。
- `installation` 和 `installation_repositories` 事件同步已存在仓库的 installation 绑定。
- webhook delivery id 处理前先以 `PROCESSING` 状态 claim 到 `github_webhook_deliveries`，成功后再更新为 `PROCESSED`；重复或并发投递会被唯一键挡在 installation/repository 同步之前。
- GitHub webhook 必须携带 `X-GitHub-Delivery`，缺失 delivery id 时在业务处理前拒绝，避免 installation 同步成功但无法写入幂等记录和项目审计关联。
- webhook delivery 支持按保留期批量清理，默认关闭，可通过环境变量启用。
- 受控 PR 创建前校验 installation permissions，必须具备 `contents:write` 与 `pull_requests:write`；权限不足或 webhook 权限降级后会拒绝排队、保留 `PATCH_READY`，并写入 `AUTO_REPAIR_PR_REJECTED` 审计。
- GitHub owner/repo 组件在 URL 入库、受控 PR 创建和 GitHub App drill 中统一做安全校验，拒绝 dot-segment、额外路径分隔符、连续 `..` 和 `.git` 后缀进入 `/repos/{owner}/{repo}` API path。
- AutoRepair `PATCH_READY` 可在 `SOURCELENS_AUTOREPAIR_SUBMIT_PR_ENABLED=true` 时创建受控 PR。
- 受控 PR 流程复用 AutoRepair 的 `execution_tasks`，通过后台异步任务记录 clone、apply patch、push、create PR 四个步骤。
- 受控 PR 重复提交会被拒绝；异步执行入口只接受 `PR_RUNNING`，避免误重复触发已完成或已回退的任务。
- 受控 PR 临时 clone 工作区在成功或失败后都会尝试清理，避免长期残留仓库内容。
- 受控 PR clone/push Git 远端和 GitHub API 都有 host allowlist，默认只允许 `github.com` 与 `api.github.com`。
- 受控 PR push 阶段会把非快进或远端分支变化映射为 `CONFLICT`，把远端策略拒绝或分支保护拒绝映射为 `FORBIDDEN`；本地回归用 bare repo 已覆盖同名修复分支非快进推送失败，并断言失败后不会继续调用 GitHub PR API。
- 分支保护式 push 拒绝已有本地诊断回归：`REJECTED_OTHER_REASON` 会保留清洗后的远端原因，例如 GitHub `GH006: Protected branch update failed`，便于真实 release evidence 和运维日志定位。
- GitHub App installation token 换取和 Pull Request 创建共用 GitHub API 出口策略：HTTPS、allowlist、拒绝本机/内网/链路本地/metadata 地址以及 user-info/query/fragment。
- GitHub Pull Request API 请求会在 HTTP 调用前校验 repository owner/name、head/base branch 和标题；GitHub `401/403` 会映射为权限失败，`409/422` 会映射为重复 PR 或校验冲突，HTTP client IO 失败会映射为脱敏后的网络请求失败，便于真实演练时定位分支保护、权限不足、重复提交和网络/API 异常。
- 重复 PR 或 GitHub 校验冲突发生在 `create_pull_request` 阶段时已有本地回归：AutoRepair 回到 `PATCH_READY`、保留错误消息、失败 `create_pull_request` step、写入 `AUTO_REPAIR_PR_FAILED`，且不会写入 `PR_CREATED` 或 `markSuccess`。
- `installation_repositories` webhook 的 `repositories_added` / `repositories_removed` 已有本地状态回归：added 只绑定系统内已存在仓库并切换为 `GITHUB_APP`，removed 禁用对应 installation 并切回 `NONE`，未知仓库不会被自动创建。
- `installation` 的 `new_permissions_accepted` payload 已有本地回归：permissions 从 write 降到 read 后，后续受控 PR 权限检查会返回 `FORBIDDEN`。
- GitHub App installation 绑定、禁用、webhook 同步会写入 `audit_logs`。
- 受控 PR 只允许 `provider=GITHUB` 且 `authType=GITHUB_APP` 的仓库，不允许 PAT。

验收标准：

- 生产不依赖长效 PAT。
- 生产 profile 下新增或更新 PAT 会被拒绝。
- token 不落库。
- GitHub 权限最小化。
- webhook 未配置 secret 或签名错误时拒绝。
- 重复投递的 GitHub webhook delivery 不会重复执行状态同步。
- 缺少 delivery id 的 GitHub webhook 不会继续处理 installation 或 repository 同步。
- GitHub webhook delivery 可以按保留期清理，避免幂等记录无限增长。
- installation 权限不足时拒绝创建受控 PR。
- 受控 PR 默认关闭，开启后使用 GitHub App installation token clone/push/create PR。
- GitHub App token 换取和 PR 创建不会访问 allowlist 外或内网类 GitHub API Base URL。
- 受控 PR 失败时能在 execution step 中定位失败阶段，并将 AutoRepair 恢复为 `PATCH_READY` 以便修正后重试。

已落地文件：

- `github_app_installations` 迁移。
- `GitHubAppTokenService`、`GitHubAppInstallationService`。
- `GitHubAppWebhookController`、`GitHubAppWebhookService`、`GitHubWebhookSignatureService`。
- `GitHubPullRequestService`、`AutoRepairPrService`。
- 前端仓库页 GitHub App 绑定入口。
- 前端 AutoRepair 页创建 PR 和 PR 链接展示。

剩余风险：

- 受控 PR 当前基于 patch apply 和 GitHub REST，真实 GitHub App 权限、分支保护、fork/head 规则仍需在真实仓库做端到端演练。
- 受控 PR 当前在后端进程中使用 JGit/HTTP 执行，已用 host allowlist 收敛网络出口；生产若迁移到独立 worker 或容器执行，还需同步配置网络出口。
- 受控 PR 已异步化，HTTP 请求只负责校验、切换为 `PR_RUNNING` 并启动后台任务；真实 GitHub 仓库端到端验证仍需覆盖分支保护、权限和网络失败场景。
- webhook delivery 清理默认关闭；生产部署需要显式配置 `GITHUB_WEBHOOK_DELIVERY_CLEANUP_ENABLED=true` 和符合审计要求的保留天数；`prod-preflight` 在强制 GitHub App readiness 时已检查 cleanup enabled、retention days 和 batch size。

## 14. 阶段 12：图数据库与高级编排

目标：在真实瓶颈出现后，引入 Neo4j、pgvector、Temporal 或 analyzer daemon。

触发条件：

- 单项目 symbol/relation 超过 50 万。
- 多级调用链查询超过 2 秒。
- 任务恢复、重试、补偿逻辑已经超过简单队列能力。

验收标准：

- 有基准数据证明需要引入新组件。
- 新组件不替代业务主库，只承担专门职责。

## 15. 阶段 12 前生产化收口

状态：进行中。

目标：让阶段 0-11 已落地能力具备真实部署、排障和验收基础，再进入更重的新组件引入。

当前已补齐：

- `RequestIdFilter` 贯穿 API 响应、MDC 和审计记录。
- `execution_logs` 提供 append-only 任务生命周期日志。
- `SourceLensMetrics` 统一封装 Micrometer 业务指标，避免业务代码直接散落指标命名。
- `/actuator/health`、`/actuator/info`、`/actuator/metrics` 暴露基础运行状态和指标。
- `SecurityStartupValidator` 在生产 profile 下强制校验仓库认证、docker sandbox、GitHub App 受控 PR 前置配置等生产红线，避免运维手册中的安全要求只停留在人肉检查。
- `SecurityStartupValidator` 在开启 Agent 创建 PR 或 AutoRepair 受控 PR 时复用 `GitHubApiEndpointPolicy`，启动期即拒绝非 HTTPS、allowlist 外、本机/内网/链路本地/metadata 或带 user-info/query/fragment 的 GitHub API base URL。
- GitHub App webhook 入口和服务层都要求 `X-GitHub-Delivery`，以 delivery id 作为幂等与审计关联键；服务层会在业务处理前 claim delivery id，并在同一事务内完成 installation/repository 同步和 `PROCESSED` 标记。
- `application-prod.yml` 默认使用 `SOURCELENS_SANDBOX_EXECUTOR=docker`，生产不再默认回退到 local executor。
- `application-prod.yml` 显式暴露 Docker sandbox 的 network、非 root user、pid limit、read-only root 和安全 tmpfs 参数，确保 `SecurityStartupValidator` 从 Spring Environment 能读到启动红线，而不是只依赖执行器 `@Value` 默认值。
- `application-prod.yml` 和 `DockerSandboxExecutor` 的 Docker sandbox 默认镜像已固定为 `tag@sha256:digest`，生产启动校验和 preflight 会拒绝裸 tag 覆写，避免执行用户仓库命令的沙箱镜像被可移动 tag 污染。
- `SecurityStartupValidator` 对 Docker sandbox memory 与 CPU limit 做正值校验，`production-preflight.sh` 也会在真实 env 覆写这些值时提前拦截 0、负数或非法格式。
- `SecurityStartupValidatorTest` 增加真实 YAML 加载用例，验证只提供外部 secret/DB/Redis 变量时，`application.yml` + `application-prod.yml` 本身足以通过生产启动红线校验。
- `deploy/docker-compose.yml` 的 prod 后端显式使用 docker sandbox，并显式关闭 PAT 凭据和本地文件仓库；安全回归检查会阻止 `deploy/.env` 被纳入版本库。
- `production-preflight.sh` 会检查 `docker compose config` 渲染后的 backend/mysql/redis 服务块，确认 prod profile、仓库根 build context、docker sandbox 红线、禁用 PAT、禁用本地文件仓库、workspace volume、healthy depends_on 和外部服务 digest-pinned image 未被实际发布配置绕开。
- 后端 Docker 镜像改为从仓库根构建，同时打包 Spring Boot jar 和 Rust `sourcelens-analyzer`，避免容器部署后扫描任务找不到 analyzer 二进制。
- 后端 Dockerfile 的 Maven builder、Rust analyzer builder 和 JRE runtime 基础镜像均固定为 `tag@sha256:digest`，依赖回归和安全回归门禁会阻止退回可移动基础镜像 tag。
- `deploy/docker-compose.yml` 中的 MySQL 与 Redis 外部服务镜像也已固定为 `tag@sha256:digest`，依赖回归和安全回归门禁会阻止退回可移动 Compose service image tag。
- 新增根 `.dockerignore`，排除 `.git`、前端依赖、构建产物和私有 env 文件，降低仓库根 Docker build context 的体积与泄漏风险。
- 新增 `docs/OPERATIONS_RUNBOOK.md`，覆盖生产环境变量红线、Actuator 暴露策略、GitHub App 端到端验收、沙箱验收、回滚止损和发布前验证。
- 新增 `scripts/smoke-test.sh` 与 `make smoke`，提供可重复的 `/api/health`、`/actuator/health`、`/actuator/info`、未认证 metrics 禁止访问和可选 authenticated metrics 验收入口。
- `scripts/smoke-test.sh` 与 `scripts/production-preflight.sh` 会规范化 `SOURCELENS_BASE_URL` 的空白、成对引号和末尾 `/`，避免部署 smoke 拼出 `//api/health`；smoke、production preflight、rollback preflight 和 GitHub webhook drill 会在 HTTP 调用前 fail-closed 拒绝非 http/https、空 host、空白、user-info、query 或 fragment 的 Base URL，避免把凭据形态 URL 写入日志或拼出不可预测的验收路径；smoke 可通过 `SOURCELENS_SMOKE_ENV_FILE` 读取私有 env 文件并在读取 token 前独立校验真实 env 文件边界，安全回归会用 fake curl 负例确认 644 env 文件在 HTTP 调用前 fail-closed；preflight 会从真实 env 文件读取 smoke target，并按后写覆盖先写的 env 语义解析重复 key；smoke token 也会去掉外层或嵌套成对引号后再作为 Bearer token 使用。
- `scripts/smoke-test.sh` 与 `scripts/production-preflight.sh` 的 HTTP smoke 调用已统一使用可配置 curl 超时，默认 connect timeout 5 秒、max time 15 秒，并拒绝非正整数覆写，避免发布验收在异常网络连接上长时间挂住。
- 新增 `scripts/security-regression-check.sh`，自动拦截危险旧示例、生产配置默认值回退、Swagger 生产开启、smoke metrics 保护断言缺失，以及 prod preflight 入口/模板/文档缺失等安全回归。
- `scripts/security-regression-check.sh` 同时检查 Makefile/CI 直接执行的发布脚本保留 executable bit，避免脚本权限在提交或换机后丢失。
- 新增 `make script-check`，并接入 `make verify` 与安全回归门禁，统一对 `scripts/*.sh` 执行 `bash -n`，避免 smoke、phase12 baseline、worktree inventory 等低频脚本只在真实环境才暴露语法问题。
- 新增 `scripts/dependency-regression-check.sh` 与 `make dependency-check`，固定前端 lockfile、Rust lockfile、CI locked install/check/test，并阻止 file/git/path/system/floating 版本等不可复现依赖模式。
- 新增 `scripts/worktree-inventory.sh` 与 `make worktree-inventory`，按安全、审计、分析、任务、Agent、沙箱、GitHub App、前端、Rust analyzer、CI/运维、文档等组输出当前工作区清单，辅助后续拆审和拆提交；临时分组目录使用 SourceLens 前缀并显式收紧为 `700`；`SOURCELENS_WORKTREE_INVENTORY_STRICT` 只接受合法布尔值，拼错会 fail-closed，避免 strict 拆审或发布证据复核被静默降级。
- 新增 `scripts/production-preflight.sh` 与 `make prod-preflight`，在真实 smoke、GitHub App E2E、Docker sandbox 演练和阶段 12 baseline 前检查 Docker daemon、MySQL CLI、生产变量、GitHub App 变量、GitHub API 出口策略、Compose config 和静态安全/依赖/LLM safety 门禁；静态门禁失败时会保留子门禁输出详情，便于定位具体断言或样例失败；Compose 会同时渲染 `deploy/.env.example` 模板和存在的真实部署 env 文件，并检查渲染结果中的生产安全红线，避免只验证模板而漏掉实际发布配置。
- 新增 `scripts/sandbox-drill.sh` 与 `make sandbox-drill`，在真实 Docker 环境中创建受限 sandbox 容器，通过 `docker inspect` 和容器内运行时检查验证 no-network、非 root、cap drop、no-new-privileges、read-only root、`/tmp` noexec/nosuid、pid/memory cgroup、workspace 写入和 memory-swap 上限；脚本会在读取 sandbox 覆写配置前独立校验真实 env 文件边界，挂载前将临时 workspace 显式收紧为 `700`，并显式覆盖 runtime script entrypoint，避免默认 `alpine/git` entrypoint 把 `sh` 误解释成 git 子命令。后端 Docker sandbox executor 会清空镜像默认 entrypoint，确保真实用户命令不被镜像入口劫持。
- 新增 `scripts/github-app-drill.sh` 与 `make github-app-drill`，在真实 GitHub App 环境中只读验证 App JWT、installation 元数据、installation access token、仓库读取权限和 webhook HMAC；脚本会在读取配置前独立校验真实 env 文件边界，在本地配置阶段校验 private key PEM 形状和 webhook secret 最小长度，并用标准 HMAC-SHA256 测试向量和实际 secret 的 `sha256=<hex>` 签名头形状校验本地签名路径，再将临时私钥目录显式收紧为 `700`、私钥文件收紧为 `600`，不创建分支、不 push、不创建 PR。
- 新增 `scripts/github-webhook-drill.sh` 与 `make github-webhook-drill`，在真实 SourceLens 部署入口验证 GitHub webhook HMAC SHA-256 签名、同一 delivery id 重放幂等、缺 delivery id 拒绝和错误签名拒绝；脚本会在读取 webhook secret 前独立校验真实 env 文件边界，演练用 event/delivery id header 值会先做字符集与长度校验，自定义 payload fixture 需通过非空、非 symlink、权限、大小和 JSON 校验，且 fixture 权限/大小不可检查或不可解析时会 fail-closed；请求 payload 会写入 `600` 临时文件并通过 `curl --data-binary @file` 发送，避免真实 webhook 内容暴露在进程命令行参数中；响应临时目录显式收紧为 `700`。
- 新增 `scripts/backup-restore-preflight.sh` 与 `make backup-preflight`，在真实发布前检查 `mysqldump/mysql/tar/gzip/checksum` 工具链、数据库连接配置、备份目录私有权限、备份目录不得位于 git worktree 或 workspace 内、备份保留期、加密要求和恢复演练证据文件；备份目录、恢复演练证据权限和恢复演练证据 mtime 都必须可判定，避免备份恢复只停留在人工口头流程或未知权限文件上。
- 新增 `scripts/rollback-preflight.sh` 与 `make rollback-preflight`，在真实回滚前检查不可变回滚目标、安全格式且可匹配 artifact 的备份编号、备份目录私有且不在 git/workspace 内、非空/非 symlink/不过期的回滚计划文件、止损开关和 smoke target；止损开关会在启动期 fail-closed 校验，`SOURCELENS_AGENT_WRITE_PATCH_ENABLED`、`SOURCELENS_AGENT_EXEC_TEST_ENABLED`、`SOURCELENS_AGENT_CREATE_PR_ENABLED` 和 `SOURCELENS_AUTOREPAIR_SUBMIT_PR_ENABLED` 必须未设置或明确关闭，避免回滚期间仍保留 Agent/AutoRepair 写操作或 PR 提交能力；备份目录、回滚计划权限和回滚计划 mtime 都必须可判定，避免回滚到可移动 tag/branch、使用不安全备份目录、复用陈旧计划或没有可恢复数据的状态。
- 新增 `scripts/release-evidence.sh` 与 `make release-evidence`，按发布 run id 生成 `release-evidence/<run-id>/` 证据包，归档 `make verify`、prod/backup/rollback preflight、已配置的备份恢复演练证据和回滚计划副本、可选 smoke、可选 Docker sandbox drill、可选 GitHub App drill、可选 GitHub webhook drill、可选阶段 12 baseline 和可选 LLM provider 安全评估结果；同时保存 git manifest、`git status --short`、`git diff --stat` 和 `worktree-inventory.md`，但不归档完整 diff；worktree inventory 默认 strict，出现 `Other` 未分类路径会把证据标为 required failure；证据目录已从 Git 和 Docker build context 排除，避免验收日志误入库或镜像；include 开关会在写入证据目录前校验 `true`/`false`/`auto` 合法取值，拼写错误不会被静默当成跳过；证据根目录必须是非 symlink、权限可检查可解析的私有目录，run id 必须是短安全标识；强制 smoke 但缺少 `SOURCELENS_BASE_URL` 时会记录 smoke required failure，并且该失败证据包仍要通过 `make verify-release-evidence` / `scripts/verify-release-evidence.sh` 复核；强制 phase12 baseline 但缺少 `DB_USERNAME` / `DB_PASSWORD` 等数据库凭据时会记录 `phase12-baseline` required failure，并且该失败证据包仍要通过 `make verify-release-evidence` / `scripts/verify-release-evidence.sh` 复核；强制 Docker sandbox drill 但 Docker daemon 不可达时会记录 `sandbox-drill` required failure，并且该失败证据包仍要通过 `make verify-release-evidence` / `scripts/verify-release-evidence.sh` 复核；强制 GitHub App drill 但缺少 `GITHUB_APP_ID` 等配置时会记录 `github-app-drill` required failure，并且该失败证据包仍要通过 `make verify-release-evidence` / `scripts/verify-release-evidence.sh` 复核；强制 GitHub webhook drill 但缺少 `SOURCELENS_BASE_URL` 或 `GITHUB_APP_WEBHOOK_SECRET` 时会记录 `github-webhook-drill` required failure，并且该失败证据包仍要通过 `make verify-release-evidence` / `scripts/verify-release-evidence.sh` 复核；调用可选 smoke、phase12 baseline、Docker sandbox drill、GitHub App drill 和 GitHub webhook drill 子脚本时会转发同一个已校验 env 文件，且 smoke token 和 phase12 `DB_PASSWORD` 不再通过命令行 env 参数传递；证据日志命令行会脱敏 password/token/secret/private key 类 env 参数，步骤输出和人工证据副本落盘后也会 scrub 预置敏感 key 与真实 env/进程环境中的 secret-like key。
- 配置了 `SOURCELENS_BACKUP_RESTORE_DRILL_EVIDENCE_FILE` 和 `SOURCELENS_ROLLBACK_PLAN_FILE` 但手工证据源文件缺失或不是普通文件时，release evidence 会记录 `backup-restore-drill-evidence` / `rollback-plan` required failure，并且该失败证据包仍要通过 `make verify-release-evidence` / `scripts/verify-release-evidence.sh` 复核。
- 新增 `PromptInjectionGuard`，统一给 Agent system prompt、RAG 代码切片、AutoRepair 源码/目标描述、CI 日志、PR diff、Issue 文本、Agent 任务扫描产物和工具结果加入 untrusted data 边界，避免代码/日志/diff 中的伪指令覆盖 SourceLens 工具权限、输出 schema 或安全策略。
- 新增 `docs/LLM_SAFETY_EVALS.md`、`docs/llm-safety-evals/prompt-injection-cases.json`、`docs/llm-safety-evals/output-quality-cases.json`、`docs/llm-safety-evals/provider-run-template.json`、`scripts/llm-safety-regression.sh` 与 `make llm-safety-check`，把 Prompt injection 红队样例、LLM 输出质量契约和真实 provider 评估结果格式固化成本地回归资产；`make verify` 已接入该检查。
- `scripts/release-evidence.sh` 支持 `SOURCELENS_RELEASE_EVIDENCE_LLM_PROVIDER_RUN_FILE` 和 `SOURCELENS_RELEASE_EVIDENCE_LLM_RAW_OUTPUT_DIR`，会先拒绝 symlink、空文件、不可读文件、权限不可检查/不可解析和 group/world 可访问 provider run，再用 `scripts/validate-llm-provider-run.mjs` 校验真实 provider run 覆盖 14 个样例、无 secret 字段、不内联 raw output，且 raw output artifact 路径必须位于 `release-evidence/<run-id>/llm-evals/` 下、匹配本次 release run id 并只使用安全路径段；校验通过后会把 provider JSON 复制为私有 `llm-provider-run.json`，再从私有 raw output 源目录复制对应 `llm-evals/` artifact、收紧为 `600` 并执行敏感值 scrub 后写入证据包；强制 LLM provider run 但缺少 `SOURCELENS_RELEASE_EVIDENCE_LLM_PROVIDER_RUN_FILE` 时会记录 `llm-provider-run` required failure，并且该失败证据包仍要通过 `make verify-release-evidence` / `scripts/verify-release-evidence.sh` 复核。
- `scripts/validate-llm-provider-run.mjs` 的 CLI 参数已 fail-closed：未知选项、`--run-id` 缺值和额外位置参数都会失败，避免 release evidence run id 绑定因参数拼写错误被静默跳过。
- release、preflight、smoke、phase12、sandbox 和 GitHub drill 脚本的 env 值规范化已统一为 trim 并循环剥离外层或嵌套成对引号；安全回归会检查 9 个发布验收脚本都保留该逻辑，避免真实 env 文件在不同门禁中解析不一致。
- `production-preflight.sh` 读取真实 env 时会规范化空白、`export KEY=value` 和成对引号，避免 `SOURCELENS_AGENT_CREATE_PR_ENABLED="true"` 这类常见写法绕过 GitHub App readiness 检查；`SOURCELENS_PREFLIGHT_REQUIRE_GITHUB_APP`、`SOURCELENS_AGENT_CREATE_PR_ENABLED` 和 `SOURCELENS_AUTOREPAIR_SUBMIT_PR_ENABLED` 只接受合法布尔值，拼错会 fail-closed，避免真实 GitHub App readiness 验收被静默跳过，或受控 PR 功能开关产生模糊生产配置。
- 发布验收链路的 `*_WARN_ONLY` 模式已统一为启动期布尔校验：`production-preflight.sh`、`backup-restore-preflight.sh`、`rollback-preflight.sh`、`sandbox-drill.sh`、`github-app-drill.sh` 和 `github-webhook-drill.sh` 都会先规范化空白和成对引号，拼错会 fail-closed，避免 release evidence 或真实发布演练被静默切换到错误模式。
- `production-preflight.sh` 已对齐后端生产启动校验，提前检查 `DB_PASSWORD`、`JWT_SECRET`、`ENCRYPT_PASSWORD`、`ENCRYPT_SALT` 和 GitHub App webhook secret 的最小长度与开发默认值；当前本机私有 `deploy/.env` 已轮换 DB/encrypt 默认值并通过 preflight，真实生产仍需走正式 secret 管理和历史加密数据迁移策略。
- `production-preflight.sh`、`backup-restore-preflight.sh` 和 `rollback-preflight.sh` 会检查各自指向的真实 env 文件边界，拒绝 symlink、非普通文件、空文件、不可读文件、权限不可检查/不可解析和 group/world 可读写的私有部署配置；当前本机 `deploy/.env` 已收紧为 `600`。
- `release-evidence.sh` 在写入证据目录前也会独立检查 `SOURCELENS_RELEASE_EVIDENCE_ENV_FILE` / `SOURCELENS_PREFLIGHT_ENV_FILE` 指向的真实 env 文件边界，允许 `deploy/.env.example` 模板和缺失文件走进程环境兜底，但一旦真实 env 文件存在，就必须是非 symlink、普通、非空、可读且不开放 group/world 权限，避免关闭 preflight 后用弱 env 文件收集发布证据。
- `backup-restore-preflight.sh` 已增强恢复演练证据格式：除数据库/workspace/artifact/checksum pass 标记外，还要求 `backup_id` 使用安全 artifact id、在 `SOURCELENS_BACKUP_DIR` 中匹配到 database/workspace/artifacts/checksums 四类备份 artifact，并要求四类 artifact 都是非 symlink 普通文件、非空、可读、权限可检查且可解析，并且不可 group/world 写；checksum manifest 必须覆盖且匹配 database/workspace/artifacts 三类 artifact 的真实 SHA-256，`restore_drill_completed_at` 为不过期的 UTC ISO-8601 时间戳；`rollback-preflight.sh` 也会对回滚 backup id 执行同一套备份集合、文件边界和 checksum 内容校验；backup/rollback preflight 对 `SOURCELENS_BACKUP_DIR`、备份 artifact、恢复演练证据文件、回滚计划文件的权限/mtime 可判定性改为 fail-closed，`stat` 失败或权限不可解析在严格模式下都会失败；`release-evidence.sh` 在归档备份恢复证据和回滚计划前也会独立复查恢复演练完成时间、恢复演练文件 mtime、回滚计划文件 mtime、`SOURCELENS_BACKUP_DIR` 不为 symlink、不在 git worktree 或 `SOURCELENS_WORKSPACE` 内、可读可搜索且不开放 group/world 权限，并做同一套 artifact 语义校验，避免 warn-only preflight 让弱证据进入发布包。
- `release-evidence.sh` 对手工证据源文件的权限检查改为 fail-closed：权限不可检查或不可解析时不再继续归档，避免把权限未知的恢复演练证据或回滚计划复制进发布证据包。
- `release-evidence.sh` 启动时会先设置 `umask 077`，避免中途失败时留下依赖调用者默认 umask 的半成品证据文件；最终 summary 写完后会先把证据包内所有普通文件权限统一收紧为 `600`，再生成私有 `checksums.sha256`；checksum manifest 使用 `sha256sum` 或便携 `shasum -a 256` 覆盖证据包内除 manifest 自身外的所有文件，便于发布记录验证证据包内容未被后改。
- 新增 `scripts/verify-release-evidence.sh` 与 `make verify-release-evidence DIR=release-evidence/<run-id>`，用于发布后复核证据包：先要求 `summary.md`、`status.tsv`、`manifest.txt`、`git-status.txt`、`git-diff-stat.txt` 和 `worktree-inventory.md` 等核心证据存在，拒绝 `git-status.txt` / `git-diff-stat.txt` / `worktree-inventory.md` 控制字符，校验 summary/manifest metadata 一致性与格式、实际 verifier 目录名和 `summary.md` 的 `evidence_dir` 末段都必须匹配 `run_id`、summary marker、`## Steps` 的状态/slug 与 `status.tsv` 一一对应、summary 三项计数与 `status.tsv` 中 `FAIL/WARN/SKIP` 行数一致、status 表头、14 个标准 step slug 各出现一次、`status`/`exit_code` 语义一致、每个标准 step 的 `log_file` 必须匹配固定证据文件名和 status 引用文件，并从核心文件、status 引用文件、成功 LLM provider run 的 `llm-provider-run.json` 及其中声明的 `llm-evals/` raw output artifact 构建 expected file allowlist，再拒绝额外文件、symlink、非 `600` 普通文件、manifest 自包含、manifest 不安全路径或实际包内不安全文件路径，并重新计算所有非 manifest 文件的 SHA-256 与 `checksums.sha256` 比对。
- 安全回归会动态生成轻量 release evidence 包，篡改 `git-status.txt` 后确认 checksum mismatch 能被 `verify-release-evidence` 拒绝，避免 verifier 的完整性比对退化成只检查文件存在。
- 安全回归还会向 `checksums.sha256` 追加不安全路径条目，并确认 `verify-release-evidence` 以 `unsafe checksum path` 拒绝该包，避免 checksum manifest 指向证据目录外或含 dot-segment 的路径。
- 安全回归还会向 `checksums.sha256` 追加重复路径条目，并确认 `verify-release-evidence` 以 `duplicate checksum path` 拒绝该包，避免完整性 manifest 出现同一证据文件的多重声明。
- 安全回归还会把 `checksums.sha256` 权限放宽到 `644`，并确认 `verify-release-evidence` 以 `checksum manifest must have 600 permissions` 拒绝该包，避免完整性根文件自身权限退化。
- 安全回归还会通过 symlink 路径调用 `verify-release-evidence`，并确认它以 `release evidence directory must not be a symlink` 拒绝该输入，避免复核入口被链接到另一份证据目录。
- 安全回归还会在轻量证据包内额外创建带反斜杠的不安全文件名，并确认 `verify-release-evidence` 以 `release evidence file path is unsafe` 拒绝该包，避免真实包内异常路径绕过 manifest 校验。
- 安全回归还会在轻量证据包内额外创建 symlink，并确认 `verify-release-evidence` 以 `release evidence directory must not contain symlinks` 拒绝该包，避免发布证据复核跟随链接读取包外或伪造内容。
- 安全回归还会在轻量证据包内额外创建普通文件，重新生成 checksum manifest 后把该包内文件权限放宽到 `644`，并确认 `verify-release-evidence` 仍以 `must have 600 permissions` 拒绝该包，避免内容完整性正常但私有权限退化的证据被接受。
- 安全回归还会在轻量证据包内创建 `600` 权限额外文件，重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `unexpected file` 拒绝，避免证据包被当作任意文件容器夹带伪证据或敏感内容。
- 安全回归还会在轻量证据包内额外创建空目录，重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `unexpected directory` 拒绝；成功归档 LLM raw output 时也会把 `llm-evals` 目录权限放宽并确认 verifier 拒绝，避免包内目录绕过 expected allowlist 或私有权限校验。
- 安全回归还会把 `llm-provider-run` 伪造成 `OK` 但缺少 `llm-provider-run.json`，重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `regular file` 拒绝，避免真实 provider 安全评估结果只在状态表中被伪造为成功。
- 安全回归还会生成带 14 个 raw output artifact（均位于 `llm-evals/`）的真实形态 provider run 证据包，确认原始包可通过 `verify-release-evidence`，随后删除一个 raw output artifact 并重新生成 checksum manifest，确认 `verify-release-evidence` 仍以 `regular file` 拒绝，避免 `llm-provider-run.json` 声称有原始输出但证据包缺失实物。
- 安全回归还会在 `summary.md` 的 `## Steps` 追加伪造 step，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `summary steps must match status.tsv status, slug, title and detail rows` 拒绝，避免只篡改摘要而不改 `status.tsv` 的验收伪造。
- 安全回归还会只篡改 `summary.md` 中已有 step 的展示详情，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `summary steps must match status.tsv status, slug, title and detail rows` 拒绝，避免摘要显示的通过原因被粉饰而 `status.tsv` 保持不变。
- 安全回归还会向 `summary.md` 的 step 行注入控制字符，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `summary step line contains control characters` 拒绝，避免摘要标题或详情被终端控制字符污染显示。
- 安全回归还会向 `summary.md` 追加额外内容，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `summary file must match the generated layout exactly` 拒绝，避免发布摘要在标准 Summary 之后夹带人工 override 或伪造通过结论。
- 安全回归还会把 `summary.md` 和 `manifest.txt` 的 `env_file` metadata 篡改为含反引号的值，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `summary env_file must not contain control characters or backticks` 拒绝，避免 metadata 破坏 summary 解析或伪造发布环境来源。
- 安全回归还会把 `manifest.txt` 的 `created_at` 篡改为另一个合法 UTC 时间，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `summary created_at must match manifest created_at` 拒绝，避免摘要和 manifest 使用不同时间线伪造发布记录。
- 安全回归还会把 `summary.md` 和 `manifest.txt` 的 `created_at` 同步篡改为 `2026-99-99T99:99:99Z`，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `created_at must be a valid UTC ISO-8601 timestamp` 拒绝，避免格式像时间但无法解析的伪时间线进入发布证据。
- 安全回归还会在 `summary.md` 中复制 `env_file` metadata，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `exactly one non-empty env_file metadata value` 拒绝，避免重复 metadata 伪造发布环境来源。
- 安全回归还会把 `manifest.txt` 的 `llm_provider_run_file` metadata 篡改为含反引号的值，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `llm_provider_run_file must not contain control characters or backticks` 拒绝，避免 LLM provider 路径 metadata 污染发布证据。
- 安全回归还会向 `manifest.txt` 追加额外内容，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `manifest file must match the generated layout exactly` 拒绝，避免发布 manifest 在固定 metadata 之外夹带人工 override 或伪造验收来源。
- 安全回归还会把 `manifest.txt` 中的 `include_smoke` 篡改为 `maybe`，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `include_smoke must be true, false, or auto` 拒绝，避免 manifest include/worktree 模式被改成生成器不会产出的非法值。
- 安全回归还会生成 `include_smoke=true` 的 required failure 包，把 `status.tsv` 和 `summary.md` 里的 smoke 行伪造成 `SKIP` 并重新生成 checksum manifest，确认 `verify-release-evidence` 仍以 `requires smoke status not to be SKIP` 拒绝，避免强制验收步骤被粉饰成未配置跳过。
- 安全回归还会把同一类 `include_smoke=true` required failure 包的 smoke 行伪造成 `WARN`，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `requires smoke status to be OK or FAIL` 拒绝，避免强制验收失败被降级成 optional warning。
- 安全回归还会把 `include_smoke=false` 包里的 smoke `SKIP` detail 从 `SOURCELENS_RELEASE_EVIDENCE_INCLUDE_SMOKE=false` 篡改成 `SOURCELENS_BASE_URL is not configured`，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `requires smoke detail to be` 拒绝，避免显式关闭的验收步骤伪装成环境未配置。
- 安全回归还会把 `git-metadata` 状态伪造成 `SKIP` 并重新生成 checksum manifest，确认 `verify-release-evidence` 仍以 `git-metadata status must be OK` 拒绝；随后还会把 `worktree-inventory` 状态伪造成 `SKIP` 并确认 `verify-release-evidence` 仍以 `worktree-inventory status must not be SKIP` 拒绝，避免核心证据快照被粉饰成跳过。
- 安全回归还会制造 `worktree-inventory.md` 中的非零 `Other` 分组，把 `worktree-inventory` strict failure 伪造成 `OK` 并重新生成 checksum manifest，确认 `verify-release-evidence` 仍以 `strict OK must not contain Other paths` 拒绝，避免未分类工作区路径被粉饰成已完成拆审。
- 安全回归还会保留 `worktree-inventory` strict failure 状态但删除 `worktree-inventory.md` 中的 `Other` 分组和失败标记，重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `strict FAIL must contain Other paths and strict failure marker` 拒绝，避免发布证据只剩失败状态而丢失可审计失败细节。
- 安全回归还会向 `worktree-inventory.md` 注入控制字符，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `worktree inventory must not contain control characters` 拒绝，避免工作区拆审清单污染终端、工单或日志查看器。
- 安全回归还会向 `git-status.txt` 和 `git-diff-stat.txt` 注入控制字符，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍分别以 `git status snapshot must not contain control characters` 和 `git diff stat snapshot must not contain control characters` 拒绝，避免 git 快照污染终端、工单或日志查看器。
- 安全回归还会把 `summary.md` 的 `skipped` 计数篡改为伪值，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `summary skipped must match status.tsv` 拒绝，避免发布摘要计数粉饰真实 step 状态。
- 安全回归还会把 `status.tsv` 中 `OK` step 的 `exit_code` 篡改为非零值，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `OK status must use exit_code 0` 拒绝，避免步骤状态和退出码被拆开伪造。
- `release-evidence` 生成侧会在写入 `status.tsv` 前校验 `status` 与 `exit_code` 语义一致：`OK=0`、`SKIP=-`、`WARN=非零数字`、`FAIL=-或非零数字`，避免坏状态表只靠发布后 verifier 才发现。
- `release-evidence` 生成侧会为 `summary.md` 和 `manifest.txt` 使用同一个 UTC `created_at`，避免同一证据包里核心 metadata 出现跨秒或后改不一致。
- `release-evidence` 生成侧会在写入 summary/manifest 前校验 `env_file` 和 evidence directory metadata 非空且不含控制字符或反引号；即使 env 文件缺失并回退进程环境，也不会用不安全 metadata 创建证据包。
- `release-evidence` 生成侧会在写入 manifest 前规范化可选的 `llm_provider_run_file` 和 `llm_raw_output_dir` metadata，把控制字符折叠为空格并替换反引号；这些字段即使为空也必须保持可安全解析。
- `release-evidence` 生成侧会在写入 summary 前校验 step title 非空且不含控制字符，避免未来新增发布步骤时把异常标题写入验收摘要。
- 安全回归还会把 `status.tsv` 的 `detail` 字段注入控制字符，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `detail contains control characters` 拒绝，避免发布证据在终端、工单或日志查看器中被控制字符污染显示。
- 安全回归还会把 `status.tsv` 的 `detail` 字段注入反引号，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `detail contains backticks` 拒绝，避免发布证据在 Markdown、工单或日志查看器中被伪造 code span 污染显示。
- `release-evidence` 生成侧会在写入 `status.tsv` 前对 `detail` 控制字符和反引号做规范化，把 tab、换行和 ESC 等不可见字符折叠为空格，并把反引号替换为普通引号；安全回归会用带 tab/ESC/反引号的缺失 provider-run 路径确认失败证据包仍可通过 `verify-release-evidence` 复核。
- 安全回归还会把 `status.tsv` 中 `git-metadata` 的 `log_file` 篡改为另一份存在的证据文件，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `git-metadata must reference manifest.txt` 拒绝，避免 step 状态引用错证据文件。
- 安全回归还会复制 `status.tsv` 的标准 step 行制造重复 slug，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `row only once` 拒绝，避免重复/非法 step 结构靠重算 checksum 混入发布证据。
- 安全回归还会在 `status.tsv` 追加未知 step slug，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `unknown step slug` 拒绝，确保发布证据 step allowlist 不会被伪扩展绕过。
- `scripts/security-regression-check.sh` 已新增顺序断言，锁住 release evidence 必须先校验 include 模式、再校验 env 文件边界、再创建证据目录，以及必须先写完 summary、再收紧文件权限、最后生成 checksum manifest，避免后续只保留关键字但打乱语义顺序。
- 认证响应边界已收口：注册和 `/api/auth/me` 返回 `UserResponse` 而不是 `User` 实体，响应中不暴露 `passwordHash`、`deleted` 等内部字段；`User.passwordHash` 同时加 `@JsonIgnore` 作为防御层。注册唯一键兜底已补齐：用户名/邮箱重复或逻辑删除记录仍占用唯一键时返回 `CONFLICT`，不再落到全局 500。
- `SensitiveDataSanitizer` 已补强 JSON/camelCase secret key、带空格的引号 secret 值、Basic/Token 授权头、JWT/privateKey 字段、裸 OpenAI key 和 URL userinfo 密码脱敏，并由 `SensitiveDataSanitizerTest` 与 `scripts/security-regression-check.sh` 锁住。
- 新增 `scripts/verify-all.sh` 与 `make verify`，本地按 CI 门禁顺序运行 Shell 脚本语法检查、`git diff --check` / `git diff --cached --check` 空白错误检查、后端测试、前端构建、Rust analyzer check、Rust analyzer 测试、LLM safety、安全回归检查和依赖回归检查；目录内命令通过 `run_in_dir` 函数切换目录后直接执行，避免把仓库路径插入 `bash -lc` 字符串。
- 新增 `scripts/phase12-baseline.sh`、`make phase12-baseline` 与 `docs/PHASE12_BASELINE.md`，用只读数据库基准采集阶段 12 触发证据，避免在没有规模瓶颈时过早引入 Neo4j、pgvector、Temporal 或 analyzer daemon。
- `scripts/phase12-baseline.sh` 已补齐输入硬化：支持 `SOURCELENS_PHASE12_BASELINE_ENV_FILE` 读取私有 env 文件，并在读取 DB 密码前独立校验真实 env 文件边界；阈值、端口、连接超时和 scan task id 必须为正整数，`DB_URL` 必须是 MySQL JDBC URL，MySQL CLI 带连接超时，递归调用链环检测使用带分隔符路径避免 symbol id 子串误判。脚本新增 `SOURCELENS_PHASE12_MYSQL_EXECUTOR=auto|host|docker`，宿主机没有 mysql CLI 时可自动使用 `sourcelens-mysql` 容器内 mysql client 做只读 baseline，且不通过 `docker exec -e KEY=value` 参数传入数据库密码。
- 新增 `.github/workflows/ci.yml`，PR 和 `main` push 自动运行安全回归检查、依赖回归检查、后端 `mvn clean test`、LLM safety regression、前端 `npm ci && npm run build`、Rust analyzer `cargo check --locked && cargo test --locked`、后端 Docker 镜像构建。
- CI 各 job 已配置 `timeout-minutes`，并由安全回归门禁逐个检查，避免发布验证在依赖下载、构建或 Docker 阶段无限挂起。
- CI workflow 顶层 `permissions` 只允许 `contents: read`，不允许 job-level `permissions` 提权；同 ref 并发取消，并在所有 checkout step 设置 `persist-credentials: false`；安全回归门禁会逐个 `actions/checkout` step 绑定校验 credential persistence 禁用项，并禁止 `pull_request_target` 与 `${{ secrets.* }}` 引用，阻止这些 token 暴露面收口项回退。
- CI workflow 的所有 GitHub Actions `uses:` 引用已固定到 40 位 commit SHA，保留原 tag 注释用于升级追踪；依赖回归和安全回归门禁会阻止退回 `@v4`、`@v2`、`@stable`、`@main` 等可移动引用，并禁止 `uses: docker://...` 这类 Docker image action 绕过 action SHA pinning；安全回归还会用临时 workflow 负例验证该拒绝路径。
- GitHub webhook delivery 审计页的 collation 500 已收口：`GitHubWebhookDeliveryService.listByProject` 改为先查 `github_webhook_delivery_projects.delivery_id`、再按 `IN` 查询 delivery，避免 correlated `EXISTS` 直接比较不同 collation 字段；`V027__normalize_github_webhook_delivery_collation.sql` 统一 `github_webhook_deliveries.delivery_id` 与 `github_webhook_delivery_projects.delivery_id` 为 `utf8mb4_unicode_ci`。验证：`mvn -q -Dtest=GitHubWebhookDeliveryServiceTest,GitHubWebhookDeliveryControllerTest test` 通过；本地 Docker MySQL 中 Flyway schema version 为 `027` 且两张表 `delivery_id` collation 均为 `utf8mb4_unicode_ci`；本地 8080 已重启为最新 jar，请求 `/api/projects/4/github-webhook-deliveries?page=1&pageSize=20` 返回 `SUCCESS`。
- 审计日志页错误体验已从全局 toast 轰炸改为源级健康状态：通用审计、Agent 工具调用和 GitHub Webhook 三个数据源分别维护 loading/error/ready 状态，失败时在源卡片和对应 tab 内展示可重试错误条，并保留上次成功数据；治理信号会把任一审计源不可用视为 `danger`，避免空数据时误判为健康。验证：`npm run build` 通过，`git diff --check` 通过；浏览器桌面宽度和 `390x844` 移动宽度均确认 3 个 `.sl-audit-source-card` 渲染、无全局错误 toast、无水平溢出。
- 项目详情页新增 Analysis Readiness 面板，把最新扫描、核心产物、`reportQuality`、下一步动作、产物库、代码问答、依赖图谱和扫描详情入口汇聚到项目第一屏之后；同时清理无成功扫描、缺少概览产物或加载失败时的旧 overview/fileTree/reportQuality 状态，避免切换项目后显示过期分析数据。验证：`npm run build` 通过，`git diff --check` 通过；浏览器桌面宽度和 `390x844` 移动宽度均确认 `.sl-analysis-readiness` 存在、无错误 toast、无水平溢出。
- 扫描详情页新增 Code Knowledge readiness 面板，连接 `code_chunks/search` 的 `retrievalMode` 与 `evidenceProfile`，把“是否可问答、是否有切片、向量覆盖是否足够、下一步该查什么”前置到扫描报告页；code_chunks 缺失时显示危险态和 `检查 chunk_code` 行动。验证：`npm run build`、`mvn -DskipTests compile`、`mvn -DskipTests package` 通过；本地 8080 API 验证 scanTaskId `24` 返回 `retrievalMode=NO_CONTEXT`、`evidenceReadiness=GAP`；浏览器 smoke 用临时用户/项目/scanTaskId `41` 验证 `.sl-code-knowledge-panel-danger` 渲染、无全局错误 toast，临时数据已清理。
- 项目页 code_chunks 状态闭环已补齐：`ProjectDetail` 对最新成功扫描预加载 code_chunks 探针，顶部 `code_chunks` 阶段显示真实切片数和向量覆盖，Analysis Readiness 将 code_chunks 缺失纳入项目就绪度，QA 页在用户搜索前也显示切片总量、向量覆盖、召回模式和证据质量；`报告/Agent` 阶段改为由 Analysis Readiness 判定，不再只要扫描成功就显示 Ready。验证：`npm run build` 通过；浏览器 smoke 用临时 projectId `31` / scanTaskId `42` / 3 条 code_chunks 验证顶部显示 `code_chunks 3 / 向量 33%`、`报告/Agent Review`、QA 初始健康卡显示 `代码切片 3`、搜索 `login` 命中 2 条结果且无全局错误 toast；临时数据已清理。
- 运行产物库错误体验已补齐：`Artifacts` 不再用全局 toast 承载列表加载失败和智能预览失败，改为 `loadError` / `previewError` 页面内状态；列表失败时 Evidence Readiness 会进入 `danger`，并在有旧数据时明确“已保留上次成功数据”；预览失败只在 drawer 内展示可重试错误条。验证：`npm run build` 通过；浏览器 smoke 用临时 projectId `34` / 4 条核心 artifact 验证 `.sl-artifact-readiness-ready`、4 个表格行、无全局 toast；故意触发不存在文件预览时 drawer 内出现“智能预览加载失败”，全局 toast 仍为 0；临时用户、项目、artifact 和审计数据已清理。
- 扫描报告到 Agent 任务列表的证据源一致性已收口：`/api/projects/{projectId}/agent-tasks` 支持 `scanTaskId` 过滤，前端 `/agent-tasks?projectId=...&scanTaskId=...` 会真正只展示该扫描任务绑定的 Agent 任务；任务列表新增扫描列，详情面板可回跳扫描报告，创建任务时在扫描上下文内默认带入 `scanTaskId`。验证：`mvn -q -Dtest=AgentTaskServiceTest,AgentTaskControllerTest test`、`mvn -q -DskipTests package`、`npm run build`、`git diff --check` 均通过；本地 8080 runtime smoke 用临时项目和两个成功 scanTask 验证未过滤返回 2 个 Agent 任务，`scanTaskId=<target>` 只返回目标扫描任务的 1 个任务，临时数据已清理。
- 备份/回滚 artifact backup id 匹配已收紧：`backup_artifact_path_for_kind` 和 `backup_artifact_any_found` 在 `scripts/backup-restore-preflight.sh`、`scripts/rollback-preflight.sh`、`scripts/release-evidence.sh` 中统一使用 `"$backup_id[-_.]*"`，不再用 `*$backup_id*` 子串匹配；`scripts/security-regression-check.sh` 已禁止退回宽匹配。验证：`bash -n` 覆盖 4 个脚本；临时备份目录负向验证只有 `backup10-*` 时 `backup_id=backup1` 在 backup/rollback preflight 中均报告未找到匹配 artifact；正向验证 `<backup_id>-database/workspace/artifacts/checksums` 识别 4 类 artifact，3 个 checksum 均比对通过。
- 新增可执行备份恢复演练入口：`scripts/backup-restore-drill.sh` 与 `make backup-restore-drill` 会读取 `SOURCELENS_BACKUP_DRILL_BACKUP_ID`，校验 database/workspace/artifacts/checksums 四类 artifact 与 checksum manifest，把数据库 dump 恢复到 Docker MySQL scratch database，把 workspace/artifacts tarball 解压到私有临时目录，并写出 backup preflight / release evidence 可复核的 `restore_drill_status=pass` 证据。脚本拒绝 `CREATE DATABASE`、`DROP DATABASE`、`USE` 和 mysql client escape，拒绝 tar 绝对路径、`..`、反斜杠和控制字符路径，并在成功或失败时清理 scratch database。验证：正向临时备份恢复得到 `database_tables=1`、`workspace_entries=2`、`artifact_entries=2`，scratch database 无残留；负向 `USE sourcelens` dump 被拒绝；负向 `backup_id=backup1` 不匹配 `backup10-*`；`backup-restore-preflight.sh` 能识别 drill 生成的 evidence backup id。
- 关键指标：
  - `sourcelens.execution.tasks`：按 `task_type`、`status` 统计任务状态流转。
  - `sourcelens.execution.steps`：按 `step_key`、`status` 统计步骤终态。
  - `sourcelens.agent.tool.calls`：按 `tool`、`permission`、`outcome` 统计工具调用结果。
  - `sourcelens.agent.tool.duration`：按 `tool`、`permission`、`outcome` 记录工具调用耗时。
  - `sourcelens.sandbox.commands`：按 `executor`、`outcome` 统计沙箱命令结果。
  - `sourcelens.sandbox.command.duration`：按 `executor`、`outcome` 记录沙箱命令耗时。

仍需收口：

- 最新 `make worktree-inventory` 已生成当前大规模 worktree 清单；清单工具已把 LLM safety 测试、Agent tool call migration 和 scanstat 模块测试归入对应模块，并支持通过 `make worktree-inventory GROUP=<分组名或 slug>` 输出单个分组，后续仍需按构建产物、运维/CI、安全、任务、分析、Agent、前端、沙箱、GitHub App 等边界分组审查或提交。
- 本机真实 Docker/MySQL/Redis 环境已完成阶段性验收：Docker backend 在 `http://localhost:8081` 通过 smoke，`prod-preflight` 为 0 failure / 1 warning，`sandbox-drill` 严格通过，`make verify` 通过；唯一剩余 warning 是 GitHub App readiness 按高级集成层暂缓。
- 已用公开仓库 `LJunP/Pawnshop-Management-System.git` 完成真实扫描链路，scanTaskId `28` 成功，产出 15727 symbols、440 relations、7 artifacts；`code_chunks=0` 根因已定位为扫描流水线未触发 `CodeChunkService.chunkAndSave`，本轮已新增 `chunk_code` 执行步骤并补回归测试。
- 重建 Docker backend 后重新扫描同一公开仓库，scanTaskId `29` 成功，commit `3eaf38582997afa5acff8990f48ce9c5f200e3ea`，产出 15727 symbols、440 relations、7 artifacts、17001 chunks；执行步骤 `prepare_repository`、`analyze_code`、`chunk_code`、`finalize_scan` 均为 SUCCESS。embedding 为 0 是因为本地没有激活 LLM 配置，符合当前验收预期。
- Phase12 baseline 已支持 Docker MySQL 容器执行；用 scanTaskId `29` 生成真实基线：15727 symbols、440 relations、16167 graph records，调用链查询 118ms，max execution attempts 为 1，verdict 为 phase 12 trigger is not proven，继续当前 MySQL/artifact/simple-queue 架构并做生产化收口。
- GitHub App 仓库端到端演练、`make github-app-drill` 和 `make github-webhook-drill` 仍缺真实 GitHub App ID、installation id、private key 和 webhook secret；当前只能做缺配置 required failure / skip / 本地签名路径验证。
- GitHub App 不是当前公开仓库逆向分析主线的阻塞项；仅当进入私有仓库、webhook 增量扫描、自动 PR 或企业安装阶段时，再升级为必须完成的端到端验收。
- 已生成正式 release evidence：`release-evidence/public-scan-29-cleanup-20260626145817`，并通过 `scripts/verify-release-evidence.sh` 复核；证据包包含 `make verify`、prod/backup/rollback preflight、smoke、Phase12 baseline 和 sandbox drill，0 required failure、0 optional warning、5 skipped；prod-preflight 内部结果为 0 failure / 1 warning，cleanup 四项均已启用。
- 真实发布前用真实备份运行 `make backup-restore-drill` 生成标准恢复演练 evidence，补充真实回滚计划和回滚演练后，再运行 `make release-evidence` 保存下一轮证据目录。
- 后续进入阶段 12 前仍需在更大真实或准真实规模项目上重复运行 `make phase12-baseline`，把输出作为阶段 12 ADR 的前置证据。
