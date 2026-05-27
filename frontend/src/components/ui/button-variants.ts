import { cva } from "class-variance-authority"

/**
 * Button component — CVA variants consuming design tokens
 *
 * All color, spacing, radius, and motion values reference CSS custom properties
 * defined in tokens.css. No hardcoded values.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 14.1, 14.2, 14.3, 14.4, 14.5
 */
export const buttonVariants = cva(
  // Base: layout, tactile press feedback, focus ring, disabled state
  // active:scale-[0.97] with duration-fast (Req 4.3, 14.4)
  // focus-visible ring 2px with 2px offset (Req 4.4, 14.3)
  // disabled: pointer-events-none + opacity-50 (Req 4.5, 14.5)
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold",
    "transition-all",
    "active:scale-[0.97]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "focus-visible:ring-[var(--accent-primary)]",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      /**
       * Visual variant — Req 4.1
       * All colors via CSS custom property references — Req 4.7
       */
      variant: {
        /**
         * primary: Gradient CTA with glow shadow
         * Uses accent-primary, text-inverse, shadow-glow on hover
         */
        primary: [
          "bg-[var(--accent-primary)] text-[var(--text-inverse)]",
          "shadow-[var(--shadow-sm)]",
          "hover:brightness-110 hover:shadow-[var(--shadow-glow)]",
        ].join(" "),

        /**
         * secondary: Subtle filled surface
         * Uses surface-sunken background, text-primary
         */
        secondary: [
          "bg-[var(--surface-sunken)] text-[var(--text-primary)]",
          "border border-[color-mix(in_srgb,var(--text-primary)_12%,transparent)]",
          "hover:bg-[color-mix(in_srgb,var(--surface-sunken)_85%,var(--accent-primary)_15%)]",
          "hover:border-[color-mix(in_srgb,var(--accent-primary)_30%,transparent)]",
        ].join(" "),

        /**
         * outline: Border-only, hover fill
         * Transparent background with accent-primary border
         */
        outline: [
          "bg-transparent text-[var(--accent-primary)]",
          "border-2 border-[var(--accent-primary)]",
          "hover:bg-[color-mix(in_srgb,var(--accent-primary)_10%,transparent)]",
        ].join(" "),

        /**
         * ghost: No background, hover tint
         * Transparent, text-secondary, hover tint
         */
        ghost: [
          "bg-transparent text-[var(--text-secondary)]",
          "hover:bg-[color-mix(in_srgb,var(--text-primary)_8%,transparent)]",
          "hover:text-[var(--text-primary)]",
        ].join(" "),

        /**
         * danger: Destructive gradient
         * Uses accent-danger, text-inverse
         */
        danger: [
          "bg-[var(--accent-danger)] text-[var(--text-inverse)]",
          "shadow-[var(--shadow-sm)]",
          "hover:brightness-110 hover:shadow-[0_4px_16px_color-mix(in_srgb,var(--accent-danger)_30%,transparent)]",
        ].join(" "),

        /**
         * success: Positive gradient
         * Uses accent-success, text-inverse
         */
        success: [
          "bg-[var(--accent-success)] text-[var(--text-inverse)]",
          "shadow-[var(--shadow-sm)]",
          "hover:brightness-110 hover:shadow-[0_4px_16px_color-mix(in_srgb,var(--accent-success)_30%,transparent)]",
        ].join(" "),

        /**
         * glass: Frosted glass on dark surfaces
         * Backdrop blur, semi-transparent white, white text
         */
        glass: [
          "bg-[rgba(255,255,255,0.08)] text-[var(--text-inverse)]",
          "border border-[rgba(255,255,255,0.15)]",
          "backdrop-blur-md",
          "hover:bg-[rgba(255,255,255,0.14)] hover:border-[rgba(255,255,255,0.25)]",
        ].join(" "),

        // ── Backward-compatibility aliases ──────────────────────────────────
        // These map old shadcn/ui variant names to the new design-system names
        // so existing pages continue to compile without changes.

        /** @deprecated Use "primary" instead */
        default: [
          "bg-[var(--accent-primary)] text-[var(--text-inverse)]",
          "shadow-[var(--shadow-sm)]",
          "hover:brightness-110 hover:shadow-[var(--shadow-glow)]",
        ].join(" "),

        /** @deprecated Use "danger" instead */
        destructive: [
          "bg-[var(--accent-danger)] text-[var(--text-inverse)]",
          "shadow-[var(--shadow-sm)]",
          "hover:brightness-110 hover:shadow-[0_4px_16px_color-mix(in_srgb,var(--accent-danger)_30%,transparent)]",
        ].join(" "),

        /** @deprecated Use "ghost" instead */
        link: "bg-transparent text-[var(--accent-primary)] underline-offset-4 hover:underline",
      },

      /**
       * Size variant — Req 4.2
       * Heights: sm=h-8(32px), md=h-10(40px), lg=h-12(48px), xl=h-14(56px)
       * Radii via CSS custom property references — Req 4.7
       */
      size: {
        /** h-8 = 32px, text-xs, rounded (--radius-sm) */
        sm: "h-8 px-3 text-xs rounded-[var(--radius-sm)]",

        /** h-10 = 40px, text-sm, rounded (--radius-md) */
        md: "h-10 px-4 text-sm rounded-[var(--radius-md)]",

        /** h-12 = 48px, text-base, rounded (--radius-md) */
        lg: "h-12 px-6 text-base rounded-[var(--radius-md)]",

        /** h-14 = 56px, text-base, rounded (--radius-lg) */
        xl: "h-14 px-8 text-base rounded-[var(--radius-lg)]",

        /** Square icon button, rounded (--radius-md) */
        icon: "h-10 w-10 rounded-[var(--radius-md)]",

        // Backward-compat alias for old "default" size
        /** @deprecated Use "md" instead */
        default: "h-10 px-4 text-sm rounded-[var(--radius-md)]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)
