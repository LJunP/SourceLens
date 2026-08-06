package com.sourcelens.module.sandbox;

import com.sourcelens.common.observability.SourceLensMetrics;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
@ConditionalOnProperty(name = "sourcelens.sandbox.executor", havingValue = "docker")
public class DockerSandboxExecutor implements SandboxExecutor {

    private final SandboxExecutor processExecutor;
    private final SourceLensMetrics metrics;

    @Value("${sourcelens.sandbox.docker.image:alpine/git:latest@sha256:8d6ede0b29c666ac111c732468c4d758c1c08f054f211dd98f15d421a6ffab40}")
    private String image = "alpine/git:latest@sha256:8d6ede0b29c666ac111c732468c4d758c1c08f054f211dd98f15d421a6ffab40";

    @Value("${sourcelens.sandbox.docker.memory:512m}")
    private String memoryLimit = "512m";

    @Value("${sourcelens.sandbox.docker.cpus:1.0}")
    private String cpuLimit = "1.0";

    @Value("${sourcelens.sandbox.docker.network:none}")
    private String networkMode = "none";

    @Value("${sourcelens.sandbox.docker.user:1000:1000}")
    private String user = "1000:1000";

    @Value("${sourcelens.sandbox.docker.pids-limit:256}")
    private String pidsLimit = "256";

    @Value("${sourcelens.sandbox.docker.read-only-root:true}")
    private boolean readOnlyRoot = true;

    @Value("${sourcelens.sandbox.docker.tmpfs:/tmp:rw,noexec,nosuid,size=64m}")
    private String tmpfs = "/tmp:rw,noexec,nosuid,size=64m";

    public DockerSandboxExecutor() {
        this(new LocalProcessSandboxExecutor(), SourceLensMetrics.noop());
    }

    @Autowired
    public DockerSandboxExecutor(SourceLensMetrics metrics) {
        this(new LocalProcessSandboxExecutor(metrics), metrics);
    }

    public DockerSandboxExecutor(SandboxExecutor processExecutor) {
        this(processExecutor, SourceLensMetrics.noop());
    }

    public DockerSandboxExecutor(SandboxExecutor processExecutor, SourceLensMetrics metrics) {
        this.processExecutor = processExecutor;
        this.metrics = metrics;
    }

    @Override
    public SandboxExecutionResult execute(SandboxCommand command) {
        SandboxCommandValidator.validate(command);
        Path workingDirectory = command.getWorkingDirectory().toAbsolutePath().normalize();
        List<String> dockerCommand = new ArrayList<>();
        dockerCommand.add("docker");
        dockerCommand.add("run");
        dockerCommand.add("--rm");
        dockerCommand.add("--network");
        dockerCommand.add(networkMode);
        dockerCommand.add("--cpus");
        dockerCommand.add(cpuLimit);
        dockerCommand.add("--memory");
        dockerCommand.add(memoryLimit);
        dockerCommand.add("--memory-swap");
        dockerCommand.add(memoryLimit);
        dockerCommand.add("--user");
        dockerCommand.add(user);
        dockerCommand.add("--pids-limit");
        dockerCommand.add(pidsLimit);
        dockerCommand.add("--cap-drop");
        dockerCommand.add("ALL");
        dockerCommand.add("--security-opt");
        dockerCommand.add("no-new-privileges");
        dockerCommand.add("--entrypoint=");
        if (readOnlyRoot) {
            dockerCommand.add("--read-only");
        }
        if (tmpfs != null && !tmpfs.isBlank()) {
            dockerCommand.add("--tmpfs");
            dockerCommand.add(tmpfs);
        }
        Map<String, String> containerEnvironment = SandboxCommandValidator.validateAndNormalizeEnvironment(command.getEnvironment());
        containerEnvironment.forEach((key, value) -> addContainerEnvironment(dockerCommand, key, value));
        addContainerEnvironment(dockerCommand, "HOME", "/workspace/.sourcelens-home");
        addContainerEnvironment(dockerCommand, "XDG_CACHE_HOME", "/workspace/.sourcelens-cache/xdg");
        addContainerEnvironment(dockerCommand, "MAVEN_CONFIG", "/workspace/.sourcelens-cache/maven");
        addContainerEnvironment(dockerCommand, "npm_config_cache", "/workspace/.sourcelens-cache/npm");
        addContainerEnvironment(dockerCommand, "GRADLE_USER_HOME", "/workspace/.sourcelens-cache/gradle");
        dockerCommand.add("-v");
        dockerCommand.add(workingDirectory + ":/workspace:rw");
        dockerCommand.add("-w");
        dockerCommand.add("/workspace");
        dockerCommand.add(image);
        dockerCommand.addAll(command.getCommand());

        long start = System.currentTimeMillis();
        SandboxExecutionResult result = processExecutor.execute(SandboxCommand.builder()
                .command(dockerCommand)
                .workingDirectory(workingDirectory)
                .timeout(command.getTimeout() == null ? Duration.ofSeconds(60) : command.getTimeout())
                .environment(Map.of())
                .build());
        metrics.recordSandboxCommand("docker", result.getExitCode(), result.isTimedOut(), System.currentTimeMillis() - start);
        return result;
    }

    private void addContainerEnvironment(List<String> dockerCommand, String key, String value) {
        dockerCommand.add("-e");
        dockerCommand.add(key + "=" + value);
    }
}
