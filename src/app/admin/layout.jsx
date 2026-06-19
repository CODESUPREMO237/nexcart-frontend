'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useAuthStore from '@/store/authStore'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default function AdminLayout({ children }) {
  const router = useRouter()
  const { user, isAuthenticated, checkAuth } = useAuthStore()
  const hasHydrated = useAuthStore.persist?.hasHydrated?.() ?? true

  useEffect(() => {
    if (hasHydrated) {
      checkAuth()
    }
  }, [checkAuth, hasHydrated])

  useEffect(() => {
    if (!hasHydrated) return

    if (!isAuthenticated) {
      router.replace('/login?redirect=/admin/dashboard')
      return
    }

    if (user && user.role !== 'admin') {
      router.replace('/')
    }
  }, [hasHydrated, isAuthenticated, user, router])

  if (!hasHydrated || !isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground font-mono uppercase tracking-[0.1em]">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center max-w-sm px-4">
          <div className="w-14 h-14 rounded-md border border-destructive/30 bg-destructive/5 flex items-center justify-center mx-auto mb-4">
            <span className="text-destructive text-2xl">⛔</span>
          </div>
          <h1 className="font-display font-bold text-xl text-foreground mb-2">Access Denied</h1>
          <p className="text-sm text-muted-foreground mb-5">You don&apos;t have permission to access this area.</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-foreground text-background rounded-md text-sm font-medium hover:bg-foreground/90 transition-colors btn-press"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}
