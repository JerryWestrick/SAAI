import React from 'react'
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react'

export default function DataFlowEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, markerEnd }) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
  })

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
