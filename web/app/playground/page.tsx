"use client"
import { useEffect, useState } from 'react'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { EditCard, BlendCard, ComicCard, TryOnCard } from '@/components/upload-card'
import VariantGrid from '@/components/variant-grid'
import Montage2x2 from '@/components/montage-2x2'

type Provider = 'gemini' | 'fal'

export default function PlaygroundPage() {
  const [tab, setTab] = useState<'edit' | 'blend' | 'tryon' | 'comic'>('edit')
  const [variants, setVariants] = useState<string[]>([])
  const [blendImage, setBlendImage] = useState<string | null>(null)
  const [tryOnImage, setTryOnImage] = useState<string | null>(null)
  const [comicPanels, setComicPanels] = useState<string[]>([])
  const [comicMontage, setComicMontage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { setError(null) }, [tab])

  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="space-y-6">
          <h1 className="text-xl font-semibold">Nano Banana Playground</h1>
          <div className="flex gap-2">
            <button className={`btn ${tab==='edit'?'btn-primary':''}`} onClick={()=>setTab('edit')}>Edit</button>
            <button className={`btn ${tab==='blend'?'btn-primary':''}`} onClick={()=>setTab('blend')}>Blend</button>
            <button className={`btn ${tab==='tryon'?'btn-primary':''}`} onClick={()=>setTab('tryon')}>Try On</button>
            <button className={`btn ${tab==='comic'?'btn-primary':''}`} onClick={()=>setTab('comic')}>Comic</button>
          </div>

          {tab === 'edit' && (
            <EditCard onResult={(imgs) => setVariants(imgs)} />
          )}

          {tab === 'blend' && (
            <BlendCard onResult={(img) => setBlendImage(img)} />
          )}

          {tab === 'tryon' && (
            <TryOnCard onResult={(img) => setTryOnImage(img)} />
          )}

          {tab === 'comic' && (
            <ComicCard onResult={(montage, panels) => { setComicMontage(montage); setComicPanels(panels) }} />
          )}

          {busy && <div className="text-sm text-neutral-500">Working...</div>}
          {error && <div className="text-sm text-red-600">{error}</div>}

          {tab === 'edit' && variants.length > 0 && (
            <VariantGrid images={variants} />
          )}
          {tab === 'blend' && blendImage && (
            <div className="card p-2"><img src={blendImage} alt="blend" className="w-full h-auto max-h-[720px] object-contain rounded-xl mx-auto" /></div>
          )}
          {tab === 'tryon' && tryOnImage && (
            <div className="card p-2"><img src={tryOnImage} alt="try-on" className="w-full h-auto max-h-[720px] object-contain rounded-xl mx-auto" /></div>
          )}
          {tab === 'comic' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {comicMontage && (
                <div className="card p-3">
                  <h3 className="font-medium mb-2">Montage (2×2)</h3>
                  <img src={comicMontage} alt="montage" className="w-full h-auto max-h-[720px] object-contain rounded-xl mx-auto" />
                </div>
              )}
              {comicPanels.length === 4 && (
                <div className="card p-3">
                  <h3 className="font-medium mb-2">Panels</h3>
                  <Montage2x2 images={comicPanels} />
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
