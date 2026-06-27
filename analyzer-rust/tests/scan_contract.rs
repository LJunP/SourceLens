use serde_json::Value;
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

#[test]
fn scan_should_emit_versioned_contract_for_java_project() {
    let repo = create_fixture_repo("java-spring");
    fs::create_dir_all(repo.join("src/main/java/com/example/demo")).unwrap();
    fs::create_dir_all(repo.join("src/test/java/com/example/demo")).unwrap();
    fs::write(
        repo.join("pom.xml"),
        r#"
        <project>
          <parent>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-parent</artifactId>
            <version>3.3.5</version>
          </parent>
          <dependencies>
            <dependency>
              <groupId>org.springframework.boot</groupId>
              <artifactId>spring-boot-starter-web</artifactId>
            </dependency>
          </dependencies>
        </project>
        "#,
    )
    .unwrap();
    fs::write(
        repo.join("src/main/java/com/example/demo/DemoApplication.java"),
        r#"
        package com.example.demo;

        import org.springframework.boot.autoconfigure.SpringBootApplication;

        @SpringBootApplication
        public class DemoApplication {
        }
        "#,
    )
    .unwrap();
    fs::write(
        repo.join("src/main/java/com/example/demo/DemoController.java"),
        r#"
        package com.example.demo;

        import org.springframework.web.bind.annotation.GetMapping;
        import org.springframework.web.bind.annotation.RestController;

        @RestController
        public class DemoController {
            @GetMapping("/demo")
            public String demo() {
                return "ok";
            }
        }
        "#,
    )
    .unwrap();
    fs::write(
        repo.join("src/test/java/com/example/demo/DemoControllerTest.java"),
        "class DemoControllerTest {}\n",
    )
    .unwrap();

    let output = Command::new(env!("CARGO_BIN_EXE_sourcelens-analyzer"))
        .args(["scan", "--repo-path"])
        .arg(&repo)
        .output()
        .unwrap();

    assert!(
        output.status.success(),
        "stderr={}",
        String::from_utf8_lossy(&output.stderr)
    );
    let json: Value = serde_json::from_slice(&output.stdout).unwrap();

    assert_eq!(json["scan_result_schema_version"], 2);
    assert_eq!(json["language"], "Java");
    assert_eq!(json["framework"]["name"], "Spring Boot");
    assert_eq!(json["structure"]["api_routes"].as_array().unwrap().len(), 1);
    assert_eq!(json["file_tree"]["test_files"].as_array().unwrap().len(), 1);
    assert_eq!(
        json["file_tree"]["repo_content_hash"]
            .as_str()
            .unwrap()
            .len(),
        64
    );
    let manifest = json["file_tree"]["file_manifest"].as_array().unwrap();
    assert!(manifest.iter().any(|file| {
        file["path"] == "src/main/java/com/example/demo/DemoController.java"
            && file["content_hash_sha256"]
                .as_str()
                .is_some_and(|hash| hash.len() == 64)
    }));
    assert!(json["symbols"].is_array());
    assert!(json["relations"].is_array());
    assert!(json["graph"]["nodes"].is_array());
}

fn create_fixture_repo(name: &str) -> PathBuf {
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let repo = std::env::temp_dir().join(format!("sourcelens-{name}-{nonce}"));
    fs::create_dir_all(&repo).unwrap();
    repo
}
