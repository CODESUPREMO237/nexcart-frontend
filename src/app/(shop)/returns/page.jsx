import { Phone, FileCheck, Truck, BadgeCheck } from 'lucide-react'

const steps = [
  { icon: Phone, title: 'Contact support', desc: 'Reach our team to start the process' },
  { icon: FileCheck, title: 'Get authorization', desc: 'Receive a return authorization' },
  { icon: Truck, title: 'Ship it back', desc: 'Send the item back to us' },
  { icon: BadgeCheck, title: 'Get refunded', desc: 'Refund lands in 5–7 business days' },
]

const conditions = [
  'Items must be unused and in original packaging',
  'Keep your receipt or proof of purchase',
  'Some items are not eligible for return',
]

export default function ReturnsPage() {
  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 max-w-5xl py-16 md:py-24">
        <p className="text-sm font-medium tracking-[0.2em] uppercase text-accent mb-4">
          Returns
        </p>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 max-w-2xl">
          Returns &amp; exchanges
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mb-16">
          We offer a 30-day return policy on most items — here&apos;s how it
          works.
        </p>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 border border-border rounded-xl overflow-hidden mb-20">
          {steps.map(({ icon: Icon, title, desc }, i) => (
            <div
              key={title}
              className={`p-6 flex flex-col gap-4 ${
                i !== steps.length - 1 ? 'md:border-r border-border' : ''
              } ${i % 2 === 0 ? 'sm:border-r md:border-r-0 border-border' : ''} ${
                i >= 2 ? 'border-t md:border-t-0 border-border' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground">
                  Step {i + 1}
                </span>
                <Icon className="h-5 w-5 text-accent" strokeWidth={1.75} />
              </div>
              <div>
                <h2 className="text-base font-semibold mb-1">{title}</h2>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div>
          <h2 className="text-sm font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-6">
            Conditions
          </h2>
          <div className="border border-border rounded-xl overflow-hidden">
            {conditions.map((condition, i) => (
              <div
                key={condition}
                className={`flex items-start gap-4 p-5 ${
                  i !== conditions.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <span className="text-xs font-semibold text-accent mt-0.5">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p className="text-base">{condition}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}