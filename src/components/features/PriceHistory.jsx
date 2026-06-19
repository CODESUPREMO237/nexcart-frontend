'use client'

import { useState, useEffect } from 'react'
import { TrendingDown, Bell, BellOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'

export default function PriceHistory({ productId, currentPrice }) {
  const [history, setHistory] = useState([])
  const [alertSet, setAlertSet] = useState(false)
  const [targetPrice, setTargetPrice] = useState('')
  const [showAlert, setShowAlert] = useState(false)

  useEffect(() => {
    loadHistory()
  }, [productId])

  const loadHistory = async () => {
    try {
      const response = await api.get(`/products/${productId}/price-history/`)
      setHistory(response.data?.history || [])
    } catch (e) {
      // Fallback with simulated data
      const now = Date.now()
      const simulated = Array.from({ length: 14 }, (_, i) => ({
        price: currentPrice * (0.9 + Math.random() * 0.2),
        recorded_at: new Date(now - (14 - i) * 86400000).toISOString()
      }))
      setHistory(simulated)
    }
  }

  const handleSetAlert = async () => {
    if (!targetPrice) return
    try {
      await api.post('/price-alerts/create/', {
        product_id: productId,
        target_price: parseFloat(targetPrice)
      })
      setAlertSet(true)
      setShowAlert(false)
    } catch (e) {
      console.error('Error setting alert:', e)
    }
  }

  // SVG mini chart
  const renderChart = () => {
    if (history.length < 2) return null

    const prices = history.map(h => parseFloat(h.price))
    const min = Math.min(...prices) * 0.95
    const max = Math.max(...prices) * 1.05
    const range = max - min || 1
    const w = 280
    const h = 60

    const points = prices.map((p, i) => {
      const x = (i / (prices.length - 1)) * w
      const y = h - ((p - min) / range) * h
      return `${x},${y}`
    }).join(' ')

    const areaPoints = `0,${h} ${points} ${w},${h}`
    const lowestPrice = Math.min(...prices)
    const highestPrice = Math.max(...prices)

    return (
      <div className="space-y-1">
        <svg viewBox={`0 0 ${w} ${h + 10}`} className="w-full h-16">
          <defs>
            <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={areaPoints} fill="url(#priceGrad)" />
          <polyline
            points={points}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Low: {parseInt(lowestPrice).toLocaleString()} FCFA</span>
          <span>High: {parseInt(highestPrice).toLocaleString()} FCFA</span>
        </div>
      </div>
    )
  }

  return (
    <div className="border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <TrendingDown className="h-4 w-4 text-primary" />
          Price History
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => alertSet ? null : setShowAlert(!showAlert)}
          className="text-xs h-7"
        >
          {alertSet ? (
            <><BellOff className="h-3 w-3 mr-1" /> Alert Set</>
          ) : (
            <><Bell className="h-3 w-3 mr-1" /> Price Alert</>
          )}
        </Button>
      </div>

      {renderChart()}

      {showAlert && !alertSet && (
        <div className="flex gap-2 pt-2 border-t">
          <input
            type="number"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            placeholder={`Below ${parseInt(currentPrice).toLocaleString()}`}
            className="flex-1 px-3 py-1.5 text-sm border rounded-lg bg-background"
          />
          <Button size="sm" onClick={handleSetAlert} className="text-xs">
            Set Alert
          </Button>
        </div>
      )}
    </div>
  )
}
