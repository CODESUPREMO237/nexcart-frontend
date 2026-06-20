'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Store, Phone, MapPin, CreditCard, Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'
import useAuthStore from '@/store/authStore'

export default function SellerRegisterPage() {
  const router = useRouter()
  const { isAuthenticated, authReady, checkAuth } = useAuthStore()

  useEffect(() => { checkAuth() }, [checkAuth])

  useEffect(() => {
    if (!authReady) return
    if (!isAuthenticated) {
      router.push('/login?redirect=' + encodeURIComponent('/seller/register'))
    }
  }, [authReady, isAuthenticated, router])

  const [form, setForm] = useState({
    store_name: '', description: '', phone: '', whatsapp: '',
    email: '', address: '', city: 'Tiko', region: 'South West',
    momo_provider: 'MTN', momo_number: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/vendor/register/', form)
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.store_name?.[0] || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  if (!authReady || !isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-md border border-accent/30 bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-accent" />
          </div>
          <h1 className="font-display font-bold text-2xl text-foreground mb-2">Registration Submitted!</h1>
          <p className="text-sm text-muted-foreground">
            Your vendor application has been submitted for review. 
            You&apos;ll be notified once approved. This usually takes 24-48 hours.
          </p>
          <Button className="mt-6 btn-press" onClick={() => window.location.href = '/'}>
            Back to Home
          </Button>
        </div>
      </div>
    )
  }

  const inputClass = "w-full px-4 py-2.5 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-colors"
  const labelClass = "text-sm font-medium text-foreground block mb-1.5"

  return (
    <div className="py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-md border border-border bg-foreground flex items-center justify-center mx-auto mb-4">
            <Store className="h-6 w-6 text-background" />
          </div>
          <span className="font-mono text-xs uppercase tracking-[0.15em] text-accent">Vendor Application</span>
          <h1 className="font-display font-bold text-3xl text-foreground mt-1">Become a Seller</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Open your store on NexCart and reach customers across Cameroon
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Store Info */}
          <div className="border border-border rounded-md bg-card p-5 space-y-4">
            <h2 className="font-display font-semibold text-sm text-foreground flex items-center gap-2">
              <Store className="h-4 w-4 text-accent" /> Store Information
            </h2>
            <div>
              <label className={labelClass}>Store Name *</label>
              <input
                type="text" required value={form.store_name}
                onChange={e => update('store_name', e.target.value)}
                placeholder="e.g. Mama's Fashion House"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <textarea
                value={form.description}
                onChange={e => update('description', e.target.value)}
                placeholder="Tell customers about your store..."
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>

          {/* Contact */}
          <div className="border border-border rounded-md bg-card p-5 space-y-4">
            <h2 className="font-display font-semibold text-sm text-foreground flex items-center gap-2">
              <Phone className="h-4 w-4 text-accent" /> Contact Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Phone *</label>
                <input
                  type="tel" required value={form.phone}
                  onChange={e => update('phone', e.target.value)}
                  placeholder="+237 6XX XXX XXX"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>WhatsApp</label>
                <input
                  type="tel" value={form.whatsapp}
                  onChange={e => update('whatsapp', e.target.value)}
                  placeholder="+237 6XX XXX XXX"
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email" value={form.email}
                onChange={e => update('email', e.target.value)}
                placeholder="store@example.com"
                className={inputClass}
              />
            </div>
          </div>

          {/* Location */}
          <div className="border border-border rounded-md bg-card p-5 space-y-4">
            <h2 className="font-display font-semibold text-sm text-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4 text-accent" /> Location
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>City *</label>
                <select value={form.city} onChange={e => update('city', e.target.value)}
                  className={inputClass}>
                  <option>Tiko</option><option>Buea</option><option>Limbe</option>
                  <option>Douala</option><option>Yaoundé</option><option>Bamenda</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Region</label>
                <select value={form.region} onChange={e => update('region', e.target.value)}
                  className={inputClass}>
                  <option>South West</option><option>Littoral</option><option>Centre</option>
                  <option>North West</option><option>West</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Address</label>
              <input
                type="text" value={form.address}
                onChange={e => update('address', e.target.value)}
                placeholder="Shop location / Quarter"
                className={inputClass}
              />
            </div>
          </div>

          {/* Payment */}
          <div className="border border-border rounded-md bg-card p-5 space-y-4">
            <h2 className="font-display font-semibold text-sm text-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-accent" /> Mobile Money (for payouts)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Provider *</label>
                <select value={form.momo_provider} onChange={e => update('momo_provider', e.target.value)}
                  className={inputClass}>
                  <option value="MTN">MTN MoMo</option>
                  <option value="ORANGE">Orange Money</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>MoMo Number *</label>
                <input
                  type="tel" required value={form.momo_number}
                  onChange={e => update('momo_number', e.target.value)}
                  placeholder="6XX XXX XXX"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/5 border border-destructive/30 rounded-md p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" size="lg" className="w-full btn-press" disabled={loading}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting...</> : 'Submit Application'}
          </Button>
        </form>
      </div>
    </div>
  )
}
