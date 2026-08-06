# SourceLens 安全边界

> AIOS v2.3 状态：`SUPPORTING SECURITY POLICY`。本文中的“已落地”只代表继承实现范围，不等于 AIOS Trust Gate；当前阻断项和证据等级以 `aios/truth/project_state.yaml` 为准。

状态：继承安全实现参考；部分治理限制尚未技术强制，不构成AIOS Trust Gate通过证明。

## 1. 安全目标

SourceLens 会处理用户源码、仓库访问凭据、模型 API Key、构建日志、Agent 工具调用和自动生成的代码改动。这些资产必须默认被视为敏感数据。

安全目标：

- 用户授权之外的仓库不可访问。
- 用户密钥不可被前端、日志、模型上下文或任务输出泄露。
- Agent 默认只读。
- 自动修复默认只生成 patch，不直接覆盖代码或推送远端。
- 受控 PR 默认关闭，开启后只能使用 GitHub App installation token。
- 所有工具调用必须可审计、可回放、可追责。
- 所有长任务必须可取消、可恢复、可定位失败步骤。
- 执行任务和步骤的终态必须不可逆：`SUCCESS`、`FAILED`、`CANCELLED` 不能被异步迟到事件覆盖回 `RUNNING` 或其他终态。
- 执行任务取消时，所有非终态步骤必须同步进入 `CANCELLED`，避免任务状态和步骤时间线不一致。
- 扫描、Agent、自动修复等异步长流程必须在关键步骤前后检查取消状态，取消后不得继续写回成功或失败结果。
- 手动完成、取消等管理入口也必须拒绝覆盖已完成、已失败或已取消任务。
- AutoRepair 受控 PR 等外部副作用流程在远端调用返回后仍必须复查本地取消状态，避免取消任务被重新标记为 PR 创建成功或待提交。
- 统一执行任务必须以业务来源作为幂等键，服务层和数据库层都要防止重复来源任务并发创建出多条执行记录。
- 扫描任务必须持有仓库级活跃锁，数据库唯一键负责兜底防并发重复扫描；任务进入成功、失败或取消终态时必须释放该锁。
- AutoRepair 必须持有仓库文件级活跃锁，数据库唯一键负责兜底防并发补丁生成和并发受控 PR 创建；补丁就绪、PR 创建成功、失败或取消后必须释放该锁。
- Agent 任务启动必须使用条件状态更新，防止同一个 `PENDING` 任务被多个并发请求重复推进为 `RUNNING` 并重复触发分析。
- CI 诊断、PR 审查和 Issue 拆解等轻量异步分析入口必须使用条件状态更新，防止重复触发导致重复结果、重复评论或重复拆解子任务。
- 重新分析入口必须由 service 层统一重排队，进行中的分析不得被 Controller 直接改回 `PENDING`。
- CI 诊断、PR 审查和 Issue 拆解首次分析必须同步统一执行任务与步骤状态；同一业务来源的重新分析必须创建新的 `execution_attempts` 记录，步骤必须绑定 `attempt_id`，避免旧执行结果覆盖当前执行时间线。
- 只有当前 attempt 允许同步父级 execution task 的最新状态；旧 attempt 的迟到成功、失败或取消事件不得覆盖当前 attempt 对应的父任务状态。
- 执行任务生命周期日志必须写入 `execution_logs` append-only 表，记录创建 attempt、开始步骤、完成步骤、失败和取消等审计事件；业务流程不得通过反复覆盖同一字段作为唯一排障依据。
- PR 审查重新分析必须替换旧评论后再写入新评论，避免 stale review comment 被误认为本次分析结果；评论写入失败必须同步标记业务 review 和统一执行任务失败。
- Issue 拆解必须替换旧子任务后再写入本次子任务，子任务写入失败必须同步标记业务 decomposition 和统一执行任务失败。

## 2. 数据边界

敏感数据包括：

- GitHub PAT、GitHub App installation token。
- LLM API Key。
- JWT signing secret。
- Token encryption password 和 salt。
- 用户仓库源码。
- `.env`、密钥文件、CI secret、构建日志中可能出现的 secret。
- Agent tool arguments 和 tool result 中可能携带的敏感片段。

规则：

- API 响应不得返回明文 token 或 API key。
- 日志不得打印 token、API key、带 token 的 Git remote URL。
- GitHub App installation token 只在 clone、push、create PR 时短期换取和使用，不写入 DB。
- GitHub App webhook secret 只能来自环境变量或安全配置，不得返回给前端。
- 发送给 LLM 的上下文必须可解释、可审计，并尽量最小化。
- 发送给 LLM 的仓库代码、diff、CI 日志、Issue 文本、PR 文本、tool result、扫描产物和项目上下文都必须标记为 untrusted data；其中出现的“忽略上文”“泄露密钥”“调用工具”等文本只作为证据，不得覆盖 SourceLens 系统指令、工具权限、输出 schema 或安全策略。
- CI 日志、PR diff、Issue 描述等用户输入的大块文本在保存和发送给 LLM 前必须统一脱敏与限长。
- artifact 文件必须按 project/user 边界隔离。
- 执行任务日志属于项目数据，查询前必须经过项目所有权校验；日志只保存状态摘要、步骤摘要和错误摘要，不应写入 token、源码正文、完整 diff 或大块构建输出。
- Agent 工具返回给模型或前端前必须经过统一敏感信息脱敏和长度截断；审计入库不得是唯一保护层。
- Browser/Vite/webpack source URL 只能作为不可信字符串解析，用于提取安全相对源码路径、文件名、行号和列号；任何 smoke、release marker、日志和审计证据都不得归档 raw URL、query/hash、完整 stack trace、host/origin、token 或 request path，也不得对该 source URL 执行 `curl`、`urlopen`、浏览器导航或任何外部网络访问，避免 query 泄漏和 SSRF 语义扩张。

## 3. 执行边界

当前重构前的危险能力：

- `ShellExecTool` 可在项目目录内执行 shell。
- 自动修复可运行构建和测试命令。
- 自动修复可 push 分支和创建 PR。
- `file://` 仓库可能指向任意本地目录。

目标规则：

- Agent 默认不能执行 shell。
- Agent 默认不能写文件。
- 构建、测试、自动修复最终必须在容器沙箱中执行。
- 本地 `file://` 仓库默认禁用，仅 dev profile 显式开启。
- 仓库 URL 在保存和实际 Git clone/pull 前共用同一套解析策略：GitHub 仓库只允许 `https://github.com/{owner}/{repo}.git` 形式，拒绝 user-info、query、fragment、非 HTTPS 和非 github.com host；GitHub owner/repo 组件必须先按安全字符集和 dot-segment 边界校验，再进入 GitHub API path；本地 `file://` 会规范化为绝对 URI。
- 仓库默认分支和扫描分支必须通过分支名白名单校验，禁止 `..`、`@{}`、反斜杠、双斜杠、首尾斜杠和 shell 风格特殊字符进入 Git 操作。
- 匿名 GitHub 公开仓库 clone 使用固定参数系统 `git` CLI：`git -c http.version=HTTP/1.1 -c credential.helper= -c core.askPass=/bin/false clone --depth 1 --single-branch --branch <branch> <url> <target>`，并只允许经过 URL/branch policy 的值进入 `ProcessBuilder(List<String>)` 参数数组；不得使用 shell 字符串拼接。该路径仅用于公开仓库稳定性，不作为私有仓库认证路径。
- 匿名 native git clone 必须隔离 ambient credentials/global config：`GIT_TERMINAL_PROMPT=0`、`GIT_ASKPASS=/bin/false`、`SSH_ASKPASS=/bin/false`、`GCM_INTERACTIVE=Never`、`GIT_CONFIG_NOSYSTEM=1`，并为每次 clone 使用隔离 `HOME`、`GIT_CONFIG_GLOBAL` 和 `XDG_CONFIG_HOME`，避免读取宿主机或容器用户的全局 credential helper、Git Credential Manager、filter driver 或配置。
- git/JGit clone 错误外传前必须经过统一敏感信息脱敏与限长，避免 token、带凭据 URL、Authorization header 或私钥片段进入 API 错误、扫描任务错误、执行步骤或审计摘要。
- 自动修复默认只生成 patch。
- PR 创建必须经过用户确认。
- PR 创建必须走显式开关 `SOURCELENS_AUTOREPAIR_SUBMIT_PR_ENABLED=true`。
- PR 创建只允许 `provider=GITHUB` 且 `authType=GITHUB_APP` 的仓库。
- PR 创建、GitHub App drill 和其他 `/repos/{owner}/{repo}` 调用不得直接拼接未校验的仓库元数据；必须拒绝空组件、额外路径分隔符、`.`/`..`、连续 `..` 和 `.git` 后缀等路径歧义输入。
- 受控 PR 创建前必须二次校验 patch：大小受限、目标文件可识别、只能修改当前 AutoRepair 目标文件，且不得触碰密钥、证书、环境变量等敏感路径。
- PAT 不允许用于受控 PR，生产路径应逐步禁止 PAT，仅保留开发 fallback。

## 4. 工具权限等级

计划中的工具权限等级：

- `READ_ONLY`：读取目录、读取文件、搜索代码、查询符号。
- `WRITE_PATCH`：生成 patch artifact，不直接写原仓库。
- `EXEC_TEST`：在沙箱中执行构建或测试。
- `CREATE_PR`：在用户确认后创建分支和 PR。

默认策略：

- 新项目默认仅开启 `READ_ONLY`。
- `WRITE_PATCH` 需要用户显式授权。
- `EXEC_TEST` 需要容器沙箱可用。
- `CREATE_PR` 需要 GitHub App 或短期凭据，并要求用户确认。
- Agent 工具的 `offset`、`limit`、`max_results`、`timeout` 等边界参数必须统一做类型校验与上下限夹取，禁止用户或模型输出直接进入 SQL `LIMIT`、文件读取范围、结果集切片或沙箱执行超时。
- local/docker 沙箱执行器必须在入口统一校验 command、workingDirectory 和正数 timeout，作为工具层参数规范化之外的最终防线。
- Docker 沙箱必须默认关闭网络、使用非 root 用户、限制 CPU/内存/pid、drop capabilities、启用 `no-new-privileges`、只读 root filesystem，并只挂载项目 workspace 与受限 `/tmp`。
- Docker 沙箱执行镜像必须固定到 `tag@sha256:digest`，生产启动校验和 preflight 均不得接受可移动裸 tag。
- 生产、备份和回滚 preflight 必须检查真实部署 env 文件是非空、可读、非 symlink 的私有普通文件；生产 preflight 还必须检查渲染后的 Docker Compose backend/mysql/redis 服务块，确保 prod profile、docker sandbox、禁用 PAT、禁用本地文件仓库、workspace volume、healthy depends_on 和外部服务 digest-pinned image 没有被实际发布配置绕开。
- 生产备份必须加密，备份目录必须位于 git worktree 和 `SOURCELENS_WORKSPACE` 之外，权限必须可检查且可解析，并且不得授予 group/world 访问权限；发布前必须运行 backup preflight，并用 `SOURCELENS_BACKUP_RESTORE_DRILL_EVIDENCE_FILE` 提供不过期、权限和 mtime 可检查、不可 group/world 写且覆盖数据库、workspace、artifact 和 checksum 的恢复演练证据。恢复证据必须包含安全格式的 `backup_id`、可匹配的 database/workspace/artifacts/checksums 四类备份 artifact、通过非 symlink/普通文件/非空/可读/权限可检查且可解析/不可 group-world 写边界的 artifact 文件、可验证 database/workspace/artifacts 真实 SHA-256 的 checksum manifest 和 UTC `restore_drill_completed_at`，避免用无法追溯或不完整的手写 pass 文件冒充演练。`scripts/backup-restore-drill.sh` 和 `make backup-restore-drill` 是标准本地恢复演练入口：数据库 dump 只能恢复到 Docker MySQL scratch database，scratch database 名必须由完整 `backup_id` 的短 SHA-256 派生并保持在 MySQL 64 字符 identifier 上限内，不得把完整长 `backup_id` 直接拼入 MySQL identifier；成功后必须删除 scratch database；dump 不得包含 `CREATE DATABASE`、`DROP DATABASE`、`USE` 或 mysql client escape；workspace/artifacts tarball 只能解压到私有临时目录，并必须拒绝绝对路径、`..`、反斜杠和控制字符路径。备份 artifact 文件名必须以 `backup_id` 加 `-`、`_` 或 `.` 分隔符开头，禁止用任意子串匹配 backup id，避免 `backup1` 误匹配 `backup10-*`。
- 回滚目标必须是不可变引用，只允许 40 位 Git commit SHA 或 `image@sha256:digest`；回滚前必须证明存在匹配备份、非 symlink 且不过期的计划文件和 smoke target。

## 5. 生产配置红线

生产环境禁止：

- 使用默认 `JWT_SECRET`。
- 使用默认 `ENCRYPT_PASSWORD` 或 `ENCRYPT_SALT`。
- 开放 `/api/mock-llm/**`。
- 开放 `/api/dev/projects/{projectId}/audit-workbench-smoke-seed`、`/api/dev/projects/{projectId}/scan-governance-smoke-seed` 等 dev/test-only smoke seed 入口。
- 对公网开放 Swagger/OpenAPI。
- 在非 `dev`/`test` profile 中开放 Swagger/OpenAPI 或 Mock LLM；`staging`、`qa`、无 active profile 等环境不得被“非 prod”逻辑自动放行。
- 返回明文 LLM API Key。
- 允许非 Mock LLM 配置使用非 HTTPS、localhost、内网 IP、链路本地地址、metadata host，或带 user-info/query/fragment 的 Base URL。
- 将 GitHub token 写入 remote URL。
- 在宿主机直接执行用户仓库中的脚本。
- 未校验 `X-Hub-Signature-256` 就处理 GitHub webhook。
- 使用长效 PAT 执行生产 clone/push/create PR。
- 默认开启 AutoRepair 创建 PR。
- 未规范化仓库 URL 或未校验分支名就执行 Git clone/pull/push。
- 认证接口直接返回 `User` 实体或暴露 `passwordHash`、`deleted` 等内部字段。

## 6. 审计边界

必须审计：

- 用户登录和退出。
- 仓库新增、删除、token 更新。
- 扫描任务创建、取消、失败。
- Agent 每次工具调用。
- 自动修复 patch 生成、测试、确认、PR 创建。
- GitHub App installation 绑定、禁用、webhook 同步。
- GitHub App webhook delivery id、event、签名校验结果。
- 受控 PR 分支名、PR URL、状态变化和失败原因。
- 项目删除和数据清理。
- 请求链路 request id。

审计记录至少包含：

- user id。
- project id。
- resource type 和 resource id。
- action。
- status。
- sanitized input。
- sanitized output summary。
- duration。
- request id 或 trace id。

当前已落地：

- Agent 工具调用写入 `agent_tool_calls`。
- Agent 工具调用可通过 `/api/projects/{projectId}/agent-tool-calls` 按项目分页查询，查询前必须校验项目所有权，支持按 toolName 和 success 筛选。
- 项目级审计日志通过 `/api/projects/{projectId}/audit-logs` 分页查询，查询前必须校验项目所有权，支持按 resourceType、action、status 筛选。
- Artifact raw download 通过 `/api/projects/{projectId}/artifacts/{artifactId}/download` 返回原始产物前必须要求显式 `rawDownloadAcknowledged=true`；服务端会写入 `ARTIFACT_RAW_DOWNLOAD` 审计 receipt，记录 artifact id、type、owner、repository、contentType、size、checksum、fileName、`downloadKind=RAW_BLOB` 和 acknowledgement 状态；审计不得记录 raw blob、源码正文、完整 diff、preview text、`storagePath` 或本地绝对路径。Artifacts 页面可以用低敏字段 `projectId/resourceType=ARTIFACT/resourceId/action=ARTIFACT_RAW_DOWNLOAD/status=SUCCESS` 深链到 AuditLogs 复核该行为；raw download 成功响应允许暴露 `X-SourceLens-Audit-Log-Id`，前端允许把正整数 `auditLogId` 追加到 AuditLogs query 作为精确定位符。审计写入失败时 `auditLogId` 可能缺失，此时前端只能展示资源、动作和状态级 fallback 审计定位入口，不得显示 `receipt #...` 或宣称已精确记录 receipt id。`X-SourceLens-Audit-Log-Id` / `auditLogId` 不是授权凭据，不得替代项目所有权校验；header/query 不得携带 raw blob、源码正文、完整 diff、preview text、`storagePath`、本地绝对路径、filename、checksum、contentType、size、owner 或 repository。该 receipt、receipt id 和 deep link 只证明下载行为可追踪，不证明下载内容已脱敏、已扫描或安全。
- Artifact storage workspace 和 `artifacts` root 必须视为服务私有目录：不得由非服务用户写入，不得开放 group/world write，不得把 `artifacts` root、owner/type 父目录或 artifact 文件实现为 symlink。写入侧必须在创建缺失 workspace base 后对 workspace base、artifact root 和父目录逐级执行 no-follow 目录校验，目标文件 symlink 必须拒绝，普通文件 overwrite 允许保留；读取/预览侧必须继续拒绝 symlink artifact 并使用 no-follow 读取。`prod` profile 启动时必须 fail-closed 校验 `sourcelens.workspace.base-path` 已存在、非 symlink、是权限可检查的私有目录且不可 group/world writable；若 `${workspace}/artifacts` 已存在，也必须同样校验。当前 Java 实现通过生产私有目录门禁、no-follow 校验和 no-follow open 收敛写入/读取逃逸风险，但不声明完整 `SecureDirectoryStream` 级 TOCTOU 闭环；如果未来 artifact root 可被非服务用户写入，必须升级为目录句柄级写入、隔离挂载或更强 storage sandbox。
- 用户登录成功、登录失败和退出写入 `audit_logs`，登录失败只记录用户名和失败摘要，不记录密码。
- 扫描任务创建、取消和失败写入 `audit_logs`，只记录仓库 id、分支、步骤和错误摘要，不记录仓库凭据或扫描原始内容。
- AutoRepair patch 生成、取消、失败、受控 PR 排队、PR 创建成功和 PR 创建失败写入 `audit_logs`，只记录文件路径、artifact path、diff 长度、分支、PR URL、步骤和错误摘要，不记录 diff 正文、源码、prompt 或 token。
- 项目删除级联成功后写入 `audit_logs`，记录 user、project、resource、action、status、duration 和摘要。
- 仓库新增、删除、PAT 凭据更新写入 `audit_logs`，审计输入只记录 URL、branch、provider、authType 和 tokenProvided，不记录 token 明文。
- GitHub App installation 手动绑定、手动禁用、webhook 同步和 webhook 禁用写入 `audit_logs`，记录 installation/repository 元数据，不记录 access token。
- GitHub webhook delivery 写入 `github_webhook_deliveries`，并通过 `github_webhook_delivery_projects` 建立 delivery 到 project/repository 的映射；项目拥有者可通过 `/api/projects/{projectId}/github-webhook-deliveries` 查询与本项目相关的 delivery。
- `audit_logs` 与 `agent_tool_calls` 支持按保留期批量清理，默认关闭；生产环境应按审计、合规和成本要求配置 `SOURCELENS_AUDIT_CLEANUP_ENABLED`、`SOURCELENS_AUDIT_RETENTION_DAYS` 和 `SOURCELENS_AUDIT_CLEANUP_BATCH_SIZE`，`prod-preflight` 会对关闭状态给出 warning 并校验 retention/batch 数值。
- `execution_logs` 支持按保留期批量清理，默认关闭；生产环境应按排障窗口和数据库容量配置 `SOURCELENS_EXECUTION_LOG_CLEANUP_ENABLED`、`SOURCELENS_EXECUTION_LOG_RETENTION_DAYS` 和 `SOURCELENS_EXECUTION_LOG_CLEANUP_BATCH_SIZE`，`prod-preflight` 会对关闭状态给出 warning 并校验 retention/batch 数值。
- artifact 与 workspace sandbox 清理同样由 `prod-preflight` 检查开启状态和 retention/batch 数值，避免文件 artifact、临时修复 workspace 和沙箱目录无限增长。
- `RequestIdFilter` 统一接收或生成 `X-Request-Id`，写入响应头和 MDC；审计日志未显式传 requestId 时会从 MDC 填充，便于把前端报错、服务端日志和审计记录串联起来。
- `SensitiveDataSanitizer` 统一处理通用审计日志、执行任务 step/log、Agent 任务/步骤输出、CI/PR/Issue 分析输入输出、Agent 工具审计和 Agent 可见工具结果中的 GitHub token、OpenAI key、Bearer/Basic/Token 授权头、JSON/camelCase/env/key-value 风格 secret、password、JWT/privateKey 字段、URL userinfo 密码和私钥块，并在 `ToolResult`、Agent 输出、分析结果和执行日志层限制返回长度。
- `SourceLensMetrics` 统一输出不含源码、prompt、token、用户输入正文的业务指标，只使用 `task_type`、`status`、`step_key`、`tool`、`permission`、`executor`、`outcome` 等低敏标签；Actuator 默认只暴露 `health/info/metrics`，其中 `/actuator/health` 和 `/actuator/info` 可公开用于探活，`/actuator/metrics` 仍需认证且不应直接暴露公网。
- release、preflight、smoke、phase12、sandbox 和 GitHub drill 脚本读取真实 env 值时必须统一 trim 并循环剥离外层或嵌套成对引号；不得让同一个真实 env 文件在不同发布门禁中解析出不同的 base URL、secret、开关或阈值。
- `scripts/smoke-test.sh` 和 `make smoke` 是部署后最小验收入口；读取真实 env 文件中的 `SOURCELENS_SMOKE_TOKEN` 前必须独立校验该文件非 symlink、普通非空、可读且不得开放 group/world 权限，缺失文件只能回退到进程环境；即使未提供 token 也会确认 `/actuator/metrics` 未认证访问返回 `401/403`，提供 token 后才检查受保护 metrics 的具体 meter。smoke 和 preflight 的 HTTP 检查必须带 connect timeout 与 max time，避免发布验收被异常网络连接无限挂起。
- `scripts/worktree-inventory.sh` 和 `make worktree-inventory` 是发布证据与拆审前的工作区清单入口；临时分组目录必须显式收紧为 `700`，避免工作区路径清单依赖系统默认 umask。
- `scripts/phase12-baseline.sh` 和 `make phase12-baseline` 是阶段 12 触发证据采集入口；读取真实 env 文件中的数据库连接和密码前必须独立校验该文件非 symlink、普通非空、可读且不得开放 group/world 权限，缺失文件只能回退到进程环境；MySQL CLI 必须带连接超时，阈值、端口、连接超时和 scan task id 必须为正整数，`DB_URL` 必须是 MySQL JDBC URL。宿主机没有 mysql CLI 时可以使用 Docker MySQL 容器内的 mysql client 做只读 baseline，容器名必须是安全 Docker container name，数据库密码不得通过 `docker exec -e KEY=value` 命令行参数传入。
- `scripts/sandbox-drill.sh` 和 `make sandbox-drill` 是 Docker sandbox 真实隔离演练入口；读取真实 env 文件中的 sandbox 覆写配置前必须独立校验该文件非 symlink、普通非空、可读且不得开放 group/world 权限，缺失文件只能回退到进程环境；必须验证 digest-pinned 镜像、no-network、非 root、cap drop、no-new-privileges、read-only root、`/tmp` noexec/nosuid、pid/memory cgroup、workspace 写入、Maven/npm/Gradle cache 写入兼容性和 memory-swap 上限；挂载到容器的临时 workspace 必须先显式收紧为 `700`。Docker sandbox 运行用户命令时必须清空镜像默认 entrypoint，drill 的 runtime script 必须显式指定 shell entrypoint，避免带入口的镜像把待执行命令改写为入口子命令。
- `scripts/github-app-drill.sh` 和 `make github-app-drill` 是 GitHub App 只读端到端演练入口；必须验证 App JWT、installation access token、仓库读取权限、GitHub API 出口 allowlist、private key PEM 形状、webhook secret 最小长度和 webhook HMAC；读取真实 env 文件前必须独立校验该文件非 symlink、普通非空、可读且不得开放 group/world 权限，缺失文件只能回退到进程环境；临时私钥目录必须显式收紧为 `700`，私钥文件必须收紧为 `600`，且不得执行 push、创建分支或创建 PR。
- `scripts/github-webhook-drill.sh` 和 `make github-webhook-drill` 是 GitHub webhook 真实入口演练；必须向 `/api/webhooks/github/app` 发送 HMAC SHA-256 签名请求，验证同一 `X-GitHub-Delivery` 重放返回 `duplicate=true`，并确认缺 delivery id 返回 `400`、错误签名返回 `401`。读取真实 env 文件中的 webhook secret 前必须独立校验该文件非 symlink、普通非空、可读且不得开放 group/world 权限，缺失文件只能回退到进程环境；演练用 event 和 delivery id header 值必须先做字符集和长度校验，自定义 payload fixture 必须是有效 JSON、非空、非 symlink、不可 group/world 写，权限和大小必须可检查且可解析，并受大小上限约束；响应临时目录必须显式收紧为 `700`。
- `scripts/backup-restore-preflight.sh` 和 `make backup-preflight` 是生产备份恢复前置门禁；必须检查 `mysqldump/mysql`、归档压缩和 checksum 工具、备份目录私有权限、备份目录和备份 artifact 权限可判定性、加密要求、workspace/artifact 可读性、恢复演练证据文件权限和 mtime 可判定性。宿主机没有 MySQL CLI 时，可以显式配置 `SOURCELENS_BACKUP_TOOLCHAIN_EXECUTOR=docker:<container>` 检查 Docker MySQL 容器内的 `mysqldump/mysql`，但容器名必须经过安全字符集校验，且不得通过命令行注入数据库密码。`scripts/backup-restore-drill.sh` 和 `make backup-restore-drill` 必须生成可被 backup preflight 和 release evidence 复核的恢复演练证据，而不是要求人工手写 pass 文件。
- `scripts/rollback-preflight.sh` 和 `make rollback-preflight` 是生产回滚前置门禁；必须检查不可变回滚目标、安全格式的备份编号、备份目录私有且不在 git/workspace 内、备份目录和备份 artifact 权限可判定性、计划文件非空、不可 symlink、权限和 mtime 可判定、不过期、止损开关和 smoke target。
- `scripts/release-evidence.sh` 和 `make release-evidence` 是发布验收证据归档入口；只能记录命令输出、git status、diff stat、sandbox drill、GitHub App drill、GitHub webhook drill 输出、已配置的备份恢复/回滚人工证据副本和已校验的 LLM provider run 摘要，不得 dump 完整 env、secret、完整 diff 或内联原始模型输出。release evidence 即使关闭 preflight，也必须独立校验真实 env 文件边界：允许 `deploy/.env.example` 模板和缺失文件走进程环境兜底；若真实 env 文件存在，则必须不是 symlink、必须是普通非空文件、必须可读且不得开放 group/world 权限。归档备份恢复证据和回滚计划前，还必须重新验证手工证据 freshness、`SOURCELENS_BACKUP_DIR` 的目录边界、对应 backup id 的 database/workspace/artifacts/checksums artifact 文件边界和 checksum 内容，拒绝权限不可检查或不可解析的手工证据源文件、未来时间或过期的恢复演练/回滚计划、symlink 备份目录、位于 git worktree 或 `SOURCELENS_WORKSPACE` 内的备份目录、group/world 可访问的备份目录、symlink artifact、非普通文件、空文件、不可读文件或 group/world 可写文件。调用 smoke、phase12 baseline、Docker sandbox drill、GitHub App drill 和 GitHub webhook drill 时，必须传入同一个已校验 env 文件；file-bound repair smoke、AutoRepair patch readiness smoke 和 Audit workbench smoke 只能使用受控 `SOURCELENS_BASE_URL`，不得裸跑子脚本回退不可审计默认 env，也不得把 smoke token 或数据库密码作为 smoke/phase12 命令行参数传递。证据日志中的命令行必须对 password、token、secret、private key 等 env 参数值脱敏；步骤输出、人工证据副本和 LLM provider run 文件落盘后也必须 scrub 预置敏感配置值，并自动覆盖真实 env 文件/进程环境中名称匹配 password、token、secret、private_key、api_key、credential、authorization 等模式的配置值，避免 smoke token、数据库密码、JWT、GitHub secret 或 provider key 进入证据包。证据根目录不得是 symlink，权限必须可检查且可解析，并且不得开放 group/world 权限；run id 必须是短安全标识，不得使用 `.` 或 `..`；LLM provider run 源文件不得是 symlink、空文件、不可读文件、权限不可检查/不可解析或 group/world 可访问文件；LLM provider run 的 raw output artifact 路径必须位于 `release-evidence/` 下并只使用安全路径段，不得包含空段、`.`/`..` 段、反斜杠、控制字符、真实 `<run-id>` 占位符或特殊字符路径段。证据创建过程必须先设置 `umask 077`，最终证据包内所有普通文件、复制的人工证据文件、`llm-provider-run.json` 和 `checksums.sha256` 都必须保持 `600` 私有权限，并同时排除在 Git 与 Docker build context 之外；checksum manifest 必须覆盖最终证据包文件，便于发布记录复核包内文件未被后改。发布记录归档前后必须能用 `scripts/verify-release-evidence.sh` 校验核心证据文件、summary/manifest metadata 一致性与格式、实际 verifier 目录名和 `summary.md` 的 `evidence_dir` 末段都必须匹配 `run_id`、summary marker、`## Steps` 的状态/slug 与 `status.tsv` 一一对应、summary 三项计数与 `status.tsv` 中 `FAIL/WARN/SKIP` 行数一致、status 表头、17 个标准 step slug 各出现一次、`status`/`exit_code` 语义一致、核心 `git-metadata` 状态必须保持 `OK`，`worktree-inventory` 不得被伪造成 `SKIP`，且 `worktree_inventory_strict=true` 下 `worktree-inventory` 状态为 `OK` 时不得在 `worktree-inventory.md` 中出现非零 `Other` 分组或 strict failure marker，`worktree-inventory` strict failure 必须在 `worktree-inventory.md` 中保留非零 `Other` 分组和 strict failure marker、manifest include 模式与 `status.tsv` 一致，强制步骤不得被伪造成 `SKIP` 或 `WARN`，显式关闭步骤的 `SKIP` detail 不得伪装成环境未配置，每个标准 step 的 `log_file` 匹配固定证据文件名和 status 引用文件，再重新计算非 manifest 文件 SHA-256 并与 `checksums.sha256` 精确比对，且 verifier 必须拒绝 symlink、非 `600` 文件、未知或重复 step slug、manifest 自包含、绝对路径、dot-segment、反斜杠、控制字符、实际包内不安全文件路径和 checksum 不匹配；`git-status.txt`、`git-diff-stat.txt` 和 `worktree-inventory.md` 控制字符也必须被拒绝。`created_at` 不能只匹配外观格式，还必须可被 UTC `date` 真实解析，避免不可存在的伪时间线进入发布记录。

## 7. 分阶段安全策略

短期：

- 禁止生产默认密钥。
- API 响应脱敏。
- Agent shell 默认关闭。
- 自动修复只生成 patch。

中期：

- 工具调用统一审计。
- 任务状态机化。
- 日志和 artifact 权限隔离。
- 本地仓库复制到隔离 workspace。

长期：

- Docker/gVisor 沙箱。
- GitHub App 短期 token。
- Vault 或云密钥管理服务。
- Prompt injection 与 LLM 输出安全审查。

## 8. 项目删除与数据残留边界

当前已落地：

- 删除项目前仍由 `ProjectService` 校验项目归属。
- 删除项目后通过 `ProjectDeletionService` 级联清理仓库、GitHub App installation、扫描任务、图谱、切片、execution task、Agent 任务与对话、AutoRepair、CI diagnostics、PR review、issue decomposition。
- artifact 文件和记录通过 `ArtifactStorageService.deleteByProject()` 清理。
- 子表按父 ID 先删，再删除项目记录，避免 symbol/relation/chunk、execution attempt、execution step、execution log、conversation message、Agent step、PR review comment、issue task 等孤儿数据。
- 项目删除级联完成后写入 `audit_logs`，审计保存失败只记录告警，不阻断删除主流程。

## 9. GitHub App 与受控 PR 边界

当前已落地：

- `github_app_installations` 只保存 installation 元数据，不保存 access token。
- 后端通过 GitHub App private key 签发 App JWT，再换取短期 installation access token。
- `RepositoryService.getDecryptedToken()` 会按仓库 `authType` 分流：
  - `GITHUB_APP`：临时换取 installation token。
  - `PAT`：仅走旧兼容路径。
  - `NONE`：不提供凭据。
- 生产 profile 默认设置 `sourcelens.repository.allow-pat-credentials=false`，新增或更新 PAT 仓库凭据会被拒绝。
- GitHub webhook 入口 `/api/webhooks/github/app` 对外开放，但必须通过 `X-Hub-Signature-256` 验签。
- 成功处理过的 GitHub webhook delivery id 会记录到 `github_webhook_deliveries`，重复投递会幂等跳过。
- `installation` 与 `installation_repositories` 事件只同步系统内已存在仓库，不自动创建未知项目或仓库；`repositories_added` 会把已存在仓库切换为 `GITHUB_APP` 并清理旧 token ref，`repositories_removed` 会禁用对应 installation 并在当前仓库使用 GitHub App 时切回 `NONE`。
- installation 手动绑定、禁用和 webhook 同步会写入 `audit_logs`，便于追踪仓库认证方式变化。
- 创建受控 PR 前必须校验 installation permissions 至少包含 `contents:write` 和 `pull_requests:write`；权限降级后必须拒绝受控 PR，并写入 `AUTO_REPAIR_PR_REJECTED` 审计，不得进入 PR_RUNNING 或后台执行。
- 受控 PR 会通过后台异步任务执行，并在 AutoRepair 对应 `execution_tasks` 中记录 clone、apply patch、push、create PR 步骤。
- 受控 PR clone/push Git 远端和 GitHub API 都有 host allowlist；默认只允许 `github.com` 与 `api.github.com`，GitHub Enterprise 需显式扩展配置。
- 受控 PR push 阶段必须分类处理远端拒绝：非快进或远端分支变化属于 `CONFLICT`，远端策略拒绝或分支保护拒绝属于 `FORBIDDEN`；错误消息可包含清洗后的远端诊断原因，但不得保留换行等不稳定格式；push 失败后不得继续调用 Pull Request API。
- GitHub App installation token 换取与 Pull Request 创建共用 GitHub API 出口策略：Base URL 必须为 HTTPS，host 必须在 allowlist 中，且不允许 localhost、内网 IP、链路本地地址、metadata host、user-info、query 或 fragment。
- GitHub Pull Request API 调用前必须校验 repository owner/name、head branch、base branch 和标题，避免通过仓库元数据构造异常 API path；`401/403` 必须作为权限失败处理，`409/422` 必须作为重复 PR 或 GitHub 校验冲突处理；在 `create_pull_request` 阶段遇到重复 PR 或 GitHub 校验冲突时，AutoRepair 必须回到 `PATCH_READY`，记录失败 step 和 `AUTO_REPAIR_PR_FAILED` 审计，不得标记为 `PR_CREATED`；HTTP client IO 失败必须作为网络请求失败处理，且不得在错误消息中回显 installation token。
- 受控 PR 临时 clone 工作区在流程结束后清理，降低仓库内容和临时凭据上下文残留风险。
- webhook delivery 幂等记录支持按保留期批量清理，默认关闭；生产环境强制 GitHub App readiness preflight 时必须显式启用 `GITHUB_WEBHOOK_DELIVERY_CLEANUP_ENABLED=true` 并配置保留天数和批大小，避免记录无限增长。
- webhook delivery 支持多项目/多仓库映射，前端审计页可按项目查看 GitHub webhook delivery 的 delivery id、event、status 和处理结果。
- 通用审计日志和 Agent 工具调用审计支持按保留期批量清理，默认关闭，避免长期运行后审计表无限增长。
- workspace sandbox 兜底清理默认关闭；开启后只清理 `repair-*` 和 `autorepair-pr-*` 直接子目录，避免误删普通仓库 clone 或用户数据。
- AutoRepair 创建 PR 默认关闭；开启后必须满足：
  - repair 状态为 `PATCH_READY`。
  - 仓库属于同一 project。
  - 仓库 provider 为 `GITHUB`。
  - 仓库 authType 为 `GITHUB_APP`。
  - installation permissions 满足最小写权限。
  - patch diff 非空。
  - patch diff 只修改当前 AutoRepair 目标文件且不包含敏感路径。
  - repair 尚未创建过 PR。

仍需补强：

- 真实 GitHub 仓库端到端演练仍需覆盖 installation 权限变更、分支保护、网络失败和重复提交等场景。
- 生产若将 PR 提交流程迁移到独立 worker 或容器执行，需要把当前 host allowlist 同步成网络层出口策略。
- Docker sandbox 已把容器内 `HOME`、`XDG_CACHE_HOME`、`MAVEN_CONFIG`、`npm_config_cache` 和 `GRADLE_USER_HOME` 固定到 `/workspace/.sourcelens-home` 与 `/workspace/.sourcelens-cache/*`；这些目录随任务 workspace 隔离和清理，不使用跨项目共享缓存。后续如果引入持久缓存，必须先完成跨项目泄漏、安全清理和容量策略评审。
- Prompt injection 仍需补充真实模型跨 provider 红队执行；当前第一版本地回归已覆盖 prompt 构造、不可信上下文分隔、红队样例结构和 LLM 输出质量契约。
## 2026-07-04：Artifacts raw download marker release verifier boundary

已收口：

- release verifier 对 `ARTIFACTS_DETAIL_SELECTION_SMOKE_OK` 与 `AUDIT_LOGS_ARTIFACT_RAW_DOWNLOAD_DEEP_LINK_SMOKE_OK` 采用 optional-present strict validation。
- 没有该 marker 的证据包不失败，避免未纳入标准 release step 的 mocked UI smoke 阻塞发布包。
- 一旦证据包日志包含该 marker，必须唯一，并证明：
  - raw download 只声明 acknowledgement/audit boundary，不声明 raw content redaction。
  - audit receipt id 是低敏 locator，不是授权凭据。
  - AuditLogs deep link 只携带 `auditLogId` 或 fallback 的 `resourceType/resourceId/action/status` 等低敏定位字段。
  - deep link/fallback URL 不携带 raw payload、storage path 或 filename。
  - marker 自身不包含 raw artifact payload 或常见 secret label。
- AuditLogs 配套 marker 还必须证明：
  - `auditLogId` 精确绑定 selected audit event。
  - 同 resource 的冲突事件不会劫持 drawer。
  - 只接受 `ARTIFACT_RAW_DOWNLOAD/SUCCESS`。
  - “打开关联资源”只回跳 `/artifacts?projectId=...&artifactId=...`，不得携带 audit id、raw payload、storage path、filename、content type、checksum 或 size。
- `release-verifier-artifacts-marker` security regression 会伪造重复 marker、request unbound、auditLogId invalid、filename leakage、fallback receipt claim、raw content claim、缺 viewport 和 remote host 等负例，确认 verifier fail closed。

仍保持非范围：

- Artifacts raw download 能力本身未被移除。
- 后端 artifact storage、preview/download API、审计表 schema 和历史数据未改变。
- 该边界不等价于完整 raw 查看授权体系。
