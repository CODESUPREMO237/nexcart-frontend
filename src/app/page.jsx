// Location: app\page.jsx
'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import useCartStore from '@/store/cartStore'
import useAuthStore from '@/store/authStore'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatRating, formatProductsArray } from '@/lib/utils/format'
import { ShoppingCart, Heart, Star, TrendingUp, Sparkles, ArrowRight, Package, Shield, Truck, Loader2 } from 'lucide-react'
import Link from 'next/link'
import ProductImage from '@/components/ProductImage'

const fcfa = (n) =>
  new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n)

export default function HomePage() {
  const { addItem } = useCartStore()
  const { isAuthenticated } = useAuthStore()
  const { toast } = useToast()
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [recommendations, setRecommendations]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [addingToCart, setAddingToCart]     = useState(null)
  const [addingToWishlist, setAddingToWishlist] = useState(null)

  useEffect(() => { loadData() }, [])

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
      setError('Impossible de charger les produits. Vérifiez que le serveur est démarré.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async (product) => {
    if (!isAuthenticated) {
      toast({ title: 'Connexion requise', description: 'Connectez-vous pour ajouter au panier', variant: 'destructive' })
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
      return
    }
    setAddingToCart(product.id)
    try {
      const result = await addItem(product.id, 1)
      if (result?.success) {
        toast({ title: '🛒 Ajouté au panier !', description: `${product.name} a été ajouté à votre panier.`, variant: 'success' })
      } else if (result?.error) {
        toast({ title: 'Erreur', description: result.error, variant: 'destructive' })
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
      await api.trackActivity('wishlist', product.id)
      toast({ title: '❤️ Ajouté aux favoris !', description: `${product.name} est dans votre liste de souhaits.`, variant: 'success' })
    } catch {
      toast({ title: 'Erreur', description: 'Impossible d\'ajouter aux favoris', variant: 'destructive' })
    } finally {
      setAddingToWishlist(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <section className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center space-y-4">
              <Skeleton className="h-12 w-3/4 mx-auto" />
              <Skeleton className="h-6 w-2/3 mx-auto" />
              <div className="flex gap-4 justify-center mt-8">
                <Skeleton className="h-12 w-32" />
                <Skeleton className="h-12 w-32" />
              </div>
            </div>
          </div>
        </section>
        <section className="container mx-auto px-4 py-16">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4].map((i) => (
              <Card key={i}>
                <Skeleton className="aspect-square" />
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-3 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background py-20 md:py-32">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_85%)]" />
        <div className="container relative mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <Badge className="mb-6 text-base px-4 py-2 animate-scale-in" variant="secondary">
              <Sparkles className="w-4 h-4 mr-2" />
              Shopping intelligent propulsé par l&apos;IA — Tiko, Cameroun 🇨🇲
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent leading-tight">
              Bienvenue sur NexCart
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-10 leading-relaxed">
              Découvrez des produits adaptés à vos goûts grâce à notre système de recommandation intelligent.
              Payez facilement par MTN ou Orange Money.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="text-lg px-8 py-6 btn-press">
                <Link href="/products">
                  Explorer les produits
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg px-8 py-6 btn-press">
                <Link href="/categories">Voir les catégories</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Truck, title: 'Livraison gratuite', desc: 'Commandes supérieures à 25 000 FCFA', delay: 'stagger-1' },
              { icon: Shield, title: 'Paiement sécurisé', desc: '100% sécurisé via MeSomb', delay: 'stagger-2' },
              { icon: Package, title: 'Retours faciles', desc: 'Politique de retour 30 jours', delay: 'stagger-3' },
            ].map(({ icon: Icon, title, desc, delay }) => (
              <div key={title} className={`flex flex-col items-center text-center p-6 rounded-lg bg-background card-hover animate-fade-in ${delay}`}>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 animate-float">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{title}</h3>
                <p className="text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Error */}
      {error && (
        <section className="container mx-auto px-4 py-8">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center animate-scale-in">
            <p className="text-destructive font-medium mb-2">{error}</p>
            <Button onClick={loadData} className="mt-4 btn-press">Réessayer</Button>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="py-16 container mx-auto px-4">
          <div className="flex items-center justify-between mb-8 animate-fade-in">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 mr-3 text-primary" />
              <h2 className="text-4xl font-bold">Produits vedettes</h2>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/products">Voir tout <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.slice(0, 8).map((product, idx) => {
              const isAdding = addingToCart === product.id
              const isWishlisting = addingToWishlist === product.id
              return (
                <Card key={product.id} className={`group card-hover animate-fade-in stagger-${Math.min(idx + 1, 8)}`}>
                  <CardHeader className="p-0">
                    <div className="relative aspect-square overflow-hidden rounded-t-lg bg-muted">
                      <ProductImage
                        src={product.featured_image}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      {product.discount_percentage > 0 && (
                        <Badge className="absolute top-3 right-3 bg-destructive text-destructive-foreground animate-scale-in">
                          -{product.discount_percentage}%
                        </Badge>
                      )}
                      <Button
                        size="icon"
                        variant="secondary"
                        className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg btn-press"
                        onClick={() => handleAddToWishlist(product)}
                        disabled={isWishlisting}
                      >
                        {isWishlisting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <Link href={`/products/${product.id}`}>
                      <CardTitle className="text-lg mb-3 hover:text-primary transition-colors line-clamp-2 leading-tight">
                        {product.name}
                      </CardTitle>
                    </Link>
                    <div className="flex items-center mb-3">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="ml-1 text-sm font-medium">{formatRating(product.average_rating)}</span>
                      <span className="text-sm text-muted-foreground ml-2">({product.review_count || 0} avis)</span>
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
                      disabled={!product.is_in_stock || isAdding}
                    >
                      {isAdding ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Ajout…</>
                      ) : product.is_in_stock ? (
                        <><ShoppingCart className="mr-2 h-4 w-4" />Ajouter au panier</>
                      ) : 'Rupture de stock'}
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        </section>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <section className="py-16 bg-gradient-to-b from-background to-muted/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center mb-8 animate-fade-in">
              <Sparkles className="w-8 h-8 mr-3 text-primary" />
              <h2 className="text-4xl font-bold">Recommandé pour vous</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendations.slice(0, 4).map((product, idx) => {
                const isAdding = addingToCart === product.id
                return (
                  <Card key={product.id} className={`group card-hover animate-fade-in stagger-${Math.min(idx + 1, 4)}`}>
                    <CardHeader className="p-0">
                      <div className="relative aspect-square overflow-hidden rounded-t-lg bg-muted">
                        <ProductImage src={product.featured_image} alt={product.name} fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300" />
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <Link href={`/products/${product.id}`}>
                        <CardTitle className="text-lg mb-2 hover:text-primary transition-colors line-clamp-2">{product.name}</CardTitle>
                      </Link>
                      <div className="flex items-center mb-2">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="ml-1 text-sm">{formatRating(product.average_rating)}</span>
                      </div>
                      <span className="text-2xl font-bold text-primary">{fcfa(product.price)}</span>
                    </CardContent>
                    <CardFooter className="p-4 pt-0">
                      <Button className="w-full btn-press" variant="outline"
                        onClick={() => handleAddToCart(product)} disabled={!product.is_in_stock || isAdding}>
                        {isAdding ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Ajout…</>
                        ) : (
                          <><ShoppingCart className="mr-2 h-4 w-4" />Ajouter au panier</>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4 text-center animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Prêt à faire vos achats ?</h2>
          <p className="text-xl mb-8 opacity-90">Rejoignez des milliers de clients satisfaits à Tiko et partout au Cameroun</p>
          <Button size="lg" variant="secondary" asChild className="text-lg px-8 py-6 btn-press">
            <Link href="/products">
              Voir tous les produits <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}


