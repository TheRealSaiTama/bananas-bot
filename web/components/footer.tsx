"use client"
import { useState, useEffect } from 'react'

export default function Footer() {
  const [callsLeft, setCallsLeft] = useState<string>("")
  useEffect(() => {
    const v = localStorage.getItem('calls-left') || ''
    setCallsLeft(v)
  }, [])
  return (
    <footer className="border-t border-neutral-200 py-6 text-sm text-neutral-600">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div>
          <span>Made with Gemini 2.5 Flash Image · SynthID watermark</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs">Calls left today</label>
          <input
            className="input h-8 w-24"
            value={callsLeft}
            onChange={(e) => {
              setCallsLeft(e.target.value)
              localStorage.setItem('calls-left', e.target.value)
            }}
          />
        </div>
      </div>
    </footer>
  )
}

