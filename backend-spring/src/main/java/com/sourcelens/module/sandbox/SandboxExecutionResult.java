package com.sourcelens.module.sandbox;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SandboxExecutionResult {

    private int exitCode;

    private String output;

    private boolean timedOut;
}
