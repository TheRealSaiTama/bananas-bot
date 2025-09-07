"use client"
import Link from 'next/link'
import BYOKDrawer from '@/components/byok-drawer'

export default function Header() {
  return (
    <header className="sticky top-0 z-30">
      <div className="container mx-auto px-4 pt-2 pb-3">
        <nav className="rounded-2xl border border-white/10 text-white nav-gradient px-3 h-14 flex items-center justify-between shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset]">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="KISKAX" className="h-7 w-7 rounded-full" />
            <span className="font-semibold tracking-wide">KISKAX</span>
          </Link>
          <div className="hidden md:flex items-center gap-10 text-sm text-neutral-200">
            <Link href="/" className="hover:text-white">Home</Link>
            <Link href="/playground" className="hover:text-white">Playground</Link>
            <Link href="/about" className="hover:text-white">About</Link>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <BYOKDrawer />
          </div>
        </nav>
      </div>
    </header>
  )
}
