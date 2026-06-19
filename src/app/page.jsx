// Location: app\page.jsx
'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import useCartStore from '@/store/cartStore'
import useAuthStore from '@/store/authStore'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatRating, formatProductsArray } from '@/lib/utils/format'
import { ShoppingCart, Heart, Star, ArrowRight, ArrowUpRight, ShieldCheck, Truck, Check, Loader2, MapPin, Zap, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ProductImage from '@/components/ProductImage'

const fcfa = (n) =>
  new Intl.NumberFormat('en-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n)

const TRUST_POINTS = [
  { label: 'Verified sellers', desc: 'Every vendor passes KYC review before listing.' },
  { label: 'Mobile money checkout', desc: 'Pay with MTN Mobile Money or Orange Money.' },
  { label: 'Local delivery', desc: 'Tracked delivery from Tiko across the Southwest.' },
]

const FEATURES = [
  { icon: Truck, label: 'Free delivery', desc: 'On orders over 25,000 FCFA' },
  { icon: ShieldCheck, label: 'Secure payments', desc: 'MTN & Orange Money, verified' },
  { icon: RotateCcw, label: 'Easy returns', desc: '30-day return window' },
]

const STATS = [
  { value: '2,400+', label: 'Products listed' },
  { value: '180+', label: 'Active sellers' },
  { value: 'SW Region', label: 'Delivery coverage' },
]

export default function HomePage() {
  const router = useRouter()
  const { addItem } = useCartStore()
  const { isAuthenticated, user } = useAuthStore()
  const { toast } = useToast()
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [recommendations, setRecommendations]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [addingToCart, setAddingToCart]         = useState(null)
  const [addingToWishlist, setAddingToWishlist] = useState(null)

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      router.replace('/admin/products')
    } else {
      loadData()
    }
  }, [isAuthenticated, user, router])

  const loadData = async () => {
    try {
      setError(null)
      const [featured, recommended] = await Promise.all([
        api.getFeaturedProducts().catch(() => ({ results: [] })),
        api.getRecommendations().catch(() => ({ results: [] })),
      ])
      setFeaturedProducts(formatProductsArray(featured.results || featured || []))
      setRecommendations(formatProductsArray(recommended.results || recommended || []))
    } catch {
      setError('Unable to load products. Please make sure the server is running.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async (product) => {
    if (!isAuthenticated) {
      toast({ title: 'Login required', description: 'Please sign in to add items to your cart', variant: 'destructive' })
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
      return
    }
    setAddingToCart(product.id)
    try {
      const result = await addItem(product.id, 1)
      if (result?.success) {
        toast({ title: 'Added to cart', description: `${product.name} has been added to your cart.`, variant: 'success' })
      } else if (result?.error) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Could not add item to cart', variant: 'destructive' })
    } finally {
      setAddingToCart(null)
    }
  }

  const handleAddToWishlist = async (product) => {
    if (!isAuthenticated) {
      toast({ title: 'Login required', description: 'Please sign in to save items to your wishlist', variant: 'destructive' })
      return
    }
    setAddingToWishlist(product.id)
    try {
      await api.addToWishlist(product.id)
      await api.trackActivity('wishlist', product.id)
      toast({ title: 'Added to wishlist', description: `${product.name} has been saved to your wishlist.`, variant: 'success' })
    } catch {
      toast({ title: 'Error', description: 'Could not add item to wishlist', variant: 'destructive' })
    } finally {
      setAddingToWishlist(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <section className="border-b border-border py-24">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="space-y-5 max-w-2xl">
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-4/5" />
              <Skeleton className="h-5 w-3/5 mt-2" />
              <div className="flex gap-3 pt-4">
                <Skeleton className="h-11 w-40" />
                <Skeleton className="h-11 w-40" />
              </div>
            </div>
          </div>
        </section>
        <section className="container mx-auto px-4 max-w-6xl py-20">
          <Skeleton className="h-3 w-24 mb-3" />
          <Skeleton className="h-9 w-52 mb-10" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-md border border-border overflow-hidden">
                <Skeleton className="aspect-square" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-5 w-1/2 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative border-b border-border overflow-hidden">
        {/* Subtle grid backdrop — the signature structural element */}
        <div className="hero-grid-bg absolute inset-0 pointer-events-none" aria-hidden />

        <div className="relative container mx-auto px-4 max-w-6xl py-20 md:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-14 lg:gap-20 items-start">

            {/* Left */}
            <div className="animate-fade-in">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 mb-7">
                <MapPin className="h-3 w-3 text-accent" />
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  NexCart · Tiko, Cameroon
                </span>
              </div>

              {/* Headline */}
              <h1 className="font-display font-bold text-[clamp(2.4rem,5.5vw,4rem)] text-foreground leading-[1.04] tracking-tight mb-6 max-w-[580px]">
                The marketplace built for how{' '}
                <span className="text-accent">Cameroon</span>{' '}
                shops.
              </h1>

              <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-8 max-w-[480px]">
                Local sellers. Mobile money checkout. Tracked delivery across the Southwest.
                One platform, zero friction.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" asChild className="px-7 font-medium">
                  <Link href="/products">
                    Browse products
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="px-7 font-medium">
                  <Link href="/vendor/register">Sell on NexCart</Link>
                </Button>
              </div>

              {/* Stats row */}
              <div className="flex flex-wrap gap-x-8 gap-y-4 mt-12 pt-10 border-t border-border">
                {STATS.map(({ value, label }) => (
                  <div key={label}>
                    <p className="font-display font-bold text-2xl text-foreground">{value}</p>
                    <p className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Trust panel */}
            <div className="animate-fade-in stagger-2 lg:pt-2">
              <div className="border border-border bg-card rounded-md shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-border bg-muted/40 flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-accent" />
                  <span className="font-mono text-xs uppercase tracking-[0.15em] text-foreground">
                    Why NexCart
                  </span>
                </div>
                <ul className="divide-y divide-border">
                  {TRUST_POINTS.map(({ label, desc }) => (
                    <li key={label} className="px-5 py-4 flex gap-3 items-start">
                      <span className="mt-0.5 h-4 w-4 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                        <Check className="h-2.5 w-2.5 text-accent" />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-foreground leading-snug">{label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="px-5 py-4 bg-accent/5 border-t border-border">
                  <Link
                    href="/products"
                    className="text-xs font-mono uppercase tracking-[0.12em] text-accent hover:text-accent/80 transition-colors inline-flex items-center gap-1"
                  >
                    Start shopping
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature strip ────────────────────────────────────── */}
      <section className="border-b border-border">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y divide-border md:divide-y-0 md:divide-x md:divide-border">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-4 py-5 md:px-8 first:md:pl-0 last:md:pr-0">
                <div className="h-9 w-9 rounded-md border border-border bg-muted flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Error ────────────────────────────────────────────── */}
      {error && (
        <section className="container mx-auto px-4 max-w-6xl py-8">
          <div className="bg-destructive/8 border border-destructive/20 rounded-md p-6 text-center animate-scale-in">
            <p className="text-destructive font-medium text-sm mb-4">{error}</p>
            <Button size="sm" onClick={loadData} className="btn-press">Try again</Button>
          </div>
        </section>
      )}

      {/* ── Featured Products ─────────────────────────────────── */}
      {featuredProducts.length > 0 && (
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4 max-w-6xl">
            {/* Section header */}
            <div className="flex items-end justify-between mb-8 pb-4 border-b border-border">
              <div>
                <span className="font-mono text-xs uppercase tracking-[0.15em] text-accent">Catalog</span>
                <h2 className="font-display font-semibold text-2xl md:text-3xl text-foreground mt-1">Featured products</h2>
              </div>
              <Link
                href="/products"
                className="text-xs font-mono uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 group"
              >
                View all
                <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featuredProducts.slice(0, 8).map((product, i) => {
                const isAdding = addingToCart === product.id
                const isWishlisting = addingToWishlist === product.id
                return (
                  <div
                    key={product.id}
                    className="product-card group animate-fade-in border border-border rounded-md overflow-hidden bg-card"
                    style={{ animationDelay: `${i * 0.06}s` }}
                  >
                    {/* Image */}
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      <Link href={`/products/${product.id}`} className="block w-full h-full">
                        <ProductImage
                          src={product.featured_image}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {product.discount_percentage > 0 && (
                          <Badge className="absolute top-2.5 right-2.5 bg-destructive text-destructive-foreground rounded-sm text-xs px-1.5 py-0.5 font-mono">
                            -{product.discount_percentage}%
                          </Badge>
                        )}
                      </Link>
                      <button
                        className="absolute top-2.5 left-2.5 h-7 w-7 rounded-md border border-border bg-background/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity btn-press"
                        onClick={() => handleAddToWishlist(product)}
                        disabled={isWishlisting}
                        aria-label="Save to wishlist"
                      >
                        {isWishlisting
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                          : <Heart className="h-3.5 w-3.5 text-muted-foreground" />}
                      </button>
                    </div>

                    {/* Info */}
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
                      <Button
                        size="sm"
                        className="w-full btn-press text-xs"
                        onClick={() => handleAddToCart(product)}
                        disabled={!product.is_in_stock || isAdding}
                      >
                        {isAdding ? (
                          <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Adding…</>
                        ) : product.is_in_stock ? (
                          <><ShoppingCart className="mr-1.5 h-3.5 w-3.5" />Add to cart</>
                        ) : 'Out of stock'}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Recommendations ───────────────────────────────────── */}
      {recommendations.length > 0 && (
        <section className="py-16 md:py-20 border-t border-border bg-secondary/30">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex items-end justify-between mb-8 pb-4 border-b border-border">
              <div>
                <span className="font-mono text-xs uppercase tracking-[0.15em] text-accent">For you</span>
                <h2 className="font-display font-semibold text-2xl md:text-3xl text-foreground mt-1">Recommended</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {recommendations.slice(0, 4).map((product, i) => {
                const isAdding = addingToCart === product.id
                return (
                  <div
                    key={product.id}
                    className="product-card group animate-fade-in border border-border rounded-md overflow-hidden bg-card"
                    style={{ animationDelay: `${i * 0.06}s` }}
                  >
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      <Link href={`/products/${product.id}`} className="block w-full h-full">
                        <ProductImage src={product.featured_image} alt={product.name} fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      </Link>
                    </div>
                    <div className="p-4">
                      <Link href={`/products/${product.id}`}>
                        <p className="text-sm font-medium text-foreground hover:text-accent transition-colors line-clamp-2 leading-snug mb-2">
                          {product.name}
                        </p>
                      </Link>
                      <div className="flex items-center gap-1 mb-3">
                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-medium">{formatRating(product.average_rating)}</span>
                      </div>
                      <span className="font-mono text-base font-semibold text-foreground">{fcfa(product.price)}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-4 btn-press text-xs"
                        onClick={() => handleAddToCart(product)}
                        disabled={!product.is_in_stock || isAdding}
                      >
                        {isAdding ? (
                          <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Adding…</>
                        ) : (
                          <><ShoppingCart className="mr-1.5 h-3.5 w-3.5" />Add to cart</>
                        )}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA band ──────────────────────────────────────────── */}
      <section className="bg-foreground text-background border-t border-border">
        <div className="container mx-auto px-4 max-w-6xl py-16 md:py-20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="max-w-md">
              <span className="font-mono text-xs uppercase tracking-[0.15em] text-background/50 block mb-3">
                Get started
              </span>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-background leading-tight">
                Ready to shop local?
              </h2>
              <p className="text-background/60 mt-3 text-sm leading-relaxed">
                Join shoppers across the Southwest already buying on NexCart — fast, secure, local.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Button
                size="lg"
                asChild
                className="bg-accent text-accent-foreground hover:bg-accent/90 px-7 font-medium"
              >
                <Link href="/products">
                  Browse all products <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-background/20 text-background hover:bg-background/10 hover:text-background px-7 font-medium"
              >
                <Link href="/vendor/register">Become a seller</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
