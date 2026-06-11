import { cn } from '@/lib/utils'

/**
 * PageHeader — Consistent page header with display typography,
 * optional subtitle, action slot, and category color accent.
 *
 * Requirements: 21.3, 21.4
 */

type Category = 'admin' | 'doctor' | 'patient' | 'queue'

interface PageHeaderProps {
  /** Page title rendered with display-lg typography */
  title: string
  /** Optional subtitle rendered below the title */
  subtitle?: string
  /** Action slot — rendered to the right of the title on desktop */
  actions?: React.ReactNode
  /**
   * Category determines the accent color applied to the title's
   * left border decoration. Uses the role's category color token.
   */
  category?: Category
  className?: string
}

/**
 * Maps a category to its CSS custom property token.
 */
function getCategoryColor(category?: Category): string {
  switch (category) {
    case 'admin':   return 'var(--category-admin, #7c3aed)'
    case 'doctor':  return 'var(--category-doctor, #0284c7)'
    case 'patient': return 'var(--category-patient, #059669)'
    case 'queue':   return 'var(--category-queue, #b45309)'
    default:        return 'transparent'
  }
}

export function PageHeader({
  title,
  subtitle,
  actions,
  category,
  className,
}: PageHeaderProps) {
  const accentColor = getCategoryColor(category)

  return (
    <header
      className={cn(
        'flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
      style={{
        paddingBottom: 'var(--space-6, 1.5rem)',
        borderBottom: '1px solid var(--border-default, #e8e2da)',
        marginBottom: 'var(--space-6, 1.5rem)',
      }}
    >
      {/* Title region with optional accent border */}
      <div
        className="flex flex-col gap-1"
        style={{
          paddingLeft: category ? 'var(--space-4, 1rem)' : undefined,
          borderLeft: category
            ? `3px solid ${accentColor}`
            : undefined,
        }}
      >
        <h1
          className="text-display-lg"
          style={{ color: 'var(--text-primary, #1a1714)' }}
        >
          {title}
        </h1>

        {subtitle && (
          <p
            className="text-body-md"
            style={{ color: 'var(--text-secondary, #3d3830)' }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Action slot */}
      {actions && (
        <div className="flex items-center gap-2 mt-3 sm:mt-0 shrink-0">
          {actions}
        </div>
      )}
    </header>
  )
}
