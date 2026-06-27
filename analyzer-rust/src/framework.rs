use regex::Regex;
use std::path::Path;
use walkdir::WalkDir;

use crate::models::{
    ApiRoute, ClassInfo, CodeQuality, DbEntity, FrameworkInfo, ProjectDirectories,
    ProjectStructure, RiskItem,
};

// ============================================================
// 跳过目录
// ============================================================

fn is_skipped_dir(name: &str) -> bool {
    matches!(
        name,
        ".git"
            | "node_modules"
            | "target"
            | "build"
            | "dist"
            | ".idea"
            | ".vscode"
            | "__pycache__"
            | "vendor"
            | ".gradle"
            | ".mvn"
    )
}

fn walk_non_skipped(repo_path: &Path) -> Vec<walkdir::DirEntry> {
    WalkDir::new(repo_path)
        .into_iter()
        .filter_entry(|e| !is_skipped_dir(e.file_name().to_string_lossy().as_ref()))
        .filter_map(|e| e.ok())
        .collect()
}

fn read_file_str(path: &Path) -> Option<String> {
    std::fs::read_to_string(path).ok()
}

fn rel_path(path: &Path, repo: &Path) -> String {
    path.strip_prefix(repo)
        .unwrap_or(path)
        .to_string_lossy()
        .to_string()
}

fn file_stem_str(path: &Path) -> String {
    path.file_stem()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default()
}

// ============================================================
// 框架检测（多语言）
// ============================================================

/// 检测项目使用的框架，基于主语言选择检测策略
pub fn detect_framework(repo_path: &Path, primary_language: &str) -> Option<FrameworkInfo> {
    match primary_language {
        "Java" => detect_java_framework(repo_path),
        "Go" => detect_go_framework(repo_path),
        "Python" => detect_python_framework(repo_path),
        "TypeScript" | "JavaScript" => detect_tsjs_framework(repo_path),
        "Rust" => detect_rust_framework(repo_path),
        _ => None,
    }
}

// --- Java 框架检测 ---

fn detect_java_framework(repo_path: &Path) -> Option<FrameworkInfo> {
    let mut evidence = Vec::new();
    let mut found = false;

    // 检查 pom.xml
    for entry in walk_non_skipped(repo_path) {
        if entry.file_type().is_file() && entry.file_name() == "pom.xml" {
            if let Some(content) = read_file_str(entry.path()) {
                if content.contains("spring-boot") {
                    evidence.push(format!(
                        "{} contains spring-boot-starter",
                        rel_path(entry.path(), repo_path)
                    ));
                    found = true;
                    if let Some(ver) = extract_spring_boot_version(&content) {
                        return Some(FrameworkInfo {
                            name: "Spring Boot".to_string(),
                            version: Some(ver),
                            evidence,
                        });
                    }
                }
            }
        }
    }

    // 检查 build.gradle
    for entry in walk_non_skipped(repo_path) {
        let name = entry.file_name().to_string_lossy();
        if name == "build.gradle" || name == "build.gradle.kts" {
            if let Some(content) = read_file_str(entry.path()) {
                if content.contains("spring-boot") || content.contains("org.springframework.boot") {
                    evidence.push(format!(
                        "{} contains spring-boot",
                        rel_path(entry.path(), repo_path)
                    ));
                    found = true;
                }
            }
        }
    }

    // 检查 application.yml
    for entry in walk_non_skipped(repo_path) {
        if entry.file_type().is_file() {
            let name = entry.file_name().to_string_lossy();
            if name == "application.yml"
                || name == "application.yaml"
                || name == "application.properties"
            {
                let rp = rel_path(entry.path(), repo_path);
                if rp.contains("resources") || rp.contains("config") {
                    evidence.push(format!("Found {}", rp));
                    found = true;
                }
            }
        }
    }

    // 检查 @SpringBootApplication
    for entry in walk_non_skipped(repo_path) {
        if entry.path().extension().and_then(|e| e.to_str()) == Some("java") {
            if let Some(content) = read_file_str(entry.path()) {
                if content.contains("@SpringBootApplication") {
                    evidence.push("Found @SpringBootApplication entry class".to_string());
                    found = true;
                    break;
                }
            }
        }
    }

    if found {
        Some(FrameworkInfo {
            name: "Spring Boot".to_string(),
            version: None,
            evidence,
        })
    } else {
        None
    }
}

fn extract_spring_boot_version(content: &str) -> Option<String> {
    let re = Regex::new(r"<spring-boot\.version>([^<]+)</spring-boot\.version>").ok()?;
    if let Some(caps) = re.captures(content) {
        return Some(caps[1].to_string());
    }
    let re2 = Regex::new(
        r"<artifactId>spring-boot-starter-parent</artifactId>\s*<version>([^<]+)</version>",
    )
    .ok()?;
    if let Some(caps) = re2.captures(content) {
        return Some(caps[1].to_string());
    }
    None
}

// --- Go 框架检测 ---

fn detect_go_framework(repo_path: &Path) -> Option<FrameworkInfo> {
    let mut evidence = Vec::new();
    let mut found = false;

    for entry in walk_non_skipped(repo_path) {
        if entry.file_type().is_file() && entry.file_name() == "go.mod" {
            if let Some(content) = read_file_str(entry.path()) {
                // Gin
                if content.contains("github.com/gin-gonic/gin") {
                    evidence.push("go.mod: gin-gonic/gin".to_string());
                    found = true;
                }
                // gRPC
                if content.contains("google.golang.org/grpc") {
                    evidence.push("go.mod: google.golang.org/grpc".to_string());
                    found = true;
                }
                // Fiber
                if content.contains("gofiber/fiber") {
                    evidence.push("go.mod: gofiber/fiber".to_string());
                    found = true;
                }
                // Echo
                if content.contains("labstack/echo") {
                    evidence.push("go.mod: labstack/echo".to_string());
                    found = true;
                }
                // GORM
                if content.contains("gorm.io/gorm") {
                    evidence.push("go.mod: gorm.io/gorm".to_string());
                    found = true;
                }
                // Chi
                if content.contains("go-chi/chi") {
                    evidence.push("go.mod: go-chi/chi".to_string());
                    found = true;
                }

                if found {
                    // 提取主模块名
                    let module_re = Regex::new(r"^module\s+(.+)$").ok()?;
                    let module_name = module_re
                        .captures(&content)
                        .map(|c| c[1].trim().to_string())
                        .unwrap_or_default();

                    let fw_name = if evidence.iter().any(|e| e.contains("gin")) {
                        "Gin"
                    } else if evidence.iter().any(|e| e.contains("grpc")) {
                        "gRPC-Go"
                    } else if evidence.iter().any(|e| e.contains("fiber")) {
                        "Fiber"
                    } else if evidence.iter().any(|e| e.contains("echo")) {
                        "Echo"
                    } else if evidence.iter().any(|e| e.contains("chi")) {
                        "Chi"
                    } else {
                        "Go"
                    };

                    if !module_name.is_empty() {
                        evidence.insert(0, format!("module: {}", module_name));
                    }

                    return Some(FrameworkInfo {
                        name: fw_name.to_string(),
                        version: None,
                        evidence,
                    });
                }
            }
        }
    }

    // 检查 main.go 是否存在（纯 Go 项目）
    for entry in walk_non_skipped(repo_path) {
        if entry.path().file_name().and_then(|n| n.to_str()) == Some("main.go") {
            evidence.push("Found main.go entry point".to_string());
            return Some(FrameworkInfo {
                name: "Go".to_string(),
                version: None,
                evidence,
            });
        }
    }

    None
}

// --- Python 框架检测 ---

fn detect_python_framework(repo_path: &Path) -> Option<FrameworkInfo> {
    let mut evidence = Vec::new();

    // 检查 requirements.txt / pyproject.toml / setup.py / Pipfile
    let dep_files = [
        "requirements.txt",
        "pyproject.toml",
        "setup.py",
        "Pipfile",
        "poetry.lock",
    ];
    let mut all_deps = String::new();

    for entry in walk_non_skipped(repo_path) {
        if entry.file_type().is_file() {
            let name = entry.file_name().to_string_lossy();
            if dep_files.contains(&name.as_ref()) {
                if let Some(content) = read_file_str(entry.path()) {
                    all_deps.push_str(&content);
                    all_deps.push('\n');
                    evidence.push(format!("Found {}", rel_path(entry.path(), repo_path)));
                }
            }
        }
    }

    // 扫描所有 .py 文件检测 import
    let mut py_content_sample = String::new();
    let mut py_count = 0usize;
    for entry in walk_non_skipped(repo_path) {
        if entry.path().extension().and_then(|e| e.to_str()) == Some("py") && py_count < 200 {
            if let Some(content) = read_file_str(entry.path()) {
                py_count += 1;
                // 只取 import 行
                for line in content.lines() {
                    let t = line.trim();
                    if t.starts_with("import ") || t.starts_with("from ") {
                        py_content_sample.push_str(t);
                        py_content_sample.push('\n');
                    }
                }
            }
        }
    }

    let combined = format!("{}\n{}", all_deps, py_content_sample);

    // FastAPI
    if combined.contains("fastapi") || combined.contains("from fastapi") {
        evidence.push("Detected FastAPI import/dependency".to_string());
        return Some(FrameworkInfo {
            name: "FastAPI".to_string(),
            version: None,
            evidence,
        });
    }

    // Django
    if combined.contains("django") || combined.contains("from django") {
        evidence.push("Detected Django import/dependency".to_string());
        return Some(FrameworkInfo {
            name: "Django".to_string(),
            version: None,
            evidence,
        });
    }

    // Flask
    if combined.contains("flask") || combined.contains("from flask") {
        evidence.push("Detected Flask import/dependency".to_string());
        return Some(FrameworkInfo {
            name: "Flask".to_string(),
            version: None,
            evidence,
        });
    }

    // Celery
    if combined.contains("celery") || combined.contains("from celery") {
        evidence.push("Detected Celery import/dependency".to_string());
        return Some(FrameworkInfo {
            name: "Celery".to_string(),
            version: None,
            evidence,
        });
    }

    if !evidence.is_empty() {
        Some(FrameworkInfo {
            name: "Python".to_string(),
            version: None,
            evidence,
        })
    } else {
        None
    }
}

// --- TypeScript/JavaScript 框架检测 ---

fn detect_tsjs_framework(repo_path: &Path) -> Option<FrameworkInfo> {
    let mut evidence = Vec::new();

    for entry in walk_non_skipped(repo_path) {
        if entry.file_type().is_file() && entry.file_name() == "package.json" {
            if let Some(content) = read_file_str(entry.path()) {
                // NestJS
                if content.contains("@nestjs/core") || content.contains("@nestjs/common") {
                    evidence.push("package.json: @nestjs/core".to_string());
                    return Some(FrameworkInfo {
                        name: "NestJS".to_string(),
                        version: None,
                        evidence,
                    });
                }
                // Next.js
                if content.contains("next")
                    && (content.contains("next.config") || content.contains("\"next\""))
                {
                    evidence.push("package.json: next.js".to_string());
                    return Some(FrameworkInfo {
                        name: "Next.js".to_string(),
                        version: None,
                        evidence,
                    });
                }
                // Express
                if content.contains("\"express\"") {
                    evidence.push("package.json: express".to_string());
                    return Some(FrameworkInfo {
                        name: "Express".to_string(),
                        version: None,
                        evidence,
                    });
                }
                // Fastify
                if content.contains("\"fastify\"") {
                    evidence.push("package.json: fastify".to_string());
                    return Some(FrameworkInfo {
                        name: "Fastify".to_string(),
                        version: None,
                        evidence,
                    });
                }
                // Koa
                if content.contains("\"koa\"") {
                    evidence.push("package.json: koa".to_string());
                    return Some(FrameworkInfo {
                        name: "Koa".to_string(),
                        version: None,
                        evidence,
                    });
                }
                // React / Vue / Angular (前端框架)
                if content.contains("\"react\"") && !content.contains("\"react-native\"") {
                    evidence.push("package.json: react".to_string());
                    return Some(FrameworkInfo {
                        name: "React".to_string(),
                        version: None,
                        evidence,
                    });
                }
                if content.contains("\"vue\"") {
                    evidence.push("package.json: vue".to_string());
                    return Some(FrameworkInfo {
                        name: "Vue.js".to_string(),
                        version: None,
                        evidence,
                    });
                }
                if content.contains("\"@angular/core\"") {
                    evidence.push("package.json: @angular/core".to_string());
                    return Some(FrameworkInfo {
                        name: "Angular".to_string(),
                        version: None,
                        evidence,
                    });
                }

                // 有 package.json 但没识别出框架
                if evidence.is_empty() {
                    evidence.push("Found package.json (unknown framework)".to_string());
                    return Some(FrameworkInfo {
                        name: "Node.js".to_string(),
                        version: None,
                        evidence,
                    });
                }
            }
        }
    }

    None
}

// --- Rust 框架检测 ---

fn detect_rust_framework(repo_path: &Path) -> Option<FrameworkInfo> {
    let mut evidence = Vec::new();

    for entry in walk_non_skipped(repo_path) {
        if entry.file_type().is_file() && entry.file_name() == "Cargo.toml" {
            if let Some(content) = read_file_str(entry.path()) {
                // Axum
                if content.contains("axum") {
                    evidence.push("Cargo.toml: axum".to_string());
                    return Some(FrameworkInfo {
                        name: "Axum".to_string(),
                        version: None,
                        evidence,
                    });
                }
                // Actix Web
                if content.contains("actix-web") {
                    evidence.push("Cargo.toml: actix-web".to_string());
                    return Some(FrameworkInfo {
                        name: "Actix Web".to_string(),
                        version: None,
                        evidence,
                    });
                }
                // Rocket
                if content.contains("rocket") {
                    evidence.push("Cargo.toml: rocket".to_string());
                    return Some(FrameworkInfo {
                        name: "Rocket".to_string(),
                        version: None,
                        evidence,
                    });
                }
                // Tokio (异步运行时)
                if content.contains("tokio") {
                    evidence.push("Cargo.toml: tokio".to_string());
                    // 继续检测上层框架
                }
                // Tonic (gRPC)
                if content.contains("tonic") {
                    evidence.push("Cargo.toml: tonic (gRPC)".to_string());
                    return Some(FrameworkInfo {
                        name: "Tonic (gRPC)".to_string(),
                        version: None,
                        evidence,
                    });
                }

                if !evidence.is_empty() {
                    return Some(FrameworkInfo {
                        name: "Rust".to_string(),
                        version: None,
                        evidence,
                    });
                }
            }
        }
    }

    None
}

// ============================================================
// 项目结构分析（多语言）
// ============================================================

/// 通用入口：根据语言分发到对应分析器
pub fn analyze_structure(
    repo_path: &Path,
    primary_language: &str,
    framework: &Option<FrameworkInfo>,
) -> ProjectStructure {
    match primary_language {
        "Java" => analyze_java_structure(repo_path, framework),
        "Go" => analyze_go_structure(repo_path, framework),
        "Python" => analyze_python_structure(repo_path, framework),
        "TypeScript" | "JavaScript" => analyze_tsjs_structure(repo_path, framework),
        "Rust" => analyze_rust_structure(repo_path, framework),
        _ => empty_structure(),
    }
}

fn empty_structure() -> ProjectStructure {
    ProjectStructure {
        controllers: Vec::new(),
        services: Vec::new(),
        repositories: Vec::new(),
        entities: Vec::new(),
        mappers: Vec::new(),
        configurations: Vec::new(),
        api_routes: Vec::new(),
        db_entities: Vec::new(),
        config_files: Vec::new(),
        entry_points: Vec::new(),
        directories: empty_directories(),
    }
}

fn empty_directories() -> ProjectDirectories {
    ProjectDirectories {
        src_main: false,
        src_test: false,
        src_main_resources: false,
        controller_dir: Vec::new(),
        service_dir: Vec::new(),
        repository_dir: Vec::new(),
        mapper_dir: Vec::new(),
        entity_dir: Vec::new(),
        dto_dir: Vec::new(),
        config_dir: Vec::new(),
    }
}

// ============================================================
// Java / Spring Boot 结构分析（保留原有逻辑）
// ============================================================

fn find_src_test(repo_path: &Path) -> Option<std::path::PathBuf> {
    for entry in walk_non_skipped(repo_path) {
        if entry.file_type().is_dir() && entry.file_name() == "test" {
            if let Some(parent) = entry.path().parent() {
                if parent.file_name().map(|n| n == "src").unwrap_or(false) {
                    return Some(entry.into_path());
                }
            }
        }
    }
    None
}

fn find_all_src_main_dirs(repo_path: &Path) -> Vec<std::path::PathBuf> {
    let mut result = Vec::new();
    for entry in walk_non_skipped(repo_path) {
        if entry.file_type().is_dir() && entry.file_name() == "main" {
            if let Some(parent) = entry.path().parent() {
                if parent.file_name().map(|n| n == "src").unwrap_or(false) {
                    result.push(entry.into_path());
                }
            }
        }
    }
    result
}

fn detect_java_directories(repo_path: &Path) -> ProjectDirectories {
    let src_main_paths = find_all_src_main_dirs(repo_path);
    let src_main = !src_main_paths.is_empty();
    let src_test = find_src_test(repo_path).is_some();
    let src_main_resources = src_main_paths.iter().any(|p| p.join("resources").exists());

    let mut dirs = empty_directories();
    dirs.src_main = src_main;
    dirs.src_test = src_test;
    dirs.src_main_resources = src_main_resources;

    for main_path in &src_main_paths {
        let java_base = main_path.join("java");
        if java_base.exists() {
            for entry in WalkDir::new(&java_base)
                .max_depth(8)
                .into_iter()
                .filter_map(|e| e.ok())
            {
                if !entry.file_type().is_dir() {
                    continue;
                }
                let name = entry.file_name().to_string_lossy().to_lowercase();
                let rp = rel_path(entry.path(), repo_path);

                match name.as_str() {
                    "controller" | "controllers" => dirs.controller_dir.push(rp),
                    "service" | "services" => dirs.service_dir.push(rp),
                    "repository" | "repositories" | "repo" | "repos" => {
                        dirs.repository_dir.push(rp)
                    }
                    "mapper" | "mappers" | "dao" | "daos" => dirs.mapper_dir.push(rp),
                    "entity" | "entities" | "model" | "models" | "domain" => {
                        dirs.entity_dir.push(rp)
                    }
                    "dto" | "dtos" | "vo" | "vos" | "request" | "response" => dirs.dto_dir.push(rp),
                    "config" | "configuration" | "configs" | "configurations" => {
                        dirs.config_dir.push(rp)
                    }
                    _ => {}
                }
            }
        }

        let res_base = main_path.join("resources");
        if res_base.exists() {
            for entry in WalkDir::new(&res_base)
                .max_depth(4)
                .into_iter()
                .filter_map(|e| e.ok())
            {
                if !entry.file_type().is_dir() {
                    continue;
                }
                let name = entry.file_name().to_string_lossy().to_lowercase();
                let rp = rel_path(entry.path(), repo_path);
                match name.as_str() {
                    "mapper" | "mappers" => {
                        if !dirs.mapper_dir.contains(&rp) {
                            dirs.mapper_dir.push(rp);
                        }
                    }
                    "config" | "configuration" => {
                        if !dirs.config_dir.contains(&rp) {
                            dirs.config_dir.push(rp);
                        }
                    }
                    _ => {}
                }
            }
        }
    }

    dirs
}

fn extract_request_method_from_inner(inner: &str) -> Option<String> {
    let re = Regex::new(
        r#"(?:method\s*=\s*(?:RequestMethod\.(\w+)|\{[^}]*RequestMethod\.(\w+)[^}]*\}))"#,
    )
    .ok()?;
    let caps = re.captures(inner)?;
    caps.get(1)
        .or_else(|| caps.get(2))
        .map(|m| m.as_str().to_uppercase())
}

fn extract_annotation_path(raw: &str) -> String {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return String::new();
    }
    if (trimmed.starts_with('"') && trimmed.ends_with('"'))
        || (trimmed.starts_with('\'') && trimmed.ends_with('\''))
    {
        return trimmed.trim_matches('"').trim_matches('\'').to_string();
    }
    let kv_re = Regex::new(r#"(?:value|path|name)\s*=\s*["']([^"']+)["']"#).unwrap();
    if let Some(caps) = kv_re.captures(trimmed) {
        return caps[1].to_string();
    }
    let str_re = Regex::new(r#"["']([^"']+)["']"#).unwrap();
    if let Some(caps) = str_re.captures(trimmed) {
        return caps[1].to_string();
    }
    if trimmed.starts_with('/') {
        return trimmed.to_string();
    }
    String::new()
}

fn combine_paths(class_prefix: &str, method_path: &str) -> String {
    if class_prefix.is_empty() && method_path.is_empty() {
        String::new()
    } else if method_path.is_empty() {
        class_prefix.to_string()
    } else if method_path.starts_with('/') {
        format!("{}{}", class_prefix, method_path)
    } else {
        format!("{}/{}", class_prefix.trim_end_matches('/'), method_path)
    }
}

fn extract_next_method_name(content: &str, from_line: usize) -> String {
    content
        .lines()
        .skip(from_line + 1)
        .find(|l| l.contains("public ") || l.contains("private ") || l.contains("protected "))
        .and_then(|l| {
            let re = Regex::new(r"\s+(\w+)\s*\(").ok()?;
            re.captures(l).map(|c| c[1].to_string())
        })
        .unwrap_or_default()
}

fn extract_java_api_routes(
    content: &str,
    class_name: &str,
    req_mapping_re: &Regex,
    method_mapping_re: &Regex,
) -> Vec<ApiRoute> {
    let mut routes = Vec::new();
    let mut class_prefix = String::new();
    let mut brace_depth: i32 = 0;

    for (line_num, line) in content.lines().enumerate() {
        let trimmed = line.trim();

        if let Some(caps) = req_mapping_re.captures(trimmed) {
            if let Some(inner) = caps.get(1) {
                let inner_str = inner.as_str();
                if brace_depth == 0 {
                    class_prefix = extract_annotation_path(inner_str);
                } else {
                    let http_method = extract_request_method_from_inner(inner_str)
                        .unwrap_or_else(|| "ALL".to_string());
                    let path_part = extract_annotation_path(inner_str);
                    let full_path = combine_paths(&class_prefix, &path_part);
                    if !full_path.is_empty() {
                        let method_name = extract_next_method_name(content, line_num);
                        routes.push(ApiRoute {
                            method: http_method,
                            path: full_path,
                            handler_class: class_name.to_string(),
                            handler_method: method_name,
                            line_number: line_num + 1,
                        });
                    }
                }
            }
        } else if let Some(caps) = method_mapping_re.captures(trimmed) {
            if brace_depth >= 1 {
                let http_method = caps[1].to_uppercase();
                let path_part = caps
                    .get(2)
                    .map(|m| extract_annotation_path(m.as_str()))
                    .unwrap_or_default();
                let full_path = combine_paths(&class_prefix, &path_part);
                if !full_path.is_empty() {
                    let method_name = extract_next_method_name(content, line_num);
                    routes.push(ApiRoute {
                        method: http_method,
                        path: full_path,
                        handler_class: class_name.to_string(),
                        handler_method: method_name,
                        line_number: line_num + 1,
                    });
                }
            }
        }

        for ch in trimmed.chars() {
            match ch {
                '{' => brace_depth += 1,
                '}' => brace_depth -= 1,
                _ => {}
            }
        }
    }
    routes
}

fn analyze_java_structure(
    repo_path: &Path,
    _framework: &Option<FrameworkInfo>,
) -> ProjectStructure {
    let mut controllers = Vec::new();
    let mut services = Vec::new();
    let mut repositories = Vec::new();
    let mut entities = Vec::new();
    let mut mappers = Vec::new();
    let mut configurations = Vec::new();
    let mut config_files = Vec::new();
    let mut entry_points = Vec::new();
    let mut db_entities = Vec::new();

    let let_re = Regex::new(r"@RestController|@Controller").unwrap();
    let svc_re = Regex::new(r"@Service").unwrap();
    let repo_re =
        Regex::new(r"@Repository|extends BaseMapper|extends CrudRepository|extends JpaRepository")
            .unwrap();
    let entity_re = Regex::new(r"@Entity|@TableName|@Table\b").unwrap();
    let mapper_re = Regex::new(r"@Mapper|extends BaseMapper").unwrap();
    let config_re = Regex::new(r"@Configuration|@ConfigurationProperties").unwrap();
    let mapping_re = Regex::new(r"@(Get|Post|Put|Delete|Patch)Mapping(?:\(([^)]*)\))?").unwrap();
    let request_mapping_re = Regex::new(r"@RequestMapping(?:\(([^)]*)\))?").unwrap();
    let table_name_re = Regex::new(r#"@TableName\(\s*"([^"]+)"\s*\)"#).unwrap();
    let entity_table_re = Regex::new(r#"@Table\s*\(\s*name\s*=\s*"([^"]+)"\s*\)"#).unwrap();
    let method_re = Regex::new(r"(public|private|protected)\s+\S+\s+(\w+)\s*\(").unwrap();

    let directories = detect_java_directories(repo_path);
    let src_main_dirs = find_all_src_main_dirs(repo_path);

    for entry in walk_non_skipped(repo_path) {
        let path = entry.path();
        let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("");

        if ext == "yml" || ext == "yaml" || ext == "properties" || ext == "xml" {
            let rp = rel_path(path, repo_path);
            if rp.contains("resources") || rp.contains("config") {
                config_files.push(rp);
            }
        }

        if ext != "java" {
            continue;
        }

        let is_src_main_java = src_main_dirs.iter().any(|sm| {
            let sm_java = sm.join("java");
            path.starts_with(&sm_java)
        });
        if !is_src_main_java {
            continue;
        }

        let content = match read_file_str(path) {
            Some(c) => c,
            None => continue,
        };

        let rp = rel_path(path, repo_path);
        let line_count = content.lines().count();

        let package = content
            .lines()
            .find(|l| l.trim_start().starts_with("package "))
            .map(|l| {
                l.trim()
                    .trim_start_matches("package ")
                    .trim_end_matches(';')
                    .trim()
                    .to_string()
            });

        let class_name = file_stem_str(path);

        let annotations: Vec<String> = content
            .lines()
            .filter(|l| l.trim().starts_with('@'))
            .map(|l| l.trim().to_string())
            .collect();

        let method_count = method_re.captures_iter(&content).count();

        if content.contains("@SpringBootApplication") {
            entry_points.push(rp.clone());
        }

        let class_info = ClassInfo {
            name: class_name.clone(),
            file_path: rp.clone(),
            package: package.clone(),
            annotations: annotations.clone(),
            line_count,
            method_count,
        };

        if let_re.is_match(&content) {
            controllers.push(class_info.clone());
        }
        if svc_re.is_match(&content) {
            services.push(class_info.clone());
        }
        if mapper_re.is_match(&content) {
            mappers.push(class_info.clone());
        }
        if repo_re.is_match(&content) && !mappers.iter().any(|r| r.file_path == rp) {
            repositories.push(class_info.clone());
        }
        if entity_re.is_match(&content) {
            entities.push(class_info.clone());
            let table_name = table_name_re
                .captures(&content)
                .map(|c| c[1].to_string())
                .or_else(|| entity_table_re.captures(&content).map(|c| c[1].to_string()));
            let is_jpa_entity = content.contains("@Entity");
            if is_jpa_entity || table_name.is_some() {
                db_entities.push(DbEntity {
                    class_name: class_name.clone(),
                    table_name,
                    file_path: rp.clone(),
                    field_count: content.lines().filter(|l| l.contains("private ")).count(),
                    annotations: annotations.clone(),
                });
            }
        }
        if config_re.is_match(&content) {
            configurations.push(class_info);
        }
    }

    let mut api_routes = Vec::new();
    for ctrl in &controllers {
        let path = repo_path.join(&ctrl.file_path);
        if let Some(content) = read_file_str(&path) {
            let routes =
                extract_java_api_routes(&content, &ctrl.name, &request_mapping_re, &mapping_re);
            api_routes.extend(routes);
        }
    }

    ProjectStructure {
        controllers,
        services,
        repositories,
        entities,
        mappers,
        configurations,
        api_routes,
        db_entities,
        config_files,
        entry_points,
        directories,
    }
}

// ============================================================
// Go 结构分析
// ============================================================

fn analyze_go_structure(repo_path: &Path, framework: &Option<FrameworkInfo>) -> ProjectStructure {
    let fw_name = framework.as_ref().map(|f| f.name.as_str()).unwrap_or("Go");

    let mut controllers = Vec::new(); // handler 函数所在文件
    let mut services = Vec::new();
    let mut repositories = Vec::new();
    let mut entities = Vec::new();
    let mut configurations = Vec::new();
    let mut config_files = Vec::new();
    let mut entry_points = Vec::new();
    let mut api_routes = Vec::new();
    let mut db_entities = Vec::new();

    let handler_re =
        Regex::new(r#"(?:func\s+\(\w+\s+\*?\w+\)\s+)?(\w+)\s*\(.*\*gin\.Context\b"#).unwrap();
    let http_handler_re = Regex::new(r"func\s+(\w+)\s*\([^)]*\*?(?:http\.ResponseWriter|gin\.Context|echo\.Context|fiber\.Ctx|context\.Context)").unwrap();
    let struct_re = Regex::new(r"^type\s+(\w+)\s+struct\s*\{").unwrap();
    let func_re = Regex::new(r"^func\s+(?:\([^)]+\)\s+)?(\w+)\s*\(").unwrap();
    let _method_re = Regex::new(r"^func\s+\([^)]+\)\s+(\w+)\s*\(").unwrap();
    let gorm_re = Regex::new(r#"gorm:"[^"]*""#).unwrap();
    let _json_re = Regex::new(r#"json:"([^"]+)""#).unwrap();
    let proto_re = Regex::new(r"\.proto$").unwrap();

    // 收集所 has  go 文件内容
    let mut go_files: Vec<(String, String)> = Vec::new(); // (rel_path, content)
    for entry in walk_non_skipped(repo_path) {
        if entry.path().extension().and_then(|e| e.to_str()) == Some("go") {
            if let Some(content) = read_file_str(entry.path()) {
                let rp = rel_path(entry.path(), repo_path);
                go_files.push((rp, content));
            }
        }
        // 检查 proto 文件
        if proto_re.is_match(entry.file_name().to_string_lossy().as_ref()) {
            let rp = rel_path(entry.path(), repo_path);
            config_files.push(rp);
        }
    }

    // 检测入口文件
    for entry in walk_non_skipped(repo_path) {
        if entry.path().file_name().and_then(|n| n.to_str()) == Some("main.go") {
            entry_points.push(rel_path(entry.path(), repo_path));
        }
    }

    for (rp, content) in &go_files {
        let file_name = std::path::Path::new(rp)
            .file_stem()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_default();

        let line_count = content.lines().count();

        // 收集注释（Go 用 // 和 /* */）
        let annotations: Vec<String> = content
            .lines()
            .take(10)
            .filter(|l| l.trim().starts_with("//"))
            .map(|l| l.trim().to_string())
            .collect();

        let method_count = func_re.captures_iter(content).count();

        // 检测 handler 文件 → controller
        let is_handler = if fw_name == "Gin" {
            handler_re.is_match(content)
        } else {
            http_handler_re.is_match(content)
        };

        let class_info = ClassInfo {
            name: file_name.clone(),
            file_path: rp.clone(),
            package: None,
            annotations,
            line_count,
            method_count,
        };

        if is_handler {
            controllers.push(class_info.clone());

            // 提取路由（Gin 风格: r.GET("/path", handler) 或 group.POST(...)）
            let route_re =
                Regex::new(r#"\.(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s*\(\s*"([^"]+)"\s*,"#)
                    .unwrap();
            let group_route_re =
                Regex::new(r#"(\w+)\s*:=\s*\w+\.Group\s*\(\s*"([^"]*)"\s*\)"#).unwrap();
            let group_method_re = Regex::new(r#"\.(\w+)\s*\(\s*"([^"]+)"\s*,"#).unwrap();

            let mut groups: std::collections::HashMap<String, String> =
                std::collections::HashMap::new();

            for line in content.lines() {
                // 直接路由
                if let Some(caps) = route_re.captures(line) {
                    let method = caps[1].to_uppercase();
                    let path = caps[2].to_string();
                    api_routes.push(ApiRoute {
                        method,
                        path,
                        handler_class: file_name.clone(),
                        handler_method: String::new(),
                        line_number: 0,
                    });
                }

                // Group 定义
                if let Some(caps) = group_route_re.captures(line) {
                    let var_name = caps[1].to_string();
                    let prefix = caps[2].to_string();
                    groups.insert(var_name, prefix);
                }

                // Group 上的路由
                if let Some(caps) = group_method_re.captures(line) {
                    let http_method = caps[1].to_uppercase();
                    let path_part = caps[2].to_string();
                    if ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"]
                        .contains(&http_method.as_str())
                    {
                        // 尝试找到 group 前缀
                        let prefix = groups.values().next().map(|s| s.as_str()).unwrap_or("");
                        let full_path = combine_paths(prefix, &path_part);
                        if !full_path.is_empty() {
                            api_routes.push(ApiRoute {
                                method: http_method,
                                path: full_path,
                                handler_class: file_name.clone(),
                                handler_method: String::new(),
                                line_number: 0,
                            });
                        }
                    }
                }
            }
        }

        // struct → entity (特别是有 GORM tag 的)
        let has_gorm = gorm_re.is_match(content);
        for cap in struct_re.captures_iter(content) {
            let struct_name = cap[1].to_string();
            let field_count = content
                .lines()
                .filter(|l| l.contains("json:") || l.contains("gorm:"))
                .count();
            entities.push(ClassInfo {
                name: struct_name.clone(),
                file_path: rp.clone(),
                package: None,
                annotations: if has_gorm {
                    vec!["GORM".to_string()]
                } else {
                    Vec::new()
                },
                line_count,
                method_count: 0,
            });
            if has_gorm && field_count > 0 {
                // 从 json tag 推测表名
                let table_name = struct_name.to_lowercase() + "s";
                db_entities.push(DbEntity {
                    class_name: struct_name,
                    table_name: Some(table_name),
                    file_path: rp.clone(),
                    field_count,
                    annotations: vec!["GORM".to_string()],
                });
            }
        }

        // 按目录名分类
        let path_lower = rp.to_lowercase();
        if path_lower.contains("service")
            || path_lower.contains("biz")
            || path_lower.contains("usecase")
        {
            if !is_handler {
                services.push(class_info.clone());
            }
        }
        if path_lower.contains("repo") || path_lower.contains("dao") || path_lower.contains("dal") {
            repositories.push(class_info.clone());
        }
        if path_lower.contains("config") || path_lower.contains("conf") {
            configurations.push(class_info.clone());
        }
    }

    // 检查配置文件
    for entry in walk_non_skipped(repo_path) {
        let name = entry.file_name().to_string_lossy().to_lowercase();
        if name == "config.yaml"
            || name == "config.yml"
            || name == "config.json"
            || name == "config.toml"
            || name == ".env"
        {
            config_files.push(rel_path(entry.path(), repo_path));
        }
    }

    ProjectStructure {
        controllers,
        services,
        repositories,
        entities,
        mappers: Vec::new(),
        configurations,
        api_routes,
        db_entities,
        config_files,
        entry_points,
        directories: empty_directories(),
    }
}

// ============================================================
// Python 结构分析
// ============================================================

fn analyze_python_structure(
    repo_path: &Path,
    framework: &Option<FrameworkInfo>,
) -> ProjectStructure {
    let fw_name = framework
        .as_ref()
        .map(|f| f.name.as_str())
        .unwrap_or("Python");

    let mut controllers = Vec::new();
    let mut services = Vec::new();
    let mut repositories = Vec::new();
    let mut entities = Vec::new();
    let mut configurations = Vec::new();
    let mut config_files = Vec::new();
    let mut entry_points = Vec::new();
    let mut api_routes = Vec::new();
    let mut db_entities = Vec::new();

    let _class_re = Regex::new(r"^class\s+(\w+)").unwrap();
    let func_re = Regex::new(r"^(?:async\s+)?def\s+(\w+)\s*\(").unwrap();
    let _decorator_re = Regex::new(r"^@\w+").unwrap();
    let pydantic_re = Regex::new(r"(?:BaseModel|Schema)").unwrap();
    let sqlalchemy_re = Regex::new(r"(?:Column|Table|db\.Model|models\.Model)").unwrap();
    let django_model_re = Regex::new(r"models\.Model").unwrap();

    // FastAPI 路由
    let fastapi_route_re =
        Regex::new(r#"@\w+\.(get|post|put|delete|patch)\s*\(\s*["']([^"']+)["']"#).unwrap();
    // Flask 路由
    let flask_route_re = Regex::new(r#"@\w+\.route\s*\(\s*["']([^"']+)["']"#).unwrap();
    let flask_method_re = Regex::new(r#"methods\s*=\s*\[([^\]]+)\]"#).unwrap();

    for entry in walk_non_skipped(repo_path) {
        if entry.path().extension().and_then(|e| e.to_str()) != Some("py") {
            continue;
        }
        let content = match read_file_str(entry.path()) {
            Some(c) => c,
            None => continue,
        };
        let rp = rel_path(entry.path(), repo_path);
        let file_name = file_stem_str(entry.path());
        let line_count = content.lines().count();

        let annotations: Vec<String> = content
            .lines()
            .filter(|l| l.trim().starts_with('@'))
            .take(5)
            .map(|l| l.trim().to_string())
            .collect();

        let method_count = func_re.captures_iter(&content).count();

        // 入口检测
        if content.contains("if __name__")
            || content.contains("app = ")
            || content.contains("application = ")
        {
            entry_points.push(rp.clone());
        }

        let class_info = ClassInfo {
            name: file_name.clone(),
            file_path: rp.clone(),
            package: None,
            annotations: annotations.clone(),
            line_count,
            method_count,
        };

        // FastAPI 路由
        if fw_name == "FastAPI" {
            for cap in fastapi_route_re.captures_iter(&content) {
                let method = cap[1].to_uppercase();
                let path = cap[2].to_string();
                api_routes.push(ApiRoute {
                    method,
                    path,
                    handler_class: file_name.clone(),
                    handler_method: String::new(),
                    line_number: 0,
                });
            }
        }

        // Flask 路由
        if fw_name == "Flask" {
            for cap in flask_route_re.captures_iter(&content) {
                let path = cap[1].to_string();
                let methods = flask_method_re
                    .captures(content.lines().nth(0).unwrap_or(""))
                    .map(|m| m[1].to_string())
                    .unwrap_or_else(|| "GET".to_string());
                api_routes.push(ApiRoute {
                    method: methods,
                    path,
                    handler_class: file_name.clone(),
                    handler_method: String::new(),
                    line_number: 0,
                });
            }
        }

        // 按目录名分类
        let path_lower = rp.to_lowercase();
        if path_lower.contains("view")
            || path_lower.contains("endpoint")
            || path_lower.contains("route")
            || path_lower.contains("handler")
        {
            controllers.push(class_info.clone());
        } else if path_lower.contains("service")
            || path_lower.contains("biz")
            || path_lower.contains("usecase")
        {
            services.push(class_info.clone());
        } else if path_lower.contains("repo")
            || path_lower.contains("dao")
            || path_lower.contains("dal")
        {
            repositories.push(class_info.clone());
        } else if path_lower.contains("model")
            || path_lower.contains("entity")
            || path_lower.contains("schema")
        {
            entities.push(class_info.clone());
            // Pydantic / SQLAlchemy
            if pydantic_re.is_match(&content) || sqlalchemy_re.is_match(&content) {
                if sqlalchemy_re.is_match(&content) || django_model_re.is_match(&content) {
                    db_entities.push(DbEntity {
                        class_name: file_name,
                        table_name: None,
                        file_path: rp,
                        field_count: content
                            .lines()
                            .filter(|l| l.contains("= Column(") || l.contains("= models."))
                            .count(),
                        annotations: annotations,
                    });
                }
            }
        } else if path_lower.contains("config") || path_lower.contains("setting") {
            configurations.push(class_info);
        }
    }

    // 配置文件
    for entry in walk_non_skipped(repo_path) {
        let name = entry.file_name().to_string_lossy().to_lowercase();
        if name == "settings.py"
            || name == "config.py"
            || name == ".env"
            || name == "config.yaml"
            || name == "config.yml"
            || name == "config.json"
            || name == "pyproject.toml"
            || name == "setup.cfg"
        {
            config_files.push(rel_path(entry.path(), repo_path));
        }
    }

    ProjectStructure {
        controllers,
        services,
        repositories,
        entities,
        mappers: Vec::new(),
        configurations,
        api_routes,
        db_entities,
        config_files,
        entry_points,
        directories: empty_directories(),
    }
}

// ============================================================
// TypeScript / JavaScript 结构分析
// ============================================================

fn analyze_tsjs_structure(repo_path: &Path, framework: &Option<FrameworkInfo>) -> ProjectStructure {
    let fw_name = framework
        .as_ref()
        .map(|f| f.name.as_str())
        .unwrap_or("Node.js");

    let mut controllers = Vec::new();
    let mut services = Vec::new();
    let mut repositories = Vec::new();
    let mut entities = Vec::new();
    let mut configurations = Vec::new();
    let mut config_files = Vec::new();
    let mut entry_points = Vec::new();
    let mut api_routes = Vec::new();

    let _class_re = Regex::new(r"(?:export\s+)?(?:abstract\s+)?class\s+(\w+)").unwrap();
    let _interface_re = Regex::new(r"(?:export\s+)?interface\s+(\w+)").unwrap();
    let _func_re = Regex::new(r"(?:export\s+)?(?:async\s+)?function\s+(\w+)").unwrap();
    let method_re = Regex::new(r"(?:public|private|protected|static|async)\s+(\w+)\s*\(").unwrap();
    let nestjs_controller_re = Regex::new(r#"@Controller\(([^)]*)\)"#).unwrap();
    let nestjs_get_re = Regex::new(r"@(Get|Post|Put|Delete|Patch)\(([^)]*)\)").unwrap();
    let express_route_re =
        Regex::new(r#"\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]"#).unwrap();
    let typeorm_re = Regex::new(r#"@Entity\(|@Column\(|@PrimaryGeneratedColumn"#).unwrap();
    let prisma_re = Regex::new(r#"model\s+\w+\s*\{"#).unwrap();

    // 收集 .ts/.js/.tsx/.jsx 文件
    for entry in walk_non_skipped(repo_path) {
        let ext = entry
            .path()
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("");
        if !matches!(ext, "ts" | "tsx" | "js" | "jsx") {
            continue;
        }
        // 跳过 node_modules 内的（walkdir 已过滤）
        let content = match read_file_str(entry.path()) {
            Some(c) => c,
            None => continue,
        };
        let rp = rel_path(entry.path(), repo_path);
        let file_name = file_stem_str(entry.path());
        let line_count = content.lines().count();

        let method_count = method_re.captures_iter(&content).count();

        let annotations: Vec<String> = content
            .lines()
            .filter(|l| l.trim().starts_with('@'))
            .take(5)
            .map(|l| l.trim().to_string())
            .collect();

        // 入口检测
        if file_name == "index"
            || file_name == "main"
            || file_name == "app"
            || file_name == "server"
        {
            entry_points.push(rp.clone());
        }

        let class_info = ClassInfo {
            name: file_name.clone(),
            file_path: rp.clone(),
            package: None,
            annotations: annotations.clone(),
            line_count,
            method_count,
        };

        // NestJS Controller
        if fw_name == "NestJS" {
            if nestjs_controller_re.is_match(&content) {
                controllers.push(class_info.clone());
                for cap in nestjs_get_re.captures_iter(&content) {
                    let method = cap[1].to_uppercase();
                    let path = cap[2]
                        .trim()
                        .trim_matches('\'')
                        .trim_matches('"')
                        .trim_matches('`')
                        .to_string();
                    let class_prefix = nestjs_controller_re
                        .captures(&content)
                        .and_then(|c| c.get(1))
                        .map(|m| {
                            m.as_str()
                                .trim()
                                .trim_matches('\'')
                                .trim_matches('"')
                                .trim_matches('`')
                                .to_string()
                        })
                        .unwrap_or_default();
                    let full_path = combine_paths(&class_prefix, &path);
                    if !full_path.is_empty() {
                        api_routes.push(ApiRoute {
                            method,
                            path: full_path,
                            handler_class: file_name.clone(),
                            handler_method: String::new(),
                            line_number: 0,
                        });
                    }
                }
            }
        }

        // Express 路由
        if fw_name == "Express" || fw_name == "Fastify" || fw_name == "Koa" {
            for cap in express_route_re.captures_iter(&content) {
                let method = cap[1].to_uppercase();
                let path = cap[2].to_string();
                api_routes.push(ApiRoute {
                    method,
                    path,
                    handler_class: file_name.clone(),
                    handler_method: String::new(),
                    line_number: 0,
                });
            }
        }

        // 目录分类
        let path_lower = rp.to_lowercase();
        if path_lower.contains("controller")
            || path_lower.contains("handler")
            || path_lower.contains("resolver")
        {
            controllers.push(class_info.clone());
        } else if path_lower.contains("service") || path_lower.contains("usecase") {
            services.push(class_info.clone());
        } else if path_lower.contains("repository") || path_lower.contains("dao") {
            repositories.push(class_info.clone());
        } else if path_lower.contains("model")
            || path_lower.contains("entity")
            || path_lower.contains("type")
            || path_lower.contains("interface")
        {
            entities.push(class_info.clone());
            if typeorm_re.is_match(&content) || prisma_re.is_match(&content) {
                // TypeORM 实体
            }
        } else if path_lower.contains("config") || path_lower.contains("setting") {
            configurations.push(class_info);
        }
    }

    // Config file
    for entry in walk_non_skipped(repo_path) {
        let name = entry.file_name().to_string_lossy().to_lowercase();
        if name == "tsconfig.json"
            || name == ".eslintrc.js"
            || name == ".eslintrc.json"
            || name == "next.config.js"
            || name == "nest-cli.json"
            || name == ".env"
            || name == "docker-compose.yml"
        {
            config_files.push(rel_path(entry.path(), repo_path));
        }
    }

    ProjectStructure {
        controllers,
        services,
        repositories,
        entities,
        mappers: Vec::new(),
        configurations,
        api_routes,
        db_entities: Vec::new(),
        config_files,
        entry_points,
        directories: empty_directories(),
    }
}

// ============================================================
// Rust 结构分析
// ============================================================

fn analyze_rust_structure(repo_path: &Path, framework: &Option<FrameworkInfo>) -> ProjectStructure {
    let fw_name = framework
        .as_ref()
        .map(|f| f.name.as_str())
        .unwrap_or("Rust");

    let mut controllers = Vec::new();
    let mut services = Vec::new();
    let mut repositories = Vec::new();
    let mut entities = Vec::new();
    let mut configurations = Vec::new();
    let mut config_files = Vec::new();
    let mut entry_points = Vec::new();
    let mut api_routes = Vec::new();
    let mut db_entities = Vec::new();

    let struct_re = Regex::new(r"^pub\s+struct\s+(\w+)").unwrap();
    let _enum_re = Regex::new(r"^pub\s+enum\s+(\w+)").unwrap();
    let fn_re = Regex::new(r"^pub\s+(?:async\s+)?fn\s+(\w+)").unwrap();
    let _impl_re = Regex::new(r"^impl(?:<[^>]+>)?\s+(\w+)").unwrap();
    let _trait_re = Regex::new(r"^pub\s+trait\s+(\w+)").unwrap();

    // Axum 路由
    let _axum_route_re =
        Regex::new(r#"\.(get|post|put|delete|patch|route)\s*\(\s*"[^"]*""#).unwrap();
    // Actix 路由
    let actix_route_re = Regex::new(r#"#\[(get|post|put|delete|patch)\s*\(\s*"([^"]+)""#).unwrap();
    // Rocket 路由
    let rocket_route_re = Regex::new(r#"#\[(get|post|put|delete)\s*\(\s*"/([^"]*)""#).unwrap();

    // 收集所有 src 文件
    for entry in walk_non_skipped(repo_path) {
        if entry.path().extension().and_then(|e| e.to_str()) != Some("rs") {
            continue;
        }
        let content = match read_file_str(entry.path()) {
            Some(c) => c,
            None => continue,
        };
        let rp = rel_path(entry.path(), repo_path);
        let file_name = file_stem_str(entry.path());
        let line_count = content.lines().count();

        let method_count = fn_re.captures_iter(&content).count();

        let annotations: Vec<String> = content
            .lines()
            .filter(|l| l.trim().starts_with('#') && l.contains('['))
            .take(5)
            .map(|l| l.trim().to_string())
            .collect();

        // 入口检测
        if content.contains("fn main()") || content.contains("#[tokio::main]") {
            entry_points.push(rp.clone());
        }

        let class_info = ClassInfo {
            name: file_name.clone(),
            file_path: rp.clone(),
            package: None,
            annotations: annotations.clone(),
            line_count,
            method_count,
        };

        // 路由提取
        if fw_name == "Axum" || fw_name == "Actix Web" || fw_name == "Rocket" {
            if fw_name == "Actix Web" {
                for cap in actix_route_re.captures_iter(&content) {
                    let method = cap[1].to_uppercase();
                    let path = cap[2].to_string();
                    api_routes.push(ApiRoute {
                        method,
                        path: format!("/{}", path),
                        handler_class: file_name.clone(),
                        handler_method: String::new(),
                        line_number: 0,
                    });
                }
            }
            if fw_name == "Rocket" {
                for cap in rocket_route_re.captures_iter(&content) {
                    let method = cap[1].to_uppercase();
                    let path = cap[2].to_string();
                    api_routes.push(ApiRoute {
                        method,
                        path: format!("/{}", path),
                        handler_class: file_name.clone(),
                        handler_method: String::new(),
                        line_number: 0,
                    });
                }
            }
        }

        // 目录分类
        let path_lower = rp.to_lowercase();
        if path_lower.contains("handler")
            || path_lower.contains("controller")
            || path_lower.contains("route")
            || path_lower.contains("api")
        {
            controllers.push(class_info.clone());
        } else if path_lower.contains("service")
            || path_lower.contains("biz")
            || path_lower.contains("usecase")
        {
            services.push(class_info.clone());
        } else if path_lower.contains("repository")
            || path_lower.contains("repo")
            || path_lower.contains("dao")
        {
            repositories.push(class_info.clone());
        } else if path_lower.contains("model")
            || path_lower.contains("entity")
            || path_lower.contains("schema")
        {
            entities.push(class_info.clone());
            // struct 带 serde/diesel/sqlx 可能是数据模型
            if content.contains("#[derive(")
                && (content.contains("Serialize")
                    || content.contains("Queryable")
                    || content.contains("FromRow"))
            {
                db_entities.push(DbEntity {
                    class_name: file_name,
                    table_name: None,
                    file_path: rp,
                    field_count: struct_re.captures_iter(&content).count(),
                    annotations,
                });
            }
        } else if path_lower.contains("config") || path_lower.contains("setting") {
            configurations.push(class_info);
        }
    }

    // 配置文件
    for entry in walk_non_skipped(repo_path) {
        let name = entry.file_name().to_string_lossy().to_lowercase();
        if name == "cargo.toml" || name == "rust-toolchain.toml" || name == ".env" {
            config_files.push(rel_path(entry.path(), repo_path));
        }
    }

    ProjectStructure {
        controllers,
        services,
        repositories,
        entities,
        mappers: Vec::new(),
        configurations,
        api_routes,
        db_entities,
        config_files,
        entry_points,
        directories: empty_directories(),
    }
}

// ============================================================
// 代码质量分析（通用）
// ============================================================

pub fn analyze_code_quality(structure: &ProjectStructure) -> CodeQuality {
    let mut all_classes: Vec<&ClassInfo> = Vec::new();
    all_classes.extend(&structure.controllers);
    all_classes.extend(&structure.services);
    all_classes.extend(&structure.repositories);
    all_classes.extend(&structure.entities);
    all_classes.extend(&structure.mappers);
    all_classes.extend(&structure.configurations);

    let total_classes = all_classes.len();
    let total_methods: usize = all_classes.iter().map(|c| c.method_count).sum();
    let avg_methods = if total_classes > 0 {
        total_methods as f64 / total_classes as f64
    } else {
        0.0
    };

    let largest_class = all_classes
        .iter()
        .max_by_key(|c| c.line_count)
        .cloned()
        .cloned();

    let mut risks = detect_risks(structure, &all_classes);

    risks.sort_by(|a, b| {
        let order = |s: &str| match s {
            "HIGH" => 0,
            "MEDIUM" => 1,
            "LOW" => 2,
            _ => 3,
        };
        order(&a.severity).cmp(&order(&b.severity))
    });

    CodeQuality {
        total_classes,
        total_methods,
        avg_methods_per_class: (avg_methods * 10.0).round() / 10.0,
        largest_class,
        risks,
    }
}

fn detect_risks(structure: &ProjectStructure, _all_classes: &[&ClassInfo]) -> Vec<RiskItem> {
    let mut risks = Vec::new();

    for ctrl in &structure.controllers {
        if ctrl.line_count > 300 {
            risks.push(RiskItem {
                severity: "HIGH".to_string(),
                category: "Controller too large".to_string(),
                message: format!(
                    "{}  has  {}  lines, consider splitting",
                    ctrl.name, ctrl.line_count
                ),
                file_path: Some(ctrl.file_path.clone()),
                evidence: Some(format!("{} lines", ctrl.line_count)),
            });
        }
    }

    for svc in &structure.services {
        if svc.method_count > 20 {
            risks.push(RiskItem {
                severity: "MEDIUM".to_string(),
                category: "Service too many methods".to_string(),
                message: format!(
                    "{}  has  {}  methods, consider splitting",
                    svc.name, svc.method_count
                ),
                file_path: Some(svc.file_path.clone()),
                evidence: Some(format!("{} methods", svc.method_count)),
            });
        }
    }

    if !structure.directories.src_test && !structure.directories.src_main {
        // only report missing tests when directory structure is detected
        // skip for Go/Rust/Python/TS projects that do not use src/main structure
    }

    if !structure.services.is_empty() && structure.controllers.len() > structure.services.len() * 3
    {
        risks.push(RiskItem {
            severity: "MEDIUM".to_string(),
            category: "Module ratio imbalance".to_string(),
            message: format!(
                "Controller({})  far exceeds  Service({}),  logic may leak into  Controller  risk",
                structure.controllers.len(),
                structure.services.len()
            ),
            file_path: None,
            evidence: None,
        });
    }

    for entity in &structure.entities {
        if entity.line_count > 200 {
            risks.push(RiskItem {
                severity: "MEDIUM".to_string(),
                category: "Entity too large".to_string(),
                message: format!(
                    "{}  has  {}  lines,  too many fields, consider splitting",
                    entity.name, entity.line_count
                ),
                file_path: Some(entity.file_path.clone()),
                evidence: Some(format!("{} lines", entity.line_count)),
            });
        }
    }

    for config in &structure.config_files {
        let full_path = std::path::Path::new(config);
        if full_path
            .extension()
            .map(|e| e == "yml" || e == "yaml" || e == "properties" || e == "env")
            .unwrap_or(false)
        {
            if let Some(content) = read_file_str(full_path) {
                let lower = content.to_lowercase();
                if lower.contains("password")
                    && (lower.contains("${")
                        || lower.contains("default")
                        || lower.contains("secret"))
                {
                    risks.push(RiskItem {
                        severity: "MEDIUM".to_string(),
                        category: "Config Security".to_string(),
                        message: format!(
                            "Config file {}  may contain hardcoded or default passwords",
                            config
                        ),
                        file_path: Some(config.clone()),
                        evidence: Some("password keyword detected".to_string()),
                    });
                }
            }
        }
    }

    risks
}
