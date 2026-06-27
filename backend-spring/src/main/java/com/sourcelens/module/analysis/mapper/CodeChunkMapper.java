package com.sourcelens.module.analysis.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.sourcelens.module.analysis.entity.CodeChunk;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface CodeChunkMapper extends BaseMapper<CodeChunk> {

    @Insert("""
            <script>
            INSERT INTO code_chunks (
                scan_task_id,
                file_path,
                content,
                start_line,
                end_line,
                content_hash,
                embedding
            ) VALUES
            <foreach collection="chunks" item="item" separator=",">
                (
                    #{item.scanTaskId},
                    #{item.filePath},
                    #{item.content},
                    #{item.startLine},
                    #{item.endLine},
                    #{item.contentHash},
                    #{item.embedding}
                )
            </foreach>
            </script>
            """)
    int insertBatch(@Param("chunks") List<CodeChunk> chunks);
}
