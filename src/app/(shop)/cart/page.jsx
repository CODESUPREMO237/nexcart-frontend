'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/useToast'
import useAuthStore from '@/store/authStore'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Minus, Plus, X, ShoppingBag, ArrowRight, Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

const fcfa = (n) =>
  new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n)

export default function CartPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useLanguage()
  const { isAuthenticated, authReady, checkAuth } = useAuthStore()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updatingItem, setUpdatingItem] = useState(null)

  useEffect(() => { checkAuth() }, [checkAuth])

  const loadCart = useCallback(async () => {
    try {
      const cartData = await api.getCart()
      setCart(cartData)
    } catch (error) {
      if (error.response?.status === 401) { router.push('/login?redirect=/cart'); return }
      toast({ title: t('common.error'), description: 'Failed to load cart', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [router, toast])

  useEffect(() => {
    if (!authReady) return
    if (!isAuthenticated) { router.push('/login?redirect=/cart'); return }
    loadCart()
  }, [authReady, isAuthenticated, router, loadCart])

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return
    setUpdatingItem(itemId)
    try {
      await api.updateCartItem(itemId, newQuantity)
      await loadCart()
      toast({ title: 'Cart updated', description: 'Quantity updated.', variant: 'success' })
    } catch {
      toast({ title: 'Error', description: 'Failed to update quantity', variant: 'destructive' })
    } finally {
      setUpdatingItem(null)
    }
  }

  const removeItem = async (itemId, productName) => {
    setUpdatingItem(itemId)
    try {
      await api.removeFromCart(itemId)
      await loadCart()
      toast({ title: 'Item removed', description: `${productName} removed.`, variant: 'success' })
    } catch {
      toast({ title: 'Error', description: 'Failed to remove item', variant: 'destructive' })
    } finally {
      setUpdatingItem(null)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 max-w-6xl py-10">
        <Skeleton className="h-8 w-40 mb-8" />
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            {[1,2,3].map((i) => <Skeleton key={i} className="h-32 rounded-md" />)}
          </div>
          <Skeleton className="h-64 rounded-md" />
        </div>
      </div>
    )
  }

  const cartItems = cart?.items || []
  const subtotal  = cartItems.reduce((s, i) => s + parseFloat(i.product.price) * i.quantity, 0)
  const shipping  = subtotal > 25000 ? 0 : 5
  const total     = subtotal + shipping

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 max-w-6xl py-24 animate-fade-in">
        <div className="max-w-sm mx-auto text-center">
          <div className="w-16 h-16 rounded-md border border-border bg-muted flex items-center justify-center mx-auto mb-5">
            <ShoppingBag className="w-7 h-7 text-muted-foreground" />
          </div>
          <h1 className="font-display font-bold text-2xl text-foreground mb-2">{t('cart.empty')}</h1>
          <p className="text-sm text-muted-foreground mb-7">{t('cart.empty_desc')}</p>
          <Button size="sm" asChild className="btn-press">
            <Link href="/products">{t('cart.start_shopping')} <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 max-w-6xl py-10 animate-fade-in">
      {/* Header */}
      <div className="mb-8 pb-4 border-b border-border">
        <span className="font-mono text-xs uppercase tracking-[0.15em] text-accent">Shopping</span>
        <h1 className="font-display font-bold text-2xl md:text-3xl text-foreground mt-1">
          {t('cart.title')} <span className="text-muted-foreground font-normal text-lg">({cartItems.length})</span>
        </h1>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Items */}
        <div className="md:col-span-2 space-y-4">
          {cartItems.map((item, idx) => {
            const isUpdating = updatingItem === item.id
            return (
              <div
                key={item.id}
                className={`animate-fade-in border border-border rounded-md bg-card p-5 transition-opacity ${isUpdating ? 'opacity-50' : ''}`}
                style={{ animationDelay: `${idx * 0.06}s` }}
              >
                <div className="flex gap-4">
                  <Link href={`/products/${item.product.id}`}
                    className="relative w-20 h-20 shrink-0 overflow-hidden rounded-md bg-muted group">
                    <Image src={item.product.featured_image || '/placeholder.jpg'} alt={item.product.name}
                      fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex-1 min-w-0 pr-2">
                        <Link href={`/products/${item.product.id}`}>
                          <p className="font-medium text-sm text-foreground hover:text-accent transition-colors line-clamp-1">
                            {item.product.name}
                          </p>
                        </Link>
                        {item.product.category && (
                          <span className="text-xs text-muted-foreground">{item.product.category.name}</span>
                        )}
                      </div>
                      <button
                        className="h-6 w-6 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors btn-press shrink-0"
                        onClick={() => removeItem(item.id, item.product.name)}
                        disabled={isUpdating}
                        aria-label="Remove item"
                      >
                        {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1 border border-border rounded-md overflow-hidden">
                        <button
                          className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={isUpdating || item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-mono font-medium">{item.quantity}</span>
                        <button
                          className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={isUpdating || item.quantity >= item.product.stock_quantity}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-semibold text-foreground">
                          {fcfa(parseFloat(item.product.price) * item.quantity)}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">{fcfa(item.product.price)} / {t('cart.unit')}</p>
                      </div>
                    </div>

                    {item.product.stock_quantity < 10 && (
                      <p className="text-xs text-destructive mt-2">{t('cart.low_stock').replace('{n}', item.product.stock_quantity)}</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary */}
        <div className="animate-fade-in stagger-2">
          <div className="sticky top-20 border border-border rounded-md bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-muted/40">
              <span className="font-mono text-xs uppercase tracking-[0.15em] text-foreground">Order Summary</span>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('cart.subtotal')} ({cartItems.length} {t('cart.item_count')}{cartItems.length > 1 ? 's' : ''})</span>
                <span className="font-mono font-medium">{fcfa(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('cart.delivery')}</span>
                <span className="font-mono font-medium">
                  {shipping === 0
                    ? <span className="text-foreground font-semibold">{t('delivery.free')}</span>
                    : fcfa(shipping)}
                </span>
              </div>
              {subtotal < 25000 && (
                <div className="bg-muted border border-border rounded-md p-3">
                  <p className="text-xs text-muted-foreground">
                    Add <span className="font-mono font-semibold text-foreground">{fcfa(25000 - subtotal)}</span> {t('cart.add_more_free')}
                  </p>
                </div>
              )}
              <div className="border-t border-border pt-3 flex justify-between items-baseline">
                <span className="font-semibold text-foreground">{t('cart.total')}</span>
                <span className="font-mono font-bold text-xl text-foreground">{fcfa(total)}</span>
              </div>
            </div>
            <div className="px-5 pb-5 space-y-2">
              <Button size="sm" className="w-full btn-press" onClick={() => router.push('/checkout')}>
                {t('cart.checkout')} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="sm" className="w-full btn-press" asChild>
                <Link href="/products">{t('cart.continue_shopping')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
