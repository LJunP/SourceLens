package com.sourcelens.module.analysis.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.sourcelens.module.analysis.entity.CodeSymbol;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface CodeSymbolMapper extends BaseMapper<CodeSymbol> {

    @Insert("""
            <script>
            INSERT INTO code_symbols (
                scan_task_id,
                symbol_id,
                name,
                kind,
                `package`,
                file_path,
                line_number,
                end_line,
                return_type,
                parent_class
            ) VALUES
            <foreach collection="symbols" item="item" separator=",">
                (
                    #{item.scanTaskId},
                    #{item.symbolId},
                    #{item.name},
                    #{item.kind},
                    #{item.package_},
                    #{item.filePath},
                    #{item.lineNumber},
                    #{item.endLine},
                    #{item.returnType},
                    #{item.parentClass}
                )
            </foreach>
            </script>
            """)
    int insertBatch(@Param("symbols") List<CodeSymbol> symbols);
}
