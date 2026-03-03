'use client'

import { useCallback, useMemo } from 'react'
import { create } from 'zustand'

let toastCounter = 0

const nextToastId = () => {
  toastCounter += 1
  return `${Date.now()}-${toastCounter}`
}

const useToastStore = create((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = nextToastId()
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id, duration: toast.duration || 3000 }]
    }))
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    }))
  }
}))

export const useToast = () => {
  const addToast = useToastStore((state) => state.addToast)

  const toast = useCallback(({ title, description, variant = 'default', duration = 3000 }) => {
    addToast({ title, description, variant, duration })
  }, [addToast])

  return useMemo(() => ({ toast }), [toast])
}

export default useToastStore
