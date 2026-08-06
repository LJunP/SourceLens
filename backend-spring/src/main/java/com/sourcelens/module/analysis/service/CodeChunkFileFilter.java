package com.sourcelens.module.analysis.service;

import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Set;

@Component
public class CodeChunkFileFilter {

    public static final long MAX_SOURCE_FILE_BYTES = 512L * 1024L;

    private static final Set<String> SKIP_DIRS = Set.of(
            ".git", "node_modules", "target", "build", "dist", ".idea", ".vscode",
            ".mvn", "__pycache__", ".gradle", "vendor", "coverage", ".next", ".nuxt",
            "out", ".turbo", ".cache"
    );

    private static final Set<String> SKIP_FILE_NAMES = Set.of(
            "package-lock.json", "pnpm-lock.yaml", "yarn.lock", "cargo.lock",
            "composer.lock", "poetry.lock", "go.sum", "npm-shrinkwrap.json"
    );

    private static final Set<String> SUPPORTED_EXTENSIONS = Set.of(
            "java", "py", "go", "rs", "ts", "tsx", "js", "jsx", "vue",
            "cpp", "c", "h", "hpp", "cs", "html", "css", "scss", "sql",
            "xml", "properties", "yml", "yaml", "md", "sh", "kt", "kts"
    );

    public boolean shouldInclude(Path repoRoot, Path file) {
        if (!Files.isRegularFile(file)) {
            return false;
        }
        Path relative = repoRoot.relativize(file);
        for (Path element : relative) {
            if (isSkippedDirectoryName(element.toString())) {
                return false;
            }
        }

        String fileName = file.getFileName().toString().toLowerCase(Locale.ROOT);
        if (SKIP_FILE_NAMES.contains(fileName)
                || fileName.endsWith(".min.js")
                || fileName.endsWith(".map")) {
            return false;
        }

        String extension = extensionOf(fileName);
        if (!SUPPORTED_EXTENSIONS.contains(extension)) {
            return false;
        }

        try {
            return Files.size(file) <= MAX_SOURCE_FILE_BYTES;
        } catch (IOException e) {
            return false;
        }
    }

    static boolean isSkippedDirectoryName(String name) {
        return name != null && SKIP_DIRS.contains(name);
    }

    private String extensionOf(String fileName) {
        int lastIndex = fileName.lastIndexOf('.');
        if (lastIndex == -1 || lastIndex == fileName.length() - 1) {
            return "";
        }
        return fileName.substring(lastIndex + 1);
    }
}
