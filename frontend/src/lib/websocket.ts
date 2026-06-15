import type { WebSocketMessage } from '@/types'

type MessageHandler = (message: WebSocketMessage) => void
type ErrorHandler = (error: Event) => void
type CloseHandler = (event: CloseEvent) => void

export class AgentWebSocket {
  private ws: WebSocket | null = null
  private sessionId: string
  private onMessage: MessageHandler
  private onError: ErrorHandler
  private onClose: CloseHandler
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectTimeout: NodeJS.Timeout | null = null
  private isConnecting = false

  constructor(
    sessionId: string,
    onMessage: MessageHandler,
    onError: ErrorHandler,
    onClose: CloseHandler
  ) {
    this.sessionId = sessionId
    this.onMessage = onMessage
    this.onError = onError
    this.onClose = onClose
  }

  connect(): void {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return
    }

    this.isConnecting = true
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const url = `${protocol}//${host}/ws/agent/${this.sessionId}`

    try {
      this.ws = new WebSocket(url)

      this.ws.onopen = () => {
        console.log('WebSocket connected')
        this.isConnecting = false
        this.reconnectAttempts = 0
      }

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          this.onMessage(message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        this.isConnecting = false
        this.onError(error)
      }

      this.ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason)
        this.isConnecting = false
        this.onClose(event)

        if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect()
        }
      }
    } catch (error) {
      console.error('Failed to create WebSocket:', error)
      this.isConnecting = false
      this.scheduleReconnect()
    }
  }

  private scheduleReconnect(): void {
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`)

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++
      this.connect()
    }, delay)
  }

  send(message: { type: string; content: string; agent_type?: string }): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.error('WebSocket is not connected')
      throw new Error('WebSocket is not connected')
    }
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting')
      this.ws = null
    }

    this.reconnectAttempts = this.maxReconnectAttempts
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }
}

export function createMockWebSocket(
  sessionId: string,
  onMessage: MessageHandler
): { send: (msg: { type: string; content: string; agent_type?: string }) => void; disconnect: () => void } {
  let messageCount = 0

  const simulateResponse = (userContent: string) => {
    messageCount++
    const messageId = `mock_msg_${Date.now()}`

    // Simulate thinking
    setTimeout(() => {
      onMessage({
        type: 'thinking',
        data: {
          message_id: messageId,
          thinking: {
            type: 'reasoning',
            content: `正在分析用户的需求: "${userContent.substring(0, 30)}..."`,
          },
        },
      })
    }, 500)

    setTimeout(() => {
      onMessage({
        type: 'thinking',
        data: {
          message_id: messageId,
          thinking: {
            type: 'plan',
            content: '制定创作方案，结合故事背景和角色设定...',
          },
        },
      })
    }, 1500)

    // Simulate tool call
    setTimeout(() => {
      onMessage({
        type: 'tool_call',
        data: {
          message_id: messageId,
          tool_call: {
            id: `tool_${Date.now()}`,
            name: 'search_memory',
            arguments: { query: userContent.substring(0, 20) },
          },
        },
      })
    }, 2500)

    setTimeout(() => {
      onMessage({
        type: 'tool_result',
        data: {
          message_id: messageId,
          tool_call: {
            id: `tool_${Date.now()}`,
            name: 'search_memory',
            arguments: {},
            result: '找到了 3 条相关记忆',
          },
        },
      })
    }, 3500)

    // Simulate streaming response
    const responseParts = [
      '好的，我来为你分析一下这个创意。\n\n',
      '## 创意分析\n\n',
      '根据你的描述，这是一个非常有潜力的故事概念。',
      '我建议从以下几个角度来深化：\n\n',
      '### 1. 核心冲突\n',
      '故事需要一个强有力的核心冲突来驱动情节发展。\n\n',
      '### 2. 角色弧光\n',
      '主角需要有清晰的成长轨迹。\n\n',
      '### 3. 世界观设定\n',
      '建立独特而可信的世界观是吸引观众的关键。\n\n',
      '你觉得这个方向如何？需要我进一步展开某个部分吗？',
    ]

    let partIndex = 0
    const streamInterval = setInterval(() => {
      if (partIndex < responseParts.length) {
        onMessage({
          type: 'message',
          data: {
            message_id: messageId,
            content: responseParts.slice(0, partIndex + 1).join(''),
            agent_type: 'showrunner',
          },
        })
        partIndex++
      } else {
        clearInterval(streamInterval)
        onMessage({
          type: 'done',
          data: { message_id: messageId },
        })
      }
    }, 800)
  }

  return {
    send: (msg) => {
      simulateResponse(msg.content)
    },
    disconnect: () => {
      console.log('Mock WebSocket disconnected')
    },
  }
}
