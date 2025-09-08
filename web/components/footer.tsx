"use client"
import { useState, useEffect } from 'react'

export default function Footer() {
  const [callsLeft, setCallsLeft] = useState<string>("")
  useEffect(() => {
    const v = localStorage.getItem('calls-left') || ''
    setCallsLeft(v)
  }, [])
  return (
    <footer className="relative z-10 mt-24">
      <div
        className="mx-5 mb-5 px-6 py-6 md:py-8 rounded-[20px] border border-black/60 backdrop-blur-[17.5px]"
        style={{
          background: 'rgba(212, 212, 212, 0.10)'
        }}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-sm">
          <div className="text-white/90 text-center md:text-left">
            Made with Gemini 2.5 Flash Image — outputs include SynthID watermark.
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/80 text-xs">Calls Left:</span>
            <input
              className="input h-8 w-28"
              value={callsLeft}
              onChange={(e) => {
                setCallsLeft(e.target.value)
                localStorage.setItem('calls-left', e.target.value)
              }}
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-[51px] h-[42px] rounded-[10px] border border-white/30" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://api.builder.io/api/v1/image/assets/TEMP/58579014c9145dc142789672ce13e877a475ebe8?width=118"
              alt="GitHub"
              className="h-[42px] w-[42px] rounded-[10px]"
            />
            <a href="https://github.com/TheRealSaiTama/bananas-bot" target="_blank" rel="noreferrer" className="text-white/90 hover:text-white">View on GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
