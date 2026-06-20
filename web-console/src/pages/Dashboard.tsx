import { useState, useEffect } from 'react'
import {
  Card, Col, Row, Statistic, Table, Tag, Typography, Progress, Descriptions, Empty, Badge
} from 'antd'
import {
  ProjectOutlined, CheckCircleOutlined, CloseCircleOutlined, SyncOutlined,
  ClockCircleOutlined, DatabaseOutlined,
  ExperimentOutlined,
  DeploymentUnitOutlined
} from '@ant-design/icons'
import { dashboardApi, DashboardStats, RecentScan, LanguageStat } from '../api/dashboard'

const { Text } = Typography

function formatDuration(ms: number | null): string {
  if (ms == null) return '-'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`
  const min = Math.floor(ms / 60_000)
  const sec = ((ms % 60_000) / 1000).toFixed(0)
  return `${min}m ${sec}s`
}

const LANG_COLORS: Record<string, string> = {
  Java: '#b07219', TypeScript: '#3178c6', JavaScript: '#f1e05a',
  Python: '#3572A5', Go: '#00ADD8', Rust: '#dea584', 'C++': '#f34b7d',
  HTML: '#e34c26', CSS: '#563d7c', YAML: '#cb171e', XML: '#0060ac',
  JSON: '#292929', Markdown: '#083fa1', Shell: '#89e051', SQL: '#e38c00',
}

const statusColor: Record<string, string> = {
  SUCCESS: 'success', FAILED: 'error', RUNNING: 'processing', PENDING: 'warning',
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [scans, setScans] = useState<RecentScan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([dashboardApi.stats(), dashboardApi.recentScans()])
      .then(([statsRes, scansRes]) => {
        setStats(statsRes.data.data)
        setScans(scansRes.data.data)
      })
      .finally(() => setLoading(false))
  }, [])

  // 解析语言分布(后端返回的是对象 {"Java": {"file_count":10,"line_count":5000}}, 需转为数组)
  const languages: LanguageStat[] = (() => {
    if (!stats?.languagesJson) return []
    try {
      const parsed = JSON.parse(stats.languagesJson)
      if (Array.isArray(parsed)) return parsed
      return Object.entries(parsed).map(([name, val]: [string, any]) => ({
        name,
        file_count: val?.file_count ?? 0,
        line_count: val?.line_count ?? 0,
      }))
    } catch { return [] }
  })()
  const totalLangLines = languages.reduce((s, l) => s + (l.line_count || 0), 0)

  return (
    <div>
      <Typography.Title level={4} style={{ marginBottom: 24 }}>仪表盘</Typography.Title>

      {/* ===== 第一行: 核心统计 ===== */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card><Statistic title="项目" value={stats?.projectCount ?? 0} prefix={<ProjectOutlined />} loading={loading} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="仓库" value={stats?.repositoryCount ?? 0} prefix={<DatabaseOutlined />} loading={loading} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="扫描任务" value={stats?.totalScans ?? 0} prefix={<ExperimentOutlined />} loading={loading} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="Agent 任务" value={stats?.agentTaskCount ?? 0} prefix={<DeploymentUnitOutlined />} loading={loading} /></Card>
        </Col>
      </Row>

      {/* ===== 第二行: 扫描状态 + Agent 状态 + Issue 状态 ===== */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card title="扫描状态" size="small" loading={loading}>
            <Descriptions column={2} size="small">
              <Descriptions.Item label={<><CheckCircleOutlined style={{ color: '#52c41a' }} /> 成功</>}>
                {stats?.successScans ?? 0}
              </Descriptions.Item>
              <Descriptions.Item label={<><CloseCircleOutlined style={{ color: '#ff4d4f' }} /> 失败</>}>
                {stats?.failedScans ?? 0}
              </Descriptions.Item>
              <Descriptions.Item label={<><SyncOutlined style={{ color: '#1890ff' }} /> 运行中</>}>
                {stats?.runningScans ?? 0}
              </Descriptions.Item>
              <Descriptions.Item label={<><ClockCircleOutlined style={{ color: '#faad14' }} /> 等待中</>}>
                {stats?.pendingScans ?? 0}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Agent 任务" size="small" loading={loading}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="总计">{stats?.agentTaskCount ?? 0}</Descriptions.Item>
              <Descriptions.Item label="运行中">{stats?.agentTaskRunning ?? 0}</Descriptions.Item>
              <Descriptions.Item label="已完成">{stats?.agentTaskCompleted ?? 0}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Issue 拆解" size="small" loading={loading}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="总计">{stats?.issueCount ?? 0}</Descriptions.Item>
              <Descriptions.Item label="已完成">{stats?.issueCompleted ?? 0}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {/* ===== 第三行: 最新扫描指标 + 语言分布 ===== */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="最新扫描产物指标" size="small" loading={loading}>
            {stats?.latestTotalFiles != null ? (
              <Descriptions column={3} bordered size="small">
                <Descriptions.Item label="文件数">{stats.latestTotalFiles}</Descriptions.Item>
                <Descriptions.Item label="代码行">{stats.latestTotalLines?.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="目录数">{stats.latestTotalDirs}</Descriptions.Item>
                <Descriptions.Item label="Controller">{stats.latestControllers}</Descriptions.Item>
                <Descriptions.Item label="Service">{stats.latestServices}</Descriptions.Item>
                <Descriptions.Item label="风险项">
                  {stats.latestRiskCount != null && stats.latestRiskCount > 0
                    ? <Badge count={stats.latestRiskCount} style={{ backgroundColor: '#ff4d4f' }} />
                    : <Text type="success">0</Text>
                  }
                </Descriptions.Item>
              </Descriptions>
            ) : (
              <Empty description="暂无扫描结果" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="语言分布(最新扫描)" size="small" loading={loading}>
            {languages.length > 0 ? (
              languages.map(lang => {
                const percent = totalLangLines > 0 ? Math.round((lang.line_count / totalLangLines) * 100) : 0
                return (
                  <div key={lang.name} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <Text strong>{lang.name}</Text>
                      <Text type="secondary">{lang.file_count} 文件 / {lang.line_count.toLocaleString()} 行 / {percent}%</Text>
                    </div>
                    <Progress
                      percent={percent}
                      showInfo={false}
                      strokeColor={LANG_COLORS[lang.name] || '#8c8c8c'}
                      size="small"
                    />
                  </div>
                )
              })
            ) : (
              <Empty description="暂无语言数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
      </Row>

      {/* ===== 第四行: 最近扫描 ===== */}
      <Card title="最近扫描" loading={loading}>
        <Table
          dataSource={scans}
          rowKey="id"
          pagination={false}
          locale={{ emptyText: '暂无扫描记录' }}
          size="small"
          columns={[
            { title: 'ID', dataIndex: 'id', key: 'id', width: 50 },
            {
              title: '项目', dataIndex: 'projectName', key: 'projectName', width: 140,
              ellipsis: true,
            },
            {
              title: '仓库', dataIndex: 'repositoryName', key: 'repositoryName', width: 140,
              ellipsis: true,
            },
            { title: '分支', dataIndex: 'branch', key: 'branch', width: 100 },
            {
              title: 'Commit', dataIndex: 'commitSha', key: 'commitSha', width: 80,
              render: (s: string | null) => s ? <Text code style={{ fontSize: 11 }}>{s.substring(0, 7)}</Text> : '-',
            },
            {
              title: '状态', dataIndex: 'status', key: 'status', width: 100,
              render: (s: string) => (
                <Tag icon={s === 'RUNNING' ? <SyncOutlined spin /> : undefined} color={statusColor[s]}>{s}</Tag>
              ),
            },
            {
              title: '耗时', dataIndex: 'durationMs', key: 'durationMs', width: 80,
              render: (ms: number | null) => formatDuration(ms),
            },
            {
              title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 160,
              render: (t: string) => t ? new Date(t).toLocaleString('zh-CN') : '-',
            },
          ]}
        />
      </Card>
    </div>
  )
}