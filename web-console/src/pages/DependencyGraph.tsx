import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import type { ReactNode } from 'react'
import { Alert, Card, Descriptions, Input, Modal, Radio, Select, Table, Tag, Typography } from 'antd'
import {
  BranchesOutlined,
  CheckCircleOutlined,
  DatabaseOutlined,
  FileSearchOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { formatApiError } from '../api/client'
import { analysisApi, DependencyGraph, GraphNode, GraphEdge } from '../api/analysis'
import ActionButton from '../components/ui/ActionButton'
import StateBlock from '../components/ui/StateBlock'

const { Text } = Typography

const LARGE_GRAPH_TABLE_THRESHOLD = 500
const GRAPH_PREVIEW_NODE_LIMIT = 220
const GRAPH_PREVIEW_EDGE_LIMIT = 700
const MERMAID_EXPORT_NODE_LIMIT = 800

type PositionedGraphNode = GraphNode & {
  x: number
  y: number
  vx: number
  vy: number
}

type GraphInsightTone = 'ready' | 'warning' | 'danger'

interface GraphInsight {
  tone: GraphInsightTone
  label: string
  summary: string
  nextAction: string
}

interface GraphInsights {
  averageDegree: number
  crossPackageEdges: number
  crossPackageRatio: number
  density: number
  dominantPackage?: { name: string; count: number; activeEdges: number }
  dominantPackageRatio: number
  highCouplingCount: number
  hubThreshold: number
  isolatedCount: number
  packageEntries: Array<{ name: string; count: number; activeEdges: number }>
  reciprocalPairs: number
  relationEntries: Array<[string, number]>
  selfLoops: number
  topHubs: Array<{ node: GraphNode; degree: number }>
}

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
  const [error, setError] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [kindFilter, setKindFilter] = useState<string>('ALL')
  const [relFilter, setRelFilter] = useState<string>('ALL')
  const [viewMode, setViewMode] = useState<'graph' | 'table'>('graph')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nodePositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map())

  const exportMermaid = () => {
    if (!graph || filteredData.nodes.length === 0) return
    const exportData = filteredData.nodes.length > MERMAID_EXPORT_NODE_LIMIT ? visualData : filteredData
    let mermaidText = 'graph TD\n'
    exportData.nodes.forEach(node => {
      const safeLabel = node.label.replace(/"/g, '\\"')
      mermaidText += `  ${node.id.replace(/[^a-zA-Z0-9]/g, '_')}["${node.kind}: ${safeLabel}"]\n`
    })
    exportData.edges.forEach(edge => {
      mermaidText += `  ${edge.source.replace(/[^a-zA-Z0-9]/g, '_')} -->|${edge.relationType}| ${edge.target.replace(/[^a-zA-Z0-9]/g, '_')}\n`
    })

    Modal.info({
      title: '导出 Mermaid 依赖图',
      width: 600,
      okText: '确定',
      content: (
        <div style={{ marginTop: 12 }}>
          <Typography.Paragraph>
            当前导出 {exportData.nodes.length}/{filteredData.nodes.length} 个节点，{exportData.edges.length}/{filteredData.edges.length} 条关系。
          </Typography.Paragraph>
          <Input.TextArea rows={12} value={mermaidText} readOnly style={{ fontFamily: 'monospace' }} />
        </div>
      )
    })
  }

  const loadGraph = useCallback(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setGraph(null)
    setSelectedNode(null)
    analysisApi.getGraph(scanTaskId)
      .then(res => {
        if (cancelled) return
        const nextGraph = res.data.data
        setGraph(nextGraph)
        setViewMode(nextGraph.nodes.length > LARGE_GRAPH_TABLE_THRESHOLD ? 'table' : 'graph')
      })
      .catch(error => {
        if (cancelled) return
        setError(formatApiError(error, '加载依赖图谱失败'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [scanTaskId])

  useEffect(() => loadGraph(), [loadGraph])

  // 过滤节点和边
  const filteredData = useMemo(() => {
    if (!graph) return { nodes: [], edges: [] }
    const nodes = kindFilter === 'ALL'
      ? graph.nodes
      : graph.nodes.filter(n => n.kind === kindFilter)
    const nodeIds = new Set(nodes.map(n => n.id))
    const edges = relFilter === 'ALL'
      ? graph.edges.filter(e => nodeIds.has(e.source) || nodeIds.has(e.target))
      : graph.edges.filter(e => e.relationType === relFilter && (nodeIds.has(e.source) || nodeIds.has(e.target)))
    return { nodes, edges }
  }, [graph, kindFilter, relFilter])

  const graphDegreeMap = useMemo(() => {
    const degreeMap = new Map<string, number>()
    if (!graph) return degreeMap
    for (const edge of graph.edges) {
      degreeMap.set(edge.source, (degreeMap.get(edge.source) || 0) + 1)
      degreeMap.set(edge.target, (degreeMap.get(edge.target) || 0) + 1)
    }
    return degreeMap
  }, [graph])

  const filteredDegreeMap = useMemo(() => {
    const degreeMap = new Map<string, number>()
    for (const edge of filteredData.edges) {
      degreeMap.set(edge.source, (degreeMap.get(edge.source) || 0) + 1)
      degreeMap.set(edge.target, (degreeMap.get(edge.target) || 0) + 1)
    }
    return degreeMap
  }, [filteredData])

  const graphInsights = useMemo<GraphInsights | null>(() => {
    if (!graph) return null
    const nodeById = new Map(graph.nodes.map(node => [node.id, node]))
    const packageMap = new Map<string, { name: string; count: number; activeEdges: number }>()
    const relationEntries = Object.entries(graph.summary.byRelation)
      .sort((a, b) => b[1] - a[1])

    for (const node of graph.nodes) {
      const packageName = getNodeGroup(node)
      const entry = packageMap.get(packageName) || { name: packageName, count: 0, activeEdges: 0 }
      entry.count += 1
      packageMap.set(packageName, entry)
    }

    let crossPackageEdges = 0
    let selfLoops = 0
    const reciprocalSet = new Set<string>()
    const seenDirected = new Set<string>()
    for (const edge of graph.edges) {
      const sourceNode = nodeById.get(edge.source)
      const targetNode = nodeById.get(edge.target)
      if (edge.source === edge.target) selfLoops += 1
      if (sourceNode && targetNode && getNodeGroup(sourceNode) !== getNodeGroup(targetNode)) {
        crossPackageEdges += 1
      }
      const sourceGroup = sourceNode ? getNodeGroup(sourceNode) : 'UNKNOWN'
      const targetGroup = targetNode ? getNodeGroup(targetNode) : 'UNKNOWN'
      const sourceEntry = packageMap.get(sourceGroup)
      const targetEntry = packageMap.get(targetGroup)
      if (sourceEntry) sourceEntry.activeEdges += 1
      if (targetEntry && targetEntry !== sourceEntry) targetEntry.activeEdges += 1
      const pairKey = [edge.source, edge.target].sort().join('::')
      const reverseKey = `${edge.target}->${edge.source}`
      if (seenDirected.has(reverseKey)) reciprocalSet.add(pairKey)
      seenDirected.add(`${edge.source}->${edge.target}`)
    }

    const topHubs = Array.from(graphDegreeMap.entries())
      .map(([id, degree]) => ({ node: nodeById.get(id), degree }))
      .filter((item): item is { node: GraphNode; degree: number } => Boolean(item.node))
      .sort((a, b) => b.degree - a.degree || a.node.label.localeCompare(b.node.label))
      .slice(0, 8)

    const averageDegree = graph.nodes.length ? (graph.edges.length * 2) / graph.nodes.length : 0
    const hubThreshold = Math.max(10, Math.ceil(averageDegree * 2.8))
    const highCouplingCount = topHubs.filter(item => item.degree >= hubThreshold).length
    const isolatedCount = graph.nodes.filter(node => !graphDegreeMap.has(node.id)).length
    const density = graph.nodes.length > 1
      ? graph.edges.length / (graph.nodes.length * (graph.nodes.length - 1))
      : 0
    const packageEntries = Array.from(packageMap.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    const dominantPackage = packageEntries[0]
    const dominantPackageRatio = dominantPackage && graph.nodes.length
      ? dominantPackage.count / graph.nodes.length
      : 0
    const crossPackageRatio = graph.edges.length ? crossPackageEdges / graph.edges.length : 0

    return {
      averageDegree,
      crossPackageEdges,
      crossPackageRatio,
      density,
      dominantPackage,
      dominantPackageRatio,
      highCouplingCount,
      hubThreshold,
      isolatedCount,
      packageEntries,
      reciprocalPairs: reciprocalSet.size,
      relationEntries,
      selfLoops,
      topHubs,
    }
  }, [graph, graphDegreeMap])

  const architectureSignal = useMemo(() => {
    if (!graph || !graphInsights) return null
    return buildArchitectureSignal(graph, graphInsights)
  }, [graph, graphInsights])

  const visualData = useMemo(() => {
    if (filteredData.nodes.length <= GRAPH_PREVIEW_NODE_LIMIT) return filteredData

    const selectedIds = new Set<string>()
    Array.from(filteredDegreeMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, GRAPH_PREVIEW_NODE_LIMIT)
      .forEach(([id]) => selectedIds.add(id))

    for (const node of filteredData.nodes) {
      if (selectedIds.size >= GRAPH_PREVIEW_NODE_LIMIT) break
      selectedIds.add(node.id)
    }

    const nodes = filteredData.nodes.filter(node => selectedIds.has(node.id))
    const nodeIds = new Set(nodes.map(node => node.id))
    const edges = filteredData.edges
      .filter(edge => nodeIds.has(edge.source) && nodeIds.has(edge.target))
      .slice(0, GRAPH_PREVIEW_EDGE_LIMIT)
    return { nodes, edges }
  }, [filteredData, filteredDegreeMap])

  const isGraphPreviewCapped = visualData.nodes.length < filteredData.nodes.length
    || visualData.edges.length < filteredData.edges.length

  // Canvas 力导向图渲染
  const drawGraph = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

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

    // 绘制前先清理画布，解决切换筛选条件为 0 时的残影 Bug
    ctx.clearRect(0, 0, W, H)
    nodePositionsRef.current.clear()

    if (visualData.nodes.length === 0) return

    // 简单的力导向布局 - 基于径向分布
    const nodes: PositionedGraphNode[] = visualData.nodes.map((n, i) => {
      const angle = (2 * Math.PI * i) / visualData.nodes.length
      const radius = Math.min(W, H) * 0.35
      const jitter = (hashToUnit(n.id) - 0.5) * 40
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
      for (const edge of visualData.edges) {
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
    for (const edge of visualData.edges) {
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

    nodePositionsRef.current = new Map(nodes.map(n => [n.id, { x: n.x, y: n.y }]))

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
      const label = n.label.length > 28 ? `${n.label.slice(0, 25)}...` : n.label
      ctx.fillText(label, n.x, n.y + r + 12)
    }
  }, [selectedNode, visualData])

  useEffect(() => {
    drawGraph()
    const handleResize = () => drawGraph()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [drawGraph])

  // Canvas 点击检测
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    for (const node of visualData.nodes) {
      const position = nodePositionsRef.current.get(node.id)
      if (!position) continue
      const dist = Math.sqrt((position.x - x) ** 2 + (position.y - y) ** 2)
      if (dist < 15) {
        setSelectedNode(prev => prev?.id === node.id ? null : node)
        return
      }
    }
    setSelectedNode(null)
  }, [visualData])

  if (loading) return <StateBlock tone="loading" title="正在加载依赖图谱" description="系统正在读取符号节点、依赖边和架构洞察。" />
  if (error) return (
    <StateBlock
      tone="error"
      title="依赖图谱加载失败"
      description={error}
      action={<ActionButton icon={<ReloadOutlined spin={loading} />} loading={loading} onClick={loadGraph} label="重新加载图谱" />}
    />
  )
  if (!graph || graph.nodes.length === 0) return <StateBlock title="暂无依赖图谱数据" description="成功扫描并生成符号关系后会展示依赖图谱。" />

  const { summary } = graph
  const relatedEdges = selectedNode
    ? filteredData.edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
    : []
  const selectedDegree = selectedNode ? graphDegreeMap.get(selectedNode.id) || 0 : 0
  const selectedIncoming = selectedNode ? filteredData.edges.filter(e => e.target === selectedNode.id).length : 0
  const selectedOutgoing = selectedNode ? filteredData.edges.filter(e => e.source === selectedNode.id).length : 0

  return (
    <div className="sl-graph-workbench">
      <section className="sl-graph-cockpit">
        <div className="sl-graph-cockpit-main">
          <div className="sl-kicker">Architecture Dependency Graph</div>
          <h2 className="sl-graph-title">依赖图谱与架构洞察</h2>
          <p className="sl-graph-desc">
            从代码符号和关系中识别中心节点、跨包耦合、孤立符号和关系分布，帮助你判断仓库结构是否清晰、哪些模块需要优先复盘。
          </p>
          <div className="sl-graph-status-line">
            <span><span className="sl-live-dot" />扫描任务 #{scanTaskId}</span>
            <span>{filteredData.nodes.length} 个可见节点</span>
            <span>{filteredData.edges.length} 条可见关系</span>
          </div>
          <div className="sl-graph-actions">
            <Radio.Group value={viewMode} onChange={e => setViewMode(e.target.value)} buttonStyle="solid">
              <Radio.Button value="graph">图谱视图</Radio.Button>
              <Radio.Button value="table">表格视图</Radio.Button>
            </Radio.Group>
            <ActionButton type="primary" onClick={exportMermaid} label="导出 Mermaid" />
          </div>
        </div>

        <aside className="sl-graph-boundary-card">
          <div className="sl-graph-boundary-head">
            <SafetyCertificateOutlined />
            <div>
              <span>Architecture Boundary</span>
              <strong>先识别结构，再讨论重构</strong>
            </div>
          </div>
          <div className="sl-graph-boundary-list">
            <div><CheckCircleOutlined />中心节点应有清晰职责</div>
            <div><CheckCircleOutlined />跨包依赖需要可解释</div>
            <div><CheckCircleOutlined />孤立符号需要确认价值</div>
            <div><CheckCircleOutlined />大图默认降采样预览</div>
          </div>
        </aside>
      </section>

      <section className="sl-graph-summary-grid">
        <GraphStat icon={<FileSearchOutlined />} label="符号节点" value={summary.totalNodes} footnote={`${Object.keys(summary.byKind).length} 种类型`} />
        <GraphStat icon={<BranchesOutlined />} label="依赖关系" value={summary.totalEdges} footnote={`${Object.keys(summary.byRelation).length} 种关系`} />
        <GraphStat icon={<DatabaseOutlined />} label="包/目录组" value={graphInsights?.packageEntries.length || 0} footnote={graphInsights?.dominantPackage ? `最大 ${graphInsights.dominantPackage.name}` : '暂无分组'} />
        <GraphStat icon={<WarningOutlined />} label="高耦合节点" value={graphInsights?.highCouplingCount || 0} footnote={`阈值 ${graphInsights?.hubThreshold || 0} 条关系`} tone={(graphInsights?.highCouplingCount || 0) ? 'warning' : 'ready'} />
      </section>

      {architectureSignal && graphInsights && (
        <GraphSignal signal={architectureSignal} insights={graphInsights} />
      )}

      {graphInsights && (
        <section className="sl-graph-insight-grid">
          <Card size="small" className="sl-graph-insight-card" title="中心节点">
            <div className="sl-graph-hub-list">
              {graphInsights.topHubs.length ? graphInsights.topHubs.slice(0, 6).map(({ node, degree }) => (
                <button
                  key={node.id}
                  type="button"
                  className={`sl-graph-hub-item ${selectedNode?.id === node.id ? 'sl-graph-hub-item-active' : ''}`}
                  onClick={() => setSelectedNode(node)}
                >
                  <span>
                    <strong>{node.label}</strong>
                    <small>{node.package || node.filePath || 'UNKNOWN'}</small>
                  </span>
                  <Tag color={degree >= graphInsights.hubThreshold ? 'orange' : KIND_COLORS[node.kind]}>{degree}</Tag>
                </button>
              )) : <Text type="secondary">暂无中心节点</Text>}
            </div>
          </Card>

          <Card size="small" className="sl-graph-insight-card" title="包/目录分布">
            <div className="sl-graph-package-list">
              {graphInsights.packageEntries.slice(0, 6).map(entry => (
                <div key={entry.name} className="sl-graph-package-item">
                  <div>
                    <strong>{entry.name}</strong>
                    <span>{entry.count} 节点 / {entry.activeEdges} 关系</span>
                  </div>
                  <div className="sl-graph-package-bar">
                    <i style={{ width: `${barPercent(entry.count, graphInsights.packageEntries[0]?.count || 1)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card size="small" className="sl-graph-insight-card" title="关系类型">
            <div className="sl-graph-relation-list">
              {graphInsights.relationEntries.map(([relation, count]) => (
                <div key={relation}>
                  <Tag color={RELATION_COLORS[relation] || 'default'}>{relation}</Tag>
                  <strong>{count}</strong>
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}

      <Card size="small" className="sl-graph-control-card">
        <div className="sl-graph-toolbar">
          <Select value={kindFilter} onChange={setKindFilter}>
            <Select.Option value="ALL">全部类型</Select.Option>
            {Object.keys(summary.byKind).map(k => (
              <Select.Option key={k} value={k}>{k} ({summary.byKind[k]})</Select.Option>
            ))}
          </Select>
          <Select value={relFilter} onChange={setRelFilter}>
            <Select.Option value="ALL">全部关系</Select.Option>
            {Object.keys(summary.byRelation).map(k => (
              <Select.Option key={k} value={k}>{k} ({summary.byRelation[k]})</Select.Option>
            ))}
          </Select>
          <ActionButton
            onClick={() => {
              setKindFilter('ALL')
              setRelFilter('ALL')
              setSelectedNode(null)
            }}
            label="重置筛选"
          />
        </div>
      </Card>

      {viewMode === 'graph' && isGraphPreviewCapped && (
        <Alert
          className="sl-graph-preview-alert"
          type="info"
          showIcon
          message={`画布预览 ${visualData.nodes.length}/${filteredData.nodes.length} 个节点，${visualData.edges.length}/${filteredData.edges.length} 条关系`}
        />
      )}

      {viewMode === 'graph' ? (
        <Card className="sl-graph-canvas-card">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="sl-graph-canvas"
          />
        </Card>
      ) : (
        <Card title={`符号列表 (${filteredData.nodes.length})`} size="small" className="sl-graph-table-card">
          <Table
            dataSource={filteredData.nodes}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 20 }}
            scroll={{ x: 920 }}
            tableLayout="fixed"
            onRow={(record) => ({
              onClick: () => setSelectedNode(record),
              className: selectedNode?.id === record.id ? 'sl-graph-row-active' : '',
            })}
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
                title: '中心度',
                key: 'relCount',
                width: 80,
                render: (_: unknown, record: GraphNode) => {
                  return graphDegreeMap.get(record.id) || 0
                },
              },
            ]}
          />
        </Card>
      )}

      {/* 选中节点详情 */}
      {selectedNode && (
        <Card title="节点详情" size="small" className="sl-graph-node-detail">
          <div className="sl-graph-node-metric-grid">
            <div><span>中心度</span><strong>{selectedDegree}</strong></div>
            <div><span>入向关系</span><strong>{selectedIncoming}</strong></div>
            <div><span>出向关系</span><strong>{selectedOutgoing}</strong></div>
            <div><span>所属分组</span><strong>{getNodeGroup(selectedNode)}</strong></div>
          </div>
          <Descriptions column={{ xs: 1, md: 3 }} bordered size="small">
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
                scroll={{ x: 760 }}
                tableLayout="fixed"
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

function GraphStat({
  icon,
  label,
  value,
  footnote,
  tone = 'default',
}: {
  icon: ReactNode
  label: string
  value: number | string
  footnote: string
  tone?: GraphInsightTone | 'default'
}) {
  return (
    <div className={`sl-graph-stat sl-graph-stat-${tone}`}>
      <div className="sl-graph-stat-head">
        <span>{label}</span>
        {icon}
      </div>
      <strong>{value}</strong>
      <small>{footnote}</small>
    </div>
  )
}

function GraphSignal({ signal, insights }: { signal: GraphInsight; insights: GraphInsights }) {
  return (
    <div className={`sl-graph-signal sl-graph-signal-${signal.tone}`}>
      <div className="sl-graph-signal-head">
        {signal.tone === 'danger' ? <WarningOutlined /> : <SafetyCertificateOutlined />}
        <div>
          <span>Architecture Signal</span>
          <strong>{signal.summary}</strong>
        </div>
        <Tag color={signal.tone === 'ready' ? 'green' : signal.tone === 'warning' ? 'gold' : 'red'}>{signal.label}</Tag>
      </div>
      <div className="sl-graph-signal-grid">
        <div><span>平均度数</span><strong>{insights.averageDegree.toFixed(1)}</strong></div>
        <div><span>跨组关系</span><strong>{formatPercent(insights.crossPackageRatio)}</strong></div>
        <div><span>孤立节点</span><strong>{insights.isolatedCount}</strong></div>
        <div><span>双向关系</span><strong>{insights.reciprocalPairs}</strong></div>
      </div>
      <div className="sl-graph-next-action">
        <CheckCircleOutlined />
        <span>{signal.nextAction}</span>
      </div>
    </div>
  )
}

function buildArchitectureSignal(graph: DependencyGraph, insights: GraphInsights): GraphInsight {
  if (insights.highCouplingCount >= 3 || insights.selfLoops > 0) {
    return {
      label: '需复盘',
      tone: 'danger',
      summary: insights.selfLoops > 0 ? '图谱中存在自依赖关系' : '多个中心节点关系过于集中',
      nextAction: '优先查看中心节点列表，确认这些类/接口是否承担了过多职责或隐含循环依赖。',
    }
  }

  if (insights.crossPackageRatio > 0.45 || insights.dominantPackageRatio > 0.55 || insights.isolatedCount > graph.nodes.length * 0.25) {
    return {
      label: '关注',
      tone: 'warning',
      summary: insights.crossPackageRatio > 0.45 ? '跨包依赖占比较高' : '结构分布存在明显偏斜',
      nextAction: '结合包/目录分布和关系类型，判断是否需要拆分模块边界或补齐未识别符号。',
    }
  }

  return {
    label: '健康',
    tone: 'ready',
    summary: '依赖图谱结构相对均衡',
    nextAction: '可继续从中心节点进入源码阅读，并把关键关系沉淀到报告和 Agent 上下文。',
  }
}

function getNodeGroup(node: GraphNode) {
  if (node.package) return node.package
  if (!node.filePath) return 'UNKNOWN'
  const parts = node.filePath.split(/[\\/]/).filter(Boolean)
  if (parts.length <= 1) return parts[0] || 'ROOT'
  const srcIndex = parts.findIndex(part => part === 'src')
  if (srcIndex >= 0 && parts.length > srcIndex + 3) {
    return parts.slice(srcIndex, Math.min(parts.length - 1, srcIndex + 4)).join('/')
  }
  return parts.slice(0, Math.min(3, parts.length - 1)).join('/')
}

function hashToUnit(value: string) {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0
  }
  return (Math.abs(hash) % 1000) / 1000
}

function barPercent(value: number, max: number) {
  if (!max) return 0
  return Math.max(8, Math.round((value / max) * 100))
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`
}
