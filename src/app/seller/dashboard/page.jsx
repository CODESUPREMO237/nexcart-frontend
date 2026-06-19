'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Store, Package, ShoppingBag, Wallet, TrendingUp, Star,
  AlertCircle, Plus, Edit, Trash2, Clock, CheckCircle,
  XCircle, Upload, X, Eye, MessageCircle, Send, Loader2, CreditCard, ArrowRight
} from 'lucide-react'
import api from '@/lib/api'
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

/* ── KYC Gate Banner ─────────────────────────────────────────────────── */
function KYCBanner({ kyc, router }) {
  if (!kyc || kyc.status === 'approved') return null

  if (kyc.status === 'not_submitted') {
    return (
      <div className="rounded-md border border-accent/30 bg-accent/5 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <CreditCard className="h-5 w-5 text-accent mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-foreground">Identity Verification Required</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                You must complete KYC verification before you can list products or access your seller features.
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/seller/kyc')}
            className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-md bg-foreground hover:bg-foreground/90 text-background text-sm font-medium transition-all btn-press"
          >
            Verify Now <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  if (kyc.status === 'pending') {
    return (
      <div className="rounded-md border border-accent/30 bg-accent/5 p-5">
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-accent mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-foreground">KYC Under Review</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Your identity documents are being reviewed. You will be able to list products once approved. This typically takes 1–2 business days.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (kyc.status === 'rejected') {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-destructive">KYC Rejected</p>
              <p className="text-sm text-destructive/70 mt-0.5">
                {kyc.rejection_reason || 'Your submission was rejected. Please resubmit with correct documents.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/seller/kyc')}
            className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-md bg-destructive hover:bg-destructive/90 text-destructive-foreground text-sm font-medium transition-all btn-press"
          >
            Resubmit <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  return null
}

/* ── Status badge helper ──────────────────────────────────────────────── */
function StatusBadge({ product }) {
  if (product.pending_deletion) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
        <Trash2 className="h-3 w-3" /> Deletion Pending
      </span>
    )
  }
  switch (product.approval_status) {
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-medium bg-accent/10 text-accent border border-accent/20">
          <Clock className="h-3 w-3" /> Pending Approval
        </span>
      )
    case 'approved':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-medium bg-chart-2/10 text-chart-2 border border-chart-2/20">
          <CheckCircle className="h-3 w-3" /> Approved
        </span>
      )
    case 'rejected':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
          <XCircle className="h-3 w-3" /> Rejected
        </span>
      )
    default:
      return null
  }
}

/* ── Toast ────────────────────────────────────────────────────────────── */
function Toast({ toasts }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-md shadow-2xl border bg-card text-sm font-medium transition-all ${
          t.type === 'success' ? 'border-chart-2/30 text-chart-2' : 'border-destructive/30 text-destructive'
        }`}>
          {t.type === 'success' ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          {t.message}
        </div>
      ))}
    </div>
  )
}

/* ── Product Form Modal ────────────────────────────────────────────────── */
function ProductFormModal({ vendor, editProduct, categories, onClose, onSaved }) {
  const isEdit = !!editProduct
  const fileRef = useRef(null)
  const [form, setForm] = useState({
    name: editProduct?.name || '',
    description: editProduct?.description || '',
    price: editProduct?.price || '',
    compare_price: editProduct?.compare_price || '',
    stock_quantity: editProduct?.stock_quantity || '',
    category: editProduct?.category?.id || editProduct?.category || '',
    tags: editProduct?.tags || '',
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(editProduct?.featured_image || null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleImage = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Product name is required'); return }
    if (!form.price || isNaN(form.price)) { setError('Valid price is required'); return }
    setSaving(true)
    setError('')
    try {
      if (isEdit) {
        const payload = { ...form }
        await api.patch(`/vendor/products/${editProduct.id}/`, payload)
        onSaved('Product update submitted for admin approval.')
      } else {
        const fd = new FormData()
        Object.entries(form).forEach(([k, v]) => v !== '' && fd.append(k, v))
        if (imageFile) fd.append('featured_image', imageFile)
        await api.post('/vendor/products/', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        onSaved('Product submitted for admin approval!')
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  const inputClass = "w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 transition-colors"
  const labelClass = "text-xs text-muted-foreground mb-1.5 block"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-md bg-card border border-border shadow-2xl overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-display font-semibold text-foreground">{isEdit ? 'Edit Product' : 'Add New Product'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="px-4 py-3 rounded-md bg-destructive/5 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          {!isEdit && (
            <div>
              <label className={labelClass}>Product Image</label>
              <div
                onClick={() => fileRef.current?.click()}
                className="relative w-full h-32 rounded-md bg-muted/40 border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-accent/50 transition-colors overflow-hidden"
              >
                {imagePreview ? (
                  <Image src={imagePreview} alt="preview" fill className="object-cover" unoptimized />
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Click to upload image</span>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
            </div>
          )}

          <div>
            <label className={labelClass}>Product Name *</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Samsung Galaxy A54"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Description *</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="Describe your product..."
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Price (FCFA) *</label>
              <input
                type="number" min="0"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder="5000"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Compare Price (FCFA)</label>
              <input
                type="number" min="0"
                value={form.compare_price}
                onChange={e => setForm(f => ({ ...f, compare_price: e.target.value }))}
                placeholder="7000"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Stock Quantity *</label>
              <input
                type="number" min="0"
                value={form.stock_quantity}
                onChange={e => setForm(f => ({ ...f, stock_quantity: e.target.value }))}
                placeholder="10"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Category</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className={inputClass}
              >
                <option value="">Select...</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Tags (comma-separated)</label>
            <input
              value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              placeholder="tech, smartphone, android"
              className={inputClass}
            />
          </div>

          {isEdit && (
            <div className="px-4 py-3 rounded-md bg-accent/5 border border-accent/20 text-xs text-accent">
              Changes will require admin approval before going live.
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-md bg-muted hover:bg-muted/70 text-sm text-foreground border border-border transition-all btn-press"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-md bg-foreground hover:bg-foreground/90 text-sm text-background font-medium transition-all disabled:opacity-50 btn-press"
            >
              {saving ? 'Submitting...' : isEdit ? 'Submit Update' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Main Seller Dashboard ────────────────────────────────────────────── */
export default function SellerDashboardPage() {
  const router = useRouter()
  const [vendor, setVendor] = useState(null)
  const [kyc, setKyc] = useState(null)
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [orders, setOrders] = useState([])
  const [conversations, setConversations] = useState([])
  const [activeConv, setActiveConv] = useState(null)
  const [convMessages, setConvMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const messagesEndRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [toasts, setToasts] = useState([])
  const [actionLoading, setActionLoading] = useState(null)
  const [productToDelete, setProductToDelete] = useState(null)

  const kycApproved = kyc?.status === 'approved'

  const showToast = (message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }

  const loadDashboard = async () => {
    try {
      const [vRes, pRes, oRes, cRes, convRes, kycRes] = await Promise.allSettled([
        api.get('/vendor/dashboard/'),
        api.get('/vendor/products/'),
        api.get('/vendor/orders/'),
        api.get('/categories/'),
        api.get('/chat/conversations/'),
        api.get('/users/seller/kyc/'),
      ])
      if (vRes.status === 'fulfilled') setVendor(vRes.value.data)
      if (pRes.status === 'fulfilled') setProducts(pRes.value.data?.results || [])
      if (oRes.status === 'fulfilled') setOrders(oRes.value.data?.results || [])
      if (cRes.status === 'fulfilled') setCategories(cRes.value.data?.results || cRes.value.data || [])
      if (convRes.status === 'fulfilled') setConversations(convRes.value.data?.results || convRes.value.data || [])
      if (kycRes.status === 'fulfilled') setKyc(kycRes.value.data)
      else setKyc({ status: 'not_submitted' })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const loadConvMessages = async (convId) => {
    try {
      const res = await api.get(`/chat/conversations/${convId}/messages/`)
      setConvMessages(res.data?.results || res.data || [])
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (e) {
      console.error(e)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConv) return
    setSendingMessage(true)
    try {
      const res = await api.post('/chat/send/', {
        conversation_id: activeConv.id,
        content: newMessage.trim()
      })
      setConvMessages(prev => [...prev, res.data])
      setNewMessage('')
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (e) {
      showToast('Failed to send message', 'error')
    } finally {
      setSendingMessage(false)
    }
  }

  useEffect(() => { loadDashboard() }, [])

  useEffect(() => {
    if (activeConv) loadConvMessages(activeConv.id)
  }, [activeConv])

  const handleDelete = async () => {
    if (!productToDelete) return
    setActionLoading(productToDelete)
    try {
      await api.delete(`/vendor/products/${productToDelete}/`)
      showToast('Deletion request submitted. Awaiting admin confirmation.')
      setProductToDelete(null)
      loadDashboard()
    } catch (e) {
      showToast(e?.response?.data?.error || 'Failed to request deletion', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleFormSaved = (msg) => {
    setShowForm(false)
    setEditProduct(null)
    showToast(msg)
    loadDashboard()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm font-mono uppercase tracking-[0.1em]">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-md border border-accent/30 bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-accent" />
          </div>
          <h1 className="font-display font-bold text-xl text-foreground mb-2">Not Registered as a Seller</h1>
          <p className="text-muted-foreground text-sm mb-6">Register your store to start selling on NexCart.</p>
          <a
            href="/seller/register"
            className="inline-flex items-center gap-2 px-6 py-3 bg-foreground hover:bg-foreground/90 text-background rounded-md font-medium text-sm transition-all btn-press"
          >
            <Store className="h-4 w-4" /> Register Your Store
          </a>
        </div>
      </div>
    )
  }

  const stats = [
    { label: 'Total Sales', value: `${parseInt(vendor.total_sales || 0).toLocaleString()} FCFA`, icon: TrendingUp, color: 'text-chart-2' },
    { label: 'Products', value: products.length, icon: Package, color: 'text-accent' },
    { label: 'Orders', value: orders.length, icon: ShoppingBag, color: 'text-chart-3' },
    { label: 'Rating', value: vendor.average_rating ? `${vendor.average_rating} / 5` : 'N/A', icon: Star, color: 'text-yellow-500' },
  ]

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'products', label: `Products (${products.length})` },
    { id: 'orders', label: 'Orders' },
    { id: 'messages', label: `Messages${conversations.length > 0 ? ` (${conversations.length})` : ''}` },
    { id: 'payouts', label: 'Payouts' },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toast toasts={toasts} />

      {showForm && kycApproved && (
        <ProductFormModal
          vendor={vendor}
          editProduct={editProduct}
          categories={categories}
          onClose={() => { setShowForm(false); setEditProduct(null) }}
          onSaved={handleFormSaved}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* Store Approval Gate Banner */}
        {vendor.status === 'pending' && (
          <div className="rounded-md border border-accent/30 bg-accent/5 p-5">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-accent mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-foreground">Store Under Review</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Your store registration is being reviewed by an admin. You&apos;ll be able to list products once your store is approved. This typically takes 1–2 business days.
                </p>
              </div>
            </div>
          </div>
        )}

        {vendor.status === 'rejected' && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-5">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-destructive">Store Registration Rejected</p>
                <p className="text-sm text-destructive/70 mt-0.5">
                  Your store registration was rejected by an admin. Please contact support for more details.
                </p>
              </div>
            </div>
          </div>
        )}

        {vendor.status === 'suspended' && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-destructive">Store Suspended</p>
                <p className="text-sm text-destructive/70 mt-0.5">
                  Your store has been suspended by an admin. Please contact support for more details.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* KYC Gate Banner */}
        <KYCBanner kyc={kyc} router={router} />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <h1 className="font-display font-bold text-2xl text-foreground flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-foreground flex items-center justify-center shrink-0">
                <Store className="h-4 w-4 text-background" />
              </div>
              {vendor.store_name}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-medium border ${
                vendor.status === 'approved'
                  ? 'bg-chart-2/10 text-chart-2 border-chart-2/20'
                  : vendor.status === 'pending'
                  ? 'bg-accent/10 text-accent border-accent/20'
                  : 'bg-destructive/10 text-destructive border-destructive/20'
              }`}>
                {vendor.status === 'approved' ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                {vendor.status === 'approved' ? 'Approved Store' : vendor.status}
              </span>
              {vendor.is_verified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-medium bg-muted text-foreground border border-border">
                  KYC Verified
                </span>
              )}
            </div>
          </div>

          {activeTab === 'products' && vendor.status === 'approved' && kycApproved && (
            <button
              onClick={() => { setEditProduct(null); setShowForm(true) }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-foreground hover:bg-foreground/90 text-background text-sm font-medium transition-all btn-press"
            >
              <Plus className="h-4 w-4" /> Add Product
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(stat => (
            <div key={stat.label} className="rounded-md border border-border bg-card p-5 hover:border-accent/30 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-xs font-mono uppercase tracking-[0.08em] text-muted-foreground">{stat.label}</span>
              </div>
              <p className="font-display text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border pb-0 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-accent text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Overview ──────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-md border border-border bg-card p-5">
              <h3 className="font-display font-semibold text-foreground mb-4">Store Details</h3>
              <dl className="space-y-3 text-sm">
                {[
                  ['City', vendor.city],
                  ['Region', vendor.region],
                  ['Phone', vendor.phone],
                  ['MoMo', `${vendor.momo_provider} – ${vendor.momo_number}`],
                  ['Commission', `${vendor.commission_rate}%`],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="text-foreground font-medium font-mono">{val}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="rounded-md border border-border bg-card p-5">
              <h3 className="font-display font-semibold text-foreground mb-4">Recent Orders</h3>
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No orders yet</p>
              ) : (
                <div className="space-y-2">
                  {orders.slice(0, 5).map(order => (
                    <div key={order.id} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm font-medium text-foreground">{order.order_number}</p>
                        <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className="text-sm font-semibold text-foreground font-mono">
                        {parseInt(order.total || 0).toLocaleString()} FCFA
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Products ──────────────────────────────────────────── */}
        {activeTab === 'products' && (
          <div className="space-y-3">
            {!kycApproved || vendor.status !== 'approved' ? (
              <div className="rounded-md border border-border bg-card p-12 text-center">
                {kyc?.status === 'pending' || kyc?.status === 'under_review' || vendor?.status === 'pending' ? (
                  <>
                    <Clock className="h-10 w-10 text-accent/50 mx-auto mb-3" />
                    <p className="text-foreground font-medium mb-1">Approval Pending</p>
                    <p className="text-muted-foreground text-sm">You must wait for your store and KYC to be approved before listing products.</p>
                  </>
                ) : !kycApproved && kyc?.status !== 'pending' && kyc?.status !== 'under_review' ? (
                  <>
                    <CreditCard className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-foreground font-medium mb-1">KYC Verification Required</p>
                    <p className="text-muted-foreground text-sm mb-5">You need to verify your identity before you can list products.</p>
                    <button
                      onClick={() => router.push('/seller/kyc')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-foreground hover:bg-foreground/90 text-background text-sm font-medium transition-all btn-press"
                    >
                      <CreditCard className="h-4 w-4" /> Complete KYC
                    </button>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-10 w-10 text-destructive/50 mx-auto mb-3" />
                    <p className="text-foreground font-medium mb-1">Action Required</p>
                    <p className="text-muted-foreground text-sm">Please check your store and KYC status at the top of the page.</p>
                  </>
                )}
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-md border border-border bg-card p-12 text-center">
                <Package className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-foreground font-medium mb-1">No products yet</p>
                <p className="text-muted-foreground text-sm mb-5">Click &quot;Add Product&quot; to create your first listing.</p>
                <button
                  onClick={() => { setEditProduct(null); setShowForm(true) }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-foreground hover:bg-foreground/90 text-background text-sm font-medium transition-all btn-press"
                >
                  <Plus className="h-4 w-4" /> Add Product
                </button>
              </div>
            ) : (
              products.map(p => (
                <div key={p.id} className="rounded-md border border-border bg-card p-4 flex items-center gap-4 hover:border-accent/30 transition-all">
                  <div className="w-14 h-14 rounded-md overflow-hidden bg-muted flex-shrink-0 border border-border">
                    {p.featured_image ? (
                      <Image src={p.featured_image} alt={p.name} width={56} height={56} className="w-full h-full object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-5 w-5 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{p.name}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-sm text-foreground font-semibold font-mono">
                        {parseInt(p.price || 0).toLocaleString()} FCFA
                      </span>
                      <span className={`text-xs ${p.is_in_stock ? 'text-chart-2' : 'text-destructive'}`}>
                        {p.is_in_stock ? 'In Stock' : 'Out of Stock'}
                      </span>
                      <StatusBadge product={p} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`/products/${p.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-all border border-border"
                    >
                      <Eye className="h-4 w-4" />
                    </a>
                    <button
                      disabled={p.pending_deletion || p.approval_status === 'pending'}
                      onClick={() => { setEditProduct(p); setShowForm(true) }}
                      className="p-2 rounded-md hover:bg-accent/10 text-muted-foreground hover:text-accent transition-all border border-border disabled:opacity-30"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      disabled={p.pending_deletion || actionLoading === p.id}
                      onClick={() => setProductToDelete(p.id)}
                      className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all border border-border disabled:opacity-30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Orders ────────────────────────────────────────────── */}
        {activeTab === 'orders' && (
          <div className="rounded-md border border-border bg-card overflow-hidden">
            {orders.length === 0 ? (
              <div className="p-12 text-center">
                <ShoppingBag className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground">No orders yet</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-5 py-3 text-xs font-mono uppercase tracking-[0.08em] text-muted-foreground font-medium">Order</th>
                    <th className="text-left px-5 py-3 text-xs font-mono uppercase tracking-[0.08em] text-muted-foreground font-medium">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-mono uppercase tracking-[0.08em] text-muted-foreground font-medium">Total</th>
                    <th className="text-left px-5 py-3 text-xs font-mono uppercase tracking-[0.08em] text-muted-foreground font-medium hidden sm:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} className="border-t border-border hover:bg-muted/40">
                      <td className="px-5 py-3 font-medium text-foreground">{o.order_number}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-sm text-xs font-medium ${
                          o.status === 'delivered' ? 'bg-chart-2/10 text-chart-2'
                          : o.status === 'shipped' ? 'bg-accent/10 text-accent'
                          : 'bg-muted text-muted-foreground'
                        }`}>{o.status}</span>
                      </td>
                      <td className="px-5 py-3 text-foreground font-semibold font-mono">
                        {parseInt(o.total || 0).toLocaleString()} FCFA
                      </td>
                      <td className="px-5 py-3 text-muted-foreground hidden sm:table-cell">
                        {new Date(o.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Messages ──────────────────────────────────────────── */}
        {activeTab === 'messages' && (
          <div className="rounded-md border border-border bg-card overflow-hidden flex" style={{ minHeight: '420px' }}>
            <div className={`w-full sm:w-64 border-r border-border flex flex-col ${activeConv ? 'hidden sm:flex' : 'flex'}`}>
              <div className="px-4 py-3 border-b border-border">
                <p className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">Conversations</p>
              </div>
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <MessageCircle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No messages yet</p>
                  </div>
                ) : (
                  conversations.map(conv => (
                    <button
                      key={conv.id}
                      onClick={() => setActiveConv(conv)}
                      className={`w-full px-4 py-3 text-left border-b border-border hover:bg-muted/40 transition-colors ${
                        activeConv?.id === conv.id ? 'bg-accent/5 border-l-2 border-l-accent' : ''
                      }`}
                    >
                      <p className="text-sm font-medium text-foreground truncate">
                        {conv.buyer_name || conv.buyer_email || 'Buyer'}
                      </p>
                      {conv.product_name && (
                        <p className="text-xs text-accent truncate mt-0.5">Re: {conv.product_name}</p>
                      )}
                      {conv.last_message && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.last_message.content}</p>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className={`flex-1 flex flex-col ${activeConv ? 'flex' : 'hidden sm:flex'}`}>
              {activeConv ? (
                <>
                  <div className="px-4 py-3 border-b border-border flex items-center gap-3">
                    <button onClick={() => setActiveConv(null)} className="sm:hidden text-muted-foreground hover:text-foreground">←</button>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{activeConv.buyer_name || activeConv.buyer_email || 'Buyer'}</p>
                      {activeConv.product_name && <p className="text-xs text-muted-foreground">About: {activeConv.product_name}</p>}
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {convMessages.map(msg => {
                      const isMine = msg.sender_email === vendor?.user_email || msg.is_mine
                      return (
                        <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] rounded-md px-4 py-2 text-sm ${isMine ? 'bg-foreground text-background' : 'bg-muted text-foreground'}`}>
                            {!isMine && <p className="text-[10px] font-medium mb-0.5 text-muted-foreground">{msg.sender_name || 'Buyer'}</p>}
                            <p>{msg.content}</p>
                            <p className="text-[10px] mt-1 opacity-60">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="p-3 border-t border-border">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type a reply..."
                        className="flex-1 px-4 py-2 bg-background border border-border rounded-md text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={sendingMessage || !newMessage.trim()}
                        className="p-2.5 rounded-md bg-foreground hover:bg-foreground/90 disabled:opacity-50 transition-all btn-press"
                      >
                        {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin text-background" /> : <Send className="h-4 w-4 text-background" />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Select a conversation</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Payouts ───────────────────────────────────────────── */}
        {activeTab === 'payouts' && (
          <div className="rounded-md border border-border bg-card p-8 text-center">
            <div className="w-14 h-14 rounded-md border border-accent/30 bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <Wallet className="h-7 w-7 text-accent" />
            </div>
            <h3 className="font-display font-semibold text-foreground text-lg">Your Earnings</h3>
            <p className="font-display text-4xl font-bold text-foreground mt-4 mb-1">
              {parseInt((vendor.total_sales || 0) * (1 - (vendor.commission_rate || 0) / 100)).toLocaleString()} FCFA
            </p>
            <p className="text-xs text-muted-foreground mb-6">After {vendor.commission_rate}% platform commission</p>
            <p className="text-sm text-muted-foreground">
              Payouts are sent to <span className="text-foreground font-medium">{vendor.momo_provider} {vendor.momo_number}</span>
            </p>
          </div>
        )}
      </div>

      <Dialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to request deletion for this product? An admin must confirm before the product is permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setProductToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={actionLoading === productToDelete}>
              {actionLoading === productToDelete ? 'Requesting...' : 'Request Deletion'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
