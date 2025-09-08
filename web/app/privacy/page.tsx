import Footer from '@/components/footer'

export const runtime = 'edge'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold mb-4">
            <span className="text-white">Privacy</span>
          </h1>
          <p className="text-white/90 mb-4">
            We do not collect personal data. For the Playground, you may provide API keys for Gemini, Fal.ai, and ElevenLabs. These are stored only in your browser <strong>localStorage</strong> and are sent with each API request via custom headers. The server processes requests using only the provided headers and does not log or persist keys.
          </p>
          <p className="text-white/80 mb-4">
            No analytics or tracking cookies are used. See the Cookies page for details on functional storage.
          </p>
          <ul className="list-disc pl-6 text-white/80">
            <li><a className="underline hover:opacity-80" href="https://ai.google.dev/">Gemini API policies</a></li>
            <li><a className="underline hover:opacity-80" href="https://fal.ai">Fal.ai</a></li>
            <li><a className="underline hover:opacity-80" href="https://elevenlabs.io">ElevenLabs</a></li>
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  )
}
