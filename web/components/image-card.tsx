"use client"
import { useRef, useState } from 'react'
import ProviderBadge from '@/components/provider-badge'

type Props = {
  pngUrl: string
  mp3Url?: string
  meta?: { instruction?: string; mode?: string; provider?: string }
}

export default function ImageCard({ pngUrl, mp3Url, meta }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  return (
    <div className="card overflow-hidden">
      <a href={pngUrl} target="_blank" rel="noreferrer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={pngUrl} alt={meta?.instruction || 'Output'} className="w-full object-cover"/>
      </a>
      <div className="p-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <ProviderBadge provider={(meta?.provider as any) || undefined} />
          {meta?.mode && <span className="badge" title={`Mode: ${meta.mode}`}>{meta.mode}</span>}
        </div>
        {mp3Url && (
          <button className="btn" onClick={() => {
            const a = audioRef.current
            if (!a) return
            if (!playing) { a.play(); setPlaying(true) } else { a.pause(); setPlaying(false) }
          }}>{playing ? 'Pause' : 'Play'}</button>
        )}
      </div>
      {meta?.instruction && (
        <div className="px-3 pb-3">
          <p className="text-xs text-neutral-600 truncate" title={meta.instruction}>“{meta.instruction}”</p>
        </div>
      )}
      <div className="px-3 pb-3 text-[11px] text-neutral-500">Transparency: Made with Gemini 2.5 Flash Image · SynthID watermark.</div>
      {mp3Url && <audio ref={audioRef} src={mp3Url} onEnded={() => setPlaying(false)} />}
    </div>
  )}

