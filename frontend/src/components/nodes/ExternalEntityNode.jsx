import React from 'react'
import { Handle, Position } from '@xyflow/react'

const hs = { opacity: 0 }

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
      <Handle type="target" position={Position.Top} id="top" style={hs} />
      <Handle type="source" position={Position.Top} id="top" style={hs} />
      <Handle type="target" position={Position.Right} id="right" style={hs} />
      <Handle type="source" position={Position.Right} id="right" style={hs} />
      <Handle type="target" position={Position.Bottom} id="bottom" style={hs} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={hs} />
      <Handle type="target" position={Position.Left} id="left" style={hs} />
      <Handle type="source" position={Position.Left} id="left" style={hs} />
      {data.label}
    </div>
  )
}
