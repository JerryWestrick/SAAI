import React, { useState } from 'react'
import { BaseEdge, EdgeLabelRenderer } from '@xyflow/react'

const HANDLE_ANGLES = {
  top:          -Math.PI / 2,
  'top-right':  -Math.PI / 4,
  right:         0,
  'bottom-right': Math.PI / 4,
  bottom:        Math.PI / 2,
  'bottom-left': 3 * Math.PI / 4,
  left:          Math.PI,
  'top-left':   -3 * Math.PI / 4,
}

function bezierPoint(t, p0, p1, p2, p3) {
  const u = 1 - t
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3
}

function computeBezier(sx, sy, tx, ty, srcHandle, tgtHandle, t) {
  const dist = Math.sqrt((tx - sx) ** 2 + (ty - sy) ** 2)
  const offset = Math.max(dist * 0.35, 40)

  const sa = HANDLE_ANGLES[srcHandle] ?? 0
  const ta = HANDLE_ANGLES[tgtHandle] ?? Math.PI

  const cx1 = sx + Math.cos(sa) * offset
  const cy1 = sy + Math.sin(sa) * offset
  const cx2 = tx + Math.cos(ta) * offset
  const cy2 = ty + Math.sin(ta) * offset

  const path = `M ${sx} ${sy} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${tx} ${ty}`
  const labelX = bezierPoint(t, sx, cx1, cx2, tx)
  const labelY = bezierPoint(t, sy, cy1, cy2, ty)

  return [path, labelX, labelY]
}

export default function DataFlowEdge({ id, sourceX, sourceY, targetX, targetY, data, markerEnd }) {
  const [hovered, setHovered] = useState(false)
  const [edgePath, labelX, labelY] = computeBezier(
    sourceX, sourceY, targetX, targetY,
    data?.srcHandle, data?.tgtHandle, 0.5
  )

  return (
    <>
      {/* Invisible wider path for easier hover detection */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={15}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: hovered ? '#66e5ff' : '#00d4ff',
          strokeWidth: hovered ? 3 : 1.5,
          filter: hovered ? 'drop-shadow(0 0 4px #00d4ff)' : 'none',
          transition: 'stroke 0.15s, stroke-width 0.15s',
          pointerEvents: 'none',
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
            background: hovered ? '#1e2a4a' : '#1a1a2e',
            padding: '2px 6px',
            borderRadius: 3,
            fontSize: 11,
            fontFamily: 'monospace',
            color: hovered ? '#ffffff' : '#e0e0e0',
            border: `1px solid ${hovered ? '#00d4ff' : '#0f3460'}`,
            boxShadow: hovered ? '0 0 8px #00d4ff' : 'none',
            maxWidth: 120,
            textAlign: 'center',
            whiteSpace: 'normal',
            wordBreak: 'keep-all',
            lineHeight: '1.3',
            overflow: 'visible',
            transition: 'background 0.15s, border 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {data?.label}
          {data?.as_of && (
            <div style={{ fontSize: 9, color: '#ff9800', marginTop: 1 }}>
              as of {data.as_of}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
