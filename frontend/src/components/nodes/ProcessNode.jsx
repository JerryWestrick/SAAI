import React from 'react'
import { Handle, Position } from '@xyflow/react'

const size = 80
const r = size - 2
const d = r * Math.SQRT1_2 // diagonal offset ≈ 55.15

const handles = [
  { id: 'top',          pos: Position.Top,    left: size,     top: size - r },
  { id: 'top-right',    pos: Position.Right,  left: size + d, top: size - d },
  { id: 'right',        pos: Position.Right,  left: size + r, top: size },
  { id: 'bottom-right', pos: Position.Right,  left: size + d, top: size + d },
  { id: 'bottom',       pos: Position.Bottom, left: size,     top: size + r },
  { id: 'bottom-left',  pos: Position.Left,   left: size - d, top: size + d },
  { id: 'left',         pos: Position.Left,   left: size - r, top: size },
  { id: 'top-left',     pos: Position.Left,   left: size - d, top: size - d },
]

export default function ProcessNode({ data }) {
  return (
    <div style={{ position: 'relative', width: size * 2, height: size * 2 }}>
      {handles.map(h => (
        <React.Fragment key={h.id}>
          <Handle type="target" position={h.pos} id={h.id}
            style={{ opacity: 0, left: h.left, top: h.top, transform: 'translate(-50%, -50%)' }} />
          <Handle type="source" position={h.pos} id={h.id}
            style={{ opacity: 0, left: h.left, top: h.top, transform: 'translate(-50%, -50%)' }} />
        </React.Fragment>
      ))}
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
        {(() => {
          const words = (data.label || '').split(' ')
          const lines = []
          let cur = ''
          for (const w of words) {
            const test = cur ? cur + ' ' + w : w
            if (test.length > 12 && cur) {
              lines.push(cur)
              cur = w
            } else {
              cur = test
            }
          }
          if (cur) lines.push(cur)
          const lineHeight = 18
          const baseY = (data.number ? size * 1.1 : size) - ((lines.length - 1) * lineHeight) / 2
          return (
            <text x={size} textAnchor="middle" dominantBaseline="middle" fill="#e0e0e0" fontSize={14} fontFamily="monospace">
              {lines.map((line, i) => (
                <tspan key={i} x={size} y={baseY + i * lineHeight}>{line}</tspan>
              ))}
            </text>
          )
        })()}
      </svg>
    </div>
  )
}
