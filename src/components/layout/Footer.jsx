// Location: components/layout/Footer.jsx
'use client'

import Link from 'next/link'
import { ShoppingCart, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Github } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { useLanguage } from '@/lib/i18n/LanguageContext'

const SHOP_LINK_KEYS = [
  { href: '/products', key: 'footer.all_products' },
  { href: '/categories', key: 'nav.categories' },
  { href: '/orders', key: 'nav.orders' },
  { href: '/wishlist', key: 'nav.wishlist' },
]

const SERVICE_LINK_KEYS = [
  { href: '/about', key: 'footer.about' },
  { href: '/contact', key: 'footer.contact' },
  { href: '/shipping', key: 'footer.shipping' },
  { href: '/returns', key: 'footer.returns' },
]

export default function Footer() {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')

  const handleNewsletterSubmit = (e) => {
    e.preventDefault()
    setEmail('')
  }

  return (
    <footer className="bg-background border-t border-border mt-16">
      <div className="container mx-auto px-4 max-w-6xl py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="space-y-5">
            <Link href="/" className="flex items-center gap-2 group w-fit">
              <div className="h-8 w-8 rounded-md bg-foreground flex items-center justify-center group-hover:bg-foreground/90 transition-colors">
                <ShoppingCart className="h-4 w-4 text-background" />
              </div>
              <span className="font-display font-bold text-lg text-foreground tracking-tight">NexCart</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[200px]">
              {t('footer.tagline')}
            </p>
            <div className="flex gap-2">
              {[Facebook, Twitter, Instagram, Github].map((Icon, i) => (
                <Button key={i} size="icon" variant="outline" className="h-8 w-8 rounded-md btn-press">
                  <Icon className="h-3.5 w-3.5" />
                </Button>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.15em] text-foreground mb-4">{t('footer.shop')}</p>
            <ul className="space-y-2.5">
              {SHOP_LINK_KEYS.map(({ href, key }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {t(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.15em] text-foreground mb-4">{t('footer.support')}</p>
            <ul className="space-y-2.5">
              {SERVICE_LINK_KEYS.map(({ href, key }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {t(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter + Contact */}
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.15em] text-foreground mb-4">{t('footer.newsletter')}</p>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              {t('footer.newsletter_desc')}
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-2 mb-6">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-9 text-sm"
              />
              <Button type="submit" size="sm" className="w-full btn-press">{t('footer.subscribe')}</Button>
            </form>
            <ul className="space-y-2.5">
              {[
                { Icon: Mail, text: 'support@nexcart.cm' },
                { Icon: Phone, text: '+237 652 314 994' },
                { Icon: MapPin, text: 'Tiko, South West, Cameroon' },
              ].map(({ Icon, text }) => (
                <li key={text} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0 text-accent" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground font-mono">
            © {new Date().getFullYear()} NexCart · Tiko, Cameroon 🇨🇲
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">{t('footer.privacy')}</Link>
            <span className="text-border">·</span>
            <Link href="/terms" className="hover:text-foreground transition-colors">{t('footer.terms')}</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
