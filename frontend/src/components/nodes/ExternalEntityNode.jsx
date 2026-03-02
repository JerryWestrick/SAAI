import React from 'react'
import { Handle, Position } from '@xyflow/react'

const handles = [
  { id: 'top',          pos: Position.Top,    left: '50%',  top: 0 },
  { id: 'top-right',    pos: Position.Right,  left: '100%', top: 0 },
  { id: 'right',        pos: Position.Right,  left: '100%', top: '50%' },
  { id: 'bottom-right', pos: Position.Right,  left: '100%', top: '100%' },
  { id: 'bottom',       pos: Position.Bottom, left: '50%',  top: '100%' },
  { id: 'bottom-left',  pos: Position.Left,   left: 0,      top: '100%' },
  { id: 'left',         pos: Position.Left,   left: 0,      top: '50%' },
  { id: 'top-left',     pos: Position.Left,   left: 0,      top: 0 },
]

export default function ExternalEntityNode({ data }) {
  return (
    <div
      style={{
        padding: '12px 20px',
        border: '2px solid #00d4ff',
        background: '#16213e',
        color: '#e0e0e0',
        fontFamily: 'monospace',
        fontSize: 14,
        textAlign: 'center',
        minWidth: 100,
      }}
    >
      {handles.map(h => (
        <React.Fragment key={h.id}>
          <Handle type="target" position={h.pos} id={h.id}
            style={{ opacity: 0, left: h.left, top: h.top, transform: 'translate(-50%, -50%)' }} />
          <Handle type="source" position={h.pos} id={h.id}
            style={{ opacity: 0, left: h.left, top: h.top, transform: 'translate(-50%, -50%)' }} />
        </React.Fragment>
      ))}
      {data.label}
    </div>
  )
}
