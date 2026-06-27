package com.sourcelens;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.sourcelens.module.analysis.entity.CodeChunk;
import com.sourcelens.module.analysis.mapper.CodeChunkMapper;
import com.sourcelens.module.analysis.service.CodeChunkFileFilter;
import com.sourcelens.module.analysis.service.CodeChunkRanker;
import com.sourcelens.module.analysis.service.CodeChunkService;
import com.sourcelens.module.agent.service.LlmClient;
import com.sourcelens.module.agent.service.LlmConfigService;
import com.sourcelens.module.scantask.mapper.ScanTaskMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
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
        verify(codeChunkMapper).selectList(any(Wrapper.class));
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
                .thenReturn(List.of(first));

        List<CodeChunk> result = codeChunkService.listRetrievalCandidates(42L, "missing keyword");

        assertEquals(List.of(first), result);
        verify(codeChunkMapper, times(3)).selectList(any(Wrapper.class));
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
    void countSearchMatches_shouldCountAllChunksForBlankQuery() {
        when(codeChunkMapper.selectCount(any(Wrapper.class))).thenReturn(17L);

        long result = codeChunkService.countSearchMatches(42L, " ");

        assertEquals(17L, result);
        verify(codeChunkMapper).selectCount(any(Wrapper.class));
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

    private CodeChunk chunk(String path) {
        return CodeChunk.builder()
                .scanTaskId(42L)
                .filePath(path)
                .content("class Demo {}")
                .startLine(1)
                .endLine(1)
                .build();
    }
}
