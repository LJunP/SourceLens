import { useState } from 'react'
import { Tag, Typography } from 'antd'
import { CodeOutlined, CheckCircleOutlined, CloseCircleOutlined, DownOutlined, RightOutlined } from '@ant-design/icons'

const { Text } = Typography

interface Props {
  name: string
  arguments: Record<string, unknown>
  result: string | null
  success?: boolean
}

const TOOL_LABELS: Record<string, string> = {
  read_file: '读取文件',
  search_code: '搜索代码',
  write_file: '写入文件',
  shell_exec: '执行命令',
  list_dir: '列出目录',
  get_symbols: '获取符号',
}

export default function AgentToolCall({ name, arguments: args, result, success }: Props) {
  const [expanded, setExpanded] = useState(false)

  const label = TOOL_LABELS[name] || name
  const summary = buildSummary(name, args)
  const statusClass = success === false ? 'failed' : success === true ? 'success' : 'pending'
  const resultPreview = result && result.length > 3000 ? result.slice(0, 3000) + '\n...(截断)' : result

  return (
    <div className={`sl-agent-tool-call sl-agent-tool-call-${statusClass}`}>
      <button
        type="button"
        className="sl-agent-tool-call-head"
        aria-expanded={expanded}
        onClick={() => setExpanded(!expanded)}
      >
        <span className="sl-agent-tool-call-toggle">
          {expanded ? <DownOutlined /> : <RightOutlined />}
        </span>
        <CodeOutlined className="sl-agent-tool-call-icon" />
        <Text strong className="sl-agent-tool-call-label">{label}</Text>
        <Text type="secondary" className="sl-agent-tool-call-summary">
          {summary}
        </Text>
        {success === undefined ? (
          <Tag>等待结果</Tag>
        ) : success ? (
          <CheckCircleOutlined className="sl-agent-tool-call-success-icon" />
        ) : (
          <CloseCircleOutlined className="sl-agent-tool-call-failed-icon" />
        )}
      </button>

      {expanded && (
        <div className="sl-agent-tool-call-body">
          <div className="sl-agent-tool-call-block">
            <Text type="secondary">参数</Text>
            <pre>
              {JSON.stringify(args, null, 2)}
            </pre>
          </div>
          {result !== null && (
            <div className="sl-agent-tool-call-block">
              <Text type="secondary">
                结果 {success === false && <Tag color="error">失败</Tag>}
              </Text>
              <pre className={success === false ? 'sl-agent-tool-call-result-error' : undefined}>
                {resultPreview}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function buildSummary(name: string, args: Record<string, unknown>): string {
  switch (name) {
    case 'read_file':
      return String(args.path || '')
    case 'search_code':
      return String(args.pattern || '')
    case 'write_file':
      return String(args.path || '')
    case 'shell_exec':
      return String(args.command || '').slice(0, 80)
    case 'list_dir':
      return String(args.path || '.')
    case 'get_symbols':
      return args.symbol ? String(args.symbol) : 'all'
    default:
      return JSON.stringify(args).slice(0, 60)
  }
}
