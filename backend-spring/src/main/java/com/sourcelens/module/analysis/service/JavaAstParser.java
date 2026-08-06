package com.sourcelens.module.analysis.service;

import com.github.javaparser.JavaParser;
import com.github.javaparser.ParserConfiguration;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.ImportDeclaration;
import com.github.javaparser.ast.body.*;
import com.github.javaparser.ast.expr.AnnotationExpr;
import com.github.javaparser.ast.expr.Expression;
import com.github.javaparser.ast.expr.InstanceOfExpr;
import com.github.javaparser.ast.expr.MemberValuePair;
import com.github.javaparser.ast.expr.MethodCallExpr;
import com.github.javaparser.ast.expr.PatternExpr;
import com.github.javaparser.ast.expr.RecordPatternExpr;
import com.github.javaparser.ast.expr.TypePatternExpr;
import com.github.javaparser.ast.stmt.CatchClause;
import com.github.javaparser.ast.type.ClassOrInterfaceType;
import com.sourcelens.module.analysis.entity.CodeRelationEntity;
import com.sourcelens.module.analysis.entity.CodeSymbol;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Path;
import java.util.*;

@Slf4j
@Service
public class JavaAstParser {

    private static final ParserConfiguration JAVA_PARSER_CONFIGURATION = new ParserConfiguration()
            .setLanguageLevel(ParserConfiguration.LanguageLevel.JAVA_21);

    private static final Map<String, String> COMMON_JDK_TYPE_PACKAGES = Map.ofEntries(
            Map.entry("String", "java.lang"),
            Map.entry("Object", "java.lang"),
            Map.entry("Class", "java.lang"),
            Map.entry("Boolean", "java.lang"),
            Map.entry("Byte", "java.lang"),
            Map.entry("Short", "java.lang"),
            Map.entry("Integer", "java.lang"),
            Map.entry("Long", "java.lang"),
            Map.entry("Float", "java.lang"),
            Map.entry("Double", "java.lang"),
            Map.entry("Character", "java.lang"),
            Map.entry("CharSequence", "java.lang"),
            Map.entry("StringBuilder", "java.lang"),
            Map.entry("StringBuffer", "java.lang"),
            Map.entry("Math", "java.lang"),
            Map.entry("System", "java.lang"),
            Map.entry("Number", "java.lang"),
            Map.entry("Runtime", "java.lang"),
            Map.entry("Process", "java.lang"),
            Map.entry("Throwable", "java.lang"),
            Map.entry("Exception", "java.lang"),
            Map.entry("RuntimeException", "java.lang"),
            Map.entry("IllegalAccessException", "java.lang"),
            Map.entry("Iterable", "java.lang"),
            Map.entry("Collection", "java.util"),
            Map.entry("Collections", "java.util"),
            Map.entry("List", "java.util"),
            Map.entry("ArrayList", "java.util"),
            Map.entry("LinkedList", "java.util"),
            Map.entry("Set", "java.util"),
            Map.entry("HashSet", "java.util"),
            Map.entry("LinkedHashSet", "java.util"),
            Map.entry("Map", "java.util"),
            Map.entry("Entry", "java.util.Map"),
            Map.entry("HashMap", "java.util"),
            Map.entry("LinkedHashMap", "java.util"),
            Map.entry("Iterator", "java.util"),
            Map.entry("Optional", "java.util"),
            Map.entry("Date", "java.util"),
            Map.entry("Calendar", "java.util"),
            Map.entry("UUID", "java.util"),
            Map.entry("BigDecimal", "java.math"),
            Map.entry("BigInteger", "java.math"),
            Map.entry("File", "java.io"),
            Map.entry("InputStream", "java.io"),
            Map.entry("OutputStream", "java.io"),
            Map.entry("FileInputStream", "java.io"),
            Map.entry("FileOutputStream", "java.io"),
            Map.entry("ObjectInputStream", "java.io"),
            Map.entry("ObjectOutputStream", "java.io"),
            Map.entry("Reader", "java.io"),
            Map.entry("Writer", "java.io"),
            Map.entry("ByteArrayOutputStream", "java.io"),
            Map.entry("BufferedReader", "java.io"),
            Map.entry("BufferedWriter", "java.io")
    );
    private static final Set<String> JAVA_PRIMITIVE_TYPES = Set.of(
            "boolean", "byte", "short", "int", "long", "float", "double", "char", "void"
    );
    private static final Set<String> LOMBOK_GETTER_ANNOTATIONS = Set.of("Data", "Getter");
    private static final Set<String> LOMBOK_SETTER_ANNOTATIONS = Set.of("Data", "Setter");
    private static final List<String> MYBATIS_PLUS_ISERVICE_METHODS = List.of(
            "getOne",
            "getById",
            "save",
            "saveOrUpdate",
            "update",
            "updateById",
            "updateBatchById",
            "remove",
            "removeBatchByIds",
            "count",
            "list"
    );
    private static final List<String> HASHMAP_INHERITED_METHODS = List.of(
            "putAll"
    );

    public static class ParseResult {
        public List<CodeSymbol> symbols = new ArrayList<>();
        public List<CodeRelationEntity> relations = new ArrayList<>();
        public List<Map<String, Object>> apiRoutes = new ArrayList<>();
        public List<Map<String, Object>> dbEntities = new ArrayList<>();
        public List<Map<String, Object>> controllers = new ArrayList<>();
        public List<Map<String, Object>> services = new ArrayList<>();
        public List<Map<String, Object>> repositories = new ArrayList<>();
        public List<Map<String, Object>> entities = new ArrayList<>();
        public List<Map<String, Object>> mappers = new ArrayList<>();
        public List<Map<String, Object>> configurations = new ArrayList<>();

        public int classCount = 0;
        public int methodCount = 0;
        public boolean parseSucceeded = false;
        public String parseErrorMessage = "";
    }

    public ParseResult parseFile(Path filePath, String relPath, Long scanTaskId) {
        ParseResult result = new ParseResult();
        try {
            CompilationUnit cu = parseCompilationUnit(filePath);
            result.parseSucceeded = true;
            String packageName = cu.getPackageDeclaration()
                    .map(pd -> pd.getNameAsString())
                    .orElse("");

            List<ClassOrInterfaceDeclaration> classes = cu.findAll(ClassOrInterfaceDeclaration.class);
            List<EnumDeclaration> enums = cu.findAll(EnumDeclaration.class);

            // 1. 解析 Class 和 Interface 声明
            for (ClassOrInterfaceDeclaration classDecl : classes) {
                String className = classDecl.getNameAsString();
                String kind = classDecl.isInterface() ? "INTERFACE" : "CLASS";
                int line = classDecl.getBegin().map(b -> b.line).orElse(0);
                String classSymbolId = packageName + "#" + className;

                result.classCount++;

                // 区分是否为核心组件
                boolean isController = classDecl.isAnnotationPresent("RestController") || classDecl.isAnnotationPresent("Controller");
                boolean isService = classDecl.isAnnotationPresent("Service");
                boolean isRepository = classDecl.isAnnotationPresent("Repository");
                boolean isMapper = classDecl.isAnnotationPresent("Mapper");
                boolean isEntity = classDecl.isAnnotationPresent("Entity") || classDecl.isAnnotationPresent("TableName");
                boolean isConfiguration = classDecl.isAnnotationPresent("Configuration") || classDecl.isAnnotationPresent("ConfigurationProperties");

                // 特殊处理扩展的 Repository 接口
                for (ClassOrInterfaceType extended : classDecl.getExtendedTypes()) {
                    String parentName = extended.getNameAsString();
                    if (parentName.equals("BaseMapper") || parentName.equals("CrudRepository") || parentName.equals("JpaRepository")) {
                        isRepository = true;
                        isMapper = true;
                    }
                }

                // 填充组件列表 (用于 fallback 分析)
                Map<String, Object> entry = new LinkedHashMap<>();
                entry.put("name", className);
                entry.put("file_path", relPath);
                if (isController) {
                    entry.put("type", "controller");
                    result.controllers.add(entry);
                } else if (isService) {
                    entry.put("type", "service");
                    result.services.add(entry);
                } else if (isRepository) {
                    entry.put("type", "repository");
                    result.repositories.add(entry);
                } else if (isEntity) {
                    entry.put("type", "entity");
                    result.entities.add(entry);
                } else if (isMapper) {
                    entry.put("type", "mapper");
                    result.mappers.add(entry);
                } else if (isConfiguration) {
                    entry.put("type", "configuration");
                    result.configurations.add(entry);
                }

                // 添加类符号
                result.symbols.add(CodeSymbol.builder()
                        .scanTaskId(scanTaskId)
                        .symbolId(classSymbolId)
                        .name(className)
                        .kind(kind)
                        .package_(packageName)
                        .filePath(relPath)
                        .lineNumber(line)
                        .build());

                Map<String, String> fieldTypeByName = new LinkedHashMap<>();

                // 继承与实现关系
                for (ClassOrInterfaceType extended : classDecl.getExtendedTypes()) {
                    String parentName = extended.getNameAsString();
                    String parentId = resolveClassId(parentName, cu, packageName);
                    result.relations.add(CodeRelationEntity.builder()
                            .scanTaskId(scanTaskId)
                            .sourceId(classSymbolId)
                            .targetId(parentId)
                            .relationType("EXTENDS")
                            .filePath(relPath)
                            .lineNumber(extended.getBegin().map(b -> b.line).orElse(0))
                            .build());
                }

                for (ClassOrInterfaceType implemented : classDecl.getImplementedTypes()) {
                    String interfaceName = implemented.getNameAsString();
                    String interfaceId = resolveClassId(interfaceName, cu, packageName);
                    result.relations.add(CodeRelationEntity.builder()
                            .scanTaskId(scanTaskId)
                            .sourceId(classSymbolId)
                            .targetId(interfaceId)
                            .relationType("IMPLEMENTS")
                            .filePath(relPath)
                            .lineNumber(implemented.getBegin().map(b -> b.line).orElse(0))
                            .build());
                }

                Set<String> methodNamesInClass = new LinkedHashSet<>();
                Set<String> emittedMethodSymbolIds = new LinkedHashSet<>();
                boolean classHasLombokGetter = hasAnyAnnotation(classDecl.getAnnotations(), LOMBOK_GETTER_ANNOTATIONS);
                boolean classHasLombokSetter = hasAnyAnnotation(classDecl.getAnnotations(), LOMBOK_SETTER_ANNOTATIONS);

                // 2. 解析方法（Method）
                for (MethodDeclaration method : classDecl.getMethods()) {
                    result.methodCount++;
                    String methodName = method.getNameAsString();
                    methodNamesInClass.add(methodName);
                    String returnType = method.getType().asString();
                    int methodLine = method.getBegin().map(b -> b.line).orElse(0);
                    int endLine = method.getEnd().map(e -> e.line).orElse(0);
                    String methodSymbolId = methodSymbolId(packageName, className, methodName);
                    if (!emittedMethodSymbolIds.add(methodSymbolId)) {
                        continue;
                    }

                    result.symbols.add(CodeSymbol.builder()
                            .scanTaskId(scanTaskId)
                            .symbolId(methodSymbolId)
                            .name(methodName)
                            .kind("METHOD")
                            .package_(packageName)
                            .filePath(relPath)
                            .lineNumber(methodLine)
                            .endLine(endLine)
                            .returnType(returnType)
                            .parentClass(className)
                            .build());
                }
                emitInheritedFrameworkMethodSymbols(result, scanTaskId, cu, packageName, className, classDecl,
                        relPath, emittedMethodSymbolIds);
                emitInheritedJdkMethodSymbols(result, scanTaskId, cu, packageName, className, classDecl,
                        relPath, emittedMethodSymbolIds);

                // 3. 解析字段（Field）与 Autowire 注入依赖
                for (FieldDeclaration field : classDecl.getFields()) {
                    String type = field.getElementType().asString();
                    boolean isAutowired = field.isAnnotationPresent("Autowired")
                            || field.isAnnotationPresent("Resource")
                            || field.isAnnotationPresent("Inject");

                    for (VariableDeclarator var : field.getVariables()) {
                        String fieldName = var.getNameAsString();
                        int fieldLine = field.getBegin().map(b -> b.line).orElse(0);
                        fieldTypeByName.put(fieldName, normalizeJavaType(type));

                        result.symbols.add(CodeSymbol.builder()
                                .scanTaskId(scanTaskId)
                                .symbolId(packageName + "." + className + "#" + fieldName)
                                .name(fieldName)
                                .kind("FIELD")
                                .package_(packageName)
                                .filePath(relPath)
                                .lineNumber(fieldLine)
                                .returnType(type)
                                .parentClass(className)
                                .build());

                        boolean fieldHasGetter = hasAnyAnnotation(field.getAnnotations(), LOMBOK_GETTER_ANNOTATIONS);
                        boolean fieldHasSetter = hasAnyAnnotation(field.getAnnotations(), LOMBOK_SETTER_ANNOTATIONS);
                        boolean canEmitLombokAccessor = !field.isStatic();
                        if (canEmitLombokAccessor && (classHasLombokGetter || fieldHasGetter)) {
                            emitLombokAccessorSymbol(result, scanTaskId, packageName, className,
                                    getterNameForField(fieldName, type), type, relPath, fieldLine, emittedMethodSymbolIds);
                            if (isPrimitiveBoolean(type)) {
                                emitLombokAccessorSymbol(result, scanTaskId, packageName, className,
                                        "get" + accessorSuffix(fieldName), type, relPath, fieldLine, emittedMethodSymbolIds);
                            }
                        }
                        if (canEmitLombokAccessor && (classHasLombokSetter || fieldHasSetter) && !field.isFinal()) {
                            emitLombokAccessorSymbol(result, scanTaskId, packageName, className,
                                    "set" + accessorSuffix(fieldName), "void", relPath, fieldLine, emittedMethodSymbolIds);
                        }

                        if (isAutowired) {
                            String targetClassId = resolveClassId(type, cu, packageName);
                            result.relations.add(CodeRelationEntity.builder()
                                    .scanTaskId(scanTaskId)
                                    .sourceId(classSymbolId)
                                    .targetId(targetClassId)
                                    .relationType("DEPENDS_ON")
                                    .filePath(relPath)
                                    .lineNumber(fieldLine)
                                    .build());
                        }
                    }
                }

                // 4. 解析构造器注入依赖
                for (ConstructorDeclaration ctor : classDecl.getConstructors()) {
                    int ctorLine = ctor.getBegin().map(b -> b.line).orElse(0);
                    for (Parameter param : ctor.getParameters()) {
                        String paramType = param.getType().asString();
                        fieldTypeByName.putIfAbsent(param.getNameAsString(), normalizeJavaType(paramType));
                        String targetClassId = resolveClassId(paramType, cu, packageName);
                        if (targetClassId == null || targetClassId.isBlank()) {
                            continue;
                        }
                        result.relations.add(CodeRelationEntity.builder()
                                .scanTaskId(scanTaskId)
                                .sourceId(classSymbolId)
                                .targetId(targetClassId)
                                .relationType("DEPENDS_ON")
                                .filePath(relPath)
                                .lineNumber(ctorLine)
                                .build());
                    }
                }

                // 5. 解析明确的方法调用关系：同类 helper、field.method()、local.method()、ImportedClass.staticMethod()
                Set<String> callRelationKeys = new LinkedHashSet<>();
                for (MethodDeclaration method : classDecl.getMethods()) {
                    String sourceMethodId = methodSymbolId(packageName, className, method.getNameAsString());
                    Map<String, String> visibleTypeByName = new LinkedHashMap<>(fieldTypeByName);
                    for (Parameter param : method.getParameters()) {
                        visibleTypeByName.put(param.getNameAsString(), normalizeJavaType(param.getType().asString()));
                    }
                    for (VariableDeclarator var : method.findAll(VariableDeclarator.class)) {
                        visibleTypeByName.put(var.getNameAsString(), normalizeJavaType(var.getType().asString()));
                    }
                    for (CatchClause catchClause : method.findAll(CatchClause.class)) {
                        Parameter catchParameter = catchClause.getParameter();
                        visibleTypeByName.put(catchParameter.getNameAsString(), normalizeJavaType(catchParameter.getType().asString()));
                    }
                    for (InstanceOfExpr instanceOfExpr : method.findAll(InstanceOfExpr.class)) {
                        instanceOfExpr.getPattern().ifPresent(pattern -> addPatternVariableTypes(visibleTypeByName, pattern));
                    }
                    for (MethodCallExpr call : method.findAll(MethodCallExpr.class)) {
                        Optional<Expression> scope = call.getScope();
                        if (scope.isEmpty() || "this".equals(scope.get().toString().trim())) {
                            if (!methodNamesInClass.contains(call.getNameAsString())) {
                                continue;
                            }
                            String targetMethodId = methodSymbolId(packageName, className, call.getNameAsString());
                            String key = sourceMethodId + "->" + targetMethodId;
                            if (!callRelationKeys.add(key)) {
                                continue;
                            }
                            result.relations.add(CodeRelationEntity.builder()
                                    .scanTaskId(scanTaskId)
                                    .sourceId(sourceMethodId)
                                    .targetId(targetMethodId)
                                    .relationType("CALLS")
                                    .filePath(relPath)
                                    .lineNumber(call.getBegin().map(b -> b.line).orElse(0))
                                    .build());
                            continue;
                        }
                        String scopeName = normalizeCallScope(scope.get().toString());
                        if (scopeName == null || scopeName.isBlank()) {
                            continue;
                        }
                        String targetType = visibleTypeByName.get(scopeName);
                        String targetClassId;
                        if (targetType == null || targetType.isBlank()) {
                            targetClassId = resolveExplicitImportedProjectClassId(scopeName, cu, packageName);
                        } else {
                            targetClassId = resolveClassId(targetType, cu, packageName);
                        }
                        if (targetClassId == null || targetClassId.isBlank()) {
                            continue;
                        }
                        String targetMethodId = classIdToMethodSymbolId(targetClassId, call.getNameAsString());
                        String key = sourceMethodId + "->" + targetMethodId;
                        if (!callRelationKeys.add(key)) {
                            continue;
                        }
                        result.relations.add(CodeRelationEntity.builder()
                                .scanTaskId(scanTaskId)
                                .sourceId(sourceMethodId)
                                .targetId(targetMethodId)
                                .relationType("CALLS")
                                .filePath(relPath)
                                .lineNumber(call.getBegin().map(b -> b.line).orElse(0))
                                .build());
                    }
                }

                // 6. 提取 Spring Controller API 路由
                if (isController) {
                    String classPrefix = "";
                    if (classDecl.isAnnotationPresent("RequestMapping")) {
                        AnnotationExpr ann = classDecl.getAnnotationByName("RequestMapping").get();
                        classPrefix = extractPathFromAnnotation(ann);
                    }

                    for (MethodDeclaration method : classDecl.getMethods()) {
                        String httpMethod = null;
                        String methodPath = "";

                        if (method.isAnnotationPresent("RequestMapping")) {
                            AnnotationExpr ann = method.getAnnotationByName("RequestMapping").get();
                            httpMethod = extractHttpMethodFromRequestMapping(ann);
                            methodPath = extractPathFromAnnotation(ann);
                        } else if (method.isAnnotationPresent("GetMapping")) {
                            httpMethod = "GET";
                            methodPath = extractPathFromAnnotation(method.getAnnotationByName("GetMapping").get());
                        } else if (method.isAnnotationPresent("PostMapping")) {
                            httpMethod = "POST";
                            methodPath = extractPathFromAnnotation(method.getAnnotationByName("PostMapping").get());
                        } else if (method.isAnnotationPresent("PutMapping")) {
                            httpMethod = "PUT";
                            methodPath = extractPathFromAnnotation(method.getAnnotationByName("PutMapping").get());
                        } else if (method.isAnnotationPresent("DeleteMapping")) {
                            httpMethod = "DELETE";
                            methodPath = extractPathFromAnnotation(method.getAnnotationByName("DeleteMapping").get());
                        } else if (method.isAnnotationPresent("PatchMapping")) {
                            httpMethod = "PATCH";
                            methodPath = extractPathFromAnnotation(method.getAnnotationByName("PatchMapping").get());
                        }

                        if (httpMethod != null) {
                            String fullPath = combinePaths(classPrefix, methodPath);
                            Map<String, Object> route = new LinkedHashMap<>();
                            route.put("method", httpMethod);
                            route.put("path", fullPath);
                            route.put("handler_class", className);
                            route.put("handler_method", method.getNameAsString());
                            route.put("line_number", method.getBegin().map(b -> b.line).orElse(0));
                            result.apiRoutes.add(route);
                        }
                    }
                }

                // 7. 提取数据库实体（@TableName / @Table / @Entity）
                if (isEntity) {
                    String tableName = null;
                    if (classDecl.isAnnotationPresent("TableName")) {
                        AnnotationExpr ann = classDecl.getAnnotationByName("TableName").get();
                        tableName = extractTableNameFromAnnotation(ann);
                    } else if (classDecl.isAnnotationPresent("Table")) {
                        AnnotationExpr ann = classDecl.getAnnotationByName("Table").get();
                        tableName = extractTableNameFromAnnotation(ann);
                    } else if (classDecl.isAnnotationPresent("Entity")) {
                        AnnotationExpr ann = classDecl.getAnnotationByName("Entity").get();
                        tableName = extractTableNameFromAnnotation(ann);
                    }

                    Map<String, Object> dbEntity = new LinkedHashMap<>();
                    dbEntity.put("class_name", className);
                    dbEntity.put("table_name", tableName != null ? tableName : className.toLowerCase());
                    dbEntity.put("file_path", relPath);
                    dbEntity.put("field_count", classDecl.getFields().size());
                    result.dbEntities.add(dbEntity);
                }
            }

            // 解析 Annotation 声明及其 member 方法，例如 @SysLog.value()
            for (AnnotationDeclaration annotationDecl : cu.findAll(AnnotationDeclaration.class)) {
                String annotationName = annotationDecl.getNameAsString();
                int line = annotationDecl.getBegin().map(b -> b.line).orElse(0);
                String annotationSymbolId = packageName + "#" + annotationName;

                result.symbols.add(CodeSymbol.builder()
                        .scanTaskId(scanTaskId)
                        .symbolId(annotationSymbolId)
                        .name(annotationName)
                        .kind("ANNOTATION")
                        .package_(packageName)
                        .filePath(relPath)
                        .lineNumber(line)
                        .build());

                Set<String> emittedAnnotationMembers = new LinkedHashSet<>();
                for (AnnotationMemberDeclaration member : annotationDecl.findAll(AnnotationMemberDeclaration.class)) {
                    String methodSymbolId = methodSymbolId(packageName, annotationName, member.getNameAsString());
                    if (!emittedAnnotationMembers.add(methodSymbolId)) {
                        continue;
                    }
                    int memberLine = member.getBegin().map(b -> b.line).orElse(line);
                    result.symbols.add(CodeSymbol.builder()
                            .scanTaskId(scanTaskId)
                            .symbolId(methodSymbolId)
                            .name(member.getNameAsString())
                            .kind("METHOD")
                            .package_(packageName)
                            .filePath(relPath)
                            .lineNumber(memberLine)
                            .endLine(member.getEnd().map(e -> e.line).orElse(memberLine))
                            .returnType(member.getType().asString())
                            .parentClass(annotationName)
                            .build());
                }
            }

            // 解析 Enum 声明
            for (EnumDeclaration enumDecl : enums) {
                String enumName = enumDecl.getNameAsString();
                int line = enumDecl.getBegin().map(b -> b.line).orElse(0);

                result.symbols.add(CodeSymbol.builder()
                        .scanTaskId(scanTaskId)
                        .symbolId(packageName + "#" + enumName)
                        .name(enumName)
                        .kind("ENUM")
                        .package_(packageName)
                        .filePath(relPath)
                        .lineNumber(line)
                        .build());
            }

        } catch (Exception e) {
            result.parseSucceeded = false;
            result.parseErrorMessage = e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage();
            log.error("AST 解析 Java 文件失败: filePath={}, error={}", filePath, e.getMessage(), e);
        }
        return result;
    }

    private CompilationUnit parseCompilationUnit(Path filePath) throws IOException {
        com.github.javaparser.ParseResult<CompilationUnit> parseResult =
                new JavaParser(JAVA_PARSER_CONFIGURATION).parse(filePath);
        if (!parseResult.isSuccessful()) {
            throw new IllegalStateException("JavaParser failed: " + parseResult.getProblems());
        }
        return parseResult.getResult().orElseThrow(() ->
                new IllegalStateException("JavaParser failed: " + parseResult.getProblems()));
    }

    private void addPatternVariableTypes(Map<String, String> visibleTypeByName, PatternExpr pattern) {
        if (pattern.isTypePatternExpr()) {
            TypePatternExpr typePattern = pattern.asTypePatternExpr();
            visibleTypeByName.put(typePattern.getNameAsString(), normalizeJavaType(typePattern.getType().asString()));
            return;
        }
        if (pattern.isRecordPatternExpr()) {
            RecordPatternExpr recordPattern = pattern.asRecordPatternExpr();
            for (PatternExpr nestedPattern : recordPattern.getPatternList()) {
                addPatternVariableTypes(visibleTypeByName, nestedPattern);
            }
        }
    }

    private void emitInheritedJdkMethodSymbols(
            ParseResult result,
            Long scanTaskId,
            CompilationUnit cu,
            String packageName,
            String className,
            ClassOrInterfaceDeclaration classDecl,
            String filePath,
            Set<String> emittedMethodSymbolIds
    ) {
        if (classDecl.isInterface()) {
            return;
        }
        for (ClassOrInterfaceType extended : classDecl.getExtendedTypes()) {
            String parentId = resolveClassId(extended.asString(), cu, packageName);
            if (!"java.util#HashMap".equals(parentId) && !"java.util#LinkedHashMap".equals(parentId)) {
                continue;
            }
            int lineNumber = extended.getBegin().map(b -> b.line).orElse(classDecl.getBegin().map(b -> b.line).orElse(0));
            for (String methodName : HASHMAP_INHERITED_METHODS) {
                emitFrameworkMethodSymbol(result, scanTaskId, packageName, className,
                        methodName, filePath, lineNumber, emittedMethodSymbolIds, "INHERITED_JDK_METHOD");
            }
            return;
        }
    }

    private void emitInheritedFrameworkMethodSymbols(
            ParseResult result,
            Long scanTaskId,
            CompilationUnit cu,
            String packageName,
            String className,
            ClassOrInterfaceDeclaration classDecl,
            String filePath,
            Set<String> emittedMethodSymbolIds
    ) {
        if (!classDecl.isInterface()) {
            return;
        }
        for (ClassOrInterfaceType extended : classDecl.getExtendedTypes()) {
            if (!isMyBatisPlusIServiceExtension(extended, cu)) {
                continue;
            }
            int lineNumber = extended.getBegin().map(b -> b.line).orElse(classDecl.getBegin().map(b -> b.line).orElse(0));
            for (String methodName : MYBATIS_PLUS_ISERVICE_METHODS) {
                emitFrameworkMethodSymbol(result, scanTaskId, packageName, className,
                        methodName, filePath, lineNumber, emittedMethodSymbolIds, "INHERITED_FRAMEWORK_METHOD");
            }
            return;
        }
    }

    private boolean isMyBatisPlusIServiceExtension(ClassOrInterfaceType extended, CompilationUnit cu) {
        String extendedType = extended.asString();
        if (extendedType.equals("com.baomidou.mybatisplus.extension.service.IService")
                || extendedType.startsWith("com.baomidou.mybatisplus.extension.service.IService<")) {
            return true;
        }
        String simpleName = normalizeJavaType(extendedType);
        if (!"IService".equals(simpleName)) {
            return false;
        }
        for (ImportDeclaration imp : cu.getImports()) {
            String importName = imp.getNameAsString();
            if (imp.isStatic()) {
                continue;
            }
            if (!imp.isAsterisk() && "com.baomidou.mybatisplus.extension.service.IService".equals(importName)) {
                return true;
            }
            if (imp.isAsterisk() && "com.baomidou.mybatisplus.extension.service".equals(importName)) {
                return true;
            }
        }
        return false;
    }

    private void emitFrameworkMethodSymbol(
            ParseResult result,
            Long scanTaskId,
            String packageName,
            String className,
            String methodName,
            String filePath,
            int lineNumber,
            Set<String> emittedMethodSymbolIds,
            String returnType
    ) {
        String methodSymbolId = methodSymbolId(packageName, className, methodName);
        if (!emittedMethodSymbolIds.add(methodSymbolId)) {
            return;
        }
        result.symbols.add(CodeSymbol.builder()
                .scanTaskId(scanTaskId)
                .symbolId(methodSymbolId)
                .name(methodName)
                .kind("METHOD")
                .package_(packageName)
                .filePath(filePath)
                .lineNumber(lineNumber)
                .endLine(lineNumber)
                .returnType(returnType)
                .parentClass(className)
                .build());
    }

    private void emitLombokAccessorSymbol(
            ParseResult result,
            Long scanTaskId,
            String packageName,
            String className,
            String methodName,
            String returnType,
            String filePath,
            int lineNumber,
            Set<String> emittedMethodSymbolIds
    ) {
        String methodSymbolId = methodSymbolId(packageName, className, methodName);
        if (!emittedMethodSymbolIds.add(methodSymbolId)) {
            return;
        }
        result.symbols.add(CodeSymbol.builder()
                .scanTaskId(scanTaskId)
                .symbolId(methodSymbolId)
                .name(methodName)
                .kind("METHOD")
                .package_(packageName)
                .filePath(filePath)
                .lineNumber(lineNumber)
                .endLine(lineNumber)
                .returnType(returnType)
                .parentClass(className)
                .build());
    }

    private boolean hasAnyAnnotation(Collection<AnnotationExpr> annotations, Set<String> names) {
        for (AnnotationExpr annotation : annotations) {
            String name = annotation.getNameAsString();
            for (String candidate : names) {
                if (name.equals(candidate) || name.endsWith("." + candidate)) {
                    return true;
                }
            }
        }
        return false;
    }

    private String getterNameForField(String fieldName, String type) {
        if (isPrimitiveBoolean(type)) {
            return "is" + accessorSuffix(fieldName);
        }
        return "get" + accessorSuffix(fieldName);
    }

    private boolean isPrimitiveBoolean(String type) {
        return "boolean".equals(normalizeJavaType(type));
    }

    private String accessorSuffix(String fieldName) {
        if (fieldName == null || fieldName.isBlank()) {
            return "";
        }
        if (fieldName.length() > 1
                && Character.isUpperCase(fieldName.charAt(0))
                && Character.isUpperCase(fieldName.charAt(1))) {
            return fieldName;
        }
        return Character.toUpperCase(fieldName.charAt(0)) + fieldName.substring(1);
    }

    private String resolveClassId(String className, CompilationUnit cu, String packageName) {
        className = normalizeJavaType(className);
        if (className.isBlank() || JAVA_PRIMITIVE_TYPES.contains(className)) {
            return null;
        }
        for (ImportDeclaration imp : cu.getImports()) {
            if (imp.isStatic() || imp.isAsterisk()) {
                continue;
            }
            String importName = imp.getNameAsString();
            if (importName.endsWith("." + className)) {
                int lastDot = importName.lastIndexOf('.');
                if (lastDot != -1) {
                    String pkg = importName.substring(0, lastDot);
                    return pkg + "#" + className;
                }
            }
        }
        String commonJdkPackage = COMMON_JDK_TYPE_PACKAGES.get(className);
        if (commonJdkPackage != null) {
            return commonJdkPackage + "#" + className;
        }
        List<String> wildcardCandidates = new ArrayList<>();
        for (ImportDeclaration imp : cu.getImports()) {
            if (imp.isStatic() || !imp.isAsterisk()) {
                continue;
            }
            String importName = imp.getNameAsString();
            if (importName == null || importName.isBlank()) {
                continue;
            }
            if (wildcardImportCanResolve(importName, className)) {
                wildcardCandidates.add(importName + "#" + className);
            }
        }
        if (!wildcardCandidates.isEmpty()) {
            return chooseWildcardImportCandidate(wildcardCandidates, className, packageName);
        }
        return packageName + "#" + className;
    }

    private boolean wildcardImportCanResolve(String importName, String className) {
        if (importName.equals("jakarta.websocket") || importName.equals("javax.websocket")) {
            return isLikelyJavaClassName(className);
        }
        if (importName.startsWith("java.") || importName.startsWith("javax.") || importName.startsWith("jakarta.")) {
            return importName.equals(COMMON_JDK_TYPE_PACKAGES.get(className));
        }
        return isLikelyJavaClassName(className);
    }

    private String chooseWildcardImportCandidate(List<String> candidates, String className, String packageName) {
        if (candidates.size() == 1) {
            return candidates.get(0);
        }
        String best = candidates.get(0);
        int bestScore = wildcardImportCandidateScore(best, className, packageName);
        for (int i = 1; i < candidates.size(); i++) {
            String candidate = candidates.get(i);
            int score = wildcardImportCandidateScore(candidate, className, packageName);
            if (score > bestScore) {
                best = candidate;
                bestScore = score;
            }
        }
        return best;
    }

    private int wildcardImportCandidateScore(String candidate, String className, String packageName) {
        String packagePart = candidate;
        int separator = candidate.indexOf('#');
        if (separator >= 0) {
            packagePart = candidate.substring(0, separator);
        }
        String packageSegment = packagePart.substring(packagePart.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
        String lowerClassName = className.toLowerCase(Locale.ROOT);
        int score = 0;
        if (lowerClassName.endsWith(packageSegment)) {
            score += 10;
        }
        if ("service".equals(packageSegment) && lowerClassName.endsWith("service")) {
            score += 20;
        } else if (("dao".equals(packageSegment) || "mapper".equals(packageSegment))
                && (lowerClassName.endsWith("dao") || lowerClassName.endsWith("mapper"))) {
            score += 20;
        } else if ("controller".equals(packageSegment) && lowerClassName.endsWith("controller")) {
            score += 20;
        } else if ("annotation".equals(packageSegment) && lowerClassName.endsWith("log")) {
            score += 5;
        }
        if (sharesPackageRoot(packagePart, packageName)) {
            score += 1;
        }
        return score;
    }

    private String resolveExplicitImportedProjectClassId(String className, CompilationUnit cu, String packageName) {
        className = normalizeJavaType(className);
        if (!isLikelyJavaClassName(className)) {
            return null;
        }
        for (ImportDeclaration imp : cu.getImports()) {
            if (imp.isStatic() || imp.isAsterisk()) {
                continue;
            }
            String importName = imp.getNameAsString();
            if (!importName.endsWith("." + className) || !sharesPackageRoot(importName, packageName)) {
                continue;
            }
            int lastDot = importName.lastIndexOf('.');
            if (lastDot != -1) {
                String pkg = importName.substring(0, lastDot);
                return pkg + "#" + className;
            }
        }
        return null;
    }

    private boolean isLikelyJavaClassName(String name) {
        return name != null
                && !name.isBlank()
                && Character.isUpperCase(name.charAt(0))
                && name.chars().allMatch(ch -> Character.isLetterOrDigit(ch) || ch == '_' || ch == '$');
    }

    private boolean sharesPackageRoot(String importName, String packageName) {
        String[] importParts = importName == null ? new String[0] : importName.split("\\.");
        String[] packageParts = packageName == null ? new String[0] : packageName.split("\\.");
        if (importParts.length < 2 || packageParts.length < 2) {
            return false;
        }
        return importParts[0].equals(packageParts[0]) && importParts[1].equals(packageParts[1]);
    }

    private String methodSymbolId(String packageName, String className, String methodName) {
        return packageName + "." + className + "#" + methodName + "()";
    }

    private String classIdToMethodSymbolId(String classId, String methodName) {
        if (classId == null || classId.isBlank()) {
            return "#" + methodName + "()";
        }
        int separator = classId.lastIndexOf('#');
        if (separator < 0) {
            return classId + "#" + methodName + "()";
        }
        return classId.substring(0, separator) + "." + classId.substring(separator + 1) + "#" + methodName + "()";
    }

    private String normalizeJavaType(String type) {
        if (type == null) {
            return "";
        }
        String normalized = type.trim();
        while (normalized.endsWith("[]")) {
            normalized = normalized.substring(0, normalized.length() - 2).trim();
        }
        int genericStart = normalized.indexOf('<');
        if (genericStart >= 0) {
            normalized = normalized.substring(0, genericStart).trim();
        }
        int packageDot = normalized.lastIndexOf('.');
        if (packageDot >= 0) {
            normalized = normalized.substring(packageDot + 1);
        }
        return normalized;
    }

    private String normalizeCallScope(String scope) {
        if (scope == null) {
            return "";
        }
        String normalized = scope.trim();
        if (normalized.startsWith("this.")) {
            normalized = normalized.substring("this.".length());
        }
        int dot = normalized.lastIndexOf('.');
        if (dot >= 0) {
            normalized = normalized.substring(dot + 1);
        }
        return normalized;
    }

    private String extractPathFromAnnotation(AnnotationExpr ann) {
        if (ann.isSingleMemberAnnotationExpr()) {
            Expression memberValue = ann.asSingleMemberAnnotationExpr().getMemberValue();
            return extractStringValue(memberValue);
        } else if (ann.isNormalAnnotationExpr()) {
            for (MemberValuePair pair : ann.asNormalAnnotationExpr().getPairs()) {
                String name = pair.getNameAsString();
                if (name.equals("value") || name.equals("path")) {
                    return extractStringValue(pair.getValue());
                }
            }
        }
        return "";
    }

    private String extractTableNameFromAnnotation(AnnotationExpr ann) {
        if (ann.isSingleMemberAnnotationExpr()) {
            return extractStringValue(ann.asSingleMemberAnnotationExpr().getMemberValue());
        } else if (ann.isNormalAnnotationExpr()) {
            for (MemberValuePair pair : ann.asNormalAnnotationExpr().getPairs()) {
                String name = pair.getNameAsString();
                if (name.equals("name") || name.equals("value")) {
                    return extractStringValue(pair.getValue());
                }
            }
        }
        return null;
    }

    private String extractStringValue(Expression expr) {
        if (expr.isStringLiteralExpr()) {
            return expr.asStringLiteralExpr().getValue();
        }
        if (expr.isArrayInitializerExpr()) {
            List<Expression> values = expr.asArrayInitializerExpr().getValues();
            if (!values.isEmpty()) {
                return extractStringValue(values.get(0));
            }
        }
        return expr.toString().replace("\"", "").trim();
    }

    private String extractHttpMethodFromRequestMapping(AnnotationExpr ann) {
        if (ann.isNormalAnnotationExpr()) {
            for (MemberValuePair pair : ann.asNormalAnnotationExpr().getPairs()) {
                if (pair.getNameAsString().equals("method")) {
                    String val = pair.getValue().toString();
                    int lastDot = val.lastIndexOf('.');
                    if (lastDot != -1) {
                        return val.substring(lastDot + 1).toUpperCase();
                    }
                    return val.toUpperCase();
                }
            }
        }
        return "ALL";
    }

    private String combinePaths(String classPrefix, String methodPath) {
        if (classPrefix.isEmpty() && methodPath.isEmpty()) return "";
        if (methodPath.isEmpty()) return classPrefix;
        String full;
        if (methodPath.startsWith("/")) {
            full = classPrefix + methodPath;
        } else {
            full = classPrefix.isEmpty() ? "/" + methodPath : classPrefix + "/" + methodPath;
        }
        if (!full.startsWith("/")) full = "/" + full;
        return full;
    }
}
