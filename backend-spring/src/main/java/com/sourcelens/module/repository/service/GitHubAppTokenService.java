package com.sourcelens.module.repository.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sourcelens.common.exception.BizException;
import io.jsonwebtoken.Jwts;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;

@Service
public class GitHubAppTokenService {

    private static final String PKCS8_BEGIN = "-----BEGIN PRIVATE KEY-----";
    private static final String PKCS8_END = "-----END PRIVATE KEY-----";
    private static final String PKCS1_BEGIN = "-----BEGIN RSA PRIVATE KEY-----";
    private static final String PKCS1_END = "-----END RSA PRIVATE KEY-----";

    private final ObjectMapper objectMapper;
    private final Clock clock;
    private final HttpClient httpClient;

    @Autowired
    public GitHubAppTokenService(ObjectMapper objectMapper) {
        this(objectMapper, Clock.systemUTC(), HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build());
    }

    public GitHubAppTokenService(ObjectMapper objectMapper, Clock clock, HttpClient httpClient) {
        this.objectMapper = objectMapper;
        this.clock = clock;
        this.httpClient = httpClient;
    }

    @Value("${sourcelens.github-app.app-id:}")
    private String appId;

    @Value("${sourcelens.github-app.private-key-pem:}")
    private String privateKeyPem;

    @Value("${sourcelens.github-app.api-base-url:https://api.github.com}")
    private String apiBaseUrl;

    @Value("${sourcelens.github-app.allowed-api-hosts:api.github.com}")
    private String allowedApiHosts;

    public boolean isConfigured() {
        return StringUtils.hasText(appId) && StringUtils.hasText(privateKeyPem);
    }

    public String createInstallationAccessToken(Long installationId) {
        if (installationId == null) {
            throw BizException.badRequest("GitHub App installation id 不能为空");
        }
        return exchangeInstallationAccessToken(createAppJwt(), installationId);
    }

    public String createAppJwt() {
        if (!isConfigured()) {
            throw BizException.badRequest("GitHub App 未配置 app-id 或 private-key-pem");
        }
        try {
            Instant now = Instant.now(clock);
            PrivateKey privateKey = parsePrivateKey(privateKeyPem);
            return Jwts.builder()
                    .issuer(appId)
                    .issuedAt(Date.from(now.minusSeconds(60)))
                    .expiration(Date.from(now.plus(Duration.ofMinutes(9))))
                    .signWith(privateKey, Jwts.SIG.RS256)
                    .compact();
        } catch (BizException e) {
            throw e;
        } catch (Exception e) {
            throw BizException.internal("GitHub App JWT 签发失败: " + e.getMessage());
        }
    }

    String exchangeInstallationAccessToken(String appJwt, Long installationId) {
        try {
            String baseUrl = GitHubApiEndpointPolicy.normalizeAndValidate(apiBaseUrl, allowedApiHosts);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/app/installations/" + installationId + "/access_tokens"))
                    .timeout(Duration.ofSeconds(20))
                    .header("Authorization", "Bearer " + appJwt)
                    .header("Accept", "application/vnd.github+json")
                    .header("X-GitHub-Api-Version", "2022-11-28")
                    .POST(HttpRequest.BodyPublishers.noBody())
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw BizException.internal("GitHub App installation token 换取失败, status=" + response.statusCode());
            }
            JsonNode root = objectMapper.readTree(response.body());
            String token = root.path("token").asText(null);
            if (!StringUtils.hasText(token)) {
                throw BizException.internal("GitHub App installation token 响应缺少 token 字段");
            }
            return token;
        } catch (BizException e) {
            throw e;
        } catch (IOException e) {
            throw BizException.internal("GitHub App installation token 响应解析失败: " + e.getMessage());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw BizException.internal("GitHub App installation token 换取被中断");
        } catch (Exception e) {
            throw BizException.internal("GitHub App installation token 换取失败: " + e.getMessage());
        }
    }

    private PrivateKey parsePrivateKey(String pem) throws Exception {
        String normalized = pem.replace("\\n", "\n").trim();
        byte[] der;
        if (normalized.contains(PKCS1_BEGIN)) {
            der = wrapPkcs1InPkcs8(readPemBody(normalized, PKCS1_BEGIN, PKCS1_END));
        } else {
            der = readPemBody(normalized, PKCS8_BEGIN, PKCS8_END);
        }
        return KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(der));
    }

    private byte[] readPemBody(String pem, String begin, String end) {
        if (!pem.contains(begin) || !pem.contains(end)) {
            throw BizException.badRequest("GitHub App private key PEM 格式不正确");
        }
        String body = pem.replace(begin, "")
                .replace(end, "")
                .replaceAll("\\s", "");
        return Base64.getDecoder().decode(body);
    }

    private byte[] wrapPkcs1InPkcs8(byte[] pkcs1) {
        byte[] version = derIntegerZero();
        byte[] algorithmIdentifier = new byte[] {
                0x30, 0x0d,
                0x06, 0x09,
                0x2a, (byte) 0x86, 0x48, (byte) 0x86, (byte) 0xf7, 0x0d, 0x01, 0x01, 0x01,
                0x05, 0x00
        };
        return derSequence(version, algorithmIdentifier, derOctetString(pkcs1));
    }

    private byte[] derIntegerZero() {
        return new byte[] {0x02, 0x01, 0x00};
    }

    private byte[] derOctetString(byte[] value) {
        return concat(new byte[] {0x04}, derLength(value.length), value);
    }

    private byte[] derSequence(byte[]... parts) {
        byte[] body = concat(parts);
        return concat(new byte[] {0x30}, derLength(body.length), body);
    }

    private byte[] derLength(int length) {
        if (length < 128) {
            return new byte[] {(byte) length};
        }
        int temp = length;
        int byteCount = 0;
        while (temp > 0) {
            byteCount++;
            temp >>= 8;
        }
        byte[] result = new byte[byteCount + 1];
        result[0] = (byte) (0x80 | byteCount);
        for (int i = byteCount; i > 0; i--) {
            result[i] = (byte) (length & 0xff);
            length >>= 8;
        }
        return result;
    }

    private byte[] concat(byte[]... arrays) {
        int total = 0;
        for (byte[] array : arrays) {
            total += array.length;
        }
        byte[] result = new byte[total];
        int offset = 0;
        for (byte[] array : arrays) {
            System.arraycopy(array, 0, result, offset, array.length);
            offset += array.length;
        }
        return result;
    }

}
