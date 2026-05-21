import { CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

// Icon colors reference CSS custom properties from tokens.css — no hardcoded values
const ICONS = {
  success:     <CheckCircle className="size-4 shrink-0 mt-0.5" style={{ color: 'var(--accent-success, #059669)' }} />,
  destructive: <AlertCircle className="size-4 shrink-0 mt-0.5" style={{ color: 'var(--accent-danger, #dc2626)' }} />,
  warning:     <AlertTriangle className="size-4 shrink-0 mt-0.5" style={{ color: 'var(--accent-warning, #d97706)' }} />,
  default:     <Info className="size-4 shrink-0 mt-0.5" style={{ color: 'var(--accent-info, #2563eb)' }} />,
}

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <ToastProvider swipeDirection="right">
      {toasts.map(({ id, title, description, action, variant, ...props }) => (
        <Toast key={id} variant={variant} {...props} onOpenChange={(open) => { if (!open) dismiss(id) }}>
          <div className="flex gap-3 items-start">
            {ICONS[variant ?? "default"]}
            <div className="flex-1 min-w-0">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
