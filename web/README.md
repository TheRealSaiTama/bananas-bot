# Bananas Bot — Nano Banana Playground

A minimal Next.js (App Router) + Tailwind site styled like shadcn/ui that:

- Shows a GitHub-backed gallery of your Reddit bot’s outputs (PNG + optional MP3).
- Lets users try Gemini 2.5 Flash Image (aka “Nano Banana”) with Edit, Blend, and Comic tabs.
- Supports BYOK (bring-your-own-key) for Gemini, Fal.ai (optional), and ElevenLabs (optional) — keys live only in localStorage and are sent as headers per request.
- Includes cookie banner, Privacy, and Cookies pages.

Transparency: Images generated with Gemini 2.5 Flash Image carry a SynthID watermark.

## Quick start

1) Install dependencies

```
cd web
npm install
```

2) Configure non-secret env

```
cp .env.example .env.local
# adjust NEXT_PUBLIC_GALLERY_REPO, GALLERY_BRANCH, NEXT_PUBLIC_SITE_TITLE as desired
```

3) Run locally

```
npm run dev
```

4) BYOK

- Click the “BYOK” drawer in the header and paste your keys:
  - Gemini: used for Edit / Blend / Comic
  - Fal.ai: optional provider for Edit / Blend
  - ElevenLabs: for TTS route (not needed for gallery MP3s)
- Keys are stored only in localStorage and sent via `x-gemini-key`, `x-fal-key`, `x-elevenlabs-key` headers.

## Deploy to Vercel

- Deploy the `web/` subdirectory.
- Configure “Root Directory” to `web` in Vercel’s project settings.
- No server-side secrets needed (BYOK lives fully client-side).

## API routes

- `GET /api/gallery`: lists PNGs from `NEXT_PUBLIC_GALLERY_REPO` via GitHub Contents API, pairing MP3 and `.meta.json` sidecars if found.
- `POST /api/edit`: `{ imageUrl, instruction, provider }` → `{ image: dataUrl }`
- `POST /api/blend`: `{ baseUrl, refUrl, instruction, provider }` → `{ image: dataUrl }`
- `POST /api/comic`: `{ personaUrl, style, panels[4] }` → `{ montagePng, panels[] }`
- `POST /api/tts`: `{ text, voiceId }` → MP3 bytes

## Libraries

- Next.js App Router (TypeScript)
- Tailwind CSS
- Gemini API: new `@google/genai` package recommended by Google (the route uses HTTP REST for Edge compatibility)
- Fal.ai: minimal REST wrapper for `fal-ai/nano-banana/edit`
- ElevenLabs: REST `Create speech` endpoint using `model_id: eleven_multilingual_v2`

## Notes

- Comic montage uses `sharp` and therefore runs in the Node runtime.
- Other routes prefer Edge runtime.
- The UI is shadcn-styled using Tailwind (no Radix dependency in this scaffold to keep it portable in the CLI environment).

## Screens

- Home: Gallery grid with provider/narrated badges.
- Playground: Tabs (Edit / Blend / Comic) + BYOK drawer.
- Privacy / Cookies / About.

