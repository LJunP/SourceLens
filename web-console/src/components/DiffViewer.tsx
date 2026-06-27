import { Empty } from 'antd'

interface Props {
  diff?: string | null
  maxHeight?: number
}

export default function DiffViewer({ diff, maxHeight = 500 }: Props) {
  if (!diff || diff.trim() === '') {
    return <Empty description="无代码修改差异" />
  }
  const lines = diff.split('\n')
  return (
    <pre style={{
      background: '#0d1117',
      color: '#c9d1d9',
      padding: '16px',
      borderRadius: 8,
      maxHeight,
      overflow: 'auto',
      fontFamily: 'Consolas, Monaco, "Andale Mono", monospace',
      fontSize: 13,
      lineHeight: 1.6,
      border: '1px solid #30363d',
      margin: 0
    }}>
      {lines.map((line, index) => {
        let backgroundColor = 'transparent'
        let color = '#c9d1d9'
        if (line.startsWith('+') && !line.startsWith('+++')) {
          backgroundColor = 'rgba(46, 160, 67, 0.15)'
          color = '#3fb950'
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          backgroundColor = 'rgba(248, 81, 73, 0.15)'
          color = '#f85149'
        } else if (line.startsWith('@@')) {
          backgroundColor = 'rgba(56, 139, 253, 0.15)'
          color = '#58a6ff'
        }
        return (
          <div key={index} style={{ backgroundColor, color, padding: '0 8px', minHeight: '1.6em', whiteSpace: 'pre-wrap' }}>
            {line}
          </div>
        )
      })}
    </pre>
  )
}
