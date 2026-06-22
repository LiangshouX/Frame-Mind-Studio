import { AgentWebSocketMessage, ConnectionStatus } from '@/types/agent'

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws/agent'
const MAX_RECONNECT_ATTEMPTS = 5
const INITIAL_DELAY = 1000
const MAX_DELAY = 16000

interface WebSocketHandlers {
  onMessage: (msg: AgentWebSocketMessage) => void
  onConnectionChange: (status: ConnectionStatus) => void
}

export function connectAgentWebSocket(
  sessionId: string,
  handlers: WebSocketHandlers
): { disconnect: () => void; isConnected: () => boolean; reconnect: () => void } {
  let ws: WebSocket | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let reconnectDelay = INITIAL_DELAY
  let reconnectAttempts = 0
  let intentionalClose = false
  let connected = false

  function connect() {
    if (intentionalClose) return

    handlers.onConnectionChange('connecting')
    ws = new WebSocket(`${WS_BASE_URL}/${sessionId}`)

    ws.onopen = () => {
      connected = true
      reconnectDelay = INITIAL_DELAY
      reconnectAttempts = 0
      handlers.onConnectionChange('connected')
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as AgentWebSocketMessage
        handlers.onMessage(msg)
      } catch {
        console.warn('WebSocket 消息解析失败:', event.data)
      }
    }

    ws.onclose = () => {
      connected = false
      if (!intentionalClose) {
        handlers.onConnectionChange('disconnected')
        scheduleReconnect()
      }
    }

    ws.onerror = () => {
      connected = false
      // 错误时也尝试重连
      if (!intentionalClose) {
        handlers.onConnectionChange('disconnected')
        scheduleReconnect()
      }
    }
  }

  function scheduleReconnect() {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      // 达到最大重试次数，停止自动重连
      handlers.onConnectionChange('error')
      return
    }

    reconnectTimer = setTimeout(() => {
      reconnectAttempts++
      reconnectDelay = Math.min(reconnectDelay * 2, MAX_DELAY)
      connect()
    }, reconnectDelay)
  }

  function reconnect() {
    // 手动重连：重置重试计数
    if (reconnectTimer) clearTimeout(reconnectTimer)
    reconnectAttempts = 0
    reconnectDelay = INITIAL_DELAY
    if (ws) {
      ws.close()
      ws = null
    }
    connect()
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
    reconnect,
  }
}
