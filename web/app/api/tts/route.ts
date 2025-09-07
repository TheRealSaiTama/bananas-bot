import { NextRequest } from 'next/server'
import { tts } from '@/lib/elevenlabs'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { text: string; voiceId?: string }
    const key = req.headers.get('x-elevenlabs-key') || ''
    const voice = body.voiceId || '21m00Tcm4TlvDq8ikWAM'
    const mp3 = await tts(body.text, voice, key)
    return new Response(mp3, { headers: { 'Content-Type': 'audio/mpeg' } })
  } catch (err: any) {
    return new Response('TTS failed', { status: 500 })
  }
}

