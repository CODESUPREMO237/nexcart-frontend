// Location: app\admin\dashboard\page.jsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import useAuthStore from '@/store/authStore'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
    
    // Use existing working endpoints
    const [productsRes, ordersRes] = await Promise.all([
      api.getProducts(), // Calls /api/products/
      api.getOrders()    // Calls /api/orders/
    ])
    
    // Handle different data structures (Django Rest Framework usually returns .results)
    const orders = ordersRes.results || ordersRes || []
    const products = productsRes.results || productsRes || []
    
    // Calculate stats from the fetched data
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0)
    const completedOrders = orders.filter(o => o.status === 'delivered').length
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0
    
    setStats({
      total_revenue: totalRevenue,
      total_orders: orders.length,
      total_users: 0, // We'll add a user count later
      total_products: products.length,
      completed_orders: completedOrders,
      avg_order_value: avgOrderValue,
      new_users: 0 
    })
      
      setRecentOrders(orders.slice(0, 5))
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Provide fallback empty data instead of crashing
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-20 w-full" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Revenue',
      value: formatPrice(stats.total_revenue),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: '+12.5%'
    },
    {
      title: 'Total Orders',
      value: stats.total_orders,
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: '+8.2%'
    },
    {
      title: 'Total Users',
      value: stats.total_users || 'N/A',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      change: '+15.3%'
    },
    {
      title: 'Total Products',
      value: stats.total_products,
      icon: Package,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      change: '+5.1%'
    }
  ]

  const getOrderStatusBadge = (status) => {
    const statusMap = {
      pending: { variant: 'warning', label: 'Pending' },
      processing: { variant: 'default', label: 'Processing' },
      shipped: { variant: 'info', label: 'Shipped' },
      delivered: { variant: 'success', label: 'Delivered' },
      cancelled: { variant: 'destructive', label: 'Cancelled' }
    }
    const config = statusMap[status] || statusMap.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back, {user?.name || 'Admin'}! Here&apos;s your store overview.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`${stat.bgColor} p-2 rounded-lg`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                <p className="text-sm text-green-600 mt-2">
                  <TrendingUp className="w-4 h-4 inline mr-1" />
                  {stat.change} from last month
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent orders</p>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => router.push(`/admin/orders/${order.id}`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
                        {getOrderStatusBadge(order.status)}
                      </div>
                      <p className="text-sm text-gray-600">
                        {order.user?.name || order.user?.email || 'Guest'} • {order.items?.length || 0} items
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">
                        {formatPrice(order.total_amount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-blue-600 mr-3" />
                  <div>
                    <p className="font-semibold">Completed Orders</p>
                    <p className="text-sm text-gray-600">This month</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.completed_orders}
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <TrendingUp className="w-5 h-5 text-green-600 mr-3" />
                  <div>
                    <p className="font-semibold">Average Order Value</p>
                    <p className="text-sm text-gray-600">This month</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {formatPrice(stats.avg_order_value)}
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-purple-600 mr-3" />
                  <div>
                    <p className="font-semibold">New Customers</p>
                    <p className="text-sm text-gray-600">This week</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.new_users || 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

