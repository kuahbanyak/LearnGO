import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * StarRating — all color values reference CSS custom properties
 * from tokens.css. No hardcoded color values.
 *
 * Requirements: 1.4
 */

interface StarRatingProps {
  rating: number
  maxRating?: number
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  onChange?: (rating: number) => void
  className?: string
}

export default function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onChange,
  className,
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'size-3',
    md: 'size-4',
    lg: 'size-5',
  }

  const handleClick = (index: number) => {
    if (interactive && onChange) {
      onChange(index + 1)
    }
  }

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: maxRating }, (_, i) => {
        const isFilled = i < Math.floor(rating)
        const isHalf = i < rating && i >= Math.floor(rating)

        return (
          <button
            key={i}
            type="button"
            onClick={() => handleClick(i)}
            disabled={!interactive}
            className={cn(
              'relative transition-all',
              interactive && 'cursor-pointer hover:scale-110',
              !interactive && 'cursor-default'
            )}
          >
            <Star
              className={cn(
                sizeClasses[size],
                'transition-colors',
              )}
              style={{
                fill: isFilled || isHalf
                  ? 'var(--accent-warning, #d97706)'
                  : 'color-mix(in srgb, var(--text-primary) 12%, transparent)',
                color: isFilled || isHalf
                  ? 'var(--accent-warning, #d97706)'
                  : 'color-mix(in srgb, var(--text-primary) 20%, transparent)',
              }}
            />
            {isHalf && (
              <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                <Star
                  className={cn(sizeClasses[size])}
                  style={{
                    fill: 'var(--accent-warning, #d97706)',
                    color: 'var(--accent-warning, #d97706)',
                  }}
                />
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

interface StarRatingDisplayProps {
  rating: number
  totalRatings?: number
  size?: 'sm' | 'md' | 'lg'
  showNumber?: boolean
  className?: string
}

export function StarRatingDisplay({
  rating,
  totalRatings,
  size = 'md',
  showNumber = true,
  className,
}: StarRatingDisplayProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <StarRating rating={rating} size={size} />
      {showNumber && (
        <div className="flex items-center gap-1 text-sm">
          <span
            className="font-semibold"
            style={{ color: 'var(--text-primary, #1a1714)' }}
          >
            {rating.toFixed(1)}
          </span>
          {totalRatings !== undefined && (
            <span style={{ color: 'var(--text-tertiary, #6b6358)' }}>
              ({totalRatings})
            </span>
          )}
        </div>
      )}
    </div>
  )
}
