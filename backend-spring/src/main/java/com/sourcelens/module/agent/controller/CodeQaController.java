package com.sourcelens.module.agent.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.sourcelens.common.Result;
import com.sourcelens.common.exception.BizException;
import com.sourcelens.common.security.SensitiveDataSanitizer;
import com.sourcelens.module.agent.dto.CodeQaClaimCitationCoverage;
import com.sourcelens.module.agent.dto.CodeQaCitation;
import com.sourcelens.module.agent.dto.CodeQaCitationCoverage;
import com.sourcelens.module.agent.dto.CodeQaResponse;
import com.sourcelens.module.agent.dto.CodeQaRequest;
import com.sourcelens.module.agent.dto.CodeQaRetrievalPlan;
import com.sourcelens.module.agent.entity.LlmConfig;
import com.sourcelens.module.agent.service.CodeQaRetrievalService;
import com.sourcelens.module.agent.service.LlmClient;
import com.sourcelens.module.agent.service.LlmConfigService;
import com.sourcelens.module.agent.service.PromptInjectionGuard;
import com.sourcelens.module.analysis.dto.CodeChunkSearchItem;
import com.sourcelens.module.analysis.entity.CodeChunk;
import com.sourcelens.module.analysis.entity.CodeRelationEntity;
import com.sourcelens.module.analysis.entity.CodeSymbol;
import com.sourcelens.module.analysis.service.CodeChunkRanker;
import com.sourcelens.module.analysis.service.CodeChunkService;
import com.sourcelens.module.analysis.service.CodeEvidenceProfileService;
import com.sourcelens.module.analysis.service.GraphService;
import com.sourcelens.module.project.service.ProjectService;
import com.sourcelens.module.scantask.entity.ScanTask;
import com.sourcelens.module.scantask.service.ScanTaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Tag(name = "本地代码问答与RAG")
@RestController
@RequestMapping("/api/projects/{projectId}/qa")
@RequiredArgsConstructor
@Slf4j
public class CodeQaController {

    private static final int QA_CONTEXT_ADJACENT_PER_SIDE = 1;
    private static final int QA_CONTEXT_MAX_CHUNKS = 8;
    private static final int QA_CONTEXT_GRAPH_RELATED_LIMIT = 4;
    private static final int QA_SEMANTIC_POOL_LIMIT = 500;
    private static final int QA_CONTENT_PREVIEW_MAX_LENGTH = 600;
    private static final int CLAIM_AUDIT_MAX_CLAIMS = 20;
    private static final int CLAIM_AUDIT_PREVIEW_LENGTH = 180;
    private static final int ANSWER_CITATION_MAX_RANGE_SIZE = 50;
    private static final Pattern ANSWER_CITATION_PATTERN = Pattern.compile(
            "\\[\\s*C(\\d{1,4})\\s*]|【\\s*C(\\d{1,4})\\s*】",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern ANSWER_CITATION_BLOCK_PATTERN = Pattern.compile(
            "\\[(?=[^\\]\\r\\n]*\\bC\\d{1,4}\\b)[^\\]\\r\\n]{0,120}]|【(?=[^】\\r\\n]*\\bC\\d{1,4}\\b)[^】\\r\\n]{0,120}】",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern ANSWER_CITATION_TOKEN_PATTERN = Pattern.compile("\\bC(\\d{1,4})\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern ANSWER_CITATION_RANGE_PATTERN = Pattern.compile(
            "\\bC(\\d{1,4})\\s*(?:-|–|—|－|~|至|到)\\s*C?(\\d{1,4})\\b",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern SOURCE_LINE_RANGE_PATTERN = Pattern.compile("(?i)L?(\\d{1,7})(?:\\s*(?:-|~|–|—|－|至|到)\\s*L?(\\d{1,7}))?");
    private static final Pattern QUERY_SOURCE_LINE_ANCHOR_PATTERN = Pattern.compile("(?i)(?:[A-Za-z0-9_./\\\\-]+\\.(?:java|kt|ts|tsx|js|jsx|vue|py|go|rs|md))(?::\\d{1,7}|#L\\d{1,7})");
    private static final Pattern QUERY_SOURCE_EVIDENCE_FIELD_PATTERN = Pattern.compile("(?i)\\b(?:sourceUrl|source_url|filePath|file_path|path)\\s*[:=]");
    private static final Pattern CLAIM_SPLIT_PATTERN = Pattern.compile(
            "(?<=[。！？!?；;])"
                    + "|(?<=\\.)(?=\\s|$)"
                    + "|(?<=[\\]】])\\s+(?=(?:\\d+[.)、]|[-*+•·])\\s+)"
                    + "|(?<=[\\]】])\\s*[，,]\\s*(?=(?:此外|同时|另外|并且|其次|然后|但是|但|而|also\\b|however\\b|additionally\\b))"
                    + "|\\R+");
    private static final Pattern MARKDOWN_TABLE_SEPARATOR_CELL_PATTERN = Pattern.compile("^\\s*:?-{3,}:?\\s*$");
    private static final Pattern FENCED_CODE_BLOCK_PATTERN = Pattern.compile("(?ms)^\\s*(```|~~~).*?^\\s*\\1\\s*$");
    private static final Pattern HTML_CODE_BLOCK_PATTERN = Pattern.compile(
            "(?is)<\\s*(pre|code)\\b[^>]*>.*?<\\s*/\\s*\\1\\s*>");
    private static final Pattern HTML_SCRIPT_STYLE_BLOCK_PATTERN = Pattern.compile(
            "(?is)<\\s*(script|style)\\b[^>]*>.*?<\\s*/\\s*\\1\\s*>");
    private static final Pattern HTML_DELETED_TEXT_BLOCK_PATTERN = Pattern.compile(
            "(?is)<\\s*(del|s|strike)\\b[^>]*>.*?<\\s*/\\s*\\1\\s*>");
    private static final Pattern HTML_COMMENT_PATTERN = Pattern.compile("(?s)<!--.*?-->");
    private static final Pattern HTML_TAG_PATTERN = Pattern.compile(
            "(?is)</?[A-Za-z][A-Za-z0-9:-]*(?:\\s+[^<>]{0,500})?/?>");
    private static final Pattern INLINE_CODE_PATTERN = Pattern.compile("`[^`\\r\\n]*`");
    private static final Pattern HTML_LEFT_CITATION_BRACKET_ENTITY_PATTERN = Pattern.compile(
            "(?i)(?:&#0*91;|&#x0*5b;|&lbrack;|&lsqb;)");
    private static final Pattern HTML_RIGHT_CITATION_BRACKET_ENTITY_PATTERN = Pattern.compile(
            "(?i)(?:&#0*93;|&#x0*5d;|&rbrack;|&rsqb;)");
    private static final Pattern BARE_URL_PATTERN = Pattern.compile(
            "(?i)\\b(?:https?://|www\\.)\\S{1,500}");
    private static final Pattern COMMON_URI_PATTERN = Pattern.compile(
            "(?i)\\b(?:ftp|sftp|ssh|git|file|mailto|data|blob|javascript|vscode|idea):\\S{1,500}");
    private static final Pattern DOMAIN_URL_PATTERN = Pattern.compile(
            "(?i)(?<![A-Za-z0-9._/-])[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*"
                    + "\\.(?:com|org|net|io|dev|app|ai|cn|com\\.cn|co|edu|gov|test|localhost)(?::\\d{1,5})?[/?#]\\S{0,500}");
    private static final Pattern LOCAL_URL_PATTERN = Pattern.compile(
            "(?i)(?:\\b(?:localhost|(?:\\d{1,3}\\.){3}\\d{1,3})|\\[::1])(?::\\d{1,5})?[/?#]\\S{0,500}");
    private static final Pattern MARKDOWN_REFERENCE_DEFINITION_PATTERN = Pattern.compile("^\\s*\\[[^\\]\\r\\n]{1,240}]:\\s*(?:\\S+.*)?$");
    private static final String CITATION_FORMAT_EXAMPLE_KEYWORD_PATTERN =
            "(?:例如|示例|样例|引用格式|证据格式|\\b(?:citation|reference|source)\\s+(?:example|format)\\b"
                    + "|\\b(?:example|format)\\s+(?:citation|reference|source|evidence)\\b"
                    + "|\\b(?:example|format)\\s*[:：])";
    private static final Pattern CITATION_FORMAT_EXAMPLE_LINE_PATTERN = Pattern.compile(
            "(?i).*(\\[C\\d+]|【C\\d+】).*" + CITATION_FORMAT_EXAMPLE_KEYWORD_PATTERN + ".*"
                    + "|.*" + CITATION_FORMAT_EXAMPLE_KEYWORD_PATTERN + ".*(\\[C\\d+]|【C\\d+】).*");
    private static final Pattern STACK_TRACE_LINE_PATTERN = Pattern.compile(
            "(?i)^\\s*(at\\s+[\\w.$]+\\(|caused by:|suppressed:|exception in thread|traceback \\(most recent call last\\):|file\\s+\".*\",\\s+line\\s+\\d+|[\\w.$]+(Exception|Error):|\\.{3}\\s+\\d+\\s+more\\b).*");
    private static final Pattern LOG_LINE_PATTERN = Pattern.compile(
            "(?i)^\\s*(\\d{4}[-/]\\d{2}[-/]\\d{2}[T\\s]\\d{2}:\\d{2}:\\d{2}|\\d{2}:\\d{2}:\\d{2}|\\[[A-Z]+]|(TRACE|DEBUG|INFO|WARN|ERROR|FATAL)\\b|level\\s*=\\s*(trace|debug|info|warn|error|fatal)\\b|\\{\\s*\"level\"\\s*:\\s*\"?(trace|debug|info|warn|error|fatal)\"?).*");
    private static final Pattern CODE_FACT_PATTERN = Pattern.compile(
            "(?i)(\\b(class|method|function|controller|service|repository|endpoint|api|route|token|auth|sql|null|exception|risk|config)\\b|[A-Za-z0-9_./-]+\\.(java|ts|tsx|js|jsx|py|sql|yml|yaml|xml|json)|代码|文件|类|方法|函数|接口|路由|控制器|服务|数据库|配置|风险|调用|依赖|权限|认证|异常|空指针|扫描|修复)");
    private static final String CODE_QA_EVIDENCE_PATH_EXTENSION_PATTERN =
            "properties|tsx|jsx|vue|cpp|hpp|html|scss|yaml|java|kts|kt|ts|js|py|go|rs|cs|css|sql|xml|yml|md|sh|c|h";
    private static final Pattern HOSTED_SOURCE_URL_PATTERN = Pattern.compile("(?i)^[a-z][a-z0-9+.-]*://([^/]+)/(.+)$");
    private static final Pattern HOSTED_SOURCE_FILE_CANDIDATE_PATTERN = Pattern.compile(
            "(?i).*\\.(?:" + CODE_QA_EVIDENCE_PATH_EXTENSION_PATTERN + ")(?:[?#:].*)?$");
    private static final Set<String> HOSTED_SOURCE_STRONG_ROOT_SEGMENTS = Set.of(
            ".github", "agent-runtime", "analyzer-rust", "backend", "backend-spring", "bin", "cmd",
            "deploy", "frontend", "lib", "scripts", "server", "web-console");
    private static final Set<String> HOSTED_SOURCE_APP_ROOT_SEGMENTS = Set.of("app", "apps", "client", "packages");
    private static final Set<String> HOSTED_SOURCE_GENERIC_ROOT_SEGMENTS = Set.of("docs", "src", "test", "tests");
    private static final List<String> OPERATIONAL_FALLBACK_ANSWER_PREFIXES = List.of(
            "当前未配置或激活有效的 LLM 模型。",
            "调用大模型进行代码问答失败，请检查大模型配置或网络连接。");
    private static final List<String> OPERATIONAL_FALLBACK_CLAIM_PREFIXES = List.of(
            "当前未配置或激活有效的 LLM 模型",
            "请前往配置中心激活大模型",
            "已先为您检索出相关代码片段",
            "调用大模型进行代码问答失败",
            "请检查大模型配置或网络连接",
            "错误信息:");
    private static final String CITATION_DIRECT_VERIFIED = "DIRECT_VERIFIED";
    private static final String CITATION_RETRY_VERIFIED = "RETRY_VERIFIED";
    private static final String CITATION_RETRY_FAILED = "RETRY_FAILED";
    private static final String CITATION_FALLBACK_CITED = "FALLBACK_CITED";
    private static final String CITATION_NOT_APPLICABLE = "NOT_APPLICABLE";
    private static final String CITATION_REASON_DIRECT_VERIFIED = "DIRECT_VERIFIED";
    private static final String CITATION_REASON_RETRY_VERIFIED = "RETRY_VERIFIED";
    private static final String CITATION_REASON_FALLBACK_PRIMARY_CITED = "FALLBACK_PRIMARY_CITED";
    private static final String CITATION_REASON_NOT_APPLICABLE = "NOT_APPLICABLE";
    private static final String CITATION_REASON_NO_EVIDENCE = "NO_EVIDENCE";
    private static final String CITATION_REASON_RETRY_CALL_FAILED = "RETRY_CALL_FAILED";
    private static final String CITATION_REASON_INVALID_LABEL = "INVALID_LABEL";
    private static final String CITATION_REASON_NO_AUDITABLE_CLAIM = "NO_AUDITABLE_CLAIM";
    private static final String CITATION_REASON_CONTEXT_ONLY_CLAIM = "CONTEXT_ONLY_CLAIM";
    private static final String CITATION_REASON_UNKNOWN_ONLY_CLAIM = "UNKNOWN_ONLY_CLAIM";
    private static final String CITATION_REASON_UNCITED_REQUIRED_CLAIM = "UNCITED_REQUIRED_CLAIM";
    private static final String CITATION_REASON_NO_VALID_CITATION_LABEL = "NO_VALID_CITATION_LABEL";
    private static final String CITATION_REASON_NO_PRIMARY_CITATION = "NO_PRIMARY_CITATION";
    private static final String CITATION_REASON_PRIMARY_BOUND_INCOMPLETE = "PRIMARY_BOUND_INCOMPLETE";

    private final ProjectService projectService;
    private final ScanTaskService scanTaskService;
    private final CodeChunkService codeChunkService;
    private final LlmConfigService llmConfigService;
    private final LlmClient llmClient;
    private final CodeQaRetrievalService retrievalService;
    private final CodeEvidenceProfileService evidenceProfileService;
    private final GraphService graphService;

    @Operation(summary = "本地代码库 Q&A 问答")
    @PostMapping
    public Result<CodeQaResponse> codeQa(
            @PathVariable Long projectId,
            @Valid @RequestBody CodeQaRequest req,
            @RequestAttribute("userId") Long userId) {

        // 1. 验证项目所有权
        projectService.verifyOwnership(projectId, userId);

        String question = req.getQuestion();
        CodeQaRequest.EvidenceRef evidenceRef = req.getEvidenceRef();
        String retrievalQuestion = retrievalQuestion(question, evidenceRef);

        // 2. 使用报告指定扫描任务；未指定时回退到最近一次成功扫描。
        ScanTask selectedTask = resolveScanTask(projectId, req.getScanTaskId());

        if (selectedTask == null) {
            return Result.ok(response(question, null,
                    "没有找到该项目成功的扫描任务，请先执行一次成功的代码扫描。",
                    List.of(), 0L, 0L, 0L, "NO_SCAN", evidenceRef));
        }

        if (!"SUCCESS".equals(selectedTask.getStatus())) {
            return Result.ok(response(question, selectedTask.getId(),
                    "指定扫描任务尚未成功完成，无法作为代码问答证据源。请等待扫描成功或切换到成功扫描报告。",
                    List.of(), 0L, 0L, 0L, "NO_SCAN", evidenceRef));
        }

        long selectedScanTaskId = selectedTask.getId();
        long totalChunks = codeChunkService.countChunks(selectedScanTaskId);
        long matchedChunks = codeChunkService.countSearchMatches(selectedScanTaskId, retrievalQuestion);
        LlmConfig llmConfig = llmConfigService.getActiveConfig(userId);
        String embeddingModelKey = CodeChunkService.embeddingModelKey(llmConfig);
        long embeddedChunks = codeChunkService.countEmbeddedChunks(selectedScanTaskId, embeddingModelKey);

        // 3. 只获取与问题相关的候选切片，避免一次问答全量加载大型项目的所有 chunk
        List<CodeChunk> chunks = codeChunkService.listRetrievalCandidates(selectedScanTaskId, retrievalQuestion);
        if (chunks == null || chunks.isEmpty()) {
            return Result.ok(response(question, selectedScanTaskId,
                    "该项目的扫描任务未生成任何代码切片。",
                    List.of(), totalChunks, embeddedChunks, matchedChunks, "NO_CONTEXT", evidenceRef));
        }

        // 4. 先按关键词/路径筛候选，再只对候选做向量相似度排序
        List<Float> questionEmbedding = null;
        boolean questionEmbeddingFailed = false;
        if (llmConfig != null) {
            try {
                questionEmbedding = llmClient.getEmbedding(llmConfig, retrievalQuestion);
            } catch (Exception e) {
                questionEmbeddingFailed = true;
                log.warn("获取提问 Embedding 失败，将仅使用关键词匹配检索: {}", e.getMessage());
            }
        }

        List<CodeChunk> rerankCandidates = chunks;
        boolean semanticPoolAttempted = false;
        int semanticPoolLoadedCount = 0;
        if (questionEmbedding != null && !questionEmbedding.isEmpty()) {
            semanticPoolAttempted = true;
            try {
                List<CodeChunk> semanticCandidates = codeChunkService.listSemanticRetrievalCandidates(
                        selectedScanTaskId,
                        embeddingModelKey,
                        embeddedChunks);
                semanticPoolLoadedCount = semanticCandidates == null ? 0 : semanticCandidates.size();
                rerankCandidates = mergeCandidateChunks(chunks,
                        semanticCandidates);
            } catch (Exception e) {
                log.warn("加载代码问答语义候选池失败，将仅使用关键词候选, scanTaskId={}, error={}",
                        selectedScanTaskId, e.getMessage());
            }
        }

        List<CodeChunk> topChunks = retrievalService.selectTopChunks(rerankCandidates, retrievalQuestion, questionEmbedding, embeddingModelKey);
        RelationExpandedContext relationContext = expandWithGraphRelatedChunks(selectedScanTaskId, topChunks, rerankCandidates);
        List<CodeChunk> contextChunks = expandContextChunks(selectedScanTaskId, relationContext.chunks());
        Set<String> primaryChunkKeys = promoteGraphRelatedPrimaryChunkKeys(
                primaryChunkKeys(topChunks, evidenceRef),
                relationContext,
                retrievalQuestion
        );
        List<CodeChunkSearchItem> retrievedChunks = toRetrievedChunks(
                contextChunks,
                retrievalQuestion,
                primaryChunkKeys,
                embeddingModelKey,
                relationContext.relationEvidenceReasons(),
                evidenceRef);
        String retrievalMode = retrievalMode(matchedChunks, retrievedChunks, questionEmbedding);
        SemanticRetrievalDiagnostics semanticDiagnostics = semanticDiagnostics(
                totalChunks,
                embeddedChunks,
                llmConfig,
                questionEmbedding,
                questionEmbeddingFailed,
                semanticPoolAttempted,
                semanticPoolLoadedCount);
        if (llmConfig == null) {
            return Result.ok(response(question, selectedScanTaskId,
                    fallbackCitedAnswer("当前未配置或激活有效的 LLM 模型。请前往配置中心激活大模型，然后再试。已先为您检索出相关代码片段。", retrievedChunks),
                    retrievedChunks, totalChunks, embeddedChunks, matchedChunks, retrievalMode,
                    fallbackCitedLabels(retrievedChunks), CITATION_FALLBACK_CITED,
                    CITATION_REASON_FALLBACK_PRIMARY_CITED,
                    "未配置 LLM 时返回检索证据摘要，并优先显式引用 PRIMARY 证据。", evidenceRef,
                    semanticDiagnostics));
        }

        // 5. 构造 RAG 上下文 Prompt
        StringBuilder contextBuilder = new StringBuilder();
        String evidenceContext = evidenceContext(evidenceRef);
        if (!evidenceContext.isBlank()) {
            contextBuilder.append("### Report Evidence Reference\n");
            contextBuilder.append(evidenceContext);
            contextBuilder.append("\n\n");
        }
        for (int i = 0; i < contextChunks.size(); i++) {
            CodeChunk chunk = contextChunks.get(i);
            CodeChunkSearchItem evidence = i < retrievedChunks.size() ? retrievedChunks.get(i) : null;
            contextBuilder.append(String.format("### [C%d] %s (Lines %d-%d)\n",
                    i + 1, chunk.getFilePath(), chunk.getStartLine(), chunk.getEndLine()));
            if (evidence != null) {
                contextBuilder.append("Context role: ").append(normalizedEvidenceRole(evidence.getContextRole())).append("\n");
                contextBuilder.append("Evidence type: ").append(evidence.getEvidenceType()).append("\n");
                contextBuilder.append("Relevance score: ").append(evidence.getRelevanceScore()).append("\n");
                contextBuilder.append("Evidence reason: ").append(evidence.getEvidenceReason()).append("\n");
                if (evidence.getMatchedTerms() != null && !evidence.getMatchedTerms().isEmpty()) {
                    contextBuilder.append("Matched terms: ").append(String.join(", ", evidence.getMatchedTerms())).append("\n");
                }
            }
            contextBuilder.append("```\n");
            contextBuilder.append(chunk.getContent());
            contextBuilder.append("\n```\n\n");
        }

        String systemPrompt = "你是一个优秀的软件架构师和资深程序员。请根据下面提供的代码上下文（Code Context）来回答用户关于代码库的问题。\n" +
                "请严格基于提供的代码事实进行回答，不要编造。如果上下文信息不足以回答问题，请明确说明哪些部分的代码你没有看到或无法从上下文中得知。\n\n" +
                "当回答涉及具体代码事实、文件、函数、类、流程或风险判断时，必须使用 [C1]、[C2] 这样的引用标记指向对应代码片段。不要引用未出现在上下文中的代码片段。\n\n" +
                relationAwarePromptInstructions(retrievalQuestion, retrievedChunks) +
                PromptInjectionGuard.systemBoundaryInstructions() + "\n" +
                "[代码上下文]\n" +
                PromptInjectionGuard.wrapUntrustedContent("retrieved code chunks", contextBuilder.toString());

        List<Map<String, String>> messages = List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", question)
        );

        // 6. 触发大模型调用
        try {
            String answer = llmClient.chat(llmConfig, messages);
            CitationEnforcementResult enforcement = enforceAnswerCitations(llmConfig, question, answer, retrievedChunks, messages);
            return Result.ok(response(question, selectedScanTaskId, enforcement.answer(), retrievedChunks,
                    totalChunks, embeddedChunks, matchedChunks, retrievalMode, enforcement.citedLabels(),
                    enforcement.status(), enforcement.reason(), enforcement.note(), evidenceRef,
                    semanticDiagnostics));
        } catch (Exception e) {
            log.error("大模型问答接口调用异常", e);
            return Result.ok(response(question, selectedScanTaskId,
                    fallbackCitedAnswer("调用大模型进行代码问答失败，请检查大模型配置或网络连接。错误信息：" + e.getMessage(), retrievedChunks),
                    retrievedChunks, totalChunks, embeddedChunks, matchedChunks, retrievalMode,
                    fallbackCitedLabels(retrievedChunks), CITATION_FALLBACK_CITED,
                    CITATION_REASON_FALLBACK_PRIMARY_CITED,
                    "LLM 调用失败时返回检索证据摘要，并优先显式引用 PRIMARY 证据。", evidenceRef,
                    semanticDiagnostics));
        }
    }

    private ScanTask resolveScanTask(Long projectId, Long requestedScanTaskId) {
        if (requestedScanTaskId != null) {
            ScanTask requestedTask = scanTaskService.getById(requestedScanTaskId);
            if (requestedTask == null
                    || Boolean.TRUE.equals(requestedTask.getDeleted())
                    || !Objects.equals(requestedTask.getProjectId(), projectId)) {
                throw BizException.notFound("ScanTask");
            }
            return requestedTask;
        }
        return scanTaskService.getOne(
                new LambdaQueryWrapper<ScanTask>()
                        .eq(ScanTask::getProjectId, projectId)
                        .eq(ScanTask::getStatus, "SUCCESS")
                        .orderByDesc(ScanTask::getCreatedAt)
                        .last("LIMIT 1")
        );
    }

    private String retrievalQuestion(String question, CodeQaRequest.EvidenceRef evidenceRef) {
        String evidenceContext = evidenceContext(evidenceRef);
        if (evidenceContext.isBlank()) {
            return question;
        }
        return (question == null ? "" : question) + "\n" + evidenceContext;
    }

    private String evidenceContext(CodeQaRequest.EvidenceRef evidenceRef) {
        if (evidenceRef == null) {
            return "";
        }
        List<String> parts = new ArrayList<>();
        addEvidencePart(parts, "category", evidenceRef.getCategory());
        addEvidencePart(parts, "source", evidenceRef.getSource());
        addEvidencePart(parts, "title", evidenceRef.getTitle());
        addEvidencePart(parts, "summary", evidenceRef.getSummary());
        addEvidencePart(parts, "filePath", evidenceRef.getFilePath());
        addEvidencePart(parts, "line", sourceLineLabel(evidenceRef));
        return String.join("\n", parts);
    }

    private String relationAwarePromptInstructions(String question, List<CodeChunkSearchItem> retrievedChunks) {
        if (!hasGraphFlowPrimaryIntent(question) || retrievedChunks == null || retrievedChunks.isEmpty()) {
            return "";
        }
        List<String> graphPrimaryLabels = retrievedChunks.stream()
                .filter(chunk -> chunk != null
                        && "PRIMARY".equals(normalizedEvidenceRole(chunk.getContextRole()))
                        && chunk.getSourceLabel() != null
                        && !chunk.getSourceLabel().isBlank()
                        && chunk.getEvidenceReason() != null
                        && chunk.getEvidenceReason().contains("Graph relation:"))
                .map(chunk -> "[" + chunk.getSourceLabel() + "]")
                .distinct()
                .toList();
        if (graphPrimaryLabels.isEmpty()) {
            return "";
        }
        return "当问题涉及流程、调用链或跨文件关系时，必须优先使用包含 Graph relation 的 PRIMARY 证据 "
                + graphPrimaryLabels
                + " 来组织回答；不要只依据单文件片段推断跨文件流程。\n\n";
    }

    private void addEvidencePart(List<String> parts, String label, String value) {
        if (value == null || value.isBlank()) {
            return;
        }
        parts.add(label + ": " + value.trim());
    }

    private CodeQaResponse response(String question, Long scanTaskId, String answer, List<CodeChunkSearchItem> retrievedChunks,
                                    long totalChunks, long embeddedChunks, long matchedChunks) {
        return response(question, scanTaskId, answer, retrievedChunks, totalChunks, embeddedChunks, matchedChunks, "KEYWORD");
    }

    private CodeQaResponse response(String question, Long scanTaskId, String answer, List<CodeChunkSearchItem> retrievedChunks,
                                    long totalChunks, long embeddedChunks, long matchedChunks, String retrievalMode) {
        return response(question, scanTaskId, answer, retrievedChunks, totalChunks, embeddedChunks, matchedChunks,
                retrievalMode, Set.of(), CITATION_NOT_APPLICABLE, CITATION_REASON_NOT_APPLICABLE,
                "当前响应没有可用证据或无需执行引用强制。", null,
                defaultSemanticDiagnostics(totalChunks, embeddedChunks));
    }

    private CodeQaResponse response(String question, Long scanTaskId, String answer, List<CodeChunkSearchItem> retrievedChunks,
                                    long totalChunks, long embeddedChunks, long matchedChunks, String retrievalMode,
                                    CodeQaRequest.EvidenceRef evidenceRef) {
        return response(question, scanTaskId, answer, retrievedChunks, totalChunks, embeddedChunks, matchedChunks,
                retrievalMode, Set.of(), CITATION_NOT_APPLICABLE, CITATION_REASON_NOT_APPLICABLE,
                "当前响应没有可用证据或无需执行引用强制。", evidenceRef,
                defaultSemanticDiagnostics(totalChunks, embeddedChunks));
    }

    private CodeQaResponse response(String question, Long scanTaskId, String answer, List<CodeChunkSearchItem> retrievedChunks,
                                    long totalChunks, long embeddedChunks, long matchedChunks, String retrievalMode,
                                    Set<String> citedLabels) {
        return response(question, scanTaskId, answer, retrievedChunks, totalChunks, embeddedChunks, matchedChunks,
                retrievalMode, citedLabels, citationStatus(retrievedChunks, citedLabels),
                citationReason(citationStatus(retrievedChunks, citedLabels)), citationNote(retrievedChunks, citedLabels),
                null, defaultSemanticDiagnostics(totalChunks, embeddedChunks));
    }

    private CodeQaResponse response(String question, Long scanTaskId, String answer, List<CodeChunkSearchItem> retrievedChunks,
                                    long totalChunks, long embeddedChunks, long matchedChunks, String retrievalMode,
                                    Set<String> citedLabels, String citationEnforcementStatus, String citationEnforcementNote) {
        return response(question, scanTaskId, answer, retrievedChunks, totalChunks, embeddedChunks, matchedChunks,
                retrievalMode, citedLabels, citationEnforcementStatus, citationReason(citationEnforcementStatus),
                citationEnforcementNote, null, defaultSemanticDiagnostics(totalChunks, embeddedChunks));
    }

    private String citationReason(String citationEnforcementStatus) {
        if (CITATION_DIRECT_VERIFIED.equals(citationEnforcementStatus)) {
            return CITATION_REASON_DIRECT_VERIFIED;
        }
        if (CITATION_RETRY_VERIFIED.equals(citationEnforcementStatus)) {
            return CITATION_REASON_RETRY_VERIFIED;
        }
        if (CITATION_FALLBACK_CITED.equals(citationEnforcementStatus)) {
            return CITATION_REASON_FALLBACK_PRIMARY_CITED;
        }
        if (CITATION_NOT_APPLICABLE.equals(citationEnforcementStatus)) {
            return CITATION_REASON_NOT_APPLICABLE;
        }
        return citationEnforcementStatus == null || citationEnforcementStatus.isBlank()
                ? CITATION_REASON_NOT_APPLICABLE
                : citationEnforcementStatus;
    }

    private CodeQaResponse response(String question, Long scanTaskId, String answer, List<CodeChunkSearchItem> retrievedChunks,
                                    long totalChunks, long embeddedChunks, long matchedChunks, String retrievalMode,
                                    Set<String> citedLabels, String citationEnforcementStatus, String citationEnforcementReason,
                                    String citationEnforcementNote,
                                    CodeQaRequest.EvidenceRef evidenceRef,
                                    SemanticRetrievalDiagnostics semanticDiagnostics) {
        List<CodeChunkSearchItem> safeChunks = retrievedChunks == null ? List.of() : retrievedChunks;
        List<CodeQaCitation> citations = toCitations(safeChunks, citedLabels);
        CodeQaCitationCoverage citationCoverage = citationCoverage(citations);
        CodeQaClaimCitationCoverage claimCitationCoverage = claimCitationCoverage(answer, safeChunks);
        CodeQaRequest.EvidenceRef sourceEvidenceRef = sanitizeSourceEvidenceRef(evidenceRef);
        String sourceEvidenceMatchType = sourceEvidenceMatchType(sourceEvidenceRef, safeChunks);
        return CodeQaResponse.builder()
                .question(question)
                .scanTaskId(scanTaskId)
                .answer(answer)
                .matchedChunks(matchedChunks)
                .resultCount(safeChunks.size())
                .retrievalMode(retrievalMode)
                .totalChunks(totalChunks)
                .embeddedChunks(embeddedChunks)
                .truncated(matchedChunks > safeChunks.size())
                .retrievalPlan(retrievalPlan(question, evidenceRef, retrievalMode, matchedChunks, embeddedChunks, safeChunks, semanticDiagnostics))
                .evidenceProfile(evidenceProfileService.build(retrievalMode, safeChunks, totalChunks, embeddedChunks, matchedChunks))
                .groundingStatus(groundingStatus(safeChunks, citedLabels))
                .citationEnforcementStatus(citationEnforcementStatus)
                .citationEnforcementReason(citationEnforcementReason)
                .citationEnforcementNote(citationEnforcementNote)
                .citationCoverage(citationCoverage)
                .claimCitationCoverage(claimCitationCoverage)
                .sourceEvidenceRef(sourceEvidenceRef)
                .sourceEvidenceMatched(!"NONE".equals(sourceEvidenceMatchType))
                .sourceEvidenceMatchType(sourceEvidenceMatchType)
                .answerCitations(citations)
                .retrievedChunks(safeChunks)
                .build();
    }

    private CodeQaRetrievalPlan retrievalPlan(CodeQaRequest req,
                                              String retrievalMode,
                                              long matchedChunks,
                                              long embeddedChunks) {
        if (req == null) {
            return retrievalPlan(null, null, retrievalMode, matchedChunks, embeddedChunks, List.of(),
                    defaultSemanticDiagnostics(0, embeddedChunks));
        }
        return retrievalPlan(req.getQuestion(), req.getEvidenceRef(), retrievalMode, matchedChunks, embeddedChunks, List.of(),
                defaultSemanticDiagnostics(0, embeddedChunks));
    }

    private CodeQaRetrievalPlan retrievalPlan(String question,
                                              CodeQaRequest.EvidenceRef evidenceRef,
                                              String retrievalMode,
                                              long matchedChunks,
                                              long embeddedChunks,
                                              List<CodeChunkSearchItem> retrievedChunks,
                                              SemanticRetrievalDiagnostics semanticDiagnostics) {
        String planQuestion = retrievalQuestion(question, evidenceRef);
        List<String> tokens = Arrays.asList(CodeChunkRanker.tokenize(planQuestion));
        List<String> roleIntents = CodeChunkRanker.roleIntentTypes(planQuestion);
        List<String> fallbackRolePriority = codeChunkService.representativeFallbackRolePriorities(planQuestion);
        if (fallbackRolePriority == null) {
            fallbackRolePriority = List.of();
        }
        List<CodeChunkSearchItem> relationEvidence = graphRelationEvidence(retrievedChunks);
        List<String> graphRelationPrimaryLabels = relationEvidence.stream()
                .filter(chunk -> "PRIMARY".equals(normalizedEvidenceRole(chunk.getContextRole())))
                .map(CodeChunkSearchItem::getSourceLabel)
                .filter(label -> label != null && !label.isBlank())
                .distinct()
                .toList();
        boolean crossFileIntentPresent = hasGraphFlowPrimaryIntent(planQuestion);
        int crossFilePrimaryFileCount = primaryEvidenceFileCount(retrievedChunks);
        return CodeQaRetrievalPlan.builder()
                .tokens(tokens)
                .queryStrategy(queryStrategy(planQuestion, retrievalMode, matchedChunks, embeddedChunks, roleIntents))
                .roleIntents(roleIntents)
                .fallbackRolePriority(fallbackRolePriority)
                .auxiliaryHintsPresent(codeChunkService.hasAuxiliarySearchHints(planQuestion))
                .questionEmbeddingAvailable(semanticDiagnostics.questionEmbeddingAvailable())
                .embeddingCoveragePercent(semanticDiagnostics.embeddingCoveragePercent())
                .embeddingCoverageStatus(semanticDiagnostics.embeddingCoverageStatus())
                .semanticPoolAttempted(semanticDiagnostics.semanticPoolAttempted())
                .semanticPoolStrategy(semanticDiagnostics.semanticPoolStrategy())
                .semanticPoolLoadedCount(semanticDiagnostics.semanticPoolLoadedCount())
                .semanticPoolLimit(semanticDiagnostics.semanticPoolLimit())
                .semanticPoolTruncated(semanticDiagnostics.semanticPoolTruncated())
                .semanticPoolCoveragePercent(semanticDiagnostics.semanticPoolCoveragePercent())
                .semanticPlanReason(semanticPlanReason(retrievalMode, semanticDiagnostics))
                .semanticReadinessStatus(semanticReadinessStatus(retrievalMode, semanticDiagnostics))
                .semanticReadinessReason(semanticReadinessReason(retrievalMode, semanticDiagnostics))
                .crossFileIntentPresent(crossFileIntentPresent)
                .crossFileEvidenceSatisfied(crossFileIntentPresent && crossFilePrimaryFileCount >= 2)
                .crossFilePrimaryFileCount(crossFilePrimaryFileCount)
                .crossFileEvidenceStatus(crossFileEvidenceStatus(crossFileIntentPresent, crossFilePrimaryFileCount))
                .graphRelationEvidencePresent(!relationEvidence.isEmpty())
                .graphRelationPrimaryLabels(graphRelationPrimaryLabels)
                .graphRelationEvidenceCount(relationEvidence.size())
                .fallbackReason(retrievalFallbackReason(retrievalMode, matchedChunks, embeddedChunks, roleIntents, fallbackRolePriority))
                .build();
    }

    private SemanticRetrievalDiagnostics semanticDiagnostics(long totalChunks,
                                                             long embeddedChunks,
                                                             LlmConfig llmConfig,
                                                             List<Float> questionEmbedding,
                                                             boolean questionEmbeddingFailed,
                                                             boolean semanticPoolAttempted,
                                                             int semanticPoolLoadedCount) {
        boolean questionEmbeddingAvailable = questionEmbedding != null && !questionEmbedding.isEmpty();
        return new SemanticRetrievalDiagnostics(
                questionEmbeddingAvailable,
                embeddingCoveragePercent(totalChunks, embeddedChunks),
                embeddingCoverageStatus(totalChunks, embeddedChunks),
                semanticPoolAttempted,
                semanticPoolStrategy(semanticPoolAttempted, embeddedChunks),
                Math.max(semanticPoolLoadedCount, 0),
                QA_SEMANTIC_POOL_LIMIT,
                semanticPoolTruncated(semanticPoolAttempted, embeddedChunks, semanticPoolLoadedCount),
                semanticPoolCoveragePercent(semanticPoolAttempted, embeddedChunks, semanticPoolLoadedCount),
                llmConfig != null,
                questionEmbeddingFailed);
    }

    private SemanticRetrievalDiagnostics defaultSemanticDiagnostics(long totalChunks, long embeddedChunks) {
        return new SemanticRetrievalDiagnostics(
                false,
                embeddingCoveragePercent(totalChunks, embeddedChunks),
                embeddingCoverageStatus(totalChunks, embeddedChunks),
                false,
                "NOT_ATTEMPTED",
                0,
                QA_SEMANTIC_POOL_LIMIT,
                false,
                0,
                false,
                false);
    }

    private int embeddingCoveragePercent(long totalChunks, long embeddedChunks) {
        if (totalChunks <= 0 || embeddedChunks <= 0) {
            return 0;
        }
        return (int) Math.min(100, Math.round(embeddedChunks * 100.0 / totalChunks));
    }

    private String embeddingCoverageStatus(long totalChunks, long embeddedChunks) {
        int percent = embeddingCoveragePercent(totalChunks, embeddedChunks);
        if (totalChunks <= 0 || embeddedChunks <= 0) {
            return "NONE";
        }
        if (percent < 30) {
            return "LOW";
        }
        if (percent < 80) {
            return "PARTIAL";
        }
        return "READY";
    }

    private String semanticPoolStrategy(boolean semanticPoolAttempted, long embeddedChunks) {
        if (!semanticPoolAttempted) {
            return "NOT_ATTEMPTED";
        }
        return embeddedChunks > QA_SEMANTIC_POOL_LIMIT ? "HEAD_DISTRIBUTED_WINDOWS" : "HEAD_ONLY";
    }

    private boolean semanticPoolTruncated(boolean semanticPoolAttempted, long embeddedChunks, int semanticPoolLoadedCount) {
        return semanticPoolAttempted && embeddedChunks > Math.max(semanticPoolLoadedCount, 0);
    }

    private int semanticPoolCoveragePercent(boolean semanticPoolAttempted, long embeddedChunks, int semanticPoolLoadedCount) {
        if (!semanticPoolAttempted || embeddedChunks <= 0 || semanticPoolLoadedCount <= 0) {
            return 0;
        }
        return (int) Math.min(100, Math.round(Math.max(semanticPoolLoadedCount, 0) * 100.0 / embeddedChunks));
    }

    private String semanticPlanReason(String retrievalMode, SemanticRetrievalDiagnostics semanticDiagnostics) {
        if ("NO_SCAN".equals(retrievalMode)) {
            return "NO_SCAN";
        }
        if ("NO_CONTEXT".equals(retrievalMode)) {
            return "NO_CONTEXT";
        }
        if (!semanticDiagnostics.activeLlmPresent()) {
            return "NO_ACTIVE_LLM";
        }
        if (semanticDiagnostics.questionEmbeddingFailed()) {
            return "QUESTION_EMBEDDING_FAILED";
        }
        if (!semanticDiagnostics.questionEmbeddingAvailable()) {
            return "QUESTION_EMBEDDING_UNAVAILABLE";
        }
        if ("NONE".equals(semanticDiagnostics.embeddingCoverageStatus())) {
            return "NO_MODEL_EMBEDDINGS";
        }
        if ("LOW".equals(semanticDiagnostics.embeddingCoverageStatus())) {
            return "LOW_EMBEDDING_COVERAGE";
        }
        if (semanticDiagnostics.semanticPoolAttempted() && semanticDiagnostics.semanticPoolLoadedCount() > 0) {
            return "SEMANTIC_POOL_READY";
        }
        if (semanticDiagnostics.semanticPoolAttempted()) {
            return "SEMANTIC_POOL_EMPTY";
        }
        return "KEYWORD_ONLY";
    }

    private String semanticReadinessStatus(String retrievalMode, SemanticRetrievalDiagnostics semanticDiagnostics) {
        if ("NO_SCAN".equals(retrievalMode) || "NO_CONTEXT".equals(retrievalMode)) {
            return "NOT_APPLICABLE";
        }
        if (!semanticDiagnostics.activeLlmPresent()) {
            return "DISABLED";
        }
        if (semanticDiagnostics.questionEmbeddingFailed()
                || !semanticDiagnostics.questionEmbeddingAvailable()
                || "NONE".equals(semanticDiagnostics.embeddingCoverageStatus())
                || (semanticDiagnostics.semanticPoolAttempted() && semanticDiagnostics.semanticPoolLoadedCount() <= 0)) {
            return "UNAVAILABLE";
        }
        if ("LOW".equals(semanticDiagnostics.embeddingCoverageStatus())
                || "PARTIAL".equals(semanticDiagnostics.embeddingCoverageStatus())
                || semanticDiagnostics.semanticPoolTruncated()) {
            return "DEGRADED";
        }
        return "READY";
    }

    private String semanticReadinessReason(String retrievalMode, SemanticRetrievalDiagnostics semanticDiagnostics) {
        if ("NO_SCAN".equals(retrievalMode)) {
            return "NO_SCAN";
        }
        if ("NO_CONTEXT".equals(retrievalMode)) {
            return "NO_CONTEXT";
        }
        if (!semanticDiagnostics.activeLlmPresent()) {
            return "NO_ACTIVE_LLM";
        }
        if (semanticDiagnostics.questionEmbeddingFailed()) {
            return "QUESTION_EMBEDDING_FAILED";
        }
        if (!semanticDiagnostics.questionEmbeddingAvailable()) {
            return "QUESTION_EMBEDDING_UNAVAILABLE";
        }
        if ("NONE".equals(semanticDiagnostics.embeddingCoverageStatus())) {
            return "NO_MODEL_EMBEDDINGS";
        }
        if ("LOW".equals(semanticDiagnostics.embeddingCoverageStatus())) {
            return "LOW_EMBEDDING_COVERAGE";
        }
        if ("PARTIAL".equals(semanticDiagnostics.embeddingCoverageStatus())) {
            return "PARTIAL_EMBEDDING_COVERAGE";
        }
        if (semanticDiagnostics.semanticPoolAttempted() && semanticDiagnostics.semanticPoolLoadedCount() <= 0) {
            return "SEMANTIC_POOL_EMPTY";
        }
        if (semanticDiagnostics.semanticPoolTruncated()) {
            return "SEMANTIC_POOL_TRUNCATED";
        }
        return "SEMANTIC_READY";
    }

    private String queryStrategy(String question,
                                 String retrievalMode,
                                 long matchedChunks,
                                 long embeddedChunks,
                                 List<String> roleIntents) {
        if ("NO_SCAN".equals(retrievalMode)) {
            return "NO_SCAN";
        }
        if ("NO_CONTEXT".equals(retrievalMode)) {
            return "NO_CONTEXT";
        }
        if (hasExactLocationAnchor(question)) {
            return "SOURCE_LOCATION_ANCHOR";
        }
        if (!CodeChunkRanker.endpointRouteHints(question).isEmpty()) {
            return "ENDPOINT_ROUTE_LOOKUP";
        }
        List<String> safeRoleIntents = roleIntents == null ? List.of() : roleIntents;
        if (safeRoleIntents.contains("FRONTEND") && safeRoleIntents.contains("CONTROLLER")) {
            return "FRONTEND_BACKEND_BRIDGE";
        }
        if (safeRoleIntents.contains("CONTROLLER")
                && safeRoleIntents.contains("SERVICE")
                && safeRoleIntents.contains("DATA_ACCESS")) {
            return "BACKEND_FLOW_ROLE_EXPANSION";
        }
        if ("SEMANTIC_FALLBACK".equals(retrievalMode)) {
            return "SEMANTIC_FALLBACK";
        }
        if ("HYBRID".equals(retrievalMode) && embeddedChunks > 0) {
            return "SEMANTIC_HYBRID";
        }
        if (matchedChunks == 0 && !safeRoleIntents.isEmpty()) {
            return "ROLE_INTENT_FALLBACK";
        }
        if ("KEYWORD".equals(retrievalMode) || "HYBRID".equals(retrievalMode)) {
            return "KEYWORD";
        }
        return "STABLE_FALLBACK";
    }

    private boolean hasExactLocationAnchor(String question) {
        if (question == null || question.isBlank()) {
            return false;
        }
        return QUERY_SOURCE_LINE_ANCHOR_PATTERN.matcher(question).find()
                || QUERY_SOURCE_EVIDENCE_FIELD_PATTERN.matcher(question).find()
                || !CodeChunkRanker.methodAnchorFileHints(question).isEmpty();
    }

    private List<CodeChunkSearchItem> graphRelationEvidence(List<CodeChunkSearchItem> retrievedChunks) {
        if (retrievedChunks == null || retrievedChunks.isEmpty()) {
            return List.of();
        }
        return retrievedChunks.stream()
                .filter(chunk -> chunk != null
                        && chunk.getEvidenceReason() != null
                        && chunk.getEvidenceReason().contains("Graph relation:"))
                .toList();
    }

    private String retrievalFallbackReason(String retrievalMode,
                                           long matchedChunks,
                                           long embeddedChunks,
                                           List<String> roleIntents,
                                           List<String> fallbackRolePriority) {
        if ("NO_SCAN".equals(retrievalMode)) {
            return "NO_SCAN";
        }
        if ("NO_CONTEXT".equals(retrievalMode)) {
            return "NO_CONTEXT";
        }
        if (matchedChunks <= 0 && embeddedChunks <= 0) {
            return hasIntentFallbackPlan(roleIntents, fallbackRolePriority)
                    ? "NO_KEYWORD_NO_EMBEDDING_INTENT_ROLE_FALLBACK"
                    : "NO_KEYWORD_NO_EMBEDDING_DEFAULT_FALLBACK";
        }
        if (matchedChunks <= 0) {
            return "NO_KEYWORD_SEMANTIC_OR_STABLE_FALLBACK";
        }
        return roleIntents != null && !roleIntents.isEmpty()
                ? "KEYWORD_WITH_ROLE_HINTS"
                : "KEYWORD";
    }

    private boolean hasIntentFallbackPlan(List<String> roleIntents, List<String> fallbackRolePriority) {
        if (roleIntents != null && !roleIntents.isEmpty()) {
            return true;
        }
        if (fallbackRolePriority == null || fallbackRolePriority.isEmpty()) {
            return false;
        }
        return !"CONTROLLER".equals(fallbackRolePriority.get(0));
    }

    private int primaryEvidenceFileCount(List<CodeChunkSearchItem> retrievedChunks) {
        if (retrievedChunks == null || retrievedChunks.isEmpty()) {
            return 0;
        }
        return (int) retrievedChunks.stream()
                .filter(chunk -> chunk != null && "PRIMARY".equals(normalizedEvidenceRole(chunk.getContextRole())))
                .map(CodeChunkSearchItem::getFilePath)
                .map(this::normalizedFilePath)
                .filter(path -> path != null && !path.isBlank())
                .distinct()
                .count();
    }

    private String crossFileEvidenceStatus(boolean crossFileIntentPresent, int primaryFileCount) {
        if (!crossFileIntentPresent) {
            return "NOT_APPLICABLE";
        }
        if (primaryFileCount >= 2) {
            return "SATISFIED";
        }
        if (primaryFileCount == 1) {
            return "SINGLE_PRIMARY_FILE";
        }
        return "NO_PRIMARY_EVIDENCE";
    }

    private CodeQaRequest.EvidenceRef sanitizeSourceEvidenceRef(CodeQaRequest.EvidenceRef evidenceRef) {
        if (evidenceRef == null) {
            return null;
        }
        CodeQaRequest.EvidenceRef sanitized = new CodeQaRequest.EvidenceRef();
        sanitized.setCategory(truncateText(evidenceRef.getCategory(), 120));
        sanitized.setSource(truncateText(evidenceRef.getSource(), 120));
        sanitized.setTitle(truncateText(evidenceRef.getTitle(), 160));
        sanitized.setSummary(truncateText(evidenceRef.getSummary(), 600));
        sanitized.setFilePath(sanitizeEvidenceFilePathForResponse(evidenceRef.getFilePath()));
        sanitized.setLineNumber(truncateText(evidenceRef.getLineNumber(), 80));
        sanitized.setStartLine(sanitizeLine(evidenceRef.getStartLine()));
        sanitized.setEndLine(sanitizeLine(evidenceRef.getEndLine()));
        if (sanitized.getCategory() == null
                && sanitized.getSource() == null
                && sanitized.getTitle() == null
                && sanitized.getSummary() == null
                && sanitized.getFilePath() == null
                && sanitized.getLineNumber() == null
                && sanitized.getStartLine() == null
                && sanitized.getEndLine() == null) {
            return null;
        }
        return sanitized;
    }

    private String sanitizeEvidenceFilePathForResponse(String filePath) {
        String value = truncateText(filePath, 300);
        if (value == null || value.isBlank()) {
            return null;
        }
        if (!isLocalAbsolutePath(value)) {
            return value;
        }
        String relative = repositoryRelativePathFromLocalAbsolute(value);
        return relative == null || relative.isBlank() ? "[local-path-redacted]" : relative;
    }

    private boolean isLocalAbsolutePath(String value) {
        String trimmed = value == null ? "" : value.trim().replace('\\', '/');
        return trimmed.startsWith("/")
                || trimmed.startsWith("~/")
                || trimmed.matches("(?i)^[a-z]:/.*");
    }

    private String repositoryRelativePathFromLocalAbsolute(String filePath) {
        String normalized = normalizeEvidencePath(filePath);
        if (normalized == null || normalized.isBlank()) {
            return null;
        }
        List<String> segments = Arrays.stream(normalized.split("/"))
                .filter(segment -> segment != null && !segment.isBlank())
                .toList();
        String strongRootPath = relativePathFromKnownRoot(segments, HOSTED_SOURCE_STRONG_ROOT_SEGMENTS);
        if (strongRootPath != null) {
            return strongRootPath;
        }
        String appRootPath = relativePathFromKnownRoot(segments, HOSTED_SOURCE_APP_ROOT_SEGMENTS);
        if (appRootPath != null) {
            return appRootPath;
        }
        return relativePathFromKnownRoot(segments, HOSTED_SOURCE_GENERIC_ROOT_SEGMENTS);
    }

    private String relativePathFromKnownRoot(List<String> segments, Set<String> rootNames) {
        if (segments == null || segments.isEmpty() || rootNames == null || rootNames.isEmpty()) {
            return null;
        }
        for (int i = 0; i < segments.size(); i++) {
            String segment = segments.get(i);
            if (!rootNames.contains(segment)) {
                continue;
            }
            String candidate = String.join("/", segments.subList(i, segments.size()));
            if (HOSTED_SOURCE_FILE_CANDIDATE_PATTERN.matcher(candidate).matches()) {
                return candidate;
            }
        }
        return null;
    }

    private String sourceEvidenceMatchType(CodeQaRequest.EvidenceRef evidenceRef, List<CodeChunkSearchItem> retrievedChunks) {
        if (evidenceRef == null || evidenceRef.getFilePath() == null || retrievedChunks == null || retrievedChunks.isEmpty()) {
            return "NONE";
        }
        LineRange sourceLineRange = sourceLineRange(evidenceRef);
        List<CodeChunkSearchItem> matchedChunks = new ArrayList<>();
        List<CodeChunkSearchItem> exactMatchedChunks = new ArrayList<>();
        for (CodeChunkSearchItem chunk : retrievedChunks) {
            if (chunk == null || !sameEvidencePath(evidenceRef.getFilePath(), chunk.getFilePath())) {
                continue;
            }
            matchedChunks.add(chunk);
            if (exactEvidencePath(evidenceRef.getFilePath(), chunk.getFilePath())) {
                exactMatchedChunks.add(chunk);
            }
        }
        if (matchedChunks.isEmpty()) {
            return "NONE";
        }
        List<CodeChunkSearchItem> sourceMatchedChunks = exactMatchedChunks.isEmpty() ? matchedChunks : exactMatchedChunks;
        if (exactMatchedChunks.isEmpty()
                && hasAmbiguousNonExactEvidencePath(evidenceRef.getFilePath(), matchedPaths(matchedChunks))) {
            return "NONE";
        }
        for (CodeChunkSearchItem chunk : sourceMatchedChunks) {
            if (sourceLineRange != null && lineRangeOverlaps(sourceLineRange, chunk.getStartLine(), chunk.getEndLine())) {
                return "REPORT_LINE_ANCHOR";
            }
        }
        return "REPORT_FILE_ANCHOR";
    }

    private boolean sameEvidencePath(String evidencePath, String chunkPath) {
        String left = normalizeEvidencePath(evidencePath);
        String right = normalizeEvidencePath(chunkPath);
        if (left == null || right == null) {
            return false;
        }
        return left.equals(right) || left.endsWith("/" + right) || right.endsWith("/" + left);
    }

    private boolean exactEvidencePath(String evidencePath, String chunkPath) {
        String left = normalizeEvidencePath(evidencePath);
        String right = normalizeEvidencePath(chunkPath);
        return left != null && left.equals(right);
    }

    private List<String> matchedPaths(List<CodeChunkSearchItem> matchedChunks) {
        if (matchedChunks == null || matchedChunks.isEmpty()) {
            return List.of();
        }
        List<String> paths = new ArrayList<>();
        for (CodeChunkSearchItem chunk : matchedChunks) {
            if (chunk != null) {
                paths.add(chunk.getFilePath());
            }
        }
        return paths;
    }

    private boolean hasAmbiguousNonExactEvidencePath(String evidencePath, List<String> matchedChunkPaths) {
        String evidence = normalizeEvidencePath(evidencePath);
        if (evidence == null || matchedChunkPaths == null || matchedChunkPaths.isEmpty()) {
            return false;
        }
        Set<String> distinctMatches = new LinkedHashSet<>();
        for (String chunkPath : matchedChunkPaths) {
            String normalizedChunkPath = normalizeEvidencePath(chunkPath);
            if (normalizedChunkPath == null) {
                continue;
            }
            if (evidence.equals(normalizedChunkPath)) {
                return false;
            }
            distinctMatches.add(normalizedChunkPath);
        }
        return distinctMatches.size() > 1;
    }

    private String normalizeEvidencePath(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim()
                .replace('\\', '/')
                .replace("`", "")
                .replace("\"", "")
                .replace("'", "");
        normalized = stripHostedSourceUrlPrefix(normalized)
                .replaceFirst("(?i)^[a-z][a-z0-9+.-]*://[^/]*/?", "")
                .replaceAll("/+", "/")
                .replaceFirst("(?i)[:#]L?\\d{1,7}(?::\\d{1,7})?(?:\\s*[-~]\\s*L?\\d{1,7}(?::\\d{1,7})?)?$", "")
                .replaceFirst("(?i)(\\.(?:" + CODE_QA_EVIDENCE_PATH_EXTENSION_PATTERN + "))(?:[?#].*)$", "$1");
        while (normalized.startsWith("./")) {
            normalized = normalized.substring(2);
        }
        while (normalized.startsWith("/")) {
            normalized = normalized.substring(1);
        }
        return normalized.isBlank() ? null : normalized;
    }

    private String stripHostedSourceUrlPrefix(String value) {
        Matcher matcher = HOSTED_SOURCE_URL_PATTERN.matcher(value);
        if (!matcher.matches()) {
            return value;
        }
        String host = matcher.group(1).toLowerCase(Locale.ROOT);
        if (!isHostedSourceHost(host)) {
            return value;
        }
        String path = matcher.group(2)
                .replace('\\', '/')
                .replaceAll("^/+", "");
        String sourcePath = hostedSourcePathFromRoot(path);
        return sourcePath == null || sourcePath.isBlank() ? path : sourcePath;
    }

    private boolean isHostedSourceHost(String host) {
        return "github.com".equals(host)
                || "www.github.com".equals(host)
                || "raw.githubusercontent.com".equals(host)
                || "gitlab.com".equals(host)
                || "www.gitlab.com".equals(host);
    }

    private String hostedSourcePathFromRoot(String path) {
        List<String> segments = Arrays.stream(path.split("/"))
                .filter(segment -> segment != null && !segment.isBlank())
                .toList();
        if (segments.isEmpty()) {
            return null;
        }

        int markerIndex = hostedSourceMarkerIndex(segments);
        int branchStart = markerIndex >= 0 ? markerIndex + 1 : Math.min(2, segments.size());
        String strongRootPath = sourcePathFromRootSegment(segments, branchStart + 1, HOSTED_SOURCE_STRONG_ROOT_SEGMENTS, true);
        if (strongRootPath != null) {
            return strongRootPath;
        }

        int appRootSearchStart = markerIndex >= 0 ? markerIndex + 2 : Math.min(3, segments.size());
        String appRootPath = sourcePathFromRootSegment(segments, appRootSearchStart, HOSTED_SOURCE_APP_ROOT_SEGMENTS, false);
        if (appRootPath != null) {
            return appRootPath;
        }

        return sourcePathFromRootSegment(segments, branchStart + 1, HOSTED_SOURCE_GENERIC_ROOT_SEGMENTS, true);
    }

    private int hostedSourceMarkerIndex(List<String> segments) {
        for (int index = 0; index < segments.size(); index++) {
            String segment = segments.get(index);
            if ("blob".equalsIgnoreCase(segment)
                    || "raw".equalsIgnoreCase(segment)
                    || "tree".equalsIgnoreCase(segment)) {
                return index;
            }
        }
        return -1;
    }

    private String sourcePathFromRootSegment(
            List<String> segments,
            int searchStart,
            Set<String> rootSegments,
            boolean scanFromEnd) {
        if (segments.isEmpty() || searchStart >= segments.size()) {
            return null;
        }
        if (scanFromEnd) {
            for (int index = segments.size() - 1; index >= Math.max(0, searchStart); index--) {
                String candidate = sourcePathCandidate(segments, index, rootSegments);
                if (candidate != null) {
                    return candidate;
                }
            }
            return null;
        }
        for (int index = Math.max(0, searchStart); index < segments.size(); index++) {
            String candidate = sourcePathCandidate(segments, index, rootSegments);
            if (candidate != null) {
                return candidate;
            }
        }
        return null;
    }

    private String sourcePathCandidate(List<String> segments, int index, Set<String> rootSegments) {
        String segment = segments.get(index);
        if (!rootSegments.contains(segment.toLowerCase(Locale.ROOT))) {
            return null;
        }
        String candidate = String.join("/", segments.subList(index, segments.size()));
        return HOSTED_SOURCE_FILE_CANDIDATE_PATTERN.matcher(candidate).matches() ? candidate : null;
    }

    private boolean lineRangeOverlaps(LineRange lineRange, Integer startLine, Integer endLine) {
        if (lineRange == null) {
            return false;
        }
        int start = startLine == null || startLine <= 0 ? lineRange.start() : startLine;
        int end = endLine == null || endLine < start ? start : endLine;
        return lineRange.start() <= end && lineRange.end() >= start;
    }

    private LineRange sourceLineRange(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        Matcher matcher = SOURCE_LINE_RANGE_PATTERN.matcher(value);
        if (!matcher.find()) {
            return null;
        }
        try {
            int start = Integer.parseInt(matcher.group(1));
            if (start <= 0) {
                return null;
            }
            int end = start;
            if (matcher.group(2) != null) {
                end = Integer.parseInt(matcher.group(2));
                if (end < start) {
                    end = start;
                }
            }
            return new LineRange(start, end);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private LineRange sourceLineRange(CodeQaRequest.EvidenceRef evidenceRef) {
        if (evidenceRef == null) {
            return null;
        }
        LineRange lineNumberRange = sourceLineRange(evidenceRef.getLineNumber());
        if (lineNumberRange != null) {
            return lineNumberRange;
        }
        Integer startLine = sanitizeLine(evidenceRef.getStartLine());
        if (startLine == null) {
            return null;
        }
        Integer endLine = sanitizeLine(evidenceRef.getEndLine());
        if (endLine == null || endLine < startLine) {
            endLine = startLine;
        }
        return new LineRange(startLine, endLine);
    }

    private String sourceLineLabel(CodeQaRequest.EvidenceRef evidenceRef) {
        if (evidenceRef == null) {
            return null;
        }
        String lineNumber = truncateText(evidenceRef.getLineNumber(), 80);
        if (sourceLineRange(lineNumber) != null) {
            return lineNumber;
        }
        LineRange lineRange = sourceLineRange(evidenceRef);
        if (lineRange == null) {
            return null;
        }
        return lineRange.start() == lineRange.end()
                ? String.valueOf(lineRange.start())
                : lineRange.start() + "-" + lineRange.end();
    }

    private Integer sanitizeLine(Integer value) {
        return value == null || value <= 0 ? null : value;
    }

    private String truncateText(String value, int maxLength) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.replaceAll("[\\p{Cntrl}&&[^\r\n\t]]", "").trim();
        if (normalized.isEmpty()) {
            return null;
        }
        return normalized.length() > maxLength ? normalized.substring(0, maxLength) : normalized;
    }

    private CitationEnforcementResult enforceAnswerCitations(LlmConfig llmConfig,
                                                             String question,
                                                             String answer,
                                                             List<CodeChunkSearchItem> retrievedChunks,
                                                             List<Map<String, String>> originalMessages) {
        List<CodeChunkSearchItem> safeChunks = retrievedChunks == null ? List.of() : retrievedChunks;
        Set<String> directLabels = citedLabels(answer);
        if (hasVerifiedClaimLevelCitations(answer, safeChunks, directLabels)) {
            return new CitationEnforcementResult(answer, directLabels, CITATION_DIRECT_VERIFIED,
                    CITATION_REASON_DIRECT_VERIFIED,
                    "LLM 首次回答已逐条引用当前检索证据。");
        }
        if (safeChunks.isEmpty()) {
            return new CitationEnforcementResult(answer, Set.of(), CITATION_NOT_APPLICABLE,
                    CITATION_REASON_NO_EVIDENCE,
                    "当前没有可引用的检索证据。");
        }
        try {
            String corrected = llmClient.chat(llmConfig, citationRetryMessages(question, answer, safeChunks, originalMessages));
            String retryAnswer = corrected == null || corrected.isBlank() ? answer : corrected;
            Set<String> retryLabels = citedLabels(retryAnswer);
            if (hasVerifiedClaimLevelCitations(retryAnswer, safeChunks, retryLabels)) {
                return new CitationEnforcementResult(retryAnswer, retryLabels, CITATION_RETRY_VERIFIED,
                        CITATION_REASON_RETRY_VERIFIED,
                        "首次回答缺少逐条有效引用，已通过一次引用修正重试获得可验证回答。");
            }
            CitationEnforcementFailure failure = citationEnforcementFailure(retryAnswer, safeChunks, retryLabels);
            return new CitationEnforcementResult(retryAnswer, retryLabels, CITATION_RETRY_FAILED,
                    failure.reason(), failure.note());
        } catch (Exception e) {
            log.warn("代码问答引用修正重试失败: {}", e.getMessage());
            return new CitationEnforcementResult(answer, directLabels, CITATION_RETRY_FAILED,
                    CITATION_REASON_RETRY_CALL_FAILED,
                    "引用修正重试调用失败，请人工复核回答引用。");
        }
    }

    private boolean hasVerifiedClaimLevelCitations(String answer,
                                                   List<CodeChunkSearchItem> chunks,
                                                   Set<String> citedLabels) {
        if (!"VERIFIED".equals(groundingStatus(chunks, citedLabels))) {
            return false;
        }
        CodeQaClaimCitationCoverage claimCoverage = claimCitationCoverage(answer, chunks);
        if (!"READY".equals(claimCoverage.getStatus())) {
            return false;
        }
        CodeQaClaimCitationCoverage.ClaimRoleDistribution roleDistribution = claimCoverage.getRoleDistribution();
        if (roleDistribution == null || intValue(roleDistribution.getRequiredClaimCount()) == 0) {
            return false;
        }
        return intValue(roleDistribution.getRequiredContextOnlyClaimCount()) == 0
                && intValue(roleDistribution.getRequiredUnknownOnlyClaimCount()) == 0
                && intValue(roleDistribution.getRequiredPrimaryBoundClaimCount()) == intValue(roleDistribution.getRequiredClaimCount());
    }

    private CitationEnforcementFailure citationEnforcementFailure(String answer,
                                                                  List<CodeChunkSearchItem> chunks,
                                                                  Set<String> citedLabels) {
        String grounding = groundingStatus(chunks, citedLabels);
        if ("NO_EVIDENCE".equals(grounding)) {
            return new CitationEnforcementFailure(CITATION_REASON_NO_EVIDENCE,
                    "引用修正重试后仍没有可引用证据，请先重新生成代码切片或检索证据。");
        }
        CodeQaClaimCitationCoverage claimCoverage = claimCitationCoverage(answer, chunks);
        if ("BLOCKED".equals(claimCoverage.getStatus())) {
            return new CitationEnforcementFailure(CITATION_REASON_INVALID_LABEL,
                    "引用修正重试后仍包含不存在或无效的证据标签，请人工复核回答引用。");
        }
        CodeQaClaimCitationCoverage.ClaimRoleDistribution roleDistribution = claimCoverage.getRoleDistribution();
        if (roleDistribution == null || intValue(roleDistribution.getRequiredClaimCount()) == 0) {
            return new CitationEnforcementFailure(CITATION_REASON_NO_AUDITABLE_CLAIM,
                    "引用修正重试后没有形成可审计的具体代码事实 claim，请人工复核回答。");
        }
        if (intValue(roleDistribution.getRequiredContextOnlyClaimCount()) > 0) {
            return new CitationEnforcementFailure(CITATION_REASON_CONTEXT_ONLY_CLAIM,
                    "引用修正重试后仍有具体代码事实只绑定 ADJACENT_CONTEXT，未绑定 PRIMARY 证据，请人工复核回答引用。");
        }
        if (intValue(roleDistribution.getRequiredUnknownOnlyClaimCount()) > 0) {
            return new CitationEnforcementFailure(CITATION_REASON_UNKNOWN_ONLY_CLAIM,
                    "引用修正重试后仍有具体代码事实只绑定 UNKNOWN 证据，未绑定 PRIMARY 证据，请人工复核回答引用。");
        }
        if ("REVIEW".equals(claimCoverage.getStatus())) {
            return new CitationEnforcementFailure(CITATION_REASON_UNCITED_REQUIRED_CLAIM,
                    "引用修正重试后仍有具体代码事实缺少逐条有效引用，请人工复核回答引用。");
        }
        if (!"VERIFIED".equals(grounding)) {
            if ("UNVERIFIED".equals(grounding)) {
                return new CitationEnforcementFailure(CITATION_REASON_NO_VALID_CITATION_LABEL,
                        "引用修正重试后仍缺少有效证据标签，请人工复核回答引用。");
            }
            return new CitationEnforcementFailure(CITATION_REASON_NO_PRIMARY_CITATION,
                    "引用修正重试后仍未引用有效 PRIMARY 证据，请人工复核回答引用。");
        }
        return new CitationEnforcementFailure(CITATION_REASON_PRIMARY_BOUND_INCOMPLETE,
                "引用修正重试后仍未形成完整 PRIMARY-bound 可验证引用，请人工复核回答引用。");
    }

    private int intValue(Integer value) {
        return value == null ? 0 : value;
    }

    private List<Map<String, String>> citationRetryMessages(String question,
                                                            String originalAnswer,
                                                            List<CodeChunkSearchItem> retrievedChunks,
                                                            List<Map<String, String>> originalMessages) {
        String availableEvidence = citationRetryEvidenceList(retrievedChunks).toString();
        String primaryLabels = retrievedChunks.stream()
                .filter(chunk -> chunk != null && "PRIMARY".equals(chunk.getContextRole()))
                .map(CodeChunkSearchItem::getSourceLabel)
                .filter(label -> label != null && !label.isBlank())
                .toList()
                .toString();
        String correctionPrompt = "请重写上一条回答，必须满足：\n"
                + "1. 所有具体代码事实、文件、函数、流程和风险判断必须引用可用证据标签。\n"
                + "2. 可用证据标签及角色：" + availableEvidence + "。\n"
                + "3. 每条需要证据的具体代码事实必须至少引用一个 PRIMARY 标签：" + primaryLabels + "。\n"
                + "4. ADJACENT_CONTEXT 只能作为补充引用，不能作为具体代码事实的唯一引用。\n"
                + "5. 不要使用不存在的标签；如果 PRIMARY 证据不足，请明确说明证据不足，不要用 context 冒充主证据。\n"
                + "6. 引用标签必须使用成对括号，例如 [C1] 或 【C1】；不要输出 [C1】、【C1] 这类混用括号。\n"
                + "7. 保持回答简洁，不要编造上下文之外的信息。\n\n"
                + "用户问题：\n" + (question == null ? "" : question) + "\n\n"
                + "需要修正的上一条回答：\n" + (originalAnswer == null ? "" : originalAnswer);
        List<Map<String, String>> messages = new ArrayList<>();
        if (originalMessages != null && !originalMessages.isEmpty()) {
            messages.add(originalMessages.get(0));
        }
        messages.add(Map.of("role", "user", "content", correctionPrompt));
        return messages;
    }

    private List<String> citationRetryEvidenceList(List<CodeChunkSearchItem> retrievedChunks) {
        if (retrievedChunks == null || retrievedChunks.isEmpty()) {
            return List.of();
        }
        return retrievedChunks.stream()
                .filter(chunk -> chunk != null
                        && chunk.getSourceLabel() != null
                        && !chunk.getSourceLabel().isBlank())
                .map(chunk -> {
                    String role = chunk.getContextRole() == null || chunk.getContextRole().isBlank()
                            ? "UNKNOWN"
                            : chunk.getContextRole();
                    String filePath = chunk.getFilePath() == null || chunk.getFilePath().isBlank()
                            ? "unknown file"
                            : chunk.getFilePath();
                    String reason = chunk.getEvidenceReason() == null || chunk.getEvidenceReason().isBlank()
                            ? ""
                            : " reason=" + chunk.getEvidenceReason();
                    return "[" + chunk.getSourceLabel() + "] role=" + role + " file=" + filePath + reason;
                })
                .toList();
    }

    private String fallbackCitedAnswer(String prefix, List<CodeChunkSearchItem> retrievedChunks) {
        List<CodeChunkSearchItem> fallbackEvidence = fallbackCitationEvidence(retrievedChunks);
        CodeChunkSearchItem firstEvidence = fallbackEvidence.isEmpty() ? null : fallbackEvidence.get(0);
        if (firstEvidence == null
                || firstEvidence.getSourceLabel() == null
                || firstEvidence.getSourceLabel().isBlank()) {
            return prefix;
        }
        String filePath = firstEvidence.getFilePath() == null ? "当前检索结果" : firstEvidence.getFilePath();
        String lineRange = firstEvidence.getStartLine() == null || firstEvidence.getEndLine() == null
                ? ""
                : " Lines " + firstEvidence.getStartLine() + "-" + firstEvidence.getEndLine();
        String labels = fallbackEvidence.stream()
                .map(CodeChunkSearchItem::getSourceLabel)
                .filter(label -> label != null && !label.isBlank())
                .limit(4)
                .map(label -> "[" + label + "]")
                .collect(Collectors.joining(" "));
        return prefix + "\n\n已检索到可用代码证据 " + labels + "，优先复核 "
                + filePath + lineRange + "。";
    }

    private Set<String> fallbackCitedLabels(List<CodeChunkSearchItem> retrievedChunks) {
        return fallbackCitationEvidence(retrievedChunks).stream()
                .map(CodeChunkSearchItem::getSourceLabel)
                .filter(label -> label != null && !label.isBlank())
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private List<CodeChunkSearchItem> fallbackCitationEvidence(List<CodeChunkSearchItem> retrievedChunks) {
        if (retrievedChunks == null || retrievedChunks.isEmpty()) {
            return List.of();
        }
        List<CodeChunkSearchItem> primaryEvidence = new ArrayList<>();
        for (CodeChunkSearchItem chunk : retrievedChunks) {
            if (chunk != null
                    && "PRIMARY".equals(chunk.getContextRole())
                    && chunk.getSourceLabel() != null
                    && !chunk.getSourceLabel().isBlank()) {
                primaryEvidence.add(chunk);
            }
        }
        if (!primaryEvidence.isEmpty()) {
            return primaryEvidence;
        }
        for (CodeChunkSearchItem chunk : retrievedChunks) {
            if (chunk != null && chunk.getSourceLabel() != null && !chunk.getSourceLabel().isBlank()) {
                return List.of(chunk);
            }
        }
        return List.of();
    }

    private String citationStatus(List<CodeChunkSearchItem> chunks, Set<String> citedLabels) {
        if (chunks == null || chunks.isEmpty()) {
            return CITATION_NOT_APPLICABLE;
        }
        return "VERIFIED".equals(groundingStatus(chunks, citedLabels)) ? CITATION_DIRECT_VERIFIED : CITATION_RETRY_FAILED;
    }

    private String citationNote(List<CodeChunkSearchItem> chunks, Set<String> citedLabels) {
        if (chunks == null || chunks.isEmpty()) {
            return "当前没有可引用的检索证据。";
        }
        return "VERIFIED".equals(groundingStatus(chunks, citedLabels))
                ? "回答已显式引用当前检索证据。"
                : "回答未形成完整可验证引用，请人工复核。";
    }

    private Set<String> citedLabels(String answer) {
        if (answer == null || answer.isBlank()) {
            return Set.of();
        }
        String auditableText = auditableAnswerText(answer);
        Matcher matcher = ANSWER_CITATION_PATTERN.matcher(auditableText);
        Set<String> labels = new LinkedHashSet<>();
        while (matcher.find()) {
            String labelNumber = matcher.group(1) == null ? matcher.group(2) : matcher.group(1);
            addCitationLabel(labels, labelNumber);
        }
        Matcher blockMatcher = ANSWER_CITATION_BLOCK_PATTERN.matcher(auditableText);
        while (blockMatcher.find()) {
            addCitationBlockLabels(labels, blockMatcher.group());
        }
        return labels;
    }

    private void addCitationBlockLabels(Set<String> labels, String citationBlock) {
        if (labels == null || citationBlock == null || citationBlock.isBlank()) {
            return;
        }
        List<int[]> rangeSpans = new ArrayList<>();
        Matcher rangeMatcher = ANSWER_CITATION_RANGE_PATTERN.matcher(citationBlock);
        while (rangeMatcher.find()) {
            rangeSpans.add(new int[]{rangeMatcher.start(), rangeMatcher.end()});
            addCitationRangeLabels(labels, rangeMatcher.group(1), rangeMatcher.group(2));
        }
        Matcher tokenMatcher = ANSWER_CITATION_TOKEN_PATTERN.matcher(citationBlock);
        while (tokenMatcher.find()) {
            if (insideAnySpan(tokenMatcher.start(), tokenMatcher.end(), rangeSpans)) {
                continue;
            }
            addCitationLabel(labels, tokenMatcher.group(1));
        }
    }

    private void addCitationLabel(Set<String> labels, String labelNumberText) {
        if (labels == null || labelNumberText == null || labelNumberText.isBlank()) {
            return;
        }
        try {
            int labelNumber = Integer.parseInt(labelNumberText);
            if (labelNumber <= 0) {
                return;
            }
            labels.add("C" + labelNumber);
        } catch (NumberFormatException ignored) {
            // Ignore malformed citation labels instead of creating unverifiable evidence ids.
        }
    }

    private boolean insideAnySpan(int start, int end, List<int[]> spans) {
        if (spans == null || spans.isEmpty()) {
            return false;
        }
        for (int[] span : spans) {
            if (span != null && span.length == 2 && start >= span[0] && end <= span[1]) {
                return true;
            }
        }
        return false;
    }

    private void addCitationRangeLabels(Set<String> labels, String startText, String endText) {
        if (labels == null || startText == null || endText == null) {
            return;
        }
        try {
            int start = Integer.parseInt(startText);
            int end = Integer.parseInt(endText);
            if (start <= 0 || end < start || end - start + 1 > ANSWER_CITATION_MAX_RANGE_SIZE) {
                return;
            }
            for (int i = start; i <= end; i++) {
                labels.add("C" + i);
            }
        } catch (NumberFormatException ignored) {
            // Ignore malformed citation ranges instead of turning model text into fake evidence.
        }
    }

    private CodeQaClaimCitationCoverage claimCitationCoverage(String answer, List<CodeChunkSearchItem> chunks) {
        boolean operationalFallbackAnswer = isOperationalFallbackAnswer(answer);
        List<String> claimTexts = answerClaims(answer);
        Set<String> availableLabels = availableCitationLabels(chunks);
        Map<String, String> labelFilePaths = citationLabelFilePaths(chunks);
        Map<String, String> labelContextRoles = citationLabelContextRoles(chunks);
        List<CodeQaClaimCitationCoverage.ClaimCitation> claims = new ArrayList<>();
        Set<String> validCitationFiles = new LinkedHashSet<>();
        Set<String> requiredClaimCitationFiles = new LinkedHashSet<>();
        Set<String> primaryClaimCitationFiles = new LinkedHashSet<>();
        Set<String> contextClaimCitationFiles = new LinkedHashSet<>();
        Set<String> unknownClaimCitationFiles = new LinkedHashSet<>();
        Map<String, ClaimRoleAccumulator> roleAccumulators = new LinkedHashMap<>();
        roleAccumulators.put("PRIMARY", new ClaimRoleAccumulator());
        roleAccumulators.put("ADJACENT_CONTEXT", new ClaimRoleAccumulator());
        roleAccumulators.put("UNKNOWN", new ClaimRoleAccumulator());
        Map<String, ClaimFileAccumulator> fileAccumulators = new LinkedHashMap<>();
        int totalClaims = 0;
        int requiredClaims = 0;
        int citedRequiredClaims = 0;
        int uncitedRequiredClaims = 0;
        int invalidCitationClaims = 0;
        int requiredPrimaryBoundClaims = 0;
        int requiredContextOnlyClaims = 0;
        int requiredUnknownOnlyClaims = 0;
        int invalidRequiredClaims = 0;

        for (String claimText : claimTexts) {
            Set<String> sourceLabels = citedLabels(claimText);
            boolean required = claimRequiresCitation(claimText, !sourceLabels.isEmpty(), operationalFallbackAnswer);
            if (!required && sourceLabels.isEmpty()) {
                continue;
            }

            totalClaims++;
            List<String> sortedLabels = sortedLabels(sourceLabels);
            List<String> validLabels = sortedLabels(sourceLabels.stream()
                    .filter(availableLabels::contains)
                    .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new)));
            List<String> invalidLabels = sortedLabels(sourceLabels.stream()
                    .filter(label -> !availableLabels.contains(label))
                    .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new)));
            List<String> validFiles = citationFiles(validLabels, labelFilePaths);
            List<String> validRoles = citationRoles(validLabels, labelContextRoles);
            List<String> primaryFiles = citationFilesByRole(validLabels, labelFilePaths, labelContextRoles, "PRIMARY");
            List<String> contextFiles = citationFilesByRole(validLabels, labelFilePaths, labelContextRoles, "ADJACENT_CONTEXT");
            List<String> unknownFiles = citationFilesByRole(validLabels, labelFilePaths, labelContextRoles, "UNKNOWN");
            validCitationFiles.addAll(validFiles);

            if (required) {
                requiredClaims++;
            }
            String status;
            if (!invalidLabels.isEmpty()) {
                status = "INVALID";
                invalidCitationClaims++;
                if (required) {
                    invalidRequiredClaims++;
                }
            } else if (!required) {
                status = "OPTIONAL";
            } else if (validLabels.isEmpty()) {
                status = "UNCITED";
                uncitedRequiredClaims++;
            } else {
                status = "CITED";
                citedRequiredClaims++;
                requiredClaimCitationFiles.addAll(validFiles);
                primaryClaimCitationFiles.addAll(primaryFiles);
                contextClaimCitationFiles.addAll(contextFiles);
                unknownClaimCitationFiles.addAll(unknownFiles);
                if (!primaryFiles.isEmpty()) {
                    requiredPrimaryBoundClaims++;
                } else if (!contextFiles.isEmpty()) {
                    requiredContextOnlyClaims++;
                } else {
                    requiredUnknownOnlyClaims++;
                }
            }
            recordClaimRoleDistribution(
                    roleAccumulators,
                    fileAccumulators,
                    required,
                    "CITED".equals(status),
                    validLabels,
                    labelFilePaths,
                    labelContextRoles
            );

            if (claims.size() < CLAIM_AUDIT_MAX_CLAIMS) {
                claims.add(CodeQaClaimCitationCoverage.ClaimCitation.builder()
                        .claimId("Q" + totalClaims)
                        .claimTextPreview(truncateText(claimText, CLAIM_AUDIT_PREVIEW_LENGTH))
                        .required(required)
                        .sourceLabels(sortedLabels)
                        .validSourceLabels(validLabels)
                        .invalidSourceLabels(invalidLabels)
                        .validSourceFiles(validFiles)
                        .validSourceRoles(validRoles)
                        .primarySourceFiles(primaryFiles)
                        .contextSourceFiles(contextFiles)
                        .status(status)
                        .build());
            }
        }

        int claimCoveragePercent = requiredClaims == 0 ? 100 : Math.round((citedRequiredClaims * 100.0f) / requiredClaims);
        String status;
        if (invalidCitationClaims > 0) {
            status = "BLOCKED";
        } else if (uncitedRequiredClaims > 0) {
            status = "REVIEW";
        } else {
            status = "READY";
        }
        ClaimCitationReadiness readiness = claimCitationReadiness(
                status,
                requiredClaims,
                citedRequiredClaims,
                uncitedRequiredClaims,
                invalidCitationClaims,
                requiredPrimaryBoundClaims,
                requiredContextOnlyClaims,
                requiredUnknownOnlyClaims,
                invalidRequiredClaims,
                validCitationFiles,
                requiredClaimCitationFiles,
                primaryClaimCitationFiles);

        return CodeQaClaimCitationCoverage.builder()
                .totalClaimCount(totalClaims)
                .requiredClaimCount(requiredClaims)
                .citedRequiredClaimCount(citedRequiredClaims)
                .uncitedRequiredClaimCount(uncitedRequiredClaims)
                .invalidCitationClaimCount(invalidCitationClaims)
                .claimCoveragePercent(claimCoveragePercent)
                .validCitationFileCount(validCitationFiles.size())
                .requiredClaimCitationFileCount(requiredClaimCitationFiles.size())
                .status(status)
                .readyForRepair(readiness.readyForRepair())
                .readinessReason(readiness.reason())
                .readinessNote(readiness.note())
                .validCitationFiles(sortedLabels(validCitationFiles))
                .requiredClaimCitationFiles(sortedLabels(requiredClaimCitationFiles))
                .roleDistribution(claimRoleDistribution(
                        totalClaims,
                        requiredClaims,
                        uncitedRequiredClaims,
                        invalidCitationClaims,
                        requiredPrimaryBoundClaims,
                        requiredContextOnlyClaims,
                        requiredUnknownOnlyClaims,
                        invalidRequiredClaims,
                        validCitationFiles,
                        requiredClaimCitationFiles,
                        primaryClaimCitationFiles,
                        contextClaimCitationFiles,
                        unknownClaimCitationFiles,
                        roleAccumulators,
                        fileAccumulators
                ))
                .claims(claims)
                .build();
    }

    private ClaimCitationReadiness claimCitationReadiness(String status,
                                                          int requiredClaims,
                                                          int citedRequiredClaims,
                                                          int uncitedRequiredClaims,
                                                          int invalidCitationClaims,
                                                          int requiredPrimaryBoundClaims,
                                                          int requiredContextOnlyClaims,
                                                          int requiredUnknownOnlyClaims,
                                                          int invalidRequiredClaims,
                                                          Set<String> validCitationFiles,
                                                          Set<String> requiredClaimCitationFiles,
                                                          Set<String> primaryClaimCitationFiles) {
        if (invalidCitationClaims > 0 || invalidRequiredClaims > 0 || "BLOCKED".equals(status)) {
            return new ClaimCitationReadiness(false, CITATION_REASON_INVALID_LABEL,
                    "存在无效引用标签，不能作为修复候选依据。");
        }
        if (requiredClaims <= 0) {
            return new ClaimCitationReadiness(false, CITATION_REASON_NO_AUDITABLE_CLAIM,
                    "没有可审计的具体代码事实 claim，不能生成修复候选。");
        }
        if (uncitedRequiredClaims > 0 || citedRequiredClaims < requiredClaims || "REVIEW".equals(status)) {
            return new ClaimCitationReadiness(false, CITATION_REASON_UNCITED_REQUIRED_CLAIM,
                    "仍有必需代码事实 claim 未绑定有效引用。");
        }
        if (requiredContextOnlyClaims > 0) {
            return new ClaimCitationReadiness(false, CITATION_REASON_CONTEXT_ONLY_CLAIM,
                    "仍有必需代码事实 claim 只绑定 ADJACENT_CONTEXT，未绑定 PRIMARY 证据。");
        }
        if (requiredUnknownOnlyClaims > 0) {
            return new ClaimCitationReadiness(false, CITATION_REASON_UNKNOWN_ONLY_CLAIM,
                    "仍有必需代码事实 claim 只绑定 UNKNOWN 证据，未绑定 PRIMARY 证据。");
        }
        if (requiredPrimaryBoundClaims != requiredClaims
                || validCitationFiles == null || validCitationFiles.isEmpty()
                || requiredClaimCitationFiles == null || requiredClaimCitationFiles.isEmpty()
                || primaryClaimCitationFiles == null || primaryClaimCitationFiles.isEmpty()) {
            return new ClaimCitationReadiness(false, CITATION_REASON_PRIMARY_BOUND_INCOMPLETE,
                    "主张引用尚未形成完整 PRIMARY-bound 文件闭环。");
        }
        return new ClaimCitationReadiness(true, "PRIMARY_BOUND_READY",
                "所有必需代码事实 claim 都已绑定 PRIMARY 证据，可进入修复候选复核。");
    }

    private List<String> answerClaims(String answer) {
        if (answer == null || answer.isBlank()) {
            return List.of();
        }
        return CLAIM_SPLIT_PATTERN.splitAsStream(claimAuditText(answer))
                .map(this::normalizeClaimText)
                .filter(text -> !text.isBlank())
                .filter(text -> text.length() >= 6 || !citedLabels(text).isEmpty())
                .toList();
    }

    private String claimAuditText(String answer) {
        String auditableText = auditableAnswerText(answer);
        if (auditableText.isBlank() || auditableText.indexOf('|') < 0) {
            return auditableText;
        }
        String[] lines = auditableText.split("\\R", -1);
        StringBuilder builder = new StringBuilder(auditableText.length());
        for (int i = 0; i < lines.length; i++) {
            if (isMarkdownTableBlockStart(lines, i)) {
                i += 2;
                while (i < lines.length && isMarkdownTableRow(lines[i])) {
                    if (!isMarkdownTableSeparatorRow(lines[i])) {
                        appendMarkdownTableCells(builder, lines[i]);
                    }
                    i++;
                }
                i--;
                continue;
            }
            builder.append(lines[i]).append('\n');
        }
        return builder.toString();
    }

    private boolean isMarkdownTableBlockStart(String[] lines, int index) {
        return lines != null
                && index >= 0
                && index + 1 < lines.length
                && isMarkdownTableRow(lines[index])
                && isMarkdownTableSeparatorRow(lines[index + 1]);
    }

    private boolean isMarkdownTableRow(String line) {
        if (line == null || line.isBlank()) {
            return false;
        }
        int firstPipe = line.indexOf('|');
        int lastPipe = line.lastIndexOf('|');
        return firstPipe >= 0 && lastPipe > firstPipe;
    }

    private boolean isMarkdownTableSeparatorRow(String line) {
        if (!isMarkdownTableRow(line)) {
            return false;
        }
        boolean hasSeparatorCell = false;
        for (String cell : line.split("\\|", -1)) {
            String trimmed = cell.trim();
            if (trimmed.isBlank()) {
                continue;
            }
            if (!MARKDOWN_TABLE_SEPARATOR_CELL_PATTERN.matcher(trimmed).matches()) {
                return false;
            }
            hasSeparatorCell = true;
        }
        return hasSeparatorCell;
    }

    private void appendMarkdownTableCells(StringBuilder builder, String line) {
        if (builder == null || line == null) {
            return;
        }
        for (String cell : line.split("\\|", -1)) {
            String trimmed = cell.trim();
            if (trimmed.isBlank() || MARKDOWN_TABLE_SEPARATOR_CELL_PATTERN.matcher(trimmed).matches()) {
                continue;
            }
            builder.append(trimmed).append('\n');
        }
    }

    private String auditableAnswerText(String answer) {
        if (answer == null || answer.isBlank()) {
            return "";
        }
        String stripped = FENCED_CODE_BLOCK_PATTERN.matcher(answer).replaceAll("\n");
        stripped = HTML_COMMENT_PATTERN.matcher(stripped).replaceAll(" ");
        stripped = HTML_SCRIPT_STYLE_BLOCK_PATTERN.matcher(stripped).replaceAll(" ");
        stripped = HTML_DELETED_TEXT_BLOCK_PATTERN.matcher(stripped).replaceAll(" ");
        stripped = HTML_CODE_BLOCK_PATTERN.matcher(stripped).replaceAll(" ");
        stripped = HTML_TAG_PATTERN.matcher(stripped).replaceAll(" ");
        stripped = INLINE_CODE_PATTERN.matcher(stripped).replaceAll(" ");
        stripped = stripMarkdownLinkDestinations(stripped);
        stripped = stripBareUrls(stripped);
        stripped = decodeCitationBracketEntities(stripped);
        StringBuilder builder = new StringBuilder(stripped.length());
        for (String line : stripped.split("\\R", -1)) {
            if (isNonAuditableAnswerLine(line)) {
                builder.append('\n');
                continue;
            }
            builder.append(line).append('\n');
        }
        return builder.toString();
    }

    private String decodeCitationBracketEntities(String value) {
        if (value == null || value.isBlank() || value.indexOf('&') < 0) {
            return value == null ? "" : value;
        }
        String decoded = HTML_LEFT_CITATION_BRACKET_ENTITY_PATTERN.matcher(value).replaceAll("[");
        return HTML_RIGHT_CITATION_BRACKET_ENTITY_PATTERN.matcher(decoded).replaceAll("]");
    }

    private String stripBareUrls(String value) {
        if (value == null || value.isBlank()) {
            return value == null ? "" : value;
        }
        String stripped = BARE_URL_PATTERN.matcher(value).replaceAll(" ");
        stripped = COMMON_URI_PATTERN.matcher(stripped).replaceAll(" ");
        stripped = DOMAIN_URL_PATTERN.matcher(stripped).replaceAll(" ");
        return LOCAL_URL_PATTERN.matcher(stripped).replaceAll(" ");
    }

    private boolean isNonAuditableAnswerLine(String line) {
        if (line == null || line.isBlank()) {
            return false;
        }
        String auditableLine = stripMarkdownQuotePrefix(line);
        if (auditableLine.startsWith("    ") || auditableLine.startsWith("\t")) {
            return true;
        }
        return MARKDOWN_REFERENCE_DEFINITION_PATTERN.matcher(auditableLine).matches()
                || CITATION_FORMAT_EXAMPLE_LINE_PATTERN.matcher(auditableLine).matches()
                || STACK_TRACE_LINE_PATTERN.matcher(auditableLine).matches()
                || LOG_LINE_PATTERN.matcher(auditableLine).matches();
    }

    private String stripMarkdownLinkDestinations(String value) {
        if (value == null || value.isBlank() || value.indexOf(']') < 0 || value.indexOf('[') < 0) {
            return value == null ? "" : value;
        }
        StringBuilder builder = new StringBuilder(value.length());
        int index = 0;
        while (index < value.length()) {
            int openBracket = value.indexOf('[', index);
            if (openBracket < 0) {
                builder.append(value, index, value.length());
                break;
            }
            boolean image = openBracket > 0 && value.charAt(openBracket - 1) == '!';
            builder.append(value, index, image ? openBracket - 1 : openBracket);
            LinkSpan span = parseMarkdownLinkSpan(value, openBracket);
            if (span == null) {
                span = parseMarkdownReferenceLinkSpan(value, openBracket);
            }
            if (span == null) {
                builder.append(value.charAt(openBracket));
                index = openBracket + 1;
                continue;
            }
            if (!image) {
                builder.append('[').append(span.label()).append(']');
            } else {
                builder.append(' ');
            }
            index = span.endIndex();
        }
        return builder.toString();
    }

    private LinkSpan parseMarkdownLinkSpan(String value, int openBracket) {
        if (value == null || openBracket < 0 || openBracket >= value.length() || value.charAt(openBracket) != '[') {
            return null;
        }
        int closeBracket = findBalancedClosing(value, openBracket, '[', ']');
        if (closeBracket < 0 || closeBracket + 1 >= value.length() || value.charAt(closeBracket + 1) != '(') {
            return null;
        }
        int closeParen = findBalancedClosing(value, closeBracket + 1, '(', ')');
        if (closeParen < 0) {
            return null;
        }
        return new LinkSpan(value.substring(openBracket + 1, closeBracket), closeParen + 1);
    }

    private LinkSpan parseMarkdownReferenceLinkSpan(String value, int openBracket) {
        if (value == null || openBracket < 0 || openBracket >= value.length() || value.charAt(openBracket) != '[') {
            return null;
        }
        int closeBracket = findBalancedClosing(value, openBracket, '[', ']');
        if (closeBracket < 0 || closeBracket + 1 >= value.length() || value.charAt(closeBracket + 1) != '[') {
            return null;
        }
        int closeReference = findBalancedClosing(value, closeBracket + 1, '[', ']');
        if (closeReference < 0) {
            return null;
        }
        return new LinkSpan(value.substring(openBracket + 1, closeBracket), closeReference + 1);
    }

    private int findBalancedClosing(String value, int openIndex, char openChar, char closeChar) {
        int depth = 0;
        boolean escaped = false;
        for (int i = openIndex; i < value.length(); i++) {
            char current = value.charAt(i);
            if (current == '\r' || current == '\n') {
                return -1;
            }
            if (escaped) {
                escaped = false;
                continue;
            }
            if (current == '\\') {
                escaped = true;
                continue;
            }
            if (current == openChar) {
                depth++;
            } else if (current == closeChar) {
                depth--;
                if (depth == 0) {
                    return i;
                }
            }
        }
        return -1;
    }

    private record LinkSpan(String label, int endIndex) {
    }

    private String stripMarkdownQuotePrefix(String line) {
        String value = line;
        while (value != null && value.stripLeading().startsWith(">")) {
            value = value.stripLeading().substring(1).stripLeading();
        }
        return value == null ? "" : value;
    }

    private String normalizeClaimText(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replaceAll("^[\\s>*#\\-+•·]+", "")
                .replaceAll("^\\d+[.)、]\\s*", "")
                .trim();
    }

    private boolean claimRequiresCitation(String claimText, boolean hasCitationLabel, boolean operationalFallbackAnswer) {
        if (hasCitationLabel) {
            return true;
        }
        if (claimText == null || claimText.length() < 12) {
            return false;
        }
        if (operationalFallbackAnswer && isOperationalFallbackNoticeClaim(claimText)) {
            return false;
        }
        return CODE_FACT_PATTERN.matcher(claimText).find();
    }

    private boolean isOperationalFallbackAnswer(String answer) {
        if (answer == null || answer.isBlank()) {
            return false;
        }
        String normalized = normalizeClaimText(answer);
        return OPERATIONAL_FALLBACK_ANSWER_PREFIXES.stream().anyMatch(normalized::startsWith);
    }

    private boolean isOperationalFallbackNoticeClaim(String claimText) {
        String normalized = normalizeClaimText(claimText).replace('：', ':');
        return OPERATIONAL_FALLBACK_CLAIM_PREFIXES.stream().anyMatch(normalized::startsWith);
    }

    private Set<String> availableCitationLabels(List<CodeChunkSearchItem> chunks) {
        if (chunks == null || chunks.isEmpty()) {
            return Set.of();
        }
        Set<String> labels = new LinkedHashSet<>();
        for (CodeChunkSearchItem chunk : chunks) {
            if (chunk != null && chunk.getSourceLabel() != null && !chunk.getSourceLabel().isBlank()) {
                labels.add(chunk.getSourceLabel());
            }
        }
        return labels;
    }

    private Map<String, String> citationLabelFilePaths(List<CodeChunkSearchItem> chunks) {
        if (chunks == null || chunks.isEmpty()) {
            return Map.of();
        }
        Map<String, String> labels = new LinkedHashMap<>();
        for (CodeChunkSearchItem chunk : chunks) {
            if (chunk == null
                    || chunk.getSourceLabel() == null
                    || chunk.getSourceLabel().isBlank()
                    || chunk.getFilePath() == null
                    || chunk.getFilePath().isBlank()) {
                continue;
            }
            labels.putIfAbsent(chunk.getSourceLabel(), chunk.getFilePath());
        }
        return labels;
    }

    private Map<String, String> citationLabelContextRoles(List<CodeChunkSearchItem> chunks) {
        if (chunks == null || chunks.isEmpty()) {
            return Map.of();
        }
        Map<String, String> labels = new LinkedHashMap<>();
        for (CodeChunkSearchItem chunk : chunks) {
            if (chunk == null
                    || chunk.getSourceLabel() == null
                    || chunk.getSourceLabel().isBlank()) {
                continue;
            }
            labels.putIfAbsent(chunk.getSourceLabel(), normalizedEvidenceRole(chunk.getContextRole()));
        }
        return labels;
    }

    private List<String> citationFiles(Collection<String> labels, Map<String, String> labelFilePaths) {
        if (labels == null || labels.isEmpty() || labelFilePaths == null || labelFilePaths.isEmpty()) {
            return List.of();
        }
        Set<String> files = new LinkedHashSet<>();
        for (String label : labels) {
            String filePath = labelFilePaths.get(label);
            if (filePath != null && !filePath.isBlank()) {
                files.add(filePath);
            }
        }
        return sortedLabels(files);
    }

    private List<String> citationRoles(Collection<String> labels, Map<String, String> labelContextRoles) {
        if (labels == null || labels.isEmpty() || labelContextRoles == null || labelContextRoles.isEmpty()) {
            return List.of();
        }
        Set<String> roles = new LinkedHashSet<>();
        for (String label : labels) {
            roles.add(normalizedEvidenceRole(labelContextRoles.get(label)));
        }
        return sortedLabels(roles);
    }

    private List<String> citationFilesByRole(Collection<String> labels,
                                             Map<String, String> labelFilePaths,
                                             Map<String, String> labelContextRoles,
                                             String expectedRole) {
        if (labels == null || labels.isEmpty()
                || labelFilePaths == null || labelFilePaths.isEmpty()
                || labelContextRoles == null || labelContextRoles.isEmpty()
                || expectedRole == null || expectedRole.isBlank()) {
            return List.of();
        }
        Set<String> files = new LinkedHashSet<>();
        for (String label : labels) {
            String role = normalizedEvidenceRole(labelContextRoles.get(label));
            if (!expectedRole.equals(role)) {
                continue;
            }
            String filePath = normalizedFilePath(labelFilePaths.get(label));
            if (filePath != null) {
                files.add(filePath);
            }
        }
        return sortedLabels(files);
    }

    private void recordClaimRoleDistribution(Map<String, ClaimRoleAccumulator> roleAccumulators,
                                             Map<String, ClaimFileAccumulator> fileAccumulators,
                                             boolean required,
                                             boolean citedRequired,
                                             Collection<String> validLabels,
                                             Map<String, String> labelFilePaths,
                                             Map<String, String> labelContextRoles) {
        if (validLabels == null || validLabels.isEmpty()) {
            return;
        }
        Map<String, Set<String>> filesByRole = new LinkedHashMap<>();
        Map<String, Set<String>> rolesByFile = new LinkedHashMap<>();
        for (String label : validLabels) {
            String role = normalizedEvidenceRole(labelContextRoles.get(label));
            String filePath = normalizedFilePath(labelFilePaths.get(label));
            filesByRole.computeIfAbsent(role, ignored -> new LinkedHashSet<>());
            if (filePath != null) {
                filesByRole.get(role).add(filePath);
                rolesByFile.computeIfAbsent(filePath, ignored -> new LinkedHashSet<>()).add(role);
            }
        }
        for (Map.Entry<String, Set<String>> entry : filesByRole.entrySet()) {
            ClaimRoleAccumulator accumulator = roleAccumulators.computeIfAbsent(entry.getKey(), ignored -> new ClaimRoleAccumulator());
            accumulator.record(entry.getValue(), required && citedRequired);
        }
        for (Map.Entry<String, Set<String>> entry : rolesByFile.entrySet()) {
            ClaimFileAccumulator accumulator = fileAccumulators.computeIfAbsent(entry.getKey(), ClaimFileAccumulator::new);
            accumulator.record(entry.getValue(), required && citedRequired);
        }
    }

    private CodeQaClaimCitationCoverage.ClaimRoleDistribution claimRoleDistribution(
            int totalClaims,
            int requiredClaims,
            int uncitedRequiredClaims,
            int invalidCitationClaims,
            int requiredPrimaryBoundClaims,
            int requiredContextOnlyClaims,
            int requiredUnknownOnlyClaims,
            int invalidRequiredClaims,
            Set<String> validCitationFiles,
            Set<String> requiredClaimCitationFiles,
            Set<String> primaryClaimCitationFiles,
            Set<String> contextClaimCitationFiles,
            Set<String> unknownClaimCitationFiles,
            Map<String, ClaimRoleAccumulator> roleAccumulators,
            Map<String, ClaimFileAccumulator> fileAccumulators) {
        String status;
        if (requiredClaims == 0) {
            status = "NO_REQUIRED_CLAIMS";
        } else if (invalidCitationClaims > 0) {
            status = "BLOCKED_INVALID";
        } else if (uncitedRequiredClaims > 0) {
            status = "REVIEW_UNCITED";
        } else if (requiredUnknownOnlyClaims > 0) {
            status = "UNKNOWN_ROLE_PRESENT";
        } else if (requiredPrimaryBoundClaims == requiredClaims) {
            status = "PRIMARY_BOUND";
        } else if (requiredPrimaryBoundClaims > 0 && requiredContextOnlyClaims > 0) {
            status = "MIXED_CONTEXT";
        } else if (requiredContextOnlyClaims > 0) {
            status = "CONTEXT_ONLY";
        } else {
            status = "NO_REQUIRED_CLAIMS";
        }

        List<CodeQaClaimCitationCoverage.ClaimRoleStat> roleStats = roleAccumulators.entrySet().stream()
                .filter(entry -> entry.getValue().claimCount() > 0)
                .map(entry -> CodeQaClaimCitationCoverage.ClaimRoleStat.builder()
                        .role(entry.getKey())
                        .claimCount(entry.getValue().claimCount())
                        .requiredClaimCount(entry.getValue().requiredClaimCount())
                        .fileCount(entry.getValue().fileCount())
                        .requiredFileCount(entry.getValue().requiredFileCount())
                        .build())
                .toList();
        List<CodeQaClaimCitationCoverage.ClaimFileStat> fileStats = fileAccumulators.values().stream()
                .map(accumulator -> CodeQaClaimCitationCoverage.ClaimFileStat.builder()
                        .filePath(accumulator.filePath)
                        .primaryClaimCount(accumulator.primaryClaimCount)
                        .requiredPrimaryClaimCount(accumulator.requiredPrimaryClaimCount)
                        .contextClaimCount(accumulator.contextClaimCount)
                        .requiredContextClaimCount(accumulator.requiredContextClaimCount)
                        .unknownClaimCount(accumulator.unknownClaimCount)
                        .requiredUnknownClaimCount(accumulator.requiredUnknownClaimCount)
                        .requiredClaimCount(accumulator.requiredClaimCount)
                        .build())
                .toList();

        return CodeQaClaimCitationCoverage.ClaimRoleDistribution.builder()
                .status(status)
                .requiredClaimCount(requiredClaims)
                .requiredPrimaryBoundClaimCount(requiredPrimaryBoundClaims)
                .requiredContextOnlyClaimCount(requiredContextOnlyClaims)
                .requiredUnknownOnlyClaimCount(requiredUnknownOnlyClaims)
                .unbackedRequiredClaimCount(uncitedRequiredClaims)
                .invalidRequiredClaimCount(invalidRequiredClaims)
                .validCitationFileCount(validCitationFiles.size())
                .requiredClaimCitationFileCount(requiredClaimCitationFiles.size())
                .primaryFileCount(primaryClaimCitationFiles.size())
                .requiredPrimaryFileCount(primaryClaimCitationFiles.size())
                .contextFileCount(contextClaimCitationFiles.size())
                .requiredContextFileCount(contextClaimCitationFiles.size())
                .unknownFileCount(unknownClaimCitationFiles.size())
                .requiredUnknownFileCount(unknownClaimCitationFiles.size())
                .roles(roleStats)
                .files(fileStats)
                .build();
    }

    private List<String> sortedLabels(Collection<String> labels) {
        if (labels == null || labels.isEmpty()) {
            return List.of();
        }
        return labels.stream().sorted().toList();
    }

    private String groundingStatus(List<CodeChunkSearchItem> chunks, Set<String> citedLabels) {
        if (chunks == null || chunks.isEmpty()) {
            return "NO_EVIDENCE";
        }
        if (citedLabels == null || citedLabels.isEmpty()) {
            return "UNVERIFIED";
        }
        Set<String> availableLabels = new HashSet<>();
        for (CodeChunkSearchItem chunk : chunks) {
            if (chunk.getSourceLabel() != null && !chunk.getSourceLabel().isBlank()) {
                availableLabels.add(chunk.getSourceLabel());
            }
        }
        if (!availableLabels.containsAll(citedLabels)) {
            return "PARTIAL";
        }
        boolean citedPrimaryEvidence = chunks.stream().anyMatch(chunk ->
                chunk != null
                        && "PRIMARY".equals(chunk.getContextRole())
                        && chunk.getSourceLabel() != null
                        && citedLabels.contains(chunk.getSourceLabel())
        );
        return citedPrimaryEvidence ? "VERIFIED" : "PARTIAL";
    }

    private List<CodeQaCitation> toCitations(List<CodeChunkSearchItem> chunks, Set<String> citedLabels) {
        if (chunks == null || chunks.isEmpty()) {
            return List.of();
        }
        Set<String> safeCitedLabels = citedLabels == null ? Set.of() : citedLabels;
        return chunks.stream()
                .map(chunk -> CodeQaCitation.builder()
                        .citationId(chunk.getCitationId())
                        .sourceLabel(chunk.getSourceLabel())
                        .chunkId(chunk.getId())
                        .scanTaskId(chunk.getScanTaskId())
                        .filePath(chunk.getFilePath())
                        .startLine(chunk.getStartLine())
                        .endLine(chunk.getEndLine())
                        .evidenceType(chunk.getEvidenceType())
                        .evidenceReason(chunk.getEvidenceReason())
                        .relevanceScore(chunk.getRelevanceScore())
                        .contextRole(chunk.getContextRole())
                        .contextDistance(chunk.getContextDistance())
                        .citedByAnswer(safeCitedLabels.contains(chunk.getSourceLabel()))
                        .build())
                .toList();
    }

    private CodeQaCitationCoverage citationCoverage(List<CodeQaCitation> citations) {
        List<CodeQaCitation> safeCitations = citations == null ? List.of() : citations;
        int total = safeCitations.size();
        int cited = 0;
        int repairCandidates = 0;
        int primary = 0;
        int citedPrimary = 0;
        int context = 0;
        int citedContext = 0;
        Set<String> uniqueFiles = new LinkedHashSet<>();
        Set<String> citedFiles = new LinkedHashSet<>();
        Set<String> primaryFiles = new LinkedHashSet<>();
        Set<String> citedPrimaryFiles = new LinkedHashSet<>();
        Set<String> contextFiles = new LinkedHashSet<>();
        Set<String> citedContextFiles = new LinkedHashSet<>();
        Map<String, RoleCoverageAccumulator> roleAccumulators = new LinkedHashMap<>();
        roleAccumulators.put("PRIMARY", new RoleCoverageAccumulator());
        roleAccumulators.put("ADJACENT_CONTEXT", new RoleCoverageAccumulator());
        roleAccumulators.put("UNKNOWN", new RoleCoverageAccumulator());
        Map<String, FileCoverageAccumulator> fileAccumulators = new LinkedHashMap<>();
        for (CodeQaCitation citation : safeCitations) {
            if (citation == null) {
                continue;
            }
            boolean primaryEvidence = "PRIMARY".equals(citation.getContextRole());
            boolean contextEvidence = "ADJACENT_CONTEXT".equals(citation.getContextRole());
            String role = normalizedEvidenceRole(citation.getContextRole());
            boolean citedByAnswer = Boolean.TRUE.equals(citation.getCitedByAnswer());
            String filePath = normalizedFilePath(citation.getFilePath());
            RoleCoverageAccumulator roleAccumulator = roleAccumulators.computeIfAbsent(role, ignored -> new RoleCoverageAccumulator());
            roleAccumulator.record(filePath, citedByAnswer);
            if (filePath != null) {
                FileCoverageAccumulator fileAccumulator = fileAccumulators.computeIfAbsent(filePath, FileCoverageAccumulator::new);
                fileAccumulator.record(role, citedByAnswer);
            }
            if (filePath != null) {
                uniqueFiles.add(filePath);
            }
            if (primaryEvidence) {
                primary++;
                if (filePath != null) {
                    primaryFiles.add(filePath);
                }
                if (citedByAnswer) {
                    citedPrimary++;
                    if (filePath != null) {
                        citedPrimaryFiles.add(filePath);
                    }
                }
            } else if (contextEvidence) {
                context++;
                if (filePath != null) {
                    contextFiles.add(filePath);
                }
                if (citedByAnswer) {
                    citedContext++;
                    if (filePath != null) {
                        citedContextFiles.add(filePath);
                    }
                }
            }
            if (!citedByAnswer) {
                continue;
            }
            cited++;
            if (filePath != null) {
                citedFiles.add(filePath);
            }
            if (primaryEvidence
                    && citation.getScanTaskId() != null
                    && filePath != null
                    && citation.getSourceLabel() != null
                    && !citation.getSourceLabel().isBlank()) {
                repairCandidates++;
            }
        }
        int uncited = Math.max(total - cited, 0);
        int coveragePercent = total == 0 ? 0 : Math.round((cited * 100.0f) / total);
        int required = primary > 0 ? primary : total;
        int citedRequired = primary > 0 ? citedPrimary : cited;
        int requiredFiles = primary > 0 ? primaryFiles.size() : uniqueFiles.size();
        int citedRequiredFiles = primary > 0 ? citedPrimaryFiles.size() : citedFiles.size();
        int requiredCoveragePercent = required == 0 ? 0 : Math.round((citedRequired * 100.0f) / required);
        int uncitedPrimary = Math.max(primary - citedPrimary, 0);
        int uncitedContext = Math.max(context - citedContext, 0);
        int uncitedPrimaryFiles = (int) fileAccumulators.values().stream()
                .filter(accumulator -> accumulator.primaryEvidenceCount > accumulator.citedPrimaryEvidenceCount)
                .count();
        int uncitedContextFiles = (int) fileAccumulators.values().stream()
                .filter(accumulator -> accumulator.contextEvidenceCount > accumulator.citedContextEvidenceCount)
                .count();
        String coverageScope = primary > 0 ? "PRIMARY" : "ALL";
        String status;
        if (total == 0) {
            status = "NO_EVIDENCE";
        } else if (cited == 0) {
            status = "NONE";
        } else if (cited == total) {
            status = "FULL";
        } else if (required > 0
                && citedRequired >= required
                && (requiredFiles == 0 || citedRequiredFiles >= requiredFiles)) {
            status = "REQUIRED_FULL";
        } else {
            status = "PARTIAL";
        }
        CodeQaCitationCoverage.EvidenceRoleDistribution evidenceRoleDistribution = evidenceRoleDistribution(
                uniqueFiles,
                citedFiles,
                primaryFiles,
                citedPrimaryFiles,
                contextFiles,
                citedContextFiles,
                roleAccumulators,
                fileAccumulators
        );
        return CodeQaCitationCoverage.builder()
                .totalEvidenceCount(total)
                .citedEvidenceCount(cited)
                .uncitedCandidateCount(uncited)
                .repairCandidateCount(repairCandidates)
                .coveragePercent(coveragePercent)
                .uniqueEvidenceFileCount(uniqueFiles.size())
                .citedEvidenceFileCount(citedFiles.size())
                .primaryEvidenceCount(primary)
                .citedPrimaryEvidenceCount(citedPrimary)
                .uncitedPrimaryEvidenceCount(uncitedPrimary)
                .primaryEvidenceFileCount(primaryFiles.size())
                .citedPrimaryEvidenceFileCount(citedPrimaryFiles.size())
                .uncitedPrimaryEvidenceFileCount(uncitedPrimaryFiles)
                .contextEvidenceCount(context)
                .citedContextEvidenceCount(citedContext)
                .uncitedContextEvidenceCount(uncitedContext)
                .contextEvidenceFileCount(contextFiles.size())
                .citedContextEvidenceFileCount(citedContextFiles.size())
                .uncitedContextEvidenceFileCount(uncitedContextFiles)
                .requiredEvidenceCount(required)
                .citedRequiredEvidenceCount(citedRequired)
                .requiredEvidenceFileCount(requiredFiles)
                .citedRequiredEvidenceFileCount(citedRequiredFiles)
                .requiredEvidenceCoveragePercent(requiredCoveragePercent)
                .coverageScope(coverageScope)
                .evidenceRoleDistribution(evidenceRoleDistribution)
                .status(status)
                .build();
    }

    private CodeQaCitationCoverage.EvidenceRoleDistribution evidenceRoleDistribution(
            Set<String> uniqueFiles,
            Set<String> citedFiles,
            Set<String> primaryFiles,
            Set<String> citedPrimaryFiles,
            Set<String> contextFiles,
            Set<String> citedContextFiles,
            Map<String, RoleCoverageAccumulator> roleAccumulators,
            Map<String, FileCoverageAccumulator> fileAccumulators) {
        String status;
        RoleCoverageAccumulator unknown = roleAccumulators.get("UNKNOWN");
        if (uniqueFiles.isEmpty() && roleAccumulators.values().stream().mapToInt(RoleCoverageAccumulator::evidenceCount).sum() == 0) {
            status = "NO_EVIDENCE";
        } else if (unknown != null && unknown.evidenceCount() > 0) {
            status = "UNKNOWN_ROLE_PRESENT";
        } else if (primaryFiles.size() >= 2) {
            status = "PRIMARY_CROSS_FILE";
        } else if (!primaryFiles.isEmpty() && !contextFiles.isEmpty()) {
            status = "MIXED_PRIMARY_CONTEXT";
        } else if (primaryFiles.size() == 1) {
            status = "PRIMARY_SINGLE_FILE";
        } else if (!contextFiles.isEmpty()) {
            status = "CONTEXT_ONLY";
        } else {
            status = "UNKNOWN_ROLE_PRESENT";
        }

        List<CodeQaCitationCoverage.RoleStat> roleStats = roleAccumulators.entrySet().stream()
                .filter(entry -> entry.getValue().evidenceCount() > 0)
                .map(entry -> CodeQaCitationCoverage.RoleStat.builder()
                        .role(entry.getKey())
                        .evidenceCount(entry.getValue().evidenceCount())
                        .citedEvidenceCount(entry.getValue().citedEvidenceCount())
                        .fileCount(entry.getValue().fileCount())
                        .citedFileCount(entry.getValue().citedFileCount())
                        .build())
                .toList();
        List<CodeQaCitationCoverage.FileStat> fileStats = fileAccumulators.values().stream()
                .map(accumulator -> CodeQaCitationCoverage.FileStat.builder()
                        .filePath(accumulator.filePath)
                        .primaryEvidenceCount(accumulator.primaryEvidenceCount)
                        .citedPrimaryEvidenceCount(accumulator.citedPrimaryEvidenceCount)
                        .contextEvidenceCount(accumulator.contextEvidenceCount)
                        .citedContextEvidenceCount(accumulator.citedContextEvidenceCount)
                        .build())
                .toList();

        return CodeQaCitationCoverage.EvidenceRoleDistribution.builder()
                .status(status)
                .totalFileCount(uniqueFiles.size())
                .citedFileCount(citedFiles.size())
                .primaryFileCount(primaryFiles.size())
                .citedPrimaryFileCount(citedPrimaryFiles.size())
                .contextFileCount(contextFiles.size())
                .citedContextFileCount(citedContextFiles.size())
                .roles(roleStats)
                .files(fileStats)
                .build();
    }

    private String normalizedEvidenceRole(String contextRole) {
        if ("PRIMARY".equals(contextRole)) {
            return "PRIMARY";
        }
        if ("ADJACENT_CONTEXT".equals(contextRole)) {
            return "ADJACENT_CONTEXT";
        }
        return "UNKNOWN";
    }

    private String normalizedFilePath(String filePath) {
        if (filePath == null || filePath.isBlank()) {
            return null;
        }
        return filePath.trim().replace('\\', '/').replaceAll("/+", "/");
    }

    private static class RoleCoverageAccumulator {
        private int evidenceCount;
        private int citedEvidenceCount;
        private final Set<String> files = new LinkedHashSet<>();
        private final Set<String> citedFiles = new LinkedHashSet<>();

        private void record(String filePath, boolean citedByAnswer) {
            evidenceCount++;
            if (filePath != null) {
                files.add(filePath);
            }
            if (citedByAnswer) {
                citedEvidenceCount++;
                if (filePath != null) {
                    citedFiles.add(filePath);
                }
            }
        }

        private int evidenceCount() {
            return evidenceCount;
        }

        private int citedEvidenceCount() {
            return citedEvidenceCount;
        }

        private int fileCount() {
            return files.size();
        }

        private int citedFileCount() {
            return citedFiles.size();
        }
    }

    private static class FileCoverageAccumulator {
        private final String filePath;
        private int primaryEvidenceCount;
        private int citedPrimaryEvidenceCount;
        private int contextEvidenceCount;
        private int citedContextEvidenceCount;

        private FileCoverageAccumulator(String filePath) {
            this.filePath = filePath;
        }

        private void record(String role, boolean citedByAnswer) {
            if ("PRIMARY".equals(role)) {
                primaryEvidenceCount++;
                if (citedByAnswer) {
                    citedPrimaryEvidenceCount++;
                }
            } else if ("ADJACENT_CONTEXT".equals(role)) {
                contextEvidenceCount++;
                if (citedByAnswer) {
                    citedContextEvidenceCount++;
                }
            }
        }
    }

    private static class ClaimRoleAccumulator {
        private int claimCount;
        private int requiredClaimCount;
        private final Set<String> files = new LinkedHashSet<>();
        private final Set<String> requiredFiles = new LinkedHashSet<>();

        private void record(Set<String> filePaths, boolean required) {
            claimCount++;
            if (filePaths != null) {
                files.addAll(filePaths);
            }
            if (required) {
                requiredClaimCount++;
                if (filePaths != null) {
                    requiredFiles.addAll(filePaths);
                }
            }
        }

        private int claimCount() {
            return claimCount;
        }

        private int requiredClaimCount() {
            return requiredClaimCount;
        }

        private int fileCount() {
            return files.size();
        }

        private int requiredFileCount() {
            return requiredFiles.size();
        }
    }

    private static class ClaimFileAccumulator {
        private final String filePath;
        private int primaryClaimCount;
        private int requiredPrimaryClaimCount;
        private int contextClaimCount;
        private int requiredContextClaimCount;
        private int unknownClaimCount;
        private int requiredUnknownClaimCount;
        private int requiredClaimCount;

        private ClaimFileAccumulator(String filePath) {
            this.filePath = filePath;
        }

        private void record(Set<String> roles, boolean required) {
            if (roles == null || roles.isEmpty()) {
                return;
            }
            if (roles.contains("PRIMARY")) {
                primaryClaimCount++;
                if (required) {
                    requiredPrimaryClaimCount++;
                }
            }
            if (roles.contains("ADJACENT_CONTEXT")) {
                contextClaimCount++;
                if (required) {
                    requiredContextClaimCount++;
                }
            }
            if (roles.contains("UNKNOWN")) {
                unknownClaimCount++;
                if (required) {
                    requiredUnknownClaimCount++;
                }
            }
            if (required) {
                requiredClaimCount++;
            }
        }
    }

    private String retrievalMode(long matchedChunks, List<CodeChunkSearchItem> retrievedChunks, List<Float> questionEmbedding) {
        List<CodeChunkSearchItem> safeChunks = retrievedChunks == null ? List.of() : retrievedChunks;
        boolean hasRetrievedChunks = !safeChunks.isEmpty();
        boolean hasRetrievedEmbeddings = safeChunks.stream().anyMatch(chunk -> Boolean.TRUE.equals(chunk.getHasEmbedding()));
        boolean hasQuestionEmbedding = questionEmbedding != null && !questionEmbedding.isEmpty();
        if (matchedChunks <= 0) {
            return hasQuestionEmbedding && hasRetrievedEmbeddings ? "SEMANTIC_FALLBACK" : "STABLE_FALLBACK";
        }
        return hasQuestionEmbedding && hasRetrievedChunks ? "HYBRID" : "KEYWORD";
    }

    private List<CodeChunk> expandContextChunks(Long scanTaskId, List<CodeChunk> topChunks) {
        if (topChunks == null || topChunks.isEmpty()) {
            return List.of();
        }
        try {
            List<CodeChunk> expanded = codeChunkService.expandWithAdjacentChunks(
                    scanTaskId, topChunks, QA_CONTEXT_ADJACENT_PER_SIDE, QA_CONTEXT_MAX_CHUNKS);
            if (expanded != null && !expanded.isEmpty()) {
                return expanded;
            }
        } catch (Exception e) {
            log.warn("扩展代码问答相邻切片上下文失败, scanTaskId={}, error={}", scanTaskId, e.getMessage());
        }
        return topChunks;
    }

    private RelationExpandedContext expandWithGraphRelatedChunks(Long scanTaskId,
                                                                 List<CodeChunk> topChunks,
                                                                 List<CodeChunk> candidateChunks) {
        List<CodeChunk> safeTopChunks = topChunks == null ? List.of() : topChunks;
        if (scanTaskId == null
                || safeTopChunks.isEmpty()
                || candidateChunks == null
                || candidateChunks.isEmpty()
                || graphService == null) {
            return new RelationExpandedContext(safeTopChunks, Map.of());
        }
        try {
            List<CodeSymbol> symbols = graphService.listSymbols(scanTaskId, null);
            List<CodeRelationEntity> relations = graphService.listRelations(scanTaskId, null);
            if (symbols == null || symbols.isEmpty() || relations == null || relations.isEmpty()) {
                return new RelationExpandedContext(safeTopChunks, Map.of());
            }
            Map<String, CodeSymbol> symbolIndex = symbols.stream()
                    .filter(symbol -> symbol != null && symbol.getSymbolId() != null && !symbol.getSymbolId().isBlank())
                    .collect(LinkedHashMap::new,
                            (map, symbol) -> map.putIfAbsent(symbol.getSymbolId(), symbol),
                            LinkedHashMap::putAll);
            Set<String> primarySymbolIds = symbols.stream()
                    .filter(symbol -> safeTopChunks.stream().anyMatch(chunk -> symbolOverlapsChunk(symbol, chunk)))
                    .map(CodeSymbol::getSymbolId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toCollection(LinkedHashSet::new));
            if (primarySymbolIds.isEmpty()) {
                return new RelationExpandedContext(safeTopChunks, Map.of());
            }
            Set<String> selectedKeys = safeTopChunks.stream()
                    .map(this::chunkKey)
                    .collect(Collectors.toCollection(LinkedHashSet::new));
            List<CodeChunk> expanded = new ArrayList<>(safeTopChunks);
            Map<String, String> relationEvidenceReasons = new LinkedHashMap<>();
            List<RelationChunkCandidate> relationCandidates = relationChunkCandidates(
                    candidateChunks,
                    relations,
                    symbolIndex,
                    primarySymbolIds,
                    selectedKeys);
            for (RelationChunkCandidate candidate : relationCandidates) {
                if (expanded.size() >= QA_CONTEXT_MAX_CHUNKS
                        || relationEvidenceReasons.size() >= QA_CONTEXT_GRAPH_RELATED_LIMIT) {
                    break;
                }
                String key = chunkKey(candidate.chunk());
                if (selectedKeys.contains(key)) {
                    continue;
                }
                expanded.add(candidate.chunk());
                selectedKeys.add(key);
                relationEvidenceReasons.put(key, candidate.reason());
            }
            return new RelationExpandedContext(expanded, relationEvidenceReasons);
        } catch (Exception e) {
            log.warn("扩展代码问答图谱关系上下文失败, scanTaskId={}, error={}", scanTaskId, e.getMessage());
            return new RelationExpandedContext(safeTopChunks, Map.of());
        }
    }

    private List<RelationChunkCandidate> relationChunkCandidates(List<CodeChunk> candidateChunks,
                                                                 List<CodeRelationEntity> relations,
                                                                 Map<String, CodeSymbol> symbolIndex,
                                                                 Set<String> primarySymbolIds,
                                                                 Set<String> selectedKeys) {
        List<RelationChunkCandidate> candidates = new ArrayList<>();
        for (CodeRelationEntity relation : relations) {
            if (relation == null || relation.getSourceId() == null || relation.getTargetId() == null) {
                continue;
            }
            boolean sourceIsPrimary = primarySymbolIds.contains(relation.getSourceId());
            boolean targetIsPrimary = primarySymbolIds.contains(relation.getTargetId());
            if (sourceIsPrimary == targetIsPrimary) {
                continue;
            }
            String relatedSymbolId = sourceIsPrimary ? relation.getTargetId() : relation.getSourceId();
            CodeSymbol relatedSymbol = symbolIndex.get(relatedSymbolId);
            CodeSymbol sourceSymbol = symbolIndex.get(relation.getSourceId());
            CodeSymbol targetSymbol = symbolIndex.get(relation.getTargetId());
            if (relatedSymbol == null) {
                continue;
            }
            for (CodeChunk chunk : candidateChunks) {
                if (chunk == null || selectedKeys.contains(chunkKey(chunk)) || !symbolOverlapsChunk(relatedSymbol, chunk)) {
                    continue;
                }
                candidates.add(new RelationChunkCandidate(
                        chunk,
                        relationPriority(relation.getRelationType()),
                        relationEvidenceReason(relation, sourceSymbol, targetSymbol)));
            }
        }
        return candidates.stream()
                .sorted(Comparator
                        .comparingInt(RelationChunkCandidate::priority).reversed()
                        .thenComparing(candidate -> normalizedFilePath(candidate.chunk().getFilePath()))
                        .thenComparingInt(candidate -> candidate.chunk().getStartLine() == null
                                ? Integer.MAX_VALUE
                                : candidate.chunk().getStartLine()))
                .collect(Collectors.toList());
    }

    private boolean symbolOverlapsChunk(CodeSymbol symbol, CodeChunk chunk) {
        if (symbol == null || chunk == null || !sameNormalizedPath(symbol.getFilePath(), chunk.getFilePath())) {
            return false;
        }
        Integer symbolStart = symbol.getLineNumber();
        Integer symbolEnd = symbol.getEndLine() == null ? symbolStart : symbol.getEndLine();
        if (symbolStart == null || symbolEnd == null || chunk.getStartLine() == null || chunk.getEndLine() == null) {
            return true;
        }
        return symbolStart <= chunk.getEndLine() && symbolEnd >= chunk.getStartLine();
    }

    private boolean sameNormalizedPath(String left, String right) {
        return normalizedFilePath(left).equals(normalizedFilePath(right));
    }

    private int relationPriority(String relationType) {
        String type = relationType == null ? "" : relationType.trim().toUpperCase(Locale.ROOT);
        return switch (type) {
            case "CALLS" -> 400;
            case "DEPENDS_ON" -> 300;
            case "IMPLEMENTS" -> 220;
            case "EXTENDS" -> 200;
            default -> 100;
        };
    }

    private String relationEvidenceReason(CodeRelationEntity relation, CodeSymbol sourceSymbol, CodeSymbol targetSymbol) {
        String type = relation == null || relation.getRelationType() == null || relation.getRelationType().isBlank()
                ? "RELATED_TO"
                : relation.getRelationType().trim().toUpperCase(Locale.ROOT);
        return "Graph relation: "
                + symbolLabel(sourceSymbol, relation == null ? null : relation.getSourceId())
                + " " + type + " "
                + symbolLabel(targetSymbol, relation == null ? null : relation.getTargetId())
                + ".";
    }

    private String symbolLabel(CodeSymbol symbol, String fallbackId) {
        if (symbol == null) {
            return fallbackId == null || fallbackId.isBlank() ? "UNKNOWN" : fallbackId;
        }
        if (symbol.getSymbolId() != null && !symbol.getSymbolId().isBlank()) {
            return symbol.getSymbolId();
        }
        return symbol.getName() == null || symbol.getName().isBlank() ? "UNKNOWN" : symbol.getName();
    }

    private Set<String> chunkKeys(List<CodeChunk> chunks) {
        if (chunks == null || chunks.isEmpty()) {
            return Set.of();
        }
        Set<String> keys = new HashSet<>();
        for (CodeChunk chunk : chunks) {
            keys.add(chunkKey(chunk));
        }
        return keys;
    }

    private Set<String> primaryChunkKeys(List<CodeChunk> topChunks, CodeQaRequest.EvidenceRef evidenceRef) {
        if (topChunks == null || topChunks.isEmpty()) {
            return Set.of();
        }
        if (evidenceRef == null || evidenceRef.getFilePath() == null || evidenceRef.getFilePath().isBlank()) {
            return chunkKeys(topChunks);
        }

        LineRange sourceLineRange = sourceLineRange(evidenceRef);
        List<CodeChunk> matchedChunks = new ArrayList<>();
        List<CodeChunk> exactMatchedChunks = new ArrayList<>();
        for (CodeChunk chunk : topChunks) {
            if (chunk == null || !sameEvidencePath(evidenceRef.getFilePath(), chunk.getFilePath())) {
                continue;
            }
            matchedChunks.add(chunk);
            if (exactEvidencePath(evidenceRef.getFilePath(), chunk.getFilePath())) {
                exactMatchedChunks.add(chunk);
            }
        }
        if (matchedChunks.isEmpty()) {
            return chunkKeys(topChunks);
        }
        List<CodeChunk> sourceMatchedChunks = exactMatchedChunks.isEmpty() ? matchedChunks : exactMatchedChunks;
        if (exactMatchedChunks.isEmpty()
                && hasAmbiguousNonExactEvidencePath(evidenceRef.getFilePath(), matchedChunkPaths(matchedChunks))) {
            return Set.of();
        }
        for (CodeChunk chunk : sourceMatchedChunks) {
            if (sourceLineRange != null && lineRangeOverlaps(sourceLineRange, chunk.getStartLine(), chunk.getEndLine())) {
                return Set.of(chunkKey(chunk));
            }
        }
        if (sourceLineRange != null) {
            return Set.of();
        }
        return Set.of(chunkKey(sourceMatchedChunks.get(0)));
    }

    private Set<String> promoteGraphRelatedPrimaryChunkKeys(Set<String> originalPrimaryKeys,
                                                            RelationExpandedContext relationContext,
                                                            String question) {
        Set<String> promoted = new LinkedHashSet<>(originalPrimaryKeys == null ? Set.of() : originalPrimaryKeys);
        if (!hasGraphFlowPrimaryIntent(question)
                || relationContext == null
                || relationContext.relationEvidenceReasons() == null
                || relationContext.relationEvidenceReasons().isEmpty()) {
            return promoted;
        }
        promoted.addAll(relationContext.relationEvidenceReasons().keySet());
        return promoted;
    }

    private boolean hasGraphFlowPrimaryIntent(String question) {
        if (question == null || question.isBlank()) {
            return false;
        }
        String input = question.toLowerCase(Locale.ROOT);
        boolean flowIntent = input.contains("trace")
                || input.contains("flow")
                || input.contains("call chain")
                || input.contains("call graph")
                || input.contains("调用链")
                || input.contains("调用关系")
                || input.contains("依赖关系")
                || input.contains("链路")
                || input.contains("流程")
                || input.contains("从")
                || input.contains("到");
        if (!flowIntent) {
            return false;
        }
        List<String> roleIntents = CodeChunkRanker.roleIntentTypes(question);
        long backendRoleCount = roleIntents.stream()
                .filter(role -> Set.of("CONTROLLER", "SERVICE", "DATA_ACCESS", "DOMAIN_MODEL").contains(role))
                .distinct()
                .count();
        return backendRoleCount >= 2
                || input.contains("controller to service")
                || input.contains("service to repository")
                || input.contains("controller")
                && input.contains("service")
                || input.contains("service")
                && (input.contains("repository") || input.contains("mapper") || input.contains("dao"))
                || input.contains("控制器")
                && input.contains("服务")
                || input.contains("服务")
                && (input.contains("仓储") || input.contains("mapper") || input.contains("dao"));
    }

    private List<String> matchedChunkPaths(List<CodeChunk> matchedChunks) {
        if (matchedChunks == null || matchedChunks.isEmpty()) {
            return List.of();
        }
        List<String> paths = new ArrayList<>();
        for (CodeChunk chunk : matchedChunks) {
            if (chunk != null) {
                paths.add(chunk.getFilePath());
            }
        }
        return paths;
    }

    private List<CodeChunk> mergeCandidateChunks(List<CodeChunk> primary, List<CodeChunk> semanticPool) {
        if ((primary == null || primary.isEmpty()) && (semanticPool == null || semanticPool.isEmpty())) {
            return List.of();
        }
        LinkedHashMap<String, CodeChunk> merged = new LinkedHashMap<>();
        if (primary != null) {
            for (CodeChunk chunk : primary) {
                if (chunk != null) {
                    merged.putIfAbsent(chunkKey(chunk), chunk);
                }
            }
        }
        if (semanticPool != null) {
            for (CodeChunk chunk : semanticPool) {
                if (chunk != null) {
                    merged.putIfAbsent(chunkKey(chunk), chunk);
                }
            }
        }
        return new ArrayList<>(merged.values());
    }

    private String chunkKey(CodeChunk chunk) {
        if (chunk == null) {
            return "";
        }
        if (chunk.getId() != null) {
            return "id:" + chunk.getId();
        }
        return "range:" + (chunk.getScanTaskId() == null ? "" : chunk.getScanTaskId())
                + ":" + (chunk.getFilePath() == null ? "" : chunk.getFilePath())
                + ":" + (chunk.getStartLine() == null ? "" : chunk.getStartLine())
                + ":" + (chunk.getEndLine() == null ? "" : chunk.getEndLine());
    }

    private List<CodeChunkSearchItem> toRetrievedChunks(List<CodeChunk> chunks,
                                                        String question,
                                                        Set<String> primaryChunkKeys,
                                                        String embeddingModelKey,
                                                        Map<String, String> relationEvidenceReasons,
                                                        CodeQaRequest.EvidenceRef evidenceRef) {
        if (chunks == null || chunks.isEmpty()) {
            return List.of();
        }
        List<CodeChunkSearchItem> items = new ArrayList<>();
        for (int i = 0; i < chunks.size(); i++) {
            CodeChunk chunk = chunks.get(i);
            boolean primary = primaryChunkKeys == null || primaryChunkKeys.contains(chunkKey(chunk));
            String sourceLabel = "C" + (i + 1);
            String evidenceReason = evidenceReason(chunk, question, primary, relationEvidenceReasons, evidenceRef);
            items.add(CodeChunkSearchItem.builder()
                        .citationId("code-chunk:" + (chunk.getId() == null ? chunkKey(chunk) : chunk.getId()))
                        .sourceLabel(sourceLabel)
                        .id(chunk.getId())
                        .scanTaskId(chunk.getScanTaskId())
                        .filePath(chunk.getFilePath())
                        .startLine(chunk.getStartLine())
                        .endLine(chunk.getEndLine())
                        .content(null)
                        .contentPreview(preview(chunk.getContent()))
                        .hasEmbedding(hasUsableEmbedding(chunk, embeddingModelKey))
                        .matchedTerms(codeChunkService.matchedTerms(chunk, question))
                        .relevanceScore(CodeChunkRanker.relevanceScore(chunk, question))
                        .evidenceType(CodeChunkRanker.evidenceType(chunk))
                        .evidenceReason(evidenceReason)
                        .contextRole(primary ? "PRIMARY" : "ADJACENT_CONTEXT")
                        .contextDistance(primary ? 0 : 1)
                        .build());
        }
        return items;
    }

    private String evidenceReason(CodeChunk chunk,
                                  String question,
                                  boolean primary,
                                  Map<String, String> relationEvidenceReasons,
                                  CodeQaRequest.EvidenceRef evidenceRef) {
        String baseReason = CodeChunkRanker.evidenceReason(chunk, question);
        String sourceEvidenceReason = sourceEvidenceReason(chunk, evidenceRef, primary);
        if (sourceEvidenceReason != null && !sourceEvidenceReason.isBlank()) {
            baseReason = baseReason == null || baseReason.isBlank()
                    ? sourceEvidenceReason
                    : baseReason + " " + sourceEvidenceReason;
        }
        if (relationEvidenceReasons == null || relationEvidenceReasons.isEmpty()) {
            return baseReason;
        }
        String relationReason = relationEvidenceReasons.get(chunkKey(chunk));
        if (relationReason == null || relationReason.isBlank()) {
            return baseReason;
        }
        if (baseReason == null || baseReason.isBlank()) {
            return relationReason;
        }
        return baseReason + " " + relationReason;
    }

    private String sourceEvidenceReason(CodeChunk chunk,
                                        CodeQaRequest.EvidenceRef evidenceRef,
                                        boolean primary) {
        if (!primary
                || chunk == null
                || evidenceRef == null
                || evidenceRef.getFilePath() == null
                || evidenceRef.getFilePath().isBlank()
                || !sameEvidencePath(evidenceRef.getFilePath(), chunk.getFilePath())) {
            return "";
        }
        LineRange sourceLineRange = sourceLineRange(evidenceRef);
        if (sourceLineRange != null) {
            if (lineRangeOverlaps(sourceLineRange, chunk.getStartLine(), chunk.getEndLine())) {
                return "Report evidence line anchor.";
            }
            return "";
        }
        return "Report evidence file anchor.";
    }

    private boolean hasUsableEmbedding(CodeChunk chunk, String embeddingModelKey) {
        if (chunk == null || chunk.getEmbedding() == null || chunk.getEmbedding().isBlank()) {
            return false;
        }
        if (embeddingModelKey == null || embeddingModelKey.isBlank()) {
            return true;
        }
        return embeddingModelKey.equals(chunk.getEmbeddingModel());
    }

    private String preview(String content) {
        return SensitiveDataSanitizer.sanitizeAndTruncate(content, QA_CONTENT_PREVIEW_MAX_LENGTH);
    }

    private record CitationEnforcementResult(String answer,
                                             Set<String> citedLabels,
                                             String status,
                                             String reason,
                                             String note) {
    }

    private record CitationEnforcementFailure(String reason,
                                              String note) {
    }

    private record ClaimCitationReadiness(Boolean readyForRepair,
                                          String reason,
                                          String note) {
    }

    private record RelationExpandedContext(List<CodeChunk> chunks,
                                           Map<String, String> relationEvidenceReasons) {
    }

    private record RelationChunkCandidate(CodeChunk chunk,
                                          int priority,
                                          String reason) {
    }

    private record SemanticRetrievalDiagnostics(boolean questionEmbeddingAvailable,
                                                int embeddingCoveragePercent,
                                                String embeddingCoverageStatus,
                                                boolean semanticPoolAttempted,
                                                String semanticPoolStrategy,
                                                int semanticPoolLoadedCount,
                                                int semanticPoolLimit,
                                                boolean semanticPoolTruncated,
                                                int semanticPoolCoveragePercent,
                                                boolean activeLlmPresent,
                                                boolean questionEmbeddingFailed) {
    }

    private record LineRange(int start, int end) {
    }
}
