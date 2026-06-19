'use client'

import { useState } from 'react'
import { Tag, Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'

export default function CouponInput({ orderTotal, onApply }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleApply = async () => {
    if (!code.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const response = await api.post('/coupons/validate/', {
        code: code.trim(),
        order_total: orderTotal
      })
      setResult(response.data)
      if (onApply) onApply(response.data)
    } catch (err) {
      const msg = err.response?.data?.error || 'Invalid coupon code'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = () => {
    setCode('')
    setResult(null)
    setError('')
    if (onApply) onApply(null)
  }

  if (result?.valid) {
    return (
      <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-500" />
          <div>
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              {result.coupon.code}
            </span>
            <span className="text-xs text-muted-foreground ml-2">
              -{parseInt(result.discount_amount).toLocaleString()} FCFA
            </span>
          </div>
        </div>
        <button onClick={handleRemove} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Coupon code"
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-background focus:ring-2 focus:ring-primary/30 outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          />
        </div>
        <Button
          size="sm"
          onClick={handleApply}
          disabled={loading || !code.trim()}
          className="px-4"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
        </Button>
      </div>
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <X className="h-3 w-3" /> {error}
        </p>
      )}
    </div>
  )
}
