import { Badge, Space, Tag, Timeline, Typography } from 'antd'
import type { ReactNode } from 'react'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  StopOutlined,
  SyncOutlined,
} from '@ant-design/icons'
import StateBlock from './ui/StateBlock'

const { Text } = Typography

export interface TaskTimelineItem {
  key: string | number
  title: string
  status: string
  description?: string | null
  category?: string | null
  toolName?: string | null
  durationMs?: number | null
  output?: string | null
  errorMessage?: string | null
}

interface Props {
  items: TaskTimelineItem[]
  loading?: boolean
  emptyText?: string
}

const STATUS_META: Record<string, { color: string; icon: ReactNode }> = {
  PENDING: { color: 'gray', icon: <ClockCircleOutlined /> },
  QUEUED: { color: 'gray', icon: <ClockCircleOutlined /> },
  RUNNING: { color: 'blue', icon: <SyncOutlined spin /> },
  SUCCESS: { color: 'green', icon: <CheckCircleOutlined /> },
  COMPLETED: { color: 'green', icon: <CheckCircleOutlined /> },
  FAILED: { color: 'red', icon: <CloseCircleOutlined /> },
  CANCELLED: { color: 'gray', icon: <StopOutlined /> },
  SKIPPED: { color: 'orange', icon: <StopOutlined /> },
}

export default function TaskTimeline({ items, loading, emptyText = '暂无执行步骤' }: Props) {
  if (loading) {
    return <StateBlock compact tone="loading" title="正在加载执行步骤" description="步骤时间线加载完成后会展示每次执行的状态和证据。" />
  }
  if (!items.length) {
    return <StateBlock compact title={emptyText} description="当前任务还没有可复盘的执行步骤。" />
  }

  return (
    <Timeline
      className="sl-task-timeline"
      items={items.map(item => {
        const meta = STATUS_META[item.status] || { color: 'gray', icon: <ClockCircleOutlined /> }
        return {
          dot: meta.icon,
          color: meta.color,
          children: (
            <div className="sl-task-timeline-item">
              <Space size="small" wrap>
                <Text strong>{item.title}</Text>
                {item.category && <Tag>{item.category}</Tag>}
                {item.toolName && <Tag>{item.toolName}</Tag>}
                <Badge status={badgeStatus(meta.color)} text={item.status} />
                {item.durationMs != null && <Text type="secondary">{formatDuration(item.durationMs)}</Text>}
              </Space>
              {item.description && (
                <div className="sl-task-timeline-description">{item.description}</div>
              )}
              {item.output && (
                <div className="sl-task-timeline-output-notice" role="note" aria-label="步骤输出安全边界">
                  <SafetyCertificateOutlined />
                  <span>步骤输出已留存，默认隐藏；请通过授权审计或产物复核。</span>
                </div>
              )}
              {item.errorMessage && (
                <Text type="danger" className="sl-task-timeline-error">
                  {item.errorMessage}
                </Text>
              )}
            </div>
          ),
        }
      })}
    />
  )
}

function badgeStatus(color: string) {
  if (color === 'green') return 'success'
  if (color === 'red') return 'error'
  if (color === 'blue') return 'processing'
  if (color === 'orange') return 'warning'
  return 'default'
}

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}
