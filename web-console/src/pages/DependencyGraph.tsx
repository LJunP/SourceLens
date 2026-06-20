import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, Spin, Empty, Select, Tag, Typography, Descriptions, Table, Space, Radio } from 'antd'
import { analysisApi, DependencyGraph, GraphNode, GraphEdge } from '../api/analysis'

const { Text } = Typography

// 节点颜色映射
const KIND_COLORS: Record<string, string> = {
  CLASS: '#1890ff',
  INTERFACE: '#52c41a',
  ENUM: '#faad14',
  METHOD: '#722ed1',
  FIELD: '#eb2f96',
  UNKNOWN: '#d9d9d9',
}

const RELATION_COLORS: Record<string, string> = {
  EXTENDS: '#ff4d4f',
  IMPLEMENTS: '#52c41a',
  CALLS: '#1890ff',
  DEPENDS_ON: '#faad14',
}

interface Props {
  scanTaskId: number
}

export default function DependencyGraphView({ scanTaskId }: Props) {
  const [graph, setGraph] = useState<DependencyGraph | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [kindFilter, setKindFilter] = useState<string>('ALL')
  const [relFilter, setRelFilter] = useState<string>('ALL')
  const [viewMode, setViewMode] = useState<'graph' | 'table'>('graph')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    setLoading(true)
    analysisApi.getGraph(scanTaskId).then(res => {
      setGraph(res.data.data)
    }).finally(() => setLoading(false))
  }, [scanTaskId])

  // 过滤节点和边
  const filteredData = (() => {
    if (!graph) return { nodes: [], edges: [] }
    const nodes = kindFilter === 'ALL'
      ? graph.nodes
      : graph.nodes.filter(n => n.kind === kindFilter)
    const nodeIds = new Set(nodes.map(n => n.id))
    const edges = relFilter === 'ALL'
      ? graph.edges.filter(e => nodeIds.has(e.source) || nodeIds.has(e.target))
      : graph.edges.filter(e => e.relationType === relFilter && (nodeIds.has(e.source) || nodeIds.has(e.target)))
    return { nodes, edges }
  })()

  // Canvas 力导向图渲染
  const drawGraph = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || filteredData.nodes.length === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    const W = rect.width
    const H = rect.height
    const centerX = W / 2
    const centerY = H / 2

    // 简单的力导向布局 - 基于径向分布
    const nodes = filteredData.nodes.map((n, i) => {
      const angle = (2 * Math.PI * i) / filteredData.nodes.length
      const radius = Math.min(W, H) * 0.35
      const jitter = (Math.random() - 0.5) * 40
      return {
        ...n,
        x: centerX + (radius + jitter) * Math.cos(angle),
        y: centerY + (radius + jitter) * Math.sin(angle),
        vx: 0,
        vy: 0,
      }
    })

    const nodeMap = new Map(nodes.map(n => [n.id, n]))

    // 200 步力导向迭代
    for (let step = 0; step < 200; step++) {
      // 斥力
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          let dx = nodes[j].x - nodes[i].x
          let dy = nodes[j].y - nodes[i].y
          let dist = Math.sqrt(dx * dx + dy * dy) || 1
          let force = 5000 / (dist * dist)
          nodes[i].vx -= (dx / dist) * force
          nodes[i].vy -= (dy / dist) * force
          nodes[j].vx += (dx / dist) * force
          nodes[j].vy += (dy / dist) * force
        }
      }

      // 引力（边）
      for (const edge of filteredData.edges) {
        const a = nodeMap.get(edge.source)
        const b = nodeMap.get(edge.target)
        if (!a || !b) continue
        let dx = b.x - a.x
        let dy = b.y - a.y
        let dist = Math.sqrt(dx * dx + dy * dy) || 1
        let force = (dist - 120) * 0.01
        a.vx += (dx / dist) * force
        a.vy += (dy / dist) * force
        b.vx -= (dx / dist) * force
        b.vy -= (dy / dist) * force
      }

      // 向心力 + 阻尼
      for (const n of nodes) {
        n.vx += (centerX - n.x) * 0.001
        n.vy += (centerY - n.y) * 0.001
        n.vx *= 0.8
        n.vy *= 0.8
        n.x += n.vx
        n.y += n.vy
        n.x = Math.max(30, Math.min(W - 30, n.x))
        n.y = Math.max(30, Math.min(H - 30, n.y))
      }
    }

    // 绘制
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#fafafa'
    ctx.fillRect(0, 0, W, H)

    // 边
    for (const edge of filteredData.edges) {
      const a = nodeMap.get(edge.source)
      const b = nodeMap.get(edge.target)
      if (!a || !b) continue

      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.strokeStyle = RELATION_COLORS[edge.relationType] || '#d9d9d9'
      ctx.lineWidth = 1
      ctx.globalAlpha = 0.5
      ctx.stroke()
      ctx.globalAlpha = 1

      // 箭头
      const angle = Math.atan2(b.y - a.y, b.x - a.x)
      const midX = (a.x + b.x) / 2
      const midY = (a.y + b.y) / 2
      const arrowLen = 6
      ctx.beginPath()
      ctx.moveTo(midX, midY)
      ctx.lineTo(midX - arrowLen * Math.cos(angle - 0.4), midY - arrowLen * Math.sin(angle - 0.4))
      ctx.moveTo(midX, midY)
      ctx.lineTo(midX - arrowLen * Math.cos(angle + 0.4), midY - arrowLen * Math.sin(angle + 0.4))
      ctx.strokeStyle = RELATION_COLORS[edge.relationType] || '#d9d9d9'
      ctx.lineWidth = 1.5
      ctx.stroke()
    }

    // 节点
    for (const n of nodes) {
      const isSelected = selectedNode?.id === n.id
      const r = isSelected ? 10 : 7

      ctx.beginPath()
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
      ctx.fillStyle = KIND_COLORS[n.kind] || '#d9d9d9'
      ctx.fill()
      if (isSelected) {
        ctx.strokeStyle = '#000'
        ctx.lineWidth = 2
        ctx.stroke()
      }

      ctx.fillStyle = '#333'
      ctx.font = `${isSelected ? 'bold ' : ''}10px -apple-system, sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(n.label, n.x, n.y + r + 12)
    }
  }, [filteredData, selectedNode])

  useEffect(() => {
    drawGraph()
  }, [drawGraph])

  // Canvas 点击检测
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // 重新计算布局找到节点位置（简单匹配）
    const nodes = filteredData.nodes.map((n, i) => {
      const angle = (2 * Math.PI * i) / filteredData.nodes.length
      const radius = Math.min(rect.width, rect.height) * 0.35
      return { ...n, x: rect.width / 2 + radius * Math.cos(angle), y: rect.height / 2 + radius * Math.sin(angle) }
    })

    for (const n of nodes) {
      const dist = Math.sqrt((n.x - x) ** 2 + (n.y - y) ** 2)
      if (dist < 15) {
        setSelectedNode(prev => prev?.id === n.id ? null : n)
        return
      }
    }
    setSelectedNode(null)
  }, [filteredData])

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
  if (!graph || graph.nodes.length === 0) return <Empty description="暂无依赖图谱数据" />

  const { summary } = graph
  const relatedEdges = selectedNode
    ? filteredData.edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
    : []

  return (
    <div>
      {/* 统计摘要 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Descriptions column={6} size="small" bordered>
          <Descriptions.Item label="总节点">{summary.totalNodes}</Descriptions.Item>
          <Descriptions.Item label="总边数">{summary.totalEdges}</Descriptions.Item>
          {Object.entries(summary.byKind).map(([k, v]) => (
            <Descriptions.Item key={k} label={k}>
              <Tag color={KIND_COLORS[k]}>{v}</Tag>
            </Descriptions.Item>
          ))}
        </Descriptions>
      </Card>

      {/* 控制栏 */}
      <Space style={{ marginBottom: 16 }} wrap>
        <Radio.Group value={viewMode} onChange={e => setViewMode(e.target.value)} buttonStyle="solid" size="small">
          <Radio.Button value="graph">图谱视图</Radio.Button>
          <Radio.Button value="table">表格视图</Radio.Button>
        </Radio.Group>
        <Select value={kindFilter} onChange={setKindFilter} size="small" style={{ width: 140 }}>
          <Select.Option value="ALL">全部类型</Select.Option>
          {Object.keys(summary.byKind).map(k => (
            <Select.Option key={k} value={k}>{k} ({summary.byKind[k]})</Select.Option>
          ))}
        </Select>
        <Select value={relFilter} onChange={setRelFilter} size="small" style={{ width: 160 }}>
          <Select.Option value="ALL">全部关系</Select.Option>
          {Object.keys(summary.byRelation).map(k => (
            <Select.Option key={k} value={k}>{k} ({summary.byRelation[k]})</Select.Option>
          ))}
        </Select>
      </Space>

      {viewMode === 'graph' ? (
        <Card bodyStyle={{ padding: 0 }}>
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            style={{
              width: '100%',
              height: 500,
              cursor: 'pointer',
              display: 'block',
            }}
          />
        </Card>
      ) : (
        <Card title={`符号列表 (${filteredData.nodes.length})`} size="small">
          <Table
            dataSource={filteredData.nodes}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 20 }}
            columns={[
              {
                title: '名称',
                dataIndex: 'label',
                key: 'label',
                render: (label: string) => (
                  <Text strong>{label}</Text>
                ),
              },
              {
                title: '类型',
                dataIndex: 'kind',
                key: 'kind',
                width: 100,
                render: (kind: string) => <Tag color={KIND_COLORS[kind]}>{kind}</Tag>,
              },
              { title: '包名', dataIndex: 'package', key: 'package', ellipsis: true },
              { title: '文件', dataIndex: 'filePath', key: 'filePath', ellipsis: true },
              {
                title: '关系数',
                key: 'relCount',
                width: 80,
                render: (_: unknown, record: GraphNode) => {
                  const count = graph.edges.filter(e => e.source === record.id || e.target === record.id).length
                  return count
                },
              },
            ]}
          />
        </Card>
      )}

      {/* 选中节点详情 */}
      {selectedNode && (
        <Card title="节点详情" size="small" style={{ marginTop: 16 }}>
          <Descriptions column={3} bordered size="small">
            <Descriptions.Item label="Symbol ID">{selectedNode.id}</Descriptions.Item>
            <Descriptions.Item label="名称">{selectedNode.label}</Descriptions.Item>
            <Descriptions.Item label="类型">
              <Tag color={KIND_COLORS[selectedNode.kind]}>{selectedNode.kind}</Tag>
            </Descriptions.Item>
            {selectedNode.package && <Descriptions.Item label="包名">{selectedNode.package}</Descriptions.Item>}
            {selectedNode.filePath && <Descriptions.Item label="文件" span={2}>{selectedNode.filePath}</Descriptions.Item>}
            {selectedNode.lineNumber && <Descriptions.Item label="行号">{selectedNode.lineNumber}</Descriptions.Item>}
          </Descriptions>
          {relatedEdges.length > 0 && (
            <Table
              dataSource={relatedEdges}
              rowKey={(r: GraphEdge) => `${r.source}-${r.target}-${r.relationType}`}
              size="small"
              style={{ marginTop: 12 }}
              pagination={false}
              columns={[
                { title: '源', dataIndex: 'source', key: 'source', ellipsis: true },
                {
                  title: '关系',
                  dataIndex: 'relationType',
                  key: 'relationType',
                  width: 120,
                  render: (t: string) => <Tag color={RELATION_COLORS[t]}>{t}</Tag>,
                },
                { title: '目标', dataIndex: 'target', key: 'target', ellipsis: true },
              ]}
            />
          )}
        </Card>
      )}
    </div>
  )
}