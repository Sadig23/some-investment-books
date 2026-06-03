'use client'

import { useToast } from '@/hooks/use-toast'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg transition-all animate-in slide-in-from-bottom-5',
            toast.variant === 'destructive'
              ? 'bg-red-50 border-red-200 text-red-900 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
              : 'bg-white border-gray-200 text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100'
          )}
        >
          <div className="flex-1">
            {toast.title && <p className="font-medium text-sm">{toast.title}</p>}
            {toast.description && <p className="text-sm opacity-80 mt-0.5">{toast.description}</p>}
          </div>
          <button
            onClick={() => dismiss(toast.id)}
            className="opacity-60 hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
