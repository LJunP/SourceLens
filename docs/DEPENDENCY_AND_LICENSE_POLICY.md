# SourceLens Dependency and License Policy

> AIOS v2.3 状态：`SUPPORTING SUPPLY-CHAIN POLICY`。新组件不得因路线图预设引入，必须由实验、迁移兼容性和 ADR 共同证明需要。

状态：长期执行。本文定义依赖、漏洞、license 和供应链安全规则。

## 1. 覆盖范围

- Maven dependencies。
- npm packages。
- Rust crates。
- Docker base images。
- GitHub Actions。
- 本地脚本依赖。

## 2. 引入新依赖条件

新依赖必须满足：

- 解决明确问题。
- 维护活跃或风险可接受。
- license 可接受。
- 不引入明显供应链风险。
- 不显著增加包体积或启动成本，除非有明确收益。

## 3. 禁止事项

- 禁止为小工具引入重型框架。
- 禁止引入无人维护且替代成本高的核心依赖。
- 禁止提交 lockfile 以外的下载产物。
- 禁止把 secret 写入 package scripts、Maven config、Dockerfile 或 CI。

## 4. 检查责任

| 依赖类型 | Owner |
| --- | --- |
| Maven | `比尔盖茨` |
| npm/Vite/React | `扎克伯格` |
| Rust | `梁文峰` |
| Docker/CI | `黄仁勋` |
| security/license | `奥特曼` / `达里奥` |

## 5. 阶段检查

阶段收口或 release 前必须检查：

- lockfile 是否合理更新。
- 是否有未解释的大版本升级。
- 是否有新增 license 风险。
- 是否有漏洞或供应链警告。
- Docker image 是否可构建且无明显 secret 泄漏。
