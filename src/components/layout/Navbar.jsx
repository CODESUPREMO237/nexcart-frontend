// Location: components/layout/Navbar.jsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingCart, User, Search, Menu, X, Heart, Package, Home, Grid3x3, History } from 'lucide-react'
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

export default function Navbar() {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuthStore()
  const { totalItems, fetchCart } = useCartStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart()
    }
  }, [isAuthenticated, fetchCart])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
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

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full transition-all duration-300",
      isScrolled 
        ? "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-md" 
        : "bg-background border-b"
    )}>
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 group-hover:scale-110 transition-transform">
              <ShoppingCart className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              NexCart
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Button variant="ghost" asChild>
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/products">
                <Package className="h-4 w-4 mr-2" />
                Products
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/categories">
                <Grid3x3 className="h-4 w-4 mr-2" />
                Categories
              </Link>
            </Button>
          </nav>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                className="pl-10 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {/* Wishlist */}
            {isAuthenticated && (
              <Button variant="ghost" size="icon" asChild className="hidden md:inline-flex">
                <Link href="/wishlist">
                  <Heart className="h-5 w-5" />
                </Link>
              </Button>
            )}

            {/* Cart */}
            <Button variant="ghost" size="icon" asChild className="relative">
              <Link href="/cart">
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {totalItems}
                  </Badge>
                )}
              </Link>
            </Button>

            {/* User Menu */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hidden md:inline-flex">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center gap-2 p-2">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user?.first_name || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders" className="cursor-pointer">
                      <History className="mr-2 h-4 w-4" />
                      Order History
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/wishlist" className="cursor-pointer">
                      <Heart className="mr-2 h-4 w-4" />
                      Wishlist
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild className="hidden md:inline-flex">
                <Link href="/login">Sign In</Link>
              </Button>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-4 border-t animate-in slide-in-from-top-2">
            {/* Mobile Search */}
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>

            {/* Mobile Navigation */}
            <nav className="flex flex-col space-y-2">
              <Button variant="ghost" asChild className="justify-start">
                <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Link>
              </Button>
              <Button variant="ghost" asChild className="justify-start">
                <Link href="/products" onClick={() => setMobileMenuOpen(false)}>
                  <Package className="h-4 w-4 mr-2" />
                  Products
                </Link>
              </Button>
              <Button variant="ghost" asChild className="justify-start">
                <Link href="/categories" onClick={() => setMobileMenuOpen(false)}>
                  <Grid3x3 className="h-4 w-4 mr-2" />
                  Categories
                </Link>
              </Button>
              
              {isAuthenticated && (
                <>
                  <Button variant="ghost" asChild className="justify-start">
                    <Link href="/wishlist" onClick={() => setMobileMenuOpen(false)}>
                      <Heart className="h-4 w-4 mr-2" />
                      Wishlist
                    </Link>
                  </Button>
                  <Button variant="ghost" asChild className="justify-start">
                    <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Link>
                  </Button>
                  <Button variant="ghost" asChild className="justify-start">
                    <Link href="/orders" onClick={() => setMobileMenuOpen(false)}>
                      <Package className="h-4 w-4 mr-2" />
                      Orders
                    </Link>
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="justify-start text-destructive"
                    onClick={() => {
                      handleLogout()
                      setMobileMenuOpen(false)
                    }}
                  >
                    Logout
                  </Button>
                </>
              )}
              
              {!isAuthenticated && (
                <Button asChild className="w-full">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    Sign In
                  </Link>
                </Button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
