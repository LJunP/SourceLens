#![allow(dead_code)]
use regex::Regex;
use std::collections::HashSet;
use std::path::Path;
use walkdir::WalkDir;

use crate::models::{CodeRelation, CodeSymbol, DependencyGraph};

// ============================================================
// 入口
// ============================================================

/// 根据主语言分发到对应提取器
pub fn analyze_symbols(
    repo_path: &Path,
    primary_language: &str,
) -> (Vec<CodeSymbol>, Vec<CodeRelation>, DependencyGraph) {
    match primary_language {
        "Java" => extract_java_symbols(repo_path),
        "Go" => extract_symbols_via_ast(repo_path, &["go"]),
        "Python" => extract_symbols_via_ast(repo_path, &["py"]),
        "TypeScript" | "JavaScript" => {
            extract_symbols_via_ast(repo_path, &["ts", "tsx", "js", "jsx"])
        }
        "Rust" => extract_symbols_via_ast(repo_path, &["rs"]),
        _ => (Vec::new(), Vec::new(), empty_graph()),
    }
}

fn extract_symbols_via_ast(
    repo_path: &Path,
    allowed_extensions: &[&str],
) -> (Vec<CodeSymbol>, Vec<CodeRelation>, DependencyGraph) {
    let mut symbols = Vec::new();
    let mut relations = Vec::new();
    let extractor = crate::ast_extractor::AstExtractor::new();

    for entry in WalkDir::new(repo_path)
        .into_iter()
        .filter_entry(|e| !is_skipped(&e.file_name().to_string_lossy()))
        .filter_map(|e| e.ok())
    {
        let path = entry.path();
        if !path.is_file() {
            continue;
        }
        let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("");
        if !allowed_extensions.contains(&ext) {
            continue;
        }

        let rp = rel_path_str(path, repo_path);
        if let Ok((mut file_syms, mut file_rels)) = extractor.extract_file(path, &rp) {
            symbols.append(&mut file_syms);
            relations.append(&mut file_rels);
        }
    }

    let graph = build_dependency_graph(&relations, &symbols);
    (symbols, relations, graph)
}

fn empty_graph() -> DependencyGraph {
    DependencyGraph {
        nodes: Vec::new(),
        edges: Vec::new(),
    }
}

fn is_skipped(name: &str) -> bool {
    matches!(
        name,
        ".git"
            | "node_modules"
            | "target"
            | "build"
            | "dist"
            | "__pycache__"
            | ".idea"
            | ".vscode"
            | "vendor"
            | ".gradle"
            | ".mvn"
    )
}

fn file_stem(path: &Path) -> String {
    path.file_stem()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default()
}

fn rel_path_str(path: &Path, repo: &Path) -> String {
    path.strip_prefix(repo)
        .unwrap_or(path)
        .to_string_lossy()
        .to_string()
}

fn read_file(path: &Path) -> Option<String> {
    std::fs::read_to_string(path).ok()
}

// ============================================================
// Java 符号提取
// ============================================================

fn extract_java_symbols(repo_path: &Path) -> (Vec<CodeSymbol>, Vec<CodeRelation>, DependencyGraph) {
    let mut symbols = Vec::new();
    let mut relations = Vec::new();

    let class_re =
        Regex::new(r"(?:public|protected|private|abstract)\s+(?:class|interface|enum)\s+(\w+)")
            .unwrap();
    let method_re = Regex::new(r"(?:public|protected|private)\s+(?:static\s+)?(?:final\s+)?(?:synchronized\s+)?(\S+)\s+(\w+)\s*\(").unwrap();
    let field_re = Regex::new(
        r"(?:private|protected|public)\s+(?:static\s+)?(?:final\s+)?(\S+)\s+(\w+)\s*[;=]",
    )
    .unwrap();
    let inject_re = Regex::new(r"@(?:Autowired|Inject|Resource)\s").unwrap();
    let constructor_re = Regex::new(r"(?:public|protected|private)\s+(\w+)\s*\(([^)]*)\)").unwrap();

    for entry in WalkDir::new(repo_path)
        .into_iter()
        .filter_entry(|e| !is_skipped(&e.file_name().to_string_lossy()))
        .filter_map(|e| e.ok())
    {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("java") {
            continue;
        }
        let content = match read_file(path) {
            Some(c) => c,
            None => continue,
        };
        let rp = rel_path_str(path, repo_path);

        let package = content
            .lines()
            .find(|l| l.trim_start().starts_with("package "))
            .map(|l| {
                l.trim()
                    .trim_start_matches("package ")
                    .trim_end_matches(';')
                    .trim()
                    .to_string()
            })
            .unwrap_or_default();

        // 类/接口/枚举
        for cap in class_re.captures_iter(&content) {
            let class_name = cap[1].to_string();
            let kind = if content.contains(&format!("interface {}", class_name)) {
                "INTERFACE"
            } else if content.contains(&format!("enum {}", class_name)) {
                "ENUM"
            } else {
                "CLASS"
            };

            let line_number = content[..cap.get(0).unwrap().start()].lines().count() + 1;

            let symbol_id = format!("{}#{}", package, class_name);

            // extends / implements
            let extends_re =
                Regex::new(&format!(r"class\s+{}\s+extends\s+(\w+)", class_name)).unwrap();
            let implements_re = Regex::new(&format!(
                r"class\s+{}\s+implements\s+([\w,\s]+)",
                class_name
            ))
            .unwrap();

            if let Some(ext_cap) = extends_re.captures(&content) {
                let parent = ext_cap[1].to_string();
                let parent_id = resolve_java_class_id(&parent, &content);
                relations.push(CodeRelation {
                    source_id: symbol_id.clone(),
                    target_id: parent_id,
                    relation_type: "EXTENDS".to_string(),
                    file_path: rp.clone(),
                    line_number,
                });
            }

            if let Some(imp_cap) = implements_re.captures(&content) {
                for iface in imp_cap[1].split(',') {
                    let iface = iface.trim().to_string();
                    if !iface.is_empty() {
                        let iface_id = resolve_java_class_id(&iface, &content);
                        relations.push(CodeRelation {
                            source_id: symbol_id.clone(),
                            target_id: iface_id,
                            relation_type: "IMPLEMENTS".to_string(),
                            file_path: rp.clone(),
                            line_number,
                        });
                    }
                }
            }

            symbols.push(CodeSymbol {
                symbol_id,
                name: class_name,
                kind: kind.to_string(),
                package: package.clone(),
                file_path: rp.clone(),
                line_number,
                end_line: None,
                return_type: None,
                parent_class: None,
            });
        }

        // 字段 + @Autowired 依赖
        let mut in_class = false;
        for (line_idx, line) in content.lines().enumerate() {
            let trimmed = line.trim();
            if class_re.is_match(trimmed) {
                in_class = true;
            }
            if !in_class {
                continue;
            }
            if inject_re.is_match(trimmed) {
                if let Some(field_cap) = field_re.captures(trimmed) {
                    let field_type = field_cap[1].to_string();
                    let field_name = field_cap[2].to_string();
                    let source_class = extract_class_name_from_path(&rp);
                    let target_id = resolve_java_class_id(&field_type, &content);
                    let symbol_id = format!("{}.{}#{}", package, source_class, field_name);

                    symbols.push(CodeSymbol {
                        symbol_id: symbol_id.clone(),
                        name: field_name,
                        kind: "FIELD".to_string(),
                        package: package.clone(),
                        file_path: rp.clone(),
                        line_number: line_idx + 1,
                        end_line: None,
                        return_type: Some(field_type),
                        parent_class: Some(source_class.clone()),
                    });

                    relations.push(CodeRelation {
                        source_id: format!("{}#{}", package, source_class),
                        target_id,
                        relation_type: "DEPENDS_ON".to_string(),
                        file_path: rp.clone(),
                        line_number: line_idx + 1,
                    });
                }
            }
        }

        // 方法
        let class_name = extract_class_name_from_path(&rp);
        for (line_idx, line) in content.lines().enumerate() {
            if let Some(m_cap) = method_re.captures(line.trim()) {
                let return_type = m_cap[1].to_string();
                let method_name = m_cap[2].to_string();
                symbols.push(CodeSymbol {
                    symbol_id: format!("{}.{}#{}()", package, class_name, method_name),
                    name: method_name,
                    kind: "METHOD".to_string(),
                    package: package.clone(),
                    file_path: rp.clone(),
                    line_number: line_idx + 1,
                    end_line: None,
                    return_type: Some(return_type),
                    parent_class: Some(class_name.clone()),
                });
            }
        }

        // 构造函数注入
        for cap in constructor_re.captures_iter(&content) {
            let ctor_name = cap[1].to_string();
            let params = cap[2].to_string();
            if params.is_empty() || ctor_name != class_name {
                continue;
            }
            let source_class = ctor_name.clone();
            for param in params.split(',') {
                let parts: Vec<&str> = param.trim().split_whitespace().collect();
                if parts.len() >= 2 {
                    let param_type = parts[parts.len() - 2];
                    let target_id = resolve_java_class_id(param_type, &content);
                    relations.push(CodeRelation {
                        source_id: format!("{}#{}", package, source_class),
                        target_id,
                        relation_type: "DEPENDS_ON".to_string(),
                        file_path: rp.clone(),
                        line_number: 0,
                    });
                }
            }
        }
    }

    let graph = build_dependency_graph(&relations, &symbols);
    (symbols, relations, graph)
}

fn extract_class_name_from_path(rel_path: &str) -> String {
    std::path::Path::new(rel_path)
        .file_stem()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default()
}

fn resolve_java_class_id(class_name: &str, file_content: &str) -> String {
    let import_re = Regex::new(&format!(r"import\s+[\w.]*\.{}\s*;", class_name)).unwrap();
    if let Some(cap) = import_re.captures(file_content) {
        cap[0]
            .trim()
            .trim_start_matches("import ")
            .trim_end_matches(';')
            .trim()
            .to_string()
    } else {
        format!(".{}", class_name)
    }
}

// ============================================================
// Go 符号提取
// ============================================================

fn extract_go_symbols(repo_path: &Path) -> (Vec<CodeSymbol>, Vec<CodeRelation>, DependencyGraph) {
    let mut symbols = Vec::new();
    let mut relations = Vec::new();

    let pkg_re = Regex::new(r"^package\s+(\w+)").unwrap();
    let struct_re = Regex::new(r"^type\s+(\w+)\s+struct\s*\{").unwrap();
    let iface_re = Regex::new(r"^type\s+(\w+)\s+interface\s*\{").unwrap();
    let func_re = Regex::new(r"^func\s+(?:\((\w+)\s+\*?(\w+)\)\s+)?(\w+)\s*\(").unwrap();
    let embed_re = Regex::new(r"^\s+(\w+)\s*(?://.*)?$").unwrap();

    for entry in WalkDir::new(repo_path)
        .into_iter()
        .filter_entry(|e| !is_skipped(&e.file_name().to_string_lossy()))
        .filter_map(|e| e.ok())
    {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("go") {
            continue;
        }
        let content = match read_file(path) {
            Some(c) => c,
            None => continue,
        };
        let rp = rel_path_str(path, repo_path);

        let package = pkg_re
            .captures(&content)
            .map(|c| c[1].to_string())
            .unwrap_or_else(|| {
                // 从目录名推断
                std::path::Path::new(&rp)
                    .parent()
                    .and_then(|p| p.file_name())
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_default()
            });

        let symbol_base = format!("{}.{}", package, file_stem(path));

        // struct 定义
        for cap in struct_re.captures_iter(&content) {
            let name = cap[1].to_string();
            let line_number = content[..cap.get(0).unwrap().start()].lines().count() + 1;
            let symbol_id = format!("{}#{}", symbol_base, name);

            symbols.push(CodeSymbol {
                symbol_id: symbol_id.clone(),
                name: name.clone(),
                kind: "STRUCT".to_string(),
                package: package.clone(),
                file_path: rp.clone(),
                line_number,
                end_line: None,
                return_type: None,
                parent_class: None,
            });

            // 扫描 struct body 中的嵌入字段
            if let Some(start) = content[cap.get(0).unwrap().end()..].find('{') {
                let body_start = cap.get(0).unwrap().end() + start + 1;
                if let Some(end) = content[body_start..].find('}') {
                    let body = &content[body_start..body_start + end];
                    for line in body.lines() {
                        let trimmed = line.trim();
                        if trimmed.is_empty() || trimmed.starts_with("//") {
                            continue;
                        }
                        // 嵌入字段（如 db.Model、gorm.Model）
                        if let Some(embed_cap) = embed_re.captures(trimmed) {
                            let embed_name = embed_cap[1].to_string();
                            // 排除 json tag 等
                            if embed_name.contains('"') || embed_name.contains(':') {
                                continue;
                            }
                            relations.push(CodeRelation {
                                source_id: symbol_id.clone(),
                                target_id: format!("{}#{}", symbol_base, embed_name),
                                relation_type: "EMBEDS".to_string(),
                                file_path: rp.clone(),
                                line_number,
                            });
                        }
                    }
                }
            }
        }

        // interface 定义
        for cap in iface_re.captures_iter(&content) {
            let name = cap[1].to_string();
            let line_number = content[..cap.get(0).unwrap().start()].lines().count() + 1;
            symbols.push(CodeSymbol {
                symbol_id: format!("{}#{}", symbol_base, name),
                name,
                kind: "INTERFACE".to_string(),
                package: package.clone(),
                file_path: rp.clone(),
                line_number,
                end_line: None,
                return_type: None,
                parent_class: None,
            });
        }

        // 函数/方法
        for cap in func_re.captures_iter(&content) {
            let _receiver_var = cap.get(1).map(|m| m.as_str().to_string());
            let receiver_type = cap.get(2).map(|m| m.as_str().to_string());
            let func_name = cap[3].to_string();
            let line_number = content[..cap.get(0).unwrap().start()].lines().count() + 1;

            let kind = if receiver_type.is_some() {
                "METHOD"
            } else {
                "FUNCTION"
            };
            let symbol_id = if let Some(ref rt) = receiver_type {
                format!("{}.{}#{}.{}", package, file_stem(path), rt, func_name)
            } else {
                format!("{}#{}", symbol_base, func_name)
            };

            symbols.push(CodeSymbol {
                symbol_id: symbol_id.clone(),
                name: func_name,
                kind: kind.to_string(),
                package: package.clone(),
                file_path: rp.clone(),
                line_number,
                end_line: None,
                return_type: None,
                parent_class: receiver_type.clone(),
            });

            // 方法 → 挂到 struct 的关系
            if let Some(ref rt) = receiver_type {
                relations.push(CodeRelation {
                    source_id: symbol_id,
                    target_id: format!("{}#{}", symbol_base, rt),
                    relation_type: "BELONGS_TO".to_string(),
                    file_path: rp.clone(),
                    line_number,
                });
            }
        }
    }

    let graph = build_dependency_graph(&relations, &symbols);
    (symbols, relations, graph)
}

// ============================================================
// Python 符号提取
// ============================================================

fn extract_python_symbols(
    repo_path: &Path,
) -> (Vec<CodeSymbol>, Vec<CodeRelation>, DependencyGraph) {
    let mut symbols = Vec::new();
    let mut relations = Vec::new();

    let class_re = Regex::new(r"^class\s+(\w+)(?:\(([^)]*)\))?:").unwrap();
    let func_re = Regex::new(r"^(?:    )?(?:async\s+)?def\s+(\w+)\s*\(").unwrap();
    let import_re = Regex::new(r"^(?:from\s+([\w.]+)\s+)?import\s+(.+)").unwrap();

    for entry in WalkDir::new(repo_path)
        .into_iter()
        .filter_entry(|e| !is_skipped(&e.file_name().to_string_lossy()))
        .filter_map(|e| e.ok())
    {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("py") {
            continue;
        }
        let content = match read_file(path) {
            Some(c) => c,
            None => continue,
        };
        let rp = rel_path_str(path, repo_path);
        let _file_name = file_stem(path);

        // 推断模块路径
        let module = rp
            .trim_end_matches(".py")
            .replace('/', ".")
            .replace('\\', ".");

        // import 关系
        for cap in import_re.captures_iter(&content) {
            let from_module = cap.get(1).map(|m| m.as_str()).unwrap_or("");
            let imports = cap[2].to_string();
            for imp in imports.split(',') {
                let imp = imp.trim().split(" as ").next().unwrap_or("").trim();
                if imp.is_empty() || imp == "*" {
                    continue;
                }
                let target_id = if from_module.is_empty() {
                    imp.to_string()
                } else {
                    format!("{}.{}", from_module, imp)
                };
                relations.push(CodeRelation {
                    source_id: module.clone(),
                    target_id,
                    relation_type: "USES".to_string(),
                    file_path: rp.clone(),
                    line_number: 0,
                });
            }
        }

        // class 定义
        for cap in class_re.captures_iter(&content) {
            let class_name = cap[1].to_string();
            let bases = cap.get(2).map(|m| m.as_str()).unwrap_or("");
            let line_number = content[..cap.get(0).unwrap().start()].lines().count() + 1;
            let symbol_id = format!("{}.{}", module, class_name);

            symbols.push(CodeSymbol {
                symbol_id: symbol_id.clone(),
                name: class_name.clone(),
                kind: "CLASS".to_string(),
                package: module.clone(),
                file_path: rp.clone(),
                line_number,
                end_line: None,
                return_type: None,
                parent_class: None,
            });

            // 继承关系
            for base in bases.split(',') {
                let base = base.trim().to_string();
                if base.is_empty() || base == "object" || base == "BaseModel" {
                    continue;
                }
                relations.push(CodeRelation {
                    source_id: symbol_id.clone(),
                    target_id: base,
                    relation_type: "EXTENDS".to_string(),
                    file_path: rp.clone(),
                    line_number,
                });
            }
        }

        // 函数定义
        for cap in func_re.captures_iter(&content) {
            let func_name = cap[1].to_string();
            if func_name.starts_with('_') && !func_name.starts_with("__") {
                continue; // 跳过私有函数
            }
            let line_number = content[..cap.get(0).unwrap().start()].lines().count() + 1;
            symbols.push(CodeSymbol {
                symbol_id: format!("{}.{}", module, func_name),
                name: func_name,
                kind: "FUNCTION".to_string(),
                package: module.clone(),
                file_path: rp.clone(),
                line_number,
                end_line: None,
                return_type: None,
                parent_class: None,
            });
        }
    }

    let graph = build_dependency_graph(&relations, &symbols);
    (symbols, relations, graph)
}

// ============================================================
// TypeScript / JavaScript 符号提取
// ============================================================

fn extract_tsjs_symbols(repo_path: &Path) -> (Vec<CodeSymbol>, Vec<CodeRelation>, DependencyGraph) {
    let mut symbols = Vec::new();
    let mut relations = Vec::new();

    let class_re = Regex::new(r"(?:export\s+)?(?:abstract\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([\w,\s]+))?").unwrap();
    let interface_re = Regex::new(r"(?:export\s+)?(?:declare\s+)?interface\s+(\w+)").unwrap();
    let type_re = Regex::new(r"(?:export\s+)?type\s+(\w+)").unwrap();
    let func_re = Regex::new(r"(?:export\s+)?(?:async\s+)?function\s+(\w+)").unwrap();
    let _method_re =
        Regex::new(r"(?:public|private|protected|static|async|get|set)\s+(\w+)\s*\(").unwrap();
    let import_re = Regex::new(r#"^(?:import|export)\s+.*from\s+['"]([^'"]+)['"]"#).unwrap();
    let require_re = Regex::new(r#"require\s*\(\s*['"]([^'"]+)['"]\s*\)"#).unwrap();

    for entry in WalkDir::new(repo_path)
        .into_iter()
        .filter_entry(|e| !is_skipped(&e.file_name().to_string_lossy()))
        .filter_map(|e| e.ok())
    {
        let path = entry.path();
        let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("");
        if !matches!(ext, "ts" | "tsx" | "js" | "jsx") {
            continue;
        }
        let content = match read_file(path) {
            Some(c) => c,
            None => continue,
        };
        let rp = rel_path_str(path, repo_path);
        let _file_name = file_stem(path);
        let module = rp
            .trim_end_matches(".tsx")
            .trim_end_matches(".ts")
            .trim_end_matches(".jsx")
            .trim_end_matches(".js")
            .replace('/', ".")
            .replace('\\', ".");

        // import 依赖
        for cap in import_re.captures_iter(&content) {
            let target = cap[1].to_string();
            if target.starts_with('.') {
                // 相对路径 → 转为模块 ID
                let base_dir = std::path::Path::new(&rp)
                    .parent()
                    .map(|p| p.to_string_lossy().to_string())
                    .unwrap_or_default();
                let resolved = format!("{}/{}", base_dir, target)
                    .replace("./", "")
                    .replace("//", "/");
                relations.push(CodeRelation {
                    source_id: module.clone(),
                    target_id: resolved,
                    relation_type: "USES".to_string(),
                    file_path: rp.clone(),
                    line_number: 0,
                });
            } else {
                // npm 包
                relations.push(CodeRelation {
                    source_id: module.clone(),
                    target_id: target,
                    relation_type: "DEPENDS_ON".to_string(),
                    file_path: rp.clone(),
                    line_number: 0,
                });
            }
        }

        // require
        for cap in require_re.captures_iter(&content) {
            let target = cap[1].to_string();
            relations.push(CodeRelation {
                source_id: module.clone(),
                target_id: target,
                relation_type: "DEPENDS_ON".to_string(),
                file_path: rp.clone(),
                line_number: 0,
            });
        }

        // class
        for cap in class_re.captures_iter(&content) {
            let class_name = cap[1].to_string();
            let parent = cap.get(2).map(|m| m.as_str().to_string());
            let implements = cap.get(3).map(|m| m.as_str().to_string());
            let line_number = content[..cap.get(0).unwrap().start()].lines().count() + 1;
            let symbol_id = format!("{}.{}", module, class_name);

            symbols.push(CodeSymbol {
                symbol_id: symbol_id.clone(),
                name: class_name.clone(),
                kind: "CLASS".to_string(),
                package: module.clone(),
                file_path: rp.clone(),
                line_number,
                end_line: None,
                return_type: None,
                parent_class: None,
            });

            if let Some(p) = parent {
                relations.push(CodeRelation {
                    source_id: symbol_id.clone(),
                    target_id: p,
                    relation_type: "EXTENDS".to_string(),
                    file_path: rp.clone(),
                    line_number,
                });
            }
            if let Some(ifaces) = implements {
                for iface in ifaces.split(',') {
                    let iface = iface.trim().to_string();
                    if !iface.is_empty() {
                        relations.push(CodeRelation {
                            source_id: symbol_id.clone(),
                            target_id: iface,
                            relation_type: "IMPLEMENTS".to_string(),
                            file_path: rp.clone(),
                            line_number,
                        });
                    }
                }
            }
        }

        // interface
        for cap in interface_re.captures_iter(&content) {
            let name = cap[1].to_string();
            let line_number = content[..cap.get(0).unwrap().start()].lines().count() + 1;
            symbols.push(CodeSymbol {
                symbol_id: format!("{}.{}", module, name),
                name,
                kind: "INTERFACE".to_string(),
                package: module.clone(),
                file_path: rp.clone(),
                line_number,
                end_line: None,
                return_type: None,
                parent_class: None,
            });
        }

        // type alias
        for cap in type_re.captures_iter(&content) {
            let name = cap[1].to_string();
            let line_number = content[..cap.get(0).unwrap().start()].lines().count() + 1;
            symbols.push(CodeSymbol {
                symbol_id: format!("{}.{}", module, name),
                name,
                kind: "TYPE".to_string(),
                package: module.clone(),
                file_path: rp.clone(),
                line_number,
                end_line: None,
                return_type: None,
                parent_class: None,
            });
        }

        // function
        for cap in func_re.captures_iter(&content) {
            let func_name = cap[1].to_string();
            let line_number = content[..cap.get(0).unwrap().start()].lines().count() + 1;
            symbols.push(CodeSymbol {
                symbol_id: format!("{}.{}", module, func_name),
                name: func_name,
                kind: "FUNCTION".to_string(),
                package: module.clone(),
                file_path: rp.clone(),
                line_number,
                end_line: None,
                return_type: None,
                parent_class: None,
            });
        }
    }

    let graph = build_dependency_graph(&relations, &symbols);
    (symbols, relations, graph)
}

// ============================================================
// Rust 符号提取
// ============================================================

fn extract_rust_symbols(repo_path: &Path) -> (Vec<CodeSymbol>, Vec<CodeRelation>, DependencyGraph) {
    let mut symbols = Vec::new();
    let mut relations = Vec::new();

    let mod_re = Regex::new(r"^mod\s+(\w+)").unwrap();
    let use_re = Regex::new(r"^use\s+([\w:]+(?:::\{[^}]+\})?)").unwrap();
    let struct_re = Regex::new(r"^pub\s+(?:struct|enum)\s+(\w+)").unwrap();
    let trait_re = Regex::new(r"^pub\s+trait\s+(\w+)").unwrap();
    let fn_re = Regex::new(r"^pub\s+(?:async\s+)?fn\s+(\w+)").unwrap();
    let impl_re = Regex::new(r"^impl(?:<[^>]+>)?\s+(\w+)").unwrap();
    let derive_re = Regex::new(r"#\[derive\(([^)]+)\)\]").unwrap();
    let pub_use_re = Regex::new(r"^pub\s+use\s+([\w:]+)").unwrap();

    for entry in WalkDir::new(repo_path)
        .into_iter()
        .filter_entry(|e| !is_skipped(&e.file_name().to_string_lossy()))
        .filter_map(|e| e.ok())
    {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("rs") {
            continue;
        }
        let content = match read_file(path) {
            Some(c) => c,
            None => continue,
        };
        let rp = rel_path_str(path, repo_path);
        let crate_name = "crate"; // 简化处理

        let symbol_base = format!(
            "{}::{}",
            crate_name,
            rp.trim_end_matches(".rs").replace('/', "::")
        );

        // use 导入
        for cap in use_re.captures_iter(&content) {
            let target = cap[1].to_string();
            // 展开 {A, B, C} 形式
            if target.contains('{') {
                if let Some(base) = target.split("::").next() {
                    if let Some(brace_start) = target.find('{') {
                        if let Some(brace_end) = target.find('}') {
                            let inner = &target[brace_start + 1..brace_end];
                            for item in inner.split(',') {
                                let item = item.trim();
                                if !item.is_empty() {
                                    relations.push(CodeRelation {
                                        source_id: symbol_base.clone(),
                                        target_id: format!("{}::{}", base, item),
                                        relation_type: "USES".to_string(),
                                        file_path: rp.clone(),
                                        line_number: 0,
                                    });
                                }
                            }
                        }
                    }
                }
            } else {
                relations.push(CodeRelation {
                    source_id: symbol_base.clone(),
                    target_id: target,
                    relation_type: "USES".to_string(),
                    file_path: rp.clone(),
                    line_number: 0,
                });
            }
        }

        // pub use 导出
        for cap in pub_use_re.captures_iter(&content) {
            let target = cap[1].to_string();
            relations.push(CodeRelation {
                source_id: symbol_base.clone(),
                target_id: target,
                relation_type: "REEXPORTS".to_string(),
                file_path: rp.clone(),
                line_number: 0,
            });
        }

        // mod 声明
        for cap in mod_re.captures_iter(&content) {
            let mod_name = cap[1].to_string();
            relations.push(CodeRelation {
                source_id: symbol_base.clone(),
                target_id: format!("{}::{}", crate_name, mod_name),
                relation_type: "CONTAINS".to_string(),
                file_path: rp.clone(),
                line_number: 0,
            });
        }

        // derive 属性
        let mut _current_derive = String::new();

        // struct / enum
        for cap in struct_re.captures_iter(&content) {
            let name = cap[1].to_string();
            let line_number = content[..cap.get(0).unwrap().start()].lines().count() + 1;

            // 检查前面的 derive
            let before = &content[..cap.get(0).unwrap().start()];
            let derives: Vec<String> = derive_re
                .captures_iter(before)
                .last()
                .map(|dc| dc[1].split(',').map(|d| d.trim().to_string()).collect())
                .unwrap_or_default();

            let kind = if content.contains(&format!("enum {}", name)) {
                "ENUM"
            } else {
                "STRUCT"
            };

            let symbol_id = format!("{}::{}", symbol_base, name);
            symbols.push(CodeSymbol {
                symbol_id,
                name: name.clone(),
                kind: kind.to_string(),
                package: crate_name.to_string(),
                file_path: rp.clone(),
                line_number,
                end_line: None,
                return_type: None,
                parent_class: None,
            });

            // 序列化 derive → 标记为数据模型
            if derives
                .iter()
                .any(|d| d == "Serialize" || d == "Queryable" || d == "FromRow")
            {
                _current_derive = name;
            }
        }

        // trait
        for cap in trait_re.captures_iter(&content) {
            let name = cap[1].to_string();
            let line_number = content[..cap.get(0).unwrap().start()].lines().count() + 1;
            symbols.push(CodeSymbol {
                symbol_id: format!("{}::{}", symbol_base, name),
                name,
                kind: "TRAIT".to_string(),
                package: crate_name.to_string(),
                file_path: rp.clone(),
                line_number,
                end_line: None,
                return_type: None,
                parent_class: None,
            });
        }

        // impl 块
        for cap in impl_re.captures_iter(&content) {
            let target_type = cap[1].to_string();
            let line_number = content[..cap.get(0).unwrap().start()].lines().count() + 1;
            // impl 块内的方法
            if let Some(start) = content[cap.get(0).unwrap().end()..].find('{') {
                let body_start = cap.get(0).unwrap().end() + start + 1;
                if let Some(end) = content[body_start..].find('}') {
                    let body = &content[body_start..body_start + end];
                    for line in body.lines() {
                        if let Some(fn_cap) = fn_re.captures(line.trim()) {
                            let fn_name = fn_cap[1].to_string();
                            relations.push(CodeRelation {
                                source_id: format!("{}.{}#{}", symbol_base, target_type, fn_name),
                                target_id: format!("{}::{}", symbol_base, target_type),
                                relation_type: "IMPLEMENTS".to_string(),
                                file_path: rp.clone(),
                                line_number,
                            });
                        }
                    }
                }
            }
        }
    }

    let graph = build_dependency_graph(&relations, &symbols);
    (symbols, relations, graph)
}

// ============================================================
// 通用依赖图构建
// ============================================================

fn build_dependency_graph(relations: &[CodeRelation], symbols: &[CodeSymbol]) -> DependencyGraph {
    let mut nodes = Vec::new();
    let mut edges = Vec::new();
    let mut seen_symbols: HashSet<String> = HashSet::new();

    for rel in relations {
        for id in [&rel.source_id, &rel.target_id] {
            if !seen_symbols.contains(id) {
                seen_symbols.insert(id.clone());
                let symbol = symbols.iter().find(|s| s.symbol_id == *id);
                nodes.push(crate::models::GraphNode {
                    id: id.clone(),
                    label: symbol.map(|s| s.name.clone()).unwrap_or_else(|| {
                        id.split(|c: char| c == '.' || c == '#' || c == ':')
                            .last()
                            .unwrap_or(id)
                            .to_string()
                    }),
                    kind: symbol
                        .map(|s| s.kind.clone())
                        .unwrap_or_else(|| "UNKNOWN".to_string()),
                    file_path: symbol.map(|s| s.file_path.clone()),
                    package: symbol.map(|s| s.package.clone()),
                });
            }
        }

        edges.push(crate::models::GraphEdge {
            source: rel.source_id.clone(),
            target: rel.target_id.clone(),
            relation_type: rel.relation_type.clone(),
        });
    }

    // 补充未在关系中出现的符号
    for sym in symbols {
        if !seen_symbols.contains(&sym.symbol_id) {
            nodes.push(crate::models::GraphNode {
                id: sym.symbol_id.clone(),
                label: sym.name.clone(),
                kind: sym.kind.clone(),
                file_path: Some(sym.file_path.clone()),
                package: Some(sym.package.clone()),
            });
        }
    }

    DependencyGraph { nodes, edges }
}
