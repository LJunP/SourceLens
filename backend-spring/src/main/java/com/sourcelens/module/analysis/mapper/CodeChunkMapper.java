package com.sourcelens.module.analysis.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.sourcelens.module.analysis.dto.CodeChunkStatusCounts;
import com.sourcelens.module.analysis.entity.CodeChunk;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface CodeChunkMapper extends BaseMapper<CodeChunk> {

    @Select("""
            SELECT
                COUNT(*) AS total_chunks,
                COALESCE(SUM(CASE WHEN embedding_model IS NOT NULL AND embedding_model <> '' THEN 1 ELSE 0 END), 0) AS embedded_chunks
            FROM code_chunks
            WHERE scan_task_id = #{scanTaskId}
            """)
    CodeChunkStatusCounts selectStatusCounts(@Param("scanTaskId") Long scanTaskId);

    @Select("""
            SELECT
                id,
                scan_task_id,
                file_path,
                workspace_root,
                module_root,
                '' AS content,
                start_line,
                end_line,
                content_hash,
                CASE WHEN embedding_model IS NOT NULL AND embedding_model <> '' THEN '__present__' ELSE NULL END AS embedding,
                embedding_model
            FROM code_chunks FORCE INDEX (idx_code_chunks_scan_id)
            WHERE scan_task_id = #{scanTaskId}
            ORDER BY id ASC
            LIMIT 1
            """)
    CodeChunk selectStatusSample(@Param("scanTaskId") Long scanTaskId);

    @Select("""
            SELECT
                id,
                scan_task_id,
                file_path,
                workspace_root,
                module_root,
                content,
                start_line,
                end_line,
                content_hash,
                embedding,
                embedding_model
            FROM code_chunks FORCE INDEX (idx_code_chunks_scan_id)
            WHERE scan_task_id = #{scanTaskId}
            ORDER BY id ASC
            LIMIT #{limit}
            """)
    List<CodeChunk> selectStableFallbackChunks(@Param("scanTaskId") Long scanTaskId, @Param("limit") int limit);

    @Insert("""
            <script>
            INSERT INTO code_chunks (
                scan_task_id,
                file_path,
                workspace_root,
                module_root,
                content,
                start_line,
                end_line,
                content_hash,
                embedding,
                embedding_model
            ) VALUES
            <foreach collection="chunks" item="item" separator=",">
                (
                    #{item.scanTaskId},
                    #{item.filePath},
                    #{item.workspaceRoot},
                    #{item.moduleRoot},
                    #{item.content},
                    #{item.startLine},
                    #{item.endLine},
                    #{item.contentHash},
                    #{item.embedding},
                    #{item.embeddingModel}
                )
            </foreach>
            </script>
            """)
    int insertBatch(@Param("chunks") List<CodeChunk> chunks);
}
