package com.sourcelens.module.analysis.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CodeChunkServiceRootIndexTest {

    @TempDir
    private Path tempDir;

    @Test
    void workspaceRootIndex_shouldPruneSkippedDependencyAndBuildDirectories() throws Exception {
        Files.createDirectories(tempDir.resolve("packages/admin/src"));
        Files.writeString(tempDir.resolve("packages/admin/package.json"), "{\"name\":\"admin\"}");

        Files.createDirectories(tempDir.resolve("node_modules/react/src"));
        Files.writeString(tempDir.resolve("node_modules/react/package.json"), "{\"name\":\"react\"}");

        Files.createDirectories(tempDir.resolve("dist/apps/web/src"));
        Files.writeString(tempDir.resolve("dist/apps/web/package.json"), "{\"name\":\"web\"}");

        Files.createDirectories(tempDir.resolve(".git/hooks"));
        Files.writeString(tempDir.resolve(".git/package.json"), "{\"name\":\"git-shadow\"}");

        CodeChunkService.WorkspaceRootIndex index = CodeChunkService.WorkspaceRootIndex.from(tempDir);

        assertEquals("packages/admin", index.nearestRootForPath("packages/admin/src/index.ts"));
        assertEquals("", index.nearestRootForPath("node_modules/react/src/index.js"));
        assertEquals("", index.nearestRootForPath("dist/apps/web/src/index.ts"));
        assertEquals("", index.nearestRootForPath(".git/hooks/pre-commit"));
    }

    @Test
    void walkIncludedSourceFiles_shouldPruneSkippedDirectoriesBeforeFileFilter() throws Exception {
        Files.createDirectories(tempDir.resolve("src/main/java"));
        Path sourceFile = tempDir.resolve("src/main/java/App.java");
        Files.writeString(sourceFile, "class App {}");

        Files.createDirectories(tempDir.resolve("node_modules/react/src"));
        Files.writeString(tempDir.resolve("node_modules/react/src/Ignored.java"), "class Ignored {}");

        Files.createDirectories(tempDir.resolve("dist/apps/web/src"));
        Files.writeString(tempDir.resolve("dist/apps/web/src/Ignored.ts"), "export const ignored = true;");

        Files.createDirectories(tempDir.resolve(".git/hooks"));
        Files.writeString(tempDir.resolve(".git/hooks/pre-commit"), "#!/bin/sh");

        RecordingFilter filter = new RecordingFilter();

        List<Path> files = CodeChunkService.walkIncludedSourceFiles(tempDir, filter);

        assertEquals(List.of(sourceFile), files);
        List<String> inspected = filter.inspectedRelativePaths(tempDir);
        assertTrue(inspected.contains("src/main/java/App.java"));
        assertFalse(inspected.stream().anyMatch(path -> path.startsWith("node_modules/")));
        assertFalse(inspected.stream().anyMatch(path -> path.startsWith("dist/")));
        assertFalse(inspected.stream().anyMatch(path -> path.startsWith(".git/")));
    }

    @Test
    void visitIncludedSourceFiles_shouldStreamIncludedFilesWithSamePruningBoundary() throws Exception {
        Files.createDirectories(tempDir.resolve("src/main/java"));
        Files.writeString(tempDir.resolve("src/main/java/App.java"), "class App {}");
        Files.writeString(tempDir.resolve("src/main/java/Helper.java"), "class Helper {}");

        Files.createDirectories(tempDir.resolve("node_modules/react/src"));
        Files.writeString(tempDir.resolve("node_modules/react/src/Ignored.java"), "class Ignored {}");

        RecordingFilter filter = new RecordingFilter();
        List<String> visited = new ArrayList<>();

        CodeChunkService.visitIncludedSourceFiles(tempDir, filter, path ->
                visited.add(tempDir.relativize(path).toString().replace('\\', '/'))
        );

        assertEquals(List.of("src/main/java/App.java", "src/main/java/Helper.java"), visited.stream().sorted().toList());
        assertFalse(filter.inspectedRelativePaths(tempDir).stream().anyMatch(path -> path.startsWith("node_modules/")));
    }

    private static class RecordingFilter extends CodeChunkFileFilter {
        private final List<Path> inspected = new ArrayList<>();

        @Override
        public boolean shouldInclude(Path repoRoot, Path file) {
            inspected.add(file);
            return true;
        }

        private List<String> inspectedRelativePaths(Path repoRoot) {
            return inspected.stream()
                    .map(path -> repoRoot.relativize(path).toString().replace('\\', '/'))
                    .toList();
        }
    }
}
