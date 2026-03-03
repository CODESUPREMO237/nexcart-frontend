'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Package, Clock, CheckCircle, XCircle, ArrowLeft,
  MapPin, Phone, Mail, Calendar, CreditCard, Truck
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

const fcfa = (n) =>
  new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n)

const STATUS_CONFIG = {
  pending:    { icon: Clock,       label: 'En attente',    color: 'text-yellow-700 bg-yellow-50 border border-yellow-200' },
  processing: { icon: Package,     label: 'En traitement', color: 'text-blue-700 bg-blue-50 border border-blue-200' },
  shipped:    { icon: Truck,       label: 'Expédié',       color: 'text-indigo-700 bg-indigo-50 border border-indigo-200' },
  delivered:  { icon: CheckCircle, label: 'Livré',         color: 'text-green-700 bg-green-50 border border-green-200' },
  cancelled:  { icon: XCircle,     label: 'Annulé',        color: 'text-red-700 bg-red-50 border border-red-200' },
}

const PAYMENT_CONFIG = {
  completed: { label: 'Paiement réussi',     color: 'text-green-700 bg-green-50 border border-green-200', icon: '✓' },
  pending:   { label: 'Paiement en attente', color: 'text-yellow-700 bg-yellow-50 border border-yellow-200', icon: '⏳' },
  failed:    { label: 'Paiement échoué',     color: 'text-red-700 bg-red-50 border border-red-200', icon: '✗' },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${cfg.color}`}>
      <Icon className="h-4 w-4" /> {cfg.label}
    </span>
  )
}

function PaymentBadge({ status }) {
  const cfg = PAYMENT_CONFIG[status] || PAYMENT_CONFIG.pending
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  )
}

export default function OrderDetailPage() {
  const router = useRouter()
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadOrder = useCallback(async () => {
    try {
      const data = await api.getOrder(id)
      setOrder(data)
    } catch (err) {
      if (err.response?.status === 401) {
        router.push('/login')
        return
      }
      setError('Commande introuvable.')
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => {
    if (id) loadOrder()
  }, [id, loadOrder])

  if (loading) return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="space-y-4">
        {[1,2,3].map(i => <Skeleton key={i} className="h-32" />)}
      </div>
    </div>
  )

  if (error || !order) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
      <h1 className="text-2xl font-bold mb-2">Commande introuvable</h1>
      <p className="text-muted-foreground mb-6">{error}</p>
      <Button asChild><Link href="/orders">← Mes commandes</Link></Button>
    </div>
  )

  const subtotal = parseFloat(order.subtotal || 0)
  const shipping = parseFloat(order.shipping_cost || 0)
  const total    = parseFloat(order.total || 0)

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="btn-press">
          <ArrowLeft className="h-4 w-4 mr-1" /> Retour
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Commande #{order.order_number}</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(order.created_at).toLocaleDateString('fr-CM', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            })}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <PaymentBadge status={order.payment_status} />
          <StatusBadge status={order.status} />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left: items + totals */}
        <div className="md:col-span-2 space-y-6">

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Articles commandés ({order.items?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items?.map((item) => (
                <div key={item.id} className="flex gap-4 pb-4 border-b last:border-0 last:pb-0">
                  <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                    {item.product_image ? (
                      <Image
                        src={item.product_image}
                        alt={item.product_name || 'Produit'}
                        fill className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{item.product_name}</p>
                    {item.product_sku && (
                      <p className="text-xs text-muted-foreground font-mono">SKU: {item.product_sku}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} × {fcfa(item.price)}
                      </p>
                      <p className="font-bold text-primary">{fcfa(item.total)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Totals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" /> Récapitulatif
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sous-total</span>
                <span>{fcfa(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Livraison</span>
                <span>{shipping === 0 ? <span className="text-green-600 font-medium">GRATUITE</span> : fcfa(shipping)}</span>
              </div>
              {parseFloat(order.discount || 0) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Réduction</span>
                  <span>-{fcfa(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-3 border-t">
                <span className="font-bold text-lg">Total</span>
                <span className="text-2xl font-bold text-primary">{fcfa(total)}</span>
              </div>
              <div className="pt-2">
                <PaymentBadge status={order.payment_status} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: shipping info */}
        <div className="space-y-6">
          {/* Shipping address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4 text-primary" /> Adresse de livraison
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-semibold">{order.shipping_first_name} {order.shipping_last_name}</p>
              <p className="text-muted-foreground">{order.shipping_address_line1}</p>
              {order.shipping_address_line2 && <p className="text-muted-foreground">{order.shipping_address_line2}</p>}
              <p className="text-muted-foreground">{order.shipping_city}, {order.shipping_state}</p>
              <p className="text-muted-foreground">{order.shipping_country}</p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Phone className="h-4 w-4 text-primary" /> Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                {order.email}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                {order.phone}
              </p>
            </CardContent>
          </Card>

          {/* Tracking */}
          {order.tracking_number && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Truck className="h-4 w-4 text-primary" /> Suivi
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="font-mono text-primary">{order.tracking_number}</p>
                {order.carrier && <p className="text-muted-foreground mt-1">{order.carrier}</p>}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">{order.notes}</p></CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
