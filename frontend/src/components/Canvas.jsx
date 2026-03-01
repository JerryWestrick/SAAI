import React, { useMemo, useCallback } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import ProcessNode from './nodes/ProcessNode'
import ExternalEntityNode from './nodes/ExternalEntityNode'
import DataStoreNode from './nodes/DataStoreNode'
import DataFlowEdge from './edges/DataFlowEdge'

const nodeTypes = {
  process: ProcessNode,
  external_entity: ExternalEntityNode,
  data_store: DataStoreNode,
}

const edgeTypes = {
  data_flow: DataFlowEdge,
}

const NODE_TYPE_MAP = {
  process: 'process',
  external_entity: 'external_entity',
  data_store: 'data_store',
}

const NODE_SIZES = {
  process: { width: 160, height: 160 },
  external_entity: { width: 140, height: 50 },
  data_store: { width: 160, height: 44 },
}

function dbNodesToFlow(dbNodes) {
  return (dbNodes || []).map(n => ({
    id: String(n.id),
    type: NODE_TYPE_MAP[n.node_type] || 'process',
    position: { x: n.x || 0, y: n.y || 0 },
    data: { label: n.name, number: n.number },
  }))
}

function pickHandle(angleDeg, isProcess) {
  const a = ((angleDeg % 360) + 360) % 360
  if (isProcess) {
    if (a < 22.5 || a >= 337.5) return 'right'
    if (a < 67.5) return 'bottom-right'
    if (a < 112.5) return 'bottom'
    if (a < 157.5) return 'bottom-left'
    if (a < 202.5) return 'left'
    if (a < 247.5) return 'top-left'
    if (a < 292.5) return 'top'
    return 'top-right'
  }
  if (a < 45 || a >= 315) return 'right'
  if (a < 135) return 'bottom'
  if (a < 225) return 'left'
  return 'top'
}

function getHandlePair(srcNode, tgtNode) {
  const ss = NODE_SIZES[srcNode.node_type] || NODE_SIZES.process
  const ts = NODE_SIZES[tgtNode.node_type] || NODE_SIZES.process
  const dx = ((tgtNode.x || 0) + ts.width / 2) - ((srcNode.x || 0) + ss.width / 2)
  const dy = ((tgtNode.y || 0) + ts.height / 2) - ((srcNode.y || 0) + ss.height / 2)
  const angle = Math.atan2(dy, dx) * 180 / Math.PI

  return {
    sourceHandle: pickHandle(angle, srcNode.node_type === 'process'),
    targetHandle: pickHandle(angle + 180, tgtNode.node_type === 'process'),
  }
}

function dbFlowsToEdges(dbFlows, nodeMap) {
  return (dbFlows || []).map(f => {
    const src = nodeMap[f.source_id]
    const tgt = nodeMap[f.target_id]
    const handles = src && tgt
      ? getHandlePair(src, tgt)
      : { sourceHandle: 'right', targetHandle: 'left' }

    return {
      id: `flow-${f.id}`,
      source: String(f.source_id),
      target: String(f.target_id),
      sourceHandle: handles.sourceHandle,
      targetHandle: handles.targetHandle,
      type: 'data_flow',
      data: { label: f.name, as_of: f.as_of, srcHandle: handles.sourceHandle, tgtHandle: handles.targetHandle },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#00d4ff' },
    }
  })
}

export default function Canvas({ db, diagramId, onNodePositionChange }) {
  const filteredNodes = useMemo(
    () => (db.nodes || []).filter(n => n.diagram_id === diagramId),
    [db.nodes, diagramId]
  )
  const filteredFlows = useMemo(
    () => (db.data_flows || []).filter(f => f.diagram_id === diagramId),
    [db.data_flows, diagramId]
  )

  const nodeMap = useMemo(() => {
    const map = {}
    for (const n of filteredNodes) map[n.id] = n
    return map
  }, [filteredNodes])

  const flowNodes = useMemo(() => dbNodesToFlow(filteredNodes), [filteredNodes])
  const flowEdges = useMemo(() => dbFlowsToEdges(filteredFlows, nodeMap), [filteredFlows, nodeMap])

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges)

  // Sync when DB data changes
  React.useEffect(() => { setNodes(flowNodes) }, [flowNodes, setNodes])
  React.useEffect(() => { setEdges(flowEdges) }, [flowEdges, setEdges])

  const onNodeDragStop = useCallback((_event, node) => {
    onNodePositionChange(Number(node.id), node.position.x, node.position.y)
  }, [onNodePositionChange])

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        style={{ background: '#1a1a2e' }}
      >
        <Background color="#0f3460" gap={20} />
        <Controls
          style={{ button: { background: '#16213e', color: '#e0e0e0', border: '1px solid #0f3460' } }}
        />
      </ReactFlow>
    </div>
  )
}
