'use client'
// Location: app/admin/kyc/page.jsx
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  CheckCircle, XCircle, Eye, AlertCircle, Loader2,
  CreditCard, User, Mail, Calendar, ZoomIn
} from 'lucide-react'
import { api } from '@/lib/api'
import useAuthStore from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'

/* ── helpers ──────────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const map = {
    pending:  { label: 'Pending',  cls: 'border-accent/30 bg-accent/5 text-accent' },
    approved: { label: 'Approved', cls: 'border-[#2F5233]/30 bg-[#2F5233]/5 text-[#2F5233]' },
    rejected: { label: 'Rejected', cls: 'border-destructive/30 bg-destructive/5 text-destructive' },
  }
  const { label, cls } = map[status] || { label: status, cls: 'border-border bg-muted text-muted-foreground' }
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-md border text-[11px] font-mono uppercase tracking-[0.05em] ${cls}`}>{label}</span>
}

function DocImage({ src, label }) {
  const [zoomed, setZoomed] = useState(false)
  if (!src) return (
    <div className="h-32 rounded-md bg-muted flex items-center justify-center text-muted-foreground text-xs border border-border">
      No image
    </div>
  )
  return (
    <>
      <div
        className="relative h-32 rounded-md overflow-hidden border border-border cursor-pointer group"
        onClick={() => setZoomed(true)}
      >
        <Image src={src} alt={label} fill className="object-cover" unoptimized />
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-all flex items-center justify-center">
          <ZoomIn className="h-5 w-5 text-background opacity-0 group-hover:opacity-100 transition-all" />
        </div>
      </div>
      {zoomed && (
        <div
          className="fixed inset-0 z-[100] bg-foreground/90 flex items-center justify-center p-4"
          onClick={() => setZoomed(false)}
        >
          <div className="relative max-w-3xl w-full max-h-[90vh]">
            <Image src={src} alt={label} width={900} height={600} className="object-contain w-full h-auto max-h-[85vh] rounded-md" unoptimized />
            <p className="text-center text-background/60 text-sm mt-2">{label} — click anywhere to close</p>
          </div>
        </div>
      )}
    </>
  )
}

/* ── Main ─────────────────────────────────────────────────────────────── */
export default function AdminKYCPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()

  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [search, setSearch] = useState('')

  // Review dialog
  const [selected, setSelected] = useState(null)  // KYC record being reviewed
  const [action, setAction] = useState('')         // 'approve' | 'reject'
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [dialogError, setDialogError] = useState('')

  // Full detail view dialog
  const [detailKyc, setDetailKyc] = useState(null)

  const fetchKyc = useCallback(async () => {
    setLoading(true)
    try {
      const params = statusFilter ? `?status=${statusFilter}` : ''
      const res = await api.client.get(`/users/admin/kyc/${params}`)
      setSubmissions(res.data?.results || res.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return }
    if (user && user.role !== 'admin') { router.push('/'); return }
    fetchKyc()
  }, [isAuthenticated, user, router, fetchKyc])

  const openReview = (kyc, act) => {
    setSelected(kyc)
    setAction(act)
    setReason('')
    setDialogError('')
  }

  const handleReview = async () => {
    if (action === 'reject' && !reason.trim()) {
      setDialogError('Please provide a rejection reason.')
      return
    }
    setSubmitting(true)
    setDialogError('')
    try {
      await api.client.post(`/users/admin/kyc/${selected.id}/review/`, {
        action,
        reason: action === 'reject' ? reason.trim() : '',
      })
      setSelected(null)
      fetchKyc()
    } catch (e) {
      setDialogError(e?.response?.data?.error || 'Failed to submit review.')
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = submissions.filter(k =>
    k.user_email?.toLowerCase().includes(search.toLowerCase()) ||
    k.user_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-accent mb-1">Verification</p>
        <h1 className="text-3xl font-display font-bold text-foreground">KYC Verification</h1>
        <p className="text-muted-foreground text-sm mt-1">Review seller identity submissions.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            className="pl-10 rounded-md"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {['', 'pending', 'approved', 'rejected'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-md text-sm font-medium border transition-all ${
                statusFilter === s
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-card text-muted-foreground border-border hover:border-accent/50'
              }`}
            >
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No KYC submissions found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(kyc => (
            <div key={kyc.id} className="bg-card rounded-md border border-border p-5 hover:border-accent/40 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* User info */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md border border-border bg-muted flex items-center justify-center text-foreground font-display font-semibold text-sm shrink-0">
                    {(kyc.user_name || kyc.user_email || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{kyc.user_name || 'Unnamed'}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {kyc.user_email}
                    </p>
                  </div>
                </div>

                {/* Status & dates */}
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={kyc.status} />
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Submitted {new Date(kyc.submitted_at).toLocaleDateString()}
                  </span>
                  {kyc.reviewed_at && (
                    <span className="text-xs text-muted-foreground">
                      Reviewed {new Date(kyc.reviewed_at).toLocaleDateString()}
                      {kyc.reviewed_by_email && ` by ${kyc.reviewed_by_email}`}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 rounded-md"
                    onClick={() => setDetailKyc(kyc)}
                  >
                    <Eye className="h-4 w-4" /> View Docs
                  </Button>
                  {kyc.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        className="gap-1.5 rounded-md bg-[#2F5233] hover:bg-[#2F5233]/90 text-white"
                        onClick={() => openReview(kyc, 'approve')}
                      >
                        <CheckCircle className="h-4 w-4" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="gap-1.5 rounded-md"
                        onClick={() => openReview(kyc, 'reject')}
                      >
                        <XCircle className="h-4 w-4" /> Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Rejection reason */}
              {kyc.status === 'rejected' && kyc.rejection_reason && (
                <div className="mt-3 px-4 py-2 bg-destructive/5 border border-destructive/20 rounded-md text-sm text-destructive">
                  <span className="font-medium">Reason:</span> {kyc.rejection_reason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Document Viewer Dialog ── */}
      <Dialog open={!!detailKyc} onOpenChange={(o) => !o && setDetailKyc(null)}>
        <DialogContent className="max-w-2xl rounded-md">
          <DialogHeader>
            <DialogTitle className="font-display">KYC Documents — {detailKyc?.user_name || detailKyc?.user_email}</DialogTitle>
            <DialogDescription>
              Review the submitted identity documents below.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-3 mt-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">ID Front</p>
              <DocImage src={detailKyc?.id_front_url} label="ID Front" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">ID Back</p>
              <DocImage src={detailKyc?.id_back_url} label="ID Back" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Selfie with ID</p>
              <DocImage src={detailKyc?.selfie_url} label="Selfie with ID" />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={detailKyc?.status} />
            {detailKyc?.status === 'rejected' && detailKyc?.rejection_reason && (
              <span className="text-sm text-destructive">Reason: {detailKyc.rejection_reason}</span>
            )}
          </div>

          <DialogFooter className="mt-2 flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="rounded-md" onClick={() => setDetailKyc(null)}>Close</Button>
            {detailKyc?.status === 'pending' && (
              <>
                <Button
                  className="rounded-md bg-[#2F5233] hover:bg-[#2F5233]/90 text-white gap-1.5"
                  onClick={() => { setDetailKyc(null); openReview(detailKyc, 'approve') }}
                >
                  <CheckCircle className="h-4 w-4" /> Approve
                </Button>
                <Button
                  variant="destructive"
                  className="gap-1.5 rounded-md"
                  onClick={() => { setDetailKyc(null); openReview(detailKyc, 'reject') }}
                >
                  <XCircle className="h-4 w-4" /> Reject
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Review (Approve / Reject) Dialog ── */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-md rounded-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              {action === 'approve' ? 'Approve KYC' : 'Reject KYC'}
            </DialogTitle>
            <DialogDescription>
              {action === 'approve'
                ? `You are about to approve the KYC for ${selected?.user_name || selected?.user_email}. This will mark them as verified and grant seller access.`
                : `You are about to reject the KYC for ${selected?.user_name || selected?.user_email}. Please provide a clear reason.`
              }
            </DialogDescription>
          </DialogHeader>

          {dialogError && (
            <Alert variant="destructive" className="rounded-md">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{dialogError}</AlertDescription>
            </Alert>
          )}

          {action === 'reject' && (
            <div className="space-y-2 mt-2">
              <Label htmlFor="reason">Rejection Reason *</Label>
              <Textarea
                id="reason"
                placeholder="e.g. The ID photo is blurry. Please resubmit with a clearer image."
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={4}
                className="resize-none rounded-md"
              />
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button variant="outline" className="rounded-md" onClick={() => setSelected(null)} disabled={submitting}>
              Cancel
            </Button>
            {action === 'approve' ? (
              <Button
                className="rounded-md bg-[#2F5233] hover:bg-[#2F5233]/90 text-white gap-1.5"
                onClick={handleReview}
                disabled={submitting}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                {submitting ? 'Approving...' : 'Approve'}
              </Button>
            ) : (
              <Button
                variant="destructive"
                className="gap-1.5 rounded-md"
                onClick={handleReview}
                disabled={submitting}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                {submitting ? 'Rejecting...' : 'Reject'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
