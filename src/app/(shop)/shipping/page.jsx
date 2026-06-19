import { Truck, Package, Plane, ArrowRight } from 'lucide-react'

const tiers = [
  {
    icon: Truck,
    name: 'Standard',
    price: 'FREE',
    eyebrow: '01 — Default',
    time: '5–7 business days',
    note: 'On orders over 50 FCFA',
  },
  {
    icon: Package,
    name: 'Express',
    price: '500 FCFA',
    eyebrow: '02 — Faster',
    time: '2–3 business days',
    note: 'Tracked door-to-door',
  },
  {
    icon: Plane,
    name: 'Overnight',
    price: '1,000 FCFA',
    eyebrow: '03 — Fastest',
    time: '1 business day',
    note: 'Order before 2pm to qualify',
  },
]

export default function ShippingPage() {
  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 max-w-5xl py-16 md:py-24">
        <p className="text-sm font-medium tracking-[0.2em] uppercase text-accent mb-4">
          Shipping
        </p>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 max-w-2xl">
          Fast, reliable shipping to your door
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mb-16">
          Pick the speed that fits you. Every tier ships tracked, every order
          leaves our warehouse within 1–2 business days.
        </p>

        <div className="grid md:grid-cols-3 border border-border rounded-xl overflow-hidden mb-20">
          {tiers.map(({ icon: Icon, name, price, eyebrow, time, note }, i) => (
            <div
              key={name}
              className={`p-8 flex flex-col gap-6 ${
                i !== tiers.length - 1 ? 'md:border-r border-border' : ''
              } ${i !== 0 ? 'border-t md:border-t-0 border-border' : ''}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground">
                  {eyebrow}
                </span>
                <Icon className="h-5 w-5 text-accent" strokeWidth={1.75} />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-1">{name}</h2>
                <p className="text-3xl font-bold tracking-tight">{price}</p>
              </div>
              <div className="mt-auto pt-4 border-t border-border">
                <p className="text-sm font-medium">{time}</p>
                <p className="text-sm text-muted-foreground mt-1">{note}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-12">
          <div>
            <h2 className="text-sm font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-3">
              Shipping policy
            </h2>
            <p className="text-base leading-relaxed">
              We ship to all 50 states and internationally. Orders are
              processed within 1–2 business days.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-3">
              International shipping
            </h2>
            <p className="text-base leading-relaxed">
              Available with delivery times varying by location (7–21
              business days). Customs fees may apply and are the
              responsibility of the customer.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-3">
              Order tracking
            </h2>
            <p className="text-base leading-relaxed">
              Once your order ships, you&apos;ll receive a tracking number
              via email to monitor your delivery.
            </p>
          </div>
        </div>

        <a
          href="/contact"
          className="inline-flex items-center gap-2 mt-16 text-sm font-medium text-accent hover:gap-3 transition-all"
        >
          Questions about your shipment? Contact support
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  )
}

