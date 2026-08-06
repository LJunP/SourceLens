package com.sourcelens.module.sandbox;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

final class SandboxCommandValidator {

    private static final String FALLBACK_PATH = "/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin";
    private static final int MAX_ARGUMENTS = 128;
    private static final int MAX_ARGUMENT_LENGTH = 4096;
    private static final int MAX_ENVIRONMENT_VALUE_LENGTH = 8192;
    private static final Pattern SAFE_ENVIRONMENT_KEY = Pattern.compile("[A-Za-z_][A-Za-z0-9_]*");
    private static final Set<String> SAFE_PARENT_ENVIRONMENT_KEYS = Set.of(
            "PATH", "JAVA_HOME", "MAVEN_HOME", "GRADLE_HOME", "LANG", "LC_ALL", "LC_CTYPE", "TZ"
    );
    private static final Set<String> BLOCKED_EXECUTABLES = Set.of(
            "sh", "bash", "zsh", "fish", "dash", "ksh", "cmd", "cmd.exe", "powershell", "powershell.exe", "pwsh", "pwsh.exe"
    );
    private static final Set<String> BLOCKED_SECRET_KEY_PARTS = Set.of(
            "TOKEN", "SECRET", "PASSWORD", "PASSWD", "PRIVATE_KEY", "API_KEY", "ACCESS_KEY", "AUTHORIZATION", "COOKIE", "JWT"
    );

    private SandboxCommandValidator() {
    }

    static void validate(SandboxCommand command) {
        if (command == null || command.getCommand() == null || command.getCommand().isEmpty()) {
            throw new IllegalArgumentException("sandbox command must not be empty");
        }
        if (command.getWorkingDirectory() == null) {
            throw new IllegalArgumentException("sandbox working directory must not be null");
        }
        validateWorkingDirectory(command.getWorkingDirectory());
        validateCommandArguments(command.getCommand());
        validateEnvironment(command.getEnvironment());
        if (command.getTimeout() != null && (command.getTimeout().isZero() || command.getTimeout().isNegative())) {
            throw new IllegalArgumentException("sandbox timeout must be positive");
        }
    }

    static Map<String, String> safeBaseEnvironment(Map<String, String> parentEnvironment) {
        Map<String, String> safeEnvironment = new LinkedHashMap<>();
        if (parentEnvironment == null) {
            return safeEnvironment;
        }
        for (String key : SAFE_PARENT_ENVIRONMENT_KEYS) {
            String value = parentEnvironment.get(key);
            if (value != null && !value.isBlank()) {
                safeEnvironment.put(key, value);
            }
        }
        safeEnvironment.putIfAbsent("PATH", FALLBACK_PATH);
        return safeEnvironment;
    }

    static Map<String, String> validateAndNormalizeEnvironment(Map<String, String> environment) {
        validateEnvironment(environment);
        if (environment == null || environment.isEmpty()) {
            return Map.of();
        }
        return new LinkedHashMap<>(environment);
    }

    private static void validateWorkingDirectory(Path workingDirectory) {
        Path normalized = workingDirectory.toAbsolutePath().normalize();
        if (normalized.getParent() == null) {
            throw new IllegalArgumentException("sandbox working directory must not be filesystem root");
        }
        if (!Files.isDirectory(normalized)) {
            throw new IllegalArgumentException("sandbox working directory must exist and be a directory");
        }
    }

    private static void validateCommandArguments(java.util.List<String> command) {
        if (command.size() > MAX_ARGUMENTS) {
            throw new IllegalArgumentException("sandbox command has too many arguments");
        }
        for (String argument : command) {
            if (argument == null || argument.isBlank()) {
                throw new IllegalArgumentException("sandbox command arguments must not be blank");
            }
            if (argument.length() > MAX_ARGUMENT_LENGTH) {
                throw new IllegalArgumentException("sandbox command argument is too long");
            }
            if (containsControlCharacter(argument)) {
                throw new IllegalArgumentException("sandbox command arguments must not contain control characters");
            }
        }
        String executable = executableName(command.get(0));
        if (BLOCKED_EXECUTABLES.contains(executable)) {
            throw new IllegalArgumentException("sandbox command must not invoke a shell interpreter");
        }
    }

    private static void validateEnvironment(Map<String, String> environment) {
        if (environment == null || environment.isEmpty()) {
            return;
        }
        for (Map.Entry<String, String> entry : environment.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();
            if (key == null || !SAFE_ENVIRONMENT_KEY.matcher(key).matches()) {
                throw new IllegalArgumentException("sandbox environment key is invalid");
            }
            if (isSecretKey(key)) {
                throw new IllegalArgumentException("sandbox environment must not pass secret-bearing keys");
            }
            if (value == null) {
                throw new IllegalArgumentException("sandbox environment values must not be null");
            }
            if (value.length() > MAX_ENVIRONMENT_VALUE_LENGTH) {
                throw new IllegalArgumentException("sandbox environment value is too long");
            }
            if (containsControlCharacter(value)) {
                throw new IllegalArgumentException("sandbox environment values must not contain control characters");
            }
        }
    }

    private static String executableName(String executable) {
        String normalized = executable.replace('\\', '/');
        int slash = normalized.lastIndexOf('/');
        String name = slash >= 0 ? normalized.substring(slash + 1) : normalized;
        return name.toLowerCase(Locale.ROOT);
    }

    private static boolean isSecretKey(String key) {
        String normalized = key.toUpperCase(Locale.ROOT);
        return BLOCKED_SECRET_KEY_PARTS.stream().anyMatch(normalized::contains);
    }

    private static boolean containsControlCharacter(String value) {
        for (int i = 0; i < value.length(); i++) {
            char ch = value.charAt(i);
            if (Character.isISOControl(ch)) {
                return true;
            }
        }
        return false;
    }
}
