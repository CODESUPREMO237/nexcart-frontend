'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { api } from '@/lib/api'

export default function ForgotPasswordPage() {
  const [email, setEmail]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)
  const [error, setError]       = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.forgotPassword(email.trim().toLowerCase())
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-md border border-border bg-accent/10 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-accent" />
          </div>
        </div>
        <div className="space-y-1.5">
          <h1 className="font-display font-bold text-3xl text-foreground">Check your email</h1>
          <p className="text-sm text-muted-foreground">
            If <span className="font-medium text-foreground">{email}</span> is registered,
            you&apos;ll receive a password reset code shortly.
          </p>
        </div>
        <div className="border border-border rounded-md bg-muted p-4 text-sm text-muted-foreground text-left space-y-1">
          <p>• The code expires in <strong className="text-foreground">15 minutes</strong></p>
          <p>• Check your spam folder if you don&apos;t see it</p>
        </div>
        <Button asChild className="w-full btn-press">
          <Link href={`/reset-password?email=${encodeURIComponent(email)}`}>
            Enter reset code
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground">
          Wrong email?{' '}
          <button
            onClick={() => { setSuccess(false); setEmail('') }}
            className="text-accent hover:underline font-medium"
          >
            Try again
          </button>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-md border border-border bg-accent/10 flex items-center justify-center">
            <Mail className="h-7 w-7 text-accent" />
          </div>
        </div>
        <h1 className="font-display font-bold text-3xl text-foreground text-center">Forgot password?</h1>
        <p className="text-sm text-muted-foreground text-center">
          No worries! Enter your email and we&apos;ll send you a reset code.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              required
              disabled={loading}
              autoFocus
            />
          </div>
        </div>

        <Button type="submit" className="w-full btn-press" disabled={loading || !email}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending reset code…
            </>
          ) : (
            'Send reset code'
          )}
        </Button>
      </form>

      <Link
        href="/login"
        className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to login
      </Link>
    </div>
  )
}
