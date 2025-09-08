import Link from 'next/link'
import Image from 'next/image'
import Footer from '@/components/footer'
import GradientImageCard from '@/components/gradient-image-card'
import { listGallery } from '@/lib/github'

export const runtime = 'edge'
export const revalidate = 60

export default async function HomePage() {
  let items: Array<{ pngUrl: string; mp3Url?: string; meta?: any }> = []
  try {
    items = await listGallery()
  } catch {
    items = []
  }

  return (
    <div className="min-h-screen relative overflow-hidden">

      {/* Hero Section */}
      <section className="relative z-10 px-5 pt-24 pb-16 text-center">
        <h1 className="text-6xl md:text-8xl lg:text-[96px] font-bold leading-tight mb-12 max-w-[893px] mx-auto">
          <span className="text-white">Edit, blend, and try on items with </span>
          <span 
            className="bg-gradient-to-r from-[#E622F6CC] via-[#6FC0C2] via-[#D040EC] via-[#6FC0C2] to-[#FBC631] bg-clip-text text-transparent"
            style={{
              background: 'linear-gradient(90deg, rgba(230, 34, 246, 0.80) 31.73%, #6FC0C2 57.21%, #D040EC 82.21%, #6FC0C2 99.98%, #FBC631 99.99%, #38BEFB 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            AI
          </span>
        </h1>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link href="/gallery" className="px-8 py-4 rounded-[30px] border border-[#FBC631]/20 bg-[#D9D9D9]/10 text-white text-xl font-light backdrop-blur-sm hover:bg-[#D9D9D9]/20 transition-colors">
            Browse Gallery
          </Link>
          <Link href="/playground" className="text-white text-xl font-light underline hover:opacity-80 transition-opacity">
            Start Creating
          </Link>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="relative z-10 px-5 py-16">
        <div className="text-center mb-12">
          <h2 
            className="text-4xl md:text-6xl lg:text-[64px] font-bold mb-12"
            style={{
              background: 'linear-gradient(90deg, rgba(230, 34, 246, 0.80) 8.65%, #38BEFB 25.96%, #FBC631 64.42%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            <span 
              className="bg-gradient-to-r from-[#E622F6CC] via-[#38BEFB] to-[#FBC631] bg-clip-text text-transparent"
            >
              View our Gallery
            </span>
            <span className="text-white"> of AI Photos</span>
          </h2>
          
          {/* Filter Controls */}
          <div className="flex items-center justify-center gap-16 mb-16">
            <span className="text-white text-2xl font-light">Mode</span>
            <span className="text-white text-2xl font-light">Provider</span>
            <span className="text-white text-2xl font-light">Sort</span>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-[1440px] mx-auto">
          {items.length > 0 ? (
            items.map((it, idx) => (
              <GradientImageCard key={it.pngUrl + idx} pngUrl={it.pngUrl} instruction={it.meta?.instruction} />
            ))
          ) : (
            <div className="text-white/70 col-span-full text-center">No images yet — generate some in the Playground!</div>
          )}
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
