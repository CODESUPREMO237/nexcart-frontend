/**
 * Authentication Store using Zustand
 */
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import api from '@/lib/api'
import { saveTokens, saveUser, clearAuth, getCurrentUser } from '@/lib/auth'

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      isAuthenticated: false,
      authReady: false,
      // roleConfirmed is TRUE only after the backend /me API returns fresh data.
      // It is NEVER set in the error/fallback path, so stale cached roles can
      // never leak into role-gated UI (e.g. "Seller Dashboard").
      // It is NOT persisted — it resets to false on every page load and is
      // re-set only once checkAuth() or login() confirms the role from the server.
      roleConfirmed: false,
      isLoading: false,
      error: null,

      // Fetches fresh user data from the backend to avoid stale role/data
      checkAuth: async () => {
        // Prevent concurrent calls — if already confirmed, skip
        if (get().roleConfirmed) return

        const hasTokens = typeof window !== 'undefined' && (
          sessionStorage.getItem('access_token') || sessionStorage.getItem('refresh_token')
        )

        if (!hasTokens) {
          set({ user: null, isAuthenticated: false, authReady: true, roleConfirmed: false })
          return
        }

        // Do NOT optimistically set stale user — wait for API to confirm.
        // This prevents a previous account's data (e.g. seller role) from
        // flashing in the UI before the backend returns fresh data.
        set({ isAuthenticated: true, roleConfirmed: false, authReady: false })

        try {
          const freshUser = await api.getCurrentUser()
          saveUser(freshUser)
          // Only here do we confirm the role — the backend just told us who this really is.
          set({ user: freshUser, isAuthenticated: true, authReady: true, roleConfirmed: true })
        } catch (error) {
          const refreshToken = typeof window !== 'undefined'
            ? sessionStorage.getItem('refresh_token')
            : null
          if (error.response?.status === 401 && !refreshToken) {
            clearAuth()
            sessionStorage.removeItem('auth-storage')
            set({ user: null, isAuthenticated: false, authReady: true, roleConfirmed: false })
          } else {
            // API failed but we still have a refresh token — restore cached user
            // for general UI but do NOT confirm the role.
            const cachedUser = getCurrentUser()
            set({ user: cachedUser, authReady: true, roleConfirmed: false })
          }
        }
      },

      // Set user directly (used by OAuth callback)
      setUser: (user) => {
        saveUser(user)
        set({ user, isAuthenticated: true, roleConfirmed: true })
      },

      // Set tokens directly (used by OAuth callback)
      setTokens: (accessToken, refreshToken) => {
        saveTokens(accessToken, refreshToken)
      },

      // Login with email/password
      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const data = await api.login(email, password)

          saveTokens(data.tokens.access, data.tokens.refresh)
          saveUser(data.user)

          // The login endpoint returns fresh user data — role is confirmed immediately.
          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
            roleConfirmed: true,
          })

          return { success: true, user: data.user }
        } catch (error) {
          const errorMessage = error.response?.data?.error || 'Login failed'
          set({ error: errorMessage, isLoading: false })
          return { success: false, error: errorMessage }
        }
      },

      // Register new user
      register: async (userData) => {
        set({ isLoading: true, error: null })
        try {
          const data = await api.register(userData)

          saveTokens(data.tokens.access, data.tokens.refresh)
          saveUser(data.user)

          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
            roleConfirmed: true,
          })

          return { success: true, user: data.user }
        } catch (error) {
          const responseData = error.response?.data
          let errorMessage = 'Registration failed'
          if (responseData) {
            if (typeof responseData === 'string') {
              errorMessage = responseData
            } else if (responseData.error) {
              errorMessage = responseData.error
            } else {
              const messages = Object.entries(responseData)
                .map(([field, errors]) => {
                  const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ')
                  const errList = Array.isArray(errors) ? errors.join(' ') : errors
                  return `${fieldName}: ${errList}`
                })
              errorMessage = messages.join(' | ')
            }
          }
          set({ error: errorMessage, isLoading: false })
          return { success: false, error: errorMessage }
        }
      },

      // Social login (Google, Discord, Microsoft)
      socialLogin: async (provider, credentials) => {
        set({ isLoading: true, error: null })
        try {
          const data = await api.socialLogin(provider, credentials)

          saveTokens(data.tokens.access, data.tokens.refresh)
          saveUser(data.user)

          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
            roleConfirmed: true,
          })

          return { success: true, user: data.user }
        } catch (error) {
          const errorMessage = error.response?.data?.error || `${provider} login failed`
          set({ error: errorMessage, isLoading: false })
          return { success: false, error: errorMessage }
        }
      },

      loginWithGoogle:    async (token)               => useAuthStore.getState().socialLogin('google',    { token }),
      loginWithDiscord:   async (code, redirect_uri)  => useAuthStore.getState().socialLogin('discord',   { code, redirect_uri }),
      loginWithMicrosoft: async (code, redirect_uri)  => useAuthStore.getState().socialLogin('microsoft', { code, redirect_uri }),

      // Logout — completely wipe all auth state so no previous account's role
      // can ever bleed into the next session.
      logout: () => {
        clearAuth()
        api.logout()

        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('auth-storage')
        }

        // Reset cart on logout
        if (typeof window !== 'undefined') {
          try {
            const cartStore = require('./cartStore').default
            const resetCart = cartStore.getState().resetCart
            if (resetCart) resetCart()
          } catch (e) {
            console.warn('Could not reset cart on logout')
          }
        }

        set({
          user: null,
          isAuthenticated: false,
          authReady: false,
          roleConfirmed: false,
          error: null,
        })
      },

      // Update user profile
      updateProfile: async (profileData) => {
        set({ isLoading: true, error: null })
        try {
          const updatedUser = await api.updateProfile(profileData)
          saveUser(updatedUser)
          set({ user: updatedUser, isLoading: false })
          return { success: true, user: updatedUser }
        } catch (error) {
          const errorMessage = error.response?.data?.error || 'Update failed'
          set({ error: errorMessage, isLoading: false })
          return { success: false, error: errorMessage }
        }
      },

      // Change password
      changePassword: async (oldPassword, newPassword) => {
        set({ isLoading: true, error: null })
        try {
          await api.changePassword(oldPassword, newPassword)
          set({ isLoading: false })
          return { success: true }
        } catch (error) {
          const errorMessage = error.response?.data?.error || 'Password change failed'
          set({ error: errorMessage, isLoading: false })
          return { success: false, error: errorMessage }
        }
      },

      clearError: () => set({ error: null }),

      isAdmin: () => {
        const { user } = get()
        return user?.role === 'admin'
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      // We persist NOTHING except isAuthenticated (a boolean with no role/PII).
      // The stale `user` object (with a previous account's role) must never be
      // rehydrated — checkAuth() always fetches fresh user data from the backend.
      // Tokens live in their own sessionStorage keys (access_token, refresh_token)
      // managed by lib/auth.js, so omitting them here is safe.
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

export default useAuthStore
