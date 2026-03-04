import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'NexCart - Smart E-Commerce Platform',
  description: 'AI-powered shopping experience with personalized recommendations',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/nexcart-logo.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.ico',
  },
  other: {
    google: 'notranslate',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" translate="no" className="notranslate" suppressHydrationWarning>
      <body className={`${inter.className} notranslate`} suppressHydrationWarning>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
