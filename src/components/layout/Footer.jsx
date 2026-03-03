// Location: components/layout/Footer.jsx
'use client'

import Link from 'next/link'
import { ShoppingCart, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Github } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

export default function Footer() {
  const [email, setEmail] = useState('')

  const handleNewsletterSubmit = (e) => {
    e.preventDefault()
    setEmail('')
  }

  return (
    <footer className="bg-gradient-to-b from-background to-muted/30 border-t mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4 animate-fade-in-left">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 group-hover:scale-110 transition-transform">
                <ShoppingCart className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                NexCart
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              La meilleure destination shopping au Cameroun, propulsée par l&apos;IA. Découvrez des produits personnalisés rien que pour vous.
            </p>
            <div className="flex space-x-2">
              <Button size="icon" variant="outline" className="h-9 w-9 btn-press">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" className="h-9 w-9 btn-press">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" className="h-9 w-9 btn-press">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" className="h-9 w-9 btn-press">
                <Github className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="animate-fade-in stagger-2">
            <h3 className="font-semibold text-lg mb-4">Liens rapides</h3>
            <ul className="space-y-2">
              {[
                { href: '/products', label: 'Tous les produits' },
                { href: '/categories', label: 'Catégories' },
                { href: '/orders', label: 'Mes commandes' },
                { href: '/wishlist', label: 'Ma liste de souhaits' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 inline-block transition-transform">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div className="animate-fade-in stagger-3">
            <h3 className="font-semibold text-lg mb-4">Service client</h3>
            <ul className="space-y-2">
              {[
                { href: '/about', label: 'À propos de nous' },
                { href: '/contact', label: 'Contactez-nous' },
                { href: '/shipping', label: 'Livraison' },
                { href: '/returns', label: 'Retours & Échanges' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 inline-block transition-transform">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter + Contact */}
          <div className="animate-fade-in-right">
            <h3 className="font-semibold text-lg mb-4">Newsletter</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Abonnez-vous pour recevoir nos offres spéciales et mises à jour.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-2">
              <Input
                type="email"
                placeholder="Votre adresse email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" className="w-full btn-press">
                S&apos;abonner
              </Button>
            </form>
            <div className="mt-4 space-y-2">
              <div className="flex items-start space-x-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>support@nexcart.cm</span>
              </div>
              <div className="flex items-start space-x-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>+237 652 314 994</span>
              </div>
              <div className="flex items-start space-x-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Tiko, Sud-Ouest, Cameroun</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} NexCart. Tous droits réservés. 🇨🇲 Tiko, Cameroun
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-primary transition-colors">
                Confidentialité
              </Link>
              <span>•</span>
              <Link href="/terms" className="hover:text-primary transition-colors">
                Conditions d&apos;utilisation
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}




