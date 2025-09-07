import { NextRequest } from 'next/server'
import { downloadToBuffer, fileToBuffer, isSupportedMime } from '@/lib/images'
import * as Gemini from '@/lib/gemini'
import * as Fal from '@/lib/fal'

export const runtime = 'nodejs'

type TryOnJson = { baseUrl?: string; itemUrl?: string; category: string; notes?: string; provider?: 'fal' | 'gemini' }

export async function POST(req: NextRequest) {
  try {
    const ct = req.headers.get('content-type') || ''
    const gemKey = req.headers.get('x-gemini-key') || ''
    const falKey = req.headers.get('x-fal-key') || ''

    let provider: 'fal' | 'gemini' = 'gemini'
    let category = 'sunglasses'
    let notes = ''
    let baseBytes: Uint8Array; let baseMime: string
    let itemBytes: Uint8Array; let itemMime: string

    if (ct.includes('multipart/form-data')) {
      const form = await req.formData()
      category = String(form.get('category') || 'sunglasses')
      notes = String(form.get('notes') || '')
      provider = (String(form.get('provider') || 'gemini') === 'fal') ? 'fal' : 'gemini'
      const baseFile = form.get('baseFile') as File | null
      const itemFile = form.get('itemFile') as File | null
      if (!baseFile || !itemFile) return bad('Files missing')
      const b = await fileToBuffer(baseFile); baseBytes = b.bytes; baseMime = b.mime
      const i = await fileToBuffer(itemFile); itemBytes = i.bytes; itemMime = i.mime
    } else {
      const body = await req.json() as TryOnJson
      category = body.category || 'sunglasses'
      notes = body.notes || ''
      provider = body.provider === 'fal' ? 'fal' : 'gemini'
      if (!body.baseUrl || !body.itemUrl) return bad('URLs missing')
      const b = await downloadToBuffer(body.baseUrl); if (!isSupportedMime(b.mime)) return bad('Unsupported base type')
      const i = await downloadToBuffer(body.itemUrl); if (!isSupportedMime(i.mime)) return bad('Unsupported item type')
      baseBytes = b.bytes; baseMime = b.mime
      itemBytes = i.bytes; itemMime = i.mime
    }

    // Validate keys
    if (provider === 'gemini' && !gemKey) return bad('Missing Gemini API key. Add it via BYOK.')
    if (provider === 'fal' && !falKey) return bad('Missing Fal.ai API key. Add it via BYOK.')

    // For Nano Banana, better results are observed when the ITEM is sent first
    // and the PERSON second. The prompt reflects this ordering.
    const instruction = makeTryOnPrompt(category, notes, true)
    let out: Uint8Array
    if (provider === 'fal') {
      // Fal's edit endpoint is single-image; approximate by instructing edit on base.
      out = await Fal.edit(baseBytes, baseMime, instruction, falKey)
    } else {
      // Pass ITEM as first image, PERSON as second image.
      out = await Gemini.blend(itemBytes, itemMime, baseBytes, baseMime, instruction, gemKey)
    }

    return Response.json({ image: `data:image/png;base64,${bytesToB64(out)}`, provider })
  } catch (err: any) {
    const msg = err?.message || 'Try-On failed'
    return new Response(JSON.stringify({ error: msg }), { status: 500 })
  }
}

function makeTryOnPrompt(category: string, notes: string, itemFirst = true) {
  // Tailored “try on” instruction; clarify image roles explicitly.
  const anchor = anchorFor(category)
  const extra = notes ? ` ${notes}.` : ''
  if (itemFirst) {
    return `There are TWO images. The FIRST image is ${labelFor(category)} to be worn. The SECOND image is the person. Remove any background around the item, place the FIRST image on the SECOND image aligned to the ${anchor}, match perspective and lighting, size realistically, and add a soft contact shadow. Preserve the person's identity and keep all other details unchanged.${extra} Output only a PNG image; no text.`
  }
  return `Place the second image as ${labelFor(category)} on the person. Remove any background around the item, align to the ${anchor}, match perspective and lighting, size realistically, and cast a soft contact shadow. Preserve identity and keep all other details unchanged.${extra} Output only a PNG image; no text.`
}

function anchorFor(category: string) {
  switch ((category||'').toLowerCase()) {
    case 'sunglasses':
    case 'glasses': return 'eyes'
    case 'necklace': return 'neck'
    case 'hat': return 'top of the head'
    case 'earrings': return 'ears'
    case 'watch':
    case 'bracelet': return 'wrist'
    case 'ring': return 'ring finger'
    case 'shirt':
    case 'tshirt':
    case 'jacket': return 'upper torso'
    case 'shoes': return 'feet'
    default: return 'appropriate body area'
  }
}

function labelFor(category: string) {
  const c = (category || '').toLowerCase()
  return ['a','e','i','o','u'].includes(c[0]) ? `an ${c}` : `a ${c}`
}

function bytesToB64(bytes: Uint8Array) {
  if (typeof (globalThis as any).Buffer !== 'undefined') return (globalThis as any).Buffer.from(bytes).toString('base64')
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function bad(msg: string) {
  return new Response(JSON.stringify({ error: msg }), { status: 400 })
}
