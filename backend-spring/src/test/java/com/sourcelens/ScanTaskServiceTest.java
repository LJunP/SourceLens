package com.sourcelens;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sourcelens.common.exception.BizException;
import com.sourcelens.module.scantask.dto.CreateScanTaskRequest;
import com.sourcelens.module.scantask.entity.ScanTask;
import com.sourcelens.module.scantask.mapper.ScanTaskMapper;
import com.sourcelens.module.scantask.service.ScanTaskService;
import com.sourcelens.module.repository.entity.Repository;
import com.sourcelens.module.repository.service.RepositoryService;
import com.sourcelens.module.analysis.service.AnalysisService;
import com.sourcelens.module.repository.service.GitService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ScanTaskServiceTest {

    @Mock
    private RepositoryService repositoryService;

    @Mock
    private GitService gitService;

    @Mock
    private AnalysisService analysisService;

    @Mock
    private ScanTaskMapper scanTaskMapper;

    @Mock
    private ScanTaskService self;

    @InjectMocks
    private ScanTaskService scanTaskService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(scanTaskService, "baseMapper", scanTaskMapper);
        ReflectionTestUtils.setField(scanTaskService, "self", self);
    }

    private Repository buildRepo(Long id, Long projectId) {
        Repository r = new Repository();
        r.setId(id);
        r.setProjectId(projectId);
        r.setDefaultBranch("main");
        return r;
    }

    @Test
    void create_shouldBuildTaskAndSave() {
        Repository repo = buildRepo(100L, 10L);
        when(repositoryService.getDetail(100L)).thenReturn(repo);
        // 模拟 MyBatis-Plus 自增回填
        doAnswer(invocation -> {
            ScanTask arg = invocation.getArgument(0);
            arg.setId(42L);
            return 1;
        }).when(scanTaskMapper).insert(any(ScanTask.class));

        CreateScanTaskRequest req = new CreateScanTaskRequest();
        req.setRepositoryId(100L);
        req.setProjectId(10L);

        ScanTask result = scanTaskService.create(10L, req, 1L);

        assertEquals(10L, result.getProjectId());
        assertEquals("PENDING", result.getStatus());
        assertEquals("MANUAL", result.getTriggerType());
        verify(self).triggerScan(42L);
    }

    @Test
    void create_repoNotBelongToProject_throws() {
        Repository repo = buildRepo(100L, 99L);
        when(repositoryService.getDetail(100L)).thenReturn(repo);

        CreateScanTaskRequest req = new CreateScanTaskRequest();
        req.setRepositoryId(100L);
        req.setProjectId(10L);

        BizException ex = assertThrows(BizException.class,
                () -> scanTaskService.create(10L, req, 1L));
        assertEquals("BAD_REQUEST", ex.getCode());
    }

    @Test
    void getDetail_existingTask() {
        ScanTask task = new ScanTask();
        task.setId(50L);
        task.setDeleted(false);
        when(scanTaskMapper.selectById(50L)).thenReturn(task);

        ScanTask result = scanTaskService.getDetail(50L);
        assertEquals(50L, result.getId());
    }

    @Test
    void getDetail_notFound() {
        when(scanTaskMapper.selectById(999L)).thenReturn(null);

        BizException ex = assertThrows(BizException.class,
                () -> scanTaskService.getDetail(999L));
        assertEquals("NOT_FOUND", ex.getCode());
    }

    @Test
    void getDetail_deletedTask() {
        ScanTask task = new ScanTask();
        task.setId(50L);
        task.setDeleted(true);
        when(scanTaskMapper.selectById(50L)).thenReturn(task);

        BizException ex = assertThrows(BizException.class,
                () -> scanTaskService.getDetail(50L));
        assertEquals("NOT_FOUND", ex.getCode());
    }
}