'use client'

import { useState, useEffect } from 'react'
import { MapPin, Truck, Clock, Check } from 'lucide-react'
import api from '@/lib/api'

export default function DeliveryEstimator({ orderTotal = 0, onEstimate }) {
  const [zones, setZones] = useState([])
  const [selectedArea, setSelectedArea] = useState('')
  const [estimate, setEstimate] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadZones()
  }, [])

  const loadZones = async () => {
    try {
      const response = await api.get('/delivery/zones/')
      setZones(response.data?.results || response.data || [])
    } catch (e) {
      // Use fallback zones for demo
      setZones([
        { id: '1', name: 'Tiko Local', region: 'South West', base_fee: 500, estimated_days_min: 1, estimated_days_max: 2, free_delivery_threshold: 25000, areas: [
          { id: 'a1', name: 'Tiko Town', city: 'Tiko' },
          { id: 'a2', name: 'Mutengene', city: 'Tiko' },
          { id: 'a3', name: 'Likomba', city: 'Tiko' },
        ]},
        { id: '2', name: 'Buea Zone', region: 'South West', base_fee: 1000, estimated_days_min: 1, estimated_days_max: 3, free_delivery_threshold: 30000, areas: [
          { id: 'a4', name: 'Buea Town', city: 'Buea' },
          { id: 'a5', name: 'Molyko', city: 'Buea' },
          { id: 'a6', name: 'Soppo', city: 'Buea' },
        ]},
        { id: '3', name: 'Limbe Zone', region: 'South West', base_fee: 1500, estimated_days_min: 1, estimated_days_max: 3, free_delivery_threshold: 30000, areas: [
          { id: 'a7', name: 'Limbe Town', city: 'Limbe' },
          { id: 'a8', name: 'Mile 4', city: 'Limbe' },
        ]},
        { id: '4', name: 'Douala Zone', region: 'Littoral', base_fee: 2500, estimated_days_min: 2, estimated_days_max: 5, free_delivery_threshold: 50000, areas: [
          { id: 'a9', name: 'Akwa', city: 'Douala' },
          { id: 'a10', name: 'Bonaberi', city: 'Douala' },
          { id: 'a11', name: 'Deido', city: 'Douala' },
        ]},
      ])
    }
  }

  const handleAreaSelect = async (areaId) => {
    setSelectedArea(areaId)
    setLoading(true)
    try {
      const response = await api.post('/delivery/estimate/', {
        area_id: areaId,
        order_total: orderTotal
      })
      setEstimate(response.data)
      if (onEstimate) onEstimate(response.data)
    } catch (e) {
      // Fallback estimate
      const allAreas = zones.flatMap(z => (z.areas || []).map(a => ({ ...a, zone: z })))
      const area = allAreas.find(a => a.id === areaId)
      if (area) {
        const fee = orderTotal >= area.zone.free_delivery_threshold ? 0 : area.zone.base_fee
        const est = {
          delivery_fee: fee,
          estimated_days_min: area.zone.estimated_days_min,
          estimated_days_max: area.zone.estimated_days_max,
          zone_name: area.zone.name,
          area_name: area.name,
          is_free_delivery: fee === 0,
        }
        setEstimate(est)
        if (onEstimate) onEstimate(est)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <MapPin className="h-4 w-4 text-primary" />
        Select Delivery Area
      </div>

      <select
        value={selectedArea}
        onChange={(e) => handleAreaSelect(e.target.value)}
        className="w-full rounded-lg border px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-primary/30 outline-none"
      >
        <option value="">-- Choose your area --</option>
        {zones.map((zone) => (
          <optgroup key={zone.id} label={`${zone.name} (${zone.region})`}>
            {(zone.areas || []).map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}, {area.city}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {loading && (
        <div className="text-sm text-muted-foreground animate-pulse">Calculating...</div>
      )}

      {estimate && !loading && (
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Truck className="h-4 w-4 text-blue-500" />
              <span>Delivery Fee</span>
            </div>
            <span className={`text-sm font-bold ${estimate.is_free_delivery ? 'text-green-500' : ''}`}>
              {estimate.is_free_delivery
                ? '✨ FREE'
                : `${parseInt(estimate.delivery_fee).toLocaleString()} FCFA`
              }
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-amber-500" />
              <span>Estimated Time</span>
            </div>
            <span className="text-sm font-medium">
              {estimate.estimated_days_min}-{estimate.estimated_days_max} days
            </span>
          </div>

          {estimate.zone_name && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t">
              <Check className="h-3 w-3" />
              Zone: {estimate.zone_name}
              {estimate.area_name && ` → ${estimate.area_name}`}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
