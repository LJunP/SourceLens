import { useId, useState } from 'react'
import { Tag, Typography } from 'antd'
import { CodeOutlined, CheckCircleOutlined, CloseCircleOutlined, DownOutlined, RightOutlined } from '@ant-design/icons'
import { redactAndTruncateText, redactSensitiveText, stringifyRedactedPayload } from '../utils/displayRedaction'

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
  const generatedId = useId()

  const label = TOOL_LABELS[name] || name
  const summary = buildSummary(name, args)
  const statusClass = success === false ? 'failed' : success === true ? 'success' : 'pending'
  const statusText = success === false ? '执行失败' : success === true ? '执行成功' : '等待结果'
  const buttonId = `${generatedId}-button`
  const bodyId = `${generatedId}-body`
  const statusId = `${generatedId}-status`
  const redactedArgsPreview = stringifyRedactedPayload(args)
  const redactedResultPreview = buildRedactedPayloadPreview(result)
  const resultSummary = buildResultSummary(result, success)

  return (
    <div className={`sl-agent-tool-call sl-agent-tool-call-${statusClass}`}>
      <button
        id={buttonId}
        type="button"
        className="sl-agent-tool-call-head"
        aria-expanded={expanded}
        aria-controls={bodyId}
        aria-describedby={statusId}
        aria-label={`${label}：${summary || '无摘要'}，${statusText}`}
        onClick={() => setExpanded(!expanded)}
      >
        <span className="sl-agent-tool-call-toggle" aria-hidden="true">
          {expanded ? <DownOutlined /> : <RightOutlined />}
        </span>
        <CodeOutlined className="sl-agent-tool-call-icon" aria-hidden="true" />
        <Text strong className="sl-agent-tool-call-label">{label}</Text>
        <Text type="secondary" className="sl-agent-tool-call-summary">
          {summary}
        </Text>
        <span id={statusId} className="sl-agent-tool-call-status">
          {success === undefined ? (
            <Tag>等待结果</Tag>
          ) : success ? (
            <>
              <CheckCircleOutlined className="sl-agent-tool-call-success-icon" aria-hidden="true" />
              <span>执行成功</span>
            </>
          ) : (
            <>
              <CloseCircleOutlined className="sl-agent-tool-call-failed-icon" aria-hidden="true" />
              <span>执行失败</span>
            </>
          )}
        </span>
      </button>

      {expanded && (
        <div id={bodyId} className="sl-agent-tool-call-body" role="region" aria-labelledby={buttonId}>
          <div className="sl-agent-tool-call-readable-summary">
            {resultSummary}
          </div>
          <div className="sl-agent-tool-call-block">
            <Text type="secondary">参数</Text>
            <pre>
              {redactedArgsPreview}
            </pre>
          </div>
          {result !== null && (
            <div className="sl-agent-tool-call-block">
              <Text type="secondary">
                结果 {success === false && <Tag color="error">失败</Tag>}
              </Text>
              <pre className={success === false ? 'sl-agent-tool-call-result-error' : undefined}>
                {redactedResultPreview}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function buildResultSummary(result: string | null, success?: boolean): string {
  if (result === null) {
    return '工具调用仍在等待返回结果。'
  }
  if (success === false) {
    return '工具调用失败，请优先复核错误内容和下一步追问。'
  }
  const lineCount = result.split(/\r?\n/).filter(line => line.trim().length > 0).length
  return `工具调用已返回 ${lineCount} 行内容，可展开核对原始证据。`
}

function buildSummary(name: string, args: Record<string, unknown>): string {
  switch (name) {
    case 'read_file':
      return redactSensitiveText(String(args.path || ''))
    case 'search_code':
      return redactSensitiveText(String(args.pattern || ''))
    case 'write_file':
      return redactSensitiveText(String(args.path || ''))
    case 'shell_exec':
      return redactSensitiveText(String(args.command || '')).slice(0, 80)
    case 'list_dir':
      return redactSensitiveText(String(args.path || '.'))
    case 'get_symbols':
      return args.symbol ? redactSensitiveText(String(args.symbol)) : 'all'
    default:
      return redactSensitiveText(stringifyRedactedPayload(args)).slice(0, 60)
  }
}

function buildRedactedPayloadPreview(value: string | null): string | null {
  return redactAndTruncateText(value, 3000)
}
