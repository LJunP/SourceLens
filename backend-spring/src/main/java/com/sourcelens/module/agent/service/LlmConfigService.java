package com.sourcelens.module.agent.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.sourcelens.common.exception.BizException;
import com.sourcelens.common.security.TokenEncryptor;
import com.sourcelens.module.agent.dto.LlmConfigRequest;
import com.sourcelens.module.agent.dto.LlmConfigResponse;
import com.sourcelens.module.agent.entity.LlmConfig;
import com.sourcelens.module.agent.mapper.LlmConfigMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class LlmConfigService extends ServiceImpl<LlmConfigMapper, LlmConfig> {

    private final TokenEncryptor tokenEncryptor;

    public LlmConfigService(TokenEncryptor tokenEncryptor) {
        this.tokenEncryptor = tokenEncryptor;
    }

    /**
     * 创建 LLM 配置
     */
    @Transactional
    public LlmConfig create(LlmConfigRequest req, Long userId) {
        String rawKey = req.getApiKey() != null ? req.getApiKey().trim() : "";
        if (!TokenEncryptor.isValidToken(rawKey)) {
            throw BizException.badRequest("API Key 不能为空");
        }
        String encryptedKey = TokenEncryptor.isValidToken(rawKey) ? tokenEncryptor.encrypt(rawKey) : "";
        String baseUrl = LlmEndpointPolicy.normalizeAndValidate(req.getProvider(), req.getBaseUrl());

        LlmConfig config = LlmConfig.builder()
                .userId(userId)
                .provider(req.getProvider())
                .modelName(req.getModelName())
                .apiKey(encryptedKey)
                .baseUrl(baseUrl)
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
     * 用户的配置列表，面向 API 响应，永不返回明文 API Key。
     */
    public List<LlmConfigResponse> listResponsesByUser(Long userId) {
        return listByUser(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * 获取用户当前激活配置的脱敏响应。
     */
    public LlmConfigResponse getActiveConfigResponse(Long userId) {
        LlmConfig config = getOne(new LambdaQueryWrapper<LlmConfig>()
                .eq(LlmConfig::getUserId, userId)
                .eq(LlmConfig::getIsActive, true));
        return config == null ? null : toResponse(config);
    }

    /**
     * 将配置转换为 API 响应对象。这里允许内部短暂解密用于生成掩码，但不会返回明文。
     */
    public LlmConfigResponse toResponse(LlmConfig config) {
        String maskedKey = maskApiKey(config.getApiKey());
        return LlmConfigResponse.builder()
                .id(config.getId())
                .provider(config.getProvider())
                .modelName(config.getModelName())
                .apiKey(maskedKey)
                .baseUrl(config.getBaseUrl())
                .temperature(config.getTemperature())
                .maxTokens(config.getMaxTokens())
                .isActive(config.getIsActive())
                .createdAt(config.getCreatedAt())
                .updatedAt(config.getUpdatedAt())
                .build();
    }

    private String maskApiKey(String storedKey) {
        if (storedKey == null || storedKey.isBlank()) {
            return "";
        }
        String rawOrStored = storedKey;
        if (TokenEncryptor.isEncrypted(storedKey)) {
            try {
                rawOrStored = tokenEncryptor.decrypt(storedKey);
            } catch (Exception e) {
                log.warn("生成 API Key 掩码时解密失败");
                return "****";
            }
        }
        if (rawOrStored.length() <= 8) {
            return "****";
        }
        return rawOrStored.substring(0, 4) + "****" + rawOrStored.substring(rawOrStored.length() - 4);
    }

    /**
     * 获取用户当前激活的配置
     */
    public LlmConfig getActiveConfig(Long userId) {
        LlmConfig config = getOne(new LambdaQueryWrapper<LlmConfig>()
                .eq(LlmConfig::getUserId, userId)
                .eq(LlmConfig::getIsActive, true));
        if (config != null && config.getApiKey() != null && TokenEncryptor.isEncrypted(config.getApiKey())) {
            try {
                config.setApiKey(tokenEncryptor.decrypt(config.getApiKey()));
            } catch (Exception e) {
                log.warn("解密 API Key 失败, id={}", config.getId(), e);
            }
        }
        return config;
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
        // 直接 update 数据库字段，不经过 listByUser（避免解密后再写回明文覆盖加密 Key）
        update(new com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper<LlmConfig>()
                .eq(LlmConfig::getUserId, userId)
                .set(LlmConfig::getIsActive, false));
        // 激活目标配置
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

        String key = req.getApiKey() != null ? req.getApiKey().trim() : "";
        if (!key.isEmpty()) {
            if (!TokenEncryptor.isEncrypted(key)) {
                config.setApiKey(tokenEncryptor.encrypt(key));
            } else {
                config.setApiKey(key);
            }
        }

        config.setBaseUrl(LlmEndpointPolicy.normalizeAndValidate(req.getProvider(), req.getBaseUrl()));
        config.setTemperature(req.getTemperature());
        config.setMaxTokens(req.getMaxTokens());
        updateById(config);
        return config;
    }
}
