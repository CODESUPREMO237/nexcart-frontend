// Location: app\admin\dashboard\page.jsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import useAuthStore from '@/store/authStore'
import { api } from '@/lib/api'
import { Skeleton } from '@/components/ui/skeleton'
import {
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
  DollarSign,
  Activity,
  Eye,
  CheckCircle
} from 'lucide-react'
import { formatPrice } from '@/lib/utils'

function StatusTag({ status }) {
  const map = {
    pending: { label: 'Pending', cls: 'border-accent/30 bg-accent/5 text-accent' },
    processing: { label: 'Processing', cls: 'border-border bg-muted text-foreground' },
    shipped: { label: 'Shipped', cls: 'border-border bg-muted text-foreground' },
    delivered: { label: 'Delivered', cls: 'border-[#2F5233]/30 bg-[#2F5233]/5 text-[#2F5233]' },
    cancelled: { label: 'Cancelled', cls: 'border-destructive/30 bg-destructive/5 text-destructive' },
  }
  const cfg = map[status] || map.pending
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-mono uppercase tracking-[0.08em] ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

export default function AdminDashboard() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [stats, setStats] = useState({
    total_revenue: 0,
    total_orders: 0,
    total_users: 0,
    total_products: 0,
    completed_orders: 0,
    avg_order_value: 0,
    new_users: 0
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    if (user && user.role !== 'admin') {
      router.push('/')
      return
    }
    fetchDashboardData()
  }, [isAuthenticated, user, router])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      const [productsRes, ordersRes, usersRes] = await Promise.all([
        api.getProducts(),
        api.getOrders(),
        api.get('/users/admin/users/').catch(() => ({ data: { results: [], count: 0 } }))
      ])

      const orders = ordersRes.results || ordersRes || []
      const products = productsRes.results || productsRes || []
      const usersData = usersRes.data?.results || usersRes.data || []
      const totalUsers = usersRes.data?.count || usersData.length || 0

      const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0)
      const completedOrders = orders.filter(o => o.status === 'delivered').length
      const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0

      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      const newUsersThisWeek = usersData.filter(u => new Date(u.date_joined) >= oneWeekAgo).length

      setStats({
        total_revenue: totalRevenue,
        total_orders: orders.length,
        total_users: totalUsers,
        total_products: products.length,
        completed_orders: completedOrders,
        avg_order_value: avgOrderValue,
        new_users: newUsersThisWeek
      })

      setRecentOrders(orders.slice(0, 5))
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setStats({
        total_revenue: 0,
        total_orders: 0,
        total_users: 0,
        total_products: 0,
        completed_orders: 0,
        avg_order_value: 0,
        new_users: 0
      })
      setRecentOrders([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="border border-border rounded-md bg-card p-5">
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const statCards = [
    { title: 'Total Revenue', value: formatPrice(stats.total_revenue), icon: DollarSign, change: '+12.5%' },
    { title: 'Total Orders', value: stats.total_orders, icon: ShoppingCart, change: '+8.2%' },
    { title: 'Total Users', value: stats.total_users ?? 0, icon: Users, change: '+15.3%' },
    { title: 'Total Products', value: stats.total_products, icon: Package, change: '+5.1%' }
  ]

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-accent mb-1">Overview</p>
        <h1 className="text-3xl font-display font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Welcome back, {user?.name || 'Admin'}. Here&apos;s your store overview.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="border border-border rounded-md bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-mono uppercase tracking-[0.08em] text-muted-foreground">{stat.title}</p>
                <div className="w-8 h-8 rounded-md border border-border bg-muted flex items-center justify-center">
                  <Icon className="w-4 h-4 text-accent" />
                </div>
              </div>
              <div className="text-2xl font-display font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-[#2F5233] mt-2 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                {stat.change} from last month
              </p>
            </div>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Orders */}
        <div className="border border-border rounded-md bg-card">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent" />
            <h2 className="font-display font-semibold text-foreground text-sm">Recent Orders</h2>
          </div>
          <div className="p-5">
            {recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-4 text-sm">No recent orders</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 border border-border rounded-md hover:border-accent/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/admin/orders/${order.id}`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-foreground font-mono text-sm">#{order.id.slice(0, 8)}</p>
                        <StatusTag status={order.status} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {order.user?.name || order.user?.email || 'Guest'} • {order.items?.length || 0} items
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-semibold text-foreground text-sm">
                        {formatPrice(order.total_amount)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="border border-border rounded-md bg-card">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Eye className="w-4 h-4 text-accent" />
            <h2 className="font-display font-semibold text-foreground text-sm">Quick Stats</h2>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between p-3 border border-border rounded-md">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-accent mr-3" />
                <div>
                  <p className="font-medium text-foreground text-sm">Completed Orders</p>
                  <p className="text-xs text-muted-foreground">This month</p>
                </div>
              </div>
              <p className="text-xl font-display font-bold text-foreground">
                {stats.completed_orders}
              </p>
            </div>

            <div className="flex items-center justify-between p-3 border border-border rounded-md">
              <div className="flex items-center">
                <TrendingUp className="w-4 h-4 text-accent mr-3" />
                <div>
                  <p className="font-medium text-foreground text-sm">Average Order Value</p>
                  <p className="text-xs text-muted-foreground">This month</p>
                </div>
              </div>
              <p className="text-xl font-display font-bold text-foreground font-mono">
                {formatPrice(stats.avg_order_value)}
              </p>
            </div>

            <div className="flex items-center justify-between p-3 border border-border rounded-md">
              <div className="flex items-center">
                <Users className="w-4 h-4 text-accent mr-3" />
                <div>
                  <p className="font-medium text-foreground text-sm">New Customers</p>
                  <p className="text-xs text-muted-foreground">This week</p>
                </div>
              </div>
              <p className="text-xl font-display font-bold text-foreground">
                {stats.new_users ?? 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
