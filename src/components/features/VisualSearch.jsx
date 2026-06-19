'use client'

import { useState, useRef } from 'react'
import { Camera, X, Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'

export default function VisualSearch({ onResults }) {
  const [isOpen, setIsOpen] = useState(false)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const fileRef = useRef(null)

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    handleSearch(file)
  }

  const handleSearch = async (file) => {
    setLoading(true)
    setResults(null)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const response = await api.post('/products/visual-search/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResults(response.data)
      if (onResults) onResults(response.data)
    } catch (err) {
      console.error('Visual search error:', err)
      setError(
        err?.response?.data?.error ||
        'Could not search by this image. Please try a different photo.'
      )
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setPreview(null)
    setResults(null)
    setError(null)
    setIsOpen(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 border-dashed"
        title="Search by image"
      >
        <Camera className="h-4 w-4" />
        <span className="hidden sm:inline text-xs">Search by Image</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-background rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Camera className="h-5 w-5 text-primary" />
                  Visual Search
                </h2>
                <button onClick={reset} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {!preview ? (
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-primary/30 rounded-xl p-12 text-center cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-all"
                >
                  <Camera className="h-12 w-12 mx-auto text-primary/40 mb-3" />
                  <p className="text-sm font-medium">Upload a product image</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Take a photo or upload from gallery
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden">
                    <img src={preview} alt="Search" className="w-full h-48 object-cover" />
                    {loading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="flex items-center gap-2 text-white">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span className="text-sm">Searching...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 text-destructive text-sm px-3 py-2">
                      {error}
                    </div>
                  )}

                  {results && (
                    <div>
                      <p className="text-sm font-medium mb-2">
                        Found {results.count} similar products
                      </p>
                      <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                        {results.results?.map((product) => (
                          <a
                            key={product.id}
                            href={`/products/${product.id}`}
                            className="flex gap-2 p-2 rounded-lg hover:bg-muted transition-colors border"
                          >
                            {product.featured_image && (
                              <img
                                src={product.featured_image}
                                alt={product.name}
                                className="w-12 h-12 rounded object-cover shrink-0"
                              />
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-medium truncate">{product.name}</p>
                              <p className="text-xs text-primary font-bold">
                                {parseInt(product.price).toLocaleString()} FCFA
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {Math.round((product.similarity_score || 0) * 100)}% match
                              </p>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={reset} className="flex-1">
                      New Search
                    </Button>
                  </div>
                </div>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
