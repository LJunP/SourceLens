import { Alert, Descriptions, Empty, List, Space, Table, Tabs, Tag, Typography } from 'antd'
import {
  ApiOutlined,
  BranchesOutlined,
  CheckCircleOutlined,
  CodeOutlined,
  DatabaseOutlined,
  FileSearchOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import type { ArtifactPreviewResponse, ArtifactRecord } from '../api/artifact'
import type { ReactNode } from 'react'

const { Text } = Typography

type JsonRecord = Record<string, any>

interface Props {
  record: ArtifactRecord
  preview: ArtifactPreviewResponse
}

export default function ArtifactPreviewRenderer({ record, preview }: Props) {
  const parsed = parseJson(preview.text)

  if (!parsed.ok) {
    return (
      <pre className="sl-code-block sl-artifact-preview">
        {formatPreview(preview.text, record.contentType)}
      </pre>
    )
  }

  if (!isRecord(parsed.data)) {
    return (
      <pre className="sl-code-block sl-artifact-preview">
        {JSON.stringify(parsed.data, null, 2)}
      </pre>
    )
  }

  return (
    <div className="sl-artifact-smart-preview">
      {renderByType(record.artifactType, parsed.data)}
      <details className="sl-artifact-raw-json">
        <summary>原始 JSON</summary>
        <pre className="sl-code-block sl-artifact-preview">
          {JSON.stringify(parsed.data, null, 2)}
        </pre>
      </details>
    </div>
  )
}

function renderByType(type: string, data: JsonRecord) {
  switch (type) {
    case 'ARCHITECTURE_REPORT':
      return <ArchitectureReportPreview data={data} />
    case 'API_CATALOG':
      return <ApiCatalogPreview data={data} />
    case 'CODE_METRICS':
      return <CodeMetricsPreview data={data} />
    case 'DB_SCHEMA':
      return <DbSchemaPreview data={data} />
    case 'ARCHITECTURE_OVERVIEW':
      return <ArchitectureOverviewPreview data={data} />
    case 'DEPENDENCY_GRAPH':
      return <DependencyGraphSummary data={data} />
    default:
      return <GenericObjectPreview data={data} />
  }
}

function ArchitectureReportPreview({ data }: { data: JsonRecord }) {
  const overview = asRecord(data.overview)
  const techStack = asRecord(data.techStack)
  const modules = asRecord(data.modules)
  const codeQuality = asRecord(data.codeQuality)
  const risks = asRecordArray(codeQuality.risks)
  const debts = asRecordArray(data.technicalDebt)
  const suggestions = asStringArray(data.suggestions)
  const apiRoutes = asRecordArray(data.apiRoutes)
  const apiRouteIssues = invalidArrayItemCount(data.apiRoutes)
  const dbEntities = asRecordArray(data.dbEntities)
  const fingerprint = asRecord(data.scanFingerprint)

  return (
    <Tabs
      className="sl-artifact-preview-tabs"
      defaultActiveKey="summary"
      items={[
        {
          key: 'summary',
          label: '总览',
          children: (
            <Space direction="vertical" size={14} style={{ width: '100%' }}>
              <div className="sl-artifact-preview-grid">
                <PreviewTile icon={<FileSearchOutlined />} label="文件" value={formatNumber(overview.totalFiles)} />
                <PreviewTile icon={<CodeOutlined />} label="代码行" value={formatNumber(overview.totalLines)} />
                <PreviewTile icon={<ApiOutlined />} label="API" value={formatNumber(modules.apiRoutes)} />
                <PreviewTile icon={<WarningOutlined />} label="风险" value={formatNumber(risks.length)} tone={risks.length ? 'danger' : 'success'} />
              </div>
              <Descriptions column={2} size="small" bordered>
                <Descriptions.Item label="框架">{textValue(techStack.name, 'Unknown')}</Descriptions.Item>
                <Descriptions.Item label="版本">{textValue(techStack.version, 'Unknown')}</Descriptions.Item>
                <Descriptions.Item label="目录">{formatNumber(overview.totalDirs)}</Descriptions.Item>
                <Descriptions.Item label="测试文件">{formatNumber(overview.testFiles)}</Descriptions.Item>
                <Descriptions.Item label="Controller">{formatNumber(modules.controllers)}</Descriptions.Item>
                <Descriptions.Item label="Service">{formatNumber(modules.services)}</Descriptions.Item>
                {fingerprint.repoContentHash && (
                  <Descriptions.Item label="内容哈希" span={2}>
                    <Text code copyable>{fingerprint.repoContentHash}</Text>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Space>
          ),
        },
        {
          key: 'risk',
          label: `风险 (${risks.length})`,
          children: <RiskAndSuggestionList risks={risks} debts={debts} suggestions={suggestions} />,
        },
        {
          key: 'api',
          label: `API (${apiRoutes.length})`,
          children: (
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              {apiRouteIssues > 0 && <LegacyDataAlert count={apiRouteIssues} label="API 路由" />}
              <ApiRouteTable routes={apiRoutes} />
            </Space>
          ),
        },
        {
          key: 'db',
          label: `数据库 (${dbEntities.length})`,
          children: <DbEntityTable entities={dbEntities} invalidCount={invalidArrayItemCount(data.dbEntities)} />,
        },
      ]}
    />
  )
}

function ApiCatalogPreview({ data }: { data: JsonRecord }) {
  const routes = asRecordArray(data.routes)
  const controllers = asRecordArray(data.controllers)
  const invalidRoutes = invalidArrayItemCount(data.routes)
  const invalidControllers = invalidArrayItemCount(data.controllers)

  return (
    <Space direction="vertical" size={14} style={{ width: '100%' }}>
      <div className="sl-artifact-preview-grid">
        <PreviewTile icon={<ApiOutlined />} label="接口总数" value={formatNumber(data.totalEndpoints ?? routes.length)} />
        <PreviewTile icon={<BranchesOutlined />} label="可读接口" value={formatNumber(routes.length)} tone={invalidRoutes ? 'warning' : 'success'} />
        <PreviewTile icon={<CodeOutlined />} label="Controller" value={formatNumber(data.totalControllers ?? controllers.length)} />
      </div>
      {invalidRoutes > 0 && <LegacyDataAlert count={invalidRoutes} label="API 路由" />}
      {invalidControllers > 0 && <LegacyDataAlert count={invalidControllers} label="Controller" />}
      <ApiRouteTable routes={routes} />
    </Space>
  )
}

function CodeMetricsPreview({ data }: { data: JsonRecord }) {
  const languageStats: JsonRecord[] = Object.entries(asRecord(data.languageStats))
    .map(([language, stat]) => ({ language, ...asRecord(stat) }) as JsonRecord)
    .sort((a, b) => Number(b['line_count'] || 0) - Number(a['line_count'] || 0))
  const fingerprint = asRecord(data.scanFingerprint)

  return (
    <Space direction="vertical" size={14} style={{ width: '100%' }}>
      <div className="sl-artifact-preview-grid">
        <PreviewTile icon={<FileSearchOutlined />} label="文件" value={formatNumber(data.totalFiles)} />
        <PreviewTile icon={<CodeOutlined />} label="代码行" value={formatNumber(data.totalLines)} />
        <PreviewTile icon={<DatabaseOutlined />} label="目录" value={formatNumber(data.totalDirs)} />
        <PreviewTile icon={<WarningOutlined />} label="大文件" value={formatNumber(data.largeFiles)} tone={Number(data.largeFiles || 0) > 0 ? 'warning' : 'success'} />
      </div>
      <Table
        rowKey="language"
        size="small"
        dataSource={languageStats}
        pagination={languageStats.length > 8 ? { pageSize: 8 } : false}
        scroll={{ x: 520 }}
        columns={[
          { title: '语言', dataIndex: 'language', key: 'language', render: value => <Tag>{value}</Tag> },
          { title: '文件数', dataIndex: 'file_count', key: 'file_count', width: 100, render: formatNumber },
          { title: '行数', dataIndex: 'line_count', key: 'line_count', width: 120, render: formatNumber },
        ]}
      />
      {Object.keys(fingerprint).length > 0 && (
        <Descriptions column={2} size="small" bordered>
          <Descriptions.Item label="Manifest 文件">{formatNumber(fingerprint.manifestFiles)}</Descriptions.Item>
          <Descriptions.Item label="已哈希文件">{formatNumber(fingerprint.hashedFiles)}</Descriptions.Item>
          <Descriptions.Item label="二进制文件">{formatNumber(fingerprint.binaryFiles)}</Descriptions.Item>
          <Descriptions.Item label="大文件">{formatNumber(fingerprint.largeFiles)}</Descriptions.Item>
        </Descriptions>
      )}
    </Space>
  )
}

function DbSchemaPreview({ data }: { data: JsonRecord }) {
  const entities = asRecordArray(data.entities)
  const dbEntities = asRecordArray(data.dbEntities)
  const invalidEntities = invalidArrayItemCount(data.entities) + invalidArrayItemCount(data.dbEntities)

  return (
    <Space direction="vertical" size={14} style={{ width: '100%' }}>
      <div className="sl-artifact-preview-grid">
        <PreviewTile icon={<DatabaseOutlined />} label="实体总数" value={formatNumber(data.totalEntities ?? entities.length)} />
        <PreviewTile icon={<CheckCircleOutlined />} label="可读实体" value={formatNumber(entities.length + dbEntities.length)} tone={invalidEntities ? 'warning' : 'success'} />
      </div>
      {invalidEntities > 0 && <LegacyDataAlert count={invalidEntities} label="数据库实体" />}
      <DbEntityTable entities={dbEntities.length ? dbEntities : entities} invalidCount={0} />
    </Space>
  )
}

function ArchitectureOverviewPreview({ data }: { data: JsonRecord }) {
  const framework = asRecord(data.framework)
  const languages: JsonRecord[] = Object.entries(asRecord(data.languages))
    .map(([language, stat]) => ({ language, ...asRecord(stat) }) as JsonRecord)
    .sort((a, b) => Number(b['line_count'] || 0) - Number(a['line_count'] || 0))

  return (
    <Space direction="vertical" size={14} style={{ width: '100%' }}>
      <Descriptions column={2} size="small" bordered>
        <Descriptions.Item label="框架">{textValue(framework.name, 'Unknown')}</Descriptions.Item>
        <Descriptions.Item label="版本">{textValue(framework.version, 'Unknown')}</Descriptions.Item>
        <Descriptions.Item label="文件">{formatNumber(data.totalFiles)}</Descriptions.Item>
        <Descriptions.Item label="代码行">{formatNumber(data.totalLines)}</Descriptions.Item>
        <Descriptions.Item label="Controller">{formatNumber(data.controllers)}</Descriptions.Item>
        <Descriptions.Item label="Service">{formatNumber(data.services)}</Descriptions.Item>
      </Descriptions>
      <Table
        rowKey="language"
        size="small"
        dataSource={languages}
        pagination={languages.length > 8 ? { pageSize: 8 } : false}
        scroll={{ x: 520 }}
        columns={[
          { title: '语言', dataIndex: 'language', key: 'language', render: value => <Tag>{value}</Tag> },
          { title: '文件数', dataIndex: 'file_count', key: 'file_count', width: 100, render: formatNumber },
          { title: '行数', dataIndex: 'line_count', key: 'line_count', width: 120, render: formatNumber },
        ]}
      />
    </Space>
  )
}

function DependencyGraphSummary({ data }: { data: JsonRecord }) {
  return (
    <Descriptions column={1} size="small" bordered>
      <Descriptions.Item label="标题">{textValue(data.title, '依赖分析')}</Descriptions.Item>
      <Descriptions.Item label="框架">{textValue(data.framework, 'Unknown')}</Descriptions.Item>
      <Descriptions.Item label="摘要">{textValue(data.summary, '-')}</Descriptions.Item>
      <Descriptions.Item label="识别证据">{formatInlineList(data.evidence)}</Descriptions.Item>
    </Descriptions>
  )
}

function GenericObjectPreview({ data }: { data: JsonRecord }) {
  return (
    <Descriptions column={1} size="small" bordered>
      {Object.entries(data).slice(0, 12).map(([key, value]) => (
        <Descriptions.Item key={key} label={key}>
          {renderValue(value)}
        </Descriptions.Item>
      ))}
    </Descriptions>
  )
}

function ApiRouteTable({ routes }: { routes: JsonRecord[] }) {
  if (!routes.length) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无可读 API 路由" />
  }
  return (
    <Table
      rowKey={(record, index) => `${record.method || 'ANY'}-${record.path || index}-${record.line_number || index}`}
      size="small"
      dataSource={routes}
      pagination={routes.length > 12 ? { pageSize: 12 } : false}
      scroll={{ x: 760 }}
      columns={[
        { title: '方法', dataIndex: 'method', key: 'method', width: 90, render: value => <Tag>{value || 'ANY'}</Tag> },
        { title: '路径', dataIndex: 'path', key: 'path', ellipsis: true, render: value => <Text code>{value || '-'}</Text> },
        { title: '处理类', dataIndex: 'handler_class', key: 'handler_class', ellipsis: true, render: value => value || '-' },
        { title: '函数', dataIndex: 'handler_method', key: 'handler_method', width: 150, render: value => value || '-' },
        { title: '行号', dataIndex: 'line_number', key: 'line_number', width: 80, render: formatNumber },
      ]}
    />
  )
}

function DbEntityTable({ entities, invalidCount }: { entities: JsonRecord[]; invalidCount: number }) {
  if (!entities.length) {
    return (
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        {invalidCount > 0 && <LegacyDataAlert count={invalidCount} label="数据库实体" />}
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无可读数据库实体" />
      </Space>
    )
  }
  return (
    <Table
      rowKey={(record, index) => `${record.class_name || record.name || record.file_path || index}`}
      size="small"
      dataSource={entities}
      pagination={entities.length > 12 ? { pageSize: 12 } : false}
      scroll={{ x: 700 }}
      columns={[
        { title: '类名', dataIndex: 'class_name', key: 'class_name', render: (_, record) => record.class_name || record.name || '-' },
        { title: '表名', dataIndex: 'table_name', key: 'table_name', render: value => value || <Tag>未指定</Tag> },
        { title: '字段', dataIndex: 'field_count', key: 'field_count', width: 90, render: formatNumber },
        { title: '文件', dataIndex: 'file_path', key: 'file_path', ellipsis: true, render: value => value || '-' },
      ]}
    />
  )
}

function RiskAndSuggestionList({
  risks,
  debts,
  suggestions,
}: {
  risks: JsonRecord[]
  debts: JsonRecord[]
  suggestions: string[]
}) {
  return (
    <Space direction="vertical" size={14} style={{ width: '100%' }}>
      {risks.length > 0 ? (
        <List
          size="small"
          dataSource={risks}
          renderItem={risk => (
            <List.Item>
              <List.Item.Meta
                avatar={<WarningOutlined style={{ color: riskColor(risk.severity) }} />}
                title={<Space wrap><Tag color={riskTag(risk.severity)}>{risk.severity || 'INFO'}</Tag>{risk.category || '风险'}</Space>}
                description={risk.message || risk.detail || '-'}
              />
            </List.Item>
          )}
        />
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="未识别到显著风险" />
      )}
      {debts.length > 0 && (
        <List
          size="small"
          header={<Text strong>技术债</Text>}
          dataSource={debts}
          renderItem={debt => (
            <List.Item>
              <Space direction="vertical" size={2}>
                <Space wrap><Tag color={riskTag(debt.severity)}>{debt.severity || 'INFO'}</Tag>{debt.category || '技术债'}</Space>
                <Text type="secondary">{debt.detail || debt.message || '-'}</Text>
              </Space>
            </List.Item>
          )}
        />
      )}
      {suggestions.length > 0 && (
        <List
          size="small"
          header={<Text strong>改进建议</Text>}
          dataSource={suggestions}
          renderItem={item => (
            <List.Item>
              <Space align="start">
                <CheckCircleOutlined className="sl-artifact-preview-ok-icon" />
                <span>{item}</span>
              </Space>
            </List.Item>
          )}
        />
      )}
    </Space>
  )
}

function PreviewTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode
  label: string
  value: string | number
  tone?: 'success' | 'warning' | 'danger'
}) {
  return (
    <div className={`sl-artifact-preview-tile ${tone ? `sl-artifact-preview-tile-${tone}` : ''}`}>
      <div className="sl-artifact-preview-tile-head">
        <span>{label}</span>
        {icon}
      </div>
      <strong>{value}</strong>
    </div>
  )
}

function LegacyDataAlert({ count, label }: { count: number; label: string }) {
  return (
    <Alert
      type="warning"
      showIcon
      message={`${label}中有 ${count} 条历史异常数据未能结构化展示`}
      description="这通常来自旧扫描产物中的 null 项。重启后端并重新扫描可生成修复后的新产物。"
    />
  )
}

function parseJson(text: string): { ok: true; data: unknown } | { ok: false } {
  try {
    return { ok: true, data: JSON.parse(text) }
  } catch {
    return { ok: false }
  }
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function asRecord(value: unknown): JsonRecord {
  return isRecord(value) ? value : {}
}

function asRecordArray(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.filter(isRecord) : []
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter(item => typeof item === 'string') : []
}

function invalidArrayItemCount(value: unknown) {
  return Array.isArray(value) ? value.length - value.filter(isRecord).length : 0
}

function formatNumber(value: unknown) {
  if (value == null || value === '') return '-'
  if (typeof value === 'number') return Number.isFinite(value) ? value.toLocaleString() : '-'
  if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) {
    return Number(value).toLocaleString()
  }
  return String(value)
}

function textValue(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value : fallback
}

function formatInlineList(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) return '-'
  return (
    <Space wrap>
      {value.map(item => <Tag key={String(item)}>{String(item)}</Tag>)}
    </Space>
  )
}

function renderValue(value: unknown) {
  if (Array.isArray(value)) return `${value.length} 项`
  if (isRecord(value)) return `${Object.keys(value).length} 个字段`
  if (typeof value === 'boolean') return value ? '是' : '否'
  if (value == null) return '-'
  return String(value)
}

function formatPreview(text: string, contentType: string | null) {
  if ((contentType || '').toLowerCase().includes('json')) {
    try {
      return JSON.stringify(JSON.parse(text), null, 2)
    } catch {
      return text
    }
  }
  return text
}

function riskColor(severity?: string) {
  if (severity === 'HIGH') return '#dc2626'
  if (severity === 'MEDIUM') return '#d97706'
  return '#64748b'
}

function riskTag(severity?: string) {
  if (severity === 'HIGH') return 'red'
  if (severity === 'MEDIUM') return 'orange'
  return 'default'
}
