import { cn } from '@/lib/utils'

/**
 * LoadingSkeleton — Skeleton placeholder matching the shape of the content being loaded.
 *
 * Uses CSS custom properties for fixed dimensions to prevent CLS (Requirement 24.2).
 * Shimmer animation respects prefers-reduced-motion and data-reduced-motion (Requirement 23.6).
 *
 * Variants:
 *   - card: Full card placeholder (icon area + title + value + trend)
 *   - table-row: Single table row with multiple columns
 *   - stat-card: Matches StatCard dimensions exactly
 *   - form: Form with label + input pairs
 *   - list-item: Compact list row with avatar + text lines
 */

interface LoadingSkeletonProps {
  variant: 'card' | 'table-row' | 'stat-card' | 'form' | 'list-item'
  count?: number
  className?: string
}

/**
 * Base shimmer block — a single animated rectangle.
 * The shimmer animation is applied via the `.skeleton` CSS class defined in index.css.
 * Reduced-motion is handled at the CSS level via:
 *   - @media (prefers-reduced-motion: reduce) in motion.css
 *   - [data-reduced-motion="true"] in motion.css
 * Both disable animation-duration, so the skeleton renders as a static muted block.
 */
function ShimmerBlock({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={cn('skeleton rounded-[var(--radius-sm,0.5rem)]', className)}
      style={style}
      aria-hidden="true"
    />
  )
}

/** Card variant — mimics a generic content card with header and body lines */
function CardSkeleton() {
  return (
    <div
      className="rounded-[var(--radius-lg,1rem)]"
      style={{
        backgroundColor: 'var(--surface-raised, hsl(40 30% 97%))',
        padding: 'var(--space-6, 1.5rem)',
        boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(26,23,20,0.04), 0 2px 6px rgba(26,23,20,0.03))',
        // Fixed height prevents CLS — Requirement 24.2
        '--skeleton-card-height': '10rem',
        minHeight: 'var(--skeleton-card-height)',
      } as React.CSSProperties}
    >
      {/* Header area */}
      <div className="flex items-center gap-3 mb-4">
        <ShimmerBlock
          className="shrink-0"
          style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-md, 0.75rem)' }}
        />
        <ShimmerBlock style={{ width: '60%', height: '0.875rem' }} />
      </div>
      {/* Body lines */}
      <ShimmerBlock className="mb-3" style={{ width: '100%', height: '1rem' }} />
      <ShimmerBlock className="mb-3" style={{ width: '80%', height: '1rem' }} />
      <ShimmerBlock style={{ width: '45%', height: '0.875rem' }} />
    </div>
  )
}

/** Table-row variant — mimics a single data table row with columns */
function TableRowSkeleton() {
  return (
    <div
      className="flex items-center gap-4"
      style={{
        padding: 'var(--space-4, 1rem) var(--space-6, 1.5rem)',
        borderBottom: '1px solid var(--border-default, hsl(40 20% 90%))',
        // Fixed row height prevents CLS — Requirement 24.2
        '--skeleton-row-height': '3.5rem',
        minHeight: 'var(--skeleton-row-height)',
      } as React.CSSProperties}
    >
      <ShimmerBlock style={{ width: '25%', height: '0.875rem' }} />
      <ShimmerBlock style={{ width: '20%', height: '0.875rem' }} />
      <ShimmerBlock style={{ width: '15%', height: '0.875rem' }} />
      <ShimmerBlock style={{ width: '20%', height: '0.875rem' }} />
      <ShimmerBlock className="ml-auto" style={{ width: '2rem', height: '2rem', borderRadius: '50%' }} />
    </div>
  )
}

/** Stat-card variant — matches StatCard component dimensions exactly */
function StatCardSkeleton() {
  return (
    <div
      className="rounded-[var(--radius-lg,1rem)]"
      style={{
        backgroundColor: 'var(--surface-raised, hsl(40 30% 97%))',
        padding: 'var(--space-6, 1.5rem)',
        boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(26,23,20,0.04), 0 2px 6px rgba(26,23,20,0.03))',
        // Fixed height matching StatCard — Requirement 24.2
        '--skeleton-stat-height': '7.5rem',
        minHeight: 'var(--skeleton-stat-height)',
      } as React.CSSProperties}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Title line */}
          <ShimmerBlock className="mb-3" style={{ width: '60%', height: '0.75rem' }} />
          {/* Value line */}
          <ShimmerBlock className="mb-2" style={{ width: '40%', height: '1.75rem' }} />
          {/* Trend line */}
          <ShimmerBlock style={{ width: '30%', height: '0.625rem' }} />
        </div>
        {/* Icon placeholder */}
        <ShimmerBlock
          className="shrink-0"
          style={{
            width: '2.75rem',
            height: '2.75rem',
            borderRadius: 'var(--radius-md, 0.75rem)',
          }}
        />
      </div>
    </div>
  )
}

/** Form variant — mimics a form with label + input pairs */
function FormSkeleton() {
  return (
    <div
      className="rounded-[var(--radius-lg,1rem)]"
      style={{
        backgroundColor: 'var(--surface-raised, hsl(40 30% 97%))',
        padding: 'var(--space-6, 1.5rem)',
        boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(26,23,20,0.04), 0 2px 6px rgba(26,23,20,0.03))',
        // Fixed height prevents CLS — Requirement 24.2
        '--skeleton-form-height': '16rem',
        minHeight: 'var(--skeleton-form-height)',
      } as React.CSSProperties}
    >
      {/* Form field 1 */}
      <div className="mb-5">
        <ShimmerBlock className="mb-2" style={{ width: '25%', height: '0.75rem' }} />
        <ShimmerBlock style={{ width: '100%', height: '2.5rem', borderRadius: 'var(--radius-md, 0.75rem)' }} />
      </div>
      {/* Form field 2 */}
      <div className="mb-5">
        <ShimmerBlock className="mb-2" style={{ width: '30%', height: '0.75rem' }} />
        <ShimmerBlock style={{ width: '100%', height: '2.5rem', borderRadius: 'var(--radius-md, 0.75rem)' }} />
      </div>
      {/* Form field 3 */}
      <div className="mb-5">
        <ShimmerBlock className="mb-2" style={{ width: '20%', height: '0.75rem' }} />
        <ShimmerBlock style={{ width: '100%', height: '5rem', borderRadius: 'var(--radius-md, 0.75rem)' }} />
      </div>
      {/* Submit button */}
      <ShimmerBlock style={{ width: '8rem', height: '2.5rem', borderRadius: 'var(--radius-md, 0.75rem)' }} />
    </div>
  )
}

/** List-item variant — compact row with avatar circle + text lines */
function ListItemSkeleton() {
  return (
    <div
      className="flex items-center gap-3"
      style={{
        padding: 'var(--space-3, 0.75rem) var(--space-4, 1rem)',
        borderBottom: '1px solid var(--border-default, hsl(40 20% 90%))',
        // Fixed row height prevents CLS — Requirement 24.2
        '--skeleton-list-height': '3.25rem',
        minHeight: 'var(--skeleton-list-height)',
      } as React.CSSProperties}
    >
      {/* Avatar circle */}
      <ShimmerBlock
        className="shrink-0"
        style={{ width: '2rem', height: '2rem', borderRadius: '50%' }}
      />
      {/* Text lines */}
      <div className="flex-1 min-w-0">
        <ShimmerBlock className="mb-1.5" style={{ width: '55%', height: '0.75rem' }} />
        <ShimmerBlock style={{ width: '35%', height: '0.625rem' }} />
      </div>
    </div>
  )
}

/** Variant renderer map */
const VARIANT_MAP: Record<LoadingSkeletonProps['variant'], () => React.ReactElement> = {
  'card': CardSkeleton,
  'table-row': TableRowSkeleton,
  'stat-card': StatCardSkeleton,
  'form': FormSkeleton,
  'list-item': ListItemSkeleton,
}

/**
 * LoadingSkeleton component.
 *
 * Renders one or more skeleton placeholders matching the shape of the content
 * being loaded. The shimmer animation is CSS-driven and automatically disabled
 * when the user prefers reduced motion (via OS setting or ThemeStore flag).
 *
 * @example
 * // Single stat card skeleton
 * <LoadingSkeleton variant="stat-card" />
 *
 * // Multiple table rows
 * <LoadingSkeleton variant="table-row" count={5} />
 */
export function LoadingSkeleton({ variant, count = 1, className }: LoadingSkeletonProps) {
  const VariantComponent = VARIANT_MAP[variant]
  const items = Array.from({ length: count }, (_, i) => i)

  return (
    <div
      className={cn('loading-skeleton', className)}
      role="status"
      aria-label="Memuat konten..."
      aria-busy="true"
    >
      {/* Screen-reader only loading text */}
      <span className="sr-only">Memuat...</span>
      {items.map((i) => (
        <VariantComponent key={i} />
      ))}
    </div>
  )
}
