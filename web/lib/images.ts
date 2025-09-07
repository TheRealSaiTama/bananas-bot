export async function downloadToBuffer(url: string, maxBytes = 6 * 1024 * 1024) {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`)
  const contentType = res.headers.get('content-type') || ''
  const ab = await res.arrayBuffer()
  if (ab.byteLength > maxBytes) throw new Error(`Image too large: ${ab.byteLength} bytes`)
  const bytes = new Uint8Array(ab)
  const mime = guessMime(url, contentType)
  return { bytes, mime }
}

export function guessMime(url: string, headerType: string): string {
  const t = headerType.split(';')[0].trim().toLowerCase()
  if (t.startsWith('image/')) return t
  if (url.toLowerCase().endsWith('.png')) return 'image/png'
  if (url.toLowerCase().endsWith('.jpg') || url.toLowerCase().endsWith('.jpeg')) return 'image/jpeg'
  return 'application/octet-stream'
}

export function toBase64(bytes: Uint8Array) {
  if (typeof (globalThis as any).Buffer !== 'undefined') {
    // Node or environments with Buffer
    return (globalThis as any).Buffer.from(bytes).toString('base64')
  }
  // Browser-compatible base64 from Uint8Array
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.slice(i, i + chunk)) as any)
  }
  return btoa(binary)
}

export async function fileToBuffer(file: File, maxBytes = 6 * 1024 * 1024) {
  const ab = await file.arrayBuffer()
  if (ab.byteLength > maxBytes) throw new Error(`Image too large: ${ab.byteLength} bytes`)
  const bytes = new Uint8Array(ab)
  const mime = file.type || guessMime(file.name, '')
  if (!isSupportedMime(mime)) throw new Error('Unsupported image type')
  return { bytes, mime }
}

export function isSupportedMime(mime: string) {
  const t = mime.toLowerCase()
  return t === 'image/png' || t === 'image/jpeg'
}
