import React from 'react'
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react'

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

function customBezier(sx, sy, tx, ty, srcHandle, tgtHandle) {
  const dist = Math.sqrt((tx - sx) ** 2 + (ty - sy) ** 2)
  const offset = Math.max(dist * 0.35, 40)

  const sa = HANDLE_ANGLES[srcHandle] ?? 0
  const ta = HANDLE_ANGLES[tgtHandle] ?? Math.PI

  const cx1 = sx + Math.cos(sa) * offset
  const cy1 = sy + Math.sin(sa) * offset
  const cx2 = tx + Math.cos(ta) * offset
  const cy2 = ty + Math.sin(ta) * offset

  const path = `M ${sx} ${sy} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${tx} ${ty}`
  const labelX = 0.125 * sx + 0.375 * cx1 + 0.375 * cx2 + 0.125 * tx
  const labelY = 0.125 * sy + 0.375 * cy1 + 0.375 * cy2 + 0.125 * ty

  return [path, labelX, labelY]
}

export default function DataFlowEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, markerEnd }) {
  const hasDiagonal = data?.srcHandle?.includes('-') || data?.tgtHandle?.includes('-')

  let edgePath, labelX, labelY
  if (hasDiagonal) {
    [edgePath, labelX, labelY] = customBezier(sourceX, sourceY, targetX, targetY, data.srcHandle, data.tgtHandle)
  } else {
    [edgePath, labelX, labelY] = getBezierPath({
      sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
    })
  }

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={{ stroke: '#00d4ff', strokeWidth: 1.5 }} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
            background: '#1a1a2e',
            padding: '2px 6px',
            borderRadius: 3,
            fontSize: 11,
            fontFamily: 'monospace',
            color: '#e0e0e0',
            border: '1px solid #0f3460',
          }}
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
