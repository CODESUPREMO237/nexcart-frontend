import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Star, ShoppingCart, Heart } from 'lucide-react'
import Image from 'next/image'

// Mock API - replace with your actual API
const mockProducts = [
  {
    id: 1,
    name: 'Premium Wireless Headphones',
    price: '299.99',
    compare_price: '399.99',
    featured_image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    category: { name: 'Electronics' },
    average_rating: 4.8,
    review_count: 328,
    is_in_stock: true,
    stock_quantity: 45,
    description: 'High-quality wireless headphones with active noise cancellation and 30-hour battery life.',
    specs: {
      'Battery Life': '30 hours',
      'Connectivity': 'Bluetooth 5.0',
      'Weight': '250g',
      'Noise Cancellation': 'Active ANC'
    }
  },
  {
    id: 2,
    name: 'Studio Monitor Headphones',
    price: '249.99',
    compare_price: null,
    featured_image: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400',
    category: { name: 'Electronics' },
    average_rating: 4.6,
    review_count: 256,
    is_in_stock: true,
    stock_quantity: 32,
    description: 'Professional studio-grade headphones with accurate sound reproduction.',
    specs: {
      'Battery Life': 'Wired',
      'Connectivity': '3.5mm Jack',
      'Weight': '280g',
      'Noise Cancellation': 'Passive'
    }
  },
  {
    id: 3,
    name: 'Gaming Headset Pro',
    price: '199.99',
    compare_price: '249.99',
    featured_image: 'https://images.unsplash.com/photo-1599669454699-248893623440?w=400',
    category: { name: 'Gaming' },
    average_rating: 4.7,
    review_count: 412,
    is_in_stock: true,
    stock_quantity: 67,
    description: 'RGB gaming headset with surround sound and crystal-clear microphone.',
    specs: {
      'Battery Life': '20 hours',
      'Connectivity': 'USB-C / Wireless',
      'Weight': '320g',
      'Noise Cancellation': 'Microphone NC'
    }
  }
]

export default function ProductComparison() {
  const [selectedProducts, setSelectedProducts] = useState([])
  const [availableProducts] = useState(mockProducts)

  const addProduct = (product) => {
    if (selectedProducts.length < 4 && !selectedProducts.find(p => p.id === product.id)) {
      setSelectedProducts([...selectedProducts, product])
    }
  }

  const removeProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId))
  }

  const clearAll = () => {
    setSelectedProducts([])
  }

  // Get all unique spec keys
  const allSpecs = [...new Set(
    selectedProducts.flatMap(p => Object.keys(p.specs || {}))
  )]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Compare Products</h1>
        <p className="text-muted-foreground">
          Select up to 4 products to compare their features side by side
        </p>
      </div>

      {/* Product Selector */}
      {selectedProducts.length < 4 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add Products to Compare</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {availableProducts
                .filter(p => !selectedProducts.find(sp => sp.id === p.id))
                .map(product => (
                  <Card key={product.id} className="group cursor-pointer hover:shadow-lg transition-shadow">
                    <div onClick={() => addProduct(product)}>
                      <div className="relative aspect-square overflow-hidden rounded-t-lg bg-muted">
                                                    <Image
                          src={product.featured_image}
                          alt={product.name}
                          fill
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          unoptimized
                        />
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2 line-clamp-2">{product.name}</h3>
                        <p className="text-lg font-bold text-blue-600">{Number(product.price || 0).toLocaleString('fr-CM')} FCFA</p>
                      </CardContent>
                    </div>
                  </Card>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparison Table */}
      {selectedProducts.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Comparing {selectedProducts.length} Products</CardTitle>
            <Button variant="outline" onClick={clearAll}>
              Clear All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left p-4 border-b font-semibold bg-muted/30">
                      Feature
                    </th>
                    {selectedProducts.map(product => (
                      <th key={product.id} className="p-4 border-b border-l">
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute -top-2 -right-2"
                            onClick={() => removeProduct(product.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <div className="aspect-square w-32 mx-auto mb-3 overflow-hidden rounded-lg">
                            <Image
                              src={product.featured_image}
                              alt={product.name}
                              fill
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                          </div>
                          <h3 className="font-semibold mb-2 text-sm">{product.name}</h3>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Price */}
                  <tr className="hover:bg-muted/20">
                    <td className="p-4 border-b font-medium bg-muted/30">Price</td>
                    {selectedProducts.map(product => (
                      <td key={product.id} className="p-4 border-b border-l text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {Number(product.price || 0).toLocaleString('fr-CM')} FCFA
                        </div>
                        {product.compare_price && (
                          <div className="text-sm text-gray-500 line-through">
                            {Number(product.compare_price || 0).toLocaleString('fr-CM')} FCFA
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Rating */}
                  <tr className="hover:bg-muted/20">
                    <td className="p-4 border-b font-medium bg-muted/30">Rating</td>
                    {selectedProducts.map(product => (
                      <td key={product.id} className="p-4 border-b border-l text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold">{product.average_rating}</span>
                          <span className="text-sm text-gray-500">
                            ({product.review_count})
                          </span>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Stock */}
                  <tr className="hover:bg-muted/20">
                    <td className="p-4 border-b font-medium bg-muted/30">Availability</td>
                    {selectedProducts.map(product => (
                      <td key={product.id} className="p-4 border-b border-l text-center">
                        {product.is_in_stock ? (
                          <Badge className="bg-green-100 text-green-800">
                            In Stock ({product.stock_quantity})
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Out of Stock</Badge>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Description */}
                  <tr className="hover:bg-muted/20">
                    <td className="p-4 border-b font-medium bg-muted/30">Description</td>
                    {selectedProducts.map(product => (
                      <td key={product.id} className="p-4 border-b border-l">
                        <p className="text-sm">{product.description}</p>
                      </td>
                    ))}
                  </tr>

                  {/* Specifications */}
                  {allSpecs.map(spec => (
                    <tr key={spec} className="hover:bg-muted/20">
                      <td className="p-4 border-b font-medium bg-muted/30">{spec}</td>
                      {selectedProducts.map(product => (
                        <td key={product.id} className="p-4 border-b border-l text-center">
                          {product.specs?.[spec] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}

                  {/* Actions */}
                  <tr>
                    <td className="p-4 font-medium bg-muted/30">Actions</td>
                    {selectedProducts.map(product => (
                      <td key={product.id} className="p-4 border-l">
                        <div className="flex flex-col gap-2">
                          <Button 
                            className="w-full"
                            disabled={!product.is_in_stock}
                          >
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Add to Cart
                          </Button>
                          <Button variant="outline" className="w-full">
                            <Heart className="mr-2 h-4 w-4" />
                            Wishlist
                          </Button>
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedProducts.length === 0 && (
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">No Products Selected</h2>
          <p className="text-muted-foreground">
            Select products from above to start comparing
          </p>
        </div>
      )}
    </div>
  )
}