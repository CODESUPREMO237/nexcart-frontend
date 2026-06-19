// Location: app\(auth)\layout.jsx
'use client'

import Link from 'next/link'
import { ShoppingCart, Check } from 'lucide-react'
import { APP_NAME } from '@/lib/constants'

const SELLING_POINTS = [
  { label: 'Local sellers', desc: 'Every vendor passes KYC before listing.' },
  { label: 'Mobile money', desc: 'Pay with MTN or Orange Money at checkout.' },
  { label: 'Tracked delivery', desc: 'Coverage across the South West region.' },
  { label: 'Easy returns', desc: '30-day return window, no questions asked.' },
]

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Left — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-10 w-fit group">
            <div className="h-8 w-8 rounded-md bg-foreground flex items-center justify-center group-hover:bg-foreground/90 transition-colors">
              <ShoppingCart className="h-4 w-4 text-background" />
            </div>
            <span className="font-display font-bold text-lg text-foreground tracking-tight">{APP_NAME}</span>
          </Link>

          {children}
        </div>
      </div>

      {/* Right — branding panel */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] bg-foreground flex-col justify-between p-12 shrink-0">
        <div>
          <span className="font-mono text-xs uppercase tracking-[0.15em] text-background/40">NexCart · Tiko, Cameroon</span>
          <h2 className="font-display font-bold text-3xl text-background mt-6 leading-tight">
            The marketplace built for how Cameroon shops.
          </h2>
          <p className="text-background/60 text-sm mt-4 leading-relaxed">
            Local sellers. Mobile money checkout. Tracked delivery. One platform.
          </p>

          <ul className="mt-10 space-y-4">
            {SELLING_POINTS.map(({ label, desc }) => (
              <li key={label} className="flex gap-3 items-start">
                <span className="mt-0.5 h-4 w-4 rounded-sm bg-accent/20 flex items-center justify-center shrink-0">
                  <Check className="h-2.5 w-2.5 text-accent" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-background">{label}</p>
                  <p className="text-xs text-background/50 mt-0.5">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="font-mono text-xs text-background/30 uppercase tracking-[0.1em]">
          © {new Date().getFullYear()} NexCart 🇨🇲
        </p>
      </div>
    </div>
  )
}
