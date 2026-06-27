package com.sourcelens.module.agent.tool;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 工具执行上下文,携带项目路径等运行时信息,由 AgentRuntime 注入。
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ToolContext {

    /** 当前项目的本地仓库根目录 */
    private String projectRootPath;

    /** 项目 ID */
    private Long projectId;

    /** 当前分析绑定的扫描任务 ID，可为空表示使用项目最新成功扫描 */
    private Long scanTaskId;

    /** 对话 ID */
    private Long conversationId;

    /** 发起工具调用的用户 ID */
    private Long userId;
}
