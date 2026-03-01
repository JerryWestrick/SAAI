import React from 'react'
import { Handle, Position } from '@xyflow/react'

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
      <Handle type="target" position={Position.Left} />
      {data.label}
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
