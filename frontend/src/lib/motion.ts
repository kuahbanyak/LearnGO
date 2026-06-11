/**
 * Motion utility — getMotionConfig
 * "Soft Machine Medical" design system
 *
 * Returns a MotionConfig object that respects the user's reduced-motion
 * preference (either OS-level or manually set via ThemeStore).
 *
 * When reduced motion is active:
 *   - duration is '0ms' (effectively instant)
 *   - easing is 'linear' (no curve needed for instant transitions)
 *   - stagger is 0 (no sequential delay)
 *
 * When reduced motion is inactive:
 *   - duration references the --duration-normal CSS custom property
 *   - easing references the --ease-out CSS custom property
 *   - stagger is 40ms between items
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

// ============================================================
// Types
// ============================================================

/**
 * Motion configuration for JS-driven animations and transitions.
 * CSS-driven animations are handled by motion.css.
 */
export interface MotionConfig {
  /**
   * Transition/animation duration as a CSS time value string.
   * '0ms' when reduced motion is active; 'var(--duration-normal)' otherwise.
   */
  duration: string

  /**
   * CSS easing function string.
   * 'linear' when reduced motion is active; 'var(--ease-out)' otherwise.
   */
  easing: string

  /**
   * Stagger delay between sequential items in milliseconds.
   * 0 when reduced motion is active; 40ms otherwise.
   */
  stagger: number
}

// ============================================================
// getMotionConfig
// ============================================================

/**
 * Returns a MotionConfig appropriate for the given reduced-motion state.
 *
 * Preconditions:
 *   - `reducedMotion` reflects the user's system preference or manual override
 *
 * Postconditions:
 *   - When reducedMotion is true: duration = '0ms', stagger = 0 (Req 8.1, 8.2)
 *   - When reducedMotion is false: duration = 'var(--duration-normal)', stagger = 40
 *   - stagger is always non-negative
 *
 * @param reducedMotion - true when OS prefers-reduced-motion is active OR
 *                        ThemeStore.config.reducedMotion is true
 * @returns MotionConfig with duration, easing, and stagger values
 *
 * @example
 * ```tsx
 * const { reducedMotion } = useThemeStore(s => s.config)
 * const motion = getMotionConfig(reducedMotion)
 *
 * // Use in inline styles or framer-motion / CSS transitions
 * element.style.transitionDuration = motion.duration
 * element.style.transitionTimingFunction = motion.easing
 * ```
 */
export function getMotionConfig(reducedMotion: boolean): MotionConfig {
  if (reducedMotion) {
    // Req 8.1, 8.2: all animation/transition durations effectively 0
    return {
      duration: '0ms',
      easing: 'linear',
      stagger: 0,
    }
  }

  return {
    duration: 'var(--duration-normal)',
    easing: 'var(--ease-out)',
    stagger: 40, // ms between items in stagger sequences
  }
}

// ============================================================
// isReducedMotionActive
// ============================================================

/**
 * Checks whether reduced motion is currently active by inspecting both
 * the OS media query and the DOM data-reduced-motion attribute.
 *
 * This is a runtime helper for components that need to check the current
 * state without subscribing to the ThemeStore.
 *
 * Req 8.1 — OS prefers-reduced-motion: reduce
 * Req 8.2 — manual data-reduced-motion="true" attribute
 *
 * @returns true if either the OS preference or manual override is active
 */
export function isReducedMotionActive(): boolean {
  if (typeof window === 'undefined') return false

  const osPrefers = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const manualOverride =
    document.documentElement.getAttribute('data-reduced-motion') === 'true'

  return osPrefers || manualOverride
}
