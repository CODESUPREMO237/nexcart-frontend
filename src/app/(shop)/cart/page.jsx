'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
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
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updatingItem, setUpdatingItem] = useState(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const loadCart = useCallback(async () => {
    try {
      const cartData = await api.getCart()
      setCart(cartData)
    } catch (error) {
      if (error.response?.status === 401) { router.push('/login?redirect=/cart'); return }
      toast({ title: 'Error', description: 'Failed to load cart', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [router, toast])

  useEffect(() => {
    if (!mounted) return
    const token = localStorage.getItem('access_token')
    if (!token) { router.push('/login?redirect=/cart'); return }
    loadCart()
  }, [mounted, router, loadCart])

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return
    setUpdatingItem(itemId)
    try {
      await api.updateCartItem(itemId, newQuantity)
      await loadCart()
      toast({ title: 'Cart updated', description: 'Quantity has been changed.', variant: 'success' })
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
      toast({ title: 'Item removed', description: `${productName} was removed from your cart.`, variant: 'success' })
    } catch {
      toast({ title: 'Error', description: 'Failed to remove item', variant: 'destructive' })
    } finally {
      setUpdatingItem(null)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
          </div>
          <Skeleton className="h-64" />
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
      <div className="container mx-auto px-4 py-20 animate-fade-in">
        <div className="max-w-md mx-auto text-center">
          <ShoppingBag className="w-24 h-24 mx-auto mb-6 text-muted-foreground animate-float" />
          <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8">
            You haven&apos;t added any items to your cart yet.
          </p>
          <Button size="lg" asChild className="btn-press">
            <Link href="/products">
              Start shopping
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <h1 className="text-4xl font-bold mb-8">My Cart</h1>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="md:col-span-2 space-y-4">
          {cartItems.map((item, idx) => {
            const isUpdating = updatingItem === item.id
            return (
              <Card key={item.id} className={`card-hover animate-fade-in stagger-${Math.min(idx + 1, 8)} ${isUpdating ? 'opacity-60' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <Link href={`/products/${item.product.id}`} className="relative w-24 h-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted group">
                      <Image
                        src={item.product.featured_image || '/placeholder.jpg'}
                        alt={item.product.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <Link href={`/products/${item.product.id}`}>
                            <h3 className="font-semibold text-lg hover:text-primary line-clamp-1 transition-colors">
                              {item.product.name}
                            </h3>
                          </Link>
                          {item.product.category && (
                            <Badge variant="secondary" className="mt-1">{item.product.category.name}</Badge>
                          )}
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeItem(item.id, item.product.name)} disabled={isUpdating} className="btn-press">
                          {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" className="h-8 w-8 btn-press"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={isUpdating || item.quantity <= 1}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-12 text-center font-medium">{item.quantity}</span>
                          <Button variant="outline" size="icon" className="h-8 w-8 btn-press"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={isUpdating || item.quantity >= item.product.stock_quantity}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">
                            {fcfa(parseFloat(item.product.price) * item.quantity)}
                          </p>
                          <p className="text-sm text-muted-foreground">{fcfa(item.product.price)} / unit</p>
                        </div>
                      </div>
                      {item.product.stock_quantity < 10 && (
                        <Badge variant="destructive" className="mt-2">
                          Only {item.product.stock_quantity} left in stock!
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Order Summary */}
        <div className="animate-fade-in-right">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal ({cartItems.length} item{cartItems.length > 1 ? 's' : ''})</span>
                <span className="font-medium">{fcfa(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span className="font-medium">
                  {shipping === 0
                    ? <Badge variant="secondary" className="bg-green-100 text-green-800">FREE</Badge>
                    : fcfa(shipping)}
                </span>
              </div>
              {subtotal < 25000 && shipping > 0 && (
                <div className="bg-primary/10 p-3 rounded-lg">
                  <p className="text-sm text-primary font-medium">
                    Add {fcfa(25000 - subtotal)} more for free delivery 🚚
                  </p>
                </div>
              )}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-3xl font-bold text-primary">{fcfa(total)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-2">
              <Button size="lg" className="w-full btn-press" onClick={() => router.push('/checkout')}>
                Proceed to checkout
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="w-full btn-press" asChild>
                <Link href="/products">Continue shopping</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
