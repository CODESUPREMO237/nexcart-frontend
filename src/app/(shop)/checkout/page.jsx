'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import useAuthStore from '@/store/authStore'
import useCartStore from '@/store/cartStore'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Lock, CheckCircle, Loader2, AlertCircle, Phone, MapPin, User, Mail, ChevronRight } from 'lucide-react'
import Image from 'next/image'

// ── FCFA formatter ─────────────────────────────────────────────
const fcfa = (n) =>
  new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n)

// ── Validation helpers ──────────────────────────────────────────
const CAMEROON_PHONE = /^(\+?237)?[6][5-9][0-9]{7}$/
const MTN_PREFIX     = /^(\+?237)?6(5[0-9]|7[0-9]|8[0-9])[0-9]{6}$/
const ORANGE_PREFIX  = /^(\+?237)?6(9[0-9]|55|56|57)[0-9]{5,6}$/

function validateCheckoutForm(data, paymentMethod) {
  const errors = {}
  if (!data.firstName.trim()) errors.firstName = 'First name is required'
  if (!data.lastName.trim())  errors.lastName  = 'Last name is required'
  if (!data.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    errors.email = 'Invalid email address'

  const phone = data.phone.replace(/\s/g, '')
  if (!phone) {
    errors.phone = 'Phone number is required'
  } else if (!CAMEROON_PHONE.test(phone)) {
    errors.phone = 'Invalid Cameroonian number (e.g. +237 6XX XXX XXX)'
  } else if (paymentMethod === 'MTN' && !MTN_PREFIX.test(phone)) {
    errors.phone = 'This number does not appear to be an MTN number (65x, 67x, 68x…)'
  } else if (paymentMethod === 'ORANGE' && !ORANGE_PREFIX.test(phone)) {
    errors.phone = 'This number does not appear to be an Orange number (69x, 655-657…)'
  }

  if (!data.address.trim()) errors.address = 'Address is required'
  if (!data.city.trim())    errors.city    = 'City is required'
  return errors
}

// ── MTN Logo ──────────────────────────────────────────────────
function MtnLogo({ active }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
      active ? 'bg-yellow-400' : 'bg-gray-100'
    }`}>
      <div className="w-10 h-10 rounded-lg bg-yellow-400 border-2 border-yellow-500 flex items-center justify-center shadow-sm">
        <span style={{ fontFamily: 'Arial Black, Arial', fontWeight: 900, fontSize: '11px', color: '#000', letterSpacing: '-0.5px' }}>MTN</span>
      </div>
      <div className="text-left">
        <div style={{ fontFamily: 'Arial Black, Arial', fontWeight: 900, fontSize: '15px', color: active ? '#000' : '#333', lineHeight: 1.1 }}>MTN</div>
        <div style={{ fontSize: '10px', color: active ? '#333' : '#888', fontWeight: 500 }}>Mobile Money</div>
      </div>
    </div>
  )
}

// ── Orange Logo ───────────────────────────────────────────────
function OrangeLogo({ active }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
      active ? 'bg-orange-100' : 'bg-gray-100'
    }`}>
      <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center shadow-sm">
        <div className="w-5 h-5 rounded-full bg-white opacity-90" />
      </div>
      <div className="text-left">
        <div style={{ fontFamily: 'Arial, sans-serif', fontWeight: 700, fontSize: '15px', color: active ? '#e65c00' : '#333', lineHeight: 1.1 }}>Orange</div>
        <div style={{ fontSize: '10px', color: active ? '#e65c00' : '#888', fontWeight: 500 }}>Money</div>
      </div>
    </div>
  )
}

// ── Field with error ─────────────────────────────────────────────
function Field({ label, error, children }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1 animate-fade-in">
          <AlertCircle className="h-3 w-3" /> {error}
        </p>
      )}
    </div>
  )
}

// ── Payment status modal ─────────────────────────────────────────
function PaymentStatusModal({ status, orderId, onClose, paymentMethod }) {
  const router = useRouter()
  if (!status) return null
  const isPending = status === 'pending'
  const isSuccess = status === 'success'
  const isFailed  = status === 'failed'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl text-center">
        {isPending && (
          <>
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-yellow-100 flex items-center justify-center animate-pulse">
              <Phone className="h-10 w-10 text-yellow-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">Check your phone!</h2>
            <p className="text-muted-foreground text-sm">
              A Mobile Money payment prompt has been sent to your phone. Please approve it to complete your order.
            </p>
            <div className="mt-3 bg-muted rounded-xl p-3 text-sm text-left space-y-1">
              <p className="font-semibold text-foreground">📵 No prompt appeared?</p>
              {paymentMethod === 'ORANGE' ? (
                <p className="text-muted-foreground">Dial <strong className="text-orange-500">#150*50#</strong> on your Orange phone to approve manually.</p>
              ) : (
                <p className="text-muted-foreground">Dial <strong className="text-yellow-600">*126#</strong> on your MTN phone and follow the prompts to approve.</p>
              )}
            </div>
            <div className="mt-4 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          </>
        )}
        {isSuccess && (
          <>
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center animate-scale-in">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">Payment successful!</h2>
            <p className="text-muted-foreground text-sm mb-4">Your order has been confirmed.</p>
            <Button className="w-full" onClick={() => router.push(`/orders`)}>
              View my orders <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </>
        )}
        {isFailed && (
          <>
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-red-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">Payment failed</h2>
            <p className="text-muted-foreground text-sm mb-4">The payment could not be completed. Please try again.</p>
            <Button variant="outline" className="w-full" onClick={onClose}>Try again</Button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Main checkout page ───────────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const { resetCart } = useCartStore()
  const { toast } = useToast()

  const [cart, setCart]             = useState(null)
  const [loading, setLoading]       = useState(true)
  const [processing, setProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('MTN')
  const [fieldErrors, setFieldErrors]     = useState({})
  const [paymentStatus, setPaymentStatus] = useState(null)
  const [createdOrderId, setCreatedOrderId] = useState(null)
  const [pendingOrder, setPendingOrder] = useState(null)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName:  '',
    email:     '',
    phone:     '',
    address:   '',
    city:      'Tiko',
    state:     'South West',
    zipCode:   '',
    country:   'Cameroon',
  })

  const loadUserProfile = useCallback(async () => {
    try {
      const profile = await api.getCurrentUser()
      setFormData(prev => ({
        ...prev,
        firstName: profile.first_name || '',
        lastName:  profile.last_name  || '',
        email:     profile.email      || '',
        phone:     profile.phone      || '',
      }))
    } catch {}
  }, [])

  const loadCart = useCallback(async () => {
    setLoading(true)
    try {
      const cartData = await api.getCart()
      setCart(cartData)
      if (!cartData?.items?.length) {
        resetCart()
        toast({ title: 'Empty cart', description: 'Add items before placing an order', variant: 'destructive' })
        router.push('/products')
        return
      }
    } catch (err) {
      if (err.response?.status === 401) router.push('/login?redirect=/checkout')
    } finally {
      setLoading(false)
    }
  }, [resetCart, router, toast])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/checkout')
      return
    }
    loadCart()
    loadUserProfile()
  }, [isAuthenticated, loadCart, loadUserProfile, router])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: undefined }))
  }

  const pollPaymentStatus = async (transactionId, orderId) => {
    const maxAttempts = 24
    let attempts = 0
    const poll = async () => {
      attempts++
      try {
        const result = await api.checkPaymentStatus(transactionId)
        const s = result.status?.toUpperCase()
        if (s === 'SUCCESS') { setPaymentStatus('success'); setPendingOrder(null); return }
        if (s === 'FAILED' || s === 'EXPIRED') { setPaymentStatus('failed'); return }
        if (attempts < maxAttempts) setTimeout(poll, 5000)
        else setPaymentStatus('failed')
      } catch { if (attempts < maxAttempts) setTimeout(poll, 5000) }
    }
    poll()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errors = validateCheckoutForm(formData, paymentMethod)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      toast({ title: 'Invalid form', description: 'Please correct the errors and try again', variant: 'destructive' })
      return
    }

    setProcessing(true)
    try {
      let order = pendingOrder
      if (!order) {
        order = await api.createOrder({
          email:                    formData.email,
          phone:                    formData.phone.replace(/\s/g, ''),
          shipping_first_name:      formData.firstName,
          shipping_last_name:       formData.lastName,
          shipping_address_line1:   formData.address,
          shipping_city:            formData.city,
          shipping_state:           formData.state,
          shipping_country:         formData.country,
          shipping_postal_code:     formData.zipCode || '00000',
          billing_same_as_shipping: true,
          payment_method:           paymentMethod,
        })
        setPendingOrder(order)
        setCreatedOrderId(order.id)
        resetCart()
      }

      const phone = formData.phone.replace(/\s/g, '').replace(/^\+/, '')
      const normalizedPhone = phone.startsWith('237') ? phone : `237${phone.replace(/^0/, '')}`

      // Show the modal BEFORE the API call so user sees it immediately
      setPaymentStatus('pending')

      const payment = await api.initiatePayment(order.id, normalizedPhone, paymentMethod)

      if (payment.transaction_id) {
        await pollPaymentStatus(payment.transaction_id, order.id)
      } else {
        setPaymentStatus('success')
      }
    } catch (err) {
      console.error(err)
      setPaymentStatus(null) // close the pending modal on error
      const rawError = err.response?.data?.error || err.message || ''
      let friendlyError
      if (/balance.*low|low.*balance|payee.*limit|not.*allowed|insufficient/i.test(rawError)) {
        friendlyError = paymentMethod === 'ORANGE'
          ? 'Insufficient balance on your Orange Money account. Please top up and try again.'
          : 'Insufficient balance on your MTN Mobile Money account. Please top up and try again.'
      } else if (/invalid.*number|payer/i.test(rawError)) {
        friendlyError = 'Invalid phone number or not registered on ' + paymentMethod
      } else if (/too much time|took too long|timeout|timed out|expired/i.test(rawError)) {
        friendlyError = paymentMethod === 'ORANGE'
          ? 'You didn\'t confirm in time. Dial #150*50# on your Orange phone to approve manually, then try again.'
          : 'You didn\'t confirm in time. Dial *126# on your MTN phone to approve manually, then try again.'
      } else {
        friendlyError = rawError || 'Failed to process the order'
      }
      toast({
        title: 'Payment failed',
        description: friendlyError,
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2"><Skeleton className="h-96" /></div>
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  const cartItems = cart?.items || []
  const subtotal  = cartItems.reduce((s, i) => s + parseFloat(i.product.price) * i.quantity, 0)
  const shipping  = subtotal > 25000 ? 0 : 5
  const total     = subtotal + shipping

  return (
    <>
      <PaymentStatusModal
        status={paymentStatus}
        orderId={createdOrderId}
        onClose={() => setPaymentStatus(null)}
        paymentMethod={paymentMethod}
      />

      <div className="container mx-auto px-4 py-8 animate-fade-in">
        <h1 className="text-4xl font-bold mb-2">Checkout</h1>
        <p className="text-muted-foreground mb-8">Delivery to Tiko, Cameroon 🇨🇲</p>

        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-3 gap-8">
            {/* ── LEFT COLUMN ────────────────────────────────── */}
            <div className="md:col-span-2 space-y-6">

              {/* Contact Info */}
              <Card className="animate-fade-in stagger-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" /> Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="First Name" error={fieldErrors.firstName}>
                      <Input name="firstName" value={formData.firstName} onChange={handleInputChange}
                        className={fieldErrors.firstName ? 'border-destructive' : ''} />
                    </Field>
                    <Field label="Last Name" error={fieldErrors.lastName}>
                      <Input name="lastName" value={formData.lastName} onChange={handleInputChange}
                        className={fieldErrors.lastName ? 'border-destructive' : ''} />
                    </Field>
                  </div>
                  <Field label="Email" error={fieldErrors.email}>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input name="email" type="email" value={formData.email} onChange={handleInputChange}
                        className={`pl-10 ${fieldErrors.email ? 'border-destructive' : ''}`} />
                    </div>
                  </Field>
                  <Field label={`${paymentMethod} Phone Number`} error={fieldErrors.phone}>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input name="phone" type="tel" placeholder="+237 6XX XXX XXX"
                        value={formData.phone} onChange={handleInputChange}
                        className={`pl-10 ${fieldErrors.phone ? 'border-destructive' : ''}`} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This number will receive the Mobile Money payment request
                    </p>
                  </Field>
                </CardContent>
              </Card>

              {/* Shipping Address */}
              <Card className="animate-fade-in stagger-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" /> Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Field label="Address" error={fieldErrors.address}>
                    <Input name="address" placeholder="Street, neighbourhood…"
                      value={formData.address} onChange={handleInputChange}
                      className={fieldErrors.address ? 'border-destructive' : ''} />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="City" error={fieldErrors.city}>
                      <Input name="city" value={formData.city} onChange={handleInputChange}
                        className={fieldErrors.city ? 'border-destructive' : ''} />
                    </Field>
                    <div className="space-y-1">
                      <Label>Region</Label>
                      <Input name="state" value={formData.state} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>Postal Code</Label>
                      <Input name="zipCode" value={formData.zipCode} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-1">
                      <Label>Country</Label>
                      <Input name="country" value={formData.country} readOnly className="bg-muted" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card className="animate-fade-in stagger-3">
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* MTN */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('MTN')}
                      className={`p-4 border-2 rounded-xl flex flex-col items-center gap-3 transition-all card-hover btn-press ${
                        paymentMethod === 'MTN'
                          ? 'border-yellow-400 bg-yellow-50 shadow-md'
                          : 'border-border hover:border-yellow-300'
                      }`}
                    >
                      <MtnLogo active={paymentMethod === 'MTN'} />
                      <span className="text-sm font-semibold">MTN Mobile Money</span>
                      {paymentMethod === 'MTN' && (
                        <Badge className="bg-yellow-400 text-black text-xs">Selected ✓</Badge>
                      )}
                    </button>

                    {/* Orange */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('ORANGE')}
                      className={`p-4 border-2 rounded-xl flex flex-col items-center gap-3 transition-all card-hover btn-press ${
                        paymentMethod === 'ORANGE'
                          ? 'border-orange-500 bg-orange-50 shadow-md'
                          : 'border-border hover:border-orange-300'
                      }`}
                    >
                      <OrangeLogo active={paymentMethod === 'ORANGE'} />
                      <span className="text-sm font-semibold">Orange Money</span>
                      {paymentMethod === 'ORANGE' && (
                        <Badge className="bg-orange-500 text-white text-xs">Selected ✓</Badge>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                    <Lock className="h-4 w-4 shrink-0 text-green-600" />
                    <span>Secure payment via <strong>MeSomb</strong> — encrypted and protected</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ── ORDER SUMMARY ───────────────────────────── */}
            <div className="animate-fade-in-right">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Cart items */}
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex gap-3 animate-fade-in">
                        <div className="relative w-16 h-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                          <Image
                            src={item.product.featured_image || '/placeholder.jpg'}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm line-clamp-1">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          <p className="text-sm font-semibold text-primary">
                            {fcfa(parseFloat(item.product.price) * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">{fcfa(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Delivery</span>
                      <span className="font-medium">
                        {shipping === 0
                          ? <span className="text-green-600 font-semibold">FREE</span>
                          : fcfa(shipping)}
                      </span>
                    </div>
                    {subtotal < 25000 && (
                      <p className="text-xs text-primary bg-primary/10 p-2 rounded-lg">
                        Add {fcfa(25000 - subtotal)} more for free delivery 🚚
                      </p>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="font-bold text-lg">Total</span>
                      <span className="text-2xl font-bold text-primary">{fcfa(total)}</span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full btn-press animate-pulse-ring"
                    disabled={processing || !cartItems.length}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing…
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Pay {fcfa(total)} via {paymentMethod}
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    By placing your order, you agree to our{' '}
                    <a href="/terms" className="underline">terms of use</a>
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </>
  )
}
