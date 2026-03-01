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

function dbNodesToFlow(dbNodes) {
  return (dbNodes || []).map(n => ({
    id: String(n.id),
    type: NODE_TYPE_MAP[n.node_type] || 'process',
    position: { x: n.x || 0, y: n.y || 0 },
    data: { label: n.name, number: n.number },
  }))
}

function dbFlowsToEdges(dbFlows) {
  return (dbFlows || []).map(f => ({
    id: `flow-${f.id}`,
    source: String(f.source_id),
    target: String(f.target_id),
    type: 'data_flow',
    data: { label: f.name, as_of: f.as_of },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#00d4ff' },
  }))
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

  const flowNodes = useMemo(() => dbNodesToFlow(filteredNodes), [filteredNodes])
  const flowEdges = useMemo(() => dbFlowsToEdges(filteredFlows), [filteredFlows])

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
