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

  return (
    <div style={{
      margin: '6px 0',
      border: '1px solid #e8e8e8',
      borderRadius: 8,
      overflow: 'hidden',
      fontSize: 13,
    }}>
      {/* 标题行 */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: '6px 10px',
          background: '#fafafa',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          userSelect: 'none',
        }}
      >
        <span style={{ color: '#999', fontSize: 10 }}>
          {expanded ? <DownOutlined /> : <RightOutlined />}
        </span>
        <CodeOutlined style={{ color: '#1677ff' }} />
        <Text strong style={{ fontSize: 12 }}>{label}</Text>
        <Text type="secondary" style={{ fontSize: 11, flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          {summary}
        </Text>
        {success !== undefined && (
          success
            ? <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 12 }} />
            : <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 12 }} />
        )}
      </div>

      {/* 展开内容 */}
      {expanded && (
        <div style={{ padding: '8px 10px', borderTop: '1px solid #f0f0f0' }}>
          <div style={{ marginBottom: 6 }}>
            <Text type="secondary" style={{ fontSize: 11 }}>参数</Text>
            <pre style={{
              margin: '4px 0 0',
              padding: 8,
              background: '#f6f6f6',
              borderRadius: 4,
              fontSize: 12,
              lineHeight: 1.5,
              overflow: 'auto',
              maxHeight: 200,
            }}>
              {JSON.stringify(args, null, 2)}
            </pre>
          </div>
          {result !== null && (
            <div>
              <Text type="secondary" style={{ fontSize: 11 }}>
                结果 {success === false && <Tag color="error" style={{ marginLeft: 4, fontSize: 10 }}>失败</Tag>}
              </Text>
              <pre style={{
                margin: '4px 0 0',
                padding: 8,
                background: success === false ? '#fff2f0' : '#f6f6f6',
                borderRadius: 4,
                fontSize: 12,
                lineHeight: 1.5,
                overflow: 'auto',
                maxHeight: 300,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}>
                {result.length > 3000 ? result.slice(0, 3000) + '\n...(截断)' : result}
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