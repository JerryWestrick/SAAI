import React from 'react'

const s = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#16213e',
    border: '2px solid #00d4ff',
    borderRadius: 6,
    minWidth: 500,
    maxWidth: 700,
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'monospace',
    color: '#e0e0e0',
    overflow: 'hidden',
  },
  header: {
    background: '#0f3460',
    padding: '10px 16px',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00d4ff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  close: {
    background: 'none',
    border: 'none',
    color: '#e0e0e0',
    fontSize: 18,
    cursor: 'pointer',
    padding: '0 4px',
  },
  ioSection: {
    display: 'flex',
    borderBottom: '1px solid #0f3460',
  },
  ioCol: {
    flex: 1,
    padding: '10px 16px',
  },
  ioLabel: {
    fontSize: 11,
    color: '#00d4ff',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  ioItem: {
    fontSize: 13,
    padding: '2px 0',
    color: '#e0e0e0',
  },
  ioAsOf: {
    fontSize: 10,
    color: '#ff9800',
    marginLeft: 6,
  },
  divider: {
    width: 1,
    background: '#0f3460',
  },
  specSection: {
    padding: '12px 16px',
    flex: 1,
    overflowY: 'auto',
  },
  specLabel: {
    fontSize: 11,
    color: '#00d4ff',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  specText: {
    fontSize: 13,
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap',
    color: '#e0e0e0',
  },
  empty: {
    color: '#666',
    fontStyle: 'italic',
    fontSize: 13,
  },
}

export default function MiniSpecModal({ node, flows, miniSpec, onClose }) {
  if (!node) return null

  const inputs = (flows || []).filter(f => f.target_id === node.id)
  const outputs = (flows || []).filter(f => f.source_id === node.id)

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={s.header}>
          <span>{node.number ? `${node.number} — ` : ''}{node.name}</span>
          <button style={s.close} onClick={onClose}>&times;</button>
        </div>

        {/* Inputs / Outputs */}
        <div style={s.ioSection}>
          <div style={s.ioCol}>
            <div style={s.ioLabel}>Inputs</div>
            {inputs.length === 0 && <div style={s.empty}>None</div>}
            {inputs.map(f => (
              <div key={f.id} style={s.ioItem}>
                &rarr; {f.name}
                {f.as_of && <span style={s.ioAsOf}>(as of {f.as_of})</span>}
              </div>
            ))}
          </div>
          <div style={s.divider} />
          <div style={s.ioCol}>
            <div style={s.ioLabel}>Outputs</div>
            {outputs.length === 0 && <div style={s.empty}>None</div>}
            {outputs.map(f => (
              <div key={f.id} style={s.ioItem}>
                {f.name} &rarr;
                {f.as_of && <span style={s.ioAsOf}>(as of {f.as_of})</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Spec text */}
        <div style={s.specSection}>
          <div style={s.specLabel}>Specification</div>
          {miniSpec?.spec_text ? (
            <div style={s.specText}>{miniSpec.spec_text}</div>
          ) : (
            <div style={s.empty}>No mini-spec defined yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}
