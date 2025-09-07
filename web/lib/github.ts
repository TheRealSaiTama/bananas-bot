export type GalleryItem = {
  pngUrl: string
  mp3Url?: string
  meta?: any
}

const GITHUB_API = 'https://api.github.com'

export async function listGallery(repoFull = process.env.NEXT_PUBLIC_GALLERY_REPO || 'therealsaitama/kiskax-images', branch = process.env.GALLERY_BRANCH || 'main'): Promise<GalleryItem[]> {
  const [owner, repo] = repoFull.split('/')
  const url = `${GITHUB_API}/repos/${owner}/${repo}/contents?ref=${encodeURIComponent(branch)}`
  const res = await fetch(url, { headers: { 'Accept': 'application/vnd.github+json' } })
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)
  const items = await res.json() as Array<{ name: string; download_url: string; type: string }>

  const pngs = items.filter(i => i.type === 'file' && i.name.toLowerCase().endsWith('.png'))
  const mp3s = new Map(items.filter(i => i.type === 'file' && i.name.toLowerCase().endsWith('.mp3')).map(m => [stripExt(m.name), m.download_url]))
  const metas = new Map(items.filter(i => i.type === 'file' && i.name.toLowerCase().endsWith('.meta.json')).map(m => [stripMeta(m.name), m.download_url]))

  const out: GalleryItem[] = []
  for (const p of pngs) {
    const base = stripExt(p.name)
    const mp3Url = mp3s.get(base)
    let meta: any = undefined
    const metaUrl = metas.get(base)
    if (metaUrl) {
      try {
        const mr = await fetch(metaUrl); if (mr.ok) meta = await mr.json()
      } catch {}
    }
    out.push({ pngUrl: p.download_url, mp3Url, meta })
  }

  // Sort descending by timestamp embedded in filename if present; fallback lexicographical
  out.sort((a, b) => (extractTs(b.pngUrl) - extractTs(a.pngUrl)) || (b.pngUrl.localeCompare(a.pngUrl)))
  return out
}

function stripExt(name: string) { const i = name.lastIndexOf('.'); return i >= 0 ? name.slice(0, i) : name }
function stripMeta(name: string) { return name.endsWith('.meta.json') ? name.slice(0, -('.meta.json'.length)) : name }
function extractTs(s: string) {
  const m = s.match(/(\d{8}[_-]?\d{6})/)
  if (!m) return 0
  const t = m[1].replace(/[_-]/g, '')
  // yyyymmddhhmmss
  const yy = Number(t.slice(0,4)); const mm = Number(t.slice(4,6)); const dd = Number(t.slice(6,8));
  const HH = Number(t.slice(8,10) || '0'); const MM = Number(t.slice(10,12) || '0'); const SS = Number(t.slice(12,14) || '0')
  return Date.UTC(yy, mm-1, dd, HH, MM, SS)
}

