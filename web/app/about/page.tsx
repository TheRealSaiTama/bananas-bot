import Footer from '@/components/footer'

export const runtime = 'edge'

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold mb-4">
            <span className="text-white">About </span>
            <span className="bg-gradient-to-r from-[#E622F6CC] via-[#38BEFB] to-[#FBC631] bg-clip-text text-transparent">KISKAX</span>
          </h1>
          <p className="text-white/90 mb-4">
            This site surfaces outputs from a Reddit bot that posts PNGs (and optional MP3 narration) to a GitHub repo, and lets you try Gemini 2.5 Flash Image (aka "Nano Banana") features: edits, multi-image fusion, character consistency, and try‑on. Images are watermarked with SynthID.
          </p>
          <p className="text-white/80">
            The Playground supports Bring‑Your‑Own‑Key (BYOK) for Gemini, Fal.ai, and ElevenLabs. Keys are stored only in your browser localStorage and sent with each request; the server never persists them.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
