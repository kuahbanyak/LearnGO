import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

/**
 * EmptyState — Consistent empty state display with icon, title,
 * description, and optional action button.
 *
 * Used when a page or list has no data to display.
 * All visual values reference CSS custom properties from tokens.css.
 *
 * Requirements: 16.6, 18.6
 */

interface EmptyStateProps {
  /** Lucide icon component rendered at 48px */
  icon: LucideIcon
  /** Heading text (heading-md typography) */
  title: string
  /** Descriptive text (body-md typography) */
  description: string
  /** Optional action button with label and click handler */
  action?: { label: string; onClick: () => void }
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        className
      )}
      style={{
        padding: 'var(--space-12, 3rem) var(--space-6, 1.5rem)',
      }}
    >
      {/* Icon — 48px, muted color */}
      <div
        className="flex items-center justify-center rounded-full"
        style={{
          width: '5rem',
          height: '5rem',
          backgroundColor: 'color-mix(in srgb, var(--text-tertiary, #6b6358) 8%, transparent)',
          marginBottom: 'var(--space-4, 1rem)',
        }}
      >
        <Icon
          size={48}
          style={{ color: 'var(--text-tertiary, #6b6358)' }}
          aria-hidden="true"
        />
      </div>

      {/* Title — heading-md */}
      <h3
        className="font-semibold"
        style={{
          fontSize: 'var(--font-size-heading-md, 1.25rem)',
          lineHeight: 'var(--line-height-heading-md, 1.75rem)',
          color: 'var(--text-primary, #1a1714)',
          marginBottom: 'var(--space-2, 0.5rem)',
        }}
      >
        {title}
      </h3>

      {/* Description — body-md */}
      <p
        style={{
          fontSize: 'var(--font-size-body-md, 1rem)',
          lineHeight: 'var(--line-height-body-md, 1.5rem)',
          color: 'var(--text-secondary, #3d3830)',
          maxWidth: '24rem',
        }}
      >
        {description}
      </p>

      {/* Optional action button */}
      {action && (
        <div style={{ marginTop: 'var(--space-6, 1.5rem)' }}>
          <Button
            variant="primary"
            size="md"
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        </div>
      )}
    </div>
  )
}
