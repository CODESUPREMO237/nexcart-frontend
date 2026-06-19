'use client'

import { useState, useEffect } from 'react'
import {
  Store, CheckCircle, XCircle, Clock, Ban, Search, Eye,
  MapPin, Phone, Mail, Wallet, Calendar, Loader2, AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import api from '@/lib/api'

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: 'border-accent/30 bg-accent/5 text-accent',                 icon: Clock },
  approved:  { label: 'Approved',  color: 'border-[#2F5233]/30 bg-[#2F5233]/5 text-[#2F5233]',         icon: CheckCircle },
  rejected:  { label: 'Rejected',  color: 'border-destructive/30 bg-destructive/5 text-destructive',   icon: XCircle },
  suspended: { label: 'Suspended', color: 'border-border bg-muted text-muted-foreground',              icon: Ban },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-mono uppercase tracking-[0.05em] ${cfg.color}`}>
      <Icon className="h-3.5 w-3.5" />
      {cfg.label}
    </span>
  )
}

export default function AdminStoresPage() {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedVendor, setSelectedVendor] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null) // { vendorId, action, storeName }

  useEffect(() => {
    loadVendors()
  }, [])

  const loadVendors = async () => {
    try {
      const res = await api.get('/admin/vendors/')
      setVendors(res.data?.results || res.data || [])
    } catch (e) {
      console.error('Failed to load vendors:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async () => {
    if (!confirmAction) return
    const { vendorId, action } = confirmAction
    setActionLoading(vendorId)
    try {
      await api.post(`/admin/vendors/${vendorId}/${action}/`)
      await loadVendors()
      setConfirmAction(null)
      setSelectedVendor(null)
    } catch (e) {
      console.error(`Failed to ${action} vendor:`, e)
    } finally {
      setActionLoading(null)
    }
  }

  const filteredVendors = vendors
    .filter(v => filter === 'all' || v.status === filter)
    .filter(v => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        v.store_name?.toLowerCase().includes(q) ||
        v.user_email?.toLowerCase().includes(q) ||
        v.city?.toLowerCase().includes(q)
      )
    })

  const counts = {
    all: vendors.length,
    pending: vendors.filter(v => v.status === 'pending').length,
    approved: vendors.filter(v => v.status === 'approved').length,
    rejected: vendors.filter(v => v.status === 'rejected').length,
    suspended: vendors.filter(v => v.status === 'suspended').length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="h-9 w-9 animate-spin text-accent mx-auto mb-3" />
          <p className="text-muted-foreground font-mono text-sm uppercase tracking-[0.08em]">Loading seller stores…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-accent mb-1">Marketplace</p>
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-3">
          <Store className="h-6 w-6 text-accent" />
          Seller Stores
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Review and manage seller store registrations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { key: 'all',       label: 'Total' },
          { key: 'pending',   label: 'Pending' },
          { key: 'approved',  label: 'Approved' },
          { key: 'rejected',  label: 'Rejected' },
          { key: 'suspended', label: 'Suspended' },
        ].map(s => (
          <button
            key={s.key}
            onClick={() => setFilter(s.key)}
            className={`rounded-md border p-4 text-left transition-all bg-card ${
              filter === s.key ? 'border-accent ring-1 ring-accent/40' : 'border-border hover:border-accent/40'
            }`}
          >
            <p className="text-2xl font-display font-bold text-foreground">{counts[s.key]}</p>
            <p className="text-xs font-mono uppercase tracking-[0.06em] text-muted-foreground mt-0.5">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by store name, email, or city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 rounded-md"
          />
        </div>
      </div>

      {/* Table */}
      {filteredVendors.length === 0 ? (
        <div className="rounded-md border border-border bg-card p-12 text-center">
          <Store className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-medium">No stores found</p>
          <p className="text-muted-foreground text-sm mt-1">
            {filter !== 'all' ? `No ${filter} stores. Try changing the filter.` : 'No seller stores have been registered yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-md border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-6 py-3 text-xs font-mono uppercase tracking-[0.05em] text-muted-foreground">Store</th>
                  <th className="text-left px-6 py-3 text-xs font-mono uppercase tracking-[0.05em] text-muted-foreground">Owner</th>
                  <th className="text-left px-6 py-3 text-xs font-mono uppercase tracking-[0.05em] text-muted-foreground">Location</th>
                  <th className="text-left px-6 py-3 text-xs font-mono uppercase tracking-[0.05em] text-muted-foreground">Payment</th>
                  <th className="text-left px-6 py-3 text-xs font-mono uppercase tracking-[0.05em] text-muted-foreground">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-mono uppercase tracking-[0.05em] text-muted-foreground">Registered</th>
                  <th className="text-right px-6 py-3 text-xs font-mono uppercase tracking-[0.05em] text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredVendors.map(vendor => (
                  <tr key={vendor.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-md border border-border bg-muted flex items-center justify-center text-foreground font-display font-bold text-sm shrink-0">
                          {vendor.store_name?.charAt(0)?.toUpperCase() || 'S'}
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">{vendor.store_name}</p>
                          {vendor.description && (
                            <p className="text-xs text-muted-foreground max-w-[200px] truncate">{vendor.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-muted-foreground">{vendor.user_email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {vendor.city}, {vendor.region}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-muted-foreground font-mono">{vendor.momo_provider} {vendor.momo_number}</p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={vendor.status} />
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-muted-foreground">
                        {new Date(vendor.created_at).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedVendor(vendor)}
                          className="text-xs rounded-md"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View
                        </Button>
                        {vendor.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => setConfirmAction({ vendorId: vendor.id, action: 'approve', storeName: vendor.store_name })}
                              className="text-xs rounded-md bg-[#2F5233] hover:bg-[#2F5233]/90 text-white"
                            >
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setConfirmAction({ vendorId: vendor.id, action: 'reject', storeName: vendor.store_name })}
                              className="text-xs rounded-md"
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        {vendor.status === 'approved' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setConfirmAction({ vendorId: vendor.id, action: 'suspend', storeName: vendor.store_name })}
                            className="text-xs rounded-md text-accent border-accent/30 hover:bg-accent/5"
                          >
                            <Ban className="h-3.5 w-3.5 mr-1" />
                            Suspend
                          </Button>
                        )}
                        {(vendor.status === 'rejected' || vendor.status === 'suspended') && (
                          <Button
                            size="sm"
                            onClick={() => setConfirmAction({ vendorId: vendor.id, action: 'approve', storeName: vendor.store_name })}
                            className="text-xs rounded-md bg-[#2F5233] hover:bg-[#2F5233]/90 text-white"
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            Re-approve
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={!!selectedVendor} onOpenChange={(open) => !open && setSelectedVendor(null)}>
        <DialogContent className="sm:max-w-[550px] rounded-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display">
              <Store className="h-5 w-5 text-accent" />
              {selectedVendor?.store_name}
            </DialogTitle>
            <DialogDescription>Store registration details</DialogDescription>
          </DialogHeader>

          {selectedVendor && (
            <div className="space-y-4 mt-2">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <StatusBadge status={selectedVendor.status} />
              </div>

              {/* Description */}
              {selectedVendor.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="text-sm text-foreground bg-muted/30 border border-border rounded-md p-3">{selectedVendor.description}</p>
                </div>
              )}

              {/* Contact */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{selectedVendor.user_email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{selectedVendor.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{selectedVendor.city}, {selectedVendor.region}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{selectedVendor.momo_provider} {selectedVendor.momo_number}</span>
                </div>
              </div>

              {/* Business Info */}
              <div className="grid grid-cols-3 gap-3 bg-muted/30 border border-border rounded-md p-3">
                <div className="text-center">
                  <p className="text-lg font-display font-bold text-foreground">{selectedVendor.total_products || 0}</p>
                  <p className="text-xs text-muted-foreground">Products</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-display font-bold text-foreground font-mono">{parseInt(selectedVendor.total_sales || 0).toLocaleString()} FCFA</p>
                  <p className="text-xs text-muted-foreground">Total Sales</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-display font-bold text-foreground">{selectedVendor.commission_rate}%</p>
                  <p className="text-xs text-muted-foreground">Commission</p>
                </div>
              </div>

              {/* Timestamps */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                Registered: {new Date(selectedVendor.created_at).toLocaleString()}
                {selectedVendor.approved_at && (
                  <> · Approved: {new Date(selectedVendor.approved_at).toLocaleString()}</>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" className="rounded-md" onClick={() => setSelectedVendor(null)}>Close</Button>
            {selectedVendor?.status === 'pending' && (
              <>
                <Button
                  className="rounded-md bg-[#2F5233] hover:bg-[#2F5233]/90 text-white"
                  onClick={() => setConfirmAction({ vendorId: selectedVendor.id, action: 'approve', storeName: selectedVendor.store_name })}
                >
                  <CheckCircle className="h-4 w-4 mr-1" /> Approve
                </Button>
                <Button
                  variant="destructive"
                  className="rounded-md"
                  onClick={() => setConfirmAction({ vendorId: selectedVendor.id, action: 'reject', storeName: selectedVendor.store_name })}
                >
                  <XCircle className="h-4 w-4 mr-1" /> Reject
                </Button>
              </>
            )}
            {selectedVendor?.status === 'approved' && (
              <Button
                variant="outline"
                className="rounded-md text-accent border-accent/30 hover:bg-accent/5"
                onClick={() => setConfirmAction({ vendorId: selectedVendor.id, action: 'suspend', storeName: selectedVendor.store_name })}
              >
                <Ban className="h-4 w-4 mr-1" /> Suspend
              </Button>
            )}
            {(selectedVendor?.status === 'rejected' || selectedVendor?.status === 'suspended') && (
              <Button
                className="rounded-md bg-[#2F5233] hover:bg-[#2F5233]/90 text-white"
                onClick={() => setConfirmAction({ vendorId: selectedVendor.id, action: 'approve', storeName: selectedVendor.store_name })}
              >
                <CheckCircle className="h-4 w-4 mr-1" /> Re-approve
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Action Modal */}
      <Dialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent className="sm:max-w-[400px] rounded-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display">
              <AlertTriangle className="h-5 w-5 text-accent" />
              Confirm {confirmAction?.action === 'approve' ? 'Approval' : confirmAction?.action === 'reject' ? 'Rejection' : 'Suspension'}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.action === 'approve' && (
                <>Are you sure you want to approve <strong>{confirmAction?.storeName}</strong>? The owner will be promoted to seller and can start listing products.</>
              )}
              {confirmAction?.action === 'reject' && (
                <>Are you sure you want to reject <strong>{confirmAction?.storeName}</strong>? The owner will be demoted to regular user.</>
              )}
              {confirmAction?.action === 'suspend' && (
                <>Are you sure you want to suspend <strong>{confirmAction?.storeName}</strong>? Their products will no longer be visible and the owner will be demoted.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" className="rounded-md" onClick={() => setConfirmAction(null)}>Cancel</Button>
            <Button
              onClick={handleAction}
              disabled={!!actionLoading}
              className={`rounded-md text-white ${
                confirmAction?.action === 'approve' ? 'bg-[#2F5233] hover:bg-[#2F5233]/90' :
                confirmAction?.action === 'reject' ? 'bg-destructive hover:bg-destructive/90' :
                'bg-accent hover:bg-accent/90'
              }`}
            >
              {actionLoading ? (
                <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Processing...</>
              ) : (
                <>
                  {confirmAction?.action === 'approve' && <><CheckCircle className="h-4 w-4 mr-1" /> Approve</>}
                  {confirmAction?.action === 'reject' && <><XCircle className="h-4 w-4 mr-1" /> Reject</>}
                  {confirmAction?.action === 'suspend' && <><Ban className="h-4 w-4 mr-1" /> Suspend</>}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
