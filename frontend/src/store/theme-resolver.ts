/**
 * ThemeResolver — applies ThemeConfig to the DOM
 * "Soft Machine Medical" design system
 *
 * Responsibilities:
 *  - Set data-theme attribute on document.documentElement (Req 2.2, 12.1)
 *  - Set --font-scale CSS custom property on root (Req 10.2)
 *  - Set/remove data-reduced-motion attribute (Req 8.2, 12.2)
 *  - Apply --accent-hue override when non-default (Req 12.2)
 *  - Detect prefers-color-scheme on first load when no persisted preference (Req 2.7)
 *  - Batch all DOM mutations inside a single requestAnimationFrame (Req 2.8, 12.2)
 *  - Fall back to 'light' when data-theme receives an unsupported value (Req 12.3)
 *
 * Requirements: 2.2, 2.3, 2.7, 2.8, 10.2, 12.1, 12.2, 12.3
 */

import type { ThemeConfig, ThemeMode } from './theme-store'

// ============================================================
// Constants — duplicated here to avoid circular dependency with theme-store
// (theme-store imports resolveTheme; theme-resolver must not import from theme-store at runtime)
// ============================================================

/** Supported theme modes — must stay in sync with VALID_MODES in theme-store.ts */
const SUPPORTED_MODES: ReadonlySet<string> = new Set<ThemeMode>([
  'light',
  'dark',
  'high-contrast',
])

/** Default accent hue — must stay in sync with DEFAULT_ACCENT_HUE in theme-store.ts */
const DEFAULT_ACCENT_HUE = 210

/** Default mode used as fallback — must stay in sync with DEFAULT_THEME_CONFIG in theme-store.ts */
const FALLBACK_MODE: ThemeMode = 'light'

// ============================================================
// Internal state — tracks pending rAF handle to avoid stacking
// ============================================================

let _pendingFrame: number | null = null

// ============================================================
// resolveTheme
// ============================================================

/**
 * Applies a ThemeConfig to the document root inside a single
 * requestAnimationFrame, ensuring the visual update completes
 * within one paint frame (≤16ms) with zero CLS.
 *
 * All DOM mutations are batched into one rAF callback so the
 * browser never sees a partial state.
 *
 * Req 2.2 — set data-theme attribute
 * Req 2.3 — CSS cascade resolves tokens from data-theme
 * Req 2.8 — visual update within single animation frame
 * Req 10.2 — update --font-scale CSS custom property
 * Req 12.1 — theme switch via data-theme attribute only
 * Req 12.2 — zero React re-renders; CSS cascade handles colors
 * Req 12.3 — fall back to 'light' for unsupported data-theme values
 */
export function resolveTheme(config: ThemeConfig): void {
  // Cancel any previously scheduled frame to avoid stacking
  if (_pendingFrame !== null) {
    cancelAnimationFrame(_pendingFrame)
  }

  _pendingFrame = requestAnimationFrame(() => {
    _pendingFrame = null
    _applyTheme(config)
  })
}

/**
 * Synchronous DOM application — called inside rAF.
 * Exported for testing purposes only; prefer resolveTheme() in production.
 */
export function _applyTheme(config: ThemeConfig): void {
  const root = document.documentElement

  // Step 1: Validate and set data-theme attribute (Req 2.2, 12.3)
  const mode: ThemeMode = SUPPORTED_MODES.has(config.mode)
    ? config.mode
    : FALLBACK_MODE // fall back to 'light'

  root.setAttribute('data-theme', mode)

  // Step 2: Apply font scale (Req 10.2)
  root.style.setProperty('--font-scale', String(config.fontScale))

  // Step 3: Apply reduced motion preference (Req 8.2, 12.2)
  if (config.reducedMotion) {
    root.setAttribute('data-reduced-motion', 'true')
  } else {
    root.removeAttribute('data-reduced-motion')
  }

  // Step 4: Apply accent hue override when non-default (Req 12.2)
  if (config.accentHue !== DEFAULT_ACCENT_HUE) {
    root.style.setProperty('--accent-hue', String(config.accentHue))
  } else {
    // Remove override so CSS falls back to the theme's built-in hue
    root.style.removeProperty('--accent-hue')
  }
}

// ============================================================
// detectSystemPreference
// ============================================================

/**
 * Returns 'dark' if the OS reports prefers-color-scheme: dark,
 * otherwise returns 'light'.
 *
 * Req 2.7 — respect prefers-color-scheme on first load
 */
export function detectSystemPreference(): ThemeMode {
  if (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    return 'dark'
  }
  return 'light'
}

// ============================================================
// initializeTheme
// ============================================================

/**
 * Called once on app mount to apply the correct theme immediately.
 *
 * Strategy:
 *  1. Read the current ThemeStore state (already hydrated from localStorage).
 *  2. If the store has a persisted mode (i.e. the user has previously chosen
 *     a theme), use it as-is.
 *  3. If no persisted preference exists (store is at default 'light' AND
 *     localStorage has no entry), detect the OS preference and override the
 *     mode before applying.
 *
 * This function applies the theme synchronously (no rAF) so the correct
 * data-theme is set before the first paint, preventing a flash of wrong theme.
 *
 * Req 2.7 — detect system preference on first load
 * Req 2.8 — visual update within single animation frame
 * Req 10.2 — apply --font-scale on load
 */
export function initializeTheme(config: ThemeConfig): void {
  const hasPersistedPreference = _hasPersistedTheme()

  let effectiveConfig = config

  if (!hasPersistedPreference) {
    // No persisted preference — respect OS setting (Req 2.7)
    const systemMode = detectSystemPreference()
    effectiveConfig = { ...config, mode: systemMode }
  }

  // Apply synchronously on first load to avoid FOUC
  _applyTheme(effectiveConfig)
}

// ============================================================
// Internal helpers
// ============================================================

/**
 * Returns true if a valid theme preference has been persisted to localStorage.
 * Used by initializeTheme to decide whether to respect the OS preference.
 */
function _hasPersistedTheme(): boolean {
  try {
    const raw = localStorage.getItem('mediqueue-theme')
    if (!raw) return false
    const parsed = JSON.parse(raw) as { state?: { config?: { mode?: unknown } } }
    return (
      typeof parsed?.state?.config?.mode === 'string' &&
      SUPPORTED_MODES.has(parsed.state.config.mode)
    )
  } catch {
    return false
  }
}
