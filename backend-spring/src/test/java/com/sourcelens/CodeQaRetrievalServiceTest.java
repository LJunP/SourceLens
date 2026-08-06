package com.sourcelens;

import com.sourcelens.module.agent.service.CodeQaRetrievalService;
import com.sourcelens.module.analysis.entity.CodeChunk;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CodeQaRetrievalServiceTest {

    private final CodeQaRetrievalService retrievalService = new CodeQaRetrievalService();

    @Test
    void selectTopChunks_shouldPreferPathAndContentKeywordMatches() {
        List<CodeChunk> chunks = List.of(
                chunk("src/main/java/app/payment/PaymentService.java", "class PaymentService { void refund() {} }", null),
                chunk("src/main/java/app/user/UserService.java", "class UserService { void login() {} }", null),
                chunk("README.md", "deployment notes", null)
        );

        List<CodeChunk> selected = retrievalService.selectTopChunks(chunks, "payment refund", null);

        assertEquals("src/main/java/app/payment/PaymentService.java", selected.get(0).getFilePath());
    }

    @Test
    void selectTopChunks_shouldPreferSourceRoleEvidenceOverBroadDocs() {
        List<CodeChunk> chunks = List.of(
                chunk("AGENTS.md", "Repository Guidelines mention controller service repository.", null),
                chunk("src/main/java/app/controller/PawnTicketController.java",
                        "@RestController class PawnTicketController { private PawnTicketService service; }", null),
                chunk("src/main/resources/admin/src/components/chat/ServiceChat.vue",
                        "function sendMessage() { return service.chat() }", null)
        );

        List<CodeChunk> selected = retrievalService.selectTopChunks(chunks, "controller service repository", null);

        assertEquals("src/main/java/app/controller/PawnTicketController.java", selected.get(0).getFilePath());
    }

    @Test
    void selectTopChunks_shouldTreatNaturalEndpointQuestionAsControllerEvidence() {
        List<CodeChunk> chunks = List.of(
                chunk("README.md", "login endpoint usage notes", null),
                chunk("web-console/src/api/auth.ts", "export function login() { return request.post('/login'); }", null),
                chunk("src/main/java/app/service/AuthService.java",
                        "@Service class AuthService { Token login(LoginRequest request) { return token; } }", null),
                chunk("src/main/java/app/controller/AuthController.java",
                        "@RestController class AuthController { @PostMapping(\"/login\") public Token login(LoginRequest request) { return service.login(request); } }", null)
        );

        List<CodeChunk> selected = retrievalService.selectTopChunks(chunks, "login endpoint", null);

        assertEquals("src/main/java/app/controller/AuthController.java", selected.get(0).getFilePath());
    }

    @Test
    void selectTopChunks_shouldTreatChineseInterfaceQuestionAsControllerEvidence() {
        List<CodeChunk> chunks = List.of(
                chunk("docs/api.md", "登录接口说明", null),
                chunk("web-console/src/pages/Login.tsx", "export function LoginPage() { return null; }", null),
                chunk("src/main/java/app/controller/AuthController.java",
                        "@RestController class AuthController { @PostMapping(\"/login\") public Token login(LoginRequest request) { return service.login(request); } }", null)
        );

        List<CodeChunk> selected = retrievalService.selectTopChunks(chunks, "登录接口在哪里", null);

        assertEquals("src/main/java/app/controller/AuthController.java", selected.get(0).getFilePath());
    }

    @Test
    void selectTopChunks_shouldKeepFrontendRouteQuestionOnFrontendEvidence() {
        List<CodeChunk> chunks = List.of(
                chunk("src/main/java/app/controller/AuthController.java",
                        "@RestController class AuthController { @PostMapping(\"/login\") public Token login() { return token; } }", null),
                chunk("web-console/src/router/login-routes.ts",
                        "export const routes = [{ path: '/login', component: LoginPage }];", null),
                chunk("web-console/src/pages/Login.tsx",
                        "export function LoginPage() { return <LoginForm />; }", null)
        );

        List<CodeChunk> selected = retrievalService.selectTopChunks(chunks, "React route Login page", null);

        assertTrue(selected.get(0).getFilePath().startsWith("web-console/src/"));
    }

    @Test
    void selectTopChunks_shouldFilterCandidatesBeforeVectorRanking() {
        List<CodeChunk> chunks = List.of(
                chunk("src/auth/AuthService.java", "auth token validation", "[0.0, 1.0]"),
                chunk("src/billing/BillingService.java", "invoice capture", "[1.0, 0.0]")
        );

        List<CodeChunk> selected = retrievalService.selectTopChunks(chunks, "auth token", List.of(1.0f, 0.0f));

        assertEquals(1, selected.size());
        assertEquals("src/auth/AuthService.java", selected.get(0).getFilePath());
    }

    @Test
    void selectTopChunks_shouldUseVectorSimilarityWhenKeywordScoresAreAbsent() {
        List<CodeChunk> chunks = List.of(
                chunk("src/early/Unrelated.java", "alpha", "[0.0, 1.0]"),
                chunk("src/semantic/SemanticMatch.java", "beta", "[1.0, 0.0]")
        );

        List<CodeChunk> selected = retrievalService.selectTopChunks(chunks, "????", List.of(1.0f, 0.0f));

        assertEquals("src/semantic/SemanticMatch.java", selected.get(0).getFilePath());
    }

    @Test
    void selectTopChunks_shouldUseSemanticCandidateBeyondDefaultKeywordCandidateLimit() {
        List<CodeChunk> chunks = new ArrayList<>();
        for (int i = 0; i < 120; i++) {
            CodeChunk filler = chunk("src/filler/Filler" + i + ".java", "unrelated filler " + i, "[0.0, 1.0]");
            filler.setId((long) i + 1);
            filler.setEmbeddingModel("OPENAI:text-embedding-3-small");
            chunks.add(filler);
        }
        CodeChunk target = chunk("src/semantic/OrderLifecycleService.java", "semantic target", "[1.0, 0.0]");
        target.setId(999L);
        target.setEmbeddingModel("OPENAI:text-embedding-3-small");
        chunks.add(target);

        List<CodeChunk> selected = retrievalService.selectTopChunks(
                chunks,
                "????",
                List.of(1.0f, 0.0f),
                "OPENAI:text-embedding-3-small");

        assertEquals("src/semantic/OrderLifecycleService.java", selected.get(0).getFilePath());
    }

    @Test
    void selectTopChunks_shouldUseSemanticPoolTailAfterKeywordPoolIsMerged() {
        List<CodeChunk> chunks = new ArrayList<>();
        for (int i = 0; i < 80; i++) {
            CodeChunk keywordPool = chunk("src/keyword/Keyword" + i + ".java", "keyword pool filler " + i, "[0.0, 1.0]");
            keywordPool.setId((long) i + 1);
            keywordPool.setEmbeddingModel("OPENAI:text-embedding-3-small");
            chunks.add(keywordPool);
        }
        for (int i = 0; i < 500; i++) {
            CodeChunk semanticPool = chunk("src/semantic/Filler" + i + ".java", "semantic pool filler " + i, "[0.0, 1.0]");
            semanticPool.setId(1_000L + i);
            semanticPool.setEmbeddingModel("OPENAI:text-embedding-3-small");
            chunks.add(semanticPool);
        }
        CodeChunk target = chunk("src/semantic/TailTarget.java", "tail semantic target", "[1.0, 0.0]");
        target.setId(9_999L);
        target.setEmbeddingModel("OPENAI:text-embedding-3-small");
        chunks.add(target);

        List<CodeChunk> selected = retrievalService.selectTopChunks(
                chunks,
                "????",
                List.of(1.0f, 0.0f),
                "OPENAI:text-embedding-3-small");

        assertEquals("src/semantic/TailTarget.java", selected.get(0).getFilePath());
    }

    @Test
    void selectTopChunks_shouldLetSemanticCandidateBeatWeakDocumentationKeywordNoise() {
        CodeChunk weakKeywordNoise = chunk("README.md", "needle", "[0.0, 0.0]");
        weakKeywordNoise.setEmbeddingModel("OPENAI:text-embedding-3-small");
        CodeChunk semanticTarget = chunk("src/main/java/app/order/OrderLifecycleService.java",
                "order lifecycle implementation", "[1.0, 0.0]");
        semanticTarget.setEmbeddingModel("OPENAI:text-embedding-3-small");

        List<CodeChunk> selected = retrievalService.selectTopChunks(
                List.of(weakKeywordNoise, semanticTarget),
                "needle",
                List.of(1.0f, 0.0f),
                "OPENAI:text-embedding-3-small");

        assertEquals("src/main/java/app/order/OrderLifecycleService.java", selected.get(0).getFilePath());
    }

    @Test
    void selectTopChunks_shouldKeepSemanticFallbackWhenEndpointRouteHintHasNoRouteMatch() {
        CodeChunk weakRouteNoise = chunk("docs/operations.md",
                "legacy handler catalog describes historical endpoints", "[0.0, 1.0]");
        weakRouteNoise.setEmbeddingModel("OPENAI:text-embedding-3-small");
        CodeChunk semanticTarget = chunk("src/main/java/app/order/OrderLifecycleService.java",
                "order lifecycle implementation", "[1.0, 0.0]");
        semanticTarget.setEmbeddingModel("OPENAI:text-embedding-3-small");

        List<CodeChunk> selected = retrievalService.selectTopChunks(
                List.of(weakRouteNoise, semanticTarget),
                "GET /missing/route",
                List.of(1.0f, 0.0f),
                "OPENAI:text-embedding-3-small");

        assertEquals("src/main/java/app/order/OrderLifecycleService.java", selected.get(0).getFilePath());
    }

    @Test
    void selectTopChunks_shouldNotLetDocumentationRouteMentionCloseSemanticFallback() {
        CodeChunk documentationRouteMention = chunk("docs/api.md",
                "Historical API notes mention \"/api/orders/close\" for migration tracking.", "[0.0, 1.0]");
        documentationRouteMention.setEmbeddingModel("OPENAI:text-embedding-3-small");
        CodeChunk semanticTarget = chunk("src/main/java/app/order/OrderLifecycleService.java",
                "order lifecycle close implementation", "[1.0, 0.0]");
        semanticTarget.setEmbeddingModel("OPENAI:text-embedding-3-small");

        List<CodeChunk> selected = retrievalService.selectTopChunks(
                List.of(documentationRouteMention, semanticTarget),
                "GET /api/orders/close",
                List.of(1.0f, 0.0f),
                "OPENAI:text-embedding-3-small");

        assertEquals("src/main/java/app/order/OrderLifecycleService.java", selected.get(0).getFilePath());
    }

    @Test
    void selectTopChunks_shouldNotLetUnrelatedSourceInheritExternalRouteHolderAsStrongMatch() {
        CodeChunk routeHolder = chunk("src/main/kotlin/com/example/constants/ApiRoutes.kt",
                """
                        object ApiRoutes {
                          object Orders {
                            const val CLOSE = "/api/orders/close"
                          }
                        }
                        """,
                "[0.0, 1.0]");
        routeHolder.setEmbeddingModel("OPENAI:text-embedding-3-small");
        CodeChunk unrelatedSource = chunk("src/main/java/app/user/UserProfileService.java",
                "class UserProfileService { void refreshProfile() {} }", "[0.0, 1.0]");
        unrelatedSource.setEmbeddingModel("OPENAI:text-embedding-3-small");
        CodeChunk semanticTarget = chunk("src/main/java/app/order/OrderLifecycleService.java",
                "order lifecycle close implementation", "[1.0, 0.0]");
        semanticTarget.setEmbeddingModel("OPENAI:text-embedding-3-small");

        List<CodeChunk> selected = retrievalService.selectTopChunks(
                List.of(routeHolder, unrelatedSource, semanticTarget),
                "GET /api/orders/close",
                List.of(1.0f, 0.0f),
                "OPENAI:text-embedding-3-small");

        assertEquals("src/main/java/app/order/OrderLifecycleService.java", selected.get(0).getFilePath());
    }

    @Test
    void selectTopChunks_shouldPreferRouteHolderWhenQuestionAsksForRouteConstants() {
        CodeChunk routeHolder = chunk("src/main/kotlin/com/example/constants/ApiRoutes.kt",
                """
                        object ApiRoutes {
                          object Orders {
                            const val CLOSE = "/api/orders/close"
                          }
                        }
                        """,
                null);
        CodeChunk controller = chunk("src/main/kotlin/com/example/controller/OrderController.kt",
                """
                        @RestController
                        class OrderController {
                          @GetMapping(ApiRoutes.Orders.CLOSE)
                          fun close() = "ok"
                        }
                        """,
                null);
        CodeChunk docs = chunk("docs/api.md",
                "Historical API notes mention \"/api/orders/close\".", null);

        List<CodeChunk> selected = retrievalService.selectTopChunks(
                List.of(controller, docs, routeHolder),
                "GET /api/orders/close 路由常量在哪定义",
                null);

        assertEquals("src/main/kotlin/com/example/constants/ApiRoutes.kt", selected.get(0).getFilePath());
        assertTrue(selected.stream().map(CodeChunk::getFilePath).toList()
                .contains("src/main/kotlin/com/example/controller/OrderController.kt"));
    }

    @Test
    void selectTopChunks_shouldPreferControllerWhenHandlerQuestionMentionsApiRoute() {
        CodeChunk routeHolder = chunk("src/main/kotlin/com/example/constants/ApiRoutes.kt",
                """
                        object ApiRoutes {
                          object Orders {
                            const val CLOSE = "/api/orders/close"
                          }
                        }
                        """,
                null);
        CodeChunk controller = chunk("src/main/kotlin/com/example/controller/OrderController.kt",
                """
                        @RestController
                        class OrderController {
                          @GetMapping(ApiRoutes.Orders.CLOSE)
                          fun close() = "ok"
                        }
                        """,
                null);
        CodeChunk docs = chunk("docs/api.md",
                "Historical API notes mention \"/api/orders/close\".", null);

        List<CodeChunk> selected = retrievalService.selectTopChunks(
                List.of(routeHolder, docs, controller),
                "Which API route handles GET /api/orders/close?",
                null);

        assertEquals("src/main/kotlin/com/example/controller/OrderController.kt", selected.get(0).getFilePath());
        assertTrue(selected.stream().map(CodeChunk::getFilePath).toList()
                .contains("src/main/kotlin/com/example/constants/ApiRoutes.kt"));
    }

    @Test
    void selectTopChunks_shouldKeepStrongKeywordMatchAheadOfSemanticOnlyCandidate() {
        CodeChunk keywordMatch = chunk("src/auth/AuthService.java", "auth token validation service", "[0.0, 1.0]");
        keywordMatch.setEmbeddingModel("OPENAI:text-embedding-3-small");
        CodeChunk semanticOnly = chunk("src/order/OrderLifecycleService.java", "close order lifecycle", "[1.0, 0.0]");
        semanticOnly.setEmbeddingModel("OPENAI:text-embedding-3-small");

        List<CodeChunk> selected = retrievalService.selectTopChunks(
                List.of(keywordMatch, semanticOnly),
                "auth token",
                List.of(1.0f, 0.0f),
                "OPENAI:text-embedding-3-small");

        assertEquals("src/auth/AuthService.java", selected.get(0).getFilePath());
    }

    @Test
    void selectTopChunks_shouldIgnoreEmbeddingsFromDifferentModelKey() {
        CodeChunk staleVector = chunk("src/old/StaleVector.java", "alpha", "[1.0, 0.0]");
        staleVector.setEmbeddingModel("MOCK:text-embedding-3-small");
        CodeChunk currentVector = chunk("src/current/CurrentVector.java", "beta", "[0.9, 0.1]");
        currentVector.setEmbeddingModel("OPENAI:text-embedding-3-small");

        List<CodeChunk> selected = retrievalService.selectTopChunks(
                List.of(staleVector, currentVector),
                "????",
                List.of(1.0f, 0.0f),
                "OPENAI:text-embedding-3-small");

        assertEquals("src/current/CurrentVector.java", selected.get(0).getFilePath());
    }

    @Test
    void selectTopChunks_shouldDiversifyContextAcrossFilesBeforeBackfillingSameFile() {
        List<CodeChunk> chunks = List.of(
                chunk("src/main/java/app/service/PaymentService.java", "payment refund service token token token", null, 1, 50),
                chunk("src/main/java/app/service/PaymentService.java", "payment refund service token token token", null, 41, 90),
                chunk("src/main/java/app/service/PaymentService.java", "payment refund service token token token", null, 81, 130),
                chunk("src/main/java/app/service/PaymentService.java", "payment refund service token token token", null, 121, 170),
                chunk("src/main/java/app/controller/PaymentController.java", "payment refund controller", null, 1, 40)
        );

        List<CodeChunk> selected = retrievalService.selectTopChunks(chunks, "payment refund", null);

        assertEquals(4, selected.size());
        assertTrue(selected.stream()
                .map(CodeChunk::getFilePath)
                .toList()
                .contains("src/main/java/app/controller/PaymentController.java"));
        assertTrue(selected.subList(0, 3).stream()
                .map(CodeChunk::getFilePath)
                .toList()
                .contains("src/main/java/app/controller/PaymentController.java"));
    }

    @Test
    void selectTopChunks_shouldDiversifyAcrossEvidenceRolesBeforeBackfillingSameRoleControllers() {
        List<CodeChunk> chunks = List.of(
                chunk("src/main/java/app/controller/PaymentController.java",
                        "@RestController class PaymentController { payment controller service repository refund refund refund refund; }", null, 1, 40),
                chunk("src/main/java/app/controller/RefundController.java",
                        "@RestController class RefundController { payment controller service repository refund refund refund; }", null, 1, 40),
                chunk("src/main/java/app/controller/AdminPaymentController.java",
                        "@RestController class AdminPaymentController { payment controller service repository refund refund; }", null, 1, 40),
                chunk("src/main/java/app/controller/LegacyPaymentController.java",
                        "@RestController class LegacyPaymentController { payment controller service repository refund; }", null, 1, 40),
                chunk("src/main/java/app/service/PaymentService.java",
                        "@Service class PaymentService { void refundPayment() { repository.save(); } }", null, 1, 60),
                chunk("src/main/java/app/mapper/PaymentMapper.java",
                        "@Mapper interface PaymentMapper { void savePayment(); }", null, 1, 40)
        );

        List<CodeChunk> selected = retrievalService.selectTopChunks(chunks, "payment refund controller service repository", null);
        List<String> selectedPaths = selected.stream().map(CodeChunk::getFilePath).toList();

        assertEquals("src/main/java/app/controller/PaymentController.java", selected.get(0).getFilePath());
        assertTrue(selectedPaths.contains("src/main/java/app/service/PaymentService.java"));
        assertTrue(selectedPaths.contains("src/main/java/app/mapper/PaymentMapper.java"));
    }

    @Test
    void selectTopChunks_shouldPreferSameDomainBackendFlowNeighborsOverNoisyRoleMatches() {
        List<CodeChunk> chunks = List.of(
                chunk("src/main/java/app/controller/OrderController.java",
                        "@RestController class OrderController { OrderDto createOrder() { return orderService.createOrder(); } }", null, 1, 60),
                chunk("src/main/java/app/service/AuditService.java",
                        "@Service class AuditService { void trace() { /* backend flow controller service repository */ } }", null, 1, 80),
                chunk("src/main/java/app/service/OrderService.java",
                        "@Service class OrderService { Order createOrder(OrderCommand command) { return orderRepository.save(command); } }", null, 1, 90),
                chunk("src/main/java/app/mapper/AuditMapper.java",
                        "@Mapper interface AuditMapper { void writeBackendFlowControllerServiceRepositoryTrace(); }", null, 1, 50),
                chunk("src/main/java/app/repository/OrderRepository.java",
                        "@Repository interface OrderRepository { Order save(Order order); }", null, 1, 50),
                chunk("src/main/java/app/entity/Order.java",
                        "@Table class Order { Long id; }", null, 1, 40)
        );

        List<CodeChunk> selected = retrievalService.selectTopChunks(
                chunks,
                "trace order backend flow from controller through service repository entity",
                null
        );
        List<String> selectedPaths = selected.stream().map(CodeChunk::getFilePath).toList();

        assertEquals("src/main/java/app/controller/OrderController.java", selected.get(0).getFilePath());
        assertTrue(selectedPaths.contains("src/main/java/app/service/OrderService.java"));
        assertTrue(selectedPaths.contains("src/main/java/app/repository/OrderRepository.java"));
        assertTrue(selectedPaths.stream().noneMatch("src/main/java/app/service/AuditService.java"::equals));
        assertTrue(selectedPaths.stream().noneMatch("src/main/java/app/mapper/AuditMapper.java"::equals));
    }

    @Test
    void selectTopChunks_shouldKeepGeneralSourceEvidenceWhenControllersWouldFillContext() {
        List<CodeChunk> chunks = List.of(
                chunk("src/main/java/app/controller/PaymentController.java",
                        "@RestController class PaymentController { refund payment controller payment refund refund refund refund; }", null, 1, 40),
                chunk("src/main/java/app/controller/RefundController.java",
                        "@RestController class RefundController { refund payment controller payment refund refund refund; }", null, 1, 40),
                chunk("src/main/java/app/controller/AdminPaymentController.java",
                        "@RestController class AdminPaymentController { refund payment controller payment refund refund; }", null, 1, 40),
                chunk("src/main/java/app/controller/LegacyPaymentController.java",
                        "@RestController class LegacyPaymentController { refund payment controller payment refund; }", null, 1, 40),
                chunk("src/main/java/app/refund/RefundPolicyCalculator.java",
                        "final class RefundPolicyCalculator { Money calculateRefundPolicy(Payment payment) { return payment.refundAmount(); } }", null, 1, 80)
        );

        List<CodeChunk> selected = retrievalService.selectTopChunks(chunks, "payment refund controller policy", null);
        List<String> selectedPaths = selected.stream().map(CodeChunk::getFilePath).toList();

        assertEquals("src/main/java/app/controller/PaymentController.java", selected.get(0).getFilePath());
        assertTrue(selectedPaths.contains("src/main/java/app/refund/RefundPolicyCalculator.java"));
    }

    @Test
    void selectTopChunks_shouldPreferChunkCoveringRequestedLineNumber() {
        List<CodeChunk> chunks = List.of(
                chunk("src/main/java/app/controller/PawnTicketController.java",
                        "@RestController class PawnTicketController {", null, 1, 50),
                chunk("src/main/java/app/controller/PawnTicketController.java",
                        "public PawnTicketDto detail(Long id) { return service.detail(id); }", null, 81, 130),
                chunk("src/main/java/app/controller/PawnTicketController.java",
                        "private void audit() {}", null, 131, 180)
        );

        List<CodeChunk> selected = retrievalService.selectTopChunks(
                chunks,
                "src/main/java/app/controller/PawnTicketController.java:85",
                null
        );

        assertEquals(81, selected.get(0).getStartLine());
    }

    @Test
    void selectTopChunks_shouldPreferTighterChunkWhenMultipleChunksCoverRequestedLineNumber() {
        String path = "src/main/java/app/controller/PawnTicketController.java";
        List<CodeChunk> chunks = List.of(
                chunk(path,
                        "@RestController class PawnTicketController { }",
                        null, 1, 500),
                chunk(path,
                        "public PawnTicketDto detail(Long id) { return service.detail(id); } pawn ticket detail service repository",
                        null, 81, 92),
                chunk("src/main/java/app/service/PawnTicketService.java",
                        "@Service class PawnTicketService { PawnTicketDto detail(Long id) { return repository.find(id); } }",
                        null, 1, 100)
        );

        List<CodeChunk> selected = retrievalService.selectTopChunks(
                chunks,
                "pawn ticket detail service repository " + path + ":85",
                null
        );

        assertEquals(path, selected.get(0).getFilePath());
        assertEquals(81, selected.get(0).getStartLine());
    }

    @Test
    void selectTopChunks_shouldUseRawJsonStartEndLineEvidenceRange() {
        String path = "src/main/java/app/controller/PawnTicketController.java";
        List<CodeChunk> chunks = List.of(
                chunk(path,
                        "@RestController class PawnTicketController { }",
                        null, 1, 50),
                chunk(path,
                        "public PawnTicketDto detail(Long id) { return service.detail(id); } pawn ticket detail service repository",
                        null, 81, 130),
                chunk("src/main/java/app/service/PawnTicketService.java",
                        "@Service class PawnTicketService { PawnTicketDto detail(Long id) { return repository.find(id); } }",
                        null, 1, 100)
        );

        List<CodeChunk> selected = retrievalService.selectTopChunks(
                chunks,
                """
                explain this report evidence
                {
                  "file_path": "src/main/java/app/controller/PawnTicketController.java",
                  "start_line": 85,
                  "end_line": 120
                }
                """,
                null
        );

        assertEquals(path, selected.get(0).getFilePath());
        assertEquals(81, selected.get(0).getStartLine());
    }

    @Test
    void selectTopChunks_shouldUseCompactRawJsonStartEndLineEvidenceRange() {
        String path = "src/main/java/app/controller/PawnTicketController.java";
        List<CodeChunk> chunks = List.of(
                chunk(path,
                        "@RestController class PawnTicketController { }",
                        null, 1, 50),
                chunk(path,
                        "public PawnTicketDto detail(Long id) { return service.detail(id); } pawn ticket detail service repository",
                        null, 81, 130),
                chunk("src/main/java/app/service/PawnTicketService.java",
                        "@Service class PawnTicketService { PawnTicketDto detail(Long id) { return repository.find(id); } }",
                        null, 1, 100)
        );

        List<CodeChunk> selected = retrievalService.selectTopChunks(
                chunks,
                "explain compact evidence {\"file_path\":\"src/main/java/app/controller/PawnTicketController.java\",\"start_line\":85,\"end_line\":120}",
                null
        );

        assertEquals(path, selected.get(0).getFilePath());
        assertEquals(81, selected.get(0).getStartLine());
    }

    @Test
    void selectTopChunks_shouldUseCompactRawJsonLineNumberEvidenceAnchor() {
        String path = "src/main/java/app/controller/PawnTicketController.java";
        List<CodeChunk> chunks = List.of(
                chunk(path,
                        "@RestController class PawnTicketController { pawn ticket detail service repository audit ledger risk }",
                        null, 1, 50),
                chunk(path,
                        "public PawnTicketDto detail(Long id) { return service.detail(id); }",
                        null, 81, 130),
                chunk("src/legacy/PawnTicketController.java",
                        "pawn ticket detail service repository audit ledger risk compact evidence legacy legacy legacy",
                        null, 81, 130)
        );

        List<CodeChunk> selected = retrievalService.selectTopChunks(
                chunks,
                "explain compact evidence audit ledger risk {\"file_path\":\"src/main/java/app/controller/PawnTicketController.java\",\"line_number\":85}",
                null
        );

        assertEquals(path, selected.get(0).getFilePath());
        assertEquals(81, selected.get(0).getStartLine());
    }

    @Test
    void selectTopChunks_shouldNotCrossBindFilePathAndLineAcrossCompactJsonObjects() {
        String firstPath = "src/main/java/app/controller/FirstController.java";
        String secondPath = "src/main/java/app/controller/SecondController.java";
        List<CodeChunk> chunks = List.of(
                chunk(firstPath,
                        "audit ledger risk compact evidence noise noise noise noise",
                        null, 81, 130),
                chunk(secondPath,
                        "public SecondDto target() { return service.target(); }",
                        null, 81, 130)
        );

        List<CodeChunk> selected = retrievalService.selectTopChunks(
                chunks,
                "target audit ledger risk compact evidence " +
                        "{\"file_path\":\"src/main/java/app/controller/FirstController.java\",\"line_number\":20}" +
                        "{\"file_path\":\"src/main/java/app/controller/SecondController.java\",\"line_number\":85}",
                null
        );

        assertEquals(secondPath, selected.get(0).getFilePath());
        assertEquals(81, selected.get(0).getStartLine());
    }

    @Test
    void selectTopChunks_shouldPreferEvidenceObjectRangeOverLineNumber() {
        String path = "src/main/java/app/controller/PawnTicketController.java";
        List<CodeChunk> chunks = List.of(
                chunk(path,
                        "pawn ticket detail service repository audit ledger risk compact evidence line noise",
                        null, 1, 40),
                chunk(path,
                        "public PawnTicketDto detail(Long id) { return service.detail(id); }",
                        null, 81, 130)
        );

        List<CodeChunk> selected = retrievalService.selectTopChunks(
                chunks,
                "explain compact evidence audit ledger risk " +
                        "{\"file_path\":\"src/main/java/app/controller/PawnTicketController.java\",\"line_number\":12,\"start_line\":85,\"end_line\":120}",
                null
        );

        assertEquals(path, selected.get(0).getFilePath());
        assertEquals(81, selected.get(0).getStartLine());
    }

    @Test
    void selectTopChunks_shouldUseNestedArrayJsonEvidenceLocationAnchor() {
        String targetPath = "src/main/java/app/controller/PawnTicketController.java";
        List<CodeChunk> chunks = List.of(
                chunk("src/legacy/PawnTicketController.java",
                        "nested array json evidence audit ledger risk pawn ticket detail legacy legacy legacy",
                        null, 81, 130),
                chunk(targetPath,
                        "public PawnTicketDto detail(Long id) { return service.detail(id); }",
                        null, 81, 130),
                chunk("src/main/java/app/service/PawnTicketService.java",
                        "@Service class PawnTicketService { PawnTicketDto detail(Long id) { return repository.find(id); } }",
                        null, 1, 100)
        );

        List<CodeChunk> selected = retrievalService.selectTopChunks(
                chunks,
                """
                explain nested array json evidence audit ledger risk
                {
                  "items": [
                    {
                      "evidence": {
                        "filePath": "src/main/java/app/controller/PawnTicketController.java",
                        "startLine": 85,
                        "endLine": 120
                      }
                    }
                  ]
                }
                """,
                null
        );

        assertEquals(targetPath, selected.get(0).getFilePath());
        assertEquals(81, selected.get(0).getStartLine());
    }

    @Test
    void selectTopChunks_shouldUseCompactRawJsonFilePathAsStrongEvidenceAnchor() {
        String targetPath = "src/main/java/app/controller/PawnTicketController.java";
        List<CodeChunk> chunks = List.of(
                chunk("src/legacy/PawnTicketController.java",
                        "pawn ticket detail service repository audit ledger risk compact evidence legacy legacy legacy", null, 81, 130),
                chunk(targetPath,
                        "public PawnTicketDto detail(Long id) { return service.detail(id); }", null, 81, 130),
                chunk("src/main/java/app/service/PawnTicketService.java",
                        "@Service class PawnTicketService { PawnTicketDto detail(Long id) { return repository.find(id); } }",
                        null, 1, 100)
        );

        List<CodeChunk> selected = retrievalService.selectTopChunks(
                chunks,
                "explain compact evidence audit ledger risk {\"file_path\":\"src/main/java/app/controller/PawnTicketController.java\",\"start_line\":85,\"end_line\":120}",
                null
        );

        assertEquals(targetPath, selected.get(0).getFilePath());
        assertEquals(81, selected.get(0).getStartLine());
    }

    @Test
    void selectTopChunks_shouldPreferChunkContainingRequestedMethodReference() {
        List<CodeChunk> chunks = List.of(
                chunk("src/main/java/app/controller/PawnTicketController.java",
                        "@RestController class PawnTicketController { private PawnTicketService service; }", null, 1, 50),
                chunk("src/main/java/app/controller/PawnTicketController.java",
                        "public PawnTicketDto detail(Long id) { return service.detail(id); }", null, 81, 130),
                chunk("src/main/java/app/controller/PawnTicketController.java",
                        "private void audit() {}", null, 131, 180)
        );

        List<CodeChunk> selected = retrievalService.selectTopChunks(chunks, "PawnTicketController#detail", null);

        assertEquals(81, selected.get(0).getStartLine());
    }

    @Test
    void selectTopChunks_shouldPreferChunkContainingStackTraceMethodAndLine() {
        List<CodeChunk> chunks = List.of(
                chunk("src/main/java/app/service/AuthService.java",
                        "@Service class AuthService { private TokenRepository repository; }", null, 1, 60),
                chunk("src/main/java/app/service/AuthService.java",
                        "boolean validateJwtSignature(String token) { return verifier.verify(token); }", null, 81, 130),
                chunk("src/main/java/app/service/AuthService.java",
                        "TokenClaims parseToken(String token) { return parser.parse(token); }", null, 131, 180)
        );

        List<CodeChunk> selected = retrievalService.selectTopChunks(
                chunks,
                "at com.example.service.AuthService.validateJwtSignature(AuthService.java:85)",
                null
        );

        assertEquals(81, selected.get(0).getStartLine());
    }

    @Test
    void selectTopChunks_shouldPreferQualifiedPackagePathOverSameNamedMethodDecoy() {
        List<CodeChunk> chunks = List.of(
                chunk("src/main/java/com/acme/user/service/AuthService.java",
                        "boolean validateJwt(String token) { return userVerifier.verify(token); }", null, 81, 130),
                chunk("src/main/java/com/acme/billing/service/AuthService.java",
                        "boolean validateJwt(String token) { return billingVerifier.verify(token); }", null, 81, 130),
                chunk("src/main/java/com/acme/billing/controller/AuthController.java",
                        "@RestController class AuthController { void auth() {} }", null, 1, 40)
        );

        List<CodeChunk> selected = retrievalService.selectTopChunks(
                chunks,
                "at com.acme.billing.service.AuthService.validateJwt(AuthService.java:85)",
                null
        );

        assertEquals("src/main/java/com/acme/billing/service/AuthService.java", selected.get(0).getFilePath());
    }

    @Test
    void selectTopChunks_shouldUseCompactRawJsonHandlerClassMethodAsMethodAnchor() {
        String targetPath = "src/main/java/com/acme/billing/controller/PaymentController.java";
        List<CodeChunk> chunks = List.of(
                chunk("src/main/java/com/acme/user/controller/PaymentController.java",
                        "compact handler evidence payment controller risk ledger " +
                                "public PaymentDto createPayment(CreatePaymentRequest request) { return userService.createPayment(request); }",
                        null, 81, 130),
                chunk(targetPath,
                        "public PaymentDto createPayment(CreatePaymentRequest request) { return billingService.createPayment(request); }",
                        null, 81, 130),
                chunk("src/main/java/com/acme/billing/service/PaymentService.java",
                        "@Service class PaymentService { PaymentDto createPayment(CreatePaymentRequest request) { return repository.save(request); } }",
                        null, 1, 100)
        );

        List<CodeChunk> selected = retrievalService.selectTopChunks(
                chunks,
                "explain compact handler evidence risk ledger {\"handler_class\":\"com.acme.billing.controller.PaymentController\",\"handler_method\":\"createPayment\"}",
                null
        );

        assertEquals(targetPath, selected.get(0).getFilePath());
        assertEquals(81, selected.get(0).getStartLine());
    }

    @Test
    void selectTopChunks_shouldUseNestedArrayJsonHandlerClassMethodAsMethodAnchor() {
        String targetPath = "src/main/java/com/acme/billing/controller/PaymentController.java";
        List<CodeChunk> chunks = List.of(
                chunk("src/main/java/com/acme/user/controller/PaymentController.java",
                        "nested handler evidence payment controller risk ledger " +
                                "public PaymentDto createPayment(CreatePaymentRequest request) { return userService.createPayment(request); }",
                        null, 81, 130),
                chunk(targetPath,
                        "public PaymentDto createPayment(CreatePaymentRequest request) { return billingService.createPayment(request); }",
                        null, 81, 130),
                chunk("src/main/java/com/acme/billing/service/PaymentService.java",
                        "@Service class PaymentService { PaymentDto createPayment(CreatePaymentRequest request) { return repository.save(request); } }",
                        null, 1, 100)
        );

        List<CodeChunk> selected = retrievalService.selectTopChunks(
                chunks,
                """
                explain nested handler evidence risk ledger
                {
                  "items": [
                    {
                      "evidence": {
                        "handler_class": "com.acme.billing.controller.PaymentController",
                        "handler_method": "createPayment"
                      }
                    }
                  ]
                }
                """,
                null
        );

        assertEquals(targetPath, selected.get(0).getFilePath());
        assertEquals(81, selected.get(0).getStartLine());
    }

    @Test
    void selectTopChunks_shouldPreferKebabCaseFrontendMethodAnchor() {
        List<CodeChunk> chunks = List.of(
                chunk("web-console/src/config/table.ts",
                        "export const table = { fetchUser: true }", null, 1, 40),
                chunk("web-console/src/stores/auth-store.ts",
                        "export class AuthStore { async fetchUser() { return api.me(); } }", null, 81, 130),
                chunk("web-console/src/stores/auth-session.ts",
                        "export function refreshSession() { return api.refresh(); }", null, 131, 180)
        );

        List<CodeChunk> selected = retrievalService.selectTopChunks(
                chunks,
                "AuthStore.fetchUser(auth-store.ts:85:13)",
                null
        );

        assertEquals("web-console/src/stores/auth-store.ts", selected.get(0).getFilePath());
    }

    @Test
    void selectTopChunks_shouldPreferFunctionFileStackFrame() {
        List<CodeChunk> chunks = List.of(
                chunk("web-console/src/config/table.ts",
                        "export const table = { fetchUser: true }", null, 1, 40),
                chunk("web-console/src/stores/auth-store.ts",
                        "export async function fetchUser() { return api.me(); }", null, 81, 130),
                chunk("web-console/src/stores/auth-session.ts",
                        "export function refreshSession() { return api.refresh(); }", null, 131, 180)
        );

        List<CodeChunk> selected = retrievalService.selectTopChunks(
                chunks,
                "at fetchUser (http://localhost:5173/src/stores/auth-store.ts:85:13)",
                null
        );

        assertEquals("web-console/src/stores/auth-store.ts", selected.get(0).getFilePath());
    }

    @Test
    void selectTopChunks_shouldPreferViteQueryStackFrameFileAndLine() {
        List<CodeChunk> chunks = List.of(
                chunk("web-console/src/pages/ProjectDetail.tsx",
                        "export function ProjectDetail() { return <header />; }", null, 1, 40),
                chunk("web-console/src/pages/ProjectDetail.tsx",
                        "async function submitQa() { return projectApi.qa(); }", null, 241, 260),
                chunk("web-console/src/pages/Dashboard.tsx",
                        "async function submitQa() { return dashboardApi.qa(); }", null, 241, 260)
        );

        List<CodeChunk> selected = retrievalService.selectTopChunks(
                chunks,
                "TypeError: failed to submit\n" +
                        "    at submitQa (http://localhost:5173/src/pages/ProjectDetail.tsx?t=1782991000000:245:19)",
                null
        );

        assertEquals("web-console/src/pages/ProjectDetail.tsx", selected.get(0).getFilePath());
        assertEquals(241, selected.get(0).getStartLine());
    }

    @Test
    void selectTopChunks_shouldPreferSourceUrlPathSuffixOverSameNamedFileDecoy() {
        List<CodeChunk> chunks = List.of(
                chunk("web-console/src/legacy/ProjectDetail.tsx",
                        "async function submitQa() { return legacyApi.qa(); }", null, 241, 260),
                chunk("web-console/src/pages/ProjectDetail.tsx",
                        "async function submitQa() { return projectApi.qa(); }", null, 241, 260),
                chunk("web-console/src/pages/Dashboard.tsx",
                        "async function submitQa() { return dashboardApi.qa(); }", null, 241, 260)
        );

        List<CodeChunk> selected = retrievalService.selectTopChunks(
                chunks,
                "TypeError: failed to submit\n" +
                        "    at submitQa (http://localhost:5173/src/pages/ProjectDetail.tsx?t=1782991000000:245:19)",
                null
        );

        assertEquals("web-console/src/pages/ProjectDetail.tsx", selected.get(0).getFilePath());
    }

    @Test
    void selectTopChunks_shouldPreserveExactLineAnchorWhenHighScoringSameFileNoiseWouldFillCandidatePool() {
        List<CodeChunk> chunks = new ArrayList<>();
        String path = "src/main/java/app/controller/TargetController.java";
        String noisyContent = "targetcontroller controller java alpha beta gamma delta epsilon zeta eta theta iota kappa lambda";
        for (int i = 0; i < 100; i++) {
            chunks.add(chunk(path, noisyContent + " noise " + i, null, 1_000 + i * 10, 1_005 + i * 10));
        }
        chunks.add(chunk(path, "public TargetDto detail(Long id) { return service.detail(id); }", null, 81, 90));
        chunks.add(chunk("src/main/java/app/service/TargetService.java", noisyContent + " service", null, 81, 90));

        List<CodeChunk> selected = retrievalService.selectTopChunks(
                chunks,
                "alpha beta gamma delta epsilon zeta eta theta iota kappa lambda " + path + ":85",
                null
        );

        assertEquals(path, selected.get(0).getFilePath());
        assertEquals(81, selected.get(0).getStartLine());
        assertTrue(selected.stream().anyMatch(chunk -> path.equals(chunk.getFilePath()) && chunk.getStartLine() == 81));
    }

    @Test
    void selectTopChunks_shouldNotLetOverlappingExactAnchorsCrowdOutCrossFileEvidence() {
        String controllerPath = "src/main/java/app/controller/PaymentController.java";
        List<CodeChunk> chunks = List.of(
                chunk(controllerPath,
                        "@RestController class PaymentController { refund payment controller service mapper repository; }", null, 1, 100),
                chunk(controllerPath,
                        "public PaymentDto refund(Long id) { return paymentService.refund(id); } refund payment controller service mapper repository", null, 40, 120),
                chunk(controllerPath,
                        "private void auditRefund() { audit.info(\"refund\"); } refund payment controller service mapper repository", null, 70, 130),
                chunk(controllerPath,
                        "private void emitRefundEvent() { publisher.publish(); } refund payment controller service mapper repository", null, 80, 160),
                chunk("src/main/java/app/service/PaymentService.java",
                        "@Service class PaymentService { PaymentDto refund(Long id) { return mapper.find(id); } }", null, 1, 90),
                chunk("src/main/java/app/mapper/PaymentMapper.java",
                        "@Mapper interface PaymentMapper { PaymentEntity find(Long id); }", null, 1, 60)
        );

        List<CodeChunk> selected = retrievalService.selectTopChunks(
                chunks,
                "refund payment service mapper repository " + controllerPath + ":85",
                null
        );
        List<String> selectedPaths = selected.stream().map(CodeChunk::getFilePath).toList();

        assertEquals(controllerPath, selected.get(0).getFilePath());
        assertTrue(selected.stream().anyMatch(chunk -> controllerPath.equals(chunk.getFilePath())
                && chunk.getStartLine() <= 85 && chunk.getEndLine() >= 85));
        assertTrue(selectedPaths.contains("src/main/java/app/service/PaymentService.java"));
        assertTrue(selectedPaths.contains("src/main/java/app/mapper/PaymentMapper.java"));
        assertTrue(selectedPaths.stream().filter(controllerPath::equals).count() <= 2);
    }

    @Test
    void selectTopChunks_shouldNotTreatArchivedModulePathAsExactSourceEvidence() {
        String targetPath = "apps/client/src/api/index.ts";
        List<CodeChunk> chunks = List.of(
                chunk("archive/apps/client/src/api/index.ts",
                        "legacy archived api client index sourceUrl report evidence fetch login login login login login login", null, 40, 60),
                chunk(targetPath,
                        "export function loginApi() { return request.post('/api/login'); }", null, 40, 60),
                chunk("packages/admin/src/api/index.ts",
                        "admin api index login report evidence", null, 40, 60)
        );

        List<CodeChunk> selected = retrievalService.selectTopChunks(
                chunks,
                "explain report evidence sourceUrl=https://github.com/acme/source-lens/blob/main/apps/client/src/api/index.ts#L44",
                null
        );

        assertEquals(targetPath, selected.get(0).getFilePath());
    }

    @Test
    void selectTopChunks_shouldNotTreatGeneratedSuffixPathAsExactSourceEvidence() {
        String targetPath = "packages/admin/src/pages/Login.tsx";
        List<CodeChunk> chunks = List.of(
                chunk("generated/packages/admin/src/pages/Login.tsx",
                        "generated source mirror Login sourceUrl report evidence login login login login login", null, 40, 60),
                chunk(targetPath,
                        "export function Login() { return <LoginForm />; }", null, 40, 60),
                chunk("apps/client/src/pages/Login.tsx",
                        "client login page report evidence", null, 40, 60)
        );

        List<CodeChunk> selected = retrievalService.selectTopChunks(
                chunks,
                "explain report evidence sourceUrl=https://github.com/acme/source-lens/blob/main/packages/admin/src/pages/Login.tsx#L44",
                null
        );

        assertEquals(targetPath, selected.get(0).getFilePath());
    }

    @Test
    void selectTopChunks_shouldPreferRootRelativeExactSourcePathOverPackageSuffixDecoy() {
        String targetPath = "src/pages/Login.tsx";
        List<CodeChunk> chunks = List.of(
                chunk("packages/admin/src/pages/Login.tsx",
                        "admin login sourceUrl report evidence login login login login login", null, 40, 60),
                chunk(targetPath,
                        "export function Login() { return <LoginForm />; }", null, 40, 60),
                chunk("apps/client/src/pages/Login.tsx",
                        "client login page report evidence", null, 40, 60)
        );

        List<CodeChunk> selected = retrievalService.selectTopChunks(
                chunks,
                "explain report evidence sourceUrl=https://github.com/acme/source-lens/blob/main/src/pages/Login.tsx#L44",
                null
        );

        assertEquals(targetPath, selected.get(0).getFilePath());
    }

    @Test
    void selectTopChunks_shouldNotTreatFixtureMirrorPathAsExactSourceEvidence() {
        String targetPath = "src/pages/Login.tsx";
        for (String fixturePath : List.of(
                "tests/fixtures/src/pages/Login.tsx",
                "tests/__fixtures__/src/pages/Login.tsx",
                "testdata/src/pages/Login.tsx",
                "test-data/src/pages/Login.tsx")) {
            List<CodeChunk> chunks = List.of(
                    chunk(fixturePath,
                            "fixture login sourceUrl report evidence login login login login login", null, 40, 60),
                    chunk(targetPath,
                            "export function Login() { return <LoginForm />; }", null, 40, 60),
                    chunk("docs/login.md",
                            "login report evidence notes", null, 1, 20)
            );

            List<CodeChunk> selected = retrievalService.selectTopChunks(
                    chunks,
                    "explain report evidence sourceUrl=https://github.com/acme/source-lens/blob/main/src/pages/Login.tsx#L44",
                    null
            );

            assertEquals(targetPath, selected.get(0).getFilePath(), fixturePath);
        }
    }

    @Test
    void selectTopChunks_shouldPreferRootRelativeIndexWhenPackageRootOnlyAppearsInHostedBranch() {
        String targetPath = "src/index.ts";
        List<CodeChunk> chunks = List.of(
                chunk("packages/admin/src/index.ts", "export { login } from './admin-login'; sourceUrl index login login login", null, 40, 60,
                        "packages/admin", "packages/admin"),
                chunk(targetPath, "export { login } from './root-login';", null, 40, 60,
                        null, null),
                chunk("apps/admin/src/index.ts", "export { login } from './legacy-login'; admin login", null, 40, 60,
                        "apps/admin", "apps/admin")
        );

        List<CodeChunk> selected = retrievalService.selectTopChunks(
                chunks,
                "explain report evidence sourceUrl=https://github.com/acme/source-lens/blob/feature/packages/admin/src/index.ts#L44",
                null
        );

        assertEquals(targetPath, selected.get(0).getFilePath());
    }

    @Test
    void selectTopChunks_shouldPreferRootRelativeIndexWhenStrongRootOnlyAppearsInHostedBranch() {
        String targetPath = "src/index.ts";
        List<CodeChunk> chunks = List.of(
                chunk("web-console/src/index.ts", "export { login } from './web-login'; sourceUrl index login login login", null, 40, 60,
                        "web-console", "web-console"),
                chunk(targetPath, "export { login } from './root-login';", null, 40, 60,
                        null, null),
                chunk("packages/admin/src/index.ts", "export { login } from './admin-login'; admin login", null, 40, 60,
                        "packages/admin", "packages/admin")
        );

        List<CodeChunk> selected = retrievalService.selectTopChunks(
                chunks,
                "explain report evidence sourceUrl=https://github.com/acme/source-lens/blob/feature/web-console/src/index.ts#L44",
                null
        );

        assertEquals(targetPath, selected.get(0).getFilePath());
    }

    @Test
    void selectTopChunks_shouldUseSourceRootMetadataToResolveHostedBranchStrongRootAmbiguity() {
        String targetPath = "web-console/src/index.ts";
        List<CodeChunk> chunks = List.of(
                chunk(targetPath, "export { login } from './web-login';", null, 40, 60,
                        "web-console", "web-console"),
                chunk("src/index.ts", "export { login } from './root-login'; sourceUrl index login login login", null, 40, 60,
                        null, null),
                chunk("packages/admin/src/index.ts", "export { login } from './admin-login'; admin login", null, 40, 60,
                        "packages/admin", "packages/admin")
        );

        List<CodeChunk> selected = retrievalService.selectTopChunks(
                chunks,
                """
                explain report evidence
                sourceRoot: web-console
                sourceUrl: https://github.com/acme/source-lens/blob/feature/web-console/src/index.ts#L44
                """,
                null
        );

        assertEquals(targetPath, selected.get(0).getFilePath());
    }

    @Test
    void selectTopChunks_shouldUseSourceRootMetadataForModuleLocalPath() {
        String targetPath = "src/index.ts";
        List<CodeChunk> chunks = List.of(
                chunk("src/index.ts", "export { login } from './root-login'; sourceUrl index login login login", null, 40, 60,
                        null, null),
                chunk("src/index.ts", "export { login } from './admin-local-login'; admin local login login login", null, 40, 60,
                        "packages/admin", "packages/admin"),
                chunk(targetPath, "export { login } from './web-login';", null, 40, 60,
                        "web-console", "web-console"),
                chunk("packages/admin/src/index.ts", "export { login } from './admin-login'; admin login", null, 40, 60,
                        "packages/admin", "packages/admin")
        );

        List<CodeChunk> selected = retrievalService.selectTopChunks(
                chunks,
                """
                explain report evidence
                sourceRoot: web-console
                sourceUrl: https://github.com/acme/source-lens/blob/feature/web-console/src/index.ts#L44
                """,
                null
        );

        assertEquals("web-console", selected.get(0).getWorkspaceRoot());
        assertEquals(targetPath, selected.get(0).getFilePath());
        long selectedRootRelativeCount = selected.stream()
                .filter(chunk -> targetPath.equals(chunk.getFilePath()))
                .count();
        assertEquals(1, selectedRootRelativeCount);
        assertTrue(selected.stream()
                .noneMatch(chunk -> targetPath.equals(chunk.getFilePath())
                        && "packages/admin".equals(chunk.getWorkspaceRoot())));
    }

    @Test
    void selectTopChunks_shouldUseVirtualPathDiversityForModuleLocalPaths() {
        String targetPath = "src/index.ts";
        List<CodeChunk> chunks = List.of(
                chunk(targetPath, "export const login = 'web-console';", null, 40, 60,
                        "web-console", "web-console"),
                chunk(targetPath, "export const login = 'packages-admin';", null, 40, 60,
                        "packages/admin", "packages/admin"),
                chunk(targetPath, "export const login = 'apps-client';", null, 40, 60,
                        "apps/client", "apps/client"),
                chunk(targetPath, "export const login = 'packages-marketing'; sourceUrl index login login login", null, 40, 60,
                        "packages/marketing", "packages/marketing"),
                chunk("src/main/java/app/AuthController.java",
                        "@GetMapping(\"/api/login\") public String login() { return \"noise\"; } sourceUrl login login login",
                        null, 1, 20, null, null),
                chunk(targetPath, "export const login = 'root'; sourceUrl index login login login", null, 40, 60,
                        null, null)
        );

        List<CodeChunk> selected = retrievalService.selectTopChunks(
                chunks,
                """
                compare module-local report evidence
                sourceRoot: web-console
                moduleRoot: packages/admin
                workspaceRoot: apps/client
                sourceUrl: https://github.com/acme/source-lens/blob/feature/web-console/src/index.ts#L44
                """,
                null
        );

        assertTrue(selected.stream().anyMatch(chunk -> "web-console".equals(chunk.getWorkspaceRoot())));
        assertTrue(selected.stream().anyMatch(chunk -> "packages/admin".equals(chunk.getWorkspaceRoot())));
        assertTrue(selected.stream().anyMatch(chunk -> "apps/client".equals(chunk.getWorkspaceRoot())));
        assertEquals(List.of("apps/client", "packages/admin", "web-console"),
                selected.stream().limit(3).map(CodeChunk::getWorkspaceRoot).sorted().toList());
        assertTrue(selected.stream().limit(3)
                .noneMatch(chunk -> "packages/marketing".equals(chunk.getWorkspaceRoot())));
    }

    @Test
    void selectTopChunks_shouldFallbackWhenNoKeywordMatches() {
        List<CodeChunk> chunks = new ArrayList<>();
        chunks.add(chunk("src/a/A.java", "alpha", null));
        chunks.add(chunk("src/b/B.java", "beta", null));
        chunks.add(chunk("src/c/C.java", "gamma", null));

        List<CodeChunk> selected = retrievalService.selectTopChunks(chunks, "????", null);

        assertEquals(2, selected.size());
        assertTrue(selected.stream().map(CodeChunk::getFilePath).toList().contains("src/a/A.java"));
        assertTrue(selected.stream().map(CodeChunk::getFilePath).toList().contains("src/b/B.java"));
    }

    private CodeChunk chunk(String path, String content, String embedding) {
        return chunk(path, content, embedding, 1, 1);
    }

    private CodeChunk chunk(String path, String content, String embedding, int startLine, int endLine) {
        return chunk(path, content, embedding, startLine, endLine, null, null);
    }

    private CodeChunk chunk(String path, String content, String embedding, int startLine, int endLine,
                            String workspaceRoot, String moduleRoot) {
        return CodeChunk.builder()
                .filePath(path)
                .workspaceRoot(workspaceRoot)
                .moduleRoot(moduleRoot)
                .content(content)
                .startLine(startLine)
                .endLine(endLine)
                .embedding(embedding)
                .build();
    }
}
