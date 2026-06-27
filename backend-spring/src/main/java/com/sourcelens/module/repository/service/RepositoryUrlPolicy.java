package com.sourcelens.module.repository.service;

import com.sourcelens.common.exception.BizException;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.net.URISyntaxException;
import java.nio.file.Path;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class RepositoryUrlPolicy {

    private static final Pattern GITHUB_PATH_PATTERN =
            Pattern.compile("^/([^/]+)/([^/]+)/?$");
    private static final Pattern GITHUB_OWNER_PATTERN =
            Pattern.compile("^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$");
    private static final Pattern GITHUB_REPOSITORY_NAME_PATTERN =
            Pattern.compile("^[A-Za-z0-9_.-]{1,100}$");
    private static final Pattern BRANCH_PATTERN =
            Pattern.compile("^[A-Za-z0-9._/-]{1,128}$");

    private RepositoryUrlPolicy() {
    }

    public static ParsedRepository parseAndValidate(String rawUrl, boolean allowLocalFileRepositories) {
        String url = rawUrl == null ? "" : rawUrl.trim();
        if (!StringUtils.hasText(url)) {
            throw BizException.badRequest("仓库 URL 不能为空");
        }
        URI uri = parseUri(url);
        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
        if ("file".equals(scheme)) {
            if (!allowLocalFileRepositories) {
                throw BizException.badRequest("本地 file:// 仓库默认禁用，请在开发环境显式开启 sourcelens.repository.allow-local-file");
            }
            return parseLocalFile(uri);
        }
        if (!"https".equals(scheme)) {
            throw BizException.badRequest("GitHub 仓库 URL 必须使用 https");
        }
        if (uri.getUserInfo() != null || uri.getRawQuery() != null || uri.getRawFragment() != null) {
            throw BizException.badRequest("仓库 URL 不能包含认证信息、query 或 fragment");
        }
        String host = normalizeHost(uri.getHost());
        if (!"github.com".equals(host)) {
            throw BizException.badRequest("仅支持 github.com 仓库 URL");
        }
        Matcher matcher = GITHUB_PATH_PATTERN.matcher(uri.getPath() == null ? "" : uri.getPath());
        if (!matcher.matches()) {
            throw BizException.badRequest("不支持的 GitHub 仓库 URL 格式");
        }
        String owner = validateGitHubOwner(matcher.group(1));
        String name = validateGitHubRepositoryName(stripGitSuffix(matcher.group(2)));
        return new ParsedRepository("GITHUB", owner, name, "https://github.com/" + owner + "/" + name + ".git");
    }

    public static String validateGitHubOwner(String rawOwner) {
        String owner = normalizeComponent(rawOwner);
        if (!GITHUB_OWNER_PATTERN.matcher(owner).matches() || owner.contains("--")) {
            throw BizException.badRequest("GitHub repository owner 格式不合法");
        }
        return owner;
    }

    public static String validateGitHubRepositoryName(String rawName) {
        String name = normalizeComponent(rawName);
        if (!GITHUB_REPOSITORY_NAME_PATTERN.matcher(name).matches()
                || name.equals(".")
                || name.equals("..")
                || name.contains("..")
                || name.toLowerCase(Locale.ROOT).endsWith(".git")) {
            throw BizException.badRequest("GitHub repository name 格式不合法");
        }
        return name;
    }

    public static String validateBranch(String rawBranch) {
        String branch = StringUtils.hasText(rawBranch) ? rawBranch.trim() : "main";
        if (!BRANCH_PATTERN.matcher(branch).matches()
                || branch.startsWith("/")
                || branch.endsWith("/")
                || branch.contains("..")
                || branch.contains("@{")
                || branch.contains("//")
                || branch.contains("\\")) {
            throw BizException.badRequest("分支名称格式不合法");
        }
        return branch;
    }

    public static String safeRepositoryName(String repoUrl) {
        return parseAndValidate(repoUrl, true).name();
    }

    private static ParsedRepository parseLocalFile(URI uri) {
        if (uri.getAuthority() != null && !uri.getAuthority().isBlank()) {
            throw BizException.badRequest("本地 file:// 仓库 URL 不能包含 host");
        }
        Path path;
        try {
            path = Path.of(uri).toAbsolutePath().normalize();
        } catch (Exception e) {
            throw BizException.badRequest("本地 file:// 仓库 URL 格式无效");
        }
        String fileName = path.getFileName() == null ? "" : path.getFileName().toString();
        if (!StringUtils.hasText(fileName) || fileName.equals(".") || fileName.equals("..")) {
            throw BizException.badRequest("本地 file:// 仓库 URL 缺少有效目录名");
        }
        String normalizedUrl = path.toUri().toString();
        return new ParsedRepository("LOCAL", "local", stripGitSuffix(fileName), normalizedUrl);
    }

    private static URI parseUri(String url) {
        try {
            return new URI(url);
        } catch (URISyntaxException e) {
            throw BizException.badRequest("仓库 URL 格式无效");
        }
    }

    private static String normalizeHost(String host) {
        String value = host == null ? "" : host.toLowerCase(Locale.ROOT);
        return value.endsWith(".") ? value.substring(0, value.length() - 1) : value;
    }

    private static String stripGitSuffix(String value) {
        return value.endsWith(".git") ? value.substring(0, value.length() - 4) : value;
    }

    private static String normalizeComponent(String rawValue) {
        return rawValue == null ? "" : rawValue.trim();
    }

    public record ParsedRepository(String provider, String owner, String name, String normalizedUrl) {
    }
}
