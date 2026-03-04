'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Eye, EyeOff, ArrowLeft, CheckCircle, KeyRound } from 'lucide-react'
import { api } from '@/lib/api'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail]           = useState('')
  const [otp, setOtp]               = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]       = useState(false)
  const [success, setSuccess]       = useState(false)
  const [error, setError]           = useState('')

  useEffect(() => {
    // Pre-fill email and OTP from query params (coming from email link)
    const emailParam = searchParams.get('email')
    const otpParam   = searchParams.get('otp')
    if (emailParam) setEmail(decodeURIComponent(emailParam))
    if (otpParam)   setOtp(otpParam)
  }, [searchParams])

  const passwordStrength = (pwd) => {
    let score = 0
    if (pwd.length >= 8)  score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++
    return score
  }

  const strength = passwordStrength(newPassword)
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength]
  const strengthColor = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'][strength]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      await api.resetPassword(email.trim().toLowerCase(), otp.trim(), newPassword)
      setSuccess(true)
      // Redirect to login after 3 seconds
      setTimeout(() => router.push('/login'), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired reset code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Password reset!</h1>
          <p className="text-muted-foreground">
            Your password has been updated successfully.
            Redirecting you to login…
          </p>
        </div>
        <Button asChild className="w-full">
          <Link href="/login">Go to login</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <KeyRound className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold">Reset password</h1>
        <p className="text-muted-foreground">
          Enter the code from your email and choose a new password.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        {/* OTP */}
        <div className="space-y-2">
          <Label htmlFor="otp">Reset code</Label>
          <Input
            id="otp"
            type="text"
            placeholder="6-digit code"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            disabled={loading}
            maxLength={6}
            className="tracking-[0.5em] text-center font-mono text-lg"
          />
        </div>

        {/* New password */}
        <div className="space-y-2">
          <Label htmlFor="newPassword">New password</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={loading}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(p => !p)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {/* Strength bar */}
          {newPassword && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-all ${
                      i <= strength ? strengthColor : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
              <p className={`text-xs font-medium ${
                strength <= 1 ? 'text-red-500' :
                strength === 2 ? 'text-yellow-500' :
                strength === 3 ? 'text-blue-500' : 'text-green-500'
              }`}>{strengthLabel}</p>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <Input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
            className={confirmPassword && confirmPassword !== newPassword ? 'border-destructive' : ''}
          />
          {confirmPassword && confirmPassword !== newPassword && (
            <p className="text-xs text-destructive">Passwords do not match</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={loading || !email || !otp || !newPassword || newPassword !== confirmPassword}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Resetting password…
            </>
          ) : (
            'Reset password'
          )}
        </Button>
      </form>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <Link
          href="/login"
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to login
        </Link>
        <Link
          href="/forgot-password"
          className="text-primary hover:underline"
        >
          Resend code
        </Link>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6 text-center">
        <h1 className="text-3xl font-bold">Reset password</h1>
        <p className="text-muted-foreground">Loading…</p>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
