import { useEffect, useRef, useState } from 'react'

interface WebSocketMessage {
  type: string
  data: any
}

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void
  onOpen?: () => void
  onClose?: () => void
  onError?: (error: Event) => void
  reconnect?: boolean
  reconnectInterval?: number
}

export function useWebSocket(url: string, options: UseWebSocketOptions = {}) {
  const {
    onMessage,
    onOpen,
    onClose,
    onError,
    reconnect = true,
    reconnectInterval = 3000,
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  useEffect(() => {
    const connect = () => {
      try {
        const ws = new WebSocket(url)
        wsRef.current = ws

        ws.onopen = () => {
          console.log('[WS] Connected')
          setIsConnected(true)
          onOpen?.()
        }

        ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data)
            setLastMessage(message)
            onMessage?.(message)
          } catch (error) {
            console.error('[WS] Failed to parse message:', error)
          }
        }

        ws.onclose = () => {
          console.log('[WS] Disconnected')
          setIsConnected(false)
          wsRef.current = null
          onClose?.()

          // Auto-reconnect
          if (reconnect) {
            reconnectTimeoutRef.current = setTimeout(() => {
              console.log('[WS] Reconnecting...')
              connect()
            }, reconnectInterval)
          }
        }

        ws.onerror = (error) => {
          console.error('[WS] Error:', error)
          onError?.(error)
        }
      } catch (error) {
        console.error('[WS] Connection failed:', error)
      }
    }

    connect()

    // Cleanup
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [url, reconnect, reconnectInterval])

  const send = (data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    } else {
      console.warn('[WS] Cannot send, not connected')
    }
  }

  return {
    isConnected,
    lastMessage,
    send,
  }
}

// Convenience hook for MediQueue WebSocket
export function useMediQueueWebSocket(options: Omit<UseWebSocketOptions, 'reconnect'> = {}) {
  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/api/v1/ws'
  return useWebSocket(wsUrl, { ...options, reconnect: true })
}
