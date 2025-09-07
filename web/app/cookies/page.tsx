export const runtime = 'edge'

export default function CookiesPage() {
  return (
    <div className="prose max-w-none">
      <h1>Cookies</h1>
      <p>
        This site uses functional storage only:
      </p>
      <ul>
        <li>localStorage for BYOK (Gemini, Fal.ai, ElevenLabs keys; optional voice id)</li>
        <li>localStorage for cookie consent state</li>
        <li>Optional “calls left today” value in the footer</li>
      </ul>
      <p>
        No third-party tracking cookies or analytics are used.
      </p>
    </div>
  )
}

