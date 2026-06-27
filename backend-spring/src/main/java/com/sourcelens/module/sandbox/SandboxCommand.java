package com.sourcelens.module.sandbox;

import lombok.Builder;
import lombok.Data;

import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class SandboxCommand {

    private List<String> command;

    private Path workingDirectory;

    private Duration timeout;

    @Builder.Default
    private Map<String, String> environment = Map.of();
}
