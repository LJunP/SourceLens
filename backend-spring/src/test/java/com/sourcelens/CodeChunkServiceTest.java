package com.sourcelens;

import com.baomidou.mybatisplus.core.conditions.AbstractWrapper;
import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.sourcelens.module.analysis.entity.CodeChunk;
import com.sourcelens.module.analysis.mapper.CodeChunkMapper;
import com.sourcelens.module.analysis.service.CodeChunkFileFilter;
import com.sourcelens.module.analysis.service.CodeChunkRanker;
import com.sourcelens.module.analysis.service.CodeChunkService;
import com.sourcelens.module.agent.entity.LlmConfig;
import com.sourcelens.module.agent.service.LlmClient;
import com.sourcelens.module.agent.service.LlmConfigService;
import com.sourcelens.module.scantask.entity.ScanTask;
import com.sourcelens.module.scantask.mapper.ScanTaskMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.charset.StandardCharsets;
import java.lang.reflect.Method;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assumptions.assumeTrue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CodeChunkServiceTest {

    @Mock private CodeChunkMapper codeChunkMapper;
    @Mock private ScanTaskMapper scanTaskMapper;
    @Mock private LlmConfigService llmConfigService;
    @Mock private LlmClient llmClient;
    @Mock private CodeChunkFileFilter fileFilter;

    private CodeChunkService codeChunkService;

    @TempDir
    private Path tempDir;

    @BeforeEach
    void setUp() {
        initTableInfo(CodeChunk.class);
        codeChunkService = new CodeChunkService(scanTaskMapper, llmConfigService, llmClient, fileFilter);
        ReflectionTestUtils.setField(codeChunkService, "baseMapper", codeChunkMapper);
        ReflectionTestUtils.setField(codeChunkService, "self", codeChunkService);
    }

    @Test
    void listRetrievalCandidates_shouldQueryLimitedKeywordCandidates() {
        CodeChunk auth = chunk("src/AuthService.java");
        when(codeChunkMapper.selectList(any(Wrapper.class))).thenReturn(List.of(auth));

        List<CodeChunk> result = codeChunkService.listRetrievalCandidates(42L, "auth token");

        assertEquals(List.of(auth), result);
        @SuppressWarnings({"rawtypes", "unchecked"})
        ArgumentCaptor<Wrapper<CodeChunk>> wrapperCaptor = ArgumentCaptor.forClass((Class) Wrapper.class);
        verify(codeChunkMapper).selectList(wrapperCaptor.capture());
        String sqlSegment = wrapperCaptor.getValue().getCustomSqlSegment();
        assertTrue(sqlSegment.contains("file_path"));
        assertFalse(sqlSegment.contains("content LIKE"));
    }

    @Test
    void listRetrievalCandidates_shouldUseEmbeddedCandidatesWhenKeywordMatchesAreMissing() {
        CodeChunk embedded = chunk("src/SemanticMatch.java");
        embedded.setEmbedding("[1.0,0.0]");
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of())
                .thenReturn(List.of(embedded));

        List<CodeChunk> result = codeChunkService.listRetrievalCandidates(42L, "missing keyword");

        assertEquals(List.of(embedded), result);
        verify(codeChunkMapper, times(2)).selectList(any(Wrapper.class));
    }

    @Test
    void listRetrievalCandidates_shouldFallbackToSmallStableSetWhenNoKeywordOrEmbeddedCandidatesExist() {
        CodeChunk first = chunk("src/App.java");
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of())
                .thenReturn(List.of())
                .thenReturn(List.of())
                .thenReturn(List.of())
                .thenReturn(List.of())
                .thenReturn(List.of())
                .thenReturn(List.of())
                .thenReturn(List.of())
                .thenReturn(List.of())
                .thenReturn(List.of())
                .thenReturn(List.of());
        when(codeChunkMapper.selectStableFallbackChunks(42L, 20)).thenReturn(List.of(first));

        List<CodeChunk> result = codeChunkService.listRetrievalCandidates(42L, "missing keyword");

        assertEquals(List.of(first), result);
        verify(codeChunkMapper, times(9)).selectList(any(Wrapper.class));
        verify(codeChunkMapper).selectStableFallbackChunks(42L, 20);
    }

    @Test
    void listRetrievalCandidates_shouldUseRepresentativeCodeFallbackBeforeRepositoryOrderFallback() {
        CodeChunk service = chunk("src/main/java/com/example/service/AuthService.java");
        CodeChunk controller = chunk("src/main/java/com/example/controller/AuthController.java");
        CodeChunk mapper = chunk("src/main/resources/mapper/AuthMapper.xml");
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of())
                .thenReturn(List.of())
                .thenReturn(List.of(controller))
                .thenReturn(List.of(service))
                .thenReturn(List.of(mapper))
                .thenReturn(List.of())
                .thenReturn(List.of())
                .thenReturn(List.of())
                .thenReturn(List.of());

        List<CodeChunk> result = codeChunkService.listRetrievalCandidates(42L, "missing keyword");

        assertEquals(List.of(controller, service, mapper), result);
        verify(codeChunkMapper, times(9)).selectList(any(Wrapper.class));
        verify(codeChunkMapper, never()).selectStableFallbackChunks(42L, 20);
    }

    @Test
    void listRetrievalCandidates_shouldUseQuestionIntentToRankRepresentativeFallback() {
        CodeChunk controller = chunk("src/main/java/com/example/controller/AuthController.java");
        CodeChunk service = chunk("src/main/java/com/example/service/AuthService.java");
        CodeChunk mapper = chunk("src/main/resources/mapper/AuthMapper.xml");
        CodeChunk config = chunk("src/main/resources/application.yml");
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of())
                .thenReturn(List.of(controller, service, mapper, config));

        List<CodeChunk> result = codeChunkService.listRetrievalCandidates(42L, "运行时固定配置在哪里准备");

        assertEquals(config, result.get(0));
        assertEquals(service, result.get(1));
        assertEquals(controller, result.get(2));
        assertTrue(result.contains(mapper));
        verify(codeChunkMapper, times(2)).selectList(any(Wrapper.class));
        verify(codeChunkMapper, never()).selectStableFallbackChunks(42L, 20);
    }

    @Test
    void listRetrievalCandidates_shouldPreferDataAccessForWeakDataLoadingFallback() {
        CodeChunk controller = chunk("src/main/java/com/example/controller/FeatureController.java");
        CodeChunk service = chunk("src/main/java/com/example/service/FeatureService.java");
        CodeChunk mapper = chunk("src/main/resources/mapper/FeatureFlagMapper.xml");
        CodeChunk config = chunk("src/main/resources/application.yml");
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of())
                .thenReturn(List.of(controller, service, mapper, config));

        List<CodeChunk> result = codeChunkService.listRetrievalCandidates(42L, "实验开关数据在哪里加载");

        assertEquals(mapper, result.get(0));
        assertEquals(service, result.get(1));
        assertEquals(config, result.get(2));
        assertTrue(result.contains(controller));
        verify(codeChunkMapper, times(2)).selectList(any(Wrapper.class));
        verify(codeChunkMapper, never()).selectStableFallbackChunks(42L, 20);
    }

    @Test
    void listRetrievalCandidates_shouldUseOrderedRoleIntentWhenWeakKeywordHasKeywordCandidates() {
        CodeChunk genericConfigSource = chunk("src/commands/config/index.ts");
        CodeChunk mapper = chunk("src/main/resources/mapper/FeatureFlagMapper.xml");
        CodeChunk service = chunk("src/main/java/com/example/service/FeatureFlagService.java");
        CodeChunk runtimeConfig = chunk("src/main/resources/application.yml");
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(genericConfigSource))
                .thenReturn(List.of(mapper, service, runtimeConfig));

        List<CodeChunk> result = codeChunkService.listRetrievalCandidates(42L, "实验开关数据在哪里加载");

        assertEquals(mapper, result.get(0));
        assertEquals(service, result.get(1));
        assertTrue(result.indexOf(runtimeConfig) > 1);
        assertTrue(result.indexOf(genericConfigSource) > 1);
        verify(codeChunkMapper, times(2)).selectList(any(Wrapper.class));
    }

    @Test
    void listRetrievalCandidates_shouldKeepOperationalPolicyServiceAheadOfConfigNoise() {
        CodeChunk frontendConfigNoise = CodeChunk.builder()
                .scanTaskId(42L)
                .filePath("src/main/resources/admin/src/config/table.js")
                .content("危险 命令 参数 拒绝 配置 表格 config table columns")
                .startLine(1)
                .endLine(20)
                .build();
        CodeChunk commandConfigSourceNoise = CodeChunk.builder()
                .scanTaskId(42L)
                .filePath("src/commands/config/index.ts")
                .content("危险 命令 参数 拒绝 config command index")
                .startLine(1)
                .endLine(20)
                .build();
        CodeChunk service = CodeChunk.builder()
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/service/SandboxCommandPolicyService.java")
                .content("@Service class SandboxCommandPolicyService { boolean rejectDangerousCommand(String command) { return true; } }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk runtimeConfig = chunk("src/main/resources/application.yml");
        CodeChunk controller = chunk("src/main/java/com/example/controller/SandboxController.java");
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(frontendConfigNoise, commandConfigSourceNoise))
                .thenReturn(List.of(service, runtimeConfig, controller));

        List<CodeChunk> result = codeChunkService.listRetrievalCandidates(42L, "危险命令参数在哪里被拒绝");

        assertEquals(service, result.get(0));
        assertTrue(result.indexOf(runtimeConfig) > 0);
        assertTrue(result.indexOf(frontendConfigNoise) > 0);
        assertTrue(result.indexOf(commandConfigSourceNoise) > 0);
        verify(codeChunkMapper, times(2)).selectList(any(Wrapper.class));
    }

    @Test
    void evidenceType_shouldTreatNestedAdminStaticConfigSourceAsFrontendEvidence() {
        CodeChunk frontendConfigNoise = chunk("src/main/resources/admin/src/config/chat/table.js");

        assertEquals("FRONTEND", CodeChunkRanker.evidenceType(frontendConfigNoise));
    }

    @Test
    void evidenceType_shouldTreatNestedFrontStaticConfigSourceAsFrontendEvidence() {
        CodeChunk frontendConfigNoise = chunk("src/main/resources/front/src/config/zhishiku/table.js");

        assertEquals("FRONTEND", CodeChunkRanker.evidenceType(frontendConfigNoise));
    }

    @Test
    void evidenceType_shouldTreatMavenVariantPomAsBuildDocumentationEvidence() {
        CodeChunk buildFile = chunk("springboot3v0tw8e94/pom-war.xml");

        assertEquals("DOCUMENTATION", CodeChunkRanker.evidenceType(buildFile));
    }

    @Test
    void evidenceType_shouldTreatCommandConfigSourceAsSourceEvidence() {
        CodeChunk commandSource = chunk("src/commands/config/index.ts");

        assertEquals("SOURCE", CodeChunkRanker.evidenceType(commandSource));
    }

    @Test
    void evidenceType_shouldTreatCommandModelSourceAsSourceEvidence() {
        CodeChunk commandSource = chunk("src/commands/model/index.ts");

        assertEquals("SOURCE", CodeChunkRanker.evidenceType(commandSource));
    }

    @Test
    void evidenceType_shouldNotTreatTypeScriptUtilityModelDirectoryAsDomainModelEvidence() {
        CodeChunk utilitySource = chunk("src/utils/model/agent.ts");

        assertEquals("SOURCE", CodeChunkRanker.evidenceType(utilitySource));
    }

    @Test
    void listRetrievalCandidates_shouldUseRepresentativeFallbackForBlankQuery() {
        CodeChunk controller = chunk("src/main/java/com/example/controller/AuthController.java");
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(controller))
                .thenReturn(List.of())
                .thenReturn(List.of())
                .thenReturn(List.of())
                .thenReturn(List.of())
                .thenReturn(List.of())
                .thenReturn(List.of());

        List<CodeChunk> result = codeChunkService.listRetrievalCandidates(42L, "   ");

        assertEquals(List.of(controller), result);
        verify(codeChunkMapper, times(7)).selectList(any(Wrapper.class));
        verify(codeChunkMapper, never()).selectStableFallbackChunks(42L, 20);
    }

    @Test
    void listSemanticRetrievalCandidates_shouldQueryBoundedSameModelVectorPool() {
        CodeChunk semantic = chunk("src/SemanticMatch.java");
        semantic.setEmbedding("[1.0,0.0]");
        semantic.setEmbeddingModel("OPENAI:text-embedding-3-small");
        when(codeChunkMapper.selectList(any(Wrapper.class))).thenReturn(List.of(semantic));

        List<CodeChunk> result = codeChunkService.listSemanticRetrievalCandidates(
                42L,
                "OPENAI:text-embedding-3-small",
                5_000
        );

        assertEquals(List.of(semantic), result);
        @SuppressWarnings({"rawtypes", "unchecked"})
        ArgumentCaptor<Wrapper<CodeChunk>> wrapperCaptor = ArgumentCaptor.forClass((Class) Wrapper.class);
        verify(codeChunkMapper).selectList(wrapperCaptor.capture());
        Wrapper<CodeChunk> wrapper = wrapperCaptor.getValue();
        assertTrue(wrapper.getCustomSqlSegment().contains("embedding_model"));
        assertTrue(wrapper.getCustomSqlSegment().contains("LIMIT 500"));
        @SuppressWarnings("rawtypes")
        AbstractWrapper abstractWrapper = (AbstractWrapper) wrapper;
        assertTrue(abstractWrapper.getParamNameValuePairs().containsValue("OPENAI:text-embedding-3-small"));
    }

    @Test
    void listSemanticRetrievalCandidates_shouldUseDistributedWindowsForLargeSameModelPool() {
        CodeChunk head = semanticChunk(1L, "src/head/HeadMatch.java");
        CodeChunk middle = semanticChunk(2_000L, "src/middle/MiddleMatch.java");
        CodeChunk tail = semanticChunk(5_000L, "src/tail/TailMatch.java");
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(head))
                .thenReturn(List.of())
                .thenReturn(List.of(middle))
                .thenReturn(List.of())
                .thenReturn(List.of())
                .thenReturn(List.of(tail));

        List<CodeChunk> result = codeChunkService.listSemanticRetrievalCandidates(
                42L,
                "OPENAI:text-embedding-3-small",
                5_000L
        );

        assertEquals(List.of(head, middle, tail), result);
        @SuppressWarnings({"rawtypes", "unchecked"})
        ArgumentCaptor<Wrapper<CodeChunk>> wrapperCaptor = ArgumentCaptor.forClass((Class) Wrapper.class);
        verify(codeChunkMapper, times(6)).selectList(wrapperCaptor.capture());
        List<String> sqlSegments = wrapperCaptor.getAllValues().stream()
                .map(Wrapper::getCustomSqlSegment)
                .toList();
        assertTrue(sqlSegments.get(0).contains("LIMIT 250"), sqlSegments::toString);
        assertTrue(sqlSegments.stream().skip(1).allMatch(segment -> segment.contains("OFFSET")), sqlSegments::toString);
        assertTrue(sqlSegments.stream().skip(1).anyMatch(segment -> segment.contains("LIMIT 50")), sqlSegments::toString);
        assertTrue(sqlSegments.get(1).contains("OFFSET 1190"), sqlSegments::toString);
        assertTrue(sqlSegments.get(2).contains("OFFSET 2130"), sqlSegments::toString);
        assertTrue(sqlSegments.get(3).contains("OFFSET 3070"), sqlSegments::toString);
        assertTrue(sqlSegments.get(4).contains("OFFSET 4010"), sqlSegments::toString);
        assertTrue(sqlSegments.get(5).contains("OFFSET 4950"), sqlSegments::toString);
    }

    @Test
    void listSemanticRetrievalCandidates_shouldUseCompactTailWindowsNearPoolLimit() {
        CodeChunk head = semanticChunk(1L, "src/head/HeadMatch.java");
        CodeChunk tail = semanticChunk(501L, "src/tail/TailMatch.java");
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(head))
                .thenReturn(List.of())
                .thenReturn(List.of())
                .thenReturn(List.of())
                .thenReturn(List.of())
                .thenReturn(List.of(tail));

        List<CodeChunk> result = codeChunkService.listSemanticRetrievalCandidates(
                42L,
                "OPENAI:text-embedding-3-small",
                501L
        );

        assertEquals(List.of(head, tail), result);
        @SuppressWarnings({"rawtypes", "unchecked"})
        ArgumentCaptor<Wrapper<CodeChunk>> wrapperCaptor = ArgumentCaptor.forClass((Class) Wrapper.class);
        verify(codeChunkMapper, times(6)).selectList(wrapperCaptor.capture());
        List<String> sqlSegments = wrapperCaptor.getAllValues().stream()
                .map(Wrapper::getCustomSqlSegment)
                .toList();
        assertTrue(sqlSegments.get(0).contains("LIMIT 250"), sqlSegments::toString);
        assertTrue(sqlSegments.get(1).contains("OFFSET 251"), sqlSegments::toString);
        assertTrue(sqlSegments.get(2).contains("OFFSET 301"), sqlSegments::toString);
        assertTrue(sqlSegments.get(3).contains("OFFSET 351"), sqlSegments::toString);
        assertTrue(sqlSegments.get(4).contains("OFFSET 401"), sqlSegments::toString);
        assertTrue(sqlSegments.get(5).contains("OFFSET 451"), sqlSegments::toString);
    }

    @Test
    void listSemanticRetrievalCandidates_shouldSkipPoolWhenEmbeddingModelKeyIsMissing() {
        List<CodeChunk> result = codeChunkService.listSemanticRetrievalCandidates(42L, " ");

        assertEquals(List.of(), result);
        verify(codeChunkMapper, never()).selectList(any(Wrapper.class));
    }

    @Test
    void searchChunks_shouldReturnExactSearchResultsWithoutFallback() {
        CodeChunk auth = chunk("src/AuthService.java");
        when(codeChunkMapper.selectList(any(Wrapper.class))).thenReturn(List.of(auth));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "auth token", 10);

        assertEquals(List.of(auth), result);
        verify(codeChunkMapper).selectList(any(Wrapper.class));
    }

    @Test
    void searchChunks_shouldUseRepresentativeSourceFallbackForBlankQuery() {
        CodeChunk controller = chunk("src/main/java/com/example/controller/AuthController.java");
        CodeChunk service = chunk("src/main/java/com/example/service/AuthService.java");
        CodeChunk repository = chunk("src/main/java/com/example/repository/AuthRepository.java");
        CodeChunk model = chunk("src/main/java/com/example/model/User.java");
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(controller))
                .thenReturn(List.of(service))
                .thenReturn(List.of(repository))
                .thenReturn(List.of(model))
                .thenReturn(List.of())
                .thenReturn(List.of())
                .thenReturn(List.of());

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "", 3);

        assertEquals(List.of(controller, service, repository), result);
        verify(codeChunkMapper, times(7)).selectList(any(Wrapper.class));
        verify(codeChunkMapper, never()).selectStableFallbackChunks(42L, 3);
    }

    @Test
    void hasAuxiliarySearchHints_shouldTreatLineHintsAsStructuralSignals() {
        assertFalse(codeChunkService.hasAuxiliarySearchHints("auth token"));
        assertFalse(codeChunkService.hasAuxiliarySearchHints("line 85"));
        assertFalse(codeChunkService.hasAuxiliarySearchHints("第85行"));
        assertFalse(codeChunkService.hasAuxiliarySearchHints("生成 85 行代码"));
        assertTrue(codeChunkService.hasAuxiliarySearchHints("/api/auth/login"));
        assertTrue(codeChunkService.hasAuxiliarySearchHints("AuthService line 85"));
        assertTrue(codeChunkService.hasAuxiliarySearchHints("src/main/java/AuthService.java:85"));
        assertTrue(codeChunkService.hasAuxiliarySearchHints("{\"filePath\":\"src/main/java/AuthService.java\",\"lineNumber\":85}"));
    }

    @Test
    void searchChunks_shouldAppendRoleIntentCandidatesWhenFrontendApiPoolTruncatesController() {
        List<CodeChunk> frontendApiChunks = frontendApiChunks(15);
        CodeChunk controller = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/OrderController.java")
                .content("@RestController @RequestMapping(\"/api/orders\") class OrderController { @GetMapping public OrderDto detail() { return service.detail(); } }")
                .startLine(1)
                .endLine(40)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(frontendApiChunks)
                .thenReturn(List.of(controller));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "controller api endpoint request mapping", 10);

        assertEquals(controller, result.get(0));
        assertTrue(result.contains(controller));
        verify(codeChunkMapper, times(2)).selectList(any(Wrapper.class));
    }

    @Test
    void searchChunks_shouldKeepRoleIntentQueriesOffContentLikeHotPath() {
        CodeChunk docsNoise = chunk("docs/api.md");
        CodeChunk authController = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthController.java")
                .content("@RestController class AuthController { @PostMapping(\"/login\") Token login() { return token; } }")
                .startLine(1)
                .endLine(50)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(docsNoise))
                .thenReturn(List.of(authController));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "登录接口 controller endpoint", 5);

        assertEquals(authController, result.get(0));
        @SuppressWarnings({"rawtypes", "unchecked"})
        ArgumentCaptor<Wrapper<CodeChunk>> wrapperCaptor = ArgumentCaptor.forClass((Class) Wrapper.class);
        verify(codeChunkMapper, times(2)).selectList(wrapperCaptor.capture());
        for (Wrapper<CodeChunk> wrapper : wrapperCaptor.getAllValues()) {
            String sqlSegment = wrapper.getCustomSqlSegment();
            assertFalse(sqlSegment.contains("content LIKE"), sqlSegment);
        }
    }

    @Test
    void searchChunks_shouldAppendConfigIntentCandidatesWhenRuntimeConfigQueryIsDistractedByDocs() {
        CodeChunk docsNoise = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("README.md")
                .content("CORS 配置说明和数据库配置排查流程")
                .startLine(1)
                .endLine(30)
                .build();
        CodeChunk frontendConfigPage = CodeChunk.builder()
                .id(2L)
                .scanTaskId(42L)
                .filePath("web-console/src/pages/ModelConfig.tsx")
                .content("export function ModelConfig() { return <button>CORS</button>; }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk applicationYaml = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("backend-spring/src/main/resources/application.yml")
                .content("spring: datasource: url: jdbc:mysql://localhost/sourcelens")
                .startLine(1)
                .endLine(80)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(docsNoise, frontendConfigPage))
                .thenReturn(List.of(applicationYaml));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "CORS 配置 application.yml datasource 在哪里", 5);

        assertEquals(applicationYaml, result.get(0));
        @SuppressWarnings({"rawtypes", "unchecked"})
        ArgumentCaptor<Wrapper<CodeChunk>> wrapperCaptor = ArgumentCaptor.forClass((Class) Wrapper.class);
        verify(codeChunkMapper, times(2)).selectList(wrapperCaptor.capture());
        boolean configRoleQuerySeen = false;
        for (Wrapper<CodeChunk> wrapper : wrapperCaptor.getAllValues()) {
            assertFalse(wrapper.getCustomSqlSegment().contains("content LIKE"), wrapper.getCustomSqlSegment());
            @SuppressWarnings("rawtypes")
            AbstractWrapper abstractWrapper = (AbstractWrapper) wrapper;
            configRoleQuerySeen = configRoleQuerySeen || abstractWrapper.getParamNameValuePairs().values().stream()
                    .anyMatch(value -> String.valueOf(value).contains("application.yml"));
        }
        assertTrue(configRoleQuerySeen);
    }

    @Test
    void searchChunks_shouldAppendTestIntentCandidatesWhenTestFileQueryIsDistractedBySource() {
        CodeChunk sourceNoise = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/service/AuthService.java")
                .content("@Service class AuthService { Token login(LoginRequest request) { return token; } }")
                .startLine(1)
                .endLine(50)
                .build();
        CodeChunk docsNoise = CodeChunk.builder()
                .id(2L)
                .scanTaskId(42L)
                .filePath("docs/auth-testing.md")
                .content("AuthService 单元测试文件说明")
                .startLine(1)
                .endLine(20)
                .build();
        CodeChunk authServiceTest = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("backend-spring/src/test/java/com/example/AuthServiceTest.java")
                .content("class AuthServiceTest { @Test void login_shouldReturnToken() {} }")
                .startLine(1)
                .endLine(80)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(sourceNoise, docsNoise))
                .thenReturn(List.of(authServiceTest));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "AuthService 单元测试文件在哪里", 5);

        assertEquals(authServiceTest, result.get(0));
        @SuppressWarnings({"rawtypes", "unchecked"})
        ArgumentCaptor<Wrapper<CodeChunk>> wrapperCaptor = ArgumentCaptor.forClass((Class) Wrapper.class);
        verify(codeChunkMapper, times(2)).selectList(wrapperCaptor.capture());
        boolean testRoleQuerySeen = false;
        for (Wrapper<CodeChunk> wrapper : wrapperCaptor.getAllValues()) {
            assertFalse(wrapper.getCustomSqlSegment().contains("content LIKE"), wrapper.getCustomSqlSegment());
            @SuppressWarnings("rawtypes")
            AbstractWrapper abstractWrapper = (AbstractWrapper) wrapper;
            testRoleQuerySeen = testRoleQuerySeen || abstractWrapper.getParamNameValuePairs().values().stream()
                    .anyMatch(value -> String.valueOf(value).contains("Test.java"));
        }
        assertTrue(testRoleQuerySeen);
    }

    @Test
    void searchChunks_shouldAppendDocumentationIntentCandidatesWhenDocsQueryIsDistractedBySource() {
        CodeChunk sourceNoise = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/ProjectController.java")
                .content("@RestController class ProjectController { String readme() { return \"project\"; } }")
                .startLine(1)
                .endLine(50)
                .build();
        CodeChunk configNoise = CodeChunk.builder()
                .id(2L)
                .scanTaskId(42L)
                .filePath("backend-spring/src/main/resources/application.yml")
                .content("project: docs")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk readme = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("README.md")
                .content("# SourceLens project documentation")
                .startLine(1)
                .endLine(120)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(sourceNoise, configNoise))
                .thenReturn(List.of(readme));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "项目文档 README.md 在哪里", 5);

        assertEquals(readme, result.get(0));
        @SuppressWarnings({"rawtypes", "unchecked"})
        ArgumentCaptor<Wrapper<CodeChunk>> wrapperCaptor = ArgumentCaptor.forClass((Class) Wrapper.class);
        verify(codeChunkMapper, times(2)).selectList(wrapperCaptor.capture());
        boolean documentationRoleQuerySeen = false;
        for (Wrapper<CodeChunk> wrapper : wrapperCaptor.getAllValues()) {
            assertFalse(wrapper.getCustomSqlSegment().contains("content LIKE"), wrapper.getCustomSqlSegment());
            @SuppressWarnings("rawtypes")
            AbstractWrapper abstractWrapper = (AbstractWrapper) wrapper;
            documentationRoleQuerySeen = documentationRoleQuerySeen || abstractWrapper.getParamNameValuePairs().values().stream()
                    .anyMatch(value -> String.valueOf(value).contains("README.md"));
        }
        assertTrue(documentationRoleQuerySeen);
    }

    @Test
    void searchChunks_shouldAppendRoleIntentCandidatesWhenServiceQueryIsDistractedByServiceChatVue() {
        CodeChunk serviceChat = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("src/main/resources/admin/src/components/chat/ServiceChat.vue")
                .content("function sendMessage() { return service.chat({ message }); }")
                .startLine(1)
                .endLine(60)
                .build();
        CodeChunk service = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/service/OrderService.java")
                .content("@Service class OrderService { public Order approve(OrderCommand command) { return repository.save(command); } }")
                .startLine(1)
                .endLine(40)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(serviceChat))
                .thenReturn(List.of(service));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "service layer business logic", 10);

        assertEquals(service, result.get(0));
        verify(codeChunkMapper, times(2)).selectList(any(Wrapper.class));
    }

    @Test
    void searchChunks_shouldTreatEndpointAsControllerIntentWhenKeywordPoolMissesController() {
        CodeChunk apiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/auth.ts")
                .content("export function login() { return request.post('/login'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk loginPage = CodeChunk.builder()
                .id(2L)
                .scanTaskId(42L)
                .filePath("web-console/src/pages/Login.tsx")
                .content("export function LoginPage() { return <button>login</button>; }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk authController = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthController.java")
                .content("@RestController class AuthController { @PostMapping(\"/login\") public Token login(LoginRequest request) { return service.login(request); } }")
                .startLine(1)
                .endLine(50)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(apiClient, loginPage))
                .thenReturn(List.of(authController));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "login endpoint", 5);

        assertEquals(authController, result.get(0));
        verify(codeChunkMapper, times(2)).selectList(any(Wrapper.class));
    }

    @Test
    void searchChunks_shouldTreatChineseInterfaceAsControllerIntent() {
        CodeChunk readme = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("README.md")
                .content("登录接口说明")
                .startLine(1)
                .endLine(20)
                .build();
        CodeChunk service = CodeChunk.builder()
                .id(2L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/service/AuthService.java")
                .content("@Service class AuthService { Token login(LoginRequest request) { return token; } }")
                .startLine(1)
                .endLine(50)
                .build();
        CodeChunk authController = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthController.java")
                .content("@RestController class AuthController { @PostMapping(\"/login\") public Token login(LoginRequest request) { return service.login(request); } }")
                .startLine(1)
                .endLine(50)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(readme, service))
                .thenReturn(List.of(authController));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "登录接口", 5);

        assertEquals(authController, result.get(0));
        verify(codeChunkMapper, times(2)).selectList(any(Wrapper.class));
    }

    @Test
    void searchChunks_shouldTreatChineseBackendRouteAsControllerIntent() {
        CodeChunk frontendRoute = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/router/order-routes.ts")
                .content("export const routes = [{ path: '/orders', title: '订单路由' }];")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk orderService = CodeChunk.builder()
                .id(2L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/service/OrderService.java")
                .content("@Service class OrderService { Order detail(Long id) { return repository.find(id); } }")
                .startLine(1)
                .endLine(50)
                .build();
        CodeChunk orderController = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/OrderController.java")
                .content("@RestController class OrderController { @GetMapping(\"/orders/{id}\") public Order detail(Long id) { return service.detail(id); } }")
                .startLine(1)
                .endLine(50)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(frontendRoute, orderService))
                .thenReturn(List.of(orderController));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "订单路由", 5);

        assertEquals(orderController, result.get(0));
        verify(codeChunkMapper, times(2)).selectList(any(Wrapper.class));
    }

    @Test
    void searchChunks_shouldAppendEndpointRouteCandidatesWhenQueryIsOnlyApiPath() {
        CodeChunk frontendApi = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/auth.ts")
                .content("export function login() { return request.post('/api/auth/login'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk genericController = CodeChunk.builder()
                .id(2L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/ProjectController.java")
                .content("@RestController class ProjectController { @GetMapping(\"/api/projects\") List<Project> list() { return service.list(); } }")
                .startLine(1)
                .endLine(50)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/SsoController.java")
                .content("@RestController class SsoController { @PostMapping(\"/api/auth/login\") Token login(LoginRequest request) { return service.login(request); } }")
                .startLine(1)
                .endLine(50)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(frontendApi))
                .thenReturn(List.of(genericController, target));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/api/auth/login", 5);

        assertEquals(target, result.get(0));
        assertTrue(result.contains(frontendApi));
        @SuppressWarnings({"rawtypes", "unchecked"})
        ArgumentCaptor<Wrapper<CodeChunk>> wrapperCaptor = ArgumentCaptor.forClass((Class) Wrapper.class);
        verify(codeChunkMapper, times(2)).selectList(wrapperCaptor.capture());
        boolean endpointRouteCandidateQuerySeen = false;
        for (Wrapper<CodeChunk> wrapper : wrapperCaptor.getAllValues()) {
            assertFalse(wrapper.getCustomSqlSegment().contains("content LIKE"), wrapper.getCustomSqlSegment());
            @SuppressWarnings("rawtypes")
            AbstractWrapper abstractWrapper = (AbstractWrapper) wrapper;
            endpointRouteCandidateQuerySeen = endpointRouteCandidateQuerySeen || abstractWrapper.getParamNameValuePairs().values().stream()
                    .anyMatch(value -> String.valueOf(value).contains("Controller.java"));
        }
        assertTrue(endpointRouteCandidateQuerySeen);
    }

    @Test
    void searchChunks_shouldResolveQualifiedRouteConstantsFromCandidateRouteHolderFile() {
        CodeChunk routeHolder = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/routes/AuthRoutes.java")
                .content("""
                        public final class AuthRoutes {
                            public static final String LOGIN = "/api/auth/login";
                        }
                        """)
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk targetController = CodeChunk.builder()
                .id(2L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthController.java")
                .content("""
                        @RestController
                        class AuthController {
                            @GetMapping(AuthRoutes.LOGIN)
                            Token currentLoginState() { return service.currentLoginState(); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();
        CodeChunk wrongMethod = CodeChunk.builder()
                .id(3L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthPostController.java")
                .content("""
                        @RestController
                        class AuthPostController {
                            @PostMapping("/api/auth/login")
                            Token login(LoginRequest request) { return service.login(request); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();

        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of())
                .thenReturn(List.of(targetController, wrongMethod, routeHolder));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "GET /api/auth/login", 5);

        assertEquals(targetController, result.get(0));
        assertTrue(result.contains(routeHolder));
    }

    @Test
    void rankWithPreviousSameFileContext_shouldPrefilterNonRouteNoiseForEndpointQueries() throws Exception {
        List<CodeChunk> chunks = new ArrayList<>();
        for (int index = 0; index < 500; index++) {
            chunks.add(CodeChunk.builder()
                    .id((long) index)
                    .scanTaskId(42L)
                    .filePath("src/main/java/com/example/service/NoiseService" + index + ".java")
                    .content("""
                            class NoiseService%s {
                                String execute() { return "plain business text without route mappings"; }
                            }
                            """.formatted(index))
                    .startLine(1)
                    .endLine(40)
                    .build());
        }
        CodeChunk prefixChunk = CodeChunk.builder()
                .id(900L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthController.java")
                .content("""
                        @RestController
                        @RequestMapping("/api/auth")
                        class AuthController {
                        """)
                .startLine(1)
                .endLine(30)
                .build();
        CodeChunk methodChunk = CodeChunk.builder()
                .id(901L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthController.java")
                .content("""
                            @GetMapping("/login")
                            Token currentLoginState() { return service.currentLoginState(); }
                        }
                        """)
                .startLine(31)
                .endLine(80)
                .build();
        CodeChunk routeHolder = CodeChunk.builder()
                .id(902L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/routes/AuthRoutes.java")
                .content("""
                        public final class AuthRoutes {
                            public static final String LOGIN = "/api/auth/login";
                        }
                        """)
                .startLine(1)
                .endLine(40)
                .build();
        chunks.add(prefixChunk);
        chunks.add(methodChunk);
        chunks.add(routeHolder);

        List<CodeChunk> routeCandidates = routeAwareCandidateChunks(chunks, List.of("/api/auth/login"));

        assertFalse(routeCandidates.stream().anyMatch(chunk -> chunk.getFilePath().contains("NoiseService")));
        assertTrue(routeCandidates.contains(prefixChunk));
        assertTrue(routeCandidates.contains(methodChunk));
        assertTrue(routeCandidates.contains(routeHolder));
        assertTrue(routeCandidates.size() < chunks.size() / 20);

        List<CodeChunk> ranked = CodeChunkRanker.rankWithPreviousSameFileContext(
                chunks,
                "GET /api/auth/login",
                3
        );
        assertEquals(methodChunk, ranked.get(0));
    }

    @Test
    void searchChunks_shouldResolveQualifiedRouteConstantsFromNamedApiUrlHolderFiles() {
        for (String holderFileName : List.of(
                "ApiConstants.java",
                "ApiRoutes.java",
                "UrlConstants.java",
                "UriConstants.java",
                "ApiUrls.java",
                "ApiUris.java",
                "Paths.java",
                "Endpoints.java"
        )) {
            org.mockito.Mockito.reset(codeChunkMapper);
            String holderClass = holderFileName.substring(0, holderFileName.indexOf(".java"));
            CodeChunk routeHolder = CodeChunk.builder()
                    .id(1L)
                    .scanTaskId(42L)
                    .filePath("src/main/java/com/example/constants/" + holderFileName)
                    .content("""
                            public final class %s {
                                public static final String LOGIN = "/api/auth/login";
                            }
                            """.formatted(holderClass))
                    .startLine(1)
                    .endLine(40)
                    .build();
            CodeChunk targetController = CodeChunk.builder()
                    .id(2L)
                    .scanTaskId(42L)
                    .filePath("src/main/java/com/example/controller/AuthController.java")
                    .content("""
                            @RestController
                            class AuthController {
                                @GetMapping(%s.LOGIN)
                                Token currentLoginState() { return service.currentLoginState(); }
                            }
                            """.formatted(holderClass))
                    .startLine(1)
                    .endLine(80)
                    .build();
            CodeChunk wrongMethod = CodeChunk.builder()
                    .id(3L)
                    .scanTaskId(42L)
                    .filePath("src/main/java/com/example/controller/AuthPostController.java")
                    .content("""
                            @RestController
                            class AuthPostController {
                                @PostMapping("/api/auth/login")
                                Token login(LoginRequest request) { return service.login(request); }
                            }
                            """)
                    .startLine(1)
                    .endLine(80)
                    .build();

            int[] callIndex = {0};
            boolean[] holderCandidateQuerySeen = {false};
            when(codeChunkMapper.selectList(any(Wrapper.class))).thenAnswer(invocation -> {
                @SuppressWarnings("rawtypes")
                AbstractWrapper abstractWrapper = (AbstractWrapper) invocation.getArgument(0);
                abstractWrapper.getCustomSqlSegment();
                holderCandidateQuerySeen[0] = holderCandidateQuerySeen[0]
                        || abstractWrapper.getParamNameValuePairs().values().stream()
                        .anyMatch(value -> String.valueOf(value).contains(holderFileName));
                int currentCall = callIndex[0]++;
                if (currentCall == 0) {
                    return List.of();
                }
                return List.of(targetController, wrongMethod, routeHolder);
            });

            List<CodeChunk> result = codeChunkService.searchChunks(42L, "GET /api/auth/login", 5);

            assertEquals(targetController, result.get(0), holderFileName);
            assertTrue(holderCandidateQuerySeen[0], holderFileName);
        }
    }

    @Test
    void searchChunks_shouldResolveQualifiedRouteConstantsFromNamedKotlinApiUrlHolderFiles() {
        for (String holderFileName : List.of(
                "ApiRoutes.kt",
                "UrlConstants.kt",
                "UriConstants.kt",
                "ApiUrls.kt",
                "ApiUris.kt",
                "Paths.kt",
                "Endpoints.kt"
        )) {
            org.mockito.Mockito.reset(codeChunkMapper);
            String holderClass = holderFileName.substring(0, holderFileName.indexOf(".kt"));
            CodeChunk routeHolder = CodeChunk.builder()
                    .id(1L)
                    .scanTaskId(42L)
                    .filePath("src/main/kotlin/com/example/constants/" + holderFileName)
                    .content("""
                            object %s {
                                const val LOGIN = "/api/auth/login"
                            }
                            """.formatted(holderClass))
                    .startLine(1)
                    .endLine(40)
                    .build();
            CodeChunk targetController = CodeChunk.builder()
                    .id(2L)
                    .scanTaskId(42L)
                    .filePath("src/main/kotlin/com/example/controller/AuthController.kt")
                    .content("""
                            @RestController
                            class AuthController {
                                @GetMapping(%s.LOGIN)
                                fun currentLoginState(): Token = service.currentLoginState()
                            }
                            """.formatted(holderClass))
                    .startLine(1)
                    .endLine(80)
                    .build();
            CodeChunk wrongMethod = CodeChunk.builder()
                    .id(3L)
                    .scanTaskId(42L)
                    .filePath("src/main/kotlin/com/example/controller/AuthPostController.kt")
                    .content("""
                            @RestController
                            class AuthPostController {
                                @PostMapping("/api/auth/login")
                                fun login(request: LoginRequest): Token = service.login(request)
                            }
                            """)
                    .startLine(1)
                    .endLine(80)
                    .build();

            int[] callIndex = {0};
            boolean[] holderCandidateQuerySeen = {false};
            when(codeChunkMapper.selectList(any(Wrapper.class))).thenAnswer(invocation -> {
                @SuppressWarnings("rawtypes")
                AbstractWrapper abstractWrapper = (AbstractWrapper) invocation.getArgument(0);
                abstractWrapper.getCustomSqlSegment();
                holderCandidateQuerySeen[0] = holderCandidateQuerySeen[0]
                        || abstractWrapper.getParamNameValuePairs().values().stream()
                        .anyMatch(value -> String.valueOf(value).contains(holderFileName));
                int currentCall = callIndex[0]++;
                if (currentCall == 0) {
                    return List.of();
                }
                return List.of(targetController, wrongMethod, routeHolder);
            });

            List<CodeChunk> result = codeChunkService.searchChunks(42L, "GET /api/auth/login", 5);

            assertEquals(targetController, result.get(0), holderFileName);
            assertTrue(holderCandidateQuerySeen[0], holderFileName);
        }
    }

    @Test
    void searchChunks_shouldResolveQualifiedRouteConstantsFromKotlinObjectHolderFile() {
        CodeChunk routeHolder = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("src/main/kotlin/com/example/constants/ApiConstants.kt")
                .content("""
                        object ApiConstants {
                            const val LOGIN = "/api/auth/login"
                        }
                        """)
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk targetController = CodeChunk.builder()
                .id(2L)
                .scanTaskId(42L)
                .filePath("src/main/kotlin/com/example/controller/AuthController.kt")
                .content("""
                        @RestController
                        class AuthController {
                            @GetMapping(ApiConstants.LOGIN)
                            fun currentLoginState(): Token = service.currentLoginState()
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();
        CodeChunk wrongMethod = CodeChunk.builder()
                .id(3L)
                .scanTaskId(42L)
                .filePath("src/main/kotlin/com/example/controller/AuthPostController.kt")
                .content("""
                        @RestController
                        class AuthPostController {
                            @PostMapping("/api/auth/login")
                            fun login(request: LoginRequest): Token = service.login(request)
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();

        int[] callIndex = {0};
        boolean[] kotlinHolderCandidateQuerySeen = {false};
        when(codeChunkMapper.selectList(any(Wrapper.class))).thenAnswer(invocation -> {
            @SuppressWarnings("rawtypes")
            AbstractWrapper abstractWrapper = (AbstractWrapper) invocation.getArgument(0);
            abstractWrapper.getCustomSqlSegment();
            kotlinHolderCandidateQuerySeen[0] = kotlinHolderCandidateQuerySeen[0]
                    || abstractWrapper.getParamNameValuePairs().values().stream()
                    .anyMatch(value -> String.valueOf(value).contains("ApiConstants.kt"));
            int currentCall = callIndex[0]++;
            if (currentCall == 0) {
                return List.of();
            }
            return List.of(targetController, wrongMethod, routeHolder);
        });

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "GET /api/auth/login", 5);

        assertEquals(targetController, result.get(0));
        assertTrue(kotlinHolderCandidateQuerySeen[0]);
    }

    @Test
    void searchChunks_shouldResolveQualifiedRouteConstantsFromNestedKotlinObjectHolderFile() {
        CodeChunk routeHolder = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("src/main/kotlin/com/example/constants/ApiRoutes.kt")
                .content("""
                        object ApiRoutes {
                            object Auth {
                                const val LOGIN = "/api/auth/login"
                            }
                        }
                        """)
                .startLine(1)
                .endLine(60)
                .build();
        CodeChunk targetController = CodeChunk.builder()
                .id(2L)
                .scanTaskId(42L)
                .filePath("src/main/kotlin/com/example/controller/AuthController.kt")
                .content("""
                        @RestController
                        class AuthController {
                            @GetMapping(ApiRoutes.Auth.LOGIN)
                            fun currentLoginState(): Token = service.currentLoginState()
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();
        CodeChunk wrongMethod = CodeChunk.builder()
                .id(3L)
                .scanTaskId(42L)
                .filePath("src/main/kotlin/com/example/controller/AuthPostController.kt")
                .content("""
                        @RestController
                        class AuthPostController {
                            @PostMapping("/api/auth/login")
                            fun login(request: LoginRequest): Token = service.login(request)
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();

        int[] callIndex = {0};
        boolean[] kotlinNestedHolderCandidateQuerySeen = {false};
        when(codeChunkMapper.selectList(any(Wrapper.class))).thenAnswer(invocation -> {
            @SuppressWarnings("rawtypes")
            AbstractWrapper abstractWrapper = (AbstractWrapper) invocation.getArgument(0);
            abstractWrapper.getCustomSqlSegment();
            kotlinNestedHolderCandidateQuerySeen[0] = kotlinNestedHolderCandidateQuerySeen[0]
                    || abstractWrapper.getParamNameValuePairs().values().stream()
                    .anyMatch(value -> String.valueOf(value).contains("ApiRoutes.kt"));
            int currentCall = callIndex[0]++;
            if (currentCall == 0) {
                return List.of();
            }
            return List.of(targetController, wrongMethod, routeHolder);
        });

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "GET /api/auth/login", 5);

        assertEquals(targetController, result.get(0));
        assertTrue(kotlinNestedHolderCandidateQuerySeen[0]);
        assertTrue(result.contains(routeHolder));
    }

    @Test
    void searchChunks_shouldResolveQualifiedRouteConstantsFromOneLineNestedKotlinObjectHolderFile() {
        CodeChunk routeHolder = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("src/main/kotlin/com/example/constants/ApiRoutes.kt")
                .content("object ApiRoutes { object Auth { const val LOGIN = \"/api/auth/login\" } }")
                .startLine(1)
                .endLine(1)
                .build();
        CodeChunk targetController = CodeChunk.builder()
                .id(2L)
                .scanTaskId(42L)
                .filePath("src/main/kotlin/com/example/controller/AuthController.kt")
                .content("""
                        @RestController
                        class AuthController {
                            @GetMapping(ApiRoutes.Auth.LOGIN)
                            fun currentLoginState(): Token = service.currentLoginState()
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();
        CodeChunk wrongMethod = CodeChunk.builder()
                .id(3L)
                .scanTaskId(42L)
                .filePath("src/main/kotlin/com/example/controller/AuthPostController.kt")
                .content("""
                        @RestController
                        class AuthPostController {
                            @PostMapping("/api/auth/login")
                            fun login(request: LoginRequest): Token = service.login(request)
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();

        int[] callIndex = {0};
        boolean[] kotlinNestedHolderCandidateQuerySeen = {false};
        when(codeChunkMapper.selectList(any(Wrapper.class))).thenAnswer(invocation -> {
            @SuppressWarnings("rawtypes")
            AbstractWrapper abstractWrapper = (AbstractWrapper) invocation.getArgument(0);
            abstractWrapper.getCustomSqlSegment();
            kotlinNestedHolderCandidateQuerySeen[0] = kotlinNestedHolderCandidateQuerySeen[0]
                    || abstractWrapper.getParamNameValuePairs().values().stream()
                    .anyMatch(value -> String.valueOf(value).contains("ApiRoutes.kt"));
            int currentCall = callIndex[0]++;
            if (currentCall == 0) {
                return List.of();
            }
            return List.of(targetController, wrongMethod, routeHolder);
        });

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "GET /api/auth/login", 5);

        assertEquals(targetController, result.get(0));
        assertTrue(kotlinNestedHolderCandidateQuerySeen[0]);
        assertTrue(result.contains(routeHolder));
    }

    @Test
    void searchChunks_shouldNotFallbackCrossFileQualifiedRouteConstantToSimpleName() {
        CodeChunk routeHolder = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/routes/AuthRoutes.java")
                .content("""
                        public final class AuthRoutes {
                            public static final String ROOT = "/api/auth";
                        }
                        public final class MarketingRoutes {
                            public static final String LOGIN = "/login";
                        }
                        """)
                .startLine(1)
                .endLine(60)
                .build();
        CodeChunk brokenController = CodeChunk.builder()
                .id(2L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/BrokenAuthController.java")
                .content("""
                        @RestController
                        class BrokenAuthController {
                            @GetMapping(AuthRoutes.ROOT + AuthRoutes.LOGIN)
                            Token brokenLogin() { return service.brokenLogin(); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();
        CodeChunk targetController = CodeChunk.builder()
                .id(3L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthController.java")
                .content("""
                        @RestController
                        class AuthController {
                            @GetMapping("/api/auth/login")
                            Token currentLoginState() { return service.currentLoginState(); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();

        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of())
                .thenReturn(List.of(brokenController, targetController, routeHolder));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "GET /api/auth/login", 5);

        assertEquals(targetController, result.get(0));
    }

    @Test
    void rankWithPreviousSameFileContext_shouldNotTreatGenericConstantsAsExternalRouteHolder() {
        CodeChunk genericConstants = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/constants/Constants.java")
                .content("""
                        public final class Constants {
                            public static final String LOGIN = "/api/auth/login";
                        }
                        """)
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk unresolvedController = CodeChunk.builder()
                .id(2L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AaaConstantsController.java")
                .content("""
                        @RestController
                        class AaaConstantsController {
                            @GetMapping(Constants.LOGIN)
                            Token constantsLogin() { return service.constantsLogin(); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();
        CodeChunk literalTarget = CodeChunk.builder()
                .id(3L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/ZzzController.java")
                .content("""
                        @RestController
                        class ZzzController {
                            @GetMapping("/api/auth/login")
                            Token currentState() { return service.currentState(); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();

        List<CodeChunk> result = CodeChunkRanker.rankWithPreviousSameFileContext(
                List.of(genericConstants, unresolvedController, literalTarget),
                "GET /api/auth/login",
                3
        );

        assertEquals(literalTarget, result.get(0));
    }

    @Test
    void rankWithPreviousSameFileContext_shouldNotTreatSecurityConstantsAsUriRouteHolder() {
        CodeChunk securityConstants = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/security/SecurityConstants.java")
                .content("""
                        public final class SecurityConstants {
                            public static final String LOGIN = "/api/auth/login";
                        }
                        """)
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk unresolvedController = CodeChunk.builder()
                .id(2L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AaaSecurityController.java")
                .content("""
                        @RestController
                        class AaaSecurityController {
                            @GetMapping(SecurityConstants.LOGIN)
                            Token securityLogin() { return service.securityLogin(); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();
        CodeChunk literalTarget = CodeChunk.builder()
                .id(3L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/ZzzController.java")
                .content("""
                        @RestController
                        class ZzzController {
                            @GetMapping("/api/auth/login")
                            Token currentState() { return service.currentState(); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();

        List<CodeChunk> result = CodeChunkRanker.rankWithPreviousSameFileContext(
                List.of(securityConstants, unresolvedController, literalTarget),
                "GET /api/auth/login",
                3
        );

        assertEquals(literalTarget, result.get(0));
    }

    @Test
    void rank_shouldPreferSpringRouteWithMatchingHttpMethodHint() {
        CodeChunk wrongMethod = CodeChunk.builder()
                .id(98L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthPostController.java")
                .content("""
                        @RestController
                        class AuthPostController {
                            @PostMapping("/api/auth/login")
                            Token login(LoginRequest request) {
                                String docs = "GET login endpoint get get get";
                                return service.login(request);
                            }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthGetController.java")
                .content("""
                        @RestController
                        class AuthGetController {
                            @GetMapping("/api/auth/login")
                            Token currentLoginState() { return service.currentLoginState(); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();

        List<CodeChunk> result = CodeChunkRanker.rank(List.of(wrongMethod, target), "GET /api/auth/login", 2);

        assertEquals(target, result.get(0));
    }

    @Test
    void rank_shouldNotTreatUnrelatedSameChunkSpringMethodAsRouteMethodMatch() {
        CodeChunk wrongMethod = CodeChunk.builder()
                .id(98L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthController.java")
                .content("""
                        @RestController
                        class AuthController {
                            @PostMapping("/api/auth/login")
                            Token login(LoginRequest request) { return service.login(request); }

                            @GetMapping("/health")
                            String health() {
                                return "GET login docs";
                            }
                        }
                        """)
                .startLine(1)
                .endLine(120)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthGetController.java")
                .content("""
                        @RestController
                        class AuthGetController {
                            @GetMapping("/api/auth/login")
                            Token currentLoginState() { return service.currentLoginState(); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();

        List<CodeChunk> result = CodeChunkRanker.rank(List.of(wrongMethod, target), "GET /api/auth/login", 2);

        assertEquals(target, result.get(0));
    }

    @Test
    void rankWithPreviousSameFileContext_shouldNotTreatUnrelatedPreviousMethodAsRouteMethodMatch() {
        CodeChunk target = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthGetController.java")
                .content("""
                        @RestController
                        class AuthGetController {
                            @GetMapping("/api/auth/login")
                            Token currentLoginState() { return service.currentLoginState(); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();
        CodeChunk prefixChunk = CodeChunk.builder()
                .id(98L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthController.java")
                .content("""
                        @RestController
                        @RequestMapping("/api/auth")
                        class AuthController {
                            @GetMapping("/health")
                            String health() { return "ok"; }
                        """)
                .startLine(1)
                .endLine(50)
                .build();
        CodeChunk wrongMethod = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthController.java")
                .content("""
                            @PostMapping("/login")
                            Token login(LoginRequest request) { return service.login(request); }
                        }
                        """)
                .startLine(51)
                .endLine(100)
                .build();

        List<CodeChunk> result = CodeChunkRanker.rankWithPreviousSameFileContext(
                List.of(target, prefixChunk, wrongMethod),
                "GET /api/auth/login",
                3
        );

        assertEquals(target, result.get(0));
    }

    @Test
    void rank_shouldBindRequestMappingRequestMethodToMatchingRoute() {
        CodeChunk wrongMethod = CodeChunk.builder()
                .id(98L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthPostController.java")
                .content("""
                        @RestController
                        class AuthPostController {
                            @RequestMapping(path = "/api/auth/login", method = RequestMethod.POST)
                            Token login(LoginRequest request) { return service.login(request); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthGetController.java")
                .content("""
                        @RestController
                        class AuthGetController {
                            @RequestMapping(path = "/api/auth/login", method = RequestMethod.GET)
                            Token currentLoginState() { return service.currentLoginState(); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();

        List<CodeChunk> result = CodeChunkRanker.rank(List.of(wrongMethod, target), "GET /api/auth/login", 2);

        assertEquals(target, result.get(0));
    }

    @Test
    void rank_shouldBindStaticImportedRequestMappingMethodToMatchingRoute() {
        CodeChunk wrongMethod = CodeChunk.builder()
                .id(98L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthPostController.java")
                .content("""
                        @RestController
                        class AuthPostController {
                            @RequestMapping(path = "/api/auth/login", method = POST)
                            Token login(LoginRequest request) { return service.login(request); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthGetController.java")
                .content("""
                        @RestController
                        class AuthGetController {
                            @RequestMapping(path = "/api/auth/login", method = GET)
                            Token currentLoginState() { return service.currentLoginState(); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();

        List<CodeChunk> result = CodeChunkRanker.rank(List.of(wrongMethod, target), "GET /api/auth/login", 2);

        assertEquals(target, result.get(0));
    }

    @Test
    void rank_shouldBindStaticImportedRequestMappingMethodArrayToMatchingRoute() {
        CodeChunk wrongMethod = CodeChunk.builder()
                .id(98L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthPostController.java")
                .content("""
                        @RestController
                        class AuthPostController {
                            @RequestMapping(path = "/api/auth/login", method = { POST, PUT })
                            Token login(LoginRequest request) { return service.login(request); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthGetController.java")
                .content("""
                        @RestController
                        class AuthGetController {
                            @RequestMapping(path = "/api/auth/login", method = { GET, HEAD })
                            Token currentLoginState() { return service.currentLoginState(); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();

        List<CodeChunk> result = CodeChunkRanker.rank(List.of(wrongMethod, target), "GET /api/auth/login", 2);

        assertEquals(target, result.get(0));
    }

    @Test
    void rank_shouldBindQualifiedRequestMappingMethodArrayToMatchingRoute() {
        CodeChunk wrongMethod = CodeChunk.builder()
                .id(98L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthPostController.java")
                .content("""
                        @RestController
                        class AuthPostController {
                            @RequestMapping(path = "/api/auth/login", method = { RequestMethod.POST, RequestMethod.PUT })
                            Token login(LoginRequest request) { return service.login(request); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthGetController.java")
                .content("""
                        @RestController
                        class AuthGetController {
                            @RequestMapping(path = "/api/auth/login", method = { RequestMethod.GET, RequestMethod.HEAD })
                            Token currentLoginState() { return service.currentLoginState(); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();

        List<CodeChunk> result = CodeChunkRanker.rank(List.of(wrongMethod, target), "GET /api/auth/login", 2);

        assertEquals(target, result.get(0));
    }

    @Test
    void rank_shouldUseHeadRequestMethodFromStaticImportedArray() {
        CodeChunk wrongMethod = CodeChunk.builder()
                .id(98L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthPostController.java")
                .content("""
                        @RestController
                        class AuthPostController {
                            @RequestMapping(path = "/api/auth/login", method = { GET, POST })
                            Token login(LoginRequest request) { return service.login(request); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthHeadController.java")
                .content("""
                        @RestController
                        class AuthHeadController {
                            @RequestMapping(path = "/api/auth/login", method = { HEAD, OPTIONS })
                            Token currentLoginState() { return service.currentLoginState(); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();

        List<CodeChunk> result = CodeChunkRanker.rank(List.of(wrongMethod, target), "HEAD /api/auth/login", 2);

        assertEquals(target, result.get(0));
    }

    @Test
    void rank_shouldReadRouteAfterKotlinRequestMappingArrayOfMethod() {
        CodeChunk wrongMethod = CodeChunk.builder()
                .id(98L)
                .scanTaskId(42L)
                .filePath("src/main/kotlin/com/example/controller/AAuthPostController.kt")
                .content("""
                        @RestController
                        class AAuthPostController {
                            @RequestMapping(method = arrayOf(RequestMethod.POST), path = "/api/auth/login")
                            fun login(request: LoginRequest): Token = service.login(request)
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/kotlin/com/example/controller/AuthGetController.kt")
                .content("""
                        @RestController
                        class AuthGetController {
                            @RequestMapping(method = arrayOf(RequestMethod.GET), path = "/api/auth/login")
                            fun currentLoginState(): Token = service.currentLoginState()
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();

        List<CodeChunk> result = CodeChunkRanker.rank(List.of(wrongMethod, target), "GET /api/auth/login", 2);

        assertEquals(target, result.get(0));
    }

    @Test
    void springMappingLiterals_shouldReadRouteAfterNestedKotlinRequestMappingArrayOfMethod() throws Exception {
        List<String> literals = springMappingLiteralValues("""
                @RestController
                class AuthController {
                    @RequestMapping(method = arrayOf(RequestMethod.GET), path = "/api/auth/login")
                    fun currentLoginState(): Token = service.currentLoginState()
                }
                """, "requestmapping");

        assertTrue(literals.contains("/api/auth/login"));
    }

    @Test
    void springMappingLiterals_shouldIgnoreMappingsInsideCommentsAndStrings() throws Exception {
        List<String> literals = springMappingLiteralValues("""
                @RestController
                class AuthController {
                    private static final String DOCS = "@GetMapping(\\"/fake/string\\")";
                    // @GetMapping("/fake/line-comment")
                    /*
                     * @GetMapping("/fake/block-comment")
                     */
                    @GetMapping("/api/auth/login")
                    Token currentLoginState() { return service.currentLoginState(); }
                }
                """, "getmapping");

        assertTrue(literals.contains("/api/auth/login"));
        assertFalse(literals.contains("/fake/string"));
        assertFalse(literals.contains("/fake/line-comment"));
        assertFalse(literals.contains("/fake/block-comment"));
    }

    @Test
    void rank_shouldIgnoreCommentedSpringMappingForEndpointRoute() {
        CodeChunk fakeCommentRoute = CodeChunk.builder()
                .id(98L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/ACommentedAuthController.java")
                .content("""
                        @RestController
                        class ACommentedAuthController {
                            // @GetMapping("/api/auth/login")
                            String docsOnly() { return "not a route"; }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthGetController.java")
                .content("""
                        @RestController
                        class AuthGetController {
                            @GetMapping("/api/auth/login")
                            Token currentLoginState() { return service.currentLoginState(); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();

        List<CodeChunk> result = CodeChunkRanker.rank(List.of(fakeCommentRoute, target), "GET /api/auth/login", 2);

        assertEquals(target, result.get(0));
    }

    @Test
    void rank_shouldIgnoreCommentOnlyRouteMentionForEndpointRoute() {
        CodeChunk commentOnlyRoute = CodeChunk.builder()
                .id(98L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/ACommentedAuthController.java")
                .content("""
                        @RestController
                        class ACommentedAuthController {
                            // Historical route mention: "/api/auth/login"
                            String docsOnly() { return "not a route"; }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();
        CodeChunk frontendApi = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/auth.ts")
                .content("export function login() { return request.post('/api/auth/login'); }")
                .startLine(1)
                .endLine(40)
                .build();

        List<CodeChunk> result = CodeChunkRanker.rank(List.of(commentOnlyRoute, frontendApi), "GET /api/auth/login", 2);

        assertEquals(frontendApi, result.get(0));
    }

    @Test
    void endpointRouteHintScore_shouldIgnoreCommentOnlyRouteMentionButKeepRealStringRoute() throws Exception {
        CodeChunk commentOnlyRoute = CodeChunk.builder()
                .id(98L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/ACommentedAuthController.java")
                .content("""
                        @RestController
                        class ACommentedAuthController {
                            // Historical route mention: "/api/auth/login"
                            String docsOnly() { return "not a route"; }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();
        CodeChunk frontendApi = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/auth.ts")
                .content("export function login() { return request.post('/api/auth/login'); }")
                .startLine(1)
                .endLine(40)
                .build();

        double commentOnlyScore = endpointRouteHintScore(
                commentOnlyRoute,
                List.of("/api/auth/login"),
                List.of("get")
        );
        double frontendScore = endpointRouteHintScore(
                frontendApi,
                List.of("/api/auth/login"),
                List.of("get")
        );

        assertEquals(0.0, commentOnlyScore);
        assertTrue(frontendScore >= 300.0);
    }

    @Test
    void endpointRouteHintScore_shouldIgnoreNonControllerCommentOnlyQuotedRoute() throws Exception {
        CodeChunk lineCommentOnlyRoute = CodeChunk.builder()
                .id(98L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/auth.ts")
                .content("// Historical endpoint literal: \"/api/auth/login\"")
                .startLine(1)
                .endLine(1)
                .build();
        CodeChunk blockCommentOnlyRoute = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/auth.ts")
                .content("/* Historical endpoint literal: \"/api/auth/login\" */")
                .startLine(1)
                .endLine(1)
                .build();

        assertEquals(0.0, endpointRouteHintScore(
                lineCommentOnlyRoute,
                List.of("/api/auth/login"),
                List.of("get")
        ));
        assertEquals(0.0, endpointRouteHintScore(
                blockCommentOnlyRoute,
                List.of("/api/auth/login"),
                List.of("get")
        ));
    }

    @Test
    void rank_shouldNotTreatQuotedRequestMappingMethodTextAsHttpMethod() {
        CodeChunk quotedTextOnly = CodeChunk.builder()
                .id(98L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthPostController.java")
                .content("""
                        @RestController
                        class AuthPostController {
                            @RequestMapping(path = "/api/auth/login", method = POST, name = "GET")
                            Token login(LoginRequest request) { return service.login(request); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthGetController.java")
                .content("""
                        @RestController
                        class AuthGetController {
                            @RequestMapping(path = "/api/auth/login", method = GET)
                            Token currentLoginState() { return service.currentLoginState(); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();

        List<CodeChunk> result = CodeChunkRanker.rank(List.of(quotedTextOnly, target), "GET /api/auth/login", 2);

        assertEquals(target, result.get(0));
    }

    @Test
    void rank_shouldNotTreatQuotedQualifiedRequestMappingMethodTextAsHttpMethod() {
        CodeChunk quotedTextOnly = CodeChunk.builder()
                .id(98L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthPostController.java")
                .content("""
                        @RestController
                        class AuthPostController {
                            @RequestMapping(path = "/api/auth/login", method = POST, name = "RequestMethod.GET")
                            Token login(LoginRequest request) { return service.login(request); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthGetController.java")
                .content("""
                        @RestController
                        class AuthGetController {
                            @RequestMapping(path = "/api/auth/login", method = GET)
                            Token currentLoginState() { return service.currentLoginState(); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();

        List<CodeChunk> result = CodeChunkRanker.rank(List.of(quotedTextOnly, target), "GET /api/auth/login", 2);

        assertEquals(target, result.get(0));
    }

    @Test
    void rank_shouldNotTreatQuotedMethodAttributeTextAsRequestMappingMethod() {
        CodeChunk quotedTextOnly = CodeChunk.builder()
                .id(98L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthPostController.java")
                .content("""
                        @RestController
                        class AuthPostController {
                            @RequestMapping(path = "/api/auth/login", params = "method=GET", method = POST)
                            Token login(LoginRequest request) { return service.login(request); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthGetController.java")
                .content("""
                        @RestController
                        class AuthGetController {
                            @RequestMapping(path = "/api/auth/login", method = GET)
                            Token currentLoginState() { return service.currentLoginState(); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();

        List<CodeChunk> result = CodeChunkRanker.rank(List.of(quotedTextOnly, target), "GET /api/auth/login", 2);

        assertEquals(target, result.get(0));
    }

    @Test
    void rank_shouldNotTreatQuotedQualifiedMethodAttributeTextAsRequestMappingMethod() {
        CodeChunk quotedTextOnly = CodeChunk.builder()
                .id(98L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthPostController.java")
                .content("""
                        @RestController
                        class AuthPostController {
                            @RequestMapping(path = "/api/auth/login", params = "x=RequestMethod.GET", method = POST)
                            Token login(LoginRequest request) { return service.login(request); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthGetController.java")
                .content("""
                        @RestController
                        class AuthGetController {
                            @RequestMapping(path = "/api/auth/login", method = GET)
                            Token currentLoginState() { return service.currentLoginState(); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();

        List<CodeChunk> result = CodeChunkRanker.rank(List.of(quotedTextOnly, target), "GET /api/auth/login", 2);

        assertEquals(target, result.get(0));
    }

    @Test
    void rank_shouldNotTreatCommentedRequestMappingMethodTextAsHttpMethod() {
        CodeChunk commentedTextOnly = CodeChunk.builder()
                .id(98L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthPostController.java")
                .content("""
                        @RestController
                        class AuthPostController {
                            @RequestMapping(path = "/api/auth/login", method = POST /* GET */)
                            Token login(LoginRequest request) { return service.login(request); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthGetController.java")
                .content("""
                        @RestController
                        class AuthGetController {
                            @RequestMapping(path = "/api/auth/login", method = GET)
                            Token currentLoginState() { return service.currentLoginState(); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();

        List<CodeChunk> result = CodeChunkRanker.rank(List.of(commentedTextOnly, target), "GET /api/auth/login", 2);

        assertEquals(target, result.get(0));
    }

    @Test
    void rank_shouldNotTreatCommentedMethodAttributeAsRequestMappingMethod() {
        CodeChunk commentedTextOnly = CodeChunk.builder()
                .id(98L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthPostController.java")
                .content("""
                        @RestController
                        class AuthPostController {
                            @RequestMapping(path = "/api/auth/login", /* method = GET, */ method = POST)
                            Token login(LoginRequest request) { return service.login(request); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthGetController.java")
                .content("""
                        @RestController
                        class AuthGetController {
                            @RequestMapping(path = "/api/auth/login", method = GET)
                            Token currentLoginState() { return service.currentLoginState(); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();

        List<CodeChunk> result = CodeChunkRanker.rank(List.of(commentedTextOnly, target), "GET /api/auth/login", 2);

        assertEquals(target, result.get(0));
    }

    @Test
    void rank_shouldNotTreatBlockCommentInsideRequestMappingMethodArrayAsHttpMethod() {
        CodeChunk commentedTextOnly = CodeChunk.builder()
                .id(98L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthPostController.java")
                .content("""
                        @RestController
                        class AuthPostController {
                            @RequestMapping(path = "/api/auth/login", method = { POST /* GET */, PUT })
                            Token login(LoginRequest request) { return service.login(request); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthGetController.java")
                .content("""
                        @RestController
                        class AuthGetController {
                            @RequestMapping(path = "/api/auth/login", method = GET)
                            Token currentLoginState() { return service.currentLoginState(); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();

        List<CodeChunk> result = CodeChunkRanker.rank(List.of(commentedTextOnly, target), "GET /api/auth/login", 2);

        assertEquals(target, result.get(0));
    }

    @Test
    void searchChunks_shouldPreferControllerWithComposedSpringRouteForApiPathQuery() {
        CodeChunk frontendApi = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/auth.ts")
                .content("export function login() { return request.post('/api/auth/login'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk exactButGenericClient = CodeChunk.builder()
                .id(2L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/generated-auth-client.ts")
                .content("export const loginPath = '/api/auth/login'")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/SsoController.java")
                .content("""
                        @RestController
                        @RequestMapping("/api/auth")
                        class SsoController {
                            @PostMapping("/login")
                            Token login(LoginRequest request) { return service.login(request); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(frontendApi, exactButGenericClient))
                .thenReturn(List.of(target));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/api/auth/login", 5);

        assertEquals(target, result.get(0));
        assertTrue(result.contains(frontendApi));
        assertTrue(result.contains(exactButGenericClient));
        @SuppressWarnings({"rawtypes", "unchecked"})
        ArgumentCaptor<Wrapper<CodeChunk>> wrapperCaptor = ArgumentCaptor.forClass((Class) Wrapper.class);
        verify(codeChunkMapper, times(2)).selectList(wrapperCaptor.capture());
        for (Wrapper<CodeChunk> wrapper : wrapperCaptor.getAllValues()) {
            assertFalse(wrapper.getCustomSqlSegment().contains("content LIKE"), wrapper.getCustomSqlSegment());
        }
    }

    @Test
    void searchChunks_shouldNotComposeUnrelatedMethodMappingsAsEndpointRoute() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/auth.ts")
                .content("export function login() { return request.post('/api/auth/login'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk unrelatedController = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthUtilityController.java")
                .content("""
                        @RestController
                        class AuthUtilityController {
                            @GetMapping("/api/auth")
                            String authRoot() { return "ok"; }

                            @PostMapping("/login")
                            Token localLogin(LoginRequest request) { return service.login(request); }
                        }
                        """)
                .startLine(1)
                .endLine(90)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(unrelatedController));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/api/auth/login", 5);

        assertEquals(exactApiClient, result.get(0));
        assertTrue(result.contains(unrelatedController));
    }

    @Test
    void searchChunks_shouldNotComposeMethodLevelRequestMappingWithLaterMethodMapping() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/auth.ts")
                .content("export function login() { return request.post('/api/auth/login'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk unrelatedController = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthUtilityController.java")
                .content("""
                        @RestController
                        class AuthUtilityController {
                            @RequestMapping("/api/auth")
                            String authRoot() { return "ok"; }

                            @PostMapping("/login")
                            Token localLogin(LoginRequest request) { return service.login(request); }
                        }
                        """)
                .startLine(1)
                .endLine(90)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(unrelatedController));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/api/auth/login", 5);

        assertEquals(exactApiClient, result.get(0));
        assertTrue(result.contains(unrelatedController));
    }

    @Test
    void searchChunks_shouldNotComposeMappingsAcrossDifferentClassesInSameChunk() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/user.ts")
                .content("export function currentUser() { return request.get('/api/users/me'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk multiClassController = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/UserControllers.java")
                .content("""
                        @RestController
                        @RequestMapping("/api/users")
                        class UserRootController {
                            String root() { return "ok"; }
                        }

                        @RestController
                        class CurrentUserController {
                            @GetMapping("/me")
                            User current() { return service.current(); }
                        }
                        """)
                .startLine(1)
                .endLine(120)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(multiClassController));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/api/users/me", 5);

        assertEquals(exactApiClient, result.get(0));
        assertTrue(result.contains(multiClassController));
    }

    @Test
    void searchChunks_shouldNotComposePathVariableMappingsAcrossDifferentClassesInSameChunk() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/user.ts")
                .content("export function getUser() { return request.get('/api/users/42'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk multiClassController = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/UserControllers.java")
                .content("""
                        @RestController
                        @RequestMapping("/api/users")
                        class UserRootController {
                            String root() { return "ok"; }
                        }

                        @RestController
                        class UserLookupController {
                            @GetMapping("/{id}")
                            User get(@PathVariable Long id) { return service.get(id); }
                        }
                        """)
                .startLine(1)
                .endLine(120)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(multiClassController));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/api/users/42", 5);

        assertEquals(exactApiClient, result.get(0));
        assertTrue(result.contains(multiClassController));
    }

    @Test
    void searchChunks_shouldPreferControllerWithDirectPathVariableRouteForConcreteApiPath() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/user.ts")
                .content("export function getUser() { return request.get('/api/users/42'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/UserController.java")
                .content("""
                        @RestController
                        class UserController {
                            @GetMapping("/api/users/{id}")
                            User get(@PathVariable Long id) { return service.get(id); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(target));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/api/users/42", 5);

        assertEquals(target, result.get(0));
        assertTrue(result.contains(exactApiClient));
        @SuppressWarnings({"rawtypes", "unchecked"})
        ArgumentCaptor<Wrapper<CodeChunk>> wrapperCaptor = ArgumentCaptor.forClass((Class) Wrapper.class);
        verify(codeChunkMapper, times(2)).selectList(wrapperCaptor.capture());
        for (Wrapper<CodeChunk> wrapper : wrapperCaptor.getAllValues()) {
            assertFalse(wrapper.getCustomSqlSegment().contains("content LIKE"), wrapper.getCustomSqlSegment());
        }
    }

    @Test
    void searchChunks_shouldPreferControllerWithComposedPathVariableRouteForConcreteApiPath() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/user.ts")
                .content("export function getUser() { return request.get('/api/users/42'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/UserController.java")
                .content("""
                        @RestController
                        @RequestMapping("/api/users")
                        class UserController {
                            @GetMapping("/{id}")
                            User get(@PathVariable Long id) { return service.get(id); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(target));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/api/users/42", 5);

        assertEquals(target, result.get(0));
        assertTrue(result.contains(exactApiClient));
        @SuppressWarnings({"rawtypes", "unchecked"})
        ArgumentCaptor<Wrapper<CodeChunk>> wrapperCaptor = ArgumentCaptor.forClass((Class) Wrapper.class);
        verify(codeChunkMapper, times(2)).selectList(wrapperCaptor.capture());
        for (Wrapper<CodeChunk> wrapper : wrapperCaptor.getAllValues()) {
            assertFalse(wrapper.getCustomSqlSegment().contains("content LIKE"), wrapper.getCustomSqlSegment());
        }
    }

    @Test
    void searchChunks_shouldPreferControllerWithRegexPathVariableRouteForConcreteApiPath() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/user.ts")
                .content("export function getUser() { return request.get('/api/users/42'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/UserController.java")
                .content("""
                        @RestController
                        class UserController {
                            @GetMapping("/api/users/{id:\\\\d+}")
                            User get(@PathVariable Long id) { return service.get(id); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(target));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/api/users/42", 5);

        assertEquals(target, result.get(0));
        assertTrue(result.contains(exactApiClient));
    }

    @Test
    void searchChunks_shouldComposeRegexPathVariableRouteForConcreteApiPath() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/user.ts")
                .content("export function getUser() { return request.get('/api/users/42'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/UserController.java")
                .content("""
                        @RestController
                        @RequestMapping("/api/users")
                        class UserController {
                            @GetMapping("/{id:\\\\d+}")
                            User get(@PathVariable Long id) { return service.get(id); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(target));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/api/users/42", 5);

        assertEquals(target, result.get(0));
        assertTrue(result.contains(exactApiClient));
    }

    @Test
    void searchChunks_shouldNotTreatMalformedRegexPathVariableRouteAsMatch() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/user.ts")
                .content("export function getUser() { return request.get('/api/users/42'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk emptyRegexController = CodeChunk.builder()
                .id(98L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/EmptyRegexUserController.java")
                .content("""
                        @RestController
                        class EmptyRegexUserController {
                            @GetMapping("/api/users/{id:}")
                            User get(@PathVariable Long id) { return service.get(id); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();
        CodeChunk slashRegexController = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/SlashRegexUserController.java")
                .content("""
                        @RestController
                        class SlashRegexUserController {
                            @GetMapping("/api/users/{path:.+/detail}")
                            User get(@PathVariable String path) { return service.get(path); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(emptyRegexController, slashRegexController));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/api/users/42", 5);

        assertEquals(exactApiClient, result.get(0));
    }

    @Test
    void searchChunks_shouldNotTreatPathVariableRouteAsMatchWhenSegmentCountDiffers() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/user.ts")
                .content("export function getUserDetails() { return request.get('/api/users/42/details'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk shorterTemplateController = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/UserController.java")
                .content("""
                        @RestController
                        class UserController {
                            @GetMapping("/api/users/{id}")
                            User get(@PathVariable Long id) { return service.get(id); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(shorterTemplateController));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/api/users/42/details", 5);

        assertEquals(exactApiClient, result.get(0));
        assertTrue(result.contains(shorterTemplateController));
    }

    @Test
    void searchChunks_shouldPreferMoreSpecificPathVariableTemplateOverGenericTemplate() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/user.ts")
                .content("export function getUser() { return request.get('/api/users/42'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk genericTemplateController = CodeChunk.builder()
                .id(2L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/ApiFallbackController.java")
                .content("""
                        @RestController
                        class ApiFallbackController {
                            @GetMapping("/api/{resource}/{id}")
                            Object get(@PathVariable String resource, @PathVariable Long id) { return fallback.get(resource, id); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();
        CodeChunk specificTemplateController = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/UserController.java")
                .content("""
                        @RestController
                        class UserController {
                            @GetMapping("/api/users/{id}")
                            User get(@PathVariable Long id) { return service.get(id); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(genericTemplateController, specificTemplateController));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/api/users/42", 5);

        assertEquals(specificTemplateController, result.get(0));
        assertTrue(result.contains(genericTemplateController));
        @SuppressWarnings({"rawtypes", "unchecked"})
        ArgumentCaptor<Wrapper<CodeChunk>> wrapperCaptor = ArgumentCaptor.forClass((Class) Wrapper.class);
        verify(codeChunkMapper, times(2)).selectList(wrapperCaptor.capture());
        for (Wrapper<CodeChunk> wrapper : wrapperCaptor.getAllValues()) {
            assertFalse(wrapper.getCustomSqlSegment().contains("content LIKE"), wrapper.getCustomSqlSegment());
        }
    }

    @Test
    void searchChunks_shouldPreferExactLiteralControllerRouteOverPathVariableTemplate() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/user.ts")
                .content("export function getCurrentUser() { return request.get('/api/users/me'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk templateController = CodeChunk.builder()
                .id(2L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/UserController.java")
                .content("""
                        @RestController
                        class UserController {
                            @GetMapping("/api/users/{id}")
                            User get(@PathVariable Long id) { return service.get(id); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();
        CodeChunk exactController = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/CurrentUserController.java")
                .content("""
                        @RestController
                        class CurrentUserController {
                            @GetMapping("/api/users/me")
                            User current() { return service.current(); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(templateController, exactController));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/api/users/me", 5);

        assertEquals(exactController, result.get(0));
        assertTrue(result.contains(templateController));
        assertTrue(result.contains(exactApiClient));
        @SuppressWarnings({"rawtypes", "unchecked"})
        ArgumentCaptor<Wrapper<CodeChunk>> wrapperCaptor = ArgumentCaptor.forClass((Class) Wrapper.class);
        verify(codeChunkMapper, times(2)).selectList(wrapperCaptor.capture());
        for (Wrapper<CodeChunk> wrapper : wrapperCaptor.getAllValues()) {
            assertFalse(wrapper.getCustomSqlSegment().contains("content LIKE"), wrapper.getCustomSqlSegment());
        }
    }

    @Test
    void searchChunks_shouldReadSpringRouteWhenMappingValueIsNotFirstStringLiteral() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/user.ts")
                .content("export function getCurrentUser() { return request.get('/api/users/me'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/CurrentUserController.java")
                .content("""
                        @RestController
                        class CurrentUserController {
                            @GetMapping(name = "currentUser", value = "/api/users/me")
                            User current() { return service.current(); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(target));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/api/users/me", 5);

        assertEquals(target, result.get(0));
        assertTrue(result.contains(exactApiClient));
        @SuppressWarnings({"rawtypes", "unchecked"})
        ArgumentCaptor<Wrapper<CodeChunk>> wrapperCaptor = ArgumentCaptor.forClass((Class) Wrapper.class);
        verify(codeChunkMapper, times(2)).selectList(wrapperCaptor.capture());
        for (Wrapper<CodeChunk> wrapper : wrapperCaptor.getAllValues()) {
            assertFalse(wrapper.getCustomSqlSegment().contains("content LIKE"), wrapper.getCustomSqlSegment());
        }
    }

    @Test
    void searchChunks_shouldComposeSpringRouteWhenClassAndMethodRoutesAreNotFirstStringLiterals() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/user.ts")
                .content("export function getUser() { return request.get('/api/users/42'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/UserController.java")
                .content("""
                        @RestController
                        @RequestMapping(name = "users", path = "/api/users")
                        class UserController {
                            @GetMapping(name = "getUser", value = "/{id}")
                            User get(@PathVariable Long id) { return service.get(id); }
                        }
                        """)
                .startLine(1)
                .endLine(90)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(target));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/api/users/42", 5);

        assertEquals(target, result.get(0));
        assertTrue(result.contains(exactApiClient));
    }

    @Test
    void searchChunks_shouldReadSpringRouteFromMappingArrayLiteral() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/user.ts")
                .content("export function getCurrentUser() { return request.get('/api/users/me'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/CurrentUserController.java")
                .content("""
                        @RestController
                        class CurrentUserController {
                            @GetMapping(path = {"/internal/users/me", "/api/users/me"})
                            User current() { return service.current(); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(target));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/api/users/me", 5);

        assertEquals(target, result.get(0));
        assertTrue(result.contains(exactApiClient));
        @SuppressWarnings({"rawtypes", "unchecked"})
        ArgumentCaptor<Wrapper<CodeChunk>> wrapperCaptor = ArgumentCaptor.forClass((Class) Wrapper.class);
        verify(codeChunkMapper, times(2)).selectList(wrapperCaptor.capture());
        for (Wrapper<CodeChunk> wrapper : wrapperCaptor.getAllValues()) {
            assertFalse(wrapper.getCustomSqlSegment().contains("content LIKE"), wrapper.getCustomSqlSegment());
        }
    }

    @Test
    void searchChunks_shouldNotTreatSpringMappingNameAsRouteLiteral() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/health.ts")
                .content("export function health() { return request.get('/health'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk nonRouteNameController = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/StatusController.java")
                .content("""
                        @RestController
                        class StatusController {
                            @GetMapping(name = "/health", value = "/status")
                            Status status() { return service.status(); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(nonRouteNameController));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/health", 5);

        assertEquals(exactApiClient, result.get(0));
    }

    @Test
    void searchChunks_shouldNotTreatSpringMappingProducesAsRouteLiteral() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/json.ts")
                .content("export function json() { return request.get('/application/json'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk nonRouteProducesController = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/StatusController.java")
                .content("""
                        @RestController
                        class StatusController {
                            @GetMapping(value = "/status", produces = "/application/json")
                            Status status() { return service.status(); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(nonRouteProducesController));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/application/json", 5);

        assertEquals(exactApiClient, result.get(0));
    }

    @Test
    void searchChunks_shouldNotTreatSpringMappingProducesArrayAsRouteLiteral() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/json.ts")
                .content("export function json() { return request.get('/application/json'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk nonRouteProducesController = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/StatusController.java")
                .content("""
                        @RestController
                        class StatusController {
                            @GetMapping(value = "/status", produces = {"/application/json", "/application/problem+json"})
                            Status status() { return service.status(); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(nonRouteProducesController));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/application/json", 5);

        assertEquals(exactApiClient, result.get(0));
    }

    @Test
    void searchChunks_shouldNotTreatSpringMappingHeadersArrayAsRouteLiteral() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/health.ts")
                .content("export function health() { return request.get('/health'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk nonRouteHeadersController = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/StatusController.java")
                .content("""
                        @RestController
                        class StatusController {
                            @GetMapping(value = "/status", headers = {"/health", "X-Trace=true"})
                            Status status() { return service.status(); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(nonRouteHeadersController));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/health", 5);

        assertEquals(exactApiClient, result.get(0));
    }

    @Test
    void searchChunks_shouldNotComposeSpringMappingNamesAsRouteLiterals() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/health.ts")
                .content("export function login() { return request.get('/api/users/health'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk nonRouteNamesController = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/StatusController.java")
                .content("""
                        @RestController
                        @RequestMapping(name = "/api/users", value = "/status")
                        class StatusController {
                            @GetMapping(name = "/health", value = "/current")
                            Status status() { return service.status(); }
                        }
                        """)
                .startLine(1)
                .endLine(100)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(nonRouteNamesController));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/api/users/health", 5);

        assertEquals(exactApiClient, result.get(0));
    }

    @Test
    void searchChunks_shouldReadSpringRouteFromSameChunkStringConstant() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/user.ts")
                .content("export function getCurrentUser() { return request.get('/api/users/me'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/CurrentUserController.java")
                .content("""
                        @RestController
                        class CurrentUserController {
                            private static final String CURRENT_USER_ROUTE = "/api/users/me";

                            @GetMapping(CURRENT_USER_ROUTE)
                            User current() { return service.current(); }
                        }
                        """)
                .startLine(1)
                .endLine(90)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(target));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/api/users/me", 5);

        assertEquals(target, result.get(0));
        assertTrue(result.contains(exactApiClient));
        @SuppressWarnings({"rawtypes", "unchecked"})
        ArgumentCaptor<Wrapper<CodeChunk>> wrapperCaptor = ArgumentCaptor.forClass((Class) Wrapper.class);
        verify(codeChunkMapper, times(2)).selectList(wrapperCaptor.capture());
        for (Wrapper<CodeChunk> wrapper : wrapperCaptor.getAllValues()) {
            assertFalse(wrapper.getCustomSqlSegment().contains("content LIKE"), wrapper.getCustomSqlSegment());
        }
    }

    @Test
    void searchChunks_shouldComposeSpringRouteFromSameChunkStringConstants() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/user.ts")
                .content("export function getUser() { return request.get('/api/users/42'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/UserController.java")
                .content("""
                        @RestController
                        @RequestMapping(path = USER_ROOT)
                        class UserController {
                            private static final String USER_ROOT = "/api/users";
                            private static final String USER_ID = "/{id}";

                            @GetMapping(value = USER_ID)
                            User get(@PathVariable Long id) { return service.get(id); }
                        }
                        """)
                .startLine(1)
                .endLine(100)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(target));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/api/users/42", 5);

        assertEquals(target, result.get(0));
        assertTrue(result.contains(exactApiClient));
        @SuppressWarnings({"rawtypes", "unchecked"})
        ArgumentCaptor<Wrapper<CodeChunk>> wrapperCaptor = ArgumentCaptor.forClass((Class) Wrapper.class);
        verify(codeChunkMapper, times(2)).selectList(wrapperCaptor.capture());
        for (Wrapper<CodeChunk> wrapper : wrapperCaptor.getAllValues()) {
            assertFalse(wrapper.getCustomSqlSegment().contains("content LIKE"), wrapper.getCustomSqlSegment());
        }
    }

    @Test
    void searchChunks_shouldNotTreatSpringMappingNameConstantAsRoute() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/health.ts")
                .content("export function health() { return request.get('/health'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk nonRouteNameController = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/StatusController.java")
                .content("""
                        @RestController
                        class StatusController {
                            private static final String HEALTH_NAME = "/health";

                            @GetMapping(name = HEALTH_NAME, value = "/status")
                            Status status() { return service.status(); }
                        }
                        """)
                .startLine(1)
                .endLine(90)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(nonRouteNameController));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/health", 5);

        assertEquals(exactApiClient, result.get(0));
    }

    @Test
    void searchChunks_shouldNotTreatSpringMappingProducesConstantAsRoute() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/json.ts")
                .content("export function json() { return request.get('/application/json'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk nonRouteProducesController = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/StatusController.java")
                .content("""
                        @RestController
                        class StatusController {
                            private static final String JSON_MEDIA = "/application/json";

                            @GetMapping(value = "/status", produces = JSON_MEDIA)
                            Status status() { return service.status(); }
                        }
                        """)
                .startLine(1)
                .endLine(90)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(nonRouteProducesController));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/application/json", 5);

        assertEquals(exactApiClient, result.get(0));
    }

    @Test
    void searchChunks_shouldReadSpringRouteFromSameChunkConstantConcatenation() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/user.ts")
                .content("export function getCurrentUser() { return request.get('/api/users/me'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/CurrentUserController.java")
                .content("""
                        @RestController
                        class CurrentUserController {
                            private static final String USER_ROOT = "/api/users";

                            @GetMapping(USER_ROOT + "/me")
                            User current() { return service.current(); }
                        }
                        """)
                .startLine(1)
                .endLine(90)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(target));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/api/users/me", 5);

        assertEquals(target, result.get(0));
        assertTrue(result.contains(exactApiClient));
        @SuppressWarnings({"rawtypes", "unchecked"})
        ArgumentCaptor<Wrapper<CodeChunk>> wrapperCaptor = ArgumentCaptor.forClass((Class) Wrapper.class);
        verify(codeChunkMapper, times(2)).selectList(wrapperCaptor.capture());
        for (Wrapper<CodeChunk> wrapper : wrapperCaptor.getAllValues()) {
            assertFalse(wrapper.getCustomSqlSegment().contains("content LIKE"), wrapper.getCustomSqlSegment());
        }
    }

    @Test
    void searchChunks_shouldComposeSpringRouteFromSameChunkConcatenatedConstants() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/user.ts")
                .content("export function getUser() { return request.get('/api/users/42'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/UserController.java")
                .content("""
                        @RestController
                        @RequestMapping(path = API_ROOT + "/users")
                        class UserController {
                            private static final String API_ROOT = "/api";
                            private static final String USER_ID = "/{id}";

                            @GetMapping(value = USER_ID)
                            User get(@PathVariable Long id) { return service.get(id); }
                        }
                        """)
                .startLine(1)
                .endLine(100)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(target));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/api/users/42", 5);

        assertEquals(target, result.get(0));
        assertTrue(result.contains(exactApiClient));
        @SuppressWarnings({"rawtypes", "unchecked"})
        ArgumentCaptor<Wrapper<CodeChunk>> wrapperCaptor = ArgumentCaptor.forClass((Class) Wrapper.class);
        verify(codeChunkMapper, times(2)).selectList(wrapperCaptor.capture());
        for (Wrapper<CodeChunk> wrapper : wrapperCaptor.getAllValues()) {
            assertFalse(wrapper.getCustomSqlSegment().contains("content LIKE"), wrapper.getCustomSqlSegment());
        }
    }

    @Test
    void searchChunks_shouldNotTreatConcatenatedRouteFragmentsAsIndependentRoutes() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/user.ts")
                .content("export function listUsers() { return request.get('/api/users'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/CurrentUserController.java")
                .content("""
                        @RestController
                        class CurrentUserController {
                            private static final String USER_ROOT = "/api/users";

                            @GetMapping(USER_ROOT + "/me")
                            User current() { return service.current(); }
                        }
                        """)
                .startLine(1)
                .endLine(90)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(target));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/api/users", 5);

        assertEquals(exactApiClient, result.get(0));
    }

    @Test
    void searchChunks_shouldNotComposeRouteFromConcatenatedClassPrefixFragment() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/root.ts")
                .content("export function getRootScoped() { return request.get('/api/42'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/UserController.java")
                .content("""
                        @RestController
                        @RequestMapping(path = API_ROOT + "/users")
                        class UserController {
                            private static final String API_ROOT = "/api";

                            @GetMapping("/{id}")
                            User get(@PathVariable Long id) { return service.get(id); }
                        }
                        """)
                .startLine(1)
                .endLine(100)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(target));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/api/42", 5);

        assertEquals(exactApiClient, result.get(0));
    }

    @Test
    void searchChunks_shouldNotPartiallyMatchUnresolvedRouteConcatenation() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/user.ts")
                .content("export function listUsers() { return request.get('/api/users'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/DynamicUserController.java")
                .content("""
                        @RestController
                        class DynamicUserController {
                            private static final String USER_ROOT = "/api/users";

                            @GetMapping(USER_ROOT + dynamicSuffix())
                            User dynamic() { return service.dynamic(); }
                        }
                        """)
                .startLine(1)
                .endLine(90)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(target));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/api/users", 5);

        assertEquals(exactApiClient, result.get(0));
    }

    @Test
    void searchChunks_shouldNotTreatControllerPlainRouteConstantAsStrongEndpointRoute() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/user.ts")
                .content("export function listUsers() { return request.get('/api/users'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/HelperController.java")
                .content("""
                        @RestController
                        class HelperController {
                            private static final String USERS_ROUTE = "/api/users";

                            String helper() { return USERS_ROUTE; }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(target));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/api/users", 5);

        assertEquals(exactApiClient, result.get(0));
    }

    @Test
    void searchChunks_shouldNotTreatSpringMappingProducesConcatenationAsRoute() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/json.ts")
                .content("export function json() { return request.get('/application/json'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk nonRouteProducesController = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/StatusController.java")
                .content("""
                        @RestController
                        class StatusController {
                            private static final String APPLICATION = "/application";

                            @GetMapping(value = "/status", produces = APPLICATION + "/json")
                            Status status() { return service.status(); }
                        }
                        """)
                .startLine(1)
                .endLine(90)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(nonRouteProducesController));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/application/json", 5);

        assertEquals(exactApiClient, result.get(0));
    }

    @Test
    void searchChunks_shouldReadSpringRouteFromSameChunkConstantExpression() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/user.ts")
                .content("export function getCurrentUser() { return request.get('/api/users/me'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/CurrentUserController.java")
                .content("""
                        @RestController
                        class CurrentUserController {
                            private static final String API_ROOT = "/api";
                            private static final String USER_ROOT = API_ROOT + "/users";
                            private static final String CURRENT_USER_ROUTE = USER_ROOT + "/me";

                            @GetMapping(CURRENT_USER_ROUTE)
                            User current() { return service.current(); }
                        }
                        """)
                .startLine(1)
                .endLine(100)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(target));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/api/users/me", 5);

        assertEquals(target, result.get(0));
        assertTrue(result.contains(exactApiClient));
        @SuppressWarnings({"rawtypes", "unchecked"})
        ArgumentCaptor<Wrapper<CodeChunk>> wrapperCaptor = ArgumentCaptor.forClass((Class) Wrapper.class);
        verify(codeChunkMapper, times(2)).selectList(wrapperCaptor.capture());
        for (Wrapper<CodeChunk> wrapper : wrapperCaptor.getAllValues()) {
            assertFalse(wrapper.getCustomSqlSegment().contains("content LIKE"), wrapper.getCustomSqlSegment());
        }
    }

    @Test
    void searchChunks_shouldComposeSpringRouteFromSameChunkConstantExpression() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/user.ts")
                .content("export function getUser() { return request.get('/api/users/42'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/UserController.java")
                .content("""
                        @RestController
                        @RequestMapping(path = USER_ROOT)
                        class UserController {
                            private static final String API_ROOT = "/api";
                            private static final String USER_ROOT = API_ROOT + "/users";
                            private static final String USER_ID = "/" + "{id}";

                            @GetMapping(value = USER_ID)
                            User get(@PathVariable Long id) { return service.get(id); }
                        }
                        """)
                .startLine(1)
                .endLine(110)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(target));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/api/users/42", 5);

        assertEquals(target, result.get(0));
        assertTrue(result.contains(exactApiClient));
        @SuppressWarnings({"rawtypes", "unchecked"})
        ArgumentCaptor<Wrapper<CodeChunk>> wrapperCaptor = ArgumentCaptor.forClass((Class) Wrapper.class);
        verify(codeChunkMapper, times(2)).selectList(wrapperCaptor.capture());
        for (Wrapper<CodeChunk> wrapper : wrapperCaptor.getAllValues()) {
            assertFalse(wrapper.getCustomSqlSegment().contains("content LIKE"), wrapper.getCustomSqlSegment());
        }
    }

    @Test
    void searchChunks_shouldNotPartiallyMatchUnresolvedRouteConstantExpression() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/user.ts")
                .content("export function listUsers() { return request.get('/api/users'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/DynamicUserController.java")
                .content("""
                        @RestController
                        class DynamicUserController {
                            private static final String API_ROOT = "/api";
                            private static final String USER_ROOT = API_ROOT + dynamicSuffix();

                            @GetMapping(USER_ROOT)
                            User dynamic() { return service.dynamic(); }
                        }
                        """)
                .startLine(1)
                .endLine(90)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(target));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/api/users", 5);

        assertEquals(exactApiClient, result.get(0));
    }

    @Test
    void searchChunks_shouldNotTreatSpringMappingProducesConstantExpressionAsRoute() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/json.ts")
                .content("export function json() { return request.get('/application/json'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk nonRouteProducesController = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/StatusController.java")
                .content("""
                        @RestController
                        class StatusController {
                            private static final String APPLICATION = "/application";
                            private static final String JSON_MEDIA = APPLICATION + "/json";

                            @GetMapping(value = "/status", produces = JSON_MEDIA)
                            Status status() { return service.status(); }
                        }
                        """)
                .startLine(1)
                .endLine(90)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(nonRouteProducesController));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/application/json", 5);

        assertEquals(exactApiClient, result.get(0));
    }

    @Test
    void springRouteConstants_shouldParseJavaUppercaseRouteConstantExpressions() throws Exception {
        Map<String, String> constants = springRouteConstants("""
                class CurrentUserController {
                    private static final String API_ROOT = "/api";
                    private static final String USER_ROOT = API_ROOT + "/users";
                    private static final String CURRENT_USER_ROUTE = USER_ROOT + "/me";
                }
                """);

        assertEquals("/api", constants.get("API_ROOT"));
        assertEquals("/api/users", constants.get("USER_ROOT"));
        assertEquals("/api/users/me", constants.get("CURRENT_USER_ROUTE"));
    }

    @Test
    void springRouteConstants_shouldParseKotlinUppercaseValExpressions() throws Exception {
        Map<String, String> constants = springRouteConstants("""
                class CurrentUserController {
                    companion object {
                        private const val API_ROOT = "/api"
                        private const val USER_ROOT: String = API_ROOT + "/users"
                        private const val CURRENT_USER_ROUTE = USER_ROOT + "/me"
                    }
                }
                """);

        assertEquals("/api", constants.get("API_ROOT"));
        assertEquals("/api/users", constants.get("USER_ROOT"));
        assertEquals("/api/users/me", constants.get("CURRENT_USER_ROUTE"));
    }

    @Test
    void springRouteConstants_shouldParseNestedKotlinObjectQualifiedExpressions() throws Exception {
        Map<String, String> constants = springRouteConstants("""
                object ApiRoutes {
                    const val ROOT = "/api"
                    object Auth {
                        const val LOGIN = ROOT + "/auth/login"
                    }
                }
                """);

        assertEquals("/api", constants.get("ApiRoutes.ROOT"));
        assertEquals("/api/auth/login", constants.get("Auth.LOGIN"));
        assertEquals("/api/auth/login", constants.get("ApiRoutes.Auth.LOGIN"));
    }

    @Test
    void springRouteConstants_shouldParseOneLineNestedKotlinObjectQualifiedExpressions() throws Exception {
        Map<String, String> constants = springRouteConstants(
                "object ApiRoutes { object Auth { const val LOGIN = \"/api/auth/login\" } }"
        );

        assertEquals("/api/auth/login", constants.get("LOGIN"));
        assertEquals("/api/auth/login", constants.get("Auth.LOGIN"));
        assertEquals("/api/auth/login", constants.get("ApiRoutes.Auth.LOGIN"));
    }

    @Test
    void springMappingLiterals_shouldResolveKotlinConstantsOnlyForRouteAttributes() throws Exception {
        List<String> literals = springMappingLiteralValues("""
                @RestController
                class CurrentUserController {
                    companion object {
                        private const val API_ROOT = "/api"
                        private const val USER_ROOT: String = API_ROOT + "/users"
                        private const val CURRENT_USER_ROUTE = USER_ROOT + "/me"
                        private const val JSON_MEDIA = "/application/json"
                    }

                    @GetMapping(CURRENT_USER_ROUTE)
                    fun current(): User = service.current()

                    @GetMapping(value = ["/status"], produces = [JSON_MEDIA])
                    fun status(): Status = service.status()
                }
                """, "getmapping");

        assertTrue(literals.contains("/api/users/me"));
        assertTrue(literals.contains("/status"));
        assertFalse(literals.contains("/application/json"));
    }

    @Test
    void springMappingLiterals_shouldResolveConcatenatedRouteExpressionsInsideArrays() throws Exception {
        List<String> javaLiterals = springMappingLiteralValues("""
                @RestController
                class CurrentUserController {
                    private static final String API_ROOT = "/api";
                    private static final String USER_ROOT = API_ROOT + "/users";

                    @GetMapping(path = { USER_ROOT + "/me", "/status" })
                    User current() { return service.current(); }
                }
                """, "getmapping");
        List<String> kotlinLiterals = springMappingLiteralValues("""
                @RestController
                class CurrentUserController {
                    companion object {
                        private const val API_ROOT = "/api"
                        private const val USER_ROOT: String = API_ROOT + "/users"
                        private const val JSON_MEDIA = "/application/json"
                    }

                    @GetMapping(value = [USER_ROOT + "/me"], produces = [JSON_MEDIA])
                    fun current(): User = service.current()
                }
                """, "getmapping");

        assertTrue(javaLiterals.contains("/api/users/me"));
        assertTrue(javaLiterals.contains("/status"));
        assertFalse(javaLiterals.contains("/me"));
        assertFalse(javaLiterals.contains("/api/users"));
        assertTrue(kotlinLiterals.contains("/api/users/me"));
        assertFalse(kotlinLiterals.contains("/me"));
        assertFalse(kotlinLiterals.contains("/api/users"));
        assertFalse(kotlinLiterals.contains("/application/json"));
    }

    @Test
    void springMappingLiterals_shouldResolveConcatenatedRouteExpressionsInsideShorthandArray() throws Exception {
        List<String> literals = springMappingLiteralValues("""
                @RestController
                class CurrentUserController {
                    private static final String API_ROOT = "/api";
                    private static final String USER_ROOT = API_ROOT + "/users";

                    @GetMapping({ USER_ROOT + "/me", "/status" })
                    User current() { return service.current(); }
                }
                """, "getmapping");

        assertTrue(literals.contains("/api/users/me"));
        assertTrue(literals.contains("/status"));
        assertFalse(literals.contains("/me"));
        assertFalse(literals.contains("/api/users"));
    }

    @Test
    void searchChunks_shouldReadSpringRouteFromKotlinConstValExpression() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/user.ts")
                .content("export function currentUser() { return request.get('/api/users/me'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/kotlin/com/example/controller/CurrentUserController.kt")
                .content("""
                        @RestController
                        class CurrentUserController {
                            companion object {
                                private const val API_ROOT = "/api"
                                private const val USER_ROOT = API_ROOT + "/users"
                                private const val CURRENT_USER_ROUTE = USER_ROOT + "/me"
                            }

                            @GetMapping(CURRENT_USER_ROUTE)
                            fun current(): User = service.current()
                        }
                        """)
                .startLine(1)
                .endLine(120)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(target));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/api/users/me", 5);

        assertEquals(target, result.get(0));
        assertTrue(result.contains(exactApiClient));
    }

    @Test
    void searchChunks_shouldComposeSpringRouteFromKotlinValConstants() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/user.ts")
                .content("export function getUser() { return request.get('/api/users/42'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/kotlin/com/example/controller/UserController.kt")
                .content("""
                        @RestController
                        @RequestMapping(USER_ROOT)
                        class UserController {
                            companion object {
                                private const val API_ROOT = "/api"
                                private const val USER_ROOT: String = API_ROOT + "/users"
                                private const val USER_ID = "/" + "{id}"
                            }

                            @GetMapping(USER_ID)
                            fun get(@PathVariable id: Long): User = service.get(id)
                        }
                        """)
                .startLine(1)
                .endLine(130)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(target));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/api/users/42", 5);

        assertEquals(target, result.get(0));
        assertTrue(result.contains(exactApiClient));
        @SuppressWarnings({"rawtypes", "unchecked"})
        ArgumentCaptor<Wrapper<CodeChunk>> wrapperCaptor = ArgumentCaptor.forClass((Class) Wrapper.class);
        verify(codeChunkMapper, times(2)).selectList(wrapperCaptor.capture());
        for (Wrapper<CodeChunk> wrapper : wrapperCaptor.getAllValues()) {
            assertFalse(wrapper.getCustomSqlSegment().contains("content LIKE"), wrapper.getCustomSqlSegment());
        }
    }

    @Test
    void searchChunks_shouldNotTreatKotlinProducesValConstantAsRoute() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/json.ts")
                .content("export function json() { return request.get('/application/json'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk nonRouteProducesController = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/kotlin/com/example/controller/StatusController.kt")
                .content("""
                        @RestController
                        class StatusController {
                            companion object {
                                private const val APPLICATION = "/application"
                                private const val JSON_MEDIA = APPLICATION + "/json"
                            }

                            @GetMapping(value = ["/status"], produces = [JSON_MEDIA])
                            fun status(): Status = service.status()
                        }
                        """)
                .startLine(1)
                .endLine(100)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(nonRouteProducesController));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/application/json", 5);

        assertEquals(exactApiClient, result.get(0));
    }

    @Test
    void searchChunks_shouldReadSpringRouteFromArrayConstantConcatenation() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/user.ts")
                .content("export function currentUser() { return request.get('/api/users/me'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/kotlin/com/example/controller/CurrentUserController.kt")
                .content("""
                        @RestController
                        class CurrentUserController {
                            companion object {
                                private const val API_ROOT = "/api"
                                private const val USER_ROOT: String = API_ROOT + "/users"
                            }

                            @GetMapping(value = [USER_ROOT + "/me"])
                            fun current(): User = service.current()
                        }
                        """)
                .startLine(1)
                .endLine(100)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(target));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/api/users/me", 5);

        assertEquals(target, result.get(0));
        assertTrue(result.contains(exactApiClient));
        @SuppressWarnings({"rawtypes", "unchecked"})
        ArgumentCaptor<Wrapper<CodeChunk>> wrapperCaptor = ArgumentCaptor.forClass((Class) Wrapper.class);
        verify(codeChunkMapper, times(2)).selectList(wrapperCaptor.capture());
        for (Wrapper<CodeChunk> wrapper : wrapperCaptor.getAllValues()) {
            assertFalse(wrapper.getCustomSqlSegment().contains("content LIKE"), wrapper.getCustomSqlSegment());
        }
    }

    @Test
    void searchChunks_shouldNotTreatArrayConcatenationFragmentsAsIndependentRoutes() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/user.ts")
                .content("export function currentUser() { return request.get('/me'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/CurrentUserController.java")
                .content("""
                        @RestController
                        class CurrentUserController {
                            private static final String API_ROOT = "/api";
                            private static final String USER_ROOT = API_ROOT + "/users";

                            @GetMapping(path = { USER_ROOT + "/me" })
                            User current() { return service.current(); }
                        }
                        """)
                .startLine(1)
                .endLine(100)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(target));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/me", 5);

        assertEquals(exactApiClient, result.get(0));
    }

    @Test
    void searchChunks_shouldReadSpringRouteFromShorthandArrayConstantConcatenation() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/user.ts")
                .content("export function currentUser() { return request.get('/api/users/me'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/CurrentUserController.java")
                .content("""
                        @RestController
                        class CurrentUserController {
                            private static final String API_ROOT = "/api";
                            private static final String USER_ROOT = API_ROOT + "/users";

                            @GetMapping({ USER_ROOT + "/me" })
                            User current() { return service.current(); }
                        }
                        """)
                .startLine(1)
                .endLine(100)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(target));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/api/users/me", 5);

        assertEquals(target, result.get(0));
        assertTrue(result.contains(exactApiClient));
    }

    @Test
    void searchChunks_shouldNotTreatShorthandArrayConcatenationFragmentsAsIndependentRoutes() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/user.ts")
                .content("export function currentUser() { return request.get('/me'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/CurrentUserController.java")
                .content("""
                        @RestController
                        class CurrentUserController {
                            private static final String API_ROOT = "/api";
                            private static final String USER_ROOT = API_ROOT + "/users";

                            @GetMapping({ USER_ROOT + "/me" })
                            User current() { return service.current(); }
                        }
                        """)
                .startLine(1)
                .endLine(100)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(target));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/me", 5);

        assertEquals(exactApiClient, result.get(0));
    }

    @Test
    void searchChunks_shouldComposeSpringRouteAcrossPreviousSameFileChunk() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/user.ts")
                .content("export function getUser() { return request.get('/api/users/42'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk classPrefixChunk = CodeChunk.builder()
                .id(98L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/UserController.java")
                .content("""
                        @RestController
                        @RequestMapping("/api/users")
                        class UserController {
                            private final UserService service;
                        """)
                .startLine(1)
                .endLine(50)
                .build();
        CodeChunk methodChunk = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/UserController.java")
                .content("""
                            @GetMapping("/{id}")
                            User get(@PathVariable Long id) { return service.get(id); }
                        }
                        """)
                .startLine(41)
                .endLine(90)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(classPrefixChunk, methodChunk));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/api/users/42", 5);

        assertEquals(methodChunk, result.get(0));
        assertTrue(result.contains(exactApiClient));
        @SuppressWarnings({"rawtypes", "unchecked"})
        ArgumentCaptor<Wrapper<CodeChunk>> wrapperCaptor = ArgumentCaptor.forClass((Class) Wrapper.class);
        verify(codeChunkMapper, times(3)).selectList(wrapperCaptor.capture());
        for (Wrapper<CodeChunk> wrapper : wrapperCaptor.getAllValues()) {
            assertFalse(wrapper.getCustomSqlSegment().contains("content LIKE"), wrapper.getCustomSqlSegment());
        }
    }

    @Test
    void searchChunks_shouldComposeSpringRouteAcrossPreviousSameFileContextWindow() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/user.ts")
                .content("export function getUser() { return request.get('/api/users/42'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk classPrefixChunk = CodeChunk.builder()
                .id(97L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/UserController.java")
                .content("""
                        @RestController
                        @RequestMapping("/api/users")
                        class UserController {
                        """)
                .startLine(1)
                .endLine(30)
                .build();
        CodeChunk middleChunk = CodeChunk.builder()
                .id(98L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/UserController.java")
                .content("""
                            private final UserService service;
                            UserController(UserService service) {
                                this.service = service;
                            }
                        """)
                .startLine(31)
                .endLine(70)
                .build();
        CodeChunk methodChunk = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/UserController.java")
                .content("""
                            @GetMapping("/{id}")
                            User get(@PathVariable Long id) { return service.get(id); }
                        }
                        """)
                .startLine(71)
                .endLine(110)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(classPrefixChunk, middleChunk, methodChunk))
                .thenReturn(List.of());

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/api/users/42", 5);

        assertEquals(methodChunk, result.get(0));
        assertTrue(result.contains(exactApiClient));
        @SuppressWarnings({"rawtypes", "unchecked"})
        ArgumentCaptor<Wrapper<CodeChunk>> wrapperCaptor = ArgumentCaptor.forClass((Class) Wrapper.class);
        verify(codeChunkMapper, times(3)).selectList(wrapperCaptor.capture());
        for (Wrapper<CodeChunk> wrapper : wrapperCaptor.getAllValues()) {
            assertFalse(wrapper.getCustomSqlSegment().contains("content LIKE"), wrapper.getCustomSqlSegment());
        }
    }

    @Test
    void rankWithPreviousSameFileContext_shouldLimitPreviousSameFileContextWindow() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/user.ts")
                .content("export function getUser() { return request.get('/api/users/42'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk classPrefixChunk = CodeChunk.builder()
                .id(96L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/UserController.java")
                .content("""
                        @RestController
                        @RequestMapping("/api/users")
                        class UserController {
                        """)
                .startLine(1)
                .endLine(20)
                .build();
        CodeChunk fillerOne = CodeChunk.builder()
                .id(97L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/UserController.java")
                .content("private final UserService service;")
                .startLine(21)
                .endLine(40)
                .build();
        CodeChunk fillerTwo = CodeChunk.builder()
                .id(98L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/UserController.java")
                .content("UserController(UserService service) { this.service = service; }")
                .startLine(41)
                .endLine(60)
                .build();
        CodeChunk fillerThree = CodeChunk.builder()
                .id(100L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/UserController.java")
                .content("private void auditAccess() { }")
                .startLine(61)
                .endLine(80)
                .build();
        CodeChunk methodChunk = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/UserController.java")
                .content("""
                            @GetMapping("/{id}")
                            User get(@PathVariable Long id) { return service.get(id); }
                        }
                        """)
                .startLine(81)
                .endLine(120)
                .build();

        List<CodeChunk> result = CodeChunkRanker.rankWithPreviousSameFileContext(
                List.of(exactApiClient, classPrefixChunk, fillerOne, fillerTwo, fillerThree, methodChunk),
                "/api/users/42",
                6
        );

        assertEquals(exactApiClient, result.get(0));
        assertTrue(result.contains(methodChunk));
    }

    @Test
    void rankWithPreviousSameFileContext_shouldPreserveRootMetadataForModuleHintRanking() {
        CodeChunk adminPrefixChunk = CodeChunk.builder()
                .id(96L)
                .scanTaskId(42L)
                .filePath("packages/admin/src/main/java/com/example/controller/UserController.java")
                .workspaceRoot("packages/admin")
                .moduleRoot("packages/admin")
                .content("""
                        @RestController
                        @RequestMapping("/api/users")
                        class AdminUserController {
                        """)
                .startLine(1)
                .endLine(30)
                .build();
        CodeChunk adminMethodChunk = CodeChunk.builder()
                .id(97L)
                .scanTaskId(42L)
                .filePath("packages/admin/src/main/java/com/example/controller/UserController.java")
                .workspaceRoot("packages/admin")
                .moduleRoot("packages/admin")
                .content("""
                            @GetMapping("/{id}")
                            User adminDetail(@PathVariable Long id) { return service.adminDetail(id); }
                        }
                        """)
                .startLine(31)
                .endLine(80)
                .build();
        CodeChunk publicPrefixChunk = CodeChunk.builder()
                .id(98L)
                .scanTaskId(42L)
                .filePath("packages/public/src/main/java/com/example/controller/UserController.java")
                .workspaceRoot("packages/public")
                .moduleRoot("packages/public")
                .content("""
                        @RestController
                        @RequestMapping("/api/users")
                        class PublicUserController {
                        """)
                .startLine(1)
                .endLine(30)
                .build();
        CodeChunk publicMethodChunk = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("packages/public/src/main/java/com/example/controller/UserController.java")
                .workspaceRoot("packages/public")
                .moduleRoot("packages/public")
                .content("""
                            @GetMapping("/{id}")
                            User publicDetail(@PathVariable Long id) { return service.publicDetail(id); }
                            String admin = "admin";
                        }
                        """)
                .startLine(31)
                .endLine(80)
                .build();

        List<CodeChunk> result = CodeChunkRanker.rankWithPreviousSameFileContext(
                List.of(adminPrefixChunk, adminMethodChunk, publicPrefixChunk, publicMethodChunk),
                "/api/users/42 sourceRoot: packages/admin admin",
                4
        );

        assertEquals(adminMethodChunk, result.get(0));
    }

    @Test
    void rankWithPreviousSameFileContext_shouldResolveQualifiedRouteConstantsFromPreviousContext() {
        CodeChunk targetPrefixChunk = CodeChunk.builder()
                .id(96L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthController.java")
                .content("""
                        @RestController
                        class AuthController {
                            static final class Routes {
                                static final String AUTH = "/api/auth";
                                static final String LOGIN = "/login";
                            }
                        """)
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk targetMethodChunk = CodeChunk.builder()
                .id(97L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthController.java")
                .content("""
                            @GetMapping(Routes.AUTH + Routes.LOGIN)
                            Token currentLoginState() { return service.currentLoginState(); }
                        }
                        """)
                .startLine(41)
                .endLine(90)
                .build();
        CodeChunk wrongMethodChunk = CodeChunk.builder()
                .id(98L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthPostController.java")
                .content("""
                        @RestController
                        class AuthPostController {
                            @PostMapping("/api/auth/login")
                            Token login(LoginRequest request) { return service.login(request); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();

        List<CodeChunk> result = CodeChunkRanker.rankWithPreviousSameFileContext(
                List.of(targetPrefixChunk, targetMethodChunk, wrongMethodChunk),
                "GET /api/auth/login",
                3
        );

        assertEquals(targetMethodChunk, result.get(0));
    }

    @Test
    void rankWithPreviousSameFileContext_shouldNotFallbackQualifiedRouteConstantToWrongSimpleName() {
        CodeChunk fakePrefixChunk = CodeChunk.builder()
                .id(96L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AAuthController.java")
                .content("""
                        @RestController
                        class AAuthController {
                            static final class MarketingRoutes {
                                static final String LOGIN = "/login";
                            }
                            static final class Routes {
                                static final String AUTH = "/api/auth";
                            }
                        """)
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk fakeMethodChunk = CodeChunk.builder()
                .id(97L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AAuthController.java")
                .content("""
                            @GetMapping(Routes.AUTH + Routes.LOGIN)
                            Token brokenRoute() { return service.brokenRoute(); }
                        }
                        """)
                .startLine(41)
                .endLine(90)
                .build();
        CodeChunk targetMethodChunk = CodeChunk.builder()
                .id(98L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthController.java")
                .content("""
                        @RestController
                        class AuthController {
                            @GetMapping("/api/auth/login")
                            Token currentLoginState() { return service.currentLoginState(); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();

        List<CodeChunk> result = CodeChunkRanker.rankWithPreviousSameFileContext(
                List.of(fakePrefixChunk, fakeMethodChunk, targetMethodChunk),
                "GET /api/auth/login",
                3
        );

        assertEquals(targetMethodChunk, result.get(0));
    }

    @Test
    void rankWithPreviousSameFileContext_shouldRegisterQualifiedRouteConstantWhenSimpleNameCollides() {
        CodeChunk targetPrefixChunk = CodeChunk.builder()
                .id(96L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthController.java")
                .content("""
                        @RestController
                        class AuthController {
                            static final class MarketingRoutes {
                                static final String LOGIN = "/marketing-login";
                            }
                            static final class Routes {
                                static final String AUTH = "/api/auth";
                                static final String LOGIN = "/login";
                            }
                        """)
                .startLine(1)
                .endLine(45)
                .build();
        CodeChunk targetMethodChunk = CodeChunk.builder()
                .id(97L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthController.java")
                .content("""
                            @GetMapping(Routes.AUTH + Routes.LOGIN)
                            Token currentLoginState() { return service.currentLoginState(); }
                        }
                        """)
                .startLine(46)
                .endLine(90)
                .build();
        CodeChunk wrongMethodChunk = CodeChunk.builder()
                .id(98L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthMarketingController.java")
                .content("""
                        @RestController
                        class AuthMarketingController {
                            @GetMapping("/api/auth/marketing-login")
                            Token marketingLogin() { return service.marketingLogin(); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();

        List<CodeChunk> result = CodeChunkRanker.rankWithPreviousSameFileContext(
                List.of(targetPrefixChunk, targetMethodChunk, wrongMethodChunk),
                "GET /api/auth/login",
                3
        );

        assertEquals(targetMethodChunk, result.get(0));
    }

    @Test
    void rankWithPreviousSameFileContext_shouldBoundCrossFileRouteHolderContext() {
        List<CodeChunk> chunks = new ArrayList<>();
        for (int index = 0; index < 24; index++) {
            chunks.add(CodeChunk.builder()
                    .id((long) index)
                    .scanTaskId(42L)
                    .filePath("src/main/java/com/example/routes/Filler" + index + "Routes.java")
                    .content("""
                            public final class Filler%sRoutes {
                                public static final String LOGIN = "/api/filler/%s";
                            }
                            """.formatted(index, index))
                    .startLine(1)
                    .endLine(40)
                    .build());
        }
        CodeChunk unresolvedController = CodeChunk.builder()
                .id(100L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AaaOverflowController.java")
                .content("""
                        @RestController
                        class AaaOverflowController {
                            @GetMapping(OverflowRoutes.LOGIN)
                            Token overflowLogin() { return service.overflowLogin(); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();
        CodeChunk literalTarget = CodeChunk.builder()
                .id(101L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/ZzzController.java")
                .content("""
                        @RestController
                        class ZzzController {
                            @GetMapping("/api/overflow")
                            Token currentState() { return service.currentState(); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();
        CodeChunk overflowRouteHolder = CodeChunk.builder()
                .id(102L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/routes/OverflowRoutes.java")
                .content("""
                        public final class OverflowRoutes {
                            public static final String LOGIN = "/api/overflow";
                        }
                        """)
                .startLine(1)
                .endLine(40)
                .build();
        chunks.add(unresolvedController);
        chunks.add(literalTarget);
        chunks.add(overflowRouteHolder);

        List<CodeChunk> result = CodeChunkRanker.rankWithPreviousSameFileContext(
                chunks,
                "GET /api/overflow",
                5
        );

        assertEquals(literalTarget, result.get(0));
    }

    @Test
    void withPreviousContext_shouldPreserveCurrentChunkMetadata() throws Exception {
        LocalDateTime createdAt = LocalDateTime.of(2026, 7, 6, 13, 45);
        CodeChunk previousChunk = CodeChunk.builder()
                .id(96L)
                .scanTaskId(42L)
                .filePath("packages/admin/src/main/java/com/example/controller/UserController.java")
                .content("@RequestMapping(\"/api/users\") class UserController {")
                .startLine(1)
                .endLine(30)
                .build();
        CodeChunk currentChunk = CodeChunk.builder()
                .id(97L)
                .scanTaskId(42L)
                .filePath("packages/admin/src/main/java/com/example/controller/UserController.java")
                .workspaceRoot("packages/admin")
                .moduleRoot("packages/admin")
                .content("@GetMapping(\"/{id}\") User get(@PathVariable Long id) { return service.get(id); }")
                .startLine(31)
                .endLine(80)
                .contentHash("hash-current")
                .embedding("[1.0,0.0]")
                .embeddingModel("MOCK:text-embedding-3-small")
                .createdAt(createdAt)
                .build();

        Method withPreviousContext = CodeChunkRanker.class.getDeclaredMethod("withPreviousContext", List.class, CodeChunk.class);
        withPreviousContext.setAccessible(true);
        CodeChunk composed = (CodeChunk) withPreviousContext.invoke(null, List.of(previousChunk), currentChunk);

        assertEquals(97L, composed.getId());
        assertEquals(42L, composed.getScanTaskId());
        assertEquals("packages/admin/src/main/java/com/example/controller/UserController.java", composed.getFilePath());
        assertEquals("packages/admin", composed.getWorkspaceRoot());
        assertEquals("packages/admin", composed.getModuleRoot());
        assertEquals("hash-current", composed.getContentHash());
        assertEquals("[1.0,0.0]", composed.getEmbedding());
        assertEquals("MOCK:text-embedding-3-small", composed.getEmbeddingModel());
        assertEquals(createdAt, composed.getCreatedAt());
        assertEquals(1, composed.getStartLine());
        assertEquals(80, composed.getEndLine());
        assertTrue(composed.getContent().contains("@RequestMapping(\"/api/users\")"));
        assertTrue(composed.getContent().contains("@GetMapping(\"/{id}\")"));
    }

    @Test
    void withExternalRouteConstantContext_shouldOnlyAttachWhenMappingReferencesConstant() throws Exception {
        String routeConstantContext = """
                public final class AuthRoutes {
                    public static final String AUTH = "/api/auth";
                    public static final String LOGIN = "/login";
                }
                """;
        CodeChunk literalMapping = CodeChunk.builder()
                .id(201L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthController.java")
                .content("""
                        @RestController
                        class AuthController {
                            @GetMapping("/api/auth/login")
                            Token login() { return service.login(); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();
        CodeChunk constantMapping = CodeChunk.builder()
                .id(202L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthController.java")
                .content("""
                        @RestController
                        class AuthController {
                            @GetMapping(AuthRoutes.AUTH + AuthRoutes.LOGIN)
                            Token login() { return service.login(); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();

        CodeChunk unchanged = withExternalRouteConstantContext(routeConstantContext, literalMapping);
        CodeChunk enriched = withExternalRouteConstantContext(routeConstantContext, constantMapping);

        assertTrue(unchanged == literalMapping);
        assertFalse(enriched == constantMapping);
        assertTrue(enriched.getContent().contains("public final class AuthRoutes"));
        assertTrue(enriched.getContent().contains("@GetMapping(AuthRoutes.AUTH + AuthRoutes.LOGIN)"));
    }

    @Test
    void withExternalRouteConstantContext_shouldAttachForSimpleImportedRouteConstant() throws Exception {
        CodeChunk staticImportedConstantMapping = CodeChunk.builder()
                .id(203L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthController.java")
                .content("""
                        @RestController
                        class AuthController {
                            @GetMapping(LOGIN)
                            Token login() { return service.login(); }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();

        CodeChunk enriched = withExternalRouteConstantContext("static final String LOGIN = \"/api/auth/login\";", staticImportedConstantMapping);

        assertFalse(enriched == staticImportedConstantMapping);
        assertTrue(enriched.getContent().contains("static final String LOGIN"));
    }

    @Test
    void searchChunks_shouldPullPreviousSameFileChunkForRouteContextWhenPrefixIsMissingFromCandidates() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/user.ts")
                .content("export function getUser() { return request.get('/api/users/42'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk methodChunk = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/UserController.java")
                .content("""
                            @GetMapping("/{id}")
                            User get(@PathVariable Long id) { return service.get(id); }
                        }
                        """)
                .startLine(41)
                .endLine(90)
                .build();
        CodeChunk classPrefixChunk = CodeChunk.builder()
                .id(98L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/UserController.java")
                .content("""
                        @RestController
                        @RequestMapping("/api/users")
                        class UserController {
                            private final UserService service;
                        """)
                .startLine(1)
                .endLine(50)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(methodChunk))
                .thenReturn(List.of(classPrefixChunk));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/api/users/42", 5);

        assertEquals(methodChunk, result.get(0));
        assertTrue(result.contains(exactApiClient));
        assertFalse(result.contains(classPrefixChunk));
        @SuppressWarnings({"rawtypes", "unchecked"})
        ArgumentCaptor<Wrapper<CodeChunk>> wrapperCaptor = ArgumentCaptor.forClass((Class) Wrapper.class);
        verify(codeChunkMapper, times(3)).selectList(wrapperCaptor.capture());
        for (Wrapper<CodeChunk> wrapper : wrapperCaptor.getAllValues()) {
            assertFalse(wrapper.getCustomSqlSegment().contains("content LIKE"), wrapper.getCustomSqlSegment());
        }
        String previousContextSql = wrapperCaptor.getAllValues().get(2).getCustomSqlSegment().toLowerCase();
        assertTrue(previousContextSql.contains("start_line desc"), previousContextSql);
        assertTrue(previousContextSql.contains("file_path asc"), previousContextSql);
    }

    @Test
    void searchChunks_shouldLimitPulledPreviousSameFileContextCandidatesPerSeed() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/user.ts")
                .content("export function getUser() { return request.get('/api/users/42'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk methodChunk = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/UserController.java")
                .content("""
                            @GetMapping("/{id}")
                            User get(@PathVariable Long id) { return service.get(id); }
                        }
                        """)
                .startLine(81)
                .endLine(120)
                .build();
        CodeChunk tooEarlyPrefixChunk = CodeChunk.builder()
                .id(96L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/UserController.java")
                .content("""
                        @RestController
                        @RequestMapping("/api/users")
                        class UserController {
                        """)
                .startLine(1)
                .endLine(20)
                .build();
        CodeChunk fillerOne = CodeChunk.builder()
                .id(97L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/UserController.java")
                .content("private final UserService service;")
                .startLine(21)
                .endLine(40)
                .build();
        CodeChunk fillerTwo = CodeChunk.builder()
                .id(98L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/UserController.java")
                .content("UserController(UserService service) { this.service = service; }")
                .startLine(41)
                .endLine(60)
                .build();
        CodeChunk fillerThree = CodeChunk.builder()
                .id(100L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/UserController.java")
                .content("private void auditAccess() { }")
                .startLine(61)
                .endLine(80)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(methodChunk))
                .thenReturn(List.of(fillerThree, fillerTwo, fillerOne, tooEarlyPrefixChunk));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/api/users/42", 10);

        assertEquals(exactApiClient, result.get(0));
        assertTrue(result.contains(methodChunk));
        assertFalse(result.contains(tooEarlyPrefixChunk));
        assertFalse(result.contains(fillerOne));
        assertFalse(result.contains(fillerTwo));
        assertFalse(result.contains(fillerThree));
        verify(codeChunkMapper, times(3)).selectList(any(Wrapper.class));
    }

    @Test
    void searchChunks_shouldNotComposePreviousSameFilePrefixWithUnrelatedMethodRoute() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/user.ts")
                .content("export function getUser() { return request.get('/api/users/42'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk classPrefixChunk = CodeChunk.builder()
                .id(98L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/UserController.java")
                .content("""
                        @RestController
                        @RequestMapping("/api/users")
                        class UserController {
                            private final UserService service;
                        """)
                .startLine(1)
                .endLine(50)
                .build();
        CodeChunk unrelatedMethodChunk = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/UserController.java")
                .content("""
                            @GetMapping("/summary")
                            UserSummary summary() { return service.summary(); }
                        }
                        """)
                .startLine(41)
                .endLine(90)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(classPrefixChunk, unrelatedMethodChunk));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/api/users/42", 5);

        assertEquals(exactApiClient, result.get(0));
    }

    @Test
    void searchChunks_shouldScopeDuplicateRouteConstantsToAssociatedClassLevelMapping() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/user.ts")
                .content("export function getUser() { return request.get('/api/users/42'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/MultiController.java")
                .content("""
                        @RestController
                        @RequestMapping(path = USER_ROOT)
                        class UserController {
                            private static final String USER_ROOT = "/api/users";
                            private static final String USER_ID = "/{id}";

                            @GetMapping(value = USER_ID)
                            User get(@PathVariable Long id) { return service.get(id); }
                        }

                        @RestController
                        @RequestMapping(path = USER_ROOT)
                        class AdminController {
                            private static final String USER_ROOT = "/api/admin";
                            private static final String USER_ID = "/{id}";

                            @GetMapping(value = USER_ID)
                            Admin get(@PathVariable Long id) { return service.getAdmin(id); }
                        }
                        """)
                .startLine(1)
                .endLine(180)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(target));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/api/users/42", 5);

        assertEquals(target, result.get(0));
        assertTrue(result.contains(exactApiClient));
        @SuppressWarnings({"rawtypes", "unchecked"})
        ArgumentCaptor<Wrapper<CodeChunk>> wrapperCaptor = ArgumentCaptor.forClass((Class) Wrapper.class);
        verify(codeChunkMapper, times(2)).selectList(wrapperCaptor.capture());
        for (Wrapper<CodeChunk> wrapper : wrapperCaptor.getAllValues()) {
            assertFalse(wrapper.getCustomSqlSegment().contains("content LIKE"), wrapper.getCustomSqlSegment());
        }
    }

    @Test
    void searchChunks_shouldScopeDuplicateRouteConstantsToContainingMethodClass() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/user.ts")
                .content("export function currentUser() { return request.get('/api/users/me'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/MultiController.java")
                .content("""
                        @RestController
                        class UserController {
                            private static final String USER_ME = "/api/users/me";

                            @GetMapping(USER_ME)
                            User current() { return service.current(); }
                        }

                        @RestController
                        class AdminController {
                            private static final String USER_ME = "/api/admin/me";

                            @GetMapping(USER_ME)
                            Admin current() { return service.currentAdmin(); }
                        }
                        """)
                .startLine(1)
                .endLine(160)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(target));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/api/users/me", 5);

        assertEquals(target, result.get(0));
        assertTrue(result.contains(exactApiClient));
    }

    @Test
    void searchChunks_shouldNotUseDuplicateClassLevelConstantFromNextClass() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/admin.ts")
                .content("export function getAdmin() { return request.get('/api/admin/42'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/MultiController.java")
                .content("""
                        @RestController
                        @RequestMapping(path = USER_ROOT)
                        class UserController {
                            private static final String USER_ROOT = "/api/users";
                            private static final String USER_ID = "/{id}";

                            @GetMapping(value = USER_ID)
                            User get(@PathVariable Long id) { return service.get(id); }
                        }

                        @RestController
                        class AdminConstants {
                            private static final String USER_ROOT = "/api/admin";
                        }
                        """)
                .startLine(1)
                .endLine(160)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(target));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/api/admin/42", 5);

        assertEquals(exactApiClient, result.get(0));
    }

    @Test
    void searchChunks_shouldNotUseDuplicateMethodRouteConstantFromNextClass() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/admin.ts")
                .content("export function currentAdmin() { return request.get('/api/admin/me'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/MultiController.java")
                .content("""
                        @RestController
                        class UserController {
                            private static final String USER_ME = "/api/users/me";

                            @GetMapping(USER_ME)
                            User current() { return service.current(); }
                        }

                        @RestController
                        class AdminConstants {
                            private static final String USER_ME = "/api/admin/me";
                        }
                        """)
                .startLine(1)
                .endLine(150)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(target));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/api/admin/me", 5);

        assertEquals(exactApiClient, result.get(0));
    }

    @Test
    void searchChunks_shouldReadClassLevelRouteConstantThroughIntermediateAnnotationsAndComments() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/user.ts")
                .content("export function getUser() { return request.get('/api/users/42'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/UserController.java")
                .content("""
                        @RestController
                        @RequestMapping(path = USER_ROOT)
                        /* boundary comment */
                        @PreAuthorize("hasRole('USER')")
                        public final class UserController {
                            private static final String API_ROOT = "/api";
                            private static final String USER_ROOT = API_ROOT + "/users";
                            private static final String USER_ID = "/{id}";

                            @GetMapping(value = USER_ID)
                            User get(@PathVariable Long id) { return service.get(id); }
                        }
                        """)
                .startLine(1)
                .endLine(120)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(target));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/api/users/42", 5);

        assertEquals(target, result.get(0));
        assertTrue(result.contains(exactApiClient));
    }

    @Test
    void searchChunks_shouldIgnoreFakeClassKeywordInCommentBeforeClassLevelMappingTarget() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/user.ts")
                .content("export function getUser() { return request.get('/api/users/42'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/UserController.java")
                .content("""
                        @RestController
                        @RequestMapping(path = USER_ROOT)
                        // route for user class controller
                        @PreAuthorize("hasRole('USER')")
                        class UserController {
                            private static final String USER_ROOT = "/api/users";
                            private static final String USER_ID = "/{id}";

                            @GetMapping(value = USER_ID)
                            User get(@PathVariable Long id) { return service.get(id); }
                        }
                        """)
                .startLine(1)
                .endLine(120)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(target));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/api/users/42", 5);

        assertEquals(target, result.get(0));
        assertTrue(result.contains(exactApiClient));
    }

    @Test
    void searchChunks_shouldIgnoreFakeClassKeywordInStringBeforeMethodLevelMapping() {
        CodeChunk exactApiClient = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/api/user.ts")
                .content("export function currentUser() { return request.get('/api/users/me'); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/UserController.java")
                .content("""
                        @RestController
                        class UserController {
                            private static final String USER_ME = "/api/users/me";
                            private static final String DOC = "class FakeController";

                            @GetMapping(USER_ME)
                            User current() { return service.current(); }
                        }
                        """)
                .startLine(1)
                .endLine(100)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(exactApiClient))
                .thenReturn(List.of(target));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "/api/users/me", 5);

        assertEquals(target, result.get(0));
        assertTrue(result.contains(exactApiClient));
    }

    @Test
    void searchChunks_shouldAppendFrontendIntentCandidatesWhenChinesePageQueryMissesKeywordPool() {
        CodeChunk docsNoise = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("docs/login.md")
                .content("登录页面组件说明")
                .startLine(1)
                .endLine(20)
                .build();
        CodeChunk backendNoise = CodeChunk.builder()
                .id(2L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/LoginController.java")
                .content("@RestController class LoginController { String page() { return \"login\"; } }")
                .startLine(1)
                .endLine(50)
                .build();
        CodeChunk loginPage = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("web-console/src/pages/Login.tsx")
                .content("export function LoginPage() { return <LoginForm />; }")
                .startLine(1)
                .endLine(60)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(docsNoise, backendNoise))
                .thenReturn(List.of(loginPage));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "前端登录页面组件", 5);

        assertEquals(loginPage, result.get(0));
        verify(codeChunkMapper, times(2)).selectList(any(Wrapper.class));
    }

    @Test
    void searchChunks_shouldRankSourceRoleMatchesAboveBroadDocumentationMatches() {
        CodeChunk doc = CodeChunk.builder()
                .scanTaskId(42L)
                .filePath("AGENTS.md")
                .content("Repository Guidelines mention service and repository conventions.")
                .startLine(1)
                .endLine(30)
                .build();
        CodeChunk chat = CodeChunk.builder()
                .scanTaskId(42L)
                .filePath("src/main/resources/admin/src/components/chat/ServiceChat.vue")
                .content("function sendMessage() { return service.chat() }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk controller = CodeChunk.builder()
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/PawnTicketController.java")
                .content("@RestController class PawnTicketController { private PawnTicketService service; }")
                .startLine(1)
                .endLine(40)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class))).thenReturn(List.of(doc, chat, controller));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "controller service repository", 2);

        assertEquals(List.of(controller, chat), result);
    }

    @Test
    void searchChunks_shouldSplitCompoundIdentifierQueriesIntoSourceRoleTerms() {
        CodeChunk doc = CodeChunk.builder()
                .scanTaskId(42L)
                .filePath("docs/architecture.md")
                .content("controller service repository")
                .startLine(1)
                .endLine(10)
                .build();
        CodeChunk controller = CodeChunk.builder()
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/PawnTicketController.java")
                .content("@RestController class PawnTicketController { private PawnTicketService service; }")
                .startLine(1)
                .endLine(40)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class))).thenReturn(List.of(doc, controller));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "controllerServiceRepository", 2);

        assertEquals(List.of(controller, doc), result);
    }

    @Test
    void roleIntentTypes_shouldNotTreatFrontendRoutesAsControllerIntent() {
        assertFalse(CodeChunkRanker.roleIntentTypes("React route Login page").contains("CONTROLLER"));
        assertFalse(CodeChunkRanker.roleIntentTypes("前端登录路由 Login 组件").contains("CONTROLLER"));
    }

    @Test
    void roleIntentTypes_shouldTreatFrontendPageComponentQuestionsAsFrontendIntent() {
        assertTrue(CodeChunkRanker.roleIntentTypes("前端登录页面组件").contains("FRONTEND"));
        assertTrue(CodeChunkRanker.roleIntentTypes("React component page").contains("FRONTEND"));
        assertFalse(CodeChunkRanker.roleIntentTypes("前端登录页面组件").contains("CONTROLLER"));
    }

    @Test
    void roleIntentTypes_shouldFallbackServiceBusinessIntentToMainSourceRoles() {
        List<String> intents = CodeChunkRanker.roleIntentTypes("service business logic implementation");

        assertEquals("SERVICE", intents.get(0));
        assertTrue(intents.contains("CONTROLLER"));
        assertTrue(intents.contains("DATA_ACCESS"));
        assertTrue(intents.contains("DOMAIN_MODEL"));
    }

    @Test
    void rank_shouldPreferMainSourceFallbackOverTestServiceForBusinessServiceIntent() {
        CodeChunk testService = CodeChunk.builder()
                .scanTaskId(42L)
                .filePath("src/test/java/org/example/service/ClinicServiceTests.java")
                .content("class ClinicServiceTests { void businessServiceImplementationTest() {} }")
                .startLine(1)
                .endLine(30)
                .build();
        CodeChunk repository = CodeChunk.builder()
                .scanTaskId(42L)
                .filePath("src/main/java/org/example/owner/OwnerRepository.java")
                .content("interface OwnerRepository extends Repository<Owner, Integer> {}")
                .startLine(1)
                .endLine(20)
                .build();

        List<CodeChunk> result = CodeChunkRanker.rank(
                List.of(testService, repository),
                "service business logic implementation",
                2);

        assertEquals(repository, result.get(0));
    }

    @Test
    void rank_shouldPreferLibraryMainSourceOverTestWhenQueryDoesNotAskForTests() {
        CodeChunk testParser = CodeChunk.builder()
                .scanTaskId(42L)
                .filePath("src/test/java/org/apache/commons/cli/DefaultParserTest.java")
                .content("""
                        class DefaultParserTest {
                            void parseCommandLineOptionsTest() {
                                parse command line options commandline parser option parser;
                            }
                        }
                        """)
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk mainParser = CodeChunk.builder()
                .scanTaskId(42L)
                .filePath("src/main/java/org/apache/commons/cli/DefaultParser.java")
                .content("""
                        public class DefaultParser implements CommandLineParser {
                            public CommandLine parse(Options options, String[] arguments) {
                                return parse(options, arguments, null);
                            }
                        }
                        """)
                .startLine(1)
                .endLine(80)
                .build();

        List<CodeChunk> result = CodeChunkRanker.rank(
                List.of(testParser, mainParser),
                "src/main/java org.apache.commons.cli option parser commandline",
                2);

        assertEquals(mainParser, result.get(0));
    }

    @Test
    void sourceRootHints_shouldRecognizeBareMainSourceRootAndExcludeTestRoot() {
        assertTrue(CodeChunkRanker.sourceRootHints("src/main/java org.apache.commons.cli option parser")
                .contains("src/main/java"));

        CodeChunk mainParser = CodeChunk.builder()
                .scanTaskId(42L)
                .filePath("src/main/java/org/apache/commons/cli/DefaultParser.java")
                .content("public class DefaultParser {}")
                .startLine(1)
                .endLine(20)
                .build();
        CodeChunk testParser = CodeChunk.builder()
                .scanTaskId(42L)
                .filePath("src/test/java/org/apache/commons/cli/DefaultParserTest.java")
                .content("class DefaultParserTest { void orgApacheCommonsCliOptionParserNoise() {} }")
                .startLine(1)
                .endLine(20)
                .build();

        List<CodeChunk> result = CodeChunkRanker.rank(
                List.of(testParser, mainParser),
                "src/main/java org.apache.commons.cli option parser",
                2);

        assertEquals(mainParser, result.get(0));
    }

    @Test
    void rank_shouldKeepTestIntentAbleToSelectTestFiles() {
        CodeChunk mainParser = CodeChunk.builder()
                .scanTaskId(42L)
                .filePath("src/main/java/org/apache/commons/cli/DefaultParser.java")
                .content("public class DefaultParser implements CommandLineParser {}")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk testParser = CodeChunk.builder()
                .scanTaskId(42L)
                .filePath("src/test/java/org/apache/commons/cli/DefaultParserTest.java")
                .content("class DefaultParserTest { void parseCommandLineOptionsTest() {} }")
                .startLine(1)
                .endLine(30)
                .build();

        List<CodeChunk> result = CodeChunkRanker.rank(
                List.of(mainParser, testParser),
                "DefaultParserTest test file",
                2);

        assertEquals(testParser, result.get(0));
    }

    @Test
    void roleIntentTypes_shouldTreatFrontendBackendBridgeQuestionsAsFrontendAndControllerIntent() {
        List<String> intents = CodeChunkRanker.roleIntentTypes("前端登录按钮点击后调用哪个后端接口");

        assertTrue(intents.contains("FRONTEND"));
        assertTrue(intents.contains("CONTROLLER"));
        assertFalse(intents.contains("SERVICE"));
        assertFalse(intents.contains("DATA_ACCESS"));
    }

    @Test
    void roleIntentTypes_shouldTreatButtonEndpointQuestionsAsFrontendAndControllerIntent() {
        List<String> intents = CodeChunkRanker.roleIntentTypes("登录按钮调用哪个接口");

        assertTrue(intents.contains("FRONTEND"));
        assertTrue(intents.contains("CONTROLLER"));
        assertFalse(intents.contains("SERVICE"));
        assertFalse(intents.contains("DATA_ACCESS"));
        assertFalse(CodeChunkRanker.roleIntentTypes("登录接口请求").contains("FRONTEND"));
    }

    @Test
    void roleIntentTypes_shouldTreatChinesePageEndpointQuestionsAsFrontendAndControllerIntent() {
        List<String> intents = CodeChunkRanker.roleIntentTypes("登录页调用哪个接口");

        assertTrue(intents.contains("FRONTEND"));
        assertTrue(intents.contains("CONTROLLER"));
        assertFalse(intents.contains("SERVICE"));
        assertFalse(intents.contains("DATA_ACCESS"));
        assertFalse(CodeChunkRanker.roleIntentTypes("分页接口请求").contains("FRONTEND"));
    }

    @Test
    void roleIntentTypes_shouldTreatChinesePageEndpointRelationQuestionsAsFrontendAndControllerIntent() {
        List<String> useIntents = CodeChunkRanker.roleIntentTypes("详情页用哪个接口");
        List<String> relationIntents = CodeChunkRanker.roleIntentTypes("登录页对应哪个接口");

        assertTrue(useIntents.contains("FRONTEND"));
        assertTrue(useIntents.contains("CONTROLLER"));
        assertTrue(relationIntents.contains("FRONTEND"));
        assertTrue(relationIntents.contains("CONTROLLER"));
        assertFalse(useIntents.contains("SERVICE"));
        assertFalse(relationIntents.contains("DATA_ACCESS"));
        assertFalse(CodeChunkRanker.roleIntentTypes("分页接口用什么").contains("FRONTEND"));
    }

    @Test
    void roleIntentTypes_shouldTreatChinesePageEndpointQuestionFormsAsFrontendAndControllerIntent() {
        List<String> whatIntents = CodeChunkRanker.roleIntentTypes("登录页面接口是什么");
        List<String> whereIntents = CodeChunkRanker.roleIntentTypes("登录页接口在哪里");

        assertTrue(whatIntents.contains("FRONTEND"));
        assertTrue(whatIntents.contains("CONTROLLER"));
        assertTrue(whereIntents.contains("FRONTEND"));
        assertTrue(whereIntents.contains("CONTROLLER"));
        assertFalse(whatIntents.contains("SERVICE"));
        assertFalse(whereIntents.contains("DATA_ACCESS"));
        assertFalse(CodeChunkRanker.roleIntentTypes("分页接口是什么").contains("FRONTEND"));
        assertFalse(CodeChunkRanker.roleIntentTypes("分页接口在哪里").contains("FRONTEND"));
    }

    @Test
    void roleIntentTypes_shouldTreatChinesePageEndpointNounPhrasesAsFrontendAndControllerIntent() {
        List<String> pageEndpoint = CodeChunkRanker.roleIntentTypes("登录页面接口");
        List<String> shortPageEndpoint = CodeChunkRanker.roleIntentTypes("登录页接口");

        assertTrue(pageEndpoint.contains("FRONTEND"));
        assertTrue(pageEndpoint.contains("CONTROLLER"));
        assertTrue(shortPageEndpoint.contains("FRONTEND"));
        assertTrue(shortPageEndpoint.contains("CONTROLLER"));
        assertFalse(pageEndpoint.contains("SERVICE"));
        assertFalse(shortPageEndpoint.contains("DATA_ACCESS"));
        assertFalse(CodeChunkRanker.roleIntentTypes("分页接口").contains("FRONTEND"));
    }

    @Test
    void roleIntentTypes_shouldTreatEnglishPageEndpointNounPhrasesAsFrontendAndControllerIntent() {
        List<String> pageEndpoint = CodeChunkRanker.roleIntentTypes("login page endpoint");
        List<String> pageApi = CodeChunkRanker.roleIntentTypes("login page api");

        assertTrue(pageEndpoint.contains("FRONTEND"));
        assertTrue(pageEndpoint.contains("CONTROLLER"));
        assertTrue(pageApi.contains("FRONTEND"));
        assertTrue(pageApi.contains("CONTROLLER"));
        assertFalse(pageEndpoint.contains("SERVICE"));
        assertFalse(pageApi.contains("DATA_ACCESS"));
        assertFalse(CodeChunkRanker.roleIntentTypes("pagination endpoint").contains("FRONTEND"));
    }

    @Test
    void roleIntentTypes_shouldTreatNaturalEndpointQuestionsAsControllerIntent() {
        assertTrue(CodeChunkRanker.roleIntentTypes("login endpoint").contains("CONTROLLER"));
        assertTrue(CodeChunkRanker.roleIntentTypes("登录接口在哪里").contains("CONTROLLER"));
        assertTrue(CodeChunkRanker.roleIntentTypes("订单路由").contains("CONTROLLER"));
    }

    @Test
    void roleIntentTypes_shouldTreatBackendDatabaseFlowQuestionsAsCrossLayerIntent() {
        List<String> chinese = CodeChunkRanker.roleIntentTypes("这个登录接口如何从 controller 到 mapper 查数据库");
        assertTrue(chinese.contains("CONTROLLER"));
        assertTrue(chinese.contains("SERVICE"));
        assertTrue(chinese.contains("DATA_ACCESS"));

        List<String> english = CodeChunkRanker.roleIntentTypes("login endpoint flow from controller to service mapper database");
        assertTrue(english.contains("CONTROLLER"));
        assertTrue(english.contains("SERVICE"));
        assertTrue(english.contains("DATA_ACCESS"));
    }

    @Test
    void roleIntentTypes_shouldIncludeDomainModelForBackendTableFlowQuestions() {
        List<String> intents = CodeChunkRanker.roleIntentTypes("这个登录接口如何从 controller 到 mapper 写入用户数据表实体");

        assertTrue(intents.contains("CONTROLLER"));
        assertTrue(intents.contains("SERVICE"));
        assertTrue(intents.contains("DATA_ACCESS"));
        assertTrue(intents.contains("DOMAIN_MODEL"));
    }

    @Test
    void roleIntentTypes_shouldIncludeDomainModelForChineseWriteTableFlowQuestions() {
        List<String> intents = CodeChunkRanker.roleIntentTypes("支付接口怎么写表");

        assertTrue(intents.contains("CONTROLLER"));
        assertTrue(intents.contains("SERVICE"));
        assertTrue(intents.contains("DATA_ACCESS"));
        assertTrue(intents.contains("DOMAIN_MODEL"));
    }

    @Test
    void roleIntentTypes_shouldIncludeDomainModelForChineseCrudFlowQuestions() {
        List<String> intents = CodeChunkRanker.roleIntentTypes("支付接口怎么保存订单");

        assertTrue(intents.contains("CONTROLLER"));
        assertTrue(intents.contains("SERVICE"));
        assertTrue(intents.contains("DATA_ACCESS"));
        assertTrue(intents.contains("DOMAIN_MODEL"));
    }

    @Test
    void roleIntentTypes_shouldIncludeDomainModelForChineseReadFlowQuestions() {
        List<String> intents = CodeChunkRanker.roleIntentTypes("支付接口怎么查询订单");

        assertTrue(intents.contains("CONTROLLER"));
        assertTrue(intents.contains("SERVICE"));
        assertTrue(intents.contains("DATA_ACCESS"));
        assertTrue(intents.contains("DOMAIN_MODEL"));
    }

    @Test
    void roleIntentTypes_shouldIncludeDomainModelForChineseResponseDataFlowQuestions() {
        List<String> intents = CodeChunkRanker.roleIntentTypes("订单详情接口怎么返回数据");

        assertTrue(intents.contains("CONTROLLER"));
        assertTrue(intents.contains("SERVICE"));
        assertTrue(intents.contains("DATA_ACCESS"));
        assertTrue(intents.contains("DOMAIN_MODEL"));
    }

    @Test
    void roleIntentTypes_shouldKeepBackendFlowIntentWhenMethodAnchorIsPresent() {
        List<String> intents = CodeChunkRanker.roleIntentTypes("PaymentController#createPayment 怎么从 controller 到 mapper 落库");

        assertTrue(intents.contains("CONTROLLER"));
        assertTrue(intents.contains("SERVICE"));
        assertTrue(intents.contains("DATA_ACCESS"));
    }

    @Test
    void roleIntentTypes_shouldNotExpandPlainEndpointQuestionToAllBackendRoles() {
        List<String> intents = CodeChunkRanker.roleIntentTypes("login endpoint");

        assertTrue(intents.contains("CONTROLLER"));
        assertFalse(intents.contains("SERVICE"));
        assertFalse(intents.contains("DATA_ACCESS"));
    }

    @Test
    void roleIntentTypes_shouldTreatRuntimeConfigurationQuestionsAsConfigIntent() {
        assertTrue(CodeChunkRanker.roleIntentTypes("CORS 配置在哪里").contains("CONFIG"));
        assertTrue(CodeChunkRanker.roleIntentTypes("application.yml datasource config").contains("CONFIG"));
        assertTrue(CodeChunkRanker.roleIntentTypes("数据库配置和环境变量在哪里").contains("CONFIG"));
        assertTrue(CodeChunkRanker.roleIntentTypes("spring boot runtime config").contains("CONFIG"));
        assertFalse(CodeChunkRanker.roleIntentTypes("模型配置页按钮").contains("CONFIG"));
        assertFalse(CodeChunkRanker.roleIntentTypes("model config page button").contains("CONFIG"));
        assertFalse(CodeChunkRanker.roleIntentTypes("ModelConfig page").contains("CONFIG"));
    }

    @Test
    void roleIntentTypes_shouldTreatOperationalPolicyQuestionsAsServiceFirstIntent() {
        List<String> toolPolicy = CodeChunkRanker.roleIntentTypes("子任务可以使用哪些能力在哪里判断");
        List<String> shellPolicy = CodeChunkRanker.roleIntentTypes("危险命令参数在哪里被拒绝");

        assertEquals("SERVICE", toolPolicy.get(0));
        assertTrue(toolPolicy.contains("CONFIG"));
        assertTrue(toolPolicy.contains("CONTROLLER"));
        assertEquals("SERVICE", shellPolicy.get(0));
        assertTrue(shellPolicy.contains("CONFIG"));
        assertTrue(shellPolicy.contains("CONTROLLER"));
    }

    @Test
    void roleIntentTypes_shouldTreatWeakDataLoadingQuestionsAsDataAccessFirstIntent() {
        List<String> intents = CodeChunkRanker.roleIntentTypes("实验开关数据在哪里加载");

        assertEquals("DATA_ACCESS", intents.get(0));
        assertTrue(intents.contains("SERVICE"));
        assertTrue(intents.contains("CONFIG"));
    }

    @Test
    void evidenceType_shouldTreatConfigSourcePathsAsConfigEvidence() {
        assertEquals("CONFIG", CodeChunkRanker.evidenceType(chunk("src/main/resources/application.yml")));
    }

    @Test
    void evidenceType_shouldNotTreatStaticResourcesAsConfigEvidence() {
        assertEquals("FRONTEND", CodeChunkRanker.evidenceType(
                chunk("src/main/resources/admin/src/style/forgetpasswor.scss")));
    }

    @Test
    void evidenceType_shouldTreatTopLevelTestDirectoriesAsTestEvidence() {
        assertEquals("TEST", CodeChunkRanker.evidenceType(chunk("test/Router.js")));
        assertEquals("TEST", CodeChunkRanker.evidenceType(chunk("tests/router.spec.ts")));
    }

    @Test
    void roleIntentTypes_shouldTreatTestFileQuestionsAsTestIntent() {
        assertTrue(CodeChunkRanker.roleIntentTypes("AuthService 单元测试文件在哪里").contains("TEST"));
        assertTrue(CodeChunkRanker.roleIntentTypes("login endpoint integration test file").contains("TEST"));
        assertTrue(CodeChunkRanker.roleIntentTypes("playwright spec for login page").contains("TEST"));
        assertTrue(CodeChunkRanker.roleIntentTypes("AuthServiceTest").contains("TEST"));
        assertFalse(CodeChunkRanker.roleIntentTypes("测试一下登录接口").contains("TEST"));
        assertFalse(CodeChunkRanker.roleIntentTypes("登录页测试按钮").contains("TEST"));
        assertFalse(CodeChunkRanker.roleIntentTypes("latest project status").contains("TEST"));
        assertFalse(CodeChunkRanker.roleIntentTypes("contest controller").contains("TEST"));
        assertFalse(CodeChunkRanker.roleIntentTypes("protest workflow").contains("TEST"));
    }

    @Test
    void roleIntentTypes_shouldTreatDocumentationQuestionsAsDocumentationIntent() {
        assertTrue(CodeChunkRanker.roleIntentTypes("项目文档 README.md 在哪里").contains("DOCUMENTATION"));
        assertTrue(CodeChunkRanker.roleIntentTypes("部署文档在哪里").contains("DOCUMENTATION"));
        assertTrue(CodeChunkRanker.roleIntentTypes("operations runbook guide").contains("DOCUMENTATION"));
        assertFalse(CodeChunkRanker.roleIntentTypes("document parser service").contains("DOCUMENTATION"));
        assertFalse(CodeChunkRanker.roleIntentTypes("用户上传 document 文件").contains("DOCUMENTATION"));
        assertFalse(CodeChunkRanker.roleIntentTypes("uploaded document file").contains("DOCUMENTATION"));
        assertFalse(CodeChunkRanker.roleIntentTypes("document file parser").contains("DOCUMENTATION"));
    }

    @Test
    void searchChunks_shouldPrioritizeExactFileNameFromFullPathQuery() {
        CodeChunk genericService = CodeChunk.builder()
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/service/GenericService.java")
                .content("class GenericService { void controller() {} }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk target = CodeChunk.builder()
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/PawnTicketController.java")
                .content("@RestController class PawnTicketController { }")
                .startLine(1)
                .endLine(40)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class))).thenReturn(List.of(genericService, target));

        List<CodeChunk> result = codeChunkService.searchChunks(
                42L,
                "src/main/java/com/example/controller/PawnTicketController.java",
                2
        );

        assertEquals(List.of(target, genericService), result);
    }

    @Test
    void searchChunks_shouldPrioritizeChunkCoveringRequestedLineNumber() {
        CodeChunk first = CodeChunk.builder()
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/PawnTicketController.java")
                .content("@RestController class PawnTicketController {")
                .startLine(1)
                .endLine(50)
                .build();
        CodeChunk target = CodeChunk.builder()
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/PawnTicketController.java")
                .content("public PawnTicketDto detail(Long id) { return service.detail(id); }")
                .startLine(81)
                .endLine(130)
                .build();
        CodeChunk later = CodeChunk.builder()
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/PawnTicketController.java")
                .content("private void audit() {}")
                .startLine(131)
                .endLine(180)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class))).thenReturn(List.of(first, later, target));

        List<CodeChunk> result = codeChunkService.searchChunks(
                42L,
                "src/main/java/com/example/controller/PawnTicketController.java:85",
                3
        );

        assertEquals(target, result.get(0));
    }

    @Test
    void searchChunks_shouldIgnoreColumnNumberInPathLineHints() {
        CodeChunk classHeader = CodeChunk.builder()
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/PawnTicketController.java")
                .content("@RestController class PawnTicketController {")
                .startLine(1)
                .endLine(30)
                .build();
        CodeChunk target = CodeChunk.builder()
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/PawnTicketController.java")
                .content("public PawnTicketDto detail(Long id) { return service.detail(id); }")
                .startLine(81)
                .endLine(130)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class))).thenReturn(List.of(classHeader, target));

        List<CodeChunk> result = codeChunkService.searchChunks(
                42L,
                "src/main/java/com/example/controller/PawnTicketController.java:85:13",
                2
        );

        assertEquals(target, result.get(0));
    }

    @Test
    void searchChunks_shouldHandlePathLineColumnRangesAsLineRanges() {
        CodeChunk classHeader = CodeChunk.builder()
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/PawnTicketController.java")
                .content("@RestController class PawnTicketController {")
                .startLine(1)
                .endLine(30)
                .build();
        CodeChunk target = CodeChunk.builder()
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/PawnTicketController.java")
                .content("public PawnTicketDto detail(Long id) { return service.detail(id); }")
                .startLine(81)
                .endLine(130)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class))).thenReturn(List.of(classHeader, target));

        List<CodeChunk> result = codeChunkService.searchChunks(
                42L,
                "src/main/java/com/example/controller/PawnTicketController.java:85:13-90:2",
                2
        );

        assertEquals(target, result.get(0));
    }

    @Test
    void searchChunks_shouldPrioritizeChunkContainingRequestedMethodReference() {
        CodeChunk classHeader = CodeChunk.builder()
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/PawnTicketController.java")
                .content("@RestController class PawnTicketController { private PawnTicketService service; }")
                .startLine(1)
                .endLine(50)
                .build();
        CodeChunk target = CodeChunk.builder()
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/PawnTicketController.java")
                .content("public PawnTicketDto detail(Long id) { return service.detail(id); }")
                .startLine(81)
                .endLine(130)
                .build();
        CodeChunk audit = CodeChunk.builder()
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/PawnTicketController.java")
                .content("private void audit() {}")
                .startLine(131)
                .endLine(180)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class))).thenReturn(List.of(classHeader, audit, target));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "PawnTicketController#detail", 3);

        assertEquals(target, result.get(0));
    }

    @Test
    void searchChunks_shouldAppendMethodAnchorFileCandidatesWhenGenericKeywordPoolMissesTarget() {
        CodeChunk tableJs = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("src/main/resources/admin/src/config/config/table.js")
                .content("export default { page: true, config: {} }")
                .startLine(1)
                .endLine(30)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/ConfigController.java")
                .content("@RestController class ConfigController { public Result page(Query query) { return ok(); } }")
                .startLine(31)
                .endLine(60)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(tableJs))
                .thenReturn(List.of(target));

        List<CodeChunk> result = codeChunkService.searchChunks(42L, "ConfigController#page", 5);

        assertEquals(target, result.get(0));
        verify(codeChunkMapper, times(2)).selectList(any(Wrapper.class));
    }

    @Test
    void searchChunks_shouldAppendKebabCaseMethodAnchorFileCandidates() {
        CodeChunk generic = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("src/main/resources/admin/src/config/config/table.js")
                .content("export default { fetchUser: true, config: {} }")
                .startLine(1)
                .endLine(30)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("web-console/src/stores/auth-store.ts")
                .content("export class AuthStore { async fetchUser() { return api.me(); } }")
                .startLine(81)
                .endLine(130)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(generic))
                .thenReturn(List.of(target));

        List<CodeChunk> result = codeChunkService.searchChunks(
                42L,
                "AuthStore.fetchUser(auth-store.ts:85:13)",
                5
        );

        assertEquals(target, result.get(0));
        verify(codeChunkMapper, times(2)).selectList(any(Wrapper.class));
    }

    @Test
    void searchChunks_shouldAppendFunctionFileStackFrameCandidates() {
        CodeChunk generic = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/config/table.ts")
                .content("export const table = { fetchUser: true }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("web-console/src/stores/auth-store.ts")
                .content("export async function fetchUser() { return api.me(); }")
                .startLine(81)
                .endLine(130)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(generic))
                .thenReturn(List.of(target));

        List<CodeChunk> result = codeChunkService.searchChunks(
                42L,
                "at fetchUser (http://localhost:5173/src/stores/auth-store.ts:85:13)",
                5
        );

        assertEquals(target, result.get(0));
        verify(codeChunkMapper, times(3)).selectList(any(Wrapper.class));
    }

    @Test
    void searchChunks_shouldAppendViteQueryStackFrameFileCandidates() {
        CodeChunk generic = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/config/table.ts")
                .content("export const table = { submitQa: true }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("web-console/src/pages/ProjectDetail.tsx")
                .content("async function submitQa() { return projectApi.qa(); }")
                .startLine(241)
                .endLine(260)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(generic))
                .thenReturn(List.of(target));

        List<CodeChunk> result = codeChunkService.searchChunks(
                42L,
                "TypeError: failed to submit\n" +
                        "    at submitQa (http://localhost:5173/src/pages/ProjectDetail.tsx?t=1782991000000:245:19)",
                5
        );

        assertEquals(target, result.get(0));
        verify(codeChunkMapper, times(3)).selectList(any(Wrapper.class));
    }

    @Test
    void searchChunks_shouldPreferSourceUrlPathCandidateOverSameNamedFileDecoy() {
        CodeChunk sameNameDecoy = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/legacy/ProjectDetail.tsx")
                .content("async function submitQa() { return legacyApi.qa(); }")
                .startLine(241)
                .endLine(260)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("web-console/src/pages/ProjectDetail.tsx")
                .content("async function submitQa() { return projectApi.qa(); }")
                .startLine(241)
                .endLine(260)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(sameNameDecoy))
                .thenReturn(List.of(target))
                .thenReturn(List.of(sameNameDecoy));

        List<CodeChunk> result = codeChunkService.searchChunks(
                42L,
                "TypeError: failed to submit\n" +
                        "    at submitQa (http://localhost:5173/src/pages/ProjectDetail.tsx?t=1782991000000:245:19)",
                5
        );

        assertEquals(target, result.get(0));
        assertTrue(result.contains(sameNameDecoy));
        verify(codeChunkMapper, times(3)).selectList(any(Wrapper.class));
    }

    @Test
    void searchChunks_shouldPreserveExactLineAnchorAsFirstResultWhenGenericNoiseRanksHigher() {
        CodeChunk genericNoise = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("src/main/java/app/controller/TargetController.java")
                .content("targetcontroller controller alpha beta gamma delta epsilon zeta eta theta iota kappa lambda")
                .startLine(401)
                .endLine(430)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/app/controller/TargetController.java")
                .content("public TargetDto detail(Long id) { return service.detail(id); }")
                .startLine(81)
                .endLine(90)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(genericNoise))
                .thenReturn(List.of(target));

        List<CodeChunk> result = codeChunkService.searchChunks(
                42L,
                "alpha beta gamma delta epsilon zeta eta theta iota kappa lambda "
                        + "src/main/java/app/controller/TargetController.java:85",
                5
        );

        assertEquals(target, result.get(0));
        assertTrue(result.contains(genericNoise));
    }

    @Test
    void searchChunks_shouldAppendAnonymousStackFrameFileCandidates() {
        CodeChunk generic = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/config/table.ts")
                .content("export const table = { anonymous: true }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("web-console/src/stores/auth-store.ts")
                .content("export const authStore = { bootstrap() { return api.me(); } }")
                .startLine(81)
                .endLine(130)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(generic))
                .thenReturn(List.of(target));

        List<CodeChunk> result = codeChunkService.searchChunks(
                42L,
                "TypeError: cannot read properties of undefined\n" +
                        "    at Object.<anonymous> (webpack://source-lens/./web-console/src/stores/auth-store.ts:85:13)",
                5
        );

        assertEquals(target, result.get(0));
        verify(codeChunkMapper, times(3)).selectList(any(Wrapper.class));
    }

    @Test
    void searchChunks_shouldAppendSafariFunctionAtSourceUrlCandidates() {
        CodeChunk generic = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("web-console/src/config/table.ts")
                .content("export const table = { fetchUser: false }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("web-console/src/stores/auth-store.ts")
                .content("export const authStore = { fetchUser() { return api.me(); } }")
                .startLine(81)
                .endLine(130)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(generic))
                .thenReturn(List.of(target));

        List<CodeChunk> result = codeChunkService.searchChunks(
                42L,
                "TypeError: session expired\n" +
                        "AuthStore.fetchUser@https://app.example.com/assets/auth-store.ts?t=1782991000000:85:13",
                5
        );

        assertEquals(target, result.get(0));
        verify(codeChunkMapper, times(3)).selectList(any(Wrapper.class));
    }

    @Test
    void searchChunks_shouldIgnoreBrowserDevServerPortWhenRankingStandaloneSourceUrl() {
        CodeChunk portLineChunk = CodeChunk.builder()
                .scanTaskId(42L)
                .filePath("web-console/src/generated/api-client.ts")
                .content("export function legacyApiClient() { return request.get('/legacy'); }")
                .startLine(2981)
                .endLine(3020)
                .build();
        CodeChunk target = CodeChunk.builder()
                .scanTaskId(42L)
                .filePath("web-console/src/generated/api-client.ts")
                .content("export function createOrder(payload) { return request.post('/orders', payload); }")
                .startLine(3381)
                .endLine(3420)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class))).thenReturn(List.of(portLineChunk, target));

        List<CodeChunk> result = codeChunkService.searchChunks(
                42L,
                "http://localhost:3000/src/generated/api-client.ts:3402:17",
                2
        );

        assertEquals(target, result.get(0));
    }

    @Test
    void searchChunks_shouldIgnoreViteDevServerPortWhenRankingStandaloneViteSourceUrl() {
        CodeChunk portLineChunk = CodeChunk.builder()
                .scanTaskId(42L)
                .filePath("web-console/src/pages/ProjectDetail.tsx")
                .content("export function unrelatedPortRange() { return 'port range only'; }")
                .startLine(5160)
                .endLine(5180)
                .build();
        CodeChunk target = CodeChunk.builder()
                .scanTaskId(42L)
                .filePath("web-console/src/pages/ProjectDetail.tsx")
                .content("async function submitQa() { return projectApi.qa(); }")
                .startLine(241)
                .endLine(260)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class))).thenReturn(List.of(portLineChunk, target));

        List<CodeChunk> result = codeChunkService.searchChunks(
                42L,
                "http://localhost:5173/src/pages/ProjectDetail.tsx?t=1782991000000:245:19",
                2
        );

        assertEquals(target, result.get(0));
    }

    @Test
    void searchChunks_shouldPrioritizeChunkContainingStackTraceMethodAndLine() {
        CodeChunk classHeader = CodeChunk.builder()
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/service/AuthService.java")
                .content("@Service class AuthService { private TokenRepository repository; }")
                .startLine(1)
                .endLine(60)
                .build();
        CodeChunk target = CodeChunk.builder()
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/service/AuthService.java")
                .content("boolean validateJwtSignature(String token) { return verifier.verify(token); }")
                .startLine(81)
                .endLine(130)
                .build();
        CodeChunk tokenParser = CodeChunk.builder()
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/service/AuthService.java")
                .content("TokenClaims parseToken(String token) { return parser.parse(token); }")
                .startLine(131)
                .endLine(180)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class))).thenReturn(List.of(classHeader, tokenParser, target));

        List<CodeChunk> result = codeChunkService.searchChunks(
                42L,
                "at com.example.service.AuthService.validateJwtSignature(AuthService.java:85)",
                3
        );

        assertEquals(target, result.get(0));
    }

    @Test
    void listRetrievalCandidates_shouldAppendMethodAnchorFileCandidatesForCodeQa() {
        CodeChunk tableJs = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("src/main/resources/admin/src/config/config/table.js")
                .content("export default { page: true, config: {} }")
                .startLine(1)
                .endLine(30)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/ConfigController.java")
                .content("@RestController class ConfigController { public Result page(Query query) { return ok(); } }")
                .startLine(31)
                .endLine(60)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(tableJs))
                .thenReturn(List.of(target));

        List<CodeChunk> result = codeChunkService.listRetrievalCandidates(42L, "ConfigController#page");

        assertEquals(target, result.get(0));
        verify(codeChunkMapper, times(2)).selectList(any(Wrapper.class));
    }

    @Test
    void listRetrievalCandidates_shouldAppendQualifiedPackageMethodCandidatesForCodeQa() {
        CodeChunk sameNamedDecoy = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/acme/user/service/AuthService.java")
                .content("boolean validateJwt(String token) { return userVerifier.verify(token); }")
                .startLine(81)
                .endLine(130)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/acme/billing/service/AuthService.java")
                .content("boolean validateJwt(String token) { return billingVerifier.verify(token); }")
                .startLine(81)
                .endLine(130)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(sameNamedDecoy))
                .thenReturn(List.of(target));

        List<CodeChunk> result = codeChunkService.listRetrievalCandidates(
                42L,
                "at com.acme.billing.service.AuthService.validateJwt(AuthService.java:85)"
        );

        assertEquals(target, result.get(0));
        assertTrue(result.contains(sameNamedDecoy));
    }

    @Test
    void listRetrievalCandidates_shouldAppendJsonHandlerClassMethodCandidatesForReportApiRoute() {
        CodeChunk sameNamedDecoy = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/acme/user/controller/PaymentController.java")
                .content("@RestController class PaymentController { public void createPayment() { userPayment(); } }")
                .startLine(81)
                .endLine(130)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/acme/billing/controller/PaymentController.java")
                .content("@RestController class PaymentController { public void createPayment() { billingPayment(); } }")
                .startLine(81)
                .endLine(130)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(sameNamedDecoy))
                .thenReturn(List.of(target));

        List<CodeChunk> result = codeChunkService.listRetrievalCandidates(
                42L,
                """
                解释这个 API 路由
                {
                  "handler_class": "com.acme.billing.controller.PaymentController",
                  "handler_method": "createPayment",
                  "line_number": 90
                }
                """
        );

        assertEquals(target, result.get(0));
        assertTrue(result.contains(sameNamedDecoy));
        verify(codeChunkMapper, times(2)).selectList(any(Wrapper.class));
    }

    @Test
    void listRetrievalCandidates_shouldAppendJsonHandlerMethodClassCandidatesWhenFieldsAreReversed() {
        CodeChunk sameNamedDecoy = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/acme/user/controller/PaymentController.java")
                .content("@RestController class PaymentController { public void createPayment() { userPayment(); } }")
                .startLine(81)
                .endLine(130)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/acme/billing/controller/PaymentController.java")
                .content("@RestController class PaymentController { public void createPayment() { billingPayment(); } }")
                .startLine(81)
                .endLine(130)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(sameNamedDecoy))
                .thenReturn(List.of(target));

        List<CodeChunk> result = codeChunkService.listRetrievalCandidates(
                42L,
                """
                解释这个 API 路由
                {
                  "handler_method": "createPayment",
                  "handler_class": "com.acme.billing.controller.PaymentController",
                  "line_number": 90
                }
                """
        );

        assertEquals(target, result.get(0));
        assertTrue(result.contains(sameNamedDecoy));
        verify(codeChunkMapper, times(2)).selectList(any(Wrapper.class));
    }

    @Test
    void listRetrievalCandidates_shouldAppendEvidenceFilePathAnchorCandidatesForCodeQa() {
        CodeChunk reportDoc = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("docs/report.md")
                .content("报告证据 注册接口 追问")
                .startLine(1)
                .endLine(20)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/RegisterController.java")
                .content("@RestController class RegisterController { public void register() {} }")
                .startLine(81)
                .endLine(130)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(reportDoc))
                .thenReturn(List.of())
                .thenReturn(List.of(target));

        List<CodeChunk> result = codeChunkService.listRetrievalCandidates(
                42L,
                "解释这个报告证据\nfilePath: src/main/java/com/example/controller/RegisterController.java\nline: 90"
        );

        assertEquals(target, result.get(0));
        assertTrue(result.contains(reportDoc));
        verify(codeChunkMapper, times(3)).selectList(any(Wrapper.class));
    }

    @Test
    void listRetrievalCandidates_shouldAppendSnakeCaseEvidenceFilePathAnchorCandidatesForReportJson() {
        CodeChunk reportDoc = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("docs/report.md")
                .content("报告 JSON 证据 注册接口 追问")
                .startLine(1)
                .endLine(20)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/RegisterController.java")
                .content("@RestController class RegisterController { public void register() {} }")
                .startLine(81)
                .endLine(130)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(reportDoc))
                .thenReturn(List.of())
                .thenReturn(List.of(target));

        List<CodeChunk> result = codeChunkService.listRetrievalCandidates(
                42L,
                "解释这个报告 JSON 证据\nfile_path: src/main/java/com/example/controller/RegisterController.java\nline: 90"
        );

        assertEquals(target, result.get(0));
        assertTrue(result.contains(reportDoc));
        verify(codeChunkMapper, times(3)).selectList(any(Wrapper.class));
    }

    @Test
    void listRetrievalCandidates_shouldAppendSourcePathEvidenceAnchorCandidatesForReportJson() {
        String evidenceFilePath = "src/main/java/com/example/controller/RegisterController.java";
        CodeChunk reportDoc = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("docs/report.md")
                .content("报告 JSON 证据 注册接口 追问")
                .startLine(1)
                .endLine(20)
                .build();
        CodeChunk classHeader = CodeChunk.builder()
                .id(98L)
                .scanTaskId(42L)
                .filePath(evidenceFilePath)
                .content("@RestController class RegisterController { private RegisterService service; }")
                .startLine(1)
                .endLine(50)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath(evidenceFilePath)
                .content("public void register(RegisterRequest request) { service.register(request); }")
                .startLine(81)
                .endLine(130)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(reportDoc, classHeader, target))
                .thenReturn(List.of());

        List<CodeChunk> result = codeChunkService.listRetrievalCandidates(
                42L,
                """
                解释这个报告 JSON 证据
                {
                  "sourcePath": "src/main/java/com/example/controller/RegisterController.java",
                  "lineNumber": 90,
                  "path": "docs/not-an-evidence-anchor.md"
                }
                """
        );

        assertEquals(target, result.get(0));
        assertTrue(result.contains(classHeader));
        assertTrue(result.contains(reportDoc));
    }

    @Test
    void listRetrievalCandidates_shouldRankQuotedJsonEvidenceFilePathAnchorAboveReportText() {
        String evidenceFilePath = "src/main/java/com/example/controller/RegisterController.java";
        CodeChunk reportDoc = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("docs/report.md")
                .content("报告 JSON 证据 注册接口 追问")
                .startLine(1)
                .endLine(20)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath(evidenceFilePath)
                .content("@RestController class RegisterController { public void register() {} }")
                .startLine(81)
                .endLine(130)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(reportDoc, target))
                .thenReturn(List.of());

        List<CodeChunk> result = codeChunkService.listRetrievalCandidates(
                42L,
                """
                解释这个报告 JSON 证据
                {
                  "file_path": "./src/main/java/com/example/controller/RegisterController.java#L90",
                  "path": "docs/not-an-evidence-anchor.md"
                }
                """
        );

        assertEquals(target, result.get(0));
        assertTrue(result.contains(reportDoc));
        @SuppressWarnings({"rawtypes", "unchecked"})
        ArgumentCaptor<Wrapper<CodeChunk>> wrapperCaptor = ArgumentCaptor.forClass((Class) Wrapper.class);
        verify(codeChunkMapper, atLeastOnce()).selectList(wrapperCaptor.capture());
        assertTrue(wrapperCaptor.getAllValues().stream()
                .map(wrapper -> (AbstractWrapper<?, ?, ?>) wrapper)
                .map(AbstractWrapper::getCustomSqlSegment)
                .anyMatch(segment -> segment.contains("file_path =")));
    }

    @Test
    void listRetrievalCandidates_shouldUseQuotedJsonLineNumberToSelectChunkWithinSameEvidenceFile() {
        String evidenceFilePath = "src/main/java/com/example/controller/RegisterController.java";
        CodeChunk reportDoc = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("docs/report.md")
                .content("报告 JSON 证据 注册接口 追问")
                .startLine(1)
                .endLine(20)
                .build();
        CodeChunk classHeader = CodeChunk.builder()
                .id(98L)
                .scanTaskId(42L)
                .filePath(evidenceFilePath)
                .content("@RestController class RegisterController { private RegisterService service; }")
                .startLine(1)
                .endLine(50)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath(evidenceFilePath)
                .content("public void register(RegisterRequest request) { service.register(request); }")
                .startLine(81)
                .endLine(130)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(reportDoc, classHeader, target))
                .thenReturn(List.of());

        List<CodeChunk> result = codeChunkService.listRetrievalCandidates(
                42L,
                """
                解释这个报告 JSON 证据
                {
                  "file_path": "src/main/java/com/example/controller/RegisterController.java",
                  "line_number": 90
                }
                """
        );

        assertEquals(target, result.get(0));
        assertTrue(result.contains(classHeader));
        assertTrue(result.contains(reportDoc));
    }

    @Test
    void listRetrievalCandidates_shouldUseLineStartEndAliasesToSelectChunkWithinSameEvidenceFile() {
        String evidenceFilePath = "src/main/java/com/example/controller/RegisterController.java";
        CodeChunk reportDoc = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("docs/report.md")
                .content("报告 JSON 证据 注册接口 追问")
                .startLine(1)
                .endLine(20)
                .build();
        CodeChunk classHeader = CodeChunk.builder()
                .id(98L)
                .scanTaskId(42L)
                .filePath(evidenceFilePath)
                .content("@RestController class RegisterController { private RegisterService service; }")
                .startLine(1)
                .endLine(50)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath(evidenceFilePath)
                .content("public void register(RegisterRequest request) { service.register(request); }")
                .startLine(81)
                .endLine(130)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(reportDoc, classHeader, target))
                .thenReturn(List.of());

        List<CodeChunk> result = codeChunkService.listRetrievalCandidates(
                42L,
                """
                解释这个报告 JSON 证据
                {
                  "filePath": "src/main/java/com/example/controller/RegisterController.java",
                  "lineStart": 85,
                  "lineEnd": 120
                }
                """
        );

        assertEquals(target, result.get(0));
        assertTrue(result.contains(classHeader));
        assertTrue(result.contains(reportDoc));
    }

    @Test
    void listRetrievalCandidates_shouldNormalizeViteQueryEvidenceFilePathAnchorForCodeQa() {
        CodeChunk reportDoc = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("docs/report.md")
                .content("报告证据 项目详情 追问")
                .startLine(1)
                .endLine(20)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("web-console/src/pages/ProjectDetail.tsx")
                .content("async function submitQa() { return projectApi.qa(); }")
                .startLine(241)
                .endLine(260)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(reportDoc))
                .thenReturn(List.of(target));

        List<CodeChunk> result = codeChunkService.listRetrievalCandidates(
                42L,
                "解释这个报告证据\nfilePath: web-console/src/pages/ProjectDetail.tsx?t=1782991000000:245:19"
        );

        assertEquals(target, result.get(0));
        assertTrue(result.contains(reportDoc));
        verify(codeChunkMapper, times(2)).selectList(any(Wrapper.class));
    }

    @Test
    void listRetrievalCandidates_shouldUseEvidenceFilePathSuffixBeforeBasenameFallback() {
        CodeChunk reportDoc = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("docs/report.md")
                .content("报告证据 项目详情 追问")
                .startLine(1)
                .endLine(20)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("web-console/src/pages/ProjectDetail.tsx")
                .content("async function submitQa() { return projectApi.qa(); }")
                .startLine(241)
                .endLine(260)
                .build();
        CodeChunk sameNamedDecoy = CodeChunk.builder()
                .id(100L)
                .scanTaskId(42L)
                .filePath("web-console/src/legacy/ProjectDetail.tsx")
                .content("async function submitQa() { return legacyApi.qa(); }")
                .startLine(241)
                .endLine(260)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(reportDoc))
                .thenReturn(List.of(target, sameNamedDecoy));

        List<CodeChunk> result = codeChunkService.listRetrievalCandidates(
                42L,
                "解释这个报告证据\nfilePath: http://localhost:5173/src/pages/ProjectDetail.tsx?t=1782991000000:245:19"
        );

        assertEquals(target, result.get(0));
        assertTrue(result.contains(sameNamedDecoy));
    }

    @Test
    void listRetrievalCandidates_shouldNormalizeHostedBlobEvidenceUrlBeforeBasenameFallback() {
        CodeChunk reportDoc = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("docs/report.md")
                .content("报告证据 项目详情 GitHub URL 追问")
                .startLine(1)
                .endLine(20)
                .build();
        CodeChunk sameNamedDecoy = CodeChunk.builder()
                .id(98L)
                .scanTaskId(42L)
                .filePath("web-console/src/legacy/ProjectDetail.tsx")
                .content("async function submitQa() { return legacyApi.qa(); }")
                .startLine(241)
                .endLine(260)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("web-console/src/pages/ProjectDetail.tsx")
                .content("async function submitQa() { return projectApi.qa(); }")
                .startLine(241)
                .endLine(260)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(reportDoc))
                .thenReturn(List.of(sameNamedDecoy, target));

        List<CodeChunk> result = codeChunkService.listRetrievalCandidates(
                42L,
                "解释这个报告证据\n"
                        + "filePath: https://github.com/acme/source-lens/blob/main/web-console/src/pages/ProjectDetail.tsx#L245"
        );

        assertEquals(target, result.get(0));
        assertTrue(result.contains(sameNamedDecoy));
        verify(codeChunkMapper, times(2)).selectList(any(Wrapper.class));
    }

    @Test
    void listRetrievalCandidates_shouldNormalizeHostedRawEvidenceUrlBeforeBasenameFallback() {
        CodeChunk reportDoc = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("docs/report.md")
                .content("报告证据 项目详情 raw URL 追问")
                .startLine(1)
                .endLine(20)
                .build();
        CodeChunk sameNamedDecoy = CodeChunk.builder()
                .id(98L)
                .scanTaskId(42L)
                .filePath("web-console/src/legacy/ProjectDetail.tsx")
                .content("async function submitQa() { return legacyApi.qa(); }")
                .startLine(241)
                .endLine(260)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("web-console/src/pages/ProjectDetail.tsx")
                .content("async function submitQa() { return projectApi.qa(); }")
                .startLine(241)
                .endLine(260)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(reportDoc))
                .thenReturn(List.of(sameNamedDecoy, target));

        List<CodeChunk> result = codeChunkService.listRetrievalCandidates(
                42L,
                "解释这个报告证据\n"
                        + "sourcePath: https://raw.githubusercontent.com/acme/source-lens/main/web-console/src/pages/ProjectDetail.tsx#L245"
        );

        assertEquals(target, result.get(0));
        assertTrue(result.contains(sameNamedDecoy));
        verify(codeChunkMapper, times(2)).selectList(any(Wrapper.class));
    }

    @Test
    void listRetrievalCandidates_shouldNormalizeSourceUrlEvidenceAnchorBeforeBasenameFallback() {
        CodeChunk reportDoc = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("docs/report.md")
                .content("报告证据 项目详情 sourceUrl 追问")
                .startLine(1)
                .endLine(20)
                .build();
        CodeChunk sameNamedDecoy = CodeChunk.builder()
                .id(98L)
                .scanTaskId(42L)
                .filePath("web-console/src/legacy/ProjectDetail.tsx")
                .content("async function submitQa() { return legacyApi.qa(); }")
                .startLine(241)
                .endLine(260)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("web-console/src/pages/ProjectDetail.tsx")
                .content("async function submitQa() { return projectApi.qa(); }")
                .startLine(241)
                .endLine(260)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(reportDoc))
                .thenReturn(List.of(sameNamedDecoy, target));

        List<CodeChunk> result = codeChunkService.listRetrievalCandidates(
                42L,
                """
                解释这个报告证据
                {
                  "sourceUrl": "https://github.com/acme/source-lens/blob/feature/code-review/web-console/src/pages/ProjectDetail.tsx#L245",
                  "lineNumber": 245,
                  "url": "https://github.com/acme/source-lens/blob/main/web-console/src/legacy/ProjectDetail.tsx#L245"
                }
                """
        );

        assertEquals(target, result.get(0));
        assertTrue(result.contains(sameNamedDecoy));
        verify(codeChunkMapper, times(2)).selectList(any(Wrapper.class));
    }

    @Test
    void listRetrievalCandidates_shouldUseHostedSourceUrlAppRootVariantBeforeAmbiguousSuffixDecoy() {
        CodeChunk reportDoc = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("docs/report.md")
                .content("报告证据 Login sourceUrl 追问")
                .startLine(1)
                .endLine(20)
                .build();
        CodeChunk suffixDecoy = CodeChunk.builder()
                .id(98L)
                .scanTaskId(42L)
                .filePath("client/src/pages/Login.tsx")
                .content("export function Login() { return legacyLogin(); }")
                .startLine(40)
                .endLine(50)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("apps/client/src/pages/Login.tsx")
                .content("export function Login() { return currentLogin(); }")
                .startLine(40)
                .endLine(50)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(reportDoc))
                .thenReturn(List.of(suffixDecoy, target));

        List<CodeChunk> result = codeChunkService.listRetrievalCandidates(
                42L,
                """
                解释这个报告证据
                {
                  "sourceUrl": "https://github.com/acme/source-lens/blob/feature/apps/client/src/pages/Login.tsx#L44",
                  "lineNumber": 44
                }
                """
        );

        assertEquals(target, result.get(0));
        assertTrue(result.contains(suffixDecoy));
        verify(codeChunkMapper, times(2)).selectList(any(Wrapper.class));
    }

    @Test
    void listRetrievalCandidates_shouldUseModuleRootHintBeforeSameSuffixPackageDecoy() {
        CodeChunk reportDoc = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("docs/report.md")
                .content("报告证据 monorepo sourceRoot filePath 追问")
                .startLine(1)
                .endLine(20)
                .build();
        CodeChunk packageDecoy = CodeChunk.builder()
                .id(98L)
                .scanTaskId(42L)
                .filePath("packages/a-customer/src/pages/Login.tsx")
                .content("export function Login() { return sharedLogin(); }")
                .startLine(40)
                .endLine(50)
                .build();
        CodeChunk archiveDecoy = CodeChunk.builder()
                .id(100L)
                .scanTaskId(42L)
                .filePath("archive/packages/z-admin/src/pages/Login.tsx")
                .content("export function Login() { return archivedAdminLogin(); }")
                .startLine(40)
                .endLine(50)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("packages/z-admin/src/pages/Login.tsx")
                .content("export function Login() { return adminLogin(); }")
                .startLine(40)
                .endLine(50)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(reportDoc))
                .thenReturn(List.of(packageDecoy, archiveDecoy, target));

        List<CodeChunk> result = codeChunkService.listRetrievalCandidates(
                42L,
                """
                解释这个报告证据
                sourceRoot: packages/z-admin
                filePath: src/pages/Login.tsx
                """
        );

        assertEquals(target, result.get(0));
        assertTrue(result.contains(packageDecoy));
        assertTrue(result.contains(archiveDecoy));
        verify(codeChunkMapper, times(2)).selectList(any(Wrapper.class));
    }

    @Test
    void listRetrievalCandidates_shouldPreferCompactFileNameOverMiddleContainsNoisePath() {
        CodeChunk reportDoc = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("docs/report.md")
                .content("报告证据 ProjectDetail source path 追问")
                .startLine(1)
                .endLine(20)
                .build();
        CodeChunk generatedNoise = CodeChunk.builder()
                .id(98L)
                .scanTaskId(42L)
                .filePath("legacy/src/pages/ProjectDetail.tsx/generated/metadata.ts")
                .content("generated metadata for legacy project detail")
                .startLine(1)
                .endLine(20)
                .build();
        CodeChunk compactTarget = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("features/project-detail.tsx")
                .content("export function ProjectDetail() { return currentProjectDetail(); }")
                .startLine(40)
                .endLine(70)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(reportDoc))
                .thenReturn(List.of(generatedNoise, compactTarget));

        List<CodeChunk> result = codeChunkService.listRetrievalCandidates(
                42L,
                "解释这个报告证据\nfilePath: src/pages/ProjectDetail.tsx"
        );

        assertEquals(compactTarget, result.get(0));
        assertTrue(result.contains(generatedNoise));
        verify(codeChunkMapper, times(2)).selectList(any(Wrapper.class));
    }

    @Test
    void listRetrievalCandidates_shouldNormalizeHostedMarkdownUrlBeforeSameNameDocDecoy() {
        CodeChunk reportDoc = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("docs/report.md")
                .content("治理说明 董事长入口 Markdown URL 追问")
                .startLine(1)
                .endLine(20)
                .build();
        CodeChunk sameNamedDecoy = CodeChunk.builder()
                .id(98L)
                .scanTaskId(42L)
                .filePath("archive/docs/CHAIRMAN_BRIEFING.md")
                .content("旧版董事长入口说明")
                .startLine(15)
                .endLine(25)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("docs/CHAIRMAN_BRIEFING.md")
                .content("当前董事长入口说明")
                .startLine(15)
                .endLine(25)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(reportDoc))
                .thenReturn(List.of(sameNamedDecoy, target));

        List<CodeChunk> result = codeChunkService.listRetrievalCandidates(
                42L,
                "解释这个治理文档 https://github.com/acme/source-lens/blob/feature/docs/review/docs/CHAIRMAN_BRIEFING.md#L20"
        );

        assertEquals(target, result.get(0));
        assertTrue(result.contains(sameNamedDecoy));
        verify(codeChunkMapper, times(2)).selectList(any(Wrapper.class));
    }

    @Test
    void listRetrievalCandidates_shouldNormalizeHostedScriptUrlBeforeSameNameScriptDecoy() {
        CodeChunk reportDoc = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("docs/runbook.md")
                .content("启动脚本 run backend dev release evidence")
                .startLine(1)
                .endLine(20)
                .build();
        CodeChunk sameNamedDecoy = CodeChunk.builder()
                .id(98L)
                .scanTaskId(42L)
                .filePath("archive/scripts/run-backend-dev.sh")
                .content("legacy backend dev script")
                .startLine(10)
                .endLine(30)
                .build();
        CodeChunk target = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("scripts/run-backend-dev.sh")
                .content("current backend dev script")
                .startLine(10)
                .endLine(30)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(reportDoc))
                .thenReturn(List.of(sameNamedDecoy, target));

        List<CodeChunk> result = codeChunkService.listRetrievalCandidates(
                42L,
                "解释这个启动脚本 https://github.com/acme/source-lens/blob/feature/release/scripts/run-backend-dev.sh#L12"
        );

        assertEquals(target, result.get(0));
        assertTrue(result.contains(sameNamedDecoy));
        verify(codeChunkMapper, times(2)).selectList(any(Wrapper.class));
    }

    @Test
    void listRetrievalCandidates_shouldRankCandidatesBeforeReturningContextPool() {
        CodeChunk doc = CodeChunk.builder()
                .scanTaskId(42L)
                .filePath("README.md")
                .content("service repository controller")
                .startLine(1)
                .endLine(10)
                .build();
        CodeChunk mapper = CodeChunk.builder()
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/mapper/PawnTicketMapper.java")
                .content("@Mapper interface PawnTicketMapper {}")
                .startLine(1)
                .endLine(20)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class))).thenReturn(List.of(doc, mapper));

        List<CodeChunk> result = codeChunkService.listRetrievalCandidates(42L, "repository mapper");

        assertEquals(List.of(mapper, doc), result);
    }

    @Test
    void listRetrievalCandidates_shouldIncludeControllerServiceAndDataAccessForBackendFlowQuestion() {
        CodeChunk docNoise = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("docs/backend-flow.md")
                .content("login endpoint flow from controller to service mapper database")
                .startLine(1)
                .endLine(10)
                .build();
        CodeChunk controller = CodeChunk.builder()
                .id(2L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/LoginController.java")
                .content("@RestController class LoginController { LoginService service; }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk service = CodeChunk.builder()
                .id(3L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/service/LoginService.java")
                .content("@Service class LoginService { LoginMapper mapper; void login() { mapper.findUser(); } }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk mapper = CodeChunk.builder()
                .id(4L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/mapper/LoginMapper.java")
                .content("@Mapper interface LoginMapper { User findUser(String account); /* database sql table */ }")
                .startLine(1)
                .endLine(40)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(docNoise))
                .thenReturn(List.of(controller, service, mapper));

        List<CodeChunk> result = codeChunkService.listRetrievalCandidates(
                42L,
                "login endpoint flow from controller to service mapper database"
        );

        List<String> resultPaths = result.stream().map(CodeChunk::getFilePath).toList();
        assertTrue(result.indexOf(controller) < result.indexOf(docNoise), resultPaths::toString);
        assertTrue(result.indexOf(service) < result.indexOf(docNoise), resultPaths::toString);
        assertTrue(result.indexOf(mapper) < result.indexOf(docNoise), resultPaths::toString);
        assertTrue(result.containsAll(List.of(controller, service, mapper)));
    }

    @Test
    void listRetrievalCandidates_shouldExpandMethodAnchorBackendFlowToDataAccess() {
        CodeChunk docsNoise = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("docs/payment-flow.md")
                .content("PaymentController createPayment controller mapper database flow")
                .startLine(1)
                .endLine(10)
                .build();
        CodeChunk controller = CodeChunk.builder()
                .id(2L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/PaymentController.java")
                .content("@RestController class PaymentController { Result createPayment() { return service.createPayment(); } }")
                .startLine(21)
                .endLine(70)
                .build();
        CodeChunk service = CodeChunk.builder()
                .id(3L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/service/PaymentService.java")
                .content("@Service class PaymentService { PaymentMapper mapper; void createPayment() { mapper.insertPayment(); } }")
                .startLine(1)
                .endLine(50)
                .build();
        CodeChunk mapper = CodeChunk.builder()
                .id(4L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/mapper/PaymentMapper.java")
                .content("@Mapper interface PaymentMapper { void insertPayment(Payment payment); /* database sql table */ }")
                .startLine(1)
                .endLine(40)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(docsNoise))
                .thenReturn(List.of(controller, service, mapper))
                .thenReturn(List.of(controller));

        List<CodeChunk> result = codeChunkService.listRetrievalCandidates(
                42L,
                "PaymentController#createPayment 怎么从 controller 到 mapper 落库"
        );

        List<String> resultPaths = result.stream().map(CodeChunk::getFilePath).toList();
        assertTrue(result.indexOf(controller) < result.indexOf(docsNoise), resultPaths::toString);
        assertTrue(result.indexOf(mapper) < result.indexOf(docsNoise), resultPaths::toString);
        assertTrue(result.containsAll(List.of(controller, service, mapper)));
    }

    @Test
    void listRetrievalCandidates_shouldIncludeDomainModelForBackendTableFlowQuestion() {
        CodeChunk docNoise = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("docs/payment-table-flow.md")
                .content("payment endpoint controller service mapper entity table database")
                .startLine(1)
                .endLine(10)
                .build();
        CodeChunk controller = CodeChunk.builder()
                .id(2L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/PaymentController.java")
                .content("@RestController class PaymentController { PaymentService service; }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk service = CodeChunk.builder()
                .id(3L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/service/PaymentService.java")
                .content("@Service class PaymentService { PaymentMapper mapper; }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk mapper = CodeChunk.builder()
                .id(4L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/mapper/PaymentMapper.java")
                .content("@Mapper interface PaymentMapper { void insertPayment(PaymentEntity entity); /* database sql table */ }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk entity = CodeChunk.builder()
                .id(5L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/entity/PaymentEntity.java")
                .content("@TableName(\"payment\") class PaymentEntity { Long id; }")
                .startLine(1)
                .endLine(40)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(docNoise))
                .thenReturn(List.of(controller, service, mapper, entity));

        List<CodeChunk> result = codeChunkService.listRetrievalCandidates(
                42L,
                "payment endpoint flow from controller to mapper write table entity"
        );

        List<String> resultPaths = result.stream().map(CodeChunk::getFilePath).toList();
        assertTrue(result.indexOf(controller) < result.indexOf(docNoise), resultPaths::toString);
        assertTrue(result.indexOf(service) < result.indexOf(docNoise), resultPaths::toString);
        assertTrue(result.indexOf(mapper) < result.indexOf(docNoise), resultPaths::toString);
        assertTrue(result.indexOf(entity) < result.indexOf(docNoise), resultPaths::toString);
        assertTrue(result.containsAll(List.of(controller, service, mapper, entity)));
    }

    @Test
    void listRetrievalCandidates_shouldIncludeDomainModelForChineseWriteTableFlowQuestion() {
        CodeChunk docNoise = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("docs/payment-write-table.md")
                .content("支付接口怎么写表 controller service mapper entity")
                .startLine(1)
                .endLine(10)
                .build();
        CodeChunk controller = CodeChunk.builder()
                .id(2L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/PaymentController.java")
                .content("@RestController class PaymentController { PaymentService service; }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk service = CodeChunk.builder()
                .id(3L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/service/PaymentService.java")
                .content("@Service class PaymentService { PaymentMapper mapper; }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk mapper = CodeChunk.builder()
                .id(4L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/mapper/PaymentMapper.java")
                .content("@Mapper interface PaymentMapper { void insertPayment(PaymentEntity entity); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk entity = CodeChunk.builder()
                .id(5L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/entity/PaymentEntity.java")
                .content("@TableName(\"payment\") class PaymentEntity { Long id; }")
                .startLine(1)
                .endLine(40)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(docNoise))
                .thenReturn(List.of(controller, service, mapper, entity));

        List<CodeChunk> result = codeChunkService.listRetrievalCandidates(42L, "支付接口怎么写表");

        List<String> resultPaths = result.stream().map(CodeChunk::getFilePath).toList();
        assertTrue(result.indexOf(controller) < result.indexOf(docNoise), resultPaths::toString);
        assertTrue(result.indexOf(service) < result.indexOf(docNoise), resultPaths::toString);
        assertTrue(result.indexOf(mapper) < result.indexOf(docNoise), resultPaths::toString);
        assertTrue(result.indexOf(entity) < result.indexOf(docNoise), resultPaths::toString);
        assertTrue(result.containsAll(List.of(controller, service, mapper, entity)));
    }

    @Test
    void listRetrievalCandidates_shouldIncludeDomainModelForChineseCrudFlowQuestion() {
        CodeChunk docNoise = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("docs/payment-save-order.md")
                .content("支付接口怎么保存订单 controller service mapper entity")
                .startLine(1)
                .endLine(10)
                .build();
        CodeChunk controller = CodeChunk.builder()
                .id(2L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/PaymentController.java")
                .content("@RestController class PaymentController { PaymentService service; }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk service = CodeChunk.builder()
                .id(3L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/service/PaymentService.java")
                .content("@Service class PaymentService { PaymentMapper mapper; void saveOrder(PaymentOrder order) { mapper.insert(order); } }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk mapper = CodeChunk.builder()
                .id(4L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/mapper/PaymentMapper.java")
                .content("@Mapper interface PaymentMapper { void insert(PaymentOrder order); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk entity = CodeChunk.builder()
                .id(5L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/entity/PaymentOrder.java")
                .content("@TableName(\"payment_order\") class PaymentOrder { Long id; }")
                .startLine(1)
                .endLine(40)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(docNoise))
                .thenReturn(List.of(controller, service, mapper, entity));

        List<CodeChunk> result = codeChunkService.listRetrievalCandidates(42L, "支付接口怎么保存订单");

        List<String> resultPaths = result.stream().map(CodeChunk::getFilePath).toList();
        assertTrue(result.indexOf(controller) < result.indexOf(docNoise), resultPaths::toString);
        assertTrue(result.indexOf(service) < result.indexOf(docNoise), resultPaths::toString);
        assertTrue(result.indexOf(mapper) < result.indexOf(docNoise), resultPaths::toString);
        assertTrue(result.indexOf(entity) < result.indexOf(docNoise), resultPaths::toString);
        assertTrue(result.containsAll(List.of(controller, service, mapper, entity)));
    }

    @Test
    void listRetrievalCandidates_shouldIncludeDomainModelForChineseReadFlowQuestion() {
        CodeChunk docNoise = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("docs/payment-query-order.md")
                .content("支付接口怎么查询订单 controller service mapper entity")
                .startLine(1)
                .endLine(10)
                .build();
        CodeChunk controller = CodeChunk.builder()
                .id(2L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/PaymentController.java")
                .content("@RestController class PaymentController { PaymentService service; }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk service = CodeChunk.builder()
                .id(3L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/service/PaymentService.java")
                .content("@Service class PaymentService { PaymentMapper mapper; PaymentOrder findOrder(Long id) { return mapper.selectById(id); } }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk mapper = CodeChunk.builder()
                .id(4L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/mapper/PaymentMapper.java")
                .content("@Mapper interface PaymentMapper { PaymentOrder selectById(Long id); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk entity = CodeChunk.builder()
                .id(5L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/entity/PaymentOrder.java")
                .content("@TableName(\"payment_order\") class PaymentOrder { Long id; }")
                .startLine(1)
                .endLine(40)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(docNoise))
                .thenReturn(List.of(controller, service, mapper, entity));

        List<CodeChunk> result = codeChunkService.listRetrievalCandidates(42L, "支付接口怎么查询订单");

        List<String> resultPaths = result.stream().map(CodeChunk::getFilePath).toList();
        assertTrue(result.indexOf(controller) < result.indexOf(docNoise), resultPaths::toString);
        assertTrue(result.indexOf(service) < result.indexOf(docNoise), resultPaths::toString);
        assertTrue(result.indexOf(mapper) < result.indexOf(docNoise), resultPaths::toString);
        assertTrue(result.indexOf(entity) < result.indexOf(docNoise), resultPaths::toString);
        assertTrue(result.containsAll(List.of(controller, service, mapper, entity)));
    }

    @Test
    void listRetrievalCandidates_shouldIncludeDomainModelForChineseResponseDataFlowQuestion() {
        CodeChunk docNoise = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("docs/order-detail-response.md")
                .content("订单详情接口怎么返回数据 controller service mapper entity")
                .startLine(1)
                .endLine(10)
                .build();
        CodeChunk controller = CodeChunk.builder()
                .id(2L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/OrderController.java")
                .content("@RestController class OrderController { OrderService service; }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk service = CodeChunk.builder()
                .id(3L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/service/OrderService.java")
                .content("@Service class OrderService { OrderMapper mapper; OrderDetail detail(Long id) { return mapper.selectDetail(id); } }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk mapper = CodeChunk.builder()
                .id(4L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/mapper/OrderMapper.java")
                .content("@Mapper interface OrderMapper { OrderDetail selectDetail(Long id); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk entity = CodeChunk.builder()
                .id(5L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/entity/OrderDetail.java")
                .content("@TableName(\"order_detail\") class OrderDetail { Long id; }")
                .startLine(1)
                .endLine(40)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(docNoise))
                .thenReturn(List.of(controller, service, mapper, entity));

        List<CodeChunk> result = codeChunkService.listRetrievalCandidates(42L, "订单详情接口怎么返回数据");

        List<String> resultPaths = result.stream().map(CodeChunk::getFilePath).toList();
        assertTrue(result.indexOf(controller) < result.indexOf(docNoise), resultPaths::toString);
        assertTrue(result.indexOf(service) < result.indexOf(docNoise), resultPaths::toString);
        assertTrue(result.indexOf(mapper) < result.indexOf(docNoise), resultPaths::toString);
        assertTrue(result.indexOf(entity) < result.indexOf(docNoise), resultPaths::toString);
        assertTrue(result.containsAll(List.of(controller, service, mapper, entity)));
    }

    @Test
    void listRetrievalCandidates_shouldIncludeFrontendAndControllerForFrontendBackendBridgeQuestion() {
        CodeChunk docNoise = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("docs/login-button-api.md")
                .content("前端登录按钮点击后调用哪个后端接口 frontend controller")
                .startLine(1)
                .endLine(10)
                .build();
        CodeChunk loginPage = CodeChunk.builder()
                .id(2L)
                .scanTaskId(42L)
                .filePath("web-console/src/pages/Login.tsx")
                .content("export function LoginPage() { return <button onClick={submitLogin}>登录</button>; }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk authController = CodeChunk.builder()
                .id(3L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthController.java")
                .content("@RestController class AuthController { @PostMapping(\"/auth/login\") Token login(LoginRequest request) { return authService.login(request); } }")
                .startLine(1)
                .endLine(50)
                .build();
        CodeChunk serviceNoise = CodeChunk.builder()
                .id(4L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/service/AuthService.java")
                .content("@Service class AuthService { Token login(LoginRequest request) { return token; } }")
                .startLine(1)
                .endLine(50)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(docNoise, serviceNoise))
                .thenReturn(List.of(loginPage, authController));

        List<CodeChunk> result = codeChunkService.listRetrievalCandidates(
                42L,
                "前端登录按钮点击后调用哪个后端接口"
        );

        List<String> resultPaths = result.stream().map(CodeChunk::getFilePath).toList();
        assertTrue(result.indexOf(loginPage) < result.indexOf(docNoise), resultPaths::toString);
        assertTrue(result.indexOf(authController) < result.indexOf(docNoise), resultPaths::toString);
        assertTrue(result.contains(loginPage), resultPaths::toString);
        assertTrue(result.contains(authController), resultPaths::toString);
    }

    @Test
    void listRetrievalCandidates_shouldIncludeFrontendAndControllerForButtonEndpointQuestion() {
        CodeChunk docNoise = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("docs/login-button-endpoint.md")
                .content("登录按钮调用哪个接口 frontend controller")
                .startLine(1)
                .endLine(10)
                .build();
        CodeChunk loginPage = CodeChunk.builder()
                .id(2L)
                .scanTaskId(42L)
                .filePath("web-console/src/pages/Login.tsx")
                .content("export function LoginPage() { return <button onClick={submitLogin}>登录</button>; }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk authController = CodeChunk.builder()
                .id(3L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthController.java")
                .content("@RestController class AuthController { @PostMapping(\"/auth/login\") Token login(LoginRequest request) { return authService.login(request); } }")
                .startLine(1)
                .endLine(50)
                .build();
        CodeChunk serviceNoise = CodeChunk.builder()
                .id(4L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/service/AuthService.java")
                .content("@Service class AuthService { Token login(LoginRequest request) { return token; } }")
                .startLine(1)
                .endLine(50)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(docNoise, serviceNoise))
                .thenReturn(List.of(loginPage, authController));

        List<CodeChunk> result = codeChunkService.listRetrievalCandidates(42L, "登录按钮调用哪个接口");

        List<String> resultPaths = result.stream().map(CodeChunk::getFilePath).toList();
        assertTrue(result.indexOf(loginPage) < result.indexOf(docNoise), resultPaths::toString);
        assertTrue(result.indexOf(authController) < result.indexOf(docNoise), resultPaths::toString);
        assertTrue(result.contains(loginPage), resultPaths::toString);
        assertTrue(result.contains(authController), resultPaths::toString);
    }

    @Test
    void listRetrievalCandidates_shouldIncludeFrontendAndControllerForChinesePageEndpointQuestion() {
        CodeChunk docNoise = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("docs/login-page-endpoint.md")
                .content("登录页调用哪个接口 frontend controller")
                .startLine(1)
                .endLine(10)
                .build();
        CodeChunk loginPage = CodeChunk.builder()
                .id(2L)
                .scanTaskId(42L)
                .filePath("web-console/src/pages/Login.tsx")
                .content("export function LoginPage() { return <form onSubmit={submitLogin}>登录</form>; }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk authController = CodeChunk.builder()
                .id(3L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthController.java")
                .content("@RestController class AuthController { @PostMapping(\"/auth/login\") Token login(LoginRequest request) { return authService.login(request); } }")
                .startLine(1)
                .endLine(50)
                .build();
        CodeChunk serviceNoise = CodeChunk.builder()
                .id(4L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/service/AuthService.java")
                .content("@Service class AuthService { Token login(LoginRequest request) { return token; } }")
                .startLine(1)
                .endLine(50)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(docNoise, serviceNoise))
                .thenReturn(List.of(loginPage, authController));

        List<CodeChunk> result = codeChunkService.listRetrievalCandidates(42L, "登录页调用哪个接口");

        List<String> resultPaths = result.stream().map(CodeChunk::getFilePath).toList();
        assertTrue(result.indexOf(loginPage) < result.indexOf(docNoise), resultPaths::toString);
        assertTrue(result.indexOf(authController) < result.indexOf(docNoise), resultPaths::toString);
        assertTrue(result.contains(loginPage), resultPaths::toString);
        assertTrue(result.contains(authController), resultPaths::toString);
    }

    @Test
    void listRetrievalCandidates_shouldIncludeFrontendAndControllerForChinesePageEndpointRelationQuestion() {
        CodeChunk docNoise = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("docs/detail-page-api.md")
                .content("详情页用哪个接口 frontend controller")
                .startLine(1)
                .endLine(10)
                .build();
        CodeChunk detailPage = CodeChunk.builder()
                .id(2L)
                .scanTaskId(42L)
                .filePath("web-console/src/pages/OrderDetail.tsx")
                .content("export function OrderDetailPage() { return useOrderDetail(); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk orderController = CodeChunk.builder()
                .id(3L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/OrderController.java")
                .content("@RestController class OrderController { @GetMapping(\"/orders/{id}\") Order detail(Long id) { return service.detail(id); } }")
                .startLine(1)
                .endLine(50)
                .build();
        CodeChunk serviceNoise = CodeChunk.builder()
                .id(4L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/service/OrderService.java")
                .content("@Service class OrderService { Order detail(Long id) { return order; } }")
                .startLine(1)
                .endLine(50)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(docNoise, serviceNoise))
                .thenReturn(List.of(detailPage, orderController));

        List<CodeChunk> result = codeChunkService.listRetrievalCandidates(42L, "详情页用哪个接口");

        List<String> resultPaths = result.stream().map(CodeChunk::getFilePath).toList();
        assertTrue(result.indexOf(detailPage) < result.indexOf(docNoise), resultPaths::toString);
        assertTrue(result.indexOf(orderController) < result.indexOf(docNoise), resultPaths::toString);
        assertTrue(result.contains(detailPage), resultPaths::toString);
        assertTrue(result.contains(orderController), resultPaths::toString);
    }

    @Test
    void listRetrievalCandidates_shouldIncludeFrontendAndControllerForChinesePageEndpointQuestionForm() {
        CodeChunk docNoise = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("docs/login-page-api-question.md")
                .content("登录页面接口是什么 frontend controller")
                .startLine(1)
                .endLine(10)
                .build();
        CodeChunk loginPage = CodeChunk.builder()
                .id(2L)
                .scanTaskId(42L)
                .filePath("web-console/src/pages/Login.tsx")
                .content("export function LoginPage() { return loginApi.submit(); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk authController = CodeChunk.builder()
                .id(3L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthController.java")
                .content("@RestController class AuthController { @PostMapping(\"/auth/login\") Token login(LoginRequest request) { return authService.login(request); } }")
                .startLine(1)
                .endLine(50)
                .build();
        CodeChunk serviceNoise = CodeChunk.builder()
                .id(4L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/service/AuthService.java")
                .content("@Service class AuthService { Token login(LoginRequest request) { return token; } }")
                .startLine(1)
                .endLine(50)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(docNoise, serviceNoise))
                .thenReturn(List.of(loginPage, authController));

        List<CodeChunk> result = codeChunkService.listRetrievalCandidates(42L, "登录页面接口是什么");

        List<String> resultPaths = result.stream().map(CodeChunk::getFilePath).toList();
        assertTrue(result.indexOf(loginPage) < result.indexOf(docNoise), resultPaths::toString);
        assertTrue(result.indexOf(authController) < result.indexOf(docNoise), resultPaths::toString);
        assertTrue(result.contains(loginPage), resultPaths::toString);
        assertTrue(result.contains(authController), resultPaths::toString);
    }

    @Test
    void listRetrievalCandidates_shouldIncludeFrontendAndControllerForChinesePageEndpointNounPhrase() {
        CodeChunk docNoise = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("docs/login-page-api-noun.md")
                .content("登录页面接口 frontend controller")
                .startLine(1)
                .endLine(10)
                .build();
        CodeChunk loginPage = CodeChunk.builder()
                .id(2L)
                .scanTaskId(42L)
                .filePath("web-console/src/pages/Login.tsx")
                .content("export function LoginPage() { return loginApi.submit(); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk authController = CodeChunk.builder()
                .id(3L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthController.java")
                .content("@RestController class AuthController { @PostMapping(\"/auth/login\") Token login(LoginRequest request) { return authService.login(request); } }")
                .startLine(1)
                .endLine(50)
                .build();
        CodeChunk serviceNoise = CodeChunk.builder()
                .id(4L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/service/AuthService.java")
                .content("@Service class AuthService { Token login(LoginRequest request) { return token; } }")
                .startLine(1)
                .endLine(50)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(docNoise, serviceNoise))
                .thenReturn(List.of(loginPage, authController));

        List<CodeChunk> result = codeChunkService.listRetrievalCandidates(42L, "登录页面接口");

        List<String> resultPaths = result.stream().map(CodeChunk::getFilePath).toList();
        assertTrue(result.indexOf(loginPage) < result.indexOf(docNoise), resultPaths::toString);
        assertTrue(result.indexOf(authController) < result.indexOf(docNoise), resultPaths::toString);
        assertTrue(result.contains(loginPage), resultPaths::toString);
        assertTrue(result.contains(authController), resultPaths::toString);
    }

    @Test
    void listRetrievalCandidates_shouldIncludeFrontendAndControllerForEnglishPageEndpointNounPhrase() {
        CodeChunk docNoise = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("docs/login-page-endpoint.md")
                .content("login page endpoint frontend controller")
                .startLine(1)
                .endLine(10)
                .build();
        CodeChunk loginPage = CodeChunk.builder()
                .id(2L)
                .scanTaskId(42L)
                .filePath("web-console/src/pages/Login.tsx")
                .content("export function LoginPage() { return loginApi.submit(); }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk authController = CodeChunk.builder()
                .id(3L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/AuthController.java")
                .content("@RestController class AuthController { @PostMapping(\"/auth/login\") Token login(LoginRequest request) { return authService.login(request); } }")
                .startLine(1)
                .endLine(50)
                .build();
        CodeChunk serviceNoise = CodeChunk.builder()
                .id(4L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/service/AuthService.java")
                .content("@Service class AuthService { Token login(LoginRequest request) { return token; } }")
                .startLine(1)
                .endLine(50)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(docNoise, serviceNoise))
                .thenReturn(List.of(loginPage, authController));

        List<CodeChunk> result = codeChunkService.listRetrievalCandidates(42L, "login page endpoint");

        List<String> resultPaths = result.stream().map(CodeChunk::getFilePath).toList();
        assertTrue(result.indexOf(loginPage) < result.indexOf(docNoise), resultPaths::toString);
        assertTrue(result.indexOf(authController) < result.indexOf(docNoise), resultPaths::toString);
        assertTrue(result.contains(loginPage), resultPaths::toString);
        assertTrue(result.contains(authController), resultPaths::toString);
    }

    @Test
    void searchChunks_shouldExpandBackendFlowIntentWithoutContentLikeHotPath() {
        CodeChunk docNoise = CodeChunk.builder()
                .scanTaskId(42L)
                .filePath("docs/backend-flow.md")
                .content("login endpoint flow from controller to service mapper database")
                .startLine(1)
                .endLine(10)
                .build();
        CodeChunk controller = CodeChunk.builder()
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/LoginController.java")
                .content("@RestController class LoginController { LoginService service; }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk service = CodeChunk.builder()
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/service/LoginService.java")
                .content("@Service class LoginService { LoginMapper mapper; void login() { mapper.findUser(); } }")
                .startLine(1)
                .endLine(40)
                .build();
        CodeChunk mapper = CodeChunk.builder()
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/mapper/LoginMapper.java")
                .content("@Mapper interface LoginMapper { User findUser(String account); /* database sql table */ }")
                .startLine(1)
                .endLine(40)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(docNoise))
                .thenReturn(List.of(controller, service, mapper));

        List<CodeChunk> result = codeChunkService.searchChunks(
                42L,
                "login endpoint flow from controller to service mapper database",
                4
        );

        assertTrue(result.containsAll(List.of(controller, service, mapper)));
        @SuppressWarnings({"rawtypes", "unchecked"})
        ArgumentCaptor<Wrapper<CodeChunk>> wrapperCaptor = ArgumentCaptor.forClass((Class) Wrapper.class);
        verify(codeChunkMapper, times(2)).selectList(wrapperCaptor.capture());
        for (Wrapper<CodeChunk> wrapper : wrapperCaptor.getAllValues()) {
            assertFalse(wrapper.getCustomSqlSegment().contains("content LIKE"));
        }
    }

    @Test
    void countSearchMatches_shouldCountAllChunksForBlankQuery() {
        when(codeChunkMapper.selectCount(any(Wrapper.class))).thenReturn(17L);

        long result = codeChunkService.countSearchMatches(42L, " ");

        assertEquals(17L, result);
        verify(codeChunkMapper).selectCount(any(Wrapper.class));
    }

    @Test
    void countSearchMatches_shouldUseFastCountForPlainKeywordQueries() {
        when(codeChunkMapper.selectCount(any(Wrapper.class))).thenReturn(2L);

        long result = codeChunkService.countSearchMatches(42L, "auth token");

        assertEquals(2L, result);
        verify(codeChunkMapper).selectCount(any(Wrapper.class));
        verify(codeChunkMapper, never()).selectList(any(Wrapper.class));
    }

    @Test
    void countSearchMatches_shouldIncludeRoleIntentCandidatesWhenKeywordCountWouldMiss() {
        CodeChunk authServiceTest = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("backend-spring/src/test/java/com/example/AuthServiceTest.java")
                .content("class AuthServiceTest { @Test void login_shouldReturnToken() {} }")
                .startLine(1)
                .endLine(80)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of())
                .thenReturn(List.of(authServiceTest));

        long result = codeChunkService.countSearchMatches(42L, "AuthService 单元测试文件在哪里");

        assertEquals(1L, result);
        @SuppressWarnings({"rawtypes", "unchecked"})
        ArgumentCaptor<Wrapper<CodeChunk>> wrapperCaptor = ArgumentCaptor.forClass((Class) Wrapper.class);
        verify(codeChunkMapper, times(2)).selectList(wrapperCaptor.capture());
        verify(codeChunkMapper, never()).selectCount(any(Wrapper.class));
        boolean testRoleQuerySeen = false;
        for (Wrapper<CodeChunk> wrapper : wrapperCaptor.getAllValues()) {
            assertFalse(wrapper.getCustomSqlSegment().contains("content LIKE"), wrapper.getCustomSqlSegment());
            @SuppressWarnings("rawtypes")
            AbstractWrapper abstractWrapper = (AbstractWrapper) wrapper;
            testRoleQuerySeen = testRoleQuerySeen || abstractWrapper.getParamNameValuePairs().values().stream()
                    .anyMatch(value -> String.valueOf(value).contains("Test.java"));
        }
        assertTrue(testRoleQuerySeen);
    }

    @Test
    void countSearchMatches_shouldNotCountPreviousSameFileContextOnlyCandidatesAsMatches() {
        CodeChunk methodChunk = CodeChunk.builder()
                .id(99L)
                .scanTaskId(42L)
                .filePath("src/main/java/com/example/controller/UserController.java")
                .content("""
                            @GetMapping("/{id}")
                            User get(@PathVariable Long id) { return service.get(id); }
                        }
                        """)
                .startLine(41)
                .endLine(90)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of())
                .thenReturn(List.of(methodChunk));

        long result = codeChunkService.countSearchMatches(42L, "/api/users/42");

        assertEquals(1L, result);
        @SuppressWarnings({"rawtypes", "unchecked"})
        ArgumentCaptor<Wrapper<CodeChunk>> wrapperCaptor = ArgumentCaptor.forClass((Class) Wrapper.class);
        verify(codeChunkMapper, times(2)).selectList(wrapperCaptor.capture());
        verify(codeChunkMapper, never()).selectCount(any(Wrapper.class));
        for (Wrapper<CodeChunk> wrapper : wrapperCaptor.getAllValues()) {
            assertFalse(wrapper.getCustomSqlSegment().contains("content LIKE"), wrapper.getCustomSqlSegment());
        }
    }

    @Test
    void normalizeSearchLimit_shouldClampUnsafeValues() {
        assertEquals(20, codeChunkService.normalizeSearchLimit(null));
        assertEquals(1, codeChunkService.normalizeSearchLimit(0));
        assertEquals(50, codeChunkService.normalizeSearchLimit(500));
        assertEquals(12, codeChunkService.normalizeSearchLimit(12));
    }

    @Test
    void matchedTerms_shouldReturnOnlyTermsPresentInPathOrContent() {
        CodeChunk chunk = CodeChunk.builder()
                .filePath("src/main/java/AuthService.java")
                .content("validate bearer token")
                .build();

        List<String> terms = codeChunkService.matchedTerms(chunk, "auth token payment");

        assertEquals(List.of("auth", "token"), terms);
    }

    @Test
    void expandWithAdjacentChunks_shouldKeepPrimaryChunkFirstAndAppendSameFileNeighbors() {
        CodeChunk selected = CodeChunk.builder()
                .id(2L)
                .scanTaskId(42L)
                .filePath("src/main/java/AuthService.java")
                .content("class AuthService { boolean validateToken() { return true; } }")
                .startLine(41)
                .endLine(90)
                .build();
        CodeChunk previous = CodeChunk.builder()
                .id(1L)
                .scanTaskId(42L)
                .filePath("src/main/java/AuthService.java")
                .content("class AuthService {")
                .startLine(1)
                .endLine(50)
                .build();
        CodeChunk next = CodeChunk.builder()
                .id(3L)
                .scanTaskId(42L)
                .filePath("src/main/java/AuthService.java")
                .content("private boolean isExpired(Token token) { return false; }")
                .startLine(81)
                .endLine(130)
                .build();
        when(codeChunkMapper.selectList(any(Wrapper.class)))
                .thenReturn(List.of(previous))
                .thenReturn(List.of(next));

        List<CodeChunk> result = codeChunkService.expandWithAdjacentChunks(42L, List.of(selected), 1, 4);

        assertEquals(List.of(selected, previous, next), result);
        verify(codeChunkMapper, times(2)).selectList(any(Wrapper.class));
    }

    @Test
    void tokenize_shouldExpandCamelCaseAndPascalCaseIdentifiers() {
        String[] tokens = CodeChunkRanker.tokenize("controllerServiceRepository PawnTicketController");

        assertEquals(List.of(
                "controllerservicerepository",
                "controller",
                "service",
                "repository",
                "pawnticketcontroller",
                "pawn",
                "ticket"
        ), List.of(tokens).subList(0, 7));
    }

    @Test
    void tokenize_shouldPrioritizeFileNameTermsAndDropPathNoiseForPathQueries() {
        List<String> tokens = List.of(CodeChunkRanker.tokenize(
                "backend-spring/src/main/java/com/sourcelens/module/analysis/service/CodeChunkRanker.java"
        ));

        assertEquals("codechunkranker", tokens.get(0));
        assertTrue(tokens.contains("code"));
        assertTrue(tokens.contains("chunk"));
        assertTrue(tokens.contains("ranker"));
        assertTrue(tokens.contains("service"));
        assertFalse(tokens.contains("src"));
        assertFalse(tokens.contains("main"));
        assertFalse(tokens.contains("java"));
        assertFalse(tokens.contains("com"));
    }

    @Test
    void tokenize_shouldDropViteQueryLineAndExtensionNoiseForSourceUrlQueries() {
        List<String> tokens = List.of(CodeChunkRanker.tokenize(
                "http://localhost:5173/src/pages/ProjectDetail.tsx?t=1782991000000:245:19"
        ));

        assertEquals("projectdetail", tokens.get(0));
        assertTrue(tokens.contains("project"));
        assertTrue(tokens.contains("detail"));
        assertFalse(tokens.contains("tsx"));
        assertFalse(tokens.contains("t"));
        assertFalse(tokens.contains("1782991000000"));
        assertFalse(tokens.contains("245"));
        assertFalse(tokens.contains("19"));
    }

    @Test
    void tokenize_shouldKeepLowSignalPathTermsWhenNoSpecificTermsExist() {
        List<String> tokens = List.of(CodeChunkRanker.tokenize("src/main/java"));

        assertEquals(List.of("java", "main", "src"), tokens);
    }

    @Test
    void tokenize_shouldKeepLanguageTermsForNaturalLanguageQueries() {
        List<String> tokens = List.of(CodeChunkRanker.tokenize("java service"));

        assertEquals(List.of("java", "service"), tokens);
    }

    @Test
    void tokenize_shouldStripLineNumbersFromPathQueries() {
        List<String> tokens = List.of(CodeChunkRanker.tokenize(
                "src/main/java/com/example/controller/PawnTicketController.java:85-90"
        ));

        assertTrue(tokens.contains("pawnticketcontroller"));
        assertFalse(tokens.contains("85"));
        assertFalse(tokens.contains("90"));
    }

    @Test
    void tokenize_shouldStripLineColumnHintsFromPathQueries() {
        List<String> tokens = List.of(CodeChunkRanker.tokenize(
                "src/main/java/com/example/controller/PawnTicketController.java:85:13-90:2"
        ));

        assertTrue(tokens.contains("pawnticketcontroller"));
        assertFalse(tokens.contains("85"));
        assertFalse(tokens.contains("13"));
        assertFalse(tokens.contains("90"));
        assertFalse(tokens.contains("2"));
    }

    @Test
    void tokenize_shouldPrioritizeStackTraceClassAndMethodTerms() {
        List<String> tokens = List.of(CodeChunkRanker.tokenize(
                "at com.example.service.AuthService.validateJwtSignature(AuthService.java:85)"
        ));

        assertEquals("authservice", tokens.get(0));
        assertTrue(tokens.contains("validatejwtsignature"));
        assertTrue(tokens.contains("validate"));
        assertTrue(tokens.contains("jwt"));
        assertTrue(tokens.contains("signature"));
        assertFalse(tokens.contains("85"));
        assertFalse(tokens.contains("at"));
        assertFalse(tokens.contains("java"));
        assertFalse(tokens.contains("com"));
    }

    @Test
    void methodAnchorFileHints_shouldIncludeSeparatedFrontendFileNames() {
        List<String> hints = CodeChunkRanker.methodAnchorFileHints("AuthStore.fetchUser(auth-store.ts:85:13)");

        assertTrue(hints.contains("AuthStore.ts"));
        assertTrue(hints.contains("auth-store.ts"));
        assertTrue(hints.contains("auth_store.ts"));
    }

    @Test
    void methodAnchorFileHints_shouldIncludeFunctionStackFrameFileNames() {
        List<String> hints = CodeChunkRanker.methodAnchorFileHints(
                "at fetchUser (http://localhost:5173/src/stores/auth-store.ts:85:13)"
        );

        assertTrue(hints.contains("auth-store.ts"));
        assertTrue(hints.contains("authstore.ts"));
    }

    @Test
    void methodAnchorFileHints_shouldIncludeViteQueryStackFrameFileNames() {
        List<String> hints = CodeChunkRanker.methodAnchorFileHints(
                "at submitQa (http://localhost:5173/src/pages/ProjectDetail.tsx?t=1782991000000:245:19)"
        );

        assertTrue(hints.contains("projectdetail.tsx"));
    }

    @Test
    void methodAnchorFileHints_shouldIncludeAnonymousStackFrameFileNames() {
        List<String> hints = CodeChunkRanker.methodAnchorFileHints(
                "at Object.<anonymous> (webpack://source-lens/./web-console/src/stores/auth-store.ts:85:13)"
        );

        assertTrue(hints.contains("auth-store.ts"));
        assertTrue(hints.contains("authstore.ts"));
    }

    @Test
    void methodAnchorFileHints_shouldIncludeStandaloneBrowserSourceUrlFileNames() {
        List<String> hints = CodeChunkRanker.methodAnchorFileHints(
                "http://localhost:3000/src/generated/api-client.ts:3402:17"
        );

        assertTrue(hints.contains("api-client.ts"));
        assertTrue(hints.contains("apiclient.ts"));
    }

    @Test
    void methodAnchorFileHints_shouldIncludeSafariFunctionAtSourceUrlFileNames() {
        List<String> hints = CodeChunkRanker.methodAnchorFileHints(
                "AuthStore.fetchUser@https://app.example.com/assets/auth-store.ts?t=1782991000000:85:13"
        );

        assertTrue(hints.contains("auth-store.ts"));
        assertTrue(hints.contains("authstore.ts"));
    }

    @Test
    void chunkAndSave_shouldUseExplicitMultiRowInsertBatches() throws Exception {
        Path sourceFile = tempDir.resolve("LargeService.java");
        Files.writeString(sourceFile, "line\n".repeat(8050));
        when(scanTaskMapper.selectById(42L)).thenReturn(null);
        when(fileFilter.shouldInclude(any(Path.class), any(Path.class))).thenReturn(true);

        codeChunkService.chunkAndSave(42L, tempDir.toString());

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<CodeChunk>> batchCaptor = ArgumentCaptor.forClass(List.class);
        verify(codeChunkMapper, times(2)).insertBatch(batchCaptor.capture());
        verify(codeChunkMapper, never()).insert(any(CodeChunk.class));
        assertEquals(200, batchCaptor.getAllValues().get(0).size());
        assertEquals(1, batchCaptor.getAllValues().get(1).size());
        assertEquals(42L, batchCaptor.getAllValues().get(0).get(0).getScanTaskId());
        assertEquals("LargeService.java", batchCaptor.getAllValues().get(0).get(0).getFilePath());
    }

    @Test
    void chunkAndSave_shouldFlushChunkBatchesAcrossMultipleFiles() throws Exception {
        Files.writeString(tempDir.resolve("AlphaService.java"), "alpha\n".repeat(4050));
        Files.writeString(tempDir.resolve("BetaService.java"), "beta\n".repeat(4050));
        when(scanTaskMapper.selectById(42L)).thenReturn(null);
        when(fileFilter.shouldInclude(any(Path.class), any(Path.class))).thenReturn(true);

        codeChunkService.chunkAndSave(42L, tempDir.toString());

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<CodeChunk>> batchCaptor = ArgumentCaptor.forClass(List.class);
        verify(codeChunkMapper, times(2)).insertBatch(batchCaptor.capture());
        assertEquals(200, batchCaptor.getAllValues().get(0).size());
        assertEquals(2, batchCaptor.getAllValues().get(1).size());
        assertTrue(batchCaptor.getAllValues().stream()
                .flatMap(List::stream)
                .anyMatch(chunk -> "AlphaService.java".equals(chunk.getFilePath())));
        assertTrue(batchCaptor.getAllValues().stream()
                .flatMap(List::stream)
                .anyMatch(chunk -> "BetaService.java".equals(chunk.getFilePath())));
    }

    @Test
    void chunkAndSave_shouldPropagateFullBatchInsertFailure() throws Exception {
        Files.writeString(tempDir.resolve("LargeService.java"), "line\n".repeat(8050));
        when(scanTaskMapper.selectById(42L)).thenReturn(null);
        when(fileFilter.shouldInclude(any(Path.class), any(Path.class))).thenReturn(true);
        when(codeChunkMapper.insertBatch(any())).thenThrow(new RuntimeException("db unavailable"));

        RuntimeException error = assertThrows(RuntimeException.class,
                () -> codeChunkService.chunkAndSave(42L, tempDir.toString()));

        assertTrue(error.getMessage().contains("批量保存切片失败"));
        verify(codeChunkMapper, times(1)).insertBatch(any());
        assertDeleteWrappersTargetScanTask(42L, 2);
        verify(llmClient, never()).getEmbeddings(any(), any());
        verify(llmClient, never()).getEmbedding(any(), any());
    }

    @Test
    void chunkAndSave_shouldFailWhenInitialChunkCleanupFails() throws Exception {
        Files.writeString(tempDir.resolve("AppService.java"), "class AppService {}");
        when(codeChunkMapper.delete(any(Wrapper.class))).thenThrow(new RuntimeException("cleanup failed"));

        IllegalStateException error = assertThrows(IllegalStateException.class,
                () -> codeChunkService.chunkAndSave(42L, tempDir.toString()));

        assertTrue(error.getMessage().contains("清理旧切片失败"));
        verify(codeChunkMapper, never()).insertBatch(any());
        verify(fileFilter, never()).shouldInclude(any(Path.class), any(Path.class));
    }

    @Test
    void chunkAndSave_shouldFailFastWhenScanTaskIdIsMissing() {
        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> codeChunkService.chunkAndSave(null, tempDir.toString()));

        assertTrue(error.getMessage().contains("扫描任务ID不能为空"));
        verify(codeChunkMapper, never()).delete(any(Wrapper.class));
        verify(codeChunkMapper, never()).insertBatch(any());
        verify(fileFilter, never()).shouldInclude(any(Path.class), any(Path.class));
    }

    @Test
    void chunkAndSave_shouldFailFastWhenRepoPathIsBlank() {
        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> codeChunkService.chunkAndSave(42L, " "));

        assertTrue(error.getMessage().contains("仓库路径不能为空"));
        verify(codeChunkMapper, never()).delete(any(Wrapper.class));
        verify(codeChunkMapper, never()).insertBatch(any());
        verify(fileFilter, never()).shouldInclude(any(Path.class), any(Path.class));
    }

    @Test
    void chunkAndSave_shouldFailFastBeforeCleanupWhenRepoPathDoesNotExist() {
        Path missingPath = tempDir.resolve("missing-repo");

        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> codeChunkService.chunkAndSave(42L, missingPath.toString()));

        assertTrue(error.getMessage().contains("仓库路径不存在或不是目录"));
        verify(codeChunkMapper, never()).delete(any(Wrapper.class));
        verify(codeChunkMapper, never()).insertBatch(any());
        verify(fileFilter, never()).shouldInclude(any(Path.class), any(Path.class));
    }

    @Test
    void chunkAndSave_shouldFailFastBeforeCleanupWhenRepoPathIsRegularFile() throws Exception {
        Path filePath = tempDir.resolve("not-a-directory.txt");
        Files.writeString(filePath, "not a repository");

        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> codeChunkService.chunkAndSave(42L, filePath.toString()));

        assertTrue(error.getMessage().contains("仓库路径不存在或不是目录"));
        verify(codeChunkMapper, never()).delete(any(Wrapper.class));
        verify(codeChunkMapper, never()).insertBatch(any());
        verify(fileFilter, never()).shouldInclude(any(Path.class), any(Path.class));
    }

    @Test
    void chunkAndSave_shouldCleanupPartialChunksWhenRemainingBatchInsertFails() throws Exception {
        Files.writeString(tempDir.resolve("LargeService.java"), "line\n".repeat(8050));
        when(scanTaskMapper.selectById(42L)).thenReturn(null);
        when(fileFilter.shouldInclude(any(Path.class), any(Path.class))).thenReturn(true);
        when(codeChunkMapper.insertBatch(any()))
                .thenReturn(200)
                .thenThrow(new RuntimeException("tail batch failed"));

        RuntimeException error = assertThrows(RuntimeException.class,
                () -> codeChunkService.chunkAndSave(42L, tempDir.toString()));

        assertTrue(error.getMessage().contains("tail batch failed"));
        verify(codeChunkMapper, times(2)).insertBatch(any());
        assertDeleteWrappersTargetScanTask(42L, 2);
        verify(llmClient, never()).getEmbeddings(any(), any());
        verify(llmClient, never()).getEmbedding(any(), any());
    }

    @Test
    void chunkAndSave_shouldReuseOnlySameModelEmbeddingsFromPreviousSuccessfulScans() throws Exception {
        String content = "class ReusedService {}";
        Path sourceFile = tempDir.resolve("ReusedService.java");
        Files.writeString(sourceFile, content);
        String contentHash = sha256Hex(content);
        ScanTask currentTask = ScanTask.builder()
                .id(42L)
                .repositoryId(7L)
                .createdBy(3L)
                .build();
        ScanTask previousTask = ScanTask.builder()
                .id(41L)
                .repositoryId(7L)
                .status("SUCCESS")
                .deleted(false)
                .build();
        CodeChunk reusable = CodeChunk.builder()
                .scanTaskId(41L)
                .contentHash(contentHash)
                .embedding("[0.1,0.2]")
                .embeddingModel("OPENAI:text-embedding-3-small")
                .build();

        when(fileFilter.shouldInclude(any(Path.class), any(Path.class))).thenReturn(true);
        when(scanTaskMapper.selectById(42L)).thenReturn(currentTask);
        when(llmConfigService.getActiveConfig(3L)).thenReturn(LlmConfig.builder()
                .provider("OPENAI")
                .modelName("gpt-4.1")
                .build());
        when(scanTaskMapper.selectList(any(Wrapper.class))).thenReturn(List.of(previousTask));
        when(codeChunkMapper.selectList(any(Wrapper.class))).thenReturn(List.of(reusable));

        codeChunkService.chunkAndSave(42L, tempDir.toString());

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<CodeChunk>> batchCaptor = ArgumentCaptor.forClass(List.class);
        verify(codeChunkMapper).insertBatch(batchCaptor.capture());
        CodeChunk inserted = batchCaptor.getValue().get(0);
        assertEquals("[0.1,0.2]", inserted.getEmbedding());
        assertEquals("OPENAI:text-embedding-3-small", inserted.getEmbeddingModel());
        verify(llmClient, never()).getEmbeddings(any(), any());
        verify(llmClient, never()).getEmbedding(any(), any());
    }

    @Test
    void chunkAndSave_shouldPersistWorkspaceAndModuleRootsForMonorepoPackages() throws Exception {
        Path packageRoot = tempDir.resolve("packages/z-admin");
        Files.createDirectories(packageRoot.resolve("src/pages"));
        Files.writeString(packageRoot.resolve("package.json"), "{\"name\":\"z-admin\"}");
        Files.writeString(packageRoot.resolve("src/pages/Login.tsx"), "export function Login() { return 'admin'; }");
        when(scanTaskMapper.selectById(42L)).thenReturn(null);
        when(fileFilter.shouldInclude(any(Path.class), any(Path.class))).thenAnswer(invocation -> {
            Path path = invocation.getArgument(1);
            return path.toString().endsWith("Login.tsx");
        });

        codeChunkService.chunkAndSave(42L, tempDir.toString());

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<CodeChunk>> batchCaptor = ArgumentCaptor.forClass(List.class);
        verify(codeChunkMapper).insertBatch(batchCaptor.capture());
        CodeChunk inserted = batchCaptor.getValue().get(0);
        assertEquals("packages/z-admin/src/pages/Login.tsx", inserted.getFilePath().replace('\\', '/'));
        assertEquals("packages/z-admin", inserted.getWorkspaceRoot());
        assertEquals("packages/z-admin", inserted.getModuleRoot());
    }

    @Test
    void chunkAndSave_shouldSkipSymlinkFilesEscapingRepositoryRoot() throws Exception {
        Path outsideDir = Files.createTempDirectory("sourcelens-outside");
        Path outsideFile = outsideDir.resolve("EscapedService.java");
        Files.writeString(outsideFile, "class EscapedService {}");
        Path symlink = tempDir.resolve("EscapedService.java");
        try {
            Files.createSymbolicLink(symlink, outsideFile);
        } catch (UnsupportedOperationException | IOException | SecurityException e) {
            assumeTrue(false, "symbolic links are not available in this environment");
        }
        when(scanTaskMapper.selectById(42L)).thenReturn(null);

        codeChunkService.chunkAndSave(42L, tempDir.toString());

        verify(fileFilter, never()).shouldInclude(any(Path.class), any(Path.class));
        verify(codeChunkMapper, never()).insertBatch(any());
        verify(codeChunkMapper, never()).insert(any(CodeChunk.class));
    }

    private CodeChunk chunk(String path) {
        return CodeChunk.builder()
                .scanTaskId(42L)
                .filePath(path)
                .content("class Demo {}")
                .startLine(1)
                .endLine(1)
                .build();
    }

    private CodeChunk semanticChunk(Long id, String path) {
        CodeChunk chunk = chunk(path);
        chunk.setId(id);
        chunk.setEmbedding("[1.0,0.0]");
        chunk.setEmbeddingModel("OPENAI:text-embedding-3-small");
        return chunk;
    }

    @SuppressWarnings({"rawtypes", "unchecked"})
    private void assertDeleteWrappersTargetScanTask(Long scanTaskId, int expectedTimes) {
        ArgumentCaptor<Wrapper> wrapperCaptor = ArgumentCaptor.forClass(Wrapper.class);
        verify(codeChunkMapper, times(expectedTimes)).delete(wrapperCaptor.capture());
        for (Wrapper wrapper : wrapperCaptor.getAllValues()) {
            assertTrue(wrapper.getCustomSqlSegment().contains("scan_task_id"), wrapper.getCustomSqlSegment());
            AbstractWrapper abstractWrapper = (AbstractWrapper) wrapper;
            assertTrue(abstractWrapper.getParamNameValuePairs().containsValue(scanTaskId));
        }
    }

    @SuppressWarnings("unchecked")
    private static Map<String, String> springRouteConstants(String content) throws Exception {
        Method method = CodeChunkRanker.class.getDeclaredMethod("springRouteConstants", String.class);
        method.setAccessible(true);
        return (Map<String, String>) method.invoke(null, content);
    }

    private static List<String> springMappingLiteralValues(String content, String mappingNames) throws Exception {
        Method method = CodeChunkRanker.class.getDeclaredMethod("springMappingLiterals", String.class, String.class);
        method.setAccessible(true);
        List<?> literals = (List<?>) method.invoke(null, content, mappingNames);
        List<String> values = new ArrayList<>();
        for (Object literal : literals) {
            Method literalMethod = literal.getClass().getDeclaredMethod("literal");
            literalMethod.setAccessible(true);
            values.add((String) literalMethod.invoke(literal));
        }
        return values;
    }

    private static double endpointRouteHintScore(CodeChunk chunk,
                                                 List<String> endpointRouteHints,
                                                 List<String> endpointHttpMethodHints) throws Exception {
        Method method = CodeChunkRanker.class.getDeclaredMethod(
                "endpointRouteHintScore",
                CodeChunk.class,
                List.class,
                List.class
        );
        method.setAccessible(true);
        return (double) method.invoke(null, chunk, endpointRouteHints, endpointHttpMethodHints);
    }

    private static CodeChunk withExternalRouteConstantContext(String routeConstantContext, CodeChunk current) throws Exception {
        Method method = CodeChunkRanker.class.getDeclaredMethod("withExternalRouteConstantContext", String.class, CodeChunk.class);
        method.setAccessible(true);
        return (CodeChunk) method.invoke(null, routeConstantContext, current);
    }

    @SuppressWarnings("unchecked")
    private static List<CodeChunk> routeAwareCandidateChunks(List<CodeChunk> chunks, List<String> endpointRouteHints) throws Exception {
        Method method = CodeChunkRanker.class.getDeclaredMethod("routeAwareCandidateChunks", List.class, List.class);
        method.setAccessible(true);
        return (List<CodeChunk>) method.invoke(null, chunks, endpointRouteHints);
    }

    private List<CodeChunk> frontendApiChunks(int count) {
        return java.util.stream.IntStream.range(0, count)
                .mapToObj(index -> CodeChunk.builder()
                        .id((long) index + 1)
                        .scanTaskId(42L)
                        .filePath("src/main/resources/admin/src/api/order-api-" + index + ".js")
                        .content("export function fetchOrder" + index + "() { return request({ url: '/api/orders/" + index + "', method: 'get' }); }")
                        .startLine(1)
                        .endLine(30)
                        .build())
                .toList();
    }

    private String sha256Hex(String input) throws Exception {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        byte[] hash = md.digest(input.getBytes(StandardCharsets.UTF_8));
        StringBuilder hexString = new StringBuilder();
        for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }

    private static void initTableInfo(Class<?> entityClass) {
        if (TableInfoHelper.getTableInfo(entityClass) == null) {
            TableInfoHelper.initTableInfo(new MapperBuilderAssistant(new MybatisConfiguration(), ""), entityClass);
        }
    }
}
