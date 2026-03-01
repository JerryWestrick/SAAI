import React from 'react'
import useStore from './hooks/useStore'
import Canvas from './components/Canvas'

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
  const { db, connected, updateNodePosition } = useStore()
  const [diagramId, setDiagramId] = React.useState(null)

  const diagrams = db.diagrams || []

  // Auto-select first diagram
  React.useEffect(() => {
    if (diagramId === null && diagrams.length > 0) {
      setDiagramId(diagrams[0].id)
    }
  }, [diagrams, diagramId])

  return (
    <div style={styles.app}>
      <div style={styles.header}>
        <span style={styles.title}>SAAI</span>
        <select
          style={styles.select}
          value={diagramId || ''}
          onChange={e => setDiagramId(Number(e.target.value))}
        >
          <option value="" disabled>Select diagram...</option>
          {diagrams.map(d => (
            <option key={d.id} value={d.id}>
              {d.name} (Level {d.level})
            </option>
          ))}
        </select>
        <span style={{ ...styles.status, ...(connected ? styles.connected : styles.disconnected) }}>
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
      {diagramId ? (
        <div style={styles.canvas}>
          <Canvas db={db} diagramId={diagramId} onNodePositionChange={updateNodePosition} />
        </div>
      ) : (
        <div style={styles.empty}>
          {diagrams.length === 0 ? 'No diagrams yet. Use the CLI to create one.' : 'Select a diagram.'}
        </div>
      )}
    </div>
  )
}
