'use client'

import { useState, useEffect } from 'react'
import { Cookie, ShieldCheck, ChartBar, Megaphone, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const TOGGLE_ITEMS = [
  {
    key: 'necessary',
    icon: ShieldCheck,
    title: 'Necessary Cookies',
    desc: 'Authentication, security, cart — always on',
    locked: true,
  },
  {
    key: 'analytics',
    icon: ChartBar,
    title: 'Analytics Cookies',
    desc: 'Help us understand how you use NexCart',
    locked: false,
  },
  {
    key: 'marketing',
    icon: Megaphone,
    title: 'Marketing Cookies',
    desc: 'Personalized product recommendations',
    locked: false,
  },
]

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('nexcart_cookie_consent')
    if (!consent) {
      // Small delay so it doesn't flash immediately on load
      const timer = setTimeout(() => setVisible(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAcceptAll = () => {
    localStorage.setItem('nexcart_cookie_consent', JSON.stringify({
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    }))
    setVisible(false)
  }

  const handleAcceptNecessary = () => {
    localStorage.setItem('nexcart_cookie_consent', JSON.stringify({
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    }))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[70] p-4 pointer-events-none animate-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-3xl mx-auto">
        <div className="bg-card border border-border rounded-md shadow-2xl overflow-hidden pointer-events-auto">
          {/* Main Banner */}
          <div className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-md border border-accent/30 bg-accent/5 flex items-center justify-center shrink-0 mt-0.5">
                <Cookie className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-accent mb-1">Privacy</p>
                <h3 className="font-display font-semibold text-sm text-foreground">We value your privacy</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic.
                  By clicking &quot;Accept All&quot;, you consent to our use of cookies.
                </p>

                {/* Details Panel */}
                {showDetails && (
                  <div className="mt-3 space-y-2 border-t border-border pt-3 animate-in fade-in slide-in-from-top-2">
                    {TOGGLE_ITEMS.map(({ key, icon: Icon, title, desc, locked }) => (
                      <div key={key} className="flex items-center justify-between py-1.5 gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-foreground">{title}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{desc}</p>
                          </div>
                        </div>
                        {locked ? (
                          <span className="text-[10px] font-mono uppercase tracking-[0.05em] text-accent bg-accent/10 border border-accent/30 px-2 py-0.5 rounded-md shrink-0">
                            Always Active
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono uppercase tracking-[0.05em] text-muted-foreground border border-border px-2 py-0.5 rounded-md shrink-0">
                            Optional
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <Button
                    size="sm"
                    onClick={handleAcceptAll}
                    className="rounded-md bg-foreground hover:bg-foreground/90 text-background text-xs h-8 px-4"
                  >
                    Accept All
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAcceptNecessary}
                    className="rounded-md text-xs h-8 px-4"
                  >
                    Necessary Only
                  </Button>
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-xs font-mono uppercase tracking-[0.05em] text-accent hover:underline ml-1"
                  >
                    {showDetails ? 'Hide Details' : 'Cookie Settings'}
                  </button>
                </div>
              </div>

              <button
                onClick={handleAcceptNecessary}
                className="text-muted-foreground hover:text-foreground shrink-0"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
