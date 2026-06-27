import { Empty } from 'antd'

interface Props {
  value?: string | null
  maxHeight?: number
  tone?: 'terminal' | 'plain'
}

export default function LogViewer({ value, maxHeight = 300, tone = 'terminal' }: Props) {
  if (!value || value.trim() === '') {
    return <Empty description="暂无日志" />
  }
  const isTerminal = tone === 'terminal'
  return (
    <pre style={{
      background: isTerminal ? '#1e1e1e' : '#f5f5f5',
      color: isTerminal ? '#00ff00' : '#262626',
      padding: 12,
      borderRadius: 6,
      maxHeight,
      overflowY: 'auto',
      whiteSpace: 'pre-wrap',
      fontFamily: 'Consolas, Monaco, monospace',
      fontSize: 12,
      lineHeight: 1.6,
      margin: 0,
    }}>
      {value}
    </pre>
  )
}
