import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

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
                isFilled || isHalf
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-slate-200 text-slate-300',
                interactive && 'hover:fill-amber-300 hover:text-amber-300'
              )}
            />
            {isHalf && (
              <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                <Star className={cn(sizeClasses[size], 'fill-amber-400 text-amber-400')} />
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
          <span className="font-semibold text-slate-900">{rating.toFixed(1)}</span>
          {totalRatings !== undefined && (
            <span className="text-slate-400">({totalRatings})</span>
          )}
        </div>
      )}
    </div>
  )
}
