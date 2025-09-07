import ImageCard from '@/components/image-card'
import { listGallery } from '@/lib/github'

export const runtime = 'edge'

export default async function HomePage() {
  const items = await listGallery()
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Gallery</h1>
        <a href="/playground" className="btn btn-primary">Try Playground</a>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((it, idx) => (
          <ImageCard key={idx} pngUrl={it.pngUrl} mp3Url={it.mp3Url} meta={it.meta} />
        ))}
      </div>
    </div>
  )
}

