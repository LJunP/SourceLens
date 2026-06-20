import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Tabs, Table, Button, Modal, Form, Input, Space, Popconfirm, Tag, message, Typography, Card, Row, Col, Empty, Spin, Progress } from 'antd'
import { PlusOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined, FileOutlined, FolderOutlined } from '@ant-design/icons'
import { projectApi, Project } from '../api/project'
import { repositoryApi, Repository } from '../api/repository'
import { scanTaskApi, ScanTask } from '../api/scanTask'
import { analysisApi, ScanArtifact } from '../api/analysis'

interface LanguageStat {
  name: string
  file_count: number
  line_count: number
}

interface OverviewData {
  languages: LanguageStat[]
  framework: { name: string; version: string } | null
  totalFiles: number
  totalDirs: number
  totalLines: number
  controllers: number
  services: number
  repositories: number
  entities: number
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
  const navigate = useNavigate()

  const [project, setProject] = useState<Project | null>(null)
  const [repos, setRepos] = useState<Repository[]>([])
  const [scans, setScans] = useState<ScanTask[]>([])
  const [loadingRepos, setLoadingRepos] = useState(true)
  const [loadingScans, setLoadingScans] = useState(true)
  const [repoModalOpen, setRepoModalOpen] = useState(false)
  const [repoForm] = Form.useForm()
  const [creatingScan, setCreatingScan] = useState<number | null>(null)

  // Overview state
  const [overviewLoading, setOverviewLoading] = useState(false)
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [fileTree, setFileTree] = useState<any>(null)
  const [overviewError, setOverviewError] = useState<string | null>(null)

  useEffect(() => {
    projectApi.detail(projectId).then((res) => setProject(res.data.data))
  }, [projectId])

  const loadRepos = () => {
    setLoadingRepos(true)
    repositoryApi.list(projectId).then((res) => setRepos(res.data.data)).finally(() => setLoadingRepos(false))
  }

  const loadScans = () => {
    setLoadingScans(true)
    scanTaskApi.list(projectId).then((res) => setScans(res.data.data.items)).finally(() => setLoadingScans(false))
  }

  useEffect(() => { loadRepos(); loadScans() }, [projectId])

  // 加载最新扫描的总览数据
  const loadOverview = async () => {
    setOverviewLoading(true)
    setOverviewError(null)
    try {
      const scansRes = await scanTaskApi.list(projectId)
      const tasks: ScanTask[] = scansRes.data.data.items || []
      const latestSuccess = tasks.find((t: ScanTask) => t.status === 'SUCCESS')
      if (!latestSuccess) {
        setOverviewError('暂无成功的扫描结果')
        return
      }
      const [artifactsRes] = await Promise.all([
        analysisApi.listByTask(latestSuccess.id),
      ])
      const artifacts: ScanArtifact[] = artifactsRes.data.data || []
      const archArt = artifacts.find((a: ScanArtifact) => a.artifactType === 'ARCHITECTURE_OVERVIEW')
      if (!archArt) {
        setOverviewError('未找到架构概览数据')
        return
      }
      const data = JSON.parse(archArt.summaryJson)
      // 后端 languages 返回对象格式 {"Java":{"file_count":10,"line_count":5000}}，需转为数组
      const rawLangs = data.languages
      const languages: LanguageStat[] = Array.isArray(rawLangs)
        ? rawLangs
        : rawLangs && typeof rawLangs === 'object'
          ? Object.entries(rawLangs).map(([name, val]: [string, any]) => ({
              name,
              file_count: val?.file_count ?? 0,
              line_count: val?.line_count ?? 0,
            }))
          : []
      setOverview({
        languages,
        framework: data.framework || null,
        totalFiles: data.totalFiles || 0,
        totalDirs: data.totalDirs || 0,
        totalLines: data.totalLines || 0,
        controllers: data.controllers || 0,
        services: data.services || 0,
        repositories: data.repositories || 0,
        entities: data.entities || 0,
      })
      setFileTree(data.entryPoints || null)
    } catch {
      setOverviewError('加载总览数据失败')
    } finally {
      setOverviewLoading(false)
    }
  }

  const handleAddRepo = async () => {
    const values = await repoForm.validateFields()
    await repositoryApi.add(projectId, values)
    message.success('仓库添加成功')
    setRepoModalOpen(false)
    repoForm.resetFields()
    loadRepos()
  }

  const handleDeleteRepo = async (repoId: number) => {
    await repositoryApi.delete(repoId)
    message.success('仓库已删除')
    loadRepos()
  }

  const handleCreateScan = async (repo: Repository) => {
    setCreatingScan(repo.id)
    try {
      await scanTaskApi.create(repo.id, { projectId })
      message.success('扫描任务已创建')
      loadScans()
    } catch {
      message.error('创建扫描任务失败')
    } finally {
      setCreatingScan(null)
    }
  }

  const statusColor: Record<string, string> = {
    SUCCESS: 'success', FAILED: 'error', RUNNING: 'processing', PENDING: 'warning',
  }

  return (
    <div>
      <Typography.Title level={4}>{project?.name || '加载中...'}</Typography.Title>
      {project?.description && <Typography.Paragraph type="secondary">{project.description}</Typography.Paragraph>}

      <Tabs defaultActiveKey="overview" onChange={(key) => { if (key === 'overview') loadOverview() }} items={[
        {
          key: 'overview',
          label: '项目总览',
          children: (
            <div>
              {overviewLoading ? (
                <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
              ) : overviewError ? (
                <Empty description={overviewError} />
              ) : overview ? (
                <>
                  {/* 基础指标卡片 */}
                  <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col span={6}>
                      <Card size="small"><Typography.Text type="secondary">文件总数</Typography.Text><Typography.Title level={3} style={{ margin: 0 }}>{overview.totalFiles}</Typography.Title></Card>
                    </Col>
                    <Col span={6}>
                      <Card size="small"><Typography.Text type="secondary">代码行数</Typography.Text><Typography.Title level={3} style={{ margin: 0 }}>{overview.totalLines.toLocaleString()}</Typography.Title></Card>
                    </Col>
                    <Col span={6}>
                      <Card size="small"><Typography.Text type="secondary">目录数</Typography.Text><Typography.Title level={3} style={{ margin: 0 }}>{overview.totalDirs}</Typography.Title></Card>
                    </Col>
                    <Col span={6}>
                      <Card size="small"><Typography.Text type="secondary">框架</Typography.Text><Typography.Title level={3} style={{ margin: 0 }}>{overview.framework?.name || '-'}</Typography.Title></Card>
                    </Col>
                  </Row>

                  <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col span={6}>
                      <Card size="small"><Typography.Text type="secondary">Controller</Typography.Text><Typography.Title level={3} style={{ margin: 0 }}>{overview.controllers}</Typography.Title></Card>
                    </Col>
                    <Col span={6}>
                      <Card size="small"><Typography.Text type="secondary">Service</Typography.Text><Typography.Title level={3} style={{ margin: 0 }}>{overview.services}</Typography.Title></Card>
                    </Col>
                    <Col span={6}>
                      <Card size="small"><Typography.Text type="secondary">Repository</Typography.Text><Typography.Title level={3} style={{ margin: 0 }}>{overview.repositories}</Typography.Title></Card>
                    </Col>
                    <Col span={6}>
                      <Card size="small"><Typography.Text type="secondary">Entity</Typography.Text><Typography.Title level={3} style={{ margin: 0 }}>{overview.entities}</Typography.Title></Card>
                    </Col>
                  </Row>

                  {/* 语言占比 */}
                  {overview.languages.length > 0 && (
                    <Card title="语言占比" style={{ marginBottom: 24 }}>
                      {overview.languages.map((lang) => {
                        const totalLines = overview.languages.reduce((s, l) => s + l.line_count, 0)
                        const percent = totalLines > 0 ? Math.round((lang.line_count / totalLines) * 100) : 0
                        return (
                          <div key={lang.name} style={{ marginBottom: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span>{lang.name}</span>
                              <Typography.Text type="secondary">{lang.file_count} 文件 / {lang.line_count.toLocaleString()} 行 / {percent}%</Typography.Text>
                            </div>
                            <Progress percent={percent} showInfo={false} strokeColor={getLangColor(lang.name)} />
                          </div>
                        )
                      })}
                    </Card>
                  )}

                  {/* 文件树入口 */}
                  {fileTree && (
                    <Card title="入口文件" style={{ marginBottom: 24 }}>
                      <Space direction="vertical" size={4}>
                        {Array.isArray(fileTree) && fileTree.map((f: string, i: number) => (
                          <div key={i}><FileOutlined style={{ marginRight: 6 }} />{f}</div>
                        ))}
                        {typeof fileTree === 'object' && !Array.isArray(fileTree) && Object.entries(fileTree).map(([k, v]) => (
                          <div key={k}><FolderOutlined style={{ marginRight: 6 }} />{k}: {String(v)}</div>
                        ))}
                      </Space>
                    </Card>
                  )}
                </>
              ) : null}
            </div>
          ),
        },
        {
          key: 'repos',
          label: '仓库管理',
          children: (
            <>
              <div style={{ marginBottom: 16 }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => { repoForm.resetFields(); setRepoModalOpen(true) }}>添加仓库</Button>
              </div>
              <Table
                dataSource={repos}
                rowKey="id"
                loading={loadingRepos}
                columns={[
                  { title: '仓库名', key: 'fullName', render: (_: any, r: Repository) => `${r.owner}/${r.name}` },
                  { title: '分支', dataIndex: 'defaultBranch', key: 'defaultBranch' },
                  { title: 'Provider', dataIndex: 'provider', key: 'provider' },
                  { title: '状态', dataIndex: 'status', key: 'status' },
                  {
                    title: '操作', key: 'action', width: 220,
                    render: (_: any, r: Repository) => (
                      <Space>
                        <Button size="small" icon={<SearchOutlined />} loading={creatingScan === r.id} onClick={() => handleCreateScan(r)}>扫描</Button>
                        <Popconfirm title="确认删除此仓库？" onConfirm={() => handleDeleteRepo(r.id)}>
                          <Button size="small" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                      </Space>
                    )
                  },
                ]}
              />
            </>
          ),
        },
        {
          key: 'scans',
          label: '扫描任务',
          children: (
            <>
              <div style={{ marginBottom: 16 }}>
                <Button icon={<ReloadOutlined />} onClick={loadScans}>刷新</Button>
              </div>
              <Table
                dataSource={scans}
                rowKey="id"
                loading={loadingScans}
                columns={[
                  { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
                  { title: '分支', dataIndex: 'branch', key: 'branch' },
                  { title: 'Commit', dataIndex: 'commitSha', key: 'commitSha', render: (s: string) => s ? s.substring(0, 8) : '-' },
                  { title: '触发方式', dataIndex: 'triggerType', key: 'triggerType' },
                  {
                    title: '状态', dataIndex: 'status', key: 'status',
                    render: (s: string) => <Tag color={statusColor[s]}>{s}</Tag>
                  },
                  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
                  { title: '操作', key: 'action', width: 100,
                    render: (_: any, r: ScanTask) => (
                      <Button size="small" onClick={() => navigate(`/scan-tasks/${r.id}`)}>查看报告</Button>
                    )
                  },
                ]}
              />
            </>
          ),
        },
      ]} />

      <Modal title="添加仓库" open={repoModalOpen} onOk={handleAddRepo} onCancel={() => setRepoModalOpen(false)}>
        <Form form={repoForm} layout="vertical">
          <Form.Item name="url" label="仓库 URL" rules={[{ required: true, message: '请输入 GitHub 仓库 URL' }]}>
            <Input placeholder="https://github.com/owner/repo" />
          </Form.Item>
          <Form.Item name="defaultBranch" label="默认分支">
            <Input placeholder="main" />
          </Form.Item>
          <Form.Item name="token" label="Access Token" extra="私有仓库必填。请使用 GitHub PAT (ghp_ 开头)，需要 repo 权限">
            <Input.Password placeholder="ghp_xxxx" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

function getLangColor(name: string): string {
  const colors: Record<string, string> = {
    Java: '#b07219', JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5',
    Go: '#00ADD8', Rust: '#dea584', 'C++': '#f34b7d', C: '#555555', HTML: '#e34c26',
    CSS: '#563d7c', YAML: '#cb171e', XML: '#0060ac', JSON: '#292929', Markdown: '#083fa1',
    Shell: '#89e051', SQL: '#e38c00', PHP: '#4F5D95', Ruby: '#701516', Kotlin: '#A97BFF',
    Scala: '#c22d40', Swift: '#F05138', Dart: '#00B4AB', Vue: '#41b883', JSX: '#61dafb',
  }
  return colors[name] || '#8c8c8c'
}