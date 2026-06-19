'use client';

import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import useAuthStore from '@/store/authStore'
import { validateAndCleanupTokens } from '@/lib/utils/tokenValidator'
import { LanguageProvider } from '@/lib/i18n/LanguageContext'
import InstallPrompt from '@/components/features/InstallPrompt'

const SupportChat = dynamic(() => import('@/components/features/SupportChat'), { ssr: false })
const CookieConsent = dynamic(() => import('@/components/features/CookieConsent'), { ssr: false })

export function Providers({ children }) {
  const { checkAuth } = useAuthStore()

  useEffect(() => {
    // Purge any stale auth-storage that still contains a `user` key.
    // We no longer persist `user` — only `isAuthenticated` — so old entries
    // with a persisted seller/admin user object must be wiped on first boot.
    try {
      const raw = sessionStorage.getItem('auth-storage')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed?.state?.user !== undefined) {
          // Old shape detected — delete so Zustand rehydrates clean
          sessionStorage.removeItem('auth-storage')
        }
      }
    } catch (e) {
      sessionStorage.removeItem('auth-storage')
    }

    // Clean up expired tokens first
    validateAndCleanupTokens()

    // Fetch fresh user data from the backend
    checkAuth()
  }, [checkAuth])

  return (
    <LanguageProvider>
      {children}
      <InstallPrompt />
      <SupportChat />
      <CookieConsent />
    </LanguageProvider>
  )
}


