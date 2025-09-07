import Header from '@/components/header'
import Footer from '@/components/footer'

export const runtime = 'edge'

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="prose max-w-none">
          <h1>About</h1>
          <p>
            This site surfaces outputs from a Reddit bot that posts PNGs (and optional MP3 narration) to a GitHub repo, and lets you try Gemini 2.5 Flash Image (aka "Nano Banana") features: edits, multi-image fusion, and character consistency. Images are watermarked with SynthID.
          </p>
          <p>
            The Playground supports Bring-Your-Own-Key (BYOK) for Gemini, Fal.ai, and ElevenLabs. Keys are stored only in your browser localStorage and sent with each request; the server never persists them.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
