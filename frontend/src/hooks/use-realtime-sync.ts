import { useEffect, useRef, useCallback, useSyncExternalStore } from 'react'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'

// ── Types ──

export type ConnectionState = 'connected' | 'disconnected' | 'reconnecting'

export type RealtimeChannel =
  | 'queue_update'
  | 'checkin'
  | 'appointment_status'

export interface RealtimeMessage<T = unknown> {
  type: RealtimeChannel
  data: T
}

export interface RealtimeSyncOptions {
  /**
   * Channels to subscribe to. The hook will only invoke the callback
   * for messages matching these channels.
   */
  channels: RealtimeChannel[]
  /**
   * Callback invoked when a message arrives on a subscribed channel.
   */
  onMessage?: (message: RealtimeMessage) => void
  /**
   * Whether to enable polling fallback when disconnected.
   * Defaults to true.
   */
  pollingFallback?: boolean
  /**
   * Polling interval in milliseconds when WebSocket is disconnected.
   * Defaults to 30000 (30s). Requirements 25.4.
   */
  pollingInterval?: number
  /**
   * TanStack Query keys to refetch on reconnect.
   * If not provided, all active queries will be refetched.
   */
  refetchKeys?: readonly unknown[][]
}

export interface UseRealtimeSyncReturn {
  /** Current WebSocket connection state. */
  connectionState: ConnectionState
  /** Send a message through the WebSocket connection. */
  send: (data: unknown) => void
}

// ── Singleton WebSocket Manager ──

type Listener = (message: RealtimeMessage) => void
type StateListener = () => void

/**
 * Singleton WebSocket connection manager.
 * Maintains a single connection per tab regardless of how many
 * components subscribe. Implements exponential backoff reconnection
 * (1s → 30s cap) per Requirement 25.3.
 */
class WebSocketManager {
  private static instance: WebSocketManager | null = null

  private ws: WebSocket | null = null
  private connectionState: ConnectionState = 'disconnected'
  private listeners: Map<RealtimeChannel, Set<Listener>> = new Map()
  private stateListeners: Set<StateListener> = new Set()
  private reconnectAttempt = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private url: string
  private intentionallyClosed = false

  // Exponential backoff config (Requirements 25.3, 4.5)
  private readonly BASE_DELAY_MS = 1000
  private readonly MAX_DELAY_MS = 30000

  private constructor(url: string) {
    this.url = url
  }

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      const wsUrl =
        import.meta.env.VITE_WS_URL || 'ws://localhost:8080/api/v1/ws'
      WebSocketManager.instance = new WebSocketManager(wsUrl)
    }
    return WebSocketManager.instance
  }

  /**
   * Reset the singleton instance (useful for testing).
   */
  static resetInstance(): void {
    if (WebSocketManager.instance) {
      WebSocketManager.instance.destroy()
      WebSocketManager.instance = null
    }
  }

  getConnectionState(): ConnectionState {
    return this.connectionState
  }

  /**
   * Subscribe to state changes. Returns an unsubscribe function.
   * Used by useSyncExternalStore for React integration.
   */
  subscribeState(listener: StateListener): () => void {
    this.stateListeners.add(listener)
    return () => {
      this.stateListeners.delete(listener)
    }
  }

  /**
   * Subscribe to a specific channel. Returns an unsubscribe function.
   * Automatically connects if not already connected (Requirement 25.1).
   */
  subscribe(channel: RealtimeChannel, listener: Listener): () => void {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set())
    }
    this.listeners.get(channel)!.add(listener)

    // Ensure connection is active when there are subscribers
    if (!this.ws && !this.reconnectTimer) {
      this.connect()
    }

    return () => {
      const channelListeners = this.listeners.get(channel)
      if (channelListeners) {
        channelListeners.delete(listener)
        if (channelListeners.size === 0) {
          this.listeners.delete(channel)
        }
      }

      // Disconnect if no more subscribers (Requirement 25.2)
      if (this.getTotalListenerCount() === 0) {
        this.disconnect()
      }
    }
  }

  /**
   * Send a message through the WebSocket connection.
   */
  send(data: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  /**
   * Check if there are any active subscriptions for a given channel.
   */
  hasSubscribers(channel: RealtimeChannel): boolean {
    const channelListeners = this.listeners.get(channel)
    return !!channelListeners && channelListeners.size > 0
  }

  /**
   * Get all currently subscribed channels.
   */
  getActiveChannels(): RealtimeChannel[] {
    return Array.from(this.listeners.keys()).filter(
      (channel) => (this.listeners.get(channel)?.size ?? 0) > 0
    )
  }

  private getTotalListenerCount(): number {
    let count = 0
    for (const listeners of this.listeners.values()) {
      count += listeners.size
    }
    return count
  }

  private connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) {
      return
    }

    this.intentionallyClosed = false

    try {
      this.ws = new WebSocket(this.url)

      this.ws.onopen = () => {
        this.reconnectAttempt = 0
        this.setConnectionState('connected')
      }

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const message: RealtimeMessage = JSON.parse(event.data)
          this.dispatch(message)
        } catch {
          // Silently ignore unparseable messages
        }
      }

      this.ws.onclose = () => {
        this.ws = null
        if (!this.intentionallyClosed && this.getTotalListenerCount() > 0) {
          this.setConnectionState('reconnecting')
          this.scheduleReconnect()
        } else {
          this.setConnectionState('disconnected')
        }
      }

      this.ws.onerror = () => {
        // The onclose handler will fire after onerror, so we handle
        // reconnection there. Just ensure we clean up.
        this.ws?.close()
      }
    } catch {
      this.setConnectionState('reconnecting')
      this.scheduleReconnect()
    }
  }

  private disconnect(): void {
    this.intentionallyClosed = true
    this.clearReconnectTimer()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.setConnectionState('disconnected')
  }

  private destroy(): void {
    this.disconnect()
    this.listeners.clear()
    this.stateListeners.clear()
  }

  /**
   * Schedule a reconnection attempt with exponential backoff.
   * Starts at 1s, doubles each attempt, caps at 30s.
   * (Requirements 25.3, 4.5)
   */
  private scheduleReconnect(): void {
    this.clearReconnectTimer()

    const delay = Math.min(
      this.BASE_DELAY_MS * Math.pow(2, this.reconnectAttempt),
      this.MAX_DELAY_MS
    )

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempt++
      this.reconnectTimer = null
      this.connect()
    }, delay)
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state
      // Notify all state listeners
      for (const listener of this.stateListeners) {
        listener()
      }
    }
  }

  private dispatch(message: RealtimeMessage): void {
    const channelListeners = this.listeners.get(message.type)
    if (channelListeners) {
      for (const listener of channelListeners) {
        listener(message)
      }
    }
  }

  /**
   * Calculate the next reconnection delay (exposed for testing).
   */
  getNextReconnectDelay(): number {
    return Math.min(
      this.BASE_DELAY_MS * Math.pow(2, this.reconnectAttempt),
      this.MAX_DELAY_MS
    )
  }
}

// ── Exported utility for backoff calculation (testable without WebSocket) ──

/**
 * Calculate exponential backoff delay.
 * Starts at baseDelay, doubles each attempt, caps at maxDelay.
 *
 * @param attempt - Zero-based attempt number
 * @param baseDelay - Initial delay in ms (default: 1000)
 * @param maxDelay - Maximum delay cap in ms (default: 30000)
 * @returns Delay in milliseconds
 */
export function calculateBackoffDelay(
  attempt: number,
  baseDelay: number = 1000,
  maxDelay: number = 30000
): number {
  return Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
}

// ── React Hook ──

/**
 * useRealtimeSync
 *
 * A React hook implementing the RealtimeSyncLayer interface.
 * Provides channel-based WebSocket subscriptions with a singleton
 * connection per tab, exponential backoff reconnection, polling
 * fallback when disconnected, and automatic refetch on reconnect.
 *
 * Requirements: 25.1, 25.2, 25.3, 25.4, 25.5
 *
 * @example
 * ```tsx
 * const { connectionState } = useRealtimeSync({
 *   channels: ['queue_update', 'checkin'],
 *   onMessage: (msg) => {
 *     if (msg.type === 'queue_update') {
 *       queryClient.setQueryData(queryKeys.appointments.todayQueue(), ...)
 *     }
 *   },
 *   refetchKeys: [queryKeys.appointments.todayQueue()],
 * })
 * ```
 */
export function useRealtimeSync(options: RealtimeSyncOptions): UseRealtimeSyncReturn {
  const {
    channels,
    onMessage,
    pollingFallback = true,
    pollingInterval = 30000,
    refetchKeys,
  } = options

  const queryClient = useQueryClient()
  const onMessageRef = useRef(onMessage)
  const refetchKeysRef = useRef(refetchKeys)
  const prevConnectionStateRef = useRef<ConnectionState>('disconnected')

  // Keep refs up to date without triggering re-subscriptions
  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])

  useEffect(() => {
    refetchKeysRef.current = refetchKeys
  }, [refetchKeys])

  const manager = WebSocketManager.getInstance()

  // Use useSyncExternalStore for tear-free reads of connection state
  const connectionState = useSyncExternalStore(
    useCallback((cb) => manager.subscribeState(cb), [manager]),
    () => manager.getConnectionState(),
    () => 'disconnected' as ConnectionState // Server snapshot
  )

  // Subscribe to channels (Requirement 25.2)
  useEffect(() => {
    const unsubscribes: Array<() => void> = []

    for (const channel of channels) {
      const unsub = manager.subscribe(channel, (message) => {
        onMessageRef.current?.(message)
      })
      unsubscribes.push(unsub)
    }

    return () => {
      for (const unsub of unsubscribes) {
        unsub()
      }
    }
  }, [manager, channels.join(',')])

  // Refetch on reconnect (Requirement 25.5)
  useEffect(() => {
    const prev = prevConnectionStateRef.current
    prevConnectionStateRef.current = connectionState

    if (prev === 'reconnecting' && connectionState === 'connected') {
      refetchOnReconnect(queryClient, refetchKeysRef.current)
    }
  }, [connectionState, queryClient])

  // Polling fallback when disconnected (Requirement 25.4)
  useEffect(() => {
    if (!pollingFallback) return
    if (connectionState === 'connected') return

    const interval = setInterval(() => {
      refetchActiveQueries(queryClient, refetchKeysRef.current)
    }, pollingInterval)

    return () => clearInterval(interval)
  }, [connectionState, pollingFallback, pollingInterval, queryClient])

  const send = useCallback(
    (data: unknown) => {
      manager.send(data)
    },
    [manager]
  )

  return {
    connectionState,
    send,
  }
}

// ── Helpers ──

/**
 * Refetch queries on WebSocket reconnection.
 * If specific keys are provided, refetch only those.
 * Otherwise, invalidate all active queries.
 */
function refetchOnReconnect(
  queryClient: QueryClient,
  refetchKeys?: readonly unknown[][]
): void {
  if (refetchKeys && refetchKeys.length > 0) {
    for (const key of refetchKeys) {
      queryClient.invalidateQueries({ queryKey: key as unknown[] })
    }
  } else {
    // Refetch all active queries
    queryClient.invalidateQueries()
  }
}

/**
 * Polling fallback: refetch relevant queries at interval.
 */
function refetchActiveQueries(
  queryClient: QueryClient,
  refetchKeys?: readonly unknown[][]
): void {
  if (refetchKeys && refetchKeys.length > 0) {
    for (const key of refetchKeys) {
      queryClient.invalidateQueries({ queryKey: key as unknown[] })
    }
  } else {
    queryClient.invalidateQueries()
  }
}

// Export the manager class for testing purposes
export { WebSocketManager }
