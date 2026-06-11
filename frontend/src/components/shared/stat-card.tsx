import { useEffect, useRef, useState } from 'react'
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * StatCard — Dashboard metric display with category color coding,
 * trend indicators, and entrance animation.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */

type Category = 'admin' | 'doctor' | 'patient' | 'queue' | 'success' | 'warning'

interface TrendProps {
  value: number
  direction: 'up' | 'down' | 'flat'
}

interface StatCardProps {
  /** Card label / metric name */
  title: string
  /** Metric value — string or number */
  value: string | number
  /** Lucide icon component */
  icon: LucideIcon
  /**
   * Category determines the icon container background and icon foreground color.
   * Defaults to accent-primary when omitted.
   * Requirement 6.2, 6.3
   */
  category?: Category
  /**
   * Trend indicator — shows directional arrow and formatted percentage.
   * Requirement 6.4
   */
  trend?: TrendProps
  /**
   * When true, applies a scale-and-fade entrance animation on mount.
   * Uses only transform and opacity (compositor-friendly).
   * Requirement 6.5
   */
  animate?: boolean
  className?: string
}

/**
 * Maps a category to its CSS custom property token.
 * Requirement 6.2 — category color tokens applied to icon container and foreground.
 * Requirement 6.3 — defaults to accent-primary when no category provided.
 */
function getCategoryColor(category?: Category): string {
  switch (category) {
    case 'admin':   return 'var(--category-admin, #7c3aed)'
    case 'doctor':  return 'var(--category-doctor, #0284c7)'
    case 'patient': return 'var(--category-patient, #059669)'
    case 'queue':   return 'var(--category-queue, #b45309)'
    case 'success': return 'var(--accent-success, #059669)'
    case 'warning': return 'var(--accent-warning, #d97706)'
    default:        return 'var(--accent-primary, #0284c7)'
  }
}

/**
 * Trend indicator sub-component.
 * Requirement 6.4 — directional arrow + formatted percentage.
 */
function TrendIndicator({ trend }: { trend: TrendProps }) {
  const { value, direction } = trend

  if (direction === 'up') {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs font-semibold"
        style={{ color: 'var(--accent-success, #059669)' }}
        aria-label={`Trend naik ${Math.abs(value)}%`}
      >
        <TrendingUp className="size-3.5" aria-hidden="true" />
        {Math.abs(value)}%
      </span>
    )
  }

  if (direction === 'down') {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs font-semibold"
        style={{ color: 'var(--accent-danger, #dc2626)' }}
        aria-label={`Trend turun ${Math.abs(value)}%`}
      >
        <TrendingDown className="size-3.5" aria-hidden="true" />
        {Math.abs(value)}%
      </span>
    )
  }

  // flat
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-semibold"
      style={{ color: 'var(--text-tertiary, #6b6358)' }}
      aria-label={`Trend stabil ${Math.abs(value)}%`}
    >
      <Minus className="size-3.5" aria-hidden="true" />
      {Math.abs(value)}%
    </span>
  )
}

/**
 * StatCard component.
 *
 * Uses design tokens for all visual values:
 *   --surface-raised, --text-primary, --text-secondary,
 *   --space-4, --space-6, --radius-lg
 * Requirement 6.6
 */
export function StatCard({
  title,
  value,
  icon: Icon,
  category,
  trend,
  animate = false,
  className,
}: StatCardProps) {
  /**
   * Entrance animation state.
   * Starts hidden (opacity 0, scale 0.95) and transitions to visible
   * after mount using a small requestAnimationFrame delay.
   * Requirement 6.5
   */
  const [visible, setVisible] = useState(!animate)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!animate) return

    // Use double-rAF to ensure the initial hidden state is painted
    // before we trigger the transition.
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => {
        setVisible(true)
      })
    })

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [animate])

  const categoryColor = getCategoryColor(category)

  return (
    <div
      className={cn('rounded-[var(--radius-lg,1rem)]', className)}
      style={{
        backgroundColor: 'var(--surface-raised, #ffffff)',
        padding: 'var(--space-6, 1.5rem)',
        boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(26,23,20,0.04), 0 2px 6px rgba(26,23,20,0.03))',
        // Fixed height prevents CLS — matches skeleton stat-card variant (Requirement 24.2)
        minHeight: '7.5rem',
        // Entrance animation — opacity + scale only (compositor-friendly)
        // Requirement 6.5
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1)' : 'scale(0.95)',
        transition: animate
          ? `opacity var(--duration-normal, 250ms) var(--ease-out, cubic-bezier(0.22,1,0.36,1)),
             transform var(--duration-normal, 250ms) var(--ease-out, cubic-bezier(0.22,1,0.36,1))`
          : undefined,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Text content */}
        <div className="flex-1 min-w-0">
          {/* Title — Requirement 6.6: --text-secondary */}
          <p
            className="text-sm font-medium truncate"
            style={{ color: 'var(--text-secondary, #3d3830)' }}
          >
            {title}
          </p>

          {/* Value — Requirement 6.6: --text-primary */}
          <p
            className="text-3xl font-bold mt-2 leading-none"
            style={{
              color: 'var(--text-primary, #1a1714)',
              marginTop: 'var(--space-2, 0.5rem)',
            }}
          >
            {value}
          </p>

          {/* Trend indicator — Requirement 6.4 */}
          {trend && (
            <div style={{ marginTop: 'var(--space-2, 0.5rem)' }}>
              <TrendIndicator trend={trend} />
            </div>
          )}
        </div>

        {/* Icon container — Requirement 6.2, 6.3 */}
        <div
          className="shrink-0 flex items-center justify-center"
          style={{
            padding: 'var(--space-3, 0.75rem)',
            borderRadius: 'var(--radius-md, 0.75rem)',
            // 10% opacity background using the category color
            backgroundColor: `color-mix(in srgb, ${categoryColor} 12%, transparent)`,
          }}
          aria-hidden="true"
        >
          <Icon
            className="size-5"
            style={{ color: categoryColor }}
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  )
}
