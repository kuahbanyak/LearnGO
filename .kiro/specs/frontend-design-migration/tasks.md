# Implementation Plan: Frontend Design Migration

## Overview

Migrate MediQueue's frontend from generic Tailwind/Radix styling to the "soft machine medical" design system. The implementation proceeds in layers: design tokens (CSS custom properties) → typography → theme store → component migration → motion system → accessibility → integration wiring. All code is TypeScript with CSS, using Vitest + fast-check for testing.

## Tasks

- [x] 1. Set up design token foundation
  - [x] 1.1 Create the CSS custom properties token file (tokens.css)
    - Define `:root` tokens for surface colors (ground, raised, overlay, sunken), text colors (primary, secondary, tertiary, inverse), accent colors (primary, secondary, success, warning, danger, info), and category colors (admin, doctor, patient, queue)
    - Define spacing scale (space-1 through space-16, base 4px linear), border radii (sm, md, lg, full), motion easing (out, spring), motion durations (fast: 150ms, normal: 250ms, slow: 350ms/400ms), and elevation shadows (sm, md, lg, glow)
    - Define font family tokens (display, body, mono)
    - Ensure all values use CSS `var()` with fallback values resolving to light-theme defaults
    - _Requirements: 1.1, 1.2, 1.3, 1.5_

  - [x] 1.2 Create theme-specific token overrides for light, dark, and high-contrast modes
    - Define `[data-theme="light"]`, `[data-theme="dark"]`, and `[data-theme="high-contrast"]` selectors with mode-specific color values
    - Ensure text-primary on surface-ground achieves ≥4.5:1 contrast in all modes
    - Ensure text-secondary on surface-ground achieves ≥4.5:1 contrast in all modes
    - Ensure text-tertiary on surface-ground achieves ≥3:1 contrast in all modes
    - Ensure category colors are perceptually distinct within each theme and achieve ≥3:1 contrast as foreground on adjacent surfaces
    - _Requirements: 1.6, 2.1, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 13.1, 13.4_

  - [ ]* 1.3 Write property test for token completeness (Property 1)
    - **Property 1: Token Completeness**
    - For any component render, all referenced CSS custom properties exist in the active theme's token schema with no hardcoded values
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**

  - [ ]* 1.4 Write property test for contrast compliance (Property 3)
    - **Property 3: Contrast Compliance**
    - For any theme mode and any text/surface token pair, computed contrast ratio ≥4.5:1 for body text and ≥3:1 for large text
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**

- [x] 2. Implement typography system
  - [x] 2.1 Create the typography CSS file (type.css)
    - Define display scale (display-xl, display-lg) using Space Grotesk with fluid clamp() sizing
    - Define heading scale (heading-lg, heading-md, heading-sm) using Plus Jakarta Sans, weight 600-700
    - Define body scale (body-lg, body-md, body-sm) with line heights 1.5-1.75
    - Define label scale (label-lg, label-md, label-sm) with letter-spacing 0.01em-0.05em, weight 500-600
    - Define mono scale (mono-xl, mono-lg, mono-md) using JetBrains Mono
    - Integrate --font-scale custom property for proportional scaling
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 2.2 Implement font loading strategy with @font-face declarations
    - Add @font-face rules for Space Grotesk, Plus Jakarta Sans, and JetBrains Mono with font-display: swap
    - Add size-adjust, ascent-override, and descent-override for fallback fonts to keep CLS < 0.01
    - Add `<link rel="preload">` for Plus Jakarta Sans Regular and Space Grotesk Bold in the HTML head
    - Define system font stack fallbacks (system-ui, -apple-system, sans-serif for body/display; ui-monospace, monospace for mono)
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [ ]* 2.3 Write property test for font scale bounds (Property 11)
    - **Property 11: Font Scale Bounds**
    - For any valid font scale value and any body typography entry, computed text size falls within 12px-48px
    - **Validates: Requirements 3.6, 10.2, 10.4**

  - [ ]* 2.4 Write property test for font loading resilience (Property 7)
    - **Property 7: Font Loading Resilience**
    - For any font failure scenario, fallback renders without layout shift; font-display: swap is specified for all custom fonts
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4**

- [x] 3. Checkpoint - Ensure token and typography foundation is solid
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement theme store and resolver
  - [x] 4.1 Create the ThemeStore with Zustand and persistence
    - Implement ThemeState interface with config (mode, accentHue, reducedMotion, fontScale)
    - Implement setMode, toggleMode, setFontScale, setReducedMotion actions
    - Persist to localStorage with key 'mediqueue-theme'
    - On hydration, validate persisted config: mode ∈ {light, dark, high-contrast}, fontScale ∈ {0.875, 1, 1.125, 1.25}, accentHue ∈ [0, 360), reducedMotion is boolean
    - If validation fails, discard and use defaults (mode: 'light', fontScale: 1, reducedMotion: false, accentHue: 210)
    - If localStorage unavailable, apply config for session without persistence
    - _Requirements: 2.1, 2.4, 2.5, 2.6, 2.9, 10.1, 10.3, 10.6, 15.1, 15.2, 15.3, 15.4, 15.5_

  - [x] 4.2 Implement the ThemeResolver function
    - Set data-theme attribute on document.documentElement to config.mode
    - Set --font-scale CSS custom property on root
    - Set data-reduced-motion attribute when reducedMotion is true
    - Apply accent hue override via --accent-hue property
    - Respect prefers-color-scheme on first load when no persisted preference exists
    - Ensure visual update completes within single animation frame (16ms) with zero CLS
    - If data-theme is set to unsupported value, fall back to light theme
    - _Requirements: 2.2, 2.3, 2.7, 2.8, 10.2, 12.1, 12.2, 12.3_

  - [ ]* 4.3 Write property test for theme persistence round-trip (Property 9)
    - **Property 9: Theme Persistence Round-Trip**
    - For any valid ThemeConfig, persist → hydrate produces equivalent config; for corrupted data, hydration produces defaults
    - **Validates: Requirements 2.4, 2.5, 2.6, 15.4**

  - [ ]* 4.4 Write property test for theme configuration validation (Property 10)
    - **Property 10: Theme Configuration Validation**
    - For any input value, ThemeStore accepts only valid domain values and rejects all others while maintaining current state
    - **Validates: Requirements 15.1, 15.2, 15.3, 3.7, 10.1, 10.3**

- [x] 5. Checkpoint - Ensure theme system works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Migrate Button component
  - [x] 6.1 Implement Button with CVA variants consuming design tokens
    - Define variants: primary, secondary, outline, ghost, danger, success, glass (default: primary)
    - Define sizes: sm (h-8), md (h-10), lg (h-12), xl (h-14), icon (square) (default: md)
    - Apply tactile press feedback: active:scale-[0.97] with duration var(--duration-fast)
    - Apply focus-visible ring: 2px ring, 2px offset
    - Apply disabled state: pointer-events-none, opacity-0.5
    - Implement loading state with spinner, preventing pointer events
    - All color, spacing, radius, motion values via CSS custom property references
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 14.1, 14.2, 14.3, 14.4, 14.5_

  - [ ]* 6.2 Write unit tests for Button component
    - Test each variant renders correct classes
    - Test size variants produce correct dimensions
    - Test disabled state prevents interaction
    - Test loading state shows spinner
    - Test focus-visible ring appears on keyboard focus
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 7. Migrate Card component
  - [x] 7.1 Implement Card with CVA surface and padding variants
    - Define surface variants: raised (default), glass, elevated, sunken, interactive
    - Define padding variants: none, sm, md (default), lg
    - Interactive variant: hover lift (-2px translateY) + --shadow-glow within var(--duration-fast)
    - Non-interactive variants: no hover lift or glow effects
    - Use --radius-lg for border radius
    - Support polymorphic `as` prop (div, article, section)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 7.2 Write unit tests for Card component
    - Test surface variants render correct classes
    - Test interactive variant applies hover styles
    - Test non-interactive variants do not apply hover effects
    - Test padding variants
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 8. Migrate StatCard component
  - [x] 8.1 Implement StatCard with category colors and trend indicators
    - Accept required props: title, value, icon; optional: category, trend, animate, className
    - Apply category color tokens to icon container background and icon foreground when category specified
    - Default to accent-primary when no category provided
    - Display trend indicator with directional arrow and formatted percentage
    - Implement scale-and-fade entrance animation (opacity 0/scale 0.95 → opacity 1/scale 1) when animate=true
    - Use design tokens for all visual values (--surface-raised, --text-primary, --text-secondary, --space-4, --space-6, --radius-lg)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ]* 8.2 Write unit tests for StatCard component
    - Test category color application
    - Test default accent-primary when no category
    - Test trend indicator rendering (up, down, flat)
    - Test animate prop triggers entrance animation
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 8.3 Write property test for category color stability (Property 6)
    - **Property 6: Category Color Stability**
    - For any category and active theme, --category-C resolves to a single stable value identical across all pages/components
    - **Validates: Requirements 13.1, 13.2, 13.3, 6.2**

- [x] 9. Implement motion and animation system
  - [x] 9.1 Create the motion CSS file (motion.css) and stagger reveal hook
    - Define easing curves and durations as CSS custom properties
    - Implement useStaggerReveal hook using IntersectionObserver (threshold 0.1)
    - Animate children from opacity:0/translateY:8px to opacity:1/translateY:0 with 50ms stagger per item
    - Cap maximum total delay at 1000ms regardless of item count
    - Use only transform and opacity for compositor-friendly rendering
    - Clean up IntersectionObserver after all items revealed
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 9.2 Implement reduced motion support
    - Add global CSS rule: @media (prefers-reduced-motion: reduce) setting all animation/transition durations to 0.01ms
    - When data-reduced-motion attribute is present, override durations to 0.01ms
    - Permit only opacity transitions ≤150ms when reduced motion active
    - Suppress all transform, layout, and positional transitions under reduced motion
    - Restore default durations within 100ms when reduced motion is disabled and OS preference is not active
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 9.3 Write property test for motion safety (Property 4)
    - **Property 4: Motion Safety**
    - When reduced motion is active, getMotionConfig returns duration 0ms and stagger 0; no element has computed animation-duration > 0ms except opacity fades ≤150ms
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**

  - [ ]* 9.4 Write property test for stagger delay sequencing (Property 12)
    - **Property 12: Stagger Delay Sequencing**
    - For any container with N children, child at index i receives transition-delay of exactly i × baseDelay ms
    - **Validates: Requirements 7.2**

- [x] 10. Checkpoint - Ensure components and motion system work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implement interactive element states and accessibility
  - [x] 11.1 Define interactive states for all interactive elements
    - Ensure all interactive elements (buttons, links, interactive cards, form inputs, toggles) have distinct visual states for default, hover, focus-visible, active, disabled
    - Hover transitions within 150ms using var(--ease-out)
    - Focus-visible ring: minimum 2px width, ≥3:1 contrast against adjacent colors
    - Active/pressed: scale(0.97) within 150ms
    - Disabled: opacity 0.5, pointer-events none, removed from tab order or aria-disabled
    - Under reduced motion: state changes instantaneous (0.01ms) while preserving visual differences
    - Disabled elements do not show focus-visible ring on programmatic focus
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7_

  - [ ]* 11.2 Write property test for interactive feedback (Property 8)
    - **Property 8: Interactive Feedback**
    - For any interactive element and CVA variant, distinct visual states exist for default, hover, focus-visible, active, disabled
    - **Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5**

- [x] 12. Implement zero-runtime theme architecture validation
  - [x] 12.1 Ensure zero additional JS bytes for token resolution
    - Verify all token values defined exclusively in CSS custom properties
    - Verify theme switching changes only data-theme attribute (no React re-renders for color)
    - Verify motion animations use only transform and opacity with durations 150-300ms
    - Add CSS-only token resolution with no JavaScript in the bundle for design tokens
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ]* 12.2 Write property test for theme consistency (Property 2)
    - **Property 2: Theme Consistency**
    - For any theme T, switching causes data-theme update and all CSS properties resolve to T's values within one paint frame without React re-renders
    - **Validates: Requirements 2.2, 2.3, 2.8, 12.1, 12.2**

  - [ ]* 12.3 Write property test for layout stability (Property 5)
    - **Property 5: Layout Stability**
    - For any theme switch, only color/shadow/opacity change — never dimensions/padding/margin/position — resulting in zero CLS
    - **Validates: Requirements 2.8, 7.3, 12.4**

- [x] 13. Integration and wiring
  - [x] 13.1 Wire design system CSS files into the application entry point
    - Import tokens.css, type.css, motion.css in the correct order in the main CSS entry
    - Ensure Tailwind v4 processes the custom properties correctly
    - Verify token cascade works with existing Tailwind utilities
    - _Requirements: 1.1, 1.6, 12.4_

  - [x] 13.2 Integrate ThemeStore with application initialization
    - Initialize ThemeResolver on app mount
    - Apply persisted theme or detect system preference on first load
    - Wire theme toggle UI to ThemeStore actions
    - Ensure font scale and reduced motion settings are applied on load
    - _Requirements: 2.2, 2.5, 2.7, 10.2, 10.6_

  - [x] 13.3 Migrate existing pages to use new design tokens and components
    - Replace hardcoded color/spacing values with token references across existing components
    - Swap existing Button/Card/StatCard usages to new CVA-based components
    - Apply typography classes to page headers and content
    - Wire stagger reveal to dashboard grids and list views
    - _Requirements: 1.4, 4.7, 6.6_

  - [x] 13.4 Implement font caching strategy
    - Set up cache-first strategy for loaded fonts with 30-day max lifetime
    - Handle cache unavailability by re-fetching from network with system font fallback
    - _Requirements: 11.5, 11.6_

- [x] 14. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document using fast-check
- Unit tests validate specific examples and edge cases using Vitest + React Testing Library
- The migration is non-destructive: existing functionality, routing, state management, and API layer remain untouched
- All dependencies (Tailwind v4, CVA, Zustand, Radix) are already installed — only font packages are new
- TypeScript is used throughout for type safety

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1"] },
    { "id": 2, "tasks": ["1.3", "1.4", "2.2"] },
    { "id": 3, "tasks": ["2.3", "2.4", "4.1"] },
    { "id": 4, "tasks": ["4.2"] },
    { "id": 5, "tasks": ["4.3", "4.4", "6.1", "7.1", "8.1"] },
    { "id": 6, "tasks": ["6.2", "7.2", "8.2", "8.3"] },
    { "id": 7, "tasks": ["9.1"] },
    { "id": 8, "tasks": ["9.2", "9.3", "9.4"] },
    { "id": 9, "tasks": ["11.1"] },
    { "id": 10, "tasks": ["11.2", "12.1"] },
    { "id": 11, "tasks": ["12.2", "12.3", "13.1"] },
    { "id": 12, "tasks": ["13.2"] },
    { "id": 13, "tasks": ["13.3", "13.4"] }
  ]
}
```
