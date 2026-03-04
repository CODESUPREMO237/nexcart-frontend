'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import useAuthStore from '@/store/authStore'
import useCartStore from '@/store/cartStore'
import { useToast } from '@/hooks/useToast'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ShoppingCart, Heart, Star, Minus, Plus, Truck, Shield, RotateCcw } from 'lucide-react'
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
  const [selectedImage, setSelectedImage] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [rating, setRating] = useState(5)

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
    }
  }, [params.id, loadProductData])

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to add items to your cart',
        variant: 'destructive'
      })
      // Redirect to login page
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

    try {
      await api.addReview(params.id, rating, reviewText, 'Great product!')
      setReviewText('')
      setRating(5)
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
        <Button asChild>
          <Link href="/products">Browse All Products</Link>
        </Button>
      </div>
    )
  }

  const images = product.images?.length > 0 
    ? [product.featured_image, ...product.images.map(img => img.image)].filter(Boolean)
    : product.featured_image ? [product.featured_image] : []

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/products" className="hover:text-primary">Products</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      {/* Product Section */}
      <div className="grid md:grid-cols-2 gap-8 mb-16">
        {/* Images */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
            {images.length > 0 ? (
              <Image
                src={images[selectedImage]}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-300 hover:scale-110 cursor-zoom-in"
                priority
                unoptimized
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full">
                <span className="text-muted-foreground text-lg">No Image Available</span>
              </div>
            )}
            {product.discount_percentage > 0 && (
              <Badge className="absolute top-4 right-4 bg-destructive text-lg px-3 py-1">
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
                  className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                    selectedImage === idx ? 'border-primary' : 'border-transparent hover:border-muted-foreground/50'
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
            <h1 className="text-4xl font-bold mb-2">{product.name}</h1>
            {product.category && (
              <Link href={`/products?category=${product.category.id}`}>
                <Badge variant="secondary" className="mb-4">
                  {product.category.name}
                </Badge>
              </Link>
            )}
            
           <div className="flex items-center gap-4 mb-4">
  <div className="flex items-center">
    {[...Array(5)].map((_, i) => {
      // Convert to number for the comparison logic
      const rating = Number(product.average_rating || 0);
      return (
        <Star
          key={i}
          className={`w-5 h-5 ${
            i < Math.floor(rating)
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-300'
          }`}
        />
      );
    })}
  </div>
  <span className="text-sm text-muted-foreground">
    {/* Convert to number before calling .toFixed */}
    {Number(product.average_rating || 0).toFixed(1)} ({product.review_count || 0} reviews)
  </span>
</div>
          </div>

          <div className="border-t border-b py-4">
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-4xl font-bold text-primary">
                {fcfa(product.price)}
              </span>
              {product.compare_price && (
                <>
                  <span className="text-2xl text-muted-foreground line-through">
                    {fcfa(product.compare_price)}
                  </span>
                  <Badge variant="destructive">
                    Save {fcfa(parseFloat(product.compare_price) - parseFloat(product.price))}
                  </Badge>
                </>
              )}
            </div>
            {product.is_in_stock ? (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                In Stock ({product.stock_quantity} available)
              </Badge>
            ) : (
              <Badge variant="destructive">Out of Stock</Badge>
            )}
          </div>

          <div>
            <p className="text-lg leading-relaxed">{product.description}</p>
          </div>

          {/* Quantity Selector */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <div className="flex items-center gap-2 mt-2">
                <Button
                  variant="outline"
                  size="icon"
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
                  className="w-20 text-center"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                size="lg"
                className="flex-1"
                onClick={handleAddToCart}
                disabled={!product.is_in_stock}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {isAuthenticated ? 'Add to Cart' : 'Sign in to Add to Cart'}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleAddToWishlist}
              >
                <Heart className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t">
            <div className="flex flex-col items-center text-center">
              <Truck className="h-8 w-8 text-primary mb-2" />
              <span className="text-sm font-medium">Free Shipping</span>
              <span className="text-xs text-muted-foreground">On orders over 25,000 FCFA</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <Shield className="h-8 w-8 text-primary mb-2" />
              <span className="text-sm font-medium">Secure Payment</span>
              <span className="text-xs text-muted-foreground">100% Protected</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <RotateCcw className="h-8 w-8 text-primary mb-2" />
              <span className="text-sm font-medium">Easy Returns</span>
              <span className="text-xs text-muted-foreground">30 Day Policy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold mb-8">Customer Reviews</h2>
        
        {isAuthenticated && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Write a Review</CardTitle>
            </CardHeader>
            <CardContent>
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
                          className={`w-8 h-8 ${
                            star <= rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
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
                    className="w-full mt-2 px-3 py-2 border rounded-md"
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share your experience with this product..."
                    required
                  />
                </div>
                <Button type="submit">Submit Review</Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {reviews.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No reviews yet. Be the first to review this product!
            </p>
          ) : (
            reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{review.user?.first_name || 'Anonymous'}</span>
                        {review.is_verified_purchase && (
                          <Badge variant="secondary" className="text-xs">
                            Verified Purchase
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {review.title && (
                    <h4 className="font-semibold mb-2">{review.title}</h4>
                  )}
                  <p className="text-muted-foreground">{review.comment}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div>
          <h2 className="text-3xl font-bold mb-8">Related Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <Card key={relatedProduct.id} className="group hover:shadow-lg transition-shadow">
                <Link href={`/products/${relatedProduct.id}`}>
                  <div className="relative aspect-square overflow-hidden rounded-t-lg bg-muted">
                    {relatedProduct.featured_image ? (
                      <Image
                        src={relatedProduct.featured_image}
                        alt={relatedProduct.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform"
                        unoptimized
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full">
                        <span className="text-muted-foreground">No Image</span>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-2">
                      {relatedProduct.name}
                    </h3>
                    <p className="text-lg font-bold text-primary">
                      {fcfa(relatedProduct.price)}
                    </p>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      )}
      <RecentlyViewed />
    </div>
  )
}
