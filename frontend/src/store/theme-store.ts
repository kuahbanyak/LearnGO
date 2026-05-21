/**
 * ThemeStore — Zustand-based theme state management
 * "Soft Machine Medical" design system
 *
 * Persists theme configuration to localStorage under key 'mediqueue-theme'.
 * Validates all config values on hydration and programmatic updates.
 * Gracefully handles localStorage unavailability (session-only mode).
 *
 * Requirements: 2.1, 2.4, 2.5, 2.6, 2.9, 10.1, 10.3, 10.6, 15.1, 15.2, 15.3, 15.4, 15.5
 */

import { create } from 'zustand'
import { persist, type StorageValue } from 'zustand/middleware'
import { resolveTheme } from './theme-resolver'

// ============================================================
// Types
// ============================================================

export type ThemeMode = 'light' | 'dark' | 'high-contrast'

export interface ThemeConfig {
  /** Active theme mode — Req 2.1, 15.3 */
  mode: ThemeMode
  /** Accent hue override — integer 0 ≤ accentHue < 360 — Req 15.1 */
  accentHue: number
  /** Reduced motion preference — Req 8.2 */
  reducedMotion: boolean
  /** Font scale — one of [0.875, 1, 1.125, 1.25] — Req 10.1, 15.2 */
  fontScale: number
}

export interface ThemeState {
  config: ThemeConfig
  /** Set theme mode. Rejects invalid values (Req 15.3, 15.5). */
  setMode: (mode: ThemeMode) => void
  /** Cycle through light → dark → high-contrast → light (Req 2.1). */
  toggleMode: () => void
  /** Set font scale. Rejects values outside [0.875, 1, 1.125, 1.25] (Req 10.1, 10.3, 15.2, 15.5). */
  setFontScale: (scale: number) => void
  /** Set reduced motion preference (Req 8.2). */
  setReducedMotion: (reduced: boolean) => void
}

// ============================================================
// Validation constants & defaults
// ============================================================

const VALID_MODES: ThemeMode[] = ['light', 'dark', 'high-contrast']
const VALID_FONT_SCALES: number[] = [0.875, 1, 1.125, 1.25]
const DEFAULT_ACCENT_HUE = 210

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  mode: 'light',
  accentHue: DEFAULT_ACCENT_HUE,
  reducedMotion: false,
  fontScale: 1,
}

// ============================================================
// Validation helpers
// ============================================================

/**
 * Validates that accentHue is an integer in [0, 360).
 * Req 15.1
 */
function isValidAccentHue(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0 &&
    value < 360
  )
}

/**
 * Validates that fontScale is one of the allowed discrete values.
 * Req 15.2, 10.1
 */
function isValidFontScale(value: unknown): value is number {
  return typeof value === 'number' && VALID_FONT_SCALES.includes(value)
}

/**
 * Validates that mode is one of the allowed ThemeMode values.
 * Req 15.3
 */
function isValidMode(value: unknown): value is ThemeMode {
  return typeof value === 'string' && (VALID_MODES as string[]).includes(value)
}

/**
 * Validates a complete ThemeConfig object.
 * Returns a sanitized config — invalid fields are replaced with defaults.
 * Req 15.4: on hydration, replace invalid values with defaults and persist corrected config.
 */
function sanitizeConfig(raw: unknown): { config: ThemeConfig; wasInvalid: boolean } {
  if (typeof raw !== 'object' || raw === null) {
    return { config: { ...DEFAULT_THEME_CONFIG }, wasInvalid: true }
  }

  const obj = raw as Record<string, unknown>
  let wasInvalid = false

  const mode = isValidMode(obj.mode) ? obj.mode : (() => { wasInvalid = true; return DEFAULT_THEME_CONFIG.mode })()
  const accentHue = isValidAccentHue(obj.accentHue) ? obj.accentHue : (() => { wasInvalid = true; return DEFAULT_THEME_CONFIG.accentHue })()
  const fontScale = isValidFontScale(obj.fontScale) ? obj.fontScale : (() => { wasInvalid = true; return DEFAULT_THEME_CONFIG.fontScale })()
  const reducedMotion = typeof obj.reducedMotion === 'boolean' ? obj.reducedMotion : (() => { wasInvalid = true; return DEFAULT_THEME_CONFIG.reducedMotion })()

  return {
    config: { mode, accentHue, fontScale, reducedMotion },
    wasInvalid,
  }
}

// ============================================================
// localStorage availability check
// Req 2.9: if localStorage unavailable, apply config for session without persistence
// ============================================================

function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__mediqueue_ls_test__'
    localStorage.setItem(testKey, '1')
    localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

// ============================================================
// Custom storage adapter
// Wraps localStorage with try/catch so write failures are silent.
// Req 2.9
// ============================================================

const safeLocalStorage = {
  getItem: (name: string): string | null => {
    try {
      return localStorage.getItem(name)
    } catch {
      return null
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      localStorage.setItem(name, value)
    } catch {
      // Silently ignore write failures (Req 2.9)
    }
  },
  removeItem: (name: string): void => {
    try {
      localStorage.removeItem(name)
    } catch {
      // Silently ignore
    }
  },
}

// ============================================================
// ThemeStore
// ============================================================

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      config: { ...DEFAULT_THEME_CONFIG },

      /**
       * Set theme mode.
       * Rejects invalid values and retains current mode (Req 15.3, 15.5).
       * Calls resolveTheme to apply the change to the DOM (Req 2.2, 2.3).
       */
      setMode: (mode: ThemeMode) => {
        if (!isValidMode(mode)) {
          // Reject invalid value — retain current state (Req 15.5)
          return
        }
        const newConfig = { ...get().config, mode }
        set({ config: newConfig })
        resolveTheme(newConfig)
      },

      /**
       * Cycle through light → dark → high-contrast → light.
       * Req 2.1
       */
      toggleMode: () => {
        const current = get().config.mode
        const currentIndex = VALID_MODES.indexOf(current)
        const nextMode = VALID_MODES[(currentIndex + 1) % VALID_MODES.length]
        get().setMode(nextMode)
      },

      /**
       * Set font scale.
       * Rejects values outside [0.875, 1, 1.125, 1.25] (Req 10.1, 10.3, 15.2, 15.5).
       * Calls resolveTheme to apply --font-scale to the DOM (Req 10.2).
       */
      setFontScale: (scale: number) => {
        if (!isValidFontScale(scale)) {
          // Reject invalid value — retain current state (Req 15.5, 10.3)
          return
        }
        const newConfig = { ...get().config, fontScale: scale }
        set({ config: newConfig })
        resolveTheme(newConfig)
      },

      /**
       * Set reduced motion preference.
       * Calls resolveTheme to apply data-reduced-motion to the DOM (Req 8.2).
       */
      setReducedMotion: (reduced: boolean) => {
        const newConfig = { ...get().config, reducedMotion: reduced }
        set({ config: newConfig })
        resolveTheme(newConfig)
      },
    }),
    {
      name: 'mediqueue-theme',

      // Use safe localStorage adapter (Req 2.9)
      storage: isLocalStorageAvailable()
        ? {
            getItem: (name: string): StorageValue<ThemeState> | null => {
              const raw = safeLocalStorage.getItem(name)
              if (!raw) return null
              try {
                return JSON.parse(raw) as StorageValue<ThemeState>
              } catch {
                return null
              }
            },
            setItem: (name: string, value: StorageValue<ThemeState>): void => {
              safeLocalStorage.setItem(name, JSON.stringify(value))
            },
            removeItem: (name: string): void => {
              safeLocalStorage.removeItem(name)
            },
          }
        : {
            // No-op storage for session-only mode (Req 2.9)
            getItem: () => null,
            setItem: () => undefined,
            removeItem: () => undefined,
          },

      /**
       * Validate and sanitize persisted config on hydration.
       * Invalid fields are replaced with defaults and the corrected config is persisted.
       * Req 15.4, 2.5, 2.6
       */
      onRehydrateStorage: () => (state) => {
        if (!state) return

        const { config: sanitized, wasInvalid } = sanitizeConfig(state.config)
        state.config = sanitized

        // If any field was invalid, persist the corrected config immediately (Req 15.4)
        if (wasInvalid) {
          // Use a microtask to allow the store to finish hydrating first
          Promise.resolve().then(() => {
            useThemeStore.setState({ config: sanitized })
          })
        }
      },

      /**
       * Only persist the config slice — actions are not serializable.
       */
      partialize: (state) => ({ config: state.config }) as ThemeState,
    }
  )
)

// ============================================================
// Exported validation utilities (used by ThemeResolver and tests)
// ============================================================

export { isValidMode, isValidFontScale, isValidAccentHue, sanitizeConfig }
export { VALID_MODES, VALID_FONT_SCALES, DEFAULT_ACCENT_HUE }
