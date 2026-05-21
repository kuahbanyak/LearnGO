import { useCallback, useEffect, useRef } from 'react'
import { AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

/**
 * ConfirmationDialog — a shared dialog for destructive or important actions
 * that require explicit user confirmation before proceeding.
 *
 * Built on top of Radix Dialog which provides:
 * - Focus trap (tab cycling within the dialog)
 * - Escape key to close
 * - Backdrop overlay click to close
 * - Proper ARIA attributes (role="dialog", aria-modal)
 *
 * Requirements: 6.6, 9.4, 20.6
 */

export interface ConfirmationDialogProps {
  /** Whether the dialog is open */
  open: boolean
  /** Callback when the dialog open state changes (e.g., backdrop click, Escape) */
  onOpenChange: (open: boolean) => void
  /** Dialog title displayed in the header */
  title: string
  /** Descriptive message explaining the action and its consequences */
  message: string
  /** Label for the confirm button */
  confirmLabel?: string
  /** Label for the cancel button */
  cancelLabel?: string
  /** Callback when the user confirms the action */
  onConfirm: () => void
  /** Callback when the user cancels (defaults to closing the dialog) */
  onCancel?: () => void
  /** Whether the confirm action is in a loading state */
  loading?: boolean
  /** Whether this is a destructive action (renders confirm button in danger style) */
  destructive?: boolean
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
  destructive = false,
}: ConfirmationDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  // Focus the cancel button when the dialog opens for safety
  // (user must intentionally move to confirm for destructive actions)
  useEffect(() => {
    if (open) {
      // Small delay to allow Radix to finish mounting
      const timer = setTimeout(() => {
        cancelRef.current?.focus()
      }, 0)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [open])

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel()
    } else {
      onOpenChange(false)
    }
  }, [onCancel, onOpenChange])

  const handleConfirm = useCallback(() => {
    onConfirm()
  }, [onConfirm])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md"
        aria-labelledby="confirmation-dialog-title"
        aria-describedby="confirmation-dialog-description"
      >
        <DialogHeader>
          {destructive && (
            <div
              className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--accent-danger) 12%, transparent)',
              }}
            >
              <AlertTriangle
                className="h-6 w-6"
                style={{ color: 'var(--accent-danger)' }}
                aria-hidden="true"
              />
            </div>
          )}
          <DialogTitle id="confirmation-dialog-title">{title}</DialogTitle>
          <DialogDescription id="confirmation-dialog-description">
            {message}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4 gap-3 sm:gap-2">
          <Button
            ref={cancelRef}
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={destructive ? 'danger' : 'primary'}
            onClick={handleConfirm}
            loading={loading}
            disabled={loading}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
