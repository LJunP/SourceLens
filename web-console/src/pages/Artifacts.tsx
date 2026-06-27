import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Button, Card, Descriptions, Drawer, Empty, Input, Select, Space, Table, Tag, Tooltip, Typography } from 'antd'
import {
  ApiOutlined,
  BranchesOutlined,
  CheckCircleOutlined,
  DatabaseOutlined,
  DownloadOutlined,
  EyeOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  HddOutlined,
  LinkOutlined,
  ReloadOutlined,
  SearchOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { artifactApi, ArtifactPreviewResponse, ArtifactRecord } from '../api/artifact'
import { formatApiError, showApiError } from '../api/client'
import ArtifactPreviewRenderer from '../components/ArtifactPreviewRenderer'

const { Text } = Typography

const ARTIFACT_LABELS: Record<string, string> = {
  RAW_SCAN_RESULT: '原始扫描',
  ARCHITECTURE_OVERVIEW: '架构概览',
  ARCHITECTURE_REPORT: '架构报告',
  DEPENDENCY_GRAPH: '依赖图谱',
  API_CATALOG: 'API 目录',
  DB_SCHEMA: '数据库 Schema',
  CODE_METRICS: '代码指标',
  RISK_REPORT: '风险报告',
  CHANGE_PATCH: '补丁文件',
  AGENT_REPORT: 'Agent 报告',
}

const ARTIFACT_COLORS: Record<string, string> = {
  RAW_SCAN_RESULT: 'default',
  ARCHITECTURE_OVERVIEW: 'blue',
  ARCHITECTURE_REPORT: 'geekblue',
  DEPENDENCY_GRAPH: 'purple',
  API_CATALOG: 'cyan',
  DB_SCHEMA: 'green',
  CODE_METRICS: 'gold',
  RISK_REPORT: 'red',
  CHANGE_PATCH: 'orange',
  AGENT_REPORT: 'volcano',
}

const CORE_EVIDENCE_TYPES = ['ARCHITECTURE_REPORT', 'API_CATALOG', 'DB_SCHEMA', 'DEPENDENCY_GRAPH']
const EVIDENCE_STALE_DAYS = 14

type ArtifactSignalTone = 'ready' | 'warning' | 'danger' | 'idle'

interface ArtifactEvidenceSignal {
  label: string
  tone: ArtifactSignalTone
  confidence: number
  summary: string
  nextActions: string[]
  metrics: Array<{
    label: string
    value: string
    tone: ArtifactSignalTone
  }>
}

interface Props {
  projectId: number
  initialFilters?: {
    repositoryId?: number
    ownerType?: string
    ownerId?: number
  }
  initialArtifactId?: number
}

export default function Artifacts({ projectId, initialFilters, initialArtifactId }: Props) {
  const navigate = useNavigate()
  const [records, setRecords] = useState<ArtifactRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [artifactType, setArtifactType] = useState<string>('ALL')
  const [ownerType, setOwnerType] = useState<string>('ALL')
  const [ownerScope, setOwnerScope] = useState<string>('ALL')
  const [selected, setSelected] = useState<ArtifactRecord | null>(null)
  const [preview, setPreview] = useState<ArtifactPreviewResponse | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [pendingArtifactId, setPendingArtifactId] = useState<number | undefined>(initialArtifactId)

  const loadArtifacts = useCallback(() => {
    setLoading(true)
    setLoadError(null)
    artifactApi.list(projectId, normalizeFilters(initialFilters))
      .then(res => {
        setRecords(res.data.data || [])
        setLoadError(null)
      })
      .catch(error => setLoadError(formatApiError(error, '加载运行产物失败')))
      .finally(() => setLoading(false))
  }, [projectId, initialFilters?.repositoryId, initialFilters?.ownerType, initialFilters?.ownerId])

  useEffect(() => {
    setRecords([])
    setSelected(null)
    setPreview(null)
    setPreviewError(null)
    setLoadError(null)
    loadArtifacts()
  }, [loadArtifacts])

  useEffect(() => {
    setPendingArtifactId(initialArtifactId)
  }, [initialArtifactId])

  const filtered = useMemo(() => records.filter(record => {
    const q = keyword.trim().toLowerCase()
    const matchedType = artifactType === 'ALL' || record.artifactType === artifactType
    const matchedOwner = ownerType === 'ALL' || record.ownerType === ownerType
    const matchedOwnerScope = ownerScope === 'ALL' || ownerKey(record) === ownerScope
    if (!matchedType || !matchedOwner || !matchedOwnerScope) return false
    if (!q) return true
    return [
      record.ownerType,
      String(record.ownerId),
      record.artifactType,
      artifactLabel(record.artifactType),
      record.contentType || '',
      record.checksumSha256 || '',
      ownerDisplay(record),
    ].some(value => value.toLowerCase().includes(q))
  }), [records, keyword, artifactType, ownerScope, ownerType])

  const artifactTypeOptions = useMemo(() => [
    { value: 'ALL', label: '全部类型' },
    ...Array.from(new Set(records.map(record => record.artifactType))).sort().map(type => ({
      value: type,
      label: artifactLabel(type),
    })),
  ], [records])

  const ownerTypeOptions = useMemo(() => [
    { value: 'ALL', label: '全部 Owner' },
    ...Array.from(new Set(records.map(record => record.ownerType))).sort().map(type => ({
      value: type,
      label: type,
    })),
  ], [records])

  const ownerBundles = useMemo(() => {
    const map = new Map<string, {
      key: string
      ownerType: string
      ownerId: number
      count: number
      bytes: number
      coreCount: number
      previewable: number
      checksum: number
      latestAt: string
      sourceOpenable: boolean
    }>()
    for (const record of records) {
      const key = ownerKey(record)
      const current = map.get(key) || {
        key,
        ownerType: record.ownerType,
        ownerId: record.ownerId,
        count: 0,
        bytes: 0,
        coreCount: 0,
        previewable: 0,
        checksum: 0,
        latestAt: record.createdAt,
        sourceOpenable: false,
      }
      current.count += 1
      current.bytes += record.sizeBytes || 0
      if (CORE_EVIDENCE_TYPES.includes(record.artifactType)) current.coreCount += 1
      if (isTextPreviewable(record)) current.previewable += 1
      if (record.checksumSha256) current.checksum += 1
      if (new Date(record.createdAt).getTime() > new Date(current.latestAt).getTime()) current.latestAt = record.createdAt
      if (canOpenArtifactSource(record)) current.sourceOpenable = true
      map.set(key, current)
    }
    return Array.from(map.values()).sort((a, b) =>
      b.coreCount - a.coreCount
      || b.count - a.count
      || new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime()
    )
  }, [records])

  const summary = useMemo(() => {
    const totalBytes = records.reduce((sum, record) => sum + (record.sizeBytes || 0), 0)
    const jsonCount = records.filter(record => isTextPreviewable(record)).length
    const ownerCount = new Set(records.map(record => `${record.ownerType}:${record.ownerId}`)).size
    const sourceLinkedCount = records.filter(canOpenArtifactSource).length
    const staleCount = records.filter(isStaleArtifact).length
    const emptyCount = records.filter(record => record.sizeBytes <= 0).length
    const typeStats = Array.from(records.reduce((map, record) => {
      const stat = map.get(record.artifactType) || { type: record.artifactType, count: 0, bytes: 0 }
      stat.count += 1
      stat.bytes += record.sizeBytes || 0
      map.set(record.artifactType, stat)
      return map
    }, new Map<string, { type: string; count: number; bytes: number }>()).values())
      .sort((a, b) => b.count - a.count || b.bytes - a.bytes)
    return { totalBytes, jsonCount, ownerCount, sourceLinkedCount, staleCount, emptyCount, typeStats }
  }, [records])

  const scopeLabel = useMemo(() => {
    const parts: string[] = []
    if (initialFilters?.ownerType && initialFilters.ownerId) {
      parts.push(`${initialFilters.ownerType} #${initialFilters.ownerId}`)
    }
    if (initialFilters?.repositoryId) {
      parts.push(`Repository #${initialFilters.repositoryId}`)
    }
    return parts.length ? parts.join(' / ') : 'Project evidence'
  }, [initialFilters?.ownerType, initialFilters?.ownerId, initialFilters?.repositoryId])

  const latestRecord = useMemo(() => {
    return records.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] || null
  }, [records])

  const bestBundle = ownerBundles[0] || null

  const primaryRecord = useMemo(() => {
    const preferred = ['ARCHITECTURE_REPORT', 'API_CATALOG', 'DB_SCHEMA', 'DEPENDENCY_GRAPH', 'RAW_SCAN_RESULT']
    const scopedRecords = bestBundle ? records.filter(record => ownerKey(record) === bestBundle.key) : records
    return preferred.map(type => scopedRecords.find(record => record.artifactType === type)).find(Boolean) || latestRecord
  }, [bestBundle, latestRecord, records])

  const previewableRate = records.length > 0 ? Math.round((summary.jsonCount / records.length) * 100) : 0

  const evidenceStages = useMemo(() => [
    { type: 'ARCHITECTURE_REPORT', label: '架构报告', icon: <FileTextOutlined /> },
    { type: 'API_CATALOG', label: 'API 目录', icon: <ApiOutlined /> },
    { type: 'DB_SCHEMA', label: '数据库', icon: <DatabaseOutlined /> },
    { type: 'DEPENDENCY_GRAPH', label: '依赖图谱', icon: <BranchesOutlined /> },
  ].map(item => {
    const matches = records.filter(record => record.artifactType === item.type)
    const bytes = matches.reduce((sum, record) => sum + (record.sizeBytes || 0), 0)
    return { ...item, count: matches.length, bytes }
  }), [records])

  const evidenceSignal = useMemo(() => buildArtifactEvidenceSignal(records, Boolean(loadError)), [loadError, records])

  const openArtifactSource = useCallback((record: ArtifactRecord) => {
    const path = artifactSourcePath(projectId, record)
    if (path) navigate(path)
  }, [navigate, projectId])

  const loadPreview = useCallback((record: ArtifactRecord) => {
    setPreview(null)
    setPreviewError(null)
    setPreviewLoading(true)
    artifactApi.preview(projectId, record.id)
      .then(res => {
        setPreview(res.data.data)
        setPreviewError(null)
      })
      .catch(error => setPreviewError(formatApiError(error, '当前产物不支持文本预览或文件不可读')))
      .finally(() => setPreviewLoading(false))
  }, [projectId])

  const openDetail = useCallback((record: ArtifactRecord, withPreview = false) => {
    setSelected(record)
    setPreview(null)
    setPreviewError(null)
    if (withPreview) {
      loadPreview(record)
    }
  }, [loadPreview])

  const previewArtifact = useCallback((record: ArtifactRecord) => {
    setSelected(record)
    loadPreview(record)
  }, [loadPreview])

  useEffect(() => {
    if (!pendingArtifactId || loading || selected?.id === pendingArtifactId) return
    const record = records.find(item => item.id === pendingArtifactId)
    if (!record) return
    setArtifactType('ALL')
    setOwnerType('ALL')
    previewArtifact(record)
    setPendingArtifactId(undefined)
  }, [loading, pendingArtifactId, previewArtifact, records, selected?.id])

  const downloadArtifact = (record: ArtifactRecord) => {
    artifactApi.download(projectId, record.id)
      .then(res => {
        const url = URL.createObjectURL(res.data)
        const link = document.createElement('a')
        link.href = url
        link.download = parseDownloadFileName(res.headers['content-disposition']) || `artifact-${record.id}`
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(url)
      })
      .catch(error => showApiError(error, '下载运行产物失败'))
  }

  return (
    <div>
      <div className="sl-artifact-cockpit">
        <section className="sl-artifact-cockpit-main">
          <div className="sl-kicker">Artifact Evidence Center</div>
          <h1 className="sl-artifact-cockpit-title">运行产物证据中心</h1>
          <p className="sl-artifact-cockpit-desc">
            聚合扫描报告、API 目录、数据库 Schema、依赖图谱和原始扫描结果，用于复盘每一次代码逆向分析的证据链。
          </p>
          <div className="sl-artifact-cockpit-status">
            <span className="sl-live-dot" />
            <span>{scopeLabel}</span>
            <span>{filtered.length}/{records.length} visible</span>
            <span>{formatBytes(summary.totalBytes)} stored</span>
          </div>
          <div className="sl-artifact-toolbar sl-artifact-cockpit-toolbar">
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="搜索类型、owner 或 checksum"
              value={keyword}
              onChange={event => setKeyword(event.target.value)}
            />
            <Select value={artifactType} options={artifactTypeOptions} onChange={setArtifactType} />
            <Select
              value={ownerType}
              options={ownerTypeOptions}
              onChange={value => {
                setOwnerType(value)
                setOwnerScope('ALL')
              }}
            />
            <Select
              value={ownerScope}
              options={[
                { value: 'ALL', label: '全部证据包' },
                ...ownerBundles
                  .filter(bundle => ownerType === 'ALL' || bundle.ownerType === ownerType)
                  .map(bundle => ({
                    value: bundle.key,
                    label: `${bundle.ownerType} #${bundle.ownerId}`,
                  })),
              ]}
              onChange={setOwnerScope}
            />
            <Button icon={<ReloadOutlined />} onClick={loadArtifacts}>
              刷新
            </Button>
          </div>
        </section>

        <section className="sl-artifact-focus-card">
          <div className="sl-artifact-focus-head">
            <div>
              <span>Primary evidence</span>
              <strong>{primaryRecord ? artifactLabel(primaryRecord.artifactType) : '暂无产物'}</strong>
            </div>
            <CheckCircleOutlined />
          </div>
          {primaryRecord ? (
            <>
              <div className="sl-artifact-focus-meta">
                <div>
                  <span>Artifact</span>
                  <strong>#{primaryRecord.id}</strong>
                </div>
                <div>
                  <span>Owner</span>
                  <strong>{primaryRecord.ownerType} #{primaryRecord.ownerId}</strong>
                </div>
                <div>
                  <span>大小</span>
                  <strong>{formatBytes(primaryRecord.sizeBytes)}</strong>
                </div>
                <div>
                  <span>预览</span>
                  <strong>{isTextPreviewable(primaryRecord) ? '可用' : '下载'}</strong>
                </div>
                <div>
                  <span>来源</span>
                  <strong>{canOpenArtifactSource(primaryRecord) ? '可跳转' : '缺失'}</strong>
                </div>
                <div>
                  <span>证据包</span>
                  <strong>{bestBundle ? `${bestBundle.coreCount}/${CORE_EVIDENCE_TYPES.length}` : '-'}</strong>
                </div>
              </div>
              <div className="sl-artifact-focus-actions">
                <Button block icon={<EyeOutlined />} disabled={!isTextPreviewable(primaryRecord)} onClick={() => previewArtifact(primaryRecord)}>
                  打开智能预览
                </Button>
                <Button block icon={<LinkOutlined />} disabled={!canOpenArtifactSource(primaryRecord)} onClick={() => openArtifactSource(primaryRecord)}>
                  打开来源
                </Button>
              </div>
            </>
          ) : (
            <div className="sl-artifact-empty-focus">当前范围暂无可用产物。</div>
          )}
        </section>
      </div>

      <div className="sl-artifact-evidence-grid" aria-label="核心产物证据状态">
        {evidenceStages.map(stage => (
          <button
            aria-pressed={artifactType === stage.type}
            className={`sl-artifact-evidence-stage ${artifactType === stage.type ? 'sl-artifact-evidence-stage-active' : ''}`}
            key={stage.type}
            type="button"
            onClick={() => setArtifactType(artifactType === stage.type ? 'ALL' : stage.type)}
          >
            <div className={`sl-artifact-evidence-icon ${stage.count > 0 ? 'sl-artifact-evidence-icon-ready' : ''}`}>{stage.icon}</div>
            <div>
              <span>{stage.label}</span>
              <strong>{stage.count}</strong>
              <small>{stage.count > 0 ? formatBytes(stage.bytes) : '等待生成'}</small>
            </div>
          </button>
        ))}
      </div>

      <ArtifactEvidenceReadiness signal={evidenceSignal} />

      {loadError && (
        <Alert
          className="sl-artifact-source-error"
          type="error"
          showIcon
          message={records.length > 0 ? '产物数据刷新失败，已保留上次成功数据' : '产物数据加载失败'}
          description={loadError}
          action={<Button size="small" danger onClick={loadArtifacts}>重试加载</Button>}
        />
      )}

      <div className="sl-artifact-summary-grid">
        <ArtifactStat icon={<DatabaseOutlined />} label="产物总数" value={records.length} footnote={`${filtered.length} 个当前可见`} />
        <ArtifactStat icon={<HddOutlined />} label="存储体量" value={formatBytes(summary.totalBytes)} footnote={`${summary.typeStats.length} 种产物类型`} />
        <ArtifactStat icon={<FileSearchOutlined />} label="可预览" value={`${summary.jsonCount} / ${previewableRate}%`} footnote="文本 / JSON 类产物" />
        <ArtifactStat icon={<LinkOutlined />} label="来源闭环" value={`${summary.sourceLinkedCount}/${records.length}`} footnote={`${summary.ownerCount} 个证据包`} />
        <ArtifactStat icon={<WarningOutlined />} label="异常产物" value={summary.emptyCount + summary.staleCount} footnote={`${summary.emptyCount} 空 / ${summary.staleCount} 过期`} />
      </div>

      {ownerBundles.length > 0 && (
        <div className="sl-artifact-bundle-strip">
          {ownerBundles.slice(0, 10).map(bundle => (
            <button
              key={bundle.key}
              type="button"
              aria-pressed={ownerScope === bundle.key}
              className={`sl-artifact-bundle-chip ${ownerScope === bundle.key ? 'sl-artifact-bundle-chip-active' : ''}`}
              onClick={() => {
                setOwnerScope(ownerScope === bundle.key ? 'ALL' : bundle.key)
                setOwnerType('ALL')
              }}
            >
              <span>{bundle.ownerType} #{bundle.ownerId}</span>
              <strong>{bundle.coreCount}/{CORE_EVIDENCE_TYPES.length}</strong>
              <small>{bundle.count} 个产物 / {formatBytes(bundle.bytes)}</small>
              <i>{bundle.sourceOpenable ? '可回溯' : '来源缺失'}</i>
            </button>
          ))}
        </div>
      )}

      {summary.typeStats.length > 0 && (
        <div className="sl-artifact-type-strip">
          {summary.typeStats.slice(0, 8).map(stat => (
            <button
              className={`sl-artifact-type-chip ${artifactType === stat.type ? 'sl-artifact-type-chip-active' : ''}`}
              key={stat.type}
              type="button"
              aria-pressed={artifactType === stat.type}
              onClick={() => setArtifactType(artifactType === stat.type ? 'ALL' : stat.type)}
            >
              <span>{artifactLabel(stat.type)}</span>
              <strong>{stat.count}</strong>
              <small>{formatBytes(stat.bytes)}</small>
            </button>
          ))}
        </div>
      )}

      <Card className="sl-section-card sl-artifact-table-card">
        <Table
          rowKey="id"
          dataSource={filtered}
          loading={loading}
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无运行产物" /> }}
          pagination={{ pageSize: 20, showTotal: total => `共 ${total} 个产物` }}
          scroll={{ x: 980 }}
          columns={[
            {
              title: '类型',
              dataIndex: 'artifactType',
              key: 'artifactType',
              width: 210,
              render: (value: string, record: ArtifactRecord) => (
                <Space direction="vertical" size={2}>
                  <Tag color={ARTIFACT_COLORS[value] || 'blue'}>{artifactLabel(value)}</Tag>
                  <Text type="secondary" style={{ fontSize: 12 }}>{value}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>{record.contentType || '-'}</Text>
                </Space>
              ),
            },
            {
              title: 'Owner',
              key: 'owner',
              width: 150,
              render: (_: unknown, record: ArtifactRecord) => (
                <Space direction="vertical" size={2}>
                  <Space size="small">
                    <Tag>{record.ownerType}</Tag>
                    <Text>#{record.ownerId}</Text>
                  </Space>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {record.repositoryId ? `Repository #${record.repositoryId}` : 'Project artifact'}
                  </Text>
                </Space>
              ),
            },
            {
              title: '大小',
              dataIndex: 'sizeBytes',
              key: 'sizeBytes',
              width: 90,
              render: formatBytes,
            },
            {
              title: 'SHA-256',
              dataIndex: 'checksumSha256',
              key: 'checksumSha256',
              width: 140,
              render: (value: string | null) => value ? <Text code copyable>{value.slice(0, 12)}...</Text> : '-',
            },
            {
              title: '可用性',
              key: 'readiness',
              width: 150,
              render: (_: unknown, record: ArtifactRecord) => (
                <Space size={[4, 4]} wrap>
                  <Tag color={isTextPreviewable(record) ? 'green' : 'default'}>{isTextPreviewable(record) ? '可预览' : '需下载'}</Tag>
                  <Tag color={record.checksumSha256 ? 'blue' : 'orange'}>{record.checksumSha256 ? '已校验' : '无校验'}</Tag>
                  {record.sizeBytes <= 0 && <Tag color="red">空文件</Tag>}
                </Space>
              ),
            },
            {
              title: '创建时间',
              dataIndex: 'createdAt',
              key: 'createdAt',
              width: 150,
              render: (value: string) => value ? new Date(value).toLocaleString() : '-',
            },
            {
              title: '操作',
              key: 'actions',
              width: 120,
              render: (_: unknown, record: ArtifactRecord) => (
                <Space size="small">
                  <Tooltip title="详情">
                    <Button
                      aria-label={`查看 ${artifactLabel(record.artifactType)} #${record.id} 详情`}
                      size="small"
                      icon={<FileTextOutlined />}
                      onClick={() => openDetail(record)}
                    />
                  </Tooltip>
                  <Tooltip title="打开来源">
                    <Button
                      aria-label={`打开 ${artifactLabel(record.artifactType)} #${record.id} 来源`}
                      size="small"
                      icon={<LinkOutlined />}
                      onClick={() => openArtifactSource(record)}
                      disabled={!canOpenArtifactSource(record)}
                    />
                  </Tooltip>
                  <Tooltip title="预览">
                    <Button
                      aria-label={`预览 ${artifactLabel(record.artifactType)} #${record.id}`}
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => previewArtifact(record)}
                      disabled={!isTextPreviewable(record)}
                    />
                  </Tooltip>
                  <Tooltip title="下载">
                    <Button
                      aria-label={`下载 ${artifactLabel(record.artifactType)} #${record.id}`}
                      size="small"
                      icon={<DownloadOutlined />}
                      onClick={() => downloadArtifact(record)}
                    />
                  </Tooltip>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Drawer
        className="sl-artifact-drawer"
        title={selected ? `${artifactLabel(selected.artifactType)} #${selected.id}` : '运行产物'}
        open={Boolean(selected)}
        width={preview ? 'min(1040px, 92vw)' : 720}
        onClose={() => {
          setSelected(null)
          setPreview(null)
        }}
        extra={selected && (
          <Space>
            <Button
              aria-label={`打开 ${artifactLabel(selected.artifactType)} #${selected.id} 来源`}
              icon={<LinkOutlined />}
              disabled={!canOpenArtifactSource(selected)}
              onClick={() => openArtifactSource(selected)}
            >
              来源
            </Button>
            <Button
              aria-label={`预览 ${artifactLabel(selected.artifactType)} #${selected.id}`}
              icon={<EyeOutlined />}
              loading={previewLoading}
              disabled={!isTextPreviewable(selected)}
              onClick={() => previewArtifact(selected)}
            >
              预览
            </Button>
            <Button
              aria-label={`下载 ${artifactLabel(selected.artifactType)} #${selected.id}`}
              icon={<DownloadOutlined />}
              onClick={() => downloadArtifact(selected)}
            >
              下载
            </Button>
          </Space>
        )}
      >
        {selected && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="类型">
                <Space wrap>
                  <Tag color={ARTIFACT_COLORS[selected.artifactType] || 'blue'}>{artifactLabel(selected.artifactType)}</Tag>
                  <Text code>{selected.artifactType}</Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Owner">{selected.ownerType} #{selected.ownerId}</Descriptions.Item>
              <Descriptions.Item label="来源闭环">
                {canOpenArtifactSource(selected) ? <Tag color="green">可跳转</Tag> : <Tag>未接入</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="证据新鲜度">
                {isStaleArtifact(selected) ? <Tag color="orange">超过 {EVIDENCE_STALE_DAYS} 天</Tag> : <Tag color="green">新鲜</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="仓库">{selected.repositoryId ? `#${selected.repositoryId}` : '-'}</Descriptions.Item>
              <Descriptions.Item label="大小">{formatBytes(selected.sizeBytes)}</Descriptions.Item>
              <Descriptions.Item label="内容类型">{selected.contentType || '-'}</Descriptions.Item>
              <Descriptions.Item label="SHA-256">
                <Text code copyable>{selected.checksumSha256 || '-'}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {selected.createdAt ? new Date(selected.createdAt).toLocaleString() : '-'}
              </Descriptions.Item>
            </Descriptions>

            {preview?.truncated && (
              <Alert type="warning" showIcon message={`仅展示前 ${formatBytes(preview.previewBytes)}，完整内容请下载查看`} />
            )}

            {previewError && (
              <Alert
                type="error"
                showIcon
                message="智能预览加载失败"
                description={previewError}
                action={<Button size="small" danger onClick={() => loadPreview(selected)}>重试预览</Button>}
              />
            )}

            {!preview && !previewError && !previewLoading && isTextPreviewable(selected) && (
              <Alert type="info" showIcon message="可预览文本产物" action={<Button size="small" onClick={() => loadPreview(selected)}>加载预览</Button>} />
            )}

            {!isTextPreviewable(selected) && (
              <Alert type="warning" showIcon message="当前产物类型不支持文本预览，请下载查看" />
            )}

            {preview && (
              <ArtifactPreviewRenderer record={selected} preview={preview} />
            )}
          </Space>
        )}
      </Drawer>
    </div>
  )
}

function ArtifactStat({
  icon,
  label,
  value,
  footnote,
}: {
  icon: ReactNode
  label: string
  value: number | string
  footnote: string
}) {
  return (
    <div className="sl-artifact-stat">
      <div className="sl-artifact-stat-head">
        <span>{label}</span>
        {icon}
      </div>
      <div className="sl-artifact-stat-value">{value}</div>
      <div className="sl-artifact-stat-footnote">{footnote}</div>
    </div>
  )
}

function ArtifactEvidenceReadiness({ signal }: { signal: ArtifactEvidenceSignal }) {
  const ActionIcon = signal.tone === 'ready' ? CheckCircleOutlined : WarningOutlined
  return (
    <section className={`sl-artifact-readiness sl-artifact-readiness-${signal.tone}`}>
      <div className="sl-artifact-readiness-main">
        <div>
          <div className="sl-kicker">Evidence Readiness</div>
          <h2>{signal.summary}</h2>
          <div className="sl-artifact-readiness-tags">
            <Tag color={artifactToneColor(signal.tone)}>{signal.label}</Tag>
            <Tag>完整度 {signal.confidence}%</Tag>
          </div>
        </div>
        <div className="sl-artifact-readiness-score">
          <span>证据链完整度</span>
          <strong>{signal.confidence}%</strong>
        </div>
      </div>
      <div className="sl-artifact-readiness-grid">
        {signal.metrics.map(metric => (
          <div className={`sl-artifact-readiness-metric sl-artifact-readiness-metric-${metric.tone}`} key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </div>
      <div className="sl-artifact-readiness-actions">
        {signal.nextActions.map(action => (
          <div key={action}>
            <ActionIcon />
            <span>{action}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function buildArtifactEvidenceSignal(records: ArtifactRecord[], hasSourceError = false): ArtifactEvidenceSignal {
  if (hasSourceError && records.length === 0) {
    return {
      label: '数据源异常',
      tone: 'danger',
      confidence: 0,
      summary: '产物数据源不可用',
      nextActions: [
        '先重试加载产物列表，并使用请求 ID 定位后端日志。',
        '确认后端、数据库和 artifact store 都处于可用状态。',
      ],
      metrics: [
        { label: '数据源', value: '异常', tone: 'danger' },
        { label: '核心产物', value: `0/${CORE_EVIDENCE_TYPES.length}`, tone: 'idle' },
        { label: '可预览', value: '0%', tone: 'idle' },
        { label: '校验和', value: '0%', tone: 'idle' },
      ],
    }
  }
  if (records.length === 0) {
    return {
      label: '等待产物',
      tone: 'idle',
      confidence: 0,
      summary: '当前范围还没有产物证据',
      nextActions: ['先完成一次扫描、自动修复或 Agent 任务，再进入产物复盘。'],
      metrics: [
        { label: '核心产物', value: `0/${CORE_EVIDENCE_TYPES.length}`, tone: 'idle' },
        { label: '可预览', value: '0%', tone: 'idle' },
        { label: '校验和', value: '0%', tone: 'idle' },
        { label: '空文件', value: '0', tone: 'idle' },
      ],
    }
  }

  const corePresent = CORE_EVIDENCE_TYPES.filter(type => records.some(record => record.artifactType === type))
  const missingCore = CORE_EVIDENCE_TYPES.filter(type => !records.some(record => record.artifactType === type))
  const previewableCount = records.filter(isTextPreviewable).length
  const checksumCount = records.filter(record => Boolean(record.checksumSha256)).length
  const emptyCount = records.filter(record => record.sizeBytes <= 0).length
  const staleCount = records.filter(isStaleArtifact).length
  const sourceLinkedCount = records.filter(canOpenArtifactSource).length
  const ownerCount = new Set(records.map(record => `${record.ownerType}:${record.ownerId}`)).size
  const previewRate = Math.round((previewableCount / records.length) * 100)
  const checksumRate = Math.round((checksumCount / records.length) * 100)
  const sourceLinkRate = Math.round((sourceLinkedCount / records.length) * 100)
  const coreRate = Math.round((corePresent.length / CORE_EVIDENCE_TYPES.length) * 100)
  let confidence = 28
  confidence += Math.round(coreRate * 0.34)
  confidence += Math.round(previewRate * 0.14)
  confidence += Math.round(checksumRate * 0.18)
  confidence += Math.round(sourceLinkRate * 0.1)
  confidence += ownerCount > 0 ? 6 : 0
  confidence -= emptyCount * 10
  confidence -= staleCount * 3
  confidence = Math.max(4, Math.min(96, confidence))

  const tone: ArtifactSignalTone = emptyCount > 0 || confidence < 45
    ? 'danger'
    : missingCore.length > 0 || staleCount > 0 || confidence < 76
      ? 'warning'
      : 'ready'
  const label = tone === 'ready' ? '证据完整' : tone === 'warning' ? '需补齐' : '证据薄弱'
  const summary = tone === 'ready'
    ? '核心产物链完整，可进入复盘'
    : tone === 'warning'
      ? '产物可用，但证据链仍有缺口'
      : '产物证据不足，需要优先排查'
  const nextActions: string[] = []

  if (missingCore.length > 0) {
    nextActions.push(`补齐核心产物：${missingCore.map(artifactLabel).join('、')}。`)
  }
  if (checksumRate < 100) {
    nextActions.push('补齐 SHA-256 校验和，确保报告、日志和原始结果可追溯。')
  }
  if (emptyCount > 0) {
    nextActions.push(`发现 ${emptyCount} 个空产物，建议重新生成或清理异常记录。`)
  }
  if (sourceLinkRate < 100) {
    nextActions.push('补齐产物 owner 到来源任务的跳转映射，保证报告可追溯。')
  }
  if (staleCount > 0) {
    nextActions.push(`${staleCount} 个产物已超过 ${EVIDENCE_STALE_DAYS} 天，建议复扫以更新报告证据。`)
  }
  if (nextActions.length === 0) {
    nextActions.push('可以直接进入智能预览、扫描报告复盘和 code_chunks 问答。')
  }

  const signal: ArtifactEvidenceSignal = {
    label,
    tone,
    confidence,
    summary,
    nextActions,
    metrics: [
      { label: '核心产物', value: `${corePresent.length}/${CORE_EVIDENCE_TYPES.length}`, tone: corePresent.length === CORE_EVIDENCE_TYPES.length ? 'ready' : corePresent.length > 0 ? 'warning' : 'danger' },
      { label: '可预览', value: `${previewRate}%`, tone: previewRate >= 70 ? 'ready' : previewRate > 0 ? 'warning' : 'idle' },
      { label: '校验和', value: `${checksumRate}%`, tone: checksumRate >= 100 ? 'ready' : checksumRate > 0 ? 'warning' : 'danger' },
      { label: '来源闭环', value: `${sourceLinkRate}%`, tone: sourceLinkRate >= 100 ? 'ready' : sourceLinkRate > 0 ? 'warning' : 'danger' },
      { label: '空文件', value: String(emptyCount), tone: emptyCount > 0 ? 'danger' : 'ready' },
      { label: '过期产物', value: String(staleCount), tone: staleCount > 0 ? 'warning' : 'ready' },
      { label: 'Owner 范围', value: String(ownerCount), tone: ownerCount > 0 ? 'ready' : 'idle' },
      { label: '产物总数', value: String(records.length), tone: records.length > 0 ? 'ready' : 'idle' },
    ],
  }
  if (!hasSourceError) {
    return signal
  }
  return {
    ...signal,
    label: '数据源异常',
    tone: 'danger',
    confidence: Math.min(signal.confidence, 42),
    summary: '产物刷新失败，当前为上次成功数据',
    nextActions: [
      '先重试刷新产物列表，并使用请求 ID 定位后端日志。',
      ...signal.nextActions.slice(0, 2),
    ],
    metrics: [
      { label: '数据源', value: '异常', tone: 'danger' },
      ...signal.metrics.slice(0, 7),
    ],
  }
}

function artifactToneColor(tone: ArtifactSignalTone) {
  if (tone === 'ready') return 'green'
  if (tone === 'warning') return 'gold'
  if (tone === 'danger') return 'red'
  return 'default'
}

function formatBytes(value: number) {
  if (!value) return '0 B'
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / 1024 / 1024).toFixed(1)} MB`
}

function artifactLabel(type: string) {
  return ARTIFACT_LABELS[type] || type
}

function ownerKey(record: ArtifactRecord) {
  return `${record.ownerType}:${record.ownerId}`
}

function ownerDisplay(record: ArtifactRecord) {
  return `${record.ownerType} #${record.ownerId}`
}

function canOpenArtifactSource(record: ArtifactRecord) {
  return Boolean(artifactSourcePath(0, record))
}

function artifactSourcePath(projectId: number, record: ArtifactRecord) {
  if (record.ownerType === 'SCAN_TASK') return `/scan-tasks/${record.ownerId}`
  if (record.ownerType === 'AUTO_REPAIR') return `/auto-repairs?projectId=${projectId}&repairId=${record.ownerId}`
  if (record.ownerType === 'AGENT_TASK') return '/agent-tasks'
  if (record.ownerType === 'CI_DIAGNOSTIC') return `/ci-diagnostics?projectId=${projectId}&diagnosticId=${record.ownerId}`
  if (record.ownerType === 'PR_REVIEW') return `/pr-reviews?projectId=${projectId}&reviewId=${record.ownerId}`
  if (record.ownerType === 'ISSUE_DECOMPOSITION') return `/issue-decomposition?projectId=${projectId}&decompositionId=${record.ownerId}`
  return ''
}

function isStaleArtifact(record: ArtifactRecord) {
  if (!record.createdAt) return false
  return Date.now() - new Date(record.createdAt).getTime() > EVIDENCE_STALE_DAYS * 24 * 60 * 60 * 1000
}

function isTextPreviewable(record: ArtifactRecord) {
  const contentType = (record.contentType || '').toLowerCase()
  return contentType.startsWith('text/')
    || contentType.includes('json')
    || contentType.includes('xml')
    || contentType.includes('yaml')
    || contentType.includes('javascript')
    || contentType.includes('typescript')
}

function parseDownloadFileName(contentDisposition: string | undefined) {
  if (!contentDisposition) return ''
  const match = contentDisposition.match(/filename="?([^"]+)"?/i)
  return match?.[1] || ''
}

function normalizeFilters(filters: Props['initialFilters']) {
  if (!filters) return undefined
  return {
    repositoryId: filters.repositoryId || undefined,
    ownerType: filters.ownerType || undefined,
    ownerId: filters.ownerId || undefined,
  }
}
