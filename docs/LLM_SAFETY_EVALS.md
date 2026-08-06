# SourceLens LLM Safety Evals

> AIOS v2.3 状态：`INHERITED SAFETY REGRESSION INPUT`。这些 eval 继续有效，但不替代 Baseline Suite、hidden set、独立 evaluator 或真实 provider 质量研究。

状态：Prompt injection 第一版边界、本地红队样例和输出质量评估契约。

## 目标

LLM 安全回归必须覆盖 SourceLens 中最容易被不可信文本污染的入口：

- RAG 检索代码块。
- Agent tool result。
- AutoRepair 目标描述和源代码。
- CI 日志。
- PR 标题、描述和 diff。
- Issue 描述和业务上下文。
- Agent 任务扫描产物和规则分析结果。

这些内容都可能包含伪指令，例如“忽略上文”“泄露密钥”“调用写文件工具”“跳过安全审查”。模型只能把它们当作证据，不能把它们当作系统指令、工具权限、输出 schema 或安全策略。

## 本地回归

运行：

```bash
make llm-safety-check
```

该命令会：

- 校验 `docs/llm-safety-evals/prompt-injection-cases.json` 的红队样例结构。
- 校验 `docs/llm-safety-evals/output-quality-cases.json` 的输出质量评估结构。
- 校验 `docs/llm-safety-evals/provider-run-template.json` 的真实 provider 评估结果格式。
- 确认每个样例都定义了入口、来源、攻击文本、期望边界和 must/must-not 断言。
- 确认每个输出评估都定义了入口、任务、输出契约、必需断言、证据要求和禁止模式。
- 确认真实 provider 评估结果覆盖全部样例，并只记录摘要和 release evidence artifact 路径，不内联原始输出或密钥。
- 确认 provider run 校验器对未知选项、缺少 `--run-id` 值和额外位置参数 fail-closed，避免 release evidence run id 绑定被参数拼写错误静默降级。
- 运行 `PromptInjectionGuardTest` 和 `CodeQaControllerTest`。
- 静态检查关键 LLM 入口仍调用 `PromptInjectionGuard.wrapUntrustedContent(...)`。

`make verify` 已包含该检查。后续新增任何 LLM prompt 入口时，必须先补一条红队样例，再接入 Prompt Guard 和安全回归断言。

## 后续真实模型评估

当前回归不调用真实模型；它验证 prompt 构造和不可信数据边界。真实模型红队评估仍需补充：

- 选择生产候选 provider 和模型版本。
- 对每个样例生成真实 prompt，观察模型是否违反输出 schema、泄露凭据、请求越权工具或扩大任务范围。
- 按 `output-quality-cases.json` 逐项判定模型输出是否满足证据引用、schema、边界、保密和权限约束。
- 复制 `provider-run-template.json` 记录 provider、model、prompt version、case verdict、判定证据和 `release-evidence/` 下的原始输出 artifact 路径；路径必须由安全相对段组成，只允许字母、数字、点、下划线和短横，模板模式下仅 `<run-id>` 可作为占位段。
- 保存 provider、model、prompt version、输出、判定结果和复现时间。
- 对失败样例增加更强的系统说明、输出校验或工具权限拦截。

## 发布证据归档

真实 provider 红队完成后，把已判定的 provider run JSON 和原始输出源目录交给 release evidence：

```bash
SOURCELENS_RELEASE_EVIDENCE_RUN_ID=20260625-llm-redteam \
SOURCELENS_RELEASE_EVIDENCE_LLM_PROVIDER_RUN_FILE=/path/to/provider-run.json \
SOURCELENS_RELEASE_EVIDENCE_LLM_RAW_OUTPUT_DIR=/path/to/raw-output-root \
make release-evidence
```

发布证据脚本会先拒绝 symlink、空文件、不可读文件、权限不可检查/不可解析和 group/world 可访问 provider run 文件；provider run 源文件权限必须可检查且可解析，且 provider run 源文件必须保持私有权限，才能继续运行 `scripts/validate-llm-provider-run.mjs`。校验要求结果覆盖 14 个本地样例，`verdict` 必须是 `pass` 或 `fail`，每条 assertion 的 `passed` 必须是布尔值。通过后文件会被复制为 `release-evidence/<run-id>/llm-provider-run.json`，权限收紧为 `600`，并执行敏感值 scrub。

结果文件不得内联原始模型输出，也不得包含 API key、access token、secret、password 或 private key 字段。每条 `rawOutputArtifact` 必须记录安全相对路径，格式为 `release-evidence/<run-id>/llm-evals/<case>.txt`，其中 `<run-id>` 必须等于本次 `SOURCELENS_RELEASE_EVIDENCE_RUN_ID`；真实 provider run 不得使用 `<run-id>` 占位符、空路径段、`.`/`..` 段、反斜杠、控制字符或含空格/特殊符号的路径段。`SOURCELENS_RELEASE_EVIDENCE_LLM_RAW_OUTPUT_DIR` 必须是私有目录，目录结构要镜像 `llm-evals/...`，源文件必须非空、可读、权限可检查可解析且不得开放 group/world 权限；release evidence 会把这些 raw output artifact 复制到证据包、收紧为 `600`、执行 scrub，并由 `verify-release-evidence` 通过 `llm-provider-run.json` 重建 expected file allowlist，缺失的 raw output artifact 即使重新生成 checksum 也会以 `regular file` 拒绝。

`scripts/validate-llm-provider-run.mjs` 的命令行参数也按 fail-closed 处理：未知 `--option`、`--run-id` 后缺值或额外位置参数都会直接失败，不会回退成“未绑定 run id”的宽松校验。
