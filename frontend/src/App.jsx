import React from 'react'
import useStore from './hooks/useStore'
import { computeLayout } from './hooks/useAutoLayout'
import Canvas from './components/Canvas'
import MiniSpecModal from './components/MiniSpecModal'
import DataStoreModal from './components/DataStoreModal'
import EntityActionsModal from './components/EntityActionsModal'

const styles = {
  app: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#1a1a2e',
    fontFamily: 'monospace',
    color: '#e0e0e0',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '8px 16px',
    borderBottom: '1px solid #0f3460',
    flexShrink: 0,
  },
  title: {
    color: '#00d4ff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  select: {
    background: '#16213e',
    color: '#e0e0e0',
    border: '1px solid #0f3460',
    padding: '4px 8px',
    fontFamily: 'monospace',
    fontSize: 13,
  },
  status: {
    fontSize: 11,
    padding: '2px 8px',
    borderRadius: 3,
  },
  connected: {
    background: '#0a3d0a',
    color: '#4caf50',
  },
  disconnected: {
    background: '#3d0a0a',
    color: '#f44336',
  },
  canvas: {
    flex: 1,
    minHeight: 0,
  },
  button: {
    background: '#16213e',
    color: '#00d4ff',
    border: '1px solid #0f3460',
    padding: '4px 12px',
    fontFamily: 'monospace',
    fontSize: 13,
    cursor: 'pointer',
  },
  empty: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#666',
    fontSize: 14,
  },
}

export default function App() {
  const { db, connected, updateNodePosition, updateFlowLabelOffset, batchUpdateNodePositions } = useStore()
  const [projectId, setProjectId] = React.useState(null)
  const [diagramId, setDiagramId] = React.useState(null)
  const [history, setHistory] = React.useState([]) // breadcrumb stack of diagram IDs
  const [specNodeId, setSpecNodeId] = React.useState(null) // node ID for mini-spec modal
  const [ddNodeId, setDdNodeId] = React.useState(null) // node ID for data store DD modal
  const [entityNodeId, setEntityNodeId] = React.useState(null) // node ID for entity actions modal
  const [ddFlowId, setDdFlowId] = React.useState(null) // flow ID for flow DD modal

  const projects = db.projects || []
  const allDiagrams = db.diagrams || []
  const diagrams = projectId ? allDiagrams.filter(d => d.project_id === projectId) : allDiagrams

  // Auto-select first project
  React.useEffect(() => {
    if (projectId === null && projects.length > 0) {
      setProjectId(projects[0].id)
    }
  }, [projects, projectId])

  // Auto-select first diagram when project changes
  React.useEffect(() => {
    if (diagrams.length > 0 && !diagrams.find(d => d.id === diagramId)) {
      setDiagramId(diagrams[0].id)
      setHistory([])
    }
  }, [diagrams, diagramId])

  const navigateToDiagram = React.useCallback((targetId) => {
    setHistory(prev => [...prev, diagramId])
    setDiagramId(targetId)
  }, [diagramId])

  const navigateBack = React.useCallback(() => {
    setHistory(prev => {
      const next = [...prev]
      const parentId = next.pop()
      if (parentId != null) setDiagramId(parentId)
      return next
    })
  }, [])

  const handleRelayout = async () => {
    const nodes = (db.nodes || []).filter(n => n.diagram_id === diagramId)
    const flows = (db.data_flows || []).filter(f => f.diagram_id === diagramId)
    if (nodes.length === 0) return
    const positions = computeLayout(nodes, flows)
    await batchUpdateNodePositions(positions)
  }

  return (
    <div style={styles.app}>
      <div style={styles.header}>
        <span style={styles.title}>SAAI</span>
        <select
          style={styles.select}
          value={projectId || ''}
          onChange={e => { setProjectId(Number(e.target.value)); setDiagramId(null); setHistory([]) }}
        >
          <option value="" disabled>Select project...</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          style={styles.select}
          value={diagramId || ''}
          onChange={e => { setDiagramId(Number(e.target.value)); setHistory([]) }}
        >
          <option value="" disabled>Select diagram...</option>
          {diagrams.map(d => (
            <option key={d.id} value={d.id}>
              {d.name} (Level {d.level})
            </option>
          ))}
        </select>
        {history.length > 0 && (
          <button style={styles.button} onClick={navigateBack}>&larr; Back</button>
        )}
        {diagramId && (
          <button style={styles.button} onClick={handleRelayout}>Re-layout</button>
        )}
        <span style={{ ...styles.status, ...(connected ? styles.connected : styles.disconnected) }}>
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
      {diagramId ? (
        <div style={styles.canvas}>
          <Canvas db={db} diagramId={diagramId} onNodePositionChange={updateNodePosition} onNavigateDiagram={navigateToDiagram} onShowSpec={setSpecNodeId} onShowDD={setDdNodeId} onShowEntity={setEntityNodeId} onShowFlowDD={setDdFlowId} updateFlowLabelOffset={updateFlowLabelOffset} />
        </div>
      ) : (
        <div style={styles.empty}>
          {diagrams.length === 0 ? 'No diagrams yet. Use the CLI to create one.' : 'Select a diagram.'}
        </div>
      )}
      {specNodeId != null && (() => {
        const node = (db.nodes || []).find(n => n.id === specNodeId)
        const flows = (db.data_flows || []).filter(f => f.diagram_id === diagramId)
        const miniSpec = (db.mini_specs || []).find(m => m.node_id === specNodeId)
        return (
          <MiniSpecModal
            node={node}
            flows={flows}
            miniSpec={miniSpec}
            flowTraits={db.flow_traits || []}
            traits={db.traits || []}
            db={db}
            onClose={() => setSpecNodeId(null)}
          />
        )
      })()}
      {ddNodeId != null && (() => {
        const node = (db.nodes || []).find(n => n.id === ddNodeId)
        return node ? (
          <DataStoreModal
            node={node}
            db={db}
            onClose={() => setDdNodeId(null)}
          />
        ) : null
      })()}
      {entityNodeId != null && (() => {
        const node = (db.nodes || []).find(n => n.id === entityNodeId)
        const flows = (db.data_flows || []).filter(f => f.diagram_id === diagramId)
        const nodeMap = {}
        for (const n of (db.nodes || []).filter(n => n.diagram_id === diagramId)) nodeMap[n.id] = n
        return node ? (
          <EntityActionsModal
            node={node}
            flows={flows}
            nodeMap={nodeMap}
            onClose={() => setEntityNodeId(null)}
          />
        ) : null
      })()}
      {ddFlowId != null && (() => {
        const flow = (db.data_flows || []).find(f => f.id === ddFlowId)
        if (!flow) return null
        // Pass flow as a pseudo-node (DataStoreModal uses name + diagram_id)
        return (
          <DataStoreModal
            node={{ name: flow.name, diagram_id: flow.diagram_id }}
            db={db}
            onClose={() => setDdFlowId(null)}
          />
        )
      })()}
    </div>
  )
}
