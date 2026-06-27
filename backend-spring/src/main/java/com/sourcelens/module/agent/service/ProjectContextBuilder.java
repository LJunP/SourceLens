package com.sourcelens.module.agent.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sourcelens.module.analysis.entity.CodeRelationEntity;
import com.sourcelens.module.analysis.entity.CodeSymbol;
import com.sourcelens.module.analysis.entity.ScanArtifact;
import com.sourcelens.module.analysis.mapper.CodeRelationMapper;
import com.sourcelens.module.analysis.mapper.CodeSymbolMapper;
import com.sourcelens.module.analysis.mapper.ScanArtifactMapper;
import com.sourcelens.module.artifact.service.ArtifactStorageService;
import com.sourcelens.module.project.entity.Project;
import com.sourcelens.module.project.service.ProjectService;
import com.sourcelens.module.repository.entity.Repository;
import com.sourcelens.module.repository.mapper.RepositoryMapper;
import com.sourcelens.module.repository.service.GitService;
import com.sourcelens.module.repository.service.RepositoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 构建项目上下文，供 Agent 系统 prompt 注入。
 * 包含：项目元数据、仓库本地路径、扫描结果摘要、文件树、入口文件。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectContextBuilder {

    private final ProjectService projectService;
    private final RepositoryMapper repositoryMapper;
    private final ScanArtifactMapper artifactMapper;
    private final CodeSymbolMapper symbolMapper;
    private final CodeRelationMapper relationMapper;
    private final ArtifactStorageService artifactStorageService;
    private final GitService gitService;
    private final RepositoryService repositoryService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${sourcelens.workspace.base-path:/tmp/sourcelens/repos}")
    private String workspaceBasePath;

    private static final int MAX_TREE_DEPTH = 3;
    private static final int MAX_TREE_ENTRIES = 200;

    /**
     * 构建项目上下文字符串，注入到 system prompt 中。
     */
    public String buildContext(Long projectId, Long scanTaskId) {
        StringBuilder ctx = new StringBuilder();

        // 1. 项目基本信息
        Project project = projectService.getById(projectId);
        if (project != null) {
            ctx.append("## 项目信息\n");
            ctx.append("- 名称: ").append(project.getName()).append("\n");
            if (project.getPrimaryLanguage() != null) {
                ctx.append("- 主语言: ").append(project.getPrimaryLanguage()).append("\n");
            }
            if (project.getFramework() != null) {
                ctx.append("- 框架: ").append(project.getFramework()).append("\n");
            }
            if (project.getDescription() != null) {
                ctx.append("- 描述: ").append(project.getDescription()).append("\n");
            }
            ctx.append("\n");
        }

        // 2. 仓库本地路径
        String repoPath = resolveLocalRepoPath(projectId);
        if (repoPath != null) {
            ctx.append("## 仓库本地路径\n");
            ctx.append("`").append(repoPath).append("`\n\n");
        }

        // 3. 扫描结果摘要
        if (scanTaskId != null) {
            ctx.append(buildScanSummary(scanTaskId));
        }

        // 4. 文件树
        if (repoPath != null && Files.isDirectory(Path.of(repoPath))) {
            ctx.append("## 项目文件树\n");
            ctx.append(buildFileTree(repoPath, repoPath));
            ctx.append("\n");
        }

        return ctx.toString();
    }

    /**
     * 获取项目本地仓库路径，找不到时返回 null。
     */
    public String resolveLocalRepoPath(Long projectId) {
        Repository repo = repositoryMapper.selectOne(
                new LambdaQueryWrapper<Repository>()
                        .eq(Repository::getProjectId, projectId)
                        .eq(Repository::getStatus, "ACTIVE")
                        .last("LIMIT 1"));
        if (repo == null || repo.getUrl() == null) {
            return null;
        }
        // 如果是本地 file:// 仓库且路径存在，直接返回
        if (repo.getUrl().startsWith("file://")) {
            String originalPath = repo.getUrl().substring(7);
            if (Files.isDirectory(Path.of(originalPath))) {
                return originalPath;
            }
        }
        String name = repo.getUrl().replaceAll(".*?/([^/]+?)(?:\\.git)?$", "$1");
        String localPath = workspaceBasePath + "/" + projectId + "/" + name;
        if (!Files.isDirectory(Path.of(localPath))) {
            try {
                log.info("本地仓库不存在, 自动克隆/同步: projectId={}, url={}", projectId, repo.getUrl());
                String token = repositoryService.getDecryptedToken(repo.getId());
                if (token == null || token.isBlank()) {
                    token = null;
                }
                gitService.ensureLocal(projectId, repo.getUrl(), repo.getDefaultBranch(), token);
            } catch (Exception e) {
                log.error("自动同步本地仓库失败: projectId={}, url={}", projectId, repo.getUrl(), e);
            }
        }
        return Files.isDirectory(Path.of(localPath)) ? localPath : null;
    }

    private String buildScanSummary(Long scanTaskId) {
        StringBuilder sb = new StringBuilder();

        Map<String, Object> artifactData = artifactStorageService.readJsonMapArtifactsByOwner("SCAN_TASK", scanTaskId);
        if (!artifactData.isEmpty()) {
            sb.append("## 扫描产物摘要\n");
            artifactData.forEach((type, data) -> appendArtifactSummary(sb, type, toJsonNodeText(data)));
            sb.append("\n");
        } else {
            List<ScanArtifact> artifacts = artifactMapper.selectList(
                    new LambdaQueryWrapper<ScanArtifact>()
                            .eq(ScanArtifact::getScanTaskId, scanTaskId));
            if (!artifacts.isEmpty()) {
                sb.append("## 扫描产物摘要\n");
                for (ScanArtifact a : artifacts) {
                    appendArtifactSummary(sb, a.getArtifactType(), a.getSummaryJson());
                }
                sb.append("\n");
            }
        }

        // 代码符号统计
        List<CodeSymbol> symbols = symbolMapper.selectList(
                new LambdaQueryWrapper<CodeSymbol>()
                        .eq(CodeSymbol::getScanTaskId, scanTaskId));
        if (!symbols.isEmpty()) {
            sb.append("## 代码符号统计 (共 ").append(symbols.size()).append(" 个)\n");
            Map<String, Long> byKind = symbols.stream()
                    .collect(Collectors.groupingBy(CodeSymbol::getKind, Collectors.counting()));
            byKind.forEach((kind, count) -> sb.append("- ").append(kind).append(": ").append(count).append("\n"));
            sb.append("\n");

            // 关键入口类 (顶层 public class, 不含 parentClass)
            List<String> entryClasses = symbols.stream()
                    .filter(s -> "CLASS".equals(s.getKind()) && (s.getParentClass() == null || s.getParentClass().isBlank()))
                    .map(CodeSymbol::getName)
                    .limit(30)
                    .collect(Collectors.toList());
            if (!entryClasses.isEmpty()) {
                sb.append("### 关键类 (").append(entryClasses.size()).append(")\n");
                entryClasses.forEach(c -> sb.append("- `").append(c).append("`\n"));
                sb.append("\n");
            }
        }

        // 关系统计
        List<CodeRelationEntity> relations = relationMapper.selectList(
                new LambdaQueryWrapper<CodeRelationEntity>()
                        .eq(CodeRelationEntity::getScanTaskId, scanTaskId));
        if (!relations.isEmpty()) {
            sb.append("## 代码关系统计 (共 ").append(relations.size()).append(" 条)\n");
            Map<String, Long> byType = relations.stream()
                    .collect(Collectors.groupingBy(CodeRelationEntity::getRelationType, Collectors.counting()));
            byType.forEach((type, count) -> sb.append("- ").append(type).append(": ").append(count).append("\n"));
            sb.append("\n");
        }

        return sb.toString();
    }

    private void appendArtifactSummary(StringBuilder sb, String artifactType, String jsonText) {
        sb.append("- ").append(artifactType);
        if (jsonText != null) {
            try {
                JsonNode json = objectMapper.readTree(jsonText);
                String summary = json.toString();
                if (summary.length() > 500) {
                    summary = summary.substring(0, 500) + "...";
                }
                sb.append(": ").append(summary);
            } catch (Exception e) {
                sb.append(": ").append(jsonText, 0, Math.min(500, jsonText.length()));
            }
        }
        sb.append("\n");
    }

    private String toJsonNodeText(Object data) {
        try {
            return objectMapper.writeValueAsString(data);
        } catch (Exception e) {
            return String.valueOf(data);
        }
    }

    private String buildFileTree(String rootPath, String basePath) {
        StringBuilder sb = new StringBuilder();
        int[] counter = {0};
        buildTreeRecursive(new File(rootPath), rootPath, sb, 0, MAX_TREE_DEPTH, counter);
        if (counter[0] >= MAX_TREE_ENTRIES) {
            sb.append("  ... (已截断, 共超过 ").append(MAX_TREE_ENTRIES).append(" 项)\n");
        }
        return sb.toString();
    }

    private void buildTreeRecursive(File dir, String rootPath, StringBuilder sb,
                                     int depth, int maxDepth, int[] counter) {
        if (depth > maxDepth || counter[0] >= MAX_TREE_ENTRIES) return;

        File[] children = dir.listFiles();
        if (children == null) return;

        List<File> sorted = Arrays.stream(children)
                .filter(f -> !f.getName().startsWith(".") && !"node_modules".equals(f.getName())
                        && !"target".equals(f.getName()) && !"build".equals(f.getName())
                        && !"dist".equals(f.getName()) && !"vendor".equals(f.getName()))
                .sorted((a, b) -> {
                    if (a.isDirectory() != b.isDirectory()) return a.isDirectory() ? -1 : 1;
                    return a.getName().compareTo(b.getName());
                })
                .toList();

        for (File child : sorted) {
            if (counter[0] >= MAX_TREE_ENTRIES) break;
            String indent = "  ".repeat(depth);
            String relPath = rootPath.isEmpty() ? child.getName()
                    : child.getAbsolutePath().substring(rootPath.length() + 1);
            if (child.isDirectory()) {
                sb.append(indent).append(relPath).append("/\n");
                counter[0]++;
                buildTreeRecursive(child, rootPath, sb, depth + 1, maxDepth, counter);
            } else {
                sb.append(indent).append(relPath).append("\n");
                counter[0]++;
            }
        }
    }
}
