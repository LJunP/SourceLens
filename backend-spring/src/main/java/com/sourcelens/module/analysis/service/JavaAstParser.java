package com.sourcelens.module.analysis.service;

import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.ImportDeclaration;
import com.github.javaparser.ast.body.*;
import com.github.javaparser.ast.expr.AnnotationExpr;
import com.github.javaparser.ast.expr.Expression;
import com.github.javaparser.ast.expr.MemberValuePair;
import com.github.javaparser.ast.type.ClassOrInterfaceType;
import com.sourcelens.module.analysis.entity.CodeRelationEntity;
import com.sourcelens.module.analysis.entity.CodeSymbol;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.nio.file.Path;
import java.util.*;

@Slf4j
@Service
public class JavaAstParser {

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
    }

    public ParseResult parseFile(Path filePath, String relPath, Long scanTaskId) {
        ParseResult result = new ParseResult();
        try {
            CompilationUnit cu = StaticJavaParser.parse(filePath);
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

                // 2. 解析方法（Method）
                for (MethodDeclaration method : classDecl.getMethods()) {
                    result.methodCount++;
                    String methodName = method.getNameAsString();
                    String returnType = method.getType().asString();
                    int methodLine = method.getBegin().map(b -> b.line).orElse(0);
                    int endLine = method.getEnd().map(e -> e.line).orElse(0);

                    result.symbols.add(CodeSymbol.builder()
                            .scanTaskId(scanTaskId)
                            .symbolId(packageName + "." + className + "#" + methodName + "()")
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

                // 3. 解析字段（Field）与 Autowire 注入依赖
                for (FieldDeclaration field : classDecl.getFields()) {
                    String type = field.getElementType().asString();
                    boolean isAutowired = field.isAnnotationPresent("Autowired")
                            || field.isAnnotationPresent("Resource")
                            || field.isAnnotationPresent("Inject");

                    for (VariableDeclarator var : field.getVariables()) {
                        String fieldName = var.getNameAsString();
                        int fieldLine = field.getBegin().map(b -> b.line).orElse(0);

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
                        String targetClassId = resolveClassId(paramType, cu, packageName);
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

                // 5. 提取 Spring Controller API 路由
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

                // 6. 提取数据库实体（@TableName / @Table / @Entity）
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
            log.error("AST 解析 Java 文件失败: filePath={}, error={}", filePath, e.getMessage(), e);
        }
        return result;
    }

    private String resolveClassId(String className, CompilationUnit cu, String packageName) {
        for (ImportDeclaration imp : cu.getImports()) {
            String importName = imp.getNameAsString();
            if (importName.endsWith("." + className)) {
                int lastDot = importName.lastIndexOf('.');
                if (lastDot != -1) {
                    String pkg = importName.substring(0, lastDot);
                    return pkg + "#" + className;
                }
            }
        }
        return packageName + "#" + className;
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
