package com.sourcelens.module.agent.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Random;

/**
 * 本地开发调试专用的 Mock LLM 控制器。
 * 支持 OpenAI / DeepSeek 兼容的流式 (SSE) 及非流式 (JSON) 返回。
 * 并针对 PR 审查、需求拆解、CI 诊断提供定制化的 Mock 分析场景。
 */
@Slf4j
@RestController
@Profile({"dev", "test"})
@RequestMapping("/api/mock-llm")
public class MockLlmController {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostMapping(value = "/chat/completions")
    public Object chatCompletions(@RequestBody Map<String, Object> request) {
        boolean isStream = Boolean.TRUE.equals(request.get("stream"));
        if (isStream) {
            log.info("Mock LLM 接收到流式 (SSE) 请求");
            return (StreamingResponseBody) outputStream -> {
                try {
                    handleStream(request, outputStream);
                } catch (Exception e) {
                    log.error("Mock LLM Stream Error", e);
                    try {
                        writeSseLine(outputStream, "{\"error\": \"" + e.getMessage() + "\"}");
                    } catch (Exception ignored) {}
                } finally {
                    try {
                        writeSseLine(outputStream, "[DONE]");
                    } catch (Exception ignored) {}
                    try {
                        outputStream.flush();
                    } catch (Exception ignored) {}
                }
            };
        } else {
            log.info("Mock LLM 接收到非流式 (JSON) 请求");
            return handleNonStream(request);
        }
    }

    @PostMapping(value = {"/v1/embeddings", "/embeddings"})
    public Object mockEmbeddings(@RequestBody Map<String, Object> request) {
        log.info("Mock LLM 接收到向量化 (embeddings) 请求");
        
        Object input = request.get("input");
        List<Map<String, Object>> dataList = new ArrayList<>();
        
        if (input instanceof String) {
            dataList.add(makeMockEmbedding((String) input, 0));
        } else if (input instanceof List) {
            List<?> inputs = (List<?>) input;
            for (int i = 0; i < inputs.size(); i++) {
                dataList.add(makeMockEmbedding(inputs.get(i).toString(), i));
            }
        }
        
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("object", "list");
        response.put("data", dataList);
        response.put("model", request.getOrDefault("model", "text-embedding-3-small"));
        
        Map<String, Object> usage = new LinkedHashMap<>();
        usage.put("prompt_tokens", 10);
        usage.put("total_tokens", 10);
        response.put("usage", usage);
        
        return response;
    }

    private Map<String, Object> makeMockEmbedding(String text, int index) {
        List<Float> embedding = new ArrayList<>(1536);
        long seed = text != null ? text.hashCode() : 0;
        Random random = new Random(seed);
        for (int i = 0; i < 1536; i++) {
            embedding.add(random.nextFloat() * 2 - 1);
        }
        
        Map<String, Object> entry = new LinkedHashMap<>();
        entry.put("object", "embedding");
        entry.put("index", index);
        entry.put("embedding", embedding);
        return entry;
    }

    @SuppressWarnings("unchecked")
    private void handleStream(Map<String, Object> request, OutputStream out) throws java.io.IOException {
        List<Map<String, Object>> messages = (List<Map<String, Object>>) request.get("messages");
        if (messages == null || messages.isEmpty()) {
            writeContentChunk(out, "收到空的消息历史记录。");
            return;
        }

        Map<String, Object> lastMsg = messages.get(messages.size() - 1);
        String role = (String) lastMsg.get("role");
        String content = (String) lastMsg.get("content");

        log.info("Mock LLM 接收到请求, 轮数={}, 最后一轮角色={}, 内容={}", messages.size(), role, content);

        try {
            if ("user".equals(role)) {
                String userQuery = content != null ? content.toLowerCase() : "";
                
                if (userQuery.contains("read") || userQuery.contains("readme") || userQuery.contains("view")) {
                    writeContentChunk(out, "我需要查看一下项目的 README 文件内容...\n");
                    Thread.sleep(500);
                    writeToolCallChunk(out, "read_file", "{\"path\":\"README.md\"}");
                } else if (userQuery.contains("symbol") || userQuery.contains("class") || userQuery.contains("search")) {
                    writeContentChunk(out, "我正在对项目中的核心类进行搜索匹配...\n");
                    Thread.sleep(500);
                    writeToolCallChunk(out, "search_code", "{\"query\":\"class \",\"extension\":\"java\"}");
                } else if (userQuery.contains("exec") || userQuery.contains("shell") || userQuery.contains("cmd")) {
                    writeContentChunk(out, "执行本地健康诊断命令...\n");
                    Thread.sleep(500);
                    writeToolCallChunk(out, "shell_exec", "{\"command\":\"echo 'System check passed'\"}");
                } else {
                    writeContentChunk(out, "我正在扫描项目根目录下的文件结构...\n");
                    Thread.sleep(500);
                    writeToolCallChunk(out, "list_dir", "{\"path\":\".\"}");
                }
            } else if ("tool".equals(role)) {
                String toolName = (String) lastMsg.get("name");
                
                writeContentChunk(out, "我已经成功执行了工具 `" + toolName + "` 并获取到了执行结果。\n\n");
                Thread.sleep(500);
                
                if ("list_dir".equals(toolName)) {
                    writeContentChunk(out, "### 项目目录结构汇总\n" +
                            "通过扫描目录，我发现项目包含了以下模块和配置文件：\n" +
                            "- `backend-spring/`: 基于 Spring Boot 的控制平面后端，正在运行。\n" +
                            "- `analyzer-rust/`: 高性能 Rust AST 分析核心源码。\n" +
                            "- `web-console/`: React + Vite 前端管理后台。\n" +
                            "- `deploy/`: Docker Compose 基础设施配置。\n" +
                            "- `bin/`: 内含编译好的 Rust 扫描器二进制文件。\n" +
                            "\n项目整体链路已经畅通，可以直接在前端进行各项功能体验！");
                } else if ("read_file".equals(toolName)) {
                    writeContentChunk(out, "### 文件读取结论\n" +
                            "我已成功阅读了 `README.md` 文件。项目是一个集成 Agentic 代码治理平台，目前处于开发调试的重要验证阶段。");
                } else if ("search_code".equals(toolName)) {
                    writeContentChunk(out, "### 代码搜索发现\n" +
                            "在代码库中发现了多个 Spring Boot 核心 Controller 与 Service 组件，项目包结构清晰，分层十分符合企业级开发规范。");
                } else if ("shell_exec".equals(toolName)) {
                    writeContentChunk(out, "### 命令行执行反馈\n" +
                            "诊断命令运行成功，系统环境状态良好，无异常警报。");
                } else {
                    writeContentChunk(out, "工具返回了数据。一切功能准备就绪，可以进行后续开发治理流程！");
                }
            } else {
                writeContentChunk(out, "收到非预期消息流程。角色: " + role);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new java.io.IOException("Interrupted", e);
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> handleNonStream(Map<String, Object> request) {
        List<Map<String, Object>> messages = (List<Map<String, Object>>) request.get("messages");
        String query = "";
        if (messages != null) {
            StringBuilder sb = new StringBuilder();
            for (Map<String, Object> msg : messages) {
                String c = (String) msg.get("content");
                if (c != null) {
                    sb.append(" ").append(c);
                }
            }
            query = sb.toString().toLowerCase();
        }

        String responseContent;

        if (query.contains("diff summary") || query.contains("diffsummary") || query.contains("pr title") || query.contains("prtitle") || query.contains("pr review") || query.contains("changed files") || query.contains("changedfiles") || query.contains("pr 审查")) {
            log.info("识别为 PR 审查请求，返回 Mock PR 分析 JSON");
            responseContent = "{\n" +
                    "  \"riskLevel\": \"HIGH\",\n" +
                    "  \"changeSummary\": \"重构了 LlmConfigService，增加了 TokenEncryptor 对 API Key 的加密解密，并升级了 MockLlmController\",\n" +
                    "  \"impactScope\": [\n" +
                    "    \"com.sourcelens.module.agent.service\",\n" +
                    "    \"com.sourcelens.module.agent.controller\"\n" +
                    "  ],\n" +
                    "  \"risks\": [\n" +
                    "    {\n" +
                    "      \"category\": \"SECURITY\",\n" +
                    "      \"severity\": \"HIGH\",\n" +
                    "      \"message\": \"涉及敏感的加密和 API Key 管理，需要确认加密强度和 Key 的传输安全性\"\n" +
                    "    },\n" +
                    "    {\n" +
                    "      \"category\": \"SCOPE\",\n" +
                    "      \"severity\": \"MEDIUM\",\n" +
                    "      \"message\": \"修改了核心 LLM 配置逻辑和 Mock 控制器，可能会影响其他 Agent 模块\"\n" +
                    "    }\n" +
                    "  ],\n" +
                    "  \"testSuggestions\": [\n" +
                    "    \"验证 LlmConfigService 中的加密/解密功能，确保数据库中明文不落库\",\n" +
                    "    \"使用 Postman/curl 发送非流式和流式请求至 MockLlmController，验证返回格式\",\n" +
                    "    \"执行单元测试以确保修改没有破坏原有的 Agent 功能\"\n" +
                    "  ],\n" +
                    "  \"mergeRecommendation\": \"CHANGES_REQUESTED\",\n" +
                    "  \"comments\": [\n" +
                    "    {\n" +
                    "      \"filePath\": \"backend-spring/src/main/java/com/sourcelens/module/agent/service/LlmConfigService.java\",\n" +
                    "      \"lineNumber\": 24,\n" +
                    "      \"severity\": \"WARNING\",\n" +
                    "      \"category\": \"SECURITY\",\n" +
                    "      \"message\": \"在 create 方法中，建议增加对 API Key 长度的合理校验，防范非法输入。\",\n" +
                    "      \"suggestion\": \"if (rawKey.length() < 10) { throw BizException.badRequest(\\\"API Key 格式不正确\\\"); }\"\n" +
                    "    },\n" +
                    "    {\n" +
                    "      \"filePath\": \"backend-spring/src/main/java/com/sourcelens/module/agent/controller/MockLlmController.java\",\n" +
                    "      \"lineNumber\": 45,\n" +
                    "      \"severity\": \"INFO\",\n" +
                    "      \"category\": \"CORRECTNESS\",\n" +
                    "      \"message\": \"新增的 handleNonStream 逻辑清晰，覆盖了 PR 审查、需求拆解和 CI 诊断的 Mock 场景。\",\n" +
                    "      \"suggestion\": \"建议以后将 Mock 规则放入单独的 JSON 配置文件，方便按需灵活调整 Mock 行为。\"\n" +
                    "    }\n" +
                    "  ]\n" +
                    "}";
        } else if (query.contains("decompose") || query.contains("decomposition") || query.contains("business context") || query.contains("businesscontext") || query.contains("需求拆解")) {
            log.info("识别为需求拆解请求，返回 Mock 需求拆解 JSON");
            responseContent = "{\n" +
                    "  \"understanding\": \"本次需求是实现基于大模型的智能代码治理工作流，主要包括对接 LLM 客户端、实现 API 密钥的加密存储以防泄密，并优化 MockLLM 用于本地无网或无 API Key 时的流式与非流式集成测试。\",\n" +
                    "  \"impactModules\": \"涉及 agent 模块（包含 LlmConfigService、LlmClient）、scantask 模块以及前端设置与对话页面。\",\n" +
                    "  \"impactApis\": \"影响 POST /api/llm-configs、PUT /api/llm-configs/{id} 以及 Agent 对话等相关接口。\",\n" +
                    "  \"impactDb\": \"更新 llm_configs 表，其中 api_key 字段需变更为密文存储。\",\n" +
                    "  \"risks\": \"1. 密钥加密后如果盐值或密码发生变更，将导致老密钥无法解密。\\n2. Mock 数据的 schema 如果与实际大模型返回不一致，可能引发解析异常。\",\n" +
                    "  \"dependencies\": \"需确保 TokenEncryptor 在 Spring 容器中正确加载且加解密盐值配置正确。\",\n" +
                    "  \"acceptance\": [\n" +
                    "    \"数据库中存储的 API Key 必须是 AES 密文\",\n" +
                    "    \"编辑和查看配置时，前端获取的 API Key 应为解密后的明文\",\n" +
                    "    \"运行 test_flow.sh 流式对话测试，以及 PR 审查/需求拆解/CI 诊断测试，全链路返回正确\"\n" +
                    "  ],\n" +
                    "  \"suggestedBranch\": \"feature/llm-integration-and-key-encryption\",\n" +
                    "  \"suggestedCommit\": \"1. feat: LlmConfigService 接入 TokenEncryptor 对 API Key 密文存储\\n2. feat: 增强 MockLlmController 支持非流式调用及场景化 Mock 返回\\n3. feat: 核心 Agent 业务服务重构接入大模型调用与 fallback\",\n" +
                    "  \"tasks\": [\n" +
                    "    {\n" +
                    "      \"category\": \"DEVELOP\",\n" +
                    "      \"title\": \"API Key 加密落库改造\",\n" +
                    "      \"description\": \"修改 LlmConfigService，在新增/修改配置时进行 AES 加密，在查询时进行 AES 解密。\",\n" +
                    "      \"impactFiles\": [\"LlmConfigService.java\"],\n" +
                    "      \"riskLevel\": \"MEDIUM\",\n" +
                    "      \"testSuggestions\": \"在数据库中 select * from llm_configs，观察 api_key 列是否已加密。\",\n" +
                    "      \"estimatedHours\": 3.0\n" +
                    "    },\n" +
                    "    {\n" +
                    "      \"category\": \"DEVELOP\",\n" +
                    "      \"title\": \"重构 PR 审查、需求拆解和 CI 诊断服务\",\n" +
                    "      \"description\": \"将这三个核心模块接入 LlmClient 并在无激活配置时优雅降级为静态算法。\",\n" +
                    "      \"impactFiles\": [\"PrReviewService.java\", \"IssueDecompositionService.java\", \"CiDiagnosticService.java\"],\n" +
                    "      \"riskLevel\": \"HIGH\",\n" +
                    "      \"testSuggestions\": \"配置并激活 MockLlm 配置，触发异步分析任务，验证是否能正常入库并呈现。\",\n" +
                    "      \"estimatedHours\": 8.0\n" +
                    "    },\n" +
                    "    {\n" +
                    "      \"category\": \"TEST\",\n" +
                    "      \"title\": \"编写端到端集成测试\",\n" +
                    "      \"description\": \"运行本地测试脚本，验证 MockLlmController 是否正确模拟了各个分析场景的返回结果。\",\n" +
                    "      \"impactFiles\": [\"test_flow.sh\"],\n" +
                    "      \"riskLevel\": \"LOW\",\n" +
                    "      \"testSuggestions\": \"运行 test_flow.sh，确认控制台输出和流程各步骤状态均为 SUCCESS。\",\n" +
                    "      \"estimatedHours\": 2.0\n" +
                    "    }\n" +
                    "  ]\n" +
                    "}";
        } else if (query.contains("ci failure") || query.contains("raw log snippet") || query.contains("rawlogsnippet") || query.contains("log snippet") || query.contains("diagnostic") || query.contains("ci 诊断")) {
            log.info("识别为 CI 诊断请求，返回 Mock CI 诊断 JSON");
            responseContent = "{\n" +
                    "  \"errorCategory\": \"COMPILE\",\n" +
                    "  \"failureSummary\": \"由于找不到符号 TokenEncryptor，导致编译失败 (Compilation error: cannot find symbol)\",\n" +
                    "  \"rootCause\": \"在 LlmConfigService.java 的第 3 行，尝试使用 TokenEncryptor 但没有正确 import com.sourcelens.common.security.TokenEncryptor; 或者 pom.xml 中对应的依赖库没有正确编译加载。\",\n" +
                    "  \"relatedFiles\": [\n" +
                    "    \"backend-spring/src/main/java/com/sourcelens/module/agent/service/LlmConfigService.java\"\n" +
                    "  ],\n" +
                    "  \"fixSuggestions\": [\n" +
                    "    \"在 LlmConfigService.java 文件顶部添加 import 语句: import com.sourcelens.common.security.TokenEncryptor;\",\n" +
                    "    \"在项目根目录下运行 mvn clean compile，确认本地编译通过后再提交代码\"\n" +
                    "  ]\n" +
                    "}";
        } else if (query.contains("代码上下文") || query.contains("code context") || query.contains("codeqa") || query.contains("code qa")) {
            log.info("识别为 RAG Code QA 请求，返回 Mock Code QA 回答");
            responseContent = "【Mock RAG Code QA 诊断结论】\n" +
                    "检测到大模型接收到了正确格式的代码上下文（Code Context）。\n" +
                    "您提问的问题是有关项目代码库的。我已检索到相关的代码切片：\n" +
                    "1. LlmConfigService.java\n" +
                    "2. CodeQaController.java\n" +
                    "大模型确认 RAG 上下文传递完全正常，本地 QA 链路完整通畅！";
        } else {
            log.info("识别为通用请求，返回常规文本");
            responseContent = "您好！我是源鉴 (SourceLens) 的大模型 Agent，已经做好准备帮您进行项目架构分析、PR 审查、需求拆解或 CI 诊断。请随时发送具体的分析请求！";
        }

        return Map.of(
                "choices", List.of(Map.of(
                        "index", 0,
                        "message", Map.of(
                                "role", "assistant",
                                "content", responseContent
                        ),
                        "finish_reason", "stop"
                )),
                "usage", Map.of(
                        "prompt_tokens", 100,
                        "completion_tokens", 150,
                        "total_tokens", 250
                )
        );
    }

    private void writeContentChunk(OutputStream out, String text) throws java.io.IOException {
        Map<String, Object> chunk = Map.of(
                "choices", List.of(Map.of(
                        "index", 0,
                        "delta", Map.of("content", text)
                ))
        );
        writeSseLine(out, objectMapper.writeValueAsString(chunk));
    }

    private void writeToolCallChunk(OutputStream out, String name, String argumentsJson) throws java.io.IOException {
        Map<String, Object> chunk = Map.of(
                "choices", List.of(Map.of(
                        "index", 0,
                        "delta", Map.of("tool_calls", List.of(Map.of(
                                "index", 0,
                                "id", "call_" + System.currentTimeMillis(),
                                "type", "function",
                                "function", Map.of("name", name, "arguments", argumentsJson)
                        )))
                ))
        );
        writeSseLine(out, objectMapper.writeValueAsString(chunk));
    }

    private void writeSseLine(OutputStream out, String data) throws java.io.IOException {
        String line = "data: " + data + "\n\n";
        out.write(line.getBytes(StandardCharsets.UTF_8));
        out.flush();
    }
}
