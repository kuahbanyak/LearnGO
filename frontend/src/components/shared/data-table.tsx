import * as React from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { Inbox } from 'lucide-react'

/**
 * DataTable — Reusable paginated table for list pages with responsive card fallback.
 *
 * Features:
 *   - Column-based rendering with optional custom render functions
 *   - Sortable columns with visual indicators
 *   - Integrated search input with debounce (controlled externally)
 *   - Pagination controls
 *   - Row click handler for navigation/detail views
 *   - Empty state display when no data
 *   - Responsive: renders as stacked card list at <768px
 *
 * Requirements: 6.1, 8.1, 10.1, 15.1, 22.5
 */

export interface Column<T> {
  /** Property key or custom string identifier */
  key: keyof T | string
  /** Display label for the column header */
  label: string
  /** Custom render function for cell content */
  render?: (row: T) => React.ReactNode
  /** Whether this column supports sorting */
  sortable?: boolean
  /** Optional fixed width (CSS value) */
  width?: string
}

export interface DataTableProps<T> {
  /** Column definitions */
  columns: Column<T>[]
  /** Data rows to display */
  data: T[]
  /** Show loading skeleton when true */
  loading?: boolean
  /** Pagination configuration */
  pagination?: {
    page: number
    totalPages: number
    onPageChange: (page: number) => void
  }
  /** Callback when a row is clicked */
  onRowClick?: (row: T) => void
  /** Custom empty state content (overrides default) */
  emptyState?: React.ReactNode
  /** Current search value (controlled) */
  searchValue?: string
  /** Callback when search input changes */
  onSearchChange?: (value: string) => void
  /** Placeholder text for the search input */
  searchPlaceholder?: string
  /** Additional CSS class names */
  className?: string
}

type SortDirection = 'asc' | 'desc' | null

interface SortState {
  key: string
  direction: SortDirection
}

/**
 * Get the cell value for a given column key from a row.
 * Supports nested keys via dot notation is not needed here —
 * we use direct property access for simplicity.
 */
function getCellValue<T>(row: T, key: keyof T | string): unknown {
  return (row as Record<string, unknown>)[key as string]
}

/**
 * Sort icon component showing current sort direction.
 */
function SortIcon({ direction }: { direction: SortDirection }) {
  if (direction === 'asc') {
    return <ChevronUp className="size-4" aria-hidden="true" />
  }
  if (direction === 'desc') {
    return <ChevronDown className="size-4" aria-hidden="true" />
  }
  return <ChevronsUpDown className="size-4 opacity-50" aria-hidden="true" />
}

/**
 * DataTable component.
 *
 * @example
 * <DataTable
 *   columns={[
 *     { key: 'name', label: 'Nama', sortable: true },
 *     { key: 'email', label: 'Email' },
 *     { key: 'status', label: 'Status', render: (row) => <Badge>{row.status}</Badge> },
 *   ]}
 *   data={users}
 *   loading={isLoading}
 *   pagination={{ page: 1, totalPages: 5, onPageChange: setPage }}
 *   onRowClick={(user) => navigate(`/admin/users/${user.id}`)}
 *   searchValue={search}
 *   onSearchChange={setSearch}
 *   searchPlaceholder="Cari pengguna..."
 * />
 */
export function DataTable<T>({
  columns,
  data,
  loading = false,
  pagination,
  onRowClick,
  emptyState,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Cari...',
  className,
}: DataTableProps<T>) {
  const [sort, setSort] = React.useState<SortState>({ key: '', direction: null })

  /** Toggle sort direction for a column */
  const handleSort = (key: string) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, direction: 'asc' }
      if (prev.direction === 'asc') return { key, direction: 'desc' }
      if (prev.direction === 'desc') return { key: '', direction: null }
      return { key, direction: 'asc' }
    })
  }

  /** Sort data locally based on current sort state */
  const sortedData = React.useMemo(() => {
    if (!sort.key || !sort.direction) return data

    return [...data].sort((a, b) => {
      const aVal = getCellValue(a, sort.key)
      const bVal = getCellValue(b, sort.key)

      // Handle null/undefined
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return sort.direction === 'asc' ? -1 : 1
      if (bVal == null) return sort.direction === 'asc' ? 1 : -1

      // String comparison
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const cmp = aVal.localeCompare(bVal, 'id-ID', { sensitivity: 'base' })
        return sort.direction === 'asc' ? cmp : -cmp
      }

      // Numeric comparison
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sort.direction === 'asc' ? aVal - bVal : bVal - aVal
      }

      // Fallback: string coercion
      const cmp = String(aVal).localeCompare(String(bVal), 'id-ID')
      return sort.direction === 'asc' ? cmp : -cmp
    })
  }, [data, sort])

  // Loading state
  if (loading) {
    return (
      <div className={cn('data-table-loading', className)}>
        {/* Search skeleton */}
        {onSearchChange && (
          <div
            className="skeleton rounded-[var(--radius-md,0.75rem)]"
            style={{
              width: '100%',
              maxWidth: '20rem',
              height: '2.5rem',
              marginBottom: 'var(--space-4, 1rem)',
            }}
            aria-hidden="true"
          />
        )}
        <LoadingSkeleton variant="table-row" count={5} />
      </div>
    )
  }

  // Empty state
  if (!loading && sortedData.length === 0) {
    return (
      <div className={cn('data-table-empty', className)}>
        {/* Still show search bar when empty */}
        {onSearchChange && (
          <SearchBar
            value={searchValue ?? ''}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
          />
        )}
        {emptyState ?? (
          <EmptyState
            icon={Inbox}
            title="Tidak ada data"
            description="Belum ada data untuk ditampilkan."
          />
        )}
      </div>
    )
  }

  return (
    <div className={cn('data-table', className)}>
      {/* Search bar */}
      {onSearchChange && (
        <SearchBar
          value={searchValue ?? ''}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
        />
      )}

      {/* Desktop table (hidden at <768px) */}
      <div className="hidden md:block">
        <div
          className="overflow-x-auto rounded-[var(--radius-lg,1rem)]"
          style={{
            border: '1px solid var(--border-default, hsl(40 20% 90%))',
            backgroundColor: 'var(--surface-raised, hsl(40 30% 97%))',
          }}
        >
          <table className="w-full border-collapse" role="grid">
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid var(--border-default, hsl(40 20% 90%))',
                  backgroundColor: 'var(--surface-sunken, hsl(40 25% 95%))',
                }}
              >
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    className={cn(
                      'text-left font-semibold',
                      col.sortable && 'cursor-pointer select-none'
                    )}
                    style={{
                      padding: 'var(--space-3, 0.75rem) var(--space-4, 1rem)',
                      fontSize: 'var(--font-size-body-sm, 0.875rem)',
                      lineHeight: 'var(--line-height-body-sm, 1.25rem)',
                      color: 'var(--text-secondary, #3d3830)',
                      width: col.width,
                    }}
                    onClick={col.sortable ? () => handleSort(String(col.key)) : undefined}
                    aria-sort={
                      sort.key === String(col.key) && sort.direction
                        ? sort.direction === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                    scope="col"
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {col.sortable && (
                        <SortIcon
                          direction={sort.key === String(col.key) ? sort.direction : null}
                        />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={cn(
                    'transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-[color-mix(in_srgb,var(--accent-primary)_4%,transparent)]'
                  )}
                  style={{
                    borderBottom:
                      rowIndex < sortedData.length - 1
                        ? '1px solid var(--border-default, hsl(40 20% 90%))'
                        : undefined,
                  }}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  role={onRowClick ? 'row' : undefined}
                  onKeyDown={
                    onRowClick
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            onRowClick(row)
                          }
                        }
                      : undefined
                  }
                >
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      style={{
                        padding: 'var(--space-3, 0.75rem) var(--space-4, 1rem)',
                        fontSize: 'var(--font-size-body-md, 1rem)',
                        lineHeight: 'var(--line-height-body-md, 1.5rem)',
                        color: 'var(--text-primary, #1a1714)',
                        width: col.width,
                      }}
                    >
                      {col.render
                        ? col.render(row)
                        : String(getCellValue(row, col.key) ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile card list (visible at <768px) */}
      <div className="block md:hidden">
        <div
          className="flex flex-col"
          style={{ gap: 'var(--space-3, 0.75rem)' }}
        >
          {sortedData.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className={cn(
                'rounded-[var(--radius-lg,1rem)]',
                onRowClick && 'cursor-pointer active:scale-[0.98] transition-transform'
              )}
              style={{
                backgroundColor: 'var(--surface-raised, hsl(40 30% 97%))',
                border: '1px solid var(--border-default, hsl(40 20% 90%))',
                padding: 'var(--space-4, 1rem)',
                boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(26,23,20,0.04), 0 2px 6px rgba(26,23,20,0.03))',
              }}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              role={onRowClick ? 'button' : undefined}
              onKeyDown={
                onRowClick
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onRowClick(row)
                      }
                    }
                  : undefined
              }
            >
              {columns.map((col) => (
                <div
                  key={String(col.key)}
                  className="flex justify-between items-start"
                  style={{
                    padding: 'var(--space-1, 0.25rem) 0',
                  }}
                >
                  <span
                    className="font-medium shrink-0"
                    style={{
                      fontSize: 'var(--font-size-body-sm, 0.875rem)',
                      color: 'var(--text-secondary, #3d3830)',
                      marginRight: 'var(--space-3, 0.75rem)',
                    }}
                  >
                    {col.label}
                  </span>
                  <span
                    className="text-right"
                    style={{
                      fontSize: 'var(--font-size-body-md, 1rem)',
                      color: 'var(--text-primary, #1a1714)',
                    }}
                  >
                    {col.render
                      ? col.render(row)
                      : String(getCellValue(row, col.key) ?? '')}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={pagination.onPageChange}
        />
      )}
    </div>
  )
}

/**
 * SearchBar — Controlled search input with icon.
 */
function SearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <div
      className="relative"
      style={{ marginBottom: 'var(--space-4, 1rem)', maxWidth: '20rem' }}
    >
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 size-4"
        style={{ color: 'var(--text-tertiary, #6b6358)' }}
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-[var(--radius-md,0.75rem)] transition-colors"
        style={{
          height: '2.5rem',
          paddingLeft: '2.5rem',
          paddingRight: 'var(--space-3, 0.75rem)',
          fontSize: 'var(--font-size-body-md, 1rem)',
          backgroundColor: 'var(--surface-sunken, hsl(40 25% 95%))',
          border: '1px solid var(--border-default, hsl(40 20% 90%))',
          color: 'var(--text-primary, #1a1714)',
          outline: 'none',
        }}
        aria-label={placeholder}
      />
    </div>
  )
}

/**
 * Pagination — Page navigation controls.
 */
function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  return (
    <nav
      className="flex items-center justify-between"
      style={{
        marginTop: 'var(--space-4, 1rem)',
        padding: 'var(--space-3, 0.75rem) 0',
      }}
      aria-label="Navigasi halaman"
    >
      <span
        style={{
          fontSize: 'var(--font-size-body-sm, 0.875rem)',
          color: 'var(--text-secondary, #3d3830)',
        }}
      >
        Halaman {page} dari {totalPages}
      </span>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Halaman sebelumnya"
          leftIcon={<ChevronLeft className="size-4" />}
        >
          Sebelumnya
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Halaman berikutnya"
          rightIcon={<ChevronRight className="size-4" />}
        >
          Berikutnya
        </Button>
      </div>
    </nav>
  )
}
