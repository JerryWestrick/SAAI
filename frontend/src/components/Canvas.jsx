import React, { useMemo, useCallback, useEffect } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  useReactFlow,
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
    data: { label: n.name, number: n.number, child_diagram_id: n.child_diagram_id || null },
  }))
}

// All node types now have 8 handles: 4 cardinal + 4 corners, ordered clockwise
const HANDLES = ['right', 'bottom-right', 'bottom', 'bottom-left', 'left', 'top-left', 'top', 'top-right']

function closestHandleIndex(angleDeg) {
  const a = ((angleDeg % 360) + 360) % 360
  return Math.round(a / 45) % 8
}

function pickHandle(angleDeg) {
  return HANDLES[closestHandleIndex(angleDeg)]
}

function nodeCenter(node) {
  const s = NODE_SIZES[node.node_type] || NODE_SIZES.process
  return { x: (node.x || 0) + s.width / 2, y: (node.y || 0) + s.height / 2 }
}

// Symmetric offsets: odd count includes center (0), even count skips it
// 1 → [0], 2 → [-1,+1], 3 → [-1,0,+1], 4 → [-2,-1,+1,+2], 5 → [-2,-1,0,+1,+2]
function symmetricOffsets(count) {
  if (count <= 1) return [0]
  const offsets = []
  if (count % 2 === 1) {
    for (let i = -(count - 1) / 2; i <= (count - 1) / 2; i++) offsets.push(i)
  } else {
    for (let i = -count / 2; i <= count / 2; i++) {
      if (i !== 0) offsets.push(i)
    }
  }
  return offsets
}

function dbFlowsToEdges(dbFlows, nodeMap) {
  // Group edges by unordered node pair
  const pairEdges = {}
  for (const f of (dbFlows || [])) {
    const key = [f.source_id, f.target_id].sort().join('-')
    if (!pairEdges[key]) pairEdges[key] = []
    pairEdges[key].push(f)
  }

  // === PASS 1: Assign handles using symmetric fan ===
  // Each edge gets: { flow, nodeAHandle (index), nodeBHandle (index), idA, idB }
  const assignments = []
  for (const [key, edges] of Object.entries(pairEdges)) {
    const [idA, idB] = key.split('-').map(Number)
    const nodeA = nodeMap[idA]
    const nodeB = nodeMap[idB]
    if (!nodeA || !nodeB) continue

    const cA = nodeCenter(nodeA)
    const cB = nodeCenter(nodeB)
    const angleAtoB = Math.atan2(cB.y - cA.y, cB.x - cA.x) * 180 / Math.PI
    const centerIdxA = closestHandleIndex(angleAtoB)
    const centerIdxB = closestHandleIndex(angleAtoB + 180)
    const offsets = symmetricOffsets(edges.length)

    edges.forEach((f, i) => {
      assignments.push({
        flow: f,
        idA, idB,
        handleIdxA: ((centerIdxA + offsets[i]) % 8 + 8) % 8,
        handleIdxB: ((centerIdxB - offsets[i]) % 8 + 8) % 8,
        centerIdxA, centerIdxB,
      })
    })
  }

  // === PASS 2: Detect and resolve direction conflicts ===
  // A conflict: same handle on same node used as both source and target
  function getDirection(assignment, nodeId) {
    const { flow, idA, handleIdxA, handleIdxB } = assignment
    const handleIdx = nodeId === idA ? handleIdxA : handleIdxB
    const dir = flow.source_id === nodeId ? 'source' : 'target'
    return { handleIdx, dir }
  }

  function findConflicts() {
    // For each node, group assignments by handle index and check for mixed directions
    const nodeHandleMap = {} // nodeId -> { handleIdx -> Set<'source'|'target'> }
    for (const a of assignments) {
      for (const nid of [a.idA, a.idB]) {
        const { handleIdx, dir } = getDirection(a, nid)
        if (!nodeHandleMap[nid]) nodeHandleMap[nid] = {}
        if (!nodeHandleMap[nid][handleIdx]) nodeHandleMap[nid][handleIdx] = new Set()
        nodeHandleMap[nid][handleIdx].add(dir)
      }
    }
    const conflicts = [] // { nodeId, handleIdx }
    for (const [nid, handles] of Object.entries(nodeHandleMap)) {
      for (const [hidx, dirs] of Object.entries(handles)) {
        if (dirs.has('source') && dirs.has('target')) {
          conflicts.push({ nodeId: Number(nid), handleIdx: Number(hidx) })
        }
      }
    }
    return conflicts
  }

  function resolveConflicts() {
    for (let iter = 0; iter < 10; iter++) {
      const conflicts = findConflicts()
      if (conflicts.length === 0) return

      for (const { nodeId, handleIdx } of conflicts) {
        // Get all assignments touching this node
        const nodeAssignments = assignments.filter(a => a.idA === nodeId || a.idB === nodeId)

        // Get the assignments that use this conflicting handle
        const conflicting = nodeAssignments.filter(a => {
          const idx = a.idA === nodeId ? a.handleIdxA : a.handleIdxB
          return idx === handleIdx
        })

        // Separate by direction
        const sources = conflicting.filter(a => a.flow.source_id === nodeId)
        const targets = conflicting.filter(a => a.flow.target_id === nodeId)

        // Keep whichever direction has more flows at this handle; move the minority
        const toMove = sources.length <= targets.length ? sources : targets

        for (const a of toMove) {
          const isA = a.idA === nodeId
          const currentIdx = isA ? a.handleIdxA : a.handleIdxB

          // Option 1: Try swapping with another flow in the same pair group that has compatible direction
          const pairKey = [a.idA, a.idB].sort().join('-')
          const pairAssignments = assignments.filter(
            x => [x.idA, x.idB].sort().join('-') === pairKey && x !== a
          )
          let swapped = false
          for (const candidate of pairAssignments) {
            const candIdx = isA ? candidate.handleIdxA : candidate.handleIdxB
            const candDir = candidate.flow.source_id === nodeId ? 'source' : 'target'
            const myDir = a.flow.source_id === nodeId ? 'source' : 'target'
            // Can swap if candidate's direction matches what we need at our current handle
            if (candDir === myDir) continue // same direction, swapping won't help
            // Check if swapping would resolve: candidate takes our handle (compatible), we take theirs
            const candHandleUsed = nodeAssignments.filter(x => x !== a && x !== candidate)
              .some(x => {
                const idx = x.idA === nodeId ? x.handleIdxA : x.handleIdxB
                const dir = x.flow.source_id === nodeId ? 'source' : 'target'
                return idx === candIdx && dir !== myDir
              })
            if (!candHandleUsed) {
              // Swap BOTH ends so the lines don't cross
              const tmpA = a.handleIdxA; a.handleIdxA = candidate.handleIdxA; candidate.handleIdxA = tmpA
              const tmpB = a.handleIdxB; a.handleIdxB = candidate.handleIdxB; candidate.handleIdxB = tmpB
              swapped = true
              break
            }
          }
          if (swapped) continue

          // Option 2: Check if there's an empty center handle (even-count groups skip center)
          const pairEdgesForA = assignments.filter(x => [x.idA, x.idB].sort().join('-') === pairKey)
          const centerIdx = isA ? a.centerIdxA : a.centerIdxB
          const centerUsed = nodeAssignments.some(x => {
            const idx = x.idA === nodeId ? x.handleIdxA : x.handleIdxB
            return idx === centerIdx
          })
          if (!centerUsed) {
            if (isA) a.handleIdxA = centerIdx
            else a.handleIdxB = centerIdx
            continue
          }

          // Option 3: Find nearest unused handle (or handle used in compatible direction)
          const myDir = a.flow.source_id === nodeId ? 'source' : 'target'
          for (let offset = 1; offset < 8; offset++) {
            for (const sign of [1, -1]) {
              const tryIdx = ((currentIdx + sign * offset) % 8 + 8) % 8
              const existing = nodeAssignments.filter(x => x !== a).filter(x => {
                const idx = x.idA === nodeId ? x.handleIdxA : x.handleIdxB
                return idx === tryIdx
              })
              // Check all existing uses of this handle are compatible direction
              const allCompatible = existing.every(x => {
                const dir = x.flow.source_id === nodeId ? 'source' : 'target'
                return dir === myDir
              })
              if (allCompatible) {
                if (isA) a.handleIdxA = tryIdx
                else a.handleIdxB = tryIdx
                break
              }
            }
            // Check if we moved
            const newIdx = isA ? a.handleIdxA : a.handleIdxB
            if (newIdx !== currentIdx) break
          }
        }
      }
    }
  }

  resolveConflicts()

  // === PASS 3: Build result edges ===
  return assignments.map(a => {
    const { flow, idA, idB, handleIdxA, handleIdxB } = a
    const sourceHandle = flow.source_id === idA ? HANDLES[handleIdxA] : HANDLES[handleIdxB]
    const targetHandle = flow.target_id === idB ? HANDLES[handleIdxB] : HANDLES[handleIdxA]
    return {
      id: `flow-${flow.id}`,
      source: String(flow.source_id),
      target: String(flow.target_id),
      sourceHandle,
      targetHandle,
      type: 'data_flow',
      data: { label: flow.name, as_of: flow.as_of, srcHandle: sourceHandle, tgtHandle: targetHandle },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#00d4ff' },
    }
  })
}

export default function Canvas(props) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  )
}

function CanvasInner({ db, diagramId, onNodePositionChange, onNavigateDiagram, onShowSpec }) {
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

  const { fitView } = useReactFlow()
  useEffect(() => {
    // Small delay so nodes are rendered before fitting
    const t = setTimeout(() => fitView({ padding: 0.1, duration: 300 }), 50)
    return () => clearTimeout(t)
  }, [diagramId, fitView])

  const onNodeDragStop = useCallback((_event, node) => {
    onNodePositionChange(Number(node.id), node.position.x, node.position.y)
  }, [onNodePositionChange])

  const onNodeDoubleClick = useCallback((_event, node) => {
    if (node.type !== 'process') return
    const childDiagramId = node.data?.child_diagram_id
    if (childDiagramId) {
      onNavigateDiagram?.(childDiagramId)
    } else {
      onShowSpec?.(Number(node.id))
    }
  }, [onNavigateDiagram, onShowSpec])

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onNodeDoubleClick={onNodeDoubleClick}
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
