import GradientImageCard from '@/components/gradient-image-card'
import { listGallery } from '@/lib/github'

export const runtime = 'edge'
export const revalidate = 60

export default async function GalleryPage() {
  let items: Array<{ pngUrl: string; mp3Url?: string; meta?: any }> = []
  try { items = await listGallery() } catch { items = [] }
  return (
    <div className="min-h-screen relative overflow-hidden">
      <section className="relative z-10 px-5 pt-16 pb-6 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          <span className="bg-gradient-to-r from-[#E622F6CC] via-[#38BEFB] to-[#FBC631] bg-clip-text text-transparent">Gallery</span>
        </h1>
        <p className="text-white/80 max-w-2xl mx-auto">Latest creations from the bot’s GitHub repo. Click any image to open the full PNG.</p>
      </section>
      <section className="relative z-10 px-5 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-[1440px] mx-auto">
          {items.length > 0 ? (
            items.map((it, idx) => (
              <GradientImageCard key={it.pngUrl + idx} pngUrl={it.pngUrl} instruction={it.meta?.instruction} />
            ))
          ) : (
            <div className="text-white/70 col-span-full text-center">No images yet — try the Playground!</div>
          )}
        </div>
      </section>
    </div>
  )
}

