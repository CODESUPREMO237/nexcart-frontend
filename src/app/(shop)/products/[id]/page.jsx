'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import useAuthStore from '@/store/authStore'
import useCartStore from '@/store/cartStore'
import { useToast } from '@/hooks/useToast'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ShoppingCart, Heart, Star, Minus, Plus, Truck, Shield, RotateCcw, MessageSquare, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import RecentlyViewed, { trackProductView } from '@/components/features/RecentlyViewed'

const fcfa = (n) =>
  new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n)

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const { addItem } = useCartStore()
  const { toast } = useToast()
  const [product, setProduct] = useState(null)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [showContactModal, setShowContactModal] = useState(false)
  const [contactMessage, setContactMessage] = useState('')
  const [contactSending, setContactSending] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [rating, setRating] = useState(0)

  const loadProductData = useCallback(async () => {
    try {
      const [productData, reviewsData] = await Promise.all([
        api.getProduct(params.id),
        api.getProductReviews(params.id).catch(() => ({ results: [] }))
      ])
      
      setProduct(productData)
      setReviews(reviewsData.results || reviewsData || [])

      // Load related products
      if (productData.category) {
        const related = await api.getProducts({ category: productData.category.id })
        setRelatedProducts((related.results || related).filter(p => p.id !== params.id).slice(0, 4))
      }
    } catch (error) {
      console.error('Failed to load product:', error)
      toast({
        title: 'Error',
        description: 'Failed to load product details',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [params.id, toast])

  useEffect(() => {
    if (params.id) {
      loadProductData()
      trackProductView(params.id)
      setReviewText('')
      setRating(0)
    }
  }, [params.id, loadProductData])

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to add items to your cart',
        variant: 'destructive'
      })
      router.push('/login')
      return
    }

    try {
      const result = await addItem(params.id, quantity)
      if (result.success) {
        toast({
          title: 'Added to cart!',
          description: `${product.name} has been added to your cart.`,
          variant: 'success'
        })
      } else if (result.requiresAuth) {
        toast({
          title: 'Sign in required',
          description: 'Please sign in to add items to your cart',
          variant: 'destructive'
        })
        router.push('/login')
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to add to cart',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add to cart',
        variant: 'destructive'
      })
    }
  }

  const handleAddToWishlist = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to add items to your wishlist',
        variant: 'destructive'
      })
      router.push('/login')
      return
    }

    try {
      await api.addToWishlist(params.id)
      toast({
        title: 'Added to wishlist!',
        description: `${product.name} has been added to your wishlist.`,
        variant: 'success'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to add to wishlist',
        variant: 'destructive'
      })
    }
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!isAuthenticated) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to leave a review',
        variant: 'destructive'
      })
      router.push('/login')
      return
    }
    if (rating < 1) {
      toast({
        title: 'Rating required',
        description: 'Please select a star rating before submitting',
        variant: 'destructive'
      })
      return
    }

    try {
      await api.addReview(params.id, rating, reviewText, 'Great product!')
      setReviewText('')
      setRating(0)
      loadProductData()
      toast({
        title: 'Review submitted!',
        description: 'Thank you for your feedback.',
        variant: 'success'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit review',
        variant: 'destructive'
      })
    }
  }

  const handleSendMessage = async () => {
    if (!isAuthenticated) {
      toast({ title: 'Sign in required', description: 'Please sign in to contact the seller', variant: 'destructive' })
      router.push('/login')
      return
    }
    if (!contactMessage.trim()) return
    setContactSending(true)
    try {
      const response = await api.post(`/vendors/${product.vendor.slug}/contact/`, { message: contactMessage })
      if (response.data?.conversation_id) {
        toast({ title: 'Message sent!', description: 'Redirecting to messages...', variant: 'success' })
        router.push(`/messages?conversation=${response.data.conversation_id}`)
      } else {
        toast({ title: 'Message sent!', description: 'The seller will reply to your registered email.', variant: 'success' })
        setShowContactModal(false)
        setContactMessage('')
      }
    } catch (e) {
      toast({ title: 'Error', description: e?.response?.data?.error || 'Failed to send message', variant: 'destructive' })
    } finally {
      setContactSending(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 max-w-6xl py-10">
        <div className="grid md:grid-cols-2 gap-10">
          <Skeleton className="aspect-square rounded-md" />
          <div className="space-y-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="font-display font-bold text-2xl text-foreground mb-4">Product Not Found</h1>
        <Button asChild className="btn-press">
          <Link href="/products">Browse All Products</Link>
        </Button>
      </div>
    )
  }

  const images = product.images?.length > 0 
    ? [product.featured_image, ...product.images.map(img => img.image)].filter(Boolean)
    : product.featured_image ? [product.featured_image] : []

  // FIX (Bug 3): Find whether the logged-in user already has a review.
  // review.user is the raw UUID from the serializer, so compare as strings.
  const userReview = isAuthenticated && user
    ? reviews.find(r => String(r.user) === String(user.id))
    : null

  return (
    <div className="container mx-auto px-4 max-w-6xl py-10 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="mb-8 text-xs font-mono uppercase tracking-[0.1em] text-muted-foreground">
        <Link href="/" className="hover:text-accent transition-colors">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/products" className="hover:text-accent transition-colors">Products</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      {/* Product Section */}
      <div className="grid md:grid-cols-2 gap-10 mb-16">
        {/* Images */}
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-md bg-muted border border-border">
            {images.length > 0 ? (
              <Image
                src={images[selectedImage]}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-300 hover:scale-105 cursor-zoom-in"
                priority
                unoptimized
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full">
                <span className="text-muted-foreground text-sm">No Image Available</span>
              </div>
            )}
            {product.discount_percentage > 0 && (
              <Badge className="absolute top-3 right-3 bg-destructive text-destructive-foreground rounded-sm font-mono">
                -{product.discount_percentage}%
              </Badge>
            )}
          </div>
          
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`relative aspect-square overflow-hidden rounded-md border transition-all ${
                    selectedImage === idx ? 'border-accent' : 'border-border hover:border-accent/50'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${product.name} ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            {product.category && (
              <Link href={`/products?category=${product.category.id}`}>
                <span className="font-mono text-xs uppercase tracking-[0.15em] text-accent">
                  {product.category.name}
                </span>
              </Link>
            )}
            <h1 className="font-display font-bold text-3xl text-foreground mt-1 mb-3">{product.name}</h1>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => {
                  const avgRating = Number(product.average_rating || 0)
                  return (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(avgRating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground/30'
                      }`}
                    />
                  )
                })}
              </div>
              <span className="text-sm text-muted-foreground">
                {Number(product.average_rating || 0).toFixed(1)} ({product.review_count || 0} reviews)
              </span>
            </div>
          </div>

          <div className="border-t border-b border-border py-4">
            <div className="flex items-baseline gap-3 mb-2 font-mono">
              <span className="text-3xl font-semibold text-foreground">
                {fcfa(product.price)}
              </span>
              {product.compare_price && (
                <>
                  <span className="text-lg text-muted-foreground line-through">
                    {fcfa(product.compare_price)}
                  </span>
                  <Badge variant="destructive" className="rounded-sm">
                    Save {fcfa(parseFloat(product.compare_price) - parseFloat(product.price))}
                  </Badge>
                </>
              )}
            </div>
            {product.is_in_stock ? (
              <Badge variant="secondary" className="rounded-sm border border-accent/30 bg-accent/10 text-accent">
                In Stock ({product.stock_quantity} available)
              </Badge>
            ) : (
              <Badge variant="destructive" className="rounded-sm">Out of Stock</Badge>
            )}
          </div>

          <div>
            <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>
          </div>

          {/* Seller info strip */}
          {product.vendor && (
            <div className="flex items-center justify-between p-3 rounded-md bg-muted border border-border">
              <div className="text-sm">
                <span className="text-muted-foreground">Sold by </span>
                <span className="font-semibold text-foreground">{product.vendor.store_name}</span>
                {product.vendor.city && (
                  <span className="text-muted-foreground"> · {product.vendor.city}</span>
                )}
              </div>
              {/* Hide button if the current user IS the seller, or is an admin */}
              {user?.role !== 'admin' && String(user?.id) !== String(product.vendor.user_id) && (
                <Button
                  size="sm"
                  variant="outline"
                  className="btn-press"
                  onClick={() => {
                    if (!isAuthenticated) { router.push('/login'); return }
                    setShowContactModal(true)
                  }}
                >
                  <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                  Message Seller
                </Button>
              )}
            </div>
          )}

          {/* Quantity Selector */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <div className="flex items-center gap-2 mt-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="btn-press"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max={product.stock_quantity}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 text-center font-mono"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="btn-press"
                  onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                size="lg"
                className="flex-1 btn-press"
                onClick={handleAddToCart}
                disabled={!product.is_in_stock}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                {isAuthenticated ? 'Add to Cart' : 'Sign in to Add to Cart'}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="btn-press"
                onClick={handleAddToWishlist}
              >
                <Heart className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
            <div className="flex flex-col items-center text-center">
              <Truck className="h-6 w-6 text-accent mb-2" />
              <span className="text-xs font-medium text-foreground">Free Shipping</span>
              <span className="text-xs text-muted-foreground mt-0.5">On orders over 25,000 FCFA</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <Shield className="h-6 w-6 text-accent mb-2" />
              <span className="text-xs font-medium text-foreground">Secure Payment</span>
              <span className="text-xs text-muted-foreground mt-0.5">100% Protected</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <RotateCcw className="h-6 w-6 text-accent mb-2" />
              <span className="text-xs font-medium text-foreground">Easy Returns</span>
              <span className="text-xs text-muted-foreground mt-0.5">30 Day Policy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mb-16">
        <div className="mb-6 pb-4 border-b border-border">
          <span className="font-mono text-xs uppercase tracking-[0.15em] text-accent">Feedback</span>
          <h2 className="font-display font-bold text-2xl text-foreground mt-1">Customer Reviews</h2>
        </div>

        {/* FIX (Bug 3): Show the user's existing review if they already submitted one,
            otherwise show the write-a-review form (or sign-in prompt). */}
        {isAuthenticated ? (
          userReview ? (
            /* User has already reviewed — show their review with an "Edit" note */
            <div className="mb-8 border border-accent/30 rounded-md bg-card p-6">
              <p className="text-xs font-mono uppercase tracking-[0.1em] text-muted-foreground mb-3">Your Review</p>
              <div className="flex items-center gap-2 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < userReview.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                ))}
                <span className="text-xs text-muted-foreground ml-1">
                  {new Date(userReview.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{userReview.comment}</p>
              <p className="text-xs text-muted-foreground mt-3">
                You have already reviewed this product. Contact support to request changes.
              </p>
            </div>
          ) : (
            /* User is logged in but hasn't reviewed yet — show the write form */
            <div className="mb-8 border border-border rounded-md bg-card p-6">
              <h3 className="font-display font-semibold text-base text-foreground mb-4">Write a Review</h3>
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <Label>Rating</Label>
                  <div className="flex gap-2 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-muted-foreground/30'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="review">Your Review</Label>
                  <textarea
                    id="review"
                    rows={4}
                    className="w-full mt-2 px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share your experience with this product..."
                    required
                  />
                </div>
                <Button type="submit" className="btn-press">Submit Review</Button>
              </form>
            </div>
          )
        ) : (
          <div className="mb-8 border border-dashed border-border rounded-md bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">Sign in to write a review</p>
            <Button variant="outline" className="btn-press" onClick={() => router.push('/login')}>Sign In</Button>
          </div>
        )}

        <div className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              No reviews yet. Be the first to review this product!
            </p>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="border border-border rounded-md bg-card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {/* FIX (Bug 2): use review.user_name — the serializer returns the
                          user's full name at the top level, not nested under review.user */}
                      <span className="font-semibold text-sm text-foreground">
                        {review.user_name || 'Anonymous'}
                      </span>
                      {review.is_verified_purchase && (
                        <Badge variant="secondary" className="text-xs rounded-sm">
                          Verified Purchase
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < review.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-muted-foreground/30'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                {review.title && (
                  <h4 className="font-semibold text-sm text-foreground mb-1">{review.title}</h4>
                )}
                <p className="text-sm text-muted-foreground">{review.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div>
          <div className="mb-6 pb-4 border-b border-border">
            <span className="font-mono text-xs uppercase tracking-[0.15em] text-accent">More to explore</span>
            <h2 className="font-display font-bold text-2xl text-foreground mt-1">Related Products</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {relatedProducts.map((relatedProduct) => (
              <Link
                key={relatedProduct.id}
                href={`/products/${relatedProduct.id}`}
                className="product-card group border border-border rounded-md overflow-hidden bg-card block"
              >
                <div className="relative aspect-square overflow-hidden bg-muted">
                  {relatedProduct.featured_image ? (
                    <Image
                      src={relatedProduct.featured_image}
                      alt={relatedProduct.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      unoptimized
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full">
                      <span className="text-xs text-muted-foreground">No Image</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-medium text-foreground line-clamp-2 mb-2 leading-snug">
                    {relatedProduct.name}
                  </h3>
                  <p className="text-base font-semibold text-foreground font-mono">
                    {fcfa(relatedProduct.price)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
      <RecentlyViewed />

      {/* Contact Seller Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-md bg-card border border-border shadow-2xl p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-semibold text-foreground text-lg">Message Seller</h3>
                <p className="text-sm text-muted-foreground">{product.vendor?.store_name}</p>
              </div>
              <button
                onClick={() => { setShowContactModal(false); setContactMessage('') }}
                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <textarea
              value={contactMessage}
              onChange={e => setContactMessage(e.target.value)}
              placeholder="Ask about availability, shipping, customisation..."
              rows={4}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 btn-press"
                onClick={() => { setShowContactModal(false); setContactMessage('') }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 btn-press"
                disabled={contactSending || !contactMessage.trim()}
                onClick={handleSendMessage}
              >
                {contactSending ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
