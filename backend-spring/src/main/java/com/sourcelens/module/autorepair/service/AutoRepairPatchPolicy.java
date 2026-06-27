package com.sourcelens.module.autorepair.service;

import com.sourcelens.common.exception.BizException;

import java.io.File;
import java.nio.file.Path;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;

public final class AutoRepairPatchPolicy {

    private static final int MAX_PATCH_BYTES = 1024 * 1024;
    private static final Set<String> BLOCKED_FILE_NAMES = Set.of(
            ".env", ".env.local", ".env.production", "id_rsa", "id_ed25519"
    );
    private static final Set<String> BLOCKED_EXTENSIONS = Set.of(
            ".pem", ".key", ".p12", ".pfx", ".jks", ".keystore"
    );

    private AutoRepairPatchPolicy() {
    }

    public static String validateAndNormalizeRelativeFilePath(String filePath) {
        if (filePath == null || filePath.isBlank()) {
            throw BizException.badRequest("待修改文件路径不能为空");
        }
        Path normalizedPath = Path.of(filePath).normalize();
        if (normalizedPath.isAbsolute() || normalizedPath.startsWith("..")) {
            throw BizException.badRequest("待修改文件路径必须是仓库内的相对路径");
        }
        String normalized = normalizedPath.toString().replace(File.separatorChar, '/');
        rejectSensitivePath(normalized);
        return normalized;
    }

    public static void validateSingleFilePatch(String expectedFilePath, String diffContent) {
        String expected = validateAndNormalizeRelativeFilePath(expectedFilePath);
        if (diffContent == null || diffContent.isBlank()) {
            throw BizException.badRequest("补丁内容为空，无法创建 PR");
        }
        if (diffContent.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > MAX_PATCH_BYTES) {
            throw BizException.badRequest("补丁内容过大，无法创建 PR");
        }

        Set<String> touchedFiles = extractTouchedFiles(diffContent);
        if (touchedFiles.isEmpty()) {
            throw BizException.badRequest("补丁内容缺少可识别的目标文件");
        }
        if (touchedFiles.size() != 1 || !touchedFiles.contains(expected)) {
            throw BizException.badRequest("受控 PR 补丁只能修改当前 AutoRepair 目标文件");
        }
    }

    private static Set<String> extractTouchedFiles(String diffContent) {
        Set<String> paths = new LinkedHashSet<>();
        for (String line : diffContent.split("\\R")) {
            if (line.startsWith("diff --git ")) {
                extractDiffGitPath(line, paths);
            } else if (line.startsWith("--- ") || line.startsWith("+++ ")) {
                extractMarkerPath(line.substring(4), paths);
            }
        }
        return paths;
    }

    private static void extractDiffGitPath(String line, Set<String> paths) {
        String[] parts = line.split("\\s+");
        if (parts.length >= 4) {
            addPatchPath(parts[2], paths);
            addPatchPath(parts[3], paths);
        }
    }

    private static void extractMarkerPath(String rawPath, Set<String> paths) {
        String path = rawPath.split("\\t", 2)[0].trim();
        if (!"/dev/null".equals(path)) {
            addPatchPath(path, paths);
        }
    }

    private static void addPatchPath(String rawPath, Set<String> paths) {
        String path = rawPath.trim();
        if (path.startsWith("a/") || path.startsWith("b/")) {
            path = path.substring(2);
        }
        paths.add(validateAndNormalizeRelativeFilePath(path));
    }

    private static void rejectSensitivePath(String normalized) {
        String lower = normalized.toLowerCase(Locale.ROOT);
        String fileName = Path.of(normalized).getFileName().toString().toLowerCase(Locale.ROOT);
        if (lower.startsWith(".ssh/") || lower.startsWith(".aws/") || lower.startsWith(".gcp/")
                || lower.contains("/.ssh/") || lower.contains("/.aws/") || lower.contains("/.gcp/")
                || BLOCKED_FILE_NAMES.contains(fileName)
                || BLOCKED_EXTENSIONS.stream().anyMatch(lower::endsWith)) {
            throw BizException.badRequest("自动补丁禁止修改常见密钥、证书和环境变量文件");
        }
    }
}
