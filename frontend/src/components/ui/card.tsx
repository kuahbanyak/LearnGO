import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Card component with CVA surface and padding variants.
 *
 * Surface variants:
 *   raised      — Default card: subtle shadow + border on --surface-raised background
 *   glass       — Frosted glass: backdrop-blur with translucent surface
 *   elevated    — Stronger shadow, no border, for prominent containers
 *   sunken      — Inset background (--surface-sunken) for nested content areas
 *   interactive — Hover lift (-2px translateY) + --shadow-glow on pointer hover
 *
 * Padding variants:
 *   none — No padding
 *   sm   — p-4 (16px)
 *   md   — p-6 (24px, default)
 *   lg   — p-8 (32px)
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */
const cardVariants = cva(
  // Base: use --radius-lg token, transition only transform+box-shadow for performance
  "rounded-[var(--radius-lg,1rem)] transition-[transform,box-shadow] duration-[var(--duration-fast,150ms)]",
  {
    variants: {
      surface: {
        /**
         * raised — Default card surface.
         * Background: --surface-raised (white in light mode).
         * Subtle shadow + 1px border for definition.
         * No hover lift or glow (Req 5.5).
         */
        raised: [
          "bg-[var(--surface-raised,#ffffff)]",
          "border border-[rgba(26,23,20,0.08)]",
          "shadow-[var(--shadow-sm)]",
        ].join(" "),

        /**
         * glass — Frosted glass surface.
         * Semi-transparent background with backdrop-blur.
         * Subtle border for glass edge definition.
         * No hover lift or glow (Req 5.5).
         */
        glass: [
          "bg-[var(--surface-raised,#ffffff)]/60",
          "backdrop-blur-md",
          "border border-[rgba(255,255,255,0.25)]",
          "shadow-[var(--shadow-md)]",
        ].join(" "),

        /**
         * elevated — Stronger shadow, no border.
         * For prominent containers that need clear depth.
         * No hover lift or glow (Req 5.5).
         */
        elevated: [
          "bg-[var(--surface-raised,#ffffff)]",
          "shadow-[var(--shadow-lg)]",
        ].join(" "),

        /**
         * sunken — Inset background for nested content.
         * Uses --surface-sunken token (slightly darker than ground).
         * No hover lift or glow (Req 5.5).
         */
        sunken: [
          "bg-[var(--surface-sunken,#f0ede8)]",
          "border border-[rgba(26,23,20,0.06)]",
        ].join(" "),

        /**
         * interactive — Hover lift + border glow (Req 5.3).
         * On pointer hover: translateY(-2px) + --shadow-glow.
         * Transition uses duration-[var(--duration-fast)] for snappy response.
         * Base state has raised surface + subtle shadow.
         */
        interactive: [
          "bg-[var(--surface-raised,#ffffff)]",
          "border border-[rgba(26,23,20,0.08)]",
          "shadow-[var(--shadow-sm)]",
          "cursor-pointer",
          "hover:-translate-y-0.5",
          "hover:shadow-[var(--shadow-glow)]",
          "hover:border-[rgba(2,132,199,0.20)]",
        ].join(" "),
      },
      padding: {
        /** No padding — consumer controls internal spacing */
        none: "",
        /** sm — p-4 (16px) */
        sm: "p-4",
        /** md — p-6 (24px) — default */
        md: "p-6",
        /** lg — p-8 (32px) */
        lg: "p-8",
      },
    },
    defaultVariants: {
      surface: "raised",
      padding: "md",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof cardVariants> {
  /** Polymorphic element type — defaults to 'div' */
  as?: "div" | "article" | "section"
}

/**
 * Card — primary content container with surface hierarchy and padding variants.
 *
 * @example
 * // Default raised card
 * <Card>Content</Card>
 *
 * @example
 * // Interactive card with hover lift
 * <Card surface="interactive" padding="md" onClick={handleClick}>
 *   Content
 * </Card>
 *
 * @example
 * // Article element with glass surface
 * <Card as="article" surface="glass" padding="lg">
 *   Content
 * </Card>
 */
const Card = React.forwardRef<HTMLElement, CardProps>(
  ({ className, surface, padding, as: Tag = "div", ...props }, ref) => {
    return (
      <Tag
        ref={ref as React.Ref<HTMLDivElement>}
        className={cn(cardVariants({ surface, padding }), className)}
        {...props}
      />
    )
  }
)
Card.displayName = "Card"

// ─── Sub-components ──────────────────────────────────────────────────────────
// These preserve backward compatibility with existing usages across the codebase.
// They do not carry padding themselves — padding is controlled by the Card wrapper.

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-bold leading-none tracking-tight text-[var(--text-primary,#1a1714)]",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-[var(--text-secondary,#3d3830)]", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-4", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  cardVariants,
}
