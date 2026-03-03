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
  if (!data.firstName.trim()) errors.firstName = 'Le prénom est requis'
  if (!data.lastName.trim())  errors.lastName  = 'Le nom est requis'
  if (!data.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    errors.email = 'Adresse email invalide'

  const phone = data.phone.replace(/\s/g, '')
  if (!phone) {
    errors.phone = 'Le numéro de téléphone est requis'
  } else if (!CAMEROON_PHONE.test(phone)) {
    errors.phone = 'Numéro camerounais invalide (ex: +237 6XX XXX XXX)'
  } else if (paymentMethod === 'MTN' && !MTN_PREFIX.test(phone)) {
    errors.phone = 'Ce numéro ne semble pas être un numéro MTN (65x, 67x, 68x…)'
  } else if (paymentMethod === 'ORANGE' && !ORANGE_PREFIX.test(phone)) {
    errors.phone = 'Ce numéro ne semble pas être un numéro Orange (69x, 655-657…)'
  }

  if (!data.address.trim()) errors.address = "L'adresse est requise"
  if (!data.city.trim())    errors.city    = 'La ville est requise'
  return errors
}

// ── MTN Logo (betPawa-style: yellow rounded square + bold MTN text) ──
function MtnLogo({ active }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
      active ? 'bg-yellow-400' : 'bg-gray-100'
    }`}>
      {/* MTN yellow rounded square icon */}
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

// ── Orange Logo (betPawa-style: orange circle + Orange text) ──
function OrangeLogo({ active }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
      active ? 'bg-orange-100' : 'bg-gray-100'
    }`}>
      {/* Orange circle icon */}
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
function PaymentStatusModal({ status, orderId, onClose }) {
  const router = useRouter()
  if (!status) return null
  const isPending  = status === 'pending'
  const isSuccess  = status === 'success'
  const isFailed   = status === 'failed'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-scale-in">
      <div className="bg-background rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl text-center">
        {isPending && (
          <>
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-yellow-100 flex items-center justify-center animate-pulse">
              <Phone className="h-10 w-10 text-yellow-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">Paiement en cours…</h2>
            <p className="text-muted-foreground text-sm">
              Vérifiez votre téléphone et confirmez le paiement Mobile Money.
            </p>
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
            <h2 className="text-xl font-bold mb-2">Paiement réussi !</h2>
            <p className="text-muted-foreground text-sm mb-4">Votre commande a été confirmée.</p>
            <Button className="w-full" onClick={() => router.push(`/orders`)}>
              Voir mes commandes <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </>
        )}
        {isFailed && (
          <>
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-red-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">Paiement échoué</h2>
            <p className="text-muted-foreground text-sm mb-4">Le paiement n&apos;a pas abouti. Réessayez.</p>
            <Button variant="outline" className="w-full" onClick={onClose}>Réessayer</Button>
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
  const [paymentStatus, setPaymentStatus] = useState(null) // null | 'pending' | 'success' | 'failed'
  const [createdOrderId, setCreatedOrderId] = useState(null)
  const [pendingOrder, setPendingOrder] = useState(null)  // order created but payment failed — skip re-creating

  const [formData, setFormData] = useState({
    firstName: '',
    lastName:  '',
    email:     '',
    phone:     '',
    address:   '',
    city:      'Tiko',
    state:     'Sud-Ouest',
    zipCode:   '',
    country:   'Cameroun',
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
      // Always fetch fresh from server ? never rely on cached state
      const cartData = await api.getCart()
      setCart(cartData)
      if (!cartData?.items?.length) {
        // Also clear the local cart store so navbar badge resets
        resetCart()
        toast({ title: 'Panier vide', description: 'Ajoutez des articles avant de commander', variant: 'destructive' })
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
    // Clear error on change
    if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: undefined }))
  }

  // Poll payment status every 5 seconds for up to 2 minutes
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
      toast({ title: 'Formulaire invalide', description: 'Veuillez corriger les erreurs', variant: 'destructive' })
      return
    }

    setProcessing(true)
    try {
      // 1. Create order — reuse pending order if payment failed previously
      let order = pendingOrder
      if (!order) {
        order = await api.createOrder({
          email:                   formData.email,
          phone:                   formData.phone.replace(/\s/g, ''),
          shipping_first_name:     formData.firstName,
          shipping_last_name:      formData.lastName,
          shipping_address_line1:  formData.address,
          shipping_city:           formData.city,
          shipping_state:          formData.state,
          shipping_country:        formData.country,
          shipping_postal_code:    formData.zipCode || '00000',
          billing_same_as_shipping: true,
          payment_method:          paymentMethod,
        })
        setPendingOrder(order)
        setCreatedOrderId(order.id)
        // Reset local cart store — server already cleared it
        resetCart()
      }

      // 2. Initiate MeSomb payment
      const phone = formData.phone.replace(/\s/g, '').replace(/^\+/, '')
      const normalizedPhone = phone.startsWith('237') ? phone : `237${phone.replace(/^0/, '')}`

      const payment = await api.initiatePayment(order.id, normalizedPhone, paymentMethod)

      // 3. Show pending modal and start polling
      setPaymentStatus('pending')
      if (payment.transaction_id) {
        await pollPaymentStatus(payment.transaction_id, order.id)
      } else {
        // No transaction_id means gateway accepted it synchronously
        setPaymentStatus('success')
      }
    } catch (err) {
      console.error(err)
      const rawError = err.response?.data?.error || err.message || ''
      // Map known MeSomb errors to friendly messages
      let friendlyError
      if (/balance.*low|low.*balance|payee.*limit|not.*allowed|insufficient/i.test(rawError)) {
        friendlyError = paymentMethod === 'ORANGE'
          ? 'Solde insuffisant sur votre compte Orange Money. Rechargez votre compte et réessayez.'
          : 'Solde insuffisant sur votre compte MTN Mobile Money. Rechargez votre compte et réessayez.'
      } else if (/invalid.*number|payer/i.test(rawError)) {
        friendlyError = 'Numéro de téléphone invalide ou non enregistré sur ' + paymentMethod
      } else if (/timeout|timed out/i.test(rawError)) {
        friendlyError = 'La demande de paiement a expiré. Vérifiez votre téléphone et réessayez.'
      } else {
        friendlyError = rawError || 'Échec du traitement de la commande'
      }
      toast({
        title: 'Paiement échoué',
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
  const shipping  = subtotal > 25000 ? 0 : 2  // TODO: change back to 2000 after testing
  const total     = subtotal + shipping

  return (
    <>
      <PaymentStatusModal
        status={paymentStatus}
        orderId={createdOrderId}
        onClose={() => setPaymentStatus(null)}
      />

      <div className="container mx-auto px-4 py-8 animate-fade-in">
        <h1 className="text-4xl font-bold mb-2">Paiement</h1>
        <p className="text-muted-foreground mb-8">Livraison vers Tiko, Cameroun 🇨🇲</p>

        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-3 gap-8">
            {/* ── LEFT COLUMN ────────────────────────────────── */}
            <div className="md:col-span-2 space-y-6">

              {/* Contact Info */}
              <Card className="animate-fade-in stagger-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" /> Informations de contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Prénom" error={fieldErrors.firstName}>
                      <Input name="firstName" value={formData.firstName} onChange={handleInputChange}
                        className={fieldErrors.firstName ? 'border-destructive' : ''} />
                    </Field>
                    <Field label="Nom" error={fieldErrors.lastName}>
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
                  <Field label={`Numéro de téléphone ${paymentMethod}`} error={fieldErrors.phone}>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input name="phone" type="tel" placeholder="+237 6XX XXX XXX"
                        value={formData.phone} onChange={handleInputChange}
                        className={`pl-10 ${fieldErrors.phone ? 'border-destructive' : ''}`} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Ce numéro recevra la demande de paiement Mobile Money
                    </p>
                  </Field>
                </CardContent>
              </Card>

              {/* Shipping Address */}
              <Card className="animate-fade-in stagger-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" /> Adresse de livraison
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Field label="Adresse" error={fieldErrors.address}>
                    <Input name="address" placeholder="Rue, quartier…"
                      value={formData.address} onChange={handleInputChange}
                      className={fieldErrors.address ? 'border-destructive' : ''} />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Ville" error={fieldErrors.city}>
                      <Input name="city" value={formData.city} onChange={handleInputChange}
                        className={fieldErrors.city ? 'border-destructive' : ''} />
                    </Field>
                    <div className="space-y-1">
                      <Label>Région</Label>
                      <Input name="state" value={formData.state} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>Code postal</Label>
                      <Input name="zipCode" value={formData.zipCode} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-1">
                      <Label>Pays</Label>
                      <Input name="country" value={formData.country} readOnly className="bg-muted" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card className="animate-fade-in stagger-3">
                <CardHeader>
                  <CardTitle>Mode de paiement</CardTitle>
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
                        <Badge className="bg-yellow-400 text-black text-xs">Sélectionné ✓</Badge>
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
                        <Badge className="bg-orange-500 text-white text-xs">Sélectionné ✓</Badge>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                    <Lock className="h-4 w-4 shrink-0 text-green-600" />
                    <span>Paiement sécurisé via <strong>MeSomb</strong> — chiffré et protégé</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ── ORDER SUMMARY ───────────────────────────── */}
            <div className="animate-fade-in-right">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Récapitulatif</CardTitle>
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
                          <p className="text-xs text-muted-foreground">Qté : {item.quantity}</p>
                          <p className="text-sm font-semibold text-primary">
                            {fcfa(parseFloat(item.product.price) * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Sous-total</span>
                      <span className="font-medium">{fcfa(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Livraison</span>
                      <span className="font-medium">
                        {shipping === 0
                          ? <span className="text-green-600 font-semibold">GRATUITE</span>
                          : fcfa(shipping)}
                      </span>
                    </div>
                    {subtotal < 25000 && (
                      <p className="text-xs text-primary bg-primary/10 p-2 rounded-lg">
                        Ajoutez {fcfa(25000 - subtotal)} pour la livraison gratuite 🚚
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
                        Traitement…
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Payer {fcfa(total)} via {paymentMethod}
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    En passant votre commande, vous acceptez nos{' '}
                    <a href="/terms" className="underline">conditions d&apos;utilisation</a>
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



