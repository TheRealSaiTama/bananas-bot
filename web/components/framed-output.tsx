type Props = {
  src: string
  alt?: string
  downloadName?: string
  maxHClass?: string // Tailwind class for max height, defaults to 720px
}

export default function FramedOutput({ src, alt = 'output', downloadName = 'image.png', maxHClass = 'max-h-[720px]' }: Props) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="p-3 rounded-[20px]" style={{ background: 'linear-gradient(180deg, #E622F6 0%, #D586F9 15.73%, #38BEFB 63.46%, #9B6CDB 80.77%, #EFBB46 99%)' }}>
        <div className="rounded-[16px] overflow-hidden bg-black/40 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} className={`w-auto h-auto ${maxHClass} max-w-full`} />
        </div>
      </div>
      <div className="mt-2 text-right">
        <a href={src} download={downloadName} className="text-xs underline text-white/80 hover:text-white">Download PNG</a>
      </div>
    </div>
  )
}

