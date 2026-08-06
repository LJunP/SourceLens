package com.sourcelens.module.agent.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.sourcelens.module.agent.entity.AgentToolCall;
import com.sourcelens.module.agent.mapper.AgentToolCallMapper;
import org.springframework.stereotype.Service;

@Service
public class AgentToolCallService extends ServiceImpl<AgentToolCallMapper, AgentToolCall> {

    public Page<AgentToolCall> listByProject(Long projectId,
                                             int page,
                                             int pageSize,
                                             String toolName,
                                             Long conversationId,
                                             Long scanTaskId,
                                             Boolean success) {
        int safePage = Math.max(page, 1);
        int safePageSize = Math.min(Math.max(pageSize, 1), 100);
        LambdaQueryWrapper<AgentToolCall> wrapper = new LambdaQueryWrapper<AgentToolCall>()
                .eq(AgentToolCall::getProjectId, projectId)
                .orderByDesc(AgentToolCall::getCreatedAt)
                .orderByDesc(AgentToolCall::getId);
        if (toolName != null && !toolName.isBlank()) {
            wrapper.eq(AgentToolCall::getToolName, toolName.trim());
        }
        if (conversationId != null) {
            wrapper.eq(AgentToolCall::getConversationId, conversationId);
        }
        if (scanTaskId != null) {
            wrapper.eq(AgentToolCall::getScanTaskId, scanTaskId);
        }
        if (success != null) {
            wrapper.eq(AgentToolCall::getSuccess, success);
        }
        return page(new Page<>(safePage, safePageSize), wrapper);
    }
}
