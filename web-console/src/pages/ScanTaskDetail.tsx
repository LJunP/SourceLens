import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Tag, Typography, Spin, Button, Row, Col, Empty, Table, Badge, List, Tabs } from 'antd'
import { ArrowLeftOutlined, WarningOutlined, CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { scanTaskApi, ScanTask } from '../api/scanTask'
import { analysisApi, ScanArtifact } from '../api/analysis'
import DependencyGraphView from './DependencyGraph'

export default function ScanTaskDetail() {
  const { id } = useParams<{ id: string }>()
  const taskId = Number(id)
  const navigate = useNavigate()
  const [task, setTask] = useState<ScanTask | null>(null)
  const [artifacts, setArtifacts] = useState<ScanArtifact[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    scanTaskApi.detail(taskId)
      .then((res) => setTask(res.data.data))
      .finally(() => setLoading(false))
    analysisApi.listByTask(taskId)
      .then((res) => setArtifacts(res.data.data))
      .catch(() => setArtifacts([]))
  }, [taskId])

  const statusColor: Record<string, string> = {
    SUCCESS: 'success', FAILED: 'error', RUNNING: 'processing', PENDING: 'warning',
  }

  const artifactTitles: Record<string, string> = {
    ARCHITECTURE_OVERVIEW: '架构概览',
    ARCHITECTURE_REPORT: '架构分析报告',
    DEPENDENCY_GRAPH: '依赖分析',
    API_CATALOG: 'API 目录',
    DB_SCHEMA: '数据库 Schema',
    CODE_METRICS: '代码指标',
    RISK_REPORT: '风险报告',
    RAW_SCAN_RESULT: '原始扫描数据',
  }

  const parseJson = (json: string) => {
    try { return JSON.parse(json) } catch { return null }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>

  const reportArtifact = artifacts.find(a => a.artifactType === 'ARCHITECTURE_REPORT')
  const reportData = reportArtifact ? parseJson(reportArtifact.summaryJson) : null

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>返回</Button>
      <Typography.Title level={4}>扫描任务 #{taskId} 分析报告</Typography.Title>

      {task && (
        <Card style={{ marginBottom: 24 }}>
          <Descriptions column={3}>
            <Descriptions.Item label="状态">
              <Tag color={statusColor[task.status]}>{task.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="分支">{task.branch}</Descriptions.Item>
            <Descriptions.Item label="Commit">{task.commitSha ? task.commitSha.substring(0, 8) : '-'}</Descriptions.Item>
            <Descriptions.Item label="触发方式">{task.triggerType}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{task.createdAt}</Descriptions.Item>
            <Descriptions.Item label="开始时间">{task.startedAt || '-'}</Descriptions.Item>
            <Descriptions.Item label="结束时间">{task.finishedAt || '-'}</Descriptions.Item>
            {task.errorMessage && (
              <Descriptions.Item label="错误信息" span={3}>
                <Typography.Text type="danger">{task.errorMessage}</Typography.Text>
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}

      {reportData ? (
        <ArchitectureReport data={reportData} scanTaskId={taskId} />
      ) : task && task.status === 'FAILED' ? (
        <Card style={{ textAlign: 'center', padding: '60px 0' }}>
          <WarningOutlined style={{ fontSize: 48, color: '#ff4d4f', marginBottom: 16 }} />
          <Typography.Title level={4} type="danger">扫描任务执行失败</Typography.Title>
          <Typography.Text type="secondary">
            {task.errorMessage || '未知错误,请检查仓库配置后重试'}
          </Typography.Text>
        </Card>
      ) : artifacts.length === 0 ? (
        <Empty description="暂无分析产物" />
      ) : (
        <Tabs defaultActiveKey="overview" items={[
          {
            key: 'overview',
            label: '产物列表',
            children: (
              <Row gutter={[16, 16]}>
                {artifacts.map((a) => {
                  const data = parseJson(a.summaryJson)
                  return (
                    <Col span={12} key={a.id}>
                      <Card title={artifactTitles[a.artifactType] || a.artifactType} style={{ height: '100%' }}>
                        {data ? (
                          <Descriptions column={1} size="small" bordered>
                            {Object.entries(data).map(([key, value]) => {
                              if (key === 'title') return null
                              const display = Array.isArray(value)
                                ? value.length > 0 ? `${value.length} 项` : '-'
                                : typeof value === 'object' && value !== null
                                  ? JSON.stringify(value)
                                  : String(value ?? '-')
                              return <Descriptions.Item key={key} label={key}>{display}</Descriptions.Item>
                            })}
                          </Descriptions>
                        ) : (
                          <Typography.Text type="secondary">数据解析失败</Typography.Text>
                        )}
                      </Card>
                    </Col>
                  )
                })}
              </Row>
            ),
          },
        ]} />
      )}
    </div>
  )
}

function ArchitectureReport({ data, scanTaskId }: { data: any; scanTaskId: number }) {
  const overview = data.overview || {}
  const techStack = data.techStack || {}
  const directories = data.directories || {}
  const modules = data.modules || {}
  const codeQuality = data.codeQuality || {}
  const risks = codeQuality.risks || []
  const debts = data.technicalDebt || []
  const suggestions = data.suggestions || []
  const apiRoutes = data.apiRoutes || []
  const dbEntities = data.dbEntities || []

  const riskColor = (sev: string): 'error' | 'warning' | 'default' => {
    if (sev === 'HIGH') return 'error'
    if (sev === 'MEDIUM') return 'warning'
    return 'default'
  }

  return (
    <Tabs defaultActiveKey="summary" items={[
      {
        key: 'summary',
        label: '项目概览',
        children: (
          <>
            {/* 技术栈 */}
            {techStack.name && (
              <Card title="技术栈" style={{ marginBottom: 16 }}>
                <Descriptions column={2} bordered size="small">
                  <Descriptions.Item label="框架">{techStack.name}</Descriptions.Item>
                  <Descriptions.Item label="版本">{techStack.version || '未知'}</Descriptions.Item>
                  <Descriptions.Item label="证据" span={2}>
                    {(techStack.evidence || []).join(', ')}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            {/* 核心指标 */}
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              {[
                { label: '文件总数', value: overview.totalFiles },
                { label: '代码行数', value: overview.totalLines?.toLocaleString() },
                { label: '目录数', value: overview.totalDirs },
                { label: '测试文件', value: overview.testFiles },
                { label: '大文件', value: overview.largeFiles },
                { label: '生成文件', value: overview.generatedFiles },
              ].map((item) => (
                <Col span={4} key={item.label}>
                  <Card size="small">
                    <Typography.Text type="secondary">{item.label}</Typography.Text>
                    <Typography.Title level={3} style={{ margin: 0 }}>{item.value ?? '-'}</Typography.Title>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* 模块统计 */}
            <Card title="模块统计" style={{ marginBottom: 16 }}>
              <Descriptions column={4} bordered size="small">
                <Descriptions.Item label="Controller">{modules.controllers}</Descriptions.Item>
                <Descriptions.Item label="Service">{modules.services}</Descriptions.Item>
                <Descriptions.Item label="Repository">{modules.repositories}</Descriptions.Item>
                <Descriptions.Item label="Entity">{modules.entities}</Descriptions.Item>
                <Descriptions.Item label="Mapper">{modules.mappers}</Descriptions.Item>
                <Descriptions.Item label="Configuration">{modules.configurations}</Descriptions.Item>
                <Descriptions.Item label="DB Entity">{modules.dbEntities}</Descriptions.Item>
                <Descriptions.Item label="API Routes">{modules.apiRoutes}</Descriptions.Item>
              </Descriptions>
            </Card>
          </>
        ),
      },
      {
        key: 'structure',
        label: '目录结构',
        children: (
          <Card title="目录结构分析">
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="src/main">
                <Tag color={directories.srcMain ? 'success' : 'default'}>{directories.srcMain ? '存在' : '缺失'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="src/test">
                <Tag color={directories.srcTest ? 'success' : 'error'}>{directories.srcTest ? '存在' : '缺失'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="src/main/resources">
                <Tag color={directories.srcMainResources ? 'success' : 'default'}>{directories.srcMainResources ? '存在' : '缺失'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Controller 目录">
                {(directories.controllerDirs || []).join(', ') || '未识别'}
              </Descriptions.Item>
              <Descriptions.Item label="Service 目录">
                {(directories.serviceDirs || []).join(', ') || '未识别'}
              </Descriptions.Item>
              <Descriptions.Item label="Repository 目录">
                {(directories.repositoryDirs || []).join(', ') || '未识别'}
              </Descriptions.Item>
              <Descriptions.Item label="Mapper 目录">
                {(directories.mapperDirs || []).join(', ') || '未识别'}
              </Descriptions.Item>
              <Descriptions.Item label="Entity 目录">
                {(directories.entityDirs || []).join(', ') || '未识别'}
              </Descriptions.Item>
              <Descriptions.Item label="DTO 目录">
                {(directories.dtoDirs || []).join(', ') || '未识别'}
              </Descriptions.Item>
              <Descriptions.Item label="Config 目录">
                {(directories.configDirs || []).join(', ') || '未识别'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        ),
      },
      {
        key: 'api',
        label: `API (${apiRoutes.length})`,
        children: (
          <Card title="API 接口目录">
            <Table
              dataSource={apiRoutes}
              rowKey={(r: any) => `${r.method}-${r.path}`}
              size="small"
              pagination={{ pageSize: 20 }}
              columns={[
                { title: '方法', dataIndex: 'method', key: 'method', width: 80, render: (m: string) => <Tag>{m}</Tag> },
                { title: '路径', dataIndex: 'path', key: 'path' },
                { title: 'Controller', dataIndex: 'handler_class', key: 'handler_class' },
                { title: '方法', dataIndex: 'handler_method', key: 'handler_method' },
                { title: '行号', dataIndex: 'line_number', key: 'line_number', width: 70 },
              ]}
            />
          </Card>
        ),
      },
      {
        key: 'db',
        label: `数据库 (${dbEntities.length})`,
        children: (
          <Card title="数据库实体">
            {dbEntities.length === 0 ? (
              <Empty description="未检测到数据库实体" />
            ) : (
              <Table
                dataSource={dbEntities}
                rowKey="class_name"
                size="small"
                columns={[
                  { title: '类名', dataIndex: 'class_name', key: 'class_name' },
                  { title: '表名', dataIndex: 'table_name', key: 'table_name', render: (t: string) => t || <Tag>未指定</Tag> },
                  { title: '字段数', dataIndex: 'field_count', key: 'field_count', width: 80 },
                  { title: '文件', dataIndex: 'file_path', key: 'file_path', ellipsis: true },
                ]}
              />
            )}
          </Card>
        ),
      },
      {
        key: 'quality',
        label: '代码质量',
        children: (
          <>
            <Card title="质量指标" style={{ marginBottom: 16 }}>
              <Descriptions column={3} bordered size="small">
                <Descriptions.Item label="总类数">{codeQuality.totalClasses}</Descriptions.Item>
                <Descriptions.Item label="总方法数">{codeQuality.totalMethods}</Descriptions.Item>
                <Descriptions.Item label="平均方法数/类">{codeQuality.avgMethodsPerClass}</Descriptions.Item>
                {codeQuality.largest_class && (
                  <Descriptions.Item label="最大类" span={3}>
                    {codeQuality.largest_class.name} ({codeQuality.largest_class.line_count} 行) - {codeQuality.largest_class.file_path}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>

            {/* 风险列表 */}
            {risks.length > 0 && (
              <Card title={<><WarningOutlined /> 风险项 ({risks.length})</>} style={{ marginBottom: 16 }}>
                <List
                  dataSource={risks}
                  renderItem={(risk: any) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Badge status={riskColor(risk.severity)} text={risk.severity} />}
                        title={risk.category}
                        description={
                          <>
                            <div>{risk.message}</div>
                            {risk.file_path && <Typography.Text type="secondary" code>{risk.file_path}</Typography.Text>}
                          </>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            )}

            {/* 技术债 */}
            {debts.length > 0 && (
              <Card title="技术债评估" style={{ marginBottom: 16 }}>
                <List
                  dataSource={debts}
                  renderItem={(debt: any) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Badge status={riskColor(debt.severity)} text={debt.severity} />}
                        title={debt.category}
                        description={debt.detail}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            )}

            {/* 改进建议 */}
            {suggestions.length > 0 && (
              <Card title={<><InfoCircleOutlined /> 改进建议</>}>
                <List
                  dataSource={suggestions}
                  renderItem={(s: string) => (
                    <List.Item><CheckCircleOutlined style={{ marginRight: 8, color: '#52c41a' }} />{s}</List.Item>
                  )}
                />
              </Card>
            )}
          </>
        ),
      },
      {
        key: 'graph',
        label: '依赖图谱',
        children: (
          <DependencyGraphView scanTaskId={scanTaskId} />
        ),
      },
    ]} />
  )
}