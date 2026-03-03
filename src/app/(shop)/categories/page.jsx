'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Layers, ArrowRight, Grid3x3 } from 'lucide-react'
import { toNumber } from '@/lib/utils/format'; // Add this import
import Image from 'next/image'

export default function CategoriesPage() {
  const router = useRouter()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
  try {
    const categoriesData = await api.getCategories();
    const rawCategories = categoriesData.results || categoriesData || [];
    
    // Sanitize the data: map through and ensure count is a number
    const cleanedCategories = rawCategories.map(cat => ({
      ...cat,
      // Check both common names and default to 0
      displayCount: toNumber(cat.product_count || cat.products_count, 0)
    }));

    setCategories(cleanedCategories);
  } catch (error) {
    console.error('Failed to load categories:', error);
  } finally {
    setLoading(false);
  }
};

  const handleCategoryClick = (categoryId) => {
    router.push(`/products?category=${categoryId}`)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-12 text-center">
        <div className="flex items-center justify-center mb-4">
          <Grid3x3 className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-5xl font-bold mb-4">Shop by Category</h1>
        <p className="text-xl text-muted-foreground">
          Explore {categories.length} curated product categories
        </p>
      </div>

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <div className="text-center py-20">
          <Layers className="w-24 h-24 text-muted-foreground mx-auto mb-6" />
          <p className="text-2xl text-muted-foreground">No categories available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category) => (
            <Card
              key={category.id}
              className="cursor-pointer hover:shadow-2xl transition-all duration-300 group overflow-hidden"
              onClick={() => handleCategoryClick(category.id)}
            >
              <CardHeader className="p-0">
                <div className="relative h-56 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent overflow-hidden">
                  {category.image ? (
                                        <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-primary/60">
                      <Layers className="w-20 h-20 text-primary-foreground opacity-50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent group-hover:from-black/70 transition-all" />
                  
                  {/* Product count badge */}
                <Badge className="absolute top-4 right-4 bg-background/90 text-foreground backdrop-blur-sm">
  {category.displayCount} Products
</Badge>

                  {/* Category name overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-2xl font-bold text-white mb-1 group-hover:scale-105 transition-transform">
                      {category.name}
                    </h3>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                {category.description && (
                  <p className="text-muted-foreground line-clamp-2 mb-4">
                    {category.description}
                  </p>
                )}
                <div className="flex items-center text-primary font-semibold group-hover:gap-3 transition-all">
                  <span>Explore Collection</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* CTA Section */}
      {categories.length > 0 && (
        <div className="mt-16 text-center bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-lg p-12">
          <h2 className="text-3xl font-bold mb-4">Can&apos;t find what you&apos;re looking for?</h2>
          <p className="text-lg text-muted-foreground mb-6">
            Browse all our products or use the search feature
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push('/products')}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              View All Products
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

