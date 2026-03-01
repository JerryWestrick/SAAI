import React from 'react'
import { Handle, Position } from '@xyflow/react'

const size = 80

export default function ProcessNode({ data }) {
  return (
    <div style={{ position: 'relative', width: size * 2, height: size * 2 }}>
      <Handle type="target" position={Position.Left} style={{ top: '50%' }} />
      <svg width={size * 2} height={size * 2}>
        <circle
          cx={size}
          cy={size}
          r={size - 2}
          fill="#16213e"
          stroke="#00d4ff"
          strokeWidth={2}
        />
        {data.number && (
          <>
            <line x1={20} y1={size * 0.6} x2={size * 2 - 20} y2={size * 0.6} stroke="#0f3460" strokeWidth={1} />
            <text x={size} y={size * 0.45} textAnchor="middle" fill="#aaa" fontSize={12}>
              {data.number}
            </text>
          </>
        )}
        <text x={size} y={data.number ? size * 1.1 : size} textAnchor="middle" dominantBaseline="middle" fill="#e0e0e0" fontSize={14} fontFamily="monospace">
          {data.label}
        </text>
      </svg>
      <Handle type="source" position={Position.Right} style={{ top: '50%' }} />
    </div>
  )
}
