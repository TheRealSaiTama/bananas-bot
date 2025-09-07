"use client"
import { useEffect, useMemo, useState } from 'react'

type Keys = { gemini?: string; fal?: string; eleven?: string; voiceId?: string }

function mask(v?: string) {
  if (!v) return ''
  if (v.length <= 4) return '••••'
  return v.slice(0, 2) + '••••' + v.slice(-2)
}

function validGemini(k?: string) { return !!k && /^(AIza|[A-Za-z0-9_-]{20,})/.test(k) }
function validFal(k?: string) { return !k || /^fal_/.test(k) || k.length > 20 }
function valid11(k?: string) { return !k || k.length > 10 }

export default function BYOKDrawer() {
  const [open, setOpen] = useState(false)
  const [reveal, setReveal] = useState(false)
  const [keys, setKeys] = useState<Keys>({})
  const [status, setStatus] = useState<string>('')
  const [err, setErr] = useState<string>('')

  useEffect(() => {
    const k: Keys = {
      gemini: localStorage.getItem('x-gemini-key') || undefined,
      fal: localStorage.getItem('x-fal-key') || undefined,
      eleven: localStorage.getItem('x-elevenlabs-key') || undefined,
      voiceId: localStorage.getItem('voice-id') || '21m00Tcm4TlvDq8ikWAM',
    }
    setKeys(k)
  }, [])

  const masked = useMemo(() => ({
    gemini: reveal ? (keys.gemini || '') : mask(keys.gemini),
    fal: reveal ? (keys.fal || '') : mask(keys.fal),
    eleven: reveal ? (keys.eleven || '') : mask(keys.eleven),
    voiceId: keys.voiceId || '',
  }), [keys, reveal])

  const save = () => {
    if (keys.gemini) localStorage.setItem('x-gemini-key', keys.gemini)
    if (keys.fal) localStorage.setItem('x-fal-key', keys.fal)
    if (keys.eleven) localStorage.setItem('x-elevenlabs-key', keys.eleven)
    if (keys.voiceId) localStorage.setItem('voice-id', keys.voiceId)
    setStatus('Saved')
    setTimeout(() => setStatus(''), 1500)
  }

  const clear = () => {
    localStorage.removeItem('x-gemini-key')
    localStorage.removeItem('x-fal-key')
    localStorage.removeItem('x-elevenlabs-key')
    localStorage.removeItem('voice-id')
    setKeys({})
    setStatus('Cleared')
    setTimeout(() => setStatus(''), 1500)
  }

  async function testGemini() {
    setErr(''); setStatus('Testing Gemini…')
    try {
      const fd = new FormData()
      // Use a benign yet non-empty edit instruction to increase chance of success
      fd.set('instruction', 'increase contrast slightly; keep content unchanged')
      // small 1x1 transparent PNG
      const b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mO0WQ8AAgIBB4G5cAcAAAAASUVORK5CYII='
      const blob = new Blob([Uint8Array.from(atob(b64).split('').map(c => c.charCodeAt(0)))], { type: 'image/png' })
      const file = new File([blob], 'pixel.png', { type: 'image/png' })
      fd.set('imageFile', file)
      const res = await fetch('/api/edit', { method: 'POST', headers: headersFromLocal(), body: fd })
      if (!res.ok) {
        const txt = await res.text()
        try { const j = JSON.parse(txt); throw new Error(j.error || j.message || 'Non-200') }
        catch { throw new Error(txt || 'Non-200') }
      }
      setStatus('Gemini OK')
    } catch (e:any) { setErr(e?.message || 'Gemini test failed'); setStatus('') }
  }

  async function test11() {
    setErr(''); setStatus('Testing ElevenLabs…')
    try {
      const res = await fetch('/api/tts', { method: 'POST', headers: { 'content-type': 'application/json', ...headersFromLocal() }, body: JSON.stringify({ text: 'test', voiceId: keys.voiceId || '21m00Tcm4TlvDq8ikWAM' }) })
      if (!res.ok) throw new Error('Non-200')
      setStatus('ElevenLabs OK')
    } catch { setErr('ElevenLabs test failed'); setStatus('') }
  }

  return (
    <>
      <button className="btn h-9 px-4 rounded-xl bg-black text-white border border-white/20 hover:bg-neutral-900" onClick={() => setOpen(true)}>BYOK</button>
      {open && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-[440px] bg-white shadow-xl p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Bring Your Own Keys</h2>
              <button className="btn btn-ghost" onClick={() => setOpen(false)}>Close</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-neutral-600">Gemini API Key</label>
                <input className={`input ${validGemini(keys.gemini)?'':'border-red-300'}`} placeholder="AIza..." value={masked.gemini} onChange={(e)=>setKeys(k=>({...k, gemini:e.target.value}))} onFocus={()=>setReveal(true)} onBlur={()=>{ setReveal(false) }} />
                {!validGemini(keys.gemini) && <div className="text-xs text-red-600 mt-1">Looks invalid</div>}
              </div>
              <div>
                <label className="text-xs text-neutral-600">Fal.ai API Key (optional)</label>
                <input className={`input ${validFal(keys.fal)?'':'border-red-300'}`} placeholder="fal_sk_..." value={masked.fal} onChange={(e)=>setKeys(k=>({...k, fal:e.target.value}))} onFocus={()=>setReveal(true)} onBlur={()=>setReveal(false)} />
              </div>
              <div>
                <label className="text-xs text-neutral-600">ElevenLabs API Key (optional)</label>
                <input className={`input ${valid11(keys.eleven)?'':'border-red-300'}`} placeholder="eleven_..." value={masked.eleven} onChange={(e)=>setKeys(k=>({...k, eleven:e.target.value}))} onFocus={()=>setReveal(true)} onBlur={()=>setReveal(false)} />
              </div>
              <div>
                <label className="text-xs text-neutral-600">ElevenLabs Voice ID</label>
                <input className="input" placeholder="21m00Tcm4TlvDq8ikWAM (Rachel)" value={keys.voiceId || ''} onChange={(e)=>setKeys(k=>({...k, voiceId:e.target.value}))} />
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn" onClick={testGemini}>Test Gemini</button>
              <button className="btn" onClick={test11}>Test ElevenLabs</button>
              <button className="btn" onClick={() => { setReveal(true); setTimeout(()=>setReveal(false), 5000) }}>Reveal 5s</button>
            </div>
            <div className="mt-auto flex gap-2">
              <button className="btn" onClick={clear}>Clear</button>
              <button className="btn btn-primary ml-auto" onClick={save}>Save</button>
            </div>
            <p className="text-xs text-neutral-500">Keys live only in your browser; we don’t store them.</p>
            {status && <div className="text-xs text-green-700">{status}</div>}
            {err && <div className="text-xs text-red-600">{err}</div>}
          </div>
        </div>
      )}
    </>
  )
}

function headersFromLocal() {
  const h: Record<string,string> = {}
  const g = localStorage.getItem('x-gemini-key'); if (g) h['x-gemini-key'] = g
  const f = localStorage.getItem('x-fal-key'); if (f) h['x-fal-key'] = f
  const e = localStorage.getItem('x-elevenlabs-key'); if (e) h['x-elevenlabs-key'] = e
  return h
}
