type Props = { images: string[] }

export default function Montage2x2({ images }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {images.slice(0,4).map((src, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-neutral-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={`panel ${i+1}`} className="w-full h-full object-cover" />
        </div>
      ))}
    </div>
  )
}

