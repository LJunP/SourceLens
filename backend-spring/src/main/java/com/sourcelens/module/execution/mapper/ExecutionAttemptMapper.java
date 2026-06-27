package com.sourcelens.module.execution.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.sourcelens.module.execution.entity.ExecutionAttempt;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ExecutionAttemptMapper extends BaseMapper<ExecutionAttempt> {
}
