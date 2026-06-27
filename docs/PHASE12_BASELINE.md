# SourceLens Phase 12 Baseline

状态：阶段 12 进入前的基准采集说明。

阶段 12 的目标不是默认引入 Neo4j、pgvector、Temporal 或 analyzer daemon，而是在现有 MySQL、artifact store 和简单异步任务模型出现被证据证明的瓶颈后，再引入专门组件。

## 1. 运行方式

脚本只读查询业务数据库，不写入数据。

```bash
SOURCELENS_PHASE12_BASELINE_ENV_FILE=/path/to/prod.env \
make phase12-baseline
```

`SOURCELENS_PHASE12_BASELINE_ENV_FILE` 默认回退到 `SOURCELENS_PREFLIGHT_ENV_FILE`，再回退到 `deploy/.env`。真实 env 文件会在读取 `DB_PASSWORD` 前校验：必须是非 symlink、普通非空、可读文件，权限必须可检查且可解析，并且不得开放 group/world 权限；`deploy/.env.example` 模板会跳过私有权限检查，缺失文件只回退到进程环境。

也可以通过进程环境显式指定连接信息：

```bash
DB_URL='jdbc:mysql://localhost:3307/sourcelens?useUnicode=true&characterEncoding=utf-8' \
DB_USERNAME=sourcelens \
DB_PASSWORD='<real-db-password>' \
make phase12-baseline
```

如果宿主机没有安装 `mysql` CLI，但 Docker Compose 的 MySQL 容器正在运行，脚本会在默认 `auto` 模式下自动使用容器内的 MySQL client 执行只读查询：

```bash
SOURCELENS_PHASE12_BASELINE_ENV_FILE=deploy/.env \
SOURCELENS_PHASE12_MYSQL_EXECUTOR=auto \
make phase12-baseline
```

可选执行器：

- `SOURCELENS_PHASE12_MYSQL_EXECUTOR`：`auto`、`host` 或 `docker`，默认 `auto`。
- `SOURCELENS_PHASE12_MYSQL_DOCKER_CONTAINER`：Docker MySQL 容器名，默认 `sourcelens-mysql`。
- `SOURCELENS_PHASE12_MYSQL_DOCKER_HOST`：容器内连接 MySQL 的 host，默认 `localhost`。
- `SOURCELENS_PHASE12_MYSQL_DOCKER_PORT`：容器内连接端口，默认 `3306`。

或拆开连接字段：

```bash
DB_HOST=localhost \
DB_PORT=3307 \
DB_NAME=sourcelens \
DB_USERNAME=sourcelens \
DB_PASSWORD='<real-db-password>' \
make phase12-baseline
```

默认选择最近一个有 `code_symbols` 的 scan task。需要固定样本时设置：

```bash
SOURCELENS_PHASE12_SCAN_TASK_ID=123 make phase12-baseline
```

## 2. 可配置阈值

- `SOURCELENS_PHASE12_SYMBOL_RELATION_THRESHOLD`：默认 `500000`，符号与关系总数超过该值才证明需要图/向量侧车评估。
- `SOURCELENS_PHASE12_CALL_CHAIN_MS_THRESHOLD`：默认 `2000`，多级调用链查询超过该耗时才证明需要图查询侧车评估。
- `SOURCELENS_PHASE12_CALL_CHAIN_DEPTH`：默认 `8`，递归调用链采样深度。
- `SOURCELENS_PHASE12_MAX_ATTEMPTS_THRESHOLD`：默认 `3`，单个 execution task 尝试次数超过该值才证明需要工作流编排器评估。
- `SOURCELENS_PHASE12_MYSQL_CONNECT_TIMEOUT`：默认 `5`，MySQL CLI 连接超时秒数，避免基准采集在错误地址上长时间挂起。
- Docker 执行器只读使用 MySQL 容器自身的 `MYSQL_USER`、`MYSQL_PASSWORD` 和 `MYSQL_DATABASE`，不会把数据库密码作为 `docker exec -e KEY=value` 命令行参数传入。

脚本会在查询前校验阈值、端口、连接超时和 scan task id 必须为正整数；如果使用 `DB_URL`，它必须是 `jdbc:mysql://.../<database>` 形式。配置值可以带一层 shell 引号，脚本会先做 trim 和 unquote。

## 3. 决策口径

可以考虑进入阶段 12 的条件：

- `symbol_relation_total` 超过阈值。
- `call_chain_query_ms` 超过阈值。
- `max_execution_attempts` 超过阈值，并且失败恢复、取消、重试已经难以由当前 execution task/attempt/log 模型解释。

不应进入阶段 12 的情况：

- 只是因为项目“未来可能变大”。
- 只是因为图数据库或工作流引擎更高级。
- 没有固定 scan task、固定数据库规模和可重复命令输出。
- 只有单次偶发慢查询，无法复现。

调用链采样使用带分隔符的路径环检测，避免 symbol id `12` 和 `112` 这类子串关系导致递归路径被误判。

## 4. 采集后动作

保存脚本输出到发布或架构评审记录中：

```bash
make phase12-baseline | tee phase12-baseline.txt
```

若 verdict 显示触发条件未证明，继续阶段 12 前生产化收口：

- 真实环境 smoke test。
- GitHub App 端到端演练。
- Docker sandbox 兼容性演练。
- 工作区分组审查和提交。

若 verdict 显示触发条件存在，先写阶段 12 ADR，再做最小可逆试点：

- 图查询瓶颈：优先评估只读图侧车，不替代 MySQL 主库。
- 向量检索瓶颈：优先评估 pgvector 或专用向量库，只承载 embedding 检索。
- 任务补偿复杂度瓶颈：优先评估 Temporal 或轻量工作流层，只接管长任务编排。
