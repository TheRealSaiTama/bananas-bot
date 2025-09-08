import { NextRequest } from 'next/server'
import { downloadToBuffer, fileToBuffer, isSupportedMime } from '@/lib/images'
import * as Gemini from '@/lib/gemini'
import * as Fal from '@/lib/fal'

export const runtime = 'nodejs'

type BlendJson = { baseUrl?: string; refUrl?: string; instruction: string; provider?: 'fal' | 'gemini'; variants?: number }

export async function POST(req: NextRequest) {
  try {
    const ct = req.headers.get('content-type') || ''
    const gemKey = req.headers.get('x-gemini-key') || ''
    const falKey = req.headers.get('x-fal-key') || ''

    let provider: 'fal' | 'gemini' = 'gemini'
    let instruction = ''
    let baseBytes: Uint8Array
    let baseMime: string
    let refBytes: Uint8Array
    let refMime: string
    let variants = 1

    if (ct.includes('multipart/form-data')) {
      const form = await req.formData()
      instruction = String(form.get('instruction') || '')
      provider = (String(form.get('provider') || 'gemini') === 'fal') ? 'fal' : 'gemini'
      const baseFile = form.get('baseFile') as File | null
      const refFile = form.get('refFile') as File | null
      if (!baseFile || !refFile) throw new Error('Files missing')
      variants = Math.max(1, Math.min(Number(form.get('variants') || 1), 3))
      const b = await fileToBuffer(baseFile); baseBytes = b.bytes; baseMime = b.mime
      const r = await fileToBuffer(refFile); refBytes = r.bytes; refMime = r.mime
    } else {
      const body = await req.json() as BlendJson
      instruction = body.instruction
      provider = body.provider === 'fal' ? 'fal' : 'gemini'
      variants = Math.max(1, Math.min(body.variants || 1, 3))
      if (!body.baseUrl || !body.refUrl) throw new Error('URLs missing')
      const b = await downloadToBuffer(body.baseUrl); if (!isSupportedMime(b.mime)) throw new Error('Unsupported base type')
      const r = await downloadToBuffer(body.refUrl); if (!isSupportedMime(r.mime)) throw new Error('Unsupported ref type')
      baseBytes = b.bytes; baseMime = b.mime
      refBytes = r.bytes; refMime = r.mime
    }

    const prompt = ensureBlendPrompt(instruction)
    const outs: Uint8Array[] = []
    for (let i = 0; i < variants; i++) {
      if (provider === 'fal') outs.push(await Fal.edit(baseBytes, baseMime, prompt, falKey))
      else outs.push(await Gemini.blend(baseBytes, baseMime, refBytes, refMime, prompt, gemKey))
    }
    const images = outs.map(u8 => `data:image/png;base64,${bytesToB64(u8)}`)
    return Response.json({ images, provider })
  } catch (_err: any) {
    return new Response(JSON.stringify({ error: 'Blend failed' }), { status: 500 })
  }
}

function ensureBlendPrompt(instruction: string) {
  const p = `Transform the base image according to this instruction: ${instruction}. Use the second image as a style/texture/object reference to blend or fuse realistically. Match lighting/perspective; add a soft contact shadow. Output only a PNG image; no text.`
  return p
}

function bytesToB64(bytes: Uint8Array) {
  if (typeof (globalThis as any).Buffer !== 'undefined') return (globalThis as any).Buffer.from(bytes).toString('base64')
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}
