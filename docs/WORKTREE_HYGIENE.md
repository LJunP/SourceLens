# SourceLens 工作区整理说明

> AIOS v2.3 状态：`P0 SUPPORTING INPUT`。当前巨大脏工作区禁止自动 clean/stash/reset；恢复顺序和 review slices 以 `aios/P0_GATE.md` 为准。

状态：P0基线切片支持输入；是否完成只由 `aios/P0_GATE.md` 与Truth Registry判定。

## 1. 当前现象

本轮重构过程中多次运行前端构建命令：

```bash
npm run build
```

项目 `.gitignore` 已包含：

```gitignore
web-console/dist/
web-console/tsconfig*.tsbuildinfo
```

版本库历史中曾跟踪了部分 `web-console/dist` 文件，例如：

- `web-console/dist/index.html`
- `web-console/dist/assets/index-CrTY2WP_.js`

因此每次 Vite 重新构建都会造成已跟踪 dist 文件变脏，同时新生成的 hashed bundle 又被 `.gitignore` 忽略。

## 2. 已处理

已执行：

```bash
git rm --cached -r web-console/dist
git rm --cached web-console/tsconfig.tsbuildinfo web-console/tsconfig.node.tsbuildinfo
```

已确认：

```bash
git ls-files web-console/dist web-console/tsconfig.tsbuildinfo web-console/tsconfig.node.tsbuildinfo
```

预期结果为空，表示这些构建产物不再被版本库跟踪。本地文件仍可由 `npm run build` 生成，但会被 `.gitignore` 忽略，并可通过 `make clean` 清理。

另发现本地历史构建目录 `backend-spring/target 2/`，属于误生成的 Maven target 副本。`.gitignore` 与 `.dockerignore` 已使用 `**/target 2/` 通用忽略，`make clean` 也会递归清理所有 `target 2` 目录，避免该目录残留或进入 Docker build context。

Rust analyzer 的 `analyzer-rust/target/` 和 `make analyzer` 生成的根 `bin/` 也属于构建产物。它们已被 Git/Docker build context 忽略，并由 `make clean` 统一清理，避免本地验证后残留二进制目录影响分组审查。

## 3. 回归保护

`scripts/security-regression-check.sh` 已增加检查：

- `web-console/dist` 不得被 Git 跟踪。
- `web-console/tsconfig.tsbuildinfo` 不得被 Git 跟踪。
- `web-console/tsconfig.node.tsbuildinfo` 不得被 Git 跟踪。
- `.gitignore` 和 `.dockerignore` 必须保留 `**/target 2/`。
- `make clean` 必须递归清理 `target 2` 误生成目录，并跳过 `.git`、`web-console/node_modules`、常规 Maven/Rust target 这类大目录。
- `make clean` 必须清理 `.DS_Store`。
- `make clean` 必须清理前端 `dist`、`.vite` 和 `tsconfig*.tsbuildinfo`。
- `make clean` 必须清理 `analyzer-rust/target` 和根 `bin/`，并在 cargo 可用时先执行 `cargo clean`。
- `worktree-inventory` 必须把前端构建输出、Vite cache、递归 `target 2`、`.DS_Store`、`analyzer-rust/target` 和根 `bin` 统一归入 Repository hygiene / generated artifacts；安全回归会用临时 Git index 动态模拟误跟踪这些生成物，并且只清理自己创建的 probe 文件和本次新建的空目录，避免它们被混入业务模块审查、误删已有构建缓存或在干净环境留下空父目录。

## 4. 为什么单独处理

构建产物清理属于仓库维护行为，不应混入安全、任务、GitHub App 或 AutoRepair 功能重构提交。单独提交可以降低回滚风险，也便于 code review 聚焦。

## 5. 分组审查工具

当前 worktree 包含大量安全、任务、分析、Agent、前端、沙箱、GitHub App、CI 和文档改动。正式提交前先生成分组清单：

```bash
make worktree-inventory
```

该命令只读取 `git status --short --untracked-files=all`，不会修改工作区。输出按以下顺序建议审查：

1. Repository hygiene / generated artifacts
2. Operations, CI and release gates
3. Security and auth boundary
4. Observability and audit
5. Execution tasks, artifacts and automation
6. Analysis, graph and project lifecycle
7. Agent, LLM and tools
8. Sandbox and workspace isolation
9. GitHub App and repository integration
10. Frontend console
11. Rust analyzer
12. Backend shared infrastructure
13. Documentation and handoff

如需只审查一个分组，可以传完整分组名或稳定 slug：

```bash
make worktree-inventory GROUP=repository-hygiene-generated-artifacts
make worktree-inventory GROUP=operations-ci-and-release-gates
make worktree-inventory GROUP="Agent, LLM and tools"
```

未知分组会以非零退出，并列出所有可用分组及对应 slug，避免拆审脚本静默漏掉文件。

严格拆审或发布证据复核时，可以要求清单中不得出现兜底 `Other` 分组：

```bash
SOURCELENS_WORKTREE_INVENTORY_STRICT=true make worktree-inventory
```

若出现 `Other`，应先把对应路径补进明确分组，或人工确认它不属于当前重构范围后再继续。

`SOURCELENS_WORKTREE_INVENTORY_STRICT` 只接受 `true/false` 及常见布尔别名，值会先去掉空白和成对引号；拼写错误会直接失败，避免正式拆审或发布证据复核时把 strict 开关静默降级为关闭。

每一组审查时都应先确认该组相关测试已经覆盖，再合并或提交。若某个文件被自动分到不完全准确的组，以人工模块边界为准；该工具的目标是防漏项和降低 review 噪声，不替代工程判断。

最近一次清单复核：2026-06-26 00:04 +0800，`make worktree-inventory` 通过。当前主要分组规模为：安全 18、审计/可观测性 12、分析/图谱/项目生命周期 43、执行任务/Artifact/自动化 52、Agent/LLM/工具 48、沙箱/Workspace 10、GitHub App/仓库集成 31、前端 42、Rust analyzer 9、运维/CI/发布门禁 23、构建产物清理 4、文档/交接 14、Backend shared infrastructure 3。

本轮复核同时修正了清单工具的分类规则：`PromptInjectionGuardTest` 和 `V014__add_agent_tool_calls.sql` 归入 Agent/LLM 组，`ScanStatServiceTest` 归入分析/图谱/项目生命周期组。清单工具也支持单组过滤，便于按模块拆审；顶部 review order 和实际分组输出现在共用同一份 category 数组，避免建议顺序和实际输出顺序漂移；strict 模式会在出现 `Other` 分组时失败，且 `SOURCELENS_WORKTREE_INVENTORY_STRICT` 拼写错误会 fail-closed。安全回归门禁已锁住这些分类入口和过滤行为，避免后续拆审时重新落入 uncategorized、因分组名错误静默漏项，或因 strict 开关拼错而静默降级。

本轮继续修正当前工作区的新增分析文件分类：`V029__add_code_chunk_embedding_model.sql` 和 `AnalyzerRunnerTest.java` 已归入 Analysis, graph and project lifecycle，而不是兜底 Backend shared infrastructure。安全回归门禁已锁住这两条分类规则，避免 code_chunks embedding 边界和 analyzer runner 阻塞回归测试在拆审时脱离分析主线。

最近一次刷新还把 `backend-spring/src/test/java/com/sourcelens/common/security/*` 测试归入安全组，并将剩余跨模块共享文件统一标为 Backend shared infrastructure，避免拆审输出继续使用含糊的 uncategorized 标签。

本轮已补齐并实测 `make clean` 对前端构建产物的清理：`web-console/dist`、`web-console/.vite`、`web-console/node_modules/.vite` 和 `web-console/tsconfig*.tsbuildinfo` 均会被清理。随后又把清理范围扩展为递归清理已忽略的 `target 2` 误生成目录和 `.DS_Store`，并在查找时跳过 `.git`、`web-console/node_modules`、常规 Maven/Rust target 这类大目录。本轮继续把 `analyzer-rust/target` 和根 `bin/` 纳入清理，并在 cargo 可用时先执行 `cargo clean`，再兜底删除目录。`worktree-inventory` 也会把这些生成物路径统一归入 Repository hygiene / generated artifacts，避免误跟踪生成物时被混入安全、前端、Rust 或后端共享模块审查。该规则已纳入安全回归门禁，并通过临时 Git index 动态验证误跟踪生成物会进入仓库卫生组；动态探针只删除自己创建的唯一 probe 文件和本次新建的空目录，不删除已有构建缓存目录，也不会在干净环境留下 `web-console/node_modules` 这类空父目录；随后 `./scripts/security-regression-check.sh`、`git diff --check` 和 `make verify` 均通过。
