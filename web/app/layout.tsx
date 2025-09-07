import type { Metadata } from 'next'
import '../styles/globals.css'
import Header from '@/components/header'
import Footer from '@/components/footer'
import CookieBanner from '@/components/cookie-banner'

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_SITE_TITLE ?? 'Bananas Bot — Nano Banana Playground',
  description: 'Gallery + Playground for Gemini 2.5 Flash Image (Nano Banana)',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 container mx-auto px-4 py-6">{children}</main>
          <Footer />
        </div>
        <CookieBanner />
      </body>
    </html>
  )
}
