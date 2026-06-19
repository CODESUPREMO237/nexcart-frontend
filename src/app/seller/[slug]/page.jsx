'use client'

import { useState, useEffect } from 'react'
import { Store, MapPin, Star, Package } from 'lucide-react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'

export default function VendorStorefrontPage() {
  const params = useParams()
  const [vendor, setVendor] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.slug) loadVendor()
  }, [params.slug])

  const loadVendor = async () => {
    try {
      const [vRes, pRes] = await Promise.allSettled([
        api.get(`/vendors/${params.slug}/`),
        api.get(`/vendors/${params.slug}/products/`)
      ])
      if (vRes.status === 'fulfilled') setVendor(vRes.value.data)
      if (pRes.status === 'fulfilled') setProducts(pRes.value.data?.results || pRes.value.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Store not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Store Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-md border border-border bg-muted flex items-center justify-center shrink-0 overflow-hidden">
              {vendor.logo_url ? (
                <img src={vendor.logo_url} alt={vendor.store_name} className="w-full h-full object-cover" />
              ) : (
                <Store className="h-7 w-7 text-muted-foreground" />
              )}
            </div>
            <div>
              <span className="font-mono text-xs uppercase tracking-[0.15em] text-accent">Storefront</span>
              <h1 className="font-display font-bold text-2xl text-foreground mt-0.5">{vendor.store_name}</h1>
              <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {vendor.city}, {vendor.region}</span>
                {vendor.average_rating > 0 && (
                  <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" /> {vendor.average_rating}</span>
                )}
                <span className="flex items-center gap-1"><Package className="h-3.5 w-3.5" /> {vendor.total_products} products</span>
              </div>
              {vendor.description && <p className="text-sm text-muted-foreground mt-2 max-w-xl">{vendor.description}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-6 pb-4 border-b border-border">
          <h2 className="font-display font-semibold text-lg text-foreground">Products ({products.length})</h2>
        </div>
        {products.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-12">No products listed yet</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((product) => (
              <Link key={product.id} href={`/products/${product.id}`} className="product-card group border border-border rounded-md overflow-hidden bg-card block">
                <div className="aspect-square bg-muted relative overflow-hidden">
                  {product.featured_image ? (
                    <img src={product.featured_image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Package className="h-8 w-8" /></div>
                  )}
                  {product.discount_percentage > 0 && (
                    <span className="absolute top-2.5 left-2.5 bg-destructive text-destructive-foreground text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-sm">
                      -{product.discount_percentage}%
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium text-foreground truncate">{product.name}</h3>
                  <div className="flex items-center gap-2 mt-1 font-mono">
                    <span className="text-sm font-bold text-foreground">{parseInt(product.price).toLocaleString()} FCFA</span>
                    {product.compare_price && parseFloat(product.compare_price) > parseFloat(product.price) && (
                      <span className="text-xs text-muted-foreground line-through">{parseInt(product.compare_price).toLocaleString()}</span>
                    )}
                  </div>
                  {product.average_rating > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs text-muted-foreground">{product.average_rating} ({product.review_count})</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
