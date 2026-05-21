import { WifiOff, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { t } from '@/lib/i18n'
import { formatTime } from '@/lib/i18n/format'

/**
 * DisconnectionBanner — Non-blocking banner indicating WebSocket disconnection.
 * Displays connection state and last-updated timestamp.
 * Uses aria-live="polite" for screen reader announcements.
 *
 * Requirements: 4.5, 25.4
 */

type ConnectionState = 'disconnected' | 'reconnecting'

interface DisconnectionBannerProps {
  /** Current connection state */
  state: ConnectionState
  /** Timestamp of the last successful data update */
  lastUpdated?: Date | null
  /** Additional CSS class names */
  className?: string
}

export function DisconnectionBanner({
  state,
  lastUpdated,
  className,
}: DisconnectionBannerProps) {
  const isReconnecting = state === 'reconnecting'

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        'flex items-center gap-3 px-4 py-2 rounded-[var(--radius-md,0.75rem)] text-sm',
        className,
      )}
      style={{
        backgroundColor: isReconnecting
          ? 'color-mix(in srgb, var(--accent-warning, #d97706) 10%, transparent)'
          : 'color-mix(in srgb, var(--accent-danger, #dc2626) 10%, transparent)',
        color: isReconnecting
          ? 'var(--accent-warning, #d97706)'
          : 'var(--accent-danger, #dc2626)',
        border: `1px solid ${
          isReconnecting
            ? 'color-mix(in srgb, var(--accent-warning, #d97706) 20%, transparent)'
            : 'color-mix(in srgb, var(--accent-danger, #dc2626) 20%, transparent)'
        }`,
      }}
    >
      {/* Icon */}
      {isReconnecting ? (
        <RefreshCw
          className="size-4 shrink-0 animate-spin"
          aria-hidden="true"
          style={{ animationDuration: '2s' }}
        />
      ) : (
        <WifiOff className="size-4 shrink-0" aria-hidden="true" />
      )}

      {/* Message */}
      <span className="flex-1 min-w-0">
        {isReconnecting
          ? t('realtime.reconnecting')
          : t('realtime.liveUpdatesUnavailable')}
      </span>

      {/* Last updated timestamp */}
      {lastUpdated && (
        <span
          className="shrink-0 text-xs font-medium"
          style={{ color: 'var(--text-tertiary, #6b6358)' }}
        >
          {t('realtime.lastUpdated')}: {formatTime(lastUpdated)}
        </span>
      )}
    </div>
  )
}
