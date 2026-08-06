#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function fail(message) {
  console.error(`DB SCHEMA CONTRACT FAIL: ${message}`);
  process.exit(1);
}

function assertIncludes(file, source, text, description) {
  if (!source.includes(text)) {
    fail(`${description}: ${file} must include ${text}`);
  }
}

function assertMatch(file, source, pattern, description) {
  if (!pattern.test(source)) {
    fail(`${description}: ${file} must match ${pattern}`);
  }
}

const migration = read("backend-spring/src/main/resources/db/migration/V032__add_code_chunk_root_metadata.sql");
const schemaTest = read("backend-spring/src/test/resources/schema-test.sql");
const entity = read("backend-spring/src/main/java/com/sourcelens/module/analysis/entity/CodeChunk.java");
const mapper = read("backend-spring/src/main/java/com/sourcelens/module/analysis/mapper/CodeChunkMapper.java");
const dto = read("backend-spring/src/main/java/com/sourcelens/module/analysis/dto/CodeChunkSearchItem.java");
const controller = read("backend-spring/src/main/java/com/sourcelens/module/analysis/controller/CodeChunkController.java");
const serviceTest = read("backend-spring/src/test/java/com/sourcelens/CodeChunkServiceTest.java");
const mapperSchemaTest = read("backend-spring/src/test/java/com/sourcelens/CodeChunkMapperSchemaTest.java");
const mysqlFlywaySmokeTest = read("backend-spring/src/test/java/com/sourcelens/MySqlFlywayMigrationSmokeTest.java");
const mysqlFlywaySmokeScript = read("scripts/mysql-flyway-migration-smoke.sh");
const makefile = read("Makefile");

for (const column of ["workspace_root", "module_root"]) {
  assertIncludes("V032__add_code_chunk_root_metadata.sql", migration, `COLUMN_NAME = '${column}'`, `${column} migration guard`);
  assertIncludes("V032__add_code_chunk_root_metadata.sql", migration, `ADD COLUMN \`${column}\` VARCHAR(255) DEFAULT NULL`, `${column} nullable migration`);
  assertIncludes("schema-test.sql", schemaTest, column, `${column} H2 test schema parity`);
}

for (const index of ["idx_code_chunks_scan_module_root", "idx_code_chunks_scan_workspace_root"]) {
  assertIncludes("V032__add_code_chunk_root_metadata.sql", migration, `INDEX_NAME = '${index}'`, `${index} migration guard`);
  assertIncludes("schema-test.sql", schemaTest, index, `${index} H2 test schema parity`);
}

assertIncludes("CodeChunk.java", entity, "private String workspaceRoot;", "entity workspaceRoot field");
assertIncludes("CodeChunk.java", entity, "private String moduleRoot;", "entity moduleRoot field");
assertIncludes("CodeChunkMapper.java", mapper, "workspace_root", "mapper workspace_root insert column");
assertIncludes("CodeChunkMapper.java", mapper, "module_root", "mapper module_root insert column");
assertIncludes("CodeChunkMapper.java", mapper, "#{item.workspaceRoot}", "mapper workspaceRoot insert binding");
assertIncludes("CodeChunkMapper.java", mapper, "#{item.moduleRoot}", "mapper moduleRoot insert binding");
assertIncludes("CodeChunkSearchItem.java", dto, "private String workspaceRoot;", "search DTO workspaceRoot field");
assertIncludes("CodeChunkSearchItem.java", dto, "private String moduleRoot;", "search DTO moduleRoot field");
assertIncludes("CodeChunkController.java", controller, ".workspaceRoot(safeRootMetadata(chunk.getWorkspaceRoot()))", "controller sanitized workspaceRoot mapping");
assertIncludes("CodeChunkController.java", controller, ".moduleRoot(safeRootMetadata(chunk.getModuleRoot()))", "controller sanitized moduleRoot mapping");
assertIncludes("CodeChunkController.java", controller, 'normalized.matches("(?i)^[a-z]:.*")', "controller rejects Windows drive metadata");
assertIncludes("CodeChunkServiceTest.java", serviceTest, "chunkAndSave_shouldSkipSymlinkFilesEscapingRepositoryRoot", "symlink escape regression");
assertIncludes("CodeChunkServiceTest.java", serviceTest, "chunkAndSave_shouldPersistWorkspaceAndModuleRootsForMonorepoPackages", "root metadata write-path regression");
assertIncludes("CodeChunkMapperSchemaTest.java", mapperSchemaTest, "insertBatch_shouldPersistRootMetadataAgainstTestSchema", "mapper schema root metadata smoke");
assertIncludes("MySqlFlywayMigrationSmokeTest.java", mysqlFlywaySmokeTest, "SOURCELENS_MYSQL_FLYWAY_SMOKE", "real MySQL Flyway smoke opt-in guard");
assertIncludes("MySqlFlywayMigrationSmokeTest.java", mysqlFlywaySmokeTest, "flyway_schema_history", "real MySQL Flyway history assertion");
assertIncludes("MySqlFlywayMigrationSmokeTest.java", mysqlFlywaySmokeTest, "V032__add_code_chunk_root_metadata.sql", "real MySQL V032 assertion");
assertIncludes("mysql-flyway-migration-smoke.sh", mysqlFlywaySmokeScript, "mysql:8.4@sha256:", "real MySQL smoke uses digest-pinned image");
assertIncludes("mysql-flyway-migration-smoke.sh", mysqlFlywaySmokeScript, "trap cleanup EXIT", "real MySQL smoke cleanup trap");
assertIncludes("mysql-flyway-migration-smoke.sh", mysqlFlywaySmokeScript, "mvn -Dtest=MySqlFlywayMigrationSmokeTest test", "real MySQL smoke runs focused test");
assertIncludes("mysql-flyway-migration-smoke.sh", mysqlFlywaySmokeScript, "MYSQL_FLYWAY_MIGRATION_SMOKE_OK", "real MySQL smoke success marker");
assertIncludes("Makefile", makefile, "mysql-flyway-smoke:", "real MySQL smoke Make target");

console.log("DB schema contract checks passed.");
