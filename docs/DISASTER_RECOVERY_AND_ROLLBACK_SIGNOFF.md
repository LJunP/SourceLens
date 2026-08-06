# SourceLens Disaster Recovery and Rollback Signoff

> AIOS v2.3 状态：`SUPPORTING FUTURE OPERATIONS REFERENCE`。生产灾备继续后置；P0-P5 所需的 task checkpoint、disposable workspace 和 Patch rollback 由 AIOS Trust/Evaluation 协议单独定义。

状态：后置生产运维参考；不得在P0触发生产化工作或完成声明。

## 1. 适用范围

本制度用于：

- 数据库备份恢复。
- release 回滚。
- 配置错误恢复。
- evidence 包损坏或 authority 误用。
- 本地/生产运行环境故障恢复。

## 2. 当前结论

当前 SourceLens 仍处于本地优先和 P12-pre 收口阶段。真实生产级灾备恢复和回滚签署尚未完整验收，不得宣称已完成。

## 3. Signoff 条件

进入生产候选前必须满足：

- 备份命令可执行。
- 恢复命令可执行。
- 恢复后核心 smoke 通过。
- rollback preflight 通过。
- 当前 release authority 明确。
- 旧 authority 和失败包不得误用。
- `黄仁勋`、`奥特曼`、`达里奥`、`特朗普` 均签署。

## 4. 演练模板

```text
Date:
Environment:
Backup source:
Restore target:
Release authority:
Rollback target:
Commands:
Result:
Data verification:
Smoke:
Risks:
Signoff:
```

## 5. 阻断条件

- 无法恢复数据库。
- 回滚后 API 或前端不可用。
- authority evidence 不明确。
- backup/rollback 过程需要未记录的人工猜测。
- 涉及 secret 泄漏或权限越界。
