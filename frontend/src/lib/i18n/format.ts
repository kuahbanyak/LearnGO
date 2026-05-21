/**
 * Date and number formatting utilities using id-ID locale
 * Requirement 28.2: All dates use id-ID locale with 24-hour time format
 * Requirement 28.3: All numeric values use id-ID locale conventions
 */
import { format, formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'

/**
 * Format a date as "dd MMMM yyyy" (e.g., "15 Januari 2024")
 */
export function formatDate(date: Date | string): string {
  return format(new Date(date), 'dd MMMM yyyy', { locale: id })
}

/**
 * Format a time as "HH:mm" in 24-hour format (e.g., "14:30")
 */
export function formatTime(date: Date | string): string {
  return format(new Date(date), 'HH:mm', { locale: id })
}

/**
 * Format a date and time as "dd MMM yyyy, HH:mm" (e.g., "15 Jan 2024, 14:30")
 */
export function formatDateTime(date: Date | string): string {
  return format(new Date(date), 'dd MMM yyyy, HH:mm', { locale: id })
}

/**
 * Format a date relative to now (e.g., "5 menit yang lalu", "dalam 2 jam")
 */
export function formatRelative(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { locale: id, addSuffix: true })
}

/**
 * Format a number using id-ID locale conventions (period as thousands separator)
 * e.g., 1000 → "1.000", 1500000 → "1.500.000"
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value)
}

/**
 * Format a duration in minutes with Indonesian unit
 * e.g., 30 → "30 menit", 1500 → "1.500 menit"
 */
export function formatDuration(minutes: number): string {
  return `${formatNumber(minutes)} menit`
}
