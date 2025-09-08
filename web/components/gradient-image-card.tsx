type Props = {
  pngUrl: string
  mp3Url?: string
  instruction?: string
}

export default function GradientImageCard({ pngUrl, instruction }: Props) {
  return (
    <div
      className="relative p-5 rounded-[20px] shadow-lg"
      style={{
        background:
          'linear-gradient(180deg, #E622F6 0%, #D586F9 15.73%, #38BEFB 63.46%, #9B6CDB 80.77%, #EFBB46 99%)',
      }}
    >
      <a href={pngUrl} target="_blank" rel="noreferrer" title={instruction || 'View full'}>
        <div className="w-full aspect-square bg-black/40 rounded-[20px] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pngUrl}
            alt={instruction || 'Gallery image'}
            className="w-full h-full object-cover"
          />
        </div>
      </a>
    </div>
  )
}

