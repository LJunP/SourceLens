use std::collections::HashMap;
use std::io::Read;
use std::path::Path;
use walkdir::WalkDir;

use sha2::{Digest, Sha256};

use crate::models::{DirEntry, FileManifestEntry, FileTree, LanguageStat, LargeFile};

pub const MAX_TEXT_SCAN_BYTES: u64 = 1024 * 1024;
const BINARY_SNIFF_BYTES: usize = 8192;

// 扩展名 -> 语言名称映射
fn ext_to_language() -> HashMap<&'static str, &'static str> {
    let mut m = HashMap::new();
    m.insert("java", "Java");
    m.insert("kt", "Kotlin");
    m.insert("kts", "Kotlin Script");
    m.insert("py", "Python");
    m.insert("go", "Go");
    m.insert("rs", "Rust");
    m.insert("js", "JavaScript");
    m.insert("jsx", "JavaScript");
    m.insert("ts", "TypeScript");
    m.insert("tsx", "TypeScript");
    m.insert("c", "C");
    m.insert("cpp", "C++");
    m.insert("h", "C/C++ Header");
    m.insert("hpp", "C++ Header");
    m.insert("sh", "Shell");
    m.insert("bash", "Shell");
    m.insert("sql", "SQL");
    m.insert("yml", "YAML");
    m.insert("yaml", "YAML");
    m.insert("json", "JSON");
    m.insert("toml", "TOML");
    m.insert("xml", "XML");
    m.insert("md", "Markdown");
    m.insert("properties", "Properties");
    m.insert("gradle", "Gradle");
    m.insert("gradle.kts", "Gradle Kotlin DSL");
    m
}

fn should_skip_dir(name: &str) -> bool {
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
            | ".mvn"
            | "vendor"
            | ".gradle"
    )
}

/// 判断是否为测试文件
fn is_test_file(path: &Path, rel: &str) -> bool {
    // 路径包含 test 目录
    if rel.contains("/src/test/") || rel.contains("\\src\\test\\") {
        return true;
    }
    // 文件名以 Test 或 Tests 结尾
    let name = path
        .file_stem()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default();
    if name.ends_with("Test") || name.ends_with("Tests") || name.starts_with("Test") {
        return true;
    }
    // 文件名包含 Spec (常见于 JS/TS)
    if name.contains("Spec") || name.contains(".test.") || name.contains(".spec.") {
        return true;
    }
    false
}

/// 判断是否为生成文件
fn is_generated_file(path: &Path, rel: &str) -> bool {
    // 路径包含 generated
    if rel.contains("/generated/") || rel.contains("\\generated\\") {
        return true;
    }
    // 常见生成文件模式
    let name = path
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default();
    if name.starts_with("Generated") || name.contains("_.java") || name.contains("Mapper.xml") {
        return true;
    }
    // Rust 自动生成
    if rel.starts_with("Cargo.lock") {
        return true;
    }
    false
}

fn is_probably_binary(path: &Path) -> bool {
    let mut file = match std::fs::File::open(path) {
        Ok(file) => file,
        Err(_) => return true,
    };
    let mut buffer = [0u8; BINARY_SNIFF_BYTES];
    let read = match file.read(&mut buffer) {
        Ok(read) => read,
        Err(_) => return true,
    };
    buffer[..read].iter().any(|byte| *byte == 0)
}

fn count_lines_limited(path: &Path, size_bytes: u64) -> Option<usize> {
    if size_bytes > MAX_TEXT_SCAN_BYTES || is_probably_binary(path) {
        return None;
    }
    std::fs::read_to_string(path)
        .map(|content| content.lines().count())
        .ok()
}

fn sha256_hex(bytes: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(bytes);
    format!("{:x}", hasher.finalize())
}

fn content_hash_limited(path: &Path, size_bytes: u64, is_binary: bool) -> Option<String> {
    if size_bytes > MAX_TEXT_SCAN_BYTES || is_binary {
        return None;
    }
    std::fs::read(path).ok().map(|bytes| sha256_hex(&bytes))
}

fn repo_content_hash(file_manifest: &[FileManifestEntry]) -> String {
    let mut hasher = Sha256::new();
    for file in file_manifest {
        hasher.update(file.path.as_bytes());
        hasher.update(b"\0");
        hasher.update(file.size_bytes.to_string().as_bytes());
        hasher.update(b"\0");
        if let Some(hash) = &file.content_hash_sha256 {
            hasher.update(hash.as_bytes());
        }
        hasher.update(b"\n");
    }
    format!("{:x}", hasher.finalize())
}

fn detect_language_for_entry(
    path: &Path,
    file_name: &str,
    ext_map: &HashMap<&'static str, &'static str>,
) -> String {
    if file_name == "Dockerfile" {
        return "Dockerfile".to_string();
    }
    path.extension()
        .and_then(|ext| {
            let ext_s = ext.to_string_lossy().to_lowercase();
            ext_map
                .get(ext_s.as_str())
                .map(|s| s.to_string())
                .or_else(|| {
                    let fname = file_name.to_lowercase();
                    ext_map.get(fname.as_str()).map(|s| s.to_string())
                })
        })
        .unwrap_or_else(|| "Other".to_string())
}

/// 构建文件树并收集语言统计
pub fn build_file_tree(repo_path: &Path) -> (FileTree, HashMap<String, LanguageStat>) {
    let ext_map = ext_to_language();
    let mut lang_stats: HashMap<String, LanguageStat> = HashMap::new();
    let mut total_files = 0usize;
    let mut total_dirs = 0usize;
    let mut total_lines = 0usize;
    let mut test_files = Vec::new();
    let mut large_files = Vec::new();
    let mut config_files = Vec::new();
    let mut generated_files = Vec::new();
    let mut file_manifest = Vec::new();

    let mut root_children: Vec<DirEntry> = Vec::new();
    let mut dir_map: HashMap<String, Vec<DirEntry>> = HashMap::new();

    let entries: Vec<_> = WalkDir::new(repo_path)
        .into_iter()
        .filter_entry(|e| {
            if e.file_type().is_dir() {
                let name = e.file_name().to_string_lossy();
                return !should_skip_dir(&name);
            }
            true
        })
        .filter_map(|e| e.ok())
        .collect();

    for entry in &entries {
        let rel = entry.path().strip_prefix(repo_path).unwrap_or(entry.path());
        let rel_str = rel.to_string_lossy().to_string();

        if entry.file_type().is_dir() {
            total_dirs += 1;
            dir_map.insert(rel_str, Vec::new());
        } else {
            total_files += 1;
            let size_bytes = std::fs::metadata(entry.path())
                .map(|m| m.len())
                .unwrap_or(0);
            let is_binary = is_probably_binary(entry.path());
            let lines = if size_bytes > MAX_TEXT_SCAN_BYTES || is_binary {
                0
            } else {
                count_lines_limited(entry.path(), size_bytes).unwrap_or(0)
            };
            total_lines += lines;

            // 测试文件检测
            let is_test = is_test_file(entry.path(), &rel_str);
            if is_test {
                test_files.push(rel_str.clone());
            }

            // 大文件检测 (>500行或超过文本扫描上限)
            let is_large = lines > 500 || size_bytes > MAX_TEXT_SCAN_BYTES;
            if is_large {
                large_files.push(LargeFile {
                    path: rel_str.clone(),
                    line_count: lines,
                    size_bytes,
                });
            }

            // 配置文件检测
            let ext_str = entry
                .path()
                .extension()
                .and_then(|e| e.to_str())
                .unwrap_or("")
                .to_lowercase();
            let fname = entry.file_name().to_string_lossy().to_lowercase();
            let is_config = ext_str == "yml"
                || ext_str == "yaml"
                || ext_str == "properties"
                || ext_str == "toml"
                || ext_str == "env"
                || fname == "dockerfile"
                || fname == "docker-compose.yml"
                || fname == "docker-compose.yaml"
                || fname == "makefile";
            if is_config {
                config_files.push(rel_str.clone());
            }

            // 生成文件检测
            let is_generated = is_generated_file(entry.path(), &rel_str);
            if is_generated {
                generated_files.push(rel_str.clone());
            }

            // 语言统计
            let file_name = entry.file_name().to_string_lossy().to_string();
            let lang = detect_language_for_entry(entry.path(), &file_name, &ext_map);

            let stat = lang_stats
                .entry(lang.clone())
                .or_insert_with(|| LanguageStat {
                    file_count: 0,
                    line_count: 0,
                    ext: ext_map
                        .get(
                            entry
                                .path()
                                .extension()
                                .unwrap_or_default()
                                .to_str()
                                .unwrap_or(""),
                        )
                        .unwrap_or(&"")
                        .to_string(),
                });
            stat.file_count += 1;
            stat.line_count += lines;

            file_manifest.push(FileManifestEntry {
                path: rel_str.clone(),
                language: lang,
                size_bytes,
                line_count: lines,
                content_hash_sha256: content_hash_limited(entry.path(), size_bytes, is_binary),
                is_test,
                is_generated,
                is_config,
                is_large,
                is_binary,
            });

            // 将文件添加到父目录
            let parent_rel = rel
                .parent()
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_default();
            let file_name = entry.file_name().to_string_lossy().to_string();
            dir_map.entry(parent_rel).or_default().push(DirEntry {
                name: file_name,
                path: rel_str,
                is_dir: false,
                children: Vec::new(),
                file_count: 0,
            });
        }
    }

    // 自底向上构建目录树
    let mut dir_keys: Vec<String> = dir_map.keys().cloned().collect();
    dir_keys.sort_by(|a, b| b.len().cmp(&a.len()));

    for dir_key in dir_keys.clone() {
        let children = dir_map.remove(&dir_key).unwrap_or_default();
        let file_count = children.len();
        let dir_name = std::path::Path::new(&dir_key)
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| ".".to_string());

        let node = DirEntry {
            name: dir_name,
            path: dir_key.clone(),
            is_dir: true,
            children,
            file_count,
        };

        if let Some(parent) = std::path::Path::new(&dir_key).parent() {
            let parent_str = parent.to_string_lossy().to_string();
            if dir_map.contains_key(&parent_str) || dir_keys.contains(&parent_str) {
                dir_map.entry(parent_str).or_default().push(node);
            } else {
                root_children.push(node);
            }
        } else {
            root_children.push(node);
        }
    }

    // 排序大文件
    large_files.sort_by(|a, b| b.line_count.cmp(&a.line_count));
    file_manifest.sort_by(|a, b| a.path.cmp(&b.path));
    let repo_content_hash = repo_content_hash(&file_manifest);

    let file_tree = FileTree {
        total_files,
        total_dirs,
        total_lines,
        repo_content_hash,
        file_manifest,
        root_dirs: root_children,
        test_files,
        large_files,
        config_files,
        generated_files,
    };

    (file_tree, lang_stats)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::PathBuf;
    use std::time::{SystemTime, UNIX_EPOCH};

    #[test]
    fn build_file_tree_should_limit_large_text_files() {
        let repo = create_temp_repo("large-file");
        let large_file = repo.join("src/Large.java");
        fs::create_dir_all(large_file.parent().unwrap()).unwrap();
        fs::write(
            &large_file,
            "line\n".repeat((MAX_TEXT_SCAN_BYTES / 5 + 10) as usize),
        )
        .unwrap();

        let (tree, _) = build_file_tree(&repo);

        assert_eq!(tree.total_files, 1);
        assert_eq!(tree.total_lines, 0);
        assert_eq!(tree.large_files.len(), 1);
        assert_eq!(tree.large_files[0].path, "src/Large.java");
    }

    #[test]
    fn build_file_tree_should_not_count_binary_file_lines() {
        let repo = create_temp_repo("binary-file");
        let binary_file = repo.join("assets/image.bin");
        fs::create_dir_all(binary_file.parent().unwrap()).unwrap();
        fs::write(&binary_file, [0, 159, 146, 150, 0, 1, 2, 3]).unwrap();

        let (tree, _) = build_file_tree(&repo);

        assert_eq!(tree.total_files, 1);
        assert_eq!(tree.total_lines, 0);
        assert_eq!(tree.file_manifest.len(), 1);
        assert!(tree.file_manifest[0].is_binary);
        assert!(tree.file_manifest[0].content_hash_sha256.is_none());
    }

    #[test]
    fn build_file_tree_should_emit_stable_file_manifest_hashes() {
        let repo = create_temp_repo("manifest-hash");
        let source_file = repo.join("src/App.java");
        fs::create_dir_all(source_file.parent().unwrap()).unwrap();
        fs::write(&source_file, "class App {}\n").unwrap();

        let (first_tree, _) = build_file_tree(&repo);
        let (second_tree, _) = build_file_tree(&repo);

        assert_eq!(first_tree.file_manifest.len(), 1);
        assert_eq!(first_tree.file_manifest[0].path, "src/App.java");
        assert_eq!(
            first_tree.file_manifest[0]
                .content_hash_sha256
                .as_ref()
                .unwrap()
                .len(),
            64
        );
        assert_eq!(first_tree.repo_content_hash, second_tree.repo_content_hash);
    }

    fn create_temp_repo(name: &str) -> PathBuf {
        let nonce = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let repo = std::env::temp_dir().join(format!("sourcelens-scanner-{name}-{nonce}"));
        fs::create_dir_all(&repo).unwrap();
        repo
    }
}
