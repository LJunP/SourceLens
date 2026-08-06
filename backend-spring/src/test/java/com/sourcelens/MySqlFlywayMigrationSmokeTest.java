package com.sourcelens;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.assertj.core.api.Assertions.assertThat;

@EnabledIfEnvironmentVariable(named = "SOURCELENS_MYSQL_FLYWAY_SMOKE", matches = "true")
@SpringBootTest(properties = {
        "spring.profiles.active=dev",
        "spring.datasource.url=${SOURCELENS_MYSQL_FLYWAY_SMOKE_DB_URL}",
        "spring.datasource.username=${SOURCELENS_MYSQL_FLYWAY_SMOKE_DB_USERNAME}",
        "spring.datasource.password=${SOURCELENS_MYSQL_FLYWAY_SMOKE_DB_PASSWORD}",
        "spring.sql.init.mode=never",
        "spring.flyway.enabled=true",
        "sourcelens.jwt.secret=MySqlFlywaySmokeSecretKey2026-ForMigrationOnly",
        "sourcelens.jwt.expiration=86400000",
        "sourcelens.jwt.denylist.redis-enabled=false",
        "sourcelens.encrypt.password=MySqlFlywaySmokePassword2026",
        "sourcelens.encrypt.salt=MySqlFlywaySmokeSalt2026"
})
class MySqlFlywayMigrationSmokeTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void flywayMigrations_shouldApplyRootMetadataSchemaOnRealMySql() {
        assertThat(count("""
                select count(distinct column_name)
                from information_schema.columns
                where table_schema = database()
                  and table_name = 'code_chunks'
                  and column_name in ('workspace_root', 'module_root')
                """)).isEqualTo(2);

        assertThat(count("""
                select count(distinct index_name)
                from information_schema.statistics
                where table_schema = database()
                  and table_name = 'code_chunks'
                  and index_name in ('idx_code_chunks_scan_module_root', 'idx_code_chunks_scan_workspace_root')
                """)).isEqualTo(2);

        assertThat(count("""
                select count(*)
                from flyway_schema_history
                where version in ('32', '032')
                  and script = 'V032__add_code_chunk_root_metadata.sql'
                  and success = 1
                """)).isEqualTo(1);
    }

    private int count(String sql) {
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class);
        return count == null ? 0 : count;
    }
}
