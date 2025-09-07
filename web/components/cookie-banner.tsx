"use client"
import { useEffect, useState } from 'react'

export default function CookieBanner() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const v = localStorage.getItem('cookie-consent')
    if (!v) setOpen(true)
  }, [])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
      <div className="relative card max-w-xl w-full p-4">
        <h3 className="font-semibold mb-2">Cookies & Privacy</h3>
        <p className="text-sm text-neutral-600">We use localStorage to save your BYOK API keys (Gemini, Fal, ElevenLabs). No tracking cookies. See Privacy & Cookies pages for details.</p>
        <div className="mt-4 flex gap-2 justify-end">
          <a href="/cookies" className="btn">Cookies</a>
          <a href="/privacy" className="btn">Privacy</a>
          <button className="btn btn-primary" onClick={() => { localStorage.setItem('cookie-consent', 'accepted'); setOpen(false) }}>Accept</button>
        </div>
      </div>
    </div>
  )
}

