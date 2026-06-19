// Location: lib\auth.js
/**
 * Authentication Utilities
 */
import { STORAGE_KEYS, ROUTES } from './constants'

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  if (typeof window === 'undefined') return false
  return !!sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
}

/**
 * Get current user from localStorage
 */
export function getCurrentUser() {
  if (typeof window === 'undefined') return null
  const userStr = sessionStorage.getItem(STORAGE_KEYS.USER)
  if (!userStr) return null
  
  try {
    return JSON.parse(userStr)
  } catch (error) {
    console.error('Error parsing user data:', error)
    return null
  }
}

/**
 * Save user data to localStorage
 */
export function saveUser(user) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
}

/**
 * Get access token
 */
export function getAccessToken() {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
}

/**
 * Get refresh token
 */
export function getRefreshToken() {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
}

/**
 * Save tokens to localStorage
 */
export function saveTokens(accessToken, refreshToken) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken)
  sessionStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
}

/**
 * Clear all auth data
 */
export function clearAuth() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
  sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
  sessionStorage.removeItem(STORAGE_KEYS.USER)
}

/**
 * Check if user is admin
 */
export function isAdmin() {
  const user = getCurrentUser()
  return user?.role === 'admin'
}

/**
 * Redirect to login
 */
export function redirectToLogin(router, returnUrl) {
  const url = returnUrl ? `${ROUTES.LOGIN}?returnUrl=${encodeURIComponent(returnUrl)}` : ROUTES.LOGIN
  router.push(url)
}

/**
 * Handle authentication error
 */
export function handleAuthError(router) {
  clearAuth()
  redirectToLogin(router)
}

/**
 * Parse JWT token
 */
export function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('Error parsing JWT:', error)
    return null
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token) {
  if (!token) return true
  
  const decoded = parseJwt(token)
  if (!decoded || !decoded.exp) return true
  
  const currentTime = Date.now() / 1000
  return decoded.exp < currentTime
}

/**
 * Get return URL from query params
 */
export function getReturnUrl(searchParams) {
  return searchParams?.get('returnUrl') || searchParams?.get('redirect') || ROUTES.HOME
}

/**
 * Google OAuth Login
 */
export function loginWithGoogle() {
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(window.location.origin + '/auth/callback/google')}&response_type=token&scope=email profile`
  window.location.href = googleAuthUrl
}

/**
 * Discord OAuth Login
 */
export function loginWithDiscord() {
  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${
    process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID
  }&redirect_uri=${encodeURIComponent(
    window.location.origin + '/auth/callback/discord'
  )}&response_type=code&scope=identify%20email`;
  
  window.location.href = discordAuthUrl;
}

/**
 * Microsoft OAuth Login
 */
export function loginWithMicrosoft() {
  const microsoftAuthUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(window.location.origin + '/auth/callback/microsoft')}&scope=openid profile email`
  window.location.href = microsoftAuthUrl
}