'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function DiagnosticsPage() {
  const [config, setConfig] = useState({})
  const [products, setProducts] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check environment variables
    setConfig({
      apiUrl: process.env.NEXT_PUBLIC_API_URL,
      cloudinaryName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      nodeEnv: process.env.NODE_ENV,
    })

    // Try to fetch products
    const fetchProducts = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
        const response = await fetch(`${apiUrl}/products/`)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        setProducts(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Deployment Diagnostics</h1>

      {/* Environment Variables */}
      <div className="mb-8 p-6 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
        <div className="space-y-2 font-mono text-sm">
          <div>
            <span className="font-semibold">API URL:</span>{' '}
            <span className={config.apiUrl ? 'text-green-600' : 'text-red-600'}>
              {config.apiUrl || '❌ NOT SET'}
            </span>
          </div>
          <div>
            <span className="font-semibold">Cloudinary:</span>{' '}
            <span className={config.cloudinaryName ? 'text-green-600' : 'text-red-600'}>
              {config.cloudinaryName || '❌ NOT SET'}
            </span>
          </div>
          <div>
            <span className="font-semibold">Environment:</span> {config.nodeEnv}
          </div>
        </div>
      </div>

      {/* API Response */}
      <div className="mb-8 p-6 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">API Response</h2>
        
        {loading && <p>Loading products...</p>}
        
        {error && (
          <div className="text-red-600">
            <p className="font-semibold">❌ Error fetching products:</p>
            <p className="font-mono text-sm mt-2">{error}</p>
          </div>
        )}

        {products && (
          <div>
            <p className="text-green-600 font-semibold mb-4">
              ✅ Successfully fetched {products.results?.length || products.length || 0} products
            </p>
            
            {/* Show first product details */}
            {(products.results?.[0] || products[0]) && (
              <div className="mt-4 p-4 bg-white rounded border">
                <h3 className="font-semibold mb-2">First Product:</h3>
                <div className="font-mono text-xs space-y-1">
                  <div><span className="font-semibold">Name:</span> {(products.results?.[0] || products[0]).name}</div>
                  <div><span className="font-semibold">Image URL:</span></div>
                  <div className="pl-4 break-all text-blue-600">
                    {(products.results?.[0] || products[0]).featured_image || '❌ No image URL'}
                  </div>
                  {(products.results?.[0] || products[0]).featured_image && (
                    <div className="mt-4">
                      <span className="font-semibold">Image Preview:</span>
                                            <Image
                        src={(products.results?.[0] || products[0]).featured_image}
                        alt="Test"
                        width={320}
                        height={320}
                        className="mt-2 max-w-xs border"
                        unoptimized
                        onError={(e) => {
                          e.currentTarget.style.border = '2px solid red'
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Full JSON */}
            <details className="mt-4">
              <summary className="cursor-pointer font-semibold">View Full Response</summary>
              <pre className="mt-2 p-4 bg-white rounded border overflow-auto text-xs">
                {JSON.stringify(products, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="p-6 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">What to Check:</h2>
        <ul className="space-y-2 list-disc list-inside">
          <li>API URL should point to: <code className="bg-white px-2 py-1 rounded">https://nexcart-backend-iv3h.onrender.com/api</code></li>
          <li>If API call fails, your backend might be sleeping (Render free tier)</li>
          <li>Image URLs should be Cloudinary URLs (res.cloudinary.com)</li>
          <li>If image preview fails to load, check CORS or image URL validity</li>
        </ul>
      </div>
    </div>
  )
}
