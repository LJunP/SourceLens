package com.sourcelens.module.repository.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.sourcelens.module.repository.entity.GitHubWebhookDelivery;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface GitHubWebhookDeliveryMapper extends BaseMapper<GitHubWebhookDelivery> {
}
