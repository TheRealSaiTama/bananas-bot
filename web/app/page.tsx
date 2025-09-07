import Link from 'next/link'
import Image from 'next/image'

export const runtime = 'edge'

export default function HomePage() {
  // Mock data for the gallery - replace with actual data as needed
  const galleryItems = Array.from({ length: 9 }, (_, i) => ({
    id: i + 1,
    image: `https://api.builder.io/api/v1/image/assets/TEMP/placeholder-${i + 1}?width=400&height=400`
  }))

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background blur elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Purple blob top right */}
        <div 
          className="absolute w-[506px] h-[526px] rounded-full"
          style={{
            background: '#E622F6',
            filter: 'blur(275px)',
            right: '-261px',
            top: '-221px'
          }}
        />
        
        {/* Blue blob left */}
        <div 
          className="absolute w-[506px] h-[526px] rounded-full"
          style={{
            background: '#38BEFB',
            filter: 'blur(275px)',
            left: '-522px',
            top: '707px'
          }}
        />
        
        {/* Small blue center */}
        <div 
          className="absolute w-[162px] h-[152px] rounded-full"
          style={{
            background: '#646CFC',
            filter: 'blur(150px)',
            left: '593px',
            top: '1027px'
          }}
        />
        
        {/* Orange blob bottom right */}
        <div 
          className="absolute w-[326px] h-[386px] rounded-full"
          style={{
            background: '#FFB21F',
            filter: 'blur(275px)',
            right: '-54px',
            bottom: '0px'
          }}
        />
        
        {/* Purple blob bottom left */}
        <div 
          className="absolute w-[326px] h-[386px] rounded-full"
          style={{
            background: '#D884F2',
            filter: 'blur(275px)',
            left: '-54px',
            bottom: '200px'
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 pt-4 px-5">
        <nav className="flex items-center justify-between h-[92px] px-6 rounded-[20px] border border-black backdrop-blur-[17.5px] bg-transparent">
          <Link href="/" className="flex items-center gap-3">
            <Image 
              src="/logo.png" 
              alt="KISKAX" 
              width={60} 
              height={60} 
              className="rounded-[20px]" 
            />
            <span className="text-white font-semibold text-xl tracking-wide">KISKAX</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-12 text-white">
            <Link href="/" className="hover:opacity-80 transition-opacity">Home</Link>
            <Link href="/playground" className="hover:opacity-80 transition-opacity">Playground</Link>
            <Link href="/about" className="hover:opacity-80 transition-opacity">About</Link>
          </div>
          
          <div className="px-6 py-3 bg-white text-black rounded-lg font-medium">
            BYOK
          </div>
        </nav>
      </header>

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
          <button className="px-8 py-4 rounded-[30px] border border-[#FBC631]/20 bg-[#D9D9D9]/10 text-white text-xl font-light backdrop-blur-sm hover:bg-[#D9D9D9]/20 transition-colors">
            Browse Gallery
          </button>
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
          {galleryItems.map((item) => (
            <div 
              key={item.id}
              className="relative p-5 rounded-[20px] shadow-lg"
              style={{
                background: 'linear-gradient(180deg, #E622F6 0%, #D586F9 15.73%, #38BEFB 63.46%, #9B6CDB 80.77%, #EFBB46 99%)'
              }}
            >
              <div className="w-full aspect-square bg-[#D9D9D9] rounded-[20px] overflow-hidden">
                {/* Placeholder for actual images */}
                <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400"></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 mt-24">
        <div 
          className="mx-5 mb-5 px-6 py-12 rounded-[20px] border border-black backdrop-blur-[17.5px]"
          style={{
            background: 'rgba(212, 212, 212, 0.10)'
          }}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-white text-xl font-light text-center md:text-left">
              Made with Gemini 2.5 Flash · SynthID watermark
            </div>
            
            <div className="text-white text-2xl font-light text-center">
              Calls Left: 142
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-[51px] h-[42px] rounded-[10px] border border-white"></div>
              <Image 
                src="https://api.builder.io/api/v1/image/assets/TEMP/58579014c9145dc142789672ce13e877a475ebe8?width=118"
                alt="GitHub"
                width={59}
                height={59}
                className="rounded-[20px]"
              />
              <div className="text-white text-xl font-light">
                View on GitHub
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
