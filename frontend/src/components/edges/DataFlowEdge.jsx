import React, { useState, useRef, useCallback, useEffect } from 'react'
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

// Compute bezier path + label position.
// If labelAbsX/Y provided, adjust control points so curve passes through that point at t=0.5.
function computeBezier(sx, sy, tx, ty, srcHandle, tgtHandle, labelAbsX, labelAbsY) {
  const dist = Math.sqrt((tx - sx) ** 2 + (ty - sy) ** 2)
  const offset = Math.max(dist * 0.35, 40)

  const sa = HANDLE_ANGLES[srcHandle] ?? 0
  const ta = HANDLE_ANGLES[tgtHandle] ?? Math.PI

  const cx1 = sx + Math.cos(sa) * offset
  const cy1 = sy + Math.sin(sa) * offset
  const cx2 = tx + Math.cos(ta) * offset
  const cy2 = ty + Math.sin(ta) * offset

  if (labelAbsX == null) {
    // No offset — natural curve
    const lx = bezierPoint(0.5, sx, cx1, cx2, tx)
    const ly = bezierPoint(0.5, sy, cy1, cy2, ty)
    const path = `M ${sx} ${sy} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${tx} ${ty}`
    return [path, lx, ly]
  }

  // Adjust control points so B(0.5) = (labelAbsX, labelAbsY)
  // B(0.5) = (S + 3C1 + 3C2 + T) / 8
  // => 3(C1'+C2') = 8*Label - S - T
  // delta per control point = [(8*L - S - T)/3 - (C1+C2)] / 2
  const deltaX = ((8 * labelAbsX - sx - tx) / 3 - (cx1 + cx2)) / 2
  const deltaY = ((8 * labelAbsY - sy - ty) / 3 - (cy1 + cy2)) / 2

  const path = `M ${sx} ${sy} C ${cx1 + deltaX} ${cy1 + deltaY}, ${cx2 + deltaX} ${cy2 + deltaY}, ${tx} ${ty}`
  return [path, labelAbsX, labelAbsY]
}

function getViewportScale() {
  const viewport = document.querySelector('.react-flow__viewport')
  if (!viewport) return 1
  const match = viewport.style.transform?.match(/scale\(([^)]+)\)/)
  return match ? parseFloat(match[1]) : 1
}

const badgeColors = {
  adds:     { bg: '#0a3d0a', border: '#2ecc40', color: '#2ecc40', prefix: '+' },
  removes:  { bg: '#3d0a0a', border: '#ff4136', color: '#ff4136', prefix: '−' },
  requires: { bg: '#0a1a3d', border: '#4a9eff', color: '#4a9eff', prefix: '?' },
}

export default function DataFlowEdge({ id, sourceX, sourceY, targetX, targetY, data, markerEnd }) {
  const [hovered, setHovered] = useState(false)
  const [localDx, setLocalDx] = useState(data?.label_dx || 0)
  const [localDy, setLocalDy] = useState(data?.label_dy || 0)
  const draggingRef = useRef(false)
  const dragStateRef = useRef(null)

  // Sync from props when not dragging
  useEffect(() => {
    if (!draggingRef.current) {
      setLocalDx(data?.label_dx || 0)
      setLocalDy(data?.label_dy || 0)
    }
  }, [data?.label_dx, data?.label_dy])

  // Node-center midpoint (stable base for offset)
  const midX = ((data?.srcCenterX ?? sourceX) + (data?.tgtCenterX ?? targetX)) / 2
  const midY = ((data?.srcCenterY ?? sourceY) + (data?.tgtCenterY ?? targetY)) / 2

  const hasOffset = localDx !== 0 || localDy !== 0
  const labelAbsX = hasOffset ? midX + localDx : null
  const labelAbsY = hasOffset ? midY + localDy : null

  const [edgePath, labelX, labelY] = computeBezier(
    sourceX, sourceY, targetX, targetY,
    data?.srcHandle, data?.tgtHandle,
    labelAbsX, labelAbsY
  )

  const onMouseDown = useCallback((e) => {
    if (e.button !== 0) return
    e.stopPropagation()
    e.preventDefault()
    draggingRef.current = true
    const scale = getViewportScale()
    // Capture current visual label position so drag starts with no jump
    dragStateRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startLabelX: labelX,
      startLabelY: labelY,
      midX, midY,
      scale,
    }

    const onMouseMove = (ev) => {
      const st = dragStateRef.current
      if (!st) return
      const newLabelX = st.startLabelX + (ev.clientX - st.mouseX) / st.scale
      const newLabelY = st.startLabelY + (ev.clientY - st.mouseY) / st.scale
      // Store as offset from node-center midpoint
      const newDx = newLabelX - st.midX
      const newDy = newLabelY - st.midY
      setLocalDx(newDx)
      setLocalDy(newDy)
      st.lastDx = newDx
      st.lastDy = newDy
    }

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      draggingRef.current = false
      const st = dragStateRef.current
      if (st && data?.updateFlowLabelOffset && data?.flowId) {
        const finalDx = st.lastDx ?? localDx
        const finalDy = st.lastDy ?? localDy
        data.updateFlowLabelOffset(data.flowId, finalDx, finalDy)
      }
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [labelX, labelY, midX, midY, localDx, localDy, data])

  // Resolve trait badges for this flow
  const flowTraits = data?.flowTraits || []
  const traits = data?.traits || []
  const myTraits = flowTraits.filter(ft => ft.flow_id === data?.flowId)
  const resolvedTraits = myTraits.map(ft => {
    const trait = traits.find(t => t.id === ft.trait_id)
    return trait ? { ...ft, traitName: trait.name } : null
  }).filter(Boolean)

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
            maxWidth: 150,
            textAlign: 'center',
            whiteSpace: 'normal',
            wordBreak: 'keep-all',
            lineHeight: '1.3',
            overflow: 'visible',
            transition: draggingRef.current ? 'none' : 'background 0.15s, border 0.15s, box-shadow 0.15s',
            cursor: 'grab',
            userSelect: 'none',
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => { if (!draggingRef.current) setHovered(false) }}
          onMouseDown={onMouseDown}
          onDoubleClick={(e) => {
            e.stopPropagation()
            data?.onShowFlowDD?.(data.flowId)
          }}
        >
          {data?.label}
          {data?.as_of && (
            <div style={{ fontSize: 9, color: '#ff9800', marginTop: 1 }}>
              as of {data.as_of}
            </div>
          )}
          {hovered && resolvedTraits.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 3, justifyContent: 'center' }}>
              {resolvedTraits.map(ft => {
                const c = badgeColors[ft.modifier]
                if (!c) return null
                return (
                  <span key={ft.id} style={{
                    display: 'inline-block',
                    fontSize: 9,
                    padding: '0px 4px',
                    borderRadius: 2,
                    background: c.bg,
                    border: `1px solid ${c.border}`,
                    color: c.color,
                    fontFamily: 'monospace',
                    whiteSpace: 'nowrap',
                  }}>
                    {c.prefix}{ft.traitName}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
