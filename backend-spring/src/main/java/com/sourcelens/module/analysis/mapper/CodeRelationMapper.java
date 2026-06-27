package com.sourcelens.module.analysis.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.sourcelens.module.analysis.entity.CodeRelationEntity;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface CodeRelationMapper extends BaseMapper<CodeRelationEntity> {

    @Insert("""
            <script>
            INSERT INTO code_relations (
                scan_task_id,
                source_id,
                target_id,
                relation_type,
                file_path,
                line_number
            ) VALUES
            <foreach collection="relations" item="item" separator=",">
                (
                    #{item.scanTaskId},
                    #{item.sourceId},
                    #{item.targetId},
                    #{item.relationType},
                    #{item.filePath},
                    #{item.lineNumber}
                )
            </foreach>
            </script>
            """)
    int insertBatch(@Param("relations") List<CodeRelationEntity> relations);
}
