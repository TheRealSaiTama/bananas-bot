type Props = { images: string[] }

export default function VariantGrid({ images }: Props) {
  const cols = images.length === 1 ? 'grid-cols-1' : images.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
  return (
    <div className={`grid ${cols} gap-3`}>
      {images.map((src, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-neutral-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={`variant ${i+1}`} className="w-full h-auto max-h-[720px] object-contain" />
        </div>
      ))}
    </div>
  )
}
