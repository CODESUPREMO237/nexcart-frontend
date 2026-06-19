const reasons = [
  'AI-powered product recommendations tailored to your preferences',
  'Secure and fast checkout process',
  'Free shipping on orders over 50 FCFA',
  '30-day hassle-free returns',
  '24/7 customer support',
  'Wide selection of quality products',
]

export default function AboutPage() {
  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 max-w-5xl py-16 md:py-24">
        <p className="text-sm font-medium tracking-[0.2em] uppercase text-accent mb-4">
          About
        </p>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 max-w-2xl">
          Your ultimate AI-powered shopping destination
        </h1>

        <div className="grid md:grid-cols-2 gap-16 mt-16">
          <div>
            <h2 className="text-sm font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-3">
              Our story
            </h2>
            <p className="text-lg leading-relaxed">
              Founded in 2024, NexCart revolutionizes online shopping by
              combining cutting-edge AI technology with an extensive product
              catalog. We believe shopping should be personal, efficient, and
              enjoyable.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-3">
              Our mission
            </h2>
            <p className="text-lg leading-relaxed">
              To provide every customer with a personalized shopping
              experience powered by artificial intelligence, delivering the
              right products at the right time.
            </p>
          </div>
        </div>

        <div className="mt-20">
          <h2 className="text-sm font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-6">
            Why choose NexCart
          </h2>
          <div className="grid sm:grid-cols-2 border border-border rounded-xl overflow-hidden">
            {reasons.map((reason, i) => (
              <div
                key={reason}
                className={`flex items-start gap-4 p-6 ${
                  i % 2 === 0 ? 'sm:border-r border-border' : ''
                } ${i < reasons.length - 2 ? 'border-b border-border' : ''}`}
              >
                <span className="text-xs font-semibold text-accent mt-1">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p className="text-base leading-relaxed">{reason}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
