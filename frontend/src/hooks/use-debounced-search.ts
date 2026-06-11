import { useState, useEffect, useRef } from 'react'

/**
 * Options for the debounced search hook.
 */
export interface UseDebouncedSearchOptions {
  /**
   * Debounce delay in milliseconds.
   * Defaults to 300ms (Requirements 6.2, 8.2, 15.2).
   */
  delay?: number
}

/**
 * Return type for the debounced search hook.
 */
export interface UseDebouncedSearchReturn {
  /** The immediate (undelayed) value for controlled input binding. */
  value: string
  /** The debounced value that updates after the delay period. */
  debouncedValue: string
  /** Setter for the immediate value — use as the input's onChange handler. */
  setValue: (value: string) => void
  /** Resets both immediate and debounced values to empty string. */
  reset: () => void
}

/**
 * useDebouncedSearch
 *
 * A hook for search inputs that provides both an immediate value (for
 * controlled input binding) and a debounced value (for triggering API
 * calls or filtering). The debounced value updates only after the user
 * stops typing for the specified delay period.
 *
 * Requirements: 6.2, 8.2, 15.2
 *
 * @param initialValue - The initial search value (defaults to empty string)
 * @param options - Optional configuration for debounce delay
 * @returns Object with value, debouncedValue, setValue, and reset
 *
 * @example
 * ```tsx
 * const { value, debouncedValue, setValue } = useDebouncedSearch()
 *
 * // Use `value` for the controlled input
 * <input value={value} onChange={(e) => setValue(e.target.value)} />
 *
 * // Use `debouncedValue` for API calls
 * useQuery({ queryKey: ['doctors', debouncedValue], ... })
 * ```
 */
export function useDebouncedSearch(
  initialValue: string = '',
  options: UseDebouncedSearchOptions = {}
): UseDebouncedSearchReturn {
  const { delay = 300 } = options

  const [value, setValue] = useState(initialValue)
  const [debouncedValue, setDebouncedValue] = useState(initialValue)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
    }

    // Set a new timer to update the debounced value
    timerRef.current = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Cleanup on unmount or when value/delay changes
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
      }
    }
  }, [value, delay])

  const reset = () => {
    setValue('')
    setDebouncedValue('')
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  return { value, debouncedValue, setValue, reset }
}
