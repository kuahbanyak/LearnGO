/**
 * i18n module entry point
 * Requirement 28.5: Single lookup module for future locale expansion
 *
 * Usage:
 *   import { t } from '@/lib/i18n'
 *   t('nav.dashboard')     // → 'Dashboard'
 *   t('actions.save')      // → 'Simpan'
 *   t('errors.network')    // → 'Koneksi jaringan terputus...'
 */
import { strings } from './id-ID'

export type StringKeys = typeof strings

export { strings }
export { formatDate, formatTime, formatDateTime, formatRelative, formatNumber, formatDuration } from './format'

/**
 * Look up a translated string by dot-notation key path.
 * Returns the string value if found, or the key itself as fallback.
 *
 * @example
 * t('nav.dashboard')       // 'Dashboard'
 * t('actions.save')        // 'Simpan'
 * t('errors.generic')      // 'Terjadi kesalahan. Silakan coba lagi.'
 * t('unknown.key')         // 'unknown.key' (fallback)
 */
export function t(key: string): string {
  const parts = key.split('.')
  let current: unknown = strings

  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return key
    }
    current = (current as Record<string, unknown>)[part]
  }

  if (typeof current === 'string') {
    return current
  }

  return key
}
