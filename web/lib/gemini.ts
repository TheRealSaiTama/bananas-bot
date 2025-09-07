// Gemini 2.5 Flash Image wrappers
// Uses HTTP REST; compatible with Edge runtime.
import { toBase64 } from '@/lib/images'

// Allow overriding the model via env. Default to the preview image model.
// Some keys may not have access to this preview; the code below will fallback
// if the API rejects response_mime_type.
const MODEL_ID = (process.env.GEMINI_IMAGE_MODEL || process.env.NEXT_PUBLIC_GEMINI_IMAGE_MODEL || 'models/gemini-2.5-flash-image-preview') as string

type GenResp = {
  candidates?: Array<{
    content?: { parts?: Array<any> }
  }>
}

function apiUrl(key: string) {
  return `https://generativelanguage.googleapis.com/v1beta/${MODEL_ID}:generateContent?key=${encodeURIComponent(key)}`
}

function instructionGuard(text: string) {
  const suffix = ' Output only a PNG image; no text in the response; keep resolution similar to input.'
  return text.includes('Output only a PNG image') ? text : (text.trim().replace(/\s+$/,'') + suffix)
}

export async function edit(imageBytes: Uint8Array, mime: string, instruction: string, apiKey: string): Promise<Uint8Array> {
  const body = {
    contents: [
      { role: 'user', parts: [ { text: instructionGuard(instruction) }, { inline_data: { mime_type: mime, data: toBase64(imageBytes) } } ] }
    ],
    generationConfig: { response_mime_type: 'image/png' }
  }
  return generateImage(apiKey, body)
}

export async function blend(baseBytes: Uint8Array, baseMime: string, refBytes: Uint8Array, refMime: string, instruction: string, apiKey: string): Promise<Uint8Array> {
  const body = {
    contents: [
      { role: 'user', parts: [
        { text: instructionGuard(instruction) },
        { inline_data: { mime_type: baseMime, data: toBase64(baseBytes) } },
        { inline_data: { mime_type: refMime,  data: toBase64(refBytes) } }
      ]}
    ],
    generationConfig: { response_mime_type: 'image/png' }
  }
  return generateImage(apiKey, body)
}

export async function comic(personaBytes: Uint8Array, personaMime: string, style: string, panels: string[], apiKey: string): Promise<Uint8Array[]> {
  const mkBody = (p: string) => ({
    contents: [
      { role: 'user', parts: [
        { text: `Using the SAME PERSON as the reference, generate a comic panel in ${style} where they: ${p}. Keep face shape, eyes, hair, and skin consistent. Output only a PNG image; no text.` },
        { inline_data: { mime_type: personaMime, data: toBase64(personaBytes) } },
      ]}
    ],
    generationConfig: { response_mime_type: 'image/png' }
  })
  const promises = panels.map(text => generateImage(apiKey, mkBody(text)))
  const outs = await Promise.all(promises)
  return outs
}

async function generateImage(apiKey: string, jsonBody: any): Promise<Uint8Array> {
  if (!apiKey) throw new Error('Missing Gemini API key')
  let res = await fetch(apiUrl(apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(jsonBody)
  })
  if (!res.ok) {
    const msg = await safeText(res)
    const isMimeRejection = res.status === 400 && /allowed mimetypes/i.test(msg)
    if (isMimeRejection) {
      // Retry without response_mime_type when the API disallows it for this key.
      const bodyNoMime = { ...jsonBody }
      try { delete (bodyNoMime as any).generationConfig } catch {}
      res = await fetch(apiUrl(apiKey), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyNoMime)
      })
    } else {
      throw new Error(`Gemini error ${res.status}: ${truncate(msg, 400)}`)
    }
  }
  const data = await res.json() as GenResp
  // Prefer binary inline data; handle both snake_case and camelCase just in case
  const parts = data.candidates?.[0]?.content?.parts as any[] | undefined
  const firstInline = parts?.find((p: any) => p.inline_data || p.inlineData)
  const bin = firstInline?.inline_data?.data || firstInline?.inlineData?.data
  if (bin) return base64ToBytes(bin as string)
  // Fallback: some models return base64 string inside a text part; try to extract
  const textPart = data.candidates?.[0]?.content?.parts?.find((p: any) => typeof p.text === 'string')?.text as string | undefined
  if (textPart) {
    const b64 = extractBase64Image(textPart)
    if (b64) return base64ToBytes(b64)
  }
  throw new Error('No image in response')
}

function extractBase64Image(text: string): string | null {
  // Look for data URLs or long base64 blocks that look like PNG/JPEG
  const m1 = text.match(/data:image\/(png|jpeg|jpg);base64,([A-Za-z0-9+/=]+)/)
  if (m1 && m1[2]) return m1[2]
  // Heuristic: find a base64 block starting with PNG header iVBORw0KGgo
  const m2 = text.match(/(iVBORw0KGgo[\w+/=]{100,})/)
  if (m2 && m2[1]) return m2[1]
  return null
}

function base64ToBytes(b64: string): Uint8Array {
  if (typeof (globalThis as any).Buffer !== 'undefined') {
    const buf = (globalThis as any).Buffer.from(b64, 'base64')
    return new Uint8Array(buf)
  }
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

async function safeText(res: Response) {
  try { return await res.text() } catch { return '' }
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + '…' : s
}
