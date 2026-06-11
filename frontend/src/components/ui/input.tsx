import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Input component — all color, border, and spacing values reference
 * CSS custom properties from tokens.css.
 *
 * Requirements: 1.4, 14.1, 14.2, 14.3
 */
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Layout & shape
          "flex h-11 w-full px-4 py-3 text-sm",
          "rounded-[var(--radius-md,0.75rem)]",
          // Colors via design tokens
          "bg-[var(--surface-raised,#ffffff)]",
          "text-[var(--text-primary,#1a1714)]",
          "border-2 border-[color-mix(in_srgb,var(--text-primary)_15%,transparent)]",
          // Placeholder
          "placeholder:text-[var(--text-tertiary,#6b6358)]",
          // Transition
          "transition-all",
          "duration-[var(--duration-fast,150ms)]",
          // Focus — design token ring (Req 14.3)
          "focus-visible:outline-none",
          "focus-visible:ring-2",
          "focus-visible:ring-[var(--accent-primary)]",
          "focus-visible:ring-offset-2",
          "focus-visible:border-[var(--accent-primary)]",
          // Disabled (Req 14.5)
          "disabled:cursor-not-allowed",
          "disabled:opacity-50",
          "disabled:bg-[var(--surface-sunken,#f0ede8)]",
          // File input reset
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
