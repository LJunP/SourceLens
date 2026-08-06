import StateBlock from './ui/StateBlock'
import { redactSensitiveText } from '../utils/displayRedaction'

interface Props {
  value?: string | null
  maxHeight?: number
  tone?: 'terminal' | 'plain'
}

function redactSensitiveLog(value: string) {
  return redactSensitiveText(value)
}

export default function LogViewer({ value, maxHeight = 300, tone = 'terminal' }: Props) {
  if (!value || value.trim() === '') {
    return <StateBlock compact title="暂无日志" description="当前执行还没有写入可展示日志。" />
  }
  const isTerminal = tone === 'terminal'
  const redactedValue = redactSensitiveLog(value)
  return (
    <pre className="sl-log-viewer" aria-label="脱敏执行日志" style={{
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
      {redactedValue}
    </pre>
  )
}
