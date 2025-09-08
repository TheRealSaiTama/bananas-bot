import type { Metadata } from 'next'
import '../styles/globals.css'
import CookieBanner from '@/components/cookie-banner'
import Header from '@/components/header'
import ThemeBackground from '@/components/theme-background'

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_SITE_TITLE ?? 'KISKAX — AI Photo Editor',
  description: 'Edit, blend, and try on items with AI',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black text-white relative min-h-screen overflow-x-hidden">
        {/* Global themed gradient blobs behind content */}
        <ThemeBackground />
        {/* Unified site header matching homepage aesthetics */}
        <Header />
        {/* Page content */}
        <div className="relative z-10">
          {children}
        </div>
        <CookieBanner />
      </body>
    </html>
  )
}
