'use client'

import { useState, useCallback } from 'react'

interface Toast {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

let toastStore: Toast[] = []
let listeners: Array<(toasts: Toast[]) => void> = []

function notify() {
  listeners.forEach((l) => l([...toastStore]))
}

export function toast(t: Omit<Toast, 'id'>) {
  const id = Math.random().toString(36).slice(2)
  toastStore = [...toastStore, { ...t, id }]
  notify()
  setTimeout(() => {
    toastStore = toastStore.filter((t) => t.id !== id)
    notify()
  }, 4000)
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>(toastStore)

  useState(() => {
    const listener = (t: Toast[]) => setToasts(t)
    listeners.push(listener)
    return () => {
      listeners = listeners.filter((l) => l !== listener)
    }
  })

  const dismiss = useCallback((id: string) => {
    toastStore = toastStore.filter((t) => t.id !== id)
    notify()
  }, [])

  return { toasts, dismiss, toast }
}
