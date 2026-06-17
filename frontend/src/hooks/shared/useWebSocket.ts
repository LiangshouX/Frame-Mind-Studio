'use client'
import { useEffect, useRef, useCallback } from 'react'
import type { WsMessage } from '@/types/agent'

export function useWebSocket(url: string | null, onMessage: (msg: WsMessage) => void) {
  const wsRef = useRef<WebSocket | null>(null)

  const connect = useCallback(() => {
    if (!url) return
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as WsMessage
        onMessage(msg)
      } catch { /* ignore non-JSON */ }
    }

    ws.onerror = () => {
      onMessage({ type: 'error', data: { message: 'WebSocket 连接错误' } })
    }

    ws.onclose = () => { /* auto-reconnect handled by component */ }
  }, [url, onMessage])

  useEffect(() => {
    connect()
    return () => { wsRef.current?.close() }
  }, [connect])

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }, [])

  return { send }
}
