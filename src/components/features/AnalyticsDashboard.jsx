'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Eye,
  Activity,
  Package
} from 'lucide-react'
import { formatPrice } from '@/lib/utils'

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7d')
  const [analyticsData, setAnalyticsData] = useState({
    revenue: [],
    orders: [],
    users: [],
    products: [],
    topProducts: [],
    categoryDistribution: [],
    revenueStats: {
      total: 0,
      change: 0,
      average: 0
    },
    orderStats: {
      total: 0,
      change: 0,
      average: 0
    },
    userStats: {
      total: 0,
      change: 0,
      active: 0
    }
  })

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)

      // Simulate API call - replace with actual API
      const mockData = generateMockData(timeRange)
      setAnalyticsData(mockData)

      // Actual API call would be:
      // const response = await api.get(`/admin/analytics/?range=${timeRange}`)
      // setAnalyticsData(response.data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }, [timeRange])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])


  const generateMockData = (range) => {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
    const revenue = []
    const orders = []
    
    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - (days - i))
      
      revenue.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount: Math.floor(Math.random() * 50000) + 20000
      })
      
      orders.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: Math.floor(Math.random() * 50) + 10
      })
    }

    return {
      revenue,
      orders,
      topProducts: [
        { name: 'iPhone 14 Pro', sales: 145, revenue: 14500000 },
        { name: 'Samsung Galaxy S23', sales: 132, revenue: 11880000 },
        { name: 'MacBook Pro', sales: 89, revenue: 17800000 },
        { name: 'AirPods Pro', sales: 210, revenue: 4200000 },
        { name: 'iPad Air', sales: 95, revenue: 5700000 }
      ],
      categoryDistribution: [
        { name: 'Electronics', value: 45, color: '#3b82f6' },
        { name: 'Fashion', value: 25, color: '#8b5cf6' },
        { name: 'Home & Living', value: 15, color: '#10b981' },
        { name: 'Sports', value: 10, color: '#f59e0b' },
        { name: 'Books', value: 5, color: '#ef4444' }
      ],
      revenueStats: {
        total: 25800000,
        change: 12.5,
        average: 1290000
      },
      orderStats: {
        total: 1234,
        change: 8.3,
        average: 62
      },
      userStats: {
        total: 5432,
        change: 15.7,
        active: 3421
      }
    }
  }

  const StatCard = ({ title, value, icon: Icon, change, color, prefix = '' }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <div className={`${color} p-2 rounded-lg bg-opacity-10`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">
          {typeof value === 'number' ? formatPrice(value) : value}
        </div>
        {change !== undefined && (
          <p className={`text-sm mt-2 flex items-center ${
            change >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {change >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            {Math.abs(change)}% from last period
          </p>
        )}
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="space-y-6">
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

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Analytics Overview</h2>
        <Tabs value={timeRange} onValueChange={setTimeRange}>
          <TabsList>
            <TabsTrigger value="7d">7 Days</TabsTrigger>
            <TabsTrigger value="30d">30 Days</TabsTrigger>
            <TabsTrigger value="90d">90 Days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={analyticsData.revenueStats.total}
          icon={DollarSign}
          change={analyticsData.revenueStats.change}
          color="text-green-600"
          
        />
        <StatCard
          title="Total Orders"
          value={analyticsData.orderStats.total}
          icon={ShoppingCart}
          change={analyticsData.orderStats.change}
          color="text-blue-600"
        />
        <StatCard
          title="Total Users"
          value={analyticsData.userStats.total}
          icon={Users}
          change={analyticsData.userStats.change}
          color="text-purple-600"
        />
        <StatCard
          title="Active Users"
          value={analyticsData.userStats.active}
          icon={Activity}
          color="text-orange-600"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData.revenue}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => formatPrice(value)}
                  labelStyle={{ color: '#000' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Orders Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Orders Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.orders}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index === 0 ? 'bg-yellow-100 text-yellow-600' :
                      index === 1 ? 'bg-gray-100 text-gray-600' :
                      index === 2 ? 'bg-orange-100 text-orange-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.sales} sales</p>
                    </div>
                  </div>
                  <p className="font-bold text-green-600">
                    {formatPrice(product.revenue)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.categoryDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analyticsData.categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              Page Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">45,678</p>
            <p className="text-sm text-green-600 mt-2">
              <TrendingUp className="w-4 h-4 inline mr-1" />
              +18.2% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">3.24%</p>
            <p className="text-sm text-green-600 mt-2">
              <TrendingUp className="w-4 h-4 inline mr-1" />
              +0.8% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Average Order Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatPrice(analyticsData.revenueStats.average)}</p>
            <p className="text-sm text-green-600 mt-2">
              <TrendingUp className="w-4 h-4 inline mr-1" />
              +5.3% from last period
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}