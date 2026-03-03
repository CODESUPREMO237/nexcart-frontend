'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function RecentlyViewed() {
  const [recentProducts, setRecentProducts] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const loadRecentlyViewed = async () => {
      try {
        const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]')
        if (viewed.length > 0) {
          const productPromises = viewed.slice(0, 10).map((id) =>
            api.getProduct(id).catch(() => null)
          )
          const products = await Promise.all(productPromises)

          const sanitizedProducts = products
            .filter((p) => p !== null)
            .map((p) => ({
              ...p,
              average_rating: Number(p.average_rating || 0),
            }))

          setRecentProducts(sanitizedProducts)
        }
      } catch (error) {
        console.error('Failed to load recently viewed:', error)
      }
    }

    loadRecentlyViewed()
  }, [])

  const scroll = (direction) => {
    const maxIndex = Math.max(0, recentProducts.length - 4)
    if (direction === 'left') {
      setCurrentIndex(Math.max(0, currentIndex - 1))
    } else {
      setCurrentIndex(Math.min(maxIndex, currentIndex + 1))
    }
  }

  if (recentProducts.length === 0) return null

  return (
    <div className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold">Recently Viewed</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('left')}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('right')}
              disabled={currentIndex >= recentProducts.length - 4}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-hidden">
          <div
            className="flex gap-4 transition-transform duration-300"
            style={{ transform: `translateX(-${currentIndex * (100 / 4)}%)` }}
          >
            {recentProducts.map((product) => (
              <Card
                key={product.id}
                className="min-w-[calc(25%-12px)] group hover:shadow-lg transition-shadow"
              >
                <Link href={`/products/${product.id}`}>
                  <div className="relative aspect-square overflow-hidden rounded-t-lg bg-muted">
                    {product.featured_image ? (
                      <Image
                        src={product.featured_image}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                        unoptimized
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full">
                        <span className="text-muted-foreground">No Image</span>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center mb-2">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="ml-1 text-sm">
                        {product.average_rating?.toFixed(1) || '0.0'}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-primary">
                      {Number(product.price || 0).toLocaleString('fr-CM')} FCFA
                    </p>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export const trackProductView = (productId) => {
  try {
    const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]')

    const filtered = viewed.filter((id) => id !== productId)

    const updated = [productId, ...filtered].slice(0, 10)

    localStorage.setItem('recentlyViewed', JSON.stringify(updated))
  } catch (error) {
    console.error('Failed to track product view:', error)
  }
}
