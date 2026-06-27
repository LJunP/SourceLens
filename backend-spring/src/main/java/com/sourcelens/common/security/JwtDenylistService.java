package com.sourcelens.common.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class JwtDenylistService {

    private static final String KEY_PREFIX = "sourcelens:jwt:denylist:";

    private final JwtUtil jwtUtil;
    private final StringRedisTemplate redisTemplate;
    private final Map<String, Instant> localDenylist = new ConcurrentHashMap<>();
    private final boolean redisEnabled;

    public JwtDenylistService(JwtUtil jwtUtil,
                              StringRedisTemplate redisTemplate,
                              @Value("${sourcelens.jwt.denylist.redis-enabled:true}") boolean redisEnabled) {
        this.jwtUtil = jwtUtil;
        this.redisTemplate = redisTemplate;
        this.redisEnabled = redisEnabled;
    }

    public void denylist(String token) {
        if (!StringUtils.hasText(token) || !jwtUtil.isValid(token)) {
            return;
        }

        String key = keyFor(token);
        Instant expiresAt = jwtUtil.getExpiration(token).toInstant();
        Duration ttl = Duration.between(Instant.now(), expiresAt);
        if (ttl.isZero() || ttl.isNegative()) {
            return;
        }

        if (!redisEnabled) {
            localDenylist.put(key, expiresAt);
            return;
        }

        try {
            redisTemplate.opsForValue().set(key, "1", ttl);
        } catch (Exception e) {
            log.warn("JWT denylist Redis 写入失败，使用本地内存兜底: {}", e.getMessage());
            localDenylist.put(key, expiresAt);
        }
    }

    public boolean isDenylisted(String token) {
        if (!StringUtils.hasText(token)) {
            return false;
        }

        String key = keyFor(token);
        cleanupLocalDenylist();

        if (!redisEnabled) {
            return localDenylist.containsKey(key);
        }

        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey(key)) || localDenylist.containsKey(key);
        } catch (Exception e) {
            log.warn("JWT denylist Redis 查询失败，使用本地内存兜底: {}", e.getMessage());
            return localDenylist.containsKey(key);
        }
    }

    private String keyFor(String token) {
        try {
            String tokenId = jwtUtil.getTokenId(token);
            if (StringUtils.hasText(tokenId)) {
                return KEY_PREFIX + tokenId;
            }
        } catch (Exception ignored) {
            // Fall back to a token hash for legacy or malformed tokens.
        }
        return KEY_PREFIX + sha256(token);
    }

    private void cleanupLocalDenylist() {
        Instant now = Instant.now();
        localDenylist.entrySet().removeIf(entry -> !entry.getValue().isAfter(now));
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            return Integer.toHexString(value.hashCode());
        }
    }
}
