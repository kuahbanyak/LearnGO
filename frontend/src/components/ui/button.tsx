import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Button component — CVA variants consuming design tokens
 *
 * All color, spacing, radius, and motion values reference CSS custom properties
 * defined in tokens.css. No hardcoded values.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 14.1, 14.2, 14.3, 14.4, 14.5
 */
const buttonVariants = cva(
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

/**
 * ButtonProps — extends native button attributes with CVA variants
 * and design-system-specific props.
 *
 * loading: shows spinner, prevents pointer events (Req 4.6)
 * leftIcon / rightIcon: optional icon slots
 * asChild: renders as a Radix Slot (for use with Link, a, etc.)
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * When true, renders the button's child as the root element via Radix Slot.
   * Useful for wrapping router Link components.
   */
  asChild?: boolean
  /** Shows a spinner and prevents pointer events while true (Req 4.6) */
  loading?: boolean
  /** Icon rendered to the left of the label */
  leftIcon?: React.ReactNode
  /** Icon rendered to the right of the label */
  rightIcon?: React.ReactNode
}

/**
 * Button
 *
 * Primary interactive element with tactile feedback, gradient CTAs,
 * and concept-appropriate variants. All visual values reference CSS
 * custom properties from the design token system.
 *
 * @example
 * <Button variant="primary" size="lg">Book Appointment</Button>
 * <Button variant="danger" loading>Deleting...</Button>
 * <Button variant="outline" leftIcon={<Plus />}>Add Patient</Button>
 * <Button asChild variant="ghost"><Link to="/dashboard">Dashboard</Link></Button>
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      style,
      ...props
    },
    ref
  ) => {
    // Merge loading into disabled so the button is non-interactive while loading
    const isDisabled = disabled || loading

    if (asChild) {
      return (
        <Slot
          ref={ref}
          className={cn(buttonVariants({ variant, size }), className)}
          style={{
            transitionDuration: "var(--duration-fast)",
            ...style,
          }}
          {...props}
        >
          {children}
        </Slot>
      )
    }

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={cn(
          buttonVariants({ variant, size }),
          // Loading state: prevent pointer events (already handled by disabled,
          // but explicit class ensures it even without the disabled attribute)
          loading && "pointer-events-none",
          className
        )}
        // Apply transition duration via CSS custom property — Req 4.3, 4.7
        style={{
          transitionDuration: "var(--duration-fast)",
          ...style,
        }}
        {...props}
      >
        {/* Loading spinner — Req 4.6 */}
        {loading && (
          <Loader2
            className="animate-spin"
            style={{ width: "1em", height: "1em" }}
            aria-hidden="true"
          />
        )}

        {/* Left icon slot (hidden while loading to avoid double icon) */}
        {!loading && leftIcon && (
          <span className="inline-flex shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        )}

        {/* Button label */}
        {children}

        {/* Right icon slot */}
        {!loading && rightIcon && (
          <span className="inline-flex shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
