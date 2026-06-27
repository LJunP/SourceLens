use serde::{Deserialize, Serialize};
use std::collections::HashMap;

pub const SCAN_RESULT_SCHEMA_VERSION: u32 = 2;

/// 扫描结果顶层结构
#[derive(Debug, Serialize, Deserialize)]
pub struct ScanResult {
    pub scan_result_schema_version: u32,
    pub repo_path: String,
    /// 主语言(从 language_stats 中按行数选出)
    pub language: String,
    pub file_tree: FileTree,
    pub language_stats: HashMap<String, LanguageStat>,
    pub framework: Option<FrameworkInfo>,
    pub structure: ProjectStructure,
    pub code_quality: CodeQuality,
    pub symbols: Vec<CodeSymbol>,
    pub relations: Vec<CodeRelation>,
    pub graph: DependencyGraph,
}

/// 文件树节点
#[derive(Debug, Serialize, Deserialize)]
pub struct FileTree {
    pub total_files: usize,
    pub total_dirs: usize,
    pub total_lines: usize,
    pub repo_content_hash: String,
    pub file_manifest: Vec<FileManifestEntry>,
    pub root_dirs: Vec<DirEntry>,
    pub test_files: Vec<String>,
    pub large_files: Vec<LargeFile>,
    pub config_files: Vec<String>,
    pub generated_files: Vec<String>,
}

/// 文件级扫描指纹, 用于增量扫描和重复分析复用
#[derive(Debug, Serialize, Deserialize)]
pub struct FileManifestEntry {
    pub path: String,
    pub language: String,
    pub size_bytes: u64,
    pub line_count: usize,
    pub content_hash_sha256: Option<String>,
    pub is_test: bool,
    pub is_generated: bool,
    pub is_config: bool,
    pub is_large: bool,
    pub is_binary: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DirEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub children: Vec<DirEntry>,
    pub file_count: usize,
}

/// 大文件信息
#[derive(Debug, Serialize, Deserialize)]
pub struct LargeFile {
    pub path: String,
    pub line_count: usize,
    pub size_bytes: u64,
}

/// 单语言统计
#[derive(Debug, Serialize, Deserialize)]
pub struct LanguageStat {
    pub file_count: usize,
    pub line_count: usize,
    pub ext: String,
}

/// 框架检测信息
#[derive(Debug, Serialize, Deserialize)]
pub struct FrameworkInfo {
    pub name: String,
    pub version: Option<String>,
    pub evidence: Vec<String>,
}

/// 项目结构分析(提取的代码元素，通用模型)
///
/// 字段设计:
/// - controllers/routes → HTTP 处理入口 (Java Controller / Go Handler / Python View / TS Handler)
/// - services → 业务逻辑层 (Java Service / Go Service / Python Service / TS Service)
/// - repositories → 数据访问层 (Java Repository / Go DAO / Python Repository / TS Repository)
/// - entities → 数据模型 (Java Entity / Go Struct / Python Model / TS Interface)
/// - mappers → ORM 映射 (Java MyBatis Mapper)
/// - configurations → 配置类 (Java @Configuration / Go config / Python settings / TS config)
/// - api_routes → API 路由表
/// - db_entities → 数据库实体
#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectStructure {
    pub controllers: Vec<ClassInfo>,
    pub services: Vec<ClassInfo>,
    pub repositories: Vec<ClassInfo>,
    pub entities: Vec<ClassInfo>,
    pub mappers: Vec<ClassInfo>,
    pub configurations: Vec<ClassInfo>,
    pub api_routes: Vec<ApiRoute>,
    pub db_entities: Vec<DbEntity>,
    pub config_files: Vec<String>,
    pub entry_points: Vec<String>,
    pub directories: ProjectDirectories,
}

/// 项目目录结构
#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectDirectories {
    pub src_main: bool,
    pub src_test: bool,
    pub src_main_resources: bool,
    pub controller_dir: Vec<String>,
    pub service_dir: Vec<String>,
    pub repository_dir: Vec<String>,
    pub mapper_dir: Vec<String>,
    pub entity_dir: Vec<String>,
    pub dto_dir: Vec<String>,
    pub config_dir: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClassInfo {
    pub name: String,
    pub file_path: String,
    pub package: Option<String>,
    pub annotations: Vec<String>,
    pub line_count: usize,
    pub method_count: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiRoute {
    pub method: String,
    pub path: String,
    pub handler_class: String,
    pub handler_method: String,
    pub line_number: usize,
}

/// 数据库实体
#[derive(Debug, Serialize, Deserialize)]
pub struct DbEntity {
    pub class_name: String,
    pub table_name: Option<String>,
    pub file_path: String,
    pub field_count: usize,
    pub annotations: Vec<String>,
}

/// 代码质量指标
#[derive(Debug, Serialize, Deserialize)]
pub struct CodeQuality {
    pub total_classes: usize,
    pub total_methods: usize,
    pub avg_methods_per_class: f64,
    pub largest_class: Option<ClassInfo>,
    pub risks: Vec<RiskItem>,
}

/// 风险项
#[derive(Debug, Serialize, Deserialize)]
pub struct RiskItem {
    pub severity: String, // HIGH, MEDIUM, LOW
    pub category: String,
    pub message: String,
    pub file_path: Option<String>,
    pub evidence: Option<String>,
}

// ===== V0.4: 源码级逆向 =====

/// 代码符号(类、方法、字段)
#[derive(Debug, Serialize, Deserialize)]
pub struct CodeSymbol {
    pub symbol_id: String,
    pub name: String,
    pub kind: String, // CLASS, INTERFACE, ENUM, METHOD, FIELD, FUNCTION, STRUCT, TRAIT, PROTOCOL
    pub package: String,
    pub file_path: String,
    pub line_number: usize,
    pub end_line: Option<usize>,
    pub return_type: Option<String>,
    pub parent_class: Option<String>,
}

/// 代码关系(继承、实现、调用、依赖)
#[derive(Debug, Serialize, Deserialize)]
pub struct CodeRelation {
    pub source_id: String,
    pub target_id: String,
    pub relation_type: String, // EXTENDS, IMPLEMENTS, CALLS, DEPENDS_ON, USES
    pub file_path: String,
    pub line_number: usize,
}

/// 图谱节点
#[derive(Debug, Serialize, Deserialize)]
pub struct GraphNode {
    pub id: String,
    pub label: String,
    pub kind: String,
    pub file_path: Option<String>,
    pub package: Option<String>,
}

/// 图谱边
#[derive(Debug, Serialize, Deserialize)]
pub struct GraphEdge {
    pub source: String,
    pub target: String,
    pub relation_type: String,
}

/// 依赖图谱
#[derive(Debug, Serialize, Deserialize)]
pub struct DependencyGraph {
    pub nodes: Vec<GraphNode>,
    pub edges: Vec<GraphEdge>,
}
