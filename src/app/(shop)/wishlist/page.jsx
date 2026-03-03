'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRequireAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { api } from '@/lib/api'
import useCartStore from '@/store/cartStore'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Heart, ShoppingCart, X, Star, Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function WishlistPage() {
  const { isLoading: authLoading, isAuthorized } = useRequireAuth()
  const { toast } = useToast()
  const { addItem } = useCartStore()
  const [wishlist, setWishlist] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null) // Track which item is being updated
  const [addingToCart, setAddingToCart] = useState(null) // Track which item is being added to cart

  const loadWishlist = useCallback(async () => {
    try {
      const wishlistData = await api.getWishlist()
      setWishlist(wishlistData.results || wishlistData || [])
    } catch (error) {
      console.error('Failed to load wishlist:', error)
      toast({
        title: 'Error',
        description: 'Failed to load wishlist',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (isAuthorized) {
      loadWishlist()
    }
  }, [isAuthorized, loadWishlist])

  const handleRemove = async (wishlistId) => {
    setUpdating(wishlistId)
    try {
      await api.removeFromWishlist(wishlistId)
      await loadWishlist()
      toast({
        title: 'Removed from wishlist',
        description: 'Item has been removed from your wishlist.',
        variant: 'success'
      })
    } catch (error) {
      console.error('Failed to remove from wishlist:', error)
      toast({
        title: 'Error',
        description: 'Failed to remove item from wishlist',
        variant: 'destructive'
      })
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
        toast({
          title: 'Added to cart!',
          description: 'Item moved from wishlist to cart.',
          variant: 'success'
        })
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to add to cart',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Failed to add to cart:', error)
      toast({
        title: 'Error',
        description: 'Failed to add to cart',
        variant: 'destructive'
      })
    } finally {
      setAddingToCart(null)
    }
  }

  if (authLoading || !isAuthorized || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    )
  }

  if (wishlist.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto text-center">
          <Heart className="w-24 h-24 mx-auto mb-6 text-muted-foreground" />
          <h1 className="text-3xl font-bold mb-4">Your Wishlist is Empty</h1>
          <p className="text-muted-foreground mb-8">
            Save your favorite products to your wishlist and shop them later!
          </p>
          <Button size="lg" asChild>
            <Link href="/products">Discover Products</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">My Wishlist</h1>
        <p className="text-muted-foreground">{wishlist.length} items</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {wishlist.map((item) => {
          // Fix: Handle rating safely
          const rating = typeof item.product.average_rating === 'number' 
            ? item.product.average_rating.toFixed(1)
            : item.product.average_rating 
              ? parseFloat(item.product.average_rating).toFixed(1)
              : '0.0'

          const isUpdating = updating === item.id
          const isAddingToCart = addingToCart === item.id

          return (
            <Card key={item.id} className="group hover:shadow-xl transition-all relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10 bg-background/80 hover:bg-background"
                onClick={() => handleRemove(item.id)}
                disabled={isUpdating || isAddingToCart}
              >
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </Button>

              <CardHeader className="p-0">
                <Link href={`/products/${item.product.id}`}>
                  <div className="relative aspect-square overflow-hidden rounded-t-lg bg-muted group">
                    <Image
                      src={item.product.featured_image || '/placeholder.jpg'}
                      alt={item.product.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    {item.product.discount_percentage > 0 && (
                      <Badge className="absolute top-3 left-3 bg-destructive">
                        -{item.product.discount_percentage}%
                      </Badge>
                    )}
                  </div>
                </Link>
              </CardHeader>

              <CardContent className="p-4">
                <Link href={`/products/${item.product.id}`}>
                  <CardTitle className="text-lg mb-3 hover:text-primary transition-colors line-clamp-2 leading-tight">
                    {item.product.name}
                  </CardTitle>
                </Link>

                <div className="flex items-center mb-3">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="ml-1 text-sm font-medium">
                      {rating}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground ml-2">
                    ({item.product.review_count || 0} reviews)
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-primary">
                    {Number(item.product.price || 0).toLocaleString('fr-CM')} FCFA
                  </span>
                  {item.product.compare_price && (
                    <span className="text-sm text-muted-foreground line-through">
                      {Number(item.product.compare_price || 0).toLocaleString('fr-CM')} FCFA
                    </span>
                  )}
                </div>

                {!item.product.is_in_stock && (
                  <Badge variant="destructive" className="mt-2">
                    Out of Stock
                  </Badge>
                )}
              </CardContent>

              <CardFooter className="p-4 pt-0">
                <Button
                  className="w-full"
                  onClick={() => handleAddToCart(item.product.id, item.id)}
                  disabled={!item.product.is_in_stock || isAddingToCart || isUpdating}
                >
                  {isAddingToCart ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Add to Cart
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      <div className="mt-12 text-center">
        <Button variant="outline" size="lg" asChild>
          <Link href="/products">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  )
}