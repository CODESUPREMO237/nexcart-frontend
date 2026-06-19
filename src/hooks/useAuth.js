/**
 * Custom hook for protecting routes that require authentication
 */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import useAuthStore from '@/store/authStore'

export function useRequireAuth(redirectTo = '/login') {
  const router = useRouter()
  const { isAuthenticated, checkAuth, roleConfirmed } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    const verifyAuth = async () => {
      // Run checkAuth (skips if already roleConfirmed)
      await checkAuth()

      // Wait for roleConfirmed to become true (polls store state)
      const waitForConfirmation = () => new Promise((resolve) => {
        // Already confirmed
        if (useAuthStore.getState().roleConfirmed) { resolve(); return }
        // Subscribe to store changes
        const unsub = useAuthStore.subscribe((state) => {
          if (state.roleConfirmed || !state.isAuthenticated) {
            unsub()
            resolve()
          }
        })
        // Timeout after 5s to avoid hanging
        setTimeout(() => { unsub(); resolve() }, 5000)
      })

      await waitForConfirmation()

      const currentAuthState = useAuthStore.getState().isAuthenticated

      if (!currentAuthState) {
        const returnUrl = window.location.pathname + window.location.search
        router.push(`${redirectTo}?returnUrl=${encodeURIComponent(returnUrl)}`)
      } else {
        setIsAuthorized(true)
      }

      setIsLoading(false)
    }

    verifyAuth()
  }, [checkAuth, router, redirectTo])

  return { isLoading, isAuthorized }
}

/**
 * Hook to check if user is admin
 */
export function useRequireAdmin(redirectTo = '/') {
  const router = useRouter()
  const { user, isAuthenticated, checkAuth } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    const verifyAdmin = async () => {
      await checkAuth()
      
      // Small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const currentUser = useAuthStore.getState().user
      const currentAuthState = useAuthStore.getState().isAuthenticated
      
      if (!currentAuthState || currentUser?.role !== 'admin') {
        router.push(redirectTo)
      } else {
        setIsAuthorized(true)
      }
      
      setIsLoading(false)
    }

    verifyAdmin()
  }, [checkAuth, router, redirectTo])

  return { isLoading, isAuthorized, user }
}
