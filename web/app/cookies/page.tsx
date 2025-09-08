import Footer from '@/components/footer'

export const runtime = 'edge'

export default function CookiesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold mb-4">
            <span className="text-white">Cookies</span>
          </h1>
          <p className="text-white/90 mb-4">This site uses functional storage only:</p>
          <ul className="list-disc pl-6 text-white/80 mb-4">
            <li>localStorage for BYOK (Gemini, Fal.ai, ElevenLabs keys; optional voice id)</li>
            <li>localStorage for cookie consent state</li>
            <li>Optional "calls left today" value in the footer</li>
          </ul>
          <p className="text-white/80">No third‑party tracking cookies or analytics are used.</p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
