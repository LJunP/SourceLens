use crate::models::{CodeRelation, CodeSymbol};
use std::fs;
use std::path::Path;
use tree_sitter::{Node, Parser};

pub struct AstExtractor {}

impl AstExtractor {
    pub fn new() -> Self {
        Self {}
    }

    /// Extract symbols and relations from a file using Tree-sitter
    pub fn extract_file(
        &self,
        file_path: &Path,
        rel_path: &str,
    ) -> Result<(Vec<CodeSymbol>, Vec<CodeRelation>), Box<dyn std::error::Error>> {
        let extension = file_path
            .extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("");
        let source_code = fs::read_to_string(file_path)?;

        let (language, lang_name) = match extension {
            "go" => (Some(tree_sitter_go::language()), "go"),
            "py" => (Some(tree_sitter_python::language()), "python"),
            "js" => (Some(tree_sitter_javascript::language()), "javascript"),
            "ts" | "tsx" => (
                Some(tree_sitter_typescript::language_typescript()),
                "typescript",
            ),
            "rs" => (Some(tree_sitter_rust::language()), "rust"),
            _ => (None, "unknown"),
        };

        let mut symbols = Vec::new();
        let mut relations = Vec::new();

        if let Some(lang) = language {
            let mut parser = Parser::new();
            parser.set_language(&lang)?;
            if let Some(tree) = parser.parse(&source_code, None) {
                let root_node = tree.root_node();
                self.traverse(
                    root_node,
                    &source_code,
                    rel_path,
                    lang_name,
                    &mut symbols,
                    &mut relations,
                );
            }
        }

        Ok((symbols, relations))
    }

    fn traverse(
        &self,
        node: Node,
        source: &str,
        rel_path: &str,
        lang: &str,
        symbols: &mut Vec<CodeSymbol>,
        relations: &mut Vec<CodeRelation>,
    ) {
        let kind = node.kind();
        let start_pos = node.start_position();
        let end_pos = node.end_position();

        match lang {
            "go" => {
                if kind == "type_spec" {
                    if let Some(name_node) = node.child_by_field_name("name") {
                        let name = &source[name_node.byte_range()];
                        let symbol_id = format!("{}#{}", rel_path, name);
                        symbols.push(CodeSymbol {
                            symbol_id: symbol_id.clone(),
                            name: name.to_string(),
                            kind: "STRUCT".to_string(),
                            package: "".to_string(),
                            file_path: rel_path.to_string(),
                            line_number: start_pos.row + 1,
                            end_line: Some(end_pos.row + 1),
                            return_type: None,
                            parent_class: None,
                        });
                    }
                } else if kind == "function_declaration" || kind == "method_declaration" {
                    if let Some(name_node) = node.child_by_field_name("name") {
                        let name = &source[name_node.byte_range()];
                        let symbol_id = format!("{}.{}()", rel_path, name);
                        symbols.push(CodeSymbol {
                            symbol_id: symbol_id.clone(),
                            name: name.to_string(),
                            kind: "FUNCTION".to_string(),
                            package: "".to_string(),
                            file_path: rel_path.to_string(),
                            line_number: start_pos.row + 1,
                            end_line: Some(end_pos.row + 1),
                            return_type: None,
                            parent_class: None,
                        });
                    }
                }
            }
            "python" => {
                if kind == "class_definition" {
                    if let Some(name_node) = node.child_by_field_name("name") {
                        let name = &source[name_node.byte_range()];
                        let symbol_id = format!("{}#{}", rel_path, name);
                        symbols.push(CodeSymbol {
                            symbol_id: symbol_id.clone(),
                            name: name.to_string(),
                            kind: "CLASS".to_string(),
                            package: "".to_string(),
                            file_path: rel_path.to_string(),
                            line_number: start_pos.row + 1,
                            end_line: Some(end_pos.row + 1),
                            return_type: None,
                            parent_class: None,
                        });
                    }
                } else if kind == "function_definition" {
                    if let Some(name_node) = node.child_by_field_name("name") {
                        let name = &source[name_node.byte_range()];
                        let symbol_id = format!("{}.{}()", rel_path, name);
                        symbols.push(CodeSymbol {
                            symbol_id: symbol_id.clone(),
                            name: name.to_string(),
                            kind: "FUNCTION".to_string(),
                            package: "".to_string(),
                            file_path: rel_path.to_string(),
                            line_number: start_pos.row + 1,
                            end_line: Some(end_pos.row + 1),
                            return_type: None,
                            parent_class: None,
                        });
                    }
                }
            }
            "javascript" | "typescript" => {
                if kind == "class_declaration" {
                    if let Some(name_node) = node.child_by_field_name("name") {
                        let name = &source[name_node.byte_range()];
                        let symbol_id = format!("{}#{}", rel_path, name);
                        symbols.push(CodeSymbol {
                            symbol_id: symbol_id.clone(),
                            name: name.to_string(),
                            kind: "CLASS".to_string(),
                            package: "".to_string(),
                            file_path: rel_path.to_string(),
                            line_number: start_pos.row + 1,
                            end_line: Some(end_pos.row + 1),
                            return_type: None,
                            parent_class: None,
                        });
                    }
                } else if kind == "method_definition" || kind == "function_declaration" {
                    if let Some(name_node) = node.child_by_field_name("name") {
                        let name = &source[name_node.byte_range()];
                        let symbol_id = format!("{}.{}()", rel_path, name);
                        symbols.push(CodeSymbol {
                            symbol_id: symbol_id.clone(),
                            name: name.to_string(),
                            kind: "FUNCTION".to_string(),
                            package: "".to_string(),
                            file_path: rel_path.to_string(),
                            line_number: start_pos.row + 1,
                            end_line: Some(end_pos.row + 1),
                            return_type: None,
                            parent_class: None,
                        });
                    }
                }
            }
            "rust" => {
                if kind == "struct_item" || kind == "enum_item" {
                    if let Some(name_node) = node.child_by_field_name("name") {
                        let name = &source[name_node.byte_range()];
                        let symbol_id = format!("{}#{}", rel_path, name);
                        symbols.push(CodeSymbol {
                            symbol_id: symbol_id.clone(),
                            name: name.to_string(),
                            kind: "STRUCT".to_string(),
                            package: "".to_string(),
                            file_path: rel_path.to_string(),
                            line_number: start_pos.row + 1,
                            end_line: Some(end_pos.row + 1),
                            return_type: None,
                            parent_class: None,
                        });
                    }
                } else if kind == "function_item" {
                    if let Some(name_node) = node.child_by_field_name("name") {
                        let name = &source[name_node.byte_range()];
                        let symbol_id = format!("{}.{}()", rel_path, name);
                        symbols.push(CodeSymbol {
                            symbol_id: symbol_id.clone(),
                            name: name.to_string(),
                            kind: "FUNCTION".to_string(),
                            package: "".to_string(),
                            file_path: rel_path.to_string(),
                            line_number: start_pos.row + 1,
                            end_line: Some(end_pos.row + 1),
                            return_type: None,
                            parent_class: None,
                        });
                    }
                }
            }
            _ => {}
        }

        let mut cursor = node.walk();
        if cursor.goto_first_child() {
            loop {
                self.traverse(cursor.node(), source, rel_path, lang, symbols, relations);
                if !cursor.goto_next_sibling() {
                    break;
                }
            }
        }
    }
}
