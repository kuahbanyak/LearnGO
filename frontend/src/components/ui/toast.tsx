import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Toast component — all color values reference CSS custom properties
 * from tokens.css. No hardcoded color values.
 *
 * Requirements: 1.4, 14.1
 */

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  [
    "group pointer-events-auto relative flex w-full items-start justify-between space-x-4 overflow-hidden",
    "rounded-[var(--radius-md,0.75rem)] border p-4 pr-8",
    "shadow-[var(--shadow-md)]",
    "transition-all",
    "data-[swipe=cancel]:translate-x-0",
    "data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]",
    "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]",
    "data-[swipe=move]:transition-none",
    "data-[state=open]:animate-in data-[state=closed]:animate-out",
    "data-[swipe=end]:animate-out",
    "data-[state=closed]:fade-out-80",
    "data-[state=closed]:slide-out-to-right-full",
    "data-[state=open]:slide-in-from-top-full",
    "data-[state=open]:sm:slide-in-from-bottom-full",
  ].join(" "),
  {
    variants: {
      variant: {
        /** Default — raised surface, primary text */
        default: [
          "border-[color-mix(in_srgb,var(--text-primary)_10%,transparent)]",
          "bg-[var(--surface-overlay,#ffffff)]",
          "text-[var(--text-primary,#1a1714)]",
        ].join(" "),

        /** Success — success accent tint */
        success: [
          "border-[color-mix(in_srgb,var(--accent-success)_30%,transparent)]",
          "bg-[color-mix(in_srgb,var(--accent-success)_8%,var(--surface-overlay))]",
          "text-[var(--text-primary,#1a1714)]",
        ].join(" "),

        /** Destructive — danger accent tint */
        destructive: [
          "border-[color-mix(in_srgb,var(--accent-danger)_30%,transparent)]",
          "bg-[color-mix(in_srgb,var(--accent-danger)_8%,var(--surface-overlay))]",
          "text-[var(--text-primary,#1a1714)]",
        ].join(" "),

        /** Warning — warning accent tint */
        warning: [
          "border-[color-mix(in_srgb,var(--accent-warning)_30%,transparent)]",
          "bg-[color-mix(in_srgb,var(--accent-warning)_8%,var(--surface-overlay))]",
          "text-[var(--text-primary,#1a1714)]",
        ].join(" "),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center",
      "rounded-[var(--radius-sm,0.375rem)]",
      "border border-[color-mix(in_srgb,var(--text-primary)_15%,transparent)]",
      "bg-transparent px-3 text-sm font-medium",
      "transition-colors",
      "hover:bg-[color-mix(in_srgb,var(--text-primary)_8%,transparent)]",
      "focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-[var(--radius-sm,0.375rem)] p-1",
      "text-[var(--text-tertiary)]",
      "opacity-0 transition-opacity",
      "hover:opacity-100 hover:text-[var(--text-primary)]",
      "focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]",
      "group-hover:opacity-100",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold text-[var(--text-primary)]", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-80 mt-0.5 text-[var(--text-secondary)]", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>
type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
