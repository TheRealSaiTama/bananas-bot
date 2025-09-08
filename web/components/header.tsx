"use client"
import Link from 'next/link'
import BYOKDrawer from '@/components/byok-drawer'

export default function Header() {
  return (
    <header className="relative z-20 pt-4 px-5">
      <nav className="relative flex items-center justify-between h-[160px] px-6 rounded-[20px] border border-white/10 backdrop-blur-[17.5px] bg-gradient-to-r from-neutral-900/70 via-neutral-800/40 to-purple-800/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
        <Link href="/" aria-label="Home" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Logo" className="h-[200px] w-[200px] rounded-[28px]" />
        </Link>

        {/* Absolutely centered nav so it remains centered independent of logo/BYOK widths */}
        <div className="hidden md:flex items-center gap-12 text-white text-lg absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Link href="/" className="hover:opacity-80 transition-opacity">Home</Link>
          <Link href="/playground" className="hover:opacity-80 transition-opacity">Playground</Link>
          <Link href="/about" className="hover:opacity-80 transition-opacity">About</Link>
        </div>

        <div className="ml-auto flex items-center">
          {/* Styled to match homepage BYOK chip */}
          <div className="px-0 py-0 rounded-lg font-medium">
            <BYOKDrawer />
          </div>
        </div>
      </nav>
    </header>
  )
}
