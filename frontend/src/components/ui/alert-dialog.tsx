import * as React from "react"
import { cn } from "@/utils/cn"
import { Button } from "./button"

interface AlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive"
  onConfirm: () => void
  onCancel?: () => void
}

export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
}: AlertDialogProps) {
  if (!open) return null

  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={() => onOpenChange(false)}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Dialog */}
      <div
        className="relative z-50 w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground mb-6">{description}</p>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleCancel}>
            {cancelText}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={handleConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}


