package com.sourcelens;

import com.sourcelens.module.analysis.entity.CodeChunk;
import com.sourcelens.module.analysis.mapper.CodeChunkMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class CodeChunkMapperSchemaTest {

    @Autowired
    private CodeChunkMapper codeChunkMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void insertBatch_shouldPersistRootMetadataAgainstTestSchema() {
        jdbcTemplate.update("delete from code_chunks where scan_task_id = ?", 4201L);

        int inserted = codeChunkMapper.insertBatch(List.of(
                CodeChunk.builder()
                        .scanTaskId(4201L)
                        .filePath("packages/admin/src/pages/Login.tsx")
                        .workspaceRoot("packages/admin")
                        .moduleRoot("packages/admin")
                        .content("export function Login() { return null; }")
                        .startLine(1)
                        .endLine(20)
                        .contentHash("hash-admin")
                        .embedding("[0.1,0.2]")
                        .embeddingModel("OPENAI:text-embedding-3-small")
                        .build()
        ));

        assertThat(inserted).isEqualTo(1);
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                """
                select scan_task_id, file_path, workspace_root, module_root, embedding_model
                from code_chunks
                where scan_task_id = ?
                """,
                4201L
        );
        assertThat(rows).hasSize(1);
        assertThat(rows.get(0))
                .containsEntry("SCAN_TASK_ID", 4201L)
                .containsEntry("FILE_PATH", "packages/admin/src/pages/Login.tsx")
                .containsEntry("WORKSPACE_ROOT", "packages/admin")
                .containsEntry("MODULE_ROOT", "packages/admin")
                .containsEntry("EMBEDDING_MODEL", "OPENAI:text-embedding-3-small");
    }
}
