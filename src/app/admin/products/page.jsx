'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import useAuthStore from '@/store/authStore'
import api from '@/lib/api'
import Image from 'next/image'
import {
  CheckCircle, XCircle, Trash2, Clock, Package,
  RefreshCw, ChevronLeft, ChevronRight, Search,
  Eye, AlertTriangle, Store, Tag
} from 'lucide-react'

const STATUS_CONFIG = {
  new:      { label: 'New Listing',    color: 'border-border bg-muted text-foreground',          icon: Package },
  update:   { label: 'Update',         color: 'border-accent/30 bg-accent/5 text-accent',         icon: RefreshCw },
  deletion: { label: 'Delete Request', color: 'border-destructive/30 bg-destructive/5 text-destructive', icon: Trash2 },
}

function Toast({ toasts }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-md shadow-lg border text-sm font-medium transition-all duration-300 bg-card ${
          t.type === 'success'
            ? 'border-[#2F5233]/30 text-[#2F5233]'
            : 'border-destructive/30 text-destructive'
        }`}>
          {t.type === 'success' ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
          {t.message}
        </div>
      ))}
    </div>
  )
}

export default function AdminProductApprovalPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()

  const [pendingProducts, setPendingProducts] = useState([])
  const [allProducts, setAllProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending') // 'pending' | 'all'
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [actionLoading, setActionLoading] = useState(null)
  const [rejectModal, setRejectModal] = useState(null) // product to reject
  const [rejectReason, setRejectReason] = useState('')
  const [toasts, setToasts] = useState([])
  const [expandedProduct, setExpandedProduct] = useState(null)

  const showToast = (message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }

  const loadPending = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/products/pending/')
      setPendingProducts(res.data?.results || [])
    } catch (e) {
      showToast('Failed to load pending products', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit: 20 }
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter
      const res = await api.get('/admin/products/', { params })
      setAllProducts(res.data?.results || [])
      setTotalCount(res.data?.count || 0)
      setTotalPages(res.data?.total_pages || 1)
    } catch (e) {
      showToast('Failed to load products', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])

  useEffect(() => {
    if (!isAuthenticated) { router.push('/sign-in'); return }
    if (user && user.role !== 'admin') { router.push('/'); return }
    if (activeTab === 'pending') loadPending()
    else loadAll()
  }, [isAuthenticated, user, router, activeTab, loadPending, loadAll])

  const handleApprove = async (productId) => {
    setActionLoading(productId + '-approve')
    try {
      await api.post(`/admin/products/${productId}/approve/`)
      showToast('Product approved successfully!')
      if (activeTab === 'pending') loadPending()
      else loadAll()
    } catch (e) {
      showToast(e?.response?.data?.error || 'Failed to approve product', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async () => {
    if (!rejectModal) return
    setActionLoading(rejectModal.id + '-reject')
    try {
      await api.post(`/admin/products/${rejectModal.id}/reject/`, { reason: rejectReason })
      showToast('Product rejected.')
      setRejectModal(null)
      setRejectReason('')
      if (activeTab === 'pending') loadPending()
      else loadAll()
    } catch (e) {
      showToast('Failed to reject product', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleConfirmDelete = async (productId) => {
    if (!window.confirm('Permanently delete this product? This cannot be undone.')) return
    setActionLoading(productId + '-delete')
    try {
      await api.post(`/admin/products/${productId}/confirm-delete/`)
      showToast('Product permanently deleted.')
      if (activeTab === 'pending') loadPending()
      else loadAll()
    } catch (e) {
      showToast(e?.response?.data?.error || 'Failed to delete product', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const products = activeTab === 'pending' ? pendingProducts : allProducts

  return (
    <div className="min-h-screen bg-background">
      <Toast toasts={toasts} />

      {/* Page Header */}
      <div className="border-b border-border bg-card px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-accent mb-1">Moderation</p>
            <h1 className="text-2xl font-display font-bold text-foreground">Product Approval</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Review and approve seller product submissions
            </p>
          </div>
          <button
            onClick={() => activeTab === 'pending' ? loadPending() : loadAll()}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-muted hover:bg-muted/70 border border-border text-sm text-foreground transition-all btn-press"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-md bg-muted border border-border w-fit">
          {[
            { id: 'pending', label: 'Pending Approval', count: pendingProducts.length },
            { id: 'all', label: 'All Products', count: totalCount },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setPage(1) }}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-md text-xs font-mono ${
                activeTab === tab.id ? 'bg-background/20' : 'bg-background border border-border'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Filters (for All Products tab) */}
        {activeTab === 'all' && (
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search products..."
                className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-md text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/50"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
              className="px-4 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent/50"
            >
              <option value="">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        )}

        {/* Products List */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4">
              <RefreshCw className="h-8 w-8 text-accent animate-spin" />
              <p className="text-muted-foreground text-sm font-mono uppercase tracking-[0.1em]">Loading products…</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-md border border-border bg-card flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-lg font-display font-semibold text-foreground">
              {activeTab === 'pending' ? 'No pending items' : 'No products found'}
            </h3>
            <p className="text-muted-foreground text-sm mt-1">
              {activeTab === 'pending' ? 'All products are up to date.' : 'Try adjusting your filters.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map(product => {
              const pendingType = product.pending_type || (
                product.approval_status === 'pending'
                  ? product.pending_deletion ? 'deletion' : product.pending_update_data ? 'update' : 'new'
                  : null
              )
              const typeConfig = pendingType ? STATUS_CONFIG[pendingType] : null
              const isExpanded = expandedProduct === product.id

              return (
                <div
                  key={product.id}
                  className="rounded-md border border-border bg-card overflow-hidden transition-all"
                >
                  <div className="p-5 flex items-start gap-4">
                    {/* Product Image */}
                    <div className="w-14 h-14 rounded-md overflow-hidden bg-muted flex-shrink-0 border border-border">
                      {product.featured_image ? (
                        <Image
                          src={product.featured_image}
                          alt={product.name}
                          width={56}
                          height={56}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <h3 className="font-display font-semibold text-foreground truncate">{product.name}</h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {product.category_name && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Tag className="h-3 w-3" />{product.category_name}
                              </span>
                            )}
                            {product.vendor_name && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Store className="h-3 w-3" />{product.vendor_name}
                              </span>
                            )}
                            <span className="text-xs font-mono font-semibold text-accent">
                              {parseInt(product.price || 0).toLocaleString()} FCFA
                            </span>
                          </div>
                        </div>

                        {/* Status badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {typeConfig && (
                            <span className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono uppercase tracking-[0.04em] border ${typeConfig.color}`}>
                              <typeConfig.icon className="h-3 w-3" />
                              {typeConfig.label}
                            </span>
                          )}
                          {activeTab === 'all' && (
                            <span className={`px-2.5 py-1 rounded-md text-xs font-mono uppercase tracking-[0.04em] border ${
                              product.approval_status === 'approved'
                                ? 'border-[#2F5233]/30 bg-[#2F5233]/5 text-[#2F5233]'
                                : product.approval_status === 'rejected'
                                ? 'border-destructive/30 bg-destructive/5 text-destructive'
                                : 'border-accent/30 bg-accent/5 text-accent'
                            }`}>
                              {product.approval_status}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Pending update diff preview */}
                      {product.pending_update_data && isExpanded && (
                        <div className="mt-3 p-3 rounded-md bg-accent/5 border border-accent/20">
                          <p className="text-xs font-mono uppercase tracking-[0.05em] text-accent mb-2">Proposed Changes</p>
                          <div className="space-y-1">
                            {Object.entries(product.pending_update_data).map(([key, val]) => (
                              <div key={key} className="flex gap-2 text-xs">
                                <span className="text-muted-foreground w-32 shrink-0 capitalize">{key.replace(/_/g, ' ')}</span>
                                <span className="text-foreground font-mono truncate">{String(val)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action bar */}
                  {(activeTab === 'pending' || product.approval_status === 'pending') && (
                    <div className="px-5 pb-4 flex items-center gap-2 flex-wrap border-t border-border pt-3">
                      {/* Expand to see details */}
                      <button
                        onClick={() => setExpandedProduct(isExpanded ? null : product.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted hover:bg-muted/70 text-xs text-muted-foreground transition-all border border-border"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        {isExpanded ? 'Less' : 'Details'}
                      </button>

                      {/* Approve */}
                      {!product.pending_deletion && (
                        <button
                          disabled={actionLoading === product.id + '-approve'}
                          onClick={() => handleApprove(product.id)}
                          className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-[#2F5233]/10 hover:bg-[#2F5233]/20 text-[#2F5233] text-xs font-medium border border-[#2F5233]/30 transition-all disabled:opacity-50"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          {actionLoading === product.id + '-approve' ? 'Approving…' : 'Approve'}
                        </button>
                      )}

                      {/* Reject */}
                      {!product.pending_deletion && (
                        <button
                          disabled={!!actionLoading}
                          onClick={() => { setRejectModal(product); setRejectReason('') }}
                          className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-destructive/5 hover:bg-destructive/10 text-destructive text-xs font-medium border border-destructive/30 transition-all disabled:opacity-50"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
                        </button>
                      )}

                      {/* Confirm deletion */}
                      {product.pending_deletion && (
                        <>
                          <div className="flex-1 text-xs text-destructive flex items-center gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Seller requested deletion of this product
                          </div>
                          <button
                            disabled={actionLoading === product.id + '-delete'}
                            onClick={() => handleConfirmDelete(product.id)}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-medium border border-destructive/40 transition-all disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {actionLoading === product.id + '-delete' ? 'Deleting…' : 'Confirm Delete'}
                          </button>
                          <button
                            disabled={!!actionLoading}
                            onClick={() => handleApprove(product.id)}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-muted hover:bg-muted/70 text-muted-foreground text-xs font-medium border border-border transition-all"
                          >
                            Keep Product
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination (All Products tab) */}
        {activeTab === 'all' && totalPages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-md bg-muted hover:bg-muted/70 disabled:opacity-30 border border-border transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-muted-foreground font-mono">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-md bg-muted hover:bg-muted/70 disabled:opacity-30 border border-border transition-all"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-md bg-card border border-border shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-destructive/10 border border-destructive/30 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-foreground">Reject Product</h3>
                <p className="text-xs text-muted-foreground truncate max-w-[260px]">{rejectModal.name}</p>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Reason for rejection (optional)</label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="e.g. Missing description, inappropriate content..."
                rows={3}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-destructive/40 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setRejectModal(null)}
                className="flex-1 py-2 rounded-md bg-muted hover:bg-muted/70 text-sm text-muted-foreground border border-border transition-all"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading === rejectModal.id + '-reject'}
                onClick={handleReject}
                className="flex-1 py-2 rounded-md bg-destructive/10 hover:bg-destructive/20 text-sm text-destructive font-medium border border-destructive/30 transition-all disabled:opacity-50"
              >
                {actionLoading === rejectModal.id + '-reject' ? 'Rejecting…' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
