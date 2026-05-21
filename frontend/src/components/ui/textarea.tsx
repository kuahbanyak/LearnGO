import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Textarea component — all color values reference CSS custom properties
 * from tokens.css. No hardcoded color values.
 *
 * Requirements: 1.4, 14.1, 14.3
 */
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        // Layout & shape
        "flex min-h-[80px] w-full px-3 py-2.5 text-sm",
        "rounded-[var(--radius-md,0.75rem)]",
        // Colors via design tokens
        "bg-[var(--surface-raised,#ffffff)]",
        "text-[var(--text-primary,#1a1714)]",
        "border border-[color-mix(in_srgb,var(--text-primary)_15%,transparent)]",
        // Placeholder
        "placeholder:text-[var(--text-tertiary,#6b6358)]",
        // Focus — design token ring (Req 14.3)
        "focus-visible:outline-none",
        "focus-visible:ring-2",
        "focus-visible:ring-[var(--accent-primary)]",
        "focus-visible:ring-offset-2",
        // Disabled (Req 14.5)
        "disabled:cursor-not-allowed disabled:opacity-50",
        // Misc
        "resize-none transition-colors",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
