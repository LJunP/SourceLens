package com.sourcelens;

import com.sourcelens.module.agent.tool.SearchCodeTool;
import com.sourcelens.module.agent.tool.ShellExecTool;
import com.sourcelens.module.agent.tool.ToolContext;
import com.sourcelens.module.agent.tool.ToolResult;
import com.sourcelens.module.agent.tool.WriteFileTool;
import com.sourcelens.module.agent.tool.ReadFileTool;
import com.sourcelens.module.agent.tool.GetSymbolsTool;
import com.sourcelens.module.analysis.entity.CodeRelationEntity;
import com.sourcelens.module.analysis.entity.CodeSymbol;
import com.sourcelens.module.analysis.mapper.CodeRelationMapper;
import com.sourcelens.module.analysis.mapper.CodeSymbolMapper;
import com.sourcelens.module.sandbox.SandboxCommand;
import com.sourcelens.module.sandbox.SandboxExecutionResult;
import com.sourcelens.module.sandbox.SandboxExecutor;
import com.sourcelens.module.scantask.entity.ScanTask;
import com.sourcelens.module.scantask.mapper.ScanTaskMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.ArgumentCaptor;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AgentSandboxToolTest {

    @TempDir
    Path projectRoot;

    @Test
    void shellExecTool_shouldRejectShellComposition() {
        SandboxExecutor sandboxExecutor = mock(SandboxExecutor.class);
        ShellExecTool tool = new ShellExecTool(sandboxExecutor);

        ToolResult result = tool.execute(Map.of("command", "mvn test && rm -rf target"), context());

        assertFalse(result.isSuccess());
        assertTrue(result.getError().contains("不允许 shell 组合符号"));
    }

    @Test
    void shellExecTool_shouldExecuteWhitelistedCommandThroughSandbox() {
        SandboxExecutor sandboxExecutor = mock(SandboxExecutor.class);
        when(sandboxExecutor.execute(any())).thenReturn(SandboxExecutionResult.builder()
                .exitCode(0)
                .output("ok")
                .build());
        ShellExecTool tool = new ShellExecTool(sandboxExecutor);

        ToolResult result = tool.execute(Map.of("command", "mvn test", "timeout", 5), context());

        assertTrue(result.isSuccess());
        ArgumentCaptor<SandboxCommand> captor = ArgumentCaptor.forClass(SandboxCommand.class);
        verify(sandboxExecutor).execute(captor.capture());
        assertEquals(List.of("mvn", "test"), captor.getValue().getCommand());
        assertEquals(projectRoot.toString(), captor.getValue().getWorkingDirectory().toString());
    }

    @Test
    void shellExecTool_shouldRedactSecretsFromCommandOutput() {
        SandboxExecutor sandboxExecutor = mock(SandboxExecutor.class);
        when(sandboxExecutor.execute(any())).thenReturn(SandboxExecutionResult.builder()
                .exitCode(0)
                .output("GITHUB_TOKEN=ghp_abcdefghijklmnopqrstuvwxyz123456\nAuthorization: Bearer live-token")
                .build());
        ShellExecTool tool = new ShellExecTool(sandboxExecutor);

        ToolResult result = tool.execute(Map.of("command", "mvn test"), context());

        assertTrue(result.isSuccess());
        assertTrue(result.getContent().contains("GITHUB_TOKEN=****"));
        assertTrue(result.getContent().contains("Bearer ****"));
        assertFalse(result.getContent().contains("abcdefghijklmnopqrstuvwxyz123456"));
        assertFalse(result.getContent().contains("live-token"));
    }

    @Test
    void shellExecTool_shouldClampInvalidTimeout() {
        SandboxExecutor sandboxExecutor = mock(SandboxExecutor.class);
        when(sandboxExecutor.execute(any())).thenReturn(SandboxExecutionResult.builder()
                .exitCode(0)
                .output("ok")
                .build());
        ShellExecTool tool = new ShellExecTool(sandboxExecutor);

        ToolResult result = tool.execute(Map.of("command", "mvn test", "timeout", -20), context());

        assertTrue(result.isSuccess());
        ArgumentCaptor<SandboxCommand> captor = ArgumentCaptor.forClass(SandboxCommand.class);
        verify(sandboxExecutor).execute(captor.capture());
        assertEquals(1, captor.getValue().getTimeout().toSeconds());
    }

    @Test
    void searchCodeTool_shouldUseSandboxExecutor() {
        SandboxExecutor sandboxExecutor = mock(SandboxExecutor.class);
        when(sandboxExecutor.execute(any())).thenReturn(SandboxExecutionResult.builder()
                .exitCode(0)
                .output("./src/App.java:1:class App")
                .build());
        SearchCodeTool tool = new SearchCodeTool(sandboxExecutor);

        ToolResult result = tool.execute(Map.of("pattern", "class App", "max_results", 10), context());

        assertTrue(result.isSuccess());
        assertTrue(result.getContent().contains("class App"));
        verify(sandboxExecutor).execute(any(SandboxCommand.class));
    }

    @Test
    void searchCodeTool_shouldClampInvalidMaxResults() {
        SandboxExecutor sandboxExecutor = mock(SandboxExecutor.class);
        when(sandboxExecutor.execute(any())).thenReturn(SandboxExecutionResult.builder()
                .exitCode(0)
                .output("./a.java:1:class A\n./b.java:1:class B")
                .build());
        SearchCodeTool tool = new SearchCodeTool(sandboxExecutor);

        ToolResult result = tool.execute(Map.of("pattern", "class", "max_results", -5), context());

        assertTrue(result.isSuccess());
        assertTrue(result.getContent().contains("class A"));
        assertFalse(result.getContent().contains("class B"));
    }

    @Test
    void getSymbolsTool_shouldUseContextScanTaskIdBeforeLatestScan() {
        ScanTaskMapper scanTaskMapper = mock(ScanTaskMapper.class);
        CodeSymbolMapper symbolMapper = mock(CodeSymbolMapper.class);
        CodeRelationMapper relationMapper = mock(CodeRelationMapper.class);
        when(scanTaskMapper.selectById(41L)).thenReturn(ScanTask.builder()
                .id(41L)
                .projectId(10L)
                .status("SUCCESS")
                .build());
        when(symbolMapper.selectList(any())).thenReturn(List.of(CodeSymbol.builder()
                .scanTaskId(41L)
                .kind("CLASS")
                .name("RequestedScanService")
                .symbolId("RequestedScanService")
                .filePath("src/RequestedScanService.java")
                .build()));
        when(relationMapper.selectCount(any())).thenReturn(0L);
        GetSymbolsTool tool = new GetSymbolsTool(scanTaskMapper, symbolMapper, relationMapper);

        ToolResult result = tool.execute(Map.of("query", "Service"), scanContext(10L, 41L));

        assertTrue(result.isSuccess());
        assertTrue(result.getContent().contains("ScanTask ID: 41"));
        assertTrue(result.getContent().contains("RequestedScanService"));
        verify(scanTaskMapper, never()).selectOne(any());
    }

    @Test
    void getSymbolsTool_shouldRejectCrossProjectContextScanTask() {
        ScanTaskMapper scanTaskMapper = mock(ScanTaskMapper.class);
        CodeSymbolMapper symbolMapper = mock(CodeSymbolMapper.class);
        CodeRelationMapper relationMapper = mock(CodeRelationMapper.class);
        when(scanTaskMapper.selectById(41L)).thenReturn(ScanTask.builder()
                .id(41L)
                .projectId(99L)
                .status("SUCCESS")
                .build());
        GetSymbolsTool tool = new GetSymbolsTool(scanTaskMapper, symbolMapper, relationMapper);

        ToolResult result = tool.execute(Map.of(), scanContext(10L, 41L));

        assertFalse(result.isSuccess());
        assertEquals("扫描任务不属于当前项目", result.getError());
        verify(symbolMapper, never()).selectList(any());
        verify(relationMapper, never()).selectCount(any());
    }

    @Test
    void readFileTool_shouldClampOffsetAndLimit() throws Exception {
        Path file = projectRoot.resolve("src/App.java");
        Files.createDirectories(file.getParent());
        StringBuilder content = new StringBuilder();
        for (int i = 1; i <= 600; i++) {
            content.append("line ").append(i).append('\n');
        }
        Files.writeString(file, content.toString());
        ReadFileTool tool = new ReadFileTool();

        ToolResult result = tool.execute(Map.of("path", "src/App.java", "offset", -10, "limit", 1000), context());

        assertTrue(result.isSuccess());
        assertTrue(result.getContent().contains("   1| line 1"));
        assertTrue(result.getContent().contains(" 500| line 500"));
        assertFalse(result.getContent().contains(" 501| line 501"));
    }

    @Test
    void writeFileTool_shouldCreateGitCheckpointThroughSandbox() throws Exception {
        Files.createDirectories(projectRoot.resolve(".git"));
        SandboxExecutor sandboxExecutor = mock(SandboxExecutor.class);
        when(sandboxExecutor.execute(any())).thenReturn(SandboxExecutionResult.builder()
                .exitCode(0)
                .output("")
                .build());
        WriteFileTool tool = new WriteFileTool(sandboxExecutor);

        ToolResult result = tool.execute(Map.of("path", "src/App.java", "content", "class App {}\n"), context());

        assertTrue(result.isSuccess());
        assertTrue(Files.exists(projectRoot.resolve("src/App.java")));
        verify(sandboxExecutor, times(2)).execute(any(SandboxCommand.class));
    }

    private ToolContext context() {
        ToolContext context = new ToolContext();
        context.setProjectRootPath(projectRoot.toString());
        return context;
    }

    private ToolContext scanContext(Long projectId, Long scanTaskId) {
        ToolContext context = context();
        context.setProjectId(projectId);
        context.setScanTaskId(scanTaskId);
        return context;
    }
}
