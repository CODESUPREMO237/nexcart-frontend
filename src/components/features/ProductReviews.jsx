'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare,
  CheckCircle,
  User,
  Edit,
  Trash2,
  Flag
} from 'lucide-react'
import useAuthStore from '@/store/authStore'
import api from '@/lib/api'
import Image from 'next/image'

export default function ProductReviews({ productId }) {
  const { user, isAuthenticated } = useAuthStore()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [sortBy, setSortBy] = useState('recent')
  const [filterRating, setFilterRating] = useState(0)

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get(`/products/${productId}/reviews/`)
      setReviews(response.data.results || response.data)
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!isAuthenticated) {
      alert('Please login to submit a review')
      return
    }

    try {
      await api.post(`/products/${productId}/reviews/`, {
        rating,
        comment: reviewText
      })
      setShowReviewDialog(false)
      setRating(0)
      setReviewText('')
      fetchReviews()
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('Failed to submit review')
    }
  }

  const handleHelpful = async (reviewId, isHelpful) => {
    if (!isAuthenticated) return
    
    try {
      await api.post(`/reviews/${reviewId}/vote/`, { is_helpful: isHelpful })
      fetchReviews()
    } catch (error) {
      console.error('Error voting on review:', error)
    }
  }

  const calculateRatingStats = () => {
    if (reviews.length === 0) return { average: 0, distribution: [0, 0, 0, 0, 0] }

    const distribution = [0, 0, 0, 0, 0]
    let total = 0

    reviews.forEach(review => {
      distribution[review.rating - 1]++
      total += review.rating
    })

    return {
      average: (total / reviews.length).toFixed(1),
      distribution: distribution.reverse(),
      total: reviews.length
    }
  }

  const stats = calculateRatingStats()

  const RatingStars = ({ rating, size = 'md', interactive = false, onChange }) => {
    const sizes = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6'
    }

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizes[size]} ${
              star <= (interactive ? (hoverRating || rating) : rating)
                ? 'fill-yellow-500 text-yellow-500'
                : 'text-gray-300'
            } ${interactive ? 'cursor-pointer' : ''}`}
            onClick={() => interactive && onChange && onChange(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
          />
        ))}
      </div>
    )
  }

  const filteredReviews = reviews
    .filter(review => filterRating === 0 || review.rating === filterRating)
    .sort((a, b) => {
      if (sortBy === 'recent') return new Date(b.created_at) - new Date(a.created_at)
      if (sortBy === 'helpful') return (b.helpful_count || 0) - (a.helpful_count || 0)
      if (sortBy === 'rating_high') return b.rating - a.rating
      if (sortBy === 'rating_low') return a.rating - b.rating
      return 0
    })

  return (
    <div className="space-y-6">
      {/* Rating Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Average Rating */}
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">{stats.average}</div>
              <RatingStars rating={Math.round(parseFloat(stats.average))} size="lg" />
              <p className="text-gray-600 mt-2">
                Based on {stats.total} {stats.total === 1 ? 'review' : 'reviews'}
              </p>
              <Button 
                className="mt-4"
                onClick={() => setShowReviewDialog(true)}
                disabled={!isAuthenticated}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Write a Review
              </Button>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((star, index) => (
                <div key={star} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 min-w-[60px]">
                    <span className="text-sm font-medium">{star}</span>
                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  </div>
                  <Progress 
                    value={(stats.distribution[index] / stats.total) * 100 || 0} 
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-600 min-w-[40px]">
                    {stats.distribution[index]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border border-gray-300 rounded-md px-4 py-2"
        >
          <option value="recent">Most Recent</option>
          <option value="helpful">Most Helpful</option>
          <option value="rating_high">Highest Rating</option>
          <option value="rating_low">Lowest Rating</option>
        </select>

        <div className="flex gap-2">
          <Button
            variant={filterRating === 0 ? 'default' : 'outline'}
            onClick={() => setFilterRating(0)}
            size="sm"
          >
            All
          </Button>
          {[5, 4, 3, 2, 1].map(star => (
            <Button
              key={star}
              variant={filterRating === star ? 'default' : 'outline'}
              onClick={() => setFilterRating(star)}
              size="sm"
            >
              {star} <Star className="w-3 h-3 ml-1 fill-current" />
            </Button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-center text-gray-600">Loading reviews...</p>
        ) : filteredReviews.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">
                {filterRating > 0 
                  ? `No ${filterRating}-star reviews yet`
                  : 'No reviews yet. Be the first to review this product!'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredReviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Avatar className="bg-gradient-to-br from-blue-600 to-purple-600">
                    {review.user?.avatar ? (
                                            <Image src={review.user.avatar} alt={review.user.name} width={32} height={32} className="w-full h-full object-cover" unoptimized />
                    ) : (
                      <User className="text-white" />
                    )}
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">{review.user?.name || 'Anonymous'}</p>
                          {review.verified_purchase && (
                            <Badge variant="success" className="text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Verified Purchase
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <RatingStars rating={review.rating} size="sm" />
                          <span className="text-sm text-gray-500">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      {user && user.id === review.user?.id && (
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {review.title && (
                      <h4 className="font-semibold mb-2">{review.title}</h4>
                    )}

                    <p className="text-gray-700 mb-4">{review.comment}</p>

                    {review.images && review.images.length > 0 && (
                      <div className="flex gap-2 mb-4">
                        {review.images.map((img, idx) => (
                                                    <Image
                            key={idx}
                            src={img}
                            alt={`Review ${idx + 1}`}
                            width={96}
                            height={96}
                            className="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-80"
                            unoptimized
                          />
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleHelpful(review.id, true)}
                        className="text-gray-600"
                      >
                        <ThumbsUp className="w-4 h-4 mr-1" />
                        Helpful ({review.helpful_count || 0})
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleHelpful(review.id, false)}
                        className="text-gray-600"
                      >
                        <ThumbsDown className="w-4 h-4 mr-1" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-gray-600">
                        <Flag className="w-4 h-4 mr-1" />
                        Report
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Write Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Your Rating</label>
              <RatingStars 
                rating={rating} 
                interactive 
                onChange={setRating}
                size="lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Your Review</label>
              <Textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your experience with this product..."
                rows={6}
                required
              />
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowReviewDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={rating === 0 || !reviewText.trim()}>
                Submit Review
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}