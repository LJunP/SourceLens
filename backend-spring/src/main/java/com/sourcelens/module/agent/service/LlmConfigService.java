package com.sourcelens.module.agent.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.sourcelens.common.exception.BizException;
import com.sourcelens.module.agent.dto.LlmConfigRequest;
import com.sourcelens.module.agent.entity.LlmConfig;
import com.sourcelens.module.agent.mapper.LlmConfigMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
public class LlmConfigService extends ServiceImpl<LlmConfigMapper, LlmConfig> {

    /**
     * 创建 LLM 配置
     */
    @Transactional
    public LlmConfig create(LlmConfigRequest req, Long userId) {
        LlmConfig config = LlmConfig.builder()
                .userId(userId)
                .provider(req.getProvider())
                .modelName(req.getModelName())
                .apiKey(req.getApiKey())
                .baseUrl(req.getBaseUrl())
                .temperature(req.getTemperature())
                .maxTokens(req.getMaxTokens())
                .isActive(false)
                .build();
        save(config);
        log.info("创建 LLM 配置: id={}, provider={}, model={}", config.getId(), config.getProvider(), config.getModelName());
        return config;
    }

    /**
     * 用户的所有配置列表
     */
    public List<LlmConfig> listByUser(Long userId) {
        return list(new LambdaQueryWrapper<LlmConfig>()
                .eq(LlmConfig::getUserId, userId)
                .orderByDesc(LlmConfig::getIsActive)
                .orderByDesc(LlmConfig::getCreatedAt));
    }

    /**
     * 获取用户当前激活的配置
     */
    public LlmConfig getActiveConfig(Long userId) {
        return getOne(new LambdaQueryWrapper<LlmConfig>()
                .eq(LlmConfig::getUserId, userId)
                .eq(LlmConfig::getIsActive, true));
    }

    /**
     * 切换激活配置
     */
    @Transactional
    public LlmConfig activate(Long configId, Long userId) {
        LlmConfig config = getById(configId);
        if (config == null || !userId.equals(config.getUserId())) {
            throw BizException.notFound("LlmConfig");
        }
        // 取消同用户所有激活
        List<LlmConfig> all = listByUser(userId);
        for (LlmConfig c : all) {
            if (Boolean.TRUE.equals(c.getIsActive())) {
                c.setIsActive(false);
                updateById(c);
            }
        }
        // 激活目标
        config.setIsActive(true);
        updateById(config);
        log.info("激活 LLM 配置: id={}, model={}", configId, config.getModelName());
        return config;
    }

    /**
     * 删除配置
     */
    @Transactional
    public void remove(Long configId, Long userId) {
        LlmConfig config = getById(configId);
        if (config == null || !userId.equals(config.getUserId())) {
            throw BizException.notFound("LlmConfig");
        }
        removeById(configId);
        log.info("删除 LLM 配置: id={}", configId);
    }

    /**
     * 更新配置
     */
    @Transactional
    public LlmConfig update(Long configId, LlmConfigRequest req, Long userId) {
        LlmConfig config = getById(configId);
        if (config == null || !userId.equals(config.getUserId())) {
            throw BizException.notFound("LlmConfig");
        }
        config.setProvider(req.getProvider());
        config.setModelName(req.getModelName());
        config.setApiKey(req.getApiKey());
        config.setBaseUrl(req.getBaseUrl());
        config.setTemperature(req.getTemperature());
        config.setMaxTokens(req.getMaxTokens());
        updateById(config);
        return config;
    }
}