package com.sourcelens;

import com.sourcelens.module.analysis.entity.CodeRelationEntity;
import com.sourcelens.module.analysis.entity.CodeSymbol;
import com.sourcelens.module.analysis.service.JavaAstParser;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JavaAstParserTest {

    @TempDir
    Path tempDir;

    @Test
    void parseFile_shouldExposeParseFailureStateForInvalidJava() throws Exception {
        Path broken = tempDir.resolve("Broken.java");
        Files.writeString(broken, """
                package com.example;

                public class Broken {
                    public void broken( {
                    }
                }
                """);

        JavaAstParser.ParseResult result = new JavaAstParser()
                .parseFile(broken, "src/main/java/com/example/Broken.java", 42L);

        assertFalse(result.parseSucceeded, "invalid Java should expose parse failure state");
        assertFalse(result.parseErrorMessage.isBlank(), "parse failure should retain a diagnostic message");
    }

    @Test
    void parseFile_shouldSupportJava14PatternMatchingInstanceof() throws Exception {
        Path integrationTest = tempDir.resolve("PostgresIntegrationTests.java");
        Files.writeString(integrationTest, """
                package com.example.petclinic;

                public class PostgresIntegrationTests {
                    public String message(Object cause) {
                        if (cause instanceof RuntimeException runtimeException) {
                            return runtimeException.getMessage();
                        }
                        return "ok";
                    }
                }
                """);

        JavaAstParser.ParseResult result = new JavaAstParser()
                .parseFile(integrationTest, "src/test/java/com/example/petclinic/PostgresIntegrationTests.java", 42L);

        assertTrue(hasSymbol(result.symbols, "com.example.petclinic.PostgresIntegrationTests#message()"),
                "Java 14 pattern matching instanceof should parse without dropping the whole file");
        assertTrue(hasRelation(result.relations,
                        "com.example.petclinic.PostgresIntegrationTests#message()",
                        "java.lang.RuntimeException#getMessage()",
                        "CALLS"),
                "pattern variable method calls should contribute to the AST relation graph");
    }

    @Test
    void parseFile_shouldEmitScopedMethodCallRelationsForInjectedAndLocalVariables() throws Exception {
        Path controller = tempDir.resolve("OrderController.java");
        Files.writeString(controller, """
                package com.example.order;

                import com.example.order.service.OrderService;
                import org.springframework.beans.factory.annotation.Autowired;
                import org.springframework.web.bind.annotation.GetMapping;
                import org.springframework.web.bind.annotation.RestController;

                @RestController
                public class OrderController {
                    @Autowired
                    private OrderService orderService;

                    @GetMapping("/orders")
                    public String list() {
                        OrderService localService = orderService;
                        orderService.findOrders();
                        this.orderService.auditOrders();
                        localService.findOrders();
                        return "ok";
                    }
                }
                """);

        JavaAstParser.ParseResult result = new JavaAstParser()
                .parseFile(controller, "src/main/java/com/example/order/OrderController.java", 42L);

        assertTrue(hasSymbol(result.symbols, "com.example.order.OrderController#list()"),
                "source method symbol should be emitted for relation overlap");
        assertTrue(hasRelation(result.relations,
                        "com.example.order.OrderController#list()",
                        "com.example.order.service.OrderService#findOrders()",
                        "CALLS"),
                "field-scoped service call should emit CALLS relation to target method symbol id");
        assertTrue(hasRelation(result.relations,
                        "com.example.order.OrderController#list()",
                        "com.example.order.service.OrderService#auditOrders()",
                        "CALLS"),
                "this.field-scoped service call should emit CALLS relation");
    }

    @Test
    void parseFile_shouldEmitSameClassMethodCallRelationsWithoutGuessingStaticImports() throws Exception {
        Path service = tempDir.resolve("OrderService.java");
        Files.writeString(service, """
                package com.example.order;

                import static java.util.Objects.requireNonNull;

                public class OrderService {
                    public String list() {
                        validate();
                        this.audit();
                        requireNonNull("orders");
                        return "ok";
                    }

                    private void validate() {
                    }

                    private void audit() {
                    }
                }
                """);

        JavaAstParser.ParseResult result = new JavaAstParser()
                .parseFile(service, "src/main/java/com/example/order/OrderService.java", 42L);

        assertTrue(hasRelation(result.relations,
                        "com.example.order.OrderService#list()",
                        "com.example.order.OrderService#validate()",
                        "CALLS"),
                "unscoped same-class helper call should emit CALLS relation");
        assertTrue(hasRelation(result.relations,
                        "com.example.order.OrderService#list()",
                        "com.example.order.OrderService#audit()",
                        "CALLS"),
                "this.method() same-class helper call should emit CALLS relation");
        assertFalse(hasRelation(result.relations,
                        "com.example.order.OrderService#list()",
                        "com.example.order.OrderService#requireNonNull()",
                        "CALLS"),
                "static import calls must not be guessed as same-class methods");
    }

    @Test
    void parseFile_shouldEmitImportedProjectStaticClassCallWithoutExternalImportNoise() throws Exception {
        Path service = tempDir.resolve("OrderService.java");
        Files.writeString(service, """
                package com.example.order.service;

                import com.example.order.mapper.OrderMapper;
                import java.util.Objects;

                public class OrderService {
                    public String list() {
                        OrderMapper.toDto("order");
                        Objects.requireNonNull("order");
                        return "ok";
                    }
                }
                """);

        JavaAstParser.ParseResult result = new JavaAstParser()
                .parseFile(service, "src/main/java/com/example/order/service/OrderService.java", 42L);

        assertTrue(hasRelation(result.relations,
                        "com.example.order.service.OrderService#list()",
                        "com.example.order.mapper.OrderMapper#toDto()",
                        "CALLS"),
                "explicitly imported project static class call should emit CALLS relation");
        assertFalse(hasRelation(result.relations,
                        "com.example.order.service.OrderService#list()",
                        "java.util.Objects#requireNonNull()",
                        "CALLS"),
                "external imports must not pollute project CALLS relation graph");
    }

    @Test
    void parseFile_shouldResolveCommonJdkSimpleTypesWithoutProjectPackageNoise() throws Exception {
        Path controller = tempDir.resolve("SampleController.java");
        Files.writeString(controller, """
                package com.example.web;

                import java.util.Map;

                public class SampleController {
                    public boolean check(String name, Map<String, Object> payload) {
                        String local = name.trim();
                        Object value = payload.get("id");
                        return local.equals("root") && value.toString().contains("42");
                    }
                }
                """);

        JavaAstParser.ParseResult result = new JavaAstParser()
                .parseFile(controller, "src/main/java/com/example/web/SampleController.java", 42L);

        assertTrue(hasRelation(result.relations,
                        "com.example.web.SampleController#check()",
                        "java.lang.String#trim()",
                        "CALLS"),
                "java.lang String variables should resolve to java.lang, not the current package");
        assertTrue(hasRelation(result.relations,
                        "com.example.web.SampleController#check()",
                        "java.util.Map#get()",
                        "CALLS"),
                "java.util Map variables should resolve to java.util, not the current package");
        assertFalse(hasRelation(result.relations,
                        "com.example.web.SampleController#check()",
                        "com.example.web.String#trim()",
                        "CALLS"),
                "common JDK String must not be emitted as a project-local type");
        assertFalse(hasRelation(result.relations,
                        "com.example.web.SampleController#check()",
                        "com.example.web.Map#get()",
                        "CALLS"),
                "common JDK Map must not be emitted as a project-local type");
    }

    @Test
    void parseFile_shouldResolveCommonJdkExceptionProcessAndStreamTypesWithoutProjectPackageNoise() throws Exception {
        Path utility = tempDir.resolve("RuntimeUtility.java");
        Files.writeString(utility, """
                package com.example.util;

                import java.io.ByteArrayOutputStream;

                public class RuntimeUtility {
                    public String run(Runtime runtime, Number number, Throwable throwable) throws Exception {
                        Process process = runtime.exec("pwd");
                        ByteArrayOutputStream output = new ByteArrayOutputStream();
                        output.write(1);
                        number.intValue();
                        throwable.getMessage();
                        Exception failure = new RuntimeException("bad");
                        return failure.getMessage() + process.getInputStream();
                    }
                }
                """);

        JavaAstParser.ParseResult result = new JavaAstParser()
                .parseFile(utility, "src/main/java/com/example/util/RuntimeUtility.java", 42L);

        assertTrue(hasRelation(result.relations,
                        "com.example.util.RuntimeUtility#run()",
                        "java.lang.Runtime#exec()",
                        "CALLS"),
                "java.lang Runtime should not resolve to the current package");
        assertTrue(hasRelation(result.relations,
                        "com.example.util.RuntimeUtility#run()",
                        "java.lang.Process#getInputStream()",
                        "CALLS"),
                "java.lang Process should not resolve to the current package");
        assertTrue(hasRelation(result.relations,
                        "com.example.util.RuntimeUtility#run()",
                        "java.io.ByteArrayOutputStream#write()",
                        "CALLS"),
                "java.io ByteArrayOutputStream should not resolve to the current package");
        assertFalse(hasRelation(result.relations,
                        "com.example.util.RuntimeUtility#run()",
                        "com.example.util.Exception#getMessage()",
                        "CALLS"),
                "java.lang Exception must not be emitted as a project-local type");
    }

    @Test
    void parseFile_shouldResolveCatchParametersAndTryResourceVariables() throws Exception {
        Path controller = tempDir.resolve("FileController.java");
        Files.writeString(controller, """
                package com.example.controller;

                import java.io.ByteArrayOutputStream;
                import java.io.FileInputStream;
                import java.io.InputStream;

                public class FileController {
                    public byte[] encrypt(java.io.File file) {
                        try (InputStream input = new FileInputStream(file);
                             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
                            output.write(input.read());
                            return output.toByteArray();
                        } catch (RuntimeException e) {
                            e.printStackTrace();
                            return e.getMessage().getBytes();
                        } catch (Exception e) {
                            e.printStackTrace();
                            return e.getMessage().getBytes();
                        }
                    }
                }
                """);

        JavaAstParser.ParseResult result = new JavaAstParser()
                .parseFile(controller, "src/main/java/com/example/controller/FileController.java", 42L);

        assertTrue(hasRelation(result.relations,
                        "com.example.controller.FileController#encrypt()",
                        "java.io.ByteArrayOutputStream#write()",
                        "CALLS"),
                "try-with-resource variables should keep their declared JDK type");
        assertTrue(hasRelation(result.relations,
                        "com.example.controller.FileController#encrypt()",
                        "java.lang.Exception#getMessage()",
                        "CALLS"),
                "catch Exception parameter should resolve to java.lang");
        assertFalse(hasRelation(result.relations,
                        "com.example.controller.FileController#encrypt()",
                        "com.example.controller.Exception#getMessage()",
                "CALLS"),
                "catch parameters must not fall back to the current package");
        assertFalse(hasRelation(result.relations,
                        "com.example.controller.FileController#encrypt()",
                        "com.example.controller.RuntimeException#printStackTrace()",
                        "CALLS"),
                "catch RuntimeException must not fall back to the current package");
    }

    @Test
    void parseFile_shouldDeduplicateOverloadedMethodSymbolsAtNameLevel() throws Exception {
        Path util = tempDir.resolve("ResponseUtil.java");
        Files.writeString(util, """
                package com.example.util;

                public class ResponseUtil {
                    public String ok() {
                        return "ok";
                    }

                    public String ok(String message) {
                        return message;
                    }

                    public String ok(String message, Object data) {
                        return message + data;
                    }
                }
                """);

        JavaAstParser.ParseResult result = new JavaAstParser()
                .parseFile(util, "src/main/java/com/example/util/ResponseUtil.java", 42L);

        long okSymbolCount = result.symbols.stream()
                .filter(symbol -> "METHOD".equals(symbol.getKind()))
                .filter(symbol -> "com.example.util.ResponseUtil#ok()".equals(symbol.getSymbolId()))
                .count();

        assertTrue(okSymbolCount == 1,
                "current symbol schema is name-level, so overloaded method symbols should be deduplicated");
    }

    @Test
    void parseFile_shouldResolveWildcardExternalImportsAndSkipPrimitiveTargets() throws Exception {
        Path factory = tempDir.resolve("RecommendAlgorithmFactory.java");
        Files.writeString(factory, """
                package com.example.recommend;

                import java.io.*;
                import java.util.*;
                import weka.core.*;

                public class RecommendAlgorithmFactory {
                    public boolean inspect(File modelFile, Instances instances, Map<String, Object> values, double score) {
                        for (Map.Entry<String, Object> entry : values.entrySet()) {
                            entry.getKey();
                        }
                        boolean exists = modelFile.exists();
                        int attributes = instances.numAttributes();
                        return exists && attributes > 0;
                    }
                }
                """);

        JavaAstParser.ParseResult result = new JavaAstParser()
                .parseFile(factory, "src/main/java/com/example/recommend/RecommendAlgorithmFactory.java", 42L);

        assertTrue(hasRelation(result.relations,
                        "com.example.recommend.RecommendAlgorithmFactory#inspect()",
                        "java.io.File#exists()",
                        "CALLS"),
                "java.io wildcard imports should resolve File to java.io");
        assertTrue(hasRelation(result.relations,
                        "com.example.recommend.RecommendAlgorithmFactory#inspect()",
                        "weka.core.Instances#numAttributes()",
                        "CALLS"),
                "external wildcard imports should resolve third-party types");
        assertTrue(hasRelation(result.relations,
                        "com.example.recommend.RecommendAlgorithmFactory#inspect()",
                        "java.util.Map.Entry#getKey()",
                        "CALLS"),
                "Map.Entry should not be emitted as a project-local Entry type");
        assertFalse(result.relations.stream().anyMatch(relation ->
                        relation.getTargetId() != null
                                && relation.getTargetId().startsWith("com.example.recommend.File#")),
                "wildcard imported java.io File must not be emitted as a project-local type");
        assertFalse(result.relations.stream().anyMatch(relation ->
                        relation.getTargetId() != null
                                && relation.getTargetId().contains(".double#")),
                "primitive types must not become CALLS targets");
    }

    @Test
    void parseFile_shouldEmitLombokDataAccessorSymbolsForInstanceFields() throws Exception {
        Path entity = tempDir.resolve("UserEntity.java");
        Files.writeString(entity, """
                package com.example.entity;

                import lombok.Data;

                @Data
                public class UserEntity {
                    private static final long serialVersionUID = 1L;
                    private Long id;
                    private String username;
                    private boolean enabled;
                }
                """);

        JavaAstParser.ParseResult result = new JavaAstParser()
                .parseFile(entity, "src/main/java/com/example/entity/UserEntity.java", 42L);

        assertTrue(hasSymbol(result.symbols, "com.example.entity.UserEntity#getId()"),
                "Lombok @Data should expose getter symbol for project entity fields");
        assertTrue(hasSymbol(result.symbols, "com.example.entity.UserEntity#setId()"),
                "Lombok @Data should expose setter symbol for project entity fields");
        assertTrue(hasSymbol(result.symbols, "com.example.entity.UserEntity#getUsername()"),
                "Lombok @Data getter symbols should use JavaBeans capitalization");
        assertTrue(hasSymbol(result.symbols, "com.example.entity.UserEntity#isEnabled()"),
                "primitive boolean fields should expose isX getter");
        assertTrue(hasSymbol(result.symbols, "com.example.entity.UserEntity#getEnabled()"),
                "primitive boolean fields also keep getX compatibility for source call matching");
        assertFalse(hasSymbol(result.symbols, "com.example.entity.UserEntity#getSerialVersionUID()"),
                "static fields must not receive Lombok accessor symbols");
    }

    @Test
    void parseFile_shouldEmitMyBatisPlusIServiceInheritedMethodSymbolsOnlyForFrameworkInterface() throws Exception {
        Path service = tempDir.resolve("UserService.java");
        Files.writeString(service, """
                package com.example.service;

                import com.baomidou.mybatisplus.extension.service.IService;
                import com.example.entity.UserEntity;

                public interface UserService extends IService<UserEntity> {
                    String queryPage();
                }
                """);
        Path custom = tempDir.resolve("CustomService.java");
        Files.writeString(custom, """
                package com.example.service;

                interface IService<T> {
                }

                public interface CustomService extends IService<String> {
                }
                """);

        JavaAstParser.ParseResult serviceResult = new JavaAstParser()
                .parseFile(service, "src/main/java/com/example/service/UserService.java", 42L);
        JavaAstParser.ParseResult customResult = new JavaAstParser()
                .parseFile(custom, "src/main/java/com/example/service/CustomService.java", 42L);

        assertTrue(hasSymbol(serviceResult.symbols, "com.example.service.UserService#getOne()"),
                "MyBatis-Plus IService inheritance should expose inherited CRUD method symbols");
        assertTrue(hasSymbol(serviceResult.symbols, "com.example.service.UserService#save()"),
                "MyBatis-Plus IService save method should be available for CALLS target matching");
        assertTrue(hasSymbol(serviceResult.symbols, "com.example.service.UserService#removeBatchByIds()"),
                "Observed MyBatis-Plus inherited methods should be covered by the framework method list");
        assertFalse(hasSymbol(customResult.symbols, "com.example.service.CustomService#getOne()"),
                "local interfaces named IService must not be treated as MyBatis-Plus");
    }

    @Test
    void parseFile_shouldPreferWildcardPackageMatchingTypeSuffix() throws Exception {
        Path controller = tempDir.resolve("CommonController.java");
        Files.writeString(controller, """
                package com.example.controller;

                import com.example.entity.*;
                import com.example.service.*;
                import org.springframework.beans.factory.annotation.Autowired;

                public class CommonController {
                    @Autowired
                    private CommonService commonService;

                    public String options() {
                        return commonService.getOption().toString();
                    }
                }
                """);

        JavaAstParser.ParseResult result = new JavaAstParser()
                .parseFile(controller, "src/main/java/com/example/controller/CommonController.java", 42L);

        assertTrue(hasRelation(result.relations,
                        "com.example.controller.CommonController#options()",
                        "com.example.service.CommonService#getOption()",
                        "CALLS"),
                "service wildcard imports should beat earlier entity wildcard imports for *Service types");
        assertFalse(hasRelation(result.relations,
                        "com.example.controller.CommonController#options()",
                        "com.example.entity.CommonService#getOption()",
                        "CALLS"),
                "ambiguous wildcard imports must not pick entity package for service-typed fields");
    }

    @Test
    void parseFile_shouldResolveWebSocketIllegalAccessAnnotationAndHashMapInheritedMethods() throws Exception {
        Path webSocketManager = tempDir.resolve("WebSocketManager.java");
        Files.writeString(webSocketManager, """
                package com.example.ws;

                import jakarta.websocket.*;

                public class WebSocketManager {
                    private Session session;

                    public void send() throws Exception {
                        session.getBasicRemote().sendText("ok");
                    }
                }
                """);
        Path deSensUtil = tempDir.resolve("DeSensUtil.java");
        Files.writeString(deSensUtil, """
                package com.example.utils;

                public class DeSensUtil {
                    public void apply() {
                        try {
                            throw new IllegalAccessException("bad");
                        } catch (IllegalAccessException e) {
                            e.printStackTrace();
                        }
                    }
                }
                """);
        Path sysLog = tempDir.resolve("SysLog.java");
        Files.writeString(sysLog, """
                package com.example.annotation;

                public @interface SysLog {
                    String value() default "";
                }
                """);
        Path response = tempDir.resolve("R.java");
        Files.writeString(response, """
                package com.example.utils;

                import java.util.HashMap;
                import java.util.Map;

                public class R extends HashMap<String, Object> {
                    public static R ok(Map<String, Object> map) {
                        R r = new R();
                        r.putAll(map);
                        return r;
                    }
                }
                """);

        JavaAstParser.ParseResult webSocketResult = new JavaAstParser()
                .parseFile(webSocketManager, "src/main/java/com/example/ws/WebSocketManager.java", 42L);
        JavaAstParser.ParseResult deSensResult = new JavaAstParser()
                .parseFile(deSensUtil, "src/main/java/com/example/utils/DeSensUtil.java", 42L);
        JavaAstParser.ParseResult annotationResult = new JavaAstParser()
                .parseFile(sysLog, "src/main/java/com/example/annotation/SysLog.java", 42L);
        JavaAstParser.ParseResult responseResult = new JavaAstParser()
                .parseFile(response, "src/main/java/com/example/utils/R.java", 42L);

        assertTrue(hasRelation(webSocketResult.relations,
                        "com.example.ws.WebSocketManager#send()",
                        "jakarta.websocket.Session#getBasicRemote()",
                        "CALLS"),
                "jakarta.websocket wildcard imports should resolve Session as an external websocket type");
        assertFalse(hasRelation(webSocketResult.relations,
                        "com.example.ws.WebSocketManager#send()",
                        "com.example.ws.Session#getBasicRemote()",
                        "CALLS"),
                "websocket Session must not fall back to the current package");
        assertTrue(hasRelation(deSensResult.relations,
                        "com.example.utils.DeSensUtil#apply()",
                        "java.lang.IllegalAccessException#printStackTrace()",
                        "CALLS"),
                "java.lang IllegalAccessException should not resolve to the current package");
        assertTrue(hasSymbol(annotationResult.symbols, "com.example.annotation.SysLog#value()"),
                "annotation member methods should be emitted for project annotation calls");
        assertTrue(hasSymbol(responseResult.symbols, "com.example.utils.R#putAll()"),
                "HashMap subclasses should expose inherited putAll for project-local target matching");
    }

    private boolean hasSymbol(List<CodeSymbol> symbols, String symbolId) {
        return symbols.stream().anyMatch(symbol -> symbolId.equals(symbol.getSymbolId()));
    }

    private boolean hasRelation(List<CodeRelationEntity> relations, String sourceId, String targetId, String relationType) {
        return relations.stream().anyMatch(relation ->
                sourceId.equals(relation.getSourceId())
                        && targetId.equals(relation.getTargetId())
                        && relationType.equals(relation.getRelationType())
        );
    }
}
