import React from 'react'
import useStore from './hooks/useStore'
import { computeLayout } from './hooks/useAutoLayout'
import Canvas from './components/Canvas'
import MiniSpecModal from './components/MiniSpecModal'

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
  const { db, connected, updateNodePosition, batchUpdateNodePositions } = useStore()
  const [diagramId, setDiagramId] = React.useState(null)
  const [history, setHistory] = React.useState([]) // breadcrumb stack of diagram IDs
  const [specNodeId, setSpecNodeId] = React.useState(null) // node ID for mini-spec modal

  const diagrams = db.diagrams || []

  // Auto-select first diagram
  React.useEffect(() => {
    if (diagramId === null && diagrams.length > 0) {
      setDiagramId(diagrams[0].id)
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
          <Canvas db={db} diagramId={diagramId} onNodePositionChange={updateNodePosition} onNavigateDiagram={navigateToDiagram} onShowSpec={setSpecNodeId} />
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
            onClose={() => setSpecNodeId(null)}
          />
        )
      })()}
    </div>
  )
}
