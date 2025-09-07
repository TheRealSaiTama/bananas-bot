export const runtime = 'edge'

export default function PrivacyPage() {
  return (
    <div className="prose max-w-none">
      <h1>Privacy</h1>
      <p>
        We do not collect personal data. For the Playground, you may provide API keys for Gemini, Fal.ai, and ElevenLabs. These are stored only in your browser <strong>localStorage</strong> and are sent with each API request via custom headers. The server processes requests using only the provided headers and does not log or persist keys.
      </p>
      <p>
        No analytics or tracking cookies are used. See the Cookies page for details on functional storage.
      </p>
      <ul>
        <li><a href="https://ai.google.dev/">Gemini API policies</a></li>
        <li><a href="https://fal.ai">Fal.ai</a></li>
        <li><a href="https://elevenlabs.io">ElevenLabs</a></li>
      </ul>
    </div>
  )
}

