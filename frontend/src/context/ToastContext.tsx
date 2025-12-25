import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export type ToastVariant = 'default' | 'destructive' | 'success' | 'info'

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000,
    }

    setToasts((prev) => [...prev, newToast])

    // Auto remove after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, newToast.duration)
    }
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const success = useCallback(
    (title: string, description?: string) => {
      addToast({ title, description, variant: 'success' })
    },
    [addToast]
  )

  const error = useCallback(
    (title: string, description?: string) => {
      addToast({ title, description, variant: 'destructive' })
    },
    [addToast]
  )

  const info = useCallback(
    (title: string, description?: string) => {
      addToast({ title, description, variant: 'info' })
    },
    [addToast]
  )

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        success,
        error,
        info,
      }}
    >
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}


