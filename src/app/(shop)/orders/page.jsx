'use client'

import { useEffect, useState } from 'react'
import { useRequireAuth } from '@/hooks/useAuth'
import { api } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Package, Clock, CheckCircle, XCircle, Eye, Search, TrendingUp, ShoppingBag, Calendar } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

const fcfa = (n) =>
  new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n)

const STATUS_CONFIG = {
  pending:    { icon: Clock,       label: 'Pending',    className: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  processing: { icon: Package,     label: 'Processing', className: 'text-blue-700 bg-blue-50 border-blue-200' },
  shipped:    { icon: Package,     label: 'Shipped',    className: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  delivered:  { icon: CheckCircle, label: 'Delivered',  className: 'text-green-700 bg-green-50 border-green-200' },
  cancelled:  { icon: XCircle,     label: 'Cancelled',  className: 'text-red-700 bg-red-50 border-red-200' },
}

const PAYMENT_CONFIG = {
  completed: { label: 'Paid',    className: 'text-green-700 bg-green-50 border-green-200' },
  pending:   { label: 'Pending', className: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  failed:    { label: 'Failed',  className: 'text-red-700 bg-red-50 border-red-200' },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${cfg.className}`}>
      <Icon className="h-3 w-3" />{cfg.label}
    </span>
  )
}

function PaymentBadge({ status }) {
  const cfg = PAYMENT_CONFIG[status] || PAYMENT_CONFIG.pending
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${cfg.className}`}>
      {cfg.label}
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
      <div className="container mx-auto px-4 max-w-6xl py-10">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-md" />)}
        </div>
        <div className="space-y-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-40 rounded-md" />)}
        </div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 max-w-6xl py-24 animate-fade-in">
        <div className="max-w-sm mx-auto text-center">
          <div className="w-16 h-16 rounded-md border border-border bg-muted flex items-center justify-center mx-auto mb-5">
            <ShoppingBag className="w-7 h-7 text-muted-foreground" />
          </div>
          <h1 className="font-display font-bold text-2xl text-foreground mb-2">No orders yet</h1>
          <p className="text-sm text-muted-foreground mb-7">Place your first order and it will appear here.</p>
          <Button size="sm" asChild className="btn-press">
            <Link href="/products">Browse products</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 max-w-6xl py-10 animate-fade-in">
      {/* Header */}
      <div className="mb-8 pb-4 border-b border-border">
        <span className="font-mono text-xs uppercase tracking-[0.15em] text-accent">Account</span>
        <h1 className="font-display font-bold text-2xl md:text-3xl text-foreground mt-1">Order History</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { icon: ShoppingBag, label: 'Total orders', value: totalOrders },
          { icon: CheckCircle, label: 'Delivered',    value: deliveredCount },
          { icon: TrendingUp,  label: 'Total spent',  value: fcfa(totalSpent) },
        ].map(({ icon: Icon, label, value }, idx) => (
          <div
            key={label}
            className="border border-border rounded-md bg-card p-5 flex items-center gap-4 animate-fade-in"
            style={{ animationDelay: `${idx * 0.06}s` }}
          >
            <div className="h-10 w-10 rounded-md border border-border bg-muted flex items-center justify-center shrink-0">
              <Icon className="h-4.5 w-4.5 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-mono uppercase tracking-wide">{label}</p>
              <p className="font-display font-bold text-xl text-foreground mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search by order number or product…" className="pl-9 h-9 text-sm"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => (
            <Button key={s} size="sm" variant={filter === s ? 'default' : 'outline'}
              className="btn-press capitalize h-9 text-xs"
              onClick={() => setFilter(s)}>
              {s === 'all' ? 'All' : STATUS_CONFIG[s]?.label || s}
            </Button>
          ))}
        </div>
      </div>

      {/* Orders */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-border rounded-md bg-card">
          <p className="text-sm text-muted-foreground">No orders match your search.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order, idx) => (
            <div
              key={order.id}
              className="border border-border rounded-md bg-card overflow-hidden animate-fade-in"
              style={{ animationDelay: `${Math.min(idx, 7) * 0.05}s` }}
            >
              {/* Order header */}
              <div className="px-5 py-4 border-b border-border bg-muted/30 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="font-mono text-sm font-semibold text-foreground">
                    #{order.order_number || order.id?.slice(0, 8)?.toUpperCase()}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <PaymentBadge status={order.payment_status} />
                  <StatusBadge status={order.status} />
                  <Button variant="outline" size="sm" asChild className="btn-press h-7 text-xs">
                    <Link href={`/orders/${order.id}`}><Eye className="h-3 w-3 mr-1" />Details</Link>
                  </Button>
                </div>
              </div>

              {/* Items */}
              <div className="p-5">
                <div className="space-y-3">
                  {order.items?.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="relative w-14 h-14 shrink-0 overflow-hidden rounded-md bg-muted">
                        {(item.product_image || item.product?.featured_image) ? (
                          <Image src={item.product_image || item.product?.featured_image}
                            alt={item.product_name || item.product?.name || 'Product'}
                            fill className="object-cover" unoptimized />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/products/${item.product?.id || '#'}`}>
                          <p className="text-sm font-medium text-foreground hover:text-accent transition-colors line-clamp-1">
                            {item.product_name || item.product?.name}
                          </p>
                        </Link>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        <p className="text-xs font-mono font-semibold text-foreground mt-0.5">
                          {fcfa(parseFloat(item.price || item.total || 0))}
                        </p>
                      </div>
                    </div>
                  ))}
                  {order.items?.length > 3 && (
                    <p className="text-xs text-muted-foreground">+{order.items.length - 3} more item{order.items.length - 3 > 1 ? 's' : ''}</p>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-border flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    {order.shipping_address && (
                      <p className="text-xs text-muted-foreground">
                        📍 {order.shipping_address.city}, {order.shipping_address.state}
                      </p>
                    )}
                    {order.tracking_number && (
                      <p className="text-xs font-mono text-accent mt-0.5">Tracking: {order.tracking_number}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Order total</p>
                    <p className="font-mono font-bold text-lg text-foreground">{fcfa(order.total_amount)}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
