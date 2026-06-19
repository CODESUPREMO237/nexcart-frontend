// Location: components/layout/Navbar.jsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { ShoppingCart, User, Search, Menu, X, Heart, Package, Home, Grid3x3, History, MessageCircle, Store, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import useAuthStore from '@/store/authStore'
import useCartStore from '@/store/cartStore'
import { cn } from '@/lib/utils'
import LanguageSwitcher from '@/components/features/LanguageSwitcher'
import VisualSearch from '@/components/features/VisualSearch'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, authReady, roleConfirmed, logout } = useAuthStore()
  const showUserUI = authReady
  const { totalItems, fetchCart } = useCartStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    if (isAuthenticated) fetchCart()
  }, [isAuthenticated, fetchCart])

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`)
      setSearchQuery('')
      setMobileMenuOpen(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  if (pathname?.startsWith('/admin')) return null

  return (
    <header className={cn(
      'sticky top-0 z-50 w-full transition-all duration-200',
      isScrolled
        ? 'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-sm border-b border-border'
        : 'bg-background border-b border-border'
    )}>
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex h-14 items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <div className="h-8 w-8 rounded-md bg-foreground flex items-center justify-center group-hover:bg-foreground/90 transition-colors">
              <ShoppingCart className="h-4 w-4 text-background" />
            </div>
            <span className="font-display font-bold text-lg text-foreground tracking-tight">NexCart</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { href: '/', icon: Home, label: 'Home' },
              { href: '/products', icon: Package, label: 'Products' },
              { href: '/categories', icon: Grid3x3, label: 'Categories' },
            ].map(({ href, icon: Icon, label }) => (
              <Button
                key={href}
                variant="ghost"
                size="sm"
                asChild
                className={cn(
                  'text-muted-foreground hover:text-foreground hover:bg-muted text-xs font-medium',
                  pathname === href && 'text-foreground bg-muted'
                )}
              >
                <Link href={href}>
                  <Icon className="h-3.5 w-3.5 mr-1.5" />
                  {label}
                </Link>
              </Button>
            ))}
          </nav>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-sm mx-2">
            <div className="relative w-full flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products…"
                  className="pl-9 h-9 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <VisualSearch />
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <LanguageSwitcher />

            {showUserUI && isAuthenticated && (
              <>
                <Button variant="ghost" size="icon" asChild className="hidden md:inline-flex h-8 w-8">
                  <Link href="/messages"><MessageCircle className="h-4 w-4" /></Link>
                </Button>
                <Button variant="ghost" size="icon" asChild className="hidden md:inline-flex h-8 w-8">
                  <Link href="/wishlist"><Heart className="h-4 w-4" /></Link>
                </Button>
              </>
            )}

            {/* Cart */}
            <Button variant="ghost" size="icon" asChild className="relative h-8 w-8">
              <Link href="/cart">
                <ShoppingCart className="h-4 w-4" />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-sm bg-accent text-accent-foreground text-[10px] font-mono font-bold flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Link>
            </Button>

            {/* User Menu */}
            {showUserUI && isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hidden md:inline-flex h-8 w-8">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-sm font-medium text-foreground">{user?.first_name || 'User'}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/profile"><User className="mr-2 h-3.5 w-3.5" />Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders"><History className="mr-2 h-3.5 w-3.5" />Order history</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/wishlist"><Heart className="mr-2 h-3.5 w-3.5" />Wishlist</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/messages"><MessageCircle className="mr-2 h-3.5 w-3.5" />Messages</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {roleConfirmed && (user?.role === 'seller' || user?.role === 'vendor') && (
                    <DropdownMenuItem asChild>
                      <Link href="/seller/dashboard"><Store className="mr-2 h-3.5 w-3.5" />Seller dashboard</Link>
                    </DropdownMenuItem>
                  )}
                  {roleConfirmed && (user?.is_staff || user?.role === 'admin') && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/products"><Package className="mr-2 h-3.5 w-3.5" />Product approvals</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/analytics"><BarChart3 className="mr-2 h-3.5 w-3.5" />Analytics</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              showUserUI && (
                <Button size="sm" asChild className="hidden md:inline-flex h-8 px-4 text-xs">
                  <Link href="/login">Sign in</Link>
                </Button>
              )
            )}

            {/* Mobile menu toggle */}
            <Button variant="ghost" size="icon" className="md:hidden h-8 w-8"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-3 border-t border-border animate-slide-down">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input type="search" placeholder="Search products…" className="pl-9 h-9 text-sm"
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </form>

            <nav className="flex flex-col gap-1">
              {[
                { href: '/', icon: Home, label: 'Home' },
                { href: '/products', icon: Package, label: 'Products' },
                { href: '/categories', icon: Grid3x3, label: 'Categories' },
              ].map(({ href, icon: Icon, label }) => (
                <Button key={href} variant="ghost" size="sm" asChild className="justify-start text-sm">
                  <Link href={href} onClick={() => setMobileMenuOpen(false)}>
                    <Icon className="h-4 w-4 mr-2" />{label}
                  </Link>
                </Button>
              ))}

              {showUserUI && isAuthenticated && (
                <>
                  {[
                    { href: '/wishlist', icon: Heart, label: 'Wishlist' },
                    { href: '/profile', icon: User, label: 'Profile' },
                    { href: '/orders', icon: Package, label: 'Orders' },
                  ].map(({ href, icon: Icon, label }) => (
                    <Button key={href} variant="ghost" size="sm" asChild className="justify-start text-sm">
                      <Link href={href} onClick={() => setMobileMenuOpen(false)}>
                        <Icon className="h-4 w-4 mr-2" />{label}
                      </Link>
                    </Button>
                  ))}
                  {roleConfirmed && (user?.role === 'seller' || user?.role === 'vendor') && (
                    <Button variant="ghost" size="sm" asChild className="justify-start text-sm">
                      <Link href="/seller/dashboard" onClick={() => setMobileMenuOpen(false)}>
                        <Store className="h-4 w-4 mr-2" />Seller dashboard
                      </Link>
                    </Button>
                  )}
                  {roleConfirmed && (user?.is_staff || user?.role === 'admin') && (
                    <Button variant="ghost" size="sm" asChild className="justify-start text-sm">
                      <Link href="/admin/products" onClick={() => setMobileMenuOpen(false)}>
                        <BarChart3 className="h-4 w-4 mr-2" />Admin panel
                      </Link>
                    </Button>
                  )}
                  <Button variant="ghost" size="sm"
                    className="justify-start text-sm text-destructive hover:text-destructive"
                    onClick={() => { handleLogout(); setMobileMenuOpen(false) }}>
                    Logout
                  </Button>
                </>
              )}

              {showUserUI && !isAuthenticated && (
                <Button size="sm" asChild className="w-full mt-2">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>Sign in</Link>
                </Button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
