'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import useAuthStore from '@/store/authStore'
import { Loader2 } from 'lucide-react'

export default function OAuthCallback() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const [error, setError] = useState(null)
  const [status, setStatus] = useState('Processing authentication...')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const provider = params.provider
        
        // Get the code from URL (for Discord and Microsoft)
        const code = searchParams.get('code')
        
        // Get access_token from hash (for Google using implicit flow)
        const hash = window.location.hash
        const hashParams = new URLSearchParams(hash.slice(1))
        const token = hashParams.get('access_token')
        
        if (!code && !token) {
          throw new Error('No authorization code or token received')
        }

        setStatus(`Authenticating with ${provider}...`)

        // Call the appropriate backend endpoint
        const apiUrl = process.env.NEXT_PUBLIC_API_URL
        const redirectUri = `${window.location.origin}/auth/callback/${provider}`
        
        let response
        
        if (provider === 'google' && token) {
          // Google uses token-based auth
          response = await fetch(`${apiUrl}/users/auth/google/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
          })
        } else if (provider === 'discord' && code) {
          // Discord uses code-based auth
          response = await fetch(`${apiUrl}/users/auth/discord/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              code,
              redirect_uri: redirectUri,
            }),
          })
        } else if (provider === 'microsoft' && code) {
          // Microsoft uses code-based auth
          response = await fetch(`${apiUrl}/users/auth/microsoft/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              code,
              redirect_uri: redirectUri,
            }),
          })
        } else {
          throw new Error('Invalid provider or missing authentication data')
        }

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Authentication failed')
        }

        const data = await response.json()

        // Save user and tokens to store
        const authStore = useAuthStore.getState()
        authStore.setUser(data.user)
        authStore.setTokens(data.tokens.access, data.tokens.refresh)

        setStatus('Authentication successful! Redirecting...')
        
        // Redirect to home or return URL
        setTimeout(() => {
          let returnUrl = searchParams.get('returnUrl') || '/'
          if (data.user?.role === 'admin' && returnUrl === '/') {
            returnUrl = '/admin/products'
          }
          router.push(returnUrl)
        }, 1000)

      } catch (err) {
        console.error('OAuth callback error:', err)
        setError(err.message)
        setStatus('Authentication failed')
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login?error=oauth_failed')
        }, 3000)
      }
    }

    handleCallback()
  }, [params, searchParams, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="w-full max-w-md p-8 text-center">
        <div className="mb-6">
          {error ? (
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-destructive/10 p-3">
                <svg
                  className="h-12 w-12 text-destructive"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            </div>
          ) : (
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          )}
        </div>
        
        <h1 className="text-2xl font-bold mb-2">
          {error ? 'Authentication Failed' : 'Completing Sign In'}
        </h1>
        
        <p className="text-muted-foreground mb-4">
          {error || status}
        </p>
        
        {error && (
          <p className="text-sm text-muted-foreground">
            Redirecting you back to login...
          </p>
        )}
      </div>
    </div>
  )
}
