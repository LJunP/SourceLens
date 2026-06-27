# SourceLens Operations Runbook

状态：阶段 12 前生产化收口版本。

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

backup preflight 会检查数据库备份/恢复工具链、`DB_URL`/`DB_USERNAME`/`DB_PASSWORD`、备份目录、保留期、加密要求、workspace 和 artifact 目录可读性，以及 `SOURCELENS_BACKUP_RESTORE_DRILL_EVIDENCE_FILE` 指向的恢复演练证据文件。默认读取 `deploy/.env`，也可以通过 `SOURCELENS_BACKUP_PREFLIGHT_ENV_FILE=/path/to/prod.env make backup-preflight` 指定真实部署 env 文件；真实 env 文件必须是非空、可读、非 symlink 的普通文件，权限必须可检查且可解析，并且不得开放 group/world 访问权限。

`make backup-restore-drill` 会用 `SOURCELENS_BACKUP_DRILL_BACKUP_ID` 指定的备份编号执行本地恢复演练，并把标准证据写入 `SOURCELENS_BACKUP_DRILL_EVIDENCE_FILE`；若未配置该新变量，则兼容写入 `SOURCELENS_BACKUP_RESTORE_DRILL_EVIDENCE_FILE`。典型命令是 `SOURCELENS_BACKUP_DRILL_BACKUP_ID=<backup_id> SOURCELENS_BACKUP_DRILL_EVIDENCE_FILE=/private/path/restore-drill.env make backup-restore-drill`。该 drill 会先按 `<backup_id>-database.sql.gz`、`<backup_id>-workspace.tar.gz`、`<backup_id>-artifacts.tar.gz`、`<backup_id>-checksums.sha256` 这类分隔符前缀匹配四类 artifact，验证它们都是非 symlink 普通文件、非空、可读、不可 group/world 写，并用 `checksums.sha256` 覆盖 database、workspace、artifacts 三类真实 SHA-256。随后它会把数据库 dump 恢复到 `SOURCELENS_BACKUP_DRILL_MYSQL_CONTAINER` 指向的 Docker MySQL 临时 scratch database，拒绝包含 `CREATE DATABASE`、`DROP DATABASE`、`USE` 或 mysql client escape 的 dump；workspace 和 artifacts 归档只会解压到私有临时目录，并拒绝绝对路径、`..`、反斜杠和控制字符路径。成功证据必须包含 `restore_drill_status=pass`、`database_restore=pass`、`workspace_restore=pass`、`artifact_restore=pass`、`checksum_verification=pass`、`database_tables`、`workspace_entries`、`artifact_entries` 和 `mysql_executor=docker:<container>`，该证据随后可被 `make backup-preflight` 与 `make release-evidence` 复核。

rollback preflight 会检查不可变回滚目标、回滚备份编号、回滚计划文件、计划 freshness、止损开关和 smoke target。默认读取 `deploy/.env`，也可以通过 `SOURCELENS_ROLLBACK_PREFLIGHT_ENV_FILE=/path/to/prod.env make rollback-preflight` 指定真实部署 env 文件；真实 env 文件必须满足同一套非空、可读、非 symlink、普通文件、权限可检查可解析和私有权限边界。
回滚 preflight 会在启动期对止损开关执行 fail-closed 校验：`SOURCELENS_AGENT_WRITE_PATCH_ENABLED`、`SOURCELENS_AGENT_EXEC_TEST_ENABLED`、`SOURCELENS_AGENT_CREATE_PR_ENABLED` 和 `SOURCELENS_AUTOREPAIR_SUBMIT_PR_ENABLED` 必须未设置或明确为 false/0/no/n，拼错、true 或 yes 都会直接失败，避免回滚期间仍保留 Agent/AutoRepair 写操作或 PR 提交能力。
回滚 preflight 也会复查 `SOURCELENS_BACKUP_DIR` 的安全边界：目录必须存在、不可为 symlink、不得位于 git worktree 或 `SOURCELENS_WORKSPACE` 内、必须可读可搜索，权限必须可检查且可解析，并且不得开放 group/world 权限。

release evidence 会生成 `release-evidence/<run-id>/` 证据目录，记录 `make verify`、生产 preflight、备份 preflight、回滚 preflight、可选 smoke test、可选 Docker sandbox drill、可选 GitHub App drill、可选 GitHub webhook drill、可选阶段 12 baseline 和可选 LLM provider 安全评估结果。它还会保存 git manifest、`git status --short`、`git diff --stat` 和 `worktree-inventory.md`，用于追踪验收时的代码状态和分组审查边界，但不会归档完整 diff；worktree inventory 的临时分组目录会显式收紧为 `700`；默认 `SOURCELENS_RELEASE_EVIDENCE_WORKTREE_INVENTORY_STRICT=true`，若 worktree inventory 出现 `Other` 未分类路径会把发布证据标为 required failure，避免未归类文件混入证据包。release evidence 启动时会先设置 `umask 077`，即使中途失败也不会依赖调用者默认 umask 留下 group/world 可读的半成品证据文件；所有步骤结束后会先把证据包内普通文件统一收紧为 `600`，再生成私有 `checksums.sha256`，覆盖证据包内除 checksum manifest 自身以外的文件，用于发布记录中的完整性复核。`SOURCELENS_RELEASE_EVIDENCE_RUN_ID` 必须是 1-64 位安全标识，只允许字母、数字、点、下划线和短横，且不得是 `.` 或 `..`；`SOURCELENS_RELEASE_EVIDENCE_DIR` 若指向已有目录，该目录必须不是 symlink，权限必须可检查且可解析，并且不得开放 group/world 权限。`SOURCELENS_RELEASE_EVIDENCE_ENV_FILE` / `SOURCELENS_PREFLIGHT_ENV_FILE` 指向的真实 env 文件会在写入证据目录前被独立校验：允许 `deploy/.env.example` 模板和缺失文件走进程环境兜底；若真实 env 文件存在，则必须不是 symlink、必须是普通非空文件、必须可读且不得开放 group/world 权限。默认 preflight 使用 warn-only 模式，目的是保存真实环境缺口和人工演练证据；若配置了 `SOURCELENS_BACKUP_RESTORE_DRILL_EVIDENCE_FILE` 或 `SOURCELENS_ROLLBACK_PLAN_FILE`，源文件必须不可 group/world 写，手工证据源文件权限必须可检查且可解析；恢复演练证据的 `restore_drill_completed_at` 和文件 mtime、回滚计划文件 mtime 都必须落在各自 max-age 窗口内且不得是未来时间；release evidence 还会独立复查 `SOURCELENS_BACKUP_DIR` 不为 symlink、不在 git worktree 或 `SOURCELENS_WORKSPACE` 内、可读可搜索并且不开放 group/world 权限，再复查对应 backup id 的完整 artifact 集与 checksum 内容；通过后才会分别复制为私有的 `backup-restore-drill-evidence.txt` 和 `rollback-plan.txt`，并在落盘后 scrub 敏感配置值；若配置了 `SOURCELENS_BASE_URL` 会运行 smoke；若强制 smoke 但缺少 `SOURCELENS_BASE_URL`，证据包会记录 smoke required failure，并且仍必须通过 `make verify-release-evidence DIR=release-evidence/<run-id>` 或 `scripts/verify-release-evidence.sh` 复核；若 Docker daemon 可达会运行 sandbox drill，若 GitHub App drill 变量完整会运行只读 App/installation/repository 验证，若 `SOURCELENS_BASE_URL` 和 `GITHUB_APP_WEBHOOK_SECRET` 完整会运行 webhook 签名、重复 delivery、缺 delivery id 和坏签名验证，若存在 `mysql` CLI 且数据库变量完整会运行阶段 12 baseline；若配置了 `SOURCELENS_RELEASE_EVIDENCE_LLM_PROVIDER_RUN_FILE`，源文件必须不是 symlink、不能为空、必须可读、权限必须可检查且可解析，并且不可 group/world 写，随后会校验真实 provider run JSON 覆盖全部样例、无 secret 字段且不内联 raw output，再复制为私有 `llm-provider-run.json` 并执行敏感值 scrub。证据日志中的命令行会对 `password`、`token`、`secret`、`private_key` 等 env 参数值做 `<redacted>` 脱敏；步骤输出和归档的人工证据文件、LLM provider run 文件落盘后也会 scrub 预置敏感 key 以及真实 env 文件/进程环境中名称包含 password、token、secret、private_key、api_key、credential、authorization 等片段的配置值，避免 smoke token、数据库密码、JWT、GitHub secret 或 provider key 进入证据包。证据目录已加入 `.gitignore` 与 `.dockerignore`，不得手工提交到版本库或打入镜像构建上下文。

若配置 `SOURCELENS_RELEASE_EVIDENCE_LLM_PROVIDER_RUN_FILE`，还必须配置 `SOURCELENS_RELEASE_EVIDENCE_LLM_RAW_OUTPUT_DIR`。该目录必须是非 symlink、可读可搜索、权限可检查可解析且不开放 group/world 权限的私有目录，内部结构必须镜像 provider run 中的 `rawOutputArtifact` 去掉 `release-evidence/<run-id>/` 后的相对路径，例如 `llm-evals/code-comment-ignore-system.txt`。每条 raw output artifact 路径必须位于 `release-evidence/<run-id>/llm-evals/` 下，`<run-id>` 必须匹配本次 release evidence run id；源文件必须非空、可读、权限可检查可解析且不开放 group/world 权限。release evidence 会复制这些 raw output artifact、收紧为 `600` 并 scrub；如果复制失败，会移除半成品 `llm-provider-run.json` 和 `llm-evals/`，让失败证据包仍可复核。raw output artifact 在 `llm-evals/` 中归档后会进入 checksum，`verify-release-evidence` 会根据 `llm-provider-run.json` 重建 expected file allowlist；删除任意 raw output artifact 后即使重算 checksum，复核仍会以 `regular file` 拒绝。

若配置了 `SOURCELENS_BACKUP_RESTORE_DRILL_EVIDENCE_FILE` 和 `SOURCELENS_ROLLBACK_PLAN_FILE` 但源文件缺失或不是普通文件，证据包会分别记录 `backup-restore-drill-evidence` / `rollback-plan` required failure，并且仍必须通过 `make verify-release-evidence DIR=release-evidence/<run-id>` 或 `scripts/verify-release-evidence.sh` 复核。

`make verify-release-evidence DIR=release-evidence/<run-id>` 会先校验证据包结构，再重新计算证据包内除 `checksums.sha256` 之外所有文件的 SHA-256，并与归档 manifest 精确比对。结构校验要求 `summary.md`、`status.tsv`、`manifest.txt`、`git-status.txt`、`git-diff-stat.txt` 和 `worktree-inventory.md` 存在且为私有普通文件，`git-status.txt`、`git-diff-stat.txt` 和 `worktree-inventory.md` 不得含控制字符，`summary.md` 必须包含 release evidence 标题和 summary 计数，`summary.md` / `manifest.txt` 的 `run_id` 和 `env_file` 必须一致，`run_id` 必须是安全短标识，传给 verifier 的证据目录末段、`summary.md` 的 `evidence_dir` 末段都必须等于 `run_id`，两个 `created_at` 必须是可被 UTC `date` 解析的 ISO-8601 秒级时间，`manifest.txt` 的 `git_head` 必须是 40 位小写 SHA-1 或 `unavailable`；且 `## Steps` 中每个 step bullet 的状态、slug、标题和详情必须与 `status.tsv` 一一对应，`required_failures`、`optional_warnings`、`skipped` 必须分别匹配 `status.tsv` 中的 `FAIL`、`WARN`、`SKIP` 行数；`status.tsv` 必须有固定表头，并且 `git-metadata`、`worktree-inventory`、`make-verify`、`prod-preflight`、`backup-preflight`、`rollback-preflight`、`backup-restore-drill-evidence`、`rollback-plan`、`smoke`、`phase12-baseline`、`sandbox-drill`、`github-app-drill`、`github-webhook-drill` 和 `llm-provider-run` 标准 step 行都必须各出现一次；每行 `status` 与 `exit_code` 必须语义一致：`OK` 只能是 `0`，`SKIP` 只能是 `-`，`WARN` 必须是非零数字，`FAIL` 只能是 `-` 或非零数字；核心 `git-metadata` 状态必须保持 `OK`，核心 `worktree-inventory` 不得被伪造成 `SKIP`；`manifest.txt` 的 include 模式也必须与 `status.tsv` 一致：`true` 模式的 step 只能是 `OK` 或 `FAIL`，不能被粉饰成 `SKIP` 或 `WARN`；`false` 模式的 step 必须是 `SKIP`，且 detail 必须是对应 `SOURCELENS_RELEASE_EVIDENCE_INCLUDE_*=false`；`auto` 模式不能伪造 `WARN`；`worktree_inventory_strict=true` 不能把 worktree inventory 降级成 `WARN`，且当 `worktree-inventory` 状态为 `OK` 时，`worktree-inventory.md` 不得包含非零 `Other` 分组或 strict failure marker；strict failure 时必须保留非零 `Other` 分组和 strict failure marker；每个标准 step 的 `log_file` 必须匹配固定证据文件名，其中 `backup-restore-drill-evidence` 和 `rollback-plan` 允许 `.log` 跳过/失败记录或 `.txt` 已归档人工证据，每一行引用的文件都必须存在且为 `600`；验证器还会从核心文件、`status.tsv` 引用文件、成功 LLM provider run 的 `llm-provider-run.json` 以及其中声明的 `llm-evals/` raw output artifact 构建 expected file allowlist，额外文件即使重新生成 checksum manifest 也会被 `verify-release-evidence` 以 `unexpected file` 拒绝。它还会拒绝 symlink 证据目录、包内 symlink、未知或重复 step slug、非 `600` 普通文件、manifest 自包含、绝对路径、dot-segment、反斜杠、控制字符、实际包内不安全文件路径或 checksum 不匹配，适合在发布记录归档前后重复执行。

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
- 数据库备份需要 `mysqldump`，恢复演练需要 `mysql`；workspace/artifact 归档需要 `tar`、`gzip` 和 checksum 工具。
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

## 3. Smoke Test 验收

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

## 4. Actuator 暴露策略

当前默认暴露：

- `/actuator/health`：公开，用于负载均衡和基础探活。
- `/actuator/info`：公开，仅允许非敏感构建信息。
- `/actuator/metrics`：需要认证，不应直接暴露到公网。

反向代理建议：

- 公网只放行 `/api/**` 和前端静态资源。
- `/actuator/metrics` 只允许内网 Prometheus、堡垒机或受控运维网段访问。
- 禁止在 metrics tag 中加入源码路径、prompt、token、PR diff、CI 原始日志或用户输入正文。

## 5. GitHub App 端到端验收

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

## 6. 沙箱验收

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

该脚本会创建受限 Docker 容器，使用和生产默认一致的 digest-pinned sandbox 镜像、`network=none`、非 root 用户、`--cap-drop ALL`、`no-new-privileges`、显式 runtime script entrypoint、`--read-only`、受限 `/tmp` tmpfs、CPU/内存/pid 限制和 `--memory-swap=<memory>`。脚本会先创建权限为 `700` 的临时 workspace，再挂载到容器 `/workspace`，随后通过 `docker inspect` 检查 HostConfig，并在容器内验证无默认网络路由、root filesystem 只读、`/tmp` 带 `noexec,nosuid`、pid/memory cgroup 可见以及 workspace 挂载可写。后端 Docker sandbox executor 也会清空镜像默认 entrypoint，避免 `alpine/git` 这类镜像把用户命令误解释成镜像入口子命令。

release evidence 默认会在 Docker daemon 可达时自动归档 sandbox drill；如需强制真实发布必须跑该演练：

```bash
SOURCELENS_RELEASE_EVIDENCE_INCLUDE_SANDBOX_DRILL=true make release-evidence
```

若强制 Docker sandbox drill 但 Docker daemon 不可达，证据包会记录 `sandbox-drill` required failure，并且仍必须通过 `make verify-release-evidence DIR=release-evidence/<run-id>` 或 `scripts/verify-release-evidence.sh` 复核。

## 7. 回滚与止损

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

## 8. 发布前验证命令

PR 和 `main` 分支 push 会通过 `.github/workflows/ci.yml` 自动运行安全回归检查、依赖回归检查、后端、LLM safety、前端、Rust analyzer 和后端 Docker 镜像基础验证。CI 顶层 `permissions` 只允许 `contents: read`，不得通过 job-level `permissions` 提权；每个 `actions/checkout` step 都必须设置 `persist-credentials: false`，安全回归会逐项检查，避免不需要 push 的 job 把 GitHub token 持久写入本地 git config。CI 不读取仓库 secrets，也不使用 `pull_request_target`；真实 GitHub App、webhook、Docker sandbox 和生产环境凭据演练必须通过对应 drill/preflight/release evidence 手工入口完成。发布前仍建议在本地或发布环境重复执行以下命令，尤其是在依赖、Docker、GitHub App 或环境变量变更后。

提交前一键验证：

```bash
make verify
```

`make verify` 会依次执行 Shell 脚本语法检查、Git diff 空白检查、后端测试、前端构建、Rust analyzer check、Rust analyzer 测试、LLM safety 回归检查、安全回归检查和依赖回归检查。目录内命令通过 `run_in_dir` 直接 `cd` 到目标目录后执行，不把仓库路径拼入 `bash -lc` 字符串。部署后再运行 `make smoke` 验证已启动服务。

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

`SOURCELENS_RELEASE_EVIDENCE_INCLUDE_VERIFY` 和 `SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PREFLIGHT` 只接受 `true` 或 `false`。可选证据项 `SOURCELENS_RELEASE_EVIDENCE_INCLUDE_SMOKE`、`SOURCELENS_RELEASE_EVIDENCE_INCLUDE_PHASE12`、`SOURCELENS_RELEASE_EVIDENCE_INCLUDE_SANDBOX_DRILL`、`SOURCELENS_RELEASE_EVIDENCE_INCLUDE_GITHUB_APP_DRILL`、`SOURCELENS_RELEASE_EVIDENCE_INCLUDE_GITHUB_WEBHOOK_DRILL`、`SOURCELENS_RELEASE_EVIDENCE_INCLUDE_LLM_PROVIDER_RUN` 只接受 `auto`、`true` 或 `false`；拼写错误会直接失败，避免发布证据被静默跳过。

归档真实 LLM provider 红队结果：

```bash
SOURCELENS_RELEASE_EVIDENCE_LLM_PROVIDER_RUN_FILE=/path/to/provider-run.json \
make release-evidence
```

provider run 文件应按 `docs/llm-safety-evals/provider-run-template.json` 填写，并且必须是已完成判定结果：每个 case 的 `verdict` 只能是 `pass` 或 `fail`，每条 assertion 的 `passed` 必须是布尔值。release evidence 会拒绝 symlink、空文件、不可读文件、权限不可检查或不可解析的文件、group/world 可访问文件、`rawOutput` 内联字段、secret/token/private key 字段、不在 `release-evidence/<run-id>/llm-evals/` 下的 raw output artifact 路径，和本次 release run id 不一致的 artifact 路径，以及包含空段、`.`/`..` 段、反斜杠、控制字符、真实 `<run-id>` 占位符或非安全字符路径段的 artifact 路径；路径段只允许字母、数字、点、下划线和短横。源文件应先 `chmod 600`，复制到证据包后也会收紧为 `600` 并执行敏感值 scrub。原始输出源目录通过 `SOURCELENS_RELEASE_EVIDENCE_LLM_RAW_OUTPUT_DIR` 指定，应先 `chmod 700`，并按 `llm-evals/...` 镜像 provider run 中的 `rawOutputArtifact`；每个 raw output artifact 源文件应先 `chmod 600`。

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

`make public-repo-smoke` 会通过真实 API 创建临时用户、项目、公开 GitHub 仓库和扫描任务，并等待异步扫描完成。成功条件包括：扫描任务为 `SUCCESS`，`prepare_repository`、`analyze_code`、`chunk_code`、`finalize_scan` 四个 execution step 全部成功，核心 scan artifacts 和 artifact records 数量一致，dependency graph 有节点，`ARCHITECTURE_REPORT.reportQuality` 包含 readiness、confidence、summary、gaps、nextActions 与结构完整的核心 evidence checks，code_chunks 检索 API 能返回可追溯的文件/行号/证据类型和结构化 `evidenceProfile`，Code QA API 能基于最新成功扫描返回 retrievedChunks 和同一套 `evidenceProfile`，并且在本地 Docker MySQL 可用时校验 `code_chunks`、`code_symbols`、`scan_artifacts` 和 `artifact_records` 计数。默认还会在 Docker MySQL、Node.js 和 artifact 校验脚本可用时以 `auto` 模式调用 `scripts/artifact-quality-check.sh`，对本次扫描的 JSON artifact 执行完整结构质量校验；发布前可设置 `SOURCELENS_PUBLIC_REPO_SMOKE_ARTIFACT_QUALITY=true` 把该校验升级为强制失败门禁，或设置为 `false` 显式跳过。默认仓库为 `https://github.com/LJunP/Pawnshop-Management-System.git`、默认分支 `main`；可用 `SOURCELENS_PUBLIC_REPO_SMOKE_REPO_URL`、`SOURCELENS_PUBLIC_REPO_SMOKE_BRANCH`、`SOURCELENS_PUBLIC_REPO_SMOKE_TIMEOUT_SECONDS`、`SOURCELENS_PUBLIC_REPO_SMOKE_DB_COUNTS=auto|true|false`、`SOURCELENS_PUBLIC_REPO_SMOKE_ARTIFACT_QUALITY=auto|true|false` 和 `SOURCELENS_PUBLIC_REPO_SMOKE_CLEANUP=true` 覆写。

本地性能回归排查时，同一 smoke 还应观察后端日志中的扫描落库阶段：`CodeGraphPersistenceService` 应在一次图谱持久化阶段写入 symbols/relations，`CodeChunkService` 保存 17001 个 chunks 应保持在秒级，并且不应出现 MyBatis-Plus 非事务 `saveBatch` 警告。若该阶段回到几十秒级，优先检查 `code_symbols`、`code_relations` 和 `code_chunks` 的批量 INSERT 路径。

阶段 12 基准采集：

```bash
SOURCELENS_PHASE12_BASELINE_ENV_FILE=/path/to/prod.env \
make phase12-baseline
```

`make phase12-baseline` 只读查询数据库，输出符号/关系规模、多级调用链查询耗时和 execution task 重试复杂度。脚本默认读取 `SOURCELENS_PHASE12_BASELINE_ENV_FILE` / `SOURCELENS_PREFLIGHT_ENV_FILE` / `deploy/.env`，也可以继续用进程环境传入 `DB_URL`、`DB_USERNAME` 和 `DB_PASSWORD`；真实 env 文件会在读取数据库密码前要求非 symlink、普通非空、可读且不得开放 group/world 权限。`SOURCELENS_PHASE12_MYSQL_EXECUTOR=auto` 会优先使用可用的 host mysql，在宿主机没有 mysql CLI 但 `sourcelens-mysql` 容器运行时，会使用容器内 mysql client 做只读查询；Docker 执行器不通过命令行参数传入数据库密码。脚本会校验 MySQL JDBC URL、正整数阈值和 MySQL 连接超时，避免错误参数生成不可复现的阶段 12 证据。只有输出证明触发 `docs/PHASE12_BASELINE.md` 中的阈值后，才应进入 Neo4j、pgvector、Temporal 或 analyzer daemon 的 ADR 与试点。

若强制 phase12 baseline 但缺少 `DB_USERNAME` / `DB_PASSWORD` 等数据库凭据，证据包会记录 `phase12-baseline` required failure，并且仍必须通过 `make verify-release-evidence DIR=release-evidence/<run-id>` 或 `scripts/verify-release-evidence.sh` 复核。
