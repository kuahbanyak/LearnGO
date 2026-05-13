import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
  iconClassName?: string
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  className,
  iconClassName 
}: StatCardProps) {
  return (
    <Card className={cn('hover:shadow-lg transition-shadow duration-200', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {title}
            </p>
            <p className="text-3xl font-bold mt-2 text-slate-900 dark:text-white">
              {value}
            </p>
            {trend && (
              <p className={cn(
                'text-sm mt-2 font-medium',
                trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              )}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                <span className="text-slate-500 dark:text-slate-400 ml-1">vs last period</span>
              </p>
            )}
          </div>
          <div className={cn(
            'p-3 rounded-full bg-primary/10',
            iconClassName
          )}>
            <Icon className="size-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
