import { Truck, Package, Plane } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ShippingPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-5xl font-bold mb-4">Shipping Information</h1>
      <p className="text-xl text-muted-foreground mb-12">
        Fast, reliable shipping to your door
      </p>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <Card>
          <CardHeader>
            <Truck className="h-12 w-12 text-primary mb-2" />
            <CardTitle>Standard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold mb-2">FREE</p>
            <p className="text-sm text-muted-foreground">5-7 business days</p>
            <p className="text-xs mt-2">On orders over 50 FCFA</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Package className="h-12 w-12 text-primary mb-2" />
            <CardTitle>Express</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold mb-2">15 FCFA</p>
            <p className="text-sm text-muted-foreground">2-3 business days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Plane className="h-12 w-12 text-primary mb-2" />
            <CardTitle>Overnight</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold mb-2">30 FCFA</p>
            <p className="text-sm text-muted-foreground">1 business day</p>
          </CardContent>
        </Card>
      </div>

      <div className="prose max-w-none">
        <h2>Shipping Policy</h2>
        <p>
          We ship to all 50 states and internationally. Orders are processed within 1-2 business days.
        </p>

        <h2>International Shipping</h2>
        <p>
          International shipping is available with delivery times varying by location (7-21 business days).
          Customs fees may apply and are the responsibility of the customer.
        </p>

        <h2>Order Tracking</h2>
        <p>
          Once your order ships, you&apos;ll receive a tracking number via email to monitor your delivery.
        </p>
      </div>
    </div>
  )
}

