import { useEffect, useState } from "react"
import { useToast } from "@/context/ToastContext"
import { Toast } from "./toast"

export function Toaster() {
  const { toasts, removeToast } = useToast()

  return (
    <div
      className="pointer-events-none fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          variant={toast.variant}
          onClose={() => removeToast(toast.id)}
          className="pointer-events-auto"
        >
          {toast.title && (
            <div className="text-sm font-semibold">{toast.title}</div>
          )}
          {toast.description && (
            <div className="text-sm opacity-90">{toast.description}</div>
          )}
        </Toast>
      ))}
    </div>
  )
}

