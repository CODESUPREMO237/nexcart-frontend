'use client'

import { Suspense, useEffect, useState, useCallback, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { formatRating } from '@/lib/utils/format'
import useCartStore from '@/store/cartStore'
import useAuthStore from '@/store/authStore'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { ShoppingCart, Heart, Star, Search, Filter, Loader2, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

const fcfa = (n) =>
  new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n)

function ProductsList() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const { addItem } = useCartStore()
  const { isAuthenticated } = useAuthStore()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [addingToCart, setAddingToCart] = useState(null)
  const [addingToWishlist, setAddingToWishlist] = useState(null)

  const currentSearch = useMemo(() => searchParams.get('search') || '', [searchParams])
  const currentCategory = useMemo(() => searchParams.get('category') || '', [searchParams])

  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.getProducts({ search: currentSearch, category: currentCategory })
      setProducts(response.results || response)
    } catch {
      toast({ title: 'Error', description: 'Could not load products', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [currentSearch, currentCategory, toast])

  useEffect(() => {
    setSearchQuery(currentSearch)
    loadProducts()
  }, [currentSearch, loadProducts])

  useEffect(() => {
    const timer = setTimeout(() => {
      const nextParams = new URLSearchParams()
      const nextSearch = searchQuery.trim()
      if (nextSearch) nextParams.set('search', nextSearch)
      if (currentCategory) nextParams.set('category', currentCategory)
      const nextSearchVal = nextParams.get('search') || ''
      const nextCategoryVal = nextParams.get('category') || ''
      if (currentSearch === nextSearchVal && currentCategory === nextCategoryVal) return
      router.replace(`/products${nextParams.toString() ? '?' + nextParams.toString() : ''}`)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery, router, currentSearch, currentCategory])

  const handleAddToCart = async (product) => {
    if (!isAuthenticated) {
      toast({ title: 'Login required', description: 'Please sign in to add items to your cart', variant: 'destructive' })
      return
    }
    setAddingToCart(product.id)
    try {
      const result = await addItem(product.id, 1)
      if (result?.success) {
        toast({ title: 'Added to cart', description: `${product.name} added to your cart.`, variant: 'success' })
      } else {
        toast({ title: 'Error', description: result?.error || 'Could not add item', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Could not add item to cart', variant: 'destructive' })
    } finally {
      setAddingToCart(null)
    }
  }

  const handleAddToWishlist = async (product) => {
    if (!isAuthenticated) {
      toast({ title: 'Login required', description: 'Please sign in to save items', variant: 'destructive' })
      return
    }
    setAddingToWishlist(product.id)
    try {
      await api.addToWishlist(product.id)
      toast({ title: 'Saved to wishlist', description: `${product.name} saved.`, variant: 'success' })
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.error || 'Could not save item', variant: 'destructive' })
    } finally {
      setAddingToWishlist(null)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 max-w-6xl py-10">
        <div className="flex items-end justify-between mb-8 pb-4 border-b border-border">
          <div>
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-8 w-44" />
          </div>
          <Skeleton className="h-9 w-64" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1,2,3,4,5,6,7,8].map((i) => (
            <div key={i} className="border border-border rounded-md overflow-hidden">
              <Skeleton className="aspect-square" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-5 w-1/2 mt-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 max-w-6xl py-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-border gap-4">
        <div>
          <span className="font-mono text-xs uppercase tracking-[0.15em] text-accent">
            {currentCategory ? 'Category' : 'Catalog'}
          </span>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-foreground mt-1">
            {currentSearch ? `Results for "${currentSearch}"` : 'All Products'}
          </h1>
          {products.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">{products.length} products</p>
          )}
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products…"
              className="pl-9 h-9 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" className="btn-press h-9 shrink-0">
            <Filter className="h-3.5 w-3.5 mr-1.5" /> Filter
          </Button>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-24 animate-scale-in">
          <div className="w-16 h-16 rounded-md border border-border bg-muted flex items-center justify-center mx-auto mb-4">
            <Search className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium text-foreground mb-2">No products found</p>
          <p className="text-sm text-muted-foreground mb-6">Try a different search term or browse all products.</p>
          <Button size="sm" asChild className="btn-press">
            <Link href="/products">Browse all products <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" /></Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {products.map((product, idx) => {
            const isAdding = addingToCart === product.id
            const isWishlisting = addingToWishlist === product.id
            const isOutOfStock = !product.is_in_stock
            return (
              <div
                key={`${product.id}-${idx}`}
                className="product-card group animate-fade-in border border-border rounded-md overflow-hidden bg-card"
                style={{ animationDelay: `${Math.min(idx, 7) * 0.05}s` }}
              >
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <Link href={`/products/${product.id}`} className="block w-full h-full">
                    {product.featured_image ? (
                      <Image src={product.featured_image} alt={product.name} fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full bg-muted">
                        <span className="text-xs text-muted-foreground">No image</span>
                      </div>
                    )}
                  </Link>
                  {product.discount_percentage > 0 && (
                    <Badge className="absolute top-2.5 right-2.5 bg-destructive text-destructive-foreground rounded-sm text-xs px-1.5 font-mono">
                      -{product.discount_percentage}%
                    </Badge>
                  )}
                  <button
                    className="absolute top-2.5 left-2.5 h-7 w-7 rounded-md border border-border bg-background/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity btn-press"
                    onClick={() => handleAddToWishlist(product)}
                    disabled={isWishlisting}
                    aria-label="Save to wishlist"
                  >
                    {isWishlisting ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" /> : <Heart className="h-3.5 w-3.5 text-muted-foreground" />}
                  </button>
                </div>

                <div className="p-4">
                  <Link href={`/products/${product.id}`}>
                    <p className="text-sm font-medium text-foreground hover:text-accent transition-colors line-clamp-2 leading-snug mb-2">
                      {product.name}
                    </p>
                  </Link>
                  <div className="flex items-center gap-1 mb-3">
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-medium text-foreground">{formatRating(product.average_rating)}</span>
                    <span className="text-xs text-muted-foreground">({product.review_count || 0})</span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-4 font-mono">
                    <span className="text-base font-semibold text-foreground">{fcfa(product.price)}</span>
                    {product.compare_price && (
                      <span className="text-xs text-muted-foreground line-through">{fcfa(product.compare_price)}</span>
                    )}
                  </div>
                  <Button size="sm" className="w-full btn-press text-xs"
                    onClick={() => handleAddToCart(product)} disabled={isOutOfStock || isAdding}>
                    {isAdding ? (
                      <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Adding…</>
                    ) : isOutOfStock ? 'Out of stock' : (
                      <><ShoppingCart className="mr-1.5 h-3.5 w-3.5" />Add to cart</>
                    )}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 max-w-6xl py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1,2,3,4,5,6,7,8].map((i) => (
            <div key={i} className="border border-border rounded-md overflow-hidden">
              <Skeleton className="aspect-square" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-full" /><Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    }>
      <ProductsList />
    </Suspense>
  )
}
