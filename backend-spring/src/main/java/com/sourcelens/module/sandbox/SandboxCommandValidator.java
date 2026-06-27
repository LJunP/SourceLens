package com.sourcelens.module.sandbox;

final class SandboxCommandValidator {

    private SandboxCommandValidator() {
    }

    static void validate(SandboxCommand command) {
        if (command == null || command.getCommand() == null || command.getCommand().isEmpty()) {
            throw new IllegalArgumentException("sandbox command must not be empty");
        }
        if (command.getWorkingDirectory() == null) {
            throw new IllegalArgumentException("sandbox working directory must not be null");
        }
        if (command.getTimeout() != null && (command.getTimeout().isZero() || command.getTimeout().isNegative())) {
            throw new IllegalArgumentException("sandbox timeout must be positive");
        }
    }
}
