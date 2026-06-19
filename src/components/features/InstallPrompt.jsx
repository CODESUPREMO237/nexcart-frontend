'use client'

import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Register service worker — production only.
    // Registering this in dev causes the browser to permanently cache JS/CSS
    // bundles cache-first (see public/sw.js), so code edits + F5 refreshes
    // silently keep running old cached code. Never debug against a dev
    // server that has a service worker installed.
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }

    // Listen for install prompt
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      const wasDismissed = localStorage.getItem('nexcart_install_dismissed')
      if (!wasDismissed) {
        setShowPrompt(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowPrompt(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setDismissed(true)
    localStorage.setItem('nexcart_install_dismissed', 'true')
  }

  if (!showPrompt || dismissed) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[380px] z-50 animate-in slide-in-from-bottom-4">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="bg-white/20 rounded-lg p-2 shrink-0">
            <Download className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">Install NexCart</h3>
            <p className="text-xs text-white/80 mt-0.5">
              Add to home screen for faster access and offline browsing
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={handleInstall}
                className="bg-white text-blue-600 hover:bg-white/90 text-xs h-8"
              >
                Install App
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="text-white/80 hover:text-white hover:bg-white/10 text-xs h-8"
              >
                Not Now
              </Button>
            </div>
          </div>
          <button onClick={handleDismiss} className="text-white/60 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
