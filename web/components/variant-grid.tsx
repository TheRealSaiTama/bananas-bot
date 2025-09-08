type Props = { images: string[] }

export default function VariantGrid({ images }: Props) {
  const cols = images.length === 1 ? 'grid-cols-1' : images.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
  return (
    <div className={`grid ${cols} gap-6`}>
      {images.map((src, i) => (
        <div key={i} className="relative group">
          <div
            className="p-3 rounded-[20px]"
            style={{
              background:
                'linear-gradient(180deg, #E622F6 0%, #D586F9 15.73%, #38BEFB 63.46%, #9B6CDB 80.77%, #EFBB46 99%)',
            }}
          >
            <div className="w-full bg-black/40 rounded-[16px] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`variant ${i + 1}`} className="w-full h-full object-contain" />
            </div>
          </div>
          <a
            href={src}
            download={`variant-${i + 1}.png`}
            className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 text-xs bg-black/70 text-white rounded-md px-2 py-1"
          >
            Download
          </a>
        </div>
      ))}
    </div>
  )
}
