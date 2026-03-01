import React from 'react'
import { Handle, Position } from '@xyflow/react'

export default function DataStoreNode({ data }) {
  return (
    <div style={{ position: 'relative', minWidth: 160 }}>
      <Handle type="target" position={Position.Left} style={{ top: '50%' }} />
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
      <Handle type="source" position={Position.Right} style={{ top: '50%' }} />
    </div>
  )
}
