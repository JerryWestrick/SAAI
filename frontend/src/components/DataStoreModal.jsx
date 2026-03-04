import React from 'react'
import { findDDEntry } from '../utils/ddLookup'

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
  section: {
    padding: '12px 16px',
    flex: 1,
    overflowY: 'auto',
  },
  sectionLabel: {
    fontSize: 11,
    color: '#00d4ff',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  definition: {
    fontSize: 13,
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap',
    color: '#e0e0e0',
    marginBottom: 12,
  },
  empty: {
    color: '#666',
    fontStyle: 'italic',
    fontSize: 13,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 12,
  },
  th: {
    textAlign: 'left',
    padding: '6px 8px',
    borderBottom: '1px solid #0f3460',
    color: '#00d4ff',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  td: {
    padding: '5px 8px',
    borderBottom: '1px solid #0f346033',
    color: '#e0e0e0',
  },
}

export default function DataStoreModal({ node, db, onClose }) {
  if (!node) return null

  // Find the diagram to get project_id
  const diagram = (db.diagrams || []).find(d => d.id === node.diagram_id)
  const projectId = diagram?.project_id

  // Match data_dictionary entry by name (fuzzy: plural→singular, prefix)
  const ddEntry = findDDEntry(node.name, db.data_dictionary || [], projectId)

  // Get fields for the DD entry, sorted by sort_order
  const fields = ddEntry
    ? (db.dd_fields || [])
        .filter(f => f.dd_id === ddEntry.id)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    : []

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <div style={s.header}>
          <span>{node.number ? `${node.number} — ` : ''}{node.name}</span>
          <button style={s.close} onClick={onClose}>&times;</button>
        </div>

        <div style={s.section}>
          <div style={s.sectionLabel}>Definition</div>
          {ddEntry?.definition ? (
            <div style={s.definition}>{ddEntry.definition}</div>
          ) : (
            <div style={s.empty}>No data dictionary entry found.</div>
          )}

          {fields.length > 0 && (
            <>
              <div style={{ ...s.sectionLabel, marginTop: 8 }}>Fields</div>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Name</th>
                    <th style={s.th}>Type</th>
                    <th style={s.th}>Reference</th>
                    <th style={s.th}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map(f => (
                    <tr key={f.id}>
                      <td style={s.td}>{f.name}</td>
                      <td style={s.td}>{f.field_type || ''}</td>
                      <td style={s.td}>{f.reference_dd || ''}</td>
                      <td style={s.td}>{f.description || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
