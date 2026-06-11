import { WifiOff, ShieldX, ServerCrash, AlertCircle, RefreshCw, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

/**
 * ErrorState — Consistent error display with message, category, and retry action.
 *
 * Each error category has a distinct icon and color treatment.
 * Uses ARIA role="alert" to announce error states to assistive technology.
 *
 * Requirements: 26.1, 26.3, 26.4, 23.8
 */

export interface ErrorStateProps {
  /** Optional title displayed above the message */
  title?: string
  /** Error message describing what went wrong */
  message: string
  /** Error category determines icon and color treatment */
  category?: 'network' | 'forbidden' | 'server' | 'validation'
  /** Callback invoked when the retry button is clicked */
  onRetry?: () => void
  /** Custom label for the retry button (defaults to "Coba Lagi") */
  retryLabel?: string
  /** Additional CSS class names */
  className?: string
}

interface CategoryConfig {
  icon: LucideIcon
  color: string
  defaultTitle: string
}

/**
 * Maps error category to its icon, color token, and default title.
 * Requirement 23.8 — uses color in combination with text and icon to convey meaning.
 */
function getCategoryConfig(category: ErrorStateProps['category']): CategoryConfig {
  switch (category) {
    case 'network':
      return {
        icon: WifiOff,
        color: 'var(--accent-warning, #d97706)',
        defaultTitle: 'Koneksi Bermasalah',
      }
    case 'forbidden':
      return {
        icon: ShieldX,
        color: 'var(--accent-danger, #dc2626)',
        defaultTitle: 'Akses Ditolak',
      }
    case 'server':
      return {
        icon: ServerCrash,
        color: 'var(--accent-danger, #dc2626)',
        defaultTitle: 'Kesalahan Server',
      }
    case 'validation':
      return {
        icon: AlertCircle,
        color: 'var(--accent-warning, #d97706)',
        defaultTitle: 'Data Tidak Valid',
      }
    default:
      return {
        icon: AlertCircle,
        color: 'var(--accent-danger, #dc2626)',
        defaultTitle: 'Terjadi Kesalahan',
      }
  }
}

export function ErrorState({
  title,
  message,
  category,
  onRetry,
  retryLabel = 'Coba Lagi',
  className,
}: ErrorStateProps) {
  const config = getCategoryConfig(category)
  const Icon = config.icon
  const displayTitle = title ?? config.defaultTitle

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'flex flex-col items-center justify-center text-center',
        className
      )}
      style={{
        padding: 'var(--space-8, 2rem)',
        gap: 'var(--space-4, 1rem)',
      }}
    >
      {/* Icon — distinct per category with color treatment */}
      <div
        className="flex items-center justify-center"
        style={{
          width: '4rem',
          height: '4rem',
          borderRadius: 'var(--radius-full, 9999px)',
          backgroundColor: `color-mix(in srgb, ${config.color} 12%, transparent)`,
        }}
        aria-hidden="true"
      >
        <Icon
          className="size-8"
          style={{ color: config.color }}
          aria-hidden="true"
        />
      </div>

      {/* Title and message */}
      <div
        className="flex flex-col"
        style={{ gap: 'var(--space-2, 0.5rem)' }}
      >
        <h3
          className="text-lg font-semibold"
          style={{ color: 'var(--text-primary, #1a1714)' }}
        >
          {displayTitle}
        </h3>
        <p
          className="text-sm max-w-sm"
          style={{ color: 'var(--text-secondary, #3d3830)' }}
        >
          {message}
        </p>
      </div>

      {/* Retry action */}
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          leftIcon={<RefreshCw className="size-4" />}
          style={{ marginTop: 'var(--space-2, 0.5rem)' }}
        >
          {retryLabel}
        </Button>
      )}
    </div>
  )
}
