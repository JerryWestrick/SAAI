import { useState, useEffect, useRef, useCallback } from 'react'

export default function useStore() {
  const [db, setDb] = useState({})
  const [connected, setConnected] = useState(false)
  const wsRef = useRef(null)

  const applyChange = useCallback((change) => {
    const { table, action, row } = change
    setDb(prev => {
      const rows = prev[table] ? [...prev[table]] : []
      let updated
      if (action === 'INSERT') {
        updated = [...rows, row]
      } else if (action === 'UPDATE') {
        const idx = rows.findIndex(r => r.id === row.id)
        if (idx >= 0) {
          updated = [...rows]
          updated[idx] = row
        } else {
          updated = [...rows, row]
        }
      } else if (action === 'DELETE') {
        updated = rows.filter(r => r.id !== row.id)
      } else {
        return prev
      }
      return { ...prev, [table]: updated }
    })
  }, [])

  useEffect(() => {
    let ws
    let retryTimer

    function connect() {
      ws = new WebSocket(`ws://${location.host}/ws`)
      wsRef.current = ws

      ws.onopen = () => setConnected(true)

      ws.onclose = () => {
        setConnected(false)
        retryTimer = setTimeout(connect, 2000)
      }

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data)
        if (msg.type === 'init') {
          setDb(msg.data)
        } else if (msg.type === 'change') {
          applyChange(msg.data)
        }
      }
    }

    connect()
    return () => {
      clearTimeout(retryTimer)
      ws?.close()
    }
  }, [applyChange])

  const updateNodePosition = useCallback(async (nodeId, x, y) => {
    await fetch(`/api/nodes/${nodeId}/position`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ x, y }),
    })
  }, [])

  return { db, connected, updateNodePosition }
}
