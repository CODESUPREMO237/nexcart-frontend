'use client'

import { Suspense, useEffect, useState, useCallback, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { formatRating } from '@/lib/utils/format'
import useCartStore from '@/store/cartStore'
import useAuthStore from '@/store/authStore'
import { useToast } from '@/hooks/useToast'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { ShoppingCart, Heart, Star, Search, Filter, Loader2 } from 'lucide-react'
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
      const response = await api.getProducts({
        search: currentSearch,
        category: currentCategory,
      })
      setProducts(response.results || response)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de charger les produits', variant: 'destructive' })
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

      if (currentSearch === nextSearchVal && currentCategory === nextCategoryVal) {
        return
      }

      router.replace(`/products${nextParams.toString() ? '?' + nextParams.toString() : ''}`)
    }, 400)

    return () => clearTimeout(timer)
  }, [searchQuery, router, currentSearch, currentCategory])


  const handleAddToCart = async (product) => {
    if (!isAuthenticated) {
      toast({ title: 'Connexion requise', description: 'Connectez-vous pour ajouter au panier', variant: 'destructive' })
      return
    }
    setAddingToCart(product.id)
    try {
      const result = await addItem(product.id, 1)
      if (result?.success) {
        toast({ title: 'Added to cart', description: `${product.name} a ete ajoute.`, variant: 'success' })
      } else {
        toast({ title: 'Erreur', description: result?.error || 'Impossible d\'ajouter au panier', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Erreur', description: 'Impossible d\'ajouter au panier', variant: 'destructive' })
    } finally {
      setAddingToCart(null)
    }
  }

  const handleAddToWishlist = async (product) => {
    if (!isAuthenticated) {
      toast({ title: 'Connexion requise', description: 'Connectez-vous pour ajouter aux favoris', variant: 'destructive' })
      return
    }
    setAddingToWishlist(product.id)
    try {
      await api.addToWishlist(product.id)
      toast({ title: 'Added to wishlist', description: `${product.name} est dans vos favoris.`, variant: 'success' })
    } catch (error) {
      toast({ title: 'Erreur', description: error.response?.data?.error || 'Impossible d\'ajouter aux favoris', variant: 'destructive' })
    } finally {
      setAddingToWishlist(null)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i}>
              <Skeleton className="aspect-square" />
              <CardContent className="p-4">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-4xl font-bold">Tous les produits</h1>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher des produits..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="btn-press">
            <Filter className="h-4 w-4 mr-2" /> Filtrer
          </Button>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20 animate-scale-in">
          <p className="text-2xl text-muted-foreground mb-4">Aucun produit trouve</p>
          <Button asChild className="btn-press">
            <Link href="/">Retour a l&apos;accueil</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, idx) => {
            const isAdding = addingToCart === product.id
            const isWishlisting = addingToWishlist === product.id
            const isOutOfStock = !product.is_in_stock
            const cardKey = `${product.id ?? 'product'}-${idx}`

            return (
              <Card key={cardKey} className={`group card-hover animate-fade-in stagger-${Math.min(idx + 1, 8)}`}>
                <CardHeader className="p-0">
                  <div className="relative aspect-square overflow-hidden rounded-t-lg bg-muted">
                    <Link href={`/products/${product.id}`}>
                      {product.featured_image ? (
                        <Image
                          src={product.featured_image}
                          alt={product.name}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-110 cursor-zoom-in"
                          unoptimized
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full bg-muted">
                          <span className="text-muted-foreground">Pas d&apos;image</span>
                        </div>
                      )}
                    </Link>
                    {product.discount_percentage > 0 && (
                      <Badge className="absolute top-3 right-3 bg-destructive">-{product.discount_percentage}%</Badge>
                    )}
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity btn-press"
                      onClick={() => handleAddToWishlist(product)}
                      disabled={isWishlisting}
                    >
                      {isWishlisting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <Link href={`/products/${product.id}`}>
                    <CardTitle className="text-lg mb-3 hover:text-primary transition-colors line-clamp-2">
                      {product.name}
                    </CardTitle>
                  </Link>
                  <div className="flex items-center mb-3">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="ml-1 text-sm">{formatRating(product.average_rating)}</span>
                    <span className="text-sm text-muted-foreground ml-2">({product.review_count || 0})</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-primary">{fcfa(product.price)}</span>
                    {product.compare_price && (
                      <span className="text-sm text-muted-foreground line-through">{fcfa(product.compare_price)}</span>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button
                    className="w-full btn-press"
                    onClick={() => handleAddToCart(product)}
                    disabled={isOutOfStock || isAdding}
                  >
                    <span className="flex items-center justify-center">
                      {isAdding ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : !isOutOfStock ? (
                        <ShoppingCart className="mr-2 h-4 w-4" />
                      ) : null}
                      {isAdding ? 'Ajout en cours...' : isOutOfStock ? 'Rupture de stock' : 'Ajouter au panier'}
                    </span>
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i}>
                <Skeleton className="aspect-square" />
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-3 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      }
    >
      <ProductsList />
    </Suspense>
  )
}
