import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "./button-variants"

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
        {/* Loading spinner - stable container with conditional content */}
        <span className="inline-flex shrink-0 items-center justify-center" style={{ width: "1em", height: "1em" }}>
          {loading && (
            <Loader2
              className="animate-spin"
              style={{ width: "1em", height: "1em" }}
              aria-hidden="true"
            />
          )}
        </span>

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
