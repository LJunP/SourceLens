package com.sourcelens.module.repository.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.sourcelens.module.repository.entity.GitHubAppInstallation;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface GitHubAppInstallationMapper extends BaseMapper<GitHubAppInstallation> {
}
