# Requirements Document

## Introduction

This document defines the formal requirements for migrating MediQueue's frontend from its current generic Tailwind/Radix styling to a concept-led design system called "soft machine medical." The migration introduces a CSS custom property-based design token system, a structured typography hierarchy, CVA-based component variants, a multi-mode theme system (light, dark, high-contrast), motion/animation with accessibility support, and robust error handling for font loading, theme persistence, and token resolution. The migration is non-destructive — existing functionality, routing, state management, and API layer remain untouched.

## Glossary

- **Design_Token_System**: The CSS custom property layer that defines all visual tokens (colors, spacing, radii, motion, elevation) consumed by components
- **Theme_Store**: The Zustand-based state management module responsible for persisting and applying theme configuration
- **Token_Schema**: The structured definition of all design tokens organized by category (colors, typography, spacing, radii, motion, elevation)
- **CVA_Variant_System**: The class-variance-authority based system for defining component visual variants
- **Typography_System**: The type hierarchy defining display, heading, body, label, and mono scales with associated font families
- **Motion_System**: The animation and transition configuration layer that manages stagger reveals, easing curves, and reduced-motion compliance
- **Theme_Resolver**: The function that applies theme configuration to the DOM via data attributes and CSS custom properties
- **Font_Loading_Strategy**: The approach for loading custom fonts (Space Grotesk, Plus Jakarta Sans, JetBrains Mono) with fallback handling
- **High_Contrast_Mode**: The theme variant designed for TV displays and real-time queue surfaces using neon energy aesthetics
- **Category_Color**: A stable color assignment for a product domain (admin, doctor, patient, queue) that remains consistent across all surfaces

## Requirements

### Requirement 1: Design Token Definition

**User Story:** As a frontend developer, I want all visual values defined as CSS custom properties, so that components consume a single source of truth and themes can switch without JavaScript re-renders.

#### Acceptance Criteria

1. THE Design_Token_System SHALL define CSS custom properties on the `:root` selector for surface colors (ground, raised, overlay, sunken), text colors (primary, secondary, tertiary, inverse), accent colors (primary, secondary, success, warning, danger, info), and category colors (admin, doctor, patient, queue)
2. THE Design_Token_System SHALL define CSS custom properties on the `:root` selector for spacing scale (space-1 through space-16) using a base unit of 4px with linear progression (space-1 = 4px, space-2 = 8px, … space-16 = 64px), border radii (sm, md, lg, full), motion easing (out, spring), motion durations (fast = 150ms, normal = 250ms, slow = 350ms), and elevation shadows (sm, md, lg, glow)
3. THE Design_Token_System SHALL define CSS custom properties on the `:root` selector for font families (display, body, mono)
4. WHEN a component references a color, spacing, radius, motion, font-family, or elevation value, THE component SHALL use a CSS custom property reference rather than a hardcoded value
5. IF a CSS custom property is undefined in the current theme, THEN THE Design_Token_System SHALL provide a fallback value via the CSS var() function that resolves to the corresponding light-theme default token value
6. WHEN a theme class is applied to a parent element, THE Design_Token_System SHALL override the `:root` token values using CSS specificity so that all descendant components re-theme without JavaScript re-renders

### Requirement 2: Theme System

**User Story:** As a user, I want to switch between light, dark, and high-contrast themes, so that I can use the application in different environments including TV displays.

#### Acceptance Criteria

1. THE Theme_Store SHALL support three theme modes: light, dark, and high-contrast
2. WHEN the user selects a theme mode, THE Theme_Resolver SHALL set the data-theme attribute on the document root element to the selected mode value
3. WHEN the data-theme attribute changes, THE Design_Token_System SHALL resolve all custom properties to the values defined for that theme via CSS cascade
4. WHEN the user selects a theme mode or modifies a theme setting, THE Theme_Store SHALL persist the complete theme configuration (mode, fontScale, reducedMotion) to localStorage within 100ms of the change
5. WHEN the application loads, THE Theme_Store SHALL restore the previously persisted theme configuration
6. IF the persisted theme configuration is corrupted or contains invalid values (mode not one of light/dark/high-contrast, fontScale outside the range 0.5 to 3.0, or reducedMotion not a boolean), THEN THE Theme_Store SHALL discard the persisted configuration and fall back to default values (mode: light, fontScale: 1, reducedMotion: false)
7. IF no user theme preference is persisted and the operating system reports prefers-color-scheme as dark on application load, THEN THE Theme_Store SHALL set the theme mode to dark; otherwise THE Theme_Store SHALL set the theme mode to light
8. WHEN a theme switch occurs, THE Theme_Resolver SHALL complete the visual update within a single animation frame (16ms at 60fps) with zero Cumulative Layout Shift
9. IF localStorage is unavailable or write operations fail, THEN THE Theme_Store SHALL apply the selected theme configuration for the current session without persistence and without displaying an error to the user

### Requirement 3: Typography System

**User Story:** As a designer, I want a structured type hierarchy with editorial display fonts and geometric body fonts, so that the interface communicates the product's identity through typography.

#### Acceptance Criteria

1. THE Typography_System SHALL define a display scale (display-xl, display-lg) using the display font family (Space Grotesk) with fluid sizing via clamp(), where display-xl ranges from a minimum of 36px to a maximum of 72px and display-lg ranges from a minimum of 28px to a maximum of 48px
2. THE Typography_System SHALL define a heading scale (heading-lg, heading-md, heading-sm) using the body font family (Plus Jakarta Sans) with font-weight of 600 or 700
3. THE Typography_System SHALL define a body scale (body-lg, body-md, body-sm) using the body font family with line heights between 1.5 and 1.75
4. THE Typography_System SHALL define a label scale (label-lg, label-md, label-sm) using the body font family with letter-spacing between 0.01em and 0.05em and font-weight of 500 or 600
5. THE Typography_System SHALL define a mono scale (mono-xl, mono-lg, mono-md) using JetBrains Mono for queue numbers and data display
6. WHEN the user adjusts the font scale setting, THE Typography_System SHALL scale all text sizes proportionally using the --font-scale custom property
7. THE Typography_System SHALL constrain the font scale to one of the allowed values: 0.875, 1, 1.125, or 1.25
8. IF the font scale setting receives a value other than 0.875, 1, 1.125, or 1.25, THEN THE Typography_System SHALL reject the value and retain the current font scale setting

### Requirement 4: Component Migration (Button)

**User Story:** As a frontend developer, I want Button components defined with CVA variants consuming design tokens, so that buttons have consistent tactile feedback and concept-appropriate styling.

#### Acceptance Criteria

1. THE CVA_Variant_System SHALL define Button variants: primary, secondary, outline, ghost, danger, success, and glass, with a default of primary when no variant is specified
2. THE CVA_Variant_System SHALL define Button sizes: sm (height 32px), md (height 40px), lg (height 48px), xl (height 56px), and icon (square aspect ratio), with a default of md when no size is specified
3. WHEN a Button is pressed, THE Button component SHALL apply a scale transform of 0.97 with a transition duration of var(--duration-fast) (150ms) for tactile feedback
4. WHEN a Button receives focus via keyboard, THE Button component SHALL display a 2px focus ring with 2px ring-offset using the focus-visible pseudo-class
5. WHILE a Button is in the disabled state, THE Button component SHALL prevent pointer events and reduce opacity to 0.5
6. WHILE a Button is in the loading state, THE Button component SHALL display a spinner animation in place of or adjacent to the button label, and SHALL prevent pointer events
7. THE Button component SHALL apply all color, spacing, radius, and motion values via CSS custom property references (design tokens) rather than hardcoded values

### Requirement 5: Component Migration (Card)

**User Story:** As a frontend developer, I want Card components with surface hierarchy variants, so that content containers communicate depth and interactivity through the design system.

#### Acceptance Criteria

1. THE CVA_Variant_System SHALL define Card surface variants: raised, glass, elevated, sunken, and interactive, with raised as the default when no surface prop is provided
2. THE CVA_Variant_System SHALL define Card padding variants: none, sm, md, and lg, with md as the default when no padding prop is provided
3. WHEN a Card has the interactive surface variant and receives pointer hover, THE Card component SHALL apply a vertical translate of -2px and the --shadow-glow elevation token within var(--duration-fast) transition duration
4. THE Card component SHALL use the --radius-lg token for border radius
5. WHILE a Card has a non-interactive surface variant (raised, glass, elevated, or sunken), THE Card component SHALL NOT apply hover lift or glow effects on pointer hover

### Requirement 6: Component Migration (StatCard)

**User Story:** As a dashboard user, I want metric cards with category color coding and trend indicators, so that I can quickly scan key statistics with visual differentiation.

#### Acceptance Criteria

1. THE StatCard component SHALL accept required props: title (string), value (string or number), icon (icon component), and optional props: category, trend, animate, and className
2. WHEN a category prop is specified from the set (admin, doctor, patient, queue, success, warning), THE StatCard component SHALL apply the corresponding category color token to the icon container background and the icon foreground color
3. IF no category prop is provided, THEN THE StatCard component SHALL apply the default accent-primary token for the icon container background and icon foreground color
4. WHEN a trend prop is provided with a numeric value and a direction of "up", "down", or "flat", THE StatCard component SHALL display a directional arrow indicator (up arrow, down arrow, or horizontal dash) alongside the formatted trend value as a percentage
5. WHEN the animate prop is true, THE StatCard component SHALL apply a scale-and-fade entrance animation (from opacity 0 and scale 0.95 to opacity 1 and scale 1) on mount using only transform and opacity properties with a duration of var(--duration-normal)
6. THE StatCard component SHALL use design tokens for all visual values including surface color (--surface-raised), text colors (--text-primary, --text-secondary), spacing (--space-4, --space-6), and border radius (--radius-lg)

### Requirement 7: Motion and Animation System

**User Story:** As a user, I want smooth stagger reveal animations for lists and grids, so that the interface feels alive and rewards attention without sacrificing performance.

#### Acceptance Criteria

1. THE Motion_System SHALL define easing curves (ease-out, ease-spring) and durations (fast: 150ms, normal: 250ms, slow: 400ms) as CSS custom properties
2. WHEN a container with stagger-reveal items enters the viewport (at least 10% visible per IntersectionObserver threshold), THE Motion_System SHALL animate each child element from initial state (opacity: 0, translateY: 8px) to final state (opacity: 1, translateY: 0) with a sequential delay of 50ms per item index, capped at a maximum total delay of 1000ms regardless of item count
3. THE Motion_System SHALL use only transform and opacity properties for animations to ensure compositor-friendly rendering
4. WHEN all items in a stagger container have been revealed, THE Motion_System SHALL clean up the IntersectionObserver for that container

### Requirement 8: Accessibility — Reduced Motion

**User Story:** As a user with motion sensitivity, I want animations disabled when I indicate a preference for reduced motion, so that the interface remains usable without triggering discomfort.

#### Acceptance Criteria

1. WHEN the operating system prefers-reduced-motion: reduce media query is active, THE Motion_System SHALL set all animation-duration and transition-duration values to 0.01ms
2. WHEN the user manually enables reduced motion in the Theme_Store, THE Motion_System SHALL set all animation-duration and transition-duration values to 0.01ms regardless of the operating system preference
3. WHILE reduced motion is active (via operating system preference or Theme_Store manual setting), THE Motion_System SHALL permit only opacity transitions with a duration of 150ms or less, and SHALL suppress all transform, layout, and positional transitions
4. THE Motion_System SHALL apply a global CSS safety net rule using @media (prefers-reduced-motion: reduce) that sets all animation-duration and transition-duration properties to 0.01ms, overriding component-level values
5. WHEN the user disables the manual reduced motion setting in the Theme_Store while the operating system prefers-reduced-motion: reduce media query is not active, THE Motion_System SHALL restore all animation-duration and transition-duration values to their default theme values within 100ms of the setting change

### Requirement 9: Accessibility — Contrast Compliance

**User Story:** As a user with visual impairments, I want all text to meet WCAG AA contrast requirements, so that content remains readable across all theme modes.

#### Acceptance Criteria

1. THE Design_Token_System SHALL ensure that all text-primary on surface-ground combinations achieve a contrast ratio of at least 4.5:1 in each of the three theme modes (light, dark, high-contrast)
2. THE Design_Token_System SHALL ensure that all text-secondary on surface-ground combinations achieve a contrast ratio of at least 4.5:1 in each of the three theme modes (light, dark, high-contrast)
3. THE Design_Token_System SHALL ensure that text-tertiary on surface-ground combinations achieve a contrast ratio of at least 3:1 in each of the three theme modes (light, dark, high-contrast)
4. THE Design_Token_System SHALL ensure that large text (display and heading scales at 18px or above) on any surface token (ground, raised, overlay, sunken) achieves a contrast ratio of at least 3:1 in each of the three theme modes
5. THE Design_Token_System SHALL ensure that text-primary and text-secondary on surface-raised and surface-overlay combinations achieve a contrast ratio of at least 4.5:1 in each of the three theme modes
6. THE Design_Token_System SHALL ensure that non-text UI elements (icons, borders, focus rings) used to convey meaning achieve a contrast ratio of at least 3:1 against their adjacent surface token in each of the three theme modes

### Requirement 10: Accessibility — Font Scaling

**User Story:** As a user who needs larger text, I want to adjust the font scale, so that all text in the application becomes proportionally larger while maintaining layout integrity.

#### Acceptance Criteria

1. THE Theme_Store SHALL expose a setFontScale action that accepts values from the set [0.875, 1, 1.125, 1.25] with a default value of 1
2. WHEN the font scale is changed, THE Theme_Resolver SHALL update the --font-scale CSS custom property on the document root within 100ms
3. IF a font scale value outside the allowed set is provided, THEN THE Theme_Store SHALL discard the value, maintain the current scale unchanged, and return a failure indicator to the caller
4. WHEN font scale is applied, THE Typography_System SHALL produce computed text sizes for all text elements (body, headings, labels, captions) within the range of 12px to 48px at every allowed scale value
5. WHEN font scale is applied, THE Layout_System SHALL render all views without text truncation, element overlap, or horizontal scrollbar at every allowed scale value
6. WHEN the user sets a font scale value, THE Theme_Store SHALL persist the selected value so that it is restored on the next application load

### Requirement 11: Font Loading and Resilience

**User Story:** As a user on a slow or unreliable connection, I want the application to remain usable even if custom fonts fail to load, so that content is always readable.

#### Acceptance Criteria

1. THE Font_Loading_Strategy SHALL use font-display: swap for all custom font declarations (Space Grotesk, Plus Jakarta Sans, JetBrains Mono)
2. WHEN a custom font fails to load within 3 seconds, THE Typography_System SHALL render text using the system font stack (system-ui, -apple-system, sans-serif for body/display; ui-monospace, monospace for mono) with a cumulative layout shift of less than 0.01
3. THE Font_Loading_Strategy SHALL use size-adjust, ascent-override, and descent-override in @font-face declarations for each fallback font so that line height differences between the fallback and custom font do not exceed 5%
4. THE Font_Loading_Strategy SHALL preload the primary body font (Plus Jakarta Sans Regular) and the display font (Space Grotesk Bold) via link rel="preload" with the font MIME type and crossorigin attribute
5. WHEN fonts are successfully loaded, THE Font_Loading_Strategy SHALL cache them using a cache-first strategy for subsequent visits with a maximum cache lifetime of 30 days
6. IF the font cache becomes unavailable or corrupt, THEN THE Font_Loading_Strategy SHALL re-fetch fonts from the network and fall back to the system font stack until loading completes

### Requirement 12: Zero-Runtime Theme Architecture

**User Story:** As a frontend developer, I want theme switching to occur entirely through CSS cascade without JavaScript re-renders, so that theme changes are instantaneous and performant.

#### Acceptance Criteria

1. THE Theme_Resolver SHALL switch themes by changing only the data-theme attribute on the document root element, supporting at minimum a light theme and a dark theme
2. WHEN the data-theme attribute changes, THE Design_Token_System SHALL resolve all color and surface token values purely through CSS custom property cascade without triggering React component re-renders, and the visual update SHALL complete within 16ms (one animation frame)
3. IF the data-theme attribute is set to an unsupported value, THEN THE Theme_Resolver SHALL fall back to the light theme without errors
4. THE Design_Token_System SHALL add zero additional JavaScript bytes to the bundle for token resolution, with all token values defined exclusively in CSS custom properties
5. THE Motion_System SHALL animate only transform and opacity properties, with transition durations between 150ms and 300ms for standard interactions, to avoid triggering layout recalculation

### Requirement 13: Category Color Consistency

**User Story:** As a user navigating between pages, I want category colors (admin, doctor, patient, queue) to remain visually consistent, so that I can rely on color as a navigation and identification cue.

#### Acceptance Criteria

1. THE Design_Token_System SHALL assign a single stable color value to each category (admin, doctor, patient, queue) per theme mode, where all four category colors are perceptually distinct from each other within the same theme
2. WHEN a category color is referenced on any page or component, THE Design_Token_System SHALL resolve to the same computed value for that category within the active theme
3. WHEN the theme mode changes, THE Design_Token_System SHALL update category colors to their theme-appropriate values atomically within a single animation frame while maintaining cross-component consistency within the new theme
4. WHEN a category color is used as foreground (icon color or text), THE category color SHALL achieve a contrast ratio of at least 3:1 against its adjacent background surface token

### Requirement 14: Interactive Element States

**User Story:** As a user, I want clear visual feedback on all interactive elements, so that I can understand what is clickable and what state it is in.

#### Acceptance Criteria

1. THE CVA_Variant_System SHALL define visual states for all interactive elements (buttons, links, interactive cards, form inputs, and toggles) such that each state produces a distinguishable change in at least one of: background-color, border-color, box-shadow, outline, transform, or opacity
2. WHEN an interactive element receives pointer hover, THE element SHALL transition at least one visual property (background-color, border-color, box-shadow, or transform) within 150ms using the var(--ease-out) easing curve
3. WHEN an interactive element receives keyboard focus via the :focus-visible selector, THE element SHALL display a focus ring with a minimum width of 2px and a minimum contrast ratio of 3:1 against adjacent colors
4. WHILE an interactive element is in the pressed/active state, THE element SHALL apply a scale transform of scale(0.97) with a transition duration no greater than 150ms
5. WHILE an interactive element is disabled, THE element SHALL apply an opacity of 0.5, set pointer-events to none, and remove the element from the tab order or indicate its disabled state to assistive technology via aria-disabled
6. WHILE reduced motion is active, THE CVA_Variant_System SHALL apply hover and pressed state changes instantaneously (duration of 0.01ms) while preserving the visual property differences between states
7. IF an interactive element is disabled and receives programmatic focus, THEN THE element SHALL NOT display the focus-visible ring

### Requirement 15: Theme Configuration Validation

**User Story:** As a developer, I want theme configuration values validated at the store level, so that invalid states cannot corrupt the UI.

#### Acceptance Criteria

1. THE Theme_Store SHALL validate that accentHue is an integer greater than or equal to 0 and less than 360
2. THE Theme_Store SHALL validate that fontScale is one of [0.875, 1, 1.125, 1.25]
3. THE Theme_Store SHALL validate that mode is one of ['light', 'dark', 'high-contrast']
4. IF any configuration value fails validation on hydration, THEN THE Theme_Store SHALL replace the invalid value with its default (accentHue: 210, fontScale: 1, mode: 'light') and persist the corrected configuration
5. IF a programmatic update attempts to set a configuration value that fails validation, THEN THE Theme_Store SHALL reject the update, retain the current valid value, and not persist the invalid value
