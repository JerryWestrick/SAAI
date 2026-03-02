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

export default function DataStoreNode({ data }) {
  return (
    <div style={{ position: 'relative', minWidth: 160 }}>
      {handles.map(h => (
        <React.Fragment key={h.id}>
          <Handle type="target" position={h.pos} id={h.id}
            style={{ opacity: 0, left: h.left, top: h.top, transform: 'translate(-50%, -50%)' }} />
          <Handle type="source" position={h.pos} id={h.id}
            style={{ opacity: 0, left: h.left, top: h.top, transform: 'translate(-50%, -50%)' }} />
        </React.Fragment>
      ))}
      <svg width="100%" height={44}>
        <line x1={0} y1={0} x2="100%" y2={0} stroke="#00d4ff" strokeWidth={2} />
        <line x1={0} y1={42} x2="100%" y2={42} stroke="#00d4ff" strokeWidth={2} />
        {data.number && (
          <>
            <line x1={40} y1={0} x2={40} y2={42} stroke="#0f3460" strokeWidth={1} />
            <text x={20} y={26} textAnchor="middle" fill="#aaa" fontSize={12} fontFamily="monospace">
              {data.number}
            </text>
          </>
        )}
        <text x={data.number ? 100 : 80} y={26} textAnchor="middle" fill="#e0e0e0" fontSize={14} fontFamily="monospace">
          {data.label}
        </text>
      </svg>
    </div>
  )
}
