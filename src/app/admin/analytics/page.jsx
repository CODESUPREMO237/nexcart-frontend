'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Users, Package, ShoppingBag, DollarSign, Store, Clock } from 'lucide-react'
import api from '@/lib/api'

export default function AnalyticsDashboardPage() {
  const [stats, setStats] = useState(null)
  const [salesData, setSalesData] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    try {
      const [s, c, p, o] = await Promise.allSettled([
        api.get('/analytics/dashboard/'),
        api.get('/analytics/sales-chart/?days=30'),
        api.get('/analytics/top-products/?limit=5'),
        api.get('/analytics/recent-orders/?limit=10')
      ])
      if (s.status === 'fulfilled') setStats(s.value.data)
      if (c.status === 'fulfilled') setSalesData(c.value.data?.data || [])
      if (p.status === 'fulfilled') setTopProducts(p.value.data?.results || [])
      if (o.status === 'fulfilled') setRecentOrders(o.value.data?.results || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const renderSalesChart = () => {
    if (salesData.length < 2) return <div className="text-sm text-muted-foreground text-center py-8">Not enough data</div>

    const revenues = salesData.map(d => parseFloat(d.revenue || 0))
    const max = Math.max(...revenues, 1)
    const w = 600
    const h = 200

    const points = revenues.map((r, i) => {
      const x = (i / (revenues.length - 1)) * w
      const y = h - (r / max) * h
      return `${x},${y}`
    }).join(' ')

    const area = `0,${h} ${points} ${w},${h}`

    return (
      <svg viewBox={`0 0 ${w} ${h + 20}`} className="w-full h-48">
        <defs>
          <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#B5651D" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#B5651D" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#salesGrad)" />
        <polyline points={points} fill="none" stroke="#B5651D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {revenues.map((r, i) => {
          const x = (i / (revenues.length - 1)) * w
          const y = h - (r / max) * h
          return <circle key={i} cx={x} cy={y} r="3" fill="#B5651D" />
        })}
      </svg>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground font-mono text-sm uppercase tracking-[0.1em]">Loading analytics…</div>
      </div>
    )
  }

  const statCards = stats ? [
    { label: 'Total Revenue', value: `${parseInt(stats.revenue?.total || 0).toLocaleString()} FCFA`, sub: `${parseInt(stats.revenue?.monthly || 0).toLocaleString()} this month`, icon: DollarSign },
    { label: 'Total Orders', value: stats.orders?.total || 0, sub: `${stats.orders?.pending || 0} pending`, icon: ShoppingBag },
    { label: 'Users', value: stats.users?.total || 0, sub: `${stats.users?.new_this_month || 0} new this month`, icon: Users },
    { label: 'Products', value: stats.products?.total || 0, sub: stats.products?.low_stock > 0 ? `${stats.products.low_stock} low stock` : 'All stocked', icon: Package },
    { label: 'Vendors', value: stats.vendors?.total || 0, sub: `${stats.vendors?.pending_approval || 0} pending approval`, icon: Store },
    { label: 'Weekly Revenue', value: `${parseInt(stats.revenue?.weekly || 0).toLocaleString()} FCFA`, sub: 'Last 7 days', icon: TrendingUp },
  ] : []

  return (
    <div className="min-h-screen py-6 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-accent mb-1 flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" /> Reports
          </p>
          <h1 className="text-2xl font-display font-bold text-foreground">Analytics Dashboard</h1>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map((card) => (
            <div key={card.label} className="border border-border rounded-md bg-card p-4 hover:border-accent/50 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-md border border-border bg-muted flex items-center justify-center shrink-0">
                  <card.icon className="h-3.5 w-3.5 text-accent" />
                </div>
                <span className="text-xs font-mono uppercase tracking-[0.05em] text-muted-foreground">{card.label}</span>
              </div>
              <p className="text-xl font-display font-bold text-foreground">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Charts & Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Chart */}
          <div className="border border-border rounded-md bg-card p-5">
            <h2 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-accent" /> Sales (Last 30 Days)
            </h2>
            {renderSalesChart()}
          </div>

          {/* Top Products */}
          <div className="border border-border rounded-md bg-card p-5">
            <h2 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-accent" /> Top Products
            </h2>
            <div className="space-y-3">
              {topProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No data</p>
              ) : (
                topProducts.map((p, i) => (
                  <div key={p.id || i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-muted-foreground w-5">#{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground truncate max-w-[200px]">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.purchase_count || 0} sales • {p.view_count || 0} views</p>
                      </div>
                    </div>
                    <span className="text-sm font-mono font-medium text-foreground">{parseInt(p.price).toLocaleString()} FCFA</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="border border-border rounded-md bg-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-display font-semibold text-foreground flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-accent" /> Recent Orders
            </h2>
          </div>
          <table className="w-full">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-4 py-2 text-xs font-mono uppercase tracking-[0.05em] text-muted-foreground">Order</th>
                <th className="text-left px-4 py-2 text-xs font-mono uppercase tracking-[0.05em] text-muted-foreground">Status</th>
                <th className="text-left px-4 py-2 text-xs font-mono uppercase tracking-[0.05em] text-muted-foreground hidden sm:table-cell">Payment</th>
                <th className="text-left px-4 py-2 text-xs font-mono uppercase tracking-[0.05em] text-muted-foreground">Total</th>
                <th className="text-left px-4 py-2 text-xs font-mono uppercase tracking-[0.05em] text-muted-foreground hidden sm:table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">No orders yet</td></tr>
              ) : (
                recentOrders.map((o) => (
                  <tr key={o.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-2.5 text-sm font-mono font-medium text-foreground">{o.order_number}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-md border text-[10px] font-mono uppercase tracking-[0.05em] ${
                        o.status === 'delivered' ? 'border-[#2F5233]/30 bg-[#2F5233]/5 text-[#2F5233]' :
                        o.status === 'shipped' ? 'border-border bg-muted text-foreground' :
                        'border-accent/30 bg-accent/5 text-accent'
                      }`}>{o.status}</span>
                    </td>
                    <td className="px-4 py-2.5 text-sm hidden sm:table-cell">
                      <span className={`text-xs font-mono ${o.payment_status === 'completed' ? 'text-[#2F5233]' : 'text-accent'}`}>
                        {o.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-sm font-mono text-foreground">{parseInt(o.total || o.total_amount || 0).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground hidden sm:table-cell">
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
