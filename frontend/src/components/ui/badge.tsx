import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Badge component — CVA variants consuming design tokens.
 *
 * All color values reference CSS custom properties from tokens.css.
 * No hardcoded color values.
 *
 * Requirements: 1.4, 4.7
 */
const badgeVariants = cva(
  "inline-flex items-center rounded-[var(--radius-full,9999px)] border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2",
  {
    variants: {
      variant: {
        /** Primary — accent-primary background, inverse text */
        default: [
          "border-transparent",
          "bg-[var(--accent-primary)]",
          "text-[var(--text-inverse)]",
          "hover:bg-[color-mix(in_srgb,var(--accent-primary)_85%,black)]",
        ].join(" "),

        /** Secondary — sunken surface, primary text */
        secondary: [
          "border-[color-mix(in_srgb,var(--text-primary)_12%,transparent)]",
          "bg-[var(--surface-sunken)]",
          "text-[var(--text-secondary)]",
          "hover:bg-[color-mix(in_srgb,var(--surface-sunken)_85%,var(--accent-primary)_15%)]",
        ].join(" "),

        /** Destructive — danger accent, inverse text */
        destructive: [
          "border-transparent",
          "bg-[var(--accent-danger)]",
          "text-[var(--text-inverse)]",
          "hover:bg-[color-mix(in_srgb,var(--accent-danger)_85%,black)]",
        ].join(" "),

        /** Outline — transparent background, primary text */
        outline: [
          "border-[color-mix(in_srgb,var(--text-primary)_20%,transparent)]",
          "text-[var(--text-primary)]",
        ].join(" "),

        /** Success — success accent tint background */
        success: [
          "border-[color-mix(in_srgb,var(--accent-success)_30%,transparent)]",
          "bg-[color-mix(in_srgb,var(--accent-success)_12%,transparent)]",
          "text-[var(--accent-success)]",
        ].join(" "),

        /** Warning — warning accent tint background */
        warning: [
          "border-[color-mix(in_srgb,var(--accent-warning)_30%,transparent)]",
          "bg-[color-mix(in_srgb,var(--accent-warning)_12%,transparent)]",
          "text-[var(--accent-warning)]",
        ].join(" "),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
