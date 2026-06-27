mod ast_extractor;
mod framework;
mod models;
mod reverse;
mod scanner;

use clap::{Parser, Subcommand};
use std::collections::HashMap;
use std::path::PathBuf;

use framework::{analyze_code_quality, analyze_structure, detect_framework};
use models::{ScanResult, SCAN_RESULT_SCHEMA_VERSION};
use reverse::analyze_symbols;
use scanner::build_file_tree;

#[derive(Parser)]
#[command(name = "sourcelens-analyzer")]
#[command(about = "SourceLens 代码分析引擎 — 支持 Java/Go/Python/TypeScript/Rust 多语言", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// 扫描仓库目录,输出结构化分析结果
    Scan {
        /// 仓库根目录路径
        #[arg(short, long)]
        repo_path: PathBuf,
    },
}

fn detect_primary_language(lang_stats: &HashMap<String, models::LanguageStat>) -> String {
    lang_stats
        .iter()
        .max_by_key(|(_, stat)| stat.line_count)
        .map(|(lang, _)| lang.clone())
        .unwrap_or_else(|| "Unknown".to_string())
}

fn main() {
    let cli = Cli::parse();

    match cli.command {
        Commands::Scan { repo_path } => {
            if !repo_path.exists() {
                eprintln!("{{\"error\": \"路径不存在: {}\"}}", repo_path.display());
                std::process::exit(1);
            }

            if !repo_path.is_dir() {
                eprintln!("{{\"error\": \"路径不是目录: {}\"}}", repo_path.display());
                std::process::exit(1);
            }

            eprintln!("[SourceLens Analyzer] 开始扫描: {}", repo_path.display());

            // 1. 构建文件树 + 语言统计
            let (file_tree, language_stats) = build_file_tree(&repo_path);
            let primary_language = detect_primary_language(&language_stats);
            eprintln!(
                "[SourceLens Analyzer] 文件扫描完成: {} 文件, {} 目录, {} 行代码, 主语言: {}",
                file_tree.total_files,
                file_tree.total_dirs,
                file_tree.total_lines,
                primary_language,
            );

            // 2. 框架检测（基于主语言）
            let framework = detect_framework(&repo_path, &primary_language);
            if let Some(ref fw) = framework {
                eprintln!(
                    "[SourceLens Analyzer] 检测到框架: {} {:?}",
                    fw.name, fw.version
                );
            } else {
                eprintln!("[SourceLens Analyzer] 未检测到特定框架, 将进行通用分析");
            }

            // 3. 项目结构分析（多语言）
            eprintln!(
                "[SourceLens Analyzer] 分析 {} 项目结构...",
                primary_language
            );
            let structure = analyze_structure(&repo_path, &primary_language, &framework);
            eprintln!(
                "[SourceLens Analyzer] 结构分析完成: {} controllers/routes, {} services, {} repositories, {} entities, {} API routes",
                structure.controllers.len(),
                structure.services.len(),
                structure.repositories.len(),
                structure.entities.len(),
                structure.api_routes.len(),
            );

            // 4. 代码质量分析
            let code_quality = analyze_code_quality(&structure);
            eprintln!(
                "[SourceLens Analyzer] 代码质量: {} 类/结构体, {} 方法/函数, {} 风险项",
                code_quality.total_classes,
                code_quality.total_methods,
                code_quality.risks.len()
            );

            // 5. 源码级逆向：符号提取 + 调用关系 + 依赖图
            let (symbols, relations, graph) = analyze_symbols(&repo_path, &primary_language);
            eprintln!(
                "[SourceLens Analyzer] 符号分析: {} 符号, {} 关系, {} 图节点, {} 图边",
                symbols.len(),
                relations.len(),
                graph.nodes.len(),
                graph.edges.len()
            );

            // 6. 组装结果
            let result = ScanResult {
                scan_result_schema_version: SCAN_RESULT_SCHEMA_VERSION,
                repo_path: repo_path.to_string_lossy().to_string(),
                language: primary_language,
                file_tree,
                language_stats,
                framework,
                structure,
                code_quality,
                symbols,
                relations,
                graph,
            };

            // 7. 输出 JSON
            match serde_json::to_string_pretty(&result) {
                Ok(json) => {
                    println!("{}", json);
                    eprintln!("[SourceLens Analyzer] 分析完成");
                }
                Err(e) => {
                    eprintln!("{{\"error\": \"JSON 序列化失败: {}\"}}", e);
                    std::process::exit(1);
                }
            }
        }
    }
}
