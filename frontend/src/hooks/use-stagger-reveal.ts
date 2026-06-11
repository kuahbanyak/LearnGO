import { useEffect, useRef } from 'react'

/**
 * Options for the stagger reveal animation.
 */
export interface StaggerRevealOptions {
  /**
   * CSS selector for child elements to animate within the container.
   * Defaults to '.stagger-item'.
   */
  selector?: string
  /**
   * Delay increment per item in milliseconds.
   * Defaults to 50ms (Requirement 7.2).
   */
  delay?: number
  /**
   * Transition duration for each item in milliseconds.
   * Defaults to 250ms (--duration-normal).
   */
  duration?: number
  /**
   * Maximum total delay cap in milliseconds.
   * Defaults to 1000ms (Requirement 7.2).
   */
  maxDelay?: number
}

/**
 * useStaggerReveal
 *
 * Observes child elements within a container and reveals them with a
 * staggered animation when they enter the viewport. Uses IntersectionObserver
 * with a threshold of 0.1 (10% visibility triggers reveal).
 *
 * Animation: opacity 0 → 1, translateY(8px) → translateY(0)
 * Only transform and opacity are animated (compositor-friendly, Requirement 7.3).
 *
 * The observer is cleaned up after all items are revealed or on unmount
 * (Requirement 7.4).
 *
 * Respects prefers-reduced-motion: when active, all items are revealed
 * immediately without animation (Requirements 8.1, 8.2).
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4
 *
 * @param containerRef - Ref to the container element whose children to animate
 * @param options - Optional configuration for selector, delay, duration, maxDelay
 *
 * @example
 * ```tsx
 * const containerRef = useRef<HTMLDivElement>(null)
 * useStaggerReveal(containerRef)
 *
 * return (
 *   <div ref={containerRef}>
 *     <div className="stagger-item">Item 1</div>
 *     <div className="stagger-item">Item 2</div>
 *   </div>
 * )
 * ```
 */
export function useStaggerReveal(
  containerRef: React.RefObject<HTMLElement | null>,
  options: StaggerRevealOptions = {}
): void {
  const {
    selector = '.stagger-item',
    delay = 50,
    duration = 250,
    maxDelay = 1000,
  } = options

  // Store options in a ref so the effect doesn't re-run when they change
  const optionsRef = useRef({ selector, delay, duration, maxDelay })
  optionsRef.current = { selector, delay, duration, maxDelay }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const { selector, delay, duration, maxDelay } = optionsRef.current

    // Check for reduced motion preference (OS-level or manual via data attribute)
    const prefersReducedMotion =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.getAttribute('data-reduced-motion') === 'true'

    const items = Array.from(container.querySelectorAll<HTMLElement>(selector))
    if (items.length === 0) return

    // Under reduced motion: reveal all items immediately without animation
    if (prefersReducedMotion) {
      items.forEach((item) => {
        item.classList.add('revealed')
      })
      return
    }

    // Track how many items have been revealed to clean up observer when done
    let revealedCount = 0
    const totalItems = items.length

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement
            const index = items.indexOf(element)

            // Cap the delay at maxDelay (default 1000ms) — Requirement 7.2
            const itemDelay = Math.min(index * delay, maxDelay)

            element.style.transitionDelay = `${itemDelay}ms`
            element.style.transitionDuration = `${duration}ms`
            element.classList.add('revealed')

            // Unobserve each item after it's revealed
            observer.unobserve(entry.target)
            revealedCount++

            // Clean up observer when all items have been revealed — Requirement 7.4
            if (revealedCount >= totalItems) {
              observer.disconnect()
            }
          }
        })
      },
      { threshold: 0.1 }
    )

    items.forEach((item) => observer.observe(item))

    // Cleanup on unmount — Requirement 7.4
    return () => {
      observer.disconnect()
    }
  }, [containerRef])
}
