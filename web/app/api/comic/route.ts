import { NextRequest } from 'next/server'
import { downloadToBuffer, fileToBuffer, isSupportedMime } from '@/lib/images'
import * as Gemini from '@/lib/gemini'

// Edge compatible: do not use sharp here. Montage will be generated client-side.
export const runtime = 'edge'

type ComicJson = { personaUrl?: string; style: string; panels: string[]; provider?: 'fal' | 'gemini' }

export async function POST(req: NextRequest) {
  try {
    const ct = req.headers.get('content-type') || ''
    const gemKey = req.headers.get('x-gemini-key') || ''
    let style = ''
    let panels: string[] = []
    let personaBytes: Uint8Array
    let personaMime: string

    if (ct.includes('multipart/form-data')) {
      const form = await req.formData()
      style = String(form.get('style') || '')
      panels = JSON.parse(String(form.get('panels') || '[]'))
      const file = form.get('personaFile') as File | null
      if (!file) throw new Error('personaFile missing')
      const fb = await fileToBuffer(file)
      personaBytes = fb.bytes; personaMime = fb.mime
    } else {
      const body = await req.json() as ComicJson
      style = body.style
      panels = body.panels
      if (!Array.isArray(panels) || panels.length !== 4) return new Response(JSON.stringify({ error: 'panels must have 4 items' }), { status: 400 })
      if (!body.personaUrl) throw new Error('personaUrl missing')
      const dl = await downloadToBuffer(body.personaUrl)
      if (!isSupportedMime(dl.mime)) throw new Error('Unsupported image type')
      personaBytes = dl.bytes; personaMime = dl.mime
    }
    const panelPngs = await Gemini.comic(personaBytes, personaMime, style, panels, gemKey)
    const toB64 = (u8: Uint8Array) => {
      if (typeof (globalThis as any).Buffer !== 'undefined') return (globalThis as any).Buffer.from(u8).toString('base64')
      let binary = ''
      for (let i = 0; i < u8.length; i++) binary += String.fromCharCode(u8[i])
      // @ts-ignore
      return btoa(binary)
    }
    return Response.json({
      montagePng: '', // client will compose a montage from panels
      panels: panelPngs.map(p => `data:image/png;base64,${toB64(p)}`),
      provider: 'gemini'
    })
  } catch (_err: any) {
    const msg = _err?.message || String(_err)
    console.error('Comic API error:', msg)
    return new Response(JSON.stringify({ error: msg }), { status: 500 })
  }
}
