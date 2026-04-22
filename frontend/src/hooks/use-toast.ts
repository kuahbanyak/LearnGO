import { useEffect, useRef, useState, useCallback } from "react"
import type { ToastActionElement, ToastProps } from "@/components/ui/toast"

const TOAST_REMOVE_DELAY = 5000
const TOAST_LIMIT = 5

export type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

// ── Global singleton state ──────────────────────────────────────────────────
let toasts: ToasterToast[] = []
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach(fn => fn())
}

let idCount = 0
function genId() {
  return String(++idCount)
}

function addToast(props: Omit<ToasterToast, "id">) {
  const id = genId()
  toasts = [{ ...props, id, open: true }, ...toasts].slice(0, TOAST_LIMIT)
  notify()

  // Auto-dismiss
  setTimeout(() => {
    dismissToast(id)
  }, TOAST_REMOVE_DELAY)
}

function dismissToast(id: string) {
  toasts = toasts.map(t => t.id === id ? { ...t, open: false } : t)
  notify()
  // Remove from array after animation
  setTimeout(() => {
    toasts = toasts.filter(t => t.id !== id)
    notify()
  }, 300)
}

// ── Public API (callable anywhere, no hook needed) ─────────────────────────
export function toast(props: Omit<ToasterToast, "id">) {
  addToast(props)
}

toast.success = (title: string, description?: string) =>
  addToast({ variant: "success", title, description })

toast.error = (title: string, description?: string) =>
  addToast({ variant: "destructive", title, description })

toast.warning = (title: string, description?: string) =>
  addToast({ variant: "warning", title, description })

toast.info = (title: string, description?: string) =>
  addToast({ variant: "default", title, description })

// ── React hook (for Toaster component to render the list) ───────────────────
export function useToast() {
  const [, rerender] = useState(0)

  useEffect(() => {
    const fn = () => rerender(n => n + 1)
    listeners.add(fn)
    return () => { listeners.delete(fn) }
  }, [])

  const dismiss = useCallback((id: string) => dismissToast(id), [])

  return { toasts, dismiss }
}
