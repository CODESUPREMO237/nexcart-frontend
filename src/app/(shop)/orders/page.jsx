'use client'

import { useEffect, useState } from 'react'
import { useRequireAuth } from '@/hooks/useAuth'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Package, Clock, CheckCircle, XCircle, Eye, Search, TrendingUp, ShoppingBag, Calendar, Filter } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

const fcfa = (n) =>
  new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n)

const STATUS_CONFIG = {
  pending:    { icon: Clock,       label: 'Pending',    color: 'text-yellow-700 bg-yellow-50 border border-yellow-200' },
  processing: { icon: Package,     label: 'Processing', color: 'text-blue-700 bg-blue-50 border border-blue-200' },
  shipped:    { icon: Package,     label: 'Shipped',    color: 'text-indigo-700 bg-indigo-50 border border-indigo-200' },
  delivered:  { icon: CheckCircle, label: 'Delivered',  color: 'text-green-700 bg-green-50 border border-green-200' },
  cancelled:  { icon: XCircle,     label: 'Cancelled',  color: 'text-red-700 bg-red-50 border border-red-200' },
}

const PAYMENT_CONFIG = {
  completed: { label: 'Payment successful', color: 'text-green-700 bg-green-50 border border-green-200' },
  pending:   { label: 'Payment pending',    color: 'text-yellow-700 bg-yellow-50 border border-yellow-200' },
  failed:    { label: 'Payment failed',     color: 'text-red-700 bg-red-50 border border-red-200' },
}

function PaymentBadge({ status }) {
  const cfg = PAYMENT_CONFIG[status] || PAYMENT_CONFIG.pending
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
      {status === 'completed' ? '✓' : status === 'failed' ? '✗' : '⏳'} {cfg.label}
    </span>
  )
}

function StatusBadge({ status }) {
  const cfg  = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${cfg.color}`}>
      <Icon className="h-3.5 w-3.5" /> {cfg.label}
    </span>
  )
}

export default function OrdersPage() {
  const { isLoading: authLoading, isAuthorized } = useRequireAuth()
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState('all')

  useEffect(() => { if (isAuthorized) loadOrders() }, [isAuthorized])

  const loadOrders = async () => {
    try {
      const data = await api.getOrders()
      setOrders(data.results || data || [])
    } catch (err) {
      console.error('Failed to load orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = orders.filter((o) => {
    const matchStatus = filter === 'all' || o.status === filter
    const matchSearch = search === '' ||
      (o.order_number || o.id || '').toLowerCase().includes(search.toLowerCase()) ||
      o.items?.some((i) => i.product?.name?.toLowerCase().includes(search.toLowerCase()))
    return matchStatus && matchSearch
  })

  const totalSpent     = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + parseFloat(o.total_amount || 0), 0)
  const totalOrders    = orders.length
  const deliveredCount = orders.filter(o => o.status === 'delivered').length

  if (authLoading || !isAuthorized || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="space-y-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 animate-fade-in">
        <div className="max-w-md mx-auto text-center">
          <ShoppingBag className="w-24 h-24 mx-auto mb-6 text-muted-foreground animate-float" />
          <h1 className="text-3xl font-bold mb-4">No orders yet</h1>
          <p className="text-muted-foreground mb-8">
            You haven&apos;t placed any orders yet. Start shopping!
          </p>
          <Button size="lg" asChild className="btn-press">
            <Link href="/products">Browse products</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold">Order History</h1>
        <p className="text-muted-foreground">{totalOrders} order{totalOrders > 1 ? 's' : ''}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { icon: ShoppingBag, label: 'Total orders',   value: totalOrders,       color: 'text-blue-600',    bg: 'bg-blue-50' },
          { icon: CheckCircle, label: 'Delivered',       value: deliveredCount,    color: 'text-green-600',   bg: 'bg-green-50' },
          { icon: TrendingUp,  label: 'Total spent',     value: fcfa(totalSpent),  color: 'text-primary',     bg: 'bg-primary/10' },
        ].map(({ icon: Icon, label, value, color, bg }, idx) => (
          <Card key={label} className={`animate-fade-in stagger-${idx + 1} card-hover`}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`w-12 h-12 rounded-full ${bg} flex items-center justify-center`}>
                <Icon className={`h-6 w-6 ${color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-slide-down">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by order number or product…" className="pl-10"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => (
            <Button key={s} size="sm" variant={filter === s ? 'default' : 'outline'}
              className="btn-press capitalize"
              onClick={() => setFilter(s)}>
              {s === 'all' ? 'All' : STATUS_CONFIG[s]?.label || s}
            </Button>
          ))}
        </div>
      </div>

      {/* Orders list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 animate-scale-in">
          <Filter className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No orders match your search.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filtered.map((order, idx) => (
            <Card key={order.id} className={`overflow-hidden card-hover animate-fade-in stagger-${Math.min(idx + 1, 8)}`}>
              <CardHeader className="bg-muted/30 border-b">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg mb-1">
                      Order #{order.order_number || order.id?.slice(0, 8)?.toUpperCase()}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <PaymentBadge status={order.payment_status} />
                      <StatusBadge status={order.status} />
                    </div>
                    <Button variant="outline" size="sm" asChild className="btn-press">
                      <Link href={`/orders/${order.id}`}>
                        <Eye className="h-4 w-4 mr-2" /> Details
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                <div className="space-y-4">
                  {order.items?.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex gap-4 animate-fade-in">
                      <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                        {(item.product_image || item.product?.featured_image) ? (
                          <Image
                            src={item.product_image || item.product?.featured_image}
                            alt={item.product_name || item.product?.name || 'Product'}
                            fill className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <Package className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/products/${item.product?.id || '#'}`}>
                          <h3 className="font-medium hover:text-primary line-clamp-1 transition-colors">
                            {item.product_name || item.product?.name}
                          </h3>
                        </Link>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                        <p className="text-sm font-semibold text-primary">
                          {fcfa(parseFloat(item.price || item.total || 0))}
                        </p>
                      </div>
                    </div>
                  ))}
                  {order.items?.length > 3 && (
                    <p className="text-sm text-muted-foreground">
                      +{order.items.length - 3} more item{order.items.length - 3 > 1 ? 's' : ''}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    {order.shipping_address && (
                      <p className="text-sm text-muted-foreground">
                        📍 {order.shipping_address.city}, {order.shipping_address.state}, {order.shipping_address.country}
                      </p>
                    )}
                    {order.tracking_number && (
                      <p className="text-xs font-mono text-primary mt-1">
                        Tracking: {order.tracking_number}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold text-primary">{fcfa(order.total_amount)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
