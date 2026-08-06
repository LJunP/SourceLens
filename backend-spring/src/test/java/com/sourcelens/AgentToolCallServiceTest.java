package com.sourcelens;

import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sourcelens.module.agent.entity.AgentToolCall;
import com.sourcelens.module.agent.mapper.AgentToolCallMapper;
import com.sourcelens.module.agent.service.AgentToolCallService;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AgentToolCallServiceTest {

    @Mock
    private AgentToolCallMapper agentToolCallMapper;

    private AgentToolCallService agentToolCallService;

    @BeforeEach
    void setUp() {
        agentToolCallService = new AgentToolCallService();
        ReflectionTestUtils.setField(agentToolCallService, "baseMapper", agentToolCallMapper);
    }

    @Test
    @SuppressWarnings({"rawtypes", "unchecked"})
    void listByProject_shouldFilterByConversationIdWithProjectBoundary() {
        if (TableInfoHelper.getTableInfo(AgentToolCall.class) == null) {
            TableInfoHelper.initTableInfo(new MapperBuilderAssistant(new MybatisConfiguration(), ""), AgentToolCall.class);
        }
        Page<AgentToolCall> expected = new Page<>(1, 20, 1);
        when(agentToolCallMapper.selectPage(any(), any())).thenReturn(expected);
        ArgumentCaptor<LambdaQueryWrapper> wrapperCaptor = ArgumentCaptor.forClass(LambdaQueryWrapper.class);

        Page<AgentToolCall> result = agentToolCallService.listByProject(
                10L, 1, 20, "read_file", 99L, 42L, true);

        assertSame(expected, result);
        verify(agentToolCallMapper).selectPage(any(), wrapperCaptor.capture());
        String sqlSegment = wrapperCaptor.getValue().getSqlSegment();
        assertTrue(sqlSegment.contains("project_id"));
        assertTrue(sqlSegment.contains("tool_name"));
        assertTrue(sqlSegment.contains("conversation_id"));
        assertTrue(sqlSegment.contains("scan_task_id"));
        assertTrue(sqlSegment.contains("success"));
    }
}
