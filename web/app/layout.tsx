import type { Metadata } from 'next'
import '../styles/globals.css'
import CookieBanner from '@/components/cookie-banner'

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_SITE_TITLE ?? 'KISKAX — AI Photo Editor',
  description: 'Edit, blend, and try on items with AI',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <CookieBanner />
      </body>
    </html>
  )
}
