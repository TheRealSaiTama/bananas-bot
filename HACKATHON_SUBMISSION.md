# Bananas — Reddit Image Alchemist

Turn any Reddit image into anything you can imagine by mentioning `@bananas` (or `u/bananas`) with a plain‑English instruction. The bot fetches the post image, applies your instruction using Gemini 2.5 Flash Image, then replies with a fresh PNG. A companion Next.js web playground showcases Edit/Blend/Comic modes with BYOK (bring‑your‑own‑key).

## Demo

- Reddit: Comment under any image post (e.g., on r/test) with:
  - `@bananas make it vaporwave`
  - `u/bananas remove the background`
- Web playground: `web/` subfolder (Next.js). Try Edit / Blend / Comic with your own keys via the BYOK drawer.

## Problem

Creative image editing on social platforms is powerful but fragmented: tools are off‑platform, sharing is inconvenient, and hosting is ephemeral. Running 24/7 bots is costly and tricky to scale responsibly.

## Solution

- On‑Reddit UX: invoke edits with a simple mention + instruction.
- Fast, reliable edits using Gemini 2.5 Flash Image.
- Durable hosting via GitHub Contents API (or pluggable storage provider).
- Guardrails: per‑user cooldowns, global caps, allowlist support, and content checks.
- Serverless‑ready: designed for polling/scheduled workers (no always‑on server required).

## Key Features

- Natural‑language edits (e.g., watercolor, vaporwave, background removal).
- Reply with PNG + optional MP3 narration (TTS).
- GitHub‑backed gallery for permanence (web UI lists images via API).
- BYOK playground (Gemini, Fal.ai optional, ElevenLabs optional) — keys remain client‑side.

## Architecture

- Bot (Python):
  - Reddit API via PRAW
  - Calls Gemini 2.5 Flash Image for edits
  - Uploads to GitHub Contents API
  - Replies on Reddit with the hosted image URL
- Web (Next.js + Tailwind):
  - Gallery from GitHub repo
  - API routes for Edit/Blend/Comic/TTS (BYOK headers)

## Setup

1) Bot
   - Copy `.env.example` → `.env` and fill in Reddit + Gemini + GitHub vars.
   - `python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`
   - `python main.py`

2) Web
   - `cd web && npm install`
   - Copy `.env.example` → `.env.local` and set `NEXT_PUBLIC_GALLERY_REPO`, `GALLERY_BRANCH`.
   - `npm run dev` (or `npm run build && npm run start`).

## Safety & Ethics

- Rate limits, cooldowns, and optional allowlists.
- Size bounds and content checks on downloads.
- Watermark transparency: Gemini outputs include SynthID.

## What’s Next

- Cloud Run/Functions + Scheduler polling mode
- Firestore for cooldowns/checkpoints
- Metrics dashboard + key health monitoring
- Pluggable storage (GCS, R2, S3)

## Team

- TheRealSaiTama — builder, UX, integrations

## License

MIT (see `LICENSE`).

