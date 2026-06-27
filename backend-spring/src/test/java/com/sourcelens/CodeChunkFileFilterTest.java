package com.sourcelens;

import com.sourcelens.module.analysis.service.CodeChunkFileFilter;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CodeChunkFileFilterTest {

    private final CodeChunkFileFilter filter = new CodeChunkFileFilter();

    @TempDir
    Path repoRoot;

    @Test
    void shouldIncludeSupportedSourceFile() throws Exception {
        Path file = write("src/main/java/app/DemoService.java", "class DemoService {}\n");

        assertTrue(filter.shouldInclude(repoRoot, file));
    }

    @Test
    void shouldSkipBuildArtifactsAndDependencies() throws Exception {
        Path nodeModule = write("node_modules/pkg/index.ts", "export const x = 1;\n");
        Path distFile = write("dist/app.js", "console.log('built');\n");
        Path targetFile = write("target/classes/Demo.java", "class Demo {}\n");

        assertFalse(filter.shouldInclude(repoRoot, nodeModule));
        assertFalse(filter.shouldInclude(repoRoot, distFile));
        assertFalse(filter.shouldInclude(repoRoot, targetFile));
    }

    @Test
    void shouldSkipLockFilesAndGeneratedMaps() throws Exception {
        Path lock = write("package-lock.json", "{}\n");
        Path minified = write("web/app.min.js", "var a=1;\n");
        Path sourceMap = write("web/app.js.map", "{}\n");

        assertFalse(filter.shouldInclude(repoRoot, lock));
        assertFalse(filter.shouldInclude(repoRoot, minified));
        assertFalse(filter.shouldInclude(repoRoot, sourceMap));
    }

    @Test
    void shouldSkipLargeSourceFile() throws Exception {
        Path file = repoRoot.resolve("src/Large.java");
        Files.createDirectories(file.getParent());
        Files.writeString(file, "a".repeat((int) CodeChunkFileFilter.MAX_SOURCE_FILE_BYTES + 1));

        assertFalse(filter.shouldInclude(repoRoot, file));
    }

    private Path write(String relativePath, String content) throws Exception {
        Path file = repoRoot.resolve(relativePath);
        Files.createDirectories(file.getParent());
        Files.writeString(file, content);
        return file;
    }
}
