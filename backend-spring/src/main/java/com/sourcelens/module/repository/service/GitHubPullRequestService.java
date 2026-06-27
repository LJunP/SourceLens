package com.sourcelens.module.repository.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sourcelens.common.exception.BizException;
import com.sourcelens.module.repository.entity.Repository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

@Service
public class GitHubPullRequestService {

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Value("${sourcelens.github-app.api-base-url:https://api.github.com}")
    private String apiBaseUrl;

    @Value("${sourcelens.github-app.allowed-api-hosts:api.github.com}")
    private String allowedApiHosts;

    @Autowired
    public GitHubPullRequestService(ObjectMapper objectMapper) {
        this(objectMapper, HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build());
    }

    public GitHubPullRequestService(ObjectMapper objectMapper, HttpClient httpClient) {
        this.objectMapper = objectMapper;
        this.httpClient = httpClient;
    }

    public String createPullRequest(Repository repo,
                                    String token,
                                    String branchName,
                                    String baseBranch,
                                    String title,
                                    String body) {
        if (!StringUtils.hasText(token)) {
            throw BizException.badRequest("GitHub App installation token 不能为空");
        }
        String owner = RepositoryUrlPolicy.validateGitHubOwner(repo == null ? null : repo.getOwner());
        String name = RepositoryUrlPolicy.validateGitHubRepositoryName(repo == null ? null : repo.getName());
        String head = RepositoryUrlPolicy.validateBranch(branchName);
        String base = RepositoryUrlPolicy.validateBranch(baseBranch);
        String safeTitle = validateText("Pull Request title", title, 256);
        String safeBody = body == null ? "" : body;
        String payload;
        try {
            payload = objectMapper.writeValueAsString(Map.of(
                    "title", safeTitle,
                    "head", head,
                    "base", base,
                    "body", safeBody,
                    "maintainer_can_modify", true
            ));
        } catch (IOException e) {
            throw BizException.internal("GitHub Pull Request 请求构造失败: " + e.getMessage());
        }

        try {
            String baseUrl = GitHubApiEndpointPolicy.normalizeAndValidate(apiBaseUrl, allowedApiHosts);
            URI pullsUri = URI.create(baseUrl + "/repos/" + owner + "/" + name + "/pulls");
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(pullsUri)
                    .timeout(Duration.ofSeconds(20))
                    .header("Authorization", "Bearer " + token)
                    .header("Accept", "application/vnd.github+json")
                    .header("X-GitHub-Api-Version", "2022-11-28")
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();
            HttpResponse<String> response;
            try {
                response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            } catch (IOException e) {
                throw BizException.internal("GitHub Pull Request 网络请求失败" + safeExceptionSuffix(e, token));
            }
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw mapGitHubFailure(response.statusCode());
            }
            JsonNode root;
            try {
                root = objectMapper.readTree(response.body());
            } catch (IOException e) {
                throw BizException.internal("GitHub Pull Request 响应解析失败: " + e.getMessage());
            }
            String htmlUrl = root.path("html_url").asText(null);
            if (!StringUtils.hasText(htmlUrl)) {
                throw BizException.internal("GitHub Pull Request 响应缺少 html_url 字段");
            }
            return htmlUrl;
        } catch (BizException e) {
            throw e;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw BizException.internal("GitHub Pull Request 创建被中断");
        } catch (Exception e) {
            throw BizException.internal("GitHub Pull Request 创建失败: " + e.getMessage());
        }
    }

    private BizException mapGitHubFailure(int statusCode) {
        if (statusCode == 401 || statusCode == 403) {
            return BizException.forbidden("GitHub Pull Request 创建被拒绝, status=" + statusCode);
        }
        if (statusCode == 404) {
            return BizException.notFound("GitHub repository");
        }
        if (statusCode == 409 || statusCode == 422) {
            return BizException.conflict("GitHub Pull Request 创建冲突或校验失败, status=" + statusCode);
        }
        return BizException.internal("GitHub Pull Request 创建失败, status=" + statusCode);
    }

    private String safeExceptionSuffix(Exception e, String secret) {
        String message = e.getMessage();
        if (!StringUtils.hasText(message)) {
            return "";
        }
        String sanitized = message;
        if (StringUtils.hasText(secret)) {
            sanitized = sanitized.replace(secret, "[REDACTED]");
        }
        return ": " + sanitized;
    }

    private String validateText(String label, String value, int maxLength) {
        String normalized = value == null ? "" : value.trim();
        if (!StringUtils.hasText(normalized)) {
            throw BizException.badRequest(label + " 不能为空");
        }
        if (normalized.length() > maxLength) {
            throw BizException.badRequest(label + " 长度不能超过 " + maxLength);
        }
        return normalized;
    }

}
