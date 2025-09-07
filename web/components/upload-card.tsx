"use client"
import { useMemo, useState } from 'react'
import UploadDropzone from '@/components/upload-dropzone'

function hdrs() {
  const h: Record<string, string> = { 'accept': 'application/json' }
  const g = localStorage.getItem('x-gemini-key'); if (g) h['x-gemini-key'] = g
  const f = localStorage.getItem('x-fal-key'); if (f) h['x-fal-key'] = f
  const e = localStorage.getItem('x-elevenlabs-key'); if (e) h['x-elevenlabs-key'] = e
  return h
}

type EditProps = { onResult: (images: string[]) => void }
export function EditCard({ onResult }: EditProps) {
  const [imageUrl, setImageUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [instruction, setInstruction] = useState('')
  const [provider, setProvider] = useState<'gemini' | 'fal'>('gemini')
  const [variants, setVariants] = useState(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setBusy(true); setError(null)
    try {
      let res: Response
      if (imageFile) {
        const fd = new FormData()
        fd.set('instruction', instruction)
        fd.set('provider', provider)
        fd.set('variants', String(variants))
        fd.set('imageFile', imageFile)
        res = await fetch('/api/edit', { method: 'POST', headers: hdrs(), body: fd })
      } else {
        res = await fetch('/api/edit', { method: 'POST', headers: { ...hdrs(), 'content-type': 'application/json' }, body: JSON.stringify({ imageUrl, instruction, provider, variants }) })
      }
      if (!res.ok) {
        const txt = await res.text()
        try {
          const j = JSON.parse(txt)
          throw new Error(j.error || j.message || 'Request failed')
        } catch {
          throw new Error(txt || 'Request failed')
        }
      }
      const j = await res.json()
      const imgs: string[] = j.images || (j.image ? [j.image] : [])
      onResult(imgs)
    } catch (e:any) { setError(e.message || 'Error') } finally { setBusy(false) }
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-neutral-600">Image URL</label>
          <input className="input" value={imageUrl} onChange={(e)=>setImageUrl(e.target.value)} placeholder="https://.../image.png" />
        </div>
        <div>
          <label className="text-xs text-neutral-600">Or Upload</label>
          <UploadDropzone name="imageFile" onFile={setImageFile} />
        </div>
      </div>
      <div>
        <label className="text-xs text-neutral-600">Instruction</label>
        <textarea className="textarea" rows={3} value={instruction} onChange={(e)=>setInstruction(e.target.value)} placeholder="make it night with neon rain" />
      </div>
      <div className="flex items-center gap-3">
        <select className="input w-auto" value={provider} onChange={(e)=>setProvider(e.target.value as any)}>
          <option value="gemini">Gemini</option>
          <option value="fal">Fal.ai</option>
        </select>
        <label className="text-xs">Variants</label>
        <input type="number" className="input w-20" min={1} max={3} value={variants} onChange={(e)=>setVariants(Number(e.target.value))} />
        <button className="btn btn-primary ml-auto" onClick={submit} disabled={busy}>{busy ? 'Working…' : 'Generate'}</button>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
    </div>
  )
}

type BlendProps = { onResult: (image: string) => void }
export function BlendCard({ onResult }: BlendProps) {
  const [baseUrl, setBaseUrl] = useState('')
  const [refUrl, setRefUrl] = useState('')
  const [baseFile, setBaseFile] = useState<File | null>(null)
  const [refFile, setRefFile] = useState<File | null>(null)
  const [instruction, setInstruction] = useState('')
  const [provider, setProvider] = useState<'gemini' | 'fal'>('gemini')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setBusy(true); setError(null)
    try {
      let res: Response
      if (baseFile && refFile) {
        const fd = new FormData()
        fd.set('instruction', instruction)
        fd.set('provider', provider)
        fd.set('baseFile', baseFile)
        fd.set('refFile', refFile)
        res = await fetch('/api/blend', { method: 'POST', headers: hdrs(), body: fd })
      } else {
        res = await fetch('/api/blend', { method: 'POST', headers: { ...hdrs(), 'content-type': 'application/json' }, body: JSON.stringify({ baseUrl, refUrl, instruction, provider }) })
      }
      if (!res.ok) throw new Error('Request failed')
      const j = await res.json() as { image: string }
      onResult(j.image)
    } catch (e:any) { setError(e.message || 'Error') } finally { setBusy(false) }
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-neutral-600">Base URL</label>
          <input className="input" value={baseUrl} onChange={(e)=>setBaseUrl(e.target.value)} placeholder="https://.../base.png" />
        </div>
        <div>
          <label className="text-xs text-neutral-600">Base Upload</label>
          <UploadDropzone name="baseFile" onFile={setBaseFile} />
        </div>
        <div>
          <label className="text-xs text-neutral-600">Reference URL</label>
          <input className="input" value={refUrl} onChange={(e)=>setRefUrl(e.target.value)} placeholder="https://.../ref.png" />
        </div>
        <div>
          <label className="text-xs text-neutral-600">Reference Upload</label>
          <UploadDropzone name="refFile" onFile={setRefFile} />
        </div>
      </div>
      <div>
        <label className="text-xs text-neutral-600">Instruction</label>
        <textarea className="textarea" rows={3} value={instruction} onChange={(e)=>setInstruction(e.target.value)} placeholder="apply this pattern to the jacket; match lighting" />
      </div>
      <div className="flex items-center gap-3">
        <select className="input w-auto" value={provider} onChange={(e)=>setProvider(e.target.value as any)}>
          <option value="gemini">Gemini</option>
          <option value="fal">Fal.ai</option>
        </select>
        <button className="btn btn-primary ml-auto" onClick={submit} disabled={busy}>{busy ? 'Working…' : 'Blend'}</button>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
    </div>
  )
}

type ComicProps = { onResult: (montage: string, panels: string[]) => void }
export function ComicCard({ onResult }: ComicProps) {
  const [personaUrl, setPersonaUrl] = useState('')
  const [personaFile, setPersonaFile] = useState<File | null>(null)
  const [style, setStyle] = useState('comic')
  const [panels, setPanels] = useState<string[]>(['','','',''])
  const [provider, setProvider] = useState<'gemini' | 'fal'>('gemini')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setBusy(true); setError(null)
    try {
      let res: Response
      if (personaFile) {
        const fd = new FormData()
        fd.set('style', style)
        fd.set('provider', provider)
        fd.set('panels', JSON.stringify(panels))
        fd.set('personaFile', personaFile)
        res = await fetch('/api/comic', { method: 'POST', headers: hdrs(), body: fd })
      } else {
        res = await fetch('/api/comic', { method: 'POST', headers: { ...hdrs(), 'content-type': 'application/json' }, body: JSON.stringify({ personaUrl, style, panels, provider }) })
      }
      if (!res.ok) {
        const txt = await res.text(); throw new Error(txt || 'Request failed')
      }
      const j = await res.json() as { montagePng?: string, panels: string[] }
      const montage = j.montagePng && j.montagePng.length > 0 ? j.montagePng : await composeMontage(j.panels)
      onResult(montage, j.panels)
    } catch (e:any) { setError(e.message || 'Error') } finally { setBusy(false) }
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-neutral-600">Persona URL</label>
          <input className="input" value={personaUrl} onChange={(e)=>setPersonaUrl(e.target.value)} placeholder="https://.../face.png" />
        </div>
        <div>
          <label className="text-xs text-neutral-600">Persona Upload</label>
          <UploadDropzone name="personaFile" onFile={setPersonaFile} />
        </div>
      </div>
      <div>
        <label className="text-xs text-neutral-600">Style</label>
        <input className="input" value={style} onChange={(e)=>setStyle(e.target.value)} placeholder="manga, watercolor, cyberpunk..." />
      </div>
      {[0,1,2,3].map(i => (
        <div key={i}>
          <label className="text-xs text-neutral-600">Panel {i+1} text</label>
          <input className="input" value={panels[i] || ''} onChange={(e)=>{
            const copy = panels.slice(); copy[i] = e.target.value; setPanels(copy)
          }} placeholder="a short action/scene" />
        </div>
      ))}
      <div className="flex items-center gap-3">
        <select className="input w-auto" value={provider} onChange={(e)=>setProvider(e.target.value as any)}>
          <option value="gemini">Gemini</option>
          <option value="fal">Fal.ai</option>
        </select>
        <button className="btn btn-primary ml-auto" onClick={submit} disabled={busy}>{busy ? 'Working…' : 'Make Comic'}</button>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
    </div>
  )
}

async function composeMontage(panels: string[]): Promise<string> {
  const imgs = await Promise.all(panels.slice(0,4).map(loadImage))
  const tileW = Math.min(...imgs.map(i => i.width))
  const tileH = Math.min(...imgs.map(i => i.height))
  const canvas = document.createElement('canvas')
  canvas.width = tileW * 2; canvas.height = tileH * 2
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height)
  ctx.drawImage(imgs[0], 0, 0, tileW, tileH)
  if (imgs[1]) ctx.drawImage(imgs[1], tileW, 0, tileW, tileH)
  if (imgs[2]) ctx.drawImage(imgs[2], 0, tileH, tileW, tileH)
  if (imgs[3]) ctx.drawImage(imgs[3], tileW, tileH, tileW, tileH)
  return canvas.toDataURL('image/png')
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = (e) => reject(e)
    img.crossOrigin = 'anonymous'
    img.src = src
  })
}

// Try-On: place an item (sunglasses, shirt, shoes, etc.) onto the person in the base image.
type TryOnProps = { onResult: (image: string) => void }
export function TryOnCard({ onResult }: TryOnProps) {
  const [baseUrl, setBaseUrl] = useState('')
  const [itemUrl, setItemUrl] = useState('')
  const [baseFile, setBaseFile] = useState<File | null>(null)
  const [itemFile, setItemFile] = useState<File | null>(null)
  const [category, setCategory] = useState<'sunglasses'|'glasses'|'necklace'|'shirt'|'tshirt'|'jacket'|'hat'|'earrings'|'watch'|'bracelet'|'ring'|'shoes'>('sunglasses')
  const [notes, setNotes] = useState('')
  // Gemini-only for now (needs two-image blend). Fal route here would ignore the item image.
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setBusy(true); setError(null)
    try {
      let res: Response
      if (baseFile && itemFile) {
        const fd = new FormData()
        fd.set('category', category)
        fd.set('notes', notes)
        fd.set('provider', 'gemini')
        fd.set('baseFile', baseFile)
        fd.set('itemFile', itemFile)
        res = await fetch('/api/tryon', { method: 'POST', headers: hdrs(), body: fd })
      } else {
        res = await fetch('/api/tryon', { method: 'POST', headers: { ...hdrs(), 'content-type': 'application/json' }, body: JSON.stringify({ baseUrl, itemUrl, category, notes, provider: 'gemini' }) })
      }
      if (!res.ok) throw new Error(await res.text())
      const j = await res.json() as { image: string }
      onResult(j.image)
    } catch (e:any) { setError(e.message || 'Error') } finally { setBusy(false) }
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-neutral-600">Base URL</label>
          <input className="input" value={baseUrl} onChange={(e)=>setBaseUrl(e.target.value)} placeholder="https://.../base.png" />
        </div>
        <div>
          <label className="text-xs text-neutral-600">Base Upload</label>
          <UploadDropzone name="baseFile" onFile={setBaseFile} />
        </div>
        <div>
          <label className="text-xs text-neutral-600">Item URL</label>
          <input className="input" value={itemUrl} onChange={(e)=>setItemUrl(e.target.value)} placeholder="https://.../item.png (transparent preferred)" />
        </div>
        <div>
          <label className="text-xs text-neutral-600">Item Upload</label>
          <UploadDropzone name="itemFile" onFile={setItemFile} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div>
          <label className="text-xs text-neutral-600">Category</label>
          <select className="input w-full" value={category} onChange={(e)=>setCategory(e.target.value as any)}>
            <option value="sunglasses">Sunglasses</option>
            <option value="glasses">Glasses</option>
            <option value="necklace">Necklace</option>
            <option value="shirt">Shirt</option>
            <option value="tshirt">T‑Shirt</option>
            <option value="jacket">Jacket</option>
            <option value="hat">Hat</option>
            <option value="earrings">Earrings</option>
            <option value="watch">Watch</option>
            <option value="bracelet">Bracelet</option>
            <option value="ring">Ring</option>
            <option value="shoes">Shoes</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="text-xs text-neutral-600">Notes (optional)</label>
          <input className="input" value={notes} onChange={(e)=>setNotes(e.target.value)} placeholder="e.g., gold rim; medium size; align to eyes; subtle shadow" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-neutral-600">Provider: Gemini (Nano Banana)</span>
        <button className="btn btn-primary ml-auto" onClick={submit} disabled={busy}>{busy ? 'Working…' : 'Try On'}</button>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
    </div>
  )
}
