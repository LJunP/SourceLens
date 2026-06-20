package com.sourcelens.module.agent.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.sourcelens.module.agent.entity.ConversationMessage;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ConversationMessageMapper extends BaseMapper<ConversationMessage> {
}