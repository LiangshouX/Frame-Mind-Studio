import { AgentWebSocketMessage, ConnectionStatus } from '@/types/agent'

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws/agent'

interface WebSocketHandlers {
  onMessage: (msg: AgentWebSocketMessage) => void
  onConnectionChange: (status: ConnectionStatus) => void
}

export function connectAgentWebSocket(
  sessionId: string,
  handlers: WebSocketHandlers
): { disconnect: () => void; isConnected: () => boolean } {
  let ws: WebSocket | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let reconnectDelay = 1000
  const maxDelay = 30_000
  let intentionalClose = false
  let connected = false

  function connect() {
    if (intentionalClose) return

    handlers.onConnectionChange('connecting')
    ws = new WebSocket(`${WS_BASE_URL}/${sessionId}`)

    ws.onopen = () => {
      connected = true
      reconnectDelay = 1000
      handlers.onConnectionChange('connected')
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as AgentWebSocketMessage
        handlers.onMessage(msg)
      } catch {
        console.warn('Failed to parse WebSocket message:', event.data)
      }
    }

    ws.onclose = () => {
      connected = false
      if (!intentionalClose) {
        handlers.onConnectionChange('disconnected')
        reconnectTimer = setTimeout(() => {
          reconnectDelay = Math.min(reconnectDelay * 2, maxDelay)
          connect()
        }, reconnectDelay)
      }
    }

    ws.onerror = () => {
      connected = false
      handlers.onConnectionChange('error')
    }
  }

  connect()

  return {
    disconnect: () => {
      intentionalClose = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      if (ws) ws.close()
      handlers.onConnectionChange('disconnected')
    },
    isConnected: () => connected,
  }
}
