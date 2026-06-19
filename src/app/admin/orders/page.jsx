// Location: app\admin\orders\page.jsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import useAuthStore from '@/store/authStore'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Package,
  Truck,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import Image from 'next/image'

const STATUS_STYLES = {
  pending: 'border-accent/30 bg-accent/5 text-accent',
  processing: 'border-border bg-muted text-foreground',
  shipped: 'border-border bg-muted text-foreground',
  delivered: 'border-[#2F5233]/30 bg-[#2F5233]/5 text-[#2F5233]',
  cancelled: 'border-destructive/30 bg-destructive/5 text-destructive',
}

function StatusTag({ status, icon: Icon, label }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-mono uppercase tracking-[0.06em] ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  )
}

export default function AdminOrdersPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showDialog, setShowDialog] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    if (user && user.role !== 'admin') {
      router.push('/')
      return
    }
    fetchOrders()
  }, [isAuthenticated, user, router])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const data = await api.getOrders()
      setOrders(data.results || data)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewOrder = async (orderId) => {
    try {
      const response = await api.get(`/admin/orders/${orderId}/`)
      setSelectedOrder(response.data)
      setShowDialog(true)
    } catch (error) {
      console.error('Error fetching order details:', error)
    }
  }

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/admin/orders/${orderId}/`, { status: newStatus })
      fetchOrders()
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus })
      }
    } catch (error) {
      console.error('Error updating order status:', error)
      alert('Failed to update order status')
    }
  }

  const getStatusConfig = (status) => {
    const configs = {
      pending: { icon: ShoppingCart, label: 'Pending' },
      processing: { icon: Package, label: 'Processing' },
      shipped: { icon: Truck, label: 'Shipped' },
      delivered: { icon: CheckCircle, label: 'Delivered' },
      cancelled: { icon: XCircle, label: 'Cancelled' }
    }
    return configs[status] || configs.pending
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.id.toString().includes(searchQuery) ||
      order.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-accent mb-1">Operations</p>
        <h1 className="text-3xl font-display font-bold text-foreground">Order Management</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your {orders.length} orders
        </p>
      </div>

      {/* Filters */}
      <div className="border border-border rounded-md bg-card p-4">
        <div className="flex gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by order ID, customer name, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-md"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 rounded-md">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="border border-border rounded-md bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground font-mono text-sm">
                  Loading orders…
                </TableCell>
              </TableRow>
            ) : paginatedOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <ShoppingCart className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">No orders found</p>
                </TableCell>
              </TableRow>
            ) : (
              paginatedOrders.map((order) => {
                const statusConfig = getStatusConfig(order.status)

                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono font-semibold text-foreground">
                      #{order.id}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground text-sm">{order.user?.name || 'Guest'}</p>
                        <p className="text-xs text-muted-foreground">{order.user?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-foreground">
                      {order.items?.length || 0} items
                    </TableCell>
                    <TableCell className="font-mono font-semibold text-foreground">
                      {formatPrice(order.total_amount)}
                    </TableCell>
                    <TableCell>
                      <StatusTag status={order.status} icon={statusConfig.icon} label={statusConfig.label} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-md"
                        onClick={() => handleViewOrder(order.id)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            className="rounded-md"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground font-mono">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            className="rounded-md"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Order Details Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-md">
          <DialogHeader>
            <DialogTitle className="font-display">Order Details #{selectedOrder?.id}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Status Update */}
              <div className="flex items-center gap-4">
                <label className="font-medium text-sm text-foreground">Update Status:</label>
                <Select
                  value={selectedOrder.status}
                  onValueChange={(status) => handleUpdateStatus(selectedOrder.id, status)}
                >
                  <SelectTrigger className="w-48 rounded-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Customer Info */}
              <div>
                <h3 className="font-display font-semibold text-foreground mb-3">Customer Information</h3>
                <div className="border border-border rounded-md bg-muted/30 p-4 space-y-2 text-sm">
                  <p><span className="font-medium text-foreground">Name:</span> <span className="text-muted-foreground">{selectedOrder.user?.name}</span></p>
                  <p><span className="font-medium text-foreground">Email:</span> <span className="text-muted-foreground">{selectedOrder.user?.email}</span></p>
                  <p><span className="font-medium text-foreground">Phone:</span> <span className="text-muted-foreground">{selectedOrder.shipping_address?.phone || 'N/A'}</span></p>
                </div>
              </div>

              {/* Shipping Address */}
              {selectedOrder.shipping_address && (
                <div>
                  <h3 className="font-display font-semibold text-foreground mb-3">Shipping Address</h3>
                  <div className="border border-border rounded-md bg-muted/30 p-4 text-sm text-muted-foreground">
                    <p>{selectedOrder.shipping_address.street}</p>
                    <p>{selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state}</p>
                    <p>{selectedOrder.shipping_address.country} - {selectedOrder.shipping_address.postal_code}</p>
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div>
                <h3 className="font-display font-semibold text-foreground mb-3">Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 border border-border rounded-md p-3">
                      <div className="w-16 h-16 bg-muted rounded-md overflow-hidden flex-shrink-0 relative">
                        {item.product?.image ? (
                          <Image
                            src={item.product.image}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground text-sm">{item.product?.name}</p>
                        <p className="text-xs text-muted-foreground">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-semibold text-foreground text-sm">{formatPrice(item.price * item.quantity)}</p>
                        <p className="text-xs text-muted-foreground">{formatPrice(item.price)} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t border-border pt-4">
                <div className="flex justify-between text-lg font-display font-bold text-foreground">
                  <span>Total Amount</span>
                  <span className="text-accent font-mono">{formatPrice(selectedOrder.total_amount)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
