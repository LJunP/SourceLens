# SourceLens Operations Runbook

> AIOS v2.3 状态：`SUPPORTING OPERATIONS REFERENCE`。现有启动、检查和恢复命令继续作为继承资产；旧 Phase、current authority 和生产化结论不覆盖 `aios/truth/project_state.yaml`。

状态：继承系统操作参考；不代表AIOS生产化阶段或上线就绪。

本文用于真实部署、演示环境和回归验收。它不替代架构设计文档，只定义上线前后必须检查的操作边界。

## 1. 部署前红线

生产 profile 必须使用 `SPRING_PROFILES_ACTIVE=prod`，并且不得使用开发默认值。

必填环境变量：

- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `REDIS_HOST`
- `REDIS_PORT`
- `JWT_SECRET`
- `ENCRYPT_PASSWORD`
- `ENCRYPT_SALT`

GitHub App 能力需要额外配置：

- `GITHUB_APP_ID`
- `GITHUB_APP_PRIVATE_KEY_PEM`
- `GITHUB_APP_WEBHOOK_SECRET`
- `GITHUB_API_BASE_URL`
- `GITHUB_ALLOWED_API_HOSTS`

高风险能力默认关闭：

- `SOURCELENS_AGENT_WRITE_PATCH_ENABLED=false`
- `SOURCELENS_AGENT_EXEC_TEST_ENABLED=false`
- `SOURCELENS_AGENT_CREATE_PR_ENABLED=false`
- `SOURCELENS_AUTOREPAIR_SUBMIT_PR_ENABLED=false`
- `SOURCELENS_ALLOW_PAT_CREDENTIALS=false`
- `SOURCELENS_ALLOW_LOCAL_FILE_REPOS=false`
- `SOURCELENS_SANDBOX_EXECUTOR=docker`
- `SOURCELENS_SANDBOX_DOCKER_NETWORK=none`
- `SOURCELENS_SANDBOX_DOCKER_USER=1000:1000`
- `SOURCELENS_SANDBOX_DOCKER_PIDS_LIMIT=256`
- `SOURCELENS_SANDBOX_DOCKER_READ_ONLY_ROOT=true`
- `SOURCELENS_SANDBOX_DOCKER_TMPFS=/tmp:rw,noexec,nosuid,size=64m`

生产启动期会强制校验这些红线：

- `file://` 仓库和 PAT 凭据必须关闭。
- sandbox executor 必须是 `docker`。
- Docker sandbox 必须使用 `network=none`、非 root 用户、只读 root filesystem、正数 pid limit 和包含 `noexec,nosuid` 的 `/tmp` tmpfs。
- Docker sandbox 的 memory 与 CPU limit 必须为正值；执行器会设置 `--memory-swap` 等于 `--memory`，避免容器获得超出显式内存上限的 swap 空间。
- 开启 AutoRepair 受控 PR 或 Agent 创建 PR 时，必须配置 GitHub App app id、private key、webhook secret、API base URL 和 allowed hosts。
- GitHub App API base URL 必须使用 HTTPS，host 必须出现在 `GITHUB_ALLOWED_API_HOSTS` 中，并且不能指向 localhost、内网、链路本地或 metadata 服务；生产启动校验和 preflight 都会检查这条出口策略。

清理任务默认关闭，生产需要按容量和审计要求显式启用：

- `SOURCELENS_ARTIFACT_CLEANUP_ENABLED`
- `SOURCELENS_AUDIT_CLEANUP_ENABLED`
- `SOURCELENS_EXECUTION_LOG_CLEANUP_ENABLED`
- `GITHUB_WEBHOOK_DELIVERY_CLEANUP_ENABLED`
- `SOURCELENS_WORKSPACE_SANDBOX_CLEANUP_ENABLED`

## 2. 启动顺序

1. 运行生产验收前置条件检查。
2. 启动 MySQL 和 Redis。
3. 确认 Flyway migration 没有失败。
4. 启动 backend。
5. 启动 web-console 或静态前端服务。
6. 运行 smoke test。

本地 dev backend 标准入口：

```bash
make backend
```

`make backend` 会读取 `deploy/.env`，默认使用 `SPRING_PROFILES_ACTIVE=dev`、`SERVER_PORT=8080`，并显式传入 `SOURCELENS_BACKEND_MAIN_CLASS=com.sourcelens.SourceLensApplication` 给 Spring Boot Maven 插件，避免插件在 `target/classes` 中做慢速主类扫描。若 8080 上已经有健康的 SourceLens backend，脚本会复用现有进程并直接退出；如果端口被非 SourceLens 进程占用，脚本会打印 `lsof` 结果并失败。需要临时换端口时使用：

```bash
SERVER_PORT=18080 make backend
```

生产验收 preflight：

```bash
make prod-preflight
```

备份恢复前置检查：

```bash
make backup-preflight
```

回滚前置检查：

```bash
make rollback-preflight
```

发布证据包：

```bash
make release-evidence
```

本地开发机如果只是想查看缺口而不让命令失败，可以使用 warn-only 模式：

```bash
SOURCELENS_PREFLIGHT_WARN_ONLY=true make prod-preflight
SOURCELENS_BACKUP_PREFLIGHT_WARN_ONLY=true make backup-preflight
SOURCELENS_ROLLBACK_PREFLIGHT_WARN_ONLY=true make rollback-preflight
```

发布验收相关 `*_WARN_ONLY` 模式只接受合法布尔值，值会先去掉空白和成对引号；`SOURCELENS_PREFLIGHT_WARN_ONLY`、`SOURCELENS_BACKUP_PREFLIGHT_WARN_ONLY`、`SOURCELENS_ROLLBACK_PREFLIGHT_WARN_ONLY`、`SOURCELENS_SANDBOX_DRILL_WARN_ONLY`、`SOURCELENS_GITHUB_APP_DRILL_WARN_ONLY` 和 `SOURCELENS_GITHUB_WEBHOOK_DRILL_WARN_ONLY` 拼错都会 fail-closed，避免真实发布检查被静默切换为错误模式。

匿名 GitHub public repo clone 依赖 backend runtime 内的系统 `git` CLI。生产镜像必须包含 `git`，`make prod-preflight` 会检查本机 `git --version` 并标注其用于 `GitService anonymous GitHub clone runtime dependency and public repo smoke`。如果部署在容器内，还应在目标 backend 容器里确认：

```bash
docker exec sourcelens-backend sh -lc 'command -v git && git --version'
```

`make public-repo-smoke` 一旦被调用就代表要验证公开仓库主链路；缺少 `git` 会快速失败，而不是等扫描任务进入 `prepare_repository` 后才报错。

P6 Project QA 语义候选池可用 `public-repo-smoke` 的白盒子探针验证。默认 `SOURCELENS_PUBLIC_REPO_SMOKE_SEMANTIC_PROBE=auto`：当 Docker/MySQL、dev/test `MOCK` LLM 或足够 code_chunks 不可用时，主 smoke 不失败，但 `PUBLIC_REPO_SMOKE_OK.semanticWeakKeywordProbe.status` 会记录 `SKIPPED` 和原因。需要把该探针作为本地验收门禁时使用：

```bash
SOURCELENS_BASE_URL=http://localhost:8080 \
SOURCELENS_PUBLIC_REPO_SMOKE_SEMANTIC_PROBE=true \
SOURCELENS_PUBLIC_REPO_SMOKE_DB_COUNTS=true \
SOURCELENS_PUBLIC_REPO_SMOKE_TIMEOUT_SECONDS=900 \
make public-repo-smoke
```

该探针会创建并激活本地 `MOCK` LLM 配置，直接在临时 smoke 项目的 `code_chunks` 中设置前 80 个同模型零向量和第 81 个之后的目标向量，再通过 `/api/projects/{projectId}/qa` 断言 `SEMANTIC_FALLBACK`、`matchedChunks=0`、`embeddedChunks>=81`、首条 `retrievedChunks` 命中目标 chunk。它证明的是 bounded semantic pool 能被真实 API 消费，不证明真实外部 embedding provider、真实回答质量或黑盒用户路径。

P6 Project QA 真实弱关键词样本可用非 DB mutation 观测评估。默认 `SOURCELENS_PUBLIC_REPO_SMOKE_WEAK_KEYWORD_EVAL=auto`：它只调用当前 smoke 项目的 `/api/projects/{projectId}/qa`，不修改 `code_chunks`，并把结果写入 `PUBLIC_REPO_SMOKE_OK.projectQaWeakKeywordEvaluation`。显式本地验收可使用：

```bash
SOURCELENS_BASE_URL=http://localhost:8080 \
SOURCELENS_PUBLIC_REPO_SMOKE_WEAK_KEYWORD_EVAL=true \
SOURCELENS_PUBLIC_REPO_SMOKE_WEAK_KEYWORD_EVAL_CONFIGURE_MOCK=true \
SOURCELENS_PUBLIC_REPO_SMOKE_WEAK_KEYWORD_EVAL_MIN_SEMANTIC_FALLBACK=1 \
SOURCELENS_PUBLIC_REPO_SMOKE_TIMEOUT_SECONDS=900 \
make public-repo-smoke
```

`SOURCELENS_PUBLIC_REPO_SMOKE_WEAK_KEYWORD_EVAL_CONFIGURE_MOCK=true` 会在创建 scan task 前激活本地 `MOCK` LLM，让本轮扫描自然生成 embedding；它不直接写 `code_chunks`。该 marker 必须显示 `probeKind=REAL_WEAK_KEYWORD_SAMPLE_EVAL`、`nonDbMutation=true`、`dbMutationUsed=false`、`providerQualityClaim=false` 和 `llmSetup`，并记录 `semanticFallbackHits`、`retrievalModeDistribution`、每个 sample 的 `matchedChunks`、`retrievalMode`、`resultCount`、`embeddedChunks`、首条 primary chunk 和当前 `scanTaskId` 绑定。`auto` 模式下无 embedding 或没有 semantic fallback 样本会返回 `INCONCLUSIVE` 而不是中断主 smoke；显式 `true` 才会 fail closed。该评估只用于观察 `<45` 弱关键词阈值和 semantic fallback 是否在真实 QA API 中出现，不证明答案质量、外部 provider 质量或 full release authority。

发布证据校验对该 marker 采用 optional 子合同：旧 `PUBLIC_REPO_SMOKE_OK` 不含 `projectQaWeakKeywordEvaluation` 时仍兼容通过；一旦 marker 存在，`verify-release-evidence.sh` 会离线强校验非 DB mutation 边界、provider quality 免责声明、semantic fallback 命中阈值、retrieval mode 汇总、sample scan 绑定、primary embedding 证据和 `llmCleanup.status=OK`。安全回归函数 `assert_release_verifier_rejects_public_repo_weak_keyword_eval_forgery` 覆盖 `dbMutationUsed=true`、`providerQualityClaim=true`、fallback 命中不足、scan mismatch、cleanup warning、case scan mismatch、semantic case 含 keyword match、primary 未 embedding 和非 OK 状态仍声明命中等伪造负例。

P9 ModelConfig provider 控制面可恢复错误态可用全 API mock smoke 验收：

```bash
CI=true make model-config-recoverable-ui-smoke
```

该 smoke 不触发真实后端、真实 provider 或真实密钥校验；它只证明模型配置页在 `1440x900` 与 `320x740` 下对初始加载失败、retry 恢复、缓存刷新失败保留表格、激活失败、创建失败和删除失败有页面内可见状态，并输出 `MODEL_CONFIG_RECOVERABLE_SMOKE_OK`。若该 smoke 失败，不应通过忽略 console warning 处理；优先修复页面运行时警告或缺失的 `StateBlock` 状态。

ProjectDetail QA 低置信/无证据与 retry recovery 可用全 API mock smoke 验收：

```bash
CI=true make project-qa-low-confidence-ui-smoke
```

该 smoke 不触发真实后端、真实 LLM provider 或公开仓库 live smoke；它证明 `PARTIAL`、`UNVERIFIED` 和 `NO_EVIDENCE` 的低置信状态可见，并证明低置信面板 `retry` 会重新提交同一问题，第二次恢复为 `VERIFIED/DIRECT_VERIFIED`、绑定当前 `scanTaskId`、显示 `回答引用证据`，且至少一条 citation 为 `citedByAnswer=true`。成功日志必须包含 `PROJECT_QA_LOW_CONFIDENCE_SMOKE_OK.retryRecovery`，其中 `verifiedAfterRetry`、`scanTaskIdBound`、`citationVisible` 和 `citedByAnswer` 均为 `true`。

ProjectDetail QA/code_chunks 可恢复失败态可用全 API mock smoke 验收：

```bash
CI=true make project-qa-recoverable-ui-smoke
```

该 smoke 不触发真实后端、真实 LLM provider 或公开仓库 live smoke；它只证明 ProjectDetail 的 QA/code_chunks 区域在 `1440x900` 与 `320x740` 下对 code_chunks 初始检索失败、retry 恢复、已有结果刷新失败保留上下文、QA 请求失败和 QA retry 后 answer citation 恢复有页面内可见状态，并输出 `PROJECT_QA_RECOVERABLE_SMOKE_OK`。

ProjectDetail QA 已验证引用进入 AutoRepair 候选可用全 API mock smoke 验收：

```bash
CI=true make project-qa-autorepair-candidate-ui-smoke
```

该 smoke 不触发真实后端、真实 LLM provider、真实 patch generation、PR 创建或公开仓库 live smoke；它只证明 Project QA 的 answer citation 在 `1440x900` 与 `320x740` 下满足 fail-closed 候选入口合同：`groundingStatus=VERIFIED`、`citation.citedByAnswer=true`、有 `filePath` 且可解析 `repositoryId` 时才显示 `生成修复候选`；`VERIFIED` 但未被回答引用的 citation 和 `PARTIAL/RETRY_FAILED` 低置信 citation 均不得显示该入口。成功日志必须包含 `PROJECT_QA_AUTOREPAIR_CANDIDATE_SMOKE_OK`，其中 `mockedApiOnly=true`、`unhandledApiRequests=0`、`createPayloadBound=true`、`createdRepairSelected=true`，并且 `actionVisibility.verifiedCitedVisible=true`、`actionVisibility.verifiedUncitedHidden=true`、`actionVisibility.lowConfidenceHidden=true`。该 marker 还必须证明 AutoRepair draft URL 携带 `projectId`、`openCreate=1`、`repositoryId`、`scanTaskId`、`filePath`、`source=Project QA verified citation` 和结构化 `targetDesc`，提交创建时 payload 绑定相同 `repositoryId`、`scanTaskId`、`filePath` 与 QA 引用来源说明，创建后详情页立即打开新 repair，并且 `sourceBridge.visible=true`、`qaCitationOriginVisible=true`、`scanTaskIdBound=true`、`qaDeepLinkBound=true`、`auditDeepLinkBound=true`。

真实 GitHub App 端到端演练前应强制检查 GitHub App 变量：

```bash
SOURCELENS_PREFLIGHT_REQUIRE_GITHUB_APP=true make prod-preflight
```

`SOURCELENS_PREFLIGHT_REQUIRE_GITHUB_APP` 只接受合法布尔值，值会先去掉空白和成对引号；拼错会 fail-closed，避免真实 GitHub App readiness 验收被静默跳过。

真实 GitHub App 只读演练：

```bash
SOURCELENS_GITHUB_APP_DRILL_INSTALLATION_ID=123456 \
SOURCELENS_GITHUB_APP_DRILL_REPOSITORY=owner/repo \
make github-app-drill
```

该脚本会使用 `GITHUB_APP_ID` 和 `GITHUB_APP_PRIVATE_KEY_PEM` 签发 App JWT，调用 GitHub API `/app`、`/app/installations/{installation_id}`、`/app/installations/{installation_id}/access_tokens`，再用短期 installation token 读取 `SOURCELENS_GITHUB_APP_DRILL_REPOSITORY`。它还会在本地配置阶段确认 `GITHUB_APP_PRIVATE_KEY_PEM` 看起来像 PEM private key，并要求 `GITHUB_APP_WEBHOOK_SECRET` 至少 16 个字符；webhook HMAC 会先用标准 SHA-256 测试向量校验本地计算路径，再用实际 secret 生成 `sha256=<hex>` 签名头形状，确认该 secret 可用于 GitHub webhook 签名验证。`SOURCELENS_GITHUB_APP_DRILL_ENV_FILE` 或 `SOURCELENS_PREFLIGHT_ENV_FILE` 指向真实 env 文件时，脚本会在读取配置前要求该文件非 symlink、普通非空、可读且不得开放 group/world 权限；`deploy/.env.example` 模板会跳过私有权限检查，缺失文件会回退到进程环境。私钥和签名中间文件只写入权限为 `700` 的临时目录，私钥文件权限收紧为 `600`。演练只读，不创建分支、不 push、不创建 PR。

`SOURCELENS_GITHUB_APP_DRILL_REPOSITORY` 必须是安全的 `owner/repo` 形式：owner 使用 GitHub 账号名字符集，repo name 不得为空、不得包含额外 `/`、不得是 `.` 或 `..`、不得包含连续 `..`，也不得带 `.git` 后缀。该变量会在调用 `/repos/{owner}/{repo}` 前拆分校验，避免异常配置进入 GitHub API path。

真实 GitHub webhook 签名和重复投递演练：

```bash
SOURCELENS_BASE_URL=https://sourcelens.example.com \
make github-webhook-drill
```

该脚本会向 `/api/webhooks/github/app` 发送带 `X-GitHub-Event`、`X-GitHub-Delivery` 和 `X-Hub-Signature-256` 的签名 webhook 请求，随后用同一个 delivery id 重放一次并要求返回 `duplicate=true`；它还会验证缺失 delivery id 返回 `400`、错误签名返回 `401`。默认事件为 `ping`，避免改动 installation 或 repository 状态；如需覆盖真实安装事件，可以设置 `SOURCELENS_GITHUB_WEBHOOK_DRILL_EVENT`、`SOURCELENS_GITHUB_WEBHOOK_DRILL_PAYLOAD_FILE` 和一次性 `SOURCELENS_GITHUB_WEBHOOK_DRILL_DELIVERY_ID`。`SOURCELENS_GITHUB_WEBHOOK_DRILL_ENV_FILE` 或 `SOURCELENS_PREFLIGHT_ENV_FILE` 指向真实 env 文件时，脚本会在读取 `GITHUB_APP_WEBHOOK_SECRET` 前要求该文件非 symlink、普通非空、可读且不得开放 group/world 权限；`deploy/.env.example` 模板会跳过私有权限检查，缺失文件会回退到进程环境。`SOURCELENS_BASE_URL` 会在发起 webhook HTTP 调用前按同一套 Base URL 形状校验 fail-closed 拒绝空 host、空白、user-info、query 或 fragment。事件名只允许安全 header 字符且最长 64 字符；delivery id 只允许字母、数字、点、下划线、冒号和短横，最长 128 字符，未配置时脚本会自动生成。自定义 payload fixture 必须是非空、可读、非 symlink、不可 group/world 写、有效 JSON，权限和大小必须可检查且可解析，且大小不得超过 `SOURCELENS_GITHUB_WEBHOOK_DRILL_PAYLOAD_MAX_BYTES`，默认 `65536`。演练 payload 会先写入权限为 `600` 的临时文件，并通过 `curl --data-binary @file` 发送，避免真实 webhook 内容暴露在进程命令行参数中；演练响应文件只写入权限为 `700` 的临时目录。

release evidence 默认会在 GitHub App drill 变量完整时自动归档该演练；如需强制真实发布必须跑该演练：

```bash
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_GITHUB_APP_DRILL=true make release-evidence
```

若强制 GitHub App drill 但缺少 `GITHUB_APP_ID` 等配置，证据包会记录 `github-app-drill` required failure，并且仍必须通过 `make verify-release-evidence DIR=release-evidence/<run-id>` 或 `scripts/verify-release-evidence.sh` 复核。

release evidence 默认会在 `SOURCELENS_BASE_URL` 和 `GITHUB_APP_WEBHOOK_SECRET` 完整时自动归档 webhook drill；如需强制真实发布必须跑该演练：

```bash
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_GITHUB_WEBHOOK_DRILL=true make release-evidence
```

若强制 GitHub webhook drill 但缺少 `SOURCELENS_BASE_URL` 或 `GITHUB_APP_WEBHOOK_SECRET`，证据包会记录 `github-webhook-drill` required failure，并且仍必须通过 `make verify-release-evidence DIR=release-evidence/<run-id>` 或 `scripts/verify-release-evidence.sh` 复核。

preflight 会检查静态安全/依赖/LLM safety 门禁、Docker CLI 和 Docker daemon、docker compose config、MySQL CLI、生产必填变量、GitHub App 前置条件以及可选的 `SOURCELENS_BASE_URL` smoke 目标；静态门禁失败时会在 preflight 输出中保留子门禁详情，便于定位具体断言或样例失败。它不替代 `make verify`、`make smoke`、`make github-app-drill`、`make github-webhook-drill` 或 `make phase12-baseline`，只用于在真实验收前提前发现环境缺口。

backup preflight 会检查数据库备份/恢复工具链、`DB_URL`/`DB_USERNAME`/`DB_PASSWORD`、备份目录、保留期、加密要求、workspace 和 artifact 目录可读性，以及 `SOURCELENS_BACKUP_RESTORE_DRILL_EVIDENCE_FILE` 指向的恢复演练证据文件。数据库工具链默认是宿主机 `mysql`/`mysqldump`，也可以显式配置 `SOURCELENS_BACKUP_TOOLCHAIN_EXECUTOR=docker:<container>`，让本地 Docker 环境复用容器内的 `mysql` 和 `mysqldump`；容器名必须是安全 Docker container name，且容器必须可被 `docker inspect` 和 `docker exec` 验证。默认读取 `deploy/.env`，也可以通过 `SOURCELENS_BACKUP_PREFLIGHT_ENV_FILE=/path/to/prod.env make backup-preflight` 指定真实部署 env 文件；真实 env 文件必须是非空、可读、非 symlink 的普通文件，权限必须可检查且可解析，并且不得开放 group/world 访问权限。

`make backup-restore-drill` 会用 `SOURCELENS_BACKUP_DRILL_BACKUP_ID` 指定的备份编号执行本地恢复演练，并把标准证据写入 `SOURCELENS_BACKUP_DRILL_EVIDENCE_FILE`；若未配置该新变量，则兼容写入 `SOURCELENS_BACKUP_RESTORE_DRILL_EVIDENCE_FILE`。典型命令是 `SOURCELENS_BACKUP_DRILL_BACKUP_ID=<backup_id> SOURCELENS_BACKUP_DRILL_EVIDENCE_FILE=/private/path/restore-drill.env make backup-restore-drill`。该 drill 会先按 `<backup_id>-database.sql.gz`、`<backup_id>-workspace.tar.gz`、`<backup_id>-artifacts.tar.gz`、`<backup_id>-checksums.sha256` 这类分隔符前缀匹配四类 artifact，验证它们都是非 symlink 普通文件、非空、可读、不可 group/world 写，并用 `checksums.sha256` 覆盖 database、workspace、artifacts 三类真实 SHA-256。随后它会把数据库 dump 恢复到 `SOURCELENS_BACKUP_DRILL_MYSQL_CONTAINER` 指向的 Docker MySQL 临时 scratch database；scratch database 名使用 backup id 的短 SHA-256 派生，并强制保持在 MySQL 64 字符 identifier 上限内，避免合法长 backup id 阻断恢复演练。该 drill 拒绝包含 `CREATE DATABASE`、`DROP DATABASE`、`USE` 或 mysql client escape 的 dump；workspace 和 artifacts 归档只会解压到私有临时目录，并拒绝绝对路径、`..`、反斜杠和控制字符路径。成功证据必须包含 `restore_drill_status=pass`、`database_restore=pass`、`workspace_restore=pass`、`artifact_restore=pass`、`checksum_verification=pass`、`database_tables`、`workspace_entries`、`artifact_entries` 和 `mysql_executor=docker:<container>`，该证据随后可被 `make backup-preflight` 与 `make release-evidence` 复核。

当前 current full release authority 为 `release-evidence/release-current-schema-20260704-1618`。该包使用完整 `release` profile 和稳定 backend jar runtime 生成，并通过 `./scripts/verify-release-evidence.sh release-evidence/release-current-schema-20260704-1618`；结果为 `required_failures=0`、`optional_warnings=0`、`skipped=5`。它覆盖 `make verify`、prod/backup/rollback preflight、真实 public repo smoke、真实 public repo UI、file-bound repair、AutoRepair patch、PATCH_READY mocked UI、Dashboard next action mocked UI、report evidence drawer、scan governance timeline、AgentChat audit/tool audit、audit workbench、phase12 baseline 和 sandbox drill。相比上一轮 authority，它已经吸收 source-location probe v4 exact first-result proof、report evidence QA citation manifest fail-closed、report evidence QA citation narrative binding、report evidence drawer 当前 smoke fixture 和 AutoRepair patch 当前 backend smoke fixture。当前公开仓库分析主线、报告证据、Project QA、AutoRepair 复核、P9/P10 前端治理体验可继续推进。

该 authority 仍有 5 个明确后置项：`backup-restore-drill-evidence`、`rollback-plan`、GitHub App drill、GitHub webhook drill 和真实 LLM provider run。前两项属于生产灾备/回滚治理缺口，不阻塞当前公开仓库分析主线，但阻塞“生产发布治理完整闭环”口径；后三项属于高级/外部集成层，未配置时可按 release profile SKIP，但不得宣称 GitHub App E2E、webhook E2E 或真实 provider 质量已经完成。preflight 是 warn-only：backup preflight 仍可能提示缺 `mysqldump/mysql`、backup dir、加密要求和 restore drill evidence；rollback preflight 仍可能提示 target ref、backup id、backup dir、rollback plan 未齐。上一轮完整包 `release-evidence/release-current-schema-20260702-230650` 已被当前 schema authority supersede，并且在最新 verifier 下因缺少 `public_repo_report_evidence_qa_citation_manifest_present=true` 不再可作为当前 authority。旧完整包 `release-evidence/20260702-191044`、`release-evidence/p6-full-release-refresh-20260702-0845`、`release-evidence/release-post-unverified-qa-citation-authority-20260701-135235` 与轻量 evidence framework 包 `release-evidence/p6-evidence-framework-ci-20260702-155117` 只保留为 historical/framework evidence，不能替代当前 full authority。失败包 `release-evidence/p6-full-release-refresh-20260702-1842`、`release-evidence/p6-full-release-refresh-20260702-1900`、`release-evidence/release-current-schema-20260702-212528` 和中断半包 `release-evidence/release-current-schema-20260702-225450` 均不得作为 authority。后续若用 3-128 字符的长 backup id 进行人工演练，artifact 匹配仍按完整 backup id 执行，只有临时 scratch database 名会使用短 hash，避免暴露或截断原始 backup id 造成匹配歧义。

## 3. 本地生成物清理 SOP

本地清理必须优先使用统一入口：

```bash
SOURCELENS_CLEAN_DRY_RUN=1 make clean-local-generated
make clean-local-generated
```

默认行为：

- 保留最新 1 个 `.sourcelens-runtime/backend/source-lens-backend.*` runtime jar。
- 删除超过保留数量且未被进程打开的旧 runtime jar。
- 删除 `analyzer-rust/target`、前端 `dist/test-results/playwright-report/tsbuildinfo`。
- 如果当前 Java 进程命令行包含 `backend-spring/target/classes`，跳过 `backend-spring/target`，避免破坏正在运行的 dev backend。

可选配置：

```bash
SOURCELENS_RUNTIME_KEEP=3 make clean-local-generated
```

禁止在没有专项归档策略时直接删除：

- `release-evidence/`：里面可能包含 current full authority、retained focused samples、historical package 和失败诊断包。
- `deploy/.env`：本机凭据。
- `web-console/node_modules/`：本地依赖缓存。
- `.idea/` / `.vscode/`：用户 IDE 状态。

`release-evidence/` 后续保留策略必须先走只读盘点，再人工归档。入口：

```bash
make release-evidence-inventory
make release-evidence-retention-dry-run
node scripts/release-evidence-inventory.mjs --json
node scripts/release-evidence-inventory.mjs --retention-dry-run --json
```

`release-evidence-inventory` 只读取本地证据目录和权威文档，不移动、不删除、不改名任何证据包；所有输出项的 `delete_allowed` 固定为 `false`。JSON 输出字段包括 `runId`、`path`、`category`、`confidence`、`reason`、`createdAt`、`profile`、`profileSchema`、`gitHead`、`hasManifest`、`hasSummary`、`hasStatusTsv`、`hasChecksums`、`hasInvalidMarker`、`requiredFailures`、`optionalWarnings`、`skipped`、`stepFailCount`、`stepSkipCount`、`stepPendingCount`、`sizeBytes`、`isCurrentAuthority`、`supersededBy`、`manualReviewRequired`、`archiveCandidate` 和 `deleteAllowed`。该脚本只能生成分类建议，不能作为删除授权。

`release-evidence-retention-dry-run` 只在上述 inventory 之上生成动作建议，不执行归档。动作集合固定为：

| 动作 | 含义 |
| --- | --- |
| `KEEP_CURRENT_AUTHORITY` | 当前 full authority 必须保留 |
| `KEEP_RETAINED_FOCUSED` | focused evidence 继续保留，直到被新的 full authority 吸收或人工确认已过期 |
| `ARCHIVE_CANDIDATE_MANUAL_ONLY` | 历史完整包可作为人工归档候选，但不得自动归档或删除 |
| `DIAGNOSE_BEFORE_ARCHIVE` | 失败/中断包必须先诊断，再决定是否归档 |
| `CLASSIFY_BEFORE_ACTION` | 未知包必须先人工分类 |

当前 dry-run 基线：

- `KEEP_CURRENT_AUTHORITY`: 1 个。
- `KEEP_RETAINED_FOCUSED`: 41 个。
- `ARCHIVE_CANDIDATE_MANUAL_ONLY`: 22 个。
- `DIAGNOSE_BEFORE_ARCHIVE`: 22 个。
- `CLASSIFY_BEFORE_ACTION`: 0 个。
- `deleteAllowedAny=false`。

当前只读盘点基线：

- `current-full`: 1 个，当前 `release-evidence/release-current-schema-20260704-1618`。
- `retained-focused`: 41 个，聚焦 gate/live/verifier/feature evidence；其中 `release-evidence/20260703-181321` 是 legacy local focused evidence，包含 `agent-chat-closure-rail-ui-smoke`、`phase12-baseline` 和 `sandbox-drill` 成功步骤。
- `historical-superseded`: 22 个，已被 current full authority 替代的完整或 release-like 包。
- `failed-or-interrupted`: 22 个，含 INVALID、required failure、failed step 或 pending step 的诊断包。
- `unknown-review`: 0 个。

分类处理原则：

| 类别 | 处理原则 |
| --- | --- |
| current-full | 当前 `AGENT_STATUS_BOARD.md` 和 `CODEX_HANDOFF.md` 指向的 full authority，保留 |
| retained-focused | 最近用于 P6/P9/P10/P11 判断的 focused live evidence，保留到下一次 full authority 吸收后再评估 |
| historical-superseded | 已被 current full authority 替代的完整包，保留少量关键样本或迁移到归档 |
| failed-or-interrupted | 仅作为诊断材料人工复核；不得自动删除 |
| unknown-review | 必须先人工检查 `manifest.txt`、`summary.md`、`status.tsv`、`checksums.sha256` 或 `INVALID_RELEASE_EVIDENCE.txt` 后转成明确分类 |

禁止事项：

- 禁止自动删除 `release-evidence/` 下任何目录。
- 禁止把 `historical-superseded` 或 `failed-or-interrupted` 直接等同于“可删”。
- 禁止归档 `unknown-review`，必须先转成明确分类。
- 禁止在新的 full authority 生成、验证通过并更新 README/runbook/handoff 前归档当前 `current-full`。

AutoRepair 来源扫描闭环是 focused UI evidence，不会自动改变当前 full release authority。复验该增量时运行：

```bash
make frontend-ui-check
npm --prefix web-console run build
CI=true make patch-ready-ui-smoke
SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-autorepair-ui-marker
```

成功日志必须包含唯一 `PATCH_READY_UI_SMOKE_OK`，且 marker 中 `viewports` 必须包含 `1440x900`、`390x844`、`320x740`；`scanSourceBridge.visible=true`、`scanTaskId=501`、`scanReportUrl=/scan-tasks/501`、`qaDeepLinkBound=true`、`agentTaskDraftBound=true`、`auditDeepLinkBound=true`、`targetFileExplained=true`、`missingScanFallbackVisible=true`；`layoutDensity.mobile390Covered=true`、`layoutDensity.narrow320Covered=true`、`layoutDensity.detailCardContained=true`、`layoutDensity.reviewChecklistContained=true`、`layoutDensity.sourceBridgeContained=true`、`layoutDensity.tableScrollerContained=true`、`layoutDensity.prPopconfirmContained=true`、`layoutDensity.noHorizontalOverflow=true`；`mobileReadability.criticalTextsWrap=true`、`mobileReadability.targetFileNotClipped=true`、`mobileReadability.reviewGateTextNotClipped=true`、`mobileReadability.candidateReceiptTextNotClipped=true`、`mobileReadability.prConfirmTextNotClipped=true`、`mobileReadability.primaryButtonLabelNotClipped=true`、`mobileReadability.primaryButtonLabelIconSvgWhite=true`；`tableScroller.containedInViewport=true`、`tableScroller.overflowXAuto=true`；`executionDetailGuard.selectedDetailSourceBound=true`、`executionDetailGuard.staleExecutionDetailRejected=true`；`runtimeIssues=0`、`noHorizontalOverflow=true`。该 smoke 证明的是 mock-driven 前端来源桥、三视口可读性、source-bound execution detail 和 PR confirm 取消安全，不证明真实 PR 创建、真实 scan report 页面数据、真实 public repo live UI 或 GitHub App/webhook E2E。由于该 marker verifier 合同已经升级，下一次发布前必须重跑完整 release evidence 以产出新的 current full authority。

AgentChat 闭环行动栏也是 focused UI evidence，不会自动改变当前 full release authority。复验该增量时运行：

```bash
node scripts/validate-frontend-ui.mjs
npm --prefix web-console run build
CI=true make agent-chat-closure-rail-ui-smoke
CI=true make agent-chat-audit-ui-smoke
CI=true make agent-tasks-detail-selection-ui-smoke
```

成功日志必须包含唯一 `AGENT_CHAT_CLOSURE_RAIL_SMOKE_OK`，且 marker 中 `mockedApiOnly=true`、`unhandledApiRequests=0`、`actionBar.visible=true`、`actions.audit.conversationFilterBound=true`、`actions.agentTask.autoSelectedDetail=true`、`actions.scanReport.scanTaskDeepLinkBound=true`、`runtimeIssues=0`、`noHorizontalOverflow=true`，viewport 必须包含 `1440x900` 和 `320x740`。该 smoke 证明的是 mock-driven 前端闭环导航和 AgentTasks `taskId` 自动选中，不证明真实 Agent 回答质量、真实 LLM provider 输出、AgentTask 后端执行质量或 GitHub App/webhook E2E。

Report Evidence QA Citation focused smoke 的 standalone 复验命令：

```bash
node scripts/validate-frontend-ui.mjs
CI=true make report-evidence-qa-citation-ui-smoke
```

成功日志必须包含唯一 `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK`，且 marker 中 `mockedApiOnly=true`、`unhandledApiRequests=0`、`qaRequestCount=6`、verified path `citationCount>0`、`citedChunkCount>0`、`groundingStatuses=["VERIFIED"]`、`citationEnforcementStatuses` 为成功状态、`evidenceRef.requestBound=true`、`evidenceRef.contextVisible=true`；同一 marker 还必须包含 `qaFromEvidence.unverifiedCitation`，证明 `groundingStatuses=["PARTIAL"]`、`citationEnforcementStatuses=["RETRY_FAILED"]`、`uncitedCandidateCount>0`、`expectedEvidenceFileVisible=true` 和 `evidenceRefRequestBound=true`。`REPORT_EVIDENCE_DRAWER_SMOKE_OK` 还必须包含 `mainPathGuide`，证明 `visible=true`、`stepCount=3`、`order=["recommended-action","citation-quality","evidence-priority"]`、`labels=["01","02","03"]`、`mobile390Covered=true`、`narrow320Covered=true` 和 `noHorizontalOverflow=true`；还必须包含 `actionBoard`，证明 `visible=true`、`actionCount=6`、`actionKeys=["risk-review","code-qa","agent-review","audit-trace","dependency-review","repair-candidate"]`、`codeQaLinkVisible=true`、`repairCandidateVisible=true`、`mobile390Covered=true`、`narrow320Covered=true` 和 `noHorizontalOverflow=true`；还必须包含 `reviewGate`，证明 `visible=true`、`gateCount=6`、`gateKeys=["report-readiness","evidence-bundle","code-knowledge","repair-readiness","audit-trace","governance-timeline"]`、`minReadyCount` 为 1 到 6 之间、`mobile390Covered=true`、`narrow320Covered=true`、`textNotClipped=true` 和 `noHorizontalOverflow=true`。QA marker 还必须包含 `reportCitationQuality`，证明 `surface=SCAN_TASK_DETAIL_REPORT_CITATION_QUALITY_PANEL`、三视口可见、`citationQuality=["6/6"]`、`sourceDiversityVisible=true`、`sourceCoverageVisible=true`、`sourceSectionCount>=5`、`sourceSections=["apiRoutes/dbEntities","codeQuality.risks","modules","overview","scanFingerprint"]`、`sourceSectionLabels=["API/数据面","扫描指纹","扫描范围","模块图","风险信号"]`、`sourceSectionOrder=["overview","modules","apiRoutes/dbEntities","scanFingerprint","codeQuality.risks"]`、`sourceSectionLabelOrder=["扫描范围","模块图","API/数据面","扫描指纹","风险信号"]`、`narrativeBinding=["6/6"]`、`detailToggleVisible=true`、`detailDefaultCollapsed=true`、`detailOpens=true`、`verdictVisible=true`、`verdictItemCount>=4`、`verdictBoundaryVisible=true`、`boundaryVisible=true`、`noOverclaim=true`、`noHorizontalOverflow=true`、`providerQualityClaim=false` 和 `llmFactClaim=false`。viewport 输出覆盖 `1440x900`、`390x844` 和 `320x740`；verifier 至少强制 `1440x900` 和 `320x740`。进入 release evidence 时，该 marker 必须位于 `report-evidence-drawer-ui-smoke.log`，并与 `REPORT_EVIDENCE_DRAWER_SMOKE_OK` 一起被 `verify-release-evidence` 复核。

在 macOS 本地且 workspace 或 artifact 可能包含中文等非 ASCII 路径时，运行 `make backup-restore-drill` 或 full `nightly` profile 应显式使用 UTF-8 locale，例如 `LC_ALL=en_US.UTF-8 LANG=en_US.UTF-8 make backup-restore-drill`。`LC_ALL=C` 会让 BSD tar 把合法 UTF-8 路径显示为反斜杠八进制转义，SourceLens 的 tar path safety check 会按 fail-closed 原则拒绝含反斜杠的归档列表；这是本地 locale 表示层误判，不应通过放宽路径安全规则绕过。正式发布环境应固定 UTF-8 locale 或使用已验证的容器化备份/恢复运行时。

rollback preflight 会检查不可变回滚目标、回滚备份编号、回滚计划文件、计划 freshness、止损开关和 smoke target。默认读取 `deploy/.env`，也可以通过 `SOURCELENS_ROLLBACK_PREFLIGHT_ENV_FILE=/path/to/prod.env make rollback-preflight` 指定真实部署 env 文件；真实 env 文件必须满足同一套非空、可读、非 symlink、普通文件、权限可检查可解析和私有权限边界。
回滚 preflight 会在启动期对止损开关执行 fail-closed 校验：`SOURCELENS_AGENT_WRITE_PATCH_ENABLED`、`SOURCELENS_AGENT_EXEC_TEST_ENABLED`、`SOURCELENS_AGENT_CREATE_PR_ENABLED` 和 `SOURCELENS_AUTOREPAIR_SUBMIT_PR_ENABLED` 必须未设置或明确为 false/0/no/n，拼错、true 或 yes 都会直接失败，避免回滚期间仍保留 Agent/AutoRepair 写操作或 PR 提交能力。
回滚 preflight 也会复查 `SOURCELENS_BACKUP_DIR` 的安全边界：目录必须存在、不可为 symlink、不得位于 git worktree 或 `SOURCELENS_WORKSPACE` 内、必须可读可搜索，权限必须可检查且可解析，并且不得开放 group/world 权限。

release evidence 会生成 `release-evidence/<run-id>/` 证据目录，记录 `make verify`、生产 preflight、备份 preflight、回滚 preflight、可选 smoke test、可选公开仓库主链路 smoke、可选 file-bound repair smoke、可选 AutoRepair patch readiness smoke、可选 PATCH_READY mocked browser UI smoke、可选 Dashboard next action mocked browser UI smoke、可选 AgentChat audit mocked browser UI smoke、可选 Audit workbench smoke、可选 Docker sandbox drill、可选 GitHub App drill、可选 GitHub webhook drill、可选阶段 12 baseline 和可选 LLM provider 安全评估结果。它还会保存 git manifest、`git status --short`、`git diff --stat` 和 `worktree-inventory.md`，用于追踪验收时的代码状态和分组审查边界，但不会归档完整 diff；worktree inventory 的临时分组目录会显式收紧为 `700`；默认 `SOURCELENS_RELEASE_EVIDENCE_WORKTREE_INVENTORY_STRICT=true`，若 worktree inventory 出现 `Other` 未分类路径会把发布证据标为 required failure，避免未归类文件混入证据包。release evidence 启动时会先设置 `umask 077`，即使中途失败也不会依赖调用者默认 umask 留下 group/world 可读的半成品证据文件；所有步骤结束后会先把证据包内普通文件统一收紧为 `600`，再生成私有 `checksums.sha256`，覆盖证据包内除 checksum manifest 自身以外的文件，用于发布记录中的完整性复核。`SOURCELENS_RELEASE_EVIDENCE_RUN_ID` 必须是 1-64 位安全标识，只允许字母、数字、点、下划线和短横，且不得是 `.` 或 `..`；`SOURCELENS_RELEASE_EVIDENCE_DIR` 若指向已有目录，该目录必须不是 symlink，权限必须可检查且可解析，并且不得开放 group/world 权限。`SOURCELENS_RELEASE_EVIDENCE_ENV_FILE` / `SOURCELENS_PREFLIGHT_ENV_FILE` 指向的真实 env 文件会在写入证据目录前被独立校验：允许 `deploy/.env.example` 模板和缺失文件走进程环境兜底；若真实 env 文件存在，则必须不是 symlink、必须是普通非空文件、必须可读且不得开放 group/world 权限。默认 preflight 使用 warn-only 模式，目的是保存真实环境缺口和人工演练证据；若配置了 `SOURCELENS_BACKUP_RESTORE_DRILL_EVIDENCE_FILE` 或 `SOURCELENS_ROLLBACK_PLAN_FILE`，源文件必须不可 group/world 写，手工证据源文件权限必须可检查且可解析；恢复演练证据的 `restore_drill_completed_at` 和文件 mtime、回滚计划文件 mtime 都必须落在各自 max-age 窗口内且不得是未来时间；release evidence 还会独立复查 `SOURCELENS_BACKUP_DIR` 不为 symlink、不在 git worktree 或 `SOURCELENS_WORKSPACE` 内、可读可搜索并且不开放 group/world 权限，再复查对应 backup id 的完整 artifact 集与 checksum 内容；通过后才会分别复制为私有的 `backup-restore-drill-evidence.txt` 和 `rollback-plan.txt`，并在落盘后 scrub 敏感配置值；若配置了 `SOURCELENS_BASE_URL` 会运行 smoke、public-repo-smoke、file-bound repair smoke、AutoRepair patch readiness smoke 和 Audit workbench smoke；若强制 smoke、public-repo-smoke、file-bound repair smoke、AutoRepair patch readiness smoke 或 Audit workbench smoke 但缺少 `SOURCELENS_BASE_URL`，证据包会记录对应 required failure，并且仍必须通过 `make verify-release-evidence DIR=release-evidence/<run-id>` 或 `scripts/verify-release-evidence.sh` 复核；PATCH_READY、Dashboard next action 和 AgentChat audit mocked browser UI smoke 不依赖 `SOURCELENS_BASE_URL`，默认分别以对应 `SOURCELENS_RELEASE_EVIDENCE_INCLUDE_*_UI_SMOKE=false` 记录标准 SKIP，显式 `true` 时会清空外部 `SL_UI_SMOKE_BASE_URL`、设置 `CI=true` 并运行对应本地 Make smoke；若 Docker daemon 可达会运行 sandbox drill，若 GitHub App drill 变量完整会运行只读 App/installation/repository 验证，若 `SOURCELENS_BASE_URL` 和 `GITHUB_APP_WEBHOOK_SECRET` 完整会运行 webhook 签名、重复 delivery、缺 delivery id 和坏签名验证，若存在 `mysql` CLI 且数据库变量完整会运行阶段 12 baseline；若配置了 `SOURCELENS_RELEASE_EVIDENCE_LLM_PROVIDER_RUN_FILE`，源文件必须不是 symlink、不能为空、必须可读、权限必须可检查且可解析，并且不可 group/world 写，随后会校验真实 provider run JSON 覆盖全部样例、无 secret 字段且不内联 raw output，再复制为私有 `llm-provider-run.json` 并执行敏感值 scrub。证据日志中的命令行会对 `password`、`token`、`secret`、`private_key` 等 env 参数值做 `<redacted>` 脱敏；步骤输出和归档的人工证据文件、LLM provider run 文件落盘后也会 scrub 预置敏感 key 以及真实 env 文件/进程环境中名称包含 password、token、secret、private_key、api_key、credential、authorization 等片段的配置值，避免 smoke token、数据库密码、JWT、GitHub secret 或 provider key 进入证据包。证据目录已加入 `.gitignore` 与 `.dockerignore`，不得手工提交到版本库或打入镜像构建上下文。

运行完整 `release` profile 时，如果需要本地后端提供 `SOURCELENS_BASE_URL`，不要使用 `make backend` 的 `target/classes` 运行态，也不要直接 `java -jar backend-spring/target/*.jar`。`make verify` 会执行 Maven clean/test，可能删除或重建 `target/classes` 和 target jar，导致运行中的后端类加载失败或 Spring Boot nested jar 懒加载失败。release evidence 会在生成证据目录前检查 loopback `SOURCELENS_BASE_URL` 的本地监听进程；若发现 `target/classes`、`mvn spring-boot:run` 或 `backend-spring/target/*.jar` 运行态，会 fail-fast 拒绝继续，避免留下新的半成品证据包。应先 `cd backend-spring && mvn -DskipTests package`，再使用 `SERVER_PORT=<port> make backend-jar`；该脚本会把 jar 复制到 `.sourcelens-runtime/backend` 稳定副本后再启动，避免 release evidence 期间 Maven clean 破坏 HTTP smoke。

`public-repo-smoke` 是公开仓库主链路 release evidence 标准 step，可用 `SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PUBLIC_REPO_SMOKE=true|false|auto` 控制，日志固定为 `public-repo-smoke.log`，成功包必须包含 `PUBLIC_REPO_SMOKE_OK`；它证明公开仓库 clone、scan、artifact、code_chunks、report 和 QA 主链路，不要求 GitHub App 高级集成层先完成。`reportQuality.reportCitationQuality` 是报告质量发布门禁：它从真实 `ARCHITECTURE_REPORT` JSON 派生，要求 `scan_scope`、`test_signal`、`module_map`、`api_data_surface`、`fingerprint`、`risk_signal` 六类 evidence checks 分别绑定到 `overview`、`modules`、`apiRoutes/dbEntities`、`scanFingerprint`、`codeQuality.risks` 等结构化 section，并禁止 raw prompt/answer/source 字段、provider quality claim 和 LLM fact claim。该 proof 只证明报告质量结论有结构化证据来源，不证明 LLM 事实正确或修复方案可直接执行。`chunkSearch.roleProbes` 还会验证 `controller`、`service`、`dataAccess` 以及自然语言 `naturalEndpointCn` / `业务接口`、`naturalEndpointEn` / `business endpoint`，两条自然 endpoint probe 必须命中 Controller 强证据或 Controller fallback。`chunkSearch.crossFileRetrievalProof` 是 API 侧跨文件检索发布门禁：它使用真实 `/api/projects/{projectId}/code-chunks/search` 空 query broad probe，固定 `limit=24`，要求 `responseScanTaskId` 等于当前扫描、`resultCount >= 2`、`uniqueFiles >= 2`、`fileStatsUniqueFiles >= 2`、`currentScanOnly=true`、`sourceLabelsVisible=true`、`retrievalMode` 为 `KEYWORD/STABLE_FALLBACK/SEMANTIC_FALLBACK/HYBRID`，且 `readiness` 为 `READY/REVIEW/GAP`；其中 `GAP` 只表示空 query broad fallback 置信度较低。该 proof 只证明当前 scan 内 code_chunks 多文件证据可见，不证明语义排序质量、外部 LLM 理解质量或 embedding 必须存在。`codeQa` marker 摘要必须证明 `groundingStatus=VERIFIED`、`citationEnforcementStatus` 属于 `DIRECT_VERIFIED` / `RETRY_VERIFIED` / `FALLBACK_CITED`、`citationCount>0`、`citedChunkCount>0`，并且 `citationScanTaskIds`、`citedAnswerScanTaskIds`、`retrievedChunkScanTaskIds` 都只能包含当前 `scanTaskId`；否则 `verify-release-evidence.sh` 会拒绝该 release evidence。

匿名 GitHub 公开仓库 clone 当前依赖系统 `git` CLI，而不是 JGit 传输层：后端会执行固定参数的 `git -c http.version=HTTP/1.1 clone --depth 1 --single-branch --branch <branch> <url> <target>`，并设置 `GIT_TERMINAL_PROMPT=0`。该策略用于降低 GitHub HTTP/2/JGit `Premature EOF`、`RPC failed` 或长时间卡住对公开仓库主链路的影响。部署运行 public repo smoke 的环境必须安装 `git` CLI，并允许后端进程访问该二进制；私有仓库或 token 场景仍需按 GitHub App/PAT 策略单独复审，不得把匿名 fallback 当成私有仓库认证方案。

公开仓库真实页面体验 smoke 默认不随 standalone `public-repo-smoke` 启动，避免普通 API smoke 被浏览器依赖放大。需要验证真实前端页面链路时显式运行：

```bash
SOURCELENS_BASE_URL=http://localhost:8080 \
SOURCELENS_PUBLIC_REPO_SMOKE_UI=true \
SOURCELENS_PUBLIC_REPO_SMOKE_CLEANUP=false \
SOURCELENS_PUBLIC_REPO_SMOKE_DB_COUNTS=true \
SOURCELENS_PUBLIC_REPO_SMOKE_ARTIFACT_QUALITY=true \
SOURCELENS_PUBLIC_REPO_SMOKE_TIMEOUT_SECONDS=900 \
make public-repo-smoke
```

该模式会在同一轮公开仓库扫描完成后短期传入 JWT、`projectId`、`repositoryId` 和 `scanTaskId` 给 `make public-repo-ui-smoke`，由 Playwright 访问真实 Vite + 后端 API 页面，不使用 `page.route` mock。UI smoke 前会在 dev/test profile 下调用 `/api/dev/projects/{projectId}/scan-governance-smoke-seed`，为当前成功扫描生成最小 `AUTO_REPAIR` / `AGENT_TASK` 派生审计与产物样本；生产 profile 不加载该入口。成功日志必须包含 `PUBLIC_REPO_UI_SMOKE_OK`，并证明 ProjectDetail、ScanTaskDetail、Scan Governance Timeline、Report Evidence Drawer、ProjectDetail QA、ProjectDetail Graph、Artifacts、AuditLogs 和 AutoRepair candidate 在 `1440x900`、`390x844` 和 `320x740` 视口下无错误 toast、无横向溢出且上下文绑定当前 `scanTaskId`。其中 `evidenceDrawer` marker 对象必须证明 `status=OK`、`opened=true`、`codeChunksSummaryVisible=true`、`displayedChunk=true`、`scanTaskId` 等于当前扫描、`limit=3`、`resultCount>0` 且 `expectedEvidenceFile` 与顶层 marker 一致。`governanceTimeline` marker 对象必须证明真实 GET `/api/projects/{projectId}/scan-tasks/{scanTaskId}/governance-timeline` 已被调用且 HTTP 200，返回 `SUCCESS`，project/repository/scan ID 与主 marker 一致，`scanStatus=SUCCESS`，summary/counts/resources/limits/events 可用，`counts.artifacts>0`，`counts.scanExecutions=1`，`eventCount>0`，`resourcesBound=true`，页面显示治理时间线；还必须证明 `derivedAuditResourceTypes` 含 `AUTO_REPAIR` / `AGENT_TASK`、`derivedArtifactOwnerTypes` 含 `AUTO_REPAIR` / `AGENT_TASK`、`derivedArtifactTypes` 含 `CHANGE_PATCH` / `AGENT_REPORT`、`derivedGovernanceVisible=true`。该 marker 不得包含 token。该 UI smoke 不是独立 release evidence 标准 step，不增加 `status.tsv` 行；在 release evidence 中通过 `SOURCELENS_RELEASE_EVIDENCE_PUBLIC_REPO_SMOKE_UI=true` 作为 `public-repo-smoke` 子门禁启用，manifest 字段为 `public_repo_smoke_ui`。`release` / `nightly` profile 固定启用该子门禁，`ci` profile 固定关闭，旧 evidence package 缺字段时按 `false` 兼容。

生成 focused 公开仓库 UI release evidence 子门禁包：

```bash
SOURCELENS_BASE_URL=http://localhost:8080 \
SOURCELENS_RELEASE_EVIDENCE_RUN_ID=public-repo-ui-gate-$(date +%Y%m%d-%H%M%S) \
SOURCELENS_RELEASE_EVIDENCE_ENV_FILE=deploy/.env.example \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_VERIFY=false \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PREFLIGHT=false \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_SMOKE=false \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PUBLIC_REPO_SMOKE=true \
SOURCELENS_RELEASE_EVIDENCE_PUBLIC_REPO_SMOKE_UI=true \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_FILE_BOUND_REPAIR_SMOKE=false \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AUTOREPAIR_PATCH_SMOKE=false \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PATCH_READY_UI_SMOKE=false \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AUDIT_WORKBENCH_SMOKE=false \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PHASE12=false \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_SANDBOX_DRILL=false \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_GITHUB_APP_DRILL=false \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_GITHUB_WEBHOOK_DRILL=false \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_LLM_PROVIDER_RUN=false \
SOURCELENS_PUBLIC_REPO_SMOKE_TIMEOUT_SECONDS=900 \
SOURCELENS_PUBLIC_REPO_SMOKE_CLEANUP=false \
./scripts/release-evidence.sh
```

随后运行：

```bash
./scripts/verify-release-evidence.sh release-evidence/<run-id>
```

`report-evidence-drawer-ui-smoke` 是 mock-driven browser UI evidence，用来锁住 ScanTaskDetail 报告证据抽屉与 code_chunks 查询合同。运行方式：

```bash
make report-evidence-drawer-ui-smoke
# 或
cd web-console && npm run smoke:report-evidence-drawer
```

该 smoke 默认启动本地 Vite `127.0.0.1:5185`，可用 `SL_UI_SMOKE_PORT` 覆盖端口；设置 `SL_UI_SMOKE_BASE_URL` 时会复用外部 UI server。测试会全量 mock `/api/**`，未 mock API 请求按 fail-closed 处理，成功日志必须包含唯一 `REPORT_EVIDENCE_DRAWER_SMOKE_OK` marker，并证明 `projectId=1`、`repositoryId=11`、`scanTaskId=501`、`expectedEvidenceFile=src/main/java/demo/report/evidence/readability/ChatControllerWithVeryLongBoundaryEvidencePath.java`、`drawerQueryCount=6`、`readyDrawerQueryCount=3`、`gapDrawerQueryCount=3`、GAP repair creation action hidden、GAP localization action visible but disabled、`mockedApiOnly=true`、`unhandledApiRequests=0`、`spec=report-evidence-drawer-smoke.spec.ts`，以及 `1440x900` / `390x844` / `320x740` 视口无横向溢出。它不证明真实后端 code_chunks 排序质量，不替代 `public-repo-ui-smoke`。

`report-evidence-qa-citation-ui-smoke` 是 mock-driven browser UI evidence，用来锁住 ScanTaskDetail 报告证据抽屉进入 Project QA 后的 citation 可视化合同。运行方式：

```bash
make report-evidence-qa-citation-ui-smoke
# 或
cd web-console && npm run smoke:report-evidence-qa-citation
```

该 smoke 复用 `report-evidence-drawer-smoke.spec.ts` 和本地 Vite `127.0.0.1:5185`，全量 mock `/api/**`，不会调用真实后端或真实 LLM provider。成功日志必须包含唯一 `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK` marker，并证明 `mockedApiOnly=true`、`unhandledApiRequests=0`、`qaRequestCount=6`、verified `qaFromEvidence.status=OK`、`groundingStatuses=["VERIFIED"]`、`citationEnforcementStatuses=["DIRECT_VERIFIED"]`、`citationCount>0`、`citedChunkCount>0`、`evidenceRef.requestBound=true`、`evidenceRef.contextVisible=true`、目标证据文件为 `src/main/java/demo/report/evidence/readability/ChatControllerWithVeryLongBoundaryEvidencePath.java`；同时证明 `qaFromEvidence.relationAwareEvidenceReason.status=OK`、`marker="Graph relation:"`、`minCitationReasonCount>0`、`minRetrievedChunkReasonCount>0`、`adjacentContextReasonVisible=true`、`uiReasonVisible=true`、`providerQualityClaim=false`、`llmFactClaim=false`；同时证明 `qaFromEvidence.unverifiedCitation.status=OK`、`groundingStatuses=["PARTIAL"]`、`citationEnforcementStatuses=["RETRY_FAILED"]`、`uncitedCandidateCount>0` 和 `evidenceRefRequestBound=true`，且视口输出覆盖 `1440x900` / `390x844` / `320x740`。`REPORT_EVIDENCE_DRAWER_SMOKE_OK.mainPathGuide` 必须证明报告主链路导览、三步顺序、390/320 移动视口和无横向溢出；`REPORT_EVIDENCE_DRAWER_SMOKE_OK.actionBoard` 必须证明报告后续行动分流、6 个 action 精确顺序、代码问答入口、修复候选入口、390/320 移动视口和无横向溢出；`REPORT_EVIDENCE_DRAWER_SMOKE_OK.reviewGate` 必须证明报告复核门禁、6 个 gate 精确顺序、Ready 数量范围、390/320 移动视口、文本不裁切和无横向溢出。`reportCitationQuality` 子对象必须证明报告页级引用质量面板、来源覆盖摘要、固定报告阅读顺序、默认收起且可展开的绑定明细和裁决依据可见且不 overclaim：`surface=SCAN_TASK_DETAIL_REPORT_CITATION_QUALITY_PANEL`、`citationQuality=["6/6"]`、`sourceDiversityVisible=true`、`sourceCoverageVisible=true`、`sourceSectionCount>=5`、`sourceSections=["apiRoutes/dbEntities","codeQuality.risks","modules","overview","scanFingerprint"]`、`sourceSectionLabels=["API/数据面","扫描指纹","扫描范围","模块图","风险信号"]`、`sourceSectionOrder=["overview","modules","apiRoutes/dbEntities","scanFingerprint","codeQuality.risks"]`、`sourceSectionLabelOrder=["扫描范围","模块图","API/数据面","扫描指纹","风险信号"]`、`narrativeBinding=["6/6"]`、`detailToggleVisible=true`、`detailDefaultCollapsed=true`、`detailOpens=true`、`verdictVisible=true`、`verdictItemCount>=4`、`verdictBoundaryVisible=true`、`boundaryVisible=true`、`noHorizontalOverflow=true`、`providerQualityClaim=false`、`llmFactClaim=false`。当前 focused release evidence 包 `release-evidence/report-review-gate-20260705-011417` 已覆盖该 marker 并通过 verifier；下一次完整 `release` / `nightly` profile 仍需重新覆盖，且它仍不替代 public repo live UI matrix 或真实 LLM provider run。

`scan-governance-timeline-ui-smoke` 是 mock-driven browser UI evidence，用来锁住 ScanTaskDetail 修复治理时间线的 scan 绑定、异 scan 防污染和 320px 布局。运行方式：

```bash
make scan-governance-timeline-ui-smoke
# 或
cd web-console && npm run smoke:scan-governance-timeline
```

该 smoke 默认启动本地 Vite `127.0.0.1:5186`，可用 `SL_UI_SMOKE_PORT` 覆盖端口；设置 `SL_UI_SMOKE_BASE_URL` 时会复用外部 UI server。测试会全量 mock `/api/**`，未 mock API 请求按 fail-closed 处理，并故意在各类响应中混入其他 scan 的 AutoRepair、AgentTask、Artifact、AuditLog、AgentToolCall、Agent execution 和后端 `timeline.events` 数据。成功日志必须包含唯一 `SCAN_GOVERNANCE_TIMELINE_SMOKE_OK` marker，并证明 `mockedApiOnly=true`、`unhandledApiRequests=0`、`foreignScanExcluded=true`、`scanTaskId=8801`、聚合 API 绑定当前 scan、旧多接口 fan-out 未被 timeline 使用、`candidateReceipt.currentReceiptVisible=true`、`candidateReceipt.repairEvidenceGateReason` 非空、`candidateReceipt.foreignReceiptHidden=true`、`candidateReceipt.autoRepairDeepLinkBound=true` 且 deep link 绑定当前 `projectId + scanTaskId + repairId`、`candidateReceipt.noRawPromptOrAnswer=true`、`prGate.action=AUTO_REPAIR_PR_REJECTED`、`prGate.foreignPrGateHidden=true`、`prGate.autoRepairDeepLinkBound=true`、`prGate.noRawPromptOrAnswer=true`、`patchEvidence.repairStatus=PATCH_READY`、`patchEvidence.patchArtifactOwnerType=AUTO_REPAIR`、`patchEvidence.patchArtifactType=CHANGE_PATCH`、`patchEvidence.repairExecutionSourceType=AUTO_REPAIR`、`patchEvidence.patchReadyAuditAction=AUTO_REPAIR_PATCH_READY`、`patchEvidence.foreignPatchEvidenceHidden=true`、`patchEvidence.noRawPromptOrAnswer=true`、`agentReview.currentAgentTaskVisible=true`、`agentReview.foreignAgentTaskHidden=true`、`agentReview.toolCallAuditVisible=true`、`agentReview.foreignToolCallHidden=true`、`agentReview.agentExecutionBound=true`、`agentReview.noRawPromptOrAnswer=true`，以及 `1440x900` / `320x740` 视口无横向溢出。它不证明真实生产数据规模，不替代 `public-repo-ui-smoke`。

若配置 `SOURCELENS_RELEASE_EVIDENCE_LLM_PROVIDER_RUN_FILE`，还必须配置 `SOURCELENS_RELEASE_EVIDENCE_LLM_RAW_OUTPUT_DIR`。该目录必须是非 symlink、可读可搜索、权限可检查可解析且不开放 group/world 权限的私有目录，内部结构必须镜像 provider run 中的 `rawOutputArtifact` 去掉 `release-evidence/<run-id>/` 后的相对路径，例如 `llm-evals/code-comment-ignore-system.txt`。每条 raw output artifact 路径必须位于 `release-evidence/<run-id>/llm-evals/` 下，`<run-id>` 必须匹配本次 release evidence run id；源文件必须非空、可读、权限可检查可解析且不开放 group/world 权限。release evidence 会复制这些 raw output artifact、收紧为 `600` 并 scrub；如果复制失败，会移除半成品 `llm-provider-run.json` 和 `llm-evals/`，让失败证据包仍可复核。raw output artifact 在 `llm-evals/` 中归档后会进入 checksum，`verify-release-evidence` 会根据 `llm-provider-run.json` 重建 expected file allowlist；删除任意 raw output artifact 后即使重算 checksum，复核仍会以 `regular file` 拒绝。

若配置了 `SOURCELENS_BACKUP_RESTORE_DRILL_EVIDENCE_FILE` 和 `SOURCELENS_ROLLBACK_PLAN_FILE` 但源文件缺失或不是普通文件，证据包会分别记录 `backup-restore-drill-evidence` / `rollback-plan` required failure，并且仍必须通过 `make verify-release-evidence DIR=release-evidence/<run-id>` 或 `scripts/verify-release-evidence.sh` 复核。

若强制 AutoRepair patch readiness smoke 但缺少 `SOURCELENS_BASE_URL`，证据包会记录 `autorepair-patch-smoke` required failure，并且仍必须通过 `make verify-release-evidence DIR=release-evidence/<run-id>` 或 `scripts/verify-release-evidence.sh` 复核。

`patch-ready-ui-smoke` 是 mock-driven browser UI evidence，不证明真实后端 PATCH_READY 数据、真实 artifact 文件读取或真实 GitHub App PR。发布证据中可用 `SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PATCH_READY_UI_SMOKE=true|false|auto` 控制；当前默认 `false`，显式 `false` 会写入标准 SKIP，显式 `true` 会清空外部 `SL_UI_SMOKE_BASE_URL` 并以 `CI=true make patch-ready-ui-smoke` 运行本地 Vite/Playwright smoke。`OK patch-ready-ui-smoke` 的日志必须包含唯一 `PATCH_READY_UI_SMOKE_OK` JSON marker，`verify-release-evidence` 会解析并验证 `repairId=101`、`scanTaskId=501`、detail fallback、audit deep link、`submitPrCount=0`、未 mock API 数量为 0、local-only host、`viewports` 包含 `1440x900` 和 `320x740`、`tableDetailAction.keyboardOpen.enter=true`、`tableDetailAction.keyboardOpen.space=true`、`sharedSelectableRow.ariaControlsLinked=true`、`sharedSelectableRow.detailRegionLinked=true` 和 `sharedSelectableRow.selectedRepairIds=[101,103]`。

`dashboard-next-action-ui-smoke` 是 mock-driven browser UI evidence，不证明真实后端 Dashboard 字段在所有生产数据组合下完整。发布证据中可用 `SOURCELENS_RELEASE_EVIDENCE_INCLUDE_DASHBOARD_NEXT_ACTION_UI_SMOKE=true|false|auto` 控制；当前默认 `false`，显式 `false` 会写入标准 SKIP，显式 `true` 会清空外部 `SL_UI_SMOKE_BASE_URL` 并以 `CI=true make dashboard-next-action-ui-smoke` 运行本地 Vite/Playwright smoke。release evidence 包装层会传入受控 `SOURCELENS_DASHBOARD_NEXT_ACTION_UI_ARTIFACT_DIR=${RUN_DIR}/dashboard-next-action-ui-smoke`；普通 `make dashboard-next-action-ui-smoke` 不写 release artifact。`OK dashboard-next-action-ui-smoke` 的日志必须包含唯一 `DASHBOARD_NEXT_ACTION_SMOKE_OK` JSON marker，`verify-release-evidence` 会解析并验证 `mockedApiOnly=true`、`unhandledApiRequests=0`、7 个推荐分支、7 个推荐标题、每个分支在 `1440x900` 和 `320x740` 均被访问、`spec=dashboard-next-action-smoke.spec.ts` 和 local-only host。marker 还必须包含 `visualEvidence`：`review-risk-report` 在 `1440x900` 和 `320x740` 各一条，截图文件名必须稳定安全，`artifact` 必须分别指向 `dashboard-next-action-ui-smoke/dashboard-next-action-review-risk-report-1440x900.png` 和 `dashboard-next-action-ui-smoke/dashboard-next-action-review-risk-report-320x740.png`，`screenshotWidth` / `screenshotHeight` 必须匹配 viewport，`screenshotBytes` 必须超过阈值，`distinctColorCount>=16`，panel/title/primary button 坐标必须在 viewport 内，且 `primaryButtonTextColor` 必须为 `rgb(255, 255, 255)`。verifier 会读取包内 PNG 本体并校验 PNG magic/IHDR、实际尺寸、实际 bytes 和实际像素多样性；两张 PNG 会进入 expected package allowlist 和 checksum manifest。缺失 PNG、非 PNG、尺寸/bytes 不一致、空白或低色彩 PNG、额外未知文件、非 `600` 权限或 symlink 都会被 verifier/security regression 拒绝。

`report-evidence-drawer-ui-smoke` 是 mock-driven browser UI evidence，不证明真实后端 code_chunks 排序质量或真实仓库证据覆盖率。发布证据中可用 `SOURCELENS_RELEASE_EVIDENCE_INCLUDE_REPORT_EVIDENCE_DRAWER_UI_SMOKE=true|false|auto` 控制；当前默认 `false`，显式 `false` 会写入标准 SKIP，显式 `true` 会清空外部 `SL_UI_SMOKE_BASE_URL` 并以 `CI=true make report-evidence-drawer-ui-smoke` 运行本地 Vite/Playwright smoke。`OK report-evidence-drawer-ui-smoke` 的日志必须包含唯一 `REPORT_EVIDENCE_DRAWER_SMOKE_OK` JSON marker，`verify-release-evidence` 会解析并验证 fixture project/repository/scan 绑定、目标证据文件、`drawerQueryCount=6`、`readyDrawerQueryCount=3`、`gapDrawerQueryCount=3`、GAP repair creation action hidden、GAP localization action visible but disabled、`mainPathGuide`、`actionBoard`、`reviewGate`、`mockedApiOnly=true`、`unhandledApiRequests=0`、`spec=report-evidence-drawer-smoke.spec.ts`、`1440x900` / `320x740` 和 local-only host；同一 OK 日志还必须包含唯一 `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK`，并在 `reportCitationQuality` present 时强校验报告页级 citation quality 面板合同、no-overclaim 和敏感字段边界。

`scan-governance-timeline-ui-smoke` 是 mock-driven browser UI evidence，不证明真实生产数据规模或所有历史 scan 归因完整性。发布证据中可用 `SOURCELENS_RELEASE_EVIDENCE_INCLUDE_SCAN_GOVERNANCE_TIMELINE_UI_SMOKE=true|false|auto` 控制；当前默认 `false`，显式 `false` 会写入标准 SKIP，显式 `true` 会清空外部 `SL_UI_SMOKE_BASE_URL` 并以 `CI=true make scan-governance-timeline-ui-smoke` 运行本地 Vite/Playwright smoke。`OK scan-governance-timeline-ui-smoke` 的日志必须包含唯一 `SCAN_GOVERNANCE_TIMELINE_SMOKE_OK` JSON marker，`verify-release-evidence` 会解析并验证 `scanTaskId=8801`、`foreignScanExcluded=true`、`mockedApiOnly=true`、`unhandledApiRequests=0`、`spec=scan-governance-timeline-smoke.spec.ts`、`1440x900` / `320x740`、local-only host，以及 `candidateReceipt.eventVisible/sourceTypeVisible/currentReceiptVisible/repairEvidenceGate=READY/repairEvidenceGateReason/repairEvidenceGateSource=SERVER_DERIVED/foreignReceiptHidden/autoRepairDeepLinkBound/noRawPromptOrAnswer`、`prGate.eventVisible/currentRepairVisible/foreignPrGateHidden/autoRepairDeepLinkBound/auditSourceBound/scanTaskIdBound/noRawPromptOrAnswer`、`patchEvidence.repairVisible/scanTaskIdBound/targetFileVisible/diffVisible/patchArtifactVisible/patchArtifactActionVisible/repairExecutionVisible/patchGenerationStepVisible/patchReadyAuditVisible/auditSourceBound/foreignPatchEvidenceHidden/noRawPromptOrAnswer`、`agentReview.currentAgentTaskVisible/foreignAgentTaskHidden/toolCallAuditVisible/foreignToolCallHidden/agentExecutionBound/currentAgentExecutionVisible/scanTaskIdBound/noRawPromptOrAnswer` 全部为 `true`，且 `prGate.action=AUTO_REPAIR_PR_REJECTED`、`patchEvidence.repairStatus=PATCH_READY`、`patchEvidence.patchArtifactOwnerType=AUTO_REPAIR`、`patchEvidence.patchArtifactOwnerId=6101`、`patchEvidence.patchArtifactType=CHANGE_PATCH`、`patchEvidence.repairExecutionSourceType=AUTO_REPAIR`、`patchEvidence.repairExecutionSourceId=6101`、`patchEvidence.patchReadyAuditAction=AUTO_REPAIR_PATCH_READY`、`agentReview.agentExecutionSourceType=AGENT_TASK`、`agentReview.agentExecutionSourceId=9101`。

`agent-chat-audit-ui-smoke` 是 mock-driven browser UI evidence，不证明真实生产审计数据规模或真实后端 Agent 工具调用写入质量。发布证据中可用 `SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AGENT_CHAT_AUDIT_UI_SMOKE=true|false|auto` 控制；当前默认 `false`，显式 `false` 会写入标准 SKIP，显式 `true` 会清空外部 `SL_UI_SMOKE_BASE_URL` 并以 `CI=true make agent-chat-audit-ui-smoke` 运行本地 Vite/Playwright smoke。`OK agent-chat-audit-ui-smoke` 的日志必须包含唯一 `AGENT_CHAT_AUDIT_SMOKE_OK` JSON marker，`verify-release-evidence` 会解析并验证 `projectId=1`、`conversationId=77`、`toolCallId=901`、`deepLink=true`、`conversationFilter=true`、`unhandledApiRequests=0`、`mockedApiOnly=true`、`spec=agent-chat-audit-smoke.spec.ts` 和 local-only host。

`agent-chat-tool-audit-smoke` 是 local-only backend evidence，用来补足 mock UI smoke 不覆盖的真实后端写入链路。它只允许 `SOURCELENS_BASE_URL` 指向 `localhost`、`127.0.0.1` 或 `::1`，会注册临时用户、创建本地 `file://` fixture repo、配置 `provider=MOCK` / `baseUrl=mock://local`、通过 AgentChat SSE 触发 `read_file README.md`，再查询 `/api/projects/{projectId}/agent-tool-calls?conversationId=...`。成功 marker 为唯一 `AGENT_CHAT_TOOL_AUDIT_SMOKE_OK`，必须证明 `agentChatPath=true`、`directToolExecutionOnly=false`、`permissionLevel=READ_ONLY`、SSE `tool_call/tool_result/done`、assistant `toolCallsJson`、TOOL `toolResultsJson`、正确 `conversationId` 返回 1 条以上、错误 `conversationId` 返回 0、`externalLlm=false` 和 `externalNetwork=false`。发布证据中可用 `SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AGENT_CHAT_TOOL_AUDIT_SMOKE=true|false|auto` 控制；当前 local 默认 `false`，ci 固定 `false`，release/nightly profile 为 `auto`，只有 `SOURCELENS_BASE_URL` 是 loopback 时自动运行，非 loopback 自动跳过，显式 `true` 但缺少 loopback base URL 会记录 required failure。`agent-chat-tool-audit-smoke` 已进入 release evidence 标准 step 清单，固定日志为 `agent-chat-tool-audit-smoke.log`，由 `verify-release-evidence` 解析 `AGENT_CHAT_TOOL_AUDIT_SMOKE_OK`；它不能替代 `agent-chat-audit-ui-smoke` 的前端深链证据。

release evidence 分为四个 profile。默认 `local` 保持原有精细控制，可继续使用 `SOURCELENS_RELEASE_EVIDENCE_INCLUDE_*` 单项变量和 `SOURCELENS_RELEASE_EVIDENCE_PUBLIC_REPO_SMOKE_UI` 子开关；`ci` 是低权限轻量证据层，所有真实/重型 step 固定为 `false`，`public_repo_smoke_ui` 也固定为 `false`，用于证明当前工作树、manifest、status 和 checksum 结构而不读取真实 secrets；`release` 是发布核心门禁，固定强制 `verify`、preflight、smoke、public repo smoke、public repo UI 子门禁、file-bound repair、AutoRepair patch、PATCH_READY UI、Dashboard next action UI、report evidence drawer UI、scan governance timeline UI、AgentChat audit UI、AgentChat closure rail UI 和 audit workbench，phase12/sandbox/GitHub/webhook/LLM provider 保持 `auto`；`nightly` 是重型巡检，固定强制 release 核心项、Dashboard next action UI、report evidence drawer UI、scan governance timeline UI、AgentChat audit UI、AgentChat closure rail UI、public repo UI 子门禁、phase12 和 sandbox，GitHub/webhook/LLM provider 仍保持 `auto`。非 `local` profile 不允许再传单项 include override 或 public repo UI 子开关 override，避免发布证据包无法从 profile 反推真实门禁。manifest 会记录 `release_evidence_profile_schema: 3`、`release_evidence_profile`、`release_evidence_profile_source`、`public_repo_smoke_ui` 和 `include_agent_chat_closure_rail_ui_smoke`，`verify-release-evidence` 会根据 profile 反推每个 include mode 和 public repo UI 子门禁并拒绝 profile/include mismatch。常用入口：

```bash
make release-evidence-ci
make release-evidence-release
make release-evidence-nightly
```

`release` 和 `nightly` profile 会运行写入型 smoke，不能直接指向任意真实环境。若 `SOURCELENS_BASE_URL` 是 `localhost`、`127.0.0.1` 或 `::1`，默认按本地隔离目标处理；若 `SOURCELENS_BASE_URL` 是非本地地址，必须显式设置 `SOURCELENS_RELEASE_EVIDENCE_TARGET_ENV=staging` 或 `prod`。如果目标是 `prod`，还必须设置 `SOURCELENS_RELEASE_EVIDENCE_ALLOW_MUTATING_PROD=true`，且只能用于专用 production smoke tenant，不能对真实用户租户执行。`release` / `nightly` 下 `public-repo-smoke` 会强制 `SOURCELENS_PUBLIC_REPO_SMOKE_CLEANUP=true`，防止发布验收留下临时项目、仓库、扫描、artifact、code_chunks 和审计记录。GitHub App drill 和 GitHub webhook drill 在 `release` / `nightly` 中即使配置完整，也不会自动运行；要触达真实 GitHub App 或真实 webhook 入口，必须显式设置 `SOURCELENS_RELEASE_EVIDENCE_ALLOW_EXTERNAL_DRILLS=true`。

本地生成完整 release 候选包的推荐入口：

```bash
SOURCELENS_RELEASE_EVIDENCE_RUN_ID=release-$(date +%Y%m%d-%H%M%S) \
SOURCELENS_BASE_URL=http://localhost:8080 \
make release-evidence-release

make verify-release-evidence DIR=release-evidence/<run-id>
```

非本地 staging 目标必须显式声明：

```bash
SOURCELENS_RELEASE_EVIDENCE_TARGET_ENV=staging \
SOURCELENS_BASE_URL=https://staging.sourcelens.example.com \
make release-evidence-release
```

生产 smoke 只允许专用租户：

```bash
SOURCELENS_RELEASE_EVIDENCE_TARGET_ENV=prod \
SOURCELENS_RELEASE_EVIDENCE_ALLOW_MUTATING_PROD=true \
SOURCELENS_BASE_URL=https://prod-smoke.sourcelens.example.com \
make release-evidence-release
```

若强制 Audit workbench smoke 但缺少 `SOURCELENS_BASE_URL`，证据包会记录 `audit-workbench-smoke` required failure，并且仍必须通过 `make verify-release-evidence DIR=release-evidence/<run-id>` 或 `scripts/verify-release-evidence.sh` 复核。

`make verify-release-evidence DIR=release-evidence/<run-id>` 会先校验证据包结构，再重新计算证据包内除 `checksums.sha256` 之外所有文件的 SHA-256，并与归档 manifest 精确比对。结构校验要求 `summary.md`、`status.tsv`、`manifest.txt`、`git-status.txt`、`git-diff-stat.txt` 和 `worktree-inventory.md` 存在且为私有普通文件，`git-status.txt`、`git-diff-stat.txt` 和 `worktree-inventory.md` 不得含控制字符，`summary.md` 必须包含 release evidence 标题和 summary 计数，`summary.md` / `manifest.txt` 的 `run_id` 和 `env_file` 必须一致，`run_id` 必须是安全短标识，传给 verifier 的证据目录末段、`summary.md` 的 `evidence_dir` 末段都必须等于 `run_id`，两个 `created_at` 必须是可被 UTC `date` 解析的 ISO-8601 秒级时间，`manifest.txt` 的 `git_head` 必须是 40 位小写 SHA-1 或 `unavailable`；且 `## Steps` 中每个 step bullet 的状态、slug、标题和详情必须与 `status.tsv` 一一对应，`required_failures`、`optional_warnings`、`skipped` 必须分别匹配 `status.tsv` 中的 `FAIL`、`WARN`、`SKIP` 行数；`status.tsv` 必须有固定表头，并且 `git-metadata`、`worktree-inventory`、`make-verify`、`prod-preflight`、`backup-preflight`、`rollback-preflight`、`backup-restore-drill-evidence`、`rollback-plan`、`smoke`、`public-repo-smoke`、`file-bound-repair-smoke`、`autorepair-patch-smoke`、`patch-ready-ui-smoke`、`dashboard-next-action-ui-smoke`、`report-evidence-drawer-ui-smoke`、`scan-governance-timeline-ui-smoke`、`agent-chat-audit-ui-smoke`、`agent-chat-tool-audit-smoke`、`audit-workbench-smoke`、`phase12-baseline`、`sandbox-drill`、`github-app-drill`、`github-webhook-drill` 和 `llm-provider-run` 标准 step 行都必须各出现一次；每行 `status` 与 `exit_code` 必须语义一致：`OK` 只能是 `0`，`SKIP` 只能是 `-`，`WARN` 必须是非零数字，`FAIL` 只能是 `-` 或非零数字；核心 `git-metadata` 状态必须保持 `OK`，核心 `worktree-inventory` 不得被伪造成 `SKIP`；`manifest.txt` 的 include 模式也必须与 `status.tsv` 一致：`true` 模式的 step 只能是 `OK` 或 `FAIL`，不能被粉饰成 `SKIP` 或 `WARN`；`false` 模式的 step 必须是 `SKIP`，且 detail 必须是对应 `SOURCELENS_RELEASE_EVIDENCE_INCLUDE_*=false`；`auto` 模式不能伪造 `WARN`；`worktree_inventory_strict=true` 不能把 worktree inventory 降级成 `WARN`，且当 `worktree-inventory` 状态为 `OK` 时，`worktree-inventory.md` 不得包含非零 `Other` 分组或 strict failure marker；strict failure 时必须保留非零 `Other` 分组和 strict failure marker；每个标准 step 的 `log_file` 必须匹配固定证据文件名，`backup-restore-drill-evidence` 和 `rollback-plan` 允许 `.log` 跳过/失败记录或 `.txt` 已归档人工证据；同时 `OK backup-restore-drill-evidence` 必须引用 `backup-restore-drill-evidence.txt`，`OK rollback-plan` 必须引用 `rollback-plan.txt`，非 OK backup/rollback 状态必须引用对应 `.log`，避免只有跳过/失败日志却被伪造成 OK 人工证据；`public-repo-smoke` 必须引用 `public-repo-smoke.log`，且 `OK public-repo-smoke` 的日志必须包含唯一 `PUBLIC_REPO_SMOKE_OK` JSON marker，marker 必须证明 `naturalEndpointCn` / `业务接口` 和 `naturalEndpointEn` / `business endpoint` 两条 role probe 都为 `matched=true`、`status=OK`、`resultCount>0`，并命中 `evidenceType:CONTROLLER` 或 Controller fallback，不能由 FRONTEND、Service/DataAccess fallback、重复 role 或多 marker 冒充；当 manifest `public_repo_smoke_ui=true` 时，同一日志还必须包含唯一 `PUBLIC_REPO_UI_SMOKE_OK`，并验证 project/repository/scan ID 与主 marker 一致、`realBackend=true`、`mockedApi=false`、required pages/viewports 完整、`expectedEvidenceFile` 对齐自然 endpoint 命中文件 basename，且 marker 不含 token/JWT/secret 等敏感字段；`OK patch-ready-ui-smoke` 必须引用 `patch-ready-ui-smoke.log` 且包含唯一 `PATCH_READY_UI_SMOKE_OK` marker，并强校验 Enter/Space 键盘打开和 `sharedSelectableRow` detail region 关联；`OK dashboard-next-action-ui-smoke` 必须引用 `dashboard-next-action-ui-smoke.log` 且包含唯一 `DASHBOARD_NEXT_ACTION_SMOKE_OK` marker，证明 7 个推荐分支、7 个推荐标题、`1440x900`/`320x740`、mock-only、local-only、未 mock API 为 0，以及 `visualEvidence` 中 `review-risk-report` 的双 viewport 截图尺寸、字节数、像素多样性、panel/title/button 边界和 primary button 白字；该 step 为 OK 时还必须归档并 allowlist 两张 `dashboard-next-action-ui-smoke/*.png`，verifier 会读取 PNG 本体复核 magic/IHDR、尺寸、bytes 和像素多样性；`OK report-evidence-drawer-ui-smoke` 必须引用 `report-evidence-drawer-ui-smoke.log` 且包含唯一 `REPORT_EVIDENCE_DRAWER_SMOKE_OK` marker，证明 report evidence drawer code_chunks flow 的 scan 绑定、目标证据文件、`drawerQueryCount=6`、`readyDrawerQueryCount=3`、`gapDrawerQueryCount=3`、`1440x900`/`320x740`、mock-only、local-only 和未 mock API 为 0；同一 OK 日志还必须包含唯一 `REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK` marker，并强校验 `qaRequestCount=6`、verified/unverified QA citation 双路径和 optional-present strict `reportCitationQuality` 面板合同；`OK scan-governance-timeline-ui-smoke` 必须引用 `scan-governance-timeline-ui-smoke.log` 且包含唯一 `SCAN_GOVERNANCE_TIMELINE_SMOKE_OK` marker，证明治理时间线聚合 flow 的 `scanTaskId=8801`、`foreignScanExcluded=true`、`1440x900`/`320x740`、mock-only、local-only 和未 mock API 为 0；`OK agent-chat-audit-ui-smoke` 必须引用 `agent-chat-audit-ui-smoke.log` 且包含唯一 `AGENT_CHAT_AUDIT_SMOKE_OK` marker，证明 mock-only、local-only、deep link 和 `conversationId` 过滤；`OK agent-chat-tool-audit-smoke` 必须引用 `agent-chat-tool-audit-smoke.log` 且包含唯一 `AGENT_CHAT_TOOL_AUDIT_SMOKE_OK` marker，证明真实 AgentChat SSE 路径、`READ_ONLY` 工具权限、正确/错误 `conversationId` 过滤、assistant/tool 消息 JSON 持久化、mock LLM、无外部 LLM/网络和 loopback-only；验证器还会从核心文件、`status.tsv` 引用文件、Dashboard next-action PNG、成功 LLM provider run 的 `llm-provider-run.json` 以及其中声明的 `llm-evals/` raw output artifact 构建 expected file allowlist，额外文件即使重新生成 checksum manifest 也会被 `verify-release-evidence` 以 `unexpected file` 拒绝。它还会拒绝 symlink 证据目录、包内 symlink、未知或重复 step slug、非 `600` 普通文件、manifest 自包含、绝对路径、dot-segment、反斜杠、控制字符、实际包内不安全文件路径或 checksum 不匹配，适合在发布记录归档前后重复执行。

安全回归会生成轻量 release evidence 包，篡改 `git-status.txt` 后确认 checksum mismatch 能被 `verify-release-evidence` 拒绝，防止发布记录在归档后被静默改写。
安全回归还会向 `checksums.sha256` 追加不安全路径条目，并确认 `verify-release-evidence` 以 `unsafe checksum path` 拒绝该包，防止 checksum manifest 指向证据目录外或含 dot-segment 的路径。
安全回归还会向 `checksums.sha256` 追加重复路径条目，并确认 `verify-release-evidence` 以 `duplicate checksum path` 拒绝该包，防止完整性 manifest 出现同一证据文件的多重声明。
安全回归还会把 `checksums.sha256` 权限放宽到 `644`，并确认 `verify-release-evidence` 以 `checksum manifest must have 600 permissions` 拒绝该包，防止完整性根文件自身权限退化。
安全回归还会通过 symlink 路径调用 `verify-release-evidence`，并确认它以 `release evidence directory must not be a symlink` 拒绝该输入，防止复核入口被链接到另一份证据目录。
安全回归还会在轻量证据包内额外创建带反斜杠的不安全文件名，并确认 `verify-release-evidence` 以 `release evidence file path is unsafe` 拒绝该包，防止真实包内异常路径绕过 manifest 校验。
安全回归还会在轻量证据包内额外创建 symlink，并确认 `verify-release-evidence` 以 `release evidence directory must not contain symlinks` 拒绝该包，防止发布证据复核跟随链接读取包外或伪造内容。
安全回归还会在轻量证据包内额外创建普通文件，重新生成 checksum manifest 后把该包内文件权限放宽到 `644`，并确认 `verify-release-evidence` 仍以 `must have 600 permissions` 拒绝该包，防止内容完整性正常但私有权限退化的证据被接受。
安全回归还会在轻量证据包内额外创建 `600` 权限文件，重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `unexpected file` 拒绝该包，防止发布证据包被当作任意文件容器夹带伪证据或敏感内容。
安全回归还会在轻量证据包内额外创建空目录，重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `unexpected directory` 拒绝该包；成功归档 LLM raw output 时也会把 `llm-evals` 目录权限放宽并确认 verifier 拒绝，防止包内目录绕过 expected allowlist 或私有权限校验。
安全回归还会把 `llm-provider-run` 伪造成 `OK` 但缺少 `llm-provider-run.json`，重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `regular file` 拒绝该包，防止真实 provider 安全评估结果只在状态表中被伪造为成功。
安全回归还会生成带 14 个 raw output artifact（均位于 `llm-evals/`）的真实形态 provider run 证据包，确认原始包可通过 `verify-release-evidence`，随后删除一个 raw output artifact 并重新生成 checksum manifest，确认 `verify-release-evidence` 仍以 `regular file` 拒绝该包，防止 `llm-provider-run.json` 声称有原始输出但证据包缺失实物。
安全回归还会在 `summary.md` 的 `## Steps` 追加伪造 step，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `summary steps must match status.tsv status, slug, title and detail rows` 拒绝该包，防止只篡改摘要而不改 `status.tsv` 的验收伪造。
安全回归还会只篡改 `summary.md` 中已有 step 的展示详情，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `summary steps must match status.tsv status, slug, title and detail rows` 拒绝该包，防止摘要显示的通过原因被粉饰而 `status.tsv` 保持不变。
安全回归还会向 `summary.md` 的 step 行注入控制字符，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `summary step line contains control characters` 拒绝该包，防止摘要标题或详情被终端控制字符污染显示。
安全回归还会向 `summary.md` 追加额外内容，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `summary file must match the generated layout exactly` 拒绝该包，防止发布摘要在标准 Summary 之后夹带人工 override 或伪造通过结论。
安全回归还会把 `summary.md` 和 `manifest.txt` 的 `env_file` metadata 篡改为含反引号的值，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `summary env_file must not contain control characters or backticks` 拒绝该包，防止 metadata 破坏 summary 解析或伪造发布环境来源。
安全回归还会把 `manifest.txt` 的 `created_at` 篡改为另一个合法 UTC 时间，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `summary created_at must match manifest created_at` 拒绝该包，防止摘要和 manifest 使用不同时间线伪造发布记录。
安全回归还会把 `summary.md` 和 `manifest.txt` 的 `created_at` 同步篡改为 `2026-99-99T99:99:99Z`，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `created_at must be a valid UTC ISO-8601 timestamp` 拒绝该包，防止格式像时间但无法解析的伪时间线进入发布证据。
安全回归还会在 `summary.md` 中复制 `env_file` metadata，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `exactly one non-empty env_file metadata value` 拒绝该包，防止重复 metadata 伪造发布环境来源。
安全回归还会把 `manifest.txt` 的 `llm_provider_run_file` metadata 篡改为含反引号的值，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `llm_provider_run_file must not contain control characters or backticks` 拒绝该包，防止 LLM provider 路径 metadata 污染发布证据。
安全回归还会向 `manifest.txt` 追加额外内容，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `manifest file must match the generated layout exactly` 拒绝该包，防止发布 manifest 在固定 metadata 之外夹带人工 override 或伪造验收来源。
安全回归还会把 `manifest.txt` 中的 `include_smoke` 篡改为 `maybe`，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `include_smoke must be true, false, or auto` 拒绝该包，防止 manifest include/worktree 模式被改成生成器不会产出的非法值。
安全回归还会生成 `include_smoke=true` 的 required failure 包，把 `status.tsv` 和 `summary.md` 里的 smoke 行伪造成 `SKIP` 并重新生成 checksum manifest，确认 `verify-release-evidence` 仍以 `requires smoke status not to be SKIP` 拒绝该包，防止强制验收步骤被粉饰成未配置跳过。
安全回归还会把同一类 `include_smoke=true` required failure 包的 smoke 行伪造成 `WARN`，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `requires smoke status to be OK or FAIL` 拒绝该包，防止强制验收失败被降级成 optional warning。
安全回归还会把 `include_smoke=false` 包里的 smoke `SKIP` detail 从 `SOURCELENS_RELEASE_EVIDENCE_INCLUDE_SMOKE=false` 篡改成 `SOURCELENS_BASE_URL is not configured`，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `requires smoke detail to be` 拒绝该包，防止显式关闭的验收步骤伪装成环境未配置。
安全回归还会把 `git-metadata` 状态伪造成 `SKIP` 并重新生成 checksum manifest，确认 `verify-release-evidence` 仍以 `git-metadata status must be OK` 拒绝；随后还会把 `worktree-inventory` 状态伪造成 `SKIP` 并确认 `verify-release-evidence` 仍以 `worktree-inventory status must not be SKIP` 拒绝，防止核心证据快照被粉饰成跳过。
安全回归还会制造 `worktree-inventory.md` 中的非零 `Other` 分组，把 `worktree-inventory` strict failure 伪造成 `OK` 并重新生成 checksum manifest，确认 `verify-release-evidence` 仍以 `strict OK must not contain Other paths` 拒绝该包，防止未分类工作区路径被粉饰成已完成拆审。
安全回归还会保留 `worktree-inventory` strict failure 状态但删除 `worktree-inventory.md` 中的 `Other` 分组和失败标记，重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `strict FAIL must contain Other paths and strict failure marker` 拒绝该包，防止发布证据只剩失败状态而丢失可审计失败细节。
安全回归还会向 `worktree-inventory.md` 注入控制字符，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `worktree inventory must not contain control characters` 拒绝该包，防止工作区拆审清单污染终端、工单或日志查看器。
安全回归还会向 `git-status.txt` 和 `git-diff-stat.txt` 注入控制字符，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍分别以 `git status snapshot must not contain control characters` 和 `git diff stat snapshot must not contain control characters` 拒绝该包，防止 git 快照污染终端、工单或日志查看器。
安全回归还会把 `summary.md` 的 `skipped` 计数篡改为伪值，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `summary skipped must match status.tsv` 拒绝该包，防止发布摘要计数粉饰真实 step 状态。
安全回归还会把 `status.tsv` 中 `OK` step 的 `exit_code` 篡改为非零值，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `OK status must use exit_code 0` 拒绝该包，防止步骤状态和退出码被拆开伪造。
`release-evidence` 生成侧会在写入 `status.tsv` 前校验 `status` 与 `exit_code` 语义一致：`OK` 只能写 `0`，`SKIP` 只能写 `-`，`WARN` 必须写非零数字，`FAIL` 只能写 `-` 或非零数字，避免坏状态表只靠发布后 verifier 才发现。
`release-evidence` 生成侧会为 `summary.md` 和 `manifest.txt` 使用同一个 UTC `created_at`，避免同一证据包里核心 metadata 出现跨秒或后改不一致。
`release-evidence` 生成侧还会在写入 summary/manifest 前校验 `env_file` 和 evidence directory metadata 非空且不含控制字符或反引号；即使 env 文件缺失并回退进程环境，也不会用不安全 metadata 创建证据包。
`release-evidence` 生成侧也会在写入 manifest 前规范化可选的 `llm_provider_run_file` 和 `llm_raw_output_dir` metadata，把控制字符折叠为空格并替换反引号；这些字段即使为空也必须保持可安全解析。
`release-evidence` 生成侧还会在写入 summary 前校验 step title 非空且不含控制字符，避免未来新增发布步骤时把异常标题写入验收摘要。
安全回归还会把 `status.tsv` 的 `detail` 字段注入控制字符，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `detail contains control characters` 拒绝该包，防止发布证据在终端、工单或日志查看器中被控制字符污染显示。
安全回归还会把 `status.tsv` 的 `detail` 字段注入反引号，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `detail contains backticks` 拒绝该包，防止发布证据在 Markdown、工单或日志查看器中被伪造 code span 污染显示。
`release-evidence` 生成侧也会在写入 `status.tsv` 前对 `detail` 中的控制字符和反引号做规范化，把 tab、换行和 ESC 等不可见字符折叠为空格，并把反引号替换为普通引号，避免失败原因来自路径或环境变量时产出一个自身无法通过 `verify-release-evidence` 复核的证据包。
安全回归还会把 `status.tsv` 中 `git-metadata` 的 `log_file` 篡改为另一份存在的证据文件，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `git-metadata must reference manifest.txt` 拒绝该包，防止 step 状态引用错证据文件。
安全回归也会复制 `status.tsv` 中的标准 step 行制造重复 slug，重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `row only once` 拒绝该包，防止非法结构靠重算 checksum 伪装成合法发布证据。
安全回归还会在 `status.tsv` 追加未知 step slug，并在重新生成 checksum manifest 后确认 `verify-release-evidence` 仍以 `unknown step slug` 拒绝该包，防止扩展项绕过标准 step allowlist。

release evidence 调用 smoke、phase12 baseline、Docker sandbox drill、GitHub App drill 和 GitHub webhook drill 时，必须把同一个已选择并已校验的真实 env 文件通过对应的 `*_ENV_FILE` 变量传给子脚本；不得让子脚本各自回退到默认 `deploy/.env`，也不得把 smoke token、数据库密码这类敏感值作为命令行 env 参数传给 smoke 或 phase12 baseline。release、preflight、smoke、phase12、sandbox 和 GitHub drill 脚本读取 env 值时都要统一 trim 并剥离外层或嵌套成对引号，避免同一个真实 env 文件在不同验收步骤中解析出不同值。

Compose 配置会先使用 `deploy/.env.example` 渲染，确保模板本身可用；如果存在真实部署 env 文件，还会再用该文件渲染一次，确保发布配置没有变量缺失或 Compose 语法问题。preflight 会继续检查渲染后的 backend/mysql/redis 服务块，确认 prod profile、仓库根 build context、docker sandbox、禁用 PAT、禁用本地文件仓库、workspace volume、healthy depends_on 和 MySQL/Redis digest-pinned image 仍然存在。默认真实 env 文件为 `deploy/.env`，也可以通过 `SOURCELENS_PREFLIGHT_ENV_FILE=/path/to/prod.env make prod-preflight` 指定。

preflight 会提前检查生产 secret 强度，避免发布前检查通过但 Spring Boot 生产启动校验失败：

- `DB_PASSWORD` 至少 12 个字符，且不得使用开发默认值。
- `JWT_SECRET` 至少 32 个字符，且不得使用开发默认值。
- `ENCRYPT_PASSWORD` 至少 16 个字符，且不得使用开发默认值。
- `ENCRYPT_SALT` 至少 8 个字符，且不得使用开发默认值。
- 强制 GitHub App readiness 时，`GITHUB_APP_PRIVATE_KEY_PEM` 必须看起来像 PEM private key，`GITHUB_APP_WEBHOOK_SECRET` 至少 16 个字符。
- 强制 GitHub App readiness 时，`GITHUB_WEBHOOK_DELIVERY_CLEANUP_ENABLED` 必须显式为 `true`，`GITHUB_WEBHOOK_DELIVERY_RETENTION_DAYS` 必须是正整数，`GITHUB_WEBHOOK_DELIVERY_CLEANUP_BATCH_SIZE` 必须是 1 到 5000 之间的正整数，避免 webhook 幂等记录在生产环境无限增长。

preflight 也会检查容量治理类保留期配置：workspace sandbox、artifact、audit 和 execution log cleanup 关闭时会记录 warning，retention 和 cleanup batch size 配置错误时会失败。生产发布前应按审计、排障窗口和存储预算显式配置 `SOURCELENS_WORKSPACE_SANDBOX_CLEANUP_ENABLED`、`SOURCELENS_ARTIFACT_CLEANUP_ENABLED`、`SOURCELENS_AUDIT_CLEANUP_ENABLED`、`SOURCELENS_EXECUTION_LOG_CLEANUP_ENABLED` 及其对应 retention/batch 变量。

preflight 读取真实 env 文件时会规范化基础 `.env` 写法：支持 `KEY=value`、`export KEY=value`，并会剥离成对的单引号或双引号。开启类变量即使写成 `SOURCELENS_AGENT_CREATE_PR_ENABLED="true"`，也必须触发 GitHub App readiness 检查；`SOURCELENS_AGENT_CREATE_PR_ENABLED` 和 `SOURCELENS_AUTOREPAIR_SUBMIT_PR_ENABLED` 只接受合法布尔值，拼错会 fail-closed，避免受控 PR 功能开关绕过 GitHub App readiness 或产生模糊生产配置。

Docker Compose 演示环境：

```bash
make up
SOURCELENS_BASE_URL=http://localhost:8081 make smoke
```

`SOURCELENS_BASE_URL` 可以带一层引号或末尾 `/`，smoke 与 preflight 会先规范化再拼接 `/api/health`、`/actuator/health` 和 metrics 路径，避免生成 `//api/health` 这类部署检查误报。`SOURCELENS_SMOKE_TOKEN` 也会去掉外层或嵌套成对引号后再作为 Bearer token 使用。
`SOURCELENS_BASE_URL` 必须使用 `http` 或 `https`，并且必须包含 host；smoke、production preflight、rollback preflight 和 GitHub webhook drill 会在 HTTP 调用前 fail-closed 拒绝包含空白、user-info、query 或 fragment 的值，避免把凭据形态的 URL 写入日志或拼出不可预测的验收路径。

`make smoke` 默认读取 `SOURCELENS_SMOKE_ENV_FILE` / `SOURCELENS_PREFLIGHT_ENV_FILE` / `deploy/.env`。真实 env 文件会在读取 `SOURCELENS_SMOKE_TOKEN` 前校验：必须是非 symlink、普通非空、可读文件，权限必须可检查且可解析，并且不得开放 group/world 权限；安全回归会用 fake curl 负例确认 644 env 文件在 HTTP 调用前 fail-closed。`deploy/.env.example` 模板会跳过私有权限检查，缺失文件只回退到进程环境。真实发布 smoke 建议使用：

```bash
SOURCELENS_SMOKE_ENV_FILE=/path/to/prod.env make smoke
```

HTTP smoke 默认使用 `SOURCELENS_SMOKE_CONNECT_TIMEOUT=5` 和 `SOURCELENS_SMOKE_MAX_TIME=15`，`make smoke` 与 `make prod-preflight` 的可选 smoke target 都会带上 curl 超时参数，避免发布验证在半开连接或异常代理上长时间挂住。两个值可以通过环境变量或真实 env 文件覆写，但必须是正整数。

审计 workbench 三源 smoke：

```bash
SOURCELENS_BASE_URL=http://localhost:8080 make audit-workbench-smoke
```

该脚本会注册临时本地用户、创建临时项目和临时仓库，验证 `/projects/{projectId}/audit-logs`、`/projects/{projectId}/agent-tool-calls` 和 `/projects/{projectId}/github-webhook-deliveries` 都返回标准分页结构，随后默认删除临时项目。dev/test profile 下会自动调用受保护的 `/api/dev/projects/{projectId}/audit-workbench-smoke-seed` 生成三类真实样本：`AUDIT_WORKBENCH_SMOKE_SEED` 审计日志、失败的 Agent 工具调用样本、绑定临时仓库的 GitHub webhook delivery 样本；生产 profile 不加载该 seed 入口。若目标环境必须证明真实样本链路，可设置 `SOURCELENS_AUDIT_WORKBENCH_SMOKE_REQUIRE_SAMPLES=true`，此时 seed 入口不可用会直接失败。它不调用 GitHub、不创建 PR、不触发外部远端写操作；可通过 `SOURCELENS_AUDIT_WORKBENCH_SMOKE_CLEANUP=false` 保留临时项目用于排查。

`production-preflight.sh` 会从 `SOURCELENS_PREFLIGHT_ENV_FILE` 指向的真实 env 文件读取 `SOURCELENS_BASE_URL`；若同一 key 在 env 文件中重复出现，后面的赋值按常见 shell 语义覆盖前面的值。

`deploy/.env` 是本地私有部署文件，不得提交到版本库，并且权限必须收紧到仅当前用户可读写：

```bash
chmod 600 deploy/.env
```

`production-preflight.sh`、`backup-restore-preflight.sh` 和 `rollback-preflight.sh` 都会检查各自指向的真实 env 文件安全边界：必须是非空、可读、非 symlink 的普通文件，权限必须可检查且可解析，并且不得开放 group/world 访问权限；`deploy/.env.example` 作为模板不会触发私有权限检查。Compose 后端使用 `SPRING_PROFILES_ACTIVE=prod`，并显式设置 `SOURCELENS_SANDBOX_EXECUTOR=docker`、docker sandbox 隔离参数、`SOURCELENS_ALLOW_PAT_CREDENTIALS=false` 和 `SOURCELENS_ALLOW_LOCAL_FILE_REPOS=false`；这些红线会在渲染后的 Compose 输出中再次验证，修改前必须先更新安全评审和回滚方案。

后端镜像必须从仓库根目录作为 build context 构建，Dockerfile 路径为 `backend-spring/Dockerfile`。该镜像同时构建 Spring Boot jar 和 Rust `sourcelens-analyzer`，并把 analyzer 放入 `/usr/local/bin/sourcelens-analyzer`，确保容器内扫描路径与 `ANALYZER_PATH` 默认值一致。根目录 `.dockerignore` 必须排除 `.git`、前端依赖、构建产物和私有 `.env` 文件，避免构建上下文过大或泄漏本地配置。

后端 Dockerfile 的基础镜像必须使用 `tag@sha256:digest` 形式固定，不得只写 `maven:...`、`rust:...` 或 `eclipse-temurin:...` 这类可移动 tag。升级基础镜像时先从 Docker Registry 或镜像发布页确认新 tag 对应的 digest，更新 Dockerfile 后运行 `make dependency-check`、`./scripts/security-regression-check.sh` 和后端 Docker 镜像构建。

Docker Compose 中的外部服务镜像同样必须使用 `tag@sha256:digest` 固定。当前 MySQL 与 Redis 镜像在 `deploy/docker-compose.yml` 中固定到 digest，升级时先确认新 tag 对应 digest，再运行 `make dependency-check`、`./scripts/security-regression-check.sh` 和 `make prod-preflight`。

Docker sandbox 执行镜像也必须使用 `tag@sha256:digest` 固定。当前生产默认值为 digest-pinned `alpine/git`；若通过 `SOURCELENS_SANDBOX_DOCKER_IMAGE` 覆写，`SecurityStartupValidator` 和 `production-preflight.sh` 都会拒绝裸 tag。升级该镜像前必须确认构建工具兼容非 root 用户、只读 root filesystem、受限 `/tmp`、无网络和资源限制。

`make sandbox-drill` 默认读取 `SOURCELENS_SANDBOX_DRILL_ENV_FILE` / `SOURCELENS_PREFLIGHT_ENV_FILE` / `deploy/.env` 中的 sandbox 覆写配置。真实 env 文件会在读取 sandbox 配置前校验：必须是非 symlink、普通非空、可读文件，权限必须可检查且可解析，并且不得开放 group/world 权限；`deploy/.env.example` 模板会跳过私有权限检查，缺失文件只回退到进程环境。

生产备份要求：

- `SOURCELENS_BACKUP_DIR` 必须显式配置，目录必须存在、可写可搜索，权限必须可检查且可解析，并且不得开放给 group/world，建议 `chmod 700`。
- 备份目录不得位于 SourceLens git worktree 或 `SOURCELENS_WORKSPACE` 内，避免把备份提交进仓库或被 workspace 清理/扫描流程误处理。
- 同一个 `backup_id` 必须对应一组可恢复的备份 artifact，文件名必须以 `backup_id` 开头，且下一个字符必须是 `-`、`_` 或 `.`，并包含角色词：`database`、`workspace`、`artifacts`、`checksums`。推荐格式：`<backup_id>-database.sql.gz`、`<backup_id>-workspace.tar.gz`、`<backup_id>-artifacts.tar.gz`、`<backup_id>-checksums.sha256`。四类 artifact 都必须是非 symlink 的普通文件、非空、可读、权限可检查且可解析，并且不可 group/world 写；其中 `<backup_id>-checksums.sha256` 必须包含 database、workspace 和 artifacts 三类文件的实际 SHA-256 条目；`backup-preflight`、`rollback-preflight` 和 `release-evidence` 都会按当前文件内容重新计算并比对，且不会把 `backup1` 误匹配到 `backup10-*` 这类同子串备份。
- `SOURCELENS_BACKUP_RETENTION_DAYS` 必须是正整数，默认模板为 `14`。
- `SOURCELENS_BACKUP_ENCRYPTION_REQUIRED=true`，生产备份必须准备加密工具；`backup-preflight` 会检查 `gpg`。
- 数据库备份需要 `mysqldump`，恢复演练需要 `mysql`；默认检查宿主机工具链，也可以用 `SOURCELENS_BACKUP_TOOLCHAIN_EXECUTOR=docker:<container>` 检查指定 MySQL 容器内工具链。workspace/artifact 归档仍需要宿主机 `tar`、`gzip` 和 checksum 工具。
- 每次生产发布前至少完成一次数据库 dump、artifact/workspace 归档和恢复演练，恢复演练输出应保存到发布记录，并通过 `SOURCELENS_BACKUP_RESTORE_DRILL_EVIDENCE_FILE` 交给 `backup-preflight` 校验。
- `SOURCELENS_BACKUP_RESTORE_DRILL_EVIDENCE_FILE` 必须指向非空、可读、非 symlink 且不可 group/world 写的证据文件，文件权限必须可检查且可解析，文件 mtime 必须可检查；文件中的 `backup_id` 必须是安全 artifact id 格式，并且能在 `SOURCELENS_BACKUP_DIR` 中匹配到 database/workspace/artifacts/checksums 四类备份 artifact；四类备份 artifact 都必须通过非 symlink、普通文件、非空、可读、权限可检查且可解析、不可 group/world 写检查，checksum artifact 还必须覆盖 database/workspace/artifacts 三类 artifact 的真实 SHA-256；`restore_drill_completed_at` 必须是 UTC ISO-8601 时间戳。`SOURCELENS_BACKUP_RESTORE_DRILL_MAX_AGE_DAYS` 默认为 `7`，避免用陈旧演练冒充当前发布证据。
- 恢复演练证据文件至少应包含以下标记，值可用 `pass`、`passed`、`ok` 或 `success`：

```text
backup_id=backup-20260625-001
restore_drill_completed_at=2026-06-25T12:34:56Z
restore_drill_status=pass
database_restore=pass
workspace_restore=pass
artifact_restore=pass
checksum_verification=pass
```

本地后端：

```bash
make deps
make backend
SOURCELENS_BASE_URL=http://localhost:8080 make smoke
```

开发环境默认使用 MyBatis `Slf4jImpl`，不会把每条 SQL 直接刷到终端。定位 SQL 细节时可以临时运行：

```bash
MYBATIS_LOG_IMPL=org.apache.ibatis.logging.stdout.StdOutImpl make backend
```

如果需要验证受保护 metrics，先登录获取 JWT，再运行：

```bash
SOURCELENS_BASE_URL=http://localhost:8080 \
SOURCELENS_SMOKE_TOKEN="$JWT" \
make smoke
```

也可以把 `SOURCELENS_BASE_URL`、`SOURCELENS_SMOKE_TOKEN`、`SOURCELENS_SMOKE_CONNECT_TIMEOUT` 和 `SOURCELENS_SMOKE_MAX_TIME` 放入私有 env 文件，再通过 `SOURCELENS_SMOKE_ENV_FILE=/path/to/local.env make smoke` 运行。

## 4. Smoke Test 验收

`scripts/smoke-test.sh` 至少检查：

- `/api/health` 返回 `UP`。
- `/actuator/health` 返回 `UP`。
- `/actuator/info` 可访问。
- 未认证访问 `/actuator/metrics` 必须返回 `401` 或 `403`，防止 metrics 被公网误暴露。

设置 `SOURCELENS_SMOKE_TOKEN` 后额外检查：

- `/actuator/metrics` 可访问。
- `sourcelens.execution.tasks`
- `sourcelens.execution.steps`
- `sourcelens.agent.tool.calls`
- `sourcelens.agent.tool.duration`
- `sourcelens.sandbox.commands`
- `sourcelens.sandbox.command.duration`

## 5. Actuator 暴露策略

当前默认暴露：

- `/actuator/health`：公开，用于负载均衡和基础探活。
- `/actuator/info`：公开，仅允许非敏感构建信息。
- `/actuator/metrics`：需要认证，不应直接暴露到公网。

反向代理建议：

- 公网只放行 `/api/**` 和前端静态资源。
- `/actuator/metrics` 只允许内网 Prometheus、堡垒机或受控运维网段访问。
- 禁止在 metrics tag 中加入源码路径、prompt、token、PR diff、CI 原始日志或用户输入正文。

## 6. GitHub App 端到端验收

真实仓库上线前必须至少跑一轮：

1. 安装 GitHub App 到测试仓库。
2. 绑定 installation 到 SourceLens repository。
3. 触发 webhook，确认 delivery 被记录且重复 delivery 幂等跳过。
   Webhook 请求必须包含 `X-GitHub-Delivery`，该值是幂等键和审计关联键；服务端会在处理 installation 或仓库权限同步前先 claim delivery id，缺失或重复时不会继续执行业务同步。
   可用 `make github-webhook-drill` 对签名、重复 delivery、缺 delivery id 和错误签名做可重复验收。
   对 `installation_repositories` 事件，`repositories_added` 只应绑定 SourceLens 已存在仓库并切换为 `GITHUB_APP`；`repositories_removed` 应禁用对应 installation，并在仓库仍使用 GitHub App 时切回 `NONE`；未知 GitHub 仓库不得自动创建成本地项目或仓库。
4. 创建低风险 AutoRepair patch。
5. 开启 `SOURCELENS_AUTOREPAIR_SUBMIT_PR_ENABLED=true`。
6. 创建受控 PR，确认使用 `GITHUB_APP`，不是 PAT。
7. 验证分支保护、权限不足、重复提交和 push 失败场景。
   若 GitHub App installation 权限被降级到缺少 `contents:write` 或 `pull_requests:write`，受控 PR 必须在排队前失败，AutoRepair 保持 `PATCH_READY`，并能在 audit log 中看到 `AUTO_REPAIR_PR_REJECTED`。
   GitHub PR API 返回 `401/403` 时应被记录为权限失败，`409/422` 时应被记录为重复 PR 或 GitHub 校验冲突；这些失败必须留在 execution step 和 audit log 中，不得手工改为成功。
   重复 PR 或 GitHub 校验冲突发生在 `create_pull_request` 阶段时，AutoRepair 应回到 `PATCH_READY`，`create_pull_request` step 应失败，audit log 应记录 `AUTO_REPAIR_PR_FAILED`，不得出现 `PR_CREATED`。
   GitHub PR API 网络连接、DNS、TLS 或超时类异常应被记录为网络请求失败，错误消息不得包含 installation token 或 Authorization header。
   分支保护、仓库规则或远端策略拒绝 push 时，应被记录为 `FORBIDDEN` 并停在 `push_branch` 步骤；release evidence 中应能看到清洗后的远端原因，例如 `GH006: Protected branch update failed`，且不得继续调用 Pull Request API。
   同名修复分支已存在且发生非快进推送时，应被记录为 `CONFLICT` 并停在 `push_branch` 步骤，不得继续调用 Pull Request API。
8. 在 execution task、execution log、audit log 中确认每个失败点可定位。

失败时不得把任务手工改为成功；应保持 `FAILED` 或回到可重试状态，并保留 execution log。

## 7. 沙箱验收

local executor 只用于开发或受控演示。生产 profile 默认并强制使用 docker executor，并验证：

- Docker 网络默认 `none`。
- 非 root 用户执行。
- CPU、内存、pid 限制生效。
- `--memory-swap` 与 `--memory` 一致，容器不能通过 swap 扩大实际内存上限。
- root filesystem 只读。
- `/tmp` 使用受限 tmpfs。
- Maven、npm、Gradle 等构建工具在只读 root filesystem 下仍能工作。
- 缓存目录如果需要挂载，必须是受控路径，不能挂载宿主敏感目录。

真实 Docker 环境中运行：

```bash
SOURCELENS_SANDBOX_DRILL_ENV_FILE=/path/to/prod.env make sandbox-drill
```

该脚本会创建受限 Docker 容器，使用和生产默认一致的 digest-pinned sandbox 镜像、`network=none`、非 root 用户、`--cap-drop ALL`、`no-new-privileges`、显式 runtime script entrypoint、`--read-only`、受限 `/tmp` tmpfs、CPU/内存/pid 限制和 `--memory-swap=<memory>`。脚本会先创建权限为 `700` 的临时 workspace，再挂载到容器 `/workspace`，随后通过 `docker inspect` 检查 HostConfig，并在容器内验证无默认网络路由、root filesystem 只读、`/tmp` 带 `noexec,nosuid`、pid/memory cgroup 可见、workspace 挂载可写，以及 `HOME`、Maven、npm、Gradle 缓存目录均可在 `/workspace/.sourcelens-home` / `/workspace/.sourcelens-cache/*` 下写入。后端 Docker sandbox executor 也会清空镜像默认 entrypoint，避免 `alpine/git` 这类镜像把用户命令误解释成镜像入口子命令。

当前缓存策略是任务 workspace 内隔离缓存，不是跨项目持久共享缓存。容器内 `HOME=/workspace/.sourcelens-home`，`MAVEN_CONFIG=/workspace/.sourcelens-cache/maven`，`npm_config_cache=/workspace/.sourcelens-cache/npm`，`GRADLE_USER_HOME=/workspace/.sourcelens-cache/gradle`，随 workspace 生命周期清理。这样牺牲一部分构建速度，但避免不同项目或不同用户通过共享构建缓存泄漏源码、依赖元数据或构建产物。

release evidence 默认会在 Docker daemon 可达时自动归档 sandbox drill；如需强制真实发布必须跑该演练：

```bash
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_SANDBOX_DRILL=true make release-evidence
```

若强制 Docker sandbox drill 但 Docker daemon 不可达，证据包会记录 `sandbox-drill` required failure，并且仍必须通过 `make verify-release-evidence DIR=release-evidence/<run-id>` 或 `scripts/verify-release-evidence.sh` 复核。

## 8. 回滚与止损

出现以下情况应停止自动化能力，只保留只读分析：

- Agent 工具输出出现未脱敏 token、API key 或私钥。
- execution task 被取消后仍被异步流程写成成功。
- GitHub App webhook 验签失败但业务仍继续处理。
- 受控 PR 使用 PAT、错误仓库或非 allowlist host。
- sandbox executor 访问外网或本机/内网元数据地址。

止损开关：

- `SOURCELENS_AGENT_WRITE_PATCH_ENABLED=false`
- `SOURCELENS_AGENT_EXEC_TEST_ENABLED=false`
- `SOURCELENS_AGENT_CREATE_PR_ENABLED=false`
- `SOURCELENS_AUTOREPAIR_SUBMIT_PR_ENABLED=false`
- `SOURCELENS_SANDBOX_EXECUTOR=local` 只能用于非 prod profile 的临时排障；prod profile 会拒绝 local executor 启动。

回滚 preflight 会在启动期 fail-closed 校验上述四个 Agent/AutoRepair 止损开关，任何拼错、true、yes 或非关闭值都会在执行备份、计划文件和 smoke 检查前失败。

真实回滚前必须运行：

```bash
make rollback-preflight
```

回滚前置要求：

- `SOURCELENS_ROLLBACK_TARGET_REF` 必须是不可变引用，只接受 40 位 Git commit SHA 或 `image@sha256:digest`。
- `SOURCELENS_ROLLBACK_BACKUP_ID` 必须指向本次回滚要使用的备份集合，只允许 3-128 位字母、数字、点、下划线或短横线，不得包含斜杠、空白或 glob 通配符；`SOURCELENS_BACKUP_DIR` 中必须能找到包含该编号的 database/workspace/artifacts/checksums 四类备份 artifact；四类 artifact 必须是非 symlink、普通、非空、可读、权限可检查且可解析，并且不可 group/world 写，且 checksum artifact 必须能验证 database/workspace/artifacts 三类 artifact 的真实 SHA-256。
- `SOURCELENS_BACKUP_DIR` 在回滚时仍必须保持私有、安全、不可 symlink，权限必须可检查且可解析，并且不得位于 git worktree 或 `SOURCELENS_WORKSPACE` 内。
- `SOURCELENS_ROLLBACK_PLAN_FILE` 必须存在、非空、可读、不可 symlink、不可 group/world 写，权限必须可检查且可解析，并且文本中同时包含 rollback target 和 backup id。
- `SOURCELENS_ROLLBACK_PLAN_MAX_AGE_DAYS` 默认为 `7`；计划文件修改时间必须可检查，不得晚于当前时间，也不得超过该 freshness 窗口，避免复用陈旧回滚计划。
- 回滚期间高风险自动化能力必须关闭：write patch、exec test、create PR 和 AutoRepair submit PR 都必须为 false 或未覆写。
- `SOURCELENS_BASE_URL` 必须配置，回滚前后都要运行 smoke，确认 `/api/health` 可达；HTTP 超时仍使用 `SOURCELENS_SMOKE_CONNECT_TIMEOUT` 和 `SOURCELENS_SMOKE_MAX_TIME`。

## 9. 发布前验证命令

PR 和 `main` 分支 push 会通过 `.github/workflows/ci.yml` 自动运行安全回归检查、依赖回归检查、Release Evidence CI profile、后端、LLM safety、前端、Rust analyzer 和后端 Docker 镜像基础验证。Release Evidence CI profile job 只运行 `make release-evidence-ci`，证据目录固定在 `${{ runner.temp }}/release-evidence`，env 文件固定为 `deploy/.env.example`，随后立即执行 `make verify-release-evidence DIR=...`，并断言 manifest 中 `release_evidence_profile_schema: 3`、`release_evidence_profile: ci`、`release_evidence_profile_source: env`、`include_agent_chat_closure_rail_ui_smoke: false`、核心 include 全为 `false`、summary fail/warn 为 0；该 job 只上传短期保留的 `ci` profile evidence artifact，用于复核本次 PR/push 的证据包结构，不代表完整 release/nightly 发布验收。CI 顶层 `permissions` 只允许 `contents: read`，不得通过 job-level `permissions` 提权；每个 `actions/checkout` step 都必须设置 `persist-credentials: false`，安全回归会逐项检查，避免不需要 push 的 job 把 GitHub token 持久写入本地 git config。CI 不读取仓库 secrets，也不使用 `pull_request_target`；普通 CI 不得运行 `release`/`nightly` profile，不得配置 `SOURCELENS_BASE_URL`、GitHub App secret、DB 密码、备份/回滚证据或 LLM provider run 等真实环境输入；真实 GitHub App、webhook、Docker sandbox 和生产环境凭据演练必须通过对应 drill/preflight/release evidence 手工入口完成。发布前仍建议在本地或发布环境重复执行以下命令，尤其是在依赖、Docker、GitHub App 或环境变量变更后。

提交前一键验证：

```bash
make verify
```

`make verify` 会依次执行 Shell 脚本语法检查、Git diff 空白检查、Project code map freshness、API design contract gate、后端测试、前端构建、Frontend UI regression checks、Artifact quality regression checks、Rust analyzer check、Rust analyzer 测试、LLM safety 回归检查、安全回归检查和依赖回归检查。基础质量红线必须覆盖 Shell 脚本语法检查、Git diff 空白检查、后端测试、前端构建和安全回归检查；其中 Git diff 空白检查同时检查 unstaged 与 staged diff，禁止尾随空白等 diff whitespace 问题进入验证链路。目录内命令通过 `run_in_dir` 直接 `cd` 到目标目录后执行，不把仓库路径拼入 `bash -lc` 字符串。部署后再运行 `make smoke` 验证已启动服务。

只检查 API 文档与 Spring controller 路由、Request DTO 字段是否同步：

```bash
make api-design-check
```

该命令调用 `scripts/validate-api-design.mjs`，从 `*Controller.java` 中提取 `@RequestMapping`、`@GetMapping`、`@PostMapping`、`@PutMapping`、`@PatchMapping` 和 `@DeleteMapping`。默认策略是：代码里存在但 `API_DESIGN.md` 未记录的路由直接失败；文档里存在但 controller 未发现的业务路由也直接失败，只有 `GET /api-docs` 这类框架端点可进入显式 docs-only allowlist。该门禁还会比对 `@RequestBody` DTO 顶层字段与首批一层嵌套 DTO 字段，当前覆盖 `CodeQaRequest.evidenceRef` 和 `AutoRepairRequest.provenance`。

只检查脚本语法：

```bash
make script-check
```

生产验收前置检查：

```bash
make prod-preflight
```

备份恢复前置检查：

```bash
make backup-preflight
```

回滚前置检查：

```bash
make rollback-preflight
```

发布验收证据包：

```bash
make release-evidence
```

生成证据包后复核 checksum manifest 与文件权限：

```bash
make verify-release-evidence DIR=release-evidence/<run-id>
```

GitHub App 只读演练：

```bash
make github-app-drill
```

GitHub webhook 演练：

```bash
make github-webhook-drill
```

常用覆盖项：

```bash
SOURCELENS_RELEASE_EVIDENCE_ENV_FILE=/path/to/prod.env \
SOURCELENS_RELEASE_EVIDENCE_RUN_ID=20260625-prod-drill \
make release-evidence
```

如果只需要快速收集真实环境 preflight/smoke 证据，可以临时跳过本地完整验证：

```bash
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_VERIFY=false make release-evidence
```

`SOURCELENS_RELEASE_EVIDENCE_INCLUDE_VERIFY` 和 `SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PREFLIGHT` 只接受 `true` 或 `false`。可选证据项 `SOURCELENS_RELEASE_EVIDENCE_INCLUDE_SMOKE`、`SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PUBLIC_REPO_SMOKE`、`SOURCELENS_RELEASE_EVIDENCE_INCLUDE_FILE_BOUND_REPAIR_SMOKE`、`SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AUTOREPAIR_PATCH_SMOKE`、`SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AUDIT_WORKBENCH_SMOKE`、`SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PHASE12`、`SOURCELENS_RELEASE_EVIDENCE_INCLUDE_SANDBOX_DRILL`、`SOURCELENS_RELEASE_EVIDENCE_INCLUDE_GITHUB_APP_DRILL`、`SOURCELENS_RELEASE_EVIDENCE_INCLUDE_GITHUB_WEBHOOK_DRILL`、`SOURCELENS_RELEASE_EVIDENCE_INCLUDE_LLM_PROVIDER_RUN` 只接受 `auto`、`true` 或 `false`；拼写错误会直接失败，避免发布证据被静默跳过。

归档真实 LLM provider 红队结果：

```bash
SOURCELENS_RELEASE_EVIDENCE_LLM_PROVIDER_RUN_FILE=/path/to/provider-run.json \
make release-evidence
```

真实 provider 可先由本地生成器统一生成结果文件和 raw output 目录：

```bash
RUN_ID=llm-provider-live-YYYYMMDDHHMMSS
SOURCELENS_LLM_PROVIDER_EVAL_RELEASE_RUN_ID="$RUN_ID" \
SOURCELENS_LLM_PROVIDER_EVAL_MODEL="$OPENAI_MODEL" \
SOURCELENS_LLM_PROVIDER_EVAL_API_KEY="$OPENAI_API_KEY" \
SOURCELENS_LLM_PROVIDER_EVAL_OUTPUT_FILE=/tmp/sourcelens-llm-provider-run.json \
SOURCELENS_LLM_PROVIDER_EVAL_RAW_OUTPUT_DIR=/tmp/sourcelens-llm-provider-raw \
make llm-provider-eval

SOURCELENS_RELEASE_EVIDENCE_RUN_ID="$RUN_ID" \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_LLM_PROVIDER_RUN=true \
SOURCELENS_RELEASE_EVIDENCE_LLM_PROVIDER_RUN_FILE=/tmp/sourcelens-llm-provider-run.json \
SOURCELENS_RELEASE_EVIDENCE_LLM_RAW_OUTPUT_DIR=/tmp/sourcelens-llm-provider-raw \
make release-evidence
```

`make llm-provider-eval` 使用 OpenAI-compatible `/chat/completions`，只保存 provider 输出摘要、结构化断言和 `release-evidence/<run-id>/llm-evals/...` raw artifact 路径；API key 不应写入 provider run JSON、raw output artifact 或日志。若任一 case 未通过或 provider 调用失败，生成器仍会写出 schema-valid provider run 和 14 个 raw artifacts，但以 exit code `2` 失败，发布负责人必须先复核失败原因，不能把失败结果当作通过证据。

`make llm-provider-eval-mock-smoke` 使用本地 `127.0.0.1` OpenAI-compatible mock provider 覆盖生成器成功路径，要求 14 个 case 全部 `pass`、生成器 exit code 为 `0`、provider-run JSON 可被 `validate-llm-provider-run.mjs --run-id` 接受、14 个 `release-evidence/<run-id>/llm-evals/...` raw artifact 在本地 raw output 目录中都有对应私有文件，并确认 mock API key 没有写入 provider-run、raw artifact 或 smoke 临时文件。`make llm-safety-check` 会自动运行该 smoke，作为真实 provider 调用前的本地可复现验收。

provider run 文件应按 `docs/llm-safety-evals/provider-run-template.json` 或 `make llm-provider-eval` 的输出格式填写，并且必须是已完成判定结果：每个 case 的 `verdict` 只能是 `pass` 或 `fail`，每条 assertion 的 `passed` 必须是布尔值。release evidence 会拒绝 symlink、空文件、不可读文件、权限不可检查或不可解析的文件、group/world 可访问文件、`rawOutput` 内联字段、secret/token/private key 字段、不在 `release-evidence/<run-id>/llm-evals/` 下的 raw output artifact 路径，和本次 release run id 不一致的 artifact 路径，以及包含空段、`.`/`..` 段、反斜杠、控制字符、真实 `<run-id>` 占位符或非安全字符路径段的 artifact 路径；路径段只允许字母、数字、点、下划线和短横。源文件应先 `chmod 600`，复制到证据包后也会收紧为 `600` 并执行敏感值 scrub。原始输出源目录通过 `SOURCELENS_RELEASE_EVIDENCE_LLM_RAW_OUTPUT_DIR` 指定，应先 `chmod 700`，并按 `llm-evals/...` 镜像 provider run 中的 `rawOutputArtifact`；每个 raw output artifact 源文件应先 `chmod 600`。

若强制 LLM provider run 但缺少 `SOURCELENS_RELEASE_EVIDENCE_LLM_PROVIDER_RUN_FILE`，证据包会记录 `llm-provider-run` required failure，并且仍必须通过 `make verify-release-evidence DIR=release-evidence/<run-id>` 或 `scripts/verify-release-evidence.sh` 复核。

安全回归检查：

```bash
./scripts/security-regression-check.sh
```

安全回归检查会真实执行 `bash -n scripts/*.sh`，因此 CI security job 也会覆盖所有发布脚本的语法错误。

依赖和供应链回归检查：

```bash
make dependency-check
```

该检查会固定前端 `package-lock.json`、Rust `Cargo.lock`、CI 中的 `npm ci`、`cargo --locked`、GitHub Actions commit SHA、Dockerfile base image digest 和 Docker Compose service image digest，并阻止前端本地 file/git 依赖、Rust 依赖段中的 git/path 依赖，以及 Maven `systemPath`、`system` scope、`LATEST`、`RELEASE` 等不可复现依赖模式。

LLM 安全回归检查：

```bash
make llm-safety-check
```

该检查会校验 Prompt injection 红队样例、输出质量契约和 provider run 模板，确认关键 LLM 入口仍把代码/diff/日志/Issue 文本/tool result 包成 untrusted data，并运行 Prompt Guard 相关单元测试。新增 LLM prompt 入口时必须先补样例、输出契约和边界断言。

CI workflow 中的第三方 GitHub Actions 必须固定到 40 位 commit SHA；tag 名只保留在行尾注释中用于人工升级追踪。不得使用 `uses: docker://...` 这类 Docker image action 绕过 action SHA pinning；需要容器逻辑时应使用已审查的本地 action 或 SHA-pinned GitHub Action。安全回归会写入并清理一个临时 workflow 负例，确认 `- uses: docker://...` 会被依赖回归拒绝。升级 action 时先用 `git ls-remote` 或 GitHub Release 页面确认新 tag 对应的 commit，再更新 SHA 并运行 `make dependency-check` 与 `./scripts/security-regression-check.sh`。

后端：

```bash
cd backend-spring
mvn clean test
```

前端：

```bash
cd web-console
npm run build
```

Rust analyzer：

```bash
cd analyzer-rust
cargo test
cargo check
```

部署 smoke：

```bash
SOURCELENS_BASE_URL=http://localhost:8080 make smoke
```

公开仓库分析主链路 smoke：

```bash
SOURCELENS_BASE_URL=http://localhost:8081 \
SOURCELENS_PUBLIC_REPO_SMOKE_TIMEOUT_SECONDS=700 \
make public-repo-smoke
```

`make public-repo-smoke` 会通过真实 API 创建临时用户、项目、公开 GitHub 仓库和扫描任务，并等待异步扫描完成。成功条件包括：扫描任务为 `SUCCESS`，`prepare_repository`、`analyze_code`、`chunk_code`、`finalize_scan` 四个 execution step 全部成功，核心 scan artifacts 和 artifact records 数量一致，dependency graph 有节点，`ARCHITECTURE_REPORT.reportQuality` 包含 readiness、confidence、summary、gaps、nextActions 与结构完整的核心 evidence checks，且成功扫描生成的报告 confidence 不得低于 35，code_chunks 源码角色检索必须优先返回源码证据，`PUBLIC_REPO_SMOKE_OK.chunkSearch.crossFileRetrievalProof` 必须证明当前 scan 的 code_chunks broad probe 至少覆盖两个文件并暴露 fileStats/source labels，Code QA API 能基于最新成功扫描返回 retrievedChunks 和同一套 `evidenceProfile`，并且在本地 Docker MySQL 可用时校验 `code_chunks`、`code_symbols`、`scan_artifacts` 和 `artifact_records` 计数。默认还会在 Docker MySQL、Node.js 和 artifact 校验脚本可用时以 `auto` 模式调用 `scripts/artifact-quality-check.sh`，对本次扫描的 JSON artifact 执行完整结构质量校验；该校验会拒绝近似不可用的低 confidence 架构报告，也会拒绝把项目风险项混入 `reportQuality.gaps`。发布前可设置 `SOURCELENS_PUBLIC_REPO_SMOKE_ARTIFACT_QUALITY=true` 把该校验升级为强制失败门禁，或设置为 `false` 显式跳过。默认仓库为 `https://github.com/LJunP/Pawnshop-Management-System.git`、默认分支 `main`；可用 `SOURCELENS_PUBLIC_REPO_SMOKE_REPO_URL`、`SOURCELENS_PUBLIC_REPO_SMOKE_BRANCH`、`SOURCELENS_PUBLIC_REPO_SMOKE_TIMEOUT_SECONDS`、`SOURCELENS_PUBLIC_REPO_SMOKE_DB_COUNTS=auto|true|false`、`SOURCELENS_PUBLIC_REPO_SMOKE_ARTIFACT_QUALITY=auto|true|false`、`SOURCELENS_PUBLIC_REPO_SMOKE_CLEANUP=true`、`SOURCELENS_PUBLIC_REPO_SMOKE_CLAIM_NOISE=auto|true|false` 和 `SOURCELENS_PUBLIC_REPO_SMOKE_CLAIM_NOISE_CONFIGURE_MOCK=true|false` 覆写。

Code QA claim citation noise focused proof 可通过 `SOURCELENS_PUBLIC_REPO_SMOKE_CLAIM_NOISE=true` 强制启用。该 proof 会在真实公开仓库扫描成功后配置 dev/test `MOCK` LLM，调用 Code QA API，并在 `PUBLIC_REPO_SMOKE_OK.codeQa.claimCitationNoiseBoundary` 中记录结构化结果。通过条件包括：`probeKind=REAL_PUBLIC_REPO_CODE_QA_CLAIM_CITATION_NOISE`、`noiseKinds` 覆盖 fenced code、inline code、timestamp log 和 exception line、`citationEnforcementStatuses=[RETRY_FAILED]`、`coverageStatus=NONE`、`claimCitationStatus=REVIEW`、`roleDistributionStatus=REVIEW_UNCITED`、`maxRepairCandidateCount=0`、`rawAnswerStored=false`、`rawPromptStored=false`。该 proof 只验证 SourceLens 对假 citation 噪声的 fail-closed 行为，不验证真实外部 LLM provider 质量。

公开仓库 retained sample 的 UI smoke 还必须输出 `PUBLIC_REPO_UI_SMOKE_OK.qaFromEvidence.claimCitationNoiseBoundary`。该 marker 使用临时 `MOCK` LLM 在真实 UI QA 页触发 fake citation noise，证明 fenced code、inline code、timestamp log 和 exception line 中的 `[C1]` 不会被 UI 呈现为可采信引用。通过条件包括：`surface=PUBLIC_REPO_UI_CLAIM_CITATION_NOISE_BOUNDARY`、当前 scan 绑定、`groundingStatuses` 只能为 `UNVERIFIED/PARTIAL`、`citationEnforcementStatuses=[RETRY_FAILED]`、`coverageStatus=NONE`、`claimCitationStatus=REVIEW`、`roleDistributionStatus=REVIEW_UNCITED`、`answerCitationsCitedByAnswer=false`、`repairCandidateActionVisible=false`、`repairEvidenceGateBlockedVisible=true`、`rawAnswerStored=false`、`rawPromptStored=false`、`providerQualityClaim=false`、`llmFactClaim=false`，并且 `llmSetup.status=OK`、`llmCleanup.status=OK`。如果 release verifier 拒绝该 marker，优先检查是否把负向 fake citation 场景伪造成 READY/VERIFIED、是否显示了修复候选、是否泄露 raw answer/prompt，或是否使用了跨 scan 的 evidence。

最近一次 retained public repo UI smoke live proof：`projectId=329`、`repositoryId=290`、`scanTaskId=246`、commit `3eaf38582997afa5acff8990f48ce9c5f200e3ea`，通过命令 `SOURCELENS_PUBLIC_REPO_SMOKE_UI=true SOURCELENS_PUBLIC_REPO_SMOKE_CLEANUP=false make public-repo-smoke` 生成并保留。该运行输出 `PUBLIC_REPO_UI_SMOKE_OK` 和 `PUBLIC_REPO_SMOKE_OK`，三视口通过，claim noise UI gate 保持 `NONE / REVIEW / REVIEW_UNCITED / RETRY_FAILED`，且临时 MOCK LLM setup/cleanup 均为 `OK`。该 retained sample 可用于后续手工查看和继续 UI/report quality 调试；它不是新的 full release evidence package。

在 release evidence 中强制公开仓库主链路 smoke 时使用 `SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PUBLIC_REPO_SMOKE=true make release-evidence`；缺少 `SOURCELENS_BASE_URL` 会记录 `public-repo-smoke` required failure 并保留可被 `verify-release-evidence` 复核的证据包，显式 `false` 会写入标准 SKIP。

文件级风险修复候选 smoke：

```bash
SOURCELENS_BASE_URL=http://localhost:8080 make file-bound-repair-smoke
```

`make file-bound-repair-smoke` 会创建临时本地 Git fixture，触发真实扫描，验证 `ARCHITECTURE_REPORT` 中的大文件 `MAINTAINABILITY` 风险携带 `filePath`，验证 `LargeController.java` 可被 code_chunks 检索，并构造带 `projectId`、`repositoryId`、`scanTaskId`、`filePath`、`source` 和 `targetDesc` 的 AutoRepair 候选 URL。该 smoke 不创建 AutoRepair 任务、不调用 LLM、不写远端仓库，默认清理临时项目和临时 fixture；发布证据中可用 `SOURCELENS_RELEASE_EVIDENCE_INCLUDE_FILE_BOUND_REPAIR_SMOKE=true|false|auto` 控制是否强制执行或跳过。

AutoRepair patch readiness smoke：

```bash
SOURCELENS_BASE_URL=http://localhost:8080 make autorepair-patch-smoke
```

`make autorepair-patch-smoke` 会创建临时本地 Git fixture，完成真实扫描，配置 dev/test profile 下可用的 `MOCK` LLM provider，创建带 `scanTaskId` 和 `filePath` 的 AutoRepair 任务，并等待任务进入 `PATCH_READY`。成功条件包括：来源扫描为 `SUCCESS`，架构报告存在文件级 `MAINTAINABILITY` 风险，AutoRepair 保留来源 `scanTaskId` 和规范化文件路径，生成 `CHANGE_PATCH` artifact，统一执行任务 `sourceType=AUTO_REPAIR` 进入 `SUCCESS` 且 `prepare_workspace` / `generate_patch` step 成功，并写入 `AUTO_REPAIR_PATCH_READY` 审计日志。该 smoke 只验证“候选到可审查 patch”的闭环，不提交 PR、不写远端仓库、不依赖真实外部模型 key；默认清理临时项目和 fixture。若后端不是 dev/test profile 或禁用了 `MOCK` provider，该 smoke 应失败，不能用真实 provider key 替代本地回归。发布证据中可用 `SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AUTOREPAIR_PATCH_SMOKE=true|false|auto` 控制是否强制执行或跳过；默认 `auto` 在存在 `SOURCELENS_BASE_URL` 时运行该 smoke，显式 `false` 会写入标准 SKIP，显式 `true` 但缺少 base URL 会写入 required failure。

扫描治理时间线聚合接口：

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/projects/$PROJECT_ID/scan-tasks/$SCAN_TASK_ID/governance-timeline
```

该接口只读返回当前 scan 的治理快照，包含 `summary`、`resources`、`events`、`limits`、`truncated`、`warnings` 和 `attributionGaps`。排查报告页治理时间线时优先检查该聚合响应，而不是分别追踪 AutoRepair、AgentTask、AgentToolCall、AuditLog 和 execution 的前端请求。后端必须保证 project/scan 边界：AutoRepair、AgentTask、AgentToolCall 使用 `projectId + scanTaskId`，AuditLog 使用 `projectId + resourceType=SCAN_TASK + resourceId=scanTaskId`，Artifact 使用 `projectId + ownerType=SCAN_TASK + ownerId=scanTaskId`，ExecutionTask 使用 `projectId + sourceType/sourceId`。

本地回归命令：

```bash
cd backend-spring && mvn -q -Dtest=ScanTaskGovernanceTimelineControllerTest,ScanTaskGovernanceTimelineServiceTest test
node scripts/validate-frontend-ui.mjs
cd web-console && npm run build
make scan-governance-timeline-ui-smoke
```

`make scan-governance-timeline-ui-smoke` 必须输出 `SCAN_GOVERNANCE_TIMELINE_SMOKE_OK`，并证明 `mockedApiOnly=true`、`unhandledApiRequests=0`、`foreignScanExcluded=true` 和 `viewports` 包含 `1440x900` / `320x740`。当前该 smoke 是 mock-driven UI 合同，不等价于真实公开仓库 retained sample 的治理时间线 live evidence。

公开仓库 retained sample 的 UI smoke 使用 `PUBLIC_REPO_UI_SMOKE_OK.governanceTimeline` 证明真实后端聚合接口可用。启用 derived governance 验收时，marker 还必须包含 `patchEvidence` 子对象，证明当前 scan-bound `PATCH_READY` AutoRepair 已具备 `CHANGE_PATCH` artifact、`AUTO_REPAIR_PATCH_READY SUCCESS` audit、`AUTO_REPAIR` repair execution 和 `generate_patch` step。该证据必须绑定当前 `autoRepairId` / `scanTaskId`，并证明 foreign patch evidence hidden。发布证据复核时，`scripts/verify-release-evidence.sh` 会拒绝缺 patch evidence、artifact owner drift、audit source drift、execution source drift、step drift 或 foreign evidence visible 的伪造 marker。

dev/test retained sample 可通过 scan governance smoke seed 补齐治理演示数据；该 seed 只允许在非生产 profile 使用，不得作为生产数据修复入口。生产环境必须来自真实 AutoRepair、artifact、audit 和 execution 流程。

公开仓库 retained sample 的 UI smoke 还必须输出 `PUBLIC_REPO_UI_SMOKE_OK.codeKnowledge`。该子合同来自真实 `/api/projects/{projectId}/code-chunks/search` 响应，用于证明当前扫描的 code_chunks 知识库可用：`totalChunks > 0`、`resultCount > 0`、`embeddedChunks <= totalChunks`、`retrievalModes` 为 `KEYWORD/STABLE_FALLBACK/SEMANTIC_FALLBACK/HYBRID` 之一、`readiness` 为 `READY/REVIEW`、`currentScanOnly=true`、source label/file path/evidence type/file stats 可见。无本地 embedding 配置时，`embeddedChunks=0` 可以接受，但不得把 `NO_CONTEXT` 或 `GAP` 伪装成 release OK。

`PUBLIC_REPO_UI_SMOKE_OK.codeKnowledge.crossFileEvidence` 是公开仓库 retained sample 的跨文件证据门禁。它使用同一个 `code-chunks/search` API 发起空 query broad probe，固定 `limit=24`，并要求 `resultCount >= 2`、`uniqueFiles >= 2`、`fileStatsUniqueFiles >= 2`、`currentScanOnly=true`、`sourceLabelsVisible=true` 和 `minFileEvidenceSatisfied=true`。该检查用于证明报告解释和 Agent 理解可以看到多文件上下文；它不改变证据抽屉 `limit=3` UX，也不新增后端 API。

`citationCoverage` 是 Project QA 引用治理的量化字段。运行 public repo smoke、public repo UI smoke 或 report evidence drawer smoke 时，成功 marker 必须证明 verified 路径 `repairCandidateCount > 0`，并证明 unverified 路径 `coveragePercent=0`、`repairCandidateCount=0`。如果 verifier 报 coverage mismatch，先检查 QA 响应中的 `answerCitations[].citedByAnswer` 是否与 marker 的 `citedChunkCount`、`citationCoverage.citedEvidenceCount` 一致；不要通过放宽 verifier 解决。

本地性能回归排查时，同一 smoke 还应观察后端日志中的扫描落库阶段：`CodeGraphPersistenceService` 应在一次图谱持久化阶段写入 symbols/relations，`CodeChunkService` 保存 17001 个 chunks 应保持在秒级，并且不应出现 MyBatis-Plus 非事务 `saveBatch` 警告。若该阶段回到几十秒级，优先检查 `code_symbols`、`code_relations` 和 `code_chunks` 的批量 INSERT 路径。

阶段 12 基准采集：

```bash
SOURCELENS_PHASE12_BASELINE_ENV_FILE=/path/to/prod.env \
make phase12-baseline
```

`make phase12-baseline` 只读查询数据库，输出符号/关系规模、多级调用链查询耗时和 execution task 重试复杂度。脚本默认读取 `SOURCELENS_PHASE12_BASELINE_ENV_FILE` / `SOURCELENS_PREFLIGHT_ENV_FILE` / `deploy/.env`，也可以继续用进程环境传入 `DB_URL`、`DB_USERNAME` 和 `DB_PASSWORD`；真实 env 文件会在读取数据库密码前要求非 symlink、普通非空、可读且不得开放 group/world 权限。`SOURCELENS_PHASE12_MYSQL_EXECUTOR=auto` 会优先使用可用的 host mysql，在宿主机没有 mysql CLI 但 `sourcelens-mysql` 容器运行时，会使用容器内 mysql client 做只读查询；Docker 执行器不通过命令行参数传入数据库密码。脚本会校验 MySQL JDBC URL、正整数阈值和 MySQL 连接超时，避免错误参数生成不可复现的阶段 12 证据。只有输出证明触发 `docs/PHASE12_BASELINE.md` 中的阈值后，才应进入 Neo4j、pgvector、Temporal 或 analyzer daemon 的 ADR 与试点。

若强制 phase12 baseline 但缺少 `DB_USERNAME` / `DB_PASSWORD` 等数据库凭据，证据包会记录 `phase12-baseline` required failure，并且仍必须通过 `make verify-release-evidence DIR=release-evidence/<run-id>` 或 `scripts/verify-release-evidence.sh` 复核。

P6 public repo UI claim citation noise focused release evidence：

```bash
cd backend-spring && mvn -q -DskipTests package
cd ..
SERVER_PORT=19081 make backend-jar
```

确认 stable backend jar 运行健康：

```bash
curl -fsS http://127.0.0.1:19081/actuator/health
```

生成 focused evidence：

```bash
SOURCELENS_BASE_URL=http://127.0.0.1:19081 \
SOURCELENS_RELEASE_EVIDENCE_RUN_ID=public-repo-ui-claim-noise-$(date +%Y%m%d-%H%M%S) \
SOURCELENS_RELEASE_EVIDENCE_ENV_FILE=deploy/.env.example \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_VERIFY=false \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PREFLIGHT=false \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_SMOKE=false \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PUBLIC_REPO_SMOKE=true \
SOURCELENS_RELEASE_EVIDENCE_PUBLIC_REPO_SMOKE_UI=true \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_FILE_BOUND_REPAIR_SMOKE=false \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AUTOREPAIR_PATCH_SMOKE=false \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PATCH_READY_UI_SMOKE=false \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_DASHBOARD_NEXT_ACTION_UI_SMOKE=false \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_REPORT_EVIDENCE_DRAWER_UI_SMOKE=false \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_SCAN_GOVERNANCE_TIMELINE_UI_SMOKE=false \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AGENT_CHAT_AUDIT_UI_SMOKE=false \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AGENT_CHAT_TOOL_AUDIT_SMOKE=false \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AUDIT_WORKBENCH_SMOKE=false \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PHASE12=false \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_SANDBOX_DRILL=false \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_GITHUB_APP_DRILL=false \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_GITHUB_WEBHOOK_DRILL=false \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_LLM_PROVIDER_RUN=false \
SOURCELENS_PUBLIC_REPO_SMOKE_REPO_URL=https://github.com/LJunP/Pawnshop-Management-System.git \
SOURCELENS_PUBLIC_REPO_SMOKE_BRANCH=main \
SOURCELENS_PUBLIC_REPO_SMOKE_TIMEOUT_SECONDS=900 \
SOURCELENS_PUBLIC_REPO_SMOKE_CLEANUP=false \
SOURCELENS_PUBLIC_REPO_SMOKE_DB_COUNTS=auto \
SOURCELENS_PUBLIC_REPO_SMOKE_ARTIFACT_QUALITY=auto \
./scripts/release-evidence.sh
```

复核：

```bash
./scripts/verify-release-evidence.sh release-evidence/<run-id>
SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-public-repo-ui-marker
```

合格包必须证明：

- `manifest.txt` 中 `include_public_repo_smoke=true` 且 `public_repo_smoke_ui=true`。
- `status.tsv` 中 `public-repo-smoke` 为 `OK`。
- `public-repo-smoke.log` 同时存在唯一 `PUBLIC_REPO_SMOKE_OK` 和 `PUBLIC_REPO_UI_SMOKE_OK`，并绑定同一 `projectId/repositoryId/scanTaskId`。
- `PUBLIC_REPO_UI_SMOKE_OK.realBackend=true`，`mockedApi=false`，viewports 覆盖 `1440x900 / 390x844 / 320x740`。
- `qaFromEvidence.claimCitationNoiseBoundary.status=OK`，`noiseKinds` 覆盖 `exception-line`、`fenced-code`、`inline-code`、`timestamp-log`。
- fake citation noise 必须保持 `groundingStatuses=["UNVERIFIED"]`、`citationEnforcementStatuses=["RETRY_FAILED"]`、`coverageStatus=NONE`、`claimCitationStatus=REVIEW`、`roleDistributionStatus=REVIEW_UNCITED`。
- UI repair gate 必须保持 `maxRepairCandidateCount=0`、`repairCandidateActionVisible=false`、`repairEvidenceGateBlockedVisible=true`。
- marker 必须保持 `rawAnswerStored=false`、`rawPromptStored=false`、`providerQualityClaim=false`、`llmFactClaim=false`。

注意：该 focused package 只证明 P6 public repo UI claim citation noise boundary 已进入 release evidence，不是新的 full release authority。若要声明 full authority，必须重新运行完整 `release` profile 并通过 verifier。

P9 PR Reviews comments stale guard：

```bash
npm --prefix web-console run build
node scripts/validate-frontend-ui.mjs
CI=true make pr-reviews-detail-selection-ui-smoke
```

成功日志必须包含唯一 `PR_REVIEWS_DETAIL_SELECTION_SMOKE_OK`，并证明：

- `mockedApiOnly=true`、`unhandledApiRequests=0`。
- `commentStaleGuard.completedToCompletedSwitch=true`。
- `commentStaleGuard.staleCommentLeakCount=0`。
- `commentStaleGuard.selectedCommentReviewIdMatches=true`。
- `repairReadiness.usesSelectedReviewCommentsOnly=true`。
- `staleDetailRejected=true`。
- `sharedSelectableRow.detailRegionLinked=true`。
- `tableScroller.containedInViewport=true`、`tableScroller.overflowXAuto=true`。
- `runtimeIssues=0`、`noHorizontalOverflow=true`。
- viewports 覆盖 `1440x900 / 390x844 / 320x740`。

该 smoke 会模拟 completed PR A 的 comments 请求延迟，然后切换到 completed PR B；合格结果必须证明 A 的旧评论不会写入 B 的详情，也不会影响 B 的 AutoRepair readiness 目标文件。该检查是 mock-driven P9 focused UI guard，不证明真实 PR 审查质量、后端风险评分、AutoRepair patch 生成、真实 PR 创建或 GitHub App/webhook E2E。

P6 Code QA semantic candidate rerank guard：

```bash
mvn -q -f backend-spring/pom.xml -Dtest=CodeQaRetrievalServiceTest test
node scripts/validate-frontend-ui.mjs
git diff --check -- \
  backend-spring/src/main/java/com/sourcelens/module/agent/service/CodeQaRetrievalService.java \
  backend-spring/src/test/java/com/sourcelens/CodeQaRetrievalServiceTest.java
```

合格结果必须证明 `CodeQaRetrievalService` 在 question embedding 可用时先计算 semantic candidate 的 cosine similarity，再截取 top candidates；尾部高相似 semantic target 不得因为输入顺序被提前丢弃。该检查不证明 DB 层具备 ANN/vector ordering，不证明真实 LLM answer quality，也不刷新 full release authority。

P6 public repo code understanding method-anchor fixture：

发布证据口径必须使用稳定 jar 后端，不要用 `mvn spring-boot:run` 或 `target/classes`：

```bash
cd backend-spring && mvn -DskipTests package
SERVER_PORT=8080 make backend-jar
```

```bash
SOURCELENS_BASE_URL=http://localhost:8080 \
SOURCELENS_PUBLIC_REPO_SMOKE_REPO_URL=https://github.com/LJunP/Pawnshop-Management-System.git \
SOURCELENS_PUBLIC_REPO_SMOKE_BRANCH=main \
SOURCELENS_PUBLIC_REPO_SMOKE_CLEANUP=false \
./scripts/public-repo-analysis-smoke.sh
```

成功日志必须包含唯一 `PUBLIC_REPO_SMOKE_OK`，且 marker 必须包含：

- `codeUnderstandingFixture.contractVersion=1`。
- `codeUnderstandingFixture.status=OK`。
- `codeUnderstandingFixture.probeKind=METHOD_ANCHOR_STACK_TRACE`。
- `codeUnderstandingFixture.projectId/scanTaskId` 绑定顶层 project/scan。
- `anchor.filePath` 为 safe relative path。
- `anchor.startLine <= anchor.methodLine <= anchor.endLine`。
- `methodSearch.queryShape=class#method`，且命中文件和行区间覆盖 anchor。
- `stackTraceSearch.queryShape=java-stack-frame`，且 `stackClass/stackMethod/stackFile/stackLine` 与 anchor 一致。
- `codeQa.primaryMatched=true`，`retrievalMode` 不得为 `NO_CONTEXT`，primary 文件和行区间覆盖 anchor。
- `currentScanOnly=true`、`noRawPromptOrAnswer=true`、`providerQualityClaim=false`、`llmFactClaim=false`。

复核：

```bash
SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-public-repo-marker
SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite static
```

focused release evidence retained sample：

```bash
SOURCELENS_BASE_URL=http://localhost:8080 \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_VERIFY=false \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PREFLIGHT=false \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_SMOKE=false \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PUBLIC_REPO_SMOKE=true \
SOURCELENS_RELEASE_EVIDENCE_PUBLIC_REPO_SMOKE_UI=false \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_FILE_BOUND_REPAIR_SMOKE=false \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AUTOREPAIR_PATCH_SMOKE=false \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PATCH_READY_UI_SMOKE=false \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AUDIT_WORKBENCH_SMOKE=false \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PHASE12=false \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_SANDBOX_DRILL=false \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_GITHUB_APP_DRILL=false \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_GITHUB_WEBHOOK_DRILL=false \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_LLM_PROVIDER_RUN=false \
SOURCELENS_PUBLIC_REPO_SMOKE_REPO_URL=https://github.com/LJunP/Pawnshop-Management-System.git \
SOURCELENS_PUBLIC_REPO_SMOKE_BRANCH=main \
SOURCELENS_PUBLIC_REPO_SMOKE_CLEANUP=false \
./scripts/release-evidence.sh

./scripts/verify-release-evidence.sh release-evidence/<run-id>
```

已验证 retained sample：`release-evidence/public-repo-code-understanding-20260703162834`，`scanTaskId=250`，anchor `ConfigController#page`，`crossFileRetrievalProof.readiness=GAP` 但 `uniqueFiles=4`、`fileStatsUniqueFiles=4`、`minFileEvidenceSatisfied=true`。

该 proof 只证明当前 public repo scan 内 Java 方法锚点、stack trace 和 Code QA primary chunk 的定位闭环。不得用它声明通用代码语义理解、所有语言支持、所有 stack trace 支持、LLM 事实正确、真实 patch 可用、GitHub App/webhook E2E、private repos 或生产部署。

P6 Project QA code understanding lens：

```bash
node scripts/validate-frontend-ui.mjs
npm --prefix web-console run build
make project-qa-recoverable-ui-smoke
make report-evidence-drawer-ui-smoke
```

合格结果必须证明：

- `ProjectDetail` QA / code_chunks 检索区存在中文 `代码理解定位入口`。
- method anchor 输入如 `OrderService#createOrder` 能显示当前 scan、主证据位置、source label、证据角色、证据类型、相关分、召回模式和 Readiness。
- `定位检索`、`解释此处`、`复制引用` 三个动作可见。
- `PROJECT_QA_RECOVERABLE_SMOKE_OK.codeUnderstandingLens` 中 `currentScanBound=true`、`inputKind=METHOD_ANCHOR`、`rawStackStored=false`、`rawPromptStored=false`、`noHorizontalOverflow=true`。
- 报告证据抽屉和 QA trust signal 使用中文-first heading，窄屏 `390x844`、`320x740` 不出现横向溢出。

该检查是 mocked UI + static/build focused evidence，不新增后端 API，不证明通用代码语义理解、LLM 事实正确、真实 patch 可用或 full release authority。

P6 Public repo UI codeUnderstandingLens contract：

```bash
node scripts/validate-frontend-ui.mjs
npm --prefix web-console run build
SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-public-repo-ui-marker
```

public repo UI live smoke 需要先设置：

```bash
export SL_PUBLIC_REPO_UI_PROJECT_ID=<project-id>
export SL_PUBLIC_REPO_UI_REPOSITORY_ID=<repository-id>
export SL_PUBLIC_REPO_UI_SCAN_TASK_ID=<scan-task-id>
export SL_PUBLIC_REPO_UI_TOKEN=<login-token>
export SL_PUBLIC_REPO_API_BASE_URL=http://127.0.0.1:8080
make public-repo-ui-smoke
```

合格结果必须证明：

- `PUBLIC_REPO_UI_SMOKE_OK.codeUnderstandingLens.status=OK`。
- `surface=PROJECT_QA_CODE_UNDERSTANDING_LENS`。
- `scanTaskId/requestScanTaskId/responseScanTaskId` 与顶层 scan 一致。
- `responseStatus=200`，`resultCount > 0`，`currentScanOnly=true`。
- `inputKinds` 包含 `FILE_LINE`，`queryShapes` 包含 `file:line`。
- `primaryMatched=true`，`targetFileMatchesExpected=true`。
- `sourceLabels` 为 `C1`/`C2` 这类 response-local label。
- `primaryReferences` 为 safe relative `path:start-end`，且匹配 `expectedEvidenceFile`。
- `locateSearchVisible`、`explainHereVisible`、`copyReferenceVisible` 全部为 true。
- `rawAnswerStored/rawQueryStored/rawStackStored/rawPromptStored/providerQualityClaim/llmFactClaim` 全部为 false。

该检查只证明当前 public repo scan 的 UI 代码定位闭环，不证明通用语义理解、所有语言、所有 stack trace、LLM 事实正确、真实 patch 可用、GitHub App/webhook E2E、private repos 或生产部署。

P6 AgentChat codeUnderstanding handoff：

```bash
node scripts/validate-frontend-ui.mjs
npm --prefix web-console run build
make agent-chat-closure-rail-ui-smoke
make project-qa-recoverable-ui-smoke
```

合格结果必须证明：

- ProjectDetail 的 `代码理解定位入口` 提供 `交给 Agent`。
- `/agent-chat?handoff=code-understanding` 只包含结构化证据字段，不包含 `prompt`。
- AgentChat 显示 `代码理解交接包`。
- 未选择会话时不自动发送。
- 创建会话后 `输入给 SourceLens Agent 的问题` 文本框保留本地生成的证据草稿。
- `AGENT_CHAT_CLOSURE_RAIL_SMOKE_OK.codeUnderstandingHandoff.rawPromptInUrl=false`。
- `rawPromptInUrlBlocked=true`、`draftPrefilled=true`、`conversationCreatedOrSelected=true`、`autoSent=false`。
- `unhandledApiRequests=0`、`runtimeIssues=0`、`noHorizontalOverflow=true`。

该 handoff 是 AgentChat 预填续问入口，不是完整 AgentTask 闭环。不得用它声明 Agent 已理解代码、已验证事实、已创建修复任务或已具备写操作权限。

P6 AgentChat codeUnderstanding AgentTask binding：

```bash
mvn -f backend-spring/pom.xml -Dtest=AgentTaskServiceTest test
node scripts/validate-frontend-ui.mjs
npm --prefix web-console run build
make agent-chat-closure-rail-ui-smoke
```

合格结果必须证明：

- `CreateAgentTaskRequest.conversationId` 可绑定已有 Conversation。
- 后端拒绝跨项目 conversation、已绑定 conversation、并发重复绑定。
- Conversation 绑定写入使用 `agent_task_id IS NULL` 条件更新，不能覆盖已有 AgentTask。
- AgentChat `代码理解交接包` 提供 `新建绑定任务 / 创建绑定任务`。
- `POST /api/agent-tasks` 请求体只包含结构化 evidence receipt，不包含 raw prompt、raw stack、源码正文、模型回答或 token。
- `AGENT_CHAT_CLOSURE_RAIL_SMOKE_OK.codeUnderstandingHandoff.agentTaskBinding.taskStatus=PENDING`。
- `boundByBackend=true`、`structuredInputOnly=true`、`rawPromptStored=false`、`rawStackStored=false`。
- `autoSent=false` 且没有 `/api/conversations/{id}/messages` 自动请求。
- `autoStarted=false` 且没有 `/api/agent-tasks/{id}/start` 自动请求。
- 绑定成功后右侧闭环栏展示真实 `Conv #`、`AgentTask #`、`Scan #`，并保留草稿等待用户手动发送。

该 binding 是受控任务草稿，不是自动 Agent 执行。不得用它声明 LLM 已分析、事实已验证、工具已执行、修复候选已创建、PR 已准备或 GitHub App/Webhook E2E 已完成。

P6 AgentChat binding release evidence contract：

```bash
bash -n scripts/release-evidence.sh scripts/verify-release-evidence.sh scripts/security-regression-check.sh
node scripts/validate-frontend-ui.mjs
make agent-chat-closure-rail-ui-smoke
SOURCELENS_SECURITY_REGRESSION_VERBOSE=false ./scripts/security-regression-check.sh --suite release-verifier-agent-chat-marker
```

最小 focused release evidence 复核可只开启 AgentChat closure rail：

```bash
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_VERIFY=false \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PREFLIGHT=false \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_SMOKE=false \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PUBLIC_REPO_SMOKE=false \
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_AGENT_CHAT_CLOSURE_RAIL_UI_SMOKE=true \
./scripts/release-evidence.sh
./scripts/verify-release-evidence.sh <generated-run-dir>
```

合格结果必须证明：

- manifest 为 `release_evidence_profile_schema: 3`，并包含 `include_agent_chat_closure_rail_ui_smoke`。
- `agent-chat-closure-rail-ui-smoke` 为 OK 时，日志中必须且只能有一个 `AGENT_CHAT_CLOSURE_RAIL_SMOKE_OK` marker。
- marker 必须证明 `mockedApiOnly=true`、`unhandledApiRequests=0`、`runtimeIssues=0`、`noHorizontalOverflow=true`。
- `codeUnderstandingHandoff` 必须证明结构化 handoff、no raw prompt URL、no auto-send、no provider/LLM claim。
- `agentTaskBinding` 必须证明 `PENDING` / `CUSTOM`、same project/scan、backend binding、structured-only、no raw prompt/stack、no auto-start。
- `manualSend` 必须证明用户点击后才发送：`triggeredByUser=true`、`messageRequestAfterClick=true`、`autoSentBeforeClick=false`、`agentTaskStillPending=true`、`autoStarted=false`、`writeToolTriggered=false`、`closureRailStillBound=true`、`auditReviewVisible=true`、`rawPromptStored=false`、`rawStackStored=false`。
- 顶层 `agentTaskId` 必须等于 `agentTaskBinding.agentTaskId`。
- 安全回归会篡改 marker、重新计算 checksum，再确认 `verify-release-evidence` 仍拒绝伪造。

该合同只证明受控 AgentTask binding 证据可被 release verifier 消费，不证明 Agent 已执行、LLM 事实正确、工具已调用、AutoRepair/PR/GitHub App/Webhook 已完成。

P6 public repo relation-aware evidence optional-present strict gate：

```bash
bash -n scripts/verify-release-evidence.sh scripts/security-regression-check.sh
node scripts/validate-frontend-ui.mjs
SL_PUBLIC_REPO_UI_PROJECT_ID=1 \
SL_PUBLIC_REPO_UI_REPOSITORY_ID=1 \
SL_PUBLIC_REPO_UI_SCAN_TASK_ID=1 \
SL_PUBLIC_REPO_UI_TOKEN=dummy \
npm --prefix web-console run smoke:public-repo-ui -- --list
SOURCELENS_SECURITY_REGRESSION_VERBOSE=false \
./scripts/security-regression-check.sh --suite release-verifier-public-repo-ui-marker
```

合格结果必须证明：

- `PUBLIC_REPO_UI_SMOKE_OK.qaFromEvidence.relationAwareEvidenceReason` 是可选字段；真实 response 没有 `Graph relation:` 时不得强行宣称。
- 如果该字段存在，release verifier 必须严格校验 `surface=PUBLIC_REPO_UI_RELATION_AWARE_EVIDENCE_REASON`、`marker=Graph relation:`、reason 计数、adjacent context、cited primary、UI 可见性和 no-overclaim。
- security regression 必须拒绝状态、surface、marker、计数、adjacent、primary、UI、provider/LLM overclaim 和 raw field 伪造。

该 gate 不证明真实 public repo 每轮都有 graph relation，也不刷新 full release authority。

## Dashboard executive briefing release evidence gate（2026-07-10 当前合同）

以下合同覆盖本文较早位置记录的 Dashboard 双 viewport 历史合同。当前 `dashboard-next-action-ui-smoke` 必须输出并由 verifier 精确校验：

- 7 个 Dashboard case 在 `1440x900`、`1024x768`、`768x1024`、`390x844`、`320x740` 五档 viewport 的完整 visited coverage。
- `executiveBriefing.scope=DASHBOARD_EXECUTIVE_BRIEFING_DECISION_READABILITY`，四 signals 和 `signalCount=4`。
- 五档 columns、`expectedColumnsHonored`、`copyReadable`、`actionVisible` 为 true；P9/RBAC/生产部署/商业化完成宣称为 false。
- `visualEvidence` 精确包含五张唯一 `review-risk-report` PNG；稳定文件名、安全包路径、实际 PNG、尺寸、bytes、像素多样性、panel/title/button viewport 边界和主按钮白字均合格。
- 五张 PNG 全部进入 release package allowlist、权限和 checksum 校验。
- inventory 的 `dashboardExecutiveBriefingEvidence.complete` 只有在 marker 字段、visited coverage 和 visual evidence coverage 同时完整时才为 true。

定向验证：

```bash
make dashboard-next-action-ui-smoke
make release-evidence-inventory-self-test
SOURCELENS_SECURITY_REGRESSION_VERBOSE=false \
./scripts/security-regression-check.sh --suite release-verifier-dashboard-ui-marker
```

当前 full authority `release-current-schema-20260705-0610` 早于本合同。刷新 release/nightly 之前，它不能证明 Dashboard executive briefing 新 schema 已进入 full authority。
