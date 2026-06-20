package com.sourcelens.module.repository.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.sourcelens.module.repository.entity.Repository;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface RepositoryMapper extends BaseMapper<Repository> {
}