import { NextRequest } from 'next/server'
import { downloadToBuffer, fileToBuffer, isSupportedMime } from '@/lib/images'
import * as Gemini from '@/lib/gemini'
import * as Fal from '@/lib/fal'

export const runtime = 'nodejs'

type EditJson = { imageUrl?: string; instruction: string; provider?: 'fal' | 'gemini'; variants?: number }

export async function POST(req: NextRequest) {
  try {
    const ct = req.headers.get('content-type') || ''
    const gemKey = req.headers.get('x-gemini-key') || ''
    const falKey = req.headers.get('x-fal-key') || ''

    let instruction = ''
    let provider: 'fal' | 'gemini' = 'gemini'
    let variants = 1
    let bytes: Uint8Array
    let mime: string

    if (ct.includes('multipart/form-data')) {
      const form = await req.formData()
      instruction = String(form.get('instruction') || '')
      provider = (String(form.get('provider') || 'gemini') === 'fal') ? 'fal' : 'gemini'
      variants = Math.max(1, Math.min(Number(form.get('variants') || 1), 3))
      const file = form.get('imageFile') as File | null
      if (!file) return new Response(JSON.stringify({ error: 'imageFile is required' }), { status: 400 })
      const fb = await fileToBuffer(file)
      bytes = fb.bytes; mime = fb.mime
    } else {
      const body = await req.json() as EditJson
      instruction = body.instruction
      provider = body.provider === 'fal' ? 'fal' : 'gemini'
      variants = Math.max(1, Math.min(body.variants || 1, 3))
      if (!body.imageUrl) return new Response(JSON.stringify({ error: 'imageUrl is required' }), { status: 400 })
      const dl = await downloadToBuffer(body.imageUrl)
      if (!isSupportedMime(dl.mime)) throw new Error('Unsupported image type')
      bytes = dl.bytes; mime = dl.mime
    }

    // Validate required provider keys early to avoid opaque 500s
    if (provider === 'gemini' && !gemKey) {
      return new Response(JSON.stringify({ error: 'Missing Gemini API key. Set header x-gemini-key or add it via BYOK.' }), { status: 400 })
    }
    if (provider === 'fal' && !falKey) {
      return new Response(JSON.stringify({ error: 'Missing Fal.ai API key. Set header x-fal-key or add it via BYOK.' }), { status: 400 })
    }

    const prompt = ensureDirective(instruction)
    const outs: Uint8Array[] = []
    for (let i = 0; i < variants; i++) {
      if (provider === 'fal') outs.push(await Fal.edit(bytes, mime, prompt, falKey))
      else outs.push(await Gemini.edit(bytes, mime, prompt, gemKey))
    }
    const images = outs.map(b => `data:image/png;base64,${bytesToB64(b)}`)
    return Response.json({ images, provider })
  } catch (_err: any) {
    // Log underlying error for server-side debugging; return message when safe
    const raw = _err?.message || String(_err)
    console.error('Edit API error:', raw)
    const msg = typeof raw === 'string' ? raw : 'Edit failed'
    // Classify some known user errors as 400s for better UX
    const isUserError = /missing|unsupported|too large|invalid/i.test(msg)
    // Network to upstream
    const isNet = /fetch failed|ENOTFOUND|ECONN|EAI_AGAIN|ETIMEDOUT/i.test(msg)
    const status = isUserError ? 400 : (isNet ? 502 : 500)
    const friendly = isNet ? 'Upstream fetch failed (Gemini/Fal). Check local network/proxy/SSL.' : msg
    return new Response(JSON.stringify({ error: friendly }), { status })
  }
}

function ensureDirective(s: string) {
  const add = ' Output only a PNG image; no text in the response; keep resolution similar to input.'
  return s.includes('Output only a PNG image') ? s : (s.trim() + add)
}

function bytesToB64(bytes: Uint8Array) {
  if (typeof (globalThis as any).Buffer !== 'undefined') return (globalThis as any).Buffer.from(bytes).toString('base64')
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}
