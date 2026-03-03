/**
 * Authentication Store using Zustand
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/api'
import { saveTokens, saveUser, clearAuth, getCurrentUser } from '@/lib/auth'

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Renamed from initialize to checkAuth to fix the Layout error
      checkAuth: () => {
        const user = getCurrentUser()
        if (user) {
          set({ user, isAuthenticated: true })
        } else {
          set({ user: null, isAuthenticated: false })
        }
      },

      // Set user directly (used by OAuth callback)
      setUser: (user) => {
        saveUser(user)
        set({ user, isAuthenticated: true })
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
          
          set({ 
            user: data.user, 
            isAuthenticated: true, 
            isLoading: false 
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
            isLoading: false 
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
              // DRF field-level validation errors e.g. { password: ['Too common.'], email: ['Already exists.'] }
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
            isLoading: false 
          })
          
          return { success: true, user: data.user }
        } catch (error) {
          const errorMessage = error.response?.data?.error || `${provider} login failed`
          set({ error: errorMessage, isLoading: false })
          return { success: false, error: errorMessage }
        }
      },

      // Login with Google (legacy, kept for compatibility)
      loginWithGoogle: async (token) => {
        return get().socialLogin('google', { token })
      },

      // Login with Discord
      loginWithDiscord: async (code, redirect_uri) => {
        return get().socialLogin('discord', { code, redirect_uri })
      },

      // Login with Microsoft
      loginWithMicrosoft: async (code, redirect_uri) => {
        return get().socialLogin('microsoft', { code, redirect_uri })
      },

      // Logout
      logout: () => {
        clearAuth()
        api.logout()
        
        // Reset cart on logout
        if (typeof window !== 'undefined') {
          try {
            const cartStore = require('./cartStore').default
            const resetCart = cartStore.getState().resetCart
            if (resetCart) resetCart()
          } catch (e) {
            // Cart store might not be loaded
            console.warn('Could not reset cart on logout')
          }
        }
        
        set({ 
          user: null, 
          isAuthenticated: false, 
          error: null 
        })
      },

      // Update user profile
      updateProfile: async (profileData) => {
        set({ isLoading: true, error: null })
        try {
          const updatedUser = await api.updateProfile(profileData)
          
          saveUser(updatedUser)
          
          set({ 
            user: updatedUser, 
            isLoading: false 
          })
          
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

      // Clear error
      clearError: () => set({ error: null }),

      // Check if user is admin
      isAdmin: () => {
        const { user } = get()
        return user?.role === 'admin'
      },
    }),
    {
      name: 'auth-storage',
      // Store user and auth status in localStorage
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
)

export default useAuthStore
