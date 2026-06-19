'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRequireAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { api } from '@/lib/api'
import useCartStore from '@/store/cartStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Heart, ShoppingCart, X, Star, Loader2, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

const fcfa = (n) =>
  new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n)

export default function WishlistPage() {
  const { isLoading: authLoading, isAuthorized } = useRequireAuth()
  const { toast } = useToast()
  const { addItem } = useCartStore()
  const [wishlist, setWishlist] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)
  const [addingToCart, setAddingToCart] = useState(null)

  const loadWishlist = useCallback(async () => {
    try {
      const data = await api.getWishlist()
      setWishlist(data.results || data || [])
    } catch {
      toast({ title: 'Error', description: 'Failed to load wishlist', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (isAuthorized) loadWishlist()
  }, [isAuthorized, loadWishlist])

  const handleRemove = async (wishlistId) => {
    setUpdating(wishlistId)
    try {
      await api.removeFromWishlist(wishlistId)
      await loadWishlist()
      toast({ title: 'Removed', description: 'Item removed from wishlist.', variant: 'success' })
    } catch {
      toast({ title: 'Error', description: 'Failed to remove item', variant: 'destructive' })
    } finally {
      setUpdating(null)
    }
  }

  const handleAddToCart = async (productId, wishlistId) => {
    setAddingToCart(wishlistId)
    try {
      const result = await addItem(productId, 1)
      if (result.success) {
        await handleRemove(wishlistId)
        toast({ title: 'Moved to cart', description: 'Item moved from wishlist to cart.', variant: 'success' })
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to add to cart', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to add to cart', variant: 'destructive' })
    } finally {
      setAddingToCart(null)
    }
  }

  if (authLoading || !isAuthorized || loading) {
    return (
      <div className="container mx-auto px-4 max-w-6xl py-10">
        <Skeleton className="h-8 w-40 mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1,2,3,4].map((i) => (
            <div key={i} className="border border-border rounded-md overflow-hidden">
              <Skeleton className="aspect-square" />
              <div className="p-4 space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-5 w-1/2" /></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (wishlist.length === 0) {
    return (
      <div className="container mx-auto px-4 max-w-6xl py-24 animate-fade-in">
        <div className="max-w-sm mx-auto text-center">
          <div className="w-16 h-16 rounded-md border border-border bg-muted flex items-center justify-center mx-auto mb-5">
            <Heart className="w-7 h-7 text-muted-foreground" />
          </div>
          <h1 className="font-display font-bold text-2xl text-foreground mb-2">Your wishlist is empty</h1>
          <p className="text-sm text-muted-foreground mb-7">Save products you love and shop them later.</p>
          <Button size="sm" asChild className="btn-press">
            <Link href="/products">Discover products <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 max-w-6xl py-10 animate-fade-in">
      <div className="mb-8 pb-4 border-b border-border flex items-end justify-between">
        <div>
          <span className="font-mono text-xs uppercase tracking-[0.15em] text-accent">Saved</span>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-foreground mt-1">
            My Wishlist <span className="text-muted-foreground font-normal text-lg">({wishlist.length})</span>
          </h1>
        </div>
        <Button variant="outline" size="sm" asChild className="btn-press">
          <Link href="/products">Continue shopping</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {wishlist.map((item, idx) => {
          const rating = typeof item.product.average_rating === 'number'
            ? item.product.average_rating.toFixed(1)
            : item.product.average_rating ? parseFloat(item.product.average_rating).toFixed(1) : '0.0'
          const isUpdating = updating === item.id
          const isAddingToCart = addingToCart === item.id

          return (
            <div
              key={item.id}
              className="product-card group animate-fade-in border border-border rounded-md overflow-hidden bg-card relative"
              style={{ animationDelay: `${idx * 0.06}s` }}
            >
              {/* Remove button */}
              <button
                className="absolute top-2.5 right-2.5 z-10 h-7 w-7 rounded-md border border-border bg-background/90 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors btn-press"
                onClick={() => handleRemove(item.id)}
                disabled={isUpdating || isAddingToCart}
                aria-label="Remove from wishlist"
              >
                {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
              </button>

              {/* Image */}
              <div className="relative aspect-square overflow-hidden bg-muted">
                <Link href={`/products/${item.product.id}`} className="block w-full h-full">
                  <Image src={item.product.featured_image || '/placeholder.jpg'} alt={item.product.name} fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  {item.product.discount_percentage > 0 && (
                    <Badge className="absolute top-2.5 left-2.5 bg-destructive text-destructive-foreground rounded-sm text-xs px-1.5 font-mono">
                      -{item.product.discount_percentage}%
                    </Badge>
                  )}
                </Link>
              </div>

              <div className="p-4">
                <Link href={`/products/${item.product.id}`}>
                  <p className="text-sm font-medium text-foreground hover:text-accent transition-colors line-clamp-2 leading-snug mb-2">
                    {item.product.name}
                  </p>
                </Link>
                <div className="flex items-center gap-1 mb-3">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-medium">{rating}</span>
                  <span className="text-xs text-muted-foreground">({item.product.review_count || 0})</span>
                </div>
                <div className="flex items-baseline gap-2 mb-4 font-mono">
                  <span className="text-base font-semibold text-foreground">
                    {Number(item.product.price || 0).toLocaleString('fr-CM')} FCFA
                  </span>
                  {item.product.compare_price && (
                    <span className="text-xs text-muted-foreground line-through">
                      {Number(item.product.compare_price || 0).toLocaleString('fr-CM')} FCFA
                    </span>
                  )}
                </div>
                {!item.product.is_in_stock && (
                  <p className="text-xs text-destructive mb-3">Out of stock</p>
                )}
                <Button size="sm" className="w-full btn-press text-xs"
                  onClick={() => handleAddToCart(item.product.id, item.id)}
                  disabled={!item.product.is_in_stock || isAddingToCart || isUpdating}>
                  {isAddingToCart ? (
                    <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Adding…</>
                  ) : (
                    <><ShoppingCart className="mr-1.5 h-3.5 w-3.5" />Move to cart</>
                  )}
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
