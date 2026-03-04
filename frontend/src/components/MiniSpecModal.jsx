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
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
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
  ddSection: {
    padding: '12px 16px',
    borderTop: '1px solid #0f3460',
    overflowY: 'auto',
  },
  ddEntry: {
    marginBottom: 12,
  },
  ddName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#00d4ff',
    marginBottom: 2,
  },
  ddDef: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 6,
    fontStyle: 'italic',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 12,
  },
  th: {
    textAlign: 'left',
    padding: '4px 8px',
    borderBottom: '1px solid #0f3460',
    color: '#00d4ff',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  td: {
    padding: '3px 8px',
    borderBottom: '1px solid #0f346033',
    color: '#e0e0e0',
  },
}

const badgeColors = {
  adds:     { bg: '#0a3d0a', border: '#2ecc40', color: '#2ecc40', prefix: '+' },
  removes:  { bg: '#3d0a0a', border: '#ff4136', color: '#ff4136', prefix: '−' },
  requires: { bg: '#0a1a3d', border: '#4a9eff', color: '#4a9eff', prefix: '?' },
}

function TraitBadge({ modifier, traitName }) {
  const c = badgeColors[modifier]
  if (!c) return null
  return (
    <span style={{
      display: 'inline-block',
      fontSize: 10,
      padding: '1px 5px',
      borderRadius: 3,
      background: c.bg,
      border: `1px solid ${c.border}`,
      color: c.color,
      fontFamily: 'monospace',
      whiteSpace: 'nowrap',
    }}>
      {c.prefix}{traitName}
    </span>
  )
}

function FlowTraitBadges({ flowId, flowTraits, traits }) {
  const fts = flowTraits.filter(ft => ft.flow_id === flowId)
  if (fts.length === 0) return null
  return (
    <>
      {fts.map(ft => {
        const trait = traits.find(t => t.id === ft.trait_id)
        if (!trait) return null
        return <TraitBadge key={ft.id} modifier={ft.modifier} traitName={trait.name} />
      })}
    </>
  )
}

export default function MiniSpecModal({ node, flows, miniSpec, flowTraits = [], traits = [], db = {}, onClose }) {
  if (!node) return null

  const inputs = (flows || []).filter(f => f.target_id === node.id)
  const outputs = (flows || []).filter(f => f.source_id === node.id)

  // Resolve DD entries for all flows (deduped)
  const diagram = (db.diagrams || []).find(d => d.id === node.diagram_id)
  const projectId = diagram?.project_id
  const allFlows = [...inputs, ...outputs]
  const seenDdIds = new Set()
  const ddEntries = []
  for (const f of allFlows) {
    const dd = findDDEntry(f.name, db.data_dictionary || [], projectId)
    if (dd && !seenDdIds.has(dd.id)) {
      seenDdIds.add(dd.id)
      const fields = (db.dd_fields || [])
        .filter(fld => fld.dd_id === dd.id)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      ddEntries.push({ dd, fields })
    }
  }

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
                <span>&rarr; {f.name}</span>
                {f.as_of && <span style={s.ioAsOf}>(as of {f.as_of})</span>}
                <FlowTraitBadges flowId={f.id} flowTraits={flowTraits} traits={traits} />
              </div>
            ))}
          </div>
          <div style={s.divider} />
          <div style={s.ioCol}>
            <div style={s.ioLabel}>Outputs</div>
            {outputs.length === 0 && <div style={s.empty}>None</div>}
            {outputs.map(f => (
              <div key={f.id} style={s.ioItem}>
                <span>{f.name} &rarr;</span>
                {f.as_of && <span style={s.ioAsOf}>(as of {f.as_of})</span>}
                <FlowTraitBadges flowId={f.id} flowTraits={flowTraits} traits={traits} />
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

        {/* Data Structures from DD */}
        {ddEntries.length > 0 && (
          <div style={s.ddSection}>
            <div style={s.specLabel}>Data Structures</div>
            {ddEntries.map(({ dd, fields }) => (
              <div key={dd.id} style={s.ddEntry}>
                <div style={s.ddName}>{dd.name}</div>
                {dd.definition && <div style={s.ddDef}>{dd.definition}</div>}
                {fields.length > 0 && (
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
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
