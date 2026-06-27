import { Badge, Empty, Space, Spin, Tag, Timeline, Typography } from 'antd'
import type { ReactNode } from 'react'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  StopOutlined,
  SyncOutlined,
} from '@ant-design/icons'

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
    return <Spin style={{ display: 'block', margin: '40px auto' }} />
  }
  if (!items.length) {
    return <Empty description={emptyText} />
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
                <pre className="sl-task-timeline-output">
                  {formatJson(item.output)}
                </pre>
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

function formatJson(value: string) {
  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    return value
  }
}
